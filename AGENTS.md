# Ace Editor repository

This repository contains the AutoJs6 Ace editor and its language-service runtimes. Preserve the installed plugin identity, editor contract and validated host compatibility. Lua language-server native executables require verified ABI packaging and 16 KB runtime validation. Do not classify this APK as ABI independent. Follow the repository runtime lock manifests and offline asset checks when updating TypeScript, Python, Lua, Java or Kotlin support.

## Shared repository standard (2026-09-13)

Read [the complete repository standard](docs/development/repository-standard.md). It supplements the product-specific instructions above. Use the publicly released platform and native-alignment plugins, currently 1.8.1. Do not use consumer gradle/data overrides or sibling-repository build dependencies.

Inspect status, branch, recent commits and all diffs first. Do not overwrite or include another task's pending documentation, declaration or version changes in a commit. Generated documentation, provenance and public API synchronization require coordination with their owning task. Before each authorized commit set VERSION_BUILD to the current reachable HEAD count plus one, and verify it after committing.
