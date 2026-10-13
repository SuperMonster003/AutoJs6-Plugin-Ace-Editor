package io.github.supermonster003.autojs6.plugin.ace.editor.core

import android.os.Build
import android.os.SystemClock
import android.util.Log
import android.view.InputDevice
import android.view.MotionEvent
import android.view.inputmethod.InputMethodManager
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
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith

/**
 * Drives the editor with injected touch events (Roadmap-Ace-1.44.0.md appendix B, A0-6 and G-A2).
 *
 * Every scenario logs one structured record (tag AutoJs6AceTouch) with the JavaScript selection, scroll offsets and
 * ActionMode calls plus the host side soft input and selection toolbar state. The assertions encode the touch behavior
 * of the Ace 1.4.12 Auto.js build; they are checked after all scenarios ran so one failure does not hide the others.
 */
@RunWith(AndroidJUnit4::class)
class AceTouchInteractionDeviceTest {

    private val instrumentation = InstrumentationRegistry.getInstrumentation()
    private val failures = mutableListOf<String>()

    @Test
    fun touchInteractionsMatchTheRecordedBehavior() {
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
                            File(context.cacheDir, "ace-touch-interaction-fonts").absolutePath,
                        documentPath = "/data/local/tmp/autojs6-touch-interaction.js",
                    ),
                    callback = object : EditorPluginCallback {
                        override fun onReady(state: EditorPluginState) {
                            ready.countDown()
                        }
                    },
                )
                session.set(createdSession)
                createdSession.setInitialText(DOCUMENT)
                activity.setContentView(createdSession.view)
            }
            assertTrue("ACE editor did not become ready", ready.await(15, TimeUnit.SECONDS))
            val probe = Probe(scenario, session)
            probe.awaitDocument()
            probe.install()
            assertTrue("The editor should show at least $MIN_VISIBLE_ROWS rows", probe.visibleRowsNow() >= MIN_VISIBLE_ROWS)

            runScenario(probe, "B1 quick tap") { p ->
                val target = p.point(2, 10)
                tap(target, holdMs = 40)
                settle()
                val state = p.state()
                expect(p, state.cursorIs(2, 10) && state.empty, "cursor should move to 2:10")
                expect(p, p.softInputRequestedSinceStart(), "soft input should be requested")
            }
            runScenario(probe, "slow tap") { p ->
                p.setSelection(1, 3, 1, 3)
                val target = p.point(3, 12)
                tap(target, holdMs = 250)
                settle()
                expect(p, p.state().cursorIs(1, 3), "a tap held for 250 ms should not move the cursor")
            }
            runScenario(probe, "B3 double tap") { p ->
                val target = p.point(4, 14)
                tap(target, holdMs = 40)
                SystemClock.sleep(120)
                tap(target, holdMs = 40)
                settle()
                val state = p.state()
                expect(p, !state.empty && WORD.matches(state.selectedText), "double tap should select a word, got '${state.selectedText}'")
            }
            runScenario(probe, "B4 long press") { p ->
                val target = p.point(5, 14)
                tap(target, holdMs = 800)
                settle()
                val state = p.state()
                expect(p, !state.empty && WORD.matches(state.selectedText), "long press should select a word, got '${state.selectedText}'")
                expect(p, state.traceContains("startActionMode"), "long press should start the action mode")
                expect(p, p.selectionToolbarActive(), "selection toolbar should be shown")
            }
            runScenario(probe, "B5 long press inside selection") { p ->
                p.setSelection(6, 6, 6, 20)
                val target = p.point(6, 12)
                tap(target, holdMs = 800)
                settle()
                val state = p.state()
                expect(p, state.anchorIs(6, 6) && state.cursorIs(6, 20), "selection should be kept")
                expect(p, state.traceContains("startActionMode"), "long press should start the action mode")
                expect(p, p.selectionToolbarActive(), "selection toolbar should be shown")
            }
            runScenario(probe, "B6 drag the cursor handle") { p ->
                p.setSelection(7, 20, 7, 20)
                val start = p.point(7, 20, dyLines = 0.75, center = false)
                val end = p.point(9, 30, dyLines = 0.75, center = false)
                drag(start, end, steps = 12, stepMs = 16, holdBeforeMoveMs = 50)
                settle()
                val state = p.state()
                expect(p, state.cursor.first == 9 && kotlin.math.abs(state.cursor.second - 30) <= 1, "cursor should follow the finger to 9:30, got ${state.cursor}")
            }
            runScenario(probe, "B7 drag the anchor handle") { p ->
                p.setSelection(8, 5, 8, 25)
                val start = p.point(8, 5, dyLines = 0.75, center = false)
                // Moves within about 1.3 lines of the start are ignored by the 1.4.12 handler, so drag further.
                val end = p.point(10, 2, dyLines = 0.75, center = false)
                drag(start, end, steps = 10, stepMs = 16, holdBeforeMoveMs = 50)
                settle()
                val state = p.state()
                expect(p, state.anchor.first == 10 && kotlin.math.abs(state.anchor.second - 2) <= 1 && state.cursorIs(8, 25), "anchor should follow the finger to 10:2, got ${state.anchor}")
            }
            runScenario(probe, "B8 slow scroll") { p ->
                p.scrollTo(0)
                val start = p.point(p.lowerRow(), 20)
                val end = Point(start.x, start.y - p.swipeRows() * p.lineHeightPx())
                drag(start, end, steps = 30, stepMs = 20, holdBeforeMoveMs = 0, holdBeforeUpMs = 200)
                SystemClock.sleep(100)
                val released = p.state().scrollTop
                SystemClock.sleep(900)
                val later = p.state().scrollTop
                p.note("scrollTopAfterRelease", released)
                p.note("scrollTopLater", later)
                expect(p, released > 0, "content should scroll with the finger")
                expect(p, kotlin.math.abs(later - released) < 1.0, "a slow scroll should not fling ($released -> $later)")
            }
            runScenario(probe, "B9 fling") { p ->
                p.scrollTo(0)
                val start = p.point(p.lowerRow(), 20)
                val end = Point(start.x, start.y - p.swipeRows() * p.lineHeightPx())
                drag(start, end, steps = 6, stepMs = 8)
                SystemClock.sleep(60)
                val released = p.state().scrollTop
                SystemClock.sleep(1500)
                val later = p.state().scrollTop
                p.note("scrollTopAfterRelease", released)
                p.note("scrollTopLater", later)
                expect(p, later > released + p.lineHeightCss(), "a fast swipe should keep scrolling ($released -> $later)")
            }
            runScenario(probe, "B10 touch stops a fling") { p ->
                p.scrollTo(0)
                val start = p.point(p.lowerRow(), 20)
                val end = Point(start.x, start.y - p.swipeRows() * p.lineHeightPx())
                drag(start, end, steps = 6, stepMs = 8)
                SystemClock.sleep(120)
                tap(start, holdMs = 150)
                SystemClock.sleep(50)
                val stopped = p.state().scrollTop
                SystemClock.sleep(800)
                val later = p.state().scrollTop
                p.note("scrollTopAfterTouch", stopped)
                p.note("scrollTopLater", later)
                expect(p, kotlin.math.abs(later - stopped) < 1.0, "touching should stop the fling ($stopped -> $later)")
            }
            runScenario(probe, "B2 gutter tap") { p ->
                // Recorded only: the 1.4.12 handler skips gutter touches on touchstart but still runs touchend with
                // the mode of the previous gesture, and the gutter mouse events go to the bridge.
                p.setSelection(1, 1, 1, 1)
                tap(p.gutterPoint(3), holdMs = 40)
                settle()
            }
            runScenario(probe, "B15 tap clears the selection") { p ->
                p.setSelection(6, 6, 6, 20)
                tap(p.point(6, 12), holdMs = 800)
                settle()
                val withToolbar = p.selectionToolbarActive()
                tap(p.point(9, 4), holdMs = 40)
                settle()
                val state = p.state()
                p.note("toolbarBeforeTap", withToolbar)
                expect(p, state.empty, "tapping elsewhere should clear the selection")
                expect(p, !p.selectionToolbarActive(), "selection toolbar should be dismissed")
            }
            // Last: the pinch changes the font size, which is restored afterwards.
            val initialTextSize = probe.textSizeSp()
            runScenario(probe, "B12 pinch") { p ->
                pinch(p.point(p.lowerRow() / 2, 20), p.lineHeightPx() * 2, p.lineHeightPx() * 6)
                settle()
                p.note("textSizeSpBefore", initialTextSize)
                p.note("textSizeSpAfter", p.textSizeSp())
                expect(p, p.textSizeSp() > initialTextSize, "spreading two fingers should enlarge the text")
            }
            probe.setTextSizeSp(initialTextSize)
        } finally {
            scenario.onActivity {
                session.getAndSet(null)?.destroy()
            }
            scenario.close()
        }
        assertTrue("Touch interaction expectations failed:\n${failures.joinToString("\n")}", failures.isEmpty())
    }

    private fun runScenario(probe: Probe, name: String, block: (Probe) -> Unit) {
        probe.begin(name)
        try {
            block(probe)
        } catch (error: Throwable) {
            probe.note("error", error.toString())
            failures += "$name: ${error.message}"
        } finally {
            probe.finish()
            probe.reset()
        }
    }

    private fun expect(probe: Probe, condition: Boolean, message: String) {
        probe.expectation(message, condition)
        if (!condition) failures += "${probe.currentName}: $message"
    }

    private fun settle() = SystemClock.sleep(SETTLE_MS)

    private fun tap(point: Point, holdMs: Long) {
        val downTime = SystemClock.uptimeMillis()
        inject(downTime, downTime, MotionEvent.ACTION_DOWN, point)
        SystemClock.sleep(holdMs)
        inject(downTime, SystemClock.uptimeMillis(), MotionEvent.ACTION_UP, point)
    }

    private fun drag(
        start: Point,
        end: Point,
        steps: Int,
        stepMs: Long,
        holdBeforeMoveMs: Long = 0,
        holdBeforeUpMs: Long = 0,
    ) {
        val downTime = SystemClock.uptimeMillis()
        inject(downTime, downTime, MotionEvent.ACTION_DOWN, start)
        if (holdBeforeMoveMs > 0) SystemClock.sleep(holdBeforeMoveMs)
        for (step in 1..steps) {
            SystemClock.sleep(stepMs)
            val fraction = step.toFloat() / steps
            val point = Point(start.x + (end.x - start.x) * fraction, start.y + (end.y - start.y) * fraction)
            inject(downTime, SystemClock.uptimeMillis(), MotionEvent.ACTION_MOVE, point)
        }
        if (holdBeforeUpMs > 0) SystemClock.sleep(holdBeforeUpMs)
        inject(downTime, SystemClock.uptimeMillis(), MotionEvent.ACTION_UP, end)
    }

    private fun pinch(center: Point, startSpread: Float, endSpread: Float) {
        val properties = Array(2) { index ->
            MotionEvent.PointerProperties().apply {
                id = index
                toolType = MotionEvent.TOOL_TYPE_FINGER
            }
        }
        fun coords(spread: Float) = Array(2) { index ->
            MotionEvent.PointerCoords().apply {
                x = center.x + if (index == 0) -spread / 2 else spread / 2
                y = center.y
                pressure = 1f
                size = 1f
            }
        }
        val downTime = SystemClock.uptimeMillis()
        fun send(action: Int, pointerCount: Int, spread: Float) {
            val event = MotionEvent.obtain(
                downTime, SystemClock.uptimeMillis(), action, pointerCount, properties, coords(spread),
                0, 0, 1f, 1f, 0, 0, InputDevice.SOURCE_TOUCHSCREEN, 0,
            )
            instrumentation.uiAutomation.injectInputEvent(event, true)
            event.recycle()
        }
        send(MotionEvent.ACTION_DOWN, 1, startSpread)
        SystemClock.sleep(20)
        send(MotionEvent.ACTION_POINTER_DOWN or (1 shl MotionEvent.ACTION_POINTER_INDEX_SHIFT), 2, startSpread)
        for (step in 1..15) {
            SystemClock.sleep(16)
            send(MotionEvent.ACTION_MOVE, 2, startSpread + (endSpread - startSpread) * step / 15f)
        }
        SystemClock.sleep(30)
        send(MotionEvent.ACTION_POINTER_UP or (1 shl MotionEvent.ACTION_POINTER_INDEX_SHIFT), 2, endSpread)
        SystemClock.sleep(20)
        send(MotionEvent.ACTION_UP, 1, endSpread)
    }

    private fun inject(downTime: Long, eventTime: Long, action: Int, point: Point) {
        val event = MotionEvent.obtain(downTime, eventTime, action, point.x, point.y, 0)
        event.source = InputDevice.SOURCE_TOUCHSCREEN
        assertTrue("Touch injection failed", instrumentation.uiAutomation.injectInputEvent(event, true))
        event.recycle()
    }

    data class Point(val x: Float, val y: Float)

    data class EditorState(val json: JSONObject) {
        val cursor = json.getJSONObject("cursor").let { it.getInt("row") to it.getInt("column") }
        val anchor = json.getJSONObject("anchor").let { it.getInt("row") to it.getInt("column") }
        val empty = json.getBoolean("empty")
        val selectedText: String = json.getString("text")
        val scrollTop = json.getDouble("scrollTop")
        fun cursorIs(row: Int, column: Int) = cursor == row to column
        fun anchorIs(row: Int, column: Int) = anchor == row to column
        fun traceContains(name: String): Boolean {
            val trace = json.getJSONArray("trace")
            for (index in 0 until trace.length()) {
                if (trace.getJSONObject(index).getString("name") == name) return true
            }
            return false
        }
    }

    private inner class Probe(
        private val scenario: ActivityScenario<AceEditorTestActivity>,
        private val session: AtomicReference<EditorPluginSession>,
    ) {
        var currentName = ""
            private set
        private var startedAt = 0L
        private var record = JSONObject()
        private var expectations = JSONArray()
        private var baselineHeight = 0

        fun awaitDocument() {
            val deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(15)
            while (System.nanoTime() < deadline) {
                val rows = evaluate("window.editor && window.editor.getSession() ? window.editor.getSession().getLength() : 0")
                if (rows == LINE_COUNT.toString()) {
                    SystemClock.sleep(RESET_MS)
                    baselineHeight = webViewHeight()
                    return
                }
                SystemClock.sleep(50)
            }
            throw AssertionError("The touch interaction document was not loaded")
        }

        fun install() {
            evaluate(
                """
                (function() {
                    var editor = window.editor;
                    var trace = [];
                    window.__autojs6TouchProbeDocument = editor.getSession().getValue();
                    ["startActionMode", "startActionModeIfSelectionInView", "finishActionMode"].forEach(function(name) {
                        var original = editor[name];
                        if (typeof original !== "function") return;
                        editor[name] = function() {
                            trace.push({ name: name, args: Array.prototype.slice.call(arguments), t: Math.round(performance.now()) });
                            return original.apply(this, arguments);
                        };
                    });
                    window.__autojs6TouchProbe = {
                        trace: trace,
                        point: function(row, column, dyLines, center) {
                            var renderer = editor.renderer;
                            var position = renderer.textToScreenCoordinates(row, column);
                            var lineHeight = renderer.lineHeight;
                            var x = position.pageX + (center ? renderer.characterWidth * 0.1 : 0);
                            var y = position.pageY + lineHeight * (center ? 0.5 : dyLines);
                            return JSON.stringify({ x: x, y: y, lineHeight: lineHeight, dpr: window.devicePixelRatio });
                        },
                        gutterPoint: function(row) {
                            var renderer = editor.renderer;
                            var gutter = renderer.${'$'}gutter.getBoundingClientRect();
                            var position = renderer.textToScreenCoordinates(row, 0);
                            return JSON.stringify({ x: gutter.left + gutter.width / 2, y: position.pageY + renderer.lineHeight / 2, lineHeight: renderer.lineHeight, dpr: window.devicePixelRatio });
                        },
                        state: function() {
                            var selection = editor.selection;
                            var range = selection.getRange();
                            return JSON.stringify({
                                cursor: selection.getCursor(),
                                anchor: selection.getSelectionAnchor(),
                                empty: selection.isEmpty(),
                                text: editor.getSession().getTextRange(range).slice(0, 120),
                                documentIntact: editor.getSession().getValue() === window.__autojs6TouchProbeDocument,
                                scrollTop: editor.renderer.getScrollTop(),
                                scrollLeft: editor.renderer.getScrollLeft(),
                                fontSize: editor.getFontSize(),
                                trace: trace.slice()
                            });
                        },
                        select: function(anchorRow, anchorColumn, cursorRow, cursorColumn) {
                            editor.selection.moveTo(anchorRow, anchorColumn);
                            if (anchorRow !== cursorRow || anchorColumn !== cursorColumn) editor.selection.selectTo(cursorRow, cursorColumn);
                            editor.renderer.scrollCursorIntoView();
                            return true;
                        },
                        visibleRows: function() {
                            var renderer = editor.renderer;
                            return Math.floor(renderer.${'$'}size.scrollerHeight / renderer.lineHeight);
                        },
                        restoreDocument: function() {
                            if (editor.getSession().getValue() === window.__autojs6TouchProbeDocument) return false;
                            editor.getSession().setValue(window.__autojs6TouchProbeDocument);
                            return true;
                        },
                        scrollTo: function(top) {
                            editor.renderer.scrollToY(top);
                            editor.resize(true);
                            return true;
                        }
                    };
                    return true;
                })()
                """.trimIndent(),
            )
        }

        fun begin(name: String) {
            currentName = name
            startedAt = SystemClock.uptimeMillis()
            record = JSONObject().put("scenario", name)
            expectations = JSONArray()
            evaluate("window.__autojs6TouchProbe.trace.length = 0, true")
            startedAt = SystemClock.uptimeMillis()
        }

        fun finish() {
            record.put("state", state().json)
            record.put("softInputRequested", softInputRequestedSinceStart())
            record.put("selectionToolbarActive", selectionToolbarActive())
            record.put("hostEvents", hostEventsSinceStart())
            record.put("visibleRows", visibleRows())
            record.put("expectations", expectations)
            record.put("device", "${Build.MANUFACTURER} ${Build.MODEL}")
            record.put("sdk", Build.VERSION.SDK_INT)
            record.put(
                "webViewPackage",
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    WebView.getCurrentWebViewPackage()?.let { "${it.packageName}@${it.versionName}" } ?: "unknown"
                } else {
                    "unknown"
                },
            )
            record.put("aceVersion", evaluateString("String(window.ace && window.ace.version || '')"))
            Log.i(LOG_TAG, "$LOG_PREFIX$record")
        }

        fun reset() {
            scenario.onActivity { activity ->
                val editor = session.get().view as AceCodeEditor
                editor.finishActionMode()
                editor.hideSoftInput()
                activity.getSystemService(InputMethodManager::class.java)
                    .hideSoftInputFromWindow(editor.webView.windowToken, 0)
            }
            val deadline = SystemClock.uptimeMillis() + IME_HIDE_TIMEOUT_MS
            while (webViewHeight() < baselineHeight && SystemClock.uptimeMillis() < deadline) {
                SystemClock.sleep(50)
            }
            if (webViewHeight() < baselineHeight) {
                failures += "$currentName: the soft keyboard did not hide (height ${webViewHeight()} < $baselineHeight)"
            }
            if (evaluate("window.__autojs6TouchProbe.restoreDocument()") == "true") {
                failures += "$currentName: the document was modified and had to be restored"
            }
            evaluate("window.editor.finishActionMode && window.editor.finishActionMode(), window.__autojs6TouchProbe.select(0, 0, 0, 0), window.__autojs6TouchProbe.scrollTo(0)")
            SystemClock.sleep(RESET_MS)
        }

        fun textSizeSp(): Float {
            val size = AtomicReference(0f)
            scenario.onActivity { size.set(session.get().getTextSizeSp()) }
            return size.get()
        }

        fun setTextSizeSp(size: Float) {
            scenario.onActivity { session.get().setTextSizeSp(size) }
            SystemClock.sleep(RESET_MS)
        }

        fun lowerRow(): Int = (visibleRows() * 3 / 4).coerceAtMost(LINE_COUNT - 1)

        fun swipeRows(): Int = (visibleRows() / 2).coerceAtLeast(2)

        fun visibleRowsNow(): Int = visibleRows()

        private fun visibleRows(): Int = evaluate("window.__autojs6TouchProbe.visibleRows()").toInt()

        private fun webViewHeight(): Int {
            val height = AtomicReference(0)
            scenario.onActivity {
                height.set((session.get().view as AceCodeEditor).webView.height)
            }
            return height.get()
        }

        fun note(key: String, value: Any) {
            record.put(key, value)
        }

        fun expectation(message: String, passed: Boolean) {
            expectations.put(JSONObject().put("expectation", message).put("passed", passed))
        }

        fun setSelection(anchorRow: Int, anchorColumn: Int, cursorRow: Int, cursorColumn: Int) {
            evaluate("window.__autojs6TouchProbe.select($anchorRow, $anchorColumn, $cursorRow, $cursorColumn)")
            SystemClock.sleep(300)
            evaluate("window.__autojs6TouchProbe.trace.length = 0, true")
        }

        fun scrollTo(top: Int) {
            evaluate("window.__autojs6TouchProbe.scrollTo($top)")
            SystemClock.sleep(200)
        }

        fun point(row: Int, column: Int, dyLines: Double = 0.5, center: Boolean = true): Point =
            toScreen(JSONObject(evaluateString("window.__autojs6TouchProbe.point($row, $column, $dyLines, $center)")))

        fun gutterPoint(row: Int): Point =
            toScreen(JSONObject(evaluateString("window.__autojs6TouchProbe.gutterPoint($row)")))

        fun lineHeightCss(): Double =
            JSONObject(evaluateString("window.__autojs6TouchProbe.point(0, 0, 0, false)")).getDouble("lineHeight")

        fun lineHeightPx(): Float {
            val metrics = JSONObject(evaluateString("window.__autojs6TouchProbe.point(0, 0, 0, false)"))
            return (metrics.getDouble("lineHeight") * metrics.getDouble("dpr")).toFloat()
        }

        fun state(): EditorState = EditorState(JSONObject(evaluateString("window.__autojs6TouchProbe.state()")))

        fun softInputRequestedSinceStart(): Boolean {
            val values = diagnostics()
            val shownAt = if (values.containsKey("lastShowSoftInputAtUptimeMillis")) values.getLong("lastShowSoftInputAtUptimeMillis") else 0L
            return shownAt >= startedAt
        }

        fun selectionToolbarActive(): Boolean {
            val active = AtomicReference(false)
            scenario.onActivity {
                val editor = session.get().view as AceCodeEditor
                val field = AceCodeEditor::class.java.getDeclaredField("selectionActionMode")
                field.isAccessible = true
                active.set(field.get(editor) != null)
            }
            return active.get()
        }

        private fun hostEventsSinceStart(): JSONArray {
            val events = JSONArray()
            diagnostics().getStringArrayList("runtimeEventHistory")?.takeLast(12)?.forEach { events.put(it) }
            return events
        }

        private fun diagnostics(): android.os.Bundle {
            val values = AtomicReference<android.os.Bundle>()
            scenario.onActivity {
                values.set(session.get().createDiagnosticsSnapshot(null, "auto").values)
            }
            return values.get()
        }

        private fun toScreen(css: JSONObject): Point {
            val location = IntArray(2)
            scenario.onActivity {
                (session.get().view as AceCodeEditor).webView.getLocationOnScreen(location)
            }
            val dpr = css.getDouble("dpr")
            return Point(
                (location[0] + css.getDouble("x") * dpr).toFloat(),
                (location[1] + css.getDouble("y") * dpr).toFloat(),
            )
        }

        private fun evaluateString(script: String): String {
            val value = JSONTokener(evaluate(script)).nextValue()
            return if (value == JSONObject.NULL) "" else value.toString()
        }

        private fun evaluate(script: String): String {
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
    }

    private companion object {
        const val LOG_TAG = "AutoJs6AceTouch"
        const val LOG_PREFIX = "AUTOJS6_ACE_TOUCH_INTERACTION="
        const val LINE_COUNT = 80
        const val SETTLE_MS = 700L
        const val RESET_MS = 700L
        const val IME_HIDE_TIMEOUT_MS = 3_000L
        // Scenarios use rows 0-10 so every target stays on screen without scrolling.
        const val MIN_VISIBLE_ROWS = 12
        val WORD = Regex("^\\w+$")
        val DOCUMENT = (0 until LINE_COUNT).joinToString("\n") { row ->
            "line$row alpha beta gamma delta epsilon zeta eta theta iota kappa lambda $row"
        }
    }
}
