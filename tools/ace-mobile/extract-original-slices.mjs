#!/usr/bin/env node

// Extracts the Auto.js customizations from the legacy customized ace.js (as stored in Git) into
// tools/ace-mobile/reconstructed/original/ and writes original/manifest.json (offsets, lengths, SHA-256).
// The slices are the audit trail for the readable reconstruction; verify-reconstructed.mjs compares both.
//
// Usage: node tools/ace-mobile/extract-original-slices.mjs [--commit <rev>] [--out <dir>]
// The default revision is the last master commit that still carried ace-builds-1.4.12 (f067e63).

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = path.resolve(SCRIPT_DIR, "..", "..");
const SOURCE_PATH = "app/src/main/assets/editor/ace-builds-1.4.12/src-min-noconflict/ace.js";

function parseArguments(argv) {
    const result = { commit: "f067e63f49061d97e872337e7125b5e5445f874e", outDir: path.join(SCRIPT_DIR, "reconstructed", "original") };
    for (let index = 0; index < argv.length; index += 1) {
        if (argv[index] === "--commit") result.commit = argv[++index] || "";
        else if (argv[index] === "--out") result.outDir = path.resolve(argv[++index] || "");
        else throw new Error(`Unknown argument: ${argv[index]}`);
    }
    return result;
}

function readGitBlob(commit) {
    const resolved = spawnSync("git", ["rev-parse", "--verify", `${commit}^{commit}`], { cwd: REPOSITORY_ROOT, encoding: "utf8" });
    if (resolved.status !== 0) throw new Error(`Cannot resolve ${commit}: ${resolved.stderr}`);
    const blob = spawnSync("git", ["show", `${commit}:${SOURCE_PATH}`], { cwd: REPOSITORY_ROOT, maxBuffer: 16 * 1024 * 1024 });
    if (blob.status !== 0) throw new Error(`git show failed: ${blob.stderr}`);
    return { commit: resolved.stdout.trim(), bytes: blob.stdout };
}

function sha256(content) {
    return crypto.createHash("sha256").update(content).digest("hex");
}

