package io.github.supermonster003.autojs6.plugin.ace.editor.core

import androidx.test.core.app.ActivityScenario
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import io.github.supermonster003.autojs6.plugin.ace.editor.AceEditorPluginEntrypoint
import org.autojs.plugin.editor.api.EditorPluginCallback
import org.autojs.plugin.editor.api.EditorPluginProjectSnapshot
import org.autojs.plugin.editor.api.EditorPluginProjectSnapshotContract
import org.autojs.plugin.editor.api.EditorPluginProjectSnapshotProvider
import org.autojs.plugin.editor.api.EditorPluginProjectSource
import org.autojs.plugin.editor.api.EditorPluginSessionConfig
import org.autojs.plugin.editor.api.EditorPluginState
import org.json.JSONArray
import org.json.JSONObject
import org.json.JSONTokener
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertSame
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import java.io.File
import java.nio.charset.StandardCharsets
import java.security.MessageDigest
import java.util.Locale
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
    fun projectSourcesAndDependencyTypesAreFrozenAndPublishedToTheAndroidBridge() {
        val instrumentation = InstrumentationRegistry.getInstrumentation()
        val context = instrumentation.targetContext
        val project = File(context.cacheDir, "ace-dependency-types-smoke").apply {
            deleteRecursively()
            mkdirs()
        }
        val document = File(project, "main.ts").apply {
            writeText(
                "import dayjs from 'dayjs'; import { shared } from './shared'; " +
                    "dayjs().format('YYYY'); void shared",
            )
        }
        val shared = File(project, "shared.ts").apply {
            writeText("export const shared = 42 as const")
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
        val projectSnapshot = projectSnapshot(project, document, listOf(document, shared), "node")

        val session = AtomicReference<org.autojs.plugin.editor.api.EditorPluginSession>()
        instrumentation.runOnMainSync {
            session.set(
                AceEditorPluginEntrypoint().createSession(
                    hostContext = context,
                    pluginContext = context,
                    config = EditorPluginSessionConfig(
                        hostPackageName = context.packageName,
                        hostVersionName = "instrumentation",
                        hostVersionCode = 5276L,
                        storageDirectoryPath =
                            File(context.cacheDir, "ace-editor-dependency-types-smoke-fonts").absolutePath,
                        documentPath = document.absolutePath,
                        projectSnapshotProvider = EditorPluginProjectSnapshotProvider {
                            projectSnapshot
                        },
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
                if (
                    options.optInt("dependencyFileCount") >= 3 &&
                    options.optBoolean("projectSnapshotReady")
                ) {
                    break
                }
                Thread.sleep(50)
            }

            assertEquals(4, options.getInt("dependencyResolverPolicyRevision"))
            assertTrue(options.getBoolean("projectSnapshotReady"))
            assertEquals(1, options.getInt("projectSnapshotSchemaRevision"))
            assertEquals(2, options.getInt("projectSourceFileCount"))
            assertEquals(
                projectSnapshot.sourceInventoryFingerprint,
                options.getString("projectSourceInventoryFingerprint"),
            )
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
                declaration.set((session.get().view as AceCodeEditor).bridgeProjectFileText(dayjsUri))
            }
            assertTrue(declaration.get().orEmpty().contains("interface Dayjs"))
            val sharedUri = options.getJSONArray("projectSourceFileUris").let { uris ->
                List(uris.length()) { index -> uris.getString(index) }
            }.single { uri -> uri.endsWith("/shared.ts") }
            instrumentation.runOnMainSync {
                declaration.set((session.get().view as AceCodeEditor).bridgeProjectFileText(sharedUri))
            }
            assertEquals("export const shared = 42 as const", declaration.get())
        } finally {
            instrumentation.runOnMainSync {
                session.getAndSet(null)?.destroy()
            }
            project.deleteRecursively()
        }
    }

    private fun projectSnapshot(
        root: File,
        document: File,
        files: List<File>,
        targetProfile: String,
    ): EditorPluginProjectSnapshot {
        val canonicalRoot = root.canonicalFile
        val canonicalDocument = document.canonicalFile
        val sources = files.map { requested ->
            val file = requested.canonicalFile
            val relativePath = canonicalRoot.toPath().relativize(file.toPath())
                .toString()
                .replace(File.separatorChar, '/')
            val text = file.readText()
            val bytes = text.toByteArray(StandardCharsets.UTF_8)
            EditorPluginProjectSource(
                relativePath = relativePath,
                text = text,
                utf8ByteLength = bytes.size.toLong(),
                sha256 = sha256(bytes),
            )
        }.sortedBy(EditorPluginProjectSource::relativePath)
        return EditorPluginProjectSnapshot(
            schemaRevision = EditorPluginProjectSnapshotContract.SCHEMA_REVISION,
            projectRootPath = canonicalRoot.path,
            documentPath = canonicalDocument.path,
            documentRelativePath = canonicalRoot.toPath().relativize(canonicalDocument.toPath())
                .toString()
                .replace(File.separatorChar, '/'),
            targetProfile = targetProfile,
            sourceFiles = sources,
            sourceInventoryFingerprint = projectSourceInventoryFingerprint(sources),
            sourceFileCount = sources.size,
            sourceByteLength = sources.sumOf(EditorPluginProjectSource::utf8ByteLength),
        )
    }

    private fun projectSourceInventoryFingerprint(
        sources: List<EditorPluginProjectSource>,
    ): String {
        val digest = MessageDigest.getInstance("SHA-256")
        digest.update("autojs6.editor.project-source.inventory.v1".toByteArray(StandardCharsets.US_ASCII))
        digest.update('\n'.code.toByte())
        sources.sortedBy(EditorPluginProjectSource::relativePath).forEach { source ->
            digest.update(source.relativePath.toByteArray(StandardCharsets.UTF_8))
            digest.update(0)
            digest.update(source.utf8ByteLength.toString().toByteArray(StandardCharsets.US_ASCII))
            digest.update(0)
            digest.update(source.sha256.toByteArray(StandardCharsets.US_ASCII))
            digest.update('\n'.code.toByte())
        }
        return digest.digest().toLowerHex()
    }

    private fun sha256(bytes: ByteArray): String =
        MessageDigest.getInstance("SHA-256").digest(bytes).toLowerHex()

    private fun ByteArray.toLowerHex(): String = joinToString(separator = "") { byte ->
        "%02x".format(Locale.ROOT, byte.toInt() and 0xff)
    }

    @Test
    fun validatedProjectSnapshotPublishesLiveUnresolvedImportDiagnostic() {
        val instrumentation = InstrumentationRegistry.getInstrumentation()
        val context = instrumentation.targetContext
        val project = File(context.cacheDir, "ace-project-diagnostics-smoke").apply {
            deleteRecursively()
            mkdirs()
        }
        File(project, "tsconfig.json").writeText("{}")
        val sourceText =
            "import { shared } from './shared'; import { absent } from './absent'; " +
                "const answer: 42 = shared; void absent; void answer;"
        val document = File(project, "main.ts").apply { writeText(sourceText) }
        val shared = File(project, "shared.ts").apply {
            writeText("export const shared = 42 as const;")
        }
        val snapshot = projectSnapshot(project, document, listOf(document, shared), "rhino")
        val ready = CountDownLatch(1)
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
                        hostVersionCode = 5276L,
                        storageDirectoryPath =
                            File(context.cacheDir, "ace-editor-project-diagnostics-fonts").absolutePath,
                        documentPath = document.absolutePath,
                        projectSnapshotProvider = EditorPluginProjectSnapshotProvider { snapshot },
                    ),
                    callback = object : EditorPluginCallback {
                        override fun onReady(state: EditorPluginState) {
                            ready.countDown()
                        }
                    },
                ),
            )
            activity.setContentView(session.get().view)
        }

        try {
            assertTrue("ACE project diagnostic session should become ready", ready.await(10, TimeUnit.SECONDS))
            scenario.onActivity {
                session.get().setInitialText(sourceText)
            }

            var diagnosticCodes = emptyList<String>()
            val deadlineNanos = System.nanoTime() + TimeUnit.SECONDS.toNanos(25)
            while (System.nanoTime() < deadlineNanos && "2307" !in diagnosticCodes) {
                val result = AtomicReference<String>()
                val evaluated = CountDownLatch(1)
                scenario.onActivity {
                    (session.get().view as AceCodeEditor).webView.evaluateJavascript(
                        "JSON.stringify(window.AutoJsAce && window.AutoJsAce.validateLsp " +
                            "? window.AutoJsAce.validateLsp() : [])",
                    ) { raw ->
                        result.set(raw)
                        evaluated.countDown()
                    }
                }
                assertTrue("ACE LSP validation callback timed out", evaluated.await(5, TimeUnit.SECONDS))
                val decoded = runCatching {
                    JSONTokener(result.get().orEmpty()).nextValue() as? String
                }.getOrNull().orEmpty()
                val diagnostics = runCatching { JSONArray(decoded) }.getOrElse { JSONArray() }
                diagnosticCodes = List(diagnostics.length()) { index ->
                    diagnostics.getJSONObject(index).optString("code")
                }
                if ("2307" !in diagnosticCodes) Thread.sleep(100)
            }

            assertEquals(
                "Live diagnostics should contain exactly one unresolved import: $diagnosticCodes",
                1,
                diagnosticCodes.count { code -> code == "2307" },
            )
            assertFalse("Synthetic rootDir diagnostics must stay hidden", "6059" in diagnosticCodes)

            val runtimeState = AtomicReference<String>()
            scenario.onActivity {
                runtimeState.set(
                    session.get().createDiagnosticsSnapshot(null, "auto").values
                        .getString("lspRuntimeState"),
                )
            }
            val runtime = JSONObject(runtimeState.get())
            assertTrue(runtime.getBoolean("projectSnapshotReady"))
            assertTrue(runtime.getBoolean("tsProjectSnapshotReady"))
            assertEquals(2, runtime.getInt("tsLoadedProjectSourceFileCount"))
            assertTrue(
                runtime.getJSONArray("diagnosticCodes").let { codes ->
                    List(codes.length()) { index -> codes.getString(index) }
                }.contains("2307"),
            )
        } finally {
            scenario.onActivity {
                session.getAndSet(null)?.destroy()
            }
            scenario.close()
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
