// Drag magnifier of the AutoJs6 mobile overlay (Roadmap-Ace-1.44.0.md A2-6).
//
// While the cursor or the selection anchor is dragged, shows the screen rows around the drag position enlarged
// above the finger. Written for AutoJs6 (the previous editor build had an unfinished magnifier that was never
// enabled): rows are positioned by screen row (folds and soft wrap included), the selection and the cursor are drawn
// here and the DOM is created on first use. It is disabled unless the host enables it.
ace.define("autojs6/mobile/magnifier", ["require", "exports", "module"], function(require, exports) {
    "use strict";

    var VISIBLE_ROWS = 3;
    var SCALE = 1.5;
    var MAX_WIDTH_PX = 240;
    var FINGER_GAP_PX = 56;
    var EDGE_PX = 8;

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function Magnifier(parent, editor) {
        this.parent = parent;
        this.editor = editor;
        this.container = null;
        this.content = null;
        this.shown = false;
    }

    Magnifier.prototype.ensureElements = function() {
        if (this.container) {
            return;
        }
        var doc = this.parent.ownerDocument || document;
        this.container = doc.createElement("div");
        this.container.className = "autojs6-magnifier";
        this.container.style.display = "none";
        this.content = doc.createElement("div");
        // The Ace layer classes let the editor theme color the cloned tokens and the selection.
        this.content.className = "autojs6-magnifier-content ace_text-layer ace_marker-layer";
        this.container.appendChild(this.content);
        this.parent.appendChild(this.container);
    };

    // `position` is a document position, `point` the client coordinates of the finger.
    Magnifier.prototype.show = function(position, point) {
        var renderer = this.editor.renderer;
        var session = this.editor.session;
        var config = renderer.layerConfig;
        var lineHeight = config.lineHeight;
        if (!lineHeight || !renderer.$textLayer || !renderer.$textLayer.$lines) {
            return;
        }
        this.ensureElements();
        var parentRect = this.parent.getBoundingClientRect();
        var width = Math.min(MAX_WIDTH_PX, Math.max(0, parentRect.width - EDGE_PX * 2));
        var height = VISIBLE_ROWS * lineHeight * SCALE;
        var container = this.container;
        container.style.width = width + "px";
        container.style.height = height + "px";

        var screenPosition = session.documentToScreenPosition(position);
        var centerTop = (VISIBLE_ROWS - 1) / 2 * lineHeight;
        // Relative to the start of the text: Ace offsets the whole text layer by its padding (a margin), so a row
        // element and its clone start at the first character.
        var cursorLeft = screenPosition.column * config.characterWidth;
        var unscaledWidth = width / SCALE;

        this.content.innerHTML = "";
        this.content.style.width = unscaledWidth + "px";
        this.content.style.height = VISIBLE_ROWS * lineHeight + "px";
        this.content.style.transform = "scale(" + SCALE + ")";
        this.renderSelection(screenPosition.row, centerTop, unscaledWidth / 2 - cursorLeft);
        var cells = renderer.$textLayer.$lines.cells;
        for (var i = 0; i < cells.length; i++) {
            var cell = cells[i];
            var firstScreenRow = session.documentToScreenRow(cell.row, 0);
            var rowOffset = firstScreenRow - screenPosition.row;
            var rowCount = Math.max(1, Math.round((cell.element.offsetHeight || lineHeight) / lineHeight));
            if (rowOffset > 1 || rowOffset + rowCount - 1 < -1) {
                continue;
            }
            var clone = cell.element.cloneNode(true);
            clone.style.position = "absolute";
            clone.style.top = centerTop + rowOffset * lineHeight + "px";
            clone.style.left = "0";
            // Ace contains each row (contain: strict on hidpi screens), which would clip the shifted clone to the
            // content width; the clone keeps its natural width instead.
            clone.style.right = "auto";
            clone.style.contain = "none";
            clone.style.transform = "translateX(" + (unscaledWidth / 2 - cursorLeft) + "px)";
            this.content.appendChild(clone);
        }
        // The dragged position sits in the middle of the content; `ace_cursor` takes the theme's cursor color.
        var caret = (this.parent.ownerDocument || document).createElement("div");
        caret.className = "autojs6-magnifier-cursor ace_cursor";
        caret.style.top = centerTop + "px";
        caret.style.height = lineHeight + "px";
        caret.style.left = unscaledWidth / 2 + "px";
        this.content.appendChild(caret);

        var left = clamp(point.x - parentRect.left - width / 2, EDGE_PX, parentRect.width - width - EDGE_PX);
        var top = point.y - parentRect.top - FINGER_GAP_PX - height;
        if (top < EDGE_PX) {
            top = point.y - parentRect.top + FINGER_GAP_PX;
        }
        container.style.left = left + "px";
        container.style.top = top + "px";
        container.style.display = "block";
        this.shown = true;
    };

    Magnifier.prototype.renderSelection = function(cursorScreenRow, centerTop, translateX) {
        var editor = this.editor;
        var range = editor.selection.getRange();
        if (range.isEmpty()) {
            return;
        }
        var session = editor.session;
        var config = editor.renderer.layerConfig;
        var screenRange = range.toScreenRange(session);
        for (var offset = -1; offset <= 1; offset++) {
            var row = cursorScreenRow + offset;
            if (row < screenRange.start.row || row > screenRange.end.row) {
                continue;
            }
            var startColumn = row === screenRange.start.row ? screenRange.start.column : 0;
            var endColumn = row === screenRange.end.row ?
                screenRange.end.column :
                session.getScreenLastRowColumn(row) + 1;
            var highlight = (this.parent.ownerDocument || document).createElement("div");
            highlight.className = "autojs6-magnifier-selection ace_selection";
            highlight.style.top = centerTop + offset * config.lineHeight + "px";
            highlight.style.height = config.lineHeight + "px";
            highlight.style.left = startColumn * config.characterWidth + "px";
            highlight.style.width = Math.max(1, endColumn - startColumn) * config.characterWidth + "px";
            highlight.style.transform = "translateX(" + translateX + "px)";
            // Under the cloned rows, as Ace's marker layer is under its text layer: the layer classes also give the
            // highlight Ace's marker z-index (5), which drew it over the text; an opaque theme selection (Gruvbox
            // since A2-10 item 15) hid the selected text (maintainer test V10, 2026-10-14).
            highlight.style.zIndex = "auto";
            this.content.appendChild(highlight);
        }
    };

    Magnifier.prototype.hide = function() {
        if (this.container && this.shown) {
            this.container.style.display = "none";
        }
        this.shown = false;
    };

    Magnifier.prototype.destroy = function() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        this.container = null;
        this.content = null;
        this.shown = false;
    };

    exports.Magnifier = Magnifier;
});
