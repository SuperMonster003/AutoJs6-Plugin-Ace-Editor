# Bundled AutoJs6 TypeScript Declarations

- Source package: `@sm003/autojs6-dts`, version 4.35.0.
- Source repository: https://github.com/SuperMonster003/AutoJs6-TypeScript-Declarations
- Exact source commit: `de51858b59ec88f75c56d94bcf4af600c54ff34f`.
- Declaration package license: MPL-2.0.
- Distribution: local integration snapshot, not a claim of npm publication.

Hand-maintained inputs include `aj6-declarations.d.ts`, the current
`aj6-int-*.d.ts` modules and `aj6-jsx-element-extension.d.ts`. They retain colors,
`colors.theme`, terminal, XML/AndroidView interop and independent dialog sessions,
and add the 25 F4 contract V2 component factories and JSX tags. V1 and F2 catalog
regions remain unchanged. Hand-maintained inputs are copied from the committed
source after the generated-input publication succeeds.

The curated `autojs6/index.d.ts` is retained instead of copying the package's
full index. Main-app, Android, resources and library graphs remain available as
their existing optional language-service groups. The default group settings are
unchanged. `lib.autojs6.d.ts` and `lib.autojs6.extra.d.ts` remain editor-owned.
Ace keeps its own `publishConfig: {"ignore": []}` while importing package 4.35.0.

The actual `aj6dts -Publish` workflow regenerated main, resources and libraries
from clean AutoJs6 host commit
`6a166c38415e7299ba034cd062dcc4c51a4b543a`, appDebug/ace profile, using generator
commit `525bebdaa157087b1295d80cef0dae861152eda5`. It selected 489/10839 main,
20/20 resource and 789/27248 library classes. Generated files match the source
and workflow provenance byte-for-byte; main and resources retain their F3
bytes, while libraries append the referenced `ComposeUiV2` class. The actual
workflow also copied the complete Android reference graph. These inputs feed
`generateAutoJs6LspDeclarations`.

| Input | SHA-256 |
| --- | --- |
| `autojs6/aj6-int-compose.d.ts` | `48ef51f00e4d020b5963443ca6762790c0dae65ebdac6bca627eadd4c72563ec` |
| `autojs6/aj6-jsx-element-extension.d.ts` | `aa6599822593c7a8259b4d7aa4d1ba3b482b221da4e62a7269ccb29371292306` |
| `autojs6/aj6-main-app.d.ts` | `007e64911ca55de38e7d69aa437ca462a85fce12ccf321863d924309ae558e18` |
| `autojs6/aj6-resources.d.ts` | `c107a607a964fde7298b100221a4a59fd17881a7bedd6337595dc21d997ac0e9` |
| `libraries.d.ts` | `1176e09b0b026968534641af306ccdff8131f6ad05b2d36154a5657924a65456` |
