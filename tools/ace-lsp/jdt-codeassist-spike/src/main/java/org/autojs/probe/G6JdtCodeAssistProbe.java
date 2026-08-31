package org.autojs.probe;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.eclipse.jdt.core.CompletionProposal;
import org.eclipse.jdt.core.CompletionRequestor;
import org.eclipse.jdt.core.ICompilationUnit;
import org.eclipse.jdt.core.IJavaProject;
import org.eclipse.jdt.core.JavaCore;
import org.eclipse.core.resources.IProject;
import org.eclipse.core.resources.IWorkspace;
import org.eclipse.core.resources.ResourcesPlugin;
import org.eclipse.jdt.internal.codeassist.CompletionEngine;
import org.eclipse.jdt.internal.compiler.batch.CompilationUnit;
import org.eclipse.jdt.internal.compiler.impl.CompilerOptions;
import org.eclipse.jdt.internal.core.JavaProject;
import org.eclipse.jdt.internal.core.SearchableEnvironment;

/** G6-3 host-side control for the same workspace-free construction attempted on ART. */
public final class G6JdtCodeAssistProbe {

    private G6JdtCodeAssistProbe() {
    }

    public static void main(String[] args) {
        long started = System.nanoTime();
        String stage = "class-load";
        try {
            Class.forName("org.eclipse.jdt.internal.codeassist.CompletionEngine");
            stage = "eclipse-workspace";
            IWorkspace workspace = ResourcesPlugin.getWorkspace();
            IProject eclipseProject = workspace.getRoot().getProject("autojs6-g6-3");
            if (!eclipseProject.exists()) eclipseProject.create(null);
            if (!eclipseProject.isOpen()) eclipseProject.open(null);
            stage = "java-project";
            IJavaProject publicProject = JavaCore.create(eclipseProject);
            JavaProject project = (JavaProject) publicProject;
            stage = "searchable-environment";
            SearchableEnvironment environment = new SearchableEnvironment(
                project,
                new ICompilationUnit[0]
            );
            stage = "completion-engine";
            List<String> proposals = new ArrayList<>();
            CompletionRequestor requestor = new CompletionRequestor() {
                @Override
                public void accept(CompletionProposal proposal) {
                    char[] name = proposal.getName();
                    if (name != null) proposals.add(new String(name));
                }
            };
            Map<String, String> options = new HashMap<>();
            options.put(CompilerOptions.OPTION_Compliance, CompilerOptions.VERSION_16);
            options.put(CompilerOptions.OPTION_Source, CompilerOptions.VERSION_16);
            options.put(CompilerOptions.OPTION_TargetPlatform, CompilerOptions.VERSION_16);
            CompletionEngine engine = new CompletionEngine(
                environment,
                requestor,
                options,
                project,
                null,
                null
            );
            stage = "member-completion";
            String source = String.join("\n",
                "import java.util.ArrayList;",
                "final class Main {",
                "  void run() {",
                "    ArrayList<String> values = new ArrayList<>();",
                "    values.",
                "  }",
                "}"
            );
            CompilationUnit unit = new CompilationUnit(
                source.toCharArray(),
                "Main.java",
                "UTF-8"
            );
            engine.complete(unit, source.indexOf("values.") + "values.".length(), 0, null);
            environment.cleanup();
            long durationMs = (System.nanoTime() - started) / 1_000_000L;
            boolean hasAdd = proposals.contains("add");
            System.out.println(
                "G6_3_RESULT={\"ok\":" + hasAdd +
                    ",\"stage\":\"complete\",\"durationMs\":" + durationMs +
                    ",\"proposalCount\":" + proposals.size() +
                    ",\"hasArrayListAdd\":" + hasAdd + "}"
            );
            if (!hasAdd) System.exit(2);
        } catch (Throwable error) {
            long durationMs = (System.nanoTime() - started) / 1_000_000L;
            Throwable root = error;
            while (root.getCause() != null && root.getCause() != root) root = root.getCause();
            System.out.println(
                "G6_3_RESULT={\"ok\":false,\"stage\":\"" + escape(stage) +
                    "\",\"durationMs\":" + durationMs +
                    ",\"errorType\":\"" + escape(root.getClass().getName()) +
                    "\",\"error\":\"" + escape(String.valueOf(root.getMessage())) + "\"}"
            );
            error.printStackTrace(System.out);
            System.exit(1);
        }
    }

    private static String escape(String value) {
        return value == null ? "" : value
            .replace("\\", "\\\\")
            .replace("\"", "\\\"")
            .replace("\r", "\\r")
            .replace("\n", "\\n");
    }
}
