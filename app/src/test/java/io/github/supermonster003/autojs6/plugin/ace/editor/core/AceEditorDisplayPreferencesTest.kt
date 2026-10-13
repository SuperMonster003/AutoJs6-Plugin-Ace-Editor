package io.github.supermonster003.autojs6.plugin.ace.editor.core

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class AceEditorDisplayPreferencesTest {

    @Test
    fun ace1440OptionsUseRoadmapDefaultsWhenTheHostHasNoValue() {
        val preferences = MapPreferences()

        assertTrue(AceEditorDisplayPreferences.isSvgGutterIconsEnabled(preferences))
        assertTrue(AceEditorDisplayPreferences.isHighlightIndentGuidesEnabled(preferences))
        assertTrue(AceEditorDisplayPreferences.isCustomScrollbarEnabled(preferences))
        assertTrue(AceEditorDisplayPreferences.isWhitespacesInSelectionEnabled(preferences))
        assertFalse(AceEditorDisplayPreferences.isTouchMagnifierEnabled(preferences))
        assertTrue(AceEditorDisplayPreferences.isScrollbarAutoHideEnabled(preferences))
    }

    @Test
    fun ace1440OptionsFollowHostValues() {
        val preferences = MapPreferences(
            AceEditorDisplayPreferences.KEY_ACE_SVG_GUTTER_ICONS_ENABLED to false,
            AceEditorDisplayPreferences.KEY_ACE_HIGHLIGHT_INDENT_GUIDES_ENABLED to false,
            AceEditorDisplayPreferences.KEY_ACE_CUSTOM_SCROLLBAR_ENABLED to false,
            AceEditorDisplayPreferences.KEY_ACE_WHITESPACES_IN_SELECTION_ENABLED to false,
            AceEditorDisplayPreferences.KEY_ACE_TOUCH_MAGNIFIER_ENABLED to true,
            AceEditorDisplayPreferences.KEY_ACE_SCROLLBAR_AUTO_HIDE_ENABLED to false,
        )

        assertFalse(AceEditorDisplayPreferences.isSvgGutterIconsEnabled(preferences))
        assertFalse(AceEditorDisplayPreferences.isHighlightIndentGuidesEnabled(preferences))
        assertFalse(AceEditorDisplayPreferences.isCustomScrollbarEnabled(preferences))
        assertFalse(AceEditorDisplayPreferences.isWhitespacesInSelectionEnabled(preferences))
        assertTrue(AceEditorDisplayPreferences.isTouchMagnifierEnabled(preferences))
        assertFalse(AceEditorDisplayPreferences.isScrollbarAutoHideEnabled(preferences))
    }

    @Test
    fun ace1440OptionKeysFollowTheHostNamingScheme() {
        assertEquals(
            listOf(
                "key_\$_ace_svg_gutter_icons_enabled",
                "key_\$_ace_highlight_indent_guides_enabled",
                "key_\$_ace_custom_scrollbar_enabled",
                "key_\$_ace_whitespaces_in_selection_enabled",
                "key_\$_ace_touch_magnifier_enabled",
                "key_\$_ace_scrollbar_auto_hide_enabled",
            ),
            listOf(
                AceEditorDisplayPreferences.KEY_ACE_SVG_GUTTER_ICONS_ENABLED,
                AceEditorDisplayPreferences.KEY_ACE_HIGHLIGHT_INDENT_GUIDES_ENABLED,
                AceEditorDisplayPreferences.KEY_ACE_CUSTOM_SCROLLBAR_ENABLED,
                AceEditorDisplayPreferences.KEY_ACE_WHITESPACES_IN_SELECTION_ENABLED,
                AceEditorDisplayPreferences.KEY_ACE_TOUCH_MAGNIFIER_ENABLED,
                AceEditorDisplayPreferences.KEY_ACE_SCROLLBAR_AUTO_HIDE_ENABLED,
            ),
        )
    }
}
