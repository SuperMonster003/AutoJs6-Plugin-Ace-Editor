package io.github.supermonster003.autojs6.plugin.ace.editor.core

import java.io.File
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class AceInitialPresentationTest {

    private val editorRoot by lazy {
        val workingDirectory = File(checkNotNull(System.getProperty("user.dir")))
        listOf(
            File(workingDirectory, "app/src/main/assets/editor/ace-builds-1.4.12"),
            File(workingDirectory, "src/main/assets/editor/ace-builds-1.4.12"),
        ).first(File::isDirectory)
    }

    private val editorHtml by lazy { File(editorRoot, "autojs6_editor.html").readText() }
    private val bridgeSource by lazy { File(editorRoot, "autojs6/autojs6_ace_bridge.js").readText() }
    private val completerSource by lazy { File(editorRoot, "autojs6/autojs6_completer.js").readText() }
    private val styleSheet by lazy { File(editorRoot, "autojs6/autojs6.css").readText() }

    @Test
    fun `rich AutoJs6 index is removed from the synchronous bridge path`() {
        val richIndexPath = "autojs6/autojs6_indices.js"
        val synchronousScripts = Regex("""<script\s+src="([^"]+)"""")
            .findAll(editorHtml)
            .map { match -> match.groupValues[1].removePrefix("./") }
            .toList()
        val synchronousBytes = synchronousScripts.sumOf { path -> File(editorRoot, path).length() }
        val richIndexBytes = File(editorRoot, richIndexPath).length()
        val previousSynchronousBytes = synchronousBytes + richIndexBytes

        assertFalse(synchronousScripts.contains(richIndexPath))
        assertTrue(richIndexBytes > 1_000_000L)
        assertTrue(richIndexBytes.toDouble() / previousSynchronousBytes > 0.50)
        assertTrue(bridgeSource.contains("script.src = \"./$richIndexPath\""))
    }

    @Test
    fun `deferred index work starts only after the visible editor has had two frames`() {
        val notifyStart = bridgeSource.indexOf("function notifyFirstPaint()")
        val readyClass = bridgeSource.indexOf("document.body.classList.add(\"ace-ready\")", notifyStart)
        val firstPaintEvent = bridgeSource.indexOf("[\"firstPaint\", lightweightStateJson()]", readyClass)
        val postPaintWork = bridgeSource.indexOf("schedulePostFirstPaintWork()", firstPaintEvent)
        val schedulerStart = bridgeSource.indexOf("function schedulePostFirstPaintWork()")
        val twoFrames = bridgeSource.indexOf("afterTwoFrames(function()", schedulerStart)
        val deferredLoad = bridgeSource.indexOf("loadDeferredStaticIndexAfterFirstPaint()", twoFrames)

        assertTrue(notifyStart >= 0)
        assertTrue(readyClass > notifyStart)
        assertTrue(firstPaintEvent > readyClass)
        assertTrue(postPaintWork > firstPaintEvent)
        assertTrue(twoFrames > schedulerStart)
        assertTrue(deferredLoad > twoFrames)
        assertTrue(bridgeSource.contains("global.requestIdleCallback(loadDeferredStaticIndex"))
        assertTrue(bridgeSource.contains("publishDeferredStaticIndexEvent(\"deferredStaticIndexReady\")"))
    }

    @Test
    fun `document loading blocks overlay release and rich index replaces both JavaScript sources`() {
        val editorSource = readMainSource(
            "io/github/supermonster003/autojs6/plugin/ace/editor/core/AceCodeEditor.kt",
        )
        val sessionSource = readMainSource(
            "io/github/supermonster003/autojs6/plugin/ace/editor/AceEditorPluginSession.kt",
        )

        assertTrue(editorSource.contains("private var hostDocumentLoading = false"))
        assertTrue(editorSource.contains("if (!isReady || firstPaintReceived || hostDocumentLoading)"))
        assertTrue(editorSource.contains("invokeAce(\"setFirstPaintBlocked\""))
        assertTrue(sessionSource.contains("editor.setHostDocumentLoading(loading)"))
        assertTrue(bridgeSource.contains("if (firstPaintNotified || firstPaintBlocked)"))
        assertTrue(bridgeSource.contains("setFirstPaintBlocked: setFirstPaintBlocked"))
        assertTrue(styleSheet.contains("html.autojs6-theme-applied"))
        assertTrue(styleSheet.contains("background: transparent"))
        assertTrue(bridgeSource.contains("classList.add(\"autojs6-theme-applied\")"))
        assertTrue(completerSource.contains("this.sources.javascript = source"))
        assertTrue(completerSource.contains("this.sources.typescript = source"))
        assertTrue(completerSource.contains("replaceJavaScriptIndex: replaceJavaScriptIndex"))
    }

    private fun readMainSource(relativePath: String): String {
        val workingDirectory = File(checkNotNull(System.getProperty("user.dir")))
        val candidates = listOf(
            File(workingDirectory, "app/src/main/java/$relativePath"),
            File(workingDirectory, "src/main/java/$relativePath"),
        )
        return checkNotNull(candidates.firstOrNull(File::isFile)) {
            "Unable to locate main source: $relativePath"
        }.readText()
    }
}
