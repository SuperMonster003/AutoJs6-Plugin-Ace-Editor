package io.github.supermonster003.autojs6.plugin.ace.editor.core

internal data class AceInstalledFontRoute(
    val fontId: String,
    val sha256: String,
) {
    companion object {
        private val ROUTE = Regex("([a-z0-9][a-z0-9_]{0,63})/([a-f0-9]{64})\\.woff2")

        fun parse(path: String): AceInstalledFontRoute? {
            val match = ROUTE.matchEntire(path.removePrefix("/")) ?: return null
            return AceInstalledFontRoute(match.groupValues[1], match.groupValues[2])
        }
    }
}
