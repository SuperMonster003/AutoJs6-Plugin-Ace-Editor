// The previous editor build as a test oracle (Roadmap-Ace-1.44.0.md A0-5).
//
// Until the Ace 1.44.0 upgrade AutoJs6 shipped an Auto.js build of Ace 1.4.12 whose mobile touch behavior users know.
// That build is closed-source work of others, so its code is not kept in the work tree: legacy-slices.json records the
// byte ranges of its customizations inside the ace.js of commit f067e63, and this module cuts them out of the Git
// object when a verification runs (cached under build/ace-mobile/legacy, never committed). The overlay in
// autojs6/mobile is an independent implementation; verify-overlay.mjs only compares observable behavior.

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = path.resolve(SCRIPT_DIR, "..", "..");
const MANIFEST = JSON.parse(fs.readFileSync(path.join(SCRIPT_DIR, "legacy-slices.json"), "utf8"));
const CACHE_DIR = path.join(REPOSITORY_ROOT, "build", "ace-mobile", "legacy", MANIFEST.source.sha256.slice(0, 16));

function sha256(content) {
    return crypto.createHash("sha256").update(content).digest("hex");
}

function readLegacyAceJs() {
    const { commit, path: sourcePath } = MANIFEST.source;
    const blob = spawnSync("git", ["show", `${commit}:${sourcePath}`], { cwd: REPOSITORY_ROOT, maxBuffer: 16 * 1024 * 1024 });
    if (blob.status !== 0) {
        throw new Error(
            `[legacy oracle] cannot read ${commit.slice(0, 12)}:${sourcePath} from Git (a shallow clone lacks it): ` +
                String(blob.stderr || ""),
        );
    }
    if (sha256(blob.stdout) !== MANIFEST.source.sha256) {
        throw new Error(`[legacy oracle] ${sourcePath} at ${commit.slice(0, 12)} does not match legacy-slices.json`);
    }
    return blob.stdout;
}

function ensureCache() {
    const complete = MANIFEST.slices.every((slice) => fs.existsSync(path.join(CACHE_DIR, slice.file)));
    if (complete) {
        return;
    }
    const aceJs = readLegacyAceJs();
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    for (const slice of MANIFEST.slices) {
        const bytes = aceJs.subarray(slice.offset, slice.offset + slice.length);
        if (bytes.length !== slice.length || sha256(bytes) !== slice.sha256) {
            throw new Error(`[legacy oracle] slice ${slice.file} does not match legacy-slices.json`);
        }
        fs.writeFileSync(path.join(CACHE_DIR, slice.file), bytes);
    }
}

export function readLegacy(file) {
    ensureCache();
    const slice = MANIFEST.slices.find((entry) => entry.file === file);
    if (!slice) throw new Error(`[legacy oracle] unknown slice ${file}`);
    const bytes = fs.readFileSync(path.join(CACHE_DIR, file));
    if (sha256(bytes) !== slice.sha256) {
        throw new Error(`[legacy oracle] cached slice ${file} was modified; delete ${path.relative(REPOSITORY_ROOT, CACHE_DIR)}`);
    }
    return bytes.toString("latin1");
}

// Loads the legacy touch stack (regression, velocity tracker, scroller, magnifier, touch handler) into a runtime of
// touch-harness.mjs. Module ids: ace/mouse/regression.js, ace/mouse/velocity-tracker.js, ace/mouse/scroller.js,
// ace/mouse/magnifier.js, ace/mouse/touch_handler.
export function loadLegacyTouchStack(env) {
    const runtime = env.createAceRuntime();
    for (const file of [
        "babel-helpers.min.js",
        "regression.min.js",
        "velocity-tracker.min.js",
        "scroller.min.js",
        "magnifier.min.js",
        "touch_handler.min.js",
    ]) {
        runtime.evaluate(readLegacy(file), file);
    }
    return runtime;
}

// The legacy editor ActionMode additions as two installers for touch-harness.mjs createActionModeEditor().
export function legacyActionModeFragments(env) {
    // The fragments ran inside the strict "ace/editor" factory where two variables hold the mode names.
    const wrap = (file) =>
        vm.runInContext(`(function (w, E) {"use strict";${readLegacy(file)}})`, env.context, { filename: file });
    const names = Function(`var ${readLegacy("editor-action-mode-names.min.js")}; return [w, E];`)();
    const constructorTail = wrap("editor-constructor.min.js");
    const prototypeTail = wrap("editor-prototype.min.js");
    return {
        installConstructorListeners() {
            constructorTail.call(this, names[0], names[1]);
        },
        definePrototypeMethods() {
            prototypeTail.call(this, names[0], names[1]);
        },
    };
}

// The legacy VirtualRenderer.getClientPosition.
export function legacyGetClientPosition(env) {
    const holder = {};
    const file = "virtual_renderer-get-client-position.min.js";
    vm.runInContext(`(function () {"use strict";${readLegacy(file)}})`, env.context, { filename: file }).call(holder);
    return holder.getClientPosition;
}

export const LEGACY_SOURCE = MANIFEST.source;
