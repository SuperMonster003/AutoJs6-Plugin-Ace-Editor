package io.github.supermonster003.autojs6.plugin.ace.editor.core.lsp

import java.io.ByteArrayOutputStream
import java.io.EOFException
import java.io.InputStream
import java.io.OutputStream
import java.nio.charset.StandardCharsets

/** Content-Length framing shared by standard LSP stdio servers. */
internal object AceLspMessageFraming {
    private const val HEADER_TERMINATOR = "\r\n\r\n"
    private const val MAX_HEADER_BYTES = 8 * 1024
    internal const val MAX_CONTENT_BYTES = 4 * 1024 * 1024

    fun write(output: OutputStream, json: String) {
        val content = json.toByteArray(StandardCharsets.UTF_8)
        require(content.isNotEmpty()) { "LSP message must not be empty" }
        require(content.size <= MAX_CONTENT_BYTES) { "LSP message exceeds the content limit" }
        val header = "Content-Length: ${content.size}$HEADER_TERMINATOR"
            .toByteArray(StandardCharsets.US_ASCII)
        output.write(header)
        output.write(content)
        output.flush()
    }

    /** Returns null only for clean EOF before the next header begins. */
    fun read(input: InputStream): String? {
        val headerBytes = ByteArrayOutputStream()
        var terminatorProgress = 0
        while (true) {
            val next = input.read()
            if (next < 0) {
                if (headerBytes.size() == 0) return null
                throw EOFException("Unexpected EOF in LSP header")
            }
            headerBytes.write(next)
            if (headerBytes.size() > MAX_HEADER_BYTES) {
                throw IllegalArgumentException("LSP header exceeds the size limit")
            }
            val expected = HEADER_TERMINATOR[terminatorProgress].code
            terminatorProgress = when {
                next == expected && terminatorProgress == HEADER_TERMINATOR.lastIndex -> break
                next == expected -> terminatorProgress + 1
                next == HEADER_TERMINATOR[0].code -> 1
                else -> 0
            }
        }
        val header = headerBytes.toString(StandardCharsets.US_ASCII.name())
        val contentLengths = header
            .removeSuffix(HEADER_TERMINATOR)
            .split("\r\n")
            .mapNotNull { line ->
                val separator = line.indexOf(':')
                if (separator <= 0) return@mapNotNull null
                val name = line.substring(0, separator).trim()
                if (!name.equals("Content-Length", ignoreCase = true)) return@mapNotNull null
                line.substring(separator + 1).trim().toIntOrNull()
            }
        require(contentLengths.size == 1) { "LSP header must contain one Content-Length" }
        val contentLength = contentLengths.single()
        require(contentLength in 1..MAX_CONTENT_BYTES) { "Invalid LSP Content-Length: $contentLength" }
        val content = ByteArray(contentLength)
        var offset = 0
        while (offset < content.size) {
            val count = input.read(content, offset, content.size - offset)
            if (count < 0) throw EOFException("Unexpected EOF in LSP content")
            if (count == 0) continue
            offset += count
        }
        return String(content, StandardCharsets.UTF_8)
    }
}
