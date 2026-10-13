#!/usr/bin/env node

// Executable tests of the AutoJs6 Ace bridge (Roadmap-Ace-1.44.0.md A6-3).
//
//   node tools/ace-lsp/verify-ace-bridge.mjs [--filter <text>] [--install-only]
//
// The real editor page (autojs6_editor.html with the pinned ace-builds 1.44.0 files, the mobile overlay and the bridge)
// runs in jsdom with a fake `window.autojs` that records every host call. jsdom is pinned by
// tools/ace-lsp/ace-bridge-test/package-lock.json and installed with `npm ci` under build/ace-bridge-test/<lock hash>;
// node_modules is never committed. jsdom has no layout engine, so tests that need rendered rows give the editor a fixed
// size and character metrics first (layoutEditor).

import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = path.resolve(SCRIPT_DIR, "..", "..");
const DEPENDENCY_DIR = path.join(SCRIPT_DIR, "ace-bridge-test");
const CACHE_ROOT = path.join(REPOSITORY_ROOT, "build", "ace-bridge-test");
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

function run(command, args, cwd) {
    const result = spawnSync(command, args, { cwd, encoding: "utf8", shell: false, stdio: ["ignore", "pipe", "pipe"] });
    if (result.error) throw result.error;
    if (result.status !== 0) {
        throw new Error(`${command} ${args.join(" ")} exited with status ${result.status}\n${result.stdout}\n${result.stderr}`);
    }
}

function runNpm(args, cwd) {
    if (process.platform === "win32") {
        const npmCli = path.join(path.dirname(process.execPath), "node_modules", "npm", "bin", "npm-cli.js");
        if (fs.existsSync(npmCli)) {
            run(process.execPath, [npmCli, ...args], cwd);
            return;
        }
    }
    run("npm", args, cwd);
}

// Installs the locked dependencies once per lock file content and returns a require() rooted there.
function loadDependencies() {
    const lock = fs.readFileSync(path.join(DEPENDENCY_DIR, "package-lock.json"));
    const manifest = fs.readFileSync(path.join(DEPENDENCY_DIR, "package.json"));
    const hash = crypto.createHash("sha256").update(manifest).update(lock).digest("hex").slice(0, 16);
    const installDir = path.join(CACHE_ROOT, hash);
    const marker = path.join(installDir, "node_modules", "jsdom", "package.json");
    if (!fs.existsSync(marker)) {
        fs.rmSync(installDir, { recursive: true, force: true });
        fs.mkdirSync(installDir, { recursive: true });
        fs.writeFileSync(path.join(installDir, "package.json"), manifest);
        fs.writeFileSync(path.join(installDir, "package-lock.json"), lock);
        console.log(`[ace bridge] installing pinned jsdom into ${path.relative(REPOSITORY_ROOT, installDir)}`);
        runNpm(["ci", "--ignore-scripts", "--no-audit", "--no-fund"], installDir);
    }
    return createRequire(path.join(installDir, "package.json"));
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

test("only Lua documents use an Ace worker", async () => {
    const page = await openEditor({ layout: false });
    try {
        for (const [file, worker] of [["a.lua", true], ["a.js", false], ["a.json", false], ["a.py", false], ["a.ts", false]]) {
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
            assert.ok(window.document.querySelector(".ace_gutter-cell_svg-icons, .ace_gutter-cell"));
        } finally {
            page.close();
        }
    });
}

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
    } finally {
        page.close();
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
    const requireDependency = loadDependencies();
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
