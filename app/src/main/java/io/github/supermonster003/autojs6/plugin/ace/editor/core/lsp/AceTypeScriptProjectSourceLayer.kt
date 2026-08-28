package io.github.supermonster003.autojs6.plugin.ace.editor.core.lsp

import java.io.File
import java.net.URI
import java.nio.charset.StandardCharsets
import java.security.MessageDigest
import java.util.Collections
import java.util.Locale
import org.autojs.plugin.editor.api.EditorPluginProjectSnapshot
import org.autojs.plugin.editor.api.EditorPluginProjectSnapshotContract

/** Validated, immutable virtual project-source layer supplied by editor contract 2. */
internal data class AceTypeScriptProjectSourceLayer(
    val projectRootPath: String,
    val documentUri: String,
    val targetProfile: String,
    val fileUris: List<String>,
    val sourceInventoryFingerprint: String,
    val sourceFileCount: Int,
    val sourceByteLength: Long,
    val schemaRevision: Int,
    private val textByUri: Map<String, String>,
    private val definitionFileByUri: Map<String, AceTypeScriptDefinitionFile>,
) {

    fun read(uri: String): String? = textByUri[uri]

    fun definitionFile(uri: String): AceTypeScriptDefinitionFile? = definitionFileByUri[uri]

    companion object {
        fun from(
            requestedDocumentPath: String,
            snapshot: EditorPluginProjectSnapshot,
        ): AceTypeScriptProjectSourceLayer? {
            if (!EditorPluginProjectSnapshotContract.isSupported(snapshot)) return null
            val requestedDocument = localDocumentFile(requestedDocumentPath)
                ?.normalizedCanonicalFile()
                ?: return null
            if (requestedDocument.path != snapshot.documentPath) return null

            val textByUri = LinkedHashMap<String, String>(snapshot.sourceFiles.size)
            val definitionFileByUri = LinkedHashMap<String, AceTypeScriptDefinitionFile>(
                snapshot.sourceFiles.size,
            )
            val digest = MessageDigest.getInstance("SHA-256")
            digest.update(INVENTORY_DOMAIN.toByteArray(StandardCharsets.US_ASCII))
            digest.update('\n'.code.toByte())
            snapshot.sourceFiles.sortedBy { source -> source.relativePath }.forEach { source ->
                val bytes = source.text.toByteArray(StandardCharsets.UTF_8)
                if (bytes.size.toLong() != source.utf8ByteLength) return null
                val actualSha256 = sha256(bytes)
                bytes.fill(0)
                if (actualSha256 != source.sha256) return null
                val uri = virtualUri(source.relativePath)
                if (textByUri.put(uri, source.text) != null) return null
                if (
                    definitionFileByUri.put(
                        uri,
                        AceTypeScriptDefinitionFile(source.relativePath, source.sha256),
                    ) != null
                ) {
                    return null
                }
                digest.update(source.relativePath.toByteArray(StandardCharsets.UTF_8))
                digest.update(0)
                digest.update(
                    source.utf8ByteLength.toString().toByteArray(StandardCharsets.US_ASCII),
                )
                digest.update(0)
                digest.update(source.sha256.toByteArray(StandardCharsets.US_ASCII))
                digest.update('\n'.code.toByte())
            }
            if (digest.digest().toLowerHex() != snapshot.sourceInventoryFingerprint) return null
            val documentUri = virtualUri(snapshot.documentRelativePath)
            if (!textByUri.containsKey(documentUri)) return null
            return AceTypeScriptProjectSourceLayer(
                projectRootPath = snapshot.projectRootPath,
                documentUri = documentUri,
                targetProfile = snapshot.targetProfile,
                fileUris = Collections.unmodifiableList(textByUri.keys.sorted()),
                sourceInventoryFingerprint = snapshot.sourceInventoryFingerprint,
                sourceFileCount = snapshot.sourceFileCount,
                sourceByteLength = snapshot.sourceByteLength,
                schemaRevision = snapshot.schemaRevision,
                textByUri = Collections.unmodifiableMap(textByUri),
                definitionFileByUri = Collections.unmodifiableMap(definitionFileByUri),
            )
        }

        private fun localDocumentFile(documentPath: String): File? {
            val value = documentPath.substringBefore('?').substringBefore('#').trim()
            if (value.isEmpty()) return null
            if (WINDOWS_ABSOLUTE_PATH.matches(value)) return File(value)
            if (value.startsWith("file:", ignoreCase = true)) {
                return runCatching { File(URI(value)) }.getOrNull()
            }
            if (URI_SCHEME.containsMatchIn(value)) return null
            return File(value).takeIf(File::isAbsolute)
        }

        private fun virtualUri(relativePath: String): String =
            "${AceLspServerManager.SYNTHETIC_ROOT_URI}/$relativePath"

        private fun File.normalizedCanonicalFile(): File =
            runCatching { canonicalFile }.getOrElse { absoluteFile.normalize() }

        private fun sha256(bytes: ByteArray): String =
            MessageDigest.getInstance("SHA-256").digest(bytes).toLowerHex()

        private fun ByteArray.toLowerHex(): String = joinToString(separator = "") { byte ->
            "%02x".format(Locale.ROOT, byte.toInt() and 0xff)
        }

        private const val INVENTORY_DOMAIN = "autojs6.editor.project-source.inventory.v1"
        private val WINDOWS_ABSOLUTE_PATH = Regex("^[A-Za-z]:[\\\\/].+")
        private val URI_SCHEME = Regex("^[A-Za-z][A-Za-z0-9+.-]*:")
    }
}
