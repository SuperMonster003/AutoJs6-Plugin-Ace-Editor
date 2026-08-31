#!/usr/bin/env node

import { basename, resolve } from "node:path";
import { readFileSync } from "node:fs";
import vm from "node:vm";

function fail(message) {
    throw new Error(message);
}

function assert(condition, message) {
    if (!condition) {
        fail(message);
    }
}

function parseArguments(argv) {
    const assetRoot = resolve("app/src/main/assets/editor/ace-builds-1.4.12/autojs6");
    const result = {
        completer: resolve(assetRoot, "autojs6_completer.js"),
        localSymbols: resolve(assetRoot, "autojs6_local_symbols.js"),
        kotlinIndex: resolve(assetRoot, "indices/kotlin.js"),
        javaIndex: resolve(assetRoot, "indices/java.js"),
    };
    const keys = {
        "--completer": "completer",
        "--local-symbols": "localSymbols",
        "--kotlin-index": "kotlinIndex",
        "--java-index": "javaIndex",
    };
    for (let index = 0; index < argv.length; index++) {
        const key = keys[argv[index]];
        if (!key || !argv[index + 1]) {
            fail(`Unknown or incomplete argument: ${argv[index] || "<empty>"}`);
        }
        result[key] = resolve(argv[++index]);
    }
    return result;
}

function evaluate(context, fileName) {
    vm.runInContext(readFileSync(fileName, "utf8"), context, {
        filename: basename(fileName),
    });
}

function sessionFor(text) {
    const lines = text.split("\n");
    return {
        getLength: () => lines.length,
        getLine: (row) => lines[row] || "",
        getValue: () => text,
        getMode: () => ({ $id: "ace/mode/kotlin" }),
        getDocument: () => ({ getNewLineCharacter: () => "\n" }),
        on() {},
        off() {},
        setAnnotations() {},
        doc: {
            positionToIndex(position) {
                return lines.slice(0, position.row)
                    .reduce((length, line) => length + line.length + 1, 0) + position.column;
            },
        },
    };
}

function itemNames(items) {
    return new Set((items || []).map((item) => item.caption || item.value));
}

const paths = parseArguments(process.argv.slice(2));
const context = { console, Date };
context.window = context;
vm.createContext(context);
evaluate(context, paths.localSymbols);
evaluate(context, paths.completer);
evaluate(context, paths.javaIndex);
evaluate(context, paths.kotlinIndex);

const javaIndex = context.AutoJsAceLanguageIndices?.java;
const kotlinIndex = context.AutoJsAceLanguageIndices?.kotlin;
assert(javaIndex, "Java interop index did not register");
assert(kotlinIndex, "Kotlin P2+ index did not register");
assert(javaIndex.source?.revision === "autojs6-java17-android35-subset-2",
    `Unexpected Java source revision: ${javaIndex.source?.revision}`);
assert(kotlinIndex.source?.revision === "autojs6-kotlin-2.2.21-p2plus-2",
    `Unexpected Kotlin source revision: ${kotlinIndex.source?.revision}`);
assert(Object.keys(kotlinIndex.modules).length >= 40, "Kotlin P2+ module inventory regressed");
assert(Object.values(kotlinIndex.modules).flat().length >= 450, "Kotlin P2+ member inventory regressed");
assert(Buffer.byteLength(readFileSync(paths.kotlinIndex)) < 2 * 1024 * 1024,
    "Kotlin P2+ index exceeds the 2 MiB asset budget");

for (const moduleName of ["Log", "java.io.File", "android.content.Intent", "android.os.Bundle", "android.view.View"]) {
    assert(javaIndex.modules[moduleName], `Java source module missing: ${moduleName}`);
    assert(kotlinIndex.modules[moduleName], `Kotlin interop module missing: ${moduleName}`);
    assert(JSON.stringify(kotlinIndex.modules[moduleName]) === JSON.stringify(javaIndex.modules[moduleName]),
        `Kotlin did not deterministically reuse Java module ${moduleName}`);
}

const source = [
    "import android.content.Intent as AndroidIntent",
    "import android.net.Uri",
    "import java.io.File",
    "",
    "data class Box(val names: List<String>, val title: String)",
    "",
    "fun render(input: String?, count: Int) {",
    "    val items = listOf(\"alpha\", \"beta\")",
    "    val mutable = mutableListOf(1, 2)",
    "    val mapping: MutableMap<String, Int> = mutableMapOf()",
    "    val nullableNames: List<String>? = items",
    "    val intent = AndroidIntent(\"sample.action\")",
    "    val file = File(\".\")",
    "    val uri = Uri.parse(\"content://sample/items\")",
    "    val matcher = Regex(\"[a-z]+\")",
    "    val label = \"sample\"",
    "    val range = 1..10",
    "    val integer = 42",
    "    val decimal = 1.5",
    "}",
].join("\n");

