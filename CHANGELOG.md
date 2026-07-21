# 发行历史

## v1.0.0

###### 2026/07/21

- `新增` Ace 编辑器独立插件, 插件 ID 为 `ace-editor`, 引擎为 `editor`, 变体为 `ace`
- `新增` 支持通过 `org.autojs.plugin.INFO` 和 `org.autojs.plugin.EDITOR` 发现插件, 编辑器分类为 `ace-editor`
- `新增` 插件信息的阿拉伯语, 英语, 西班牙语, 法语, 日语, 韩语, 俄语及中文本地化
- `新增` 类型化 Editor API 合约, 以 `compileOnly` 方式接入宿主提供的运行时 API
- `新增` Ace `1.4.12`, TypeScript `4.2.4`, Iosevka 字体和 AutoJs6 编辑器静态资源
- `新增` 文本镜像, 光标与选区, 撤销历史, 搜索替换, 断点, IME 适配, LSP 和健康监测能力
- `新增` 宿主 build `5234` 兼容性声明以及可信签名和同进程加载约束
