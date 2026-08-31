package io.github.supermonster003.autojs6.plugin.ace.editor.core.lsp

import io.github.supermonster003.autojs6.plugin.ace.editor.core.AceEditorLspPreferences
import java.io.File
import java.net.URI
import java.nio.file.Files
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class AceLspServerManagerTest {

    @Test
    fun disabledManagerReturnsEmptyBridgeOptions() {
        val manager = manager(enabled = false)

        val snapshot = manager.snapshot()

        assertFalse(snapshot.enabled)
        assertEquals(AceLspServerManager.STATE_DISABLED, snapshot.state)
        assertEquals("{}", manager.bridgeOptionsJson())
    }

    @Test
    fun enabledManagerReportsLocalLanguageServiceOptions() {
        val manager = manager(enabled = true)
        manager.attach()

        val snapshot = manager.snapshot()
        val optionsJson = manager.bridgeOptionsJson()

        assertTrue(snapshot.enabled)
        assertTrue(snapshot.attached)
        assertEquals(1L, snapshot.sessionRevision)
        assertEquals(AceLspServerManager.STATE_LOCAL_LANGUAGE_SERVICE, snapshot.state)
        assertEquals(AceLspServerManager.TRANSPORT_IN_PROCESS, snapshot.transport)
        assertFalse(snapshot.startSupported)
        assertFalse(snapshot.serverAvailable)
        assertEquals(AceLspServerManager.FALLBACK_STATIC_COMPLETION, snapshot.fallback)
        assertEquals(AceLspServerManager.COMPLETION_PROVIDER_LOCAL_INDEX, snapshot.completionProvider)
        assertEquals(AceLspServerManager.HOVER_PROVIDER_LOCAL_INDEX, snapshot.hoverProvider)
        assertEquals(AceLspServerManager.DIAGNOSTIC_PROVIDER_ACE_JSHINT, snapshot.diagnosticProvider)
        assertEquals(AceLspServerManager.SIGNATURE_PROVIDER_STATIC_LOCAL, snapshot.signatureProvider)
        assertEquals(AceLspServerManager.DEFAULT_FEATURES, snapshot.features)
        assertEquals(AceLspServerManager.MAX_DOCUMENT_LENGTH, snapshot.maxDocumentLength)
        assertEquals(AceLspServerManager.SYNTHETIC_ROOT_URI, snapshot.rootUri)
        assertEquals(AceLspServerManager.SYNTHETIC_DOCUMENT_URI, snapshot.documentUri)
        assertEquals(AceTypeScriptExecutionProfiles.TYPESCRIPT_VERSION, snapshot.typescriptVersion)
        assertEquals(null, snapshot.typescriptProfile)
        assertEquals(null, snapshot.typescriptProfileRevision)
        assertEquals(
            AceEditorLspPreferences.SEMANTIC_LANGUAGE_TYPESCRIPT,
            snapshot.semanticLanguage,
        )
        assertEquals(AceLspServerManager.TYPESCRIPT_IN_PROCESS_PROVIDER_ID, snapshot.semanticProviderId)
        assertEquals(AceLspServerManager.SEMANTIC_PROVIDER_CAPABILITIES, snapshot.semanticCapabilities)
        assertEquals(AceEditorLspPreferences.DEFAULT_SEMANTIC_LANGUAGES, snapshot.semanticLanguages)
        assertTrue(snapshot.declarationGroups.isEmpty())
        assertTrue(snapshot.effectiveDeclarationGroups.isEmpty())
        assertEquals(
            listOf(
                AceLspServerManager.TYPESCRIPT_DEFAULT_LIBRARY_URI,
                AceLspServerManager.CORE_LIBRARY_URI,
                AceLspServerManager.COMPATIBILITY_LIBRARY_URI,
            ),
            AceLspServerManager.DEFAULT_LIBRARY_URIS,
        )
        assertEquals(AceLspServerManager.DEFAULT_LIBRARY_URIS, snapshot.libraryUris)
        assertFalse(snapshot.projectSnapshotReady)
        assertTrue(snapshot.projectSourceFileUris.isEmpty())
        assertEquals(0, snapshot.projectSourceFileCount)
        assertEquals(0L, snapshot.projectSourceByteLength)

        assertTrue(optionsJson.contains("\"enabled\":true"))
        assertTrue(optionsJson.contains("\"manager\":\"${AceLspServerManager.MANAGER_NAME}\""))
        assertTrue(optionsJson.contains("\"state\":\"${AceLspServerManager.STATE_LOCAL_LANGUAGE_SERVICE}\""))
        assertTrue(optionsJson.contains("\"transport\":\"${AceLspServerManager.TRANSPORT_IN_PROCESS}\""))
        assertTrue(optionsJson.contains("\"serverUri\":null"))
        assertTrue(optionsJson.contains("\"rootUri\":\"${AceLspServerManager.SYNTHETIC_ROOT_URI}\""))
        assertTrue(optionsJson.contains("\"documentUri\":\"${AceLspServerManager.SYNTHETIC_DOCUMENT_URI}\""))
        assertTrue(
            optionsJson.contains(
                "\"typescriptVersion\":\"${AceTypeScriptExecutionProfiles.TYPESCRIPT_VERSION}\"",
            ),
        )
        assertTrue(optionsJson.contains("\"typescriptProfile\":null"))
        assertTrue(optionsJson.contains("\"typescriptProfileRevision\":null"))
        assertTrue(optionsJson.contains("\"semanticLanguage\":\"typescript\""))
        assertTrue(optionsJson.contains("\"semanticProviderId\":\"typescript-in-process\""))
        assertTrue(optionsJson.contains("\"semanticLanguages\":{\"typescript\":true,\"python\":true"))
        assertTrue(optionsJson.contains("\"semanticCapabilities\":[\"completion\", \"hover\""))
        assertTrue(optionsJson.contains("\"declarationGroups\":[]"))
        assertTrue(optionsJson.contains("\"effectiveDeclarationGroups\":[]"))
        assertTrue(optionsJson.contains("\"projectSourceFileUris\":[]"))
        assertTrue(optionsJson.contains("\"projectSourceInventoryFingerprint\":null"))
        assertTrue(optionsJson.contains("\"projectSourceFileCount\":0"))
        assertTrue(optionsJson.contains("\"projectSourceByteLength\":0"))
        assertTrue(optionsJson.contains("\"projectSnapshotSchemaRevision\":null"))
        assertTrue(optionsJson.contains("\"projectSnapshotReady\":false"))
        AceLspServerManager.DEFAULT_LIBRARY_URIS.forEach { uri ->
            assertTrue(optionsJson.contains("\"$uri\""))
        }
        assertTrue(optionsJson.contains("\"fallback\":\"${AceLspServerManager.FALLBACK_STATIC_COMPLETION}\""))
        assertTrue(optionsJson.contains("\"startSupported\":false"))
        assertTrue(optionsJson.contains("\"serverAvailable\":false"))
        assertTrue(optionsJson.contains("\"reason\":\"${AceLspServerManager.REASON_LOCAL_LANGUAGE_SERVICE}\""))
        assertTrue(optionsJson.contains("\"completionProvider\":\"${AceLspServerManager.COMPLETION_PROVIDER_LOCAL_INDEX}\""))
        assertTrue(optionsJson.contains("\"hoverProvider\":\"${AceLspServerManager.HOVER_PROVIDER_LOCAL_INDEX}\""))
        assertTrue(optionsJson.contains("\"diagnosticProvider\":\"${AceLspServerManager.DIAGNOSTIC_PROVIDER_ACE_JSHINT}\""))
        assertTrue(optionsJson.contains("\"signatureProvider\":\"${AceLspServerManager.SIGNATURE_PROVIDER_STATIC_LOCAL}\""))
        assertTrue(
            optionsJson.contains(
                "\"features\":[\"completion\", \"hover\", \"diagnostics\", " +
                    "\"signatureHelp\", \"definition\", \"codeActions\", \"rename\"]",
            ),
        )
        assertTrue(optionsJson.contains("\"maxDocumentLength\":${AceLspServerManager.MAX_DOCUMENT_LENGTH}"))
    }

    @Test
    fun attachAndDetachAdvanceSessionRevisionOnlyOnStateChange() {
        val manager = manager(enabled = true)

        assertEquals(0L, manager.snapshot().sessionRevision)
        manager.attach()
        manager.attach()
        assertEquals(1L, manager.snapshot().sessionRevision)
        manager.detach()
        manager.detach()
        assertEquals(2L, manager.snapshot().sessionRevision)
        assertFalse(manager.snapshot().attached)
    }

    @Test
    fun disabledFileTypeReturnsEmptyBridgeOptions() {
        val manager = manager(enabled = true)

        manager.setDocumentPath("notes.txt")
        val snapshot = manager.snapshot()

        assertFalse(snapshot.enabled)
        assertEquals(AceLspServerManager.STATE_DISABLED_FILE_TYPE, snapshot.state)
        assertEquals(AceLspServerManager.REASON_DISABLED_FILE_TYPE, snapshot.reason)
        assertEquals("{}", manager.bridgeOptionsJson())
    }

    @Test
    fun untitledDocumentUsesStableSyntheticJavaScriptUri() {
        val manager = manager(enabled = true)

        manager.setDocumentPath(null)
        val snapshot = manager.snapshot()

        assertTrue(snapshot.enabled)
        assertEquals(0L, snapshot.sessionRevision)
        assertEquals(AceLspServerManager.SYNTHETIC_DOCUMENT_URI, snapshot.documentUri)
    }

    @Test
    fun changingDocumentPathAdvancesSessionRevisionAndAllowsConfiguredType() {
        val manager = manager(enabled = true)

        manager.setDocumentPath("main.node.js")
        val snapshot = manager.snapshot()

        assertTrue(snapshot.enabled)
        assertEquals(1L, snapshot.sessionRevision)
        assertEquals(AceLspServerManager.STATE_LOCAL_LANGUAGE_SERVICE, snapshot.state)
        assertEquals("file:///autojs6/editor/main.node.js", snapshot.documentUri)
    }

    @Test
    fun jsonDocumentPathKeepsJsonSuffixInBridgeOptions() {
        val manager = AceLspServerManager(
            enabledProvider = { true },
            documentAllowedProvider = { it?.lowercase()?.endsWith(".json") == true },
        )

        manager.setDocumentPath("D:\\scripts\\config file.json")
        val snapshot = manager.snapshot()
        val optionsJson = manager.bridgeOptionsJson()

        assertTrue(snapshot.enabled)
        assertEquals("file:///autojs6/editor/config%20file.json", snapshot.documentUri)
        assertTrue(optionsJson.contains("\"documentUri\":\"file:///autojs6/editor/config%20file.json\""))
    }

    @Test
    fun pythonUsesBundledWorkerWhileItsSemanticSwitchIsOn() {
        val manager = AceLspServerManager(enabledProvider = { true })

        manager.setDocumentPath("/storage/emulated/0/Scripts/main.py")
        val snapshot = manager.snapshot()
        val options = manager.bridgeOptionsJson()

        assertTrue(snapshot.enabled)
        assertEquals(AceEditorLspPreferences.SEMANTIC_LANGUAGE_PYTHON, snapshot.semanticLanguage)
        assertEquals(AceLspServerManager.PYTHON_WORKER_PROVIDER_ID, snapshot.semanticProviderId)
        assertEquals(
            AceLspServerManager.PYTHON_SEMANTIC_PROVIDER_CAPABILITIES,
            snapshot.semanticCapabilities,
        )
        assertEquals(AceLspServerManager.TRANSPORT_WEB_WORKER, snapshot.transport)
        assertEquals(AceLspServerManager.REASON_BUNDLED_PYTHON_WORKER, snapshot.reason)
        assertTrue(options.contains("\"python\":true"))
        assertTrue(options.contains("\"semanticProviderId\":\"python-pyright-worker\""))
    }

    @Test
    fun perLanguageSemanticSwitchCanRestorePythonM2Fallback() {
        val semanticLanguages = AceEditorLspPreferences.DEFAULT_SEMANTIC_LANGUAGES
            .toMutableMap()
            .apply {
                this[AceEditorLspPreferences.SEMANTIC_LANGUAGE_PYTHON] = false
            }
        val manager = AceLspServerManager(
            enabledProvider = { true },
            semanticLanguagesProvider = { semanticLanguages },
        )

        manager.setDocumentPath("/storage/emulated/0/Scripts/main.py")
        val snapshot = manager.snapshot()
        val options = manager.bridgeOptionsJson()

        assertTrue(snapshot.enabled)
        assertEquals(null, snapshot.semanticProviderId)
        assertTrue(snapshot.semanticCapabilities.isEmpty())
        assertEquals(AceLspServerManager.TRANSPORT_IN_PROCESS, snapshot.transport)
        assertEquals(AceLspServerManager.REASON_SEMANTIC_PROVIDER_DISABLED, snapshot.reason)
        assertTrue(options.contains("\"python\":false"))
        assertTrue(options.contains("\"semanticProviderId\":null"))
    }

    @Test
    fun javaUsesBundledEcjDiagnosticsOverTheAndroidBridge() {
        val manager = AceLspServerManager(
            enabledProvider = { true },
            javaDiagnosticsAvailableProvider = { true },
        )

        manager.setDocumentPath("/storage/emulated/0/Scripts/Main.java")
        val snapshot = manager.snapshot()
        val options = manager.bridgeOptionsJson()

        assertTrue(snapshot.enabled)
        assertEquals(AceEditorLspPreferences.SEMANTIC_LANGUAGE_JAVA, snapshot.semanticLanguage)
        assertEquals(AceLspServerManager.JAVA_ECJ_PROVIDER_ID, snapshot.semanticProviderId)
        assertEquals(
            AceLspServerManager.JAVA_SEMANTIC_PROVIDER_CAPABILITIES,
            snapshot.semanticCapabilities,
        )
        assertEquals(AceLspServerManager.TRANSPORT_ANDROID_BRIDGE, snapshot.transport)
        assertEquals(AceLspServerManager.REASON_BUNDLED_JAVA_ECJ, snapshot.reason)
        assertEquals(AceLspServerManager.COMPLETION_PROVIDER_LOCAL_INDEX, snapshot.completionProvider)
        assertTrue(options.contains("\"java\":true"))
        assertTrue(options.contains("\"semanticProviderId\":\"java-ecj\""))
        assertTrue(options.contains("\"transport\":\"android-bridge\""))
    }

    @Test
    fun unavailableJavaRuntimeRetainsP2CompletionAndReportsItsGate() {
        val manager = AceLspServerManager(
            enabledProvider = { true },
            javaDiagnosticsAvailableProvider = { false },
        )

        manager.setDocumentPath("Main.java")
        val snapshot = manager.snapshot()

        assertEquals(AceLspServerManager.JAVA_ECJ_PROVIDER_ID, snapshot.semanticProviderId)
        assertEquals(AceLspServerManager.TRANSPORT_ANDROID_BRIDGE, snapshot.transport)
        assertEquals(AceLspServerManager.REASON_JAVA_ECJ_UNAVAILABLE, snapshot.reason)
        assertEquals(AceLspServerManager.COMPLETION_PROVIDER_LOCAL_INDEX, snapshot.completionProvider)
        assertEquals(AceLspServerManager.HOVER_PROVIDER_LOCAL_INDEX, snapshot.hoverProvider)
        assertEquals(AceLspServerManager.SIGNATURE_PROVIDER_STATIC_LOCAL, snapshot.signatureProvider)
    }

    @Test
    fun luaUsesBundledStdioServerAndPhysicalWorkspaceWhenItsAbiIsAvailable() {
        val projectRoot = Files.createTempDirectory("autojs6-lua-manager").toFile()
        try {
            val document = File(projectRoot, "main script.lua")
            val manager = AceLspServerManager(
                enabledProvider = { true },
                luaServerAvailableProvider = { true },
            )

            manager.setDocumentPath(document.absolutePath)
            val snapshot = manager.snapshot()
            val options = manager.bridgeOptionsJson()

            assertTrue(snapshot.enabled)
            assertEquals(AceEditorLspPreferences.SEMANTIC_LANGUAGE_LUA, snapshot.semanticLanguage)
            assertEquals(AceLspServerManager.LUA_LANGUAGE_SERVER_PROVIDER_ID, snapshot.semanticProviderId)
            assertEquals(
                AceLspServerManager.LUA_SEMANTIC_PROVIDER_CAPABILITIES,
                snapshot.semanticCapabilities,
            )
            assertEquals(AceLspServerManager.TRANSPORT_STDIO, snapshot.transport)
            assertTrue(snapshot.startSupported)
            assertTrue(snapshot.serverAvailable)
            assertEquals(AceLspServerManager.REASON_BUNDLED_LUA_LANGUAGE_SERVER, snapshot.reason)
            assertEquals(projectRoot.canonicalFile, File(URI(snapshot.rootUri)).canonicalFile)
            assertEquals(document.canonicalFile, File(URI(snapshot.documentUri)).canonicalFile)
            assertTrue(options.contains("\"lua\":true"))
            assertTrue(options.contains("\"semanticProviderId\":\"lua-luals\""))
            assertTrue(options.contains("\"transport\":\"stdio\""))
            assertTrue(options.contains("\"startSupported\":true"))
            assertTrue(options.contains("\"serverAvailable\":true"))
        } finally {
            projectRoot.deleteRecursively()
        }
    }

    @Test
    fun unavailableLuaAbiRetainsStaticFallbackAndReportsDeterministicReason() {
        val projectRoot = Files.createTempDirectory("autojs6-lua-unavailable").toFile()
        try {
            val manager = AceLspServerManager(
                enabledProvider = { true },
                luaServerAvailableProvider = { false },
            )

            manager.setDocumentPath(File(projectRoot, "main.lua").absolutePath)
            val snapshot = manager.snapshot()

            assertEquals(AceLspServerManager.LUA_LANGUAGE_SERVER_PROVIDER_ID, snapshot.semanticProviderId)
            assertEquals(AceLspServerManager.TRANSPORT_STDIO, snapshot.transport)
            assertTrue(snapshot.startSupported)
            assertFalse(snapshot.serverAvailable)
            assertEquals(AceLspServerManager.REASON_LUA_LANGUAGE_SERVER_UNAVAILABLE, snapshot.reason)
            assertEquals(AceLspServerManager.COMPLETION_PROVIDER_LOCAL_INDEX, snapshot.completionProvider)
            assertEquals(AceLspServerManager.HOVER_PROVIDER_LOCAL_INDEX, snapshot.hoverProvider)
            assertEquals(AceLspServerManager.SIGNATURE_PROVIDER_STATIC_LOCAL, snapshot.signatureProvider)
        } finally {
            projectRoot.deleteRecursively()
        }
    }

    @Test
    fun perLanguageSemanticSwitchCanRestoreLuaM2Fallback() {
        val semanticLanguages = AceEditorLspPreferences.DEFAULT_SEMANTIC_LANGUAGES
            .toMutableMap()
            .apply {
                this[AceEditorLspPreferences.SEMANTIC_LANGUAGE_LUA] = false
            }
        val projectRoot = Files.createTempDirectory("autojs6-lua-disabled").toFile()
        try {
            val manager = AceLspServerManager(
                enabledProvider = { true },
                semanticLanguagesProvider = { semanticLanguages },
                luaServerAvailableProvider = { true },
            )

            manager.setDocumentPath(File(projectRoot, "main.lua").absolutePath)
            val snapshot = manager.snapshot()

            assertEquals(null, snapshot.semanticProviderId)
            assertTrue(snapshot.semanticCapabilities.isEmpty())
            assertEquals(AceLspServerManager.TRANSPORT_IN_PROCESS, snapshot.transport)
            assertFalse(snapshot.startSupported)
            assertFalse(snapshot.serverAvailable)
            assertEquals(AceLspServerManager.REASON_SEMANTIC_PROVIDER_DISABLED, snapshot.reason)
            assertTrue(manager.bridgeOptionsJson().contains("\"lua\":false"))
        } finally {
            projectRoot.deleteRecursively()
        }
    }

    @Test
    fun perLanguageSemanticSwitchCanDisableTypeScriptWithoutDisablingM2() {
        val semanticLanguages = AceEditorLspPreferences.DEFAULT_SEMANTIC_LANGUAGES.toMutableMap().apply {
            this[AceEditorLspPreferences.SEMANTIC_LANGUAGE_TYPESCRIPT] = false
        }
        val manager = AceLspServerManager(
            enabledProvider = { true },
            semanticLanguagesProvider = { semanticLanguages },
        )

        manager.setDocumentPath("main.ts")
        val snapshot = manager.snapshot()

        assertTrue(snapshot.enabled)
        assertEquals(null, snapshot.semanticProviderId)
        assertTrue(snapshot.semanticCapabilities.isEmpty())
        assertEquals(AceLspServerManager.COMPLETION_PROVIDER_LOCAL_INDEX, snapshot.completionProvider)
        assertTrue(manager.bridgeOptionsJson().contains("\"typescript\":false"))
    }

    @Test
    fun rhinoTypeScriptUsesExecutionCompilerProfileAndEs2018Library() {
        val manager = AceLspServerManager(enabledProvider = { true })

        manager.setDocumentPath("D:\\scripts\\main.tsx")
        val snapshot = manager.snapshot()
        val optionsJson = manager.bridgeOptionsJson()

        assertEquals(AceTypeScriptExecutionProfiles.PROFILE_RHINO, snapshot.typescriptProfile)
        assertEquals(AceTypeScriptExecutionProfiles.RHINO_PROFILE_REVISION, snapshot.typescriptProfileRevision)
        assertEquals(AceLspServerManager.TYPESCRIPT_ES2018_LIBRARY_URI, snapshot.libraryUris.first())
        assertTrue(optionsJson.contains("\"typescriptProfile\":\"rhino\""))
        assertTrue(optionsJson.contains("\"typescriptProfileRevision\":2"))
    }

    @Test
    fun nodeTypeScriptUsesNodeNextExecutionProfileAndEs2018Library() {
        val manager = AceLspServerManager(enabledProvider = { true })

        manager.setDocumentPath("/storage/emulated/0/Scripts/main.mts")
        val snapshot = manager.snapshot()

        assertEquals(AceTypeScriptExecutionProfiles.PROFILE_NODE, snapshot.typescriptProfile)
        assertEquals(AceTypeScriptExecutionProfiles.NODE_PROFILE_REVISION, snapshot.typescriptProfileRevision)
        assertEquals(AceLspServerManager.TYPESCRIPT_ES2018_LIBRARY_URI, snapshot.libraryUris.first())
    }

    @Test
    fun selectedDeclarationGroupsAndDependencyClosureAreReported() {
        val manager = manager(
            enabled = true,
            declarationGroups = listOf(
                AceEditorLspPreferences.DECLARATION_GROUP_RESOURCES,
                AceEditorLspPreferences.DECLARATION_GROUP_LIBRARIES,
                "unsupported",
            ),
        )

        val snapshot = manager.snapshot()
        val optionsJson = manager.bridgeOptionsJson()

        assertEquals(
            listOf(
                AceEditorLspPreferences.DECLARATION_GROUP_LIBRARIES,
                AceEditorLspPreferences.DECLARATION_GROUP_RESOURCES,
            ),
            snapshot.declarationGroups,
        )
        assertEquals(
            listOf(
                AceEditorLspPreferences.DECLARATION_GROUP_ANDROID,
                AceEditorLspPreferences.DECLARATION_GROUP_LIBRARIES,
                AceEditorLspPreferences.DECLARATION_GROUP_RESOURCES,
            ),
            snapshot.effectiveDeclarationGroups,
        )
        assertEquals(
            AceLspServerManager.DEFAULT_LIBRARY_URIS + listOf(
                AceLspServerManager.ANDROID_LIBRARY_URI,
                AceLspServerManager.LIBRARIES_LIBRARY_URI,
                AceLspServerManager.RESOURCES_LIBRARY_URI,
            ),
            snapshot.libraryUris,
        )
        assertTrue(optionsJson.contains("\"declarationGroups\":[\"libraries\", \"resources\"]"))
        assertTrue(
            optionsJson.contains(
                "\"effectiveDeclarationGroups\":[\"android\", \"libraries\", \"resources\"]",
            ),
        )
    }

    @Test
    fun mainAppDeclarationGroupEnablesEveryGeneratedLibrary() {
        val manager = manager(
            enabled = true,
            declarationGroups = listOf(AceEditorLspPreferences.DECLARATION_GROUP_MAIN_APP),
        )

        assertEquals(
            AceEditorLspPreferences.SUPPORTED_DECLARATION_GROUPS,
            manager.snapshot().effectiveDeclarationGroups,
        )
        assertEquals(
            AceLspServerManager.DEFAULT_LIBRARY_URIS + listOf(
                AceLspServerManager.ANDROID_LIBRARY_URI,
                AceLspServerManager.LIBRARIES_LIBRARY_URI,
                AceLspServerManager.RESOURCES_LIBRARY_URI,
                AceLspServerManager.MAIN_APP_LIBRARY_URI,
            ),
            manager.snapshot().libraryUris,
        )
    }

    private fun manager(
        enabled: Boolean,
        declarationGroups: Collection<String> = emptyList(),
    ): AceLspServerManager {
        return AceLspServerManager(
            enabledProvider = { enabled },
            documentAllowedProvider = { path ->
                listOf(".js", ".node.js").any { suffix ->
                    path?.lowercase()?.endsWith(suffix) == true
                }
            },
            declarationGroupsProvider = { declarationGroups },
        )
    }
}
