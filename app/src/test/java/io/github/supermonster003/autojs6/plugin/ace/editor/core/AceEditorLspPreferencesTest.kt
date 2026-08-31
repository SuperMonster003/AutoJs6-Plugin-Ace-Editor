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
    fun defaultFileTypesCoverEveryRoutedLanguageSuffix() {
        assertTrue(
            AceEditorLspPreferences.DEFAULT_FILE_TYPES.containsAll(
                listOf(
                    ".js",
                    ".mjs",
                    ".cjs",
                    ".jsx",
                    ".ts",
                    ".tsx",
                    ".mts",
                    ".cts",
                    ".d.ts",
                    ".d.mts",
                    ".d.cts",
                    ".json",
                    ".py",
                    ".lua",
                    ".java",
                    ".kt",
                    ".kts",
                ),
            ),
        )
        assertEquals(
            AceEditorLspPreferences.DEFAULT_FILE_TYPES,
            AceEditorLspPreferences.normalizeFileTypes(AceEditorLspPreferences.DEFAULT_FILE_TYPES),
        )
    }

    @Test
    fun legacyDefaultSelectionMigratesWithoutOverridingNewExplicitChoices() {
        val legacyDefault = ".js,.mjs,.cjs,.jsx,.ts,.tsx,.d.ts,.json,.auto.js,.node.js"
        val revisionTwoDefault =
            ".js,.mjs,.cjs,.jsx,.ts,.tsx,.mts,.cts,.d.ts,.d.mts,.d.cts,.json,.auto.js,.node.js"

        assertEquals(
            AceEditorLspPreferences.DEFAULT_FILE_TYPES,
            AceEditorLspPreferences.resolveStoredFileTypes(legacyDefault, revision = 1),
        )
        assertEquals(
            AceEditorLspPreferences.normalizeFileTypes(legacyDefault),
            AceEditorLspPreferences.resolveStoredFileTypes(legacyDefault, revision = 2),
        )
        assertEquals(
            AceEditorLspPreferences.DEFAULT_FILE_TYPES,
            AceEditorLspPreferences.resolveStoredFileTypes(revisionTwoDefault, revision = 2),
        )
        assertEquals(
            listOf(".js", ".ts"),
            AceEditorLspPreferences.resolveStoredFileTypes(".js,.ts", revision = 1),
        )
    }

    @Test
    fun semanticLanguageSwitchesEnableBundledTypeScriptPythonLuaAndJavaProviders() {
        assertTrue(
            AceEditorLspPreferences.defaultSemanticEnabled(
                AceEditorLspPreferences.SEMANTIC_LANGUAGE_TYPESCRIPT,
            ),
        )
        assertTrue(
            AceEditorLspPreferences.defaultSemanticEnabled(
                AceEditorLspPreferences.SEMANTIC_LANGUAGE_PYTHON,
            ),
        )
        assertTrue(
            AceEditorLspPreferences.defaultSemanticEnabled(
                AceEditorLspPreferences.SEMANTIC_LANGUAGE_LUA,
            ),
        )
        assertTrue(
            AceEditorLspPreferences.defaultSemanticEnabled(
                AceEditorLspPreferences.SEMANTIC_LANGUAGE_JAVA,
            ),
        )
        assertFalse(
            AceEditorLspPreferences.defaultSemanticEnabled(
                AceEditorLspPreferences.SEMANTIC_LANGUAGE_KOTLIN,
            ),
        )
        assertEquals(3, AceEditorLspPreferences.FILE_TYPES_REVISION)
    }

    @Test
    fun semanticLanguageRoutingIsSuffixAwareAndExcludesJson() {
        assertEquals(
            AceEditorLspPreferences.SEMANTIC_LANGUAGE_TYPESCRIPT,
            AceEditorLspPreferences.semanticLanguageForDocument("src/types.d.mts"),
        )
        assertEquals(
            AceEditorLspPreferences.SEMANTIC_LANGUAGE_PYTHON,
            AceEditorLspPreferences.semanticLanguageForDocument("src/main.PY?revision=1"),
        )
        assertEquals(
            AceEditorLspPreferences.SEMANTIC_LANGUAGE_LUA,
            AceEditorLspPreferences.semanticLanguageForDocument("main.lua"),
        )
        assertEquals(
            AceEditorLspPreferences.SEMANTIC_LANGUAGE_JAVA,
            AceEditorLspPreferences.semanticLanguageForDocument("Main.java"),
        )
        assertEquals(
            AceEditorLspPreferences.SEMANTIC_LANGUAGE_KOTLIN,
            AceEditorLspPreferences.semanticLanguageForDocument("build.kts"),
        )
        assertEquals(null, AceEditorLspPreferences.semanticLanguageForDocument("config.json"))
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
