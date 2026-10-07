# Colors and Terminal declarations

Date: 2026-10-07.

Ace Editor 1.25.0/build 136 integrates AutoJs6 declarations 4.32.0, source commit
`2a27cdf`. The paired host is AutoJs6 6.8.0 at commit `9c8c736271`, the input of the
local `aj6dts -Publish` run that regenerated main/resources/libraries in the declaration
repository. That run published only to the declaration repository while this repository
held another task's uncommitted work; the mirrored files here are those published
outputs. Earlier mirrors match the declaration repository in content, so a second
host export would produce the same files.

Mirrored files, byte-identical to the declaration repository:

- `aj6-int-colors.d.ts` (SHA-256 `37a730bd575198874fad985c9df00c80bba0ebc3b5e9c0c48fcf98fba812f338`):
  toOklab, oklab, toOklch, oklch, ensureContrast, harmony, tones, derive, nightVariant,
  simulate, extract, the `oklab` detection algorithm and `colors.theme`.
- `aj6-int-terminal.d.ts` (SHA-256 `dacfa4e9b22505f7ecdd823f1cd471fb50d10bd0e18c65c8b83f73dfd4cb653c`)
  and the `terminal` / `$terminal` globals in `aj6-int-init.d.ts`, added to the declaration
  repository after 4.31.0 and not mirrored here until now.
- `aj6-main-app.d.ts`, `aj6-resources.d.ts` and `libraries.d.ts`.

The curated index adds only the Terminal reference; the bundled package metadata and
`BUNDLED_DECLARATIONS.md` record 4.32.0. Default optional-group enablement, plugin
identity and native runtimes are unchanged.

`verify-runtime.mjs` gains a colors/terminal group in the default core+extra context:
completion of the new colors members, `colors.theme` and `terminal` members (typed with a
three-letter prefix, since colors has more members than the 300-entry completion limit),
zero diagnostics for valid inputs, and diagnostics for six invalid inputs (unknown harmony
type, deficiency and algorithm, a misspelled theme option, a missing state name and a
non-string terminal environment value).

`generateAutoJs6LspDeclarations` and `verifyAutoJs6LspRuntime` pass with the bundled
TypeScript 6.0.3, and the generated LSP manifest records declaration version 4.32.0.
171 JVM tests in 32 classes pass without failure, error or skip; debug APK assembly and
16 KB native alignment pass. The 10-language changelog and 25 generated documents are
consistent. Builds ran with the build number auto increment disabled. No native
dependency, runtime implementation or release-folder content was changed, and nothing
was pushed or published.
