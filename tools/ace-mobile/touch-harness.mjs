// Deterministic fake environment for the Ace mobile touch code (no browser, no jsdom).
//
// Every implementation runs in its own vm context with a fake clock, fake DOM elements and a fake editor.
// All observable calls (editor, selection, renderer, host bridge, DOM writes) are appended to a trace, so two
// implementations are equivalent for a scenario when their traces are identical.

import vm from "node:vm";

export const LINE_HEIGHT = 20;
export const CHARACTER_WIDTH = 10;
export const TEXT_PADDING = 4;
export const SCROLLER_RECT = Object.freeze({ left: 40, top: 0, right: 400, bottom: 600, width: 360, height: 600 });
export const LINE_COUNT = 120;
export const CONTENT_WIDTH = 1000;

const LINES = Array.from({ length: LINE_COUNT }, (_, row) =>
    `line${row} alpha beta.gamma(delta) epsilon_zeta ${row}`.padEnd(64 + (row % 7), " x"),
);

function plain(value) {
    if (value === undefined) return "undefined";
    if (typeof value === "number" && Number.isNaN(value)) return "NaN";
    if (value === null || typeof value !== "object") return value;
    if (Array.isArray(value)) return value.map(plain);
    const result = {};
    for (const key of Object.keys(value).sort()) result[key] = plain(value[key]);
    return result;
}

export function createClock(start = 1000) {
    let now = start;
    let nextId = 1;
    const timers = new Map();
    return {
        get now() {
            return now;
        },
        setTimeout(fn, delay) {
            const id = nextId++;
            timers.set(id, { fn, due: now + Math.max(0, delay | 0), interval: 0 });
            return id;
        },
        setInterval(fn, delay) {
            const id = nextId++;
            const interval = Math.max(1, delay | 0);
            timers.set(id, { fn, due: now + interval, interval });
            return id;
        },
        clear(id) {
            timers.delete(id);
        },
        advance(ms) {
            const target = now + ms;
            for (;;) {
                let nextTimerId = null;
                let next = null;
                for (const [id, timer] of timers) {
                    if (timer.due <= target && (!next || timer.due < next.due || (timer.due === next.due && id < nextTimerId))) {
                        next = timer;
                        nextTimerId = id;
                    }
                }
                if (!next) break;
                now = next.due;
                if (next.interval) next.due += next.interval;
                else timers.delete(nextTimerId);
                next.fn();
            }
            now = target;
        },
        pendingCount() {
            return timers.size;
        },
    };
}

class FakeElement {
    constructor(env, name, classes = []) {
        this.env = env;
        this.name = name;
        this.id = "";
        this.tagName = "DIV";
        this.parentNode = null;
        this.children = [];
        this.classList = new Set(classes);
        this.listeners = {};
        this.offsetWidth = 200;
        this.offsetHeight = 60;
        this.rect = null;
        const element = this;
        const values = {};
        this.style = new Proxy(values, {
            set(target, property, value) {
                target[property] = value;
                env.record("style", element.label, String(property), value);
                return true;
            },
        });
    }

    get label() {
        return this.id || this.name;
    }

    appendChild(child) {
        this.env.record("dom.appendChild", this.label, child.label);
        if (child.parentNode) child.parentNode.children.splice(child.parentNode.children.indexOf(child), 1);
        child.parentNode = this;
        this.children.push(child);
        return child;
    }

    insertBefore(child, reference) {
        this.env.record("dom.insertBefore", this.label, child.label, reference ? reference.label : null);
        child.parentNode = this;
        const index = this.children.indexOf(reference);
        this.children.splice(index < 0 ? this.children.length : index, 0, child);
        return child;
    }

    removeChild(child) {
        this.env.record("dom.removeChild", this.label, child.label);
        const index = this.children.indexOf(child);
        if (index < 0) throw new Error(`removeChild: ${child.label} is not a child of ${this.label}`);
        this.children.splice(index, 1);
        child.parentNode = null;
        return child;
    }

    cloneNode(deep) {
        const clone = new FakeElement(this.env, `${this.label}~clone${++this.env.cloneCounter}`, [...this.classList]);
        this.env.record("dom.cloneNode", this.label, !!deep, clone.label);
        return clone;
    }

    addEventListener(type, listener, options) {
        (this.listeners[type] || (this.listeners[type] = [])).push({ listener, capture: !!(options && options.capture) });
    }

    removeEventListener(type, listener) {
        const list = this.listeners[type] || [];
        const index = list.findIndex((entry) => entry.listener === listener);
        if (index >= 0) list.splice(index, 1);
    }

