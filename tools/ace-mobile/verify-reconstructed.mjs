#!/usr/bin/env node

// Verifies the readable reconstruction of the Auto.js mobile customizations (tools/ace-mobile/reconstructed)
// against the original minified bytes (tools/ace-mobile/reconstructed/original):
//   1. every original slice matches original/manifest.json (and the legacy ace.js when it is still present);
//   2. regression, velocity tracker and scroller produce identical results for generated inputs;
//   3. the touch handler (with velocity tracker, scroller and magnifier) produces identical call traces
//      for the scenarios in touch-harness.mjs;
//   4. the editor ActionMode additions and VirtualRenderer.getClientPosition behave identically.
//
// Usage: node tools/ace-mobile/verify-reconstructed.mjs [--ace-js <path to the legacy customized ace.js>]

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import {
    TOUCH_SCENARIOS,
    createEnvironment,
    firstDifference,
    plain,
    runTouchScenario,
} from "./touch-harness.mjs";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = path.resolve(SCRIPT_DIR, "..", "..");
const RECONSTRUCTED_DIR = path.join(SCRIPT_DIR, "reconstructed");
const ORIGINAL_DIR = path.join(RECONSTRUCTED_DIR, "original");
const MANIFEST = JSON.parse(fs.readFileSync(path.join(ORIGINAL_DIR, "manifest.json"), "utf8"));

const failures = [];
let checks = 0;

function check(condition, message) {
    checks += 1;
    if (!condition) failures.push(message);
}

function sha256(content) {
    return crypto.createHash("sha256").update(content).digest("hex");
}

function readOriginal(file) {
    return fs.readFileSync(path.join(ORIGINAL_DIR, file), "latin1");
}

function readReconstructed(file) {
    return fs.readFileSync(path.join(RECONSTRUCTED_DIR, file), "utf8");
}

function parseArguments(argv) {
    const result = { aceJs: path.join(REPOSITORY_ROOT, ...MANIFEST.source.path.split("/")) };
    for (let index = 0; index < argv.length; index += 1) {
        if (argv[index] === "--ace-js") result.aceJs = path.resolve(argv[++index] || "");
        else throw new Error(`Unknown argument: ${argv[index]}`);
    }
    return result;
}

function verifyManifest(aceJsPath) {
    for (const slice of MANIFEST.slices) {
        const bytes = fs.readFileSync(path.join(ORIGINAL_DIR, slice.file));
        check(bytes.length === slice.length, `${slice.file}: length ${bytes.length} != ${slice.length}`);
        check(sha256(bytes) === slice.sha256, `${slice.file}: sha256 mismatch`);
    }
    if (!fs.existsSync(aceJsPath)) {
        console.log(`legacy ace.js not present (${path.relative(REPOSITORY_ROOT, aceJsPath)}), offsets not re-checked`);
        return;
    }
    // The Git index stores LF; core.autocrlf may have produced CRLF in the work tree.
    const legacy = Buffer.from(fs.readFileSync(aceJsPath, "latin1").replace(/\r\n/g, "\n"), "latin1");
    if (sha256(legacy) !== MANIFEST.source.sha256) {
        console.log(`legacy ace.js differs from the manifest source (sha256 ${sha256(legacy)}), offsets not re-checked`);
        return;
    }
    for (const slice of MANIFEST.slices) {
        const bytes = legacy.subarray(slice.offset, slice.offset + slice.length);
        check(sha256(bytes) === slice.sha256, `${slice.file}: bytes at offset ${slice.offset} differ from the slice`);
    }
    console.log(`legacy ace.js offsets verified (${MANIFEST.slices.length} slices)`);
}

// Loads one implementation set into a fresh environment.
function loadImplementation(kind, env) {
    const runtime = env.createAceRuntime();
    if (kind === "original") {
        runtime.evaluate(readOriginal("babel-helpers.min.js"), "babel-helpers.min.js");
        for (const file of ["regression.min.js", "velocity-tracker.min.js", "scroller.min.js", "magnifier.min.js", "touch_handler.min.js"]) {
            runtime.evaluate(readOriginal(file), file);
        }
    } else {
        for (const file of ["regression.js", "velocity-tracker.js", "scroller.js", "magnifier.js", "touch_handler.js"]) {
            runtime.evaluate(readReconstructed(file), file);
        }
    }
    return runtime;
}

