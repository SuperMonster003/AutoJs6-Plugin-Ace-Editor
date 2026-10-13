# Bundled AutoJs6 TypeScript Declarations

- Source package: `@sm003/autojs6-dts`, version 4.37.0.
- Source repository: https://github.com/SuperMonster003/AutoJs6-TypeScript-Declarations
- Exact declaration source commit: `6c34850f598af62b6aea8e009483dc5e2041a607`.
- Declaration package license: MPL-2.0.
- Distribution: local integration snapshot, not a claim of npm publication.

The device declarations include `getAndroidId(useSystemId: boolean)` for
AutoJs6 6.8.0. The flag selects the system Android ID through authorized
Shizuku or Root on Android 8.0+, with failure reported as an exception.
Older Android systems ignore the flag. Existing Compose UI, color, terminal
and other hand-maintained module declarations remain included.

The curated `autojs6/index.d.ts` and editor-owned `lib.autojs6.d.ts` and
`lib.autojs6.extra.d.ts` retain the existing language-service group selection.
Ace retains its own package publication settings.

The `aj6dts -Publish` workflow regenerated the main, resource and library
graphs using the appDebug/ace profile, AutoJs6 base commit
`8c223d2fb943be634ce8d55d9592038562d37d36` plus the Android ID overload working-tree
change, and generator commit `cf432e0d8dc01fb3ad0a34bebd2af9f7a330f3e1`.
The imported declarations match the committed declaration source after LF
normalization. The complete Android reference graph remains available to
`generateAutoJs6LspDeclarations`.

The following SHA-256 values use UTF-8 bytes with LF line endings.

| Input | SHA-256 |
| --- | --- |
| `autojs6/aj6-int-device.d.ts` | `57e4a49b305f085e1e3a634ffe8c92424cdc2c91cf6f873252b7fa7a7fd27d10` |
| `autojs6/aj6-int-compose.d.ts` | `ca0952148a87a7b027e880b9fc2968ebe27c1697ba0467608041ba2647e863a1` |
| `autojs6/aj6-jsx-element-extension.d.ts` | `aa6599822593c7a8259b4d7aa4d1ba3b482b221da4e62a7269ccb29371292306` |
| `autojs6/aj6-main-app.d.ts` | `98c5c6a6cdc98fff9be71287f5ab0cb8604307867928d55aed8e52ac9960a774` |
| `autojs6/aj6-resources.d.ts` | `ef73d9ab9ddfefc9dc83d98f967da73287309532c426eb54b94b40fc5d7ceabc` |
| `libraries.d.ts` | `1176e09b0b026968534641af306ccdff8131f6ad05b2d36154a5657924a65456` |
