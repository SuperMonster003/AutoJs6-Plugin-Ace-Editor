#!/usr/bin/env node

// Locks the bundled Ace distribution (Roadmap-Ace-1.44.0.md A6-1).
//
//   node tools/ace-lsp/ace-builds-lock.mjs --write             regenerate tools/ace-lsp/ace-builds-lock.json
//   node tools/ace-lsp/ace-builds-lock.mjs [--check]           compare the asset files with the lock (offline)
//   node tools/ace-lsp/ace-builds-lock.mjs --check --upstream  also compare upstream files with the npm tarball
//
// Every file under src-min-noconflict/ plus LICENSE is listed with its size and SHA-256. Files whose bytes equal the
// pinned ace-builds tarball have origin "upstream"; the others must be listed in PROJECT_FILES. The JVM test
// AceDistributionLockTest checks the same lock during :app:testDebugUnitTest.

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { ACE_UPSTREAM_PINS, fetchAceUpstream } from "./fetch-ace-upstream.mjs";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = path.resolve(SCRIPT_DIR, "..", "..");
const ACE_VERSION = "1.44.0";
const ASSET_ROOT = `app/src/main/assets/editor/ace-builds-${ACE_VERSION}`;
const LOCK_PATH = path.join(SCRIPT_DIR, "ace-builds-lock.json");
const DISTRIBUTION_DIRECTORY = "src-min-noconflict";

// Files that intentionally differ from (or are absent in) the pinned tarball.
const PROJECT_FILES = Object.freeze({
    "src-min-noconflict/snippets/kotlin.js": "AutoJs6 Kotlin snippets (upstream Kotlin snippets are empty)",
    "src-min-noconflict/snippets/python.js": "AutoJs6 Python 3 snippets (upstream still uses Python 2 syntax)",
    "src-min-noconflict/theme-visual_studio.js": "AutoJs6 theme, not part of any ace-builds release",
    "src-min-noconflict/theme-visual_studio_dark.js": "AutoJs6 theme, not part of any ace-builds release",
});

function fail(message) {
    throw new Error(`[ace-builds lock] ${message}`);
}

function sha256(content) {
    return crypto.createHash("sha256").update(content).digest("hex");
}

function listAssetFiles(assetRoot) {
    const files = ["LICENSE"];
    const walk = (relative) => {
        for (const entry of fs.readdirSync(path.join(assetRoot, relative), { withFileTypes: true })) {
            const child = `${relative}/${entry.name}`;
            if (entry.isDirectory()) walk(child);
            else if (entry.isFile()) files.push(child);
        }
    };
    walk(DISTRIBUTION_DIRECTORY);
    return files.sort((left, right) => (left < right ? -1 : left > right ? 1 : 0));
}

function readAsset(assetRoot, relative) {
    return fs.readFileSync(path.join(assetRoot, ...relative.split("/")));
}

function formatLock(lock) {
    // One file per line so that the JVM test can read the lock without a JSON library.
    const header = JSON.stringify({ schemaRevision: lock.schemaRevision, upstream: lock.upstream, assetRoot: lock.assetRoot }, null, 2);
    const files = lock.files.map((file) => `    ${JSON.stringify(file)}`).join(",\n");
    return `${header.slice(0, -2)},\n  "files": [\n${files}\n  ]\n}\n`;
}