    getBoundingClientRect() {
        return { ...(this.rect || { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 }) };
    }
}

class FakeRange {
    constructor(startRow, startColumn, endRow, endColumn) {
        this.start = { row: startRow, column: startColumn };
        this.end = { row: endRow, column: endColumn };
    }

    isEmpty() {
        return this.start.row === this.end.row && this.start.column === this.end.column;
    }

    isMultiLine() {
        return this.start.row !== this.end.row;
    }

    compare(row, column) {
        if (!this.isMultiLine() && row === this.start.row) {
            return column < this.start.column ? -1 : column > this.end.column ? 1 : 0;
        }
        if (row < this.start.row) return -1;
        if (row > this.end.row) return 1;
        if (this.start.row === row) return column >= this.start.column ? 0 : -1;
        if (this.end.row === row) return column <= this.end.column ? 0 : 1;
        return 0;
    }

    comparePoint(point) {
        return this.compare(point.row, point.column);
    }

    contains(row, column) {
        return this.compare(row, column) === 0;
    }

    clipRows(firstRow, lastRow) {
        let end = { ...this.end };
        let start = { ...this.start };
        if (end.row > lastRow) end = { row: lastRow + 1, column: 0 };
        else if (end.row < firstRow) end = { row: firstRow, column: 0 };
        if (start.row > lastRow) start = { row: lastRow + 1, column: 0 };
        else if (start.row < firstRow) start = { row: firstRow, column: 0 };
        return new FakeRange(start.row, start.column, end.row, end.column);
    }

    toScreenRange() {
        return new FakeRange(this.start.row, this.start.column, this.end.row, this.end.column);
    }
}

function clipPosition(row, column) {
    const clippedRow = Math.max(0, Math.min(LINE_COUNT - 1, row));
    const clippedColumn = Math.max(0, Math.min(LINES[clippedRow].length, column));
    return { row: clippedRow, column: clippedColumn };
}

function wordRangeAt(row, column) {
    const line = LINES[row];
    const isWord = (ch) => /\w/.test(ch);
    const c = Math.min(column, line.length);
    const probe = line[c] !== undefined ? line[c] : line[c - 1];
    if (probe === undefined) return new FakeRange(row, c, row, c);
    const wordClass = isWord(probe);
    let start = c;
    let end = c;
    while (start > 0 && isWord(line[start - 1]) === wordClass) start--;
    while (end < line.length && isWord(line[end]) === wordClass) end++;
    return new FakeRange(row, start, row, end);
}

function orderedRange(anchor, cursor) {
    const anchorFirst = anchor.row < cursor.row || (anchor.row === cursor.row && anchor.column <= cursor.column);
    const start = anchorFirst ? anchor : cursor;
    const end = anchorFirst ? cursor : anchor;
    return new FakeRange(start.row, start.column, end.row, end.column);
}

