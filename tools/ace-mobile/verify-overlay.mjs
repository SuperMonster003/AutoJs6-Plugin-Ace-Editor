#!/usr/bin/env node

// Verifies that the AutoJs6 mobile overlay (app/src/main/assets/editor/ace-builds-1.44.0/autojs6/mobile) behaves like
// the Ace 1.4.12 Auto.js build (tools/ace-mobile/reconstructed/original), Roadmap-Ace-1.44.0.md A2:
//   - scroller and velocity tracker produce identical numbers for generated inputs;
//   - the touch handler produces identical call traces for every scenario of touch-harness.mjs, except for the
//     differences listed in EXPECTED_DIFFERENCES;
//   - the ActionMode additions produce identical host bridge calls.
// DOM writes and renderer.onResize are ignored when comparing touch traces (see isComparable).
//
// Usage: node tools/ace-mobile/verify-overlay.mjs

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { TOUCH_SCENARIOS, createEnvironment, firstDifference, plain, runTouchScenario } from "./touch-harness.mjs";
import {
    ACTION_MODE_SCENARIOS,
    createActionModeEditor,
    createRandom,
    editorFragmentSet,
    loadImplementation,
} from "./verify-reconstructed.mjs";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = path.resolve(SCRIPT_DIR, "..", "..");
const OVERLAY_DIR = path.join(REPOSITORY_ROOT, "app", "src", "main", "assets", "editor", "ace-builds-1.44.0", "autojs6", "mobile");
const OVERLAY_FILES = [
    "autojs6_mobile_scroller.js",
    "autojs6_mobile_velocity_tracker.js",
    "autojs6_mobile_magnifier.js",
    "autojs6_mobile_action_mode.js",
    "autojs6_mobile_touch_handler.js",
];

// Scenario name -> reason. These scenarios run against both implementations but their traces are expected to differ.
export const EXPECTED_DIFFERENCES = Object.freeze({
    "B11 completion popup flag skips touches":
        "editor.popup is never assigned at runtime; the overlay does not check it (Roadmap-Ace-1.44.0.md A2-4)",
});

// Entries that are allowed to differ in every scenario: DOM writes (the original created its never enabled magnifier
// eagerly and implemented pinch zoom with document.body.style.zoom plus renderer.onResize, which the overlay leaves to
// the bridge).
function isComparable(entry) {
    return !(entry[0] === "style" || String(entry[0]).startsWith("dom.") || entry[0] === "renderer.onResize");
}

const failures = [];
let checks = 0;

function check(condition, message) {
    checks += 1;
    if (!condition) failures.push(message);
}

function loadOverlay(env) {
    const runtime = env.createAceRuntime();
    for (const file of OVERLAY_FILES) {
        runtime.evaluate(fs.readFileSync(path.join(OVERLAY_DIR, file), "utf8"), file);
    }
    return runtime;
}

function comparableTrace(trace) {
    return trace.filter(isComparable).map((entry) => {
        if (entry[0] !== "final") return entry;
        const final = { ...entry[1] };
        delete final.bodyZoom;
        return ["final", final];
    });
}

function verifyTouchScenarios() {
    let compared = 0;
    for (const scenario of TOUCH_SCENARIOS) {
        const traces = ["original", "overlay"].map((kind) => {
            const env = createEnvironment();
            env.editor.$toDestroy = [];
            if (scenario.setup) scenario.setup(env);
            if (kind === "original") {
                loadImplementation("original", env)
                    .require("ace/mouse/touch_handler")
                    .addTouchListeners(env.editor.container, env.editor, { $magnifierEnabled: !!scenario.magnifierEnabled });
            } else {
                loadOverlay(env)
                    .require("autojs6/mobile/touch_handler")
                    .addTouchListeners(env.editor.container, env.editor, { isMagnifierEnabled: () => !!scenario.magnifierEnabled });
            }
            return comparableTrace(runTouchScenario(env, scenario));
        });
        const difference = firstDifference(traces[0], traces[1]);
        if (EXPECTED_DIFFERENCES[scenario.name]) {
            check(!!difference, `"${scenario.name}" is listed as an expected difference but the traces are identical`);
            continue;
        }
        compared++;
        check(!difference, `touch scenario "${scenario.name}" differs at #${difference && difference.index}: ${difference && difference.left} != ${difference && difference.right}`);
    }
    return compared;
}

