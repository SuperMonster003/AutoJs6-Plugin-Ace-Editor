# Compose F2 declarations and editor acceptance

Ace Editor 1.26.0 integrates declarations 4.33.0 from exact commit
`26dcf6cd6d4d175c179b49474d9b9ffc28939690`. The F2 branch was moved to committed
Ace baseline `c5d77a5f3decb40a44d1e64604638013bbb455a6`, preserving its smart hint
and signature-help changes, colors/terminal declarations and all existing
release history. The previous Ace working directory was not modified.

The F2 API includes `compose.attach`, AndroidView with a required actual View
or synchronous `(context) => View` factory, a View getter, both Compose tag forms
and the empty XML `<compose>` container. Factories reject Promises and primitive
results even when optional native declaration groups are disabled. The frozen
V1 30-component / 114-property catalog and 29-tag JSX region remain unchanged;
the AndroidView declaration and JSX entries use a separately exported and
checked interop region. No bundled TypeScript patch or new default native group
is introduced.

The public XML TSX `onClick` declaration was corrected to match the host's
NativeView listener path: the clicked View is its argument, and a normal
function receives the native EventEmitter as `this`. The actual F2 shape
`factory(context) => ui.inflate(<button onClick={...} />)` is checked. This does
not enable function attributes in E4X or XML strings, nor make native View events
follow Compose node dispatch rules.

Before the final Publish refresh, the complete browser verifier passed on the
new baseline, including its existing language checks and smart-hint/signature
regressions. The F2 checks passed in both default and complete optional-group
configurations: 30 invalid-input categories were diagnosed, valid scripts had
zero diagnostics, AndroidView attributes completed, and current colors/terminal
completion remained available. The F1 verifier retained all 36 XML tags and its
17 invalid-input categories. The authority run in
`build/compose-f2-authority.log` also completed language-index verification,
LSP runtime verification and JVM tests successfully.

The final normal `aj6dts -Publish` refresh used clean host commit
`d54f21b1ea408dfcb66e58f663d71d2f10fade8a` with the appDebug/ace profile. It selected
488/10769 main, 20/20 resource and 788/27239 library classes. Main, resources and
libraries match the published declaration files byte-for-byte; their exact
hashes and source identity are in `types/autojs6/BUNDLED_DECLARATIONS.md`.
The ignored workflow provenance records that host commit and passed TypeScript
validation. Its schema has no dirty bit, so source cleanliness was separately
verified with Git.

Audit of `android/org.nativescript.widgets.d.ts` found byte-identical content
in the declaration source and the existing Ace Git blob; its copy did not
introduce a semantic change. Current handwritten colors, init and terminal
content is preserved. The curated index and optional-group defaults remain in
place; the full source package index is not substituted.

Against the final published graph, real TypeScript 5.1.3 and bundled 6.0.3 both
passed the F1 25 and F2 31 expected-error fixtures with zero unexpected
diagnostics. Existing P6 tests passed in normal strict and exact-optional modes.
The targeted Compose declaration body also had zero semantic diagnostics with
`skipLibCheck=false`. These results and the reproducible compiler entry point
are recorded in the declaration source's `docs/compose-interop-acceptance.md`.
After the Publish refresh, the final authority gate completed generation, the
full real browser verifier, debug assembly, debug lint, five signed release APKs
and their native-alignment checks (6m 25s). Both declaration configurations still
pass the 30 F2 invalid categories and all prior language, smart-hint and signature
checks. The earlier complete JVM run has 171 passes; no Kotlin implementation or
JVM test changed after that run. Debug lint reports zero errors and 49 warnings
in existing dependency, resource and Android implementation locations. The 25
localized documentation products and 15 Icon Studio resources pass freshness.

The final universal artifact is
`autojs6-plugin-ace-editor-v1.26.0-universal-d0432323.apk`, 18482688 bytes, SHA-256
`56919e9672197516a0b3d850e83acb78a57211a91fe4bc02967fc5525bf0c9e4`.
Ignored final output is `build/compose-f2-final-gate.log`. This gate is local and
does not include installing the Ace editor on a device or remote publication.

The fresh Windows checkout exposed a separate deterministic-index issue:
`core.autocrlf=true` converted all four static language-index JavaScript files to
CRLF while their strict generator compares LF output byte-for-byte. Only a
portable `text eol=lf` rule for those generated indices was added; the checkout
was normalized to the existing Git blobs. All four strict Node `--check`
results then passed. The generator, freshness comparison and Python API facts
were not changed.

The global JSX expression result still has its historical implicit-any boundary.
Unloaded native groups retain opaque object types, so actual View identity,
container ownership, parents and fragment cardinality still require runtime
validation. This declaration and language-service record does not substitute
for Android runtime/device evidence and does not imply a public release.