// Creates the fake runtime for one implementation. `options.hostBridge` (default true) defines `autojs`.
export function createEnvironment(options = {}) {
    const trace = [];
    const clock = createClock();
    const env = {
        trace,
        clock,
        cloneCounter: 0,
        record(...entry) {
            trace.push(plain(entry));
        },
    };

    const container = new FakeElement(env, "container", ["ace_editor"]);
    const gutter = new FakeElement(env, "gutter", ["ace_gutter"]);
    const gutterCell = new FakeElement(env, "gutter-cell", ["ace_gutter-cell"]);
    const scrollerElement = new FakeElement(env, "scroller", ["ace_scroller"]);
    const textLayer = new FakeElement(env, "text-layer", ["ace_text-layer"]);
    const textarea = new FakeElement(env, "textarea", ["ace_text-input"]);
    const selectionMarker = new FakeElement(env, "selection-marker", ["ace_selection"]);
    for (const [parent, child] of [[container, gutter], [gutter, gutterCell], [container, scrollerElement], [scrollerElement, textLayer], [container, textarea]]) {
        child.parentNode = parent;
        parent.children.push(child);
    }
    scrollerElement.rect = { ...SCROLLER_RECT };
    env.elements = { container, gutter, gutterCell, scrollerElement, textLayer, textarea };

    const lineElements = new Map();
    const lineCell = (row) => {
        if (!lineElements.has(row)) {
            lineElements.set(row, { row, element: new FakeElement(env, `line-${row}`, ["ace_line"]) });
        }
        return lineElements.get(row);
    };

    const renderer = {
        scrollTop: 0,
        scrollLeft: 0,
        $padding: TEXT_PADDING,
        gutterWidth: SCROLLER_RECT.left,
        $size: { scrollerWidth: SCROLLER_RECT.width, scrollerHeight: SCROLLER_RECT.height },
        scroller: scrollerElement,
        get layerConfig() {
            return {
                lineHeight: LINE_HEIGHT,
                characterWidth: CHARACTER_WIDTH,
                offset: renderer.scrollTop % LINE_HEIGHT,
                firstRowScreen: Math.floor(renderer.scrollTop / LINE_HEIGHT),
                firstRow: Math.floor(renderer.scrollTop / LINE_HEIGHT),
                width: CONTENT_WIDTH,
                maxHeight: LINE_COUNT * LINE_HEIGHT,
            };
        },
        getScrollTop() {
            return renderer.scrollTop;
        },
        getScrollLeft() {
            return renderer.scrollLeft;
        },
        scrollTo(x, y) {
            env.record("renderer.scrollTo", x, y);
            renderer.scrollLeft = x;
            renderer.scrollTop = y;
        },
        scrollCursorIntoView(position, offset, viewMargin) {
            env.record("renderer.scrollCursorIntoView", position === undefined ? null : position);
        },
        scrollSelectionIntoView(anchor, lead) {
            env.record("renderer.scrollSelectionIntoView", anchor, lead);
        },
        onResize() {
            env.record("renderer.onResize");
        },
        $cursorLayer: {
            getPixelPosition(position, onScreen) {
                const firstRowScreen = Math.floor(renderer.scrollTop / LINE_HEIGHT);
                return {
                    left: TEXT_PADDING + position.column * CHARACTER_WIDTH,
                    top: (position.row - (onScreen ? firstRowScreen : 0)) * LINE_HEIGHT,
                };
            },
        },
        getClientPosition(position) {
            const pixel = renderer.$cursorLayer.getPixelPosition(position, true);
            const rect = scrollerElement.getBoundingClientRect();
            return { x: pixel.left + rect.left - renderer.scrollLeft, y: pixel.top + rect.top - renderer.layerConfig.offset };
        },
        $textLayer: {
            $lines: {
                get cells() {
                    const first = Math.floor(renderer.scrollTop / LINE_HEIGHT);
                    const last = Math.min(LINE_COUNT - 1, first + Math.ceil(SCROLLER_RECT.height / LINE_HEIGHT));
                    const cells = [];
                    for (let row = first; row <= last; row++) cells.push(lineCell(row));
                    return cells;
                },
            },
        },
    };

    const selection = {
        cursor: { row: 0, column: 0 },
        anchor: { row: 0, column: 0 },
        $isEmpty: true,
        listeners: {},
        getRange() {
            return selection.isEmpty()
                ? new FakeRange(selection.cursor.row, selection.cursor.column, selection.cursor.row, selection.cursor.column)
                : orderedRange(selection.anchor, selection.cursor);
        },
        isEmpty() {
            return selection.$isEmpty || (selection.anchor.row === selection.cursor.row && selection.anchor.column === selection.cursor.column);
        },
        moveToPosition(position) {
            env.record("selection.moveToPosition", position);
            selection.cursor = clipPosition(position.row, position.column);
            selection.anchor = { ...selection.cursor };
            selection.$isEmpty = true;
        },
        selectWord() {
            env.record("selection.selectWord");
            const range = wordRangeAt(selection.cursor.row, selection.cursor.column);
            selection.anchor = { ...range.start };
            selection.cursor = { ...range.end };
            selection.$isEmpty = range.isEmpty();
        },
        getWordRange(row, column) {
            env.record("selection.getWordRange", row, column);
            return wordRangeAt(row, column);
        },
        setSelectionAnchor(row, column) {
            env.record("selection.setSelectionAnchor", row, column);
            selection.anchor = clipPosition(row, column);
            selection.$isEmpty = false;
        },
        selectToPosition(position) {
            env.record("selection.selectToPosition", position);
            selection.cursor = clipPosition(position.row, position.column);
            selection.$isEmpty = false;
        },
        moveCursorToPosition(position) {
            env.record("selection.moveCursorToPosition", position);
            selection.cursor = clipPosition(position.row, position.column);
            if (selection.$isEmpty) selection.anchor = { ...selection.cursor };
        },
        on(name, listener) {
            (selection.listeners[name] || (selection.listeners[name] = [])).push(listener);
        },
        off(name, listener) {
            const list = selection.listeners[name] || [];
            const index = list.indexOf(listener);
            if (index >= 0) list.splice(index, 1);
        },
        select(anchorRow, anchorColumn, cursorRow, cursorColumn) {
            selection.anchor = clipPosition(anchorRow, anchorColumn);
            selection.cursor = clipPosition(cursorRow, cursorColumn);
            selection.$isEmpty = selection.anchor.row === selection.cursor.row && selection.anchor.column === selection.cursor.column;
        },
    };

    let focused = false;
    const editor = {
        container,
        renderer,
        selection,
        session: {
            selection,
            documentToScreenPosition(position) {
                return { row: position.row, column: position.column };
            },
            documentToScreenRow(row) {
                return row;
            },
            getScreenLastRowColumn(screenRow) {
                return (LINES[screenRow] || "").length;
            },
            getLine(row) {
                return LINES[row] || "";
            },
        },
        textInput: {
            getElement() {
                return textarea;
            },
        },
        popup: undefined,
        isFocused() {
            return focused;
        },
        focus() {
            env.record("editor.focus");
            focused = true;
        },
        blur() {
            focused = false;
        },
        startActionMode(argument) {
            env.record("editor.startActionMode", arguments.length ? argument : "(none)");
        },
        startActionModeIfSelectionInView(selectAll) {
            env.record("editor.startActionModeIfSelectionInView", selectAll);
        },
        finishActionMode() {
            env.record("editor.finishActionMode");
        },
        _emit(name) {
            env.record("editor._emit", name);
        },
    };

    let documentHasFocus = true;
    const body = new FakeElement(env, "body");
    const fakeDocument = {
        body,
        get activeElement() {
            return focused ? textarea : body;
        },
        hasFocus() {
            return documentHasFocus;
        },
        createElement(tagName) {
            return new FakeElement(env, `${tagName}#${++env.createCounter}`);
        },
        querySelector(selector) {
            if (selector === ".ace_selection") return selection.isEmpty() ? null : selectionMarker;
            return null;
        },
    };
    env.createCounter = 0;
    const fakeWindow = {
        focus() {
            env.record("window.focus");
        },
        getComputedStyle() {
            return { background: "rgb(10, 20, 30)" };
        },
    };
    const autojs = {
        showSoftInput() {
            env.record("autojs.showSoftInput");
        },
        performLongPressFeedback() {
            env.record("autojs.performLongPressFeedback");
        },
        startActionMode(left, top, right, bottom, hasSelection, selectAll) {
            env.record("autojs.startActionMode", left, top, right, bottom, hasSelection, selectAll);
        },
        finishActionMode() {
            env.record("autojs.finishActionMode");
        },
    };

    class FakeDate extends Date {
        static now() {
            return clock.now;
        }
    }

    const sandbox = {
        console,
        document: fakeDocument,
        window: fakeWindow,
        Date: FakeDate,
        setTimeout: (fn, delay) => clock.setTimeout(fn, delay),
        clearTimeout: (id) => clock.clear(id),
        setInterval: (fn, delay) => clock.setInterval(fn, delay),
        clearInterval: (id) => clock.clear(id),
    };
    if (options.hostBridge !== false) sandbox.autojs = autojs;
    const context = vm.createContext(sandbox);
    sandbox.window.document = fakeDocument;

    env.context = context;
    env.editor = editor;
    env.renderer = renderer;
    env.selection = selection;
    env.lines = LINES;
    env.setDocumentHasFocus = (value) => {
        documentHasFocus = value;
    };
    env.setFocused = (value) => {
        focused = value;
    };
    env.FakeRange = FakeRange;
    env.createAceRuntime = () => createAceRuntime(env);
    return env;
}

