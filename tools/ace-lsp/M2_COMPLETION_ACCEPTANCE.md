# M2 轻量本地补全验收

记录日期：2026-08-31  
结论：通过  
范围：Python、Lua、Java、Kotlin 的 P2 静态标准库索引与当前文档符号补全

## 能力边界

M2 提供的是离线、无常驻分析引擎的轻量补全层：

- 标准库或平台 API 的全局名、模块/类静态成员、签名与简短说明；
- 当前文档中的 import/alias、函数、类、方法、参数、顶层变量和局部变量；
- 补全项来源区分，当前文档候选标记为 `local symbol`；
- Python/Lua/Java/Kotlin 之间严格隔离，并且不进入 TypeScript 语言服务；
- 未加载语义 provider 时，由现有分发层回退到 M2，再回退到文档单词。

M2 不构建 AST、类型图或工程模型，因此不承诺变量类型推导、实例成员补全、诊断、跳转、
重命名或第三方依赖解析。例如 Java `values.`、Kotlin `items.`、Python 第三方包类型等仍属于
后续语义里程碑。

## 实现结构

1. `autojs6_ace_bridge.js` 把 Ace mode 归一化为语言 id。
2. `StaticIndexCompleter` 保留 JavaScript/TypeScript 原索引，并为四门 M2 语言维护独立、懒加载的 source。
3. `autojs6_local_symbols.js` 按语言屏蔽注释/字符串后执行轻量行级提取，并把 import alias 合并到查询上下文。
4. `autojs6_lsp_client.js` 对四门语言调用静态 completer，但不会创建 TypeScript service；JSON 与 text 仍保持隔离。
5. 首次请求从 `autojs6/indices/<language>.js` 加载对应索引。Android asset 优先走同步本地读取与立即解析，
   不支持该路径的浏览器回退到动态 script element；成功后同一语言不再重复加载。

## 索引基线

索引由 `generate-language-indices.mjs` 中的项目维护规范确定性生成。产物只包含精选 API 名称、
签名事实和项目撰写的说明，不复制上游源码、stub 文件或文档段落。

| 语言 | 固定基线 | 全局 | 模块上下文 | 成员 | 文件字节 | 规范化 UTF-16 估算 |
|---|---|---:|---:|---:|---:|---:|
| Python | Python 3.12；typeshed `d097b16922b98d06980c4be8050b44132da76ba1` | 93 | 34 | 326 | 80,123 | 115,874 B |
| Lua | Lua 5.4.8 | 35 | 11 | 114 | 27,170 | 38,314 B |
| Java | Java 17；Android API 35 | 42 | 22 | 173 | 42,344 | 61,176 B |
| Kotlin | Kotlin 2.2.21 | 76 | 8 | 47 | 22,722 | 33,240 B |

生成与确定性校验：

```powershell
.\gradlew.bat :app:generateAutoJs6LanguageIndices
.\gradlew.bat :app:verifyAutoJs6LanguageIndices
```

`verifyAutoJs6LanguageIndices` 会在临时内存中重新生成四份产物并与提交文件逐字节比较；任何手工漂移、
排序变化或生成器版本变化都会使任务失败。

## 自动验收场景

Node 运行时校验通过以下代表性用例：

| 语言 | 输入上下文 | 必须出现 | 同文件符号 | 隔离反例 |
|---|---|---|---|---|
| Python | `import os as operating` 后 `operating.`；`from pathlib import Path` 后 `Path.` | `getcwd`、`path`、`exists`、`read_text` | `DocumentModel`、`foo_bar`、`local_value`、`count` | 不出现 Java `Math` |
| Lua | `string.` | `format`、`rep` | `foo_bar`、`local_value`、`count` | 不出现 AutoJs6 `files` |
| Java | `Math.`、`System.`、导入后的 `Collections.` | `abs`、`sqrt`、`currentTimeMillis`、`nanoTime`、`sort`、`emptyList` | `Demo`、`computeTotal`、`DEFAULT_COUNT`、`localValue`、`count` | 不出现 Kotlin `listOf` |
| Kotlin | 顶层前缀、`Regex.` | `listOf`、`println`、`escape`、`fromLiteral` | `Demo`、`computeTotal`、`subtotal`、`count` | 不出现 Python `getcwd` |
| JavaScript 回归 | `files.` | 原有 `read` | 不适用 | 泛化后行为保持 |

