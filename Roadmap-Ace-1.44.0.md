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
| A0 | 分支, 基线采集, 上游下载与校验, 定制源码重建 | 低 | -- | 完成 (A0-6 于 2026-10-14 按维护者决定以手测与设备自动化取代) |
| A1 | 官方资产替换, 目录改名, 引用审计, 可启动 | 中 | A0 | 完成 (G-A1 通过) |
| A2 | 移动端交互覆盖层移植 (触摸, ActionMode, 惯性, 放大镜) | 高 | A1 | 完成 (G-A2 通过, A2-10 复测通过) |
| A3 | 桥接层适配与 1.4.12 专属代码清理 | 中 | A1 | 完成 (G-A3 通过) |
| A4 | 语言资源: tsx, Kotlin 官方 mode, worker-json, 其余 mode/snippets 复核 | 低中 | A1 | 完成 (G-A4-3 通过) |
| A5 | 上游能力纳入 (视觉 4 项, 补全 4 项) | 中 | A2, A3 | 完成 (G-A5-3 / G-A5-6 / G-A5-7 已结) |
| A6 | 工程与健壮性 (清单校验, 类型检查, 执行式测试, MAX_LINE_LENGTH) | 中 | A1 (A6-4 需 A3) | 完成 (G-A6-4 于 2026-10-14 接受替换耗时差异) |
| A7 | 宿主设置联动 (AutoJs6 仓库) | 低 | A5 | 完成 (A7-2 宿主本地提交 b7df923aaa, 宿主测试修正 8126740e0e) |
| A8 | 回归, 性能, 文档, 发布评估与合并决策 | -- | 全部 | 进行中 (A8-1 / A8-3 / A8-4 / A8-5 / A8-7 完成; A8-2 / A8-9 复跑中; A8-6 / A8-8 / G-A8 在合并时) |
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
      后续 (2026-10-13, A0-5 决定之后): 可读重建与原始片段都已从工作区删除 (Git 历史中仍在); 片段的偏移与哈希移到
      `tools/ace-mobile/legacy-slices.json`, 校验时由 `legacy-oracle.mjs` 从 Git 对象 f067e63 切出, `verify-reconstructed.mjs` 与
      `extract-original-slices.mjs` 一并删除. 上文的行为结论保留在 `tools/ace-mobile/README.md` "行为规格".
