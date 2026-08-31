package io.github.supermonster003.autojs6.plugin.ace.editor.core.lsp

import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.atomic.AtomicLong

/**
 * Kotlin-owned allowlist for companion LSP processes exposed through [AceBridge].
 * JavaScript selects an opaque provider id; it can never supply an executable or arguments.
 */
internal class AceStdioLspProcessRegistry(
    specs: Collection<AceStdioLspServerSpec> = emptyList(),
    dynamicSpecs: Map<String, () -> AceStdioLspServerSpec> = emptyMap(),
    private val listener: Listener,
    private val transportFactory: TransportFactory = TransportFactory { sessionId, spec, transportListener ->
        AceStdioLspProcessTransport(
            sessionId = sessionId,
            spec = spec,
            listener = transportListener,
        )
    },
) : AutoCloseable {

    interface Listener {
        fun onMessage(sessionId: String, messageJson: String)

        fun onStateChanged(
            sessionId: String,
            state: AceStdioLspProcessTransport.State,
            detail: String,
        )

        fun onError(sessionId: String, message: String, error: Throwable?)
    }

    internal fun interface TransportFactory {
        fun create(
            sessionId: String,
            spec: AceStdioLspServerSpec,
            listener: AceStdioLspProcessTransport.Listener,
        ): AceStdioLspProcessTransport
    }

    data class Result(
        val ok: Boolean,
        val sessionId: String? = null,
        val error: String? = null,
    )

    private val specsById = specs.associateBy(AceStdioLspServerSpec::id)
    private val dynamicSpecsById = dynamicSpecs.toMap().also { registrations ->
        require(registrations.keys.all { id ->
            id.matches(Regex("[a-z0-9][a-z0-9._-]{0,63}")) && id !in specsById
        }) { "Invalid or duplicate dynamic LSP provider id" }
    }
    private val sessions = ConcurrentHashMap<String, AceStdioLspProcessTransport>()
    private val sessionSerial = AtomicLong()

    @Volatile
    private var closed = false

    fun start(providerId: String): Result {
        if (closed) return Result(ok = false, error = "LSP process registry is closed")
        val spec = specsById[providerId] ?: dynamicSpecsById[providerId]?.let { factory ->
            runCatching(factory).getOrElse { error ->
                return Result(
                    ok = false,
                    error = "Unable to prepare LSP provider $providerId: ${error.message.orEmpty()}",
                )
            }
        } ?: return Result(ok = false, error = "LSP provider is not registered: $providerId")
        if (spec.id != providerId) {
            return Result(ok = false, error = "LSP provider registration mismatch: $providerId")
        }
        val sessionId = "lsp-${spec.id}-${sessionSerial.incrementAndGet()}"
        val transport = transportFactory.create(sessionId, spec, forwardingListener)
        sessions[sessionId] = transport
        if (!transport.start()) {
            sessions.remove(sessionId, transport)
            transport.close()
            return Result(ok = false, error = "Unable to start LSP provider: ${spec.id}")
        }
        return Result(ok = true, sessionId = sessionId)
    }

    fun send(sessionId: String, messageJson: String): Result {
        val transport = sessions[sessionId]
            ?: return Result(ok = false, error = "Unknown LSP process session")
        return if (runCatching { transport.send(messageJson) }.getOrDefault(false)) {
            Result(ok = true, sessionId = sessionId)
        } else {
            Result(ok = false, sessionId = sessionId, error = "LSP process is not writable")
        }
    }

    fun markReady(sessionId: String): Result {
        val transport = sessions[sessionId]
            ?: return Result(ok = false, error = "Unknown LSP process session")
        return if (transport.markReady()) {
            Result(ok = true, sessionId = sessionId)
        } else {
            Result(ok = false, sessionId = sessionId, error = "LSP process handshake is not active")
        }
    }

    fun stop(sessionId: String): Result {
        val transport = sessions.remove(sessionId)
            ?: return Result(ok = false, error = "Unknown LSP process session")
        transport.close()
        return Result(ok = true, sessionId = sessionId)
    }

    fun activeSessionCount(): Int = sessions.size

    /** Debug/instrumentation hook; provider selection remains allowlisted. */
    internal fun forceCrashForTest(providerId: String): Int = sessions.values.count { transport ->
        transport.providerId == providerId && transport.forceCrashForTest()
    }

    override fun close() {
        if (closed) return
        closed = true
        val active = sessions.values.toList()
        sessions.clear()
        active.forEach(AceStdioLspProcessTransport::close)
    }

    private val forwardingListener = object : AceStdioLspProcessTransport.Listener {
        override fun onMessage(sessionId: String, messageJson: String) {
            if (!closed && sessions.containsKey(sessionId)) {
                listener.onMessage(sessionId, messageJson)
            }
        }

        override fun onStateChanged(
            sessionId: String,
            state: AceStdioLspProcessTransport.State,
            detail: String,
        ) {
            if (!closed && sessions.containsKey(sessionId)) {
                listener.onStateChanged(sessionId, state, detail)
            }
        }

        override fun onError(sessionId: String, message: String, error: Throwable?) {
            if (!closed && sessions.containsKey(sessionId)) {
                listener.onError(sessionId, message, error)
            }
        }
    }
}
