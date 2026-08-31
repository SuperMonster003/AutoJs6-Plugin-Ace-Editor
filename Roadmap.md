# 多语言智能提示 Roadmap

> 生成日期: 2026-08-31 · 适用范围: AutoJs6 Ace 编辑器插件 · 状态: M0–M7 已完成（持续维护横切任务 X）
>
> 维护约定: 完成一项勾选一项 (`[ ]` → `[x]`)。验证门 (**G** 前缀) 是"先验证后投入"的检查点:
> 未通过时执行该项括号内的降级路径, 并在该项下方追加一行结论记录, 同样视为"已完成决策"。

## 1. 决策记录

| 决策项 | 结论 |
|---|---|
| 交付深度 | 完整愿景: P1 (高亮/关键字) → P2 (轻量本地补全) → P3 (语义服务), 全语言推进, 高风险项设验证门 |
| 目标语言 | Python / Lua / Java / Kotlin (+ 必做的 JS/TS/JSON mode 修正) |
| 语义运行形态 | **仅设备内**: WebView 内嵌 + 设备内伴生进程; 远程/桌面 LSP 明确排除 (见 §13 非目标) |
| 推进方式 | 横向按阶段: 先全语言完成 M1, 再统一 M2; 语义阶段按风险升序逐语言接入 (Python → Lua → Java → Kotlin) |

## 2. 规划前现状基线 (2026-08-31 核查)

- Ace 固定 1.4.12; mode 硬编码为 JavaScript 且全局关闭 worker
  (`autojs6/autojs6_ace_bridge.js:4778-4779`), 超长行安全模式回退 text mode (`:2947`)。
- 已打包的语言资源仅 `mode-javascript.js` / `worker-javascript.js` / `snippets/javascript.js`
  (`app/src/main/assets/editor/ace-builds-1.4.12/src-min-noconflict/`)。
- 智能层现状: 内置 TypeScript 6.0.3 in-process 语言服务 (`autojs6_ts_language_service.js`) +
  AutoJs6 静态索引 completer (`autojs6_completer.js` + `autojs6_indices.js`, 约 385 全局 / 58 模块 / 4.2k 成员 / 9 snippets)。
- Android 侧 `AceLspServerManager` 为 in-process 专用通道, **不是**通用 LSP JSON-RPC 客户端
  (`transport=in-process`, `serverUri=null`)。
- 资产完整性靠显式清单 `AceEditorAssets.requiredAssetPaths` 校验; 新增资产必须登记。
- 语言服务文件类型白名单在 `AceEditorLspPreferences.DEFAULT_FILE_TYPES`, 带迁移机制
  (`FILE_TYPES_REVISION`, 当前 = 3); 扩展默认值必须升 revision。
- 全链路回归任务: `:app:verifyAutoJs6LspRuntime`; 声明生成: `:app:generateAutoJs6LspDeclarations` (Node, 见 `tools/ace-lsp/`)。
- 历史提法 "Roadmap T4" (`tools/ace-lsp/README.md:79`, 指 TS 跨源诊断权威化) 与本文档编号体系无关, 未来可挂入 M3 后的 TS provider 演进。

## 3. 里程碑总览

| 里程碑 | 内容 | 层级 | 风险 | 前置 |
|---|---|---|---|---|
| M0 | JS/TS/JSON 基线修正 + mode 路由框架 + completer 隔离 | 必做 | 低 | — |
| M1 | 四语言高亮/关键字/snippets | P1 | 低 | M0 |
| M2 | 轻量本地补全 (静态索引 + 单文件符号) | P2 | 低中 | M1 |
| M3 | 语义服务框架 (SemanticProvider + 通用 LSP 核心 + 双传输) | P3 前置 | 中 | M2 |
| M4 | Python 语义 (WebView 内嵌, 验证门) | P3 | 中高 | M3 |
| M5 | Lua 语义 (LuaLS 伴生进程, 验证门) | P3 | 中高 | M3 |
| M6 | Java 语义 (ECJ/JDT on ART, 验证门) | P3 | 高 | M3 |
| M7 | Kotlin 语义 (探索性, 验证门) | P3 | 很高 | M3, 建议最后 |
| X | 横切: 体积/性能/降级/设置/文档/测试 | 全程 | — | 随各里程碑 |

---

## 4. M0 · 基线修正 (必做, JS/TS/JSON)

目标: 让"文件类型 → Ace mode → completer 组合"成为唯一路由, 消除 TS/JSON 高亮错配与非 JS 文件的候选污染。

- [x] **M0-1** 在 `autojs6_ace_bridge.js` 建立单一 `resolveAceMode(fileName)` 路由函数, 替换 `:4778` 硬编码;
      利用 Android 侧已有的文档路径通道 (`AceCodeEditor.kt`) 在路径变化时动态 `session.setMode(...)`。
      —— 验收: 打开 `.ts` 文件时 `session.getMode().$id === "ace/mode/typescript"`, 切换文档后 mode 跟随变化。
- [x] **M0-2** 打包 `mode-typescript.js` / `mode-json.js` / `mode-jsx.js` 及 `snippets/typescript.js`、`snippets/json.js`
      (来源见附录 A), 并登记 `AceEditorAssets.requiredAssetPaths`。
      —— 验收: `hasRequired()` 通过; 资产清单单测覆盖新增条目。
