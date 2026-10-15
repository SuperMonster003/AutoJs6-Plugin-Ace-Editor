package io.github.supermonster003.autojs6.plugin.ace.editor.core

import android.graphics.Bitmap
import android.os.Build
import android.os.SystemClock
import android.provider.Settings
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import java.io.File
import org.json.JSONArray
import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith

/** Uses the real page's public LSP wrapper and popup, with the normal provider budgets and native asset bridge. */
@RunWith(AndroidJUnit4::class)
class AceApiCoverageDeviceTest {

    @Test
    fun defaultGroupsExposeRegisteredApisAndTypedReturnChains() = withEvidence("default-api") { editor, evidence ->
        val cases = linkedMapOf(
            "Arrayx.differ" to "differ", "Arrayx.subtract" to "subtract",
            "Mathx.mean" to "mean", "Mathx.mode" to "mode", "Mathx.randFloat" to "randFloat",
            "Mathx.random" to "random", "Mathx.randomFloat" to "randomFloat", "Mathx.randomInt" to "randomInt",
            "Numberx.ensureNumberLike" to "ensureNumberLike", "Numberx.ensureNumbersLike" to "ensureNumbersLike",
            "engines.getEngines" to "getEngines", "util.checkStringArgument" to "checkStringArgument",
            "util.dpToPx" to "dpToPx", "util.pxToDp" to "pxToDp", "util.pxToSp" to "pxToSp", "util.spToPx" to "spToPx",
            "util.versionCodes.searchAll" to "searchAll", "util.versionCodes.summary" to "summary",
            "randomFloat" to "randomFloat", "randomInt" to "randomInt", "verbose" to "verbose",
            "console.setContentTextColors" to "setContentTextColors",
            "selector().findOne" to "findOne", "selector().findOne().click" to "click",
            "selector().findOne().children().findOne" to "findOne",
            "floaty.rawWindow('<frame/>').getWidth" to "getWidth",
            "\$media.playMusic" to "playMusic", "threads.disposable().blockedGet" to "blockedGet",
        )
        cases.forEach { (text, expected) ->
            val result = query(editor, text, expected, evidence)
            assertTrue("Missing semantic API $text: $result", semanticNames(result).contains(expected))
        }
        val colors = query(editor, "Color('red').", "", evidence)
        assertTrue("Color aliases are missing: $colors", semanticNames(colors).containsAll(
            listOf("argb", "hsl", "hsla", "hsv", "hsva", "rgb", "rgba"),
        ))
        for (constant in listOf("MODE_NORMAL", "STYLE_TONE")) {
            val result = query(editor, "pinyin.$constant.", "", evidence)
            assertEquals("Pinyin must not expose a synthetic brand: $result",
                setOf("value", "getValue", "name", "ordinal"), semanticNames(result))
        }
        showPopup(editor, "selector().findOne().cli", "click", evidence, "selector-popup")
    }

