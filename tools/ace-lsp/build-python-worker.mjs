#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = path.resolve(SCRIPT_DIR, "..", "..");
const TEMPLATE_DIR = path.join(SCRIPT_DIR, "python-worker");
const DEFAULT_OUTPUT_DIR = path.join(
    REPOSITORY_ROOT,
    "app",
    "src",
    "main",
    "assets",
    "editor",
    "ace-builds-1.4.12",
    "autojs6",
    "python",
);

const PYRIGHT_VERSION = "1.1.413";
const PYRIGHT_COMMIT = "789d8275fef25f347ffef7b847305fefd8a3e363";
const TYPESHED_COMMIT = "289e5d3568961c8bcd33d01eef5b7ec5e1ad33ad";
const PYTHON_VERSION = "3.12";
const BUFFER_VERSION = "6.0.3";
const PATH_BROWSERIFY_VERSION = "1.0.1";
const MAX_BUNDLED_SEMANTIC_ASSET_BYTES = 8 * 1024 * 1024;
const THIRD_PARTY_LICENSES_FILE = "THIRD_PARTY_LICENSES.txt";
const WORKER_ECMA_VERSION = "ES2022";
const WORKER_SYNTAX_FEATURES = [
    "public-class-fields",
    "optional-chaining",
    "nullish-coalescing",
];
const RUNTIME_DEPENDENCIES = [
    ["base64-js", "1.5.1"],
    ["buffer", BUFFER_VERSION],
    ["ieee754", "1.2.1"],
    ["jsonc-parser", "3.3.1"],
    ["path-browserify", PATH_BROWSERIFY_VERSION],
    ["smol-toml", "1.6.1"],
    ["vscode-jsonrpc", "9.0.0-next.11"],
    ["vscode-languageserver", "10.0.0-next.17"],
    ["vscode-languageserver-protocol", "3.17.6-next.17"],
    ["vscode-languageserver-textdocument", "1.0.12"],
    ["vscode-languageserver-types", "3.17.6-next.6"],
    ["vscode-uri", "3.1.0"],
];

// Matches the Python modules deliberately exposed by the M2 static index. The
// generator adds every top-level typeshed dependency imported by these roots.
const SELECTED_STDLIB_ROOTS = [
    "asyncio",
    "base64",
    "builtins",
    "collections",
    "csv",
    "datetime",
    "decimal",
    "fnmatch",
    "functools",
    "glob",
    "hashlib",
    "http",
    "itertools",
    "json",
    "logging",
    "math",
    "os",
    "pathlib",
    "random",
    "re",
    "shutil",
    "socket",
    "sqlite3",
    "statistics",
    "subprocess",
    "sys",
    "tempfile",
    "threading",
    "time",
    "typing",
    "typing_extensions",
    "urllib",
    "_typeshed",
];

function parseArguments(argv) {
    const result = { pyrightDir: "", outputDir: DEFAULT_OUTPUT_DIR, keepCheckout: false };
    for (let index = 0; index < argv.length; index += 1) {
        const argument = argv[index];
        if (argument === "--pyright-dir") {
            result.pyrightDir = path.resolve(argv[++index] || "");
        } else if (argument === "--out-dir") {
            result.outputDir = path.resolve(argv[++index] || "");
        } else if (argument === "--keep-checkout") {
            result.keepCheckout = true;
        } else {
            throw new Error(`Unknown argument: ${argument}`);
        }
    }
    return result;
}

function run(command, args, cwd) {
    const result = spawnSync(command, args, {
        cwd,
        encoding: "utf8",
        shell: false,
        stdio: ["ignore", "pipe", "pipe"],
    });
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
    if (result.error) throw result.error;
    if (result.status !== 0) {
        throw new Error(`${command} exited with status ${result.status}`);
    }
}

function runNpm(args, cwd) {
    if (process.platform === "win32") {
        const npmCli = path.join(
            path.dirname(process.execPath),
            "node_modules",
            "npm",
            "bin",
            "npm-cli.js",
        );
        if (fs.existsSync(npmCli)) {
            run(process.execPath, [npmCli, ...args], cwd);
            return;
        }
    }
    run("npm", args, cwd);
}

function sha256(content) {
    return crypto.createHash("sha256").update(content).digest("hex");
}

function normalizeText(content) {
    return String(content).replace(/\r\n/g, "\n").trimEnd();
}

function resolvePackageDirectory(root, pyrightDir, packageName) {
    const packageSegments = packageName.split("/");
    const candidates = [
        path.join(pyrightDir, "node_modules", ...packageSegments),
        path.join(root, "packages", "pyright-internal", "node_modules", ...packageSegments),
        path.join(root, "node_modules", ...packageSegments),
    ];
    const found = candidates.find((candidate) =>
        fs.existsSync(path.join(candidate, "package.json"))
    );
    if (!found) throw new Error(`Cannot locate bundled runtime dependency ${packageName}`);
    return found;
}