function locateSlices(text) {
    const moduleRange = (name) => {
        const start = text.indexOf(`ace.define("${name}"`);
        if (start < 0) throw new Error(`Module not found: ${name}`);
        const next = text.indexOf('ace.define("', start + 10);
        let end = next < 0 ? text.length : next;
        while (",;\n\r ".includes(text[end - 1])) end--; // separator between modules
        return [start, end];
    };
    const balanced = (startToken, from = 0) => {
        const start = text.indexOf(startToken, from);
        if (start < 0) throw new Error(`Fragment not found: ${startToken}`);
        let depth = 0;
        let quote = null;
        for (let i = text.indexOf("{", start); i < text.length; i++) {
            const c = text[i];
            if (quote) {
                if (c === "\\") i++;
                else if (c === quote) quote = null;
                continue;
            }
            if (c === '"' || c === "'") quote = c;
            else if (c === "{") depth++;
            else if (c === "}" && --depth === 0) return [start, i + 1];
        }
        throw new Error(`Unbalanced fragment: ${startToken}`);
    };
    const exact = (token, from = 0) => {
        const start = text.indexOf(token, from);
        if (start < 0) throw new Error(`Fragment not found: ${token}`);
        return [start, start + token.length];
    };
    const editorStart = moduleRange("ace/editor")[0];
    const slices = [];
    const add = (file, module, range, note) => slices.push({ file, module, offset: range[0], length: range[1] - range[0], ...(note ? { note } : {}) });

    add("babel-helpers.min.js", "(prelude)", [0, exact("(function(){function o(n)")[0]], "global Babel helpers used by ace/mouse/regression.js");
    add("regression.min.js", "ace/mouse/regression.js", moduleRange("ace/mouse/regression.js"));
    add("velocity-tracker.min.js", "ace/mouse/velocity-tracker.js", moduleRange("ace/mouse/velocity-tracker.js"), "includes the trailing Math.signum polyfill expression");
    add("scroller.min.js", "ace/mouse/scroller.js", moduleRange("ace/mouse/scroller.js"));
    add("magnifier.min.js", "ace/mouse/magnifier.js", moduleRange("ace/mouse/magnifier.js"));
    add("touch_handler.min.js", "ace/mouse/touch_handler", moduleRange("ace/mouse/touch_handler"));
    add("editor-constructor.min.js", "ace/editor", balanced('if(typeof autojs!="undefined"){var i=function()', editorStart), "Editor constructor tail; `this` is the editor, `w`/`E` are the action mode names");
    add("editor-prototype.min.js", "ace/editor", balanced('if(typeof autojs!="undefined"){var e=null;this.actionMode', editorStart), "Editor.prototype tail; `this` is Editor.prototype, `w`/`E` are the action mode names");
    add("editor-action-mode-names.min.js", "ace/editor", exact('w="selectionActionMode",E="noSelectionActionMode"', editorStart));
    add("virtual_renderer-get-client-position.min.js", "ace/virtual_renderer", balanced("this.getClientPosition=function(e){"));
    add("mouse_handler-magnifier-option.min.js", "ace/mouse/mouse_handler", exact("magnifierEnabled:{initialValue:!1}"));
    add("mouse_handler-touch-listeners-call.min.js", "ace/mouse/mouse_handler", exact("f(e.container,e,this)"), "passes the MouseHandler as third argument");
    add("mouse_handler-mobile-focus.min.js", "ace/mouse/mouse_handler", exact('i.isMobile||(r.addListener(u,"mousedown",n,e),r.addListener(l,"mousedown",n,e))'));
    add("default_handlers-mobile.min.js", "ace/mouse/default_handlers", exact('r.isMobile||(t.setDefaultHandler("mousedown",this.onMouseDown.bind(e)),t.setDefaultHandler("dblclick",this.onDoubleClick.bind(e)),t.setDefaultHandler("tripleclick",this.onTripleClick.bind(e)),t.setDefaultHandler("quadclick",this.onQuadClick.bind(e)))'));
    add("textinput-context-menu.min.js", "ace/keyboard/textinput", exact("this.onContextMenu=function(e){e.preventDefault()}"));
    add("default_gutter_handler-touchscroll-on.min.js", "ace/mouse/default_gutter_handler", exact('t.on("touchscroll",c)'));
    add("default_gutter_handler-touchscroll-off.min.js", "ace/mouse/default_gutter_handler", exact('t.off("touchscroll",c)'));
    add("event-modifier-hash.min.js", "ace/lib/event", exact("var p=function(e){var t=e.shiftKey||s[16],n=e.ctrlKey||s[17],r=e.altKey||s[18],i=e.metaKey||s[224]||s[91]||s[92];return 0|(n?1:0)|(r?2:0)|(t?4:0)|(i?8:0)}"), "`s` is the pressedKeys map maintained by addCommandKeyListener");
    const fontStackAnchor = exact("CONSOLA")[0];
    add("virtual_renderer-font-stack.min.js", "ace/virtual_renderer", [text.lastIndexOf("font: 12px/normal ", fontStackAnchor), exact("monospace;", fontStackAnchor)[1]]);
    return slices;
}

function main() {
    const options = parseArguments(process.argv.slice(2));
    const { commit, bytes } = readGitBlob(options.commit);
    const slices = locateSlices(bytes.toString("latin1"));
    fs.rmSync(options.outDir, { recursive: true, force: true });
    fs.mkdirSync(options.outDir, { recursive: true });
    for (const slice of slices) {
        const content = bytes.subarray(slice.offset, slice.offset + slice.length);
        fs.writeFileSync(path.join(options.outDir, slice.file), content);
        slice.sha256 = sha256(content);
    }
    const manifest = {
        source: { path: SOURCE_PATH, commit, bytes: bytes.length, sha256: sha256(bytes), lineEndings: "LF (Git blob)" },
        slices,
    };
    fs.writeFileSync(path.join(options.outDir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
    console.log(`Extracted ${slices.length} slices from ${commit.slice(0, 12)}:${SOURCE_PATH} (sha256 ${manifest.source.sha256})`);
}

main();
