package io.github.supermonster003.autojs6.plugin.ace.editor.core

import java.io.File
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class AceEditorThemeBridgeTest {

    private val javaScript by lazy {
        readAsset("autojs6_ace_bridge.js")
    }
    private val styleSheet by lazy {
        readAsset("autojs6.css")
    }

    @Test
    fun `plugin theme metadata reaches the JavaScript theme entry point`() {
        val sessionSource = readMainSource(
            "io/github/supermonster003/autojs6/plugin/ace/editor/AceEditorPluginSession.kt",
        )
        val editorSource = readMainSource(
            "io/github/supermonster003/autojs6/plugin/ace/editor/core/AceCodeEditor.kt",
        )
        val nativeBridgeSource = readMainSource(
            "io/github/supermonster003/autojs6/plugin/ace/editor/core/AceBridge.kt",
        )

        assertTrue(sessionSource.contains("isDark = theme.isDark"))
        assertTrue(sessionSource.contains("backgroundColor = theme.backgroundColor"))
        assertTrue(sessionSource.contains("foregroundColor = theme.foregroundColor"))
        assertTrue(editorSource.contains("editorThemeBackgroundColor = backgroundColor"))
        assertTrue(editorSource.contains("editorThemeForegroundColor = resolvedForegroundColor"))
        assertTrue(nativeBridgeSource.contains("fun isThemeDark(): Boolean"))
        assertTrue(nativeBridgeSource.contains("fun getThemeBackgroundColor(): Int"))
        assertTrue(nativeBridgeSource.contains("fun getThemeForegroundColor(): Int"))

        assertTrue(
            javaScript.contains(
                "function setTheme(theme, isDark, backgroundColor, foregroundColor)",
            ),
        )
        assertTrue(javaScript.contains("applyThemePalette(backgroundColor, foregroundColor, dark)"))
        assertTrue(javaScript.contains("callBridge(\"getThemeBackgroundColor\")"))
        assertTrue(javaScript.contains("callBridge(\"getThemeForegroundColor\")"))
    }

    @Test
    fun `signature tooltip uses editor palette without restyling autocomplete`() {
        val signatureRule = cssRule(".autojs6_signature_tooltip")
        val autocompleteRule = cssRule(".ace_editor.ace_autocomplete")

        assertTrue(signatureRule.contains("background: var(--autojs6-theme-background)"))
        assertTrue(signatureRule.contains("color: var(--autojs6-theme-foreground)"))
        assertTrue(signatureRule.contains("border: 1px solid var(--autojs6-theme-border)"))
        assertFalse(styleSheet.contains("background: #f7f7f7"))

        assertFalse(autocompleteRule.contains("--autojs6-theme-background"))
        assertFalse(autocompleteRule.contains("--autojs6-theme-foreground"))
        assertTrue(javaScript.contains("var popup = editor && editor.completer && editor.completer.popup"))
        assertTrue(javaScript.contains("popup.setTheme(theme)"))
    }

    @Test
    fun `theme changes refresh an existing autocomplete after Ace changes theme`() {
        val applyThemeStart = javaScript.indexOf("function applyEditorTheme")
        val editorThemeIndex = javaScript.indexOf("editor.setTheme(nextTheme)", applyThemeStart)
        val popupThemeIndex = javaScript.indexOf(
            "refreshAutocompletePopupTheme(nextTheme)",
            editorThemeIndex,
        )

        assertTrue(applyThemeStart >= 0)
        assertTrue(editorThemeIndex > applyThemeStart)
        assertTrue(popupThemeIndex > editorThemeIndex)
    }

    @Test
    fun `signed Android ARGB colors are converted to CSS rgba channel order`() {
        assertTrue(javaScript.contains("var argb = numeric >>> 0"))
        assertTrue(javaScript.contains("alpha: (argb >>> 24) & 255"))
        assertTrue(javaScript.contains("red: (argb >>> 16) & 255"))
        assertTrue(javaScript.contains("green: (argb >>> 8) & 255"))
        assertTrue(javaScript.contains("blue: argb & 255"))
        assertTrue(
            javaScript.contains(
                "\"rgba(\" + channels.red + \", \" + channels.green + \", \" + channels.blue",
            ),
        )
    }

    private fun cssRule(selector: String): String {
        val start = styleSheet.indexOf("$selector {")
        check(start >= 0) { "Unable to locate CSS rule: $selector" }
        val end = styleSheet.indexOf('}', start)
        check(end > start) { "Unterminated CSS rule: $selector" }
        return styleSheet.substring(start, end + 1)
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
