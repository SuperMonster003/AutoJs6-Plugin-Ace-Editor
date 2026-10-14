package io.github.supermonster003.autojs6.plugin.ace.editor.core

import android.app.Activity
import android.os.Build
import android.os.Bundle
import android.view.View
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat

/**
 * Hosts the editor in device tests. Android 15 lays out apps targeting SDK 35 or higher edge to edge, so the editor
 * started under the status bar, and a tap injected on its first rows went to the status bar window instead (B1 of
 * AceTouchInteractionDeviceTest on the API 35 emulator of the GitHub workflow). Like AutoJs6's editor screen, the
 * activity keeps its content clear of the system bars and the display cutout.
 */
class AceEditorTestActivity : Activity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        ViewCompat.setOnApplyWindowInsetsListener(findViewById<View>(android.R.id.content)) { content, insets ->
            // Before API 30 the decor already pads for the status bar, and androidx reads the cutout from the root
            // insets, which would add it a second time on a notched phone.
            val types = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout()
            } else {
                WindowInsetsCompat.Type.systemBars()
            }
            val bars = insets.getInsets(types)
            content.setPadding(bars.left, bars.top, bars.right, bars.bottom)
            insets
        }
    }
}
