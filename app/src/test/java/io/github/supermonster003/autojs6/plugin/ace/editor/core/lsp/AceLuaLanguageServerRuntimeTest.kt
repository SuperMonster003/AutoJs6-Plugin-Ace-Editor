package io.github.supermonster003.autojs6.plugin.ace.editor.core.lsp

import com.google.gson.JsonParser
import java.io.File
import java.nio.file.Files
import java.security.MessageDigest
import java.util.Locale
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
    fun checkedOutRuntimeAssetsMatchTheManifestByteForByte() {
        // The device refuses to extract a runtime file whose size or SHA-256 differs from the
        // manifest, which leaves Lua without semantics. A manifest recorded from a core.autocrlf
        // checkout once passed on Windows and failed on every Linux build.
        val assetRoot = listOf(File("src/main/assets/luals"), File("app/src/main/assets/luals"))
            .firstOrNull { File(it, "manifest.json").isFile }
            ?: error("Bundled LuaLS assets are unavailable to unit tests")
        val runtimeRoot = File(assetRoot, "runtime")
        val runtime = JsonParser.parseString(File(assetRoot, "manifest.json").readText())
            .asJsonObject.getAsJsonObject("runtime")
        val entries = runtime.getAsJsonArray("files").map { it.asJsonObject }
        val inventory = MessageDigest.getInstance("SHA-256").apply {
            update("autojs6.luals.runtime.inventory.v1\n".toByteArray(Charsets.US_ASCII))
        }
        val mismatches = entries.mapNotNull { entry ->
            val path = entry.get("path").asString
            val bytes = entry.get("bytes").asLong
            val sha256 = entry.get("sha256").asString
            inventory.update("$path\u0000$bytes\u0000$sha256\n".toByteArray(Charsets.UTF_8))
            val file = File(runtimeRoot, path)
            val actual = if (file.isFile) file.readBytes() else null
            when {
                actual == null -> "$path is missing"
                actual.size.toLong() != bytes || actual.sha256() != sha256 ->
                    "$path has ${actual.size} bytes, manifest expects $bytes"
                else -> null
            }
        }
        val checkedOut = runtimeRoot.walkTopDown().filter(File::isFile)
            .map { it.relativeTo(runtimeRoot).invariantSeparatorsPath }.toSet()

        assertTrue(
            "LuaLS runtime differs from luals/manifest.json (${mismatches.size} files, e.g. " +
                "${mismatches.take(3)}). Keep the -text attribute and re-checkout the assets, or " +
                "regenerate with node tools/ace-lsp/generate-luals-manifest.mjs.",
            mismatches.isEmpty(),
        )
        assertEquals(entries.map { it.get("path").asString }.toSet(), checkedOut)
        assertEquals(runtime.get("fileCount").asInt, entries.size)
        assertEquals(runtime.get("bytes").asLong, entries.sumOf { it.get("bytes").asLong })
        assertEquals(runtime.get("sha256").asString, inventory.digest().toLowerHex())
    }

    private fun ByteArray.sha256(): String =
        MessageDigest.getInstance("SHA-256").digest(this).toLowerHex()

    private fun ByteArray.toLowerHex(): String =
        joinToString(separator = "") { "%02x".format(Locale.ROOT, it.toInt() and 0xff) }

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