function resolveLicenseFile(directory) {
    const licenseName = fs.readdirSync(directory)
        .filter((name) => /^(?:licen[cs]e|copying)(?:\.|$)/i.test(name))
        .sort((left, right) => left.localeCompare(right))[0];
    if (!licenseName) throw new Error(`Cannot locate a license file in ${directory}`);
    return path.join(directory, licenseName);
}

function createThirdPartyLicenseBundle(root, pyrightDir) {
    const typeshedDir = path.join(
        root,
        "packages",
        "pyright-internal",
        "typeshed-fallback",
    );
    const entries = [
        {
            name: "Pyright",
            version: PYRIGHT_VERSION,
            license: "MIT",
            source: `https://github.com/microsoft/pyright/tree/${PYRIGHT_COMMIT}`,
            licenseFile: path.join(root, "LICENSE.txt"),
        },
        {
            name: "typeshed",
            version: `commit ${TYPESHED_COMMIT}`,
            license: "Apache-2.0",
            source: `https://github.com/python/typeshed/tree/${TYPESHED_COMMIT}`,
            licenseFile: path.join(typeshedDir, "LICENSE"),
        },
    ];
    const runtimeDependencies = {};
    for (const [name, expectedVersion] of RUNTIME_DEPENDENCIES) {
        const directory = resolvePackageDirectory(root, pyrightDir, name);
        const metadata = JSON.parse(
            fs.readFileSync(path.join(directory, "package.json"), "utf8"),
        );
        if (metadata.version !== expectedVersion) {
            throw new Error(
                `Expected bundled ${name} ${expectedVersion}, found ${metadata.version}`,
            );
        }
        const license = String(metadata.license || "").trim();
        if (!license) throw new Error(`Bundled dependency ${name} has no license metadata`);
        runtimeDependencies[name] = expectedVersion;
        entries.push({
            name,
            version: expectedVersion,
            license,
            source: `https://www.npmjs.com/package/${name}/v/${expectedVersion}`,
            licenseFile: resolveLicenseFile(directory),
        });
    }

    const sections = [
        "AutoJs6 Ace Editor Plugin - Python semantic Worker third-party licenses",
        "",
        "This generated file accompanies the exact Pyright Worker shipped in the APK.",
        "It must be retained with redistributed copies of the Worker.",
    ];
    for (const entry of entries) {
        if (!fs.existsSync(entry.licenseFile)) {
            throw new Error(`Missing license file for ${entry.name}: ${entry.licenseFile}`);
        }
        sections.push(
            "",
            "================================================================================",
            `${entry.name} ${entry.version}`,
            `Source: ${entry.source}`,
            `License: ${entry.license}`,
            "--------------------------------------------------------------------------------",
            normalizeText(fs.readFileSync(entry.licenseFile, "utf8")),
        );
    }
    const content = `${sections.join("\n")}\n`;
    return {
        content,
        runtimeDependencies,
        components: entries.map(({ name, version, license, source }) => ({
            name,
            version,
            license,
            source,
        })),
    };
}

function walkFiles(root) {
    const files = [];
    const pending = [root];
    while (pending.length) {
        const directory = pending.pop();
        const entries = fs.readdirSync(directory, { withFileTypes: true })
            .sort((left, right) => left.name.localeCompare(right.name));
        for (const entry of entries) {
            const target = path.join(directory, entry.name);
            if (entry.isDirectory()) pending.push(target);
            else if (entry.isFile()) files.push(target);
        }
    }
    return files.sort((left, right) => left.localeCompare(right));
}

function relativePosix(root, file) {
    return path.relative(root, file).split(path.sep).join("/");
}

function topLevelRoot(relativePath) {
    const first = String(relativePath).split("/", 1)[0];
    return first.replace(/\.pyi$/i, "");
}

