# Bundled AutoJs6 TypeScript Declarations

- Source package: @sm003/autojs6-dts
- Version: 4.84.0
- License: MPL-2.0
- Source location: `declarations/autojs6` of the AutoJs6-TypeScript-Declarations checkout, imported by the AutoJs6 host's `tools/ace-completion/import-autojs6-dts.mjs`. The declarations repository's `tools/sync-runtime-declarations.mjs --ace` keeps `package.json` and the version above current.
- Core files: `aj6-declarations.d.ts`, `aj6-int-*.d.ts` and `aj6-jsx-element-extension.d.ts`.
- Conditional files: `aj6-jsox-*-extensions.d.ts` and their aggregate entry. These are copied without default index references.
- Native optional groups (`aj6-main-app.d.ts`, Android, libraries and resources) are synchronized by the declaration publisher.
- Runtime declarations: the sibling `autojs6-node/` and `autojs6-bun/` folders come from the Node.js and Bun runtime plugins through `tools/sync-runtime-declarations.mjs --ace`; their digests are in `../runtime-declarations.json`.
- Current use: generation input for ACE static completion indices and the LSP declaration bundles.
