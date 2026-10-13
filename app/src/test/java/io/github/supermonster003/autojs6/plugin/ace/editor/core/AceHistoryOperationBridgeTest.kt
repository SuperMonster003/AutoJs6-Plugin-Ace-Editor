package io.github.supermonster003.autojs6.plugin.ace.editor.core

import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.File

/**
 * Source checks that tools/ace-lsp/verify-ace-bridge.mjs (Roadmap-Ace-1.44.0.md A6-3) does not execute: the Kotlin
 * acknowledgement timeout and the long line safety mode, which A6-4 replaces. The history operations themselves are
 * executed there.
 */
class AceHistoryOperationBridgeTest {

    private val bridgeSource by lazy {
        readAsset("autojs6_ace_bridge.js")
    }

    @Test
    fun `native bridge acknowledgements cannot leave an operation waiting forever`() {
        val kotlinSource = readMainSource("AceCodeEditor.kt")

        assertTrue(kotlinSource.contains("BOOLEAN_ACK_TIMEOUT_MS = 10_000L"))
        assertTrue(kotlinSource.contains("ace_boolean_ack_timeout"))
        assertTrue(kotlinSource.contains("onComplete?.invoke(false)"))
        assertTrue(kotlinSource.contains("canUndo = true"))
        assertTrue(kotlinSource.contains("canRedo = false"))
    }

    @Test
    fun `unsafe whole document history keeps lightweight mode across navigation`() {
        assertTrue(bridgeSource.contains("group.autojs6HistoryToken &&"))
        assertTrue(
            bridgeSource.contains(
                "group.autojs6LongLineSafetyBefore || group.autojs6LongLineSafetyAfter",
            ),
        )
    }

    @Test
    fun `pathological long lines use lightweight safe mode`() {
        assertTrue(bridgeSource.contains("function applyDocumentLongLineSafetyMode(enabled)"))
        assertTrue(bridgeSource.contains("applyDocumentAceMode()"))
        assertTrue(
            bridgeSource.contains(
                "var targetMode = documentLongLineSafetyMode ? \"ace/mode/text\" : documentAceMode",
            ),
        )
        assertTrue(bridgeSource.contains("session.\$autojs6LongLineSafetyMode = enabled"))
        assertTrue(bridgeSource.contains("function applyDocumentAccessibilityLightweightMode(enabled)"))
        assertTrue(bridgeSource.contains("textLayerElement.setAttribute(\"aria-hidden\", \"true\")"))
        assertTrue(bridgeSource.contains("textLayerElement.removeAttribute(\"aria-hidden\")"))
        assertTrue(bridgeSource.contains("notifyTextChanged(echoText !== false)"))
        assertTrue(bridgeSource.contains("callBridge(\"notifyCursorChanged\", [\n            \"\","))
        assertTrue(bridgeSource.contains("getSelectionState(includeText !== false)"))
        assertTrue(bridgeSource.contains("text: includeText === false ? \"\" : session.getTextRange(range)"))
        assertTrue(bridgeSource.contains("autojs6LongLineSafetyBefore"))
        assertTrue(bridgeSource.contains("autojs6LongLineSafetyAfter"))

        val lspSource = readAsset("autojs6_lsp_client.js")
        assertTrue(lspSource.contains("target.\$autojs6LongLineSafetyMode"))
        assertTrue(lspSource.contains("\"line-too-long\""))
    }

    @Test
    fun `lightweight mode bounds pathological first token rendering`() {
        assertTrue(bridgeSource.contains("LONG_LINE_SAFETY_RENDER_TRIGGER = 16 * 1024"))
        assertTrue(bridgeSource.contains("LONG_LINE_SAFETY_RENDER_LIMIT = 4096"))
        assertTrue(bridgeSource.contains("function installDocumentLongLineRenderGuard()"))
        assertTrue(bridgeSource.contains("textLayer.\$renderSimpleLine = function(parent, tokens)"))
        assertTrue(bridgeSource.contains("observedLength > LONG_LINE_SAFETY_RENDER_TRIGGER"))
        assertTrue(bridgeSource.contains("value.slice(0, remaining)"))
        assertTrue(bridgeSource.contains("autojs6_long_line_truncated"))
    }

    private fun readAsset(relativePath: String): String {
        val workingDirectory = File(checkNotNull(System.getProperty("user.dir")))
        val candidates = listOf(
            File(workingDirectory, "app/src/main/assets/editor/ace-builds-1.44.0/autojs6/$relativePath"),
            File(workingDirectory, "src/main/assets/editor/ace-builds-1.44.0/autojs6/$relativePath"),
        )
        // Assertions below match multi-line snippets with "\n"; a CRLF checkout must not break them.
        return checkNotNull(candidates.firstOrNull(File::isFile)) {
            "Unable to locate ACE asset: $relativePath"
        }.readText().replace("\r\n", "\n")
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
