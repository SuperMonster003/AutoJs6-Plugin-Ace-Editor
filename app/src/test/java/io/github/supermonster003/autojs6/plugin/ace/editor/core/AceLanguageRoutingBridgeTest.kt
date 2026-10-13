package io.github.supermonster003.autojs6.plugin.ace.editor.core

import java.io.File
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * The routing itself (modes, workers, static indexes, the long line safety mode) is executed by
 * tools/ace-lsp/verify-ace-bridge.mjs (Roadmap-Ace-1.44.0.md A6-3); this test keeps the Kotlin call order.
 */
class AceLanguageRoutingBridgeTest {

    @Test
    fun `android document path channel updates mode before refreshing lsp`() {
        val kotlinSource = readMainSource("AceCodeEditor.kt")
        val setPathStart = kotlinSource.indexOf("fun setDocumentPath(path: String?)")
        val managerIndex = kotlinSource.indexOf("lspServerManager.setDocumentPath(path)", setPathStart)
        val modeIndex = kotlinSource.indexOf(
            "invokeAce(\"setDocumentPath\", quote(documentPathKey))",
            managerIndex,
        )
        val refreshIndex = kotlinSource.indexOf("refreshLsp(\"document-path\")", modeIndex)

        assertTrue(setPathStart >= 0)
        assertTrue(managerIndex > setPathStart)
        assertTrue(modeIndex > managerIndex)
        assertTrue(refreshIndex > modeIndex)
    }

    private fun readMainSource(fileName: String): String {
        val workingDirectory = File(checkNotNull(System.getProperty("user.dir")))
        val relativePath = "io/github/supermonster003/autojs6/plugin/ace/editor/core/$fileName"
        val candidates = listOf(
            File(workingDirectory, "app/src/main/java/$relativePath"),
            File(workingDirectory, "src/main/java/$relativePath"),
        )
        return checkNotNull(candidates.firstOrNull(File::isFile)) {
            "Unable to locate ACE source: $fileName"
        }.readText()
    }
}
