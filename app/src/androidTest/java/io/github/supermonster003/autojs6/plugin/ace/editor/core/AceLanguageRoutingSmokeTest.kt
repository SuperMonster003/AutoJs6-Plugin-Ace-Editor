package io.github.supermonster003.autojs6.plugin.ace.editor.core

import android.os.Build
import android.webkit.WebView
import androidx.test.core.app.ActivityScenario
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import io.github.supermonster003.autojs6.plugin.ace.editor.AceEditorPluginEntrypoint
import java.io.File
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicReference
import org.autojs.plugin.editor.api.EditorPluginCallback
import org.autojs.plugin.editor.api.EditorPluginSession
import org.autojs.plugin.editor.api.EditorPluginSessionConfig
import org.autojs.plugin.editor.api.EditorPluginState
import org.json.JSONArray
import org.json.JSONObject
import org.json.JSONTokener
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class AceLanguageRoutingSmokeTest {

    @Test
    fun documentPathSelectsModeAndIsolatesJavaScriptCompletions() {
        val harness = launchEditor("/data/local/tmp/autojs6-routing.js")
        try {
            val expectedModes = linkedMapOf(
                "/data/local/tmp/autojs6-routing.js" to "ace/mode/javascript",
                "/data/local/tmp/autojs6-routing.JSX" to "ace/mode/jsx",
                "/data/local/tmp/autojs6-routing.ts" to "ace/mode/typescript",
                "/data/local/tmp/autojs6-routing.tsx?preview=1" to "ace/mode/typescript",
                "/data/local/tmp/autojs6-routing.json" to "ace/mode/json",
                "/data/local/tmp/autojs6-routing.py" to "ace/mode/python",
                "/data/local/tmp/autojs6-routing.LUA#preview" to "ace/mode/lua",
                "/data/local/tmp/autojs6-routing.java" to "ace/mode/java",
                "/data/local/tmp/autojs6-routing.kt" to "ace/mode/kotlin",
                "/data/local/tmp/autojs6-routing.kts" to "ace/mode/kotlin",
                "/data/local/tmp/autojs6-routing.unknown" to "ace/mode/text",
            )
            expectedModes.forEach { (path, expectedMode) ->
                setDocumentPath(harness, path)
                assertEquals(path, expectedMode, awaitMode(harness, expectedMode))
            }

            setDocumentPath(harness, "/data/local/tmp/autojs6-routing.tsx")
            awaitMode(harness, "ace/mode/typescript")
            setEditorText(harness, "const view = <Button title={answer} />;")
            val tsxTokens = tsxTokenSummary(harness)
            assertTrue(
                "TypeScript mode lost the TSX baseline tokens: $tsxTokens",
                tsxTokens.contains("\"type\":\"storage.type\",\"value\":\"const\"") &&
                    tsxTokens.contains("\"type\":\"identifier\",\"value\":\"Button\"") &&
                    tsxTokens.contains("\"type\":\"keyword.operator\",\"value\":\"<\""),
            )
            println("AUTOJS6_ACE_TSX_BASELINE=$tsxTokens")

            setDocumentPath(harness, "/data/local/tmp/autojs6-routing.js")
            awaitMode(harness, "ace/mode/javascript")
            setEditorText(harness, "files.")
            assertTrue("JavaScript lost AutoJs6 files.* completions", staticCompletionCount(harness) > 0)
            setEditorText(harness, "fu")
            assertTrue("JavaScript lost ECMAScript keyword completions", functionKeywordCount(harness) > 0)

            setDocumentPath(harness, "/data/local/tmp/autojs6-routing.json")
            awaitMode(harness, "ace/mode/json")
            setEditorText(harness, "files.")
            assertEquals("JSON received AutoJs6 files.* completions", 0, staticCompletionCount(harness))
            setEditorText(harness, "fu")
            assertEquals("JSON received JavaScript keyword completions", 0, functionKeywordCount(harness))

            setDocumentPath(harness, "/data/local/tmp/autojs6-routing.py")
            awaitMode(harness, "ace/mode/python")
            setEditorText(harness, "files.")
            assertEquals("Python received AutoJs6 files.* completions", 0, staticCompletionCount(harness))
            setEditorText(harness, "fu")
            assertEquals("Python received JavaScript keyword completions", 0, functionKeywordCount(harness))
        } finally {
            harness.close()
        }
    }

    @Test
    fun m1LanguagesProvideOwnHighlightsKeywordsSnippetsAndDocumentWords() {
        val harness = launchEditor("/data/local/tmp/autojs6-m1.js")
        try {
            val cases = listOf(
                LanguageCase(
                    name = "Python",
                    path = "/data/local/tmp/autojs6-m1.py",
                    mode = "ace/mode/python",
                    fixture = "ace-language-samples/sample.py",
                    highlightedKeywords = listOf("from", "class", "def", "return"),
                    keywordPrefix = "de",
                    keyword = "def",
                    snippet = "asyncdef",
                    documentWord = "m1PythonDocumentWord",
                ),
                LanguageCase(
                    name = "Lua",
                    path = "/data/local/tmp/autojs6-m1.lua",
                    mode = "ace/mode/lua",
                    fixture = "ace-language-samples/sample.lua",
                    highlightedKeywords = listOf("local", "function", "if", "return", "end"),
                    keywordPrefix = "loc",
                    keyword = "local",
                    snippet = "forp",
                    documentWord = "m1LuaDocumentWord",
                ),
                LanguageCase(
                    name = "Java",
                    path = "/data/local/tmp/AutoJs6M1.java",
                    mode = "ace/mode/java",
                    fixture = "ace-language-samples/Sample.java",
                    highlightedKeywords = listOf("package", "import", "public", "class", "return"),
                    keywordPrefix = "pub",
                    keyword = "public",
                    snippet = "before",
                    documentWord = "m1JavaDocumentWord",
                ),
                LanguageCase(
                    name = "Kotlin",
                    path = "/data/local/tmp/AutoJs6M1.kt",
                    mode = "ace/mode/kotlin",
                    fixture = "ace-language-samples/Sample.kt",
                    highlightedKeywords = listOf("package", "data", "class", "fun", "return"),
                    keywordPrefix = "fu",
                    keyword = "fun",
                    snippet = "companion",
                    documentWord = "m1KotlinDocumentWord",
                ),
            )
            val languageSpecificSnippets = cases.map(LanguageCase::snippet).toSet()

            cases.forEach { case ->
                setDocumentPath(harness, case.path)
                assertEquals(case.name, case.mode, awaitMode(harness, case.mode))
                setEditorText(harness, readTestAsset(case.fixture))
                val tokenSnapshot = tokenSnapshot(harness)
                assertHighlightBaseline(case, tokenSnapshot)
                println("AUTOJS6_ACE_M1_TOKENS_${case.name.uppercase()}=$tokenSnapshot")

                setEditorText(harness, case.keywordPrefix)
                assertTrue(
                    "${case.name} did not offer its '${case.keyword}' keyword",
                    awaitCompletionContains(
                        harness,
                        completerName = "keyWordCompleter",
                        prefix = case.keywordPrefix,
                        expected = case.keyword,
                    ),
                )

                setEditorText(harness, case.snippet.take(3))
                assertTrue(
                    "${case.name} did not load its '${case.snippet}' snippet",
                    awaitCompletionContains(
                        harness,
                        completerName = "snippetCompleter",
                        prefix = case.snippet.take(3),
                        expected = case.snippet,
                    ),
                )
                val activeSnippets = completionCaptions(
                    harness,
                    completerName = "snippetCompleter",
                    prefix = case.snippet.take(3),
                )
                val foreignSnippets = languageSpecificSnippets - case.snippet
                assertTrue(
                    "${case.name} exposed foreign snippets: ${activeSnippets.intersect(foreignSnippets)}",
                    activeSnippets.intersect(foreignSnippets).isEmpty(),
                )

                val documentPrefix = case.documentWord.take(case.documentWord.length - 4)
                setEditorText(harness, "${case.documentWord}\n$documentPrefix")
                assertTrue(
                    "${case.name} lost document-word completion",
                    completionCaptions(
                        harness,
                        completerName = "textCompleter",
                        prefix = documentPrefix,
                        row = 1,
                        column = documentPrefix.length,
                    ).contains(case.documentWord),
                )

                setEditorText(harness, "files.")
                assertEquals(
                    "${case.name} received AutoJs6 static candidates",
                    0,
                    staticCompletionCount(harness),
                )
                setEditorText(harness, "dele")
                assertFalse(
                    "${case.name} received the JavaScript-only 'delete' keyword",
                    completionCaptions(
                        harness,
                        completerName = "keyWordCompleter",
                        prefix = "dele",
                    ).contains("delete"),
                )
            }

            setDocumentPath(harness, "/data/local/tmp/AutoJs6M1.kts")
            assertEquals("Kotlin script", "ace/mode/kotlin", awaitMode(harness, "ace/mode/kotlin"))
        } finally {
            harness.close()
        }
    }

    @Test
    fun m2LanguagesProvideLazyStaticAndCurrentDocumentCompletions() {
        val harness = launchEditor("/data/local/tmp/autojs6-m2.py")
        try {
            setDocumentPath(harness, "/data/local/tmp/autojs6-m2.py")
            assertEquals("ace/mode/python", awaitMode(harness, "ace/mode/python"))
            setEditorText(
                harness,
                """
                import os as operating
                from pathlib import Path
                def foo_bar(value, count=1):
                    local_value = value
                    return local_value
                operating.
                """.trimIndent(),
            )
            assertTrue(
                "Python os alias did not expose getcwd",
                awaitStaticCompletionContains(harness, prefix = "", expected = "getcwd"),
            )
            setEditorText(
                harness,
                """
                from pathlib import Path
                Path.
                """.trimIndent(),
            )
            assertTrue(
                "Python imported Path did not expose read_text",
                awaitStaticCompletionContains(harness, prefix = "", expected = "read_text"),
            )
            setEditorText(
                harness,
                """
                def foo_bar(value, count=1):
                    local_value = value
                    return local_value
                foo
                """.trimIndent(),
            )
            assertTrue(
                "Python current-document function was not extracted",
                awaitStaticCompletionContains(harness, prefix = "foo", expected = "foo_bar"),
            )
            assertFalse(
                "Python received Java Math candidates",
                staticCompletionCaptions(harness, prefix = "Ma").contains("Math"),
            )

            setDocumentPath(harness, "/data/local/tmp/autojs6-m2.lua")
            assertEquals("ace/mode/lua", awaitMode(harness, "ace/mode/lua"))
            setEditorText(
                harness,
                """
                local function foo_bar(value, count)
                    local local_value = value
                end
                string.
                """.trimIndent(),
            )
            assertTrue(
                "Lua string library did not expose format",
                awaitStaticCompletionContains(harness, prefix = "", expected = "format"),
            )
            setEditorText(
                harness,
                """
                local function foo_bar(value)
                    return value
                end
                foo
                """.trimIndent(),
            )
            assertTrue(
                "Lua current-document function was not extracted",
                awaitStaticCompletionContains(harness, prefix = "foo", expected = "foo_bar"),
            )
            assertFalse(
                "Lua received AutoJs6 files candidates",
                staticCompletionCaptions(harness, prefix = "files").contains("files"),
            )

            setDocumentPath(harness, "/data/local/tmp/AutoJs6M2.java")
            assertEquals("ace/mode/java", awaitMode(harness, "ace/mode/java"))
            setEditorText(
                harness,
                """
                class AutoJs6M2 {
                    int computeTotal(int count) {
                        int localValue = count;
                        return localValue;
                    }
                }
                Math.
                """.trimIndent(),
            )
            assertTrue(
                "Java Math static index did not expose sqrt",
                awaitStaticCompletionContains(harness, prefix = "", expected = "sqrt"),
            )
            setEditorText(
                harness,
                """
                class AutoJs6M2 {
                    int computeTotal(int count) {
                        return count;
                    }
                }
                compute
                """.trimIndent(),
            )
            assertTrue(
                "Java current-document method was not extracted",
                awaitStaticCompletionContains(harness, prefix = "compute", expected = "computeTotal"),
            )
            assertFalse(
                "Java received Kotlin listOf",
                staticCompletionCaptions(harness, prefix = "listO").contains("listOf"),
            )

            setDocumentPath(harness, "/data/local/tmp/AutoJs6M2.kt")
            assertEquals("ace/mode/kotlin", awaitMode(harness, "ace/mode/kotlin"))
            setEditorText(
                harness,
                """
                fun computeTotal(count: Int): Int {
                    val subtotal = count
                    return subtotal
                }
                list
                """.trimIndent(),
            )
            assertTrue(
                "Kotlin top-level index did not expose listOf",
                awaitStaticCompletionContains(harness, prefix = "list", expected = "listOf"),
            )
            setEditorText(
                harness,
                """
                fun computeTotal(count: Int) = count
                compute
                """.trimIndent(),
            )
            assertTrue(
                "Kotlin current-document function was not extracted",
                awaitStaticCompletionContains(harness, prefix = "compute", expected = "computeTotal"),
            )
            setEditorText(
                harness,
                """
                import android.content.Intent
                val items = listOf("one", "two")
                val mutableItems = mutableListOf(1, 2)
                val intent = Intent("sample.action")
                items.
                """.trimIndent(),
            )
            assertTrue(
                "Kotlin P2+ inferred List did not expose joinToString",
                awaitStaticCompletionContains(harness, prefix = "", expected = "joinToString"),
            )
            setEditorText(
                harness,
                """
                val typedItems: List<String>? = listOf("one")
                typedItems?.
                """.trimIndent(),
            )
            assertTrue(
                "Kotlin P2+ nullable type safe-call did not expose firstOrNull",
                awaitStaticCompletionContains(harness, prefix = "", expected = "firstOrNull"),
            )
            setEditorText(
                harness,
                """
                import android.content.Intent
                val intent = Intent("sample.action")
                intent.
                """.trimIndent(),
            )
            assertTrue(
                "Kotlin P2+ Android interop did not expose putExtra",
                awaitStaticCompletionContains(harness, prefix = "", expected = "putExtra"),
            )
            assertFalse(
                "Kotlin received Python getcwd",
                staticCompletionCaptions(harness, prefix = "getcwd").contains("getcwd"),
            )

            val indexState = evaluateJsonString(
                harness,
                "JSON.stringify(window.AutoJsAceCompleter.getActiveCompleter().getIndexState())",
            )
            listOf("python", "lua", "java", "kotlin").forEach { language ->
                assertEquals(
                    "$language index did not remain ready",
                    "ready",
                    indexState.getJSONObject(language).getString("status"),
                )
            }
            println("AUTOJS6_ACE_M2_INDEX_STATE=$indexState")
        } finally {
            harness.close()
        }
    }

    @Test
    fun m3SemanticFrameworkLoadsAndM4PythonProviderIsConfigured() {
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        val preferences = context.defaultHostPreferences()
        val preferenceKey = AceEditorLspPreferences.KEY_ACE_SEMANTIC_PYTHON_ENABLED
        val hadPreference = preferences.contains(preferenceKey)
        val originalPreference = preferences.getBoolean(
            preferenceKey,
            AceEditorLspPreferences.DEFAULT_SEMANTIC_LANGUAGES.getValue(
                AceEditorLspPreferences.SEMANTIC_LANGUAGE_PYTHON,
            ),
        )
        fun restorePythonSemanticPreference(): Boolean = if (hadPreference) {
            preferences.edit().putBoolean(preferenceKey, originalPreference).commit()
        } else {
            preferences.edit().remove(preferenceKey).commit()
        }
        assertTrue(
            "Failed to enable Python semantics for the M3/M4 routing fixture",
            preferences.edit().putBoolean(preferenceKey, true).commit(),
        )
        val harness = try {
            launchEditor("/data/local/tmp/autojs6-m3.ts")
        } catch (error: Throwable) {
            restorePythonSemanticPreference()
            throw error
        }
        try {
            assertEquals("ace/mode/typescript", awaitMode(harness, "ace/mode/typescript"))
            val framework = evaluateJsonString(
                harness,
                """
                (function() {
                    var semantic = window.AutoJsAceSemanticProvider || {};
                    var core = window.AutoJsAceLspCore || {};
                    var transports = window.AutoJsAceLspTransports || {};
                    var state = window.AutoJsAce.getLspState() || {};
                    return JSON.stringify({
                        capabilityNames: semantic.CAPABILITY_NAMES || [],
                        hasProviderHost: typeof semantic.createProviderHost === "function",
                        hasTypeScriptProvider: typeof semantic.createTypeScriptInProcessProvider === "function",
                        hasLspClient: typeof core.createClient === "function",
                        hasWebWorkerTransport:
                            typeof transports.createWebWorkerTransport === "function",
                        hasStdioTransport:
                            typeof transports.createStdioBridgeTransport === "function",
                        providerId: String(state.configuredSemanticProviderId || ""),
                        configuredCapabilities: state.configuredSemanticCapabilities || []
                    });
                })()
                """.trimIndent(),
            )
            val expectedCapabilities = setOf(
                "completion",
                "hover",
                "signatureHelp",
                "diagnostics",
                "definition",
                "rename",
                "codeActions",
                "dispose",
            )
            assertEquals(
                expectedCapabilities,
                framework.getJSONArray("capabilityNames").toStringSet(),
            )
            assertEquals(
                expectedCapabilities,
                framework.getJSONArray("configuredCapabilities").toStringSet(),
            )
            assertTrue(framework.getBoolean("hasProviderHost"))
            assertTrue(framework.getBoolean("hasTypeScriptProvider"))
            assertTrue(framework.getBoolean("hasLspClient"))
            assertTrue(framework.getBoolean("hasWebWorkerTransport"))
            assertTrue(framework.getBoolean("hasStdioTransport"))
            assertEquals("typescript-in-process", framework.getString("providerId"))

            setDocumentPath(harness, "/data/local/tmp/autojs6-m3.py")
            assertEquals("ace/mode/python", awaitMode(harness, "ace/mode/python"))
            setEditorText(
                harness,
                """
                from pathlib import Path
                Path.
                """.trimIndent(),
            )
            assertTrue(
                "Python lost its M2 fallback completion",
                awaitStaticCompletionContains(harness, prefix = "", expected = "read_text"),
            )
            val pythonState = evaluateJsonString(
                harness,
                "JSON.stringify(window.AutoJsAce.getLspState() || {})",
            )
            assertEquals("python", pythonState.getString("semanticLanguage"))
            assertTrue(pythonState.getJSONObject("semanticLanguages").getBoolean("python"))
            assertEquals("python-pyright-worker", pythonState.getString("configuredSemanticProviderId"))
            println("AUTOJS6_ACE_M3_FRAMEWORK=$framework")
            println("AUTOJS6_ACE_M3_PYTHON_STATE=$pythonState")
        } finally {
            try {
                harness.close()
            } finally {
                assertTrue(
                    "Failed to restore the Python semantic preference",
                    restorePythonSemanticPreference(),
                )
            }
        }
    }

    @Test
    fun luaWorkerPublishesSyntaxAnnotationsAndStopsOutsideLua() {
        val harness = launchEditor("/data/local/tmp/autojs6-m1.lua")
        try {
            setDocumentPath(harness, "/data/local/tmp/autojs6-m1.lua")
            assertEquals("ace/mode/lua", awaitMode(harness, "ace/mode/lua"))
            setEditorText(
                harness,
                """
                local function broken(
                    return )
                end
                """.trimIndent(),
            )
            val workerState = awaitLuaWorkerAnnotation(harness)
            println("AUTOJS6_ACE_LUA_WORKER=$workerState")
            assertTrue("Lua worker policy was not enabled: $workerState", workerState.getBoolean("useWorker"))
            assertTrue("Lua WorkerClient was not created: $workerState", workerState.getBoolean("workerCreated"))
            assertTrue(
                "Invalid Lua did not produce an annotation: $workerState",
                workerState.getJSONArray("annotations").length() > 0,
            )

            setDocumentPath(harness, "/data/local/tmp/autojs6-m1.py")
            assertEquals("ace/mode/python", awaitMode(harness, "ace/mode/python"))
            assertTrue(
                "Lua worker remained active after switching to Python",
                evaluateBoolean(
                    harness,
                    """
                    (function() {
                        var activeSession = window.editor.getSession();
                        return activeSession.getUseWorker() === false && !activeSession.${'$'}worker;
                    })()
                    """.trimIndent(),
                ),
            )
        } finally {
            harness.close()
        }
    }

    @Test
    fun aceWorkerFeasibilityProbeReachesARecordedConclusion() {
        val harness = launchEditor("/data/local/tmp/autojs6-worker.js")
        try {
            assertEquals(
                "ace/mode/javascript",
                awaitMode(harness, "ace/mode/javascript"),
            )
            evaluateRaw(
                harness,
                """
                (function() {
                    var probe = window.__autojs6WorkerProbe = {
                        status: "pending",
                        pageUrl: String(window.location.href || ""),
                        userAgent: String(navigator.userAgent || ""),
                        hasWorkerConstructor: typeof Worker === "function",
                        hasAceWorker: false,
                        sessionWorkerCreated: false,
                        modeId: "",
                        annotationCount: -1,
                        detail: ""
                    };
                    var activeSession = window.editor && window.editor.getSession();
                    if (!activeSession) {
                        probe.status = "no-session";
                        return false;
                    }
                    var finished = false;
                    var worker = null;
                    var finish = function(status, detail) {
                        if (finished) return;
                        finished = true;
                        probe.status = status;
                        probe.detail = String(detail || "");
                        try { activeSession.setUseWorker(false); } catch (ignore) {}
                        try { if (worker) worker.terminate(); } catch (ignore) {}
                    };
                    try {
                        activeSession.setUseWorker(false);
                        activeSession.setMode("ace/mode/javascript");
                        activeSession.setValue("const workerProbe = true;");
                        activeSession.setUseWorker(true);
                        probe.sessionWorkerCreated = !!activeSession.${'$'}worker;
                        probe.modeId = String(activeSession.getMode() && activeSession.getMode().${'$'}id || "");
                        worker = activeSession.${'$'}worker;
                        if (!worker && activeSession.getMode() &&
                            typeof activeSession.getMode().createWorker === "function") {
                            // EditSession intentionally swallows createWorker exceptions. Calling
                            // the same mode factory directly preserves the failure reason and
                            // still exercises Ace's real WorkerClient/assets loader.
                            worker = activeSession.getMode().createWorker(activeSession);
                        }
                        probe.hasAceWorker = !!worker;
                        if (!worker) {
                            finish("no-worker", "ACE did not create WorkerClient");
                            return false;
                        }
                        worker.on("annotate", function(event) {
                            var annotations = event && event.data || [];
                            probe.annotationCount = annotations.length || 0;
                            finish("ok", "annotate event received");
                        });
                        worker.on("error", function(event) {
                            finish("error", event && (event.message || event.data) || event);
                        });
                        activeSession.setValue("function broken( {");
                        setTimeout(function() {
                            finish("timeout", "no annotate/error event within 10000 ms");
                        }, 10000);
                        return true;
                    } catch (error) {
                        finish("exception", error && (error.stack || error.message) || error);
                        return false;
                    }
                })();
                """.trimIndent(),
            )

            val deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(15)
            var probe = JSONObject()
            while (System.nanoTime() < deadline) {
                probe = evaluateJsonString(harness, "JSON.stringify(window.__autojs6WorkerProbe || {})")
                if (probe.optString("status") != "pending") break
                Thread.sleep(100)
            }
            val webViewPackage = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                WebView.getCurrentWebViewPackage()?.let { "${it.packageName}@${it.versionName}" }
            } else {
                null
            }
            val record = JSONObject().apply {
                put("manufacturer", Build.MANUFACTURER)
                put("model", Build.MODEL)
                put("sdk", Build.VERSION.SDK_INT)
                put("release", Build.VERSION.RELEASE)
                put("webViewPackage", webViewPackage ?: "unknown")
                put("probe", probe)
            }
            println("AUTOJS6_ACE_WORKER_PROBE=$record")
            assertNotNull(probe.optString("status").takeIf(String::isNotBlank))
            assertTrue(
                "Worker probe did not reach a terminal state: $record",
                probe.optString("status") in setOf(
                    "ok",
                    "error",
                    "timeout",
                    "exception",
                    "no-worker",
                    "no-session",
                ),
            )
        } finally {
            harness.close()
        }
    }

    private fun launchEditor(documentPath: String): EditorHarness {
        val instrumentation = InstrumentationRegistry.getInstrumentation()
        val context = instrumentation.targetContext
        val ready = CountDownLatch(1)
        val session = AtomicReference<EditorPluginSession>()
        val scenario = ActivityScenario.launch(AceEditorTestActivity::class.java)
        scenario.onActivity { activity ->
            session.set(
                AceEditorPluginEntrypoint().createSession(
                    hostContext = activity,
                    pluginContext = context,
                    config = EditorPluginSessionConfig(
                        hostPackageName = context.packageName,
                        hostVersionName = "instrumentation",
                        hostVersionCode = 6000L,
                        storageDirectoryPath =
                            File(context.cacheDir, "ace-language-routing-smoke-fonts").absolutePath,
                        documentPath = documentPath,
                    ),
                    callback = object : EditorPluginCallback {
                        override fun onReady(state: EditorPluginState) {
                            ready.countDown()
                        }
                    },
                ),
            )
            activity.setContentView(session.get().view)
        }
        assertTrue("ACE language-routing session should become ready", ready.await(15, TimeUnit.SECONDS))
        return EditorHarness(scenario, session)
    }

    private fun setDocumentPath(harness: EditorHarness, path: String) {
        harness.scenario.onActivity {
            harness.session.get().setDocumentPath(path)
        }
    }

    private fun awaitMode(harness: EditorHarness, expected: String): String {
        val deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(10)
        var actual = ""
        while (System.nanoTime() < deadline) {
            actual = evaluateString(
                harness,
                "window.AutoJsAce && window.AutoJsAce.getAceMode ? window.AutoJsAce.getAceMode() : ''",
            )
            if (actual == expected) return actual
            Thread.sleep(50)
        }
        return actual
    }

    private fun setEditorText(harness: EditorHarness, text: String) {
        val quoted = JSONObject.quote(text)
        evaluateRaw(harness, "window.AutoJsAce.setText($quoted, false, false); true")
    }

    private fun staticCompletionCount(harness: EditorHarness): Int = evaluateInt(
        harness,
        """
        (function() {
            var result = [];
            var activeSession = window.editor.getSession();
            var completer = window.AutoJsAceCompleter.getActiveCompleter();
            completer.getCompletions(
                window.editor,
                activeSession,
                { row: 0, column: 6 },
                "",
                function(error, items) { result = items || []; }
            );
            return result.length;
        })()
        """.trimIndent(),
    )

    private fun staticCompletionCaptions(
        harness: EditorHarness,
        prefix: String,
    ): Set<String> {
        val result = evaluateString(
            harness,
            """
            (function() {
                var items = [];
                var activeSession = window.editor.getSession();
                var row = Math.max(0, activeSession.getLength() - 1);
                var column = String(activeSession.getLine(row) || "").length;
                window.AutoJsAceCompleter.getActiveCompleter().getCompletions(
                    window.editor,
                    activeSession,
                    { row: row, column: column },
                    ${JSONObject.quote(prefix)},
                    function(error, results) { items = results || []; }
                );
                return JSON.stringify(items.map(function(item) {
                    return String(item.caption || item.value || "");
                }));
            })()
            """.trimIndent(),
        )
        val array = JSONArray(result)
        return buildSet {
            for (index in 0 until array.length()) {
                add(array.getString(index))
            }
        }
    }

    private fun awaitStaticCompletionContains(
        harness: EditorHarness,
        prefix: String,
        expected: String,
    ): Boolean {
        val deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(10)
        while (System.nanoTime() < deadline) {
            if (staticCompletionCaptions(harness, prefix).contains(expected)) {
                return true
            }
            Thread.sleep(50)
        }
        return false
    }

    private fun functionKeywordCount(harness: EditorHarness): Int = evaluateInt(
        harness,
        """
        (function() {
            var result = [];
            var activeSession = window.editor.getSession();
            var languageTools = window.ace.require("ace/ext/language_tools");
            languageTools.keyWordCompleter.getCompletions(
                window.editor,
                activeSession,
                { row: 0, column: 2 },
                "fu",
                function(error, items) { result = items || []; }
            );
            return result.filter(function(item) {
                return String(item.caption || item.value || "") === "function";
            }).length;
        })()
        """.trimIndent(),
    )

    private fun completionCaptions(
        harness: EditorHarness,
        completerName: String,
        prefix: String,
        row: Int = 0,
        column: Int = prefix.length,
    ): Set<String> {
        val result = evaluateString(
            harness,
            """
            (function() {
                var items = [];
                var activeSession = window.editor.getSession();
                var languageTools = window.ace.require("ace/ext/language_tools");
                var completer = languageTools[${JSONObject.quote(completerName)}];
                if (!completer || typeof completer.getCompletions !== "function") {
                    return "[]";
                }
                completer.getCompletions(
                    window.editor,
                    activeSession,
                    { row: $row, column: $column },
                    ${JSONObject.quote(prefix)},
                    function(error, results) { items = results || []; }
                );
                return JSON.stringify(items.map(function(item) {
                    return String(item.caption || item.value || "");
                }));
            })()
            """.trimIndent(),
        )
        val array = JSONArray(result)
        return buildSet {
            for (index in 0 until array.length()) {
                add(array.getString(index))
            }
        }
    }

    private fun awaitCompletionContains(
        harness: EditorHarness,
        completerName: String,
        prefix: String,
        expected: String,
    ): Boolean {
        val deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(10)
        while (System.nanoTime() < deadline) {
            if (completionCaptions(harness, completerName, prefix).contains(expected)) {
                return true
            }
            Thread.sleep(50)
        }
        return false
    }

    private fun tokenSnapshot(harness: EditorHarness): String = evaluateString(
        harness,
        """
        (function() {
            var activeSession = window.editor.getSession();
            var tokenizer = activeSession.getMode().getTokenizer();
            var state = "start";
            var result = [];
            for (var row = 0; row < activeSession.getLength(); row++) {
                var line = tokenizer.getLineTokens(activeSession.getLine(row), state);
                state = line.state;
                line.tokens.forEach(function(token) {
                    result.push({ row: row, type: token.type, value: token.value });
                });
            }
            return JSON.stringify(result);
        })()
        """.trimIndent(),
    )

    private fun assertHighlightBaseline(case: LanguageCase, snapshot: String) {
        val tokens = JSONArray(snapshot)
        val values = buildList {
            for (index in 0 until tokens.length()) {
                add(tokens.getJSONObject(index))
            }
        }
        assertTrue(
            "${case.name} sample has no comment token: $snapshot",
            values.any { it.getString("type").contains("comment") },
        )
        assertTrue(
            "${case.name} sample has no string token: $snapshot",
            values.any { it.getString("type").contains("string") },
        )
        assertTrue(
            "${case.name} sample has no numeric token: $snapshot",
            values.any { it.getString("type").contains("numeric") },
        )
        case.highlightedKeywords.forEach { keyword ->
            val matches = values.filter { it.getString("value").trim() == keyword }
            assertTrue("${case.name} did not tokenize '$keyword': $snapshot", matches.isNotEmpty())
            assertTrue(
                "${case.name} treated '$keyword' as plain text/identifier: $matches",
                matches.any {
                    val type = it.getString("type")
                    type.contains("keyword") || type.contains("storage") || type.contains("support")
                },
            )
        }
    }

    private fun awaitLuaWorkerAnnotation(harness: EditorHarness): JSONObject {
        val deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(12)
        var state = JSONObject()
        while (System.nanoTime() < deadline) {
            state = evaluateJsonString(
                harness,
                """
                (function() {
                    var activeSession = window.editor.getSession();
                    return JSON.stringify({
                        useWorker: activeSession.getUseWorker(),
                        workerCreated: !!activeSession.${'$'}worker,
                        annotations: activeSession.getAnnotations() || []
                    });
                })()
                """.trimIndent(),
            )
            if (state.optBoolean("workerCreated") &&
                state.optJSONArray("annotations")?.length()?.let { it > 0 } == true
            ) {
                return state
            }
            Thread.sleep(100)
        }
        return state
    }

    private fun readTestAsset(path: String): String =
        InstrumentationRegistry.getInstrumentation().context.assets
            .open(path)
            .bufferedReader()
            .use { it.readText() }

    private fun tsxTokenSummary(harness: EditorHarness): String = evaluateString(
        harness,
        """
        (function() {
            var activeSession = window.editor.getSession();
            var mode = activeSession.getMode();
            return JSON.stringify(
                mode.getTokenizer().getLineTokens(activeSession.getLine(0), "start").tokens
            );
        })()
        """.trimIndent(),
    )

    private fun evaluateString(harness: EditorHarness, script: String): String {
        val value = JSONTokener(evaluateRaw(harness, script)).nextValue()
        return if (value == JSONObject.NULL) "" else value.toString()
    }

    private fun evaluateInt(harness: EditorHarness, script: String): Int =
        (JSONTokener(evaluateRaw(harness, script)).nextValue() as Number).toInt()

    private fun evaluateBoolean(harness: EditorHarness, script: String): Boolean =
        JSONTokener(evaluateRaw(harness, script)).nextValue() as Boolean

    private fun evaluateJsonString(harness: EditorHarness, script: String): JSONObject {
        val encoded = JSONTokener(evaluateRaw(harness, script)).nextValue()
        return JSONObject(encoded.toString())
    }

    private fun JSONArray.toStringSet(): Set<String> = buildSet {
        for (index in 0 until length()) {
            add(getString(index))
        }
    }

    private fun evaluateRaw(harness: EditorHarness, script: String): String {
        val evaluated = CountDownLatch(1)
        val result = AtomicReference<String>()
        harness.scenario.onActivity {
            (harness.session.get().view as AceCodeEditor).webView.evaluateJavascript(script) { raw ->
                result.set(raw)
                evaluated.countDown()
            }
        }
        assertTrue("ACE JavaScript evaluation timed out", evaluated.await(10, TimeUnit.SECONDS))
        return result.get() ?: "null"
    }

    private data class EditorHarness(
        val scenario: ActivityScenario<AceEditorTestActivity>,
        val session: AtomicReference<EditorPluginSession>,
    ) {
        fun close() {
            scenario.onActivity {
                session.getAndSet(null)?.destroy()
            }
            scenario.close()
        }
    }

    private data class LanguageCase(
        val name: String,
        val path: String,
        val mode: String,
        val fixture: String,
        val highlightedKeywords: List<String>,
        val keywordPrefix: String,
        val keyword: String,
        val snippet: String,
        val documentWord: String,
    )
}