function importedTopLevelRoots(content) {
    const roots = new Set();
    const fromPattern = /^\s*from\s+([A-Za-z_]\w*)(?:\.[A-Za-z_]\w*)*\s+import\b/gm;
    const importPattern = /^\s*import\s+([^\r\n#]+)/gm;
    let match;
    while ((match = fromPattern.exec(content)) !== null) roots.add(match[1]);
    while ((match = importPattern.exec(content)) !== null) {
        String(match[1]).split(",").forEach((entry) => {
            const imported = /^\s*([A-Za-z_]\w*)/.exec(entry);
            if (imported) roots.add(imported[1]);
        });
    }
    return roots;
}

function createTypeshedPayload(stdlibDir) {
    const sourceFiles = walkFiles(stdlibDir).filter((file) => file.endsWith(".pyi"));
    const relativeFiles = sourceFiles.map((file) => relativePosix(stdlibDir, file));
    const availableRoots = new Set(relativeFiles.map(topLevelRoot));
    const selectedRoots = new Set(
        SELECTED_STDLIB_ROOTS.filter((root) => availableRoots.has(root)),
    );
    let changed = true;
    while (changed) {
        changed = false;
        for (let index = 0; index < sourceFiles.length; index += 1) {
            if (!selectedRoots.has(topLevelRoot(relativeFiles[index]))) continue;
            const content = fs.readFileSync(sourceFiles[index], "utf8");
            for (const importedRoot of importedTopLevelRoots(content)) {
                if (availableRoots.has(importedRoot) && !selectedRoots.has(importedRoot)) {
                    selectedRoots.add(importedRoot);
                    changed = true;
                }
            }
        }
    }

    const payload = {};
    const digest = crypto.createHash("sha256");
    for (let index = 0; index < sourceFiles.length; index += 1) {
        const relativePath = relativeFiles[index];
        if (!selectedRoots.has(topLevelRoot(relativePath))) continue;
        const content = fs.readFileSync(sourceFiles[index], "utf8").replace(/\r\n/g, "\n");
        const bundledPath = `stdlib/${relativePath}`;
        payload[bundledPath] = content;
        digest.update(bundledPath).update("\0").update(content).update("\0");
    }
    const versionsPath = path.join(stdlibDir, "VERSIONS");
    if (fs.existsSync(versionsPath)) {
        const content = fs.readFileSync(versionsPath, "utf8").replace(/\r\n/g, "\n");
        payload["stdlib/VERSIONS"] = content;
        digest.update("stdlib/VERSIONS\0").update(content).update("\0");
    }
    return {
        payload,
        selectedRoots: [...selectedRoots].sort(),
        sha256: digest.digest("hex"),
    };
}

function verifyCheckout(root) {
    const pyrightPackage = path.join(root, "packages", "pyright", "package.json");
    const typeshedCommit = path.join(
        root,
        "packages",
        "pyright-internal",
        "typeshed-fallback",
        "commit.txt",
    );
    if (!fs.existsSync(pyrightPackage) || !fs.existsSync(typeshedCommit)) {
        throw new Error(`Not a Pyright source checkout: ${root}`);
    }
    const version = JSON.parse(fs.readFileSync(pyrightPackage, "utf8")).version;
    if (version !== PYRIGHT_VERSION) {
        throw new Error(`Expected Pyright ${PYRIGHT_VERSION}, found ${version}`);
    }
    const actualTypeshedCommit = fs.readFileSync(typeshedCommit, "utf8").trim();
    if (actualTypeshedCommit !== TYPESHED_COMMIT) {
        throw new Error(
            `Expected typeshed ${TYPESHED_COMMIT}, found ${actualTypeshedCommit}`,
        );
    }
    if (fs.existsSync(path.join(root, ".git"))) {
        const result = spawnSync("git", ["rev-parse", "HEAD"], {
            cwd: root,
            encoding: "utf8",
            shell: false,
        });
        if (result.status !== 0 || result.stdout.trim() !== PYRIGHT_COMMIT) {
            throw new Error(`Pyright checkout is not pinned to ${PYRIGHT_COMMIT}`);
        }
    }
}

function acquireCheckout(explicitDirectory) {
    if (explicitDirectory) return { root: explicitDirectory, temporary: false };
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "autojs6-pyright-"));
    run(
        "git",
        [
            "clone",
            "--filter=blob:none",
            "--no-checkout",
            "https://github.com/microsoft/pyright.git",
            root,
        ],
        REPOSITORY_ROOT,
    );
    run("git", ["checkout", "--detach", PYRIGHT_COMMIT], root);
    return { root, temporary: true };
}

function prepareBuildSources(root, typeshed) {
    const pyrightDir = path.join(root, "packages", "pyright");
    const sourceDir = path.join(pyrightDir, "src");
    fs.copyFileSync(
        path.join(TEMPLATE_DIR, "autojs6-python-worker.ts"),
        path.join(sourceDir, "autojs6-python-worker.ts"),
    );
    fs.copyFileSync(
        path.join(TEMPLATE_DIR, "worker-threads-shim.ts"),
        path.join(sourceDir, "autojs6-worker-threads-shim.ts"),
    );
    fs.copyFileSync(
        path.join(TEMPLATE_DIR, "rspack.config.cjs"),
        path.join(pyrightDir, "rspack.autojs6-python.config.cjs"),
    );
    fs.writeFileSync(
        path.join(sourceDir, "autojs6-python-typeshed.json"),
        JSON.stringify(typeshed.payload),
        "utf8",
    );
    return pyrightDir;
}