    @Test
    fun jsoxActivationAndRemovalReachTheRealProviderAndPopup() = withEvidence("jsox") { editor, evidence ->
        val inactive = query(editor, "Math.su", "su", evidence)
        assertFalse("Math.sum leaked before activation: $inactive", semanticNames(inactive).contains("sum"))
        val activations = listOf(
            "jsox();" to setOf("array", "math", "number"),
            "\$jsox.extend();" to setOf("array", "math", "number"),
            "jsox.extendAll();" to setOf("array", "math", "number"),
            "jsox.extend(['Arrayx', 'Math']);" to setOf("array", "math"),
        )
        for ((activation, modules) in activations) {
            val result = query(editor, "$activation\nMath.su", "su", evidence)
            assertEquals("Wrong activation set: $result", modules, arrayNames(result.getJSONArray("jsoxModules")))
            assertTrue("Math.sum did not reach the semantic provider: $result", semanticNames(result).contains("sum"))
        }
        for ((activation, text, expected) in listOf(
            Triple("jsox.extend('Array');", "[1,2,2].di", "distinct"),
            Triple("\$jsox('Number');", "(5).cl", "clamp"),
            Triple("jsox.extend('Numberx');", "Number.IC", "ICU"),
        )) {
            val result = query(editor, "$activation\n$text", text.substringAfterLast('.'), evidence)
            assertTrue("Selected module did not load: $result", semanticNames(result).contains(expected))
        }
        val selected = query(editor, "jsox.extend('Array');\nMath.su", "su", evidence)
        assertEquals(setOf("array"), arrayNames(selected.getJSONArray("jsoxModules")))
        assertFalse("Array-only activation leaked Math extensions", semanticNames(selected).contains("sum"))
        showPopup(editor, "\$jsox.extendAll();\nMath.s", "sum", evidence, "jsox-popup")
        for (prefix in listOf(
            "", "// jsox.extendAll();\n", "'jsox.extendAll()';\n", "`jsox.extendAll()`;\n",
            "const fake = /jsox\\.extendAll\\(\\)/;\n", "function later() { jsox(); }\n",
            "const jsox = function() {}; jsox();\n", "const { jsox } = {}; jsox();\n",
        )) {
            val result = query(editor, prefix + "Math.su", "su", evidence)
            assertTrue("False JSOX activation: $result", arrayNames(result.getJSONArray("jsoxModules")).isEmpty())
            assertFalse("Math.sum survived removal or a false activation: $result", semanticNames(result).contains("sum"))
        }
    }

    private fun query(editor: AceDeviceTestHarness, text: String, prefix: String, evidence: JSONObject): JSONObject {
        editor.evaluate("window.editor.completer && window.editor.completer.detach(), true")
        editor.setText(text)
        val lines = text.split('\n')
        editor.moveCursorTo(lines.lastIndex, lines.last().length)
        editor.evaluate(
            """(function() {
                var e = window.editor, s = e.getSession(), pos = e.getCursorPosition();
                var c = (e.completers || []).filter(function(candidate) { return candidate.autojs6Lsp === true; })[0];
                window.__apiCoverageDeviceQuery = { done: false };
                if (!c) { window.__apiCoverageDeviceQuery = { done: true, error: 'Public LSP completer missing' }; return true; }
                var started = performance.now();
                c.getCompletions(e, s, pos, ${JSONObject.quote(prefix)}, function(error, items) {
                    window.__apiCoverageDeviceQuery = {
                        done: true, error: error ? String(error) : '', elapsedMs: performance.now() - started,
                        items: (items || []).map(function(item) { return {
                            caption: item.caption || item.value || '', ts: item.autojs6Ts === true,
                            meta: item.meta || '', docText: item.docText || ''
                        }; }),
                        state: window.AutoJsAce.getLspState(),
                        jsoxModules: window.AutoJsAceLocalSymbols.detectJsoxModules(e.getValue())
                    };
                });
                return true;
            })()""".trimIndent(),
        )
        assertTrue("Completion callback timed out for $text", editor.waitFor(15_000L) {
            editor.evaluateBoolean("window.__apiCoverageDeviceQuery && window.__apiCoverageDeviceQuery.done")
        })
        val result = editor.evaluateJson("window.__apiCoverageDeviceQuery").put("text", text).put("prefix", prefix)
        evidence.getJSONArray("queries").put(result)
        assertEquals("Completion failed: $result", "", result.optString("error"))
        assertDefaultProvider(result.getJSONObject("state"))
        return result
    }

