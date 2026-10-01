# Installer persistent-default declaration boundaries

Date: 2026-10-02.

The bundled manual installer declaration and package identity/version match AutoJs6 declarations
4.26.1, commit `d789d42df006b4892ef7b4a0e9e0aa95e0796478`. The embedded package keeps its existing
local publication metadata. JSDoc now describes:

- Dhizuku persistent defaults on API 26 through 33, with a refusal before writes on API 34+.
- The conditional Root/system bridge for user 0, with actual API 24 / Magisk 25.2 /
  SELinux Enforcing evidence rather than a promise for every Root device.
- Operation-specific automatic authorizer selection, without falling back after execution
  failure, and the limits of rollback after a partial write or process death.
- Boolean script results and the distinction between current resolution and the local
  `persistentConfigured` protocol receipt. No nonexistent script property is declared.

TypeScript's installer smoke passes its positive and negative assertions. The manual declaration
is byte-identical to the source repository. `generateAutoJs6LspDeclarations` and
`verifyAutoJs6LspRuntime` pass, and the generated LSP manifest records declaration version 4.26.1.
Ten-language changelog rendering passes its freshness check.

The earlier P8 synchronization already ran the canonical `aj6dts.bat -Publish` workflow and
the 171-test JVM suite. This final change only corrects manual documentation and metadata;
it reuses those generated Java/resource declarations. A second global export would consume
unrelated concurrent host/Rhino dependency changes, because even `-SkipBuild` configures the
host Gradle export. That export is therefore intentionally not repeated for this JSDoc-only
follow-up. No native language servers were rebuilt, no package was published, and the existing
untracked `releases/` contents were preserved.
