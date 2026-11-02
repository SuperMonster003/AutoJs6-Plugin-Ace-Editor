# Ace Editor 2.49.0

Validated on 2026-11-02. Final versionCode: 393. Tag `v2.49.0` is `8d9e26a`; this file was added after the tag.

It brings together the 55 versions after 2.0.2 (`docs/development/release-2.0.2.md`). It requires AutoJs6 build 5352 or
later, as 2.0.2 does. The latest public AutoJs6 release, 6.7.0 (build 3804), is below that requirement.

## Changes

The ten-language entries `v2.0.3` to `v2.49.0` are in `.changelog/lang_*.json`. Script completion follows the AutoJs6
6.8.0 API: bundled declarations `@sm003/autojs6-dts` 4.87.0, the members and returned objects of Node.js Runtime 2.1.0
and Bun Runtime 0.22.0, `imgui` and `$imgui` with AutoJs6 Plugin ImGui 1.18.x in Rhino scripts, and the AutoJs6 APIs of
the Python, Lua, Java and Kotlin runtimes.

## Validation

- The pre-push check on `8d9e26a` passed, and the JVM part of it ran with Gradle on `ea3daf6`, the commit before it,
  which changed one instrumentation test file only.
- GitHub workflows on `8d9e26a`: Build integrity passed (JVM tests, lint, assembly and all 84 instrumentation tests on
  an API 35 emulator), and Markdown integrity passed.
- The two instrumentation tests that failed on `ea3daf6` asserted that `sync` and `getInputStream` must not be offered.
  Both are declared members now, so `8d9e26a` asserts the opposite. Both tests passed alone on a read-only API 35
  16 KB emulator. A run of the whole class there ended early when the test process crashed under memory pressure on
  that 2 GB image, so the GitHub run above is the evidence for the rest of the class.
- Signed release build: `verifySignedReleaseArtifacts`, the 16 KB native page alignment gate and
  `appendDigestToReleasedFiles` passed for all five APKs. Each APK is signed with the certificate
  `31a681fcfffb3e428420cae280ded89292b12a3b0f59e19b7a73e32a8ae4c213`.
- 22120RN86C (API 33) with an installed host of versionCode 5935: the final arm64-v8a APK replaced 2.0.2.
  `CompanionReleaseSmokeTest` passed 2/2 together with Offline Docs 6.8.40, and `AceEditorPluginHostDeviceTest` passed
  8/8, with no crash record for the plugin. The host of that device predates the host commits of 2.49.0, so these runs
  cover loading and the editor contract, not the 6.8.0 APIs that completion describes.
- The official index generator accepted this release in a local simulation before the tag, and in the real run after
  it.

## Final APKs

| ABI | CRC32 | SHA-256 | Size (bytes) |
| --- | --- | --- | ---: |
| arm64-v8a | d868042c | 06b139fa293e4f930680d191c914213adb2e80d274b7bdeedd3b02bf0a65af9a | 18,130,684 |
| armeabi-v7a | 3b19eeb1 | 951a0634b005169d7ee884486d16f1608c22848beddea21aab93fbd883bb84ed | 18,076,382 |
| universal | 960a9512 | 68345fea82d57184c7b94d03c464f6c836f01874045ad25a635063a631db43d8 | 19,691,513 |
| x86 | f2122c1a | 840cd087ea18191b62dff122fa7ced2afd5c5a2b82eed6bb65a26198747f99d4 | 17,340,709 |
| x86_64 | 1f8bba8a | 324c9e132847f30f7f36ee1b7d32838acd5fc31fe3930e2aadf9f6e7e6bfaab2 | 18,163,589 |

The file names are `autojs6-plugin-ace-editor-v2.49.0-<abi>-<crc32>.apk`.
