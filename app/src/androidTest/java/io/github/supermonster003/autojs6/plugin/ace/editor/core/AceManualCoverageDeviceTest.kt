package io.github.supermonster003.autojs6.plugin.ace.editor.core

import android.os.SystemClock
import android.util.Log
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertTrue
import org.junit.Assume.assumeTrue
import org.junit.Test
import org.junit.runner.RunWith

/**
 * Manual test items of docs/development/ace-1.44.0-manual-tests.md that a device can check by itself (appendix B
 * touches and the visual items V1, V7, V8, V10), plus the defects the maintainer found while testing them on XQ-AT72
 * (Roadmap-Ace-1.44.0.md A2-10 items 15 to 17).
 */
@RunWith(AndroidJUnit4::class)
class AceManualCoverageDeviceTest {

    // V8 (2026-10-14): a pinch cleared the selection, and double taps right after it selected nothing.
    @Test
    fun pinchKeepsTheSelectionAndADoubleTapRightAfterSelects() = withEditor(TOUCH_DOCUMENT) { editor ->
        val textSize = editor.textSizeSp()
        try {
            editor.recordTouches()
            assertTrue("the double tap selects a word (${editor.touchLog()})", editor.doubleTapSelects({ editor.point(3, 8) }, "alpha"))
            val fontSize = editor.renderedFontSizePx()
            editor.clearOverlays()
            assertEquals("the toolbar and keyboard are gone, the selection stays", "alpha", editor.selectedText())
            editor.recordTouches()
            editor.pinch(editor.point(12, 20), 160f, 320f)
            SystemClock.sleep(1_200)
            assertNotEquals("the pinch zoomed (touches ${editor.touchLog()})", fontSize, editor.renderedFontSizePx(), 0.01)
            assertEquals("the pinch keeps the selection", "alpha", editor.selectedText())
            // Away from the selection and its toolbar, but on the screen.
            val first = firstVisibleRow(editor)
            val target = listOf(first + 8, editor.lastRowOnScreen() - 1, editor.lastRowOnScreen(), first + 1)
                .first { it > first && it <= editor.lastRowOnScreen() && it != 3 }
            assertTrue(
                "a double tap right after the pinch selects (selected \"${editor.selectedText()}\", touches ${editor.touchLog()})",
                editor.doubleTapSelects({ editor.point(target, 16) }, "beta") && editor.cursor().first == target,
            )
            SystemClock.sleep(600)
            assertEquals("and the selection stays", "beta", editor.selectedText())
        } finally {
            editor.session { it.setTextSizeSp(textSize) }
        }
    }

    // B13 / V8: the text under the fingers stays there while zooming.
    @Test
    fun pinchKeepsTheTextBetweenTheFingersInPlace() = withEditor(TOUCH_DOCUMENT) { editor ->
        val textSize = editor.textSizeSp()
        try {
            val focus = editor.point(8, 20)
            val before = documentPositionAt(editor, focus)
            editor.pinch(focus, 160f, 360f)
            SystemClock.sleep(900)
            val after = documentPositionAt(editor, focus)
            assertTrue("the row under the fingers moved from ${before.first} to ${after.first}", kotlin.math.abs(after.first - before.first) <= 1)
            editor.pinch(focus, 360f, 160f)
            SystemClock.sleep(900)
            val back = documentPositionAt(editor, focus)
            assertTrue("the row under the fingers moved from ${before.first} to ${back.first}", kotlin.math.abs(back.first - before.first) <= 1)
        } finally {
            editor.session { it.setTextSizeSp(textSize) }
        }
    }

