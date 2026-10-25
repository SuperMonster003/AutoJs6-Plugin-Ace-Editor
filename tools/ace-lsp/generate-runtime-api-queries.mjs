// Generates runtime-api-queries.json, the matrix part of verify-runtime-api-coverage.mjs, from the
// AutoJs6 host's runtime coverage matrix (build/reports/api-coverage/runtime-matrix.json, written by
// `python tools/api-coverage/check.py --matrix`; row and cell fields are described in the host's
// tools/api-coverage/README.md, "Runtime coverage matrix").
//
// Every row whose Node main, Node Worker or Bun cell is bridged, local-shim or capability-gated gets a
// completion query for its entry: the Node cell's module / member (and its explicit $autojs global),
// the Bun cell's namespace / member. A returned-object member found through its runtime handle type
// (cell `type`, the host's runtime-policy.json returnedObjects) is queried on a value of that type
// (routes node_handle / bun_handle). Entries shared by several rows (aliases) are queried once.
//
//   node tools/ace-lsp/generate-runtime-api-queries.mjs [--matrix <runtime-matrix.json> | --host <AutoJs6 checkout>] [--check]
//
// The matrix defaults to $AUTOJS6_RUNTIME_MATRIX, else the sibling AutoJs6 checkout's report.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const output = path.join(repository, 'tools/ace-lsp/runtime-api-queries.json');
const MATRIX_SCHEMA = 'autojs6-runtime-matrix-v1';
const SCHEMA = 'autojs6-ace-runtime-queries-v1';
const COVERED = new Set(['bridged', 'local-shim', 'capability-gated']);
const REPORT = 'build/reports/api-coverage/runtime-matrix.json';

const args = process.argv.slice(2);
const option = name => {
    const at = args.indexOf(name);
    if (at < 0) return null;
    if (!args[at + 1] || args[at + 1].startsWith('--')) fail(`${name} requires a value`);
    return path.resolve(args[at + 1]);
};
function fail(message, code = 1) {
    console.error(message);
    process.exit(code);
}
for (const [at, name] of args.entries()) {
    if (name.startsWith('--') && !['--matrix', '--host', '--check'].includes(name)) fail(`Unknown argument: ${name}`);
    if (!name.startsWith('--') && !['--matrix', '--host'].includes(args[at - 1])) fail(`Unexpected argument: ${name}`);
}
const check = args.includes('--check');
const host = option('--host');
const matrixPath = option('--matrix') || (host && path.join(host, REPORT))
    || (process.env.AUTOJS6_RUNTIME_MATRIX && path.resolve(process.env.AUTOJS6_RUNTIME_MATRIX))
    || path.resolve(repository, '../AutoJs6', REPORT);

if (!fs.existsSync(matrixPath)) {
    fail([
        `Runtime coverage matrix not found: ${matrixPath}`,
        'Generate it in the AutoJs6 host checkout with `python tools/api-coverage/check.py --matrix`',
        '(add --skip-ace when the Ace check is not needed), or pass --matrix <runtime-matrix.json> / --host <AutoJs6 checkout>.',
    ].join('\n'), 2);
}
const matrix = JSON.parse(fs.readFileSync(matrixPath, 'utf8'));
if (matrix.schema !== MATRIX_SCHEMA) fail(`${matrixPath}: schema ${matrix.schema}, expected ${MATRIX_SCHEMA}`);

const routes = { node_main: new Map(), node_worker: new Map(), node_global: new Map(), bun: new Map(), node_handle: new Map(), bun_handle: new Map() };
function add(route, entry, id) {
    const key = JSON.stringify(entry);
    if (!routes[route].has(key)) routes[route].set(key, { ...entry, rows: [] });
    routes[route].get(key).rows.push(id);
}
let rows = 0;
for (const row of matrix.rows) {
    let covered = false;
    for (const column of ['node_main', 'node_worker']) {
        const cell = row[column];
        if (!COVERED.has(cell?.status)) continue;
        if (!cell.module || !cell.member) fail(`${row.id}: ${column} cell without module / member`);
        covered = true;
        if (cell.type) {
            add('node_handle', { module: cell.module, type: cell.type, member: cell.member }, row.id);
            continue;
        }
        add(column, { module: cell.module, member: cell.member }, row.id);
        if (column === 'node_main' && cell.explicitGlobal) add('node_global', { global: cell.explicitGlobal, member: cell.member }, row.id);
    }
    const cell = row.bun;
    if (COVERED.has(cell?.status)) {
        if (!cell.member || cell.namespace === undefined) fail(`${row.id}: bun cell without namespace / member`);
        covered = true;
        if (cell.type) add('bun_handle', { type: cell.type, member: cell.member }, row.id);
        else add('bun', { namespace: cell.namespace, member: cell.member }, row.id);
    }
    if (covered) rows++;
}

const order = entry => [entry.module ?? entry.global ?? entry.namespace ?? '', entry.type ?? '', entry.member].join('\0');
const sorted = Object.fromEntries(Object.entries(routes).map(([route, entries]) =>
    [route, [...entries.values()].sort((a, b) => order(a) < order(b) ? -1 : order(a) > order(b) ? 1 : 0)]));
const counts = { rows, ...Object.fromEntries(Object.entries(sorted).map(([route, entries]) => [route, entries.length])) };
counts.queries = Object.values(sorted).reduce((sum, entries) => sum + entries.length, 0);
// One entry per line keeps diffs of the checked-in file readable.
const text = [
    '{',
    `  "schema": ${JSON.stringify(SCHEMA)},`,
    '  "generatedBy": "tools/ace-lsp/generate-runtime-api-queries.mjs",',
    `  "matrixSchema": ${JSON.stringify(MATRIX_SCHEMA)},`,
    `  "counts": ${JSON.stringify(counts)},`,
    '  "routes": {',
    Object.entries(sorted).map(([route, entries]) => `    ${JSON.stringify(route)}: [\n`
        + entries.map(entry => `      ${JSON.stringify(entry)}`).join(',\n') + '\n    ]').join(',\n'),
    '  }',
    '}',
    '',
].join('\n');

const current = fs.existsSync(output) ? fs.readFileSync(output, 'utf8').replace(/\r\n?/g, '\n') : null;
if (check) {
    if (current !== text) {
        fail(`${path.relative(repository, output)} is ${current === null ? 'missing' : 'stale'} against ${matrixPath}; `
            + 'run node tools/ace-lsp/generate-runtime-api-queries.mjs and commit the result');
    }
} else if (current !== text) {
    fs.writeFileSync(output, text);
}
console.log(JSON.stringify({ checked: check, matrix: matrixPath, changed: current !== text, ...counts }));
