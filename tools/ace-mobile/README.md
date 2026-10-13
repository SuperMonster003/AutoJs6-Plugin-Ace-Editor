# 移动端触摸覆盖层: 行为规格与校验 (A0-5 / A2)

Ace 1.44.0 升级前, AutoJs6 内置的是一份带移动端定制的 Ace 1.4.12 构建 (下称 "旧版"). 它的触摸手感是用户熟悉的,
但定制代码来源不明, 线索指向闭源的 Auto.js Pro (见下文 "来源与许可证"). 按维护者 2026-10-13 的决定, 覆盖层
(`app/src/main/assets/editor/ace-builds-1.44.0/autojs6/mobile/`) 是依据本文 "行为规格" 独立编写的实现, 不抄录旧版代码;
工作区也不再保存旧版代码的抄录. 与旧版的一致性只通过行为比对确认: 校验时从 Git 历史 (提交 f067e63 的旧 `ace.js`)
按偏移切出旧版片段, 与覆盖层放进同一个假环境, 比较两者的调用轨迹与数值.

## 文件

| 路径 | 作用 |
|---|---|
| `legacy-slices.json` | 旧版各项定制在 f067e63 `ace.js` (LF, 382,291 B, SHA-256 `709c4ae2...d79a`) 中的偏移, 长度与 SHA-256; 只有元数据, 不含代码 |
| `legacy-oracle.mjs` | 校验时用 `git show` 读出旧 `ace.js`, 核对哈希后按偏移切片, 缓存在 `build/ace-mobile/legacy/` (不入库), 作为行为参照 |
| `touch-harness.mjs` | 无浏览器的确定性触摸仿真环境 (假时钟, 假 DOM, 假编辑器), 45 个手势场景与 5 个 ActionMode 场景 |
| `verify-overlay.mjs` | 覆盖层与旧版的比对 (Gradle `verifyAutoJs6AceMobileOverlay`, 挂在 `check` 上) |
| `device-records/` | 真机触摸用例 (`AceTouchInteractionDeviceTest`) 的逐场景记录: `a0-1.4.12-*` 为旧版, `a2-1.44.0-*` 为覆盖层 |
| `manual/` | 手测文件生成器与新开关的切换脚本, 用法见 `docs/development/ace-1.44.0-manual-tests.md` |

```powershell
node tools/ace-mobile/verify-overlay.mjs
```

比对内容: 惯性滚动 120 组 fling (含中途终止); 速度跟踪 200 组样本序列; 45 个手势场景的完整调用轨迹 (DOM 写入与
`renderer.onResize` 除外, 只有下文 "有意差异" 中的一项不同); 5 个 ActionMode 场景 (有无宿主对象两种); `getClientPosition`
12 组坐标; 另有取消语义与自定义滚动条的单独断言. 需要包含 f067e63 的 Git 历史; 浅克隆中无法运行 (CI 不运行该任务).

## 旧版定制清单 (只描述行为)

| # | 上游模块 | 旧版的改动 |
|---|---|---|
| 1 | `ace/mouse/touch_handler` | 整体替换: 单击, 双击, 长按, 光标 / 锚点拖拽, 滚动, 惯性, 双指缩放 |
| 2 | 新增放大镜模块 | 拖拽放大镜 (从未启用) |
| 3 | 新增惯性模块 | Android 样条 fling |
| 4 | 新增速度跟踪模块 | 100 ms 窗口最小二乘速度估计 (内含 regression-js) |
| 5 | `ace/editor` | ActionMode 状态与 `autojs.startActionMode / finishActionMode` 调用 |
| 6 | `ace/virtual_renderer` | `getClientPosition(pos)` |
| 7 | `ace/mouse/mouse_handler` | 把自身传给触摸处理; `magnifierEnabled` 选项; 移动端不注册 focusEditor |
| 8 | `ace/mouse/default_handlers` | 移动端不注册 mousedown / dblclick / tripleclick / quadclick 默认处理 |
| 9 | `ace/keyboard/textinput` | `onContextMenu` 只 `preventDefault`, 不发 `nativecontextmenu`, 不移动 textarea |
| 10 | `ace/mouse/default_gutter_handler` | 行号栏提示在 `touchscroll` 时也隐藏 |
| 11 | `ace/lib/event` | 修饰键判定额外参考已按下未抬起的键码 16 / 17 / 18 / 224 / 91 / 92 |
| 12 | `ace/virtual_renderer` CSS | 默认字体栈 (桥接层总会显式设置字体, 不可观察) |

覆盖层对第 1 至 6, 9, 10 项按下文规格实现; 第 7, 8 项由卸载上游触摸监听代替; 第 11, 12 项不可观察或不再需要.

## 行为规格

覆盖层按以下规格实现. 其中一部分在直观上像缺陷, 但这是用户一直以来体验到的行为, 为保持习惯而保留; 若要修正需单独决策.

点击与长按:
- 轻点必须在 100 ms 内抬起才算点击 (移动光标并唤起软键盘); 100 至 500 ms 的慢点不移动光标.
- 双击: 300 ms 内, 且上一次抬起点与本次按下点的 "手柄距离" < 2 (约 1.2 行高以内); 选中该处的单词, 光标落在离手指近的一端.
- 长按 500 ms: 落在选区内则只进入 "长按滚动" (不改选区), 否则选中该处单词; 两种情况都请求 ActionMode 并触发长按反馈.
  判断是否落在选区内时, 多行选区只比较纵向范围, 单行选区再比较横向范围, 上下左右各留 8 px.
- 长按计时器在取消后不清空句柄, 所以从光标模式拖动后如果手指回到起点附近, 后续移动会被忽略.

