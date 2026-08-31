#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

function percentile(values, ratio) {
    const sorted = [...values].sort((left, right) => left - right);
    const index = Math.min(sorted.length - 1, Math.max(0, Math.floor(ratio * sorted.length)));
    return sorted[index];
}

function round(value) {
    return Math.round(value * 100) / 100;
}

const distributionDir = path.resolve(process.argv[2] || "");
const modulePath = path.join(distributionDir, "pyodide.mjs");
if (!process.argv[2] || !fs.existsSync(modulePath)) {
    throw new Error("Usage: node probe-pyodide-jedi.mjs <pyodide-distribution-directory>");
}

const { loadPyodide } = await import(pathToFileURL(modulePath).href);
const indexURL = distributionDir;
const processStart = performance.now();
const pyodide = await loadPyodide({ indexURL });
const runtimeReady = performance.now();
await pyodide.loadPackage("jedi");
const jediReady = performance.now();

pyodide.runPython(`
import jedi
import json

completion_source = '''from pathlib import Path
p = Path("a")
p.'''
completion_script = jedi.Script(completion_source, path="completion_probe.py")

hover_source = '''def greet(name: str) -> str:
    return name
'''
hover_script = jedi.Script(hover_source, path="hover_probe.py")

signature_source = '''def greet(name: str) -> str:
    return name

greet()
'''
signature_script = jedi.Script(signature_source, path="signature_probe.py")

definition_source = '''def greet(name: str) -> str:
    return name

greet("world")
'''
definition_script = jedi.Script(definition_source, path="definition_probe.py")

diagnostic_source = '''from pathlib import Path
p = Path("a")
missing_name
greet(
'''
diagnostic_script = jedi.Script(diagnostic_source, path="diagnostic_probe.py")
`);

const completionDurationsMs = [];
let completionNames = [];
for (let run = 0; run < 8; run += 1) {
    const started = performance.now();
    completionNames = pyodide.runPython(
        "[item.name for item in completion_script.complete(line=3, column=2)]"
    ).toJs();
    completionDurationsMs.push(performance.now() - started);
}

const hoverValues = pyodide.runPython(
    "[item.description for item in hover_script.help(line=1, column=10)]"
).toJs();
const signatures = pyodide.runPython(
    "[item.to_string() for item in signature_script.get_signatures(line=4, column=6)]"
).toJs();
const definitions = pyodide.runPython(
    "[(item.name, item.line, item.column) for item in definition_script.goto(line=4, column=2, follow_imports=True)]"
).toJs({ depth: 2 });
const syntaxDiagnostics = pyodide.runPython(
    "[{'line': item.line, 'column': item.column, 'message': item.get_message()} for item in diagnostic_script.get_syntax_errors()]"
).toJs({ dict_converter: Object.fromEntries });

const memory = process.memoryUsage();
const steadyStateDurations = completionDurationsMs.slice(1);
const report = {
    candidate: "Pyodide 0.29.4 + Jedi 0.19.2",
    pythonVersion: pyodide.runPython("__import__('sys').version.split()[0]"),
    runtimeInitMs: round(runtimeReady - processStart),
    jediReadyMs: round(jediReady - processStart),
    completionDurationsMs: completionDurationsMs.map(round),
    completionSteadyP50Ms: round(percentile(steadyStateDurations, 0.5)),
    completionCount: completionNames.length,
    completionSample: completionNames.slice(0, 20),
    pathlibExists: completionNames.includes("exists"),
    pathlibReadText: completionNames.includes("read_text"),
    hoverValues,
    signatures,
    definitions,
    syntaxDiagnostics,
    undefinedNameDiagnostic: syntaxDiagnostics.some((item) =>
        String(item.message || "").includes("missing_name")
    ),
    heapUsedBytes: memory.heapUsed,
    rssBytes: memory.rss,
    note: "Jedi exposes syntax errors but does not provide undefined-name diagnostics."
};

console.log(JSON.stringify(report, null, 2));
