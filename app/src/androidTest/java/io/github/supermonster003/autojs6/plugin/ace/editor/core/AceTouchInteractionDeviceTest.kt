package io.github.supermonster003.autojs6.plugin.ace.editor.core

import android.os.Build
import android.os.SystemClock
import android.util.Log
import android.view.InputDevice
import android.view.MotionEvent
import android.view.inputmethod.InputMethodManager
import android.webkit.WebView
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
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
 * of the Ace 1.4.12 Auto.js build with the changes of Roadmap-Ace-1.44.0.md A2-10 (slow taps, resting fingers, gutter
 * taps, the insertion toolbar); they are checked after all scenarios ran so one failure does not hide the others.
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
                forwardImeInsets(activity, createdSession)
            }
            assertTrue("ACE editor did not become ready", ready.await(15, TimeUnit.SECONDS))
            val probe = Probe(scenario, session)
            probe.awaitDocument()
            probe.install()
            assertTrue("The editor should show at least $MIN_VISIBLE_ROWS rows", probe.visibleRowsNow() >= MIN_VISIBLE_ROWS)
            probe.awaitWindowFocus()
            warmUpTouchInjection(probe.point(1, 3))

            runScenario(probe, "B1 quick tap") { p ->
                val target = p.point(2, 10)
                tap(target, holdMs = 40)
                settle()
                val state = p.state()
                expect(p, state.cursorIs(2, 10) && state.empty, "cursor should move to 2:10")
                expect(p, p.softInputRequestedSinceStart(), "soft input should be requested")
            }
            runScenario(probe, "slow tap") { p ->
                // A2-10: 1.4.12 ignored taps held longer than 100 ms; every tap lifted before the long press counts.
                p.setSelection(1, 3, 1, 3)
                val target = p.point(3, 12)
                tap(target, holdMs = 250)
                settle()
                expect(p, p.state().cursorIs(3, 12), "a tap held for 250 ms should move the cursor to 3:12")
                expect(p, p.softInputRequestedSinceStart(), "soft input should be requested")
            }
            runScenario(probe, "B3 double tap") { p ->
                val target = p.point(4, 14)
                val firstTap = TouchTimeline()
                tap(target, holdMs = 40, firstTap)
                tap(target, holdMs = 40, TouchTimeline(firstTap.timeAt(160)))
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
                expect(p, !state.json.getBoolean("mobileMenuVisible"), "Ace's own mobile menu should stay hidden")
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
                // The finger rests before lifting and the touchscreen keeps reporting the same position.
                p.scrollTo(0)
                val start = p.point(p.lowerRow(), 20)
                val end = Point(start.x, start.y - p.swipeRows() * p.lineHeightPx())
                drag(start, end, steps = 30, stepMs = 20, stationaryTailMs = 200)
                SystemClock.sleep(100)
                val released = p.state().scrollTop
                SystemClock.sleep(900)
                val later = p.state().scrollTop
                p.note("scrollTopAfterRelease", released)
                p.note("scrollTopLater", later)
                expect(p, released > 0, "content should scroll with the finger")
                // A2-10: a finger resting before the lift does not fling (1.4.12 flung on some devices).
                expect(p, later - released < p.lineHeightCss(), "a rested drag should not fling ($released -> $later)")
            }
            runScenario(probe, "pause before lifting") { p ->
                // No move events during the pause: 1.4.12 still flung with the velocity before it, the overlay
                // treats a finger resting for more than 40 ms as stopped (A2-10).
                p.scrollTo(0)
                val start = p.point(p.lowerRow(), 20)
                val end = Point(start.x, start.y - p.swipeRows() * p.lineHeightPx())
                drag(start, end, steps = 30, stepMs = 20, holdBeforeUpMs = 200)
                SystemClock.sleep(100)
                val released = p.state().scrollTop
                SystemClock.sleep(900)
                val later = p.state().scrollTop
                p.note("scrollTopAfterRelease", released)
                p.note("scrollTopLater", later)
                expect(p, later - released < p.lineHeightCss(), "a paused drag should not fling ($released -> $later)")
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
                // Measured while the finger rests, before the long press: lifting it is a tap that moves the cursor
                // and shows the keyboard, and the smaller viewport then scrolls the cursor into view.
                val downTime = SystemClock.uptimeMillis()
                inject(downTime, downTime, MotionEvent.ACTION_DOWN, start)
                SystemClock.sleep(50)
                val stopped = p.state().scrollTop
                SystemClock.sleep(250)
                val later = p.state().scrollTop
                inject(downTime, SystemClock.uptimeMillis(), MotionEvent.ACTION_UP, start)
                p.note("scrollTopAfterTouch", stopped)
                p.note("scrollTopLater", later)
                expect(p, kotlin.math.abs(later - stopped) < 1.0, "touching should stop the fling ($stopped -> $later)")
            }
            runScenario(probe, "B2 gutter tap") { p ->
                // A2-10: the overlay passes gutter taps to the bridge without focusing the editor. The middle of the
                // cell toggles the breakpoint, also on rows with diagnostics (whose icon sits at the left edge).
                p.setSelection(1, 1, 1, 1)
                p.note("row3Diagnostics", p.annotationCount(3))
                tap(p.gutterPoint(3), holdMs = 40)
                settle()
                val state = p.state()
                p.note("row3Breakpoint", p.hasBreakpoint(3))
                expect(p, p.hasBreakpoint(3), "a gutter tap should toggle the breakpoint of row 3")
                expect(p, state.cursorIs(1, 1), "a gutter tap should not move the cursor, got ${state.cursor}")
                expect(p, !p.softInputRequestedSinceStart(), "a gutter tap should not ask for the soft keyboard")
                p.clearBreakpoint(3)
            }
            runScenario(probe, "tap on the cursor") { p ->
                // A2-10: a tap on the cursor shows the insertion toolbar (paste, select all).
                p.setSelection(9, 4, 9, 4)
                tap(p.point(9, 4), holdMs = 40)
                settle()
                val state = p.state()
                expect(p, state.cursorIs(9, 4) && state.empty, "the cursor should stay at 9:4, got ${state.cursor}")
                expect(p, state.traceContains("startInsertionActionMode"), "a tap on the cursor should ask for the insertion toolbar")
                expect(p, p.selectionToolbarActive(), "the insertion toolbar should be shown")
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

    private fun tap(point: Point, holdMs: Long, timeline: TouchTimeline = TouchTimeline()) {
        inject(timeline.downTime, timeline.at(0), MotionEvent.ACTION_DOWN, point, timeline)
        inject(timeline.downTime, timeline.at(holdMs), MotionEvent.ACTION_UP, point, timeline)
    }

    private fun drag(
        start: Point,
        end: Point,
        steps: Int,
        stepMs: Long,
        holdBeforeMoveMs: Long = 0,
        holdBeforeUpMs: Long = 0,
        stationaryTailMs: Long = 0,
    ) {
        val timeline = TouchTimeline()
        val downTime = timeline.downTime
        inject(downTime, timeline.at(0), MotionEvent.ACTION_DOWN, start, timeline)
        var offset = holdBeforeMoveMs
        for (step in 1..steps) {
            offset += stepMs
            val fraction = step.toFloat() / steps
            val point = Point(start.x + (end.x - start.x) * fraction, start.y + (end.y - start.y) * fraction)
            inject(downTime, timeline.at(offset), MotionEvent.ACTION_MOVE, point, timeline)
        }
        // The touchscreen keeps reporting a resting finger about once per frame.
        val tailEnd = offset + stationaryTailMs
        while (offset + 16 <= tailEnd) {
            offset += 16
            inject(downTime, timeline.at(offset), MotionEvent.ACTION_MOVE, end, timeline)
        }
        inject(downTime, timeline.at(offset + holdBeforeUpMs), MotionEvent.ACTION_UP, end, timeline)
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

    /**
     * Injects a touch that is cancelled right away, as AceDeviceTestHarness does. On a 23046RP50C the system refused
     * every injection for more than two seconds after the test activity of a freshly installed build started, so B1
     * failed with "Touch injection failed"; the cancelled touch absorbs that and leaves the editor unchanged.
     */
    private fun warmUpTouchInjection(point: Point) {
        val downTime = SystemClock.uptimeMillis()
        try {
            inject(downTime, downTime, MotionEvent.ACTION_DOWN, point)
            SystemClock.sleep(30)
            inject(downTime, SystemClock.uptimeMillis(), MotionEvent.ACTION_CANCEL, point)
        } catch (error: AssertionError) {
            // Best effort: the scenarios' own touches still have to arrive.
            Log.i(LOG_TAG, "Warm-up touch injection was refused: ${error.message}")
        }
        SystemClock.sleep(200)
    }

    private fun inject(
        downTime: Long,
        eventTime: Long,
        action: Int,
        point: Point,
        timeline: TouchTimeline? = null,
    ) {
        val event = MotionEvent.obtain(downTime, eventTime, action, point.x, point.y, 0)
        event.source = InputDevice.SOURCE_TOUCHSCREEN
        var injected = instrumentation.uiAutomation.injectInputEvent(event, true)
        event.recycle()
        var attempt = 0
        var injectedAt = eventTime
        while (!injected && attempt++ < INJECTION_RETRIES) {
            SystemClock.sleep(200)
            injectedAt = SystemClock.uptimeMillis()
            val retry = MotionEvent.obtain(downTime, injectedAt, action, point.x, point.y, 0)
            retry.source = InputDevice.SOURCE_TOUCHSCREEN
            injected = instrumentation.uiAutomation.injectInputEvent(retry, true)
            retry.recycle()
        }
        timeline?.delayBy(injectedAt - eventTime)
        assertTrue("Touch injection failed at (${point.x}, ${point.y})", injected)
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
                    ["startActionMode", "startActionModeIfSelectionInView", "startInsertionActionMode", "finishActionMode"].forEach(function(name) {
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
                                mobileMenuVisible: Array.prototype.some.call(
                                    document.querySelectorAll(".ace_mobile-menu"),
                                    function(menu) { return menu.style.display !== "none"; }
                                ),
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
            while (keyboardShown() && SystemClock.uptimeMillis() < deadline) {
                SystemClock.sleep(50)
            }
            if (keyboardShown()) {
                failures += "$currentName: the soft keyboard did not hide " +
                    "(height ${webViewHeight()} of $baselineHeight, keyboard insets visible: ${imeVisible()})"
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

        fun awaitWindowFocus() {
            val deadline = SystemClock.uptimeMillis() + 5_000L
            while (SystemClock.uptimeMillis() < deadline) {
                val focused = AtomicReference(false)
                scenario.onActivity { activity -> focused.set(activity.hasWindowFocus()) }
                if (focused.get()) {
                    SystemClock.sleep(1_000L)
                    return
                }
                SystemClock.sleep(50)
            }
            throw AssertionError("The test activity did not get window focus")
        }

        fun lowerRow(): Int = (visibleRows() * 3 / 4).coerceAtMost(LINE_COUNT - 1)

        fun swipeRows(): Int = (visibleRows() / 2).coerceAtLeast(2)

        fun visibleRowsNow(): Int = visibleRows()

        fun hasBreakpoint(row: Int): Boolean = evaluate("!!window.editor.getSession().getBreakpoints()[$row]") == "true"

        fun clearBreakpoint(row: Int) {
            evaluate("window.editor.getSession().clearBreakpoint($row), true")
        }

        fun annotationCount(row: Int): Int = evaluate(
            "(window.editor.getSession().getAnnotations() || [])" +
                ".filter(function(item) { return item.row === $row; }).length",
        ).toInt()

        private fun visibleRows(): Int = evaluate("window.__autojs6TouchProbe.visibleRows()").toInt()

        // On API 35 the edge-to-edge window no longer shrinks for the keyboard, so the height alone misses it.
        private fun keyboardShown(): Boolean = webViewHeight() < baselineHeight || imeVisible()

        // Root insets report the keyboard reliably from API 30 on; older versions guess from the visible frame.
        private fun imeVisible(): Boolean {
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) return false
            val visible = AtomicReference(false)
            scenario.onActivity {
                val insets = ViewCompat.getRootWindowInsets((session.get().view as AceCodeEditor).webView)
                visible.set(insets?.isVisible(WindowInsetsCompat.Type.ime()) == true)
            }
            return visible.get()
        }

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
            // A programmatic selection makes the bridge show the selection toolbar, which could cover the target.
            scenario.onActivity { (session.get().view as AceCodeEditor).finishActionMode() }
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
        // Long enough that flings never reach the end, even when the soft keyboard stays hidden and the editor
        // shows twice as many rows (the A0 records used 80 lines, which left a hidden-keyboard phone almost no room).
        const val LINE_COUNT = 200
        const val SETTLE_MS = 700L
        const val RESET_MS = 700L
        const val IME_HIDE_TIMEOUT_MS = 3_000L
        // Scenarios use rows 0-10 so every target stays on screen without scrolling.
        const val MIN_VISIBLE_ROWS = 12
        const val INJECTION_RETRIES = 10
        val WORD = Regex("^\\w+$")
        val DOCUMENT = (0 until LINE_COUNT).joinToString("\n") { row ->
            "line$row alpha beta gamma delta epsilon zeta eta theta iota kappa lambda $row"
        }
    }
}
