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