    // B11 and V5 (d): a tap on the completion popup inserts that item; a drag scrolls it without changing the selection.
    @Test
    fun completionPopupInsertsOnTapAndScrollsOnDrag() = withEditor(COMPLETION_DOCUMENT) { editor ->
        val row = COMPLETION_DOCUMENT.lines().size - 1
        // As when typing: the keyboard is already open. Touches on a page whose textarea has the focus brought the
        // keyboard up on a G8441, and its layout change closed the popup under the finger.
        editor.tap(editor.point(row, 0))
        SystemClock.sleep(1_200)
        editor.onEditor { it.finishActionMode() }
        editor.moveCursorTo(row, 0)
        editor.evaluate("window.editor.insert('al'), window.editor.execCommand('startAutocomplete'), true")
        assertTrue("the popup opens", editor.waitFor { popupOpen(editor) })
        SystemClock.sleep(300)
        val popup = popupGeometry(editor)
        val lineHeight = popup.getDouble("lineHeight")
        // A small screen with the keyboard open leaves the popup only a few rows.
        val visibleRows = (popup.getDouble("height") / lineHeight).toInt()
        assertTrue("the popup shows at least two rows: $popup", visibleRows >= 2)
        val firstRow = editor.cssToScreen(popup.getDouble("x"), popup.getDouble("top") + lineHeight * 0.5)
        val lastRow = editor.cssToScreen(popup.getDouble("x"), popup.getDouble("top") + lineHeight * (visibleRows - 0.5))
        val selectedBefore = popup.getInt("selected")
        editor.drag(lastRow, firstRow, steps = 10, stepMs = 20L, holdBeforeUpMs = 120L)
        SystemClock.sleep(400)
        val scrolled = popupGeometry(editor)
        assertTrue(
            "the drag scrolled the popup: $scrolled, before $popup",
            scrolled.getInt("firstRow") > 0 || scrolled.getDouble("scrollTop") >= lineHeight * 0.5,
        )
        assertEquals("the drag did not change the selected item", selectedBefore, scrolled.getInt("selected"))
        assertEquals("the drag inserted nothing", "al", editor.line(row))
        // The item under the tap, as the popup maps it.
        val tapY = popup.getDouble("top") + lineHeight * (if (visibleRows >= 3) 1.5 else 0.5)
        val expected = editor.evaluateString(
            "(function() { var p = window.editor.completer.popup; var r = p.renderer; " +
                "var row = r.screenToTextCoordinates(${popup.getDouble("x")}, $tapY).row; return p.getData(row).value; })()",
        )
        editor.recordTouches()
        editor.tap(editor.cssToScreen(popup.getDouble("x"), tapY))
        assertTrue(
            "a tap inserts the tapped item \"$expected\" (line \"${editor.line(row)}\", popup ${popupGeometry(editor)}, touches ${editor.touchLog()})",
            editor.waitFor { editor.line(row).startsWith(expected) },
        )
    }

    // B22: a long press on blank space places the cursor and asks for the insertion toolbar, without selecting.
    @Test
    fun longPressOnBlankSpaceStartsTheInsertionToolbar() = withEditor(TOUCH_DOCUMENT_WITH_BLANK_LINE) { editor ->
        installActionModeTrace(editor)
        editor.recordTouches()
        editor.longPress(editor.point(BLANK_ROW, 2))
        SystemClock.sleep(400)
        assertEquals("the cursor is on the blank row", BLANK_ROW, editor.cursor().first)
        assertEquals("nothing is selected", "", editor.selectedText())
        assertTrue(
            "the insertion toolbar was requested (trace ${actionModeTrace(editor)}, cursor ${editor.cursor()}, touches ${editor.touchLog()})",
            actionModeTrace(editor).contains("startInsertionActionMode"),
        )
    }

    // B18: the "<click to see more...>" button of a truncated long line toggles word wrap under a finger.
    @Test
    fun longLineButtonTogglesWordWrapByTouch() = withEditor(
        LONG_LINE_DOCUMENT,
        preferences = mapOf(AceEditorDisplayPreferences.KEY_ACE_WORD_WRAP_ENABLED to false),
    ) { editor ->
        assertTrue(
            "the long line is truncated with a button (${editor.evaluateString("(function() { var b = document.querySelector('.ace_inline_button'); return b ? JSON.stringify(b.getBoundingClientRect()) + ' ' + JSON.stringify(window.editor.renderer.scroller.getBoundingClientRect()) : 'none'; })()")})",
            editor.waitFor { buttonRect(editor) != null },
        )
        val rect = checkNotNull(buttonRect(editor))
        val wrapBefore = editor.evaluateBoolean("window.editor.session.getUseWrapMode()")
        editor.recordTouches()
        val target = editor.cssToScreen(rect.getDouble("x"), rect.getDouble("y"))
        editor.tap(target)
        assertTrue(
            "the button toggled word wrap (button $rect at $target, touches ${editor.touchLog()})",
            editor.waitFor { editor.evaluateBoolean("window.editor.session.getUseWrapMode()") != wrapBefore },
        )
    }

