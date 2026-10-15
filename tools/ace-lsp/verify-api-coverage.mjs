import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const lock = JSON.parse(fs.readFileSync(path.join(repository, "tools/ace-lsp/ace-builds-lock.json")));
const assets = path.join(repository, lock.assetRoot, "autojs6");
const generated = path.join(repository, "app/build/generated/aceLspAssets",
    lock.assetRoot.replace(/^app\/src\/main\/assets\//, ""), "autojs6/types/generated");
const ts = createRequire(import.meta.url)(path.join(assets, "typescript/typescript.js"));
const context = { console, setTimeout, clearTimeout, ts };
context.window = context;
vm.createContext(context);
for (const name of ["autojs6_local_symbols.js", "autojs6_indices.js", "autojs6_completer.js", "autojs6_ts_language_service.js"]) {
    vm.runInContext(fs.readFileSync(path.join(assets, name), "utf8"), context, { filename: name });
}
const texts = {};
for (const name of fs.readdirSync(path.join(assets, "typescript")).filter(name => /^lib\..+\.d\.ts$/.test(name))) {
    texts[`file:///autojs6/typescript/${name}`] = fs.readFileSync(path.join(assets, "typescript", name), "utf8");
}
for (const name of fs.readdirSync(generated).filter(name => name.endsWith(".d.ts"))) {
    texts[`file:///autojs6/types/generated/${name}`] = fs.readFileSync(path.join(generated, name), "utf8");
}
texts["file:///autojs6/types/lib.autojs6.extra.d.ts"] = fs.readFileSync(path.join(assets, "types/lib.autojs6.extra.d.ts"), "utf8");
const completer = context.AutoJsAceCompleter.createCompleter(context.AutoJsAceIndices);
function session(text) {
    const lines = text.split("\n");
    return { getValue: () => text, getLine: row => lines[row] || "", getLength: () => lines.length };
}
function completions(service, text, prefix, useStatic = false) {
    const lines = text.split("\n");
    const position = { row: lines.length - 1, column: lines.at(-1).length };
    let items;
    const callback = (error, results) => { assert.ifError(error); items = results; };
    if (useStatic) completer.getCompletions(null, session(text), position, prefix, callback);
    else service.getCompletions(session(text), position, prefix, callback, text);
    return items.map(item => item.caption);
}
const nativeRoots = ["android", "libraries", "resources", "main-app"];
let queryCount = 0;
for (const allGroups of [false, true]) {
    const libraryUris = [...context.AutoJsAceTsLanguageService.constants.defaultLibraryUris];
    if (allGroups) for (const group of nativeRoots) libraryUris.push(`file:///autojs6/types/generated/lib.autojs6.${group}.d.ts`);
    const service = context.AutoJsAceTsLanguageService.create({
        documentUri: "file:///autojs6/editor/api-coverage.js", libraryTextByUri: texts, libraryUris,
    });
    for (const [text, prefix, expected] of [
        ["selector().fi", "fi", "findOne"],
        ["selector().findOne().cl", "cl", "click"],
        ["text('OK').findOne().children().fi", "fi", "findOne"],
        ["floaty.rawWindow('<frame/>').getW", "getW", "getWidth"],
        ["$media.pl", "pl", "playMusic"],
        ["console.setContentTextColors", "setContentTextColors", "setContentTextColors"],
        ["Arrayx.di", "di", "differ"],
        ["Mathx.randomI", "randomI", "randomInt"],
        ["Numberx.ensureNumberL", "ensureNumberL", "ensureNumberLike"],
        ["util.versionCodes.searchA", "searchA", "searchAll"],
        ["engines.getE", "getE", "getEngines"],
        ["threads.disposable().blockedG", "blockedG", "blockedGet"],
    ]) {
        assert(completions(service, text, prefix).includes(expected), `${allGroups ? "all" : "default"}: missing ${text} -> ${expected}`);
        queryCount++;
    }
    for (const [module, text, prefix, expected] of [
        ["Math", "Math.su", "su", "sum"],
        ["Array", "[1,2,2].di", "di", "distinct"],
        ["Number", "(5).cl", "cl", "clamp"],
        ["Number", "Number.IC", "IC", "ICU"],
    ]) {
        for (const useStatic of [false, true]) {
            assert(!completions(service, text, prefix, useStatic).includes(expected), `Extension leaked before opt-in: ${text}`);
            for (const activation of ["jsox();", "$jsox.extend();", "jsox.extendAll();", `jsox.extend('${module}');`]) {
                assert(completions(service, activation + text, prefix, useStatic).includes(expected), `${activation}${text}: missing ${expected}, static=${useStatic}`);
                queryCount++;
            }
            for (const inactive of ["// jsox();\n", "'jsox()';", "`jsox()`;", "const r = /jsox()/;",
                "const jsox = fake; jsox();", "const { jsox } = fake; jsox();", "function later(){jsox();}"]) {
                assert(!completions(service, inactive + text, prefix, useStatic).includes(expected), `False opt-in: ${inactive}`);
                queryCount++;
            }
        }
    }
    service.dispose();
}
for (const [text, prefix, expected] of [
    ["notice.channel.cr", "cr", "create"], ["colors.theme.ac", "ac", "activate"],
    ["$colors.theme.ac", "ac", "activate"], ["species.isAr", "isAr", "isArray"],
    ["timers.addD", "addD", "addDailyTask"], ["compose.me", "me", "memo"],
    ["$app.la", "la", "launch"], ["util.java.toJsA", "toJsA", "toJsArray"],
    ["Canvas", "Canvas", "Canvas"], ["R", "R", "R"],
    ["RootAutomator", "RootAutomator", "RootAutomator"], ["WebSocket", "WebSocket", "WebSocket"],
    ["nanoid", "nanoid", "nanoid"], ["sync", "sync", "sync"],
    ["files.formatSizeWithUnit", "formatSizeWithUnit", "formatSizeWithUnit"],
    ["ocr.toString", "toString", "toString"],
    ["images.__buildRegion", "__buildRegion", "__buildRegion"],
    ["util.__assignFunctions__", "__assignFunctions__", "__assignFunctions__"],
]) {
    assert(completions(null, text, prefix, true).includes(expected), `Static receiver coverage missing: ${text}`);
    queryCount++;
}

// Check real inferred return types, so merely restoring member names cannot satisfy this gate.
const probeName = path.join(generated, "__core_api_probe.ts");
const probe = [
    "const auditNode = selector().findOne();",
    "const auditChild = auditNode.child(0);",
    "const auditClick = auditChild.click();",
    "const auditWindow = floaty.rawWindow(null as any);",
    "const auditWidth = auditWindow.getWidth();",
    "const auditMedia = $media;",
    "const auditDisposable = threads.disposable<number>();",
    "const auditDisposedValue = auditDisposable.blockedGet();",
].join("\n");
const options = { target: ts.ScriptTarget.ES2022, noEmit: true, skipLibCheck: true, strict: true };
const host = ts.createCompilerHost(options);
const originalGetSourceFile = host.getSourceFile.bind(host);
host.getSourceFile = (name, ...args) => path.resolve(name) === path.resolve(probeName) ?
    ts.createSourceFile(name, probe, ts.ScriptTarget.Latest, true) : originalGetSourceFile(name, ...args);
const program = ts.createProgram([path.join(generated, "lib.autojs6.core.d.ts"),
    path.join(assets, "types/lib.autojs6.extra.d.ts"), probeName], options, host);
const checker = program.getTypeChecker();
const probeFile = program.getSourceFile(probeName);
const diagnostics = program.getSemanticDiagnostics(probeFile);
assert.equal(diagnostics.length, 0, diagnostics.map(d => ts.flattenDiagnosticMessageText(d.messageText, "\n")).join("\n"));
const types = {};
for (const statement of probeFile.statements) {
    for (const declaration of statement.declarationList?.declarations || []) {
        const type = checker.getTypeAtLocation(declaration.name);
        assert(!(type.flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown)), `${declaration.name.text} lost its inferred type`);
        types[declaration.name.text] = checker.typeToString(type);
    }
}
console.log(JSON.stringify({ typescriptVersion: ts.version, queryCount, defaultReturnTypes: types }, null, 2));
