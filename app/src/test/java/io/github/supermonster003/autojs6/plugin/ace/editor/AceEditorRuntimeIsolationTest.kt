package io.github.supermonster003.autojs6.plugin.ace.editor

import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Test
import java.nio.charset.StandardCharsets

class AceEditorRuntimeIsolationTest {

    @Test
    fun `info service does not link the compile-only editor api`() {
        val classPath = AceEditorInfoService::class.java.name.replace('.', '/') + ".class"
        val classBytes = javaClass.classLoader?.getResourceAsStream(classPath)?.use { it.readBytes() }
        assertNotNull(classBytes)
        val constantPoolText = String(checkNotNull(classBytes), StandardCharsets.ISO_8859_1)
        assertFalse(constantPoolText.contains("org/autojs/plugin/editor/api"))
        assertFalse(constantPoolText.contains("EditorPluginContract"))
    }
}