function createRandom(seed) {
    let state = seed >>> 0;
    return () => {
        state = (state + 0x6d2b79f5) >>> 0;
        let t = state;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function compareValues(label, left, right) {
    const a = JSON.stringify(plain(left));
    const b = JSON.stringify(plain(right));
    check(a === b, `${label}: ${a.slice(0, 300)} != ${b.slice(0, 300)}`);
}

function verifyRegression() {
    const original = loadImplementation("original", createEnvironment()).require("ace/mouse/regression.js");
    const reconstructed = loadImplementation("reconstructed", createEnvironment()).require("ace/mouse/regression.js");
    const random = createRandom(20261013);
    const summarize = (result) => ({
        string: result.string,
        points: result.points,
        equation: result.equation,
        r2: result.r2,
        predicted: [-50, -7.5, 0, 3].map((x) => result.predict(x)),
    });
    for (let round = 0; round < 300; round++) {
        const count = 2 + Math.floor(random() * 12);
        const positive = round % 3 === 0;
        const data = [];
        for (let i = 0; i < count; i++) {
            const x = positive ? 1 + random() * 50 : -Math.floor(random() * 100);
            const y = positive ? 1 + random() * 500 : Math.round(random() * 2000 - 1000);
            data.push([x, round % 11 === 0 && i === 1 ? null : y]);
        }
        const methods = positive ? ["linear", "polynomial", "exponential", "logarithmic", "power"] : ["linear", "polynomial"];
        for (const method of methods) {
            for (const options of [{}, { order: 1 }, { order: 3, precision: 4 }]) {
                const left = summarize(original[method](data.map((d) => d.slice()), options));
                const right = summarize(reconstructed[method](data.map((d) => d.slice()), options));
                compareValues(`regression.${method}#${round}`, left, right);
            }
        }
    }
    compareValues("regression._round", original._round(1.23456, 3), reconstructed._round(1.23456, 3));
}

function verifyVelocityTracker() {
    const random = createRandom(7);
    for (let round = 0; round < 200; round++) {
        const results = ["original", "reconstructed"].map((kind) => {
            const env = createEnvironment();
            const { VelocityTracker } = loadImplementation(kind, env).require("ace/mouse/velocity-tracker.js");
            const tracker = new VelocityTracker();
            const local = createRandom(1000 + round);
            const count = 1 + Math.floor(local() * 15);
            let time = 1000;
            let x = 100;
            let y = 300;
            const output = [];
            for (let i = 0; i < count; i++) {
                time += 2 + Math.floor(local() * (round % 5 === 0 ? 80 : 20));
                x += Math.round(local() * 60 - 30);
                y += Math.round(local() * 120 - 60);
                tracker.addMovement({ x, y }, time);
                output.push([tracker.computeVelocity(1000), tracker.getXVelocity(), tracker.getYVelocity()]);
            }
            tracker.addMovement({ x: 1, y: 2 });
            output.push(tracker.getPoint(tracker.points.length - 1));
            tracker.clear();
            output.push(tracker.computeVelocity(1000), tracker.getXVelocity(), tracker.getYVelocity());
            output.push(evaluateInContext(env, "[Math.signum(-3), Math.signum(0), Math.signum(2)]", "signum.js"));
            return output;
        });
        random();
        compareValues(`velocityTracker#${round}`, results[0], results[1]);
    }
}

function verifyScroller() {
    for (let round = 0; round < 120; round++) {
        const results = ["original", "reconstructed"].map((kind) => {
            const env = createEnvironment();
            const { Scroller } = loadImplementation(kind, env).require("ace/mouse/scroller.js");
            const scroller = Scroller.createDefault();
            const local = createRandom(5000 + round);
            const output = [scroller.isFinished(), scroller.getCurrVelocity()];
            const fling = () => {
                const vx = Math.round(local() * 16000 - 8000);
                const vy = Math.round(local() * 16000 - 8000);
                scroller.fling(Math.round(local() * 500), Math.round(local() * 3000), vx, vy, 0, 800, 0, 4000);
                output.push(["fling", vx, vy, scroller.mDuration, scroller.mDistance, scroller.mFinalX, scroller.mFinalY]);
            };
            fling();
            for (let step = 0; step < 400; step++) {
                env.clock.advance(round % 4 === 0 ? 2 : 16);
                const running = scroller.computeScrollOffset();
                output.push([running, scroller.getCurrX(), scroller.getCurrY(), scroller.isFinished(), scroller.mCurrVelocity]);
                if (step === 10 && round % 3 === 0) fling(); // exercises the flywheel branch while running
                if (step === 20 && round % 5 === 0) scroller.abortAnimation();
                if (!running) break;
            }
            output.push(scroller.getCurrVelocity());
            return output;
        });
        compareValues(`scroller#${round}`, results[0], results[1]);
    }
}

function verifyTouchHandler() {
    for (const scenario of TOUCH_SCENARIOS) {
        const traces = ["original", "reconstructed"].map((kind) => {
            const env = createEnvironment();
            env.editor.$toDestroy = [];
            const runtime = loadImplementation(kind, env);
            if (scenario.setup) scenario.setup(env);
            const mouseHandler = { $magnifierEnabled: !!scenario.magnifierEnabled };
            runtime.require("ace/mouse/touch_handler").addTouchListeners(env.editor.container, env.editor, mouseHandler);
            return runTouchScenario(env, scenario);
        });
        const difference = firstDifference(traces[0], traces[1]);
        check(!difference, `touch scenario "${scenario.name}" differs at #${difference && difference.index}: ${difference && difference.left} != ${difference && difference.right}`);
        check(traces[0].length > 3, `touch scenario "${scenario.name}" produced an empty trace`);
    }
}

function verifyMagnifierDirect() {
    const traces = ["original", "reconstructed"].map((kind) => {
        const env = createEnvironment();
        const { Magnifier } = loadImplementation(kind, env).require("ace/mouse/magnifier.js");
        const magnifier = new Magnifier(env.elements.container, env.editor);
        env.selection.select(3, 4, 6, 9);
        magnifier.show({ row: 4, column: 7 }, { x: 120, y: 30 });
        magnifier.show({ row: 4, column: 9 }, { x: 140, y: 300 });
        magnifier.zoom = 1.5;
        magnifier.show({ row: 6, column: 2 }, { x: 20, y: 200 });
        magnifier.$delayedShow({ row: 5, column: 1 }, { x: 60, y: 90 });
        magnifier.$delayedShow({ row: 5, column: 3 }, { x: 70, y: 90 });
        env.clock.advance(47);
        env.record("state", magnifier.shown, magnifier.row);
        env.clock.advance(2);
        env.record("state", magnifier.shown, magnifier.row);
        env.clock.advance(51);
        env.selection.select(0, 0, 0, 0);
        magnifier.show({ row: 0, column: 0 }, { x: 44, y: 10 });
        magnifier.$delayedShow({ row: 1, column: 1 }, { x: 44, y: 30 });
        magnifier.hide();
        magnifier.hide();
        env.renderer.scrollTop = 4000;
        magnifier.show({ row: 2, column: 2 }, { x: 44, y: 30 });
        env.record("state", magnifier.shown, magnifier.row, magnifier.$lines.length);
        return env.trace;
    });
    const difference = firstDifference(traces[0], traces[1]);
    check(!difference, `magnifier direct differs at #${difference && difference.index}: ${difference && difference.left} != ${difference && difference.right}`);
}

function editorFragmentSet(kind, env) {
    const runtime = env.createAceRuntime();
    if (kind === "original") {
        // The fragments ran inside the strict "ace/editor" factory where `w` and `E` hold the mode names.
        const wrap = (file) => evaluateInContext(env, `(function (w, E) {"use strict";${readOriginal(file)}})`, file);
        const names = readOriginal("editor-action-mode-names.min.js");
        const constants = Function(`var ${names}; return [w, E];`)();
        const constructorTail = wrap("editor-constructor.min.js");
        const prototypeTail = wrap("editor-prototype.min.js");
        return {
            installConstructorListeners() {
                constructorTail.call(this, constants[0], constants[1]);
            },
            definePrototypeMethods() {
                prototypeTail.call(this, constants[0], constants[1]);
            },
        };
    }
    runtime.evaluate(readReconstructed("editor-action-mode.js"), "editor-action-mode.js");
    return runtime.require("autojs6-reconstructed/editor_action_mode");
}

function evaluateInContext(env, code, filename) {
    return vm.runInContext(code, env.context, { filename });
}

function createActionModeEditor(env, fragments) {
    const listeners = {};
    const prototype = {
        on(name, listener) {
            (listeners[name] || (listeners[name] = [])).push(listener);
        },
        emit(name, data) {
            for (const listener of [...(listeners[name] || [])]) listener(data, this);
        },
    };
    fragments.definePrototypeMethods.call(prototype);
    const editor = Object.create(prototype);
    editor.selection = env.selection;
    editor.renderer = env.renderer;
    editor.session = { selection: env.selection };
    env.context.editor = editor;
    fragments.installConstructorListeners.call(editor);
    return editor;
}

function emitSelection(env, name) {
    for (const listener of [...(env.selection.listeners[name] || [])]) listener();
}

const ACTION_MODE_SCENARIOS = [
    (env, editor) => {
        editor.startActionMode();
        editor.emit("change");
        editor.emit("change");
        editor.finishActionMode();
        editor.finishActionMode();
    },
    (env, editor) => {
        env.selection.select(2, 1, 4, 6);
        editor.startActionMode(false);
        env.record("actionMode", editor.actionMode);
        editor.emit("change");
        env.selection.select(2, 1, 2, 1);
        emitSelection(env, "changeSelection");
        editor.finishActionMode();
    },
    (env, editor) => {
        env.selection.select(5, 1, 5, 9);
        editor.startActionModeIfSelectionInView(true);
        env.clock.advance(150);
        editor.startActionModeIfSelectionInView(false);
        env.clock.advance(250);
        env.record("actionMode", editor.actionMode);
        env.renderer.scrollTo(0, 2000);
        editor.startActionModeIfSelectionInView(true);
        env.clock.advance(250);
        editor.startActionModeIfSelectionInView(true);
        editor.finishActionMode();
        env.clock.advance(250);
        editor.startActionModeIfSelectionInView(false);
        env.clock.advance(199);
        env.record("actionMode", editor.actionMode);
        env.clock.advance(2);
        env.record("actionMode", editor.actionMode);
    },
    (env, editor) => {
        env.selection.select(1, 1, 1, 1);
        editor.startActionModeIfSelectionInView(true);
        env.clock.advance(250);
        env.elements.scrollerElement.rect = { left: 40, top: 0, right: 400, bottom: 0, width: 360, height: 0 };
        env.selection.select(0, 0, 0, 0);
        editor.startActionMode();
        env.selection.select(0, 0, 0, 3);
        editor.startActionModeIfSelectionInView(false);
        env.clock.advance(250);
    },
    (env, editor) => {
        const oldSession = { selection: env.selection };
        const otherSelection = { listeners: {}, on: env.selection.on, off: env.selection.off };
        editor.emit("changeSession", { session: { selection: env.selection } });
        env.selection.select(3, 3, 3, 8);
        editor.startActionMode();
        emitSelection(env, "changeSelection");
        env.selection.select(3, 3, 3, 3);
        emitSelection(env, "changeSelection");
        env.record("actionMode", editor.actionMode);
        editor.emit("changeSession", { oldSession, session: { selection: env.selection } });
        env.record("listeners", (env.selection.listeners.changeSelection || []).length, Object.keys(otherSelection.listeners).length);
    },
];

function verifyEditorActionMode() {
    ACTION_MODE_SCENARIOS.forEach((scenario, index) => {
        for (const hostBridge of [true, false]) {
            const traces = ["original", "reconstructed"].map((kind) => {
                const env = createEnvironment({ hostBridge });
                const fragments = editorFragmentSet(kind, env);
                const editor = createActionModeEditor(env, fragments);
                env.record("defined", typeof editor.startActionMode, typeof editor.finishActionMode, editor.actionMode);
                if (hostBridge) scenario(env, editor);
                env.record("final", editor.actionMode, env.clock.pendingCount());
                return env.trace;
            });
            const difference = firstDifference(traces[0], traces[1]);
            check(!difference, `editor action mode #${index} (hostBridge=${hostBridge}) differs at #${difference && difference.index}: ${difference && difference.left} != ${difference && difference.right}`);
        }
    });
}

function verifyGetClientPosition() {
    const results = ["original", "reconstructed"].map((kind) => {
        const env = createEnvironment();
        let getClientPosition;
        if (kind === "original") {
            const holder = {};
            const file = "virtual_renderer-get-client-position.min.js";
            evaluateInContext(env, `(function () {"use strict";${readOriginal(file)}})`, file).call(holder);
            getClientPosition = holder.getClientPosition;
        } else {
            const runtime = env.createAceRuntime();
            runtime.evaluate(readReconstructed("virtual-renderer-get-client-position.js"), "virtual-renderer-get-client-position.js");
            getClientPosition = runtime.require("autojs6-reconstructed/virtual_renderer_get_client_position").getClientPosition;
        }
        const output = [];
        for (const [scrollLeft, scrollTop] of [[0, 0], [35, 0], [0, 47], [120, 913]]) {
            env.renderer.scrollLeft = scrollLeft;
            env.renderer.scrollTop = scrollTop;
            for (const position of [{ row: 0, column: 0 }, { row: 3, column: 17 }, { row: 50, column: 2 }]) {
                output.push(getClientPosition.call(env.renderer, position));
            }
        }
        return output;
    });
    compareValues("getClientPosition", results[0], results[1]);
}

function main() {
    const options = parseArguments(process.argv.slice(2));
    verifyManifest(options.aceJs);
    verifyRegression();
    verifyVelocityTracker();
    verifyScroller();
    verifyTouchHandler();
    verifyMagnifierDirect();
    verifyEditorActionMode();
    verifyGetClientPosition();
    if (failures.length) {
        for (const failure of failures.slice(0, 20)) console.error(`FAIL ${failure}`);
        if (failures.length > 20) console.error(`... ${failures.length - 20} more`);
        console.error(`[ace mobile reconstruction] ${failures.length} of ${checks} checks failed`);
        process.exitCode = 1;
        return;
    }
    console.log(`[ace mobile reconstruction] ${checks} checks passed (${TOUCH_SCENARIOS.length} touch scenarios, ${ACTION_MODE_SCENARIOS.length} action mode scenarios)`);
}

main();
