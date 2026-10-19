package io.github.supermonster003.autojs6.plugin.ace.editor.core

import android.graphics.Bitmap
import android.os.Build
import android.os.SystemClock
import android.provider.Settings
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import java.io.File
import org.json.JSONArray
import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith

/** Uses the real page's public LSP wrapper and popup, with the normal provider budgets and native asset bridge. */
@RunWith(AndroidJUnit4::class)
class AceApiCoverageDeviceTest {
    @Test
    fun sensorsHaveTypedMainWorkerAndBunPopups() = withEvidence("runtime-sensors") { editor, evidence ->
        for((mode,header) in listOf(
            "node" to "\"nodejs\";\nconst sensors=require('autojs6:sensors');\n",
            "bun" to "\"bun\";\n/** @type {import('autojs6:bun-host').HostClient} */\nconst host={};const sensors=host.sensors;\n")) {
            val methods=query(editor,header+"sensors.","",evidence)
            assertTrue(methods.toString(),semanticNames(methods).containsAll(setOf("policy","getAvailableSensors","once","subscribe")))
            showPopup(editor,header+"sensors.getAvail","getAvailableSensors",evidence,"$mode-sensors-inventory","Promise<")
            val code=header+"const sub=sensors.subscribe('accelerometer');\n"
            val members=query(editor,code+"sub.","",evidence)
            assertTrue(members.toString(),semanticNames(members).containsAll(setOf("id","type","ready","closed","on","once","off","close")))
            showPopup(editor,code+"sub.clo","close",evidence,"$mode-sensors-close","Promise<void>")
            val options=query(editor,header+"sensors.subscribe('light',undefined,{","",evidence)
            assertTrue(options.toString(),semanticNames(options).containsAll(setOf("signal","timeoutMs","samplingIntervalMs","intervalMs","maxQueueSize","drainIntervalMs")))
        }
    }

    @Test
    fun bunAutomationUsesTypedPopups() = withEvidence("bun-automation") { editor, evidence ->
        val header="\"bun\";\n/** @type {import('autojs6:bun-host').HostClient} */\nconst host={};\n"
        for((module,names) in listOf("app" to setOf("packageName","intent","parseUri","launchPackage","getPackageInfo","startService","sendBroadcast"),
            "accessibility" to setOf("isEnabled","ensureEnabled","findOne","findAll","textMatches","click","setText","swipe","gesture"),"clipboard" to setOf("getText","setText","hasText"))) {
            val result=query(editor,header+"host.$module.","",evidence)
            assertTrue(result.toString(),semanticNames(result).containsAll(names))
        }
        showPopup(editor,header+"host.accessibility.findO","findOne",evidence,"bun-selector-popup","Promise<")
        showPopup(editor,header+"host.app.getPackageI","getPackageInfo",evidence,"bun-app-popup","Promise<")
        showPopup(editor,header+"host.clipboard.getT","getText",evidence,"bun-clipboard-popup","Promise<string>")
        val files=query(editor,header+"host.files.","",evidence)
        assertTrue(files.toString(),semanticNames(files).containsAll(setOf("path","join","read","write","append","exists","listDir","remove","copy","move","ensureDir","isFile","isDir","getName","getExtension")))
        showPopup(editor,header+"host.files.rea","read",evidence,"bun-files-popup","Promise<string>")
        for(module in listOf("storage","storages")) {
            val storeHeader=header+"const store=host.$module.open('owned');\n"
            val members=query(editor,storeHeader+"store.","",evidence)
            assertTrue(members.toString(),semanticNames(members).containsAll(setOf("get","put","putSync","remove","clear","keys","contains","selfRemove")))
            showPopup(editor,storeHeader+"store.putS","putSync",evidence,"bun-$module-put-popup","Promise<void>")
        }
        val intent=query(editor,header+"host.app.startActivity({","",evidence)
        assertTrue(intent.toString(),semanticNames(intent).containsAll(setOf("action","data","packageName","className","extras")))
    }

    @Test
    fun databasesUseTypedMainWorkerAndBunPopups() = withEvidence("runtime-database") { editor, evidence ->
        for((mode,header,open) in listOf(
            Triple("node","\"nodejs\";\nconst database=require('autojs6:database'),sqlite=require('autojs6:sqlite');\n","database.open({name:'owned'})"),
            Triple("bun","\"bun\";\n/** @type {import('autojs6:bun-host').HostClient} */\nconst host={};const database=host.database,sqlite=host.sqlite;\n","sqlite({name:'owned'})"))) {
            val code=header+"async function f(){const db=await $open;"
            val methods=query(editor,code+"db.","",evidence)
            assertTrue(methods.toString(),semanticNames(methods).containsAll(setOf("id","name","exec","run","get","all","transaction","close")))
            showPopup(editor,code+"db.trans","transaction",evidence,"$mode-database-transaction","Promise<")
            showPopup(editor,code+"db.ge","get",evidence,"$mode-database-get","Promise<")
            val options=query(editor,header+"database.open({","",evidence)
            assertTrue(options.toString(),semanticNames(options).containsAll(setOf("name","timeoutMs","signal")))
        }
    }

