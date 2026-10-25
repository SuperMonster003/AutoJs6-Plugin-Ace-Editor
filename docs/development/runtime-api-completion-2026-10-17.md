# Runtime API completion

The editor now selects an isolated host declaration bundle for Node.js and Bun scripts.
Node declarations originate in the runtime plugin; Bun declarations originate in its
explicit client SDK. Both copies carry the digest inventory maintained by the declarations
repository's `tools/sync-runtime-declarations.mjs`.

Routing recognizes the first mode string (`node`, `nodejs`, `bun`), standalone runtime
extensions and the host's existing `type: node` project fallback. The host does not currently
select Bun from `type: bun` alone. A Bun dependency imported by another entry and the same
file executed independently are different execution contexts; the editor does not infer a
complete import graph's selected engine from the file's location.

Node/Bun bundles exclude Rhino globals and all optional Android declaration groups. The
static fallback also omits Rhino globals, snippets and JSOX prototype extensions. Rhino
retains the existing JSOX activation detection. Node's explicit `jsox.mathx` module remains
available through its own types.

## Verification

- `verifyRuntimeApiCoverage`: 68 real TypeScript language-service/static queries across
  11 script directive/extension routes. Includes asynchronous pinyin, console, coordinate,
  accessibility and input-observer imports, fetch/Axios/profile members, Node JSOX members, Rhino leakage checks and
  removal of a runtime directive.
- `verifyAutoJs6ApiCoverage`: 218 existing default/optional declaration and JSOX queries.
- `verifyAutoJs6LspRuntime`: existing compiler profiles, dependency resolution, project
  rename, diagnostics, Compose, language isolation and fallback checks.
- The 51 Ace page bridge tests pass, including narrow-screen tooltip placement and wrapping.
- Debug JVM tests and Debug/plugin-test APK builds passed. Native alignment verification
  passed for packaged libraries; this does not claim a new 16 KB device run.
- Independent Node and Bun public declaration entry points pass TypeScript 5.1.3 and
  6.0.3 with strict checking and declaration-body checking enabled.

On 2026-10-17, Sony XQ-DQ72 (`QV770340J7`, Android 13/API 33, arm64, 4096-byte pages)
passed all three `AceApiCoverageDeviceTest` methods in 35.087 seconds. The tests use the
real WebView's public LSP completer, default optional declaration settings, normal provider
budgets and actual painted popup elements. The runtime test covers Node and Bun SDK
completion and rejects Rhino globals/JSOX leakage; the two existing tests cover Rhino APIs
and activation/removal of JSOX extensions. Host preferences and display rotation are restored.

Visual review found that long qualified signatures required horizontal dragging to reveal
their return type. Completion documentation now wraps long lines and namespace tokens while
retaining the existing placement outside the cursor row and candidate list. The runtime
device method passed again in 11.271 seconds after this change, with assertions for no
horizontal overflow and the `Promise<number>` return type. The final Node and Bun screenshots
show readable wrapped signatures and unobscured code/candidates.

Device artifacts are under the application's external files directory in
`api-coverage-device/`: `runtime-api.json`, `default-api.json`, `jsox.json`,
`node-coordinate-popup.png`, `bun-coordinate-popup.png`, `selector-popup.png` and
`jsox-popup.png`. The coordinating task retains the instrumentation log and pulled artifacts.
No APK, generated test report or private device file is committed here.

## Follow-up: complete host surface gate

The complete host gate exposed an additional Rhino `speech` module and inline nested
mounts of `plugins.tools`, `files.batchRename` and `speech.models`. The host extractor now
binds explicit `also` receivers to their parent mount and still rejects unrecognized
registration forms. The public `speech` declarations include model management, sessions,
events and results. Node/Bun bundles continue to exclude these Rhino globals.

The resulting host gate checks 91 mounts, 1351 explicit exports and 1522 TypeScript/Ace
paths with no missing paths or documentation names. The editor checks now cover 226 Rhino
queries and 112 runtime-isolation queries. The speech additions were validated against
the source contract and declaration/completion fixtures; this does not claim new audio
model or recognition execution tests. The three speech completion cases and runtime
isolation assertions are also included in `AceApiCoverageDeviceTest` for subsequent runs.

