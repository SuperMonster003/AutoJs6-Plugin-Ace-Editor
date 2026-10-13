package io.github.supermonster003.autojs6.plugin.ace.editor.core

import android.content.SharedPreferences
import org.json.JSONObject

/**
 * Host "Smart hints" settings (code editor settings > smart hints). The keys mirror the host's
 * `strings_donottranslate.xml`; the values are serialized for `AutoJsAce.setSmartHintOptions`.
 */
object AceEditorSmartHintPreferences {

    const val KEY_COMPLETION_TRIGGER = "key_\$_ace_smart_hint_completion_trigger"
    const val KEY_COMPLETION_MIN_CHARS = "key_\$_ace_smart_hint_completion_min_chars"
    const val KEY_COMPLETION_DELAY = "key_\$_ace_smart_hint_completion_delay"
    const val KEY_SIGNATURE_TRIGGER = "key_\$_ace_smart_hint_signature_trigger"
    const val KEY_ARROW_OVERLOAD_CYCLING = "key_\$_ace_smart_hint_arrow_overload_cycling"
    const val KEY_SYMBOL_HIGHLIGHT = "key_\$_ace_symbol_highlight_enabled"

    const val COMPLETION_TRIGGER_IDENTIFIER = "identifier"
    const val COMPLETION_TRIGGER_DOT = "dot"
    const val COMPLETION_TRIGGER_OFF = "off"
    const val SIGNATURE_TRIGGER_CURSOR = "cursor"
    const val SIGNATURE_TRIGGER_TYPING = "typing"
    const val SIGNATURE_TRIGGER_OFF = "off"

    const val DEFAULT_COMPLETION_TRIGGER = COMPLETION_TRIGGER_IDENTIFIER
    const val DEFAULT_COMPLETION_MIN_CHARS = 1
    const val DEFAULT_COMPLETION_DELAY_MS = 0
    const val DEFAULT_SIGNATURE_TRIGGER = SIGNATURE_TRIGGER_CURSOR
    const val DEFAULT_ARROW_OVERLOAD_CYCLING = true
    const val DEFAULT_SYMBOL_HIGHLIGHT = true

    private val COMPLETION_TRIGGERS = setOf(COMPLETION_TRIGGER_IDENTIFIER, COMPLETION_TRIGGER_DOT, COMPLETION_TRIGGER_OFF)
    private val SIGNATURE_TRIGGERS = setOf(SIGNATURE_TRIGGER_CURSOR, SIGNATURE_TRIGGER_TYPING, SIGNATURE_TRIGGER_OFF)
    private val COMPLETION_MIN_CHARS_RANGE = 1..10
    private val COMPLETION_DELAY_RANGE = 0..5000

    fun completionTrigger(preferences: SharedPreferences): String =
        preferences.getString(KEY_COMPLETION_TRIGGER, null)
            ?.takeIf { it in COMPLETION_TRIGGERS }
            ?: DEFAULT_COMPLETION_TRIGGER

    fun completionMinChars(preferences: SharedPreferences): Int =
        preferences.getString(KEY_COMPLETION_MIN_CHARS, null)
            ?.trim()
            ?.toIntOrNull()
            ?.takeIf { it in COMPLETION_MIN_CHARS_RANGE }
            ?: DEFAULT_COMPLETION_MIN_CHARS

    fun completionDelayMs(preferences: SharedPreferences): Int =
        preferences.getString(KEY_COMPLETION_DELAY, null)
            ?.trim()
            ?.toIntOrNull()
            ?.takeIf { it in COMPLETION_DELAY_RANGE }
            ?: DEFAULT_COMPLETION_DELAY_MS

    fun signatureTrigger(preferences: SharedPreferences): String =
        preferences.getString(KEY_SIGNATURE_TRIGGER, null)
            ?.takeIf { it in SIGNATURE_TRIGGERS }
            ?: DEFAULT_SIGNATURE_TRIGGER

    fun isArrowOverloadCyclingEnabled(preferences: SharedPreferences): Boolean =
        preferences.getBoolean(KEY_ARROW_OVERLOAD_CYCLING, DEFAULT_ARROW_OVERLOAD_CYCLING)

    /**
     * [popupTexts] are the plugin's localized captions of the completion popup states
     * (Roadmap-Ace-1.44.0.md A5-5); the bridge falls back to English without them.
     */
    fun isSymbolHighlightEnabled(preferences: SharedPreferences): Boolean =
        preferences.getBoolean(KEY_SYMBOL_HIGHLIGHT, DEFAULT_SYMBOL_HIGHLIGHT)

    fun optionsJson(
        preferences: SharedPreferences,
        popupTexts: CompletionPopupTexts? = null,
    ): String = JSONObject()
        .put("completionTrigger", completionTrigger(preferences))
        .put("completionMinChars", completionMinChars(preferences))
        .put("completionDelayMs", completionDelayMs(preferences))
        .put("signatureTrigger", signatureTrigger(preferences))
        .put("arrowOverloadCycling", isArrowOverloadCyclingEnabled(preferences))
        .put("symbolHighlight", isSymbolHighlightEnabled(preferences))
        .apply {
            popupTexts?.let {
                put("completionLoadingText", it.loading)
                put("completionEmptyText", it.noSuggestions)
            }
        }
        .toString()

    data class CompletionPopupTexts(val loading: String, val noSuggestions: String)
}
