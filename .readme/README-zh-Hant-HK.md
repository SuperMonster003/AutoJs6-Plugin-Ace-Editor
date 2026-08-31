<!--suppress HtmlDeprecatedAttribute, HttpUrlsUsage -->

<div align="center">
  <h1>AutoJs6 Ace Editor Plugin</h1>

  <p>用於 AutoJs6 的獨立 Ace 代碼編輯器插件</p>

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
- 繁體中文 (香港) [zh-Hant-HK] # 目前
- [繁體中文 (台灣) [zh-Hant-TW]](https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/.readme/README-zh-Hant-TW.md)
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

AutoJs6 Ace Editor Plugin 將 Ace WebView 運行時, JavaScript bridge, 輸入法適配, 內置語言服務和編輯器靜態資源從宿主 APK 中獨立出來. 插件以普通 Android APK 安裝, 並透過類型化 Editor API 在 AutoJs6 進程內運行.

******

### 功能

******

- 提供插件 ID `ace-editor`, 引擎 `editor` 和變體 `ace`, 支援透過 `org.autojs.plugin.INFO` 與 `org.autojs.plugin.EDITOR` 發現.
- 使用 Editor API 合約 1, 需要 AutoJs6 `6.8.0 Alpha7` build `5235` 或更新版本和 Android API 24 或更新版本.
- 支援文本編輯, 撤銷/重做, 搜尋及取代, 正則表達式及全詞搜尋, 游標/選區導覽, 行操作, 斷點, 註釋切換和代碼格式化.
- 內置 JavaScript/TypeScript 語言服務和 AutoJs6 類型聲明, 提供 completion, hover, diagnostics 和 signature help; JSON 僅提供語法診斷.
- 透過按需建立的 Pyright 1.1.413 WebWorker 內置 Python 3.12 語義分析: 類型補全, hover, signature help, 診斷和定義跳轉; 不相容的舊 WebView 會靜默保留 P2.
- 透過裝置內 LuaLS 3.18.2 伴生程序內置完全離線的 Lua 語義: 補全, hover, signature help, 診斷和定義跳轉在 arm64-v8a, armeabi-v7a 與 x86_64 預設開啟; 不支援的 ABI 與執行故障會靜默保留 P2.
- 支援 CRLF 保留, 增量文本同步, 大文本分塊載入, 超長行輕量模式, IME 適配, 運行健康監測和切回宿主原生編輯器的通知.
- 支援主題和顯示設定, 以及具備簽名目錄驗證, SHA-256/WOFF2 驗證, 下載, 緩存, 安裝和刪除功能的字體管理.
- 插件資訊, README 與 CHANGELOG 支援西班牙語/法語/俄語/阿拉伯語/日語/韓語/英語/簡體中文/香港繁體/台灣繁體.

******

### 程式語言支援

******

下表說明目前內置的語言能力. 語義支援包括類型補全, 類型診斷, hover 與簽名提示:

| 語言 | 語法高亮 | 關鍵字補全 | Snippets | 本地補全 | 語義支援 |
|---|---:|---:|---:|---:|---:|
| JavaScript | 支援 | 支援 | 支援 | 支援 | 支援 |
| JSX | 支援 | 無 | 無 | 支援 | 支援 |
| TypeScript | 支援 | 支援 | 支援 | 支援 | 支援 |
| TSX | 部分 | 支援 | 支援 | 支援 | 支援 |
| JSON | 支援 | 無 | 無 | 無 | 僅語法診斷 |
| Python | 支援 | 支援 | 支援 | 支援 | 支援 |
| Lua | 支援 | 支援 | 支援 | 支援 | 支援 |
| Java | 支援 | 支援 | 支援 | 支援 | 單文件診斷 |
| Kotlin | 支援 | 支援 | 支援 | P2+ | 無 |

Ace 1.4.12 的 TSX 使用 TypeScript mode, 因此 JSX 標籤高亮僅部分可用. Python 預設使用完全離線的 Pyright 1.1.413 Worker 和 Python 3.12 標準庫存根; 舊 WebView 不相容或執行失敗時會靜默降級至 P2. Lua 在 arm64-v8a, armeabi-v7a 與 x86_64 預設使用完全離線的 LuaLS 3.18.2 伴生程序; 原生運行時不可用或故障時會靜默降級至 P2. Java 結合互相隔離的標準庫與目前文件 P2 補全及 ECJ 單文件診斷. Kotlin 提供 P2+ 補全, 但沒有語義 Provider.

