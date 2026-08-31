#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import vm from "node:vm";
import { performance } from "node:perf_hooks";
import { TextDecoder, TextEncoder } from "node:util";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = path.resolve(SCRIPT_DIR, "..", "..");
const DEFAULT_ASSET_DIR = path.join(
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
const MAX_INITIALIZATION_MS = 10_000;
const MAX_COMPLETION_P50_MS = 500;
const MAX_RESIDENT_BYTES = 300 * 1024 * 1024;
const EXPECTED_RUNTIME_DEPENDENCIES = {
    "base64-js": "1.5.1",
    buffer: "6.0.3",
    ieee754: "1.2.1",
    "jsonc-parser": "3.3.1",
    "path-browserify": "1.0.1",
    "smol-toml": "1.6.1",
    "vscode-jsonrpc": "9.0.0-next.11",
    "vscode-languageserver": "10.0.0-next.17",
    "vscode-languageserver-protocol": "3.17.6-next.17",
    "vscode-languageserver-textdocument": "1.0.12",
    "vscode-languageserver-types": "3.17.6-next.6",
    "vscode-uri": "3.1.0",
};

function assert(condition, message) {
    if (!condition) throw new Error(message);
}

function round(value) {
    return Math.round(value * 100) / 100;
}

function sha256(content) {
    return crypto.createHash("sha256").update(content).digest("hex");
}

function parseAssetDir(argv) {
    if (argv.length === 0) return DEFAULT_ASSET_DIR;
    if (argv.length === 2 && argv[0] === "--asset-dir") return path.resolve(argv[1]);
    throw new Error("Usage: node verify-python-worker.mjs [--asset-dir <directory>]");
}

const assetDir = parseAssetDir(process.argv.slice(2));
const manifest = JSON.parse(fs.readFileSync(path.join(assetDir, "manifest.json"), "utf8"));
const workerBytes = fs.readFileSync(path.join(assetDir, manifest.workerFile));
const licenseBytes = fs.readFileSync(path.join(assetDir, manifest.thirdPartyLicenses?.file || ""));
assert(manifest.schemaVersion === 2, "Unexpected Python Worker manifest schema");
assert(manifest.pythonVersion === "3.12", "Python semantic version is not pinned to 3.12");
assert(manifest.pyrightVersion === "1.1.413", "Pyright version drifted");
assert(manifest.typeshedCommit === "289e5d3568961c8bcd33d01eef5b7ec5e1ad33ad", "typeshed revision drifted");
assert(manifest.workerEcmaVersion === "ES2022", "Python Worker ECMAScript target drifted");
assert(
    JSON.stringify(manifest.workerSyntaxFeatures) === JSON.stringify([
        "public-class-fields",
        "optional-chaining",
        "nullish-coalescing",
    ]),
    "Python Worker syntax-feature contract drifted",
);
assert(manifest.workerBytes === workerBytes.length, "Python Worker byte count does not match its manifest");
assert(manifest.workerSha256 === sha256(workerBytes), "Python Worker SHA-256 does not match its manifest");
assert(
    JSON.stringify(manifest.runtimeDependencies) === JSON.stringify(EXPECTED_RUNTIME_DEPENDENCIES),
    "Python Worker runtime dependency versions drifted",
);
assert(
    manifest.thirdPartyLicenses.bytes === licenseBytes.length,
    "Python Worker third-party license byte count does not match its manifest",
);
assert(
    manifest.thirdPartyLicenses.sha256 === sha256(licenseBytes),
    "Python Worker third-party license SHA-256 does not match its manifest",
);
assert(
    manifest.thirdPartyLicenses.components.length === 14,
    "Python Worker third-party license component inventory is incomplete",
);
assert(
    licenseBytes.includes(Buffer.from("Pyright 1.1.413")) &&
        licenseBytes.includes(Buffer.from(`typeshed commit ${manifest.typeshedCommit}`)),
    "Python Worker primary license notices are missing",
);
assert(workerBytes.length <= manifest.bundledAssetThresholdBytes, "Python Worker exceeds the bundled-asset threshold");
assert(manifest.optionalDeliveryRequired === false, "Bundled Python Worker unexpectedly requires optional delivery");

const messages = [];
let messageListener = null;
let closed = false;
const workerScope = {
    addEventListener(type, listener) {
        if (type === "message") messageListener = listener;
    },
    postMessage(message) {
        messages.push(JSON.parse(JSON.stringify(message)));
    },
    close() {
        closed = true;
    },
};
const context = {
    self: workerScope,
    globalThis: workerScope,
    performance,
    console,
    TextEncoder,
    TextDecoder,
    setTimeout,
    clearTimeout,
    setImmediate,
    clearImmediate,
    URL,
    URLSearchParams,
};
vm.runInNewContext(workerBytes.toString("utf8"), context, {
    filename: "autojs6-python-worker.js",
});
assert(typeof messageListener === "function", "Python Worker did not install its message listener");

function send(message) {
    const before = messages.length;
    const startedAt = performance.now();
    messageListener({ data: message });
    return {
        durationMs: performance.now() - startedAt,
        messages: messages.slice(before),
    };
}

let requestId = 0;
const uri = "file:///autojs6/editor/main.py";
const initialized = send({ jsonrpc: "2.0", id: ++requestId, method: "initialize", params: {} });
send({ jsonrpc: "2.0", method: "initialized", params: {} });
const code = [
    "from pathlib import Path",
    "",
    "def greet(name: str) -> str:",
    "    return name.upper()",
    "",
    "p = Path(\"a\")",
    "p.",
    "greet(",
    "missing_name",
].join("\n");
const didOpen = send({
    jsonrpc: "2.0",
    method: "textDocument/didOpen",
    params: { textDocument: { uri, languageId: "python", version: 1, text: code } },
});

function request(method, position) {
    const id = ++requestId;
    const result = send({
        jsonrpc: "2.0",
        id,
        method,
        params: { textDocument: { uri }, position },
    });
    return {
        durationMs: result.durationMs,
        response: result.messages.find((message) => message.id === id),
    };
}

const completionRuns = [];
for (let run = 0; run < 8; run += 1) {
    completionRuns.push(request("textDocument/completion", { line: 6, character: 2 }));
}
const hover = request("textDocument/hover", { line: 2, character: 10 });
const signature = request("textDocument/signatureHelp", { line: 7, character: 6 });
const definition = request("textDocument/definition", { line: 7, character: 2 });
const status = request("autojs6/status", null);
const shutdownId = ++requestId;
const shutdown = send({ jsonrpc: "2.0", id: shutdownId, method: "shutdown", params: {} });
send({ jsonrpc: "2.0", method: "exit", params: {} });

const completionResult = completionRuns.at(-1).response?.result;
const completionItems = Array.isArray(completionResult) ? completionResult : completionResult?.items || [];
const completionLabels = completionItems.map((item) => item.label);
const steadyDurations = completionRuns.slice(1).map((item) => item.durationMs).sort((a, b) => a - b);
const completionP50Ms = steadyDurations[Math.floor(steadyDurations.length / 2)];
const diagnostics = didOpen.messages.find(
    (message) => message.method === "textDocument/publishDiagnostics",
)?.params?.diagnostics || [];
const diagnosticMessages = diagnostics.map((diagnostic) => String(diagnostic.message || ""));
const initializeResponse = initialized.messages.find((message) => message.id === 1);
const hoverText = JSON.stringify(hover.response?.result || {});
const signatureText = JSON.stringify(signature.response?.result || {});
const definitions = definition.response?.result || [];
const memory = process.memoryUsage();

assert(initialized.durationMs < MAX_INITIALIZATION_MS, "Python Worker initialization exceeded 10 seconds");
assert(completionP50Ms < MAX_COMPLETION_P50_MS, "Python Worker completion P50 exceeded 500 ms");
assert(memory.rss < MAX_RESIDENT_BYTES, "Python Worker verification process exceeded 300 MiB RSS");
assert(completionLabels.includes("exists"), "pathlib.Path completion is missing exists");
assert(completionLabels.includes("read_text"), "pathlib.Path completion is missing read_text");
assert(/name:\s*str/.test(hoverText), "Parameter hover does not expose name: str");
assert(/name:\s*str/.test(signatureText), "Signature help does not expose name: str");
assert(diagnosticMessages.some((message) => /missing_name.*not defined/i.test(message)), "Undefined-name diagnostic is missing");
assert(diagnosticMessages.some((message) => /expected|unclosed|syntax/i.test(message)), "Syntax diagnostic is missing");
assert(Array.isArray(definitions) && definitions.some((item) => item.uri === uri && item.range?.start?.line === 2), "Definition response does not point to greet");
assert(status.response?.result?.pythonVersion === "3.12", "Worker status did not report Python 3.12");
assert(shutdown.messages.some((message) => message.id === shutdownId), "Worker did not acknowledge shutdown");
assert(closed, "Worker did not release its isolate on exit");

function waitFor(callbackRegistration) {
    return new Promise((resolvePromise, rejectPromise) => {
        callbackRegistration((error, value) => {
            if (error) rejectPromise(error);
            else resolvePromise(value);
        });
    });
}

async function verifyProviderIntegration() {
    let terminateCount = 0;
    class VmWorker {
        constructor() {
            this.onmessage = null;
            this.onerror = null;
            this.onmessageerror = null;
            this.terminated = false;
            let workerMessageListener = null;
            const adapter = this;
            const scope = {
                addEventListener(type, listener) {
                    if (type === "message") workerMessageListener = listener;
                },
                postMessage(message) {
                    queueMicrotask(() => {
                        if (!adapter.terminated && typeof adapter.onmessage === "function") {
                            adapter.onmessage({ data: JSON.parse(JSON.stringify(message)) });
                        }
                    });
                },
                close() {
                    adapter.terminated = true;
                },
            };
            const workerContext = {
                self: scope,
                globalThis: scope,
                performance,
                console,
                TextEncoder,
                TextDecoder,
                setTimeout,
                clearTimeout,
                setImmediate,
                clearImmediate,
                URL,
                URLSearchParams,
            };
            vm.runInNewContext(workerBytes.toString("utf8"), workerContext, {
                filename: "autojs6-python-worker.js",
            });
            this.postMessage = (message) => {
                queueMicrotask(() => {
                    if (!this.terminated && typeof workerMessageListener === "function") {
                        try {
                            workerMessageListener({ data: JSON.parse(JSON.stringify(message)) });
                        } catch (error) {
                            if (typeof this.onerror === "function") this.onerror({ message: error.message, error });
                        }
                    }
                });
            };
        }

        terminate() {
            if (!this.terminated) terminateCount += 1;
            this.terminated = true;
        }
    }

    const mainContext = {
        Worker: VmWorker,
        clearTimeout,
        console,
        Date,
        isFinite,
        JSON,
        Math,
        performance,
        queueMicrotask,
        setTimeout,
    };
    mainContext.window = mainContext;
    vm.createContext(mainContext);
    const autojs6Dir = path.resolve(assetDir, "..");
    for (const name of [
        "autojs6_semantic_provider.js",
        "autojs6_lsp_core.js",
        "autojs6_lsp_transports.js",
        "autojs6_python_provider.js",
        "autojs6_lsp_client.js",
    ]) {
        vm.runInContext(fs.readFileSync(path.join(autojs6Dir, name), "utf8"), mainContext, {
            filename: name,
        });
    }
    const lifecycleStart = mainContext.AutoJsAcePythonProvider.getLifecycleState();
    const publishedDiagnostics = [];
    const provider = mainContext.AutoJsAcePythonProvider.create({
        documentUri: uri,
        documentText: code,
        eager: false,
        onDiagnostics(annotations) {
            publishedDiagnostics.push(...annotations);
        },
    });
    assert(provider, "PythonProvider was not created with WebWorker support");
    const started = await new Promise((resolvePromise) => {
        provider.start((ok) => resolvePromise(ok));
    });
    assert(started, "PythonProvider did not initialize");
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 0));
    const providerCompletions = await waitFor((done) =>
        provider.getCompletions(null, { row: 6, column: 2 }, "", code, done)
    );
    const providerHover = await waitFor((done) =>
        provider.getHover(null, { row: 2, column: 10 }, code, done)
    );
    const providerSignature = await waitFor((done) =>
        provider.getSignatureHelp(null, { row: 7, column: 6 }, code, done)
    );
    const providerDefinition = await waitFor((done) =>
        provider.getDefinition(null, { row: 7, column: 2 }, code, done)
    );
    assert(providerCompletions.some((item) => item.caption === "exists"), "PythonProvider lost exists completion");
    assert(providerCompletions.some((item) => item.caption === "read_text"), "PythonProvider lost read_text completion");
    assert(/name:\s*str/.test(providerHover?.docText || ""), "PythonProvider hover normalization failed");
    assert(/name:\s*str/.test(providerSignature?.signature || ""), "PythonProvider signature normalization failed");
    assert(providerDefinition?.uri === uri && providerDefinition.line === 2, "PythonProvider definition normalization failed");
    assert(publishedDiagnostics.some((item) => /missing_name.*not defined/i.test(item.text)), "PythonProvider diagnostics were not published");
    const readyState = provider.getState();
    provider.dispose();
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 150));
    assert(provider.getState().disposed, "PythonProvider did not enter disposed state");
    assert(terminateCount === 1, `PythonProvider terminated ${terminateCount} Workers instead of one`);
    const lifecycleAfterProvider = mainContext.AutoJsAcePythonProvider.getLifecycleState();
    assert(
        lifecycleAfterProvider.providerCreatedCount === lifecycleStart.providerCreatedCount + 1 &&
            lifecycleAfterProvider.providerDisposeCount === lifecycleStart.providerDisposeCount + 1 &&
            lifecycleAfterProvider.workerReleaseCount === lifecycleStart.workerReleaseCount + 1 &&
            lifecycleAfterProvider.activeProviderCount === lifecycleStart.activeProviderCount,
        "PythonProvider lifecycle counters did not record one complete release",
    );

    let sessionAnnotations = [];
    const sessionListeners = {};
    const session = {
        getValue: () => code,
        getLength: () => code.split("\n").length,
        getLine: (row) => code.split("\n")[row] || "",
        getMode: () => ({ $id: "ace/mode/python" }),
        on(name, listener) {
            sessionListeners[name] = listener;
        },
        off(name) {
            delete sessionListeners[name];
        },
        setAnnotations(value) {
            sessionAnnotations = Array.isArray(value) ? value.slice(0) : [];
        },
    };
    const client = mainContext.AutoJsAceLspClient.createClient({
        session,
        getOptions: () => JSON.stringify({
            enabled: true,
            rootUri: "file:///autojs6/editor",
            documentUri: uri,
            semanticLanguage: "python",
            semanticLanguages: { typescript: true, python: true },
            semanticProviderId: "python-pyright-worker",
            semanticCapabilities: [
                "completion",
                "hover",
                "signatureHelp",
                "diagnostics",
                "definition",
                "dispose",
            ],
        }),
        getStaticCompleter: () => ({
            getCompletions(_editor, _session, _position, _prefix, callback) {
                callback(null, [{ caption: "staticFallback", value: "staticFallback" }]);
            },
            getHover() {
                return null;
            },
            getSignatureHelp() {
                return null;
            },
        }),
    });
    const clientWarm = await new Promise((resolvePromise) => {
        assert(client.warmUp((ok) => resolvePromise(ok)), "Python client warm-up did not start");
    });
    assert(clientWarm, "Python client warm-up did not become ready");
    const clientCompletions = await waitFor((done) =>
        client.getCompletions(null, session, { row: 6, column: 2 }, "", done)
    );
    const clientHover = await waitFor((done) =>
        client.getHoverAsync({ row: 2, column: 10 }, done)
    );
    const clientSignature = await waitFor((done) =>
        client.getSignatureHelpAsync({ row: 7, column: 6 }, done)
    );
    const clientDefinition = await waitFor((done) =>
        client.getDefinitionAsync({ row: 7, column: 2 }, done)
    );
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 0));
    const clientState = client.getState();
    assert(clientCompletions.some((item) => item.caption === "exists"), "LSP client did not route Python completion");
    assert(/name:\s*str/.test(clientHover?.docText || ""), "LSP client did not route Python hover");
    assert(/name:\s*str/.test(clientSignature?.signature || ""), "LSP client did not route Python signature help");
    assert(clientDefinition?.uri === uri && clientDefinition.line === 2, "LSP client did not route Python definition");
    assert(sessionAnnotations.some((item) => /missing_name.*not defined/i.test(item.text)), "LSP client did not publish Python diagnostics");
    assert(clientState.localServiceReady, "LSP client did not report its Python service ready");
    assert(clientState.completionProvider === "python-pyright-worker", "LSP client provider state is incorrect");
    const clientDiagnosticCount = sessionAnnotations.length;
    client.destroy();
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 150));
    assert(terminateCount === 2, `Python client lifecycle produced ${terminateCount} Worker terminations`);
    const lifecycleAfterClient = mainContext.AutoJsAcePythonProvider.getLifecycleState();
    assert(
        lifecycleAfterClient.providerCreatedCount === lifecycleStart.providerCreatedCount + 2 &&
            lifecycleAfterClient.providerDisposeCount === lifecycleStart.providerDisposeCount + 2 &&
            lifecycleAfterClient.workerReleaseCount === lifecycleStart.workerReleaseCount + 2 &&
            lifecycleAfterClient.activeProviderCount === lifecycleStart.activeProviderCount,
        "Python LSP client lifecycle did not release its provider and Worker exactly once",
    );

    const fallbackContext = { clearTimeout, console, Date, isFinite, JSON, Math, setTimeout };
    fallbackContext.window = fallbackContext;
    vm.createContext(fallbackContext);
    for (const name of [
        "autojs6_semantic_provider.js",
        "autojs6_lsp_core.js",
        "autojs6_lsp_transports.js",
        "autojs6_python_provider.js",
        "autojs6_lsp_client.js",
    ]) {
        vm.runInContext(fs.readFileSync(path.join(autojs6Dir, name), "utf8"), fallbackContext, {
            filename: name,
        });
    }
    assert(fallbackContext.AutoJsAcePythonProvider.isSupported() === false, "Missing Worker was not detected");
    assert(fallbackContext.AutoJsAcePythonProvider.create({}) === null, "Missing Worker did not produce silent fallback");

    const syntaxFallbackContext = {
        Worker: function Worker() {},
        Function: function UnsupportedSyntaxFunction() {
            throw new SyntaxError("ES2022 syntax unsupported");
        },
        clearTimeout,
        console,
        Date,
        isFinite,
        JSON,
        Math,
        setTimeout,
    };
    syntaxFallbackContext.window = syntaxFallbackContext;
    vm.createContext(syntaxFallbackContext);
    for (const name of [
        "autojs6_lsp_core.js",
        "autojs6_lsp_transports.js",
        "autojs6_python_provider.js",
    ]) {
        vm.runInContext(fs.readFileSync(path.join(autojs6Dir, name), "utf8"), syntaxFallbackContext, {
            filename: name,
        });
    }
    assert(
        syntaxFallbackContext.AutoJsAcePythonProvider.isWorkerSyntaxSupported() === false,
        "Incompatible Worker syntax was not detected",
    );
    assert(
        syntaxFallbackContext.AutoJsAcePythonProvider.isSupported() === false &&
            syntaxFallbackContext.AutoJsAcePythonProvider.create({}) === null,
        "Incompatible Worker syntax did not produce silent fallback",
    );
    return {
        ready: readyState.ready,
        initializationMs: readyState.initializationMs,
        completionCount: providerCompletions.length,
        diagnosticsCount: publishedDiagnostics.length,
        workerTerminateCount: terminateCount,
        missingWorkerFallback: true,
        incompatibleSyntaxFallback: true,
        clientCompletionCount: clientCompletions.length,
        clientDiagnosticsCount: clientDiagnosticCount,
        clientProvider: clientState.completionProvider,
        lifecycle: lifecycleAfterClient,
    };
}

