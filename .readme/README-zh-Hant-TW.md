<!--suppress HtmlDeprecatedAttribute, HttpUrlsUsage -->

<div align="center">
  <h1>AutoJs6 Ace Editor Plugin</h1>

  <p>用於 AutoJs6 的獨立 Ace 程式碼編輯器外掛</p>

  <p>
    <a href="https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/releases"><img alt="GitHub release (latest by date)" src="https://img.shields.io/github/v/release/SuperMonster003/AutoJs6-Plugin-Ace-Editor?label=Release"/></a>
    <a href="https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/issues"><img alt="GitHub closed issues" src="https://img.shields.io/github/issues/SuperMonster003/AutoJs6-Plugin-Ace-Editor?color=A24232&label=Issues"/></a>
    <a href="https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/LICENSE"><img alt="GitHub License" src="https://img.shields.io/github/license/SuperMonster003/AutoJs6-Plugin-Ace-Editor?color=534BAE&label=License"/></a>
  </p>
</div>

******

### 語言 (Languages)

******

目前 README.md 支援以下語言:

- [简体中文 [zh-Hans]](https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/.readme/README-zh-Hans.md)
- [繁體中文 (香港) [zh-Hant-HK]](https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/.readme/README-zh-Hant-HK.md)
- 繁體中文 (台灣) [zh-Hant-TW] # 目前
- [English [en]](https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/.readme/README-en.md)
- [Français [fr]](https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/.readme/README-fr.md)
- [Español [es]](https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/.readme/README-es.md)
- [日本語 [ja]](https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/.readme/README-ja.md)
- [한국어 [ko]](https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/.readme/README-ko.md)
- [Русский [ru]](https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/.readme/README-ru.md)
- [العربية [ar]](https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/.readme/README-ar.md)

******

### 簡介

******

AutoJs6 Ace Editor Plugin 將 Ace WebView 執行階段, JavaScript bridge, 輸入法調整, 內建語言服務和編輯器靜態資源從宿主 APK 中分離. 外掛以一般 Android APK 安裝, 並透過型別化 Editor API 在 AutoJs6 行程內執行.

******

### 功能

******

- 提供外掛 ID `ace-editor`, 引擎 `editor` 和變體 `ace`, 供宿主透過 `org.autojs.plugin.INFO` 與 `org.autojs.plugin.EDITOR` 元件發現外掛.
- 使用 Editor API 合約 1, 需要 AutoJs6 `6.8.0 Alpha7` build `5235` 或更新版本和 Android API 24 或更新版本.
- 支援文字編輯, 復原/重做, 尋找與取代, 規則運算式與全字詞搜尋, 游標/選取範圍導覽, 行操作, 中斷點, 註解切換和程式碼格式化.
- 內建 JavaScript/TypeScript 語言服務和 AutoJs6 型別宣告, 提供 completion, hover, diagnostics 和 signature help; JSON 僅提供語法診斷.
- 支援保留 CRLF, 增量文字同步, 大型文字分塊載入, 超長行輕量模式, IME 調整, 執行狀況監控和切回宿主原生編輯器的通知.
- 支援主題與顯示設定, 以及具備簽章目錄驗證, SHA-256/WOFF2 驗證, 下載, 快取, 安裝和移除功能的字型管理.
- 外掛資訊, README 與 CHANGELOG 支援西班牙文/法文/俄文/阿拉伯文/日文/韓文/英文/簡體中文/香港繁體/台灣繁體.

******

### 建置

******

需要 JDK 17 或更新版本和 Android SDK 36, 並使用專案隨附的 Gradle Wrapper:

```powershell
.\gradlew.bat :app:testDebugUnitTest :app:assembleDebug
```

Release 建置:

```powershell
.\gradlew.bat :app:assembleRelease
```

建置參數和版本號來自 `version.properties`; 目前最低 SDK 為 24, 目標 SDK 為 36.

更新或新增 `autojs6/types/**/*.d.ts` 後, 可單獨執行:

```powershell
.\gradlew.bat :app:generateAutoJs6LspDeclarations
```

