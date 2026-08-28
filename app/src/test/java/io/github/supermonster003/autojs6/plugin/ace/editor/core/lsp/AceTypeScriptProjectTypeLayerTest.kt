package io.github.supermonster003.autojs6.plugin.ace.editor.core.lsp

import java.io.File
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder

class AceTypeScriptProjectTypeLayerTest {

    @get:Rule
    val temporaryFolder = TemporaryFolder()

    @Test
    fun capturesCompilerCompatibleDependencyInventoryAndProjectUris() {
        val fixture = projectFixture()

        val first = requireNotNull(
            AceTypeScriptProjectTypeLayer.capture(fixture.document.path, AceTypeScriptExecutionProfiles.RHINO),
        )
        val second = requireNotNull(
            AceTypeScriptProjectTypeLayer.capture(fixture.document.path, AceTypeScriptExecutionProfiles.RHINO),
        )

        assertEquals(
            "file:///autojs6/editor/src/main.ts",
            first.documentUri,
        )
        assertEquals(listOf("ambient"), first.typeDirectiveNames)
        assertEquals(5, first.dependencyFileCount)
        assertEquals(first.dependencyLayerFingerprint, second.dependencyLayerFingerprint)
        assertEquals(first.dependencyInventoryFingerprint, second.dependencyInventoryFingerprint)
        assertEquals(64, requireNotNull(first.dependencyLayerFingerprint).length)
        assertEquals(64, requireNotNull(first.dependencyInventoryFingerprint).length)
        assertEquals(
            "declare function dayjs(): Dayjs; export = dayjs; interface Dayjs { format(): string; }",
            first.read("file:///autojs6/editor/node_modules/dayjs/index.d.ts"),
        )
        assertTrue(
            "file:///autojs6/editor/node_modules/@types/ambient/index.d.ts" in first.fileUris,
        )
        assertFalse(first.fileUris.any { uri -> "docs" in uri || uri.endsWith("ignored.md") })

        fixture.dayjsTypes.writeText(
            "declare function dayjs(): Dayjs; export = dayjs; interface Dayjs { unix(): number; }",
        )
        val changed = requireNotNull(
            AceTypeScriptProjectTypeLayer.capture(fixture.document.path, AceTypeScriptExecutionProfiles.RHINO),
        )
        assertNotEquals(first.dependencyInventoryFingerprint, changed.dependencyInventoryFingerprint)
        assertNotEquals(first.dependencyLayerFingerprint, changed.dependencyLayerFingerprint)
    }

    @Test
    fun managerPublishesAndServesOnlyTheAppliedFrozenLayer() {
        val fixture = projectFixture()
        val layer = requireNotNull(
            AceTypeScriptProjectTypeLayer.capture(fixture.document.path, AceTypeScriptExecutionProfiles.RHINO),
        )
        val manager = AceLspServerManager(enabledProvider = { true })
        manager.setDocumentPath(fixture.document.path)

        assertTrue(manager.applyProjectTypeLayer(fixture.document.path, layer))
        val snapshot = manager.snapshot()
        val options = manager.bridgeOptionsJson()

        assertEquals(layer.documentUri, snapshot.documentUri)
        assertEquals(layer.dependencyFileCount, snapshot.dependencyFileCount)
        assertEquals(layer.dependencyLayerFingerprint, snapshot.dependencyLayerFingerprint)
        assertEquals(listOf("ambient"), snapshot.dependencyTypeNames)
        assertTrue(options.contains("\"dependencyResolverPolicyRevision\":4"))
        assertTrue(options.contains(requireNotNull(layer.dependencyLayerFingerprint)))
        assertNotNull(
            manager.readProjectFile(
                "file:///autojs6/editor/node_modules/dayjs/index.d.ts",
            ),
        )
        val definition = requireNotNull(
            manager.resolveDefinitionTarget(
                uri = "file:///autojs6/editor/node_modules/dayjs/index.d.ts",
                line = 0,
                column = 17,
                endLine = 0,
                endColumn = 22,
            ),
        )
        assertEquals(AceTypeScriptDefinitionTarget.Kind.DEPENDENCY_DECLARATION, definition.kind)
        assertEquals("node_modules/dayjs/index.d.ts", definition.relativePath)
        assertEquals(layer.dependencyInventoryFingerprint, definition.dependencyInventoryFingerprint)
        assertNull(definition.projectSourceInventoryFingerprint)
        assertNull(
            manager.resolveDefinitionTarget(
                uri = "file:///autojs6/editor/node_modules/dayjs/package.json",
                line = 0,
                column = 0,
                endLine = 0,
                endColumn = 1,
            ),
        )
        assertNull(
            manager.resolveDefinitionTarget(
                uri = "file:///autojs6/editor/node_modules/dayjs/index.d.ts",
                line = 1,
                column = 0,
                endLine = 0,
                endColumn = 0,
            ),
        )

        manager.setDocumentPath(File(fixture.root, "src/other.ts").path)
        assertFalse(manager.applyProjectTypeLayer(fixture.document.path, layer))
        assertNull(manager.readProjectFile("file:///autojs6/editor/node_modules/dayjs/index.d.ts"))
    }

