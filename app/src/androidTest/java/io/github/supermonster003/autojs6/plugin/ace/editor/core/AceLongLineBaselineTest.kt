package io.github.supermonster003.autojs6.plugin.ace.editor.core

import android.os.Build
import android.os.SystemClock
import android.util.Log
import android.webkit.WebView
import androidx.test.core.app.ActivityScenario
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import io.github.supermonster003.autojs6.plugin.ace.editor.AceEditorPluginEntrypoint
import java.io.File
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.atomic.AtomicLong
import java.util.concurrent.atomic.AtomicReference
import org.autojs.plugin.editor.api.EditorPluginBooleanCallback
import org.autojs.plugin.editor.api.EditorPluginCallback
import org.autojs.plugin.editor.api.EditorPluginSession
import org.autojs.plugin.editor.api.EditorPluginSessionConfig
import org.autojs.plugin.editor.api.EditorPluginState
import org.json.JSONObject
import org.json.JSONTokener
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith

/**
 * Records how the editor handles a single 500,000 character line (Roadmap-Ace-1.44.0.md G-A6-4).
 * Kept apart from [AcePerformanceBaselineTest] so the cold start script keeps its sample scope.
 */
@RunWith(AndroidJUnit4::class)
class AceLongLineBaselineTest {

    @Test
    fun recordsLongLineDocumentBaseline() {
        val instrumentation = InstrumentationRegistry.getInstrumentation()
        val context = instrumentation.targetContext
        val ready = CountDownLatch(1)
        val session = AtomicReference<EditorPluginSession>()
        val scenario = ActivityScenario.launch(AceEditorTestActivity::class.java)
        try {
            scenario.onActivity { activity ->
                val createdSession = AceEditorPluginEntrypoint().createSession(
                    hostContext = activity,
                    pluginContext = context,
                    config = EditorPluginSessionConfig(
                        hostPackageName = context.packageName,
                        hostVersionName = "instrumentation",
                        hostVersionCode = 6000L,
                        storageDirectoryPath =
                            File(context.cacheDir, "ace-long-line-baseline-fonts").absolutePath,
                        documentPath = "/data/local/tmp/autojs6-long-line-baseline.js",
                    ),
                    callback = object : EditorPluginCallback {
                        override fun onReady(state: EditorPluginState) {
                            ready.countDown()
                        }
                    },
                )
                session.set(createdSession)
                activity.setContentView(createdSession.view)
            }
            assertTrue("ACE editor did not become ready", ready.await(15, TimeUnit.SECONDS))

            val initialText = longLine('a')
            val loadStartedAt = SystemClock.elapsedRealtimeNanos()
            scenario.onActivity { session.get().setInitialText(initialText) }
            val loaded = awaitJson(scenario, session, LOAD_TIMEOUT_SECONDS) { state ->
                state.optInt("firstLineLength") == LINE_LENGTH
            }
            val loadMs = millis(SystemClock.elapsedRealtimeNanos() - loadStartedAt)
            assertEquals("Long line document should have one row: $loaded", 1, loaded.getInt("rows"))

            val render = evaluateJson(
                scenario,
                session,
                """
                (function() {
                    var editor = window.editor;
                    var renderer = editor.renderer;
                    var startedAt = performance.now();
                    editor.resize(true);
                    var fullRenderMs = performance.now() - startedAt;
                    var targets = [0, 20000, 200000, renderer.layerConfig.width];
                    var scrollRenderMs = [];
                    targets.forEach(function(x) {
                        renderer.scrollToX(x);
                        var scrollStartedAt = performance.now();
                        editor.resize(true);
                        scrollRenderMs.push(performance.now() - scrollStartedAt);
                    });
                    renderer.scrollToX(0);
                    editor.resize(true);
                    var line = renderer.${'$'}textLayer.element.querySelector(".ace_line");
                    return JSON.stringify({
                        fullRenderMs: fullRenderMs,
                        scrollRenderMs: scrollRenderMs,
                        maxScrollRenderMs: Math.max.apply(Math, scrollRenderMs),
                        renderedLineChars: line ? line.textContent.length : -1,
                        contentWidth: renderer.layerConfig.width,
                        safetyMode: !!editor.getSession().${'$'}autojs6LongLineSafetyMode,
                        mode: editor.getSession().getMode().${'$'}id,
                        aceVersion: String(window.ace && window.ace.version || "")
                    });
                })()
                """.trimIndent(),
            )

            val replacementText = longLine('b')
            val replacementDone = CountDownLatch(1)
            val replacementSucceeded = AtomicBoolean(false)
            val replacementFinishedAt = AtomicLong()
            val replacementStartedAt = SystemClock.elapsedRealtimeNanos()
            scenario.onActivity {
                session.get().replaceAllTextUndoably(
                    replacementText,
                    "a0-long-line-baseline",
                    EditorPluginBooleanCallback { succeeded ->
                        replacementFinishedAt.set(SystemClock.elapsedRealtimeNanos())
                        replacementSucceeded.set(succeeded)
                        replacementDone.countDown()
                    },
                )
            }
            assertTrue(
                "Long line replacement did not complete",
                replacementDone.await(LOAD_TIMEOUT_SECONDS, TimeUnit.SECONDS),
            )
            assertTrue("Long line replacement failed", replacementSucceeded.get())
            val replaced = awaitJson(scenario, session, LOAD_TIMEOUT_SECONDS) { state ->
                state.optString("firstChar") == "b"
            }

            val record = JSONObject().apply {
                put("schema", 1)
                put("measurement", "a0-long-line-baseline")
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
                put("lineLength", LINE_LENGTH)
                put("initialLoadMs", loadMs)
                put("render", render)
                put("replacementCallbackMs", millis(replacementFinishedAt.get() - replacementStartedAt))
                put("replacementVisibleMs", millis(SystemClock.elapsedRealtimeNanos() - replacementStartedAt))
                put("replacedRows", replaced.getInt("rows"))
            }
            Log.i(LOG_TAG, "$LOG_PREFIX$record")
        } finally {
            scenario.onActivity {
                session.getAndSet(null)?.destroy()
            }
            scenario.close()
        }
    }

