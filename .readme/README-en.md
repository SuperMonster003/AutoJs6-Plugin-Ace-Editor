<!--suppress HtmlDeprecatedAttribute, HttpUrlsUsage -->

<div align="center">
  <h1>AutoJs6 Ace Editor Plugin</h1>

  <p>Standalone Ace code editor plugin for AutoJs6</p>

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
- Supports CRLF preservation, incremental text synchronization, chunked loading for large text, a lightweight mode for very long lines, IME adaptation, runtime health monitoring, and host native editor fallback notifications.
- Provides themes and display settings plus font management with signed catalog verification, SHA-256/WOFF2 validation, download, caching, installation, and removal.
- Localizes plugin metadata, README, and changelog content for Spanish, French, Russian, Arabic, Japanese, Korean, English, Simplified Chinese, Hong Kong Traditional Chinese, and Taiwan Traditional Chinese.

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

******

### Installation

******

Install the generated APK after building:

```powershell
adb install -r .\app\build\outputs\apk\debug\autojs6-plugin-ace-editor-v1.1.15-universal.apk
```

Then enable `ace-editor` in the AutoJs6 plugin center, fully exit AutoJs6, and restart it. Restart the host after installing, updating, or rolling back the plugin.

Production installations should use a signature trusted by AutoJs6. In-process plugin code inherits the host process permissions, so do not install APKs from unknown or unaudited sources.

******

### Release History

******

# v1.1.15

###### 2026/08/30

* `Feature` Bundle the AutoJs6 `4.3.0` PNG quantization option declarations and regenerated main-app/resource LSP groups: `Images.PngQuantizationOptions` covers palette size, speed, quality bounds, dithering, and posterize while numeric `quality` remains compatible

# v1.1.14

###### 2026/08/29

* `Feature` Added project-wide TypeScript symbol rename through F2 and the mobile `Rename` action: Ace derives bounded cross-file edits from the exact project snapshot, requests AutoJs6 contract-5 authorization, and leaves preview, conflict checks, atomic publication, rollback, and all disk writes entirely to the host
* `Feature` Added TypeScript quick fixes for auto-import and spelling corrections through Ctrl/Command+. and the mobile `Quick fix` action: Ace limits fixes to ordered edits in the active buffer, asks AutoJs6 6.8.0 (5276) for contract-4 authorization, and applies an approved result as one undoable change
* `Feature` TypeScript cross-file intelligence now covers completion, hover, signature help, and definition navigation across project sources and frozen dependency declarations; F12, Ctrl/Command-click, and the mobile `Go to definition` action emit contract-3 targets that AutoJs6 6.8.0 (5276) independently validates before opening and positioning
* `Feature` Added host-backed TypeScript project diagnostics: Ace now validates and loads the complete bounded source snapshot, resolves imports across project files, and highlights missing modules consistently with pre-run compilation; requires AutoJs6 6.8.0 (5276) or later
* `Feature` TypeScript project type layers now detect native addon signals and install lifecycle hooks before editing continues, publishing the same stable dependency-boundary error and pure JavaScript/WASM guidance as the host and compiler
* `Feature` Aligned Ace dependency type authority with resolver policy revision 3 and added lodash 4.17.21 plus `@types/lodash` 4.17.25 coverage, preserving matching Rhino and Node diagnostics when runtime packages do not bundle declarations
* `Feature` Added a frozen project dependency type layer shared with the TypeScript compiler: Ace now resolves package `types`/`typings`, TypeScript 6 `typesVersions`, nested declarations, and installed `@types`, with matching dayjs completion, hover, and strict diagnostics in Rhino and Node profiles
* `Feature` Bundle the AutoJs6 `4.2.0` R8 declarations and generated LSP groups: six `ScriptRuntime.loadJarWithR8` overloads add verified mapping/seeds/usage/retrace-metadata export, while `retraceR8Stack` performs protocol 1.1 provenance-bound stack retrace with fail-closed provider selection

# v1.1.13

###### 2026/08/26

* `Feature` Bundle the final plugin-only AutoJs6 `4.1.0` AI declarations: omitted selectors use the official 3-Stone AI default target, every request accepts only plugin `target` routing and canonical `timeout`, and host-side direct-connection, credential, and transitional event types are removed

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
