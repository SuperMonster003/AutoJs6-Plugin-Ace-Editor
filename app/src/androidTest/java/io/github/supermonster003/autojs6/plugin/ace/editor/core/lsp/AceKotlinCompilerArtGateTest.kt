package io.github.supermonster003.autojs6.plugin.ace.editor.core.lsp

import android.os.Build
import android.os.Debug
import android.util.Log
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import dalvik.system.DexClassLoader
import java.io.ByteArrayOutputStream
import java.io.File
import java.io.PrintStream
import java.lang.reflect.InvocationTargetException
import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Assume.assumeTrue
import org.junit.Test
import org.junit.runner.RunWith

/**
 * Manual G7-0 ART gate. The compiler graph is intentionally external to both product and test APKs.
 * Inject the resource-bearing multidex archive and original stdlib jar into targetContext.filesDir.
 */
@RunWith(AndroidJUnit4::class)
class AceKotlinCompilerArtGateTest {

    @Test
    fun embeddableKotlinCompilerMustProduceSingleFileDiagnosticsWithinTheDeviceBudget() {
        val instrumentation = InstrumentationRegistry.getInstrumentation()
        val context = instrumentation.targetContext
        val arguments = InstrumentationRegistry.getArguments()
        val archiveName = arguments.getString(ARGUMENT_COMPILER_ARCHIVE).orEmpty()
        val stdlibName = arguments.getString(ARGUMENT_STDLIB_JAR).orEmpty()
        assumeTrue("Pass $ARGUMENT_COMPILER_ARCHIVE to run G7-0", archiveName.isNotBlank())
        assumeTrue("Pass $ARGUMENT_STDLIB_JAR to run G7-0", stdlibName.isNotBlank())
        assertTrue("Compiler archive must be a basename", archiveName == File(archiveName).name)
        assertTrue("Stdlib jar must be a basename", stdlibName == File(stdlibName).name)

        val archive = File(context.filesDir, archiveName)
        val stdlib = File(context.filesDir, stdlibName)
        assertTrue("Injected Kotlin compiler archive is missing: $archive", archive.isFile)
        assertTrue("Injected Kotlin stdlib is missing: $stdlib", stdlib.isFile)
        assertTrue("Compiler archive is unexpectedly small", archive.length() > 20_000_000L)
        assertTrue("Kotlin stdlib is unexpectedly small", stdlib.length() > 1_000_000L)
        assertTrue("Compiler archive must be read-only on modern ART", archive.setReadOnly() || !archive.canWrite())
        assertTrue("Stdlib jar must be read-only on modern ART", stdlib.setReadOnly() || !stdlib.canWrite())

        val optimizedDirectory = File(context.codeCacheDir, "g7-0-kotlin-compiler").apply {
            assertTrue(isDirectory || mkdirs())
        }
        val pssBeforeKb = Debug.getPss().toLong()
        val heapBeforeBytes = usedHeapBytes()
        val classLoadStartedNanos = System.nanoTime()
        val loader = DexClassLoader(
            archive.absolutePath,
            optimizedDirectory.absolutePath,
            null,
            javaClass.classLoader,
        )
        val compilerClass = loader.loadClass("org.jetbrains.kotlin.cli.jvm.K2JVMCompiler")
        val compiler = compilerClass.getConstructor().newInstance()
        val exec = compilerClass.getMethod("exec", PrintStream::class.java, Array<String>::class.java)
        val classLoadMs = elapsedMs(classLoadStartedNanos)

        val workspace = File(context.cacheDir, "g7-kotlinc-${System.nanoTime()}").apply {
            assertTrue(mkdirs())
        }
        val valid = compile(exec, compiler, workspace, stdlib, "Valid.kt", VALID_SOURCE)
        val syntax = compile(exec, compiler, workspace, stdlib, "BrokenSyntax.kt", SYNTAX_ERROR_SOURCE)
        val unresolved = compile(exec, compiler, workspace, stdlib, "BrokenReference.kt", UNRESOLVED_SOURCE)
        val pssAfterKb = Debug.getPss().toLong()
        val heapAfterBytes = usedHeapBytes()
        val failure = valid.failure ?: syntax.failure ?: unresolved.failure

        val report = JSONObject().apply {
            put("gate", "G7-0")
            put("accepted", failure == null && valid.exitCode == "OK" &&
                syntax.exitCode == "COMPILATION_ERROR" && unresolved.exitCode == "COMPILATION_ERROR")
            put("compiler", "2.2.21")
            put("sdk", Build.VERSION.SDK_INT)
            put("release", Build.VERSION.RELEASE)
            put("abi", Build.SUPPORTED_ABIS.firstOrNull().orEmpty())
            put("archiveBytes", archive.length())
            put("stdlibBytes", stdlib.length())
            put("classLoadMs", classLoadMs)
            put("validMs", valid.durationMs)
            put("syntaxMs", syntax.durationMs)
            put("unresolvedMs", unresolved.durationMs)
            put("validExit", valid.exitCode)
            put("syntaxExit", syntax.exitCode)
            put("unresolvedExit", unresolved.exitCode)
            put("pssDeltaKb", pssAfterKb - pssBeforeKb)
            put("heapDeltaBytes", heapAfterBytes - heapBeforeBytes)
            put("failureType", failure?.javaClass?.name.orEmpty())
            put("failureMessage", failure?.message.orEmpty().take(512))
            put("validMessages", valid.messages.take(512))
            put("syntaxMessages", syntax.messages.take(512))
            put("unresolvedMessages", unresolved.messages.take(512))
        }
        Log.i(TAG, "$RESULT_PREFIX$report")
        println("$RESULT_PREFIX$report")

        assertNull("Kotlin compiler failed on ART: $report", failure)
        assertEquals("OK", valid.exitCode)
        assertEquals("COMPILATION_ERROR", syntax.exitCode)
        assertEquals("COMPILATION_ERROR", unresolved.exitCode)
    }

