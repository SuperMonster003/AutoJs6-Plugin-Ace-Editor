# Installer advanced declaration synchronization

Date: 2026-10-02.

Manual declarations match @sm003/autojs6-dts 4.27.0, commit
`396a9706eff8565421b0f82b6e514df2689c151c`. They add five negotiated installation options,
closed enum sets, optimizing, the caller-visible nullable updateOwner observation, and the
six-state dexopt observation. Explicit false/none still requires V3; no script bypass for local
installation policy is declared. Accepted compilation includes a platform skip, and null
ownership is not proof that an owner is globally absent.

The canonical `aj6dts.bat -Publish -SkipBuild` workflow successfully exported the already-built
host classes, generated main/resource/library declarations and ran TypeScript validation.
It did not recompile host production sources. The automatic library refresh also reflects
previously committed Kotlin reflection and Rhino signatures. The only inspector addition is
a generic-name inventory comment for TreeMatch, whose source the parallel owner committed
as `c55d35e0d5`; no unfinished inspector UI declarations were included.

Installer type smoke checks include explicit no-ops, metadata enums, nullable observations,
optimizing and negative cases for null, numeric enums, invalid filters, uninstall options
and policy bypass. They pass without executing an installation. The manual installer file
is mirrored exactly, while embedded package metadata retains its local publication settings.

`generateAutoJs6LspDeclarations` and `verifyAutoJs6LspRuntime` pass. A final description-only
correction for owner visibility was regenerated afterward; the type shape was unchanged.
The generated manifest uses source package version 4.27.0. All 25 multilingual documentation
artifacts pass generation checks. Native language-server binaries were not rebuilt, no package
was published, and the pre-existing untracked releases directory was preserved.
