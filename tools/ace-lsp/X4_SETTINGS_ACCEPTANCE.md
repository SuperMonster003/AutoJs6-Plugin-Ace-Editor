# X-4 设置 UI 验收记录

验收日期：2026-08-31

任务：Roadmap X-4（语言支持矩阵、逐语言语义开关、文件类型白名单关系说明）

结论：**完成**。AutoJs6 宿主设置页与 Ace 插件共享同一份有序能力模型和偏好键；矩阵、
开关、迁移、门控顺序、本地化、自动化和四台真实 Android 设备均已验收。

## 1. 产品能力矩阵

设置页展示的是内置产品能力，不是当前开关快照。关闭语义服务不会降低对应语言的语法、
关键字、snippets 或本地补全层级。

| 语言 mode | 语法 | 关键字 | Snippets | 本地补全 | 语义 |
|---|---|---:|---:|---|---|
| JavaScript | Full | 支持 | 支持 | 支持 | Full |
| JSX | Full | 无 | 无 | 支持 | Full |
| TypeScript | Full | 支持 | 支持 | 支持 | Full |
| TSX | Partial | 支持 | 支持 | 支持 | Full |
| JSON | Full | 无 | 无 | 无 | 仅语法诊断 |
| Python | Full | 支持 | 支持 | 支持 | Full |
| Lua | Full | 支持 | 支持 | 支持 | Full |
| Java | Full | 支持 | 支持 | 支持 | 单文件诊断 |
| Kotlin | Full | 支持 | 支持 | P2+ | 无 |

Kotlin 不因缺少语义 Provider 而从 UI 消失。它在矩阵中明确显示 P2+，并在语义选择对话框中
以不可用项显示，防止用户把“没有开关”误解成“遗漏支持”。

## 2. 固定门控顺序

一个文档进入语义路径必须依次通过：

1. Ace 为当前编辑器且全局 LSP 开关开启；
2. 文档文件名命中“LSP 文件类型”白名单；
3. 后缀能被识别为 TypeScript/JavaScript、Python、Lua、Java 或 Kotlin 家族；
4. 产品确实为该语言提供语义 Provider；
5. 对应逐语言语义开关开启。

因此，自定义文件后缀只改变第 2 步。比如加入 `.foo` 会允许该文件进入 LSP 前置路径，
但不会把 `.foo` 重新解释为 Python、Java 或其他语言，也不会凭空创建 Provider。反过来，
从白名单移除 `.py` 会先阻断 Python 语义，即使 Python 的逐语言开关仍为开启。

可用开关及默认值：

| 开关 | 覆盖语言 | Provider | 默认 |
|---|---|---:|---:|
| TypeScript / JavaScript | `.js` / `.jsx` / `.ts` / `.tsx` 及模块、声明变体 | 有 | 开 |
| Python | `.py` | 有 | 开 |
| Lua | `.lua` | 有 | 开 |
| Java | `.java` | 有，单文件诊断 | 开 |
| Kotlin | `.kt` / `.kts` | 无 | 不可启用 |

## 3. 宿主与插件边界

真正的 Code editor settings Activity 位于 AutoJs6 宿主，插件 API 没有独立设置页组件。
宿主把全局 LSP、文件类型、声明组以及五个语言开关写入默认 SharedPreferences；插件通过
host context 读取相同键。两侧各自维护同构的纯模型并由测试/verifier 锁定，避免 UI 文案、
宿主路由和插件运行时产生不同解释。

文件类型 revision 从 2 升至 3。历史默认值会自动扩展 `.py`、`.lua`、`.java`、`.kt`、
`.kts`，用户真正自定义过的集合则原样保留。TypeScript 声明扩展名仍使用最长后缀优先匹配，
不会把 `.d.ts` 误判成普通 `.ts`。

## 4. 自动化验收

插件侧：

```powershell
.\gradlew.bat :app:testDebugUnitTest `
  --tests io.github.supermonster003.autojs6.plugin.ace.editor.core.AceEditorLspPreferencesTest

.\gradlew.bat :app:verifyAutoJs6LspRuntime
```

`verifyAutoJs6LspRuntime` 在既有 M0-M7 runtime 检查之外锁定：9 个有序 mode、5 个稳定偏好键、
4 个可用 Provider、Kotlin 不可启用，以及文件白名单先于语义路由。

宿主侧：

```powershell
.\gradlew.bat :app:testAppDebugUnitTest `
  --tests org.autojs.autojs.ui.edit.editor.ace.AceEditorLspPreferencesTest

.\gradlew.bat :app:assembleAppDebug :app:assembleAppDebugAndroidTest
```

