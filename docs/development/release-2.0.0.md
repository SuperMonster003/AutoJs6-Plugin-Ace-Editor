# Ace Editor 2.0.0

Validated on 2026-10-14. Final versionCode: 265.

Developed on the branch `ace-1.44.0` (`Roadmap-Ace-1.44.0.md`) and fast-forwarded into `master` with the release
commit. AutoJs6 builds 5352 or later with Editor API contract 7 load it, the same requirement as 1.32.0.

## Changes

- Replaced the Auto.js build of Ace 1.4.12 with the official `ace-builds@1.44.0` files. They stay
  byte-identical to the npm tarball; `tools/ace-lsp/ace-builds-lock.json` records them. Project files are
  limited to `autojs6/` and four documented exceptions (two snippets, two Visual Studio themes).
- Rebuilt the mobile touch behavior as the plugin's own overlay in `autojs6/mobile/`: taps, double tap and
  long press word selection, cursor and selection handle dragging, fling, the insertion toolbar, the
  selection toolbar state and the drag magnifier. It removes Ace's own touch listeners at runtime.
- New editor options: vector gutter icons, active indent guide highlighting, whitespace in selection, editor
  scrollbars with auto hide, symbol occurrence highlighting, the drag magnifier and the inline completion
  preview. Host keys and defaults are listed in Roadmap A7-1. AutoJs6 exposes them in code editor
  settings (host commit `b7df923aaa`); older hosts use the defaults.
- TSX uses Ace's official tsx mode, and JSON documents use Ace's JSON worker when it answers.
- Fixes from the maintainer's manual tests and the new device tests, listed in Roadmap A2-10. They
  include Lua and Java semantics inside the AutoJs6 process (also broken in 1.32.0) and the select mode
  arrows of Baidu and Sogou, which send Shift as a separate key event. Modifier keys an input method sends
  on its own (Shift, Ctrl, Alt, Meta) apply to the following keys again, as they did with the 1.4.12 build.

## Changelog

The ten-language `v2.0.0` entries (hint 1, feature 6, fix 4, improvement 12, dependency 1) are in
`.changelog/lang_*.json` with the release date 2026/10/14. The other nine languages were reviewed against the
Chinese entries and the host's settings labels. README and changelog Markdown files were regenerated with
`py .python/generate_markdown.py`, and `py .python/generate_markdown.py --check` passed.

## Validation

- Static gates on the release tree (2026-10-14): 177 JVM tests passed; `lintDebug` reported 0 errors and 62
  warnings; `:app:check` passed with all eleven verification tasks (Ace asset lock, overlay replay, bridge tests,
  bridge type check, LSP runtime, language indices, Python worker, LuaLS, Java, Kotlin P2+); the pre-push check
  passed 6/6.
- Bridge tests in jsdom: 50 passed; bridge type check: 7 scripts; mobile overlay replay: 558 checks (36
  touch scenarios identical to the 1.4.12 build, 9 intended differences, 5 action mode scenarios).
- Device instrumentation (A8-2, 2026-10-14, builds 257 - 260): the full suite (52 tests, two compiler probes skipped by
  design) passed on all eight devices after attribution: the six phones, an x86 API 27 emulator (WebView 69) and an
  x86_64 API 36.1 16 KB emulator (WebView 134, started with 6 GB of memory), where only the first injected tap is lost
  as it has been since the 1.4.12 baseline. The rerun fixed the tooltip font size on WebView before 79 and three test
  harness problems (see Roadmap A8-2).
  The device tests added on 2026-10-14 cover manual checks (`AceManualCoverageDeviceTest`, 10 tests) and
  replay the input connection calls of Gboard, Baidu and Sogou (`AceImeReplayDeviceTest`, 12 tests, 13 with the
  Ctrl+A case added later):

  | Device | API / WebView | Coverage (10) | IME replay (12) |
  | --- | --- | --- | --- |
  | OPD2413 | 35 / 136 | passed | passed |
  | 23046RP50C | 35 / 130 | passed | passed |
  | XQ-DQ72 | 33 / 153 | passed | passed |
  | 22120RN86C | 33 / 111 | passed | passed |
  | G8441 | 28 / Chrome 126 | passed | passed |
  | x86 emulator-5560 | - / 83 | passed | not finished (emulator reclaimed) |
  | XQ-AT72 | 31 / 145 | manual | manual |

  The Ctrl+A case (build 262) passed 13/13 on 22120RN86C, 23046RP50C and G8441.
- Manual tests on XQ-AT72 (`ace-1.44.0-manual-tests.md`, `ace-1.44.0-manual-tests-baidu-ime.md`): appendix B
  (22 items), appendix C with Gboard and Baidu IME, and visual items V1 to V10. All problems found were
  fixed and passed the retest. The last retest, of Baidu C4 and inline preview C11, used build 250. There
  is no P1.
  The diagnostics after this retest show no `imeTextInputSelectionDropped` events and no failures.
- Host settings (A7-2) on 22120RN86C: all eight switches are visible, and toggling one applies without
  restarting the editor.
- The host's `AceEditorPluginHostDeviceTest` passed 7/7 on XQ-AT72 and 22120RN86C after three test fixes
  in host commit `8126740e0e` (a diagnostic script that threw into the page, a stale contract version and a
  theme key that depended on the night mode source).
- Startup performance (A8-3, 2026-10-13): the medians stay within +10% of the 1.4.12 baseline on all three
  baseline devices (largest: +4.7%).
