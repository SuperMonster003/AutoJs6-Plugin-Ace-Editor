package io.github.supermonster003.autojs6.plugin.ace.editor.core

import android.app.Dialog
import android.os.SystemClock
import android.util.Log
import android.view.inputmethod.InputMethodManager
import android.widget.TextView
import androidx.test.ext.junit.runners.AndroidJUnit4
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.atomic.AtomicReference
import org.junit.Assume.assumeTrue
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith

/**
 * A keyboard request that shows no keyboard must not block later ones. Right after boot an API 36.1 emulator accepted
 * a request that the window manager then aborted (ImeTracker: PHASE_WM_ABORT_SHOW_IME_POST_LAYOUT), and every later tap
 * was ignored as "already showing". AceImeControllerTest covers the transition timeout for such requests; this test
 * covers a request that InputMethodManager refuses outright.
 */
@RunWith(AndroidJUnit4::class)
class AceImeRequestRecoveryDeviceTest {

    // While a dialog has the window focus, the input method does not serve the WebView and refuses the request. The
    // keyboard state returns to hidden, so the first tap after the dialog closes asks for the keyboard.
    @Test
    fun aRefusedKeyboardRequestDoesNotBlockTheNextTap() {
        AceDeviceTestHarness.open(DOCUMENT).use { editor ->
            Log.i(LOG_TAG, "device ${editor.device}")
            editor.hideSoftInput()
            val dialog = AtomicReference<Dialog>()
            try {
                editor.scenario.onActivity { activity ->
                    dialog.set(Dialog(activity).apply {
                        setContentView(TextView(activity).apply { text = "focus" })
                        show()
                    })
                }
                assertTrue(
                    "the dialog takes the window focus",
                    editor.waitFor(3_000L) { editor.fromEditor { !it.webView.hasWindowFocus() } },
                )
                // Whether the system refuses does not depend on the code under test; the editor asks the same way.
                val systemRefuses = AtomicBoolean(false)
                editor.onEditor {
                    val imm = it.context.getSystemService(InputMethodManager::class.java)
                    it.webView.requestFocus()
                    systemRefuses.set(!imm.showSoftInput(it.webView, InputMethodManager.SHOW_IMPLICIT))
                }
                assumeTrue("InputMethodManager takes a request for an unfocused window here", systemRefuses.get())
                val requestedAt = SystemClock.uptimeMillis()
                editor.onEditor { it.showSoftInput() }
                assertTrue(
                    "the editor asks for the keyboard: ${editor.hostEvents()}",
                    editor.waitFor(2_000L) {
                        editor.hostEvents().any { it.isEventSince(requestedAt, ":ime_show_request:accepted=true,reason=accepted,") }
                    },
                )
                assertTrue(
                    "the refused request returns to hidden: ${editor.hostEvents()}",
                    editor.waitFor(1_000L) {
                        editor.hostEvents().any { it.isEventSince(requestedAt, ":ime_show_not_delivered:state=HIDDEN") }
                    },
                )
            } finally {
                editor.scenario.onActivity { dialog.get()?.dismiss() }
            }
            editor.awaitWindowFocus()
            val state = imeState(editor)
            assertNotEquals("the keyboard state is not left showing: ${editor.hostEvents()}", AceImeState.SHOWING.name, state)
            if (state == AceImeState.HIDDEN.name) {
                val tappedAt = SystemClock.uptimeMillis()
                editor.tap(editor.point(2, 6))
                assertTrue(
                    "the next tap asks for the keyboard: ${editor.hostEvents()}",
                    editor.waitFor(3_000L) {
                        editor.hostEvents().any { it.isEventSince(tappedAt, ":ime_show_request:accepted=true,reason=accepted,") }
                    },
                )
            }
            editor.hideSoftInput()
        }
    }

    private fun String.isEventSince(uptime: Long, text: String): Boolean =
        contains(text) && (substringBefore(':').toLongOrNull() ?: 0L) >= uptime

    private fun imeState(editor: AceDeviceTestHarness): String? {
        val state = AtomicReference<String?>()
        editor.session { state.set(it.createDiagnosticsSnapshot(null, "auto").values.getString("lastImeState")) }
        return state.get()
    }

    private companion object {
        const val LOG_TAG = "AutoJs6AceImeRecovery"
        val DOCUMENT = (0 until 40).joinToString("\n") { row -> "line$row alpha beta gamma delta $row" }
    }
}
