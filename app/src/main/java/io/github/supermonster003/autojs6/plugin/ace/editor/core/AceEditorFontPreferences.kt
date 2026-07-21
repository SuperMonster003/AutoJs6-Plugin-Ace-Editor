package io.github.supermonster003.autojs6.plugin.ace.editor.core

import android.content.SharedPreferences

object AceEditorFontPreferences {

    const val KEY_ACE_EDITOR_FONT = "key_\$_ace_editor_font"
    private val VALID_FONT_ID = Regex("^[a-z0-9][a-z0-9_]{0,63}$")

    fun getId(preferences: SharedPreferences): String =
        preferences.getString(KEY_ACE_EDITOR_FONT, AceEditorFont.IOSEVKA.preferenceValue)
            ?.takeIf(VALID_FONT_ID::matches)
            ?: AceEditorFont.IOSEVKA.preferenceValue

    fun get(preferences: SharedPreferences): AceEditorFont =
        AceEditorFont.fromPreferenceValue(getId(preferences))

    fun setId(preferences: SharedPreferences, fontId: String) {
        require(VALID_FONT_ID.matches(fontId)) { "Invalid ACE editor font id: $fontId" }
        preferences.edit().putString(KEY_ACE_EDITOR_FONT, fontId).apply()
    }
}
