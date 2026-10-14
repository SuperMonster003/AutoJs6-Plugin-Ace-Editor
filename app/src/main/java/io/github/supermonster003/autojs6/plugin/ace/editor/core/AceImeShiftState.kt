package io.github.supermonster003.autojs6.plugin.ace.editor.core

import android.view.KeyEvent

/**
 * The Shift key some input methods send on its own through `InputConnection.sendKeyEvent`.
 *
 * The selection mode of the text editing panels of Sogou and Baidu (traced with Sogou on a 22120RN86C) sends Shift down,
 * then the arrow key without a Shift meta state, then Shift up. WebView builds the key event for the page from each
 * Android key event's own meta state, so the arrow reached Ace without Shift and moved the cursor instead of extending
 * the selection; only line start / end, which these panels send as selections, selected (Baidu, maintainer test C4,
 * 2026-10-14). Gboard sends the Shift meta state with the arrow and is not affected.
 */
internal class AceImeShiftState {

    private var heldShiftMeta = 0

    /** Records Shift key events and returns the meta state to send [keyCode] with. */
    fun metaStateFor(action: Int, keyCode: Int, metaState: Int): Int {
        when (keyCode) {
            KeyEvent.KEYCODE_SHIFT_LEFT, KeyEvent.KEYCODE_SHIFT_RIGHT -> {
                val side = if (keyCode == KeyEvent.KEYCODE_SHIFT_LEFT) KeyEvent.META_SHIFT_LEFT_ON else KeyEvent.META_SHIFT_RIGHT_ON
                heldShiftMeta = when (action) {
                    KeyEvent.ACTION_DOWN -> heldShiftMeta or KeyEvent.META_SHIFT_ON or side
                    KeyEvent.ACTION_UP -> (heldShiftMeta and side.inv()).let { remaining ->
                        if (remaining and (KeyEvent.META_SHIFT_LEFT_ON or KeyEvent.META_SHIFT_RIGHT_ON) == 0) 0 else remaining
                    }
                    else -> heldShiftMeta
                }
                return metaState
            }
        }
        if (heldShiftMeta == 0 || metaState and KeyEvent.META_SHIFT_ON != 0 || keyCode !in NAVIGATION_KEYS) {
            return metaState
        }
        return metaState or heldShiftMeta
    }

    private companion object {
        val NAVIGATION_KEYS = setOf(
            KeyEvent.KEYCODE_DPAD_LEFT,
            KeyEvent.KEYCODE_DPAD_RIGHT,
            KeyEvent.KEYCODE_DPAD_UP,
            KeyEvent.KEYCODE_DPAD_DOWN,
            KeyEvent.KEYCODE_MOVE_HOME,
            KeyEvent.KEYCODE_MOVE_END,
            KeyEvent.KEYCODE_PAGE_UP,
            KeyEvent.KEYCODE_PAGE_DOWN,
        )
    }
}
