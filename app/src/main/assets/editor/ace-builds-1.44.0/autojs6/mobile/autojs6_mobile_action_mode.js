// Native ActionMode state of the AutoJs6 mobile overlay (Roadmap-Ace-1.44.0.md A2-3, rewritten for A0-5).
//
// The host (AceBridge.kt, global `autojs`) shows its own selection toolbar. This module gives the editor the calls
// the touch handler and the host use, with the behavior documented in tools/ace-mobile/README.md:
//   editor.actionMode                        "", "selectionActionMode" or "noSelectionActionMode"
//   editor.startActionMode()                 asks the host for the toolbar now
//   editor.startActionModeIfSelectionInView(selectAll)
//                                            200 ms later, if the selection is not empty
//   editor.$nativeStartActionMode(rect, hasSelection, selectAll)
//   editor.finishActionMode()                asks the host to hide the toolbar
//   editor.renderer.getClientPosition(position)
// Without the host object nothing is installed.
ace.define("autojs6/mobile/action_mode", ["require", "exports", "module"], function(require, exports) {
    "use strict";

    var MODE_NONE = "";
    var MODE_SELECTION = "selectionActionMode";
    var MODE_NO_SELECTION = "noSelectionActionMode";
    var DEFERRED_START_MS = 200;

    // Viewport coordinates of the top left corner of a document position; `this` is the renderer.
    function getClientPosition(position) {
        var layerPoint = this.$cursorLayer.getPixelPosition(position, true);
        var viewport = this.scroller.getBoundingClientRect();
        return {
            x: viewport.left + layerPoint.left - this.scrollLeft,
            y: viewport.top + layerPoint.top - this.layerConfig.offset
        };
    }

    function ActionModeController(editor, host) {
        this.editor = editor;
        this.host = host;
        this.deferredStart = null;
    }

    ActionModeController.prototype.cancelDeferredStart = function() {
        if (this.deferredStart) {
            clearTimeout(this.deferredStart);
            this.deferredStart = null;
        }
    };

    // The selection span as fractions of the scroller height between left 0 and right 1. The host does not use
    // these as pixels: it anchors the toolbar at the last touch instead (AceCodeEditor.kt).
    ActionModeController.prototype.selectionBand = function() {
        var selection = this.editor.selection;
        var renderer = this.editor.renderer;
        var lead = selection.cursor;
        var tail = selection.isEmpty() ? lead : selection.anchor;
        var viewportHeight = renderer.scroller.getBoundingClientRect().height;
        var leadY = renderer.getClientPosition(lead).y;
        var tailY = renderer.getClientPosition(tail).y;
        return {
            left: 0,
            top: Math.min(leadY, tailY) / viewportHeight,
            right: 1,
            bottom: Math.max(leadY, tailY) / viewportHeight
        };
    };

    ActionModeController.prototype.show = function(band, hasSelection, selectAll) {
        this.editor.actionMode = hasSelection ? MODE_SELECTION : MODE_NO_SELECTION;
        this.host.startActionMode(band.left, band.top, band.right, band.bottom, hasSelection, selectAll);
    };

    ActionModeController.prototype.startNow = function() {
        this.cancelDeferredStart();
        var hasSelection = !this.editor.selection.getRange().isEmpty();
        this.editor.$nativeStartActionMode(this.selectionBand(), hasSelection, false);
    };

    // Kept as the editor touch behavior has it: any band that is a number passes the "in view" test, so the
    // toolbar appears for every non-empty selection unless the scroller has no height.
    ActionModeController.prototype.startLater = function(selectAll) {
        var controller = this;
        controller.cancelDeferredStart();
        controller.deferredStart = setTimeout(function() {
            controller.deferredStart = null;
            if (controller.editor.selection.getRange().isEmpty()) {
                return;
            }
            var band = controller.selectionBand();
            var inView = !isNaN(band.top) || (band.bottom >= 0 && band.bottom <= 1);
            if (inView) {
                controller.editor.$nativeStartActionMode(band, true, selectAll);
            }
        }, DEFERRED_START_MS);
    };

    ActionModeController.prototype.finish = function() {
        this.cancelDeferredStart();
        if (this.editor.actionMode === MODE_NONE) {
            return;
        }
        this.editor.actionMode = MODE_NONE;
        this.host.finishActionMode();
    };

    exports.install = function(editor) {
        var host = typeof autojs !== "undefined" ? autojs : null;
        if (!host) {
            return false;
        }
        var controller = new ActionModeController(editor, host);

        editor.renderer.getClientPosition = getClientPosition;
        editor.actionMode = MODE_NONE;
        editor.startActionModeIfSelectionInView = function(selectAll) {
            controller.startLater(selectAll);
        };
        editor.startActionMode = function() {
            controller.startNow();
        };
        editor.$nativeStartActionMode = function(band, hasSelection, selectAll) {
            controller.show(band, hasSelection, selectAll);
        };
        editor.finishActionMode = function() {
            controller.finish();
        };

        // Typing while the paste toolbar (no selection) is up asks the host to close it; the state stays as it was.
        editor.on("change", function() {
            if (editor.actionMode === MODE_NO_SELECTION) {
                host.finishActionMode();
            }
        });

        // A selection toolbar closes when its selection becomes empty. Like the editor touch behavior it replaces,
        // this follows the selections of sessions set later; the session present at installation is not observed.
        var closeWhenSelectionEmpties = function() {
            if (editor.actionMode === MODE_SELECTION && editor.selection.getRange().isEmpty()) {
                editor.finishActionMode();
            }
        };
        editor.on("changeSession", function(event) {
            if (event.oldSession) {
                event.oldSession.selection.off("changeSelection", closeWhenSelectionEmpties);
            }
            event.session.selection.on("changeSelection", closeWhenSelectionEmpties);
        });
        return true;
    };

    exports.getClientPosition = getClientPosition;
    exports.SELECTION_ACTION_MODE = MODE_SELECTION;
    exports.NO_SELECTION_ACTION_MODE = MODE_NO_SELECTION;
});
