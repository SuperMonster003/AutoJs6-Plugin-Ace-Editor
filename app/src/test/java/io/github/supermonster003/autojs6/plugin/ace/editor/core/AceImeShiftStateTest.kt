package io.github.supermonster003.autojs6.plugin.ace.editor.core

import android.view.KeyEvent
import org.junit.Assert.assertEquals
import org.junit.Test

class AceImeShiftStateTest {

    private val down = KeyEvent.ACTION_DOWN
    private val up = KeyEvent.ACTION_UP
    private val shifted = KeyEvent.META_SHIFT_ON or KeyEvent.META_SHIFT_LEFT_ON

    // The key events Sogou's text editing panel sent in its selection mode on a 22120RN86C.
    @Test
    fun aShiftSentOnItsOwnSelectsWithTheFollowingArrows() {
        val state = AceImeShiftState()
        assertEquals(0, state.metaStateFor(down, KeyEvent.KEYCODE_SHIFT_LEFT, 0)) // "Start selecting"
        assertEquals(0, state.metaStateFor(down, KeyEvent.KEYCODE_SHIFT_LEFT, 0))
        assertEquals(shifted, state.metaStateFor(down, KeyEvent.KEYCODE_DPAD_RIGHT, 0))
        assertEquals(shifted, state.metaStateFor(up, KeyEvent.KEYCODE_DPAD_RIGHT, 0))
        assertEquals(0, state.metaStateFor(up, KeyEvent.KEYCODE_SHIFT_LEFT, 0))
        assertEquals("after Shift up arrows move again", 0, state.metaStateFor(down, KeyEvent.KEYCODE_DPAD_DOWN, 0))
    }

    @Test
    fun onlyNavigationKeysTakeTheHeldShift() {
        val state = AceImeShiftState()
        state.metaStateFor(down, KeyEvent.KEYCODE_SHIFT_RIGHT, 0)
        val right = KeyEvent.META_SHIFT_ON or KeyEvent.META_SHIFT_RIGHT_ON
        listOf(KeyEvent.KEYCODE_DPAD_UP, KeyEvent.KEYCODE_MOVE_HOME, KeyEvent.KEYCODE_MOVE_END, KeyEvent.KEYCODE_PAGE_DOWN).forEach {
            assertEquals(right, state.metaStateFor(down, it, 0))
        }
        assertEquals("letters keep their meta state", 0, state.metaStateFor(down, KeyEvent.KEYCODE_A, 0))
        assertEquals("deletion keeps its meta state", 0, state.metaStateFor(down, KeyEvent.KEYCODE_DEL, 0))
    }

    @Test
    fun keyEventsWithTheirOwnShiftOrWithoutAHeldShiftAreUnchanged() {
        val state = AceImeShiftState()
        assertEquals("no Shift held", 0, state.metaStateFor(down, KeyEvent.KEYCODE_DPAD_LEFT, 0))
        // Gboard sends the meta state with the arrow.
        assertEquals(shifted, state.metaStateFor(down, KeyEvent.KEYCODE_DPAD_LEFT, shifted))
        state.metaStateFor(down, KeyEvent.KEYCODE_SHIFT_LEFT, 0)
        val ctrlShift = KeyEvent.META_CTRL_ON or KeyEvent.META_SHIFT_ON
        assertEquals("an own Shift wins", ctrlShift, state.metaStateFor(down, KeyEvent.KEYCODE_DPAD_LEFT, ctrlShift))
        assertEquals("other modifiers are kept", KeyEvent.META_CTRL_ON or shifted, state.metaStateFor(down, KeyEvent.KEYCODE_DPAD_LEFT, KeyEvent.META_CTRL_ON))
    }

    @Test
    fun bothShiftKeysMustBeReleased() {
        val state = AceImeShiftState()
        state.metaStateFor(down, KeyEvent.KEYCODE_SHIFT_LEFT, 0)
        state.metaStateFor(down, KeyEvent.KEYCODE_SHIFT_RIGHT, 0)
        state.metaStateFor(up, KeyEvent.KEYCODE_SHIFT_LEFT, 0)
        assertEquals(
            KeyEvent.META_SHIFT_ON or KeyEvent.META_SHIFT_RIGHT_ON,
            state.metaStateFor(down, KeyEvent.KEYCODE_DPAD_LEFT, 0),
        )
        state.metaStateFor(up, KeyEvent.KEYCODE_SHIFT_RIGHT, 0)
        assertEquals(0, state.metaStateFor(down, KeyEvent.KEYCODE_DPAD_LEFT, 0))
    }
}
