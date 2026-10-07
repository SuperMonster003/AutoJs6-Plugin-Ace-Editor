# Compose F3 dialog declarations

The local F3 editor changes target Ace 1.28.0 and AutoJs6 declarations 4.34.0
from exact source commit `4512f0ef4a051c8286bd7a19cd3cd7f2d8cf50e6`.
They build on merge commit `19420767db4053956d607a696265b38b52989e0d`, which joins
the existing F2 integration with editor baseline
`e75884b3b80cad043c052d9fa2a687546c030e17`. The merge retained both branches'
1.26.0 history, later smart-hint changes and overload behavior. Its committed
version is 1.27.0/build 140; F3 is prepared separately as build 141.

The API adds `compose.dialog(root, options?)`, returning the existing
`ComposeSession`. `ComposeDialogOptions` exposes only `type`, `cancelable` and
`theme`; `ComposeDialogType` is `'alert' | 'bottomSheet'`. It accepts the same
synchronous root/render input as other mounts, including TSX roots and
AndroidView content. It adds no component factory or JSX intrinsic entry and
does not alter the frozen V1 or F2 catalog projections.

Whole options may be omitted, null or undefined. `type` and `cancelable` default
only when absent; explicit null/undefined remain invalid runtime inputs. The
existing editor strict profile cannot statically distinguish absence from an
explicit undefined optional property. The exact-optional compiler fixture does
reject both cases, and the editor verifier records this precision boundary
instead of weakening the runtime contract. Theme retains existing mount
inheritance and replacement rules.

The plugin presentation deliberately uses a real Compose `Dialog` for both
window forms. Its bottom sheet uses Material 3 1.4.0 `BottomSheetScaffold`, public
`SheetState` APIs and a scrim inside that dialog. It does not invoke the original
`ModalBottomSheet` composable, whose private window cannot receive the required
overlay type before showing through the locked version's public API. The
scaffold is a presentation detail, not a hidden V1 node or Snackbar command
target. Scripts still provide their own Scaffold/default Snackbar host when
using `session.showSnackbar`.

The final `aj6dts -Publish` step used clean host commit
`8cba2ce0e3aad5835879b0b91604caec9cb719b1`, appDebug/ace profile and generator
commit `525bebdaa157087b1295d80cef0dae861152eda5`. It selected 489/10834 main,
20/20 resource and 788/27242 library classes. The ignored workflow provenance
names this exact host and isolated Ace destination and records passed TypeScript
validation. It has no dirty-state field; host cleanliness was independently
checked at that commit. Main/resources/libraries match the published source
byte-for-byte, and the library output is unchanged from F2. Exact input hashes
are recorded in `types/autojs6/BUNDLED_DECLARATIONS.md`.

Against that final graph, real TypeScript 5.1.3 and bundled 6.0.3 pass the F1 25,
F2 31 and new F3 22 expected-error cases with no unexpected diagnostics. P6 API
tests pass in normal strict and exact-optional modes, and the targeted Compose
declaration body has zero semantic diagnostics with `skipLibCheck=false`.
The declaration source records this in `docs/compose-dialog-acceptance.md`.

The complete Ace browser verifier passed before the final generated-input
refresh, including merged smart-hint/overload checks, existing language checks
and F3 tests in both default and full optional-native configurations.
Each F3 profile verifies 18 invalid-input categories, valid Session behavior,
dialog member and option completion, and the strict/exact undefined boundary.
The local log is `build/compose-f3-ace-verify.log`.

The ten language 1.28.0 changelog entries and 25 generated documents pass their
read-only freshness check; prior history is retained. No bundled compiler,
default optional-group setting, renderer dependency version or original Ace
working directory is changed by this declaration work.

After the actual Publish refresh, the final authority run completed declaration
generation, the complete real browser verifier, all 171 JVM tests, debug assembly,
debug lint and five signed release APKs with native-alignment verification.
The 18 F3 invalid categories pass in both configurations alongside all prior
language, smart-hint, overload, colors/terminal and F1/F2 checks. Debug lint has
zero errors and 49 existing warnings. The log is `build/compose-f3-final-gate.log`
(6m 12s); no Android device installation of Ace is claimed.

The final universal artifact is
`autojs6-plugin-ace-editor-v1.28.0-universal-88a3c5fb.apk`, 18514128 bytes, SHA-256
`3ece1338a6399321308911eb29814a3b3487fae81abfc9cebe2adbde191ad0a5`.
This record does not imply npm publication or a public release.

The final metadata refresh preserves Ace's existing package publishConfig while
retaining the imported 4.34.0 version; it changes no declaration or runtime code.
The signed gate was rerun for that asset in `build/compose-f3-final-package-metadata.log`.
