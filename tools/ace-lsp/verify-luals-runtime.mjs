#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "..", "..");

function fail(message) {
  throw new Error(`[AutoJs6 LuaLS verification] ${message}`);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

function parseArguments(argv) {
  const defaults = {
    "asset-root": path.join(repositoryRoot, "app", "src", "main", "assets", "luals"),
    "jni-root": path.join(repositoryRoot, "app", "src", "main", "jniLibs"),
    lock: path.join(scriptDirectory, "luals-build-lock.json"),
    "manifest-generator": path.join(scriptDirectory, "generate-luals-manifest.mjs"),
    provider: path.join(
      repositoryRoot,
      "app", "src", "main", "assets", "editor", "ace-builds-1.4.12",
      "autojs6", "autojs6_lua_provider.js",
    ),
    "lsp-core": path.join(
      repositoryRoot,
      "app", "src", "main", "assets", "editor", "ace-builds-1.4.12",
      "autojs6", "autojs6_lsp_core.js",
    ),
    "lsp-transports": path.join(
      repositoryRoot,
      "app", "src", "main", "assets", "editor", "ace-builds-1.4.12",
      "autojs6", "autojs6_lsp_transports.js",
    ),
    client: path.join(
      repositoryRoot,
      "app", "src", "main", "assets", "editor", "ace-builds-1.4.12",
      "autojs6", "autojs6_lsp_client.js",
    ),
    bridge: path.join(
      repositoryRoot,
      "app", "src", "main", "assets", "editor", "ace-builds-1.4.12",
      "autojs6", "autojs6_ace_bridge.js",
    ),
    html: path.join(
      repositoryRoot,
      "app", "src", "main", "assets", "editor", "ace-builds-1.4.12",
      "autojs6_editor.html",
    ),
  };
  for (let index = 0; index < argv.length; index += 2) {
    const name = String(argv[index] || "");
    const key = name.startsWith("--") ? name.slice(2) : "";
    const value = argv[index + 1];
    if (!Object.hasOwn(defaults, key) || !value) {
      fail(
        "Usage: verify-luals-runtime.mjs [--asset-root <assets/luals>] " +
        "[--jni-root <jniLibs>] [--lock <luals-build-lock.json>] " +
        "[--manifest-generator <generate-luals-manifest.mjs>] " +
        "[--provider <autojs6_lua_provider.js>] [--lsp-core <autojs6_lsp_core.js>] " +
        "[--lsp-transports <autojs6_lsp_transports.js>] " +
        "[--client <autojs6_lsp_client.js>] [--bridge <autojs6_ace_bridge.js>] " +
        "[--html <autojs6_editor.html>]",
      );
    }
    defaults[key] = value;
  }
  return Object.fromEntries(
    Object.entries(defaults).map(([key, value]) => [key, path.resolve(value)]),
  );
}

function sha256(content) {
  return crypto.createHash("sha256").update(content).digest("hex");
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function walkFiles(root, current = root) {
  const result = [];
  for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
    const absolute = path.join(current, entry.name);
    if (entry.isDirectory()) {
      result.push(...walkFiles(root, absolute));
    } else if (entry.isFile()) {
      result.push(path.relative(root, absolute).split(path.sep).join("/"));
    }
  }
  return result.sort((left, right) => left.localeCompare(right, "en"));
}

function safeRelativePath(value) {
  return typeof value === "string" && value.length > 0 && value.length <= 512 &&
    !value.startsWith("/") && !value.startsWith("\\") &&
    !value.includes("\\") && !value.includes(":") && !value.includes("\0") &&
    value.split("/").every((segment) => segment && segment !== "." && segment !== "..");
}

function inventoryFingerprint(files) {
  const hash = crypto.createHash("sha256");
  hash.update("autojs6.luals.runtime.inventory.v1\n", "ascii");
  for (const file of files) {
    hash.update(file.path, "utf8");
    hash.update("\0", "ascii");
    hash.update(String(file.bytes), "ascii");
    hash.update("\0", "ascii");
    hash.update(file.sha256, "ascii");
    hash.update("\n", "ascii");
  }
  return hash.digest("hex");
}

function readUnsigned(buffer, offset, size) {
  if (size === 4) return buffer.readUInt32LE(offset);
  if (size === 8) return Number(buffer.readBigUInt64LE(offset));
  fail(`Unsupported ELF integer width: ${size}`);
}

function readNeededLibraries(buffer, elfClass) {
  const is64 = elfClass === 2;
  const sectionOffset = readUnsigned(buffer, is64 ? 40 : 32, is64 ? 8 : 4);
  const sectionEntrySize = buffer.readUInt16LE(is64 ? 58 : 46);
  const sectionCount = buffer.readUInt16LE(is64 ? 60 : 48);
  assert(sectionOffset > 0 && sectionEntrySize > 0 && sectionCount > 0,
    "ELF section table is missing");
  assert(sectionOffset + sectionEntrySize * sectionCount <= buffer.length,
    "ELF section table escapes the binary");

  const sections = [];
  for (let index = 0; index < sectionCount; index++) {
    const offset = sectionOffset + index * sectionEntrySize;
    sections.push({
      type: buffer.readUInt32LE(offset + 4),
      offset: readUnsigned(buffer, offset + (is64 ? 24 : 16), is64 ? 8 : 4),
      size: readUnsigned(buffer, offset + (is64 ? 32 : 20), is64 ? 8 : 4),
      link: buffer.readUInt32LE(offset + (is64 ? 40 : 24)),
      entrySize: readUnsigned(buffer, offset + (is64 ? 56 : 36), is64 ? 8 : 4),
    });
  }
  const dynamic = sections.find((section) => section.type === 6);
  assert(dynamic, "ELF SHT_DYNAMIC section is missing");
  const strings = sections[dynamic.link];
  assert(strings && strings.offset + strings.size <= buffer.length,
    "ELF dynamic string table is invalid");
  const entrySize = dynamic.entrySize || (is64 ? 16 : 8);
  assert(dynamic.offset + dynamic.size <= buffer.length && entrySize >= (is64 ? 16 : 8),
    "ELF dynamic table is invalid");

  const libraries = [];
  for (let offset = dynamic.offset; offset + entrySize <= dynamic.offset + dynamic.size;
    offset += entrySize) {
    const tag = is64 ? Number(buffer.readBigInt64LE(offset)) : buffer.readInt32LE(offset);
    if (tag === 0) break;
    if (tag !== 1) continue;
    const stringOffset = readUnsigned(buffer, offset + (is64 ? 8 : 4), is64 ? 8 : 4);
    const start = strings.offset + stringOffset;
    assert(start >= strings.offset && start < strings.offset + strings.size,
      "ELF DT_NEEDED string offset is invalid");
    let end = start;
    while (end < strings.offset + strings.size && buffer[end] !== 0) end++;
    libraries.push(buffer.toString("utf8", start, end));
  }
  return [...new Set(libraries)].sort();
}

function verifyElf(file, expected) {
  const buffer = fs.readFileSync(file);
  assert(buffer.length === expected.bytes,
    `${file} size is ${buffer.length}; expected ${expected.bytes}`);
  assert(sha256(buffer) === expected.sha256, `${file} SHA-256 does not match the build lock`);
  assert(buffer.length >= 64 && buffer[0] === 0x7f && buffer[1] === 0x45 &&
    buffer[2] === 0x4c && buffer[3] === 0x46, `${file} is not ELF`);
  assert(buffer[4] === expected.elfClass,
    `${file} ELF class is ${buffer[4]}; expected ${expected.elfClass}`);
  assert(buffer[5] === 1 && buffer[6] === 1, `${file} is not little-endian ELF v1`);
  assert(buffer.readUInt16LE(16) === 3, `${file} is not an ET_DYN ELF`);
  assert(buffer.readUInt16LE(18) === expected.elfMachine,
    `${file} ELF machine is ${buffer.readUInt16LE(18)}; expected ${expected.elfMachine}`);
  const needed = readNeededLibraries(buffer, expected.elfClass);
  const expectedNeeded = Array.isArray(expected.needed) ?
    [...expected.needed].sort() : ["libc.so", "libdl.so", "libm.so"];
  assert(JSON.stringify(needed) === JSON.stringify(expectedNeeded),
    `${file} has unexpected DT_NEEDED entries: ${needed.join(", ")}`);
  assert(!needed.includes("libc++_shared.so"), `${file} unexpectedly depends on libc++_shared.so`);
  return { bytes: buffer.length, sha256: expected.sha256, needed };
}

function verifyManifest(paths) {
  const lock = readJson(paths.lock);
  const manifestPath = path.join(paths["asset-root"], "manifest.json");
  const manifest = readJson(manifestPath);
  assert(manifest.schemaRevision === 1, "LuaLS manifest schema revision changed");
  assert(manifest.providerId === "lua-luals" && manifest.providerId === lock.providerId,
    "LuaLS provider ID is not pinned to lua-luals");
  assert(manifest.version === lock.version, "LuaLS manifest and build-lock versions differ");
  assert(manifest.source?.repository === lock.repository &&
    manifest.source?.tagObject === lock.tagObject && manifest.source?.commit === lock.commit,
  "LuaLS source repository/tag/commit do not match the build lock");
  assert(JSON.stringify(manifest.toolchain) === JSON.stringify(lock.toolchain),
    "LuaLS manifest toolchain does not match the build lock");

  const runtimeRoot = path.join(paths["asset-root"], "runtime");
  const actualPaths = walkFiles(runtimeRoot);
  const records = manifest.runtime?.files;
  assert(Array.isArray(records), "LuaLS manifest runtime inventory is missing");
  assert(records.length === manifest.runtime.fileCount && records.length === actualPaths.length,
    "LuaLS runtime file count does not match its manifest");
  assert(new Set(records.map((record) => record.path)).size === records.length,
    "LuaLS runtime manifest contains duplicate paths");
  assert(JSON.stringify(records.map((record) => record.path)) === JSON.stringify(actualPaths),
    "LuaLS runtime manifest paths are stale or unsorted");

  let runtimeBytes = 0;
  const verifiedRecords = records.map((record) => {
    assert(safeRelativePath(record.path), `Unsafe LuaLS runtime path: ${record.path}`);
    const content = fs.readFileSync(path.join(runtimeRoot, ...record.path.split("/")));
    assert(content.length === record.bytes, `${record.path} byte count changed`);
    assert(sha256(content) === record.sha256, `${record.path} SHA-256 changed`);
    runtimeBytes += content.length;
    return { path: record.path, bytes: content.length, sha256: record.sha256 };
  });
  assert(runtimeBytes === manifest.runtime.bytes, "LuaLS runtime aggregate byte count changed");
  assert(inventoryFingerprint(verifiedRecords) === manifest.runtime.sha256,
    "LuaLS runtime inventory fingerprint changed");
  [
    "main.lua",
    "bin/main.lua",
    "script/jsonrpc.lua",
    "script/provider/provider.lua",
    "script/core/completion/completion.lua",
    "script/core/diagnostics/undefined-global.lua",
    "locale/en-us/meta.lua",
    "meta/template/basic.lua",
  ].forEach((required) => assert(actualPaths.includes(required),
    `Required LuaLS runtime file is missing: ${required}`));

  const licensePath = path.join(paths["asset-root"], "THIRD_PARTY_LICENSES.txt");
  const license = fs.readFileSync(licensePath);
  assert(manifest.license?.path === "THIRD_PARTY_LICENSES.txt" &&
    manifest.license?.bytes === license.length && manifest.license?.sha256 === sha256(license),
  "LuaLS third-party license inventory does not match its manifest");
  const licenseText = license.toString("utf8");
  ["LuaLS", "bee.lua", "Lua 5.5", "lpeglabel", "json.lua", "EmmyLuaCodeStyle", "{fmt}"]
    .forEach((component) => assert(licenseText.includes(component),
      `LuaLS license inventory omits ${component}`));

  const lockAbis = Object.keys(lock.abis).sort();
  const manifestAbis = Object.keys(manifest.nativeLibraries || {}).sort();
  assert(JSON.stringify(lockAbis) === JSON.stringify(["arm64-v8a", "armeabi-v7a", "x86_64"]),
    `Unexpected build-lock ABI set: ${lockAbis.join(", ")}`);
  assert(JSON.stringify(manifestAbis) === JSON.stringify(lockAbis),
    "LuaLS native manifest ABI set differs from the build lock");
  const native = {};
  for (const abi of lockAbis) {
    const expected = lock.abis[abi];
    const record = manifest.nativeLibraries[abi];
    assert(record.path === `${abi}/libautojs6_luals.so` &&
      record.bytes === expected.bytes && record.sha256 === expected.sha256 &&
      record.elfClass === expected.elfClass && record.elfMachine === expected.elfMachine,
    `LuaLS ${abi} manifest entry differs from the build lock`);
    native[abi] = verifyElf(
      path.join(paths["jni-root"], abi, "libautojs6_luals.so"),
      expected,
    );
  }
  const compatibility = lock.installCompatibility;
  assert(compatibility?.abi === "x86" && !lock.abis[compatibility.abi] &&
    compatibility.target === "i686-linux-android28" &&
    compatibility.source === "tools/ace-lsp/luals-x86-install-compat.c" &&
    compatibility.library === "libautojs6_luals_install_compat.so" &&
    Array.isArray(compatibility.needed) && compatibility.needed.length === 0,
  "The unsupported x86 install-only compatibility contract changed");
  const installCompatibility = verifyElf(
    path.join(paths["jni-root"], compatibility.abi, compatibility.library),
    compatibility,
  );

  const deterministicCheck = spawnSync(
    process.execPath,
    [
      paths["manifest-generator"],
      "--lock", paths.lock,
      "--asset-root", paths["asset-root"],
      "--jni-root", paths["jni-root"],
      "--out", manifestPath,
      "--check",
    ],
    { cwd: repositoryRoot, encoding: "utf8" },
  );
  assert(deterministicCheck.status === 0,
    `Deterministic manifest check failed: ${deterministicCheck.stderr || deterministicCheck.stdout}`);
  return {
    providerId: manifest.providerId,
    version: manifest.version,
    sourceCommit: manifest.source.commit,
    runtimeFiles: records.length,
    runtimeBytes,
    runtimeSha256: manifest.runtime.sha256,
    native,
    installCompatibility: {
      abi: compatibility.abi,
      library: compatibility.library,
      ...installCompatibility,
    },
    deterministicManifest: true,
  };
}

function loadScript(context, file) {
  const source = fs.readFileSync(file, "utf8");
  new vm.Script(source, { filename: path.basename(file) }).runInContext(context);
  return source;
}

function verifyFrontendWiring(paths) {
  const providerSource = fs.readFileSync(paths.provider, "utf8");
  const clientSource = fs.readFileSync(paths.client, "utf8");
  const bridgeSource = fs.readFileSync(paths.bridge, "utf8");
  const html = fs.readFileSync(paths.html, "utf8");
  assert(!/(^|[^\w])(const|let)([^\w]|$)|=>|\?\.|\?\?/.test(providerSource),
    "Lua provider contains syntax outside the ES5 compatibility budget");
  [
    'var PROVIDER_ID = "lua-luals"',
    'runtime: { version: "Lua 5.4" }',
    "getWorkspaceConfiguration: workspaceConfiguration",
    "createStdioBridgeTransport",
    '"completion"',
    '"hover"',
    '"signatureHelp"',
    '"diagnostics"',
    '"definition"',
    '"dispose"',
  ].forEach((needle) => assert(providerSource.includes(needle),
    `Lua provider wiring omits ${needle}`));
  [
    "AutoJsAceLuaProvider",
    'providerId: "lua-luals"',
    "luaServiceDisposeCount",
    "!state.serverAvailable",
  ].forEach((needle) => assert(clientSource.includes(needle),
    `Editor LSP client omits Lua integration marker ${needle}`));
  [
    '(lspState.semanticLanguage === "python" || lspState.semanticLanguage === "lua")',
    'typeof lspClient.getDefinitionAsync === "function"',
    "lspClient.getDefinitionAsync(position, function(error, target)",
  ].forEach((needle) => assert(bridgeSource.includes(needle),
    `Editor bridge omits asynchronous Lua definition marker ${needle}`));
  const coreIndex = html.indexOf("autojs6_lsp_core.js");
  const transportIndex = html.indexOf("autojs6_lsp_transports.js");
  const providerIndex = html.indexOf("autojs6_lua_provider.js");
  const clientIndex = html.indexOf("autojs6_lsp_client.js");
  assert(coreIndex >= 0 && coreIndex < transportIndex && transportIndex < providerIndex &&
    providerIndex < clientIndex, "Lua provider scripts are absent or loaded in an unsafe order");
  return {
    es5Provider: true,
    asynchronousLuaDefinition: true,
    scriptOrder: [coreIndex, transportIndex, providerIndex, clientIndex],
  };
}

function verifyProviderProtocol(paths) {
  let timerSerial = 0;
  const timers = new Map();
  const context = {
    console,
    Date,
    Error,
    isFinite,
    JSON,
    Math,
    setTimeout(callback, delayMs) {
      const id = ++timerSerial;
      timers.set(id, { callback, delayMs });
      return id;
    },
    clearTimeout(id) {
      timers.delete(id);
    },
  };
  context.window = context;
  vm.createContext(context);
  loadScript(context, paths["lsp-core"]);
  loadScript(context, paths["lsp-transports"]);
  loadScript(context, paths.provider);

  const rootUri = "file:///data/user/0/autojs6/files/lua-project";
  const documentUri = `${rootUri}/main.lua`;
  const documentText = "---@type string\nlocal value = 'hello'\nvalue:up\nmissing_global()";
  const sessionId = "lsp-lua-luals-verifier-1";
  const sent = [];
  let startCount = 0;
  let readyCount = 0;
  let stopCount = 0;

  function deliver(message) {
    const accepted = context.AutoJsAceLspTransports.receiveStdioMessage(
      sessionId,
      JSON.stringify(message),
    );
    assert(accepted, `Stdio transport rejected mock message ${JSON.stringify(message)}`);
  }

  const bridge = {
    startLspProcess(providerId) {
      assert(providerId === "lua-luals", `Lua provider requested unexpected process ${providerId}`);
      startCount++;
      return JSON.stringify({ ok: true, sessionId });
    },
    sendLspProcessMessage(actualSessionId, payload) {
      assert(actualSessionId === sessionId, "Lua provider changed its stdio session ID");
      const message = JSON.parse(payload);
      sent.push(message);
      if (message.id != null && message.method === "initialize") {
        deliver({
          jsonrpc: "2.0",
          id: message.id,
          result: {
            capabilities: {
              textDocumentSync: 2,
              completionProvider: { triggerCharacters: [".", ":"] },
              hoverProvider: true,
              signatureHelpProvider: { triggerCharacters: ["(", ","] },
              definitionProvider: true,
            },
          },
        });
      } else if (message.id != null && message.method === "textDocument/completion") {
        deliver({
          jsonrpc: "2.0",
          id: message.id,
          result: {
            isIncomplete: false,
            items: [{ label: "upper", kind: 2, insertText: "upper()" }],
          },
        });
      } else if (message.id != null && message.method === "textDocument/hover") {
        deliver({
          jsonrpc: "2.0",
          id: message.id,
          result: { contents: { kind: "markdown", value: "```lua\nstring\n```" } },
        });
      } else if (message.id != null && message.method === "textDocument/signatureHelp") {
        deliver({
          jsonrpc: "2.0",
          id: message.id,
          result: {
            activeSignature: 0,
            activeParameter: 0,
            signatures: [{
              label: "string.upper(s: string): string",
              parameters: [{ label: "s: string" }],
            }],
          },
        });
      } else if (message.id != null && message.method === "textDocument/definition") {
        deliver({
          jsonrpc: "2.0",
          id: message.id,
          result: [{
            uri: documentUri,
            range: {
              start: { line: 1, character: 6 },
              end: { line: 1, character: 11 },
            },
          }],
        });
      } else if (message.id != null && message.method === "shutdown") {
        deliver({ jsonrpc: "2.0", id: message.id, result: null });
      }
      return JSON.stringify({ ok: true, sessionId });
    },
    markLspProcessReady(actualSessionId) {
      assert(actualSessionId === sessionId, "Lua provider marked an unknown process ready");
      readyCount++;
      return JSON.stringify({ ok: true, sessionId });
    },
    stopLspProcess(actualSessionId) {
      assert(actualSessionId === sessionId, "Lua provider stopped an unknown process");
      stopCount++;
      return JSON.stringify({ ok: true, sessionId });
    },
  };

  const diagnostics = [];
  const provider = context.AutoJsAceLuaProvider.create({
    bridge,
    eager: false,
    rootUri,
    documentUri,
    documentText,
    onDiagnostics(annotations) {
      diagnostics.push(annotations);
    },
  });
  assert(provider && provider.id === "lua-luals" && provider.kind === "stdio",
    "Lua provider could not be created over stdio");
  let started = null;
  provider.start((ok, state) => { started = { ok, state }; });
  assert(started?.ok && provider.getState().ready && startCount === 1 && readyCount === 1,
    `Lua provider initialize failed: ${JSON.stringify(started)}`);
  assert(sent.some((message) => message.method === "textDocument/didOpen" &&
    message.params?.textDocument?.uri === documentUri &&
    message.params?.textDocument?.languageId === "lua"),
  "Lua provider did not open the physical Lua document");

  deliver({
    jsonrpc: "2.0",
    id: 9001,
    method: "workspace/configuration",
    params: {
      items: [
        { scopeUri: rootUri, section: "Lua" },
        { scopeUri: rootUri, section: "files.exclude" },
      ],
    },
  });
  deliver({ jsonrpc: "2.0", id: 9002, method: "workspace/workspaceFolders", params: {} });
  const configurationResponse = sent.find((message) => message.id === 9001);
  const foldersResponse = sent.find((message) => message.id === 9002);
  assert(configurationResponse?.result?.[0]?.runtime?.version === "Lua 5.4" &&
    configurationResponse.result[0].telemetry?.enable === false &&
    Object.keys(configurationResponse.result[1] || {}).length === 0,
  "LuaLS workspace/configuration response is incomplete");
  assert(foldersResponse?.result?.[0]?.uri === rootUri,
    "LuaLS workspace/workspaceFolders response changed the physical root");

  let completion = null;
  provider.getCompletions(null, { row: 2, column: 8 }, "up", documentText,
    (error, result) => { completion = { error, result }; });
  let hover = null;
  provider.getHover(null, { row: 1, column: 8 }, documentText,
    (error, result) => { hover = { error, result }; });
  let signature = null;
  provider.getSignatureHelp(null, { row: 2, column: 8 }, documentText,
    (error, result) => { signature = { error, result }; });
  let definition = null;
  provider.getDefinition(null, { row: 1, column: 8 }, documentText,
    (error, result) => { definition = { error, result }; });
  assert(!completion?.error && completion.result?.[0]?.caption === "upper" &&
    completion.result[0].autojs6Lua === true,
  `Lua completion did not round-trip: ${JSON.stringify(completion)}`);
  assert(!hover?.error && hover.result?.docText?.includes("string") &&
    hover.result.autojs6Lua === true, "Lua hover did not round-trip");
  assert(!signature?.error && signature.result?.signature?.includes("string.upper") &&
    signature.result.activeParameter === 0, "Lua signature help did not round-trip");
  assert(!definition?.error && definition.result?.uri === documentUri &&
    definition.result.line === 1, "Lua definition did not round-trip");

  deliver({
    jsonrpc: "2.0",
    method: "textDocument/publishDiagnostics",
    params: {
      uri: documentUri,
      version: 1,
      diagnostics: [{
        range: {
          start: { line: 3, character: 0 },
          end: { line: 3, character: 14 },
        },
        severity: 2,
        code: "undefined-global",
        source: "Lua Diagnostics",
        message: "Undefined global `missing_global`.",
      }],
    },
  });
  assert(diagnostics.length === 1 && diagnostics[0][0]?.raw === "undefined-global" &&
    diagnostics[0][0]?.type === "warning", "Lua diagnostics were not converted to ACE annotations");

  assert(context.AutoJsAceLspTransports.receiveStdioState(sessionId, "crashed", "forced crash"),
    "Lua stdio crash state was not delivered");
  let fallbackCompletion = null;
  provider.getCompletions(null, { row: 2, column: 8 }, "up", documentText,
    (_error, result) => { fallbackCompletion = result; });
  assert(Array.isArray(fallbackCompletion) && fallbackCompletion.length === 0 &&
    provider.getState().status === "recovering", "Lua crash did not expose the M2 fallback window");
  context.AutoJsAceLspTransports.receiveStdioState(sessionId, "restart-wait", "250ms");
  context.AutoJsAceLspTransports.receiveStdioState(sessionId, "running", "restart");
  assert(provider.getState().ready && provider.getState().restartCount === 1 && readyCount === 2 &&
    sent.filter((message) => message.method === "initialize").length === 2 &&
    sent.filter((message) => message.method === "textDocument/didOpen").length === 2,
  `Lua crash recovery failed: ${JSON.stringify(provider.getState())}`);

  provider.dispose();
  const lifecycle = context.AutoJsAceLuaProvider.getLifecycleState();
  assert(lifecycle.providerCreatedCount === 1 && lifecycle.providerDisposeCount === 1 &&
    lifecycle.processReleaseCount === 1 && lifecycle.activeProviderCount === 0 && stopCount === 1,
  `Lua provider release lifecycle failed: ${JSON.stringify(lifecycle)}`);

  const unavailableBridge = {
    startLspProcess() {
      return JSON.stringify({ ok: false, error: "unsupported ABI x86" });
    },
    sendLspProcessMessage() { return JSON.stringify({ ok: false }); },
    markLspProcessReady() { return JSON.stringify({ ok: false }); },
    stopLspProcess() { return JSON.stringify({ ok: true }); },
  };
  const unavailableProvider = context.AutoJsAceLuaProvider.create({
    bridge: unavailableBridge,
    eager: false,
    rootUri,
    documentUri,
    documentText,
  });
  let unavailableStart = null;
  unavailableProvider.start((ok, state) => { unavailableStart = { ok, state }; });
  assert(unavailableStart?.ok === false && unavailableProvider.getState().status === "unavailable" &&
    unavailableProvider.getState().unavailableReason.includes("unsupported ABI x86"),
  "Unsupported Lua ABI did not degrade without a process session");
  unavailableProvider.dispose();

  const methods = sent.filter((message) => message.method).map((message) => message.method);
  [
    "initialize",
    "initialized",
    "textDocument/didOpen",
    "textDocument/completion",
    "textDocument/hover",
    "textDocument/signatureHelp",
    "textDocument/definition",
    "shutdown",
    "exit",
  ].forEach((method) => assert(methods.includes(method), `Lua protocol mock omitted ${method}`));
  return {
    initializationCount: methods.filter((method) => method === "initialize").length,
    readyCount,
    completion: completion.result[0].caption,
    diagnosticCode: diagnostics[0][0].raw,
    crashFallback: true,
    restartCount: 1,
    unsupportedAbiFallback: true,
    stopCount,
  };
}

function main() {
  const paths = parseArguments(process.argv.slice(2));
  Object.values(paths).forEach((file) => assert(fs.existsSync(file), `Required input is missing: ${file}`));
  const manifest = verifyManifest(paths);
  const frontend = verifyFrontendWiring(paths);
  const protocol = verifyProviderProtocol(paths);
  process.stdout.write(`${JSON.stringify({ manifest, frontend, protocol }, null, 2)}\n`);
}

try {
  main();
} catch (error) {
  process.stderr.write(`${error?.stack || error}\n`);
  process.exitCode = 1;
}
