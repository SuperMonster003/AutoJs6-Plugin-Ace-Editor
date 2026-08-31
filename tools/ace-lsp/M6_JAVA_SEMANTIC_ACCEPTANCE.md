# M6 Java 语义验收记录

验收日期：2026-08-31
里程碑：Roadmap M6（ECJ/JDT on ART）
结论：**按验证门通过**——G6-0、M6-1、M6-2 通过；G6-3 未通过并执行既定降级路径；
M6-4 因前置门未通过而关闭。

## 1. 最终交付边界

Java 文档默认启用完全离线的单文件 ECJ 诊断，M6 Provider 只声明：

- diagnostics：语法、名称解析与基础类型诊断；
- dispose：取消待执行请求并释放后台 executor。

completion、hover 与 signature help 不伪装成语义能力，继续使用 M2 的 Java 17 / Android API
35 静态索引、当前文档符号与文档词。运行时或类路径不可用、请求过大、内存预检失败、编译
异常时不会阻塞编辑器，也不会弹错误对话框，而是清除本轮语义标注并保留 P2。

首版严格限定为“当前 `.java` 文件 + 随包类签名”。不读取 Gradle/Maven 项目模型，不解析
外部依赖或多模块 source set，不执行注解处理器，也不生成 `.class` 输出。

## 2. G6-0：ECJ on ART 版本选择

