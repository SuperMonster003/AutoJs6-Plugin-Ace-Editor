# M1 四语言基础支持验收

验收日期：2026-08-31  
对应路线图：`Roadmap.md` M1

## 结论

M1 通过。Python、Lua、Java 与 Kotlin 已获得按文件扩展名自动选择的 Ace mode、
本语言关键字、独立 snippets 和文档单词补全。四门语言均不进入 AutoJs6 静态候选
或 TypeScript 语言服务；Lua 额外通过打包的 `worker-lua.js` 提供离线语法错误标注。

这仍是 P1 能力，不等同于完整语义服务：Python、Java、Kotlin 暂无类型感知补全或
语义诊断，Lua 只有解析级语法诊断。后续 P2/P3 里程碑在此基础上增量实现。

## 路由与运行策略

| 扩展名 | Ace mode | 关键字 | snippets | 语义或诊断 |
|---|---|---:|---:|---|
| `.py` | `ace/mode/python` | 有 | 18 | 无 |
| `.lua` | `ace/mode/lua` | 有 | 6 | `worker-lua` 语法诊断 |
| `.java` | `ace/mode/java` | 有 | 80 | 无 |
| `.kt`, `.kts` | `ace/mode/kotlin` | 有 | 15 | 无 |

路由由 `autojs6_ace_bridge.js` 的 `resolveAceMode(fileName)` 唯一决定。只有 Lua mode
会令 session 启用 Ace worker；切换到其他 mode 时立即关闭 worker。未知扩展名仍
回退 `ace/mode/text`。

每种语言的候选源限定为：

- Ace `keyWordCompleter` 的本语言关键字；
- 该 mode 绑定的独立 snippet scope；
- Ace `textCompleter` 从当前文档提取的单词。

Android WebView 验收逐语言断言：AutoJs6 静态候选为 0、JavaScript 专属关键字
不泄漏、其他三门语言的标志性 snippet 不泄漏。Node 运行时校验还断言四门语言的
LSP completion/diagnostic 都为 0，且整个隔离过程中 TypeScript service 创建次数为 0。

## 高亮样例

样例位于 `app/src/androidTest/assets/ace-language-samples/`：

| 文件 | 覆盖内容 | 关键字快照 |
|---|---|---|
| `sample.py` | 注释、字符串、数字、class、函数、f-string | `from`, `class`, `def`, `return` |
| `sample.lua` | 注释、字符串、数字、表、函数、分支 | `local`, `function`, `if`, `return`, `end` |
| `Sample.java` | package/import、注解、泛型、字符串、数字 | `package`, `import`, `public`, `class`, `return` |
| `Sample.kt` | package、data class、函数、字符串模板、数字 | `package`, `data`, `class`, `fun`, `return` |

设备测试读取真实资产文件，在 Ace tokenizer 中逐词检查 token；注释、字符串、数字
分别必须命中 `comment`、`string`、`constant.numeric` 类别，关键字不得落为 `text`
或 `identifier`。

## Kotlin 1.4.12 兼容补丁

Ace 1.4.12 的 Kotlin mode 来自 TextMate 规则，存在三个影响 P1 验收的上游缺口：

1. `class`、`object`、`interface` 规则把声明关键字捕获标成 `text`；
2. 规则未调用 `createKeywordMapper()`，导致 Ace 关键字 completer 获得空列表；
3. 上游 Kotlin snippets 为空，因此 mode 未设置 `snippetFileId`。

项目保留同版本官方 `src-noconflict/mode-kotlin.js` 的可读结构，并做三处最小补丁：
修正声明关键字 token、登记 Kotlin 关键字列表、绑定 `ace/snippets/kotlin`。补丁旁有
内联说明，Android 设备测试分别覆盖 `class` 高亮、`fun` 候选和 `companion` snippet。
没有升级 Ace 大版本，也没有改动其他语言规则。

## Lua worker 验收

故意输入缺失 `end` 的 Lua 函数后，测试要求同时满足：

- session mode 为 `ace/mode/lua` 且 `getUseWorker() === true`；
- `session.$worker` 已创建；
- `worker-lua` 发布至少一条 annotation；
- 切换到 Python 后 `getUseWorker() === false` 且旧 worker 被停止。

| 设备 | Android / API | WebView provider | 完整 M1 冒烟 |
|---|---:|---|---|
| Xiaomi 23046RP50C | 15 / 35 | `com.google.android.webview@130.0.6723.86` | 4/4 通过 |
| Sony G8441 | 9 / 28 | `com.android.chrome@126.0.6478.186` | 4/4 通过 |
| Sony XQ-AT72 | 12 / 31 | `com.google.android.webview@145.0.7632.120` | 4/4 通过 |
| Android Emulator | 13 / 33 | system WebView | 4/4 通过（额外覆盖） |

Android 9 在 APK 重装后的第一次并行冷启动中出现一次 Chrome 126 自身的
`androidx.window...Consumer` 类初始化瞬态，未进入任何语言断言；同设备独立 M1 用例
及随后的完整 4 项回归均通过。此环境现象不改变 M1 结论，但后续 X-3 降级矩阵应把
旧 WebView 的首次初始化失败纳入恢复策略测试。

## 自动化入口

桌面与 Node：

```powershell
.\gradlew.bat :app:testDebugUnitTest :app:verifyAutoJs6LspRuntime
```

Android：

```powershell
.\gradlew.bat :app:assembleDebug :app:assembleDebugAndroidTest
adb -s <serial> shell am instrument -w -r `
  -e class 'io.github.supermonster003.autojs6.plugin.ace.editor.core.AceLanguageRoutingSmokeTest' `
  io.github.supermonster003.autojs6.plugin.ace.editor.test/androidx.test.runner.AndroidJUnitRunner
```

`verifyAutoJs6LspRuntime` 固定检查 snippet 数量下限和代表性 trigger：Python 18、
Lua 6、Java 80、Kotlin 15；Python 还必须使用 Python 3 的 `except ... as ...` 语法。

## 2.0.0 (Ace 1.44.0) 复核

2026-10-13 换用 Ace 1.44.0 后 (Roadmap-Ace-1.44.0.md A4), 五个 verify 任务 (`verifyAutoJs6LanguageIndices`,
`verifyAutoJs6LspRuntime`, `verifyAutoJs6PythonWorker`, `verifyAutoJs6LuaLanguageServer`, `verifyAutoJs6JavaSemanticRuntime`)
与 `verifyAutoJs6KotlinP2Plus` 均通过. 变化:

- `mode-kotlin.js` 改为官方 1.44.0 (关键字映射已由上游修正); 官方 mode 不设 `snippetFileId`, 由
  `autojs6/autojs6_mode_patches.js` 在 mode 加载时指向项目维护的 `ace/snippets/kotlin` (15 个片段照常加载).
- Java 关键字补全依赖同一补丁脚本: 1.44.0 的 Java mode 不再把关键字放进 `$keywordList`.
- `.tsx` 改用官方 `ace/mode/tsx`.
- Python 片段继续由项目维护: 上游 1.44.0 的 36 个片段仍含 Python 2 的 `except X, e` 写法; 项目版 18 个片段保持 Python 3 写法.
- Lua, Java 片段使用上游 1.44.0 版本 (模块改为通过相对 ID 读取 `*.snippets` 文本).