- [x] **M0-3** `.tsx` 暂路由至 `ace/mode/typescript` (1.4.12 无独立 tsx mode), 用 TSX 样例验证高亮效果;
      不达标时再评估从新版 Ace 移植 tsx 高亮规则 (记录结论, 单独立项)。
      —— 结论: TS 词法高亮有效，Ace 1.4.12 不产生 JSX tag 专属 token；已记录非阻塞后续 `TSX-HL-1`，
      详见 `tools/ace-lsp/TSX_HIGHLIGHT_EVALUATION.md`。
- [x] **M0-4** JSON 修正: `.json → ace/mode/json`; 保留现有 `JSON.parse` 诊断短路; 是否启用 `worker-json` 依 M0-7 结论。
      —— 验收: JSON 文件不再出现 JavaScript 关键字染色与 JS 关键字候选。
- [x] **M0-5** completer 隔离: 非 JS/TS 族文档禁用 AutoJs6 静态 completer 与 ECMAScript 关键字候选
      (触点: `autojs6_completer.js`, `autojs6_lsp_client.js` 分发层)。
      —— 验收: 在 `.json`/`.py` 文档输入 `files.` 不出现 AutoJs6 API 候选。
- [x] **M0-6** 未识别扩展名防御: TS 语言服务入口拒绝未知扩展名 (不再默认按 JS ScriptKind 处理);
      未知扩展名 Ace 侧路由 `ace/mode/text`。用户在设置中自行添加 `.py` 等类型时也不得误入 TS 服务。
      —— 验收: 构造 `.py` 文档, TS 服务返回"不支持"而非 JS 诊断。
- [x] **M0-7** (spike) WebView 内 Ace worker 可用性验证: 当前全局 `setUseWorker(false)`;
      在目标 WebView 版本矩阵上验证 worker 能否经 assets URL 加载。输出结论文档, 供 M0-4 (json) 与 M1-LUA (lua 诊断) 引用。
      (降级路径: worker 不可用 → 诊断改主线程解析或搁置, 不阻塞主线。)
      —— 结论: Android 9/12/15 三台真机均能创建 worker 并回传注解；M0 的 JSON 仍保留单一 `JSON.parse`
      诊断源，不启用 `worker-json`。矩阵与降级规则见 `tools/ace-lsp/WORKER_FEASIBILITY.md`。
- [x] **M0-8** 回归与测试: `:app:verifyAutoJs6LspRuntime` 保持全绿; 新增 mode 路由与 completer 隔离的
      Kotlin 单测 + JS 侧校验用例 (挂入现有 Node 校验任务)。
      —— 证据: JVM 单测、Node 运行时校验及 Android 9/12/15 真机路由/隔离/worker 冒烟均通过；
      M0 体积与性能基线见 `tools/ace-lsp/MILESTONE_BASELINES.md`。

**M0 完成定义 (DoD)**: JS/TS/JSON 三族"高亮 = 语义"一致; 非 JS/TS 文件零候选污染; 全部既有校验绿。

## 5. M1 · 四语言基础支持 (P1: 高亮 + 关键字 + snippets)

目标: Python/Lua/Java/Kotlin 获得正确高亮、注释/括号行为、关键字与 snippet 补全。全离线, 无新运行时。

通用项:

- [x] **M1-0a** 从 ace-builds v1.4.12 官方 tag 提取所需 `mode-*.js` / `snippets/*.js` (附录 A),
      逐一登记 `requiredAssetPaths`, 更新 `THIRD_PARTY_NOTICES.md` (BSD 许可, 与现有 Ace 条目合并)。
- [x] **M1-0b** 路由表扩展: `.py→python`、`.lua→lua`、`.java→java`、`.kt/.kts→kotlin`; 其余未支持扩展名 `→text`。
- [x] **M1-0c** 每语言仅启用: 本语言 mode 关键字候选 + snippets + 文档单词; 复核 M0-5 隔离对四语言同样生效。
- [x] **M1-0d** 高亮验收样例库: 每语言一份覆盖注释/字符串/数字/关键字/典型语法的样例文件, 人工核验清单或快照比对。
      —— 证据: 真实样例资产、token 类别断言、候选隔离和 Android 9/12/13/15 设备矩阵见
      `tools/ace-lsp/M1_LANGUAGE_ACCEPTANCE.md`。

分语言项:

- [x] **M1-PY-1** Python: mode + snippets 入包路由生效。—— 验收: `def`/`class`/`import` 高亮正确, 输入 `de` 出现 `def` 候选。
- [x] **M1-PY-2** Python snippets 审校补充 (def/class/for/try/with/main-guard 等, 目标 ≥10 个)。
      —— 结论: 采用 Python 3 语法自研 18 个 trigger，拒绝上游残留的 Python 2 `except Exception, e`。
- [x] **M1-LUA-1** Lua: mode + snippets 入包路由生效。—— 验收: `local function` 高亮正确, 关键字候选可用。
- [x] **M1-LUA-2** Lua 语法诊断: 若 M0-7 判定 worker 可用, 启用 `worker-lua` (luaparse) 获得免费语法错误标注;
      不可用则主线程 luaparse 降级或记录搁置。—— 验收: 故意语法错误出现标注 (或已记录搁置结论)。
      —— 结论: 仅 Lua mode 启用 worker；语法 annotation 与离开 Lua 后停止均在四个 Android 环境通过。
