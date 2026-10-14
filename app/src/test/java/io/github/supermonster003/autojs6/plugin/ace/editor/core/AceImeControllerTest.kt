package io.github.supermonster003.autojs6.plugin.ace.editor.core

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class AceImeControllerTest {

    private fun controller() = AceImeController(coalesceWindowMillis = 150L, transitionTimeoutMillis = 1_000L)

    @Test
    fun insetsConfirmARequestedKeyboard() {
        val ime = controller()
        assertEquals("accepted", ime.requestShow(now = 1_000L).reason)
        assertEquals(AceImeState.SHOWING, ime.state)
        ime.onHostImeInsetsChanged(visible = true, bottomInset = 900, now = 1_120L)
        assertEquals(AceImeState.VISIBLE, ime.state)
        assertEquals(900, ime.lastImeHeight)
        assertEquals("already_visible", ime.requestShow(now = 2_000L).reason)
        assertEquals("accepted", ime.requestHide(now = 3_000L).reason)
        ime.onHostImeInsetsChanged(visible = false, bottomInset = 0, now = 3_100L)
        assertEquals(AceImeState.HIDDEN, ime.state)
        assertEquals("already_hidden", ime.requestHide(now = 4_000L).reason)
    }

    @Test
    fun requestsCloseTogetherAreCoalesced() {
        val ime = controller()
        assertTrue(ime.requestShow(now = 1_000L).accepted)
        assertEquals("coalesced:showing", ime.requestHide(now = 1_100L).reason)
    }

    @Test
    fun aRunningTransitionStillIgnoresRepeatedAndReverseRequests() {
        val ime = controller()
        ime.requestShow(now = 1_000L)
        assertEquals("already_showing", ime.requestShow(now = 1_500L).reason)
        assertEquals("reverse_during_showing", ime.requestHide(now = 1_999L).reason)
        assertEquals(AceImeState.SHOWING, ime.state)
        ime.onHostImeInsetsChanged(visible = true, bottomInset = 900, now = 2_100L)
        ime.requestHide(now = 3_000L)
        assertEquals("already_hiding", ime.requestHide(now = 3_500L).reason)
        assertEquals("reverse_during_hiding", ime.requestShow(now = 3_900L).reason)
    }

    // An API 36.1 emulator right after boot accepted a show request whose keyboard never appeared; every later tap
    // was ignored as "already_showing".
    @Test
    fun aShowRequestWithoutKeyboardStopsBlockingAfterTheTimeout() {
        val ime = controller()
        ime.requestShow(now = 1_000L)
        assertEquals("already_showing", ime.requestShow(now = 1_999L).reason)
        val retry = ime.requestShow(now = 2_000L)
        assertTrue(retry.accepted)
        assertEquals("accepted_after_stale_showing", retry.reason)
        assertEquals(2_000L, ime.lastShowSoftInputAtUptimeMillis)
        ime.onHostImeInsetsChanged(visible = true, bottomInset = 900, now = 2_100L)
        assertEquals(AceImeState.VISIBLE, ime.state)
    }

    @Test
    fun aStaleShowingAcceptsAHide() {
        val ime = controller()
        ime.requestShow(now = 1_000L)
        val hide = ime.requestHide(now = 2_000L)
        assertEquals("accepted_after_stale_showing", hide.reason)
        assertEquals(AceImeState.HIDING, ime.state)
    }

    // A hide request while no keyboard is visible is cancelled by the system (ImeTracker: ALREADY_HIDDEN) and leaves
    // HIDING without insets.
    @Test
    fun aHideRequestWithoutEffectStopsBlockingAfterTheTimeout() {
        val ime = controller()
        ime.requestShow(now = 1_000L)
        ime.onHostImeInsetsChanged(visible = true, bottomInset = 900, now = 1_100L)
        ime.requestHide(now = 2_000L)
        assertEquals("reverse_during_hiding", ime.requestShow(now = 2_500L).reason)
        assertEquals("already_hiding", ime.requestHide(now = 2_999L).reason)
        assertEquals("accepted_after_stale_hiding", ime.requestHide(now = 3_000L).reason)
        assertEquals("accepted_after_stale_hiding", ime.requestShow(now = 4_000L).reason)
        assertEquals(AceImeState.SHOWING, ime.state)
    }

    @Test
    fun aRefusedShowRestoresThePreviousStateAndDoesNotCoalesceTheNextTap() {
        val ime = controller()
        ime.requestShow(now = 1_000L)
        ime.onShowRequestNotDelivered(now = 1_010L)
        assertEquals(AceImeState.HIDDEN, ime.state)
        assertEquals("not_delivered:show", ime.lastIgnoredRequestReason)
        assertEquals("the next tap asks again", "accepted", ime.requestShow(now = 1_050L).reason)
    }

    @Test
    fun aRefusedShowAfterAStaleTransitionRestoresTheStateBeforeIt() {
        val ime = controller()
        ime.requestShow(now = 1_000L)
        assertEquals("accepted_after_stale_showing", ime.requestShow(now = 2_000L).reason)
        ime.onShowRequestNotDelivered(now = 2_010L)
        assertEquals("the keyboard never appeared", AceImeState.HIDDEN, ime.state)
    }

    @Test
    fun aLateRefusalDoesNotUndoConfirmedInsets() {
        val ime = controller()
        ime.requestShow(now = 1_000L)
        ime.onHostImeInsetsChanged(visible = true, bottomInset = 900, now = 1_050L)
        ime.onShowRequestNotDelivered(now = 1_100L)
        assertEquals(AceImeState.VISIBLE, ime.state)
        assertFalse(ime.isTransitioning)
    }
}
