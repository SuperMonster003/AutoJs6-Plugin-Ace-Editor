package io.github.supermonster003.autojs6.plugin.ace.editor.core.lsp

import java.io.File
import java.net.URI
import java.net.URLDecoder
import java.net.URLEncoder
import java.nio.charset.StandardCharsets

/**
 * Bidirectional, single-project URI allowlist used by the Lua companion process.
 * Only the current document's canonical parent directory is admitted; traversal,
 * sibling prefixes, query/fragment tricks, and non-file schemes are rejected.
 */
internal class AceLuaWorkspaceMapping private constructor(
    val projectRoot: File,
    val documentFile: File,
    val rootUri: String,
    val documentUri: String,
) {

    fun realUriForVirtualUri(virtualUri: String): String? {
        val prefix = "${AceLspServerManager.SYNTHETIC_ROOT_URI}/"
        if (!virtualUri.startsWith(prefix) || '?' in virtualUri || '#' in virtualUri) return null
        val encodedRelativePath = virtualUri.removePrefix(prefix)
        val relativePath = runCatching {
            URLDecoder.decode(encodedRelativePath, StandardCharsets.UTF_8.name())
        }.getOrNull()?.replace('\\', '/') ?: return null
        if (!isCanonicalRelativePath(relativePath)) return null
        val target = File(projectRoot, relativePath).normalizedCanonicalFile()
        if (!contains(target)) return null
        return fileUri(target)
    }

    fun virtualUriForRealUri(realUri: String): String? {
        val target = localFile(realUri)?.normalizedCanonicalFile() ?: return null
        if (!contains(target)) return null
        val relative = target.relativeTo(projectRoot).invariantSeparatorsPath
            .split('/').joinToString("/") { segment -> encodeSegment(segment) }
        return "${AceLspServerManager.SYNTHETIC_ROOT_URI}/$relative"
    }

    fun contains(file: File): Boolean {
        val canonical = file.normalizedCanonicalFile()
        return canonical == projectRoot ||
            canonical.path.startsWith(projectRoot.path + File.separator)
    }

    companion object {
        fun fromDocumentPath(path: String?): AceLuaWorkspaceMapping? {
            val document = localFile(path)?.normalizedCanonicalFile() ?: return null
            val root = document.parentFile?.normalizedCanonicalFile()?.takeIf(File::isDirectory)
                ?: return null
            if (
                document == root ||
                !document.path.startsWith(root.path + File.separator)
            ) {
                return null
            }
            return AceLuaWorkspaceMapping(
                projectRoot = root,
                documentFile = document,
                rootUri = fileUri(root),
                documentUri = fileUri(document),
            )
        }

        private fun localFile(value: String?): File? {
            val normalized = value
                ?.substringBefore('?')
                ?.substringBefore('#')
                ?.trim()
                ?.takeIf(String::isNotEmpty)
                ?: return null
            if (WINDOWS_ABSOLUTE_PATH.matches(normalized)) return File(normalized)
            if (normalized.startsWith("file:", ignoreCase = true)) {
                return runCatching { File(URI(normalized)) }.getOrNull()
            }
            if (URI_SCHEME.containsMatchIn(normalized)) return null
            return File(normalized).takeIf(File::isAbsolute)
        }

        private fun fileUri(file: File): String {
            val slashPath = file.path.replace(File.separatorChar, '/')
                .let { path -> if (path.startsWith('/')) path else "/$path" }
            return URI("file", "", slashPath, null).toASCIIString()
        }

        private fun encodeSegment(value: String): String =
            URLEncoder.encode(value, StandardCharsets.UTF_8.name()).replace("+", "%20")

        private fun isCanonicalRelativePath(path: String): Boolean {
            if (path.isBlank() || path.startsWith('/') || '\u0000' in path || ':' in path) return false
            return path.split('/').all { segment ->
                segment.isNotBlank() && segment != "." && segment != ".."
            }
        }

        private fun File.normalizedCanonicalFile(): File =
            runCatching { canonicalFile }.getOrElse { absoluteFile.normalize() }

        private val WINDOWS_ABSOLUTE_PATH = Regex("^[A-Za-z]:[\\\\/].+")
        private val URI_SCHEME = Regex("^[A-Za-z][A-Za-z0-9+.-]*:")
    }
}
