package io.github.supermonster003.autojs6.plugin.ace.editor.core.lsp

import io.github.supermonster003.autojs6.plugin.ace.editor.core.AceEditorLspPreferences
import java.net.URLEncoder
import java.nio.charset.StandardCharsets

class AceLspServerManager(
    private val enabledProvider: () -> Boolean = { AceEditorLspPreferences.DEFAULT_ENABLED },
    private val documentAllowedProvider: (String?) -> Boolean = { path ->
        path?.substringBefore('?')?.substringBefore('#')?.replace('\\', '/')?.substringAfterLast('/')
            ?.let { AceEditorLspPreferences.matchesFileType(it, AceEditorLspPreferences.DEFAULT_FILE_TYPES) }
            ?: false
    },
    private val declarationGroupsProvider: () -> Collection<String> = {
        AceEditorLspPreferences.DEFAULT_DECLARATION_GROUPS
    },
    private val semanticLanguagesProvider: () -> Map<String, Boolean> = {
        AceEditorLspPreferences.DEFAULT_SEMANTIC_LANGUAGES
    },
    private val luaServerAvailableProvider: () -> Boolean = { false },
    private val javaDiagnosticsAvailableProvider: () -> Boolean = { false },
) {

    // Historical name retained for API stability. This class publishes configuration/snapshots;
    // protocol and process lifecycles live in AutoJsAceLspCore/AceStdioLspProcessRegistry.

    @Volatile
    private var attached = false

    @Volatile
    private var sessionRevision = 0L

    @Volatile
    private var documentPath: String = SYNTHETIC_DOCUMENT_URI

    @Volatile
    private var projectTypeLayer: AceTypeScriptProjectTypeLayer? = null

    @Volatile
    private var projectSourceLayer: AceTypeScriptProjectSourceLayer? = null

    @Synchronized
    fun setDocumentPath(path: String?) {
        val normalized = path?.takeIf { it.isNotBlank() } ?: SYNTHETIC_DOCUMENT_URI
        if (documentPath == normalized) {
            return
        }
        documentPath = normalized
        projectSourceLayer = null
        projectTypeLayer = null
        sessionRevision += 1
    }

    @Synchronized
    internal fun applyProjectTypeLayer(
        path: String?,
        layer: AceTypeScriptProjectTypeLayer?,
    ): Boolean = applyProjectLayers(path, null, layer)

    @Synchronized
    internal fun applyProjectLayers(
        path: String?,
        sourceLayer: AceTypeScriptProjectSourceLayer?,
        typeLayer: AceTypeScriptProjectTypeLayer?,
    ): Boolean {
        val normalized = path?.takeIf { it.isNotBlank() } ?: SYNTHETIC_DOCUMENT_URI
        if (documentPath != normalized) return false
        val expectedProfile = AceTypeScriptExecutionProfiles.resolve(documentPath)?.id
        val invalidSourceProfile =
            sourceLayer != null && sourceLayer.targetProfile != expectedProfile
        val incompatibleDocumentUris =
            sourceLayer != null && typeLayer != null &&
                sourceLayer.documentUri != typeLayer.documentUri
        val incompatibleProjectRoots =
            sourceLayer != null && typeLayer != null &&
                sourceLayer.projectRootPath != typeLayer.projectRootPath
        if (
            invalidSourceProfile || incompatibleDocumentUris || incompatibleProjectRoots
        ) {
            projectSourceLayer = null
            projectTypeLayer = null
            sessionRevision += 1
            return true
        }
        projectSourceLayer = sourceLayer
        projectTypeLayer = typeLayer
        sessionRevision += 1
        return true
    }

    @Synchronized
    fun readProjectFile(uri: String): String? =
        projectSourceLayer?.read(uri) ?: projectTypeLayer?.read(uri)

    @Synchronized
    internal fun resolveDefinitionTarget(
        uri: String,
        line: Int,
        column: Int,
        endLine: Int,
        endColumn: Int,
    ): AceTypeScriptDefinitionTarget? {
        if (!isValidDefinitionRange(line, column, endLine, endColumn)) return null
        projectSourceLayer?.let { layer ->
            layer.definitionFile(uri)?.let { file ->
                return AceTypeScriptDefinitionTarget(
                    kind = AceTypeScriptDefinitionTarget.Kind.PROJECT_SOURCE,
                    projectRootPath = layer.projectRootPath,
                    relativePath = file.relativePath,
                    line = line,
                    column = column,
                    endLine = endLine,
                    endColumn = endColumn,
                    contentSha256 = file.contentSha256,
                    projectSourceInventoryFingerprint = layer.sourceInventoryFingerprint,
                )
            }
        }
        projectTypeLayer?.let { layer ->
            val inventoryFingerprint = layer.dependencyInventoryFingerprint ?: return@let
            layer.definitionFile(uri)?.let { file ->
                return AceTypeScriptDefinitionTarget(
                    kind = AceTypeScriptDefinitionTarget.Kind.DEPENDENCY_DECLARATION,
                    projectRootPath = layer.projectRootPath,
                    relativePath = file.relativePath,
                    line = line,
                    column = column,
                    endLine = endLine,
                    endColumn = endColumn,
                    contentSha256 = file.contentSha256,
                    dependencyInventoryFingerprint = inventoryFingerprint,
                )
            }
        }
        return null
    }

    @Synchronized
    internal fun bindProjectRename(
        candidate: AceTypeScriptProjectRenameCandidate,
        currentDocumentText: String,
    ): AceTypeScriptProjectRenameBoundCandidate? = projectSourceLayer?.let { layer ->
        candidate.bind(layer, currentDocumentText, sessionRevision)
    }

    @Synchronized
    internal fun isProjectRenameContextCurrent(
        candidate: AceTypeScriptProjectRenameBoundCandidate,
    ): Boolean {
        val layer = projectSourceLayer ?: return false
        return candidate.sessionRevision == sessionRevision &&
            candidate.projectRootPath == layer.projectRootPath &&
            candidate.documentUri == layer.documentUri &&
            candidate.projectSourceInventoryFingerprint == layer.sourceInventoryFingerprint
    }

    @Synchronized
    fun attach() {
        if (!attached) {
            attached = true
            sessionRevision += 1
        }
    }

    @Synchronized
    fun detach() {
        if (attached) {
            attached = false
            sessionRevision += 1
        }
    }

    @Synchronized
    fun snapshot(): AceLspServerSnapshot {
        val declarationGroups = AceEditorLspPreferences.normalizeDeclarationGroups(declarationGroupsProvider())
        val effectiveDeclarationGroups = AceEditorLspPreferences.resolveDeclarationGroups(declarationGroups)
        val configuredSemanticLanguages = semanticLanguagesProvider()
        val semanticLanguages = AceEditorLspPreferences.SUPPORTED_SEMANTIC_LANGUAGES.associateWith { language ->
            configuredSemanticLanguages[language]
                ?: AceEditorLspPreferences.defaultSemanticEnabled(language)
        }
        val enabled = enabledProvider()
        val semanticLanguage = AceEditorLspPreferences.semanticLanguageForDocument(documentPath)
        val semanticProviderId = when {
            !enabled -> null
            semanticLanguage == AceEditorLspPreferences.SEMANTIC_LANGUAGE_TYPESCRIPT &&
                semanticLanguages[AceEditorLspPreferences.SEMANTIC_LANGUAGE_TYPESCRIPT] == true ->
                TYPESCRIPT_IN_PROCESS_PROVIDER_ID
            semanticLanguage == AceEditorLspPreferences.SEMANTIC_LANGUAGE_PYTHON &&
                semanticLanguages[AceEditorLspPreferences.SEMANTIC_LANGUAGE_PYTHON] == true ->
                PYTHON_WORKER_PROVIDER_ID
            semanticLanguage == AceEditorLspPreferences.SEMANTIC_LANGUAGE_LUA &&
                semanticLanguages[AceEditorLspPreferences.SEMANTIC_LANGUAGE_LUA] == true ->
                LUA_LANGUAGE_SERVER_PROVIDER_ID
            semanticLanguage == AceEditorLspPreferences.SEMANTIC_LANGUAGE_JAVA &&
                semanticLanguages[AceEditorLspPreferences.SEMANTIC_LANGUAGE_JAVA] == true ->
                JAVA_ECJ_PROVIDER_ID
            else -> null
        }
        val semanticCapabilities = when (semanticProviderId) {
            TYPESCRIPT_IN_PROCESS_PROVIDER_ID -> SEMANTIC_PROVIDER_CAPABILITIES
            PYTHON_WORKER_PROVIDER_ID -> PYTHON_SEMANTIC_PROVIDER_CAPABILITIES
            LUA_LANGUAGE_SERVER_PROVIDER_ID -> LUA_SEMANTIC_PROVIDER_CAPABILITIES
            JAVA_ECJ_PROVIDER_ID -> JAVA_SEMANTIC_PROVIDER_CAPABILITIES
            else -> emptyList()
        }
        val typescriptProfile = AceTypeScriptExecutionProfiles.resolve(documentPath)
        val sourceLayer = projectSourceLayer
        val typeLayer = projectTypeLayer
        val libraryUris = libraryUrisFor(
            effectiveDeclarationGroups,
            typescriptProfile?.defaultLibraryUri ?: TYPESCRIPT_DEFAULT_LIBRARY_URI,
        )
        val luaWorkspace = if (semanticProviderId == LUA_LANGUAGE_SERVER_PROVIDER_ID) {
            AceLuaWorkspaceMapping.fromDocumentPath(documentPath)
        } else {
            null
        }
        val luaServerAvailable = semanticProviderId == LUA_LANGUAGE_SERVER_PROVIDER_ID &&
            luaServerAvailableProvider()
        val javaDiagnosticsAvailable = semanticProviderId == JAVA_ECJ_PROVIDER_ID &&
            javaDiagnosticsAvailableProvider()
        if (!enabled) {
            return AceLspServerSnapshot(
                enabled = false,
                attached = attached,
                state = STATE_DISABLED,
                declarationGroups = declarationGroups,
                effectiveDeclarationGroups = effectiveDeclarationGroups,
                libraryUris = libraryUris,
                semanticLanguages = semanticLanguages,
                semanticLanguage = semanticLanguage,
                semanticProviderId = semanticProviderId,
                semanticCapabilities = semanticCapabilities,
                sessionRevision = sessionRevision,
            )
        }
        if (!documentAllowedProvider(documentPath)) {
            return AceLspServerSnapshot(
                enabled = false,
                attached = attached,
                state = STATE_DISABLED_FILE_TYPE,
                reason = REASON_DISABLED_FILE_TYPE,
                declarationGroups = declarationGroups,
                effectiveDeclarationGroups = effectiveDeclarationGroups,
                libraryUris = libraryUris,
                semanticLanguages = semanticLanguages,
                semanticLanguage = semanticLanguage,
                semanticProviderId = semanticProviderId,
                semanticCapabilities = semanticCapabilities,
                sessionRevision = sessionRevision,
            )
        }
        return AceLspServerSnapshot(
            enabled = true,
            attached = attached,
            state = STATE_LOCAL_LANGUAGE_SERVICE,
            transport = when (semanticProviderId) {
                PYTHON_WORKER_PROVIDER_ID -> TRANSPORT_WEB_WORKER
                LUA_LANGUAGE_SERVER_PROVIDER_ID -> TRANSPORT_STDIO
                JAVA_ECJ_PROVIDER_ID -> TRANSPORT_ANDROID_BRIDGE
                else -> TRANSPORT_IN_PROCESS
            },
            serverUri = null,
            rootUri = luaWorkspace?.rootUri ?: SYNTHETIC_ROOT_URI,
            documentUri = luaWorkspace?.documentUri ?:
                sourceLayer?.documentUri ?: typeLayer?.documentUri ?: documentUriForPath(documentPath),
            typescriptVersion = AceTypeScriptExecutionProfiles.TYPESCRIPT_VERSION,
            typescriptProfile = typescriptProfile?.id,
            typescriptProfileRevision = typescriptProfile?.revision,
            semanticLanguages = semanticLanguages,
            semanticLanguage = semanticLanguage,
            semanticProviderId = semanticProviderId,
            semanticCapabilities = semanticCapabilities,
            declarationGroups = declarationGroups,
            effectiveDeclarationGroups = effectiveDeclarationGroups,
            libraryUris = libraryUris,
            projectSourceFileUris = sourceLayer?.fileUris.orEmpty(),
            projectSourceInventoryFingerprint = sourceLayer?.sourceInventoryFingerprint,
            projectSourceFileCount = sourceLayer?.sourceFileCount ?: 0,
            projectSourceByteLength = sourceLayer?.sourceByteLength ?: 0L,
            projectSnapshotSchemaRevision = sourceLayer?.schemaRevision,
            projectSnapshotReady = sourceLayer != null,
            projectTypeFileUris = typeLayer?.fileUris.orEmpty(),
            dependencyTypeNames = typeLayer?.typeDirectiveNames.orEmpty(),
            dependencyLayerFingerprint = typeLayer?.dependencyLayerFingerprint,
            dependencyInventoryFingerprint = typeLayer?.dependencyInventoryFingerprint,
            dependencyFileCount = typeLayer?.dependencyFileCount ?: 0,
            dependencyByteLength = typeLayer?.dependencyByteLength ?: 0L,
            dependencyPathByteLength = typeLayer?.dependencyPathByteLength ?: 0L,
            dependencyBoundaryCode = typeLayer?.dependencyBoundaryCode,
            dependencyBoundaryDetail = typeLayer?.dependencyBoundaryDetail,
            dependencyResolverPolicyRevision = DEPENDENCY_RESOLVER_POLICY_REVISION,
            dependencyResolverPolicyFingerprint = DEPENDENCY_RESOLVER_POLICY_FINGERPRINT,
            fallback = FALLBACK_STATIC_COMPLETION,
            startSupported = semanticProviderId == LUA_LANGUAGE_SERVER_PROVIDER_ID,
            serverAvailable = luaServerAvailable,
            reason = when (semanticProviderId) {
                TYPESCRIPT_IN_PROCESS_PROVIDER_ID -> REASON_LOCAL_LANGUAGE_SERVICE
                PYTHON_WORKER_PROVIDER_ID -> REASON_BUNDLED_PYTHON_WORKER
                LUA_LANGUAGE_SERVER_PROVIDER_ID -> if (luaServerAvailable) {
                    REASON_BUNDLED_LUA_LANGUAGE_SERVER
                } else {
                    REASON_LUA_LANGUAGE_SERVER_UNAVAILABLE
                }
                JAVA_ECJ_PROVIDER_ID -> if (javaDiagnosticsAvailable) {
                    REASON_BUNDLED_JAVA_ECJ
                } else {
                    REASON_JAVA_ECJ_UNAVAILABLE
                }
                else -> REASON_SEMANTIC_PROVIDER_DISABLED
            },
            completionProvider = COMPLETION_PROVIDER_LOCAL_INDEX,
            hoverProvider = HOVER_PROVIDER_LOCAL_INDEX,
            diagnosticProvider = DIAGNOSTIC_PROVIDER_ACE_JSHINT,
            signatureProvider = SIGNATURE_PROVIDER_STATIC_LOCAL,
            features = DEFAULT_FEATURES,
            maxDocumentLength = MAX_DOCUMENT_LENGTH,
            sessionRevision = sessionRevision,
        )
    }

    fun bridgeOptionsJson(): String {
        val snapshot = snapshot()
        if (!snapshot.enabled) {
            return "{}"
        }
        return buildString {
            append("{")
            append("\"enabled\":true")
            append(",\"manager\":").appendJsonString(MANAGER_NAME)
            append(",\"state\":").appendJsonString(snapshot.state)
            append(",\"transport\":").appendJsonString(snapshot.transport)
            append(",\"serverUri\":null")
            append(",\"rootUri\":").appendJsonString(snapshot.rootUri)
            append(",\"documentUri\":").appendJsonString(snapshot.documentUri)
            append(",\"typescriptVersion\":").appendJsonString(snapshot.typescriptVersion)
            append(",\"typescriptProfile\":").appendJsonString(snapshot.typescriptProfile)
            append(",\"typescriptProfileRevision\":")
            append(snapshot.typescriptProfileRevision ?: "null")
            append(",\"semanticLanguages\":{")
            append(
                AceEditorLspPreferences.SUPPORTED_SEMANTIC_LANGUAGES.joinToString(",") { language ->
                    "${jsonString(language)}:${snapshot.semanticLanguages[language] == true}"
                },
            )
            append("}")
            append(",\"semanticLanguage\":").appendJsonString(snapshot.semanticLanguage)
            append(",\"semanticProviderId\":").appendJsonString(snapshot.semanticProviderId)
            append(",\"semanticCapabilities\":")
            append(snapshot.semanticCapabilities.joinToString(prefix = "[", postfix = "]") { jsonString(it) })
            append(",\"declarationGroups\":")
            append(snapshot.declarationGroups.joinToString(prefix = "[", postfix = "]") { jsonString(it) })
            append(",\"effectiveDeclarationGroups\":")
            append(snapshot.effectiveDeclarationGroups.joinToString(prefix = "[", postfix = "]") { jsonString(it) })
            append(",\"libraryUris\":")
            append(snapshot.libraryUris.joinToString(prefix = "[", postfix = "]") { jsonString(it) })
            append(",\"projectSourceFileUris\":")
            append(snapshot.projectSourceFileUris.joinToString(prefix = "[", postfix = "]") { jsonString(it) })
            append(",\"projectSourceInventoryFingerprint\":")
                .appendJsonString(snapshot.projectSourceInventoryFingerprint)
            append(",\"projectSourceFileCount\":").append(snapshot.projectSourceFileCount)
            append(",\"projectSourceByteLength\":").append(snapshot.projectSourceByteLength)
            append(",\"projectSnapshotSchemaRevision\":")
                .append(snapshot.projectSnapshotSchemaRevision ?: "null")
            append(",\"projectSnapshotReady\":").append(snapshot.projectSnapshotReady)
            append(",\"projectTypeFileUris\":")
            append(snapshot.projectTypeFileUris.joinToString(prefix = "[", postfix = "]") { jsonString(it) })
            append(",\"dependencyTypeNames\":")
            append(snapshot.dependencyTypeNames.joinToString(prefix = "[", postfix = "]") { jsonString(it) })
            append(",\"dependencyLayerFingerprint\":")
                .appendJsonString(snapshot.dependencyLayerFingerprint)
            append(",\"dependencyInventoryFingerprint\":")
                .appendJsonString(snapshot.dependencyInventoryFingerprint)
            append(",\"dependencyFileCount\":").append(snapshot.dependencyFileCount)
            append(",\"dependencyByteLength\":").append(snapshot.dependencyByteLength)
            append(",\"dependencyPathByteLength\":").append(snapshot.dependencyPathByteLength)
            append(",\"dependencyBoundaryCode\":")
                .appendJsonString(snapshot.dependencyBoundaryCode)
            append(",\"dependencyBoundaryDetail\":")
                .appendJsonString(snapshot.dependencyBoundaryDetail)
            append(",\"dependencyResolverPolicyRevision\":")
                .append(snapshot.dependencyResolverPolicyRevision ?: "null")
            append(",\"dependencyResolverPolicyFingerprint\":")
                .appendJsonString(snapshot.dependencyResolverPolicyFingerprint)
            append(",\"fallback\":").appendJsonString(snapshot.fallback)
            append(",\"startSupported\":").append(snapshot.startSupported)
            append(",\"serverAvailable\":").append(snapshot.serverAvailable)
            append(",\"reason\":").appendJsonString(snapshot.reason)
            append(",\"completionProvider\":").appendJsonString(snapshot.completionProvider)
            append(",\"hoverProvider\":").appendJsonString(snapshot.hoverProvider)
            append(",\"diagnosticProvider\":").appendJsonString(snapshot.diagnosticProvider)
            append(",\"signatureProvider\":").appendJsonString(snapshot.signatureProvider)
            append(",\"features\":")
            append(snapshot.features.joinToString(prefix = "[", postfix = "]") { jsonString(it) })
            append(",\"maxDocumentLength\":").append(snapshot.maxDocumentLength)
            append("}")
        }
    }

    private fun StringBuilder.appendJsonString(value: String?): StringBuilder {
        return append(jsonString(value))
    }

    companion object {
        const val MANAGER_NAME = "native-local"
        const val STATE_DISABLED = "disabled"
        const val STATE_DISABLED_FILE_TYPE = "disabled-file-type"
        const val STATE_LOCAL_LANGUAGE_SERVICE = "local-language-service"
        const val TRANSPORT_IN_PROCESS = "in-process"
        const val TRANSPORT_WEB_WORKER = "web-worker"
        const val TRANSPORT_STDIO = "stdio"
        const val TRANSPORT_ANDROID_BRIDGE = "android-bridge"
        const val FALLBACK_STATIC_COMPLETION = "static-completion"
        const val REASON_DISABLED_FILE_TYPE = "file-type-disabled"
        const val REASON_LOCAL_LANGUAGE_SERVICE = "bundled-typescript-language-service"
        const val REASON_BUNDLED_PYTHON_WORKER = "bundled-pyright-worker"
        const val REASON_BUNDLED_LUA_LANGUAGE_SERVER = "bundled-luals"
        const val REASON_LUA_LANGUAGE_SERVER_UNAVAILABLE = "bundled-luals-unavailable-for-abi"
        const val REASON_BUNDLED_JAVA_ECJ = "bundled-java-ecj"
        const val REASON_JAVA_ECJ_UNAVAILABLE = "bundled-java-ecj-unavailable"
        const val REASON_SEMANTIC_PROVIDER_DISABLED = "semantic-provider-disabled-for-language"
        const val TYPESCRIPT_IN_PROCESS_PROVIDER_ID = "typescript-in-process"
        const val PYTHON_WORKER_PROVIDER_ID = "python-pyright-worker"
        const val LUA_LANGUAGE_SERVER_PROVIDER_ID = AceLuaLanguageServerRuntime.PROVIDER_ID
        const val JAVA_ECJ_PROVIDER_ID = AceJavaClasspathRuntime.PROVIDER_ID
        const val COMPLETION_PROVIDER_LOCAL_INDEX = "local-index"
        const val HOVER_PROVIDER_LOCAL_INDEX = "local-index"
        const val COMPLETION_PROVIDER_TYPESCRIPT = "typescript-language-service"
        const val HOVER_PROVIDER_TYPESCRIPT = "typescript-language-service"
        const val COMPLETION_PROVIDER_LUA_LANGUAGE_SERVER = "lua-language-server"
        const val HOVER_PROVIDER_LUA_LANGUAGE_SERVER = "lua-language-server"
        const val DIAGNOSTIC_PROVIDER_ACE_JSHINT = "ace-jshint"
        const val DIAGNOSTIC_PROVIDER_TYPESCRIPT = "typescript-language-service"
        const val DIAGNOSTIC_PROVIDER_LUA_LANGUAGE_SERVER = "lua-language-server"
        const val DIAGNOSTIC_PROVIDER_JAVA_ECJ = "java-ecj"
        const val SIGNATURE_PROVIDER_STATIC_LOCAL = "static-local"
        const val SIGNATURE_PROVIDER_TYPESCRIPT = "typescript-language-service"
        const val SIGNATURE_PROVIDER_LUA_LANGUAGE_SERVER = "lua-language-server"
        const val SYNTHETIC_ROOT_URI = "file:///autojs6/editor"
        const val SYNTHETIC_DOCUMENT_URI = "file:///autojs6/editor/current.js"
        const val MAX_DOCUMENT_LENGTH = 512 * 1024
        const val TYPESCRIPT_DEFAULT_LIBRARY_URI = "autojs6/typescript/lib.es2022.d.ts"
        const val TYPESCRIPT_ES2018_LIBRARY_URI = "autojs6/typescript/lib.es2018.d.ts"
        const val DEPENDENCY_RESOLVER_POLICY_REVISION = 4
        const val DEPENDENCY_RESOLVER_POLICY_FINGERPRINT =
            "d8207539237d2a08a6b97b530c5e6215f4b73311fdd6954ce9f8004717ebd635"
        const val CORE_LIBRARY_URI = "autojs6/types/generated/lib.autojs6.core.d.ts"
        const val COMPATIBILITY_LIBRARY_URI = "autojs6/types/lib.autojs6.extra.d.ts"
        const val ANDROID_LIBRARY_URI = "autojs6/types/generated/lib.autojs6.android.d.ts"
        const val LIBRARIES_LIBRARY_URI = "autojs6/types/generated/lib.autojs6.libraries.d.ts"
        const val RESOURCES_LIBRARY_URI = "autojs6/types/generated/lib.autojs6.resources.d.ts"
        const val MAIN_APP_LIBRARY_URI = "autojs6/types/generated/lib.autojs6.main-app.d.ts"

        val DEFAULT_LIBRARY_URIS = listOf(
            TYPESCRIPT_DEFAULT_LIBRARY_URI,
            CORE_LIBRARY_URI,
            COMPATIBILITY_LIBRARY_URI,
        )
        val DEFAULT_FEATURES = listOf(
            "completion",
            "hover",
            "diagnostics",
            "signatureHelp",
            "definition",
            "codeActions",
            "rename",
        )
        val SEMANTIC_PROVIDER_CAPABILITIES = listOf(
            "completion",
            "hover",
            "signatureHelp",
            "diagnostics",
            "definition",
            "rename",
            "codeActions",
            "dispose",
        )
        val PYTHON_SEMANTIC_PROVIDER_CAPABILITIES = listOf(
            "completion",
            "hover",
            "signatureHelp",
            "diagnostics",
            "definition",
            "dispose",
        )
        val LUA_SEMANTIC_PROVIDER_CAPABILITIES = listOf(
            "completion",
            "hover",
            "signatureHelp",
            "diagnostics",
            "definition",
            "dispose",
        )
        val JAVA_SEMANTIC_PROVIDER_CAPABILITIES = listOf(
            "diagnostics",
            "dispose",
        )

        private fun isValidDefinitionRange(
            line: Int,
            column: Int,
            endLine: Int,
            endColumn: Int,
        ): Boolean {
            if (line !in 0..MAX_DEFINITION_LINE || endLine !in 0..MAX_DEFINITION_LINE) {
                return false
            }
            if (column !in 0..MAX_DEFINITION_COLUMN || endColumn !in 0..MAX_DEFINITION_COLUMN) {
                return false
            }
            return endLine > line || endLine == line && endColumn >= column
        }

        private const val MAX_DEFINITION_LINE = 10_000_000
        private const val MAX_DEFINITION_COLUMN = 1_000_000

        private val DECLARATION_GROUP_LIBRARY_URIS = mapOf(
            AceEditorLspPreferences.DECLARATION_GROUP_ANDROID to ANDROID_LIBRARY_URI,
            AceEditorLspPreferences.DECLARATION_GROUP_LIBRARIES to LIBRARIES_LIBRARY_URI,
            AceEditorLspPreferences.DECLARATION_GROUP_RESOURCES to RESOURCES_LIBRARY_URI,
            AceEditorLspPreferences.DECLARATION_GROUP_MAIN_APP to MAIN_APP_LIBRARY_URI,
        )

        fun libraryUrisFor(
            declarationGroups: Collection<String>,
            defaultLibraryUri: String = TYPESCRIPT_DEFAULT_LIBRARY_URI,
        ): List<String> {
            return buildList {
                add(defaultLibraryUri)
                add(CORE_LIBRARY_URI)
                add(COMPATIBILITY_LIBRARY_URI)
                AceEditorLspPreferences.resolveDeclarationGroups(declarationGroups).forEach { group ->
                    DECLARATION_GROUP_LIBRARY_URIS[group]?.let(::add)
                }
            }
        }

        fun preferenceSnapshot(): AceLspServerSnapshot {
            return AceLspServerManager().snapshot()
        }

        fun documentUriForPath(path: String?): String {
            val fileName = documentFileName(path)
            return "$SYNTHETIC_ROOT_URI/${encodePathSegment(fileName)}"
        }

        private fun documentFileName(path: String?): String {
            return path
                ?.substringBefore('?')
                ?.substringBefore('#')
                ?.replace('\\', '/')
                ?.substringAfterLast('/')
                ?.takeIf { it.isNotBlank() }
                ?: SYNTHETIC_DOCUMENT_URI.substringAfterLast('/')
        }

        private fun encodePathSegment(value: String): String {
            return URLEncoder.encode(value, StandardCharsets.UTF_8.name())
                .replace("+", "%20")
        }

        private fun jsonString(value: String?): String {
            if (value == null) {
                return "null"
            }
            return buildString {
                append('"')
                for (ch in value) {
                    when (ch) {
                        '\\' -> append("\\\\")
                        '"' -> append("\\\"")
                        '\b' -> append("\\b")
                        '\u000C' -> append("\\f")
                        '\n' -> append("\\n")
                        '\r' -> append("\\r")
                        '\t' -> append("\\t")
                        else -> {
                            if (ch.code < 0x20) {
                                append("\\u")
                                append(ch.code.toString(16).padStart(4, '0'))
                            } else {
                                append(ch)
                            }
                        }
                    }
                }
                append('"')
            }
        }
    }
}

