package io.github.supermonster003.autojs6.plugin.ace.editor

import org.autojs.plugin.editor.api.EditorPluginContract
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class AceEditorMetadataTest {

    @Test
    fun runtimeMetadataAdvertisesFoldingAndProjectRenameContract() {
        assertEquals(EditorPluginContract.VERSION, AceEditorMetadata.CONTRACT_VERSION)
        assertTrue("codeFolding" in AceEditorMetadata.CAPABILITIES)
        assertTrue("projectRename" in AceEditorMetadata.CAPABILITIES)
    }
}