async function writeLock(assetRoot) {
    const upstream = await fetchAceUpstream(ACE_VERSION);
    const files = listAssetFiles(assetRoot).map((relative) => {
        const content = readAsset(assetRoot, relative);
        const upstreamFile = path.join(upstream.extractDir, ...relative.split("/"));
        const identical = fs.existsSync(upstreamFile) && fs.readFileSync(upstreamFile).equals(content);
        const record = { path: relative, bytes: content.length, sha256: sha256(content) };
        if (identical) {
            if (PROJECT_FILES[relative]) fail(`${relative} is listed as a project file but equals the tarball`);
            record.origin = "upstream";
        } else if (PROJECT_FILES[relative]) {
            record.origin = "project";
            record.note = PROJECT_FILES[relative];
        } else {
            fail(`${relative} differs from ace-builds@${ACE_VERSION} and is not a project file`);
        }
        return record;
    });
    for (const relative of Object.keys(PROJECT_FILES)) {
        if (!files.some((file) => file.path === relative)) fail(`project file ${relative} is missing`);
    }
    const pin = ACE_UPSTREAM_PINS[ACE_VERSION];
    const lock = {
        schemaRevision: 1,
        upstream: {
            package: "ace-builds",
            version: ACE_VERSION,
            tarball: pin.tarball,
            shasum: pin.shasum,
            integrity: pin.integrity,
            directory: DISTRIBUTION_DIRECTORY,
        },
        assetRoot: ASSET_ROOT,
        files,
    };
    fs.writeFileSync(LOCK_PATH, formatLock(lock));
    const upstreamCount = files.filter((file) => file.origin === "upstream").length;
    console.log(`Wrote ${path.relative(REPOSITORY_ROOT, LOCK_PATH)}: ${files.length} files (${upstreamCount} upstream)`);
}

async function checkLock(assetRoot, compareUpstream) {
    const lock = JSON.parse(fs.readFileSync(LOCK_PATH, "utf8"));
    if (lock.schemaRevision !== 1) fail(`unsupported schemaRevision ${lock.schemaRevision}`);
    if (lock.upstream.version !== ACE_VERSION) fail(`lock is for ${lock.upstream.version}, expected ${ACE_VERSION}`);
    const actual = listAssetFiles(assetRoot);
    const locked = lock.files.map((file) => file.path);
    const missing = locked.filter((relative) => !actual.includes(relative));
    const extra = actual.filter((relative) => !locked.includes(relative));
    if (missing.length) fail(`missing files: ${missing.join(", ")}`);
    if (extra.length) fail(`files not in the lock: ${extra.join(", ")}`);
    for (const file of lock.files) {
        const content = readAsset(assetRoot, file.path);
        if (content.length !== file.bytes || sha256(content) !== file.sha256) {
            const crlf = content.includes(Buffer.from("\r\n")) ? " (contains CRLF; check .gitattributes and core.autocrlf)" : "";
            fail(`${file.path} does not match the lock${crlf}`);
        }
    }
    let upstreamChecked = 0;
    if (compareUpstream) {
        const upstream = await fetchAceUpstream(ACE_VERSION);
        for (const file of lock.files.filter((record) => record.origin === "upstream")) {
            const upstreamFile = path.join(upstream.extractDir, ...file.path.split("/"));
            if (!fs.existsSync(upstreamFile) || !fs.readFileSync(upstreamFile).equals(readAsset(assetRoot, file.path))) {
                fail(`${file.path} is marked upstream but differs from ace-builds@${ACE_VERSION}`);
            }
            upstreamChecked++;
        }
    }
    console.log(
        `ace-builds@${ACE_VERSION} lock verified: ${lock.files.length} files` +
            (compareUpstream ? `, ${upstreamChecked} compared with the npm tarball` : ""),
    );
}

async function main() {
    const argv = process.argv.slice(2);
    let assetRoot = path.join(REPOSITORY_ROOT, ...ASSET_ROOT.split("/"));
    let mode = "check";
    let compareUpstream = false;
    for (let index = 0; index < argv.length; index++) {
        const argument = argv[index];
        if (argument === "--write") mode = "write";
        else if (argument === "--check") mode = "check";
        else if (argument === "--upstream") compareUpstream = true;
        else if (argument === "--asset-root") assetRoot = path.resolve(argv[++index] || "");
        else fail(`Unknown argument: ${argument}`);
    }
    if (mode === "write") await writeLock(assetRoot);
    else await checkLock(assetRoot, compareUpstream);
}

main().catch((error) => {
    console.error(error.message || error);
    process.exitCode = 1;
});
