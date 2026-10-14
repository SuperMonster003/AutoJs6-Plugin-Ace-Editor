package io.github.supermonster003.autojs6.plugin.ace.editor.core

import android.app.Activity
import android.view.View
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import org.autojs.plugin.editor.api.EditorPluginSession

/**
 * Forwards keyboard insets to [session] the way AutoJs6's editor viewport policy does. The session's IME state only
 * leaves "showing" when the host reports the keyboard; without this, a test activity keeps it there after the first
 * keyboard request, and later requests are ignored as "already showing".
 *
 * The test activity resizes its window for the keyboard, so the decor view consumes the keyboard insets before they
 * reach the content; the root window insets after each layout still carry them.
 */
internal fun forwardImeInsets(activity: Activity, session: EditorPluginSession) {
    val content = activity.findViewById<View>(android.R.id.content)
    var reported: Pair<Boolean, Int>? = null
    content.viewTreeObserver.addOnGlobalLayoutListener {
        val insets = ViewCompat.getRootWindowInsets(content) ?: return@addOnGlobalLayoutListener
        val current = insets.isVisible(WindowInsetsCompat.Type.ime()) to
            insets.getInsets(WindowInsetsCompat.Type.ime()).bottom
        if (current != reported) {
            reported = current
            session.onImeInsetsChanged(current.first, current.second)
        }
    }
}
