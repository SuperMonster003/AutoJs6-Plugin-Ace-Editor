# M3 语义服务框架验收

记录日期：2026-08-31  
结论：通过  
范围：可插拔 `SemanticProvider`、通用 JSON-RPC/LSP 核心、WebWorker 与设备内 stdio 双传输、
TypeScript 迁移、降级链、健康状态、设置与文件类型迁移

## 能力边界

M3 是后续 Python、Lua、Java、Kotlin 语义能力的一次性基建，本里程碑不宣称新增上述语言的
类型推导、语义诊断、跳转或重命名能力。它交付统一接入面，使后续接入一门语言只需实现一个
provider 并提供设备内运行时，同时保留 M2 静态补全作为无条件可用的本地降级层。

TypeScript 是兼容性例外：原有 in-process 语言服务已迁移至新 provider，且继续默认启用，避免
升级后丢失既有语义能力。Python、Lua、Java、Kotlin 的独立语义开关默认关闭，分别在其后续
里程碑达到验收门后再转为默认开启。

## Provider 契约与 TypeScript 迁移

`autojs6_semantic_provider.js` 定义固定的八项能力：

| 能力 | Provider 方法 | UI/调用方行为 |
|---|---|---|
| completion | `getCompletions` | 无能力或失败时回退 M2，再回退文档单词 |
| hover | `getHover` | 无能力时返回空结果 |
| signatureHelp | `getSignatureHelp` | 无能力时不展示签名面板 |
| diagnostics | `getDiagnostics` | 无能力时不发布语义诊断 |
| definition | `getDefinition` | 无能力时禁用定义入口 |
| rename | `getRename` | 无能力时禁用重命名入口 |
| codeActions | `getCodeActions` | 无能力时禁用快速修复入口 |
| dispose | `dispose` | editor/provider 生命周期结束或故障时只释放一次 |

`TypeScriptInProcessProvider` 只做契约适配，不复制或改写底层 TypeScript service 状态。Node
回归逐项断言 completion、hover、signature help、diagnostics、definition、rename、code actions
的参数与结果原样转发，并验证 dispose 生命周期。原有 TypeScript 6.0.3 全量运行时快照继续通过。

Provider host 保存可观测健康状态，包括 provider id、状态、能力、成功/失败/超时次数、最近操作、
耗时和失败原因。同步异常或异步超时会把 provider 标记为 `degraded`、只释放一次并通知 Android
健康监测；后续请求不会反复调用已故障 provider。补全固定执行：

```text
SemanticProvider -> M2 StaticIndexCompleter -> document words
```

自动测试会人为抛出异常和制造超时，并模拟 provider 被杀死；两次后续补全均来自 M2，provider
只调用一次、只释放一次，健康记录仍可查询。单语言语义开关关闭时不会创建 TypeScript service，
但对应 M2 层继续工作。

## 通用 LSP 核心

`autojs6_lsp_core.js` 与传输完全解耦，覆盖以下 JSON-RPC/LSP 消息：

- `initialize`、`initialized`、`shutdown`、`exit`；
- `textDocument/didOpen`、`didChange`、`didClose`，采用增量同步并维护单调文档版本；
- completion、completion resolve、hover、signature help、definition、rename、code action；
- `textDocument/publishDiagnostics` 与 `workspace/applyEdit`；
- `$/cancelRequest`。

协议测试覆盖 15 种消息、乱序响应、主动取消、过期诊断丢弃、snippet/choice placeholder 转换、
completion resolve、增量文本变更和 server 发起的 workspace edit。传输重启后客户端会重新执行
initialize/initialized，并用当前文本和版本重新 didOpen 所有文档；测试中的恢复版本固定为 5。

Workspace edit 在提交前完成全量校验，拒绝越界、重叠编辑和不安全 URI，不会留下半应用状态。
URI 校验拒绝 query/fragment、路径穿越、非 `file` scheme、Android 大小写不一致及 workspace root
之外的目标。

