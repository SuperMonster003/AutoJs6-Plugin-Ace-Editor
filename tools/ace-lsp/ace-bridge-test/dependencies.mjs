// Installs the dependencies pinned by package-lock.json in this directory (jsdom, TypeScript) under
// build/ace-bridge-test/<lock hash> with `npm ci --ignore-scripts` and returns a require() rooted there.
// Used by tools/ace-lsp/verify-ace-bridge.mjs and tools/ace-lsp/typecheck-ace-bridge.mjs; node_modules is never
// committed. Network access is needed once per lock change.

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const DEPENDENCY_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = path.resolve(DEPENDENCY_DIR, "..", "..", "..");
const CACHE_ROOT = path.join(REPOSITORY_ROOT, "build", "ace-bridge-test");

function run(command, args, cwd) {
    const result = spawnSync(command, args, { cwd, encoding: "utf8", shell: false, stdio: ["ignore", "pipe", "pipe"] });
    if (result.error) throw result.error;
    if (result.status !== 0) {
        throw new Error(`${command} ${args.join(" ")} exited with status ${result.status}\n${result.stdout}\n${result.stderr}`);
    }
}

function runNpm(args, cwd) {
    if (process.platform === "win32") {
        const npmCli = path.join(path.dirname(process.execPath), "node_modules", "npm", "bin", "npm-cli.js");
        if (fs.existsSync(npmCli)) {
            run(process.execPath, [npmCli, ...args], cwd);
            return;
        }
    }
    run("npm", args, cwd);
}

export function loadAceBridgeTestDependencies() {
    const lock = fs.readFileSync(path.join(DEPENDENCY_DIR, "package-lock.json"));
    const manifest = fs.readFileSync(path.join(DEPENDENCY_DIR, "package.json"));
    // Line endings depend on the checkout, so hash the normalized text.
    const normalize = (buffer) => buffer.toString("utf8").replace(/\r\n/g, "\n");
    const hash = crypto.createHash("sha256").update(normalize(manifest)).update(normalize(lock)).digest("hex").slice(0, 16);
    const installDir = path.join(CACHE_ROOT, hash);
    const marker = path.join(installDir, ".installed");
    if (!fs.existsSync(marker)) {
        fs.rmSync(installDir, { recursive: true, force: true });
        fs.mkdirSync(installDir, { recursive: true });
        fs.writeFileSync(path.join(installDir, "package.json"), manifest);
        fs.writeFileSync(path.join(installDir, "package-lock.json"), lock);
        console.log(`[ace bridge] installing pinned dependencies into ${path.relative(REPOSITORY_ROOT, installDir)}`);
        runNpm(["ci", "--ignore-scripts", "--no-audit", "--no-fund"], installDir);
        fs.writeFileSync(marker, "");
    }
    return createRequire(path.join(installDir, "package.json"));
}
