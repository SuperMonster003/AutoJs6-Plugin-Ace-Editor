package io.github.supermonster003.autojs6.plugin.ace.editor.core

import java.io.File
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class AceLanguageRoutingBridgeTest {

    private val bridgeSource by lazy { readAsset("autojs6_ace_bridge.js") }

    @Test
    fun `bridge has one deny by default document mode router`() {
        val routerStart = bridgeSource.indexOf("function resolveAceMode(fileName)")
        assertTrue(routerStart >= 0)
        val routerEnd = bridgeSource.indexOf("function aceModeId", routerStart)
        assertTrue(routerEnd > routerStart)
        val router = bridgeSource.substring(routerStart, routerEnd)

        assertTrue(router.contains("return \"ace/mode/json\""))
        assertTrue(router.contains("return \"ace/mode/python\""))
        assertTrue(router.contains("return \"ace/mode/lua\""))
        assertTrue(router.contains("return \"ace/mode/java\""))
        assertTrue(router.contains("return \"ace/mode/kotlin\""))
        assertTrue(router.contains("return \"ace/mode/typescript\""))
        assertTrue(router.contains("return \"ace/mode/jsx\""))
        assertTrue(router.contains("return \"ace/mode/javascript\""))
        assertTrue(
            router.substringAfterLast("return ").trimStart().startsWith("\"ace/mode/text\";"),
        )
        assertTrue(bridgeSource.contains("resolveAceMode: resolveAceMode"))
        assertFalse(bridgeSource.contains("session.setMode(\"ace/mode/javascript\")"))
    }

    @Test
    fun `long line mode restores the routed document mode`() {
        assertTrue(
            bridgeSource.contains(
                "var targetMode = documentLongLineSafetyMode ? \"ace/mode/text\" : documentAceMode",
            ),
        )
        assertTrue(bridgeSource.contains("documentAceMode = resolveAceMode(documentPath)"))
        assertTrue(bridgeSource.contains("setDocumentPath: setDocumentPath"))
    }

    @Test
    fun `only lua enables an ace worker`() {
        assertTrue(
            bridgeSource.contains(
                "return modeId === \"ace/mode/lua\";",
            ),
        )
        assertTrue(
            bridgeSource.contains(
                "var enabled = !documentLongLineSafetyMode && shouldUseAceWorkerForMode(modeId)",
            ),
        )
        assertTrue(bridgeSource.contains("applyDocumentWorkerPolicy(targetMode)"))
    }

    @Test
    fun `static index routing covers only javascript and m2 languages`() {
        assertTrue(bridgeSource.contains("function languageIdForMode(modeId)"))
        assertTrue(bridgeSource.contains("languageIdForSession: languageIdForSession"))
        assertTrue(bridgeSource.contains("supportsStaticIndexMode: supportsStaticIndexMode"))
        assertTrue(bridgeSource.contains("supportsStaticIndexSession: supportsStaticIndexSession"))
        assertTrue(
            bridgeSource.contains(
                "language === \"python\" || language === \"lua\"",
            ),
        )
        assertTrue(
            bridgeSource.contains(
                "language === \"java\" || language === \"kotlin\"",
            ),
        )
    }

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