    @Test
    fun uiAndComposeUseTypedRuntimePopups() = withEvidence("runtime-ui-compose") { editor, evidence ->
        for ((kind, header) in listOf(
            "node" to "\"nodejs\";\nconst compose=require('autojs6:compose'),ui=require('ui');\n",
            "bun" to "\"bun\";\n/** @type {import('autojs6:bun-host').HostClient} */\nconst host={};const compose=host.compose,ui=host.ui;\n")) {
            val factories=query(editor,header+"compose.","",evidence)
            assertTrue(factories.toString(),semanticNames(factories).containsAll(setOf("AndroidView","attach","Text","Button","Column","TextField","TimePicker","mount","dialog","floaty","state","modifier","memo")))
            showPopup(editor,header+"compose.att","attach",evidence,"$kind-attach-popup","Promise<")
            showPopup(editor,header+"ui.inf","inflate",evidence,"$kind-inflate-popup","NativeViewHandle>")
            val native=query(editor,header+"async function f(){const view=await ui.inflate('<text/>');view.","",evidence)
            assertTrue(native.toString(),semanticNames(native).containsAll(setOf("get","set","flush","text","checked","progress","rating","selectedIndex","checkedId","items","visibility","findView","dispose","on","once","off","context")))
            showPopup(editor,header+"async function f(){const view=await ui.createView('Text');view.tex","text",evidence,"$kind-property-popup","Promise<string>")
            val xml=query(editor,header+"ui.inflate('<sp","sp",evidence)
            assertTrue(xml.toString(),semanticNames(xml).containsAll(setOf("spinner","space")))
            showPopup(editor,header+"ui.inflate('<sp","spinner",evidence,"$kind-xml-tag-popup","ui.inflate XML component")
            val attributes=query(editor,header+"ui.inflate('<spinner selectedI","selectedI",evidence)
            assertTrue(attributes.toString(),semanticNames(attributes).contains("selectedIndex"))
            assertTrue(native.toString(),semanticNames(native).containsAll(setOf("loadUrl","loadHtml","evaluateJavascript","menu","openDrawer","closeDrawer","currentItem","setCurrentItem","pageCount")))
            showPopup(editor,header+"async function f(){const view=await ui.createView('WebView');view.eval","evaluateJavascript",evidence,"$kind-web-script-popup","Promise<")
            for(tag in listOf("webview","drawer","toolbar","viewpager")) {
                val result=query(editor,header+"ui.inflate('<"+tag.take(2),tag.take(2),evidence)
                assertTrue(result.toString(),semanticNames(result).contains(tag))
            }
            showPopup(editor,header+"ui.inflate('<webview javaS","javaScriptEnabled",evidence,"$kind-web-attribute-popup","ui.inflate attribute: javaScriptEnabled")
            assertTrue(native.toString(),semanticNames(native).containsAll(setOf("setWebViewClient","setWebChromeClient","setDownloadListener","chooseFiles","cancelFileChooser","download","getDownload","readDownload","cancelDownload","exitFullscreen")))
            val webHeader=header+"async function f(){const web=await ui.createView('WebView');"
            showPopup(editor,webHeader+"web.chooseF","chooseFiles",evidence,"$kind-chooser-popup","Promise<")
            showPopup(editor,webHeader+"web.setWebChromeClient({onJsP","onJsPrompt",evidence,"$kind-prompt-callback-popup","WebDialogRequest")
            val picker=query(editor,webHeader+"web.setWebChromeClient({onShowFileChooser(e){e.","",evidence)
            assertTrue(picker.toString(),semanticNames(picker).containsAll(setOf("acceptTypes","mode","multiple","captureEnabled","filenameHint")))
            showPopup(editor,webHeader+"web.readDoc","readDocument",evidence,"$kind-document-popup","Uint8Array")
            showPopup(editor,webHeader+"web.evaluateJavascriptA","evaluateJavascriptAsync",evidence,"$kind-web-promise-popup","Promise<")
            val permissionType=if(kind=="node")"import('ui').WebPermissionResponse" else "import('autojs6:bun-host').RuntimeUi.WebPermissionResponse"
            showPopup(editor,header+"/** @type {$permissionType} */\nconst mediaReply={resources:[]};\nmediaReply.requestA","requestAndroidPermissions",evidence,"$kind-web-media-permission-popup","boolean")
            showPopup(editor,webHeader+"web.enableDisplayC","enableDisplayCapture",evidence,"$kind-display-popup","Promise<")
            showPopup(editor,webHeader+"web.startBackgroundR","startBackgroundRecording",evidence,"$kind-background-camera-popup","Promise<")
            val screenOptions=query(editor,webHeader+"web.enableDisplayCapture({","",evidence)
            assertTrue(screenOptions.toString(),semanticNames(screenOptions).containsAll(setOf("origin","maxWidth","maxHeight","frameRate","timeoutMs")))
            val cameraOptions=query(editor,webHeader+"web.startBackgroundRecording({","",evidence)
            assertTrue(cameraOptions.toString(),semanticNames(cameraOptions).containsAll(setOf("facing","cameraId","audio","width","height","frameRate")))
            val choices=query(editor,webHeader+"web.chooseFiles({","",evidence)
            assertTrue(choices.toString(),semanticNames(choices).containsAll(setOf("mode","captureEnabled","captureKind","videoQuality","durationLimitSeconds","sizeLimitBytes","timeoutMs","fileName","writable","initialUri")))
            showPopup(editor,webHeader+"web.chooseFiles({captureEnabled:true,videoQ","videoQuality",evidence,"$kind-video-capture-popup","0 | 1")
            showPopup(editor,webHeader+"web.chooseFiles({captureEnabled:true,durationL","durationLimitSeconds",evidence,"$kind-audio-duration-popup","number")
            showPopup(editor,webHeader+"web.download({url:'data:text/plain,hi',directoryU","directoryUri",evidence,"$kind-directory-popup","string")
            assertFalse(semanticNames(native).contains("getContext"))
            showPopup(editor,header+"compose.mou","mount",evidence,"$kind-compose-popup","Promise<")
            showPopup(editor,header+"ui.showL","showLayout",evidence,"$kind-ui-popup","Promise<")
            val session=query(editor,header+"async function f(){const s=await compose.mount(compose.Text({text:'fixture'}));s.","",evidence)
            assertTrue(session.toString(),semanticNames(session).containsAll(setOf("close","render","flush","setTheme","root","isClosed")))
        }
    }