附加断言覆盖：

- 四个索引初始均未实例化，每种语言首次请求只加载一次；
- 每个静态条目均具有 `name/type/signature/doc`，schema 缺项会失败；
- 本文件函数候选保留 `meta === "local symbol"`；
- 注释和字符串先被等长遮罩，避免把示例文本误识别为声明；
- 默认快速加载路径与 script-element 回退均有运行时/设备覆盖；
- 四语言分发不会创建 TypeScript service，JSON 诊断短路行为不变；
- JavaScript/TypeScript 原补全、hover、signature help 与完整 TS 回归任务保持全绿。

## 真实 WebView 验收

设备用例：

```text
AceLanguageRoutingSmokeTest#m2LanguagesProvideLazyStaticAndCurrentDocumentCompletions
```

它在真实 WebView 中依次切换 Python、Lua、Java、Kotlin 文档，触发索引首次加载，验证标准库候选、
当前文档符号和跨语言反例，并确认四个 index state 最终均为 `ready`。

| 设备/环境 | Android / API | 结果 |
|---|---:|---|
| Sony G8441 | 9 / 28 | 通过 |
| x86 模拟器 | 10 / 29 | 通过 |
| Sony XQ-AT72 | 12 / 31 | 通过 |
| Sony XQ-DQ72 | 13 / 33 | 通过 |
| x86_64 模拟器 | 13 / 33 | 通过 |
| Xiaomi 23046RP50C | 15 / 35 | 通过 |
| x86_64 模拟器 | 16 / 36 | 通过 |

Android 9 在一次多设备并发启动中曾于系统 `ADB-JDWP Connection` 线程的 `libart.so` 内崩溃，
当时测试数为 0、项目代码尚未执行；同一 APK 改为单设备顺序执行及后续重复性能采样后均通过。

## 性能与体积

- 新增打包 assets：192,683 B（188.17 KiB），占 M2 3 MiB 预算 6.13%。
- Node 对四种语言逐项断言：产物与规范化 UTF-16 估算均小于 2 MiB，加载/解析均小于 50 ms。
- 最大 Python 索引在七个 Android/WebView 环境端到端首次补全为 5.7–24.0 ms；候选数均为 14。
- Python 规范化索引的保守 UTF-16 估算为 115,874 B，约占 2 MiB 预算 5.53%。
- 三台原基线真机各 3 次中位数显示，默认 JavaScript editor ready 最多增加 1.1%，session ready
  最多增加 0.03%；索引未进入默认 JavaScript 冷启动路径。

完整逐设备数字、SHA-256 与 M0/M1 对比见 `MILESTONE_BASELINES.md`。

## 验证入口

```powershell
.\gradlew.bat :app:verifyAutoJs6LspRuntime
.\gradlew.bat :app:testDebugUnitTest
.\gradlew.bat :app:compileDebugAndroidTestKotlin
.\gradlew.bat :app:assembleDebug
```

核心自动化文件：

- `tools/ace-lsp/verify-runtime.mjs`
- `app/src/test/.../AceEditorAssetsTest.kt`
- `app/src/test/.../AceLanguageRoutingBridgeTest.kt`
- `app/src/androidTest/.../AceLanguageRoutingSmokeTest.kt`
- `app/src/androidTest/.../AcePerformanceBaselineTest.kt`
- `tools/ace-lsp/measure-editor-performance.ps1`

## DoD 判定

- 四语言标准库索引：通过。
- 当前文档符号补全与来源标记：通过。
- 语言隔离及 TypeScript service 隔离：通过。
- 单语言 <50 ms / <2 MiB：通过。
- 新增 assets <3 MiB：通过。
- JavaScript/TypeScript 行为回归：通过。
- Android 9–16 真实 WebView 路径：通过。

M2 完成，下一阶段可进入 M3 `SemanticProvider` 与通用 LSP 核心设计。
