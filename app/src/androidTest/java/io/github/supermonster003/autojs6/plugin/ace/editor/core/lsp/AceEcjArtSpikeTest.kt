package io.github.supermonster003.autojs6.plugin.ace.editor.core.lsp

import android.os.Build
import android.os.Debug
import android.os.SystemClock
import android.util.Log
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.eclipse.jdt.core.compiler.batch.BatchCompiler
import org.json.JSONObject
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import java.io.File
import java.io.PrintWriter
import java.io.StringWriter

/**
 * M6 G6-0 feasibility gate: prove that a fixed ECJ batch compiler survives D8, loads on ART,
 * compiles a single Java file, and reports source diagnostics with stable line evidence.
 *
 * The gate consumes the same class-only API 36 stub jar shipped by the production provider, so it
 * also protects the M6-2 packaging contract instead of testing a larger SDK-only classpath.
 */
@RunWith(AndroidJUnit4::class)
class AceEcjArtSpikeTest {

    @Test
    fun ecjBatchCompilerCompilesAndReportsDiagnosticsOnArt() {
        val instrumentation = InstrumentationRegistry.getInstrumentation()
        val targetContext = instrumentation.targetContext
        val workRoot = File(targetContext.cacheDir, WORK_DIRECTORY_NAME)

        workRoot.deleteRecursively()
        assertTrue("Could not create ECJ spike directory: $workRoot", workRoot.mkdirs())

        try {
            val classpath = File(workRoot, "android.jar")
            targetContext.assets.open(ANDROID_JAR_ASSET).use { input ->
                classpath.outputStream().buffered().use { output -> input.copyTo(output) }
            }
            assertTrue("Bundled Java stub classpath is empty", classpath.length() > 1_000_000L)

            val sources = File(workRoot, "sources").apply { mkdirs() }
            val output = File(workRoot, "classes").apply { mkdirs() }
            val validSource = File(sources, "ValidSample.java").apply {
                writeText(VALID_SOURCE, Charsets.UTF_8)
            }
            val syntaxSource = File(sources, "BrokenSyntax.java").apply {
                writeText(SYNTAX_ERROR_SOURCE, Charsets.UTF_8)
            }
            val unresolvedSource = File(sources, "UnresolvedSymbol.java").apply {
                writeText(UNRESOLVED_SYMBOL_SOURCE, Charsets.UTF_8)
            }

            val pssBeforeKb = Debug.getPss().toLong()
            val heapBeforeBytes = usedHeapBytes()
            val valid = compile(classpath, output, validSource)
            val syntax = compile(classpath, output, syntaxSource)
            val unresolved = compile(classpath, output, unresolvedSource)
            val heapAfterBytes = usedHeapBytes()
            val pssAfterKb = Debug.getPss().toLong()

            assertTrue("Valid ECJ compile failed:\n${valid.transcript}", valid.success)
            val classFile = File(output, "spike/ValidSample.class")
            assertTrue("ECJ did not emit spike/ValidSample.class", classFile.isFile)
            assertTrue("ECJ emitted an empty class file", classFile.length() > 0L)

            assertFalse("Broken syntax unexpectedly compiled", syntax.success)
            assertDiagnostic(
                result = syntax,
                expectedLine = 4,
                expectedSourceFragment = "int value = 41",
                expectedProblemFragment = "insert \";\"",
            )

            assertFalse("Unresolved symbol unexpectedly compiled", unresolved.success)
            assertDiagnostic(
                result = unresolved,
                expectedLine = 4,
                expectedSourceFragment = "return missingValue;",
                expectedProblemFragment = "missingValue cannot be resolved",
            )

            val report = JSONObject().apply {
                put("gate", "G6-0")
                put("ecj", ECJ_VERSION)
                put("sdk", Build.VERSION.SDK_INT)
                put("release", Build.VERSION.RELEASE)
                put("abi", Build.SUPPORTED_ABIS.firstOrNull().orEmpty())
                put("androidJarBytes", classpath.length())
                put("classBytes", classFile.length())
                put("validMs", valid.durationMs)
                put("syntaxDiagnosticMs", syntax.durationMs)
                put("unresolvedDiagnosticMs", unresolved.durationMs)
                put("pssBeforeKb", pssBeforeKb)
                put("pssAfterKb", pssAfterKb)
                put("pssDeltaKb", pssAfterKb - pssBeforeKb)
                put("heapBeforeBytes", heapBeforeBytes)
                put("heapAfterBytes", heapAfterBytes)
                put("heapDeltaBytes", heapAfterBytes - heapBeforeBytes)
                put("syntaxLine", 4)
                put("unresolvedLine", 4)
            }
            val reportLine = "$RESULT_PREFIX$report"
            Log.i(TAG, reportLine)
            println(reportLine)
        } finally {
            workRoot.deleteRecursively()
        }
    }

