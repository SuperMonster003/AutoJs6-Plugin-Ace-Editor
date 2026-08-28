package io.github.supermonster003.autojs6.plugin.ace.editor.core.lsp

import java.nio.charset.StandardCharsets
import java.security.MessageDigest
import java.util.Locale
import org.autojs.plugin.editor.api.EditorPluginProjectRenameContract
import org.autojs.plugin.editor.api.EditorPluginProjectRenameFile
import org.autojs.plugin.editor.api.EditorPluginProjectRenameRequest
import org.autojs.plugin.editor.api.EditorPluginProjectSnapshotContract
import org.autojs.plugin.editor.api.EditorPluginTextEdit

/** A TypeScript-owned rename location set before it is bound to host snapshot authority. */
internal data class AceTypeScriptProjectRenameCandidate(
    val symbolName: String,
    val files: List<FileLocations>,
) {

    data class FileLocations(
        val uri: String,
        val edits: List<TextRange>,
    )

    data class TextRange(
        val startOffset: Int,
        val endOffset: Int,
    )

    fun bind(
        layer: AceTypeScriptProjectSourceLayer,
        currentDocumentText: String,
        sessionRevision: Long,
    ): AceTypeScriptProjectRenameBoundCandidate? {
        if (!IDENTIFIER.matches(symbolName)) return null
        if (
            currentDocumentText.length >
            EditorPluginProjectRenameContract.MAX_DOCUMENT_UTF16_LENGTH ||
            !isWellFormedUtf16(currentDocumentText)
        ) {
            return null
        }
        if (files.size !in 2..EditorPluginProjectRenameContract.MAX_FILE_COUNT) return null

        var previousUri: String? = null
        var totalEdits = 0
        var activeDocumentCount = 0
        val boundFiles = ArrayList<AceTypeScriptProjectRenameBoundFile>(files.size)
        files.forEach { file ->
            if (file.uri.isBlank() || file.uri.length > MAX_URI_CHARS) return null
            previousUri?.let { preceding -> if (file.uri <= preceding) return null }
            previousUri = file.uri
            val source = layer.projectRenameSource(file.uri) ?: return null
            val isActiveDocument = file.uri == layer.documentUri
            val activeDocumentHasBom = isActiveDocument &&
                source.text.startsWith(UTF8_BOM_CHARACTER) &&
                source.text.drop(1) == currentDocumentText
            val editBaseText = when {
                !isActiveDocument -> source.text
                source.text == currentDocumentText -> currentDocumentText
                activeDocumentHasBom -> currentDocumentText
                else -> return null
            }
            if (
                editBaseText.length >
                EditorPluginProjectRenameContract.MAX_DOCUMENT_UTF16_LENGTH ||
                !isWellFormedUtf16(editBaseText)
            ) {
                return null
            }
            if (isActiveDocument) activeDocumentCount++
            if (
                file.edits.size !in
                1..EditorPluginProjectRenameContract.MAX_EDIT_COUNT_PER_FILE
            ) {
                return null
            }
            var previousStart = -1
            var previousEnd = -1
            file.edits.forEach { edit ->
                if (edit.startOffset !in 0..editBaseText.length) return null
                if (edit.endOffset !in edit.startOffset..editBaseText.length) return null
                if (edit.endOffset - edit.startOffset != symbolName.length) return null
                if (!isUtf16Boundary(editBaseText, edit.startOffset)) return null
                if (!isUtf16Boundary(editBaseText, edit.endOffset)) return null
                if (!editBaseText.regionMatches(edit.startOffset, symbolName, 0, symbolName.length)) {
                    return null
                }
                if (
                    previousStart >= 0 &&
                    (edit.startOffset <= previousStart || edit.startOffset < previousEnd)
                ) {
                    return null
                }
                previousStart = edit.startOffset
                previousEnd = edit.endOffset
            }
            totalEdits += file.edits.size
            if (totalEdits > EditorPluginProjectRenameContract.MAX_TOTAL_EDIT_COUNT) return null
            boundFiles += AceTypeScriptProjectRenameBoundFile(
                relativePath = source.relativePath,
                baseContentSha256 = source.contentSha256,
                diskBaseText = source.text,
                editBaseText = editBaseText,
                activeDocumentHasBom = activeDocumentHasBom,
                edits = file.edits.toList(),
            )
        }
        if (activeDocumentCount != 1) return null
        val orderedFiles = boundFiles.sortedBy(AceTypeScriptProjectRenameBoundFile::relativePath)
        if (orderedFiles.zipWithNext().any { (left, right) ->
                left.relativePath >= right.relativePath
            }
        ) {
            return null
        }
        return AceTypeScriptProjectRenameBoundCandidate(
            sessionRevision = sessionRevision,
            projectRootPath = layer.projectRootPath,
            documentUri = layer.documentUri,
            documentRelativePath = layer.projectRenameSource(layer.documentUri)?.relativePath
                ?: return null,
            projectSourceInventoryFingerprint = layer.sourceInventoryFingerprint,
            projectSourceByteLength = layer.sourceByteLength,
            symbolName = symbolName,
            files = orderedFiles,
        )
    }

    companion object {
        const val MAX_PAYLOAD_CHARS = 1_000_000
        const val MAX_URI_CHARS = 4_096
        private const val UTF8_BOM_CHARACTER = '\uFEFF'
        private val IDENTIFIER = Regex("[A-Za-z_$][A-Za-z0-9_$]*")

        private fun isUtf16Boundary(text: String, offset: Int): Boolean =
            offset == 0 || offset == text.length ||
                !Character.isHighSurrogate(text[offset - 1]) ||
                !Character.isLowSurrogate(text[offset])

        private fun isWellFormedUtf16(value: String): Boolean {
            var index = 0
            while (index < value.length) {
                when {
                    Character.isHighSurrogate(value[index]) -> {
                        if (
                            index + 1 >= value.length ||
                            !Character.isLowSurrogate(value[index + 1])
                        ) {
                            return false
                        }
                        index += 2
                    }
                    Character.isLowSurrogate(value[index]) -> return false
                    else -> index++
                }
            }
            return true
        }
    }
}