    @Test
    fun openccAndImageApisHaveTypedRuntimePopups() = withEvidence("runtime-opencc-image") { editor, evidence ->
        val node = "\"nodejs\";\nconst cc = require('autojs6:opencc');\nconst images = require('autojs6:images');\n"
        val bun = "\"bun\";\n/** @type {import('autojs6:bun-host').HostClient} */\nconst host = {};\n"
        val conversions = setOf("convert", "hk2s", "hk2t", "jp2t", "s2hk", "s2t", "s2tw", "s2twp", "t2hk", "t2s",
            "t2tw", "t2jp", "tw2s", "tw2t", "tw2sp", "s2twi", "twi2s", "s2jp", "t2twi", "hk2tw", "hk2twi", "hk2jp",
            "tw2hk", "tw2twi", "tw2jp", "twi2t", "twi2hk", "twi2tw", "twi2jp", "jp2s", "jp2hk", "jp2tw", "jp2twi")
        val imageMethods = setOf("fromBase64", "fromBytes", "toBase64", "toBytes", "pixel", "readPixels", "copy", "scale",
            "rotate", "flip", "blur", "gaussianBlur", "medianBlur", "invert", "detectsColor", "findAllPointsForColor",
            "requestScreenCapture", "captureScreen", "stopScreenCapture")
        for ((header, receiver, runtime) in listOf(Triple(node, "", "node"), Triple(bun, "host.", "bun"))) {
            val opencc = if (runtime == "node") "cc" else "host.opencc"
            val conversionsResult = query(editor, header + "$opencc.", "", evidence)
            assertTrue("Missing OpenCC conversions: $conversionsResult", semanticNames(conversionsResult).containsAll(conversions))
            val imagesResult = query(editor, header + receiver + "images.", "", evidence)
            assertTrue("Missing image operations: $imagesResult", semanticNames(imagesResult).containsAll(imageMethods))
            assertTrue("Advanced images are missing", semanticNames(imagesResult).containsAll(setOf("detectAndComputeFeatures","matchFeatures","quantize","cvtColor","findCircles","imread","matToImage","ObjectFrame")))
            assertRuntimeDeclarations(imagesResult, runtime)
            showPopup(editor, header + "$opencc.con", "convert", evidence, "$runtime-opencc-popup", "Promise<string>")
            showPopup(editor, header + receiver + "images.readPix", "readPixels", evidence, "$runtime-image-popup", "Promise<")
            showPopup(editor,header+receiver+"images.detectAndComp","detectAndComputeFeatures",evidence,"$runtime-feature-popup","ImageFeaturesHandle>")
            showPopup(editor,header+receiver+"images.quanti","quantize",evidence,"$runtime-quantize-popup","QuantizationResult>")
            val advanced=header+"async function advanced(){const image={id:'fixture',width:8,height:8};\n"
            val descriptor=query(editor,advanced+"const features=await ${receiver}images.detectAndComputeFeatures(image);features.","",evidence)
            assertTrue(descriptor.toString(),semanticNames(descriptor).containsAll(setOf("id","count","method","scale","region")))
            val frame=query(editor,advanced+"const frame=await ${receiver}images.matchFeatures(image,image);if(frame) frame.","",evidence)
            assertTrue(frame.toString(),semanticNames(frame).containsAll(setOf("center","bounds","inliers","summary")))
            if (runtime == "bun") {
                showPopup(editor, header + "host.images.requestScr", "requestScreenCapture", evidence, "bun-capture-popup", "Promise<boolean>")
                val recording=query(editor,header+"host.screenRecorder.","",evidence)
                assertTrue(recording.toString(),semanticNames(recording).containsAll(setOf("start","stop","cancel","getStatus")))
                showPopup(editor,header+"host.screenRecorder.sta","start",evidence,"bun-video-popup","Promise<ScreenRecordingActive>")
                val movie=query(editor,header+"async function check() {const movie=await host.screenRecorder.stop();if(movie) movie.","",evidence)
                assertTrue(movie.toString(),semanticNames(movie).containsAll(setOf("durationMs","path","size","width","height","audio","audioSource","audioCodec","audioSampleRate","audioChannels")))
                val options=header+"/** @type {import('autojs6:bun-host').ScreenRecordingOptions} */\nconst options={};\n"
                showPopup(editor,options+"options.aud","audio",evidence,"bun-audio-popup","ScreenRecordingAudioSource")
            }
            if (runtime == "node") {
                val recordingHeader=header+"const screen=require('autojs6:screen_recorder');\n"
                val recording=query(editor,recordingHeader+"screen.","",evidence)
                assertTrue(recording.toString(),semanticNames(recording).containsAll(setOf("start","stop","cancel","getStatus")))
                showPopup(editor,recordingHeader+"screen.sta","start",evidence,"node-video-popup","ActiveRecording>")
                val options=header+"/** @type {import('screen_recorder').StartOptions} */\nconst options={};\n"
                showPopup(editor,options+"options.aud","audio",evidence,"node-audio-popup","AudioSource")
                val movie=query(editor,recordingHeader+"async function f(){const movie=await screen.stop();if(movie) movie.","",evidence)
                assertTrue(movie.toString(),semanticNames(movie).containsAll(setOf("durationMs","audioSource","audioCodec","audioSampleRate","audioChannels")))
            }
            val inspect = header + "const image = {id:'typed-handle',width:2,height:2};\nasync function inspect() {\n"
            val bytes = query(editor, inspect + "const bytes = await ${receiver}images.toBytes(image);\nbytes.sub", "sub", evidence)
            assertTrue("Byte result has no Uint8Array methods: $bytes", semanticNames(bytes).contains("subarray"))
            val pixels = query(editor, inspect + "const pixels = await ${receiver}images.readPixels(image);\npixels.data.sli", "sli", evidence)
            assertTrue("Pixel result has no typed array data: $pixels", semanticNames(pixels).contains("slice"))
            val leaked = query(editor, (if (runtime == "node") "\"nodejs\";\n" else "\"bun\";\n") + "images", "images", evidence)
            assertFalse("Rhino images global leaked", semanticNames(leaked).contains("images"))
        }
    }

