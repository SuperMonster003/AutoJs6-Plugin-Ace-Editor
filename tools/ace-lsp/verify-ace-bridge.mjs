#!/usr/bin/env node

// Executable tests of the AutoJs6 Ace bridge (Roadmap-Ace-1.44.0.md A6-3).
//
//   node tools/ace-lsp/verify-ace-bridge.mjs [--filter <text>] [--install-only]
//
// The real editor page (autojs6_editor.html with the pinned ace-builds 1.44.0 files, the mobile overlay and the bridge)
// runs in jsdom with a fake `window.autojs` that records every host call. jsdom is pinned by
// tools/ace-lsp/ace-bridge-test/package-lock.json and installed by ace-bridge-test/dependencies.mjs under
// build/ace-bridge-test/<lock hash>; node_modules is never committed. jsdom has no layout engine, so tests that need rendered rows give the editor a fixed
// size and character metrics first (layoutEditor).

import assert from "node:assert/strict";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { loadAceBridgeTestDependencies } from "./ace-bridge-test/dependencies.mjs";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = path.resolve(SCRIPT_DIR, "..", "..");
const EDITOR_ROOT = path.join(REPOSITORY_ROOT, "app", "src", "main", "assets", "editor", "ace-builds-1.44.0");
const EDITOR_PAGE = path.join(EDITOR_ROOT, "autojs6_editor.html");
const READY_TIMEOUT_MS = 15000;

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// Copies a value out of the jsdom realm so that node:assert compares structure, not prototypes.
function plain(value) {
    return JSON.parse(JSON.stringify(value));
}

// ---------------------------------------------------------------------------------------------------------------
// Editor page

let JSDOM;
let VirtualConsole;

// Host answers for the bridge getters. Anything not listed returns undefined, so the bridge uses its own defaults.
function createHost(overrides) {
    const calls = [];
    const answers = { isTouchMagnifierEnabled: false, ...overrides };
    const host = new Proxy({}, {
        get(_, name) {
            if (typeof name !== "string") return undefined;
            return (...args) => {
                calls.push({ name, args });
                const answer = answers[name];
                return typeof answer === "function" ? answer(...args) : answer;
            };
        },
    });
    return { host, calls };
}

async function openEditor(options = {}) {
    const { host, calls } = createHost(options.host || {});
    const errors = [];
    const virtualConsole = new VirtualConsole();
    virtualConsole.on("jsdomError", (error) => errors.push(String(error && (error.stack || error.message) || error)));
    virtualConsole.on("error", (...args) => errors.push(args.map(String).join(" ")));
    const dom = await JSDOM.fromFile(EDITOR_PAGE, {
        runScripts: "dangerously",
        resources: "usable",
        pretendToBeVisual: true,
        virtualConsole,
        beforeParse(window) {
            if (options.canvas !== false) {
                // jsdom has no 2D context; the custom scrollbar draws its annotation markers on one.
                window.HTMLCanvasElement.prototype.getContext = () => new Proxy({}, { get: () => () => undefined });
            }
            window.autojs = host;
            if (options.userAgent) {
                // Read by Ace (useragent.isMobile) and the bridge (isAndroidUserAgent) while the page loads.
                Object.defineProperty(window.navigator, "userAgent", { configurable: true, get: () => options.userAgent });
            }
            if (typeof options.wrapLspClient === "function") {
                // autojs6_lsp_client.js assigns window.AutoJsAceLspClient; wrap the client the bridge installs.
                let runtime;
                Object.defineProperty(window, "AutoJsAceLspClient", {
                    configurable: true,
                    get: () => runtime,
                    set: (value) => {
                        runtime = {
                            ...value,
                            install: (...args) => options.wrapLspClient(value.install(...args)),
                        };
                    },
                });
            }
        },
    });
    const deadline = Date.now() + READY_TIMEOUT_MS;
    while (!calls.some((call) => call.name === "notifyReady")) {
        if (Date.now() > deadline) {
            dom.window.close();
            throw new Error(`the editor did not call notifyReady; errors: ${errors.join(" | ")}`);
        }
        await sleep(20);
    }
    const window = dom.window;
    const page = {
        window,
        editor: window.editor,
        api: window.AutoJsAce,
        calls,
        errors,
        names: () => calls.map((call) => call.name),
        events: (name) => calls
            .filter((call) => call.name === "notifyEvent" && call.args[0] === name)
            .map((call) => JSON.parse(call.args[1])),
        clearCalls: () => calls.splice(0, calls.length),
        close: () => window.close(),
    };
    if (options.layout !== false) layoutEditor(page);
    await sleep(50);
    return page;
}

// Gives the editor a 400 x 600 px viewport with 10 x 20 px characters and renders synchronously.
function layoutEditor(page) {
    const { editor } = page;
    const renderer = editor.renderer;
    renderer.$fontMetrics.$characterSize = { width: 10, height: 20 };
    renderer.$textLayer.$characterSize = { width: 10, height: 20 };
    // Ace measures offset* in some places and client* in others (onResize without arguments, used by the bridge).
    for (const [name, value] of [["offsetWidth", 400], ["offsetHeight", 600], ["clientWidth", 400], ["clientHeight", 600]]) {
        Object.defineProperty(editor.container, name, { configurable: true, get: () => value });
    }
    renderer.updateCharacterSize();
    renderer.onResize(true, 40, 360, 600);
    renderer.updateFull(true);
}

function render(page) {
    page.editor.renderer.updateFull(true);
}

function touchEvent(page, type, target, x, y) {
    const event = new page.window.Event(type, { bubbles: true, cancelable: true });
    const touches = [{ clientX: x, clientY: y, target }];
    event.touches = type === "touchend" ? [] : touches;
    event.changedTouches = touches;
    target.dispatchEvent(event);
    return event;
}

function mouseDown(page, target, x, y) {
    const event = new page.window.MouseEvent("mousedown", { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 0 });
    target.dispatchEvent(event);
    return event;
}

const ANDROID_USER_AGENT =
    "Mozilla/5.0 (Linux; Android 15; XQ-AT72) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36";

// Ace's hidden textarea as an Android IME sees it. jsdom fires no selectionchange and moves no caret for keys, so the
// helpers do what the browser would: the IME puts the caret somewhere, Ace handles a command key.
function imeTextarea(page) {
    const { window, editor } = page;
    const element = editor.textInput.getElement();
    const selectionChanged = () => window.document.dispatchEvent(new window.Event("selectionchange"));
    return {
        element,
        get value() {
            return element.value;
        },
        get caret() {
            return element.selectionStart;
        },
        selectionChanged,
        setCaret(offset) {
            element.setSelectionRange(offset, offset);
            selectionChanged();
        },
        key(keyCode, init = {}) {
            for (const type of ["keydown", "keyup"]) {
                const event = new window.KeyboardEvent(type, { bubbles: true, cancelable: true, ...init });
                Object.defineProperty(event, "keyCode", { get: () => keyCode });
                Object.defineProperty(event, "which", { get: () => keyCode });
                element.dispatchEvent(event);
            }
            selectionChanged();
        },
        // Gboard marks the word under the cursor as a composition without changing it.
        markWord(word) {
            element.dispatchEvent(new window.CompositionEvent("compositionstart", { data: "", bubbles: true }));
            element.dispatchEvent(new window.CompositionEvent("compositionupdate", { data: word, bubbles: true }));
        },
        compositionUpdate(word) {
            element.dispatchEvent(new window.CompositionEvent("compositionupdate", { data: word, bubbles: true }));
        },
    };
}

async function openAndroidEditor(text) {
    const page = await openEditor({ userAgent: ANDROID_USER_AGENT });
    page.api.setText(text);
    page.editor.focus();
    // The bridge ignores a stray caret right after focusing (IME_TEXT_INPUT_PROGRAMMATIC_SELECTION_SUPPRESS_MS).
    await sleep(900);
    assert.equal(page.window.document.activeElement, page.editor.textInput.getElement(), "the textarea has the focus");
    return page;
}

function gutterCell(page, row) {
    const cells = [...page.window.document.querySelectorAll(".ace_gutter-cell, .ace_gutter-cell_svg-icons")];
    return cells.find((cell) => {
        const label = cell.firstChild && cell.firstChild.nodeType === 3 ? cell.firstChild.data : cell.textContent;
        return String(label).trim() === String(row + 1);
    });
}

// ---------------------------------------------------------------------------------------------------------------
// Tests

const tests = [];

function test(name, body) {
    tests.push({ name, body });
}

test("initializes Ace 1.44.0 and reports the runtime to the host", async () => {
    const page = await openEditor();
    try {
        assert.equal(page.window.ace.version, "1.44.0");
        assert.equal(page.names().filter((name) => name === "notifyReady").length, 1);
        const ready = JSON.parse(page.calls.find((call) => call.name === "notifyReady").args[0]);
        assert.equal(typeof ready, "object");
        const runtime = page.events("aceRuntime");
        assert.equal(runtime.length, 1);
        assert.deepEqual(runtime[0], {
            aceVersion: "1.44.0",
            mobileOverlay: { installed: true, uninstalledUpstreamListeners: 4, fallbackCapture: false, magnifier: false },
        });
        assert.deepEqual(page.errors, []);
    } finally {
        page.close();
    }
});

test("the mobile overlay replaces Ace's own touch listeners", async () => {
    const page = await openEditor();
    try {
        const { editor } = page;
        const remaining = (editor.$toDestroy || [])
            .filter((listener) => listener.elem === editor.container)
            .map((listener) => listener.type)
            .filter((type) => ["touchstart", "touchmove", "touchend", "contextmenu"].includes(type));
        // The overlay registers touchstart / touchmove / touchend itself; Ace's contextmenu listener is gone.
        assert.deepEqual([...remaining].sort(), ["touchend", "touchmove", "touchstart"]);
        assert.equal(page.api.getMobileOverlayState().uninstalledUpstreamListeners, 4);
        for (const name of ["startActionMode", "finishActionMode", "startActionModeIfSelectionInView"]) {
            assert.equal(typeof editor[name], "function", name);
        }
        assert.equal(typeof editor.renderer.getClientPosition, "function");
        assert.equal(editor.getOption("enableMobileMenu"), false);
    } finally {
        page.close();
    }
});

