-dontwarn kotlinx.parcelize.Parcelize

-keep class org.autojs.plugin.** { *; }
-keep class io.github.supermonster003.autojs6.plugin.ace.editor.AceEditorPluginEntrypoint { *; }
-keep class io.github.supermonster003.autojs6.plugin.ace.editor.AceEditorPluginSession { *; }
-keep class io.github.supermonster003.autojs6.plugin.ace.editor.AceEditorInfoService { *; }

# ECJ probes SourceVersion enum constants by name. Keep that compatibility surface stable in
# release builds; compiler implementation classes reached through typed references may still be
# optimized and obfuscated by R8.
-keep enum javax.lang.model.SourceVersion { *; }

# Android deliberately has no JSR 199/269 tool or annotation-processing model. M6 invokes ECJ's
# compiler internals with annotation processing disabled, so these optional ECJ surfaces are
# unreachable and may be removed by R8.
-dontwarn javax.lang.model.element.**
-dontwarn javax.lang.model.util.**
-dontwarn javax.tools.**
-dontwarn org.eclipse.jdt.internal.compiler.tool.EclipseCompiler

-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