- [x] **M1-JAVA-1** Java: mode + snippets 入包路由生效。—— 验收: 注解/泛型/字符串高亮正确, `pub` 出现 `public` 候选。
- [x] **M1-KT-1** Kotlin: mode 入包路由生效 (`.kt` 与 `.kts` 均验证)。
      —— 结论: 对 Ace 1.4.12 官方 Kotlin mode 做三处可审计兼容补丁，修复声明关键字 token、
      关键字候选空列表及缺失 snippet 绑定；设备断言覆盖 `class`、`fun` 和 `companion`。
- [x] **M1-KT-2** Kotlin snippets 自研 (上游基本为空): fun/val-var/data class/when/object/companion 等, 目标 ≥10 个。
      —— 结论: 自研 15 个 trigger，Node 校验固定数量下限与代表性 trigger。
- [x] **M1-DOC** README 增加"语言支持矩阵" (高亮/关键字/snippets/语义 四列), 本里程碑发布说明。
      —— 结论: 10 种本地化 README 与 v1.1.18 CHANGELOG 源/生成文件同步更新，明确 P1 与完整语义的边界。

**M1 完成定义 (DoD)**: 四语言样例文件高亮验收通过; 每语言关键字 + snippet 候选可用且无跨语言污染; 资产校验与既有回归全绿。

—— **完成结论**: DoD 通过。新增 assets 为 114,021 字节（111.35 KiB，占 1 MiB 预算 10.87%）；
三台基线真机启动中位数相对 M0 变化约在 1.5% 内或更快；JVM、Node、APK 构建及
Android 9/12/13/15 完整回归全绿。体积/性能数据见 `tools/ace-lsp/MILESTONE_BASELINES.md`。

## 6. M2 · 轻量本地补全 (P2: 静态索引 + 单文件符号)

目标: 在不引入语义引擎的前提下, 让四语言获得"标准库成员 + 本文件符号"级补全。全离线、启动快、老 WebView 可用。

框架项:

- [x] **M2-1** 静态索引框架泛化: 把 `autojs6_completer.js` 的索引消费逻辑抽为语言无关的
      `StaticIndexCompleter` (索引 schema: globals / modules / members / signature / doc / type);
      AutoJs6 索引退化为"JS 语言的一个索引实例", 行为零变化。
      —— 验收: JS 文档补全行为与现状逐项一致 (`:app:verifyAutoJs6LspRuntime` 全绿)。
- [x] **M2-2** 单文件符号提取框架: 定义 per-language 轻量提取器接口 (正则/行级 tokenizer, 非完整 AST),
      提取 import、函数/类/方法定义、参数名、顶层与局部变量; 候选标注来源 (如 "local symbol")。
- [x] **M2-3** 索引生成工具链: `tools/` 下新增生成脚本 (与 `tools/ace-lsp` 同风格, 版本与来源固定, 产物提交入库):
      Python ← typeshed (builtins + 精选 stdlib ~30 模块); Lua ← 5.4 手册 stdlib;
      Java ← java.lang/java.util/java.io + 精选 android.* 常用类; Kotlin ← kotlin.* / kotlin.collections / kotlin.text。
      —— 验收: 脚本可重复生成且 diff 稳定; 来源版本与再生成命令记录在脚本头与附录 A。
      —— 结论: `generate-language-indices.mjs` 固定 Python 3.12/typeshed commit、Lua 5.4.8、
      Java 17/Android API 35 与 Kotlin 2.2.21；Gradle `verifyAutoJs6LanguageIndices` 逐字节检查提交产物。

分语言接入 (每项验收 = 触发场景可复现 + 无跨语言污染):

- [x] **M2-PY** Python 接入。—— 验收: `os.` 出现 `path`/`getcwd` 等成员; 本文件 `def foo_bar()` 后输入 `foo` 出现候选。
- [x] **M2-LUA** Lua 接入。—— 验收: `string.` 出现 `rep`/`format` 等成员; `local` 变量名进入候选。
- [x] **M2-JAVA** Java 接入。—— 验收: `Math.`/`System.` 出现静态成员; 本文件方法名进入候选。
      (注: 不做变量类型推导, `values.` 这类成员补全属 M6 语义层。)
- [x] **M2-KT** Kotlin 接入。—— 验收: `listOf`/`println` 等顶层函数候选; 本文件 `fun`/`val` 符号进入候选。

质量项:

- [x] **M2-4** 性能预算: 索引按语言懒加载; 单语言索引加载 <50ms、内存增量 <2MB (指标性, 实测记录);
      编辑器冷启动耗时无回归 (对比 X-2 基线)。
- [x] **M2-5** 测试: 各语言"前缀 → 期望候选"表驱动用例, 挂入 Node 校验任务; 隔离用例 (Python 文档无 Java 候选)。

**M2 完成定义 (DoD)**: 四语言均有标准库索引 + 本文件符号补全; 性能预算达标; JS/TS 现有行为零回归。

