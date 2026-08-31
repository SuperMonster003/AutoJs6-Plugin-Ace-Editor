# M7 Kotlin 验收记录

验收日期：2026-08-31

里程碑：Roadmap M7（Kotlin 设备内语义探索）

结论：**按验证门完成，但不接入 Kotlin 语义引擎**——G7-0 未通过，M7-1/M7-2 按既定
降级路径关闭；M7-3 Kotlin P2+ 已实现并通过自动化与三台真实 Android 设备验证。

## 1. 最终交付边界

产品没有打包 kotlinc、Analysis API、IntelliJ runtime、额外 JDK 或新的伴生进程。Kotlin
语义开关继续默认关闭，编辑器不宣称 Kotlin diagnostics、semantic completion、hover、
signature help 或 definition 能力。

本次实际交付的是完全离线、按首次 Kotlin 请求懒加载的 P2+：

- Kotlin 2.2.21 顶层与常用实例 API 索引；
- `String`、数组、只读/可变集合、`Sequence`、`IntRange`、数值、`StringBuilder`、`Regex`
  等常用类型的成员候选；
- 当前文件的显式类型、函数/构造参数、常用初始化函数、构造器、基础字面量、range 与
  `as`/`as?` 强转的保守类型启发；
- Kotlin `?.` safe-call 的成员补全与 hover；
- 从同一份 Java 生成结果复用的精选 Java/Android 静态及实例 API，例如 `Log`、`File`、
  `Path`、`ArrayList`、`HashMap`、`Context`、`Intent`、`Bundle`、`View` 与 `Uri`；
- 推断不到或别名链无法解析时返回空成员集，不退回 JavaScript `Object.prototype`，也不
  伪造语义结果。

该能力只观察当前文本，不读取 Gradle 项目模型、classpath、相邻 Kotlin/Java 源文件、
Android 资源或外部依赖，不做重载解析、泛型推导、nullability flow analysis 或跨文件引用。

## 2. G7-0 候选调研

### 2.1 Kotlin compiler frontend

门禁选择 `org.jetbrains.kotlin:kotlin-compiler-embeddable:2.2.21` 作为“最小可实际编译单文件”
候选。版本与依赖通过独立 Gradle lock 固定，桌面控制组直接调用 `K2JVMCompiler.exec`，不
通过 Gradle Kotlin plugin，也不解析命令行本地化文本来判断结果。

