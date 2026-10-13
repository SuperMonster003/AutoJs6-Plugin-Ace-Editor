# Ace 1.44.0 升级 Roadmap

> 生成日期: 2026-10-13 · 适用范围: AutoJs6 Ace 编辑器插件 · 分支: `ace-1.44.0` · 状态: A0 进行中
>
> 维护约定: 完成一项勾选一项 (`[ ]` -> `[x]`). 验证门 (**G** 前缀) 是 "先验证后投入" 的检查点:
> 未通过时执行该项括号内的降级路径, 并在该项下方追加一行结论记录, 同样视为 "已完成决策".
> 每个里程碑结束时在 §3 总览表更新状态. 条目中的文件路径和行号以 2026-10-13 的 `master` (f067e63) 为准,
> 目录改名 (A1) 之后以新路径为准.

## 1. 决策记录 (2026-10-13 三轮确认)

| 决策项 | 结论 |
|---|---|
| 升级目标 | ace-builds 1.44.0 (npm latest, 2026-05-11 发布); 从 1.4.12 (2020-07) 跨越约 70 个版本 |
| 定制承载方式 | **运行期覆盖层**: 官方文件保持字节原样, Auto.js 时代的移动端定制重建为可读的项目脚本, 以 `ace.define` 模块 + 运行期安装的方式叠加; 不维护 Ace 源码补丁, 不自构建 ace.js |
| 资产目录 | 改名为 `app/src/main/assets/editor/ace-builds-1.44.0`, 借机审计全部引用 (附录 A) |
| 纳入的上游能力 | 语言: 官方 mode-tsx, 官方 Kotlin mode, 官方 worker-json (验证门). 视觉: useSvgGutterIcons, highlightIndentGuides, customScrollbar, ext-whitespaces_in_selection. 补全: 弹窗加载态/空结果/触摸友好选中, 上游 triggerCharacters 替换自研点触发 (验证门), ghost text 内联预览 (验证门), MarkerGroup 同名符号高亮. 工程: 超长行改用上游 MAX_LINE_LENGTH (验证门), ace.d.ts 类型检查接入 CI, 桥接层 JVM 测试改为执行式测试 |
| 保留项 | 放大镜模块保留并修复 (当前从未启用); visual_studio / visual_studio_dark 两个自制主题保留 |
| 定制源码来源 | 没有可读源码, 从压缩产物逐模块重建, 并在 THIRD_PARTY_NOTICES 记录来源 |
| 路线图文件 | 根目录 `Roadmap-Ace-1.44.0.md` (本文件), 与多语言智能提示 `Roadmap.md` 并列 |
| 分支 | `ace-1.44.0`, 在当前仓库直接 checkout, 不建 worktree; 是否推送到 origin 由维护者决定 |
| 版本号 | 合并时升为 **2.0.0**; 分支期间 `VERSION_NAME` 保持 1.32.0, `VERSION_BUILD` 按提交计数规则逐笔递增 |
| 设备门 | 当前在线 8 台全部必过: G8441 (API 28), XQ-AT72 (API 31), 22120RN86C (API 33), 23046RP50C (API 35), XQ-DQ72, OPD2413 (ColorOS), 模拟器 x86_64 (API 37, 16 KB), 模拟器 x86 |
| 合并标准 | **功能优先档**: 三项冷启动中位数相对 A0 基线不超过 +10%; Ace 资产增量不设硬限但必须记录; 8 台设备仪器测试全绿; 移动端交互与 IME 手测清单无 P1 缺陷 |
| 新开关 | 宿主设置页新增开关, 插件自带默认值; 放大镜与 ghost text 默认关闭, 其余默认开启; 老宿主无开关时按默认值运行 |

## 2. 升级评估 (2026-10-13 核查)

### 2.1 现状基线

- 资产根目录 `app/src/main/assets/editor/ace-builds-1.4.12/`, 由 `AceEditorAssets.kt:7` 与 `AceBridge.kt:325` 的
  `EDITOR_ASSET_ROOT` 以及 `AceCodeEditor.kt:3696` 的 `ASSET_URL_PREFIX` 引用, 通过 `WebViewAssetLoader`
  以 `https://appassets.androidplatform.net/assets/editor/...` 加载 (`AceCodeEditor.kt:116`).
- 入口 `autojs6_editor.html` 按顺序加载 ace.js, ext-language_tools, ext-searchbox, ext-beautify, 然后是
  `autojs6/` 下 13 个项目脚本, 最后是 `autojs6_ace_bridge.js` (5,989 行). 定制 JS 合计约 4.97 万行 (含 3 万行索引).
- 桥接对象 `window.autojs` (`AceCodeEditor.kt:3691`) 暴露 46 个 `@JavascriptInterface` 方法, 其中
  `startActionMode(left, top, right, bottom, hasSelection, selectAll)`, `finishActionMode()`, `showSoftInput()`,
  `performLongPressFeedback()` 直接被 ace.js 内的定制代码调用 (`AceBridge.kt:201-231`).
- 必需资产清单 `AceEditorAssets.requiredAssetPaths` 共 60 项; 新增资产必须登记.
- 回归基础: 171 个 JVM 测试 (大多是源码字符串断言), 24 个 instrumentation 用例 (`AceCodeEditorSmokeTest` 等),
  `tools/ace-lsp/measure-editor-performance.ps1` + `AcePerformanceBaselineTest` 性能探针,
  `verifyAutoJs6LspRuntime` 等 5 个 Node 校验任务挂在 `check` 上 (`app/build.gradle.kts:374`).
- 本地检出受 `core.autocrlf=true` 影响, 索引中为 LF 的 Ace 文件在工作区为 CRLF (`git ls-files --eol`);
  涉及字节哈希的清单必须按 `luals/**` 的先例声明 `-text`.

### 2.2 `src-min-noconflict/` 逐文件来源比对

与 npm `ace-builds@1.4.12` (tarball shasum `888efa386e36f4345f40b5233fcc4fe4c588fae7`) 和 `ace-builds@1.44.0`
逐文件比对, 结论如下:

| 文件 | 来源 | 结论 |
|---|---|---|
| `ace.js` (382,307 B) | Auto.js 定制构建 (Babel 重新打包, 见下表) | **不是官方 1.4.12**; 模块集合比官方多 4 个 |
| `ext-language_tools.js` | 1.4.12 源码重新压缩 | 无功能补丁 (逐模块体积比 0.87-1.03, 无 fork 标识符) |
| `ext-searchbox.js`, `ext-beautify.js`, `mode-javascript.js`, `snippets/javascript.js` | 官方 1.4.12 | 字节一致 (仅行尾差异) |
| `mode-json/jsx/typescript/python/lua/java.js`, `worker-javascript.js`, `worker-lua.js`, `snippets/{json,typescript,lua,java}.js` | 官方 1.4.12 | 字节一致 (M0/M1 导入) |
| `mode-kotlin.js` | 1.4.12 可读源 + 3 处项目补丁 | 关键字 token, `$keywordList`, `snippetFileId` (见 `MILESTONE_BASELINES.md` M1) |
| `snippets/python.js`, `snippets/kotlin.js` | 项目维护 | 上游 Python 仍含 Python 2 写法, 上游 Kotlin 为空 |
| 48 个 `theme-*.js` | 更新版本的 ace-builds (已是 `ace/theme/x-css` 模块格式) | 1.4.12 中不存在 cloud9_* / cloud_editor* / github_dark / github_light_default / gruvbox_*_hard / one_dark 共 10 个 |
| `theme-visual_studio.js`, `theme-visual_studio_dark.js` | 项目自制 | 任一上游版本均不存在; 宿主 `AceEditorThemes.java` 的 48 项主题列表不含它们, 桥接层 `DARK_ACE_THEMES` 含 dark 版 |

`ace.js` 相对官方 1.4.12 的定制 (A0-4 逐模块比对属性名, 字符串与数字字面量后复核; 可读重建与等价性校验见
`tools/ace-mobile/README.md`, 该文件还列出了全部 "实际行为与直观理解不同" 的细节):

| 模块 | 定制内容 |
|---|---|
| `ace/mouse/touch_handler` | **整体替换**. 单击 (须 100 ms 内抬起, 慢点不移动光标) 定位光标 + `window.focus` + `autojs.showSoftInput()`; 300 ms 内且两次触点相距约 1.2 行以内的双击选词; 500 ms 长按: 落在选区内 (多行选区只比纵向, 四周各留 8 px) 则直接拉起 ActionMode, 否则选词 + ActionMode + `autojs.performLongPressFeedback()`; 距光标/锚点下方 0.75 行处的行高归一化平方距离 < 3.5 时拖拽移动光标或锚点 (可选放大镜), 并带 5 列前瞻的 scrollCursorIntoView; 其余为滚动: 离开起点约 1.2 行后开始, 边界钳制 (可越过末尾 200 px), 抬手后用 Scroller 做惯性 (速度阈值 50 px/s, Y 速度 x2, 2 ms 定时器), 惯性结束后 `startActionModeIfSelectionInView(false)`; 双指为 zoom 模式 (body zoom, 已被桥接层抢占); `touchstart` 上 `preventDefault`; 点在 gutter 时不处理 (检查的 `editor.popup` 从未被赋值); 发出 `editor._emit("touchscroll")` |
| `ace/mouse/magnifier.js` | 新增. 创建 `#magnifier` / `#magnifier-content` / `#magnifier-progress` DOM, 二分查找行, 拖拽时显示放大的当前行与选区. 仓库 CSS 中没有对应样式, 且 `magnifierEnabled` 从未被设置, 实际从未生效; 用屏幕行匹配按文档行编号的单元格, 折叠或换行时错位 |
| `ace/mouse/scroller.js` | 新增. AOSP `OverScroller` 样条 fling 移植 (`createDefault()` 摩擦 0.015, 固定 440 ppi, `fling`, `computeScrollOffset`, `abortAnimation`); `getCurrVelocity()` 读错字段恒为 0, 飞轮加速从不生效 |
| `ace/mouse/velocity-tracker.js` | 新增. 100 ms 窗口内最小二乘求速度, 依赖 `regression.js`. 源码意图是 "点数 >= 3 用二阶", 但比较的是数组本身, **实际恒为一阶**; 系数精度 0.01 px/ms (10 px/s 步长) |
| `ace/mouse/regression.js` | 新增. regression-js 2.0.x (MIT) 的 Babel 转译版, 依赖 ace.js 顶部的全局 Babel helper; 速度跟踪模块末尾定义全局 `Math.signum` polyfill |
| `ace/editor` | 新增 `actionMode` 状态 (`selectionActionMode` / `noSelectionActionMode`), `startActionModeIfSelectionInView(selectAll)` (200 ms 延迟; 名为 "在视口内才拉起", 但条件对任何有限数成立, **实际只要选区非空就拉起**), `startActionMode()`, `$nativeStartActionMode(rect, hasSelection, selectAll)` -> `autojs.startActionMode(...)` (矩形为滚动区域高度的分数, Kotlin 侧判为无效后改用触摸锚点), `finishActionMode()` -> `autojs.finishActionMode()`; 构造函数在 `typeof autojs != "undefined"` 时监听 change (无选区模式下每次变化都调用 `autojs.finishActionMode()`), 以及挂在 changeSession 上的 changeSelection 监听 (首个会话错过, 桥接层不调用 `setSession`, **实际从未生效**); 辅助函数读取全局 `editor` |
| `ace/virtual_renderer` | 新增 `getClientPosition(pos)` (像素位置 + scroller 矩形 - 滚动偏移); 默认字体栈改为 `'Ubuntu Mono', 'Monaco', 'CONSOLA', ...` (桥接层总会显式设置字体, 不可观察) |
| `ace/mouse/mouse_handler` | 新增 `magnifierEnabled` 选项 (initialValue false); 调用 `addTouchListeners(container, editor, this)`; 移动端不注册 focusEditor 的 mousedown 监听 |
| `ace/mouse/default_handlers` | 移动端不注册 mousedown / dblclick / tripleclick / quadclick 默认处理 (A0-4 补充) |
| `ace/keyboard/textinput` | `onContextMenu` 只 `preventDefault`, 不发 `nativecontextmenu`, 不把 textarea 移到触点 (A0-4 补充) |
| `ace/mouse/default_gutter_handler` | 行号栏提示在 `touchscroll` 时也隐藏 (A0-4 补充) |
| `ace/lib/event` | 修饰键判定额外参考已按下未抬起的键码 16/17/18/224/91/92, 让只发送独立修饰键事件的键盘也能触发 Ctrl / Alt / Shift / Meta 命令 (A0-4 补充) |

来源 (A0-5): regression-js 2.0.x (MIT) 与 AOSP OverScroller 算法 (Apache-2.0) 已核实; 其余定制来源未核实,
线索指向 Auto.js Pro 的编辑器资产, 详见 `tools/ace-mobile/README.md` "来源与许可证".