// The host cancels at the start of every single finger scroll; the 1.4.12 handler never saw that, so the overlay must
// ignore it. A touch cancel, in contrast, must stop a pending long press.
function verifyCancellation() {
    const nonTerminal = ["B6 drag the cursor handle", "B8 slow scroll drag does not fling", "B9 fast swipe flings and restarts the action mode"];
    for (const name of nonTerminal) {
        const scenario = TOUCH_SCENARIOS.find((candidate) => candidate.name === name);
        check(!!scenario, `missing scenario ${name}`);
        if (!scenario) continue;
        const firstMove = scenario.steps.findIndex((step) => step.move);
        const steps = scenario.steps.slice();
        steps.splice(firstMove + 1, 0, { run: (env) => env.overlayController && env.overlayController.cancel("single_finger_scroll") });
        const traces = ["original", "overlay"].map((kind) => runVariant(kind, { ...scenario, steps }));
        const difference = firstDifference(traces[0], traces[1]);
        check(!difference, `"${name}" with a single_finger_scroll cancel differs at #${difference && difference.index}: ${difference && difference.left} != ${difference && difference.right}`);
    }
    const longPress = {
        name: "touch cancel stops a pending long press",
        steps: [{ down: [184, 150] }, { wait: 200 }, { run: (env) => env.overlayController && env.overlayController.cancel("dom_touchcancel") }, { wait: 600 }],
    };
    const trace = runVariant("overlay", longPress);
    check(!trace.some((entry) => entry[0] === "selection.selectWord" || entry[0] === "editor.startActionMode"), "a touch cancel did not stop the long press");
}

// Roadmap-Ace-1.44.0.md A5-3: Ace's custom scrollbar has no 1.4.12 counterpart, so the overlay is checked on its own.
// The fake vertical scrollbar has a 500 px slide for 1800 px of scrollable content.
function runCustomScrollbarScenario(enabled, steps) {
    const env = createEnvironment();
    env.editor.$toDestroy = [];
    const { container } = env.elements;
    const track = {
        label: "scrollbar-v",
        classList: new Set(["ace_sb-v"]),
        parentNode: container,
        getBoundingClientRect: () => ({ left: 388, top: 0, right: 400, bottom: 600, width: 12, height: 600 }),
    };
    env.elements.scrollbarTrack = track;
    env.elements.scrollbarThumb = { label: "scrollbar-v-thumb", classList: new Set(), parentNode: track };
    env.renderer.scrollBarV = {
        element: track,
        thumbTop: 0,
        thumbHeight: 100,
        scrollTopFromThumbTop: (thumbTop) => Math.max(0, Math.min(1800, Math.round((thumbTop * 1800) / 500))),
        _emit(name, event) {
            env.record("scrollbar." + name, event.data);
        },
    };
    env.editor.getOption = (name) => (name === "customScrollbar" ? enabled : undefined);
    loadOverlay(env)
        .require("autojs6/mobile/touch_handler")
        .addTouchListeners(container, env.editor, { isMagnifierEnabled: () => false });
    return runTouchScenario(env, { name: "custom scrollbar", steps });
}

