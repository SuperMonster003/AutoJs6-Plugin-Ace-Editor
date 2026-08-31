package io.github.supermonster003.autojs6.plugin.ace.editor.core

import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.File

class AceHistoryOperationBridgeTest {

    private val bridgeSource by lazy {
        readAsset("autojs6_ace_bridge.js")
    }

    @Test
    fun `history operations are exposed through the bridge`() {
        assertTrue(bridgeSource.contains("replaceAllTextUndoably: replaceAllTextUndoably"))
        assertTrue(bridgeSource.contains("addUndoableHistoryMarker: addUndoableHistoryMarker"))
        assertTrue(bridgeSource.contains("markDirty: markDirty"))
        assertTrue(bridgeSource.contains("refreshState: refreshState"))
        assertTrue(bridgeSource.contains("dispatchStateChanged(\"hostRefresh\")"))
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
    fun `metadata marker advances ace history without changing text`() {
        assertTrue(bridgeSource.contains("function addUndoableHistoryMarker(token, beforeUnsafeLine, afterUnsafeLine)"))
        assertTrue(bridgeSource.contains("undoManager.add({"))
        assertTrue(bridgeSource.contains("lines: [\"\"]"))
        assertTrue(bridgeSource.contains("autojs6HistoryToken"))

        val aceSource = readAsset("../src-min-noconflict/ace.js")
        assertTrue(aceSource.contains("e.lines.length<=1&&!e.lines[0]"))
        assertTrue(aceSource.contains("!o.comparePoints(e.start,e.end)"))
    }

    @Test
    fun `undo and redo report tagged history operations`() {
        assertTrue(bridgeSource.contains("session.undoChanges = function(group, dontSelect)"))
        assertTrue(bridgeSource.contains("session.redoChanges = function(group, dontSelect)"))
        assertTrue(bridgeSource.contains("scheduleHistoryState(group, \"undo\", targetUnsafeLine)"))
        assertTrue(bridgeSource.contains("scheduleHistoryState(group, \"redo\", targetUnsafeLine)"))
        assertTrue(bridgeSource.contains("\"historyOperation\""))
        assertTrue(bridgeSource.contains("canUndo: !!(undoManager && undoManager.hasUndo"))
        assertTrue(bridgeSource.contains("canRedo: !!(undoManager && undoManager.hasRedo"))
    }

    @Test
    fun `history completion follows pending text and state notifications`() {
        val flushTextIndex = bridgeSource.indexOf(
            "flushTextChanged();",
            startIndex = bridgeSource.indexOf("function scheduleHistoryState"),
        )
        val flushStateIndex = bridgeSource.indexOf("flushStateChanged();", startIndex = flushTextIndex)
        val historyEventIndex = bridgeSource.indexOf("\"historyOperation\"", startIndex = flushStateIndex)

        assertTrue(flushTextIndex >= 0)
        assertTrue(flushStateIndex > flushTextIndex)
        assertTrue(historyEventIndex > flushStateIndex)
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
    fun `whole document history restores the original line separator`() {
        assertTrue(bridgeSource.contains("function captureDocumentNewLineState()"))
        assertTrue(bridgeSource.contains("group.autojs6NewLineBefore ="))
        assertTrue(bridgeSource.contains("group.autojs6NewLineAfter ="))
        assertTrue(bridgeSource.contains("applyDocumentNewLineState(group && group.autojs6NewLineBefore)"))
        assertTrue(bridgeSource.contains("applyDocumentNewLineState(group && group.autojs6NewLineAfter)"))
    }

    @Test
    fun `dirty state follows the ace clean bookmark`() {
        assertTrue(bridgeSource.contains("undoManager.markClean()"))
        assertTrue(bridgeSource.contains("undoManager.isClean && undoManager.isClean()"))
        assertTrue(bridgeSource.contains("dirty = !undoManager.isClean()"))
    }

    @Test
    fun `whole document replacement publishes only its final cursor position`() {
        val setTextStart = bridgeSource.indexOf("function setText(text, echoText, unsafeLine)")
        val setTextDirtyStart =
            bridgeSource.indexOf("function setTextDirty(text, echoText, unsafeLine)", setTextStart)
        val nextFunctionStart = bridgeSource.indexOf("function cloneHistoryPosition", setTextDirtyStart)
        val setTextSource = bridgeSource.substring(setTextStart, setTextDirtyStart)
        val setTextDirtySource = bridgeSource.substring(setTextDirtyStart, nextFunctionStart)

        assertTrue(bridgeSource.contains("var cursorNotifySuppressionDepth = 0"))
        assertTrue(bridgeSource.contains("function beginCursorNotificationSuppression()"))
        assertTrue(bridgeSource.contains("function endCursorNotificationSuppression()"))
        assertTrue(bridgeSource.contains("if (cursorNotifySuppressionDepth > 0)"))

        assertTrue(setTextSource.indexOf("beginCursorNotificationSuppression()") >= 0)
        assertTrue(
            setTextSource.indexOf("session.setValue(text || \"\")") >
                setTextSource.indexOf("beginCursorNotificationSuppression()"),
        )
        assertTrue(
            setTextSource.indexOf("endCursorNotificationSuppression()") >
                setTextSource.indexOf("editor.moveCursorTo(0, 0)"),
        )
        assertTrue(
            setTextSource.indexOf("notifyCursorChanged()") >
                setTextSource.indexOf("endCursorNotificationSuppression()"),
        )

        assertTrue(setTextDirtySource.indexOf("beginCursorNotificationSuppression()") >= 0)
        assertTrue(
            setTextDirtySource.indexOf("endCursorNotificationSuppression()") >
                setTextDirtySource.indexOf("session.setValue(text || \"\")"),
        )
        assertTrue(
            setTextDirtySource.indexOf("notifyCursorChanged()") >
                setTextDirtySource.indexOf("endCursorNotificationSuppression()"),
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
            File(workingDirectory, "app/src/main/assets/editor/ace-builds-1.4.12/autojs6/$relativePath"),
            File(workingDirectory, "src/main/assets/editor/ace-builds-1.4.12/autojs6/$relativePath"),
        )
        return checkNotNull(candidates.firstOrNull(File::isFile)) {
            "Unable to locate ACE asset: $relativePath"
        }.readText()
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
