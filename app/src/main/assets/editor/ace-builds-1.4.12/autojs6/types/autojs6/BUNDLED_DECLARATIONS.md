# Bundled AutoJs6 TypeScript Declarations

- Source package: @sm003/autojs6-dts
- Version: 4.1.0
- License: MPL-2.0
- Source location: local AutoJs6-TypeScript-Declarations checkout at import time.
- Included files: the complete imported declaration package, including AutoJs6,
  Android, libraries, resources, JSX, and main-app declarations.
- Current use: source input for `:app:generateAutoJs6LspDeclarations`.
- Runtime groups: core is always loaded; `android`, `libraries`, `resources`,
  and `main-app` are generated separately and are disabled by default.
- Generated files are written below `app/build/generated/aceLspAssets`; source
  declarations in this directory are never overwritten by the task.
- Generation-only compatibility normalization makes the empty core `App`
  forward declaration mergeable with the complete `main-app` declaration;
  the imported source declaration remains unchanged.
