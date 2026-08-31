# M4 Python 设备内语义验收

日期：2026-08-31  
范围：Python 3.12 标准库语义、Pyright WebWorker、M3 Provider/LSP 接入、P2 降级、
确定性生成与许可证、Android 9–16 功能/性能/内存/生命周期回归

## 结论

M4 验证门通过，选择固定版本的 Pyright 浏览器 Worker，不采用 Pyodide + Jedi。
Python 语义开关从本里程碑起默认开启；运行环境不支持已打包 Worker 的 ES2022 语法、
Worker 缺失或初始化失败时，编辑器会静默回到 M2 本地索引，不弹错误提示。

已交付五项语义能力：

- 类型感知补全；
- hover；
- signature help；
- 未定义名称与语法诊断；
- 当前文件和已打包标准库存根的 definition。

首版范围仍是单文件、builtins 与裁剪后的标准库。venv、site-packages、第三方包解析、
rename 和 code actions 不在 M4 范围。

## G4-0 双候选验证

两套 spike 使用同一个 `pathlib.Path` 补全场景，并分别记录初始化、首次补全、稳态补全、
诊断能力与进程 RSS。候选数据用于选型，最终门限仍以真实 Android/WebView 结果为准。

| 指标 | A：Pyright Worker | B：Pyodide + Jedi |
|---|---:|---:|
| 固定版本 | Pyright 1.1.413 | Pyodide 0.29.4 / Python 3.13.2 / Jedi 0.19.2 / Parso 0.8.4 |
| 初始化 | 56.19 ms | Pyodide 2,140.73 ms；Jedi ready 2,621.79 ms |
| 首次补全 | 39.69 ms（open + analyze 283.87 ms） | 2,516.89 ms |
| 稳态补全 P50 | 1.40 ms | 24.34 ms |
| `Path` 候选 | 105 | 127 |
| 未定义名称诊断 | 支持 | 不支持，仅有语法诊断 |
| hover / signature / definition | 支持 | spike 未形成等价完整链路 |
| Node 进程 RSS | 139,993,088 B | 161,693,696 B |