## 双传输与 Android 进程边界

两种传输运行同一套 initialize/echo/shutdown mock suite：

1. WebWorker/postMessage：握手超时、崩溃检测、有界指数退避重启和空闲退出；测试固定重启延迟
   为 250 ms、500 ms、10,000 ms。
2. 设备内 stdio：Kotlin `ProcessBuilder` 进程通过 UTF-8 `Content-Length` framing 与 AceBridge
   交换 JSON。覆盖握手超时、stderr drain、写入失败、崩溃检测、退避重启、空闲退出和销毁清理。

安全边界由 Kotlin 所有：JavaScript 只能提交不透明 provider id，不能传入命令、工作目录或环境变量；
`AceStdioLspProcessRegistry` 仅启动编译进应用的 allowlist spec。M3 尚未注册真实伴生服务器，因此
任意命令和未知 provider id 均被拒绝；M5/M6 通过后再分别登记固定 Lua/Java server spec。

`AceLspMessageFramingTest` 与 `AceStdioLspProcessTransportTest` 使用内存 pipe/fake process 验证多字节
UTF-8 framing、echo、ready、握手超时、崩溃重启、退避、空闲退出和 allowlist 拒绝路径。

## 设置与迁移

- `DEFAULT_FILE_TYPES` 纳入 `.py`、`.lua`、`.java`、`.kt`、`.kts`，revision 从 2 升至 3；
- 仅当旧值与 revision 1 或 2 的历史默认值完全相等时自动迁移；任何用户自定义值原样保留；
- 新增 TypeScript、Python、Lua、Java、Kotlin 五个独立语义开关；
- 全局 LSP 关闭时所有语言的有效语义状态均为关闭，但不会擦除每语言偏好；
- TypeScript 默认开以保持零回归，四门待接入语言默认关；JSON 不进入语义 provider 路由；
- `AceLspServerManager` 保留历史类名以避免无收益的 API churn，并明确注释其当前职责是配置与
  provider snapshot，而非通用 JSON-RPC 客户端。

JVM 单测覆盖两个历史默认值的精确迁移、自定义值保留、全局/单语言开关组合、扩展名路由、
provider id/capability snapshot 和 assets 完整性。

## 自动化结果

`:app:verifyAutoJs6LspRuntime` 的 M3 摘要：

| 分组 | 关键结果 |
|---|---|
| SemanticProvider | 8 项能力；异常 1、超时 1、dispose 1；故障后 M2 连续两次可用 |
| LSP 核心 | 15 种消息；文档版本 5；过期响应 2；取消 1；安全 edit 通过，不安全 edit 拒绝 |
| 重启恢复 | initialize 握手 2 次；文档以版本 5 和最新文本重新打开 |
| WebWorker | 同构 echo 值 42；崩溃后创建 2 个 worker；空闲退出通过 |
| stdio bridge | 同构 echo 值 42；ready 1、stop 1；framing 与进程生命周期 JVM 测试通过 |
| 兼容回归 | TypeScript 6.0.3 全量语义、M0/M1/M2、旧 WebView fallback 全部通过 |

完整构建入口：

```powershell
.\gradlew.bat :app:verifyAutoJs6LspRuntime `
  :app:testDebugUnitTest `
  :app:compileDebugAndroidTestKotlin `
  :app:assembleDebug `
  :app:assembleDebugAndroidTest
```

## 真实 WebView 验收

设备用例：

```text
AceLanguageRoutingSmokeTest#m3SemanticFrameworkLoadsAndKeepsDisabledLanguagesOnM2Fallback
```

该用例验证三个新脚本在 Android 页面内实际加载、八能力列表和 TypeScript provider snapshot、
WebWorker/stdio 工厂可见，并切换到默认关闭语义的 Python 后确认 `Path.` 仍由 M2 返回
`read_text`。随后在每个环境运行完整 `AceLanguageRoutingSmokeTest`，同时复验 M0–M2、Lua
worker 与 JavaScript 隔离。

