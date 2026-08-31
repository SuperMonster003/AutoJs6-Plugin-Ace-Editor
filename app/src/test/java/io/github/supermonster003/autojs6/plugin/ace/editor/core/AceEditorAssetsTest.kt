package io.github.supermonster003.autojs6.plugin.ace.editor.core

import java.io.FileNotFoundException
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class AceEditorAssetsTest {

    @Test
    fun requiredAssetsCoverEditorBridgeAndBundledLanguageService() {
        val requiredPaths = AceEditorAssets.requiredAssetPaths

        assertEquals(requiredPaths.distinct(), requiredPaths)
        assertTrue(
            requiredPaths.containsAll(
                listOf(
                    "$ASSET_ROOT/autojs6_editor.html",
                    "$ASSET_ROOT/src-min-noconflict/ace.js",
                    "$ASSET_ROOT/src-min-noconflict/mode-javascript.js",
                    "$ASSET_ROOT/src-min-noconflict/mode-typescript.js",
                    "$ASSET_ROOT/src-min-noconflict/mode-json.js",
                    "$ASSET_ROOT/src-min-noconflict/mode-jsx.js",
                    "$ASSET_ROOT/src-min-noconflict/mode-python.js",
                    "$ASSET_ROOT/src-min-noconflict/mode-lua.js",
                    "$ASSET_ROOT/src-min-noconflict/mode-java.js",
                    "$ASSET_ROOT/src-min-noconflict/mode-kotlin.js",
                    "$ASSET_ROOT/src-min-noconflict/worker-javascript.js",
                    "$ASSET_ROOT/src-min-noconflict/worker-lua.js",
                    "$ASSET_ROOT/src-min-noconflict/snippets/javascript.js",
                    "$ASSET_ROOT/src-min-noconflict/snippets/typescript.js",
                    "$ASSET_ROOT/src-min-noconflict/snippets/json.js",
                    "$ASSET_ROOT/src-min-noconflict/snippets/python.js",
                    "$ASSET_ROOT/src-min-noconflict/snippets/lua.js",
                    "$ASSET_ROOT/src-min-noconflict/snippets/java.js",
                    "$ASSET_ROOT/src-min-noconflict/snippets/kotlin.js",
                    "$ASSET_ROOT/autojs6/autojs6_local_symbols.js",
                    "$ASSET_ROOT/autojs6/indices/python.js",
                    "$ASSET_ROOT/autojs6/indices/lua.js",
                    "$ASSET_ROOT/autojs6/indices/java.js",
                    "$ASSET_ROOT/autojs6/indices/kotlin.js",
                    "$ASSET_ROOT/autojs6/autojs6_ace_bridge.js",
                    "$ASSET_ROOT/autojs6/autojs6_semantic_provider.js",
                    "$ASSET_ROOT/autojs6/autojs6_lsp_core.js",
                    "$ASSET_ROOT/autojs6/autojs6_lsp_transports.js",
                    "$ASSET_ROOT/autojs6/autojs6_python_provider.js",
                    "$ASSET_ROOT/autojs6/autojs6_lua_provider.js",
                    "$ASSET_ROOT/autojs6/autojs6_java_provider.js",
                    "$ASSET_ROOT/autojs6/python/autojs6-python-worker.js",
                    "$ASSET_ROOT/autojs6/python/manifest.json",
                    "$ASSET_ROOT/autojs6/python/THIRD_PARTY_LICENSES.txt",
                    "luals/manifest.json",
                    "luals/THIRD_PARTY_LICENSES.txt",
                    "luals/runtime/main.lua",
                    "luals/runtime/bin/main.lua",
                    "luals/runtime/script/jsonrpc.lua",
                    "luals/runtime/locale/en-us/meta.lua",
                    "luals/runtime/meta/template/basic.lua",
                    "java/ecj/android-36-stubs.jar",
                    "java/ecj/manifest.json",
                    "java/ecj/THIRD_PARTY_LICENSES.txt",
                    "$ASSET_ROOT/autojs6/autojs6_lsp_client.js",
                    "$ASSET_ROOT/autojs6/autojs6_ts_language_service.js",
                    "$ASSET_ROOT/autojs6/typescript/typescript.js",
                    "$ASSET_ROOT/autojs6/typescript/lib.es2018.d.ts",
                    "$ASSET_ROOT/autojs6/typescript/lib.es2022.d.ts",
                    "$ASSET_ROOT/autojs6/types/generated/manifest.json",
                    "$ASSET_ROOT/autojs6/types/generated/lib.autojs6.core.d.ts",
                    "$ASSET_ROOT/autojs6/types/generated/lib.autojs6.android.d.ts",
                    "$ASSET_ROOT/autojs6/types/generated/lib.autojs6.libraries.d.ts",
                    "$ASSET_ROOT/autojs6/types/generated/lib.autojs6.resources.d.ts",
                    "$ASSET_ROOT/autojs6/types/generated/lib.autojs6.main-app.d.ts",
                    "$ASSET_ROOT/autojs6/types/lib.autojs6.extra.d.ts",
                ),
            ),
        )
        assertTrue(
            requiredPaths.all { path ->
                path.startsWith("$ASSET_ROOT/") ||
                    path.startsWith("luals/") ||
                    path.startsWith("java/ecj/")
            },
        )
    }

    @Test
    fun validationSucceedsOnlyAfterEveryRequiredAssetCanBeOpened() {
        val openedPaths = mutableListOf<String>()

        val result = AceEditorAssets.validateRequiredAssets { assetPath ->
            openedPaths += assetPath
        }

        assertTrue(result.isComplete)
        assertTrue(result.missingAssetPaths.isEmpty())
        assertEquals(AceEditorAssets.requiredAssetPaths, openedPaths)
    }

    @Test
    fun validationReportsEveryMissingAssetAndForcesFallback() {
        val missingPaths = setOf(
            "$ASSET_ROOT/autojs6/autojs6_semantic_provider.js",
            "$ASSET_ROOT/autojs6/autojs6_lsp_client.js",
            "$ASSET_ROOT/autojs6/typescript/typescript.js",
            "$ASSET_ROOT/autojs6/types/generated/lib.autojs6.core.d.ts",
        )

        val result = AceEditorAssets.validateRequiredAssets { assetPath ->
            if (assetPath in missingPaths) {
                throw FileNotFoundException(assetPath)
            }
        }

        assertFalse(result.isComplete)
        assertEquals(
            AceEditorAssets.requiredAssetPaths.filter { it in missingPaths },
            result.missingAssetPaths,
        )
    }

    private companion object {
        const val ASSET_ROOT = "editor/ace-builds-1.4.12"
    }
}
