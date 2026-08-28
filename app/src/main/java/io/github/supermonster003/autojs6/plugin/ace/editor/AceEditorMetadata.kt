package io.github.supermonster003.autojs6.plugin.ace.editor

/** Runtime-safe metadata. This object must not reference the compile-only editor API. */
internal object AceEditorMetadata {
    const val PLUGIN_ID = "ace-editor"
    const val ENGINE = "editor"
    const val VARIANT = "ace"
    const val CONTRACT_VERSION = 5
    const val REQUIRED_HOST_VERSION_CODE = 5276
    const val CAPABILITY_CONTRACT_VERSION = "contractVersion"

    val CAPABILITIES = listOf(
        "breakpoints",
        "codeActions",
        "embeddedView",
        "definitionNavigation",
        "fonts",
        "projectDiagnostics",
        "projectRename",
        "semanticCompletion",
        "settings",
        "textMirror",
        "themes",
    )
}
