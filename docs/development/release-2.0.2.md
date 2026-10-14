# Ace Editor 2.0.2

Validated on 2026-10-14. Final versionCode: 272.

A patch release on top of 2.0.1 (`docs/development/release-2.0.1.md`). It requires AutoJs6 build 5352 or later with
Editor API contract 7, as 2.0.0 and 2.0.1 do.

## Changes

- A keyboard request that never shows a keyboard no longer blocks later taps (`04f4125`). Right after boot an API
  36.1 emulator accepted a show request that the window manager then aborted (ImeTracker:
  `PHASE_WM_ABORT_SHOW_IME_POST_LAYOUT`); no keyboard insets followed, so the plugin's IME state stayed "showing" and
  every later tap was ignored. A hide request while no keyboard was visible was cancelled the same way
  (`ALREADY_HIDDEN`) and left the state "hiding". A transition older than 1000 ms now no longer blocks a new request,
  and a show request that InputMethodManager refuses returns to the previous state. Warm keyboards confirm within 50
  to 250 ms on the test devices; the first show of a cold input method took up to about 3 s, and a request repeated
  meanwhile is harmless.
- CI (`307b17e`, not part of the APK): the instrumentation emulator hides error dialogs, because a freshly booted
  System UI showed "isn't responding" and its dialog took the window focus from device tests.

## Changelog

The ten-language `v2.0.2` entry (fix 1) is in `.changelog/lang_*.json`; README and changelog Markdown were
regenerated with `py .python/generate_markdown.py`, and `--check` passed.

## Validation

- Static gates on the release tree (2026-10-14): 186 JVM tests passed, including 9 for the IME state controller;
  `lintDebug` reported 0 errors and 62 warnings; `:app:check` passed with all verification tasks; the pre-push check
  passed 6/6.
- Emulator configured like the GitHub workflow (API 35 google_apis x86_64, pixel_7, 2 cores, 2560 MB, SwiftShader,
  error dialogs hidden): the full connected suite (56 tests, two compiler probes skipped by design) passed twice, the
  second time with the final code.
- Cold-booted API 36.1 16 KB emulator: in a touch test run started right after boot, a hide request the system had
  cancelled left the state "hiding", and the next tap was accepted after the timeout
  (`accepted_after_stale_hiding`) and showed the keyboard.
- `AceImeRequestRecoveryDeviceTest`, where a dialog takes the window focus so that the system refuses the request,
  passed 3 of 3 runs on G8441 (API 28) and passed within the full suite on the API 35 emulator; where the system takes
  the request instead (22120RN86C, 23046RP50C), it skips.
- 22120RN86C and 23046RP50C (Sogou) and G8441 (Gboard): the touch test passed; the IME replay tests passed on an
  earlier build of this change, which also retried a refused request once.
- GitHub workflows on `307b17e`: Markdown integrity passed; Build integrity was still running when this file was
  written.
- Signed release build: `verifySignedReleaseArtifacts`, the 16 KB native page alignment gate (all variants and
  release) and `appendDigestToReleasedFiles` passed for all five APKs. Each APK reports versionCode 272 and
  versionName 2.0.2, carries the expected ABIs, is signed with the certificate
  `31a681fcfffb3e428420cae280ded89292b12a3b0f59e19b7a73e32a8ae4c213`, and its CRC32 matches the file name. Every
  packaged asset tracked by Git has the repository's bytes. The universal APK is 1,000 bytes larger than 2.0.1.
- Host joint verification on 22120RN86C (API 33, WebView 111): the final arm64-v8a APK replaced the debug plugin, with
  a host debug build containing `b7df923aaa`, `8126740e0e` and `21252648f1`. `AceEditorPluginHostDeviceTest` passed
  7/7 and the Ace companion release smoke test 1/1.

## Recorded limits

- The limits recorded for 2.0.0 and 2.0.1 still apply, except the lost keyboard request, which this release fixes.
- On a cold-booted emulator the first WebView page load can take longer than the touch test's 10 s JavaScript
  evaluation limit; this affects tests started right after boot only.

## Final APKs

| ABI | CRC32 | SHA-256 | Size (bytes) |
| --- | --- | --- | ---: |
| arm64-v8a | f32884b4 | 6c9e5e1b281b5fe4e1b024a067fef3266eef299452afbf44694614b866fac1bf | 17,069,347 |
| armeabi-v7a | 8e1e9532 | 690c2ec94930011f6f12e68d4acf471d89bdbf84ecb2234f7d9bafc6ec53b11f | 17,015,049 |
| universal | 84653905 | 71e495ff5a5909a4036f1c405bb1a60948798467a03c40fef3ae2275816540ba | 18,630,176 |
| x86 | f724e7ae | a088d47f15742d90762fb9a911f86bd2b0dbecbe8d3732edc3d97f6b853c3659 | 16,279,376 |
| x86_64 | dd21fa82 | 1ea2f046d9e7893b2af17b65b70903bef5bf2c9d1053e3d160ac802a40217f6f | 17,102,256 |

The file names are `autojs6-plugin-ace-editor-v2.0.2-<abi>-<crc32>.apk`.
