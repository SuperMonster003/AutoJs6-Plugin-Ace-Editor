package io.github.supermonster003.autojs6.plugin.ace.editor.core.lsp

import java.io.File
import java.nio.file.Files
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertThrows
import org.junit.Assert.assertTrue
import org.junit.Test

class AceLuaLanguageServerRuntimeTest {

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
