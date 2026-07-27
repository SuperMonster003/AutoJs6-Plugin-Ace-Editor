package io.github.supermonster003.autojs6.plugin.ace.editor

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.os.Bundle
import android.view.View
import io.github.supermonster003.autojs6.plugin.ace.editor.core.AceCodeEditor
import io.github.supermonster003.autojs6.plugin.ace.editor.core.AceEditorFontPreferences
import io.github.supermonster003.autojs6.plugin.ace.editor.core.defaultHostPreferences
import io.github.supermonster003.autojs6.plugin.ace.editor.core.diagnostics.AceDiagnosticsSnapshot
import io.github.supermonster003.autojs6.plugin.ace.editor.core.health.AceFailure
import org.autojs.plugin.editor.api.EditorPluginBooleanCallback
import org.autojs.plugin.editor.api.EditorPluginBreakpoint
import org.autojs.plugin.editor.api.EditorPluginCallback
import org.autojs.plugin.editor.api.EditorPluginCursor
import org.autojs.plugin.editor.api.EditorPluginDiagnostics
import org.autojs.plugin.editor.api.EditorPluginFailure
import org.autojs.plugin.editor.api.EditorPluginFailureType
import org.autojs.plugin.editor.api.EditorPluginHealthState
import org.autojs.plugin.editor.api.EditorPluginHistoryDirection
import org.autojs.plugin.editor.api.EditorPluginSearchOptions
import org.autojs.plugin.editor.api.EditorPluginSearchResult
import org.autojs.plugin.editor.api.EditorPluginSearchSyntaxException
import org.autojs.plugin.editor.api.EditorPluginSelection
import org.autojs.plugin.editor.api.EditorPluginSelectionAction
import org.autojs.plugin.editor.api.EditorPluginSession
import org.autojs.plugin.editor.api.EditorPluginSessionConfig
import org.autojs.plugin.editor.api.EditorPluginSnapshot
import org.autojs.plugin.editor.api.EditorPluginState
import org.autojs.plugin.editor.api.EditorPluginTextCallback
import org.autojs.plugin.editor.api.EditorPluginTheme
import java.io.File
import java.util.regex.Matcher
import java.util.regex.Pattern
import java.util.regex.PatternSyntaxException

