# Android WebView Ace Worker 可行性验证

验证日期：2026-08-31  
对应路线图：`Roadmap.md` M0-7

## 结论

验证门通过。当前 `WebViewAssetLoader` 页面来源
`https://appassets.androidplatform.net/assets/.../autojs6_editor.html` 能在覆盖到的
Android 9 / 12 / 15 与 Chromium WebView 126 / 130 / 145 上创建 Ace 1.4.12
`WorkerClient`、加载打包的 `worker-javascript.js`，并收到 worker 发回的
`annotate` 事件。

这证明 WebView 内嵌 worker 形态可作为 M1 Lua 语法诊断和 M4 Python WebView
方案的候选前置能力。它不是对所有厂商 WebView 的无限兼容承诺；新增最低版本、
定制 WebView 或页面来源策略时仍需重跑探针。

M0 不启用 `worker-json`。JSON 继续使用现有同步 `JSON.parse` 短路诊断，保持单一、
体积小且可预测的诊断来源；若未来 JSON 校验扩大到 schema 等重任务，再单独评估
worker provider。

## M1 生产策略

M1 已把验证结论收敛为按 mode 的生产策略：仅 `ace/mode/lua` 调用
`setUseWorker(true)`，JavaScript、TypeScript、JSON、Python、Java、Kotlin 与纯文本
均保持关闭。文档路径或 mode 变化时会重新应用策略，因此离开 Lua 会停止 worker，
不会让 Lua 注解或后台解析泄漏到下一份文档。

打包的 `worker-lua.js` 已在下列环境用故意缺失 `end` 的输入验证：

| 设备 | Android / API | Lua worker annotation | 离开 Lua 后停止 |
|---|---:|---|---|
| Xiaomi 23046RP50C | 15 / 35 | 通过 | 通过 |
| Sony G8441 | 9 / 28 | 通过 | 通过 |
| Sony XQ-AT72 | 12 / 31 | 通过 | 通过 |
| Android Emulator | 13 / 33 | 通过 | 通过 |

完整的语言候选隔离、样例高亮与设备证据见
`tools/ace-lsp/M1_LANGUAGE_ACCEPTANCE.md`。

## 设备矩阵

| 设备 | Android / API | WebView provider | Worker | 证据 |
|---|---:|---|---|---|
| Xiaomi 23046RP50C | 15 / 35 | `com.google.android.webview@130.0.6723.86` | 通过 | `sessionWorkerCreated=true`，2 条 annotation |
| Sony G8441 | 9 / 28 | `com.android.chrome@126.0.6478.186` | 通过 | `sessionWorkerCreated=true`，2 条 annotation |
| Sony XQ-AT72 | 12 / 31 | `com.google.android.webview@145.0.7632.120` | 通过 | `sessionWorkerCreated=true`，2 条 annotation |

三台设备均同时满足：

- 页面中存在原生 `Worker` 构造器；
- `EditSession.setUseWorker(true)` 创建 `session.$worker`；
- 当前 mode 为 `ace/mode/javascript`；
- 无效 JavaScript 输入触发 worker 的 `annotate` 回调；
- 用例结束后恢复 `setUseWorker(false)`，不改变生产默认策略。

## 可重复验证

探针位于：

`app/src/androidTest/java/io/github/supermonster003/autojs6/plugin/ace/editor/core/AceLanguageRoutingSmokeTest.kt`

构建：

```powershell
.\gradlew.bat :app:assembleDebug :app:assembleDebugAndroidTest
```

安装 target/test APK 后，对目标设备运行：

```powershell
adb -s <serial> shell am instrument -w -r `
  -e class 'io.github.supermonster003.autojs6.plugin.ace.editor.core.AceLanguageRoutingSmokeTest#aceWorkerFeasibilityProbeReachesARecordedConclusion' `
  io.github.supermonster003.autojs6.plugin.ace.editor.test/androidx.test.runner.AndroidJUnitRunner
```

结构化记录以 `AUTOJS6_ACE_WORKER_PROBE=` 前缀写入 instrumentation 进程日志。

## 降级约定

后续 provider 必须把 worker 创建失败、脚本加载失败和响应超时视为可恢复能力缺失：

- JSON 保持主线程 `JSON.parse`；
- Lua 可降级为主线程、有预算的解析，或明确关闭语法诊断；
- Python provider 回退到 P2 静态索引，不得影响编辑、保存或 JS/TS 服务；
- 任何 worker 都必须具备超时、销毁和文档切换时取消机制。
