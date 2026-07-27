package io.github.supermonster003.autojs6.plugin.ace.editor.core

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class AceEditorTextLoadPolicyTest {

    @Test
    fun `ordinary 347 KiB script keeps JavaScript highlighting`() {
        val line = "const value = 1;\n"
        val script = buildString {
            while (length < 347 * 1024) {
                append(line)
            }
        }

        assertFalse(AceEditorTextLoadPolicy.requiresAceLongLineSafetyMode(script))
    }

    @Test
    fun `pathological long line uses strict safety boundary`() {
        assertFalse(
            AceEditorTextLoadPolicy.requiresAceLongLineSafetyMode(
                "x".repeat(AceEditorTextLoadPolicy.ACE_UNSAFE_LINE_LENGTH),
            ),
        )
        assertTrue(
            AceEditorTextLoadPolicy.requiresAceLongLineSafetyMode(
                "x".repeat(AceEditorTextLoadPolicy.ACE_UNSAFE_LINE_LENGTH + 1),
            ),
        )
    }
}
