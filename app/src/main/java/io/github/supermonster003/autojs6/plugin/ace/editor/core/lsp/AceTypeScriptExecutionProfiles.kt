package io.github.supermonster003.autojs6.plugin.ace.editor.core.lsp

import java.io.File
import java.net.URI

internal data class AceTypeScriptExecutionProfile(
    val id: String,
    val revision: Int,
    val defaultLibraryUri: String,
)

/**
 * Mirrors the compiler plugin profiles selected by AutoJs6 before script execution.
 *
 * The host routes standalone `.ts`/`.tsx` sources to Rhino and `.mts`/`.cts` sources to Node.
 * A TypeScript file inside the nearest project whose `project.json` declares `type: node` is
 * routed to Node as well. Keeping that decision here lets the editor choose the same diagnostic
 * options without making editor availability part of the execution path.
 */
internal object AceTypeScriptExecutionProfiles {

    const val TYPESCRIPT_VERSION = "6.0.3"
    const val PROFILE_RHINO = "rhino"
    const val PROFILE_NODE = "node"
    const val RHINO_PROFILE_REVISION = 2
    const val NODE_PROFILE_REVISION = 2

    val RHINO = AceTypeScriptExecutionProfile(
        id = PROFILE_RHINO,
        revision = RHINO_PROFILE_REVISION,
        defaultLibraryUri = AceLspServerManager.TYPESCRIPT_ES2018_LIBRARY_URI,
    )
    val NODE = AceTypeScriptExecutionProfile(
        id = PROFILE_NODE,
        revision = NODE_PROFILE_REVISION,
        defaultLibraryUri = AceLspServerManager.TYPESCRIPT_ES2018_LIBRARY_URI,
    )

    fun resolve(documentPath: String?): AceTypeScriptExecutionProfile? {
        val fileName = documentPath
            ?.substringBefore('?')
            ?.substringBefore('#')
            ?.replace('\\', '/')
            ?.substringAfterLast('/')
            ?.lowercase()
            ?.takeIf(String::isNotBlank)
            ?: return null
        if (!isTypeScriptFileName(fileName)) {
            return null
        }
        if (fileName.endsWith(".mts") || fileName.endsWith(".cts")) {
            return NODE
        }
        return if (isNodeProjectDocument(documentPath)) NODE else RHINO
    }

    private fun isTypeScriptFileName(fileName: String): Boolean =
        fileName.endsWith(".ts") ||
            fileName.endsWith(".tsx") ||
            fileName.endsWith(".mts") ||
            fileName.endsWith(".cts")

    private fun isNodeProjectDocument(documentPath: String): Boolean {
        var directory = localDocumentFile(documentPath)?.parentFile ?: return false
        while (true) {
            val projectConfig = File(directory, PROJECT_CONFIG_NAME)
            if (projectConfig.isFile) {
                return readProjectType(projectConfig).equals(PROJECT_TYPE_NODE, ignoreCase = true)
            }
            directory = directory.parentFile ?: return false
        }
    }

    private fun localDocumentFile(documentPath: String): File? {
        val value = documentPath.substringBefore('?').substringBefore('#').trim()
        if (value.isEmpty()) {
            return null
        }
        if (WINDOWS_ABSOLUTE_PATH.matches(value)) {
            return File(value)
        }
        if (value.startsWith("file:", ignoreCase = true)) {
            return runCatching { File(URI(value)) }.getOrNull()
        }
        if (URI_SCHEME.containsMatchIn(value)) {
            return null
        }
        return File(value).takeIf(File::isAbsolute)
    }

    private fun readProjectType(projectConfig: File): String? {
        if (projectConfig.length() !in 0..MAX_PROJECT_CONFIG_BYTES) {
            return null
        }
        val text = runCatching { projectConfig.readText() }.getOrNull() ?: return null
        return PROJECT_TYPE_PATTERN.find(text)?.groupValues?.getOrNull(1)?.trim()
    }

    private const val PROJECT_CONFIG_NAME = "project.json"
    private const val PROJECT_TYPE_NODE = "node"
    private const val MAX_PROJECT_CONFIG_BYTES = 1024L * 1024L
    private val PROJECT_TYPE_PATTERN = Regex(
        "\"(?:type|projectType)\"\\s*:\\s*\"([^\"]+)\"",
        RegexOption.IGNORE_CASE,
    )
    private val WINDOWS_ABSOLUTE_PATH = Regex("^[A-Za-z]:[\\\\/].+")
    private val URI_SCHEME = Regex("^[A-Za-z][A-Za-z0-9+.-]*:")
}