internal data class AceTypeScriptProjectRenameSource(
    val relativePath: String,
    val contentSha256: String,
    val text: String,
)

internal data class AceTypeScriptProjectRenameBoundFile(
    val relativePath: String,
    val baseContentSha256: String,
    val diskBaseText: String,
    val editBaseText: String,
    val activeDocumentHasBom: Boolean,
    val edits: List<AceTypeScriptProjectRenameCandidate.TextRange>,
)

internal data class AceTypeScriptProjectRenameBoundCandidate(
    val sessionRevision: Long,
    val projectRootPath: String,
    val documentUri: String,
    val documentRelativePath: String,
    val projectSourceInventoryFingerprint: String,
    val projectSourceByteLength: Long,
    val symbolName: String,
    private val files: List<AceTypeScriptProjectRenameBoundFile>,
) {

    fun prepare(newName: String): AceTypeScriptProjectRenamePrepared? {
        if (!IDENTIFIER.matches(newName) || newName == symbolName) return null
        var resultingProjectBytes = projectSourceByteLength
        val requestFiles = files.map { file ->
            val editorResult = StringBuilder(file.editBaseText).apply {
                file.edits.asReversed().forEach { edit ->
                    replace(edit.startOffset, edit.endOffset, newName)
                }
            }.toString()
            if (
                editorResult.length >
                EditorPluginProjectRenameContract.MAX_DOCUMENT_UTF16_LENGTH
            ) {
                return null
            }
            val diskResult = if (file.activeDocumentHasBom) {
                UTF8_BOM_CHARACTER + editorResult
            } else {
                editorResult
            }
            val baseBytes = file.diskBaseText.toByteArray(StandardCharsets.UTF_8)
            val resultBytes = diskResult.toByteArray(StandardCharsets.UTF_8)
            if (
                resultBytes.size.toLong() >
                EditorPluginProjectSnapshotContract.MAX_SINGLE_SOURCE_BYTES
            ) {
                baseBytes.fill(0)
                resultBytes.fill(0)
                return null
            }
            val resultSha256 = sha256(resultBytes)
            resultingProjectBytes = resultingProjectBytes - baseBytes.size + resultBytes.size
            baseBytes.fill(0)
            resultBytes.fill(0)
            EditorPluginProjectRenameFile(
                relativePath = file.relativePath,
                baseContentSha256 = file.baseContentSha256,
                resultContentSha256 = resultSha256,
                edits = file.edits.map { edit ->
                    EditorPluginTextEdit(edit.startOffset, edit.endOffset, newName)
                },
            )
        }
        if (
            resultingProjectBytes !in
            0..EditorPluginProjectSnapshotContract.MAX_SOURCE_BYTES
        ) {
            return null
        }
        val request = EditorPluginProjectRenameRequest(
            projectRootPath = projectRootPath,
            projectSourceInventoryFingerprint = projectSourceInventoryFingerprint,
            documentRelativePath = documentRelativePath,
            symbolName = symbolName,
            newName = newName,
            files = requestFiles,
        )
        if (!EditorPluginProjectRenameContract.isSupported(request)) return null
        return AceTypeScriptProjectRenamePrepared(request)
    }

    private companion object {
        const val UTF8_BOM_CHARACTER = '\uFEFF'
        val IDENTIFIER = Regex("[A-Za-z_$][A-Za-z0-9_$]*")

        fun sha256(bytes: ByteArray): String =
            MessageDigest.getInstance("SHA-256").digest(bytes)
                .joinToString(separator = "") { byte ->
                    "%02x".format(Locale.ROOT, byte.toInt() and 0xff)
                }
    }
}

data class AceTypeScriptProjectRenamePrepared(
    val request: EditorPluginProjectRenameRequest,
)
