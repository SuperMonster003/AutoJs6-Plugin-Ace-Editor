package io.github.supermonster003.autojs6.plugin.ace.editor.core

import java.io.File
import java.security.MessageDigest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Keeps the bundled Ace distribution identical to tools/ace-lsp/ace-builds-lock.json, which records the pinned
 * ace-builds tarball and every file's size and SHA-256 (Roadmap-Ace-1.44.0.md A6-1). Regenerate the lock with
 * `node tools/ace-lsp/ace-builds-lock.mjs --write` after an intended change.
 */
class AceDistributionLockTest {

    private val repositoryRoot by lazy {
        val workingDirectory = File(checkNotNull(System.getProperty("user.dir")))
        listOf(workingDirectory, workingDirectory.parentFile)
            .filterNotNull()
            .first { File(it, LOCK_PATH).isFile }
    }

    private val lockText by lazy { File(repositoryRoot, LOCK_PATH).readText() }

    private val lockedFiles by lazy {
        FILE_ENTRY.findAll(lockText).map { match ->
            LockedFile(
                path = match.groupValues[1],
                bytes = match.groupValues[2].toLong(),
                sha256 = match.groupValues[3],
                origin = match.groupValues[4],
            )
        }.toList()
    }

    private val assetRoot by lazy {
        val relative = checkNotNull(ASSET_ROOT_ENTRY.find(lockText)).groupValues[1]
        File(repositoryRoot, relative)
    }

    @Test
    fun lockPinsTheAceBuildsTarball() {
        assertTrue(lockText.contains("\"package\": \"ace-builds\""))
        assertTrue(lockText.contains("\"version\": \"$ACE_VERSION\""))
        assertTrue(lockText.contains("\"shasum\": \"d657730f665fccf72d2945d95887e12c514a29f1\""))
        assertEquals("ace-builds-$ACE_VERSION", assetRoot.name)
        assertTrue("Missing Ace asset root $assetRoot", assetRoot.isDirectory)
        assertTrue("The lock lists no files", lockedFiles.isNotEmpty())
        assertTrue(lockedFiles.all { it.origin == "upstream" || it.origin == "project" })
        assertTrue(lockedFiles.any { it.path == "src-min-noconflict/ace.js" && it.origin == "upstream" })
    }

    @Test
    fun bundledAceFilesMatchTheLock() {
        val actualPaths = listOf("LICENSE") + File(assetRoot, "src-min-noconflict").walkTopDown()
            .filter(File::isFile)
            .map { "src-min-noconflict/" + it.relativeTo(File(assetRoot, "src-min-noconflict")).invariantSeparatorsPath }
            .toList()
        assertEquals(lockedFiles.map(LockedFile::path).sorted(), actualPaths.sorted())
        lockedFiles.forEach { locked ->
            val content = File(assetRoot, locked.path).readBytes()
            if (content.size.toLong() != locked.bytes) {
                assertFalse(
                    "${locked.path} contains CRLF; Ace files must keep their upstream bytes (.gitattributes -text)",
                    containsCrLf(content),
                )
            }
            assertEquals("${locked.path} size", locked.bytes, content.size.toLong())
            assertEquals("${locked.path} SHA-256", locked.sha256, sha256(content))
        }
    }

    private fun containsCrLf(content: ByteArray): Boolean =
        (1 until content.size).any { content[it - 1] == '\r'.code.toByte() && content[it] == '\n'.code.toByte() }

    private fun sha256(content: ByteArray): String =
        MessageDigest.getInstance("SHA-256").digest(content).joinToString("") { byte -> "%02x".format(byte) }

    private data class LockedFile(val path: String, val bytes: Long, val sha256: String, val origin: String)

    private companion object {
        const val ACE_VERSION = "1.44.0"
        const val LOCK_PATH = "tools/ace-lsp/ace-builds-lock.json"
        val FILE_ENTRY = Regex(
            """\{"path":"([^"]+)","bytes":(\d+),"sha256":"([0-9a-f]{64})","origin":"(upstream|project)"""",
        )
        val ASSET_ROOT_ENTRY = Regex(""""assetRoot":\s*"([^"]+)"""")
    }
}
