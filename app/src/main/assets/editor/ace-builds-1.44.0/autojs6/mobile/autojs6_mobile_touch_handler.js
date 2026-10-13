// Touch interactions of the AutoJs6 mobile overlay (Roadmap-Ace-1.44.0.md A2-4, A2-5, A2-9; rewritten for A0-5).
//
// Ace 1.44.0 is used unmodified. The installer at the end of this file removes Ace's own touch listeners from the
// editor container; TouchGestures then implements the touch behavior specified in tools/ace-mobile/README.md
// ("Behavior"):
//   - a tap (lifted before the long press, without moving) moves the cursor and asks the host for the soft keyboard;
//     a tap on the cursor itself also shows the insertion toolbar (paste);
//   - a second tap within 300 ms near the first one selects the word;
//   - a 500 ms long press selects the word (or keeps a selection under the finger) and starts the ActionMode; on
//     blank space it places the cursor and shows the insertion toolbar;
//   - a touch near the cursor or selection anchor handle drags it; any other touch scrolls and may fling, unless the
//     finger rested before it was lifted;
//   - a touch on the gutter scrolls like the text; a tap there is passed to the host (breakpoints, diagnostics)
//     without focusing the editor;
//   - a tap on Ace's long line overflow button toggles soft wrap, as a mouse click does;
//   - with Ace's customScrollbar option a touch on a visible scrollbar drags its thumb (A5-3).
// tools/ace-mobile/verify-overlay.mjs replays the recorded touch scenarios against the previous editor build; the
// intended differences are listed there.
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

        var LONG_PRESS_MS = 500;
        var DOUBLE_TAP_MS = 300;
        // Android's VelocityTracker assumes that a pointer without movement for this long has stopped.
        var POINTER_STOPPED_MS = 40;
        var FLING_FRAME_MS = 2;
        var FLING_MIN_VELOCITY = 50; // px/s
        var FLING_SLOP_PX = 8;
        var OVERSCROLL_PX = 200;
        var SELECTION_TOUCH_MARGIN_PX = 8;
        var DRAG_LOOK_AHEAD_COLUMNS = 5;
        // Distances measured with HandleGeometry (squared, in line heights).
        var HANDLE_REACH = 3.5;
        var STILL_REACH = 2;
        // Host cancellations after which a gesture cannot go on. The host also cancels when a single finger scroll
        // starts and around fold placeholder taps; those do not concern this handler.
        var TERMINAL_CANCEL_REASONS = ["dom_touchcancel", "window_blur", "pinch_zoom_begin", "pinch_action_mode"];

        var Gesture = {
            NONE: "",
            ZOOM: "zoom",
            CURSOR: "cursor",
            ANCHOR: "anchor",
            SCROLL: "scroll",
            LONG_TAP: "long_tap",
            SCROLLBAR: "scrollbar"
        };

        // Selection handles sit under the caret, 0.75 line below the caret's top. Distances are squared and
        // expressed in line heights on both axes.
        function HandleGeometry(renderer) {
            this.renderer = renderer;
        }

        HandleGeometry.prototype.offsetDistance = function(dx, dy) {
            var lineHeight = this.renderer.layerConfig.lineHeight;
            var across = dx / lineHeight;
            var down = dy / lineHeight - 0.75;
            return across * across + down * down;
        };

        HandleGeometry.prototype.distanceToHandle = function(position, clientX, clientY) {
            var renderer = this.renderer;
            var viewport = renderer.scroller.getBoundingClientRect();
            var caret = renderer.$cursorLayer.getPixelPosition(position, true);
            return this.offsetDistance(
                clientX - viewport.left - caret.left + renderer.scrollLeft,
                clientY - viewport.top - caret.top + renderer.layerConfig.offset
            );
        };

        function TouchGestures(container, editor, options) {
            this.container = container;
            this.editor = editor;
            this.renderer = editor.renderer;
            this.options = options || {};
            this.geometry = new HandleGeometry(editor.renderer);
            this.velocity = new VelocityTracker();
            this.scroller = new Scroller();
            this.magnifier = null;

            this.gesture = Gesture.NONE;
            this.origin = { x: 0, y: 0, time: 0, scrollLeft: 0, scrollTop: 0, position: null };
            this.previousPoint = { x: 0, y: 0 };
            this.lastTap = { time: 0, x: 0, y: 0 };
            this.tapPossible = false;
            this.scrolled = false;
            // Set by a move step longer than FLING_SLOP_PX, or when the touch stopped a running fling.
            this.flingReady = false;
            this.flingTimer = null;
            // Holds the id of a pending long press; while it does, small moves near the start of the touch are ignored.
            this.longPressTimer = null;
            this.scrollbarDrag = null;
            this.lastMoveTime = 0;
            this.handleDragging = false;
            this.gutterTouch = false;
            // Set when this touch showed the insertion toolbar; the touch then asks for no other toolbar.
            this.insertionRequested = false;
        }

        TouchGestures.prototype.magnifierEnabled = function() {
            return typeof this.options.isMagnifierEnabled === "function" && !!this.options.isMagnifierEnabled();
        };

        TouchGestures.prototype.showMagnifier = function(position, point) {
            if (!this.magnifier) {
                this.magnifier = new Magnifier(this.container, this.editor);
            }
            this.magnifier.show(position, point);
        };

        TouchGestures.prototype.hideMagnifier = function() {
            if (this.magnifier) {
                this.magnifier.hide();
            }
        };

        // 1.4.12 kept the id after clearing the timer, so moves that came back near the start of a drag or scroll were
        // ignored for the rest of the touch: the cursor stopped and then jumped (A2-10).
        TouchGestures.prototype.clearLongPress = function() {
            if (this.longPressTimer) {
                clearTimeout(this.longPressTimer);
                this.longPressTimer = null;
            }
        };

        TouchGestures.prototype.isInGutter = function(node) {
            while (node) {
                if (dom.hasCssClass(node, "ace_gutter")) {
                    return true;
                }
                if (node === this.editor.container) {
                    return false;
                }
                node = node.parentNode;
            }
            return false;
        };

        TouchGestures.prototype.scrollLimits = function() {
            var renderer = this.renderer;
            return {
                minX: 0,
                maxX: renderer.layerConfig.width - renderer.$size.scrollerWidth + OVERSCROLL_PX,
                minY: 0,
                maxY: renderer.layerConfig.maxHeight - renderer.$size.scrollerHeight + OVERSCROLL_PX
            };
        };

        TouchGestures.prototype.classify = function(e) {
            var fingers = e.touches.length;
            if (fingers > 2) {
                return Gesture.NONE;
            }
            if (fingers === 2) {
                return Gesture.ZOOM;
            }
            var selection = this.editor.selection;
            var toCursor = this.geometry.distanceToHandle(selection.cursor, e.clientX, e.clientY);
            if (selection.isEmpty()) {
                return toCursor < HANDLE_REACH ? Gesture.CURSOR : Gesture.SCROLL;
            }
            var toAnchor = this.geometry.distanceToHandle(selection.anchor, e.clientX, e.clientY);
            var nearCursor = toCursor < HANDLE_REACH;
            var nearAnchor = toAnchor < HANDLE_REACH;
            if (nearCursor && nearAnchor) {
                return toCursor < toAnchor ? Gesture.CURSOR : Gesture.ANCHOR;
            }
            if (nearAnchor) {
                return Gesture.ANCHOR;
            }
            return nearCursor ? Gesture.CURSOR : Gesture.SCROLL;
        };

        // True when the touch started on the selected text: the vertical span of the selection (plus a margin) and,
        // for a single line selection only, its horizontal span.
        TouchGestures.prototype.startedOnSelection = function() {
            var selection = this.editor.selection;
            if (selection.getRange().isEmpty()) {
                return false;
            }
            var lead = selection.cursor;
            var tail = selection.anchor;
            var leadPoint = this.renderer.getClientPosition(lead);
            var tailPoint = this.renderer.getClientPosition(tail);
            var lineHeight = this.renderer.layerConfig.lineHeight;
            var top = Math.min(leadPoint.y, tailPoint.y) - SELECTION_TOUCH_MARGIN_PX;
            var bottom = Math.max(leadPoint.y, tailPoint.y) + lineHeight + SELECTION_TOUCH_MARGIN_PX;
            if (!(this.origin.y > top && this.origin.y < bottom)) {
                return false;
            }
            if (lead.row !== tail.row) {
                return true;
            }
            var left = Math.min(leadPoint.x, tailPoint.x) - SELECTION_TOUCH_MARGIN_PX;
            var right = Math.max(leadPoint.x, tailPoint.x) + SELECTION_TOUCH_MARGIN_PX;
            return this.origin.x > left && this.origin.x < right;
        };

        // Gboard turns the word under a newly placed cursor into a composition (setComposingRegion) to offer its
        // suggestions; Ace's text input assumes compositions start at the cursor. Ace ends a composition on mousedown,
        // which touches do not produce here, so such a composition outlived every touch that moved the cursor: Ace
        // stopped updating its hidden textarea, and later IME edits were applied to the wrong range (a backspace
        // replaced a selection with the shortened word, text vanished on a tap; A2-10, manual test C3).
        // Touches that move the cursor or the selection end the composition the way Ace does when a command moves
        // the cursor during a composition (TextInput, beforeEndOperation): the textarea content is dropped and the
        // composition ends without being read as input, then the textarea is refilled for the cursor. Ending it
        // through blur and focus (TextInput.cancelComposition) committed the composing text and deleted text instead.
        // Scrolls do not end compositions.
        TouchGestures.prototype.endComposition = function() {
            var textInput = this.editor.textInput;
            if (!textInput || !textInput.inComposition || typeof textInput.onCompositionEnd !== "function") {
                return;
            }
            var text = typeof textInput.getElement === "function" ? textInput.getElement() : null;
            textInput.lastValue = "";
            if (text) {
                text.value = "";
            }
            textInput.onCompositionEnd();
            if (typeof textInput.resetSelection === "function") {
                textInput.resetSelection();
            }
        };

        // True when neither side of the position is a visible character: an empty line, indentation or a run of
        // spaces. A long press there has no word to select.
        TouchGestures.prototype.isBlankAt = function(position) {
            var line = this.editor.session.getLine(position.row) || "";
            return !/\S/.test(line.charAt(position.column - 1) + line.charAt(position.column));
        };

        TouchGestures.prototype.startInsertionActionMode = function() {
            this.insertionRequested = true;
            if (typeof this.editor.startInsertionActionMode === "function") {
                this.editor.startInsertionActionMode();
            }
        };

        TouchGestures.prototype.onLongPress = function() {
            this.longPressTimer = null;
            // A long press never ends as a tap.
            this.tapPossible = false;
            this.endComposition();
            var onSelection = this.startedOnSelection();
            if (!onSelection && this.isBlankAt(this.origin.position)) {
                this.editor.selection.moveToPosition(this.origin.position);
                this.gesture = Gesture.CURSOR;
                this.startInsertionActionMode();
                if (typeof autojs !== "undefined") {
                    autojs.performLongPressFeedback();
                }
                return;
            }
            if (onSelection) {
                this.gesture = Gesture.LONG_TAP;
            } else {
                this.editor.selection.moveToPosition(this.origin.position);
                this.editor.selection.selectWord();
                this.gesture = Gesture.CURSOR;
            }
            this.editor.startActionMode();
            if (typeof autojs !== "undefined") {
                autojs.performLongPressFeedback();
            }
        };

        TouchGestures.prototype.focusForTyping = function() {
            var editor = this.editor;
            var pageBlurred = !document.hasFocus || !document.hasFocus() ||
                (!editor.isFocused() && document.activeElement === (editor.textInput && editor.textInput.getElement()));
            if (pageBlurred) {
                window.focus();
            }
            editor.focus();
            if (typeof autojs !== "undefined") {
                autojs.showSoftInput();
            }
        };

        // Selects the word at position with the cursor on the side the finger is closer to. (1.4.12 meant to do the
        // same but compared the finger with the whole word, which always contains it, and so always ended at the end.)
        TouchGestures.prototype.selectWord = function(position) {
            var selection = this.editor.selection;
            var word = selection.getWordRange(position.row, position.column);
            var nearerStart = position.row === word.start.row && position.row === word.end.row &&
                position.column - word.start.column < word.end.column - position.column;
            var anchor = nearerStart ? word.end : word.start;
            selection.setSelectionAnchor(anchor.row, anchor.column);
            selection.selectToPosition(nearerStart ? word.start : word.end);
            this.renderer.scrollCursorIntoView();
            this.editor.startActionModeIfSelectionInView(true);
        };

        TouchGestures.prototype.stopFlingTimer = function() {
            if (this.flingTimer) {
                clearInterval(this.flingTimer);
                this.flingTimer = null;
            }
        };

        // Starts a fling along the dominant axis; returns false when the finger was too slow or rested before it was
        // lifted at `liftTime`. WebView sends no touchmove for a resting finger, so the samples of the velocity tracker
        // would still describe the movement before the rest.
        TouchGestures.prototype.fling = function(liftTime) {
            var self = this;
            self.stopFlingTimer();
            if (!self.flingReady || liftTime - self.lastMoveTime > POINTER_STOPPED_MS ||
                !self.velocity.computeVelocity(1000)) {
                return false;
            }
            var vx = self.velocity.velocityX;
            var vy = self.velocity.velocityY;
            if (Math.abs(vx) < FLING_MIN_VELOCITY || Math.abs(vx) < Math.abs(vy)) {
                vx = 0;
            }
            // Compared with the horizontal velocity after its own filtering above.
            if (Math.abs(vy) < FLING_MIN_VELOCITY || Math.abs(vy) < Math.abs(vx)) {
                vy = 0;
            }
            if (vx === 0 && vy === 0) {
                return false;
            }
            // Vertical flings travel twice as far.
            self.scroller.fling(self.renderer.getScrollLeft(), self.renderer.getScrollTop(), vx, vy * 2, self.scrollLimits());
            self.flingTimer = setInterval(function() {
                if (self.scroller.computeScrollOffset()) {
                    self.renderer.scrollTo(self.scroller.currX, self.scroller.currY);
                    return;
                }
                self.stopFlingTimer();
                self.editor.startActionModeIfSelectionInView(false);
            }, FLING_FRAME_MS);
            return true;
        };

        // Ace's custom scrollbars listen to mouse events, which the browser does not synthesize for touches whose
        // touchstart was prevented, so the overlay drags their thumbs. A scrollbar that has not been rendered yet has
        // no thumb geometry, and one the host has hidden (options.isScrollbarHidden) cannot be grabbed; touches on
        // them scroll normally.
        TouchGestures.prototype.scrollbarUnder = function(target) {
            if (typeof this.editor.getOption !== "function" || this.editor.getOption("customScrollbar") !== true) {
                return null;
            }
            var bars = [this.renderer.scrollBarV, this.renderer.scrollBarH];
            for (var i = 0; i < bars.length; i++) {
                var bar = bars[i];
                if (!bar || !bar.element || !contains(bar.element, target, this.editor.container)) {
                    continue;
                }
                var vertical = bar === this.renderer.scrollBarV;
                if (typeof this.options.isScrollbarHidden === "function" && this.options.isScrollbarHidden(vertical)) {
                    return null;
                }
                var thumbStart = vertical ? bar.thumbTop : bar.thumbLeft;
                var thumbSize = vertical ? bar.thumbHeight : bar.thumbWidth;
                return isFinite(thumbStart) && isFinite(thumbSize) ? bar : null;
            }
            return null;
        };

        TouchGestures.prototype.beginScrollbarDrag = function(bar, x, y) {
            var vertical = bar === this.renderer.scrollBarV;
            var thumbStart = vertical ? bar.thumbTop : bar.thumbLeft;
            var thumbSize = vertical ? bar.thumbHeight : bar.thumbWidth;
            var track = bar.element.getBoundingClientRect();
            var along = vertical ? y - track.top : x - track.left;
            this.scrollbarDrag = { bar: bar, vertical: vertical, thumbStart: thumbStart };
            this.notifyScrollbarDrag(true);
            if (along < thumbStart || along > thumbStart + thumbSize) {
                // A touch on the track first centers the thumb under the finger.
                this.scrollbarDrag.thumbStart = along - thumbSize / 2;
                this.dragScrollbar(x, y);
            }
        };

        TouchGestures.prototype.dragScrollbar = function(x, y) {
            var drag = this.scrollbarDrag;
            var moved = drag.vertical ? y - this.origin.y : x - this.origin.x;
            var value = drag.vertical ?
                drag.bar.scrollTopFromThumbTop(drag.thumbStart + moved) :
                drag.bar.scrollLeftFromThumbLeft(drag.thumbStart + moved);
            // The event the scrollbar itself emits for mouse drags; the renderer applies it.
            drag.bar._emit("scroll", { data: value });
        };

        TouchGestures.prototype.notifyScrollbarDrag = function(active) {
            if (typeof this.options.onScrollbarDrag === "function") {
                this.options.onScrollbarDrag(active);
            }
        };

        // Tells the host when a finger starts and stops dragging the cursor or the selection anchor, so that work
        // following every cursor change (symbol highlights) can wait for the final position.
        TouchGestures.prototype.setHandleDragging = function(active) {
            if (this.handleDragging === active) {
                return;
            }
            this.handleDragging = active;
            if (active) {
                this.endComposition();
            }
            if (typeof this.options.onHandleDrag === "function") {
                this.options.onHandleDrag(active);
            }
        };

        TouchGestures.prototype.onTouchStart = function(e) {
            var touches = e.touches;
            var x = (e.clientX = touches[0].clientX);
            var y = (e.clientY = touches[0].clientY);
            this.velocity.clear();
            this.flingReady = !this.scroller.isFinished();
            if (this.flingReady) {
                this.scroller.abortAnimation();
            }
            this.stopFlingTimer();
            this.origin.x = x;
            this.origin.y = y;
            this.origin.time = e.timeStamp;
            this.lastMoveTime = e.timeStamp;
            this.insertionRequested = false;
            // The gutter scrolls like the text but never drags a handle or long-presses. Preventing its touchstart also
            // keeps the browser from synthesizing the mouse events on which Ace focuses the editor.
            this.gutterTouch = this.isInGutter(e.target);

            var bar = touches.length === 1 && !this.gutterTouch ? this.scrollbarUnder(e.target) : null;
            if (bar) {
                this.clearLongPress();
                this.tapPossible = false;
                this.gesture = Gesture.SCROLLBAR;
                this.beginScrollbarDrag(bar, x, y);
                this.editor.finishActionMode();
                e.preventDefault();
                return;
            }
            this.scrollbarDrag = null;

            this.origin.scrollTop = this.renderer.getScrollTop();
            this.origin.scrollLeft = this.renderer.getScrollLeft();
            this.previousPoint.x = x;
            this.previousPoint.y = y;
            this.scrolled = false;
            this.origin.position = new MouseEvent(e, this.editor).getDocumentPosition();
            this.velocity.addMovement(x, y, e.timeStamp);
            this.gesture = this.classify(e);
            if (this.gutterTouch && (this.gesture === Gesture.CURSOR || this.gesture === Gesture.ANCHOR)) {
                this.gesture = Gesture.SCROLL;
            }
            this.clearLongPress();
            if (this.gesture !== Gesture.ZOOM && touches.length === 1) {
                if (!this.gutterTouch) {
                    this.longPressTimer = setTimeout(this.onLongPress.bind(this), LONG_PRESS_MS);
                }
                this.tapPossible = true;
            }
            this.editor.finishActionMode();
            e.preventDefault();
        };

        TouchGestures.prototype.onTouchMove = function(e) {
            var touches = e.touches;
            if (this.gesture === Gesture.ZOOM) {
                // Pinch zoom belongs to the bridge, which handles it in the capture phase.
                return;
            }
            if (touches.length > 1) {
                this.tapPossible = false;
                this.clearLongPress();
                this.editor.finishActionMode();
                return;
            }
            var x = (e.clientX = touches[0].clientX);
            var y = (e.clientY = touches[0].clientY);
            this.lastMoveTime = e.timeStamp;
            if (this.gesture === Gesture.SCROLLBAR) {
                if (this.scrollbarDrag) {
                    this.dragScrollbar(x, y);
                }
                e.preventDefault();
                return;
            }
            var stillNearStart = this.geometry.offsetDistance(x - this.origin.x, y - this.origin.y) < STILL_REACH;
            if (stillNearStart && this.gesture === Gesture.SCROLL && !this.scrolled) {
                return;
            }
            if (stillNearStart && (this.longPressTimer || this.gesture === Gesture.LONG_TAP)) {
                return;
            }
            this.editor.finishActionMode();
            this.tapPossible = false;
            this.clearLongPress();
            if (this.gesture === Gesture.SCROLL) {
                this.scrollWithFinger(x, y, e.timeStamp);
            } else {
                this.dragWithFinger(e, x, y);
            }
            this.previousPoint.x = x;
            this.previousPoint.y = y;
        };

        TouchGestures.prototype.scrollWithFinger = function(x, y, time) {
            var limits = this.scrollLimits();
            var left = Math.min(limits.maxX, Math.max(limits.minX, this.origin.scrollLeft - (x - this.origin.x)));
            var top = Math.min(limits.maxY, Math.max(limits.minY, this.origin.scrollTop - (y - this.origin.y)));
            this.renderer.scrollTo(left, top);
            this.scrolled = true;
            this.editor._emit("touchscroll");
            this.velocity.addMovement(x, y, time);
            if (!this.flingReady &&
                (Math.abs(this.previousPoint.x - x) > FLING_SLOP_PX || Math.abs(this.previousPoint.y - y) > FLING_SLOP_PX)) {
                this.flingReady = true;
            }
        };

        // Moves the dragged handle (cursor or anchor); a long press inside the selection only scrolls.
        TouchGestures.prototype.dragWithFinger = function(e, x, y) {
            var position = new MouseEvent(e, this.editor).getDocumentPosition();
            var draggingHandle = this.gesture === Gesture.CURSOR || this.gesture === Gesture.ANCHOR;
            if (draggingHandle) {
                this.setHandleDragging(true);
            }
            if (this.gesture === Gesture.CURSOR) {
                this.editor.selection.moveCursorToPosition(position);
            } else if (this.gesture === Gesture.ANCHOR) {
                this.editor.selection.setSelectionAnchor(position.row, position.column);
            }
            if (draggingHandle && this.magnifierEnabled()) {
                this.showMagnifier(position, { x: x, y: y });
            }
            // Keep a few columns visible in the direction of the drag.
            var towards = x > this.origin.x ? 1 : -1;
            this.renderer.scrollCursorIntoView({
                row: position.row,
                column: position.column + DRAG_LOOK_AHEAD_COLUMNS * towards
            });
            e.preventDefault();
        };

        TouchGestures.prototype.onTouchEnd = function(e) {
            this.clearLongPress();
            this.hideMagnifier();
            this.setHandleDragging(false);
            if (this.gesture === Gesture.ZOOM) {
                this.gesture = Gesture.NONE;
                return;
            }
            if (this.gesture === Gesture.SCROLLBAR) {
                this.gesture = Gesture.NONE;
                this.scrollbarDrag = null;
                this.notifyScrollbarDrag(false);
                this.editor.startActionModeIfSelectionInView(false);
                return;
            }
            if (this.tapPossible && this.handleTap(e)) {
                return;
            }
            switch (this.gesture) {
                case Gesture.CURSOR:
                    if (this.editor.selection.getRange().isEmpty()) {
                        if (!this.insertionRequested) {
                            this.editor.startActionMode(false);
                        }
                    } else {
                        this.editor.startActionModeIfSelectionInView(true);
                    }
                    return;
                case Gesture.ANCHOR:
                    this.editor.startActionModeIfSelectionInView(true);
                    return;
                case Gesture.SCROLL:
                    if (!this.fling(e.timeStamp)) {
                        this.editor.startActionModeIfSelectionInView(false);
                    }
                    return;
            }
        };

        // A tap places the cursor (a tap on the cursor also shows the insertion toolbar); a second tap near the first
        // selects the word. Taps on the gutter and on Ace's overflow button act on those. Returns true when nothing
        // else has to happen.
        TouchGestures.prototype.handleTap = function(e) {
            if (this.gutterTouch) {
                this.lastTap = { time: 0, x: 0, y: 0 };
                // As in the text, a touch held for the long press time is no tap.
                if (e.timeStamp - this.origin.time < LONG_PRESS_MS && typeof this.options.onGutterTap === "function") {
                    this.options.onGutterTap(e.target, this.origin.x, this.origin.y);
                }
                this.editor.startActionModeIfSelectionInView(false);
                return true;
            }
            if (e.target && dom.hasCssClass(e.target, "ace_toggle_wrap")) {
                // What Ace does for a click on the button (ace/mouse/fold_handler); button taps form no double tap.
                this.lastTap = { time: 0, x: 0, y: 0 };
                var session = this.editor.session;
                session.setOption("wrap", !session.getUseWrapMode());
                this.renderer.scrollCursorIntoView();
                return true;
            }
            this.endComposition();
            var lifted = e.changedTouches[0];
            var previous = this.lastTap;
            var doubleTap = e.timeStamp - previous.time < DOUBLE_TAP_MS &&
                this.geometry.offsetDistance(previous.x - this.origin.x, previous.y - this.origin.y) < STILL_REACH;
            this.lastTap = { time: e.timeStamp, x: lifted.clientX, y: lifted.clientY };
            if (doubleTap) {
                this.selectWord(this.origin.position);
                e.preventDefault();
                return true;
            }
            var selection = this.editor.selection;
            var cursor = selection.cursor;
            var position = this.origin.position;
            var onCursor = this.gesture === Gesture.CURSOR && selection.isEmpty() &&
                cursor.row === position.row && cursor.column === position.column;
            selection.moveToPosition(position);
            this.renderer.scrollCursorIntoView();
            this.focusForTyping();
            if (onCursor) {
                this.startInsertionActionMode();
            }
            return false;
        };

        // Stops a pending long press, a fling and the magnifier when the gesture ended outside this handler. The
        // gesture itself is kept, as remaining fingers may still move.
        TouchGestures.prototype.cancel = function(reason) {
            if (TERMINAL_CANCEL_REASONS.indexOf(String(reason)) < 0) {
                return false;
            }
            if (this.longPressTimer) {
                clearTimeout(this.longPressTimer);
                this.longPressTimer = null;
            }
            this.stopFlingTimer();
            this.scroller.abortAnimation();
            this.hideMagnifier();
            this.setHandleDragging(false);
            if (this.scrollbarDrag) {
                this.scrollbarDrag = null;
                this.notifyScrollbarDrag(false);
            }
            return true;
        };

        function contains(ancestor, node, boundary) {
            while (node) {
                if (node === ancestor) {
                    return true;
                }
                if (node === boundary) {
                    return false;
                }
                node = node.parentNode;
            }
            return false;
        }

        // options.isMagnifierEnabled(): whether handle drags show the magnifier.
        // options.onGutterTap(target, clientX, clientY): a tap on the gutter (breakpoints, diagnostics).
        // options.isScrollbarHidden(vertical): whether the host has hidden a scrollbar, which then cannot be grabbed.
        // options.onScrollbarDrag(active): a finger starts or stops dragging a scrollbar thumb.
        // options.onHandleDrag(active): a finger starts or stops dragging the cursor or the selection anchor.
        // options.capture: listen in the capture phase and stop propagation (fallback when Ace's own touch listeners
        // could not be removed).
        exports.addTouchListeners = function(container, editor, options) {
            options = options || {};
            var gestures = new TouchGestures(container, editor, options);
            var handlers = {
                touchstart: function(e) { gestures.onTouchStart(e); },
                touchend: function(e) { gestures.onTouchEnd(e); },
                touchmove: function(e) { gestures.onTouchMove(e); }
            };
            Object.keys(handlers).forEach(function(type) {
                var handler = handlers[type];
                if (options.capture) {
                    container.addEventListener(type, function(e) {
                        handler(e);
                        e.stopPropagation();
                    }, { capture: true, passive: false });
                } else {
                    event.addListener(container, type, handler, editor);
                }
            });
            return {
                cancel: function(reason) {
                    return gestures.cancel(reason);
                },
                hideMagnifier: function() {
                    gestures.hideMagnifier();
                },
                isMagnifierCreated: function() {
                    return !!gestures.magnifier;
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
    // options.onRecoverableError(scope, error): reports the capture fallback; options.onGutterTap,
    // options.isScrollbarHidden, options.onScrollbarDrag and options.onHandleDrag are passed to the touch listeners.
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
                isMagnifierEnabled: options.isMagnifierEnabled,
                onGutterTap: options.onGutterTap,
                isScrollbarHidden: options.isScrollbarHidden,
                onScrollbarDrag: options.onScrollbarDrag,
                onHandleDrag: options.onHandleDrag
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
