# Installer source-profile declaration synchronization

Date: 2026-10-02. Declaration source: AutoJs6-TypeScript-Declarations 4.28.0,
commit `18b3684033fd6f6c69c2e6c611f36c14e930e8a7`. Ace 1.20.0 / build 122 includes the
manual installer declaration with SHA-256
`eeb2a51f416a2d480300407e8f41504921633d8a3c0756ef6d1455016a3005f0`.

The type surface adds the three nullable source-profile resets and sourceDeleteRequested.
Documentation distinguishes omission, explicit defaults and mandatory policy, with host 5312+
and V3 source-profiles negotiation. No new JavaScript method or profile-bypass option is added.

The canonical aj6dts -Publish -SkipBuild workflow and strict-null installer smoke test passed.
That export also included unrelated Inspector resource entries and Terminal/Inspector statistics
from the concurrent host work. Those two generated files were restored to their prior declaration
baseline; their complete generated outputs were retained in ignored host evidence. This commit
includes only the installer declaration change. LSP declaration generation, language indices and
runtime verification passed, as did all 25 multilingual history/README checks.

The pre-existing untracked releases directory, containing 21 files, remains untouched and is
excluded from this commit. No remote publication or device update was performed.
