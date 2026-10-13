# Third-Party Notices

AutoJs6 Ace Editor Plugin includes the components listed below. Copyright notices and license texts remain with the bundled assets. This file is informational and does not replace those license texts.

## Ace 1.44.0

- Project: [Ace](https://github.com/ajaxorg/ace)
- Copyright: Ajax.org B.V. and Ace contributors
- License: BSD 3-Clause
- Use: Browser-based code editor runtime, modes, snippets, themes, workers, and extensions
- Source: npm `ace-builds@1.44.0` (`https://registry.npmjs.org/ace-builds/-/ace-builds-1.44.0.tgz`, shasum `d657730f665fccf72d2945d95887e12c514a29f1`, integrity `sha512-PFNMSYqFdEUkul2Ntud0HvA09AgY+F1ag0UYdpMH60wNI/qOA8cB8tlTgoALMEwIdUPJK2CjrIQ7OnbiSS/ugQ==`). Files under `src-min-noconflict/` are byte-identical to the tarball except the project-maintained `snippets/kotlin.js`, `snippets/python.js`, `theme-visual_studio.js` and `theme-visual_studio_dark.js` (see `tools/ace-lsp/ace-builds-lock.json`).
- Bundled license: [`app/src/main/assets/editor/ace-builds-1.44.0/LICENSE`](app/src/main/assets/editor/ace-builds-1.44.0/LICENSE)

## AutoJs6 Mobile Touch Overlay

- Files: `app/src/main/assets/editor/ace-builds-1.44.0/autojs6/mobile/`
- Use: touch gestures, fling, selection toolbar state and drag magnifier on top of the unmodified Ace 1.44.0
- Origin: written for AutoJs6 from the behavior specification in `tools/ace-mobile/README.md`. The editor build shipped before Ace 1.44.0 carried mobile customizations of unverified, likely closed-source origin; the overlay does not copy them, and the repository keeps no copy of them outside Git history.
- The fling interpolation in `autojs6_mobile_scroller.js` follows `android.widget.Scroller` of the Android Open Source Project (Copyright (C) 2006 The Android Open Source Project, Apache License 2.0).
- The least squares solver in `autojs6_mobile_velocity_tracker.js` follows regression-js 2.0 (Copyright (c) Tom Alexander, MIT License).
- Bundled notices: [`app/src/main/assets/editor/ace-builds-1.44.0/autojs6/mobile/THIRD_PARTY_NOTICES.txt`](app/src/main/assets/editor/ace-builds-1.44.0/autojs6/mobile/THIRD_PARTY_NOTICES.txt)

## TypeScript 6.0.3

- Project: [TypeScript](https://github.com/microsoft/TypeScript)
- Copyright: Microsoft Corporation and TypeScript contributors
- License: Apache License 2.0
- Use: Bundled language-service runtime used by JavaScript and TypeScript editing features
- Bundled license: [`app/src/main/assets/editor/ace-builds-1.44.0/autojs6/typescript/LICENSE.txt`](app/src/main/assets/editor/ace-builds-1.44.0/autojs6/typescript/LICENSE.txt)
- Bundled third-party notices: [`app/src/main/assets/editor/ace-builds-1.44.0/autojs6/typescript/ThirdPartyNoticeText.txt`](app/src/main/assets/editor/ace-builds-1.44.0/autojs6/typescript/ThirdPartyNoticeText.txt)

TypeScript contains material attributed to additional projects and contributors. The bundled `ThirdPartyNoticeText.txt` is part of the distribution and must be retained with redistributed copies.

## Pyright 1.1.413 and typeshed

- Project: [Pyright](https://github.com/microsoft/pyright/tree/789d8275fef25f347ffef7b847305fefd8a3e363)
- Copyright: Microsoft Corporation and Pyright contributors
- License: MIT
- Stub source: [typeshed](https://github.com/python/typeshed/tree/289e5d3568961c8bcd33d01eef5b7ec5e1ad33ad), Apache License 2.0
- Use: Bundled Python 3.12 semantic-analysis WebWorker and its selected standard-library stubs
- Bundled license inventory: [`app/src/main/assets/editor/ace-builds-1.44.0/autojs6/python/THIRD_PARTY_LICENSES.txt`](app/src/main/assets/editor/ace-builds-1.44.0/autojs6/python/THIRD_PARTY_LICENSES.txt)

The generated license inventory also retains the notices for the exact browser polyfills and VS Code
language-server runtime packages incorporated into the Worker. Its byte count, SHA-256, component
inventory, and dependency versions are locked by the adjacent Python Worker manifest and verification
task.

## LuaLS 3.18.2 and bundled runtime components

- Project: [LuaLS / lua-language-server](https://github.com/LuaLS/lua-language-server/tree/b5e57c36a9a27b89eb283861fb8946fa787e37d8)
- Copyright: 2018 最萌小汐 and LuaLS contributors
- License: MIT
- Use: Fully offline Lua 5.4-compatible semantic analysis in an on-device companion process
- Bundled license inventory: [`app/src/main/assets/luals/THIRD_PARTY_LICENSES.txt`](app/src/main/assets/luals/THIRD_PARTY_LICENSES.txt)

The Android executable and runtime assets are reproducibly built from the pinned LuaLS tag, commit,
submodules, and Android NDK toolchain recorded in
[`tools/ace-lsp/luals-build-lock.json`](tools/ace-lsp/luals-build-lock.json). The bundled inventory
retains the applicable MIT notices for LuaLS, Lua, bee.lua, lpeglabel, json.lua, EmmyLuaCodeStyle,
{fmt}, and SymSpell, together with the Boost Software License notice used by EmmyLuaCodeStyle. The
adjacent manifest locks every redistributed runtime file and each supported ABI executable by size
and SHA-256.

## Eclipse Compiler for Java 3.26.0 and Android API 36 stubs

- Project: [Eclipse JDT Core](https://github.com/eclipse-jdt/eclipse.jdt.core)
- Compiler artifact: `org.eclipse.jdt:ecj:3.26.0`, Eclipse Public License 2.0
- Stub source: Android SDK `platforms;android-36/android.jar`
- Use: Offline, single-file Java diagnostics on Android ART
- Bundled notice inventory: [`app/src/main/assets/java/ecj/THIRD_PARTY_LICENSES.txt`](app/src/main/assets/java/ecj/THIRD_PARTY_LICENSES.txt)

The ECJ artifact retains its upstream `about.html` notice. The generated classpath archive contains
only class-signature entries from the Android SDK stub jar; it contains no platform implementation
code, source, resources, or documentation. Its source and output hashes, byte size, and class count
are locked by the adjacent manifest and `tools/ace-lsp/build-ecj-classpath.ps1`.

## Iosevka Web Font

- Project: [Iosevka](https://github.com/be5invis/Iosevka)
- Copyright: 2015-2026, Renzhi Li and Iosevka contributors
- License: SIL Open Font License 1.1
- Use: Default monospace editor Web font
- Bundled license: [`app/src/main/assets/editor/ace-builds-1.44.0/fonts/iosevka/LICENSE.md`](app/src/main/assets/editor/ace-builds-1.44.0/fonts/iosevka/LICENSE.md)

The font files may be embedded and redistributed under the OFL conditions. The font software and its license must remain together in redistributed copies.

## Static Completion API References

The generated Python, Lua, Java, Android, and Kotlin completion indices contain a curated subset of
public API identifiers and signatures. They do not bundle upstream source code, stub files, manual
text, or documentation prose; descriptions emitted by the generator are project-authored. The
following upstream materials were used as factual references and are recorded here for traceability:

- [typeshed](https://github.com/python/typeshed/tree/d097b16922b98d06980c4be8050b44132da76ba1/stdlib),
  pinned at commit `d097b16922b98d06980c4be8050b44132da76ba1`, and the
  [Python 3.12 library reference](https://docs.python.org/3.12/library/): Python builtins and selected
  standard-library APIs. Typeshed is Apache-2.0 licensed; Python documentation is distributed under
  the PSF License Agreement.
- [Lua 5.4 Reference Manual](https://www.lua.org/manual/5.4/manual.html) and
  [Lua 5.4.8](https://www.lua.org/ftp/lua-5.4.8.tar.gz): base and standard-library APIs. Lua is
  distributed under the MIT license.
- [Java SE 17 API](https://docs.oracle.com/en/java/javase/17/docs/api/) and
  [Android API reference](https://developer.android.com/reference/packages) at API level 35: selected
  Java and Android platform APIs. Only API names and signatures are represented; no implementation
  code or documentation prose is bundled.
- [Kotlin 2.2.21 standard-library API](https://kotlinlang.org/api/core/kotlin-stdlib/): selected Kotlin
  top-level and standard-library APIs. Kotlin is Apache-2.0 licensed.

The deterministic generator and its exact scope are recorded in
[`tools/ace-lsp/generate-language-indices.mjs`](tools/ace-lsp/generate-language-indices.mjs). Each
generated index also embeds its language version, source revision, scope, and reference URLs.

## AutoJs6 Type Declarations and Editor Assets

- Project: [AutoJs6](https://github.com/SuperMonster003/AutoJs6)
- License: Mozilla Public License 2.0
- Use: AutoJs6 JavaScript type declarations and editor integration assets
- Bundled declaration license: [`app/src/main/assets/editor/ace-builds-1.44.0/autojs6/types/autojs6/LICENSE`](app/src/main/assets/editor/ace-builds-1.44.0/autojs6/types/autojs6/LICENSE)
- Repository license: [`LICENSE`](LICENSE)

AutoJs6-specific bridge scripts, style sheets, declarations, and other project-authored editor assets are covered by the repository license unless a file carries a more specific notice.
