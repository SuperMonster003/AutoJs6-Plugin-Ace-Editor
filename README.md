# AutoJs6 Ace Editor Plugin

AutoJs6 的 Ace 代码编辑器插件, 将 Ace WebView 运行时, JavaScript bridge, 输入法适配, 语言服务和编辑器静态资源从宿主 APK 中独立出来.

## 兼容性

| 项目 | 值 |
| --- | --- |
| 插件 ID | `ace-editor` |
| Android 包名 | `io.github.supermonster003.autojs6.plugin.ace.editor` |
| 发现动作 | `org.autojs.plugin.EDITOR` |
| 发现分类 | `ace-editor` |
| Editor API 合约 | `1` |
| 最低 AutoJs6 | `6.8.0 Alpha7`, build `5234` |
| 最低 Android SDK | `24` |

宿主构建号是兼容性判断的依据. 低于 build `5234` 的 AutoJs6 不会加载此插件.

## 架构

插件以普通 Android APK 安装, 并通过受 `org.autojs.permission.PLUGIN` 保护的组件发布 `org.autojs.plugin.INFO` 和 `org.autojs.plugin.EDITOR` intent filter. AutoJs6 验证插件启用状态, 合约版本, 宿主版本和签名信任级别后, 才会创建编辑器会话.

编辑器会话通过类型化的 `editor-api` 在 AutoJs6 进程内运行. `libs/editor-api.aar` 仅作为 `compileOnly` 编译依赖, 运行时使用宿主提供的同一份 API 类, 以保持 JVM 类型一致性. 插件上下文负责加载自身的资源和 Ace 资产, 宿主上下文负责宿主生命周期与受控存储.

同进程加载采用宿主优先的 ClassLoader. 插件中的 Kotlin, AndroidX, OkHttp 等共享依赖必须兼容所声明的最低宿主版本; 提高依赖下限时应同步提高 `requiresHostVersion`, 或对冲突依赖进行重定位.

AutoJs6 继续负责文件打开与保存, 运行与调试入口, 编辑页生命周期和原生编辑器回退. 插件负责 Ace WebView, 文本同步, 光标与选区, 撤销历史, 搜索替换, 断点, IME 适配, LSP 和运行健康监测.

## 构建

需要 JDK 17 或更高版本以及 Android SDK 36. 使用项目自带的 Gradle Wrapper:

```powershell
.\gradlew.bat :app:testDebugUnitTest :app:assembleDebug
```

Release 构建:

```powershell
.\gradlew.bat :app:assembleRelease
```

版本号由根目录的 `version.properties` 提供. 调试 APK 默认输出到 `app/build/outputs/apk/debug/`.

如果宿主的 Editor API 合约发生变化, 先在 AutoJs6 仓库构建 API, 再将生成的 AAR 同步到本仓库的 `libs/editor-api.aar`:

```powershell
.\gradlew.bat :plugin-api:editor-api:assembleRelease
```

## 安装

构建后安装生成的 APK:

```powershell
adb install -r .\app\build\outputs\apk\debug\autojs6-plugin-ace-editor-v1.0.0-universal.apk
```

随后在 AutoJs6 插件中心启用 `ace-editor`, 完全退出并重新启动 AutoJs6. 安装, 更新或回滚插件后都应重启宿主, 因为已加载的同进程类和编辑器会话不能安全地热替换.

生产环境应使用 AutoJs6 认可的受信任签名. 同进程插件代码继承宿主进程的权限, 因此不要安装来源不明或自行修改且未经审核的 APK. 仅获得用户授权但未达到宿主可信签名级别的包不应被加载为编辑器实现.

## 第三方组件

APK 内含 Ace `1.4.12`, TypeScript `4.2.4`, Iosevka Web 字体和 AutoJs6 类型声明. 组件归属, 许可证及随包保留的原始声明见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## 许可

本项目源代码依据根目录 [LICENSE](LICENSE) 中的 Mozilla Public License 2.0 发布. 内嵌第三方组件继续适用各自的许可证.
