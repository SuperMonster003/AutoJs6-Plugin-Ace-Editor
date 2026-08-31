#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "..", "..");

function option(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

function sha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function walkFiles(root, current = root) {
  const result = [];
  for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
    const absolute = path.join(current, entry.name);
    if (entry.isDirectory()) {
      result.push(...walkFiles(root, absolute));
    } else if (entry.isFile()) {
      result.push(path.relative(root, absolute).split(path.sep).join("/"));
    }
  }
  return result.sort((left, right) => left.localeCompare(right, "en"));
}

function fileRecord(root, relativePath) {
  const content = fs.readFileSync(path.join(root, ...relativePath.split("/")));
  return {
    path: relativePath,
    bytes: content.length,
    sha256: sha256(content),
  };
}

function inventoryFingerprint(files) {
  const hash = crypto.createHash("sha256");
  hash.update("autojs6.luals.runtime.inventory.v1\n", "ascii");
  for (const file of files) {
    hash.update(file.path, "utf8");
    hash.update("\0", "ascii");
    hash.update(String(file.bytes), "ascii");
    hash.update("\0", "ascii");
    hash.update(file.sha256, "ascii");
    hash.update("\n", "ascii");
  }
  return hash.digest("hex");
}

const lockPath = path.resolve(option(
  "--lock",
  path.join(scriptDirectory, "luals-build-lock.json"),
));
const assetRoot = path.resolve(option(
  "--asset-root",
  path.join(repositoryRoot, "app", "src", "main", "assets", "luals"),
));
const jniRoot = path.resolve(option(
  "--jni-root",
  path.join(repositoryRoot, "app", "src", "main", "jniLibs"),
));
const outputPath = path.resolve(option("--out", path.join(assetRoot, "manifest.json")));
const check = process.argv.includes("--check");

const lock = JSON.parse(fs.readFileSync(lockPath, "utf8"));
const runtimeRoot = path.join(assetRoot, "runtime");
const runtimeFiles = walkFiles(runtimeRoot).map((relativePath) =>
  fileRecord(runtimeRoot, relativePath));
const runtimeBytes = runtimeFiles.reduce((total, file) => total + file.bytes, 0);

const nativeLibraries = {};
for (const [abi, expected] of Object.entries(lock.abis)) {
  const relativePath = `${abi}/libautojs6_luals.so`;
  const actual = fileRecord(jniRoot, relativePath);
  if (actual.bytes !== expected.bytes || actual.sha256 !== expected.sha256) {
    throw new Error(
      `${relativePath} does not match luals-build-lock.json: ` +
      `${actual.bytes}/${actual.sha256}`,
    );
  }
  nativeLibraries[abi] = {
    path: relativePath,
    bytes: actual.bytes,
    sha256: actual.sha256,
    elfClass: expected.elfClass,
    elfMachine: expected.elfMachine,
  };
}

const license = fileRecord(assetRoot, "THIRD_PARTY_LICENSES.txt");
const manifest = {
  schemaRevision: 1,
  providerId: lock.providerId,
  version: lock.version,
  source: {
    repository: lock.repository,
    tagObject: lock.tagObject,
    commit: lock.commit,
  },
  toolchain: lock.toolchain,
  runtime: {
    root: "runtime",
    fileCount: runtimeFiles.length,
    bytes: runtimeBytes,
    sha256: inventoryFingerprint(runtimeFiles),
    files: runtimeFiles,
  },
  nativeLibraries,
  license,
};
const serialized = `${JSON.stringify(manifest, null, 2)}\n`;

if (check) {
  const current = fs.readFileSync(outputPath, "utf8");
  if (current !== serialized) {
    throw new Error(
      `${path.relative(repositoryRoot, outputPath)} is stale; run ` +
      "node tools/ace-lsp/generate-luals-manifest.mjs",
    );
  }
  process.stdout.write(
    `LuaLS manifest verified: ${runtimeFiles.length} runtime files, ` +
    `${runtimeBytes} bytes, ${Object.keys(nativeLibraries).length} ABIs.\n`,
  );
} else {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, serialized);
  process.stdout.write(`Wrote ${path.relative(repositoryRoot, outputPath)}.\n`);
}