    private fun assertDefaultProvider(state: JSONObject) {
        assertEquals("Unexpected semantic provider: $state", "typescript-language-service", state.getString("completionProvider"))
        assertTrue("Optional declaration groups were enabled: $state", state.getJSONArray("declarationGroups").length() == 0)
        assertTrue("Optional dependencies were enabled: $state", state.getJSONArray("effectiveDeclarationGroups").length() == 0)
        val optional = Regex("lib\\.autojs6\\.(android|libraries|resources|main-app)\\.d\\.ts")
        assertFalse("Native declaration groups bypassed the default: $state", optional.containsMatchIn(state.getJSONArray("libraryUris").toString()))
        val provider = state.getJSONObject("semanticProvider")
        assertTrue("Semantic provider degraded: $provider", provider.getBoolean("healthy"))
        assertEquals("Normal operation budget was modified", 2000, provider.getInt("operationTimeoutMs"))
        assertEquals("Cold operation budget was modified", 6000, provider.getInt("coldStartOperationTimeoutMs"))
        assertEquals("Semantic failures occurred: $provider", 0, provider.getInt("failureCount"))
        assertTrue("Real TypeScript service is not ready: $state", state.getJSONObject("tsService").getBoolean("ready"))
    }

    private fun showPopup(editor: AceDeviceTestHarness, text: String, expected: String, evidence: JSONObject, name: String) {
        val prefix = text.substringAfterLast('.')
        val result = query(editor, text, prefix, evidence)
        assertTrue("Popup test lacks the expected semantic candidate: $result", semanticNames(result).contains(expected))
        editor.focusEditor()
        editor.evaluate("window.editor.execCommand('startAutocomplete'), true")
        assertTrue("Real popup did not show $expected", editor.waitFor(5_000L) {
            editor.evaluateBoolean(
                "window.editor.completer && window.editor.completer.popup && window.editor.completer.popup.isOpen && " +
                    "(window.editor.completer.completions.filtered || []).some(function(item) { " +
                    "return item.caption === ${JSONObject.quote(expected)} && item.autojs6Ts === true; })",
            )
        })
        editor.evaluate("window.__apiPopupPainted = false; requestAnimationFrame(function() { requestAnimationFrame(function() { window.__apiPopupPainted = true; }); }); true")
        assertTrue("Popup did not reach a rendered frame", editor.waitFor(5_000L) {
            editor.evaluateBoolean("window.__apiPopupPainted === true")
        })
        val snapshot = editor.evaluateJson(
            "(function() { var p = window.editor.completer.popup, r = p.container.getBoundingClientRect(), s = getComputedStyle(p.container); " +
                "var t = window.editor.completer.tooltipNode, d = t && t.getBoundingClientRect(), ds = t && getComputedStyle(t); return " +
                "({ open: p.isOpen, display: s.display, visibility: s.visibility, opacity: s.opacity, " +
                "bounds: { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height }, " +
                "documentation: d ? { top: d.top, bottom: d.bottom, left: d.left, right: d.right, position: ds.position, display: ds.display, " +
                "css: t.style.cssText, parent: t.parentNode.className, overlaps: ds.display !== 'none' && d.left < r.right && d.right > r.left && d.top < r.bottom && d.bottom > r.top } : null, " +
                "renderedText: p.container.textContent, " +
                "items: (window.editor.completer.completions.filtered || []).map(function(item) { return {caption: item.caption, ts: item.autojs6Ts === true}; }), " +
                "state: window.AutoJsAce.getLspState() }); })()",
        )
        evidence.put(name, snapshot)
        assertTrue("Popup closed before paint: $snapshot", snapshot.getBoolean("open"))
        assertFalse("Popup is display:none: $snapshot", snapshot.getString("display") == "none")
        assertEquals("Popup is not visible: $snapshot", "visible", snapshot.getString("visibility"))
        assertTrue("Popup is transparent: $snapshot", snapshot.getString("opacity").toDouble() > 0)
        assertTrue("Popup has no visible rectangle: $snapshot", snapshot.getJSONObject("bounds").getDouble("width") > 0 &&
            snapshot.getJSONObject("bounds").getDouble("height") > 0)
        assertFalse("Completion documentation covers candidates: $snapshot", snapshot.optJSONObject("documentation")?.optBoolean("overlaps") == true)
        InstrumentationRegistry.getInstrumentation().waitForIdleSync()
        SystemClock.sleep(150L)
        screenshot(name)
        editor.evaluate("window.editor.completer.detach(), true")
    }

