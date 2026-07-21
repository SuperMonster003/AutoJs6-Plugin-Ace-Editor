package io.github.supermonster003.autojs6.plugin.ace.editor.core

/** Browser-generated resources that are safe to answer without widening ACE's URL allowlist. */
internal object AceOptionalWebResourceRoute {

    const val FAVICON_URL = "https://appassets.androidplatform.net/favicon.ico"

    fun matches(url: String?): Boolean = url == FAVICON_URL
}
