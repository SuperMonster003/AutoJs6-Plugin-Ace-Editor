-dontwarn kotlinx.parcelize.Parcelize

-keep class org.autojs.plugin.** { *; }
-keep class io.github.supermonster003.autojs6.plugin.ace.editor.AceEditorPluginEntrypoint { *; }
-keep class io.github.supermonster003.autojs6.plugin.ace.editor.AceEditorPluginSession { *; }
-keep class io.github.supermonster003.autojs6.plugin.ace.editor.AceEditorInfoService { *; }

-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