class AceEditorPluginSession internal constructor(
    private val hostContext: Context,
    pluginContext: Context,
    config: EditorPluginSessionConfig,
    private val callback: EditorPluginCallback,
) : EditorPluginSession {

    private val hostPreferences = hostContext.defaultHostPreferences()
    private val editor = AceCodeEditor(
        hostContext = hostContext,
        pluginContext = pluginContext,
        fontStorageDirectory = File(config.storageDirectoryPath),
        hostVersionCode = config.hostVersionCode,
    )
    private var readOnly = false
    private var redoUndoEnabled = true
    private var loadingText = false
    private var debuggingLine = -1
    private var fontSizeSp = DEFAULT_TEXT_SIZE_SP
    private var editorFontId = AceEditorFontPreferences.getId(hostPreferences)
    private var themeId: String? = null
    private var searchQuery: String? = null
    private var searchOptions: EditorPluginSearchOptions? = null
    private var replacementText = ""
    private var foundIndex = -1
    private var foundLength = 0
    private var destroyed = false

    init {
        editor.listener = createEditorListener()
        editor.onUserTouchInTextArea = callback::onUserTouchInTextArea
        editor.onTextSizeSpChangedByGesture = { size, persist ->
            fontSizeSp = size.coerceIn(MIN_TEXT_SIZE_SP, MAX_TEXT_SIZE_SP)
            callback.onTextSizeSpChangedByGesture(fontSizeSp, persist)
        }
        editor.setTextSizeSp(fontSizeSp)
        editor.setAceEditorFont(editorFontId)
        editor.setDocumentPath(config.documentPath)
    }

    override val view: View
        get() = editor

    override val inputView: View
        get() = editor.webView

    override val isReady: Boolean
        get() = editor.isReady

    override val currentState: EditorPluginState
        get() = createCurrentState()

    override val textSnapshot: String
        get() = editor.textSnapshot

    override val isTextChanged: Boolean
        get() = editor.dirty

    override val canUndo: Boolean
        get() = !readOnly && redoUndoEnabled && editor.canUndo

    override val canRedo: Boolean
        get() = !readOnly && redoUndoEnabled && editor.canRedo

    override val lineCountSnapshot: Int
        get() = editor.lineCountSnapshot

    override val selection: EditorPluginSelection
        get() = editor.selectionSnapshot.toPluginSelection()

    override val selectedTextSnapshot: String
        get() = editor.selectedTextSnapshot

    override val breakpointsSnapshot: List<EditorPluginBreakpoint>
        get() = editor.breakpointsSnapshot.map { line -> EditorPluginBreakpoint(line = line) }

    override val foundIndexSnapshot: Int
        get() = foundIndex

    override val isUserTouching: Boolean
        get() = editor.isUserTouching()

    override val isLoadingText: Boolean
        get() = loadingText

    override val isReadOnly: Boolean
        get() = readOnly

    override val completionPopupOpen: Boolean
        get() = editor.completionPopupOpen

    override var text: String
        get() = textSnapshot
        set(value) {
            resetSearchState()
            editor.setText(value)
        }

    override fun setInitialText(text: String?) {
        this.text = text.orEmpty()
        editor.markClean()
    }

    override fun getTextForSaving(callback: EditorPluginTextCallback) {
        editor.getText(callback::onText)
    }

    override fun markTextAsSaved() = editor.markClean()

    override fun markTextAsChanged() = editor.markDirty()

    override fun refreshState() = editor.refreshState()

    override fun replaceAllTextUndoably(
        text: String,
        token: String,
        onComplete: EditorPluginBooleanCallback?,
    ) {
        if (!canMutateText()) {
            onComplete?.onComplete(false)
            return
        }
        editor.replaceAllTextUndoably(text, token, onComplete?.let { result -> result::onComplete })
    }

    override fun addUndoableHistoryMarker(token: String, onComplete: EditorPluginBooleanCallback?) {
        editor.addUndoableHistoryMarker(token, onComplete?.let { result -> result::onComplete })
    }

    override fun insert(text: String?) {
        if (canMutateText()) editor.insert(text.orEmpty())
    }

    override fun insertAtLine(line: Int, text: String?) {
        if (canMutateText()) editor.insert(line, text.orEmpty())
    }

    override fun insertShortcutText(text: String?) {
        if (canMutateText()) editor.insertShortcutText(text.orEmpty())
    }

    override fun insertTab() {
        if (canMutateText()) editor.insertTab()
    }

    override fun acceptCompletionOrInsertTab() {
        if (canMutateText()) editor.acceptCompletionOrInsertTab()
    }

    override fun moveCompletionSelectionOrCursor(delta: Int) = editor.moveCompletionSelectionOrCursor(delta)

    override fun handleEscapeKey() = editor.handleEscapeKey()

    override fun copyLine() {
        val clipboard = hostContext.getSystemService(Context.CLIPBOARD_SERVICE) as? ClipboardManager ?: return
        clipboard.setPrimaryClip(ClipData.newPlainText(null, editor.cursorLineText))
    }

    override fun deleteLine() {
        if (canMutateText()) editor.deleteLine()
    }

    override fun clear() {
        if (!canMutateText()) return
        editor.clear()
        resetSearchState()
    }

    override fun toggleComment() {
        if (canMutateText()) editor.toggleComment()
    }

    override fun beautifyCode() {
        if (canMutateText()) editor.beautify()
    }

    override fun undo() {
        if (redoUndoEnabled && canMutateText()) editor.undo()
    }

    override fun redo() {
        if (redoUndoEnabled && canMutateText()) editor.redo()
    }

    override fun setRedoUndoEnabled(enabled: Boolean) {
        redoUndoEnabled = enabled
    }

    override fun markUndoRedoBaselineAsUnchanged() = editor.markClean()

    override fun jumpTo(line: Int, column: Int) = editor.jumpTo(line, column)

    override fun jumpToStart() = editor.jumpToStart()

    override fun jumpToEnd() = editor.jumpToEnd()

    override fun jumpToLineStart() = editor.jumpToLineStart()

    override fun jumpToLineEnd() = editor.jumpToLineEnd()

    override fun jumpToNextLine() = editor.jumpToNextLine()

    override fun jumpToPrevLine() = editor.jumpToPrevLine()

    override fun moveCursor(deltaChars: Int) = editor.moveCursor(deltaChars)

    override fun selectRange(startOffset: Int, endOffset: Int) = editor.selectRange(startOffset, endOffset)

    override fun selectAll() = selectRange(0, textSnapshot.length)

    override fun find(query: String, options: EditorPluginSearchOptions): EditorPluginSearchResult {
        searchQuery = query
        searchOptions = options
        return findFrom(query, options, selection.endOffset, backwards = false)
    }

    override fun findNext(): EditorPluginSearchResult {
        val query = searchQuery ?: return EditorPluginSearchResult(found = false)
        val options = searchOptions ?: EditorPluginSearchOptions()
        val start = if (foundIndex >= 0) {
            (foundIndex + foundLength.coerceAtLeast(1)).coerceAtMost(textSnapshot.length)
        } else {
            selection.endOffset.coerceIn(0, textSnapshot.length)
        }
        return runCatching { findFrom(query, options, start, backwards = false) }
            .getOrElse { EditorPluginSearchResult(found = false, query = query) }
    }

    override fun findPrev(): EditorPluginSearchResult {
        val query = searchQuery ?: return EditorPluginSearchResult(found = false)
        val options = searchOptions ?: EditorPluginSearchOptions()
        val start = if (foundIndex >= 0) foundIndex else selection.startOffset
        return runCatching { findFrom(query, options, start, backwards = true) }
            .getOrElse { EditorPluginSearchResult(found = false, query = query) }
    }

    override fun replace(
        query: String,
        replacement: String,
        options: EditorPluginSearchOptions,
    ): EditorPluginSearchResult {
        replacementText = replacement
        editor.setReplacement(replacement)
        return find(query, options)
    }

    override fun replaceSelection(): EditorPluginSearchResult {
        if (!canMutateText()) {
            return EditorPluginSearchResult(false, foundIndex, searchQuery)
        }
        val current = selection
        if (!current.isCollapsed) {
            foundIndex = current.startOffset
            foundLength = replacementText.length
            editor.replaceStoredSelection()
            editor.selectRange(foundIndex, foundIndex + foundLength)
        }
        return EditorPluginSearchResult(foundIndex >= 0, foundIndex, searchQuery)
    }

    override fun replaceAll(
        query: String,
        replacement: String?,
        options: EditorPluginSearchOptions,
    ): EditorPluginSearchResult {
        if (!canMutateText()) return EditorPluginSearchResult(false, foundIndex, query)
        validatePatternIfNeeded(query, options)
        val next = replaceAllInText(textSnapshot, query, replacement.orEmpty(), options)
        val changed = next != textSnapshot
        if (changed) {
            editor.setTextDirty(next)
            foundIndex = -1
            foundLength = 0
        }
        return EditorPluginSearchResult(changed, foundIndex, query)
    }

    override fun resetSearchState() {
        searchQuery = null
        searchOptions = null
        replacementText = ""
        foundIndex = -1
        foundLength = 0
    }

    override fun resetFoundIndexForFindNextFromCursor() {
        foundIndex = (selection.endOffset - 1).coerceAtLeast(-1)
        foundLength = 0
    }

    override fun resetFoundIndexForFindPrevFromCursor() {
        foundIndex = selection.startOffset.coerceIn(0, textSnapshot.length)
        foundLength = 0
    }

    override fun setReadOnly(readOnly: Boolean) {
        this.readOnly = readOnly
        editor.setReadOnly(readOnly)
    }

    override fun setDebuggingLine(line: Int) {
        debuggingLine = line
        editor.setDebuggingLine(line)
    }

    override fun setBreakpoint(line: Int, enabled: Boolean) = editor.setBreakpoint(line, enabled)

    override fun addOrRemoveBreakpointAtCurrentLine() = editor.addOrRemoveBreakpointAtCurrentLine()

    override fun removeAllBreakpoints() = editor.removeAllBreakpoints()

    override fun setTheme(theme: EditorPluginTheme) {
        themeId = theme.id
        editor.setTheme(
            theme = theme.aceTheme ?: if (theme.isDark) DARK_THEME else LIGHT_THEME,
            isDark = theme.isDark,
            backgroundColor = theme.backgroundColor,
            foregroundColor = theme.foregroundColor,
        )
    }

    override fun setTextSizeSp(size: Float) {
        fontSizeSp = size.coerceIn(MIN_TEXT_SIZE_SP, MAX_TEXT_SIZE_SP)
        editor.setTextSizeSp(fontSizeSp)
    }

    override fun getTextSizeSp(): Float = fontSizeSp

    override fun setEditorFont(fontId: String) {
        editorFontId = fontId
        editor.setAceEditorFont(fontId)
    }

    override fun notifyPinchToZoomStrategyChanged(newKey: String?) =
        editor.notifyPinchToZoomStrategyChanged(newKey)

    override fun notifyDisplayPreferencesChanged() = editor.notifyDisplayPreferencesChanged()

    override fun setDocumentPath(path: String?) = editor.setDocumentPath(path)

    override fun refreshLsp() = editor.refreshLsp()

    override fun requestEditorFocus() = editor.requestEditorFocus()

    override fun ensureCursorVisible() = editor.ensureCursorVisible()

    override fun onImeInsetsChanged(visible: Boolean, bottomInset: Int) =
        editor.onHostImeInsetsChanged(visible, bottomInset)

    override fun refreshHighlightTokensIfAllowed() = Unit

    override fun setProgress(progress: Boolean, interactive: Boolean) = Unit

    override fun beginLargeTextLoading() {
        loadingText = true
        redoUndoEnabled = false
        text = ""
    }

    override fun appendTextChunk(chunk: CharSequence) = editor.appendTextChunk(chunk.toString())

    override fun endLargeTextLoading(markClean: Boolean) {
        loadingText = false
        redoUndoEnabled = true
        if (markClean) editor.markClean()
    }

    override fun cancelLargeTextLoading() {
        loadingText = false
        redoUndoEnabled = true
    }

    override fun setLoadingText(loading: Boolean) {
        loadingText = loading
    }

    override fun createStateSnapshot(): EditorPluginSnapshot = EditorPluginSnapshot(
        text = textSnapshot,
        dirty = isTextChanged,
        cursorLine = selection.startLine,
        cursorColumn = selection.startColumn,
        selection = selection,
        firstVisibleLine = editor.firstVisibleLine,
        firstVisibleColumn = editor.firstVisibleColumn,
        breakpoints = breakpointsSnapshot,
        debuggingLine = debuggingLine,
        readOnly = readOnly,
        fontSizeSp = fontSizeSp,
        themeId = themeId,
        searchQuery = searchQuery,
        searchOptions = searchOptions,
    )

    override fun restoreStateSnapshot(snapshot: EditorPluginSnapshot) {
        if (snapshot.dirty) editor.setTextDirty(snapshot.text) else setInitialText(snapshot.text)
        setReadOnly(snapshot.readOnly)
        setTextSizeSp(snapshot.fontSizeSp)
        setDebuggingLine(snapshot.debuggingLine)
        removeAllBreakpoints()
        snapshot.breakpoints.forEach { setBreakpoint(it.line, it.enabled) }
        snapshot.selection?.let { selectRange(it.startOffset, it.endOffset) }
            ?: jumpTo(snapshot.cursorLine, snapshot.cursorColumn)
        editor.restoreScroll(snapshot.firstVisibleLine, snapshot.firstVisibleColumn)
        themeId = snapshot.themeId
        searchQuery = snapshot.searchQuery
        searchOptions = snapshot.searchOptions
    }

    override fun createDiagnosticsSnapshot(
        fileSizeBytes: Long?,
        largeFilePolicy: String,
    ): EditorPluginDiagnostics = EditorPluginDiagnostics(
        editor.createDiagnosticsSnapshot(fileSizeBytes, largeFilePolicy).toBundle(),
    )

    override fun destroy() {
        if (destroyed) return
        destroyed = true
        editor.listener = null
        editor.onUserTouchInTextArea = null
        editor.onTextSizeSpChangedByGesture = null
        editor.destroy()
    }

    private fun createEditorListener() = object : AceCodeEditor.Listener {
        override fun onReady(state: AceCodeEditor.AceEditorState) = callback.onReady(state.toPluginState())

        override fun onStateChanged(state: AceCodeEditor.AceEditorState) =
            callback.onStateChanged(state.toPluginState())

        override fun onTextChanged(text: String, state: AceCodeEditor.AceEditorState) =
            callback.onTextChanged(text, state.toPluginState())

        override fun onCursorChanged(
            lineText: String,
            line: Int,
            column: Int,
            state: AceCodeEditor.AceEditorState,
        ) = callback.onCursorChanged(lineText, line, column, state.toPluginState())

        override fun onBreakpointChanged(
            line: Int,
            enabled: Boolean,
            state: AceCodeEditor.AceEditorState,
        ) = callback.onBreakpointChanged(line, enabled, state.toPluginState())

        override fun onHistoryOperation(token: String, undo: Boolean) = callback.onHistoryOperation(
            token,
            if (undo) EditorPluginHistoryDirection.UNDO else EditorPluginHistoryDirection.REDO,
        )

        override fun onSelectionAction(action: AceCodeEditor.SelectionAction) = callback.onSelectionAction(
            when (action) {
                AceCodeEditor.SelectionAction.Copy -> EditorPluginSelectionAction.COPY
                AceCodeEditor.SelectionAction.Paste -> EditorPluginSelectionAction.PASTE
                AceCodeEditor.SelectionAction.SelectAll -> EditorPluginSelectionAction.SELECT_ALL
                AceCodeEditor.SelectionAction.DeleteLine -> EditorPluginSelectionAction.DELETE_LINE
                AceCodeEditor.SelectionAction.CopyLine -> EditorPluginSelectionAction.COPY_LINE
            },
        )

        override fun onEvent(name: String, payloadJson: String?) = callback.onEvent(
            name,
            Bundle().apply { payloadJson?.let { putString("json", it) } },
        )

        override fun onError(message: String) = callback.onError(message)

        override fun onFailure(failure: AceFailure) = callback.onFailure(failure.toPluginFailure())
    }

    private fun createCurrentState(): EditorPluginState = EditorPluginState(
        text = textSnapshot,
        dirty = isTextChanged,
        canUndo = canUndo,
        canRedo = canRedo,
        lineCount = lineCountSnapshot,
        cursor = EditorPluginCursor(editor.cursorLine, editor.cursorColumn, editor.cursorLineText),
        selection = selection,
        selectedText = selectedTextSnapshot,
        completionPopupOpen = completionPopupOpen,
        breakpoints = editor.breakpointsSnapshot,
        firstVisibleLine = editor.firstVisibleLine,
        firstVisibleColumn = editor.firstVisibleColumn,
    )

    private fun AceCodeEditor.AceEditorState.toPluginState() = EditorPluginState(
        text = text,
        dirty = dirty,
        canUndo = !readOnly && redoUndoEnabled && canUndo,
        canRedo = !readOnly && redoUndoEnabled && canRedo,
        lineCount = lineCount,
        cursor = EditorPluginCursor(cursor.line, cursor.column, cursor.lineText),
        selection = selection.toPluginSelection(),
        selectedText = selectedText,
        completionPopupOpen = completionPopupOpen,
        breakpoints = breakpoints,
        firstVisibleLine = firstVisibleLine,
        firstVisibleColumn = firstVisibleColumn,
        textIncluded = textIncluded,
    )

    private fun AceCodeEditor.AceSelection.toPluginSelection() = EditorPluginSelection(
        startOffset,
        endOffset,
        startLine,
        startColumn,
        endLine,
        endColumn,
    )

    private fun AceFailure.toPluginFailure() = EditorPluginFailure(
        type = runCatching { EditorPluginFailureType.valueOf(type.name) }
            .getOrDefault(EditorPluginFailureType.UNKNOWN),
        message = message,
        detail = detail,
        state = state?.let { runCatching { EditorPluginHealthState.valueOf(it.name) }.getOrNull() },
        fatal = fatal,
        timestampUptimeMillis = timestampUptimeMillis,
    )

    private fun canMutateText(): Boolean = !readOnly || loadingText

    private fun findFrom(
        query: String,
        options: EditorPluginSearchOptions,
        start: Int,
        backwards: Boolean,
    ): EditorPluginSearchResult {
        validatePatternIfNeeded(query, options)
        val match = findMatch(textSnapshot, query, options, start, backwards)
        return if (match == null) {
            foundIndex = -1
            foundLength = 0
            EditorPluginSearchResult(false, -1, query)
        } else {
            foundIndex = match.start
            foundLength = match.end - match.start
            selectRange(match.start, match.end)
            EditorPluginSearchResult(true, foundIndex, query)
        }
    }

    private fun validatePatternIfNeeded(query: String, options: EditorPluginSearchOptions) {
        if (!options.usingRegex) return
        try {
            Pattern.compile(query, options.regexFlags())
        } catch (error: PatternSyntaxException) {
            throw EditorPluginSearchSyntaxException(error.message.orEmpty(), error)
        }
    }

    private fun findMatch(
        text: String,
        query: String,
        options: EditorPluginSearchOptions,
        start: Int,
        backwards: Boolean,
    ): Match? {
        if (query.isEmpty()) return null
        return if (options.usingRegex) {
            findRegexMatch(text, query, options, start, backwards)
        } else {
            findPlainMatch(text, query, options, start, backwards)
        }
    }

    private fun findPlainMatch(
        text: String,
        query: String,
        options: EditorPluginSearchOptions,
        start: Int,
        backwards: Boolean,
    ): Match? {
        val safeStart = start.coerceIn(0, text.length)
        if (!backwards) {
            return findPlainForward(text, query, options, safeStart)
                ?: findPlainForward(text, query, options, 0)
        }
        return findPlainBackward(text, query, options, safeStart)
            ?: findPlainBackward(text, query, options, text.length)
    }

    private fun findPlainForward(
        text: String,
        query: String,
        options: EditorPluginSearchOptions,
        start: Int,
    ): Match? {
        var index = text.indexOf(query, start, ignoreCase = !options.caseSensitive)
        while (index >= 0) {
            val end = index + query.length
            if (!options.wholeWord || text.isWholeWordRange(index, end)) return Match(index, end)
            index = text.indexOf(query, end.coerceAtMost(text.length), ignoreCase = !options.caseSensitive)
        }
        return null
    }

    private fun findPlainBackward(
        text: String,
        query: String,
        options: EditorPluginSearchOptions,
        start: Int,
    ): Match? = findPlainBackwardRange(
        text = text,
        query = query,
        start = start,
        caseSensitive = options.caseSensitive,
        wholeWord = options.wholeWord,
    )?.let { range -> Match(range.first, range.last + 1) }

    private fun findRegexMatch(
        text: String,
        query: String,
        options: EditorPluginSearchOptions,
        start: Int,
        backwards: Boolean,
    ): Match? {
        val pattern = Pattern.compile(query, options.regexFlags())
        val safeStart = start.coerceIn(0, text.length)
        val matcher = pattern.matcher(text)
        var first: Match? = null
        var previous: Match? = null
        var last: Match? = null
        while (matcher.find()) {
            val match = Match(matcher.start(), matcher.end())
            if (options.wholeWord && !text.isWholeWordRange(match.start, match.end)) continue
            if (first == null) first = match
            last = match
            if (!backwards && match.start >= safeStart) return match
            if (backwards && match.end <= safeStart) previous = match
        }
        return if (backwards) previous ?: last else first
    }

    private fun replaceAllInText(
        text: String,
        query: String,
        replacement: String,
        options: EditorPluginSearchOptions,
    ): String {
        if (query.isEmpty()) return text
        if (options.usingRegex) {
            try {
                val matcher = Pattern.compile(query, options.regexFlags()).matcher(text)
                if (!options.wholeWord) return matcher.replaceAll(replacement)
                val output = StringBuffer(text.length)
                while (matcher.find()) {
                    if (text.isWholeWordRange(matcher.start(), matcher.end())) {
                        matcher.appendReplacement(output, replacement)
                    }
                }
                matcher.appendTail(output)
                return output.toString()
            } catch (error: PatternSyntaxException) {
                throw EditorPluginSearchSyntaxException(error.message.orEmpty(), error)
            }
        }
        if (!options.wholeWord) return text.replace(query, replacement, ignoreCase = !options.caseSensitive)
        val pattern = Pattern.compile(
            "(?<![\\p{L}\\p{N}_])${Pattern.quote(query)}(?![\\p{L}\\p{N}_])",
            options.regexFlags(),
        )
        return pattern.matcher(text).replaceAll(Matcher.quoteReplacement(replacement))
    }

    private fun EditorPluginSearchOptions.regexFlags(): Int =
        if (caseSensitive) 0 else Pattern.CASE_INSENSITIVE or Pattern.UNICODE_CASE

    private fun String.isWholeWordRange(start: Int, end: Int): Boolean {
        val beforeOk = start <= 0 || !this[start - 1].isWordPart()
        val afterOk = end >= length || !this[end].isWordPart()
        return beforeOk && afterOk
    }

    private fun Char.isWordPart(): Boolean = isLetterOrDigit() || this == '_'

    private data class Match(val start: Int, val end: Int)

    private companion object {
        const val DEFAULT_TEXT_SIZE_SP = 14f
        const val MIN_TEXT_SIZE_SP = 1f
        const val MAX_TEXT_SIZE_SP = 96f
        const val DARK_THEME = "ace/theme/tomorrow_night"
        const val LIGHT_THEME = "ace/theme/textmate"
    }
}