function verifyCustomScrollbar() {
    const names = (trace, prefix) => trace.filter((entry) => String(entry[0]).startsWith(prefix));
    const final = (trace) => trace.find((entry) => entry[0] === "final")[1];
    const thumbDrag = runCustomScrollbarScenario(true, [
        { down: [394, 50], target: "scrollbarThumb" },
        { wait: 16 },
        { move: [394, 100], target: "scrollbarThumb" },
        { wait: 16 },
        { move: [394, 150], target: "scrollbarThumb" },
        { wait: 16 },
        { up: [394, 150], target: "scrollbarThumb" },
        { wait: 1000 },
    ]);
    check(
        JSON.stringify(names(thumbDrag, "scrollbar.").map((entry) => entry[1])) === "[180,360]",
        `thumb drag emitted ${JSON.stringify(names(thumbDrag, "scrollbar."))}`,
    );
    check(names(thumbDrag, "renderer.scrollTo").length === 0, "thumb drag scrolled the content directly or flung");
    check(names(thumbDrag, "event.preventDefault").length === 3, "thumb drag did not prevent the touchstart and both moves");
    check(
        !thumbDrag.some((entry) => /^(selection\.|editor\.startActionMode$)/.test(String(entry[0]))),
        "thumb drag changed the selection or started the action mode",
    );
    check(final(thumbDrag).pendingTimers === 0, "thumb drag left a long press or fling timer");

    const trackTap = runCustomScrollbarScenario(true, [
        { down: [394, 400], target: "scrollbarTrack" },
        { wait: 50 },
        { up: [394, 400], target: "scrollbarTrack" },
    ]);
    check(
        JSON.stringify(names(trackTap, "scrollbar.").map((entry) => entry[1])) === "[1260]",
        `track tap emitted ${JSON.stringify(names(trackTap, "scrollbar."))}`,
    );
    check(!trackTap.some((entry) => /^selection\./.test(String(entry[0]))), "track tap moved the cursor");

    const disabled = runCustomScrollbarScenario(false, [
        { down: [394, 400], target: "scrollbarThumb" },
        { wait: 16 },
        { move: [394, 300], target: "scrollbarThumb" },
        { wait: 16 },
        { up: [394, 300], target: "scrollbarThumb" },
    ]);
    check(names(disabled, "scrollbar.").length === 0, "the overlay dragged a scrollbar while customScrollbar is off");
    check(names(disabled, "renderer.scrollTo").length > 0, "without customScrollbar the touch no longer scrolls the content");
}

function runVariant(kind, scenario) {
    const env = createEnvironment();
    env.editor.$toDestroy = [];
    if (scenario.setup) scenario.setup(env);
    if (kind === "original") {
        loadImplementation("original", env)
            .require("ace/mouse/touch_handler")
            .addTouchListeners(env.editor.container, env.editor, { $magnifierEnabled: false });
    } else {
        env.overlayController = loadOverlay(env)
            .require("autojs6/mobile/touch_handler")
            .addTouchListeners(env.editor.container, env.editor, { isMagnifierEnabled: () => false });
    }
    return comparableTrace(runTouchScenario(env, scenario));
}

function verifyScroller() {
    for (let round = 0; round < 120; round++) {
        const results = ["original", "overlay"].map((kind) => {
            const env = createEnvironment();
            const local = createRandom(5000 + round);
            const output = [];
            let fling;
            let step;
            if (kind === "original") {
                const { Scroller } = loadImplementation("original", env).require("ace/mouse/scroller.js");
                const scroller = Scroller.createDefault();
                fling = (x, y, vx, vy) => scroller.fling(x, y, vx, vy, 0, 800, 0, 4000);
                step = () => [scroller.computeScrollOffset(), scroller.getCurrX(), scroller.getCurrY(), scroller.isFinished()];
                output.abort = () => scroller.abortAnimation();
            } else {
                const { Scroller } = loadOverlay(env).require("autojs6/mobile/scroller");
                const scroller = new Scroller();
                fling = (x, y, vx, vy) => scroller.fling(x, y, vx, vy, { minX: 0, maxX: 800, minY: 0, maxY: 4000 });
                step = () => [scroller.computeScrollOffset(), scroller.currX, scroller.currY, scroller.isFinished()];
                output.abort = () => scroller.abortAnimation();
            }
            const doFling = () => {
                const vx = Math.round(local() * 16000 - 8000);
                const vy = Math.round(local() * 16000 - 8000);
                fling(Math.round(local() * 500), Math.round(local() * 3000), vx, vy);
            };
            doFling();
            for (let i = 0; i < 400; i++) {
                env.clock.advance(round % 4 === 0 ? 2 : 16);
                const state = step();
                output.push(state);
                if (i === 10 && round % 3 === 0) doFling();
                if (i === 20 && round % 5 === 0) output.abort();
                if (!state[0]) break;
            }
            return output;
        });
        check(
            JSON.stringify(plain(results[0])) === JSON.stringify(plain(results[1])),
            `scroller#${round} differs`,
        );
    }
}