    // V10 (2026-10-14): the magnifier drew an opaque theme selection over the selected text.
    @Test
    fun magnifierDrawsTheSelectionUnderTheText() = withEditor(
        TOUCH_DOCUMENT,
        preferences = mapOf(AceEditorDisplayPreferences.KEY_ACE_TOUCH_MAGNIFIER_ENABLED to true),
    ) { editor ->
        editor.api("setTheme('ace/theme/gruvbox', true, '#282828', '#ebdbb2')")
        assertTrue(editor.doubleTapSelects({ editor.point(3, 8) }, "alpha"))
        SystemClock.sleep(400)
        editor.clearOverlays()
        val cursor = editor.cursor()
        editor.recordTouches()
        val inspected = arrayOf<JSONObject?>(null)
        editor.drag(
            editor.point(cursor.first, cursor.second),
            editor.point(cursor.first + 1, cursor.second + 6),
            steps = 14,
            stepMs = 24L,
            holdBeforeUpMs = 250L,
        ) {
            inspected[0] = editor.evaluateJson(
                """(function() {
                    var magnifier = document.querySelector('.autojs6-magnifier');
                    if (!magnifier || magnifier.style.display === 'none') return { shown: false };
                    var content = magnifier.querySelector('.autojs6-magnifier-content');
                    var children = Array.prototype.slice.call(content.children);
                    var firstRow = children.findIndex(function(node) { return /ace_line/.test(node.className); });
                    var highlights = children.filter(function(node) { return /autojs6-magnifier-selection/.test(node.className); });
                    return {
                        shown: true,
                        highlights: highlights.length,
                        zIndices: highlights.map(function(node) { return getComputedStyle(node).zIndex; }),
                        highlightsBeforeRows: highlights.every(function(node) { return children.indexOf(node) < firstRow; }),
                        text: content.textContent.slice(0, 200)
                    };
                })()""",
            )
        }
        val magnifier = checkNotNull(inspected[0])
        assertTrue("the magnifier is shown while dragging: $magnifier (touches ${editor.touchLog()})", magnifier.getBoolean("shown"))
        assertTrue("the selection is drawn: $magnifier", magnifier.getInt("highlights") > 0)
        assertTrue("under the rows: $magnifier", magnifier.getBoolean("highlightsBeforeRows"))
        val zIndices = magnifier.getJSONArray("zIndices")
        for (index in 0 until zIndices.length()) assertEquals("without a z-index: $magnifier", "auto", zIndices.getString(index))
        assertTrue("the rows are cloned: $magnifier", magnifier.getString("text").contains("alpha"))
    }

