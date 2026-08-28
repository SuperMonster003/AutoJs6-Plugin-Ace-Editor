package io.github.supermonster003.autojs6.plugin.ace.editor.core.lsp

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Test

class AceTypeScriptCodeActionTest {

    @Test
    fun preparesBoundedAutoImportWithContentIdentity() {
        val base = "const value = sharedAnswer;\n"
        val imported = "import { sharedAnswer } from './shared';\n\n"
        val prepared = requireNotNull(
            action(AceTypeScriptCodeAction.TextEdit(0, 0, imported)).prepare(base),
        )

        assertEquals(imported + base, prepared.resultText)
        assertEquals(64, prepared.baseContentSha256.length)
        assertEquals(64, prepared.resultContentSha256.length)
        assertNotEquals(prepared.baseContentSha256, prepared.resultContentSha256)
    }

    @Test
    fun rejectsOverlappingAndUnsortedEdits() {
        val base = "abcdefghij"
        assertNull(
            action(
                AceTypeScriptCodeAction.TextEdit(1, 5, "x"),
                AceTypeScriptCodeAction.TextEdit(4, 7, "y"),
            ).prepare(base),
        )
        assertNull(
            action(
                AceTypeScriptCodeAction.TextEdit(6, 7, "x"),
                AceTypeScriptCodeAction.TextEdit(2, 3, "y"),
            ).prepare(base),
        )
    }

    @Test
    fun rejectsStaleOffsetsSurrogateSplitsAndReplacementBudgets() {
        val base = "a😀b"
        val emojiOffset = base.indexOf("😀")
        assertNull(
            action(AceTypeScriptCodeAction.TextEdit(emojiOffset, emojiOffset + 1, "x"))
                .prepare(base),
        )
        assertNull(
            action(AceTypeScriptCodeAction.TextEdit(0, base.length + 1, "x")).prepare(base),
        )
        assertNull(
            action(
                AceTypeScriptCodeAction.TextEdit(
                    0,
                    0,
                    "x".repeat(AceTypeScriptCodeAction.MAX_REPLACEMENT_TEXT_BYTES + 1),
                ),
            ).prepare(base),
        )
    }

    @Test
    fun acceptsOnlyThePublishedWireKinds() {
        assertNotNull(AceTypeScriptCodeAction.kindFromWire("autoImport"))
        assertNotNull(AceTypeScriptCodeAction.kindFromWire("spellingCorrection"))
        assertNull(AceTypeScriptCodeAction.kindFromWire("rename"))
    }

    private fun action(vararg edits: AceTypeScriptCodeAction.TextEdit) =
        AceTypeScriptCodeAction(
            kind = AceTypeScriptCodeAction.Kind.AUTO_IMPORT,
            title = "Add import from './shared'",
            diagnosticCode = 2304,
            edits = edits.toList(),
        )
}
