******

### 发行历史

******

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
