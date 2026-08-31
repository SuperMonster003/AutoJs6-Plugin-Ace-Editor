package io.github.supermonster003.autojs6.plugin.ace.editor.core

import android.content.SharedPreferences

object AceEditorLspPreferences {
    const val KEY_ACE_LSP_ENABLED = "key_\$_ace_lsp_enabled"
    const val KEY_ACE_LSP_FILE_TYPES = "key_\$_ace_lsp_file_types"
    const val KEY_ACE_LSP_FILE_TYPES_REVISION = "key_\$_ace_lsp_file_types_revision"
    const val KEY_ACE_LSP_DECLARATION_GROUPS = "key_\$_ace_lsp_declaration_groups"
    const val KEY_ACE_SEMANTIC_TYPESCRIPT_ENABLED = "key_\$_ace_semantic_typescript_enabled"
    const val KEY_ACE_SEMANTIC_PYTHON_ENABLED = "key_\$_ace_semantic_python_enabled"
    const val KEY_ACE_SEMANTIC_LUA_ENABLED = "key_\$_ace_semantic_lua_enabled"
    const val KEY_ACE_SEMANTIC_JAVA_ENABLED = "key_\$_ace_semantic_java_enabled"
    const val KEY_ACE_SEMANTIC_KOTLIN_ENABLED = "key_\$_ace_semantic_kotlin_enabled"
    const val DEFAULT_ENABLED = true
    const val SEMANTIC_LANGUAGE_TYPESCRIPT = "typescript"
    const val SEMANTIC_LANGUAGE_PYTHON = "python"
    const val SEMANTIC_LANGUAGE_LUA = "lua"
    const val SEMANTIC_LANGUAGE_JAVA = "java"
    const val SEMANTIC_LANGUAGE_KOTLIN = "kotlin"
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
        ".mts",
        ".cts",
        ".d.ts",
        ".d.mts",
        ".d.cts",
        ".json",
        ".auto.js",
        ".node.js",
        ".py",
        ".lua",
        ".java",
        ".kt",
        ".kts",
    )

    private val REVISION_1_DEFAULT_FILE_TYPES = listOf(
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

    private val REVISION_2_DEFAULT_FILE_TYPES = listOf(
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
        ".auto.js",
        ".node.js",
    )

    val SUPPORTED_SEMANTIC_LANGUAGES = listOf(
        SEMANTIC_LANGUAGE_TYPESCRIPT,
        SEMANTIC_LANGUAGE_PYTHON,
        SEMANTIC_LANGUAGE_LUA,
        SEMANTIC_LANGUAGE_JAVA,
        SEMANTIC_LANGUAGE_KOTLIN,
    )

    /** M4-M6 enable their bundled Python, Lua, and Java diagnostic providers. */
    val DEFAULT_SEMANTIC_LANGUAGES = linkedMapOf(
        SEMANTIC_LANGUAGE_TYPESCRIPT to true,
        SEMANTIC_LANGUAGE_PYTHON to true,
        SEMANTIC_LANGUAGE_LUA to true,
        SEMANTIC_LANGUAGE_JAVA to true,
        SEMANTIC_LANGUAGE_KOTLIN to false,
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
        val revision = preferences.getInt(KEY_ACE_LSP_FILE_TYPES_REVISION, 1)
        return resolveStoredFileTypes(preferences.getString(KEY_ACE_LSP_FILE_TYPES, ""), revision)
    }

    internal fun resolveStoredFileTypes(raw: String?, revision: Int): List<String> {
        val fileTypes = normalizeFileTypes(raw)
        val matchesHistoricalDefault = when (revision) {
            1 -> fileTypes.toSet() == REVISION_1_DEFAULT_FILE_TYPES.toSet()
            2 -> fileTypes.toSet() == REVISION_2_DEFAULT_FILE_TYPES.toSet()
            else -> false
        }
        return if (revision < FILE_TYPES_REVISION && matchesHistoricalDefault) {
            DEFAULT_FILE_TYPES
        } else {
            fileTypes
        }
    }

    @JvmStatic
    fun setFileTypes(preferences: SharedPreferences, fileTypes: Collection<String>) {
        preferences.edit()
            .putString(KEY_ACE_LSP_FILE_TYPES, normalizeFileTypes(fileTypes).joinToString(","))
            .putInt(KEY_ACE_LSP_FILE_TYPES_REVISION, FILE_TYPES_REVISION)
            .apply()
    }

    @JvmStatic
    fun resetFileTypes(preferences: SharedPreferences) {
        preferences.edit()
            .remove(KEY_ACE_LSP_FILE_TYPES)
            .remove(KEY_ACE_LSP_FILE_TYPES_REVISION)
            .apply()
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
    fun isSemanticEnabled(preferences: SharedPreferences, language: String): Boolean {
        if (!isEnabled(preferences)) return false
        val normalized = normalizeSemanticLanguage(language) ?: return false
        return preferences.getBoolean(
            semanticPreferenceKey(normalized),
            DEFAULT_SEMANTIC_LANGUAGES.getValue(normalized),
        )
    }

    @JvmStatic
    fun setSemanticEnabled(preferences: SharedPreferences, language: String, enabled: Boolean) {
        val normalized = requireNotNull(normalizeSemanticLanguage(language)) {
            "Unsupported semantic language: $language"
        }
        preferences.edit().putBoolean(semanticPreferenceKey(normalized), enabled).apply()
    }

    @JvmStatic
    fun resetSemanticEnabled(preferences: SharedPreferences, language: String) {
        val normalized = requireNotNull(normalizeSemanticLanguage(language)) {
            "Unsupported semantic language: $language"
        }
        preferences.edit().remove(semanticPreferenceKey(normalized)).apply()
    }

    @JvmStatic
    fun getSemanticLanguages(preferences: SharedPreferences): Map<String, Boolean> {
        return SUPPORTED_SEMANTIC_LANGUAGES.associateWith { language ->
            isSemanticEnabled(preferences, language)
        }
    }

    fun defaultSemanticEnabled(language: String): Boolean {
        val normalized = normalizeSemanticLanguage(language) ?: return false
        return DEFAULT_SEMANTIC_LANGUAGES.getValue(normalized)
    }

    fun semanticLanguageForDocument(documentPathOrName: String?): String? {
        val fileName = documentPathOrName
            ?.substringBefore('?')
            ?.substringBefore('#')
            ?.replace('\\', '/')
            ?.substringAfterLast('/')
            ?.lowercase()
            ?.takeIf(String::isNotBlank)
            ?: return null
        return when {
            listOf(
                ".d.ts", ".d.mts", ".d.cts", ".auto.js", ".node.js",
                ".js", ".mjs", ".cjs", ".jsx", ".ts", ".tsx", ".mts", ".cts",
            ).any(fileName::endsWith) -> SEMANTIC_LANGUAGE_TYPESCRIPT
            fileName.endsWith(".py") -> SEMANTIC_LANGUAGE_PYTHON
            fileName.endsWith(".lua") -> SEMANTIC_LANGUAGE_LUA
            fileName.endsWith(".java") -> SEMANTIC_LANGUAGE_JAVA
            fileName.endsWith(".kt") || fileName.endsWith(".kts") -> SEMANTIC_LANGUAGE_KOTLIN
            else -> null
        }
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

    private fun normalizeSemanticLanguage(language: String): String? {
        return language.trim().lowercase().takeIf { it in SUPPORTED_SEMANTIC_LANGUAGES }
    }

    private fun semanticPreferenceKey(language: String): String = when (language) {
        SEMANTIC_LANGUAGE_TYPESCRIPT -> KEY_ACE_SEMANTIC_TYPESCRIPT_ENABLED
        SEMANTIC_LANGUAGE_PYTHON -> KEY_ACE_SEMANTIC_PYTHON_ENABLED
        SEMANTIC_LANGUAGE_LUA -> KEY_ACE_SEMANTIC_LUA_ENABLED
        SEMANTIC_LANGUAGE_JAVA -> KEY_ACE_SEMANTIC_JAVA_ENABLED
        SEMANTIC_LANGUAGE_KOTLIN -> KEY_ACE_SEMANTIC_KOTLIN_ENABLED
        else -> error("Unsupported semantic language: $language")
    }

    internal const val FILE_TYPES_REVISION = 3
}
