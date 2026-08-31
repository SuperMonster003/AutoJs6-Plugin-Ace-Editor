package io.github.supermonster003.autojs6.plugin.ace.editor.core.lsp

import java.io.BufferedInputStream
import java.io.BufferedOutputStream
import java.io.File
import java.io.InputStream
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors
import java.util.concurrent.ScheduledExecutorService
import java.util.concurrent.ScheduledFuture
import java.util.concurrent.TimeUnit

internal data class AceStdioLspServerSpec(
    val id: String,
    val command: List<String>,
    val workingDirectory: File? = null,
    val environment: Map<String, String> = emptyMap(),
    val handshakeTimeoutMs: Long = 5_000L,
    val idleTimeoutMs: Long = 5 * 60_000L,
    val maxRestartAttempts: Int = 3,
    val restartBaseDelayMs: Long = 250L,
    val restartMaxDelayMs: Long = 10_000L,
) {
    init {
        require(id.matches(Regex("[a-z0-9][a-z0-9._-]{0,63}"))) { "Invalid LSP server id" }
        require(command.isNotEmpty() && command.none(String::isBlank)) { "LSP command must not be empty" }
        require(handshakeTimeoutMs > 0L) { "Handshake timeout must be positive" }
        require(idleTimeoutMs > 0L) { "Idle timeout must be positive" }
        require(maxRestartAttempts >= 0) { "Restart attempt count must not be negative" }
        require(restartBaseDelayMs > 0L && restartMaxDelayMs >= restartBaseDelayMs) {
            "Invalid LSP restart backoff"
        }
    }
}

internal fun interface AceLspProcessFactory {
    fun start(spec: AceStdioLspServerSpec): Process
}

internal object AceProcessBuilderLspProcessFactory : AceLspProcessFactory {
    override fun start(spec: AceStdioLspServerSpec): Process {
        return ProcessBuilder(spec.command)
            .directory(spec.workingDirectory)
            .redirectErrorStream(false)
            .apply { environment().putAll(spec.environment) }
            .start()
    }
}