test("document paths route to Ace modes, deny by default", async () => {
    const page = await openEditor({ layout: false });
    try {
        const expected = {
            "a.json": "ace/mode/json",
            "a.py": "ace/mode/python",
            "a.lua": "ace/mode/lua",
            "A.java": "ace/mode/java",
            "a.kt": "ace/mode/kotlin",
            "a.kts": "ace/mode/kotlin",
            "a.tsx": "ace/mode/tsx",
            "a.ts": "ace/mode/typescript",
            "a.mts": "ace/mode/typescript",
            "a.cts": "ace/mode/typescript",
            "a.jsx": "ace/mode/jsx",
            "a.js": "ace/mode/javascript",
            "a.mjs": "ace/mode/javascript",
            "a.cjs": "ace/mode/javascript",
            "a.md": "ace/mode/text",
            "a.txt": "ace/mode/text",
            "Makefile": "ace/mode/text",
        };
        for (const [file, mode] of Object.entries(expected)) {
            assert.equal(page.api.resolveAceMode(`/sdcard/Scripts/${file}`), mode, file);
        }
        const routing = page.window.AutoJsAceLanguageRouting;
        // Static indexes exist for JavaScript / TypeScript and the M2 languages only.
        for (const [mode, supported] of Object.entries({
            "ace/mode/javascript": true,
            "ace/mode/jsx": true,
            "ace/mode/typescript": true,
            "ace/mode/tsx": true,
            "ace/mode/python": true,
            "ace/mode/lua": true,
            "ace/mode/java": true,
            "ace/mode/kotlin": true,
            "ace/mode/json": false,
            "ace/mode/text": false,
        })) {
            assert.equal(routing.supportsStaticIndexMode(mode), supported, mode);
        }
        for (const [file, language] of Object.entries({ "a.ts": "typescript", "a.tsx": "typescript", "a.py": "python" })) {
            page.api.setDocumentPath(`/sdcard/Scripts/${file}`);
            await sleep(50);
            assert.equal(page.editor.session.getMode().$id, expected[file], file);
            assert.equal(routing.languageIdForSession(page.editor.session), language, file);
        }
    } finally {
        page.close();
    }
});

test("only Lua and JSON documents use an Ace worker", async () => {
    const page = await openEditor({ layout: false });
    try {
        for (const [file, worker] of [["a.lua", true], ["a.js", false], ["a.json", true], ["a.py", false], ["a.ts", false]]) {
            page.api.setDocumentPath(`/sdcard/Scripts/${file}`);
            await sleep(30);
            assert.equal(page.editor.session.getUseWorker(), worker, file);
        }
    } finally {
        page.close();
    }
});

test("the long line safety mode switches to plain text and restores the routed mode", async () => {
    const page = await openEditor({ layout: false });
    try {
        page.api.setDocumentPath("/sdcard/Scripts/a.lua");
        page.api.setText("print(1)", false, true);
        await sleep(30);
        assert.equal(page.editor.session.getMode().$id, "ace/mode/text");
        assert.equal(page.editor.session.getUseWorker(), false);
        page.api.setText("print(2)", false, false);
        await sleep(30);
        assert.equal(page.editor.session.getMode().$id, "ace/mode/lua");
        assert.equal(page.editor.session.getUseWorker(), true);
    } finally {
        page.close();
    }
});

test("the long line safety mode renders 4096 characters and Ace's overflow button", async () => {
    const page = await openEditor();
    try {
        const { editor, window, api } = page;
        const textLayer = editor.renderer.$textLayer;
        const firstLine = () => {
            render(page);
            return window.document.querySelector(".ace_text-layer .ace_line");
        };
        api.setText("x".repeat(200000), false, true);
        await sleep(100);
        assert.equal(textLayer.MAX_LINE_LENGTH, 4096);
        let line = firstLine();
        const button = line.querySelector(".ace_inline_button.ace_toggle_wrap");
        assert.ok(button, "overflow button");
        assert.equal(line.textContent.length - button.textContent.length, 4096, "rendered characters");
        assert.equal(window.document.querySelector(".ace_text-layer").getAttribute("aria-hidden"), "true");
        api.setText("y".repeat(12000), false, false);
        await sleep(100);
        assert.equal(Object.prototype.hasOwnProperty.call(textLayer, "MAX_LINE_LENGTH"), false, "the prototype default applies again");
        assert.equal(textLayer.MAX_LINE_LENGTH, 10000);
        line = firstLine();
        const normalButton = line.querySelector(".ace_toggle_wrap");
        assert.ok(normalButton, "Ace truncates lines over 10000 characters outside the safety mode as well");
        assert.equal(line.textContent.length - normalButton.textContent.length, 10000);
        assert.equal(window.document.querySelector(".ace_text-layer").getAttribute("aria-hidden"), null);
        // A2-10: a finger tap on the button toggles soft wrap, as a mouse click does; the cursor stays.
        const cursor = plain(editor.getCursorPosition());
        const tapButton = (button) => {
            touchEvent(page, "touchstart", button, 10, 10);
            touchEvent(page, "touchend", button, 10, 10);
        };
        tapButton(normalButton);
        assert.equal(editor.session.getUseWrapMode(), true, "a tap on the overflow button turns soft wrap on");
        render(page);
        const hideButton = window.document.querySelector(".ace_text-layer .ace_toggle_wrap");
        assert.ok(hideButton, "the wrapped line ends with Ace's hide button");
        tapButton(hideButton);
        assert.equal(editor.session.getUseWrapMode(), false, "a second tap turns soft wrap off");
        assert.deepEqual(plain(editor.getCursorPosition()), cursor, "the cursor stays");
    } finally {
        page.close();
    }
});

// Roadmap-Ace-1.44.0.md A4-3: JSON.parse diagnostics until the json worker answers, then the worker's annotations.
// jsdom has no Worker, so Ace creates a WorkerClient around a worker that never answers; the test makes it answer by
// emitting "annotate" on the WorkerClient, as a real worker message would.
test("JSON documents prefer the json worker's annotations once it answers", async () => {
    const documentUri = "file:///sdcard/Scripts/config.json";
    const page = await openEditor({
        layout: false,
        host: { getLspOptions: JSON.stringify({ enabled: true, rootUri: "file:///sdcard/Scripts", documentUri }) },
    });
    try {
        const { editor, api } = page;
        const session = editor.session;
        const annotations = () => plain(session.getAnnotations()).map((item) => `${item.row}:${item.column}:${item.raw || ""}`);
        api.setDocumentPath("/sdcard/Scripts/config.json");
        api.refreshLsp("test");
        await sleep(100);
        assert.equal(session.getMode().$id, "ace/mode/json");
        assert.ok(session.$worker, "a WorkerClient for the json worker");
        api.setText('{\n  "a": 1,\n}\n');
        session.insert({ row: 0, column: 1 }, " ");
        await sleep(700);
        assert.equal(annotations().length, 1, "JSON.parse diagnostics before the worker answers");
        assert.ok(annotations()[0].endsWith(":json-syntax"));
        page.clearCalls();
        session.$worker._emit("annotate", { data: [{ row: 2, column: 0, text: "Unexpected '}'", type: "error" }] });
        assert.deepEqual(annotations(), ["2:0:json-worker"], "the worker's annotation replaces JSON.parse");
        assert.equal(plain(api.getLspDiagnostics()).length, 1, "the diagnostics state follows the worker");
        session.insert({ row: 1, column: 0 }, " ");
        await sleep(700);
        assert.deepEqual(annotations(), ["2:0:json-worker"], "JSON.parse no longer overwrites the worker");
        session.$worker._emit("annotate", { data: [] });
        assert.deepEqual(annotations(), [], "fixed JSON clears the worker annotation");
        api.setText("x".repeat(70000), false, true);
        await sleep(100);
        assert.equal(session.getUseWorker(), false, "no worker in the long line safety mode");
    } finally {
        page.close();
    }
});

test("mode patches restore Kotlin snippets and Java keyword completions", async () => {
    const page = await openEditor({ layout: false });
    try {
        page.api.setDocumentPath("/sdcard/Scripts/a.kt");
        await sleep(50);
        assert.equal(page.editor.session.getMode().snippetFileId, "ace/snippets/kotlin");
        page.api.setDocumentPath("/sdcard/Scripts/A.java");
        await sleep(50);
        const keywords = page.editor.session.getMode().$keywordList || [];
        for (const keyword of ["class", "interface", "sealed", "non-sealed", "record", "return"]) {
            assert.ok(keywords.includes(keyword), `java keyword ${keyword}`);
        }
    } finally {
        page.close();
    }
});

test("setText and setTextDirty publish only the final cursor position", async () => {
    const page = await openEditor({ layout: false });
    try {
        page.api.setText("alpha\nbeta");
        await sleep(50);
        page.clearCalls();
        page.api.setText("one\ntwo\nthree");
        await sleep(100);
        assert.equal(page.api.getText(), "one\ntwo\nthree");
        assert.equal(page.names().filter((name) => name === "notifyCursorChanged").length, 1);
        const undoManager = page.editor.session.getUndoManager();
        assert.equal(undoManager.hasUndo(), false);
        assert.equal(page.api.getState().dirty, false);
        page.clearCalls();
        page.api.setTextDirty("four\nfive");
        await sleep(100);
        assert.equal(page.api.getText(), "four\nfive");
        assert.equal(page.names().filter((name) => name === "notifyCursorChanged").length, 1);
        assert.equal(page.api.getState().dirty, true);
        page.clearCalls();
        assert.equal(page.api.refreshState(), true);
        assert.equal(page.names().filter((name) => name === "notifyStateChanged").length, 1, "refreshState notifies at once");
    } finally {
        page.close();
    }
});