const providerIntegration = await verifyProviderIntegration();

const report = {
    manifest: {
        pyrightVersion: manifest.pyrightVersion,
        pyrightCommit: manifest.pyrightCommit,
        typeshedCommit: manifest.typeshedCommit,
        typeshedFileCount: manifest.typeshedFileCount,
        workerBytes: manifest.workerBytes,
        workerSha256: manifest.workerSha256,
        thirdPartyLicenseBytes: manifest.thirdPartyLicenses.bytes,
        thirdPartyLicenseSha256: manifest.thirdPartyLicenses.sha256,
        thirdPartyLicenseComponents: manifest.thirdPartyLicenses.components.length,
    },
    initializeDurationMs: round(initialized.durationMs),
    engineInitializationMs: round(initializeResponse?.result?.autojs6?.initializationMs || 0),
    didOpenAndAnalyzeMs: round(didOpen.durationMs),
    completionDurationsMs: completionRuns.map((item) => round(item.durationMs)),
    completionP50Ms: round(completionP50Ms),
    completionCount: completionItems.length,
    pathlibExists: true,
    pathlibReadText: true,
    parameterHover: true,
    signatureHelp: true,
    undefinedNameDiagnostic: true,
    syntaxDiagnostic: true,
    definition: true,
    workerClosed: closed,
    providerIntegration,
    heapUsedBytes: memory.heapUsed,
    rssBytes: memory.rss,
};
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
