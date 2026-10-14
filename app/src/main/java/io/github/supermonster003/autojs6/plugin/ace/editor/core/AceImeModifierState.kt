package io.github.supermonster003.autojs6.plugin.ace.editor.core

import android.view.KeyEvent

/**
 * Modifier keys some input methods send on their own through `InputConnection.sendKeyEvent`.
 *
 * WebView builds the page's key events from each Android key event's own meta state, so a key sent between a separate
 * modifier down and up reached Ace without that modifier. The selection mode of the text editing panels of Sogou and
 * Baidu sends Shift down, then the arrow key without a Shift meta state, then Shift up, and the arrows moved the cursor
 * instead of extending the selection (Sogou traced on a 22120RN86C, Baidu maintainer test C4, 2026-10-14). Some
 * keyboards send Ctrl, Alt or Meta the same way for shortcuts. The Auto.js build of Ace 1.4.12 counted modifier keys
 * that were down and not yet released (its `lib/event` customization); this restores that at the input connection.
 *
 * Ctrl and Meta join every key, as they never produce a character. Shift and Alt join keys that produce no character
 * (navigation, Tab, Enter, deletion, Escape) and chords with Ctrl or Meta, so typed letters stay as they are.
 */
internal class AceImeModifierState {

    private var heldMeta = 0

    /** Records modifier key events and returns the meta state to send [keyCode] with. */
    fun metaStateFor(action: Int, keyCode: Int, metaState: Int): Int {
        val modifier = MODIFIER_KEYS[keyCode]
        if (modifier != null) {
            heldMeta = when (action) {
                KeyEvent.ACTION_DOWN -> heldMeta or modifier.family.on or modifier.side
                KeyEvent.ACTION_UP -> release(modifier)
                else -> heldMeta
            }
            return metaState
        }
        if (heldMeta == 0) {
            return metaState
        }
        var added = 0
        for (family in FAMILIES) {
            val held = heldMeta and family.mask
            if (held != 0 && metaState and family.on == 0) {
                added = added or held
            }
        }
        val chord = (metaState or added) and (KeyEvent.META_CTRL_ON or KeyEvent.META_META_ON) != 0
        if (!chord && keyCode !in NON_CHARACTER_KEYS) {
            added = added and (SHIFT.mask or ALT.mask).inv()
        }
        return metaState or added
    }

    private fun release(modifier: ModifierKey): Int {
        val remaining = heldMeta and modifier.side.inv()
        return if (remaining and modifier.family.sides == 0) remaining and modifier.family.on.inv() else remaining
    }

    private class Family(val on: Int, val sides: Int) {
        val mask: Int get() = on or sides
    }

    private class ModifierKey(val family: Family, val side: Int)

    private companion object {
        val SHIFT = Family(KeyEvent.META_SHIFT_ON, KeyEvent.META_SHIFT_LEFT_ON or KeyEvent.META_SHIFT_RIGHT_ON)
        val CTRL = Family(KeyEvent.META_CTRL_ON, KeyEvent.META_CTRL_LEFT_ON or KeyEvent.META_CTRL_RIGHT_ON)
        val ALT = Family(KeyEvent.META_ALT_ON, KeyEvent.META_ALT_LEFT_ON or KeyEvent.META_ALT_RIGHT_ON)
        val META = Family(KeyEvent.META_META_ON, KeyEvent.META_META_LEFT_ON or KeyEvent.META_META_RIGHT_ON)
        val FAMILIES = listOf(SHIFT, CTRL, ALT, META)

        val MODIFIER_KEYS = mapOf(
            KeyEvent.KEYCODE_SHIFT_LEFT to ModifierKey(SHIFT, KeyEvent.META_SHIFT_LEFT_ON),
            KeyEvent.KEYCODE_SHIFT_RIGHT to ModifierKey(SHIFT, KeyEvent.META_SHIFT_RIGHT_ON),
            KeyEvent.KEYCODE_CTRL_LEFT to ModifierKey(CTRL, KeyEvent.META_CTRL_LEFT_ON),
            KeyEvent.KEYCODE_CTRL_RIGHT to ModifierKey(CTRL, KeyEvent.META_CTRL_RIGHT_ON),
            KeyEvent.KEYCODE_ALT_LEFT to ModifierKey(ALT, KeyEvent.META_ALT_LEFT_ON),
            KeyEvent.KEYCODE_ALT_RIGHT to ModifierKey(ALT, KeyEvent.META_ALT_RIGHT_ON),
            KeyEvent.KEYCODE_META_LEFT to ModifierKey(META, KeyEvent.META_META_LEFT_ON),
            KeyEvent.KEYCODE_META_RIGHT to ModifierKey(META, KeyEvent.META_META_RIGHT_ON),
        )

        val NON_CHARACTER_KEYS = setOf(
            KeyEvent.KEYCODE_DPAD_LEFT,
            KeyEvent.KEYCODE_DPAD_RIGHT,
            KeyEvent.KEYCODE_DPAD_UP,
            KeyEvent.KEYCODE_DPAD_DOWN,
            KeyEvent.KEYCODE_MOVE_HOME,
            KeyEvent.KEYCODE_MOVE_END,
            KeyEvent.KEYCODE_PAGE_UP,
            KeyEvent.KEYCODE_PAGE_DOWN,
            KeyEvent.KEYCODE_TAB,
            KeyEvent.KEYCODE_ENTER,
            KeyEvent.KEYCODE_NUMPAD_ENTER,
            KeyEvent.KEYCODE_DEL,
            KeyEvent.KEYCODE_FORWARD_DEL,
            KeyEvent.KEYCODE_ESCAPE,
            KeyEvent.KEYCODE_INSERT,
        )
    }
}
