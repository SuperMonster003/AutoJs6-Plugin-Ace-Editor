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
- 使用 Editor API 契约 7, 需要 AutoJs6 构建 5352 及以上和 Android API 24 及以上.
- 支持文本编辑, 撤销/重做, 搜索替换, 正则与整词查找, 光标/选区导航, 行操作, 断点, 注释切换和代码格式化.
- 编辑器支持 "编辑 > 折叠 > 全部展开/全部折叠", 对整个文档的代码块生效, 支持嵌套折叠和只读文档, 保持文本, 选区及撤销历史不变.
- 基于 Ace 1.44.0; 点击, 双击/长按选词, 拖动光标与选区手柄, 惯性滚动, 双指缩放和拖拽放大镜等触摸操作由插件自己的移动端覆盖层提供.
- 宿主的代码编辑器设置可开关矢量边栏图标, 当前缩进参考线高亮, 编辑器滚动条及其自动隐藏, 选区内空白符, 拖拽放大镜, 同名符号高亮和补全内联预览; 拖拽放大镜与内联预览默认关闭, 没有这些设置的宿主按默认值运行.
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
| TSX | 支持 | 支持 | 支持 | 支持 | 支持 |
| JSON | 支持 | 无 | 无 | 无 | 仅语法诊断 |
| Python | 支持 | 支持 | 支持 | 支持 | 支持 |
| Lua | 支持 | 支持 | 支持 | 支持 | 支持 |
| Java | 支持 | 支持 | 支持 | 支持 | 单文件诊断 |
| Kotlin | 支持 | 支持 | 支持 | P2+ | 无 |

Python 默认使用完全离线的 Pyright 1.1.413 Worker 和 Python 3.12 标准库存根; 老 WebView 不兼容或运行失败时会静默降级至 P2. Lua 在 arm64-v8a, armeabi-v7a 与 x86_64 默认使用完全离线的 LuaLS 3.18.2 伴生进程; 原生运行时不可用或故障时会静默降级至 P2. Java 将相互隔离的标准库与当前文档 P2 补全和 ECJ 单文件诊断结合. Kotlin 提供 P2+ 补全, 但没有语义 Provider. Rhino 脚本的 `class` 语法 (含继承 Java 类) 需要 AutoJs6 6.8.0 及以上版本运行.

AutoJs6 的代码编辑器设置会展示同一份 9-mode 矩阵. 全局 LSP 开关控制所有语义服务, TypeScript/JavaScript, Python, Lua 与 Java 另有逐语言开关; Kotlin 保持可见但不可启用. 文件类型列表最先作为白名单判断: 移除已识别后缀会关闭该语言的语义, 添加自定义后缀只允许文件进入 LSP 路径, 不会把它重新识别为其他语言或创建语义 Provider.

******

### 构建

******

需要 JDK 17 或更高版本和 Android SDK 37, 使用项目自带的 Gradle Wrapper:

```powershell
.\gradlew.bat :app:testDebugUnitTest :app:assembleDebug
```

Release 构建:

```powershell
.\gradlew.bat :app:assembleRelease
```

修改 Ace 资产, 移动端覆盖层或桥接脚本后, 可单独运行以下校验:

```powershell
.\gradlew.bat :app:verifyAutoJs6AceAssets :app:verifyAutoJs6AceMobileOverlay :app:verifyAutoJs6AceBridge :app:typecheckAutoJs6AceBridge
```

它们依次核对打包的 Ace 1.44.0 文件与锁定清单 (官方文件不得修改), 用录制的触摸场景回放移动端覆盖层, 在固定版本的 jsdom 中运行编辑器页面与桥接层测试, 并按 Ace 的类型声明检查桥接脚本. 这些任务都已挂到 `check` 上, 需要 Node.js.

