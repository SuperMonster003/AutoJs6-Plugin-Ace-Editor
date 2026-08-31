(function(global) {
    "use strict";

    var DEFAULT_HANDSHAKE_TIMEOUT_MS = 5000;
    var DEFAULT_IDLE_TIMEOUT_MS = 5 * 60 * 1000;
    var DEFAULT_RESTART_BASE_DELAY_MS = 250;
    var DEFAULT_RESTART_MAX_DELAY_MS = 10000;
    var stdioSessions = Object.create(null);

    function noop() {
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

    function parseBridgeResult(raw) {
        if (raw && typeof raw === "object") {
            return raw;
        }
        try {
            return JSON.parse(String(raw || "{}"));
        } catch (error) {
            return { ok: false, error: "Invalid bridge response: " + error };
        }
    }

    function messageText(message) {
        return typeof message === "string" ? message : JSON.stringify(message);
    }

    function restartDelay(attempt, baseDelayMs, maxDelayMs) {
        attempt = Math.max(0, Math.floor(Number(attempt) || 0));
        baseDelayMs = positiveInteger(baseDelayMs, DEFAULT_RESTART_BASE_DELAY_MS);
        maxDelayMs = positiveInteger(maxDelayMs, DEFAULT_RESTART_MAX_DELAY_MS);
        return Math.min(maxDelayMs, baseDelayMs * Math.pow(2, attempt));
    }

    function createWebWorkerTransport(config) {
        config = config || {};
        var worker = null;
        var callbacks = null;
        var disposed = false;
        var ready = false;
        var state = "idle";
        var restartAttempt = 0;
        var restartTimer = null;
        var handshakeTimer = null;
        var idleTimer = null;
        var handshakeTimeoutMs = positiveInteger(
            config.handshakeTimeoutMs,
            DEFAULT_HANDSHAKE_TIMEOUT_MS
        );
        var idleTimeoutMs = positiveInteger(config.idleTimeoutMs, DEFAULT_IDLE_TIMEOUT_MS);

        function publishState(detail) {
            if (typeof config.onStateChanged === "function") {
                config.onStateChanged({
                    type: "web-worker",
                    state: state,
                    ready: ready,
                    restartAttempt: restartAttempt,
                    detail: String(detail || "")
                });
            }
        }

        function clearLifecycleTimers() {
            timerClear(config, handshakeTimer);
            timerClear(config, idleTimer);
            handshakeTimer = null;
            idleTimer = null;
        }

        function scheduleIdleExit() {
            timerClear(config, idleTimer);
            if (!ready || idleTimeoutMs <= 0) {
                idleTimer = null;
                return;
            }
            idleTimer = timerSet(config, function() {
                idleTimer = null;
                if (!disposed && worker) {
                    state = "idle-exit";
                    publishState("idle-timeout");
                    if (typeof worker.terminate === "function") {
                        worker.terminate();
                    }
                    worker = null;
                    ready = false;
                    if (callbacks && typeof callbacks.onClose === "function") {
                        callbacks.onClose("idle-timeout");
                    }
                }
            }, idleTimeoutMs);
        }

        function createWorker() {
            if (typeof config.workerFactory === "function") {
                return config.workerFactory(String(config.workerUrl || ""));
            }
            if (typeof global.Worker === "function") {
                return new global.Worker(String(config.workerUrl || ""));
            }
            throw new Error("WebWorker is unavailable");
        }

        function scheduleRestart(detail) {
            if (disposed || config.autoRestart !== true || restartTimer !== null) {
                return;
            }
            var delayMs = restartDelay(
                restartAttempt,
                config.restartBaseDelayMs,
                config.restartMaxDelayMs
            );
            restartAttempt++;
            state = "restart-wait";
            publishState(detail);
            restartTimer = timerSet(config, function() {
                restartTimer = null;
                if (disposed) {
                    return;
                }
                try {
                    startWorker();
                    if (typeof config.onRestart === "function") {
                        config.onRestart(restartAttempt);
                    }
                    if (callbacks && typeof callbacks.onRestart === "function") {
                        callbacks.onRestart(restartAttempt);
                    }
                } catch (error) {
                    scheduleRestart(error);
                }
            }, delayMs);
        }

        function handleCrash(error) {
            if (disposed) {
                return;
            }
            clearLifecycleTimers();
            var failedWorker = worker;
            worker = null;
            ready = false;
            state = "crashed";
            publishState(error);
            if (failedWorker && typeof failedWorker.terminate === "function") {
                try {
                    failedWorker.terminate();
                } catch (ignore) {
                    // Best-effort worker cleanup.
                }
            }
            if (callbacks && typeof callbacks.onError === "function") {
                callbacks.onError(error);
            }
            if (callbacks && typeof callbacks.onClose === "function") {
                callbacks.onClose(error);
            }
            scheduleRestart(error);
        }

        function startWorker() {
            clearLifecycleTimers();
            worker = createWorker();
            if (!worker || typeof worker.postMessage !== "function") {
                worker = null;
                throw new Error("Worker factory returned an invalid message target");
            }
            ready = false;
            state = "starting";
            worker.onmessage = function(event) {
                scheduleIdleExit();
                if (callbacks && typeof callbacks.onMessage === "function") {
                    callbacks.onMessage(event && event.data);
                }
            };
            worker.onerror = function(error) {
                handleCrash(error && (error.message || error));
            };
            worker.onmessageerror = function(error) {
                handleCrash(error && (error.message || error));
            };
            handshakeTimer = timerSet(config, function() {
                handshakeTimer = null;
                if (!ready && worker) {
                    handleCrash("initialize-handshake-timeout");
                }
            }, handshakeTimeoutMs);
            publishState();
        }

        function start(nextCallbacks) {
            if (disposed) {
                throw new Error("WebWorker transport is disposed");
            }
            callbacks = nextCallbacks || {};
            if (!worker) {
                startWorker();
            }
            return true;
        }

        function send(message) {
            if (!worker || disposed) {
                throw new Error("WebWorker transport is not connected");
            }
            scheduleIdleExit();
            worker.postMessage(message);
        }

        function markReady() {
            if (!worker || disposed) {
                return false;
            }
            timerClear(config, handshakeTimer);
            handshakeTimer = null;
            ready = true;
            state = "ready";
            restartAttempt = 0;
            scheduleIdleExit();
            publishState();
            return true;
        }

        function dispose() {
            if (disposed) {
                return;
            }
            disposed = true;
            ready = false;
            state = "disposed";
            clearLifecycleTimers();
            timerClear(config, restartTimer);
            restartTimer = null;
            if (worker && typeof worker.terminate === "function") {
                worker.terminate();
            }
            worker = null;
            callbacks = null;
            publishState();
        }

        return {
            type: "web-worker",
            start: start,
            send: send,
            markReady: markReady,
            dispose: dispose,
            getState: function() {
                return {
                    type: "web-worker",
                    state: state,
                    ready: ready,
                    restartAttempt: restartAttempt
                };
            }
        };
    }

    function createStdioBridgeTransport(config) {
        config = config || {};
        var bridge = config.bridge || global.autojs || null;
        var providerId = String(config.providerId || "");
        var sessionId = "";
        var callbacks = null;
        var disposed = false;
        var ready = false;
        var state = "idle";
        var restartPending = false;

        function publishState(detail) {
            if (typeof config.onStateChanged === "function") {
                config.onStateChanged({
                    type: "stdio",
                    providerId: providerId,
                    sessionId: sessionId,
                    state: state,
                    ready: ready,
                    detail: String(detail || "")
                });
            }
        }

        function requireBridgeMethod(name) {
            if (!bridge || typeof bridge[name] !== "function") {
                throw new Error("ACE stdio bridge method is unavailable: " + name);
            }
            return bridge[name];
        }

        function start(nextCallbacks) {
            if (disposed) {
                throw new Error("Stdio transport is disposed");
            }
            callbacks = nextCallbacks || {};
            if (sessionId && (state === "idle-exit" || state === "stopped" ||
                state === "unavailable")) {
                delete stdioSessions[sessionId];
                try {
                    requireBridgeMethod("stopLspProcess").call(bridge, sessionId);
                } catch (ignore) {
                    // The native registry may already have released an idle session.
                }
                sessionId = "";
            }
            if (sessionId) {
                return true;
            }
            state = "starting";
            publishState();
            var result = parseBridgeResult(
                requireBridgeMethod("startLspProcess").call(bridge, providerId)
            );
            if (!result.ok || !result.sessionId) {
                state = "unavailable";
                publishState(result.error);
                throw new Error(String(result.error || "Unable to start LSP companion process"));
            }
            sessionId = String(result.sessionId);
            stdioSessions[sessionId] = transport;
            state = "starting";
            publishState();
            return true;
        }

        function send(message) {
            if (!sessionId || disposed) {
                throw new Error("Stdio transport is not connected");
            }
            var result = parseBridgeResult(
                requireBridgeMethod("sendLspProcessMessage").call(
                    bridge,
                    sessionId,
                    messageText(message)
                )
            );
            if (!result.ok) {
                throw new Error(String(result.error || "Unable to send LSP stdio message"));
            }
        }

        function markReady() {
            if (!sessionId || disposed) {
                return false;
            }
            var result = parseBridgeResult(
                requireBridgeMethod("markLspProcessReady").call(bridge, sessionId)
            );
            if (!result.ok) {
                throw new Error(String(result.error || "Unable to complete LSP process handshake"));
            }
            ready = true;
            state = "ready";
            publishState();
            return true;
        }

        function receiveMessage(payload) {
            if (disposed || !callbacks || typeof callbacks.onMessage !== "function") {
                return;
            }
            callbacks.onMessage(payload);
        }

        function receiveState(nextState, detail) {
            if (disposed) {
                return;
            }
            state = String(nextState || "unknown");
            if (state === "crashed" || state === "restart-wait") {
                restartPending = true;
            }
            if (state !== "ready") {
                ready = false;
            }
            publishState(detail);
            if ((state === "crashed" || state === "stopped" || state === "idle-exit") &&
                callbacks && typeof callbacks.onClose === "function") {
                callbacks.onClose(detail || state);
            }
            if (restartPending && state === "running" &&
                callbacks && typeof callbacks.onRestart === "function") {
                restartPending = false;
                callbacks.onRestart();
            }
        }

        function receiveError(detail) {
            if (!disposed && callbacks && typeof callbacks.onError === "function") {
                callbacks.onError(detail);
            }
        }

        function dispose() {
            if (disposed) {
                return;
            }
            disposed = true;
            ready = false;
            state = "disposed";
            if (sessionId) {
                delete stdioSessions[sessionId];
                try {
                    requireBridgeMethod("stopLspProcess").call(bridge, sessionId);
                } catch (ignore) {
                    // Process cleanup is best-effort during editor teardown.
                }
            }
            sessionId = "";
            callbacks = null;
            publishState();
        }

        var transport = {
            type: "stdio",
            start: start,
            send: send,
            markReady: markReady,
            dispose: dispose,
            receiveMessage: receiveMessage,
            receiveState: receiveState,
            receiveError: receiveError,
            getState: function() {
                return {
                    type: "stdio",
                    providerId: providerId,
                    sessionId: sessionId,
                    state: state,
                    ready: ready
                };
            }
        };
        return transport;
    }

    function receiveStdioMessage(sessionId, payload) {
        var transport = stdioSessions[String(sessionId || "")];
        if (!transport) {
            return false;
        }
        transport.receiveMessage(payload);
        return true;
    }

    function receiveStdioState(sessionId, state, detail) {
        var transport = stdioSessions[String(sessionId || "")];
        if (!transport) {
            return false;
        }
        transport.receiveState(state, detail);
        return true;
    }

    function receiveStdioError(sessionId, detail) {
        var transport = stdioSessions[String(sessionId || "")];
        if (!transport) {
            return false;
        }
        transport.receiveError(detail);
        return true;
    }

    global.AutoJsAceLspTransports = {
        createWebWorkerTransport: createWebWorkerTransport,
        createStdioBridgeTransport: createStdioBridgeTransport,
        receiveStdioMessage: receiveStdioMessage,
        receiveStdioState: receiveStdioState,
        receiveStdioError: receiveStdioError,
        restartDelay: restartDelay
    };
})(window);