    // Maintainer report after V10 (2026-10-14): with soft wrap, a scrollbar appearing or disappearing during a render
    // left the text drawn for the old wrap data outside the visible area; the editor looked empty.
    @Test
    fun softWrapRowsStayAtTheScrollPositionWhenTheViewportResizes() = withEditor(
        WRAP_DOCUMENT,
        preferences = mapOf(AceEditorDisplayPreferences.KEY_ACE_WORD_WRAP_ENABLED to true),
    ) { editor ->
        val textSize = editor.textSizeSp()
        try {
            editor.session { it.setTextSizeSp(20f) }
            SystemClock.sleep(600)
            // A width where the vertical scrollbar decides between two wrap limits, then a height too low for
            // scrollbars (as during a keyboard animation) and the full height again.
            val result = editor.evaluateJson(
                """(function() {
                    var r = window.editor.renderer, s = window.editor.session;
                    s.setScrollTop(120 * r.lineHeight);
                    r.updateFull(true);
                    var scrollbar = r.scrollBarV.getWidth();
                    if (!scrollbar) return { skipped: 'the vertical scrollbar takes no width' };
                    var gutter = r.gutterWidth, padding = r.${'$'}padding, cw = r.characterWidth;
                    var columns = Math.floor((r.${'$'}size.scrollerWidth - 2 * padding) / cw);
                    var width = gutter + 2 * padding + cw * columns + scrollbar / 2 + (r.${'$'}size.width - r.${'$'}size.scrollerWidth - gutter - scrollbar);
                    var height = r.${'$'}size.height;
                    function consistent() {
                        var c = r.layerConfig;
                        return s.documentToScreenRow(c.firstRow, 0) === c.firstRowScreen &&
                            Math.abs(c.firstRowScreen * c.lineHeight + c.offset - r.scrollTop) < 1;
                    }
                    var limits = [], checks = [];
                    for (var round = 0; round < 3; round++) {
                        r.onResize(true, gutter, width, r.lineHeight);
                        limits.push(s.getWrapLimit());
                        checks.push(consistent());
                        r.onResize(true, gutter, width, height);
                        limits.push(s.getWrapLimit());
                        checks.push(consistent());
                    }
                    window.editor.resize(true);
                    return { limits: limits, checks: checks };
                })()""",
            )
            assumeTrue(result.optString("skipped"), !result.has("skipped"))
            val checks = result.getJSONArray("checks")
            for (index in 0 until checks.length()) {
                assertTrue("rows match the scroll position after resize $index: $result", checks.getBoolean(index))
            }
            // The same with the real soft keyboard, a few times.
            repeat(4) { round ->
                editor.tap(editor.point(firstVisibleRow(editor) + 2, 6))
                SystemClock.sleep(1_200)
                assertTrue("rows match the scroll position with the keyboard (round $round)", rowsAtScrollPosition(editor))
                editor.hideSoftInput()
                SystemClock.sleep(800)
                assertTrue("rows match the scroll position without the keyboard (round $round)", rowsAtScrollPosition(editor))
            }
        } finally {
            editor.session { it.setTextSizeSp(textSize) }
        }
    }

    // V7 (2026-10-14): the signature and hover boxes follow the editor font size.
    @Test
    fun tooltipTextFollowsTheEditorFontSize() = withEditor(TOUCH_DOCUMENT) { editor ->
        val textSize = editor.textSizeSp()
        try {
            fun sizes(): JSONObject = editor.evaluateJson(
                """(function() {
                    var out = {};
                    ['autojs6_signature_tooltip', 'autojs6_hover_tooltip'].forEach(function(name) {
                        var box = document.createElement('div');
                        box.className = name;
                        document.body.appendChild(box);
                        out[name] = parseFloat(getComputedStyle(box).fontSize);
                        box.remove();
                    });
                    return out;
                })()""",
            )
            editor.session { it.setTextSizeSp(16f) }
            SystemClock.sleep(400)
            val normal = sizes()
            assertEquals(13.0, normal.getDouble("autojs6_signature_tooltip"), 0.01)
            assertEquals(12.0, normal.getDouble("autojs6_hover_tooltip"), 0.01)
            editor.session { it.setTextSizeSp(24f) }
            SystemClock.sleep(400)
            val large = sizes()
            assertEquals(19.5, large.getDouble("autojs6_signature_tooltip"), 0.01)
            assertEquals(18.0, large.getDouble("autojs6_hover_tooltip"), 0.01)
        } finally {
            editor.session { it.setTextSizeSp(textSize) }
        }
    }