    @Test
    fun runtimeModulesUseIsolatedDeclarationsAndRealPopups() = withEvidence("runtime-api") { editor, evidence ->
        val node = "\"nodejs\";\n"
        for ((body, expected) in listOf(
            "const p = require('pinyin');\np.si" to "simple",
            "const p = require('pinyin4j');\np.re" to "readings",
            "console.setTi" to "setTitle",
            "const a = require('accessibility');\na.sw" to "swipe",
            "const a = require('accessibility');\na.ge" to "gesture",
            "const keys = require('input_observer');\nkeys.ob" to "observeKeys",
            "const math = require('jsox.mathx');\nmath.su" to "sum",
            "const screen = require('screen_metrics');\nscreen.c" to "cYx",
            "const p = require('autojs6:pinyin');\np.STYLE_" to "STYLE_NORMAL",
            "const p = require('autojs6:pinyin4j');\np.re" to "readings",
            "import c from 'autojs6:console';\nc.setTi" to "setTitle",
            "import s from 'autojs6:screen_metrics';\ns.c" to "cYx",
        )) {
            val result = query(editor, node + body, body.substringAfterLast('.'), evidence)
            assertTrue("Missing Node module completion: $result", semanticNames(result).contains(expected))
            assertRuntimeDeclarations(result, "node")
        }
        showPopup(editor, node + "const screen = require('screen_metrics');\nscreen.cX", "cX", evidence, "node-coordinate-popup")
        val bun = "\"bun\";\n/** @type {import('autojs6:bun-host').HostClient} */\nconst host = {};\n"
        for ((body, expected) in listOf(
            "host.pinyin.si" to "simple", "host.pinyin4j.re" to "readings",
            "host.console.setTi" to "setTitle", "host.coordinates.c" to "cYx",
        )) {
            val result = query(editor, bun + body, body.substringAfterLast('.'), evidence)
            assertTrue("Missing Bun SDK completion: $result", semanticNames(result).contains(expected))
            assertRuntimeDeclarations(result, "bun")
        }
        showPopup(editor, bun + "host.coordinates.cX", "cX", evidence, "bun-coordinate-popup")
        for (directive in listOf("\"nodejs\";\n", "\"bun\";\n")) {
            val selector = query(editor, directive + "selector", "selector", evidence)
            assertFalse("Rhino selector leaked into another runtime", semanticNames(selector).contains("selector"))
            val speech = query(editor, directive + "speech", "speech", evidence)
            assertFalse("Rhino speech leaked into another runtime", semanticNames(speech).contains("speech"))
            val jsox = query(editor, directive + "jsox.extendAll();\nMath.su", "su", evidence)
            assertFalse("Rhino JSOX extension leaked into another runtime", semanticNames(jsox).contains("sum"))
        }
        val restored = query(editor, "jsox.extendAll();\nMath.su", "su", evidence)
        assertTrue("Removing runtime selection did not restore Rhino", semanticNames(restored).contains("sum"))
    }

