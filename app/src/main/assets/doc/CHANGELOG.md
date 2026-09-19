******

### 发行历史

******

# v1.10.0

###### 2026/09/19

* `修复` AGP 9.1 构建时的 SDK XML v4 解析警告及 JVM 单元测试组装任务误触发 APK 原生库对齐检查的问题 (共享构建插件 1.8.3)
* `优化` 内置 AutoJs6 声明更新至 `4.17.0`: Level / LogConfigurator / LogManager 代理改为指向内置的 `org.autojs.autojs.core.console.log` 类, 三方库声明不再包含宿主已移除的库 (log4j, Flexmark, JavaMail, JUnit, github-api, Jackson, commons-io / lang3, kotlin-reflect, SpongyCastle, media3, Guava)

# v1.9.0

###### 2026/09/16

* `新增` 坐标点击 API 与 Flow 任务栈声明, 同步 LSP 补全与索引

# v1.8.0

###### 2026/09/16

* `新增` Flow 可选步骤, 有界循环与稳定快照的类型声明和 LSP 补全

# v1.7.2

###### 2026/09/16

* `优化` 继 compileSdk 之后将 targetSdk 提升到 37 (Android 17), 插件行为不受新目标版本影响

# v1.7.1

###### 2026/09/15

* `优化` 将 compileSdk 提升到 37 (Android 17), targetSdk 保持 36, 待依赖目标版本的行为验证后再提升

# v1.7.0

###### 2026/09/15

* `优化` 同步 AutoJs6 4.16.0 声明中的 images.matchFeatures 图片参数与 RANSAC 选项, ObjectFrame 几何属性与匹配统计, 以及 ImageFeatures 的 count 与 method, 更新资源与依赖声明并重新生成 LSP 分组

# v1.6.0

###### 2026/09/14

* `优化` 同步 AutoJs6 4.15.0 声明中的 images.matchTemplate scales 选项, 模板匹配项几何属性及 MatchingResult 辅助方法, 更新资源与依赖声明并重新生成 LSP 分组

# v1.5.0

###### 2026/09/14

* `优化` 同步 AutoJs6 4.14.0 声明中的 images.countPointsByColor, images.getMeanColor, images.readPixels 及 colors.distance / invert / blend / contrast 系列方法, 更新资源与依赖声明并重新生成 LSP 分组

# v1.4.0

###### 2026/09/14

* `优化` 同步 AutoJs6 4.13.0 声明中的 LaunchConfig.requiresSharedStorage, 更新资源与依赖声明并重新生成 LSP 分组

# v1.3.0

###### 2026/09/13

* `新增` `pangu` 文本间距声明与补全, 覆盖 `spaceText`, `hasProperSpacing` 与带类型的模块导入; 同步 AutoJs6 声明 4.12.0 并重新生成 LSP 分组

# v1.2.0

###### 2026/09/13

* `修复` 修复 Lua 工作区路径, TypeScript 依赖快照和语言服务器测试终止操作的 Android 7 兼容性
* `修复` 在通知订阅者之前清理失败的字体下载及临时文件租约
* `优化` 校验发行签名配置, 预期 APK 集合与可复现文档
* `优化` 可选择设备 ABI 对应的 APK 或 universal APK. Lua 语义分析支持 arm64-v8a, armeabi-v7a 和 x86_64; x86 保留编辑器和静态补全.

# v1.1.28

###### 2026/09/13

* `修复` `runtime.requestPermissions` 通用权限名的类型声明与数组示例, 支持 `access_local_network`; 同步 AutoJs6 声明 4.11.1 并重新生成 LSP 分组

# v1.1.27

###### 2026/09/13

* `优化` `device.pageSize` 只读数值声明与补全, 同步 AutoJs6 声明 4.11.0 并重新生成 LSP 分组

# v1.1.26

###### 2026/09/12

* `优化` OCR 声明与补全支持引擎自动选择, 实际模式读取, tap 重置及单次调用模式选项; 同步 AutoJs6 4.10.0 声明并重新生成 LSP 分组

# v1.1.25

###### 2026/09/11

* `优化` 构建阶段校验 64 位原生库的 16 KB 页大小对齐, 检查 manifest 契约并输出 JSON 报告

# v1.1.24

###### 2026/09/10

* `优化` MediaInfo 查询声明与补全覆盖 streamNumber, countGet, infoKind 和查询能力

# v1.1.23

###### 2026/09/08

* `新增` 内置 AutoJs6 `4.8.1` 控制台声明更新: 恢复 `console.rawInput` / `console.input`, 新增 `setTimeVisible` / `setTimeFormat` / `setColorful` / `setAvoidStatusBar` / `setInputVisible` 方法及对应的 `console.build` 选项, JSX 新增 `<console>` / `<globalconsole>` 元素及属性声明; 主应用声明由 AutoJs6 6.8.0 (5279) 重新生成

