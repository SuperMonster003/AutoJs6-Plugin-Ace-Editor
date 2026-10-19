import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const lock = JSON.parse(fs.readFileSync(path.join(repository, 'tools/ace-lsp/ace-builds-lock.json')));
const assets = path.join(repository, lock.assetRoot, 'autojs6');
const generated = path.join(repository, 'app/build/generated/aceLspAssets',
    lock.assetRoot.replace(/^app\/src\/main\/assets\//, ''), 'autojs6/types/generated');
const ts = createRequire(import.meta.url)(path.join(assets, 'typescript/typescript.js'));
const context = { console, setTimeout, clearTimeout, ts };
context.window = context;
vm.createContext(context);
for (const name of ['autojs6_local_symbols.js', 'autojs6_indices.js', 'autojs6_completer.js', 'autojs6_ts_language_service.js']) {
    vm.runInContext(fs.readFileSync(path.join(assets, name), 'utf8'), context, { filename: name });
}
const texts = {};
for (const name of fs.readdirSync(path.join(assets, 'typescript')).filter(name => /^lib\..+\.d\.ts$/.test(name))) {
    texts[`file:///autojs6/typescript/${name}`] = fs.readFileSync(path.join(assets, 'typescript', name), 'utf8');
}
for (const name of fs.readdirSync(generated).filter(name => name.endsWith('.d.ts'))) {
    texts[`file:///autojs6/types/generated/${name}`] = fs.readFileSync(path.join(generated, name), 'utf8');
}
texts['file:///autojs6/types/lib.autojs6.extra.d.ts'] = fs.readFileSync(path.join(assets, 'types/lib.autojs6.extra.d.ts'), 'utf8');
const manifest = JSON.parse(fs.readFileSync(path.join(assets, 'types/runtime-declarations.json'), 'utf8'));
for (const [name, hash] of Object.entries(manifest.files)) {
    const text = fs.readFileSync(path.join(assets, 'types', name), 'utf8').replace(/\r\n?/g, '\n');
    assert.equal(createHash('sha256').update(text).digest('hex'), hash, `Stale copied declaration: ${name}`);
}
const staticCompleter = context.AutoJsAceCompleter.createCompleter(context.AutoJsAceIndices);
let queries = 0;
function query(service, text, prefix, uri, staticOnly = false, includeDetails = false) {
    const lines = text.split('\n');
    const position = { row: lines.length - 1, column: lines.at(-1).length };
    const session = { getValue: () => text, getLine: row => lines[row] || '', getLength: () => lines.length,
        $autojs6DocumentUri: uri };
    let items;
    const callback = (error, results) => { assert.ifError(error); items = results; };
    if (staticOnly) staticCompleter.getCompletions(null, session, position, prefix, callback);
    else service.getCompletions(session, position, prefix, callback, text);
    queries++;
    return includeDetails ? items : items.map(item => item.caption);
}
const routes = [
    ['main.js', '"nodejs";\n', 'node'], ['main.js', '/* comment */\n"node, auto";\n', 'node'],
    ['main.node.js', '', 'node'], ['main.cjs', '', 'node'], ['main.mjs', '', 'node'],
    ['main.mts', '', 'node'], ['main.cts', '', 'node'], ['main.bun.js', '', 'bun'],
    ['main.bun.ts', '', 'bun'], ['main.bun.tsx', '', 'bun'], ['main.ts', '"bun";\n', 'bun'],
];
for (const [file, directive, runtime] of routes) {
    const uri = `file:///autojs6/editor/${file}`;
    const service = context.AutoJsAceTsLanguageService.create({ documentUri: uri, libraryTextByUri: texts,
        // Even opting into Android declarations must not inject Rhino into another runtime.
        libraryUris: [...context.AutoJsAceTsLanguageService.constants.defaultLibraryUris,
            'file:///autojs6/types/generated/lib.autojs6.android.d.ts'] });
    const modulePrefix = runtime === 'node' ? (/\.m(?:j|t)s$/.test(file) ?
        'import api from "screen_metrics";\napi.' : 'const api = require("screen_metrics");\napi.') :
        '/** @type {import("autojs6:bun-host").HostClient} */\nconst host = {};\nhost.coordinates.';
    const bunTyped = runtime === 'bun' && /\.tsx?$/.test(file) ?
        'declare const host: import("autojs6:bun-host").HostClient;\nhost.coordinates.' : modulePrefix;
    assert(query(service, directive + bunTyped + 'c', 'c', uri).includes('cXy'), `${file}: coordinates missing`);
    assert.equal(service.getState().apiRuntime, runtime);
    if (runtime === 'node') {
        const native = directive + 'const fs = require("node:fs");\nfs.readFileSync("example.txt");';
        const nativeSession = { getValue: () => native, getLine: row => native.split('\n')[row] || '' };
        assert(!(service.getDiagnostics(nativeSession, native) || []).some(item => item.raw === '2769'),
            'Host require overloads must not reject native or installed modules');
    }
    const loaded = service.getState().rootLibraryUris;
    assert(!loaded.some(name => /\.core\.|\.extra\.|\.android\.|\.jsox-/.test(name)), `${file}: Rhino declarations leaked`);
    for (const useStatic of [false, true]) {
        assert(!query(service, directive + 'selector', 'selector', uri, useStatic).includes('selector'), `${file}: selector leaked`);
        for (const name of ['speech', '$speech', 'opencc', 'images', 'ui', 'compose']) {
            assert(!query(service, directive + name, name, uri, useStatic).includes(name), `${file}: Rhino global ${name} leaked`);
        }
        assert(!query(service, directive + 'jsox.extendAll();\nMath.su', 'su', uri, useStatic).includes('sum'), `${file}: JSOX leaked`);
    }
    service.dispose();
}
const uri = 'file:///autojs6/editor/main.js';
const service = context.AutoJsAceTsLanguageService.create({ documentUri: uri, libraryTextByUri: texts });
for (const [source, prefix, expected] of [
    ["\"nodejs\";\nconst api = require(\"screen_recorder\");\napi.st", "st", "start"],
    ["\"nodejs\";\nconst api = require(\"screen_recorder\");\napi.st", "st", "stop"],
    ["\"nodejs\";\nconst api = require(\"screen_recorder\");\napi.ca", "ca", "cancel"],
    ["\"nodejs\";\nconst api = require(\"screen_recorder\");\napi.ge", "ge", "getStatus"],
    ["\"nodejs\";\nimport api from \"autojs6:screen_recorder\";\napi.st", "st", "start"],
    ["\"nodejs\";\nimport api from \"autojs6:screen_recorder\";\napi.st", "st", "stop"],
    ["\"nodejs\";\nimport api from \"autojs6:screen_recorder\";\napi.ca", "ca", "cancel"],
    ["\"nodejs\";\nimport api from \"autojs6:screen_recorder\";\napi.ge", "ge", "getStatus"],
    ["\"nodejs\";\nconst projection=require(\"autojs6:media_projection\");\nasync function f(){const cap=await projection.requestScreenCapture();cap.ne", "ne", "nextImage"],
    ["\"nodejs\";\nimport recorder from \"autojs6:recorder\";\nrecorder.sta", "sta", "start"],
    ["\"nodejs\";\nconst screen=require(\"screen_recorder\");\nasync function f(){const movie=await screen.stop();if(movie) movie.audioS", "audioS", "audioSource"],
    ['"nodejs";\nconst p = require("pinyin");\np.si', 'si', 'simple'],
    ['"nodejs";\nconst p = require("pinyin4j");\np.re', 're', 'readings'],
    ['"nodejs";\nconsole.setTi', 'setTi', 'setTitle'],
    ['"nodejs";\nconst a = require("accessibility");\na.sw', 'sw', 'swipe'],
    ['"nodejs";\nconst a = require("accessibility");\na.ge', 'ge', 'gesture'],
    ['"nodejs";\nconst keys = require("input_observer");\nkeys.ob', 'ob', 'observeKeys'],
    ['"nodejs";\nconst math = require("jsox.mathx");\nmath.su', 'su', 'sum'],
    ['"nodejs";\nconst fetch = require("fetch");\nfetch.re', 're', 'request'],
    ['"nodejs";\nconst axios = require("axios");\naxios.Ax', 'Ax', 'AxiosError'],
    ['"nodejs";\n$autojs.profile.ins', 'ins', 'inspector'],
    ['"nodejs";\n$autojs.profile.processP', 'processP', 'processPermission'],
    ['// "bun";\nselector().fi', 'fi', 'findOne'],
    ['jsox.extendAll();\nMath.su', 'su', 'sum'],
]) assert(query(service, source, prefix, uri).includes(expected), `Missing ${expected}: ${source}`);
assert.equal(service.getState().apiRuntime, 'rhino', 'Removing a runtime directive must restore Rhino');
service.dispose();
const openccMethods = fs.readFileSync(path.join(assets, 'types/autojs6/aj6-int-opencc.d.ts'), 'utf8')
    .match(/\b(?:convert|[a-z]+2[a-z]+)\(/g).map(name => name.slice(0, -1));
const imageSource=ts.createSourceFile('image.d.ts',fs.readFileSync(path.join(assets,'types/autojs6-node/image.d.ts'),'utf8'),ts.ScriptTarget.Latest,true);
const commonImages=[];
function collectImages(node){if(ts.isInterfaceDeclaration(node)&&node.name.text==='ImageModule')for(const member of node.members)if(member.name)commonImages.push(member.name.getText(imageSource));ts.forEachChild(node,collectImages);}
collectImages(imageSource);
const newApiChecks = [];
for (const [file, header, opencc, images] of [
    ['api.cjs', 'const cc = require("autojs6:opencc");\nconst images = require("images");\n', 'cc', 'images'],
    ['api.mjs', 'import cc from "autojs6:opencc";\nimport images from "images";\n', 'cc', 'images'],
    ['worker.cjs', 'const cc = require("autojs6:opencc");\nconst images = require("images");\n', 'cc', 'images'],
    ['worker.mjs', 'import cc from "autojs6:opencc";\nimport images from "autojs6:images";\n', 'cc', 'images'],
    ['api.bun.ts', 'declare const host: import("autojs6:bun-host").HostClient;\n', 'host.opencc', 'host.images'],
]) {
    const documentUri = `file:///autojs6/editor/${file}`;
    const current = context.AutoJsAceTsLanguageService.create({ documentUri, libraryTextByUri: texts });
    if(file.startsWith('worker.')) {
        for(const [module,expected] of [['pinyin',['convert','simple','compact','STYLE_NORMAL','MODE_SURNAME']],['pinyin4j',['of','as','readings']],
            ['console',['show','hide','setTitle','log']],['screen_metrics',['cX','cY','cXy','cYx','setScaleBases']]]) {
            const code=file.endsWith('.mjs')?`import api from "autojs6:${module}";\napi.`:`const api=require("autojs6:${module}");\napi.`;
            const names=query(current,code,'',documentUri);
            for(const name of expected)assert(names.includes(name),`${file}: ${module}.${name} missing`);
        }
    } else if(file.endsWith('.bun.ts')) {
        const files=query(current,header+'host.files.','',documentUri);
        for(const name of ['path','join','read','write','append','exists','listDir','remove','copy','move','ensureDir','isFile','isDir','getName','getExtension'])assert(files.includes(name),`Bun files.${name}`);
        for(const module of ['storage','storages']) {
            const store=query(current,header+`const store=host.${module}.open('owned');\nstore.`,'',documentUri);
            for(const name of ['name','get','put','putSync','remove','removeSync','clear','clearSync','keys','contains','selfRemove','selfRemoveSync'])assert(store.includes(name),`Bun ${module} store.${name}`);
        }
        for(const [module,names] of [['app',['packageName','intent','parseUri','launchPackage','openAppSetting','startActivity','startService','sendBroadcast','getInstalledApps','getPackageInfo']],['accessibility',['isEnabled','ensureEnabled','textMatches','click','longClick','setText','findOne','findAll','scrollForward','swipe','gesture']],['clipboard',['getText','setText','hasText']]]) {
            const members=query(current,header+'host.'+module+'.','',documentUri);
            for(const name of names)assert(members.includes(name),`Bun ${module}.${name}`);
        }
        const appIntent=query(current,header+'host.app.startActivity({','',documentUri);
        for(const name of ['action','data','packageName','className','extras'])assert(appIntent.includes(name),`Bun Intent ${name}`);
        for(const name of ['start','stop','cancel','getStatus'])assert(query(current,header+'host.screenRecorder.','',documentUri).includes(name),`Bun recording ${name}`);
        const members=query(current,header+'async function test() {const movie=await host.screenRecorder.stop();if(movie) movie.','',documentUri);
        for(const name of ['path','size','durationMs','width','height','audio','audioSource','audioCodec','audioSampleRate','audioChannels'])assert(members.includes(name),`Movie metadata ${name}`);
        const options=query(current,header+'declare const options: import("autojs6:bun-host").ScreenRecordingOptions;\noptions.','',documentUri);
        assert(options.includes('audio'),'Bun recording audio option is missing');
        const entries=query(current,header+'declare const options: import("autojs6:bun-host").ScreenRecordingOptions;\noptions.aud','aud',documentUri,false,true);
        const audio=entries.find(item=>item.caption==='audio');
        assert(audio.docText.includes('ScreenRecordingAudioSource'),'Optional property documentation lost its type');
        assert(!audio.snippet,'Property completion must not insert a function call');
        const modes=query(current,header+'const options: import("autojs6:bun-host").ScreenRecordingOptions = {audio: "','',documentUri);
        for(const mode of ['none','microphone','playback','mixed'])assert(modes.includes(mode),`Bun audio mode ${mode} missing`);
    }
    const conversions = query(current, header + opencc + '.', '', documentUri);
    for (const name of new Set(openccMethods)) assert(conversions.includes(name), `${file}: missing OpenCC method ${name}`);
    const imageNames = query(current, header + images + '.', '', documentUri);
    for (const name of commonImages) assert(imageNames.includes(name), `${file}: missing image method ${name}`);
    assert(imageNames.includes('detectAndComputeFeatures'), `${file}: feature extraction missing`);
    const prefix = header + 'const handle = {id:"typed-handle",width:2,height:2};\nasync function inspect() {\n';
    assert(query(current, prefix + `const bytes = await ${images}.toBytes(handle);\nbytes.sub`, 'sub', documentUri).includes('subarray'),
        `${file}: image bytes lost Uint8Array methods`);
    assert(query(current, prefix + `const pixels = await ${images}.readPixels(handle);\npixels.data.sli`, 'sli', documentUri).includes('slice'),
        `${file}: pixel data lost array methods`);
    const pixelBytes = query(current, prefix + `const pixels = await ${images}.readPixels(handle);\npixels.data.sub`, 'sub', documentUri);
    assert(!pixelBytes.includes('subarray'), `${file}: ARGB32 number arrays were confused with byte arrays`);
    const handles = query(current, prefix + `const copy = await ${images}.copy(handle);\ncopy.`, '', documentUri);
    assert(handles.includes('id') && handles.includes('width') && handles.includes('height'), `${file}: untyped image handle`);
    assert(!handles.includes('getBitmap') && !handles.includes('getMat'), `${file}: Rhino ImageWrapper methods leaked`);
    const featureMembers=query(current,prefix+`const features=await ${images}.detectAndComputeFeatures(handle);\nfeatures.`,'',documentUri);
    for(const name of ['id','count','method','scale','region'])assert(featureMembers.includes(name),`${file}: feature ${name}`);
    assert(!featureMembers.includes('javaObject'),`${file}: native feature pointer leaked`);
    const frameMembers=query(current,prefix+`const frame=await ${images}.matchFeatures(handle,handle);if(frame) frame.`,'',documentUri);
    for(const name of ['topLeft','center','bounds','angle','inliers','points','summary'])assert(frameMembers.includes(name),`${file}: frame ${name}`);
    const quantMembers=query(current,prefix+`const quant=await ${images}.quantize(handle);\nquant.`,'',documentUri);
    for(const name of ['bytes','quality','quantizationError','peakWorkingMemoryBytes'])assert(quantMembers.includes(name),`${file}: quantization ${name}`);
    assert(query(current,prefix+`const quant=await ${images}.quantize(handle);\nquant.bytes.sub`,'sub',documentUri).includes('subarray'),`${file}: quantized bytes`);
    const matMembers=query(current,prefix+`const mat=await ${images}.imread('image.png');\nmat.`,'',documentUri);
    for(const name of ['id','channels','depth','width','height'])assert(matMembers.includes(name),`${file}: Mat ${name}`);
    assert(!matMembers.includes('getNativeObjAddr'),`${file}: native Mat pointer leaked`);
    const uiHeader = file.endsWith('.bun.ts') ? header + 'const ui=host.ui;const compose=host.compose;\n'
      : header + (file.endsWith('.mjs') ? 'import ui from "autojs6:ui";import compose from "autojs6:compose";\n' : 'const ui=require("ui"),compose=require("compose");\n');
    const factories=query(current,uiHeader+'compose.','',documentUri);
    const composeNames=fs.readFileSync(path.join(assets,'types/autojs6-node/compose.d.ts'),'utf8')
      .match(/type Compose(?:CatalogNodeName|V2NodeName) = [^;]+/g).flatMap(line=>[...line.matchAll(/"([^"\n]+)"/g)].map(value=>value[1]));
    for(const name of [...composeNames,'AndroidView','attach','mount','dialog','floaty','state','memo','modifier'])assert(factories.includes(name),`${file}: Compose ${name}`);
    const uiMembers=query(current,uiHeader+'ui.','',documentUri);
    for(const name of ['inflate','createView','context','findView','view'])assert(uiMembers.includes(name),`${file}: UI ${name}`);
    const nativeView=query(current,uiHeader+'async function f(){const view=await ui.inflate("<text/>");view.','',documentUri);
    for(const name of ['get','set','flush','text','checked','progress','selectedIndex','checkedId','rating','cardCornerRadius','items','visibility','loadUrl','loadHtml','evaluateJavascript','evaluateJavascriptAsync','enableDisplayCapture','disableDisplayCapture','stopMediaCapture','startBackgroundRecording','stopBackgroundRecording','getBackgroundRecording','cancelBackgroundRecording','openDrawer','closeDrawer','menu','currentItem','pageCount','setCurrentItem','xmlId','findView','dispose','on','once','off','context'])assert(nativeView.includes(name),`${file}: native View ${name}`);
    for(const name of ['setWebViewClient','setWebChromeClient','setDownloadListener','chooseFiles','cancelFileChooser','download','getDownload','readDownload','cancelDownload','exitFullscreen'])assert(nativeView.includes(name),`${file}: ${name}`);
    const webHeader=uiHeader+"async function f(){const web=await ui.createView('WebView');";
    const sharing=query(current,webHeader+"web.enableDisplayCapture({",'',documentUri);
    for(const name of ['origin','maxWidth','maxHeight','frameRate','timeoutMs'])assert(sharing.includes(name),`${file}: display option ${name}`);
    const background=query(current,webHeader+"web.startBackgroundRecording({",'',documentUri);
    for(const name of ['cameraId','facing','width','height','frameRate','audio','durationLimitSeconds'])assert(background.includes(name),`${file}: camera option ${name}`);
    const mediaResponse=query(current,webHeader+"web.setWebChromeClient({onPermissionRequest:e=>({resources:e.resources,",'',documentUri);
    assert(mediaResponse.includes('requestAndroidPermissions')&&mediaResponse.includes('backgroundCapture'),`${file}: explicit Android media permission response`);
    const callbacks=query(current,webHeader+'web.setWebChromeClient({onJs','onJs',documentUri);
    for(const name of ['onJsAlert','onJsConfirm','onJsPrompt','onJsBeforeUnload'])assert(callbacks.includes(name),`${file}: ${name} callback`);
    const picker=query(current,webHeader+'web.setWebChromeClient({onShowFileChooser(e){e.','',documentUri);
    for(const name of ['acceptTypes','multiple','mode','captureEnabled','filenameHint'])assert(picker.includes(name),`${file}: chooser ${name}`);
    assert(nativeView.includes('readDocument'),`${file}: readDocument`);
    const chooserOptions=query(current,webHeader+'web.chooseFiles({','',documentUri);
    for(const name of ['mode','captureEnabled','captureKind','videoQuality','durationLimitSeconds','sizeLimitBytes','timeoutMs','fileName','writable','initialUri'])assert(chooserOptions.includes(name),`${file}: chooser option ${name}`);
    const downloadOptions=query(current,webHeader+"web.download({url:'data:text/plain,hi',",'',documentUri);
    for(const name of ['destinationUri','directoryUri','timeoutMs'])assert(downloadOptions.includes(name),`${file}: download option ${name}`);
    const httpError=query(current,webHeader+'web.setWebViewClient({onReceivedHttpError(e){e.','',documentUri);
    for(const name of ['url','statusCode','responseHeaders','mainFrame'])assert(httpError.includes(name),`${file}: HTTP callback ${name}`);
    const xmlTags=query(current,uiHeader+"ui.inflate('<sp",'sp',documentUri);
    assert(xmlTags.includes('spinner')&&xmlTags.includes('space'),`${file}: XML component tags`);
    for(const tag of ['webview','drawer','toolbar','viewpager'])assert(query(current,uiHeader+"ui.inflate('<"+tag.slice(0,2),tag.slice(0,2),documentUri).includes(tag),`${file}: ${tag} XML tag`);
    assert(query(current,uiHeader+"ui.inflate('<webview javaS",'javaS',documentUri).includes('javaScriptEnabled'),`${file}: WebView attribute`);

    assert(query(current,uiHeader+"ui.inflate('<spinner selectedI",'selectedI',documentUri).includes('selectedIndex'),`${file}: XML native attributes`);
    assert(!query(current,uiHeader+"const fake={inflate(value){return value;}};fake.inflate('<sp",'sp',documentUri).includes('spinner'),`${file}: unrelated string got XML suggestions`);
    const propertyDetails=query(current,uiHeader+"async function f(){const view=await ui.createView('Text');view.tex",'tex',documentUri,false,true);
    assert(propertyDetails.some(item=>item.caption==='text'&&item.docText.includes('Promise<string>')),`${file}: async property signature`);
    assert(!nativeView.includes('getContext'),`${file}: Java View must not leak`);
    const nativeContext=query(current,uiHeader+'async function f(){const context=await ui.context();context.','',documentUri);
    for(const name of ['createView','inflate','packageName','runtimeVersionCode'])assert(nativeContext.includes(name),`${file}: native context ${name}`);
    assert(query(current,uiHeader+'ui.showL','showL',documentUri).includes('showLayout'),`${file}: UI layout`);
    const uiSession=query(current,uiHeader+'async function f(){const s=await compose.mount(compose.Text({text:"a"}));s.','',documentUri);
    for(const name of ['root','close','render','flush','setTheme','isClosed'])assert(uiSession.includes(name),`${file}: Compose session ${name}`);
    const propSource=file.endsWith('.ts') ? 'const props: NonNullable<Parameters<typeof compose.Text>[0]>={};props.'
      : '/** @type {NonNullable<Parameters<typeof compose.Text>[0]>} */\nconst props={};props.';
    const fields=query(current,uiHeader+propSource,'',documentUri);
    for(const name of ['text','color','fontSize','modifier','ref'])assert(fields.includes(name),`${file}: Compose props ${name}`);
    newApiChecks.push({ file, openccMethods: new Set(openccMethods).size, imageMethods: commonImages.length });
    current.dispose();
}
console.log(JSON.stringify({ typescript: ts.version, routeCases: routes.length, queries,
    isolatedRuntimeDeclarations: true, copiedDeclarations: Object.keys(manifest.files).length, newApiChecks }, null, 2));
