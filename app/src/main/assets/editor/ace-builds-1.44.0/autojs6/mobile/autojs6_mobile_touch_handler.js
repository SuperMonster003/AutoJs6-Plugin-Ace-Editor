// Touch interactions of the AutoJs6 mobile overlay (Roadmap-Ace-1.44.0.md A2-4, A2-5, A2-9).
//
// Ace 1.44.0 is used unmodified. The overlay removes Ace's own touch listeners from the editor container and
// installs the touch behavior of the Ace 1.4.12 Auto.js build, which the host and its users are used to:
//   - tap (lifted within 100 ms) moves the cursor and asks the host for the soft keyboard;
//   - a second tap within 300 ms near the first one selects the word;
//   - a 500 ms long press selects the word (or keeps a selection under the finger) and starts the ActionMode;
//   - a touch near the cursor or selection anchor handle drags it; any other touch scrolls with a fling.
// With Ace's customScrollbar option a touch on a scrollbar drags its thumb (Roadmap-Ace-1.44.0.md A5-3); the 1.4.12
// build had no such scrollbar.
// tools/ace-mobile/README.md documents the exact behavior (including the 1.4.12 quirks that are kept on purpose) and
// tools/ace-mobile/verify-overlay.mjs replays the recorded touch scenarios against the 1.4.12 build.
ace.define(
    "autojs6/mobile/touch_handler",
    [
        "require",
        "exports",
        "module",
        "ace/mouse/mouse_event",
        "ace/lib/event",
        "ace/lib/dom",
        "autojs6/mobile/velocity_tracker",
        "autojs6/mobile/scroller",
        "autojs6/mobile/magnifier"
    ],
    function(require, exports) {
        "use strict";

        var MouseEvent = require("ace/mouse/mouse_event").MouseEvent;
        var event = require("ace/lib/event");
        var dom = require("ace/lib/dom");
        var VelocityTracker = require("autojs6/mobile/velocity_tracker").VelocityTracker;
        var Scroller = require("autojs6/mobile/scroller").Scroller;
        var Magnifier = require("autojs6/mobile/magnifier").Magnifier;

        var MIN_FLING_VELOCITY = 50; // px/s
        var TOUCH_SLOP_PX = 8;
        var HANDLE_HIT_DISTANCE = 3.5; // squared line heights, see handleDistance()
        var NEAR_START_DISTANCE = 2; // squared line heights
        var SCROLL_OVERSHOOT_PX = 200;
        var LONG_PRESS_MS = 500;
        var TAP_MAX_DURATION_MS = 100;
        var DOUBLE_TAP_MS = 300;
        var FLING_FRAME_MS = 2;
        var DRAG_LOOK_AHEAD_COLUMNS = 5;
        // Cancellation reasons after which the current gesture cannot continue. The host also cancels at the start of
        // every single finger scroll ("single_finger_scroll") and around fold placeholder taps; the 1.4.12 touch
        // handler never saw those, so they are ignored here.
        var TERMINAL_CANCEL_REASONS = ["dom_touchcancel", "window_blur", "pinch_zoom_begin", "pinch_action_mode"];

        // options.isMagnifierEnabled(): whether drags show the magnifier.
        // options.capture: register in the capture phase and stop propagation (fallback when Ace's own touch
        // listeners could not be removed).
        exports.addTouchListeners = function(container, editor, options) {
            options = options || {};
            var renderer = editor.renderer;
            var velocityTracker = new VelocityTracker();
            var scroller = new Scroller();
            var magnifier = null;

            var mode = "";
            var start = { x: 0, y: 0, time: 0, scrollTop: 0, scrollLeft: 0, position: null };
            var lastMoveX = 0;
            var lastMoveY = 0;
            var lastTap = { time: 0, x: 0, y: 0 };
            var maybeTap = false;
            var hasScrolled = false;
            // True after a move step larger than TOUCH_SLOP_PX or when the touch interrupted a fling.
            var flingArmed = false;
            var flingTimer = null;
            // As in 1.4.12 the timer id is kept after clearTimeout; while it is set, moves back near the start of the
            // touch are ignored (see tools/ace-mobile/README.md).
            var longPressTimer = null;
            // The custom scrollbar under the finger while mode is "scrollbar".
            var scrollbarDrag = null;

            function isMagnifierEnabled() {
                return typeof options.isMagnifierEnabled === "function" && !!options.isMagnifierEnabled();
            }

            function getMagnifier() {
                if (!magnifier) {
                    magnifier = new Magnifier(container, editor);
                }
                return magnifier;
            }

            function hideMagnifier() {
                if (magnifier) {
                    magnifier.hide();
                }
            }

            function isInGutter(target) {
                if (target === editor.container) {
                    return dom.hasCssClass(target, "ace_gutter");
                }
                while (target && target !== editor.container) {
                    if (dom.hasCssClass(target, "ace_gutter")) {
                        return true;
                    }
                    target = target.parentNode;
                }
                return false;
            }

            function isInside(target, element) {
                while (target) {
                    if (target === element) {
                        return true;
                    }
                    if (target === editor.container) {
                        return false;
                    }
                    target = target.parentNode;
                }
                return false;
            }

            // Ace's custom scrollbars listen to mouse events, which the browser does not generate for touches whose
            // touchstart was prevented, so the overlay drags their thumbs itself.
            function customScrollbarAt(target) {
                if (typeof editor.getOption !== "function" || editor.getOption("customScrollbar") !== true) {
                    return null;
                }
                var bars = [renderer.scrollBarV, renderer.scrollBarH];
                for (var i = 0; i < bars.length; i++) {
                    var bar = bars[i];
                    if (bar && bar.element && isInside(target, bar.element)) {
                        // A scrollbar that has not been rendered yet has no thumb geometry; scroll normally then.
                        var vertical = bar === renderer.scrollBarV;
                        var thumbStart = vertical ? bar.thumbTop : bar.thumbLeft;
                        var thumbSize = vertical ? bar.thumbHeight : bar.thumbWidth;
                        return isFinite(thumbStart) && isFinite(thumbSize) ? bar : null;
                    }
                }
                return null;
            }

            function dragCustomScrollbar(clientX, clientY) {
                var bar = scrollbarDrag.bar;
                var thumbOffset = scrollbarDrag.vertical ? clientY - start.y : clientX - start.x;
                var value = scrollbarDrag.vertical ?
                    bar.scrollTopFromThumbTop(scrollbarDrag.thumbStart + thumbOffset) :
                    bar.scrollLeftFromThumbLeft(scrollbarDrag.thumbStart + thumbOffset);
                // The same event the scrollbar emits for mouse drags; the renderer applies it.
                bar._emit("scroll", { data: value });
            }

            // A touch on the thumb drags it; a touch elsewhere on the track first centers the thumb under the finger.
            function startCustomScrollbarDrag(bar, x, y) {
                var vertical = bar === renderer.scrollBarV;
                var thumbStart = vertical ? bar.thumbTop : bar.thumbLeft;
                var thumbSize = vertical ? bar.thumbHeight : bar.thumbWidth;
                var rect = bar.element.getBoundingClientRect();
                var touchOffset = vertical ? y - rect.top : x - rect.left;
                scrollbarDrag = { bar: bar, vertical: vertical, thumbStart: thumbStart };
                if (touchOffset < thumbStart || touchOffset > thumbStart + thumbSize) {
                    scrollbarDrag.thumbStart = touchOffset - thumbSize / 2;
                    dragCustomScrollbar(x, y);
                }
            }

            function scrollBounds() {
                return {
                    minX: 0,
                    maxX: renderer.layerConfig.width - renderer.$size.scrollerWidth + SCROLL_OVERSHOOT_PX,
                    minY: 0,
                    maxY: renderer.layerConfig.maxHeight - renderer.$size.scrollerHeight + SCROLL_OVERSHOOT_PX
                };
            }

            // Squared distance in line heights from a point 0.75 line below the given offset, where the drag handle
            // sits under the cursor. Both axes use the line height.
            function handleDistance(dx, dy) {
                var lineHeight = renderer.layerConfig.lineHeight;
                dx /= lineHeight;
                dy = dy / lineHeight - 0.75;
                return dx * dx + dy * dy;
            }

            function handleDistanceTo(position, clientX, clientY) {
                var rect = renderer.scroller.getBoundingClientRect();
                var pixel = renderer.$cursorLayer.getPixelPosition(position, true);
                return handleDistance(
                    clientX - rect.left - pixel.left + renderer.scrollLeft,
                    clientY - rect.top - pixel.top + renderer.layerConfig.offset
                );
            }

            function detectMode(e) {
                if (e.touches.length > 2) {
                    return "";
                }
                if (e.touches.length === 2) {
                    return "zoom";
                }
                var selection = editor.selection;
                var cursorDistance = handleDistanceTo(selection.cursor, e.clientX, e.clientY);
                if (selection.isEmpty()) {
                    return cursorDistance < HANDLE_HIT_DISTANCE ? "cursor" : "scroll";
                }
                var anchorDistance = handleDistanceTo(selection.anchor, e.clientX, e.clientY);
                if (cursorDistance < HANDLE_HIT_DISTANCE && anchorDistance < HANDLE_HIT_DISTANCE) {
                    return cursorDistance < anchorDistance ? "cursor" : "anchor";
                }
                if (anchorDistance < HANDLE_HIT_DISTANCE) {
                    return "anchor";
                }
                return cursorDistance < HANDLE_HIT_DISTANCE ? "cursor" : "scroll";
            }

            function focusAndShowSoftInput() {
                var windowBlurred = !document.hasFocus ||
                    !document.hasFocus() ||
                    (!editor.isFocused() &&
                        document.activeElement === (editor.textInput && editor.textInput.getElement()));
                if (windowBlurred) {
                    window.focus();
                }
                editor.focus();
                if (typeof autojs !== "undefined") {
                    autojs.showSoftInput();
                }
            }

            function isTouchInsideSelection() {
                var selection = editor.selection;
                if (selection.getRange().isEmpty()) {
                    return false;
                }
                var cursor = selection.cursor;
                var anchor = selection.anchor;
                var cursorPosition = renderer.getClientPosition(cursor);
                var anchorPosition = renderer.getClientPosition(anchor);
                var lineHeight = renderer.layerConfig.lineHeight;
                var top = Math.min(cursorPosition.y, anchorPosition.y) - TOUCH_SLOP_PX;
                var bottom = Math.max(cursorPosition.y, anchorPosition.y) + lineHeight + TOUCH_SLOP_PX;
                var inside = start.y > top && start.y < bottom;
                // The horizontal bounds are only checked for single line selections.
                if (inside && cursor.row === anchor.row) {
                    var left = Math.min(cursorPosition.x, anchorPosition.x) - TOUCH_SLOP_PX;
                    var right = Math.max(cursorPosition.x, anchorPosition.x) + TOUCH_SLOP_PX;
                    inside = start.x > left && start.x < right;
                }
                return inside;
            }

            function onLongPress() {
                longPressTimer = null;
                if (isTouchInsideSelection()) {
                    mode = "long_tap";
                } else {
                    editor.selection.moveToPosition(start.position);
                    editor.selection.selectWord();
                    mode = "cursor";
                }
                editor.startActionMode();
                if (typeof autojs !== "undefined") {
                    autojs.performLongPressFeedback();
                }
            }

            function selectWordAt(position) {
                var wordRange = editor.selection.getWordRange(position.row, position.column);
                var before = wordRange.comparePoint(position) === -1;
                var anchor = before ? wordRange.end : wordRange.start;
                var cursor = before ? wordRange.start : wordRange.end;
                editor.selection.setSelectionAnchor(anchor.row, anchor.column);
                editor.selection.selectToPosition(cursor);
                renderer.scrollCursorIntoView();
                editor.startActionModeIfSelectionInView(true);
            }

            function stopFlingTimer() {
                if (flingTimer) {
                    clearInterval(flingTimer);
                    flingTimer = null;
                }
            }

            // Returns true when a fling animation was started.
            function startFling() {
                stopFlingTimer();
                if (!flingArmed || !velocityTracker.computeVelocity(1e3)) {
                    return false;
                }
                var velocityY = velocityTracker.velocityY;
                var velocityX = velocityTracker.velocityX;
                // Keep the dominant axis; the second check compares with the already filtered horizontal velocity.
                if (Math.abs(velocityX) < MIN_FLING_VELOCITY || Math.abs(velocityX) < Math.abs(velocityY)) {
                    velocityX = 0;
                }
                if (Math.abs(velocityY) < MIN_FLING_VELOCITY || Math.abs(velocityY) < Math.abs(velocityX)) {
                    velocityY = 0;
                }
                if (velocityX === 0 && velocityY === 0) {
                    return false;
                }
                scroller.fling(renderer.getScrollLeft(), renderer.getScrollTop(), velocityX, velocityY * 2, scrollBounds());
                flingTimer = setInterval(function() {
                    if (scroller.computeScrollOffset()) {
                        renderer.scrollTo(scroller.currX, scroller.currY);
                    } else {
                        stopFlingTimer();
                        editor.startActionModeIfSelectionInView(false);
                    }
                }, FLING_FRAME_MS);
                return true;
            }

            function onTouchStart(e) {
                if (isInGutter(e.target)) {
                    return;
                }
                var touches = e.touches;
                var x = (e.clientX = touches[0].clientX);
                var y = (e.clientY = touches[0].clientY);
                velocityTracker.clear();
                flingArmed = !scroller.isFinished();
                if (flingArmed) {
                    scroller.abortAnimation();
                }
                stopFlingTimer();
                start.x = x;
                start.y = y;
                start.time = e.timeStamp;
                var scrollbar = touches.length === 1 ? customScrollbarAt(e.target) : null;
                if (scrollbar) {
                    if (longPressTimer) {
                        clearTimeout(longPressTimer);
                    }
                    maybeTap = false;
                    mode = "scrollbar";
                    startCustomScrollbarDrag(scrollbar, x, y);
                    editor.finishActionMode();
                    e.preventDefault();
                    return;
                }
                scrollbarDrag = null;
                start.scrollTop = renderer.getScrollTop();
                start.scrollLeft = renderer.getScrollLeft();
                lastMoveX = x;
                lastMoveY = y;
                hasScrolled = false;
                start.position = new MouseEvent(e, editor).getDocumentPosition();
                velocityTracker.addMovement(x, y, e.timeStamp);
                mode = detectMode(e);
                if (longPressTimer) {
                    clearTimeout(longPressTimer);
                }
                if (mode !== "zoom" && touches.length === 1) {
                    longPressTimer = setTimeout(onLongPress, LONG_PRESS_MS);
                    maybeTap = true;
                }
                editor.finishActionMode();
                e.preventDefault();
            }

            function onTouchEnd(e) {
                if (longPressTimer) {
                    clearTimeout(longPressTimer);
                }
                hideMagnifier();
                if (mode === "zoom") {
                    mode = "";
                    return;
                }
                if (mode === "scrollbar") {
                    mode = "";
                    scrollbarDrag = null;
                    editor.startActionModeIfSelectionInView(false);
                    return;
                }
                if (maybeTap && e.timeStamp - start.time < TAP_MAX_DURATION_MS) {
                    var touch = e.changedTouches[0];
                    var isDoubleTap = e.timeStamp - lastTap.time < DOUBLE_TAP_MS &&
                        handleDistance(lastTap.x - start.x, lastTap.y - start.y) < NEAR_START_DISTANCE;
                    lastTap = { time: e.timeStamp, x: touch.clientX, y: touch.clientY };
                    if (isDoubleTap) {
                        selectWordAt(start.position);
                        e.preventDefault();
                        return;
                    }
                    editor.selection.moveToPosition(start.position);
                    renderer.scrollCursorIntoView();
                    focusAndShowSoftInput();
                }
                if (mode === "cursor" && editor.selection.getRange().isEmpty()) {
                    editor.startActionMode(false);
                    return;
                }
                if (mode === "anchor" || mode === "cursor") {
                    editor.startActionModeIfSelectionInView(true);
                    return;
                }
                if (mode === "scroll" && !startFling()) {
                    editor.startActionModeIfSelectionInView(false);
                }
            }

            function onTouchMove(e) {
                var touches = e.touches;
                if (mode === "zoom") {
                    // Pinch zoom is handled by the bridge in the capture phase (suppressAceBuiltInPinchZoom).
                    return;
                }
                if (touches.length > 1) {
                    maybeTap = false;
                    if (longPressTimer) {
                        clearTimeout(longPressTimer);
                    }
                    editor.finishActionMode();
                    return;
                }
                var x = (e.clientX = touches[0].clientX);
                var y = (e.clientY = touches[0].clientY);
                if (mode === "scrollbar") {
                    if (scrollbarDrag) {
                        dragCustomScrollbar(x, y);
                    }
                    e.preventDefault();
                    return;
                }
                var nearStart = handleDistance(x - start.x, y - start.y) < NEAR_START_DISTANCE;
                if (nearStart && mode === "scroll" && !hasScrolled) {
                    return;
                }
                if (nearStart && (longPressTimer || mode === "long_tap")) {
                    return;
                }
                editor.finishActionMode();
                maybeTap = false;
                if (longPressTimer) {
                    clearTimeout(longPressTimer);
                }
                if (mode === "scroll") {
                    var bounds = scrollBounds();
                    var scrollLeft = Math.min(bounds.maxX, Math.max(bounds.minX, start.scrollLeft - (x - start.x)));
                    var scrollTop = Math.min(bounds.maxY, Math.max(bounds.minY, start.scrollTop - (y - start.y)));
                    renderer.scrollTo(scrollLeft, scrollTop);
                    hasScrolled = true;
                    editor._emit("touchscroll");
                    velocityTracker.addMovement(x, y, e.timeStamp);
                    if (!flingArmed &&
                        (Math.abs(lastMoveX - x) > TOUCH_SLOP_PX || Math.abs(lastMoveY - y) > TOUCH_SLOP_PX)) {
                        flingArmed = true;
                    }
                } else {
                    var position = new MouseEvent(e, editor).getDocumentPosition();
                    if (mode === "cursor") {
                        editor.selection.moveCursorToPosition(position);
                    } else if (mode === "anchor") {
                        editor.selection.setSelectionAnchor(position.row, position.column);
                    }
                    if ((mode === "cursor" || mode === "anchor") && isMagnifierEnabled()) {
                        getMagnifier().show(position, { x: x, y: y });
                    }
                    // "long_tap" only scrolls; keep a few columns visible in the drag direction.
                    var direction = x > start.x ? 1 : -1;
                    renderer.scrollCursorIntoView({
                        row: position.row,
                        column: position.column + DRAG_LOOK_AHEAD_COLUMNS * direction
                    });
                    e.preventDefault();
                }
                lastMoveX = x;
                lastMoveY = y;
            }

            var listeners = { touchstart: onTouchStart, touchend: onTouchEnd, touchmove: onTouchMove };
            Object.keys(listeners).forEach(function(type) {
                var listener = listeners[type];
                if (options.capture) {
                    var captured = function(e) {
                        listener(e);
                        e.stopPropagation();
                    };
                    container.addEventListener(type, captured, { capture: true, passive: false });
                    listeners[type] = captured;
                } else {
                    event.addListener(container, type, listener, editor);
                }
            });

            return {
                // Stops a pending long press, a fling and the magnifier when the gesture ended outside the handler
                // (touch cancel, window blur, pinch). The touch mode is kept, as remaining fingers may still move.
                cancel: function(reason) {
                    if (TERMINAL_CANCEL_REASONS.indexOf(String(reason)) < 0) {
                        return false;
                    }
                    if (longPressTimer) {
                        clearTimeout(longPressTimer);
                        longPressTimer = null;
                    }
                    stopFlingTimer();
                    scroller.abortAnimation();
                    hideMagnifier();
                    return true;
                },
                hideMagnifier: hideMagnifier,
                isMagnifierCreated: function() {
                    return !!magnifier;
                }
            };
        };
    }
);

