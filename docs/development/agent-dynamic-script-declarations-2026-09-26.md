# Agent dynamic script declarations

Development companion for AI Agent 1.1.0, verified on 2026-09-26.
Ace Editor version: 1.14.0, build 114. No npm or APK release was published.

- Bundled AutoJs6 declarations 4.22.0 from commit `3404bdc`.
- `Internal.Ai.AgentToolGroup` accepts `script_dynamic`. Editor hints explain
  that the group starts disabled and each generated source needs its own
  confirmation. The model tool is not a new `ai.agent` JavaScript method.
- All 69 manual internal declaration files match the declaration repository.
- The canonical `aj6dts.bat -Publish -SkipBuild` local synchronization workflow
  passed against a clean host verification checkout at `52ce694f92`.
  Generated Java, resource and dependency declarations were unchanged.
- Agent task TypeScript smoke checks passed, including the new group and
  rejection of `script_run_source` as either a group or public method.
- `generateAutoJs6LspDeclarations` and `verifyAutoJs6LspRuntime` passed. All five
  generated groups identify source package 4.22.0; the core group includes
  `script_dynamic`.
- All 171 JVM tests passed. Ten-language Markdown generation/check passed
  with 25 artifacts, and `git diff --check` passed.

This declaration-only update did not rebuild native language servers or run
device tests. Their previous release validation is recorded in
`release-1.13.1.md`; it is not new runtime evidence for this development build.
