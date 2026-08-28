package io.github.supermonster003.autojs6.plugin.ace.editor

/** Runtime-safe metadata. This object must not reference the compile-only editor API. */
internal object AceEditorMetadata {
    const val PLUGIN_ID = "ace-editor"
    const val ENGINE = "editor"
    const val VARIANT = "ace"
    const val CONTRACT_VERSION = 3
    const val REQUIRED_HOST_VERSION_CODE = 5276
    const val CAPABILITY_CONTRACT_VERSION = "contractVersion"

    val CAPABILITIES = listOf(
        "breakpoints",
        "embeddedView",
        "definitionNavigation",
        "fonts",
        "projectDiagnostics",
        "semanticCompletion",
        "settings",
        "textMirror",
        "themes",
    )
}
