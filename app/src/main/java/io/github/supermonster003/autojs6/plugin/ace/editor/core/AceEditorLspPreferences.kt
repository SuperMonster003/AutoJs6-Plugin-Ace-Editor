package io.github.supermonster003.autojs6.plugin.ace.editor.core

import android.content.SharedPreferences

object AceEditorLspPreferences {
    const val KEY_ACE_LSP_ENABLED = "key_\$_ace_lsp_enabled"
    const val KEY_ACE_LSP_FILE_TYPES = "key_\$_ace_lsp_file_types"
    const val KEY_ACE_LSP_DECLARATION_GROUPS = "key_\$_ace_lsp_declaration_groups"
    const val DEFAULT_ENABLED = true
    const val DECLARATION_GROUP_ANDROID = "android"
    const val DECLARATION_GROUP_LIBRARIES = "libraries"
    const val DECLARATION_GROUP_RESOURCES = "resources"
    const val DECLARATION_GROUP_MAIN_APP = "main-app"
    private val TYPE_SCRIPT_DECLARATION_EXTENSIONS = listOf(".d.ts", ".d.mts", ".d.cts")

    val DEFAULT_FILE_TYPES = listOf(
        ".js",
        ".mjs",
        ".cjs",
        ".jsx",
        ".ts",
        ".tsx",
        ".d.ts",
        ".json",
        ".auto.js",
        ".node.js",
    )

    val SUPPORTED_DECLARATION_GROUPS = listOf(
        DECLARATION_GROUP_ANDROID,
        DECLARATION_GROUP_LIBRARIES,
        DECLARATION_GROUP_RESOURCES,
        DECLARATION_GROUP_MAIN_APP,
    )

    val DEFAULT_DECLARATION_GROUPS = emptyList<String>()

    @JvmStatic
    fun isEnabled(preferences: SharedPreferences): Boolean {
        return preferences.getBoolean(KEY_ACE_LSP_ENABLED, DEFAULT_ENABLED)
    }

    @JvmStatic
    fun setEnabled(preferences: SharedPreferences, enabled: Boolean) {
        preferences.edit().putBoolean(KEY_ACE_LSP_ENABLED, enabled).apply()
    }

    @JvmStatic
    fun resetEnabled(preferences: SharedPreferences) {
        preferences.edit().remove(KEY_ACE_LSP_ENABLED).apply()
    }

    @JvmStatic
    fun getFileTypes(preferences: SharedPreferences): List<String> {
        if (!preferences.contains(KEY_ACE_LSP_FILE_TYPES)) {
            return DEFAULT_FILE_TYPES
        }
        return normalizeFileTypes(preferences.getString(KEY_ACE_LSP_FILE_TYPES, ""))
    }

    @JvmStatic
    fun setFileTypes(preferences: SharedPreferences, fileTypes: Collection<String>) {
        preferences.edit()
            .putString(KEY_ACE_LSP_FILE_TYPES, normalizeFileTypes(fileTypes).joinToString(","))
            .apply()
    }

    @JvmStatic
    fun resetFileTypes(preferences: SharedPreferences) {
        preferences.edit().remove(KEY_ACE_LSP_FILE_TYPES).apply()
    }

    @JvmStatic
    fun getDeclarationGroups(preferences: SharedPreferences): List<String> {
        if (!preferences.contains(KEY_ACE_LSP_DECLARATION_GROUPS)) {
            return DEFAULT_DECLARATION_GROUPS
        }
        return normalizeDeclarationGroups(preferences.getString(KEY_ACE_LSP_DECLARATION_GROUPS, ""))
    }

    @JvmStatic
    fun setDeclarationGroups(preferences: SharedPreferences, groups: Collection<String>) {
        preferences.edit()
            .putString(KEY_ACE_LSP_DECLARATION_GROUPS, normalizeDeclarationGroups(groups).joinToString(","))
            .apply()
    }

    @JvmStatic
    fun resetDeclarationGroups(preferences: SharedPreferences) {
        preferences.edit().remove(KEY_ACE_LSP_DECLARATION_GROUPS).apply()
    }

    @JvmStatic
    fun isEnabledForDocument(preferences: SharedPreferences, documentPathOrName: String?): Boolean {
        if (!isEnabled(preferences)) {
            return false
        }
        return isDocumentAllowed(preferences, documentPathOrName)
    }

    @JvmStatic
    fun isDocumentAllowed(preferences: SharedPreferences, documentPathOrName: String?): Boolean {
        val normalized = documentPathOrName
            ?.substringBefore('?')
            ?.substringBefore('#')
            ?.replace('\\', '/')
            ?.substringAfterLast('/')
            ?.lowercase()
            ?.takeIf { it.isNotBlank() }
            ?: return false
        return matchesFileType(normalized, getFileTypes(preferences))
    }

    fun matchesFileType(fileName: String, fileTypes: Collection<String>): Boolean {
        val normalizedFileName = fileName.trim().replace('\\', '/').substringAfterLast('/').lowercase()
        val normalizedFileTypes = normalizeFileTypes(fileTypes)
        val declarationExtension = TYPE_SCRIPT_DECLARATION_EXTENSIONS.firstOrNull { normalizedFileName.endsWith(it) }
        if (declarationExtension != null) {
            return declarationExtension in normalizedFileTypes
        }
        return normalizedFileTypes.any { normalizedFileName.endsWith(it) }
    }

    fun normalizeFileTypes(raw: String?): List<String> {
        return normalizeFileTypes(
            raw.orEmpty()
                .split(',', ';', '\n', '\r', '\t', ' ')
                .filter { it.isNotBlank() },
        )
    }

    fun normalizeFileTypes(values: Collection<String>): List<String> {
        return values
            .asSequence()
            .map { it.trim().lowercase().removePrefix("*") }
            .filter { it.isNotBlank() }
            .map { if (it.startsWith(".")) it else ".$it" }
            .distinct()
            .toList()
    }

    fun normalizeDeclarationGroups(raw: String?): List<String> {
        return normalizeDeclarationGroups(
            raw.orEmpty()
                .split(',', ';', '\n', '\r', '\t', ' ')
                .filter { it.isNotBlank() },
        )
    }

    fun normalizeDeclarationGroups(values: Collection<String>): List<String> {
        val selected = values
            .asSequence()
            .map { it.trim().lowercase() }
            .filter { it in SUPPORTED_DECLARATION_GROUPS }
            .toSet()
        return SUPPORTED_DECLARATION_GROUPS.filter { it in selected }
    }

    fun resolveDeclarationGroups(values: Collection<String>): List<String> {
        val effective = normalizeDeclarationGroups(values).toMutableSet()
        if (DECLARATION_GROUP_MAIN_APP in effective) {
            effective += DECLARATION_GROUP_ANDROID
            effective += DECLARATION_GROUP_LIBRARIES
            effective += DECLARATION_GROUP_RESOURCES
        }
        if (DECLARATION_GROUP_LIBRARIES in effective) {
            effective += DECLARATION_GROUP_ANDROID
        }
        return SUPPORTED_DECLARATION_GROUPS.filter { it in effective }
    }
}
