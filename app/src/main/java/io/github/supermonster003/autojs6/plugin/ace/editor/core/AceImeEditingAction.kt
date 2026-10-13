package io.github.supermonster003.autojs6.plugin.ace.editor.core

/**
 * Actions of an IME's text editing panel that the editor runs as Ace commands (Roadmap-Ace-1.44.0.md A2-10, manual
 * test C4). The IME only sees Ace's hidden textarea, which holds the cursor row, so these actions applied to the
 * textarea reached Ace as a selection or caret on that row.
 */
enum class AceImeEditingAction(val bridgeName: String) {

    SelectAll("selectAll"),
    LineStart("lineStart"),
    LineEnd("lineEnd"),
    ;

    companion object {

        /**
         * Gboard reads the extracted text right before its "move to start / end" buttons (|< and >|), then selects up
         * to the start / end of that text, keeping the anchor in its "Select" mode. A space bar slide reaching the
         * same offsets does not read it first, so [extractedTextLength] is -1 unless the read came just before.
         * Selecting the whole text is not a line boundary (the caller leaves it to the textarea).
         */
        fun lineBoundary(start: Int, end: Int, extractedTextLength: Int): AceImeEditingAction? {
            if (extractedTextLength <= 0 || start < 0 || end < 0) {
                return null
            }
            if (minOf(start, end) == 0 && maxOf(start, end) == extractedTextLength) {
                return null
            }
            return when {
                start == extractedTextLength || end == extractedTextLength -> LineEnd
                start == 0 || end == 0 -> LineStart
                else -> null
            }
        }
    }
}
