<!--suppress HtmlDeprecatedAttribute, HttpUrlsUsage -->

<div align="center">
  <p>
    <picture>
      <source srcset="https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/app/src/main/res/mipmap-night/ic_launcher.png?raw=true" media="(prefers-color-scheme: dark)" />
      <img src="https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/app/src/main/res/mipmap/ic_launcher.png?raw=true" alt="autojs6-plugin-ace-editor-ic-launcher" border="0" width="128" />
    </picture>
  </p>

  <p>整合語言服務的嵌入式 Ace 代碼編輯器</p>

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
- 使用 Editor API 契約 7, 需要 AutoJs6 建置 5352 及以上和 Android API 24 及以上.
- 支援文本編輯, 撤銷/重做, 搜尋及取代, 正則表達式及全詞搜尋, 游標/選區導覽, 行操作, 斷點, 註釋切換和代碼格式化.
- 編輯器支援 "編輯 > 摺疊 > 全部展開/全部摺疊", 對整份文件的程式碼區塊生效, 支援巢狀摺疊和唯讀文件, 保持文字, 選取範圍及復原記錄不變.
- 基於 Ace 1.44.0; 點擊, 雙擊/長按選詞, 拖動游標與選取範圍控點, 慣性捲動, 雙指縮放和拖動放大鏡等觸控操作由插件自己的流動端覆蓋層提供.
- 宿主的程式碼編輯器設定可開關向量邊欄圖示, 目前縮進參考線高亮, 編輯器滾動條及其自動隱藏, 選取範圍內的空白字元, 拖動放大鏡, 同名符號高亮和自動完成內嵌預覽; 拖動放大鏡與內嵌預覽預設關閉, 沒有這些設定的宿主按預設值執行.
- 內置 JavaScript/TypeScript 語言服務和 AutoJs6 類型聲明, 提供 completion, hover, diagnostics 和 signature help; JSON 僅提供語法診斷.
- 透過按需建立的 Pyright 1.1.413 WebWorker 內置 Python 3.12 語義分析: 類型補全, hover, signature help, 診斷和定義跳轉; 不相容的舊 WebView 會靜默保留 P2.
- 透過裝置內 LuaLS 3.18.2 伴生程序內置完全離線的 Lua 語義: 補全, hover, signature help, 診斷和定義跳轉在 arm64-v8a, armeabi-v7a 與 x86_64 預設開啟; 不支援的 ABI 與執行故障會靜默保留 P2.
- 支援 CRLF 保留, 增量文本同步, 大文本分塊載入, 超長行輕量模式, IME 適配, 運行健康監測和切回宿主原生編輯器的通知.
- 支援主題和顯示設定, 以及具備簽名目錄驗證, SHA-256/WOFF2 驗證, 下載, 緩存, 安裝和刪除功能的字體管理.
- 插件資訊, README 與 CHANGELOG 支援西班牙語/法語/俄語/阿拉伯語/日語/韓語/英語/簡體中文/香港繁體/台灣繁體.
- 可選擇裝置 ABI 對應的 APK 或 universal APK. Lua 語義分析支援 arm64-v8a, armeabi-v7a 和 x86_64; x86 保留編輯器和靜態補全.

******

### 程式語言支援

******

下表說明目前內置的語言能力. 語義支援包括類型補全, 類型診斷, hover 與簽名提示:

| 語言 | 語法高亮 | 關鍵字補全 | Snippets | 本地補全 | 語義支援 |
|---|---:|---:|---:|---:|---:|
| JavaScript | 支援 | 支援 | 支援 | 支援 | 支援 |
| JSX | 支援 | 無 | 無 | 支援 | 支援 |
| TypeScript | 支援 | 支援 | 支援 | 支援 | 支援 |
| TSX | 支援 | 支援 | 支援 | 支援 | 支援 |
| JSON | 支援 | 無 | 無 | 無 | 僅語法診斷 |
| Python | 支援 | 支援 | 支援 | 支援 | 支援 |
| Lua | 支援 | 支援 | 支援 | 支援 | 支援 |
| Java | 支援 | 支援 | 支援 | 支援 | 單文件診斷 |
| Kotlin | 支援 | 支援 | 支援 | P2+ | 無 |

Python 預設使用完全離線的 Pyright 1.1.413 Worker 和 Python 3.12 標準庫存根; 舊 WebView 不相容或執行失敗時會靜默降級至 P2. Lua 在 arm64-v8a, armeabi-v7a 與 x86_64 預設使用完全離線的 LuaLS 3.18.2 伴生程序; 原生運行時不可用或故障時會靜默降級至 P2. Java 結合互相隔離的標準庫與目前文件 P2 補全及 ECJ 單文件診斷. Kotlin 提供 P2+ 補全, 但沒有語義 Provider. Rhino 指令碼的 `class` 語法 (含繼承 Java 類別) 需要 AutoJs6 6.8.0 及以上版本執行.