    private fun assertRuntimeDeclarations(result: JSONObject, runtime: String) {
        val state = result.getJSONObject("state").getJSONObject("tsService")
        assertEquals("Wrong runtime: $state", runtime, state.getString("apiRuntime"))
        val libraries = state.getJSONArray("rootLibraryUris").toString()
        assertTrue("Runtime declaration layer missing: $state", libraries.contains("runtime-$runtime.d.ts"))
        assertFalse("Rhino declaration layer leaked: $state", Regex("\\.(core|extra|android)\\.d\\.ts|\\.jsox-").containsMatchIn(libraries))
    }

    @Test
    fun defaultGroupsExposeRegisteredApisAndTypedReturnChains() = withEvidence("default-api") { editor, evidence ->
        val cases = linkedMapOf(
            "Arrayx.differ" to "differ", "Arrayx.subtract" to "subtract",
            "Mathx.mean" to "mean", "Mathx.mode" to "mode", "Mathx.randFloat" to "randFloat",
            "Mathx.random" to "random", "Mathx.randomFloat" to "randomFloat", "Mathx.randomInt" to "randomInt",
            "Numberx.ensureNumberLike" to "ensureNumberLike", "Numberx.ensureNumbersLike" to "ensureNumbersLike",
            "engines.getEngines" to "getEngines", "util.checkStringArgument" to "checkStringArgument",
            "util.dpToPx" to "dpToPx", "util.pxToDp" to "pxToDp", "util.pxToSp" to "pxToSp", "util.spToPx" to "spToPx",
            "util.versionCodes.searchAll" to "searchAll", "util.versionCodes.summary" to "summary",
            "randomFloat" to "randomFloat", "randomInt" to "randomInt", "verbose" to "verbose",
            "console.setContentTextColors" to "setContentTextColors",
            "speech.models.installAsync" to "installAsync",
            "speech.listen().feed" to "feed",
            "\$speech.recognizeAsync" to "recognizeAsync",
            "selector().findOne" to "findOne", "selector().findOne().click" to "click",
            "selector().findOne().children().findOne" to "findOne",
            "floaty.rawWindow('<frame/>').getWidth" to "getWidth",
            "\$media.playMusic" to "playMusic", "threads.disposable().blockedGet" to "blockedGet",
        )
        cases.forEach { (text, expected) ->
            val result = query(editor, text, expected, evidence)
            assertTrue("Missing semantic API $text: $result", semanticNames(result).contains(expected))
        }
        val colors = query(editor, "Color('red').", "", evidence)
        assertTrue("Color aliases are missing: $colors", semanticNames(colors).containsAll(
            listOf("argb", "hsl", "hsla", "hsv", "hsva", "rgb", "rgba"),
        ))
        for (constant in listOf("MODE_NORMAL", "STYLE_TONE")) {
            val result = query(editor, "pinyin.$constant.", "", evidence)
            assertEquals("Pinyin must not expose a synthetic brand: $result",
                setOf("value", "getValue", "name", "ordinal"), semanticNames(result))
        }
        showPopup(editor, "selector().findOne().cli", "click", evidence, "selector-popup")
    }