// Minimal ace.define/require for evaluating module code inside the environment context.
function createAceRuntime(env) {
    const payloads = new Map();
    const modules = new Map();
    const normalize = (from, id) => {
        if (!id.startsWith(".")) return id;
        const parts = from.split("/").slice(0, -1);
        for (const segment of id.split("/")) {
            if (segment === "..") parts.pop();
            else if (segment !== ".") parts.push(segment);
        }
        return parts.join("/");
    };
    const requireFrom = (from) => (id) => {
        const name = normalize(from, id);
        if (modules.has(name)) return modules.get(name);
        const factory = payloads.get(name);
        if (!factory) throw new Error(`Module not defined: ${name} (required from ${from})`);
        const module = { id: name, exports: {} };
        modules.set(name, module.exports);
        const returned = factory(requireFrom(name), module.exports, module);
        const exported = returned || module.exports;
        modules.set(name, exported);
        return exported;
    };
    const ace = {
        define(name, deps, factory) {
            if (typeof deps === "function") factory = deps;
            if (!payloads.has(name)) payloads.set(name, factory);
        },
        require: (id) => requireFrom("")(id),
    };
    env.context.ace = ace;

    // Fakes for the upstream modules the touch handler imports.
    payloads.set("ace/mouse/mouse_event", () => {
        function MouseEvent(domEvent, editor) {
            this.domEvent = domEvent;
            this.editor = editor;
            this.x = this.clientX = domEvent.clientX;
            this.y = this.clientY = domEvent.clientY;
        }
        MouseEvent.prototype.getDocumentPosition = function () {
            const renderer = this.editor.renderer;
            const rect = renderer.scroller.getBoundingClientRect();
            const row = Math.floor((this.clientY - rect.top + renderer.scrollTop) / LINE_HEIGHT);
            const column = Math.round((this.clientX - rect.left + renderer.scrollLeft - TEXT_PADDING) / CHARACTER_WIDTH);
            return clipPosition(row, column);
        };
        return { MouseEvent };
    });
    payloads.set("ace/lib/event", () => ({
        addListener(element, type, callback, destroyer) {
            element.addEventListener(type, callback);
            if (destroyer && destroyer.$toDestroy) destroyer.$toDestroy.push({ elem: element, type, callback });
        },
    }));
    payloads.set("ace/lib/dom", () => ({
        hasCssClass(element, className) {
            return element.classList.has(className);
        },
    }));

    return {
        ace,
        evaluate(code, filename) {
            vm.runInContext(code, env.context, { filename });
        },
        require: (id) => requireFrom("")(id),
    };
}