- [x] **A0-5** 核实并记录定制模块的来源与许可证 (Auto.js 定制; `scroller.js` 为 AOSP `OverScroller` 样条算法移植;
      `regression.js` 疑似 regression-js), 结论写入 `THIRD_PARTY_NOTICES.md` 草稿段 (A8-7 正式提交).
      —— 验收: 每个模块有 "来源 / 许可证 / 核实依据" 三栏, 无法核实的明确标注 "未核实, 按项目许可证分发".
      结论 (2026-10-13): 草稿在 `tools/ace-mobile/README.md` "来源与许可证". `regression.js` 确认为 regression-js 2.0.x (MIT,
      与 npm `regression@2.0.1` 在 5250 组输入上结果一致); `scroller.js` 的常量与样条算法与 AOSP OverScroller 一致 (Apache-2.0,
      移植者未知); 其余定制 (触摸处理, 放大镜, ActionMode, 速度跟踪等) 来源未核实. 线索指向 Auto.js Pro 的编辑器资产
      (AutoJs6 `docs/dev/autojs-pro-9-feature-comparison.md` 记录 Pro 9 编辑器为 Ace 1.4.12 且有 "选区放大镜"), 而 Auto.js Pro
      是闭源软件, 未找到授权说明, 因此这里没有按 "按项目许可证分发" 标注. **待维护者决定**: A2 是按原计划移植重建源码,
      还是只依据 `tools/ace-mobile/README.md` 的行为描述与 `touch-harness.mjs` 场景重新实现 (等价性仍用同一组场景校验).
      决定与实施 (2026-10-13): 维护者选择自行重写, 避免抄录闭源代码. 覆盖层 5 个脚本已按 `tools/ace-mobile/README.md` 的
      "行为规格" 重新编写: 惯性改为直接依据 AOSP `android.widget.Scroller` 的样条 fling 编写 (Apache-2.0); 速度跟踪按行为规格重写,
      最小二乘求解沿用 regression-js 2.0 的高斯消元 (MIT) 以保证舍入逐位一致; 触摸处理改为原型式的手势识别器 (`TouchGestures`,
      `HandleGeometry`), ActionMode 改为控制器对象; 放大镜与安装器原本就是 AutoJs6 自己的实现. 工作区不再保存旧版代码的抄录:
      `tools/ace-mobile/reconstructed/` (8 个可读重建与 19 个原始片段) 删除, 只保留偏移与哈希 (`legacy-slices.json`), 校验时由
      `legacy-oracle.mjs` 从 Git 历史读取旧 `ace.js` 切片后与覆盖层做行为比对. 比对结果: 45 个手势场景 (新增 "两个手柄都在可及范围
      时拖动较近者") 中 44 个调用轨迹完全一致, 1 个为既有的有意差异, 惯性 120 组与速度 200 组逐值一致, ActionMode 5 个场景一致,
      共 494 项; 对重写后的触摸处理做 14 处单点变异全部被检出. 真机: XQ-DQ72 全套 28/28 通过, 22120RN86C 与 x86 API 27 模拟器的
      触摸用例与旧版逐场景一致 (差异见 G-A2). `THIRD_PARTY_NOTICES.md` 新增 "AutoJs6 Mobile Touch Overlay" 段, 覆盖层目录随附
      `THIRD_PARTY_NOTICES.txt` (AOSP Apache-2.0 声明与 regression-js MIT 全文). Git 历史中的旧 `ace.js` 是插件曾分发的版本,
      未改写历史.
- [x] **A0-6** 在两台设备 (G8441, 23046RP50C) 上按附录 B 逐项记录当前 1.4.12 行为 (文字记录, 必要时录屏), 作为 G-A2 的参照.
      —— 验收: 附录 B 每行填有 "1.4.12 实测" 一列.
      进度 (2026-10-13): 新增 `AceTouchInteractionDeviceTest` (UiAutomation 注入真实触摸, 记录 JS 选区 / 滚动 / ActionMode 调用
      与宿主软键盘 / 工具条状态), 在 G8441, 23046RP50C 与 XQ-AT72 上用 A0 版 APK 跑通, 附录 B 的 15 行已填实测, 原始记录入库在
      `tools/ace-mobile/device-records/`. 第 11, 14, 16, 17, 18 项无法可靠自动化, 需要维护者手测后补填, 完成后勾选本项.
      设备与其他会话共用, 测试前需先与占用方确认 (本轮借用了 3-Block Compose 与 3-Maple Image 会话让出的时段).
      结论 (2026-10-14): 按维护者决定以取代方式关闭. 15 行的 1.4.12 实测已由 `AceTouchInteractionDeviceTest` 在三台填写; 第 11, 14, 16,
      17, 18 项不再补录 1.4.12 行为, 改由维护者在 XQ-AT72 上按 2.0.0 的期望手测 (手测指南第 6 节), 其中第 11, 13, 14 (视口变化部分)
      与 18 (超长行按钮) 项另由 `AceManualCoverageDeviceTest` 在 6 台设备上覆盖 (见 G-A2).

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
- [x] **G-A1** 可启动门: debug APK 在 8 台设备上运行 `AceCodeEditorSmokeTest`, `AceLanguageRoutingSmokeTest`,
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
      补跑 (2026-10-13, A3 构建 639934b): XQ-AT72 (WebView 145) 与 XQ-DQ72 (WebView 153) 六个类加触摸用例均 20/20 通过.
      8 台已全部运行; 未通过的只有 x86 API 27 模拟器与 22120RN86C 各 2 项, 两者在 A0 版上同样失败 (见上), 按 "不属于回退" 判定.
      是否据此勾选本门由维护者确认.
      结论 (2026-10-13): 维护者确认两台的既有失败按 "非本次升级造成" 处理, 门通过. 逐项查明并处理如下:
      1. x86 API 27 模拟器 (Chrome 69): `projectRenamePublishesExactThreeFileTransactionWithoutWriting` 与
         `validatedProjectSnapshotPublishesLiveUnresolvedImportDiagnostic` 依赖 TypeScript 6, 而 Chrome 69 不支持其语法 (可选链等),
         编辑器按设计退回静态补全与 JSHint (`tsLoader.compatibilityReason` 非空). 这是用例没有识别按设计的回退, 不是产品缺陷.
         `lspRuntimeState` 新增 `tsRuntimeCompatibilityReason`, 两个用例在其非空时改为断言回退状态 (诊断来自 ace-jshint, 不产生改名请求);
         符号高亮用例同样识别 TS 与 Pyright worker 不受支持的 WebView. 修改后该模拟器上这几项通过.
      2. 22120RN86C (WebView 111) 的 TypeScript 项目诊断: 冷启动后的第一次诊断要建立 TypeScript 程序, 实测 2.25 s, 超过语义宿主
         2000 ms 的单次操作预算, 服务被判失败并整场退回静态补全. 改为每个 provider 的第一次操作使用 3 倍预算 (6000 ms), 之后仍为
         2000 ms (`autojs6_semantic_provider.js`, `verify-runtime.mjs` 增加冷启动预算断言). 修改后该用例在该机通过, 该机的
         TS 补全, 诊断与同名高亮也随之可用. 预算只决定超时后是否放弃服务, 冷启动那次仍会阻塞主线程约 2 s.
      3. 22120RN86C 的 `bundledEcjPublishesExactDiagnosticsAndReleasesWithEditor`: 单独运行通过 (A9 构建), 只在全套连续运行中偶发
         30 s 内拿不到 ECJ 诊断. 用例超时时现在会附带 Java 服务状态 (错误码, 耗时, 内存熔断), 以便下次出现时直接归因; 产品代码未改.
      另外: G8441 也出现过一次同一 ECJ 用例超时, 重跑通过. API 27 模拟器首轮全套中测试进程崩溃过一次 (WebView 渲染进程在
      2 GB 内存的模拟器上被回收), 第二轮未复现; 该模拟器全套中 B4 长按偶发失败, 单独两轮通过.

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
- [x] **A2-4** `autojs6/mobile/autojs6_mobile_touch_handler.js`: 重建 §2.2 描述的全部单指行为 (单击 / 双击 / 长按 /
      光标与锚点拖拽 / 滚动 / 惯性 / 惯性后 ActionMode / `touchscroll` 事件 / gutter 与弹窗跳过 / `preventDefault`).
      双指: 只做 "取消长按计时并 `finishActionMode`", 缩放交给桥接层 `suppressAceBuiltInPinchZoom` (`:2121`), 删除 body zoom 路径.
      1.4.12 检查的 `editor.popup` 从未被赋值, 补全弹窗又在编辑器容器之外, 所以不移植这一判断 (改成判断弹窗打开会让弹窗打开时
      点击编辑器失效, 属于行为变化). `autojs.showSoftInput()` / `autojs.performLongPressFeedback()` 调用保持原位置.
      —— 验收: `touch-harness.mjs` 全部场景 (双指场景除外, 因 body zoom 被移除) 与原始片段产生相同调用轨迹; 附录 B 第 1-12 项
      在 2 台设备上通过 (完整 8 台在 G-A2).
      进度 (2026-10-13): `autojs6/mobile/autojs6_mobile_touch_handler.js` 已完成; 43 个场景与 1.4.12 调用轨迹一致 (比较时忽略 DOM 写入
      与 `renderer.onResize`, 即旧版的放大镜 DOM 与 body zoom), 唯一的预期差异是 `editor.popup` 场景. 对覆盖层做 28 处单点变异全部被检出.
      真机部分随 G-A2 进行.
      结论 (2026-10-14): 真机部分随 G-A2 通过.
- [x] **A2-5** 卸载上游触摸处理: 安装时遍历 `editor.$toDestroy`, 移除 `elem === editor.container` 且 `type` 属于
      `touchstart / touchmove / touchend / contextmenu` 的 4 个 `EventListener` (调用其 `destroy()` 并从数组删除);
      断言移除数量为 4, 否则启用兜底: 在 container 上以 capture 注册同名事件并 `stopImmediatePropagation`,
      同时 `notifyRecoverableError("mobileOverlay", ...)` 上报. 两种路径都要把 `editor.$mouseHandler.isMousePressed` 复位.
      —— 验收: 执行式测试断言移除后 `editor.$toDestroy` 中不再有 container 触摸监听; 真机上长按不出现上游行为 (无 `ace_mobile-menu`, 无上游双击选行).
      进度 (2026-10-13): 安装入口 `AutoJsAceMobile.install` 在 `ace.edit` 之后立即执行; jsdom 加载完整页面确认移除了 4 个上游监听
      (contextmenu, touchstart, touchend, touchmove), 未启用兜底, 容器上只剩覆盖层自己的 3 个触摸监听. 兜底模式为覆盖层改在 capture 阶段
      处理并 `stopPropagation` (不用 `stopImmediatePropagation`, 以免挡住桥接层同在 capture 阶段的双指缩放监听). 真机部分随 G-A2.
      结论 (2026-10-14): 真机部分随 G-A2 通过, 各设备的长按与双击都只有覆盖层的行为.
- [x] **A2-6** `autojs6/mobile/autojs6_mobile_magnifier.js` + CSS: 重建 `Magnifier`, 在 `autojs6.css` 新增
      `#magnifier` / `#magnifier-content` / `#magnifier-progress` 样式 (圆角容器, 当前行放大约 1.5 倍, 跟随主题调色板变量),
      用 `options.magnifierEnabled` 控制 (来源 A7 的宿主开关, 默认关闭), 在 touchend / touchcancel / 双指 / 页面隐藏时隐藏;
      `zoom` 固定为 1 (不再依赖 body zoom).
      —— 验收: 开启后拖拽光标出现放大镜且内容与当前行一致, 关闭后无 DOM 残留; 8 台设备无遮挡软键盘的情况.
      进度 (2026-10-13): 已重写 (按屏幕行定位克隆的文本层单元格, 折叠与自动换行下不错位; 选区自行绘制并沿用主题的 `ace_selection` 配色;
      放大 1.5 倍; 首次显示时才创建 DOM; 类名 `autojs6-magnifier*` 代替原 id). 开关 `setTouchMagnifierEnabled` 已加到 `AutoJsAce`,
      初始值读 `isTouchMagnifierEnabled` (Kotlin 侧在 A7-1 实现, 缺省 false). 真机验收待开关接通后进行.
      真机验收 (2026-10-13, XQ-AT72, WebView 145): 首次在真机开启 (宿主设置露出前用写入宿主偏好的方式开启), 放大框为空白. 原因有二:
      放大镜的内容层只带 `ace_text-layer` 类, 缺少 `.ace_layer` 提供的 `white-space: pre`, 克隆行在 160 px 宽的内容层内折行;
      Ace 1.44.0 在高 DPI 屏上给每一行 `contain: strict`, 克隆行被裁在内容层宽度内, 平移到光标居中后几乎整行落在可见区域之外.
      修复: 内容层补 `white-space: pre`, 克隆行设 `contain: none` 与 `right: auto`; 另在放大框中心画出光标竖线 (`ace_cursor`,
      沿用主题的光标色), 否则看不出手指落在哪个字符上. 桥接执行式测试新增一例, 去掉任一修复的变异都会被检出; 真机拖拽时放大框
      显示三行文字, 光标位置与编辑器一致. 其余目视项 (主题, 自动换行, 折叠, 旋转) 见手测指南 V10.
      结论 (2026-10-14): 维护者 V10 复测未发现问题 (放大镜选区遮字已在 A2-10 第 17 项修复); `AceManualCoverageDeviceTest` 的
      `magnifierDrawsTheSelectionUnderTheText` 在 6 台设备通过. 开关由宿主 A7-2 露出, 缺省关闭.
- [x] **A2-7** 覆盖层与桥接层对接: `cancelAceMobileTouchInteraction` (`:1781`) 调用覆盖层的 `cancel()` 清理长按计时与惯性;
      `installTouchCursorSelectionGuard` (`:3770`) 与 `installImeTextInputSelectionWindow` (`:2890`) 不变;
      `global.AutoJsAce` 增加 `getMobileOverlayState()` 供诊断快照使用 (`AceDiagnostics` 增加字段 `mobileOverlay`).
      —— 验收: 诊断快照包含 `mobileOverlay: {installed, uninstalledUpstreamListeners, fallbackCapture, magnifier}`.
      进度 (2026-10-13): `cancelAceMobileTouchInteraction(reason)` 调用覆盖层的 `cancel(reason)`, 只对 `dom_touchcancel`,
      `window_blur`, `pinch_zoom_begin`, `pinch_action_mode` 生效 (清长按计时, 停惯性, 隐藏放大镜, 保留手势模式); 宿主在单指滑动开始
      与折叠占位点击时发出的取消被忽略, 因为 1.4.12 的触摸处理器从未收到过它们;
      `AutoJsAce.getMobileOverlayState()` 已提供. Kotlin 诊断快照字段与 A3-10 的 `aceVersion` 一起加入 (见 A3-10).
- [x] **A2-8** `autojs6.css`: 删除无用的 `.ace_mobile-menu` 规则 (三段 `body.*  .ace_mobile-menu` 与 `.ace_mobile-menu` 本体),
      新增 A2-6 样式; `autojs6_editor.html` 按顺序加载 5 个覆盖层脚本 (scroller -> velocity_tracker -> magnifier -> action_mode -> touch_handler);
      `AceEditorAssets.requiredAssetPaths` 登记 5 个文件.
      —— 验收: `AceEditorAssetsTest` 与 `requiredAceAssetsArePackaged` 通过.
      结论 (2026-10-13): 4 段 `.ace_mobile-menu` 规则已换成放大镜样式; HTML 在 `autojs6_mode_patches.js` 之后按顺序加载 5 个覆盖层脚本;
      `requiredAssetPaths` 登记 5 个文件; JVM 测试通过, `requiredAceAssetsArePackaged` 随 G-A2 的设备运行验证. 另新增 Gradle 任务
      `verifyAutoJs6AceMobileOverlay` (挂在 `check` 上, 约 2 秒).
- [x] **A2-9** A0-4 补充的小定制在 1.44.0 下的处理:
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
      结论 (2026-10-14): 执行式测试新增一例: textarea 上的 contextmenu 只取消浏览器菜单 (不移动 textarea, 不发出
      `nativecontextmenu`), 覆盖层发出 `touchscroll` 后行号栏提示隐藏.
- [x] **A2-10** 手测后的交互改进 (2026-10-13 新增, 维护者首轮手测 XQ-AT72 后决定): 1.4.12 的五处既有表现全部改进,
      另修手测发现的缺陷. 行为规格见 `tools/ace-mobile/README.md` 中标 "(A2-10)" 的各条.
      1. 慢点: 长按触发前抬起且未移动即为点击 (1.4.12 只认 100 ms 内抬起), 长按之后抬手不再算点击.
      2. 静止后抬手: 抬手前手指静止超过 40 ms (无 touchmove) 不惯性, 取 Android VelocityTracker 的 "指针已停止" 时间;
         1.4.12 沿用静止前的速度 (B8 停住后又滚十几像素, B20).
      3. 粘贴菜单: 点在光标上 (无选区, 点击位置即光标位置) 或空白处长按 (两侧都不是可见字符) 请求插入点工具条, 走独立的
         宿主接口 `startInsertionActionMode`; Kotlin 侧对该请求显示工具条的可用项 (粘贴, 全选, 更多中的行操作), 拖动光标
         结束后的 `startActionMode(false)` 仍不显示. 输入或下一次触摸时关闭.
      4. 行号栏: 首轮手测 B2 (a) 发现软键盘收起时点行号会弹出键盘并跳回光标所在行. 原因是 Ace 1.44.0 在行号栏 mousedown 上
         注册了 focusEditor, 而覆盖层不处理行号栏触摸, 浏览器合成的鼠标事件让编辑器获得焦点 (1.4.12 在移动端不注册它).
         现在覆盖层处理行号栏触摸并阻止合成鼠标事件: 拖动滚动, 点击交给桥接层 `handleGutterTap`, 有诊断的行上点诊断图标
         (6 px 余量) 打开诊断标记, 其余位置切换断点 (原先诊断行的左侧 24 px 只能打开诊断, 无法设断点); 外接鼠标同样可以
         在诊断行的图标旁设断点. 光标不动, 不弹键盘.
      5. 超长行截断按钮: 手指点击与鼠标一样切换自动换行 (不参与双击判断). 模拟器 (x86_64, WebView 134) 上对 12 万字符行
         切换为一个 86 ms 的长任务, 折出约 3000 行; 真机耗时待测.
      6. 滚动条自动隐藏 (维护者新提出): 新键 `key_$_ace_scrollbar_auto_hide_enabled` (缺省开, A7-1 / A7-2 一并露出);
         纵向 / 横向滚动条只在沿该方向滚动时显示, 最后一次滚动 2 s 后淡出, 手指按住滑块时不隐藏; 隐藏的滚动条不接收触摸.
      7. 首轮手测 B3: 双击后光标总在单词末尾. 1.4.12 的本意是落在离手指近的一端, 判断却写成 "手指在单词之前"; 已按本意修正.
      8. 首轮手测 B6 (放大镜开启): 光标竖线偏约半个字符 (放大镜多加了文本层的内边距, Ace 用外边距偏移整个文本层) 已修正;
         拖过标识符前卡顿一下: 起初归因于同名符号高亮 (覆盖层现报告拖拽开始 / 结束 `onHandleDrag`, 拖拽期间不请求高亮, 抬手后
         按最终位置请求一次), 但真机测得拖拽中并无长任务. 实际原因有二, 均已修正: 长按计时器取消后句柄未清空, 拖回起点附近的
         移动被忽略; 软键盘弹出时隐藏输入框的选区随光标变化, 被桥接层当作输入法移动, 光标每走两步回退一列 (拖拽期间现在像 Ace
         的鼠标拖拽那样置上 `isMousePressed`, 并且不把输入框选区变化当作输入法移动).
      9. 首轮手测 B11: 窄屏上补全的文档提示被拉满屏宽, 盖住了补全弹窗. 现在与弹窗重叠时移到弹窗下方 (弹窗在光标上方时为
         上方), 两侧都不足 72 px 时不显示.
      10. 首轮手测 C3 (Gboard): 选中多行后退格, 选区被替换成 "co" 一类的残词, 撤销时选中意外的范围. Gboard 在新光标处把整个
         单词标为组合区 (setComposingRegion), Ace 却假定组合从光标处开始; 覆盖层阻止了鼠标事件, Ace 用来结束组合的 mousedown
         不再发生. 现在点击, 双击, 长按与开始拖拽光标时按 Ace 处理 "命令在组合中移动光标" 的方式结束组合; 桥接层跳过 "用相同
         文字替换相同文字" 的组合更新, 撤销历史中不再有看不见的编辑. (中间版本改用 `cancelComposition` 失焦再聚焦, 浏览器
         提交组合文字并被当作输入, 点击时删掉了文字, 维护者复测发现后改为现方案.)
      11. 手测 C4 (Gboard 文字编辑面板与空格键滑动): 方向键一次走两格或不规则跳动, 在单词中间按上下键变成行内移动, "|<" /
         ">|" 落到其他行, 空格键滑动时光标与输入法逐渐偏离; 测试中另发现面板的 "全选" 只选中当前行, "选择" 模式下 "|<" / ">|"
         不扩展选区. 原因: 桥接层按隐藏输入框光标与上次位置之差移动文档光标, Ace 自己同步输入框也被当作一次移动, 输入框两侧补的
         换行被当作文档字符, 编程式移动后的 800 ms 抑制窗口丢掉输入法的下一步; Gboard 保持的组合区让 Ace 忽略方向键与全选.
         现在按输入框中所复制行的布局换算位置 (光标恰在编辑器光标处时不动), 跨过两侧换行一步接到相邻行; 组合中的导航键先结束
         组合, 桥接层移动光标后同样结束组合; Kotlin 侧识别面板的 "|<" / ">|" (先读取 extracted text 再设置选区, 空格键滑动不
         读取) 与 "全选", 交给桥接层 `runImeEditingAction` 按行首 / 行尾 (扩展选区) 与全选执行. 行为规格见 README "软键盘移动光标".
      12. 手测 B18: 在文件管理器点文件到编辑器页面出现有明显延迟. 在 22120RN86C (Helio G85, debug 宿主) 上测得点击到首帧
         (ActivityTaskManager "Displayed") 热启动 834-1045 ms, 冷启动约 1.6 s; 旧版 (A0) 插件同样为 834-901 ms, 不是本分支
         引入的回退. 点击处理不到 10 ms, 时间都在 EditActivity 首帧之前的主线程上: 宿主每次打开都新建插件的 PathClassLoader,
         与插件安装时编译的类加载器上下文不符, ART 每次从 APK 解压 dex 并在运行时校验插件类 (约 270 ms); Ace 符号栏的流式布局
         为全部 75 个符号创建并布局视图 (约 220 ms); 插件的字体管理器每次都创建 OkHttp 客户端并解析内置字体目录 (约 65 ms).
         维护者选定修复: 宿主按插件包名, 版本, 更新时间与 APK 路径复用类加载器 (每次仍检查插件资格), 符号栏只挂载可见行的
         按钮 (宿主提交 c247cd5663); 插件的字体目录, 网络客户端与下载器改为首次使用时创建. 未采用 "先出页面再建编辑器" (改动 EditorView 初始化顺序).
         修复后同机热启动约 500 ms (不再有 "Skipped frames" 警告), 冷启动 1.33 s. 宿主新增设备测试 "重复加载复用插件代码" 与
         "流式符号栏只挂载可见行" (22120RN86C 通过). 代价: 关闭编辑器后插件代码仍留在宿主进程内存中 (debug 版 dex 约 12 MB).
      13. 手测 C11 (输入代码时的浮动窗口): 补全条目的说明框常压住正在输入的行. 第 9 项只让说明框避开补全弹窗: 弹窗远离光标的
         一侧放不下时退到弹窗的另一侧, 而弹窗紧贴光标行, 那一侧正是光标行 (弹窗在下方且下方占满时说明框压住光标行, 弹窗在上方
         且顶到屏幕顶部时亦然). 签名提示的兜底位置 ("弹窗上方 / 下方" 或贴着视口边缘) 与悬停文档 (行顶下方 18 px, 落在较高的行
         内) 也可能压住光标行. 维护者要求所有浮动窗口都不遮挡光标所在行. 现在桥接层 `keepFloatingBoxClear` 统一处理: 光标所在的
         屏幕行, 补全弹窗 (以及说明框所避让的签名提示) 都是障碍; 与障碍重叠的浮窗纵向移到第一个放得下的位置 (光标行下 / 上,
         弹窗下 / 上, 越过途中的其他障碍), 都放不下时用空间最大的位置并限制高度 (内部可滚动), 不足最小高度则隐藏. 说明框优先
         弹窗远离光标的一侧, 其次光标行的另一侧; 签名提示与悬停文档经各自模块的 `keepClear` 配置项接入.
      14. 手测 V1 / V4 / V5: (V1) Ace 把 SVG 行号栏图标固定为 12 px, 在 16 px 字号旁偏小且线条细; 现在边长随行号字号 (1em),
         左内边距同步为 1em + 3px (16 px 时仍为 Ace 的 19 px, Ace 按此内边距计算行号栏宽度). (V4) 选区内的制表符显示为横线
         是 Ace 的标准表示 ("—" 重复), 指南初版写成箭头, 已更正. (V5 a) 三个原因: 测试文件中 `greeters = []` 被 Pyright 推断为
         `list[Unknown]`, `greeter.` 本就没有成员 (已补类型标注); Gboard 输入点号时常把组字中的单词或补出的空格连同点号一起
         提交 ("g2" -> "g2.", "greeter " -> "greeter."), 点号触发只认恰好是 "." 的插入 (现在认以点号结尾的单行插入, 会话变更
         监听同时覆盖 Ace 在 commands.exec 之外应用的组字输入); LSP 补全的分数取 `Number(sortText)`, Pyright 的 "09.9999.greet"
         不是数字, 成员按字母排序, 双下划线成员排在最前 (LuaLS 的数字 sortText 则整体倒序), 现在按 sortText 的字符串顺序给出
         1000 与 1001 之间的分数. (V5 d) 补全弹窗本身是 Ace 编辑器, 带有 Ace 的触摸处理: 在选中行附近按下后拖动会让选中行跟随
         手指, 长按选中所按的行, 其余拖动与桥接层的滚动叠加; 现在卸载弹窗上的上游触摸监听, 轻点经浏览器模拟的鼠标事件选中并
         插入, 拖动只滚动.
      15. 维护者手测 (默认暗色主题 Gruvbox): 选中文字与关联变量的底色是亮蓝色, 底下的文字难以辨认. 原因是 autojs6.css 自初版起
         对所有暗色主题统一覆盖选区 (蓝 0.42) 与同词高亮 (蓝 0.24 填充), 选中的单词上还叠有同名符号高亮, 几层蓝色叠成亮蓝.
         现在暗色主题的同词高亮只保留细边框; Gruvbox 改用自身调色板: 选区为 bg3 `#665c54` (与其可视模式相同), 同词高亮为
         浅绿细框, 同名符号高亮为低透明度的蓝绿 / 黄色. 在 XQ-AT72 上注入页面比较了 bg3, bg2 与半透明蓝绿三种选区色, bg2
         与当前行底色几乎无法区分, 选用 bg3.
      16. 维护者手测: 选中文字后偶发 "内容消失". 在 XQ-AT72 上装带输入连接与编辑器事件日志的诊断构建后复现: 键盘显示时双击
         单词, 随后用返回手势收起键盘, 选中的单词被整个删除 (撤销历史中只有一次删除). 时序: 第一下点击后 Gboard 把光标下的
         单词标为组字; 第二下点击结束组字时触摸层立即按旧光标重填 textarea, Gboard 据此又把同一单词标为组字, 而双击选词随后
         才发生, Ace 在组字期间不重填 textarea (resetSelection 等待组字结束), 于是 Ace 选中整个单词, textarea 里却只有
         单词中间的光标; 收起键盘时 Gboard 结束组字 (finishComposingText), Ace 在组字结束时重读未变的 textarea
         (onCompositionEnd -> onInput, 即使没有变化也发送), 得到空插入, 而 applyComposition 用空插入替换了非空选区. 修复:
         触摸层点击与长按结束组字后先改选区, 再立即重填 textarea (不再先按旧光标重填); 桥接层对 textarea 未变时的空插入
         不再替换选区, 并在 Ace 记下读取结果后按选区重填 textarea.
         构建 241 在 XQ-AT72 上用 DevTools 触摸与真实 Gboard 核对: 第一下点击后 Gboard 已在组字时双击, textarea 立即是
         选中的单词, Gboard 不再组字, 返回键收起键盘后单词保留, 撤销历史为空 (15 轮中 10 轮识别为双击, 其中 1 轮命中上述时序).
      17. 手测 V6 - V10 (2026-10-14):
         (V7) 签名提示与悬停文档的字号固定为 13 / 12 px, 编辑器放大后显得很小; 现在随编辑器字号缩放 (16 px 时不变, 桥接层
         写入 CSS 变量 `--autojs6-editor-font-size`), 签名提示的标题, 翻页与摘要按 em 跟随.
         (V8) 双击选词后双指缩放, 选区消失, 缩放后立即双击也选不中: 缩放开始时桥接层记下选区并在结束时恢复, 但缩放期间及
         之后 1.6 s 内的选区抑制把带文字的选区一律清除 (恢复的选区也被清除), 每次清除又把抑制延长 1.4 s, 连续双击总落在
         抑制期内. 现在缩放保留开始时的选区, 只清除缩放中新出现的选区; 缩放后第一次单指触摸即解除抑制; 选择工具条在抑制
         结束后回到保留的选区.
         (V10) 放大镜中的选区盖住了选中的文字: 放大镜内容带 `ace_marker-layer` 类以沿用主题选区色, 同时继承了 Ace 标记层
         选区的 z-index 5, 画在克隆的文字之上; 原先的半透明蓝色还能透出文字, 第 15 项把 Gruvbox 选区改为不透明后完全遮住.
         现在放大镜的选区不设 z-index, 位于文字之下.
         (内容临时消失) 维护者录屏中软键盘弹出后编辑器只剩光标, 行号与文字都不见, 直到缩放或滚动. 在 XQ-AT72 上以 20 px
         字号与自动换行复现并读取渲染状态: `scrollTop` 对应第 127 行, 文字层却画了第 143 - 150 行 (位于可视区下方).
         原因在 Ace 的 `VirtualRenderer.$computeLayerConfig`: 先按换行数据求出首个可见行, 之后滚动条显隐变化时才更新缓存尺寸,
         文字区宽度变化改变了换行宽度与换行数据, Ace 为此安排的完整重绘被正在进行的重绘并入 (`$loop.clear`), 于是按旧的
         首行在新位置作画, 之后只有光标层随光标更新. 键盘动画中视口一度过低会隐藏滚动条, 正好触发. 桥接层现在在换行宽度于
         计算中改变时重新计算布局配置. 修复后同样操作 10 轮弹出键盘均正常.
         (V6) 高亮代码无缺陷: Python 的写入处由 Pyright 判定 (参数不算写入), 测试文件里的写入恰在常放光标的声明行, 已补
         一处 `greeters += ...`; Lua 的同名高亮需要 LuaLS, 而 LuaLS 在宿主进程中因插件包上下文没有 applicationContext 而
         判为不可用 (master 即如此), 维护者看到的是 Ace 自带的同词方框, 见第 18 项.
      18. 宿主进程中的语言运行时 (V6 排查中发现, master 即如此): 宿主在自己的进程中运行插件, 传入的插件上下文是另一个应用的
         包上下文, 没有 applicationContext, 其数据目录属于插件的用户 ID, 宿主进程无权写入. LuaLS 经 applicationContext
         判断可用性, 结果总是不可用; Java 语义诊断把 ECJ 类路径装到插件包的 filesDir, 失败后报 compiler-failure. 设备测试
         在插件自己的进程中运行, 两者都通过, 掩盖了问题. 现在插件上下文只提供资产与原生库目录, 运行时文件写入运行编辑器
         的进程自己的私有目录 (`AceRuntimeStorage`, 宿主进程中即宿主的 files / no_backup / cache). 新增设备测试
         `AceRuntimeStorageDeviceTest` 用无 applicationContext 且禁止使用自身数据目录的包上下文验证两者. 在 XQ-AT72 的宿主中
         核对: LuaLS 就绪 (初始化约 0.2 s), `counter` 的 5 处高亮中第 2, 5 行为写入; Java 文件给出 ECJ 诊断.
      19. 百度输入法手测 C4 (2026-10-14): "选择" 模式下 "行首" / "行尾" 能扩展选区, 四个方向键却只移动光标. 百度与搜狗的选择模式
         在方向键前后单独发送 SHIFT_LEFT 的按下与抬起, 方向键本身的 metaState 为 0, 而 WebView 只按事件自身的 metaState 设置
         `shiftKey` ("行首" / "行尾" 由第 11 项的面板识别处理, 不受影响). 现在输入连接记录输入法按住的 Shift, 补到缺少它的导航键
         (方向键, Home / End, PageUp / PageDown) 上 (`AceImeShiftState`, 构建 244). 在 22120RN86C 上用搜狗输入法小米版的选择模式核对:
         四个方向键都扩展选区. 待维护者用百度输入法复测.
      20. 设备自动化 (2026-10-14, 见 A8-4) 运行中发现的缺陷, 均已修复, 每项有去掉修复即失败的执行式测试:
         (a) 选择工具条显示时输入法替换选区, 输入连接线程上关闭工具条抛出 CalledFromWrongThreadException (构建 245);
         (b) 宿主在单指开始移动时发出的 `single_finger_scroll` 取消, 关闭了手指正在滚动的补全弹窗, 文档提示或签名提示; 现在触摸
         从这些浮窗内开始时保留浮窗 (构建 246; DevTools 注入的触摸不经过宿主, 此前无法发现);
         (c) 手指滚动补全列表时, 选中行的说明框留在原处盖住其他行, 下一次点击落在说明框上; 现在滚动时隐藏说明框, 选中行时
         重新显示 (构建 246);
         (d) 组字结束时文字通常不变, 没有弹窗更新重绘被隐藏的内联预览, 预览缺失到下一次按键; 搜狗与百度连英文也组字, 几乎每个
         单词后都缺失. 现在组字结束后按选中行重绘预览 (构建 247);
         另有 (e) 宿主开关核对时发现 (见 A7-2): "选区内显示空白符" 开启时 Ace 只在下一次选区变化时加标记, 已有的选区不显示;
         现在切换时按当前选区立即重绘 (构建 249).
      —— 验收: `verify-overlay.mjs` 中 7 个场景登记为有意差异并说明原因, 新行为各有单独断言 (共 536 项), 9 处单点变异
      全部检出; 桥接执行式测试新增行号栏触摸, 拖拽暂停高亮, 插入点工具条, 截断按钮, 文档提示位置, 滚动条自动隐藏, 不变的组合
      更新, 以及以 Android UA 运行的方向键, 输入法光标换算, 收起选区, 组合结束与面板操作 (共 36 例), 变异检出 (第 11 项的 6 处
      单点变异全部检出); `AceImeEditingActionTest` 覆盖 Gboard 实测的面板偏移; `AceTouchInteractionDeviceTest` 改为断言新行为 (慢点移动光标, 停住不惯性, 行号栏点击不动光标不弹键盘,
      新增 "点在光标上") ; 维护者在 XQ-AT72 上复测.
      进度 (2026-10-13): 已实现. x86_64 API 36.1 16 KB 模拟器上触摸用例除既有的 B1 首次注入外全部通过; 用 DevTools 驱动
      触摸核对了放大镜光标竖线与编辑器光标对齐, 拖拽中停在标识符上 600 ms 无高亮, 抬手后出现. 真机复测待维护者.
      第 10 项 (构建 234) 在 XQ-AT72 上用真实 Gboard 输入核对: 点击, 拖拽不再删字, 多行退格与撤销结果一致. 第 11 项 (构建 235)
      在 XQ-AT72 上用真实 Gboard 核对: 面板左右键每次一格 (单词中间亦然), 上下键保持列, "|<" / ">|" 到行首 / 行尾且长行横向
      滚动跟随, 行首按 "|<" 不动, "选择" 模式下扩展选区, "全选" 选中整篇; 空格键左右滑动跨过行尾 / 行首, 文档不变.
      复测 (2026-10-14, 构建 243): 维护者在 XQ-AT72 上复测第 1 - 18 项未发现问题. 第 19 项待复测后勾选本项.
      结论 (2026-10-14): 构建 250 上维护者复测百度输入法 C4 (第 19 项) 通过; C11 中百度英文状态不组字, 灰色预览正常, Gboard 组字后
      点候选会追加空格, 弹窗与预览随之关闭, 均符合预期.

