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
- 支援 CRLF 保留, 增量文本同步, 大文本分塊載入, 超長行輕量模式, IME 適配, 運行健康監測和切回宿主原生編輯器的通知.
- 支援主題和顯示設定, 以及具備簽名目錄驗證, SHA-256/WOFF2 驗證, 下載, 緩存, 安裝和刪除功能的字體管理.
- 插件資訊, README 與 CHANGELOG 支援西班牙語/法語/俄語/阿拉伯語/日語/韓語/英語/簡體中文/香港繁體/台灣繁體.

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

******

### 安裝

******

安裝構建後生成的 APK:

```powershell
adb install -r .\app\build\outputs\apk\debug\autojs6-plugin-ace-editor-v1.1.14-universal.apk
```

隨後在 AutoJs6 插件中心啟用 `ace-editor`, 完全退出並重新啟動 AutoJs6. 安裝, 更新或回滾插件後都應重新啟動宿主.

生產環境應使用 AutoJs6 認可的受信任簽名. 同進程插件代碼繼承宿主進程的權限, 請勿安裝來源不明或未經審核的 APK.

******

### 發行歷史

******

# v1.1.14

###### 2026/08/29

* `新增` 新增透過 F2 及流動版 `重新命名` 觸發的項目範圍 TypeScript 符號重新命名: Ace 從精確項目快照產生有界跨檔案編輯並請求 AutoJs6 contract 5 授權, 預覽, 衝突檢查, 原子發佈, 回復及全部磁碟寫入均完全由 Host 負責
* `新增` 新增 TypeScript 自動匯入及拼寫快速修正, 可透過 Ctrl/Command+. 或流動裝置 `快速修正` 觸發: Ace 只接受目前緩衝區內的有序編輯, 請求 AutoJs6 6.8.0 (5276) 進行 contract 4 授權, 並將批准結果作為一次可復原修改套用
* `新增` TypeScript 跨檔案智能現已覆蓋專案原始碼及凍結依賴聲明中的補全, hover, 簽名說明及定義跳轉; F12, Ctrl/Command+點擊和流動裝置 `前往定義` 會傳送 contract 3 目標, 由 AutoJs6 6.8.0 (5276) 在開啟及定位前獨立複驗
* `新增` 新增由宿主提供的 TypeScript 專案診斷: Ace 現會驗證並載入完整的有界原始碼快照, 解析專案檔案間的 import, 並按執行前編譯的相同規則標示缺少的模組; 需要 AutoJs6 6.8.0 (5276) 或更高版本
* `新增` TypeScript 專案類型層現會在繼續編輯前偵測原生 addon 訊號及安裝生命週期 hook, 發佈與宿主及編譯器一致的穩定依賴邊界錯誤和純 JavaScript/WASM 替代指引
* `新增` Ace 依賴類型權威已同步 resolver policy revision 3, 並包含 lodash 4.17.21 與 `@types/lodash` 4.17.25 覆蓋, 確保執行階段套件未內置宣告時 Rhino 與 Node 的診斷仍保持一致
* `新增` 新增與 TypeScript 編譯器共用的凍結專案依賴類型層: Ace 現可解析 package `types`/`typings`, TypeScript 6 `typesVersions`, 巢狀聲明及已安裝 `@types`, 並在 Rhino 和 Node profile 提供一致的 dayjs 補全, hover 與 strict 診斷
* `新增` 內置 AutoJs6 `4.2.0` R8 聲明與生成的 LSP 分組: `ScriptRuntime.loadJarWithR8` 的 6 個多載支援經驗證的 mapping/seeds/usage/retrace metadata 匯出, `retraceR8Stack` 透過協議 1.1 執行來源綁定的堆疊還原, 外掛選擇失敗時禁止回退

# v1.1.13

###### 2026/08/26

* `新增` 內置 AutoJs6 `4.1.0` 最終只經外掛的 AI 宣告: 省略選擇器時使用官方 3-Stone AI 預設目標, 所有請求只接受外掛 `target` 路由和標準 `timeout`, 並移除宿主端直連設定, 憑證和過渡事件類型

# v1.1.12

###### 2026/08/26

* `新增` 內置 AutoJs6 統一 AI 目標聲明: `ai.catalog`, `target` 精確路由, 本機與網上目標, 完整回應及會話元數據, reasoning 輸出和穩定的禁止回退錯誤; 同時移除所有未發佈的舊 AI 目錄 API 與兼容別名

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