// Dispatches a touch event to the container listeners (bubble order of registration).
export function dispatchTouch(env, type, touches, changedTouches, target) {
    const event = {
        type,
        touches: touches.map(([clientX, clientY]) => ({ clientX, clientY })),
        changedTouches: changedTouches.map(([clientX, clientY]) => ({ clientX, clientY })),
        target: target || env.elements.textLayer,
        timeStamp: env.clock.now,
        defaultPrevented: false,
        preventDefault() {
            this.defaultPrevented = true;
            env.record("event.preventDefault", type);
        },
        stopPropagation() {},
    };
    env.record("dispatch", type, touches, changedTouches, event.target.label);
    for (const { listener } of [...(env.elements.container.listeners[type] || [])]) listener(event);
    return event;
}

// Touch scenarios covering Roadmap-Ace-1.44.0.md appendix B items 1-12 and the known quirks.
// Coordinates are client pixels: text starts at x = 44, rows are 20 px high from y = 0.
const at = (row, column, dy = 10) => [SCROLLER_RECT.left + TEXT_PADDING + column * CHARACTER_WIDTH, row * LINE_HEIGHT + dy];

export const TOUCH_SCENARIOS = [
    { name: "B1 quick tap moves the cursor and shows the soft input", steps: [{ down: at(3, 8) }, { wait: 50 }, { up: at(3, 8) }, { wait: 400 }] },
    { name: "B1 tap while the window is blurred", setup: (env) => env.setDocumentHasFocus(false), steps: [{ down: at(4, 2) }, { wait: 30 }, { up: at(4, 2) }] },
    { name: "slow tap (100-500 ms) does not move the cursor", steps: [{ down: at(6, 12) }, { wait: 250 }, { up: at(6, 12) }, { wait: 300 }] },
    { name: "B2 gutter touch is ignored", steps: [{ down: [10, 30], target: "gutterCell" }, { wait: 40 }, { up: [10, 30], target: "gutterCell" }] },
    {
        name: "gutter touch after a scroll reuses the previous mode on touchend",
        steps: [{ down: [200, 300] }, { wait: 20 }, { move: [200, 260] }, { wait: 150 }, { up: [200, 260] }, { wait: 300 }, { down: [10, 30], target: "gutterCell" }, { wait: 40 }, { up: [10, 30], target: "gutterCell" }, { wait: 300 }],
    },
    { name: "B3 double tap selects a word", steps: [{ down: at(5, 9) }, { wait: 40 }, { up: at(5, 9) }, { wait: 120 }, { down: at(5, 10) }, { wait: 40 }, { up: at(5, 10) }, { wait: 300 }] },
    { name: "double tap too far apart is two taps", steps: [{ down: at(5, 9) }, { wait: 40 }, { up: at(5, 9) }, { wait: 120 }, { down: at(9, 30) }, { wait: 40 }, { up: at(9, 30) }] },
    { name: "B4 long press without selection selects a word", steps: [{ down: at(7, 14) }, { wait: 600 }, { up: at(7, 14) }, { wait: 300 }] },
    { name: "B5 long press inside a single line selection", setup: (env) => env.selection.select(8, 6, 8, 20), steps: [{ down: at(8, 12) }, { wait: 600 }, { up: at(8, 12) }, { wait: 300 }] },
    { name: "B5 long press inside a multi line selection", setup: (env) => env.selection.select(8, 30, 12, 4), steps: [{ down: at(10, 50) }, { wait: 600 }, { up: at(10, 50) }, { wait: 300 }] },
    { name: "long press then drag the selected word", steps: [{ down: at(7, 14) }, { wait: 600 }, { move: at(7, 20) }, { wait: 16 }, { move: at(8, 26) }, { wait: 16 }, { up: at(8, 26) }, { wait: 300 }] },
    { name: "long press inside selection then drag", setup: (env) => env.selection.select(8, 6, 8, 20), steps: [{ down: at(8, 12) }, { wait: 600 }, { move: at(9, 30) }, { up: at(9, 30) }, { wait: 300 }] },
    {
        name: "B6 drag the cursor handle",
        setup: (env) => env.selection.select(4, 10, 4, 10),
        steps: [{ down: at(4, 10, 32) }, { wait: 16 }, { move: at(4, 14, 32) }, { wait: 16 }, { move: at(5, 22, 32) }, { wait: 16 }, { move: at(5, 6, 32) }, { up: at(5, 6, 32) }, { wait: 300 }],
    },
    {
        name: "B6 drag the cursor handle with the magnifier",
        magnifierEnabled: true,
        setup: (env) => env.selection.select(4, 10, 4, 10),
        steps: [{ down: at(4, 10, 32) }, { wait: 16 }, { move: at(4, 14, 32) }, { wait: 16 }, { move: at(5, 22, 32) }, { up: at(5, 22, 32) }, { wait: 300 }],
    },
    {
        name: "B7 drag the anchor handle of a selection with the magnifier",
        magnifierEnabled: true,
        setup: (env) => env.selection.select(6, 5, 6, 25),
        steps: [{ down: at(6, 5, 32) }, { wait: 16 }, { move: at(6, 2, 32) }, { wait: 16 }, { move: at(7, 3, 32) }, { wait: 16 }, { move: at(5, 9, 32) }, { up: at(5, 9, 32) }, { wait: 300 }],
    },
    {
        name: "drag returning near the start is ignored while the long press timer id is kept",
        setup: (env) => env.selection.select(4, 10, 4, 10),
        steps: [{ down: at(4, 10, 32) }, { wait: 16 }, { move: at(6, 30, 32) }, { wait: 16 }, { move: at(4, 11, 32) }, { up: at(4, 11, 32) }],
    },
    { name: "B8 small move stays within the slop", steps: [{ down: at(20, 20) }, { wait: 30 }, { move: at(20, 21) }, { wait: 30 }, { up: at(20, 21) }, { wait: 300 }] },
    {
        name: "B8 slow scroll drag does not fling",
        setup: (env) => env.renderer.scrollTo(0, 400),
        steps: [{ down: [200, 300] }, { wait: 20 }, { move: [200, 296] }, { wait: 20 }, { move: [200, 290] }, { wait: 20 }, { move: [200, 284] }, { wait: 20 }, { move: [200, 278] }, { wait: 150 }, { up: [200, 278] }, { wait: 300 }],
    },
    {
        name: "B8 scroll is clamped at the top",
        steps: [{ down: [200, 100] }, { wait: 16 }, { move: [200, 140] }, { wait: 16 }, { move: [200, 400] }, { wait: 16 }, { up: [200, 400] }, { wait: 300 }],
    },
    {
        name: "B9 fast swipe flings and restarts the action mode",
        setup: (env) => env.renderer.scrollTo(0, 600),
        steps: [{ down: [200, 500] }, { wait: 10 }, { move: [200, 470] }, { wait: 10 }, { move: [200, 430] }, { wait: 10 }, { move: [200, 380] }, { wait: 10 }, { move: [200, 320] }, { wait: 5 }, { up: [200, 320] }, { wait: 3000 }],
    },
    {
        name: "diagonal fling keeps the dominant axis",
        setup: (env) => env.renderer.scrollTo(100, 600),
        steps: [{ down: [300, 300] }, { wait: 10 }, { move: [260, 290] }, { wait: 10 }, { move: [200, 280] }, { wait: 10 }, { move: [130, 270] }, { up: [130, 270] }, { wait: 3000 }],
    },
    {
        name: "B10 touching during a fling stops it",
        setup: (env) => env.renderer.scrollTo(0, 800),
        steps: [
            { down: [200, 500] }, { wait: 10 }, { move: [200, 450] }, { wait: 10 }, { move: [200, 390] }, { wait: 10 }, { move: [200, 320] }, { up: [200, 320] },
            { wait: 120 }, { down: [200, 300] }, { wait: 60 }, { up: [200, 300] }, { wait: 600 },
        ],
    },
    { name: "B11 completion popup flag skips touches", setup: (env) => { env.editor.popup = {}; }, steps: [{ down: at(3, 3) }, { wait: 30 }, { up: at(3, 3) }] },
    {
        name: "B12 second finger cancels the long press and zooms",
        steps: [
            { down: at(10, 10) }, { wait: 40 }, { down2: [at(10, 10), at(14, 30)] }, { wait: 16 },
            { move2: [at(9, 5), at(16, 40)] }, { wait: 16 }, { move2: [at(8, 2), at(18, 48)] }, { wait: 16 },
            { up2: [[at(18, 48)], [at(8, 2)]] }, { wait: 16 }, { up: at(18, 48) }, { wait: 700 },
        ],
    },
    { name: "three fingers do nothing", steps: [{ down3: [at(3, 3), at(6, 6), at(9, 9)] }, { wait: 30 }, { up: at(3, 3) }, { wait: 600 }] },
    // Boundary scenarios: each one pins a constant or a comparison of the original handler.
    { name: "tap lasting 110 ms is a slow tap", steps: [{ down: at(6, 12) }, { wait: 110 }, { up: at(6, 12) }, { wait: 300 }] },
    { name: "tap lasting 99 ms is a tap", steps: [{ down: at(6, 12) }, { wait: 99 }, { up: at(6, 12) }, { wait: 300 }] },
    { name: "second tap after 299 ms is a double tap", steps: [{ down: at(5, 9) }, { wait: 40 }, { up: at(5, 9) }, { wait: 259 }, { down: at(5, 9) }, { wait: 40 }, { up: at(5, 9) }] },
    { name: "second tap after 301 ms is a single tap", steps: [{ down: at(5, 9) }, { wait: 40 }, { up: at(5, 9) }, { wait: 261 }, { down: at(5, 9) }, { wait: 40 }, { up: at(5, 9) }] },
    { name: "long press fires at 500 ms", steps: [{ down: at(7, 14) }, { wait: 499 }, { move: at(9, 40) }, { up: at(9, 40) }, { wait: 300 }] },
    {
        name: "slow horizontal fling at exactly the minimum velocity",
        steps: [
            { down: [300, 200] }, { wait: 10 }, { move: [270, 200] }, { wait: 190 },
            { move: [269, 200] }, { wait: 20 }, { move: [268, 200] }, { wait: 20 }, { move: [267, 200] }, { wait: 20 },
            { move: [266, 200] }, { wait: 20 }, { move: [265, 200] }, { wait: 20 }, { move: [264, 200] }, { up: [264, 200] }, { wait: 2000 },
        ],
    },
    {
        name: "move steps of exactly the slop do not arm a fling",
        setup: (env) => env.renderer.scrollTo(0, 600),
        steps: [{ down: [200, 400] }, { wait: 10 }, { move: [200, 370] }, { wait: 10 }, { move: [200, 362] }, { wait: 10 }, { move: [200, 354] }, { wait: 10 }, { move: [200, 346] }, { up: [200, 346] }, { wait: 2000 }],
    },
    { name: "touch inside the edge of the cursor handle", setup: (env) => env.selection.select(4, 10, 4, 10), steps: [{ down: at(4, 10, 52) }, { wait: 30 }, { move: at(4, 16, 52) }, { up: at(4, 16, 52) }, { wait: 300 }] },
    { name: "touch outside the edge of the cursor handle", setup: (env) => env.selection.select(4, 10, 4, 10), steps: [{ down: at(4, 10, 53) }, { wait: 30 }, { move: at(4, 16, 53) }, { up: at(4, 16, 53) }, { wait: 300 }] },
    { name: "touch equally near the cursor and the anchor", setup: (env) => env.selection.select(4, 10, 4, 12), steps: [{ down: at(4, 11, 32) }, { wait: 30 }, { move: at(5, 20, 32) }, { up: at(5, 20, 32) }, { wait: 300 }] },
    { name: "long press on the top edge of a selection", setup: (env) => env.selection.select(8, 6, 8, 20), steps: [{ down: at(8, 12, -8) }, { wait: 600 }, { up: at(8, 12, -8) }, { wait: 300 }] },
    { name: "long press just inside the top edge of a selection", setup: (env) => env.selection.select(8, 6, 8, 20), steps: [{ down: at(8, 12, -7) }, { wait: 600 }, { up: at(8, 12, -7) }, { wait: 300 }] },
    { name: "two taps 28 px apart are two single taps", steps: [{ down: at(5, 9) }, { wait: 40 }, { up: at(5, 9) }, { wait: 100 }, { down: at(5, 11.8) }, { wait: 40 }, { up: at(5, 11.8) }] },
    {
        name: "a 25 px move leaves the start area",
        setup: (env) => env.renderer.scrollTo(300, 600),
        steps: [{ down: [200, 300] }, { wait: 20 }, { move: [225, 300] }, { wait: 20 }, { move: [226, 300] }, { up: [226, 300] }, { wait: 300 }],
    },
    { name: "long press on the bottom edge of a selection", setup: (env) => env.selection.select(8, 6, 8, 20), steps: [{ down: at(8, 12, 28) }, { wait: 600 }, { up: at(8, 12, 28) }, { wait: 300 }] },
    { name: "long press on the left edge of a selection", setup: (env) => env.selection.select(8, 6, 8, 20), steps: [{ down: at(8, 5.2) }, { wait: 600 }, { up: at(8, 5.2) }, { wait: 300 }] },
    { name: "long press on the right edge of a selection", setup: (env) => env.selection.select(8, 6, 8, 20), steps: [{ down: at(8, 20.8) }, { wait: 600 }, { up: at(8, 20.8) }, { wait: 300 }] },
    {
        name: "zoom is clamped and stepped",
        steps: [
            { down2: [at(10, 10), at(12, 12)] }, { wait: 16 }, { move2: [at(0, 0), at(25, 60)] }, { wait: 16 },
            { move2: [at(11, 11), at(11, 12)] }, { up2: [[at(11, 12)], [at(11, 11)]] }, { up: at(11, 12) }, { wait: 100 },
            { down2: [at(10, 10), at(12, 12)] }, { wait: 16 }, { move2: [at(11, 11), at(11, 11)] }, { up2: [[at(11, 11)], [at(11, 11)]] }, { up: at(11, 11) },
        ],
    },
    {
        name: "tap on the cursor shows the no-selection action mode",
        setup: (env) => env.selection.select(12, 7, 12, 7),
        steps: [{ down: at(12, 7, 32) }, { wait: 40 }, { up: at(12, 7, 32) }, { wait: 300 }],
    },
];

