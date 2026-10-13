(function(global) {
    "use strict";

    var PROVIDER_ID = "java-ecj";
    var PROVIDER_NAME = "JavaProvider";
    var CAPABILITIES = ["diagnostics", "dispose"];
    var REQUEST_TIMEOUT_MS = 15000;
    var DEFAULT_DOCUMENT_URI = "file:///autojs6/editor/Current.java";
    var pendingRequests = Object.create(null);
    var providerSerial = 0;
    var providerCreatedCount = 0;
    var providerDisposeCount = 0;
    var activeProviderCount = 0;

    function noop() {
    }

    function timerSet(callback, delayMs) {
        var fn = global.setTimeout || (typeof setTimeout === "function" ? setTimeout : null);
        return fn ? fn(callback, delayMs) : null;
    }

    function timerClear(handle) {
        var fn = global.clearTimeout || (typeof clearTimeout === "function" ? clearTimeout : null);
        if (handle !== null && fn) {
            fn(handle);
        }
    }

    function parseJson(value) {
        if (!value) {
            return {};
        }
        if (typeof value === "object") {
            return value;
        }
        try {
            return JSON.parse(String(value));
        } catch (ignore) {
            return {};
        }
    }

    function bridgeSupported(bridge) {
        return !!bridge &&
            typeof bridge.isJavaDiagnosticsSupported === "function" &&
            typeof bridge.requestJavaDiagnostics === "function" &&
            typeof bridge.cancelJavaDiagnostics === "function";
    }

    function supportsRuntime(bridge) {
        bridge = bridge || global.autojs;
        if (!bridgeSupported(bridge)) {
            return false;
        }
        try {
            return bridge.isJavaDiagnosticsSupported() === true;
        } catch (ignore) {
            return false;
        }
    }

    function annotationFromDiagnostic(diagnostic) {
        diagnostic = diagnostic || {};
        var code = diagnostic.code == null ? "ecj" : String(diagnostic.code);
        var severity = String(diagnostic.severity || "error").toLowerCase();
        return {
            row: Math.max(0, Number(diagnostic.row) || 0),
            column: Math.max(0, Number(diagnostic.column) || 0),
            endRow: Math.max(0, Number(diagnostic.endRow) || 0),
            endColumn: Math.max(0, Number(diagnostic.endColumn) || 0),
            text: String(diagnostic.message || "Java diagnostic"),
            type: severity === "warning" ? "warning" :
                severity === "info" ? "info" : "error",
            raw: code,
            source: "ECJ",
            autojs6Java: true
        };
    }

    function create(config) {
        config = config || {};
        var bridge = config.bridge || global.autojs;
        var instanceId = ++providerSerial;
        var documentUri = String(config.documentUri || DEFAULT_DOCUMENT_URI);
        var documentText = String(config.documentText || "");
        var annotations = [];
        var rawDiagnostics = [];
        var initialized = false;
        var disposed = false;
        var status = "created";
        var unavailableReason = "";
        var requestRevision = 0;
        var currentRequestId = "";
        var currentRequestTimer = null;
        var lastRequestedText = null;
        var requestCount = 0;
        var responseCount = 0;
        var staleResponseCount = 0;
        var cancelCount = 0;
        var lastRequestDurationMs = 0;
        var lastHeapDeltaBytes = 0;
        var lastPssDeltaKb = 0;
        var memoryLimitExceeded = false;

        providerCreatedCount++;
        activeProviderCount++;

        function publishState() {
            if (typeof config.onStateChanged === "function") {
                try {
                    config.onStateChanged(getState());
                } catch (ignore) {
                    // State telemetry must not affect diagnostics.
                }
            }
        }

        function notifyUnavailable(reason) {
            unavailableReason = String(reason || "java-ecj-unavailable");
            status = "unavailable";
            publishState();
            if (typeof config.onUnavailable === "function") {
                try {
                    config.onUnavailable(unavailableReason);
                } catch (ignore) {
                    // The LSP client owns fallback state.
                }
            }
        }

        function clearCurrentRequest(cancelNative) {
            var requestId = currentRequestId;
            if (!requestId) {
                return false;
            }
            currentRequestId = "";
            timerClear(currentRequestTimer);
            currentRequestTimer = null;
            delete pendingRequests[requestId];
            if (cancelNative && bridgeSupported(bridge)) {
                try {
                    bridge.cancelJavaDiagnostics(requestId);
                } catch (ignore) {
                    // Native teardown also suppresses stale publications.
                }
            }
            cancelCount++;
            return true;
        }

        function start(callback) {
            callback = typeof callback === "function" ? callback : noop;
            if (disposed) {
                callback(false, getState());
                return false;
            }
            if (!supportsRuntime(bridge)) {
                notifyUnavailable("java-ecj-runtime-unavailable");
                callback(false, getState());
                return false;
            }
            initialized = true;
            status = "ready";
            unavailableReason = "";
            publishState();
            callback(true, getState());
            return true;
        }

        function requestDiagnostics(text) {
            documentText = String(text == null ? documentText : text);
            if (disposed || !initialized || status === "unavailable") {
                return annotations.slice(0);
            }
            if (currentRequestId && lastRequestedText === documentText) {
                return annotations.slice(0);
            }
            clearCurrentRequest(true);
            requestRevision++;
            var revision = requestRevision;
            var requestId = "java-" + instanceId + "-" + revision + "-" + Date.now();
            currentRequestId = requestId;
            lastRequestedText = documentText;
            pendingRequests[requestId] = {
                provider: provider,
                revision: revision
            };
            status = "compiling";
            requestCount++;
            publishState();

            var accepted;
            try {
                accepted = parseJson(bridge.requestJavaDiagnostics(JSON.stringify({
                    requestId: requestId,
                    documentUri: documentUri,
                    source: documentText
                })));
            } catch (error) {
                delete pendingRequests[requestId];
                currentRequestId = "";
                notifyUnavailable("java-ecj-bridge-failure");
                return annotations.slice(0);
            }
            if (accepted.ok !== true || accepted.accepted !== true) {
                delete pendingRequests[requestId];
                currentRequestId = "";
                notifyUnavailable(String(accepted.code || accepted.error || "java-ecj-request-rejected"));
                return annotations.slice(0);
            }
            currentRequestTimer = timerSet(function() {
                if (disposed || currentRequestId !== requestId || revision !== requestRevision) {
                    return;
                }
                clearCurrentRequest(true);
                notifyUnavailable("java-ecj-request-timeout");
            }, REQUEST_TIMEOUT_MS);
            return annotations.slice(0);
        }

        function receive(response, revision) {
            response = response || {};
            if (disposed || revision !== requestRevision ||
                String(response.requestId || "") !== currentRequestId ||
                String(response.documentUri || documentUri) !== documentUri) {
                staleResponseCount++;
                return false;
            }
            currentRequestId = "";
            timerClear(currentRequestTimer);
            currentRequestTimer = null;
            responseCount++;
            if (response.ok !== true) {
                notifyUnavailable(String(response.code || response.error || "java-ecj-compile-failed"));
                return false;
            }
            rawDiagnostics = Array.isArray(response.diagnostics) ?
                response.diagnostics.slice(0) : [];
            annotations = rawDiagnostics.map(annotationFromDiagnostic);
            lastRequestDurationMs = Math.max(0, Number(response.durationMs) || 0);
            lastHeapDeltaBytes = Math.max(0, Number(response.heapDeltaBytes) || 0);
            lastPssDeltaKb = Math.max(0, Number(response.pssDeltaKb) || 0);
            memoryLimitExceeded = response.memoryLimitExceeded === true;
            status = memoryLimitExceeded ? "memory-limit" : "ready";
            publishState();
            if (typeof config.onDiagnostics === "function") {
                try {
                    config.onDiagnostics(annotations.slice(0), getState());
                } catch (ignore) {
                    // Diagnostics remain cached for the next LSP read.
                }
            }
            if (memoryLimitExceeded) {
                notifyUnavailable("memory-limit-exceeded");
            }
            return true;
        }

        function setDocumentUri(uri, text) {
            uri = String(uri || DEFAULT_DOCUMENT_URI);
            var changed = uri !== documentUri;
            if (!changed && text == null) {
                return false;
            }
            clearCurrentRequest(true);
            requestRevision++;
            documentUri = uri;
            if (text != null) {
                documentText = String(text);
            }
            lastRequestedText = null;
            rawDiagnostics = [];
            annotations = [];
            status = initialized ? "ready" : status;
            publishState();
            return true;
        }

        function getState() {
            var nativeState = {};
            if (bridge && typeof bridge.getJavaDiagnosticsState === "function") {
                try {
                    nativeState = parseJson(bridge.getJavaDiagnosticsState());
                } catch (ignore) {
                    nativeState = {};
                }
            }
            return {
                id: PROVIDER_ID,
                name: PROVIDER_NAME,
                kind: "android-bridge",
                status: status,
                ready: initialized && !disposed && status !== "unavailable",
                initialized: initialized,
                disposed: disposed,
                unavailableReason: unavailableReason,
                documentUri: documentUri,
                requestRevision: requestRevision,
                requestPending: !!currentRequestId,
                requestCount: requestCount,
                responseCount: responseCount,
                staleResponseCount: staleResponseCount,
                cancelCount: cancelCount,
                diagnosticCount: annotations.length,
                lastRequestDurationMs: lastRequestDurationMs,
                lastHeapDeltaBytes: lastHeapDeltaBytes,
                lastPssDeltaKb: lastPssDeltaKb,
                memoryLimitExceeded: memoryLimitExceeded,
                capabilities: CAPABILITIES.slice(0),
                nativeRuntime: nativeState
            };
        }

        function dispose() {
            if (disposed) {
                return;
            }
            disposed = true;
            providerDisposeCount++;
            activeProviderCount = Math.max(0, activeProviderCount - 1);
            clearCurrentRequest(true);
            requestRevision++;
            initialized = false;
            annotations = [];
            rawDiagnostics = [];
            lastRequestedText = null;
            status = "disposed";
            publishState();
            if (typeof config.onDisposed === "function") {
                try {
                    config.onDisposed(getState());
                } catch (ignore) {
                    // Disposal is authoritative.
                }
            }
        }

        var provider = {
            id: PROVIDER_ID,
            name: PROVIDER_NAME,
            kind: "android-bridge",
            capabilities: CAPABILITIES.slice(0),
            getCapabilities: function() { return CAPABILITIES.slice(0); },
            start: start,
            syncDocument: function(text) {
                documentText = String(text == null ? documentText : text);
                return true;
            },
            setDocumentUri: setDocumentUri,
            getDiagnostics: function(_session, text) {
                return requestDiagnostics(text);
            },
            getRawDiagnostics: function() { return rawDiagnostics.slice(0); },
            getState: getState,
            getProviderState: getState,
            dispose: dispose,
            _receive: receive
        };

        if (config.eager !== false) {
            start();
        }
        return provider;
    }

    function receiveDiagnostics(responseJson) {
        var response = parseJson(responseJson);
        var requestId = String(response.requestId || "");
        var pending = pendingRequests[requestId];
        if (!pending || !pending.provider) {
            return false;
        }
        delete pendingRequests[requestId];
        return pending.provider._receive(response, pending.revision) === true;
    }

    global.AutoJsAceJavaProvider = {
        PROVIDER_ID: PROVIDER_ID,
        CAPABILITIES: CAPABILITIES.slice(0),
        isSupported: supportsRuntime,
        create: create,
        receiveDiagnostics: receiveDiagnostics,
        annotationFromDiagnostic: annotationFromDiagnostic,
        getLifecycleState: function() {
            return {
                providerCreatedCount: providerCreatedCount,
                providerDisposeCount: providerDisposeCount,
                activeProviderCount: activeProviderCount,
                pendingRequestCount: Object.keys(pendingRequests).length
            };
        }
    };
})(window);
