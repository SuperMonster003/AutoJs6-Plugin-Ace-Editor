# Ace 移动端定制重建 (A0-4 / A0-5)

`ace-builds-1.4.12/src-min-noconflict/ace.js` 不是官方 1.4.12, 而是一份带移动端定制的 Babel 重新打包构建.
本目录把其中的定制从压缩产物逐模块还原为可读源码, 作为 Ace 1.44.0 运行期覆盖层 (Roadmap-Ace-1.44.0.md A2)
的移植对照和审计依据. 这里的文件不会被编辑器加载, 也不会进入 APK.

## 文件

| 路径 | 作用 |
|---|---|
| `reconstructed/original/` | 从 Git 对象 `f067e63:app/src/main/assets/editor/ace-builds-1.4.12/src-min-noconflict/ace.js` (LF, 382,291 B, SHA-256 `709c4ae2...d79a`) 按字节切出的 19 个原始片段; `manifest.json` 记录偏移, 长度与 SHA-256 |
| `reconstructed/*.js` | 可读重建. 保持与原始片段相同的模块 ID 与行为, 包括原有缺陷 (见下文 "实际行为") |
| `extract-original-slices.mjs` | 重新生成 `original/` (默认读取 f067e63 的 Git 对象, 不依赖工作区文件) |
| `verify-reconstructed.mjs` | 等价性校验: 原始片段与重建源码在同一假环境中运行, 比对结果与调用轨迹 |
| `touch-harness.mjs` | 无浏览器的确定性触摸仿真环境 (假时钟, 假 DOM, 假编辑器) 与 43 个手势场景; A2 覆盖层复用它与 1.4.12 行为比对 |

```powershell
node tools/ace-mobile/verify-reconstructed.mjs
node tools/ace-mobile/extract-original-slices.mjs   # 仅在需要重新切片时
```

校验内容: 切片哈希 (旧 `ace.js` 仍在工作区时再按偏移复核); regression 5 种方法 x 3 组参数 x 300 组数据;
速度跟踪 200 组序列; 惯性滚动 120 组 (含飞轮分支与中途终止); 触摸处理 43 个场景的完整调用轨迹 (含放大镜 DOM 写入);
放大镜直接调用; 编辑器 ActionMode 5 个场景 (有无 `autojs` 两种); `getClientPosition` 12 组坐标.
2026-10-13 对重建源码做了 41 处单点变异 (常量, 比较符, 分支), 全部被校验检出.

## 定制清单

| # | 上游模块 | 定制 | 重建文件 | 原始片段 |
|---|---|---|---|---|
| 1 | `ace/mouse/touch_handler` | 整体替换: 单击, 双击, 长按, 光标/锚点拖拽, 滚动, 惯性, 双指 body zoom | `touch_handler.js` | `touch_handler.min.js` |
| 2 | 新增 `ace/mouse/magnifier.js` | 拖拽放大镜 (从未启用) | `magnifier.js` | `magnifier.min.js` |
| 3 | 新增 `ace/mouse/scroller.js` | AOSP OverScroller 样条 fling 移植 | `scroller.js` | `scroller.min.js` |
| 4 | 新增 `ace/mouse/velocity-tracker.js`, `ace/mouse/regression.js` | 100 ms 窗口最小二乘速度估计; regression-js; 全局 `Math.signum` | `velocity-tracker.js`, `regression.js` | 同名 `.min.js`, `babel-helpers.min.js` |
| 5 | `ace/editor` | ActionMode 状态机与 `autojs.startActionMode / finishActionMode` | `editor-action-mode.js` | `editor-*.min.js` |
| 6 | `ace/virtual_renderer` | `getClientPosition(pos)` | `virtual-renderer-get-client-position.js` | `virtual_renderer-get-client-position.min.js` |
| 7 | `ace/mouse/mouse_handler` | 把自身传给触摸处理; `magnifierEnabled` 选项; 移动端不注册 focusEditor | `minor-patches.js` | `mouse_handler-*.min.js` |
| 8 | `ace/mouse/default_handlers` | 移动端不注册 mousedown / dblclick / tripleclick / quadclick 默认处理 | `minor-patches.js` | `default_handlers-mobile.min.js` |
| 9 | `ace/keyboard/textinput` | `onContextMenu` 只 `preventDefault`, 不发 `nativecontextmenu`, 不移动 textarea | `minor-patches.js` | `textinput-context-menu.min.js` |
| 10 | `ace/mouse/default_gutter_handler` | 行号栏提示在 `touchscroll` 时也隐藏 | `minor-patches.js` | `default_gutter_handler-touchscroll-*.min.js` |
| 11 | `ace/lib/event` | 修饰键判定额外参考已按下未抬起的键码 16/17/18/224/91/92 | `minor-patches.js` | `event-modifier-hash.min.js` |
| 12 | `ace/virtual_renderer` CSS | 默认字体栈 (桥接层总会显式设置字体, 不可观察) | `minor-patches.js` | `virtual_renderer-font-stack.min.js` |

第 7 至 12 项是路线图 §2.2 初稿未列出的小定制, 由 A0-4 逐模块比对 (属性名, 字符串与数字字面量) 补齐.

## 实际行为 (与直观理解不同之处)

以下都是 1.4.12 用户实际体验到的行为, 重建源码按原样保留并加注释. A2 移植时默认保持一致, 若要修正需单独决策.

