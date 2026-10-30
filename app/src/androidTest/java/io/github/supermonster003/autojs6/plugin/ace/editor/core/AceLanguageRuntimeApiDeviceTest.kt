package io.github.supermonster003.autojs6.plugin.ace.editor.core

import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import java.io.File
import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith

/**
 * The AutoJs6 language runtime APIs bundled for Python (Pyright stubs), Lua (LuaLS meta), Java and Kotlin (static
 * indices of the Entry API) complete in the real page (AutoJs6 api-coverage P5.2e, three names per language):
 *
 *   adb shell am instrument -w -e class io.github.supermonster003.autojs6.plugin.ace.editor.core.AceLanguageRuntimeApiDeviceTest \
 *       io.github.supermonster003.autojs6.plugin.ace.editor.test/androidx.test.runner.AndroidJUnitRunner
 */
@RunWith(AndroidJUnit4::class)
class AceLanguageRuntimeApiDeviceTest {
    @Test
    fun pythonCompletesTheAutoJs6Package() = check(
        "/data/local/tmp/autojs6-p52e.py",
        semantic = true,
        "import autojs6\nautojs6." to "toast",
        "from autojs6 import app\napp." to "launch_app",
        "from autojs6 import dialogs\ndialogs." to "confirm",
    )

    /** The stubs carry the plugin's constant values, so the hover of a constant shows it (api-coverage Q142 (b)). */
    @Test
    fun pythonHoverShowsTheConstantValue() {
        val text = "from autojs6 import dialogs\ndialogs.MAX_ITEMS"
        var hover = ""
        AceDeviceTestHarness.open(text, "/data/local/tmp/autojs6-q142.py", PREFERENCES).use { editor ->
            editor.setText(text)
            repeat(SEMANTIC_ATTEMPTS) {
                editor.evaluate("window.AutoJsAce.showLspTooltip(1, 12); true")
                if (editor.waitFor(SEMANTIC_ATTEMPT_MS) { editor.evaluateString(HOVER_TEXT).also { hover = it }.contains("64") }) {
                    return@use
                }
            }
        }
        assertTrue("dialogs.MAX_ITEMS hover lacks its value 64: $hover", Regex("MAX_ITEMS\\b.*\\b64\\b").containsMatchIn(hover))
    }

    /** LuaLS scans the document's directory as its workspace; like AceLuaSemanticSmokeTest the document sits in the app's cache. */
    @Test
    fun luaCompletesTheAutoJsModule() = check(
        File(InstrumentationRegistry.getInstrumentation().targetContext.cacheDir, "ace-language-runtime-api")
            .apply { mkdirs() }.resolve("autojs6-p52e.lua").path,
        semantic = true,
        "local autojs = require(\"autojs\")\nautojs." to "now",
        "local autojs = require(\"autojs\")\nautojs.console." to "log",
        "local autojs = require(\"autojs\")\nautojs.storage." to "get",
    )

    @Test
    fun javaCompletesTheEntryApi() = check(
        "/data/local/tmp/AutoJs6P52e.java",
        semantic = false,
        "import org.autojs.plugin.jvmsource.api.*;\nclass Main {\n    JvmScr" to "JvmScriptContext",
        "import org.autojs.plugin.jvmsource.api.*;\nclass Main implements AutoJsJv" to "AutoJsJvmEntry",
        "import org.autojs.plugin.jvmsource.api.*;\nclass Main {\n    void run() { JvmScriptContext." to "toast",
    )

    /** The declared type of a parameter or local variable gives its members (api-coverage Q141 (b)). */
    @Test
    fun javaCompletesTheEntryApiOfTypedVariables() = check(
        "/data/local/tmp/AutoJs6Q141.java",
        semantic = false,
        "$JAVA_ENTRY\n        context." to "toast",
        "$JAVA_ENTRY\n        context.can" to "cancellation",
        "$JAVA_ENTRY\n        JvmConsoleApi output = context.console();\n        output." to "log",
    )

    @Test
    fun kotlinCompletesTheEntryApi() = check(
        "/data/local/tmp/AutoJs6P52e.kt",
        semantic = false,
        "fun run(context: JvmScriptContext) {\n    context." to "toast",
        "fun run(context: JvmScriptContext) {\n    context.con" to "console",
        "fun run(context: JvmScriptContext) {\n    context.can" to "cancellation",
    )