### 2.3 桥接层对 Ace 内部 API 的依赖与 1.44.0 存续

| 依赖 | 使用位置 | 1.44.0 状态 |
|---|---|---|
| `renderer.$textLayer.$renderSimpleLine(parent, tokens)` | `autojs6_ace_bridge.js:3164-3208` 超长行渲染守卫 | 存在, 签名相同; 但上游先按 `MAX_LINE_LENGTH` (10000) 渲染溢出按钮 (见 §2.4) |
| `renderer.$gutterLayer.$updateGutterWidth(config)`, `$fixedWidth`, `session.$useWrapMode` | `:4689-4713` 自动换行下的动态行号栏宽度 | 存在, 判定条件 `this.$fixedWidth || session.$useWrapMode` 相同 |
| `session.$toggleFoldWidget(row, options)` | `:5043-5070` | 存在, `options` 必须为对象 (桥接层已传) |
| `session.undoChanges / redoChanges` | `:3469-3551` 历史操作钩子 | 存在 |
| `document.$autoNewLine` | `:3321-3352` CRLF 保留 | 存在 |
| `editor.$mouseHandler.isMousePressed`, `renderer.$isMousePressed` | `:1781-1790`, `:5162` | 存在 |
| `textInput.getElement()`, `textInput.resetSelection()` | `:2707-2800` IME selection window | 存在 (`TextInput.prototype.getElement`, iOS/非 iOS 两套 resetSelection) |
| `Autocomplete.prototype.$init` (返回 popup), `showDocTooltip`, `tooltipNode` | `:2073-2107` 弹窗触摸滚动补丁 | 存在; 上游 `showDocTooltip` 已自带 `pointerEvents=auto` 与 `overscrollBehavior=contain` |
| `ace/ext/error_marker.showErrorMarker(editor, dir)`, `session.widgetManager.getWidgetsAtRow` | `:5145-5207` | 存在 |
| `ace/ext/language_tools.addCompleter`, `completers` 数组, `completer.insertMatch/getDocTooltip/identifierRegexps` | `:3839-3969` | 存在; `CompletionProvider.insertMatch` 仍优先调用 `data.completer.insertMatch(editor, data)` |
| `ace/autocomplete/util.getCompletionPrefix(editor)` | `:4069` | 存在 |
| `ace/snippets.snippetManager.insertSnippet` | `:3890` | 存在 |
| `editor.execCommand("startAutocomplete")` | `:3720`, `:4098` | 存在 (`Autocomplete.startCommand`, 由 `enableBasicAutocompletion` 注册) |
| `renderer.$padding`, `characterWidth`, `lineHeight`, `scrollToX/Y`, `updateFontSize/updateFull/updateText/updateCursor`, `getFirstVisibleRow` | 字号/滚动/双指缩放 | 全部存在 |
| `session.getMode().$id` | 三处 mode 路由 | 存在 |
| CSS 类 `ace_gutter-cell`, `ace_fold-widget`, `ace_breakpoint`, `ace_error/warning/info`, `ace_tooltip`, `ace_doc-tooltip`, `ace_autocomplete`, `ace_text-layer`, `ace_scroller`, `ace_mobile-menu` | `autojs6.css`, 桥接层 | 存在; gutter 单元格子节点结构有变 (见 §2.4) |

### 2.4 1.44.0 行为差异与适配点

1. **行号栏 DOM**: 1.44.0 的 gutter 单元格由 `onCreateCell` 创建 `文本节点 + span(折叠) + span(注解, 内含 span.ace_icon) + 自定义小部件`;
   `useSvgGutterIcons` 开启时单元格类名变为 `ace_gutter-cell_svg-icons`. 桥接层 `editor.on("guttermousedown")` (`:5651`)
   以 `target.className.indexOf("ace_gutter-cell") === -1` 早退, 点在注解图标或折叠按钮上会直接失效;
   `isDiagnosticGutterCell` / `isGutterFoldWidgetEvent` / 断点 24 px 命中区都要改为按祖先单元格计算 (处理函数在 `:5634-5658`).
2. **上游触摸处理器无法运行期替换**: `ace/mouse/mouse_handler` 在模块定义时执行
   `var addTouchListeners = require("./touch_handler").addTouchListeners`, 事后改写导出无效. 但上游
   `event.addListener(el, type, fn, editor)` 会把监听器登记到 `editor.$toDestroy` (`EventListener{elem,type,callback}`),
   可以精确找到 container 上的 touchstart / touchmove / touchend / contextmenu 四个监听并移除. 这是覆盖层的主机制,
   capture 阶段 `stopImmediatePropagation` 只作兜底.
3. **上游移动菜单**: `enableMobileMenu` 默认 `true`, 长按会创建 `ace_mobile-menu`; 必须显式关闭.
4. **ext-language_tools**: 1.4.12 中 `insertMatch` 引用全局 `editor` 的 bug 已修, `autojs6_ace_bridge.js:5443`
   的 `global.editor = editor` 可删. `Autocomplete` 改为 `Autocomplete.for(editor)` 按需创建, `editor.completer`
   在首次触发前可能为 `null` (桥接层已做空判断). 新增 `showLoadingState`, `emptyMessage`, `setSelectOnHover` (默认 false),
   `stickySelectionDelay`, `inlineEnabled`, `triggerCharacters`, `liveAutocompletionDelay/Threshold`.
5. **文本层超长行**: `Text.prototype.MAX_LINE_LENGTH = 10000`, 超出部分渲染 `<click to see more...>` 按钮
   (`$renderOverflowMessage`). 桥接层守卫在 16 K 字符触发, 现在永远排在上游截断之后, 实际已失效; A6-4 统一处理.
6. **textinput**: 1.44.0 在 `isMobile` 分支增加了 `lastSelectionStart < 1 && start == end` 时的 `resetSelection`,
   以及 `onSelect` 中 selectionStart 变化即重置; Android 上 `". "` 转空格的 workaround 保留. 桥接层的
   IME selection window (`:2703-2903`) 与 `installTouchCursorSelectionGuard` (`:3770`) 必须在 Gboard 与中文输入法上复测.
7. **Worker 加载**: 1.44.0 默认 `loadWorkerFromBlob: true`, 通过 `net.qualifyURL` 把 `workerPath` 转成绝对 URL 后
   在 Blob worker 内 `importScripts`; 与 1.4.12 机制相同, Lua worker 预期可用, A1 验证门复核.
8. **JVM 测试**: `AceHistoryOperationBridgeTest.kt:40-42` 断言压缩后 ace.js 的子串
   (`e.lines.length<=1&&!e.lines[0]`, `!o.comparePoints(e.start,e.end)`), 换文件后必失败, 需改为语义断言或执行式测试.
9. **版本号引用**: `ace-builds-1.4.12` 字面量出现在约 40 处 (附录 A). `ace_font_catalog_v1.json` 的 8 处是远端字体目录的
   `source.path` 来源说明 (该 JSON 是已签名远端目录的内置副本, 不随目录改名修改); `ACE_RUNTIME_REVISION`
   (`AceCodeEditor.kt:3698`) 进入诊断快照.
10. **Kotlin mode**: 上游 1.44.0 已重写为 `createKeywordMapper` 风格 (8,398 B), 项目补丁中的关键字映射不再需要,
    `snippetFileId` 关联需复核; 项目维护的 `snippets/kotlin.js` 继续使用.
11. **主题**: 当前 48 个主题已是新格式, 1.44.0 同名文件仅行尾差异; `theme-textmate.js` 在 1.44.0 缩为 616 B
    (内容并入 ace.js). 宿主主题列表 48 项在 1.44.0 全部存在.
12. **Java 关键字补全** (G-A1 发现): 1.44.0 的 Java 高亮规则把关键字从 `createKeywordMapper` 移到单独的正则规则,
    `Mode.getCompletions` 只剩 this, 常量与语言类, `public` 等关键字不再出现在关键字补全中. `autojs6/autojs6_mode_patches.js`
    在 mode 加载后从高亮规则提取关键字并补回 `$keywordList`, 不改官方文件.
13. **高分屏图层** (G-A1 发现): 1.44.0 去掉了 `.ace_hidpi` 下文本层, 行号层, 内容层与行号栏的 `will-change: transform`.
    OPD2413 (2400x3392) 上编辑器进程的 EGL 图形内存由约 128 MiB 增至 208 MiB, 23046RP50C 只增约 4 MiB.
    `autojs6.css` 补回该规则后与 1.4.12 一致. A5-3 (customScrollbar) 等改动图层结构的项目需在 OPD2413 复测内存.

### 2.5 体积与收益

| 项目 | 数值 |
|---|---|
| 当前 `src-min-noconflict/` 合计 | 1,332,235 B (1.27 MiB) |
| 同一文件集合换成 1.44.0 | 1,489,138 B (1.42 MiB), +156,903 B |
| 主要增量 | ace.js +92,722; mode-jsx +21,083; ext-language_tools +19,163; mode-java +11,484; worker-lua +10,491; mode-javascript +9,432; mode-typescript +9,386 |
| 主要减量 | mode-kotlin -17,828 (切官方后); theme-textmate -3,187 |
| 新增文件 | mode-tsx 30,258; worker-json 24,460; ext-whitespaces_in_selection (约 10 K); 覆盖层脚本 (估 25-35 K 未压缩) |
| 预估总增量 | 约 250-300 KB 未压缩 (功能优先档不设硬限, A8 记录实际值) |