private fun AceDiagnosticsSnapshot.toBundle(): Bundle = Bundle().apply {
    putString("engineType", engineType)
    putString("aceHealthState", aceHealthState)
    putString("lastFailureType", lastFailureType)
    putString("lastFailureMessage", lastFailureMessage)
    putBooleanOrNull("lastFailureFatal", lastFailureFatal)
    putString("assetUrl", assetUrl)
    putString("webViewVersion", webViewVersion)
    putString("androidVersion", androidVersion)
    putBoolean("lspEnabled", lspEnabled)
    putString("lspState", lspState)
    putString("lspTransport", lspTransport)
    putString("lspServerUri", lspServerUri)
    putString("lspRootUri", lspRootUri)
    putString("lspDocumentUri", lspDocumentUri)
    putString("lspFallback", lspFallback)
    putString("lspCompletionProvider", lspCompletionProvider)
    putString("lspHoverProvider", lspHoverProvider)
    putString("lspDiagnosticProvider", lspDiagnosticProvider)
    putString("lspSignatureProvider", lspSignatureProvider)
    putBoolean("lspServerAvailable", lspServerAvailable)
    putBoolean("lspStartSupported", lspStartSupported)
    putLong("lspSessionRevision", lspSessionRevision)
    putString("lspRuntimeState", lspRuntimeState)
    putString("aceFont", aceFont)
    putLongOrNull("fileSizeBytes", fileSizeBytes)
    putString("largeFilePolicy", largeFilePolicy)
    putLongOrNull("textMirrorRevision", textMirrorRevision)
    putString("jsRevision", jsRevision)
    putLongOrNull("lastReadyAtUptimeMillis", lastReadyAtUptimeMillis)
    putLongOrNull("lastFirstPaintAtUptimeMillis", lastFirstPaintAtUptimeMillis)
    putLongOrNull("lastStateAtUptimeMillis", lastStateAtUptimeMillis)
    putLongOrNull("lastHeartbeatAtUptimeMillis", lastHeartbeatAtUptimeMillis)
    putLongOrNull("lastHeartbeatSuspendedAtUptimeMillis", lastHeartbeatSuspendedAtUptimeMillis)
    putLongOrNull("lastHeartbeatResumedAtUptimeMillis", lastHeartbeatResumedAtUptimeMillis)
    putString("heartbeatSuspendedReason", heartbeatSuspendedReason)
    putString("lastImeState", lastImeState)
    putIntOrNull("lastImeHeight", lastImeHeight)
    putLongOrNull("lastImeRequestAtUptimeMillis", lastImeRequestAtUptimeMillis)
    putLongOrNull("lastShowSoftInputAtUptimeMillis", lastShowSoftInputAtUptimeMillis)
    putLongOrNull("lastHideSoftInputAtUptimeMillis", lastHideSoftInputAtUptimeMillis)
    putLongOrNull("lastImeTransitionStartedAtUptimeMillis", lastImeTransitionStartedAtUptimeMillis)
    putLongOrNull("lastImeTransitionEndedAtUptimeMillis", lastImeTransitionEndedAtUptimeMillis)
    putString("lastImeIgnoredRequestReason", lastImeIgnoredRequestReason)
    putLongOrNull("lastResizeAtUptimeMillis", lastResizeAtUptimeMillis)
    putString("pendingAceResizeReason", pendingAceResizeReason)
    putString("lastAceResizeScheduledReason", lastAceResizeScheduledReason)
    putLongOrNull("lastAceResizeScheduledAtUptimeMillis", lastAceResizeScheduledAtUptimeMillis)
    putString("lastAceResizeDispatchedReason", lastAceResizeDispatchedReason)
    putLongOrNull("lastAceResizeDispatchedAtUptimeMillis", lastAceResizeDispatchedAtUptimeMillis)
    putString("lastAceResizeCompletedReason", lastAceResizeCompletedReason)
    putLongOrNull("lastAceResizeCompletedAtUptimeMillis", lastAceResizeCompletedAtUptimeMillis)
    putLongOrNull("lastActionModeAtUptimeMillis", lastActionModeAtUptimeMillis)
    putString("viewportPolicy", viewportPolicy)
    putString("lastViewportPolicyEvent", lastViewportPolicyEvent)
    putLongOrNull("lastViewportPolicyEventAtUptimeMillis", lastViewportPolicyEventAtUptimeMillis)
    putBooleanOrNull("lastViewportPolicyImeVisible", lastViewportPolicyImeVisible)
    putIntOrNull("lastViewportPolicyBottomInset", lastViewportPolicyBottomInset)
    putBooleanOrNull("lastHostImeVisible", lastHostImeVisible)
    putIntOrNull("lastHostImeBottomInset", lastHostImeBottomInset)
    putLongOrNull("lastHostImeEventAtUptimeMillis", lastHostImeEventAtUptimeMillis)
    putString("lastBridgeEventName", lastBridgeEventName)
    putInt("currentBridgeEventWindowCount", currentBridgeEventWindowCount)
    putInt("lastBridgeEventWindowCount", lastBridgeEventWindowCount)
    putInt("maxBridgeEventWindowCount", maxBridgeEventWindowCount)
    putLongOrNull("maxBridgeEventWindowStartedAtUptimeMillis", maxBridgeEventWindowStartedAtUptimeMillis)
    putStringArrayList("runtimeEventHistory", ArrayList(runtimeEventHistory))
    putLong("createdAtEpochMillis", createdAtEpochMillis)
}

