******

### Release History

******

# v1.1.11

###### 2026/08/25

* `Feature` Bundle the three explicit `ScriptRuntime.loadJarWithR8` overloads in AutoJs6 declarations and generated LSP groups, covering keep rules, ordered classpath, and consumer-rule ordinal bindings

# v1.1.10

###### 2026/08/24

* `Feature` Align Ace TypeScript diagnostics with the compiler plugin's TypeScript 6.0.3 revision-2 Rhino/Node profiles (ES2018, strict, CommonJS/Node10 or NodeNext), including Node-project routing and default .mts/.cts declaration support while preserving static fallback

# v1.1.9

###### 2026/08/21

* `Feature` Declare explicit backend profiles for `ai.ask`/`ai.chat`/`ai.stream` and persistent `ai.session`, covering `cpu`/`gpu`/`npu`, `ai.models` device availability, stable unavailable reasons, and no CPU fallback

# v1.1.8

###### 2026/08/21

* `Feature` Declare native structured JSON for `ai.ask`/`ai.chat`/`ai.stream` and persistent `ai.session`, covering `structuredJson`, JSON-object `responseSchema`, and fixed per-session schemas

# v1.1.7

###### 2026/08/21

* `Feature` Add `ai.session` persistent on-device Conversation declarations, including fixed session options, one-prompt-per-turn `ask`/`chat`/`stream` methods, lifecycle state, and explicit close semantics

# v1.1.6

###### 2026/08/21

* `Feature` Complete the AutoJs6 local AI plugin declarations with multi-role message history, official and third-party selectors, generation controls, exact usage and streaming payloads, and `ai.models` model discovery

# v1.1.5

###### 2026/08/21

* `Feature` Mirror the AutoJs6 standalone YOLO plugin object-detection type declarations, including the explicit provider component, session and detection options, detection results, and stable error codes

# v1.1.4

###### 2026/08/20

* `Feature` Mirror the AutoJs6 AI plugin `Ask`, `Chat`, and `Stream` type declarations, including official and third-party plugin selection, local generation controls, route responses, and streaming event types

# v1.1.1

###### 2026/07/28

* `Fix` Fixed static-member completion for optional declaration groups, including `App.CHROME` and large `R.string.text_*` resource sets; truncated Ace completion lists are now refreshed with a debounce as the prefix changes
* `Fix` Fixed ordinary large documents being mistaken for very long lines, causing them to switch to plain-text mode and lose JavaScript highlighting, completion, and semantic services; genuinely very long individual lines still use safety mode
* `Fix` Fixed the Ace signature/parameter-hint bubble always using a light background; it now follows the editor theme's background and foreground colors dynamically, while an already-open autocomplete candidate popup is refreshed separately when the theme changes
* `Fix` Fixed the system text-selection ActionMode not following Ace colors by replacing it with Ace's own palette-aware selection toolbar; selection actions, pressed states, and the overflow panel now follow the current Ace palette across Android versions

# v1.1.0

###### 2026/07/27

* `Feature` Kept the complete source declarations bundled and added selectable AutoJs6 LSP declaration groups: `core` is always enabled, while `android`, `libraries`, `resources`, and `main-app` are disabled by default; selecting `libraries` also enables `android`, and selecting `main-app` also enables `android`, `libraries`, and `resources`
* `Feature` Added the `:app:generateAutoJs6LspDeclarations` Gradle task to validate declarations and generate the five LSP groups and their manifest; normal asset merging invokes it automatically, and external scripts can call it directly
* `Dependency` Upgraded the bundled TypeScript language service and standard library declarations from `4.2.4` to `6.0.3`

# v1.0.0

###### 2026/07/21

* `Feature` Added the standalone Ace editor plugin with plugin ID `ace-editor`, engine `editor`, and variant `ace`
* `Feature` Added discovery through `org.autojs.plugin.INFO` and `org.autojs.plugin.EDITOR` components protected by `org.autojs.permission.PLUGIN`, with Editor API contract 1 and minimum host build `5234`
* `Feature` Added Ace `1.4.12` editing features including undo/redo, search and replace, regex and whole-word search, cursor and selection navigation, line operations, breakpoints, comment toggling, and code formatting
* `Feature` Added built-in JavaScript/TypeScript language services and AutoJs6 type declarations with completion, hover, diagnostics, and signature help plus syntax diagnostics for JSON files
* `Feature` Added incremental text synchronization, CRLF preservation, chunked loading for large text, a lightweight mode for very long lines, and IME adaptation
* `Feature` Added themes and display settings plus font download, caching, installation, and removal with signed catalog and file integrity verification
* `Feature` Added WebView runtime health monitoring, heartbeat detection, and host native editor fallback notifications
* `Feature` Added localized plugin metadata, README, and changelog content for Spanish, French, Russian, Arabic, Japanese, Korean, English, Simplified Chinese, Hong Kong Traditional Chinese, and Taiwan Traditional Chinese