构建参数和版本号来自 `version.properties`, 当前最低 SDK 为 24, 目标 SDK 为 37.

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
adb install -r .\app\build\outputs\apk\debug\autojs6-plugin-ace-editor-v2.48.0-universal.apk
```

随后在 AutoJs6 插件中心启用 `ace-editor`, 完全退出并重新启动 AutoJs6. 安装, 更新或回滚插件后都应重启宿主.

生产环境应使用 AutoJs6 认可的受信任签名. 同进程插件代码继承宿主进程的权限, 不要安装来源不明或未经审核的 APK.

******

### 发行历史

******

# v2.48.0

###### 2026/11/01

* `新增` Node.js 与 Bun 脚本的补全跟随 Node.js Runtime 2.1.0 与 Bun Runtime 0.22.0: app, shell, 系统信息, device, sensors, media, colors, files, zip, ui, floaty, web, terminal, compose, automator, auto, ocr, threads, timers, events 等模块与 AutoJs6 脚本一致的成员及其返回对象
* `新增` Python, Lua, Java 和 Kotlin 脚本可以补全 AutoJs6 语言运行时的 API; Python 悬停显示 54 个常量的字面值
* `新增` Java 的参数, 字段和局部变量按声明类型 (或 new / 强制转换的初始值的类型) 补全成员
* `新增` Flow 对象的 await() 与 sync(timeout) 进入 Node.js 与 Bun 的补全
* `新增` plugins.tools.call / callAsync 补全官方插件的 15 个工具名, 其他工具名仍可使用
* `修复` ocr.detect 与 barcode / qrcode detect 的结果没有成员补全的问题
* `修复` 部分参数与返回类型和 AutoJs6 脚本模块不一致的问题 (engines.stopAllAndToast, util.deprecate, Flow 的选择器条件, 可传 null 的参数与任务选项)
* `优化` 捆绑声明升级至 @sm003/autojs6-dts 4.86.0
* `优化` OCR 声明补全 extras, useCls, PP-OCRv3 的 variant / profile 与 mergeLine 的说明; 静态索引补全 55 个 compose 组件工厂与 util.versionCodes
* `优化` Node.js 和 Bun 脚本的 speech.models.list 结果可以补全 updateAvailable 和 latestVersionCode (需要 3-Macaw Speech 1.4.0 或以上)

# v2.47.0

###### 2026/10/29

* `新增` speech 声明补全 diarize, detectLanguage 与 tag 及其 Async 形态: 说话人分离 (谁在何时说话, 可按已注册的声纹认人), 语种识别与音频标签 (AudioSet 的 527 个标签), 选项可带 onProgress 进度回调, 含 Speech.Diarization, Speech.LanguageDetection 与 Speech.Tagging 等结果类型 (AutoJs6 6.8.0 起, 需要 3-Macaw Speech 1.3.0)
* `新增` speech 声明补全 speech.speaker 说话人识别: enroll, verify, identify 及其 Async 形态, list 与 remove, 以及错误码 SPEAKER_NOT_FOUND 与 AUDIO_TOO_SHORT (AutoJs6 6.8.0 起, 需要 3-Macaw Speech 1.3.0)
* `优化` Speech.Feature 增加 'speaker', 'diarization', 'languageId' 与 'audioTagging'; Speech.Kind 增加 'speaker', 'segment', 'langid' 与 'tagger' 四种模型类别, models.list, setDefault 与 getDefault 可使用这些类别

# v2.46.0

###### 2026/10/29

* `新增` 选择器声明补全 normalize 与 prefer: 全局函数, 链式方法与对象选择器的键, 含 Selector.NormalizeOptions 与 Selector.PreferKey 类型 (AutoJs6 6.8.0 起)
* `新增` auto 声明补全 clearFlags 方法, setFlags 的 ! 前缀与 noFastPath / noRefreshOnHit 标志; explain 可传入罗盘与结果类型, 结果含 target / trail / result 等字段; stats 补全 fastPath 与 queries.refinds (AutoJs6 6.8.0 起)
* `优化` pickup / detect 的结果类型 Detect.ResultTypeFuncWithoutParams / ResultTypeFuncWithParams 改由 AutoJs6 的节点方法注册表生成, 包含全部 206 个可调用的方法名及带参数的重载, 并补全 ## / $$ / .. 与数组形式的结果类型

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
