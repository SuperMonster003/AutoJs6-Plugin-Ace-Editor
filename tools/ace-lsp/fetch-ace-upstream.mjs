#!/usr/bin/env node

// Downloads a pinned ace-builds npm tarball, verifies its shasum and integrity,
// and unpacks it into build/ace-upstream/<version>/ (not tracked by Git).
//
// Usage: node tools/ace-lsp/fetch-ace-upstream.mjs <version> [--out-root <dir>] [--force]

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = path.resolve(SCRIPT_DIR, "..", "..");
const DEFAULT_OUT_ROOT = path.join(REPOSITORY_ROOT, "build", "ace-upstream");

// Pins copied from `npm view ace-builds@<version> dist` (2026-10-13).
export const ACE_UPSTREAM_PINS = Object.freeze({
    "1.4.12": Object.freeze({
        tarball: "https://registry.npmjs.org/ace-builds/-/ace-builds-1.4.12.tgz",
        shasum: "888efa386e36f4345f40b5233fcc4fe4c588fae7",
        integrity: "sha512-G+chJctFPiiLGvs3+/Mly3apXTcfgE45dT5yp12BcWZ1kUs+gm0qd3/fv4gsz6fVag4mM0moHVpjHDIgph6Psg==",
        fileCount: 1712,
    }),
    "1.44.0": Object.freeze({
        tarball: "https://registry.npmjs.org/ace-builds/-/ace-builds-1.44.0.tgz",
        shasum: "d657730f665fccf72d2945d95887e12c514a29f1",
        integrity: "sha512-PFNMSYqFdEUkul2Ntud0HvA09AgY+F1ag0UYdpMH60wNI/qOA8cB8tlTgoALMEwIdUPJK2CjrIQ7OnbiSS/ugQ==",
        fileCount: 2151,
    }),
});

function fail(message) {
    throw new Error(`[ace upstream] ${message}`);
}

function parseArguments(argv) {
    const result = { version: "", outRoot: DEFAULT_OUT_ROOT, force: false };
    for (let index = 0; index < argv.length; index += 1) {
        const argument = argv[index];
        if (argument === "--out-root") {
            result.outRoot = path.resolve(argv[++index] || "");
        } else if (argument === "--force") {
            result.force = true;
        } else if (!argument.startsWith("--") && !result.version) {
            result.version = argument;
        } else {
            fail(`Unknown argument: ${argument}`);
        }
    }
    if (!result.version) fail("Missing <version>. Known: " + Object.keys(ACE_UPSTREAM_PINS).join(", "));
    if (!ACE_UPSTREAM_PINS[result.version]) {
        fail(`Version ${result.version} is not pinned. Known: ${Object.keys(ACE_UPSTREAM_PINS).join(", ")}`);
    }
    return result;
}

function digest(algorithm, content, encoding) {
    return crypto.createHash(algorithm).update(content).digest(encoding);
}

export function verifyTarball(version, content) {
    const pin = ACE_UPSTREAM_PINS[version];
    const shasum = digest("sha1", content, "hex");
    const integrity = "sha512-" + digest("sha512", content, "base64");
    if (shasum !== pin.shasum) fail(`shasum mismatch for ${version}: ${shasum} != ${pin.shasum}`);
    if (integrity !== pin.integrity) fail(`integrity mismatch for ${version}: ${integrity} != ${pin.integrity}`);
    return { shasum, integrity };
}

function readOctal(buffer, offset, length) {
    const text = buffer.toString("ascii", offset, offset + length).replace(/\0.*$/, "").trim();
    return text ? parseInt(text, 8) : 0;
}

function readString(buffer, offset, length) {
    return buffer.toString("utf8", offset, offset + length).replace(/\0.*$/, "");
}