- [x] **G-A2** 交互等价门: 8 台设备逐项执行附录 B, 每项与 A0-6 的 1.4.12 实测一致 (惯性手感允许主观 "接近");
      自动部分为在每台设备上运行 `AceTouchInteractionDeviceTest` 并与 `tools/ace-mobile/device-records/` 中同设备的 A0 记录逐场景比对
      (缺 A0 记录的设备先用 `build/ace-perf/apk-a0/` 中的 A0 版 APK 补录);
      进度 (2026-10-13): G8441 上 A2 构建通过 `AceTouchInteractionDeviceTest`, 逐场景与 A0 记录一致 (记录在
      `tools/ace-mobile/device-records/a2-1.44.0-BH900ASK9E.jsonl`), 只有两类差异: 惯性滚动的最终位置 (同一版本重复运行的波动同样大:
      A0 两次 462 / 683, A2 两次 489 / 564), 以及双指场景不再在缩放中途触发长按 (见 A2-7 的取消语义, 属于改进). 首轮真机运行发现宿主在
      每次单指滑动开始时都会发出 `single_finger_scroll` 取消, 覆盖层的 `cancel()` 因此改为只响应 touchcancel, 窗口失焦与双指开始,
      且不清空手势模式, 离线校验新增了对应用例.
      补跑 (2026-10-13, A3 构建): XQ-AT72 与 XQ-DQ72 逐场景与 A0 记录一致 (XQ-DQ72 先用 A0 版 APK 补录了 A0 记录), 差异与 G8441
      相同: 慢速滚动 / 打断惯性的最终位置差 1 至 9 px, 双指场景不再中途触发长按. 记录在 `tools/ace-mobile/device-records/`
      (`a0-1.4.12-QV770340J7.jsonl`, `a2-1.44.0-QV710AF65F.jsonl`, `a2-1.44.0-QV770340J7.jsonl`); 两台 A0 记录都缺首个场景 "B1 quick tap"
      (首次注入失败, 与 G8441 的 A0 记录相同), A3 构建上该场景与其他设备一致. 已有自动比对的设备: G8441, 22120RN86C, XQ-AT72, XQ-DQ72;
      23046RP50C, OPD2413 与两台模拟器待补, 附录 B 的手动项待维护者执行.
      补跑 (2026-10-13, A5 构建 90fd5a1, 含自定义滚动条等 A5 默认开启项): OPD2413 与 x86_64 API 36.1 16 KB 模拟器先用 A0 版 APK 补录
      A0 记录 (`build/ace-perf/touch-a0-*.jsonl`), 再与 A5 构建逐场景比对; G8441, 23046RP50C 同样比对. 结果: 各设备上点击, 双击, 长按,
      选区内长按, 光标 / 锚点拖拽, 行号栏点击与点击清选区全部一致; 差异只有惯性 / 慢速滚动的最终位置与 finishActionMode 调用次数
      (同版本重复运行同样波动) 及双指场景的已知改进. 两处失败经查都与覆盖层无关: 模拟器的首个点击 "B1 quick tap" 在 A0 版上同样失败;
      23046RP50C 某次运行软键盘未弹出, 可见行由 36 变为 57, 80 行的测试文档只剩 448 px 可滚, B9 惯性无处可去. 测试文档因此加长到
      200 行 (`AceTouchInteractionDeviceTest.LINE_COUNT`), 加长后 23046RP50C 的 B9 惯性滚到 2848 px 并通过 (该设备另一次运行出现
      小米上已知的首次注入失败, 重跑通过). 加长后 B9 / B10 的滚动距离不再受文档末尾截断, 与旧 A0 记录 (80 行) 的同项数值不可比,
      比对时只看行为. 至此 8 台都有自动比对记录; 门仍待附录 B 手动项.
      补跑 (2026-10-13, A0-5 重写后的 A9 构建): XQ-DQ72 与 22120RN86C 逐场景与旧版一致; x86 API 27 模拟器 (Chrome 69) 先用旧版 APK 补录
      记录, 再与 A9 比对, 一致. 差异只有已知类别 (滚动距离, finishActionMode 次数, 双指改进) 与两处环境因素: 22120RN86C 的首个点击 /
      双击偶发注入失败 (重跑一致); 22120RN86C 的 B2 行号栏点击把光标移到该行行首, 原因是该机 TS 服务在 G-A1 修复后首次可用, 测试文档
      的每一行都是 JavaScript 错误, 行号栏中点落在诊断标记区, 点击打开了诊断提示 (桥接层既有行为); 旧版与此前构建在该机上 TS 不可用,
      只切换断点. B2 记录现在附带该行的诊断数 (`row3Diagnostics`). 设备记录已更新 (`a0-1.4.12-AVD_API_27`, `a2-1.44.0-AVD_API_27`,
      `a2-1.44.0-QV770340J7`, `a2-1.44.0-bek749scrwv4wo8h` 为重写后的构建).
      补跑 (2026-10-13, A9 构建): x86_64 API 36.1 16 KB 模拟器 (WebView 134) 的触摸用例两轮都只有 "B1 quick tap" 失败 (首个注入的
      触摸未到达 WebView, 调用轨迹为空), 与该模拟器的 A0 记录 (`build/ace-perf/touch-a0-emulator-5574.jsonl`) 及 A5 构建的两次记录相同,
      属环境因素; 其余场景与旧版一致. 附录 B 手动项的逐项步骤, 期望与参照见 `docs/development/ace-1.44.0-manual-tests.md`.
      手测首轮 (2026-10-13, 维护者, XQ-AT72): B1, B2 (b)(c), B4, B5, B7-B10 正常; B2 (a) 行号栏点击弹出键盘并跳视图, B3 光标
      总在末尾, B6 放大镜光标偏移与拖拽卡顿, B11 文档提示遮挡补全弹窗, 以及维护者要求改进的五处 1.4.12 旧表现, 均在 A2-10
      处理, 待复测. B11 中另发现宿主设置页暗色主题下对话框 "更多" 菜单不可读, 属宿主通用组件, 另立任务.
      ActionMode 工具条 (`AceSelectionToolbar`) 出现 / 消失时机一致; 旋转屏幕与软键盘弹出后拖拽仍准确.
      结论 (2026-10-14): 通过. 自动比对 8 台已齐 (见上); 附录 B 手动项由维护者在 XQ-AT72 (WebView 145) 完成, 首轮问题在 A2-10 修复后
      复测未发现问题. 按维护者决定, 其余设备不再逐项手测, 由新增的 `AceManualCoverageDeviceTest` 代替 (缩放保留选区与缩放后立即双击,
      缩放焦点, 补全弹窗点击与拖动, 空白处长按, 超长行按钮, 放大镜选区, 视口变化后的软换行行位置, 提示框字号, 矢量图标尺寸,
      Gruvbox 选区): OPD2413 (WebView 136), 23046RP50C (130), XQ-DQ72 (153), 22120RN86C (111), G8441 (Chrome 126) 与 x86 模拟器
      emulator-5560 (WebView 83) 10/10 通过. G8441 运行时处于横屏, 放大后可见行很少, 测试改为只操作屏幕内 (且在键盘之上) 的行.
      (降级路径: 若 `$toDestroy` 与 capture 兜底在某设备都无法阻止上游处理 -> 在本文件记录该 WebView 版本,
      并评估为该设备启用 "上游触摸处理 + 覆盖层只接管 ActionMode" 的降级模式; 仍不得改动官方文件.)

