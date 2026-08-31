package io.github.supermonster003.autojs6.plugin.ace.editor.core

import android.content.Context

object AceEditorAssets {

    private const val EDITOR_ASSET_ROOT = "editor/ace-builds-1.4.12"

    /**
     * Assets that must be packaged together for the ACE editor and its bundled
     * TypeScript language service to be considered available.
     *
     * Keep this list explicit: checking only the HTML entry point can leave the
     * app selecting ACE even when a script or declaration file required during
     * startup was omitted from the APK.
     */
    internal val requiredAssetPaths = listOf(
        "$EDITOR_ASSET_ROOT/autojs6_editor.html",
        "$EDITOR_ASSET_ROOT/autojs6/autojs6.css",
        "$EDITOR_ASSET_ROOT/src-min-noconflict/ace.js",
        "$EDITOR_ASSET_ROOT/src-min-noconflict/ext-language_tools.js",
        "$EDITOR_ASSET_ROOT/src-min-noconflict/mode-javascript.js",
        "$EDITOR_ASSET_ROOT/src-min-noconflict/mode-typescript.js",
        "$EDITOR_ASSET_ROOT/src-min-noconflict/mode-json.js",
        "$EDITOR_ASSET_ROOT/src-min-noconflict/mode-jsx.js",
        "$EDITOR_ASSET_ROOT/src-min-noconflict/mode-python.js",
        "$EDITOR_ASSET_ROOT/src-min-noconflict/mode-lua.js",
        "$EDITOR_ASSET_ROOT/src-min-noconflict/mode-java.js",
        "$EDITOR_ASSET_ROOT/src-min-noconflict/mode-kotlin.js",
        "$EDITOR_ASSET_ROOT/src-min-noconflict/worker-javascript.js",
        "$EDITOR_ASSET_ROOT/src-min-noconflict/worker-lua.js",
        "$EDITOR_ASSET_ROOT/src-min-noconflict/snippets/javascript.js",
        "$EDITOR_ASSET_ROOT/src-min-noconflict/snippets/typescript.js",
        "$EDITOR_ASSET_ROOT/src-min-noconflict/snippets/json.js",
        "$EDITOR_ASSET_ROOT/src-min-noconflict/snippets/python.js",
        "$EDITOR_ASSET_ROOT/src-min-noconflict/snippets/lua.js",
        "$EDITOR_ASSET_ROOT/src-min-noconflict/snippets/java.js",
        "$EDITOR_ASSET_ROOT/src-min-noconflict/snippets/kotlin.js",
        "$EDITOR_ASSET_ROOT/autojs6/autojs_indices.js",
        "$EDITOR_ASSET_ROOT/autojs6/autojs6_indices.js",
        "$EDITOR_ASSET_ROOT/autojs6/autojs6_local_symbols.js",
        "$EDITOR_ASSET_ROOT/autojs6/indices/python.js",
        "$EDITOR_ASSET_ROOT/autojs6/indices/lua.js",
        "$EDITOR_ASSET_ROOT/autojs6/indices/java.js",
        "$EDITOR_ASSET_ROOT/autojs6/indices/kotlin.js",
        "$EDITOR_ASSET_ROOT/autojs6/autojs6_completer.js",
        "$EDITOR_ASSET_ROOT/autojs6/autojs6_semantic_provider.js",
        "$EDITOR_ASSET_ROOT/autojs6/autojs6_lsp_core.js",
        "$EDITOR_ASSET_ROOT/autojs6/autojs6_lsp_transports.js",
        "$EDITOR_ASSET_ROOT/autojs6/autojs6_python_provider.js",
        "$EDITOR_ASSET_ROOT/autojs6/autojs6_lua_provider.js",
        "$EDITOR_ASSET_ROOT/autojs6/autojs6_java_provider.js",
        "$EDITOR_ASSET_ROOT/autojs6/python/autojs6-python-worker.js",
        "$EDITOR_ASSET_ROOT/autojs6/python/manifest.json",
        "$EDITOR_ASSET_ROOT/autojs6/python/THIRD_PARTY_LICENSES.txt",
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
        "$EDITOR_ASSET_ROOT/autojs6/autojs6_lsp_client.js",
        "$EDITOR_ASSET_ROOT/autojs6/autojs6_tooltip.js",
        "$EDITOR_ASSET_ROOT/autojs6/autojs6_signature_help.js",
        "$EDITOR_ASSET_ROOT/autojs6/autojs6_ace_bridge.js",
        "$EDITOR_ASSET_ROOT/autojs6/autojs6_ts_language_service.js",
        "$EDITOR_ASSET_ROOT/autojs6/typescript/typescript.js",
        "$EDITOR_ASSET_ROOT/autojs6/typescript/lib.es2018.d.ts",
        "$EDITOR_ASSET_ROOT/autojs6/typescript/lib.es2022.d.ts",
        "$EDITOR_ASSET_ROOT/autojs6/types/generated/manifest.json",
        "$EDITOR_ASSET_ROOT/autojs6/types/generated/lib.autojs6.core.d.ts",
        "$EDITOR_ASSET_ROOT/autojs6/types/generated/lib.autojs6.android.d.ts",
        "$EDITOR_ASSET_ROOT/autojs6/types/generated/lib.autojs6.libraries.d.ts",
        "$EDITOR_ASSET_ROOT/autojs6/types/generated/lib.autojs6.resources.d.ts",
        "$EDITOR_ASSET_ROOT/autojs6/types/generated/lib.autojs6.main-app.d.ts",
        "$EDITOR_ASSET_ROOT/autojs6/types/lib.autojs6.extra.d.ts",
    )

    internal data class ValidationResult(
        val missingAssetPaths: List<String>,
    ) {
        val isComplete: Boolean
            get() = missingAssetPaths.isEmpty()
    }

    fun hasRequired(context: Context): Boolean {
        if (AceEditorTestHooks.shouldForceAssetMissing()) {
            return false
        }
        return validateRequiredAssets { assetPath ->
            context.assets.open(assetPath).use { }
        }.isComplete
    }

    internal fun validateRequiredAssets(openAsset: (String) -> Unit): ValidationResult {
        val missingAssetPaths = requiredAssetPaths.filter { assetPath ->
            runCatching { openAsset(assetPath) }.isFailure
        }
        return ValidationResult(missingAssetPaths)
    }
}
