package io.github.supermonster003.autojs6.plugin.ace.editor.core

import androidx.test.core.app.ActivityScenario
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import io.github.supermonster003.autojs6.plugin.ace.editor.AceEditorPluginEntrypoint
import org.autojs.plugin.editor.api.EditorPluginCallback
import org.autojs.plugin.editor.api.EditorPluginSessionConfig
import org.autojs.plugin.editor.api.EditorPluginState
import org.json.JSONObject
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
    fun sessionDiagnosticsExposeExecutionAlignedTypeScriptProfiles() {
        val instrumentation = InstrumentationRegistry.getInstrumentation()
        val context = instrumentation.targetContext
        val nodeProject = File(context.cacheDir, "ace-typescript-profile-smoke").apply { mkdirs() }
        File(nodeProject, "project.json").writeText("""{"type":"node"}""")
        val nodeProjectEntry = File(nodeProject, "main.ts").apply { writeText("export const value = 1") }
        val cases = listOf(
            Triple("/storage/emulated/0/Scripts/main.tsx", "rhino", 2),
            Triple("/storage/emulated/0/Scripts/main.mts", "node", 2),
            Triple(nodeProjectEntry.absolutePath, "node", 2),
        )

        instrumentation.runOnMainSync {
            cases.forEach { (documentPath, expectedProfile, expectedRevision) ->
                val session = AceEditorPluginEntrypoint().createSession(
                    hostContext = context,
                    pluginContext = context,
                    config = EditorPluginSessionConfig(
                        hostPackageName = context.packageName,
                        hostVersionName = "instrumentation",
                        hostVersionCode = 5234L,
                        storageDirectoryPath =
                            File(context.cacheDir, "ace-editor-profile-smoke-fonts").absolutePath,
                        documentPath = documentPath,
                    ),
                    callback = object : EditorPluginCallback {},
                )
                try {
                    val diagnostics = session.createDiagnosticsSnapshot(null, "auto").values
                    assertEquals("6.0.3", diagnostics.getString("lspTypeScriptVersion"))
                    assertEquals(expectedProfile, diagnostics.getString("lspTypeScriptProfile"))
                    assertEquals(expectedRevision, diagnostics.getInt("lspTypeScriptProfileRevision"))
                } finally {
                    session.destroy()
                }
            }
        }
    }

    @Test
    fun projectDependencyTypesAreFrozenAndPublishedToTheAndroidBridge() {
        val instrumentation = InstrumentationRegistry.getInstrumentation()
        val context = instrumentation.targetContext
        val project = File(context.cacheDir, "ace-dependency-types-smoke").apply {
            deleteRecursively()
            mkdirs()
        }
        val document = File(project, "main.ts").apply {
            writeText("import dayjs from 'dayjs'; dayjs().format('YYYY')")
        }
        File(project, "project.json").writeText("""{"type":"node"}""")
        File(project, "package.json").writeText("""{"name":"ace-smoke","type":"module"}""")
        File(project, "node_modules/dayjs").apply { mkdirs() }
        File(project, "node_modules/dayjs/package.json").writeText(
            """{"name":"dayjs","types":"index.d.ts"}""",
        )
        File(project, "node_modules/dayjs/index.d.ts").writeText(
            "export interface Dayjs { format(template?: string): string }\n" +
                "declare function dayjs(): Dayjs\nexport default dayjs\n",
        )
        File(project, "node_modules/@types/ambient").apply { mkdirs() }
        File(project, "node_modules/@types/ambient/index.d.ts").writeText(
            "declare const aceAmbientValue: string\n",
        )

        val session = AtomicReference<org.autojs.plugin.editor.api.EditorPluginSession>()
        instrumentation.runOnMainSync {
            session.set(
                AceEditorPluginEntrypoint().createSession(
                    hostContext = context,
                    pluginContext = context,
                    config = EditorPluginSessionConfig(
                        hostPackageName = context.packageName,
                        hostVersionName = "instrumentation",
                        hostVersionCode = 5234L,
                        storageDirectoryPath =
                            File(context.cacheDir, "ace-editor-dependency-types-smoke-fonts").absolutePath,
                        documentPath = document.absolutePath,
                    ),
                    callback = object : EditorPluginCallback {},
                ),
            )
        }

        try {
            var options = JSONObject()
            val deadlineNanos = System.nanoTime() + TimeUnit.SECONDS.toNanos(10)
            while (System.nanoTime() < deadlineNanos) {
                instrumentation.runOnMainSync {
                    val editor = session.get().view as AceCodeEditor
                    options = JSONObject(editor.bridgeLspOptions())
                }
                if (options.optInt("dependencyFileCount") >= 3) break
                Thread.sleep(50)
            }

            assertEquals(4, options.getInt("dependencyResolverPolicyRevision"))
            assertEquals(
                "d8207539237d2a08a6b97b530c5e6215f4b73311fdd6954ce9f8004717ebd635",
                options.getString("dependencyResolverPolicyFingerprint"),
            )
            assertTrue(options.getString("dependencyLayerFingerprint").matches(Regex("[0-9a-f]{64}")))
            assertTrue(options.getString("dependencyInventoryFingerprint").matches(Regex("[0-9a-f]{64}")))
            assertEquals(listOf("ambient"), options.getJSONArray("dependencyTypeNames").let { names ->
                List(names.length()) { index -> names.getString(index) }
            })
            val dayjsUri = options.getJSONArray("projectTypeFileUris").let { uris ->
                List(uris.length()) { index -> uris.getString(index) }
            }.single { uri -> uri.endsWith("/node_modules/dayjs/index.d.ts") }
            val declaration = AtomicReference<String?>()
            instrumentation.runOnMainSync {
                declaration.set((session.get().view as AceCodeEditor).bridgeProjectTypeText(dayjsUri))
            }
            assertTrue(declaration.get().orEmpty().contains("interface Dayjs"))
        } finally {
            instrumentation.runOnMainSync {
                session.getAndSet(null)?.destroy()
            }
            project.deleteRecursively()
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
