package io.github.supermonster003.autojs6.plugin.ace.editor.core.font

import org.junit.After
import org.junit.Assert.assertArrayEquals
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Assert.fail
import org.junit.Before
import org.junit.Test
import java.io.File
import java.nio.file.Files
import java.util.Collections
import java.util.concurrent.ExecutionException
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.atomic.AtomicInteger

/**
 * plugin-center P12.2 (T19, T24): the font downloader on the shared download kit, over HTTP with the OkHttp source and a
 * server in the test process: a cut transfer is retried and asks only for the remaining bytes, a server error is retried,
 * the next mirror continues the bytes of the first one, a cancelled download continues from where it stopped, and a file
 * with another SHA-256 is rejected without installing anything; the kit is emptied after each installation (T20).
 *
 * zh-CN: plugin-center P12.2 (T19, T24): 建立在共用下载库上的字体下载器, 经 OkHttp 来源与测试进程内的服务器以 HTTP 验证: 中断的传输自动重试且只请求剩余字节,
 * 服务器错误会重试, 下一个镜像接着第一个镜像的字节继续, 取消的下载从断点继续, SHA-256 不符的文件被拒绝且不落库; 每次落库后共用库中的条目被删除 (T20).
 */
class FontDownloaderKitTest {

    private lateinit var directory: File
    private lateinit var server: TinyHttpServer
    private val downloaders = ArrayList<FontDownloader>()

    private val bytes = FontTestFixtures.validWoff2(size = 200_000, fill = 5)
    private val sha = FontTestFixtures.sha256(bytes)

    @Before
    fun setUp() {
        directory = Files.createTempDirectory("font-download-kit-test").toFile()
        server = TinyHttpServer()
    }

    @After
    fun tearDown() {
        downloaders.forEach(FontDownloader::close)
        server.close()
        directory.deleteRecursively()
    }

    private fun font(vararg mirrors: String): RemoteFont = FontTestFixtures.remoteFont(bytes).let {
        it.copy(artifact = it.artifact.copy(urls = mirrors.map { mirror -> server.url("/$mirror/test_font.woff2") }))
    }

    private fun downloader(retryDelays: LongArray = longArrayOf(0L, 0L)) =
        FontDownloader(FontStore(directory), OkHttpFontDownloadSource(), retryDelaysMillis = retryDelays).also(downloaders::add)

    private fun events() = Collections.synchronizedList(mutableListOf<FontDownloadEvent>())

    private fun progress(events: List<FontDownloadEvent>) =
        synchronized(events) { events.filterIsInstance<FontDownloadEvent.Progress>().map { it.bytesDownloaded } }

    private fun assertInstalled(installed: InstalledFont) {
        assertEquals(sha, installed.sha256)
        assertArrayEquals(bytes, installed.file.readBytes())
        assertEquals(installed.file, FontStore(directory).installedFile("test_font", sha))
        assertTrue(directory.resolve(".parts").listFiles().isNullOrEmpty())
    }

    @Test
    fun aCutTransferIsRetriedAndAsksOnlyForTheRemainingBytes() {
        val cut = 70_000
        val first = AtomicBoolean(true)
        server.handler = { r -> TinyHttpServer.file(r, bytes, etag = "\"f1\"", cutAfter = if (first.getAndSet(false)) cut else null) }
        val events = events()
        val downloader = downloader()

        val installed = downloader.enqueue(font("m1")) { events += it }.future.get(5, TimeUnit.SECONDS)

        assertInstalled(installed)
        val gets = server.gets
        assertEquals(2, gets.size)
        assertNull(gets[0].request.header("Range"))
        assertEquals(cut, gets[0].sentBytes)
        assertEquals("bytes=$cut-", gets[1].request.header("Range"))
        assertEquals("\"f1\"", gets[1].request.header("If-Range"))
        assertEquals(206, gets[1].status)
        assertEquals(bytes.size - cut, gets[1].sentBytes)
        val progress = progress(events)
        assertEquals(progress.sorted(), progress)
        assertEquals(bytes.size.toLong(), progress.last())
        assertTrue(downloader.downloads.entries().isEmpty())
    }

    @Test
    fun aServerErrorIsRetriedOnTheSameMirror() {
        val count = AtomicInteger()
        server.handler = { r -> if (count.getAndIncrement() == 0) TinyHttpServer.Response(503) else TinyHttpServer.file(r, bytes) }

        val installed = downloader().enqueue(font("m1")).future.get(5, TimeUnit.SECONDS)

        assertInstalled(installed)
        assertEquals(listOf("/m1/test_font.woff2" to 503, "/m1/test_font.woff2" to 200), server.gets.map { it.request.path to it.status })
    }