    // V1: the SVG gutter icons are as large as the line numbers.
    @Test
    fun svgGutterIconsFollowTheTextSize() = withEditor(
        "const broken = (;\nconst fine = 1;\n",
        preferences = mapOf(AceEditorDisplayPreferences.KEY_ACE_SVG_GUTTER_ICONS_ENABLED to true),
    ) { editor ->
        editor.evaluate(
            "window.editor.session.setAnnotations([{ row: 0, column: 0, type: 'error', text: 'expected' }]), " +
                "window.editor.renderer.updateFull(true), true",
        )
        assertTrue(
            "an SVG icon is drawn",
            editor.waitFor { editor.evaluateBoolean("document.querySelector('.ace_gutter-cell_svg-icons .ace_icon_svg')") },
        )
        val sizes = editor.evaluateJson(
            """(function() {
                var icon = document.querySelector('.ace_gutter-cell_svg-icons .ace_icon_svg');
                return { icon: icon.getBoundingClientRect().width, font: parseFloat(getComputedStyle(window.editor.container).fontSize) };
            })()""",
        )
        assertEquals("icon width equals the font size: $sizes", sizes.getDouble("font"), sizes.getDouble("icon"), 0.5)
    }

    // A2-10 item 15: Gruvbox selections and word highlights stay readable.
    @Test
    fun gruvboxSelectionUsesItsOwnPalette() = withEditor(TOUCH_DOCUMENT) { editor ->
        editor.api("setTheme('ace/theme/gruvbox', true, '#282828', '#ebdbb2')")
        editor.select(3, 6, 3, 11)
        editor.evaluate("window.editor.renderer.updateFull(true), true")
        SystemClock.sleep(300)
        val colors = editor.evaluateJson(
            """(function() {
                var selection = document.querySelector('.ace_marker-layer .ace_selection');
                var word = document.querySelector('.ace_marker-layer .ace_selected-word');
                return {
                    selection: selection ? getComputedStyle(selection).backgroundColor : '',
                    word: word ? getComputedStyle(word).backgroundColor : 'none'
                };
            })()""",
        )
        assertEquals("rgb(102, 92, 84)", colors.getString("selection"))
        assertTrue("same-word markers are only outlined: $colors", colors.getString("word") in setOf("none", "rgba(0, 0, 0, 0)", "transparent"))
    }

    // -----------------------------------------------------------------------------------------------------------------

    private fun withEditor(
        document: String,
        preferences: Map<String, Any?> = emptyMap(),
        body: (AceDeviceTestHarness) -> Unit,
    ) {
        AceDeviceTestHarness.open(document, preferences = preferences).use { editor ->
            Log.i(LOG_TAG, "device ${editor.device}")
            body(editor)
        }
    }

    private fun firstVisibleRow(editor: AceDeviceTestHarness): Int =
        editor.evaluateInt("window.editor.renderer.getFirstFullyVisibleRow()")

    private fun documentPositionAt(editor: AceDeviceTestHarness, point: AceDeviceTestHarness.Point): Pair<Int, Int> {
        val location = IntArray(2)
        editor.onEditor { it.webView.getLocationOnScreen(location) }
        val position = editor.evaluateJson(
            "(function() { var dpr = window.devicePixelRatio; return window.editor.renderer.screenToTextCoordinates(" +
                "(${point.x} - ${location[0]}) / dpr, (${point.y} - ${location[1]}) / dpr); })()",
        )
        return position.getInt("row") to position.getInt("column")
    }

    private fun popupOpen(editor: AceDeviceTestHarness): Boolean =
        editor.evaluateBoolean("window.editor.completer && window.editor.completer.popup && window.editor.completer.popup.isOpen")

    private fun popupGeometry(editor: AceDeviceTestHarness): JSONObject = editor.evaluateJson(
        """(function() {
            var popup = window.editor.completer.popup;
            var rect = popup.container.getBoundingClientRect();
            return {
                x: rect.left + rect.width / 3,
                top: rect.top,
                lineHeight: popup.renderer.lineHeight,
                firstRow: popup.getFirstVisibleRow(),
                scrollTop: popup.renderer.getScrollTop(),
                height: rect.height,
                selected: popup.getRow(),
                rows: popup.data ? popup.data.length : 0
            };
        })()""",
    )

