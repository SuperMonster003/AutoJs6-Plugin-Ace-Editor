// Declarations the AutoJs6 bridge needs beyond the ace.d.ts of ace-builds 1.44.0 (Roadmap-Ace-1.44.0.md A6-2):
// the page globals, the module ids that the mobile overlay requires inside ace.define, and the Ace members that the
// declarations do not list but the bridge uses on purpose. tools/ace-lsp/typecheck-ace-bridge.mjs checks the bridge
// scripts against ace.d.ts plus this file, so a call to an Ace method that does not exist fails `check`.
// Keep additions narrow: declare only what the bridge really uses, with the type Ace gives it at runtime.

interface Window {
    ace: typeof import("ace-builds") & {
        define(name: string, deps: string[], factory: (require: (id: string) => any, exports: any, module: any) => void): void;
    };
    // Host bridge objects (AceBridge.kt) and the AutoJs6 scripts that share the page.
    autojs: any;
    editor: import("ace-builds").Ace.Editor;
    AutoJsAce: any;
    AutoJsAceCompleter: any;
    AutoJsAceIndices: any;
    AutoJsAceLanguageRouting: any;
    AutoJsAceLspClient: any;
    AutoJsAceMobile: any;
    AutoJsAceModePatches: any;
    AutoJsAceSignatureHelp: any;
    AutoJsAceTooltip: any;
}

declare var ace: Window["ace"];
declare var autojs: any;

interface Error {
    // Set on font loading failures so that the bridge drops its installed font cache.
    autojs6InvalidateInstalledFontCache?: boolean;
}

// Modules that autojs6/mobile/*.js require inside ace.define.
declare module "ace/mouse/mouse_event" {
    export { MouseEvent } from "ace-builds-internal/mouse/mouse_event";
}
declare module "ace/lib/event" {
    export * from "ace-builds-internal/lib/event";
}
declare module "ace/lib/dom" {
    export * from "ace-builds-internal/lib/dom";
}
declare module "autojs6/mobile/velocity_tracker" {
    export const VelocityTracker: any;
}
declare module "autojs6/mobile/scroller" {
    export const Scroller: any;
}
declare module "autojs6/mobile/magnifier" {
    export const Magnifier: any;
}

declare module "ace-builds" {
    namespace Ace {
        interface EditorEvents {
            // Emitted by Ace's mouse handler (ace/mouse/default_gutter_handler, ace/mouse/mouse_handler).
            "guttermousedown": (e: any) => void;
            "click": (e: any) => void;
        }
        interface EditorOptions {
            // Registered by ext-whitespaces_in_selection.js.
            showWhitespacesInSelection: boolean;
        }
    }
}

declare module "ace-builds-internal/edit_session" {
    interface EditSession {
        // Long line safety mode flag that the bridge sets for the LSP client (autojs6_lsp_client.js).
        $autojs6LongLineSafetyMode?: boolean;
        __autojs6HistoryOperationHooksInstalled?: boolean;
        // Private Ace members the bridge relies on (fold placeholder taps).
        $toggleFoldWidget(row: number, options: any): any;
    }
}

declare module "ace-builds-internal/document" {
    interface Document {
        // Private Ace members the bridge relies on (restoring the line separator after undo / redo).
        $autoNewLine: string;
        _signal(eventName: string, e?: any): void;
    }
}

declare module "ace-builds-internal/editor" {
    interface Editor {
        // Private Ace members the bridge relies on.
        $mouseHandler: any;
        onCompositionStart(compositionState?: any): void;
        onCompositionEnd(): void;
        // Installation flags of bridge hooks.
        $autojs6TouchCursorSelectionGuardInstalled?: boolean;
        $autojs6MemberCompletionDotTriggerInstalled?: boolean;
    }
}

declare module "ace-builds-internal/virtual_renderer" {
    interface VirtualRenderer {
        // Public in Ace but missing from ace.d.ts.
        onResize(force?: boolean, gutterWidth?: number, width?: number, height?: number): number;
        // Private Ace members the bridge relies on.
        $textLayer: any;
        $gutterLayer: any;
        $padding: number;
        $isMousePressed: boolean;
    }
}