此工作會驗證宣告參照和 TypeScript 6 語法, 產生 `core`, `android`, `libraries`, `resources`, `main-app` 五組 LSP 資產及 manifest. `assemble` 和 `mergeAssets` 已自動相依於此工作, 因此一般建置無需額外執行; 外部指令碼也可直接呼叫. 產生結果只會寫入 `app/build/generated/aceLspAssets`, 不會覆寫或刪除 `src/main/assets` 下的完整原始宣告. 若 Node 不在 `PATH`, 可傳入 `-Pautojs6.nodeExecutable=<node路徑>`.

******

### 安裝

******

建置完成後安裝產生的 APK:

```powershell
adb install -r .\app\build\outputs\apk\debug\autojs6-plugin-ace-editor-v1.1.1-universal.apk
```

接著在 AutoJs6 外掛中心啟用 `ace-editor`, 完全結束並重新啟動 AutoJs6. 安裝, 更新或回復至舊版外掛後都應重新啟動宿主.

正式環境應使用 AutoJs6 信任的簽章. 同一行程中的外掛程式碼會繼承宿主行程權限, 請勿安裝來源不明或未經稽核的 APK.

******

### 發行歷史

******

# v1.1.1

###### 2026/07/27

* `修復` 修復可選宣告群組的靜態成員補全, 包括 `App.CHROME` 和大型 `R.string.text_*` 資源集; Ace 截斷的候選清單現在會在前綴變更時以防彈跳方式重新整理

# v1.1.0

###### 2026/07/27

* `新增` 保留完整原始宣告, 並支援選擇 AutoJs6 LSP 宣告群組: `core` 一律啟用, `android`, `libraries`, `resources` 和 `main-app` 預設關閉; 選擇 `libraries` 會同時啟用 `android`, 選擇 `main-app` 會同時啟用 `android`, `libraries` 和 `resources`
* `新增` 提供 `:app:generateAutoJs6LspDeclarations` Gradle 工作, 用於驗證宣告並產生五個 LSP 群組及其 manifest; 一般資產合併會自動呼叫該工作, 外部指令碼也可直接呼叫
* `相依性` 內建 TypeScript 語言服務和標準函式庫宣告由 `4.2.4` 升級至 `6.0.3`

# v1.0.0

###### 2026/07/21

* `新增` Ace 編輯器獨立外掛, 外掛 ID 為 `ace-editor`, 引擎為 `editor`, 變體為 `ace`
* `新增` 供宿主透過受 `org.autojs.permission.PLUGIN` 保護的 `org.autojs.plugin.INFO` 和 `org.autojs.plugin.EDITOR` 元件發現外掛, Editor API 合約為 1, 最低宿主 build 為 `5234`
* `新增` Ace `1.4.12` 編輯功能, 包含復原/重做, 尋找與取代, 規則運算式與全字詞搜尋, 游標與選取範圍導覽, 行操作, 中斷點, 註解切換和程式碼格式化
* `新增` 內建 JavaScript/TypeScript 語言服務及 AutoJs6 型別宣告, 支援 completion, hover, diagnostics 和 signature help; JSON 僅提供語法診斷
* `新增` 增量文字同步, 保留 CRLF, 大型文字分塊載入, 超長行輕量模式和 IME 調整
* `新增` 主題與顯示設定, 以及具備簽章目錄和檔案完整性驗證的字型下載, 快取, 安裝與移除功能
* `新增` WebView 執行狀況監控, 心跳偵測和切回宿主原生編輯器的通知
* `新增` 外掛資訊, README 和 CHANGELOG 的西班牙文/法文/俄文/阿拉伯文/日文/韓文/英文/簡體中文/香港繁體/台灣繁體在地化

##### 更多發行歷史可參閱

* [CHANGELOG.md](https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/app/src/main/assets/doc/CHANGELOG-zh-Hant-TW.md)

******

### 資源結構

******

```text
.readme/lang_*.json
.changelog/lang_*.json
.python/generate_markdown.py
app/src/main/res/values-*/strings.xml
app/src/main/assets/doc/CHANGELOG*.md
```

`strings.xml` 提供外掛資訊和編輯器介面在地化. README 與 CHANGELOG 由 `.python/generate_markdown.py` 根據 JSON 來源檔產生, 各語言的最新變更記錄也會寫入 APK 的 `assets/doc` 目錄.

******

### 相關連結

******

- AutoJs6 專案: https://github.com/SuperMonster003/AutoJs6
- Ace 官方網站: https://ace.c9.io
- 第三方元件聲明: https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/THIRD_PARTY_NOTICES.md
- 專案授權: https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/LICENSE
