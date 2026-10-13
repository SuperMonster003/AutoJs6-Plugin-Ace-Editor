// Reconstructed from the Auto.js customized Ace build (ace-builds-1.4.12/src-min-noconflict/ace.js).
// Module: "ace/mouse/magnifier.js"; original bytes: original/magnifier.min.js.
//
// Shows a magnified copy of the line under the finger (plus one line above and below) while the cursor
// or the selection anchor is dragged. In the 1.4.12 build it never ran: MouseHandler.magnifierEnabled
// defaults to false and nothing sets it, and the repository has no CSS for #magnifier.
// This reconstruction is a reference for porting and auditing.
ace.define("ace/mouse/magnifier.js", ["require", "exports", "module"], function (require, exports, module) {
    "use strict";
    exports.Magnifier = function (parent, editor) {
        function binarySearch(array, value, low, high, compare) {
            if (high < low) return null;
            var middle = Math.floor(low + (high - low) / 2);
            var result = compare(array[middle], value);
            return result === 0
                ? middle
                : result < 0
                  ? binarySearch(array, value, low, middle - 1, compare)
                  : binarySearch(array, value, middle + 1, high, compare);
        }

        var LINE_SPACING = 8;
        var FINGER_OFFSET = 56;
        var DELAYED_SHOW_MS = 48;

        // Set by the touch handler while body zoom is active.
        this.zoom = 1;

        var container = document.createElement("div");
        container.id = "magnifier";
        container.style.display = "none";
        parent.appendChild(container);
        this.container = container;

        var content = document.createElement("div");
        content.id = "magnifier-content";
        container.appendChild(content);
        this.element = content;

        var progress = document.createElement("div");
        container.appendChild(progress);
        progress.id = "magnifier-progress";
        progress.style.display = "none";
        this.progress = progress;

        this.shown = false;
        this.$selectionStart = this.$selectionEnd = 0;
        this.$lines = [];
        this.$delayedShowTimer = null;

        // `position` is a document position, `point` the client coordinates of the finger.
        // The third argument (passed by $delayedShow) is ignored.
        this.show = function (position, point, fromDelayedShow) {
            position = editor.session.documentToScreenPosition(position);
            if (!this.shown) this.container.style.display = "block";
            // Quirk: compares and passes the screen row, while text layer cells are keyed by document row.
            if (position.row != this.row) this.$updateActiveLine(position.row);
            for (var i = 0; i < this.$lines.length; i++) this.$updateSelection(this.$lines[i]);
            this.$moveToPosition(position);
            this.$updateLocation(point);
            this.shown = true;
        };

        this.$updateLocation = function (point) {
            var offset = FINGER_OFFSET;
            var top = point.y / this.zoom - offset - this.element.offsetHeight / this.zoom;
            if (top < 0) top = point.y / this.zoom + offset * 1.5;
            var left = Math.max(this.element.offsetWidth + editor.renderer.gutterWidth, point.x) / this.zoom;
            this.container.style.left = left + "px";
            this.container.style.top = top + "px";
        };

        // Unused by the touch handler.
        this.$delayedShow = function (position, point) {
            if (this.$delayedShowTimer) clearTimeout(this.$delayedShowTimer);
            else this.progress.style.display = "block";
            var self = this;
            this.$delayedShowTimer = setTimeout(function () {
                self.$delayedShowTimer = null;
                self.$updateActiveLine(position.row);
                self.progress.style.display = "none";
                self.show(position, point, true);
            }, DELAYED_SHOW_MS);
        };

        this.hide = function () {
            if (this.$delayedShowTimer) {
                clearTimeout(this.$delayedShowTimer);
                this.$delayedShowTimer = null;
            }
            if (this.shown) this.container.style.display = "none";
            this.shown = false;
        };

        // Centers the screen column horizontally inside the magnifier.
        this.$moveToPosition = function (screenPosition) {
            var characterWidth = editor.renderer.layerConfig.characterWidth;
            var width = this.element.offsetWidth;
            var translateX = -characterWidth * screenPosition.column + width / 2;
            for (var i = 0; i < this.$lines.length; i++) {
                var line = this.$lines[i];
                line.element.style.transform =
                    "translateY(" + line.translateY + ") translateX(" + translateX + "px)";
                if (line.selection) {
                    line.selection.element.style.transform =
                        "translateY(" +
                        line.translateY +
                        ") translateX(" +
                        (translateX + characterWidth * line.selection.range.start.column) +
                        "px)";
                }
            }
        };

        // Mirrors the selection marker of one magnified line by cloning the first `.ace_selection` element
        // of the document.
        this.$updateSelection = function (line) {
            var range = editor.selection.getRange();
            if (range.isEmpty() || line.row < range.start.row || line.row > range.end.row) {
                if (line.selection) line.selection.element.style.display = "none";
                return;
            }
            var selectionTemplate = document.querySelector(".ace_selection");
            if (!line.selection) {
                if (!selectionTemplate) return;
                line.selection = {};
                line.selection.element = this.$createSelectionElement(line, selectionTemplate);
                this.element.insertBefore(line.selection.element, line.element);
            }
            line.selection.element.style.display = "block";
            var lineRange = range.clipRows(line.row, line.row);
            if (lineRange.start.row != lineRange.end.row && lineRange.start.row == line.row) {
                lineRange.end.row = line.row;
                lineRange.end.column = editor.session.getLine(line.row).length;
            }
            lineRange = lineRange.toScreenRange(editor.session);
            line.selection.range = lineRange;
            var characterWidth = editor.renderer.layerConfig.characterWidth;
            var style = line.selection.element.style;
            style.left = 0;
            style.width = (lineRange.end.column - lineRange.start.column) * characterWidth + "px";
            if (selectionTemplate) style.background = window.getComputedStyle(selectionTemplate).background;
        };

        this.$createSelectionElement = function (line, template) {
            var element = template.cloneNode(true);
            var style = element.style;
            style.position = "absolute";
            style.top = line.top + 2 + "px";
            return element;
        };

        // Clones the rendered text layer cells of `row` and its neighbours (only rows that are rendered).
        this.$updateActiveLine = function (row) {
            this.$removeLineElement();
            var cells = editor.renderer.$textLayer.$lines.cells;
            var index = binarySearch(cells, row, 0, cells.length - 1, function (cell, target) {
                return target - cell.row;
            });
            if (index == null) return;
            var height = this.element.offsetHeight;
            this.$lines = [];
            if (index > 0) this.$addLine(cells[index - 1], row - 1, height / 2 - LINE_SPACING, "-100%");
            this.$addLine(cells[index], row, height / 2, "-50%");
            if (index < cells.length - 1) this.$addLine(cells[index + 1], row + 1, height / 2 + LINE_SPACING, "0%");
            this.row = row;
        };

        this.$addLine = function (cell, row, top, translateY) {
            var line = { element: cell.element.cloneNode(true), row: row, top: top, translateY: translateY };
            this.$setUpLineStyle(line, line.element.style);
            this.$lines.push(line);
            this.element.appendChild(line.element);
        };

        this.$setUpLineStyle = function (line, style) {
            style.position = "absolute";
            style.top = line.top + "px";
        };

        this.$removeLineElement = function () {
            for (var i = 0; i < this.$lines.length; i++) {
                this.element.removeChild(this.$lines[i].element);
                if (this.$lines[i].selection) this.element.removeChild(this.$lines[i].selection.element);
            }
            this.$lines = [];
        };
    };
});