test("an undoable history marker advances the history without changing the text", async () => {
    const page = await openEditor({ layout: false });
    try {
        page.api.setText("const answer = 42");
        await sleep(30);
        const undoManager = page.editor.session.getUndoManager();
        const revision = undoManager.getRevision();
        assert.equal(page.api.addUndoableHistoryMarker("marker-1"), true);
        assert.equal(page.api.getText(), "const answer = 42");
        assert.ok(undoManager.getRevision() > revision);
        assert.equal(undoManager.hasUndo(), true);
        page.clearCalls();
        page.api.undo();
        await sleep(50);
        assert.equal(page.api.getText(), "const answer = 42");
        const history = page.events("historyOperation");
        assert.equal(history.length, 1);
        assert.equal(history[0].token, "marker-1");
        assert.equal(history[0].direction, "undo");
        assert.equal(history[0].state.canRedo, true);
        // Document.applyDelta ignores the empty marker delta in both directions.
        page.editor.session.doc.applyDelta({ action: "insert", start: { row: 0, column: 3 }, end: { row: 0, column: 3 }, lines: [""] });
        assert.equal(page.api.getText(), "const answer = 42");
    } finally {
        page.close();
    }
});

test("undo and redo report tagged operations after the pending text and state callbacks", async () => {
    const page = await openEditor({ layout: false });
    try {
        page.api.setText("before\r\nsecond");
        await sleep(30);
        const newLineBefore = page.editor.session.doc.getNewLineCharacter();
        assert.equal(page.api.replaceAllTextUndoably("after\nline", "rename-1"), true);
        assert.equal(page.api.getText(), "after\nline");
        assert.equal(page.api.getState().dirty, true);
        await sleep(100);
        page.clearCalls();
        page.api.undo();
        await sleep(100);
        assert.equal(page.api.getText().replace(/\r\n/g, "\n"), "before\nsecond");
        assert.equal(page.editor.session.doc.getNewLineCharacter(), newLineBefore);
        const names = page.names();
        const historyIndex = page.calls.findIndex((call) => call.name === "notifyEvent" && call.args[0] === "historyOperation");
        assert.ok(historyIndex >= 0, "historyOperation");
        const undoEvent = JSON.parse(page.calls[historyIndex].args[1]);
        assert.deepEqual(
            { token: undoEvent.token, direction: undoEvent.direction, canUndo: undoEvent.state.canUndo, canRedo: undoEvent.state.canRedo, dirty: undoEvent.state.dirty },
            { token: "rename-1", direction: "undo", canUndo: false, canRedo: true, dirty: false },
        );
        // historyOperation is the final notification of the navigation: the throttled text and state callbacks of
        // the undo are flushed before it.
        const textIndex = names.indexOf("notifyTextChanged");
        const stateIndex = names.indexOf("notifyStateChanged");
        assert.ok(textIndex >= 0 && textIndex < historyIndex, "text callback before historyOperation");
        assert.ok(stateIndex >= 0 && stateIndex < historyIndex, "state callback before historyOperation");
        assert.ok(!names.slice(historyIndex + 1).includes("notifyTextChanged"), "no text callback after historyOperation");
        page.clearCalls();
        page.api.redo();
        await sleep(100);
        const redoEvent = page.events("historyOperation").pop();
        assert.equal(redoEvent.direction, "redo");
        assert.equal(redoEvent.token, "rename-1");
        assert.equal(redoEvent.state.canUndo, true);
        assert.equal(page.api.getText(), "after\nline");
    } finally {
        page.close();
    }
});

test("the dirty state follows the Ace clean bookmark", async () => {
    const page = await openEditor({ layout: false });
    try {
        page.api.setText("abc");
        await sleep(30);
        assert.equal(page.api.getState().dirty, false);
        page.editor.session.insert({ row: 0, column: 3 }, "d");
        page.editor.session.getUndoManager().$syncRev && page.editor.session.getUndoManager().$syncRev();
        await sleep(100);
        assert.equal(page.api.getState().dirty, true);
        page.api.markClean();
        assert.equal(page.api.getState().dirty, false);
        page.api.markDirty();
        assert.equal(page.api.getState().dirty, true);
    } finally {
        page.close();
    }
});

test("fold all and unfold all", async () => {
    const page = await openEditor();
    try {
        page.api.setText("function a() {\n  if (x) {\n    y();\n  }\n}\nfunction b() {\n  z();\n}\n");
        await sleep(100);
        page.api.foldAll();
        await sleep(50);
        assert.ok(page.editor.session.getAllFolds().length >= 2, "folds after foldAll");
        page.api.unfoldAll();
        await sleep(50);
        assert.equal(page.editor.session.getAllFolds().length, 0);
    } finally {
        page.close();
    }
});

for (const svgGutterIcons of [true, false]) {
    test(`gutter taps toggle breakpoints, annotation icons do not (svg icons ${svgGutterIcons ? "on" : "off"})`, async () => {
        const page = await openEditor({ host: { isSvgGutterIconsEnabled: svgGutterIcons } });
        try {
            const { editor, window } = page;
            const session = editor.session;
            page.api.setText("line0 {\nline1\n}\nline3\nline4\n");
            session.setAnnotations([{ row: 2, column: 0, text: "boom", type: "error" }]);
            render(page);
            await sleep(100);
            const cellClass = svgGutterIcons ? "ace_gutter-cell_svg-icons" : "ace_gutter-cell";
            assert.ok(gutterCell(page, 3).classList.contains(cellClass), "cell class");
            mouseDown(page, gutterCell(page, 3), 5, 3 * 20 + 5);
            assert.equal(session.getBreakpoints()[3], "ace_breakpoint");
            mouseDown(page, gutterCell(page, 3), 5, 3 * 20 + 5);
            assert.ok(!session.getBreakpoints()[3], "second tap clears the breakpoint");
            const childSpan = gutterCell(page, 4).childNodes[2] || gutterCell(page, 4);
            mouseDown(page, childSpan, 5, 4 * 20 + 5);
            assert.equal(session.getBreakpoints()[4], "ace_breakpoint", "a tap on a cell child toggles its row");
            render(page);
            const icon = gutterCell(page, 2).querySelector(svgGutterIcons ? ".ace_icon_svg" : ".ace_icon");
            assert.ok(icon, "annotation icon");
            mouseDown(page, icon, 5, 2 * 20 + 5);
            assert.ok(!session.getBreakpoints()[2], "the annotation icon does not toggle a breakpoint");
            render(page);
            mouseDown(page, gutterCell(page, 2), 5, 2 * 20 + 5);
            assert.equal(session.getBreakpoints()[2], "ace_breakpoint", "beside the icon a row with diagnostics takes a breakpoint");
            assert.ok(window.document.querySelector(".ace_gutter-cell_svg-icons, .ace_gutter-cell"));
        } finally {
            page.close();
        }
    });
}

// Roadmap-Ace-1.44.0.md A2-10: the mobile overlay passes gutter taps to the bridge; the editor is not focused (no
// soft keyboard, no scroll to the cursor) and the cursor stays.
test("finger taps on the gutter toggle breakpoints without focusing the editor", async () => {
    const page = await openEditor();
    try {
        const { editor } = page;
        const session = editor.session;
        page.api.setText(Array.from({ length: 12 }, (_, row) => `line${row} value`).join("\n"));
        session.setAnnotations([{ row: 2, column: 0, text: "boom", type: "error" }]);
        render(page);
        await sleep(100);
        editor.blur();
        editor.moveCursorTo(9, 3);
        page.clearCalls();
        const tap = (target, x, y) => {
            const start = touchEvent(page, "touchstart", target, x, y);
            touchEvent(page, "touchend", target, x, y);
            return start;
        };
        const start = tap(gutterCell(page, 4), 20, 4 * 20 + 5);
        assert.equal(start.defaultPrevented, true, "the gutter touchstart is prevented (no synthesized mouse events)");
        assert.equal(session.getBreakpoints()[4], "ace_breakpoint", "a tap on the line number toggles the breakpoint");
        tap(gutterCell(page, 4), 30, 4 * 20 + 5);
        assert.ok(!session.getBreakpoints()[4], "a second tap clears it");
        tap(gutterCell(page, 2), 30, 2 * 20 + 5);
        assert.equal(session.getBreakpoints()[2], "ace_breakpoint", "a row with diagnostics takes a breakpoint beside its icon");
        render(page);
        const icon = gutterCell(page, 2).querySelector(".ace_gutter_annotation");
        assert.ok(icon, "annotation icon");
        tap(icon, 8, 2 * 20 + 5);
        assert.equal(session.getBreakpoints()[2], "ace_breakpoint", "the icon does not toggle the breakpoint");
        assert.deepEqual(page.events("gutterTapDiagnostic"), [{ row: 2 }], "the icon opens the diagnostic marker");
        assert.equal(editor.isFocused(), false, "the editor stays unfocused");
        assert.ok(!page.names().includes("showSoftInput"), "no soft keyboard");
        // The diagnostic marker needs the cursor on its row; plain gutter taps leave it alone.
        assert.deepEqual(page.events("gutterTapBreakpoint"), [{ row: 4 }, { row: 4 }, { row: 2 }]);
        page.api.setBreakpointMarkersEnabled(false);
        tap(gutterCell(page, 6), 20, 6 * 20 + 5);
        assert.ok(!session.getBreakpoints()[6], "no breakpoints while the host hides them");
    } finally {
        page.close();
    }
});

// Roadmap-Ace-1.44.0.md A3-1, A3-5: a finger on a gutter fold widget toggles the fold, a tap on a fold placeholder
// expands it. jsdom has no layout, so the widget gets a rectangle and the scroller sits at the origin.
test("touches toggle gutter fold widgets and expand fold placeholders", async () => {
    const page = await openEditor();
    try {
        const { editor, window, api } = page;
        const session = editor.session;
        api.setText("function a() {\n  b();\n}\nfunction c() {\n  d();\n}\n");
        await sleep(300);
        render(page);
        const widget = gutterCell(page, 0).querySelector(".ace_fold-widget");
        assert.ok(widget, "fold widget on row 0");
        widget.getBoundingClientRect = () => ({ left: 20, right: 31, top: 0, bottom: 20, width: 11, height: 20 });
        page.clearCalls();
        touchEvent(page, "touchstart", widget, 25, 10);
        touchEvent(page, "touchend", widget, 25, 10);
        assert.equal(session.getAllFolds().length, 1, "folded by the widget");
        assert.deepEqual(page.events("gutterFoldToggled"), [{ row: 0 }]);
        render(page);
        const placeholder = window.document.querySelector(".ace_text-layer .ace_fold");
        assert.ok(placeholder, "fold placeholder");
        page.clearCalls();
        const x = editor.renderer.$padding + 15 * 10;
        touchEvent(page, "touchstart", placeholder, x, 10);
        touchEvent(page, "touchend", placeholder, x, 10);
        assert.equal(session.getAllFolds().length, 0, "expanded by a tap on the placeholder");
        assert.equal(page.events("foldPlaceholderTouchExpanded").length, 1);
        assert.equal(typeof editor.renderer.$padding, "number", "the bridge reads renderer.$padding as a number (A3-7)");
    } finally {
        page.close();
    }
});

