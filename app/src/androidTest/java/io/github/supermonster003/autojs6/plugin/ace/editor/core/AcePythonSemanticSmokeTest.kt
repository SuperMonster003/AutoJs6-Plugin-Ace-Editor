package io.github.supermonster003.autojs6.plugin.ace.editor.core

import android.os.Build
import android.os.Debug
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
class AcePythonSemanticSmokeTest {

    @Test
    fun bundledPythonWorkerPassesSemanticGateAndReleasesWithEditor() {
        val instrumentation = InstrumentationRegistry.getInstrumentation()
        val context = instrumentation.targetContext
        val arguments = InstrumentationRegistry.getArguments()
        val memoryBaselineOnly = arguments.getString("m4MemoryBaselineOnly")
            ?.toBooleanStrictOrNull()
            ?: false
        val externalMeasurementHoldMs = arguments
            .getString("m4HoldMs")
            ?.toLongOrNull()
            ?.coerceIn(0L, MAX_EXTERNAL_MEASUREMENT_HOLD_MS)
            ?: 0L
        val preferences = context.defaultHostPreferences()
        val hadPythonSemanticPreference = preferences.contains(
            AceEditorLspPreferences.KEY_ACE_SEMANTIC_PYTHON_ENABLED,
        )
        val originalPythonSemanticPreference = preferences.getBoolean(
            AceEditorLspPreferences.KEY_ACE_SEMANTIC_PYTHON_ENABLED,
            AceEditorLspPreferences.DEFAULT_SEMANTIC_LANGUAGES.getValue(
                AceEditorLspPreferences.SEMANTIC_LANGUAGE_PYTHON,
            ),
        )
        assertTrue(
            if (memoryBaselineOnly) {
                "Failed to disable Python semantics for the resident-memory baseline"
            } else {
                "Failed to enable Python semantics for the semantic smoke test"
            },
            preferences.edit()
                .putBoolean(
                    AceEditorLspPreferences.KEY_ACE_SEMANTIC_PYTHON_ENABLED,
                    !memoryBaselineOnly,
                )
                .commit(),
        )
        val processPssBeforeBytes = processPssBytes()
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
                            File(context.cacheDir, "ace-python-semantic-smoke-fonts").absolutePath,
                        documentPath = "/data/local/tmp/autojs6-m4.py",
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
            assertTrue("ACE Python session should become ready", ready.await(15, TimeUnit.SECONDS))
            assertEquals("ace/mode/python", awaitString(scenario, session, 10) {
                evaluateString(
                    scenario,
                    session,
                    "window.AutoJsAce && window.AutoJsAce.getAceMode ? window.AutoJsAce.getAceMode() : ''",
                ).takeIf { it == "ace/mode/python" }
            })

            if (memoryBaselineOnly) {
                evaluateRaw(
                    scenario,
                    session,
                    "window.AutoJsAce.setText(" +
                        "${JSONObject.quote("from pathlib import Path\nPath.")}, false, false); true",
                )
                startFallbackCompletionProbe(scenario, session)
                val completion = awaitJson(scenario, session, 15) {
                    evaluateJson(
                        scenario,
                        session,
                        "JSON.stringify(window.__autojs6M4FallbackProbe || {})",
                    ).takeIf { it.optBoolean("done") }
                }
                assertEquals("Python P2 memory baseline failed: $completion", "", completion.getString("error"))
                val baselineState = evaluateJson(
                    scenario,
                    session,
                    "JSON.stringify(window.AutoJsAce.getLspState() || {})",
                )
                assertEquals("local-index", baselineState.getString("completionProvider"))
                assertEquals(
                    "semantic-provider-disabled-for-language",
                    baselineState.getString("reason"),
                )
                val lifecycle = evaluateJson(
                    scenario,
                    session,
                    "JSON.stringify(window.AutoJsAcePythonProvider.getLifecycleState())",
                )
                assertEquals(0, lifecycle.getInt("activeProviderCount"))
                val hostProcessPssBytes = processPssBytes()
                val readyForMeasurement = JSONObject().apply {
                    put("schema", 1)
                    put("measurement", "m4-python-resident-ready")
                    put("path", "p2-baseline")
                    put("hostPid", android.os.Process.myPid())
                    put("hostProcessPssBytes", hostProcessPssBytes)
                    put("workerUsedJSHeapBytes", 0L)
                    put("holdMs", externalMeasurementHoldMs)
                }
                Log.i(LOG_TAG, "$MEMORY_READY_LOG_PREFIX$readyForMeasurement")
                println("$MEMORY_READY_LOG_PREFIX$readyForMeasurement")
                if (externalMeasurementHoldMs > 0L) {
                    Thread.sleep(externalMeasurementHoldMs)
                }
                assertTrue(
                    "Python P2 memory baseline reported UI errors: $callbackErrors",
                    callbackErrors.isEmpty(),
                )
                val record = JSONObject().apply {
                    put("schema", 2)
                    put("measurement", "m4-python-semantic-gate")
                    put("path", "p2-memory-baseline")
                    put("manufacturer", Build.MANUFACTURER)
                    put("model", Build.MODEL)
                    put("sdk", Build.VERSION.SDK_INT)
                    put("release", Build.VERSION.RELEASE)
                    put("webViewPackage", webViewPackageDescription())
                    put("completionDurationMs", completion.getDouble("durationMs"))
                    put("completionCount", completion.getInt("completionCount"))
                    put("processPssWhileReadyBytes", hostProcessPssBytes)
                    put("callbackErrorCount", callbackErrors.size)
                    put("lifecycle", lifecycle)
                }
                Log.i(LOG_TAG, "$LOG_PREFIX$record")
                println("$LOG_PREFIX$record")
                return
            }

            val source = listOf(
                "from pathlib import Path",
                "",
                "def greet(name: str) -> str:",
                "    return name.upper()",
                "",
                "p = Path(\"a\")",
                "p.",
                "greet(",
                "missing_name",
            ).joinToString("\n")
            evaluateRaw(
                scenario,
                session,
                "window.AutoJsAce.setText(${JSONObject.quote(source)}, false, false); true",
            )

            val runtimeSupported = evaluateString(
                scenario,
                session,
                "String(window.AutoJsAcePythonProvider.isSupported())",
            ) == "true"
            if (!runtimeSupported) {
                val fallbackState = evaluateJson(
                    scenario,
                    session,
                    "JSON.stringify(window.AutoJsAce.getLspState() || {})",
                )
                assertEquals("python", fallbackState.getString("semanticLanguage"))
                assertEquals(
                    "python-pyright-worker",
                    fallbackState.getString("configuredSemanticProviderId"),
                )
                evaluateRaw(
                    scenario,
                    session,
                    "window.AutoJsAce.setText(" +
                        "${JSONObject.quote("from pathlib import Path\nPath.")}, false, false); true",
                )
                startFallbackCompletionProbe(scenario, session)
                val fallback = awaitJson(scenario, session, 15) {
                    evaluateJson(
                        scenario,
                        session,
                        "JSON.stringify(window.__autojs6M4FallbackProbe || {})",
                    ).takeIf { it.optBoolean("done") }
                }
                assertEquals("Python P2 fallback failed: $fallback", "", fallback.getString("error"))
                assertTrue(
                    "Python P2 fallback is missing Path.exists: $fallback",
                    fallback.getBoolean("hasExists"),
                )
                assertTrue(
                    "Python P2 fallback is missing Path.read_text: $fallback",
                    fallback.getBoolean("hasReadText"),
                )
                assertFalse(
                    "Old WebView fallback unexpectedly returned semantic items: $fallback",
                    fallback.getBoolean("hasSemanticItem"),
                )
                val settledFallbackState = evaluateJson(
                    scenario,
                    session,
                    "JSON.stringify(window.AutoJsAce.getLspState() || {})",
                )
                assertEquals(
                    "local-index",
                    settledFallbackState.getString("completionProvider"),
                )
                val lifecycle = evaluateJson(
                    scenario,
                    session,
                    "JSON.stringify(window.AutoJsAcePythonProvider.getLifecycleState())",
                )
                assertEquals(0, lifecycle.getInt("activeProviderCount"))
                assertTrue(
                    "Silent Python fallback reported UI errors: $callbackErrors",
                    callbackErrors.isEmpty(),
                )
                val record = JSONObject().apply {
                    put("schema", 2)
                    put("measurement", "m4-python-semantic-gate")
                    put("path", "p2-fallback")
                    put("manufacturer", Build.MANUFACTURER)
                    put("model", Build.MODEL)
                    put("sdk", Build.VERSION.SDK_INT)
                    put("release", Build.VERSION.RELEASE)
                    put("webViewPackage", webViewPackageDescription())
                    put(
                        "reason",
                        settledFallbackState.optJSONObject("pythonService")?.optString("reason"),
                    )
                    put("completionDurationMs", fallback.getDouble("durationMs"))
                    put("completionCount", fallback.getInt("completionCount"))
                    put("callbackErrorCount", callbackErrors.size)
                    put("lifecycle", lifecycle)
                }
                Log.i(LOG_TAG, "$LOG_PREFIX$record")
                println("$LOG_PREFIX$record")
                return
            }

            val readyState = awaitJson(scenario, session, 12) {
                evaluateJson(
                    scenario,
                    session,
                    "JSON.stringify(window.AutoJsAce.getLspState() || {})",
                ).takeIf { state ->
                    state.optJSONObject("pythonService")?.optBoolean("ready") == true
                }
            }
            assertEquals("python", readyState.getString("semanticLanguage"))
            assertEquals("python-pyright-worker", readyState.getString("configuredSemanticProviderId"))
            assertTrue(readyState.getJSONObject("semanticLanguages").getBoolean("python"))
            assertTrue(
                "Python Worker initialization exceeded 10 seconds: $readyState",
                readyState.getJSONObject("pythonService").getDouble("initializationMs") <
                    MAX_INITIALIZATION_MS,
            )

            startCompletionProbe(scenario, session)
            val completion = awaitJson(scenario, session, 20) {
                evaluateJson(
                    scenario,
                    session,
                    "JSON.stringify(window.__autojs6M4CompletionProbe || {})",
                ).takeIf { it.optBoolean("done") }
            }
            assertEquals("Python semantic completion failed: $completion", "", completion.getString("error"))
            assertTrue("pathlib.Path.exists completion is missing: $completion", completion.getBoolean("hasExists"))
            assertTrue("pathlib.Path.read_text completion is missing: $completion", completion.getBoolean("hasReadText"))
            assertTrue(
                "Python completion P50 exceeded 500 ms: $completion",
                completion.getDouble("steadyP50Ms") < MAX_COMPLETION_P50_MS,
            )

            val diagnostics = awaitJsonArray(scenario, session, 12) {
                evaluateJsonArray(
                    scenario,
                    session,
                    "JSON.stringify(window.AutoJsAce.getLspDiagnostics() || [])",
                ).takeIf { values ->
                    values.anyMessage { it.contains("missing_name") && it.contains("not defined") } &&
                        values.anyMessage {
                            it.contains("expected", ignoreCase = true) ||
                                it.contains("unclosed", ignoreCase = true)
                        }
                }
            }

            evaluateRaw(scenario, session, "window.AutoJsAce.showLspTooltip(2, 10); true")
            val hoverText = awaitString(scenario, session, 10) {
                evaluateString(
                    scenario,
                    session,
                    "(document.querySelector('.autojs6_hover_tooltip_content') || {}).textContent || ''",
                ).takeIf { it.contains("name: str") }
            }
            assertTrue("Parameter hover did not expose name: str: $hoverText", hoverText.contains("name: str"))

            evaluateRaw(scenario, session, "window.AutoJsAce.showSignatureHelp(7, 6); true")
            val signatureState = awaitJson(scenario, session, 10) {
                evaluateJson(
                    scenario,
                    session,
                    "JSON.stringify(window.AutoJsAce.getSignatureHelpState() || {})",
                ).takeIf { it.optString("signature").contains("name: str") }
            }
            assertTrue(signatureState.getString("signature").contains("name: str"))

            evaluateRaw(
                scenario,
                session,
                "window.editor.moveCursorTo(7, 2); window.AutoJsAce.goToDefinition(7, 2); true",
            )
            val definitionCursor = awaitJson(scenario, session, 10) {
                evaluateJson(
                    scenario,
                    session,
                    "JSON.stringify(window.editor.getCursorPosition())",
                ).takeIf { it.optInt("row", -1) == 2 && it.optInt("column", -1) == 4 }
            }
            assertEquals(2, definitionCursor.getInt("row"))
            assertEquals(4, definitionCursor.getInt("column"))

            val semanticState = evaluateJson(
                scenario,
                session,
                "JSON.stringify(window.AutoJsAce.getLspState() || {})",
            )
            val workerMemory = semanticState
                .optJSONObject("pythonService")
                ?.optJSONObject("workerStatus")
                ?.optJSONObject("memory")
            val workerUsedHeapBytes = workerMemory?.optLong("usedJSHeapSize", 0L) ?: 0L
            val processPssWhileReadyBytes = processPssBytes()
            val inProcessResidentEstimateBytes = processPssWhileReadyBytes + workerUsedHeapBytes
            assertTrue(
                "Python semantic in-process resident estimate exceeded 300 MiB: " +
                    "pss=$processPssWhileReadyBytes workerHeap=$workerUsedHeapBytes state=$semanticState",
                inProcessResidentEstimateBytes < MAX_RESIDENT_BYTES,
            )

            if (externalMeasurementHoldMs > 0L) {
                val readyForMeasurement = JSONObject().apply {
                    put("schema", 1)
                    put("measurement", "m4-python-resident-ready")
                    put("path", "semantic")
                    put("hostPid", android.os.Process.myPid())
                    put("hostProcessPssBytes", processPssWhileReadyBytes)
                    put("workerUsedJSHeapBytes", workerUsedHeapBytes)
                    put("holdMs", externalMeasurementHoldMs)
                }
                Log.i(LOG_TAG, "$MEMORY_READY_LOG_PREFIX$readyForMeasurement")
                println("$MEMORY_READY_LOG_PREFIX$readyForMeasurement")
                Thread.sleep(externalMeasurementHoldMs)
            }

            val lifecycleBefore = evaluateJson(
                scenario,
                session,
                "JSON.stringify(window.AutoJsAcePythonProvider.getLifecycleState())",
            )
            assertTrue(lifecycleBefore.getInt("activeProviderCount") >= 1)
            evaluateRaw(
                scenario,
                session,
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
                """.trimIndent(),
            )
            val lifecycleAfter = awaitJson(scenario, session, 10) {
                evaluateJson(
                    scenario,
                    session,
                    "JSON.stringify(window.AutoJsAcePythonProvider.getLifecycleState())",
                ).takeIf {
                    it.optInt("activeProviderCount", -1) == 0 &&
                        it.optInt("workerReleaseCount", 0) >=
                            lifecycleBefore.optInt("workerReleaseCount", 0) + 1
                }
            }
            val processPssAfterReleaseBytes = processPssBytes()
            val record = JSONObject().apply {
                put("schema", 2)
                put("measurement", "m4-python-semantic-gate")
                put("path", "semantic")
                put("manufacturer", Build.MANUFACTURER)
                put("model", Build.MODEL)
                put("sdk", Build.VERSION.SDK_INT)
                put("release", Build.VERSION.RELEASE)
                put("webViewPackage", webViewPackageDescription())
                put("initializationMs", readyState.getJSONObject("pythonService").getDouble("initializationMs"))
                put("firstSemanticPacketMs", completion.getDouble("firstSemanticPacketMs"))
                put("completionDurationsMs", completion.getJSONArray("durationsMs"))
                put("completionSteadyP50Ms", completion.getDouble("steadyP50Ms"))
                put("completionCount", completion.getInt("completionCount"))
                put("diagnosticCount", diagnostics.length())
                put("workerUsedJSHeapBytes", workerUsedHeapBytes)
                put("processPssBeforeBytes", processPssBeforeBytes)
                put("processPssWhileReadyBytes", processPssWhileReadyBytes)
                put(
                    "residentGateScope",
                    "host-process-pss-plus-worker-reported-js-heap",
                )
                put("inProcessResidentEstimateBytes", inProcessResidentEstimateBytes)
                // Retained for consumers of the schema-2 records produced during M4 bring-up.
                put("estimatedResidentBytes", inProcessResidentEstimateBytes)
                put("processPssAfterReleaseBytes", processPssAfterReleaseBytes)
                put("lifecycleBefore", lifecycleBefore)
                put("lifecycleAfter", lifecycleAfter)
                put("callbackErrorCount", callbackErrors.size)
            }
            assertTrue(
                "Python semantic path reported UI errors: $callbackErrors",
                callbackErrors.isEmpty(),
            )
            Log.i(LOG_TAG, "$LOG_PREFIX$record")
            println("$LOG_PREFIX$record")
        } finally {
            scenario.onActivity {
                session.getAndSet(null)?.destroy()
            }
            scenario.close()
            val restored = if (hadPythonSemanticPreference) {
                preferences.edit()
                    .putBoolean(
                        AceEditorLspPreferences.KEY_ACE_SEMANTIC_PYTHON_ENABLED,
                        originalPythonSemanticPreference,
                    )
                    .commit()
            } else {
                preferences.edit()
                    .remove(AceEditorLspPreferences.KEY_ACE_SEMANTIC_PYTHON_ENABLED)
                    .commit()
            }
            assertTrue("Failed to restore the Python semantic preference", restored)
        }
    }

    private fun startCompletionProbe(
        scenario: ActivityScenario<AceEditorTestActivity>,
        session: AtomicReference<EditorPluginSession>,
    ) {
        evaluateRaw(
            scenario,
            session,
            """
            (function() {
                var activeSession = window.editor.getSession();
                var completers = (window.editor.completers || []).slice(0);
                var position = { row: 6, column: 2 };
                var probe = window.__autojs6M4CompletionProbe = {
                    done: false,
                    error: "",
                    completerCount: completers.length
                };
                var discoveryStartedAt = performance.now();
                var settled = false;
                var timeout = setTimeout(function() {
                    if (!settled) {
                        settled = true;
                        probe.done = true;
                        probe.error = "semantic completer timeout";
                    }
                }, 15000);

                function measure(completer, firstItems, firstSemanticPacketMs) {
                    var durations = [];
                    var lastItems = firstItems || [];
                    var run = 0;
                    function next() {
                        if (run >= 8) {
                            var steady = durations.slice(1).sort(function(a, b) { return a - b; });
                            var names = lastItems.map(function(item) {
                                return String(item.caption || item.value || "");
                            });
                            clearTimeout(timeout);
                            settled = true;
                            probe.done = true;
                            probe.firstSemanticPacketMs = firstSemanticPacketMs;
                            probe.durationsMs = durations;
                            probe.steadyP50Ms = steady[Math.floor(steady.length / 2)];
                            probe.completionCount = names.length;
                            probe.hasExists = names.indexOf("exists") >= 0;
                            probe.hasReadText = names.indexOf("read_text") >= 0;
                            return;
                        }
                        var startedAt = performance.now();
                        completer.getCompletions(
                            window.editor,
                            activeSession,
                            position,
                            "",
                            function(error, items) {
                                if (settled) return;
                                if (error) {
                                    clearTimeout(timeout);
                                    settled = true;
                                    probe.done = true;
                                    probe.error = String(error);
                                    return;
                                }
                                durations.push(performance.now() - startedAt);
                                lastItems = items || [];
                                run++;
                                next();
                            }
                        );
                    }
                    next();
                }

                completers.forEach(function(completer) {
                    try {
                        completer.getCompletions(
                            window.editor,
                            activeSession,
                            position,
                            "",
                            function(error, items) {
                                if (settled || error) return;
                                items = items || [];
                                if (items.some(function(item) { return item.autojs6Python === true; })) {
                                    measure(
                                        completer,
                                        items,
                                        performance.now() - discoveryStartedAt
                                    );
                                }
                            }
                        );
                    } catch (ignore) {
                        // Other ACE completers are irrelevant to this semantic probe.
                    }
                });
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
                var completers = (window.editor.completers || []).slice(0);
                var completer = completers.filter(function(candidate) {
                    return candidate.autojs6Lsp === true;
                })[0];
                var position = { row: 1, column: 5 };
                var probe = window.__autojs6M4FallbackProbe = {
                    done: false,
                    error: "",
                    completerCount: completers.length
                };
                var startedAt = performance.now();
                var settled = false;
                var timeout = setTimeout(function() {
                    if (!settled) {
                        settled = true;
                        probe.done = true;
                        probe.error = "P2 fallback completion timeout";
                    }
                }, 10000);

                function finish(items) {
                    if (settled) return;
                    items = items || [];
                    var names = items.map(function(item) {
                        return String(item.caption || item.value || "");
                    });
                    probe.hasExists = names.indexOf("exists") >= 0;
                    probe.hasReadText = names.indexOf("read_text") >= 0;
                    probe.hasSemanticItem = items.some(function(item) {
                        return item.autojs6Python === true;
                    });
                    probe.completionCount = names.length;
                    probe.durationMs = performance.now() - startedAt;
                    probe.error = probe.hasExists && probe.hasReadText ? "" :
                        "P2 Path completion is incomplete";
                    probe.done = true;
                    settled = true;
                    clearTimeout(timeout);
                }

                if (!completer) {
                    probe.error = "LSP completion wrapper is unavailable";
                    probe.done = true;
                    settled = true;
                    clearTimeout(timeout);
                    return true;
                }

                function attempt() {
                    if (settled) return;
                    try {
                        completer.getCompletions(
                            window.editor,
                            activeSession,
                            position,
                            "",
                            function(error, items) {
                                if (settled) return;
                                items = !error && Array.isArray(items) ? items : [];
                                var names = items.map(function(item) {
                                    return String(item.caption || item.value || "");
                                });
                                if (names.indexOf("exists") >= 0 &&
                                    names.indexOf("read_text") >= 0) {
                                    finish(items);
                                } else {
                                    setTimeout(attempt, 50);
                                }
                            }
                        );
                    } catch (error) {
                        setTimeout(attempt, 50);
                    }
                }
                attempt();
                return true;
            })()
            """.trimIndent(),
        )
    }

    private fun webViewPackageDescription(): String =
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            WebView.getCurrentWebViewPackage()
                ?.let { "${it.packageName}@${it.versionName}" }
                ?: "unknown"
        } else {
            "unknown"
        }

    private fun processPssBytes(): Long {
        val memoryInfo = Debug.MemoryInfo()
        Debug.getMemoryInfo(memoryInfo)
        return memoryInfo.totalPss.toLong() * 1024L
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

    private fun awaitString(
        scenario: ActivityScenario<AceEditorTestActivity>,
        session: AtomicReference<EditorPluginSession>,
        timeoutSeconds: Long,
        probe: () -> String?,
    ): String {
        val deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(timeoutSeconds)
        var last = ""
        while (System.nanoTime() < deadline) {
            probe()?.let { return it }
            Thread.sleep(50)
        }
        runCatching { probe() }.getOrNull()?.let { last = it }
        throw AssertionError("Timed out waiting for string probe: $last")
    }

    private fun JSONArray.anyMessage(predicate: (String) -> Boolean): Boolean {
        for (index in 0 until length()) {
            val message = optJSONObject(index)?.optString("message").orEmpty()
            if (predicate(message)) return true
        }
        return false
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
        assertTrue("ACE JavaScript evaluation timed out", evaluated.await(15, TimeUnit.SECONDS))
        return result.get() ?: "null"
    }

    private companion object {
        const val LOG_TAG = "AutoJs6AcePython"
        const val LOG_PREFIX = "AUTOJS6_ACE_M4_PYTHON="
        const val MEMORY_READY_LOG_PREFIX = "AUTOJS6_ACE_M4_MEMORY_READY="
        const val MAX_INITIALIZATION_MS = 10_000.0
        const val MAX_COMPLETION_P50_MS = 500.0
        const val MAX_RESIDENT_BYTES = 300L * 1024L * 1024L
        const val MAX_EXTERNAL_MEASUREMENT_HOLD_MS = 30_000L
    }
}
