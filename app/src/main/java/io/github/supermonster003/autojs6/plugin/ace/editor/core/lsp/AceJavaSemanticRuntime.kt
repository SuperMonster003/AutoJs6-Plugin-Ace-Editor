package io.github.supermonster003.autojs6.plugin.ace.editor.core.lsp

import android.content.Context
import android.os.Debug
import android.os.Process
import android.os.SystemClock
import org.json.JSONArray
import org.json.JSONObject
import java.util.concurrent.ScheduledFuture
import java.util.concurrent.ScheduledThreadPoolExecutor
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicBoolean

/**
 * Bounded, latest-request-only execution boundary for ECJ.
 *
 * ECJ is deliberately kept away from the WebView/UI thread. A single background-priority worker
 * serializes compiles, cancelled/stale requests are never published, and a soft heap circuit opens
 * before or after a compile that would violate the Java semantic memory budget. The editor-side
 * debounce remains the first throttle; [MIN_COMPILE_INTERVAL_MS] is the native backstop.
 */
internal class AceJavaSemanticRuntime(
    context: Context,
    private val listener: Listener,
    private val engine: AceJavaDiagnosticEngine = AceEcjDiagnosticCompiler {
        AceJavaClasspathRuntime.ensureInstalled(context)
    },
    private val runtimeMemory: Runtime = Runtime.getRuntime(),
) : AutoCloseable {

    fun interface Listener {
        fun onResponse(responseJson: String)
    }

    private val applicationContext = context.applicationContext ?: context
    private val closed = AtomicBoolean(false)
    private val stateLock = Any()
    private val executor = ScheduledThreadPoolExecutor(1) { runnable ->
        Thread(
            {
                runCatching { Process.setThreadPriority(Process.THREAD_PRIORITY_BACKGROUND) }
                runnable.run()
            },
            WORKER_THREAD_NAME,
        ).apply {
            isDaemon = true
            priority = Thread.MIN_PRIORITY
        }
    }.apply {
        setRemoveOnCancelPolicy(true)
        maximumPoolSize = 1
        continueExistingPeriodicTasksAfterShutdownPolicy = false
        executeExistingDelayedTasksAfterShutdownPolicy = false
    }

    private var requestSerial = 0L
    private var currentRequestId: String? = null
    private var pendingFuture: ScheduledFuture<*>? = null
    private var lastCompileStartedAt = 0L
    private var acceptedCount = 0L
    private var completedCount = 0L
    private var staleDropCount = 0L
    private var cancelledCount = 0L
    private var rejectedCount = 0L
    private var memoryCircuitOpen = false
    private var lastDurationMs = 0.0
    private var lastHeapDeltaBytes = 0L
    private var lastPssDeltaKb = 0L
    private var lastErrorCode = ""

    fun isSupported(): Boolean = !closed.get() && AceJavaClasspathRuntime.isSupported(applicationContext)

    /** Accepts a JSON request and returns immediately; completion arrives through [Listener]. */
    fun requestDiagnostics(requestJson: String): String {
        if (closed.get()) {
            return rejectedResponse(null, ERROR_RUNTIME_CLOSED, "Java diagnostic runtime is closed")
        }
        val request = runCatching { parseRequest(requestJson) }.getOrElse { error ->
            synchronized(stateLock) {
                rejectedCount++
                lastErrorCode = ERROR_INVALID_REQUEST
            }
            return rejectedResponse(
                null,
                ERROR_INVALID_REQUEST,
                error.message ?: "Invalid Java diagnostic request",
            )
        }
        if (request.source.length > MAX_DOCUMENT_LENGTH) {
            synchronized(stateLock) {
                rejectedCount++
                lastErrorCode = ERROR_DOCUMENT_TOO_LARGE
            }
            return rejectedResponse(
                request.requestId,
                ERROR_DOCUMENT_TOO_LARGE,
                "Java document exceeds the $MAX_DOCUMENT_LENGTH character limit",
            )
        }

        val serial: Long
        val delayMs: Long
        synchronized(stateLock) {
            if (closed.get()) {
                return rejectedResponse(
                    request.requestId,
                    ERROR_RUNTIME_CLOSED,
                    "Java diagnostic runtime is closed",
                )
            }
            if (memoryCircuitOpen) {
                rejectedCount++
                lastErrorCode = ERROR_MEMORY_CIRCUIT_OPEN
                return rejectedResponse(
                    request.requestId,
                    ERROR_MEMORY_CIRCUIT_OPEN,
                    "Java diagnostics are disabled after exceeding the memory budget",
                )
            }
            pendingFuture?.cancel(false)
            requestSerial++
            serial = requestSerial
            currentRequestId = request.requestId
            acceptedCount++
            val earliestStart = lastCompileStartedAt + MIN_COMPILE_INTERVAL_MS
            delayMs = (earliestStart - SystemClock.uptimeMillis()).coerceAtLeast(0L)
            pendingFuture = executor.schedule(
                { compile(request, serial) },
                delayMs,
                TimeUnit.MILLISECONDS,
            )
        }
        return JSONObject()
            .put("ok", true)
            .put("accepted", true)
            .put("requestId", request.requestId)
            .put("serial", serial)
            .put("delayMs", delayMs)
            .put("maxDocumentLength", MAX_DOCUMENT_LENGTH)
            .toString()
    }

    fun cancelDiagnostics(requestId: String): String {
        val normalized = requestId.trim().take(MAX_REQUEST_ID_LENGTH)
        val cancelled = synchronized(stateLock) {
            if (normalized.isEmpty() || currentRequestId != normalized) {
                false
            } else {
                requestSerial++
                currentRequestId = null
                pendingFuture?.cancel(false)
                pendingFuture = null
                cancelledCount++
                true
            }
        }
        return JSONObject()
            .put("ok", true)
            .put("requestId", normalized)
            .put("cancelled", cancelled)
            .toString()
    }

    fun stateJson(): String = synchronized(stateLock) {
        JSONObject()
            .put("providerId", AceJavaClasspathRuntime.PROVIDER_ID)
            .put("ecjVersion", AceJavaClasspathRuntime.ECJ_VERSION)
            .put("closed", closed.get())
            .put("memoryCircuitOpen", memoryCircuitOpen)
            .put("requestSerial", requestSerial)
            .put("currentRequestId", currentRequestId)
            .put("acceptedCount", acceptedCount)
            .put("completedCount", completedCount)
            .put("staleDropCount", staleDropCount)
            .put("cancelledCount", cancelledCount)
            .put("rejectedCount", rejectedCount)
            .put("lastDurationMs", lastDurationMs)
            .put("lastHeapDeltaBytes", lastHeapDeltaBytes)
            .put("lastPssDeltaKb", lastPssDeltaKb)
            .put("lastErrorCode", lastErrorCode)
            .put("maxDocumentLength", MAX_DOCUMENT_LENGTH)
            .put("minimumAvailableHeapBytes", MIN_AVAILABLE_HEAP_BYTES)
            .put("maxCompileHeapGrowthBytes", MAX_COMPILE_HEAP_GROWTH_BYTES)
            .put("minCompileIntervalMs", MIN_COMPILE_INTERVAL_MS)
            .toString()
    }

    private fun compile(request: Request, serial: Long) {
        synchronized(stateLock) {
            if (!isCurrent(serial, request.requestId)) {
                staleDropCount++
                return
            }
            pendingFuture = null
            lastCompileStartedAt = SystemClock.uptimeMillis()
        }

        val heapBefore = usedHeapBytes()
        val availableHeap = (runtimeMemory.maxMemory() - heapBefore).coerceAtLeast(0L)
        if (availableHeap < MIN_AVAILABLE_HEAP_BYTES) {
            synchronized(stateLock) {
                memoryCircuitOpen = true
                rejectedCount++
                lastErrorCode = ERROR_INSUFFICIENT_HEAP
            }
            publishIfCurrent(
                request,
                serial,
                errorResponse(
                    request,
                    ERROR_INSUFFICIENT_HEAP,
                    "Java diagnostics require at least $MIN_AVAILABLE_HEAP_BYTES bytes of free heap",
                    heapBefore,
                    availableHeap,
                ),
            )
            return
        }

        val pssBeforeKb = currentPssKb()
        val response = try {
            val result = engine.diagnose(request.documentUri, request.source)
            val heapAfter = usedHeapBytes()
            val heapDelta = (heapAfter - heapBefore).coerceAtLeast(0L)
            val pssDeltaKb = (currentPssKb() - pssBeforeKb).coerceAtLeast(0L)
            val exceeded = heapDelta > MAX_COMPILE_HEAP_GROWTH_BYTES
            synchronized(stateLock) {
                completedCount++
                lastDurationMs = result.durationMs
                lastHeapDeltaBytes = heapDelta
                lastPssDeltaKb = pssDeltaKb
                lastErrorCode = if (exceeded) ERROR_MEMORY_LIMIT_EXCEEDED else ""
                if (exceeded) memoryCircuitOpen = true
            }
            successResponse(
                request = request,
                serial = serial,
                result = result,
                heapUsedBytes = heapAfter,
                heapDeltaBytes = heapDelta,
                availableHeapBeforeBytes = availableHeap,
                pssDeltaKb = pssDeltaKb,
                memoryLimitExceeded = exceeded,
            )
        } catch (error: OutOfMemoryError) {
            synchronized(stateLock) {
                memoryCircuitOpen = true
                rejectedCount++
                lastErrorCode = ERROR_OUT_OF_MEMORY
            }
            errorResponse(
                request,
                ERROR_OUT_OF_MEMORY,
                "ECJ exhausted the Java semantic memory budget",
                heapBefore,
                availableHeap,
            )
        } catch (error: Throwable) {
            synchronized(stateLock) {
                rejectedCount++
                lastErrorCode = ERROR_COMPILER_FAILURE
            }
            errorResponse(
                request,
                ERROR_COMPILER_FAILURE,
                error.message ?: error.javaClass.simpleName,
                heapBefore,
                availableHeap,
            )
        }
        publishIfCurrent(request, serial, response)
    }

    private fun successResponse(
        request: Request,
        serial: Long,
        result: AceJavaDiagnosticResult,
        heapUsedBytes: Long,
        heapDeltaBytes: Long,
        availableHeapBeforeBytes: Long,
        pssDeltaKb: Long,
        memoryLimitExceeded: Boolean,
    ): String {
        val diagnostics = JSONArray()
        result.diagnostics.forEach { diagnostic ->
            diagnostics.put(
                JSONObject()
                    .put("row", diagnostic.row)
                    .put("column", diagnostic.column)
                    .put("endRow", diagnostic.endRow)
                    .put("endColumn", diagnostic.endColumn)
                    .put("message", diagnostic.message)
                    .put("severity", diagnostic.severity)
                    .put("code", diagnostic.code)
                    .put("category", diagnostic.category),
            )
        }
        return JSONObject()
            .put("ok", true)
            .put("requestId", request.requestId)
            .put("serial", serial)
            .put("documentUri", request.documentUri)
            .put("diagnostics", diagnostics)
            .put("diagnosticCount", diagnostics.length())
            .put("durationMs", result.durationMs)
            .put("classpathBytes", result.classpathBytes)
            .put("heapUsedBytes", heapUsedBytes)
            .put("heapDeltaBytes", heapDeltaBytes)
            .put("availableHeapBeforeBytes", availableHeapBeforeBytes)
            .put("pssDeltaKb", pssDeltaKb)
            .put("memoryLimitExceeded", memoryLimitExceeded)
            .toString()
    }

    private fun errorResponse(
        request: Request,
        code: String,
        message: String,
        heapUsedBytes: Long,
        availableHeapBytes: Long,
    ): String = JSONObject()
        .put("ok", false)
        .put("requestId", request.requestId)
        .put("documentUri", request.documentUri)
        .put("code", code)
        .put("error", message.take(MAX_ERROR_LENGTH))
        .put("heapUsedBytes", heapUsedBytes)
        .put("availableHeapBytes", availableHeapBytes)
        .toString()

    private fun publishIfCurrent(request: Request, serial: Long, responseJson: String) {
        val publish = synchronized(stateLock) {
            if (!isCurrent(serial, request.requestId)) {
                staleDropCount++
                false
            } else {
                currentRequestId = null
                true
            }
        }
        if (publish) {
            runCatching { listener.onResponse(responseJson) }
        }
    }

    private fun isCurrent(serial: Long, requestId: String): Boolean =
        !closed.get() && requestSerial == serial && currentRequestId == requestId

    private fun parseRequest(requestJson: String): Request {
        require(requestJson.length <= MAX_REQUEST_JSON_LENGTH) { "Java diagnostic request is too large" }
        val root = JSONObject(requestJson)
        val requestId = root.opt("requestId")?.toString().orEmpty().trim()
        require(requestId.isNotEmpty()) { "requestId is required" }
        require(requestId.length <= MAX_REQUEST_ID_LENGTH) { "requestId is too long" }
        val documentUri = root.optString("documentUri", DEFAULT_DOCUMENT_URI).trim()
        require(documentUri.isNotEmpty() && documentUri.length <= MAX_DOCUMENT_URI_LENGTH) {
            "documentUri is invalid"
        }
        require(documentUri.substringBefore('?').substringBefore('#').endsWith(".java", true)) {
            "Only Java documents are supported"
        }
        require(root.has("source")) { "source is required" }
        return Request(
            requestId = requestId,
            documentUri = documentUri,
            source = root.optString("source", ""),
        )
    }

    private fun usedHeapBytes(): Long =
        (runtimeMemory.totalMemory() - runtimeMemory.freeMemory()).coerceAtLeast(0L)

    private fun currentPssKb(): Long = runCatching { Debug.getPss().toLong() }.getOrDefault(0L)

    private fun rejectedResponse(requestId: String?, code: String, message: String): String =
        JSONObject()
            .put("ok", false)
            .put("accepted", false)
            .put("requestId", requestId)
            .put("code", code)
            .put("error", message.take(MAX_ERROR_LENGTH))
            .toString()

    override fun close() {
        if (!closed.compareAndSet(false, true)) return
        synchronized(stateLock) {
            requestSerial++
            currentRequestId = null
            pendingFuture?.cancel(false)
            pendingFuture = null
        }
        executor.shutdownNow()
    }

    private data class Request(
        val requestId: String,
        val documentUri: String,
        val source: String,
    )

    companion object {
        const val MAX_DOCUMENT_LENGTH = 512 * 1024
        const val MIN_COMPILE_INTERVAL_MS = 250L
        const val MIN_AVAILABLE_HEAP_BYTES = 48L * 1024L * 1024L
        const val MAX_COMPILE_HEAP_GROWTH_BYTES = 64L * 1024L * 1024L

        private const val WORKER_THREAD_NAME = "ace-java-ecj"
        private const val DEFAULT_DOCUMENT_URI = "file:///autojs6/editor/Current.java"
        private const val MAX_REQUEST_ID_LENGTH = 128
        private const val MAX_DOCUMENT_URI_LENGTH = 4 * 1024
        private const val MAX_REQUEST_JSON_LENGTH = MAX_DOCUMENT_LENGTH + MAX_DOCUMENT_URI_LENGTH + 16 * 1024
        private const val MAX_ERROR_LENGTH = 512
        private const val ERROR_INVALID_REQUEST = "invalid-request"
        private const val ERROR_DOCUMENT_TOO_LARGE = "document-too-large"
        private const val ERROR_RUNTIME_CLOSED = "runtime-closed"
        private const val ERROR_MEMORY_CIRCUIT_OPEN = "memory-circuit-open"
        private const val ERROR_INSUFFICIENT_HEAP = "insufficient-heap"
        private const val ERROR_MEMORY_LIMIT_EXCEEDED = "memory-limit-exceeded"
        private const val ERROR_OUT_OF_MEMORY = "out-of-memory"
        private const val ERROR_COMPILER_FAILURE = "compiler-failure"
    }
}
