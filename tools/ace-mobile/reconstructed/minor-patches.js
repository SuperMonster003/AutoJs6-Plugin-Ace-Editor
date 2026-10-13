// Reconstructed from the Auto.js customized Ace build (ace-builds-1.4.12/src-min-noconflict/ace.js).
// Small in-place changes to upstream 1.4.12 modules; each entry names its original slice in original/.
// Reference only: the readable form of each change next to the upstream 1.4.12 behavior it replaced.
ace.define("autojs6-reconstructed/minor_patches", ["require", "exports", "module"], function (require, exports) {
    "use strict";

    // ace/mouse/mouse_handler (mouse_handler-touch-listeners-call.min.js, mouse_handler-magnifier-option.min.js)
    // The MouseHandler passes itself to the touch handler and declares the option read as
    // `mouseHandler.$magnifierEnabled`:
    //     addTouchListeners(editor.container, editor, this);
    //     config.defineOptions(MouseHandler.prototype, "mouseHandler", { ..., magnifierEnabled: { initialValue: false } });
    exports.mouseHandlerOptions = { magnifierEnabled: { initialValue: false } };

    // ace/mouse/mouse_handler (mouse_handler-mobile-focus.min.js)
    // Upstream registers focusEditor for "mousedown" on the text and gutter targets unconditionally.
    // The customized build skips both on mobile user agents (useragent.isMobile, true in Android WebView).
    exports.registerFocusEditor = function (event, useragent, mouseTarget, gutterElement, focusEditor, editor) {
        if (!useragent.isMobile) {
            event.addListener(mouseTarget, "mousedown", focusEditor, editor);
            event.addListener(gutterElement, "mousedown", focusEditor, editor);
        }
    };

    // ace/mouse/default_handlers (default_handlers-mobile.min.js)
    // The mousedown / dblclick / tripleclick / quadclick default handlers are not installed on mobile, so
    // emulated or real mouse clicks do not move the cursor or select there. "mousewheel" stays installed.
    exports.installDefaultHandlers = function (useragent, editor, handlers, mouseHandler) {
        if (!useragent.isMobile) {
            editor.setDefaultHandler("mousedown", handlers.onMouseDown.bind(mouseHandler));
            editor.setDefaultHandler("dblclick", handlers.onDoubleClick.bind(mouseHandler));
            editor.setDefaultHandler("tripleclick", handlers.onTripleClick.bind(mouseHandler));
            editor.setDefaultHandler("quadclick", handlers.onQuadClick.bind(mouseHandler));
        }
        editor.setDefaultHandler("mousewheel", handlers.onMouseWheel.bind(mouseHandler));
    };

    // ace/keyboard/textinput (textinput-context-menu.min.js)
    // Upstream onContextMenu resets the textarea selection, emits "nativecontextmenu" and moves the hidden
    // textarea under the pointer (z-index 100000) so the browser menu targets it. The customized build only
    // suppresses the browser menu; the caller still runs onContextMenuClose() afterwards.
    exports.onContextMenu = function (e) {
        e.preventDefault();
    };

    // ace/mouse/default_gutter_handler (default_gutter_handler-touchscroll-on.min.js / -off.min.js)
    // The gutter tooltip also hides on the "touchscroll" event emitted by the custom touch handler, next to
    // the upstream "mousewheel" subscription:
    //     editor.on("mousewheel", hideTooltip); editor.on("touchscroll", hideTooltip);   // when shown
    //     editor.off("mousewheel", hideTooltip); editor.off("touchscroll", hideTooltip); // when hidden
    exports.gutterTooltipHideEvents = ["mousewheel", "touchscroll"];

    // ace/lib/event (event-modifier-hash.min.js)
    // Upstream derives the modifier hash from the event flags only. The customized build also treats a
    // modifier key as held while its keydown has been counted in `pressedKeys` (keyCode 16 Shift, 17 Ctrl,
    // 18 Alt, 224 / 91 / 92 Meta) and not yet cleared by keyup or a window focus / blur reset. Key sources
    // that send separate modifier key events without setting ctrlKey / altKey / shiftKey / metaKey (such as
    // some soft keyboards) therefore still produce Ctrl / Alt / Shift / Meta commands.
    exports.getModifierHash = function (e, pressedKeys) {
        var shift = e.shiftKey || pressedKeys[16];
        var ctrl = e.ctrlKey || pressedKeys[17];
        var alt = e.altKey || pressedKeys[18];
        var meta = e.metaKey || pressedKeys[224] || pressedKeys[91] || pressedKeys[92];
        return 0 | (ctrl ? 1 : 0) | (alt ? 2 : 0) | (shift ? 4 : 0) | (meta ? 8 : 0);
    };

    // ace/virtual_renderer CSS (virtual_renderer-font-stack.min.js)
    // Default .ace_editor font stack. Upstream 1.4.12:
    //     12px/normal 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'source-code-pro', monospace
    // The bridge always sets the editor font family explicitly, so this default is not observable.
    exports.defaultFontStack = "12px/normal 'Ubuntu Mono', 'Monaco', 'CONSOLA', 'Consolas', 'source-code-pro', monospace";
});