(function(global) {
    "use strict";

    // Listeners that ace/mouse/touch_handler registers on the editor container (Ace 1.44.0).
    var UPSTREAM_TOUCH_LISTENER_TYPES = ["touchstart", "touchmove", "touchend", "contextmenu"];

    function removeUpstreamTouchListeners(editor) {
        var listeners = editor.$toDestroy || [];
        var removed = 0;
        for (var i = listeners.length - 1; i >= 0; i--) {
            var listener = listeners[i];
            if (listener && listener.elem === editor.container &&
                UPSTREAM_TOUCH_LISTENER_TYPES.indexOf(listener.type) >= 0 &&
                typeof listener.destroy === "function") {
                listener.destroy();
                listeners.splice(i, 1);
                removed++;
            }
        }
        return removed;
    }

    // Installs the overlay right after ace.edit(). options.isMagnifierEnabled(): host setting;
    // options.onRecoverableError(scope, error): reports the capture fallback.
    function install(editor, options) {
        options = options || {};
        var state = {
            installed: false,
            uninstalledUpstreamListeners: 0,
            fallbackCapture: false,
            magnifier: false
        };
        state.uninstalledUpstreamListeners = removeUpstreamTouchListeners(editor);
        if (state.uninstalledUpstreamListeners !== UPSTREAM_TOUCH_LISTENER_TYPES.length) {
            state.fallbackCapture = true;
            if (typeof options.onRecoverableError === "function") {
                options.onRecoverableError("mobileOverlay", new Error(
                    "Removed " + state.uninstalledUpstreamListeners + " of " +
                    UPSTREAM_TOUCH_LISTENER_TYPES.length + " Ace touch listeners; using capture listeners"
                ));
            }
        }
        if (editor.$mouseHandler) {
            editor.$mouseHandler.isMousePressed = false;
        }
        if (editor.renderer) {
            editor.renderer.$isMousePressed = false;
        }

        global.ace.require("autojs6/mobile/action_mode").install(editor);

        // The 1.4.12 build only suppressed the browser context menu; Ace 1.44.0 would also move the hidden
        // textarea under the finger. TextInput.$onContextMenu calls host.textInput.onContextMenu, so an instance
        // override is enough.
        if (editor.textInput) {
            editor.textInput.onContextMenu = function(e) {
                if (e && e.preventDefault) {
                    e.preventDefault();
                }
            };
        }
        // As in 1.4.12 the gutter tooltip also hides when the content scrolls under the finger.
        editor.on("touchscroll", function() {
            var tooltip = editor.$mouseHandler && editor.$mouseHandler.$tooltip;
            if (tooltip && tooltip.isOpen && typeof tooltip.hide === "function") {
                tooltip.hide();
            }
        });

        var controller = global.ace.require("autojs6/mobile/touch_handler").addTouchListeners(
            editor.container,
            editor,
            {
                capture: state.fallbackCapture,
                isMagnifierEnabled: options.isMagnifierEnabled
            }
        );
        state.installed = true;

        return {
            cancel: controller.cancel,
            hideMagnifier: controller.hideMagnifier,
            getState: function() {
                return {
                    installed: state.installed,
                    uninstalledUpstreamListeners: state.uninstalledUpstreamListeners,
                    fallbackCapture: state.fallbackCapture,
                    magnifier: typeof options.isMagnifierEnabled === "function" && !!options.isMagnifierEnabled()
                };
            }
        };
    }

    global.AutoJsAceMobile = {
        install: install,
        removeUpstreamTouchListeners: removeUpstreamTouchListeners
    };
})(/** @type {Window} */ (typeof window !== "undefined" ? window : this));
