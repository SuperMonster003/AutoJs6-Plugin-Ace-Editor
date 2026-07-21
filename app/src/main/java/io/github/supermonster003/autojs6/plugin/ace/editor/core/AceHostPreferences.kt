package io.github.supermonster003.autojs6.plugin.ace.editor.core

import android.content.Context
import android.content.SharedPreferences

internal fun Context.defaultHostPreferences(): SharedPreferences = getSharedPreferences(
    "${packageName}_preferences",
    Context.MODE_PRIVATE,
)

internal object AceEditorPinchPreferences {
    private const val KEY_CHANGE_TEXT_SIZE_ENABLED = "key_\$_editor_pinch_to_zoom_change_text_size_enabled"
    private const val KEY_DISABLE = "key_\$_editor_pinch_to_zoom_disable"
    private const val KEY_STRATEGY = "key_\$_editor_pinch_to_zoom_strategy"

    fun isChangeTextSizeEnabled(preferences: SharedPreferences): Boolean {
        if (preferences.contains(KEY_CHANGE_TEXT_SIZE_ENABLED)) {
            return preferences.getBoolean(KEY_CHANGE_TEXT_SIZE_ENABLED, true)
        }
        return preferences.getString(KEY_STRATEGY, null) != KEY_DISABLE
    }
}

internal object AceEditorTextLoadPolicy {
    const val ACE_UNSAFE_LINE_LENGTH = 64 * 1024
    const val ACE_LIGHTWEIGHT_DOCUMENT_LENGTH = 256 * 1024

    fun requiresAceLightweightMode(text: CharSequence): Boolean =
        text.length >= ACE_LIGHTWEIGHT_DOCUMENT_LENGTH || hasAceUnsafeLine(text)

    fun hasAceUnsafeLine(text: CharSequence): Boolean {
        var currentLineLength = 0
        text.forEach { char ->
            if (char == '\n' || char == '\r') {
                currentLineLength = 0
            } else if (++currentLineLength > ACE_UNSAFE_LINE_LENGTH) {
                return true
            }
        }
        return false
    }
}
