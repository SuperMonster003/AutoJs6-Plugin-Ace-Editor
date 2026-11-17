package io.github.supermonster003.autojs6.plugin.ace.editor.core.font

import okhttp3.Call
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import org.autojs.plugin.downloadkit.DownloadFailure
import org.autojs.plugin.downloadkit.DownloadFailureKind
import org.autojs.plugin.downloadkit.DownloadFetcher
import org.autojs.plugin.downloadkit.DownloadListener
import org.autojs.plugin.downloadkit.DownloadOutcome
import org.autojs.plugin.downloadkit.DownloadRequest
import org.autojs.plugin.downloadkit.DownloadStore
import java.io.Closeable
import java.io.File
import java.io.FileOutputStream
import java.io.IOException
import java.io.InputStream
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.CancellationException
import java.util.concurrent.CompletableFuture
import java.util.concurrent.Executor
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors
import java.util.concurrent.RejectedExecutionException
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.atomic.AtomicLong

interface FontDownloadConnection : Closeable {
    val contentLength: Long
    val inputStream: InputStream
    fun cancel()

    /**
     * The HTTP status of the response; a connection that only gives a whole body keeps 200 (plugin-center P12).
     * zh-CN: 应答的 HTTP 状态码; 只给出完整正文的连接保持 200 (plugin-center P12).
     */
    val responseCode: Int get() = HttpURLConnection.HTTP_OK

    /** A response header ([name] in any case), null when absent. zh-CN: 应答头 ([name] 不区分大小写), 没有时为 null. */
    fun header(name: String): String? = null

    /** The URL that answered, after redirects; null when unknown. zh-CN: 重定向之后实际应答的 URL; 未知时为 null. */
    val finalUrl: String? get() = null
}

fun interface FontDownloadSource {
    @Throws(IOException::class)
    fun open(url: String): FontDownloadConnection

    /**
     * Opens [url] with request [headers] (`Range`, `If-Range`, `Accept-Encoding`, ...) for the shared download kit
     * (plugin-center P12, T24). A source that cannot send them keeps this default: the kit then sees whole 200 responses
     * only and starts every attempt over.
     * zh-CN: 带请求头 [headers] (`Range`, `If-Range`, `Accept-Encoding` 等) 打开 [url], 供共用下载库使用 (plugin-center P12, T24).
     * 无法发送请求头的来源保留此默认实现: 共用库只会看到完整的 200 应答, 每次尝试都从头开始.
     */
    @Throws(IOException::class)
    fun open(url: String, headers: Map<String, String>): FontDownloadConnection = open(url)
}

class OkHttpFontDownloadSource(
    private val client: OkHttpClient = OkHttpClient(),
) : FontDownloadSource {
    override fun open(url: String): FontDownloadConnection = open(url, emptyMap())

    override fun open(url: String, headers: Map<String, String>): FontDownloadConnection {
        val request = Request.Builder().url(url).get().apply {
            headers.forEach { (name, value) -> header(name, value) }
        }.build()
        return OkHttpConnection(client.newCall(request), url)
    }

    private class OkHttpConnection(
        private val call: Call,
        private val url: String,
    ) : FontDownloadConnection {
        private val lock = Any()

        @Volatile
        private var response: Response? = null

        @Volatile
        private var stream: InputStream? = null

        override val contentLength: Long get() = response().body!!.contentLength()

        override val inputStream: InputStream
            get() = stream ?: synchronized(lock) {
                stream ?: response().let { received ->
                    // Only the body of a successful answer is read. zh-CN: 只读取成功应答的正文.
                    if (!received.isSuccessful) throw IOException("HTTP ${received.code} while downloading font from $url")
                    received.body!!.byteStream()
                }.also { stream = it }
            }

        override val responseCode: Int get() = response().code

        override fun header(name: String): String? = response().header(name)

        override val finalUrl: String get() = response().request.url.toString()

        override fun cancel() {
            call.cancel()
            runCatching { response?.close() }
        }

        override fun close() {
            response?.close() ?: call.cancel()
        }

        private fun response(): Response {
            response?.let { return it }
            return synchronized(lock) {
                response?.let { return@synchronized it }
                val received = try {
                    call.execute()
                } catch (e: Exception) {
                    call.cancel()
                    throw e
                }
                if (received.body == null) {
                    received.close()
                    throw IOException("Empty font response body from $url")
                }
                received.also { response = it }
            }
        }
    }
}

