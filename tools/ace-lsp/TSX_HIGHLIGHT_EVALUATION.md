# Ace 1.4.12 TSX 高亮评估

评估日期：2026-08-31  
对应路线图：`Roadmap.md` M0-3

## 结论

`.tsx` 已按 M0 基线进入 `ace/mode/typescript`，TypeScript 关键字、标识符、括号和
运算符均能着色；但 Ace 1.4.12 的 TypeScript mode 会显式关闭继承自 JavaScript
规则的 JSX tag 状态，因此 `<Button title={answer} />` 被分解成运算符和普通标识符，
不会得到 `meta.tag.*.xml` / `entity.other.attribute-name.xml` 这类 tag-aware token。

这不是路由失效：三台真机均确认 `session.getMode().$id` 为
`ace/mode/typescript`，且 token 序列稳定。它是上游 1.4.12 TypeScript 高亮规则的
能力边界。

## 样例证据

输入：

```tsx
const view = <Button title={answer} />;
```

关键 token：

```text
storage.type(const)
identifier(view)
keyword.operator(=)
keyword.operator(<)
identifier(Button)
identifier(title)
paren.lparen({)
identifier(answer)
paren.rparen(})
keyword.operator(/>)
```

## 已评估选项

1. 全局强制 TypeScript mode 开启 JSX 规则：不采用。它会同时影响普通 `.ts`，并
   可能把泛型/类型断言中的 `<T>` 误判成 JSX。
2. 将 `.tsx` 路由为 `ace/mode/jsx`：不采用。虽然 tag token 更准确，但会丢失
   TypeScript 专属关键字/类型规则，也违反“高亮与 TS 语义同族”的基线。
3. 增加独立的 TSX mode：作为非阻塞后续 `TSX-HL-1`。实现时应从受控上游版本
   移植 TSX 规则或创建仅对 `.tsx` 启用 JSX 的 TypeScript Mode 子类；必须同时回归
   `.ts` 泛型、`.tsx` tag、资源体积和 Ace 1.4.12 兼容性。

M0 保留既定基线 `.tsx → ace/mode/typescript`，接受“TS 语法
高亮存在、JSX tag 无专属颜色”的已知限制。`TSX-HL-1` 不阻塞 Python / Lua /
Java / Kotlin 主线。

## 可重复验证

真机用例：

`AceLanguageRoutingSmokeTest.documentPathSelectsModeAndIsolatesJavaScriptCompletions`

用例会输出 `AUTOJS6_ACE_TSX_BASELINE=` token 记录，并断言 TSX 至少仍保有
TypeScript mode 的 `const`、`Button` 与 `<` 基线 token。