    @Test
    fun jsoxActivationAndRemovalReachTheRealProviderAndPopup() = withEvidence("jsox") { editor, evidence ->
        val inactive = query(editor, "Math.su", "su", evidence)
        assertFalse("Math.sum leaked before activation: $inactive", semanticNames(inactive).contains("sum"))
        val activations = listOf(
            "jsox();" to setOf("array", "math", "number"),
            "\$jsox.extend();" to setOf("array", "math", "number"),
            "jsox.extendAll();" to setOf("array", "math", "number"),
            "jsox.extend(['Arrayx', 'Math']);" to setOf("array", "math"),
        )
        for ((activation, modules) in activations) {
            val result = query(editor, "$activation\nMath.su", "su", evidence)
            assertEquals("Wrong activation set: $result", modules, arrayNames(result.getJSONArray("jsoxModules")))
            assertTrue("Math.sum did not reach the semantic provider: $result", semanticNames(result).contains("sum"))
        }
        for ((activation, text, expected) in listOf(
            Triple("jsox.extend('Array');", "[1,2,2].di", "distinct"),
            Triple("\$jsox('Number');", "(5).cl", "clamp"),
            Triple("jsox.extend('Numberx');", "Number.IC", "ICU"),
        )) {
            val result = query(editor, "$activation\n$text", text.substringAfterLast('.'), evidence)
            assertTrue("Selected module did not load: $result", semanticNames(result).contains(expected))
        }
        val selected = query(editor, "jsox.extend('Array');\nMath.su", "su", evidence)
        assertEquals(setOf("array"), arrayNames(selected.getJSONArray("jsoxModules")))
        assertFalse("Array-only activation leaked Math extensions", semanticNames(selected).contains("sum"))
        showPopup(editor, "\$jsox.extendAll();\nMath.s", "sum", evidence, "jsox-popup")
        for (prefix in listOf(
            "", "// jsox.extendAll();\n", "'jsox.extendAll()';\n", "`jsox.extendAll()`;\n",
            "const fake = /jsox\\.extendAll\\(\\)/;\n", "function later() { jsox(); }\n",
            "const jsox = function() {}; jsox();\n", "const { jsox } = {}; jsox();\n",
        )) {
            val result = query(editor, prefix + "Math.su", "su", evidence)
            assertTrue("False JSOX activation: $result", arrayNames(result.getJSONArray("jsoxModules")).isEmpty())
            assertFalse("Math.sum survived removal or a false activation: $result", semanticNames(result).contains("sum"))
        }
    }

    private fun query(editor: AceDeviceTestHarness, text: String, prefix: String, evidence: JSONObject): JSONObject {
        editor.evaluate("window.editor.completer && window.editor.completer.detach(), true")
        editor.setText(text)
        val lines = text.split('\n')
        editor.moveCursorTo(lines.lastIndex, lines.last().length)
        editor.evaluate(
            """(function() {
                var e = window.editor, s = e.getSession(), pos = e.getCursorPosition();
                var c = (e.completers || []).filter(function(candidate) { return candidate.autojs6Lsp === true; })[0];
                window.__apiCoverageDeviceQuery = { done: false };
                if (!c) { window.__apiCoverageDeviceQuery = { done: true, error: 'Public LSP completer missing' }; return true; }
                var started = performance.now();
                c.getCompletions(e, s, pos, ${JSONObject.quote(prefix)}, function(error, items) {
                    window.__apiCoverageDeviceQuery = {
                        done: true, error: error ? String(error) : '', elapsedMs: performance.now() - started,
                        items: (items || []).map(function(item) { return {
                            caption: item.caption || item.value || '', ts: item.autojs6Ts === true,
                            meta: item.meta || '', docText: item.docText || ''
                        }; }),
                        state: window.AutoJsAce.getLspState(),
                        jsoxModules: window.AutoJsAceLocalSymbols.detectJsoxModules(e.getValue())
                    };
                });
                return true;
            })()""".trimIndent(),
        )
        assertTrue("Completion callback timed out for $text", editor.waitFor(15_000L) {
            editor.evaluateBoolean("window.__apiCoverageDeviceQuery && window.__apiCoverageDeviceQuery.done")
        })
        val result = editor.evaluateJson("window.__apiCoverageDeviceQuery").put("text", text).put("prefix", prefix)
        evidence.getJSONArray("queries").put(result)
        assertEquals("Completion failed: $result", "", result.optString("error"))
        assertDefaultProvider(result.getJSONObject("state"))
        return result
    }

