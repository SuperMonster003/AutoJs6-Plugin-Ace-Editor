package io.github.supermonster003.autojs6.plugin.ace.editor.core

import android.os.Bundle
import android.widget.Button
import android.widget.LinearLayout
import androidx.test.core.app.ActivityScenario
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import io.github.supermonster003.autojs6.plugin.ace.editor.AceEditorPluginEntrypoint
import org.autojs.plugin.editor.api.EditorPluginCallback
import org.autojs.plugin.editor.api.EditorPluginSession
import org.autojs.plugin.editor.api.EditorPluginSessionConfig
import org.autojs.plugin.editor.api.EditorPluginState
import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import java.io.File
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicReference

@RunWith(AndroidJUnit4::class)
class AceCodeFoldingSmokeTest {
    @Test
    fun wholeDocumentFoldingPreservesEditingStateAndWorksReadOnly() {
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        val ready = CountDownLatch(1)
        val firstPaint = CountDownLatch(1)
        val session = AtomicReference<EditorPluginSession>()
        val focusTarget = AtomicReference<Button>()
        val scenario = ActivityScenario.launch(AceEditorTestActivity::class.java)
        scenario.onActivity { activity ->
            session.set(
                AceEditorPluginEntrypoint().createSession(
                    hostContext = activity,
                    pluginContext = context,
                    config = EditorPluginSessionConfig(
                        hostPackageName = context.packageName,
                        hostVersionName = "instrumentation",
                        hostVersionCode = 5352L,
                        storageDirectoryPath = File(context.cacheDir, "ace-folding-smoke-fonts").absolutePath,
                        documentPath = "/storage/emulated/0/Scripts/folding.js",
                    ),
                    callback = object : EditorPluginCallback {
                        override fun onReady(state: EditorPluginState) = ready.countDown()

                        override fun onEvent(name: String, payload: Bundle?) {
                            if (name == "firstPaint") firstPaint.countDown()
                        }
                    },
                ),
            )
            activity.setContentView(LinearLayout(activity).apply {
                orientation = LinearLayout.VERTICAL
                focusTarget.set(Button(activity).apply {
                    text = "Focus outside the editor"
                    isFocusableInTouchMode = true
                })
                addView(focusTarget.get())
                addView(session.get().view, LinearLayout.LayoutParams(-1, 0, 1f))
            })
        }
        try {
            assertTrue("ACE folding session should become ready", ready.await(15, TimeUnit.SECONDS))
            val text = """
                function first(flag) {
                  if (flag) {
                    return 1;
                  }
                }

                function second() {
                  return 2;
                }
            """.trimIndent()
            scenario.onActivity {
                session.get().setInitialText(text)
                session.get().setReadOnly(true)
                // A real menu can be used as soon as the host receives ready, before Ace's
                // asynchronously loaded JavaScript mode has supplied its folding rules.
                session.get().foldAll()
            }
            val modeDeadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(10)
            var modeState = JSONObject()
            while (System.nanoTime() < modeDeadline) {
                modeState = evaluate(
                    scenario, session.get(),
                    """
                    (function() {
                        var session = editor.session;
                        return {
                            text: session.getValue(),
                            mode: session.getMode().${'$'}id,
                            foldRows: session.getAllFolds().map(function(fold) { return fold.start.row; }),
                            innerWidget: session.getFoldWidget && session.getFoldWidget(1),
                            innerRange: session.getFoldWidgetRange ? session.getFoldWidgetRange(1) : null
                        };
                    })()
                    """.trimIndent(),
                )
                if (modeState.optString("text") == text &&
                    modeState.optJSONArray("foldRows")?.toString() == "[0,6]") break
                Thread.sleep(50)
            }
            assertEquals("Document loading must complete: $modeState", text, modeState.optString("text"))
            assertFalse("JavaScript folding must be ready: $modeState", modeState.isNull("innerRange"))
            assertEquals("An early fold request must run when the mode loads: $modeState", "[0,6]", modeState.getJSONArray("foldRows").toString())
            scenario.onActivity { session.get().unfoldAll() }
            evaluate(
                scenario, session.get(),
                """
                (function() {
                    var session = editor.session;
                    // Reproduce the pending-mode interval with the real Ace mode lifecycle.
                    session.setMode("ace/mode/text");
                    AutoJsAce.foldAll();
                    AutoJsAce.unfoldAll();
                    session.setMode("ace/mode/javascript");
                    var afterCancel = session.getAllFolds().length;
                    session.setMode("ace/mode/text");
                    AutoJsAce.foldAll();
                    AutoJsAce.setDocumentPath("/storage/emulated/0/Scripts/cancelled.txt");
                    AutoJsAce.setDocumentPath("/storage/emulated/0/Scripts/folding.js");
                    return { afterCancel: afterCancel, afterDocumentSwitch: session.getAllFolds().length };
                })()
                """.trimIndent(),
            ).also {
                assertEquals("Unfold must cancel a queued fold", 0, it.getInt("afterCancel"))
                assertEquals("A queued fold must not follow a document switch", 0, it.getInt("afterDocumentSwitch"))
            }
            assertTrue("Initial presentation should finish", firstPaint.await(10, TimeUnit.SECONDS))
            // The existing first-paint handler requests focus and retries after 120 ms. Let
            // those startup requests finish before checking that folding itself never focuses.
            val startupFocusSettled = CountDownLatch(1)
            scenario.onActivity { session.get().view.postDelayed({ startupFocusSettled.countDown() }, 250) }
            assertTrue(startupFocusSettled.await(5, TimeUnit.SECONDS))
            evaluate(
                scenario, session.get(),
                """
                (function() {
                    var editor = window.editor;
                    var session = editor.session;
                    var Range = ace.require("ace/range").Range;
                    session.foldAll(1, 4);
                    var foldsBeforeSelection = session.getAllFolds().length;
                    editor.selection.setRange(new Range(1, 2, 1, 3), true);
                    editor.blur();
                    return {
                        foldsBeforeSelection: foldsBeforeSelection,
                        folds: session.getAllFolds().length,
                        mode: session.getMode().${'$'}id,
                        innerWidget: session.getFoldWidget(1),
                        innerRange: session.getFoldWidgetRange(1)
                    };
                })()
                """.trimIndent(),
            ).also { assertEquals("Fixture must contain an inner fold: $it", 1, it.getInt("folds")) }
            scenario.onActivity { focusTarget.get().requestFocus() }
            evaluate(scenario, session.get(), "(function() { editor.blur(); return {}; })()")
            val baseline = state(scenario, session.get())
            assertTrue(baseline.getBoolean("readOnly"))
            assertFalse(baseline.getBoolean("focused"))
            assertFalse(baseline.getBoolean("dirty"))

            // The selection lies entirely inside the first function. Both top-level functions
            // must still fold. Ace may represent children lazily through collapseChildren.
            scenario.onActivity { session.get().foldAll() }
            val folded = state(scenario, session.get())
            assertEquals("[0,6]", folded.getJSONArray("foldRows").toString())
            assertEditingStateUnchanged(baseline, folded)
            scenario.onActivity { session.get().foldAll() }
            assertEquals("Repeated folding must be idempotent", "[0,6]", state(scenario, session.get()).getJSONArray("foldRows").toString())

            // A manual child under an existing outer fold exercises stored subFolds too.
            // Ace's normal foldAll uses collapseChildren instead of storing these children.
            evaluate(
                scenario, session.get(),
                "(function() { editor.session.addFold('...', editor.session.getFoldWidgetRange(1)); return {}; })()",
            )
            assertTrue("Fixture must exercise stored nested folds", state(scenario, session.get()).getInt("nestedFolds") > 0)

            scenario.onActivity { session.get().unfoldAll() }
            val unfolded = state(scenario, session.get())
            assertEquals("All nested folds must disappear in one operation", 0, unfolded.getJSONArray("foldRows").length())
            assertEditingStateUnchanged(baseline, unfolded)

            // Check a collapsed cursor and a document with undo history as well as read-only
            // selected text. Folding must never mark a clean file dirty or consume history.
            scenario.onActivity { session.get().setReadOnly(false) }
            evaluate(scenario, session.get(), "(function() { editor.selection.moveTo(8, 1); editor.insert(' '); editor.blur(); return {}; })()")
            val dirtyBaseline = state(scenario, session.get())
            assertTrue(dirtyBaseline.getBoolean("dirty"))
            assertTrue(dirtyBaseline.getBoolean("canUndo"))
            scenario.onActivity { session.get().foldAll() }
            assertEquals(2, state(scenario, session.get()).getJSONArray("foldRows").length())
            scenario.onActivity { session.get().unfoldAll() }
            assertEditingStateUnchanged(dirtyBaseline, state(scenario, session.get()))

            for (plainText in listOf("", "const answer = 42;")) {
                scenario.onActivity { session.get().setInitialText(plainText) }
                val plainBaseline = state(scenario, session.get())
                scenario.onActivity {
                    session.get().foldAll()
                    session.get().unfoldAll()
                    session.get().unfoldAll()
                }
                val plainResult = state(scenario, session.get())
                assertEquals(0, plainResult.getJSONArray("foldRows").length())
                assertEditingStateUnchanged(plainBaseline, plainResult)
            }
        } finally {
            scenario.onActivity { session.getAndSet(null)?.destroy() }
            scenario.close()
        }
    }

