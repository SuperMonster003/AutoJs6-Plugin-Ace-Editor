package io.github.supermonster003.autojs6.plugin.ace.editor.core.lsp

import android.content.Context
import android.content.ContextWrapper
import android.os.Build
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import java.io.ByteArrayOutputStream
import java.io.File
import java.util.concurrent.TimeUnit
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Assume.assumeTrue
import org.junit.Test
import org.junit.runner.RunWith

/**
 * The AutoJs6 host runs the plugin in its own process and passes a package context of the plugin: it has no
 * application context, and its data directories belong to the plugin's user ID, which the host cannot write. LuaLS
 * was reported unavailable there and the Java compiler failed (maintainer test V6, 2026-10-14). The runtimes read the
 * plugin package from such a context and write to the storage of the running process ([AceRuntimeStorage]).
 */
@RunWith(AndroidJUnit4::class)
class AceRuntimeStorageDeviceTest {

    private val target: Context = InstrumentationRegistry.getInstrumentation().targetContext

    // Like the host's: no application context, and the package's own directories must not be used.
    private val pluginContext = object : ContextWrapper(
        target.createPackageContext(target.packageName, Context.CONTEXT_IGNORE_SECURITY),
    ) {
        override fun getApplicationContext(): Context? = null
        override fun getNoBackupFilesDir(): File = throw AssertionError("used the plugin package's no_backup directory")
        override fun getCacheDir(): File = throw AssertionError("used the plugin package's cache directory")
        override fun getFilesDir(): File = throw AssertionError("used the plugin package's files directory")
    }

    private fun withStorage(name: String, body: (AceRuntimeStorage) -> Unit) {
        val root = File(target.cacheDir, name)
        root.deleteRecursively()
        try {
            body(AceRuntimeStorage(File(root, "files"), File(root, "no_backup"), File(root, "cache")))
        } finally {
            root.deleteRecursively()
        }
    }

    @Test
    fun luaLanguageServerStartsFromAPluginPackageContext() {
        assumeTrue(Build.SUPPORTED_ABIS.any { it in setOf("arm64-v8a", "armeabi-v7a", "x86_64") })
        withStorage("runtime-storage-luals-test") { storage ->
            assertTrue("availability preflight", AceLuaLanguageServerRuntime.isAvailable(pluginContext))
            assertTrue("manifest and executable checks", AceLuaLanguageServerRuntime.isSupported(pluginContext))

            val spec = AceLuaLanguageServerRuntime.serverSpec(pluginContext, storage)
            assertEquals(
                File(target.applicationInfo.nativeLibraryDir, AceLuaLanguageServerRuntime.NATIVE_LIBRARY_NAME).canonicalPath,
                File(spec.command.first()).canonicalPath,
            )
            val runtimePath = storage.noBackupDirectory.canonicalPath + File.separator
            val statePath = storage.cacheDirectory.canonicalPath + File.separator
            val workingDirectory = checkNotNull(spec.workingDirectory)
            assertTrue(workingDirectory.canonicalPath.startsWith(runtimePath))
            assertTrue(File(workingDirectory, "main.lua").isFile)
            for (option in listOf("--logpath=", "--metapath=")) {
                assertTrue(option, spec.command.any { it.startsWith(option) && File(it.substringAfter('=')).canonicalPath.startsWith(statePath) })
            }

            assertTrue("LuaLS answers initialize", answersInitialize(spec))
        }
    }

    @Test
    fun javaClasspathInstallsFromAPluginPackageContext() {
        withStorage("runtime-storage-java-test") { storage ->
            assertTrue(AceJavaClasspathRuntime.isSupported(pluginContext))
            val installed = AceJavaClasspathRuntime.ensureInstalled(pluginContext, storage)
            assertTrue(installed.isFile)
            assertTrue(installed.canonicalPath.startsWith(storage.filesDirectory.canonicalPath + File.separator))
        }
    }

    private fun answersInitialize(spec: AceStdioLspServerSpec): Boolean {
        val process = ProcessBuilder(spec.command)
            .directory(spec.workingDirectory)
            .redirectErrorStream(false)
            .apply { environment().putAll(spec.environment) }
            .start()
        try {
            val body = """{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"processId":null,"rootUri":null,"capabilities":{}}}"""
            val bytes = body.toByteArray(Charsets.UTF_8)
            process.outputStream.write("Content-Length: ${bytes.size}\r\n\r\n".toByteArray(Charsets.US_ASCII))
            process.outputStream.write(bytes)
            process.outputStream.flush()
            val output = ByteArrayOutputStream()
            val reader = Thread {
                val buffer = ByteArray(8192)
                runCatching {
                    while (true) {
                        val count = process.inputStream.read(buffer)
                        if (count < 0) break
                        synchronized(output) { output.write(buffer, 0, count) }
                    }
                }
            }.apply {
                isDaemon = true
                start()
            }
            val deadline = System.nanoTime() + TimeUnit.MILLISECONDS.toNanos(spec.handshakeTimeoutMs)
            while (System.nanoTime() < deadline) {
                val text = synchronized(output) { output.toString(Charsets.UTF_8.name()) }
                if (text.contains("\"id\":1") && text.contains("\"capabilities\"")) return true
                if (!process.isAlive) break
                Thread.sleep(50)
            }
            reader.interrupt()
            return false
        } finally {
            process.destroy()
            process.waitFor(2, TimeUnit.SECONDS)
            if (process.isAlive) process.destroyForcibly()
        }
    }
}