// Minimal ustar/pax reader: npm tarballs only contain regular files and directories.
export function* readTarEntries(tarContent) {
    let offset = 0;
    let paxPath = null;
    while (offset + 512 <= tarContent.length) {
        const header = tarContent.subarray(offset, offset + 512);
        if (header.every((byte) => byte === 0)) break;
        const size = readOctal(header, 124, 12);
        const type = String.fromCharCode(header[156] || 48);
        const prefix = readString(header, 345, 155);
        let name = readString(header, 0, 100);
        if (prefix) name = prefix + "/" + name;
        const dataStart = offset + 512;
        const data = tarContent.subarray(dataStart, dataStart + size);
        offset = dataStart + Math.ceil(size / 512) * 512;
        if (type === "x") {
            const match = /\d+ path=([^\n]*)\n/.exec(data.toString("utf8"));
            paxPath = match ? match[1] : null;
            continue;
        }
        if (type === "g") continue;
        if (paxPath) {
            name = paxPath;
            paxPath = null;
        }
        if (type === "0" || type === "\0") {
            yield { name, data };
        }
    }
}

function safeJoin(root, relativePath) {
    const target = path.resolve(root, relativePath);
    if (target !== root && !target.startsWith(root + path.sep)) fail(`Unsafe tar entry path: ${relativePath}`);
    return target;
}

async function downloadTarball(url) {
    const response = await fetch(url);
    if (!response.ok) fail(`Download failed: ${url} -> HTTP ${response.status}`);
    return Buffer.from(await response.arrayBuffer());
}

export async function fetchAceUpstream(version, { outRoot = DEFAULT_OUT_ROOT, force = false } = {}) {
    const pin = ACE_UPSTREAM_PINS[version];
    if (!pin) fail(`Version ${version} is not pinned`);
    fs.mkdirSync(outRoot, { recursive: true });
    const tarballPath = path.join(outRoot, `ace-builds-${version}.tgz`);
    const extractDir = path.join(outRoot, version);
    const stampPath = path.join(extractDir, ".ace-upstream.json");

    let content = null;
    if (!force && fs.existsSync(tarballPath)) {
        content = fs.readFileSync(tarballPath);
        try {
            verifyTarball(version, content);
        } catch (error) {
            console.warn(`Cached tarball is invalid, downloading again: ${error.message}`);
            content = null;
        }
    }
    let downloaded = false;
    if (!content) {
        content = await downloadTarball(pin.tarball);
        downloaded = true;
    }
    const verified = verifyTarball(version, content);
    if (downloaded) fs.writeFileSync(tarballPath, content);

    if (!force && fs.existsSync(stampPath)) {
        const stamp = JSON.parse(fs.readFileSync(stampPath, "utf8"));
        if (stamp.shasum === verified.shasum && stamp.fileCount === pin.fileCount) {
            return { version, extractDir, tarballPath, ...verified, fileCount: stamp.fileCount, reused: true };
        }
    }

    fs.rmSync(extractDir, { recursive: true, force: true });
    fs.mkdirSync(extractDir, { recursive: true });
    const tarContent = zlib.gunzipSync(content);
    let fileCount = 0;
    for (const entry of readTarEntries(tarContent)) {
        // npm packs everything under "package/".
        const relativePath = entry.name.replace(/^package\//, "");
        if (!relativePath || relativePath === entry.name) fail(`Unexpected tar entry outside package/: ${entry.name}`);
        const target = safeJoin(extractDir, relativePath);
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.writeFileSync(target, entry.data);
        fileCount += 1;
    }
    if (fileCount !== pin.fileCount) fail(`File count mismatch for ${version}: ${fileCount} != ${pin.fileCount}`);
    fs.writeFileSync(stampPath, JSON.stringify({
        version,
        tarball: pin.tarball,
        shasum: verified.shasum,
        integrity: verified.integrity,
        fileCount,
    }, null, 2) + "\n");
    return { version, extractDir, tarballPath, ...verified, fileCount, reused: false };
}

async function main() {
    const options = parseArguments(process.argv.slice(2));
    const result = await fetchAceUpstream(options.version, options);
    console.log(`ace-builds@${result.version}`);
    console.log(`  tarball:   ${path.relative(REPOSITORY_ROOT, result.tarballPath)}`);
    console.log(`  shasum:    ${result.shasum} (verified)`);
    console.log(`  integrity: ${result.integrity} (verified)`);
    console.log(`  files:     ${result.fileCount}${result.reused ? " (reused extraction)" : ""}`);
    console.log(`  extracted: ${path.relative(REPOSITORY_ROOT, result.extractDir)}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    main().catch((error) => {
        console.error(error.message || error);
        process.exitCode = 1;
    });
}
