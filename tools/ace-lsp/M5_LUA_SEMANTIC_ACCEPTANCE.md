# M5 Lua 语义验收记录

验收日期：2026-08-31  
里程碑：Roadmap M5（LuaLS 设备内伴生进程）  
结论：**通过**

## 1. 交付范围

Lua 文档默认启用完全离线的 LuaLS 语义 Provider，并经 M3 通用 JSON-RPC/LSP 核心和
Android stdio 桥提供以下能力：

- 类型感知 completion；
- hover；
- signature help；
- diagnostics；
- 当前工程内 definition；
- Provider 健康状态、P2 降级、退避重启和显式释放。

rename 与 code action 不在 M5 首版范围。LuaLS 不可用时仍保留 M2 Lua 5.4 静态索引、
当前文档符号与 M1 Ace Lua worker 语法诊断，不显示阻塞错误弹窗。

## 2. 固定来源与可重复构建

`tools/ace-lsp/luals-build-lock.json` 固定以下输入：

| 输入 | 固定值 |
|---|---|
| LuaLS | `3.18.2` |
| tag object | `6dc1a32a141c69d8d52856a8b26f966f624fc76f` |
| source commit | `b5e57c36a9a27b89eb283861fb8946fa787e37d8` |
| Android NDK | `29.0.14206865` |
| Android target | API 28 |
| C++ runtime | static libc++ |
| 支持 ABI | `arm64-v8a`、`armeabi-v7a`、`x86_64` |

构建脚本核对 tag、主仓库提交与固定子模块，随后应用四处有精确上下文的可审计 Android
兼容补丁：以 luamake 目标 OS 决定可执行文件后缀；Android 排除 Linux crash 源；32 位
Android endpoint 使用正确的 `socklen_t`；bootstrap 允许固定的
`AUTOJS6_LUALS_ROOT` 运行时根。补丁上下文不匹配时立即失败，不做模糊改写。

独立复跑命令：

```powershell
.\tools\ace-lsp\build-luals-android.ps1 `
  -NdkRoot E:\.android\sdk\ndk\29.0.14206865 `
  -OutputRoot build\luals-android\repro-final

node tools\ace-lsp\verify-luals-runtime.mjs `
  --asset-root build\luals-android\repro-final\assets\luals `
  --jni-root build\luals-android\repro-final\jniLibs
```

2026-08-31 从空源码目录完整 clone、子模块 checkout 和三 ABI 编译后，运行时 inventory 与
全部 ELF 再次逐字节命中锁文件。

## 3. 产物、许可证与体积

### 3.1 原生文件

| ABI | 用途 | 字节 | SHA-256 | DT_NEEDED |
|---|---|---:|---|---|
| `arm64-v8a` | LuaLS | 2,226,784 | `c5c494904fedd297416dea27097c2b66bc32d034bbbff022123e512b45f2fd0e` | `libc.so`、`libdl.so`、`libm.so` |
| `armeabi-v7a` | LuaLS | 1,842,636 | `7ccf9a901f5b0e05a10e7869399238982027c9538d572291553a9ea42010021b` | `libc.so`、`libdl.so`、`libm.so` |
| `x86_64` | LuaLS | 2,220,864 | `f1a263dba47da7c7e7f6d91e8131465d426d55eb218e5d0c10ad0afdf3ad27a5` | `libc.so`、`libdl.so`、`libm.so` |
| `x86` | 仅允许 universal APK 安装 | 1,256 | `7b8d72d1d2047c380e1399c5ef3da631168d4c1ad5ca3e8d73b059b2d48b0610` | 无 |

x86 文件是 NDK r29 生成的最小 ET_DYN/i386、无依赖安装兼容 ELF，不在 LuaLS manifest 的
`nativeLibraries` 中，也不进入进程 allowlist，产品代码永远不会加载或执行它。

### 3.2 运行时资产

LuaLS runtime 为 273 个文件、1,912,876 字节，确定性 inventory SHA-256 为
`4274df0f03650cc3535b56df7bfa7df3ae4e1f2b0ca4ff9aceba4710d7dbcf3b`。
`manifest.json` 逐文件记录相对路径、字节数与哈希；提取逻辑拒绝绝对路径、盘符、反斜杠、
空段、`.`、`..` 和清单外文件。

Provider、runtime、manifest、许可证与四个 ELF 共 8,283,431 字节（7.900 MiB），占
8 MiB 单语言随包交付门的 98.75%，因此仍以完全离线组件随 universal APK 交付。ABI split
会把当前单一插件安装物变成多工件，并破坏已验收的旧 x86 静态回退安装路径，本里程碑不启用。

`app/src/main/assets/luals/THIRD_PARTY_LICENSES.txt` 保留 LuaLS 及实际运行时组件的 MIT 与
Boost Software License 1.0 文本；根目录 `THIRD_PARTY_NOTICES.md` 已增加来源、用途和锁文件
入口。Gradle verifier 同时固定许可证、manifest 和运行时 inventory。

## 4. Android 打包与执行完整性

受支持 ELF 以 `jniLibs/<abi>/libautojs6_luals.so` 打包，并由
`applicationInfo.nativeLibraryDir` 解析；`extractNativeLibs=true` 与 legacy JNI packaging
保证 API 28 也获得真实文件路径。`keepDebugSymbols` 防止 AGP strip 改变锁定字节，APK 内三份
LuaLS 与源码文件哈希完全相同。

`AceLuaLanguageServerRuntime.isSupported()` 不只判断路径存在，还验证 ABI、文件大小和
SHA-256。运行时资产提取到应用私有 `noBackupFilesDir`，先写临时文件、逐文件校验，再原子
发布版本目录。任何缺失、损坏或不支持 ABI 都在创建进程前静默进入 P2。

