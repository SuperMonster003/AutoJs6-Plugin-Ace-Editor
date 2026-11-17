package io.github.supermonster003.autojs6.plugin.ace.editor.core.font

import java.io.BufferedInputStream
import java.io.Closeable
import java.io.InputStream
import java.net.InetAddress
import java.net.ServerSocket
import java.net.Socket
import java.util.concurrent.CopyOnWriteArrayList
import java.util.concurrent.atomic.AtomicInteger
import kotlin.concurrent.thread

/**
 * A minimal HTTP/1.1 server on the loopback for the font download tests on the shared download kit (a copy of the test
 * server of the kit, AutoJs6 `plugin-api/download-kit/src/test/.../TinyHttpServer.kt` at `b38fb2c46`; the AAR carries no
 * test sources): one request per connection, a [handler] that decides each answer, and a log of what was asked and sent
 * ([log]).
 *
 * zh-CN: 供共用下载库上的字体下载测试使用的最小 HTTP/1.1 回环服务器 (共用库测试服务器的副本, 来自 AutoJs6 `plugin-api/download-kit/src/test/.../TinyHttpServer.kt`
 * 的 `b38fb2c46`; AAR 不带测试源码): 每个连接一个请求, 由 [handler] 决定应答, [log] 记录请求与发送的内容.
 */
class TinyHttpServer : Closeable {

    class Request(val method: String, val path: String, val headers: Map<String, String>) {
        fun header(name: String): String? = headers[name.lowercase()]
    }

    /**
     * [cutAfter] closes the connection after that many body bytes; [pauseMillis] waits after each 16 KiB chunk;
     * [withoutLength] sends no Content-Length, so the body ends when the connection closes.
     * zh-CN: [cutAfter] 在发送这么多正文字节后断开连接; [pauseMillis] 在每个 16 KiB 块之后等待; [withoutLength] 不发送 Content-Length,
     * 正文在连接关闭时结束.
     */
    class Response(
        val status: Int,
        val body: ByteArray = ByteArray(0),
        val headers: Map<String, String> = emptyMap(),
        val cutAfter: Int? = null,
        val pauseMillis: Long = 0L,
        val withoutLength: Boolean = false,
    )

    /** [seq] counts requests in the order they arrived. zh-CN: [seq] 按到达顺序为请求计数. */
    class Logged(val request: Request, val status: Int, val sentBytes: Int, val seq: Int)

    private val socket = ServerSocket(0, 16, InetAddress.getByName("127.0.0.1"))

    private val entries = CopyOnWriteArrayList<Logged>()
    private val arrived = AtomicInteger()
    private val inFlight = AtomicInteger()

    /**
     * What was asked and sent, in the order the requests arrived, once the connections in flight have finished (a client
     * that stops reading early finishes before the server notices).
     * zh-CN: 请求与发送的内容, 按请求到达的顺序排列, 读取前先等进行中的连接结束 (提前停止读取的客户端会先于服务器察觉而结束).
     */
    val log: List<Logged> get() = awaitIdle().let { entries.sortedBy { it.seq } }

    fun clearLog() {
        awaitIdle()
        entries.clear()
    }

    private fun awaitIdle() {
        val deadline = System.currentTimeMillis() + 5_000
        while (inFlight.get() > 0 && System.currentTimeMillis() < deadline) Thread.sleep(5)
    }

    @Volatile
    var handler: (Request) -> Response = { Response(404) }

    val port: Int get() = socket.localPort

    fun url(path: String) = "http://127.0.0.1:$port$path"

    val gets: List<Logged> get() = log.filter { it.request.method == "GET" }

    init {
        thread(isDaemon = true, name = "tiny-http-server") {
            while (!socket.isClosed) {
                val client = runCatching { socket.accept() }.getOrNull() ?: break
                inFlight.incrementAndGet()
                thread(isDaemon = true) {
                    try {
                        serve(client)
                    } finally {
                        inFlight.decrementAndGet()
                    }
                }
            }
        }
    }