    private fun assertDefaultProvider(state: JSONObject) {
        assertEquals("Unexpected semantic provider: $state", "typescript-language-service", state.getString("completionProvider"))
        assertTrue("Optional declaration groups were enabled: $state", state.getJSONArray("declarationGroups").length() == 0)
        assertTrue("Optional dependencies were enabled: $state", state.getJSONArray("effectiveDeclarationGroups").length() == 0)
        val optional = Regex("lib\\.autojs6\\.(android|libraries|resources|main-app)\\.d\\.ts")
        assertFalse("Native declaration groups bypassed the default: $state", optional.containsMatchIn(state.getJSONArray("libraryUris").toString()))
        val provider = state.getJSONObject("semanticProvider")
        assertTrue("Semantic provider degraded: $provider", provider.getBoolean("healthy"))
        assertEquals("Normal operation budget was modified", 2000, provider.getInt("operationTimeoutMs"))
        assertEquals("Cold operation budget was modified", 6000, provider.getInt("coldStartOperationTimeoutMs"))
        assertEquals("Semantic failures occurred: $provider", 0, provider.getInt("failureCount"))
        assertTrue("Real TypeScript service is not ready: $state", state.getJSONObject("tsService").getBoolean("ready"))
    }

    private fun showPopup(editor: AceDeviceTestHarness, text: String, expected: String, evidence: JSONObject, name: String, expectedType: String? = null) {
        val prefix = Regex("[A-Za-z0-9_$]*$").find(text)!!.value
        val result = query(editor, text, prefix, evidence)
        assertTrue("Popup test lacks the expected semantic candidate: $result", semanticNames(result).contains(expected))
        editor.focusEditor()
        editor.evaluate("window.editor.execCommand('startAutocomplete'), true")
        assertTrue("Real popup did not show $expected", editor.waitFor(5_000L) {
            editor.evaluateBoolean(
                "window.editor.completer && window.editor.completer.popup && window.editor.completer.popup.isOpen && " +
                    "(window.editor.completer.completions.filtered || []).some(function(item) { " +
                    "return item.caption === ${JSONObject.quote(expected)} && item.autojs6Ts === true; })",
            )
        })
        editor.evaluate("window.__apiPopupPainted = false; requestAnimationFrame(function() { requestAnimationFrame(function() { window.__apiPopupPainted = true; }); }); true")
        assertTrue("Popup did not reach a rendered frame", editor.waitFor(5_000L) {
            editor.evaluateBoolean("window.__apiPopupPainted === true")
        })
        val snapshot = editor.evaluateJson(
            "(function() { var p = window.editor.completer.popup, r = p.container.getBoundingClientRect(), s = getComputedStyle(p.container); " +
                "var t = window.editor.completer.tooltipNode, d = t && t.getBoundingClientRect(), ds = t && getComputedStyle(t); return " +
                "({ open: p.isOpen, display: s.display, visibility: s.visibility, opacity: s.opacity, " +
                "bounds: { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height }, " +
                "documentation: d ? { top: d.top, bottom: d.bottom, left: d.left, right: d.right, position: ds.position, display: ds.display, " +
                "clientWidth: t.clientWidth, scrollWidth: t.scrollWidth, clientHeight: t.clientHeight, scrollHeight: t.scrollHeight, text: t.textContent, whiteSpace: ds.whiteSpace, " +
                "css: t.style.cssText, parent: t.parentNode.className, overlaps: ds.display !== 'none' && d.left < r.right && d.right > r.left && d.top < r.bottom && d.bottom > r.top } : null, " +
                "renderedText: p.container.textContent, " +
                "items: (window.editor.completer.completions.filtered || []).map(function(item) { return {caption: item.caption, ts: item.autojs6Ts === true}; }), " +
                "state: window.AutoJsAce.getLspState() }); })()",
        )
        evidence.put(name, snapshot)
        assertTrue("Popup closed before paint: $snapshot", snapshot.getBoolean("open"))
        assertFalse("Popup is display:none: $snapshot", snapshot.getString("display") == "none")
        assertEquals("Popup is not visible: $snapshot", "visible", snapshot.getString("visibility"))
        assertTrue("Popup is transparent: $snapshot", snapshot.getString("opacity").toDouble() > 0)
        assertTrue("Popup has no visible rectangle: $snapshot", snapshot.getJSONObject("bounds").getDouble("width") > 0 &&
            snapshot.getJSONObject("bounds").getDouble("height") > 0)
        assertFalse("Completion documentation covers candidates: $snapshot", snapshot.optJSONObject("documentation")?.optBoolean("overlaps") == true)
        snapshot.optJSONObject("documentation")?.takeIf { it.optString("display") != "none" }?.let { documentation ->
            assertTrue("Signature is horizontally clipped: $documentation",
                documentation.getInt("scrollWidth") <= documentation.getInt("clientWidth") + 1)
            if (name.endsWith("coordinate-popup")) {
                assertTrue("Coordinate return type is missing: $documentation", documentation.getString("text").contains("Promise<number>"))
            }
            if (expectedType != null) {
                assertTrue("Expected return type is missing: $documentation", documentation.getString("text").contains(expectedType))
            }
        }
        InstrumentationRegistry.getInstrumentation().waitForIdleSync()
        SystemClock.sleep(150L)
        screenshot(name)
        editor.evaluate("window.editor.completer.detach(), true")
    }

