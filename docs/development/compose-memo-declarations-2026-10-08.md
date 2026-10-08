# Compose F6 compose.memo declarations

The local F6 editor change targets Ace 1.30.0/build 144 and AutoJs6 declarations
4.36.0. It builds on the committed F4 editor source
`5b1b0e979cadb0aab4fddc4590430f7fcd5bb722` and retains the existing smart-hint,
overload, colors/terminal, XML and Compose F1-F4 behavior. This record describes
local integration; it does not claim npm publication or a public release.

AutoJs6 6.8.0 / 5323 adds `compose.memo(build, deps, options?)`, which lets a
render function reuse an unchanged fragment. The declaration keeps the node type
returned by `build`, takes a readonly dependency array and an optional
`ComposeMemoOptions` whose `key` is a string, number or null. The renderer
contract, component catalog and JSX projection are unchanged.

The normal `aj6dts -Publish` workflow ran from the clean host commit
`1adc2b86393b01d05a45df7bd9c06c16ce00e891`, appDebug/ace profile, with Android
d.ts Generator 4.0.0 at `525bebdaa157087b1295d80cef0dae861152eda5`, and published
to this isolated checkout. It selected 494/10845 main, 20/20 resource and
789/27248 library classes. Resources and libraries keep their F4 bytes; main
adds the host's memo cache types, reached through existing exported internal
members of the Compose module. No generated declaration was removed or rewritten.

The primary declarations passed the TypeScript 5.1.3/6.0.3 F1-F4 corpora, the
P6 strict/exact smoke with five new memo errors, and the declaration-body check,
and were committed as `5102e03ec1635561e6f4a63c75a979f8a5b41cf6`. Only then was
the handwritten `aj6-int-compose.d.ts` mirrored; `BUNDLED_DECLARATIONS.md` records
that exact source and the matching hashes. Package metadata is 4.36.0 while Ace
keeps `publishConfig: {"ignore": []}`.

The real browser verifier now also checks `memo` completion on the module, a
keyed list of memo fragments inside a render function as valid input, and four
rejected categories: missing dependencies (2554), a scalar dependency value
(2345), a non-node result (2322) and a boolean key (2322). Both the default and
the complete optional-native configurations pass, together with every existing
language, smart-hint, overload and Compose group.

The final gate ran `generateAutoJs6LspDeclarations`, `verifyAutoJs6LspRuntime`,
`testDebugUnitTest`, `assembleDebug`, `lintDebug` and
`verifySignedReleaseArtifacts`; its log is `build/compose-f6-final-gate.log`. All
171 JVM tests across 32 classes pass. Debug lint reports zero errors and 49
existing warnings. Five signed release APKs pass signature and native alignment
checks. No Android device installation of Ace is claimed by this change.

| ABI | Bytes | SHA-256 |
| --- | ---: | --- |
| universal | 18523316 | `385c2d5e25fda06443618866fffc93d04de892d8883b3b145c5fed930deeab94` |
| armeabi-v7a | 16908189 | `1681812cc578615095ad8a401d7491218d6aae76e007539369f0682751759a6b` |
| x86_64 | 16995396 | `96c29994f309286ffec95694540c47c4fbe552a3e29f0f10f176c7fde92b00ab` |
| x86 | 16172516 | `5f50e849d0ec977c1ccf01268db31f508cc23d5cc27d8c8c33d42916eeebe315` |
| arm64-v8a | 16962487 | `3eb2901e1e0cd909f6ac90663503e4481c05b437faff22bac17b4bfeb01cc099` |

The files are `app/build/outputs/apk/release/autojs6-plugin-ace-editor-v1.30.0-<abi>.apk`
in the ignored build directory. The ten-language changelog and all 25 generated
documents are regenerated from their sources. No remote source push, npm
publication or public release was performed.
