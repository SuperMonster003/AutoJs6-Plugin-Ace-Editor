******

### Release History

******

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
