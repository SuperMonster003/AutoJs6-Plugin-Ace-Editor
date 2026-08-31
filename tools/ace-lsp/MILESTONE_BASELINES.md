# Ace 编辑器里程碑基线

记录日期：2026-08-31  
当前基线：M3

本文件记录各里程碑可重复比较的体积与性能数据。它不是脱离设备、WebView 版本和
样本口径的硬 SLA；后续里程碑必须使用相同脚本和设备矩阵复测，并同时保留环境信息。

## M0 资产增量

M0 从官方 npm 包 `ace-builds@1.4.12` 的 `src-min-noconflict/` 原样导入以下文件。
包 tarball shasum 为 `888efa386e36f4345f40b5233fcc4fe4c588fae7`，npm integrity 为
`sha512-G+chJctFPiiLGvs3+/Mly3apXTcfgE45dT5yp12BcWZ1kUs+gm0qd3/fv4gsz6fVag4mM0moHVpjHDIgph6Psg==`。

| 资产 | 字节 | SHA-256 |
|---|---:|---|
| `mode-typescript.js` | 20,372 | `efee831dd276b11b349cf04c6a83af19d603d6d4ffdad55e20fbd67cda280ad0` |
| `mode-json.js` | 5,571 | `50fee523c0cd68d4947678d08f2349068e241fc9e68d5cc07c256087ec9c059c` |
| `mode-jsx.js` | 7,292 | `3d1215e707a5a7f1388cab43a690e3d1f0f0cee5207d21d4dd80d9ece3e0f5a5` |
| `snippets/typescript.js` | 335 | `ff23466921c4ddb59aea3662e2107189257c7ffd4e958c39187a47cc7601c3c2` |
| `snippets/json.js` | 329 | `238a0bd54eb1b4c1a0801bdedd2ea4eb0c28b6987bf4311b9eccaaba3bd776d1` |
| **合计** | **33,899（33.10 KiB）** | — |

这里记录的是未压缩 assets 的精确新增量；已有的 JavaScript mode、snippet 和 worker
只新增完整性清单登记，不计为 M0 新增字节。后续里程碑继续在本表追加资产增量。

## M1 资产增量

M1 延续同一份 `ace-builds@1.4.12` tarball。Python/Lua/Java mode、Lua worker 以及
Lua/Java snippets 从官方 `src-min-noconflict/` 原样导入；Kotlin 为便于审计其三个
上游兼容缺口，使用同版本官方 `src-noconflict/mode-kotlin.js` 可读源码并做最小补丁。
Python 3 与 Kotlin snippets 是项目维护资源，因为前者上游仍含 Python 2 语法，
后者上游为空。

| 资产 | 字节 | SHA-256 | 来源 |
|---|---:|---|---|
| `mode-python.js` | 8,139 | `d99b7d2c8750bac065e2dce6163ae53497231d35e54243d7cbab53975bdc2226` | Ace 原样 |
| `mode-lua.js` | 7,912 | `b043dc0ed0cb5e297894e29a6c233d9c65d4d27d599c48e58abb49dab035ccc2` | Ace 原样 |
| `worker-lua.js` | 37,849 | `ed20a82b0c862bc2fd69300e80d6b328e28eb45b789ae506bda66360c063f097` | Ace 原样 |
| `mode-java.js` | 23,848 | `0f1b185d94280e703afcce8b43c5309ab9d1f642fded8b8b77d5e51032c89eb8` | Ace 原样 |
| `mode-kotlin.js` | 26,226 | `ca2ee755a51d64062b947dfc003f622c06e87941dd11b9e111716ca16da51296` | Ace 可读源码 + 兼容补丁 |
| `snippets/python.js` | 2,329 | `b9ade3ccf2077f1f0180ea11ca49c0c08d955d80766d29e5486c7849ead8c34c` | 项目维护 |
| `snippets/lua.js` | 836 | `ffb5f57cd62c4dccffe179d72b53bde79e33b72a2a6fcd22dba9ed251f3458cd` | Ace 原样 |
| `snippets/java.js` | 4,651 | `e15f4832c941f0bfd703e7067db677a6aabb1411e5817be91ac29428ba5f0ead` | Ace 原样 |
| `snippets/kotlin.js` | 2,231 | `6123698dd11b2382aeca1a679ee88059282e819c7dbed65da1a716252a5dc5a2` | 项目维护 |
| **合计** | **114,021（111.35 KiB）** | — | — |