export function runTouchScenario(env, scenario) {
    const targetOf = (step) => (step.target ? env.elements[step.target] : undefined);
    let fingers = [];
    for (const step of scenario.steps) {
        if (step.wait !== undefined) {
            env.clock.advance(step.wait);
        } else if (step.run) {
            step.run(env);
        } else if (step.down) {
            fingers = [step.down];
            dispatchTouch(env, "touchstart", fingers, [step.down], targetOf(step));
        } else if (step.down2) {
            fingers = step.down2;
            dispatchTouch(env, "touchstart", fingers, [step.down2[1]], targetOf(step));
        } else if (step.down3) {
            fingers = step.down3;
            dispatchTouch(env, "touchstart", fingers, [step.down3[2]], targetOf(step));
        } else if (step.move) {
            fingers = [step.move];
            dispatchTouch(env, "touchmove", fingers, [step.move], targetOf(step));
        } else if (step.move2) {
            fingers = step.move2;
            dispatchTouch(env, "touchmove", fingers, step.move2, targetOf(step));
        } else if (step.up2) {
            const [remaining, lifted] = step.up2;
            fingers = remaining;
            dispatchTouch(env, "touchend", remaining, lifted, targetOf(step));
        } else if (step.up) {
            fingers = [];
            dispatchTouch(env, "touchend", [], [step.up], targetOf(step));
        } else {
            throw new Error(`Unknown step in ${scenario.name}: ${JSON.stringify(step)}`);
        }
    }
    env.record("final", {
        cursor: env.selection.cursor,
        anchor: env.selection.anchor,
        empty: env.selection.isEmpty(),
        scrollTop: env.renderer.scrollTop,
        scrollLeft: env.renderer.scrollLeft,
        bodyZoom: env.context.document.body.style.zoom,
        pendingTimers: env.clock.pendingCount(),
    });
    return env.trace;
}

export function firstDifference(left, right) {
    const length = Math.max(left.length, right.length);
    for (let index = 0; index < length; index++) {
        const a = JSON.stringify(left[index]);
        const b = JSON.stringify(right[index]);
        if (a !== b) return { index, left: a, right: b };
    }
    return null;
}

export { plain };