JavaScript 只能提交不透明 Provider ID `lua-luals`。固定的可执行文件、参数、工作目录和环境
由 Kotlin 注册表选择，不能从 WebView 注入命令或任意环境变量。

## 5. workspace 映射与边界

宿主将编辑器文档的 canonical 物理路径映射为 `file:` URI，并把最近工程根作为唯一
workspace root。路径解析遵循真实 canonical 父子关系而不是字符串前缀；不存在、越界、
非 `file:`、不同 authority、编码后穿越等 URI 均拒绝。

LuaLS 初始化配置关闭遥测和第三方库探测，只把该根加入 workspace。definition 返回目标在
交给宿主打开前再次经过同一根边界检查；LSP workspace edit 继续受 M3 的 URI、版本、配额与
原子应用规则约束。

JVM 测试覆盖：根本身、合法子文件、同前缀兄弟目录、`..`、编码路径、目录/文件 URI 往返、
不存在路径和越界 definition。

## 6. 能力验收

真实 WebView 用例 `AceLuaSemanticSmokeTest` 使用完整 Lua 文档验证：

| 能力 | 断言 |
|---|---|
| completion | `string.` 返回 17 个语义候选，包含 `upper()` 与 `sub(i, j)` |
| hover | `string.upper` 返回 LuaLS 类型/文档内容 |
| signature help | 函数调用位置返回有效签名与参数 |
| diagnostics | 同时得到预期语法/未定义全局诊断，旧版本结果不会覆盖新文档 |
| type annotation | `---@type` 改变对应符号的语义信息并用于成员分析 |
| definition | 本文件符号通过异步 LSP 请求跳至正确行列 |
| 故障降级 | 注入进程崩溃后补全立即可用的 P2 结果，健康状态记录故障 |
| 恢复 | 有界退避后重新 initialize，文档重放，语义补全恢复 |
| 释放 | editor release 后 server shutdown/terminate，active provider `1 → 0` |

排查中发现编辑器 definition 桥仅把 Python 分派到异步方法，Lua 会错误调用同步缓存路径。
现已将 Lua 纳入异步分派；`verifyAutoJs6LuaLanguageServer` 显式读取 bridge 源并锁定该条件，
真实设备 definition 断言也覆盖最终行为。

## 7. 设备矩阵与性能

| 设备 | Android / API | ABI | 路径 | 初始化 | 首包 | completion P50 | 结果 |
|---|---:|---|---|---:|---:|---:|---|
| Sony G8441 | 9 / 28 | arm64 | LuaLS | 371 ms | 1,422.7 ms | 37.6 ms | 通过 |
| Android 模拟器 | 10 / 29 | x86 | P2 | — | 19.0 ms | — | 通过 |
| Sony XQ-AT72 | 12 / 31 | arm64 | LuaLS | 384 ms | 633.8 ms | 10.2 ms | 通过 |
| Sony XQ-DQ72 | 13 / 33 | arm64 | LuaLS | 191 ms | 611.3 ms | 3.5 ms | 通过 |
| Android 模拟器 | 13 / 33 | x86_64 | LuaLS | 785 ms | 1,245.1 ms | 10.8 ms | 通过 |
| Xiaomi 23046RP50C | 15 / 35 | arm64 | LuaLS | 251 ms | 604.3 ms | 7.4 ms | 通过 |
| Android 模拟器 | 16 / 36 | x86_64 | LuaLS | 1,295 ms | 1,458.1 ms | 97.7 ms | 通过 |

六个 LuaLS 环境均有 17 个语义候选、2 条预期诊断、`crashCount=1`、`restartCount=1`，
释放后 active provider 为 0。最慢初始化 1.295 秒，最慢稳态 P50 97.7 ms；Android 9、
Android 16 与 x86 行采用三台设备并发安装并运行最终哈希 APK 的保守复验值，仍分别低于
10 秒与 500 ms 门限。x86 明确记录 `bundled-luals-unavailable-for-abi`，返回 15 个静态
候选且 callback error 为 0。

## 8. 自动化与既有回归

本地/CI 入口：

```powershell
.\gradlew.bat :app:verifyAutoJs6LuaLanguageServer
.\gradlew.bat :app:testDebugUnitTest
.\gradlew.bat :app:assembleDebug :app:assembleDebugAndroidTest
.\gradlew.bat :app:check
```

验证层次：

- Node：manifest 与 license inventory、273 文件哈希、ELF class/machine/DT_NEEDED、前端加载
  顺序、异步 definition、LSP 协议、崩溃重启和不支持 ABI 回退；
- JVM：manifest/ABI/损坏门控、Content-Length framing、进程 lifecycle、registry allowlist、
  workspace canonical 边界、设置迁移与 manager snapshot；
- Android：六个支持环境的完整 Lua 语义与一个 x86 P2 回退环境；
- 既有语言：同一七环境各跑 `AceLanguageRoutingSmokeTest` 6/6，合计 42/42。

最终构建产物：

- debug APK：18,920,686 字节（18.044 MiB），SHA-256
  `62ee916bc16df8ed5d9355d3ca029cd6773307838b54f46c9c8ffc505b877a85`；
- androidTest APK：776,571 字节，SHA-256
  `7cff7d61bc9f2a6373be10efb9c416d356bc07974d7e39735c386c283221e220`。

这两个精确哈希已完成七环境 42/42 完整路由回归。Android 9 arm64、Android 16 x86_64
与 Android 10 x86 另外再次执行 `AceLuaSemanticSmokeTest`，分别验证最低 SDK 语义、最高
SDK/x86_64 语义和不支持 ABI 的静态回退，均为 `OK (1 test)`。