    private fun compile(classpath: File, output: File, source: File): CompileResult {
        val standardOutput = StringWriter()
        val errorOutput = StringWriter()
        val startedNanos = SystemClock.elapsedRealtimeNanos()
        val success = BatchCompiler.compile(
            arrayOf(
                "-source",
                "8",
                "-target",
                "8",
                "-proc:none",
                "-encoding",
                "UTF-8",
                "-bootclasspath",
                classpath.absolutePath,
                "-d",
                output.absolutePath,
                source.absolutePath,
            ),
            PrintWriter(standardOutput, true),
            PrintWriter(errorOutput, true),
            null,
        )
        val durationMs = (SystemClock.elapsedRealtimeNanos() - startedNanos) / 1_000_000.0
        return CompileResult(
            success = success,
            durationMs = durationMs,
            transcript = buildString {
                append(standardOutput)
                append(errorOutput)
            },
        )
    }

    private fun assertDiagnostic(
        result: CompileResult,
        expectedLine: Int,
        expectedSourceFragment: String,
        expectedProblemFragment: String,
    ) {
        val transcript = result.transcript
        assertTrue(
            "ECJ diagnostic omitted line $expectedLine:\n$transcript",
            transcript.contains("(at line $expectedLine)"),
        )
        assertTrue(
            "ECJ diagnostic omitted source evidence '$expectedSourceFragment':\n$transcript",
            transcript.contains(expectedSourceFragment),
        )
        assertTrue(
            "ECJ diagnostic omitted problem '$expectedProblemFragment':\n$transcript",
            transcript.contains(expectedProblemFragment),
        )
        assertTrue("ECJ diagnostic omitted a caret column marker:\n$transcript", transcript.contains('^'))
    }

    private fun usedHeapBytes(): Long {
        val runtime = Runtime.getRuntime()
        return runtime.totalMemory() - runtime.freeMemory()
    }

    private data class CompileResult(
        val success: Boolean,
        val durationMs: Double,
        val transcript: String,
    )

    private companion object {
        const val TAG = "AutoJs6EcjSpike"
        const val RESULT_PREFIX = "AUTOJS6_ECJ_G6_0_RESULT="
        const val ECJ_VERSION = "3.26.0"
        const val ANDROID_JAR_ASSET = AceJavaClasspathRuntime.CLASSPATH_ASSET
        const val WORK_DIRECTORY_NAME = "autojs6-ecj-g6-0"

        val VALID_SOURCE = """
            package spike;
            public final class ValidSample {
                public static int add(int left, int right) {
                    return left + right;
                }
            }
        """.trimIndent()

        val SYNTAX_ERROR_SOURCE = """
            package spike;
            public final class BrokenSyntax {
                public int answer() {
                    int value = 41
                    return value + 1;
                }
            }
        """.trimIndent()

        val UNRESOLVED_SYMBOL_SOURCE = """
            package spike;
            public final class UnresolvedSymbol {
                public int answer() {
                    return missingValue;
                }
            }
        """.trimIndent()
    }
}
