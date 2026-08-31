#!/usr/bin/env node

import { spawn } from "node:child_process";
import { performance } from "node:perf_hooks";
import path from "node:path";

function option(name, fallback = "") {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

const serial = option("--serial");
const remoteRoot = option("--remote-root", "/data/local/tmp/autojs6-luals-m5-3182-arm64");
const remoteBinary = option("--remote-binary", `${remoteRoot}/bin/lua-language-server`);
const sdkRoot = process.env.ANDROID_SDK_ROOT || process.env.ANDROID_HOME || "E:\\.android\\sdk";
const adb = option("--adb", path.join(sdkRoot, "platform-tools", process.platform === "win32" ? "adb.exe" : "adb"));

if (!serial || !/^[A-Za-z0-9._:-]+$/.test(serial)) {
  throw new Error("Pass a safe device serial with --serial.");
}
if (!/^\/data\/local\/tmp\/[A-Za-z0-9._/-]+$/.test(remoteRoot)) {
  throw new Error("--remote-root must be a safe path below /data/local/tmp.");
}
if (!/^\/data\/local\/tmp\/[A-Za-z0-9._/-]+$/.test(remoteBinary)) {
  throw new Error("--remote-binary must be a safe path below /data/local/tmp.");
}

const binaryDirectory = path.posix.dirname(remoteBinary);
const command = `cd '${remoteRoot}' && AUTOJS6_LUALS_ROOT='${remoteRoot}' LD_LIBRARY_PATH='${binaryDirectory}' exec '${remoteBinary}' '${remoteRoot}/main.lua'`;
const child = spawn(adb, ["-s", serial, "shell", "-T", "sh", "-c", command], {
  stdio: ["pipe", "pipe", "pipe"],
  windowsHide: true,
});

let stdout = Buffer.alloc(0);
let stderr = "";
let nextId = 1;
const pending = new Map();
const notifications = [];
const startedAt = performance.now();

child.stderr.setEncoding("utf8");
child.stderr.on("data", (chunk) => {
  stderr += chunk;
});

function frame(message) {
  const body = JSON.stringify(message);
  return `Content-Length: ${Buffer.byteLength(body, "utf8")}\r\n\r\n${body}`;
}

function send(message) {
  child.stdin.write(frame(message), "utf8");
}

function request(method, params, timeoutMs = 15_000) {
  const id = nextId++;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`${method} timed out after ${timeoutMs} ms`));
    }, timeoutMs);
    pending.set(id, { resolve, reject, timer, method });
    send({ jsonrpc: "2.0", id, method, params });
  });
}

function respond(id, result = null) {
  send({ jsonrpc: "2.0", id, result });
}

function serverRequestResult(message) {
  switch (message.method) {
    case "workspace/configuration":
      return (message.params?.items || []).map((item) => {
        switch (item.section) {
          case "Lua":
            return {
              runtime: { version: "Lua 5.4" },
              workspace: { checkThirdParty: false },
              diagnostics: { enable: true },
              telemetry: { enable: false },
            };
          case "editor.acceptSuggestionOnEnter":
            return "on";
          case "editor.semanticHighlighting.enabled":
            return true;
          case "files.associations":
          case "files.exclude":
            return {};
          default:
            return null;
        }
      });
    case "workspace/workspaceFolders":
      return [{ uri: `file://${remoteRoot}/workspace`, name: "m5-spike" }];
    default:
      return null;
  }
}

function handleMessage(message) {
  if (message.id !== undefined && message.method) {
    respond(message.id, serverRequestResult(message));
    return;
  }
  if (message.id !== undefined) {
    const waiter = pending.get(message.id);
    if (!waiter) return;
    clearTimeout(waiter.timer);
    pending.delete(message.id);
    if (message.error) {
      waiter.reject(new Error(`${waiter.method}: ${JSON.stringify(message.error)}`));
    } else {
      waiter.resolve(message.result);
    }
    return;
  }
  if (message.method) notifications.push(message);
}

function parseFrames() {
  while (true) {
    // `adb shell` on Windows can turn CRLF into CRCRLF. Search in latin1 so
    // byte offsets remain exact, and accept either raw or shell-translated EOLs.
    const separator = /\r*\n\r*\n/.exec(stdout.toString("latin1"));
    if (!separator) return;
    const headerEnd = separator.index;
    const header = stdout.subarray(0, headerEnd).toString("ascii");
    const match = /(?:^|\r*\n)Content-Length:\s*(\d+)/i.exec(header);
    if (!match) throw new Error(`Malformed LSP header: ${header}`);
    const length = Number(match[1]);
    const bodyStart = headerEnd + separator[0].length;
    if (stdout.length < bodyStart + length) return;
    const body = stdout.subarray(bodyStart, bodyStart + length).toString("utf8");
    stdout = stdout.subarray(bodyStart + length);
    handleMessage(JSON.parse(body));
  }
}

