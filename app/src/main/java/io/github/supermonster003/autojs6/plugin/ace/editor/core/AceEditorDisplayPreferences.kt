package io.github.supermonster003.autojs6.plugin.ace.editor.core

import android.content.SharedPreferences

object AceEditorDisplayPreferences {

    const val KEY_ACE_WORD_WRAP_ENABLED = "key_\$_ace_word_wrap_enabled"
    const val KEY_ACE_LINE_NUMBERS_ENABLED = "key_\$_ace_line_numbers_enabled"
    const val KEY_ACE_PRINT_MARGIN_ENABLED = "key_\$_ace_print_margin_enabled"
    const val KEY_ACE_INDENT_GUIDES_ENABLED = "key_\$_ace_indent_guides_enabled"
    const val KEY_ACE_FONT_LIGATURES_ENABLED = "key_\$_ace_font_ligatures_enabled"
    const val KEY_ACE_FONT_STYLES_ENABLED = "key_\$_ace_font_styles_enabled"
    const val KEY_BREAKPOINT_MARKERS_ENABLED = "key_\$_editor_breakpoint_markers_enabled"
    const val KEY_FOLD_MARKERS_ENABLED = "key_\$_editor_fold_markers_enabled"
    const val KEY_GUTTER_WIDTH_MODE = "key_\$_editor_gutter_width_mode"
    const val KEY_WORD_WRAP_INDENT_STYLE = "key_\$_editor_word_wrap_indent_style"

    const val GUTTER_WIDTH_MODE_DYNAMIC = "dynamic"
    const val WORD_WRAP_INDENT_STYLE_CONTINUATION = "continuation"

    fun isWordWrapEnabled(preferences: SharedPreferences) =
        preferences.getBoolean(KEY_ACE_WORD_WRAP_ENABLED, false)

    fun wordWrapIndentStyle(preferences: SharedPreferences) =
        preferences.getString(KEY_WORD_WRAP_INDENT_STYLE, WORD_WRAP_INDENT_STYLE_CONTINUATION)
            ?.takeIf { it == WORD_WRAP_INDENT_STYLE_CONTINUATION || it == "classic" }
            ?: WORD_WRAP_INDENT_STYLE_CONTINUATION

    fun isLineNumbersEnabled(preferences: SharedPreferences) =
        preferences.getBoolean(KEY_ACE_LINE_NUMBERS_ENABLED, true)

    fun isPrintMarginEnabled(preferences: SharedPreferences) =
        preferences.getBoolean(KEY_ACE_PRINT_MARGIN_ENABLED, false)

    fun isIndentGuidesEnabled(preferences: SharedPreferences) =
        preferences.getBoolean(KEY_ACE_INDENT_GUIDES_ENABLED, true)

    fun isBreakpointMarkersEnabled(preferences: SharedPreferences) =
        preferences.getBoolean(KEY_BREAKPOINT_MARKERS_ENABLED, true)

    fun isFoldMarkersEnabled(preferences: SharedPreferences) =
        preferences.getBoolean(KEY_FOLD_MARKERS_ENABLED, true)

    fun gutterWidthMode(preferences: SharedPreferences) =
        preferences.getString(KEY_GUTTER_WIDTH_MODE, GUTTER_WIDTH_MODE_DYNAMIC)
            ?.takeIf { it == GUTTER_WIDTH_MODE_DYNAMIC || it == "fixed" }
            ?: GUTTER_WIDTH_MODE_DYNAMIC

    fun isFontLigaturesEnabled(preferences: SharedPreferences) =
        preferences.getBoolean(KEY_ACE_FONT_LIGATURES_ENABLED, true)

    fun isFontStylesEnabled(preferences: SharedPreferences) =
        preferences.getBoolean(KEY_ACE_FONT_STYLES_ENABLED, true)
}
