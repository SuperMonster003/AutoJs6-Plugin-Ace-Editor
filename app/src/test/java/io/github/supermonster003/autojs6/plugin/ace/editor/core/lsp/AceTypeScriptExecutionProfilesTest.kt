package io.github.supermonster003.autojs6.plugin.ace.editor.core.lsp

import java.io.File
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder

class AceTypeScriptExecutionProfilesTest {

    @get:Rule
    val temporaryFolder = TemporaryFolder()

    @Test
    fun standaloneExtensionsMatchHostExecutionRouting() {
        listOf("main.ts", "main.tsx", "types.d.ts").forEach { path ->
            assertEquals(AceTypeScriptExecutionProfiles.RHINO, AceTypeScriptExecutionProfiles.resolve(path))
        }
        listOf("main.mts", "main.cts", "types.d.mts", "types.d.cts").forEach { path ->
            assertEquals(AceTypeScriptExecutionProfiles.NODE, AceTypeScriptExecutionProfiles.resolve(path))
        }
        listOf("main.js", "main.node.js", "project.json", null).forEach { path ->
            assertNull(AceTypeScriptExecutionProfiles.resolve(path))
        }
    }

    @Test
    fun nearestNodeProjectRoutesOrdinaryTypeScriptToNode() {
        val root = temporaryFolder.newFolder("node-project")
        File(root, "project.json").writeText("""{"projectType":"NODE"}""")
        val source = File(root, "src/deep/main.ts").apply {
            requireNotNull(parentFile).mkdirs()
            writeText("export const value = 1")
        }

        assertEquals(AceTypeScriptExecutionProfiles.NODE, AceTypeScriptExecutionProfiles.resolve(source.path))
        assertEquals(AceTypeScriptExecutionProfiles.NODE, AceTypeScriptExecutionProfiles.resolve(source.toURI().toString()))
    }

    @Test
    fun nearestNonNodeProjectBoundaryWinsOverOuterNodeProject() {
        val root = temporaryFolder.newFolder("outer-node-project")
        File(root, "project.json").writeText("""{"type":"node"}""")
        val nested = File(root, "nested").apply { mkdirs() }
        File(nested, "project.json").writeText("""{"type":"rhino"}""")
        val source = File(nested, "main.ts").apply { writeText("const value = 1") }

        assertEquals(AceTypeScriptExecutionProfiles.RHINO, AceTypeScriptExecutionProfiles.resolve(source.path))
    }

    @Test
    fun unsupportedProjectMetadataFallsBackClosedToRhino() {
        val root = temporaryFolder.newFolder("invalid-project")
        File(root, "project.json").writeText("""{"type":"python"}""")
        val source = File(root, "main.ts").apply { writeText("const value = 1") }

        assertEquals(AceTypeScriptExecutionProfiles.RHINO, AceTypeScriptExecutionProfiles.resolve(source.path))
    }
}
