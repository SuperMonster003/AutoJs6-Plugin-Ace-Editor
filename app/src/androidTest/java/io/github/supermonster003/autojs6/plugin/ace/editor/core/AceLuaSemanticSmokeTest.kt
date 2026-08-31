package io.github.supermonster003.autojs6.plugin.ace.editor.core

import android.os.Build
import android.util.Log
import android.webkit.WebView
import androidx.test.core.app.ActivityScenario
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import io.github.supermonster003.autojs6.plugin.ace.editor.AceEditorPluginEntrypoint
import java.io.File
import java.util.concurrent.CountDownLatch
import java.util.concurrent.CopyOnWriteArrayList
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
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class AceLuaSemanticSmokeTest {

    @Test
    fun bundledLuaLanguageServerPassesSemanticRecoveryAndReleaseGate() {
        val instrumentation = InstrumentationRegistry.getInstrumentation()
        val context = instrumentation.targetContext
        val preferences = context.defaultHostPreferences()
        val hadLuaSemanticPreference = preferences.contains(
            AceEditorLspPreferences.KEY_ACE_SEMANTIC_LUA_ENABLED,
        )
        val originalLuaSemanticPreference = preferences.getBoolean(
            AceEditorLspPreferences.KEY_ACE_SEMANTIC_LUA_ENABLED,
            AceEditorLspPreferences.DEFAULT_SEMANTIC_LANGUAGES.getValue(
                AceEditorLspPreferences.SEMANTIC_LANGUAGE_LUA,
            ),
        )
        assertTrue(
            "Failed to enable Lua semantics for the smoke test",
            preferences.edit()
                .putBoolean(AceEditorLspPreferences.KEY_ACE_SEMANTIC_LUA_ENABLED, true)
                .commit(),
        )

        val projectRoot = File(context.cacheDir, "ace-lua-semantic-smoke-project")
        assertTrue(projectRoot.mkdirs() || projectRoot.isDirectory)
        val document = File(projectRoot, "main.lua")
        val ready = CountDownLatch(1)
        val callbackErrors = CopyOnWriteArrayList<String>()
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
                            File(context.cacheDir, "ace-lua-semantic-smoke-fonts").absolutePath,
                        documentPath = document.absolutePath,
                    ),
                    callback = object : EditorPluginCallback {
                        override fun onReady(state: EditorPluginState) {
                            ready.countDown()
                        }

                        override fun onError(message: String, detail: String?) {
                            callbackErrors += "$message: ${detail.orEmpty()}"
                        }
                    },
                ),
            )
            activity.setContentView(session.get().view)
        }

        try {
            assertTrue("ACE Lua session should become ready", ready.await(15, TimeUnit.SECONDS))
            assertEquals(
                "ace/mode/lua",
                awaitString(scenario, session, 10) {
                    evaluateString(
                        scenario,
                        session,
                        "window.AutoJsAce && window.AutoJsAce.getAceMode ? " +
                            "window.AutoJsAce.getAceMode() : ''",
                    ).takeIf { it == "ace/mode/lua" }
                },
            )

            val configured = awaitJson(scenario, session, 10) {
                evaluateJson(
                    scenario,
                    session,
                    "JSON.stringify(window.AutoJsAce.getLspState() || {})",
                ).takeIf { it.optString("semanticLanguage") == "lua" }
            }
            assertEquals("lua-luals", configured.getString("configuredSemanticProviderId"))
            assertTrue(configured.getJSONObject("semanticLanguages").getBoolean("lua"))
            assertEquals("stdio", configured.getString("transport"))
            assertTrue(configured.getBoolean("startSupported"))

            if (!configured.getBoolean("serverAvailable")) {
                verifyUnsupportedAbiFallback(scenario, session, configured, callbackErrors)
                return
            }

            val source = listOf(
                "---@type string",
                "local greeting = 'hello'",
                "greeting:",
                "local function greet(name)",
                "    return name",
                "end",
                "greet('world')",
                "missing_global()",
            ).joinToString("\n")
            evaluateRaw(
                scenario,
                session,
                "window.AutoJsAce.setText(${JSONObject.quote(source)}, false, false); true",
            )

            val lastWarmUpState = AtomicReference(JSONObject())
            val readyState = try {
                awaitJson(scenario, session, 20) {
                    evaluateJson(
                        scenario,
                        session,
                        "JSON.stringify(window.AutoJsAce.getLspState() || {})",
                    ).also(lastWarmUpState::set).takeIf { state ->
                        state.optJSONObject("luaService")?.optBoolean("ready") == true
                    }
                }
            } catch (error: AssertionError) {
                throw AssertionError(
                    "LuaLS did not become ready; last state=${lastWarmUpState.get()}, " +
                        "callbackErrors=$callbackErrors",
                    error,
                )
            }
            val luaService = readyState.getJSONObject("luaService")
            assertEquals("lua-luals", luaService.getString("id"))
            assertEquals("stdio", luaService.getString("kind"))
            assertEquals(
                document.canonicalFile,
                File(java.net.URI(luaService.getString("documentUri"))).canonicalFile,
            )
            assertTrue(
                "LuaLS initialization exceeded 10 seconds: $readyState",
                luaService.getDouble("initializationMs") < MAX_INITIALIZATION_MS,
            )

            startSemanticCompletionProbe(scenario, session, "__autojs6M5CompletionProbe")
            val completion = awaitJson(scenario, session, 20) {
                evaluateJson(
                    scenario,
                    session,
                    "JSON.stringify(window.__autojs6M5CompletionProbe || {})",
                ).takeIf { it.optBoolean("done") }
            }
            assertEquals("Lua semantic completion failed: $completion", "", completion.getString("error"))
            assertTrue("LuaLS string.upper completion is missing: $completion", completion.getBoolean("hasUpper"))
            assertTrue("LuaLS string.sub completion is missing: $completion", completion.getBoolean("hasSub"))
            assertTrue("Lua completion did not carry its semantic marker: $completion", completion.getBoolean("semantic"))
            assertTrue(
                "Lua completion P50 exceeded 500 ms: $completion",
                completion.getDouble("steadyP50Ms") < MAX_COMPLETION_P50_MS,
            )

            val lastDiagnostics = AtomicReference(JSONArray())
            val diagnostics = try {
                awaitJsonArray(scenario, session, 15) {
                    evaluateJsonArray(
                        scenario,
                        session,
                        "JSON.stringify(window.AutoJsAce.getLspDiagnostics() || [])",
                    ).also(lastDiagnostics::set).takeIf { values ->
                        values.anyDiagnostic { item ->
                            item.optString("raw").contains("undefined-global") ||
                                item.optString("code").contains("undefined-global") ||
                                item.optString("text").contains("missing_global") ||
                                item.optString("message").contains("missing_global")
                        }
                    }
                }
            } catch (error: AssertionError) {
                val state = evaluateJson(
                    scenario,
                    session,
                    "JSON.stringify(window.AutoJsAce.getLspState() || {})",
                )
                throw AssertionError(
                    "LuaLS diagnostic was not published; last diagnostics=${lastDiagnostics.get()}, " +
                        "state=$state, callbackErrors=$callbackErrors",
                    error,
                )
            }

            evaluateRaw(scenario, session, "window.AutoJsAce.showLspTooltip(1, 8); true")
            val hoverText = awaitString(scenario, session, 10) {
                evaluateString(
                    scenario,
                    session,
                    "(document.querySelector('.autojs6_hover_tooltip_content') || {}).textContent || ''",
                ).takeIf { value ->
                    value.contains("greeting") && value.contains("string", ignoreCase = true)
                }
            }
            assertTrue("---@type did not produce a string hover: $hoverText", hoverText.contains("string"))

            evaluateRaw(scenario, session, "window.AutoJsAce.showSignatureHelp(6, 6); true")
            val signature = awaitJson(scenario, session, 10) {
                evaluateJson(
                    scenario,
                    session,
                    "JSON.stringify(window.AutoJsAce.getSignatureHelpState() || {})",
                ).takeIf { it.optString("signature").contains("greet") }
            }
            assertTrue(signature.getString("signature").contains("name"))

            evaluateRaw(
                scenario,
                session,
                "window.editor.moveCursorTo(6, 2); window.AutoJsAce.goToDefinition(6, 2); true",
            )
            val definitionCursor = awaitJson(scenario, session, 10) {
                evaluateJson(
                    scenario,
                    session,
                    "JSON.stringify(window.editor.getCursorPosition())",
                ).takeIf { it.optInt("row", -1) == 3 }
            }
            assertEquals(3, definitionCursor.getInt("row"))

            val beforeCrash = evaluateJson(
                scenario,
                session,
                "JSON.stringify(window.AutoJsAce.getLspState().luaService || {})",
            )
            assertTrue(
                "Lua semantic path reported errors before crash injection: $callbackErrors",
                callbackErrors.isEmpty(),
            )
            val crashInjected = AtomicReference(false)
            scenario.onActivity {
                crashInjected.set(
                    (session.get().view as AceCodeEditor).forceLuaLspProcessCrashForTest(),
                )
            }
            assertTrue("No live LuaLS process was available for crash injection", crashInjected.get())
            val recovered = awaitJson(scenario, session, 15) {
                evaluateJson(
                    scenario,
                    session,
                    "JSON.stringify(window.AutoJsAce.getLspState().luaService || {})",
                ).takeIf { state ->
                    state.optBoolean("ready") &&
                        state.optInt("processCrashCount") >=
                            beforeCrash.optInt("processCrashCount") + 1 &&
                        state.optInt("restartCount") >= beforeCrash.optInt("restartCount") + 1
                }
            }
            assertTrue(recovered.getBoolean("ready"))

            startSemanticCompletionProbe(scenario, session, "__autojs6M5RecoveredCompletionProbe")
            val recoveredCompletion = awaitJson(scenario, session, 15) {
                evaluateJson(
                    scenario,
                    session,
                    "JSON.stringify(window.__autojs6M5RecoveredCompletionProbe || {})",
                ).takeIf { it.optBoolean("done") }
            }
            assertEquals(
                "Lua semantic completion did not recover: $recoveredCompletion",
                "",
                recoveredCompletion.getString("error"),
            )
            assertTrue(recoveredCompletion.getBoolean("semantic"))

            val lifecycleBefore = evaluateJson(
                scenario,
                session,
                "JSON.stringify(window.AutoJsAceLuaProvider.getLifecycleState())",
            )
            assertTrue(lifecycleBefore.getInt("activeProviderCount") >= 1)
            evaluateRaw(scenario, session, PAGE_HIDE_SCRIPT)
            val lifecycleAfter = awaitJson(scenario, session, 10) {
                evaluateJson(
                    scenario,
                    session,
                    "JSON.stringify(window.AutoJsAceLuaProvider.getLifecycleState())",
                ).takeIf { state ->
                    state.optInt("activeProviderCount", -1) == 0 &&
                        state.optInt("processReleaseCount", 0) >=
                            lifecycleBefore.optInt("processReleaseCount", 0) + 1
                }
            }
            val expectedCrashErrors = callbackErrors.filter { error ->
                error.startsWith("lua-luals stdio transport failed:")
            }
            val unexpectedCallbackErrors = callbackErrors - expectedCrashErrors.toSet()
            assertTrue(
                "Lua semantic path reported unexpected UI errors: $callbackErrors",
                unexpectedCallbackErrors.isEmpty() && expectedCrashErrors.size <= 1,
            )

            val record = JSONObject().apply {
                put("schema", 1)
                put("measurement", "m5-lua-semantic-gate")
                put("path", "semantic")
                put("manufacturer", Build.MANUFACTURER)
                put("model", Build.MODEL)
                put("sdk", Build.VERSION.SDK_INT)
                put("release", Build.VERSION.RELEASE)
                put("abi", Build.SUPPORTED_ABIS.firstOrNull().orEmpty())
                put("webViewPackage", webViewPackageDescription())
                put("initializationMs", luaService.getDouble("initializationMs"))
                put("firstSemanticPacketMs", completion.getDouble("firstSemanticPacketMs"))
                put("completionSteadyP50Ms", completion.getDouble("steadyP50Ms"))
                put("completionCount", completion.getInt("completionCount"))
                put("diagnosticCount", diagnostics.length())
                put("processCrashCount", recovered.getInt("processCrashCount"))
                put("restartCount", recovered.getInt("restartCount"))
                put("lifecycleBefore", lifecycleBefore)
                put("lifecycleAfter", lifecycleAfter)
                put("callbackErrorCount", callbackErrors.size)
                put("expectedCrashErrorCount", expectedCrashErrors.size)
            }
            Log.i(LOG_TAG, "$LOG_PREFIX$record")
            println("$LOG_PREFIX$record")
        } finally {
            scenario.onActivity {
                session.getAndSet(null)?.destroy()
            }
            scenario.close()
            val restored = if (hadLuaSemanticPreference) {
                preferences.edit()
                    .putBoolean(
                        AceEditorLspPreferences.KEY_ACE_SEMANTIC_LUA_ENABLED,
                        originalLuaSemanticPreference,
                    )
                    .commit()
            } else {
                preferences.edit()
                    .remove(AceEditorLspPreferences.KEY_ACE_SEMANTIC_LUA_ENABLED)
                    .commit()
            }
            assertTrue("Failed to restore the Lua semantic preference", restored)
        }
    }

    private fun verifyUnsupportedAbiFallback(
        scenario: ActivityScenario<AceEditorTestActivity>,
        session: AtomicReference<EditorPluginSession>,
        configured: JSONObject,
        callbackErrors: List<String>,
    ) {
        assertEquals("bundled-luals-unavailable-for-abi", configured.getString("reason"))
        evaluateRaw(
            scenario,
            session,
            "window.AutoJsAce.setText('string.', false, false); true",
        )
        startFallbackCompletionProbe(scenario, session)
        val fallback = awaitJson(scenario, session, 15) {
            evaluateJson(
                scenario,
                session,
                "JSON.stringify(window.__autojs6M5FallbackProbe || {})",
            ).takeIf { it.optBoolean("done") }
        }
        assertEquals("Lua P2 fallback failed: $fallback", "", fallback.getString("error"))
        assertTrue(fallback.getBoolean("hasFormat"))
        assertTrue(fallback.getBoolean("hasRep"))
        assertFalse(fallback.getBoolean("semantic"))
        assertTrue("Silent Lua ABI fallback reported UI errors: $callbackErrors", callbackErrors.isEmpty())
        val record = JSONObject().apply {
            put("schema", 1)
            put("measurement", "m5-lua-semantic-gate")
            put("path", "p2-unsupported-abi")
            put("manufacturer", Build.MANUFACTURER)
            put("model", Build.MODEL)
            put("sdk", Build.VERSION.SDK_INT)
            put("release", Build.VERSION.RELEASE)
            put("abi", Build.SUPPORTED_ABIS.firstOrNull().orEmpty())
            put("completionCount", fallback.getInt("completionCount"))
            put("completionDurationMs", fallback.getDouble("durationMs"))
            put("reason", configured.getString("reason"))
            put("callbackErrorCount", callbackErrors.size)
        }
        Log.i(LOG_TAG, "$LOG_PREFIX$record")
        println("$LOG_PREFIX$record")
    }

    private fun startSemanticCompletionProbe(
        scenario: ActivityScenario<AceEditorTestActivity>,
        session: AtomicReference<EditorPluginSession>,
        variableName: String,
    ) {
        evaluateRaw(
            scenario,
            session,
            """
            (function() {
                var activeSession = window.editor.getSession();
                var completer = (window.editor.completers || []).filter(function(candidate) {
                    return candidate.autojs6Lsp === true;
                })[0];
                var probe = window[${JSONObject.quote(variableName)}] = { done: false, error: "" };
                var position = { row: 2, column: 9 };
                var startedAt = performance.now();
                var settled = false;
                var timeout = setTimeout(function() {
                    if (!settled) {
                        settled = true;
                        probe.done = true;
                        probe.error = "Lua semantic completion timeout";
                    }
                }, 12000);
                if (!completer) {
                    clearTimeout(timeout);
                    probe.done = true;
                    probe.error = "LSP completion wrapper is unavailable";
                    return true;
                }
                function discover() {
                    if (settled) return;
                    completer.getCompletions(
                        window.editor,
                        activeSession,
                        position,
                        "",
                        function(error, items) {
                            items = !error && Array.isArray(items) ? items : [];
                            var semantic = items.some(function(item) {
                                return item.autojs6Lua === true;
                            });
                            if (!semantic) {
                                setTimeout(discover, 50);
                                return;
                            }
                            probe.firstSemanticPacketMs = performance.now() - startedAt;
                            measure(items);
                        }
                    );
                }
                function measure(firstItems) {
                    var durations = [];
                    var lastItems = firstItems;
                    var run = 0;
                    function next() {
                        if (run >= 6) {
                            var steady = durations.slice(1).sort(function(a, b) { return a - b; });
                            var names = lastItems.map(function(item) {
                                return String(item.caption || item.value || "");
                            });
                            settled = true;
                            clearTimeout(timeout);
                            probe.done = true;
                            probe.semantic = lastItems.some(function(item) {
                                return item.autojs6Lua === true;
                            });
                            probe.hasUpper = names.some(function(name) {
                                return name === "upper" || name.indexOf("upper(") === 0;
                            });
                            probe.hasSub = names.some(function(name) {
                                return name === "sub" || name.indexOf("sub(") === 0;
                            });
                            probe.completionCount = names.length;
                            probe.names = names.slice(0, 64);
                            probe.durationsMs = durations;
                            probe.steadyP50Ms = steady[Math.floor(steady.length / 2)];
                            probe.error = probe.semantic && probe.hasUpper && probe.hasSub ? "" :
                                "Lua semantic string completion is incomplete";
                            return;
                        }
                        var requestStartedAt = performance.now();
                        completer.getCompletions(
                            window.editor,
                            activeSession,
                            position,
                            "",
                            function(error, items) {
                                if (settled) return;
                                if (error) {
                                    settled = true;
                                    clearTimeout(timeout);
                                    probe.done = true;
                                    probe.error = String(error);
                                    return;
                                }
                                durations.push(performance.now() - requestStartedAt);
                                lastItems = items || [];
                                run++;
                                next();
                            }
                        );
                    }
                    next();
                }
                discover();
                return true;
            })()
            """.trimIndent(),
        )
    }

    private fun startFallbackCompletionProbe(
        scenario: ActivityScenario<AceEditorTestActivity>,
        session: AtomicReference<EditorPluginSession>,
    ) {
        evaluateRaw(
            scenario,
            session,
            """
            (function() {
                var activeSession = window.editor.getSession();
                var completer = (window.editor.completers || []).filter(function(candidate) {
                    return candidate.autojs6Lsp === true;
                })[0];
                var probe = window.__autojs6M5FallbackProbe = { done: false, error: "" };
                var startedAt = performance.now();
                if (!completer) {
                    probe.done = true;
                    probe.error = "LSP completion wrapper is unavailable";
                    return true;
                }
                completer.getCompletions(
                    window.editor,
                    activeSession,
                    { row: 0, column: 7 },
                    "",
                    function(error, items) {
                        items = !error && Array.isArray(items) ? items : [];
                        var names = items.map(function(item) {
                            return String(item.caption || item.value || "");
                        });
                        probe.semantic = items.some(function(item) {
                            return item.autojs6Lua === true;
                        });
                        probe.hasFormat = names.indexOf("format") >= 0;
                        probe.hasRep = names.indexOf("rep") >= 0;
                        probe.completionCount = names.length;
                        probe.durationMs = performance.now() - startedAt;
                        probe.error = probe.hasFormat && probe.hasRep ? "" :
                            "Lua P2 string completion is incomplete";
                        probe.done = true;
                    }
                );
                return true;
            })()
            """.trimIndent(),
        )
    }

    private fun awaitJson(
        scenario: ActivityScenario<AceEditorTestActivity>,
        session: AtomicReference<EditorPluginSession>,
        timeoutSeconds: Long,
        probe: () -> JSONObject?,
    ): JSONObject {
        val deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(timeoutSeconds)
        var last = JSONObject()
        while (System.nanoTime() < deadline) {
            probe()?.let { return it }
            Thread.sleep(50)
        }
        runCatching { probe() }.getOrNull()?.let { last = it }
        throw AssertionError("Timed out waiting for JSON probe: $last")
    }

    private fun awaitJsonArray(
        scenario: ActivityScenario<AceEditorTestActivity>,
        session: AtomicReference<EditorPluginSession>,
        timeoutSeconds: Long,
        probe: () -> JSONArray?,
    ): JSONArray {
        val deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(timeoutSeconds)
        var last = JSONArray()
        while (System.nanoTime() < deadline) {
            probe()?.let { return it }
            Thread.sleep(50)
        }
        runCatching { probe() }.getOrNull()?.let { last = it }
        throw AssertionError("Timed out waiting for JSON-array probe: $last")
    }

    private fun JSONArray.anyDiagnostic(predicate: (JSONObject) -> Boolean): Boolean {
        for (index in 0 until length()) {
            val item = optJSONObject(index) ?: continue
            if (predicate(item)) return true
        }
        return false
    }

    private fun awaitString(
        scenario: ActivityScenario<AceEditorTestActivity>,
        session: AtomicReference<EditorPluginSession>,
        timeoutSeconds: Long,
        probe: () -> String?,
    ): String {
        val deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(timeoutSeconds)
        var last = ""
        while (System.nanoTime() < deadline) {
            val value = runCatching(probe).getOrNull()
            if (!value.isNullOrEmpty()) return value
            last = value.orEmpty()
            Thread.sleep(50)
        }
        throw AssertionError("Timed out waiting for string probe: $last")
    }

    private fun evaluateJson(
        scenario: ActivityScenario<AceEditorTestActivity>,
        session: AtomicReference<EditorPluginSession>,
        script: String,
    ): JSONObject {
        val encoded = JSONTokener(evaluateRaw(scenario, session, script)).nextValue()
        return JSONObject(encoded.toString())
    }

    private fun evaluateJsonArray(
        scenario: ActivityScenario<AceEditorTestActivity>,
        session: AtomicReference<EditorPluginSession>,
        script: String,
    ): JSONArray {
        val encoded = JSONTokener(evaluateRaw(scenario, session, script)).nextValue()
        return JSONArray(encoded.toString())
    }

    private fun evaluateString(
        scenario: ActivityScenario<AceEditorTestActivity>,
        session: AtomicReference<EditorPluginSession>,
        script: String,
    ): String {
        val value = JSONTokener(evaluateRaw(scenario, session, script)).nextValue()
        return if (value == JSONObject.NULL) "" else value.toString()
    }

    private fun evaluateRaw(
        scenario: ActivityScenario<AceEditorTestActivity>,
        session: AtomicReference<EditorPluginSession>,
        script: String,
    ): String {
        val evaluated = CountDownLatch(1)
        val result = AtomicReference<String>()
        scenario.onActivity {
            (session.get().view as AceCodeEditor).webView.evaluateJavascript(script) { raw ->
                result.set(raw)
                evaluated.countDown()
            }
        }
        assertTrue("JavaScript probe timed out", evaluated.await(10, TimeUnit.SECONDS))
        return result.get() ?: "null"
    }

    private fun webViewPackageDescription(): String =
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            WebView.getCurrentWebViewPackage()
                ?.let { "${it.packageName}@${it.versionName}" }
                ?: "unknown"
        } else {
            "unknown"
        }

    private companion object {
        const val LOG_TAG = "AutoJs6AceLua"
        const val LOG_PREFIX = "AUTOJS6_ACE_M5_LUA="
        const val MAX_INITIALIZATION_MS = 10_000.0
        const val MAX_COMPLETION_P50_MS = 500.0
        val PAGE_HIDE_SCRIPT =
            """
            (function() {
                var event;
                if (typeof Event === "function") {
                    event = new Event("pagehide");
                } else {
                    event = document.createEvent("Event");
                    event.initEvent("pagehide", false, false);
                }
                window.dispatchEvent(event);
                return true;
            })()
            """.trimIndent()
    }
}