private fun Bundle.putLongOrNull(key: String, value: Long?) {
    value?.let { putLong(key, it) }
}

private fun Bundle.putIntOrNull(key: String, value: Int?) {
    value?.let { putInt(key, it) }
}

private fun Bundle.putBooleanOrNull(key: String, value: Boolean?) {
    value?.let { putBoolean(key, it) }
}

internal fun findPlainBackwardRange(
    text: String,
    query: String,
    start: Int,
    caseSensitive: Boolean,
    wholeWord: Boolean,
): IntRange? {
    if (query.isEmpty() || text.isEmpty() || start <= 0) return null
    var index = text.lastIndexOf(query, (start - 1).coerceAtMost(text.lastIndex), ignoreCase = !caseSensitive)
    while (index >= 0) {
        val end = index + query.length
        val beforeOk = index <= 0 || !text[index - 1].isLetterOrDigitOrUnderscore()
        val afterOk = end >= text.length || !text[end].isLetterOrDigitOrUnderscore()
        if (!wholeWord || beforeOk && afterOk) return index until end
        if (index == 0) return null
        index = text.lastIndexOf(query, index - 1, ignoreCase = !caseSensitive)
    }
    return null
}

private fun Char.isLetterOrDigitOrUnderscore(): Boolean = isLetterOrDigit() || this == '_'
