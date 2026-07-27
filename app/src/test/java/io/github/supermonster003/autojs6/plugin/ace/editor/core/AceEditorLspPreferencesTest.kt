package io.github.supermonster003.autojs6.plugin.ace.editor.core

import org.junit.Assert.assertFalse
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class AceEditorLspPreferencesTest {

    @Test
    fun lspIsEnabledByDefaultForNewPreferences() {
        assertTrue(AceEditorLspPreferences.DEFAULT_ENABLED)
    }

    @Test
    fun typeScriptDeclarationsRequireDeclarationFileType() {
        assertTrue(AceEditorLspPreferences.matchesFileType("main.ts", listOf(".ts")))
        assertFalse(AceEditorLspPreferences.matchesFileType("main.ts", listOf(".d.ts")))

        assertTrue(AceEditorLspPreferences.matchesFileType("types.d.ts", listOf(".d.ts")))
        assertFalse(AceEditorLspPreferences.matchesFileType("types.d.ts", listOf(".ts")))

        assertTrue(AceEditorLspPreferences.matchesFileType("types.d.mts", listOf(".d.mts")))
        assertFalse(AceEditorLspPreferences.matchesFileType("types.d.mts", listOf(".mts")))
        assertTrue(AceEditorLspPreferences.matchesFileType("types.d.cts", listOf(".d.cts")))
        assertFalse(AceEditorLspPreferences.matchesFileType("types.d.cts", listOf(".cts")))
    }

    @Test
    fun defaultFileTypesCoverSupportedJavaScriptAndTypeScriptSuffixes() {
        assertTrue(
            AceEditorLspPreferences.DEFAULT_FILE_TYPES.containsAll(
                listOf(".js", ".mjs", ".cjs", ".jsx", ".ts", ".tsx", ".d.ts", ".json"),
            ),
        )
        assertFalse(AceEditorLspPreferences.DEFAULT_FILE_TYPES.contains(".mts"))
        assertFalse(AceEditorLspPreferences.DEFAULT_FILE_TYPES.contains(".cts"))
        assertEquals(
            AceEditorLspPreferences.DEFAULT_FILE_TYPES,
            AceEditorLspPreferences.normalizeFileTypes(AceEditorLspPreferences.DEFAULT_FILE_TYPES),
        )
    }

    @Test
    fun declarationGroupsAreDisabledByDefault() {
        assertTrue(AceEditorLspPreferences.DEFAULT_DECLARATION_GROUPS.isEmpty())
    }

    @Test
    fun declarationGroupsAreNormalizedToSupportedCanonicalOrder() {
        assertEquals(
            listOf(
                AceEditorLspPreferences.DECLARATION_GROUP_ANDROID,
                AceEditorLspPreferences.DECLARATION_GROUP_RESOURCES,
                AceEditorLspPreferences.DECLARATION_GROUP_MAIN_APP,
            ),
            AceEditorLspPreferences.normalizeDeclarationGroups(
                listOf(" RESOURCES ", "unknown", "MAIN-APP", "android", "resources"),
            ),
        )
        assertEquals(
            listOf(
                AceEditorLspPreferences.DECLARATION_GROUP_ANDROID,
                AceEditorLspPreferences.DECLARATION_GROUP_LIBRARIES,
            ),
            AceEditorLspPreferences.normalizeDeclarationGroups("libraries; ANDROID,unsupported"),
        )
    }

    @Test
    fun declarationGroupDependenciesResolveTransitively() {
        assertEquals(
            listOf(
                AceEditorLspPreferences.DECLARATION_GROUP_ANDROID,
                AceEditorLspPreferences.DECLARATION_GROUP_LIBRARIES,
            ),
            AceEditorLspPreferences.resolveDeclarationGroups(listOf("libraries")),
        )
        assertEquals(
            AceEditorLspPreferences.SUPPORTED_DECLARATION_GROUPS,
            AceEditorLspPreferences.resolveDeclarationGroups(listOf("main-app")),
        )
        assertEquals(
            listOf(AceEditorLspPreferences.DECLARATION_GROUP_RESOURCES),
            AceEditorLspPreferences.resolveDeclarationGroups(listOf("resources")),
        )
    }
}
