package io.github.supermonster003.autojs6.plugin.ace.editor.core

import android.view.KeyEvent
import org.junit.Assert.assertEquals
import org.junit.Test

class AceImeModifierStateTest {

    private val down = KeyEvent.ACTION_DOWN
    private val up = KeyEvent.ACTION_UP
    private val shiftLeft = KeyEvent.META_SHIFT_ON or KeyEvent.META_SHIFT_LEFT_ON
    private val ctrlLeft = KeyEvent.META_CTRL_ON or KeyEvent.META_CTRL_LEFT_ON
    private val altLeft = KeyEvent.META_ALT_ON or KeyEvent.META_ALT_LEFT_ON
    private val metaLeft = KeyEvent.META_META_ON or KeyEvent.META_META_LEFT_ON

    // The key events Sogou's text editing panel sent in its selection mode on a 22120RN86C.
    @Test
    fun aShiftSentOnItsOwnSelectsWithTheFollowingArrows() {
        val state = AceImeModifierState()
        assertEquals(0, state.metaStateFor(down, KeyEvent.KEYCODE_SHIFT_LEFT, 0)) // "Start selecting"
        assertEquals(0, state.metaStateFor(down, KeyEvent.KEYCODE_SHIFT_LEFT, 0))
        assertEquals(shiftLeft, state.metaStateFor(down, KeyEvent.KEYCODE_DPAD_RIGHT, 0))
        assertEquals(shiftLeft, state.metaStateFor(up, KeyEvent.KEYCODE_DPAD_RIGHT, 0))
        assertEquals(0, state.metaStateFor(up, KeyEvent.KEYCODE_SHIFT_LEFT, 0))
        assertEquals("after Shift up arrows move again", 0, state.metaStateFor(down, KeyEvent.KEYCODE_DPAD_DOWN, 0))
    }

    @Test
    fun aHeldShiftOrAltJoinsKeysWithoutACharacterOnly() {
        val state = AceImeModifierState()
        state.metaStateFor(down, KeyEvent.KEYCODE_SHIFT_RIGHT, 0)
        val right = KeyEvent.META_SHIFT_ON or KeyEvent.META_SHIFT_RIGHT_ON
        listOf(
            KeyEvent.KEYCODE_DPAD_UP, KeyEvent.KEYCODE_MOVE_HOME, KeyEvent.KEYCODE_MOVE_END, KeyEvent.KEYCODE_PAGE_DOWN,
            KeyEvent.KEYCODE_TAB, KeyEvent.KEYCODE_ENTER, KeyEvent.KEYCODE_DEL,
        ).forEach {
            assertEquals(right, state.metaStateFor(down, it, 0))
        }
        assertEquals("letters keep their meta state", 0, state.metaStateFor(down, KeyEvent.KEYCODE_A, 0))
        assertEquals("digits keep their meta state", 0, state.metaStateFor(down, KeyEvent.KEYCODE_1, 0))
        state.metaStateFor(up, KeyEvent.KEYCODE_SHIFT_RIGHT, 0)
        state.metaStateFor(down, KeyEvent.KEYCODE_ALT_LEFT, 0)
        assertEquals(altLeft, state.metaStateFor(down, KeyEvent.KEYCODE_DPAD_DOWN, 0))
        assertEquals("Alt does not change typed letters", 0, state.metaStateFor(down, KeyEvent.KEYCODE_E, 0))
    }

    @Test
    fun aHeldCtrlOrMetaMakesShortcutsOfEveryKey() {
        val state = AceImeModifierState()
        state.metaStateFor(down, KeyEvent.KEYCODE_CTRL_LEFT, 0)
        assertEquals("Ctrl+Z", ctrlLeft, state.metaStateFor(down, KeyEvent.KEYCODE_Z, 0))
        assertEquals("Ctrl+A", ctrlLeft, state.metaStateFor(down, KeyEvent.KEYCODE_A, 0))
        state.metaStateFor(down, KeyEvent.KEYCODE_SHIFT_LEFT, 0)
        assertEquals("Ctrl+Shift+Z keeps both", ctrlLeft or shiftLeft, state.metaStateFor(down, KeyEvent.KEYCODE_Z, 0))
        state.metaStateFor(up, KeyEvent.KEYCODE_SHIFT_LEFT, 0)
        state.metaStateFor(up, KeyEvent.KEYCODE_CTRL_LEFT, 0)
        assertEquals("released", 0, state.metaStateFor(down, KeyEvent.KEYCODE_Z, 0))
        state.metaStateFor(down, KeyEvent.KEYCODE_META_LEFT, 0)
        assertEquals(metaLeft, state.metaStateFor(down, KeyEvent.KEYCODE_S, 0))
    }

    @Test
    fun aShiftHeldWithAnOwnCtrlJoinsLetters() {
        val state = AceImeModifierState()
        state.metaStateFor(down, KeyEvent.KEYCODE_SHIFT_LEFT, 0)
        assertEquals(KeyEvent.META_CTRL_ON or shiftLeft, state.metaStateFor(down, KeyEvent.KEYCODE_Z, KeyEvent.META_CTRL_ON))
    }

    @Test
    fun keyEventsWithTheirOwnModifiersOrWithoutHeldOnesAreUnchanged() {
        val state = AceImeModifierState()
        assertEquals("nothing held", 0, state.metaStateFor(down, KeyEvent.KEYCODE_DPAD_LEFT, 0))
        // Gboard sends the meta state with the arrow.
        assertEquals(shiftLeft, state.metaStateFor(down, KeyEvent.KEYCODE_DPAD_LEFT, shiftLeft))
        state.metaStateFor(down, KeyEvent.KEYCODE_SHIFT_LEFT, 0)
        val ctrlShift = KeyEvent.META_CTRL_ON or KeyEvent.META_SHIFT_ON
        assertEquals("an own Shift wins", ctrlShift, state.metaStateFor(down, KeyEvent.KEYCODE_DPAD_LEFT, ctrlShift))
        assertEquals(
            "other modifiers are kept",
            KeyEvent.META_CTRL_ON or shiftLeft,
            state.metaStateFor(down, KeyEvent.KEYCODE_DPAD_LEFT, KeyEvent.META_CTRL_ON),
        )
    }

    @Test
    fun bothKeysOfAModifierMustBeReleased() {
        val state = AceImeModifierState()
        state.metaStateFor(down, KeyEvent.KEYCODE_SHIFT_LEFT, 0)
        state.metaStateFor(down, KeyEvent.KEYCODE_SHIFT_RIGHT, 0)
        state.metaStateFor(up, KeyEvent.KEYCODE_SHIFT_LEFT, 0)
        assertEquals(
            KeyEvent.META_SHIFT_ON or KeyEvent.META_SHIFT_RIGHT_ON,
            state.metaStateFor(down, KeyEvent.KEYCODE_DPAD_LEFT, 0),
        )
        state.metaStateFor(up, KeyEvent.KEYCODE_SHIFT_RIGHT, 0)
        assertEquals(0, state.metaStateFor(down, KeyEvent.KEYCODE_DPAD_LEFT, 0))
        state.metaStateFor(down, KeyEvent.KEYCODE_CTRL_LEFT, 0)
        state.metaStateFor(down, KeyEvent.KEYCODE_CTRL_RIGHT, 0)
        state.metaStateFor(up, KeyEvent.KEYCODE_CTRL_RIGHT, 0)
        assertEquals(ctrlLeft, state.metaStateFor(down, KeyEvent.KEYCODE_Z, 0))
    }
}
