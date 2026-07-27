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
  directives, and normalizes legacy identifier `module` declarations only in
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

Run the TypeScript semantic and old-WebView fallback verification with:

```powershell
.\gradlew.bat :app:verifyAutoJs6LspRuntime
```