[Eclipse JDT Core](https://github.com/eclipse-jdt/eclipse.jdt.core) 的 batch compiler 可以独立于
完整 Eclipse IDE 使用，但不同版本自身的 Java 运行时基线不同。门禁按相同单文件、Android
classpath 与 ART 设备逐级回退：

| 候选 | 结果 | 拒绝/选择依据 |
|---|---|---|
| ECJ 3.46.x | 拒绝 | Java 17 运行时路径在 API 33 触达 Android 不具备的 `java.lang.Runtime$Version` |
| ECJ 3.33.x | 拒绝 | Java 11 运行时路径在 API 29 x86 触达 `InputStream.readAllBytes()` |
| **ECJ 3.26.0** | **选择** | Java 8 运行时线；API 29/33/36/37 均完成有效源码、语法错误和未解析符号三类编译 |

产品依赖固定为 `org.eclipse.jdt:ecj:3.26.0`，Maven 构件为 3,133,846 字节，SHA-256
`ac0ba5876eaf7ebb47749a0d1be179c51f194b9dd0b875d1c09e1b530f5a2db5`。Android 没有完整
`javax.lang.model.SourceVersion`，而 ECJ `FileSystem` 会探测该类型，因此产品提供仅包含
`RELEASE_0`–`RELEASE_21` 枚举常量的兼容类；编译器同时固定关闭 annotation processing。

诊断实现直接使用 ECJ internal compiler 与 `CategorizedProblem`，不解析本地化命令行文本。
source/compliance/target 固定为 Java 16，单次最多 200 条问题，不生成 class file，错误 factory
固定英语以保持消息稳定。`sourceStart/sourceEnd` 通过 CR、LF、CRLF 感知的行首索引转换为
Ace 的零基 row/column 与结束位置。

## 3. M6-1：受限执行、节流与内存熔断

ECJ 不进入 WebView/UI 线程。`AceJavaSemanticRuntime` 使用一个
`ScheduledThreadPoolExecutor(1)`，线程设为 Android background priority、Java minimum
priority 与 daemon；ECJ 自身也固定单线程。约束如下：

| 约束 | 固定值 | 行为 |
|---|---:|---|
| 浏览器编辑停止 debounce | 450 ms | 快速输入只提交最新文本 |
| 原生最小编译间隔 | 250 ms | WebView 调度异常时的第二道节流 |
| 文档上限 | 524,288 UTF-16 code units | 超限直接返回 `document-too-large` |
| 编译前可用堆 | 48 MiB | 不足时打开熔断并返回 `insufficient-heap` |
| 单次编译堆增长 | 64 MiB | 超限后打开熔断，不再接受后续诊断 |
| 请求模型 | latest only | 取消排队任务；已运行旧任务结束后因 serial 不匹配而丢弃结果 |
| 生命周期 | editor scoped | editor destroy 时取消 future 并 `shutdownNow()` |

Native 状态公开 accepted/completed/stale/cancelled/rejected 计数、最后耗时、heap/PSS 增量、
熔断状态和错误码，供测试与故障诊断使用。JavaScript Provider 另有 15 秒响应 timeout；响应
必须同时匹配 request id 与当前 document URI 才能发布 annotation。

真实 WebView 用例先提交缺分号，再提交未定义符号；两者都定位到源文件第 4 行，即 Ace
零基 `row=3`。completion 与 hover provider 均明确为 `local-index`，没有把 ECJ 诊断误报为
JDT 补全。四个最终测试环境的 editor 生命周期都从 1 个 active provider 变为 0，UI callback
error 为 0。

## 4. M6-2：确定性 Android/Java 类路径

生成器 `build-ecj-classpath.ps1` 读取固定的 SDK 36 `android.jar`，只复制排序后的 `.class`
条目，所有 ZIP 时间戳固定为 1980-01-01。它拒绝重复条目、目录、资源和策略外输出；`-Check`
会核对固定来源哈希、提交产物哈希、清单统计、必需类型和裁剪策略。

| 项目 | 固定值 |
|---|---|
| 来源 | Android SDK `platforms;android-36/android.jar` |
| 来源 SHA-256 | `d9eb9da824d9e247a352f570f01e1169e725b2954bca9e283a71786c59b59f9a` |
| 排除前缀 | `android/adservices/`、`android/health/`、`android/icu/` |
| 输出类数量 | 5,651 |
| 未压缩 class bytes | 11,599,893 |
| 输出 JAR bytes | 5,066,010 |
| 输出 SHA-256 | `01c9cf8ee9de431c52ea71975f53859fe1888af7bd50a62dd49d3458bdfdbc17` |

验证器明确要求 `java/lang/Object.class`、`java/util/ArrayList.class`、
`android/app/Activity.class` 与 `android/view/View.class`，并验证三个排除前缀下零 class。
JVM 与 ART 用例都编译引用 `ArrayList`、`Activity` 和 `View` 的源码，防止只靠清单通过。

### 4.1 8 MiB 随包交付门

| 组件 | 字节 | SHA-256 / 说明 |
|---|---:|---|
| ECJ 3.26.0 Maven 构件 | 3,133,846 | `ac0ba587…a2db5` |
| `android-36-stubs.jar` | 5,066,010 | `01c9cf8e…dbc17` |
| `autojs6_java_provider.js` | 14,360 | `83b4ae51…50d14` |
| `manifest.json` | 784 | `3add2266…8d03d` |
| `THIRD_PARTY_LICENSES.txt` | 1,697 | `7c881b42…1ee2` |
| **合计** | **8,216,697** | **7.836 MiB，8 MiB 的 97.95%** |

余量为 171,911 字节，因此无需可选下载，Java 诊断保持完全离线。相对 M5 最终 debug APK，
M6 debug APK 实际增加 8,312,261 字节（7.927 MiB），占 8 MiB 门的 99.09%，余量
76,347 字节；原始组件口径与 APK 压缩/dex 后口径都通过。

根 `THIRD_PARTY_NOTICES.md` 与随包 notices 已记录 ECJ EPL-2.0、Android/AOSP class stubs
和 OpenJDK 派生签名的适用许可。完整 JDT graph 只用于拒绝试验，不进入 APK，故不新增其
18 个构件的产品再分发项。

## 5. G6-0/M6-1 设备结果

下表是最终代码在四个当前可用环境的最后一次冷进程记录；“有效/语法/未解析”来自原生
G6-0 连续编译，“编辑器末次”来自完整 bridge → Provider → annotation 路径：

| 环境 | ABI | 有效源码 | 语法诊断 | 未解析诊断 | G6 PSS 增量 | 编辑器末次 | 编辑器 PSS 增量 | 结果 |
|---|---|---:|---:|---:|---:|---:|---:|---|
| Android 10 / API 29 | x86 | 713.25 ms | 84.35 ms | 64.77 ms | -53 KiB | 379.09 ms | 0 KiB | 通过 |
| Android 13 / API 33 | x86_64 | 873.76 ms | 140.36 ms | 88.65 ms | 11,786 KiB | 473.39 ms | 3,984 KiB | 通过 |
| Android 16 / API 36 | x86_64 | 1,769.92 ms | 322.37 ms | 60.55 ms | 13,575 KiB | 125.20 ms | 3,328 KiB | 通过 |
| Android 17 / API 37，16 KiB page | x86_64 | 1,854.62 ms | 167.22 ms | 162.47 ms | 13,709 KiB | 138.14 ms | 3,256 KiB | 通过 |

冷启动受四台模拟器并发调度影响；全部观测中的最慢有效源码冷编译为 3,239.20 ms，最大
G6 PSS 增量为 15,563 KiB，仍未触发 48/64 MiB 熔断。不同 WebView 初始化时序会产生 3–4
次 accepted/completed 请求，但所有环境均为零 reject、零 callback error，且只有最新文档
版本能发布。

## 6. G6-3：JDT CodeAssist 拒绝门

`jdt-codeassist-spike/` 固定 JDT Core 3.26.0，并通过 Gradle dependency locking 固定 POM
版本范围解析出的完整 graph。`reportProbe` 得到 18 个构件、14,859,587 字节，其中
`org.eclipse.jdt.core` 自身为 7,260,138 字节；graph 还包含 Eclipse resources/runtime/
filesystem/text、Equinox/OSGi 及 JNA。

D8 以 min API 28 成功处理整个 graph，`classes.dex` 为 11,409,632 字节，SHA-256
`422f0de056676264e2c149be1b20e088462a14a1d3ee846cf7ac45eb361bd6db`。这证明失败不是
“无法 dex 化”，而是 JDT 模型的运行时前提不成立：workspace-free probe 在桌面完整
classpath 与 ART 上都于 `ResourcesPlugin.getWorkspace()` 停止，尚未构造
`SearchableEnvironment`，更未到 `CompletionEngine.complete()` 或返回任何 proposal。

| ART 环境 | class load | PSS 增量 | heap 增量 | `CompletionEngine` | workspace 结果 |
|---|---:|---:|---:|---|---|
| API 29 x86 | 171.86 ms | 16,161 KiB | 475,256 B | 已加载 / 1 constructor | `IllegalStateException` |
| API 33 x86_64 | 55.90 ms | 11,814 KiB | 540,944 B | 已加载 / 1 constructor | `IllegalStateException` |
| API 36 x86_64 | 98.42 ms | 11,888 KiB | 360,720 B | 已加载 / 1 constructor | `IllegalStateException` |

API 36 还验证了现代 ART 对动态 DEX 只读文件的要求。试验 DEX 仅含 bytecode，未复制 Eclipse
`.properties`，因此 ART 错误消息显示 NLS key；桌面完整资源路径给出 workspace 已关闭/未就绪、
需要跟踪 `IWorkspace` OSGi service 的文本。两者的异常类型、调用位置与失败阶段一致；缺少
资源只影响消息格式，不是门禁失败的根因。

结论：要让这条路径工作，必须在 Android 内引入并正确启动 Eclipse Workspace/OSGi 模型，
再承担完整 JDT graph、资源、项目模型与生命周期成本；这已超出 M6“单文件 + 打包 stub”
范围。G6-3 因此判定未通过，11.4 MiB DEX 不提交、不打包。M6-4 按预先定义的降级路径关闭，
Java 保持“ECJ diagnostics + P2 completion”。未来只有出现不依赖 Eclipse workspace 的轻量
codeassist，或非目标 §13 的远程/桌面 LSP 形态被重新允许时，才重开该决策。

## 7. 自动化、回归与最终产物

本地/CI 入口：

```powershell
.\tools\ace-lsp\build-ecj-classpath.ps1 `
  -AndroidJar E:\.android\sdk\platforms\android-36\android.jar `
  -Check

.\gradlew.bat :app:verifyAutoJs6JavaSemanticRuntime
.\gradlew.bat :app:testDebugUnitTest
.\gradlew.bat :app:check
.\gradlew.bat :app:assembleDebug :app:assembleDebugAndroidTest

.\gradlew.bat -p tools\ace-lsp\jdt-codeassist-spike reportProbe
# 预期以 workspace unavailable 退出：
.\gradlew.bat -p tools\ace-lsp\jdt-codeassist-spike runProbe
```

验证层次：

- Node：stub ZIP 结构、排序/时间戳、哈希、类数量、排除策略、8 MiB 预算、桥接源码约束，
  以及 VM mock 下的 request/cancel/response/annotation/fallback/dispose；
- JVM：`ArrayList` 与 Android 类型解析、缺分号/未解析符号的 row/column、设置默认值、资产
  清单与 manager provider/capability snapshot；
- Android：四环境 G6-0 原生 compiler、完整 Java WebView 诊断、P2 completion 边界、状态
  telemetry 与 editor lifecycle；三环境额外执行不打包的手动 G6-3 DEX 门；
- 既有路由：API 29/33/36/37 各执行 `AceLanguageRoutingSmokeTest` 6/6，合计 24/24。

最终构建产物：

- debug APK：27,232,947 字节（25.971 MiB），SHA-256
  `0c74aeab400499b03b3497798e42b2bf13003507f16f1f84d0065c11eacc6a6e`；
- androidTest APK：27,968,852 字节（26.673 MiB），SHA-256
  `581c3c082b28d0180cc2b953777cb0b80fbfdcd4ebdbbec14f0d443618a2c579`；
- R8 release APK：17,728,484 字节（16.907 MiB），SHA-256
  `64d7ce98e0d71ece7a50d3ead1be1eb56da5a24bc73c78798dd744ec4259c7bf`。

release mapping 保留了 `javax.lang.model.SourceVersion` 与实际使用的 ECJ 内部 `Compiler`，并将
`BatchCompiler`、`EclipseCompiler` 及不可达的 JSR-199/269 工具路径裁掉。ECJ 原始 jar 的
`META-INF/services/javax.tools.JavaCompiler` 因而产生一条“服务实现已移除”的 R8 资源告警；
产品路径不调用 `ServiceLoader` 或 annotation processing，release 构建与 lint 均通过。

androidTest APK 的体积不属于发布物预算；它包含 ECJ 与 instrumentation 门禁测试代码。
G6-3 的 Eclipse Workspace/OSGi graph 和手动 DEX 均由试验步骤外部注入，不存在于产品或
androidTest APK。