AutoJs6 的程式碼編輯器設定會展示同一份 9-mode 矩陣. 全域 LSP 開關控制所有語義服務, TypeScript/JavaScript, Python, Lua 與 Java 另有逐語言開關; Kotlin 保持可見但不可啟用. 文件類型列表會最先作為白名單判斷: 移除已識別後綴會停用該語言的語義, 加入自訂後綴只允許文件進入 LSP 路徑, 不會把它重新識別為其他語言或建立語義 Provider.

******

### 構建

******

需要 JDK 17 或更新版本和 Android SDK 36, 並使用項目隨附的 Gradle Wrapper:

```powershell
.\gradlew.bat :app:testDebugUnitTest :app:assembleDebug
```

Release 構建:

```powershell
.\gradlew.bat :app:assembleRelease
```

構建參數和版本號來自 `version.properties`; 目前最低 SDK 為 24, 目標 SDK 為 36.

更新或新增 `autojs6/types/**/*.d.ts` 後, 可單獨執行:

```powershell
.\gradlew.bat :app:generateAutoJs6LspDeclarations
```

該任務會驗證聲明引用和 TypeScript 6 語法, 生成 `core`, `android`, `libraries`, `resources`, `main-app` 五組 LSP 資產及 manifest. `assemble` 和 `mergeAssets` 已自動依賴該任務, 因此正常構建無需額外執行; 外部腳本亦可直接調用. 生成結果只會寫入 `app/build/generated/aceLspAssets`, 不會覆蓋或刪除 `src/main/assets` 下的完整原始聲明. 若 Node 不在 `PATH`, 可傳入 `-Pautojs6.nodeExecutable=<node路徑>`.

修改 `tools/ace-lsp/generate-language-indices.mjs` 中維護的 Python, Lua, Java 或 Kotlin 靜態索引來源後, 可透過此任務重新生成提交入庫的資產:

```powershell
.\gradlew.bat :app:generateAutoJs6LanguageIndices
```

生成器固定各語言基線版本, 並在 `autojs6/indices` 下輸出可重複的獨立語言資產; 編輯器只在首次使用時載入目前語言. `verifyAutoJs6LanguageIndices` 會偵測過期產物, 且已接入正常驗證鏈.

修改固定版本的 Pyright Worker 原始碼後, 可透過此任務明確重新生成提交入庫的 Python 語義資產:

```powershell
.\gradlew.bat :app:generateAutoJs6PythonWorker
```

透過以下任務驗證提交入庫的 Worker 版本, typeshed 與授權雜湊, 體積預算, 語義行為, 降級和生命週期:

```powershell
.\gradlew.bat :app:verifyAutoJs6PythonWorker
```

一般 APK 建置只會封裝已提交並驗證的 Worker, 不會下載或重新生成. 語義資產合計 4.822 MiB, 低於 8 MiB 可選交付門檻; 無法解析其 ES2022 語法的舊 WebView 會繼續使用 P2, 且不顯示錯誤對話框.

修改固定版本的 LuaLS 原始碼或構建鎖後, 可透過以下命令明確重新構建提交入庫的 Android 運行時:

```powershell
.\tools\ace-lsp\build-luals-android.ps1 `
  -NdkRoot <android-sdk>\ndk\29.0.14206865 `
  -OutputRoot build\luals-android\dist
```

透過以下任務驗證提交入庫的 LuaLS 版本, 運行時與 ELF 雜湊, 授權清單, 語義行為, ABI 降級和生命週期:

```powershell
.\gradlew.bat :app:verifyAutoJs6LuaLanguageServer
```

一般 APK 建置只會封裝已提交並驗證的 LuaLS 發行內容, 不會下載或重新構建. 其 7.900 MiB 負載低於 8 MiB 單語言交付門檻, 支援 arm64-v8a, armeabi-v7a 與 x86_64; 不支援的 ABI 會繼續使用 P2, 且不顯示錯誤對話框.

******

### 安裝

******

安裝構建後生成的 APK:

```powershell
adb install -r .\app\build\outputs\apk\debug\autojs6-plugin-ace-editor-v1.1.19-universal.apk
```

隨後在 AutoJs6 插件中心啟用 `ace-editor`, 完全退出並重新啟動 AutoJs6. 安裝, 更新或回滾插件後都應重新啟動宿主.

生產環境應使用 AutoJs6 認可的受信任簽名. 同進程插件代碼繼承宿主進程的權限, 請勿安裝來源不明或未經審核的 APK.

******

### 發行歷史

******

# v1.1.19

###### 2026/09/01

