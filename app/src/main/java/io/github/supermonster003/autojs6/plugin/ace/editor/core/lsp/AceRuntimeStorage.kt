package io.github.supermonster003.autojs6.plugin.ace.editor.core.lsp

import android.content.Context
import java.io.File

/**
 * Writable private directories of the process that runs the editor, for the files the language runtimes create.
 *
 * The AutoJs6 host runs the plugin in its own process and passes a package context of the plugin. That context
 * gives the plugin's assets and native library directory, but it has no application context, and its data
 * directories belong to the plugin's user ID, which the host process cannot write. Runtimes therefore read from the
 * plugin context and write here (maintainer test V6, 2026-10-14: LuaLS was reported unavailable and the Java
 * compiler failed inside the host).
 */
internal data class AceRuntimeStorage(
    val filesDirectory: File,
    val noBackupDirectory: File,
    val cacheDirectory: File,
) {
    companion object {
        /** The directories of the application [context] belongs to; inside the host process, the host's. */
        fun of(context: Context): AceRuntimeStorage {
            val application = context.applicationContext ?: context
            return AceRuntimeStorage(application.filesDir, application.noBackupFilesDir, application.cacheDir)
        }
    }
}
