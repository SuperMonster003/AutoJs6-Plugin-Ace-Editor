package io.github.supermonster003.autojs6.plugin.ace.editor.core

import android.app.Instrumentation
import android.content.SharedPreferences
import android.graphics.Rect
import android.os.Build
import android.os.Handler
import android.os.SystemClock
import android.view.InputDevice
import android.view.MotionEvent
import android.view.inputmethod.EditorInfo
import android.view.inputmethod.InputConnection
import android.view.inputmethod.InputMethodManager
import android.webkit.WebView
import androidx.test.core.app.ActivityScenario
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

/**
 * A live editor session for device tests that replace manual test items (docs/development/ace-1.44.0-manual-tests.md):
 * touches are injected through UiAutomation like real fingers, input method calls go through the input connection the
 * WebView gives the IME, and the page state is read with JavaScript.
 *
 * Host preferences changed through [setHostPreferences] are restored by [close].
 */
internal class AceDeviceTestHarness private constructor(
    val scenario: ActivityScenario<AceEditorTestActivity>,
    private val session: AtomicReference<EditorPluginSession>,
    private val restoredPreferences: Map<String, Any?>,
) : AutoCloseable {

    data class Point(val x: Float, val y: Float)

    private val instrumentation: Instrumentation = InstrumentationRegistry.getInstrumentation()
    private var changedPreferences = mutableMapOf<String, Any?>()

    val device: String = "${Build.MANUFACTURER} ${Build.MODEL} (API ${Build.VERSION.SDK_INT}, " +
        "${if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) WebView.getCurrentWebViewPackage()?.versionName else "?"})"

    // ---------------------------------------------------------------------------------------------------------------
    // Page

    fun onEditor(block: (AceCodeEditor) -> Unit) {
        scenario.onActivity { block(session.get().view as AceCodeEditor) }
    }

    fun <T> fromEditor(block: (AceCodeEditor) -> T): T {
        val result = AtomicReference<T>()
        onEditor { result.set(block(it)) }
        return result.get()
    }

    fun session(block: (EditorPluginSession) -> Unit) {
        scenario.onActivity { block(session.get()) }
    }

    /** Evaluates [script] in the editor page and returns the raw JSON result. */
    fun evaluate(script: String): String {
        val evaluated = CountDownLatch(1)
        val result = AtomicReference<String>()
        onEditor { editor ->
            editor.webView.evaluateJavascript(script) { raw ->
                result.set(raw)
                evaluated.countDown()
            }
        }
        assertTrue("ACE JavaScript evaluation timed out: ${script.take(80)}", evaluated.await(10, TimeUnit.SECONDS))
        return result.get() ?: "null"
    }

    fun evaluateString(script: String): String {
        val value = JSONTokener(evaluate(script)).nextValue()
        return if (value == JSONObject.NULL) "" else value.toString()
    }

    fun evaluateJson(script: String): JSONObject = JSONObject(evaluateString("JSON.stringify($script)"))

    fun evaluateArray(script: String): JSONArray = JSONArray(evaluateString("JSON.stringify($script)"))

    fun evaluateBoolean(script: String): Boolean = evaluate("!!($script)") == "true"

    fun evaluateInt(script: String): Int = evaluate("Number($script)").toDouble().toInt()

    /** Polls [condition] until it holds; returns false after [timeoutMs]. */
    fun waitFor(timeoutMs: Long = 3_000L, condition: () -> Boolean): Boolean {
        val deadline = SystemClock.uptimeMillis() + timeoutMs
        while (SystemClock.uptimeMillis() < deadline) {
            if (condition()) return true
            SystemClock.sleep(40)
        }
        return condition()
    }

    fun text(): String = evaluateString("window.editor.getValue()")

    fun line(row: Int): String = evaluateString("window.editor.session.getLine($row)")

    fun cursor(): Pair<Int, Int> =
        evaluateJson("window.editor.getCursorPosition()").let { it.getInt("row") to it.getInt("column") }

    fun selectedText(): String = evaluateString("window.editor.getSelectedText()")

    fun undoDepth(): Int = evaluateInt("(window.editor.session.getUndoManager().\$undoStack || []).length")

    fun setText(text: String) {
        evaluate("window.AutoJsAce.setText(${JSONObject.quote(text)}), true")
        SystemClock.sleep(200)
    }

    fun moveCursorTo(row: Int, column: Int) {
        evaluate("window.editor.clearSelection(), window.editor.moveCursorTo($row, $column), true")
        SystemClock.sleep(100)
    }

    fun select(anchorRow: Int, anchorColumn: Int, cursorRow: Int, cursorColumn: Int) {
        evaluate(
            "window.editor.selection.setSelectionAnchor($anchorRow, $anchorColumn), " +
                "window.editor.selection.selectToPosition({ row: $cursorRow, column: $cursorColumn }), true",
        )
        SystemClock.sleep(100)
    }

    /** Runs [action] on the editor through its bridge API (`window.AutoJsAce`). */
    fun api(action: String) {
        evaluate("window.AutoJsAce.$action, true")
    }

    fun awaitWindowFocus() {
        val deadline = SystemClock.uptimeMillis() + 5_000L
        while (SystemClock.uptimeMillis() < deadline) {
            val focused = AtomicReference(false)
            scenario.onActivity { activity -> focused.set(activity.hasWindowFocus()) }
            if (focused.get()) {
                SystemClock.sleep(800L)
                return
            }
            SystemClock.sleep(50)
        }
        throw AssertionError("The test activity did not get window focus")
    }

    fun hideSoftInput() {
        scenario.onActivity { activity ->
            val editor = session.get().view as AceCodeEditor
            editor.hideSoftInput()
            activity.getSystemService(InputMethodManager::class.java)
                .hideSoftInputFromWindow(editor.webView.windowToken, 0)
        }
        SystemClock.sleep(500)
    }

    fun webViewHeight(): Int = fromEditor { it.webView.height }

    /** Hides the selection toolbar and the keyboard, windows of their own that would take touches meant for the page. */
    fun clearOverlays() {
        onEditor { it.finishActionMode() }
        hideSoftInput()
        awaitWindowFocus()
    }

    /** The right edge of the visible part of the page in CSS pixels (a WebView can be wider than the screen). */
    fun visibleRightCss(): Double {
        val location = IntArray(2)
        onEditor { it.webView.getLocationOnScreen(location) }
        val dpr = evaluate("window.devicePixelRatio").toDouble()
        val screenWidth = InstrumentationRegistry.getInstrumentation().targetContext.resources.displayMetrics.widthPixels
        return (screenWidth - location[0]) / dpr
    }

    /**
     * The last row whose line lies wholly on the screen, above the keyboard if one is showing. Rows below it take no
     * touches: a phone in landscape (a G8441) shows only a few rows once the text is zoomed in.
     */
    fun lastRowOnScreen(): Int {
        val frame = Rect()
        val location = IntArray(2)
        var height = 0
        onEditor {
            it.webView.getWindowVisibleDisplayFrame(frame)
            it.webView.getLocationOnScreen(location)
            height = it.webView.height
        }
        val bottom = minOf(frame.bottom, location[1] + height)
        var row = evaluateInt("window.editor.renderer.getLastFullyVisibleRow()")
        while (row > 0 && point(row, 0, dyLines = 1.0).y > bottom) row--
        return row
    }

    fun textSizeSp(): Float {
        val size = AtomicReference(0f)
        session { size.set(it.getTextSizeSp()) }
        return size.get()
    }

    /** The font size the page renders with (a pinch changes it without a host to update the session). */
    fun renderedFontSizePx(): Double = evaluate("parseFloat(window.editor.getFontSize())").toDouble()

    /**
     * Records the touch events reaching the page (target classes and positions) so a failing touch test can show where
     * its touches went; [touchLog] returns them.
     */
    fun recordTouches() {
        evaluate(
            """(function() {
                window.__autojs6TouchLog = [];
                ['touchstart', 'touchend', 'touchcancel', 'mousedown', 'click'].forEach(function(name) {
                    document.addEventListener(name, function(e) {
                        var touch = (e.changedTouches && e.changedTouches[0]) || e;
                        var target = e.target && e.target.className ? String(e.target.className.baseVal || e.target.className) : String(e.target && e.target.nodeName);
                        window.__autojs6TouchLog.push(name + '@' + Math.round(touch.clientX) + ',' + Math.round(touch.clientY) + ' ' + target.slice(0, 40) + ' t=' + Math.round(e.timeStamp));
                    }, true);
                });
                return true;
            })()""",
        )
    }

    fun touchLog(): String = evaluateString("(window.__autojs6TouchLog || []).join(' | ')")

    // ---------------------------------------------------------------------------------------------------------------
    // Host preferences

    /** Writes host preferences and lets the editor apply them; [close] restores the previous values. */
    fun setHostPreferences(values: Map<String, Any?>) {
        val preferences = hostPreferences()
        values.keys.forEach { key ->
            if (key !in changedPreferences) changedPreferences[key] = preferences.all[key]
        }
        preferences.edit().apply { values.forEach { (key, value) -> put(key, value) } }.commit()
        session { it.notifyDisplayPreferencesChanged() }
        SystemClock.sleep(300)
    }

    // ---------------------------------------------------------------------------------------------------------------
    // Touch

    fun point(row: Int, column: Int, dyLines: Double = 0.5): Point {
        val css = evaluateJson(
            "(function() { var r = window.editor.renderer; var p = r.textToScreenCoordinates($row, $column); " +
                "return { x: p.pageX + r.characterWidth * 0.1, y: p.pageY + r.lineHeight * $dyLines, dpr: window.devicePixelRatio }; })()",
        )
        return toScreen(css)
    }

    fun cssToScreen(x: Double, y: Double): Point =
        toScreen(JSONObject().put("x", x).put("y", y).put("dpr", evaluate("window.devicePixelRatio").toDouble()))

    fun tap(point: Point, holdMs: Long = 40L) {
        val downTime = SystemClock.uptimeMillis()
        inject(downTime, downTime, MotionEvent.ACTION_DOWN, point)
        SystemClock.sleep(holdMs)
        inject(downTime, SystemClock.uptimeMillis(), MotionEvent.ACTION_UP, point)
    }

    fun doubleTap(point: Point) {
        tap(point, holdMs = 30L)
        SystemClock.sleep(60)
        tap(point, holdMs = 30L)
    }

    // Well past the 500 ms of the overlay: a busy page runs its timer late (seen on a 22120RN86C).
    fun longPress(point: Point) = tap(point, holdMs = 1_500L)

    /** Double taps [point] until [word] is selected; the first tap may show the keyboard and move the layout. */
    fun doubleTapSelects(point: () -> Point, word: String): Boolean {
        repeat(3) {
            try {
                doubleTap(point())
            } catch (busy: AssertionError) {
                // A busy page can refuse an injected touch for a while (seen on a G8441 right after zooming).
                SystemClock.sleep(800)
                return@repeat
            }
            if (waitFor(1_500L) { selectedText() == word }) return true
            SystemClock.sleep(600)
        }
        return false
    }

    /** Drags a finger from [start] to [end]; [beforeUp] runs while the finger still rests at [end]. */
    fun drag(
        start: Point,
        end: Point,
        steps: Int = 12,
        stepMs: Long = 16L,
        holdBeforeMoveMs: Long = 0L,
        holdBeforeUpMs: Long = 0L,
        beforeUp: (() -> Unit)? = null,
    ) {
        val downTime = SystemClock.uptimeMillis()
        inject(downTime, downTime, MotionEvent.ACTION_DOWN, start)
        if (holdBeforeMoveMs > 0) SystemClock.sleep(holdBeforeMoveMs)
        for (step in 1..steps) {
            SystemClock.sleep(stepMs)
            val fraction = step.toFloat() / steps
            inject(
                downTime, SystemClock.uptimeMillis(), MotionEvent.ACTION_MOVE,
                Point(start.x + (end.x - start.x) * fraction, start.y + (end.y - start.y) * fraction),
            )
        }
        if (holdBeforeUpMs > 0) SystemClock.sleep(holdBeforeUpMs)
        try {
            beforeUp?.invoke()
        } finally {
            inject(downTime, SystemClock.uptimeMillis(), MotionEvent.ACTION_UP, end)
        }
    }

    fun pinch(center: Point, startSpread: Float, endSpread: Float, steps: Int = 15) {
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
        for (step in 1..steps) {
            SystemClock.sleep(16)
            send(MotionEvent.ACTION_MOVE, 2, startSpread + (endSpread - startSpread) * step / steps.toFloat())
        }
        SystemClock.sleep(30)
        send(MotionEvent.ACTION_POINTER_UP or (1 shl MotionEvent.ACTION_POINTER_INDEX_SHIFT), 2, endSpread)
        SystemClock.sleep(20)
        send(MotionEvent.ACTION_UP, 1, endSpread)
    }

    /**
     * Injects a touch that is cancelled right away. The first touch injected into a freshly started activity sometimes
     * never reaches the WebView (seen on emulators and Xiaomi devices, also with AceTouchInteractionDeviceTest); a
     * cancelled touch costs nothing and leaves the editor unchanged.
     */
    fun warmUpTouchInjection() {
        val point = point(1, 3)
        val downTime = SystemClock.uptimeMillis()
        try {
            inject(downTime, downTime, MotionEvent.ACTION_DOWN, point)
            SystemClock.sleep(30)
            inject(downTime, SystemClock.uptimeMillis(), MotionEvent.ACTION_CANCEL, point)
        } catch (ignored: AssertionError) {
            // Best effort: the touches of the test itself still have to arrive.
        }
        SystemClock.sleep(200)
    }

    /**
     * Waits until the JavaScript language service has started. Its first program build blocks the page for one to two
     * seconds on slower devices (Roadmap-Ace-1.44.0.md G-A1), long enough to delay the 500 ms long press timer past the
     * end of a long press.
     */
    fun awaitLanguageServiceIdle() {
        waitFor(12_000L) {
            evaluateBoolean(
                "(function() { var s = window.AutoJsAce && window.AutoJsAce.getLspState && window.AutoJsAce.getLspState(); " +
                    "return !s || !s.enabled || s.localServiceReady || (s.tsService && s.tsService.ready) || s.state !== 'local-language-service'; })()",
            )
        }
        // One more evaluation round trip after the service settled.
        SystemClock.sleep(600)
    }

    private fun inject(downTime: Long, eventTime: Long, action: Int, point: Point) {
        var attempt = 0
        var injected: Boolean
        do {
            val event = MotionEvent.obtain(
                downTime, if (attempt == 0) eventTime else SystemClock.uptimeMillis(), action, point.x, point.y, 0,
            )
            event.source = InputDevice.SOURCE_TOUCHSCREEN
            injected = instrumentation.uiAutomation.injectInputEvent(event, true)
            event.recycle()
            if (!injected) SystemClock.sleep(250)
        } while (!injected && attempt++ < INJECTION_RETRIES)
        assertTrue("Touch injection failed at (${point.x}, ${point.y})", injected)
    }

    private fun toScreen(css: JSONObject): Point {
        val location = IntArray(2)
        onEditor { it.webView.getLocationOnScreen(location) }
        val dpr = css.getDouble("dpr")
        return Point((location[0] + css.getDouble("x") * dpr).toFloat(), (location[1] + css.getDouble("y") * dpr).toFloat())
    }

    // ---------------------------------------------------------------------------------------------------------------
    // Input method

    private var inputConnection: InputConnection? = null

    /**
     * Calls [block] with the input connection the WebView gives an IME (the plugin's wrapper around Chromium's), on
     * the connection's own thread as an IME would. The editor must have the input focus.
     */
    fun ime(block: (InputConnection) -> Unit) {
        val connection = inputConnection ?: fromEditor { editor ->
            editor.webView.requestFocus()
            editor.webView.onCreateInputConnection(EditorInfo())
        }.also { inputConnection = it }
        checkNotNull(connection) { "The WebView gave no input connection" }
        val handler: Handler? = connection.handler
        if (handler == null) {
            block(connection)
        } else {
            val done = CountDownLatch(1)
            val error = AtomicReference<Throwable>()
            handler.post {
                try {
                    block(connection)
                } catch (thrown: Throwable) {
                    error.set(thrown)
                } finally {
                    done.countDown()
                }
            }
            assertTrue("The input connection call timed out", done.await(5, TimeUnit.SECONDS))
            error.get()?.let { throw it }
        }
        // Chromium applies IME calls asynchronously on the UI thread; the page sees them a frame later.
        SystemClock.sleep(IME_SETTLE_MS)
    }

    /** Forgets the cached connection; the next [ime] call asks the WebView again (after focus changes). */
    fun resetInputConnection() {
        inputConnection = null
    }

    fun focusEditor() {
        api("focusEditor && window.AutoJsAce.focusEditor()")
        onEditor { it.webView.requestFocus() }
        SystemClock.sleep(300)
    }

    /** Events the bridge reported to the host since [since] (uptime), from the runtime event history. */
    fun hostEvents(): List<String> {
        val values = AtomicReference<android.os.Bundle>()
        session { values.set(it.createDiagnosticsSnapshot(null, "auto").values) }
        return values.get().getStringArrayList("runtimeEventHistory") ?: emptyList()
    }

    override fun close() {
        try {
            if (changedPreferences.isNotEmpty()) {
                hostPreferences().edit().apply { changedPreferences.forEach { (key, value) -> put(key, value) } }.commit()
            }
            if (restoredPreferences.isNotEmpty()) {
                hostPreferences().edit().apply { restoredPreferences.forEach { (key, value) -> put(key, value) } }.commit()
            }
        } finally {
            scenario.onActivity { session.getAndSet(null)?.destroy() }
            scenario.close()
        }
    }

    companion object {
        const val IME_SETTLE_MS = 120L
        private const val INJECTION_RETRIES = 20

        private fun hostPreferences(): SharedPreferences =
            InstrumentationRegistry.getInstrumentation().targetContext.defaultHostPreferences()

        private fun SharedPreferences.Editor.put(key: String, value: Any?) {
            when (value) {
                null -> remove(key)
                is Boolean -> putBoolean(key, value)
                is Int -> putInt(key, value)
                is Long -> putLong(key, value)
                is Float -> putFloat(key, value)
                is String -> putString(key, value)
                else -> throw IllegalArgumentException("Unsupported preference value for $key: $value")
            }
        }

        /**
         * Opens [document] in a new editor. [preferences] are host preferences applied before the session starts (the
         * editor reads some options only while starting) and restored when the harness closes.
         */
        fun open(
            document: String,
            documentPath: String = "/data/local/tmp/autojs6-device-test.js",
            preferences: Map<String, Any?> = emptyMap(),
        ): AceDeviceTestHarness {
            val context = InstrumentationRegistry.getInstrumentation().targetContext
            // `-e aceWebViewDebugging true` lets a person inspect a test page with DevTools
            // (adb forward ... localabstract:webview_devtools_remote_<pid>).
            if (InstrumentationRegistry.getArguments().getString("aceWebViewDebugging") == "true") {
                InstrumentationRegistry.getInstrumentation().runOnMainSync { WebView.setWebContentsDebuggingEnabled(true) }
            }
            val hostPreferences = hostPreferences()
            val previous = preferences.keys.associateWith { hostPreferences.all[it] }
            if (preferences.isNotEmpty()) {
                hostPreferences.edit().apply { preferences.forEach { (key, value) -> put(key, value) } }.commit()
            }
            val ready = CountDownLatch(1)
            val session = AtomicReference<EditorPluginSession>()
            val scenario = ActivityScenario.launch(AceEditorTestActivity::class.java)
            scenario.onActivity { activity ->
                val created = AceEditorPluginEntrypoint().createSession(
                    hostContext = activity,
                    pluginContext = context,
                    config = EditorPluginSessionConfig(
                        hostPackageName = context.packageName,
                        hostVersionName = "instrumentation",
                        hostVersionCode = 6000L,
                        storageDirectoryPath = File(context.cacheDir, "ace-device-test-fonts").absolutePath,
                        documentPath = documentPath,
                    ),
                    callback = object : EditorPluginCallback {
                        override fun onReady(state: EditorPluginState) {
                            ready.countDown()
                        }
                    },
                )
                session.set(created)
                created.setInitialText(document)
                activity.setContentView(created.view)
                forwardImeInsets(activity, created)
            }
            val harness = AceDeviceTestHarness(scenario, session, previous)
            try {
                assertTrue("ACE editor did not become ready", ready.await(15, TimeUnit.SECONDS))
                val lines = document.split('\n').size
                assertTrue(
                    "The document was not loaded",
                    harness.waitFor(15_000L) {
                        harness.evaluate("window.editor && window.editor.session ? window.editor.session.getLength() : 0") == lines.toString()
                    },
                )
                SystemClock.sleep(700)
                harness.awaitWindowFocus()
                harness.awaitLanguageServiceIdle()
                harness.warmUpTouchInjection()
            } catch (error: Throwable) {
                harness.close()
                throw error
            }
            return harness
        }
    }
}
