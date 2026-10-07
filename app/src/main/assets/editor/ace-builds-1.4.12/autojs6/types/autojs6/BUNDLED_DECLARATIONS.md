# Bundled AutoJs6 TypeScript Declarations

- Source package: `@sm003/autojs6-dts`, version 4.34.0.
- Source repository: https://github.com/SuperMonster003/AutoJs6-TypeScript-Declarations
- Exact source commit: `4512f0ef4a051c8286bd7a19cd3cd7f2d8cf50e6`.
- Declaration package license: MPL-2.0.
- Distribution: local integration snapshot, not a claim of npm publication.

Hand-maintained inputs include `aj6-declarations.d.ts`, the current
`aj6-int-*.d.ts` modules and `aj6-jsx-element-extension.d.ts`. They retain the
4.32.0 perceptual colors, `colors.theme` and terminal API, F2 Compose attachment,
AndroidView and XML TSX listener types, and add F3 independent dialog sessions.

The curated `autojs6/index.d.ts` is retained instead of copying the package's
full index. Main-app, Android, resources and library graphs remain available as
their existing optional language-service groups. The default group settings are
unchanged. `lib.autojs6.d.ts` and `lib.autojs6.extra.d.ts` remain editor-owned.

The normal `aj6dts -Publish` workflow regenerated main, resources and libraries
from clean AutoJs6 host commit
`8cba2ce0e3aad5835879b0b91604caec9cb719b1`, appDebug/ace profile, using generator
commit `525bebdaa157087b1295d80cef0dae861152eda5`. It selected 489/10834 main,
20/20 resource and 788/27242 library classes. Generated files are mirrored from
the exact declaration source above; the Android reference graph is also copied
from that source. These files feed `generateAutoJs6LspDeclarations`.

| Input | SHA-256 |
| --- | --- |
| `autojs6/aj6-int-compose.d.ts` | `692598c6821f7ae4e14269ef672279b1ee95af4e82e175ba31eeec7805cba4ec` |
| `autojs6/aj6-jsx-element-extension.d.ts` | `5c6562cf99d44a8d0255b5b46e088e1938e9d1b894896ae68721496d061bb2ca` |
| `autojs6/aj6-main-app.d.ts` | `007e64911ca55de38e7d69aa437ca462a85fce12ccf321863d924309ae558e18` |
| `autojs6/aj6-resources.d.ts` | `c107a607a964fde7298b100221a4a59fd17881a7bedd6337595dc21d997ac0e9` |
| `libraries.d.ts` | `7f30c4c626b7c449de54ddbbd36a35515653303a340b47d563d5e6a797d9e8f8` |