AutoJs6 的程式碼編輯器設定會展示同一份 9-mode 矩陣. 全域 LSP 開關控制所有語義服務, TypeScript/JavaScript, Python, Lua 與 Java 另有逐語言開關; Kotlin 保持可見但不可啟用. 文件類型列表會最先作為白名單判斷: 移除已識別後綴會停用該語言的語義, 加入自訂後綴只允許文件進入 LSP 路徑, 不會把它重新識別為其他語言或建立語義 Provider.

******

### 構建

******

需要 JDK 17 或更新版本和 Android SDK 37, 並使用項目隨附的 Gradle Wrapper:

```powershell
.\gradlew.bat :app:testDebugUnitTest :app:assembleDebug
```

Release 構建:

```powershell
.\gradlew.bat :app:assembleRelease
```

修改 Ace 資產, 流動端覆蓋層或橋接腳本後, 可單獨執行以下驗證:

```powershell
.\gradlew.bat :app:verifyAutoJs6AceAssets :app:verifyAutoJs6AceMobileOverlay :app:verifyAutoJs6AceBridge :app:typecheckAutoJs6AceBridge
```

它們依次核對打包的 Ace 1.44.0 檔案與鎖定清單 (官方檔案不得修改), 以錄製的觸控場景重播流動端覆蓋層, 在固定版本的 jsdom 中執行編輯器頁面與橋接層測試, 並按 Ace 的類型聲明檢查橋接腳本. 這些任務都已掛到 `check` 上, 需要 Node.js.

構建參數和版本號來自 `version.properties`; 目前最低 SDK 為 24, 目標 SDK 為 37.

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
adb install -r .\app\build\outputs\apk\debug\autojs6-plugin-ace-editor-v2.48.0-universal.apk
```

隨後在 AutoJs6 插件中心啟用 `ace-editor`, 完全退出並重新啟動 AutoJs6. 安裝, 更新或回滾插件後都應重新啟動宿主.

生產環境應使用 AutoJs6 認可的受信任簽名. 同進程插件代碼繼承宿主進程的權限, 請勿安裝來源不明或未經審核的 APK.

******

### 發行歷史

******

# v2.47.0

###### 2026/10/29

* `新增` speech 聲明補全 diarize, detectLanguage 與 tag 及其 Async 形態: 說話人分離 (誰在何時說話, 可按已註冊的聲紋認人), 語種識別與音訊標籤 (AudioSet 的 527 個標籤), 選項可帶 onProgress 進度回調, 含 Speech.Diarization, Speech.LanguageDetection 與 Speech.Tagging 等結果類型 (AutoJs6 6.8.0 起, 需要 3-Macaw Speech 1.3.0)
* `新增` speech 聲明補全 speech.speaker 說話人識別: enroll, verify, identify 及其 Async 形態, list 與 remove, 以及錯誤碼 SPEAKER_NOT_FOUND 與 AUDIO_TOO_SHORT (AutoJs6 6.8.0 起, 需要 3-Macaw Speech 1.3.0)
* `優化` Speech.Feature 增加 'speaker', 'diarization', 'languageId' 與 'audioTagging'; Speech.Kind 增加 'speaker', 'segment', 'langid' 與 'tagger' 四種模型類別, models.list, setDefault 與 getDefault 可使用這些類別

# v2.46.0

###### 2026/10/29

* `新增` 選擇器宣告補全 normalize 與 prefer: 全局函數, 鏈式方法與對象選擇器的鍵, 含 Selector.NormalizeOptions 與 Selector.PreferKey 類型 (AutoJs6 6.8.0 起)
* `新增` auto 宣告補全 clearFlags 方法, setFlags 的 ! 前綴與 noFastPath / noRefreshOnHit 標誌; explain 可傳入羅盤與結果類型, 結果含 target / trail / result 等字段; stats 補全 fastPath 與 queries.refinds (AutoJs6 6.8.0 起)
* `優化` pickup / detect 的結果類型 Detect.ResultTypeFuncWithoutParams / ResultTypeFuncWithParams 改由 AutoJs6 的節點方法註冊表生成, 包含全部 206 個可調用的方法名及帶參數的重載, 並補全 ## / $$ / .. 與數組形式的結果類型

# v2.45.0

###### 2026/10/24

* `新增` sqlite 宣告補全 onDowngrade 回調: 打開數據庫時請求的 version 低於現有版本時調用 (AutoJs6 6.8.0 起), 未實現時降級不執行任何操作, 保留表與數據

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


[16 KB page alignment and build verification](https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/docs/16kb.md)
