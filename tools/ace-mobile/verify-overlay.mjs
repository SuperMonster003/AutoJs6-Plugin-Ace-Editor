#!/usr/bin/env node

// Verifies that the AutoJs6 mobile overlay (app/src/main/assets/editor/ace-builds-1.44.0/autojs6/mobile) behaves like
// the editor build AutoJs6 shipped before (Ace 1.4.12 Auto.js build, loaded by legacy-oracle.mjs from Git history),
// Roadmap-Ace-1.44.0.md A2 and A0-5:
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
import { fileURLToPath } from "node:url";
import {
    ACTION_MODE_SCENARIOS,
    TOUCH_SCENARIOS,
    createActionModeEditor,
    createEnvironment,
    createRandom,
    firstDifference,
    plain,
    runTouchScenario,
    touchPoint as at,
} from "./touch-harness.mjs";
import { legacyActionModeFragments, legacyGetClientPosition, loadLegacyTouchStack } from "./legacy-oracle.mjs";

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

// Scenario name -> reason. These scenarios run against both implementations but their traces are expected to differ;
// verifyImprovements checks what the overlay does instead.
export const EXPECTED_DIFFERENCES = Object.freeze({
    "B11 completion popup flag skips touches":
        "editor.popup is never assigned at runtime; the overlay does not check it (Roadmap-Ace-1.44.0.md A2-4)",
    "B19 slow tap (250 ms)":
        "1.4.12 only took touches lifted within 100 ms as taps; every tap lifted before the long press moves the cursor (A2-10)",
    "tap lasting 110 ms":
        "the same slow tap at the old 100 ms limit (A2-10)",
    "B2 gutter tap":
        "1.4.12 ignored gutter touches, leaving them to the mouse events Ace focuses the editor on; the overlay passes the tap to the host (A2-10)",
    "gutter tap after a scroll":
        "1.4.12 ended a gutter touch with the gesture of the previous touch; the overlay handles it as a gutter tap (A2-10)",
    "B8 slow scroll drag resting before the lift":
        "1.4.12 flung with the velocity from before the finger rested; a finger resting for more than 40 ms does not fling (A2-10)",
    "second tap after 301 ms is a single tap":
        "the second tap lands on the cursor the first one placed, which shows the insertion toolbar (A2-10)",
    "drag returning near the start":
        "1.4.12 kept the cleared long press timer id and ignored moves back near the start; the overlay follows them (A2-10)",
    "B7 drag the anchor handle of a selection with the magnifier":
        "the last move comes back near the start, which 1.4.12 ignored for the same reason (A2-10)",
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
                loadLegacyTouchStack(env)
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
    const nonTerminal = ["B6 drag the cursor handle", "B8 slow scroll drag resting before the lift", "B9 fast swipe flings and restarts the action mode"];
    for (const name of nonTerminal) {
        const scenario = TOUCH_SCENARIOS.find((candidate) => candidate.name === name);
        check(!!scenario, `missing scenario ${name}`);
        if (!scenario) continue;
        const firstMove = scenario.steps.findIndex((step) => step.move);
        const steps = scenario.steps.slice();
        steps.splice(firstMove + 1, 0, { run: (env) => env.overlayController && env.overlayController.cancel("single_finger_scroll") });
        // The cancel must not change anything: compare with 1.4.12 or, for an intended difference, with the overlay
        // without the cancel.
        const reference = EXPECTED_DIFFERENCES[name] ? runVariant("overlay", scenario) : runVariant("original", { ...scenario, steps });
        const traces = [reference, runVariant("overlay", { ...scenario, steps })];
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
function runCustomScrollbarScenario(enabled, steps, barOverrides = {}, options = () => ({})) {
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
        ...barOverrides,
    };
    env.editor.getOption = (name) => (name === "customScrollbar" ? enabled : undefined);
    loadOverlay(env)
        .require("autojs6/mobile/touch_handler")
        .addTouchListeners(container, env.editor, { isMagnifierEnabled: () => false, ...options(env) });
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

    // Before its first render the scrollbar has no thumb geometry (thumbTop undefined, thumbHeight NaN).
    const unrendered = runCustomScrollbarScenario(
        true,
        [
            { down: [394, 400], target: "scrollbarThumb" },
            { wait: 16 },
            { move: [394, 300], target: "scrollbarThumb" },
            { wait: 16 },
            { up: [394, 300], target: "scrollbarThumb" },
        ],
        { thumbTop: undefined, thumbHeight: NaN },
    );
    check(names(unrendered, "scrollbar.").length === 0, "the overlay dragged a scrollbar without thumb geometry");
    check(names(unrendered, "renderer.scrollTo").length > 0, "a touch on an unrendered scrollbar no longer scrolls the content");

    // A2-10: a scrollbar the host has hidden cannot be grabbed; a drag of a visible one is reported to the host.
    const dragSteps = [
        { down: [394, 50], target: "scrollbarThumb" },
        { wait: 16 },
        { move: [394, 100], target: "scrollbarThumb" },
        { wait: 16 },
        { up: [394, 100], target: "scrollbarThumb" },
    ];
    const hidden = runCustomScrollbarScenario(true, dragSteps, {}, (env) => ({
        isScrollbarHidden: (vertical) => {
            env.record("host.isScrollbarHidden", vertical);
            return true;
        },
    }));
    check(names(hidden, "scrollbar.").length === 0, "the overlay dragged a hidden scrollbar");
    check(names(hidden, "renderer.scrollTo").length > 0, "a touch on a hidden scrollbar does not scroll the content");
    const reported = runCustomScrollbarScenario(true, dragSteps, {}, (env) => ({
        isScrollbarHidden: () => false,
        onScrollbarDrag: (active) => env.record("host.onScrollbarDrag", active),
    }));
    check(
        JSON.stringify(names(reported, "host.onScrollbarDrag").map((entry) => entry[1])) === "[true,false]",
        `scrollbar drag reported ${JSON.stringify(names(reported, "host.onScrollbarDrag"))}`,
    );
}

// Roadmap-Ace-1.44.0.md A2-10: the behavior that intentionally differs from 1.4.12, checked on the overlay alone.
function runOverlay(scenario, options = () => ({})) {
    const env = createEnvironment();
    env.editor.$toDestroy = [];
    if (scenario.setup) scenario.setup(env);
    env.overlayController = loadOverlay(env)
        .require("autojs6/mobile/touch_handler")
        .addTouchListeners(env.editor.container, env.editor, { isMagnifierEnabled: () => false, ...options(env) });
    return comparableTrace(runTouchScenario(env, scenario));
}

function verifyImprovements() {
    const named = (name) => TOUCH_SCENARIOS.find((scenario) => scenario.name === name);
    const entries = (trace, name) => trace.filter((entry) => entry[0] === name);
    const has = (trace, name) => entries(trace, name).length > 0;
    const final = (trace) => trace.find((entry) => entry[0] === "final")[1];
    const cursorOf = (trace) => JSON.stringify(final(trace).cursor);
    const afterLift = (trace) => trace.slice(trace.findIndex((entry) => entry[0] === "dispatch" && entry[1] === "touchend"));

    // B19: a tap lifted before the long press moves the cursor and asks for the soft input, however slow it was.
    for (const name of ["B19 slow tap (250 ms)", "tap lasting 110 ms"]) {
        const trace = runOverlay(named(name));
        check(cursorOf(trace) === JSON.stringify({ column: 12, row: 6 }), `${name}: cursor ${cursorOf(trace)}`);
        check(has(trace, "autojs.showSoftInput"), `${name}: no soft input`);
    }

    // B8 / B20: a finger that rests for more than 40 ms before the lift does not fling; one lifted while moving does.
    const restingDrag = (rest) => ({
        setup: (env) => env.renderer.scrollTo(0, 400),
        steps: [{ down: [200, 300] }, { wait: 20 }, { move: [200, 280] }, { wait: 20 }, { move: [200, 250] }, { wait: 20 }, { move: [200, 210] }, { wait: rest }, { up: [200, 210] }, { wait: 300 }],
    });
    const flung = runOverlay(restingDrag(40));
    check(has(afterLift(flung), "renderer.scrollTo"), "a finger lifted 40 ms after its last move did not fling");
    const rested = runOverlay(restingDrag(41));
    check(!has(afterLift(rested), "renderer.scrollTo"), "a finger resting 41 ms before the lift flung");
    check(has(afterLift(rested), "editor.startActionModeIfSelectionInView"), "a rested drag did not restart the toolbar");
    const restedLong = runOverlay(named("B8 slow scroll drag resting before the lift"));
    check(!has(afterLift(restedLong), "renderer.scrollTo"), "B8: the drag resting 150 ms flung");

    // A tap on the cursor shows the insertion toolbar instead of the empty selection request; a tap beside it does not.
    const onCursor = runOverlay({ setup: (env) => env.selection.select(12, 7, 12, 7), steps: [{ down: at(12, 7) }, { wait: 40 }, { up: at(12, 7) }, { wait: 300 }] });
    check(entries(onCursor, "editor.startInsertionActionMode").length === 1, "a tap on the cursor did not show the insertion toolbar");
    check(!has(onCursor, "editor.startActionMode"), "a tap on the cursor also asked for the selection toolbar");
    check(cursorOf(onCursor) === JSON.stringify({ column: 7, row: 12 }), `a tap on the cursor moved it to ${cursorOf(onCursor)}`);
    check(has(onCursor, "autojs.showSoftInput"), "a tap on the cursor did not ask for the soft input");
    const besideCursor = runOverlay({ setup: (env) => env.selection.select(12, 7, 12, 7), steps: [{ down: at(12, 9) }, { wait: 40 }, { up: at(12, 9) }, { wait: 300 }] });
    check(!has(besideCursor, "editor.startInsertionActionMode"), "a tap beside the cursor showed the insertion toolbar");
    const secondTap = runOverlay(named("second tap after 301 ms is a single tap"));
    check(entries(secondTap, "editor.startInsertionActionMode").length === 1, "a second tap on the placed cursor did not show the insertion toolbar");

    // A long press on blank space (row 1 ends with a space) places the cursor and shows the insertion toolbar.
    const blank = runOverlay({ steps: [{ down: at(1, 70) }, { wait: 600 }, { up: at(1, 70) }, { wait: 300 }] });
    check(cursorOf(blank) === JSON.stringify({ column: 65, row: 1 }), `a long press on blank space moved the cursor to ${cursorOf(blank)}`);
    check(final(blank).empty === true, "a long press on blank space selected text");
    check(!has(blank, "selection.selectWord"), "a long press on blank space selected a word");
    check(entries(blank, "editor.startInsertionActionMode").length === 1, "a long press on blank space did not show the insertion toolbar");
    check(has(blank, "autojs.performLongPressFeedback"), "a long press on blank space gave no feedback");
    check(!has(afterLift(blank), "editor.startActionMode"), "the lift after a long press on blank space asked for the selection toolbar");
    check(!has(afterLift(blank), "selection.moveToPosition"), "the lift after a long press moved the cursor as a tap");

    // B2: a gutter tap goes to the host without focusing the editor or moving the cursor; a gutter drag scrolls.
    const gutterHost = (env) => ({ onGutterTap: (target, x, y) => env.record("host.onGutterTap", target.label, x, y) });
    const gutterTap = runOverlay(named("B2 gutter tap"), gutterHost);
    check(JSON.stringify(entries(gutterTap, "host.onGutterTap")) === JSON.stringify([["host.onGutterTap", "gutter-cell", 10, 30]]), `gutter tap reported ${JSON.stringify(entries(gutterTap, "host.onGutterTap"))}`);
    check(JSON.stringify(entries(gutterTap, "event.preventDefault")) === JSON.stringify([["event.preventDefault", "touchstart"]]), "the gutter touchstart was not prevented");
    for (const name of ["editor.focus", "autojs.showSoftInput", "selection.moveToPosition", "editor.startActionMode"]) {
        check(!has(gutterTap, name), `a gutter tap called ${name}`);
    }
    const gutterHold = runOverlay({ steps: [{ down: [10, 30], target: "gutterCell" }, { wait: 600 }, { up: [10, 30], target: "gutterCell" }, { wait: 300 }] }, gutterHost);
    check(!has(gutterHold, "host.onGutterTap") && !has(gutterHold, "selection.selectWord"), "a held gutter touch acted as a tap or a long press");
    const gutterDrag = runOverlay({
        setup: (env) => env.renderer.scrollTo(0, 400),
        steps: [{ down: [10, 300], target: "gutterCell" }, { wait: 16 }, { move: [10, 260], target: "gutterCell" }, { wait: 16 }, { move: [10, 200], target: "gutterCell" }, { wait: 16 }, { up: [10, 200], target: "gutterCell" }, { wait: 300 }],
    }, gutterHost);
    check(has(gutterDrag, "renderer.scrollTo") && final(gutterDrag).scrollTop > 400, "a gutter drag did not scroll");
    check(!has(gutterDrag, "host.onGutterTap") && !has(gutterDrag, "selection.moveCursorToPosition"), "a gutter drag tapped or dragged the cursor");
    const gutterAfterScroll = runOverlay(named("gutter tap after a scroll"), gutterHost);
    check(entries(gutterAfterScroll, "host.onGutterTap").length === 1, "a gutter tap after a scroll was not reported");

    // B18: a tap on Ace's overflow button toggles soft wrap like a mouse click and does not move the cursor.
    const overflow = runOverlay({
        steps: [{ down: at(3, 20), target: "overflowButton" }, { wait: 40 }, { up: at(3, 20), target: "overflowButton" }, { wait: 400 },
            { down: at(3, 20), target: "overflowButton" }, { wait: 40 }, { up: at(3, 20), target: "overflowButton" }, { wait: 400 }],
    });
    check(JSON.stringify(entries(overflow, "session.setOption")) === JSON.stringify([["session.setOption", "wrap", true], ["session.setOption", "wrap", false]]), `overflow button taps set ${JSON.stringify(entries(overflow, "session.setOption"))}`);
    check(!has(overflow, "selection.moveToPosition") && !has(overflow, "autojs.showSoftInput"), "an overflow button tap moved the cursor");

    // A drag or a scroll that comes back near its start keeps following the finger.
    const returning = runOverlay(named("drag returning near the start"));
    // The finger is 1.6 rows below the caret row (handle offset), so the cursor follows it to row 5.
    check(cursorOf(returning) === JSON.stringify({ column: 11, row: 5 }), `a drag back near its start left the cursor at ${cursorOf(returning)}`);
    const scrollBack = runOverlay({
        setup: (env) => env.renderer.scrollTo(0, 400),
        steps: [{ down: [200, 300] }, { wait: 16 }, { move: [200, 200] }, { wait: 16 }, { move: [200, 290] }, { wait: 60 }, { up: [200, 290] }, { wait: 300 }],
    });
    check(final(scrollBack).scrollTop === 410, `a scroll back near its start ended at ${final(scrollBack).scrollTop}`);

    // C3: touches that move the cursor or the selection end an IME composition, as Ace does on mousedown; scrolls and
    // gutter taps do not.
    const composing = (env) => {
        const textInput = env.editor.textInput;
        textInput.inComposition = {};
        textInput.lastValue = "line5 word";
        env.elements.textarea.value = textInput.lastValue;
        textInput.cancelComposition = () => env.record("textInput.cancelComposition");
        textInput.onCompositionEnd = (event) => {
            env.record("textInput.onCompositionEnd", event === undefined ? "no event" : "event", textInput.lastValue, env.elements.textarea.value);
            textInput.inComposition = false;
        };
        textInput.resetSelection = () => env.record("textInput.resetSelection", !!textInput.inComposition);
    };
    const cancels = (scenario) => {
        const trace = runOverlay({ ...scenario, setup: (env) => { composing(env); if (scenario.setup) scenario.setup(env); } });
        check(!has(trace, "textInput.cancelComposition"), `${scenario.name}: ended the composition through blur and focus`);
        const ends = entries(trace, "textInput.onCompositionEnd");
        check(ends.every((entry) => JSON.stringify(entry.slice(1)) === JSON.stringify(["no event", "", ""])), `${scenario.name}: ended the composition with ${JSON.stringify(ends)}`);
        const resets = entries(trace, "textInput.resetSelection");
        check(resets.length === ends.length && resets.every((entry) => entry[1] === false), `${scenario.name}: the textarea was not refilled after the composition ended`);
        return ends.length;
    };
    check(cancels(named("B1 quick tap moves the cursor and shows the soft input")) === 1, "a tap did not end the composition");
    check(cancels(named("B4 long press without selection selects a word")) === 1, "a long press did not end the composition");
    check(cancels(named("B6 drag the cursor handle")) === 1, "a cursor drag did not end the composition once");
    check(cancels(named("B9 fast swipe flings and restarts the action mode")) === 0, "a scroll ended the composition");
    check(cancels(named("B2 gutter tap")) === 0, "a gutter tap ended the composition");

    // B3: a double tap puts the cursor on the end of the word nearer to the finger ("alpha" spans columns 6-11).
    const doubleTap = (column) => runOverlay({ steps: [{ down: at(5, column) }, { wait: 40 }, { up: at(5, column) }, { wait: 120 }, { down: at(5, column) }, { wait: 40 }, { up: at(5, column) }, { wait: 300 }] });
    const nearStart = final(doubleTap(7));
    check(JSON.stringify([nearStart.anchor, nearStart.cursor]) === JSON.stringify([{ column: 11, row: 5 }, { column: 6, row: 5 }]), `a double tap near the word start selected ${JSON.stringify([nearStart.anchor, nearStart.cursor])}`);
    const nearEnd = final(doubleTap(10));
    check(JSON.stringify([nearEnd.anchor, nearEnd.cursor]) === JSON.stringify([{ column: 6, row: 5 }, { column: 11, row: 5 }]), `a double tap near the word end selected ${JSON.stringify([nearEnd.anchor, nearEnd.cursor])}`);

    // Handle drags are reported to the host (symbol highlights wait for the final position); scrolls are not.
    const dragHost = (env) => ({ onHandleDrag: (active) => env.record("host.onHandleDrag", active) });
    const handleDrag = runOverlay(named("B6 drag the cursor handle"), dragHost);
    check(JSON.stringify(entries(handleDrag, "host.onHandleDrag").map((entry) => entry[1])) === "[true,false]", `cursor drag reported ${JSON.stringify(entries(handleDrag, "host.onHandleDrag"))}`);
    const anchorDrag = runOverlay(named("B7 drag the anchor handle of a selection with the magnifier"), dragHost);
    check(JSON.stringify(entries(anchorDrag, "host.onHandleDrag").map((entry) => entry[1])) === "[true,false]", `anchor drag reported ${JSON.stringify(entries(anchorDrag, "host.onHandleDrag"))}`);
    const scrollDrag = runOverlay(named("B9 fast swipe flings and restarts the action mode"), dragHost);
    check(!has(scrollDrag, "host.onHandleDrag"), "a scroll was reported as a handle drag");

    // The insertion toolbar is its own host request; typing closes it like the selection toolbar.
    const env = createEnvironment();
    const ActionMode = loadOverlay(env).require("autojs6/mobile/action_mode");
    const editor = createActionModeEditor(env, {
        definePrototypeMethods() {},
        installConstructorListeners() {
            ActionMode.install(this);
        },
    });
    env.selection.select(3, 4, 3, 4);
    editor.startActionModeIfSelectionInView(false);
    editor.startInsertionActionMode();
    env.record("actionMode", editor.actionMode);
    env.clock.advance(300);
    editor.emit("change");
    env.record("actionMode", editor.actionMode);
    editor.emit("change");
    const calls = env.trace.filter((entry) => /^(autojs\.|actionMode)/.test(entry[0])).map((entry) => entry[0] + (entry[0] === "actionMode" ? ":" + entry[1] : ""));
    check(
        JSON.stringify(calls) === JSON.stringify(["autojs.startInsertionActionMode", "actionMode:insertionActionMode", "autojs.finishActionMode", "actionMode:"]),
        `insertion toolbar calls ${JSON.stringify(calls)}`,
    );
}

function runVariant(kind, scenario) {
    const env = createEnvironment();
    env.editor.$toDestroy = [];
    if (scenario.setup) scenario.setup(env);
    if (kind === "original") {
        loadLegacyTouchStack(env)
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
                const { Scroller } = loadLegacyTouchStack(env).require("ace/mouse/scroller.js");
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
                const { VelocityTracker } = loadLegacyTouchStack(env).require("ace/mouse/velocity-tracker.js");
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
                    fragments = legacyActionModeFragments(env);
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
            getClientPosition = legacyGetClientPosition(env);
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
    verifyImprovements();
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
