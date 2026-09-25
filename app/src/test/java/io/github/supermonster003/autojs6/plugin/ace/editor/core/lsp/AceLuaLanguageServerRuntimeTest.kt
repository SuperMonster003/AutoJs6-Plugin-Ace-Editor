package io.github.supermonster003.autojs6.plugin.ace.editor.core.lsp

import java.io.File
import java.nio.file.Files
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertThrows
import org.junit.Assert.assertTrue
import org.junit.Test

class AceLuaLanguageServerRuntimeTest {

    private fun elfHeader(elfClass: Int, machine: Int) = ByteArray(20).apply {
        this[0] = 0x7f
        this[1] = 'E'.code.toByte()
        this[2] = 'L'.code.toByte()
        this[3] = 'F'.code.toByte()
        this[4] = elfClass.toByte()
        this[5] = 1
        this[6] = 1
        this[18] = machine.toByte()
        this[19] = (machine shr 8).toByte()
    }

    @Test
    fun installedExecutableDeterminesAbiInsteadOfTheDevicePreferredAbi() {
        assertEquals("armeabi-v7a", AceLuaLanguageServerRuntime.installedNativeAbi(elfHeader(1, 40)))
        assertEquals("arm64-v8a", AceLuaLanguageServerRuntime.installedNativeAbi(elfHeader(2, 183)))
        assertEquals("x86_64", AceLuaLanguageServerRuntime.installedNativeAbi(elfHeader(2, 62)))
    }

    @Test
    fun unsupportedTruncatedOrMismatchedElfHeadersAreRejected() {
        listOf(
            ByteArray(0), elfHeader(1, 40).copyOf(19),
            elfHeader(1, 40).apply { this[0] = 0 },
            elfHeader(1, 40).apply { this[5] = 2 },
            elfHeader(1, 40).apply { this[6] = 0 },
            elfHeader(2, 40), elfHeader(1, 183), elfHeader(1, 62),
            elfHeader(1, 3), elfHeader(2, 243),
        ).forEach { header -> assertNull(AceLuaLanguageServerRuntime.installedNativeAbi(header)) }
    }

    @Test
    fun startupPreflightUsesOnlyInstalledFileAndAbiAvailability() {
        val root = Files.createTempDirectory("autojs6-luals-preflight-test").toFile()
        try {
            val nativeLibrary = File(root, AceLuaLanguageServerRuntime.NATIVE_LIBRARY_NAME)

            assertFalse(
                AceLuaLanguageServerRuntime.hasInstalledNativeRuntime(
                    root,
                    listOf("arm64-v8a"),
                ),
            )

            nativeLibrary.writeBytes(
                byteArrayOf(0x7f, 'E'.code.toByte(), 'L'.code.toByte(), 'F'.code.toByte()),
            )
            nativeLibrary.setReadable(true)
            nativeLibrary.setExecutable(true)

            assertTrue(
                AceLuaLanguageServerRuntime.hasInstalledNativeRuntime(
                    root,
                    listOf("x86", "arm64-v8a"),
                ),
            )
            assertFalse(
                AceLuaLanguageServerRuntime.hasInstalledNativeRuntime(
                    root,
                    listOf("x86"),
                ),
            )
        } finally {
            root.deleteRecursively()
        }
    }

    @Test
    fun runtimeManifestPathsMustBeCanonicalRelativePaths() {
        listOf(
            "main.lua",
            "bin/main.lua",
            "script/core/diagnostics/undefined-global.lua",
            "locale/en-us/meta.lua",
        ).forEach { path ->
            assertTrue(path, AceLuaLanguageServerRuntime.isSafeRuntimePath(path))
        }

        listOf(
            "",
            ".",
            "..",
            "../main.lua",
            "script/../main.lua",
            "/absolute/main.lua",
            "\\absolute\\main.lua",
            "C:/main.lua",
            "script\\main.lua",
            "script//main.lua",
            "script/./main.lua",
            "script/\u0000main.lua",
        ).forEach { path ->
            assertFalse(path, AceLuaLanguageServerRuntime.isSafeRuntimePath(path))
        }
    }

    @Test
    fun resolvedRuntimeTargetsStayInsideTheExtractionRoot() {
        val root = Files.createTempDirectory("autojs6-luals-runtime-test").toFile()
        try {
            val target = AceLuaLanguageServerRuntime.resolveRuntimeTarget(
                root,
                "script/core/main.lua",
            )

            assertEquals(
                File(root, "script/core/main.lua").canonicalFile,
                target,
            )
            assertThrows(IllegalArgumentException::class.java) {
                AceLuaLanguageServerRuntime.resolveRuntimeTarget(root, "../escape.lua")
            }
        } finally {
            root.deleteRecursively()
        }
    }
}
