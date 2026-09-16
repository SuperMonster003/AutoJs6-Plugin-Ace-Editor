<!--suppress HtmlDeprecatedAttribute, HttpUrlsUsage -->

<div align="center">
  <p>
    <picture>
      <source srcset="https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/app/src/main/res/mipmap-night/ic_launcher.png?raw=true" media="(prefers-color-scheme: dark)" />
      <img src="https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/app/src/main/res/mipmap/ic_launcher.png?raw=true" alt="autojs6-plugin-ace-editor-ic-launcher" border="0" width="128" />
    </picture>
  </p>

  <p>整合語言服務的嵌入式 Ace 程式碼編輯器</p>

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
- 使用 Editor API 契約 5, 需要 AutoJs6 組建 5276 及以上和 Android API 24 及以上.
- 支援文字編輯, 復原/重做, 尋找與取代, 規則運算式與全字詞搜尋, 游標/選取範圍導覽, 行操作, 中斷點, 註解切換和程式碼格式化.
- 內建 JavaScript/TypeScript 語言服務和 AutoJs6 型別宣告, 提供 completion, hover, diagnostics 和 signature help; JSON 僅提供語法診斷.
- 透過依需求建立的 Pyright 1.1.413 WebWorker 內建 Python 3.12 語意分析: 型別補全, hover, signature help, 診斷和定義跳轉; 不相容的舊 WebView 會靜默保留 P2.
- 透過裝置內 LuaLS 3.18.2 伴生程序內建完全離線的 Lua 語意: 補全, hover, signature help, 診斷和定義跳轉在 arm64-v8a, armeabi-v7a 與 x86_64 預設開啟; 不支援的 ABI 與執行失敗會靜默保留 P2.
- 支援保留 CRLF, 增量文字同步, 大型文字分塊載入, 超長行輕量模式, IME 調整, 執行狀況監控和切回宿主原生編輯器的通知.
- 支援主題與顯示設定, 以及具備簽章目錄驗證, SHA-256/WOFF2 驗證, 下載, 快取, 安裝和移除功能的字型管理.
- 外掛資訊, README 與 CHANGELOG 支援西班牙文/法文/俄文/阿拉伯文/日文/韓文/英文/簡體中文/香港繁體/台灣繁體.
- 可選擇裝置 ABI 對應的 APK 或 universal APK. Lua 語意分析支援 arm64-v8a, armeabi-v7a 和 x86_64; x86 保留編輯器和靜態補全.

******

### 程式語言支援

******

下表說明目前內建的語言能力. 語意支援包括型別補全, 型別診斷, hover 與簽章提示:

| 語言 | 語法醒目提示 | 關鍵字補全 | Snippets | 本機補全 | 語意支援 |
|---|---:|---:|---:|---:|---:|
| JavaScript | 支援 | 支援 | 支援 | 支援 | 支援 |
| JSX | 支援 | 無 | 無 | 支援 | 支援 |
| TypeScript | 支援 | 支援 | 支援 | 支援 | 支援 |
| TSX | 部分 | 支援 | 支援 | 支援 | 支援 |
| JSON | 支援 | 無 | 無 | 無 | 僅語法診斷 |
| Python | 支援 | 支援 | 支援 | 支援 | 支援 |
| Lua | 支援 | 支援 | 支援 | 支援 | 支援 |
| Java | 支援 | 支援 | 支援 | 支援 | 單一檔案診斷 |
| Kotlin | 支援 | 支援 | 支援 | P2+ | 無 |

Ace 1.4.12 的 TSX 使用 TypeScript mode, 因此 JSX 標籤醒目提示僅部分可用. Python 預設使用完全離線的 Pyright 1.1.413 Worker 和 Python 3.12 標準函式庫存根; 舊 WebView 不相容或執行失敗時會靜默降級至 P2. Lua 在 arm64-v8a, armeabi-v7a 與 x86_64 預設使用完全離線的 LuaLS 3.18.2 伴生程序; 原生執行階段不可用或失敗時會靜默降級至 P2. Java 結合互相隔離的標準函式庫與目前檔案 P2 補全及 ECJ 單一檔案診斷. Kotlin 提供 P2+ 補全, 但沒有語意 Provider.

