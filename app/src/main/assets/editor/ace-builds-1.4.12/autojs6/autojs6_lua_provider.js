(function(global) {
    "use strict";

    var PROVIDER_ID = "lua-luals";
    var DEFAULT_ROOT_URI = "file:///autojs6/editor";
    var DEFAULT_DOCUMENT_URI = DEFAULT_ROOT_URI + "/current.lua";
    var REQUEST_TIMEOUT_MS = 10000;
    var DISPOSE_TIMEOUT_MS = 250;
    var CAPABILITIES = [
        "completion",
        "hover",
        "signatureHelp",
        "diagnostics",
        "definition",
        "dispose"
    ];
    var providerCreatedCount = 0;
    var providerDisposeCount = 0;
    var processReleaseCount = 0;
    var recoveryCount = 0;
    var activeProviderCount = 0;

    function noop() {
    }

    function copyArray(value) {
        return Array.isArray(value) ? value.slice(0) : [];
    }

    function normalizePosition(pos) {
        pos = pos || {};
        return {
            row: Math.max(0, Math.floor(Number(pos.row) || 0)),
            column: Math.max(0, Math.floor(Number(pos.column) || 0))
        };
    }

    function lspPosition(pos) {
        pos = normalizePosition(pos);
        return { line: pos.row, character: pos.column };
    }

    function contentText(value) {
        if (value == null) {
            return "";
        }
        if (typeof value === "string") {
            return value;
        }
        if (Array.isArray(value)) {
            return value.map(contentText).filter(Boolean).join("\n\n");
        }
        if (typeof value === "object" && value.language && value.value != null) {
            return "```" + value.language + "\n" + String(value.value || "") + "\n```";
        }
        if (typeof value === "object" && value.value != null) {
            return String(value.value || "");
        }
        return String(value || "");
    }

    function annotationFromDiagnostic(diagnostic) {
        diagnostic = diagnostic || {};
        var start = diagnostic.range && diagnostic.range.start || {};
        var severity = Math.max(1, Number(diagnostic.severity) || 3);
        return {
            row: Math.max(0, Number(start.line) || 0),
            column: Math.max(0, Number(start.character) || 0),
            text: String(diagnostic.message || "Lua diagnostic"),
            type: severity === 1 ? "error" : severity === 2 ? "warning" : "info",
            raw: diagnostic.code != null ? String(diagnostic.code) : "luals",
            source: String(diagnostic.source || "Lua Diagnostics")
        };
    }

    function normalizeHover(result) {
        if (!result) {
            return null;
        }
        var docText = contentText(result.contents);
        if (!docText) {
            return null;
        }
        var range = result.range || {};
        return {
            caption: "Lua",
            value: "Lua",
            docText: docText,
            range: {
                start: normalizePosition({
                    row: range.start && range.start.line,
                    column: range.start && range.start.character
                }),
                end: normalizePosition({
                    row: range.end && range.end.line,
                    column: range.end && range.end.character
                })
            },
            autojs6Lua: true
        };
    }

    function parameterLabel(signatureLabel, parameter) {
        var label = parameter && parameter.label;
        if (Array.isArray(label) && label.length >= 2) {
            return String(signatureLabel || "").substring(
                Math.max(0, Number(label[0]) || 0),
                Math.max(0, Number(label[1]) || 0)
            );
        }
        return String(label || "");
    }

    function normalizeSignatureHelp(result) {
        var signatures = result && result.signatures;
        if (!Array.isArray(signatures) || signatures.length === 0) {
            return null;
        }
        var activeSignature = Math.max(0, Number(result.activeSignature) || 0);
        var signature = signatures[Math.min(activeSignature, signatures.length - 1)] || {};
        var signatureLabel = String(signature.label || "");
        if (!signatureLabel) {
            return null;
        }
        return {
            caption: "Lua signature",
            signature: signatureLabel,
            parameters: copyArray(signature.parameters).map(function(parameter) {
                return parameterLabel(signatureLabel, parameter);
            }),
            activeParameter: Math.max(
                0,
                Number(result.activeParameter != null ?
                    result.activeParameter : signature.activeParameter) || 0
            ),
            docText: contentText(signature.documentation),
            autojs6Lua: true
        };
    }

    function normalizeDefinition(result) {
        var locations = Array.isArray(result) ? result : result ? [result] : [];
        if (!locations.length) {
            return null;
        }
        var location = locations[0] || {};
        var range = location.targetSelectionRange || location.targetRange || location.range || {};
        var start = range.start || {};
        var end = range.end || start;
        var uri = String(location.targetUri || location.uri || "");
        if (!uri) {
            return null;
        }
        return {
            uri: uri,
            line: Math.max(0, Number(start.line) || 0),
            column: Math.max(0, Number(start.character) || 0),
            endLine: Math.max(0, Number(end.line) || 0),
            endColumn: Math.max(0, Number(end.character) || 0),
            autojs6Lua: true
        };
    }

    function bridgeSupported(bridge) {
        return !!bridge &&
            typeof bridge.startLspProcess === "function" &&
            typeof bridge.sendLspProcessMessage === "function" &&
            typeof bridge.markLspProcessReady === "function" &&
            typeof bridge.stopLspProcess === "function";
    }

    function supportsRuntime(bridge) {
        return !!global.AutoJsAceLspCore &&
            typeof global.AutoJsAceLspCore.createClient === "function" &&
            !!global.AutoJsAceLspTransports &&
            typeof global.AutoJsAceLspTransports.createStdioBridgeTransport === "function" &&
            bridgeSupported(bridge || global.autojs);
    }

    function workspaceConfiguration(section) {
        if (section === "Lua") {
            return {
                runtime: { version: "Lua 5.4" },
                workspace: {
                    checkThirdParty: false,
                    ignoreSubmodules: true,
                    useGitIgnore: true
                },
                diagnostics: {
                    enable: true,
                    workspaceDelay: 1000,
                    workspaceRate: 25
                },
                telemetry: { enable: false },
                completion: { callSnippet: "Both", keywordSnippet: "Both" }
            };
        }
        if (section === "editor.acceptSuggestionOnEnter") {
            return "on";
        }
        if (section === "editor.semanticHighlighting.enabled") {
            return true;
        }
        if (section === "files.associations" || section === "files.exclude") {
            return {};
        }
        return null;
    }

    function create(config) {
        config = config || {};
        var bridge = config.bridge || global.autojs;
        if (!supportsRuntime(bridge)) {
            return null;
        }

        var rootUri = String(config.rootUri || DEFAULT_ROOT_URI).replace(/\/+$/, "");
        var documentUri = String(config.documentUri || DEFAULT_DOCUMENT_URI);
        var documentText = String(config.documentText || "");
        var openedUri = "";
        var openedText = "";
        var documentRevision = 0;
        var status = "idle";
        var unavailableReason = "";
        var initialized = false;
        var disposed = false;
        var startCallbacks = [];
        var startAt = 0;
        var initializationMs = 0;
        var lastRequest = "";
        var lastRequestDurationMs = 0;
        var requestCount = 0;
        var diagnosticPublishCount = 0;
        var rawDiagnostics = [];
        var annotations = [];
        var transportState = null;
        var clientState = null;
        var hoverCache = null;
        var signatureCache = null;
        var definitionCache = null;
        var restartCount = 0;
        var processCrashCount = 0;
        var disposeTimer = null;
        providerCreatedCount++;
        activeProviderCount++;

        function publishState() {
            if (typeof config.onStateChanged === "function") {
                try {
                    config.onStateChanged(getState());
                } catch (ignore) {
                    // State reporting must not alter semantic fallback behavior.
                }
            }
        }

        function flushStartCallbacks(ok) {
            var callbacks = startCallbacks.slice(0);
            startCallbacks = [];
            callbacks.forEach(function(callback) {
                try {
                    callback(!!ok, getState());
                } catch (ignore) {
                    // Callers own callback errors.
                }
            });
        }

        function invalidateCaches() {
            hoverCache = null;
            signatureCache = null;
            definitionCache = null;
        }

        function publishUnavailable(reason) {
            unavailableReason = String(reason || "luals-unavailable");
            status = "unavailable";
            initialized = false;
            flushStartCallbacks(false);
            publishState();
            if (typeof config.onUnavailable === "function") {
                try {
                    config.onUnavailable(unavailableReason, getState());
                } catch (ignore) {
                    // The M2 fallback remains authoritative.
                }
            }
        }

        function publishRecovered() {
            recoveryCount++;
            restartCount++;
            unavailableReason = "";
            status = "ready";
            initialized = true;
            openedUri = documentUri;
            openedText = documentText;
            publishState();
            if (typeof config.onRecovered === "function") {
                try {
                    config.onRecovered(getState());
                } catch (ignore) {
                    // Recovery has already completed in the protocol core.
                }
            }
        }

        var transport = global.AutoJsAceLspTransports.createStdioBridgeTransport({
            bridge: bridge,
            providerId: String(config.providerId || PROVIDER_ID),
            onStateChanged: function(nextState) {
                transportState = nextState;
                var next = String(nextState && nextState.state || "");
                if (next === "crashed") {
                    processCrashCount++;
                    initialized = false;
                    status = "recovering";
                } else if (next === "restart-wait" || next === "running") {
                    if (!initialized && status !== "starting") {
                        status = "recovering";
                    }
                } else if (next === "idle-exit") {
                    initialized = false;
                    status = "idle";
                    openedUri = "";
                }
                publishState();
            }
        });

        var client = global.AutoJsAceLspCore.createClient({
            transport: transport,
            rootUri: rootUri,
            workspaceName: "AutoJs6 Lua",
            requestTimeoutMs: REQUEST_TIMEOUT_MS,
            autoRestart: true,
            getWorkspaceConfiguration: workspaceConfiguration,
            onStateChanged: function(nextState) {
                clientState = nextState;
                if (nextState && nextState.state === "disconnected") {
                    initialized = false;
                    openedUri = "";
                    if (status !== "unavailable") {
                        status = transportState &&
                            (transportState.state === "crashed" ||
                                transportState.state === "restart-wait") ?
                            "recovering" : "idle";
                    }
                }
                publishState();
            },
            onRestarted: function(error) {
                if (disposed) {
                    return;
                }
                if (error) {
                    publishUnavailable(error.message || error);
                    return;
                }
                publishRecovered();
            },
            onDiagnostics: function(uri, diagnostics, version) {
                if (disposed || uri !== documentUri) {
                    return;
                }
                rawDiagnostics = copyArray(diagnostics);
                annotations = rawDiagnostics.map(annotationFromDiagnostic);
                diagnosticPublishCount++;
                if (typeof config.onDiagnostics === "function") {
                    try {
                        config.onDiagnostics(
                            annotations.slice(0),
                            rawDiagnostics.slice(0),
                            uri,
                            version
                        );
                    } catch (ignore) {
                        // Diagnostics remain available through getDiagnostics.
                    }
                }
                publishState();
            },
            onError: function(message) {
                if (!disposed && status === "starting") {
                    unavailableReason = String(message || "luals-start-error");
                }
                publishState();
            }
        });

        function ensureDocument(text) {
            if (!initialized || disposed || status !== "ready") {
                return false;
            }
            text = text == null ? documentText : String(text);
            documentText = text;
            try {
                if (openedUri && openedUri !== documentUri) {
                    client.closeDocument(openedUri);
                    openedUri = "";
                    openedText = "";
                }
                if (!openedUri) {
                    client.openDocument(documentUri, "lua", text);
                    openedUri = documentUri;
                    openedText = text;
                    documentRevision++;
                    invalidateCaches();
                    return true;
                }
                if (openedText !== text) {
                    rawDiagnostics = [];
                    annotations = [];
                    client.changeDocument(documentUri, [{ text: text }]);
                    openedText = text;
                    documentRevision++;
                    invalidateCaches();
                }
                return true;
            } catch (error) {
                publishUnavailable(error && error.message || error);
                return false;
            }
        }

        function start(callback) {
            callback = typeof callback === "function" ? callback : noop;
            if (disposed) {
                callback(false, getState());
                return false;
            }
            if (initialized && status === "ready") {
                callback(true, getState());
                return true;
            }
            startCallbacks.push(callback);
            if (status === "starting") {
                return true;
            }
            status = "starting";
            unavailableReason = "";
            startAt = Date.now();
            publishState();
            client.start({
                initializationOptions: {
                    locale: "en-us",
                    runtimeVersion: "Lua 5.4",
                    telemetry: false
                }
            }, function(error) {
                if (disposed) {
                    flushStartCallbacks(false);
                    return;
                }
                if (error) {
                    publishUnavailable(error.message || error);
                    return;
                }
                initialized = true;
                status = "ready";
                initializationMs = Math.max(0, Date.now() - startAt);
                if (!ensureDocument(documentText)) {
                    flushStartCallbacks(false);
                    return;
                }
                flushStartCallbacks(true);
                publishState();
            });
            return true;
        }

        function ensureReady(callback) {
            if (initialized && status === "ready") {
                callback(true);
                return;
            }
            if (status === "recovering") {
                // Kotlin owns crash backoff. A request made during that window falls
                // through to M2 and the protocol core will reinitialize on `running`.
                callback(false);
                return;
            }
            start(function(ok) {
                callback(!!ok);
            });
        }

        function timedRequest(name, invoke, callback) {
            callback = typeof callback === "function" ? callback : noop;
            var startedAt = Date.now();
            lastRequest = name;
            requestCount++;
            ensureReady(function(ok) {
                if (!ok || disposed || !ensureDocument(documentText)) {
                    callback(null, null);
                    return;
                }
                try {
                    invoke(function(error, result) {
                        lastRequestDurationMs = Math.max(0, Date.now() - startedAt);
                        publishState();
                        callback(error || null, error ? null : result);
                    });
                } catch (error) {
                    lastRequestDurationMs = Math.max(0, Date.now() - startedAt);
                    callback(error, null);
                }
            });
        }

        function cacheKey(pos) {
            pos = normalizePosition(pos);
            return documentRevision + ":" + pos.row + ":" + pos.column;
        }

        var provider = {
            id: PROVIDER_ID,
            name: "LuaProvider",
            kind: "stdio",
            capabilities: CAPABILITIES.slice(0),
            getCapabilities: function() {
                return CAPABILITIES.slice(0);
            },
            start: start,
            syncDocument: function(text) {
                documentText = String(text == null ? documentText : text);
                return ensureDocument(documentText);
            },
            setDocumentUri: function(uri, text) {
                uri = String(uri || DEFAULT_DOCUMENT_URI);
                if (uri === documentUri && text == null) {
                    return false;
                }
                if (initialized && openedUri && openedUri !== uri) {
                    try {
                        client.closeDocument(openedUri);
                    } catch (ignore) {
                        // A disconnected transport will reopen only the new document.
                    }
                }
                openedUri = "";
                openedText = "";
                documentUri = uri;
                if (text != null) {
                    documentText = String(text);
                }
                rawDiagnostics = [];
                annotations = [];
                invalidateCaches();
                return ensureDocument(documentText);
            },
            getCompletions: function(_session, pos, _prefix, text, callback) {
                documentText = String(text == null ? documentText : text);
                timedRequest("completion", function(done) {
                    client.completion(documentUri, lspPosition(pos), { triggerKind: 1 }, function(error, result) {
                        var items = result && Array.isArray(result.items) ? result.items : [];
                        items.forEach(function(item) {
                            item.autojs6Lua = true;
                            item.autojs6Incomplete = !!(result && result.isIncomplete);
                        });
                        done(error, items);
                    });
                }, function(error, result) {
                    callback(null, error ? [] : Array.isArray(result) ? result : []);
                });
            },
            getHover: function(_session, pos, text, callback) {
                var key = cacheKey(pos);
                if (typeof callback !== "function") {
                    return hoverCache && hoverCache.key === key ? hoverCache.value : null;
                }
                documentText = String(text == null ? documentText : text);
                timedRequest("hover", function(done) {
                    client.hover(documentUri, lspPosition(pos), done);
                }, function(error, result) {
                    var normalized = error ? null : normalizeHover(result);
                    if (!error) hoverCache = { key: cacheKey(pos), value: normalized };
                    callback(error, normalized);
                });
            },
            getSignatureHelp: function(_session, pos, text, callback) {
                var key = cacheKey(pos);
                if (typeof callback !== "function") {
                    return signatureCache && signatureCache.key === key ? signatureCache.value : null;
                }
                documentText = String(text == null ? documentText : text);
                timedRequest("signatureHelp", function(done) {
                    client.signatureHelp(documentUri, lspPosition(pos), {}, done);
                }, function(error, result) {
                    var normalized = error ? null : normalizeSignatureHelp(result);
                    if (!error) signatureCache = { key: cacheKey(pos), value: normalized };
                    callback(error, normalized);
                });
            },
            getDefinition: function(_session, pos, text, callback) {
                var key = cacheKey(pos);
                if (typeof callback !== "function") {
                    return definitionCache && definitionCache.key === key ?
                        definitionCache.value : null;
                }
                documentText = String(text == null ? documentText : text);
                timedRequest("definition", function(done) {
                    client.definition(documentUri, lspPosition(pos), done);
                }, function(error, result) {
                    var normalized = error ? null : normalizeDefinition(result);
                    if (!error) definitionCache = { key: cacheKey(pos), value: normalized };
                    callback(error, normalized);
                });
            },
            getDiagnostics: function(_session, text) {
                documentText = String(text == null ? documentText : text);
                ensureDocument(documentText);
                return annotations.slice(0);
            },
            getRawDiagnostics: function() {
                return rawDiagnostics.slice(0);
            },
            getState: getState,
            getProviderState: getState,
            dispose: dispose
        };

        function getState() {
            return {
                id: provider.id,
                name: provider.name,
                kind: provider.kind,
                status: status,
                ready: initialized && status === "ready" && !disposed,
                initialized: initialized,
                disposed: disposed,
                unavailableReason: unavailableReason,
                initializationMs: initializationMs,
                rootUri: rootUri,
                documentUri: documentUri,
                documentRevision: documentRevision,
                documentOpen: !!openedUri,
                capabilities: CAPABILITIES.slice(0),
                lastRequest: lastRequest,
                lastRequestDurationMs: lastRequestDurationMs,
                requestCount: requestCount,
                diagnosticPublishCount: diagnosticPublishCount,
                diagnosticCount: annotations.length,
                restartCount: restartCount,
                processCrashCount: processCrashCount,
                transport: transportState,
                client: clientState
            };
        }

        function dispose() {
            if (disposed) {
                return;
            }
            disposed = true;
            providerDisposeCount++;
            activeProviderCount = Math.max(0, activeProviderCount - 1);
            initialized = false;
            status = "disposed";
            startCallbacks = [];
            invalidateCaches();
            var target = client;
            client = null;
            function finish() {
                if (disposeTimer !== null) {
                    (global.clearTimeout || clearTimeout)(disposeTimer);
                    disposeTimer = null;
                }
                if (target) {
                    target.dispose();
                    target = null;
                    processReleaseCount++;
                }
            }
            try {
                target.shutdown(finish);
                disposeTimer = (global.setTimeout || setTimeout)(finish, DISPOSE_TIMEOUT_MS);
            } catch (ignore) {
                finish();
            }
            publishState();
            if (typeof config.onDisposed === "function") {
                try {
                    config.onDisposed(getState());
                } catch (ignore) {
                    // Disposal remains authoritative.
                }
            }
        }

        if (config.eager !== false) {
            start();
        }
        return provider;
    }

    global.AutoJsAceLuaProvider = {
        PROVIDER_ID: PROVIDER_ID,
        CAPABILITIES: CAPABILITIES.slice(0),
        isSupported: function() {
            return supportsRuntime(global.autojs);
        },
        create: create,
        normalizeHover: normalizeHover,
        normalizeSignatureHelp: normalizeSignatureHelp,
        normalizeDefinition: normalizeDefinition,
        annotationFromDiagnostic: annotationFromDiagnostic,
        getLifecycleState: function() {
            return {
                providerCreatedCount: providerCreatedCount,
                providerDisposeCount: providerDisposeCount,
                processReleaseCount: processReleaseCount,
                recoveryCount: recoveryCount,
                activeProviderCount: activeProviderCount
            };
        }
    };
})(window);
