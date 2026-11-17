# Font downloads on the shared download kit: device check (2026-11-17)

AutoJs6 plugin-center roadmap, phase 2, item P13.1: the editor font downloader (`core/font/FontDownloader.kt`) runs on the
shared download kit of the official plugins (`libs/download-kit.aar`, AutoJs6 `plugin-api/download-kit` at `b38fb2c46`,
SHA-256 `31d4cdd169c6d05f08066716e95307576ca4976525257dbe023802cbc5e81364`). It is the same code as the font downloader
of the AutoJs6 host (`5366c5df5`, plugin-center P12.2) apart from the package name, plus the cleanup of `3b4c0c6` that
removes the part file before failure listeners run.

## Behaviour

- A cut transfer is retried on the same mirror (after 2 s, then 5 s) and asks only for the remaining bytes
  (`Range: bytes=N-` with `If-Range`).
- When a mirror keeps failing, the next mirror continues the bytes already on disk (`Range` without `If-Range`; the final
  SHA-256 check decides).
- A cancelled download keeps its bytes under `<font store>/.downloads/` and the next request continues from there.
- A file with another size or SHA-256 is refused with nothing installed; the font dialog still reports it as an integrity
  failure (`FontFileValidationException`).
- The kit is only a staging area: the verified file is moved into the font store's part file and installed with the
  checks of `FontStore.installVerifiedPart` (size, SHA-256, WOFF2 header), then the kit entry is removed.

## Device run

- Device: temporary AVD `pc2_p13_api33` (pixel_6, API 33 google_apis x86_64, 3 GB), `-no-window -gpu swiftshader_indirect`.
- Build: debug x86_64 APK of the working tree that became the P13.1 commit (versionCode 421, versionName 2.50.0, md5
  `3508474a`) and its androidTest APK. No AutoJs6 host is needed: the test drives the downloader in the plugin process.
- Command: `py -3.12 -I -u tools/device/font_download_check.py -s emulator-5634 --work <dir> install`, then `run`, then
  `cleanup`. The tool serves a 614400-byte font with a WOFF2 header on 127.0.0.1:8768 through `adb reverse` and checks the
  request log of `FontDownloadKitDeviceTest` (opt-in with `-e p13Port`, skipped otherwise, so CI is not affected). Debug
  builds allow plain HTTP to 127.0.0.1 only (`app/src/debug/res/xml/debug_network_security_config.xml`).
- Result: 3 / 3 PASS, 7 requests, instrumentation 10.2 s.

| Scenario | Test | Requests (route, status, Range, If-Range, bytes sent) | Result |
| --- | --- | --- | --- |
| Interrupted download resumes | `fontResumesACutTransfer` | cut1 200, 245760 B, connection closed; 2.0 s later cut1 206 `bytes=245760-` with If-Range, 368640 B (= the remaining bytes) | installed, SHA-256 matches, kit emptied, 2092 ms |
| Next mirror continues | `fontNextMirrorContinuesTheBytes` | cutdead 200, 245760 B, closed; cutdead 503 after 2.0 s and again after 5.1 s; ok 206 `bytes=245760-` without If-Range, 368640 B | installed, kit emptied, 7228 ms |
| Another hash is refused | `fontWithAnotherHashIsRejected` | other 200, 614400 B (one byte changed), no retry | `FontMirrorsExhaustedException` caused by `FontFileValidationException`; nothing installed, no part file, no kit file |

## Unit tests

`:app:testDebugUnitTest --tests 'io.github.supermonster003.autojs6.plugin.ace.editor.core.font.*'`: 6 classes, 46 tests,
0 failures. New: `FontDownloaderKitTest` (5 tests over HTTP with the OkHttp source: a cut transfer resumes with Range and
If-Range, a 503 is retried on the same mirror, the next mirror continues the bytes of the first, a cancelled download
continues from where it stopped, a file with another hash is refused). `FontDownloaderTest` keeps its 16 tests; one is
adapted as in the host: an immediate retry after a cancel may join the transfer that is still running for the same file.
`TinyHttpServer` in the test sources is a copy of the kit's test server, since the AAR carries no test sources.
