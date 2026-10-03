# Compose UI V1 declarations

Ace Editor1.22.0/build124 integrates AutoJs6 declarations4.30.0, source commit
43b29d7. The paired local host is6.8.0/build5317, with generated Java/API inputs
from commitd29eb47782. The normal local aj6dts -Publish process regenerated and
mirrored main/resources/libraries; hand-maintained Compose/init declarations were
synchronized separately. The curated index adds only the Compose reference.
Default optional-group enablement, plugin identity and native runtimes are unchanged.

The final Compose declaration SHA-256 is
b71832f8b4a62a386934555c2aa3f8dadc118b36bad50b7553b804ed98ac5d6a.
Its catalog region matches the actual V1 export and documentation:30 entries and
114 canonical properties. The API includes29 node factories, typed properties,
events, state/ref/modifiers/themes and UI/floating sessions; Snackbar is a command.

Validation uses generated runtime groups, the actual bundled TypeScript6.0.3 and
the real browser language-service adapter. The regular verify-runtime.mjs now
checks Compose in both default core+extra and fully enabled declaration contexts,
including property completion, event signatures, valid inputs and seven invalid
input categories. It verifies native Bitmap/ImageWrapper/ThemeColor assignability
when native groups are enabled. The new regression joins18 existing verifier groups.

The declaration package also supplies39 strict negative cases and2 additional
exactOptionalPropertyTypes cases under TypeScript5.1.3. The declaration's own
semantic diagnostics are zero without skipping that file. Missing optional native
types remain opaque objects instead of contaminating image/color input types with
error-any; complete native members still require the existing optional groups.

generateAutoJs6LspDeclarations and verifyAutoJs6LspRuntime pass. JVM171 tests in32
classes pass without failure/error/skip; debug APK assembly and16 KB native alignment
pass. The updated10-language changelog and25 generated documents are consistent.
No native dependency, runtime implementation, release-folder contents or user data
was changed. The pre-existing untracked releases directory is left untouched.
All changes remain local; no Git push or npm/public release was performed.