—— **完成结论**: DoD 通过。新增索引与单文件提取器共 192,683 字节（188.17 KiB，占 3 MiB
预算 6.13%）；最大 Python 索引在 Android 9/10/12/13/15/16 七个环境首次加载为 5.7–24.0 ms，
序列化 UTF-16 估算约 0.12 MiB。四语言补全、单文件符号、语言隔离及 JavaScript 回归均通过
Node 与真实 WebView 验证；完整证据见 `tools/ace-lsp/M2_COMPLETION_ACCEPTANCE.md` 和
`tools/ace-lsp/MILESTONE_BASELINES.md`。

## 7. M3 · 语义服务框架 (P3 前置, 一次性基建)

目标: 把"TypeScript 专用架构"重构为可插拔多语言语义框架, 为 M4~M7 提供统一接入面。本里程碑自身不新增语言能力。

- [x] **M3-1** 定义 `SemanticProvider` 抽象与能力标志:
      completion / hover / signatureHelp / diagnostics / definition / rename / codeActions / dispose;
      UI 按能力标志优雅降级 (无该能力 → 隐藏入口, 不报错)。
- [x] **M3-2** 现有 TS 服务迁移为 `TypeScriptInProcessProvider`, 行为零变化。
      —— 验收: `:app:verifyAutoJs6LspRuntime` 全绿; 补全/hover/诊断快照无 diff。
- [x] **M3-3** 路由与降级链固化: 语义 provider → 静态索引 (M2) → 文档单词;
      provider 异常/超时自动降级并上报健康状态 (复用 `AceRuntimeHealthMonitor` / `AceFallbackPolicy`)。
      —— 验收: 人为杀死 provider 后补全仍可用 (降级为 M2 层), 且健康面板有记录。
- [x] **M3-4** 通用 LSP 客户端核心 (协议层, 与传输无关):
      initialize/initialized/shutdown, didOpen/didChange/didClose (含增量同步与文档版本号),
      completion (+resolve)/hover/signatureHelp/definition/publishDiagnostics/rename/codeAction/$cancelRequest;
      过期响应丢弃、请求取消、snippet 格式转换、workspace edit 应用、URI 安全校验。
      —— 验收: 协议层单测 (mock server) 覆盖上述消息与乱序/取消场景。
- [x] **M3-5** 双传输实现:
      (a) WebWorker/postMessage 传输 (WebView 内嵌形态, 供 M4);
      (b) 伴生进程 stdio 传输 (Kotlin `ProcessBuilder` ↔ `AceBridge` 消息通道, 供 M5/M6), 含启动握手、崩溃检测、退避重启、空闲退出。
      —— 验收: 各传输用 echo/mock server 通过同一套协议层测试。
- [x] **M3-6** 文件类型接入机制: 新语言启用语义时扩展 `DEFAULT_FILE_TYPES` 并升级 `FILE_TYPES_REVISION` (2→3);
      老用户自定义值迁移逻辑单测 (沿用现有 revision 迁移模式)。
- [x] **M3-7** 设置项: 每语言独立"语义服务"开关 (默认关, 随对应里程碑发布转默认开), 与全局 LSP 开关兼容。
      —— 兼容说明: TypeScript 保持历史默认开启；Python/Lua/Java/Kotlin 默认关闭，待各自语义里程碑通过后再转默认开启。
- [x] **M3-8** 命名清理 (可选): `AceLspServerManager` 等"Lsp"命名与真实职责对齐或加注释说明, 避免后续误解。
      —— 结论: 保留公共历史类名，明确注释其职责为 provider 配置/snapshot；通用 JSON-RPC 客户端独立为浏览器 LSP core。

**M3 完成定义 (DoD)**: TS 走新框架零回归; 协议层 + 双传输经 mock 验证; 降级链有测试保障。此后接入一门新语言 = "实现一个 provider + 提供运行时"。

—— **完成结论**: DoD 通过。固定八能力 Provider 契约、TypeScript 适配、通用协议核心、
WebWorker/stdio 双传输、进程 allowlist、安全 workspace edit、健康状态与 revision 3 设置迁移均已完成；
Node/JVM/完整 APK 构建全绿，Android 9–16 七个环境共 42 个完整语言套件用例通过。
详细证据见 `tools/ace-lsp/M3_SEMANTIC_FRAMEWORK_ACCEPTANCE.md` 和
`tools/ace-lsp/MILESTONE_BASELINES.md`。

## 8. M4 · Python 语义 (WebView 内嵌)

- [x] **G4-0** (验证门, 建议 ≤2 周) WebView 内 Python 分析器选型 spike, 两候选并行验证:
      A. pyright/basedpyright 浏览器/worker 构建 (TS 编写, 理论可脱离 Node 运行);
      B. Pyodide (CPython WASM) + jedi。
      通过标准 (目标 minSDK 真机): 初始化 <10s、常驻内存 <300MB、补全 P50 <500ms、可随编辑器销毁释放。
      (降级路径: 双候选均不达标 → Python 停留 P2+, 关闭 M4 其余项并记录结论。)
- [x] **M4-1** typeshed 裁剪打包: 选定 Python 版本基线 (建议 3.12), stdlib 子集与 builtins 存根入包;
      裁剪脚本入 `tools/` (来源版本固定)。
- [x] **M4-2** `PythonProvider` 接入 M3 框架 (经 WebWorker 传输或直接 API):
      completion / hover / signatureHelp / diagnostics / definition (本文件 + stdlib 存根)。
- [x] **M4-3** 体积策略: 语义资源 >8MB 时改为可选下载组件
      (复用字体下载 / `AceOptionalWebResourceRoute` 先例: 校验哈希、断点重试、缺失时自动降级 P2)。