test("ActionMode calls reach the host", async () => {
    const page = await openEditor();
    try {
        const { editor } = page;
        page.api.setText("alpha beta");
        editor.selection.setRange({ start: { row: 0, column: 0 }, end: { row: 0, column: 5 } });
        page.clearCalls();
        editor.startActionMode();
        const start = page.calls.find((call) => call.name === "startActionMode");
        assert.ok(start, "startActionMode");
        assert.equal(start.args[4], true, "hasSelection");
        assert.equal(editor.actionMode, "selectionActionMode");
        editor.finishActionMode();
        assert.ok(page.names().includes("finishActionMode"));
        assert.equal(editor.actionMode, "");
        // A2-10: a tap on the cursor asks for the insertion toolbar (paste), typing closes it.
        editor.clearSelection();
        editor.moveCursorTo(0, 3);
        render(page);
        const caret = editor.renderer.$cursorLayer.getPixelPosition(editor.getCursorPosition(), true);
        const content = page.window.document.querySelector(".ace_content");
        page.clearCalls();
        touchEvent(page, "touchstart", content, caret.left, caret.top + 5);
        touchEvent(page, "touchend", content, caret.left, caret.top + 5);
        assert.deepEqual(page.names().filter((name) => /ActionMode$/.test(name)), ["startInsertionActionMode"]);
        assert.equal(editor.actionMode, "insertionActionMode");
        editor.insert("x");
        assert.equal(editor.actionMode, "");
        assert.ok(page.names().includes("finishActionMode"), "typing closes the insertion toolbar");
    } finally {
        page.close();
    }
});

test("the drag magnifier clones rows unwrapped and without Ace's per-row containment", async () => {
    const page = await openEditor({ host: { isTouchMagnifierEnabled: true } });
    try {
        const { editor, window } = page;
        page.api.setText(Array.from({ length: 20 }, (_, row) => `line${row} alpha beta gamma delta epsilon zeta eta`).join("\n"));
        render(page);
        assert.ok(editor.container.classList.contains("ace_hidpi"), "the hidpi containment rules apply");
        const { Magnifier } = window.ace.require("autojs6/mobile/magnifier");
        const magnifier = new Magnifier(editor.container, editor);
        magnifier.show({ row: 5, column: 30 }, { x: 200, y: 300 });
        const clones = [...magnifier.content.children].filter((node) => node.classList.contains("ace_line"));
        assert.deepEqual(clones.map((clone) => clone.textContent.split(" ")[0]), ["line4", "line5", "line6"]);
        // Without white-space: pre the rows wrap inside the narrow content, and with Ace's containment the rows are
        // clipped to the content width before they are shifted to center the cursor: the magnifier stays empty.
        assert.equal(window.getComputedStyle(magnifier.content).whiteSpace, "pre");
        for (const clone of clones) {
            const style = window.getComputedStyle(clone);
            assert.equal(style.contain, "none", clone.textContent);
            assert.equal(style.right, "auto", clone.textContent);
        }
        // The cursor is drawn in the middle of the center row.
        const carets = magnifier.content.querySelectorAll(".autojs6-magnifier-cursor.ace_cursor");
        assert.equal(carets.length, 1);
        assert.equal(carets[0].style.left, parseFloat(magnifier.content.style.width) / 2 + "px");
        assert.equal(carets[0].style.top, clones[1].style.top);
        magnifier.destroy();
    } finally {
        page.close();
    }
});

test("Ace 1.44.0 display options follow the host preferences", async () => {
    const options = (editor) => ({
        displayIndentGuides: editor.getOption("displayIndentGuides"),
        highlightIndentGuides: editor.getOption("highlightIndentGuides"),
        useSvgGutterIcons: editor.getOption("useSvgGutterIcons"),
        customScrollbar: editor.getOption("customScrollbar"),
        showWhitespacesInSelection: editor.getOption("showWhitespacesInSelection"),
    });
    const defaults = await openEditor({ layout: false });
    try {
        assert.deepEqual(options(defaults.editor), {
            displayIndentGuides: true,
            highlightIndentGuides: true,
            useSvgGutterIcons: true,
            customScrollbar: true,
            showWhitespacesInSelection: true,
        });
        const api = defaults.api;
        api.setIndentGuidesEnabled(false);
        assert.equal(defaults.editor.getOption("highlightIndentGuides"), false, "no highlight without guides");
        api.setHighlightIndentGuidesEnabled(true);
        assert.equal(defaults.editor.getOption("highlightIndentGuides"), false, "still no highlight without guides");
        api.setIndentGuidesEnabled(true);
        assert.equal(defaults.editor.getOption("highlightIndentGuides"), true);
        api.setSvgGutterIconsEnabled(false);
        api.setCustomScrollbarEnabled(false);
        api.setWhitespacesInSelectionEnabled(false);
        assert.deepEqual(options(defaults.editor), {
            displayIndentGuides: true,
            highlightIndentGuides: true,
            useSvgGutterIcons: false,
            customScrollbar: false,
            showWhitespacesInSelection: false,
        });
    } finally {
        defaults.close();
    }
    const disabled = await openEditor({
        layout: false,
        host: {
            isHighlightIndentGuidesEnabled: false,
            isSvgGutterIconsEnabled: false,
            isCustomScrollbarEnabled: false,
            isWhitespacesInSelectionEnabled: false,
        },
    });
    try {
        assert.deepEqual(options(disabled.editor), {
            displayIndentGuides: true,
            highlightIndentGuides: false,
            useSvgGutterIcons: false,
            customScrollbar: false,
            showWhitespacesInSelection: false,
        });
    } finally {
        disabled.close();
    }
});

test("whitespace markers appear inside the selection only", async () => {
    const page = await openEditor();
    try {
        const { editor, window } = page;
        page.api.setText("function f() {\n\tif (x) {\n    \treturn  1;\n\t}\n}\n");
        render(page);
        const markers = () => window.document.querySelectorAll(".ace_text-layer [data-whitespace]").length;
        assert.equal(markers(), 0);
        editor.selection.setRange({ start: { row: 1, column: 0 }, end: { row: 2, column: 12 } });
        await sleep(50);
        render(page);
        assert.ok(markers() > 0, "markers inside the selection");
        editor.selection.clearSelection();
        await sleep(50);
        render(page);
        assert.equal(markers(), 0, "markers removed with the selection");
    } finally {
        page.close();
    }
});

test("a finger drags the custom scrollbar thumb", async () => {
    const page = await openEditor();
    try {
        const { editor } = page;
        page.api.setText(Array.from({ length: 300 }, (_, row) => `line ${row}`).join("\n"));
        render(page);
        // Let the resize that setText schedules run first: it scrolls the cursor into view.
        await sleep(300);
        render(page);
        const bar = editor.renderer.scrollBarV;
        assert.ok(Number.isFinite(bar.thumbTop) && bar.thumbHeight > 0, "the scrollbar has been laid out");
        assert.ok(bar.element.classList.contains("ace_sb-v"), "custom vertical scrollbar");
        bar.element.getBoundingClientRect = () => ({ left: 388, top: 0, right: 400, bottom: 600, width: 12, height: 600 });
        // A2-10: the scrollbars hide 2 s after the last scroll; a hidden one cannot be grabbed.
        const classes = editor.container.classList;
        await sleep(2100);
        assert.ok(classes.contains("autojs6-scrollbar-auto-hide"), "auto hide is on by default");
        assert.ok(!classes.contains("autojs6-scrollbar-v-shown"), "the vertical scrollbar is hidden");
        const before = editor.session.getScrollTop();
        const hiddenStart = touchEvent(page, "touchstart", bar.inner, 394, 5);
        assert.equal(hiddenStart.defaultPrevented, true);
        touchEvent(page, "touchmove", bar.inner, 394, 105);
        touchEvent(page, "touchend", bar.inner, 394, 105);
        assert.equal(editor.session.getScrollTop(), Math.max(0, before - 100), "a touch on a hidden scrollbar scrolls the text");
        editor.session.setScrollLeft(30);
        assert.ok(classes.contains("autojs6-scrollbar-h-shown") && !classes.contains("autojs6-scrollbar-v-shown"),
            "a horizontal scroll shows only the horizontal scrollbar");
        editor.session.setScrollLeft(0);
        editor.session.setScrollTop(1);
        editor.session.setScrollTop(0);
        assert.ok(classes.contains("autojs6-scrollbar-v-shown"), "a vertical scroll shows the vertical scrollbar");
        const cursor = editor.getCursorPosition();
        const start = touchEvent(page, "touchstart", bar.inner, 394, 5);
        assert.equal(start.defaultPrevented, true);
        touchEvent(page, "touchmove", bar.inner, 394, 105);
        const expected = bar.scrollTopFromThumbTop(100) - editor.renderer.scrollMargin.top;
        assert.equal(editor.session.getScrollTop(), expected);
        touchEvent(page, "touchend", bar.inner, 394, 105);
        await sleep(300);
        assert.equal(editor.session.getScrollTop(), expected, "no fling after a thumb drag");
        assert.deepEqual(plain(editor.getCursorPosition()), plain(cursor), "the cursor stays");
        touchEvent(page, "touchstart", bar.element, 394, 590);
        touchEvent(page, "touchend", bar.element, 394, 590);
        assert.ok(
            editor.session.getScrollTop() > expected,
            `a tap low on the track jumps down (${editor.session.getScrollTop()}, thumb ${bar.thumbTop} + ${bar.thumbHeight})`,
        );
        // A finger resting on the thumb keeps it visible past the delay.
        touchEvent(page, "touchstart", bar.inner, 394, 500);
        await sleep(2300);
        assert.ok(classes.contains("autojs6-scrollbar-v-shown"), "the scrollbar hid under the finger");
        touchEvent(page, "touchend", bar.inner, 394, 500);
        await sleep(2300);
        assert.ok(!classes.contains("autojs6-scrollbar-v-shown"), "the scrollbar stayed after the drag");
        page.api.setScrollbarAutoHideEnabled(false);
        assert.ok(!classes.contains("autojs6-scrollbar-auto-hide"), "the host switched auto hide off");
        const top = editor.session.getScrollTop();
        touchEvent(page, "touchstart", bar.inner, 394, 5);
        touchEvent(page, "touchmove", bar.inner, 394, 55);
        touchEvent(page, "touchend", bar.inner, 394, 55);
        assert.notEqual(editor.session.getScrollTop(), top, "without auto hide the thumb can be dragged at any time");
    } finally {
        page.close();
    }
    const alwaysShown = await openEditor({ host: { isScrollbarAutoHideEnabled: false } });
    try {
        assert.ok(!alwaysShown.editor.container.classList.contains("autojs6-scrollbar-auto-hide"));
    } finally {
        alwaysShown.close();
    }
});

