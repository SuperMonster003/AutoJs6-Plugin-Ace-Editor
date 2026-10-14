# Ace Editor 2.0.1

Validated on 2026-10-14. Final versionCode: 269.

A patch release on top of 2.0.0 (`docs/development/release-2.0.0.md`). It requires AutoJs6 build 5352 or later with
Editor API contract 7, as 2.0.0 does.

## Changes

- Diagnostics of Java, Lua and Python files follow the last edit again (`b303186`). When a provider answered an
  earlier request during the 450 ms debounce of a later edit, the LSP client published that result under a new
  diagnostic generation, which cancelled the validation the edit had scheduled; on slow devices the diagnostics could
  stay those of the text before a quick edit. Publications now keep the current generation.
- Packaged text assets are checked out with LF on every platform, and release builds stop before packaging CRLF
  (`a467e42`). The 2.0.0 APKs already carried LF bytes; this guards later Windows builds.
- Device tests and CI (`896c3c1`, not part of the APK): the test activity keeps the editor clear of the system bars,
  touch tests plan their event times, and the Build integrity workflow uploads the test results and logcat on failure.

## Changelog

The ten-language `v2.0.1` entry (fix 1) is in `.changelog/lang_*.json`; README and changelog Markdown were
regenerated with `py .python/generate_markdown.py`, and `--check` passed.

## Validation

- Static gates on the release tree (2026-10-14): 177 JVM tests passed; `lintDebug` reported 0 errors and 62 warnings;
  `:app:check` passed with all verification tasks, including `verifyAutoJs6TextAssetLineEndings` (334 text files) and
  the LSP runtime regression for Java, Lua and Python (each case fails when its publication path starts a new
  generation again); the pre-push check passed 6/6.
- Emulator configured like the GitHub workflow (API 35 google_apis x86_64, pixel_7, 2 cores, 2560 MB, SwiftShader):
  the full connected suite (55 tests, two compiler probes skipped by design) passed twice; `AceJavaSemanticSmokeTest`
  passed 8 of 8 runs after the fix (2 of 5 failed before); the touch test passed 7 of 7 runs, and the coverage and
  IME replay tests passed.
- API 36.1 16 KB emulator (6 GB): the touch test passed 2 of 3 runs, B1 in all three; the other run started right
  after boot and lost a keyboard request (see the recorded limits).
- G8441 (API 28) and 23046RP50C (API 35): the touch and coverage tests passed.
- GitHub workflows on `896c3c1`: Markdown integrity (Windows, including the line-ending tests) and Icon Studio recipe
  passed; in Build integrity the unit test, lint and debug APK job passed, and the instrumentation job was still
  running when this file was written.
- Signed release build: `verifySignedReleaseArtifacts`, the 16 KB native page alignment gate (all variants and
  release) and `appendDigestToReleasedFiles` passed for all five APKs. Each APK reports versionCode 269 and
  versionName 2.0.1, carries the expected ABIs, is signed with the certificate
  `31a681fcfffb3e428420cae280ded89292b12a3b0f59e19b7a73e32a8ae4c213`, and its CRC32 matches the file name. Every
  packaged asset tracked by Git has the repository's bytes. The universal APK is 1,360 bytes larger than 2.0.0.
- Host joint verification on 22120RN86C (API 33, WebView 111): the final arm64-v8a APK replaced the debug plugin, with
  a host debug build containing `b7df923aaa`, `8126740e0e` and `21252648f1`. `AceEditorPluginHostDeviceTest` passed
  7/7 and the Ace companion release smoke test 1/1.

## Recorded limits

- When a request to show the keyboard is lost (seen once on an API 36.1 emulator right after boot, while Gboard was
  still starting), the plugin's IME state stays "showing", and later taps do not ask for the keyboard until the
  keyboard insets change. A fix is planned for the next version.
- The limits recorded for 2.0.0 still apply, except the lost diagnostics of a later edit, which this release fixes.

## Final APKs

| ABI | CRC32 | SHA-256 | Size (bytes) |
| --- | --- | --- | ---: |
| arm64-v8a | 691c6d89 | a83c7d437f61157218dc26fe1438ab8e00f52590b2e7712dcedeb742ee15a6f5 | 17,068,347 |
| armeabi-v7a | 94c93db4 | b6e1f4ea139b2f4172ca6c36ab6c5e021aeb61f098c4997782bb96937926d388 | 17,014,049 |
| universal | 0a28fe7e | d5764fa34ea6b299f562bb75aa445aade49c0a985921245105495c71cf1005c8 | 18,629,176 |
| x86 | 06f206c8 | eb00ee099c561cf2a7938dab32414c2825320c16c5bb2ab6b89d1b4fde7b8fed | 16,278,372 |
| x86_64 | e8486fc3 | ce9d93432f70ef253b63461c55473bfc7ffe77409fe33b8bd076061a833fe951 | 17,101,252 |

The file names are `autojs6-plugin-ace-editor-v2.0.1-<abi>-<crc32>.apk`.
