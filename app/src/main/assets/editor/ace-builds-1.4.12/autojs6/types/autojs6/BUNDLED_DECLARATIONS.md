# Bundled AutoJs6 TypeScript Declarations

- Source package: `@sm003/autojs6-dts`, version 4.33.0.
- Source repository: https://github.com/SuperMonster003/AutoJs6-TypeScript-Declarations
- Exact source commit: `26dcf6cd6d4d175c179b49474d9b9ffc28939690`.
- Declaration package license: MPL-2.0.
- Distribution: local integration snapshot, not a claim of npm publication.

Hand-maintained inputs include `aj6-declarations.d.ts`, the current
`aj6-int-*.d.ts` modules and `aj6-jsx-element-extension.d.ts`. They retain the
4.32.0 perceptual colors, `colors.theme` and terminal API while adding F2 Compose
attachment, AndroidView and XML TSX listener types.

The curated `autojs6/index.d.ts` is retained instead of copying the package's
full index. Main-app, Android, resources and library graphs remain available as
their existing optional language-service groups. The default group settings are
unchanged. `lib.autojs6.d.ts` and `lib.autojs6.extra.d.ts` remain editor-owned.

The normal `aj6dts -Publish` workflow regenerated main, resources and libraries
from clean AutoJs6 host commit
`d54f21b1ea408dfcb66e58f663d71d2f10fade8a`, appDebug/ace profile, using generator
commit `525bebdaa157087b1295d80cef0dae861152eda5`. It selected 488/10769 main,
20/20 resource and 788/27239 library classes. Generated files are mirrored from
the exact declaration source above; the Android reference graph is also copied
from that source. These files feed `generateAutoJs6LspDeclarations`.

| Input | SHA-256 |
| --- | --- |
| `autojs6/aj6-int-compose.d.ts` | `641064dd625c842f99c49679f97b0aa45f6b3eca9b238fd85df470c191b2d7ad` |
| `autojs6/aj6-jsx-element-extension.d.ts` | `5c6562cf99d44a8d0255b5b46e088e1938e9d1b894896ae68721496d061bb2ca` |
| `autojs6/aj6-main-app.d.ts` | `71fbf095ea90f249fbe06ebf02b5125ffdf52e5b35bc3a28d62594fdc295a41c` |
| `autojs6/aj6-resources.d.ts` | `33df4837b2f6ab5d36be3beb8ede9cc886825f46146932bec7b0d42f96b04a0f` |
| `libraries.d.ts` | `7f30c4c626b7c449de54ddbbd36a35515653303a340b47d563d5e6a797d9e8f8` |