## 7. A3 · 桥接层适配与清理

- [x] **A3-1** gutter 事件按祖先单元格处理: `editor.on("guttermousedown")` (`:5634-5658`) 用
      `findAncestorWithClassToken(target, "ace_gutter-cell") || findAncestorWithClassToken(target, "ace_gutter-cell_svg-icons")`
      取单元格, 断点命中区改为 `cell.getBoundingClientRect().left + 24`; `isDiagnosticGutterCell` 同时识别 `span.ace_icon` 子节点;
      `isGutterFoldWidgetEvent` 直接接受 `target` 为 `ace_fold-widget` 的情况.
      —— 验收: 执行式测试分别以单元格, 文本节点父级, 注解图标, 折叠按钮为 target 触发事件, 断点 / 诊断 / 折叠各命中一次.
      进度 (2026-10-13): 新增 `findGutterCell` (识别 `ace_gutter-cell` 与 `ace_gutter-cell_svg-icons`), `guttermousedown`,
      诊断提示抑制, 折叠占位与三处折叠按钮判断都改为按祖先单元格计算, `isDiagnosticGutterCell` 增加 security / hint. 在 jsdom 中
      (手工设置字体度量与容器尺寸) 实测: 单元格与其子 span 为目标时切换断点, 错误行的 `ace_icon` 为目标时打开诊断标记而非断点.
      折叠按钮依赖布局, 待 A6-3 的执行式测试覆盖后勾选.
      结论 (2026-10-13): A6-3 的执行式测试覆盖了四种 target: 单元格与其子 span 切换断点 (svg 图标开 / 关两种模式), 注解图标不切换断点,
      手指按在折叠按钮上 (给按钮设定矩形) 折叠该行并发出 `gutterFoldToggled`; 去掉折叠按钮判断的变异会被检出.
- [x] **A3-2** 删除 1.4.12 专属代码与注释: `:5443` `global.editor = editor` 的 1.4.12 兼容注释 (赋值本身保留: 性能,
      长行与触摸仪器测试以及其他模块通过 `window.editor` 访问编辑器, 只改注释说明用途); `:131-136` 注释改写 (MAX_LINE_LENGTH 语义见 A6-4);
      `:4678` 与 `:4783` 的 "ACE 1.4.x" 注释; `autojs6_lsp_core.js:144` 的版本字样; `README` 中 "Ace 1.4.12 的 TSX" 说明交给 A4-1.
      —— 验收: `grep -n "1\.4\.12\|1\.4\.x" autojs6/*.js` 无命中.
      结论 (2026-10-13): 已改写 5 处注释 (超长行守卫, 两处选项容错, `window.editor` 用途, LSP choice 占位). 1.44.0 对首个 token
      也按 `MAX_LINE_LENGTH` 截断并加展开按钮, 桥接层的 16K 守卫对更长的行仍然生效, §2.4 第 5 条 "实际已失效" 的说法不准确, A6-4 再评估.
- [x] **A3-3** 补全弹窗补丁复核 (`installCompletionPopupTouchScrollPatch`, `:2073`): 确认 `$init` 仍返回 popup, `showDocTooltip`
      仍在 `this.tooltipNode` 上工作; 上游已设置 `pointerEvents` 与 `overscrollBehavior`, 保留触摸滚动器但去掉重复样式赋值;
      `refreshAutocompletePopupTheme` (`:493`) 改为通过 `Autocomplete.for(editor).popup` 获取弹窗 (弹窗可能尚未创建时跳过).
      —— 验收: 真机上弹窗可手指滚动, 文档提示可滚动, 主题切换后弹窗配色随之变化.
      进度 (2026-10-13): 代码复核结论为无需修改: 1.44.0 的 `$init` 仍返回 popup, `showDocTooltip` 仍使用 `this.tooltipNode`,
      上游只设置了 `pointerEvents` 与 `overscrollBehavior`, 与桥接层的样式不重复; `Autocomplete.for(editor)` 会给 `editor.completer`
      赋值, 且每次打开弹窗都重新 `setTheme`, 所以继续用 `editor.completer.popup` 即可, 不必主动创建. 真机滚动与主题验证随 G-A3 进行.
      结论 (2026-10-14): 真机上手指滚动与点击插入由 `completionPopupInsertsOnTapAndScrollsOnDrag` 在 6 台设备覆盖, 运行中发现的宿主
      滚动取消关闭弹窗与说明框遮挡已修复 (A2-10 第 20 项 (b) (c)); 主题配色由维护者 V5 与 Gruvbox 手测确认.
- [x] **A3-4** 历史操作钩子复核 (`installHistoryOperationHooks`, `:3469`): 对照 1.44.0 `UndoManager.add / undo / redo` 与
      `EditSession.undoChanges(deltas, dontSelect)`, 确认 `addUndoableHistoryMarker` 的空 delta (`lines: [""]`) 仍被
      `UndoManager` 接受且不改文本; `markClean / isClean` 语义不变.
      —— 验收: `AceCodeFoldingSmokeTest` 与 `hostReplacementSucceedsWhileUserInputIsReadOnly` 通过; A6-3 增加撤销标记用例.
      进度 (2026-10-13): 两个用例在 G-A1 的 5 台设备上均通过; 1.44.0 `Document.applyDelta` 的空增量守卫与 1.4.12 相同. 撤销标记的执行式用例待 A6-3.
      结论 (2026-10-13): 两个设备用例在 8 台设备的 G-A1 运行中均通过; A6-3 执行了撤销标记 (不改文本, 修订号前进, 撤销后发出带标记的
      historyOperation), 带标记的整篇替换撤销 / 重做 (含换行符恢复与回调顺序) 以及 clean 书签.
- [x] **A3-5** 折叠路径复核: `foldAll` 的 pending 机制 (`:4898`) 依赖 `changeMode` 事件与 `session.foldAll`; 1.44.0
      `session.unfold(null, true)` 与 `$toggleFoldWidget(row, {children, all, siblings})` 行为对照; 折叠占位符点击
      (`installFoldPlaceholderClickCapture`, `:5411`) 的 `ace_fold` 类名不变.
      —— 验收: `wholeDocumentFoldingPreservesEditingStateAndWorksReadOnly` 通过; 触摸点击折叠占位符展开.
      结论 (2026-10-13): `AceCodeFoldingSmokeTest` (含上述用例) 在 8 台设备的 G-A1 运行中通过; 执行式测试中全部折叠 / 展开正常,
      在折叠占位符上 touchstart + touchend 经 `handleFoldPlaceholderTouch` 展开折叠并发出 `foldPlaceholderTouchExpanded`, 改掉 `ace_fold`
      类名判断的变异会被检出. 1.44.0 的占位符类名仍为 `ace_fold`.
- [x] **A3-6** IME 路径复核: `getImeTextInputElement` / `resetImeTextInputSelectionWindow` 对接 1.44.0 `TextInput`
      (`getElement`, `resetSelection`), 复核 `onInput` 新增的 `isMobile` 重置条件是否与桥接层 `IME_TEXT_INPUT_PROGRAMMATIC_SELECTION_SUPPRESS_MS`
      窗口冲突; 需要时把 1.44.0 重置事件记入 `imeTextInputSelectionSuppressed` 事件的 reason.
      —— 验收: 附录 C 在 6 台真机通过; `AceRuntimeEventHistory` 中无非预期的 `imeTextInputSelectionDropped`.
      进度 (2026-10-13): A2-10 第 11 项改写了输入框选区的处理: 输入法光标按 1.44.0 `$resetSelection` 的输入框布局换算,
      抑制窗口只保留聚焦与触摸之后, 编程式移动不再设置; `imeTextInputSelectionDropped` 现在只在输入框文字不符合已知布局时
      发出 (reason `unknown_layout`, 如超过 400 字符的行); 1.44.0 在组合中不重置输入框, 桥接层移动光标后按 Ace 的方式结束组合.
      进度 (2026-10-14): 附录 C 已由维护者在 XQ-AT72 上用 Gboard 与百度输入法完成, 只有百度 C4 (选择模式方向键) 有问题, 已修复
      (A2-10 第 19 项), 待复测; `AceImeReplayDeviceTest` 在 5 台真机重放 Gboard, 百度与搜狗的输入连接调用 (附录 C 第 1 - 5, 7, 8, 11,
      12 项) 全部通过. 诊断信息中的 `imeTextInputSelectionDropped` 在复测时一并核对.
      进度 (2026-10-14): C4 复测通过 (构建 250). 该事件只记在插件进程的运行事件历史中, logcat 中查不到, 待维护者提供复测后的诊断
      信息再核对并勾选.
      结论 (2026-10-14): 维护者在 XQ-AT72 (插件构建 250, WebView 145) 上用百度输入法 (含 "选择" 模式) 与 Gboard 输入后复制诊断信息:
      健康状态 RUNNING, 无失败记录, TypeScript 语义服务 16 次操作全部成功; 运行事件历史 (保留最近 30 条) 中没有
      `imeTextInputSelectionDropped`, 可见 "选择" 模式下的 `ime_editing_action` (lineStart / lineEnd, extend=true) 与之后正常收起的工具条.
      连同附录 C 复测与 `AceImeReplayDeviceTest`, 本项通过.
- [x] **A3-7** 字号 / 滚动 / 双指缩放复核: `applyFontSizeSp` (`:4466`), `forceRendererCoordinateRefresh` (`:4485`),
      `scrollToPosition` (`:4555`) 使用的 renderer 成员在 1.44.0 均存在; 复核 `renderer.$padding` 在 1.44.0 是否仍为数字
      (文本层 `$padding` 与 gutter `$padding` 对象不同, 桥接层只读 renderer 的).
      —— 验收: 双指缩放后焦点位置不漂移 (附录 B 第 13 项).
      进度 (2026-10-13): 1.44.0 中 `renderer.$padding` 仍为数字 (执行式测试断言), 桥接层用到的 renderer 成员都在 A6-2 的类型检查中
      (公开成员来自 ace.d.ts, `$padding` 等私有成员写入 `ace-private.d.ts`). 双指缩放焦点为附录 B 第 13 项手动检查.
      结论 (2026-10-14): 维护者 B13 / V8 复测未发现问题; `pinchKeepsTheTextBetweenTheFingersInPlace` 在 6 台设备断言放大与缩小后
      手指下的行不变 (误差 1 行内).
- [x] **A3-8** CSS 类审计 (`autojs6.css`): `.ace_gutter-cell.ace_breakpoint` 增加 `.ace_gutter-cell_svg-icons.ace_breakpoint`;
      `.ace_doc-tooltip` / `.ace_tooltip` / `.error_widget` 的尺寸限制在 1.44.0 结构下复核; 新增 `.ace_inline_button.ace_toggle_wrap`
      (超长行溢出按钮) 的触摸友好尺寸; 暗色主题下 `ace_line-hover` (setSelectOnHover=false 时的悬停标记) 配色.
      —— 验收: 8 台设备截图抽查无明显错位; 暗色主题下弹窗与提示框可读.
      结论 (2026-10-14): 维护者 V1, V5, V7 复测未发现问题 (提示框字号随编辑器缩放, 见 A2-10 第 17 项; 暗色主题弹窗可读);
      `tooltipTextFollowsTheEditorFontSize`, `svgGutterIconsFollowTheTextSize` 与 `longLineButtonTogglesWordWrapByTouch` (超长行按钮
      可用手指点击) 在 6 台设备通过.
- [x] **A3-9** Worker 策略复核: `shouldUseAceWorkerForMode` (`:267`) 维持 lua 开启; 确认 1.44.0 Blob worker 在
      `https://appassets.androidplatform.net` 源下 `importScripts` 成功 (G-A1 已验); JSON worker 交给 A4-3.
      —— 验收: `luaWorkerPublishesSyntaxAnnotationsAndStopsOutsideLua` 通过.
      结论 (2026-10-13): 该用例属于 G-A1 的 `AceLanguageRoutingSmokeTest`, 在 8 台设备上通过 (Blob worker 的 `importScripts` 正常);
      执行式测试断言只有 Lua 文档启用 Ace worker, 长行安全模式下关闭.
