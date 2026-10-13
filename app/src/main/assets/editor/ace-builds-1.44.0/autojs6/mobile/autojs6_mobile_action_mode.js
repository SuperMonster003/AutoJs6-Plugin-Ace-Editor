// Native ActionMode state of the AutoJs6 mobile overlay (Roadmap-Ace-1.44.0.md A2-3).
//
// Restores the editor API of the Ace 1.4.12 Auto.js build that the touch handler and the host rely on:
// editor.startActionMode(), startActionModeIfSelectionInView(selectAll), $nativeStartActionMode(...),
// finishActionMode(), editor.actionMode and renderer.getClientPosition(position). The host bridge object is the
// global `autojs` (AceBridge.kt). Behavior notes, including the ones that look unintended, are documented in
// tools/ace-mobile/README.md and kept on purpose so that the host sees the same calls as before.
ace.define("autojs6/mobile/action_mode", ["require", "exports", "module"], function(require, exports) {
    "use strict";

    var SELECTION_ACTION_MODE = "selectionActionMode";
    var NO_SELECTION_ACTION_MODE = "noSelectionActionMode";
    var START_IF_IN_VIEW_DELAY_MS = 200;

    function hostBridge() {
        return typeof autojs !== "undefined" ? autojs : null;
    }

    // Client (viewport) coordinates of the top left corner of a document position.
    function getClientPosition(position) {
        var pixel = this.$cursorLayer.getPixelPosition(position, true);
        var scrollerRect = this.scroller.getBoundingClientRect();
        return {
            x: pixel.left + scrollerRect.left - this.scrollLeft,
            y: pixel.top + scrollerRect.top - this.layerConfig.offset
        };
    }

    exports.install = function(editor) {
        var bridge = hostBridge();
        if (!bridge) {
            return false;
        }
        var startIfInViewTimer = null;

        function clearStartIfInViewTimer() {
            if (startIfInViewTimer) {
                clearTimeout(startIfInViewTimer);
                startIfInViewTimer = null;
            }
        }

        // The selection rectangle as fractions of the scroller height (left 0, right 1). The host treats it as an
        // invalid pixel rectangle and anchors the toolbar at the last text touch instead (AceCodeEditor.kt).
        function normalizedSelectionRect() {
            var selection = editor.selection;
            var cursor = selection.cursor;
            var anchor = selection.isEmpty() ? cursor : selection.anchor;
            var height = editor.renderer.scroller.getBoundingClientRect().height;
            var cursorPosition = editor.renderer.getClientPosition(cursor);
            var anchorPosition = editor.renderer.getClientPosition(anchor);
            return {
                left: 0,
                top: Math.min(cursorPosition.y, anchorPosition.y) / height,
                right: 1,
                bottom: Math.max(cursorPosition.y, anchorPosition.y) / height
            };
        }

        editor.renderer.getClientPosition = getClientPosition;
        editor.actionMode = "";

        // Despite its name the 1.4.12 check accepts every finite rectangle, so the ActionMode starts whenever the
        // selection is not empty (only a zero-height scroller, which yields NaN, prevents it).
        editor.startActionModeIfSelectionInView = function(selectAll) {
            clearStartIfInViewTimer();
            startIfInViewTimer = setTimeout(function() {
                startIfInViewTimer = null;
                if (editor.selection.getRange().isEmpty()) {
                    return;
                }
                var rect = normalizedSelectionRect();
                if (!isNaN(rect.top) || (rect.bottom >= 0 && rect.bottom <= 1)) {
                    editor.$nativeStartActionMode(rect, true, selectAll);
                }
            }, START_IF_IN_VIEW_DELAY_MS);
        };

        editor.startActionMode = function() {
            clearStartIfInViewTimer();
            var rect = normalizedSelectionRect();
            editor.$nativeStartActionMode(rect, !editor.selection.getRange().isEmpty(), false);
        };

        editor.$nativeStartActionMode = function(rect, hasSelection, selectAll) {
            editor.actionMode = hasSelection ? SELECTION_ACTION_MODE : NO_SELECTION_ACTION_MODE;
            bridge.startActionMode(rect.left, rect.top, rect.right, rect.bottom, hasSelection, selectAll);
        };

        editor.finishActionMode = function() {
            clearStartIfInViewTimer();
            if (!editor.actionMode) {
                return;
            }
            editor.actionMode = "";
            bridge.finishActionMode();
        };

        // As in 1.4.12: typing while the no-selection ActionMode is shown asks the host to finish it, without
        // clearing the state.
        editor.on("change", function() {
            if (editor.actionMode === NO_SELECTION_ACTION_MODE) {
                bridge.finishActionMode();
            }
        });

        // As in 1.4.12 the selection listener follows session changes only; the session that exists when the
        // overlay is installed is not observed.
        var onChangeSelection = function() {
            if (editor.actionMode === SELECTION_ACTION_MODE && editor.selection.getRange().isEmpty()) {
                editor.finishActionMode();
            }
        };
        editor.on("changeSession", function(e) {
            if (e.oldSession) {
                e.oldSession.selection.off("changeSelection", onChangeSelection);
            }
            e.session.selection.on("changeSelection", onChangeSelection);
        });
        return true;
    };

    exports.getClientPosition = getClientPosition;
    exports.SELECTION_ACTION_MODE = SELECTION_ACTION_MODE;
    exports.NO_SELECTION_ACTION_MODE = NO_SELECTION_ACTION_MODE;
});