# v1.1.22

###### 2026/09/07

* `新增` 内置 AutoJs6 `4.8.0` 无障碍自动化声明及重新生成的 LSP 分组: `Flow` 链式对象与 `flow` 命名空间, 工具集 (`smartClick`, `scrollUntil`, `typeInto`, `dismissPopups`, `collectList`, `launchAndWait`, `backUntil`, `toggle` 等), 事件驱动等待, `auto.explain` / `auto.dump` / `auto.stats`, 字符串选择器 `select(syntax)` 与 `findIterator`, 主应用声明由 AutoJs6 6.8.0 (5278) 重新生成

# v1.1.21

###### 2026/09/01

* `新增` 内置 AutoJs6 `4.7.0` Pinyin 声明及重新生成的 LSP 分组: `customDictionary` 支持仅当前调用生效的自定义读音覆盖, `compare` 返回数值排序结果, `compact` 返回候选矩阵笛卡尔积, 并同步共享插件 API 类型

# v1.1.20

###### 2026/09/01

* `优化` 同步内置主应用声明及生成的 LSP 分组中的 Previewer 命名

# v1.1.19

###### 2026/09/01

* `修复` Ace WebView 在宿主主题与首份文档生效前可能短暂暴露纯白背景, 尤其会在深色编辑器主题下产生明显闪烁; 首屏现由主题已应用, 文档已提交及稳定绘制信号共同放行, 不依赖固定延迟
* `优化` 将约 1.3 MiB 的完整 AutoJs6 补全索引移出首屏同步路径, 在首个可见代码帧后的空闲时段加载并无缝替换基础索引; 五个 Android 9-15 环境均恢复 400 个全局项与 80 个模块
* `优化` 统一 README 版式与 Gradle 平台版本管理方式
* `优化` 精简插件描述并规范多语言资源中的标点符号

# v1.1.18

###### 2026/08/31

* `新增` 内置 AutoJs6 `4.6.0` 资源安全的 PNG 量化声明及重新生成的主应用 LSP 分组: 可配置的 `maxPixels` 与 `maxMemoryBytes` 预算超限时返回带详情的类型化错误, 结果公开 `peakWorkingMemoryBytes`, 取消 API 覆盖显式请求与脚本退出
* `新增` Python, Lua, Java 与 Kotlin 离线 P1 语言支持: 按扩展名路由 Ace mode, 提供语法高亮, 本语言关键字, snippets 与文档单词补全; Lua 额外启用 worker 语法诊断, 四门语言均与 AutoJs6/TypeScript 候选严格隔离
* `新增` Python, Lua, Java 与 Kotlin 离线 P2 补全: 按需加载固定版本的标准库索引, 并提取当前文档的 import, 函数, 类, 方法, 参数和变量; 严格保持跨语言隔离及现有 JavaScript/TypeScript 行为
* `新增` 新增可插拔八能力语义 Provider, 通用 JSON-RPC/LSP 核心及 WebWorker/设备内 stdio 双传输; TypeScript 已零回归迁移, provider 故障时自动降级至 P2, 四门新语言语义开关默认关闭
* `新增` 通过固定版本的 Pyright 1.1.413 Worker 和 271 个 typeshed 文件内置完全离线的 Python 3.12 语义: 类型补全, hover, 签名帮助, 诊断和定义跳转现默认开启, 不兼容的老 WebView 与运行故障会静默降级至 P2
* `新增` 通过固定版本的 LuaLS 3.18.2 设备内伴生进程内置完全离线的 Lua 语义: 补全, hover, 签名帮助, 诊断和定义跳转在 arm64-v8a, armeabi-v7a 与 x86_64 默认开启; 原生资产缺失或损坏, 不支持的 ABI 与进程崩溃会静默降级至 P2, 并以有界退避恢复
* `新增` 通过固定版本的 ECJ 3.26.0 与裁剪的 Android API 36 存根内置完全离线的 Java 单文件诊断: 语法错误与未解析符号现默认获得精确范围标注; JDT Code Assist 依赖 ART 上不可用的 Eclipse Workspace/OSGi 运行时, 因此补全继续使用 P2
* `新增` Kotlin P2+ 离线补全: 扩充 Kotlin 2.2.21 实例 API, 根据当前文件做保守类型提示, 支持 safe-call 并复用 Java/Android 索引; 设备内 compiler 因体积, ART 运行, 内存与最低 SDK 验证未通过, 因此不打包 Kotlin compiler 或语义运行时
* `新增` 在 AutoJs6 代码编辑器设置中展示同一份 9-mode 语言支持矩阵, 并为 TypeScript/JavaScript, Python, Lua 与 Java 提供逐语言语义开关; Kotlin 以 P2+ 不可用状态保持可见, 文件类型自定义明确作为白名单而非语言重分类