    private fun semanticNames(result: JSONObject): Set<String> {
        val items = result.getJSONArray("items")
        return (0 until items.length()).map { items.getJSONObject(it) }
            .filter { it.getBoolean("ts") }.map { it.getString("caption") }.toSet()
    }

    private fun arrayNames(array: JSONArray): Set<String> = (0 until array.length()).map(array::getString).toSet()

    private fun withEvidence(name: String, body: (AceDeviceTestHarness, JSONObject) -> Unit) {
        val instrumentation = InstrumentationRegistry.getInstrumentation()
        val context = instrumentation.targetContext
        val preferences = context.defaultHostPreferences()
        val before = PREFERENCES.keys.associateWith { preferences.all[it] }
        val rotationBefore = Settings.System.getString(context.contentResolver, Settings.System.USER_ROTATION)
        val autoRotationBefore = Settings.System.getString(context.contentResolver, Settings.System.ACCELEROMETER_ROTATION)
        val evidence = JSONObject().put("test", name).put("manufacturer", Build.MANUFACTURER).put("model", Build.MODEL)
            .put("sdk", Build.VERSION.SDK_INT).put("queries", JSONArray()).put("passed", false)
        try {
            AceDeviceTestHarness.open("// API coverage device test\n// Default declaration groups\n", preferences = PREFERENCES).use { editor ->
                evidence.put("device", editor.device)
                assertTrue("TypeScript provider did not start", editor.waitFor(20_000L) {
                    editor.evaluateBoolean("(function() { var s = window.AutoJsAce.getLspState(); return s && s.tsService && s.tsService.ready; })()")
                })
                evidence.put("initialState", editor.evaluateJson("window.AutoJsAce.getLspState()"))
                try {
                    body(editor, evidence)
                    evidence.put("passed", true)
                } catch (error: Throwable) {
                    evidence.put("failure", error.stackTraceToString())
                    evidence.put("failureState", editor.evaluateJson("window.AutoJsAce.getLspState()"))
                    screenshot("$name-failure")
                    throw error
                }
            }
        } finally {
            val after = PREFERENCES.keys.associateWith { preferences.all[it] }
            evidence.put("preferencesRestored", before == after)
            evidence.put("rotationRestored", rotationBefore == Settings.System.getString(context.contentResolver, Settings.System.USER_ROTATION) &&
                autoRotationBefore == Settings.System.getString(context.contentResolver, Settings.System.ACCELEROMETER_ROTATION))
            File(evidenceDirectory(), "$name.json").writeText(evidence.toString(2))
            assertEquals("Temporary host preferences were not restored", before, after)
            assertTrue("Test changed device rotation", evidence.getBoolean("rotationRestored"))
        }
    }

    private fun screenshot(name: String) {
        val image = InstrumentationRegistry.getInstrumentation().uiAutomation.takeScreenshot()
        checkNotNull(image) { "Unable to capture the real editor screen" }
        File(evidenceDirectory(), "$name.png").outputStream().use { image.compress(Bitmap.CompressFormat.PNG, 100, it) }
        image.recycle()
    }

    private fun evidenceDirectory(): File = File(
        InstrumentationRegistry.getInstrumentation().targetContext.getExternalFilesDir(null), "api-coverage-device",
    ).apply { mkdirs() }

    private companion object {
        val PREFERENCES: Map<String, Any?> = mapOf(
            AceEditorLspPreferences.KEY_ACE_LSP_ENABLED to true,
            AceEditorLspPreferences.KEY_ACE_SEMANTIC_TYPESCRIPT_ENABLED to true,
            AceEditorLspPreferences.KEY_ACE_LSP_DECLARATION_GROUPS to null,
            AceEditorLspPreferences.KEY_ACE_LSP_FILE_TYPES to "js,jsx,ts,tsx",
            AceEditorLspPreferences.KEY_ACE_LSP_FILE_TYPES_REVISION to AceEditorLspPreferences.FILE_TYPES_REVISION,
        )
    }
}