    private fun assertEditingStateUnchanged(expected: JSONObject, actual: JSONObject) {
        for (key in listOf("text", "dirty", "canUndo", "canRedo", "selection", "backwards", "focused", "readOnly")) {
            assertEquals("Folding must preserve $key", expected.get(key).toString(), actual.get(key).toString())
        }
    }

    private fun state(scenario: ActivityScenario<AceEditorTestActivity>, session: EditorPluginSession): JSONObject =
        evaluate(
            scenario, session,
            """
            (function() {
                var editor = window.editor;
                var session = editor.session;
                var folds = session.getAllFolds();
                var history = session.getUndoManager();
                return {
                    text: session.getValue(),
                    dirty: !history.isClean(),
                    canUndo: history.hasUndo(),
                    canRedo: history.hasRedo(),
                    selection: JSON.stringify(editor.getSelectionRange()),
                    backwards: !editor.selection.isEmpty() && editor.selection.isBackwards(),
                    focused: editor.isFocused(),
                    readOnly: editor.getReadOnly(),
                    foldRows: folds.map(function(fold) { return fold.start.row; }),
                    nestedFolds: folds.reduce(function(count, fold) { return count + fold.subFolds.length; }, 0)
                };
            })()
            """.trimIndent(),
        )

    private fun evaluate(
        scenario: ActivityScenario<AceEditorTestActivity>,
        session: EditorPluginSession,
        script: String,
    ): JSONObject {
        val completed = CountDownLatch(1)
        val result = AtomicReference<String>()
        scenario.onActivity {
            (session.view as AceCodeEditor).webView.evaluateJavascript(
                "(function() { try { return $script; } catch (error) { return { javascriptError: String(error.stack || error) }; } })()",
            ) {
                result.set(it)
                completed.countDown()
            }
        }
        assertTrue("WebView evaluation should complete", completed.await(10, TimeUnit.SECONDS))
        return JSONObject(result.get()).also {
            assertFalse("JavaScript probe failed: $it", it.has("javascriptError"))
        }
    }
}
