package io.github.supermonster003.autojs6.plugin.ace.editor.core

import android.graphics.Color
import android.os.Build
import android.os.Bundle
import android.os.SystemClock
import android.util.Log
import android.view.ViewTreeObserver
import android.webkit.WebView
import androidx.test.core.app.ActivityScenario
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import io.github.supermonster003.autojs6.plugin.ace.editor.AceEditorPluginEntrypoint
import java.io.File
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicLong
import java.util.concurrent.atomic.AtomicReference
import org.autojs.plugin.editor.api.EditorPluginCallback
import org.autojs.plugin.editor.api.EditorPluginSession
import org.autojs.plugin.editor.api.EditorPluginSessionConfig
import org.autojs.plugin.editor.api.EditorPluginState
import org.autojs.plugin.editor.api.EditorPluginTheme
import org.json.JSONObject
import org.json.JSONTokener
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class AcePerformanceBaselineTest {

    @Test
    fun recordsM0EditorPerformanceBaseline() {
        val instrumentation = InstrumentationRegistry.getInstrumentation()
        val context = instrumentation.targetContext
        val activityLaunchStartedAt = SystemClock.elapsedRealtimeNanos()
        val sessionCreateStartedAt = AtomicLong()
        val firstDrawAt = AtomicLong()
        val readyAt = AtomicLong()
        val firstPaintAt = AtomicLong()
        val deferredStaticIndexReadyAt = AtomicLong()
        val firstDraw = CountDownLatch(1)
        val ready = CountDownLatch(1)
        val firstPaint = CountDownLatch(1)
        val deferredStaticIndexReady = CountDownLatch(1)
        val firstPaintState = AtomicReference<JSONObject>()
        val deferredStaticIndexState = AtomicReference<JSONObject>()
        val session = AtomicReference<EditorPluginSession>()
        val scenario = ActivityScenario.launch(AceEditorTestActivity::class.java)
        try {
            scenario.onActivity { activity ->
                sessionCreateStartedAt.set(SystemClock.elapsedRealtimeNanos())
                val createdSession = AceEditorPluginEntrypoint().createSession(
                    hostContext = activity,
                    pluginContext = context,
                    config = EditorPluginSessionConfig(
                        hostPackageName = context.packageName,
                        hostVersionName = "instrumentation",
                        hostVersionCode = 6000L,
                        storageDirectoryPath =
                            File(context.cacheDir, "ace-performance-baseline-fonts").absolutePath,
                        documentPath = "/data/local/tmp/autojs6-performance-baseline.js",
                    ),
                    callback = object : EditorPluginCallback {
                        override fun onReady(state: EditorPluginState) {
                            readyAt.compareAndSet(0L, SystemClock.elapsedRealtimeNanos())
                            ready.countDown()
                        }

                        override fun onEvent(name: String, payload: Bundle?) {
                            when (name) {
                                "firstPaint" -> {
                                    firstPaintAt.compareAndSet(0L, SystemClock.elapsedRealtimeNanos())
                                    payload?.getString("json")?.let { json ->
                                        firstPaintState.set(JSONObject(json))
                                    }
                                    firstPaint.countDown()
                                }
                                "deferredStaticIndexReady" -> {
                                    deferredStaticIndexReadyAt.compareAndSet(
                                        0L,
                                        SystemClock.elapsedRealtimeNanos(),
                                    )
                                    payload?.getString("json")?.let { json ->
                                        deferredStaticIndexState.set(JSONObject(json))
                                    }
                                    deferredStaticIndexReady.countDown()
                                }
                            }
                        }
                    },
                )
                createdSession.setTheme(
                    EditorPluginTheme(
                        id = "ace/theme/tomorrow_night",
                        aceTheme = "ace/theme/tomorrow_night",
                        isDark = true,
                        backgroundColor = Color.rgb(29, 31, 33),
                        foregroundColor = Color.rgb(197, 200, 198),
                    ),
                )
                createdSession.setLoadingText(true)
                createdSession.setInitialText(
                    "files.exists('/sdcard/Scripts')\nfiles.listDir('/sdcard/Scripts')",
                )
                createdSession.setLoadingText(false)
                session.set(createdSession)
                val editorView = createdSession.view
                val drawListener = object : ViewTreeObserver.OnDrawListener {
                    override fun onDraw() {
                        if (!firstDrawAt.compareAndSet(0L, SystemClock.elapsedRealtimeNanos())) {
                            return
                        }
                        firstDraw.countDown()
                        editorView.post {
                            val observer = editorView.viewTreeObserver
                            if (observer.isAlive) {
                                observer.removeOnDrawListener(this)
                            }
                        }
                    }
                }
                editorView.viewTreeObserver.addOnDrawListener(drawListener)
                activity.setContentView(editorView)
            }

            assertTrue("ACE editor view did not draw", firstDraw.await(15, TimeUnit.SECONDS))
            assertTrue("ACE editor did not become ready", ready.await(15, TimeUnit.SECONDS))
            assertTrue("ACE editor did not publish its first paint", firstPaint.await(15, TimeUnit.SECONDS))
            assertTrue(
                "ACE deferred static index did not become ready",
                deferredStaticIndexReady.await(15, TimeUnit.SECONDS),
            )
            assertEquals(2, firstPaintState.get().getInt("lineCount"))
            assertEquals("ready", deferredStaticIndexState.get().getString("status"))
            assertEquals(
                "ace/mode/javascript",
                awaitMode(scenario, session, "ace/mode/javascript"),
            )
            val completion = evaluateJson(
                scenario,
                session,
                """
                (function() {
                    var activeSession = window.editor.getSession();
                    activeSession.setValue("fi");
                    var items = [];
                    var callbackCalled = false;
                    var startedAt = performance.now();
                    window.AutoJsAceCompleter.getActiveCompleter().getCompletions(
                        window.editor,
                        activeSession,
                        { row: 0, column: 2 },
                        "fi",
                        function(error, results) {
                            callbackCalled = true;
                            items = results || [];
                        }
                    );
                    return JSON.stringify({
                        callbackCalled: callbackCalled,
                        durationMs: performance.now() - startedAt,
                        completionCount: items.length
                    });
                })()
                """.trimIndent(),
            )
            assertTrue("Static completion did not return synchronously", completion.getBoolean("callbackCalled"))
            assertTrue("Static completion baseline returned no candidates", completion.getInt("completionCount") > 0)

            val createStartedAt = sessionCreateStartedAt.get()
            val record = JSONObject().apply {
                put("schema", 1)
                put("measurement", "m0-editor-cold-baseline")
                put("manufacturer", Build.MANUFACTURER)
                put("model", Build.MODEL)
                put("sdk", Build.VERSION.SDK_INT)
                put("release", Build.VERSION.RELEASE)
                put(
                    "webViewPackage",
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        WebView.getCurrentWebViewPackage()
                            ?.let { "${it.packageName}@${it.versionName}" }
                            ?: "unknown"
                    } else {
                        "unknown"
                    },
                )
                put("activityLaunchToFirstDrawMs", millis(firstDrawAt.get() - activityLaunchStartedAt))
                put("activityLaunchToReadyMs", millis(readyAt.get() - activityLaunchStartedAt))
                put("activityLaunchToFirstPaintMs", millis(firstPaintAt.get() - activityLaunchStartedAt))
                put("sessionCreateToFirstDrawMs", millis(firstDrawAt.get() - createStartedAt))
                put("sessionCreateToReadyMs", millis(readyAt.get() - createStartedAt))
                put("sessionCreateToFirstPaintMs", millis(firstPaintAt.get() - createStartedAt))
                put(
                    "firstPaintToDeferredStaticIndexReadyMs",
                    millis(deferredStaticIndexReadyAt.get() - firstPaintAt.get()),
                )
                put("deferredStaticIndex", deferredStaticIndexState.get())
                put("staticCompletionFirstPacketMs", completion.getDouble("durationMs"))
                put("staticCompletionCount", completion.getInt("completionCount"))
            }
            Log.i(LOG_TAG, "$LOG_PREFIX$record")

            scenario.onActivity {
                session.get().setDocumentPath("/data/local/tmp/autojs6-performance-m2.py")
            }
            assertEquals(
                "ace/mode/python",
                awaitMode(scenario, session, "ace/mode/python"),
            )
            evaluateRaw(
                scenario,
                session,
                """
                (function() {
                    var activeSession = window.editor.getSession();
                    var completer = window.AutoJsAceCompleter.getActiveCompleter();
                    activeSession.setValue("import os\nos.");
                    window.__autojs6M2IndexProbe = { done: false };
                    var startedAt = performance.now();
                    completer.getCompletions(
                        window.editor,
                        activeSession,
                        { row: 1, column: 3 },
                        "",
                        function(error, results) {
                            var source = completer.getSourceForLanguage("python");
                            var names = (results || []).map(function(item) {
                                return String(item.caption || item.value || "");
                            });
                            window.__autojs6M2IndexProbe = {
                                done: true,
                                error: error ? String(error) : "",
                                durationMs: performance.now() - startedAt,
                                completionCount: names.length,
                                hasGetcwd: names.indexOf("getcwd") >= 0,
                                serializedIndexUtf16Bytes: source ?
                                    JSON.stringify(source).length * 2 : 0,
                                indexState: completer.getIndexState().python
                            };
                        }
                    );
                    return true;
                })()
                """.trimIndent(),
            )
            val probeDeadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(10)
            var m2Probe = JSONObject()
            while (System.nanoTime() < probeDeadline) {
                m2Probe = evaluateJson(
                    scenario,
                    session,
                    "JSON.stringify(window.__autojs6M2IndexProbe || {})",
                )
                if (m2Probe.optBoolean("done")) break
                Thread.sleep(50)
            }
            assertTrue("Python M2 index load did not complete: $m2Probe", m2Probe.optBoolean("done"))
            assertEquals("Python M2 index load failed: $m2Probe", "", m2Probe.getString("error"))
            assertTrue("Python M2 index returned no getcwd candidate: $m2Probe", m2Probe.getBoolean("hasGetcwd"))
            assertTrue(
                "Python M2 index load exceeded 50ms: $m2Probe",
                m2Probe.getDouble("durationMs") < M2_INDEX_LOAD_BUDGET_MS,
            )
            assertTrue(
                "Python M2 serialized index exceeded 2 MiB: $m2Probe",
                m2Probe.getLong("serializedIndexUtf16Bytes") < M2_INDEX_MEMORY_BUDGET_BYTES,
            )
            val m2Record = JSONObject().apply {
                put("schema", 1)
                put("measurement", "m2-python-lazy-index")
                put("manufacturer", Build.MANUFACTURER)
                put("model", Build.MODEL)
                put("sdk", Build.VERSION.SDK_INT)
                put("release", Build.VERSION.RELEASE)
                put("durationMs", m2Probe.getDouble("durationMs"))
                put("completionCount", m2Probe.getInt("completionCount"))
                put("serializedIndexUtf16Bytes", m2Probe.getLong("serializedIndexUtf16Bytes"))
                put("indexState", m2Probe.getJSONObject("indexState"))
            }
            Log.i(LOG_TAG, "$LOG_PREFIX$m2Record")
        } finally {
            scenario.onActivity {
                session.getAndSet(null)?.destroy()
            }
            scenario.close()
        }
    }

    private fun awaitMode(
        scenario: ActivityScenario<AceEditorTestActivity>,
        session: AtomicReference<EditorPluginSession>,
        expected: String,
    ): String {
        val deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(10)
        var actual = ""
        while (System.nanoTime() < deadline) {
            actual = evaluateString(
                scenario,
                session,
                "window.AutoJsAce && window.AutoJsAce.getAceMode ? window.AutoJsAce.getAceMode() : ''",
            )
            if (actual == expected) return actual
            Thread.sleep(50)
        }
        return actual
    }

    private fun evaluateJson(
        scenario: ActivityScenario<AceEditorTestActivity>,
        session: AtomicReference<EditorPluginSession>,
        script: String,
    ): JSONObject {
        val encoded = JSONTokener(evaluateRaw(scenario, session, script)).nextValue()
        return JSONObject(encoded.toString())
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
        assertTrue("ACE JavaScript evaluation timed out", evaluated.await(10, TimeUnit.SECONDS))
        return result.get() ?: "null"
    }

    private fun millis(nanos: Long): Double = nanos.toDouble() / NANOS_PER_MILLISECOND

    private companion object {
        const val LOG_TAG = "AutoJs6AcePerf"
        const val LOG_PREFIX = "AUTOJS6_ACE_PERFORMANCE_BASELINE="
        const val NANOS_PER_MILLISECOND = 1_000_000.0
        const val M2_INDEX_LOAD_BUDGET_MS = 50.0
        const val M2_INDEX_MEMORY_BUDGET_BYTES = 2L * 1024L * 1024L
    }
}