- [x] **A3-10** 诊断快照与事件: `AceDiagnostics` 增加 `aceVersion` (读取 `ace.version`, 1.44.0 为 "1.44.0") 与 A2-7 的 `mobileOverlay`;
      `ACE_RUNTIME_REVISION` 已在 A1-3 更新.
      —— 验收: `sessionDiagnosticsExposeExecutionAlignedTypeScriptProfiles` 扩展断言 `aceVersion == "1.44.0"`.
      备注 (2026-10-13): 与 A2-7 的 `mobileOverlay` 一起改诊断快照 (JS 状态, Kotlin 字段, Bundle 键), 避免两次变更诊断契约.
      完成 (2026-10-13): 桥接层在 `notifyReady` 之后发出 `aceRuntime` 事件 (`{aceVersion, mobileOverlay}`), `AceCodeEditor` 记录后写入
      `AceDiagnosticsSnapshot.aceVersion` / `mobileOverlay` (JSON 文本), Bundle 键与诊断文本同名. 原定扩展的用例不等待就绪, 因此改为新增
      `sessionDiagnosticsReportAceRuntimeAndMobileOverlay` (就绪后轮询事件), 断言 "1.44.0", 已安装, 卸下 4 个上游监听器, 未退回捕获阶段,
      放大镜关闭; G8441 通过.
- [x] **G-A3** 桥接门: JVM 测试全绿 (无 `@Ignore` 新增), 8 台设备全部 instrumentation 用例通过, 附录 C 在 6 台真机通过.
      进度 (2026-10-13): JVM 测试 35 个类全部通过 (`--rerun`), `@Ignore` 为 0. 全套 instrumentation (A7 / A7b 构建, 27 至 28 个用例,
      其中 2 个 JDT / Kotlin 编译器探针按设计在 ART 上跳过): G8441, 23046RP50C, OPD2413, XQ-AT72 全部通过; 22120RN86C 只剩
      TypeScript 诊断超过 2000 ms 与 ECJ 等待超时两项, 与该机 A0 版的既有失败相同 (见 G-A1). 首轮全套在 22120RN86C 上发现并修复了
      A5-8 符号高亮引起的 Python 补全回退 (见 A5-8 修复). XQ-DQ72 当时未连接, 模拟器未跑; 附录 C 为手动项. 门待补齐后由维护者确认.
      补跑 (2026-10-13, A9 构建, 含 A0-5 重写与 G-A1 修复): XQ-DQ72 全套 28/28 通过; 22120RN86C 的 `AceCodeEditorSmokeTest` 全部通过
      (TS 项目诊断在冷启动预算下恢复), ECJ 用例单独运行通过; x86 API 27 模拟器 (Chrome 69) 全套 28 项第二轮中 26 项通过, 余下的
      符号高亮用例 (未识别 TS / Pyright 不可用) 已修正并在该机通过, 触摸用例的长按偶发失败单独两轮通过. 首轮该模拟器出现一次测试进程
      崩溃 (WebView 渲染进程被回收), 未复现. 8 台的 instrumentation 均已覆盖; 附录 C 为手动项, 待维护者统一手测.
      补跑 (2026-10-13, A9 构建): x86_64 API 36.1 16 KB 模拟器全套 28 项中 27 项通过 (2 个编译器探针按设计跳过), 唯一失败为触摸用例的
      B1 首次注入 (见 G-A2). 附录 C 的逐项步骤见 `docs/development/ace-1.44.0-manual-tests.md`.
      进度 (2026-10-14): 附录 C 的百度输入法一轮 (XQ-AT72, WebView 145) 完成: 空格键滑动移动光标可用, 该输入法没有双击空格输入句号;
      除 C4 外未发现问题, C6 保存后的文件经 adb 核对仍全部为 CRLF. C4 已修复 (A2-10 第 19 项), 待复测. 新增的两个设备测试类见 A8-4,
      运行中发现的缺陷见 A2-10 第 20 项. 复测通过后按维护者决定 (XQ-AT72 手测加 8 台自动化) 勾选本门.
      结论 (2026-10-14): 通过. JVM 测试 175 项全部通过, 无新增 `@Ignore`; 8 台的全套 instrumentation 已于 2026-10-13 跑齐 (上文),
      新增的两个设备测试类在 5 台真机 22/22 通过; 附录 C 由维护者在 XQ-AT72 (WebView 145) 用 Gboard 与百度输入法完成, C4 修复后
      复测通过 (构建 250). 按维护者决定, 其余真机的附录 C 以 `AceImeReplayDeviceTest` 代替.

## 8. A4 · 语言资源

- [x] **A4-1** TSX 官方 mode: `resolveAceMode` (`:176`) 把 `.tsx` 路由到 `ace/mode/tsx`; `autojs6_completer.js:1200` 附近的
      `MODE_LANGUAGES` 与 `autojs6_lsp_client.js:636` 的 mode 映射增加 `ace/mode/tsx -> typescript 家族`; `applyDocumentWorkerPolicy`
      对 tsx 关闭 worker; README 语言表 TSX 语法由 "部分" 改为 "支持"; 在 `tools/ace-lsp/TSX_HIGHLIGHT_EVALUATION.md` 末尾追加
      "TSX-HL-1 由 2.0.0 关闭" 结论, `Roadmap.md` M0-3 结论行同步加注.
      —— 验收: 打开 `.tsx` 文档 `session.getMode().$id === "ace/mode/tsx"`, JSX 标签获得 tag/attribute token (截图留档);
      `documentPathSelectsModeAndIsolatesJavaScriptCompletions` 扩展 tsx 用例.
      进度 (2026-10-13): 路由, JS 家族判断, 语言 ID (tsx 归入 typescript), 补全器与本地符号的 mode 映射, LSP 客户端判断都已加入
      `ace/mode/tsx`; worker 策略只对 lua 开启, tsx 自然关闭. jsdom 确认样例得到 tag-open / tag-name / attribute-name token;
      设备用例已改为断言 tsx mode 与这些 token; `TSX_HIGHLIGHT_EVALUATION.md` 与 `Roadmap.md` 已加注 TSX-HL-1 关闭.
      README 语言表留给 A8-6 (生成文件). G8441 上 `AceLanguageRoutingSmokeTest` 等 15 项通过 (2026-10-13).
- [x] **A4-2** Kotlin 切官方: 用 1.44.0 `mode-kotlin.js` 替换项目版本; 复核官方 `createKeywordMapper` 是否让关键字补全器
      得到非空列表 (`verifyAutoJs6KotlinP2Plus`). 官方 1.44.0 仍未设置 `snippetFileId` (已核查), 因此在运行期补丁脚本
      `autojs6/autojs6_mode_patches.js` (G-A1 时为 Java 关键字已建立) 中对 `ace/mode/kotlin` 设置 `snippetFileId = "ace/snippets/kotlin"`,
      不改官方文件; `MILESTONE_BASELINES.md` M1 表加注 "mode-kotlin 自 2.0.0 起为官方 1.44.0".
      —— 验收: `verifyAutoJs6KotlinP2Plus` 与 Kotlin 样例高亮截图通过; `grep "Ace 1.4.12 marks" src-min-noconflict/mode-kotlin.js` 无命中.
      结论 (2026-10-13): 已换为官方文件 (锁文件中 origin 改为 upstream, 项目文件剩 4 个). jsdom 对比: 官方 mode 关键字补全 73 项
      (含 fun / val / data / companion / suspend), 样例中 package / class / fun / return 等均为 keyword 类 token, 满足设备用例的高亮断言;
      `snippetFileId` 由补丁脚本补为 `ace/snippets/kotlin`, 且补丁以 `capturing` 方式注册在 changeMode 最前面, 保证 ext-language_tools
      加载片段时已生效 (jsdom 中 15 个 Kotlin 片段照常加载). `verifyAutoJs6KotlinP2Plus` 等 6 个 Node 任务与 JVM 测试通过.
- [x] **A4-3** JSON worker (验证门 G-A4-3): `shouldUseAceWorkerForMode` 对 json 返回 true, 保留 `JSON.parse` 诊断作为
      worker 不可用时的回退; 两者产生的注解去重 (以 worker 注解优先); `applyDocumentLongLineSafetyMode` 下关闭.
      —— 验收: JSON 文档输入错误 JSON 出现 worker 注解, 修正后消失; `luaWorkerPublishesSyntaxAnnotationsAndStopsOutsideLua`
      扩展 json 分支.
      进度 (2026-10-13): `shouldUseAceWorkerForMode` 对 json 返回 true. 合并逻辑放在 LSP 客户端: 包装 `session.$startWorker` 跟踪当前
      WorkerClient 并监听其 `annotate`; 当前 worker 应答过至少一次后, 其注解 (raw 为 `json-worker`) 经 `setSessionAnnotations` 成为诊断
      状态并通知宿主, 之后的诊断轮次不再发布 `JSON.parse` 结果; worker 尚未应答, 换了新 worker, 或 worker 无法启动 (Ace 在没有
      `Worker` 时创建永不应答的替身) 时继续使用 `JSON.parse` 诊断, 因此不会出现两套注解互相覆盖或失去诊断. 长行安全模式下 worker
      关闭 (沿用 `applyDocumentWorkerPolicy`). 执行式测试新增一例 (应答前为 json-syntax, 应答后为 json-worker 且宿主诊断状态同步, 再次编辑
      不被 JSON.parse 覆盖, 修正后清空, 安全模式关闭 worker), 去掉 worker 优先判断的变异会被检出; 设备用例
      `luaWorkerPublishesSyntaxAnnotationsAndStopsOutsideLua` 增加 json 分支 (断言策略开启且有注解, 打印 worker 是否应答), 待 G-A4-3 上设备.
      Lua 的 worker 注解与 LuaLS 诊断仍是后写者覆盖 (不在本项范围).
- [x] **G-A4-3** 在 8 台设备验证 worker-json 加载与注解; 任一设备失败则该设备回退 `JSON.parse` 路径且不报错.
      (降级路径: 失败设备比例 > 2/8 -> 默认关闭 json worker, 保留代码路径并记录结论.)
      备注 (2026-10-13): 暂缓实施. 现状是 Lua 的 Ace worker 注解与 LSP 诊断都直接 `setAnnotations`, 后写者覆盖; JSON 若开 worker,
      `validateDiagnosticRun` 的 `JSON.parse` 诊断会覆盖 worker 注解, 需要先给 LSP 客户端加 "worker 活动时以 worker 注解为准并同步到诊断状态"
      的合并逻辑, 再上设备门.
      进度 (2026-10-13): 设备用例的 json 分支在 G8441 (Chrome 126), 23046RP50C (WebView 130), OPD2413 (WebView 136), XQ-AT72 (WebView 145)
      上通过, 且 4 台的 json worker 都已应答 (`workerAnswered: true`, 注解 raw 为 `json-worker`); 22120RN86C 的全套运行中该用例通过.
      XQ-DQ72 与模拟器待补.
      补跑 (2026-10-13, A9 构建): XQ-DQ72 (WebView 153) 的 json 分支通过; x86 API 27 模拟器 (Chrome 69) 的 `AceLanguageRoutingSmokeTest`
      json 分支在第二轮全套中通过 (首轮在此前崩溃未跑到; 注解来自 worker 或 `JSON.parse` 回退均可). 6 台真机加模拟器均无报错.
      结论 (2026-10-14): 通过, 保持 json worker 开启. 8 台都已覆盖: 上述 6 台真机与 x86 API 27 模拟器, 加上 x86_64 API 36.1 16 KB 模拟器
      (WebView 134) 在 2026-10-13 的全套运行中 `AceLanguageRoutingSmokeTest` 通过 (见 G-A3). 记录了 worker 应答的 4 台 (G8441, 23046RP50C, OPD2413, XQ-AT72) 注解都来自
      worker, 其余设备通过且无报错; A8-2 复跑时再确认一次.
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

- [x] **A5-1** `useSvgGutterIcons` (默认开): `editor.setOption("useSvgGutterIcons", enabled)`; A3-8 的断点样式已兼容两种类名;
      `isDiagnosticGutterCell` 同时识别 `ace_icon` 与 `ace_icon_svg`.
      —— 验收: 23046RP50C (3x 密度) 上注解图标边缘清晰, 断点红点位置不变.
      进度 (2026-10-13): 初始值读 `isSvgGutterIconsEnabled` (缺省 true), `AutoJsAce.setSvgGutterIconsEnabled` 切换后 `updateFull`;
      `autojs6.css` 的断点, 隐藏断点与禁止选中规则都加了 `.ace_gutter-cell_svg-icons`. 1.44.0 两种模式下注解类名都挂在单元格上
      (svg 模式图标子节点另有 `ace_icon_svg ace_error`), `findGutterCell` 已识别两种单元格, `isDiagnosticGutterCell` 无需改动;
      jsdom 中 svg 开 / 关两种模式的 gutter 点击 (断点切换, 注解图标, errorMarker) 结果一致. 待真机目视验收.
      结论 (2026-10-14): 维护者 V1 复测未发现问题 (图标随行号字号, 见 A2-10 第 14 项); `svgGutterIconsFollowTheTextSize` 在 6 台设备通过.