* `修復` Ace WebView 在宿主主題及首份文件生效前可能短暫顯示純白背景, 尤其會在深色編輯器主題下產生明顯閃爍; 首屏現由主題已套用, 文件已提交及穩定繪製訊號共同放行, 不依賴固定延遲
* `優化` 將約 1.3 MiB 的完整 AutoJs6 自動補全索引移出首屏同步路徑, 在首個可見程式碼畫面後的閒置時段載入並無縫取代基礎索引; 五個 Android 9-15 環境均恢復 400 個全域項目及 80 個模組

# v1.1.18

###### 2026/08/31

* `新增` 內置 AutoJs6 `4.6.0` 資源安全的 PNG 量化聲明及重新生成的主應用 LSP 分組: 可配置的 `maxPixels` 與 `maxMemoryBytes` 預算超限時傳回帶詳情的類型化錯誤, 結果公開 `peakWorkingMemoryBytes`, 取消 API 覆蓋明確請求與腳本結束
* `新增` Python, Lua, Java 與 Kotlin 離線 P1 語言支援: 按副檔名路由 Ace mode, 提供語法高亮, 本語言關鍵字, snippets 與文件單詞補全; Lua 額外啟用 worker 語法診斷, 四門語言均與 AutoJs6/TypeScript 候選嚴格隔離
* `新增` Python, Lua, Java 與 Kotlin 離線 P2 補全: 按需載入固定版本的標準庫索引, 並提取目前文件的 import, 函數, 類別, 方法, 參數和變數; 嚴格保持跨語言隔離及現有 JavaScript/TypeScript 行為
* `新增` 新增可插拔八能力語義 Provider, 通用 JSON-RPC/LSP 核心及 WebWorker/裝置內 stdio 雙傳輸; TypeScript 已零回歸遷移, provider 故障時自動降級至 P2, 四門新語言語義開關預設關閉
* `新增` 透過固定版本的 Pyright 1.1.413 Worker 和 271 個 typeshed 檔案內置完全離線的 Python 3.12 語義: 類型補全, hover, signature help, 診斷和定義跳轉現預設開啟, 不相容的舊 WebView 與執行故障會靜默降級至 P2
* `新增` 透過固定版本的 LuaLS 3.18.2 裝置內伴生程序內置完全離線的 Lua 語義: 補全, hover, signature help, 診斷和定義跳轉在 arm64-v8a, armeabi-v7a 與 x86_64 預設開啟; 原生資產缺失或損壞, 不支援的 ABI 與程序崩潰會靜默降級至 P2, 並以有限退避恢復
* `新增` 透過固定版本的 ECJ 3.26.0 與裁剪的 Android API 36 stubs 內置完全離線的 Java 單檔診斷: 語法錯誤與未解析符號現預設獲得精確範圍標註; JDT Code Assist 依賴 ART 上不可用的 Eclipse Workspace/OSGi 執行環境, 因此補全繼續使用 P2
* `新增` Kotlin P2+ 離線補全: 擴充 Kotlin 2.2.21 實例 API, 根據目前檔案提供保守類型提示, 支援 safe-call 並重用 Java/Android 索引; 裝置內 compiler 因體積, ART 執行, 記憶體與最低 SDK 驗證未通過, 因此不打包 Kotlin compiler 或語義執行環境
* `新增` 在 AutoJs6 程式碼編輯器設定中展示同一份 9-mode 語言支援矩陣, 並為 TypeScript/JavaScript, Python, Lua 與 Java 提供逐語言語義開關; Kotlin 以 P2+ 不可用狀態保持可見, 文件類型自訂明確作為白名單而非語言重新分類

# v1.1.17

###### 2026/08/31

* `新增` 內置 AutoJs6 `4.5.0` 色彩正確的 PNG 量化聲明及重新生成的主應用 LSP 分組: `images.quantizeToFile` 直接寫入檔案並傳回大小與品質指標, `preserveAlpha` 控制透明或不透明輸出

##### 更多發行歷史可參閱

* [CHANGELOG.md](https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/app/src/main/assets/doc/CHANGELOG-zh-Hant-HK.md)

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

`strings.xml` 提供插件資訊和編輯器介面本地化. README 與 CHANGELOG 由 `.python/generate_markdown.py` 根據 JSON 源文件生成, 各語言最新日誌亦會寫入 APK 的 `assets/doc` 目錄.

******

### 相關連結

******

- AutoJs6 項目: https://github.com/SuperMonster003/AutoJs6
- Ace 官方網站: https://ace.c9.io
- 第三方組件聲明: https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/THIRD_PARTY_NOTICES.md
- 項目許可證: https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/LICENSE