    // A JavaScript-like single line: tokens and punctuation so the tokenizer has real work to do.
    private fun longLine(marker: Char): String {
        val builder = StringBuilder(LINE_LENGTH)
        builder.append(marker)
        var index = 0
        while (builder.length < LINE_LENGTH) {
            builder.append(" + value").append(index % 1000).append("(\"s\", ").append(index % 7).append(')')
            index++
        }
        builder.setLength(LINE_LENGTH)
        return builder.toString()
    }

    private fun awaitJson(
        scenario: ActivityScenario<AceEditorTestActivity>,
        session: AtomicReference<EditorPluginSession>,
        timeoutSeconds: Long,
        predicate: (JSONObject) -> Boolean,
    ): JSONObject {
        val deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(timeoutSeconds)
        var state = JSONObject()
        while (System.nanoTime() < deadline) {
            state = evaluateJson(
                scenario,
                session,
                """
                (function() {
                    var activeSession = window.editor && window.editor.getSession();
                    if (!activeSession) return JSON.stringify({});
                    var first = activeSession.getLine(0);
                    return JSON.stringify({
                        rows: activeSession.getLength(),
                        firstLineLength: first.length,
                        firstChar: first.charAt(0)
                    });
                })()
                """.trimIndent(),
            )
            if (predicate(state)) return state
            Thread.sleep(POLL_INTERVAL_MS)
        }
        throw AssertionError("Timed out waiting for the long line document: $state")
    }

    private fun evaluateJson(
        scenario: ActivityScenario<AceEditorTestActivity>,
        session: AtomicReference<EditorPluginSession>,
        script: String,
    ): JSONObject {
        val evaluated = CountDownLatch(1)
        val result = AtomicReference<String>()
        scenario.onActivity {
            (session.get().view as AceCodeEditor).webView.evaluateJavascript(script) { raw ->
                result.set(raw)
                evaluated.countDown()
            }
        }
        assertTrue("ACE JavaScript evaluation timed out", evaluated.await(30, TimeUnit.SECONDS))
        val decoded = JSONTokener(result.get() ?: "null").nextValue()
        return JSONObject(decoded.toString())
    }

    private fun millis(nanos: Long): Double = nanos.toDouble() / NANOS_PER_MILLISECOND

    private companion object {
        const val LOG_TAG = "AutoJs6AcePerf"
        const val LOG_PREFIX = "AUTOJS6_ACE_PERFORMANCE_BASELINE="
        const val LINE_LENGTH = 500_000
        const val LOAD_TIMEOUT_SECONDS = 60L
        const val POLL_INTERVAL_MS = 50L
        const val NANOS_PER_MILLISECOND = 1_000_000.0
    }
}