    @Test
    fun publishesDeterministicNativeDependencyBoundaryForEditorDiagnostics() {
        val root = temporaryFolder.newFolder("native-project")
        File(root, "tsconfig.json").writeText("{\"compilerOptions\":{\"strict\":true}}")
        val document = File(root, "main.ts").apply {
            writeText("import bcrypt from \"bcrypt\";")
        }
        val dependency = File(root, "node_modules/bcrypt").apply { mkdirs() }
        File(dependency, "package.json").writeText(
            "{\"name\":\"bcrypt\",\"scripts\":{\"install\":\"node-gyp-build\"}}",
        )
        File(dependency, "binding.gyp").writeText("{}")
        File(dependency, "prebuilds/darwin-arm64").apply { mkdirs() }
            .resolve("bcrypt.node").writeBytes(byteArrayOf(0x7f, 0x45, 0x4c, 0x46))

        val layer = requireNotNull(
            AceTypeScriptProjectTypeLayer.capture(document.path, AceTypeScriptExecutionProfiles.RHINO),
        )
        assertEquals(
            "ERR_AUTOJS6_TYPESCRIPT_NATIVE_DEPENDENCY_UNSUPPORTED",
            layer.dependencyBoundaryCode,
        )
        assertTrue(layer.dependencyBoundaryDetail.orEmpty().contains("native-binary"))
        assertTrue(layer.dependencyBoundaryDetail.orEmpty().contains("bcrypt.node"))
        assertFalse(layer.fileUris.any { uri -> uri.endsWith(".node") })

        val manager = AceLspServerManager(enabledProvider = { true })
        manager.setDocumentPath(document.path)
        assertTrue(manager.applyProjectTypeLayer(document.path, layer))
        assertEquals(layer.dependencyBoundaryCode, manager.snapshot().dependencyBoundaryCode)
        assertTrue(
            manager.bridgeOptionsJson().contains(
                "ERR_AUTOJS6_TYPESCRIPT_NATIVE_DEPENDENCY_UNSUPPORTED",
            ),
        )
    }

    @Test
    fun publishesInstallLifecycleBoundaryButKeepsOrdinaryScriptsInert() {
        val root = temporaryFolder.newFolder("lifecycle-project")
        File(root, "tsconfig.json").writeText("{}")
        val document = File(root, "main.ts").apply { writeText("export const ready = true;") }
        val dependency = File(root, "node_modules/scripted").apply { mkdirs() }
        File(dependency, "package.json").writeText(
            "{\"name\":\"scripted\",\"scripts\":{\"build\":\"ignored\",\"test\":\"ignored\"," +
                "\"preinstall\":\"first-in-json\",\"postinstall\":\"second-in-json\"," +
                "\"install\":\"last-in-json\"}}",
        )
        File(dependency, "index.d.ts").writeText("export declare const value: number;")

        val layer = requireNotNull(
            AceTypeScriptProjectTypeLayer.capture(document.path, AceTypeScriptExecutionProfiles.RHINO),
        )
        assertEquals(
            "ERR_AUTOJS6_TYPESCRIPT_DEPENDENCY_INSTALL_SCRIPT_UNSUPPORTED",
            layer.dependencyBoundaryCode,
        )
        assertTrue(layer.dependencyBoundaryDetail.orEmpty().contains("scripts.install"))

        File(dependency, "package.json").writeText(
            "{\"name\":\"scripted\",\"scripts\":{\"build\":\"ignored\",\"test\":\"ignored\"}}",
        )
        val ordinary = requireNotNull(
            AceTypeScriptProjectTypeLayer.capture(document.path, AceTypeScriptExecutionProfiles.RHINO),
        )
        assertEquals(null, ordinary.dependencyBoundaryCode)
        assertEquals(null, ordinary.dependencyBoundaryDetail)
    }

    private fun projectFixture(): Fixture {
        val root = temporaryFolder.newFolder("typed-project")
        File(root, "tsconfig.json").writeText("{\"compilerOptions\":{\"strict\":true}}")
        File(root, "package-lock.json").writeText("{\"lockfileVersion\":3}")
        val document = File(root, "src/main.ts").apply {
            requireNotNull(parentFile).mkdirs()
            writeText("import dayjs from \"dayjs\"; dayjs().format();")
        }
        val dayjsRoot = File(root, "node_modules/dayjs").apply { mkdirs() }
        File(dayjsRoot, "package.json").writeText(
            "{\"name\":\"dayjs\",\"types\":\"index.d.ts\"}",
        )
        val dayjsTypes = File(dayjsRoot, "index.d.ts").apply {
            writeText(
                "declare function dayjs(): Dayjs; export = dayjs; interface Dayjs { format(): string; }",
            )
        }
        File(dayjsRoot, "docs/ignored.md").apply {
            requireNotNull(parentFile).mkdirs()
            writeText("not part of the compiler dependency layer")
        }
        val ambientRoot = File(root, "node_modules/@types/ambient").apply { mkdirs() }
        File(ambientRoot, "package.json").writeText(
            "{\"name\":\"@types/ambient\",\"types\":\"index.d.ts\"}",
        )
        File(ambientRoot, "index.d.ts").writeText("declare const ambientAnswer: 42;")
        return Fixture(root, document, dayjsTypes)
    }

    private data class Fixture(
        val root: File,
        val document: File,
        val dayjsTypes: File,
    )
}
