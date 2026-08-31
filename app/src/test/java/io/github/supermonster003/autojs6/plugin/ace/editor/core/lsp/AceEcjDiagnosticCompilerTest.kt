package io.github.supermonster003.autojs6.plugin.ace.editor.core.lsp

import java.io.File
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class AceEcjDiagnosticCompilerTest {

    private val classpath = listOf(
        File("src/main/assets/java/ecj/android-36-stubs.jar"),
        File("app/src/main/assets/java/ecj/android-36-stubs.jar"),
    ).firstOrNull(File::isFile) ?: error("Bundled ECJ classpath is unavailable to unit tests")
    private val compiler = AceEcjDiagnosticCompiler { classpath }

    @Test
    fun validJavaAndCommonAndroidTypesResolveAgainstBundledStubs() {
        val result = compiler.diagnose(
            "file:///autojs6/editor/Main.java",
            """
                import android.app.Activity;
                import java.util.ArrayList;
                final class Main extends Activity {
                    private final ArrayList<String> values = new ArrayList<>();
                }
            """.trimIndent(),
        )

        assertTrue(
            result.diagnostics.joinToString("\n") { it.message },
            result.diagnostics.none { it.severity == "error" },
        )
        assertEquals(AceJavaClasspathRuntime.EXPECTED_CLASSPATH_BYTES, result.classpathBytes)
    }

    @Test
    fun missingSemicolonMapsToTheExactZeroBasedEditorLine() {
        val result = compiler.diagnose(
            "file:///autojs6/editor/BrokenSyntax.java",
            """
                package sample;
                final class BrokenSyntax {
                    int answer() {
                        int value = 41
                        return value + 1;
                    }
                }
            """.trimIndent(),
        )

        val diagnostic = result.diagnostics.first { it.message.contains("insert \";\"") }
        assertEquals(3, diagnostic.row)
        assertTrue(diagnostic.column >= 8)
        assertEquals("error", diagnostic.severity)
        assertTrue(diagnostic.endRow >= diagnostic.row)
    }

    @Test
    fun unresolvedSymbolMapsToItsSourceToken() {
        val result = compiler.diagnose(
            "file:///autojs6/editor/UnresolvedSymbol.java",
            """
                package sample;
                final class UnresolvedSymbol {
                    int answer() {
                        return missingValue;
                    }
                }
            """.trimIndent(),
        )

        val diagnostic = result.diagnostics.first { it.message.contains("missingValue") }
        assertEquals(3, diagnostic.row)
        assertTrue(diagnostic.column >= 15)
        assertEquals("error", diagnostic.severity)
        assertTrue(diagnostic.endColumn > diagnostic.column)
    }
}
