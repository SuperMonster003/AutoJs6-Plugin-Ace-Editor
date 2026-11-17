# Ace Editor 2.50.0

Validated on 2026-11-17. Final versionCode: 423. Tag `v2.50.0` is `a9daece`; this file was added after the tag.

It brings together the changes after 2.49.0 (`docs/development/release-2.49.0.md`). It requires AutoJs6 build 5352 or
later, as 2.49.0 does.

## Changes

The ten-language entries of `v2.50.0` are in `.changelog/lang_*.json`.

- Script completion declares the APIs of AutoJs6 6.8.1 and its plugins (bundled declarations `@sm003/autojs6-dts`
  4.88.0): plugin categories of `settings.categories` and `settings.export`, the reason of `ai.agent.status`, `camera`
  (3-Prism Camera), the 1.6.0 API of 3-Macaw Speech, `alarms` with timers, stopwatch, holidays and `beforeRing`
  (3-Chime Alarm), `video` and `audio` (3-Slate Studio), `pdf` (3-Paper PDF), `xlsx` (3-Tally Sheet, also for Node.js and
  Bun), `debugging`, shared screen capture options and the proxy option of `http`. AutoJs6 6.8.1 was not released when
  this version was published; the declarations only describe those APIs.
- Editor font downloads run on the shared download kit of the official plugins (AutoJs6 plugin-center P13.1,
  `libs/download-kit.aar` from AutoJs6 `b38fb2c46`): an interrupted download is retried and continues from where it
  stopped, also after a cancel, and when one download URL fails the next one continues the part already received. See
  `docs/development/font-download-kit-device-2026-11-17.md`.

## Validation

- The pre-push check on `a9daece` passed (6 / 6), with the 193 JVM tests of `:app:testDebugUnitTest` (39 classes, 0
  failures).
- GitHub workflows on `a9daece`: Build integrity passed (JVM tests, lint, assembly and the instrumentation run of 92
  tests on an API 35 emulator), Markdown integrity and Icon Studio recipe passed.
- Font download device check (temporary API 33 emulator, debug build of the same tree): an interrupted download resumed
  with `Range` and `If-Range`, the next mirror continued the part on disk, and a file with another SHA-256 was refused
  with nothing installed (3 / 3).
- Signed release build: `verifySignedReleaseArtifacts`, the 16 KB native page alignment gate (all variants and
  release) and `appendDigestToReleasedFiles` passed for all five APKs. Each APK reports versionCode 423 and is signed
  with the certificate `31a681fcfffb3e428420cae280ded89292b12a3b0f59e19b7a73e32a8ae4c213`. The release x86_64 APK
  contains the download kit and kotlinx-coroutines classes.
- Temporary API 33 emulator with an AutoJs6 debug host of versionCode 6640: the final x86_64 APK passed the 8 host
  loading tests of `AceEditorPluginHostDeviceTest`, with no missing class reported. The rename test first stopped at the
  system notification permission dialog of the freshly installed host, and passed after the permission was granted.

## Final APKs

| ABI | CRC32 | SHA-256 | Size (bytes) |
| --- | --- | --- | ---: |
| arm64-v8a | 5e9d2d96 | d6f5c137b83be317bc779e338b2570e03d98f2828cab54345c28379e23768e72 | 18,605,182 |
| armeabi-v7a | 5b1414f1 | a5a546968071e55e355610430a2c396f6e0c5b107a5b0d907e3f23bf7c33e29e | 18,550,884 |
| universal | 41774141 | 72c880f04331c478e68e3032694c95ad28676a984153b1bbe84119c98ab07909 | 20,166,011 |
| x86 | e15ceee0 | b686457b13b6bdc4294b8be2b91062537d4eef66bcd9458d1c34af21ed6e02fe | 17,815,207 |
| x86_64 | f785155a | 015556b0ad76195ac2ba6b665f2245be5368026a0386f57cc78934f880b5c3e9 | 18,638,087 |

The file names are `autojs6-plugin-ace-editor-v2.50.0-<abi>-<crc32>.apk`.
