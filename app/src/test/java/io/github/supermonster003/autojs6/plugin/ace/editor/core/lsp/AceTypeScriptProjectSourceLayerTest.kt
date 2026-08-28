package io.github.supermonster003.autojs6.plugin.ace.editor.core.lsp

import java.io.File
import java.nio.charset.StandardCharsets
import java.security.MessageDigest
import java.util.Locale
import org.autojs.plugin.editor.api.EditorPluginProjectSnapshot
import org.autojs.plugin.editor.api.EditorPluginProjectSnapshotContract
import org.autojs.plugin.editor.api.EditorPluginProjectSource
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder

class AceTypeScriptProjectSourceLayerTest {

    @get:Rule
    val temporaryFolder = TemporaryFolder()

    @Test
    fun validatesAndPublishesImmutableProjectSourceAuthority() {
        val fixture = projectFixture()
        val contractSnapshot = snapshot(fixture)
        val layer = requireNotNull(
            AceTypeScriptProjectSourceLayer.from(fixture.document.canonicalPath, contractSnapshot),
        )

        assertEquals("file:///autojs6/editor/src/main.ts", layer.documentUri)
        assertEquals("rhino", layer.targetProfile)
        assertEquals(2, layer.sourceFileCount)
        assertEquals(contractSnapshot.sourceByteLength, layer.sourceByteLength)
        assertEquals(
            "export const sharedAnswer = 42 as const;",
            layer.read("file:///autojs6/editor/src/shared.ts"),
        )

        val manager = AceLspServerManager(enabledProvider = { true })
        manager.setDocumentPath(fixture.document.canonicalPath)
        assertTrue(manager.applyProjectLayers(fixture.document.canonicalPath, layer, null))

        val published = manager.snapshot()
        assertTrue(published.projectSnapshotReady)
        assertEquals(1, published.projectSnapshotSchemaRevision)
        assertEquals(2, published.projectSourceFileCount)
        assertEquals(layer.fileUris, published.projectSourceFileUris)
        assertEquals(layer.sourceInventoryFingerprint, published.projectSourceInventoryFingerprint)
        assertEquals(
            "export const sharedAnswer = 42 as const;",
            manager.readProjectFile("file:///autojs6/editor/src/shared.ts"),
        )
        assertTrue(manager.bridgeOptionsJson().contains("\"projectSnapshotReady\":true"))
        assertTrue(
            manager.bridgeOptionsJson().contains(
                "\"projectSourceInventoryFingerprint\":\"${layer.sourceInventoryFingerprint}\"",
            ),
        )

        manager.setDocumentPath(File(fixture.root, "src/other.ts").canonicalPath)
        assertFalse(manager.snapshot().projectSnapshotReady)
        assertNull(manager.readProjectFile("file:///autojs6/editor/src/shared.ts"))
    }

    @Test
    fun rejectsTamperedOrMisdirectedSnapshotsBeforePublication() {
        val fixture = projectFixture()
        val valid = snapshot(fixture)
        val first = valid.sourceFiles.first()

        assertNull(
            AceTypeScriptProjectSourceLayer.from(
                fixture.document.canonicalPath,
                valid.copy(
                    sourceFiles = listOf(first.copy(text = first.text + " ")) +
                        valid.sourceFiles.drop(1),
                ),
            ),
        )
        assertNull(
            AceTypeScriptProjectSourceLayer.from(
                fixture.document.canonicalPath,
                valid.copy(sourceInventoryFingerprint = "0".repeat(64)),
            ),
        )
        assertNull(
            AceTypeScriptProjectSourceLayer.from(
                File(fixture.root, "src/other.ts").canonicalPath,
                valid,
            ),
        )

        val nodeLayer = requireNotNull(
            AceTypeScriptProjectSourceLayer.from(
                fixture.document.canonicalPath,
                valid.copy(targetProfile = EditorPluginProjectSnapshotContract.TARGET_PROFILE_NODE),
            ),
        )
        val manager = AceLspServerManager(enabledProvider = { true })
        manager.setDocumentPath(fixture.document.canonicalPath)
        assertTrue(manager.applyProjectLayers(fixture.document.canonicalPath, nodeLayer, null))
        assertFalse(manager.snapshot().projectSnapshotReady)
    }

    private fun projectFixture(): Fixture {
        val root = temporaryFolder.newFolder("source-project")
        File(root, "tsconfig.json").writeText("{}")
        val document = File(root, "src/main.ts").apply {
            requireNotNull(parentFile).mkdirs()
            writeText("import { sharedAnswer } from './shared'; void sharedAnswer;")
        }
        val shared = File(root, "src/shared.ts").apply {
            writeText("export const sharedAnswer = 42 as const;")
        }
        return Fixture(root.canonicalFile, document.canonicalFile, shared.canonicalFile)
    }

    private fun snapshot(fixture: Fixture): EditorPluginProjectSnapshot {
        val sources = listOf(fixture.document, fixture.shared).map { file ->
            val relativePath = fixture.root.toPath().relativize(file.toPath())
                .toString()
                .replace(File.separatorChar, '/')
            val text = file.readText()
            val bytes = text.toByteArray(StandardCharsets.UTF_8)
            EditorPluginProjectSource(
                relativePath = relativePath,
                text = text,
                utf8ByteLength = bytes.size.toLong(),
                sha256 = sha256(bytes),
            )
        }.sortedBy(EditorPluginProjectSource::relativePath)
        return EditorPluginProjectSnapshot(
            schemaRevision = EditorPluginProjectSnapshotContract.SCHEMA_REVISION,
            projectRootPath = fixture.root.path,
            documentPath = fixture.document.path,
            documentRelativePath = "src/main.ts",
            targetProfile = EditorPluginProjectSnapshotContract.TARGET_PROFILE_RHINO,
            sourceFiles = sources,
            sourceInventoryFingerprint = inventoryFingerprint(sources),
            sourceFileCount = sources.size,
            sourceByteLength = sources.sumOf(EditorPluginProjectSource::utf8ByteLength),
        )
    }

    private fun inventoryFingerprint(sources: List<EditorPluginProjectSource>): String {
        val digest = MessageDigest.getInstance("SHA-256")
        digest.update(INVENTORY_DOMAIN.toByteArray(StandardCharsets.US_ASCII))
        digest.update('\n'.code.toByte())
        sources.sortedBy(EditorPluginProjectSource::relativePath).forEach { source ->
            digest.update(source.relativePath.toByteArray(StandardCharsets.UTF_8))
            digest.update(0)
            digest.update(source.utf8ByteLength.toString().toByteArray(StandardCharsets.US_ASCII))
            digest.update(0)
            digest.update(source.sha256.toByteArray(StandardCharsets.US_ASCII))
            digest.update('\n'.code.toByte())
        }
        return digest.digest().toLowerHex()
    }

    private fun sha256(bytes: ByteArray): String =
        MessageDigest.getInstance("SHA-256").digest(bytes).toLowerHex()

    private fun ByteArray.toLowerHex(): String = joinToString(separator = "") { byte ->
        "%02x".format(Locale.ROOT, byte.toInt() and 0xff)
    }

    private data class Fixture(
        val root: File,
        val document: File,
        val shared: File,
    )

    private companion object {
        const val INVENTORY_DOMAIN = "autojs6.editor.project-source.inventory.v1"
    }
}
