package io.github.supermonster003.autojs6.plugin.ace.editor.core

import android.os.SystemClock
import android.util.Log
import android.view.KeyEvent
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith

/**
 * Appendix C of docs/development/ace-1.44.0-manual-tests.md without a person at the keyboard: the input method calls a
 * keyboard makes (Gboard's, as observed on XQ-AT72 with a tracing build) are replayed through the input connection the
 * WebView gives the IME, so they pass through Chromium's IME handling, Ace's text input and the bridge as typed text
 * does. The installed keyboard stays hidden. Positions in these calls are offsets in Ace's hidden textarea, which holds
 * the cursor row ("\n" + row + "\n\n" below the first row).
 */
@RunWith(AndroidJUnit4::class)
class AceImeReplayDeviceTest {

    // C1: words typed as compositions, a suggestion replacing the composed word, and spaces.
    @Test
    fun typedWordsAndSuggestionsInsertExactlyTheirText() = withEditor { editor ->
        editor.moveCursorTo(EMPTY_ROW, 0)
        type(editor, "the")
        space(editor)
        compose(editor, "quikc")
        editor.ime { it.commitText("quick", 1) } // a suggestion replaces the composition
        space(editor)
        type(editor, "brown")
        space(editor)
        assertEquals("the quick brown ", editor.line(EMPTY_ROW))
        assertEquals(EMPTY_ROW to 16, editor.cursor())
        assertNoDroppedImeSelection(editor)
    }

    // C2: Gboard turns two spaces into ". "; Ace keeps two spaces in code.
    @Test
    fun doubleSpaceKeepsTwoSpaces() = withEditor { editor ->
        editor.moveCursorTo(EMPTY_ROW, 0)
        type(editor, "word")
        space(editor)
        editor.ime {
            it.beginBatchEdit()
            it.deleteSurroundingText(1, 0)
            it.commitText(". ", 1)
            it.endBatchEdit()
        }
        assertEquals("word  ", editor.line(EMPTY_ROW))
    }

    // C3: backspace at the start of a row joins it with the previous row; a selection of several rows is deleted as a
    // whole, and undo restores it.
    @Test
    fun backspaceJoinsRowsAndDeletesMultiRowSelections() = withEditor { editor ->
        val original = editor.text()
        editor.moveCursorTo(4, 0)
        editor.ime { it.deleteSurroundingText(1, 0) }
        assertEquals("row 4 joined row 3", original.lines()[3] + original.lines()[4], editor.line(3))
        key(editor, KeyEvent.KEYCODE_DEL)
        assertEquals(original.lines()[3].dropLast(1) + original.lines()[4], editor.line(3))
        editor.evaluate("window.editor.undo(), window.editor.undo(), true")
        assertEquals(original, editor.text())

        editor.select(2, 0, 5, 3)
        val deleted = editor.selectedText()
        key(editor, KeyEvent.KEYCODE_DEL)
        assertEquals(
            "the selection was deleted as a whole",
            original.replaceFirst(deleted, ""),
            editor.text(),
        )
        editor.evaluate("window.editor.undo(), true")
        assertEquals("undo restores it", original, editor.text())
    }

    // C4: the text editing panel. Arrow keys arrive as key events while the word under the cursor is composed;
    // "|<" / ">|" read the textarea and select its start or end; "Select all" is a context menu action.
    @Test
    fun editingPanelMovesTheCursorWithoutChangingText() = withEditor { editor ->
        val original = editor.text()
        editor.moveCursorTo(3, 7)
        markWordUnderCursor(editor)
        key(editor, KeyEvent.KEYCODE_DPAD_RIGHT)
        key(editor, KeyEvent.KEYCODE_DPAD_RIGHT)
        assertEquals("right moves one column each time", 3 to 9, editor.cursor())
        markWordUnderCursor(editor)
        key(editor, KeyEvent.KEYCODE_DPAD_DOWN)
        assertEquals("down keeps the column", 4 to 9, editor.cursor())
        key(editor, KeyEvent.KEYCODE_DPAD_LEFT)
        assertEquals(4 to 8, editor.cursor())

        // "|<" and ">|": the panel reads the extracted text and selects its start or end.
        val length = textareaValue(editor).length
        editor.ime {
            it.getExtractedText(android.view.inputmethod.ExtractedTextRequest(), 0)
            it.setSelection(0, 0)
        }
        assertEquals("|< goes to the start of the row", 4 to 0, editor.cursor())
        editor.ime {
            it.getExtractedText(android.view.inputmethod.ExtractedTextRequest(), 0)
            it.setSelection(length, length)
        }
        assertEquals(">| goes to the end of the row", 4 to original.lines()[4].length, editor.cursor())

        editor.ime { it.performContextMenuAction(android.R.id.selectAll) }
        assertEquals("select all selects the document", original, editor.selectedText())
        assertEquals("the text is unchanged", original, editor.text())
    }

