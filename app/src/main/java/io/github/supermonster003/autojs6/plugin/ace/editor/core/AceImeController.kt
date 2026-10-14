package io.github.supermonster003.autojs6.plugin.ace.editor.core

import android.os.SystemClock

/**
 * Tracks the soft keyboard from the editor's requests and the host's keyboard insets.
 *
 * A request moves the state to SHOWING or HIDING. The host's insets confirm VISIBLE or HIDDEN, and a show request that
 * InputMethodManager refuses returns to the state before it. A request that is taken but never takes effect left the
 * state in its transition, and every later request was ignored as "already showing": right after boot an API 36.1
 * emulator accepted a show request that the window manager aborted, and taps no longer asked for the keyboard. So a
 * transition older than [transitionTimeoutMillis] no longer blocks a new request. Warm keyboards confirm within 50 to
 * 250 ms on the test devices and emulators; the first show of a cold input method took up to about 3 s, and a request
 * repeated meanwhile is harmless because the late insets still confirm the keyboard.
 */
class AceImeController(
    private val coalesceWindowMillis: Long,
    private val transitionTimeoutMillis: Long,
) {

    var state: AceImeState = AceImeState.HIDDEN
        private set

    var lastImeHeight: Int = 0
        private set

    var lastImeRequestAtUptimeMillis: Long = 0L
        private set

    var lastShowSoftInputAtUptimeMillis: Long = 0L
        private set

    var lastHideSoftInputAtUptimeMillis: Long = 0L
        private set

    var lastImeTransitionStartedAtUptimeMillis: Long = 0L
        private set

    var lastImeTransitionEndedAtUptimeMillis: Long = 0L
        private set

    var lastIgnoredRequestReason: String? = null
        private set

    private var lastAcceptedRequestAtUptimeMillis: Long = 0L

    private var stateBeforeLastRequest: AceImeState = AceImeState.HIDDEN

    val isTransitioning: Boolean
        get() = state == AceImeState.SHOWING || state == AceImeState.HIDING

    fun requestShow(now: Long = SystemClock.uptimeMillis()): Decision {
        lastImeRequestAtUptimeMillis = now
        val stale = isTransitionStale(now)
        return when {
            isCoalesced(now) -> ignore(Request.SHOW, "coalesced:${state.name.lowercase()}", now)
            state == AceImeState.VISIBLE -> ignore(Request.SHOW, "already_visible", now)
            state == AceImeState.SHOWING && !stale -> ignore(Request.SHOW, "already_showing", now)
            state == AceImeState.HIDING && !stale -> ignore(Request.SHOW, "reverse_during_hiding", now)
            else -> accept(Request.SHOW, AceImeState.SHOWING, now, stale)
        }
    }

    fun requestHide(now: Long = SystemClock.uptimeMillis()): Decision {
        lastImeRequestAtUptimeMillis = now
        val stale = isTransitionStale(now)
        return when {
            isCoalesced(now) -> ignore(Request.HIDE, "coalesced:${state.name.lowercase()}", now)
            state == AceImeState.HIDDEN -> ignore(Request.HIDE, "already_hidden", now)
            state == AceImeState.HIDING && !stale -> ignore(Request.HIDE, "already_hiding", now)
            state == AceImeState.SHOWING && !stale -> ignore(Request.HIDE, "reverse_during_showing", now)
            else -> accept(Request.HIDE, AceImeState.HIDING, now, stale)
        }
    }

    /**
     * InputMethodManager refused the accepted show request, so the keyboard keeps the state it had before it. The next
     * request is not coalesced with the refused one.
     */
    fun onShowRequestNotDelivered(now: Long = SystemClock.uptimeMillis()) {
        if (state != AceImeState.SHOWING) {
            return
        }
        state = stateBeforeLastRequest
        lastAcceptedRequestAtUptimeMillis = 0L
        lastIgnoredRequestReason = "not_delivered:show"
        lastImeTransitionEndedAtUptimeMillis = now
    }

    fun onHostImeInsetsChanged(visible: Boolean, bottomInset: Int, now: Long = SystemClock.uptimeMillis()) {
        lastImeHeight = if (visible) bottomInset.coerceAtLeast(0) else 0
        val next = if (visible) AceImeState.VISIBLE else AceImeState.HIDDEN
        if (state != next) {
            if (!isTransitioning) {
                lastImeTransitionStartedAtUptimeMillis = now
            }
            state = next
            lastImeTransitionEndedAtUptimeMillis = now
        }
    }

    private fun isTransitionStale(now: Long): Boolean =
        isTransitioning && now - lastImeTransitionStartedAtUptimeMillis >= transitionTimeoutMillis

    private fun isCoalesced(now: Long): Boolean {
        val lastAccepted = lastAcceptedRequestAtUptimeMillis
        return lastAccepted > 0L && now - lastAccepted < coalesceWindowMillis
    }

    private fun accept(request: Request, next: AceImeState, now: Long, afterStaleTransition: Boolean): Decision {
        val reason = if (afterStaleTransition) "accepted_after_stale_${state.name.lowercase()}" else "accepted"
        // A stale transition is treated as not having taken effect, so a refusal returns to the state before it; insets
        // that arrive later correct the state if that transition did finish.
        stateBeforeLastRequest = if (afterStaleTransition) stateBeforeLastRequest else state
        lastAcceptedRequestAtUptimeMillis = now
        lastIgnoredRequestReason = null
        lastImeTransitionStartedAtUptimeMillis = now
        state = next
        when (request) {
            Request.SHOW -> lastShowSoftInputAtUptimeMillis = now
            Request.HIDE -> lastHideSoftInputAtUptimeMillis = now
        }
        return Decision(request = request, accepted = true, reason = reason, atUptimeMillis = now)
    }

    private fun ignore(request: Request, reason: String, now: Long): Decision {
        lastIgnoredRequestReason = reason
        return Decision(request = request, accepted = false, reason = reason, atUptimeMillis = now)
    }

    enum class Request {
        SHOW,
        HIDE,
    }

    data class Decision(
        val request: Request,
        val accepted: Boolean,
        val reason: String,
        val atUptimeMillis: Long,
    )
}
