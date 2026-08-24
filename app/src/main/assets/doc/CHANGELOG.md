******

### 发行历史

******

# v1.1.10

###### 2026/08/24

* `新增` Ace TypeScript 诊断与编译插件的 TypeScript 6.0.3 revision-2 Rhino/Node profile 对齐 (ES2018, strict, CommonJS/Node10 或 NodeNext), 支持 Node 项目路由并默认启用 .mts/.cts 及其声明文件, 同时保留静态回退

# v1.1.9

###### 2026/08/21

* `新增` `ai.ask`/`ai.chat`/`ai.stream` 与持久 `ai.session` 的显式 backend profile 类型声明, 覆盖 `cpu`/`gpu`/`npu`, `ai.models` 设备可用性, 稳定不可用原因及禁止 CPU 回退语义

# v1.1.8

###### 2026/08/21

* `新增` `ai.ask`/`ai.chat`/`ai.stream` 与持久 `ai.session` 的原生结构化 JSON 类型声明, 覆盖 `structuredJson`, JSON 对象 `responseSchema` 及固定会话 schema

# v1.1.7

###### 2026/08/21

* `新增` 新增 `ai.session` 持久本机会话类型声明, 覆盖固定会话选项, 每轮仅接收新提示词的 `ask`/`chat`/`stream` 方法, 生命周期状态及显式关闭语义

# v1.1.6

###### 2026/08/21

* `新增` 完善 AutoJs6 本机 AI 插件类型声明, 覆盖多角色消息历史, 官方与第三方选择器, 生成参数, 精确用量及流式负载, 以及 `ai.models` 模型发现

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