- 轻点必须在 100 ms 内抬起才算点击 (移动光标并唤起软键盘); 100 至 500 ms 的慢点不移动光标.
- 双击判定: 300 ms 内, 且上一次抬起点与本次按下点的 "手柄距离" < 2 (约 1.2 行高以内).
- 长按 500 ms. 判断是否落在选区内时, 多行选区只比较纵向范围, 单行选区再比较横向范围, 上下左右各留 8 px.
- 光标/锚点命中: 以光标下方 0.75 行处为中心, 按行高归一化的平方距离 < 3.5. 横向也用行高 (而非字符宽度) 归一化.
- 长按计时器在取消后不清空句柄, 所以从光标模式拖动后如果手指回到起点附近, 后续移动会被忽略.
- 惯性只有在某一步移动超过 8 px, 或按下时打断了正在进行的惯性时才会触发; 实际滚动中几乎总是满足.
- 速度跟踪写的是 "点数 >= 3 用二阶拟合", 但比较的是数组本身, 结果恒为一阶 (线性) 拟合;
  系数按 regression-js 默认精度四舍五入到 0.01 px/ms, 所以速度以 10 px/s 为步长. 最小惯性速度 50 px/s.
- 惯性动画: 摩擦 0.015, 固定 440 ppi, 纵向速度乘 2, 每 2 ms 一帧, 可越过内容末尾 200 px.
  `getCurrVelocity()` 读错字段名恒为 0, 所以 "飞轮" 加速从不生效.
- 惯性结束, 拖拽结束和双击后调用的 `startActionModeIfSelectionInView` 名为 "选区在视口内才启动",
  但条件 `top >= 0 || top <= 1` 对任何有限数都成立, 实际只要选区非空就在 200 ms 后启动 (仅滚动区域高度为 0 时不启动).
- `autojs.startActionMode` 收到的是按滚动区域高度归一化的分数 (left 0, right 1), 不是像素. `AceCodeEditor.kt` 的
  `isProbablyInvalidActionModeRect` 会把它判为无效, 改用最近一次文字触摸点, 上一个矩形或兜底矩形定位工具条.
- 无选区时 `startActionMode()` 发出 `hasSelection = false`, Kotlin 侧 `startSelectionActionMode` 直接结束 ActionMode,
  所以 "点在光标上弹出粘贴菜单" 在 AutoJs6 中不会出现.
- 构造函数里 "选区清空时结束 ActionMode" 的监听挂在 `changeSession` 上, 而首个会话在挂监听前已经设置, 桥接层又从不调用
  `setSession`, 所以该监听从未生效. 无选区 ActionMode 下每次文本变化都会直接调用 `autojs.finishActionMode()` 且不清状态.
- 触摸开始时检查的 `editor.popup` 从未被赋值 (补全弹窗在编辑器容器之外, 不会收到容器上的触摸), 实际只跳过行号栏.
- 行号栏只在 touchstart 被跳过; touchend 不检查目标, 会沿用上一次手势的模式 (例如上一次是滚动, 就会调用
  `startActionModeIfSelectionInView(false)`). 行号栏上的点击本身由浏览器合成的鼠标事件交给桥接层处理.
- 双指缩放通过 `document.body.style.zoom` 实现, 每次缩放后 `renderer.onResize()`; 桥接层已在 capture 阶段抢先处理双指.
- 放大镜: `magnifierEnabled` 默认 false 且无人设置, 仓库中也没有 `#magnifier` 样式; 代码用屏幕行去匹配按文档行编号的文本层单元格,
  有折叠或自动换行时会错位.

## 来源与许可证 (A0-5)

| 部分 | 来源 | 许可证 | 核实依据 |
|---|---|---|---|
| `regression.js` | regression-js 2.0.x (Tom Alexander), 经 Babel 转译 | MIT | 与 npm `regression@2.0.1` (shasum `8d29c3e8224a10850c35e337e85a8b2fac3b0c87`) 的 `dist/regression.js` 在 5,250 组输入上结果一致; 默认参数与方法集合相同 |
| `scroller.js` | AOSP `android.widget.OverScroller` / `Scroller` 样条 fling 的 JS 移植, 移植者未知 | 原算法 Apache-2.0 | `DECELERATION_RATE`, `INFLEXION`, `START_TENSION`, `END_TENSION`, `P1`, `P2`, `NB_SAMPLES`, `0.84` 物理系数与 AOSP 源码一致 |
| `velocity-tracker.js` | 未核实. 思路同 Android `VelocityTracker` 最小二乘策略, 实现为独立 JS | 未核实 | 未找到对应的公开 JS 实现 |
| 触摸处理, 放大镜, Editor ActionMode, `getClientPosition`, 第 7 至 12 项小定制 | 未核实. 线索指向 Auto.js Pro 的编辑器资产: AutoJs6 `docs/dev/autojs-pro-9-feature-comparison.md` 记录 Auto.js Pro 9 的编辑器为 "Ace 1.4.12" 并列出 "选区放大镜 (实验)", 与本构建的 magnifier 模块, `autojs` 桥接对象名以及速度跟踪器里名为 `kotlin` 的调试字段相符; 该文件于 AutoJs6 提交 f7845eb (2026-06-14 "Add ACE editor debug surface") 首次入库, 提交信息未注明来源 | 未核实 | Auto.js Pro 为闭源软件, 未找到授权说明; AutoJs4 (开源 Auto.js 4) 仓库历史中不存在该构建 |

本节是 THIRD_PARTY_NOTICES.md "AutoJs6 移动端覆盖层" 段落的草稿, 由 A8-7 正式提交. 来源未核实的部分是否继续以移植方式
保留, 还是改为仅依据上文行为描述重新实现, 需要维护者决定 (见 Roadmap-Ace-1.44.0.md A0-5 结论).
