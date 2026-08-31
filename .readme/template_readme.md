<!--suppress HtmlDeprecatedAttribute, HttpUrlsUsage -->

<div align="center">
  <h1>AutoJs6 Ace Editor Plugin</h1>

  <p>{{ text_plugin_synopsis }}</p>

  <p>
    <a href="{{ repo_url }}/releases"><img alt="GitHub release (latest by date)" src="https://img.shields.io/github/v/release/SuperMonster003/AutoJs6-Plugin-Ace-Editor?label=Release"/></a>
    <a href="{{ repo_url }}/issues"><img alt="GitHub closed issues" src="https://img.shields.io/github/issues/SuperMonster003/AutoJs6-Plugin-Ace-Editor?color=A24232&label=Issues"/></a>
    <a href="{{ license_url }}"><img alt="GitHub License" src="https://img.shields.io/github/license/SuperMonster003/AutoJs6-Plugin-Ace-Editor?color=534BAE&label=License"/></a>
  </p>
</div>

******

### {{ h3_languages_with_ascii }}

******

{{ p_languages_all_supported_for_readme }}:

{{ placeholder_ul_languages_all_supported }}

******

### {{ h3_introduction }}

******

{{ p_introduction }}

******

### {{ h3_functions }}

******

{{ placeholder_features }}

******

### {{ h3_programming_language_support }}

******

{{ p_programming_language_support_intro }}:

| {{ text_programming_language }} | {{ text_syntax_highlighting }} | {{ text_keyword_completion }} | {{ text_snippets }} | {{ text_local_completion }} | {{ text_semantic_support }} |
|---|---:|---:|---:|---:|---:|
| JavaScript | {{ text_support_yes }} | {{ text_support_yes }} | {{ text_support_yes }} | {{ text_support_yes }} | {{ text_support_yes }} |
| JSX | {{ text_support_yes }} | {{ text_support_no }} | {{ text_support_no }} | {{ text_support_yes }} | {{ text_support_yes }} |
| TypeScript | {{ text_support_yes }} | {{ text_support_yes }} | {{ text_support_yes }} | {{ text_support_yes }} | {{ text_support_yes }} |
| TSX | {{ text_support_partial }} | {{ text_support_yes }} | {{ text_support_yes }} | {{ text_support_yes }} | {{ text_support_yes }} |
| JSON | {{ text_support_yes }} | {{ text_support_no }} | {{ text_support_no }} | {{ text_support_no }} | {{ text_support_syntax_only }} |
| Python | {{ text_support_yes }} | {{ text_support_yes }} | {{ text_support_yes }} | {{ text_support_yes }} | {{ text_support_yes }} |
| Lua | {{ text_support_yes }} | {{ text_support_yes }} | {{ text_support_yes }} | {{ text_support_yes }} | {{ text_support_yes }} |
| Java | {{ text_support_yes }} | {{ text_support_yes }} | {{ text_support_yes }} | {{ text_support_yes }} | {{ text_support_no }} |
| Kotlin | {{ text_support_yes }} | {{ text_support_yes }} | {{ text_support_yes }} | {{ text_support_yes }} | {{ text_support_no }} |

{{ p_programming_language_support_note }}.

******

### {{ h3_build }}

******

{{ p_build_requirements }}:

```powershell
.\gradlew.bat :app:testDebugUnitTest :app:assembleDebug
```

{{ text_release_build }}:

```powershell
.\gradlew.bat :app:assembleRelease
```

{{ p_build_params }}.

{{ p_lsp_declarations_update }}:

```powershell
.\gradlew.bat :app:generateAutoJs6LspDeclarations
```

{{ p_lsp_declarations_generation }}.

{{ p_language_indices_update }}:

```powershell
.\gradlew.bat :app:generateAutoJs6LanguageIndices
```

{{ p_language_indices_generation }}.

{{ p_python_semantic_worker_update }}:

```powershell
.\gradlew.bat :app:generateAutoJs6PythonWorker
```

{{ p_python_semantic_worker_verify }}:

```powershell
.\gradlew.bat :app:verifyAutoJs6PythonWorker
```

{{ p_python_semantic_worker_generation }}.

{{ p_lua_semantic_server_update }}:

```powershell
.\tools\ace-lsp\build-luals-android.ps1 `
  -NdkRoot <android-sdk>\ndk\29.0.14206865 `
  -OutputRoot build\luals-android\dist
```

{{ p_lua_semantic_server_verify }}:

```powershell
.\gradlew.bat :app:verifyAutoJs6LuaLanguageServer
```

{{ p_lua_semantic_server_generation }}.

******

### {{ h3_installation }}

******

{{ p_install_intro }}:

```powershell
adb install -r .\app\build\outputs\apk\debug\autojs6-plugin-ace-editor-v{{ version_name }}-universal.apk
```

{{ p_install_restart }}.

{{ p_install_security }}.

******

### {{ h3_release_history }}

******

{{ placeholder_latest_release_history }}

##### {{ h5_for_more_release_history }}

* {{ placeholder_read_more_in_changelog_md }}

******

### {{ h3_resource_layout }}

******

```text
.readme/lang_*.json
.changelog/lang_*.json
.python/generate_markdown.py
app/src/main/res/values-*/strings.xml
app/src/main/assets/doc/CHANGELOG*.md
```

{{ p_resource_layout }}.

******

### {{ h3_links }}

******

- {{ text_link_autojs6 }}: {{ autojs6_url }}
- {{ text_link_ace }}: {{ ace_url }}
- {{ text_link_third_party_notices }}: {{ third_party_notices_url }}
- {{ text_link_license }}: {{ license_url }}
