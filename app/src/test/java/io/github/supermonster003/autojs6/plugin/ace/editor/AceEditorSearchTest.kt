package io.github.supermonster003.autojs6.plugin.ace.editor

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class AceEditorSearchTest {

    @Test
    fun `backward whole-word search terminates after rejecting index zero`() {
        assertNull(
            findPlainBackwardRange(
                text = "foobar",
                query = "foo",
                start = 6,
                caseSensitive = true,
                wholeWord = true,
            ),
        )
    }

    @Test
    fun `backward whole-word search skips a partial suffix and finds prior word`() {
        assertEquals(
            0..2,
            findPlainBackwardRange(
                text = "foo foobar",
                query = "foo",
                start = 10,
                caseSensitive = true,
                wholeWord = true,
            ),
        )
    }
}