    @Test
    fun theNextMirrorContinuesTheBytesTheFirstOneSent() {
        val cut = 120_000
        val first = AtomicBoolean(true)
        server.handler = { r ->
            when {
                !r.path.startsWith("/m1/") -> TinyHttpServer.file(r, bytes, etag = "\"f2\"")
                first.getAndSet(false) -> TinyHttpServer.file(r, bytes, etag = "\"f1\"", cutAfter = cut)
                else -> TinyHttpServer.Response(503)
            }
        }
        val events = events()

        val installed = downloader().enqueue(font("m1", "m2")) { events += it }.future.get(5, TimeUnit.SECONDS)

        assertInstalled(installed)
        val gets = server.gets
        assertEquals(listOf("m1" to 200, "m1" to 503, "m1" to 503, "m2" to 206), gets.map { it.request.path.split('/')[1] to it.status })
        assertEquals(cut, gets[0].sentBytes)
        assertEquals("bytes=$cut-", gets[3].request.header("Range"))
        assertNull(gets[3].request.header("If-Range"))
        assertEquals(bytes.size - cut, gets[3].sentBytes)
        val progress = progress(events)
        assertEquals(progress.sorted(), progress)
    }

    @Test
    fun aCancelledDownloadContinuesFromWhereItStopped() {
        val cut = 50_000
        val first = AtomicBoolean(true)
        server.handler = { r -> TinyHttpServer.file(r, bytes, etag = "\"f1\"", cutAfter = if (first.getAndSet(false)) cut else null) }
        // The cut transfer waits a minute for its retry; it is cancelled while it waits.
        // zh-CN: 中断的传输等待一分钟后才重试; 在等待期间取消它.
        val downloader = downloader(retryDelays = longArrayOf(60_000L))
        val cancelled = downloader.enqueue(font("m1"))
        waitUntil("the part holds the bytes before the cut") { downloader.downloads.partFile(sha).length() == cut.toLong() }

        assertTrue(downloader.cancel("test_font"))
        assertTrue(cancelled.future.isCancelled)
        waitUntil("the transfer has stopped") { !downloader.downloads.isInUse(sha) }
        assertEquals(cut.toLong(), downloader.downloads.partFile(sha).length())
        val events = events()
        val installed = downloader.enqueue(font("m1")) { events += it }.future.get(5, TimeUnit.SECONDS)

        assertInstalled(installed)
        val gets = server.gets
        assertEquals(2, gets.size)
        assertEquals("bytes=$cut-", gets[1].request.header("Range"))
        assertEquals(206, gets[1].status)
        assertEquals(bytes.size - cut, gets[1].sentBytes)
        // Queued, the start at 0, then the bytes already on disk. zh-CN: Queued, 起点 0, 然后是磁盘上已有的字节数.
        assertEquals(listOf(0L, cut.toLong()), progress(events).take(2))
        assertTrue(downloader.downloads.entries().isEmpty())
    }

    @Test
    fun aFileWithAnotherHashIsRejectedAndNothingIsInstalled() {
        val other = bytes.clone().also { it[it.lastIndex] = (it.last().toInt() xor 1).toByte() }
        server.handler = { r -> TinyHttpServer.file(r, other) }
        val downloader = downloader()

        val failure = try {
            downloader.enqueue(font("m1")).future.get(5, TimeUnit.SECONDS)
            fail("The download must fail")
            null
        } catch (e: ExecutionException) {
            e.cause
        }

        assertTrue("$failure", failure is FontMirrorsExhaustedException)
        // An integrity failure for the font dialog. zh-CN: 字体对话框据此显示完整性失败.
        assertTrue("${failure?.cause}", failure?.cause is FontFileValidationException)
        assertEquals(1, server.gets.size)
        assertNull(FontStore(directory).installedFont("test_font"))
        assertTrue(directory.resolve(".parts").listFiles().isNullOrEmpty())
        assertFalse(downloader.downloads.partFile(sha).exists())
        assertFalse(downloader.downloads.file(sha).exists())
    }

    private fun waitUntil(what: String, check: () -> Boolean) {
        val deadline = System.currentTimeMillis() + 5_000
        while (!check()) {
            if (System.currentTimeMillis() > deadline) fail("Timed out: $what")
            Thread.sleep(10)
        }
    }
}