Pyright 的公开 npm 包本身面向 Node；本项目没有在 WebView 中伪装 Node 进程，而是以
Pyright 的浏览器化边界为依据，将 type server、LSP 适配、内存文件系统、`buffer` 与
`path-browserify` polyfill 编入专用 Worker。上游依据包括
[Pyright 仓库](https://github.com/microsoft/pyright)、
[内部结构说明](https://github.com/microsoft/pyright/blob/main/docs/internals.md)、
[type server 说明](https://github.com/microsoft/pyright/blob/main/docs/type-server.md)，以及
[micro:bit 的 browser 分支](https://github.com/microbit-foundation/pyright/tree/browser)。

Pyodide 的下载/部署模型和 WASM 运行时本身可在浏览器中工作，但 Jedi 方案需要同时装载
CPython/WASM 与 Python 包，首次请求明显更慢，而且本 spike 只能提供语法诊断。原型保留为
`probe-pyodide-jedi.mjs`，便于将来在 Pyright 浏览器路径失去维护时重新比较。

## 运行结构与固定版本

```text
Ace UI / autojs6_lsp_client
  → PythonProvider（M3 SemanticProvider）
  → 通用 JSON-RPC/LSP core
  → WebWorker postMessage transport
  → Pyright type server + 内存文件系统
  → Python 3.12 builtins / 裁剪 typeshed stdlib
```

- Pyright：`1.1.413`，commit
  `789d8275fef25f347ffef7b847305fefd8a3e363`；
- typeshed：commit `289e5d3568961c8bcd33d01eef5b7ec5e1ad33ad`；
- Python 语义版本：`3.12`；
- 存根范围：M2 精选标准库根模块及其顶层 import 闭包，不含 third-party stubs；
- 实际打包：271 个 `.pyi`/相关 typeshed 文件，内容哈希
  `445a9fe6ef3f17fd847bf286dd432f61da300abbd9f5d850559da3c013106074`；
- Worker 输出目标：ES2022；清单锁定 public class fields、optional chaining、
  nullish coalescing 三项运行时门槛。

Provider 在首次 Python 文档需要语义时才创建 Worker。`pagehide`、编辑器销毁或 Provider
替换会依次关闭 LSP client、解除事件订阅并 `terminate()` Worker；生命周期计数器用于 Node
和 Android 验收，正常路径结束后必须是 `activeProviderCount = 0`。

## 资产、体积与许可证

| 资产 | 字节 | SHA-256 |
|---|---:|---|
| `autojs6_python_provider.js` | 24,023 | `5e90c1f3f263a5fae10e631b0857611345ab86458f16e4a32e30c76d5939d2e7` |
| `python/autojs6-python-worker.js` | 4,994,085 | `78a1d2a7030c9884c63dee203563c43046849cec38d05d9f609f595aa8b4cf7b` |
| `python/manifest.json` | 6,650 | `c8cb49ff1a145ebab8103c41d0436deb35800b10a0bf95aa0d2d1006e109e1b6` |
| `python/THIRD_PARTY_LICENSES.txt` | 31,705 | `2d7be102fcb33554a4755528cf4ad28f826fcd3b507fff478bf45dcecbbe82b8` |
| **合计** | **5,056,463（4.822 MiB）** | — |

语义专属资产低于 M4-3 的 8 MiB 可选交付阈值，因此随 APK 离线内置；不引入下载、网络权限
或远程分析服务。生成清单记录所有输入版本、typeshed 内容哈希、Worker/许可证哈希、ES 目标和
`optionalDeliveryRequired: false`。

`THIRD_PARTY_LICENSES.txt` 包含 Pyright、typeshed 以及 12 个实际进入 Worker 的 npm runtime
依赖，共 14 个组件；根目录 `THIRD_PARTY_NOTICES.md` 同步说明再分发范围。运行时依赖执行
`npm audit --omit=dev` 为 0 个已知漏洞；构建工具的 dev dependency 审计与实际打包依赖分开记录。

## 功能与延迟矩阵

每个支持 Worker 的环境都验证 105 个 `pathlib.Path` 语义候选、`exists`、`read_text`、参数
hover、签名、definition、未定义名和语法错误共 4 条诊断。表中 P50 排除第一次发现
semantic completer 的样本；门限为初始化 `<10 s`、补全 P50 `<500 ms`。

| 环境 | WebView | 路径 | 初始化 | 首个语义包 | 补全 P50 | 结果 |
|---|---|---|---:|---:|---:|---|
| Sony G8441，Android 9 / API 28 | Chrome 126.0.6478.186 | Pyright | 491 ms | 785.4 ms | 7.5 ms | 105 候选 / 4 诊断 |
| x86 模拟器，Android 10 / API 29 | WebView 74.0.3729.185 | P2 | — | 37.1 ms | — | 24 候选，静默降级 |
| Sony XQ-AT72，Android 12 / API 31 | WebView 145.0.7632.120 | Pyright | 234 ms | 292.4 ms | 3.1 ms | 105 候选 / 4 诊断 |
| Sony XQ-DQ72，Android 13 / API 33 | WebView 152.0.7977.64 | Pyright | 176 ms | 208.2 ms | 2.1 ms | 105 候选 / 4 诊断 |
| x86_64 模拟器，Android 13 / API 33 | WebView 109.0.5414.123 | Pyright | 708 ms | 915.5 ms | 7.1 ms | 105 候选 / 4 诊断 |
| Xiaomi 23046RP50C，Android 15 / API 35 | WebView 130.0.6723.86 | Pyright | 211 ms | 278.2 ms | 2.0 ms | 105 候选 / 4 诊断 |
| x86_64 模拟器，Android 16 / API 36 | WebView 134.0.6998.135 | Pyright | 1,321 ms | 1,580.7 ms | 22.7 ms | 105 候选 / 4 诊断 |

全部语义环境的 UI callback error 为 0。销毁前生命周期为 1 个 active provider；触发
`pagehide` 后均得到 1 次 provider dispose、1 次 Worker release、0 个 active provider。

## 常驻内存口径

Worker 与页面运行在 WebView renderer，Android 侧 `Debug.MemoryInfo` 只能看到宿主进程；
`performance.memory` 在这些 WebView 中又不公开 Worker heap。只把宿主 PSS 称为“总内存”会
低估，因此 M4 增加 `measure-python-semantic.ps1`：

1. 在同一设备、同一 APK 上关闭 Python 语义，加载相同 `Path.` P2 索引并保持页面；
2. 用 `dumpsys meminfo --local` 采样宿主 PID 和由 ActivityManager 明确归属于插件包的
   sandboxed WebView renderer PID；
3. 强制停止后重新冷启，启用 Pyright 并完成全部语义探针，再采样相同两类进程；
4. `语义态合计 PSS - P2 基线合计 PSS` 作为 Python runtime 常驻增量。

这里的 300 MiB 门限明确作用于候选 Python runtime 的增量，而不是整个编辑器、WebView、
字体和 Android 框架的基础占用。为避免隐藏系统成本，表中仍同时列出两种绝对合计；部分高端
设备的完整编辑器 + renderer 合计会超过 300 MiB，但 Pyright 净增的最坏样本只有 83.20 MiB。

| 环境 | P2 宿主+renderer | Pyright 宿主+renderer | Python 净增 | 300 MiB 门 |
|---|---:|---:|---:|---:|
| Android 9 / API 28 真机 | 160.98 MiB | 233.11 MiB | 72.12 MiB | 通过 |
| Android 12 / API 31 真机 | 189.54 MiB | 269.92 MiB | 80.39 MiB | 通过 |
| Android 13 / API 33 真机 | 259.54 MiB | 342.74 MiB | **83.20 MiB** | 通过 |
| Android 13 / API 33 x86_64 | 167.30 MiB | 227.10 MiB | 59.81 MiB | 通过 |
| Android 15 / API 35 真机 | 278.27 MiB | 342.02 MiB | 63.75 MiB | 通过 |
| Android 16 / API 36 x86_64 | 213.51 MiB | 263.36 MiB | 49.84 MiB | 通过 |

PSS 是瞬时驻留样本，系统可能在 `terminate()` 后继续保留 renderer/allocator 页，因此释放门
以资源所有权和进程生命周期计数为准，不声称销毁后 PSS 会立刻等量下降。

## 老 WebView、故障与降级

已提交 Worker 包含 ES2022 public class fields；Android 10 模拟器的 WebView 74 无法解析。
Provider 在构造 Worker 前用最小函数体同时探测 class field、optional chaining 与 nullish
coalescing，并缓存结果。解析失败（或 CSP 禁止函数构造）即保守判定为不兼容：

- 不创建 Provider；
- 不创建 Worker，也不等待 5 秒握手超时；
- LSP wrapper 继续走 M2 Python 索引；
- `Path.` 返回 `exists` / `read_text`，不混入 `autojs6Python` 语义项；
- 状态原因是 `python-worker-runtime-unavailable`，UI callback error 为 0。

Node verifier 另行模拟 Worker 构造失败和 Worker 文件缺失；两者都必须回到 P2。全局 LSP
开关或 Python 独立语义开关关闭时同样不创建 Worker。用户因此可在低内存设备主动保留 P2。

## 自动化与复跑

重新生成需要 Node/npm/git，并固定校验 Pyright 提交：

```powershell
node tools/ace-lsp/build-python-worker.mjs

# 复用已检出的固定 Pyright 源码，避免再次下载
node tools/ace-lsp/build-python-worker.mjs `
  --pyright-dir <path-to-pyright-1.1.413>

# Gradle 包装入口；也可传 -Pautojs6.pyrightDir=<path>
.\gradlew.bat :app:generateAutoJs6PythonWorker
```

普通 `assemble` 不自动联网或重新生成 Worker，而是打包提交入库且经过哈希验证的资产。
验证命令：

```powershell
node tools/ace-lsp/verify-python-worker.mjs
.\gradlew.bat :app:verifyAutoJs6LspRuntime :app:verifyAutoJs6PythonWorker
.\gradlew.bat :app:testDebugUnitTest :app:assembleDebug :app:assembleDebugAndroidTest

# 自动测量 P2 / Pyright 的宿主 + renderer PSS 和净增
.\tools\ace-lsp\measure-python-semantic.ps1 `
  -Serial BH900ASK9E,QV710AF65F -HoldMs 15000 -SkipBuild
```

`verifyAutoJs6PythonWorker` 会校验版本/提交、271 个存根、内容与许可证哈希、8 MiB 阈值、
初始化/补全门限、五项语义能力、缺失 Worker 与 ES 语法不兼容降级，以及 Provider/Worker
创建和释放计数。`:app:check` 已依赖该任务。

最终 Android 回归在七个环境逐一运行 M4 单项；随后完整
`AceLanguageRoutingSmokeTest` 每个环境 6/6 通过，共 42/42，覆盖 M0–M3 路由、Lua Worker、
JavaScript/TypeScript 隔离和 Python 默认配置。Android 9 首次启动曾复现已在 M2/M3 记录的
系统 ART/JDWP 进程启动崩溃（当次 0 个测试），相同 APK 立即重跑通过；该已知系统 flake
不发生在测试主体或 Python Worker 内。

最终构建产物：

- debug APK：15,286,629 字节（14.578 MiB），SHA-256
  `b598882cb33ad9d99c040be4f06ead3d6a69894ea0e6295f407db24934a405fe`；
- androidTest APK：713,742 字节，SHA-256
  `fa4c7d1fa39fbfd535280aa582ae8f5800e77c8a9f14f2837e6606a0e0cfe8b0`。

七环境最终回归以这两个精确哈希为准。