    // C4 with Baidu (maintainer, 2026-10-14) and Sogou: their selection mode sends Shift on its own around arrow keys
    // that carry no Shift meta state (traced with Sogou on a 22120RN86C); the arrows must still extend the selection.
    @Test
    fun selectionModeArrowsWithAShiftSentOnItsOwnExtendTheSelection() = withEditor { editor ->
        val original = editor.text()
        editor.moveCursorTo(3, 6)
        rawKey(editor, KeyEvent.ACTION_DOWN, KeyEvent.KEYCODE_SHIFT_LEFT) // "Start selecting"
        repeat(3) { shiftedArrow(editor, KeyEvent.KEYCODE_DPAD_RIGHT) }
        assertEquals("alp", editor.selectedText())
        shiftedArrow(editor, KeyEvent.KEYCODE_DPAD_DOWN)
        assertEquals("the selection reaches the next row", 4 to 9, editor.cursor())
        assertTrue(editor.selectedText(), editor.selectedText().startsWith("alpha beta"))
        rawKey(editor, KeyEvent.ACTION_UP, KeyEvent.KEYCODE_SHIFT_LEFT) // "Stop selecting"
        key(editor, KeyEvent.KEYCODE_DPAD_RIGHT)
        assertEquals("after Shift up an arrow moves the cursor", "", editor.selectedText())
        assertEquals(original, editor.text())
    }

    // Keyboards that send Ctrl on its own: the Auto.js build of Ace 1.4.12 counted a held Ctrl key, so Ctrl+A selected
    // everything; the input connection now adds the held modifier to the key.
    @Test
    fun aCtrlSentOnItsOwnTurnsTheNextKeyIntoAShortcut() = withEditor { editor ->
        val original = editor.text()
        editor.moveCursorTo(3, 6)
        rawKey(editor, KeyEvent.ACTION_DOWN, KeyEvent.KEYCODE_CTRL_LEFT)
        rawKey(editor, KeyEvent.ACTION_DOWN, KeyEvent.KEYCODE_A)
        rawKey(editor, KeyEvent.ACTION_UP, KeyEvent.KEYCODE_A)
        rawKey(editor, KeyEvent.ACTION_UP, KeyEvent.KEYCODE_CTRL_LEFT)
        SystemClock.sleep(100)
        assertEquals("Ctrl+A selected everything", original, editor.selectedText())
        assertEquals("no character was typed", original, editor.text())
    }

    // C5: typing over a selection replaces it, also with a composition.
    @Test
    fun typingReplacesTheSelection() = withEditor { editor ->
        editor.select(3, 6, 3, 11)
        assertEquals("alpha", editor.selectedText())
        editor.ime { it.commitText("xyz", 1) }
        assertTrue(editor.line(3), editor.line(3).startsWith("line3 xyz beta"))
        editor.select(3, 10, 3, 14)
        assertEquals("beta", editor.selectedText())
        compose(editor, "c")
        compose(editor, "ce")
        compose(editor, "ces")
        editor.ime { it.commitText("测试", 1) }
        assertTrue(editor.line(3), editor.line(3).startsWith("line3 xyz 测试 gamma"))
    }

    // C7: pinyin compositions committed as Chinese characters.
    @Test
    fun pinyinCompositionsCommitChineseText() = withEditor { editor ->
        editor.moveCursorTo(EMPTY_ROW, 0)
        editor.ime { it.commitText("// ", 1) }
        for (prefix in listOf("n", "ni", "nih", "niha", "nihao")) compose(editor, prefix)
        assertTrue("the composition is shown in the document", editor.line(EMPTY_ROW).endsWith("nihao"))
        editor.ime { it.commitText("你好", 1) }
        for (prefix in listOf("s", "sh", "shi", "shij", "shiji", "shijie")) compose(editor, prefix)
        editor.ime { it.commitText("世界", 1) }
        assertEquals("// 你好世界", editor.line(EMPTY_ROW))
        assertEquals(EMPTY_ROW to 7, editor.cursor())
    }

