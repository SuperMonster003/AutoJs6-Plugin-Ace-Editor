<!--suppress HtmlDeprecatedAttribute, HttpUrlsUsage -->

<div align="center">
  <h1>AutoJs6 Ace Editor Plugin</h1>

  <p>用于 AutoJs6 的独立 Ace 代码编辑器插件</p>

  <p>
    <a href="https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/releases"><img alt="GitHub release (latest by date)" src="https://img.shields.io/github/v/release/SuperMonster003/AutoJs6-Plugin-Ace-Editor?label=Release"/></a>
    <a href="https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/issues"><img alt="GitHub closed issues" src="https://img.shields.io/github/issues/SuperMonster003/AutoJs6-Plugin-Ace-Editor?color=A24232&label=Issues"/></a>
    <a href="https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/LICENSE"><img alt="GitHub License" src="https://img.shields.io/github/license/SuperMonster003/AutoJs6-Plugin-Ace-Editor?color=534BAE&label=License"/></a>
  </p>
</div>

******

### 语言 (Languages)

******

当前 README.md 支持以下语言:

- 简体中文 [zh-Hans] # 当前
- [繁體中文 (香港) [zh-Hant-HK]](https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/.readme/README-zh-Hant-HK.md)
- [繁體中文 (台灣) [zh-Hant-TW]](https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/.readme/README-zh-Hant-TW.md)
- [English [en]](https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/.readme/README-en.md)
- [Français [fr]](https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/.readme/README-fr.md)
- [Español [es]](https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/.readme/README-es.md)
- [日本語 [ja]](https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/.readme/README-ja.md)
- [한국어 [ko]](https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/.readme/README-ko.md)
- [Русский [ru]](https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/.readme/README-ru.md)
- [العربية [ar]](https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/.readme/README-ar.md)

******

### 简介

******

AutoJs6 Ace Editor Plugin 将 Ace WebView 运行时, JavaScript bridge, 输入法适配, 内置语言服务和编辑器静态资源从宿主 APK 中独立出来. 插件以普通 Android APK 安装, 并通过类型化 Editor API 在 AutoJs6 进程内运行.

******

### 功能

******

- 提供插件 ID `ace-editor`, 引擎 `editor` 和变体 `ace`, 支持通过 `org.autojs.plugin.INFO` 与 `org.autojs.plugin.EDITOR` 发现.
- 使用 Editor API 合约 1, 最低支持 AutoJs6 `6.8.0 Alpha7` build `5235` 或更高版本, 以及 Android API 24 或更高版本.
- 支持文本编辑, 撤销/重做, 搜索替换, 正则与整词查找, 光标/选区导航, 行操作, 断点, 注释切换和代码格式化.
- 内置 JavaScript/TypeScript 语言服务和 AutoJs6 类型声明, 提供补全, hover, diagnostics 与 signature help; JSON 文件支持语法诊断.
- 支持 CRLF 保留, 增量文本同步, 大文本分块加载, 超长行轻量模式, IME 适配, 运行健康监测和宿主原生编辑器回退通知.
- 支持主题与显示设置, 以及带签名目录校验, SHA-256/WOFF2 校验, 下载, 缓存, 安装和删除能力的字体管理.
- 插件信息, README 与 CHANGELOG 支持西班牙语/法语/俄语/阿拉伯语/日语/韩语/英语/简体中文/香港繁体/台湾繁体.

******

### 构建

******

需要 JDK 17 或更高版本和 Android SDK 36, 使用项目自带的 Gradle Wrapper:

```powershell
.\gradlew.bat :app:testDebugUnitTest :app:assembleDebug
```

Release 构建:

```powershell
.\gradlew.bat :app:assembleRelease
```

构建参数和版本号来自 `version.properties`, 当前最低 SDK 为 24, 目标 SDK 为 36.

更新或新增 `autojs6/types/**/*.d.ts` 后, 可单独执行:

```powershell
.\gradlew.bat :app:generateAutoJs6LspDeclarations
```

该任务会校验声明引用和 TypeScript 6 语法, 生成 `core`, `android`, `libraries`, `resources`, `main-app` 五组 LSP 资产及 manifest. `assemble` 和 `mergeAssets` 已自动依赖该任务, 因此正常构建无需额外执行; 外部脚本也可以直接调用它. 生成结果只写入 `app/build/generated/aceLspAssets`, 不会覆盖或删除 `src/main/assets` 下的完整原始声明. 若 Node 不在 `PATH`, 可传入 `-Pautojs6.nodeExecutable=<node路径>`.

******

### 安装

******

构建后安装生成的 APK:

```powershell
adb install -r .\app\build\outputs\apk\debug\autojs6-plugin-ace-editor-v1.1.14-universal.apk
```

随后在 AutoJs6 插件中心启用 `ace-editor`, 完全退出并重新启动 AutoJs6. 安装, 更新或回滚插件后都应重启宿主.

生产环境应使用 AutoJs6 认可的受信任签名. 同进程插件代码继承宿主进程的权限, 不要安装来源不明或未经审核的 APK.

******

### 发行历史

******

# v1.1.14

###### 2026/08/29

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

##### 更多发行历史可参阅

* [CHANGELOG.md](https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/app/src/main/assets/doc/CHANGELOG-zh-Hans.md)

******

### 资源结构

******

```text
.readme/lang_*.json
.changelog/lang_*.json
.python/generate_markdown.py
app/src/main/res/values-*/strings.xml
app/src/main/assets/doc/CHANGELOG*.md
```

`strings.xml` 提供插件信息和编辑器界面本地化. README 与 CHANGELOG 由 `.python/generate_markdown.py` 根据 JSON 源文件生成, 各语言最新日志同时写入 APK 的 `assets/doc` 目录.

******

### 相关链接

******

- AutoJs6 项目: https://github.com/SuperMonster003/AutoJs6
- Ace 官方网站: https://ace.c9.io
- 第三方组件声明: https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/THIRD_PARTY_NOTICES.md
- 项目许可证: https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/LICENSE