拖拽与滚动:
- 光标 / 锚点命中: 以光标下方 0.75 行处为中心, 按行高归一化的平方距离 < 3.5 (横向也用行高归一化); 两者都命中时取更近者.
- 拖拽光标或锚点时让目标位置左右多露出 5 列; 其他单指触摸为滚动, 可越过内容末尾 200 px.
- 惯性只有在某一步移动超过 8 px, 或按下时打断了正在进行的惯性时才会触发; 实际滚动中几乎总是满足.
- 速度: 最近 100 ms 内样本的一阶最小二乘拟合, 斜率四舍五入到 0.01 px/ms (所以速度以 10 px/s 为步长); 只保留占优的轴,
  最小惯性速度 50 px/s.
- 惯性动画: Android 样条 fling, 摩擦 0.015, 固定 440 ppi, 纵向速度乘 2, 每 2 ms 一帧, 无 "飞轮" 加速.

ActionMode (宿主的选择工具条):
- 触摸开始与移动时请求结束 ActionMode. 惯性结束, 拖拽结束和双击后调用 `startActionModeIfSelectionInView`: 200 ms 后若选区
  非空就启动; 名字中的 "在视口内" 判断对任何有限数都成立, 实际只在滚动区域高度为 0 时不启动.
- `autojs.startActionMode` 收到的是按滚动区域高度归一化的分数 (left 0, right 1), 不是像素. `AceCodeEditor.kt` 的
  `isProbablyInvalidActionModeRect` 会把它判为无效, 改用最近一次文字触摸点, 上一个矩形或兜底矩形定位工具条.
- 无选区时 `startActionMode()` 发出 `hasSelection = false`, Kotlin 侧 `startSelectionActionMode` 直接结束 ActionMode,
  所以 "点在光标上弹出粘贴菜单" 在 AutoJs6 中不会出现.
- "选区清空时结束 ActionMode" 只跟随之后设置的会话, 安装时已有的会话不被监听 (桥接层从不调用 `setSession`, 所以实际不生效).
  无选区 ActionMode 下每次文本变化都会直接调用 `autojs.finishActionMode()` 且不清状态.

其他:
- 行号栏只在 touchstart 被跳过; touchend 不检查目标, 会沿用上一次手势的模式 (例如上一次是滚动, 就会调用
  `startActionModeIfSelectionInView(false)`). 行号栏上的点击本身由浏览器合成的鼠标事件交给桥接层处理.
- 双指缩放由桥接层在 capture 阶段处理; 覆盖层只记录 "缩放" 模式并在抬起时复位.
- 放大镜默认关闭, 由宿主设置开启; 覆盖层的放大镜按屏幕行定位 (含折叠与自动换行), 自绘选区, 首次显示时才创建 DOM.

## 覆盖层与旧版的有意差异 (A2 / A5)

以下差异是有意的, `verify-overlay.mjs` 单独断言:

- 补全弹窗标志: 旧版在触摸开始时检查从未赋值的 `editor.popup`; 覆盖层不检查 (比对中唯一的预期差异 "B11").
- 取消: 宿主的 `cancelAceMobileTouchInteraction(reason)` 只对 `dom_touchcancel`, `window_blur`, `pinch_zoom_begin`,
  `pinch_action_mode` 生效 (清长按计时, 停惯性, 隐藏放大镜, 保留手势模式); 旧版的触摸处理器收不到这些取消.
- 自定义滚动条 (A5-3): 开启 Ace 的 `customScrollbar` 后, 落在滚动条上的单指触摸进入 "scrollbar" 模式: 按在滑块上拖动滑块,
  按在轨道其他位置先让滑块中心跳到手指处; 不移动光标, 不触发长按与惯性, 抬起时与滚动结束一样调用
  `startActionModeIfSelectionInView(false)`. Ace 的滚动条只监听鼠标事件, 而覆盖层阻止了 touchstart 的默认行为,
  浏览器不会再合成鼠标事件, 所以由覆盖层代为拖动. 尚未渲染 (没有滑块几何) 的滚动条按普通滚动处理. 关闭该选项时行为与旧版相同.

## 来源与许可证 (A0-5)

| 覆盖层部分 | 来源 | 许可证 |
|---|---|---|
| 惯性滚动 `autojs6_mobile_scroller.js` | 依据 AOSP `android.widget.Scroller` 的样条 fling 编写 (常量 `DECELERATION_RATE`, `INFLEXION`, `START_TENSION`, `END_TENSION`, 100 个样本, `0.84` 物理系数与之相同) | Apache-2.0 (AOSP) |
| 速度跟踪的最小二乘求解 | 按 regression-js 2.0 (Tom Alexander) 的高斯消元写法, 以便舍入结果逐位一致 | MIT |
| 触摸手势, ActionMode, `getClientPosition`, 放大镜, 安装器 | AutoJs6 依据本文行为规格独立编写 | 随本项目 |

旧版代码不在工作区: 其中 regression-js 为 MIT, 样条 fling 源自 AOSP, 其余定制来源未能核实, 线索指向 Auto.js Pro 的编辑器资产
(AutoJs6 `docs/dev/autojs-pro-9-feature-comparison.md` 记录 Auto.js Pro 9 的编辑器为 "Ace 1.4.12" 并列出 "选区放大镜 (实验)";
该构建于 AutoJs6 提交 f7845eb 首次入库, 提交信息未注明来源). Auto.js Pro 为闭源软件, 未找到授权说明. 插件历史版本曾随 APK
分发该构建, Git 历史中仍保留当时的 `ace.js`; `legacy-oracle.mjs` 只在校验时读取它用于行为比对, 不复制到工作区或 APK.

本节是 THIRD_PARTY_NOTICES.md 相应段落的依据.
