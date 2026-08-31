package io.github.supermonster003.autojs6.plugin.ace.editor.core.lsp

import java.io.ByteArrayInputStream
import java.io.InputStream
import java.io.OutputStream
import java.io.PipedInputStream
import java.io.PipedOutputStream
import java.util.concurrent.CountDownLatch
import java.util.concurrent.LinkedBlockingQueue
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicInteger
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class AceStdioLspProcessTransportTest {

    @Test
    fun processBuilderTransportEchoesFramedMessagesAndCompletesHandshake() {
        val listener = RecordingListener()
        val process = EchoProcess()
        val transport = transport(
            sessionId = "echo-session",
            listener = listener,
            processFactory = AceLspProcessFactory { process },
        )
        val message = """{"jsonrpc":"2.0","id":7,"method":"autojs6/echo"}"""

        assertTrue(transport.start())
        assertTrue(transport.markReady())
        assertTrue(transport.send(message))

        assertEquals(message, listener.messages.poll(2, TimeUnit.SECONDS))
        assertTrue(listener.awaitState(AceStdioLspProcessTransport.State.RUNNING))
        assertTrue(listener.states.any { it.first == AceStdioLspProcessTransport.State.READY })
        transport.close()
        assertTrue(listener.awaitState(AceStdioLspProcessTransport.State.STOPPED))
    }

    @Test
    fun missingInitializeHandshakeCrashesWithoutRestartWhenPolicyDisablesIt() {
        val listener = RecordingListener()
        val transport = transport(
            sessionId = "handshake-session",
            listener = listener,
            spec = spec(handshakeTimeoutMs = 30L, maxRestartAttempts = 0),
            processFactory = AceLspProcessFactory { EchoProcess(echo = false) },
        )

        assertTrue(transport.start())
        assertTrue(listener.awaitState(AceStdioLspProcessTransport.State.CRASHED, 2_000L))
        assertTrue(
            listener.states.any { (state, detail) ->
                state == AceStdioLspProcessTransport.State.CRASHED &&
                    detail.contains("initialize-handshake-timeout")
            },
        )
        transport.close()
    }

    @Test
    fun unexpectedExitUsesBoundedBackoffAndRestarts() {
        val listener = RecordingListener()
        val starts = AtomicInteger()
        val transport = transport(
            sessionId = "restart-session",
            listener = listener,
            spec = spec(
                handshakeTimeoutMs = 1_000L,
                maxRestartAttempts = 1,
                restartBaseDelayMs = 20L,
                restartMaxDelayMs = 100L,
            ),
            processFactory = AceLspProcessFactory {
                if (starts.incrementAndGet() == 1) EchoProcess(closeImmediately = true) else EchoProcess()
            },
        )

        assertTrue(transport.start())
        assertTrue(listener.awaitState(AceStdioLspProcessTransport.State.RESTART_WAIT, 2_000L))
        assertTrue(listener.awaitStateCount(AceStdioLspProcessTransport.State.RUNNING, 2, 2_000L))
        assertEquals(2, starts.get())
        assertTrue(transport.markReady())
        transport.close()

        assertEquals(250L, AceStdioLspProcessTransport.restartDelayMs(0, 250L, 10_000L))
        assertEquals(500L, AceStdioLspProcessTransport.restartDelayMs(1, 250L, 10_000L))
        assertEquals(10_000L, AceStdioLspProcessTransport.restartDelayMs(20, 250L, 10_000L))
    }

    @Test
    fun readyProcessExitsAfterIdleTimeout() {
        val listener = RecordingListener()
        val transport = transport(
            sessionId = "idle-session",
            listener = listener,
            spec = spec(idleTimeoutMs = 30L, maxRestartAttempts = 0),
            processFactory = AceLspProcessFactory { EchoProcess() },
        )

        assertTrue(transport.start())
        assertTrue(transport.markReady())
        assertTrue(listener.awaitState(AceStdioLspProcessTransport.State.IDLE_EXIT, 2_000L))
        assertEquals(AceStdioLspProcessTransport.State.IDLE_EXIT, transport.currentState())
        assertFalse(transport.send("{}"))
        transport.close()
    }

    @Test
    fun bridgeRegistryRejectsCommandsThatAreNotKotlinAllowlisted() {
        val registry = AceStdioLspProcessRegistry(
            listener = object : AceStdioLspProcessRegistry.Listener {
                override fun onMessage(sessionId: String, messageJson: String) = Unit

                override fun onStateChanged(
                    sessionId: String,
                    state: AceStdioLspProcessTransport.State,
                    detail: String,
                ) = Unit

                override fun onError(sessionId: String, message: String, error: Throwable?) = Unit
            },
        )

        val result = registry.start("../../arbitrary-command")

        assertFalse(result.ok)
        assertTrue(result.error.orEmpty().contains("not registered"))
        assertEquals(0, registry.activeSessionCount())
        registry.close()
    }

    @Test
    fun bridgeRegistryPreparesDynamicSpecsLazilyAndKeepsProviderIdFixed() {
        val preparations = AtomicInteger()
        val listener = registryListener()
        val registry = AceStdioLspProcessRegistry(
            dynamicSpecs = mapOf(
                "lua-luals" to {
                    preparations.incrementAndGet()
                    spec().copy(id = "lua-luals")
                },
            ),
            listener = listener,
            transportFactory = AceStdioLspProcessRegistry.TransportFactory {
                    sessionId,
                    dynamicSpec,
                    transportListener,
                ->
                AceStdioLspProcessTransport(
                    sessionId = sessionId,
                    spec = dynamicSpec,
                    listener = transportListener,
                    processFactory = AceLspProcessFactory { EchoProcess() },
                )
            },
        )

        assertEquals(0, preparations.get())
        assertFalse(registry.start("not-luals").ok)
        assertEquals(0, preparations.get())

        val started = registry.start("lua-luals")

        assertTrue(started.ok)
        assertTrue(started.sessionId.orEmpty().startsWith("lsp-lua-luals-"))
        assertEquals(1, preparations.get())
        assertEquals(1, registry.activeSessionCount())
        assertTrue(registry.markReady(requireNotNull(started.sessionId)).ok)
        assertTrue(registry.stop(started.sessionId).ok)
        assertEquals(0, registry.activeSessionCount())
        registry.close()
    }

    @Test
    fun bridgeRegistryReportsDynamicPreparationFailuresAndIdMismatches() {
        val listener = registryListener()
        val failingRegistry = AceStdioLspProcessRegistry(
            dynamicSpecs = mapOf(
                "lua-luals" to { error("runtime hash mismatch") },
            ),
            listener = listener,
        )

        val failed = failingRegistry.start("lua-luals")

        assertFalse(failed.ok)
        assertTrue(failed.error.orEmpty().contains("Unable to prepare"))
        assertTrue(failed.error.orEmpty().contains("runtime hash mismatch"))
        assertEquals(0, failingRegistry.activeSessionCount())
        failingRegistry.close()

        val mismatchedRegistry = AceStdioLspProcessRegistry(
            dynamicSpecs = mapOf(
                "lua-luals" to { spec().copy(id = "different-provider") },
            ),
            listener = listener,
        )
        val mismatched = mismatchedRegistry.start("lua-luals")
        assertFalse(mismatched.ok)
        assertTrue(mismatched.error.orEmpty().contains("registration mismatch"))
        assertEquals(0, mismatchedRegistry.activeSessionCount())
        mismatchedRegistry.close()
    }

    private fun transport(
        sessionId: String,
        listener: RecordingListener,
        spec: AceStdioLspServerSpec = spec(),
        processFactory: AceLspProcessFactory,
    ): AceStdioLspProcessTransport {
        return AceStdioLspProcessTransport(
            sessionId = sessionId,
            spec = spec,
            listener = listener,
            processFactory = processFactory,
        )
    }

    private fun registryListener() = object : AceStdioLspProcessRegistry.Listener {
        override fun onMessage(sessionId: String, messageJson: String) = Unit

        override fun onStateChanged(
            sessionId: String,
            state: AceStdioLspProcessTransport.State,
            detail: String,
        ) = Unit

        override fun onError(sessionId: String, message: String, error: Throwable?) = Unit
    }

    private class RecordingListener : AceStdioLspProcessTransport.Listener {
        val messages = LinkedBlockingQueue<String>()
        val states = mutableListOf<Pair<AceStdioLspProcessTransport.State, String>>()
        val errors = mutableListOf<String>()

        override fun onMessage(sessionId: String, messageJson: String) {
            messages += messageJson
        }

        override fun onStateChanged(
            sessionId: String,
            state: AceStdioLspProcessTransport.State,
            detail: String,
        ) {
            synchronized(states) { states += state to detail }
        }

        override fun onError(sessionId: String, message: String, error: Throwable?) {
            synchronized(errors) { errors += message }
        }

        fun awaitState(state: AceStdioLspProcessTransport.State, timeoutMs: Long = 500L): Boolean {
            return awaitStateCount(state, 1, timeoutMs)
        }

        fun awaitStateCount(
            state: AceStdioLspProcessTransport.State,
            count: Int,
            timeoutMs: Long,
        ): Boolean {
            val deadline = System.nanoTime() + TimeUnit.MILLISECONDS.toNanos(timeoutMs)
            while (System.nanoTime() < deadline) {
                if (synchronized(states) { states.count { it.first == state } >= count }) return true
                Thread.yield()
            }
            return synchronized(states) { states.count { it.first == state } >= count }
        }
    }

    private class EchoProcess(
        private val echo: Boolean = true,
        private val closeImmediately: Boolean = false,
    ) : Process() {
        private val serverInput = PipedInputStream(16 * 1024)
        private val clientOutput = PipedOutputStream(serverInput)
        private val clientInput = PipedInputStream(16 * 1024)
        private val serverOutput = PipedOutputStream(clientInput)
        private val errorInput = ByteArrayInputStream(ByteArray(0))
        private val exitLatch = CountDownLatch(1)

        @Volatile
        private var exitCode: Int? = null

        init {
            Thread({ runServer() }, "ace-lsp-test-echo").apply {
                isDaemon = true
                start()
            }
        }

        private fun runServer() {
            try {
                if (closeImmediately) return
                while (true) {
                    val message = AceLspMessageFraming.read(serverInput) ?: break
                    if (echo) AceLspMessageFraming.write(serverOutput, message)
                }
            } catch (_: Throwable) {
                // Pipe closure is the expected test-process shutdown path.
            } finally {
                finish(0)
            }
        }

        private fun finish(code: Int) {
            if (exitCode != null) return
            exitCode = code
            runCatching { serverOutput.close() }
            runCatching { serverInput.close() }
            exitLatch.countDown()
        }

        override fun getOutputStream(): OutputStream = clientOutput

        override fun getInputStream(): InputStream = clientInput

        override fun getErrorStream(): InputStream = errorInput

        override fun waitFor(): Int {
            exitLatch.await()
            return exitCode ?: 0
        }

        override fun exitValue(): Int = exitCode ?: throw IllegalThreadStateException("still running")

        override fun destroy() {
            runCatching { clientOutput.close() }
            runCatching { clientInput.close() }
            finish(0)
        }

        override fun isAlive(): Boolean = exitCode == null
    }

    private companion object {
        fun spec(
            handshakeTimeoutMs: Long = 1_000L,
            idleTimeoutMs: Long = 1_000L,
            maxRestartAttempts: Int = 0,
            restartBaseDelayMs: Long = 20L,
            restartMaxDelayMs: Long = 100L,
        ) = AceStdioLspServerSpec(
            id = "mock",
            command = listOf("mock-lsp-server"),
            handshakeTimeoutMs = handshakeTimeoutMs,
            idleTimeoutMs = idleTimeoutMs,
            maxRestartAttempts = maxRestartAttempts,
            restartBaseDelayMs = restartBaseDelayMs,
            restartMaxDelayMs = restartMaxDelayMs,
        )
    }
}
