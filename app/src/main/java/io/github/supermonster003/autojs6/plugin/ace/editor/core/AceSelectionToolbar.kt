package io.github.supermonster003.autojs6.plugin.ace.editor.core

import android.content.Context
import android.content.res.ColorStateList
import android.graphics.Color
import android.graphics.Rect
import android.graphics.drawable.ColorDrawable
import android.graphics.drawable.GradientDrawable
import android.graphics.drawable.RippleDrawable
import android.text.TextUtils
import android.util.TypedValue
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.view.WindowManager
import android.widget.LinearLayout
import android.widget.PopupWindow
import android.widget.TextView
import kotlin.math.roundToInt

/**
 * Editor-owned selection toolbar.
 *
 * Android's floating ActionMode is rendered from the host Window (and on recent Android versions
 * may be rendered by a remote system service), so its palette cannot reliably follow an Ace
 * theme. This popup intentionally owns both rendering and positioning while leaving selection
 * state and actions in [AceCodeEditor].
 */
internal class AceSelectionToolbar(
    private val context: Context,
    private val anchor: View,
    private val labels: Labels,
    private val stateProvider: () -> State,
    private val onAction: (AceCodeEditor.SelectionAction) -> Unit,
    private val onDismissed: (AceSelectionToolbar) -> Unit,
    backgroundColor: Int,
    foregroundColor: Int,
) {

    data class Labels(
        val copy: CharSequence,
        val paste: CharSequence,
        val selectAll: CharSequence,
        val deleteLine: CharSequence,
        val copyLine: CharSequence,
        val more: CharSequence,
    )

    data class State(
        val canCopy: Boolean,
        val canPaste: Boolean,
        val canSelectAll: Boolean,
        val showDeleteLine: Boolean,
        val canDeleteLine: Boolean,
        val canCopyLine: Boolean,
    )

    private data class Item(
        val label: CharSequence,
        val action: AceCodeEditor.SelectionAction,
        val enabled: (State) -> Boolean,
    )

    private val density = context.resources.displayMetrics.density
    private val mainItems = listOf(
        Item(labels.copy, AceCodeEditor.SelectionAction.Copy, State::canCopy),
        Item(labels.paste, AceCodeEditor.SelectionAction.Paste, State::canPaste),
        Item(labels.selectAll, AceCodeEditor.SelectionAction.SelectAll, State::canSelectAll),
    )
    private val allItems = mainItems + listOf(
        Item(labels.deleteLine, AceCodeEditor.SelectionAction.DeleteLine, State::canDeleteLine),
        Item(labels.copyLine, AceCodeEditor.SelectionAction.CopyLine, State::canCopyLine),
    )
    private val content = LinearLayout(context).apply {
        orientation = LinearLayout.HORIZONTAL
        importantForAccessibility = View.IMPORTANT_FOR_ACCESSIBILITY_NO
        elevation = dp(TOOLBAR_ELEVATION_DP).toFloat()
    }
    private val popup = PopupWindow(
        content,
        ViewGroup.LayoutParams.WRAP_CONTENT,
        ViewGroup.LayoutParams.WRAP_CONTENT,
        false,
    ).apply {
        isOutsideTouchable = true
        inputMethodMode = PopupWindow.INPUT_METHOD_NOT_NEEDED
        softInputMode = WindowManager.LayoutParams.SOFT_INPUT_ADJUST_NOTHING
        setBackgroundDrawable(ColorDrawable(Color.TRANSPARENT))
        elevation = dp(TOOLBAR_ELEVATION_DP).toFloat()
        setOnDismissListener { completeDismissal() }
    }

    private var backgroundColor = backgroundColor
    private var foregroundColor = foregroundColor
    private var contentRect = Rect()
    private var showingOverflow = false
    private var observedRoot: View? = null
    private var repositionPosted = false
    private var dismissalNotified = false
    private val repositionRunnable = Runnable {
        repositionPosted = false
        reposition()
    }
    private val layoutChangeListener = View.OnLayoutChangeListener { _, _, _, _, _, _, _, _, _ ->
        requestReposition()
    }
    private val attachStateChangeListener = object : View.OnAttachStateChangeListener {
        override fun onViewAttachedToWindow(view: View) = Unit

        override fun onViewDetachedFromWindow(view: View) {
            dismiss()
        }
    }

    fun show(rect: Rect): Boolean {
        if (!anchor.isAttachedToWindow || anchor.windowToken == null) {
            return false
        }
        contentRect.set(rect)
        showingOverflow = false
        rebuild()
        content.measure(maxWidthMeasureSpec(), View.MeasureSpec.makeMeasureSpec(0, View.MeasureSpec.UNSPECIFIED))
        val position = calculatePosition(content.measuredWidth, content.measuredHeight)
        return runCatching {
            // X is already an absolute left offset; START would mirror it a second time in RTL.
            popup.showAtLocation(anchor.rootView, Gravity.TOP or Gravity.LEFT, position.first, position.second)
            popup.isShowing.also { shown ->
                if (shown) {
                    registerPositionObservers()
                }
            }
        }.getOrDefault(false)
    }

    fun update(rect: Rect) {
        contentRect.set(rect)
        rebuild()
        reposition()
    }

    fun invalidate() {
        rebuild()
        reposition()
    }

    fun updatePalette(backgroundColor: Int, foregroundColor: Int) {
        this.backgroundColor = backgroundColor
        this.foregroundColor = foregroundColor
        invalidate()
    }

    fun dismiss() {
        if (popup.isShowing) {
            popup.dismiss()
        } else {
            completeDismissal()
        }
    }

    private fun rebuild() {
        content.removeAllViews()
        content.orientation = if (showingOverflow) LinearLayout.VERTICAL else LinearLayout.HORIZONTAL
        content.background = toolbarBackground()

        val state = stateProvider()
        if (showingOverflow) {
            allItems
                .filter { item -> item.action != AceCodeEditor.SelectionAction.DeleteLine || state.showDeleteLine }
                .forEach { item -> content.addView(actionView(item, state, overflow = true)) }
        } else {
            val availableWidth = availableWidthPx()
            val more = moreView().also(::measureNaturalWidth)
            var occupiedWidth = more.measuredWidth
            mainItems.forEach { item ->
                val itemView = actionView(item, state, overflow = false).also(::measureNaturalWidth)
                if (occupiedWidth + itemView.measuredWidth <= availableWidth) {
                    content.addView(itemView)
                    occupiedWidth += itemView.measuredWidth
                }
            }
            content.addView(more)
        }
    }

    private fun actionView(item: Item, state: State, overflow: Boolean): TextView {
        val enabled = item.enabled(state)
        return TextView(context).apply {
            text = item.label
            contentDescription = item.label
            gravity = if (overflow) Gravity.CENTER_VERTICAL or Gravity.START else Gravity.CENTER
            isSingleLine = true
            ellipsize = TextUtils.TruncateAt.END
            isAllCaps = false
            textSize = ACTION_TEXT_SIZE_SP
            setTextColor(withAlpha(foregroundColor, if (enabled) ENABLED_ALPHA else DISABLED_ALPHA))
            isEnabled = enabled
            isClickable = enabled
            isFocusable = enabled
            importantForAccessibility = View.IMPORTANT_FOR_ACCESSIBILITY_YES
            minHeight = dp(MIN_TOUCH_TARGET_DP)
            maxWidth = dp(if (overflow) OVERFLOW_ITEM_MAX_WIDTH_DP else MAIN_ITEM_MAX_WIDTH_DP)
            setPadding(
                dp(if (overflow) OVERFLOW_HORIZONTAL_PADDING_DP else MAIN_HORIZONTAL_PADDING_DP),
                0,
                dp(if (overflow) OVERFLOW_HORIZONTAL_PADDING_DP else MAIN_HORIZONTAL_PADDING_DP),
                0,
            )
            background = itemBackground()
            layoutParams = LinearLayout.LayoutParams(
                if (overflow) {
                    minOf(dp(OVERFLOW_WIDTH_DP), availableWidthPx())
                } else {
                    ViewGroup.LayoutParams.WRAP_CONTENT
                },
                ViewGroup.LayoutParams.WRAP_CONTENT,
            )
            setOnClickListener {
                if (isEnabled) {
                    onAction(item.action)
                }
            }
        }
    }

    private fun measureNaturalWidth(view: View) {
        view.measure(
            View.MeasureSpec.makeMeasureSpec(availableWidthPx(), View.MeasureSpec.AT_MOST),
            View.MeasureSpec.makeMeasureSpec(0, View.MeasureSpec.UNSPECIFIED),
        )
    }

    private fun requestReposition() {
        if (!popup.isShowing || repositionPosted) {
            return
        }
        repositionPosted = true
        anchor.removeCallbacks(repositionRunnable)
        anchor.post(repositionRunnable)
    }

    private fun reposition() {
        if (!popup.isShowing || !anchor.isAttachedToWindow) {
            return
        }
        content.measure(maxWidthMeasureSpec(), View.MeasureSpec.makeMeasureSpec(0, View.MeasureSpec.UNSPECIFIED))
        val position = calculatePosition(content.measuredWidth, content.measuredHeight)
        popup.update(
            position.first,
            position.second,
            content.measuredWidth,
            content.measuredHeight,
        )
    }

    private fun registerPositionObservers() {
        dismissalNotified = false
        anchor.addOnLayoutChangeListener(layoutChangeListener)
        anchor.addOnAttachStateChangeListener(attachStateChangeListener)
        anchor.rootView.let { root ->
            observedRoot = root
            if (root !== anchor) {
                root.addOnLayoutChangeListener(layoutChangeListener)
            }
        }
    }

    private fun unregisterPositionObservers() {
        repositionPosted = false
        anchor.removeCallbacks(repositionRunnable)
        anchor.removeOnLayoutChangeListener(layoutChangeListener)
        anchor.removeOnAttachStateChangeListener(attachStateChangeListener)
        observedRoot?.takeIf { it !== anchor }?.removeOnLayoutChangeListener(layoutChangeListener)
        observedRoot = null
    }

    private fun completeDismissal() {
        if (dismissalNotified) {
            return
        }
        dismissalNotified = true
        unregisterPositionObservers()
        onDismissed(this)
    }

    private fun moreView(): TextView = TextView(context).apply {
        text = MORE_GLYPH
        contentDescription = labels.more
        gravity = Gravity.CENTER
        textSize = MORE_TEXT_SIZE_SP
        setTextColor(foregroundColor)
        isClickable = true
        isFocusable = true
        importantForAccessibility = View.IMPORTANT_FOR_ACCESSIBILITY_YES
        minWidth = dp(MIN_TOUCH_TARGET_DP)
        minHeight = dp(MIN_TOUCH_TARGET_DP)
        background = itemBackground()
        layoutParams = LinearLayout.LayoutParams(
            dp(MIN_TOUCH_TARGET_DP),
            ViewGroup.LayoutParams.WRAP_CONTENT,
        )
        setOnClickListener {
            showingOverflow = true
            this@AceSelectionToolbar.invalidate()
        }
    }

    private fun calculatePosition(popupWidth: Int, popupHeight: Int): Pair<Int, Int> {
        val anchorLocation = IntArray(2)
        val rootLocation = IntArray(2)
        anchor.getLocationOnScreen(anchorLocation)
        anchor.rootView.getLocationOnScreen(rootLocation)

        val visibleFrame = Rect()
        anchor.getWindowVisibleDisplayFrame(visibleFrame)
        val margin = dp(SCREEN_MARGIN_DP)
        val gap = dp(ANCHOR_GAP_DP)
        val minScreenX = visibleFrame.left + margin
        val maxScreenX = (visibleFrame.right - margin - popupWidth).coerceAtLeast(minScreenX)
        val desiredScreenX = anchorLocation[0] + contentRect.centerX() - popupWidth / 2
        val screenX = desiredScreenX.coerceIn(minScreenX, maxScreenX)

        val aboveScreenY = anchorLocation[1] + contentRect.top - popupHeight - gap
        val belowScreenY = anchorLocation[1] + contentRect.bottom + gap
        val maxScreenY = (visibleFrame.bottom - margin - popupHeight)
            .coerceAtLeast(visibleFrame.top + margin)
        val screenY = when {
            aboveScreenY >= visibleFrame.top + margin -> aboveScreenY
            belowScreenY <= maxScreenY -> belowScreenY
            else -> aboveScreenY.coerceIn(visibleFrame.top + margin, maxScreenY)
        }
        return (screenX - rootLocation[0]).coerceAtLeast(0) to
            (screenY - rootLocation[1]).coerceAtLeast(0)
    }

    private fun maxWidthMeasureSpec(): Int {
        return View.MeasureSpec.makeMeasureSpec(availableWidthPx(), View.MeasureSpec.AT_MOST)
    }

    private fun availableWidthPx(): Int {
        val visibleFrame = Rect()
        anchor.getWindowVisibleDisplayFrame(visibleFrame)
        val frameWidth = visibleFrame.width().takeIf { it > 0 }
            ?: anchor.rootView.width.takeIf { it > 0 }
            ?: context.resources.displayMetrics.widthPixels
        return (frameWidth - dp(SCREEN_MARGIN_DP) * 2)
            .coerceAtLeast(dp(MIN_TOUCH_TARGET_DP))
    }

    private fun toolbarBackground() = GradientDrawable().apply {
        shape = GradientDrawable.RECTANGLE
        cornerRadius = dp(CORNER_RADIUS_DP).toFloat()
        setColor(backgroundColor)
        setStroke(dp(BORDER_WIDTH_DP).coerceAtLeast(1), withAlpha(foregroundColor, BORDER_ALPHA))
    }

    private fun itemBackground() = RippleDrawable(
        ColorStateList.valueOf(withAlpha(foregroundColor, PRESSED_ALPHA)),
        ColorDrawable(Color.TRANSPARENT),
        null,
    )

    private fun withAlpha(color: Int, alphaFraction: Float): Int =
        Color.argb(
            (255f * alphaFraction).roundToInt().coerceIn(0, 255),
            Color.red(color),
            Color.green(color),
            Color.blue(color),
        )

    private fun dp(value: Float): Int = (value * density).roundToInt()

    companion object {
        private const val ACTION_TEXT_SIZE_SP = 14f
        private const val MORE_TEXT_SIZE_SP = 24f
        private const val MORE_GLYPH = "\u22EE"
        private const val MIN_TOUCH_TARGET_DP = 48f
        private const val MAIN_HORIZONTAL_PADDING_DP = 12f
        private const val OVERFLOW_HORIZONTAL_PADDING_DP = 18f
        private const val MAIN_ITEM_MAX_WIDTH_DP = 112f
        private const val OVERFLOW_ITEM_MAX_WIDTH_DP = 240f
        private const val OVERFLOW_WIDTH_DP = 184f
        private const val TOOLBAR_ELEVATION_DP = 8f
        private const val CORNER_RADIUS_DP = 8f
        private const val BORDER_WIDTH_DP = 0.5f
        private const val SCREEN_MARGIN_DP = 8f
        private const val ANCHOR_GAP_DP = 8f
        private const val ENABLED_ALPHA = 1f
        private const val DISABLED_ALPHA = 0.38f
        private const val PRESSED_ALPHA = 0.14f
        private const val BORDER_ALPHA = 0.18f
    }
}
