package io.github.supermonster003.autojs6.plugin.ace.editor.core.lsp

import org.eclipse.jdt.core.compiler.CategorizedProblem
import org.eclipse.jdt.internal.compiler.Compiler
import org.eclipse.jdt.internal.compiler.DefaultErrorHandlingPolicies
import org.eclipse.jdt.internal.compiler.ICompilerRequestor
import org.eclipse.jdt.internal.compiler.batch.CompilationUnit
import org.eclipse.jdt.internal.compiler.batch.FileSystem
import org.eclipse.jdt.internal.compiler.impl.CompilerOptions
import org.eclipse.jdt.internal.compiler.problem.DefaultProblemFactory
import java.io.File
import java.net.URLDecoder
import java.util.Locale

internal fun interface AceJavaDiagnosticEngine {
    fun diagnose(documentUri: String, source: String): AceJavaDiagnosticResult
}

internal class AceEcjDiagnosticCompiler(
    private val classpathFileProvider: () -> File,
) : AceJavaDiagnosticEngine {

    override fun diagnose(documentUri: String, source: String): AceJavaDiagnosticResult {
        val startedNanos = System.nanoTime()
        val classpath = classpathFileProvider()
        val fileName = sourceFileName(documentUri)
        val nameEnvironment = FileSystem(
            arrayOf(classpath.absolutePath),
            arrayOf(fileName),
            Charsets.UTF_8.name(),
        )
        val problems = mutableListOf<CategorizedProblem>()
        try {
            val options = CompilerOptions(
                mapOf(
                    CompilerOptions.OPTION_Compliance to CompilerOptions.VERSION_16,
                    CompilerOptions.OPTION_Source to CompilerOptions.VERSION_16,
                    CompilerOptions.OPTION_TargetPlatform to CompilerOptions.VERSION_16,
                    CompilerOptions.OPTION_Encoding to Charsets.UTF_8.name(),
                    CompilerOptions.OPTION_MaxProblemPerUnit to MAX_PROBLEMS.toString(),
                    CompilerOptions.OPTION_GenerateClassFiles to CompilerOptions.DISABLED,
                    CompilerOptions.OPTION_Process_Annotations to CompilerOptions.DISABLED,
                    CompilerOptions.OPTION_ReportUnusedImport to CompilerOptions.WARNING,
                ),
            )
            val requestor = ICompilerRequestor { result ->
                result.getAllProblems()?.let(problems::addAll)
            }
            val compiler = Compiler(
                nameEnvironment,
                DefaultErrorHandlingPolicies.proceedWithAllProblems(),
                options,
                requestor,
                DefaultProblemFactory(Locale.ENGLISH),
            ).apply {
                useSingleThread = true
            }
            compiler.compile(
                arrayOf(
                    CompilationUnit(
                        source.toCharArray(),
                        fileName,
                        Charsets.UTF_8.name(),
                    ),
                ),
            )
        } finally {
            nameEnvironment.cleanup()
        }

        val lineStarts = lineStarts(source)
        val diagnostics = problems
            .asSequence()
            .filterNot { it.message.isNullOrBlank() }
            .sortedWith(
                compareBy<CategorizedProblem> { it.sourceStart.coerceAtLeast(0) }
                    .thenByDescending { it.isError }
                    .thenBy { it.id },
            )
            .take(MAX_PROBLEMS)
            .map { problem -> problem.toDiagnostic(source, lineStarts) }
            .toList()
        return AceJavaDiagnosticResult(
            diagnostics = diagnostics,
            durationMs = (System.nanoTime() - startedNanos) / 1_000_000.0,
            classpathBytes = classpath.length(),
        )
    }

    private fun CategorizedProblem.toDiagnostic(
        source: String,
        lineStarts: IntArray,
    ): AceJavaDiagnostic {
        val startOffset = sourceStart.coerceIn(0, source.length)
        val inclusiveEnd = sourceEnd.coerceAtLeast(startOffset - 1).coerceAtMost(source.length - 1)
        val exclusiveEnd = (inclusiveEnd + 1).coerceIn(startOffset, source.length)
        val start = positionAt(lineStarts, startOffset)
        val end = positionAt(lineStarts, exclusiveEnd)
        return AceJavaDiagnostic(
            row = start.first,
            column = start.second,
            endRow = end.first,
            endColumn = end.second,
            message = message,
            severity = when {
                isError -> "error"
                isWarning -> "warning"
                else -> "info"
            },
            code = id,
            category = categoryID,
        )
    }

    private fun sourceFileName(documentUri: String): String {
        val rawName = documentUri
            .substringBefore('?')
            .substringBefore('#')
            .replace('\\', '/')
            .substringAfterLast('/')
            .takeIf { it.isNotBlank() }
            ?: DEFAULT_FILE_NAME
        val decoded = runCatching {
            URLDecoder.decode(rawName, Charsets.UTF_8.name())
        }.getOrDefault(rawName)
        return decoded
            .replace(Regex("[^A-Za-z0-9_.$-]"), "_")
            .takeIf { it.endsWith(".java", ignoreCase = true) }
            ?: DEFAULT_FILE_NAME
    }

    private fun lineStarts(source: String): IntArray {
        val starts = ArrayList<Int>()
        starts += 0
        var index = 0
        while (index < source.length) {
            when (source[index]) {
                '\r' -> {
                    if (index + 1 < source.length && source[index + 1] == '\n') index++
                    starts += index + 1
                }
                '\n' -> starts += index + 1
            }
            index++
        }
        return starts.toIntArray()
    }

    private fun positionAt(lineStarts: IntArray, offset: Int): Pair<Int, Int> {
        var low = 0
        var high = lineStarts.lastIndex
        while (low <= high) {
            val middle = (low + high).ushr(1)
            if (lineStarts[middle] <= offset) {
                low = middle + 1
            } else {
                high = middle - 1
            }
        }
        val row = high.coerceAtLeast(0)
        return row to (offset - lineStarts[row]).coerceAtLeast(0)
    }

    private companion object {
        const val MAX_PROBLEMS = 200
        const val DEFAULT_FILE_NAME = "Current.java"
    }
}

internal data class AceJavaDiagnosticResult(
    val diagnostics: List<AceJavaDiagnostic>,
    val durationMs: Double,
    val classpathBytes: Long,
)

internal data class AceJavaDiagnostic(
    val row: Int,
    val column: Int,
    val endRow: Int,
    val endColumn: Int,
    val message: String,
    val severity: String,
    val code: Int,
    val category: Int,
)