    /** Each query is a document ending at the completion point and a name the completion there must offer. */
    private fun check(documentPath: String, semantic: Boolean, vararg queries: Pair<String, String>) {
        var offered = ""
        val missing = AceDeviceTestHarness.open(queries.first().first, documentPath, PREFERENCES).use { editor ->
            queries.filterNot { (text, expected) ->
                editor.setText(text)
                if (semantic) awaitSemanticCompletion(editor, expected) else staticCompletion(editor, text).contains(expected)
            }.map { it.second }.also {
                if (it.isNotEmpty()) {
                    offered = editor.evaluateString("JSON.stringify(Object.keys(window.__autojs6P52eProbe || {}).slice(0, 40))")
                }
            }
        }
        assertEquals("Names missing from the completion of $documentPath (last offered: $offered)", emptyList<String>(), missing)
    }

    /**
     * Asks every completer of the editor (Pyright / LuaLS answer asynchronously) until one offers [expected], with the
     * cursor at the end of the document like after typing it. LuaLS captions carry the parameters (`get(key)`).
     */
    private fun awaitSemanticCompletion(editor: AceDeviceTestHarness, expected: String): Boolean {
        repeat(SEMANTIC_ATTEMPTS) {
            editor.evaluate(
                """
                (function() {
                    var probe = window.__autojs6P52eProbe = {};
                    var activeSession = window.editor.getSession();
                    var row = activeSession.getLength() - 1;
                    var position = { row: row, column: activeSession.getLine(row).length };
                    window.editor.clearSelection();
                    window.editor.moveCursorTo(position.row, position.column);
                    (window.editor.completers || []).forEach(function(completer) {
                        try {
                            completer.getCompletions(window.editor, activeSession, position, "", function(error, items) {
                                (items || []).forEach(function(item) {
                                    probe[String(item.caption || item.value || "").replace(/\(.*$/, "")] = true;
                                });
                            });
                        } catch (ignore) {
                            // A completer that cannot answer here does not decide the result.
                        }
                    });
                    return true;
                })()
                """.trimIndent(),
            )
            if (editor.waitFor(SEMANTIC_ATTEMPT_MS) { editor.evaluateBoolean("window.__autojs6P52eProbe[${quote(expected)}]") }) {
                return true
            }
        }
        return false
    }

    /** The static completer of Java / Kotlin answers at once; the prefix is the identifier before the end of [text]. */
    private fun staticCompletion(editor: AceDeviceTestHarness, text: String): Set<String> {
        val prefix = Regex("\\w*$").find(text)!!.value
        val names = editor.evaluateArray(
            """
            (function() {
                var items = [];
                var activeSession = window.editor.getSession();
                var row = activeSession.getLength() - 1;
                var position = { row: row, column: activeSession.getLine(row).length };
                window.AutoJsAceCompleter.getActiveCompleter().getCompletions(window.editor, activeSession, position, ${quote(prefix)},
                    function(error, results) { items = results || []; });
                return items.map(function(item) { return String(item.caption || item.value || ""); });
            })()
            """.trimIndent(),
        )
        return (0 until names.length()).map(names::getString).toSet()
    }

    private fun quote(text: String): String = JSONObject.quote(text)

    private companion object {
        const val SEMANTIC_ATTEMPTS = 12
        const val SEMANTIC_ATTEMPT_MS = 2_500L
        const val HOVER_TEXT = "(document.querySelector('.autojs6_hover_tooltip_content') || {}).textContent || ''"

        const val JAVA_ENTRY = "import org.autojs.plugin.jvmsource.api.*;\n" +
            "public class Main implements AutoJsJvmEntry {\n" +
            "    public Object run(final JvmScriptContext context) {"

        val PREFERENCES: Map<String, Any?> = mapOf(
            AceEditorLspPreferences.KEY_ACE_LSP_ENABLED to true,
            AceEditorLspPreferences.KEY_ACE_SEMANTIC_PYTHON_ENABLED to true,
            AceEditorLspPreferences.KEY_ACE_SEMANTIC_LUA_ENABLED to true,
            AceEditorLspPreferences.KEY_ACE_SEMANTIC_JAVA_ENABLED to true,
        )
    }
}