function verifyVelocityTracker() {
    for (let round = 0; round < 300; round++) {
        const results = ["original", "overlay"].map((kind) => {
            const env = createEnvironment();
            const local = createRandom(1000 + round);
            let tracker;
            let add;
            let read;
            if (kind === "original") {
                const { VelocityTracker } = loadImplementation("original", env).require("ace/mouse/velocity-tracker.js");
                tracker = new VelocityTracker();
                add = (x, y, t) => tracker.addMovement({ x, y }, t);
                read = () => [tracker.getXVelocity(), tracker.getYVelocity()];
            } else {
                const { VelocityTracker } = loadOverlay(env).require("autojs6/mobile/velocity_tracker");
                tracker = new VelocityTracker();
                add = (x, y, t) => tracker.addMovement(x, y, t);
                read = () => [tracker.velocityX, tracker.velocityY];
            }
            const output = [];
            const count = 1 + Math.floor(local() * 15);
            let time = 1000 + local() * 3;
            let x = 100;
            let y = 300;
            for (let i = 0; i < count; i++) {
                // Fractional timestamps as delivered by Chrome's DOMHighResTimeStamp.
                time += 2 + local() * (round % 5 === 0 ? 80 : 20);
                x += Math.round(local() * 60 - 30);
                y += Math.round(local() * 120 - 60);
                add(x, y, time);
                output.push([tracker.computeVelocity(1000), ...read()]);
            }
            tracker.clear();
            output.push([tracker.computeVelocity(1000), ...read()]);
            return output;
        });
        check(
            JSON.stringify(plain(results[0])) === JSON.stringify(plain(results[1])),
            `velocity tracker#${round} differs: ${JSON.stringify(plain(results[0])).slice(0, 200)} != ${JSON.stringify(plain(results[1])).slice(0, 200)}`,
        );
    }
}

function verifyActionMode() {
    ACTION_MODE_SCENARIOS.forEach((scenario, index) => {
        for (const hostBridge of [true, false]) {
            const traces = ["original", "overlay"].map((kind) => {
                const env = createEnvironment({ hostBridge });
                let fragments;
                if (kind === "original") {
                    fragments = editorFragmentSet("original", env);
                } else {
                    const ActionMode = loadOverlay(env).require("autojs6/mobile/action_mode");
                    fragments = {
                        definePrototypeMethods() {},
                        installConstructorListeners() {
                            ActionMode.install(this);
                        },
                    };
                }
                const editor = createActionModeEditor(env, fragments);
                env.record("defined", typeof editor.startActionMode, typeof editor.finishActionMode, editor.actionMode);
                if (hostBridge) scenario(env, editor);
                env.record("final", editor.actionMode, env.clock.pendingCount());
                return env.trace;
            });
            const difference = firstDifference(traces[0], traces[1]);
            check(!difference, `action mode #${index} (hostBridge=${hostBridge}) differs at #${difference && difference.index}: ${difference && difference.left} != ${difference && difference.right}`);
        }
    });
}

function verifyGetClientPosition() {
    const results = ["original", "overlay"].map((kind) => {
        const env = createEnvironment();
        let getClientPosition;
        if (kind === "original") {
            const holder = {};
            const file = "virtual_renderer-get-client-position.min.js";
            const code = fs.readFileSync(path.join(SCRIPT_DIR, "reconstructed", "original", file), "latin1");
            vm.runInContext(`(function () {"use strict";${code}})`, env.context, { filename: file }).call(holder);
            getClientPosition = holder.getClientPosition;
        } else {
            getClientPosition = loadOverlay(env).require("autojs6/mobile/action_mode").getClientPosition;
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
    check(JSON.stringify(results[0]) === JSON.stringify(results[1]), "getClientPosition differs");
}

function main() {
    verifyGetClientPosition();
    verifyScroller();
    verifyVelocityTracker();
    const compared = verifyTouchScenarios();
    verifyActionMode();
    verifyCancellation();
    verifyCustomScrollbar();
    if (failures.length) {
        for (const failure of failures.slice(0, 20)) console.error(`FAIL ${failure}`);
        if (failures.length > 20) console.error(`... ${failures.length - 20} more`);
        console.error(`[ace mobile overlay] ${failures.length} of ${checks} checks failed`);
        process.exitCode = 1;
        return;
    }
    console.log(
        `[ace mobile overlay] ${checks} checks passed (${compared} touch scenarios identical, ` +
            `${Object.keys(EXPECTED_DIFFERENCES).length} expected differences, ${ACTION_MODE_SCENARIOS.length} action mode scenarios)`,
    );
}

main();