AutoJs6 的程式碼編輯器設定會顯示同一份 9-mode 矩陣. 全域 LSP 開關控制所有語意服務, TypeScript/JavaScript, Python, Lua 與 Java 另有逐語言開關; Kotlin 保持可見但無法啟用. 檔案類型清單會最先作為允許清單判斷: 移除已辨識副檔名會停用該語言的語意, 加入自訂副檔名只允許檔案進入 LSP 路徑, 不會把它重新辨識為其他語言或建立語意 Provider.

******

### 建置

******

需要 JDK 17 或更新版本和 Android SDK 37, 並使用專案隨附的 Gradle Wrapper:

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

修改 `tools/ace-lsp/generate-language-indices.mjs` 中維護的 Python, Lua, Java 或 Kotlin 靜態索引來源後, 可透過此工作重新產生提交入庫的資產:

```powershell
.\gradlew.bat :app:generateAutoJs6LanguageIndices
```

產生器固定各語言基準版本, 並在 `autojs6/indices` 下輸出可重現的獨立語言資產; 編輯器只在首次使用時載入目前語言. `verifyAutoJs6LanguageIndices` 會偵測過期產物, 且已接入一般驗證鏈.

修改固定版本的 Pyright Worker 原始碼後, 可透過此工作明確重新產生提交入庫的 Python 語意資產:

```powershell
.\gradlew.bat :app:generateAutoJs6PythonWorker
```

透過以下工作驗證提交入庫的 Worker 版本, typeshed 與授權雜湊, 體積預算, 語意行為, 降級和生命週期:

```powershell
.\gradlew.bat :app:verifyAutoJs6PythonWorker
```

一般 APK 建置只會封裝已提交並驗證的 Worker, 不會下載或重新產生. 語意資產合計 4.822 MiB, 低於 8 MiB 可選交付門檻; 無法解析其 ES2022 語法的舊 WebView 會繼續使用 P2, 且不顯示錯誤對話框.

修改固定版本的 LuaLS 原始碼或建置鎖後, 可透過以下命令明確重新建置提交入庫的 Android 執行階段:

```powershell
.\tools\ace-lsp\build-luals-android.ps1 `
  -NdkRoot <android-sdk>\ndk\29.0.14206865 `
  -OutputRoot build\luals-android\dist
```

透過以下工作驗證提交入庫的 LuaLS 版本, 執行階段與 ELF 雜湊, 授權清單, 語意行為, ABI 降級和生命週期:

```powershell
.\gradlew.bat :app:verifyAutoJs6LuaLanguageServer
```

一般 APK 建置只會封裝已提交並驗證的 LuaLS 發行內容, 不會下載或重新建置. 其 7.900 MiB 負載低於 8 MiB 單語言交付門檻, 支援 arm64-v8a, armeabi-v7a 與 x86_64; 不支援的 ABI 會繼續使用 P2, 且不顯示錯誤對話框.

******

### 安裝

******

建置完成後安裝產生的 APK:

```powershell
adb install -r .\app\build\outputs\apk\debug\autojs6-plugin-ace-editor-v1.8.0-universal.apk
```

接著在 AutoJs6 外掛中心啟用 `ace-editor`, 完全結束並重新啟動 AutoJs6. 安裝, 更新或回復至舊版外掛後都應重新啟動宿主.

正式環境應使用 AutoJs6 信任的簽章. 同一行程中的外掛程式碼會繼承宿主行程權限, 請勿安裝來源不明或未經稽核的 APK.

******

### 發行歷史

******

# v1.8.0

###### 2026/09/16

* `新增` Flow 可選步驟, 有界迴圈與穩定快照的型別宣告和 LSP 補全

# v1.7.2

###### 2026/09/16

* `優化` 繼 compileSdk 之後將 targetSdk 提升到 37 (Android 17), 外掛程式行為不受新目標版本影響

# v1.7.1

###### 2026/09/15

* `優化` 將 compileSdk 提升到 37 (Android 17), targetSdk 保持 36, 待依賴目標版本的行為驗證後再提升

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


[16 KB page alignment and build verification](https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/docs/16kb.md)
