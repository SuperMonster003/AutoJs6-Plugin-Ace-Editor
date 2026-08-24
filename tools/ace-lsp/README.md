# AutoJs6 LSP declaration generation

The source declarations remain under:

`app/src/main/assets/editor/ace-builds-1.4.12/autojs6/types`

Generate the runtime bundles with:

```powershell
.\gradlew.bat :app:generateAutoJs6LspDeclarations
```

Android asset merging and APK assembly depend on this task automatically.
External scripts may call the task directly after updating declarations. If
Node is not available on `PATH`, pass
`-Pautojs6.nodeExecutable=<absolute-node-path>`.

The task:

- keeps every source declaration unchanged;
- validates triple-slash paths and TypeScript 6 syntax;
- emits deterministic `core`, `android`, `libraries`, `resources`, and
  `main-app` bundles plus `manifest.json`;
- removes recursive path directives, hoists required TypeScript `lib`
  directives, normalizes legacy identifier `module` declarations, and changes
  the known empty core `App` forward class into a mergeable interface only in
  generated output;
- writes only below `app/build/generated/aceLspAssets`.

The runtime always loads the generated `core` group together with
`lib.autojs6.extra.d.ts`. The latter is a deliberately small compatibility
root that only retains the legacy `AutoJs6.App.PackageName`, `AppName`, and
`Alias` type names without redeclaring current core symbols.

`aj6-int-*.d.ts` files are discovered as core declarations automatically.
Other new core files must be referenced from `autojs6/index.d.ts`; an
unclassified declaration fails generation instead of being silently ignored.

Optional group dependencies are:

- `libraries` → `android`
- `main-app` → `android`, `libraries`, `resources`

All optional groups are disabled by default in the host editor settings.

## TypeScript execution-profile diagnostics

The bundled language service is pinned to TypeScript `6.0.3`, the same version
used by the compiler plugin. TypeScript documents use the compiler's current
revision-2 defaults instead of the more permissive JavaScript editor defaults:

| Editor document | Profile | Target | Module | Resolution | Strict | Default lib |
| --- | --- | --- | --- | --- | --- | --- |
| standalone `.ts` / `.tsx` | `rhino` | ES2018 | CommonJS | Node10 | yes | `lib.es2018.d.ts` |
| `.ts` / `.tsx` below the nearest `project.json` with `type: node` | `node` | ES2018 | NodeNext | NodeNext | yes | `lib.es2018.d.ts` |
| `.mts` / `.cts` | `node` | ES2018 | NodeNext | NodeNext | yes | `lib.es2018.d.ts` |

Rhino diagnostics also use the execution factories `__autojs6Tsx` and
`__autojs6TsxFragment`. Declaration files follow the corresponding `.d.ts`,
`.d.mts`, or `.d.cts` profile. JavaScript documents retain the editor-oriented
ES2022 configuration because they do not pass through the TypeScript execution
compiler.

The Ace service remains a single-document hinting layer: controlled project
`tsconfig.json` overrides and cross-file compilation diagnostics are still
authoritative only in the pre-execution compiler. If TypeScript cannot load,
has the wrong bundled version, or exceeds the editor's semantic limit, Ace
falls back to static/JSHint assistance; script execution does not depend on the
editor service.

Run the all-group TypeScript completion/semantic checks and old-WebView
fallback verification, including the exact Rhino/Node profile option gate,
with:

```powershell
.\gradlew.bat :app:verifyAutoJs6LspRuntime
```