/**
 * The connections the shared download kit opens through a [FontDownloadSource] (plugin-center P12, T24); [open] is the
 * opener of a [DownloadFetcher]. [wanted] tells whether a live download still needs a URL; [cancel] cuts the connections
 * of the URLs no live download needs, so a cancelled download stops at once and leaves its `.part` for the next one.
 * zh-CN: 共用下载库经 [FontDownloadSource] 打开的连接 (plugin-center P12, T24); [open] 是 [DownloadFetcher] 的连接打开函数. [wanted] 判断是否仍有
 * 进行中的下载需要某个 URL; [cancel] 切断不再被任何下载需要的 URL 的连接, 让取消的下载立即停止, 并把 `.part` 留给下一次.
 */
internal class FontSourceConnections(
    private val source: FontDownloadSource,
    private val wanted: (url: String) -> Boolean,
) {
    private val live = LinkedHashSet<Connection>()

    fun open(url: URL): HttpURLConnection = Connection(url)

    /** Cuts the connections of [urls] that no live download wants. zh-CN: 切断 [urls] 中不再被任何下载需要的连接. */
    fun cancel(urls: Collection<String>) {
        val candidates = synchronized(live) { live.filter { it.requested in urls } }
        candidates.filterNot { wanted(it.requested) }.forEach(Connection::cut)
    }

    private inner class Connection(url: URL) : HttpURLConnection(url) {
        val requested: String = url.toString()

        @Volatile
        private var opened: FontDownloadConnection? = null

        @Volatile
        private var cutRequested = false

        override fun connect() {
            if (connected) return
            val headers = LinkedHashMap<String, String>()
            requestProperties.forEach { (name, values) -> if (name != null) headers[name] = values.joinToString(",") }
            opened = source.open(requested, headers)
            connected = true
            synchronized(live) { live += this }
            // A download cancelled while this connection was being opened. zh-CN: 打开连接期间被取消的下载.
            if (cutRequested || !wanted(requested)) cut()
        }

        fun cut() {
            cutRequested = true
            runCatching { opened?.cancel() }
        }

        private fun opened(): FontDownloadConnection {
            connect()
            return opened ?: throw IOException("Font download connection is closed")
        }

        override fun getResponseCode(): Int = opened().responseCode

        override fun getResponseMessage(): String? = null

        override fun getHeaderField(name: String?): String? = name?.let { opened?.header(it) }

        override fun getHeaderField(n: Int): String? = null

        override fun getHeaderFieldKey(n: Int): String? = null

        override fun getContentLengthLong(): Long = runCatching { opened?.contentLength }.getOrNull() ?: -1L

        override fun getContentLength(): Int = contentLengthLong.let { if (it > Int.MAX_VALUE) -1 else it.toInt() }

        override fun getInputStream(): InputStream = opened().inputStream

        override fun getURL(): URL = opened?.finalUrl?.let { runCatching { URL(it) }.getOrNull() } ?: super.getURL()

        override fun usingProxy(): Boolean = false

        override fun disconnect() {
            synchronized(live) { live -= this }
            runCatching { opened?.close() }
        }
    }

    companion object {

        /**
         * Hands the verified [source] of the download store over to [target], the empty staging file of a model or font store:
         * a rename on the same file system, a copy otherwise.
         * zh-CN: 把下载仓库中已校验的 [source] 交给 [target] (模型或字体仓库的空暂存文件): 同一文件系统上改名, 否则复制.
         */
        @Throws(IOException::class)
        fun moveInto(source: File, target: File) {
            if (target.exists() && !target.delete()) throw IOException("Unable to replace the staging file ${target.name}")
            if (source.renameTo(target)) return
            source.inputStream().use { input ->
                FileOutputStream(target).use { output ->
                    input.copyTo(output)
                    output.flush()
                    output.fd.sync()
                }
            }
        }

    }
}

