package io.github.supermonster003.autojs6.plugin.ace.editor.core.lsp

import android.os.Build
import android.os.Debug
import android.util.Log
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import dalvik.system.DexClassLoader
import java.io.File
import java.lang.reflect.InvocationTargetException
import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Assume.assumeTrue
import org.junit.Test
import org.junit.runner.RunWith

/**
 * Manual G6-3 ART gate. The D8 output is intentionally not committed or packaged after the gate
 * failed. Inject `classes.dex` into targetContext.filesDir and pass `g6JdtDexFile=<name>` to run.
 */
@RunWith(AndroidJUnit4::class)
class AceJdtCodeAssistArtGateTest {

    @Test
    fun fullJdtGraphLoadsOnArtButCannotBootstrapItsRequiredEclipseWorkspace() {
        val instrumentation = InstrumentationRegistry.getInstrumentation()
        val context = instrumentation.targetContext
        val dexFileName = InstrumentationRegistry.getArguments().getString(ARGUMENT_DEX_FILE).orEmpty()
        assumeTrue("Pass $ARGUMENT_DEX_FILE to run the manual G6-3 gate", dexFileName.isNotBlank())
        assertTrue("G6-3 dex filename must be a basename", dexFileName == File(dexFileName).name)
        val dexFile = File(context.filesDir, dexFileName)
        assertTrue("Injected G6-3 dex is missing: $dexFile", dexFile.isFile)
        assertTrue("Injected G6-3 dex is unexpectedly small", dexFile.length() > 10_000_000L)
        assertTrue("Injected G6-3 dex must be read-only on modern ART", dexFile.setReadOnly() || !dexFile.canWrite())

        val optimizedDirectory = File(context.codeCacheDir, "g6-3-jdt-codeassist").apply {
            assertTrue(isDirectory || mkdirs())
        }
        val pssBeforeKb = Debug.getPss().toLong()
        val heapBeforeBytes = usedHeapBytes()
        val startedNanos = System.nanoTime()
        val loader = DexClassLoader(
            dexFile.absolutePath,
            optimizedDirectory.absolutePath,
            null,
            javaClass.classLoader,
        )
        val completionEngine = loader.loadClass("org.eclipse.jdt.internal.codeassist.CompletionEngine")
        val resourcesPlugin = loader.loadClass("org.eclipse.core.resources.ResourcesPlugin")
        val classLoadMs = (System.nanoTime() - startedNanos) / 1_000_000.0

        val workspaceFailure = runCatching {
            resourcesPlugin.getMethod("getWorkspace").invoke(null)
        }.exceptionOrNull().rootCause()
        val pssAfterKb = Debug.getPss().toLong()
        val heapAfterBytes = usedHeapBytes()

        assertEquals(IllegalStateException::class.java.name, workspaceFailure?.javaClass?.name)
        assertTrue(
            "JDT workspace failure changed: ${workspaceFailure?.message}",
            workspaceFailure?.message.orEmpty().contains("Workspace", ignoreCase = true),
        )
        assertTrue(completionEngine.constructors.isNotEmpty())

        val report = JSONObject().apply {
            put("gate", "G6-3")
            put("accepted", false)
            put("reason", "eclipse-workspace-service-unavailable-on-art")
            put("sdk", Build.VERSION.SDK_INT)
            put("release", Build.VERSION.RELEASE)
            put("abi", Build.SUPPORTED_ABIS.firstOrNull().orEmpty())
            put("dexBytes", dexFile.length())
            put("classLoadMs", classLoadMs)
            put("pssBeforeKb", pssBeforeKb)
            put("pssAfterKb", pssAfterKb)
            put("pssDeltaKb", pssAfterKb - pssBeforeKb)
            put("heapBeforeBytes", heapBeforeBytes)
            put("heapAfterBytes", heapAfterBytes)
            put("heapDeltaBytes", heapAfterBytes - heapBeforeBytes)
            put("completionEngineConstructorCount", completionEngine.constructors.size)
            put("failureType", workspaceFailure?.javaClass?.name.orEmpty())
            put("failureMessage", workspaceFailure?.message.orEmpty())
        }
        Log.i(TAG, "$RESULT_PREFIX$report")
        println("$RESULT_PREFIX$report")
    }

    private fun usedHeapBytes(): Long {
        val runtime = Runtime.getRuntime()
        return runtime.totalMemory() - runtime.freeMemory()
    }

    private fun Throwable?.rootCause(): Throwable? {
        var current = this ?: return null
        if (current is InvocationTargetException && current.targetException != null) {
            current = current.targetException
        }
        while (current.cause != null && current.cause !== current) {
            current = current.cause!!
        }
        return current
    }

    private companion object {
        const val ARGUMENT_DEX_FILE = "g6JdtDexFile"
        const val TAG = "AutoJs6JdtGate"
        const val RESULT_PREFIX = "AUTOJS6_JDT_G6_3_RESULT="
    }
}
