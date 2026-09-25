# Ace Editor 1.13.1

Validated on 2026-09-25. Final versionCode: 113.

## Changes

- Bundled AutoJs6 declarations 4.21.1 from commit
  `2841c40`, including Agent preset, permission, budget and memory guidance.
  All 69 manual internal declaration files match the declaration repository.
- Ran the canonical `aj6dts.bat -Publish` workflow. Generated main, resource
  and dependency declarations remained unchanged; TypeScript validation passed.
- Regenerated the five LSP groups with source package 4.21.1. Completion model,
  Pro-only exclusion, static indices, aggregate declarations and browser
  completer verification passed (71 modules, 4391 members).
- Fixed LuaLS verification for a 32-bit APK on a 64-bit device. The old code
  chose the device's preferred ABI and checked a 32-bit executable against the
  64-bit checksum record. The runtime now identifies the installed ELF ABI,
  then checks device support, pinned size and SHA-256 before execution.
  Native binaries and their lockfile were not changed.
- The rename instrumentation test now explicitly selects the dialog root.
  Diagnostic failures include the semantic provider's actual state.

## Validation

- Temurin JVM tests: 171 passed, including malformed ELF and installed ABI cases.
- Debug, androidTest, signed R8 release, all five APK variants, native page
  alignment, LSP runtime and ten-language Markdown gates passed.
- Lint: 0 errors, 47 existing warnings. The optional ECJ compiler service R8
  warning remains; the release's actual editor loading passed on every device.
- API 37 / x86_64 / 16 KB: all 11 selected contract, LuaLS and editor tests passed.
- G8441 / API 28 / armeabi-v7a, API 24 / x86 and Xiaomi Pad / API 35 / universal:
  each passed all 3 selected contract/LuaLS tests. x86 deliberately verifies
  the documented static-completion fallback because LuaLS has no x86 runtime.
- Redmi 12C / API 33 / arm64-v8a passed the contract and LuaLS tests plus editor
  startup, assets, read-only replacement, profile and project snapshot checks.
- All five devices passed 4/4 tests from the real AutoJs6 host against final
  signed release APKs: both companion Wake/INFO Binder contracts, validated
  offline content loading, and Ace cross-APK editor loading/text exchange.
  Version, CRC32, signature and ABI inventories were checked before upload.
- No ColorOS device was available. Screen timeouts were restored after testing.

## Recorded limits

The extended Redmi TypeScript diagnostic test intermittently exceeds the
existing 2000 ms semantic-operation budget (observed 2106-2158 ms). The provider
then reports `timeout` and falls back to static completion. The diagnostic and
rename cases passed in individual earlier runs, but a later isolated diagnostic
run still timed out. This is not recorded as an all-green Redmi editor suite.
The production time budget was not increased. The complete corresponding
API 37 suite passed after explicit dialog-root selection.

The plugin's debug instrumentation APK cannot be run directly against an R8
release: it expects unminified target Kotlin classes. Release validation uses
the separately installed host's `CompanionReleaseSmokeTest` and
`AceEditorPluginHostDeviceTest` instead.

## Final APKs

| ABI | CRC32 | SHA-256 |
| --- | --- | --- |
| arm64-v8a | 2aeb9e68 | 6a3a0dadef8347da500e5ca9533717005ad64fa48c8b2283091d8d0db88b2692 |
| armeabi-v7a | 31a28982 | 5a68ae40c768af62be133ae83394ad725eafa41424c112cb3b5875e675807b44 |
| universal | 0756a71c | 282155e6abd4e94fac220fc3d3830b4b547ab439340534f7c1608b829a211523 |
| x86 | a0aa890f | 1a8505e25c9dbfd3568d08094de3f3b75b9663e42a80ce22883dca9b9aa8776a |
| x86_64 | 5208ffbe | bea75e64322d46b4a9c2c9ace3af3001c939b43026a450bc3e5413dc6308fb1a |

Older user-owned artifacts and `releases/SHA256SUMS` were preserved. The first
build 112 candidates from this task are retained only in the ignored validation
directory and are excluded from the release.
