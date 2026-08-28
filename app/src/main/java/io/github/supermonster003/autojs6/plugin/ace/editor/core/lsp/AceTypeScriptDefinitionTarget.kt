package io.github.supermonster003.autojs6.plugin.ace.editor.core.lsp

internal data class AceTypeScriptDefinitionFile(
    val relativePath: String,
    val contentSha256: String,
)

data class AceTypeScriptDefinitionTarget(
    val kind: Kind,
    val projectRootPath: String,
    val relativePath: String,
    val line: Int,
    val column: Int,
    val endLine: Int,
    val endColumn: Int,
    val contentSha256: String,
    val projectSourceInventoryFingerprint: String? = null,
    val dependencyInventoryFingerprint: String? = null,
) {
    enum class Kind {
        PROJECT_SOURCE,
        DEPENDENCY_DECLARATION,
    }
}