官方可读 Kotlin 源文件在补丁前为 24,995 字节，SHA-256 为
`6a08ff182072c2c51bbf9aba12815c91f38bac080e0a9807ab84d620bb4b53e8`。
最终 M1 增量只占 1 MiB 预算的 10.87%，余量 934,555 字节，X-1 体积门通过。

## M2 资产增量

M2 新增四份由项目生成器维护的按语言索引，以及一份通用单文件符号提取器。下表只
计算新的打包 assets；对既有 bridge/completer/client 的替换式修改不重复计作新增文件。

| 资产 | 字节 | SHA-256 | 内容 |
|---|---:|---|---|
| `autojs6_local_symbols.js` | 20,324 | `6c3742fa30b97155edf0e90f60494048f701c757eb8415383d65744228b07649` | 四语言单文件符号提取 |
| `indices/python.js` | 80,123 | `c1d8f376dacd0c0a06f7c6d8cb69b5fe2e13439452216bc6d4ef19eae72b88bd` | Python 3.12 / typeshed 固定提交子集 |
| `indices/lua.js` | 27,170 | `5b3210c2a8df3e3d96d33f0d1ae0f2a35e793477095ed7996a3f6e7fc3ad8c7d` | Lua 5.4.8 标准库子集 |
| `indices/java.js` | 42,344 | `3755eb83cfa2042d80d7734bbee52b9f198b2b8c224d95de0849124bf39ebccc` | Java 17 / Android API 35 子集 |
| `indices/kotlin.js` | 22,722 | `f4e60180e6d3adfe2ee40e752d06f79bdcebc9e4a4cea16c447efbf9620ef78c` | Kotlin 2.2.21 stdlib 子集 |
| **合计** | **192,683（188.17 KiB）** | — | — |

该增量占 3 MiB 预算的 6.13%，余量 2,953,045 字节。索引按语言首次请求加载，未打开
对应语言时不会创建其规范化对象。Node 运行时校验得到的规模与保守 UTF-16 序列化估算如下：

| 语言 | 全局 | 模块上下文 | 成员 | 产物字节 | 规范化 UTF-16 估算 |
|---|---:|---:|---:|---:|---:|
| Python | 93 | 34 | 326 | 80,123 | 115,874 B |
| Lua | 35 | 11 | 114 | 27,170 | 38,314 B |
| Java | 42 | 22 | 173 | 42,344 | 61,176 B |
| Kotlin | 76 | 8 | 47 | 22,722 | 33,240 B |

确定性复跑命令：

```powershell
.\gradlew.bat :app:generateAutoJs6LanguageIndices
.\gradlew.bat :app:verifyAutoJs6LanguageIndices
```

## M0 性能基线

复跑脚本：`tools/ace-lsp/measure-editor-performance.ps1`  
真机探针：`AcePerformanceBaselineTest.recordsM0EditorPerformanceBaseline`

脚本每轮会精确 `force-stop` 插件目标包，然后启动一次 instrumentation 测量。下表是
每台设备 3 个样本的中位数，单位均为毫秒：

| 设备 | Android / API | WebView provider | Activity → 首次 editor draw | Activity → editor ready | session create → ready | 首次静态补全回调 |
|---|---:|---|---:|---:|---:|---:|
| Xiaomi 23046RP50C | 15 / 35 | `com.google.android.webview@130.0.6723.86` | 649.6 | 937.2 | 565.1 | 1.4 |
| Sony G8441 | 9 / 28 | `com.android.chrome@126.0.6478.186` | 730.8 | 1,248.0 | 1,097.5 | 2.5 |
| Sony XQ-AT72 | 12 / 31 | `com.google.android.webview@145.0.7632.120` | 589.0 | 858.9 | 493.4 | 1.9 |