    /** The truncation button, scrolled into view (it follows the first 4096 characters of the line). */
    private fun buttonRect(editor: AceDeviceTestHarness): JSONObject? {
        val visibleRight = editor.visibleRightCss()
        val raw = editor.evaluateString(
            """(function() {
                var renderer = window.editor.renderer;
                var button = document.querySelector('.ace_inline_button.ace_toggle_wrap');
                if (!button) return '';
                var rect = button.getBoundingClientRect();
                var scroller = renderer.scroller.getBoundingClientRect();
                if (rect.right > scroller.right - 8 || rect.left < scroller.left) {
                    // The button follows the first 4096 characters; let Ace scroll there.
                    window.editor.moveCursorTo(6, 4096 + 14);
                    renderer.scrollCursorIntoView({ row: 6, column: 4096 + 40 });
                    renderer.updateFull(true);
                    button = document.querySelector('.ace_inline_button.ace_toggle_wrap');
                    if (!button) return '';
                    rect = button.getBoundingClientRect();
                }
                var visibleRight = Math.min(scroller.right, window.innerWidth, __VISIBLE_RIGHT__);
                if (rect.right > visibleRight - 8 || rect.left < scroller.left) {
                    renderer.scrollToX(Math.max(0, renderer.getScrollLeft() + rect.left - scroller.left - (visibleRight - scroller.left) / 2));
                    renderer.updateFull(true);
                    button = document.querySelector('.ace_inline_button.ace_toggle_wrap');
                    if (!button) return '';
                    rect = button.getBoundingClientRect();
                }
                if (!rect.width || rect.right > visibleRight || rect.left < scroller.left) return '';
                return JSON.stringify({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, innerWidth: window.innerWidth });
            })()""".replace("__VISIBLE_RIGHT__", visibleRight.toString()),
        )
        return raw.takeIf { it.isNotEmpty() }?.let(::JSONObject)
    }

    private fun installActionModeTrace(editor: AceDeviceTestHarness) {
        editor.evaluate(
            """(function() {
                var editor = window.editor;
                window.__autojs6ActionModeTrace = [];
                ['startActionMode', 'startActionModeIfSelectionInView', 'startInsertionActionMode', 'finishActionMode'].forEach(function(name) {
                    var original = editor[name];
                    if (typeof original !== 'function') return;
                    editor[name] = function() {
                        window.__autojs6ActionModeTrace.push(name);
                        return original.apply(this, arguments);
                    };
                });
                return true;
            })()""",
        )
    }

    private fun actionModeTrace(editor: AceDeviceTestHarness): List<String> {
        val trace = editor.evaluateArray("window.__autojs6ActionModeTrace || []")
        return (0 until trace.length()).map { trace.getString(it) }
    }

    private fun rowsAtScrollPosition(editor: AceDeviceTestHarness): Boolean = editor.evaluateBoolean(
        """(function() {
            var r = window.editor.renderer, s = window.editor.session, c = r.layerConfig;
            return s.documentToScreenRow(c.firstRow, 0) === c.firstRowScreen &&
                Math.abs(c.firstRowScreen * c.lineHeight + c.offset - r.scrollTop) < 1;
        })()""",
    )

    private companion object {
        const val LOG_TAG = "AutoJs6AceCoverage"
        const val BLANK_ROW = 5

        val TOUCH_DOCUMENT = (0 until 120).joinToString("\n") { row ->
            "line$row alpha beta gamma delta epsilon zeta eta theta iota kappa lambda $row"
        }

        val TOUCH_DOCUMENT_WITH_BLANK_LINE = (0 until 60).joinToString("\n") { row ->
            if (row == BLANK_ROW) "" else "line$row alpha beta gamma delta epsilon zeta $row"
        }

        val COMPLETION_DOCUMENT = (1..30).joinToString(" ", prefix = "var words = \"", postfix = "\";\n") { "alpha$it" }

        // Below the first rows: on edge-to-edge tablets they lie under the status bar, which takes their touches.
        val LONG_LINE_DOCUMENT = (0 until 6).joinToString("") { "// line $it\n" } +
            "var data = \"" + "x".repeat(120_000) + "\";\nvar after = 1;\n"

        val WRAP_DOCUMENT = (0 until 300).joinToString("\n") { row ->
            "const filler$row = formatItem(\"filler $row\", $row) + counter;"
        }
    }
}
