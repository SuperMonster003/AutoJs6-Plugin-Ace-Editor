# Compose TSX declarations and editor checks

Ace Editor 1.23.0/build 125 integrates declarations 4.31.0 for the matching local
AutoJs6 F.1 host, build 5319. The editor's TypeScript runtime remains 6.0.3. This
record covers declaration and browser language-service checks; Android execution
and final plugin packaging are covered by the coordinated host acceptance run.
No public distribution is implied.

The handwritten JSX declaration mirror adds 29 generated `compose:Name` tags,
each using the existing exact `Internal.ComposeProps<Name>`. Real factory tags
such as `<compose.Column>`, `$compose` and factory aliases use the unchanged
ordinary P6 signatures. Snackbar is a session command and has no JSX tag. The
host catalog gate now checks the explicit JSX region as well as the original
30-component / 114-property API and Markdown regions.

Both JSX declaration copies have SHA-256
`440744713f67fa1c4a5329a13992b657692e95115ae3c8be53447ad04ceb661f`.
The existing XML intrinsic map is preserved. `ElementChildrenAttribute` checks
Compose children while a compiler-only opaque carrier preserves nested XML.
The ambient classic emit hook declarations do not change tag-specific prop
checking or add script-callable component APIs.

`tools/ace-lsp/verify-runtime.mjs` now exercises `.tsx` documents in the actual
Rhino profile with the generated declaration groups and browser service. The
whole verifier, including the existing language/runtime checks, passes. The new
checks have these results in both default core and fully enabled optional-group
configurations:

| Check | Result |
| --- | --- |
| Value tags, aliases, namespace tags, callbacks with typed `this`, slots and fragments | 0 diagnostics |
| Existing lower-case XML intrinsic tags | All 36 retained |
| Invalid props, missing required inputs, callbacks, children, unknown components and XML attrs | All 17 categories diagnosed |
| `<compose.TextField>` attributes | `text`, `onValueChange`, `keyboardType`, `label` and `ref` completed |
| `<compose:TextField>` attributes | Current TypeScript 6.0.3 completion limitation; diagnostics remain accurate |

The namespace completion limitation was independently reproduced using the raw
TypeScript language service: at that attribute position it returns globals
instead of properties. The verifier reports the condition without requiring
future compiler versions to preserve it. Recommend `<compose.Name>` for full
attribute completion. Namespace syntax remains supported, accurately checked and
compiled. No bundled TypeScript modification or heuristic fallback is included.

The shared global JSX expression type remains the historical implicit `any`.
Declaring it to be a Compose node would incorrectly label XML expressions; an
XML-only type would reject Compose factories and mounting. Runtime checks still
own mixed-domain content, fragment root count and unregistered function tags.
Under the editor's normal strict profile, a single JSX expression can bypass a
leaf's optional `never` child type. Exact optional properties reject this one
case, but enabling that compiler option is not required by this change and the
ordinary P6 factory API is unchanged. Plain numeric/`true` children and text in a
Text leaf are diagnosed by the normal profile.

The declarations repository's `tools/verify-compose-tsx.mjs` also passed against
real TypeScript 5.1.3 and this bundled 6.0.3. It checks 25 expected errors, actual
classic emit, the old XML-only `JSX.Element` incompatibility and the explicit
strict/exact boundary. The existing ordinary Compose smoke passed in both modes;
the separate exact-nullish smoke also passed on both compilers.

The authoritative `generateAutoJs6LspDeclarations` and
`verifyAutoJs6LspRuntime` tasks passed, followed by the complete JVM, debug APK
and native alignment gates. The local run is recorded in
`app/build/compose-f1-build.log`. The browser verifier reads generated outputs;
its TSX checks do not inject substitute Compose types. Native optional-group
defaults, plugin identity and the existing `releases/` contents are outside this
change.

The final local declaration publication uses declaration source commit
`3213fb08f9ee6e26aa3f9f283c61a49f286684ae` and host input
`b67d668f485494f246d557c51c7f06833fb0b53c`. After publishing the generated host and
library declarations, both authoritative declaration tasks and the debug/native
gates passed again (`app/build/compose-f1-published-types.log`). The curated index
and Ace-specific package publishing options remain intact.
