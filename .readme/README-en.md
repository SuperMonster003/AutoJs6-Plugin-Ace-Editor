<!--suppress HtmlDeprecatedAttribute, HttpUrlsUsage -->

<div align="center">
  <p>
    <picture>
      <source srcset="https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/app/src/main/res/mipmap-night/ic_launcher.png?raw=true" media="(prefers-color-scheme: dark)" />
      <img src="https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/app/src/main/res/mipmap/ic_launcher.png?raw=true" alt="autojs6-plugin-ace-editor-ic-launcher" border="0" width="128" />
    </picture>
  </p>

  <p>Embedded Ace code editor with language services</p>

  <p>
    <a href="https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/releases"><img alt="GitHub release (latest by date)" src="https://img.shields.io/github/v/release/SuperMonster003/AutoJs6-Plugin-Ace-Editor?label=Release"/></a>
    <a href="https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/issues"><img alt="GitHub closed issues" src="https://img.shields.io/github/issues/SuperMonster003/AutoJs6-Plugin-Ace-Editor?color=A24232&label=Issues"/></a>
    <a href="https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/LICENSE"><img alt="GitHub License" src="https://img.shields.io/github/license/SuperMonster003/AutoJs6-Plugin-Ace-Editor?color=534BAE&label=License"/></a>
  </p>
</div>

******

### Languages

******

The current README.md supports the following languages:

- [简体中文 [zh-Hans]](https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/.readme/README-zh-Hans.md)
- [繁體中文 (香港) [zh-Hant-HK]](https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/.readme/README-zh-Hant-HK.md)
- [繁體中文 (台灣) [zh-Hant-TW]](https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/.readme/README-zh-Hant-TW.md)
- English [en] # current
- [Français [fr]](https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/.readme/README-fr.md)
- [Español [es]](https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/.readme/README-es.md)
- [日本語 [ja]](https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/.readme/README-ja.md)
- [한국어 [ko]](https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/.readme/README-ko.md)
- [Русский [ru]](https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/.readme/README-ru.md)
- [العربية [ar]](https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/.readme/README-ar.md)

******

### Introduction

******

The AutoJs6 Ace Editor Plugin separates the Ace WebView runtime, JavaScript bridge, input method adaptation, built-in language services, and editor assets from the host APK. It is installed as a regular Android APK and runs inside the AutoJs6 process through the typed Editor API.

******

### Features

******

- Provides plugin ID `ace-editor`, engine `editor`, and variant `ace`, with discovery through `org.autojs.plugin.INFO` and `org.autojs.plugin.EDITOR`.
- Uses Editor API contract 1 and requires AutoJs6 `6.8.0 Alpha7` build `5235` or later and Android API 24 or later.
- Supports text editing, undo/redo, search and replace, regex and whole-word search, cursor and selection navigation, line operations, breakpoints, comment toggling, and code formatting.
- Includes JavaScript/TypeScript language services and AutoJs6 type declarations with completion, hover, diagnostics, and signature help; JSON files receive syntax diagnostics.
- Adds bundled Python 3.12 semantic analysis through a lazy Pyright 1.1.413 WebWorker: type-aware completion, hover, signature help, diagnostics, and definition; unsupported older WebViews silently retain P2.
- Adds fully offline Lua semantics through an on-device LuaLS 3.18.2 companion process: completion, hover, signature help, diagnostics, and definition default on for arm64-v8a, armeabi-v7a, and x86_64; unsupported ABIs and runtime failures silently retain P2.
- Supports CRLF preservation, incremental text synchronization, chunked loading for large text, a lightweight mode for very long lines, IME adaptation, runtime health monitoring, and host native editor fallback notifications.
- Provides themes and display settings plus font management with signed catalog verification, SHA-256/WOFF2 validation, download, caching, installation, and removal.
- Localizes plugin metadata, README, and changelog content for Spanish, French, Russian, Arabic, Japanese, Korean, English, Simplified Chinese, Hong Kong Traditional Chinese, and Taiwan Traditional Chinese.

******

### Programming Language Support

******

The table below describes the currently bundled language capabilities. Semantic support includes type-aware completion, type diagnostics, hover, and signature help:

| Language | Syntax highlighting | Keyword completion | Snippets | Local completion | Semantic support |
|---|---:|---:|---:|---:|---:|
| JavaScript | Yes | Yes | Yes | Yes | Yes |
| JSX | Yes | No | No | Yes | Yes |
| TypeScript | Yes | Yes | Yes | Yes | Yes |
| TSX | Partial | Yes | Yes | Yes | Yes |
| JSON | Yes | No | No | No | Syntax diagnostics only |
| Python | Yes | Yes | Yes | Yes | Yes |
| Lua | Yes | Yes | Yes | Yes | Yes |
| Java | Yes | Yes | Yes | Yes | Single-file diagnostics |
| Kotlin | Yes | Yes | Yes | P2+ | No |

TSX uses the TypeScript mode in Ace 1.4.12, so JSX tag highlighting is partial. Python defaults to an offline Pyright 1.1.413 Worker with Python 3.12 standard-library stubs and falls back silently to P2 on an incompatible old WebView or runtime failure. Lua defaults to an offline LuaLS 3.18.2 companion process on arm64-v8a, armeabi-v7a, and x86_64 and falls back silently to P2 when its native runtime is unavailable or fails. Java combines isolated P2 standard-library and current-document completion with ECJ single-file diagnostics. Kotlin provides P2+ completion without a semantic provider.

