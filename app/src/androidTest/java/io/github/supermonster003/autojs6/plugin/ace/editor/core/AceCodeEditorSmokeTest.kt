package io.github.supermonster003.autojs6.plugin.ace.editor.core

import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import io.github.supermonster003.autojs6.plugin.ace.editor.AceEditorPluginEntrypoint
import org.autojs.plugin.editor.api.EditorPluginCallback
import org.autojs.plugin.editor.api.EditorPluginSessionConfig
import org.junit.Assert.assertEquals
import org.junit.Assert.assertSame
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import java.io.File

@RunWith(AndroidJUnit4::class)
class AceCodeEditorSmokeTest {

    @Test
    fun requiredAceAssetsArePackaged() {
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        assertTrue(AceCodeEditor.hasRequiredAssets(context))
    }

    @Test
    fun entrypointCreatesAndDestroysSessionOnMainThread() {
        val instrumentation = InstrumentationRegistry.getInstrumentation()
        val context = instrumentation.targetContext
        instrumentation.runOnMainSync {
            val session = AceEditorPluginEntrypoint().createSession(
                hostContext = context,
                pluginContext = context,
                config = EditorPluginSessionConfig(
                    hostPackageName = context.packageName,
                    hostVersionName = "instrumentation",
                    hostVersionCode = 5234L,
                    storageDirectoryPath = File(context.cacheDir, "ace-editor-smoke-fonts").absolutePath,
                ),
                callback = object : EditorPluginCallback {},
            )
            assertSame(session.view, session.currentState.let { session.view })
            assertSame((session.view as AceCodeEditor).webView, session.inputView)
            assertEquals("", session.textSnapshot)
            session.destroy()
            session.destroy()
        }
    }
}
