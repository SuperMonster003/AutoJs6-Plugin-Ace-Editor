(function(global) {
    "use strict";

    var JSON_RPC_VERSION = "2.0";
    var DEFAULT_ROOT_URI = "file:///autojs6/editor";
    var DEFAULT_REQUEST_TIMEOUT_MS = 10000;
    var MAX_URI_LENGTH = 4096;
    var MAX_MESSAGE_LENGTH = 4 * 1024 * 1024;
    var INSERT_TEXT_FORMAT_SNIPPET = 2;
    var TEXT_DOCUMENT_SYNC_INCREMENTAL = 2;

    function noop() {
    }

    function copyObject(value) {
        var result = {};
        if (!value || typeof value !== "object") {
            return result;
        }
        Object.keys(value).forEach(function(key) {
            result[key] = value[key];
        });
        return result;
    }

    function positiveInteger(value, fallback) {
        value = Number(value);
        return isFinite(value) && value > 0 ? Math.floor(value) : fallback;
    }

    function timerSet(config, callback, delayMs) {
        if (typeof config.setTimeout === "function") {
            return config.setTimeout(callback, delayMs);
        }
        var fn = global.setTimeout || (typeof setTimeout === "function" ? setTimeout : null);
        return fn ? fn(callback, delayMs) : null;
    }

    function timerClear(config, handle) {
        if (handle === null || typeof handle === "undefined") {
            return;
        }
        if (typeof config.clearTimeout === "function") {
            config.clearTimeout(handle);
            return;
        }
        var fn = global.clearTimeout || (typeof clearTimeout === "function" ? clearTimeout : null);
        if (fn) {
            fn(handle);
        }
    }

    function parseMessage(raw) {
        if (raw && typeof raw === "object") {
            return raw;
        }
        var text = String(raw || "");
        if (!text || text.length > MAX_MESSAGE_LENGTH) {
            throw new Error(text ? "LSP message exceeds size limit" : "Empty LSP message");
        }
        return JSON.parse(text);
    }

    function normalizeRootUri(uri) {
        uri = String(uri || DEFAULT_ROOT_URI).replace(/\/+$/, "");
        return uri || DEFAULT_ROOT_URI;
    }

    function safeDecodeUri(uri) {
        try {
            return decodeURIComponent(uri);
        } catch (ignore) {
            return "";
        }
    }

    function isSafeDocumentUri(uri, rootUri) {
        uri = String(uri || "");
        rootUri = normalizeRootUri(rootUri);
        if (!uri || uri.length > MAX_URI_LENGTH || uri.indexOf("\u0000") >= 0 ||
            uri.indexOf("?") >= 0 || uri.indexOf("#") >= 0 ||
            !/^file:\/\/\//i.test(uri)) {
            return false;
        }
        var decoded = safeDecodeUri(uri).replace(/\\/g, "/");
        var decodedRoot = safeDecodeUri(rootUri).replace(/\\/g, "/");
        if (!decoded || /(^|\/)\.\.(\/|$)/.test(decoded)) {
            return false;
        }
        decodedRoot = decodedRoot.replace(/\/+$/, "");
        return decoded === decodedRoot || decoded.indexOf(decodedRoot + "/") === 0;
    }

    function normalizePosition(position) {
        position = position || {};
        return {
            line: Math.max(0, Math.floor(Number(position.line) || 0)),
            character: Math.max(0, Math.floor(Number(position.character) || 0))
        };
    }

    function acePosition(position) {
        position = normalizePosition(position);
        return { row: position.line, column: position.character };
    }

    function lineOffsets(text) {
        text = String(text || "");
        var offsets = [0];
        for (var index = 0; index < text.length; index++) {
            if (text.charAt(index) === "\n") {
                offsets.push(index + 1);
            }
        }
        return offsets;
    }

    function offsetAt(text, position) {
        text = String(text || "");
        position = normalizePosition(position);
        var offsets = lineOffsets(text);
        var line = Math.min(position.line, offsets.length - 1);
        var start = offsets[line];
        var end = line + 1 < offsets.length ? offsets[line + 1] - 1 : text.length;
        return Math.max(start, Math.min(start + position.character, end));
    }

    function applyContentChange(text, change) {
        text = String(text || "");
        change = change || {};
        if (!change.range) {
            return String(change.text || "");
        }
        var start = offsetAt(text, change.range.start);
        var end = offsetAt(text, change.range.end);
        if (end < start) {
            throw new Error("Invalid incremental content range");
        }
        return text.substring(0, start) + String(change.text || "") + text.substring(end);
    }

    function convertSnippetText(value) {
        value = String(value || "");
        // LSP and Ace share the common $1/${1:default}/$0 syntax. Ace 1.4.12
        // does not understand LSP choice placeholders, so keep their first choice.
        return value.replace(/\$\{(\d+)\|([^}]*)\|\}/g, function(_match, index, choices) {
            var first = String(choices || "").split(",")[0] || "";
            return "${" + index + ":" + first + "}";
        });
    }

    function normalizeCompletionItem(item) {
        item = copyObject(item);
        var textEdit = item.textEdit && typeof item.textEdit === "object" ?
            copyObject(item.textEdit) : null;
        var insertText = item.insertText != null ? item.insertText :
            textEdit && textEdit.newText != null ? textEdit.newText : item.label;
        var snippet = Number(item.insertTextFormat) === INSERT_TEXT_FORMAT_SNIPPET;
        var normalized = {
            caption: String(item.label || insertText || ""),
            value: String(insertText || item.label || ""),
            meta: String(item.detail || item.kind || "LSP"),
            score: Number(item.sortText) || 1000,
            docHTML: item.documentation && typeof item.documentation === "object" ?
                String(item.documentation.value || "") : String(item.documentation || ""),
            autojs6Lsp: true,
            autojs6LspItem: item
        };
        if (snippet) {
            normalized.snippet = convertSnippetText(insertText);
            delete normalized.value;
        }
        if (textEdit && textEdit.range) {
            normalized.autojs6TextEdit = {
                range: textEdit.range,
                newText: String(textEdit.newText || "")
            };
        }
        return normalized;
    }

    function normalizeCompletionResult(result) {
        var items = Array.isArray(result) ? result :
            result && Array.isArray(result.items) ? result.items : [];
        return {
            isIncomplete: !!(result && !Array.isArray(result) && result.isIncomplete),
            items: items.map(normalizeCompletionItem)
        };
    }

    function responseError(code, message, data) {
        var error = new Error(String(message || "LSP request failed"));
        error.code = code;
        error.data = data;
        return error;
    }

    function createClient(config) {
        config = config || {};
        var transport = config.transport || null;
        var rootUri = normalizeRootUri(config.rootUri);
        var requestTimeoutMs = positiveInteger(
            config.requestTimeoutMs,
            DEFAULT_REQUEST_TIMEOUT_MS
        );
        var state = "idle";
        var nextRequestId = 1;
        var pending = Object.create(null);
        var documents = Object.create(null);
        var diagnosticsByUri = Object.create(null);
        var serverCapabilities = {};
        var disposed = false;
        var initialized = false;
        var messageCount = 0;
        var staleResponseCount = 0;
        var cancelledRequestCount = 0;
        var lastError = "";
        var lastInitializeOptions = {};
        var restartInProgress = false;

        function snapshot() {
            return {
                state: state,
                initialized: initialized,
                rootUri: rootUri,
                serverCapabilities: copyObject(serverCapabilities),
                openDocumentCount: Object.keys(documents).length,
                pendingRequestCount: Object.keys(pending).length,
                messageCount: messageCount,
                staleResponseCount: staleResponseCount,
                cancelledRequestCount: cancelledRequestCount,
                lastError: lastError
            };
        }

        function publishState() {
            if (typeof config.onStateChanged === "function") {
                try {
                    config.onStateChanged(snapshot());
                } catch (ignore) {
                    // State observers are diagnostic-only.
                }
            }
        }

        function fail(message, error) {
            lastError = String(message || error && error.message || error || "LSP failure");
            if (typeof config.onError === "function") {
                config.onError(lastError, error || null);
            }
            publishState();
        }

        function send(message) {
            if (disposed || !transport || typeof transport.send !== "function") {
                throw new Error("LSP transport is not available");
            }
            transport.send(message);
        }

        function notify(method, params) {
            send({
                jsonrpc: JSON_RPC_VERSION,
                method: String(method),
                params: params == null ? {} : params
            });
        }

        function currentDocumentVersion(uri) {
            return documents[uri] ? documents[uri].version : null;
        }

        function request(method, params, options, callback) {
            options = options || {};
            callback = typeof callback === "function" ? callback : noop;
            if (disposed) {
                callback(responseError("DISPOSED", "LSP client is disposed"));
                return null;
            }
            if (!initialized && method !== "initialize" && options.allowBeforeInitialize !== true) {
                callback(responseError("NOT_INITIALIZED", "LSP client is not initialized"));
                return null;
            }
            var id = nextRequestId++;
            var uri = String(options.documentUri || "");
            var version = options.documentVersion != null ? Number(options.documentVersion) :
                uri ? currentDocumentVersion(uri) : null;
            var timeoutHandle = timerSet(config, function() {
                var entry = pending[id];
                if (!entry) {
                    return;
                }
                delete pending[id];
                entry.callback(responseError("REQUEST_TIMEOUT", method + " timed out"));
                try {
                    notify("$/cancelRequest", { id: id });
                } catch (ignore) {
                    // The timeout result remains authoritative if the transport already closed.
                }
                publishState();
            }, positiveInteger(options.timeoutMs, requestTimeoutMs));
            pending[id] = {
                id: id,
                method: method,
                callback: callback,
                documentUri: uri,
                documentVersion: version,
                cancelled: false,
                timeoutHandle: timeoutHandle
            };
            try {
                send({
                    jsonrpc: JSON_RPC_VERSION,
                    id: id,
                    method: String(method),
                    params: params == null ? {} : params
                });
            } catch (error) {
                delete pending[id];
                timerClear(config, timeoutHandle);
                callback(error);
                fail("Unable to send " + method + ": " + error, error);
                return null;
            }
            publishState();
            return id;
        }

        function cancelRequest(id, reason) {
            var entry = pending[id];
            if (!entry) {
                return false;
            }
            delete pending[id];
            entry.cancelled = true;
            timerClear(config, entry.timeoutHandle);
            cancelledRequestCount++;
            try {
                notify("$/cancelRequest", { id: id });
            } catch (ignore) {
                // Local cancellation still succeeds when the peer has gone away.
            }
            entry.callback(responseError("REQUEST_CANCELLED", reason || "LSP request cancelled"));
            publishState();
            return true;
        }

        function handleResponse(message) {
            var id = message.id;
            var entry = pending[id];
            if (!entry) {
                return;
            }
            delete pending[id];
            timerClear(config, entry.timeoutHandle);
            if (entry.cancelled) {
                return;
            }
            if (entry.documentUri && entry.documentVersion != null &&
                currentDocumentVersion(entry.documentUri) !== entry.documentVersion) {
                staleResponseCount++;
                entry.callback(
                    responseError("STALE_RESPONSE", entry.method + " response is stale"),
                    null,
                    { stale: true }
                );
                publishState();
                return;
            }
            if (message.error) {
                entry.callback(responseError(
                    message.error.code,
                    message.error.message,
                    message.error.data
                ));
            } else {
                entry.callback(null, message.result, { stale: false });
            }
            publishState();
        }

        function handleDiagnostics(params) {
            params = params || {};
            var uri = String(params.uri || "");
            if (!isSafeDocumentUri(uri, rootUri)) {
                fail("Rejected diagnostics for unsafe URI: " + uri);
                return;
            }
            var current = documents[uri];
            if (current && params.version != null && Number(params.version) < current.version) {
                staleResponseCount++;
                publishState();
                return;
            }
            diagnosticsByUri[uri] = Array.isArray(params.diagnostics) ?
                params.diagnostics.slice(0) : [];
            if (typeof config.onDiagnostics === "function") {
                config.onDiagnostics(uri, diagnosticsByUri[uri].slice(0), params.version);
            }
        }

        function handleServerRequest(message) {
            var result = null;
            var error = null;
            if (message.method === "workspace/applyEdit") {
                result = applyWorkspaceEdit(message.params && message.params.edit);
            } else if (message.method === "workspace/configuration") {
                var items = message.params && message.params.items;
                result = (Array.isArray(items) ? items : []).map(function(item) {
                    if (typeof config.getWorkspaceConfiguration !== "function") {
                        return null;
                    }
                    return config.getWorkspaceConfiguration(
                        String(item && item.section || ""),
                        String(item && item.scopeUri || "")
                    );
                });
            } else if (message.method === "workspace/workspaceFolders") {
                result = [{
                    uri: rootUri,
                    name: String(config.workspaceName || "AutoJs6")
                }];
            } else if (message.method === "window/workDoneProgress/create" ||
                message.method === "client/registerCapability" ||
                message.method === "client/unregisterCapability") {
                result = null;
            } else {
                error = { code: -32601, message: "Method not found: " + message.method };
            }
            send({
                jsonrpc: JSON_RPC_VERSION,
                id: message.id,
                result: error ? undefined : result,
                error: error || undefined
            });
        }

        function handleMessage(raw) {
            var message;
            try {
                message = parseMessage(raw);
            } catch (error) {
                fail("Invalid LSP message: " + error, error);
                return;
            }
            messageCount++;
            if (message && message.id != null &&
                (Object.prototype.hasOwnProperty.call(message, "result") || message.error)) {
                handleResponse(message);
                return;
            }
            if (message && message.method === "textDocument/publishDiagnostics") {
                handleDiagnostics(message.params);
                return;
            }
            if (message && message.method && message.id != null) {
                handleServerRequest(message);
                return;
            }
            if (message && message.method && typeof config.onNotification === "function") {
                config.onNotification(message.method, message.params);
            }
            publishState();
        }

        function handleTransportClose(detail) {
            if (disposed) {
                return;
            }
            state = "disconnected";
            initialized = false;
            Object.keys(pending).forEach(function(id) {
                var entry = pending[id];
                delete pending[id];
                timerClear(config, entry.timeoutHandle);
                entry.callback(responseError("TRANSPORT_CLOSED", "LSP transport closed"));
            });
            fail("LSP transport closed" + (detail ? ": " + detail : ""));
        }

        function reopenDocumentsAfterRestart() {
            Object.keys(documents).forEach(function(uri) {
                var document = documents[uri];
                notify("textDocument/didOpen", {
                    textDocument: copyObject(document)
                });
            });
        }

        function handleTransportRestart() {
            if (disposed || restartInProgress || config.autoRestart === false) {
                return;
            }
            restartInProgress = true;
            initialized = false;
            state = "disconnected";
            start(lastInitializeOptions, function(error, nextState) {
                restartInProgress = false;
                if (!error) {
                    reopenDocumentsAfterRestart();
                }
                if (typeof config.onRestarted === "function") {
                    config.onRestarted(error || null, nextState || snapshot());
                }
            });
        }

        function start(initializeOptions, callback) {
            initializeOptions = initializeOptions || {};
            lastInitializeOptions = copyObject(initializeOptions);
            callback = typeof callback === "function" ? callback : noop;
            if (disposed || !transport || typeof transport.start !== "function") {
                callback(responseError("TRANSPORT_UNAVAILABLE", "LSP transport is unavailable"));
                return false;
            }
            if (state !== "idle" && state !== "disconnected") {
                callback(null, snapshot());
                return true;
            }
            state = "starting";
            publishState();
            try {
                transport.start({
                    onMessage: handleMessage,
                    onClose: handleTransportClose,
                    onRestart: handleTransportRestart,
                    onError: function(error) {
                        fail("LSP transport error: " + error, error);
                    }
                });
            } catch (error) {
                state = "disconnected";
                fail("Unable to start LSP transport: " + error, error);
                callback(error);
                return false;
            }
            state = "initializing";
            var params = {
                processId: null,
                clientInfo: {
                    name: "AutoJs6 Ace Editor",
                    version: String(config.clientVersion || "1")
                },
                rootUri: rootUri,
                capabilities: {
                    workspace: {
                        applyEdit: true,
                        workspaceEdit: { documentChanges: true },
                        configuration: true,
                        workspaceFolders: true
                    },
                    textDocument: {
                        synchronization: {
                            didSave: false,
                            dynamicRegistration: false
                        },
                        completion: {
                            completionItem: {
                                snippetSupport: true,
                                resolveSupport: {
                                    properties: ["documentation", "detail", "additionalTextEdits"]
                                }
                            }
                        },
                        hover: {},
                        signatureHelp: {},
                        definition: {},
                        rename: {},
                        codeAction: {}
                    }
                },
                initializationOptions: initializeOptions.initializationOptions || {},
                workspaceFolders: [{ uri: rootUri, name: "AutoJs6" }]
            };
            request("initialize", params, { allowBeforeInitialize: true }, function(error, result) {
                if (error) {
                    state = "disconnected";
                    callback(error);
                    publishState();
                    return;
                }
                serverCapabilities = result && result.capabilities || {};
                initialized = true;
                state = "ready";
                notify("initialized", {});
                if (transport && typeof transport.markReady === "function") {
                    transport.markReady();
                }
                publishState();
                callback(null, snapshot(), result);
            });
            return true;
        }

        function requireSafeUri(uri) {
            uri = String(uri || "");
            if (!isSafeDocumentUri(uri, rootUri)) {
                throw new Error("Unsafe or out-of-workspace URI: " + uri);
            }
            return uri;
        }

        function openDocument(uri, languageId, text) {
            uri = requireSafeUri(uri);
            text = String(text || "");
            var document = {
                uri: uri,
                languageId: String(languageId || "plaintext"),
                version: 1,
                text: text
            };
            documents[uri] = document;
            notify("textDocument/didOpen", {
                textDocument: copyObject(document)
            });
            publishState();
            return copyObject(document);
        }

        function changeDocument(uri, changes) {
            uri = requireSafeUri(uri);
            var document = documents[uri];
            if (!document) {
                throw new Error("Document is not open: " + uri);
            }
            changes = Array.isArray(changes) ? changes.slice(0) : [{ text: String(changes || "") }];
            changes.forEach(function(change) {
                document.text = applyContentChange(document.text, change);
            });
            document.version++;
            notify("textDocument/didChange", {
                textDocument: { uri: uri, version: document.version },
                contentChanges: changes
            });
            publishState();
            return copyObject(document);
        }

        function closeDocument(uri) {
            uri = requireSafeUri(uri);
            if (!documents[uri]) {
                return false;
            }
            delete documents[uri];
            delete diagnosticsByUri[uri];
            notify("textDocument/didClose", { textDocument: { uri: uri } });
            publishState();
            return true;
        }

        function textDocumentRequest(method, uri, position, extra, callback) {
            uri = requireSafeUri(uri);
            var document = documents[uri];
            if (!document) {
                callback(responseError("DOCUMENT_NOT_OPEN", "Document is not open: " + uri));
                return null;
            }
            var params = copyObject(extra);
            params.textDocument = { uri: uri };
            if (position) {
                params.position = normalizePosition(position);
            }
            return request(method, params, {
                documentUri: uri,
                documentVersion: document.version
            }, callback);
        }

        function completion(uri, position, context, callback) {
            return textDocumentRequest(
                "textDocument/completion",
                uri,
                position,
                { context: context || { triggerKind: 1 } },
                function(error, result, meta) {
                    if (error) {
                        callback(error, null, meta);
                        return;
                    }
                    callback(null, normalizeCompletionResult(result), meta);
                }
            );
        }

        function resolveCompletion(item, callback) {
            var raw = item && item.autojs6LspItem || item || {};
            return request("completionItem/resolve", raw, {}, function(error, result, meta) {
                callback(error, error ? null : normalizeCompletionItem(result || raw), meta);
            });
        }

        function hover(uri, position, callback) {
            return textDocumentRequest("textDocument/hover", uri, position, {}, callback);
        }

        function signatureHelp(uri, position, context, callback) {
            return textDocumentRequest(
                "textDocument/signatureHelp",
                uri,
                position,
                { context: context || {} },
                callback
            );
        }

        function definition(uri, position, callback) {
            return textDocumentRequest("textDocument/definition", uri, position, {}, callback);
        }

        function rename(uri, position, newName, callback) {
            return textDocumentRequest(
                "textDocument/rename",
                uri,
                position,
                { newName: String(newName || "") },
                callback
            );
        }

        function codeAction(uri, range, diagnostics, callback) {
            return textDocumentRequest(
                "textDocument/codeAction",
                uri,
                null,
                {
                    range: range || {
                        start: { line: 0, character: 0 },
                        end: { line: 0, character: 0 }
                    },
                    context: { diagnostics: Array.isArray(diagnostics) ? diagnostics : [] }
                },
                callback
            );
        }

        function collectWorkspaceEdits(edit) {
            edit = edit || {};
            var collected = [];
            Object.keys(edit.changes || {}).forEach(function(uri) {
                requireSafeUri(uri);
                (edit.changes[uri] || []).forEach(function(textEdit) {
                    collected.push({ uri: uri, edit: textEdit });
                });
            });
            (edit.documentChanges || []).forEach(function(change) {
                if (!change || !change.textDocument || !Array.isArray(change.edits)) {
                    throw new Error("Resource operations are not allowed in workspace edits");
                }
                var uri = requireSafeUri(change.textDocument.uri);
                change.edits.forEach(function(textEdit) {
                    collected.push({ uri: uri, edit: textEdit });
                });
            });
            return collected;
        }

        function applyWorkspaceEdit(edit) {
            var collected;
            try {
                collected = collectWorkspaceEdits(edit);
            } catch (error) {
                fail("Rejected workspace edit: " + error, error);
                return { applied: false, failureReason: String(error.message || error) };
            }
            if (typeof config.applyWorkspaceEdit === "function") {
                try {
                    var externalResult = config.applyWorkspaceEdit(collected.slice(0), edit);
                    return externalResult && typeof externalResult === "object" ?
                        externalResult : { applied: externalResult !== false };
                } catch (error) {
                    fail("Workspace edit application failed: " + error, error);
                    return { applied: false, failureReason: String(error.message || error) };
                }
            }
            try {
                var byUri = Object.create(null);
                collected.forEach(function(entry) {
                    if (!documents[entry.uri]) {
                        throw new Error("Workspace edit targets unopened document: " + entry.uri);
                    }
                    if (!byUri[entry.uri]) {
                        byUri[entry.uri] = [];
                    }
                    byUri[entry.uri].push(entry.edit);
                });
                var updatedTextByUri = Object.create(null);
                Object.keys(byUri).forEach(function(uri) {
                    var document = documents[uri];
                    var edits = byUri[uri].map(function(textEdit) {
                        return {
                            start: offsetAt(document.text, textEdit.range && textEdit.range.start),
                            end: offsetAt(document.text, textEdit.range && textEdit.range.end),
                            newText: String(textEdit.newText || "")
                        };
                    }).sort(function(left, right) {
                        return right.start - left.start;
                    });
                    var nextText = document.text;
                    var nextEditBoundary = document.text.length + 1;
                    edits.forEach(function(textEdit) {
                        if (textEdit.end < textEdit.start || textEdit.end > nextEditBoundary) {
                            throw new Error("Workspace edit contains an invalid or overlapping range");
                        }
                        nextText = nextText.substring(0, textEdit.start) +
                            textEdit.newText + nextText.substring(textEdit.end);
                        nextEditBoundary = textEdit.start;
                    });
                    updatedTextByUri[uri] = nextText;
                });
                Object.keys(updatedTextByUri).forEach(function(uri) {
                    documents[uri].text = updatedTextByUri[uri];
                    documents[uri].version++;
                });
                return { applied: true, editCount: collected.length };
            } catch (error) {
                fail("Workspace edit application failed: " + error, error);
                return { applied: false, failureReason: String(error.message || error) };
            }
        }

        function shutdown(callback) {
            callback = typeof callback === "function" ? callback : noop;
            if (!initialized) {
                callback(null, snapshot());
                return null;
            }
            state = "shutting-down";
            publishState();
            return request("shutdown", {}, {}, function(error) {
                if (!error) {
                    try {
                        notify("exit", {});
                    } catch (ignore) {
                        // The server may close immediately after shutdown.
                    }
                    initialized = false;
                    state = "stopped";
                }
                callback(error, snapshot());
                publishState();
            });
        }

        function dispose() {
            if (disposed) {
                return;
            }
            disposed = true;
            initialized = false;
            state = "disposed";
            Object.keys(pending).forEach(function(id) {
                var entry = pending[id];
                delete pending[id];
                timerClear(config, entry.timeoutHandle);
                entry.callback(responseError("DISPOSED", "LSP client is disposed"));
            });
            if (transport && typeof transport.dispose === "function") {
                transport.dispose();
            }
            publishState();
        }

        return {
            start: start,
            shutdown: shutdown,
            dispose: dispose,
            getState: snapshot,
            getDocument: function(uri) {
                return documents[uri] ? copyObject(documents[uri]) : null;
            },
            getDiagnostics: function(uri) {
                return diagnosticsByUri[uri] ? diagnosticsByUri[uri].slice(0) : [];
            },
            openDocument: openDocument,
            changeDocument: changeDocument,
            closeDocument: closeDocument,
            request: request,
            cancelRequest: cancelRequest,
            completion: completion,
            resolveCompletion: resolveCompletion,
            hover: hover,
            signatureHelp: signatureHelp,
            definition: definition,
            rename: rename,
            codeAction: codeAction,
            applyWorkspaceEdit: applyWorkspaceEdit,
            isSafeDocumentUri: function(uri) {
                return isSafeDocumentUri(uri, rootUri);
            }
        };
    }

    global.AutoJsAceLspCore = {
        JSON_RPC_VERSION: JSON_RPC_VERSION,
        TEXT_DOCUMENT_SYNC_INCREMENTAL: TEXT_DOCUMENT_SYNC_INCREMENTAL,
        createClient: createClient,
        isSafeDocumentUri: isSafeDocumentUri,
        normalizeCompletionItem: normalizeCompletionItem,
        normalizeCompletionResult: normalizeCompletionResult,
        convertSnippetText: convertSnippetText,
        applyContentChange: applyContentChange,
        acePosition: acePosition
    };
})(window);
