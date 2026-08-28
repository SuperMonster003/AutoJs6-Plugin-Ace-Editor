import { readFileSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { basename, dirname, join, resolve } from "node:path";
import vm from "node:vm";

function fail(message) {
    throw new Error(`[AutoJs6 LSP runtime verification] ${message}`);
}

function assert(condition, message) {
    if (!condition) {
        fail(message);
    }
}

function parseArguments(argv) {
    const values = new Map();
    const supported = new Set([
        "--runtime",
        "--service",
        "--client",
        "--core",
        "--android",
        "--libraries",
        "--resources",
        "--main-app",
        "--compatibility",
    ]);
    for (let index = 0; index < argv.length; index += 2) {
        const name = argv[index];
        const value = argv[index + 1];
        if (!supported.has(name) || !value) {
            fail(
                "Usage: verify-runtime.mjs --runtime <typescript.js> " +
                "--service <autojs6_ts_language_service.js> " +
                "--client <autojs6_lsp_client.js> --core <generated-core.d.ts> " +
                "--android <generated-android.d.ts> " +
                "--libraries <generated-libraries.d.ts> " +
                "--resources <generated-resources.d.ts> " +
                "--main-app <generated-main-app.d.ts> " +
                "--compatibility <lib.autojs6.extra.d.ts>",
            );
        }
        values.set(name, resolve(value));
    }
    for (const name of supported) {
        if (!values.has(name)) {
            fail(`Missing required argument: ${name}`);
        }
    }
    return Object.fromEntries(
        [...values].map(([name, value]) => [name.slice(2), value]),
    );
}

function collectTypeScriptLibClosure(libraryDirectory, rootName) {
    const pending = [rootName];
    const files = [];
    const seen = new Set();
    while (pending.length > 0) {
        const name = pending.shift();
        if (seen.has(name)) {
            continue;
        }
        seen.add(name);
        const file = join(libraryDirectory, name);
        const text = readFileSync(file, "utf8");
        files.push(file);
        const referencePattern =
            /\/\/\/[ \t]*<reference[ \t]+lib=[ \t]*["']([^"']+)["'][ \t]*\/?>/gim;
        let match;
        while ((match = referencePattern.exec(text)) !== null) {
            pending.push(`lib.${String(match[1]).trim().toLowerCase()}.d.ts`);
        }
    }
    return files;
}

function duplicateDiagnostics(ts, rootNames) {
    const program = ts.createProgram(
        rootNames,
        {
            module: ts.ModuleKind.CommonJS,
            noEmit: true,
            noLib: true,
            skipLibCheck: false,
            strict: false,
            target: ts.ScriptTarget.ES2022,
        },
    );
    return ts.getPreEmitDiagnostics(program).filter(
        (diagnostic) => diagnostic.code === 2300,
    );
}

function verifyCompatibilitySemantics(paths, ts) {
    const standardLibs = collectTypeScriptLibClosure(
        dirname(paths.runtime),
        "lib.es2022.d.ts",
    );
    const baselineDuplicates = duplicateDiagnostics(
        ts,
        [...standardLibs, paths.core],
    );
    const compatibilityDuplicates = duplicateDiagnostics(
        ts,
        [...standardLibs, paths.core, paths.compatibility],
    );
    assert(
        compatibilityDuplicates.length === baselineDuplicates.length,
        "Compatibility declarations introduced duplicate identifiers: " +
        compatibilityDuplicates
            .slice(baselineDuplicates.length)
            .map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"))
            .join("; "),
    );
    assert(
        compatibilityDuplicates.every(
            (diagnostic) => resolve(diagnostic.file?.fileName || "") !== paths.compatibility,
        ),
        "Compatibility declaration file contains a duplicate identifier",
    );
    return {
        standardLibraryCount: standardLibs.length,
        baselineDuplicateCount: baselineDuplicates.length,
        compatibilityDuplicateCount: compatibilityDuplicates.length,
    };
}

function createBrowserTypeScriptContext(paths) {
    const context = {
        clearTimeout,
        console,
        performance,
        setTimeout,
    };
    context.window = context;
    vm.createContext(context);
    for (const file of [paths.runtime, paths.service]) {
        vm.runInContext(readFileSync(file, "utf8"), context, {
            filename: basename(file),
        });
    }
    return context;
}

function sessionFor(text) {
    const lines = text.split("\n");
    return {
        getLength: () => lines.length,
        getLine: (row) => lines[row] || "",
        getValue: () => text,
        doc: {
            positionToIndex(position) {
                return lines
                    .slice(0, position.row)
                    .reduce((length, line) => length + line.length + 1, 0) +
                    position.column;
            },
        },
    };
}

function applyCurrentDocumentCodeAction(text, action) {
    let result = String(text || "");
    const edits = [...(action?.edits || [])].sort(
        (left, right) => right.startOffset - left.startOffset,
    );
    for (const edit of edits) {
        result = result.slice(0, edit.startOffset) +
            edit.newText + result.slice(edit.endOffset);
    }
    return result;
}

function typeScriptLibraryTextByUri(paths) {
    const libraryDirectory = dirname(paths.runtime);
    const libraryTextByUri = {};
    for (const name of readdirSync(libraryDirectory)) {
        if (/^lib\..+\.d\.ts$/.test(name)) {
            libraryTextByUri[`file:///autojs6/typescript/${name}`] =
                readFileSync(join(libraryDirectory, name), "utf8");
        }
    }
    return libraryTextByUri;
}

function verifyBrowserLanguageService(paths, expectedVersion) {
    const context = createBrowserTypeScriptContext(paths);
    const libraryTextByUri = typeScriptLibraryTextByUri(paths);
    libraryTextByUri["file:///autojs6/types/generated/lib.autojs6.core.d.ts"] =
        readFileSync(paths.core, "utf8");
    libraryTextByUri["file:///autojs6/types/lib.autojs6.extra.d.ts"] =
        readFileSync(paths.compatibility, "utf8");

    const expectedRoots = [
        "file:///autojs6/typescript/lib.es2022.d.ts",
        "file:///autojs6/types/generated/lib.autojs6.core.d.ts",
        "file:///autojs6/types/lib.autojs6.extra.d.ts",
    ];
    const constants = context.AutoJsAceTsLanguageService?.constants;
    assert(constants, "Browser language service did not register");
    assert(
        JSON.stringify(constants.defaultLibraryUris) === JSON.stringify(expectedRoots),
        `Unexpected default roots: ${JSON.stringify(constants.defaultLibraryUris)}`,
    );

    const errors = [];
    const service = context.AutoJsAceTsLanguageService.create({
        documentUri: "file:///autojs6/editor/compatibility-smoke.ts",
        libraryTextByUri,
        notifyError: (message) => errors.push(String(message)),
    });
    const text = [
        "const __compatPackageName: AutoJs6.App.PackageName = \"org.autojs.autojs6\";",
        "const __compatAppName: AutoJs6.App.AppName = \"AutoJs6\";",
        "const __compatAlias: AutoJs6.App.Alias = \"autojs6\";",
    ].join("\n");
    const diagnostics = service.getDiagnostics(sessionFor(text), text) || [];
    const state = service.getState();
    service.dispose();

    assert(state.ready, `Browser language service is not ready: ${state.reason}`);
    assert(state.version === expectedVersion, `Expected TypeScript ${expectedVersion}, got ${state.version}`);
    assert(state.expectedVersion === expectedVersion, "Browser service did not enforce the bundled TypeScript version");
    assert(state.executionProfile === "rhino", `Expected inferred Rhino profile, got ${state.executionProfile}`);
    assert(state.executionProfileRevision === 2, "Rhino profile revision is not aligned with execution");
    assert(state.defaultLib === "lib.es2018.d.ts", `Unexpected Rhino default lib: ${state.defaultLib}`);
    assert(errors.length === 0, `Browser language service reported: ${errors.join("; ")}`);
    assert(
        diagnostics.length === 0,
        "Legacy AutoJs6.App aliases failed semantic verification: " +
        diagnostics.map((diagnostic) => diagnostic.text).join("; "),
    );
    return {
        defaultRootCount: expectedRoots.length,
        loadedLibraryCount: state.libraryCount,
        aliasDiagnosticCount: diagnostics.length,
    };
}

function verifyDependencyTypeLayer(paths) {
    const context = createBrowserTypeScriptContext(paths);
    const libraryTextByUri = typeScriptLibraryTextByUri(paths);
    libraryTextByUri["file:///autojs6/types/generated/lib.autojs6.core.d.ts"] =
        readFileSync(paths.core, "utf8");
    libraryTextByUri["file:///autojs6/types/lib.autojs6.extra.d.ts"] =
        readFileSync(paths.compatibility, "utf8");
    const projectTypeTextByUri = {
        "file:///autojs6/editor/node_modules/dayjs/package.json": JSON.stringify({
            name: "dayjs",
            main: "dayjs.min.js",
            types: "legacy/index.d.ts",
            typesVersions: {
                ">=6.0": {
                    "*": ["ts6/*"],
                },
            },
        }),
        "file:///autojs6/editor/node_modules/dayjs/dayjs.min.js":
            "module.exports = function dayjs() {};",
        "file:///autojs6/editor/node_modules/dayjs/legacy/index.d.ts": [
            "interface LegacyDayjs { legacyOnly(): never; }",
            "declare function dayjs(): LegacyDayjs;",
            "export = dayjs;",
        ].join("\n"),
        "file:///autojs6/editor/node_modules/dayjs/ts6/legacy/index.d.ts": [
            "interface Dayjs { format(template?: string): string; unix(): number; }",
            "declare function dayjs(): Dayjs;",
            "export = dayjs;",
        ].join("\n"),
        "file:///autojs6/editor/node_modules/@types/ambient/package.json":
            JSON.stringify({ name: "@types/ambient", types: "index.d.ts" }),
        "file:///autojs6/editor/node_modules/@types/ambient/index.d.ts":
            "declare const ambientAnswer: 42;",
        "file:///autojs6/editor/node_modules/lodash/package.json":
            JSON.stringify({ name: "lodash", version: "4.17.21", main: "lodash.js" }),
        "file:///autojs6/editor/node_modules/lodash/lodash.js":
            "module.exports = {};",
        "file:///autojs6/editor/node_modules/@types/lodash/package.json":
            JSON.stringify({ name: "@types/lodash", version: "4.17.25", types: "index.d.ts" }),
        "file:///autojs6/editor/node_modules/@types/lodash/index.d.ts": [
            "declare const lodash: lodash.LoDashStatic;",
            "declare namespace lodash {",
            "  interface LoDashStatic { chunk<T>(array: ArrayLike<T> | null | undefined, size?: number): T[][]; }",
            "}",
            "export = lodash;",
        ].join("\n"),
    };
    const projectTypeFileUris = Object.keys(projectTypeTextByUri).sort();
    const libraryUris = [
        "file:///autojs6/typescript/lib.es2018.d.ts",
        "file:///autojs6/types/generated/lib.autojs6.core.d.ts",
        "file:///autojs6/types/lib.autojs6.extra.d.ts",
    ];
    function verifyProfile(profile, suffix) {
        const errors = [];
        const documentUri = `file:///autojs6/editor/src/main.${suffix}`;
        const sharedSuffix = profile === "node" ? "mts" : "ts";
        const sharedUri = `file:///autojs6/editor/src/shared.${sharedSuffix}`;
        const sharedSpecifier = profile === "node" ? "./shared.mjs" : "./shared";
        const missingSpecifier = profile === "node" ? "./missing.mjs" : "./missing";
        const source = [
            'import dayjs from "dayjs";',
            'import lodash from "lodash";',
            `import * as sharedModule from "${sharedSpecifier}";`,
            `import { missingAnswer } from "${missingSpecifier}";`,
            "const value = dayjs();",
            "value.format();",
            "const projectValue = sharedModule.projectHelper(\"42\", 10);",
            "const wrong: number = value.format();",
            "const ambient: 42 = ambientAnswer;",
            "const chunks: number[][] = lodash.chunk([1, 2, 3], 2);",
            "const shared: 42 = sharedModule.sharedAnswer;",
            "void missingAnswer;",
        ].join("\n");
        const projectSourceTextByUri = {
            [documentUri]: source,
            [sharedUri]: [
                "export const sharedAnswer = 42 as const;",
                "export function projectHelper(value: string, radix?: number): number {",
                "  return Number.parseInt(value, radix);",
                "}",
            ].join("\n"),
        };
        const projectSourceFileUris = Object.keys(projectSourceTextByUri).sort();
        const service = context.AutoJsAceTsLanguageService.create({
            documentUri,
            rootUri: "file:///autojs6/editor",
            executionProfile: profile,
            typescriptVersion: "6.0.3",
            libraryTextByUri,
            libraryUris,
            projectSourceTextByUri,
            projectSourceFileUris,
            projectSourceInventoryFingerprint:
                "1111111111111111111111111111111111111111111111111111111111111111",
            projectSourceFileCount: projectSourceFileUris.length,
            projectSourceByteLength: Object.values(projectSourceTextByUri)
                .reduce((total, text) => total + Buffer.byteLength(text, "utf8"), 0),
            projectSnapshotSchemaRevision: 1,
            projectSnapshotReady: true,
            projectTypeTextByUri,
            projectTypeFileUris,
            dependencyTypeNames: ["ambient"],
            dependencyLayerFingerprint:
                "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
            dependencyInventoryFingerprint:
                "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789",
            dependencyFileCount: projectTypeFileUris.length,
            dependencyByteLength: Object.values(projectTypeTextByUri)
                .reduce((total, text) => total + Buffer.byteLength(text, "utf8"), 0),
            dependencyResolverPolicyRevision: 4,
            dependencyResolverPolicyFingerprint:
                "d8207539237d2a08a6b97b530c5e6215f4b73311fdd6954ce9f8004717ebd635",
            notifyError: (message) => errors.push(String(message)),
        });
        const session = sessionFor(source);
        const diagnostics = service.getDiagnostics(session, source) || [];
        let completions = [];
        service.getCompletions(
            session,
            { row: 5, column: "value.".length },
            "",
            (_error, items) => { completions = items || []; },
            source,
        );
        const hover = service.getHover(
            session,
            { row: 4, column: "const value".length },
            source,
        );
        let projectCompletions = [];
        service.getCompletions(
            session,
            { row: 6, column: "const projectValue = sharedModule.".length },
            "",
            (_error, items) => { projectCompletions = items || []; },
            source,
        );
        const projectHover = service.getHover(
            session,
            { row: 6, column: "const projectValue = sharedModule.pro".length },
            source,
        );
        const projectSignature = service.getSignatureHelp(
            session,
            { row: 6, column: "const projectValue = sharedModule.projectHelper(\"42\"".length },
            source,
        );
        const projectDefinition = service.getDefinition(
            session,
            { row: 6, column: "const projectValue = sharedModule.pro".length },
            source,
        );
        const dependencyDefinition = service.getDefinition(
            session,
            { row: 5, column: "value.for".length },
            source,
        );
        const codeActionSource = [
            "const autoImported: 42 = sharedAnswer;",
            "const correctlySpelled = 42 as const;",
            "const typo: 42 = correctlySpeld;",
        ].join("\n");
        const codeActionSession = sessionFor(codeActionSource);
        const autoImportActions = service.getCodeActions(
            codeActionSession,
            { row: 0, column: "const autoImported: 42 = shared".length },
            codeActionSource,
        );
        const spellingActions = service.getCodeActions(
            codeActionSession,
            { row: 2, column: "const typo: 42 = correctlySp".length },
            codeActionSource,
        );
        const autoImportAction = autoImportActions.find(
            (action) => action.kind === "autoImport",
        );
        const spellingAction = spellingActions.find(
            (action) => action.kind === "spellingCorrection",
        );
        const autoImportResult = applyCurrentDocumentCodeAction(
            codeActionSource,
            autoImportAction,
        );
        const spellingResult = applyCurrentDocumentCodeAction(
            codeActionSource,
            spellingAction,
        );
        const state = service.getState();
        service.dispose();

        assert(errors.length === 0, `${profile} dependency types reported: ${errors.join("; ")}`);
        assert(state.ready, `${profile} dependency type service was not ready: ${state.reason}`);
        assert(
            diagnostics.filter((diagnostic) => String(diagnostic.raw) === "2322").length === 1,
            `${profile} did not preserve the compiler TS2322 diagnostic: ${JSON.stringify(diagnostics)}`,
        );
        assert(
            diagnostics.filter((diagnostic) => String(diagnostic.raw) === "2307").length === 1,
            `${profile} did not publish exactly one unresolved-import TS2307: ${JSON.stringify(diagnostics)}`,
        );
        assert(
            !diagnostics.some((diagnostic) =>
                ["2339", "2688", "7016"].includes(String(diagnostic.raw))),
            `${profile} failed project source, package, typesVersions, installed @types, or lodash module ` +
                `fallback resolution: ${JSON.stringify(diagnostics)}`,
        );
        assert(
            completions.some((item) => item.caption === "format") &&
                completions.some((item) => item.caption === "unix") &&
                !completions.some((item) => item.caption === "legacyOnly"),
            `${profile} completion did not use the TypeScript 6 typesVersions branch`,
        );
        assert(
            String(hover?.docText || "").includes("Dayjs"),
            `${profile} hover did not infer dayjs() as Dayjs: ${JSON.stringify(hover)}`,
        );
        assert(
            projectCompletions.some((item) => item.caption === "projectHelper") &&
                projectCompletions.some((item) => item.caption === "sharedAnswer"),
            `${profile} completion did not include symbols from the project source layer`,
        );
        assert(
            String(projectHover?.docText || "").includes("projectHelper") &&
                String(projectHover?.docText || "").includes("number"),
            `${profile} hover did not resolve a cross-file project symbol: ${JSON.stringify(projectHover)}`,
        );
        assert(
            String(projectSignature?.signature || "").includes("projectHelper") &&
                projectSignature.parameters.length === 2,
            `${profile} signature help did not resolve a cross-file project function: ` +
                JSON.stringify(projectSignature),
        );
        assert(
            projectDefinition?.uri === sharedUri &&
                projectDefinition.authority === "projectSource" &&
                projectDefinition.line === 1 &&
                projectDefinition.column === "export function ".length,
            `${profile} definition did not resolve the project source target: ` +
                JSON.stringify(projectDefinition),
        );
        assert(
            dependencyDefinition?.uri ===
                "file:///autojs6/editor/node_modules/dayjs/ts6/legacy/index.d.ts" &&
                dependencyDefinition.authority === "dependencyDeclaration",
            `${profile} definition did not resolve the dependency declaration target: ` +
                JSON.stringify(dependencyDefinition),
        );
        assert(
            autoImportAction && autoImportAction.diagnosticCode === 2304 &&
                autoImportAction.edits.length > 0 &&
                /import\s*\{\s*sharedAnswer\s*\}\s*from\s*["']\.\/shared(?:\.mjs)?["']/.test(
                    autoImportResult,
                ),
            `${profile} did not produce a bounded current-document auto-import: ` +
                JSON.stringify(autoImportActions),
        );
        assert(
            spellingAction && spellingAction.edits.length === 1 &&
                spellingResult.includes("const typo: 42 = correctlySpelled;"),
            `${profile} did not produce the TypeScript spelling correction subset: ` +
                JSON.stringify(spellingActions),
        );
        assert(
            [...autoImportActions, ...spellingActions].every(
                (action) =>
                    ["autoImport", "spellingCorrection"].includes(action.kind) &&
                    action.edits.every(
                        (edit) =>
                            Number.isInteger(edit.startOffset) &&
                            Number.isInteger(edit.endOffset) &&
                            edit.startOffset >= 0 &&
                            edit.endOffset >= edit.startOffset &&
                            edit.endOffset <= codeActionSource.length,
                    ),
            ),
            `${profile} code actions escaped the active document boundary`,
        );
        assert(
            JSON.stringify(state.dependencyTypeNames) === JSON.stringify(["ambient"]) &&
                state.dependencyResolverPolicyRevision === 4 &&
                state.projectTypeFileCount === projectTypeFileUris.length &&
                state.projectSourceFileCount === projectSourceFileUris.length &&
                state.loadedProjectSourceFileCount === projectSourceFileUris.length &&
                state.projectSnapshotReady === true &&
                state.projectSnapshotSchemaRevision === 1,
            `${profile} did not retain the frozen project source and dependency authorities`,
        );
        return {
            diagnosticCodes: diagnostics.map((diagnostic) => Number(diagnostic.raw)).sort(),
            completionNames: completions.map((item) => item.caption)
                .filter((name) => name === "format" || name === "unix")
                .sort(),
            hover: hover?.value || hover?.caption || "",
            projectDefinition: projectDefinition?.uri || "",
            dependencyDefinition: dependencyDefinition?.uri || "",
            autoImportTitle: autoImportAction?.title || "",
            spellingTitle: spellingAction?.title || "",
            loadedProjectSourceFileCount: state.loadedProjectSourceFileCount,
            loadedProjectTypeFileCount: state.loadedProjectTypeFileCount,
        };
    }

    const rhino = verifyProfile("rhino", "ts");
    const node = verifyProfile("node", "mts");
    assert(
        JSON.stringify(rhino.diagnosticCodes) === JSON.stringify(node.diagnosticCodes),
        "Rhino and Node editor profiles disagree on project diagnostics",
    );
    assert(
        JSON.stringify(rhino.diagnosticCodes) === JSON.stringify([2307, 2322]),
        `Project diagnostic golden changed: ${JSON.stringify(rhino.diagnosticCodes)}`,
    );
    const singleDocumentSource = 'import { absent } from "./absent"; void absent;';
    const singleDocumentService = context.AutoJsAceTsLanguageService.create({
        documentUri: "file:///autojs6/editor/src/single.ts",
        rootUri: "file:///autojs6/editor",
        executionProfile: "rhino",
        typescriptVersion: "6.0.3",
        libraryTextByUri,
        libraryUris,
        projectTypeTextByUri,
        projectTypeFileUris,
    });
    const singleDocumentDiagnostics = singleDocumentService.getDiagnostics(
        sessionFor(singleDocumentSource),
        singleDocumentSource,
    ) || [];
    const singleDocumentState = singleDocumentService.getState();
    singleDocumentService.dispose();
    assert(
        !singleDocumentDiagnostics.some((diagnostic) => String(diagnostic.raw) === "2307") &&
            singleDocumentState.projectSnapshotReady === false,
        "Single-document fallback exposed an unreliable unresolved-import diagnostic",
    );
    const boundaryCode = "ERR_AUTOJS6_TYPESCRIPT_NATIVE_DEPENDENCY_UNSUPPORTED";
    const boundaryDetail = `${boundaryCode}: bcrypt contains native-binary; use pure JavaScript or WASM.`;
    const boundaryService = context.AutoJsAceTsLanguageService.create({
        documentUri: "file:///autojs6/editor/src/native-boundary.ts",
        rootUri: "file:///autojs6/editor",
        executionProfile: "rhino",
        typescriptVersion: "6.0.3",
        libraryTextByUri,
        libraryUris,
        projectTypeTextByUri,
        projectTypeFileUris,
        dependencyTypeNames: ["ambient"],
        dependencyBoundaryCode: boundaryCode,
        dependencyBoundaryDetail: boundaryDetail,
        dependencyResolverPolicyRevision: 4,
        dependencyResolverPolicyFingerprint:
            "d8207539237d2a08a6b97b530c5e6215f4b73311fdd6954ce9f8004717ebd635",
    });
    const boundarySource = "export const ready: boolean = true;";
    const boundaryDiagnostics =
        boundaryService.getDiagnostics(sessionFor(boundarySource), boundarySource) || [];
    const boundaryState = boundaryService.getState();
    boundaryService.dispose();
    assert(
        boundaryDiagnostics[0]?.raw === boundaryCode &&
            boundaryDiagnostics[0]?.type === "error" &&
            boundaryDiagnostics[0]?.text === boundaryDetail,
        `Native dependency boundary was not the leading editor diagnostic: ` +
            JSON.stringify(boundaryDiagnostics),
    );
    assert(
        boundaryState.dependencyBoundaryCode === boundaryCode &&
            boundaryState.dependencyBoundaryDetail === boundaryDetail,
        "Native dependency boundary was not retained in language-service state",
    );
    const clientSource = readFileSync(paths.client, "utf8");
    assert(
        clientSource.includes("dependencyBoundaryCode: state.dependencyBoundaryCode") &&
            clientSource.includes("dependencyBoundaryDetail: state.dependencyBoundaryDetail"),
        "LSP client does not forward the dependency boundary into the language service",
    );
    assert(
        clientSource.includes("projectSourceFileUris: copyArray(state.projectSourceFileUris)") &&
            clientSource.includes("projectSnapshotReady: state.projectSnapshotReady"),
        "LSP client does not forward the validated project snapshot into the language service",
    );
    return {
        rhino,
        node,
        singleDocumentFallbackDiagnosticCodes: singleDocumentDiagnostics
            .map((diagnostic) => String(diagnostic.raw)).sort(),
        boundary: {
            code: boundaryDiagnostics[0].raw,
            text: boundaryDiagnostics[0].text,
        },
    };
}

function verifyExecutionProfileConsistency(paths, ts) {
    const context = createBrowserTypeScriptContext(paths);
    const libraryTextByUri = typeScriptLibraryTextByUri(paths);
    libraryTextByUri["file:///autojs6/types/generated/lib.autojs6.core.d.ts"] =
        readFileSync(paths.core, "utf8");
    libraryTextByUri["file:///autojs6/types/lib.autojs6.extra.d.ts"] =
        readFileSync(paths.compatibility, "utf8");
    const executionLibraryUris = [
        "file:///autojs6/typescript/lib.es2018.d.ts",
        "file:///autojs6/types/generated/lib.autojs6.core.d.ts",
        "file:///autojs6/types/lib.autojs6.extra.d.ts",
    ];
    const constants = context.AutoJsAceTsLanguageService?.constants;
    assert(constants?.typescriptVersion === "6.0.3", "Browser profile contract has the wrong TypeScript version");
    assert(constants?.executionProfileRevision === 2, "Browser profile contract has the wrong revision");
    assert(constants?.executionDefaultLib === "lib.es2018.d.ts", "Browser profile contract has the wrong default lib");

    function profileState(profile, documentUri) {
        const service = context.AutoJsAceTsLanguageService.create({
            documentUri,
            executionProfile: profile,
            typescriptVersion: "6.0.3",
            libraryTextByUri,
            libraryUris: executionLibraryUris,
        });
        const text = "const __profileStrictValue: string = null;";
        const diagnostics = service.getDiagnostics(sessionFor(text), text) || [];
        const state = service.getState();
        service.dispose();
        assert(state.ready, `${profile} profile failed to initialize: ${state.reason}`);
        assert(
            diagnostics.some((diagnostic) => String(diagnostic.raw) === "2322"),
            `${profile} profile did not enforce strict null checking`,
        );
        return state;
    }

    const rhino = profileState("rhino", "file:///autojs6/editor/profile-smoke.tsx");
    const node = profileState("node", "file:///autojs6/editor/profile-smoke.mts");
    const rhinoOptions = rhino.compilerOptions || {};
    const nodeOptions = node.compilerOptions || {};
    const commonExpected = {
        allowJs: false,
        allowSyntheticDefaultImports: true,
        alwaysStrict: true,
        checkJs: false,
        esModuleInterop: true,
        forceConsistentCasingInFileNames: true,
        ignoreDeprecations: "6.0",
        incremental: false,
        inlineSourceMap: false,
        inlineSources: false,
        lib: ["lib.es2018.d.ts"],
        newLine: ts.NewLineKind.LineFeed,
        noEmitOnError: true,
        noLib: false,
        outDir: "/outputs",
        rootDir: "/sources",
        skipLibCheck: false,
        sourceMap: true,
        strict: true,
        target: ts.ScriptTarget.ES2018,
        types: [],
    };
    for (const [name, options] of [["rhino", rhinoOptions], ["node", nodeOptions]]) {
        for (const [key, expected] of Object.entries(commonExpected)) {
            assert(
                JSON.stringify(options[key]) === JSON.stringify(expected),
                `${name} profile option ${key} expected ${JSON.stringify(expected)}, got ${JSON.stringify(options[key])}`,
            );
        }
    }
    assert(rhinoOptions.module === ts.ModuleKind.CommonJS, "Rhino module is not CommonJS");
    assert(
        rhinoOptions.moduleResolution === ts.ModuleResolutionKind.Node10,
        "Rhino module resolution is not Node10",
    );
    assert(rhinoOptions.jsx === ts.JsxEmit.React, "Rhino JSX lowering is not classic React mode");
    assert(rhinoOptions.jsxFactory === "__autojs6Tsx", "Rhino JSX factory is not aligned");
    assert(
        rhinoOptions.jsxFragmentFactory === "__autojs6TsxFragment",
        "Rhino JSX fragment factory is not aligned",
    );
    assert(nodeOptions.module === ts.ModuleKind.NodeNext, "Node module is not NodeNext");
    assert(
        nodeOptions.moduleResolution === ts.ModuleResolutionKind.NodeNext,
        "Node module resolution is not NodeNext",
    );
    assert(!Object.hasOwn(nodeOptions, "jsx"), "Node profile unexpectedly enables JSX lowering");

    const mismatched = context.AutoJsAceTsLanguageService.create({
        documentUri: "file:///autojs6/editor/version-mismatch.ts",
        executionProfile: "rhino",
        typescriptVersion: "0.0.0",
        libraryTextByUri,
        libraryUris: executionLibraryUris,
    });
    const mismatchedState = mismatched.getState();
    mismatched.dispose();
    assert(!mismatchedState.ready, "Mismatched TypeScript runtime was accepted");
    assert(
        String(mismatchedState.reason).includes("TypeScript version mismatch"),
        `Unexpected TypeScript mismatch reason: ${mismatchedState.reason}`,
    );

    return {
        typescriptVersion: rhino.version,
        profileRevision: rhino.executionProfileRevision,
        rhinoDefaultLib: rhino.defaultLib,
        rhinoModule: rhinoOptions.module,
        rhinoModuleResolution: rhinoOptions.moduleResolution,
        nodeModule: nodeOptions.module,
        nodeModuleResolution: nodeOptions.moduleResolution,
        versionMismatchRejected: true,
    };
}

function completionItems(service, text, prefix) {
    let completionError = null;
    let completions = null;
    const completed = service.getCompletions(
        sessionFor(text),
        { row: 0, column: text.length },
        prefix,
        (error, result) => {
            completionError = error || null;
            completions = result || [];
        },
        text,
    );
    assert(completed, `Completion did not run for ${text}`);
    assert(!completionError, `Completion failed for ${text}: ${completionError}`);
    assert(Array.isArray(completions), `Completion did not return an array for ${text}`);
    return completions;
}

function completionNames(service, text, prefix) {
    return completionItems(service, text, prefix)
        .map((item) => String(item?.caption || item?.value || ""));
}

function verifyOptionalGroupCompletions(paths) {
    const context = createBrowserTypeScriptContext(paths);
    const libraryTextByUri = typeScriptLibraryTextByUri(paths);
    const groupPaths = [
        ["core", paths.core],
        ["android", paths.android],
        ["libraries", paths.libraries],
        ["resources", paths.resources],
        ["main-app", paths["main-app"]],
    ];
    const libraryUris = ["file:///autojs6/typescript/lib.es2022.d.ts"];
    for (const [groupId, declarationPath] of groupPaths) {
        const uri = `file:///autojs6/types/generated/lib.autojs6.${groupId}.d.ts`;
        libraryUris.push(uri);
        libraryTextByUri[uri] = readFileSync(declarationPath, "utf8");
    }
    const compatibilityUri = "file:///autojs6/types/lib.autojs6.extra.d.ts";
    libraryUris.push(compatibilityUri);
    libraryTextByUri[compatibilityUri] = readFileSync(paths.compatibility, "utf8");

    const errors = [];
    const service = context.AutoJsAceTsLanguageService.create({
        checkJs: true,
        documentUri: "file:///autojs6/editor/optional-groups-smoke.js",
        libraryTextByUri,
        libraryUris,
        notifyError: (message) => errors.push(String(message)),
    });
    const appNames = completionNames(service, "App.CHR", "CHR");
    const resourceTextNames = completionNames(service, "R.string.text_", "text_");
    const resourceAndroidNames = completionNames(service, "R.string.android_", "android_");
    const actionBarNames = completionNames(
        service,
        "androidx.appcompat.app.ActionBar.DIS",
        "DIS",
    );
    const resourceEmptyItems = completionItems(service, "R.string.", "");
    const actionBarEmptyItems = completionItems(
        service,
        "androidx.appcompat.app.ActionBar.",
        "",
    );
    const resourceEmptyTsItems = resourceEmptyItems.filter(
        (item) => item?.autojs6Ts === true,
    );
    const actionBarEmptyTsItems = actionBarEmptyItems.filter(
        (item) => item?.autojs6Ts === true,
    );
    const semanticText = [
        "App.CHROME;",
        "R.string.text_about;",
        "androidx.appcompat.app.ActionBar.DISPLAY_HOME_AS_UP;",
    ].join("\n");
    const diagnostics = service.getDiagnostics(sessionFor(semanticText), semanticText) || [];
    const state = service.getState();
    service.dispose();

    assert(state.ready, `Optional-group language service is not ready: ${state.reason}`);
    assert(errors.length === 0, `Optional-group language service reported: ${errors.join("; ")}`);
    assert(appNames.includes("CHROME"), "App.CHR did not suggest CHROME");
    assert(resourceTextNames.includes("text_about"), "R.string.text_ did not suggest text_about");
    assert(
        resourceTextNames.length <= 300 &&
        resourceTextNames.every((name) => name.toLowerCase().startsWith("text_")),
        "R.string.text_ did not prioritize direct prefix matches before the completion limit",
    );
    assert(
        resourceAndroidNames.includes("android_black"),
        "R.string.android_ did not suggest android_black",
    );
    assert(
        actionBarNames.includes("DISPLAY_HOME_AS_UP"),
        "ActionBar.DIS did not retain DISPLAY_HOME_AS_UP",
    );
    assert(
        resourceEmptyItems.length === 300,
        `R.string. returned ${resourceEmptyItems.length} empty-prefix completions instead of the capped page`,
    );
    assert(
        resourceEmptyTsItems.length === resourceEmptyItems.length &&
        resourceEmptyTsItems.every((item) => item.autojs6Incomplete === true),
        "R.string. did not mark its truncated TypeScript completion page as incomplete",
    );
    assert(
        actionBarEmptyTsItems.length === actionBarEmptyItems.length &&
        actionBarEmptyTsItems.length > 0 &&
        actionBarEmptyTsItems.every((item) => item.autojs6Incomplete === false),
        "ActionBar. did not mark its complete TypeScript completion page as complete",
    );
    assert(
        diagnostics.length === 0,
        "Optional-group semantic smoke test failed: " +
        diagnostics.map((diagnostic) => diagnostic.text).join("; "),
    );
    return {
        loadedLibraryCount: state.libraryCount,
        appCompletionCount: appNames.length,
        resourceTextCompletionCount: resourceTextNames.length,
        resourceAndroidCompletionCount: resourceAndroidNames.length,
        actionBarCompletionCount: actionBarNames.length,
        resourceEmptyCompletionCount: resourceEmptyItems.length,
        resourceEmptyIncomplete: true,
        actionBarEmptyCompletionCount: actionBarEmptyItems.length,
        actionBarEmptyIncomplete: false,
        semanticDiagnosticCount: diagnostics.length,
    };
}

function createFakeTimer() {
    let nextId = 1;
    const entries = new Map();
    const activeIds = new Set();
    return {
        setTimeout(callback, delayMs) {
            const id = nextId++;
            entries.set(id, { callback, delayMs });
            activeIds.add(id);
            return id;
        },
        clearTimeout(id) {
            activeIds.delete(id);
        },
        pendingCount() {
            return activeIds.size;
        },
        scheduledCount() {
            return entries.size;
        },
        latestId() {
            return entries.size > 0 ? Math.max(...entries.keys()) : null;
        },
        delayFor(id) {
            return entries.get(id)?.delayMs;
        },
        run(id, includeCancelled = false) {
            const entry = entries.get(id);
            if (!entry || (!includeCancelled && !activeIds.has(id))) {
                return false;
            }
            activeIds.delete(id);
            entry.callback();
            return true;
        },
        runPending() {
            const ids = [...activeIds];
            for (const id of ids) {
                this.run(id);
            }
            return ids.length;
        },
    };
}

function createCompletionRefreshHarness(createController, initialText) {
    let text = initialText;
    let clock = 0;
    let detachCount = 0;
    const commands = [];
    const timer = createFakeTimer();
    const session = {
        getLength: () => 1,
        getLine: (row) => row === 0 ? text : "",
        getValue: () => text,
    };
    const editor = {
        session,
        completer: {
            activated: true,
            popup: {
                isOpen: true,
            },
            detach() {
                detachCount++;
            },
        },
        execCommand(command) {
            commands.push(command);
        },
        getCursorPosition() {
            return { row: 0, column: text.length };
        },
    };
    const controller = createController({
        editor,
        now: () => ++clock,
        timer,
    });
    return {
        commands,
        controller,
        editor,
        session,
        timer,
        detachCount: () => detachCount,
        setText(value) {
            text = value;
        },
    };
}

function tsCompletion(incomplete) {
    return {
        autojs6Incomplete: incomplete,
        autojs6Ts: true,
        caption: "test",
        value: "test",
    };
}

function verifyCompletionRefreshController(paths) {
    const context = {
        clearTimeout,
        console,
        Date,
        isFinite,
        JSON,
        Math,
        performance,
        setTimeout,
    };
    context.window = context;
    vm.createContext(context);
    vm.runInContext(readFileSync(paths.client, "utf8"), context, {
        filename: basename(paths.client),
    });
    const createController =
        context.AutoJsAceLspClient?.createCompletionRefreshController;
    assert(
        typeof createController === "function",
        "LSP client did not export createCompletionRefreshController",
    );

    const debounce = createCompletionRefreshHarness(createController, "R.string.");
    assert(
        debounce.controller.recordRequest(
            debounce.session,
            { row: 0, column: "R.string.".length },
            "",
            [tsCompletion(true)],
        ),
        "Incomplete R.string. completion request was not recorded",
    );
    for (const prefix of ["t", "te", "tex", "text", "text_"]) {
        debounce.setText(`R.string.${prefix}`);
        assert(
            debounce.controller.schedule(),
            `Incomplete R.string.${prefix} completion refresh was not scheduled`,
        );
        assert(
            debounce.timer.pendingCount() === 1,
            `R.string.${prefix} left more than one live debounce timer`,
        );
    }
    const debounceTimerId = debounce.timer.latestId();
    assert(
        debounce.timer.delayFor(debounceTimerId) === 100,
        "Completion refresh debounce delay is not 100 ms",
    );
    assert(
        debounce.controller.getState().scheduled?.prefix === "text_",
        "Completion refresh did not retain the latest text_ prefix",
    );
    assert(
        debounce.timer.runPending() === 1,
        "Completion refresh debounce did not collapse to one execution",
    );
    assert(
        debounce.detachCount() === 1 &&
        JSON.stringify(debounce.commands) === JSON.stringify(["startAutocomplete"]),
        "Completion refresh did not detach and restart Ace autocomplete exactly once",
    );

    const completeExtension = createCompletionRefreshHarness(
        createController,
        "androidx.appcompat.app.ActionBar.",
    );
    assert(
        completeExtension.controller.recordRequest(
            completeExtension.session,
            {
                row: 0,
                column: "androidx.appcompat.app.ActionBar.".length,
            },
            "",
            [tsCompletion(false)],
        ),
        "Complete ActionBar. completion request was not recorded",
    );
    completeExtension.setText("androidx.appcompat.app.ActionBar.D");
    assert(
        !completeExtension.controller.schedule() &&
        completeExtension.timer.pendingCount() === 0,
        "Complete ActionBar. prefix extension unnecessarily restarted completion",
    );

    const shrink = createCompletionRefreshHarness(
        createController,
        "R.string.text_",
    );
    assert(
        shrink.controller.recordRequest(
            shrink.session,
            { row: 0, column: "R.string.text_".length },
            "text_",
            [tsCompletion(false)],
        ),
        "Narrow complete R.string.text_ request was not recorded",
    );
    shrink.setText("R.string.tex");
    assert(
        shrink.controller.schedule() && shrink.timer.runPending() === 1,
        "Shrinking a complete member prefix did not schedule a fresh request",
    );
    assert(
        shrink.detachCount() === 1 &&
        shrink.commands[0] === "startAutocomplete",
        "Shrinking a complete member prefix did not restart autocomplete",
    );

    const rewrite = createCompletionRefreshHarness(
        createController,
        "R.string.text_",
    );
    assert(
        rewrite.controller.recordRequest(
            rewrite.session,
            { row: 0, column: "R.string.text_".length },
            "text_",
            [tsCompletion(false)],
        ),
        "Complete member prefix for rewrite verification was not recorded",
    );
    rewrite.setText("R.string.toast_");
    assert(
        rewrite.controller.schedule() && rewrite.timer.runPending() === 1,
        "Rewriting a complete member prefix did not schedule a fresh request",
    );
    assert(
        rewrite.detachCount() === 1 &&
        rewrite.commands[0] === "startAutocomplete",
        "Rewriting a complete member prefix did not restart autocomplete",
    );

    const staticOnly = createCompletionRefreshHarness(createController, "R.string.");
    assert(
        !staticOnly.controller.recordRequest(
            staticOnly.session,
            { row: 0, column: "R.string.".length },
            "",
            [{ caption: "static", value: "static" }],
        ),
        "Static completion was incorrectly recorded as a TypeScript request",
    );
    staticOnly.setText("R.string.t");
    assert(
        !staticOnly.controller.schedule() &&
        staticOnly.timer.pendingCount() === 0 &&
        staticOnly.detachCount() === 0,
        "Static-only completion triggered a semantic refresh",
    );

    const cancelled = createCompletionRefreshHarness(createController, "R.string.");
    cancelled.controller.recordRequest(
        cancelled.session,
        { row: 0, column: "R.string.".length },
        "",
        [tsCompletion(true)],
    );
    cancelled.setText("R.string.t");
    assert(cancelled.controller.schedule(), "Cancel verification was not scheduled");
    const cancelledTimerId = cancelled.timer.latestId();
    assert(cancelled.controller.cancel(), "Pending completion refresh was not cancelled");
    assert(
        cancelled.timer.pendingCount() === 0,
        "Cancelled completion refresh retained a live timer",
    );
    cancelled.timer.run(cancelledTimerId, true);
    assert(
        cancelled.detachCount() === 0 && cancelled.commands.length === 0,
        "A cancelled completion timer revived autocomplete",
    );

    const replaced = createCompletionRefreshHarness(createController, "R.string.");
    replaced.controller.recordRequest(
        replaced.session,
        { row: 0, column: "R.string.".length },
        "",
        [tsCompletion(true)],
    );
    replaced.setText("R.string.t");
    assert(replaced.controller.schedule(), "Request replacement verification was not scheduled");
    const replacedTimerId = replaced.timer.latestId();
    replaced.controller.recordRequest(
        replaced.session,
        { row: 0, column: "R.string.t".length },
        "t",
        [tsCompletion(false)],
    );
    replaced.timer.run(replacedTimerId, true);
    assert(
        replaced.detachCount() === 0 && replaced.commands.length === 0,
        "A timer from a replaced completion request revived autocomplete",
    );

    const popupClosed = createCompletionRefreshHarness(createController, "R.string.");
    popupClosed.controller.recordRequest(
        popupClosed.session,
        { row: 0, column: "R.string.".length },
        "",
        [tsCompletion(true)],
    );
    popupClosed.setText("R.string.t");
    assert(popupClosed.controller.schedule(), "Closed-popup verification was not scheduled");
    popupClosed.editor.completer.popup.isOpen = false;
    popupClosed.timer.runPending();
    assert(
        popupClosed.detachCount() === 0 && popupClosed.commands.length === 0,
        "Completion refresh reopened a popup that the user had closed",
    );

    const destroyed = createCompletionRefreshHarness(createController, "R.string.");
    destroyed.controller.recordRequest(
        destroyed.session,
        { row: 0, column: "R.string.".length },
        "",
        [tsCompletion(true)],
    );
    destroyed.setText("R.string.t");
    assert(destroyed.controller.schedule(), "Destroy verification was not scheduled");
    const destroyedTimerId = destroyed.timer.latestId();
    destroyed.controller.destroy();
    destroyed.timer.run(destroyedTimerId, true);
    assert(
        destroyed.controller.getState().destroyed &&
        destroyed.detachCount() === 0 &&
        destroyed.commands.length === 0,
        "A destroyed completion controller revived autocomplete",
    );

    return {
        debounceDelayMs: debounce.timer.delayFor(debounceTimerId),
        rapidPrefixChanges: debounce.timer.scheduledCount(),
        debouncedRestartCount: debounce.controller.getState().restartCount,
        completeExtensionRestartCount:
            completeExtension.controller.getState().restartCount,
        shrinkRestartCount: shrink.controller.getState().restartCount,
        rewriteRestartCount: rewrite.controller.getState().restartCount,
        staticRefreshCount: staticOnly.controller.getState().restartCount,
        staleTimerChecks: 4,
    };
}

function verifyOldWebViewFallback(paths) {
    const appendedScripts = [];
    const notifications = [];
    const timers = [];
    const context = {
        Date,
        Function() {
            throw new SyntaxError("Unexpected token ?");
        },
        JSON,
        Math,
        clearTimeout() {
        },
        console,
        document: {
            createElement: () => ({}),
            head: {
                appendChild(script) {
                    appendedScripts.push(script.src);
                },
            },
        },
        isFinite,
        setTimeout(callback, delayMs) {
            timers.push({ callback, delayMs });
            return timers.length;
        },
    };
    context.window = context;
    vm.createContext(context);
    vm.runInContext(readFileSync(paths.client, "utf8"), context, {
        filename: basename(paths.client),
    });

    const staticCompletion = { caption: "staticApi", value: "staticApi" };
    const session = {
        getLength: () => 1,
        getLine: () => "",
        getValue: () => "",
        off() {
        },
        on() {
        },
        setAnnotations() {
        },
    };
    const client = context.AutoJsAceLspClient.createClient({
        getOptions: () => JSON.stringify({
            documentUri: "file:///autojs6/editor/current.js",
            enabled: true,
            libraryUris: [
                "autojs6/typescript/lib.es2022.d.ts",
                "autojs6/types/generated/lib.autojs6.core.d.ts",
                "autojs6/types/lib.autojs6.extra.d.ts",
            ],
        }),
        getStaticCompleter: () => ({
            getCompletions(_editor, _session, _position, _prefix, callback) {
                callback(null, [staticCompletion]);
            },
        }),
        notifyError: (message) => notifications.push(String(message)),
        session,
    });

    for (let attempt = 0; attempt < 3; attempt += 1) {
        client.warmUp(() => {
        });
    }
    const completionResults = [];
    for (let attempt = 0; attempt < 3; attempt += 1) {
        client.getCompletions(
            null,
            session,
            { row: 0, column: 0 },
            "",
            (_error, results) => completionResults.push(results || []),
        );
    }
    const state = client.getState();
    client.destroy();

    assert(appendedScripts.length === 0, "Old WebView attempted to load the TypeScript 6 runtime");
    assert(
        notifications.length === 1,
        `Old WebView compatibility warning was emitted ${notifications.length} times`,
    );
    assert(
        completionResults.length === 3 &&
        completionResults.every(
            (items) => items.length === 1 && items[0].caption === staticCompletion.caption,
        ),
        "Old WebView did not consistently use static completion",
    );
    assert(state.tsLoader?.state === "failed", "Old WebView TypeScript loader was not disabled");
    assert(
        state.tsLoader?.compatibilityReason,
        "Old WebView compatibility reason was not retained",
    );
    return {
        appendedScriptCount: appendedScripts.length,
        compatibilityNotificationCount: notifications.length,
        staticCompletionChecks: completionResults.length,
    };
}

function main() {
    const paths = parseArguments(process.argv.slice(2));
    const require = createRequire(import.meta.url);
    const ts = require(paths.runtime);
    assert(ts?.version === "6.0.3", `Expected TypeScript 6.0.3, got ${ts?.version || "unknown"}`);

    const semantics = verifyCompatibilitySemantics(paths, ts);
    const browserService = verifyBrowserLanguageService(paths, ts.version);
    const dependencyTypes = verifyDependencyTypeLayer(paths);
    const executionProfiles = verifyExecutionProfileConsistency(paths, ts);
    const optionalGroups = verifyOptionalGroupCompletions(paths);
    const completionRefresh = verifyCompletionRefreshController(paths);
    const oldWebView = verifyOldWebViewFallback(paths);
    process.stdout.write(
        `${JSON.stringify({
            typescriptVersion: ts.version,
            semantics,
            browserService,
            dependencyTypes,
            executionProfiles,
            optionalGroups,
            completionRefresh,
            oldWebView,
        }, null, 2)}\n`,
    );
}

try {
    main();
} catch (error) {
    process.stderr.write(`${error?.stack || error}\n`);
    process.exitCode = 1;
}