- [x] **M4-4** 验收清单: `pathlib.Path("a").` 出现 `exists`/`read_text` 等成员; `def` 参数 hover 正确;
      未定义名与语法错误有诊断; 老 WebView / 未下载组件时静默降级 P2 且无报错弹窗。
- [x] **M4-5** 回归任务: 新增或扩展 verify 任务覆盖 Python 语义链路 (命名跟随 `verifyAutoJs6LspRuntime` 约定)。

**范围声明**: 首版仅内置 + 标准库; venv / site-packages / 第三方包解析不在本期 (见 §13)。

—— **完成结论**: 选择 Pyright 1.1.413 WebWorker；Pyodide 0.29.4 + Jedi 0.19.2 spike
因首次补全 2.5 秒且仅有语法诊断未入选。裁剪的 Python 3.12 typeshed 共 271 个文件，
语义资产 4.822 MiB，低于 8 MiB 可选交付阈值。Android 9/12/13/15/16 六个支持环境的
初始化为 176–1,321 ms、补全 P50 为 2.0–22.7 ms、Python 净增 PSS 最大 83.20 MiB；
Android 10 / WebView 74 在创建 Worker 前静默降级 P2。五项能力、销毁释放、缺失组件、
ES2022 不兼容和 42/42 既有路由回归均通过。详见
`tools/ace-lsp/M4_PYTHON_SEMANTIC_ACCEPTANCE.md` 与 `MILESTONE_BASELINES.md`。

## 9. M5 · Lua 语义 (LuaLS 伴生进程)

- [x] **G5-0** (验证门) LuaLS NDK 交叉编译 spike (arm64-v8a 优先): 真机启动、initialize 握手、单文件 completion 跑通。
      (降级路径: 编译或运行不可行 → Lua 停留 P2+ (保留 M1-LUA-2 语法诊断), 关闭 M5 其余项。)
- [x] **M5-1** 构建流水线: `tools/` 下 LuaLS 构建脚本, 版本 tag 固定、产物哈希校验、CI 可重复;
      许可证审查并更新 `THIRD_PARTY_NOTICES.md` (MIT)。
- [x] **M5-2** 打包与执行: 按 ABI 分发 (arm64-v8a / armeabi-v7a / x86_64), 以 jniLibs 方式打包并从
      `nativeLibraryDir` 执行 (满足 API 29+ W^X 限制); 评估 ABI splits 控制体积。
- [x] **M5-3** 进程生命周期接入 M3-5b: 启动超时、崩溃退避重启、空闲自动退出、编辑器销毁时清理; 健康状态上报。
- [x] **M5-4** workspace 映射与安全: 编辑器虚拟 URI ↔ 设备真实路径的白名单映射, 语言服务器仅可见当前工程目录。
- [x] **M5-5** `LuaProvider` 接入与验收: `string.` 成员补全与 hover; 未定义变量诊断; `---@type` 注解生效;
      进程被杀后补全自动降级 P2 并可恢复。
- [x] **M5-6** 回归任务: Lua 语义链路 verify 用例 (可在 CI 以 x86_64 模拟器跑通)。

—— **完成结论**: LuaLS 3.18.2 已使用固定 NDK r29/API 28 流水线为 arm64-v8a、
armeabi-v7a 与 x86_64 可重复构建并逐字节锁定；Android 9–16 六个受支持环境的初始化
为 191–1,295 ms、补全 P50 为 3.5–97.7 ms。补全、hover、签名帮助、诊断、定义跳转、
`---@type`、崩溃降级/重启和销毁释放均通过。Android 10 x86 以仅安装兼容 ELF 验证
静默 P2 回退；七环境既有路由回归 42/42 通过。完整证据见
`tools/ace-lsp/M5_LUA_SEMANTIC_ACCEPTANCE.md` 与 `MILESTONE_BASELINES.md`。

## 10. M6 · Java 语义 (ECJ/JDT on ART, 设备内)

> 排除远程形态后, 设备内候选为 dex 化 Eclipse 编译器 (ECJ) 与 JDT 补全引擎 (社区已有 Android IDE 先例, 但内存与稳定性风险高), 故拆两道门。

- [x] **G6-0** (验证门) dex 化 ECJ batch 编译器在 ART 上编译单文件并输出诊断的 spike。
      (降级路径: 不可行 → Java 停留 P2+, 关闭 M6 其余项。)
      —— 结论: **通过**。固定 ECJ 3.26.0；较新版本分别受 Java 17 与 Java 11 运行时 API
      限制。API 29/33/36/37 的 ART 均可解析打包类路径并产生缺分号/未定义符号诊断。
- [x] **M6-1** ECJ 诊断接入: 独立进程或受限线程运行, 内存上限与节流 (停止输入 N ms 后编译);
      诊断映射到编辑器标注。—— 验收: 缺分号 / 未定义符号有正确行列标注。
      —— 结论: 使用单后台线程、450 ms 编辑器 debounce、250 ms 原生最小间隔、524,288 字符
      文档上限、48 MiB 可用堆预检和 64 MiB 单次增长熔断；诊断直接按 ECJ offset 映射。
