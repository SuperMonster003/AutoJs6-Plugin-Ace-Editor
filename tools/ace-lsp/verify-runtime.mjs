import { readFileSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { basename, dirname, join, resolve } from "node:path";
import { performance } from "node:perf_hooks";
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
        "--semantic-provider",
        "--python-provider",
        "--lua-provider",
        "--lsp-core",
        "--lsp-transports",
        "--client",
        "--completer",
        "--local-symbols",
        "--language-indices",
        "--ace-assets",
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
                "--semantic-provider <autojs6_semantic_provider.js> " +
                "--python-provider <autojs6_python_provider.js> " +
                "--lua-provider <autojs6_lua_provider.js> " +
                "--lsp-core <autojs6_lsp_core.js> " +
                "--lsp-transports <autojs6_lsp_transports.js> " +
                "--client <autojs6_lsp_client.js> " +
                "--completer <autojs6_completer.js> " +
                "--local-symbols <autojs6_local_symbols.js> " +
                "--language-indices <indices-directory> " +
                "--ace-assets <src-min-noconflict> --core <generated-core.d.ts> " +
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

function loadClientRuntime(context, paths) {
    for (const file of [
        paths["semantic-provider"],
        paths["python-provider"],
        paths["lua-provider"],
        paths.client,
    ]) {
        vm.runInContext(readFileSync(file, "utf8"), context, {
            filename: basename(file),
        });
    }
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

    const unsupportedService = context.AutoJsAceTsLanguageService.create({
        documentUri: "file:///autojs6/editor/not-javascript.py",
    });
    const unsupportedState = unsupportedService.getState();
    const unsupportedDiagnostics = unsupportedService.getDiagnostics(
        sessionFor("files.read('/tmp/value')"),
        "files.read('/tmp/value')",
    );
    unsupportedService.dispose();
    assert(!unsupportedState.ready, "Python document unexpectedly initialized the TS service");
    assert(
        unsupportedState.reason.includes("unsupported document type"),
        `Unknown extension rejection reason was lost: ${unsupportedState.reason}`,
    );
    assert(
        unsupportedDiagnostics === null,
        "Python document unexpectedly produced TypeScript diagnostics",
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
        unsupportedDocumentRejected: true,
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

    function verifyProjectRename(profile, suffix) {
        const documentUri = `file:///autojs6/editor/rename/main.${suffix}`;
        const sharedUri = `file:///autojs6/editor/rename/shared.${suffix}`;
        const consumerUri = `file:///autojs6/editor/rename/consumer.${suffix}`;
        const sharedSpecifier = profile === "node" ? "./shared.mjs" : "./shared";
        const sources = {
            [documentUri]: [
                `import { answer } from "${sharedSpecifier}";`,
                'export const mainValue = answer("main");',
            ].join("\n"),
            [sharedUri]: [
                "export function answer(value: string): number {",
                "  return value.length;",
                "}",
            ].join("\n"),
            [consumerUri]: [
                `import { answer } from "${sharedSpecifier}";`,
                'export const consumed = answer("consumer");',
            ].join("\n"),
        };
        const sourceUris = Object.keys(sources).sort();
        function createService(currentUri, sourceMap) {
            return context.AutoJsAceTsLanguageService.create({
                documentUri: currentUri,
                rootUri: "file:///autojs6/editor",
                executionProfile: profile,
                typescriptVersion: "6.0.3",
                libraryTextByUri,
                libraryUris,
                projectSourceTextByUri: sourceMap,
                projectSourceFileUris: sourceUris,
                projectSourceInventoryFingerprint:
                    "2222222222222222222222222222222222222222222222222222222222222222",
                projectSourceFileCount: sourceUris.length,
                projectSourceByteLength: Object.values(sourceMap)
                    .reduce((total, text) => total + Buffer.byteLength(text, "utf8"), 0),
                projectSnapshotSchemaRevision: 1,
                projectSnapshotReady: true,
            });
        }

        const service = createService(documentUri, sources);
        const mainSource = sources[documentUri];
        const invocationColumn = mainSource.split("\n")[1].indexOf("answer") + 2;
        const candidate = service.getRename(
            sessionFor(mainSource),
            { row: 1, column: invocationColumn },
            mainSource,
        );
        service.dispose();
        assert(
            candidate?.symbolName === "answer" && candidate.files.length === 3 &&
                candidate.files.reduce((total, file) => total + file.edits.length, 0) === 5,
            `${profile} did not return the exact three-file rename set: ${JSON.stringify(candidate)}`,
        );

        const newName = "projectAnswer";
        const renamedSources = { ...sources };
        candidate.files.forEach((file) => {
            let text = renamedSources[file.uri];
            assert(typeof text === "string", `${profile} rename escaped project sources`);
            [...file.edits].reverse().forEach((edit) => {
                assert(
                    text.substring(edit.startOffset, edit.endOffset) === candidate.symbolName,
                    `${profile} rename span did not select the old symbol`,
                );
                text = text.substring(0, edit.startOffset) + newName +
                    text.substring(edit.endOffset);
            });
            renamedSources[file.uri] = text;
        });
        const renamedDiagnostics = sourceUris.flatMap((uri) => {
            const renamedService = createService(uri, renamedSources);
            const diagnostics = renamedService.getDiagnostics(
                sessionFor(renamedSources[uri]),
                renamedSources[uri],
            ) || [];
            renamedService.dispose();
            return diagnostics.map((diagnostic) => ({ uri, diagnostic }));
        });
        assert(
            renamedDiagnostics.length === 0,
            `${profile} three-file rename did not compile cleanly: ` +
                JSON.stringify(renamedDiagnostics),
        );
        return {
            fileCount: candidate.files.length,
            editCount: candidate.files.reduce((total, file) => total + file.edits.length, 0),
            renamedDiagnosticCount: renamedDiagnostics.length,
            newName,
        };
    }

    const rhino = verifyProfile("rhino", "ts");
    const node = verifyProfile("node", "mts");
    const projectRename = {
        rhino: verifyProjectRename("rhino", "ts"),
        node: verifyProjectRename("node", "mts"),
    };
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
        projectRename,
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

function verifyIncrementalProjectDiagnostics(paths) {
    const context = createBrowserTypeScriptContext(paths);
    const libraryTextByUri = typeScriptLibraryTextByUri(paths);
    libraryTextByUri["file:///autojs6/types/generated/lib.autojs6.core.d.ts"] =
        readFileSync(paths.core, "utf8");
    libraryTextByUri["file:///autojs6/types/lib.autojs6.extra.d.ts"] =
        readFileSync(paths.compatibility, "utf8");

    const rootUri = "file:///autojs6/editor/save-diagnostics";
    const documentUri = `${rootUri}/main.ts`;
    const sourceTextByUri = {
        [documentUri]: [
            'import { sharedValue } from "./file01";',
            "export const checked: number = sharedValue;",
        ].join("\n"),
    };
    for (let index = 1; index < 20; index += 1) {
        const suffix = String(index).padStart(2, "0");
        sourceTextByUri[`${rootUri}/file${suffix}.ts`] = index === 1 ?
            "export const sharedValue = 42;" :
            `export const value${suffix} = ${index};`;
    }
    const projectSourceFileUris = Object.keys(sourceTextByUri).sort();
    const sourceByteLength = (sources) => Object.values(sources)
        .reduce((total, text) => total + Buffer.byteLength(text, "utf8"), 0);
    const service = context.AutoJsAceTsLanguageService.create({
        documentUri,
        rootUri,
        executionProfile: "rhino",
        typescriptVersion: "6.0.3",
        libraryTextByUri,
        projectSourceTextByUri: sourceTextByUri,
        projectSourceFileUris,
        projectSourceInventoryFingerprint: "1".repeat(64),
        projectSourceFileCount: projectSourceFileUris.length,
        projectSourceByteLength: sourceByteLength(sourceTextByUri),
        projectSnapshotSchemaRevision: 1,
        projectSnapshotReady: true,
    });
    const documentText = sourceTextByUri[documentUri];
    const initialDiagnostics = service.getDiagnostics(
        sessionFor(documentText),
        documentText,
    ) || [];
    const initialState = service.getState();

    const refreshedTextByUri = {
        ...sourceTextByUri,
        [`${rootUri}/file01.ts`]: 'export const sharedValue = "saved";',
        // The active editor buffer remains authoritative even if the disk snapshot contains
        // a different current-file value while a capture is in flight.
        [documentUri]: "export const diskOnly = true;",
    };
    const refreshStartedAt = performance.now();
    const refreshResult = service.updateProjectSnapshot({
        projectSourceTextByUri: refreshedTextByUri,
        projectSourceFileUris,
        projectSourceInventoryFingerprint: "2".repeat(64),
        projectSourceFileCount: projectSourceFileUris.length,
        projectSourceByteLength: sourceByteLength(refreshedTextByUri),
        projectSnapshotSchemaRevision: 1,
        projectSnapshotReady: true,
    });
    const refreshedDiagnostics = service.getDiagnostics(
        sessionFor(documentText),
        documentText,
    ) || [];
    const refreshDurationMs = performance.now() - refreshStartedAt;
    const refreshedState = service.getState();

    const incompleteTextByUri = { ...refreshedTextByUri };
    delete incompleteTextByUri[`${rootUri}/file19.ts`];
    const rejectedResult = service.updateProjectSnapshot({
        projectSourceTextByUri: incompleteTextByUri,
        projectSourceFileUris,
        projectSourceInventoryFingerprint: "3".repeat(64),
        projectSourceFileCount: projectSourceFileUris.length,
        projectSourceByteLength: sourceByteLength(incompleteTextByUri),
        projectSnapshotSchemaRevision: 1,
        projectSnapshotReady: true,
    });
    const stateAfterRejectedRefresh = service.getState();
    service.dispose();

    assert(projectSourceFileUris.length === 20, "Incremental diagnostic fixture is not 20 files");
    assert(
        initialState.ready && initialDiagnostics.length === 0,
        `Initial 20-file project was not clean: ${JSON.stringify(initialDiagnostics)}`,
    );
    assert(
        refreshResult?.updated === true && refreshResult.changedFileCount === 1,
        `Resident project refresh did not update exactly one sibling: ${JSON.stringify(refreshResult)}`,
    );
    assert(
        refreshedDiagnostics.some((diagnostic) => String(diagnostic.raw) === "2322"),
        `Saved sibling change did not refresh TS2322: ${JSON.stringify(refreshedDiagnostics)}`,
    );
    assert(
        refreshedState.projectSourceInventoryFingerprint === "2".repeat(64) &&
            refreshedState.projectSnapshotUpdateCount === 1 &&
            refreshedState.projectSnapshotChangedFileCount === 1 &&
            refreshedState.loadedProjectSourceFileCount === 20,
        `Resident project metadata was not advanced: ${JSON.stringify(refreshedState)}`,
    );
    assert(
        rejectedResult?.updated === false &&
            stateAfterRejectedRefresh.projectSourceInventoryFingerprint === "2".repeat(64) &&
            stateAfterRejectedRefresh.projectSnapshotUpdateCount === 1,
        "A partial project snapshot escaped the transactional refresh boundary",
    );
    assert(
        refreshDurationMs < 1000,
        `Desktop 20-file incremental diagnostics exceeded 1 s: ${refreshDurationMs.toFixed(1)} ms`,
    );
    return {
        projectSourceFileCount: projectSourceFileUris.length,
        changedFileCount: refreshResult.changedFileCount,
        diagnosticCodes: refreshedDiagnostics.map((diagnostic) => Number(diagnostic.raw)).sort(),
        refreshDurationMs: Number(refreshDurationMs.toFixed(1)),
        rejectedPartialRefresh: rejectedResult.updated === false,
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

function verifyDiagnosticScheduler(paths) {
    const timer = createFakeTimer();
    let text = "export const checked: number = 42;";
    let changeListener = null;
    let diagnosticsCallCount = 0;
    let serviceCreateCount = 0;
    let serviceDisposeCount = 0;
    let snapshotUpdateCount = 0;
    let annotationPublishCount = 0;
    const publishedStates = [];
    const options = {
        documentUri: "file:///autojs6/editor/save-diagnostics/main.ts",
        enabled: true,
        rootUri: "file:///autojs6/editor/save-diagnostics",
        typescriptVersion: "6.0.3",
        typescriptProfile: "rhino",
        typescriptProfileRevision: 2,
        projectSourceFileUris: [
            "file:///autojs6/editor/save-diagnostics/main.ts",
            "file:///autojs6/editor/save-diagnostics/shared.ts",
        ],
        projectSourceInventoryFingerprint: "a".repeat(64),
        projectSourceFileCount: 2,
        projectSourceByteLength: 64,
        projectSnapshotSchemaRevision: 1,
        projectSnapshotReady: true,
    };
    const session = {
        getLength: () => 1,
        getLine: () => text,
        getValue: () => text,
        getDocument: () => ({ getNewLineCharacter: () => "\n" }),
        on(name, callback) {
            if (name === "change") changeListener = callback;
        },
        off(name, callback) {
            if (name === "change" && changeListener === callback) changeListener = null;
        },
        setAnnotations() {
            annotationPublishCount++;
        },
    };
    const fakeService = {
        dispose() {
            serviceDisposeCount++;
        },
        getDiagnostics() {
            diagnosticsCallCount++;
            return [{
                row: 0,
                column: 0,
                text: "scheduled diagnostic",
                type: "error",
                raw: "2322",
                source: "autojs6-ts",
            }];
        },
        getState() {
            return {
                ready: true,
                projectSnapshotReady: true,
                projectSourceFileCount: 2,
                loadedProjectSourceFileCount: 2,
                projectSnapshotUpdateCount: snapshotUpdateCount,
            };
        },
        setDocumentUri() {
            return false;
        },
        updateProjectSnapshot() {
            snapshotUpdateCount++;
            return { updated: true, changedFileCount: 1 };
        },
    };
    const context = {
        clearTimeout: (id) => timer.clearTimeout(id),
        console,
        Date,
        Function,
        isFinite,
        JSON,
        Math,
        performance,
        setTimeout: (callback, delayMs) => timer.setTimeout(callback, delayMs),
        AutoJsAceTsLanguageService: {
            create() {
                serviceCreateCount++;
                return fakeService;
            },
        },
    };
    context.window = context;
    vm.createContext(context);
    loadClientRuntime(context, paths);
    const client = context.AutoJsAceLspClient.createClient({
        getOptions: () => JSON.stringify(options),
        onDiagnosticsPublished: (state) => publishedStates.push(state),
        session,
    });
    client.warmUp();
    timer.runPending();
    const diagnosticsAfterWarmUp = diagnosticsCallCount;

    let firstRapidTimerId = null;
    for (let index = 0; index < 5; index += 1) {
        text += " ";
        changeListener?.({ action: "insert", lines: [" "] });
        if (index === 0) firstRapidTimerId = timer.latestId();
        assert(timer.pendingCount() === 1, "Rapid edits retained multiple diagnostic timers");
    }
    assert(
        timer.delayFor(timer.latestId()) === 450,
        "Idle diagnostic debounce delay is not 450 ms",
    );
    timer.run(firstRapidTimerId, true);
    assert(
        diagnosticsCallCount === diagnosticsAfterWarmUp && timer.pendingCount() === 1,
        "A cancelled diagnostic generation published stale annotations",
    );
    timer.runPending();
    const idleState = client.getState();
    assert(
        diagnosticsCallCount === diagnosticsAfterWarmUp + 1 &&
            idleState.lastDiagnosticReason === "idle-change" &&
            idleState.diagnosticPublishCount >= 2 &&
            idleState.lastPublishedDiagnosticGeneration === idleState.diagnosticGeneration,
        `Latest idle diagnostic generation was not published: ${JSON.stringify(idleState)}`,
    );

    options.projectSourceInventoryFingerprint = "b".repeat(64);
    options.projectSourceByteLength += 1;
    const stateAfterRefresh = client.refresh("project-snapshot");
    const snapshotTimerId = timer.latestId();
    assert(
        serviceCreateCount === 1 && serviceDisposeCount === 0 && snapshotUpdateCount === 1 &&
            stateAfterRefresh.projectSnapshotIncrementalRefreshCount === 1,
        `Project save rebuilt the resident service: ${JSON.stringify(stateAfterRefresh)}`,
    );
    assert(
        timer.pendingCount() === 1 && timer.delayFor(snapshotTimerId) === 50,
        "Project snapshot diagnostics did not use the 50 ms save budget",
    );
    timer.runPending();
    const snapshotState = client.getState();
    assert(
        snapshotState.lastDiagnosticReason === "project-snapshot" &&
            snapshotState.tsServiceInstanceRevision === 1 &&
            snapshotState.tsServiceDisposeCount === 0 &&
            snapshotState.projectSnapshotChangedFileCount === 1 &&
            snapshotState.diagnosticsCount === 1 &&
            annotationPublishCount === diagnosticsCallCount &&
            publishedStates.length === diagnosticsCallCount,
        `Saved project diagnostics lost resident-service telemetry: ${JSON.stringify(snapshotState)}`,
    );
    client.destroy();
    return {
        idleDebounceDelayMs: idleState.diagnosticDebounceDelayMs,
        projectSnapshotDelayMs: snapshotState.projectSnapshotDiagnosticDelayMs,
        rapidEditCount: 5,
        staleGenerationChecks: 1,
        serviceCreateCount,
        saveServiceDisposeCount: snapshotState.tsServiceDisposeCount,
        destroyServiceDisposeCount: serviceDisposeCount,
        projectSnapshotIncrementalRefreshCount:
            snapshotState.projectSnapshotIncrementalRefreshCount,
        diagnosticPublishCount: snapshotState.diagnosticPublishCount,
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
    loadClientRuntime(context, paths);
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

function languageSession(modeId, text) {
    const session = sessionFor(text);
    session.getMode = () => ({ $id: modeId });
    session.getDocument = () => ({ getNewLineCharacter: () => "\n" });
    session.on = () => {};
    session.off = () => {};
    session.setAnnotations = () => {};
    return session;
}

function verifyCompleterLanguageIsolation(paths) {
    const context = { console };
    context.window = context;
    vm.createContext(context);
    vm.runInContext(readFileSync(paths.completer, "utf8"), context, {
        filename: basename(paths.completer),
    });
    const completer = context.AutoJsAceCompleter.createCompleter({
        globals: [{ name: "files", type: "module", doc: "AutoJs6 files module" }],
        modules: {
            files: [{ name: "read", type: "function", signature: "read(path): string" }],
        },
    });
    function completions(modeId) {
        const session = languageSession(modeId, "files.");
        let result = null;
        completer.getCompletions(
            null,
            session,
            { row: 0, column: 6 },
            "",
            (_error, items) => { result = items || []; },
        );
        return result;
    }
    const javascript = completions("ace/mode/javascript");
    const typescript = completions("ace/mode/typescript");
    const isolatedModes = [
        "ace/mode/json",
        "ace/mode/text",
        "ace/mode/python",
        "ace/mode/lua",
        "ace/mode/java",
        "ace/mode/kotlin",
    ];
    assert(
        javascript.some((item) => item.caption === "read") &&
            typescript.some((item) => item.caption === "read"),
        "AutoJs6 static completion disappeared from the JS/TS family",
    );
    isolatedModes.forEach((modeId) => {
        assert(
            completions(modeId).length === 0,
            `${modeId} received AutoJs6 static completions`,
        );
    });
    assert(
        completer.getHover(languageSession("ace/mode/json", "files"), { row: 0, column: 2 }) === null,
        "JSON received AutoJs6 hover information",
    );
    assert(
        completer.getSignatureHelp(
            languageSession("ace/mode/text", "files.read("),
            { row: 0, column: 11 },
        ) === null,
        "Plain text received AutoJs6 signature help",
    );
    return {
        javascriptCompletionCount: javascript.length,
        typescriptCompletionCount: typescript.length,
        isolatedModeCount: isolatedModes.length,
    };
}

function loadAceSnippetModule(fileName, language) {
    const modules = new Map();
    const context = { console };
    context.ace = {
        define(id, _dependencies, factory) {
            const exports = {};
            const module = { exports };
            const localRequire = (requestedId) => modules.get(requestedId);
            factory(localRequire, exports, module);
            modules.set(id, module.exports);
        },
        require(requestedIds, callback) {
            if (Array.isArray(requestedIds)) {
                const resolved = requestedIds.map((id) => modules.get(id));
                if (typeof callback === "function") {
                    callback(...resolved);
                }
                return resolved;
            }
            return modules.get(requestedIds);
        },
    };
    vm.createContext(context);
    vm.runInContext(readFileSync(fileName, "utf8"), context, {
        filename: basename(fileName),
    });
    const snippetModule = modules.get(`ace/snippets/${language}`);
    assert(snippetModule, `${language} snippet module did not register`);
    return snippetModule;
}

function snippetTriggers(snippetText) {
    return new Set(
        [...String(snippetText || "").matchAll(/^snippet\s+(\S+)/gm)]
            .map((match) => match[1]),
    );
}

function verifyM1LanguageSnippets(paths) {
    const expectations = {
        python: {
            minimum: 10,
            required: ["def", "class", "for", "try", "with", "main"],
        },
        lua: {
            minimum: 5,
            required: ["local", "fun", "for", "forp", "fori"],
        },
        java: {
            minimum: 30,
            required: ["cl", "for", "main"],
        },
        kotlin: {
            minimum: 10,
            required: ["fun", "val", "var", "data", "when", "object", "companion"],
        },
    };
    const counts = {};
    Object.entries(expectations).forEach(([language, expectation]) => {
        const fileName = join(paths["ace-assets"], "snippets", `${language}.js`);
        const snippetModule = loadAceSnippetModule(fileName, language);
        const triggers = snippetTriggers(snippetModule.snippetText);
        assert(
            snippetModule.scope === language,
            `${language} snippet scope is ${snippetModule.scope || "missing"}`,
        );
        assert(
            triggers.size >= expectation.minimum,
            `${language} exposes only ${triggers.size} snippet triggers`,
        );
        expectation.required.forEach((trigger) => {
            assert(triggers.has(trigger), `${language} is missing the '${trigger}' snippet`);
        });
        counts[language] = triggers.size;
    });
    const python = loadAceSnippetModule(
        join(paths["ace-assets"], "snippets", "python.js"),
        "python",
    );
    assert(
        !/except[^\n]*,\s*\$\{/.test(python.snippetText),
        "Python snippets still contain Python 2 exception syntax",
    );
    assert(
        /except \$\{\d+:Exception\} as \$\{\d+:error\}:/.test(python.snippetText),
        "Python snippets do not expose Python 3 'except ... as ...' syntax",
    );
    return counts;
}

function verifyM2StaticIndices(paths) {
    const context = { console, Date };
    context.window = context;
    vm.createContext(context);
    vm.runInContext(readFileSync(paths["local-symbols"], "utf8"), context, {
        filename: basename(paths["local-symbols"]),
    });
    vm.runInContext(readFileSync(paths.completer, "utf8"), context, {
        filename: basename(paths.completer),
    });

    const loadCalls = { python: 0, lua: 0, java: 0, kotlin: 0 };
    const loadDurationsMs = {};
    const sourceBytes = {};
    const completer = context.AutoJsAceCompleter.createCompleter(
        {
            globals: [{ name: "files", type: "module", doc: "AutoJs6 files module" }],
            modules: {
                files: [{
                    name: "read",
                    type: "function",
                    signature: "files.read(path: string): string",
                    doc: "Reads an AutoJs6 file.",
                }],
            },
        },
        {
            loadLanguageIndex(language, fileName, callback) {
                loadCalls[language]++;
                const expectedPath = join(paths["language-indices"], `${language}.js`);
                assert(
                    resolve(fileName) === resolve(expectedPath) ||
                        fileName.endsWith(`/indices/${language}.js`) ||
                        fileName.endsWith(`\\indices\\${language}.js`),
                    `Unexpected ${language} lazy-index path: ${fileName}`,
                );
                const script = readFileSync(expectedPath, "utf8");
                sourceBytes[language] = Buffer.byteLength(script);
                const startedAt = performance.now();
                vm.runInContext(script, context, { filename: basename(expectedPath) });
                loadDurationsMs[language] = Number((performance.now() - startedAt).toFixed(3));
                callback(null, context.AutoJsAceLanguageIndices?.[language] || null);
            },
        },
    );

    for (const language of Object.keys(loadCalls)) {
        assert(
            completer.getSourceForLanguage(language) === null,
            `${language} index was eagerly initialized`,
        );
    }

    function complete(modeId, text, prefix = "") {
        const session = languageSession(modeId, text);
        const lines = text.split("\n");
        let result = null;
        let error = null;
        completer.getCompletions(
            null,
            session,
            { row: lines.length - 1, column: lines.at(-1).length },
            prefix,
            (completionError, items) => {
                error = completionError;
                result = items || [];
            },
        );
        assert(!error, `${modeId} completion failed: ${error}`);
        assert(result !== null, `${modeId} completion did not resolve synchronously in the verifier`);
        return result;
    }

    function names(items) {
        return new Set(items.map((item) => item.caption || item.value));
    }

    function expectNames(modeId, text, prefix, expected, message) {
        const actual = names(complete(modeId, text, prefix));
        for (const name of expected) {
            assert(actual.has(name), `${message}: missing ${name}; got ${JSON.stringify([...actual])}`);
        }
        return actual;
    }

    const pythonBase = [
        "import os as operating",
        "from pathlib import Path",
        "",
        "class DocumentModel:",
        "    pass",
        "",
        "def foo_bar(value, count=1):",
        "    local_value = value",
        "    return local_value",
    ].join("\n");
    expectNames(
        "ace/mode/python",
        `${pythonBase}\noperating.`,
        "",
        ["getcwd", "path"],
        "Python os alias completion",
    );
    expectNames(
        "ace/mode/python",
        `${pythonBase}\nPath.`,
        "",
        ["exists", "read_text"],
        "Python imported class completion",
    );
    expectNames("ace/mode/python", `${pythonBase}\nDocument`, "Document", ["DocumentModel"], "Python class extraction");
    expectNames("ace/mode/python", `${pythonBase}\nfoo`, "foo", ["foo_bar"], "Python function extraction");
    expectNames("ace/mode/python", `${pythonBase}\nlocal_`, "local_", ["local_value"], "Python variable extraction");
    expectNames("ace/mode/python", `${pythonBase}\ncou`, "cou", ["count"], "Python parameter extraction");
    assert(
        complete("ace/mode/python", `${pythonBase}\nfoo`, "foo").find((item) => item.caption === "foo_bar")?.meta === "local symbol",
        "Python current-document candidate did not retain its local-symbol source label",
    );
    assert(
        !names(complete("ace/mode/python", `${pythonBase}\nMa`, "Ma")).has("Math"),
        "Python received a Java static-index symbol",
    );

    const luaBase = [
        "local function foo_bar(value, count)",
        "    local local_value = value",
        "end",
    ].join("\n");
    expectNames(
        "ace/mode/lua",
        `${luaBase}\nstring.`,
        "",
        ["format", "rep"],
        "Lua string library completion",
    );
    expectNames("ace/mode/lua", `${luaBase}\nfoo`, "foo", ["foo_bar"], "Lua function extraction");
    expectNames("ace/mode/lua", `${luaBase}\nlocal_`, "local_", ["local_value"], "Lua variable extraction");
    expectNames("ace/mode/lua", `${luaBase}\ncou`, "cou", ["count"], "Lua parameter extraction");
    assert(
        !names(complete("ace/mode/lua", `${luaBase}\nfiles`, "files")).has("files"),
        "Lua received an AutoJs6 static-index symbol",
    );

    const javaBase = [
        "import java.util.Collections;",
        "class Demo {",
        "    private static final int DEFAULT_COUNT = 1;",
        "    public int computeTotal(int count) {",
        "        int localValue = count;",
        "        return localValue;",
        "    }",
        "}",
    ].join("\n");
    expectNames(
        "ace/mode/java",
        `${javaBase}\nMath.`,
        "",
        ["abs", "sqrt"],
        "Java Math static completion",
    );
    expectNames(
        "ace/mode/java",
        `${javaBase}\nSystem.`,
        "",
        ["currentTimeMillis", "nanoTime"],
        "Java System static completion",
    );
    expectNames(
        "ace/mode/java",
        `${javaBase}\nCollections.`,
        "",
        ["sort", "emptyList"],
        "Java imported class completion",
    );
    expectNames("ace/mode/java", `${javaBase}\nDem`, "Dem", ["Demo"], "Java class extraction");
    expectNames("ace/mode/java", `${javaBase}\ncompute`, "compute", ["computeTotal"], "Java method extraction");
    expectNames("ace/mode/java", `${javaBase}\nDEFAULT`, "DEFAULT", ["DEFAULT_COUNT"], "Java field extraction");
    expectNames("ace/mode/java", `${javaBase}\nlocal`, "local", ["localValue"], "Java variable extraction");
    expectNames("ace/mode/java", `${javaBase}\ncou`, "cou", ["count"], "Java parameter extraction");
    assert(
        !names(complete("ace/mode/java", `${javaBase}\nlistO`, "listO")).has("listOf"),
        "Java received a Kotlin standard-library symbol",
    );

    const kotlinBase = [
        "class Demo",
        "fun computeTotal(count: Int): Int {",
        "    val subtotal = count",
        "    return subtotal",
        "}",
    ].join("\n");
    expectNames("ace/mode/kotlin", `${kotlinBase}\nlist`, "list", ["listOf"], "Kotlin top-level completion");
    expectNames("ace/mode/kotlin", `${kotlinBase}\nprint`, "print", ["println"], "Kotlin println completion");
    expectNames(
        "ace/mode/kotlin",
        `${kotlinBase}\nRegex.`,
        "",
        ["escape", "fromLiteral"],
        "Kotlin Regex static completion",
    );
    expectNames("ace/mode/kotlin", `${kotlinBase}\nDem`, "Dem", ["Demo"], "Kotlin class extraction");
    expectNames("ace/mode/kotlin", `${kotlinBase}\ncompute`, "compute", ["computeTotal"], "Kotlin function extraction");
    expectNames("ace/mode/kotlin", `${kotlinBase}\nsub`, "sub", ["subtotal"], "Kotlin variable extraction");
    expectNames("ace/mode/kotlin", `${kotlinBase}\ncou`, "cou", ["count"], "Kotlin parameter extraction");
    assert(
        !names(complete("ace/mode/kotlin", `${kotlinBase}\ngetcwd`, "getcwd")).has("getcwd"),
        "Kotlin received a Python standard-library symbol",
    );

    const jsMembers = names(complete("ace/mode/javascript", "files.", ""));
    assert(jsMembers.has("read"), "Generic completer changed the existing AutoJs6 JS index behavior");

    const schemaSummary = {};
    for (const language of Object.keys(loadCalls)) {
        const source = completer.getSourceForLanguage(language);
        assert(source, `${language} index was not retained after lazy loading`);
        assert(loadCalls[language] === 1, `${language} index loaded ${loadCalls[language]} times`);
        assert(sourceBytes[language] < 2 * 1024 * 1024, `${language} index exceeds the 2 MiB budget`);
        const serializedIndexUtf16Bytes = JSON.stringify(source).length * 2;
        assert(
            serializedIndexUtf16Bytes < 2 * 1024 * 1024,
            `${language} normalized index exceeds the 2 MiB runtime-memory estimate`,
        );
        assert(loadDurationsMs[language] < 50, `${language} index load exceeded 50ms: ${loadDurationsMs[language]}ms`);
        const items = [
            ...source.globals,
            ...Object.values(source.modules).flat(),
        ];
        assert(items.length > 0, `${language} index is empty`);
        items.forEach((item) => {
            assert(item.name && item.type && item.signature && item.doc,
                `${language} index item violates the globals/modules/signature/doc/type schema: ${JSON.stringify(item)}`);
        });
        schemaSummary[language] = {
            sourceBytes: sourceBytes[language],
            serializedIndexUtf16Bytes,
            loadDurationMs: loadDurationsMs[language],
            globalCount: source.globals.length,
            moduleCount: Object.keys(source.modules).length,
            memberCount: Object.values(source.modules).flat().length,
            sourceRevision: source.source?.revision || "",
        };
    }
    const indexState = completer.getIndexState();
    assert(
        Object.values(indexState).every((state) => state.status === "ready"),
        `Not every M2 index is ready: ${JSON.stringify(indexState)}`,
    );

    const appendedIndexScripts = [];
    const defaultContext = { console, Date };
    defaultContext.window = defaultContext;
    defaultContext.document = {
        createElement() {
            return { setAttribute() {} };
        },
        head: {
            appendChild(script) {
                appendedIndexScripts.push(script.src);
                const match = /(?:^|\/)(python|lua|java|kotlin)\.js$/.exec(String(script.src));
                assert(match, `Default lazy loader appended an unknown script: ${script.src}`);
                const fileName = join(paths["language-indices"], `${match[1]}.js`);
                vm.runInContext(readFileSync(fileName, "utf8"), defaultContext, {
                    filename: basename(fileName),
                });
                script.onload();
            },
        },
    };
    vm.createContext(defaultContext);
    vm.runInContext(readFileSync(paths["local-symbols"], "utf8"), defaultContext, {
        filename: basename(paths["local-symbols"]),
    });
    vm.runInContext(readFileSync(paths.completer, "utf8"), defaultContext, {
        filename: basename(paths.completer),
    });
    const defaultCompleter = defaultContext.AutoJsAceCompleter.createCompleter({});
    const defaultSession = languageSession("ace/mode/python", "import os\nos.");
    let defaultResults = null;
    defaultCompleter.getCompletions(
        null,
        defaultSession,
        { row: 1, column: 3 },
        "",
        (_error, items) => { defaultResults = items || []; },
    );
    assert(
        defaultResults?.some((item) => item.caption === "getcwd"),
        "Default DOM lazy loader did not deliver Python member completions",
    );
    defaultCompleter.getCompletions(
        null,
        defaultSession,
        { row: 1, column: 3 },
        "",
        () => {},
    );
    assert(
        appendedIndexScripts.length === 1 &&
            appendedIndexScripts[0] === "./autojs6/indices/python.js",
        `Default DOM lazy loader did not cache the Python index: ${JSON.stringify(appendedIndexScripts)}`,
    );
    return {
        lazyLoadCalls: loadCalls,
        languages: schemaSummary,
        localExtractorLanguages: context.AutoJsAceLocalSymbols.supportedLanguages(),
        jsRegressionMemberCount: jsMembers.size,
        defaultLoaderScripts: appendedIndexScripts,
    };
}

function verifyClientLanguageIsolation(paths) {
    let tsServiceCreateCount = 0;
    let staticCompletionCallCount = 0;
    const context = {
        clearTimeout() {},
        console,
        Date,
        Function,
        isFinite,
        JSON,
        Math,
        setTimeout() { return 1; },
        AutoJsAceTsLanguageService: {
            create() {
                tsServiceCreateCount++;
                return null;
            },
        },
    };
    context.window = context;
    vm.createContext(context);
    loadClientRuntime(context, paths);

    const isolatedLanguageResults = {};
    [
        { name: "Python", mode: "ace/mode/python", extension: "py" },
        { name: "Lua", mode: "ace/mode/lua", extension: "lua" },
        { name: "Java", mode: "ace/mode/java", extension: "java" },
        { name: "Kotlin", mode: "ace/mode/kotlin", extension: "kt" },
    ].forEach((language) => {
        const isolatedSession = languageSession(language.mode, "files.");
        const isolatedClient = context.AutoJsAceLspClient.createClient({
            getOptions: () => JSON.stringify({
                documentUri: `file:///autojs6/editor/example.${language.extension}`,
                enabled: true,
                typescriptVersion: "6.0.3",
            }),
            getStaticCompleter: () => ({
                getCompletions(_editor, _session, _position, _prefix, callback) {
                    staticCompletionCallCount++;
                    callback(null, [{ caption: "p2Static", value: "p2Static" }]);
                },
            }),
            session: isolatedSession,
        });
        let completions = null;
        isolatedClient.getCompletions(
            null,
            isolatedSession,
            { row: 0, column: 6 },
            "",
            (_error, items) => { completions = items || []; },
        );
        const warmUpStarted = isolatedClient.warmUp();
        const state = isolatedClient.getState();
        const diagnostics = isolatedClient.validateNow();
        isolatedClient.destroy();

        assert(
            completions.length === 1 && completions[0].caption === "p2Static",
            `${language.name} did not reach the M2 static fallback`,
        );
        assert(!warmUpStarted, `${language.name} attempted to warm the TypeScript service`);
        const expectedReason = language.extension === "py" ?
            "python-worker-runtime-unavailable" : language.extension === "lua" ?
                "luals-native-runtime-unavailable" : "unsupported-document-type";
        assert(
            state.semanticServiceReason === expectedReason,
            `${language.name} isolation reason was lost: ${state.semanticServiceReason}`,
        );
        assert(diagnostics.length === 0, `${language.name} received JavaScript diagnostics`);
        isolatedLanguageResults[language.name.toLowerCase()] = {
            completionCount: completions.length,
            diagnosticCount: diagnostics.length,
        };
    });
    assert(staticCompletionCallCount === 4, "An M2 language bypassed the static fallback");

    const jsonSession = languageSession("ace/mode/json", "{]");
    const jsonClient = context.AutoJsAceLspClient.createClient({
        getOptions: () => JSON.stringify({
            documentUri: "file:///autojs6/editor/example.json",
            enabled: true,
        }),
        session: jsonSession,
    });
    let jsonCompletions = null;
    jsonClient.getCompletions(
        null,
        jsonSession,
        { row: 0, column: 2 },
        "",
        (_error, items) => { jsonCompletions = items || []; },
    );
    const jsonDiagnostics = jsonClient.validateNow();
    jsonClient.destroy();
    assert(jsonCompletions.length === 0, "JSON received JavaScript completions");
    assert(
        jsonDiagnostics.length === 1 && jsonDiagnostics[0].code === "json-syntax",
        `JSON.parse diagnostic short circuit regressed: ${JSON.stringify(jsonDiagnostics)}`,
    );

    const oversizedJsonSession = languageSession("ace/mode/json", "{]");
    const oversizedJsonClient = context.AutoJsAceLspClient.createClient({
        getOptions: () => JSON.stringify({
            documentUri: "file:///autojs6/editor/oversized.json",
            enabled: true,
            maxDocumentLength: 1,
        }),
        session: oversizedJsonSession,
    });
    const oversizedJsonDiagnostics = oversizedJsonClient.validateNow();
    const oversizedJsonState = oversizedJsonClient.getState();
    oversizedJsonClient.destroy();
    assert(
        oversizedJsonDiagnostics.length === 0 &&
            oversizedJsonState.semanticServiceReason === "document-too-large",
        "Oversized JSON bypassed the existing document-length diagnostic guard",
    );
    assert(tsServiceCreateCount === 0, "Non-JS documents instantiated the TypeScript service");
    return {
        isolatedLanguages: isolatedLanguageResults,
        jsonDiagnosticCount: jsonDiagnostics.length,
        oversizedJsonDiagnosticCount: oversizedJsonDiagnostics.length,
        typescriptServiceCreateCount: tsServiceCreateCount,
        staticCompletionCallCount,
    };
}

function verifySemanticProviderFramework(paths) {
    const notifications = [];
    const healthEvents = [];
    let providerCompletionCalls = 0;
    let providerDisposeCount = 0;
    const context = {
        clearTimeout,
        console,
        Date,
        Error,
        isFinite,
        JSON,
        Math,
        setTimeout,
    };
    context.window = context;
    vm.createContext(context);
    vm.runInContext(readFileSync(paths["semantic-provider"], "utf8"), context, {
        filename: basename(paths["semantic-provider"]),
    });
    const runtime = context.AutoJsAceSemanticProvider;
    assert(
        runtime.CAPABILITY_NAMES.join(",") ===
            "completion,hover,signatureHelp,diagnostics,definition,rename,codeActions,dispose",
        "SemanticProvider capability contract is incomplete",
    );

    const host = runtime.createProviderHost({
        notifyError: (message) => notifications.push(String(message)),
        onHealthChanged: (health) => healthEvents.push(health),
    });
    host.setProvider({
        id: "crashing-provider",
        capabilities: ["completion", "hover", "dispose"],
        getCompletions() {
            providerCompletionCalls++;
            throw new Error("provider process exited");
        },
        dispose() {
            providerDisposeCount++;
        },
    });
    const staticItem = { caption: "m2Static", value: "m2Static" };
    const firstResults = [];
    host.invokeCompletion(
        [],
        (_error, items, meta) => firstResults.push({ items, meta }),
        [
            (done) => done(null, [staticItem], { layer: "m2-static-index" }),
            (done) => done(null, [{ caption: "documentWord" }], { layer: "document-word" }),
        ],
    );
    const secondResults = [];
    host.invokeCompletion(
        [],
        (_error, items, meta) => secondResults.push({ items, meta }),
        [(done) => done(null, [staticItem], { layer: "m2-static-index" })],
    );
    const failedState = host.getState();
    assert(
        firstResults[0]?.items?.[0]?.caption === "m2Static" &&
            firstResults[0]?.meta?.layer === "m2-static-index" &&
            secondResults[0]?.items?.[0]?.caption === "m2Static",
        "Provider failure did not preserve the M2 static completion fallback",
    );
    assert(
        providerCompletionCalls === 1 && providerDisposeCount === 1 &&
            failedState.status === "degraded" && failedState.failureCount === 1 &&
            failedState.lastFailure.includes("provider process exited") &&
            notifications.length === 1,
        `Provider health failure was not retained: ${JSON.stringify(failedState)}`,
    );
    const failureHealthEventCount = healthEvents.length;
    host.dispose();
    assert(
        providerDisposeCount === 1,
        "Destroying a degraded provider host disposed the failed provider twice",
    );

    const words = runtime.documentWordCompletions(
        sessionFor("alpha alphabet beta"),
        "alph",
    );
    assert(
        words.map((item) => item.caption).join(",") === "alpha,alphabet" &&
            words.every((item) => item.autojs6FallbackLayer === "document-word"),
        `Document-word terminal fallback is invalid: ${JSON.stringify(words)}`,
    );

    let fakeNow = 0;
    const timeoutHost = runtime.createProviderHost({
        now: () => fakeNow,
        operationTimeoutMs: 100,
    });
    timeoutHost.setProvider({
        id: "slow-provider",
        capabilities: ["hover"],
        getHover() {
            fakeNow = 101;
            return { value: "too late" };
        },
        dispose() {},
    });
    const timeoutFallback = { value: "static hover" };
    const timeoutResult = timeoutHost.invoke("hover", [], timeoutFallback);
    assert(
        timeoutResult === timeoutFallback &&
            timeoutHost.getState().lastFailureKind === "timeout" &&
            timeoutHost.getState().timeoutCount === 1,
        "Slow SemanticProvider operation did not trip the timeout fallback",
    );

    let serviceDisposeCount = 0;
    const serviceState = { ready: true, version: "6.0.3" };
    const tsProvider = runtime.createTypeScriptInProcessProvider({
        createService: () => ({
            getState: () => serviceState,
            getHover: () => ({ value: "typescript hover" }),
            dispose: () => { serviceDisposeCount++; },
        }),
    });
    assert(
        tsProvider.name === "TypeScriptInProcessProvider" &&
            tsProvider.getState() === serviceState &&
            tsProvider.getHover(null, null, "")?.value === "typescript hover" &&
            tsProvider.getCapabilities().includes("rename"),
        "TypeScriptInProcessProvider did not preserve the TypeScript service contract",
    );
    tsProvider.dispose();
    assert(serviceDisposeCount === 1, "TypeScriptInProcessProvider did not dispose its service");

    let clientProviderCalls = 0;
    let clientProviderCreateCount = 0;
    let clientProviderDisposeCount = 0;
    const clientNotifications = [];
    context.AutoJsAceTsLanguageService = {
        create: () => {
            clientProviderCreateCount++;
            return {
            getState: () => ({ ready: true, version: "6.0.3" }),
            getCompletions() {
                clientProviderCalls++;
                throw new Error("killed for acceptance test");
            },
            dispose() {
                clientProviderDisposeCount++;
            },
            };
        },
    };
    vm.runInContext(readFileSync(paths.client, "utf8"), context, {
        filename: basename(paths.client),
    });
    const clientSession = languageSession("ace/mode/javascript", "files.");
    const client = context.AutoJsAceLspClient.createClient({
        getOptions: () => JSON.stringify({
            enabled: true,
            documentUri: "file:///autojs6/editor/provider-failure.js",
            rootUri: "file:///autojs6/editor",
            typescriptVersion: "6.0.3",
        }),
        getStaticCompleter: () => ({
            getCompletions(_editor, _session, _position, _prefix, callback) {
                callback(null, [staticItem]);
            },
        }),
        notifyError: (message) => clientNotifications.push(String(message)),
        session: clientSession,
    });
    const clientResults = [];
    client.getCompletions(
        null,
        clientSession,
        { row: 0, column: 6 },
        "",
        (_error, items) => clientResults.push(items || []),
    );
    client.getCompletions(
        null,
        clientSession,
        { row: 0, column: 6 },
        "",
        (_error, items) => clientResults.push(items || []),
    );
    const clientState = client.getState();
    client.destroy();
    assert(
        clientResults.length === 2 &&
            clientResults.every((items) => items[0]?.caption === "m2Static") &&
            clientProviderCalls === 1 && clientProviderDisposeCount === 1 &&
            clientState.semanticServiceReason === "provider-failure" &&
            clientState.semanticProvider?.status === "degraded" &&
            clientState.semanticProvider?.failureCount === 1 &&
            clientNotifications.length === 1,
        `Client provider-kill fallback failed: ${JSON.stringify(clientState)}`,
    );

    const disabledSession = languageSession("ace/mode/typescript", "value.");
    const disabledClient = context.AutoJsAceLspClient.createClient({
        getOptions: () => JSON.stringify({
            enabled: true,
            documentUri: "file:///autojs6/editor/semantic-disabled.ts",
            rootUri: "file:///autojs6/editor",
            semanticLanguages: { typescript: false },
            typescriptVersion: "6.0.3",
        }),
        getStaticCompleter: () => ({
            getCompletions(_editor, _session, _position, _prefix, callback) {
                callback(null, [staticItem]);
            },
        }),
        session: disabledSession,
    });
    let disabledResults = null;
    disabledClient.getCompletions(
        null,
        disabledSession,
        { row: 0, column: 6 },
        "",
        (_error, items) => { disabledResults = items || []; },
    );
    const disabledWarmUp = disabledClient.warmUp();
    const disabledState = disabledClient.getState();
    disabledClient.destroy();
    assert(
        disabledResults?.[0]?.caption === "m2Static" && disabledWarmUp === false &&
            disabledState.semanticServiceReason === "semantic-disabled-for-language" &&
            clientProviderCreateCount === 1,
        `Per-language semantic switch bypassed M2 or instantiated TypeScript: ${JSON.stringify(disabledState)}`,
    );

    return {
        capabilityCount: runtime.CAPABILITY_NAMES.length,
        providerFailureCount: failedState.failureCount,
        providerDisposeCount,
        healthEventCount: failureHealthEventCount,
        timeoutCount: timeoutHost.getState().timeoutCount,
        documentWordCount: words.length,
        clientProviderCalls,
        clientProviderCreateCount,
        clientStaticFallbackChecks: clientResults.length,
        semanticDisabledStaticFallbackCount: disabledResults.length,
    };
}

function verifyLspProtocolCore(paths) {
    let timerSerial = 0;
    const cancelledTimers = new Set();
    const diagnosticsEvents = [];
    const errors = [];
    const sent = [];
    let hooks = null;
    let readyMarkCount = 0;
    let transportDisposeCount = 0;
    const context = {
        clearTimeout: (id) => cancelledTimers.add(id),
        console,
        Error,
        isFinite,
        JSON,
        Math,
        setTimeout: () => ++timerSerial,
    };
    context.window = context;
    vm.createContext(context);
    vm.runInContext(readFileSync(paths["lsp-core"], "utf8"), context, {
        filename: basename(paths["lsp-core"]),
    });
    const transport = {
        start(nextHooks) {
            hooks = nextHooks;
        },
        send(message) {
            sent.push(JSON.parse(JSON.stringify(message)));
        },
        markReady() {
            readyMarkCount++;
        },
        dispose() {
            transportDisposeCount++;
        },
    };
    const client = context.AutoJsAceLspCore.createClient({
        rootUri: "file:///autojs6/editor",
        transport,
        clearTimeout: context.clearTimeout,
        setTimeout: context.setTimeout,
        onDiagnostics: (uri, diagnostics, version) => {
            diagnosticsEvents.push({ uri, diagnostics, version });
        },
        onError: (message) => errors.push(String(message)),
    });
    let startResult = null;
    client.start({}, (error, state) => {
        startResult = { error, state };
    });
    const initialize = sent.find((message) => message.method === "initialize");
    assert(
        initialize?.params?.capabilities?.textDocument?.completion?.completionItem
            ?.snippetSupport === true,
        "LSP initialize did not advertise snippet support",
    );
    hooks.onMessage({
        jsonrpc: "2.0",
        id: initialize.id,
        result: {
            capabilities: {
                textDocumentSync: 2,
                completionProvider: { resolveProvider: true },
                hoverProvider: true,
            },
        },
    });
    assert(
        !startResult?.error && startResult?.state?.state === "ready" &&
            readyMarkCount === 1 && sent.some((message) => message.method === "initialized"),
        `LSP initialize/initialized handshake failed: ${JSON.stringify(startResult)}`,
    );

    const uri = "file:///autojs6/editor/src/main.py";
    const opened = client.openDocument(uri, "python", "alpha beta\nsecond");
    assert(opened.version === 1, "didOpen did not start at document version 1");
    const changed = client.changeDocument(uri, [{
        range: {
            start: { line: 0, character: 6 },
            end: { line: 0, character: 10 },
        },
        text: "gamma",
    }]);
    assert(
        changed.version === 2 && changed.text === "alpha gamma\nsecond",
        `Incremental didChange produced the wrong document: ${JSON.stringify(changed)}`,
    );

    let staleCallback = null;
    const staleId = client.completion(
        uri,
        { line: 0, character: 11 },
        null,
        (error, result, meta) => { staleCallback = { error, result, meta }; },
    );
    client.changeDocument(uri, [{
        range: {
            start: { line: 0, character: 11 },
            end: { line: 0, character: 11 },
        },
        text: "!",
    }]);
    hooks.onMessage({
        jsonrpc: "2.0",
        id: staleId,
        result: [{ label: "staleItem" }],
    });
    assert(
        staleCallback?.error?.code === "STALE_RESPONSE" && staleCallback?.meta?.stale === true,
        "Out-of-order LSP completion response was not discarded",
    );

    let completionResult = null;
    const completionId = client.completion(
        uri,
        { line: 0, character: 12 },
        { triggerKind: 2, triggerCharacter: "." },
        (error, result) => { completionResult = { error, result }; },
    );
    hooks.onMessage({
        jsonrpc: "2.0",
        id: completionId,
        result: {
            isIncomplete: true,
            items: [{
                label: "choiceCall",
                insertText: "${1|first,second|}($0)",
                insertTextFormat: 2,
                detail: "mock completion",
            }],
        },
    });
    assert(
        !completionResult?.error && completionResult?.result?.isIncomplete === true &&
            completionResult.result.items[0]?.snippet === "${1:first}($0)",
        `LSP completion/snippet normalization failed: ${JSON.stringify(completionResult)}`,
    );
    let resolvedCompletion = null;
    const resolveId = client.resolveCompletion(
        completionResult.result.items[0],
        (error, result) => { resolvedCompletion = { error, result }; },
    );
    hooks.onMessage({
        jsonrpc: "2.0",
        id: resolveId,
        result: {
            label: "choiceCall",
            insertText: "${1:value}($0)",
            insertTextFormat: 2,
            documentation: { kind: "markdown", value: "Resolved docs" },
        },
    });
    assert(
        resolvedCompletion?.result?.snippet === "${1:value}($0)" &&
            resolvedCompletion.result.docHTML === "Resolved docs",
        "completionItem/resolve result was not normalized",
    );

    function roundTrip(invoke, result) {
        let callbackResult = null;
        const id = invoke((error, value) => { callbackResult = { error, value }; });
        hooks.onMessage({ jsonrpc: "2.0", id, result });
        assert(!callbackResult?.error, `LSP request ${id} failed unexpectedly`);
        return callbackResult.value;
    }
    const hover = roundTrip(
        (callback) => client.hover(uri, { line: 0, character: 1 }, callback),
        { contents: { kind: "markdown", value: "hover" } },
    );
    const signature = roundTrip(
        (callback) => client.signatureHelp(uri, { line: 0, character: 1 }, {}, callback),
        { signatures: [{ label: "f(value)" }], activeSignature: 0, activeParameter: 0 },
    );
    const definition = roundTrip(
        (callback) => client.definition(uri, { line: 0, character: 1 }, callback),
        { uri, range: { start: { line: 0, character: 0 }, end: { line: 0, character: 5 } } },
    );
    const rename = roundTrip(
        (callback) => client.rename(uri, { line: 0, character: 1 }, "omega", callback),
        { changes: { [uri]: [] } },
    );
    const codeActions = roundTrip(
        (callback) => client.codeAction(
            uri,
            { start: { line: 0, character: 0 }, end: { line: 0, character: 5 } },
            [],
            callback,
        ),
        [{ title: "Mock fix", kind: "quickfix" }],
    );
    assert(
        hover?.contents?.value === "hover" && signature?.signatures?.length === 1 &&
            definition?.uri === uri && rename?.changes?.[uri]?.length === 0 &&
            codeActions?.[0]?.title === "Mock fix",
        "One or more general LSP feature requests did not round-trip",
    );

    hooks.onMessage({
        jsonrpc: "2.0",
        method: "textDocument/publishDiagnostics",
        params: { uri, version: 2, diagnostics: [{ message: "stale" }] },
    });
    hooks.onMessage({
        jsonrpc: "2.0",
        method: "textDocument/publishDiagnostics",
        params: { uri, version: 3, diagnostics: [{ message: "current" }] },
    });
    assert(
        diagnosticsEvents.length === 1 && diagnosticsEvents[0].diagnostics[0]?.message === "current",
        "publishDiagnostics accepted a stale document version",
    );

    let cancellationCallbackCount = 0;
    let cancellationError = null;
    const cancelledId = client.hover(uri, { line: 0, character: 1 }, (error) => {
        cancellationCallbackCount++;
        cancellationError = error;
    });
    assert(client.cancelRequest(cancelledId, "cursor moved"), "LSP request cancellation failed");
    hooks.onMessage({
        jsonrpc: "2.0",
        id: cancelledId,
        result: { contents: "late hover" },
    });
    assert(
        cancellationCallbackCount === 1 && cancellationError?.code === "REQUEST_CANCELLED" &&
            sent.some((message) =>
                message.method === "$/cancelRequest" && message.params?.id === cancelledId),
        "$/cancelRequest or late-response suppression failed",
    );

    const applied = client.applyWorkspaceEdit({
        changes: {
            [uri]: [{
                range: {
                    start: { line: 0, character: 0 },
                    end: { line: 0, character: 5 },
                },
                newText: "omega",
            }],
        },
    });
    const rejected = client.applyWorkspaceEdit({
        changes: {
            "file:///autojs6/outside/escape.py": [{
                range: {
                    start: { line: 0, character: 0 },
                    end: { line: 0, character: 0 },
                },
                newText: "unsafe",
            }],
        },
    });
    assert(
        applied.applied === true && client.getDocument(uri)?.text.startsWith("omega gamma!") &&
            rejected.applied === false &&
            !client.isSafeDocumentUri("file:///autojs6/editor/../outside.py"),
        `Workspace-edit or URI safety boundary failed: ${JSON.stringify({ applied, rejected })}`,
    );

    hooks.onMessage({
        jsonrpc: "2.0",
        id: 9001,
        method: "workspace/applyEdit",
        params: {
            edit: {
                changes: {
                    [uri]: [{
                        range: {
                            start: { line: 0, character: 6 },
                            end: { line: 0, character: 11 },
                        },
                        newText: "delta",
                    }],
                },
            },
        },
    });
    assert(
        sent.some((message) => message.id === 9001 && message.result?.applied === true) &&
            client.getDocument(uri)?.text.startsWith("omega delta!"),
        "workspace/applyEdit server request was not applied or acknowledged",
    );

    const didOpenCountBeforeRestart = sent.filter(
        (message) => message.method === "textDocument/didOpen",
    ).length;
    hooks.onClose("mock process crash");
    hooks.onRestart();
    const restartInitialize = [...sent].reverse().find(
        (message) => message.method === "initialize",
    );
    hooks.onMessage({
        jsonrpc: "2.0",
        id: restartInitialize.id,
        result: { capabilities: { textDocumentSync: 2 } },
    });
    const reopened = [...sent].reverse().find(
        (message) => message.method === "textDocument/didOpen",
    );
    assert(
        client.getState().state === "ready" && readyMarkCount === 2 &&
            sent.filter((message) => message.method === "textDocument/didOpen").length ===
                didOpenCountBeforeRestart + 1 &&
            reopened?.params?.textDocument?.version === 5 &&
            reopened.params.textDocument.text.startsWith("omega delta!"),
        "Transport restart did not reinitialize and replay the current document version",
    );

    assert(client.closeDocument(uri), "didClose rejected an open document");
    let shutdownResult = null;
    const shutdownId = client.shutdown((error, state) => {
        shutdownResult = { error, state };
    });
    hooks.onMessage({ jsonrpc: "2.0", id: shutdownId, result: null });
    assert(
        !shutdownResult?.error && shutdownResult?.state?.state === "stopped" &&
            sent.some((message) => message.method === "exit"),
        "shutdown/exit lifecycle failed",
    );
    client.dispose();
    const methods = sent.filter((message) => message.method).map((message) => message.method);
    const requiredMethods = [
        "initialize",
        "initialized",
        "textDocument/didOpen",
        "textDocument/didChange",
        "textDocument/completion",
        "completionItem/resolve",
        "textDocument/hover",
        "textDocument/signatureHelp",
        "textDocument/definition",
        "textDocument/rename",
        "textDocument/codeAction",
        "$/cancelRequest",
        "textDocument/didClose",
        "shutdown",
        "exit",
    ];
    assert(
        requiredMethods.every((method) => methods.includes(method)),
        `General LSP protocol coverage is incomplete: ${JSON.stringify(methods)}`,
    );
    assert(transportDisposeCount === 1, "LSP transport was not disposed exactly once");
    return {
        methodCount: new Set(methods).size,
        documentVersion: changed.version + 3,
        staleResponseCount: client.getState().staleResponseCount,
        cancelledRequestCount: client.getState().cancelledRequestCount,
        diagnosticPublishCount: diagnosticsEvents.length,
        workspaceEditApplied: applied.applied,
        unsafeWorkspaceEditRejected: !rejected.applied,
        restartHandshakeCount: readyMarkCount,
        reopenedDocumentVersion: reopened.params.textDocument.version,
        snippet: completionResult.result.items[0].snippet,
        errorsRecorded: errors.length,
    };
}

function verifyLspTransports(paths) {
    const context = {
        clearTimeout,
        console,
        Error,
        isFinite,
        JSON,
        Math,
        setTimeout,
    };
    context.window = context;
    vm.createContext(context);
    for (const file of [paths["lsp-core"], paths["lsp-transports"]]) {
        vm.runInContext(readFileSync(file, "utf8"), context, {
            filename: basename(file),
        });
    }

    function mockResponse(message) {
        if (message.method === "initialize") {
            return {
                jsonrpc: "2.0",
                id: message.id,
                result: { capabilities: { hoverProvider: true } },
            };
        }
        if (message.method === "autojs6/echo") {
            return { jsonrpc: "2.0", id: message.id, result: message.params };
        }
        if (message.method === "shutdown") {
            return { jsonrpc: "2.0", id: message.id, result: null };
        }
        return null;
    }

    function runProtocolSuite(name, transport, sentMessages) {
        const client = context.AutoJsAceLspCore.createClient({
            rootUri: "file:///autojs6/editor",
            transport,
        });
        let started = null;
        client.start({}, (error, state) => { started = { error, state }; });
        assert(
            !started?.error && started?.state?.state === "ready",
            `${name} transport failed initialize handshake: ${JSON.stringify(started)}`,
        );
        let echo = null;
        client.request(
            "autojs6/echo",
            { transport: name, value: 42 },
            {},
            (error, result) => { echo = { error, result }; },
        );
        assert(
            !echo?.error && echo?.result?.transport === name && echo.result.value === 42,
            `${name} transport failed protocol echo: ${JSON.stringify(echo)}`,
        );
        let stopped = null;
        client.shutdown((error, state) => { stopped = { error, state }; });
        assert(
            !stopped?.error && stopped?.state?.state === "stopped",
            `${name} transport failed shutdown: ${JSON.stringify(stopped)}`,
        );
        client.dispose();
        assert(
            sentMessages.some((message) => message.method === "initialize") &&
                sentMessages.some((message) => message.method === "autojs6/echo") &&
                sentMessages.some((message) => message.method === "shutdown") &&
                sentMessages.some((message) => message.method === "exit"),
            `${name} transport did not carry the common protocol sequence`,
        );
        return { echo: echo.result, sentCount: sentMessages.length };
    }

    const workerMessages = [];
    let workerTerminateCount = 0;
    let workerInstance = null;
    class MockWorker {
        constructor() {
            workerInstance = this;
        }

        postMessage(message) {
            workerMessages.push(JSON.parse(JSON.stringify(message)));
            const response = mockResponse(message);
            if (response) this.onmessage?.({ data: response });
        }

        terminate() {
            workerTerminateCount++;
        }
    }
    const workerTransport = context.AutoJsAceLspTransports.createWebWorkerTransport({
        workerFactory: () => new MockWorker(),
        workerUrl: "mock-worker.js",
    });
    const workerProtocol = runProtocolSuite("web-worker", workerTransport, workerMessages);
    assert(
        workerInstance && workerTerminateCount === 1,
        "WebWorker transport did not terminate its worker during disposal",
    );

    const stdioMessages = [];
    let stdioStopCount = 0;
    let stdioReadyCount = 0;
    const bridge = {
        startLspProcess(providerId) {
            assert(providerId === "mock-stdio", "Stdio transport changed the provider identifier");
            return JSON.stringify({ ok: true, sessionId: "stdio-session-1" });
        },
        sendLspProcessMessage(sessionId, payload) {
            assert(sessionId === "stdio-session-1", "Stdio transport changed its session identifier");
            const message = JSON.parse(payload);
            stdioMessages.push(message);
            const response = mockResponse(message);
            if (response) {
                context.AutoJsAceLspTransports.receiveStdioMessage(
                    sessionId,
                    JSON.stringify(response),
                );
            }
            return JSON.stringify({ ok: true });
        },
        markLspProcessReady() {
            stdioReadyCount++;
            return JSON.stringify({ ok: true });
        },
        stopLspProcess() {
            stdioStopCount++;
            return JSON.stringify({ ok: true });
        },
    };
    const stdioTransport = context.AutoJsAceLspTransports.createStdioBridgeTransport({
        bridge,
        providerId: "mock-stdio",
    });
    const stdioProtocol = runProtocolSuite("stdio", stdioTransport, stdioMessages);
    assert(
        stdioReadyCount === 1 && stdioStopCount === 1,
        "Stdio bridge handshake or process cleanup did not run exactly once",
    );

    function timerHarness() {
        let serial = 0;
        const pending = new Map();
        return {
            setTimeout(callback, delayMs) {
                const id = ++serial;
                pending.set(id, { callback, delayMs });
                return id;
            },
            clearTimeout(id) {
                pending.delete(id);
            },
            runDelay(delayMs) {
                const entry = [...pending.entries()].find(([, timer]) => timer.delayMs === delayMs);
                assert(entry, `Missing scheduled transport timer for ${delayMs} ms`);
                pending.delete(entry[0]);
                entry[1].callback();
            },
            pending,
        };
    }

    const idleTimer = timerHarness();
    let idleCloseReason = "";
    let idleTerminateCount = 0;
    const idleTransport = context.AutoJsAceLspTransports.createWebWorkerTransport({
        clearTimeout: (id) => idleTimer.clearTimeout(id),
        idleTimeoutMs: 50,
        setTimeout: (callback, delayMs) => idleTimer.setTimeout(callback, delayMs),
        workerFactory: () => ({
            postMessage() {},
            terminate() { idleTerminateCount++; },
        }),
    });
    idleTransport.start({ onClose: (reason) => { idleCloseReason = String(reason); } });
    idleTransport.markReady();
    idleTimer.runDelay(50);
    assert(
        idleTransport.getState().state === "idle-exit" &&
            idleCloseReason === "idle-timeout" && idleTerminateCount === 1,
        "WebWorker transport idle exit did not close the worker",
    );
    idleTransport.dispose();

    const restartTimerHarness = timerHarness();
    let restartedWorkerCount = 0;
    let firstCrashWorker = null;
    const restartTransport = context.AutoJsAceLspTransports.createWebWorkerTransport({
        autoRestart: true,
        clearTimeout: (id) => restartTimerHarness.clearTimeout(id),
        setTimeout: (callback, delayMs) => restartTimerHarness.setTimeout(callback, delayMs),
        workerFactory: () => {
            const worker = {
                postMessage() {},
                terminate() {},
            };
            restartedWorkerCount++;
            if (!firstCrashWorker) firstCrashWorker = worker;
            return worker;
        },
    });
    restartTransport.start({ onClose() {}, onError() {} });
    firstCrashWorker.onerror?.({ message: "mock worker crash" });
    assert(
        restartTransport.getState().state === "restart-wait" &&
            restartTimerHarness.pending.size >= 1,
        "WebWorker crash did not schedule a backoff restart",
    );
    restartTimerHarness.runDelay(250);
    assert(restartedWorkerCount === 2, "WebWorker backoff restart did not create a new worker");
    restartTransport.dispose();

    assert(
        context.AutoJsAceLspTransports.restartDelay(0) === 250 &&
            context.AutoJsAceLspTransports.restartDelay(1) === 500 &&
            context.AutoJsAceLspTransports.restartDelay(20) === 10000,
        "Transport restart backoff is not bounded exponential",
    );
    return {
        webWorker: workerProtocol,
        stdio: stdioProtocol,
        stdioReadyCount,
        stdioStopCount,
        idleExitCount: idleTerminateCount,
        restartedWorkerCount,
        restartDelaysMs: [250, 500, 10000],
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
    loadClientRuntime(context, paths);

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
    const incrementalProjectDiagnostics = verifyIncrementalProjectDiagnostics(paths);
    const executionProfiles = verifyExecutionProfileConsistency(paths, ts);
    const optionalGroups = verifyOptionalGroupCompletions(paths);
    const diagnosticScheduler = verifyDiagnosticScheduler(paths);
    const completionRefresh = verifyCompletionRefreshController(paths);
    const completerLanguageIsolation = verifyCompleterLanguageIsolation(paths);
    const m1LanguageSnippets = verifyM1LanguageSnippets(paths);
    const m2StaticIndices = verifyM2StaticIndices(paths);
    const clientLanguageIsolation = verifyClientLanguageIsolation(paths);
    const semanticProviderFramework = verifySemanticProviderFramework(paths);
    const lspProtocolCore = verifyLspProtocolCore(paths);
    const lspTransports = verifyLspTransports(paths);
    const oldWebView = verifyOldWebViewFallback(paths);
    process.stdout.write(
        `${JSON.stringify({
            typescriptVersion: ts.version,
            semantics,
            browserService,
            dependencyTypes,
            incrementalProjectDiagnostics,
            executionProfiles,
            optionalGroups,
            diagnosticScheduler,
            completionRefresh,
            completerLanguageIsolation,
            m1LanguageSnippets,
            m2StaticIndices,
            clientLanguageIsolation,
            semanticProviderFramework,
            lspProtocolCore,
            lspTransports,
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
