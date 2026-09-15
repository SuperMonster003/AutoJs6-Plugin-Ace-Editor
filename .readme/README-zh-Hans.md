<!--suppress HtmlDeprecatedAttribute, HttpUrlsUsage -->

<div align="center">
  <p>
    <picture>
      <source srcset="https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/app/src/main/res/mipmap-night/ic_launcher.png?raw=true" media="(prefers-color-scheme: dark)" />
      <img src="https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/app/src/main/res/mipmap/ic_launcher.png?raw=true" alt="autojs6-plugin-ace-editor-ic-launcher" border="0" width="128" />
    </picture>
  </p>

  <p>集成语言服务的嵌入式 Ace 代码编辑器</p>

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
- 使用 Editor API 契约 5, 需要 AutoJs6 构建 5276 及以上和 Android API 24 及以上.
- 支持文本编辑, 撤销/重做, 搜索替换, 正则与整词查找, 光标/选区导航, 行操作, 断点, 注释切换和代码格式化.
- 内置 JavaScript/TypeScript 语言服务和 AutoJs6 类型声明, 提供补全, hover, diagnostics 与 signature help; JSON 文件支持语法诊断.
- 通过按需创建的 Pyright 1.1.413 WebWorker 内置 Python 3.12 语义分析: 类型补全, hover, 签名帮助, 诊断和定义跳转; 不兼容的老 WebView 会静默保留 P2.
- 通过设备内 LuaLS 3.18.2 伴生进程内置完全离线的 Lua 语义: 补全, hover, 签名帮助, 诊断和定义跳转在 arm64-v8a, armeabi-v7a 与 x86_64 默认开启; 不支持的 ABI 与运行故障会静默保留 P2.
- 支持 CRLF 保留, 增量文本同步, 大文本分块加载, 超长行轻量模式, IME 适配, 运行健康监测和宿主原生编辑器回退通知.
- 支持主题与显示设置, 以及带签名目录校验, SHA-256/WOFF2 校验, 下载, 缓存, 安装和删除能力的字体管理.
- 插件信息, README 与 CHANGELOG 支持西班牙语/法语/俄语/阿拉伯语/日语/韩语/英语/简体中文/香港繁体/台湾繁体.
- 可选择设备 ABI 对应的 APK 或 universal APK. Lua 语义分析支持 arm64-v8a, armeabi-v7a 和 x86_64; x86 保留编辑器和静态补全.

******

### 编程语言支持

******

下表描述当前内置语言能力. 语义支持包括类型补全, 类型诊断, hover 与签名帮助:

| 语言 | 语法高亮 | 关键字补全 | Snippets | 本地补全 | 语义支持 |
|---|---:|---:|---:|---:|---:|
| JavaScript | 支持 | 支持 | 支持 | 支持 | 支持 |
| JSX | 支持 | 无 | 无 | 支持 | 支持 |
| TypeScript | 支持 | 支持 | 支持 | 支持 | 支持 |
| TSX | 部分 | 支持 | 支持 | 支持 | 支持 |
| JSON | 支持 | 无 | 无 | 无 | 仅语法诊断 |
| Python | 支持 | 支持 | 支持 | 支持 | 支持 |
| Lua | 支持 | 支持 | 支持 | 支持 | 支持 |
| Java | 支持 | 支持 | 支持 | 支持 | 单文件诊断 |
| Kotlin | 支持 | 支持 | 支持 | P2+ | 无 |

Ace 1.4.12 的 TSX 使用 TypeScript mode, 因此 JSX 标签高亮仅部分可用. Python 默认使用完全离线的 Pyright 1.1.413 Worker 和 Python 3.12 标准库存根; 老 WebView 不兼容或运行失败时会静默降级至 P2. Lua 在 arm64-v8a, armeabi-v7a 与 x86_64 默认使用完全离线的 LuaLS 3.18.2 伴生进程; 原生运行时不可用或故障时会静默降级至 P2. Java 将相互隔离的标准库与当前文档 P2 补全和 ECJ 单文件诊断结合. Kotlin 提供 P2+ 补全, 但没有语义 Provider.

