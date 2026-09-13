package io.github.supermonster003.autojs6.plugin.ace.editor.core.lsp

import java.io.File
import java.net.URI
import java.nio.file.Files
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class AceLuaWorkspaceMappingTest {

    @Test
    fun physicalDocumentAndProjectUrisRoundTripWithinCurrentDirectory() {
        val projectRoot = Files.createTempDirectory("autojs6-lua-project").toFile()
        try {
            val document = File(projectRoot, "main script.lua")
            val sibling = File(projectRoot, "lib/utility.lua")
            val mapping = requireNotNull(
                AceLuaWorkspaceMapping.fromDocumentPath(document.absolutePath),
            )

            assertEquals(projectRoot.canonicalFile, mapping.projectRoot)
            assertEquals(document.canonicalFile, mapping.documentFile)
            assertTrue(mapping.rootUri.startsWith("file:///"))
            assertTrue(mapping.documentUri.endsWith("main%20script.lua"))
            assertEquals(
                "${AceLspServerManager.SYNTHETIC_ROOT_URI}/lib/utility.lua",
                mapping.virtualUriForRealUri(sibling.toURI().toASCIIString()),
            )
            assertEquals(
                sibling.canonicalFile,
                File(
                    URI(
                        requireNotNull(
                            mapping.realUriForVirtualUri(
                                "${AceLspServerManager.SYNTHETIC_ROOT_URI}/lib/utility.lua",
                            ),
                        ),
                    ),
                ).canonicalFile,
            )
            assertTrue(mapping.contains(sibling))
            assertEquals(
                "${AceLspServerManager.SYNTHETIC_ROOT_URI}/",
                mapping.virtualUriForRealUri(projectRoot.toURI().toASCIIString()),
            )
            assertEquals(
                "${AceLspServerManager.SYNTHETIC_ROOT_URI}/lib/space%20%2B%20%23.lua",
                mapping.virtualUriForRealUri(File(projectRoot, "lib/space + #.lua").toURI().toASCIIString()),
            )
        } finally {
            projectRoot.deleteRecursively()
        }
    }

    @Test
    fun mappingRejectsTraversalSiblingPrefixesAndNonFileSchemes() {
        val parent = Files.createTempDirectory("autojs6-lua-boundary").toFile()
        val projectRoot = File(parent, "project").apply { mkdirs() }
        val similarlyNamedSibling = File(parent, "project-escape").apply { mkdirs() }
        try {
            val mapping = requireNotNull(
                AceLuaWorkspaceMapping.fromDocumentPath(File(projectRoot, "main.lua").absolutePath),
            )

            assertFalse(mapping.contains(File(similarlyNamedSibling, "outside.lua")))
            assertNull(
                mapping.realUriForVirtualUri(
                    "${AceLspServerManager.SYNTHETIC_ROOT_URI}/../outside.lua",
                ),
            )
            assertNull(
                mapping.realUriForVirtualUri(
                    "${AceLspServerManager.SYNTHETIC_ROOT_URI}/%2e%2e/outside.lua",
                ),
            )
            assertNull(
                mapping.realUriForVirtualUri(
                    "${AceLspServerManager.SYNTHETIC_ROOT_URI}/main.lua?escape=true",
                ),
            )
            assertNull(mapping.virtualUriForRealUri("https://example.com/main.lua"))
            assertNull(
                mapping.virtualUriForRealUri(
                    File(similarlyNamedSibling, "outside.lua").toURI().toASCIIString(),
                ),
            )
            assertNull(AceLuaWorkspaceMapping.fromDocumentPath("https://example.com/main.lua"))
            assertNull(AceLuaWorkspaceMapping.fromDocumentPath("relative/main.lua"))
        } finally {
            parent.deleteRecursively()
        }
    }
}
