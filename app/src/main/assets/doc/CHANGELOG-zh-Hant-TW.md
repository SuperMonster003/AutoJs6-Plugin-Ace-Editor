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
