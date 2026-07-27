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

function verifyBrowserLanguageService(paths, expectedVersion) {
    const context = createBrowserTypeScriptContext(paths);
    const libraryDirectory = dirname(paths.runtime);
    const libraryTextByUri = {};
    for (const name of readdirSync(libraryDirectory)) {
        if (/^lib\..+\.d\.ts$/.test(name)) {
            libraryTextByUri[`file:///autojs6/typescript/${name}`] =
                readFileSync(join(libraryDirectory, name), "utf8");
        }
    }
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
    const oldWebView = verifyOldWebViewFallback(paths);
    process.stdout.write(
        `${JSON.stringify({
            typescriptVersion: ts.version,
            semantics,
            browserService,
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
