package io.github.supermonster003.autojs6.plugin.ace.editor.core

import android.content.SharedPreferences
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
    }

    @Test
    fun ace1440OptionsFollowHostValues() {
        val preferences = MapPreferences(
            AceEditorDisplayPreferences.KEY_ACE_SVG_GUTTER_ICONS_ENABLED to false,
            AceEditorDisplayPreferences.KEY_ACE_HIGHLIGHT_INDENT_GUIDES_ENABLED to false,
            AceEditorDisplayPreferences.KEY_ACE_CUSTOM_SCROLLBAR_ENABLED to false,
            AceEditorDisplayPreferences.KEY_ACE_WHITESPACES_IN_SELECTION_ENABLED to false,
            AceEditorDisplayPreferences.KEY_ACE_TOUCH_MAGNIFIER_ENABLED to true,
        )

        assertFalse(AceEditorDisplayPreferences.isSvgGutterIconsEnabled(preferences))
        assertFalse(AceEditorDisplayPreferences.isHighlightIndentGuidesEnabled(preferences))
        assertFalse(AceEditorDisplayPreferences.isCustomScrollbarEnabled(preferences))
        assertFalse(AceEditorDisplayPreferences.isWhitespacesInSelectionEnabled(preferences))
        assertTrue(AceEditorDisplayPreferences.isTouchMagnifierEnabled(preferences))
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
            ),
            listOf(
                AceEditorDisplayPreferences.KEY_ACE_SVG_GUTTER_ICONS_ENABLED,
                AceEditorDisplayPreferences.KEY_ACE_HIGHLIGHT_INDENT_GUIDES_ENABLED,
                AceEditorDisplayPreferences.KEY_ACE_CUSTOM_SCROLLBAR_ENABLED,
                AceEditorDisplayPreferences.KEY_ACE_WHITESPACES_IN_SELECTION_ENABLED,
                AceEditorDisplayPreferences.KEY_ACE_TOUCH_MAGNIFIER_ENABLED,
            ),
        )
    }

    private class MapPreferences(vararg values: Pair<String, Any>) : SharedPreferences {
        private val values = mapOf(*values)

        override fun getAll(): Map<String, *> = values
        override fun getString(key: String?, defValue: String?) = values[key] as? String ?: defValue
        override fun getStringSet(key: String?, defValues: Set<String>?) = defValues
        override fun getInt(key: String?, defValue: Int) = values[key] as? Int ?: defValue
        override fun getLong(key: String?, defValue: Long) = values[key] as? Long ?: defValue
        override fun getFloat(key: String?, defValue: Float) = values[key] as? Float ?: defValue
        override fun getBoolean(key: String?, defValue: Boolean) = values[key] as? Boolean ?: defValue
        override fun contains(key: String?) = values.containsKey(key)
        override fun edit(): SharedPreferences.Editor = throw UnsupportedOperationException()
        override fun registerOnSharedPreferenceChangeListener(
            listener: SharedPreferences.OnSharedPreferenceChangeListener?,
        ) = Unit
        override fun unregisterOnSharedPreferenceChangeListener(
            listener: SharedPreferences.OnSharedPreferenceChangeListener?,
        ) = Unit
    }
}