test("the custom scrollbar falls back to native scrollbars without a canvas context", async () => {
    const page = await openEditor({ canvas: false, layout: false });
    try {
        assert.equal(page.editor.getOption("customScrollbar"), false);
        assert.ok(page.names().includes("notifyEvent"));
        assert.ok(page.window.AutoJsAce, "initialization completed");
    } finally {
        page.close();
    }
});

test("symbol highlights follow the cursor and clear on edits and selections", async () => {
    const requests = [];
    const highlights = [
        { start: { row: 0, column: 6 }, end: { row: 0, column: 11 }, kind: "write" },
        { start: { row: 1, column: 0 }, end: { row: 1, column: 5 }, kind: "read" },
    ];
    const page = await openEditor({
        wrapLspClient: (client) => {
            client.getDocumentHighlightsAsync = (pos, callback) => {
                requests.push(plain(pos));
                callback(null, highlights);
                return null;
            };
            return client;
        },
    });
    try {
        const { editor, window, api } = page;
        const drawn = (className = "autojs6_symbol_highlight") => {
            render(page);
            return window.document.querySelectorAll(`.ace_marker-layer .${className}`).length;
        };
        api.setText("const value = 1;\nvalue + 2;\n");
        await sleep(300);
        requests.length = 0;
        editor.moveCursorTo(0, 8);
        assert.equal(drawn(), 0, "nothing before the 150 ms delay");
        await sleep(250);
        assert.deepEqual(requests, [{ row: 0, column: 8 }]);
        assert.equal(drawn(), 2);
        assert.equal(drawn("autojs6_symbol_highlight_write"), 1);
        editor.session.insert({ row: 1, column: 10 }, " ");
        assert.equal(drawn(), 0, "an edit clears the highlights");
        await sleep(250);
        editor.selection.setRange({ start: { row: 0, column: 6 }, end: { row: 0, column: 11 } });
        assert.equal(drawn(), 0, "a selection clears the highlights");
        await sleep(250);
        assert.equal(drawn(), 0, "no highlights while a selection exists");
        requests.length = 0;
        editor.moveCursorTo(0, 5);
        editor.clearSelection();
        editor.moveCursorTo(0, 13);
        await sleep(250);
        assert.deepEqual(requests, [], "no request off an identifier");
        api.setReadOnly(true);
        editor.moveCursorTo(1, 2);
        await sleep(250);
        assert.equal(drawn(), 2, "read-only documents highlight too");
        api.setReadOnly(false);
        // Switching the option off clears the drawn highlights.
        page.api.setSmartHintOptions(JSON.stringify({ symbolHighlight: false }));
        assert.equal(drawn(), 0, "switching the option off clears the highlights");
    } finally {
        page.close();
    }
    const disabled = await openEditor({
        host: { getSmartHintOptions: JSON.stringify({ symbolHighlight: false }) },
        wrapLspClient: (client) => {
            client.getDocumentHighlightsAsync = (pos, callback) => {
                requests.push(plain(pos));
                callback(null, highlights);
                return null;
            };
            return client;
        },
    });
    try {
        disabled.api.setText("const value = 1;\nvalue + 2;\n");
        await sleep(300);
        requests.length = 0;
        disabled.editor.moveCursorTo(0, 8);
        await sleep(250);
        assert.deepEqual(requests, [], "the host switched symbol highlights off");
    } finally {
        disabled.close();
    }
});

// Roadmap-Ace-1.44.0.md A2-10, manual test C3: IME compositions that rewrite a word with itself must not add
// invisible edits to the undo history; real changes still apply.
test("unchanged IME composition replacements leave the document and its history alone", async () => {
    const page = await openEditor({ layout: false });
    try {
        const { editor, api } = page;
        api.setText("// third line to copy\nnext");
        await sleep(100);
        const undoDepth = () => (editor.session.getUndoManager().$undoStack || []).length;
        editor.moveCursorTo(0, 21);
        const depth = undoDepth();
        editor.onTextInput("copy", { extendLeft: 4, extendRight: 0, restoreStart: 0, restoreEnd: 0 });
        assert.equal(editor.getValue(), "// third line to copy\nnext");
        assert.equal(undoDepth(), depth, "no history entry for an unchanged word");
        assert.deepEqual(plain(editor.getCursorPosition()), { row: 0, column: 21 });
        editor.selection.setRange({ start: { row: 0, column: 17 }, end: { row: 0, column: 21 } });
        editor.onTextInput("copy", { extendLeft: 0, extendRight: 0, restoreStart: 0, restoreEnd: 0 });
        assert.equal(undoDepth(), depth, "no history entry for a selection replaced by itself");
        assert.deepEqual(plain(editor.getSelectionRange()), { start: { row: 0, column: 21 }, end: { row: 0, column: 21 } });
        assert.ok(page.events("imeUnchangedCompositionSkipped").length >= 2);
        editor.onTextInput("cope", { extendLeft: 4, extendRight: 0, restoreStart: 0, restoreEnd: 0 });
        assert.equal(editor.getValue(), "// third line to cope\nnext", "a real change still applies");
        assert.ok(undoDepth() > depth);
    } finally {
        page.close();
    }
});

// Roadmap-Ace-1.44.0.md A2-10, manual test C4: Ace copies the cursor row into its textarea ("\n" + row + "\n\n" on
// mobile). IME caret moves map through that copy; Ace's own caret updates are not IME moves.
test("arrow keys handled by Ace move the cursor once on Android", async () => {
    const page = await openAndroidEditor("abc\ndefg\nhi");
    try {
        const { editor } = page;
        const textarea = imeTextarea(page);
        editor.moveCursorTo(1, 0);
        await sleep(20); // Ace updates its textarea when the operation ends
        textarea.selectionChanged();
        assert.equal(textarea.value, "\ndefg\n\n");
        assert.equal(textarea.caret, 1);
        textarea.key(39);
        assert.deepEqual(plain(editor.getCursorPosition()), { row: 1, column: 1 }, "Right moves one column");
        textarea.key(39);
        assert.deepEqual(plain(editor.getCursorPosition()), { row: 1, column: 2 });
        textarea.key(37);
        assert.deepEqual(plain(editor.getCursorPosition()), { row: 1, column: 1 }, "Left moves one column");
        assert.equal(textarea.caret, 2, "the textarea caret follows the cursor");
        assert.deepEqual(page.events("imeTextInputSelection"), [], "Ace's own caret updates are no IME moves");
    } finally {
        page.close();
    }
});

test("IME caret moves map through the row Ace copied into the textarea", async () => {
    const page = await openAndroidEditor("abc\ndefg\nhi");
    try {
        const { editor } = page;
        const textarea = imeTextarea(page);
        const cursor = () => plain(editor.getCursorPosition());
        editor.moveCursorTo(1, 1);
        await sleep(20); // Ace updates its textarea when the operation ends
        textarea.selectionChanged();
        textarea.setCaret(4);
        assert.deepEqual(cursor(), { row: 1, column: 3 }, "a move within the row");
        textarea.setCaret(5);
        assert.deepEqual(cursor(), { row: 1, column: 4 });
        // A space bar slide continues over the newline after the row onto the next row ...
        textarea.setCaret(6);
        assert.deepEqual(cursor(), { row: 2, column: 0 }, "one step past the end of the row");
        assert.equal(textarea.value, "\nhi\n\n");
        assert.equal(textarea.caret, 1);
        // ... and over the newline before the row back onto the previous row.
        textarea.setCaret(0);
        assert.deepEqual(cursor(), { row: 1, column: 4 }, "one step before the start of the row");
        assert.equal(textarea.caret, 5);
        // Gboard's |< and >| put the caret at the start / end of the textarea text.
        editor.moveCursorTo(1, 2);
        await sleep(20); // Ace updates its textarea when the operation ends
        textarea.selectionChanged();
        textarea.setCaret(0);
        assert.deepEqual(cursor(), { row: 1, column: 0 }, "|< goes to the start of the row");
        textarea.setCaret(textarea.value.length);
        assert.deepEqual(cursor(), { row: 1, column: 4 }, ">| goes to the end of the row");
        assert.equal(textarea.caret, 5);
        textarea.setCaret(textarea.value.length);
        assert.deepEqual(cursor(), { row: 1, column: 4 }, ">| at the end of the row keeps the cursor");
        assert.equal(textarea.caret, 5, "and puts the caret back at the cursor");
        // The first row has no newline in front of it.
        editor.moveCursorTo(0, 2);
        await sleep(20); // Ace updates its textarea when the operation ends
        textarea.selectionChanged();
        assert.equal(textarea.value, "abc\n\n");
        textarea.setCaret(0);
        assert.deepEqual(cursor(), { row: 0, column: 0 });
        assert.ok(page.events("imeTextInputSelection").length > 0);
        assert.deepEqual(page.events("imeTextInputSelectionDropped"), []);
    } finally {
        page.close();
    }
});