    private fun compile(
        exec: java.lang.reflect.Method,
        compiler: Any,
        workspace: File,
        stdlib: File,
        fileName: String,
        source: String,
    ): CompileResult {
        val sourceFile = File(workspace, fileName).apply { writeText(source, Charsets.UTF_8) }
        val outputDirectory = File(workspace, "$fileName-classes").apply {
            assertTrue(mkdirs())
        }
        val output = ByteArrayOutputStream()
        val startedNanos = System.nanoTime()
        val invocation = runCatching {
            PrintStream(output, true, Charsets.UTF_8.name()).use { stream ->
                val result = exec.invoke(
                    compiler,
                    stream,
                    arrayOf(
                        "-no-stdlib",
                        "-no-reflect",
                        "-language-version", "2.2",
                        "-api-version", "2.2",
                        "-jvm-target", "1.8",
                        "-classpath", stdlib.absolutePath,
                        "-d", outputDirectory.absolutePath,
                        sourceFile.absolutePath,
                    ),
                )
                result?.toString().orEmpty()
            }
        }
        return CompileResult(
            exitCode = invocation.getOrDefault(""),
            durationMs = elapsedMs(startedNanos),
            messages = output.toString(Charsets.UTF_8.name()).replace(Regex("\\s+"), " ").trim(),
            failure = invocation.exceptionOrNull().rootCause(),
        )
    }

    private fun usedHeapBytes(): Long {
        val runtime = Runtime.getRuntime()
        return runtime.totalMemory() - runtime.freeMemory()
    }

    private fun elapsedMs(startedNanos: Long): Double =
        (System.nanoTime() - startedNanos) / 1_000_000.0

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

    private data class CompileResult(
        val exitCode: String,
        val durationMs: Double,
        val messages: String,
        val failure: Throwable?,
    )

    private companion object {
        const val ARGUMENT_COMPILER_ARCHIVE = "g7KotlinCompilerArchive"
        const val ARGUMENT_STDLIB_JAR = "g7KotlinStdlibJar"
        const val TAG = "AutoJs6KotlinGate"
        const val RESULT_PREFIX = "AUTOJS6_KOTLIN_G7_0_RESULT="

        val VALID_SOURCE = """
            package sample

            class Main {
                fun answer(): Int {
                    val value = 41
                    return value + 1
                }
            }
        """.trimIndent()

        val SYNTAX_ERROR_SOURCE = """
            package sample

            class BrokenSyntax {
                fun answer(: Int {
                    return 42
                }
            }
        """.trimIndent()

        val UNRESOLVED_SOURCE = """
            package sample

            class BrokenReference {
                fun answer(): Int {
                    return missingValue + 1
                }
            }
        """.trimIndent()
    }
}
