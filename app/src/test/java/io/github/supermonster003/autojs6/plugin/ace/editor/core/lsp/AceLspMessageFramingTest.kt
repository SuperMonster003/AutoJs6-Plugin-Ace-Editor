package io.github.supermonster003.autojs6.plugin.ace.editor.core.lsp

import java.io.ByteArrayInputStream
import java.io.ByteArrayOutputStream
import java.io.EOFException
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertThrows
import org.junit.Test

class AceLspMessageFramingTest {

    @Test
    fun roundTripsConsecutiveUtf8Messages() {
        val output = ByteArrayOutputStream()
        val first = """{"jsonrpc":"2.0","id":1,"result":"你好"}"""
        val second = """{"jsonrpc":"2.0","method":"initialized","params":{}}"""

        AceLspMessageFraming.write(output, first)
        AceLspMessageFraming.write(output, second)

        val input = ByteArrayInputStream(output.toByteArray())
        assertEquals(first, AceLspMessageFraming.read(input))
        assertEquals(second, AceLspMessageFraming.read(input))
        assertNull(AceLspMessageFraming.read(input))
    }

    @Test
    fun rejectsMissingLengthAndTruncatedContent() {
        assertThrows(IllegalArgumentException::class.java) {
            AceLspMessageFraming.read(
                ByteArrayInputStream("Content-Type: application/json\r\n\r\n{}".toByteArray()),
            )
        }
        assertThrows(EOFException::class.java) {
            AceLspMessageFraming.read(
                ByteArrayInputStream("Content-Length: 10\r\n\r\n{}".toByteArray()),
            )
        }
    }
}
