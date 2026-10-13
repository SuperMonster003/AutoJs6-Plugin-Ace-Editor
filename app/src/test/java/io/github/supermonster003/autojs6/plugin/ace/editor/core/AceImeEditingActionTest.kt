package io.github.supermonster003.autojs6.plugin.ace.editor.core

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class AceImeEditingActionTest {

    // Offsets as Gboard sent them on an XQ-AT72 for the textarea "\nconst a = 1;\n\n" (15 characters).
    @Test
    fun gboardStartAndEndButtonsAreLineBoundaries() {
        assertEquals(AceImeEditingAction.LineStart, AceImeEditingAction.lineBoundary(0, 0, 15))
        assertEquals(AceImeEditingAction.LineEnd, AceImeEditingAction.lineBoundary(15, 15, 15))
    }

    @Test
    fun theSelectModeKeepsItsAnchor() {
        assertEquals(AceImeEditingAction.LineEnd, AceImeEditingAction.lineBoundary(4, 15, 15))
        assertEquals(AceImeEditingAction.LineStart, AceImeEditingAction.lineBoundary(0, 4, 15))
    }

    @Test
    fun otherSelectionsAreNoLineBoundaries() {
        assertNull("caret moves inside the text", AceImeEditingAction.lineBoundary(4, 4, 15))
        assertNull("the whole text", AceImeEditingAction.lineBoundary(0, 15, 15))
        assertNull("no extracted text was read just before", AceImeEditingAction.lineBoundary(0, 0, -1))
        assertNull("an empty text", AceImeEditingAction.lineBoundary(0, 0, 0))
    }
}