# v1.1.17

###### 2026/08/31

* `新增` 内置 AutoJs6 `4.5.0` 色彩正确的 PNG 量化声明及重新生成的主应用 LSP 分组: `images.quantizeToFile` 直接写入文件并返回大小与质量指标, `preserveAlpha` 控制透明或不透明输出

# v1.1.16

###### 2026/08/30

* `新增` 内置 AutoJs6 `4.4.0` PNG 量化结果声明及重新生成的主应用 LSP 分组: `images.quantize` 返回编码字节, 大小, 实际质量与量化误差; 显式质量下限无法满足时公开类型化 `QualityTooLowException`

# v1.1.15

###### 2026/08/30

* `新增` 内置 AutoJs6 `4.3.0` PNG 量化选项声明及重新生成的主应用/资源 LSP 分组: `Images.PngQuantizationOptions` 覆盖调色板大小, 速度, 质量区间, 抖动与 posterize, 并保留数字 `quality` 兼容性

# v1.1.14

###### 2026/08/29

* `新增` 新增通过 F2 与移动端 `重命名` 触发的项目范围 TypeScript 符号重命名: Ace 从精确项目快照生成有界跨文件编辑并请求 AutoJs6 contract 5 授权, 预览, 冲突检查, 原子发布, 回滚及全部磁盘写入均完全由宿主负责
* `新增` 新增 TypeScript 自动导入与拼写快速修复, 可通过 Ctrl/Command+. 或移动端 `快速修复` 触发: Ace 仅接受当前缓冲区内的有序编辑, 请求 AutoJs6 6.8.0 (5276) 进行 contract 4 授权, 并将批准结果作为一次可撤销修改应用
* `新增` TypeScript 跨文件智能现已覆盖项目源码和冻结依赖声明中的补全, hover, 签名帮助及定义跳转; F12, Ctrl/Command+点击和移动端 `转到定义` 会发送 contract 3 目标, 由 AutoJs6 6.8.0 (5276) 在打开和定位前独立复验
* `新增` 新增宿主提供的 TypeScript 项目诊断: Ace 现会校验并加载完整的有界源码快照, 解析项目文件间的 import, 并按运行前编译的相同规则标出缺失模块; 需要 AutoJs6 6.8.0 (5276) 或更高版本
* `新增` TypeScript 项目类型层现会在继续编辑前检测原生 addon 信号和安装生命周期 hook, 发布与宿主及编译器一致的稳定依赖边界错误和纯 JavaScript/WASM 替代指引
* `新增` Ace 依赖类型权威已同步 resolver policy revision 3, 并包含 lodash 4.17.21 与 `@types/lodash` 4.17.25 覆盖, 确保运行时包未内置声明时 Rhino 与 Node 的诊断仍保持一致
* `新增` 新增与 TypeScript 编译器共用的冻结项目依赖类型层: Ace 现可解析 package `types`/`typings`, TypeScript 6 `typesVersions`, 嵌套声明与已安装 `@types`, 并在 Rhino 和 Node profile 中提供一致的 dayjs 补全, hover 与 strict 诊断
* `新增` 内置 AutoJs6 `4.2.0` R8 声明与生成的 LSP 分组: `ScriptRuntime.loadJarWithR8` 的 6 个重载支持经校验的 mapping/seeds/usage/retrace metadata 导出, `retraceR8Stack` 通过协议 1.1 执行溯源绑定的堆栈还原, 提供者选择失败时禁止回退

# v1.1.13

###### 2026/08/26

* `新增` 内置 AutoJs6 `4.1.0` 最终插件唯一 AI 声明: 省略选择器时使用官方 3-Stone AI 默认目标, 所有请求只接受插件 `target` 路由和标准 `timeout`, 并移除宿主侧直连配置, 凭据和过渡事件类型

# v1.1.12

###### 2026/08/26

* `新增` 内置 AutoJs6 统一 AI 目标声明: `ai.catalog`, `target` 精确路由, 本机与在线目标, 完整响应及会话元数据, reasoning 输出和稳定的禁止回退错误; 同时移除所有未发布的旧 AI 目录 API 与兼容别名

# v1.1.11

###### 2026/08/25

* `新增` 在 AutoJs6 声明与生成的 LSP 分组中内置 `ScriptRuntime.loadJarWithR8` 的 3 个显式重载, 覆盖 keep rules, 有序 classpath 与 consumer-rule ordinal 绑定

# v1.1.10

###### 2026/08/24

* `新增` Ace TypeScript 诊断与编译插件的 TypeScript 6.0.3 revision-2 Rhino/Node profile 对齐 (ES2018, strict, CommonJS/Node10 或 NodeNext), 支持 Node 项目路由并默认启用 .mts/.cts 及其声明文件, 同时保留静态回退

