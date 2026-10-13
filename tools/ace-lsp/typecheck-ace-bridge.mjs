#!/usr/bin/env node

// Type checks the AutoJs6 bridge scripts against the ace.d.ts of ace-builds 1.44.0 (Roadmap-Ace-1.44.0.md A6-2).
//
//   node tools/ace-lsp/typecheck-ace-bridge.mjs
//
// TypeScript is pinned by tools/ace-lsp/ace-bridge-test/package-lock.json; the declarations come from the pinned
// npm tarball (fetch-ace-upstream.mjs, cached under build/ace-upstream). The scripts are plain JavaScript checked with
// allowJs / checkJs and strict off: JavaScript infers `var editor = null` from its later assignments, so calls on the
// editor, session and renderer are checked against Ace's declarations. Members Ace does not declare but the bridge
// needs are listed in tools/ace-lsp/ace-bridge-typecheck/ace-private.d.ts.

import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { loadAceBridgeTestDependencies } from "./ace-bridge-test/dependencies.mjs";
import { fetchAceUpstream } from "./fetch-ace-upstream.mjs";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = path.resolve(SCRIPT_DIR, "..", "..");
const AUTOJS6_DIR = path.join(REPOSITORY_ROOT, "app", "src", "main", "assets", "editor", "ace-builds-1.44.0", "autojs6");
const PRIVATE_DECLARATIONS = path.join(SCRIPT_DIR, "ace-bridge-typecheck", "ace-private.d.ts");

// The scripts that drive Ace directly. The language service scripts only exchange plain data with the bridge.
const CHECKED_SCRIPTS = [
    "autojs6_ace_bridge.js",
    "autojs6_mode_patches.js",
    "mobile/autojs6_mobile_scroller.js",
    "mobile/autojs6_mobile_velocity_tracker.js",
    "mobile/autojs6_mobile_magnifier.js",
    "mobile/autojs6_mobile_action_mode.js",
    "mobile/autojs6_mobile_touch_handler.js",
];

async function main() {
    const requireDependency = loadAceBridgeTestDependencies();
    const ts = requireDependency("typescript");
    const upstream = await fetchAceUpstream("1.44.0");
    const rootNames = [
        path.join(upstream.extractDir, "ace.d.ts"),
        PRIVATE_DECLARATIONS,
        ...CHECKED_SCRIPTS.map((script) => path.join(AUTOJS6_DIR, ...script.split("/"))),
    ];
    const program = ts.createProgram({
        rootNames,
        options: {
            allowJs: true,
            checkJs: true,
            noEmit: true,
            strict: false,
            noImplicitAny: false,
            target: ts.ScriptTarget.ES2020,
            lib: ["lib.es2020.d.ts", "lib.dom.d.ts"],
            types: [],
            skipLibCheck: true,
        },
    });
    const diagnostics = ts.getPreEmitDiagnostics(program);
    const host = {
        getCanonicalFileName: (fileName) => fileName,
        getCurrentDirectory: () => REPOSITORY_ROOT,
        getNewLine: () => "\n",
    };
    if (diagnostics.length) {
        console.error(ts.formatDiagnostics(diagnostics, host));
        console.error(`[ace bridge typecheck] ${diagnostics.length} errors (TypeScript ${ts.version}, ace-builds 1.44.0)`);
        process.exitCode = 1;
        return;
    }
    console.log(`[ace bridge typecheck] ${CHECKED_SCRIPTS.length} scripts checked (TypeScript ${ts.version}, ace-builds 1.44.0)`);
}

main().catch((error) => {
    console.error(error && error.stack || error);
    process.exitCode = 1;
});