sealed class FontDownloadEvent {
    data object Queued : FontDownloadEvent()
    data class Progress(val bytesDownloaded: Long, val totalBytes: Long) : FontDownloadEvent()
    data class Success(val installed: InstalledFont) : FontDownloadEvent()
    data class Failure(val error: Throwable) : FontDownloadEvent()
    data object Cancelled : FontDownloadEvent()
}

fun interface FontDownloadListener {
    fun onEvent(event: FontDownloadEvent)
}

/** Re-checks that an artifact is still present and authorized immediately before durable commit. */
fun interface FontDownloadCommitValidator {
    @Throws(Exception::class)
    fun validate(font: RemoteFont)
}

class FontDownloadSubscription internal constructor(
    val future: CompletableFuture<InstalledFont>,
    private val cancelAction: () -> Boolean,
) {
    fun cancel(): Boolean = cancelAction()
    val isCancelled: Boolean get() = future.isCancelled
}

open class FontDownloadException(message: String, cause: Throwable? = null) : Exception(message, cause)

class RevokedFontException(fontId: String) : FontDownloadException("Font '$fontId' is revoked")

class ConcurrentFontVersionException(fontId: String) :
    FontDownloadException("Another version of font '$fontId' is already downloading")

class FontMirrorsExhaustedException(fontId: String, failures: List<Throwable>) :
    FontDownloadException("All download URLs failed for font '$fontId'", failures.lastOrNull()) {
    init {
        failures.dropLast(1).forEach(::addSuppressed)
    }
}

/**
 * Downloads WOFF2 files into [FontStore]. Requests for the same id and digest share one transfer; cancellation is per
 * transfer-retaining subscriber and cancels the network call only after the last such subscriber leaves. Non-retaining
 * observers can attach without changing task lifetime.
 *
 * The transfer is the shared download kit (plugin-center P12, T19, T24): the mirrors of the artifact are tried in order,
 * a cut transfer is retried (2 s, 5 s) and continued with `Range`, the next mirror continues the bytes already on disk, and
 * a cancelled download leaves them in [downloadDirectory] for the next request. The kit is only a staging area (T20): the
 * verified file is moved into a part file of [store] and installed through [FontStore.installVerifiedPart], which checks
 * size, SHA-256 and the WOFF2 header again; the entry of the kit is then removed.
 *
 * zh-CN: 把 WOFF2 文件下载进 [FontStore]. 同一 id 与摘要的请求共享一个传输; 取消按持有传输的订阅者计算, 最后一个这样的订阅者离开后才取消网络请求;
 * 不持有传输的观察者可以附加而不改变任务的生命周期. 传输由共用下载库完成 (plugin-center P12, T19, T24): 按顺序尝试产物的各个镜像, 中断的传输自动重试
 * (2 s, 5 s) 并以 `Range` 续传, 下一个镜像接着磁盘上已有的字节继续, 取消的下载把字节留在 [downloadDirectory] 供下次请求使用. 共用库只作暂存 (T20):
 * 校验通过的文件移入 [store] 的 part 文件, 经 [FontStore.installVerifiedPart] 再次检查大小, SHA-256 与 WOFF2 头后落库, 随后删除共用库中的条目.
 */
