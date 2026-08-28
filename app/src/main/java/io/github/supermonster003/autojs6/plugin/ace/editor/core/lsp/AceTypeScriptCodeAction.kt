package io.github.supermonster003.autojs6.plugin.ace.editor.core.lsp

import java.nio.charset.StandardCharsets
import java.security.MessageDigest

data class AceTypeScriptCodeAction(
    val kind: Kind,
    val title: String,
    val diagnosticCode: Int,
    val edits: List<TextEdit>,
) {

    enum class Kind {
        AUTO_IMPORT,
        SPELLING_CORRECTION,
    }

    data class TextEdit(
        val startOffset: Int,
        val endOffset: Int,
        val newText: String,
    )

    data class Prepared(
        val kind: Kind,
        val title: String,
        val diagnosticCode: Int,
        val baseContentSha256: String,
        val resultContentSha256: String,
        val edits: List<TextEdit>,
        val resultText: String,
    )

    fun prepare(baseText: String): Prepared? {
        if (baseText.length > MAX_DOCUMENT_UTF16_LENGTH || !isWellFormedUtf16(baseText)) return null
        if (title.isBlank() || title.toByteArray(StandardCharsets.UTF_8).size > MAX_TITLE_BYTES) return null
        if (title.any { character -> Character.isISOControl(character.code) }) return null
        if (diagnosticCode !in 1..MAX_DIAGNOSTIC_CODE) return null
        if (edits.isEmpty() || edits.size > MAX_EDIT_COUNT) return null

        var previousStart = -1
        var previousEnd = -1
        var replacementBytes = 0L
        edits.forEach { edit ->
            if (edit.startOffset !in 0..baseText.length) return null
            if (edit.endOffset !in edit.startOffset..baseText.length) return null
            if (!isUtf16Boundary(baseText, edit.startOffset)) return null
            if (!isUtf16Boundary(baseText, edit.endOffset)) return null
            if (edit.startOffset == edit.endOffset && edit.newText.isEmpty()) return null
            if (!isWellFormedUtf16(edit.newText)) return null
            val bytes = edit.newText.toByteArray(StandardCharsets.UTF_8).size
            if (bytes > MAX_REPLACEMENT_TEXT_BYTES) return null
            replacementBytes += bytes
            if (replacementBytes > MAX_TOTAL_REPLACEMENT_TEXT_BYTES) return null
            if (previousStart >= 0 && (
                edit.startOffset <= previousStart || edit.startOffset < previousEnd
            )) {
                return null
            }
            previousStart = edit.startOffset
            previousEnd = edit.endOffset
        }

        val result = StringBuilder(baseText)
        edits.asReversed().forEach { edit ->
            result.replace(edit.startOffset, edit.endOffset, edit.newText)
        }
        if (result.length > MAX_DOCUMENT_UTF16_LENGTH) return null
        val resultText = result.toString()
        if (resultText == baseText || !isWellFormedUtf16(resultText)) return null
        return Prepared(
            kind = kind,
            title = title,
            diagnosticCode = diagnosticCode,
            baseContentSha256 = sha256(baseText),
            resultContentSha256 = sha256(resultText),
            edits = edits.toList(),
            resultText = resultText,
        )
    }

    companion object {
        const val MAX_ACTION_COUNT = 16
        const val MAX_PAYLOAD_CHARS = 300_000
        const val MAX_TITLE_BYTES = 512
        const val MAX_DIAGNOSTIC_CODE = 999_999
        const val MAX_DOCUMENT_UTF16_LENGTH = 1_048_576
        const val MAX_EDIT_COUNT = 32
        const val MAX_REPLACEMENT_TEXT_BYTES = 65_536
        const val MAX_TOTAL_REPLACEMENT_TEXT_BYTES = 131_072

        fun kindFromWire(value: String): Kind? = when (value) {
            "autoImport" -> Kind.AUTO_IMPORT
            "spellingCorrection" -> Kind.SPELLING_CORRECTION
            else -> null
        }

        private fun isUtf16Boundary(text: String, offset: Int): Boolean =
            offset == 0 || offset == text.length ||
                !Character.isHighSurrogate(text[offset - 1]) ||
                !Character.isLowSurrogate(text[offset])

        private fun isWellFormedUtf16(value: String): Boolean {
            var index = 0
            while (index < value.length) {
                val character = value[index]
                when {
                    Character.isHighSurrogate(character) -> {
                        if (index + 1 >= value.length || !Character.isLowSurrogate(value[index + 1])) {
                            return false
                        }
                        index += 2
                    }
                    Character.isLowSurrogate(character) -> return false
                    else -> index++
                }
            }
            return true
        }

        private fun sha256(text: String): String =
            MessageDigest.getInstance("SHA-256")
                .digest(text.toByteArray(StandardCharsets.UTF_8))
                .joinToString(separator = "") { byte -> "%02x".format(byte.toInt() and 0xff) }
    }
}