data class AceLspServerSnapshot(
    val enabled: Boolean,
    val attached: Boolean,
    val state: String,
    val transport: String? = null,
    val serverUri: String? = null,
    val rootUri: String? = null,
    val documentUri: String? = null,
    val typescriptVersion: String? = null,
    val typescriptProfile: String? = null,
    val typescriptProfileRevision: Int? = null,
    val semanticLanguages: Map<String, Boolean> = emptyMap(),
    val semanticLanguage: String? = null,
    val semanticProviderId: String? = null,
    val semanticCapabilities: List<String> = emptyList(),
    val declarationGroups: List<String> = emptyList(),
    val effectiveDeclarationGroups: List<String> = emptyList(),
    val libraryUris: List<String> = emptyList(),
    val projectSourceFileUris: List<String> = emptyList(),
    val projectSourceInventoryFingerprint: String? = null,
    val projectSourceFileCount: Int = 0,
    val projectSourceByteLength: Long = 0L,
    val projectSnapshotSchemaRevision: Int? = null,
    val projectSnapshotReady: Boolean = false,
    val projectTypeFileUris: List<String> = emptyList(),
    val dependencyTypeNames: List<String> = emptyList(),
    val dependencyLayerFingerprint: String? = null,
    val dependencyInventoryFingerprint: String? = null,
    val dependencyFileCount: Int = 0,
    val dependencyByteLength: Long = 0L,
    val dependencyPathByteLength: Long = 0L,
    val dependencyBoundaryCode: String? = null,
    val dependencyBoundaryDetail: String? = null,
    val dependencyResolverPolicyRevision: Int? = null,
    val dependencyResolverPolicyFingerprint: String? = null,
    val fallback: String? = null,
    val startSupported: Boolean = false,
    val serverAvailable: Boolean = false,
    val reason: String? = null,
    val completionProvider: String? = null,
    val hoverProvider: String? = null,
    val diagnosticProvider: String? = null,
    val signatureProvider: String? = null,
    val features: List<String> = emptyList(),
    val maxDocumentLength: Int = 0,
    val sessionRevision: Long = 0L,
)