- [x] **M6-2** 类路径打包: `android.jar` 精简 stub + Java 核心 stub 入包 (体积预算, 超限走可选下载, 同 M4-3 机制)。
      —— 结论: API 36 的 5,651 个类签名打成 5,066,010 字节确定性 JAR；连同 ECJ
      构件共 8,216,697 字节，占 8 MiB 门限 97.95%，因此完全离线随包交付。
- [x] **G6-3** (验证门) JDT 补全引擎 (codeassist) 在 ART 的可行性与内存表现。
      (降级路径: 不可行 → Java 保持"仅诊断 + P2+ 增强索引", 记录结论。)
      —— 结论: **未通过，执行降级路径**。固定依赖图为 18 个构件/14,859,587 字节，
      D8 产物 11,409,632 字节；API 29/33/36 可加载 `CompletionEngine`，但桌面与 ART 均在
      `ResourcesPlugin.getWorkspace()` 因没有 Eclipse Workspace/OSGi 服务而停止，零补全候选。
- [x] **M6-4（按 G6-3 关闭）** `JavaProvider` 补全接入 (依 G6-3): 局部变量成员补全 (如 `new ArrayList<>()` 后 `values.` 出成员)、
      import 建议。—— 验收: 上述场景真机可复现, 低端机降级策略生效。
      —— 结论: 不引入无法完成初始化的 JDT 运行时；Java 保留 M2 静态索引、当前文档符号与
      文档词补全，M6 Provider 只声明 diagnostics/dispose 能力。

**范围声明**: 首版仅单文件 + 打包 stub 类路径; Gradle/Maven 项目模型、多模块、注解处理器不在本期 (见 §13)。

—— **完成结论**: M6 按验证门完成。Java 单文件 ECJ 诊断默认开启，资源损坏、文档/内存
超限或运行异常时静默保留 P2；API 29/33/36/37 的诊断、生命周期和既有路由回归全部通过。
JDT CodeAssist 因设备内缺少 Eclipse Workspace/OSGi 服务被明确否决，未进入产品 APK。
完整证据见 `tools/ace-lsp/M6_JAVA_SEMANTIC_ACCEPTANCE.md` 与 `MILESTONE_BASELINES.md`。

## 11. M7 · Kotlin 语义 (探索性, 建议最后启动)

> 前置声明: 排除远程形态后, 设备内 Kotlin 语义 (dex 化 kotlinc / Analysis API) 属业界难题,
> 官方 Kotlin LSP 基于 IntelliJ 且需 JVM, 无法直接上设备。本里程碑定位为**探索性**, 允许整体不通过。

- [x] **G7-0** (验证门) 调研 + spike: kotlinc 前端/Analysis API dex 化的可行性与内存/速度实测
      (参考社区 Android IDE 先例); 产出明确的可行性结论文档。
      (降级路径: 不可行 → 执行 M7-3, 关闭 M7-1/2。)
- [x] **M7-1** (依 G7-0) 诊断优先接入: 语法与基础解析错误标注。
      —— 关闭结论: G7-0 未通过，未创建或启用 Kotlin SemanticProvider，不宣称 diagnostics 能力。
- [x] **M7-2** (依 G7-0) 补全接入: 本文件符号 + stdlib 成员的语义补全。
      —— 关闭结论: G7-0 未通过，不以静态索引/类型启发伪装 semantic completion。
- [x] **M7-3** (G7-0 未过时执行) Kotlin P2+ 增强: 扩充 kotlin.*/android 常用 API 索引、单文件符号与简单类型启发、
      复用 Java 索引做互操作提示; 在本文档记录结论与未来重启条件 (如官方轻量 LSP 出现、或远程形态解禁)。

—— **完成结论**: Kotlin compiler 2.2.21 固定图为 63,667,169 字节，R8/D8 8.10.21 min API 24
产出六 DEX、合计 61,119,176 字节；API 31/35 均在首次合法单文件产生 exit code 前因 Kotlin
反射运行时假设失败，且失败前 PSS 增量最高 78,343 KiB。G7-0 因体积、ART 功能、内存和
最低 API 兼容四项独立条件未通过。降级交付的 Kotlin P2+ 为 95 globals / 44 modules /
492 members / 122,977 字节，支持显式类型、常用初始化器/构造器/字面量、safe-call 和精选
Java/Android 互操作；API 28/31/35 真机均通过 WebView 冒烟。完整证据与重启条件见
`tools/ace-lsp/M7_KOTLIN_ACCEPTANCE.md` 与 `MILESTONE_BASELINES.md`。

## 12. X · 横切任务 (随各里程碑推进)

- [x] **X-1** 体积看板: 每次合入记录 assets 增量; 预算指标 — M1 ≤1MB、M2 ≤3MB、语义组件按语言单列, 超预算必须走可选下载。
      —— M0 已建立并在 M1/M2 追加 `tools/ace-lsp/MILESTONE_BASELINES.md`；M1 为 111.35 KiB，
      M2 为 188.17 KiB；M4 Python 语义为 4.822 MiB，M5 Lua 语义为 7.900 MiB，M6 Java
      诊断为 7.836 MiB，均低于单语言 8 MiB 可选交付门；M7 拒绝 60.718 MiB compiler 图，
      只交付约 0.130 MiB 的 Kotlin P2+ asset 增量。
