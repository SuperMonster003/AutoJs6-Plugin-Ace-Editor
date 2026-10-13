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

    // Ace 1.44.0 options (Roadmap-Ace-1.44.0.md A5, A7-1). Hosts without these settings use the defaults.
    const val KEY_ACE_SVG_GUTTER_ICONS_ENABLED = "key_\$_ace_svg_gutter_icons_enabled"
    const val KEY_ACE_HIGHLIGHT_INDENT_GUIDES_ENABLED = "key_\$_ace_highlight_indent_guides_enabled"
    const val KEY_ACE_CUSTOM_SCROLLBAR_ENABLED = "key_\$_ace_custom_scrollbar_enabled"
    const val KEY_ACE_WHITESPACES_IN_SELECTION_ENABLED = "key_\$_ace_whitespaces_in_selection_enabled"
    const val KEY_ACE_TOUCH_MAGNIFIER_ENABLED = "key_\$_ace_touch_magnifier_enabled"

    const val DEFAULT_SVG_GUTTER_ICONS_ENABLED = true
    const val DEFAULT_HIGHLIGHT_INDENT_GUIDES_ENABLED = true
    const val DEFAULT_CUSTOM_SCROLLBAR_ENABLED = true
    const val DEFAULT_WHITESPACES_IN_SELECTION_ENABLED = true
    const val DEFAULT_TOUCH_MAGNIFIER_ENABLED = false

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

    fun isSvgGutterIconsEnabled(preferences: SharedPreferences) =
        preferences.getBoolean(KEY_ACE_SVG_GUTTER_ICONS_ENABLED, DEFAULT_SVG_GUTTER_ICONS_ENABLED)

    fun isHighlightIndentGuidesEnabled(preferences: SharedPreferences) =
        preferences.getBoolean(KEY_ACE_HIGHLIGHT_INDENT_GUIDES_ENABLED, DEFAULT_HIGHLIGHT_INDENT_GUIDES_ENABLED)

    fun isCustomScrollbarEnabled(preferences: SharedPreferences) =
        preferences.getBoolean(KEY_ACE_CUSTOM_SCROLLBAR_ENABLED, DEFAULT_CUSTOM_SCROLLBAR_ENABLED)

    fun isWhitespacesInSelectionEnabled(preferences: SharedPreferences) =
        preferences.getBoolean(KEY_ACE_WHITESPACES_IN_SELECTION_ENABLED, DEFAULT_WHITESPACES_IN_SELECTION_ENABLED)

    fun isTouchMagnifierEnabled(preferences: SharedPreferences) =
        preferences.getBoolean(KEY_ACE_TOUCH_MAGNIFIER_ENABLED, DEFAULT_TOUCH_MAGNIFIER_ENABLED)
}
