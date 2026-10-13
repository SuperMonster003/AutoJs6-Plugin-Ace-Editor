// Reconstructed from the Auto.js customized Ace build (ace-builds-1.4.12/src-min-noconflict/ace.js).
// Fragments of module "ace/editor"; original bytes: original/editor-action-mode-names.min.js,
// original/editor-constructor.min.js and original/editor-prototype.min.js.
//
// The customized Editor kept a small native ActionMode state machine and called the host bridge
// (`autojs.startActionMode(left, top, right, bottom, hasSelection, selectAll)` / `autojs.finishActionMode()`,
// AceBridge.kt). Both fragments are only active when the global `autojs` exists.
// The reconstruction is expressed as two functions so that it can be compared with the original fragments:
//   installConstructorListeners.call(editor)    - ran at the end of the Editor constructor
//   definePrototypeMethods.call(Editor.prototype) - ran at the end of the Editor.prototype definition
// This reconstruction is a reference for porting and auditing.
ace.define("autojs6-reconstructed/editor_action_mode", ["require", "exports", "module"], function (require, exports) {
    "use strict";
    var SELECTION_ACTION_MODE = "selectionActionMode";
    var NO_SELECTION_ACTION_MODE = "noSelectionActionMode";
    var START_IF_IN_VIEW_DELAY_MS = 200;

    exports.SELECTION_ACTION_MODE = SELECTION_ACTION_MODE;
    exports.NO_SELECTION_ACTION_MODE = NO_SELECTION_ACTION_MODE;

    exports.installConstructorListeners = function () {
        if (typeof autojs != "undefined") {
            var onChangeSelection = function () {
                var range = this.selection.getRange();
                if (this.actionMode == SELECTION_ACTION_MODE && range.isEmpty()) this.finishActionMode();
            }.bind(this);
            // Calls the bridge directly and keeps `actionMode`, so every later change repeats the call.
            var onChange = function () {
                if (this.actionMode == NO_SELECTION_ACTION_MODE) autojs.finishActionMode();
            }.bind(this);
            // Quirk: registered after the constructor already called setSession(), so the first session never
            // gets the selection listener. The AutoJs6 bridge never calls setSession(), therefore
            // onChangeSelection was never attached in practice.
            this.on("changeSession", function (e) {
                if (e.oldSession) e.oldSession.selection.off("changeSelection", onChangeSelection);
                e.session.selection.on("changeSelection", onChangeSelection);
            });
            this.on("change", onChange);
        }
    };

    exports.definePrototypeMethods = function () {
        if (typeof autojs != "undefined") {
            // Shared by every editor instance (it lives in the prototype closure).
            var startIfInViewTimer = null;

            this.actionMode = "";

            this.startActionModeIfSelectionInView = function (selectAll) {
                if (startIfInViewTimer) clearTimeout(startIfInViewTimer);
                var self = this;
                startIfInViewTimer = setTimeout(function () {
                    startIfInViewTimer = null;
                    var range = self.selection.getRange();
                    if (range.isEmpty()) return;
                    var rect = getNormalizedSelectionRect();
                    // Quirk: `top >= 0 || top <= 1` holds for every finite number, so the "in view" test only
                    // rejects NaN (a zero height scroller); the ActionMode starts even when the selection is
                    // scrolled out of view.
                    if (rect.top >= 0 || rect.top <= 1 || (rect.bottom >= 0 && rect.bottom <= 1)) {
                        self.$nativeStartActionMode(rect, true, selectAll);
                    }
                }, START_IF_IN_VIEW_DELAY_MS);
            };

            // Callers sometimes pass `false`; the argument is ignored.
            this.startActionMode = function () {
                if (startIfInViewTimer) {
                    clearTimeout(startIfInViewTimer);
                    startIfInViewTimer = null;
                }
                var rect = getNormalizedSelectionRect();
                var range = this.selection.getRange();
                this.$nativeStartActionMode(rect, !range.isEmpty(), false);
            };

            this.$nativeStartActionMode = function (rect, hasSelection, selectAll) {
                this.actionMode = hasSelection ? SELECTION_ACTION_MODE : NO_SELECTION_ACTION_MODE;
                autojs.startActionMode(rect.left, rect.top, rect.right, rect.bottom, hasSelection, selectAll);
            };

            this.finishActionMode = function () {
                if (startIfInViewTimer) {
                    clearTimeout(startIfInViewTimer);
                    startIfInViewTimer = null;
                }
                if (!this.actionMode) return;
                this.actionMode = "";
                autojs.finishActionMode();
            };

            // Fractions of the scroller height (left 0, right 1), not pixels. AceCodeEditor.kt treats such
            // rectangles as invalid (isProbablyInvalidActionModeRect) and anchors the toolbar at the last text
            // touch, the previous rectangle or a fallback instead.
            // Quirk: reads the global `editor` (assigned by the bridge) instead of the receiver.
            function getNormalizedSelectionRect() {
                var cursor = editor.selection.cursor;
                var anchor = editor.selection.isEmpty() ? cursor : editor.selection.anchor;
                var scrollerRect = editor.renderer.scroller.getBoundingClientRect();
                var height = scrollerRect.height;
                var cursorPosition = editor.renderer.getClientPosition(cursor);
                var anchorPosition = editor.renderer.getClientPosition(anchor);
                return {
                    left: 0,
                    top: Math.min(cursorPosition.y, anchorPosition.y) / height,
                    right: 1,
                    bottom: Math.max(cursorPosition.y, anchorPosition.y) / height,
                };
            }
        }
    };
});