    // C8: switching the keyboard language in the middle of a composition commits it once.
    @Test
    fun finishingACompositionKeepsItsTextOnce() = withEditor { editor ->
        editor.moveCursorTo(EMPTY_ROW, 0)
        for (prefix in listOf("z", "zh", "zho", "zhon", "zhong")) compose(editor, prefix)
        editor.ime { it.finishComposingText() }
        editor.ime { it.commitText("abc", 1) }
        assertEquals("zhongabc", editor.line(EMPTY_ROW))
    }

    // A2-10 item 16 (2026-10-14): a double tap while Gboard composed the word under the first tap, then closing the
    // keyboard, deleted the double-tapped word.
    @Test
    fun doubleTapDuringACompositionKeepsTheWordWhenTheKeyboardCloses() = withEditor { editor ->
        val original = editor.text()
        val undoDepth = editor.undoDepth()
        val word = editor.point(3, 8)
        editor.tap(word)
        SystemClock.sleep(300)
        markWordUnderCursor(editor)
        assertTrue("the double tap selects the word", editor.doubleTapSelects({ word }, "alpha"))
        // Gboard marks the word again, then finishes the composition when the keyboard closes.
        markWordUnderCursor(editor, staleCaret = true)
        editor.ime { it.finishComposingText() }
        SystemClock.sleep(300)
        assertEquals("the word stays", original, editor.text())
        assertEquals("nothing entered the undo history", undoDepth, editor.undoDepth())
    }

    // V5 (a): Gboard commits the composed word together with the dot ("greeter."); member completion still opens.
    @Test
    fun dotCommittedWithTheWordOpensMemberCompletion() = withEditor(
        "const greeter = { name: 'Ann', count: 1 };\n\n",
    ) { editor ->
        editor.moveCursorTo(1, 0)
        for (prefix in listOf("g", "gr", "gre", "gree", "greet", "greete", "greeter")) compose(editor, prefix)
        editor.ime { it.commitText("greeter.", 1) }
        assertTrue(
            "member completion opens",
            editor.waitFor(5_000L) {
                editor.evaluateBoolean(
                    "window.editor.completer && window.editor.completer.popup && window.editor.completer.popup.isOpen && " +
                        "(window.editor.completer.completions.filtered || []).some(function(item) { return item.caption === 'count' || item.value === 'count'; })",
                )
            },
        )
        assertEquals("greeter.", editor.line(1))
    }

    // C11: the inline completion preview is hidden while a composition is open and back after it.
    @Test
    fun inlinePreviewHidesDuringCompositions() = withEditor(
        COMPLETION_DOCUMENT,
        preferences = mapOf(AceEditorSmartHintPreferences.KEY_INLINE_COMPLETION_PREVIEW to true),
    ) { editor ->
        val row = COMPLETION_DOCUMENT.lines().size - 1
        editor.moveCursorTo(row, 0)
        editor.ime { it.commitText("al", 1) }
        editor.evaluate("window.editor.execCommand('startAutocomplete'), true")
        assertTrue("the preview is shown", editor.waitFor { ghostTextShown(editor) })
        compose(editor, "p")
        assertFalse("no preview while composing", ghostTextShown(editor))
        editor.ime { it.commitText("p", 1) }
        assertTrue("the preview is back", editor.waitFor { ghostTextShown(editor) || !popupOpen(editor) })
        assertTrue(editor.line(row), editor.line(row).startsWith("alp"))
    }

    // C12: the completion popup filters while the word is composed and switches to members after the dot.
    @Test
    fun completionFiltersWhileComposing() = withEditor { editor ->
        editor.moveCursorTo(EMPTY_ROW, 0)
        for (prefix in listOf("c", "co", "con", "cons")) compose(editor, prefix)
        editor.ime { it.commitText("cons", 1) }
        editor.evaluate("window.editor.execCommand('startAutocomplete'), true")
        assertTrue("the popup opens", editor.waitFor(5_000L) { popupOpen(editor) })
        for (prefix in listOf("conso", "consol", "console")) compose(editor, prefix.removePrefix("cons"))
        editor.ime { it.commitText("ole", 1) }
        assertEquals("console", editor.line(EMPTY_ROW))
        assertTrue(
            "console leads the list",
            editor.waitFor {
                editor.evaluateString(
                    "window.editor.completer && window.editor.completer.popup && window.editor.completer.popup.isOpen ? " +
                        "window.editor.completer.popup.getData(0).value : ''",
                ) == "console" || !popupOpen(editor)
            },
        )
    }

    // -----------------------------------------------------------------------------------------------------------------