宿主 JVM 用例覆盖默认值和 revision 2 迁移、完整矩阵、Provider 可用性、逐语言持久化、
自定义后缀不触发语言重分类、白名单优先级及声明组依赖。设备用例打开真实设置 Activity，
检查矩阵和三个 LSP 相关入口可见，滚动到 Kotlin P2+，关闭 Python 后验证 3/4 摘要，并确认
Kotlin 始终保持不可用。

默认 `values` 与 `values-en` 文本逐字节一致；英语、阿拉伯语、西班牙语、法语、日语、韩语、
俄语、简体中文、香港繁体和台湾繁体十种显式本地化均包含同样 16 个有序资源键。

## 5. 真实设备结果

| 设备 | Android / API | 验收路径 | 结果 |
|---|---|---|---|
| Sony G8441 | Android 9 / API 28 | 正常应用进程，矩阵、Kotlin P2+、4/4 开关及白名单说明 | 通过 |
| Sony XQ-AT72 | Android 12 / API 31 | `AceEditorLanguageSettingsDeviceTest` | 1/1，1.661 s |
| Sony XQ-DQ72 | Android 13 / API 33 | `AceEditorLanguageSettingsDeviceTest` | 1/1，1.964 s |
| Xiaomi 23046RP50C | Android 15 / API 35 | `AceEditorLanguageSettingsDeviceTest` | 1/1，3.086 s |

Android 9 的 host instrumentation 在 0 个测试进入前由厂商 ART 的
`ADB-JDWP Connection Control Thread` native abort；栈位于 `libart.so` 的
`ArtField::GetTypeDescriptor` / `FindFieldFast` 路径，与 M2/M3 已记录的 Sony Android 9
JDWP flake 相同，不能归因于 X-4 测试或设置代码。该设备随后绕开 instrumentation，在正常
应用进程中从公开 UI 入口完成同一内容核验；验收结束后插件启用、编辑器选择和日志面板偏好
均恢复为测试前值。

## 6. 最终产物

插件最终验证命令为：

```powershell
.\gradlew.bat :app:check :app:assembleDebug `
  :app:assembleDebugAndroidTest :app:assembleRelease --console=plain
```

141 个 task 中 28 个执行、113 个命中缓存，`BUILD SUCCESSFUL in 1m 5s`。最终插件产物：

- debug APK：24,640,090 字节（23.499 MiB），SHA-256
  `69dc69bfaf853b2fe6da101fcdc0365125ff9f64713f9e583cbebc24f8ef56e7`；
- androidTest APK：27,968,852 字节（26.673 MiB），SHA-256
  `b80cbeb86022083b044d9298de7504faffd125b4fca11039db2d35f4101e61bc`；
- R8 release APK：17,745,780 字节（16.924 MiB），SHA-256
  `85559871642d08178fef8f4baeb3624837a5e1424a2aee6e4879ecedbe97b265`。

宿主在 UI、10 种本地化 CHANGELOG 和设备测试代码完成后重新执行
`:app:assembleAppDebug :app:assembleAppDebugAndroidTest`，结果为：

- AutoJs6 debug APK：54,533,659 字节（52.007 MiB），SHA-256
  `4106744824c29236c3ccb4e72ecf51dd71fd9f6375731706f4731aeaf3aea4fc`；
- AutoJs6 androidTest APK：2,184,084 字节（2.083 MiB），SHA-256
  `41b333c69fa76fcebb9eb9ec0d8d75fed8190295fcd06ef28ad07fec2b582e30`。

最终重建相对真机验收只改变内置本地化 CHANGELOG，没有修改已验收的设置模型、资源或测试
代码。插件 androidTest APK 与 M7 哈希完全相同；X-4 没有新增语言 runtime asset。

## 7. 判定

X-4 的三个交付点全部完成：

- 9-mode 语言支持矩阵可从真实设置页查看；
- TypeScript/JavaScript、Python、Lua、Java 可独立控制，Kotlin 的不可用边界明确可见；
- 文件类型自定义与语义白名单的先后关系同时由 UI 文案、README、单测和 verifier 固定。

后续新增语言或 Provider 时必须先更新同一模型、默认迁移、10 种本地化、runtime verifier 和
设备用例，不能只增加文件后缀或只修改展示文案。