class FontDownloader(
    private val store: FontStore,
    private val source: FontDownloadSource = OkHttpFontDownloadSource(),
    private val workerExecutor: ExecutorService = defaultWorkerExecutor(),
    private val callbackExecutor: Executor = Executor(Runnable::run),
    private val commitValidator: FontDownloadCommitValidator = FontDownloadCommitValidator { },
    downloadDirectory: File = File(store.rootDirectory, DOWNLOADS_DIRECTORY_NAME),
    retryDelaysMillis: LongArray = DownloadFetcher.DEFAULT_RETRY_DELAYS_MILLIS,
    log: (String) -> Unit = {},
) : Closeable {
    private val lock = Any()
    private val nextSubscriberId = AtomicLong()
    private val activeByFontId = hashMapOf<String, SharedTask>()
    private val connections = FontSourceConnections(source, ::isWanted)

    /** One store and one fetcher per download directory (download-kit.md 4.5). zh-CN: 每个下载目录一个仓库与一个取包器. */
    internal val downloads = DownloadStore(downloadDirectory, DOWNLOAD_FILE_NAME, log = log, logName = "Ace font store")
    private val fetcher = DownloadFetcher(downloads, retryDelaysMillis, connections::open, log = log, logName = "Ace font")

    @Volatile
    private var closed = false

    init {
        // Bytes of cancelled or failed downloads expire with the default limits (`.part` after 3 days).
        // zh-CN: 取消或失败的下载留下的字节按默认期限过期 (`.part` 3 天).
        try {
            workerExecutor.execute { runCatching { downloads.cleanup() } }
        } catch (_: RejectedExecutionException) {
            // Cleaned up by the next downloader. zh-CN: 由下一个下载器清理.
        }
    }

    @JvmOverloads
    fun enqueue(font: RemoteFont, listener: FontDownloadListener? = null): FontDownloadSubscription {
        val future = ManagedFontFuture()
        val subscriber = Subscriber(
            id = nextSubscriberId.incrementAndGet(),
            future = future,
            listener = listener,
            retainsTransfer = true,
        )
        if (font.artifact.revoked) {
            val error = RevokedFontException(font.id)
            future.completeExceptionally(error)
            dispatch(subscriber, FontDownloadEvent.Failure(error))
            return FontDownloadSubscription(future) { false }
        }

        store.installationState(font).installed
            ?.takeIf { it.sha256 == font.artifact.sha256 }
            ?.let { installed ->
                future.complete(installed)
                dispatch(subscriber, FontDownloadEvent.Success(installed))
                return FontDownloadSubscription(future) { false }
            }

        val task: SharedTask
        var shouldStart = false
        synchronized(lock) {
            if (closed) {
                val error = FontDownloadException("Font downloader is closed")
                future.completeExceptionally(error)
                dispatch(subscriber, FontDownloadEvent.Failure(error))
                return FontDownloadSubscription(future) { false }
            }
            var active = activeByFontId[font.id]
            if (active?.cancelled == true && !active.committing) {
                if (activeByFontId[font.id] === active) activeByFontId.remove(font.id)
                active = null
            }
            if (active != null && active.font.artifact.sha256 != font.artifact.sha256) {
                val error = ConcurrentFontVersionException(font.id)
                future.completeExceptionally(error)
                dispatch(subscriber, FontDownloadEvent.Failure(error))
                return FontDownloadSubscription(future) { false }
            }
            task = active ?: SharedTask(font).also {
                activeByFontId[font.id] = it
                shouldStart = true
            }
            future.cancellationHandler = { cancelSubscriber(task, subscriber.id) }
            registerSubscriberLocked(task, subscriber, replayProgress = active != null)
        }
        if (shouldStart) {
            try {
                workerExecutor.execute { runTask(task) }
            } catch (e: RejectedExecutionException) {
                finishFailure(task, FontDownloadException("Font download worker rejected the task", e))
            }
        }
        return FontDownloadSubscription(future) { future.cancel(false) }
    }

    /**
     * Atomically attaches a non-retaining observer to an existing transfer.
     *
     * This method never creates a task. The observer receives [FontDownloadEvent.Queued] followed
     * by the latest [FontDownloadEvent.Progress], if any, before later task events. Cancelling the
     * returned subscription only detaches this observer and cannot stop the underlying transfer.
     */
    fun observeActive(
        fontId: String,
        listener: FontDownloadListener,
    ): FontDownloadSubscription? {
        val future = ManagedFontFuture()
        val subscriber = Subscriber(
            id = nextSubscriberId.incrementAndGet(),
            future = future,
            listener = listener,
            retainsTransfer = false,
        )
        val task = synchronized(lock) {
            val active = activeByFontId[fontId]
                ?.takeIf { !it.cancelled && it.hasRetainingSubscribers() }
                ?: return@synchronized null
            future.cancellationHandler = { cancelSubscriber(active, subscriber.id) }
            registerSubscriberLocked(active, subscriber, replayProgress = true)
            active
        } ?: return null
        return FontDownloadSubscription(future) { future.cancel(false) }
    }

    /** Atomically cancels every subscriber for [fontId], unless durable commit has begun. */
    fun cancel(fontId: String): Boolean {
        val subscribers: List<Subscriber>
        val task: SharedTask
        synchronized(lock) {
            task = activeByFontId[fontId] ?: return false
            if (task.committing) return false
            task.cancelled = true
            task.cancelFlag.set(true)
            subscribers = task.subscribers.values.toList()
            task.subscribers.clear()
            if (activeByFontId[fontId] === task) activeByFontId.remove(fontId)
        }
        connections.cancel(task.font.artifact.urls)
        subscribers.forEach { subscriber ->
            subscriber.future.cancelFromDownloader()
            dispatch(subscriber, FontDownloadEvent.Cancelled)
        }
        return true
    }

    fun isDownloading(fontId: String): Boolean = synchronized(lock) {
        activeByFontId[fontId]?.let { !it.cancelled && it.hasRetainingSubscribers() } == true
    }

    override fun close() {
        val subscribers = mutableListOf<Subscriber>()
        val cancelledUrls = mutableListOf<String>()
        synchronized(lock) {
            if (closed) return
            closed = true
            val cancellable = activeByFontId.values.filterNot { it.committing }
            cancellable.forEach { task ->
                task.cancelled = true
                task.cancelFlag.set(true)
                cancelledUrls += task.font.artifact.urls
                subscribers += task.subscribers.values
                task.subscribers.clear()
                if (activeByFontId[task.font.id] === task) activeByFontId.remove(task.font.id)
            }
        }
        connections.cancel(cancelledUrls)
        subscribers.forEach { subscriber ->
            subscriber.future.cancelFromDownloader()
            dispatch(subscriber, FontDownloadEvent.Cancelled)
        }
        // A task that crossed the commit gate must finish consistently and publish success/failure.
        workerExecutor.shutdown()
    }

    private fun runTask(task: SharedTask) {
        var partFile: File? = null
        try {
            checkNotCancelled(task)
            val ready = fetch(task)
            beginCommit(task)
            val part = store.createPartFile(task.font)
            partFile = part
            downloads.usingKey(ready.key) {
                try {
                    FontSourceConnections.moveInto(ready.file, part)
                } finally {
                    // The download store is only a staging area (T20). zh-CN: 下载仓库只作暂存 (T20).
                    downloads.remove(ready.key)
                }
            }
            val installed = store.withCatalogAuthorizationLock {
                commitValidator.validate(task.font)
                store.installVerifiedPart(task.font, part)
            }
            partFile = null
            finishSuccess(task, installed)
        } catch (_: CancellationException) {
            finishCancelled(task)
        } catch (e: Throwable) {
            // Failure completion must not race a retry or observer with the old partial payload.
            try {
                partFile?.let(store::discardPart)
                partFile = null
            } catch (cleanupError: Throwable) {
                e.addSuppressed(cleanupError)
            }
            finishFailure(task, e)
        } finally {
            partFile?.let(store::discardPart)
        }
    }

    /**
     * Fetches the artifact through the shared download kit: Ready, or a [CancellationException], or a
     * [FontMirrorsExhaustedException] listing the reason of every mirror.
     * zh-CN: 经共用下载库获取产物: 返回 Ready, 或抛出 [CancellationException], 或抛出列出每个镜像原因的 [FontMirrorsExhaustedException].
     */
    private fun fetch(task: SharedTask): DownloadOutcome.Ready {
        val artifact = task.font.artifact
        notify(task, FontDownloadEvent.Progress(0, artifact.sizeBytes))
        val request = DownloadRequest(artifact.urls, artifact.sha256, artifact.sizeBytes)
        val listener = object : DownloadListener {
            private var started = false

            override suspend fun onProgress(downloadedBytes: Long, totalBytes: Long) {
                // The first report is where the transfer starts, e.g. the bytes of a resumed part.
                // zh-CN: 第一次报告的是传输的起点, 例如续传的 part 已有的字节数.
                reportProgress(task, downloadedBytes, immediate = !started)
                started = true
            }
        }
        return when (val outcome = fetcher.fetchBlocking(request, task.cancelFlag, listener)) {
            is DownloadOutcome.Ready -> outcome.also { reportProgress(task, artifact.sizeBytes) }
            is DownloadOutcome.Failed -> throw FontMirrorsExhaustedException(task.font.id, mirrorFailures(outcome.failure))
            DownloadOutcome.Cancelled -> throw CancellationException()
        }
    }

    /**
     * Progress never goes back; it is reported in steps of 64 KiB, at the end, and [immediate]ly when asked.
     * zh-CN: 进度不回退; 每 64 KiB, 结束时, 以及 [immediate] 为真时报告.
     */
    private fun reportProgress(task: SharedTask, downloaded: Long, immediate: Boolean = false) {
        val size = task.font.artifact.sizeBytes
        val bytes = downloaded.coerceIn(0L, size)
        synchronized(lock) {
            val last = task.lastProgress?.bytesDownloaded ?: -1L
            if (bytes <= last) return
            if (!immediate && bytes < size && last >= 0 && bytes - last < PROGRESS_GRANULARITY_BYTES) return
        }
        notify(task, FontDownloadEvent.Progress(bytes, size))
    }

    private fun isWanted(url: String): Boolean = synchronized(lock) {
        activeByFontId.values.any { !it.cancelled && it.hasRetainingSubscribers() && url in it.font.artifact.urls }
    }

    private fun cancelSubscriber(task: SharedTask, subscriberId: Long): Boolean {
        val subscriber: Subscriber
        var cut = false
        synchronized(lock) {
            val current = task.subscribers[subscriberId] ?: return false
            if (task.committing && current.retainsTransfer) return false
            task.subscribers.remove(subscriberId)
            subscriber = current
            if (subscriber.retainsTransfer && !task.hasRetainingSubscribers()) {
                task.cancelled = true
                task.cancelFlag.set(true)
                cut = true
                if (activeByFontId[task.font.id] === task) activeByFontId.remove(task.font.id)
            }
        }
        if (cut) connections.cancel(task.font.artifact.urls)
        val cancelled = subscriber.future.cancelFromDownloader()
        dispatch(subscriber, FontDownloadEvent.Cancelled)
        return cancelled
    }

    private fun finishSuccess(task: SharedTask, installed: InstalledFont) {
        finish(task) { subscriber ->
            subscriber.future.complete(installed)
            dispatch(subscriber, FontDownloadEvent.Success(installed))
        }
    }

    private fun finishFailure(task: SharedTask, error: Throwable) {
        finish(task) { subscriber ->
            subscriber.future.completeExceptionally(error)
            dispatch(subscriber, FontDownloadEvent.Failure(error))
        }
    }

    private fun finishCancelled(task: SharedTask) {
        finish(task) { subscriber ->
            subscriber.future.cancelFromDownloader()
            dispatch(subscriber, FontDownloadEvent.Cancelled)
        }
    }

    private fun finish(task: SharedTask, action: (Subscriber) -> Unit) {
        val subscribers = synchronized(lock) {
            if (activeByFontId[task.font.id] === task) activeByFontId.remove(task.font.id)
            task.subscribers.values.toList().also { task.subscribers.clear() }
        }
        subscribers.forEach(action)
    }

    private fun notify(task: SharedTask, event: FontDownloadEvent) {
        val subscribers = synchronized(lock) {
            if (event is FontDownloadEvent.Progress) task.lastProgress = event
            task.subscribers.values.toList()
        }
        subscribers.forEach { dispatch(it, event) }
    }

    /** Must be called with [lock] held so replay cannot race ahead of Queued. */
    private fun registerSubscriberLocked(
        task: SharedTask,
        subscriber: Subscriber,
        replayProgress: Boolean,
    ) {
        task.subscribers[subscriber.id] = subscriber
        dispatch(subscriber, FontDownloadEvent.Queued)
        if (replayProgress && task.subscribers.containsKey(subscriber.id)) {
            task.lastProgress?.let { dispatch(subscriber, it) }
        }
    }

    private fun dispatch(subscriber: Subscriber, event: FontDownloadEvent) {
        val listener = subscriber.listener ?: return
        try {
            callbackExecutor.execute { runCatching { listener.onEvent(event) } }
        } catch (_: RejectedExecutionException) {
            // Download result remains available through the future.
        }
    }

    private fun checkNotCancelled(task: SharedTask) {
        if (isCancelled(task) || Thread.currentThread().isInterrupted) throw CancellationException()
    }

    private fun beginCommit(task: SharedTask) {
        synchronized(lock) {
            if (task.cancelled || !task.hasRetainingSubscribers() || Thread.currentThread().isInterrupted) {
                throw CancellationException()
            }
            task.committing = true
        }
    }

    private fun isCancelled(task: SharedTask): Boolean = synchronized(lock) {
        task.cancelled || !task.hasRetainingSubscribers()
    }

    private class SharedTask(val font: RemoteFont) {
        val subscribers = linkedMapOf<Long, Subscriber>()

        /** Leaves the transfer of the download kit. zh-CN: 离开共用下载库的传输. */
        val cancelFlag = AtomicBoolean(false)
        var cancelled: Boolean = false
        var committing: Boolean = false
        var lastProgress: FontDownloadEvent.Progress? = null

        fun hasRetainingSubscribers(): Boolean = subscribers.values.any { it.retainsTransfer }
    }

    private data class Subscriber(
        val id: Long,
        val future: ManagedFontFuture,
        val listener: FontDownloadListener?,
        val retainsTransfer: Boolean,
    )

    private class ManagedFontFuture : CompletableFuture<InstalledFont>() {
        @Volatile
        var cancellationHandler: (() -> Boolean)? = null

        override fun cancel(mayInterruptIfRunning: Boolean): Boolean {
            return cancellationHandler?.invoke() ?: super.cancel(mayInterruptIfRunning)
        }

        fun cancelFromDownloader(): Boolean = super.cancel(false)
    }

    companion object {
        private const val PROGRESS_GRANULARITY_BYTES = 64L * 1024L

        /** The download store under the font store root; the leading dot keeps it apart from the font directories. */
        internal const val DOWNLOADS_DIRECTORY_NAME = ".downloads"
        private const val DOWNLOAD_FILE_NAME = "font.woff2"

        private fun defaultWorkerExecutor(): ExecutorService = Executors.newFixedThreadPool(2) { runnable ->
            Thread(runnable, "AceFontDownloader").apply { isDaemon = true }
        }

        /**
         * The reason of every mirror, in order, as the exceptions of the former downloader: a size or SHA-256 mismatch is a
         * [FontFileValidationException] (an integrity failure for the font dialog), an HTTP error or a network error an
         * [IOException].
         * zh-CN: 按顺序给出每个镜像的原因, 用原下载器的异常表示: 大小或 SHA-256 不符为 [FontFileValidationException] (字体对话框据此显示完整性失败),
         * HTTP 错误与网络错误为 [IOException].
         */
        private fun mirrorFailures(failure: DownloadFailure): List<Throwable> =
            failure.mirrors.ifEmpty { listOf(failure.toMirror()) }.map { mirror ->
                val where = mirror.host ?: mirror.url
                when (mirror.kind) {
                    DownloadFailureKind.SIZE_MISMATCH -> FontFileValidationException("Font size mismatch from $where: ${mirror.message}")
                    DownloadFailureKind.CHECKSUM_MISMATCH -> FontFileValidationException("Font SHA-256 mismatch from $where")
                    DownloadFailureKind.HTTP_STATUS -> IOException("HTTP ${mirror.httpStatus} while downloading font from ${mirror.url}")
                    DownloadFailureKind.SECURITY -> SecurityException("${mirror.message} (font from ${mirror.url})")
                    DownloadFailureKind.NETWORK -> IOException("${mirror.message} (font from ${mirror.url}, ${mirror.retries} retries)")
                    DownloadFailureKind.OTHER -> FontDownloadException("${mirror.message} (font from ${mirror.url})")
                }
            }
    }
}
