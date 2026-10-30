#!/usr/bin/env node

// Builds app/src/main/assets/java/autojs6/jvm-entry-api.jar, the second ECJ classpath entry: the AutoJs6 JVM Entry API
// types a Java Runtime script reaches from AutoJsJvmEntry, copied byte for byte from the frozen
// protocol/jvm-source-api.aar of AutoJs6-Plugin-Java-Runtime (Entry API 4) into a stored ZIP with the deterministic
// 1980-01-01 timestamp. AutoJs6 tools/api-coverage/language_runtimes.py checks the jar against the plugin's API list.
//
//   node tools/ace-lsp/build-jvm-entry-api-jar.mjs [--aar <jvm-source-api.aar>]          rewrite jar and manifest
//   node tools/ace-lsp/build-jvm-entry-api-jar.mjs --check [--aar <jvm-source-api.aar>]  compare (skipped without the AAR)

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = path.resolve(SCRIPT_DIR, "..", "..");
const OUTPUT_DIR = path.join(REPOSITORY_ROOT, "app", "src", "main", "assets", "java", "autojs6");
const JAR_FILE = "jvm-entry-api.jar";
const DEFAULT_AAR = path.resolve(REPOSITORY_ROOT, "..", "AutoJs6-Plugin-Java-Runtime", "protocol", "jvm-source-api.aar");
const PACKAGE = "org/autojs/plugin/jvmsource/api/";
const ENTRY_API_LEVEL = 4;
const ENTRY_API_TYPES = [
    "AutoJsJvmEntry",
    "JvmAppApi",
    "JvmCancellation",
    "JvmCancellationException",
    "JvmClipboardApi",
    "JvmConsoleApi",
    "JvmScriptContext",
];

function sha256(content) {
    return crypto.createHash("sha256").update(content).digest("hex");
}

function readZip(buffer) {
    const end = buffer.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
    if (end < 0) throw new Error("ZIP end of central directory is missing");
    const entries = new Map();
    let offset = buffer.readUInt32LE(end + 16);
    for (let index = buffer.readUInt16LE(end + 10); index > 0; index -= 1) {
        const method = buffer.readUInt16LE(offset + 10);
        const compressedBytes = buffer.readUInt32LE(offset + 20);
        const nameBytes = buffer.readUInt16LE(offset + 28);
        const local = buffer.readUInt32LE(offset + 42);
        const name = buffer.toString("utf8", offset + 46, offset + 46 + nameBytes);
        const start = local + 30 + buffer.readUInt16LE(local + 26) + buffer.readUInt16LE(local + 28);
        const data = buffer.subarray(start, start + compressedBytes);
        entries.set(name, method === 8 ? zlib.inflateRawSync(data) : Buffer.from(data));
        offset += 46 + nameBytes + buffer.readUInt16LE(offset + 30) + buffer.readUInt16LE(offset + 32);
    }
    return entries;
}

function writeZip(files) {
    const locals = [];
    const centrals = [];
    let offset = 0;
    for (const [name, data] of files) {
        const nameBytes = Buffer.from(name, "utf8");
        const crc = zlib.crc32(data);
        const local = Buffer.alloc(30);
        local.writeUInt32LE(0x04034b50, 0);
        local.writeUInt16LE(10, 4);
        local.writeUInt16LE(0x21, 12);
        local.writeUInt32LE(crc, 14);
        local.writeUInt32LE(data.length, 18);
        local.writeUInt32LE(data.length, 22);
        local.writeUInt16LE(nameBytes.length, 26);
        const central = Buffer.alloc(46);
        central.writeUInt32LE(0x02014b50, 0);
        central.writeUInt16LE(10, 4);
        central.writeUInt16LE(10, 6);
        central.writeUInt16LE(0x21, 14);
        central.writeUInt32LE(crc, 16);
        central.writeUInt32LE(data.length, 20);
        central.writeUInt32LE(data.length, 24);
        central.writeUInt16LE(nameBytes.length, 28);
        central.writeUInt32LE(offset, 42);
        locals.push(local, nameBytes, data);
        centrals.push(central, nameBytes);
        offset += local.length + nameBytes.length + data.length;
    }
    const directory = Buffer.concat(centrals);
    const end = Buffer.alloc(22);
    end.writeUInt32LE(0x06054b50, 0);
    end.writeUInt16LE(files.length, 8);
    end.writeUInt16LE(files.length, 10);
    end.writeUInt32LE(directory.length, 12);
    end.writeUInt32LE(offset, 16);
    return Buffer.concat([...locals, directory, end]);
}

function build(aarFile) {
    const aar = fs.readFileSync(aarFile);
    const classes = readZip(readZip(aar).get("classes.jar"));
    const files = ENTRY_API_TYPES.map((type) => {
        const name = `${PACKAGE}${type}.class`;
        if (!classes.has(name)) throw new Error(`${aarFile} lacks ${name}`);
        return [name, classes.get(name)];
    });
    const jar = writeZip(files);
    const manifest = {
        schemaVersion: 1,
        generator: "tools/ace-lsp/build-jvm-entry-api-jar.mjs",
        entryApiLevel: ENTRY_API_LEVEL,
        source: {
            repository: "AutoJs6-Plugin-Java-Runtime",
            path: "protocol/jvm-source-api.aar",
            sha256: sha256(aar),
        },
        classpathFile: JAR_FILE,
        classpathBytes: jar.length,
        classpathSha256: sha256(jar),
        classes: files.map(([name]) => name),
    };
    return { jar, manifest: `${JSON.stringify(manifest, null, 2)}\n` };
}

const argv = process.argv.slice(2);
const check = argv.includes("--check");
const aarIndex = argv.indexOf("--aar");
const aarFile = aarIndex >= 0 ? path.resolve(argv[aarIndex + 1] || "") : DEFAULT_AAR;
if (!fs.existsSync(aarFile)) {
    if (!check) throw new Error(`Java Runtime AAR is missing: ${aarFile}`);
    process.stdout.write(`JVM Entry API jar check skipped (no ${aarFile})\n`);
} else {
    const { jar, manifest } = build(aarFile);
    const jarFile = path.join(OUTPUT_DIR, JAR_FILE);
    const manifestFile = path.join(OUTPUT_DIR, "manifest.json");
    if (check) {
        if (!fs.existsSync(jarFile) || !fs.readFileSync(jarFile).equals(jar) || fs.readFileSync(manifestFile, "utf8") !== manifest) {
            throw new Error(`${path.relative(REPOSITORY_ROOT, jarFile)} is stale; run tools/ace-lsp/build-jvm-entry-api-jar.mjs`);
        }
        process.stdout.write(`JVM Entry API jar current (${jar.length} bytes)\n`);
    } else {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
        fs.writeFileSync(jarFile, jar);
        fs.writeFileSync(manifestFile, manifest, "utf8");
        process.stdout.write(manifest);
    }
}
