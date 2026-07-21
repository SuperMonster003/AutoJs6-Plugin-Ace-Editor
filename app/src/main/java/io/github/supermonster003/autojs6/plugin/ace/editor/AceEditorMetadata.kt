package io.github.supermonster003.autojs6.plugin.ace.editor

/** Runtime-safe metadata. This object must not reference the compile-only editor API. */
internal object AceEditorMetadata {
    const val PLUGIN_ID = "ace-editor"
    const val ENGINE = "editor"
    const val VARIANT = "ace"
    const val CONTRACT_VERSION = 1
    const val REQUIRED_HOST_VERSION_CODE = 5234
    const val CAPABILITY_CONTRACT_VERSION = "contractVersion"

    val CAPABILITIES = listOf(
        "breakpoints",
        "embeddedView",
        "fonts",
        "semanticCompletion",
        "settings",
        "textMirror",
        "themes",
    )
}