- [x] **X-2** 性能基线: 冷启动 / 首帧 / 补全首包延迟的基准脚本, M0 时建立基线, 每里程碑回归对比。
      —— `tools/ace-lsp/measure-editor-performance.ps1` 已支持 M0/M1/M2 同口径记录；M2 三台基线真机
      冷启动无可测回归，七环境最大静态索引首次加载均低于 50 ms；M4 增加宿主 + renderer
      PSS 探针，Python 初始化、补全和净增内存在所有支持环境通过门限；M5 六个受支持
      环境的 LuaLS 初始化均低于 1.3 秒，稳态补全 P50 均低于 100 ms。
- [x] **X-3** 降级矩阵: 老 WebView / 低端机 / 组件缺失三维度的行为矩阵文档 + 自动化用例 (复用 health/fallback 设施)。
      —— M4 记录 Android 9 最低 SDK、Android 10 / WebView 74 ES2022 不兼容及缺失 Worker
      三类路径；运行时门控和 Node/真实 WebView 用例均验证静默回到 P2 且无 UI 错误。
      —— M5 增加不支持 x86 ABI、缺失/损坏原生库、伴生进程崩溃三类路径；完整哈希门控、
      静态 P2 回退、退避重启与释放均有 Node/JVM/真实设备证据。
- [x] **X-4** 设置 UI: 语言支持矩阵展示; 每语言语义开关 (M3-7); 文件类型自定义与语义白名单的关系说明。
      —— AutoJs6 代码编辑器设置现直接展示 9-mode 产品能力矩阵; TypeScript/JavaScript、Python、
      Lua 与 Java 提供独立语义开关, Kotlin 以 P2+ / 无 Provider 状态保持可见。全局 LSP、
      文件类型白名单、语言识别、Provider 可用性与逐语言开关按固定顺序门控; 自定义后缀只允许
      文件进入 LSP 路径, 不会重分类语言。宿主与插件单测、runtime verifier、10 种本地化资源及
      Android 9/12/13/15 真机验收均完成, 详见 `tools/ace-lsp/X4_SETTINGS_ACCEPTANCE.md`。
- [x] **X-5** 文档: README 支持矩阵随里程碑更新; `tools/` 各生成/构建脚本 README; CHANGELOG 条目。
      —— M2 进度: 10 种本地化 README/CHANGELOG、生成命令、支持边界与验收记录已同步；后续里程碑继续维护。
      —— M4 进度: 10 种本地化支持矩阵、Pyright 构建/校验命令、默认启用与老 WebView 降级、
      CHANGELOG 和独立验收文档已同步。
      —— M5 进度: 10 种本地化支持矩阵、LuaLS 构建/校验命令、ABI/降级边界、许可证、
      CHANGELOG 和独立验收文档已同步。
      —— M6/M7 进度: README 矩阵已区分 Java 单文件诊断与 Kotlin P2+，ECJ/JDT/kotlinc
      验证门、拒绝结论、构建脚本、产物哈希与重启条件均写入独立验收文档和基线。
      —— X-4 收尾: 10 种本地化 README/CHANGELOG 已同步设置矩阵、逐语言开关、Kotlin
      不可用边界，以及文件类型白名单不会触发语言重分类的说明。
- [x] **X-6** 测试约定: 每里程碑 DoD 必含"新增单测 + verify 任务扩展 + 既有回归全绿", 不满足不勾选。
      —— M0 已按此约定落地；M4 新增 Worker verifier、JVM/Android 用例与七环境完整回归，
      本条继续作为后续里程碑合入门。

## 13. 非目标 (本期明确不做)

- 远程/桌面 LSP 接入 (决策排除; 若未来解禁, 是 Java/Kotlin 完整语义的首选替代路线, M6/M7 结论文档需引用本条)。
- Python venv / site-packages / 第三方包类型解析 (首版仅内置 + 标准库)。
- Java Gradle/Maven 项目模型、多模块依赖、注解处理器。
- Kotlin K2 完整分析、协程调试级语义、Java/Kotlin 混合工程模型。
- Ace 大版本升级 (维持 1.4.12; 如 M0-3 tsx 结论要求, 单独立项评估)。
- JSON Schema 级校验与补全 (现有语法诊断保持)。

## 14. 风险与缓解

| 风险 | 影响 | 缓解 |
|---|---|---|
| WebView 内 worker/WASM 受限 (机型差异) | M0-4/M1-LUA-2/M4 受阻 | M0-7 提前探明; 主线程降级路径; 降级矩阵 X-3 |
| APK 体积膨胀 (typeshed/stub/二进制) | 商店包与用户流量 | X-1 预算硬约束; 可选下载组件 (M4-3 机制, 复用字体下载先例) |
| 低端机内存 (语义引擎常驻) | OOM/卡顿 | 懒加载 + 进程隔离 + 每语言开关 + 空闲退出 (M5-3) |
| LuaLS/ECJ 构建链长期维护 | 升级断供 | 版本 tag + 哈希校验 + CI 脚本化 (M5-1) |
| ART 上 JDT/kotlinc 不确定性 | M6/M7 失败 | 验证门前置, 降级路径显式写入条目, 失败不影响已交付层 |
| 静态索引随语言版本陈旧 | 候选过时 | M2-3 生成脚本化, 来源版本固定, 再生成命令入文档 |
| 非 JS 扩展名误入 TS 服务 (现存缺陷) | 错误诊断/候选 | M0-6 防御, 最高优先修复 |