三台设备的首次静态补全均以 `fi` 为输入并返回 13 个候选。指标口径如下：

- “冷启动”指 `force-stop` 后目标进程内的首次编辑器 session；保留应用数据和系统
  WebView 缓存，不包含 adb/instrumentation bootstrap 时间。
- “首次 editor draw”是编辑器 View 的第一次真实 `onDraw`，不是 Activity 的空白帧。
- “editor ready”是插件 `EditorPluginCallback.onReady`。
- “首次静态补全回调”在 WebView 内用 `performance.now()` 测量 AutoJs6 静态 completer
  的同步首包；它不代表 TypeScript 语义服务冷启动。未来语义 provider 需另建指标。

复跑全部在线设备：

```powershell
.\tools\ace-lsp\measure-editor-performance.ps1 -Iterations 3
```

复跑指定设备且复用现有 APK：

```powershell
.\tools\ace-lsp\measure-editor-performance.ps1 `
  -SkipBuild -Iterations 3 -Serial 968e9f18,BH900ASK9E,QV710AF65F
```

脚本向标准输出写出含逐次样本和中位数的 JSON。比较新里程碑时至少保持设备、
WebView provider、迭代次数和测量口径一致；环境变化必须与结果一起记录。

## M1 性能回归

M1 使用相同 APK 构型、脚本、设备与 JavaScript `fi` 静态补全样本复测。Android 9
和 12 各取 3 个样本；Android 15 首轮受设备瞬态负载干扰，随后在 33.3 摄氏度下
独立取 5 个稳定样本并以该组中位数为准。

| 设备 | 样本 | Activity → 首次 draw | Activity → ready | session → ready | 首次静态补全 |
|---|---:|---:|---:|---:|---:|
| Xiaomi 23046RP50C | 5 | 659.0 ms（M0 649.6, +1.4%） | 936.2 ms（M0 937.2, -0.1%） | 546.1 ms（M0 565.1, -3.4%） | 1.5 ms（M0 1.4） |
| Sony G8441 | 3 | 723.3 ms（M0 730.8, -1.0%） | 1,231.8 ms（M0 1,248.0, -1.3%） | 1,092.9 ms（M0 1,097.5, -0.4%） | 2.5 ms（M0 2.5） |
| Sony XQ-AT72 | 3 | 580.3 ms（M0 589.0, -1.5%） | 854.8 ms（M0 858.9, -0.5%） | 497.9 ms（M0 493.4, +0.9%） | 1.6 ms（M0 1.9） |

三台设备的启动中位数变化均在约 1.5% 以内或更快，且仍返回 13 个 JavaScript 静态
候选。新增四语言资源按 mode 懒加载，不进入默认 JavaScript 冷启动关键路径；X-2
性能门判定通过。

## M2 性能回归

M2 继续使用同一套 `measure-editor-performance.ps1` 探针。脚本现在按 `measurement` 分流
原有冷启动记录与 `m2-python-lazy-index` 记录，避免新增日志被误当作 M0 基线。三台基线
真机各取 3 个样本中位数：

| 设备 | Activity → 首次 draw | Activity → ready | session → ready | JS 首次静态补全 | Python 最大索引首次加载 |
|---|---:|---:|---:|---:|---:|
| Xiaomi 23046RP50C（15 / API 35） | 651.4 ms（M1 659.0, -1.2%） | 929.2 ms（M1 936.2, -0.7%） | 543.6 ms（M1 546.1, -0.5%） | 1.7 ms（M1 1.5） | 9.2 ms |
| Sony G8441（9 / API 28） | 742.5 ms（M1 723.3, +2.7%） | 1,245.2 ms（M1 1,231.8, +1.1%） | 1,093.2 ms（M1 1,092.9, +0.0%） | 2.9 ms（M1 2.5） | 21.4 ms |
| Sony XQ-AT72（12 / API 31） | 571.4 ms（M1 580.3, -1.5%） | 849.9 ms（M1 854.8, -0.6%） | 493.4 ms（M1 497.9, -0.9%） | 1.7 ms（M1 1.6） | 7.0 ms |

M2 索引不在默认 JavaScript 启动路径：三台设备的 ready 中位数最多增加 1.1%，session
ready 最多增加 0.03%；Android 9 首帧的 2.7% 波动未延续到 editor ready。原有 JavaScript
样本仍返回 13 个候选。

最大且成员最多的 Python 索引另外使用最终字节一致的 APK 在七个 WebView 环境各取一次
独立样本；每次都从未加载状态开始：

| 环境 | 样本 | Python 加载 + 解析 + 首包 | 候选 | UTF-16 估算 |
|---|---:|---:|---:|---:|
| Sony G8441，Android 9 / API 28 | 1 | 21.9 ms | 14 | 115,874 B |
| x86 模拟器，Android 10 / API 29 | 1 | 24.0 ms | 14 | 115,874 B |
| Sony XQ-AT72，Android 12 / API 31 | 1 | 6.8 ms | 14 | 115,874 B |
| Sony XQ-DQ72，Android 13 / API 33 | 1 | 5.7 ms | 14 | 115,874 B |
| x86_64 模拟器，Android 13 / API 33 | 1 | 11.6 ms | 14 | 115,874 B |
| Xiaomi 23046RP50C，Android 15 / API 35 | 1 | 7.1 ms | 14 | 115,874 B |
| x86_64 模拟器，Android 16 / API 36 | 1 | 19.4 ms | 14 | 115,874 B |

动态 `<script>` 在个别 WebView 上曾产生 90 ms 级调度开销，因此默认加载器对本地 asset
优先使用同步 XHR + 立即解析，并保留 script element 兼容回退。最终七环境范围为
5.7–24.0 ms；115,874 B 仅占 2 MiB 运行时预算约 5.53%。Node 校验同时对四语言逐项
断言产物 <2 MiB、规范化 UTF-16 估算 <2 MiB、加载解析 <50 ms。M2 性能门通过。

## M3 资产增量

M3 新增三份项目自有 browser assets。Kotlin stdio 进程桥编译进 dex，不计入本表的未压缩
asset 精确新增量；本里程碑没有新增第三方运行时或许可证条目。

| 资产 | 字节 | SHA-256 | 内容 |
|---|---:|---|---|
| `autojs6_semantic_provider.js` | 20,587 | `b953d5f8c0bd50487bf038828a7d725223619f824f6733db3056d38862502e0f` | 八能力契约、健康/降级、TS adapter |
| `autojs6_lsp_core.js` | 33,375 | `095caf2e85fb5666d62aae61bc9984309efdc9858b2f89c11f40cb9a09cf195c` | JSON-RPC/LSP 协议、安全 edit、重启恢复 |
| `autojs6_lsp_transports.js` | 16,122 | `9dcc4ce38697103dce1bf814460415a299cd43bfa26301c50cd8c29b798570bb` | WebWorker 与 Android stdio 传输 |
| **合计** | **70,084（68.44 KiB）** | — | — |

三个脚本均登记在 `AceEditorAssets.requiredAssetPaths`，并由 JVM 资产清单单测和真实 WebView
加载断言双重覆盖。详细协议与安全验收见 `M3_SEMANTIC_FRAMEWORK_ACCEPTANCE.md`。

## M3 兼容性回归

M3 不打包任何真实的 Python/Lua/Java/Kotlin 语义引擎，因此没有新增常驻语言运行时，也没有
改变默认 JavaScript 启动时要创建的 TypeScript service 数量。Provider、LSP core 与 transport
脚本随页面静态加载；其新增未压缩体积合计 68.44 KiB，运行时对象在没有对应 provider/server
时不创建 worker 或伴生进程。

Node `verifyAutoJs6LspRuntime` 复验 TypeScript 6.0.3 全量行为、M0–M2 和旧 WebView fallback，
并新增 provider 异常/超时、15 种协议消息、乱序/取消、诊断版本、URI/workspace edit 安全、
重启后版本 5 文档恢复及双传输同构 echo。JVM 全量单测和 debug APK/test APK 构建通过。

同一份 APK 在下列七个环境顺序运行完整 `AceLanguageRoutingSmokeTest`；每个环境 6/6 通过，
共 42 个真实 WebView 用例：

| 环境 | Android / API | M3 Provider/core/transport 加载 | 完整 M0–M3 语言套件 |
|---|---:|---:|---:|
| Sony G8441 | 9 / 28 | 通过 | 6/6 通过 |
| x86 模拟器 | 10 / 29 | 通过 | 6/6 通过 |
| Sony XQ-AT72 | 12 / 31 | 通过 | 6/6 通过 |
| Sony XQ-DQ72 | 13 / 33 | 通过 | 6/6 通过 |
| x86_64 模拟器 | 13 / 33 | 通过 | 6/6 通过 |
| Xiaomi 23046RP50C | 15 / 35 | 通过 | 6/6 通过 |
| x86_64 模拟器 | 16 / 36 | 通过 | 6/6 通过 |

Android 9 的最终完整套件首次 instrumentation 启动在应用初始化前由系统 `ADB-JDWP Connection`
线程于 `libart.so` 内 SIGSEGV，当次测试数为 0；同一最终 APK 单设备立即重跑后 6/6 通过。
这与 M2 已记录的该设备系统级偶发现象一致，不计为项目用例失败。

M3 的兼容性门通过；后续 M4 必须单独记录 Python runtime 的初始化、常驻内存和语义响应延迟，
不能把本框架的无运行时结果当作 Python 性能基线。

最终 debug APK 为 13,980,368 字节（13.333 MiB），SHA-256
`5bb36138dcde53772274121b5242446ff3212090c3fb0d8802b288014b33cbbc`。该精确哈希对应的 APK
已在表中七个环境重新安装并通过 M3 单项真实 WebView 用例。

## M4 Python 语义资产增量

M4 新增一个项目维护 Provider、固定版本的 Pyright Worker、裁剪 typeshed 与合并许可证。
Worker 清单同时记录 ES2022 运行门槛和 14 个实际再分发组件。以下是未压缩资产的精确值：

| 资产 | 字节 | SHA-256 |
|---|---:|---|
| `autojs6_python_provider.js` | 24,023 | `5e90c1f3f263a5fae10e631b0857611345ab86458f16e4a32e30c76d5939d2e7` |
| `python/autojs6-python-worker.js` | 4,994,085 | `78a1d2a7030c9884c63dee203563c43046849cec38d05d9f609f595aa8b4cf7b` |
| `python/manifest.json` | 6,650 | `c8cb49ff1a145ebab8103c41d0436deb35800b10a0bf95aa0d2d1006e109e1b6` |
| `python/THIRD_PARTY_LICENSES.txt` | 31,705 | `2d7be102fcb33554a4755528cf4ad28f826fcd3b507fff478bf45dcecbbe82b8` |
| **合计** | **5,056,463（4.822 MiB）** | — |

该增量为 8 MiB 可选组件阈值的 60.28%，因此离线随包交付。Pyright 固定为 1.1.413 / commit
`789d8275fef25f347ffef7b847305fefd8a3e363`；Python 3.12 存根固定为 typeshed commit
`289e5d3568961c8bcd33d01eef5b7ec5e1ad33ad` 的 271 文件闭包。生成器和 verifier 逐项校验
Worker、typeshed 内容、许可证、版本和体积哈希。

## M4 功能与延迟

支持 ES2022 Worker 的六个环境均返回 105 个 `Path` 语义候选和 4 条预期诊断，hover、
signature help、definition、销毁释放与零 UI callback error 全部通过。Android 10 / WebView 74
在 Worker 创建前由语法探针识别，继续返回 24 个 M2 `Path` 候选。

| 环境 | 路径 | 初始化 | 首个语义/P2 包 | 稳态补全 P50 | 生命周期 |
|---|---|---:|---:|---:|---|
| Android 9 / API 28 真机 | Pyright | 491 ms | 785.4 ms | 7.5 ms | 1 创建 / 1 释放 / 0 active |
| Android 10 / API 29 x86 | P2 | — | 37.1 ms | — | 0 创建 / 0 active |
| Android 12 / API 31 真机 | Pyright | 234 ms | 292.4 ms | 3.1 ms | 1 创建 / 1 释放 / 0 active |
| Android 13 / API 33 真机 | Pyright | 176 ms | 208.2 ms | 2.1 ms | 1 创建 / 1 释放 / 0 active |
| Android 13 / API 33 x86_64 | Pyright | 708 ms | 915.5 ms | 7.1 ms | 1 创建 / 1 释放 / 0 active |
| Android 15 / API 35 真机 | Pyright | 211 ms | 278.2 ms | 2.0 ms | 1 创建 / 1 释放 / 0 active |
| Android 16 / API 36 x86_64 | Pyright | 1,321 ms | 1,580.7 ms | 22.7 ms | 1 创建 / 1 释放 / 0 active |

最慢初始化 1.321 秒，最慢稳态 P50 22.7 ms，分别留有 8.679 秒和 477.3 ms 门限余量。

## M4 常驻内存

`measure-python-semantic.ps1` 在同一设备分别冷启 P2 基线和 Pyright 语义态，用
`dumpsys meminfo --local` 采样宿主及由 ActivityManager 归属到插件包的 WebView renderer。
Python runtime 门以两种状态的合计 PSS 差值计算，同时保留绝对合计以防隐藏基础成本：

| 环境 | P2 合计 PSS | Pyright 合计 PSS | Python 净增 |
|---|---:|---:|---:|
| Android 9 / API 28 真机 | 160.98 MiB | 233.11 MiB | 72.12 MiB |
| Android 12 / API 31 真机 | 189.54 MiB | 269.92 MiB | 80.39 MiB |
| Android 13 / API 33 真机 | 259.54 MiB | 342.74 MiB | **83.20 MiB** |
| Android 13 / API 33 x86_64 | 167.30 MiB | 227.10 MiB | 59.81 MiB |
| Android 15 / API 35 真机 | 278.27 MiB | 342.02 MiB | 63.75 MiB |
| Android 16 / API 36 x86_64 | 213.51 MiB | 263.36 MiB | 49.84 MiB |

最大 Python 净增为 83.20 MiB，只占 300 MiB runtime 门限的 27.73%。完整口径、候选对比、
绝对 PSS 的解释和复跑命令见 `M4_PYTHON_SEMANTIC_ACCEPTANCE.md`。

## M4 回归与 APK

Node Worker verifier、M3 通用 LSP verifier、JVM 单测、debug APK 和 test APK 均通过。
七环境随后分别运行 M4 单项和完整 `AceLanguageRoutingSmokeTest`；完整套件每个环境 6/6，
合计 42/42。Android 9 首次 instrumentation 启动曾再次出现 M2/M3 已记录的 ART/JDWP 系统
进程 flake（0 个测试进入），同一 APK 立即重跑通过。

最终 debug APK 为 15,286,629 字节（14.578 MiB），SHA-256
`b598882cb33ad9d99c040be4f06ead3d6a69894ea0e6295f407db24934a405fe`。对应 androidTest APK
为 713,742 字节，SHA-256
`fa4c7d1fa39fbfd535280aa582ae8f5800e77c8a9f14f2837e6606a0e0cfe8b0`。最终设备回归只接受
这两个精确哈希对应的产物。

## M5 Lua 语义资产增量

M5 新增项目维护的 Lua Provider、LuaLS 运行时、三种受支持 ABI 原生可执行文件，以及一个
不注册、不执行的 x86 安装兼容 ELF。以下为 APK 打包前未压缩文件的精确值：

| 资产 | 字节 | SHA-256 / 说明 |
|---|---:|---|
| `autojs6_lua_provider.js` | 26,759 | `658800c42a41c0c09b6b2cc6feee4935303446371ff37a6c702162d13cc0f4fd` |
| LuaLS runtime（273 文件） | 1,912,876 | inventory `4274df0f03650cc3535b56df7bfa7df3ae4e1f2b0ca4ff9aceba4710d7dbcf3b` |
| `luals/manifest.json` | 49,001 | `7e90c4051f176ab2de2e8bc5202f84b3ffc13a120927452c51fd7bd672202be6` |
| `luals/THIRD_PARTY_LICENSES.txt` | 3,255 | `133418da8176d02a5ee96ee3201002f21565ceac2d578ef39d511bbd49eaf78e` |
| 三种受支持 ABI LuaLS ELF | 6,290,284 | 逐 ABI 哈希见 M5 验收文档 |
| x86 仅安装兼容 ELF | 1,256 | `7b8d72d1d2047c380e1399c5ef3da631168d4c1ad5ca3e8d73b059b2d48b0610` |
| **合计** | **8,283,431（7.900 MiB）** | — |

该增量占单语言 8 MiB 随包交付门的 98.75%，余量 105,177 字节，因此保留完全离线随包
交付。既有发布链只产出 universal 插件 APK；采用 ABI split 会使侧载、宿主插件发现和旧 x86
静态回退需要多份工件，故 M5 保留 universal，三个真正的 LuaLS ELF 仍由 Android 按 ABI
选择。运行时脚本可压缩，原生 ELF 以 `keepDebugSymbols` 防止 AGP 改写，APK 内字节必须与清单
哈希一致。

## M5 功能、延迟与生命周期

六个受支持环境均返回 17 个 `string` 语义候选和 2 条预期诊断；hover、signature help、
definition、`---@type`、故障后的 P2 回退与恢复均通过。下表时间由最终 M5 WebView 冒烟测试
使用 `performance.now()` 记录：

| 环境 | 路径 | 初始化 | 首个语义/P2 包 | 稳态补全 P50 | 生命周期 |
|---|---|---:|---:|---:|---|
| Android 9 / API 28 arm64 真机 | LuaLS | 371 ms | 1,422.7 ms | 37.6 ms | 1 崩溃 / 1 重启 / 1 释放 |
| Android 10 / API 29 x86 | P2（不支持 ABI） | — | 19.0 ms | — | 0 LuaLS 进程 |
| Android 12 / API 31 arm64 真机 | LuaLS | 384 ms | 633.8 ms | 10.2 ms | 1 崩溃 / 1 重启 / 1 释放 |
| Android 13 / API 33 arm64 真机 | LuaLS | 191 ms | 611.3 ms | 3.5 ms | 1 崩溃 / 1 重启 / 1 释放 |
| Android 13 / API 33 x86_64 | LuaLS | 785 ms | 1,245.1 ms | 10.8 ms | 1 崩溃 / 1 重启 / 1 释放 |
| Android 15 / API 35 arm64 真机 | LuaLS | 251 ms | 604.3 ms | 7.4 ms | 1 崩溃 / 1 重启 / 1 释放 |
| Android 16 / API 36 x86_64 | LuaLS | 1,295 ms | 1,458.1 ms | 97.7 ms | 1 崩溃 / 1 重启 / 1 释放 |

最慢初始化 1.295 秒，最慢稳态 P50 97.7 ms；后两项来自三台设备并发运行最终 APK 的
保守复验，仍分别低于 10 秒与 500 ms 门限。每个受支持环境在故障注入后都记录
`crashCount=1`、`restartCount=1`，释放编辑器后 active provider 数从 1 降至 0。x86 返回
15 个静态候选，健康原因固定为 `bundled-luals-unavailable-for-abi`，callback error 为 0。

## M5 回归与 APK

固定源码/NDK 的独立全量重建再次得到清单中的全部哈希。LuaLS Node verifier、JS 语法检查、
JVM 单测、debug APK 与 test APK 构建通过；七环境完整 `AceLanguageRoutingSmokeTest` 每个
6/6，合计 42/42。

最终 debug APK 为 18,920,686 字节（18.044 MiB），SHA-256
`62ee916bc16df8ed5d9355d3ca029cd6773307838b54f46c9c8ffc505b877a85`。对应 androidTest APK
为 776,571 字节，SHA-256
`7cff7d61bc9f2a6373be10efb9c416d356bc07974d7e39735c386c283221e220`。这两个精确哈希已在
Android 9/10/12/13/15/16 七环境重新安装或复核安装状态并完成 42/42 路由回归；其中
Android 9、Android 16 x86_64 与 Android 10 x86 还再次通过完整 Lua 语义/ABI 回退单项。
