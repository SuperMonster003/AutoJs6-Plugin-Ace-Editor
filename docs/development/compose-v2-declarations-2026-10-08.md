# Compose F4 contract V2 declarations

The local F4 editor changes target Ace 1.29.0/build 143 and AutoJs6 declarations
4.35.0. They build on the committed F3 editor source
`0793f378de64d07c5e603396aa6e984a31b983f4` and the platform 1.9.0 upgrade
`75d133cf5d161b66904fa86f043c5e1d6ef4edb9`, retaining the existing smart-hint,
overload, colors/terminal, XML and Compose F1/F2/F3 behavior. This record describes
local integration; it does not claim npm publication or a public release.

Contract V2 adds 25 node components covering the 19 roadmap families and six
supporting item types. Its 62 new canonical properties, required slots, callback
arguments, normalized getters/setters and JSX tags are projected from the actual
`ComposeUiV2.catalog` JVM export. The complete export retains every frozen V1
entry; AndroidView remains the separate F2 extension. Matching host build 5322
and a renderer supporting contract V2 are required for the added components.

The declarations preserve nullable UTC date selections and positional time,
selection, expansion and search callback arguments. Date bounds begin at year
1583 for consistent calendar behavior on API 24/25 and later releases. Item
container factories reject unrelated nodes and text children. The final catalog
advertises focus/blur on 11 native interactive controls; the inherited handle
methods remain available because a clickable modifier may provide a focus
target on other components. Mounted ownership and command support are runtime
checks.

The global JSX expression type remains the historical `any`, so static checking
does not prove XML/Compose domains, fragment cardinality, live ownership or
cross-node selection. Ordinary factory and property types remain precise.
Default optional-native declaration groups are unchanged. The curated editor
index, compatibility declarations and native language runtime assets retain
their established ownership.

The real browser verifier has an F4 group for both the default declarations and
the complete optional-native declarations. Each configuration checks positive
factory/TSX usage of all 25 additions, 34 invalid-input categories, all component
member completions, and DatePicker/SearchBar attribute completion. Fixture
locals avoid the existing global `filter` and `input` APIs. The complete verifier
also retains the prior language, smart-hint, overload and Compose checks.

The primary declaration corpus covers all F4 additions with 42 expected errors,
alongside the F1/F2/F3 25/31/22-error corpora. The actual TypeScript 5.1.3 and
6.0.3 compilers check these inputs, the unchanged global JSX boundary and the
Compose declaration body with `skipLibCheck=false`. Separate processes release
native declaration graphs between compiler runs without omitting checks.

The final normal `aj6dts -Publish` workflow completed from the clean host at
`6a166c38415e7299ba034cd062dcc4c51a4b543a`, build 5322, appDebug/ace profile.
The host commit follows the independently performed platform 1.9.0 upgrade at
`ea74b937a5`; that existing history was preserved. Android d.ts Generator 4.0.0
remains at `525bebdaa157087b1295d80cef0dae861152eda5`. The actual workflow
selected 489/10839 main, 20/20 resource and 789/27248 library classes, ran its
TypeScript validation and published the three generated inputs plus the Android
reference graph to this isolated Ace checkout. Main and resource bytes retain
their F3 values; libraries append the referenced `ComposeUiV2` class.

The primary declarations then passed the final TypeScript 5.1.3/6.0.3 F1-F4,
P6 strict/exact and declaration-body checks and were committed as
`de51858b59ec88f75c56d94bcf4af600c54ff34f`. Only after that commit, the 74
handwritten declaration inputs were mirrored and that exact source was recorded
in `types/autojs6/BUNDLED_DECLARATIONS.md`. No generated declaration was manually
removed or rewritten. File hashes in that record match the real source and
generated workflow provenance. The package version is 4.35.0 while Ace retains
`publishConfig: {"ignore": []}`. Curated index, both editor-owned lib files and
the bundled compiler retain their pre-publication hashes.

The complete real browser verifier passed on this final graph. Each F4
configuration reports zero positive diagnostics, 34 rejected categories,
25 component completions and successful DatePicker/SearchBar attribute
completion. All existing language, smart-hint, overload, colors/terminal and
Compose F1/F2/F3 groups also passed. The generated core group contains 75 source
files and 1646833 bytes. Native optional groups retain their existing settings.

The final authority command includes declaration generation, the complete
browser verifier, JVM tests, debug assembly, debug lint and all signed release
artifacts. Its log is `build/compose-f4-final-gate.log`. On the upgraded platform
1.9.0, this repository selects Gradle 9.5.0, AGP 9.3.3 and Kotlin 2.3.20; the
host's independent wrapper selects its own supported tool versions. Final
validation completed successfully in 7m 14s: all 171 JVM tests across 32 classes,
debug assembly, debug lint, five signed release APKs and debug/release native
alignment checks passed. Debug lint reports zero errors and 49 existing
warnings. No Android device installation of Ace is claimed by this declaration
change; real editor diagnostics and completions were exercised by the complete
browser verifier.

All five final APKs contain package 4.35.0 with Ace's original publishConfig,
the exact committed declaration provenance and byte-identical final Compose /
JSX declaration inputs. Their versionCode is 143. The collected CRC32 suffixes
were independently recomputed from each signed APK.

| ABI | Filename suffix | Bytes | SHA-256 |
| --- | --- | ---: | --- |
| universal | `universal-d7bd8a25.apk` | 18520872 | `f2162f8d8dac5e6c4541ebb571e8e7054dadfa85fff43a476984fb99a89afd1d` |
| armeabi-v7a | `armeabi-v7a-efce1cfe.apk` | 16905745 | `c5d9011a1720e1709745c7b4ff481152641113fbb8bcc1df1544e6aa93fa73ff` |
| x86_64 | `x86_64-325d15e8.apk` | 16992952 | `67ca6f621109bcb0ac6d7deaff3903f521f3668420a5f96be6ee09a09ef2f832` |
| x86 | `x86-12661678.apk` | 16170072 | `96a344d908eb5e0a0ea20850557bdcf755540b8d953ebd949d3e81eb3857d0ca` |
| arm64-v8a | `arm64-v8a-d59fb91a.apk` | 16960043 | `3f7ffbca95bad11811c324e0c956d1bf2083cee06794d57bb78475298a71ca1d` |

Every artifact uses prefix `autojs6-plugin-ace-editor-v1.29.0-` and stays in the
ignored local release directory. The ten-language changelog and all 25 generated
documents pass their freshness check. No remote source push, npm publication or
public release was performed.