上游收益 (1.4.13 -> 1.44.0 CHANGELOG 摘录): Android 多行删除 bug (#5248), jshint 2.13.6 / ES2020, 折叠修复
(jsdoc 注释折叠, 多 mode 注释折叠, 折叠行上的断点回归修复), 缩进参考线在自动换行下的高亮修复, 补全弹窗滚动条重叠修复,
弹窗 a11y 与 `skipFilter`, 文本标记 (text markers, 1.43.2), 多行搜索 (1.39), 自定义滚动条与 gutter 注解指示 (1.12),
SVG gutter 图标 (1.13), `Text.MAX_LINE_LENGTH` 溢出按钮, 官方 mode-tsx, ace.d.ts / ace-modules.d.ts / ace-modes.d.ts 类型声明.

上游校验值: `ace-builds@1.44.0` tarball `https://registry.npmjs.org/ace-builds/-/ace-builds-1.44.0.tgz`,
shasum `d657730f665fccf72d2945d95887e12c514a29f1`, integrity
`sha512-PFNMSYqFdEUkul2Ntud0HvA09AgY+F1ag0UYdpMH60wNI/qOA8cB8tlTgoALMEwIdUPJK2CjrIQ7OnbiSS/ugQ==`.

### 2.6 风险矩阵

| 风险 | 等级 | 缓解 | 验证门 |
|---|---|---|---|
| 覆盖层无法完整复现 Auto.js 触摸手感 (长按/双击/拖拽/惯性) | 高 | 逐函数重建 + 附录 B 对照清单在 8 台设备逐项核对; 惯性参数保持原值 | G-A2 |
| `$toDestroy` 移除上游监听失败或顺序错误导致双重处理 | 中 | 安装时断言移除数量为 4, 失败则启用 capture 兜底并上报 `notifyRecoverableError` | G-A2 |
| Gboard / 中文输入法在新 textinput 下的光标漂移, 重复字符 | 中高 | 附录 C IME 清单; 保留桥接层 selection window 并补充日志事件 | G-A3 |
| gutter DOM 变化导致断点 / 诊断 / 折叠点击失效 | 中 | A3-1 改为祖先匹配 + 执行式测试覆盖 | G-A3 |
| 补全触发改用上游机制后时序变化 (dot 后重启, 退格关闭) | 中 | A5-6 行为对照表, 不等价则保留自研触发 | G-A5-6 |
| ghost text 与 IME 组合输入冲突 | 中 | 默认关闭; 组合输入期间强制隐藏 | G-A5-7 |
| 超长行改用 MAX_LINE_LENGTH 后 50 万字符单行卡顿或 ANR | 中 | G8441 上计时; 不达标则保留守卫 | G-A6-4 |
| 冷启动因 ace.js 增大 92 KB 而变慢 | 低中 | A0 先取新基线, A8 复测, +10% 门 | G-A8 |
| Windows 检出 CRLF 破坏资产哈希 | 低 | `.gitattributes -text` + JVM 守护测试 | A6-1 |
| 老 WebView (API 24/28) 不支持 1.44.0 使用的语法或 API | 低 | 官方构建目标为 ES5 + 少量 polyfill; G-A1 在 G8441 与 x86 模拟器验证 | G-A1 |

## 3. 里程碑总览

| 里程碑 | 内容 | 风险 | 前置 | 状态 |
|---|---|---|---|---|
| A0 | 分支, 基线采集, 上游下载与校验, 定制源码重建 | 低 | -- | 进行中 (剩 A0-6 设备实测) |
| A1 | 官方资产替换, 目录改名, 引用审计, 可启动 | 中 | A0 | 进行中 (剩 G-A1 设备门) |
| A2 | 移动端交互覆盖层移植 (触摸, ActionMode, 惯性, 放大镜) | 高 | A1 | 进行中 (离线等价已证, 待 G-A2 真机) |
| A3 | 桥接层适配与 1.4.12 专属代码清理 | 中 | A1 | 进行中 |
| A4 | 语言资源: tsx, Kotlin 官方 mode, worker-json, 其余 mode/snippets 复核 | 低中 | A1 | 进行中 (A4-1 待设备, A4-3 暂缓) |
| A5 | 上游能力纳入 (视觉 4 项, 补全 4 项) | 中 | A2, A3 | 未开始 |
| A6 | 工程与健壮性 (清单校验, 类型检查, 执行式测试, MAX_LINE_LENGTH) | 中 | A1 (A6-4 需 A3) | 进行中 (A6-1 完成) |
| A7 | 宿主设置联动 (AutoJs6 仓库) | 低 | A5 | 未开始 |
| A8 | 回归, 性能, 文档, 发布评估与合并决策 | -- | 全部 | 未开始 |
| X | 横切约束 | -- | 全程 | 持续 |

推进顺序: A0 -> A1 -> (A2 与 A3 可并行, A2 优先) -> A4 -> A5 -> A6 -> A7 -> A8. A6-1 (清单与校验) 可在 A1 完成后提前做,
以便后续每次改动都有资产完整性保护.

---

## 4. A0 · 准备与基线

- [x] **A0-1** 从 `master` (f067e63 或更新) 创建分支 `ace-1.44.0` 并 checkout; 确认 `git status --short` 干净.
      —— 验收: `git branch --show-current` 为 `ace-1.44.0`, 无 worktree 新增.
      结论 (2026-10-13): 已自 f067e63 创建并 checkout; 工作区仅有本文件 (未跟踪), `git worktree list` 只有主工作区.
- [x] **A0-2** 用当前 `master` 构建的 debug APK 在三台基线真机 (968e9f18 / BH900ASK9E / QV710AF65F) 各跑 3 轮
      `tools/ace-lsp/measure-editor-performance.ps1 -Iterations 3`, 记录 Activity -> 首次 draw, Activity -> ready,
      session -> ready 三项中位数到 `tools/ace-lsp/MILESTONE_BASELINES.md` 新节 "A0 升级前基线", 注明 WebView provider 版本.
      —— 验收: 三台设备各有完整 JSON 输出与中位数表; 这是 G-A8 的比较基准 (不再使用 2026-08 的 M2 数字).
      结论 (2026-10-13): 已记录到 `MILESTONE_BASELINES.md` "A0 升级前基线" (universal debug APK SHA-256 `361e95bc...1e50`).
      ready 中位数: 23046RP50C 932.2 ms, G8441 1,091.6 ms, XQ-AT72 599.0 ms; 原始 JSON 在 `build/ace-perf/a0-baseline.json`.
      同时新增 `AceLongLineBaselineTest` 并在 G8441 测了 3 轮 G-A6-4 的 1.4.12 参照 (见同文件 "A0 单行 50 万字符基线"), A0 版
      APK 存档在 `build/ace-perf/apk-a0/` (不入库; 被清理时在 A1 之前的最后一笔提交上重新构建, 主 APK 代码与 f067e63 相同). 注意: 测量后发现 "3-Block Compose" 会话也在用同一批设备跑仪器测试 (首次可见活动为
      14:34, 晚于本次测量结束的 14:30), 之后的设备测试需与其错开.
- [x] **A0-3** 下载 `ace-builds@1.44.0` tarball, 校验 shasum `d657730f665fccf72d2945d95887e12c514a29f1` 与 §2.5 的 integrity,
      解压到 `build/ace-upstream/1.44.0/` (不入库); 同时解压 `ace-builds@1.4.12` 到 `build/ace-upstream/1.4.12/` 供比对.
      —— 验收: `tools/ace-lsp/fetch-ace-upstream.mjs <version>` 可重复执行并打印校验结果; 脚本入库.
      结论 (2026-10-13): 两个版本的 shasum 与 integrity 均通过, 文件数 2151 / 1712 与 npm 元数据一致; 重复执行复用已解压目录
      (印章文件 `.ace-upstream.json`), 缓存的 tarball 校验失败时自动重新下载. 解包用纯 Node 实现, 不依赖系统 tar.
      `build/ace-upstream/1.44.0/src/ace.js` 是上游未压缩的可读构建, 后续适配以它为准.
- [x] **A0-4** 把当前 `ace.js` 中的 8 个定制模块 (`touch_handler`, `magnifier.js`, `scroller.js`, `velocity-tracker.js`,
      `regression.js`, `editor` 增补段, `virtual_renderer.getClientPosition`, `mouse_handler.magnifierEnabled`) 从压缩产物
      提取并反混淆为可读源码, 放到 `tools/ace-mobile/reconstructed/` (入库, 作为移植对照与审计依据), 每个文件头部注明
      提取自 `ace.js` 的字节偏移与模块名.
      —— 验收: 逐函数与压缩产物对照, 行为等价; 本文件 §2.2 的行为描述据此复核并修正.
      结论 (2026-10-13): 原始字节切成 19 个片段放在 `reconstructed/original/` (偏移, 长度, SHA-256 见其 `manifest.json`;
      `extract-original-slices.mjs` 直接从 Git 对象 f067e63 重新生成), 可读重建 8 个文件. 逐模块比对另发现 5 处小定制
      (默认处理器与 focusEditor 的移动端跳过, textinput 的 contextmenu, gutter 提示随 touchscroll 隐藏, `lib/event`
      修饰键判定, 默认字体栈), 一并重建并写入 §2.2. `verify-reconstructed.mjs` 让原始片段与重建源码在同一假环境中运行:
      3176 项检查全部一致 (43 个触摸场景的完整调用轨迹, 5 个 ActionMode 场景, 纯算法模块数千组输入); 对重建源码做 41 处
      单点变异全部被检出. 复核中修正的描述: 速度跟踪恒为一阶拟合, "选区在视口内" 判断恒为真, 轻点须 100 ms 内抬起,
      changeSelection 监听从未生效, `editor.popup` 从未赋值; 完整清单见 `tools/ace-mobile/README.md`.
- [x] **A0-5** 核实并记录定制模块的来源与许可证 (Auto.js 定制; `scroller.js` 为 AOSP `OverScroller` 样条算法移植;
      `regression.js` 疑似 regression-js), 结论写入 `THIRD_PARTY_NOTICES.md` 草稿段 (A8-7 正式提交).
      —— 验收: 每个模块有 "来源 / 许可证 / 核实依据" 三栏, 无法核实的明确标注 "未核实, 按项目许可证分发".
      结论 (2026-10-13): 草稿在 `tools/ace-mobile/README.md` "来源与许可证". `regression.js` 确认为 regression-js 2.0.x (MIT,
      与 npm `regression@2.0.1` 在 5250 组输入上结果一致); `scroller.js` 的常量与样条算法与 AOSP OverScroller 一致 (Apache-2.0,
      移植者未知); 其余定制 (触摸处理, 放大镜, ActionMode, 速度跟踪等) 来源未核实. 线索指向 Auto.js Pro 的编辑器资产
      (AutoJs6 `docs/dev/autojs-pro-9-feature-comparison.md` 记录 Pro 9 编辑器为 Ace 1.4.12 且有 "选区放大镜"), 而 Auto.js Pro
      是闭源软件, 未找到授权说明, 因此这里没有按 "按项目许可证分发" 标注. **待维护者决定**: A2 是按原计划移植重建源码,
      还是只依据 `tools/ace-mobile/README.md` 的行为描述与 `touch-harness.mjs` 场景重新实现 (等价性仍用同一组场景校验).
- [ ] **A0-6** 在两台设备 (G8441, 23046RP50C) 上按附录 B 逐项记录当前 1.4.12 行为 (文字记录, 必要时录屏), 作为 G-A2 的参照.
      —— 验收: 附录 B 每行填有 "1.4.12 实测" 一列.
      进度 (2026-10-13): 新增 `AceTouchInteractionDeviceTest` (UiAutomation 注入真实触摸, 记录 JS 选区 / 滚动 / ActionMode 调用
      与宿主软键盘 / 工具条状态), 在 G8441, 23046RP50C 与 XQ-AT72 上用 A0 版 APK 跑通, 附录 B 的 15 行已填实测, 原始记录入库在
      `tools/ace-mobile/device-records/`. 第 11, 14, 16, 17, 18 项无法可靠自动化, 需要维护者手测后补填, 完成后勾选本项.
      设备与其他会话共用, 测试前需先与占用方确认 (本轮借用了 3-Block Compose 与 3-Maple Image 会话让出的时段).

## 5. A1 · 官方资产替换与目录改名

- [x] **A1-1** 新建 `app/src/main/assets/editor/ace-builds-1.44.0/`, 从 A0-3 的解压目录按字节复制
      `src-min-noconflict/` 下当前集合的同名文件 (ace.js, ext-language_tools, ext-searchbox, ext-beautify, 8 个 mode,
      worker-javascript, worker-lua, 48 个主题, snippets/{java,javascript,json,lua,typescript}.js) 以及新增的
      `mode-tsx.js`, `worker-json.js`, `ext-whitespaces_in_selection.js`, `snippets/tsx.js`; 复制上游 `LICENSE`.
      保留项目维护的 `snippets/python.js`, `snippets/kotlin.js`, `theme-visual_studio.js`, `theme-visual_studio_dark.js`;
      `mode-kotlin.js` 先沿用项目版本 (A4-2 再切换).
      —— 验收: 除保留项外, 每个文件 SHA-256 与 A0-3 解压目录一致 (A6-1 的清单生成器输出证明).
      结论 (2026-10-13): 70 个文件与 `build/ace-upstream/1.44.0` 逐字节一致 (含 4 个新增文件与上游 LICENSE, LICENSE 文本与 1.4.12 相同); 5 个保留项按 Git 对象原样 (LF) 恢复. 提前加入 `.gitattributes` 的 `src-min-noconflict/** -text` 与 `LICENSE -text` (A6-1 的一部分), 检出不再改写字节.
- [x] **A1-2** `git mv` 旧目录下 `autojs6/`, `autojs6_editor.html`, `fonts/` 到新目录, 删除旧目录; 不改动任何项目脚本内容.
      —— 验收: `git status` 显示为 rename, 旧目录不存在.
      结论 (2026-10-13): 改为整目录 `git mv ace-builds-1.4.12 ace-builds-1.44.0`, 299 个文件全部识别为 rename, 项目脚本内容未改动.
- [x] **A1-3** 按附录 A 更新全部引用: `AceEditorAssets.kt:7`, `AceBridge.kt:325`, `AceCodeEditor.kt:3696/3698`
      (`ACE_RUNTIME_REVISION` 改为 `ace-builds-1.44.0-autojs6`), `AceEditorFontManager.kt:524`,
      `app/build.gradle.kts:21/24/27/35/156/215/296`, `tools/ace-lsp/*.mjs` 12 处,
      JVM 测试 5 个文件, `THIRD_PARTY_NOTICES.md`, `tools/ace-lsp/README.md`, `Roadmap.md` 与 `MILESTONE_BASELINES.md`
      中的路径说明 (历史表格中的版本字样保留, 加注 "已于 2.0.0 迁移"). `ace_font_catalog_v1.json` 不改 (见 §2.4 第 9 条).
      —— 验收: `grep -rn "ace-builds-1.4.12"` 在仓库 (排除 `.git`, `build/`, `ace_font_catalog_v1.json`, 本文件 §2 与附录)
      无命中; `:app:testDebugUnitTest` 通过 (A1-5 修改后).
      结论 (2026-10-13): Gradle 提取 `aceBuildsAssetRoot`; Kotlin 4 处, JVM 测试 5 个文件, `tools/ace-lsp` 7 个脚本与 README, `THIRD_PARTY_NOTICES.md` (Ace 段改为 1.44.0 并写明 tarball, shasum, integrity 与 5 个项目维护文件), `Roadmap.md` 2 处已更新. `ACE_RUNTIME_REVISION` 为 `ace-builds-1.44.0-autojs6`. 剩余旧路径只在 `ace_font_catalog_v1.json` (按决策保留), `fetch-ace-upstream.mjs` (tarball 地址) 与 `tools/ace-mobile/` (重建源码的来源说明).
- [x] **A1-4** `autojs6_editor.html`: 在 ext-beautify 之后增加 `ext-whitespaces_in_selection.js`; 预留覆盖层脚本位置
      (A2-2 插入, 位于 `autojs6_ace_bridge.js` 之前); 不改 viewport 与其他标签.
      —— 验收: 页面在桌面 Chrome 用 `file://` 打开能创建编辑器 (仅作冒烟, 不作为门).
      结论 (2026-10-13): 已在 ext-beautify 之后加入 `ext-whitespaces_in_selection.js`. 内置浏览器不能打开 `file://`, 改用 jsdom 无头加载入口页冒烟: `ace.version` 为 1.44.0, 桥接层完成初始化并调用 `notifyReady`, 无脚本错误; `editor.$toDestroy` 中容器上的触摸相关监听正好是 contextmenu / touchstart / touchend / touchmove (印证 A2-5).
- [x] **A1-5** 更新 `AceEditorAssets.requiredAssetPaths`: 新增 `mode-tsx.js`, `worker-json.js`,
      `ext-whitespaces_in_selection.js` (及 `snippets/tsx.js` 若存在); 同步 `AceEditorAssetsTest.kt`.
      `AceHistoryOperationBridgeTest.kt:40-42` 的两条压缩子串断言暂改为对 `UndoManager` 公开行为的注释说明并标记
      `@Ignore("A6-3 替换为执行式测试")`, 不得长期忽略.
      —— 验收: JVM 测试全绿; `@Ignore` 条目在 A6-3 关闭.
      结论 (2026-10-13): `requiredAssetPaths` 与 `AceEditorAssetsTest` 新增 4 项. 1.44.0 压缩产物中 `Document.applyDelta` 的空增量守卫与 1.4.12 写法相同, 所以 `AceHistoryOperationBridgeTest` 没有加 `@Ignore`, 而是把断言收紧为完整守卫语句 (文件已按字节固定), A6-3 再换成执行式测试. 1.44.0 的 snippets 模块改用相对 ID 读取文本, `verify-runtime.mjs` 的简化加载器已支持相对 ID. JVM 测试 172 项与 6 个 Node 校验任务通过.
- [x] **A1-6** `editor.setOptions` (`autojs6_ace_bridge.js:5497`) 增加 `enableMobileMenu: false`; 其余选项不变.
      —— 验收: 长按不出现 `ace_mobile-menu` 元素 (此时上游触摸处理器仍在, 只验证菜单关闭).
      结论 (2026-10-13): 已加入 `enableMobileMenu: false`, 无头冒烟中 `getOption("enableMobileMenu")` 为 false; 真机长按验证随 G-A1 进行.
- [ ] **G-A1** 可启动门: debug APK 在 8 台设备上运行 `AceCodeEditorSmokeTest`, `AceLanguageRoutingSmokeTest`,
      `AceCodeFoldingSmokeTest`, `AcePythonSemanticSmokeTest`, `AceLuaSemanticSmokeTest`, `AceJavaSemanticSmokeTest`
      全部通过; Lua 文档出现 worker 诊断注解 (验证 Blob worker 加载); 手动打开 JS 文档可输入, 补全, 折叠.
      此阶段移动端手感与 1.4.12 不一致属预期 (上游触摸处理器临时生效), 不计为失败.
      (降级路径: 某设备上 ace.js 抛语法/运行错误 -> 记录 WebView 版本, 评估是否需要 `fixoldbrowsers` 级 polyfill,
      不得改动上游文件, 只能在 `autojs6/` 增加前置 polyfill 脚本.)
      进度 (2026-10-13): 23046RP50C (WebView 130), OPD2413 (ColorOS, WebView 136) 与 x86_64 API 37.1 16 KB 模拟器 (WebView 149)
      均 18/18 通过; x86 API 27 模拟器 (Chrome 69) 16/18, 失败的 2 项依赖 TypeScript 语言服务, A0 版在同一模拟器上同样失败
      (旧 WebView 跑不了 TypeScript 6), 不属于回退. Lua worker 诊断注解由 `luaWorkerPublishesSyntaxAnnotationsAndStopsOutsideLua`
      覆盖并通过; 23046RP50C 上长按不出现 `ace_mobile-menu` (A1-6). 过程中发现并修复两处回退 (§2.4 第 12, 13 条):
      Java 关键字补全缺失 (新增 `autojs6/autojs6_mode_patches.js`), 以及 OPD2413 上图形内存增加约 80 MiB 导致 Python 语义冒烟的
      300 MiB 门间歇失败 (`autojs6.css` 补回 1.4.12 的 `will-change: transform`). 22120RN86C (WebView 111) 16/18: TypeScript 诊断
      超过 2000 ms 被判超时, 以及 ECJ 用例等待超时; 同一设备上 A0 版同样失败这两项 (对比运行中 A0 失败 2 项, A1 失败 1 项), 属于该设备
      既有的性能问题, 不是回退. G8441 (Chrome 126) 用 A2 构建补跑 18/18 通过. XQ-AT72, XQ-DQ72 当时被其他会话占用, 待让出后补跑;
      门在 8 台补齐前不勾选.

## 6. A2 · 移动端交互覆盖层移植

目标: 在不修改官方 `ace.js` 的前提下, 让 8 台设备上的触摸交互与 1.4.12 定制版逐项等价 (附录 B), 并把放大镜修到可用.
全部代码放在 `autojs6/mobile/`, 以 `ace.define("autojs6/mobile/<name>", ...)` 定义, 通过 `AutoJsAceMobile.install(editor, options)`
在 `initEditor()` 中紧接 `global.ace.edit("editor")` 之后安装 (早于其他 `install*` 调用, 保持与 1.4.12 一致的监听器相对顺序:
覆盖层监听器为 bubble 阶段, 桥接层的双指缩放抑制仍为 capture 阶段并先执行).

- [x] **A2-1** `autojs6/mobile/autojs6_mobile_scroller.js`: 从 A0-4 重建的 `scroller.js` 整理为可读模块
      (`createDefault`, `fling`, `computeScrollOffset`, `abortAnimation`, `isFinished`, `getCurrX/Y`, `getCurrVelocity`),
      保留摩擦 0.015, `mPpi 440`, 样条表 100 段等常量.
      —— 验收: Node 单测 (A6-3 框架) 用固定输入比对 `fling -> computeScrollOffset` 序列与重建源一致.
      结论 (2026-10-13): `autojs6/mobile/autojs6_mobile_scroller.js`, 只保留 fling 路径 (1.4.12 的飞轮加速与速度字段从未生效);
      `tools/ace-mobile/verify-overlay.mjs` 用 120 组随机 fling (含运行中再次 fling 与中途终止) 与 1.4.12 原始片段逐帧比对, 结果一致.
- [x] **A2-2** `autojs6/mobile/autojs6_mobile_velocity_tracker.js`: 合并 `regression.js` 与 `velocity-tracker.js`
      (100 ms 窗口, 一阶最小二乘, 斜率按 0.01 px/ms 四舍五入, `computeVelocity(1000)` 返回取反后的 px/s; A0-4 已确认 1.4.12
      实际恒为一阶, 只保留一阶路径即可等价); 去掉 `Math.signum` 全局 polyfill, 改为模块内函数.
      —— 验收: 单测覆盖 2 点 / 3 点 / 超窗口点被丢弃三种情况; 与 `tools/ace-mobile` 原始片段在同一组随机序列上结果一致.
      结论 (2026-10-13): 一阶拟合沿用 regression-js 2.0 (MIT) 的求解与 0.01 精度; 300 组随机序列 (含 Chrome 小数时间戳, 1 至 15 点,
      含超出 100 ms 窗口的点) 与原始片段结果一致.
- [x] **A2-3** `autojs6/mobile/autojs6_mobile_action_mode.js`: 以 mixin 方式给 `editor` 增加 `actionMode`,
      `startActionMode()`, `startActionModeIfSelectionInView(selectAll)` (200 ms 延迟; 1.4.12 的视口判断恒为真, 等价实现是
      "选区非空且滚动区域高度非 0"), `$nativeStartActionMode(rect, hasSelection, selectAll)`, `finishActionMode()`, 以及与 1.4.12
      相同的 change 监听 (无选区模式下调用 `autojs.finishActionMode()`); 1.4.12 挂在 changeSession 上的 changeSelection 监听
      从未生效, 不移植. 矩形沿用 "滚动区域高度的分数" (Kotlin 侧已按无效矩形处理, 改传像素属于行为变化, 需另行决策);
      辅助函数改用安装时的 editor 实例而非全局 `editor`. 给 `editor.renderer` 增加 `getClientPosition(pos)`.
      调用 `global.autojs.startActionMode(left, top, right, bottom, hasSelection, selectAll)` 与 `finishActionMode()`,
      签名与 `AceBridge.kt:211-225` 一致; 桥接层 `:1531` 与 `:2475` 的既有调用保持不变.
      —— 验收: `tools/ace-mobile/verify-reconstructed.mjs` 的 5 个 ActionMode 场景对覆盖层实现产生相同调用轨迹.
      结论 (2026-10-13): `autojs6/mobile/autojs6_mobile_action_mode.js`. 实现时改为保留 changeSession 上的 changeSelection 监听
      (与 1.4.12 一样, 首个会话不受影响, 将来若调用 `setSession` 也保持同样行为), 5 个场景在有无 `autojs` 两种情况下调用轨迹一致.
- [ ] **A2-4** `autojs6/mobile/autojs6_mobile_touch_handler.js`: 重建 §2.2 描述的全部单指行为 (单击 / 双击 / 长按 /
      光标与锚点拖拽 / 滚动 / 惯性 / 惯性后 ActionMode / `touchscroll` 事件 / gutter 与弹窗跳过 / `preventDefault`).
      双指: 只做 "取消长按计时并 `finishActionMode`", 缩放交给桥接层 `suppressAceBuiltInPinchZoom` (`:2121`), 删除 body zoom 路径.
      1.4.12 检查的 `editor.popup` 从未被赋值, 补全弹窗又在编辑器容器之外, 所以不移植这一判断 (改成判断弹窗打开会让弹窗打开时
      点击编辑器失效, 属于行为变化). `autojs.showSoftInput()` / `autojs.performLongPressFeedback()` 调用保持原位置.
      —— 验收: `touch-harness.mjs` 全部场景 (双指场景除外, 因 body zoom 被移除) 与原始片段产生相同调用轨迹; 附录 B 第 1-12 项
      在 2 台设备上通过 (完整 8 台在 G-A2).
      进度 (2026-10-13): `autojs6/mobile/autojs6_mobile_touch_handler.js` 已完成; 43 个场景与 1.4.12 调用轨迹一致 (比较时忽略 DOM 写入
      与 `renderer.onResize`, 即旧版的放大镜 DOM 与 body zoom), 唯一的预期差异是 `editor.popup` 场景. 对覆盖层做 28 处单点变异全部被检出.
      真机部分随 G-A2 进行.
- [ ] **A2-5** 卸载上游触摸处理: 安装时遍历 `editor.$toDestroy`, 移除 `elem === editor.container` 且 `type` 属于
      `touchstart / touchmove / touchend / contextmenu` 的 4 个 `EventListener` (调用其 `destroy()` 并从数组删除);
      断言移除数量为 4, 否则启用兜底: 在 container 上以 capture 注册同名事件并 `stopImmediatePropagation`,
      同时 `notifyRecoverableError("mobileOverlay", ...)` 上报. 两种路径都要把 `editor.$mouseHandler.isMousePressed` 复位.
      —— 验收: 执行式测试断言移除后 `editor.$toDestroy` 中不再有 container 触摸监听; 真机上长按不出现上游行为 (无 `ace_mobile-menu`, 无上游双击选行).
      进度 (2026-10-13): 安装入口 `AutoJsAceMobile.install` 在 `ace.edit` 之后立即执行; jsdom 加载完整页面确认移除了 4 个上游监听
      (contextmenu, touchstart, touchend, touchmove), 未启用兜底, 容器上只剩覆盖层自己的 3 个触摸监听. 兜底模式为覆盖层改在 capture 阶段
      处理并 `stopPropagation` (不用 `stopImmediatePropagation`, 以免挡住桥接层同在 capture 阶段的双指缩放监听). 真机部分随 G-A2.
- [ ] **A2-6** `autojs6/mobile/autojs6_mobile_magnifier.js` + CSS: 重建 `Magnifier`, 在 `autojs6.css` 新增
      `#magnifier` / `#magnifier-content` / `#magnifier-progress` 样式 (圆角容器, 当前行放大约 1.5 倍, 跟随主题调色板变量),
      用 `options.magnifierEnabled` 控制 (来源 A7 的宿主开关, 默认关闭), 在 touchend / touchcancel / 双指 / 页面隐藏时隐藏;
      `zoom` 固定为 1 (不再依赖 body zoom).
      —— 验收: 开启后拖拽光标出现放大镜且内容与当前行一致, 关闭后无 DOM 残留; 8 台设备无遮挡软键盘的情况.
      进度 (2026-10-13): 已重写 (按屏幕行定位克隆的文本层单元格, 折叠与自动换行下不错位; 选区自行绘制并沿用主题的 `ace_selection` 配色;
      放大 1.5 倍; 首次显示时才创建 DOM; 类名 `autojs6-magnifier*` 代替原 id). 开关 `setTouchMagnifierEnabled` 已加到 `AutoJsAce`,
      初始值读 `isTouchMagnifierEnabled` (Kotlin 侧在 A7-1 实现, 缺省 false). 真机验收待开关接通后进行.
- [ ] **A2-7** 覆盖层与桥接层对接: `cancelAceMobileTouchInteraction` (`:1781`) 调用覆盖层的 `cancel()` 清理长按计时与惯性;
      `installTouchCursorSelectionGuard` (`:3770`) 与 `installImeTextInputSelectionWindow` (`:2890`) 不变;
      `global.AutoJsAce` 增加 `getMobileOverlayState()` 供诊断快照使用 (`AceDiagnostics` 增加字段 `mobileOverlay`).
      —— 验收: 诊断快照包含 `mobileOverlay: {installed, uninstalledUpstreamListeners, fallbackCapture, magnifier}`.
      进度 (2026-10-13): `cancelAceMobileTouchInteraction(reason)` 调用覆盖层的 `cancel(reason)`, 只对 `dom_touchcancel`,
      `window_blur`, `pinch_zoom_begin`, `pinch_action_mode` 生效 (清长按计时, 停惯性, 隐藏放大镜, 保留手势模式); 宿主在单指滑动开始
      与折叠占位点击时发出的取消被忽略, 因为 1.4.12 的触摸处理器从未收到过它们;
      `AutoJsAce.getMobileOverlayState()` 已提供. Kotlin 诊断快照字段与 A3-10 的 `aceVersion` 一起加.
- [x] **A2-8** `autojs6.css`: 删除无用的 `.ace_mobile-menu` 规则 (三段 `body.*  .ace_mobile-menu` 与 `.ace_mobile-menu` 本体),
      新增 A2-6 样式; `autojs6_editor.html` 按顺序加载 5 个覆盖层脚本 (scroller -> velocity_tracker -> magnifier -> action_mode -> touch_handler);
      `AceEditorAssets.requiredAssetPaths` 登记 5 个文件.
      —— 验收: `AceEditorAssetsTest` 与 `requiredAceAssetsArePackaged` 通过.
      结论 (2026-10-13): 4 段 `.ace_mobile-menu` 规则已换成放大镜样式; HTML 在 `autojs6_mode_patches.js` 之后按顺序加载 5 个覆盖层脚本;
      `requiredAssetPaths` 登记 5 个文件; JVM 测试通过, `requiredAceAssetsArePackaged` 随 G-A2 的设备运行验证. 另新增 Gradle 任务
      `verifyAutoJs6AceMobileOverlay` (挂在 `check` 上, 约 2 秒).
- [ ] **A2-9** A0-4 补充的小定制在 1.44.0 下的处理:
      textinput 的 contextmenu 用实例覆盖 `editor.textInput.onContextMenu = function (e) { e.preventDefault(); }`
      (1.44.0 的 `$onContextMenu` 经 `host.textInput.onContextMenu` 动态调用, 覆盖即生效); 行号栏提示在覆盖层发出 `touchscroll`
      时调用 `editor.$mouseHandler.$tooltip.hide()` (1.44.0 的 GutterTooltip); `lib/event` 修饰键判定在 1.44.0 是模块内函数,
      无法替换导出, 先确认宿主快捷面板与常见软键盘是否依赖 "独立修饰键事件", 依赖时在 textarea 上用 capture 监听 keydown / keyup
      自行记录并在事件实例上补齐 `ctrlKey` 等标志, 不依赖则记录结论后不移植; 默认处理器与 focusEditor 的移动端跳过不移植
      (覆盖层在 touchstart 上 `preventDefault`, 浏览器不再合成鼠标事件, 触摸行为不变, 外接鼠标与触控笔鼠标模式恢复可用);
      默认字体栈不可观察, 不移植.
      —— 验收: 执行式测试覆盖 contextmenu 与 touchscroll 两项; 修饰键与默认处理器的结论写在本条下.
      进度 (2026-10-13): contextmenu 实例覆盖与 touchscroll 隐藏行号栏提示已实现 (jsdom 确认覆盖生效). 修饰键结论: 不移植. 宿主与插件都不
      发送独立的修饰键事件 (快捷面板直接执行命令), 实体键盘的组合键自带 metaState, 只有少数只发独立修饰键的第三方软键盘受影响.
      默认处理器与 focusEditor: 按计划不移植. 执行式测试待 A6-3.
- [ ] **G-A2** 交互等价门: 8 台设备逐项执行附录 B, 每项与 A0-6 的 1.4.12 实测一致 (惯性手感允许主观 "接近");
      自动部分为在每台设备上运行 `AceTouchInteractionDeviceTest` 并与 `tools/ace-mobile/device-records/` 中同设备的 A0 记录逐场景比对
      (缺 A0 记录的设备先用 `build/ace-perf/apk-a0/` 中的 A0 版 APK 补录);
      进度 (2026-10-13): G8441 上 A2 构建通过 `AceTouchInteractionDeviceTest`, 逐场景与 A0 记录一致 (记录在
      `tools/ace-mobile/device-records/a2-1.44.0-BH900ASK9E.jsonl`), 只有两类差异: 惯性滚动的最终位置 (同一版本重复运行的波动同样大:
      A0 两次 462 / 683, A2 两次 489 / 564), 以及双指场景不再在缩放中途触发长按 (见 A2-7 的取消语义, 属于改进). 首轮真机运行发现宿主在
      每次单指滑动开始时都会发出 `single_finger_scroll` 取消, 覆盖层的 `cancel()` 因此改为只响应 touchcancel, 窗口失焦与双指开始,
      且不清空手势模式, 离线校验新增了对应用例.
      ActionMode 工具条 (`AceSelectionToolbar`) 出现 / 消失时机一致; 旋转屏幕与软键盘弹出后拖拽仍准确.
      (降级路径: 若 `$toDestroy` 与 capture 兜底在某设备都无法阻止上游处理 -> 在本文件记录该 WebView 版本,
      并评估为该设备启用 "上游触摸处理 + 覆盖层只接管 ActionMode" 的降级模式; 仍不得改动官方文件.)

## 7. A3 · 桥接层适配与清理

- [ ] **A3-1** gutter 事件按祖先单元格处理: `editor.on("guttermousedown")` (`:5634-5658`) 用
      `findAncestorWithClassToken(target, "ace_gutter-cell") || findAncestorWithClassToken(target, "ace_gutter-cell_svg-icons")`
      取单元格, 断点命中区改为 `cell.getBoundingClientRect().left + 24`; `isDiagnosticGutterCell` 同时识别 `span.ace_icon` 子节点;
      `isGutterFoldWidgetEvent` 直接接受 `target` 为 `ace_fold-widget` 的情况.
      —— 验收: 执行式测试分别以单元格, 文本节点父级, 注解图标, 折叠按钮为 target 触发事件, 断点 / 诊断 / 折叠各命中一次.
      进度 (2026-10-13): 新增 `findGutterCell` (识别 `ace_gutter-cell` 与 `ace_gutter-cell_svg-icons`), `guttermousedown`,
      诊断提示抑制, 折叠占位与三处折叠按钮判断都改为按祖先单元格计算, `isDiagnosticGutterCell` 增加 security / hint. 在 jsdom 中
      (手工设置字体度量与容器尺寸) 实测: 单元格与其子 span 为目标时切换断点, 错误行的 `ace_icon` 为目标时打开诊断标记而非断点.
      折叠按钮依赖布局, 待 A6-3 的执行式测试覆盖后勾选.
- [x] **A3-2** 删除 1.4.12 专属代码与注释: `:5443` `global.editor = editor` 的 1.4.12 兼容注释 (赋值本身保留: 性能,
      长行与触摸仪器测试以及其他模块通过 `window.editor` 访问编辑器, 只改注释说明用途); `:131-136` 注释改写 (MAX_LINE_LENGTH 语义见 A6-4);
      `:4678` 与 `:4783` 的 "ACE 1.4.x" 注释; `autojs6_lsp_core.js:144` 的版本字样; `README` 中 "Ace 1.4.12 的 TSX" 说明交给 A4-1.
      —— 验收: `grep -n "1\.4\.12\|1\.4\.x" autojs6/*.js` 无命中.
      结论 (2026-10-13): 已改写 5 处注释 (超长行守卫, 两处选项容错, `window.editor` 用途, LSP choice 占位). 1.44.0 对首个 token
      也按 `MAX_LINE_LENGTH` 截断并加展开按钮, 桥接层的 16K 守卫对更长的行仍然生效, §2.4 第 5 条 "实际已失效" 的说法不准确, A6-4 再评估.
- [ ] **A3-3** 补全弹窗补丁复核 (`installCompletionPopupTouchScrollPatch`, `:2073`): 确认 `$init` 仍返回 popup, `showDocTooltip`
      仍在 `this.tooltipNode` 上工作; 上游已设置 `pointerEvents` 与 `overscrollBehavior`, 保留触摸滚动器但去掉重复样式赋值;
      `refreshAutocompletePopupTheme` (`:493`) 改为通过 `Autocomplete.for(editor).popup` 获取弹窗 (弹窗可能尚未创建时跳过).
      —— 验收: 真机上弹窗可手指滚动, 文档提示可滚动, 主题切换后弹窗配色随之变化.
      进度 (2026-10-13): 代码复核结论为无需修改: 1.44.0 的 `$init` 仍返回 popup, `showDocTooltip` 仍使用 `this.tooltipNode`,
      上游只设置了 `pointerEvents` 与 `overscrollBehavior`, 与桥接层的样式不重复; `Autocomplete.for(editor)` 会给 `editor.completer`
      赋值, 且每次打开弹窗都重新 `setTheme`, 所以继续用 `editor.completer.popup` 即可, 不必主动创建. 真机滚动与主题验证随 G-A3 进行.
- [ ] **A3-4** 历史操作钩子复核 (`installHistoryOperationHooks`, `:3469`): 对照 1.44.0 `UndoManager.add / undo / redo` 与
      `EditSession.undoChanges(deltas, dontSelect)`, 确认 `addUndoableHistoryMarker` 的空 delta (`lines: [""]`) 仍被
      `UndoManager` 接受且不改文本; `markClean / isClean` 语义不变.
      —— 验收: `AceCodeFoldingSmokeTest` 与 `hostReplacementSucceedsWhileUserInputIsReadOnly` 通过; A6-3 增加撤销标记用例.
      进度 (2026-10-13): 两个用例在 G-A1 的 5 台设备上均通过; 1.44.0 `Document.applyDelta` 的空增量守卫与 1.4.12 相同. 撤销标记的执行式用例待 A6-3.
- [ ] **A3-5** 折叠路径复核: `foldAll` 的 pending 机制 (`:4898`) 依赖 `changeMode` 事件与 `session.foldAll`; 1.44.0
      `session.unfold(null, true)` 与 `$toggleFoldWidget(row, {children, all, siblings})` 行为对照; 折叠占位符点击
      (`installFoldPlaceholderClickCapture`, `:5411`) 的 `ace_fold` 类名不变.
      —— 验收: `wholeDocumentFoldingPreservesEditingStateAndWorksReadOnly` 通过; 触摸点击折叠占位符展开.
- [ ] **A3-6** IME 路径复核: `getImeTextInputElement` / `resetImeTextInputSelectionWindow` 对接 1.44.0 `TextInput`
      (`getElement`, `resetSelection`), 复核 `onInput` 新增的 `isMobile` 重置条件是否与桥接层 `IME_TEXT_INPUT_PROGRAMMATIC_SELECTION_SUPPRESS_MS`
      窗口冲突; 需要时把 1.44.0 重置事件记入 `imeTextInputSelectionSuppressed` 事件的 reason.
      —— 验收: 附录 C 在 6 台真机通过; `AceRuntimeEventHistory` 中无非预期的 `imeTextInputSelectionDropped`.
- [ ] **A3-7** 字号 / 滚动 / 双指缩放复核: `applyFontSizeSp` (`:4466`), `forceRendererCoordinateRefresh` (`:4485`),
      `scrollToPosition` (`:4555`) 使用的 renderer 成员在 1.44.0 均存在; 复核 `renderer.$padding` 在 1.44.0 是否仍为数字
      (文本层 `$padding` 与 gutter `$padding` 对象不同, 桥接层只读 renderer 的).
      —— 验收: 双指缩放后焦点位置不漂移 (附录 B 第 13 项).
- [ ] **A3-8** CSS 类审计 (`autojs6.css`): `.ace_gutter-cell.ace_breakpoint` 增加 `.ace_gutter-cell_svg-icons.ace_breakpoint`;
      `.ace_doc-tooltip` / `.ace_tooltip` / `.error_widget` 的尺寸限制在 1.44.0 结构下复核; 新增 `.ace_inline_button.ace_toggle_wrap`
      (超长行溢出按钮) 的触摸友好尺寸; 暗色主题下 `ace_line-hover` (setSelectOnHover=false 时的悬停标记) 配色.
      —— 验收: 8 台设备截图抽查无明显错位; 暗色主题下弹窗与提示框可读.
- [ ] **A3-9** Worker 策略复核: `shouldUseAceWorkerForMode` (`:267`) 维持 lua 开启; 确认 1.44.0 Blob worker 在
      `https://appassets.androidplatform.net` 源下 `importScripts` 成功 (G-A1 已验); JSON worker 交给 A4-3.
      —— 验收: `luaWorkerPublishesSyntaxAnnotationsAndStopsOutsideLua` 通过.
- [ ] **A3-10** 诊断快照与事件: `AceDiagnostics` 增加 `aceVersion` (读取 `ace.version`, 1.44.0 为 "1.44.0") 与 A2-7 的 `mobileOverlay`;
      `ACE_RUNTIME_REVISION` 已在 A1-3 更新.
      —— 验收: `sessionDiagnosticsExposeExecutionAlignedTypeScriptProfiles` 扩展断言 `aceVersion == "1.44.0"`.
      备注 (2026-10-13): 与 A2-7 的 `mobileOverlay` 一起改诊断快照 (JS 状态, Kotlin 字段, Bundle 键), 避免两次变更诊断契约.
- [ ] **G-A3** 桥接门: JVM 测试全绿 (无 `@Ignore` 新增), 8 台设备全部 instrumentation 用例通过, 附录 C 在 6 台真机通过.

## 8. A4 · 语言资源

- [ ] **A4-1** TSX 官方 mode: `resolveAceMode` (`:176`) 把 `.tsx` 路由到 `ace/mode/tsx`; `autojs6_completer.js:1200` 附近的
      `MODE_LANGUAGES` 与 `autojs6_lsp_client.js:636` 的 mode 映射增加 `ace/mode/tsx -> typescript 家族`; `applyDocumentWorkerPolicy`
      对 tsx 关闭 worker; README 语言表 TSX 语法由 "部分" 改为 "支持"; 在 `tools/ace-lsp/TSX_HIGHLIGHT_EVALUATION.md` 末尾追加
      "TSX-HL-1 由 2.0.0 关闭" 结论, `Roadmap.md` M0-3 结论行同步加注.
      —— 验收: 打开 `.tsx` 文档 `session.getMode().$id === "ace/mode/tsx"`, JSX 标签获得 tag/attribute token (截图留档);
      `documentPathSelectsModeAndIsolatesJavaScriptCompletions` 扩展 tsx 用例.
      进度 (2026-10-13): 路由, JS 家族判断, 语言 ID (tsx 归入 typescript), 补全器与本地符号的 mode 映射, LSP 客户端判断都已加入
      `ace/mode/tsx`; worker 策略只对 lua 开启, tsx 自然关闭. jsdom 确认样例得到 tag-open / tag-name / attribute-name token;
      设备用例已改为断言 tsx mode 与这些 token; `TSX_HIGHLIGHT_EVALUATION.md` 与 `Roadmap.md` 已加注 TSX-HL-1 关闭.
      README 语言表留给 A8-6 (生成文件). 设备运行后勾选.
- [x] **A4-2** Kotlin 切官方: 用 1.44.0 `mode-kotlin.js` 替换项目版本; 复核官方 `createKeywordMapper` 是否让关键字补全器
      得到非空列表 (`verifyAutoJs6KotlinP2Plus`). 官方 1.44.0 仍未设置 `snippetFileId` (已核查), 因此在运行期补丁脚本
      `autojs6/autojs6_mode_patches.js` (G-A1 时为 Java 关键字已建立) 中对 `ace/mode/kotlin` 设置 `snippetFileId = "ace/snippets/kotlin"`,
      不改官方文件; `MILESTONE_BASELINES.md` M1 表加注 "mode-kotlin 自 2.0.0 起为官方 1.44.0".
      —— 验收: `verifyAutoJs6KotlinP2Plus` 与 Kotlin 样例高亮截图通过; `grep "Ace 1.4.12 marks" src-min-noconflict/mode-kotlin.js` 无命中.
      结论 (2026-10-13): 已换为官方文件 (锁文件中 origin 改为 upstream, 项目文件剩 4 个). jsdom 对比: 官方 mode 关键字补全 73 项
      (含 fun / val / data / companion / suspend), 样例中 package / class / fun / return 等均为 keyword 类 token, 满足设备用例的高亮断言;
      `snippetFileId` 由补丁脚本补为 `ace/snippets/kotlin`, 且补丁以 `capturing` 方式注册在 changeMode 最前面, 保证 ext-language_tools
      加载片段时已生效 (jsdom 中 15 个 Kotlin 片段照常加载). `verifyAutoJs6KotlinP2Plus` 等 6 个 Node 任务与 JVM 测试通过.
- [ ] **A4-3** JSON worker (验证门 G-A4-3): `shouldUseAceWorkerForMode` 对 json 返回 true, 保留 `JSON.parse` 诊断作为
      worker 不可用时的回退; 两者产生的注解去重 (以 worker 注解优先); `applyDocumentLongLineSafetyMode` 下关闭.
      —— 验收: JSON 文档输入错误 JSON 出现 worker 注解, 修正后消失; `luaWorkerPublishesSyntaxAnnotationsAndStopsOutsideLua`
      扩展 json 分支.
- [ ] **G-A4-3** 在 8 台设备验证 worker-json 加载与注解; 任一设备失败则该设备回退 `JSON.parse` 路径且不报错.
      (降级路径: 失败设备比例 > 2/8 -> 默认关闭 json worker, 保留代码路径并记录结论.)
      备注 (2026-10-13): 暂缓实施. 现状是 Lua 的 Ace worker 注解与 LSP 诊断都直接 `setAnnotations`, 后写者覆盖; JSON 若开 worker,
      `validateDiagnosticRun` 的 `JSON.parse` 诊断会覆盖 worker 注解, 需要先给 LSP 客户端加 "worker 活动时以 worker 注解为准并同步到诊断状态"
      的合并逻辑, 再上设备门.
- [x] **A4-4** 其余 mode 复核: 1.44.0 的 `mode-python / lua / java / javascript / typescript / json / jsx` 生效后, 重跑
      `verifyAutoJs6LanguageIndices`, `verifyAutoJs6LspRuntime`, `verifyAutoJs6PythonWorker`, `verifyAutoJs6LuaLanguageServer`,
      `verifyAutoJs6JavaSemanticRuntime`; 比对上游 1.44.0 `snippets/python.js` 与项目版本, 结论 (继续项目维护 / 合并新增条目) 记录在
      `tools/ace-lsp/M1_LANGUAGE_ACCEPTANCE.md` 追加段.
      —— 验收: 5 个 verify 任务通过; 9-mode 矩阵 (README 与 `X4_SETTINGS_ACCEPTANCE.md`) 内容仍准确.
      结论 (2026-10-13): 5 个 verify 任务与 `verifyAutoJs6KotlinP2Plus` 通过. 上游 1.44.0 的 36 个 Python 片段仍含 Python 2 写法,
      继续使用项目维护的 18 个; 结论写入 `M1_LANGUAGE_ACCEPTANCE.md` 末节. 9-mode 矩阵不变 (tsx 仍归入 TypeScript 家族).
- [x] **A4-5** `snippets/tsx.js` (上游存在, A1-1 已复制) 登记到 `requiredAssetPaths`; 复核官方 `ace/mode/tsx` 的 `snippetFileId`
      指向 (1.44.0 源码中 tsx mode 继承 typescript mode, 需运行期确认实际值), 若为空则在 A4-2 的补丁脚本中设置为 `ace/snippets/tsx`.
      —— 验收: tsx 文档中 TAB 展开 snippet; `verifyAutoJs6LspRuntime` 的 snippets 读取用例覆盖 tsx.
      结论 (2026-10-13): 上游 `snippets/tsx.js` 只有一段 `ace.require` 包装, 不定义 `ace/snippets/tsx` 模块, 因此不打包 (已从资产,
      `requiredAssetPaths` 与锁文件移除); 官方 tsx mode 的 `snippetFileId` 为 `ace/snippets/javascript` (jsdom 确认), tsx 文档使用
      JavaScript 片段, 无需补丁.

## 9. A5 · 上游能力纳入

每项都遵循: 插件自带默认值 -> 桥接层 `callBridgeBoolean("isXxxEnabled", default)` -> `AceBridge.kt` 新增 `@JavascriptInterface`
-> `AceEditorDisplayPreferences` / `AceEditorSmartHintPreferences` 新键 (键名见 A7-1) -> `notifyDisplayPreferencesChanged`
路径重新应用. 宿主 UI 在 A7 完成, 完成前靠默认值生效.

### 9.1 视觉

- [ ] **A5-1** `useSvgGutterIcons` (默认开): `editor.setOption("useSvgGutterIcons", enabled)`; A3-8 的断点样式已兼容两种类名;
      `isDiagnosticGutterCell` 同时识别 `ace_icon` 与 `ace_icon_svg`.
      —— 验收: 23046RP50C (3x 密度) 上注解图标边缘清晰, 断点红点位置不变.
- [ ] **A5-2** `highlightIndentGuides` (默认开, 且仅在 `displayIndentGuides` 开启时生效): `setIndentGuidesEnabled` (`:4731`)
      同时设置两项; 关闭缩进参考线时强制关闭高亮.
      —— 验收: 光标进入嵌套块时对应参考线高亮, 自动换行下不错位 (上游 #5621 修复).
- [ ] **A5-3** `customScrollbar` (默认开, 验证门 G-A5-3): `editor.setOption("customScrollbar", enabled)`; 复核触摸拖动滚动条,
      `installScrollChangeHooks` (`:2580`) 的 `scrollToX/Y` 包装仍被触发, 诊断标记在滚动条上的配色跟随 `applyThemePalette`.
      —— 验收: 滚动条上出现错误 / 警告标记, 手指拖动滚动条与惯性滚动互不干扰.
- [ ] **G-A5-3** 8 台设备复核 customScrollbar 与覆盖层惯性滚动; 任一设备出现滚动条吞掉触摸或渲染错位 -> 默认改为关闭并记录.
- [ ] **A5-4** `showWhitespacesInSelection` (默认开): 加载 `ext-whitespaces_in_selection.js` 后 `editor.setOption("showWhitespacesInSelection", enabled)`;
      暗色主题下空白符颜色复核.
      —— 验收: 选中含制表符与空格的文本时显示占位符号, 取消选区后消失.

### 9.2 补全与智能提示

- [ ] **A5-5** 弹窗状态: `Autocomplete.for(editor)` 后设置 `showLoadingState = true`, `emptyMessage = function(prefix) {...}`
      (文案经 `getSmartHintOptions` JSON 由宿主本地化下发, 缺省英文), `setSelectOnHover = false` (断言默认值), `stickySelectionDelay`
      保持 500; 慢速 provider (Pyright / LuaLS) 首包前显示加载项.
      —— 验收: Python 文档冷启动首次补全看到加载态; 无候选时看到提示而不是空弹窗; 指尖滑过候选不改变选中项.
- [ ] **A5-6** 上游 triggerCharacters 替换自研点触发 (验证门 G-A5-6): 映射表
      identifier -> `enableLiveAutocompletion: true, liveAutocompletionThreshold: completionMinChars, liveAutocompletionDelay: completionDelayMs`;
      dot -> `enableLiveAutocompletion: true, liveAutocompletionThreshold: 1e9` 且仅靠 `triggerCharacters`;
      off -> `enableLiveAutocompletion: false`. 静态补全器与 LSP 补全器声明 `triggerCharacters` (JS/TS/Python/Java/Kotlin: `["."]`, Lua: `[".", ":"]`).
      先并行保留 `installMemberCompletionDotTrigger` (`:3737`) 与 `scheduleLiveCompletion` (`:4102`), 以开关 `useUpstreamTrigger` 切换.
      —— 验收: 行为对照表 (3 种触发 x 延迟 0/300 ms x 最小字符 1/3 x "点后重启" x "退格清空关闭") 两套机制逐格等价.
- [ ] **G-A5-6** 对照表全部等价且 6 台真机 IME 下无重复弹窗 -> 删除自研触发代码; 否则保留自研触发, 删除映射代码并记录差异.
- [ ] **A5-7** ghost text 内联预览 (默认关, 验证门 G-A5-7): `Autocomplete.for(editor).inlineEnabled = enabled`;
      组合输入 (`compositionStart` 信号) 期间隐藏; `acceptCompletionOrInsertTab` (`:3827`) 优先接受内联预览;
      `ESC` 处理 (`handleEscapeKey`, `:3971`) 同时清除 ghost text.
      —— 验收: 开启后首选候选以灰色预览显示, TAB 接受, 输入继续时预览更新.
- [ ] **G-A5-7** 6 台真机 Gboard + 中文输入法下开启 ghost text 输入 200 字符样例, 无重复字符 / 光标跳动 -> 维持默认关闭但开关可用;
      出现缺陷 -> 开关隐藏 (宿主不露出), 代码保留并记录.
- [ ] **A5-8** MarkerGroup 同名符号高亮 (默认开): `autojs6_lsp_client.js` 增加 `getDocumentHighlights(pos)` (TS 服务用
      `languageService.getDocumentHighlights`, Pyright / LuaLS 用 `textDocument/documentHighlight`); 桥接层在 `changeCursor`
      防抖 150 ms 后用 `ace.require("ace/marker_group").MarkerGroup` (随 ext-language_tools 提供) 绘制 `autojs6_symbol_highlight`
      标记, 选区变化或文档变更时清除; 超长行安全模式与只读无关 (只读也高亮); `autojs6.css` 增加亮/暗两套底色.
      —— 验收: JS/TS/Python/Lua 文档中光标落在标识符上时所有引用高亮, 移开后清除; `verifyAutoJs6LspRuntime` 增加 documentHighlight 用例.

## 10. A6 · 工程与健壮性

- [x] **A6-1** Ace 资产清单与校验: `tools/ace-lsp/generate-ace-manifest.mjs` 生成
      `app/src/main/assets/editor/ace-builds-1.44.0/manifest.json` (schemaRevision, upstream {version, tarball, shasum, integrity},
      每个 `src-min-noconflict/**` 文件的 bytes / sha256 / origin ∈ {upstream, project}); Gradle `verifyAutoJs6AceAssets`
      (Exec, `tools/ace-lsp/verify-ace-assets.mjs`) 比对清单与工作区文件并挂到 `check`; `.gitattributes` 增加
      `app/src/main/assets/editor/ace-builds-*/src-min-noconflict/** -text`; JVM 守护测试断言这些文件不含 CRLF (按 LuaLS 先例).
      —— 验收: Windows 与 Linux 检出后 `verifyAutoJs6AceAssets` 都通过; 篡改任一字节后失败.
      结论 (2026-10-13): 实现为单个脚本 `tools/ace-lsp/ace-builds-lock.mjs` (`--write` 生成, 默认 `--check` 离线比对,
      `--check --upstream` 另与 npm tarball 逐文件比对), 清单写在 `tools/ace-lsp/ace-builds-lock.json` 而不是资产目录, 因为运行期
      不读取它, 不必进入 APK. 清单含 76 个文件 (71 个 upstream, 5 个 project 并注明原因). CI 只跑 `testDebugUnitTest`, 不跑 `check`,
      所以另加 JVM 测试 `AceDistributionLockTest` 按同一清单校验字节与 SHA-256 (尺寸不符时提示 CRLF). `.gitattributes` 的
      `-text -whitespace` 已在 A1-1 加入. 本地篡改 `mode-tsx.js` 一个字节后脚本报错, 恢复后通过; Linux 检出未验证 (由 CI 的 JVM 测试覆盖).
- [ ] **A6-2** ace.d.ts 类型检查接入 CI: `tools/ace-lsp/ace-bridge-typecheck/` 放 `tsconfig.json` (`allowJs`, `checkJs`, `noEmit`,
      `strict: false`, `types` 指向 A0-3 解压目录或固定的 `ace-builds` 声明副本), `autojs6/ace-private.d.ts` 补充桥接层使用的
      私有成员声明 (§2.3 列表); Gradle `typecheckAutoJs6AceBridge` 挂到 `check`; Node/TypeScript 的获取方式沿用 `build-python-worker.mjs`
      的固定版本策略 (不提交 node_modules).
      —— 验收: 首次全绿后, 人为引用一个不存在的 Ace 方法会使 `check` 失败.
- [ ] **A6-3** 桥接层执行式测试: `tools/ace-lsp/verify-ace-bridge.mjs` 用 Node + jsdom (固定版本) 加载真实 ace.js, ext-language_tools,
      覆盖层与桥接层, 提供假的 `window.autojs` 记录调用; 用例至少覆盖: 初始化与 `notifyReady`, `setText/getState`, mode 路由,
      `foldAll/unfoldAll`, 撤销标记 (替换 A1-5 的 `@Ignore`), gutter 事件分发 (A3-1 四种 target), 覆盖层卸载上游监听 (A2-5),
      ActionMode 状态机 (A2-3), 触发映射 (A5-6). Gradle `verifyAutoJs6AceBridge` 挂到 `check`; 相应的字符串断言型 JVM 测试
      (`AceHistoryOperationBridgeTest`, `AceLanguageRoutingBridgeTest` 中可执行化的部分) 迁移后删除.
      —— 验收: `check` 包含该任务且通过; `@Ignore` 清零.
- [ ] **A6-4** 超长行改用上游 MAX_LINE_LENGTH (验证门 G-A6-4): 安全模式下设置 `renderer.$textLayer.MAX_LINE_LENGTH = 4096`
      (与 `LONG_LINE_SAFETY_RENDER_LIMIT` 一致), 非安全模式恢复原型默认 10000; 删除 `installDocumentLongLineRenderGuard` (`:3164`)
      与 `$renderSimpleLine` 补丁; 保留 `applyDocumentAccessibilityLightweightMode`; 溢出按钮 (`ace_toggle_wrap`) 点击展开时的
      性能由 Ace 自身负责, 桥接层不再截断.
      —— 验收: `AceEditorTextLoadPolicy.ACE_UNSAFE_LINE_LENGTH` 不变; 执行式测试断言安全模式下文本层只渲染 4096 字符加按钮.
- [ ] **G-A6-4** G8441 上加载 50 万字符单行样例: 首次渲染与滚动不触发 ANR, 替换文档耗时不劣于 1.4.12 守卫版 (A0 期间先测一次留档);
      不达标 -> 恢复守卫并记录.

## 11. A7 · 宿主设置联动 (跨仓库: AutoJs6)

- [ ] **A7-1** 插件侧键名与默认值 (`AceEditorDisplayPreferences` / `AceEditorSmartHintPreferences`):
      `key_$_ace_svg_gutter_icons_enabled` (true), `key_$_ace_highlight_indent_guides_enabled` (true),
      `key_$_ace_custom_scrollbar_enabled` (true), `key_$_ace_whitespaces_in_selection_enabled` (true),
      `key_$_ace_symbol_highlight_enabled` (true), `key_$_ace_inline_completion_preview_enabled` (false),
      `key_$_ace_touch_magnifier_enabled` (false), `key_$_ace_upstream_completion_trigger` (由 G-A5-6 决定是否保留);
      `AceBridge.kt` 对应 getter; `AceEditorLspPreferencesTest` 风格的 JVM 测试覆盖默认值与读取.
      —— 验收: 不改宿主时插件按默认值运行; 修改宿主 SharedPreferences 后 `notifyDisplayPreferencesChanged` 立即生效.
- [ ] **A7-2** 宿主侧 (AutoJs6 仓库, 单独提交): `app/src/main/res/xml/fragment_code_editor_settings.xml` 在 "缩进参考线" (`:82`)
      所在分组后增加视觉 4 项与放大镜开关, 在智能提示分组 (`:183`) 增加 ghost text 与同名符号高亮; `bools.xml` 默认值与 A7-1 一致;
      10 种语言 `strings.xml` 标题 / 摘要 / 长按说明 (ASCII 标点); 变更时调用 `EditorPluginSession.notifyDisplayPreferencesChanged`.
      —— 验收: 宿主设置页可见并可切换, 切换后编辑器无需重启即生效; 宿主 `AceEditorPluginHostDeviceTest` 通过.
- [ ] **A7-3** `requiresHostVersion` 保持不变 (仅偏好键, 老宿主按默认值); README "功能" 段补充新开关说明 (10 语言经生成器).
      —— 验收: 旧宿主 (当前发布版) 安装 2.0.0 插件可正常使用.

## 12. A8 · 回归, 性能, 文档与发布评估

- [ ] **A8-1** JVM 与静态门: `:app:testDebugUnitTest :app:lintDebug :app:check` 全绿; `py D:/idea-projects/prepush_check.py AutoJs6-Plugin-Ace-Editor`
      通过 (见 `COMMON_AGENTS.md` "推送前检查").
      —— 验收: 命令输出留存在 `docs/development/release-2.0.0.md` 草稿.
- [ ] **A8-2** 8 台设备 instrumentation: 对每个 serial 设置 `ANDROID_SERIAL` 运行 `:app:connectedDebugAndroidTest`
      (63751f63, 968e9f18, BH900ASK9E, QV710AF65F, QV770340J7, bek749scrwv4wo8h, emulator-5554, emulator-5556); 失败用例逐一归因,
      与 `MILESTONE_BASELINES.md` 已记录的系统级偶发 (G8441 `ADB-JDWP` SIGSEGV) 区分.
      —— 验收: 8/8 设备全部用例通过, 结果表进入发布文档.
- [ ] **A8-3** 性能复测: 三台基线真机各 3 轮 `measure-editor-performance.ps1 -SkipBuild -Iterations 3 -Serial 968e9f18,BH900ASK9E,QV710AF65F`,
      与 A0-2 基线逐项比较; 另在 OPD2413 与 22120RN86C 各取 3 轮作为参考 (不设门).
      —— 验收: 三项中位数相对 A0-2 不超过 +10% (功能优先档); 超出则在 G-A8 决策.
- [ ] **A8-4** 手测清单: 附录 B 在 8 台设备, 附录 C 在 6 台真机 (Gboard + 一款中文输入法; 模拟器用 AOSP 键盘跑附录 C 的 1-6 项);
      记录为 "通过 / P1 / P2 / P3", P1 必须为 0.
      —— 验收: 清单表进入发布文档.
- [ ] **A8-5** 体积与对齐: 记录 release universal APK 与 5 个 ABI 变体大小, Ace 资产增量 (相对 1.32.0), `docs/16kb.md` 的
      16 KB 对齐检查通过, `verifySignedReleaseArtifacts` 通过.
      —— 验收: 数字写入发布文档与 `MILESTONE_BASELINES.md` "A 系列资产增量" 节.
- [ ] **A8-6** 文档与本地化: `.changelog/lang_*.json` 10 语言新增 `v2.0.0` (feature: Ace 1.44.0, TSX, 视觉与补全新能力;
      improvement: 移动端交互覆盖层; hint: 需要配套宿主版本露出新开关), `.readme/lang_*.json` 更新 Ace 版本, 语言表 TSX 行,
      新开关说明与构建命令; 运行 `.python/generate_markdown.bat` 后 `.python/check_markdown.bat`; `app/src/main/assets/doc/CHANGELOG*.md` 随生成更新.
      —— 验收: `markdown.yml` 等价检查本地通过; 不手工编辑生成文件.
- [ ] **A8-7** 第三方声明: `THIRD_PARTY_NOTICES.md` "Ace" 段改为 1.44.0 (tarball, shasum, integrity, 许可证路径),
      新增 "AutoJs6 移动端覆盖层" 段落说明 A0-5 核实的来源; `tools/ace-lsp/README.md` 与 `MILESTONE_BASELINES.md` 路径与版本更新.
      —— 验收: 文档内 `1.4.12` 仅出现在历史记录语境.
- [ ] **A8-8** 版本与提交: 合并前最后一笔提交把 `VERSION_NAME` 改为 `2.0.0`, 同步 changelog JSON 版本 key, README 安装命令中的
      APK 文件名, 测试夹具中的版本断言; `VERSION_BUILD` 按 "当前提交数 + 1" 规则; 发布文档 `docs/development/release-2.0.0.md`
      按 `release-1.13.1.md` 结构写明验证结果, 记录的限制与最终 APK 哈希.
      —— 验收: `git rev-list --count HEAD` 与 `VERSION_BUILD` 一致.
- [ ] **A8-9** 宿主侧联合验证: 用 AutoJs6 宿主 (含 A7-2 改动) 安装签名 release APK, 运行宿主 `AceEditorPluginHostDeviceTest`
      与 `CompanionReleaseSmokeTest`, 并手动走一遍新开关.
      —— 验收: 宿主测试通过; 新开关生效.
- [ ] **G-A8** 合并决策门: 对照 §1 合并标准逐条打勾 (冷启动 +10% 内, 8 台全绿, 手测无 P1, 资产增量已记录);
      全部满足 -> 合并到 `master` 并发布 2.0.0; 任一不满足 -> 在本文件记录差距与整改项, 分支继续迭代, 不合并.

## 13. X · 横切约束

- [ ] **X-1** 提交纪律: 一个提交一个完整意图; 每笔提交前 `VERSION_BUILD = git rev-list --count HEAD + 1`; 推送前运行
      `py D:/idea-projects/prepush_check.py AutoJs6-Plugin-Ace-Editor`; 不包含其他任务的未提交改动.
- [ ] **X-2** 官方文件不可改: `src-min-noconflict/` 内 origin=upstream 的文件任何时候都必须与清单一致; 所有定制只能进入
      `autojs6/` (含 `autojs6/mobile/`) 或运行期补丁脚本; 若出现必须改官方文件的情况, 先在本文件记录并改回运行期方案.
- [ ] **X-3** 文案与标点: 源码注释, 字符串资源, changelog, README 10 种语言一律 ASCII 标点; 生成文件只经生成器更新.
- [ ] **X-4** 验证门记录: 每个 G 项无论通过与否, 都在条目下追加 "结论 (日期): ..." 一行, 含设备与 WebView 版本.
- [ ] **X-5** 设备操作: 多设备并发时 `connectedDebugAndroidTest` 必须显式设置 `ANDROID_SERIAL`; 测试结束恢复设备屏幕超时等设置.
- [ ] **X-6** 不新增 worktree; 分支只在本仓库内 checkout; 宿主 AutoJs6 的 A7-2 改动在宿主仓库独立提交, 不在插件仓库引用兄弟目录.
- [ ] **X-7** 每个里程碑结束更新 §3 状态列与 `MILESTONE_BASELINES.md` 的 "A 系列" 节 (资产增量与性能数据).

---

## 附录 A · `ace-builds-1.4.12` 引用清单 (A1-3)

| 文件 | 位置 | 处理 |
|---|---|---|
| `app/src/main/java/.../core/AceEditorAssets.kt` | `:7` `EDITOR_ASSET_ROOT` | 改为 `editor/ace-builds-1.44.0` |
| `app/src/main/java/.../core/AceBridge.kt` | `:325` `EDITOR_ASSET_ROOT` | 同上 |
| `app/src/main/java/.../core/AceCodeEditor.kt` | `:3696` `ASSET_URL_PREFIX`, `:3698` `ACE_RUNTIME_REVISION` | 改路径; revision 改为 `ace-builds-1.44.0-autojs6` |
| `app/src/main/java/.../core/AceEditorFontManager.kt` | `:524` 内置 Iosevka 路径 | 改路径 |
| `app/src/main/res/raw/ace_font_catalog_v1.json` | 8 处 `source.path` 来源说明 | **保留不改**: 它是已签名远端字体目录的内置副本, 路径仅为来源说明; 远端目录下次发布时再更新 |
| `app/build.gradle.kts` | `:21`, `:24`, `:27`, `:35`, `:156`, `:215`, `:296` | 改路径; 建议提取为单一常量 `aceBuildsAssetRoot` |
| `tools/ace-lsp/build-python-worker.mjs` | `:21` | 改路径 |
| `tools/ace-lsp/generate-declarations.mjs` | `:16` | 改路径 |
| `tools/ace-lsp/generate-language-indices.mjs` | `:30` | 改路径 |
| `tools/ace-lsp/verify-ecj-runtime.mjs` | `:17` | 改路径 |
| `tools/ace-lsp/verify-kotlin-p2plus.mjs` | `:18` | 改路径 |
| `tools/ace-lsp/verify-luals-runtime.mjs` | `:29`, `:34`, `:39`, `:44`, `:49`, `:54` | 改路径 (建议提取常量) |
| `tools/ace-lsp/verify-python-worker.mjs` | `:21` | 改路径 |
| `tools/ace-lsp/README.md`, `WORKER_FEASIBILITY.md`, `TSX_HIGHLIGHT_EVALUATION.md`, `M1_LANGUAGE_ACCEPTANCE.md`, `MILESTONE_BASELINES.md` | 路径与版本字样 | 路径改新; 历史数据语境保留并加注 |
| `app/src/test/.../AceEditorAssetsTest.kt` | `:123` `ASSET_ROOT` | 改路径 |
| `app/src/test/.../AceEditorThemeBridgeTest.kt` | `:103-104` | 改路径 |
| `app/src/test/.../AceHistoryOperationBridgeTest.kt` | `:40-42` 压缩子串断言, `:174-175` 路径 | A1-5 / A6-3 |
| `app/src/test/.../AceInitialPresentationTest.kt` | `:13-14` | 改路径 |
| `app/src/test/.../AceLanguageRoutingBridgeTest.kt` | 2 处 | 改路径 |
| `app/src/main/assets/.../autojs6/autojs6_ace_bridge.js` | `:131`, `:4678`, `:5443` 注释与兼容代码 | A3-2 |
| `app/src/main/assets/.../autojs6/autojs6_lsp_core.js` | `:144` 注释 | A3-2 |
| `THIRD_PARTY_NOTICES.md` | Ace 段 7 处 | A8-7 |
| `Roadmap.md` | §2 基线与附录 9 处 | 加注 "2.0.0 起见 Roadmap-Ace-1.44.0.md" |
| `app/src/main/assets/doc/CHANGELOG*.md` | 历史条目 | 生成文件, 不手改 |

## 附录 B · 移动端交互对照清单 (G-A2, A8-4)

每项记录: 设备 / 1.4.12 实测 (A0-6) / 2.0.0 实测 / 结论. "自动" 列为 `AceTouchInteractionDeviceTest` 中的场景名, 原始记录在
`tools/ace-mobile/device-records/a0-1.4.12-<serial>.jsonl` (G8441 = BH900ASK9E, 23046RP50C = 968e9f18, XQ-AT72 = QV710AF65F);
离线逐调用比对见 `tools/ace-mobile/touch-harness.mjs`. "期望" 已按 A0-4 / A0-6 查明的 1.4.12 实际行为修正.

| # | 操作 | 期望 (与 1.4.12 定制版一致) | 自动 | 1.4.12 实测 (A0-6, 2026-10-13, 三台) |
|---|---|---|---|---|
| 1 | 单击文本 (100 ms 内抬起) | 光标落到点击位置, 编辑器获得焦点, 软键盘弹出 (只读文档不弹) | B1 quick tap | 三台一致: 光标到 2:10, 请求软键盘 |
| 2 | 单击行号栏 | 触摸处理器的 touchstart 不接管, touchend 沿用上次手势的模式; 断点 / 折叠 / 诊断由 gutter 鼠标事件处理 (A3-1) | B2 gutter tap (只记录) | 三台一致: 光标到该行行首 3:0, 记录到一次 `startActionModeIfSelectionInView(false)` |
| 3 | 300 ms 内同一位置双击 | 选中单词, ActionMode 工具条出现 | B3 double tap | 三台一致: 选中 "beta", 工具条出现 |
| 4 | 长按 500 ms (无选区) | 选中单词 + 震动反馈 + ActionMode | B4 long press | 三台一致: 选中 "beta", `startActionMode()`, 工具条出现 (震动未自动校验) |
| 5 | 长按 500 ms (落在已有选区内) | 不改选区, 直接 ActionMode | B5 long press inside selection | 三台一致: 选区 6:6-6:20 不变, 工具条出现 |
| 6 | 从光标位置拖动 | 光标随手指移动, 视口按 5 列前瞻滚动; 放大镜开启时显示 | B6 drag the cursor handle | 三台一致: 光标到 9:30, 抬手后 `startActionMode(false)` (无选区, 宿主不显示工具条) |
| 7 | 从选区锚点拖动 | 锚点随手指移动, 选区扩展 / 收缩; 起点约 1.3 行以内的移动被忽略 | B7 drag the anchor handle | 三台一致: 锚点到 10:2, 工具条出现. 首轮 G8441 只拖 1 行时锚点不动, 印证 "起点附近忽略" |
| 8 | 空白处拖动 | 离开起点约 1.3 行后随手指滚动, 不越界 (可越过末尾 200 px) | B8 slow scroll | 三台都随手指滚动; 停住时 G8441 不再滚动, 23046RP50C / XQ-AT72 抬手后又滚了 13 / 15 px (WebView 不发送静止触点的 touchmove, 速度仍是停住前的值) |
| 9 | 快速滑动后抬手 | 惯性滚动, 逐渐减速, 停止后若选区非空则 ActionMode 重新出现 | B9 fling | 三台均继续滚动: G8441 215 -> 462, 23046RP50C 499 -> 880, XQ-AT72 528 -> 671 (px), 结束后 `startActionModeIfSelectionInView(false)` |
| 10 | 惯性滚动中再次触摸 | 惯性立即停止 | B10 touch stops a fling | 三台一致: 触摸后位移 0 |
| 11 | 补全弹窗打开时触摸弹窗 | 弹窗内滚动, 编辑器不响应 | 无 | 未自动化, 待手测 |
| 12 | 双指按下 | 长按计时取消, ActionMode 结束, 进入桥接层双指缩放 | B12 pinch (部分) | 宿主事件出现 `long_press_feedback_suppressed` 与 `action_mode_suppressed:reason=pinch_zoom` |
| 13 | 双指缩放后 | 字号变化, 缩放焦点位置不漂移, 结束后无误触光标移动 | B12 pinch | 三台字号均由 14px 变为 42px; 焦点漂移未自动校验 |
| 14 | 旋转屏幕 / 软键盘弹出后重复 6-7 | 拖拽位置仍准确 | 无 | 未自动化, 待手测 |
| 15 | 选区清空 (点击他处) | ActionMode 消失 | B15 tap clears the selection | 三台一致: 选区清空, 工具条消失 |
| 16 | 无选区 ActionMode 下输入文本 | ActionMode 消失 (宿主本就不显示无选区工具条) | 无 | 未自动化 |
| 17 | 长按 -> 页面隐藏 (切后台) -> 返回 | 无残留 ActionMode, 无残留放大镜 | 无 | 未自动化, 待手测 |
| 18 | 超长行安全模式下 1-9 | 行为一致, 无卡顿 | 无 | 未自动化; 长行渲染基线见 `MILESTONE_BASELINES.md` "A0 单行 50 万字符基线" |
| 19 | 按住 100 至 500 ms 后抬手 | 不移动光标 (1.4.12 只把 100 ms 内的触摸当作单击) | slow tap | 三台一致: 光标保持 1:3 |
| 20 | 拖动后停住 200 ms 再抬手 (期间无触摸事件) | 仍按停住前的速度惯性 | pause before lifting (只记录) | 23046RP50C 408 -> 415, XQ-AT72 524 -> 540 (G8441 首轮未含该场景) |

## 附录 C · IME 手测清单 (G-A3, G-A5-7, A8-4)

| # | 场景 | 期望 |
|---|---|---|
| 1 | 连续输入英文单词并空格 | 无重复字符, 光标位置正确 |
| 2 | 连续两次空格 | 得到两个空格而不是 ". " (上游 Android workaround) |
| 3 | 退格跨多行删除 | 与可见文本一致 (上游 #5248 修复) |
| 4 | 软键盘左右光标键 | `handleSoftKeyboardCursorKey` 生效, 光标逐字移动 |
| 5 | 选区状态下输入 | 替换选区 |
| 6 | 粘贴多行文本 | 内容与剪贴板一致, CRLF 文档保持 CRLF |
| 7 | 中文输入法拼音组合 | 组合期间不出现候选弹窗乱跳, 提交后字符正确 |
| 8 | 中文输入法候选中途切换到英文 | 无残留组合文本 |
| 9 | Gboard 滑行输入 | 单词正确插入 |
| 10 | 语音输入 (如可用) | 文本正确插入 |
| 11 | 开启 ghost text 后 1 / 7 | 预览不干扰组合输入, TAB 接受 |
| 12 | 补全弹窗打开时继续输入 | 候选过滤正确, 点后成员补全出现 |

## 附录 D · 命令速查

```powershell
# JVM 测试, lint, check (含 Node 校验任务)
.\gradlew.bat :app:testDebugUnitTest :app:lintDebug :app:check

# 单设备 instrumentation (逐台切换 ANDROID_SERIAL)
$env:ANDROID_SERIAL = "BH900ASK9E"; .\gradlew.bat :app:connectedDebugAndroidTest

# 性能基线 / 复测 (复用已构建 APK)
.\tools\ace-lsp\measure-editor-performance.ps1 -SkipBuild -Iterations 3 -Serial 968e9f18,BH900ASK9E,QV710AF65F

# 文档生成与校验
.\.python\generate_markdown.bat
.\.python\check_markdown.bat

# 推送前预检
py D:/idea-projects/prepush_check.py AutoJs6-Plugin-Ace-Editor
```

## 附录 E · 非目标与推迟项

- 不引入 `ext-prompt` (命令面板 / 跳转行弹窗), `ext-diff`, `ext-code_lens`, `ext-command_bar`, `ext-hardwrap`, `enableKeyboardAccessibility`:
  宿主已有对应 UI 或与移动端无关.
- 不使用 `useStrictCSP` 与 ESM 构建; WebView 允许内联样式, 脚本仍以 `<script>` 标签加载.
- 不接入上游 `ext-searchbox` UI (桥接层 `replaceAll` 与宿主搜索 UI 继续使用); 多行搜索能力如需使用另立任务.
- 不改 `ACE_UNSAFE_LINE_LENGTH` (64 K) 与文本分块加载策略.
- Kotlin / Python snippets 继续由项目维护, 不切回上游.
- 宿主主题列表与 Editor API 契约版本 (7) 不变.