child.stdout.on("data", (chunk) => {
  stdout = Buffer.concat([stdout, chunk]);
  parseFrames();
});

const exited = new Promise((resolve) => {
  child.once("exit", (code, signal) => resolve({ code, signal }));
});

async function main() {
  const rootUri = `file://${remoteRoot}/workspace`;
  const documentUri = `${rootUri}/main.lua`;
  const text = [
    "---@type string",
    "local value = 'hello'",
    "local upper = value:upper()",
    "print(missing_global)",
    "string.",
  ].join("\n");

  const initializeStartedAt = performance.now();
  const initialize = await request("initialize", {
    processId: null,
    clientInfo: { name: "AutoJs6-M5-Spike", version: "1" },
    rootUri,
    workspaceFolders: [{ uri: rootUri, name: "m5-spike" }],
    capabilities: {
      workspace: { configuration: true, workspaceFolders: true },
      textDocument: {
        completion: { completionItem: { snippetSupport: true } },
        hover: { contentFormat: ["markdown", "plaintext"] },
        publishDiagnostics: { relatedInformation: true },
      },
    },
  }, 30_000);
  const initializeMs = performance.now() - initializeStartedAt;

  send({ jsonrpc: "2.0", method: "initialized", params: {} });
  send({
    jsonrpc: "2.0",
    method: "textDocument/didOpen",
    params: { textDocument: { uri: documentUri, languageId: "lua", version: 1, text } },
  });

  // LuaLS loads the bundled standard-library metadata after `initialized`.
  // Wait for that asynchronous preload before measuring the first completion.
  await new Promise((resolve) => setTimeout(resolve, 1_250));

  const completionStartedAt = performance.now();
  const completion = await request("textDocument/completion", {
    textDocument: { uri: documentUri },
    position: { line: 4, character: 7 },
    context: { triggerKind: 1 },
  }, 30_000);
  const completionMs = performance.now() - completionStartedAt;
  const items = Array.isArray(completion) ? completion : completion?.items || [];
  const labels = items.map((item) => item.label).filter(Boolean);
  const knownNames = ["byte", "char", "find", "format", "sub"];
  const knownStringMembers = labels.filter((label) => knownNames.some((name) => label === name || label.startsWith(`${name}(`)));

  const hover = await request("textDocument/hover", {
    textDocument: { uri: documentUri },
    position: { line: 2, character: 20 },
  });

  await new Promise((resolve) => setTimeout(resolve, 750));
  const diagnostics = notifications
    .filter((item) => item.method === "textDocument/publishDiagnostics")
    .flatMap((item) => item.params?.diagnostics || []);

  if (!knownStringMembers.length) {
    throw new Error(`LuaLS completion did not contain a known string member; received ${labels.length} items: ${JSON.stringify(labels)}.`);
  }
  if (!hover) throw new Error("LuaLS hover returned no result.");

  await request("shutdown", null, 5_000);
  send({ jsonrpc: "2.0", method: "exit", params: null });
  child.stdin.end();
  const exit = await Promise.race([
    exited,
    new Promise((resolve) => setTimeout(() => resolve({ code: null, signal: "timeout" }), 5_000)),
  ]);

  process.stdout.write(`${JSON.stringify({
    serial,
    remoteRoot,
    remoteBinary,
    initializeMs: Number(initializeMs.toFixed(2)),
    completionMs: Number(completionMs.toFixed(2)),
    completionCount: labels.length,
    knownStringMembers,
    hover: true,
    diagnostics: diagnostics.map((item) => ({ code: item.code, message: item.message, severity: item.severity })),
    serverCapabilities: Object.keys(initialize?.capabilities || {}).sort(),
    elapsedMs: Number((performance.now() - startedAt).toFixed(2)),
    exit,
    stderr: stderr.trim(),
  }, null, 2)}\n`);
}

try {
  await main();
} catch (error) {
  child.kill();
  for (const waiter of pending.values()) {
    clearTimeout(waiter.timer);
  }
  process.stderr.write(`${error.stack || error}\n${stderr}\n`);
  if (stdout.length) {
    process.stderr.write(`unparsed-stdout-bytes=${stdout.length}\n`);
    process.stderr.write(`${stdout.subarray(0, 4096).toString("hex")}\n`);
    process.stderr.write(`${stdout.subarray(0, 4096).toString("utf8")}\n`);
  }
  process.exitCode = 1;
}
