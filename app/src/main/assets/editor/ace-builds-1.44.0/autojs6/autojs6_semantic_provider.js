(function(global) {
    "use strict";

    var CAPABILITY_NAMES = [
        "completion",
        "hover",
        "signatureHelp",
        "diagnostics",
        "definition",
        "rename",
        "codeActions",
        "dispose"
    ];
    var DEFAULT_OPERATION_TIMEOUT_MS = 2000;
    var DEFAULT_DOCUMENT_WORD_LIMIT = 100;

    function noop() {
    }

    function nowFrom(config) {
        return config && typeof config.now === "function" ?
            Math.max(0, Number(config.now()) || 0) : Date.now();
    }

    function timerSet(config, callback, delayMs) {
        if (config && typeof config.setTimeout === "function") {
            return config.setTimeout(callback, delayMs);
        }
        var fn = global.setTimeout || (typeof setTimeout === "function" ? setTimeout : null);
        if (!fn) {
            return null;
        }
        return fn(callback, delayMs);
    }

    function timerClear(config, handle) {
        if (handle === null || typeof handle === "undefined") {
            return;
        }
        if (config && typeof config.clearTimeout === "function") {
            config.clearTimeout(handle);
            return;
        }
        var fn = global.clearTimeout || (typeof clearTimeout === "function" ? clearTimeout : null);
        if (fn) {
            fn(handle);
        }
    }

    function positiveInteger(value, fallback) {
        value = Number(value);
        return isFinite(value) && value > 0 ? Math.floor(value) : fallback;
    }

    function errorMessage(error) {
        if (!error) {
            return "unknown provider failure";
        }
        return String(error.message || error);
    }

    function copyArray(value) {
        return Array.isArray(value) ? value.slice(0) : [];
    }

    function normalizeCapabilities(value) {
        var selected = Object.create(null);
        if (Array.isArray(value)) {
            value.forEach(function(name) {
                selected[String(name)] = true;
            });
        } else if (value && typeof value === "object") {
            CAPABILITY_NAMES.forEach(function(name) {
                if (value[name] === true) {
                    selected[name] = true;
                }
            });
        }
        return CAPABILITY_NAMES.filter(function(name) {
            return selected[name] === true;
        });
    }

    function providerCapabilities(provider) {
        if (!provider) {
            return [];
        }
        var capabilities = typeof provider.getCapabilities === "function" ?
            provider.getCapabilities() : provider.capabilities;
        return normalizeCapabilities(capabilities);
    }

    function providerId(provider) {
        return provider ? String(provider.id || provider.name || "semantic-provider") : "";
    }

    function completionMethodName(capability) {
        return capability === "completion" ? "getCompletions" :
            capability === "signatureHelp" ? "getSignatureHelp" :
                capability === "codeActions" ? "getCodeActions" :
                    capability === "diagnostics" ? "getDiagnostics" :
                        capability === "definition" ? "getDefinition" :
                            capability === "rename" ? "getRename" :
                                capability === "hover" ? "getHover" : capability;
    }

    function createProviderHost(config) {
        config = config || {};
        var provider = null;
        var disposedProviders = [];
        var disposed = false;
        var healthy = false;
        var status = "absent";
        var failureCount = 0;
        var timeoutCount = 0;
        var successCount = 0;
        var lastOperation = "";
        var lastDurationMs = 0;
        var lastFailure = "";
        var lastFailureKind = "";
        var lastFailureAt = 0;
        var operationSerial = 0;
        var timeoutMs = positiveInteger(
            config.operationTimeoutMs,
            DEFAULT_OPERATION_TIMEOUT_MS
        );

        function snapshot() {
            return {
                providerId: providerId(provider),
                status: status,
                healthy: !!provider && healthy && !disposed,
                capabilities: providerCapabilities(provider),
                operationTimeoutMs: timeoutMs,
                successCount: successCount,
                failureCount: failureCount,
                timeoutCount: timeoutCount,
                lastOperation: lastOperation,
                lastDurationMs: lastDurationMs,
                lastFailure: lastFailure,
                lastFailureKind: lastFailureKind,
                lastFailureAt: lastFailureAt
            };
        }

        function publishHealth() {
            if (typeof config.onHealthChanged === "function") {
                try {
                    config.onHealthChanged(snapshot());
                } catch (ignore) {
                    // Health reporting must never break the editor's fallback path.
                }
            }
        }

        function disposeProvider(target) {
            if (!target || typeof target.dispose !== "function" ||
                disposedProviders.indexOf(target) >= 0) {
                return;
            }
            // Provider implementations are not required to make dispose idempotent.
            // Record before calling so a throwing/re-entrant dispose is never retried.
            disposedProviders.push(target);
            try {
                target.dispose();
            } catch (error) {
                if (typeof config.notifyError === "function") {
                    config.notifyError(
                        "Semantic provider disposal failed: " + errorMessage(error),
                        error
                    );
                }
            }
        }

        function fail(operation, error, durationMs, kind) {
            if (!provider || !healthy) {
                return;
            }
            lastOperation = String(operation || "unknown");
            lastDurationMs = Math.max(0, Number(durationMs) || 0);
            lastFailure = errorMessage(error);
            lastFailureKind = String(kind || "exception");
            lastFailureAt = nowFrom(config);
            failureCount++;
            if (lastFailureKind === "timeout") {
                timeoutCount++;
            }
            healthy = false;
            status = "degraded";
            var failedProvider = provider;
            publishHealth();
            disposeProvider(failedProvider);
            if (typeof config.notifyError === "function") {
                config.notifyError(
                    "Semantic provider " + providerId(failedProvider) + " " +
                        lastOperation + " failed; using local fallback: " + lastFailure,
                    error
                );
            }
        }

        function succeed(operation, durationMs) {
            lastOperation = String(operation || "");
            lastDurationMs = Math.max(0, Number(durationMs) || 0);
            successCount++;
            status = "ready";
        }

        function fallbackValue(fallback, reason) {
            return typeof fallback === "function" ? fallback(reason) : fallback;
        }

        function supports(capability) {
            return !!provider && healthy && !disposed &&
                providerCapabilities(provider).indexOf(String(capability || "")) >= 0;
        }

        function setProvider(nextProvider, disposePrevious) {
            if (provider === nextProvider) {
                return snapshot();
            }
            var previous = provider;
            provider = nextProvider || null;
            disposed = false;
            healthy = !!provider;
            status = provider ? "ready" : "absent";
            lastFailure = "";
            lastFailureKind = "";
            if (disposePrevious !== false) {
                disposeProvider(previous);
            }
            publishHealth();
            return snapshot();
        }

        function clearProvider(disposeCurrent) {
            var previous = provider;
            provider = null;
            healthy = false;
            status = disposed ? "disposed" : "absent";
            if (disposeCurrent !== false) {
                disposeProvider(previous);
            }
            publishHealth();
        }

        function invoke(capability, args, fallback) {
            capability = String(capability || "");
            if (!supports(capability)) {
                return fallbackValue(fallback, provider ? "provider-unhealthy" : "provider-absent");
            }
            var methodName = completionMethodName(capability);
            var method = provider && provider[methodName];
            if (typeof method !== "function") {
                return fallbackValue(fallback, "capability-unavailable");
            }
            var startedAt = nowFrom(config);
            try {
                var result = method.apply(provider, copyArray(args));
                var durationMs = Math.max(0, nowFrom(config) - startedAt);
                if (durationMs > timeoutMs) {
                    fail(
                        capability,
                        new Error("operation exceeded " + timeoutMs + " ms"),
                        durationMs,
                        "timeout"
                    );
                    return fallbackValue(fallback, "provider-timeout");
                }
                succeed(capability, durationMs);
                return result;
            } catch (error) {
                fail(capability, error, nowFrom(config) - startedAt, "exception");
                return fallbackValue(fallback, "provider-exception");
            }
        }

        function runCompletionFallbacks(fallbacks, callback, index) {
            fallbacks = Array.isArray(fallbacks) ? fallbacks : [];
            index = Math.max(0, Number(index) || 0);
            if (index >= fallbacks.length) {
                callback(null, [], { layer: "empty" });
                return;
            }
            var fallback = fallbacks[index];
            if (typeof fallback !== "function") {
                runCompletionFallbacks(fallbacks, callback, index + 1);
                return;
            }
            var settled = false;
            function next(error, items, meta) {
                if (settled) {
                    return;
                }
                settled = true;
                items = Array.isArray(items) ? items : [];
                if (!error && items.length > 0) {
                    callback(null, items, meta || { layer: "fallback-" + index });
                    return;
                }
                runCompletionFallbacks(fallbacks, callback, index + 1);
            }
            try {
                var returned = fallback(next);
                if (!settled && Array.isArray(returned)) {
                    next(null, returned);
                }
            } catch (error) {
                next(error, []);
            }
        }

        function invokeCompletion(args, callback, fallbacks) {
            callback = typeof callback === "function" ? callback : noop;
            var requestSerial = ++operationSerial;
            if (!supports("completion") ||
                !provider || typeof provider.getCompletions !== "function") {
                runCompletionFallbacks(fallbacks, callback, 0);
                return {
                    cancel: noop,
                    layer: provider ? "provider-unhealthy" : "provider-absent"
                };
            }
            var startedAt = nowFrom(config);
            var settled = false;
            var timer = timerSet(config, function() {
                if (settled || requestSerial !== operationSerial) {
                    return;
                }
                settled = true;
                fail(
                    "completion",
                    new Error("operation exceeded " + timeoutMs + " ms"),
                    nowFrom(config) - startedAt,
                    "timeout"
                );
                runCompletionFallbacks(fallbacks, callback, 0);
            }, timeoutMs);

            function finish(error, items) {
                if (settled || requestSerial !== operationSerial) {
                    return;
                }
                settled = true;
                timerClear(config, timer);
                var durationMs = Math.max(0, nowFrom(config) - startedAt);
                if (error || durationMs > timeoutMs) {
                    fail(
                        "completion",
                        error || new Error("operation exceeded " + timeoutMs + " ms"),
                        durationMs,
                        error ? "exception" : "timeout"
                    );
                    runCompletionFallbacks(fallbacks, callback, 0);
                    return;
                }
                succeed("completion", durationMs);
                items = Array.isArray(items) ? items : [];
                if (items.length > 0) {
                    callback(null, items, {
                        layer: "semantic",
                        providerId: providerId(provider)
                    });
                    return;
                }
                runCompletionFallbacks(fallbacks, callback, 0);
            }

            try {
                var returned = provider.getCompletions.apply(provider, copyArray(args).concat(finish));
                if (!settled && Array.isArray(returned)) {
                    finish(null, returned);
                }
            } catch (error) {
                finish(error, []);
            }

            return {
                layer: "semantic",
                cancel: function() {
                    if (settled) {
                        return false;
                    }
                    settled = true;
                    operationSerial++;
                    timerClear(config, timer);
                    return true;
                }
            };
        }

        function dispose() {
            if (disposed) {
                return;
            }
            disposed = true;
            status = "disposed";
            healthy = false;
            operationSerial++;
            clearProvider(true);
        }

        return {
            setProvider: setProvider,
            clearProvider: clearProvider,
            getProvider: function() { return provider; },
            getState: snapshot,
            getCapabilities: function() {
                return healthy ? providerCapabilities(provider) : [];
            },
            supports: supports,
            invoke: invoke,
            invokeCompletion: invokeCompletion,
            dispose: dispose
        };
    }

    function createTypeScriptInProcessProvider(config) {
        config = config || {};
        var service = null;
        var disposed = false;

        function ensureService() {
            if (disposed) {
                return null;
            }
            if (!service && typeof config.createService === "function") {
                service = config.createService() || null;
            }
            return service;
        }

        function delegate(name, args, fallback) {
            var target = ensureService();
            var method = target && target[name];
            if (typeof method !== "function") {
                return typeof fallback === "function" ? fallback() : fallback;
            }
            return method.apply(target, args || []);
        }

        var provider = {
            id: "typescript-in-process",
            name: "TypeScriptInProcessProvider",
            kind: "in-process",
            capabilities: CAPABILITY_NAMES.slice(0),
            getCapabilities: function() {
                return CAPABILITY_NAMES.slice(0);
            },
            getCompletions: function(session, pos, prefix, documentText, callback) {
                return delegate(
                    "getCompletions",
                    [session, pos, prefix, callback, documentText],
                    function() {
                        callback(null, []);
                    }
                );
            },
            getHover: function(session, pos, documentText) {
                return delegate("getHover", [session, pos, documentText], null);
            },
            getSignatureHelp: function(session, pos, documentText) {
                return delegate("getSignatureHelp", [session, pos, documentText], null);
            },
            getDiagnostics: function(session, documentText) {
                return delegate("getDiagnostics", [session, documentText], null);
            },
            getDefinition: function(session, pos, documentText) {
                return delegate("getDefinition", [session, pos, documentText], null);
            },
            getRename: function(session, pos, documentText) {
                return delegate("getRename", [session, pos, documentText], null);
            },
            getCodeActions: function(session, pos, documentText) {
                return delegate("getCodeActions", [session, pos, documentText], []);
            },
            setDocumentUri: function(uri) {
                return delegate("setDocumentUri", [uri], false);
            },
            updateProjectSnapshot: function(snapshot) {
                return delegate("updateProjectSnapshot", [snapshot], null);
            },
            getState: function() {
                return delegate("getState", [], {
                    ready: false,
                    reason: disposed ?
                        "typescript language service disposed" :
                        "typescript language service unavailable"
                });
            },
            getProviderState: function() {
                return {
                    id: provider.id,
                    name: provider.name,
                    kind: provider.kind,
                    capabilities: provider.getCapabilities(),
                    disposed: disposed,
                    serviceReady: !!service
                };
            },
            dispose: function() {
                if (disposed) {
                    return;
                }
                disposed = true;
                var target = service;
                service = null;
                if (target && typeof target.dispose === "function") {
                    target.dispose();
                }
            }
        };

        if (config.eager !== false) {
            ensureService();
        }
        return provider;
    }

    function documentWordCompletions(session, prefix, limit) {
        prefix = String(prefix || "");
        limit = positiveInteger(limit, DEFAULT_DOCUMENT_WORD_LIMIT);
        var text = "";
        if (session && typeof session.getValue === "function") {
            text = String(session.getValue() || "");
        } else if (session && typeof session.getLength === "function" &&
            typeof session.getLine === "function") {
            var lines = [];
            for (var row = 0; row < session.getLength(); row++) {
                lines.push(String(session.getLine(row) || ""));
            }
            text = lines.join("\n");
        }
        var prefixLower = prefix.toLowerCase();
        var seen = Object.create(null);
        var results = [];
        var pattern = /[A-Za-z_$\u0080-\uFFFF][A-Za-z0-9_$\u0080-\uFFFF]*/g;
        var match;
        while ((match = pattern.exec(text)) !== null && results.length < limit) {
            var word = match[0];
            var key = word.toLowerCase();
            if (seen[key] || word === prefix ||
                (prefixLower && key.indexOf(prefixLower) !== 0)) {
                continue;
            }
            seen[key] = true;
            results.push({
                caption: word,
                value: word,
                meta: "document word",
                score: 1,
                autojs6FallbackLayer: "document-word"
            });
        }
        return results;
    }

    global.AutoJsAceSemanticProvider = {
        CAPABILITY_NAMES: CAPABILITY_NAMES.slice(0),
        DEFAULT_OPERATION_TIMEOUT_MS: DEFAULT_OPERATION_TIMEOUT_MS,
        normalizeCapabilities: normalizeCapabilities,
        createProviderHost: createProviderHost,
        createTypeScriptInProcessProvider: createTypeScriptInProcessProvider,
        documentWordCompletions: documentWordCompletions
    };
})(window);