- [x] **A5-2** `highlightIndentGuides` (默认开, 且仅在 `displayIndentGuides` 开启时生效): `setIndentGuidesEnabled` (`:4731`)
      同时设置两项; 关闭缩进参考线时强制关闭高亮.
      —— 验收: 光标进入嵌套块时对应参考线高亮, 自动换行下不错位 (上游 #5621 修复).
      进度 (2026-10-13): 初始值读 `isHighlightIndentGuidesEnabled` (缺省 true), 生效值为 "参考线开 且 高亮开";
      `setIndentGuidesEnabled` / `setHighlightIndentGuidesEnabled` 两个入口都按该规则设置, jsdom 已核对四种组合. 待真机目视验收.
      结论 (2026-10-14): 维护者 V2 确认符合预期.
- [x] **A5-3** `customScrollbar` (默认开, 验证门 G-A5-3): `editor.setOption("customScrollbar", enabled)`; 复核触摸拖动滚动条,
      `installScrollChangeHooks` (`:2580`) 的 `scrollToX/Y` 包装仍被触发, 诊断标记在滚动条上的配色跟随 `applyThemePalette`.
      —— 验收: 滚动条上出现错误 / 警告标记, 手指拖动滚动条与惯性滚动互不干扰.
      进度 (2026-10-13): 初始值读 `isCustomScrollbarEnabled` (缺省 true), 在 `setOptions` 之后单独设置; 滚动条标记画在 canvas 上,
      取不到 2D 上下文时 (jsdom 即如此) 上游会在 `setOption` 中抛错, 因此出错时记 recoverableError 并退回原生滚动条, 不中断初始化.
      上游滚动条只监听鼠标事件, 而覆盖层阻止 touchstart 默认行为后浏览器不再合成鼠标事件, 所以覆盖层新增 "scrollbar" 手势模式:
      按在滑块上拖动滑块, 按在轨道上先让滑块中心跳到手指处, 通过滚动条自身的 `scroll` 事件滚动 (经 `session.setScrollTop` ->
      `renderer.scrollToY`, `installScrollChangeHooks` 的包装照常触发); 不移动光标, 不长按, 不惯性. `verify-overlay.mjs` 新增
      9 项断言 (共 491 项), jsdom 用真实 1.44.0 滚动条核对了拖动与轨道点击. 标记配色由上游按 `theme.isDark` 选择亮 / 暗两套,
      主题调色板只有前景 / 背景两色, 不再另行覆盖. 待 G-A5-3 真机复核.
      结论 (2026-10-14): 随 G-A5-3 通过.
- [x] **G-A5-3** 8 台设备复核 customScrollbar 与覆盖层惯性滚动; 任一设备出现滚动条吞掉触摸或渲染错位 -> 默认改为关闭并记录.
      进度 (2026-10-13): A5 构建 (自定义滚动条默认开) 在 G8441, 23046RP50C, OPD2413, x86_64 模拟器上跑了 G-A1 六个类与触摸用例,
      惯性滚动, 打断惯性与拖拽均正常 (见 G-A2 补跑); XQ-AT72, XQ-DQ72 与 x86 API 27 模拟器尚未用 A5 构建复跑. jsdom 中发现上游滚动条
      在首次渲染前没有滑块几何 (thumbTop 为 undefined), 覆盖层对这种滚动条不进入 "scrollbar" 模式, 按普通滚动处理 (离线校验 493 项).
      滚动条标记的目视检查与手指拖动滑块的手感仍需真机人工确认.
      进度 (2026-10-13, A7 / A7b 构建): XQ-AT72 与 22120RN86C 的全套运行中触摸用例 (含惯性与打断惯性) 通过, 至此 6 台真机中除
      XQ-DQ72 外都已用自定义滚动条默认开启的构建跑过触摸用例, 未出现滚动条吞掉触摸.
      补跑 (2026-10-13, A9 构建): XQ-DQ72 与 x86 API 27 模拟器的触摸用例 (含惯性与打断惯性) 通过; 8 台的自动部分已齐, 滚动条标记的
      目视检查与手指拖动滑块的手感留给维护者统一手测.
      结论 (2026-10-14): 通过, 保持默认开启. 8 台的触摸用例 (含惯性与打断惯性) 未出现滚动条吞掉触摸或渲染错位; 滚动条标记与拖动滑块
      的手感由维护者在 XQ-AT72 (WebView 145) 确认 (V3), 自动隐藏 (A2-10 第 6 项) 复测未发现问题.
- [x] **A5-4** `showWhitespacesInSelection` (默认开): 加载 `ext-whitespaces_in_selection.js` 后 `editor.setOption("showWhitespacesInSelection", enabled)`;
      暗色主题下空白符颜色复核.
      —— 验收: 选中含制表符与空格的文本时显示占位符号, 取消选区后消失.
      进度 (2026-10-13): 初始值读 `isWhitespacesInSelectionEnabled` (缺省 true), 在 `setOptions` 之后单独设置 (选项由扩展注册);
      jsdom 中选中含制表符与空格的两行后文本层出现 6 个占位节点. 待真机目视与暗色主题复核.
      结论 (2026-10-14): 维护者 V4 确认符合预期 (制表符显示为横线). 宿主开关切换时已有选区不更新的问题已修复 (A2-10 第 20 项 (e)).

### 9.2 补全与智能提示

- [x] **A5-5** 弹窗状态: `Autocomplete.for(editor)` 后设置 `showLoadingState = true`, `emptyMessage = function(prefix) {...}`
      (文案经 `getSmartHintOptions` JSON 由宿主本地化下发, 缺省英文), `setSelectOnHover = false` (断言默认值), `stickySelectionDelay`
      保持 500; 慢速 provider (Pyright / LuaLS) 首包前显示加载项.
      —— 验收: Python 文档冷启动首次补全看到加载态; 无候选时看到提示而不是空弹窗; 指尖滑过候选不改变选中项.
      进度 (2026-10-13): `installCompletionPopupStates` 在初始化时对 `Autocomplete.for(editor)` 设置 `showLoadingState = true`,
      `stickySelectionDelay = 500`, `setSelectOnHover = false`; 加载项文案通过覆盖 `Autocomplete.completionsForLoading` (可配置的静态属性)
      替换, 不调用 `config.setMessages` (它会整体替换消息表, 其余键会逐条告警). 上游只在非 autoShown 时显示空结果提示, 而桥接层的
      实时补全也走 `startAutocomplete` (autoShown 为 false), 因此 `emptyMessage` 只在 Ctrl-Space / TAB 长按 (`startSmartHintCompletion`)
      之后返回文案, 实时补全与点后补全返回空串, 无候选时照旧关闭. 两条文案 `text_completion_loading` / `text_completion_no_suggestions`
      放在插件自己的 11 个 `strings.xml` (插件已有 10 语言资源), 随 `getSmartHintOptions` JSON 下发 (`completionLoadingText`,
      `completionEmptyText`), 缺省英文. jsdom 核对: 显式无候选显示 "无建议", 实时输入无候选不弹窗, 有候选照常弹出, 慢速 provider
      700 ms 时显示 "加载中...", 结果到达后替换. 待真机验收 (Python 冷启动).
      结论 (2026-10-14): 维护者 V5 复测符合预期.
- [x] **A5-6** 上游 triggerCharacters 替换自研点触发 (验证门 G-A5-6): 映射表
      identifier -> `enableLiveAutocompletion: true, liveAutocompletionThreshold: completionMinChars, liveAutocompletionDelay: completionDelayMs`;
      dot -> `enableLiveAutocompletion: true, liveAutocompletionThreshold: 1e9` 且仅靠 `triggerCharacters`;
      off -> `enableLiveAutocompletion: false`. 静态补全器与 LSP 补全器声明 `triggerCharacters` (JS/TS/Python/Java/Kotlin: `["."]`, Lua: `[".", ":"]`).
      先并行保留 `installMemberCompletionDotTrigger` (`:3737`) 与 `scheduleLiveCompletion` (`:4102`), 以开关 `useUpstreamTrigger` 切换.
      —— 验收: 行为对照表 (3 种触发 x 延迟 0/300 ms x 最小字符 1/3 x "点后重启" x "退格清空关闭") 两套机制逐格等价.
- [x] **G-A5-6** 对照表全部等价且 6 台真机 IME 下无重复弹窗 -> 删除自研触发代码; 否则保留自研触发, 删除映射代码并记录差异.
      结论 (2026-10-13): 不等价, 保留自研触发, 映射代码不进入产品 (只在对照实验中临时设置). 对照在 jsdom 中进行: 同一页面, 同一假
      补全源 (声明 `triggerCharacters: ["."]`), 自研侧按智能提示选项运行, 上游侧把自研触发设为 off 后按映射表设置
      `enableLiveAutocompletion / liveAutocompletionThreshold / liveAutocompletionDelay`; 矩阵为 3 种触发 x 延迟 0/300 ms x 最小字符
      1/3 x 4 个场景 (连续输入标识符, 标识符后输入点, 点后重启, 退格清空关闭), 每步记录弹窗是否打开及前三个候选. 48 格中 11 格不同:
      (1) identifier 模式下弹窗已打开时输入点, 上游在约 400 ms 内关闭弹窗且不再请求成员补全 (上游只在没有活动补全时处理 insertstring),
      自研 30 ms 后重启并显示成员候选, 这是用户可见的退化, 共 6 格; (2) dot 模式与 identifier 最小 3 字符下, 上游在点后立即弹出,
      自研在 30 ms 计时后弹出, 只是时序差异, 共 5 格. 另外上游实时补全把 `autoShown` 设为 true, 慢速 provider 的加载项 (A5-5) 不会出现.
      因 (1) 不等价, 真机 IME 复核不再需要. 桥接执行式测试新增一例固定自研触发的行为 (标识符无延迟 / 最小 3 字符 / 300 ms 延迟,
      点后重启成员补全, 退格到空前缀关闭, dot 模式只在点后弹出, off 不请求). `key_$_ace_upstream_completion_trigger` 因此不设立.
- [x] **A5-7** ghost text 内联预览 (默认关, 验证门 G-A5-7): `Autocomplete.for(editor).inlineEnabled = enabled`;
      组合输入 (`compositionStart` 信号) 期间隐藏; `acceptCompletionOrInsertTab` (`:3827`) 优先接受内联预览;
      `ESC` 处理 (`handleEscapeKey`, `:3971`) 同时清除 ghost text.
      —— 验收: 开启后首选候选以灰色预览显示, TAB 接受, 输入继续时预览更新.
      进度 (2026-10-13): 开关为智能提示 JSON 的 `inlineCompletionPreview` (Kotlin 键 `key_$_ace_inline_completion_preview_enabled`,
      缺省 false), `applySmartHintOptions` 设置 `editor.completer.inlineEnabled`, 关闭时立即移除 ghost text. IME 组合输入期间
      (包装 `editor.onCompositionStart / onCompositionEnd`) 隐藏 ghost text, 并让 `$updateGhostText` 在组合中不重绘; TAB 走既有的
      `acceptCompletionOrInsertTab -> insertMatch`, 接受的就是被预览的行; ESC 经 `completer.detach()` 移除预览. 桥接执行式测试新增一例
      (缺省关闭, 开启后出现 `ace_ghost_text` 且不改文本, 组合中隐藏且不重绘, 组合结束恢复, TAB 接受, ESC 移除, 宿主关闭),
      去掉组合守卫的变异会被检出. jsdom 中新文档的 mode 异步加载会重新分词并冲掉 ghost token, 测试在 setText 后等 300 ms; 真机上
      mode 早已加载, 但输入后立即弹出补全的时序仍需 G-A5-7 复核. `AceEditorSmartHintPreferencesTest` 覆盖两个新键的缺省值与读取.
      结论 (2026-10-14): 随 G-A5-7 通过.
- [x] **G-A5-7** 6 台真机 Gboard + 中文输入法下开启 ghost text 输入 200 字符样例, 无重复字符 / 光标跳动 -> 维持默认关闭但开关可用;
      出现缺陷 -> 开关隐藏 (宿主不露出), 代码保留并记录.
      进度 (2026-10-14): 维护者在 XQ-AT72 上用 Gboard 与百度输入法做了 C11, 未发现重复字符或光标跳动; `AceImeReplayDeviceTest` 的
      `inlinePreviewHidesDuringCompositions` 在 5 台真机通过, 运行中发现组字结束后预览不恢复, 已修复 (A2-10 第 20 项 (d)). 修复改变了
      组字结束后的行为, 与 C4 一起复测后勾选; 开关维持默认关闭, 由宿主 A7-2 露出.
      结论 (2026-10-14): 通过, 维持默认关闭且开关可用. 构建 250 上维护者复测 C11 (XQ-AT72, WebView 145): 百度英文状态不组字, 预览正常
      显示; Gboard 组字中不显示预览, 点候选上屏时追加空格, 弹窗与预览随之关闭, 无重复字符或光标跳动. 其余真机由
      `AceImeReplayDeviceTest` 的 C11 用例覆盖 (5 台通过).
- [x] **A5-8** MarkerGroup 同名符号高亮 (默认开): `autojs6_lsp_client.js` 增加 `getDocumentHighlights(pos)` (TS 服务用
      `languageService.getDocumentHighlights`, Pyright / LuaLS 用 `textDocument/documentHighlight`); 桥接层在 `changeCursor`
      防抖 150 ms 后用 `ace.require("ace/marker_group").MarkerGroup` (随 ext-language_tools 提供) 绘制 `autojs6_symbol_highlight`
      标记, 选区变化或文档变更时清除; 超长行安全模式与只读无关 (只读也高亮); `autojs6.css` 增加亮/暗两套底色.
      —— 验收: JS/TS/Python/Lua 文档中光标落在标识符上时所有引用高亮, 移开后清除; `verifyAutoJs6LspRuntime` 增加 documentHighlight 用例.
      进度 (2026-10-13): LSP 核心声明 `documentHighlight` 客户端能力并增加 `textDocument/documentHighlight` 请求与结果规范化
      (`AutoJsAceLspCore.normalizeDocumentHighlights`, LSP kind 3 / 2 / 缺省 -> write / read / text); Python 与 Lua provider 增加
      `getDocumentHighlights`, TS 语言服务用 `getDocumentHighlights` (definition 与 writtenReference 记为 write), 经 TypeScript provider
      包装转发; LSP 客户端 `getDocumentHighlightsAsync` 按文档类型分发, JSON 与其他文档返回空. 未把它登记为宿主可见能力
      (`semanticCapabilities` 与 Kotlin 侧能力表不变). 打包的 Pyright worker 原本不处理该请求 (返回 -32601), 已在
      `tools/ace-lsp/python-worker/autojs6-python-worker.ts` 用 Pyright 自带的 `DocumentHighlightProvider` 增加处理并按固定提交重建:
      重建结果只有 worker 与 manifest 两个文件变化 (worker 增加 2280 字节), 语义资产合计 4.826 MiB (M4 时 4.822 MiB).
      注意: 新检出的 Pyright 树需要先在 `packages/pyright-internal` 执行 `npm ci --ignore-scripts`, 否则构建脚本在许可证汇总时找不到
      `vscode-jsonrpc` (根目录的 lerna postinstall 被 `--ignore-scripts` 跳过), 本次以 `--pyright-dir` 离线源码模式完成.
      桥接层 `installSymbolHighlights`: 光标停在标识符上 150 ms 后请求, 用 `ace/marker_group` 的 MarkerGroup 画 `autojs6_symbol_highlight`
      (写入处另加 `_write`), 文档变更, 换 mode, 非空选区, 长行安全模式与关闭开关时清除, 只读也高亮; 开关为智能提示 JSON 的
      `symbolHighlight` (Kotlin 键 `key_$_ace_symbol_highlight_enabled`, 缺省 true). 校验: `verifyAutoJs6LspRuntime` 断言 TS 对 `value`
      的三处高亮及种类; `verifyAutoJs6PythonWorker` 断言真实 Pyright 对参数 `name` 的两处高亮, 以及 provider 与客户端两层规范化;
      `verifyAutoJs6LuaLanguageServer` 在协议替身上断言往返与种类映射; 桥接执行式测试新增一例 (延迟, 编辑 / 选区清除, 标识符外不请求,
      只读, 关闭开关). 待真机目视验收 (亮 / 暗主题配色).
      修复 (2026-10-13): 5 台真机全套回归中 22120RN86C (WebView 111) 的 `AcePythonSemanticSmokeTest` 失败 (补全为空), 旧构建通过; 换回旧
      Pyright worker 仍失败, 关闭符号高亮则通过. 原因: 冷启动时 documentHighlight 请求排在 Pyright 首次分析之后, 耗时超过 1000 ms 的慢操作
      阈值, 两次即触发 `recordSemanticOperation` 的熔断, 语义服务被关闭, 之后的补全直接返回空. 现在高亮请求不计入熔断 (尽力而为),
      桥接层同一时间只保留一个在途高亮请求 (光标在等待期间移动时, 返回后按最新位置补发一次; 5 s 无回调则释放), 执行式测试新增一例.
      修复后该机 Python 用例两轮通过.
      结论 (2026-10-14): 维护者 V6 复测未发现问题 (Lua 的读写区分在 A2-10 第 18 项修复后可见).

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
- [x] **A6-2** ace.d.ts 类型检查接入 CI: `tools/ace-lsp/ace-bridge-typecheck/` 放 `tsconfig.json` (`allowJs`, `checkJs`, `noEmit`,
      `strict: false`, `types` 指向 A0-3 解压目录或固定的 `ace-builds` 声明副本), `autojs6/ace-private.d.ts` 补充桥接层使用的
      私有成员声明 (§2.3 列表); Gradle `typecheckAutoJs6AceBridge` 挂到 `check`; Node/TypeScript 的获取方式沿用 `build-python-worker.mjs`
      的固定版本策略 (不提交 node_modules).
      —— 验收: 首次全绿后, 人为引用一个不存在的 Ace 方法会使 `check` 失败.
      结论 (2026-10-13): 实现为 `tools/ace-lsp/typecheck-ace-bridge.mjs` (TypeScript 编译器 API, 不另放 tsconfig.json): TypeScript 6.0.3
      与 jsdom 一起由 `tools/ace-lsp/ace-bridge-test/package-lock.json` 固定, 安装逻辑抽到 `ace-bridge-test/dependencies.mjs` 供两个脚本
      共用; 声明取自 `fetch-ace-upstream.mjs` 解压的固定 tarball (`ace.d.ts` 及其引用); 私有声明放在
      `tools/ace-lsp/ace-bridge-typecheck/ace-private.d.ts` 而不是资产目录 (不进 APK). 检查 7 个直接驱动 Ace 的脚本 (桥接层, mode 补丁,
      5 个覆盖层脚本). JS 中 `var editor = null` 只在同一函数的控制流里按赋值推断, 其他函数里仍是 any, 因此给桥接层顶层的
      `editor / session / Range` 加了 JSDoc 类型; `editor.completer` 在声明中是 `Autocomplete | InlineAutocomplete`, 桥接层只用前者,
      新增 `popupCompleter()` 统一转换. 首轮 37 + 9 个错误的处理: 页面全局对象, 覆盖层 `ace.define` 内 require 的模块 ID, 上游声明缺少的
      `onResize`, `guttermousedown / click` 事件, `showWhitespacesInSelection` 选项, 以及桥接层有意使用的私有成员 (`$textLayer`,
      `$gutterLayer`, `$padding`, `$isMousePressed`, `$mouseHandler`, `onCompositionStart/End`, `$toggleFoldWidget`, `Document.$autoNewLine /
      _signal` 等) 写入私有声明; DOM 收窄, 历史分组上的扩展字段, `setNewLineMode` 参数与 `insertMatch(undefined)` 用 JSDoc 转换或显式参数,
      不改变行为. 变异验证: 把 `updateFull()` 改成 `updateFul()`, 把 `setTabSize` 改成 `setTabSizeX` 均报错. Gradle `typecheckAutoJs6AceBridge`
      已挂到 `check`; CI 只跑 `testDebugUnitTest`, 与 A6-1 / A6-3 相同, 由本地 `check` 覆盖.
      结论 (2026-10-14): 按验收标准 (变异会使 `check` 失败) 勾选; 与 A6-1 / A6-3 相同, 不进 CI, 由本地 `check` 与推送前预检覆盖.
- [x] **A6-3** 桥接层执行式测试: `tools/ace-lsp/verify-ace-bridge.mjs` 用 Node + jsdom (固定版本) 加载真实 ace.js, ext-language_tools,
      覆盖层与桥接层, 提供假的 `window.autojs` 记录调用; 用例至少覆盖: 初始化与 `notifyReady`, `setText/getState`, mode 路由,
      `foldAll/unfoldAll`, 撤销标记 (替换 A1-5 的 `@Ignore`), gutter 事件分发 (A3-1 四种 target), 覆盖层卸载上游监听 (A2-5),
      ActionMode 状态机 (A2-3), 触发映射 (A5-6). Gradle `verifyAutoJs6AceBridge` 挂到 `check`; 相应的字符串断言型 JVM 测试
      (`AceHistoryOperationBridgeTest`, `AceLanguageRoutingBridgeTest` 中可执行化的部分) 迁移后删除.
      —— 验收: `check` 包含该任务且通过; `@Ignore` 清零.
      结论 (2026-10-13): `tools/ace-lsp/verify-ace-bridge.mjs` 用 jsdom 26.1.0 (由 `tools/ace-lsp/ace-bridge-test/package-lock.json`
      固定, 按锁文件哈希 `npm ci --ignore-scripts` 到 `build/ace-bridge-test/`, 不提交 node_modules) 加载真实入口页, 假 `autojs` 记录全部调用.
      19 个用例: 启动与 `aceRuntime` 诊断, 覆盖层卸载上游监听与 ActionMode API, mode 路由 / 静态索引 / 只有 Lua 用 worker, 长行安全模式
      切换与恢复, mode 补丁 (Kotlin 片段, Java 关键字), setText / setTextDirty 只发最终光标与 refreshState, 历史标记 (含空增量不改文本),
      带标记的撤销 / 重做与回调顺序 (含换行符恢复), clean 书签与 dirty, 全部折叠 / 展开, 两种图标模式下的 gutter 点击, ActionMode 调用,
      A5 显示选项, 选区空白符, 滚动条拖动, 无 canvas 时退回原生滚动条, 补全弹窗加载 / 空结果. jsdom 无布局, 需要渲染的用例先给容器固定
      尺寸 (offset* 与 client* 都要, 桥接层的无参 `onResize` 读 client*). 三处变异 (实时补全显示空提示, 无参考线时仍高亮, 历史事件前不冲刷
      文本回调) 均被检出. Gradle `verifyAutoJs6AceBridge` 已挂到 `check`. `AceHistoryOperationBridgeTest` 删去 7 个已执行化的源码断言
      (保留 Kotlin 应答超时, 长行安全模式两项, 后者由 A6-4 处理), `AceLanguageRoutingBridgeTest` 删去 4 个, 保留 Kotlin 调用顺序检查;
      A1-5 未引入 `@Ignore`, 现为 0. 触发映射 (A5-6) 的用例随 A5-6 加入. 注意 CI 只跑 `testDebugUnitTest`, 不跑 `check`, 被删的源码
      断言在 CI 中不再有替代 (与 A6-1 相同的取舍, 本地 `check` 覆盖).
- [x] **A6-4** 超长行改用上游 MAX_LINE_LENGTH (验证门 G-A6-4): 安全模式下设置 `renderer.$textLayer.MAX_LINE_LENGTH = 4096`
      (与 `LONG_LINE_SAFETY_RENDER_LIMIT` 一致), 非安全模式恢复原型默认 10000; 删除 `installDocumentLongLineRenderGuard` (`:3164`)
      与 `$renderSimpleLine` 补丁; 保留 `applyDocumentAccessibilityLightweightMode`; 溢出按钮 (`ace_toggle_wrap`) 点击展开时的
      性能由 Ace 自身负责, 桥接层不再截断.
      —— 验收: `AceEditorTextLoadPolicy.ACE_UNSAFE_LINE_LENGTH` 不变; 执行式测试断言安全模式下文本层只渲染 4096 字符加按钮.
- [x] **G-A6-4** G8441 上加载 50 万字符单行样例: 首次渲染与滚动不触发 ANR, 替换文档耗时不劣于 1.4.12 守卫版 (A0 期间先测一次留档);
      不达标 -> 恢复守卫并记录.
      A6-4 实现 (2026-10-13): `applyLongLineRenderLimit` 在安全模式下设置 `textLayer.MAX_LINE_LENGTH = 4096`, 退出时删除实例属性回到原型
      默认 10000; `installDocumentLongLineRenderGuard` 与 `$renderSimpleLine` 补丁及 16 KiB 触发阈值已删除, `applyDocumentAccessibilityLightweightMode`
      保留. 行为差异: 截断提示由 "..." 变为上游按钮 "<click to see more...>" (`ace_toggle_wrap`), 安全模式下所有超过 4096 字符的行都截断
      (旧守卫只截断超过 16 KiB 的行). 触摸下覆盖层阻止了合成鼠标事件, 按钮点击无效 (不会切换自动换行); 外接鼠标点击会切换换行,
      上游的换行渲染同样在 MAX_LINE_LENGTH 处截断. 执行式测试新增一例 (安全模式 4096 字符加按钮, 退出后 10000 字符加按钮, aria-hidden 切换),
      `AceHistoryOperationBridgeTest` 删去对旧守卫源码的断言.
      测量 (2026-10-13, G8441, Chrome 126, 50 万字符单行, 每版 3 轮; A0 数据见 `build/ace-perf/a0-long-line.log`):
      | 构建 | 首次加载 ms | 全量渲染 ms | 滚动渲染最大 ms | 渲染字符 | 替换回调 ms | 替换可见 ms |
      |---|---|---|---|---|---|---|
      | A0 1.4.12 守卫版 | 263-270 | 10.3-10.4 | 11.4-11.6 | 4099 | 118-119 | 178-179 |
      | A5 1.44.0 + 自研守卫 | 269-275 | 11.3-11.7 | 13.1-13.4 | 4099 | 139-141 | 206-209 |
      | A6 1.44.0 + MAX_LINE_LENGTH | 269-276 | 11.7-12.0 | 13.6-14.0 | 4118 | 141-155 | 209-242 |
      结论: 无 ANR; 与带自研守卫的 1.44.0 构建相比 MAX_LINE_LENGTH 方案基本持平 (渲染差 1 ms 以内, A6 的首轮替换偏慢, 其余两轮
      141-147 / 209-214). 相对 1.4.12 替换慢约 20% (约 25-30 ms) 来自 Ace 1.44.0 本身, 恢复守卫不能改善 (A5 同样慢), 因此未按字面恢复守卫.
      按门的字面要求为不达标; 是否接受该差异 (计入 A8-3 / G-A8 的性能评估) 由维护者确认, 确认前不勾选.
      结论 (2026-10-14): 维护者接受相对 1.4.12 约 20% (25 - 30 ms) 的替换耗时差异 (来自 Ace 1.44.0 本身), 计入 G-A8 的性能评估;
      无 ANR, 保留 MAX_LINE_LENGTH 方案, 不恢复守卫.

## 11. A7 · 宿主设置联动 (跨仓库: AutoJs6)

- [x] **A7-1** 插件侧键名与默认值 (`AceEditorDisplayPreferences` / `AceEditorSmartHintPreferences`):
      `key_$_ace_svg_gutter_icons_enabled` (true), `key_$_ace_highlight_indent_guides_enabled` (true),
      `key_$_ace_custom_scrollbar_enabled` (true), `key_$_ace_whitespaces_in_selection_enabled` (true),
      `key_$_ace_symbol_highlight_enabled` (true), `key_$_ace_inline_completion_preview_enabled` (false),
      `key_$_ace_touch_magnifier_enabled` (false), `key_$_ace_upstream_completion_trigger` (由 G-A5-6 决定是否保留),
      `key_$_ace_scrollbar_auto_hide_enabled` (true, A2-10 新增);
      `AceBridge.kt` 对应 getter; `AceEditorLspPreferencesTest` 风格的 JVM 测试覆盖默认值与读取.
      —— 验收: 不改宿主时插件按默认值运行; 修改宿主 SharedPreferences 后 `notifyDisplayPreferencesChanged` 立即生效.
      进度 (2026-10-13): 视觉 4 项与放大镜已加入 `AceEditorDisplayPreferences` (键名与默认值同上, 另有 `DEFAULT_*` 常量),
      `AceBridge.kt` 有对应 getter, `notifyDisplayPreferencesChanged` 依次调用 5 个 `AutoJsAce.set*Enabled`;
      `AceEditorDisplayPreferencesTest` 覆盖缺省值, 读取与键名. 同名符号高亮, ghost text 与上游触发三个键随 A5-5 至 A5-8 加入.
      同名符号高亮键已随 A5-8 加入 `AceEditorSmartHintPreferences` (经 `getSmartHintOptions` JSON 下发, 宿主改动后由
      `notifyDisplayPreferencesChanged` 中的 `setSmartHintOptions` 重新应用).
      结论 (2026-10-14): 宿主未露出开关时插件按默认值运行 (各设备测试均如此); 22120RN86C 上从宿主设置页切换后立即生效 (见 A7-2).
      `key_$_ace_upstream_completion_trigger` 按 G-A5-6 不设立.
- [x] **A7-2** 宿主侧 (AutoJs6 仓库, 单独提交): `app/src/main/res/xml/fragment_code_editor_settings.xml` 在 "缩进参考线" (`:82`)
      所在分组后增加视觉 4 项, 滚动条自动隐藏 (A2-10) 与放大镜开关, 在智能提示分组 (`:183`) 增加 ghost text 与同名符号高亮;
      `bools.xml` 默认值与 A7-1 一致;
      10 种语言 `strings.xml` 标题 / 摘要 / 长按说明 (ASCII 标点); 变更时调用 `EditorPluginSession.notifyDisplayPreferencesChanged`.
      —— 验收: 宿主设置页可见并可切换, 切换后编辑器无需重启即生效; 宿主 `AceEditorPluginHostDeviceTest` 通过.
      进度 (2026-10-14): 宿主本地提交 b7df923aaa (AutoJs6 master, 未推送). 代码编辑器设置在 "缩进参考线" 后增加 "高亮当前缩进参考线",
      "自动换行" 后增加 "选区内显示空白符", "编辑器滚动条" 与 "自动隐藏滚动条", 智能提示分组增加 "同名符号高亮" 与 "补全内联预览",
      手势分组增加 "拖拽放大镜", 边栏标记分组增加 "矢量边栏图标" (仅 Ace 引擎可用); 10 种语言字符串, `bools.xml` 默认值与 A7-1 一致,
      8 个键列入 `EditorView` 的显示偏好键, 变更时经 `notifyDisplayPreferencesChanged` 转发; 宿主 changelog 只写 zh-Hans. 在 22120RN86C
      (宿主 debug, 插件构建 248 / 249) 上核对: 8 个开关可见, 全选后关闭 / 开启 "选区内显示空白符", 编辑器立即变化, 无需重启 (开启时
      原先要等选区变化, 已在插件修复, 见 A2-10 第 20 项 (e)); 开关已恢复默认值. 宿主 `AceEditorPluginHostDeviceTest` 7 项中 5 项通过,
      失败的两项与本改动无关, 待另查后勾选: `installedAceEditorConsumesHostSnapshotForProjectDiagnosticsAndDefinitionNavigation` 仍断言
      插件契约版本为 5 (宿主已是契约 7); `foldingMenuWorksThroughPluginContractInReadOnlyMode` 在 "全部折叠" 之后 "全部展开" 返回 false
      (换回今天改动之前的插件构建 243 同样失败; 宿主仓库当时另有构建占用文件, 未能加诊断输出复查).
      结论 (2026-10-14): 两项失败都是测试自身的问题, 已在宿主本地提交 8126740e0e 修正 (与本改动无关, 未改宿主代码): 折叠用例的诊断
      脚本调用 Ace 不存在的 `getFoldStyle()`, 未捕获的 TypeError 经 `window.onerror` 成为致命的 "Script error.", 宿主随即退回原生
      编辑器 ("全部展开" 因此找不到可折叠的编辑器); 项目诊断用例仍断言契约 5, 改为 `EditorPluginContract.VERSION`. 在 XQ-AT72 上
      另发现首帧主题用例只写入应用 context 夜间模式对应的主题键, AutoJs6 夜间模式与系统不一致时编辑页读另一个键, 改为同时设置
      统一, 亮色, 暗色三个键并恢复. 修正后 `AceEditorPluginHostDeviceTest` 7/7 在 XQ-AT72 (API 31, 插件构建 250) 与 22120RN86C
      (API 33, 插件构建 248) 通过.
- [x] **A7-3** `requiresHostVersion` 保持不变 (仅偏好键, 老宿主按默认值); README "功能" 段补充新开关说明 (10 语言经生成器).
      —— 验收: 旧宿主 (当前发布版) 安装 2.0.0 插件可正常使用.
      结论 (2026-10-14): `REQUIRED_HOST_VERSION_CODE` 与 master 相同 (5352), Editor 契约仍为 7. 维护者全部手测都在不含 A7-2 的宿主
      (c247cd5663) 上进行, 新开关按默认值生效. README 10 种语言经生成器更新 (提交 d163588): 功能列表增加 Ace 1.44.0 与移动端覆盖层,
      新开关及默认值; 语言表 TSX 语法改为支持并删去 Ace 1.4.12 的 TSX 说明; 构建一节增加 Ace 资产, 覆盖层, 桥接层与类型检查任务.
      插件语言能力模型的 TSX 语法同步改为 FULL (提交 710f323); 宿主的同名模型仍为 PARTIAL, 随配套 2.0.0 的宿主版本更新.

## 12. A8 · 回归, 性能, 文档与发布评估

- [x] **A8-1** JVM 与静态门: `:app:testDebugUnitTest :app:lintDebug :app:check` 全绿; `py D:/idea-projects/prepush_check.py AutoJs6-Plugin-Ace-Editor`
      通过 (见 `COMMON_AGENTS.md` "推送前检查").
      —— 验收: 命令输出留存在 `docs/development/release-2.0.0.md` 草稿.
      进度 (2026-10-13, HEAD 6899bc3): `:app:check` (含 lint 与全部 verify / typecheck 任务) 通过; `prepush_check.py --lint` 6/6 通过
      (VERSION_BUILD=225 与提交数一致). 发布文档草稿在合并时随 A8-8 写入.
      结论 (2026-10-14, HEAD 4db529f): JVM 测试 175 项全部通过; `lintDebug` 0 错误, 62 条警告; `:app:check` 通过, 11 个校验任务
      (Ace 资产锁, 覆盖层回放 558 项, 桥接层 jsdom 50 例, 类型检查 7 个脚本, LSP, 语言索引, Python worker, LuaLS, Java, Kotlin P2+)
      全部通过; 推送前预检 6/6. 首轮 check 中 `verifyAutoJs6PythonWorker` 失败: 为 A8-5 对照在同一工作区切到 master 再切回时,
      `core.autocrlf=true` 把 Python worker 资产转换为 CRLF, 字节数与清单不符 (Git 中的内容未变, 运行时不校验该哈希). 已在提交
      4db529f 把该目录设为 `-text` (与 LuaLS 相同) 并恢复字节, 复跑通过. 输出摘要写入发布文档草稿.
- [ ] **A8-2** 8 台设备 instrumentation: 对每个 serial 设置 `ANDROID_SERIAL` 运行 `:app:connectedDebugAndroidTest`
      (63751f63, 968e9f18, BH900ASK9E, QV710AF65F, QV770340J7, bek749scrwv4wo8h, emulator-5554, emulator-5556); 失败用例逐一归因,
      与 `MILESTONE_BASELINES.md` 已记录的系统级偶发 (G8441 `ADB-JDWP` SIGSEGV) 区分.
      —— 验收: 8/8 设备全部用例通过, 结果表进入发布文档.
      进度 (2026-10-13): 用 adb 直接 `am instrument` 跑全套 (与 `connectedDebugAndroidTest` 相同的用例集, 可逐台并行且不清 logcat):
      结果见 G-A3. 剩 XQ-DQ72 与两台模拟器.
      补跑 (2026-10-13): XQ-DQ72 与 x86 API 27 模拟器见 G-A3 补跑; x86_64 API 36.1 16 KB 模拟器此前已跑 G-A1 与触摸用例
      (A5 构建), 全套待该模拟器空出 (目前由 3-Maple Image 会话使用).
      补跑 (2026-10-13): x86_64 API 36.1 16 KB 模拟器全套见 G-A3. 至此 8 台的全套都已运行; 未通过的只有该模拟器上触摸用例的首次注入
      (旧版同样失败) 与此前记录的偶发项.
      补跑 (2026-10-14): 新增的 `AceManualCoverageDeviceTest` 与 `AceImeReplayDeviceTest` (共 22 项) 结果见 A8-4; 全套未重跑.
- [x] **A8-3** 性能复测: 三台基线真机各 3 轮 `measure-editor-performance.ps1 -SkipBuild -Iterations 3 -Serial 968e9f18,BH900ASK9E,QV710AF65F`,
      与 A0-2 基线逐项比较; 另在 OPD2413 与 22120RN86C 各取 3 轮作为参考 (不设门).
      —— 验收: 三项中位数相对 A0-2 不超过 +10% (功能优先档); 超出则在 G-A8 决策.
      结论 (2026-10-13): 三台基线机各 3 轮, WebView provider 与 A0 相同. 三项启动中位数相对 A0: 23046RP50C -6.0% / -5.5% / -7.7%,
      G8441 +3.9% / +4.7% / -4.4%, XQ-AT72 -1.5% / +0.5% / +0.7%, 均在 +10% 内; 明细见 `tools/ace-lsp/MILESTONE_BASELINES.md`
      "A8-3 启动性能复测". OPD2413 与 22120RN86C 的参考测量未做.
- [x] **A8-4** 手测清单: 附录 B 在 8 台设备, 附录 C 在 6 台真机 (Gboard + 一款中文输入法; 模拟器用 AOSP 键盘跑附录 C 的 1-6 项);
      记录为 "通过 / P1 / P2 / P3", P1 必须为 0.
      —— 验收: 清单表进入发布文档.
      进度 (2026-10-13): 逐项步骤, 期望, 1.4.12 参照与分级标准写在 `docs/development/ace-1.44.0-manual-tests.md` (附录 B 20 项,
      附录 C 12 项, 视觉与补全 10 项); 测试文件由 `tools/ace-mobile/manual/generate-fixtures.mjs` 生成, 新开关在宿主露出前用其中的
      `00-toggles.js` 切换 (写入宿主偏好, 重新打开文件生效). XQ-AT72 已就绪: 宿主换为含 Editor 契约 7 (宿主提交 515a92f2c1) 的构建,
      此前上午的宿主只支持契约 6, 打开文件会静默退回原生编辑器. 待维护者手测.
      进度 (2026-10-14): 维护者在 XQ-AT72 上完成附录 B, 附录 C (Gboard 与百度输入法) 与视觉项 V1 - V10, 问题在 A2-10 修复后复测未发现
      问题, 只剩百度 C4 (A2-10 第 19 项) 与组字后的内联预览 (第 20 项 (d)) 待复测; 结果表见手测指南第 6 节与
      `docs/development/ace-1.44.0-manual-tests-baidu-ime.md`. 按维护者决定, 其余设备的手动项改为设备自动化: `AceManualCoverageDeviceTest`
      (10 项, 附录 B 的触摸项与 V1 / V7 / V8 / V10) 与 `AceImeReplayDeviceTest` (12 项, 在输入连接上重放 Gboard, 百度与搜狗的调用,
      覆盖附录 C 第 1 - 5, 7, 8, 11, 12 项与选择模式方向键). 公共部分在 `AceDeviceTestHarness` (打开编辑器并写入宿主偏好, 等待语言服务
      空闲, 预热触摸注入, UiAutomation 触摸, 在输入连接线程上调用 IME 接口).
      | 设备 | API / WebView | 覆盖 (10) | IME 重放 (12) |
      |---|---|---|---|
      | OPD2413 | 35 / 136 | 通过 | 通过 |
      | 23046RP50C | 35 / 130 | 通过 | 通过 |
      | XQ-DQ72 | 33 / 153 | 通过 | 通过 |
      | 22120RN86C | 33 / 111 | 通过 | 通过 |
      | G8441 | 28 / Chrome 126 | 通过 | 通过 |
      | x86 模拟器 emulator-5560 | - / 83 | 通过 | 未跑完 (模拟器中途被收回) |
      | XQ-AT72 | 31 / 145 | 维护者手测 | 维护者手测 |
      x86 模拟器 emulator-5554 上测试进程多次 native 崩溃 (内存回收与 SIGTRAP), 属环境因素, 未计入. 稳定化中处理过的设备差异: 首次注入的
      触摸偶发丢失 (预热), 慢设备语言服务冷启动推迟长按计时 (先等服务空闲, 长按 1.5 s), 选择工具条与键盘是独立窗口会接走触摸 (操作前
      收起), 平板全面屏首行位于状态栏之下, 横屏 G8441 放大后行数很少.
      结论 (2026-10-14): 通过, P1 为 0. 百度 C4 与 C11 于构建 250 复测通过; 结果表写入发布文档草稿 `docs/development/release-2.0.0.md`.
- [x] **A8-5** 体积与对齐: 记录 release universal APK 与 5 个 ABI 变体大小, Ace 资产增量 (相对 1.32.0), `docs/16kb.md` 的
      16 KB 对齐检查通过, `verifySignedReleaseArtifacts` 通过.
      —— 验收: 数字写入发布文档与 `MILESTONE_BASELINES.md` "A 系列资产增量" 节.
      结论 (2026-10-14): 本分支 (`710f323`) 签名 release 与 1.32.0 (`f067e63`) 同机对照, 5 个 APK 均大 92,876 - 92,880 B (+0.5% 至 +0.6%),
      其中 Ace 官方文件 +62,215 B, 移动端覆盖层 +18,695 B, 桥接层等 +20,333 B (压缩后); `verifySignedReleaseArtifacts` 与 16 KB 对齐
      门禁通过. 明细见 `MILESTONE_BASELINES.md` "A8-5 体积与 16 KB 对齐" 与发布文档草稿. 对照中发现同一工作区先构建本分支再构建
      master 时, master 会打包遗留的生成声明资产 (+1.79 MB), 本分支的生成器已处理, 只影响本地构建.
- [ ] **A8-6** 文档与本地化: `.changelog/lang_*.json` 10 语言新增 `v2.0.0` (feature: Ace 1.44.0, TSX, 视觉与补全新能力;
      improvement: 移动端交互覆盖层; hint: 需要配套宿主版本露出新开关), `.readme/lang_*.json` 更新 Ace 版本, 语言表 TSX 行,
      新开关说明与构建命令; 运行 `.python/generate_markdown.bat` 后 `.python/check_markdown.bat`; `app/src/main/assets/doc/CHANGELOG*.md` 随生成更新.
      —— 验收: `markdown.yml` 等价检查本地通过; 不手工编辑生成文件.
      进度 (2026-10-14): README 已更新 (见 A7-3). 生成器要求 changelog 的最新版本等于 `VERSION_NAME`, 因此 v2.0.0 的 10 种语言条目
      先放在 `docs/development/release-2.0.0-changelog.json` (提示 1, 新增 6, 修复 4, 优化 12, 依赖 1), 合并时与 `VERSION_NAME=2.0.0`
      一起写入 `.changelog/lang_*.json`; 在临时副本中按 2.0.0 试生成并 `--check` 通过. 另修正了阿拉伯语, 法语与韩语 JSON 中残留的
      非 ASCII 标点 (提交 4bc635a).
- [x] **A8-7** 第三方声明: `THIRD_PARTY_NOTICES.md` "Ace" 段改为 1.44.0 (tarball, shasum, integrity, 许可证路径),
      新增 "AutoJs6 移动端覆盖层" 段落说明 A0-5 核实的来源; `tools/ace-lsp/README.md` 与 `MILESTONE_BASELINES.md` 路径与版本更新.
      —— 验收: 文档内 `1.4.12` 仅出现在历史记录语境.
      结论 (2026-10-14): `THIRD_PARTY_NOTICES.md` 的 Ace 段已为 1.44.0 (tarball, shasum, integrity, 许可证路径与 4 个项目维护文件), 移动端
      覆盖层段说明了来源; `tools/ace-lsp/README.md` 与 `MILESTONE_BASELINES.md` 的路径为 `ace-builds-1.44.0`. `git grep 1.4.12` 的其余
      结果都在历史记录 (M0 / M1 验收, 已发布的 changelog, `Roadmap.md` 加注), 与旧版的行为对照工具, 以及已签名字体目录的来源说明中.
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
逐项的操作步骤, 测试文件与分级标准见 `docs/development/ace-1.44.0-manual-tests.md`.

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

逐项的操作步骤与样例文本见 `docs/development/ace-1.44.0-manual-tests.md` 第 4 节.

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
