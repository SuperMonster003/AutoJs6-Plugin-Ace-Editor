(function(global) {
    "use strict";

    var CURRENT_FILE = "file:///autojs6/editor/current.js";
    var CURRENT_DIR = "file:///autojs6/editor";
    var AUTOJS6_CORE_LIB = "file:///autojs6/types/generated/lib.autojs6.core.d.ts";
    var AUTOJS6_COMPATIBILITY_LIB = "file:///autojs6/types/lib.autojs6.extra.d.ts";
    var TS_LIB_ROOT = "file:///autojs6/typescript/";
    var AUTOJS6_ASSET_ROOT = "./autojs6/";
    var TYPESCRIPT_VERSION = "6.0.3";
    var PROFILE_RHINO = "rhino";
    var PROFILE_NODE = "node";
    var PROFILE_JAVASCRIPT = "javascript";
    var EXECUTION_PROFILE_REVISION = 2;
    var EDITOR_DEFAULT_LIB = "lib.es2022.d.ts";
    var EXECUTION_DEFAULT_LIB = "lib.es2018.d.ts";
    var DEFAULT_LIBRARY_URIS = [
        TS_LIB_ROOT + EDITOR_DEFAULT_LIB,
        AUTOJS6_CORE_LIB,
        AUTOJS6_COMPATIBILITY_LIB
    ];
    var TS_DIAGNOSTIC_SOURCE = "autojs6-ts";
    var SINGLE_FILE_UNRELIABLE_DIAGNOSTIC_CODES = {
        2307: true,
        2792: true,
        7016: true
    };
    var EDITOR_SYNTHETIC_DIAGNOSTIC_CODES = {
        // Virtual editor URIs intentionally retain the execution profile's /sources rootDir.
        6059: true
    };
    var CODE_ACTION_KIND_AUTO_IMPORT = "autoImport";
    var CODE_ACTION_KIND_SPELLING = "spellingCorrection";
    var MAX_CODE_ACTIONS = 16;
    var MAX_CODE_ACTION_TITLE_LENGTH = 512;
    var MAX_CODE_ACTION_EDITS = 32;
    var MAX_CODE_ACTION_REPLACEMENT_LENGTH = 131072;
    var MAX_RENAME_FILES = 128;
    var MAX_RENAME_EDITS_PER_FILE = 512;
    var MAX_RENAME_TOTAL_EDITS = 4096;
    var IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/;
    var SAFE_DECLARATION_ASSET_NAME = /^[A-Za-z0-9_.-]+\.d\.ts$/;

    function noop() {
    }

    function notify(config, message, error) {
        if (config && typeof config.notifyError === "function") {
            config.notifyError(String(message || "ACE TS language service error"), error);
        }
    }

    function copyArray(value) {
        return Array.isArray(value) ? value.slice(0) : [];
    }

    function hasOwn(object, key) {
        return Object.prototype.hasOwnProperty.call(object, key);
    }

    function normalizeFileName(fileName) {
        fileName = String(fileName || "").replace(/\\/g, "/");
        if (/^file:\/+autojs6\/editor(?:\/|$)/.test(fileName)) {
            return "file:///autojs6/editor" +
                fileName.substring(fileName.indexOf("autojs6/editor") + "autojs6/editor".length);
        }
        if (fileName.indexOf("file:///autojs6/typescript/") === 0 ||
            fileName.indexOf("file:///autojs6/types/") === 0) {
            return fileName;
        }
        fileName = fileName.replace(/^\.?\//, "");
        if (fileName.indexOf("autojs6/typescript/") === 0 ||
            fileName.indexOf("autojs6/types/") === 0) {
            return "file:///" + fileName;
        }
        if (fileName.indexOf("/autojs6/typescript/") >= 0) {
            return TS_LIB_ROOT + fileName.substring(fileName.lastIndexOf("/") + 1);
        }
        if (fileName.indexOf("/autojs6/types/") >= 0) {
            return "file:///autojs6/types/" + fileName.substring(
                fileName.indexOf("/autojs6/types/") + "/autojs6/types/".length
            );
        }
        if (fileName.indexOf("/typescript/") >= 0) {
            return TS_LIB_ROOT + fileName.substring(fileName.lastIndexOf("/") + 1);
        }
        if (fileName.indexOf("lib.") === 0 && /\.d\.ts$/.test(fileName)) {
            return TS_LIB_ROOT + fileName;
        }
        if (fileName === "typescriptServices.d.ts" || fileName === "typescript.d.ts" || fileName === "tsserverlibrary.d.ts") {
            return TS_LIB_ROOT + fileName;
        }
        return fileName || CURRENT_FILE;
    }

    function assetUrlForLibraryUri(uri) {
        uri = normalizeFileName(uri);
        var prefix = "file:///autojs6/";
        if (uri.indexOf(prefix) !== 0) {
            return null;
        }
        var path = uri.substring(prefix.length);
        if (!/(^typescript\/|^types\/)/.test(path) || !/\.d\.ts$/.test(path)) {
            return null;
        }
        return AUTOJS6_ASSET_ROOT + path;
    }

    function normalizeDocumentUri(uri) {
        uri = normalizeFileName(uri || CURRENT_FILE);
        return uri || CURRENT_FILE;
    }

    function inferredProfileForDocumentUri(uri) {
        var clean = cleanFileNameForKind(uri);
        if (/\.(?:mts|cts)$/.test(clean) || /\.d\.(?:mts|cts)$/.test(clean)) {
            return PROFILE_NODE;
        }
        if (/\.(?:ts|tsx)$/.test(clean) || /\.d\.ts$/.test(clean)) {
            return PROFILE_RHINO;
        }
        return PROFILE_JAVASCRIPT;
    }

    function normalizeExecutionProfile(profile, documentUri) {
        profile = String(profile || "").toLowerCase();
        if (profile === PROFILE_RHINO || profile === PROFILE_NODE) {
            return profile;
        }
        return inferredProfileForDocumentUri(documentUri);
    }

    function defaultLibForProfile(profile) {
        return profile === PROFILE_RHINO || profile === PROFILE_NODE ?
            EXECUTION_DEFAULT_LIB : EDITOR_DEFAULT_LIB;
    }

    function defaultLibraryUrisForProfile(profile) {
        return [
            TS_LIB_ROOT + defaultLibForProfile(profile),
            AUTOJS6_CORE_LIB,
            AUTOJS6_COMPATIBILITY_LIB
        ];
    }

    function cleanFileNameForKind(fileName) {
        return String(fileName || "").replace(/[?#].*$/, "").toLowerCase();
    }

    function scriptKindForFileName(ts, fileName) {
        var clean = cleanFileNameForKind(fileName);
        if (/\.json$/.test(clean) && ts.ScriptKind && typeof ts.ScriptKind.JSON !== "undefined") {
            return ts.ScriptKind.JSON;
        }
        if (/\.tsx$/.test(clean) && ts.ScriptKind && typeof ts.ScriptKind.TSX !== "undefined") {
            return ts.ScriptKind.TSX;
        }
        if (/\.jsx$/.test(clean) && ts.ScriptKind && typeof ts.ScriptKind.JSX !== "undefined") {
            return ts.ScriptKind.JSX;
        }
        if ((/\.(?:ts|mts|cts)$/.test(clean) || /\.d\.(?:ts|mts|cts)$/.test(clean)) &&
            ts.ScriptKind && typeof ts.ScriptKind.TS !== "undefined") {
            return ts.ScriptKind.TS;
        }
        return ts.ScriptKind && typeof ts.ScriptKind.JS !== "undefined" ? ts.ScriptKind.JS : undefined;
    }

    function loadTextFromBridge(url) {
        var bridge = global.autojs;
        if (!bridge || typeof bridge.read !== "function") {
            return null;
        }
        try {
            var response = JSON.parse(String(bridge.read(url) || "{}"));
            if (response && response.ok === true && typeof response.text === "string") {
                return response.text;
            }
        } catch (ignore) {
            return null;
        }
        return null;
    }

    function loadText(url) {
        var bridged = loadTextFromBridge(url);
        if (bridged !== null) {
            return bridged;
        }
        if (!global.XMLHttpRequest) {
            return null;
        }
        var xhr = new global.XMLHttpRequest();
        xhr.open("GET", url, false);
        xhr.send(null);
        if ((xhr.status >= 200 && xhr.status < 300) || xhr.status === 0) {
            return String(xhr.responseText || "");
        }
        return null;
    }

    function positionToIndex(session, pos) {
        pos = pos || {};
        if (session && session.doc && typeof session.doc.positionToIndex === "function") {
            return session.doc.positionToIndex(pos, 0);
        }
        var row = Math.max(0, Number(pos.row) || 0);
        var column = Math.max(0, Number(pos.column) || 0);
        var index = 0;
        for (var i = 0; i < row; i++) {
            index += String(session.getLine(i) || "").length + 1;
        }
        return index + column;
    }

    function positionFromIndex(text, index) {
        text = String(text || "");
        index = Math.max(0, Math.min(Number(index) || 0, text.length));
        var row = 0;
        var column = 0;
        for (var i = 0; i < index; i++) {
            var ch = text.charAt(i);
            if (ch === "\n") {
                row++;
                column = 0;
            } else if (ch !== "\r") {
                column++;
            }
        }
        return { row: row, column: column };
    }

    function textFromSession(session) {
        if (!session) {
            return "";
        }
        if (typeof session.getValue === "function") {
            return String(session.getValue() || "");
        }
        var lines = [];
        var length = typeof session.getLength === "function" ? session.getLength() : 1;
        for (var row = 0; row < length; row++) {
            lines.push(session.getLine(row) || "");
        }
        return lines.join("\n");
    }

    function partsToString(parts) {
        if (typeof parts === "string") {
            return parts;
        }
        if (!Array.isArray(parts)) {
            return parts && typeof parts.text === "string" ? parts.text : "";
        }
        return (parts || []).map(function(part) {
            return part && part.text || "";
        }).join("");
    }

    function flattenDiagnostic(ts, diagnostic) {
        if (!diagnostic) {
            return "";
        }
        return ts.flattenDiagnosticMessageText(diagnostic.messageText || "", "\n");
    }

    function diagnosticType(ts, diagnostic) {
        if (!diagnostic || diagnostic.category === ts.DiagnosticCategory.Message) {
            return "info";
        }
        if (diagnostic.category === ts.DiagnosticCategory.Warning) {
            return "warning";
        }
        if (diagnostic.category === ts.DiagnosticCategory.Suggestion) {
            return "info";
        }
        return "error";
    }

    function parameterTextFromSignature(signature, name) {
        signature = String(signature || "");
        name = String(name || "");
        var openIndex = -1;
        if (name) {
            openIndex = signature.indexOf(name + "(");
            if (openIndex >= 0) {
                openIndex += name.length;
            }
        }
        if (openIndex < 0) {
            openIndex = signature.indexOf("(");
        }
        if (openIndex < 0) {
            return null;
        }
        var depth = 0;
        for (var i = openIndex; i < signature.length; i++) {
            var ch = signature.charAt(i);
            if (ch === "(") {
                depth++;
            } else if (ch === ")") {
                depth--;
                if (depth === 0) {
                    return signature.substring(openIndex + 1, i);
                }
            }
        }
        return null;
    }

    function signatureHasParameters(signature, name) {
        var parameters = parameterTextFromSignature(signature, name);
        return parameters === null || parameters.trim().length > 0;
    }

    function literalMemberContextFromLine(line) {
        var match = /((?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\[[^\]\r\n]*\]|\([^()\r\n]*\)|\{[^{}\r\n]*\}))\.([A-Za-z_$][A-Za-z0-9_$]*)?$/.exec(line);
        return match ? match[1] : "";
    }

    function memberContextFromText(text, offset) {
        var lineStart = Math.max(text.lastIndexOf("\n", offset - 1), text.lastIndexOf("\r", offset - 1)) + 1;
        var line = text.substring(lineStart, offset);
        var match = /((?:[A-Za-z_$][A-Za-z0-9_$]*\.)*[A-Za-z_$][A-Za-z0-9_$]*)\.([A-Za-z_$][A-Za-z0-9_$]*)?$/.exec(line);
        return match ? match[1] : literalMemberContextFromLine(line);
    }

    function isFunctionLikeKind(kind) {
        kind = String(kind || "");
        return kind === "function" || kind === "method" || kind === "constructor";
    }

    function isNoisyCompletionEntry(entry) {
        return String(entry && entry.kind || "").toLowerCase() === "warning";
    }

    function completionSnippet(name, kind, signature) {
        if (!isFunctionLikeKind(kind) || !/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name || "")) {
            return "";
        }
        return name + (signatureHasParameters(signature, name) ? "(${1})" : "()");
    }

    function completionMatchTier(value, prefix) {
        value = String(value || "").toLowerCase();
        prefix = String(prefix || "").toLowerCase();
        if (!prefix) {
            return 0;
        }
        var directIndex = value.indexOf(prefix);
        if (directIndex === 0) {
            return 0;
        }
        if (directIndex > 0) {
            return 1;
        }
        var valueIndex = -1;
        for (var i = 0; i < prefix.length; i++) {
            valueIndex = value.indexOf(prefix.charAt(i), valueIndex + 1);
            if (valueIndex < 0) {
                return -1;
            }
        }
        return 2;
    }

    function matchesCompletionFilter(value, prefix) {
        return completionMatchTier(value, prefix) >= 0;
    }

    function filterAndRankCompletionEntries(entries, prefix) {
        entries = entries || [];
        prefix = String(prefix || "");
        if (!prefix) {
            return entries.filter(function(entry) {
                return !isNoisyCompletionEntry(entry);
            });
        }
        var startsWithMatches = [];
        var substringMatches = [];
        var subsequenceMatches = [];
        entries.forEach(function(entry) {
            if (isNoisyCompletionEntry(entry)) {
                return;
            }
            var tier = completionMatchTier(entry && entry.name, prefix);
            if (tier === 0) {
                startsWithMatches.push(entry);
            } else if (tier === 1) {
                substringMatches.push(entry);
            } else if (tier === 2) {
                subsequenceMatches.push(entry);
            }
        });
        return startsWithMatches.concat(substringMatches, subsequenceMatches);
    }

    function annotationFromDiagnostic(ts, text, diagnostic) {
        var start = Number(diagnostic && diagnostic.start) || 0;
        var pos = positionFromIndex(text, start);
        return {
            row: pos.row,
            column: pos.column,
            text: flattenDiagnostic(ts, diagnostic),
            type: diagnosticType(ts, diagnostic),
            raw: String(diagnostic && diagnostic.code || TS_DIAGNOSTIC_SOURCE),
            source: TS_DIAGNOSTIC_SOURCE
        };
    }

    function createLanguageService(config) {
        config = config || {};
        var ts = config.ts || global.ts;
        var files = Object.create(null);
        var versions = Object.create(null);
        var ready = false;
        var reason = "";
        var service = null;
        var currentText = "";
        var currentFile = normalizeDocumentUri(config.documentUri);
        var executionProfile = normalizeExecutionProfile(config.executionProfile, currentFile);
        var expectedTypeScriptVersion = String(config.typescriptVersion || TYPESCRIPT_VERSION);
        var defaultLib = defaultLibForProfile(executionProfile);
        var libraryUris = [];
        var rootLibraryUris = [];
        var libraryAssetUrls = Object.create(null);
        var projectSourceUris = [];
        var projectSourceUriSet = Object.create(null);
        var projectTypeUris = [];
        var projectTypeUriSet = Object.create(null);
        var projectDirectories = Object.create(null);
        var projectSnapshotSchemaRevision =
            Math.max(0, Number(config.projectSnapshotSchemaRevision) || 0);
        var projectSourceInventoryFingerprint =
            String(config.projectSourceInventoryFingerprint || "");
        var projectSourceFileCount =
            Math.max(0, Number(config.projectSourceFileCount) || 0);
        var projectSourceByteLength =
            Math.max(0, Number(config.projectSourceByteLength) || 0);
        var projectSnapshotReady = config.projectSnapshotReady === true &&
            projectSnapshotSchemaRevision === 1;
        var projectSnapshotUpdateCount = 0;
        var projectSnapshotChangedFileCount = 0;
        var dependencyTypeNames = copyArray(config.dependencyTypeNames)
            .map(function(name) { return String(name || ""); })
            .filter(function(name, index, names) {
                return /^[A-Za-z0-9_.-]+$/.test(name) && names.indexOf(name) === index;
            })
            .sort();
        var dependencyBoundaryCode = String(config.dependencyBoundaryCode || "");
        var dependencyBoundaryDetail = String(config.dependencyBoundaryDetail || "");
        var projectRootUri = normalizeFileName(config.rootUri || CURRENT_DIR);
        var disposed = false;
        var diagnosticsLimit = Math.max(1, Number(config.diagnosticsLimit) || 100);
        var completionLimit = Math.max(1, Number(config.completionLimit) || 300);

        function compilerOptions() {
            if (executionProfile === PROFILE_RHINO) {
                return {
                    allowJs: false,
                    allowSyntheticDefaultImports: true,
                    alwaysStrict: true,
                    checkJs: false,
                    esModuleInterop: true,
                    forceConsistentCasingInFileNames: true,
                    ignoreDeprecations: "6.0",
                    incremental: false,
                    inlineSourceMap: false,
                    inlineSources: false,
                    jsx: ts.JsxEmit.React,
                    jsxFactory: "__autojs6Tsx",
                    jsxFragmentFactory: "__autojs6TsxFragment",
                    lib: [EXECUTION_DEFAULT_LIB],
                    module: ts.ModuleKind.CommonJS,
                    moduleResolution: ts.ModuleResolutionKind.Node10 || ts.ModuleResolutionKind.NodeJs,
                    newLine: ts.NewLineKind.LineFeed,
                    noEmitOnError: true,
                    noLib: false,
                    outDir: "/outputs",
                    rootDir: "/sources",
                    skipLibCheck: false,
                    sourceMap: true,
                    strict: true,
                    target: ts.ScriptTarget.ES2018,
                    types: dependencyTypeNames.slice(0)
                };
            }
            if (executionProfile === PROFILE_NODE) {
                return {
                    allowJs: false,
                    allowSyntheticDefaultImports: true,
                    alwaysStrict: true,
                    checkJs: false,
                    esModuleInterop: true,
                    forceConsistentCasingInFileNames: true,
                    ignoreDeprecations: "6.0",
                    incremental: false,
                    inlineSourceMap: false,
                    inlineSources: false,
                    lib: [EXECUTION_DEFAULT_LIB],
                    module: ts.ModuleKind.NodeNext,
                    moduleResolution: ts.ModuleResolutionKind.NodeNext,
                    newLine: ts.NewLineKind.LineFeed,
                    noEmitOnError: true,
                    noLib: false,
                    outDir: "/outputs",
                    rootDir: "/sources",
                    skipLibCheck: false,
                    sourceMap: true,
                    strict: true,
                    target: ts.ScriptTarget.ES2018,
                    types: dependencyTypeNames.slice(0)
                };
            }
            return {
                allowJs: true,
                checkJs: !!config.checkJs,
                noEmit: true,
                allowNonTsExtensions: true,
                target: ts.ScriptTarget.ES2022 || ts.ScriptTarget.ES2020 || ts.ScriptTarget.Latest,
                module: ts.ModuleKind.CommonJS,
                moduleResolution: ts.ModuleResolutionKind.Bundler || ts.ModuleResolutionKind.NodeJs,
                jsx: ts.JsxEmit && ts.JsxEmit.Preserve,
                lib: [EDITOR_DEFAULT_LIB],
                strict: false,
                skipLibCheck: true,
                skipDefaultLibCheck: true,
                types: dependencyTypeNames.slice(0)
            };
        }

        function addFile(fileName, text) {
            fileName = normalizeFileName(fileName);
            files[fileName] = String(text || "");
            versions[fileName] = versions[fileName] || "0";
            return fileName;
        }

        function bump(fileName) {
            fileName = normalizeFileName(fileName);
            versions[fileName] = String((Number(versions[fileName]) || 0) + 1);
        }

        function rememberProjectPath(fileName) {
            fileName = normalizeFileName(fileName);
            var directory = fileName.substring(0, fileName.lastIndexOf("/")) || projectRootUri;
            while (directory && directory.indexOf(projectRootUri) === 0) {
                projectDirectories[directory] = projectDirectories[directory] || Object.create(null);
                if (directory === projectRootUri) {
                    break;
                }
                var parent = directory.substring(0, directory.lastIndexOf("/")) || projectRootUri;
                projectDirectories[parent] = projectDirectories[parent] || Object.create(null);
                projectDirectories[parent][directory.substring(parent.length + 1)] = true;
                if (parent === directory) {
                    break;
                }
                directory = parent;
            }
        }

        function configureProjectFiles() {
            projectDirectories[projectRootUri] = projectDirectories[projectRootUri] || Object.create(null);
            rememberProjectPath(currentFile);
            copyArray(config.projectSourceFileUris).forEach(function(uri) {
                var normalized = normalizeFileName(uri);
                if (normalized.indexOf(projectRootUri + "/") !== 0 ||
                    hasOwn(projectSourceUriSet, normalized)) {
                    return;
                }
                projectSourceUriSet[normalized] = true;
                projectSourceUris.push(normalized);
                rememberProjectPath(normalized);
            });
            projectSourceUris.sort();
            projectSnapshotReady = projectSnapshotReady &&
                projectSourceUris.length > 0 && hasOwn(projectSourceUriSet, currentFile);
            copyArray(config.projectTypeFileUris).forEach(function(uri) {
                var normalized = normalizeFileName(uri);
                if (normalized.indexOf(projectRootUri + "/") !== 0 ||
                    normalized === currentFile || hasOwn(projectTypeUriSet, normalized)) {
                    return;
                }
                projectTypeUriSet[normalized] = true;
                projectTypeUris.push(normalized);
                rememberProjectPath(normalized);
            });
            projectTypeUris.sort();
        }

        function ensureProjectSourceFile(fileName) {
            fileName = normalizeFileName(fileName);
            if (hasOwn(files, fileName)) {
                return true;
            }
            if (!hasOwn(projectSourceUriSet, fileName)) {
                return false;
            }
            var projectSourceTextByUri = config.projectSourceTextByUri || {};
            var text = hasOwn(projectSourceTextByUri, fileName) ?
                projectSourceTextByUri[fileName] : loadText(fileName);
            if (text === null || text === undefined) {
                return false;
            }
            addFile(fileName, text);
            return true;
        }

        function ensureProjectTypeFile(fileName) {
            fileName = normalizeFileName(fileName);
            if (hasOwn(files, fileName)) {
                return true;
            }
            if (!hasOwn(projectTypeUriSet, fileName)) {
                return false;
            }
            var projectTypeTextByUri = config.projectTypeTextByUri || {};
            var text = hasOwn(projectTypeTextByUri, fileName) ?
                projectTypeTextByUri[fileName] : loadText(fileName);
            if (text === null || text === undefined) {
                return false;
            }
            addFile(fileName, text);
            return true;
        }

        function readConfiguredText(uri, assetUrl) {
            var libraryTextByUri = config.libraryTextByUri || {};
            if (hasOwn(libraryTextByUri, uri)) {
                return libraryTextByUri[uri];
            }
            var relativeUri = uri.replace(/^file:\/\/\//, "");
            if (hasOwn(libraryTextByUri, relativeUri)) {
                return libraryTextByUri[relativeUri];
            }
            return loadText(assetUrl);
        }

        function ensureTsLibrary(fileName) {
            fileName = normalizeFileName(fileName);
            if (hasOwn(files, fileName)) {
                return true;
            }
            if (fileName.indexOf(TS_LIB_ROOT) !== 0) {
                return false;
            }
            var name = fileName.substring(TS_LIB_ROOT.length);
            if (!SAFE_DECLARATION_ASSET_NAME.test(name)) {
                return false;
            }
            var text = readConfiguredText(fileName, AUTOJS6_ASSET_ROOT + "typescript/" + name);
            if (text === null || text === undefined) {
                return false;
            }
            libraryUris.push(addFile(fileName, text));
            return true;
        }

        function ensureConfiguredLibrary(fileName) {
            fileName = normalizeFileName(fileName);
            if (hasOwn(files, fileName)) {
                return true;
            }
            if (fileName.indexOf(TS_LIB_ROOT) === 0) {
                return ensureTsLibrary(fileName);
            }
            var assetUrl = libraryAssetUrls[fileName];
            if (!assetUrl) {
                return false;
            }
            var text = readConfiguredText(fileName, assetUrl);
            if (text === null || text === undefined) {
                return false;
            }
            libraryUris.push(addFile(fileName, text));
            return true;
        }

        function configureRootLibraries() {
            var configured = copyArray(config.libraryUris);
            if (!configured.length) {
                configured = defaultLibraryUrisForProfile(executionProfile);
            }
            configured.forEach(function(uri) {
                var normalized = normalizeFileName(uri);
                var assetUrl = assetUrlForLibraryUri(normalized);
                if (!assetUrl || rootLibraryUris.indexOf(normalized) >= 0) {
                    return;
                }
                rootLibraryUris.push(normalized);
                libraryAssetUrls[normalized] = assetUrl;
            });
            if (rootLibraryUris.indexOf(TS_LIB_ROOT + defaultLib) < 0) {
                rootLibraryUris.unshift(TS_LIB_ROOT + defaultLib);
            }
        }

        function initialize() {
            if (disposed) {
                reason = "typescript language service disposed";
                return false;
            }
            if (ready || reason) {
                return ready;
            }
            if (!ts || typeof ts.createLanguageService !== "function") {
                reason = "typescript.js unavailable";
                return false;
            }
            if (String(ts.version || "") !== expectedTypeScriptVersion) {
                reason = "TypeScript version mismatch: expected " + expectedTypeScriptVersion +
                    ", got " + String(ts.version || "unknown");
                return false;
            }
            try {
                configureRootLibraries();
                configureProjectFiles();
                rootLibraryUris.forEach(ensureConfiguredLibrary);
                projectSourceUris.forEach(function(fileName) {
                    if (fileName !== currentFile) {
                        ensureProjectSourceFile(fileName);
                    }
                });
                addFile(currentFile, "");
                projectSnapshotReady = projectSnapshotReady &&
                    projectSourceUris.every(function(fileName) {
                        return hasOwn(files, fileName);
                    });
                if (!hasOwn(files, TS_LIB_ROOT + defaultLib)) {
                    reason = "TypeScript default lib missing: " + defaultLib;
                    return false;
                }
                if (!hasOwn(files, AUTOJS6_CORE_LIB)) {
                    reason = "AutoJs6 core declaration lib missing";
                    return false;
                }
                if (!hasOwn(files, AUTOJS6_COMPATIBILITY_LIB)) {
                    reason = "AutoJs6 compatibility declaration lib missing";
                    return false;
                }
                service = ts.createLanguageService({
                    getCompilationSettings: compilerOptions,
                    getScriptFileNames: function() {
                        return [currentFile]
                            .concat(projectSourceUris.filter(function(fileName) {
                                return fileName !== currentFile;
                            }))
                            .concat(rootLibraryUris)
                            .filter(function(fileName) { return hasOwn(files, fileName); });
                    },
                    getScriptVersion: function(fileName) {
                        return versions[normalizeFileName(fileName)] || "0";
                    },
                    getScriptSnapshot: function(fileName) {
                        fileName = normalizeFileName(fileName);
                        ensureConfiguredLibrary(fileName);
                        ensureProjectSourceFile(fileName);
                        ensureProjectTypeFile(fileName);
                        return hasOwn(files, fileName) ? ts.ScriptSnapshot.fromString(files[fileName]) : undefined;
                    },
                    getScriptKind: function(fileName) {
                        return scriptKindForFileName(ts, normalizeFileName(fileName));
                    },
                    getCurrentDirectory: function() {
                        return projectRootUri;
                    },
                    getDefaultLibFileName: function() {
                        return TS_LIB_ROOT + defaultLib;
                    },
                    readFile: function(fileName) {
                        fileName = normalizeFileName(fileName);
                        ensureConfiguredLibrary(fileName);
                        ensureProjectSourceFile(fileName);
                        ensureProjectTypeFile(fileName);
                        return hasOwn(files, fileName) ? files[fileName] : undefined;
                    },
                    fileExists: function(fileName) {
                        fileName = normalizeFileName(fileName);
                        return hasOwn(files, fileName) || hasOwn(projectSourceUriSet, fileName) ||
                            hasOwn(projectTypeUriSet, fileName) ||
                            ensureConfiguredLibrary(fileName);
                    },
                    directoryExists: function(directoryName) {
                        directoryName = normalizeFileName(directoryName);
                        return hasOwn(projectDirectories, directoryName) ||
                            directoryName.indexOf("file:///autojs6/typescript") === 0 ||
                            directoryName.indexOf("file:///autojs6/types") === 0;
                    },
                    getDirectories: function(directoryName) {
                        var children = projectDirectories[normalizeFileName(directoryName)];
                        return children ? Object.keys(children).sort() : [];
                    },
                    useCaseSensitiveFileNames: function() {
                        return true;
                    },
                    getNewLine: function() {
                        return "\n";
                    }
                });
                ready = true;
                return true;
            } catch (error) {
                reason = String(error && error.message ? error.message : error);
                notify(config, "ACE TS language service initialization failed: " + reason, error);
                return false;
            }
        }

        function setDocumentUri(documentUri) {
            if (disposed) {
                return false;
            }
            var nextFile = normalizeDocumentUri(documentUri);
            if (nextFile === currentFile) {
                return false;
            }
            var previousFile = currentFile;
            currentFile = nextFile;
            if (ready) {
                delete files[previousFile];
                delete versions[previousFile];
                addFile(currentFile, currentText);
                bump(currentFile);
            }
            return true;
        }

        function updateDocument(text, documentUri) {
            if (disposed) {
                return false;
            }
            if (documentUri) {
                setDocumentUri(documentUri);
            }
            if (!initialize()) {
                return false;
            }
            text = String(text || "");
            if (text !== currentText) {
                currentText = text;
                files[currentFile] = currentText;
                bump(currentFile);
            }
            return true;
        }

        function updateProjectSnapshot(snapshot) {
            snapshot = snapshot || {};
            if (disposed || !initialize()) {
                return {
                    updated: false,
                    reason: disposed ?
                        "typescript language service disposed" :
                        (reason || "typescript language service unavailable")
                };
            }
            var nextSchemaRevision =
                Math.max(0, Number(snapshot.projectSnapshotSchemaRevision) || 0);
            var nextUris = copyArray(snapshot.projectSourceFileUris)
                .map(normalizeFileName)
                .filter(function(uri, index, uris) {
                    return uri.indexOf(projectRootUri + "/") === 0 &&
                        uris.indexOf(uri) === index;
                })
                .sort();
            var nextFileCount =
                Math.max(0, Number(snapshot.projectSourceFileCount) || 0);
            if (snapshot.projectSnapshotReady !== true || nextSchemaRevision !== 1 ||
                nextFileCount !== projectSourceUris.length ||
                nextUris.length !== projectSourceUris.length ||
                nextUris.some(function(uri, index) {
                    return uri !== projectSourceUris[index];
                }) || nextUris.indexOf(currentFile) < 0) {
                return {
                    updated: false,
                    reason: "project snapshot topology changed"
                };
            }

            // Read every sibling before publishing any update. A failed bridge read therefore
            // leaves the resident Language Service and all script versions untouched.
            var configuredTextByUri = snapshot.projectSourceTextByUri || {};
            var nextTextByUri = Object.create(null);
            for (var index = 0; index < nextUris.length; index++) {
                var uri = nextUris[index];
                if (uri === currentFile) {
                    continue;
                }
                var text = hasOwn(configuredTextByUri, uri) ?
                    configuredTextByUri[uri] : loadText(uri);
                if (text === null || text === undefined) {
                    return {
                        updated: false,
                        reason: "project snapshot source unavailable: " + uri
                    };
                }
                nextTextByUri[uri] = String(text);
            }

            var changedFileCount = 0;
            nextUris.forEach(function(uri) {
                if (uri === currentFile) {
                    return;
                }
                var nextText = nextTextByUri[uri];
                if (!hasOwn(files, uri) || files[uri] !== nextText) {
                    files[uri] = nextText;
                    bump(uri);
                    changedFileCount++;
                }
            });
            projectSourceInventoryFingerprint =
                String(snapshot.projectSourceInventoryFingerprint || "");
            projectSourceFileCount = nextFileCount;
            projectSourceByteLength =
                Math.max(0, Number(snapshot.projectSourceByteLength) || 0);
            projectSnapshotSchemaRevision = nextSchemaRevision;
            projectSnapshotReady = true;
            projectSnapshotUpdateCount++;
            projectSnapshotChangedFileCount += changedFileCount;
            return {
                updated: true,
                changedFileCount: changedFileCount,
                updateCount: projectSnapshotUpdateCount
            };
        }

        function syncSession(session, documentText) {
            return updateDocument(typeof documentText === "string" ? documentText : textFromSession(session));
        }

        function signatureForCompletionEntry(entry, offset) {
            if (!entry || !isFunctionLikeKind(entry.kind) || typeof service.getCompletionEntryDetails !== "function") {
                return "";
            }
            try {
                var details = service.getCompletionEntryDetails(
                    currentFile,
                    offset,
                    entry.name || "",
                    {},
                    entry.source,
                    {}
                );
                return details ? partsToString(details.displayParts) : "";
            } catch (ignore) {
                return "";
            }
        }

        function getCompletions(session, pos, prefix, callback, documentText) {
            callback = typeof callback === "function" ? callback : noop;
            try {
                if (!syncSession(session, documentText)) {
                    callback(null, []);
                    return false;
                }
                var offset = positionToIndex(session, pos);
                var memberContext = memberContextFromText(currentText, offset);
                var result = service.getCompletionsAtPosition(currentFile, offset, {
                    includeExternalModuleExports: false,
                    includeInsertTextCompletions: true,
                    triggerCharacter: memberContext ? "." : undefined
                });
                var completionEntries = filterAndRankCompletionEntries(
                    result && result.entries,
                    prefix
                );
                var incomplete = completionEntries.length > completionLimit;
                var completions = completionEntries
                    .slice(0, completionLimit)
                    .map(function(entry, index) {
                        var name = entry.name || "";
                        var caption = name;
                        var insertText = entry.insertText || name;
                        var completion = {
                            caption: caption,
                            value: insertText,
                            meta: entry.kind || "ts",
                            score: 1200 - Math.min(index, 300),
                            docText: entry.kindModifiers || "",
                            sortText: entry.sortText || "",
                            autojs6Ts: true,
                            autojs6Incomplete: incomplete
                        };
                        var replacementSpan = entry.replacementSpan;
                        if (replacementSpan && typeof replacementSpan.start === "number") {
                            var replacementStart = Math.max(0, replacementSpan.start);
                            var replacementEnd = replacementStart + Math.max(0, Number(replacementSpan.length) || 0);
                            completion.replaceRange = {
                                start: positionFromIndex(currentText, replacementStart),
                                end: positionFromIndex(currentText, replacementEnd)
                            };
                        }
                        var shouldResolveSignature = memberContext ||
                            (prefix && (
                                matchesCompletionFilter(name, prefix) ||
                                matchesCompletionFilter(caption, prefix)
                            ));
                        var signature = shouldResolveSignature ? signatureForCompletionEntry(entry, offset) : "";
                        var replacementStartsInString = replacementSpan &&
                            /["'`]$/.test(currentText.substring(0, replacementSpan.start));
                        var snippet = !entry.insertText && !replacementStartsInString ?
                            completionSnippet(name, entry.kind, signature) : "";
                        if (snippet) {
                            completion.snippet = snippet;
                        } else if (entry.isSnippet && entry.insertText) {
                            completion.snippet = entry.insertText;
                        }
                        if (signature) {
                            completion.docText = signature;
                        }
                        return completion;
                    });
                callback(null, completions);
                return true;
            } catch (error) {
                notify(config, "ACE TS completion failed: " + error, error);
                callback(error, []);
                return false;
            }
        }

        function getHover(session, pos, documentText) {
            try {
                if (!syncSession(session, documentText)) {
                    return null;
                }
                var offset = positionToIndex(session, pos);
                var info = service.getQuickInfoAtPosition(currentFile, offset);
                if (!info) {
                    return null;
                }
                var display = partsToString(info.displayParts);
                var documentation = partsToString(info.documentation);
                var tags = (info.tags || []).map(function(tag) {
                    return "@" + tag.name + " " + partsToString(tag.text);
                }).join("\n");
                var docText = [display, documentation, tags].filter(Boolean).join("\n");
                if (!docText) {
                    return null;
                }
                var range = null;
                if (info.textSpan) {
                    var start = positionFromIndex(currentText, info.textSpan.start);
                    var end = positionFromIndex(currentText, info.textSpan.start + info.textSpan.length);
                    range = { start: start, end: end };
                }
                return {
                    caption: display || "TypeScript",
                    value: display,
                    meta: "ts",
                    docText: docText,
                    signature: display,
                    range: range
                };
            } catch (error) {
                notify(config, "ACE TS hover failed: " + error, error);
                return null;
            }
        }

        function getSignatureHelp(session, pos, documentText) {
            try {
                if (!syncSession(session, documentText)) {
                    return null;
                }
                var offset = positionToIndex(session, pos);
                var help = service.getSignatureHelpItems(currentFile, offset, {
                    triggerReason: { kind: "invoked" }
                });
                if (!help || !help.items || !help.items.length) {
                    return null;
                }
                var item = help.items[Math.max(0, Number(help.selectedItemIndex) || 0)] || help.items[0];
                var separator = partsToString(item.separatorDisplayParts) || ", ";
                var parameters = (item.parameters || []).map(function(parameter) {
                    return partsToString(parameter.displayParts);
                });
                var signature = partsToString(item.prefixDisplayParts) +
                    parameters.join(separator) +
                    partsToString(item.suffixDisplayParts);
                if (!signature) {
                    return null;
                }
                return {
                    caption: signature.replace(/\(.*/, ""),
                    signature: signature,
                    parameters: parameters,
                    activeParameter: Math.max(0, Number(help.argumentIndex) || 0),
                    docText: partsToString(item.documentation)
                };
            } catch (error) {
                notify(config, "ACE TS signature help failed: " + error, error);
                return null;
            }
        }

        function getDefinition(session, pos, documentText) {
            try {
                if (!syncSession(session, documentText)) {
                    return null;
                }
                var offset = positionToIndex(session, pos);
                var result = typeof service.getDefinitionAndBoundSpan === "function" ?
                    service.getDefinitionAndBoundSpan(currentFile, offset) : null;
                var definitions = result && result.definitions;
                if ((!definitions || !definitions.length) &&
                    typeof service.getDefinitionAtPosition === "function") {
                    definitions = service.getDefinitionAtPosition(currentFile, offset);
                }
                if (!definitions || !definitions.length) {
                    return null;
                }
                for (var index = 0; index < definitions.length; index += 1) {
                    var definition = definitions[index];
                    var targetFile = normalizeFileName(definition && definition.fileName);
                    var isProjectSource = hasOwn(projectSourceUriSet, targetFile);
                    var isDependencyType = hasOwn(projectTypeUriSet, targetFile);
                    if ((!isProjectSource && !isDependencyType) || !hasOwn(files, targetFile)) {
                        continue;
                    }
                    var targetText = files[targetFile];
                    var textSpan = definition && definition.textSpan || {};
                    var startOffset = Math.max(
                        0,
                        Math.min(Number(textSpan.start) || 0, targetText.length)
                    );
                    var endOffset = Math.max(
                        startOffset,
                        Math.min(
                            startOffset + Math.max(0, Number(textSpan.length) || 0),
                            targetText.length
                        )
                    );
                    var start = positionFromIndex(targetText, startOffset);
                    var end = positionFromIndex(targetText, endOffset);
                    return {
                        uri: targetFile,
                        line: start.row,
                        column: start.column,
                        endLine: end.row,
                        endColumn: end.column,
                        name: String(definition.name || ""),
                        kind: String(definition.kind || ""),
                        authority: isProjectSource ? "projectSource" : "dependencyDeclaration"
                    };
                }
                return null;
            } catch (error) {
                notify(config, "ACE TS definition failed: " + error, error);
                return null;
            }
        }

        function getRename(session, pos, documentText) {
            try {
                if (!projectSnapshotReady || !syncSession(session, documentText) ||
                    typeof service.getRenameInfo !== "function" ||
                    typeof service.findRenameLocations !== "function" ||
                    !projectSourceUris.every(function(uri) { return hasOwn(files, uri); })) {
                    return null;
                }
                var offset = positionToIndex(session, pos);
                var renameInfo = service.getRenameInfo(currentFile, offset, {
                    allowRenameOfImportPath: false
                });
                var triggerSpan = renameInfo && renameInfo.triggerSpan || {};
                var triggerStart = Number(triggerSpan.start);
                var triggerLength = Number(triggerSpan.length);
                if (!renameInfo || renameInfo.canRename !== true ||
                    !finiteInteger(triggerStart) || !finiteInteger(triggerLength) ||
                    triggerStart < 0 || triggerLength < 1 ||
                    triggerStart + triggerLength > currentText.length) {
                    return null;
                }
                var symbolName = currentText.substring(
                    triggerStart,
                    triggerStart + triggerLength
                );
                if (!IDENTIFIER.test(symbolName) ||
                    String(renameInfo.displayName || symbolName) !== symbolName) {
                    return null;
                }
                var locations = service.findRenameLocations(
                    currentFile,
                    offset,
                    false,
                    false,
                    false
                ) || [];
                if (!locations.length) {
                    return null;
                }
                var editsByUri = Object.create(null);
                var totalEdits = 0;
                for (var index = 0; index < locations.length; index += 1) {
                    var location = locations[index];
                    var targetFile = normalizeFileName(location && location.fileName);
                    var span = location && location.textSpan || {};
                    var start = Number(span.start);
                    var length = Number(span.length);
                    var targetText = files[targetFile];
                    if (!hasOwn(projectSourceUriSet, targetFile) ||
                        typeof targetText !== "string" ||
                        String(location && location.prefixText || "") ||
                        String(location && location.suffixText || "") ||
                        !finiteInteger(start) || !finiteInteger(length) ||
                        start < 0 || length !== symbolName.length ||
                        start + length > targetText.length ||
                        targetText.substring(start, start + length) !== symbolName) {
                        return null;
                    }
                    var edits = editsByUri[targetFile] || (editsByUri[targetFile] = []);
                    edits.push({
                        startOffset: start,
                        endOffset: start + length
                    });
                    totalEdits += 1;
                    if (edits.length > MAX_RENAME_EDITS_PER_FILE ||
                        totalEdits > MAX_RENAME_TOTAL_EDITS) {
                        return null;
                    }
                }
                var targetUris = Object.keys(editsByUri).sort();
                if (targetUris.length < 2 || targetUris.length > MAX_RENAME_FILES ||
                    targetUris.indexOf(currentFile) < 0) {
                    return null;
                }
                var renameFiles = [];
                for (var fileIndex = 0; fileIndex < targetUris.length; fileIndex += 1) {
                    var uri = targetUris[fileIndex];
                    var fileEdits = editsByUri[uri].sort(function(left, right) {
                        return left.startOffset - right.startOffset ||
                            left.endOffset - right.endOffset;
                    });
                    for (var editIndex = 1; editIndex < fileEdits.length; editIndex += 1) {
                        if (fileEdits[editIndex].startOffset <=
                            fileEdits[editIndex - 1].startOffset ||
                            fileEdits[editIndex].startOffset <
                            fileEdits[editIndex - 1].endOffset) {
                            return null;
                        }
                    }
                    renameFiles.push({ uri: uri, edits: fileEdits });
                }
                return {
                    symbolName: symbolName,
                    files: renameFiles
                };
            } catch (error) {
                notify(config, "ACE TS project rename failed: " + error, error);
                return null;
            }
        }

        function codeActionFormatOptions(text) {
            return {
                convertTabsToSpaces: true,
                indentSize: 4,
                indentStyle: ts.IndentStyle && ts.IndentStyle.Smart,
                insertSpaceAfterCommaDelimiter: true,
                insertSpaceAfterSemicolonInForStatements: true,
                insertSpaceBeforeAndAfterBinaryOperators: true,
                newLineCharacter: String(text || "").indexOf("\r\n") >= 0 ? "\r\n" : "\n",
                placeOpenBraceOnNewLineForControlBlocks: false,
                placeOpenBraceOnNewLineForFunctions: false,
                semicolons: ts.SemicolonPreference && ts.SemicolonPreference.Insert,
                tabSize: 4
            };
        }

        function codeActionPreferences(text) {
            var singleQuotes = (String(text || "").match(/(?:from\s+|require\s*\()'[^'\r\n]+'/g) || []).length;
            var doubleQuotes = (String(text || "").match(/(?:from\s+|require\s*\()"[^"\r\n]+"/g) || []).length;
            return {
                allowTextChangesInNewFiles: false,
                importModuleSpecifierEnding: executionProfile === PROFILE_NODE ? "js" : "auto",
                importModuleSpecifierPreference: "shortest",
                includePackageJsonAutoImports: "off",
                preferTypeOnlyAutoImports: false,
                quotePreference: singleQuotes > doubleQuotes ? "single" : "double"
            };
        }

        function finiteInteger(value) {
            value = Number(value);
            return isFinite(value) && Math.floor(value) === value;
        }

        function normalizeCodeFix(action, diagnosticCode) {
            if (!action || (action.fixName !== "import" && action.fixName !== "spelling")) {
                return null;
            }
            if (action.commands && action.commands.length) {
                return null;
            }
            var title = String(action.description || "");
            if (!title || title.length > MAX_CODE_ACTION_TITLE_LENGTH || /[\u0000-\u001f\u007f]/.test(title)) {
                return null;
            }
            if (!Array.isArray(action.changes) || action.changes.length !== 1) {
                return null;
            }
            var fileChange = action.changes[0];
            if (!fileChange || fileChange.isNewFile === true ||
                normalizeFileName(fileChange.fileName) !== currentFile ||
                !Array.isArray(fileChange.textChanges) ||
                !fileChange.textChanges.length ||
                fileChange.textChanges.length > MAX_CODE_ACTION_EDITS) {
                return null;
            }
            var replacementLength = 0;
            var edits = fileChange.textChanges.map(function(change) {
                var span = change && change.span || {};
                var start = Number(span.start);
                var length = Number(span.length);
                var newText = change && typeof change.newText === "string" ? change.newText : null;
                if (!finiteInteger(start) || !finiteInteger(length) || start < 0 || length < 0 ||
                    start + length > currentText.length || newText === null) {
                    return null;
                }
                replacementLength += newText.length;
                return {
                    startOffset: start,
                    endOffset: start + length,
                    newText: newText
                };
            });
            if (replacementLength > MAX_CODE_ACTION_REPLACEMENT_LENGTH || edits.some(function(edit) {
                return !edit;
            })) {
                return null;
            }
            edits.sort(function(left, right) {
                return left.startOffset - right.startOffset || left.endOffset - right.endOffset;
            });
            for (var index = 0; index < edits.length; index++) {
                var edit = edits[index];
                if (edit.startOffset === edit.endOffset && !edit.newText) {
                    return null;
                }
                if (index > 0 && (
                    edit.startOffset <= edits[index - 1].startOffset ||
                    edit.startOffset < edits[index - 1].endOffset
                )) {
                    return null;
                }
            }
            return {
                kind: action.fixName === "import" ?
                    CODE_ACTION_KIND_AUTO_IMPORT : CODE_ACTION_KIND_SPELLING,
                title: title,
                diagnosticCode: diagnosticCode,
                edits: edits
            };
        }

        function diagnosticsAtOffset(offset) {
            var diagnostics = []
                .concat(service.getSyntacticDiagnostics(currentFile) || [])
                .concat(service.getSemanticDiagnostics(currentFile) || []);
            return diagnostics.filter(function(diagnostic) {
                var code = Number(diagnostic && diagnostic.code);
                var start = Math.max(0, Number(diagnostic && diagnostic.start) || 0);
                var length = Math.max(0, Number(diagnostic && diagnostic.length) || 0);
                var end = start + length;
                return !EDITOR_SYNTHETIC_DIAGNOSTIC_CODES[code] &&
                    (projectSnapshotReady || !SINGLE_FILE_UNRELIABLE_DIAGNOSTIC_CODES[code]) &&
                    start <= offset && offset <= end;
            });
        }

        function getCodeActions(session, pos, documentText) {
            try {
                if (!syncSession(session, documentText) ||
                    typeof service.getCodeFixesAtPosition !== "function") {
                    return [];
                }
                var offset = positionToIndex(session, pos);
                var formatOptions = codeActionFormatOptions(currentText);
                var preferences = codeActionPreferences(currentText);
                var seen = Object.create(null);
                var actions = [];
                diagnosticsAtOffset(offset).some(function(diagnostic) {
                    var code = Number(diagnostic.code);
                    var start = Math.max(0, Number(diagnostic.start) || 0);
                    var end = Math.min(
                        currentText.length,
                        start + Math.max(0, Number(diagnostic.length) || 0)
                    );
                    var fixes = service.getCodeFixesAtPosition(
                        currentFile,
                        start,
                        end,
                        [code],
                        formatOptions,
                        preferences
                    ) || [];
                    fixes.forEach(function(fix) {
                        if (actions.length >= MAX_CODE_ACTIONS) {
                            return;
                        }
                        var action = normalizeCodeFix(fix, code);
                        if (!action) {
                            return;
                        }
                        var identity = action.kind + "\n" + action.title + "\n" +
                            JSON.stringify(action.edits);
                        if (!seen[identity]) {
                            seen[identity] = true;
                            actions.push(action);
                        }
                    });
                    return actions.length >= MAX_CODE_ACTIONS;
                });
                return actions;
            } catch (error) {
                notify(config, "ACE TS code actions failed: " + error, error);
                return [];
            }
        }

        function getDiagnostics(session, documentText) {
            try {
                if (!syncSession(session, documentText)) {
                    return null;
                }
                var diagnostics = []
                    .concat(service.getSyntacticDiagnostics(currentFile) || [])
                    .concat((service.getSemanticDiagnostics(currentFile) || []).filter(function(diagnostic) {
                        var code = Number(diagnostic && diagnostic.code);
                        return !EDITOR_SYNTHETIC_DIAGNOSTIC_CODES[code] &&
                            (projectSnapshotReady || !SINGLE_FILE_UNRELIABLE_DIAGNOSTIC_CODES[code]);
                    }));
                var boundarySlots = dependencyBoundaryCode ? 1 : 0;
                var annotations = diagnostics.slice(
                    0,
                    Math.max(0, diagnosticsLimit - boundarySlots)
                ).map(function(diagnostic) {
                    return annotationFromDiagnostic(ts, currentText, diagnostic);
                });
                if (dependencyBoundaryCode) {
                    annotations.unshift({
                        row: 0,
                        column: 0,
                        text: dependencyBoundaryDetail || dependencyBoundaryCode,
                        type: "error",
                        raw: dependencyBoundaryCode,
                        source: TS_DIAGNOSTIC_SOURCE
                    });
                }
                return annotations.slice(0, diagnosticsLimit);
            } catch (error) {
                notify(config, "ACE TS diagnostics failed: " + error, error);
                return null;
            }
        }

        function getState() {
            if (!disposed) {
                initialize();
            }
            return {
                ready: ready,
                reason: reason,
                version: ts && ts.version || "",
                expectedVersion: expectedTypeScriptVersion,
                executionProfile: executionProfile,
                executionProfileRevision: executionProfile === PROFILE_JAVASCRIPT ?
                    null : EXECUTION_PROFILE_REVISION,
                compilerOptions: compilerOptions(),
                defaultLib: defaultLib,
                libraryCount: libraryUris.length,
                projectRootUri: projectRootUri,
                projectSourceFileCount: projectSourceFileCount || projectSourceUris.length,
                loadedProjectSourceFileCount: projectSourceUris.filter(function(uri) {
                    return hasOwn(files, uri);
                }).length,
                projectSourceInventoryFingerprint: projectSourceInventoryFingerprint,
                projectSourceByteLength: projectSourceByteLength,
                projectSnapshotSchemaRevision: projectSnapshotSchemaRevision,
                projectSnapshotReady: projectSnapshotReady,
                projectSnapshotUpdateCount: projectSnapshotUpdateCount,
                projectSnapshotChangedFileCount: projectSnapshotChangedFileCount,
                projectTypeFileCount: projectTypeUris.length,
                loadedProjectTypeFileCount: projectTypeUris.filter(function(uri) {
                    return hasOwn(files, uri);
                }).length,
                dependencyTypeNames: dependencyTypeNames.slice(0),
                dependencyLayerFingerprint: String(config.dependencyLayerFingerprint || ""),
                dependencyInventoryFingerprint: String(config.dependencyInventoryFingerprint || ""),
                dependencyFileCount: Math.max(0, Number(config.dependencyFileCount) || 0),
                dependencyByteLength: Math.max(0, Number(config.dependencyByteLength) || 0),
                dependencyBoundaryCode: dependencyBoundaryCode,
                dependencyBoundaryDetail: dependencyBoundaryDetail,
                dependencyResolverPolicyRevision:
                    Math.max(0, Number(config.dependencyResolverPolicyRevision) || 0),
                dependencyResolverPolicyFingerprint:
                    String(config.dependencyResolverPolicyFingerprint || ""),
                currentFile: currentFile,
                diagnosticSource: TS_DIAGNOSTIC_SOURCE
            };
        }

        function dispose() {
            if (disposed) {
                return;
            }
            disposed = true;
            ready = false;
            if (service && typeof service.dispose === "function") {
                try {
                    service.dispose();
                } catch (error) {
                    notify(config, "ACE TS language service disposal failed: " + error, error);
                }
            }
            service = null;
            files = Object.create(null);
            versions = Object.create(null);
            libraryUris = [];
            rootLibraryUris = [];
            libraryAssetUrls = Object.create(null);
            projectSourceUris = [];
            projectSourceUriSet = Object.create(null);
            projectTypeUris = [];
            projectTypeUriSet = Object.create(null);
            projectDirectories = Object.create(null);
            dependencyTypeNames = [];
            dependencyBoundaryCode = "";
            dependencyBoundaryDetail = "";
            projectSnapshotReady = false;
            projectSourceInventoryFingerprint = "";
            projectSourceFileCount = 0;
            projectSourceByteLength = 0;
            currentText = "";
            reason = "typescript language service disposed";
        }

        return {
            initialize: initialize,
            setDocumentUri: setDocumentUri,
            updateDocument: updateDocument,
            updateProjectSnapshot: updateProjectSnapshot,
            getCompletions: getCompletions,
            getHover: getHover,
            getSignatureHelp: getSignatureHelp,
            getDefinition: getDefinition,
            getRename: getRename,
            getCodeActions: getCodeActions,
            getDiagnostics: getDiagnostics,
            getState: getState,
            dispose: dispose,
            isReady: function() {
                return initialize();
            }
        };
    }

    global.AutoJsAceTsLanguageService = {
        create: createLanguageService,
        constants: {
            currentFile: CURRENT_FILE,
            autojs6Lib: AUTOJS6_CORE_LIB,
            autojs6CompatibilityLib: AUTOJS6_COMPATIBILITY_LIB,
            typescriptVersion: TYPESCRIPT_VERSION,
            profileRhino: PROFILE_RHINO,
            profileNode: PROFILE_NODE,
            executionProfileRevision: EXECUTION_PROFILE_REVISION,
            defaultLib: EDITOR_DEFAULT_LIB,
            executionDefaultLib: EXECUTION_DEFAULT_LIB,
            defaultLibraryUris: copyArray(DEFAULT_LIBRARY_URIS),
            diagnosticSource: TS_DIAGNOSTIC_SOURCE
        }
    };
})(window);