test("an IME caret collapsing a selection lands where the IME put it", async () => {
    const page = await openAndroidEditor("abc\ndefg\nhi");
    try {
        const { editor, window } = page;
        const textarea = imeTextarea(page);
        const Range = window.ace.require("ace/range").Range;
        editor.selection.setRange(new Range(1, 0, 1, 3));
        await sleep(20); // Ace updates its textarea when the operation ends
        textarea.selectionChanged();
        assert.equal(textarea.element.selectionStart, 1);
        assert.equal(textarea.element.selectionEnd, 4);
        assert.equal(editor.getSelectedText(), "def", "Ace's own textarea selection changes nothing");
        // Gboard's "Select" mode ends with the caret at the end of the selection.
        textarea.setCaret(4);
        assert.deepEqual(plain(editor.getSelectionRange()), { start: { row: 1, column: 3 }, end: { row: 1, column: 3 } });
    } finally {
        page.close();
    }
});

test("cursor moves end an IME composition that marks the word under the cursor", async () => {
    const page = await openAndroidEditor("abc\ndefg hij\nhi");
    try {
        const { editor } = page;
        const textarea = imeTextarea(page);
        const cursor = () => plain(editor.getCursorPosition());
        editor.moveCursorTo(1, 2);
        await sleep(20); // Ace updates its textarea when the operation ends
        textarea.selectionChanged();
        textarea.markWord("defg");
        await sleep(10);
        assert.ok(editor.textInput.inComposition, "Gboard's composition is open");
        // The IME moves the caret (a space bar slide), then updates its composition.
        textarea.setCaret(5);
        assert.deepEqual(cursor(), { row: 1, column: 4 });
        assert.ok(!editor.textInput.inComposition, "the move ended the composition");
        textarea.compositionUpdate("defg");
        await sleep(80);
        assert.deepEqual(cursor(), { row: 1, column: 4 }, "a later composition update does not move the cursor");
        assert.equal(editor.getValue(), "abc\ndefg hij\nhi");
        // Arrow keys during a composition: Ace ignores command keys while one is open.
        textarea.markWord("defg");
        await sleep(10);
        assert.ok(editor.textInput.inComposition);
        textarea.key(38);
        assert.deepEqual(cursor(), { row: 0, column: 3 }, "Up goes to the previous row");
        textarea.markWord("abc");
        await sleep(10);
        textarea.key(39);
        await sleep(80);
        assert.deepEqual(cursor(), { row: 1, column: 0 }, "Right moves once");
        // Bridge moves (the host's cursor keys, symbol bar) end it as well.
        textarea.markWord("defg");
        await sleep(10);
        page.api.moveCursor(2);
        assert.ok(!editor.textInput.inComposition);
        textarea.compositionUpdate("defg");
        await sleep(80);
        assert.deepEqual(cursor(), { row: 1, column: 2 });
        assert.ok(page.events("imeCompositionEnded").length >= 3);
    } finally {
        page.close();
    }
});

test("the IME panel's select all and start / end buttons run as editor actions", async () => {
    const page = await openAndroidEditor("abc\ndefg hij\nhi");
    try {
        const { editor, api } = page;
        const textarea = imeTextarea(page);
        const selection = () => plain(editor.getSelectionRange());
        editor.moveCursorTo(1, 2);
        await sleep(20);
        textarea.selectionChanged();
        textarea.markWord("defg");
        await sleep(10);
        assert.ok(api.runImeEditingAction("lineEnd", false));
        assert.deepEqual(plain(editor.getCursorPosition()), { row: 1, column: 8 }, ">| goes to the end of the row");
        assert.ok(!editor.textInput.inComposition, "and ends Gboard's composition");
        api.runImeEditingAction("lineStart", false);
        assert.deepEqual(plain(editor.getCursorPosition()), { row: 1, column: 0 }, "|< at the start of the row stays");
        editor.moveCursorTo(1, 4);
        api.runImeEditingAction("lineEnd", true);
        assert.deepEqual(selection(), { start: { row: 1, column: 4 }, end: { row: 1, column: 8 } }, "Select mode with >|");
        editor.moveCursorTo(1, 4);
        api.runImeEditingAction("lineStart", true);
        assert.deepEqual(selection(), { start: { row: 1, column: 0 }, end: { row: 1, column: 4 } }, "Select mode with |<");
        textarea.markWord("defg");
        await sleep(10);
        assert.ok(api.runImeEditingAction("selectAll", false));
        assert.equal(editor.getSelectedText(), "abc\ndefg hij\nhi", "select all selects the document");
        assert.ok(!editor.textInput.inComposition);
        assert.equal(api.runImeEditingAction("unknown", false), false);
        assert.equal(editor.getValue(), "abc\ndefg hij\nhi");
    } finally {
        page.close();
    }
});

test("symbol highlights wait until a finger stops dragging the cursor", async () => {
    const requests = [];
    const page = await openEditor({
        wrapLspClient: (client) => {
            client.getDocumentHighlightsAsync = (pos, callback) => {
                requests.push(plain(pos));
                callback(null, []);
                return null;
            };
            return client;
        },
    });
    try {
        const { editor, window, api } = page;
        api.setText("const value = 1;\nvalue + another;\n");
        await sleep(300);
        editor.moveCursorTo(0, 7);
        render(page);
        await sleep(250);
        requests.length = 0;
        const content = window.document.querySelector(".ace_content");
        const caret = editor.renderer.$cursorLayer.getPixelPosition(editor.getCursorPosition(), true);
        const y = caret.top + 15;
        touchEvent(page, "touchstart", content, caret.left, y);
        touchEvent(page, "touchmove", content, caret.left + 30, y);
        await sleep(300);
        assert.notDeepEqual(plain(editor.getCursorPosition()), { row: 0, column: 7 }, "the finger drags the cursor");
        assert.deepEqual(requests, [], "no highlight request while the cursor rests under the finger");
        // Ace must not read the hidden textarea's selection changes as arrow keys during the drag (detectArrowKeys).
        assert.equal(editor.$mouseHandler.isMousePressed, true, "the drag holds Ace's pressed flag");
        assert.equal(editor.renderer.$isMousePressed, true, "the hidden textarea stays put during the drag");
        api.cancelTouchInteraction("single_finger_scroll");
        assert.equal(editor.$mouseHandler.isMousePressed, true, "a host cancel at the start of a finger move keeps it");
        touchEvent(page, "touchmove", content, caret.left + 40, y);
        touchEvent(page, "touchend", content, caret.left + 40, y);
        await sleep(250);
        assert.deepEqual(requests, [plain(editor.getCursorPosition())], "one request for the final position");
        assert.equal(editor.$mouseHandler.isMousePressed, false, "the flag is released after the lift");
        assert.equal(editor.renderer.$isMousePressed, false, "the textarea follows the cursor again");
    } finally {
        page.close();
    }
});

test("a slow highlight provider gets one request at a time", async () => {
    const requests = [];
    const pending = [];
    const page = await openEditor({
        wrapLspClient: (client) => {
            client.getDocumentHighlightsAsync = (pos, callback) => {
                requests.push(plain(pos));
                pending.push(callback);
                return null;
            };
            return client;
        },
    });
    try {
        const { editor, api } = page;
        api.setText("const value = 1;\nvalue + 2;\nconst other = value;\n");
        await sleep(300);
        // Answer what setText triggered (the cursor starts on an identifier).
        while (pending.length) pending.shift()(null, []);
        requests.length = 0;
        editor.moveCursorTo(0, 8);
        await sleep(200);
        editor.moveCursorTo(1, 2);
        await sleep(200);
        editor.moveCursorTo(2, 8);
        await sleep(200);
        assert.deepEqual(requests, [{ row: 0, column: 8 }], "one request while the first is pending");
        pending.shift()(null, [{ start: { row: 0, column: 6 }, end: { row: 0, column: 11 }, kind: "write" }]);
        assert.deepEqual(requests, [{ row: 0, column: 8 }, { row: 2, column: 8 }], "then the latest cursor position");
        render(page);
        assert.equal(page.window.document.querySelectorAll(".ace_marker-layer .autojs6_symbol_highlight").length, 0,
            "the stale answer is not drawn");
    } finally {
        page.close();
    }
});

test("the inline completion preview is opt-in, hidden during IME composition and accepted with TAB", async () => {
    const ghost = (page) => {
        render(page);
        return page.window.document.querySelectorAll(".ace_ghost_text").length;
    };
    const candidates = [{ caption: "zzqxAlpha", value: "zzqxAlpha", score: 2 }, { caption: "zzqxBeta", value: "zzqxBeta", score: 1 }];
    const off = await openEditor();
    try {
        assert.equal(off.editor.completer.inlineEnabled, false, "off by default");
        off.api.setText("zzqx");
        // The mode tokenizer of a fresh document would otherwise replace the ghost token.
        await sleep(300);
        off.editor.navigateFileEnd();
        off.editor.completers = [{ getCompletions(e, s, p, prefix, callback) { callback(null, candidates); } }];
        off.api.triggerSmartHint("test");
        await sleep(150);
        assert.equal(ghost(off), 0);
        off.editor.completer.detach();
    } finally {
        off.close();
    }
    const page = await openEditor({ host: { getSmartHintOptions: JSON.stringify({ inlineCompletionPreview: true }) } });
    try {
        const { editor, api } = page;
        assert.equal(editor.completer.inlineEnabled, true);
        api.setText("zzqx");
        // The mode tokenizer of a fresh document would otherwise replace the ghost token.
        await sleep(300);
        editor.navigateFileEnd();
        editor.completers = [{ getCompletions(e, s, p, prefix, callback) { callback(null, candidates); } }];
        api.triggerSmartHint("test");
        await sleep(150);
        assert.ok(ghost(page) > 0, "ghost text for the selected row");
        assert.equal(api.getText(), "zzqx", "the preview does not change the document");
        editor.onCompositionStart({});
        assert.equal(ghost(page), 0, "hidden while composing");
        editor.completer.$updateGhostText(editor.completer.popup.getData(0));
        assert.equal(ghost(page), 0, "not redrawn while composing");
        editor.onCompositionEnd();
        editor.completer.$updateGhostText(editor.completer.popup.getData(0));
        assert.ok(ghost(page) > 0, "shown again after the composition");
        api.acceptCompletionOrInsertTab();
        assert.equal(api.getText(), "zzqxAlpha", "TAB accepts the previewed row");
        assert.equal(ghost(page), 0);
        api.setText("zzqx");
        // The mode tokenizer of a fresh document would otherwise replace the ghost token.
        await sleep(300);
        editor.navigateFileEnd();
        api.triggerSmartHint("test");
        await sleep(150);
        assert.ok(ghost(page) > 0);
        api.handleEscapeKey();
        assert.equal(ghost(page), 0, "ESC removes the preview");
        api.setSmartHintOptions(JSON.stringify({ inlineCompletionPreview: false }));
        assert.equal(editor.completer.inlineEnabled, false, "the host switched the preview off");
    } finally {
        page.close();
    }
});