function ensureBuildDependencies(root, pyrightDir) {
    const rspackPackage = path.join(pyrightDir, "node_modules", "@rspack", "core", "package.json");
    if (!fs.existsSync(rspackPackage)) {
        runNpm(["ci", "--ignore-scripts"], root);
    }
    runNpm(
        [
            "install",
            "--no-save",
            "--ignore-scripts",
            `buffer@${BUFFER_VERSION}`,
            `path-browserify@${PATH_BROWSERIFY_VERSION}`,
        ], pyrightDir,
    );
}

function build(root, outputDir) {
    verifyCheckout(root);
    const stdlibDir = path.join(
        root,
        "packages",
        "pyright-internal",
        "typeshed-fallback",
        "stdlib",
    );
    const typeshed = createTypeshedPayload(stdlibDir);
    const pyrightDir = prepareBuildSources(root, typeshed);
    ensureBuildDependencies(root, pyrightDir);
    const licenses = createThirdPartyLicenseBundle(root, pyrightDir);
    const rspack = path.join(pyrightDir, "node_modules", "@rspack", "cli", "bin", "rspack.js");
    run(
        process.execPath,
        [rspack, "build", "-c", "rspack.autojs6-python.config.cjs", "--mode", "production"],
        pyrightDir,
    );

    const generatedWorker = path.join(
        pyrightDir,
        "dist-autojs6-python",
        "autojs6-python-worker.js",
    );
    const worker = fs.readFileSync(generatedWorker);
    if (worker.length > MAX_BUNDLED_SEMANTIC_ASSET_BYTES) {
        throw new Error(
            `Python semantic Worker is ${worker.length} bytes; the 8 MiB bundled-asset gate requires optional delivery`,
        );
    }
    fs.mkdirSync(outputDir, { recursive: true });
    const workerOutput = path.join(outputDir, "autojs6-python-worker.js");
    fs.writeFileSync(workerOutput, worker);
    const licenseBytes = Buffer.from(licenses.content, "utf8");
    fs.writeFileSync(path.join(outputDir, THIRD_PARTY_LICENSES_FILE), licenseBytes);

    const manifest = {
        schemaVersion: 2,
        generator: "tools/ace-lsp/build-python-worker.mjs",
        pythonVersion: PYTHON_VERSION,
        pyrightVersion: PYRIGHT_VERSION,
        pyrightCommit: PYRIGHT_COMMIT,
        typeshedCommit: TYPESHED_COMMIT,
        typeshedScope: "builtins and the M2 selected standard-library roots plus their top-level import closure; no third-party stubs",
        selectedStdlibRoots: SELECTED_STDLIB_ROOTS,
        includedStdlibRoots: typeshed.selectedRoots,
        typeshedFileCount: Object.keys(typeshed.payload).length,
        typeshedContentSha256: typeshed.sha256,
        polyfills: {
            buffer: BUFFER_VERSION,
            pathBrowserify: PATH_BROWSERIFY_VERSION,
        },
        runtimeDependencies: licenses.runtimeDependencies,
        workerEcmaVersion: WORKER_ECMA_VERSION,
        workerSyntaxFeatures: WORKER_SYNTAX_FEATURES,
        workerFile: "autojs6-python-worker.js",
        workerBytes: worker.length,
        workerSha256: sha256(worker),
        thirdPartyLicenses: {
            file: THIRD_PARTY_LICENSES_FILE,
            bytes: licenseBytes.length,
            sha256: sha256(licenseBytes),
            components: licenses.components,
        },
        bundledAssetThresholdBytes: MAX_BUNDLED_SEMANTIC_ASSET_BYTES,
        optionalDeliveryRequired: false,
    };
    fs.writeFileSync(
        path.join(outputDir, "manifest.json"),
        `${JSON.stringify(manifest, null, 2)}\n`,
        "utf8",
    );
    process.stdout.write(`${JSON.stringify(manifest, null, 2)}\n`);
}

const options = parseArguments(process.argv.slice(2));
const checkout = acquireCheckout(options.pyrightDir);
try {
    build(checkout.root, options.outputDir);
} finally {
    if (checkout.temporary && !options.keepCheckout) {
        const resolved = path.resolve(checkout.root);
        const tempRoot = path.resolve(os.tmpdir());
        if (resolved.startsWith(`${tempRoot}${path.sep}`) && path.basename(resolved).startsWith("autojs6-pyright-")) {
            fs.rmSync(resolved, { recursive: true, force: true });
        }
    }
}
