package io.github.supermonster003.autojs6.plugin.ace.editor.core

import android.os.SystemClock

/**
 * Plans the event times of one injected gesture from its down time. A finger's events carry the time the touchscreen
 * sampled them, however late a busy system delivers them, and the mobile overlay judges taps, double taps and flings by
 * those times. Synchronous injection takes 10 to 100 ms per event on a 2-core emulator with software rendering (the
 * GitHub workflow's API 35 emulator); stamping each event when it was injected stretched a 48 ms swipe to 230 ms and
 * lifted the finger 51 ms after its last move, which the overlay reads as a finger that rested (no fling).
 *
 * An event that the system refused and that had to be injected again later moves the rest of the gesture by the same
 * delay ([delayBy]), so event times keep increasing and holds keep their length.
 */
internal class TouchTimeline(val downTime: Long = SystemClock.uptimeMillis()) {

    private var retryDelayMs = 0L

    /** The planned event time [offsetMs] after the down time. */
    fun timeAt(offsetMs: Long): Long = downTime + retryDelayMs + offsetMs

    /** Waits until [timeAt] of [offsetMs], unless injection already runs late, and returns that event time. */
    fun at(offsetMs: Long): Long {
        val eventTime = timeAt(offsetMs)
        val remaining = eventTime - SystemClock.uptimeMillis()
        if (remaining > 0) SystemClock.sleep(remaining)
        return eventTime
    }

    /** Moves the rest of the gesture by [delayMs], the time an injection retry stamped its event after the plan. */
    fun delayBy(delayMs: Long) {
        retryDelayMs += delayMs.coerceAtLeast(0L)
    }
}