// Roadmap-Ace-1.44.0.md A5-6: the bridge keeps its own live / dot triggers (G-A5-6 found that Ace's upstream live
// autocompletion closes an open popup after a dot instead of restarting member completion). These cells pin them.
test("the bridge's completion triggers follow the smart hint options", async () => {
    const words = ["alpha", "alphabet", "abc", "abcdef", "objMethod", "objField"];
    const typing = async (options, steps) => {
        const page = await openEditor({ layout: false, host: { getSmartHintOptions: JSON.stringify(options) } });
        try {
            const { editor } = page;
            await sleep(300);
            const requests = [];
            editor.completers = [{
                getCompletions(e, session, pos, prefix, callback) {
                    const member = /\.\w*$/.test(session.getLine(pos.row).slice(0, pos.column));
                    requests.push(member ? `member:${prefix}` : prefix);
                    const items = member ? ["objMethod", "objField"] : words;
                    callback(null, items.map((value, index) => ({ caption: value, value, score: 10 - index })));
                },
            }];
            editor.focus();
            const popup = () => {
                const completer = editor.completer;
                return completer && completer.popup && completer.popup.isOpen ? completer.popup.data.map((row) => row.caption).join("|") : "";
            };
            const observed = [];
            for (const step of steps) {
                if (step.type) for (const ch of step.type) editor.execCommand("insertstring", ch);
                if (step.back) editor.execCommand("backspace");
                if (step.wait) await sleep(step.wait);
                observed.push(popup());
            }
            return { observed, requests };
        } finally {
            page.close();
        }
    };
    const identifier = { completionTrigger: "identifier", completionMinChars: 1, completionDelayMs: 0 };
    let result = await typing(identifier, [{ type: "a" }, { type: "b", wait: 50 }]);
    // Ace filters fuzzily, so "ab" still matches alphabet.
    assert.deepEqual(result.observed, ["alpha|alphabet|abc|abcdef", "abc|abcdef|alphabet"], "identifier, no delay");
    result = await typing({ ...identifier, completionMinChars: 3 }, [{ type: "ab", wait: 50 }, { type: "c", wait: 50 }]);
    assert.deepEqual(result.observed, ["", "abc|abcdef"], "minimum prefix of 3");
    result = await typing({ ...identifier, completionDelayMs: 300 }, [{ type: "a", wait: 100 }, { wait: 300 }]);
    assert.deepEqual(result.observed, ["", "alpha|alphabet|abc|abcdef"], "300 ms delay");
    result = await typing(identifier, [{ type: "al", wait: 100 }, { type: ".", wait: 300 }, { type: "o", wait: 100 }]);
    assert.deepEqual(result.observed, ["alpha|alphabet", "objMethod|objField", "objMethod|objField"], "member completion restarts after a dot");
    assert.ok(result.requests.includes("member:"), "a member request after the dot");
    result = await typing(identifier, [{ type: "a", wait: 100 }, { back: true, wait: 100 }]);
    assert.deepEqual(result.observed, ["alpha|alphabet|abc|abcdef", ""], "backspace to an empty prefix closes the popup");
    result = await typing({ ...identifier, completionTrigger: "dot" }, [{ type: "obj", wait: 300 }, { type: ".", wait: 300 }]);
    assert.deepEqual(result.observed, ["", "objMethod|objField"], "dot mode opens only after a dot");
    result = await typing({ ...identifier, completionTrigger: "off" }, [{ type: "obj", wait: 300 }, { type: ".", wait: 300 }]);
    assert.deepEqual(result.observed, ["", ""], "off");
    assert.deepEqual(result.requests, []);
});

test("the completion popup shows loading and empty states", async () => {
    const page = await openEditor({
        layout: false,
        host: { getSmartHintOptions: JSON.stringify({ completionLoadingText: "Loading-L10N", completionEmptyText: "Empty-L10N" }) },
    });
    try {
        const { editor, window, api } = page;
        const completer = editor.completer;
        assert.equal(completer.showLoadingState, true);
        assert.equal(completer.stickySelectionDelay, 500);
        assert.equal(completer.setSelectOnHover, false);
        const Autocomplete = window.ace.require("ace/autocomplete").Autocomplete;
        assert.equal(Autocomplete.for(editor), completer);
        assert.deepEqual(plain(Autocomplete.completionsForLoading), [{ caption: "Loading-L10N", value: "" }]);
        const rows = () => (completer.popup && completer.popup.isOpen ? completer.popup.data.map((row) => row.caption) : null);
        api.setText("zzqx");
        editor.navigateFileEnd();
        editor.focus();
        let calls = 0;
        editor.completers = [{ getCompletions(e, s, p, prefix, callback) { calls++; callback(null, []); } }];
        assert.equal(api.triggerSmartHint("test"), "completion");
        await sleep(150);
        assert.deepEqual(plain(rows()), ["Empty-L10N"], "explicit request without candidates");
        completer.detach();
        calls = 0;
        editor.execCommand("insertstring", "w");
        await sleep(300);
        assert.equal(calls, 1, "live completion ran");
        assert.equal(rows(), null, "live completion without candidates stays closed");
        let pending = null;
        editor.completers = [{ getCompletions(e, s, p, prefix, callback) { pending = callback; } }];
        api.triggerSmartHint("test");
        await sleep(700);
        assert.deepEqual(plain(rows()), ["Loading-L10N"], "slow provider");
        pending(null, [{ caption: "zzqxwAlpha", value: "zzqxwAlpha", score: 1 }]);
        await sleep(100);
        assert.deepEqual(plain(rows()), ["zzqxwAlpha"]);
        completer.detach();
    } finally {
        page.close();
    }
});

// Roadmap-Ace-1.44.0.md A2-10: on a narrow screen the documentation tooltip must not cover the completion popup.
// jsdom has no layout: the popup gets a rectangle and the tooltip one derived from its inline position.
test("the completion documentation stays off the popup on a narrow screen", async () => {
    const page = await openEditor({ layout: false });
    try {
        const { editor, window } = page;
        Object.defineProperty(window, "innerWidth", { configurable: true, value: 400 });
        Object.defineProperty(window, "innerHeight", { configurable: true, value: 700 });
        const original = window.HTMLElement.prototype.getBoundingClientRect;
        window.HTMLElement.prototype.getBoundingClientRect = function() {
            if (this.id !== "doc-tooltip") return original.call(this);
            const style = this.style;
            const px = (value) => (value === "" ? null : parseFloat(value));
            const height = Math.min(px(style.maxHeight) || 200, 200);
            const left = px(style.left) !== null ? px(style.left) : 0;
            const right = px(style.right) !== null ? 400 - px(style.right) : left + 600;
            const top = px(style.top) !== null ? px(style.top) : 700 - (px(style.bottom) || 0) - height;
            return { left, right, top, bottom: top + height, width: right - left, height };
        };
        page.api.setText("cons");
        editor.navigateFileEnd();
        editor.focus();
        editor.completers = [{
            getCompletions(e, s, p, prefix, callback) {
                callback(null, [{ caption: "console", value: "console", score: 1, docText: "declare var console: Console;\n".repeat(20) }]);
            },
        }];
        const completer = editor.completer;
        completer.showPopup(editor);
        await sleep(100);
        assert.ok(completer.popup && completer.popup.isOpen, "popup open");
        const popupRect = { left: 4, right: 396, top: 120, bottom: 320, width: 392, height: 200 };
        completer.popup.container.getBoundingClientRect = () => popupRect;
        const overlaps = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
        const show = (isTopdown) => {
            completer.popup.isTopdown = isTopdown;
            completer.showDocTooltip({ docText: "declare var console: Console;\n".repeat(20) });
            const node = completer.tooltipNode;
            return { node, rect: node.getBoundingClientRect(), display: node.style.display };
        };
        const below = show(true);
        assert.equal(below.display, "block");
        assert.ok(!overlaps(below.rect, popupRect), `the tooltip covers the popup ${JSON.stringify(below.rect)}`);
        assert.ok(below.rect.top >= popupRect.bottom, "a popup below the cursor gets its documentation below it");
        const above = show(false);
        assert.ok(!overlaps(above.rect, popupRect), `the tooltip covers the popup ${JSON.stringify(above.rect)}`);
        assert.ok(above.rect.bottom <= popupRect.top, "a popup above the cursor gets its documentation above it");
        popupRect.top = 20;
        popupRect.bottom = 680;
        assert.equal(show(true).display, "none", "without room the documentation is not shown over the popup");
        completer.detach();
        window.HTMLElement.prototype.getBoundingClientRect = original;
    } finally {
        page.close();
    }
});

// Manual test C11: no floating box covers the cursor row. jsdom has no layout, so the boxes get sizes from their styles
// (natural height, max-height) and the popup a fixed rectangle; rows are 20 px high from the top of the viewport.
function mockFloatingBoxRects(window, heights) {
    const original = window.HTMLElement.prototype.getBoundingClientRect;
    window.HTMLElement.prototype.getBoundingClientRect = function() {
        const key = this.id === "doc-tooltip" ? "doc" : [...this.classList].find((name) => heights[name]);
        const natural = this.id === "doc-tooltip" ? heights.doc : heights[key];
        if (!natural) return original.call(this);
        if (this.style.display === "none") return { left: 0, right: 0, top: 0, bottom: 0, width: 0, height: 0 };
        const px = (value) => (value === "" || value === undefined ? null : parseFloat(value));
        const height = Math.min(px(this.style.maxHeight) || natural, natural);
        const left = px(this.style.left) !== null ? px(this.style.left) : 0;
        const right = px(this.style.right) !== null ? 400 - px(this.style.right) : left + 300;
        const top = px(this.style.top) !== null ? px(this.style.top) : 700 - (px(this.style.bottom) || 0) - height;
        return { left, right, top, bottom: top + height, width: right - left, height };
    };
    return () => {
        window.HTMLElement.prototype.getBoundingClientRect = original;
    };
}

