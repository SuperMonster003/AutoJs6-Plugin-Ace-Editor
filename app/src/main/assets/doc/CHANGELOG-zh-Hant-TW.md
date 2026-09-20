******

### 發行歷史

******

# v1.11.0

###### 2026/09/20

* `優化` 內建 AutoJs6 宣告更新至 `4.18.0`: 新增 Angus Mail 外掛的 `mail` / `$mail` 全域物件與 `Internal.Mail` 命名空間 (用戶端與轉發方法的同步及 `Async` 形態, 監聽事件, 郵件 / 附件 / 地址物件, 帳戶選項與服務商預設, 搜尋條件, 結果文件與錯誤代碼), 編輯器補全與型別檢查隨之涵蓋郵件 API
* `優化` 編輯器補全索引 `autojs6_indices.js` 與聚合宣告 `lib.autojs6.d.ts` 由宿主 `tools/ace-completion` 按內建宣告 `4.18.0` 再生成: 新增 `mail`, `ai`, `tts`, `flow`, `pangu`, `settings`, `yolo`, `powerManager` 與 `workManager` 模組的補全與簽名提示, 宣告索引 `index.d.ts` 與 `BUNDLED_DECLARATIONS.md` 恢復為匯入指令碼生成的形態; 四個驗證指令碼與補全器測試全部通過

# v1.10.0

###### 2026/09/19

* `修復` AGP 9.1 建置時的 SDK XML v4 解析警告及 JVM 單元測試組裝工作誤觸發 APK 原生程式庫對齊檢查的問題 (共用建置外掛 1.8.3)
* `優化` 內建 AutoJs6 宣告更新至 `4.17.0`: Level / LogConfigurator / LogManager 代理改為指向內建的 `org.autojs.autojs.core.console.log` 類別, 第三方程式庫宣告不再包含宿主已移除的程式庫 (log4j, Flexmark, JavaMail, JUnit, github-api, Jackson, commons-io / lang3, kotlin-reflect, SpongyCastle, media3, Guava)

# v1.9.0

###### 2026/09/16

* `新增` 座標點擊 API 與 Flow 工作堆疊宣告, 同步 LSP 補全與索引

# v1.8.0

###### 2026/09/16

* `新增` Flow 可選步驟, 有界迴圈與穩定快照的型別宣告和 LSP 補全

# v1.7.2

###### 2026/09/16

* `優化` 繼 compileSdk 之後將 targetSdk 提升到 37 (Android 17), 外掛程式行為不受新目標版本影響

# v1.7.1

###### 2026/09/15

* `優化` 將 compileSdk 提升到 37 (Android 17), targetSdk 保持 36, 待依賴目標版本的行為驗證後再提升

# v1.7.0

###### 2026/09/15

* `優化` 同步 AutoJs6 4.16.0 宣告中的 images.matchFeatures 圖片參數與 RANSAC 選項, ObjectFrame 幾何屬性與比對統計, 以及 ImageFeatures 的 count 與 method, 更新資源與相依性宣告並重新產生 LSP 分組

# v1.6.0

###### 2026/09/14

* `優化` 同步 AutoJs6 4.15.0 宣告中的 images.matchTemplate scales 選項, 範本比對項幾何屬性及 MatchingResult 輔助方法, 更新資源與相依性宣告並重新產生 LSP 分組

# v1.5.0

###### 2026/09/14

* `優化` 同步 AutoJs6 4.14.0 宣告中的 images.countPointsByColor, images.getMeanColor, images.readPixels 及 colors.distance / invert / blend / contrast 系列方法, 更新資源與相依性宣告並重新產生 LSP 分組

# v1.4.0

###### 2026/09/14

* `優化` 同步 AutoJs6 4.13.0 宣告中的 LaunchConfig.requiresSharedStorage, 更新資源與相依性宣告並重新產生 LSP 分組

# v1.3.0

###### 2026/09/13

* `新增` `pangu` 文字間距宣告與補全, 涵蓋 `spaceText`, `hasProperSpacing` 與具型別的模組匯入; 同步 AutoJs6 宣告 4.12.0 並重新產生 LSP 分組

# v1.2.0

###### 2026/09/13

* `修復` 修復 Lua 工作區路徑, TypeScript 相依快照和語言伺服器測試終止操作的 Android 7 相容性
* `修復` 在通知訂閱者之前清理失敗的字型下載及暫存檔案租約
* `優化` 校驗發行簽章設定, 預期 APK 集合與可重現文件
* `優化` 可選擇裝置 ABI 對應的 APK 或 universal APK. Lua 語意分析支援 arm64-v8a, armeabi-v7a 和 x86_64; x86 保留編輯器和靜態補全.

# v1.1.28

###### 2026/09/13