    private fun withEditor(
        document: String = DOCUMENT,
        preferences: Map<String, Any?> = emptyMap(),
        body: (AceDeviceTestHarness) -> Unit,
    ) {
        AceDeviceTestHarness.open(document, preferences = preferences).use { editor ->
            Log.i(LOG_TAG, "device ${editor.device}")
            editor.focusEditor()
            body(editor)
        }
    }

    /** Types [word] the way Gboard does: a growing composition, committed. */
    private fun type(editor: AceDeviceTestHarness, word: String) {
        for (length in 1..word.length) compose(editor, word.substring(0, length))
        editor.ime { it.commitText(word, 1) }
    }

    private fun compose(editor: AceDeviceTestHarness, text: String) {
        editor.ime { it.setComposingText(text, 1) }
    }

    private fun space(editor: AceDeviceTestHarness) {
        editor.ime { it.commitText(" ", 1) }
    }

    private fun key(editor: AceDeviceTestHarness, keyCode: Int) {
        editor.ime { connection ->
            val time = SystemClock.uptimeMillis()
            connection.sendKeyEvent(KeyEvent(time, time, KeyEvent.ACTION_DOWN, keyCode, 0))
            connection.sendKeyEvent(KeyEvent(time, SystemClock.uptimeMillis(), KeyEvent.ACTION_UP, keyCode, 0))
        }
        SystemClock.sleep(100)
    }

    private fun rawKey(editor: AceDeviceTestHarness, action: Int, keyCode: Int) {
        editor.ime { connection ->
            val time = SystemClock.uptimeMillis()
            connection.sendKeyEvent(KeyEvent(time, time, action, keyCode, 0))
        }
    }

    /** An arrow as Sogou's selection mode sends it: Shift down, the arrow without a Shift meta state, Shift up. */
    private fun shiftedArrow(editor: AceDeviceTestHarness, keyCode: Int) {
        rawKey(editor, KeyEvent.ACTION_DOWN, KeyEvent.KEYCODE_SHIFT_LEFT)
        rawKey(editor, KeyEvent.ACTION_DOWN, keyCode)
        rawKey(editor, KeyEvent.ACTION_UP, keyCode)
        rawKey(editor, KeyEvent.ACTION_UP, KeyEvent.KEYCODE_SHIFT_LEFT)
        SystemClock.sleep(100)
    }

    private fun textareaValue(editor: AceDeviceTestHarness): String =
        editor.evaluateString("window.editor.textInput.getElement().value")

    /**
     * Gboard marks the word around its caret as a composition (setComposingRegion). With [staleCaret] the region is
     * computed from the textarea caret even when Ace has a selection, as Gboard does from the caret it was told about.
     */
    private fun markWordUnderCursor(editor: AceDeviceTestHarness, staleCaret: Boolean = false) {
        val region = editor.evaluateJson(
            """(function() {
                var textarea = window.editor.textInput.getElement();
                var value = textarea.value;
                var caret = ${if (staleCaret) "textarea.selectionStart" else "textarea.selectionEnd"};
                var start = caret, end = caret;
                while (start > 0 && /\w/.test(value.charAt(start - 1))) start--;
                while (end < value.length && /\w/.test(value.charAt(end))) end++;
                return { start: start, end: end };
            })()""",
        )
        val start = region.getInt("start")
        val end = region.getInt("end")
        if (end > start) editor.ime { it.setComposingRegion(start, end) }
    }

    private fun popupOpen(editor: AceDeviceTestHarness): Boolean =
        editor.evaluateBoolean("window.editor.completer && window.editor.completer.popup && window.editor.completer.popup.isOpen")

    private fun ghostTextShown(editor: AceDeviceTestHarness): Boolean =
        editor.evaluateBoolean("document.querySelector('.ace_ghost_text')")

    private fun assertNoDroppedImeSelection(editor: AceDeviceTestHarness) {
        val dropped = editor.hostEvents().filter { it.contains("imeTextInputSelectionDropped") }
        assertTrue("unexpected imeTextInputSelectionDropped: $dropped", dropped.isEmpty())
    }

    private companion object {
        const val LOG_TAG = "AutoJs6AceImeReplay"
        const val EMPTY_ROW = 8

        val DOCUMENT = (0 until 20).joinToString("\n") { row ->
            if (row == EMPTY_ROW) "" else "line$row alpha beta gamma delta $row"
        }

        val COMPLETION_DOCUMENT = (1..30).joinToString(" ", prefix = "var words = \"", postfix = "\";\n") { "alpha$it" }
    }
}