internal class AceStdioLspProcessTransport(
    private val sessionId: String,
    private val spec: AceStdioLspServerSpec,
    private val listener: Listener,
    private val processFactory: AceLspProcessFactory = AceProcessBuilderLspProcessFactory,
    private val scheduler: ScheduledExecutorService = newDaemonScheduler(sessionId),
    private val ioExecutor: ExecutorService = newDaemonIoExecutor(sessionId),
) : AutoCloseable {

    internal val providerId: String
        get() = spec.id

    enum class State(val wireValue: String) {
        IDLE("idle"),
        STARTING("starting"),
        RUNNING("running"),
        READY("ready"),
        RESTART_WAIT("restart-wait"),
        CRASHED("crashed"),
        IDLE_EXIT("idle-exit"),
        STOPPED("stopped"),
    }

    interface Listener {
        fun onMessage(sessionId: String, messageJson: String)

        fun onStateChanged(sessionId: String, state: State, detail: String = "")

        fun onError(sessionId: String, message: String, error: Throwable? = null)
    }

    private val outputLock = Any()

    @Volatile
    private var state = State.IDLE

    @Volatile
    private var process: Process? = null

    @Volatile
    private var closed = false

    private var generation = 0L
    private var ready = false
    private var restartAttempt = 0
    private var expectedStop = false
    private var output: BufferedOutputStream? = null
    private var handshakeFuture: ScheduledFuture<*>? = null
    private var idleFuture: ScheduledFuture<*>? = null
    private var restartFuture: ScheduledFuture<*>? = null
    private var stderrTail = ""

    @Synchronized
    fun start(): Boolean {
        if (closed) return false
        if (process != null || state == State.RESTART_WAIT) return true
        expectedStop = false
        return startProcessLocked() || state == State.RESTART_WAIT
    }

    @Synchronized
    private fun startProcessLocked(): Boolean {
        if (closed || expectedStop) return false
        transition(State.STARTING)
        val launched = runCatching { processFactory.start(spec) }
            .onFailure { error ->
                listener.onError(sessionId, "Unable to start ${spec.id}: ${error.message.orEmpty()}", error)
            }
            .getOrNull()
        if (launched == null) {
            scheduleRestartLocked("start-failed")
            return false
        }
        generation += 1
        val processGeneration = generation
        process = launched
        output = BufferedOutputStream(launched.outputStream)
        ready = false
        stderrTail = ""
        transition(State.RUNNING)
        handshakeFuture?.cancel(false)
        handshakeFuture = scheduler.schedule(
            { failCurrent(processGeneration, launched, "initialize-handshake-timeout", null) },
            spec.handshakeTimeoutMs,
            TimeUnit.MILLISECONDS,
        )
        ioExecutor.execute { readMessages(processGeneration, launched, launched.inputStream) }
        ioExecutor.execute { drainStderr(processGeneration, launched.errorStream) }
        ioExecutor.execute { waitForExit(processGeneration, launched) }
        return true
    }

    fun send(messageJson: String): Boolean {
        require(messageJson.isNotBlank()) { "LSP message must not be blank" }
        val targetOutput = synchronized(this) {
            if (closed || process == null || expectedStop) return false
            output
        } ?: return false
        return runCatching {
            synchronized(outputLock) {
                AceLspMessageFraming.write(targetOutput, messageJson)
            }
            touchActivity()
            true
        }.getOrElse { error ->
            val target = process
            if (target != null) {
                failCurrent(generation, target, "write-failed", error)
            }
            false
        }
    }

    @Synchronized
    fun markReady(): Boolean {
        if (closed || process == null || expectedStop) return false
        ready = true
        restartAttempt = 0
        handshakeFuture?.cancel(false)
        handshakeFuture = null
        transition(State.READY)
        scheduleIdleExitLocked(generation)
        return true
    }

    @Synchronized
    fun currentState(): State = state

    /** Debug/instrumentation hook; production JavaScript cannot reach this method. */
    internal fun forceCrashForTest(): Boolean {
        val target = synchronized(this) {
            process?.takeIf { !closed && !expectedStop }
        } ?: return false
        return runCatching {
            target.destroyForcibly()
            true
        }.getOrDefault(false)
    }

    private fun readMessages(processGeneration: Long, target: Process, source: InputStream) {
        val input = BufferedInputStream(source)
        try {
            while (!closed) {
                val message = AceLspMessageFraming.read(input) ?: return
                synchronized(this) {
                    if (processGeneration != generation || process !== target) return
                }
                touchActivity()
                listener.onMessage(sessionId, message)
            }
        } catch (error: Throwable) {
            failCurrent(processGeneration, target, "read-failed", error)
        }
    }

    private fun drainStderr(processGeneration: Long, source: InputStream) {
        runCatching {
            val buffer = ByteArray(1024)
            while (!closed) {
                val count = source.read(buffer)
                if (count < 0) return@runCatching
                if (count == 0) continue
                val chunk = String(buffer, 0, count, Charsets.UTF_8)
                synchronized(this) {
                    if (processGeneration != generation) return@runCatching
                    stderrTail = (stderrTail + chunk).takeLast(MAX_STDERR_TAIL_CHARS)
                }
            }
        }
    }

    private fun waitForExit(processGeneration: Long, target: Process) {
        val exitCode = runCatching { target.waitFor() }.getOrDefault(-1)
        val detail = synchronized(this) {
            if (processGeneration != generation || process !== target || expectedStop || closed) {
                return
            }
            "exit-code=$exitCode" + stderrTail.trim().takeIf(String::isNotEmpty)?.let { ",stderr=$it" }.orEmpty()
        }
        failCurrent(processGeneration, target, detail, null)
    }

    private fun touchActivity() {
        synchronized(this) {
            if (ready && !closed && !expectedStop && process != null) {
                scheduleIdleExitLocked(generation)
            }
        }
    }

    @Synchronized
    private fun scheduleIdleExitLocked(processGeneration: Long) {
        idleFuture?.cancel(false)
        idleFuture = scheduler.schedule(
            {
                val target = synchronized(this) {
                    if (
                        closed || expectedStop || !ready || processGeneration != generation ||
                        state != State.READY
                    ) {
                        return@schedule
                    }
                    expectedStop = true
                    val active = process
                    process = null
                    output = null
                    cancelLifecycleFuturesLocked()
                    transition(State.IDLE_EXIT, "idle-timeout")
                    active
                }
                closeProcess(target)
            },
            spec.idleTimeoutMs,
            TimeUnit.MILLISECONDS,
        )
    }

    private fun failCurrent(
        processGeneration: Long,
        target: Process,
        detail: String,
        error: Throwable?,
    ) {
        val shouldClose = synchronized(this) {
            if (
                closed || expectedStop || processGeneration != generation ||
                process !== target
            ) {
                return
            }
            process = null
            output = null
            ready = false
            cancelLifecycleFuturesLocked()
            transition(State.CRASHED, detail)
            if (error != null) {
                listener.onError(
                    sessionId,
                    "${spec.id} stdio transport failed: $detail: ${error.message.orEmpty()}",
                    error,
                )
            }
            scheduleRestartLocked(detail)
            true
        }
        if (shouldClose) closeProcess(target)
    }

    @Synchronized
    private fun scheduleRestartLocked(detail: String) {
        if (closed || expectedStop || restartAttempt >= spec.maxRestartAttempts) return
        val delayMs = restartDelayMs(
            restartAttempt,
            spec.restartBaseDelayMs,
            spec.restartMaxDelayMs,
        )
        restartAttempt += 1
        transition(State.RESTART_WAIT, "$detail,delay-ms=$delayMs")
        restartFuture?.cancel(false)
        restartFuture = scheduler.schedule(
            {
                synchronized(this) {
                    restartFuture = null
                    if (!closed && !expectedStop && process == null) startProcessLocked()
                }
            },
            delayMs,
            TimeUnit.MILLISECONDS,
        )
    }

    fun stop(reason: String = "bridge-stop") {
        val target = synchronized(this) {
            if (expectedStop && process == null) return
            expectedStop = true
            ready = false
            val active = process
            process = null
            output = null
            cancelLifecycleFuturesLocked()
            transition(State.STOPPED, reason)
            active
        }
        closeProcess(target)
    }

    override fun close() {
        if (closed) return
        stop("transport-close")
        closed = true
        scheduler.shutdownNow()
        ioExecutor.shutdownNow()
    }

    @Synchronized
    private fun cancelLifecycleFuturesLocked() {
        handshakeFuture?.cancel(false)
        idleFuture?.cancel(false)
        handshakeFuture = null
        idleFuture = null
    }

    private fun transition(next: State, detail: String = "") {
        state = next
        listener.onStateChanged(sessionId, next, detail)
    }

    private fun closeProcess(target: Process?) {
        if (target == null) return
        runCatching { target.outputStream.close() }
        runCatching { target.inputStream.close() }
        runCatching { target.errorStream.close() }
        runCatching { target.destroy() }
    }

    companion object {
        private const val MAX_STDERR_TAIL_CHARS = 2_000

        fun restartDelayMs(attempt: Int, baseDelayMs: Long, maxDelayMs: Long): Long {
            val boundedAttempt = attempt.coerceIn(0, 30)
            var result = baseDelayMs
            repeat(boundedAttempt) {
                result = (result * 2).coerceAtMost(maxDelayMs)
            }
            return result.coerceAtMost(maxDelayMs)
        }

        private fun newDaemonScheduler(sessionId: String): ScheduledExecutorService =
            Executors.newSingleThreadScheduledExecutor { runnable ->
                Thread(runnable, "ace-lsp-stdio-scheduler-$sessionId").apply { isDaemon = true }
            }

        private fun newDaemonIoExecutor(sessionId: String): ExecutorService =
            Executors.newCachedThreadPool { runnable ->
                Thread(runnable, "ace-lsp-stdio-io-$sessionId").apply { isDaemon = true }
            }
    }
}