* `修復` `runtime.requestPermissions` 通用權限名稱的型別宣告與陣列範例, 支援 `access_local_network`; 同步 AutoJs6 宣告 4.11.1 並重新產生 LSP 分組

# v1.1.27

###### 2026/09/13

* `優化` `device.pageSize` 唯讀數值宣告與補全, 同步 AutoJs6 宣告 4.11.0 並重新產生 LSP 分組

# v1.1.26

###### 2026/09/12

* `優化` OCR 宣告與補全支援引擎自動選擇, 實際模式讀取, tap 重設及單次呼叫模式選項; 同步 AutoJs6 4.10.0 宣告並重新產生 LSP 分組

# v1.1.25

###### 2026/09/11

* `優化` 建置階段校驗 64 位原生函式庫的 16 KB 頁面大小對齊, 檢查 manifest 契約並輸出 JSON 報告

# v1.1.24

###### 2026/09/10

* `優化` MediaInfo 查詢宣告與補全涵蓋 streamNumber, countGet, infoKind 和查詢能力

# v1.1.23

###### 2026/09/08

* `新增` 內建 AutoJs6 `4.8.1` 控制台宣告更新: 恢復 `console.rawInput` / `console.input`, 新增 `setTimeVisible` / `setTimeFormat` / `setColorful` / `setAvoidStatusBar` / `setInputVisible` 方法及對應的 `console.build` 選項, JSX 新增 `<console>` / `<globalconsole>` 元素及屬性宣告; 主應用宣告由 AutoJs6 6.8.0 (5279) 重新產生

# v1.1.22

###### 2026/09/07

* `新增` 內建 AutoJs6 `4.8.0` 無障礙自動化宣告及重新產生的 LSP 分組: `Flow` 鏈式物件與 `flow` 命名空間, 工具集 (`smartClick`, `scrollUntil`, `typeInto`, `dismissPopups`, `collectList`, `launchAndWait`, `backUntil`, `toggle` 等), 事件驅動等待, `auto.explain` / `auto.dump` / `auto.stats`, 字串選擇器 `select(syntax)` 與 `findIterator`, 主應用宣告由 AutoJs6 6.8.0 (5278) 重新產生

# v1.1.21

###### 2026/09/01

* `新增` 內建 AutoJs6 `4.7.0` Pinyin 宣告及重新產生的 LSP 分組: `customDictionary` 支援僅目前呼叫生效的自訂讀音覆寫, `compare` 回傳數值排序結果, `compact` 回傳候選矩陣笛卡兒積, 並同步共用外掛 API 型別

# v1.1.20

###### 2026/09/01

* `優化` 同步內建主應用宣告及產生的 LSP 分組中的 Previewer 命名

# v1.1.19

###### 2026/09/01

* `修復` Ace WebView 在主機端主題與首份文件生效前可能短暫顯示純白背景, 尤其會在深色編輯器主題下產生明顯閃爍; 首次畫面現在由主題已套用, 文件已提交與穩定繪製訊號共同放行, 不依賴固定延遲
* `優化` 將約 1.3 MiB 的完整 AutoJs6 自動完成索引移出首次畫面的同步路徑, 在第一個可見程式碼畫面後的閒置時段載入並無縫取代基礎索引; 五個 Android 9-15 環境均恢復 400 個全域項目與 80 個模組
* `優化` 統一 README 版式與 Gradle 平台版本管理方式
* `優化` 精簡外掛描述並規範多語言資源中的標點符號

# v1.1.18

###### 2026/08/31

