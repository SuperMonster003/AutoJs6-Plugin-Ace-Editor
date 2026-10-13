package io.github.supermonster003.autojs6.plugin.ace.editor.core

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class AceEditorSmartHintPreferencesTest {

    @Test
    fun ace1440SmartHintOptionsUseRoadmapDefaults() {
        val preferences = MapPreferences()

        assertTrue(AceEditorSmartHintPreferences.isSymbolHighlightEnabled(preferences))
        assertFalse(AceEditorSmartHintPreferences.isInlineCompletionPreviewEnabled(preferences))
    }

    @Test
    fun ace1440SmartHintOptionsFollowHostValues() {
        val preferences = MapPreferences(
            AceEditorSmartHintPreferences.KEY_SYMBOL_HIGHLIGHT to false,
            AceEditorSmartHintPreferences.KEY_INLINE_COMPLETION_PREVIEW to true,
        )

        assertFalse(AceEditorSmartHintPreferences.isSymbolHighlightEnabled(preferences))
        assertTrue(AceEditorSmartHintPreferences.isInlineCompletionPreviewEnabled(preferences))
    }

    @Test
    fun ace1440SmartHintKeysFollowTheHostNamingScheme() {
        assertEquals("key_\$_ace_symbol_highlight_enabled", AceEditorSmartHintPreferences.KEY_SYMBOL_HIGHLIGHT)
        assertEquals(
            "key_\$_ace_inline_completion_preview_enabled",
            AceEditorSmartHintPreferences.KEY_INLINE_COMPLETION_PREVIEW,
        )
    }
}