    private fun semanticNames(result: JSONObject): Set<String> {
        val items = result.getJSONArray("items")
        return (0 until items.length()).map { items.getJSONObject(it) }
            .filter { it.getBoolean("ts") }.map { it.getString("caption") }.toSet()
    }

    private fun arrayNames(array: JSONArray): Set<String> = (0 until array.length()).map(array::getString).toSet()

    private fun withEvidence(name: String, body: (AceDeviceTestHarness, JSONObject) -> Unit) {
        val instrumentation = InstrumentationRegistry.getInstrumentation()
        val context = instrumentation.targetContext
        val preferences = context.defaultHostPreferences()
        val before = PREFERENCES.keys.associateWith { preferences.all[it] }
        val rotationBefore = Settings.System.getString(context.contentResolver, Settings.System.USER_ROTATION)
        val autoRotationBefore = Settings.System.getString(context.contentResolver, Settings.System.ACCELEROMETER_ROTATION)
        val evidence = JSONObject().put("test", name).put("manufacturer", Build.MANUFACTURER).put("model", Build.MODEL)
            .put("sdk", Build.VERSION.SDK_INT).put("queries", JSONArray()).put("passed", false)
        try {
            AceDeviceTestHarness.open("// API coverage device test\n// Default declaration groups\n", preferences = PREFERENCES).use { editor ->
                evidence.put("device", editor.device)
                assertTrue("TypeScript provider did not start", editor.waitFor(20_000L) {
                    editor.evaluateBoolean("(function() { var s = window.AutoJsAce.getLspState(); return s && s.tsService && s.tsService.ready; })()")
                })
                evidence.put("initialState", editor.evaluateJson("window.AutoJsAce.getLspState()"))
                try {
                    body(editor, evidence)
                    evidence.put("passed", true)
                } catch (error: Throwable) {
                    evidence.put("failure", error.stackTraceToString())
                    evidence.put("failureState", editor.evaluateJson("window.AutoJsAce.getLspState()"))
                    screenshot("$name-failure")
                    throw error
                }
            }
        } finally {
            val after = PREFERENCES.keys.associateWith { preferences.all[it] }
            evidence.put("preferencesRestored", before == after)
            evidence.put("rotationRestored", rotationBefore == Settings.System.getString(context.contentResolver, Settings.System.USER_ROTATION) &&
                autoRotationBefore == Settings.System.getString(context.contentResolver, Settings.System.ACCELEROMETER_ROTATION))
            File(evidenceDirectory(), "$name.json").writeText(evidence.toString(2))
            assertEquals("Temporary host preferences were not restored", before, after)
            assertTrue("Test changed device rotation", evidence.getBoolean("rotationRestored"))
        }
    }

    private fun screenshot(name: String) {
        val image = InstrumentationRegistry.getInstrumentation().uiAutomation.takeScreenshot()
        checkNotNull(image) { "Unable to capture the real editor screen" }
        File(evidenceDirectory(), "$name.png").outputStream().use { image.compress(Bitmap.CompressFormat.PNG, 100, it) }
        image.recycle()
    }

    private fun evidenceDirectory(): File = File(
        InstrumentationRegistry.getInstrumentation().targetContext.getExternalFilesDir(null), "api-coverage-device",
    ).apply { mkdirs() }

    private companion object {
        val PREFERENCES: Map<String, Any?> = mapOf(
            AceEditorLspPreferences.KEY_ACE_LSP_ENABLED to true,
            AceEditorLspPreferences.KEY_ACE_SEMANTIC_TYPESCRIPT_ENABLED to true,
            AceEditorLspPreferences.KEY_ACE_LSP_DECLARATION_GROUPS to null,
            AceEditorLspPreferences.KEY_ACE_LSP_FILE_TYPES to "js,jsx,ts,tsx",
            AceEditorLspPreferences.KEY_ACE_LSP_FILE_TYPES_REVISION to AceEditorLspPreferences.FILE_TYPES_REVISION,
        )
    }
}
