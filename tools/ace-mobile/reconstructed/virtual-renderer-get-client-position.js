// Reconstructed from the Auto.js customized Ace build (ace-builds-1.4.12/src-min-noconflict/ace.js).
// Fragment of module "ace/virtual_renderer"; original bytes: original/virtual_renderer-get-client-position.min.js.
//
// VirtualRenderer.prototype.getClientPosition(position): client (viewport) coordinates of the top left
// corner of a document position. Used by the touch handler and the editor ActionMode additions.
// This reconstruction is a reference for porting and auditing.
ace.define(
    "autojs6-reconstructed/virtual_renderer_get_client_position",
    ["require", "exports", "module"],
    function (require, exports) {
        "use strict";
        // `this` is the VirtualRenderer.
        exports.getClientPosition = function (position) {
            var pixel = this.$cursorLayer.getPixelPosition(position, true);
            var offset = this.layerConfig.offset;
            var scrollLeft = this.scrollLeft;
            var scrollerRect = this.scroller.getBoundingClientRect();
            return { x: pixel.left + scrollerRect.left - scrollLeft, y: pixel.top + scrollerRect.top - offset };
        };
    },
);