## 15. 附录

### A. 资源来源与许可

| 资源 | 来源/版本 | 用途 | 许可 |
|---|---|---|---|
| mode-*/snippets/worker-lua/worker-json | ace-builds v1.4.12 官方 tag, `src-min-noconflict/` | M0/M1 | BSD-3 (合并入现有 Ace 条目) |
| typeshed | commit `d097b16922b98d06980c4be8050b44132da76ba1` | M2 Python 3.12 API 事实索引 | Apache-2.0 |
| Pyright | 1.1.413 / commit `789d8275fef25f347ffef7b847305fefd8a3e363` | M4 Python type server Worker | MIT |
| typeshed 完整存根子集 | commit `289e5d3568961c8bcd33d01eef5b7ec5e1ad33ad`，271 文件 | M4 Python 3.12 语义存根 | Apache-2.0 |
| LuaLS (lua-language-server) | 固定 release tag (G5-0 时钉住) | M5 | MIT |
| ECJ (org.eclipse.jdt:ecj) | 3.26.0 | M6 单文件诊断 | EPL-2.0 |
| Android API 36 class stubs | SDK `platforms;android-36/android.jar` 的类签名子集 | M6 编译类路径 | AOSP/OpenJDK 对应许可，见随包 notices |
| Lua 5.4 手册 / JDK 文档 / Kotlin stdlib | 生成脚本内注明 | M2 索引 | 按各自条款仅提取签名事实 |

新增任何三方资源 → 同步更新 `THIRD_PARTY_NOTICES.md`, 属对应条目验收的一部分。

### B. 常用验证命令

```powershell
# TS 语义全链路回归 (每个里程碑 DoD 必跑)
.\gradlew.bat :app:verifyAutoJs6LspRuntime

# AutoJs6 声明生成 (改动 types/ 后)
.\gradlew.bat :app:generateAutoJs6LspDeclarations

# M2 四语言静态索引生成 / 确定性校验
.\gradlew.bat :app:generateAutoJs6LanguageIndices
.\gradlew.bat :app:verifyAutoJs6LanguageIndices

# M7 Kotlin P2+ 类型启发 / safe-call / Java-Android 索引复用
.\gradlew.bat :app:verifyAutoJs6KotlinP2Plus

# M4 Python Worker 显式生成 / 提交资产验证
.\gradlew.bat :app:generateAutoJs6PythonWorker
.\gradlew.bat :app:verifyAutoJs6PythonWorker

# M4 宿主 + WebView renderer PSS 基线差分
.\tools\ace-lsp\measure-python-semantic.ps1 -Serial <adb-serial> -HoldMs 15000 -SkipBuild
```

新增 verify 任务命名跟随现有约定 (`verifyAutoJs6*`), 并在本节登记。

### C. 关键文件索引

| 文件 | 职责 |
|---|---|
| `app/src/main/assets/editor/ace-builds-1.4.12/autojs6/autojs6_ace_bridge.js` | Ace 初始化、mode 设置 (M0-1 主战场) |
| `.../autojs6/autojs6_completer.js` + `autojs6_indices.js` | 静态索引 completer (M0-5/M2-1) |
| `.../autojs6/autojs6_local_symbols.js` | Python/Lua/Java/Kotlin 单文件符号提取器 (M2-2) |
| `.../autojs6/indices/*.js` | 按语言懒加载的确定性标准库索引产物 (M2-3) |
| `.../autojs6/autojs6_lsp_client.js` | 补全/诊断分发与回退链 (M0-5/M3-3) |
| `.../autojs6/autojs6_ts_language_service.js` | TS 语言服务 host (M0-6/M3-2) |
| `.../autojs6/autojs6_python_provider.js` | M4 Pyright Provider、ES2022 门控、生命周期与 P2 降级 |
| `.../autojs6/python/*` | 固定 Worker、typeshed 内容清单及合并许可证 |
| `app/src/main/java/.../ace/editor/core/AceEditorAssets.kt` | 资产完整性清单 (每次加资产必改) |
| `app/src/main/java/.../ace/editor/core/AceEditorLspPreferences.kt` | 文件类型白名单与 revision 迁移 (M3-6) |
| `app/src/main/java/.../ace/editor/core/lsp/AceLspServerManager.kt` | 语言服务配置快照 (M3 重构对象) |
| `app/src/main/java/.../ace/editor/core/AceCodeEditor.kt` | 文档路径通道入口 (M0-1) |
| `tools/ace-lsp/generate-language-indices.mjs` | M2 索引生成与 `--check` 校验入口 |
| `tools/ace-lsp/build-python-worker.mjs` / `verify-python-worker.mjs` | M4 确定性生成、版本/哈希/能力/降级/释放门 |
| `tools/ace-lsp/measure-python-semantic.ps1` | M4 P2/Pyright 宿主 + renderer PSS 差分探针 |
| `tools/ace-lsp/kotlin-compiler-spike/` | M7 G7-0 compiler graph、桌面编译、固定 D8 与 ART 注入探针 |
| `tools/ace-lsp/verify-kotlin-p2plus.mjs` | M7 P2+ 类型启发、safe-call、索引复用与预算门 |
| `tools/ace-lsp/` | Node 生成/校验工具链与里程碑验收记录 |
