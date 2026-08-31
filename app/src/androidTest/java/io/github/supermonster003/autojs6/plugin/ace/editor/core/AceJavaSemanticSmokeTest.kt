package io.github.supermonster003.autojs6.plugin.ace.editor.core

import android.os.Build
import android.util.Log
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
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class AceJavaSemanticSmokeTest {

    @Test
    fun bundledEcjPublishesExactDiagnosticsAndReleasesWithEditor() {
        val instrumentation = InstrumentationRegistry.getInstrumentation()
        val context = instrumentation.targetContext
        val preferences = context.defaultHostPreferences()
        val preferenceKey = AceEditorLspPreferences.KEY_ACE_SEMANTIC_JAVA_ENABLED
        val hadPreference = preferences.contains(preferenceKey)
        val originalPreference = preferences.getBoolean(
            preferenceKey,
            AceEditorLspPreferences.DEFAULT_SEMANTIC_LANGUAGES.getValue(
                AceEditorLspPreferences.SEMANTIC_LANGUAGE_JAVA,
            ),
        )
        assertTrue(
            "Failed to enable Java semantics",
            preferences.edit().putBoolean(preferenceKey, true).commit(),
        )

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
                            File(context.cacheDir, "ace-java-semantic-smoke-fonts").absolutePath,
                        documentPath = "/data/local/tmp/Main.java",
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
            assertTrue("ACE Java session should become ready", ready.await(15, TimeUnit.SECONDS))
            assertEquals(
                "ace/mode/java",
                awaitString(10) {
                    evaluateString(
                        scenario,
                        session,
                        "window.AutoJsAce && window.AutoJsAce.getAceMode ? " +
                            "window.AutoJsAce.getAceMode() : ''",
                    ).takeIf { it == "ace/mode/java" }
                },
            )
            assertEquals(
                "true",
                evaluateString(
                    scenario,
                    session,
                    "String(window.AutoJsAceJavaProvider.isSupported())",
                ),
            )

            setText(scenario, session, SYNTAX_ERROR_SOURCE)
            val syntaxAnnotations = awaitJsonArray(30) {
                evaluateJsonArray(
                    scenario,
                    session,
                    "JSON.stringify(window.editor.getSession().getAnnotations() || [])",
                ).takeIf { annotations ->
                    annotations.anyMessage { it.contains("insert \";\"") }
                }
            }
            val syntax = syntaxAnnotations.firstWithMessage { it.contains("insert \";\"") }
            assertEquals(3, syntax.getInt("row"))
            assertTrue(syntax.getInt("column") >= 8)
            assertEquals("error", syntax.getString("type"))

            val stateAfterSyntax = evaluateJson(
                scenario,
                session,
                "JSON.stringify(window.AutoJsAce.getLspState() || {})",
            )
            val responseCountAfterSyntax = stateAfterSyntax
                .getJSONObject("javaService")
                .getInt("responseCount")
            assertEquals("java", stateAfterSyntax.getString("semanticLanguage"))
            assertEquals("java-ecj", stateAfterSyntax.getString("configuredSemanticProviderId"))
            assertEquals("java-ecj", stateAfterSyntax.getString("diagnosticProvider"))
            assertEquals("local-index", stateAfterSyntax.getString("completionProvider"))
            assertEquals("local-index", stateAfterSyntax.getString("hoverProvider"))

            setText(scenario, session, UNRESOLVED_SYMBOL_SOURCE)
            val unresolvedAnnotations = awaitJsonArray(30) {
                val state = evaluateJson(
                    scenario,
                    session,
                    "JSON.stringify(window.AutoJsAce.getLspState() || {})",
                )
                val responseCount = state.optJSONObject("javaService")
                    ?.optInt("responseCount", 0)
                    ?: 0
                if (responseCount <= responseCountAfterSyntax) {
                    null
                } else {
                    evaluateJsonArray(
                        scenario,
                        session,
                        "JSON.stringify(window.editor.getSession().getAnnotations() || [])",
                    ).takeIf { annotations ->
                        annotations.anyMessage { it.contains("missingValue") }
                    }
                }
            }
            val unresolved = unresolvedAnnotations.firstWithMessage { it.contains("missingValue") }
            assertEquals(3, unresolved.getInt("row"))
            assertTrue(unresolved.getInt("column") >= 15)

            val semanticState = evaluateJson(
                scenario,
                session,
                "JSON.stringify(window.AutoJsAce.getLspState() || {})",
            )
            val javaState = semanticState.getJSONObject("javaService")
            val nativeState = javaState.getJSONObject("nativeRuntime")
            assertTrue(javaState.getBoolean("ready"))
            assertEquals(512 * 1024, nativeState.getInt("maxDocumentLength"))
            assertEquals(250L, nativeState.getLong("minCompileIntervalMs"))
            assertEquals(64L * 1024L * 1024L, nativeState.getLong("maxCompileHeapGrowthBytes"))
            assertTrue(javaState.getDouble("lastRequestDurationMs") >= 0.0)
            assertTrue(nativeState.getLong("completedCount") >= 2L)
            assertTrue(
                "Java semantic path reported UI errors: $callbackErrors",
                callbackErrors.isEmpty(),
            )

            val lifecycleBefore = evaluateJson(
                scenario,
                session,
                "JSON.stringify(window.AutoJsAceJavaProvider.getLifecycleState())",
            )
            assertEquals(1, lifecycleBefore.getInt("activeProviderCount"))
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
            val lifecycleAfter = awaitJson(10) {
                evaluateJson(
                    scenario,
                    session,
                    "JSON.stringify(window.AutoJsAceJavaProvider.getLifecycleState())",
                ).takeIf {
                    it.optInt("activeProviderCount", -1) == 0 &&
                        it.optInt("providerDisposeCount", 0) >=
                            lifecycleBefore.optInt("providerDisposeCount", 0) + 1
                }
            }

            val record = JSONObject().apply {
                put("schema", 1)
                put("measurement", "m6-java-semantic-gate")
                put("manufacturer", Build.MANUFACTURER)
                put("model", Build.MODEL)
                put("sdk", Build.VERSION.SDK_INT)
                put("release", Build.VERSION.RELEASE)
                put("syntaxRow", syntax.getInt("row"))
                put("unresolvedRow", unresolved.getInt("row"))
                put("lastRequestDurationMs", javaState.getDouble("lastRequestDurationMs"))
                put("lastHeapDeltaBytes", javaState.getLong("lastHeapDeltaBytes"))
                put("lastPssDeltaKb", javaState.getLong("lastPssDeltaKb"))
                put("nativeRuntime", nativeState)
                put("lifecycleBefore", lifecycleBefore)
                put("lifecycleAfter", lifecycleAfter)
            }
            Log.i(LOG_TAG, "$LOG_PREFIX$record")
            println("$LOG_PREFIX$record")
        } finally {
            scenario.onActivity {
                session.getAndSet(null)?.destroy()
            }
            scenario.close()
            val restored = if (hadPreference) {
                preferences.edit().putBoolean(preferenceKey, originalPreference).commit()
            } else {
                preferences.edit().remove(preferenceKey).commit()
            }
            assertTrue("Failed to restore the Java semantic preference", restored)
        }
    }

    private fun setText(
        scenario: ActivityScenario<AceEditorTestActivity>,
        session: AtomicReference<EditorPluginSession>,
        source: String,
    ) {
        evaluateRaw(
            scenario,
            session,
            "window.AutoJsAce.setText(${JSONObject.quote(source)}, false, false); true",
        )
    }

    private fun JSONArray.anyMessage(predicate: (String) -> Boolean): Boolean {
        for (index in 0 until length()) {
            if (predicate(optJSONObject(index)?.optString("text").orEmpty())) return true
        }
        return false
    }

    private fun JSONArray.firstWithMessage(predicate: (String) -> Boolean): JSONObject {
        for (index in 0 until length()) {
            val annotation = getJSONObject(index)
            if (predicate(annotation.optString("text"))) return annotation
        }
        throw AssertionError("Expected annotation was not found: $this")
    }

    private fun awaitJson(timeoutSeconds: Long, probe: () -> JSONObject?): JSONObject {
        val deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(timeoutSeconds)
        var last = JSONObject()
        while (System.nanoTime() < deadline) {
            probe()?.let { return it }
            Thread.sleep(50)
        }
        runCatching { probe() }.getOrNull()?.let { last = it }
        throw AssertionError("Timed out waiting for JSON probe: $last")
    }

    private fun awaitJsonArray(timeoutSeconds: Long, probe: () -> JSONArray?): JSONArray {
        val deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(timeoutSeconds)
        var last = JSONArray()
        while (System.nanoTime() < deadline) {
            probe()?.let { return it }
            Thread.sleep(50)
        }
        runCatching { probe() }.getOrNull()?.let { last = it }
        throw AssertionError("Timed out waiting for JSON-array probe: $last")
    }

    private fun awaitString(timeoutSeconds: Long, probe: () -> String?): String {
        val deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(timeoutSeconds)
        var last = ""
        while (System.nanoTime() < deadline) {
            probe()?.let { return it }
            Thread.sleep(50)
        }
        runCatching { probe() }.getOrNull()?.let { last = it }
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
        assertTrue("ACE JavaScript evaluation timed out", evaluated.await(15, TimeUnit.SECONDS))
        return result.get() ?: "null"
    }

    private companion object {
        const val LOG_TAG = "AutoJs6AceJava"
        const val LOG_PREFIX = "AUTOJS6_ACE_M6_JAVA="

        val SYNTAX_ERROR_SOURCE = """
            package sample;
            final class BrokenSyntax {
                int answer() {
                    int value = 41
                    return value + 1;
                }
            }
        """.trimIndent()

        val UNRESOLVED_SYMBOL_SOURCE = """
            package sample;
            final class UnresolvedSymbol {
                int answer() {
                    return missingValue;
                }
            }
        """.trimIndent()
    }
}
