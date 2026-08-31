#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const defaultRepositoryRoot = path.resolve(scriptDirectory, "../..");
const rootArgumentIndex = process.argv.indexOf("--repo-root");
const repositoryRoot = rootArgumentIndex >= 0 ?
    path.resolve(process.argv[rootArgumentIndex + 1]) : defaultRepositoryRoot;

const assetRoot = path.join(repositoryRoot, "app/src/main/assets");
const editorRoot = path.join(assetRoot, "editor/ace-builds-1.4.12");
const javaAssetRoot = path.join(assetRoot, "java/ecj");
const classpathFile = path.join(javaAssetRoot, "android-36-stubs.jar");
const manifestFile = path.join(javaAssetRoot, "manifest.json");
const licenseFile = path.join(javaAssetRoot, "THIRD_PARTY_LICENSES.txt");
const providerFile = path.join(editorRoot, "autojs6/autojs6_java_provider.js");
const clientFile = path.join(editorRoot, "autojs6/autojs6_lsp_client.js");
const htmlFile = path.join(editorRoot, "autojs6_editor.html");
const bridgeFile = path.join(
    repositoryRoot,
    "app/src/main/java/io/github/supermonster003/autojs6/plugin/ace/editor/core/AceBridge.kt"
);
const editorFile = path.join(
    repositoryRoot,
    "app/src/main/java/io/github/supermonster003/autojs6/plugin/ace/editor/core/AceCodeEditor.kt"
);
const runtimeFile = path.join(
    repositoryRoot,
    "app/src/main/java/io/github/supermonster003/autojs6/plugin/ace/editor/core/lsp/AceJavaSemanticRuntime.kt"
);
const classpathRuntimeFile = path.join(
    repositoryRoot,
    "app/src/main/java/io/github/supermonster003/autojs6/plugin/ace/editor/core/lsp/AceJavaClasspathRuntime.kt"
);
const sourceVersionFile = path.join(repositoryRoot, "app/src/main/java/javax/lang/model/SourceVersion.java");
const proguardFile = path.join(repositoryRoot, "app/proguard-rules.pro");

function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

function readText(file) {
    assert(fs.existsSync(file), `Missing required file: ${path.relative(repositoryRoot, file)}`);
    return fs.readFileSync(file, "utf8");
}

function sha256(buffer) {
    return crypto.createHash("sha256").update(buffer).digest("hex");
}

function findEndOfCentralDirectory(buffer) {
    const minimumOffset = Math.max(0, buffer.length - 0xffff - 22);
    for (let offset = buffer.length - 22; offset >= minimumOffset; offset--) {
        if (buffer.readUInt32LE(offset) === 0x06054b50) {
            return offset;
        }
    }
    throw new Error("Classpath jar has no ZIP end-of-central-directory record");
}

function readZipCentralDirectory(buffer) {
    const endOffset = findEndOfCentralDirectory(buffer);
    const entryCount = buffer.readUInt16LE(endOffset + 10);
    const centralDirectoryOffset = buffer.readUInt32LE(endOffset + 16);
    const entries = [];
    let offset = centralDirectoryOffset;
    for (let index = 0; index < entryCount; index++) {
        assert(buffer.readUInt32LE(offset) === 0x02014b50, "Invalid ZIP central directory entry");
        const dosTime = buffer.readUInt16LE(offset + 12);
        const dosDate = buffer.readUInt16LE(offset + 14);
        const compressedBytes = buffer.readUInt32LE(offset + 20);
        const uncompressedBytes = buffer.readUInt32LE(offset + 24);
        const nameLength = buffer.readUInt16LE(offset + 28);
        const extraLength = buffer.readUInt16LE(offset + 30);
        const commentLength = buffer.readUInt16LE(offset + 32);
        const name = buffer.subarray(offset + 46, offset + 46 + nameLength).toString("utf8");
        entries.push({ name, compressedBytes, uncompressedBytes, dosTime, dosDate });
        offset += 46 + nameLength + extraLength + commentLength;
    }
    return entries;
}

const manifest = JSON.parse(readText(manifestFile));
const classpathBuffer = fs.readFileSync(classpathFile);
const entries = readZipCentralDirectory(classpathBuffer);
const names = entries.map((entry) => entry.name);
const uniqueNames = new Set(names);
const excludedPrefixes = ["android/adservices/", "android/health/", "android/icu/"];

assert(manifest.schemaVersion === 1, "Unexpected ECJ classpath manifest schema");
assert(manifest.ecjVersion === "3.26.0", "ECJ version is not pinned to 3.26.0");
assert(manifest.ecjArtifactSha256 ===
    "ac0ba5876eaf7ebb47749a0d1be179c51f194b9dd0b875d1c09e1b530f5a2db5",
"Unexpected pinned ECJ artifact SHA-256");
assert(manifest.ecjArtifactBytes === 3133846, "Unexpected pinned ECJ artifact size");
assert(manifest.bundleBudgetBytes === 8 * 1024 * 1024, "Java bundle budget must remain 8 MiB");
assert(manifest.compileSdk === 36, "Java stub classpath must remain pinned to API 36");
assert(JSON.stringify(manifest.excludedClassPrefixes) === JSON.stringify(excludedPrefixes),
    "Java stub trim policy changed without updating the verifier");
