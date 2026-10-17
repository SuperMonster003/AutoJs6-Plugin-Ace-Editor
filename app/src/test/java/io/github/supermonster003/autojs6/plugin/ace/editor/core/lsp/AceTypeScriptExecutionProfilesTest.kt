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
        listOf("main.mts", "main.cts", "types.d.mts", "types.d.cts", "main.node.js", "main.cjs", "main.mjs").forEach { path ->
            assertEquals(AceTypeScriptExecutionProfiles.NODE, AceTypeScriptExecutionProfiles.resolve(path))
        }
        listOf("main.bun.js", "main.bun.ts", "main.bun.tsx").forEach { path ->
            assertEquals(AceTypeScriptExecutionProfiles.BUN, AceTypeScriptExecutionProfiles.resolve(path))
        }
        listOf("main.js", "project.json", null).forEach { path ->
            assertNull(AceTypeScriptExecutionProfiles.resolve(path))
        }
    }

    @Test
    fun bunProjectMetadataDoesNotInventAHostEngineRoute() {
        val root = temporaryFolder.newFolder("bun-project")
        File(root, "project.json").writeText("""{"type":"bun"}""")
        val javascript = File(root, "main.js").apply { writeText("export const value = 1") }
        val typescript = File(root, "main.ts").apply { writeText("export const value = 1") }
        assertNull(AceTypeScriptExecutionProfiles.resolve(javascript.path))
        assertEquals(AceTypeScriptExecutionProfiles.RHINO, AceTypeScriptExecutionProfiles.resolve(typescript.path))
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