[Maven Central 的 2.2.21 构件目录](https://repo1.maven.org/maven2/org/jetbrains/kotlin/kotlin-compiler-embeddable/2.2.21/)
显示 compiler 本体就是大型构件；本地解析的 embeddable JAR 为 56,908,512 字节。即使先不
加入 Android classpath、项目模型或编辑器协议层，它也已经远超单语言 8 MiB 交付门。

### 2.2 Standalone Analysis API

[Kotlin 2.2.21 Analysis API 构建定义](https://github.com/JetBrains/kotlin/blob/v2.2.21/analysis/analysis-api/build.gradle.kts)
依赖 IntelliJ core、ASM、Guava 及多个 compiler/analysis 模块；API 中还有实验性或非公开
边界。由此推断，Standalone Analysis API 不是比 CLI frontend 更轻的 ART 候选。CLI frontend
已在体积和 ART 运行时两项失败后，不再投入更重的 Analysis API dex 化工作。

### 2.3 Android IDE 社区先例

[AndroidIDE](https://github.com/AndroidIDEOfficial/AndroidIDE) 曾提供设备内 Kotlin 语言能力，
但它是带终端、构建系统与设备内 JDK 11/17 的完整 IDE 形态，而且仓库已归档。这个先例说明
“在完整设备 IDE/JDK 环境中运行 Kotlin 工具链”可行，不说明“在最低 API 24 的 AutoJs6
插件进程中嵌入轻量 compiler/Analysis API”可行。把完整 JDK/IDE 模型引入插件超出 M7 与
Roadmap §13 的边界。

## 3. 可复现探针

`tools/ace-lsp/kotlin-compiler-spike/` 是不进入产品 APK 的独立项目：

- `gradle.lockfile` 固定 Kotlin compiler 图和 `com.android.tools:r8:8.10.21`；
- `reportProbe` 输出 compiler 图、逐构件字节数和合计；
- `runProbe` 在桌面 JVM 连续编译合法源码、语法错误和未解析符号；
- `d8Probe` 以 min API 24 将完整 compiler 图转换为 multi-dex；
- `packageArtProbe` 把六个 DEX 与 compiler 的 service/builtins 资源合成只用于注入测试的 ZIP；
- `AceKotlinCompilerArtGateTest` 使用只读外部 ZIP、`DexClassLoader` 与原始 stdlib JAR 在 ART
  上执行同样三类编译，并记录 class-load、heap 与 PSS。

完整复跑命令：

```powershell
.\gradlew.bat -p tools\ace-lsp\kotlin-compiler-spike `
  reportProbe runProbe packageArtProbe --write-locks --console=plain
```

ART ZIP 和 stdlib 由测试者显式注入应用私有目录；常规 instrumentation 未传两个参数时会
skip。探针构件、D8 输出和 ZIP 均在忽略的 `build/` 下，不属于源代码或发布物。

## 4. Compiler 图、桌面控制组与 D8

### 4.1 固定依赖图

| 构件 | 字节 |
|---|---:|
| `kotlin-compiler-embeddable-2.2.21.jar` | 56,908,512 |
| `kotlin-reflect-1.6.10.jar` | 3,038,560 |
| `kotlin-stdlib-2.2.21.jar` | 1,761,445 |
| `kotlinx-coroutines-core-jvm-1.8.0.jar` | 1,548,360 |
| `kotlin-daemon-embeddable-2.2.21.jar` | 347,987 |
| `kotlin-script-runtime-2.2.21.jar` | 44,769 |
| `annotations-13.0.jar` | 17,536 |
| **合计** | **63,667,169（60.718 MiB）** |

原始图为 8 MiB 门限的 758.96%，还未计 Android classpath、协议、资源或 Provider。

### 4.2 桌面 JVM 控制组

最后一次从固定任务得到：

| 输入 | 结果 | 耗时 | 观测堆增量 |
|---|---|---:|---:|
| 合法单文件 | `OK` | 3,403.65 ms | 47,054,464 B |
| 参数名缺失的语法错误 | `COMPILATION_ERROR` | 131.14 ms | 0 B |
| 未解析 `missingValue` | `COMPILATION_ERROR` | 249.12 ms | 16,970,104 B |

这证明探针调用方式和三类期望本身有效。堆增量是调用前后的保守快照，不是 GC 稳态峰值；
它只用于量级判断，不作为精确 profiler 数据。

### 4.3 R8/D8 8.10.21，min API 24

| 输出 | 字节 | SHA-256 |
|---|---:|---|
| `classes.dex` | 10,179,992 | `2e9ec1eb5a39ba96fbe2aff796fa3841e827b9ae974ce1a8e0644994b8cdaad5` |
| `classes2.dex` | 13,314,836 | `ebd524830a635afb04ff1e39242ace8e0b5fba8514bca37ad3f49e65bed3cd0b` |
| `classes3.dex` | 12,380,180 | `5816d7e2061de18b9acc023323d0d0a26a8e4e4989c40115ab2517215aa5e7e7` |
| `classes4.dex` | 13,732,068 | `7b7ad2ed8c3909d77e5f2ea9ae673b245abf7ce13628da2bb614dd249cc6476e` |
| `classes5.dex` | 8,188,456 | `b54499178f75f1af45ac78b0007c050fd31f28c468e9673ab41e5303ed240ea6` |
| `classes6.dex` | 3,323,644 | `c66db95dc64b94f450fdf263b87a7c98680baa07660d8e1829e9327471345a73` |
| **合计** | **61,119,176（58.288 MiB）** | — |

带 service 与 `.kotlin_builtins` 资源的可注入 ZIP 为 22,309,910 字节，SHA-256
`94d90391f43180b599351200b888c8965595f11691047d62b9374f73e40ab1f0`。压缩后仍是 8 MiB
门的 265.95%，解压 DEX 则是 728.60%。

D8 能完成转换，但对 compiler 内嵌 IntelliJ `PathManager`、message bus、`Unsafe`、
`UrlClassLoader`、`ByteBufferUtil` 等路径反复报告 `MethodHandle.invoke/invokeExact` 仅从 API 26
支持。项目最低 API 为 24，所以即使更高 API 的功能错误被修复，这个图仍不满足当前最低
系统兼容门。

## 5. ART 结果与 G7-0 判定

最终固定的六 DEX ZIP 在两台 arm64 真机上的结果如下；三个 compile 耗时在首次异常后只
表示失败返回开销，并不代表成功诊断延迟：

| 环境 | class load | 合法文件尝试 | PSS 增量 | 结果 |
|---|---:|---:|---:|---|
| Android 12 / API 31 | 392.66 ms | 33.43 ms | 64,110 KiB | `IllegalStateException` |
| Android 15 / API 35 | 329.10 ms | 27.13 ms | 78,343 KiB | `IllegalStateException` |

两台设备都在产生第一个 `ExitCode` 前停止，错误固定为
`Java field should be present for property fragments (Kotlin reflection is not available)`；合法、
语法错误和未解析输入均没有得到 compiler exit code 或消息。API 35 的 PSS 已在失败前增加
约 76.5 MiB。此前 API 28 的同一 compiler 图也在相同反射路径失败；使用最终 R8 multi-dex
复测时该厂商 Android 9 ART 在 instrumentation 启动的 JDWP 线程发生 native crash，未将这次
与 compiler 调用无关的结果计入性能表。

G7-0 判定为不通过，且每一项都可独立拒绝：

1. 固定 compiler 图、DEX 和压缩注入包分别超过 8 MiB 门约 7.59 倍、7.29 倍和 2.66 倍；
2. API 31/35 无法完成一个合法 Kotlin 单文件，失败不是诊断文本解析问题；
3. 失败前 PSS 增量最高 78,343 KiB，已经超过轻量编辑器组件的合理常驻量级；
4. min API 24 存在明确的 MethodHandle 兼容告警；
5. 更完整的 Analysis API 还会增加 IntelliJ/analysis 依赖，不能解决上述最小候选的失败。

因此 M7-1 diagnostics 与 M7-2 semantic completion 关闭，不创建 Kotlin Provider，不修改
默认设置，也不把探针依赖写入 app 配置或 notices。探针只在开发时解析 Apache-2.0 Kotlin
构件和 R8，不构成产品再分发。

## 6. M7-3 Kotlin P2+ 实现

### 6.1 确定性索引

| 索引 | revision | 全局 | 模块 | 成员 | 文件字节 | UTF-16 估算 |
|---|---|---:|---:|---:|---:|---:|
| Java | `autojs6-java17-android35-subset-2` | 42 | 31 | 293 | 69,586 | 102,406 B |
| Kotlin | `autojs6-kotlin-2.2.21-p2plus-2` | 95 | 44 | 492 | 122,977 | 182,762 B |

生成器先构造唯一的 Java index，再把选择列表中的 module/global/alias 复制进 Kotlin index；
不是手工维护两份 Android 签名。独立验证器逐成员比较 `Log`、`java.io.File`、
`android.content.Intent`、`android.os.Bundle` 与 `android.view.View`，保证复用结果没有漂移。

相对 M6，四个生产 asset 的合计增长为 136,209 字节：completer 1,679、local-symbol extractor
7,033、Java index 27,242、Kotlin index 100,255。没有新增 Kotlin runtime asset；P2+ 核心增量
约 0.130 MiB，仍显著低于 M2 的 3 MiB 预算。

### 6.2 保守类型启发

| 来源 | 示例 | 目标上下文 |
|---|---|---|
| 显式类型 | `val names: List<String>?` | `kotlin.collections.List` |
| 函数/主构造参数 | `input: String?`、`val items: List<T>` | 相应 stdlib module |
| 集合工厂 | `listOf`、`mutableMapOf`、`sequenceOf` | 只读/可变集合或 sequence |
| 数组工厂 | `arrayOf`、`intArrayOf` 等 | `kotlin.Array` |
| 构造器/import alias | `Intent(...)`、`File(...)` | Java/Android instance module |
| 静态工厂 | `Uri.parse(...)` | Android `Uri` instance module |
| 字面量/range | 字符串、Boolean、整数、Long、浮点、`1..10` | 对应 Kotlin module |
| cast | `value as Type`、`value as? Type` | cast 的显式类型 |

类型文本只去除顶层 nullability 和泛型参数，不尝试求解泛型实参。推断结果是当前文档 alias
链；completer 最多跟随八跳并检测循环。未知函数调用、自定义表达式或不完整源码不会被猜成
`Object`。safe-call 只规范化成员链中的 `?.`，候选 caption 仍保留用户输入形式。

## 7. 自动化与真实 WebView 验收

新增任务：

```powershell
.\gradlew.bat :app:verifyAutoJs6KotlinP2Plus
```

该任务先执行四语言确定性生成检查，然后在 Node VM 中加载真实 local extractor、completer、
Java/Kotlin 提交索引，验证 16 类推断 alias、safe-call completion/hover、字面量、静态互操作、
实例互操作、五个 Java 复用 module、规模与 2 MiB 预算。它已挂入 `:app:check`。

通用 `verifyAutoJs6LspRuntime` 另以真实 lazy loader 回归 `List`、`MutableList`、nullable
safe-call、`Intent`、`File` 与 `Log`。最后一次完整 check 中 Kotlin 索引 VM 加载为 4.186 ms，
低于 50 ms 门。

最终 Kotlin WebView P2+ 用例在三台 arm64 真机通过：

| 环境 | 测试耗时 | 结果 |
|---|---:|---|
| Android 9 / API 28 | 3.039 s | 1/1 |
| Android 12 / API 31 | 1.418 s | 1/1 |
| Android 15 / API 35 | 1.866 s | 1/1 |

同一用例从编辑器完整路径切换 `.kt` mode，检查按需索引、当前文件函数、推断 List、nullable
safe-call、Android `Intent` 与跨语言隔离。三台设备均运行最终生产 assets，非 Node mock。

本地最终验证集合包括：

```powershell
.\gradlew.bat :app:verifyAutoJs6KotlinP2Plus `
  :app:verifyAutoJs6LspRuntime `
  :app:testDebugUnitTest `
  :app:compileDebugAndroidTestKotlin

.\gradlew.bat :app:check
.\gradlew.bat :app:assembleDebug :app:assembleDebugAndroidTest
```

最终构建产物：

- debug APK：24,444,180 字节（23.312 MiB），SHA-256
  `a54cb6e6d7d9854fbef6cf8ebb4b7339276809b5877a4927fff5ee4e16b3cdcf`；
- androidTest APK：27,968,852 字节（26.673 MiB），SHA-256
  `b80cbeb86022083b044d9298de7504faffd125b4fca11039db2d35f4101e61bc`；
- R8 release APK：17,742,752 字节（16.921 MiB），SHA-256
  `fab8987e6313dff9458d3648240b92abac7b6e84f3615410022df62491ba0fab`。

androidTest APK 包含手动 G7-0 测试类，但不包含 compiler graph 或注入 ZIP。release APK 相对
M6 基线只增加约 13.93 KiB 的压缩内容，证明 60 MiB 级 compiler/Analysis API 没有误入产品。

## 8. 未来重启条件

只有至少满足下列一种外部条件时才重开 M7-1/M7-2：

- 官方提供不依赖完整 IntelliJ/JDK 服务的轻量 standalone Kotlin frontend/Analysis API，并能
  在 API 24 与当前 target API 上完成合法/语法错误/未解析三类单文件；
- 候选随包图不超过 8 MiB，或产品明确批准可选下载；冷启动不超过 5 秒、稳态诊断不超过
  500 ms、失败前后 PSS 增量不超过 64 MiB，且 editor destroy 后可完整释放；
- Roadmap §13 重新允许远程/桌面 LSP，或宿主正式提供受支持的设备内 JDK/项目服务边界。

重开时仍须先建新的验证门，不得因为 Kotlin index 已有类型启发就把 P2+ 标记成 semantic
completion。当前结论是“轻量、可用的 Kotlin P2+ 已交付；设备内完整 Kotlin 语义明确未交付”。