* `新增` 內建 AutoJs6 `4.6.0` 資源安全的 PNG 量化宣告及重新產生的主應用程式 LSP 分組: 可設定的 `maxPixels` 與 `maxMemoryBytes` 預算超限時回傳帶詳細資料的型別化錯誤, 結果公開 `peakWorkingMemoryBytes`, 取消 API 涵蓋明確要求與指令碼結束
* `新增` Python, Lua, Java 與 Kotlin 離線 P1 語言支援: 依副檔名路由 Ace mode, 提供語法醒目提示, 本語言關鍵字, snippets 與文件單字補全; Lua 額外啟用 worker 語法診斷, 四種語言都與 AutoJs6/TypeScript 候選嚴格隔離
* `新增` Python, Lua, Java 與 Kotlin 離線 P2 補全: 依需求載入固定版本的標準函式庫索引, 並擷取目前文件的 import, 函式, 類別, 方法, 參數和變數; 嚴格維持跨語言隔離及現有 JavaScript/TypeScript 行為
* `新增` 新增可插拔八能力語意 Provider, 通用 JSON-RPC/LSP 核心及 WebWorker/裝置內 stdio 雙傳輸; TypeScript 已零回歸遷移, provider 故障時自動降級至 P2, 四門新語言語意開關預設關閉
* `新增` 透過固定版本的 Pyright 1.1.413 Worker 和 271 個 typeshed 檔案內建完全離線的 Python 3.12 語意: 型別補全, hover, signature help, 診斷和定義跳轉現預設開啟, 不相容的舊 WebView 與執行失敗會靜默降級至 P2
* `新增` 透過固定版本的 LuaLS 3.18.2 裝置內伴生程序內建完全離線的 Lua 語意: 補全, hover, signature help, 診斷和定義跳轉在 arm64-v8a, armeabi-v7a 與 x86_64 預設開啟; 原生資產缺少或損壞, 不支援的 ABI 與程序崩潰會靜默降級至 P2, 並以有限退避恢復
* `新增` 透過固定版本的 ECJ 3.26.0 與裁剪的 Android API 36 stubs 內建完全離線的 Java 單檔診斷: 語法錯誤與未解析符號現預設獲得精確範圍標註; JDT Code Assist 依賴 ART 上不可用的 Eclipse Workspace/OSGi 執行環境, 因此補全繼續使用 P2
* `新增` Kotlin P2+ 離線補全: 擴充 Kotlin 2.2.21 執行個體 API, 依目前檔案提供保守型別提示, 支援 safe-call 並重用 Java/Android 索引; 裝置內 compiler 因體積, ART 執行, 記憶體與最低 SDK 驗證未通過, 因此不內建 Kotlin compiler 或語意執行環境
* `新增` 在 AutoJs6 程式碼編輯器設定中顯示同一份 9-mode 語言支援矩陣, 並為 TypeScript/JavaScript, Python, Lua 與 Java 提供逐語言語意開關; Kotlin 以 P2+ 無法使用狀態保持可見, 檔案類型自訂明確作為允許清單而非語言重新分類

# v1.1.17

###### 2026/08/31

* `新增` 內建 AutoJs6 `4.5.0` 色彩正確的 PNG 量化宣告及重新產生的主應用程式 LSP 分組: `images.quantizeToFile` 直接寫入檔案並回傳大小與品質指標, `preserveAlpha` 控制透明或不透明輸出

# v1.1.16

###### 2026/08/30

* `新增` 內建 AutoJs6 `4.4.0` PNG 量化結果宣告及重新產生的主應用程式 LSP 分組: `images.quantize` 回傳編碼位元組, 大小, 實際品質與量化誤差; 明確品質下限無法滿足時公開型別化 `QualityTooLowException`

# v1.1.15

###### 2026/08/30

* `新增` 內建 AutoJs6 `4.3.0` PNG 量化選項宣告及重新產生的主應用程式/資源 LSP 分組: `Images.PngQuantizationOptions` 涵蓋調色盤大小, 速度, 品質範圍, 抖動與 posterize, 並保留數字 `quality` 相容性

# v1.1.14

###### 2026/08/29

* `新增` 新增透過 F2 與行動版 `重新命名` 觸發的專案範圍 TypeScript 符號重新命名: Ace 從精確專案快照產生有界跨檔案編輯並請求 AutoJs6 contract 5 授權, 預覽, 衝突檢查, 原子發佈, 回復及全部磁碟寫入均完全由 Host 負責
* `新增` 新增 TypeScript 自動匯入與拼字快速修正, 可透過 Ctrl/Command+. 或行動裝置 `快速修正` 觸發: Ace 僅接受目前緩衝區內的有序編輯, 請求 AutoJs6 6.8.0 (5276) 進行 contract 4 授權, 並將核准結果作為一次可復原修改套用
* `新增` TypeScript 跨檔案智慧現已涵蓋專案原始碼及凍結相依性宣告中的補全, hover, 簽章說明及定義跳轉; F12, Ctrl/Command+點擊和行動裝置 `移至定義` 會傳送 contract 3 目標, 由 AutoJs6 6.8.0 (5276) 在開啟及定位前獨立複驗
* `新增` 新增由主機提供的 TypeScript 專案診斷: Ace 現會驗證並載入完整的有界原始碼快照, 解析專案檔案間的 import, 並依執行前編譯的相同規則標示缺少的模組; 需要 AutoJs6 6.8.0 (5276) 或更新版本
* `新增` TypeScript 專案型別層現在會在繼續編輯前偵測原生 addon 訊號與安裝生命週期 hook, 發布與主機及編譯器一致的穩定相依性邊界錯誤和純 JavaScript/WASM 替代指引
* `新增` Ace 依賴型別權威已同步 resolver policy revision 3, 並包含 lodash 4.17.21 與 `@types/lodash` 4.17.25 覆蓋, 確保執行階段套件未內建宣告時 Rhino 與 Node 的診斷仍保持一致
* `新增` 新增與 TypeScript 編譯器共用的凍結專案相依型別層: Ace 現可解析 package `types`/`typings`, TypeScript 6 `typesVersions`, 巢狀宣告及已安裝 `@types`, 並在 Rhino 和 Node profile 提供一致的 dayjs 補全, hover 與 strict 診斷
* `新增` 內建 AutoJs6 `4.2.0` R8 宣告與產生的 LSP 群組: `ScriptRuntime.loadJarWithR8` 的 6 個多載支援經驗證的 mapping/seeds/usage/retrace metadata 匯出, `retraceR8Stack` 透過通訊協定 1.1 執行溯源綁定的堆疊還原, 外掛選擇失敗時禁止回退

