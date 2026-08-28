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
) {

    @Volatile
    private var attached = false

    @Volatile
    private var sessionRevision = 0L

    @Volatile
    private var documentPath: String = SYNTHETIC_DOCUMENT_URI

    @Volatile
    private var projectTypeLayer: AceTypeScriptProjectTypeLayer? = null

    @Synchronized
    fun setDocumentPath(path: String?) {
        val normalized = path?.takeIf { it.isNotBlank() } ?: SYNTHETIC_DOCUMENT_URI
        if (documentPath == normalized) {
            return
        }
        documentPath = normalized
        projectTypeLayer = null
        sessionRevision += 1
    }

    @Synchronized
    internal fun applyProjectTypeLayer(
        path: String?,
        layer: AceTypeScriptProjectTypeLayer?,
    ): Boolean {
        val normalized = path?.takeIf { it.isNotBlank() } ?: SYNTHETIC_DOCUMENT_URI
        if (documentPath != normalized) return false
        projectTypeLayer = layer
        sessionRevision += 1
        return true
    }

    @Synchronized
    fun readProjectTypeFile(uri: String): String? = projectTypeLayer?.read(uri)

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
        val typescriptProfile = AceTypeScriptExecutionProfiles.resolve(documentPath)
        val typeLayer = projectTypeLayer
        val libraryUris = libraryUrisFor(
            effectiveDeclarationGroups,
            typescriptProfile?.defaultLibraryUri ?: TYPESCRIPT_DEFAULT_LIBRARY_URI,
        )
        val enabled = enabledProvider()
        if (!enabled) {
            return AceLspServerSnapshot(
                enabled = false,
                attached = attached,
                state = STATE_DISABLED,
                declarationGroups = declarationGroups,
                effectiveDeclarationGroups = effectiveDeclarationGroups,
                libraryUris = libraryUris,
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
                sessionRevision = sessionRevision,
            )
        }
        return AceLspServerSnapshot(
            enabled = true,
            attached = attached,
            state = STATE_LOCAL_LANGUAGE_SERVICE,
            transport = TRANSPORT_IN_PROCESS,
            serverUri = null,
            rootUri = SYNTHETIC_ROOT_URI,
            documentUri = typeLayer?.documentUri ?: documentUriForPath(documentPath),
            typescriptVersion = AceTypeScriptExecutionProfiles.TYPESCRIPT_VERSION,
            typescriptProfile = typescriptProfile?.id,
            typescriptProfileRevision = typescriptProfile?.revision,
            declarationGroups = declarationGroups,
            effectiveDeclarationGroups = effectiveDeclarationGroups,
            libraryUris = libraryUris,
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
            startSupported = false,
            serverAvailable = false,
            reason = REASON_LOCAL_LANGUAGE_SERVICE,
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
            append(",\"declarationGroups\":")
            append(snapshot.declarationGroups.joinToString(prefix = "[", postfix = "]") { jsonString(it) })
            append(",\"effectiveDeclarationGroups\":")
            append(snapshot.effectiveDeclarationGroups.joinToString(prefix = "[", postfix = "]") { jsonString(it) })
            append(",\"libraryUris\":")
            append(snapshot.libraryUris.joinToString(prefix = "[", postfix = "]") { jsonString(it) })
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
        const val FALLBACK_STATIC_COMPLETION = "static-completion"
        const val REASON_DISABLED_FILE_TYPE = "file-type-disabled"
        const val REASON_LOCAL_LANGUAGE_SERVICE = "bundled-typescript-language-service"
        const val COMPLETION_PROVIDER_LOCAL_INDEX = "local-index"
        const val HOVER_PROVIDER_LOCAL_INDEX = "local-index"
        const val COMPLETION_PROVIDER_TYPESCRIPT = "typescript-language-service"
        const val HOVER_PROVIDER_TYPESCRIPT = "typescript-language-service"
        const val DIAGNOSTIC_PROVIDER_ACE_JSHINT = "ace-jshint"
        const val DIAGNOSTIC_PROVIDER_TYPESCRIPT = "typescript-language-service"
        const val SIGNATURE_PROVIDER_STATIC_LOCAL = "static-local"
        const val SIGNATURE_PROVIDER_TYPESCRIPT = "typescript-language-service"
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
        val DEFAULT_FEATURES = listOf("completion", "hover", "diagnostics", "signatureHelp")

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
    val declarationGroups: List<String> = emptyList(),
    val effectiveDeclarationGroups: List<String> = emptyList(),
    val libraryUris: List<String> = emptyList(),
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
