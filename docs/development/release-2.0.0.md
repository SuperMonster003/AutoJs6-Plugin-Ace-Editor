# Ace Editor 2.0.0 (draft)

Draft prepared on 2026-10-14 on the local branch `ace-1.44.0` (`Roadmap-Ace-1.44.0.md`). The merge commit
sets `VERSION_NAME=2.0.0`, adds the changelog, rebuilds the signed release APKs and fills in the final
hashes (A8-8). Until then, this file records the validation done on the branch.

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
  include Lua and Java semantics inside the AutoJs6 process (also broken in 1.32.0) and Baidu and Sogou
  select mode arrows.

## Changelog

The ten-language `v2.0.0` entries are in `release-2.0.0-changelog.json` (hint 1, feature 6, fix 4,
improvement 12, dependency 1). At merge, insert each language's entry as the first key of `$data` in
`.changelog/lang_*.json` with `released_date`, set `VERSION_NAME=2.0.0`, then run
`py .python/generate_markdown.py` and `py .python/generate_markdown.py --check`. A dry run in a temporary copy
with `VERSION_NAME=2.0.0` passed on 2026-10-14 (25 artifacts generated and checked).

## Validation

- Static gates (A8-1, 2026-10-14, `4db529f`): 175 JVM tests passed; `lintDebug` reported 0 errors and 62 warnings;
  `:app:check` passed with all eleven verification tasks (Ace asset lock, overlay replay, bridge tests, bridge type
  check, LSP runtime, language indices, Python worker, LuaLS, Java, Kotlin P2+); the pre-push check passed 6/6.
- Bridge tests in jsdom: 50 passed; bridge type check: 7 scripts; mobile overlay replay: 558 checks (36
  touch scenarios identical to the 1.4.12 build, 9 intended differences, 5 action mode scenarios).
- Device instrumentation (A8-2, 2026-10-14, builds 257 - 260): the full suite (52 tests, two compiler probes skipped by
  design) passed on all eight devices after attribution: the six phones, an x86 API 27 emulator (WebView 69) and an
  x86_64 API 36.1 16 KB emulator (WebView 134, started with 6 GB of memory), where only the first injected tap is lost
  as it has been since the 1.4.12 baseline. The rerun fixed the tooltip font size on WebView before 79 and three test
  harness problems (see Roadmap A8-2).
  The device tests added on 2026-10-14 cover manual checks (`AceManualCoverageDeviceTest`, 10 tests) and
  replay the input connection calls of Gboard, Baidu and Sogou (`AceImeReplayDeviceTest`, 12 tests):

  | Device | API / WebView | Coverage (10) | IME replay (12) |
  | --- | --- | --- | --- |
  | OPD2413 | 35 / 136 | passed | passed |
  | 23046RP50C | 35 / 130 | passed | passed |
  | XQ-DQ72 | 33 / 153 | passed | passed |
  | 22120RN86C | 33 / 111 | passed | passed |
  | G8441 | 28 / Chrome 126 | passed | passed |
  | x86 emulator-5560 | - / 83 | passed | not finished (emulator reclaimed) |
  | XQ-AT72 | 31 / 145 | manual | manual |

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
- Signed release build, `verifySignedReleaseArtifacts` and the 16 KB native page alignment gate passed for
  all five APKs (2026-10-14, `710f323`).
- Host joint verification (A8-9): with the signed release plugin from `710f323` and a host containing A7-2 on
  22120RN86C, `AceEditorPluginHostDeviceTest` passed 7/7 and the Ace companion release smoke test 1/1, and the new
  settings switches applied without restarting the editor.

## Size (A8-5)

Signed release APKs, branch at `710f323` compared with 1.32.0 (`f067e63`), same machine and signing key:

| APK | 1.32.0 | 2.0.0 branch | Difference |
| --- | ---: | ---: | ---: |
| universal | 18,526,284 | 18,619,164 | +92,880 (+0.5%) |
| arm64-v8a | 16,965,455 | 17,058,335 | +92,880 (+0.5%) |
| armeabi-v7a | 16,911,157 | 17,004,037 | +92,880 (+0.5%) |
| x86 | 16,175,484 | 16,268,360 | +92,876 (+0.6%) |
| x86_64 | 16,998,364 | 17,091,240 | +92,876 (+0.5%) |

The main changes are Ace 1.44.0 itself (+62,215 B compressed), the mobile overlay (+18,695 B) and the
bridge (+20,333 B). Details are in `tools/ace-lsp/MILESTONE_BASELINES.md` ("A8-5").

## Recorded limits

- Replacing a document with one 500,000 character line is about 20% (25-30 ms) slower than with 1.4.12
  on G8441. The difference comes from Ace 1.44.0 itself; the maintainer accepted it (G-A6-4).
- The host's language support matrix still shows TSX syntax as partial. Update it in the host release
  that pairs with 2.0.0; 1.x plugins really are partial there.
- Building master and this branch in the same working copy: master packages the generated declaration
  assets left by the other Ace directory (+1.79 MB). The branch generator removes them. This affects local
  builds only.
- The x86 emulator `emulator-5554` crashed natively (memory reclaim, SIGTRAP) during the new device tests.
  This is environmental, and the emulator was not counted.
- On WebView 69, an IME edit that arrives within about 100 ms of a programmatic cursor move can work on the
  previous row's text, because the hidden textarea has not caught up yet. A person's next key comes much later.

## Final APKs

To be filled in at merge (A8-8): CRC32 and SHA-256 of the five signed release APKs built from the merge
commit.