# v1.1.13

###### 2026/08/26

* `新增` 內建 AutoJs6 `4.1.0` 最終僅經外掛的 AI 宣告: 省略選擇器時使用官方 3-Stone AI 預設目標, 所有請求只接受外掛 `target` 路由和標準 `timeout`, 並移除主機端直連設定, 認證和過渡事件型別

# v1.1.12

###### 2026/08/26

* `新增` 內建 AutoJs6 統一 AI 目標宣告: `ai.catalog`, `target` 精確路由, 本機與線上目標, 完整回應及工作階段中繼資料, reasoning 輸出和穩定的禁止回退錯誤; 同時移除所有未發布的舊 AI 目錄 API 與相容別名

# v1.1.11

###### 2026/08/25

* `新增` 在 AutoJs6 宣告與產生的 LSP 群組中內建 `ScriptRuntime.loadJarWithR8` 的 3 個明確多載, 涵蓋 keep rules, 有序 classpath 與 consumer-rule ordinal 綁定

# v1.1.10

###### 2026/08/24

* `新增` Ace TypeScript 診斷與編譯外掛的 TypeScript 6.0.3 revision-2 Rhino/Node profile 對齊 (ES2018, strict, CommonJS/Node10 或 NodeNext), 支援 Node 專案路由並預設啟用 .mts/.cts 及其宣告檔, 同時保留靜態回退

# v1.1.9

###### 2026/08/21

* `新增` `ai.ask`/`ai.chat`/`ai.stream` 與持久 `ai.session` 的明確 backend profile 型別宣告, 涵蓋 `cpu`/`gpu`/`npu`, `ai.catalog` 裝置可用性, 穩定不可用原因及禁止 CPU 回退語意

# v1.1.8

###### 2026/08/21

* `新增` `ai.ask`/`ai.chat`/`ai.stream` 與持久 `ai.session` 的原生結構化 JSON 型別宣告, 涵蓋 `structuredJson`, JSON 物件 `responseSchema` 及固定工作階段 schema

# v1.1.7

###### 2026/08/21

* `新增` 新增 `ai.session` 持久本機會話型別宣告, 涵蓋固定會話選項, 每輪僅接收新提示詞的 `ask`/`chat`/`stream` 方法, 生命週期狀態及明確關閉語意

# v1.1.6

###### 2026/08/21

* `新增` 完善 AutoJs6 本機 AI 外掛型別宣告, 涵蓋多角色訊息歷程, 官方與第三方選擇器, 生成參數, 精確用量及串流負載, 以及 `ai.catalog` 模型探索

# v1.1.5

###### 2026/08/21

* `新增` 同步 AutoJs6 YOLO 獨立外掛目標偵測型別宣告, 包含明確 Provider 元件, 工作階段與偵測選項, 偵測結果和穩定錯誤代碼

# v1.1.4

###### 2026/08/20

* `新增` 同步 AutoJs6 AI 外掛的 `Ask`, `Chat` 和 `Stream` 型別宣告, 包含官方/第三方外掛選擇, 本機生成參數, 路由回應和串流事件型別

# v1.1.1

###### 2026/07/28

* `修復` 修復可選宣告群組的靜態成員補全, 包括 `App.CHROME` 和大型 `R.string.text_*` 資源集; Ace 截斷的候選清單現在會在前綴變更時以防彈跳方式重新整理
* `修復` 修復一般大型文件被誤判為超長行並切換到純文字模式, 導致 JavaScript 語法醒目提示, 自動完成和語意服務失效的問題; 真正的超長單行仍會啟用安全模式
* `修復` 修復 Ace 簽章/參數提示氣泡總是使用淺色背景的問題, 現在會隨編輯器主題動態套用背景色和前景色; 切換主題時也會個別重新整理已開啟的自動完成候選選單
* `修復` 修復系統文字選取 ActionMode 無法跟隨 Ace 配色的問題, 現改用編輯器自有且可感知調色盤的選取工具列, 讓選取操作, 按壓狀態和更多面板在各 Android 版本中均跟隨目前的 Ace 配色

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
