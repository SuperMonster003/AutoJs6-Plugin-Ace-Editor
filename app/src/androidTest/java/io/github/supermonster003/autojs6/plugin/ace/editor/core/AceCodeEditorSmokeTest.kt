package io.github.supermonster003.autojs6.plugin.ace.editor.core

import androidx.test.core.app.ActivityScenario
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import io.github.supermonster003.autojs6.plugin.ace.editor.AceEditorPluginEntrypoint
import org.autojs.plugin.editor.api.EditorPluginCallback
import org.autojs.plugin.editor.api.EditorPluginSessionConfig
import org.autojs.plugin.editor.api.EditorPluginState
import org.junit.Assert.assertEquals
import org.junit.Assert.assertSame
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import java.io.File
import java.util.concurrent.CopyOnWriteArrayList
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.atomic.AtomicReference

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

    @Test
    fun initialTextPublishesOnlyTheFinalCursorPosition() {
        val instrumentation = InstrumentationRegistry.getInstrumentation()
        val context = instrumentation.targetContext
        val ready = CountDownLatch(1)
        val finalCursor = CountDownLatch(1)
        val capturing = AtomicBoolean(false)
        val positions = CopyOnWriteArrayList<Pair<Int, Int>>()
        val session = AtomicReference<org.autojs.plugin.editor.api.EditorPluginSession>()
        val scenario = ActivityScenario.launch(AceEditorTestActivity::class.java)

        scenario.onActivity { activity ->
            session.set(
                AceEditorPluginEntrypoint().createSession(
                    hostContext = activity,
                    pluginContext = context,
                    config = EditorPluginSessionConfig(
                        hostPackageName = context.packageName,
                        hostVersionName = "instrumentation",
                        hostVersionCode = 5234L,
                        storageDirectoryPath =
                            File(context.cacheDir, "ace-editor-cursor-smoke-fonts").absolutePath,
                    ),
                    callback = object : EditorPluginCallback {
                        override fun onReady(state: EditorPluginState) {
                            ready.countDown()
                        }

                        override fun onCursorChanged(
                            lineText: String,
                            line: Int,
                            column: Int,
                            state: EditorPluginState,
                        ) {
                            if (capturing.get()) {
                                positions += line to column
                                if (line == 0 && column == 0) {
                                    finalCursor.countDown()
                                }
                            }
                        }
                    },
                ),
            )
            activity.setContentView(session.get().view)
        }

        try {
            assertTrue("ACE session should become ready", ready.await(10, TimeUnit.SECONDS))
            val text = buildString {
                repeat(512) { line ->
                    append("const cursorLine")
                    append(line)
                    append(" = ")
                    append(line)
                    append(";\n")
                }
            }
            scenario.onActivity {
                positions.clear()
                capturing.set(true)
                session.get().setInitialText(text)
            }
            assertTrue(
                "ACE should publish the final initial cursor",
                finalCursor.await(10, TimeUnit.SECONDS),
            )
            instrumentation.waitForIdleSync()
            Thread.sleep(250)
            capturing.set(false)

            assertTrue("ACE should publish at least one cursor event", positions.isNotEmpty())
            assertTrue(
                "ACE must not expose the temporary end-of-document cursor: $positions",
                positions.all { it == (0 to 0) },
            )
        } finally {
            scenario.onActivity {
                session.getAndSet(null)?.destroy()
            }
            scenario.close()
        }
    }
}