assert(manifest.sourceSha256 ===
    "d9eb9da824d9e247a352f570f01e1169e725b2954bca9e283a71786c59b59f9a",
"Unexpected API 36 source android.jar SHA-256");
assert(manifest.classpathFile === path.basename(classpathFile), "Classpath filename mismatch");
assert(manifest.classpathBytes === classpathBuffer.length, "Classpath byte count mismatch");
assert(manifest.classpathSha256 === sha256(classpathBuffer), "Classpath SHA-256 mismatch");
assert(manifest.classFileCount === entries.length, "Classpath class count mismatch");
assert(manifest.uncompressedClassBytes ===
    entries.reduce((total, entry) => total + entry.uncompressedBytes, 0),
"Classpath uncompressed byte count mismatch");
assert(uniqueNames.size === names.length, "Classpath contains duplicate entries");
assert(entries.every((entry) => entry.name.endsWith(".class")),
    "Classpath must contain class entries only");
assert(entries.every((entry) => entry.dosTime === 0 && entry.dosDate === 0x21),
    "Classpath entries must use the deterministic 1980-01-01 timestamp");
assert(names.includes("java/lang/Object.class"), "Classpath omits java.lang.Object");
assert(names.includes("java/util/ArrayList.class"), "Classpath omits java.util.ArrayList");
assert(names.includes("android/app/Activity.class"), "Classpath omits android.app.Activity");
assert(names.includes("android/view/View.class"), "Classpath omits android.view.View");
assert(excludedPrefixes.every((prefix) => names.every((name) => !name.startsWith(prefix))),
    "Classpath contains a package excluded by the size policy");

const providerText = readText(providerFile);
const clientText = readText(clientFile);
const htmlText = readText(htmlFile);
const bridgeText = readText(bridgeFile);
const editorText = readText(editorFile);
const runtimeText = readText(runtimeFile);
const classpathRuntimeText = readText(classpathRuntimeFile);
const sourceVersionText = readText(sourceVersionFile);
const proguardText = readText(proguardFile);
const licenseText = readText(licenseFile);

const budgetedFiles = [classpathFile, manifestFile, licenseFile, providerFile];
const bundleBytes = manifest.ecjArtifactBytes + budgetedFiles.reduce(
    (total, file) => total + fs.statSync(file).size,
    0
);
assert(bundleBytes <= manifest.bundleBudgetBytes,
    `Java semantic bundle ${bundleBytes} exceeds ${manifest.bundleBudgetBytes} bytes`);

assert(providerText.includes("requestJavaDiagnostics"), "Java provider omits native requests");
assert(providerText.includes("cancelJavaDiagnostics"), "Java provider omits stale-request cancellation");
assert(providerText.includes("receiveDiagnostics"), "Java provider omits native response routing");
assert(clientText.includes("function isJavaDocumentUri"), "LSP client omits Java routing");
assert(clientText.includes("function getJavaService"), "LSP client omits Java provider lifecycle");
assert(clientText.includes("java-publish"), "LSP client omits Java diagnostic publication");
assert(clientText.includes("COMPLETION_PROVIDER_LOCAL_INDEX"), "Java P2 completion fallback is missing");
const providerScriptIndex = htmlText.indexOf("autojs6_java_provider.js");
const clientScriptIndex = htmlText.indexOf("autojs6_lsp_client.js");
assert(providerScriptIndex >= 0 && providerScriptIndex < clientScriptIndex,
    "Java provider must load before the LSP client");
[
    "isJavaDiagnosticsSupported",
    "requestJavaDiagnostics",
    "cancelJavaDiagnostics",
    "getJavaDiagnosticsState"
].forEach((method) => assert(bridgeText.includes(`fun ${method}`), `Bridge omits ${method}`));
assert(editorText.includes("AceJavaSemanticRuntime"), "Editor does not own the Java runtime");
assert(editorText.includes("javaSemanticRuntime.close()"), "Editor does not close the Java runtime");
assert(runtimeText.includes("ScheduledThreadPoolExecutor(1)"), "ECJ is not single-thread bounded");
assert(runtimeText.includes("THREAD_PRIORITY_BACKGROUND"), "ECJ worker is not background-priority");
assert(runtimeText.includes("MAX_DOCUMENT_LENGTH = 512 * 1024"), "Java source limit changed");
assert(runtimeText.includes("MAX_COMPILE_HEAP_GROWTH_BYTES = 64L * 1024L * 1024L"),
    "Java compile heap-growth circuit changed");
