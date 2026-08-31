package org.autojs.probe;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.PrintStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Locale;
import java.util.regex.Pattern;
import org.jetbrains.kotlin.cli.common.ExitCode;
import org.jetbrains.kotlin.cli.jvm.K2JVMCompiler;

/** Desktop control group for the G7-0 embeddable Kotlin compiler gate. */
public final class G7KotlinCompilerProbe {

    private static final String VALID_SOURCE = """
        package sample

        class Main {
            fun answer(): Int {
                val value = 41
                return value + 1
            }
        }
        """;

    private static final String SYNTAX_ERROR_SOURCE = """
        package sample

        class BrokenSyntax {
            fun answer(: Int {
                return 42
            }
        }
        """;

    private static final String UNRESOLVED_SOURCE = """
        package sample

        class BrokenReference {
            fun answer(): Int {
                return missingValue + 1
            }
        }
        """;

    private G7KotlinCompilerProbe() {
    }

    public static void main(String[] args) throws Exception {
        Locale.setDefault(Locale.ENGLISH);
        Path workspace = Files.createTempDirectory("autojs6-g7-kotlinc-");
        Result valid = compile(workspace, "Valid.kt", VALID_SOURCE);
        Result syntax = compile(workspace, "BrokenSyntax.kt", SYNTAX_ERROR_SOURCE);
        Result unresolved = compile(workspace, "BrokenReference.kt", UNRESOLVED_SOURCE);

        if (valid.exitCode != ExitCode.OK) {
            throw new IllegalStateException("Valid Kotlin source failed: " + valid.messages);
        }
        if (syntax.exitCode != ExitCode.COMPILATION_ERROR) {
            throw new IllegalStateException("Syntax error was not rejected: " + syntax.messages);
        }
        if (unresolved.exitCode != ExitCode.COMPILATION_ERROR) {
            throw new IllegalStateException("Unresolved symbol was not rejected: " + unresolved.messages);
        }

        System.out.println("AUTOJS6_KOTLIN_G7_DESKTOP={"
            + "\"gate\":\"G7-0\","
            + "\"compiler\":\"2.2.21\","
            + "\"validMs\":" + valid.durationMs + ","
            + "\"syntaxMs\":" + syntax.durationMs + ","
            + "\"unresolvedMs\":" + unresolved.durationMs + ","
            + "\"validHeapDeltaBytes\":" + valid.heapDeltaBytes + ","
            + "\"syntaxHeapDeltaBytes\":" + syntax.heapDeltaBytes + ","
            + "\"unresolvedHeapDeltaBytes\":" + unresolved.heapDeltaBytes + ","
            + "\"syntaxMessage\":\"" + json(syntax.messages) + "\","
            + "\"unresolvedMessage\":\"" + json(unresolved.messages) + "\""
            + "}");
    }

    private static Result compile(Path workspace, String fileName, String source) throws Exception {
        Path sourceFile = workspace.resolve(fileName);
        Path outputDirectory = workspace.resolve(fileName + "-classes");
        Files.createDirectories(outputDirectory);
        Files.writeString(sourceFile, source, StandardCharsets.UTF_8);

        ByteArrayOutputStream messages = new ByteArrayOutputStream();
        Runtime runtime = Runtime.getRuntime();
        long heapBefore = usedHeap(runtime);
        long startedNanos = System.nanoTime();
        ExitCode exitCode;
        try (PrintStream stream = new PrintStream(messages, true, StandardCharsets.UTF_8)) {
            exitCode = new K2JVMCompiler().exec(
                stream,
                "-no-stdlib",
                "-no-reflect",
                "-language-version", "2.2",
                "-api-version", "2.2",
                "-jvm-target", "1.8",
                "-classpath", kotlinStdlibPath(),
                "-d", outputDirectory.toString(),
                sourceFile.toString()
            );
        }
        double durationMs = (System.nanoTime() - startedNanos) / 1_000_000.0;
        long heapDelta = Math.max(0L, usedHeap(runtime) - heapBefore);
        return new Result(
            exitCode,
            durationMs,
            heapDelta,
            messages.toString(StandardCharsets.UTF_8).replaceAll("\\s+", " ").trim()
        );
    }

    private static long usedHeap(Runtime runtime) {
        return Math.max(0L, runtime.totalMemory() - runtime.freeMemory());
    }

    private static String kotlinStdlibPath() {
        String classpath = System.getProperty("java.class.path", "");
        for (String entry : classpath.split(Pattern.quote(File.pathSeparator))) {
            String name = Path.of(entry).getFileName().toString();
            if (name.startsWith("kotlin-stdlib-") && name.endsWith(".jar")) {
                return entry;
            }
        }
        throw new IllegalStateException("Kotlin stdlib is missing from the probe classpath");
    }

    private static String json(String value) {
        String limited = value == null ? "" : value.substring(0, Math.min(value.length(), 320));
        return limited
            .replace("\\", "\\\\")
            .replace("\"", "\\\"")
            .replace("\r", "\\r")
            .replace("\n", "\\n");
    }

    private record Result(
        ExitCode exitCode,
        double durationMs,
        long heapDeltaBytes,
        String messages
    ) {
    }
}
