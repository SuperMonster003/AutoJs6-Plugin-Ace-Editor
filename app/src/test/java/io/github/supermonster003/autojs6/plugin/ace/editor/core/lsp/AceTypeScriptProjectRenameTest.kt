package io.github.supermonster003.autojs6.plugin.ace.editor.core.lsp

import java.io.File
import java.nio.charset.StandardCharsets
import java.security.MessageDigest
import java.util.Locale
import org.autojs.plugin.editor.api.EditorPluginProjectRenameContract
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

class AceTypeScriptProjectRenameTest {

    @get:Rule
    val temporaryFolder = TemporaryFolder()

    @Test
    fun bindsThreeFileLocationsAndBuildsContractFiveRequest() {
        val fixture = fixture()
        val snapshot = snapshot(fixture)
        val layer = requireNotNull(
            AceTypeScriptProjectSourceLayer.from(fixture.main.path, snapshot),
        )
        val manager = AceLspServerManager(enabledProvider = { true })
        manager.setDocumentPath(fixture.main.path)
        manager.attach()
        assertTrue(manager.applyProjectLayers(fixture.main.path, layer, null))

        val bound = requireNotNull(
            manager.bindProjectRename(
                candidate(snapshot, fixture.main.readText()),
                fixture.main.readText(),
            ),
        )
        assertTrue(manager.isProjectRenameContextCurrent(bound))
        val prepared = requireNotNull(bound.prepare(NEW_NAME))
        val request = prepared.request

        assertTrue(EditorPluginProjectRenameContract.isSupported(request))
        assertEquals(fixture.root.path, request.projectRootPath)
        assertEquals("src/main.ts", request.documentRelativePath)
        assertEquals(3, request.files.size)
        assertEquals(5, request.files.sumOf { file -> file.edits.size })
        assertTrue(request.files.all { file ->
            file.edits.all { edit -> edit.newText == NEW_NAME }
        })
        request.files.forEach { file ->
            val source = snapshot.sourceFiles.single { source ->
                source.relativePath == file.relativePath
            }
            val result = replay(source.text, file.edits.map { edit ->
                AceTypeScriptProjectRenameCandidate.TextRange(
                    edit.startOffset,
                    edit.endOffset,
                )
            })
            assertEquals(sha256(result.toByteArray()), file.resultContentSha256)
        }

        manager.detach()
        assertFalse(manager.isProjectRenameContextCurrent(bound))
    }

    @Test
    fun preservesUtf8BomInActiveDocumentResultIdentity() {
        val fixture = fixture()
        fixture.main.writeText(UTF8_BOM_CHARACTER + fixture.main.readText())
        val snapshot = snapshot(fixture)
        val currentText = fixture.main.readText().removePrefix(UTF8_BOM_CHARACTER.toString())
        val layer = requireNotNull(
            AceTypeScriptProjectSourceLayer.from(fixture.main.path, snapshot),
        )
        val bound = requireNotNull(
            candidate(snapshot, currentText).bind(layer, currentText, sessionRevision = 7L),
        )

        val request = requireNotNull(bound.prepare(NEW_NAME)).request
        val active = request.files.single { file -> file.relativePath == "src/main.ts" }
        val renamedEditorText = replay(
            currentText,
            active.edits.map { edit ->
                AceTypeScriptProjectRenameCandidate.TextRange(
                    edit.startOffset,
                    edit.endOffset,
                )
            },
        )
        assertEquals(
            sha256((UTF8_BOM_CHARACTER + renamedEditorText).toByteArray()),
            active.resultContentSha256,
        )
    }

    @Test
    fun rejectsUnsavedContextInvalidNamesAndEscapedTargets() {
        val fixture = fixture()
        val snapshot = snapshot(fixture)
        val currentText = fixture.main.readText()
        val layer = requireNotNull(
            AceTypeScriptProjectSourceLayer.from(fixture.main.path, snapshot),
        )
        val candidate = candidate(snapshot, currentText)

        assertNull(candidate.bind(layer, "$currentText// draft\n", sessionRevision = 1L))
        val bound = requireNotNull(candidate.bind(layer, currentText, sessionRevision = 1L))
        assertNull(bound.prepare(OLD_NAME))
        assertNull(bound.prepare("not-valid"))

        val escaped = candidate.copy(
            files = candidate.files.mapIndexed { index, file ->
                if (index == 0) file.copy(uri = "file:///autojs6/editor/node_modules/pkg/index.d.ts")
                else file
            },
        )
        assertNull(escaped.bind(layer, currentText, sessionRevision = 1L))
    }

    private fun candidate(
        snapshot: EditorPluginProjectSnapshot,
        currentDocumentText: String,
    ): AceTypeScriptProjectRenameCandidate = AceTypeScriptProjectRenameCandidate(
        symbolName = OLD_NAME,
        files = snapshot.sourceFiles.map { source ->
            val uri = "${AceLspServerManager.SYNTHETIC_ROOT_URI}/${source.relativePath}"
            val text = if (source.relativePath == snapshot.documentRelativePath) {
                currentDocumentText
            } else {
                source.text
            }
            AceTypeScriptProjectRenameCandidate.FileLocations(
                uri = uri,
                edits = symbolRanges(text),
            )
        }.filter { file -> file.edits.isNotEmpty() }
            .sortedBy(AceTypeScriptProjectRenameCandidate.FileLocations::uri),
    )

    private fun symbolRanges(text: String): List<AceTypeScriptProjectRenameCandidate.TextRange> {
        val ranges = ArrayList<AceTypeScriptProjectRenameCandidate.TextRange>()
        var fromIndex = 0
        while (true) {
            val index = text.indexOf(OLD_NAME, fromIndex)
            if (index < 0) return ranges
            ranges += AceTypeScriptProjectRenameCandidate.TextRange(
                index,
                index + OLD_NAME.length,
            )
            fromIndex = index + OLD_NAME.length
        }
    }

    private fun replay(
        text: String,
        edits: List<AceTypeScriptProjectRenameCandidate.TextRange>,
    ): String = StringBuilder(text).apply {
        edits.asReversed().forEach { edit ->
            replace(edit.startOffset, edit.endOffset, NEW_NAME)
        }
    }.toString()

    private fun fixture(): Fixture {
        val root = temporaryFolder.newFolder("project-rename").canonicalFile
        File(root, "tsconfig.json").writeText("{}")
        val sourceRoot = File(root, "src").apply { mkdirs() }
        val main = File(sourceRoot, "main.ts").apply {
            writeText(
                "import { answer } from './shared';\n" +
                    "console.log(answer('main'));\n",
            )
        }.canonicalFile
        val shared = File(sourceRoot, "shared.ts").apply {
            writeText(
                "export function answer(value: string): number { return value.length; }\n",
            )
        }.canonicalFile
        val consumer = File(sourceRoot, "consumer.ts").apply {
            writeText(
                "import { answer } from './shared';\n" +
                    "export const consumed = answer('consumer');\n",
            )
        }.canonicalFile
        return Fixture(root, main, shared, consumer)
    }

    private fun snapshot(fixture: Fixture): EditorPluginProjectSnapshot {
        val sources = listOf(fixture.main, fixture.shared, fixture.consumer).map { file ->
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
            documentPath = fixture.main.path,
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
        sources.forEach { source ->
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
        val main: File,
        val shared: File,
        val consumer: File,
    )

    private companion object {
        const val INVENTORY_DOMAIN = "autojs6.editor.project-source.inventory.v1"
        const val OLD_NAME = "answer"
        const val NEW_NAME = "projectAnswer"
        const val UTF8_BOM_CHARACTER = '\uFEFF'
    }
}
