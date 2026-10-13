// Reconstructed from the Auto.js customized Ace build (ace-builds-1.4.12/src-min-noconflict/ace.js).
// Module: "ace/mouse/touch_handler" (replaces the upstream module completely);
// original bytes: original/touch_handler.min.js.
//
// The customized MouseHandler calls addTouchListeners(editor.container, editor, mouseHandler)
// (original/mouse_handler-touch-listeners-call.min.js). The handler depends on the editor additions in
// editor-action-mode.js, on VirtualRenderer.getClientPosition (virtual_renderer-get-client-position.js) and on
// the host bridge object `autojs`. This reconstruction is a reference for porting and auditing.
ace.define(
    "ace/mouse/touch_handler",
    [
        "require",
        "exports",
        "module",
        "ace/mouse/mouse_event",
        "ace/lib/event",
        "ace/lib/dom",
        "ace/mouse/velocity-tracker.js",
        "ace/mouse/scroller.js",
        "ace/mouse/magnifier.js",
    ],
    function (require, exports, module) {
        "use strict";
        var MouseEvent = require("./mouse_event").MouseEvent;
        var event = require("../lib/event");
        var dom = require("../lib/dom");

        exports.addTouchListeners = function (el, editor, mouseHandler) {
            // Scroll range including SCROLL_OVERSHOOT_PX of extra room after the last line and column.
            function getScrollBounds() {
                return {
                    minX: 0,
                    maxX: renderer.layerConfig.width - renderer.$size.scrollerWidth + SCROLL_OVERSHOOT_PX,
                    minY: 0,
                    maxY: renderer.layerConfig.maxHeight - renderer.$size.scrollerHeight + SCROLL_OVERSHOOT_PX,
                };
            }

            function isInGutter(target) {
                return hasCssClassInAncestors(target, "ace_gutter");
            }

            function hasCssClassInAncestors(element, className) {
                if (element == editor.container) return dom.hasCssClass(element, className);
                for (;;) {
                    if (dom.hasCssClass(element, className)) return true;
                    element = element.parentNode;
                    if (!element || element == editor.container) return false;
                }
            }

            // Returns true when a fling animation was started.
            function startFling() {
                if (flingTimer) clearInterval(flingTimer);
                if (!flingArmed || !velocityTracker.computeVelocity(1e3)) return false;
                var velocityY = velocityTracker.getYVelocity();
                var velocityX = velocityTracker.getXVelocity();
                if (Math.abs(velocityX) < MIN_FLING_VELOCITY || Math.abs(velocityX) < Math.abs(velocityY)) velocityX = 0;
                // Compares with the already filtered velocityX.
                if (Math.abs(velocityY) < MIN_FLING_VELOCITY || Math.abs(velocityY) < Math.abs(velocityX)) velocityY = 0;
                if (velocityX == 0 && velocityY == 0) return false;
                var bounds = getScrollBounds();
                scroller.fling(
                    renderer.getScrollLeft(),
                    renderer.getScrollTop(),
                    velocityX,
                    velocityY * 2,
                    bounds.minX,
                    bounds.maxX,
                    bounds.minY,
                    bounds.maxY,
                );
                flingTimer = setInterval(function () {
                    if (scroller.computeScrollOffset()) {
                        renderer.scrollTo(scroller.getCurrX(), scroller.getCurrY());
                    } else {
                        clearInterval(flingTimer);
                        flingTimer = null;
                        editor.startActionModeIfSelectionInView(false);
                    }
                }, FLING_FRAME_MS);
                return true;
            }

            function focusAndShowSoftInput() {
                var windowBlurred =
                    !document.hasFocus ||
                    !document.hasFocus() ||
                    (!editor.isFocused() &&
                        document.activeElement == (editor.textInput && editor.textInput.getElement()));
                if (windowBlurred) window.focus();
                editor.focus();
                if (typeof autojs != "undefined") autojs.showSoftInput();
            }

            function onLongPress() {
                longPressTimer = null;
                var range = editor.selection.getRange();
                var cursor = editor.selection.cursor;
                var cursorPosition = editor.renderer.getClientPosition(cursor);
                var lineHeight = editor.renderer.layerConfig.lineHeight;
                var inSelection = true;
                if (range.isEmpty()) {
                    inSelection = false;
                } else {
                    var anchor = editor.selection.anchor;
                    var anchorPosition = editor.renderer.getClientPosition(anchor);
                    var top = Math.min(cursorPosition.y, anchorPosition.y) - TOUCH_SLOP_PX;
                    var bottom = Math.max(cursorPosition.y, anchorPosition.y) + lineHeight + TOUCH_SLOP_PX;
                    inSelection = touchStartY > top && touchStartY < bottom;
                    // The horizontal bounds are only checked for single line selections.
                    if (cursor.row == anchor.row && inSelection) {
                        var left = Math.min(cursorPosition.x, anchorPosition.x) - TOUCH_SLOP_PX;
                        var right = Math.max(cursorPosition.x, anchorPosition.x) + TOUCH_SLOP_PX;
                        inSelection = touchStartX > left && touchStartX < right;
                    }
                }
                if (inSelection) {
                    mode = "long_tap";
                } else {
                    editor.selection.moveToPosition(touchStartPosition);
                    editor.selection.selectWord();
                    mode = "cursor";
                }
                editor.startActionMode();
                if (typeof autojs != "undefined") autojs.performLongPressFeedback();
            }

            function selectWordAt(position) {
                var wordRange = editor.selection.getWordRange(position.row, position.column);
                selectRangeAround(position, wordRange);
            }

            function selectRangeAround(position, range) {
                var anchor;
                var cursor = position;
                var comparison = range.comparePoint(cursor);
                if (comparison == -1) {
                    anchor = range.end;
                    cursor = range.start;
                } else {
                    anchor = range.start;
                    cursor = range.end;
                }
                editor.selection.setSelectionAnchor(anchor.row, anchor.column);
                editor.selection.selectToPosition(cursor);
                editor.renderer.scrollCursorIntoView();
                editor.startActionModeIfSelectionInView(true);
            }

            // "zoom" for two fingers, "" for more; otherwise "cursor" / "anchor" when the touch starts near the
            // cursor or selection anchor handle, else "scroll".
            function detectMode(e) {
                if (e.touches.length > 2) return "";
                if (e.touches.length == 2) return "zoom";
                var rect = editor.renderer.scroller.getBoundingClientRect();
                var offsetY = zoom * editor.renderer.layerConfig.offset;
                var offsetX = zoom * editor.renderer.scrollLeft;
                var selectionEmpty = editor.selection.isEmpty();
                var cursor = editor.selection.cursor;
                var cursorPixel = editor.renderer.$cursorLayer.getPixelPosition(cursor, true);
                var cursorDistance = handleDistance(
                    e.clientX - zoom * rect.left - zoom * cursorPixel.left + offsetX,
                    e.clientY - zoom * rect.top - zoom * cursorPixel.top + offsetY,
                );
                if (selectionEmpty) return cursorDistance < HANDLE_HIT_DISTANCE ? "cursor" : "scroll";
                var anchor = editor.selection.anchor;
                var anchorPixel = editor.renderer.$cursorLayer.getPixelPosition(anchor, true);
                var anchorDistance = handleDistance(
                    e.clientX - zoom * rect.left - zoom * anchorPixel.left + offsetX,
                    e.clientY - zoom * rect.top - zoom * anchorPixel.top + offsetY,
                );
                if (cursorDistance < HANDLE_HIT_DISTANCE && anchorDistance < HANDLE_HIT_DISTANCE) {
                    return cursorDistance < anchorDistance ? "cursor" : "anchor";
                }
                if (anchorDistance < HANDLE_HIT_DISTANCE) return "anchor";
                if (cursorDistance < HANDLE_HIT_DISTANCE) return "cursor";
                return "scroll";
            }

            // Squared distance in line heights, measured from a point 0.75 line below the given offset
            // (where the handle is drawn below the cursor). Also used as the "near the start" test (< 2).
            function handleDistance(dx, dy) {
                var verticalUnit = editor.renderer.layerConfig.lineHeight;
                var horizontalUnit = editor.renderer.layerConfig.lineHeight;
                dx /= horizontalUnit;
                dy = dy / verticalUnit - 0.75;
                return dx * dx + dy * dy;
            }

            function distance(dx, dy) {
                return Math.sqrt(dx * dx + dy * dy);
            }

            // Defined by the original module but never called.
            function scrollSelectionIntoViewWithMargin() {
                var cursor = editor.selection.cursor;
                var anchor = editor.selection.anchor;
                if (anchor.row > cursor.row || anchor.column > cursor.column) {
                    var swap = cursor;
                    cursor = anchor;
                    anchor = swap;
                }
                var start = { row: anchor.row, column: anchor.column - 5 };
                var end = { row: cursor.row, column: cursor.column + 5 };
                editor.renderer.scrollSelectionIntoView(start, end);
            }

            var VelocityTracker = require("./velocity-tracker.js").VelocityTracker;
            var Scroller = require("./scroller.js").Scroller;
            var Magnifier = require("./magnifier.js").Magnifier;
            var velocityTracker = new VelocityTracker();
            var scroller = Scroller.createDefault();
            var magnifier = new Magnifier(el, editor);

            var MIN_FLING_VELOCITY = 50; // px/s
            var TOUCH_SLOP_PX = 8;
            var HANDLE_HIT_DISTANCE = 3.5; // squared line heights, see handleDistance()
            var SCROLL_OVERSHOOT_PX = 200;
            var LONG_PRESS_MS = 500;
            var MIN_ZOOM = 0.4;
            var MAX_ZOOM = 2;
            var ZOOM_DAMPING = 0.5;
            var ZOOM_STEPS = 10;
            var TAP_MAX_DURATION_MS = 100;
            var DOUBLE_TAP_MS = 300;
            var FLING_FRAME_MS = 2;

            var touchStartTime = 0;
            var touchStartY = 0;
            var touchStartX = 0;
            var touchStartPosition = null;
            var touchStartScrollTop = 0;
            var touchStartScrollLeft = 0;
            var renderer = editor.renderer;
            var flingTimer = null;
            var lastMoveX = 0;
            var lastMoveY = 0;
            // True after a move step larger than TOUCH_SLOP_PX or when the touch interrupted a fling.
            var flingArmed = false;
            var mode = "";
            var longPressTimer = null;
            var hasScrolled = false;
            var zoomStartDistance = 0;
            var zoomStartScale = 1;
            var zoomCenterX = 0;
            var zoomCenterY = 0;
            var zoom = 1;
            var maybeTap = false;
            var lastTapTime = 0;
            var lastTapX = 0;
            var lastTapY = 0;
            var container = editor.container;

            event.addListener(
                container,
                "touchstart",
                function (e) {
                    // `editor.popup` is never assigned by Ace 1.4.12 or the AutoJs6 bridge, so only gutter
                    // touches are skipped (the completion popup lives outside the editor container).
                    if (editor.popup || isInGutter(e.target)) return;
                    var touches = e.touches;
                    var touch = touches[0];
                    var x = (e.clientX = touch.clientX);
                    var y = (e.clientY = touch.clientY);
                    velocityTracker.clear();
                    if (scroller.isFinished()) {
                        flingArmed = false;
                    } else {
                        flingArmed = true;
                        scroller.abortAnimation();
                    }
                    if (flingTimer) clearInterval(flingTimer);
                    touchStartY = y;
                    touchStartX = x;
                    touchStartScrollTop = renderer.getScrollTop();
                    touchStartScrollLeft = renderer.getScrollLeft();
                    lastMoveX = x;
                    lastMoveY = y;
                    touchStartTime = e.timeStamp;
                    hasScrolled = false;
                    var mouseEvent = new MouseEvent(e, editor);
                    touchStartPosition = mouseEvent.getDocumentPosition();
                    velocityTracker.addMovement({ x: x, y: y }, e.timeStamp);
                    mode = detectMode(e);
                    // Quirk: the timer id is cleared but kept, so later "near start" checks still see it.
                    if (longPressTimer) clearTimeout(longPressTimer);
                    if (mode == "zoom") {
                        zoomStartDistance = distance(
                            touches[1].clientX - touches[0].clientX,
                            touches[1].clientY - touches[0].clientY,
                        );
                        zoomCenterX = (touches[0].clientX + touches[1].clientX) / 2;
                        zoomCenterY = (touches[0].clientY + touches[1].clientY) / 2;
                        zoomStartScale = zoom;
                    } else if (e.touches.length == 1) {
                        longPressTimer = setTimeout(onLongPress, LONG_PRESS_MS);
                        maybeTap = true;
                    }
                    editor.finishActionMode();
                    e.preventDefault();
                },
                editor,
            );

            event.addListener(
                container,
                "touchend",
                function (e) {
                    if (longPressTimer) clearTimeout(longPressTimer);
                    magnifier.hide();
                    if (mode == "zoom") {
                        mode = "";
                        return;
                    }
                    // A tap must end within TAP_MAX_DURATION_MS; slower taps fall through to the mode handling.
                    if (maybeTap && e.timeStamp - touchStartTime < TAP_MAX_DURATION_MS) {
                        var now = e.timeStamp;
                        var touch = e.changedTouches[0];
                        if (
                            now - lastTapTime < DOUBLE_TAP_MS &&
                            handleDistance(lastTapX - touchStartX, lastTapY - touchStartY) < 2
                        ) {
                            lastTapTime = now;
                            lastTapX = touch.clientX;
                            lastTapY = touch.clientY;
                            selectWordAt(touchStartPosition);
                            e.preventDefault();
                            return;
                        }
                        lastTapTime = now;
                        lastTapX = touch.clientX;
                        lastTapY = touch.clientY;
                        editor.selection.moveToPosition(touchStartPosition);
                        editor.renderer.scrollCursorIntoView();
                        focusAndShowSoftInput();
                    }
                    if (mode == "cursor" && editor.selection.getRange().isEmpty()) {
                        editor.startActionMode(false);
                        return;
                    }
                    if (mode == "anchor" || mode == "cursor") {
                        editor.startActionModeIfSelectionInView(true);
                        return;
                    }
                    if (mode == "scroll" && !startFling()) {
                        editor.startActionModeIfSelectionInView(false);
                        return;
                    }
                },
                editor,
            );

            event.addListener(
                container,
                "touchmove",
                function (e) {
                    var touches = e.touches;
                    if (mode == "zoom") {
                        var spread = distance(
                            Math.abs(zoomCenterX - touches[0].clientX) + Math.abs(zoomCenterX - touches[1].clientX),
                            Math.abs(zoomCenterY - touches[0].clientY) + Math.abs(zoomCenterY - touches[1].clientY),
                        );
                        var delta = spread - zoomStartDistance;
                        var scale = (zoomStartDistance + delta * ZOOM_DAMPING) / zoomStartDistance;
                        scale = Math.round(scale * ZOOM_STEPS) / ZOOM_STEPS;
                        var newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, scale * zoomStartScale));
                        zoom = newZoom;
                        magnifier.zoom = zoom;
                        document.body.style.zoom = newZoom;
                        editor.renderer.onResize();
                        return;
                    }
                    if (touches.length > 1 || mode == "zoom") {
                        maybeTap = false;
                        if (longPressTimer) clearTimeout(longPressTimer);
                        editor.finishActionMode();
                        return;
                    }
                    var touch = touches[0];
                    var x = (e.clientX = touch.clientX);
                    var y = (e.clientY = touch.clientY);
                    var nearStart = handleDistance(x - touchStartX, y - touchStartY) < 2;
                    if (nearStart && mode == "scroll" && !hasScrolled) return;
                    if (nearStart && (longPressTimer || mode == "long_tap")) return;
                    editor.finishActionMode();
                    maybeTap = false;
                    if (longPressTimer) clearTimeout(longPressTimer);
                    if (mode == "scroll") {
                        var scrollTop = touchStartScrollTop - (y - touchStartY);
                        var scrollLeft = touchStartScrollLeft - (x - touchStartX);
                        var bounds = getScrollBounds();
                        scrollLeft = Math.min(bounds.maxX, Math.max(bounds.minX, scrollLeft));
                        scrollTop = Math.min(bounds.maxY, Math.max(bounds.minY, scrollTop));
                        renderer.scrollTo(scrollLeft, scrollTop);
                        hasScrolled = true;
                        editor._emit("touchscroll");
                        velocityTracker.addMovement({ x: x, y: y }, e.timeStamp);
                        if (
                            !flingArmed &&
                            (Math.abs(lastMoveX - x) > TOUCH_SLOP_PX || Math.abs(lastMoveY - y) > TOUCH_SLOP_PX)
                        ) {
                            flingArmed = true;
                        }
                    } else {
                        var mouseEvent = new MouseEvent(e, editor);
                        var position = mouseEvent.getDocumentPosition();
                        if (mode == "cursor") {
                            editor.selection.moveCursorToPosition(position);
                            if (mouseHandler.$magnifierEnabled) magnifier.show(position, { x: x, y: y });
                        } else if (mode == "anchor") {
                            editor.selection.setSelectionAnchor(position.row, position.column);
                            if (mouseHandler.$magnifierEnabled) magnifier.show(position, { x: x, y: y });
                        }
                        // "long_tap" only scrolls; the look-ahead keeps 5 columns visible in the drag direction.
                        var direction = x > touchStartX ? 1 : -1;
                        editor.renderer.scrollCursorIntoView({
                            row: position.row,
                            column: position.column + 5 * direction,
                        });
                        e.preventDefault();
                    }
                    lastMoveX = x;
                    lastMoveY = y;
                },
                editor,
            );
        };
    },
);
