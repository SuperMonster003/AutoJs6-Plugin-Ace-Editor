package io.github.supermonster003.autojs6.plugin.ace.editor

import android.content.Context
import android.os.Looper
import org.autojs.plugin.editor.api.EditorPluginCallback
import org.autojs.plugin.editor.api.EditorPluginContract
import org.autojs.plugin.editor.api.EditorPluginEntrypoint
import org.autojs.plugin.editor.api.EditorPluginSession
import org.autojs.plugin.editor.api.EditorPluginSessionConfig

class AceEditorPluginEntrypoint : EditorPluginEntrypoint {

    override val contractVersion: Int = EditorPluginContract.VERSION

    override fun createSession(
        hostContext: Context,
        pluginContext: Context,
        config: EditorPluginSessionConfig,
        callback: EditorPluginCallback,
    ): EditorPluginSession {
        check(Looper.myLooper() == Looper.getMainLooper()) {
            "Ace editor sessions must be created on the Android main thread"
        }
        require(config.storageDirectoryPath.isNotBlank()) {
            "EditorPluginSessionConfig.storageDirectoryPath must not be blank"
        }
        return AceEditorPluginSession(hostContext, pluginContext, config, callback)
    }
}