The final 2.7.0/build 282 APK passed all three device methods on the same Sony XQ-DQ72
in 36.613 seconds, including the new Speech queries, Node/Bun isolation and wrapped
long signatures. The coordinating task retains `ace-2.7-acceptance.log`.

## OpenCC and common images

The 2.8.0 development build includes all 33 OpenCC members and typed image results
from the plugin-owned Node and Bun declarations. The desktop runtime suite passes
174 queries across 11 routing cases, including CJS, ESM and typed Bun completion.
The real device suite passes all four methods on the same Sony API 33 device in
47.029 seconds. It checks every OpenCC member, 16 common image entry points,
Uint8Array methods and pixel array inference, isolated Rhino globals, and the
painted OpenCC/readPixels popups. The existing default Rhino and JSOX cases pass
in that same run. Node OpenCC and Bun image popup screenshots were visually
reviewed: signatures wrap fully without obscuring candidates or the cursor row.

The coordinating host retains the log and `runtime-opencc-image.json` under its
ignored `.bak/opencc-images-20261017` evidence directory. This is development APK
acceptance on one physical device, not a publication or a full Rhino image parity claim.

## Matrix-generated entry queries (2026-10-25)

AutoJs6 api-coverage roadmap P0.6 (decision D16) adds a generated query list to
`verify-runtime-api-coverage.mjs`. `tools/ace-lsp/generate-runtime-api-queries.mjs` reads
the host's runtime coverage matrix (`build/reports/api-coverage/runtime-matrix.json`,
written by the host's `python tools/api-coverage/check.py --matrix`) and writes the
checked-in `tools/ace-lsp/runtime-api-queries.json`: one entry for every Node main, Node
Worker and Bun cell that the matrix counts as covered (bridged, local-shim or
capability-gated), taken from the Node cell's `module` / `member` (plus its
`explicitGlobal`, such as `$autojs.flow`) and the Bun cell's `namespace` / `member`.
Aliased rows that share an entry are queried once.

```text
node tools/ace-lsp/generate-runtime-api-queries.mjs [--matrix <runtime-matrix.json> | --host <AutoJs6 checkout>] [--check]
node tools/ace-lsp/verify-runtime-api-coverage.mjs [--fresh] [--queries <file>]
```

The matrix defaults to `AUTOJS6_RUNTIME_MATRIX`, else the sibling `AutoJs6` checkout's
report; without one the generator explains how to produce it and exits with code 2.
`--check` fails when the checked-in list differs from the matrix. The verifier queries each
entry at the point of typing it (`require` in a `.cjs` file for Node main, `import` in a
`.mjs` file for Workers, the `$autojs` global, `host.<namespace>` in a `.bun.ts` file) and
lists every entry that does not complete. `--fresh`, also used when the Gradle output is
absent, generates the LSP declarations into a temporary directory.

On 2026-10-25 the matrix (2724 rows) gave 759 covered rows and 1887 entry queries (Node
main 676, Worker 502, `$autojs` globals 186, Bun 523), all passing; with the existing 1172
hand-written queries the verifier runs 3059. The host's `Script API coverage` workflow runs
the generator with `--check` and the verifier with `--fresh` after its matrix step.

Since the host's P1.5 (Q27) the matrix also covers members of returned handles (Flow,
MailClient, ShellProcess, AgentRun, EpubBook, Storage, AiSession) through their runtime
handle types: such a cell carries `type` (`Flow<unknown>`, `RuntimeMail.Client`), and the
generator puts it in the `node_handle` / `bun_handle` routes, which the verifier completes
on a value of that type (a JSDoc-typed `handle` in a `.cjs` file, `declare const handle` in
a `.bun.ts` file). Entries that only reject (`never`) are pending in the matrix (Q26) and no
longer queried. On 2026-10-25 (host 6c62786b5) the matrix gave 981 covered rows and 2291
entry queries (Node main 652, Worker 499, `$autojs` globals 186, Bun 512, Node handles 221,
Bun handles 221), all passing; the verifier runs 3463 in total.