AutoJs6 Code editor settings expose this same nine-mode matrix. The global LSP switch gates every semantic service, with per-language switches for TypeScript/JavaScript, Python, Lua, and Java; Kotlin remains visible but unavailable. The file-type list is evaluated first: removing a recognized suffix disables semantics for it, while adding a custom suffix only admits the file to the LSP path and does not classify it as another language or create a semantic provider.

******

### Build

******

Use the included Gradle Wrapper with JDK 17 or later and Android SDK 36:

```powershell
.\gradlew.bat :app:testDebugUnitTest :app:assembleDebug
```

Release build:

```powershell
.\gradlew.bat :app:assembleRelease
```

Build parameters and the version come from `version.properties`; the current minimum SDK is 24 and target SDK is 36.

After updating or adding `autojs6/types/**/*.d.ts`, run this task directly:

```powershell
.\gradlew.bat :app:generateAutoJs6LspDeclarations
```

The task validates declaration references and TypeScript 6 syntax, then generates the `core`, `android`, `libraries`, `resources`, and `main-app` LSP assets and their manifest. `assemble` and `mergeAssets` already depend on it, so normal builds require no extra step; external scripts can also invoke it directly. Generated files are written only to `app/build/generated/aceLspAssets` and never overwrite or delete the complete source declarations under `src/main/assets`. If Node is not in `PATH`, pass `-Pautojs6.nodeExecutable=<node-path>`.

After changing the curated Python, Lua, Java, or Kotlin static-index source in `tools/ace-lsp/generate-language-indices.mjs`, regenerate the committed assets with this task:

```powershell
.\gradlew.bat :app:generateAutoJs6LanguageIndices
```

The generator pins each language baseline and emits deterministic per-language assets under `autojs6/indices`; the editor loads only the active language on first use. `verifyAutoJs6LanguageIndices` detects stale generated files and is part of the normal verification chain.

After changing the pinned Pyright Worker source, regenerate the committed Python semantic assets explicitly with this task:

```powershell
.\gradlew.bat :app:generateAutoJs6PythonWorker
```

Verify the committed Worker version, typeshed and license hashes, size budget, semantic behavior, fallback, and lifecycle with:

```powershell
.\gradlew.bat :app:verifyAutoJs6PythonWorker
```

Normal APK assembly packages the committed, verified Worker and does not download or regenerate it. The semantic asset set is 4.822 MiB, below the 8 MiB optional-delivery threshold; old WebViews that cannot parse its ES2022 syntax continue with P2 without an error dialog.

After changing the pinned LuaLS source or build lock, rebuild the committed Android runtime explicitly with:

```powershell
.\tools\ace-lsp\build-luals-android.ps1 `
  -NdkRoot <android-sdk>\ndk\29.0.14206865 `
  -OutputRoot build\luals-android\dist
```

Verify the committed LuaLS version, runtime and ELF hashes, license inventory, semantic behavior, ABI fallback, and lifecycle with:

```powershell
.\gradlew.bat :app:verifyAutoJs6LuaLanguageServer
```

Normal APK assembly packages the committed, verified LuaLS distribution and does not download or rebuild it. Its 7.900 MiB payload is below the 8 MiB per-language delivery threshold and supports arm64-v8a, armeabi-v7a, and x86_64; unsupported ABIs continue with P2 without an error dialog.

******

### Installation

******

Install the generated APK after building:

```powershell
adb install -r .\app\build\outputs\apk\debug\autojs6-plugin-ace-editor-v1.1.28-universal.apk
```

Then enable `ace-editor` in the AutoJs6 plugin center, fully exit AutoJs6, and restart it. Restart the host after installing, updating, or rolling back the plugin.

Production installations should use a signature trusted by AutoJs6. In-process plugin code inherits the host process permissions, so do not install APKs from unknown or unaudited sources.

******

### Release History

******

# v1.1.28

###### 2026/09/13

* `Fix` `runtime.requestPermissions` declarations accept generic permission names and use array examples, including `access_local_network`; synchronize AutoJs6 declarations 4.11.1 and regenerate LSP groups

# v1.1.27

###### 2026/09/13

* `Improvement` `device.pageSize` read-only number declaration and completion; synchronize AutoJs6 declarations 4.11.0 and regenerate LSP groups

# v1.1.26

###### 2026/09/12

* `Improvement` OCR declarations and completion support automatic engine selection, resolved mode reads, tap resets and per-call mode options; synchronize AutoJs6 declarations 4.10.0 and regenerate LSP groups

##### Complete release history

* [CHANGELOG.md](https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/app/src/main/assets/doc/CHANGELOG-en.md)

******

### Resource Layout

******

```text
.readme/lang_*.json
.changelog/lang_*.json
.python/generate_markdown.py
app/src/main/res/values-*/strings.xml
app/src/main/assets/doc/CHANGELOG*.md
```

`strings.xml` contains localized plugin metadata and editor UI text. README and CHANGELOG files are generated from JSON sources by `.python/generate_markdown.py`, and the latest localized changelog is also written to the APK `assets/doc` directory.

******

### Links

******

- AutoJs6 project: https://github.com/SuperMonster003/AutoJs6
- Ace website: https://ace.c9.io
- Third-party notices: https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/THIRD_PARTY_NOTICES.md
- Project license: https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/LICENSE


[16 KB page alignment and build verification](https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/docs/16kb.md)
