******

### 發行歷史

******

# v1.1.9

###### 2026/08/21

* `新增` `ai.ask`/`ai.chat`/`ai.stream` 與持久 `ai.session` 的明確 backend profile 型別宣告, 涵蓋 `cpu`/`gpu`/`npu`, `ai.models` 裝置可用性, 穩定不可用原因及禁止 CPU 回退語意

# v1.1.8

###### 2026/08/21

* `新增` `ai.ask`/`ai.chat`/`ai.stream` 與持久 `ai.session` 的原生結構化 JSON 型別宣告, 涵蓋 `structuredJson`, JSON 物件 `responseSchema` 及固定工作階段 schema

# v1.1.7

###### 2026/08/21

* `新增` 新增 `ai.session` 持久本機會話型別宣告, 涵蓋固定會話選項, 每輪僅接收新提示詞的 `ask`/`chat`/`stream` 方法, 生命週期狀態及明確關閉語意

# v1.1.6

###### 2026/08/21

* `新增` 完善 AutoJs6 本機 AI 外掛型別宣告, 涵蓋多角色訊息歷程, 官方與第三方選擇器, 生成參數, 精確用量及串流負載, 以及 `ai.models` 模型探索

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
