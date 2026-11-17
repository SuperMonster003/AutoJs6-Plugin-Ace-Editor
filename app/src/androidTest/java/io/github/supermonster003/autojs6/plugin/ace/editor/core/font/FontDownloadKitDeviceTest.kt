package io.github.supermonster003.autojs6.plugin.ace.editor.core.font

import android.util.Log
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Assert.fail
import org.junit.Assume.assumeTrue
import org.junit.Test
import org.junit.runner.RunWith
import java.io.File
import java.util.concurrent.ExecutionException
import java.util.concurrent.TimeUnit

/**
 * AutoJs6 plugin-center P13.1: the font downloader on the shared download kit, on a device, against the HTTP server of
 * `tools/device/font_download_check.py` on the computer (adb reverse) as its mirrors: a transfer cut at 40 % resumes on
 * the same mirror, a mirror that cuts and then fails hands over to the second one, which continues the bytes already on
 * disk, and a file with another SHA-256 is refused with nothing installed. The real OkHttp source, file system and font
 * store are used. The server logs every request (Range, status, bytes sent); the tool checks that sequence. Opt-in:
 * skipped without `-e p13Port`.
 *
 * zh-CN: AutoJs6 plugin-center P13.1: 建立在共用下载库上的字体下载器在设备上的场景, 以电脑上 `tools/device/font_download_check.py` 的 HTTP 服务
 * (adb reverse) 作镜像: 在 40 % 处被切断的传输在同一镜像上续传; 先切断后失败的镜像交给第二个镜像, 后者接着磁盘上已有的字节继续; SHA-256 不符的文件被拒绝且
 * 不落库. 使用真实的 OkHttp 来源, 文件系统与字体仓库. 服务端记录每个请求 (Range, 状态码, 发送字节数), 由工具核对请求序列. 需显式开启: 没有
 * `-e p13Port` 时跳过.
 */
@RunWith(AndroidJUnit4::class)
class FontDownloadKitDeviceTest {

    private val context = InstrumentationRegistry.getInstrumentation().targetContext
    private val arguments = InstrumentationRegistry.getArguments()
    private val port: Int? = arguments.getString(ARG_PORT)?.toIntOrNull()

    @Test
    fun fontResumesACutTransfer() = inRoot("font-resume") { root ->
        download(root, "font-resume", listOf("cut1"))
    }

    @Test
    fun fontNextMirrorContinuesTheBytes() = inRoot("font-mirror") { root ->
        download(root, "font-mirror", listOf("cutdead", "ok"))
    }

    @Test
    fun fontWithAnotherHashIsRejected() = inRoot("font-hash") { root ->
        // The route "other" serves a file of the same size with one byte changed. zh-CN: 路由 other 提供同样大小但改了一个字节的文件.
        val font = font("font-hash", listOf("other"))
        val store = FontStore(File(root, "fonts"))
        val downloader = FontDownloader(store, OkHttpFontDownloadSource(), log = { Log.i(TAG, it) })
        try {
            val started = System.nanoTime()
            val failure = try {
                downloader.enqueue(font).future.get(60, TimeUnit.SECONDS)
                fail("The download must fail")
                null
            } catch (e: ExecutionException) {
                e.cause
            }
            val millis = (System.nanoTime() - started) / 1_000_000
            assertTrue("$failure", failure is FontMirrorsExhaustedException)
            // An integrity failure for the font dialog. zh-CN: 字体对话框据此显示完整性失败.
            assertTrue("${failure?.cause}", failure?.cause is FontFileValidationException)
            assertNull(store.installedFont(font.id))
            assertTrue(File(store.rootDirectory, ".parts").listFiles().isNullOrEmpty())
            assertFalse(downloader.downloads.partFile(font.artifact.sha256).exists())
            assertFalse(downloader.downloads.file(font.artifact.sha256).exists())
            Log.i(TAG, "P13 font-hash PASS rejected=${failure?.cause?.javaClass?.simpleName} ms=$millis")
        } finally {
            downloader.close()
        }
    }

    private fun download(root: File, scenario: String, routes: List<String>) {
        val font = font(scenario, routes)
        val store = FontStore(File(root, "fonts"))
        val downloader = FontDownloader(store, OkHttpFontDownloadSource(), log = { Log.i(TAG, it) })
        try {
            val started = System.nanoTime()
            val installed = downloader.enqueue(font).future.get(60, TimeUnit.SECONDS)
            val millis = (System.nanoTime() - started) / 1_000_000
            assertEquals(font.artifact.sha256, installed.sha256)
            assertEquals(font.artifact.sizeBytes, installed.file.length())
            assertEquals(installed.file, store.installedFile(font.id, font.artifact.sha256))
            assertTrue("download store emptied", downloader.downloads.entries().isEmpty())
            Log.i(TAG, "P13 $scenario PASS sha256=${installed.sha256.take(12)} size=${installed.sizeBytes} ms=$millis")
        } finally {
            downloader.close()
        }
    }

    private fun font(scenario: String, routes: List<String>): RemoteFont {
        val sha256 = requireNotNull(arguments.getString(ARG_FONT_SHA256)) { "-e $ARG_FONT_SHA256" }
        val size = requireNotNull(arguments.getString(ARG_FONT_SIZE)?.toLongOrNull()) { "-e $ARG_FONT_SIZE" }
        return RemoteFont(
            id = "p13_test_font",
            displayName = "P13 Test Font",
            family = "P13 Test Font",
            order = 10,
            author = "Test",
            license = FontLicense("OFL-1.1", "OFL-1.1", emptyList()),
            source = FontSource("https://example.test/font", null, null),
            artifact = FontArtifact(
                version = "1",
                fileName = "p13_test_font-1.woff2",
                format = "woff2",
                mimeType = "font/woff2",
                weight = 400,
                style = "normal",
                sizeBytes = size,
                sha256 = sha256,
                urls = routes.map { "http://127.0.0.1:$port/$it/$scenario/font.woff2" },
                revoked = false,
            ),
        )
    }

    private fun inRoot(scenario: String, block: (File) -> Unit) {
        assumeTrue("Opt-in; pass -e $ARG_PORT <port> (tools/device/font_download_check.py)", port != null)
        val root = File(context.cacheDir, "$DEVICE_TEST_DIR/$scenario-${System.currentTimeMillis()}").apply { mkdirs() }
        try {
            block(root)
        } finally {
            root.deleteRecursively()
        }
    }

    private companion object {
        const val TAG = "P13FontDownload"
        const val ARG_PORT = "p13Port"
        const val ARG_FONT_SHA256 = "p13FontSha256"
        const val ARG_FONT_SIZE = "p13FontSize"
        const val DEVICE_TEST_DIR = "p13-device-test"
    }
}