assert(runtimeText.includes("MIN_COMPILE_INTERVAL_MS = 250L"), "Native compile throttle changed");
assert(classpathRuntimeText.includes(manifest.classpathSha256),
    "Runtime classpath hash does not match the generated manifest");
assert(sourceVersionText.includes("RELEASE_12"), "ART SourceVersion compatibility surface is missing");
assert(classpathRuntimeText.includes("org.eclipse.jdt.internal.compiler.Compiler::class.java"),
    "Runtime does not use a typed ECJ availability probe");
assert(proguardText.includes("-keep enum javax.lang.model.SourceVersion"),
    "Release minification can remove ECJ's reflected ART compatibility enum");
assert(proguardText.includes("-dontwarn javax.tools.**") &&
    proguardText.includes("-dontwarn javax.lang.model.element.**"),
"Release R8 boundary for disabled ECJ tool/annotation-processing APIs is missing");
assert(licenseText.includes("Eclipse Public License 2.0"), "ECJ license notice is missing");
assert(licenseText.includes("Classpath Exception"), "OpenJDK stub notice is missing");

const nativeRequests = [];
const nativeCancellations = [];
let publishedAnnotations = null;
const sandbox = {
    console,
    Date,
    JSON,
    Object,
    Array,
    Math,
    Number,
    String,
    isFinite,
    setTimeout,
    clearTimeout
};
sandbox.window = sandbox;
sandbox.autojs = {
    isJavaDiagnosticsSupported() { return true; },
    requestJavaDiagnostics(requestJson) {
        const request = JSON.parse(requestJson);
        nativeRequests.push(request);
        return JSON.stringify({
            ok: true,
            accepted: true,
            requestId: request.requestId,
            delayMs: 0
        });
    },
    cancelJavaDiagnostics(requestId) {
        nativeCancellations.push(String(requestId));
        return JSON.stringify({ ok: true, cancelled: true, requestId });
    },
    getJavaDiagnosticsState() {
        return JSON.stringify({ providerId: "java-ecj", memoryCircuitOpen: false });
    }
};
vm.runInNewContext(providerText, sandbox, { filename: providerFile });
const javaRuntime = sandbox.AutoJsAceJavaProvider;
assert(javaRuntime && javaRuntime.isSupported(), "Java provider rejects the mocked Android bridge");
const provider = javaRuntime.create({
    eager: false,
    documentUri: "file:///autojs6/editor/Main.java",
    onDiagnostics(annotations) { publishedAnnotations = annotations; }
});
let started = false;
provider.start((ok) => { started = ok; });
assert(started, "Java provider did not start over the Android bridge");
provider.getDiagnostics(null, "class Main { int first; }");
provider.getDiagnostics(null, "class Main { int second }");
assert(nativeRequests.length === 2, "Java provider did not forward source revisions");
assert(nativeCancellations.includes(nativeRequests[0].requestId),
    "Java provider did not cancel its stale request");
const activeRequest = nativeRequests[1];
assert(javaRuntime.receiveDiagnostics(JSON.stringify({
    ok: true,
    requestId: activeRequest.requestId,
    documentUri: activeRequest.documentUri,
    diagnostics: [{
        row: 0,
        column: 24,
        endRow: 0,
        endColumn: 25,
        message: "Syntax error, insert ';' to complete FieldDeclaration",
        severity: "error",
        code: 1610612976,
        category: 20
    }],
    durationMs: 42.5,
    heapDeltaBytes: 1024,
    pssDeltaKb: 128,
    memoryLimitExceeded: false
})), "Java provider rejected the current native response");
assert(Array.isArray(publishedAnnotations) && publishedAnnotations.length === 1,
    "Java provider did not publish one annotation");
assert(publishedAnnotations[0].row === 0 && publishedAnnotations[0].column === 24,
    "Java diagnostic source position was not preserved");
assert(publishedAnnotations[0].type === "error" && publishedAnnotations[0].source === "ECJ",
    "Java diagnostic severity/source mapping failed");
assert(provider.getState().lastRequestDurationMs === 42.5,
    "Java provider did not retain native timing telemetry");
provider.dispose();
const lifecycle = javaRuntime.getLifecycleState();
assert(lifecycle.activeProviderCount === 0 && lifecycle.pendingRequestCount === 0,
    "Java provider leaked lifecycle state after disposal");

console.log(JSON.stringify({
    ok: true,
    gate: "M6-1/M6-2",
    ecjVersion: manifest.ecjVersion,
    compileSdk: manifest.compileSdk,
    classFileCount: entries.length,
    classpathBytes: classpathBuffer.length,
    bundleBytes,
    bundleBudgetBytes: manifest.bundleBudgetBytes,
    bundleBudgetPercent: Number((bundleBytes * 100 / manifest.bundleBudgetBytes).toFixed(2)),
    classpathSha256: manifest.classpathSha256,
    providerLifecycle: lifecycle
}, null, 2));