AutoJs6 的代码编辑器设置会展示同一份 9-mode 矩阵. 全局 LSP 开关控制所有语义服务, TypeScript/JavaScript, Python, Lua 与 Java 另有逐语言开关; Kotlin 保持可见但不可启用. 文件类型列表最先作为白名单判断: 移除已识别后缀会关闭该语言的语义, 添加自定义后缀只允许文件进入 LSP 路径, 不会把它重新识别为其他语言或创建语义 Provider.

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

修改 `tools/ace-lsp/generate-language-indices.mjs` 中维护的 Python, Lua, Java 或 Kotlin 静态索引源后, 可通过此任务重新生成提交入库的资产:

```powershell
.\gradlew.bat :app:generateAutoJs6LanguageIndices
```

生成器固定各语言基线版本, 并在 `autojs6/indices` 下输出可重复的独立语言资产; 编辑器只在首次使用时加载当前语言. `verifyAutoJs6LanguageIndices` 会检测过期产物, 且已接入正常验证链.

修改固定版本的 Pyright Worker 源码后, 可通过此任务显式重新生成提交入库的 Python 语义资产:

```powershell
.\gradlew.bat :app:generateAutoJs6PythonWorker
```

通过以下任务校验提交入库的 Worker 版本, typeshed 与许可证哈希, 体积预算, 语义行为, 降级和生命周期:

```powershell
.\gradlew.bat :app:verifyAutoJs6PythonWorker
```

普通 APK 构建只打包已经提交并验证的 Worker, 不会下载或重新生成. 语义资产合计 4.822 MiB, 低于 8 MiB 可选交付阈值; 无法解析其 ES2022 语法的老 WebView 会继续使用 P2, 且不显示错误弹窗.

修改固定版本的 LuaLS 源码或构建锁后, 可通过以下命令显式重新构建提交入库的 Android 运行时:

```powershell
.\tools\ace-lsp\build-luals-android.ps1 `
  -NdkRoot <android-sdk>\ndk\29.0.14206865 `
  -OutputRoot build\luals-android\dist
```

通过以下任务校验提交入库的 LuaLS 版本, 运行时与 ELF 哈希, 许可证清单, 语义行为, ABI 降级和生命周期:

```powershell
.\gradlew.bat :app:verifyAutoJs6LuaLanguageServer
```

普通 APK 构建只打包已经提交并验证的 LuaLS 分发, 不会下载或重新构建. 其 7.900 MiB 负载低于 8 MiB 单语言交付阈值, 支持 arm64-v8a, armeabi-v7a 与 x86_64; 不支持的 ABI 会继续使用 P2, 且不显示错误弹窗.

******

### 安装

******

构建后安装生成的 APK:

```powershell
adb install -r .\app\build\outputs\apk\debug\autojs6-plugin-ace-editor-v1.7.0-universal.apk
```

随后在 AutoJs6 插件中心启用 `ace-editor`, 完全退出并重新启动 AutoJs6. 安装, 更新或回滚插件后都应重启宿主.

生产环境应使用 AutoJs6 认可的受信任签名. 同进程插件代码继承宿主进程的权限, 不要安装来源不明或未经审核的 APK.

******

### 发行历史

******

# v1.7.0

###### 2026/09/15

* `优化` 同步 AutoJs6 4.16.0 声明中的 images.matchFeatures 图片参数与 RANSAC 选项, ObjectFrame 几何属性与匹配统计, 以及 ImageFeatures 的 count 与 method, 更新资源与依赖声明并重新生成 LSP 分组

# v1.6.0

###### 2026/09/14

* `优化` 同步 AutoJs6 4.15.0 声明中的 images.matchTemplate scales 选项, 模板匹配项几何属性及 MatchingResult 辅助方法, 更新资源与依赖声明并重新生成 LSP 分组

# v1.5.0

###### 2026/09/14

* `优化` 同步 AutoJs6 4.14.0 声明中的 images.countPointsByColor, images.getMeanColor, images.readPixels 及 colors.distance / invert / blend / contrast 系列方法, 更新资源与依赖声明并重新生成 LSP 分组

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


[16 KB page alignment and build verification](https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/docs/16kb.md)