    private fun serve(client: Socket): Unit = client.use { s ->
        val input = BufferedInputStream(s.getInputStream())
        val requestLine = readLine(input) ?: return
        val headers = LinkedHashMap<String, String>()
        while (true) {
            val line = readLine(input) ?: return
            if (line.isEmpty()) break
            val colon = line.indexOf(':')
            if (colon > 0) headers[line.substring(0, colon).trim().lowercase()] = line.substring(colon + 1).trim()
        }
        val parts = requestLine.split(' ')
        val request = Request(parts[0], parts.getOrElse(1) { "/" }, headers)
        val seq = arrived.incrementAndGet()
        val response = runCatching { handler(request) }.getOrElse { Response(500) }
        val out = s.getOutputStream()
        val head = StringBuilder("HTTP/1.1 ${response.status} ${reason(response.status)}\r\n")
        val bodyAllowed = request.method != "HEAD" && response.status != 304 && response.status != 204
        if (!response.withoutLength) head.append("Content-Length: ${if (bodyAllowed) response.body.size else 0}\r\n")
        head.append("Connection: close\r\n")
        response.headers.forEach { (name, value) -> head.append("$name: $value\r\n") }
        head.append("\r\n")
        var sent = 0
        runCatching {
            out.write(head.toString().toByteArray(Charsets.ISO_8859_1))
            if (bodyAllowed) {
                val limit = response.cutAfter?.coerceAtMost(response.body.size) ?: response.body.size
                var offset = 0
                while (offset < limit) {
                    val n = minOf(16 * 1024, limit - offset)
                    out.write(response.body, offset, n)
                    offset += n
                    sent = offset
                    if (response.pauseMillis > 0) {
                        out.flush()
                        Thread.sleep(response.pauseMillis)
                    }
                }
            }
            out.flush()
        }
        entries += Logged(request, response.status, sent, seq)
    }

    private fun readLine(input: InputStream): String? {
        val sb = StringBuilder()
        while (true) {
            val c = input.read()
            if (c == -1) return if (sb.isEmpty()) null else sb.toString()
            if (c == '\n'.code) return sb.toString().trimEnd('\r')
            sb.append(c.toChar())
        }
    }

    private fun reason(status: Int) = when (status) {
        200 -> "OK"
        206 -> "Partial Content"
        304 -> "Not Modified"
        404 -> "Not Found"
        416 -> "Range Not Satisfiable"
        else -> "Status"
    }

    override fun close() {
        socket.close()
    }

    companion object {

        /**
         * Serves [body] like a file server: `If-None-Match` / `If-Modified-Since` give 304, `Range: bytes=N-` gives 206
         * (416 past the end) unless [honorRange] is false, and `If-Range` with another validator gives 200 unless
         * [honorIfRange] is false (as release assets on GitHub do).
         * zh-CN: 像文件服务器一样提供 [body]: 条件请求得到 304; `Range: bytes=N-` 得到 206 (超出末尾为 416), [honorRange] 为 false 时忽略 Range;
         * `If-Range` 验证头不符时得到 200, [honorIfRange] 为 false 时忽略 (与 GitHub 发布资产相同).
         */
        fun file(
            request: Request,
            body: ByteArray,
            etag: String? = null,
            lastModified: String? = null,
            honorRange: Boolean = true,
            honorIfRange: Boolean = true,
            cutAfter: Int? = null,
            pauseMillis: Long = 0L,
        ): Response {
            val validators = buildMap {
                etag?.let { put("ETag", it) }
                lastModified?.let { put("Last-Modified", it) }
            }
            val ifNoneMatch = request.header("If-None-Match")
            val ifModifiedSince = request.header("If-Modified-Since")
            if (ifNoneMatch != null && etag != null && ifNoneMatch == etag) return Response(304, headers = validators)
            if (ifNoneMatch == null && ifModifiedSince != null && lastModified != null && ifModifiedSince == lastModified) {
                return Response(304, headers = validators)
            }
            val range = request.header("Range")?.let { Regex("bytes=(\\d+)-").matchEntire(it)?.groupValues?.get(1)?.toInt() }
            if (range != null && honorRange) {
                val ifRange = request.header("If-Range")
                val current = ifRange == null || !honorIfRange || ifRange == etag || ifRange == lastModified
                if (current) {
                    if (range >= body.size) return Response(416, headers = mapOf("Content-Range" to "bytes */${body.size}"))
                    return Response(
                        206,
                        body.copyOfRange(range, body.size),
                        validators + ("Content-Range" to "bytes $range-${body.size - 1}/${body.size}"),
                        cutAfter,
                        pauseMillis,
                    )
                }
            }
            return Response(200, body, validators, cutAfter, pauseMillis)
        }

    }

}