const local = context.AutoJsAceLocalSymbols.extract("kotlin", source);
const expectedAliases = {
    names: "kotlin.collections.List",
    title: "kotlin.String",
    input: "kotlin.String",
    count: "kotlin.Int",
    items: "kotlin.collections.List",
    mutable: "kotlin.collections.MutableList",
    mapping: "kotlin.collections.MutableMap",
    nullableNames: "kotlin.collections.List",
    intent: "AndroidIntent",
    file: "File",
    uri: "android.net.Uri#instance",
    matcher: "kotlin.text.Regex#instance",
    label: "kotlin.String",
    range: "kotlin.ranges.IntRange",
    integer: "kotlin.Int",
    decimal: "kotlin.Double",
};
for (const [name, target] of Object.entries(expectedAliases)) {
    assert(local.aliases[name] === target,
        `Kotlin local type heuristic mismatch for ${name}: ${local.aliases[name] || "<missing>"} != ${target}`);
}
assert(local.aliases.AndroidIntent === "android.content.Intent", "Kotlin import alias extraction regressed");

const completer = context.AutoJsAceCompleter.createCompleter({}, {
    loadLanguageIndex(language, _fileName, callback) {
        callback(null, context.AutoJsAceLanguageIndices[language]);
    },
});

function complete(query) {
    const text = `${source}\n${query}`;
    const session = sessionFor(text);
    const lines = text.split("\n");
    let result = null;
    let error = null;
    completer.getCompletions(
        null,
        session,
        { row: lines.length - 1, column: lines.at(-1).length },
        "",
        (completionError, items) => {
            error = completionError;
            result = items || [];
        },
    );
    assert(!error, `Kotlin completion failed for ${query}: ${error}`);
    assert(result !== null, `Kotlin completion did not synchronously resolve for ${query}`);
    return result;
}

function expectMembers(query, expected) {
    const actual = itemNames(complete(query));
    for (const name of expected) {
        assert(actual.has(name), `${query} is missing ${name}; got ${JSON.stringify([...actual])}`);
    }
}

expectMembers("items.", ["size", "map", "filter", "joinToString"]);
expectMembers("mutable.", ["add", "removeAt", "sortBy"]);
expectMembers("mapping.", ["put", "remove", "getOrDefault"]);
expectMembers("nullableNames?.", ["firstOrNull", "sortedBy", "toMutableList"]);
expectMembers("intent.", ["putExtra", "addFlags", "setAction"]);
expectMembers("file.", ["exists", "listFiles", "toPath"]);
expectMembers("uri.", ["host", "getQueryParameter", "normalizeScheme"]);
expectMembers("matcher.", ["matches", "findAll", "replaceFirst"]);
expectMembers("label.", ["uppercase", "substring", "toIntOrNull"]);
expectMembers("range.", ["contains", "reversed", "step"]);
expectMembers("integer.", ["coerceAtLeast", "until", "toLong"]);
expectMembers("decimal.", ["isFinite", "roundToInt", "toLong"]);
expectMembers("Log.", ["d", "e", "isLoggable"]);
expectMembers("\"literal\".", ["isBlank", "trim", "uppercase"]);

const hoverText = `${source}\nnullableNames?.firstOrNull()`;
const hoverSession = sessionFor(hoverText);
const hoverLine = hoverText.split("\n").at(-1);
const hover = completer.getHover(hoverSession, {
    row: hoverText.split("\n").length - 1,
    column: hoverLine.indexOf("firstOrNull") + 4,
});
assert(hover?.signature?.includes("firstOrNull"), "Safe-call Kotlin hover did not resolve inferred members");

process.stdout.write(`${JSON.stringify({
    gate: "M7-3",
    kotlinRevision: kotlinIndex.source.revision,
    javaRevision: javaIndex.source.revision,
    globals: kotlinIndex.globals.length,
    modules: Object.keys(kotlinIndex.modules).length,
    members: Object.values(kotlinIndex.modules).flat().length,
    inferredAliases: Object.keys(expectedAliases).length,
    reusedJavaModules: 5,
    safeCall: true,
}, null, 2)}\n`);
