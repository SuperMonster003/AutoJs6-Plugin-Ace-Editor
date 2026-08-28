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

For a local Rhino or Node TypeScript project, Android freezes the project's
compilation-relevant `node_modules` text with the compiler dependency layer's
same boundary, exclusions, quotas, inventory hash, and layer hash. The bridge
publishes immutable `file:///autojs6/editor/node_modules/...` URIs and installed
`@types` directive names. The language service therefore resolves package
`types`/`typings`, TypeScript 6 `typesVersions`, nested declaration imports, and
ambient `@types` from the same exact dependency snapshot used at compilation.
Resolver policy revision 3 also resolves a runtime-only JavaScript root through an installed
DefinitelyTyped package without overriding bundled declarations; the dual-profile verifier locks
this behavior with `lodash@4.17.21` and `@types/lodash@4.17.25`. Revision 3 is fingerprinted as
`6241375f2ea49ac2c2d2b3b79b28b7c1ee4adde75c989defc61e252c89ced2bd`.

The Ace service still treats project source as a single-document hinting layer:
dependency declarations are project-aware, but controlled `tsconfig.json`
overrides and cross-source diagnostics remain authoritative only in the
pre-execution compiler until Roadmap T4. Once a dependency type layer is
present, missing-module and missing-declaration diagnostics are no longer
suppressed. If TypeScript cannot load, has the wrong bundled version, or
exceeds the editor's semantic limit, Ace falls back to static/JSHint
assistance; script execution does not depend on the editor service.

Run the all-group TypeScript completion/semantic checks and old-WebView
fallback verification, including the exact Rhino/Node profile option gate and
the dual-profile dayjs `typesVersions`, ambient `@types`, and lodash DefinitelyTyped fixtures,
with:

```powershell
.\gradlew.bat :app:verifyAutoJs6LspRuntime
```