| 设备/环境 | Android / API | M3 单项 | 完整语言套件 |
|---|---:|---:|---:|
| Sony G8441 | 9 / 28 | 通过 | 6/6 通过 |
| x86 模拟器 | 10 / 29 | 通过 | 6/6 通过 |
| Sony XQ-AT72 | 12 / 31 | 通过 | 6/6 通过 |
| Sony XQ-DQ72 | 13 / 33 | 通过 | 6/6 通过 |
| x86_64 模拟器 | 13 / 33 | 通过 | 6/6 通过 |
| Xiaomi 23046RP50C | 15 / 35 | 通过 | 6/6 通过 |
| x86_64 模拟器 | 16 / 36 | 通过 | 6/6 通过 |

同一份应用 APK 与测试 APK 在七个环境均安装成功；完整套件共执行 42 个真实 WebView 测试，
没有项目用例失败。M3 单项另行顺序复跑 7 次，也全部通过。Android 9 在最终完整套件的首次
instrumentation 启动中曾于应用初始化前由系统 `ADB-JDWP Connection` 线程在 `libart.so` 内
SIGSEGV，当次测试数为 0；同一 APK 随即改为单设备重跑并 6/6 通过。该系统级偶发现象与 M2
记录一致，不涉及项目代码执行，但作为设备环境事实保留在验收记录中。

## 资产增量

| 资产 | 字节 | SHA-256 |
|---|---:|---|
| `autojs6_semantic_provider.js` | 20,587 | `b953d5f8c0bd50487bf038828a7d725223619f824f6733db3056d38862502e0f` |
| `autojs6_lsp_core.js` | 33,375 | `095caf2e85fb5666d62aae61bc9984309efdc9858b2f89c11f40cb9a09cf195c` |
| `autojs6_lsp_transports.js` | 16,122 | `9dcc4ce38697103dce1bf814460415a299cd43bfa26301c50cd8c29b798570bb` |
| **合计** | **70,084（68.44 KiB）** | — |

这些是项目自有代码，没有引入新的第三方运行时或许可证条目。Kotlin 进程桥会编译进 dex，不计入
上述未压缩 asset 精确新增量。

最终 debug 交付物为
`app/build/outputs/apk/debug/autojs6-plugin-ace-editor-v1.1.18-universal.apk`，大小
13,980,368 字节（13.333 MiB），SHA-256 为
`5bb36138dcde53772274121b5242446ff3212090c3fb0d8802b288014b33cbbc`。APK zip 清单已确认
包含三份 M3 脚本和重新生成的本地化 CHANGELOG；该最终哈希对应的 APK 已在上述七个环境重新
安装并逐一通过 M3 单项用例。

## DoD 判定

- TypeScript 走新 provider 且全量行为零回归：通过。
- 固定八能力契约与 UI 能力降级：通过。
- provider 异常/超时健康记录及 `semantic -> M2 -> document words` 降级链：通过。
- 通用协议层消息、版本、乱序、取消、诊断、snippet、workspace edit 与 URI 安全：通过。
- WebWorker 与 stdio 双传输同构 mock suite：通过。
- Kotlin ProcessBuilder/framing/lifecycle/allowlist：通过。
- revision 3 文件类型迁移与独立语义开关：通过。
- Android 9–16 真实 WebView 加载与 M0–M2 回归：通过。

M3 完成，下一阶段可进入 M4 Python 设备内语义运行时验证门。

> M4 后记：本文件保留 M3 当时“四门待接入语言默认关闭”的历史验收状态。M4 通过后，
> Python 已改为默认启用固定版本的 Pyright Worker；Lua、Java、Kotlin 仍保持 M2 默认路径。
> 当前行为与设备矩阵见 `M4_PYTHON_SEMANTIC_ACCEPTANCE.md`。