const coversRow = (rect, row) => rect.height > 0 && rect.top < (row + 1) * 20 && rect.bottom > row * 20;
const overlaps = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

test("the completion documentation never covers the cursor row", async () => {
    const page = await openEditor();
    try {
        const { editor, window } = page;
        Object.defineProperty(window, "innerWidth", { configurable: true, value: 400 });
        Object.defineProperty(window, "innerHeight", { configurable: true, value: 700 });
        const restore = mockFloatingBoxRects(window, { doc: 200 });
        page.api.setText(Array.from({ length: 30 }, (_, row) => `line${row} cons`).join("\n"));
        editor.focus();
        editor.completers = [{
            getCompletions(e, s, p, prefix, callback) {
                callback(null, [{ caption: "console", value: "console", score: 1, docText: "declare var console: Console;\n".repeat(20) }]);
            },
        }];
        const completer = editor.completer;
        const popupRect = { left: 4, right: 396, top: 0, bottom: 0, width: 392, height: 0 };
        const show = (row, isTopdown, top, bottom) => {
            editor.moveCursorTo(row, 11);
            completer.showPopup(editor);
            completer.popup.container.getBoundingClientRect = () => popupRect;
            Object.assign(popupRect, { top, bottom, height: bottom - top });
            completer.popup.isTopdown = isTopdown;
            completer.showDocTooltip({ docText: "declare var console: Console;\n".repeat(20) });
            const node = completer.tooltipNode;
            return { rect: node.getBoundingClientRect(), display: node.style.display };
        };
        // The popup opens right below the cursor row and fills the screen below it (C11, first case).
        const below = show(5, true, 120, 690);
        assert.equal(below.display, "block");
        assert.ok(!coversRow(below.rect, 5), `the documentation covers the cursor row ${JSON.stringify(below.rect)}`);
        assert.ok(!overlaps(below.rect, popupRect), "and stays off the popup");
        assert.ok(below.rect.bottom <= 100, "it moves above the cursor row");
        // The popup opens right above the cursor row and reaches the top of the screen (C11, second case).
        const above = show(5, false, 10, 100);
        assert.equal(above.display, "block");
        assert.ok(!coversRow(above.rect, 5), `the documentation covers the cursor row ${JSON.stringify(above.rect)}`);
        assert.ok(!overlaps(above.rect, popupRect), "and stays off the popup");
        assert.ok(above.rect.top >= 120, "it moves below the cursor row");
        // No room on either side of the row: hidden rather than over the line.
        assert.equal(show(0, true, 20, 690).display, "none");
        // Signature help above the row: the documentation goes above it, not over it.
        const signature = window.document.createElement("div");
        signature.className = "autojs6_signature_tooltip";
        const signatureRect = { left: 8, right: 300, top: 130, bottom: 156, width: 292, height: 26 };
        signature.getBoundingClientRect = () => signatureRect;
        window.document.body.appendChild(signature);
        const stacked = show(8, true, 180, 690);
        assert.equal(stacked.display, "block");
        assert.ok(!coversRow(stacked.rect, 8), `the documentation covers the cursor row ${JSON.stringify(stacked.rect)}`);
        assert.ok(!overlaps(stacked.rect, signatureRect), `the documentation covers the signature help ${JSON.stringify(stacked.rect)}`);
        signature.remove();
        completer.detach();
        restore();
    } finally {
        page.close();
    }
});

test("hover documentation and signature help keep clear of the cursor row", async () => {
    const hover = { caption: "foo", docText: "function foo(a: number): void\n\nDoes foo." };
    const help = { caption: "foo", signature: "foo(a: number): void", parameters: ["a: number"] };
    const page = await openEditor({
        wrapLspClient: (client) => {
            client.getHover = () => hover;
            client.getHoverAsync = (pos, callback) => {
                callback(null, hover);
                return null;
            };
            client.getSignatureHelp = () => help;
            client.getSignatureHelpAsync = (pos, callback) => {
                callback(null, help);
                return null;
            };
            return client;
        },
    });
    try {
        const { editor, window, api } = page;
        Object.defineProperty(window, "innerWidth", { configurable: true, value: 400 });
        Object.defineProperty(window, "innerHeight", { configurable: true, value: 700 });
        const restore = mockFloatingBoxRects(window, { autojs6_hover_tooltip: 120, autojs6_signature_tooltip: 60 });
        api.setText(Array.from({ length: 30 }, (_, row) => `foo(${row});`).join("\n"));
        await sleep(100);
        const box = (name) => window.document.querySelector("." + name);
        // The hover box opens 18 px below the top of the row, inside a 20 px row.
        editor.moveCursorTo(5, 1);
        assert.notEqual(api.triggerSymbolDocumentation("test"), "none");
        const hoverRect = box("autojs6_hover_tooltip").getBoundingClientRect();
        assert.ok(hoverRect.height > 0, "hover documentation shown");
        assert.ok(!coversRow(hoverRect, 5), `the hover documentation covers the cursor row ${JSON.stringify(hoverRect)}`);
        // A popup right below a row near the top leaves the signature help no room off the row and the popup.
        editor.moveCursorTo(1, 4);
        editor.completer = editor.completer || new (window.ace.require("ace/autocomplete").Autocomplete)();
        const popupRect = { left: 4, right: 396, top: 40, bottom: 690, width: 392, height: 650 };
        const popupContainer = window.document.createElement("div");
        popupContainer.getBoundingClientRect = () => popupRect;
        editor.completer.popup = { isOpen: true, isTopdown: true, container: popupContainer };
        api.triggerSignatureHelp("test");
        const signatureRect = box("autojs6_signature_tooltip").getBoundingClientRect();
        assert.ok(!coversRow(signatureRect, 1), `the signature help covers the cursor row ${JSON.stringify(signatureRect)}`);
        editor.completer.popup = null;
        api.triggerSignatureHelp("test");
        const freeRect = box("autojs6_signature_tooltip").getBoundingClientRect();
        assert.ok(freeRect.height > 0, "with room the signature help is shown");
        assert.ok(!coversRow(freeRect, 1), `the signature help covers the cursor row ${JSON.stringify(freeRect)}`);
        restore();
    } finally {
        page.close();
    }
});

// Manual test V5 (a): Gboard commits more than the dot ("g2" -> "g2.", "greeter " -> "greeter."), through
// insertstring or through a composition, which Ace applies outside commands.exec.
test("a dot committed together with other text opens the member completion", async () => {
    const page = await openEditor();
    try {
        const { editor } = page;
        const requests = [];
        page.api.setText("g2\ngreeter ");
        editor.focus();
        editor.completers = [{
            getCompletions(e, s, pos, prefix, callback) {
                requests.push(plain(pos));
                callback(null, [{ caption: "greet", value: "greet", score: 1 }]);
            },
        }];
        editor.moveCursorTo(0, 2);
        editor.execCommand("insertstring", "g2.");
        await sleep(150);
        assert.ok(requests.some((pos) => pos.row === 0), `insertstring "g2." did not request completions ${JSON.stringify(requests)}`);
        editor.completer.detach();
        requests.length = 0;
        // Gboard replaces the word and the space it added with the word and the dot.
        editor.moveCursorTo(1, 8);
        editor.onTextInput("greeter.", { extendLeft: 8, extendRight: 0, restoreStart: 0, restoreEnd: 0 });
        assert.equal(editor.session.getLine(1), "greeter.");
        await sleep(150);
        assert.ok(requests.some((pos) => pos.row === 1), `the composition "." did not request completions ${JSON.stringify(requests)}`);
        editor.completer.detach();
    } finally {
        page.close();
    }
});

// Manual test V5 (d): the completion popup is an Ace editor; Ace's own touch handler moved its selection along with a
// dragging finger.
test("the completion popup has no touch handler of Ace's own", async () => {
    const page = await openEditor();
    try {
        const { editor } = page;
        page.api.setText("cons");
        editor.navigateFileEnd();
        editor.focus();
        editor.completers = [{
            getCompletions(e, s, p, prefix, callback) {
                callback(null, ["console", "const", "constructor"].map((value, index) => ({ caption: value, value, score: 3 - index })));
            },
        }];
        editor.completer.showPopup(editor);
        await sleep(100);
        const popup = editor.completer.popup;
        assert.ok(popup && popup.isOpen, "popup open");
        const remaining = (popup.$toDestroy || [])
            .filter((listener) => listener.elem === popup.container)
            .map((listener) => listener.type)
            .filter((type) => ["touchstart", "touchmove", "touchend", "contextmenu"].includes(type));
        assert.equal(remaining.length, 0, `Ace's touch listeners remain on the popup: ${remaining.join(", ")}`);
        editor.completer.detach();
    } finally {
        page.close();
    }
});

// ---------------------------------------------------------------------------------------------------------------

async function main() {
    const argv = process.argv.slice(2);
    let filter = "";
    let installOnly = false;
    for (let index = 0; index < argv.length; index++) {
        if (argv[index] === "--filter") filter = String(argv[++index] || "");
        else if (argv[index] === "--install-only") installOnly = true;
        else throw new Error(`Unknown argument: ${argv[index]}`);
    }
    const requireDependency = loadAceBridgeTestDependencies();
    ({ JSDOM, VirtualConsole } = requireDependency("jsdom"));
    if (installOnly) return;
    const selected = tests.filter((entry) => entry.name.includes(filter));
    const failures = [];
    for (const entry of selected) {
        const started = Date.now();
        try {
            await entry.body();
            console.log(`  ok  ${entry.name} (${Date.now() - started} ms)`);
        } catch (error) {
            failures.push(entry.name);
            console.error(`  FAIL ${entry.name}\n${String(error && error.stack || error).replace(/^/gm, "       ")}`);
        }
    }
    if (failures.length) {
        console.error(`[ace bridge] ${failures.length} of ${selected.length} tests failed`);
        process.exitCode = 1;
        return;
    }
    console.log(`[ace bridge] ${selected.length} tests passed (jsdom, ace-builds ${"1.44.0"})`);
}

main().then(
    () => process.exit(process.exitCode || 0),
    (error) => {
        console.error(error && error.stack || error);
        process.exit(1);
    },
);