- Signed release build: `verifySignedReleaseArtifacts`, the 16 KB native page alignment gate (all variants and
  release) and `appendDigestToReleasedFiles` passed for all five APKs. Each APK reports versionCode 265 and
  versionName 2.0.0, carries the expected ABIs, is signed with the certificate
  `31a681fcfffb3e428420cae280ded89292b12a3b0f59e19b7a73e32a8ae4c213`, and its CRC32 matches the file name.
  Every packaged asset tracked by Git has the repository's bytes (LF line endings). A first build was discarded:
  after the A8-5 comparison had switched branches, `core.autocrlf=true` had rewritten 227 asset files in the working
  copy with CRLF, and that build packaged them so. The files were restored from the index and everything above was
  rerun.
- Host joint verification (A8-9) with the final APKs: on 22120RN86C (API 33, WebView 111) the final arm64-v8a APK
  replaced the debug plugin, with a host debug build containing `b7df923aaa`, `8126740e0e` and `21252648f1`.
  `AceEditorPluginHostDeviceTest` passed 7/7 and the Ace companion release smoke test 1/1. The language support
  matrix lists TSX syntax as full, all eight new switches are visible, and turning "Whitespace in selection" off and
  on again from the editor's settings dialog applied to the open selection without restarting the editor. The
  switch was left at its default. The discarded first build and an earlier pass with the signed release from
  `710f323` had the same results.

## Size (A8-5)

Signed release APKs compared with 1.32.0 (`f067e63`), same machine and signing key:

| APK | 1.32.0 | 2.0.0 | Difference |
| --- | ---: | ---: | ---: |
| universal | 18,526,284 | 18,627,816 | +101,532 (+0.5%) |
| arm64-v8a | 16,965,455 | 17,066,991 | +101,536 (+0.6%) |
| armeabi-v7a | 16,911,157 | 17,012,689 | +101,532 (+0.6%) |
| x86 | 16,175,484 | 16,277,016 | +101,532 (+0.6%) |
| x86_64 | 16,998,364 | 17,099,896 | +101,532 (+0.6%) |

The 1.32.0 reference build packaged 295 text assets with CRLF line endings from a Windows working copy (647,335
extra bytes before compression); the 2.0.0 APKs package none. With line endings made equal, the content of the
universal APK grows by about 121.5 KB (+0.7%). The main changes are Ace 1.44.0 itself (+62,215 B compressed), the
mobile overlay (+18,695 B) and the bridge (+20,333 B); details are in `tools/ace-lsp/MILESTONE_BASELINES.md` ("A8-5").
Since the branch measurement at `710f323`, the ten-language 2.0.0 changelog packaged with the plugin added 14,567 B.

## Recorded limits

- Replacing a document with one 500,000 character line is about 20% (25-30 ms) slower than with 1.4.12
  on G8441. The difference comes from Ace 1.44.0 itself; the maintainer accepted it (G-A6-4).
- The host's language support matrix shows TSX syntax as fully supported from AutoJs6 commit `21252648f1`
  on. That host also lists it so with a 1.x plugin, whose TSX highlighting is partial.
- Building master and this branch in the same working copy: master packages the generated declaration
  assets left by the other Ace directory (+1.79 MB). The branch generator removes them. This affects local
  builds only.
- The x86 emulator `emulator-5554` crashed natively (memory reclaim, SIGTRAP) during the new device tests.
  This is environmental, and the emulator was not counted.
- On WebView 69, an IME edit that arrives within about 100 ms of a programmatic cursor move can work on the
  previous row's text, because the hidden textarea has not caught up yet. A person's next key comes much later.
- Release builds on Windows package text assets with the line endings of the working copy. With
  `core.autocrlf=true`, every file a checkout rewrites becomes CRLF (the published 1.13.1 contains 136 such assets;
  both line endings work at runtime). No repository rule pins these assets to LF yet, so a release build should check
  `git ls-files --eol -- app/src/main/assets` first.
- The plugin's debug instrumentation APK cannot run against the R8 release; release validation uses the host's
  `AceEditorPluginHostDeviceTest` and `CompanionReleaseSmokeTest` instead, as for 1.13.1.

## Final APKs

| ABI | CRC32 | SHA-256 | Size (bytes) |
| --- | --- | --- | ---: |
| arm64-v8a | d02eed49 | 93e206043ef0f713d9b04e19650c585ea0d724edf89944add8ebfc5c6568b700 | 17,066,991 |
| armeabi-v7a | bb98ae35 | 1b60df217714d4631554159ade4b3a5c6bb087e9f6a61eb6713d0bc989b67738 | 17,012,689 |
| universal | ae0c3b6c | f98244d6e7da46eed24d613e6a47e99f18efaea992eed6eaeb0efef96a93c483 | 18,627,816 |
| x86 | e27d34dd | 6dc7f10f1908848fb4b87e06dcba53c3d4c4ebd69a99bf2cc87e57b9c5b3d4f3 | 16,277,016 |
| x86_64 | 8a53ccf9 | fc0504ac1a0d5bdb1116d43843864718a39041a61e256fbf4fb29fa7a2eee27d | 17,099,896 |

The file names are `autojs6-plugin-ace-editor-v2.0.0-<abi>-<crc32>.apk`. Older artifacts in `releases/` were
preserved; the five APKs of the discarded first build are not part of the release.