# v1.1.9

###### 2026/08/21

* `新增` `ai.ask`/`ai.chat`/`ai.stream` 与持久 `ai.session` 的显式 backend profile 类型声明, 覆盖 `cpu`/`gpu`/`npu`, `ai.catalog` 设备可用性, 稳定不可用原因及禁止 CPU 回退语义

# v1.1.8

###### 2026/08/21

* `新增` `ai.ask`/`ai.chat`/`ai.stream` 与持久 `ai.session` 的原生结构化 JSON 类型声明, 覆盖 `structuredJson`, JSON 对象 `responseSchema` 及固定会话 schema

# v1.1.7

###### 2026/08/21

* `新增` 新增 `ai.session` 持久本机会话类型声明, 覆盖固定会话选项, 每轮仅接收新提示词的 `ask`/`chat`/`stream` 方法, 生命周期状态及显式关闭语义

# v1.1.6

###### 2026/08/21

* `新增` 完善 AutoJs6 本机 AI 插件类型声明, 覆盖多角色消息历史, 官方与第三方选择器, 生成参数, 精确用量及流式负载, 以及 `ai.catalog` 模型发现

# v1.1.5

###### 2026/08/21

* `新增` 同步 AutoJs6 YOLO 独立插件目标检测类型声明, 包括显式 Provider 组件, 会话与检测选项, 检测结果和稳定错误代码

# v1.1.4

###### 2026/08/20

* `新增` 同步 AutoJs6 AI 插件的 `Ask`, `Chat` 和 `Stream` 类型声明, 包括官方/第三方插件选择, 本地生成参数, 路由响应和流式事件类型

# v1.1.1

###### 2026/07/28

* `修复` 修复可选声明组的静态成员补全, 包括 `App.CHROME` 和大型 `R.string.text_*` 资源集; Ace 截断候选列表现在会随前缀变化进行防抖刷新
* `修复` 修复普通大文档被误判为超长行并切换到纯文本模式, 导致 JavaScript 高亮, 补全和语义服务失效的问题; 真正的超长单行仍会启用安全模式
* `修复` 修复 Ace 签名/参数提示气泡始终使用亮色背景的问题, 现在会随编辑器主题动态应用背景色和前景色; 切换主题时也会单独刷新已存在的自动补全候选菜单
* `修复` 修复系统文本选择 ActionMode 无法跟随 Ace 配色的问题, 现改用编辑器自有且可感知调色板的选择工具栏, 使选择操作, 按压状态和更多面板在各 Android 版本中均跟随当前 Ace 配色

# v1.1.0

###### 2026/07/27

* `新增` 保留完整原始声明, 并支持选择 AutoJs6 LSP 声明分组: `core` 始终启用, `android`, `libraries`, `resources` 和 `main-app` 默认关闭; 选择 `libraries` 会同时启用 `android`, 选择 `main-app` 会同时启用 `android`, `libraries` 和 `resources`
* `新增` 提供 `:app:generateAutoJs6LspDeclarations` Gradle 任务, 用于校验声明并生成五个 LSP 分组及其 manifest; 常规资产合并会自动调用该任务, 外部脚本也可直接调用
* `依赖` 内置 TypeScript 语言服务和标准库声明由 `4.2.4` 升级至 `6.0.3`

# v1.0.0

###### 2026/07/21

* `新增` Ace 编辑器独立插件, 插件 ID 为 `ace-editor`, 引擎为 `editor`, 变体为 `ace`
* `新增` 支持通过受 `org.autojs.permission.PLUGIN` 保护的 `org.autojs.plugin.INFO` 和 `org.autojs.plugin.EDITOR` 组件发现插件, Editor API 合约为 1, 最低宿主 build 为 `5234`
* `新增` Ace `1.4.12` 编辑能力, 包括撤销/重做, 搜索替换, 正则与整词查找, 光标与选区导航, 行操作, 断点, 注释切换和代码格式化
* `新增` 内置 JavaScript/TypeScript 语言服务与 AutoJs6 类型声明, 支持补全, hover, diagnostics 和 signature help, 并为 JSON 文件提供语法诊断
* `新增` 增量文本同步, CRLF 保留, 大文本分块加载, 超长行轻量模式和 IME 适配
* `新增` 主题与显示设置, 以及带签名目录和文件完整性校验的字体下载, 缓存, 安装与删除功能
* `新增` WebView 运行健康监测, 心跳检测和宿主原生编辑器回退通知
* `新增` 插件信息, README 和 CHANGELOG 的西班牙语/法语/俄语/阿拉伯语/日语/韩语/英语/简体中文/香港繁体/台湾繁体本地化
