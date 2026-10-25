import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

// --fresh generates the LSP declarations into a temporary directory instead of reading the
// :app:generateAutoJs6LspDeclarations output (also the fallback when that output is absent, as in
// the host's Script API coverage job). --queries selects another runtime-api-queries.json.
const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2);
const queriesAt = args.indexOf('--queries');
const queriesFile = queriesAt < 0 ? path.join(repository, 'tools/ace-lsp/runtime-api-queries.json') : path.resolve(args[queriesAt + 1]);
const lock = JSON.parse(fs.readFileSync(path.join(repository, 'tools/ace-lsp/ace-builds-lock.json')));
const assets = path.join(repository, lock.assetRoot, 'autojs6');
let generated = path.join(repository, 'app/build/generated/aceLspAssets',
    lock.assetRoot.replace(/^app\/src\/main\/assets\//, ''), 'autojs6/types/generated');
let temporary = null;
if (args.includes('--fresh') || !fs.existsSync(generated)) {
    temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'autojs6-ace-runtime-'));
    process.on('exit', () => fs.rmSync(temporary, { recursive: true, force: true }));
    const generator = spawnSync(process.execPath, [path.join(repository, 'tools/ace-lsp/generate-declarations.mjs'),
        '--source', path.join(assets, 'types'), '--output', temporary, '--typescript', path.join(assets, 'typescript/typescript.js')], { encoding: 'utf8' });
    assert.equal(generator.status, 0, `LSP declaration generation failed:\n${generator.stdout}\n${generator.stderr}`);
    generated = path.join(temporary, 'editor', path.basename(path.dirname(assets)), 'autojs6/types/generated');
}
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
    const javaHeader = directive + (runtime==='node' ? 'const java=require("autojs6:java");\n' : /\.tsx?$/.test(file) ? 'declare const host: import("autojs6:bun-host").HostClient;const java=host.java;\n' : '/** @type {import("autojs6:bun-host").HostClient} */\nconst host={};const java=host.java;\n');
    const javaMethods=query(service,javaHeader+'java.','',uri);
    for(const method of ['type','findClass','cast','new','create','callStatic','call','callInstance','getField','setField','getStatic','setStatic','describe','getContext','newArray','arrayLength','getArrayItem','setArrayItem','toArray','instanceOf','getClassName','release','dispose'])assert(javaMethods.includes(method),`${file}: Java ${method}`);
    const javaHandle=query(service,javaHeader+"async function f(){const object=await java.new('android.os.Bundle');object.",'',uri);
    for(const method of ['call','getField','setField','instanceOf','getClassName','arrayLength','toArray','release'])assert(javaHandle.includes(method),`${file}: Java handle ${method}`);
    const javaOptions=query(service,javaHeader+"java.new('android.widget.TextView',[],{",'',uri);
    for(const name of ['thread','parameterTypes','timeoutMs','signal'])assert(javaOptions.includes(name),`${file}: Java call option ${name}`);
    for(const name of ['proxy','wrap','defineClass','loadDex','loadJar','retain','closeCallbacks'])assert(javaMethods.includes(name),`${file}: Java callback API ${name}`);
    const callbackContext=query(service,javaHeader+"java.proxy('java.lang.Runnable',{run:async function(){this.",'',uri);
    for(const name of ['java','receiver','method','signature','callSuper'])assert(callbackContext.includes(name),`${file}: callback this.${name}`);
    const definition=query(service,javaHeader+'java.defineClass({','',uri);
    for(const name of ['name','extends','interfaces','methods'])assert(definition.includes(name),`${file}: class definition ${name}`);
    const generated=query(service,javaHeader+"async function f(){const cls=await java.defineClass({});cls.",'',uri);
    for(const name of ['new','create','release','describe','callStatic'])assert(generated.includes(name),`${file}: generated class ${name}`);
    const callbackOptions=query(service,javaHeader+"java.proxy('java.lang.Runnable',()=>{},{",'',uri);
    for(const name of ['callbackTimeoutMs','onError','signal','timeoutMs'])assert(callbackOptions.includes(name),`${file}: callback option ${name}`);
    const ttsHeader = directive + (runtime === 'node' ? "const tts=require('autojs6:tts');\n" : /\.tsx?$/.test(file) ? "declare const host: import('autojs6:bun-host').HostClient;const tts=host.tts;\n" : "/** @type {import('autojs6:bun-host').HostClient} */\nconst host={};const tts=host.tts;\n");
    const ttsMethods=query(service,ttsHeader+'tts.','',uri);
    for(const name of ['ready','voices','synthesis','speak','silenceTask','stopAll','configure','close'])assert(ttsMethods.includes(name),`${file}: TTS ${name}`);
    const taskHeader=ttsHeader+"async function run(){const task=await tts.synthesis('hello','out.wav');task.";
    for(const name of ['result','state','isDone','stop','cancel','on'])assert(query(service,taskHeader,'',uri).includes(name),`${file}: TTS task ${name}`);
    const audio=query(service,taskHeader+"on('audio',value=>{value.",'',uri);
    for(const name of ['data','id','chunk'])assert(audio.includes(name),`${file}: TTS audio ${name}`);
    const speechHeader=ttsHeader.replaceAll('tts','speech');
    const speechMethods=query(service,speechHeader+'speech.','',uri);
    for(const name of ['isAvailable','capabilities','recognize','recognizeAsync','detectVoice','listen','wake','synthesize','synthesizeAsync','speak','models','SpeechError','close'])
        assert(speechMethods.includes(name),`${file}: speech ${name}`);
    const speechModels=query(service,speechHeader+'speech.models.','',uri);
    for(const name of ['list','install','installAsync','importFile','remove','setDefault','getDefault','refreshCatalog'])
        assert(speechModels.includes(name),`${file}: speech.models.${name}`);
    const sessionHeader=speechHeader+"async function f(){const session=await speech.listen();session.";
    const sessionFields=query(service,sessionHeader,'',uri);
    for(const name of ['feed','stop','cancel','result','isActive','isEnded','state','on','off'])
        assert(sessionFields.includes(name),`${file}: speech session ${name}`);
    const recognitionEvent=query(service,sessionHeader+"on('final',value=>{value.",'',uri);
    for(const name of ['text','segmentIndex','startMillis','endMillis'])assert(recognitionEvent.includes(name),`${file}: speech final ${name}`);
    const modelOptions=query(service,speechHeader+"speech.models.install('model',{",'',uri);
    for(const name of ['acceptLicense','onProgress'])assert(modelOptions.includes(name),`${file}: speech install ${name}`);
    const aiHeader=ttsHeader.replaceAll('tts','ai');
    const aiMethods=query(service,aiHeader+'ai.','',uri);
    for(const name of ['ask','chat','stream','session','catalog','hasAccess','requestAccess','close','AiError'])assert(aiMethods.includes(name),file+': AI '+name);
    assert(aiMethods.includes('agent'),file+': AI Agent facade');
    const agentMethods=query(service,aiHeader+'ai.agent.','',uri);
    for(const name of ['run','create','get','list','catalog','presets','status','result','context','hasAccess','requestAccess','close'])
        assert(agentMethods.includes(name),file+': Agent '+name);
    const agentRunHeader=aiHeader+"async function f(){const run=await ai.agent.run('hello');run.";
    const agentRun=query(service,agentRunHeader,'',uri);
    for(const name of ['id','goal','state','startedAt','detached','error','result','on','once','off','respond','confirm','cancel','join'])
        assert(agentRun.includes(name),file+': AgentRun '+name);
    const agentInput=query(service,agentRunHeader+"on('input',event=>{event.",'',uri);
    for(const name of ['requestId','kind','question','choices','steps','readOnly','timeoutMs'])
        assert(agentInput.includes(name),file+': Agent input '+name);
    const agentOptions=query(service,aiHeader+"ai.agent.run('hello',{",'',uri);
    for(const name of ['target','tools','budget','confirm','interaction','detached','parameters','plan'])
        assert(agentOptions.includes(name),file+': Agent option '+name);
    const agentResult=query(service,aiHeader+"async function f(){const run=await ai.agent.run('hello');const result=await run.join();result.",'',uri);
    for(const name of ['status','summary','usage','error','unfinished'])assert(agentResult.includes(name),file+': Agent result '+name);
    const aiOptions=query(service,aiHeader+"ai.ask('hello',{",'',uri);
    for(const name of ['plugin','target','temperature','maxTokens','backend','timeout','reasoning','responseSchema'])assert(aiOptions.includes(name),file+': AI option '+name);
    const aiStream=query(service,aiHeader+"ai.stream('hello').",'',uri);
    for(const name of ['on','once','off','cancel','ready','result','state','isDone'])assert(aiStream.includes(name),file+': AI stream '+name);
    const aiDelta=query(service,aiHeader+"ai.stream('hello').on('delta',(text,chunk)=>{chunk.",'',uri);
    for(const name of ['text','reasoning','done'])assert(aiDelta.includes(name),file+': AI delta '+name);
    const aiSession=query(service,aiHeader+"async function f(){const session=await ai.session();session.",'',uri);
    for(const name of ['ask','chat','stream','close','provider','model','target','isClosed'])assert(aiSession.includes(name),file+': AI session '+name);
    const aiTarget=query(service,aiHeader+"async function f(){const catalog=await ai.catalog();catalog.targets[0].",'',uri);
    for(const name of ['id','locality','available','capabilities','backendProfiles'])assert(aiTarget.includes(name),file+': AI target '+name);
    const flowHeader=ttsHeader.replaceAll('tts','flow');
    const flowMethods=query(service,flowHeader+'flow.','',uri);
    for(const name of ['wait','waitAsync','waitUntil','waitForStable','waitForVisible','waitForHidden','Flow','FlowError','defaults','pending','repeatUntil'])assert(flowMethods.includes(name),file+': flow '+name);
    const flowChain=query(service,flowHeader+'flow.of(3).map(value=>value+1).','',uri);
    for(const name of ['then','catch','finally','retry','timeout','cancel','toPromise','value','state'])assert(flowChain.includes(name),file+': Flow chain '+name);
    for(const name of ['sync','await'])assert(!flowChain.includes(name),file+': unsupported Flow method '+name);
    for(const name of ['within','scope','press','swipe','gesture','gestures'])assert(flowChain.includes(name),file+': scoped Flow method '+name);
    const scopedText=query(service,flowHeader+"async function f(){const text=await flow.of(0).scope({resultType:'text'}).sleep(1).wait({text:'ready'});text.",'',uri);
    for(const name of ['toUpperCase','substring'])assert(scopedText.includes(name),file+': scoped string result '+name);
    const scopedPoints=query(service,flowHeader+"async function f(){const points=await flow.wait({text:'ready'},{resultType:'points'});points[0].",'',uri);
    for(const name of ['x','y'])assert(scopedPoints.includes(name),file+': scoped point result '+name);
    const scopeOptions=query(service,flowHeader+'flow.of(0).scope({','',uri);
    for(const name of ['root','compass','resultType'])assert(scopeOptions.includes(name),file+': scope option '+name);
    for(const name of ['click','performAction','typeInto','smartClick','collectList','toggle','waitForEvent','waitForNotification'])assert(flowChain.includes(name),file+': Flow tool chain '+name);
    for(const name of ['waitThenClick','clickWhenStableAfter','smartClick','findAny','scrollUntil','collectList','toggle','waitForIdle','waitForEvent','waitForToast','waitForNotification','dispose'])assert(flowMethods.includes(name),file+': Flow tool '+name);
    const clickOptions=query(service,flowHeader+"flow.smartClick({text:'ready'},{",'',uri);
    for(const name of ['gestureFallback','verify','verifyTimeout','climb','maxClimb','humanize','root'])assert(clickOptions.includes(name),file+': smart click options '+name);
    const notificationWait=query(service,flowHeader+"flow.waitForNotification({text:'ready'}).",'',uri);
    for(const name of ['ready','cancel','then','toPromise'])assert(notificationWait.includes(name),file+': event wait '+name);
    const toggleResult=query(service,flowHeader+"async function f(){const result=await flow.toggle({text:'ready'},true);result.",'',uri);
    for(const name of ['node','changed','checked','method'])assert(toggleResult.includes(name),file+': toggle result '+name);
    const flowNode=query(service,flowHeader+"async function f(){const node=await flow.wait({text:'ready'});node.",'',uri);
    for(const name of ['text','bounds','visibleToUser','packageName'])assert(flowNode.includes(name),file+': Flow node '+name);
    const flowOptions=query(service,flowHeader+'flow.waitForStable(()=>1,{','',uri);
    for(const name of ['timeout','interval','times','stableFor','snapshot','compare','missing','recoverService'])assert(flowOptions.includes(name),file+': Flow options '+name);
    const mailHeader=ttsHeader.replaceAll('tts','mail');
    const mailMethods=query(service,mailHeader+'mail.','',uri);
    for(const name of ['connect','connectAsync','setDefault','close','dispose','providers','accounts','watch','folder'])
        assert(mailMethods.includes(name),file+': mail '+name);
    for(const name of ['test','send','folders','folderStatus','createFolder','deleteFolder','renameFolder',
        'fetch','search','get','fetchBody','download','raw','setFlags','markRead','markUnread','flag','unflag',
        'move','copy','delete','expunge','append'])
        for(const suffix of ['', 'Async'])assert(mailMethods.includes(name+suffix),file+': mail '+name+suffix);
    const mailClientHeader=mailHeader+"async function f(){const client=await mail.connect('fixture');client.";
    const mailClient=query(service,mailClientHeader,'',uri);
    for(const name of ['account','isConnected','isClosed','get','watch','close'])assert(mailClient.includes(name),file+': mail client '+name);
    const mailMessage=query(service,mailClientHeader+"get(1).then(message=>{message.",'',uri);
    for(const name of ['uid','date','subject','attachments','load'])assert(mailMessage.includes(name),file+': mail result '+name);
    const mailAttachment=query(service,mailClientHeader+"get(1).then(message=>{message.attachments[0].",'',uri);
    for(const name of ['partId','uid','folder','download'])assert(mailAttachment.includes(name),file+': mail attachment '+name);
    const mailEvent=query(service,mailClientHeader+"watch().then(watch=>watch.on('message',(message,watch)=>{message.",'',uri);
    for(const name of ['uid','subject','load'])assert(mailEvent.includes(name),file+': mail event '+name);
    const mailOptions=query(service,mailHeader+'mail.connect({','',uri);
    for(const name of ['address','password','accessToken','tokenProvider','imap','smtp','timeout'])assert(mailOptions.includes(name),file+': mail options '+name);
    const epubHeader=ttsHeader.replaceAll('tts','epub');
    const epubMethods=query(service,epubHeader+'epub.','',uri);
    for(const name of ['open','metadata','toc','readingOrder','text','cover','search','annotations','read','isAvailable'])
        for(const suffix of ['', 'Async'])assert(epubMethods.includes(name+suffix),`${file}: EPUB ${name+suffix}`);
    const bookHeader=epubHeader+"async function f(){const book=await epub.open('book.epub');book.";
    const bookFields=query(service,bookHeader,'',uri);
    for(const name of ['metadata','toc','readingOrder','positions','text','textAll','cover','resource','search','annotations','close'])
        assert(bookFields.includes(name),`${file}: EPUB book ${name}`);
    const readerHeader=epubHeader+"async function f(){const reader=await epub.read('book.epub');reader.";
    const readerFields=query(service,readerHeader,'',uri);
    for(const name of ['goTo','next','prev','nextChapter','prevChapter','setPreferences','bookmarks','close','state','on'])
        assert(readerFields.includes(name),`${file}: EPUB reader ${name}`);
    const epubProgress=query(service,readerHeader+"on('progress',event=>{event.",'',uri);
    for(const name of ['locator','totalProgression','chapterTitle','href'])assert(epubProgress.includes(name),`${file}: EPUB progress ${name}`);
    const loaded = service.getState().rootLibraryUris;
    assert(!loaded.some(name => /\.core\.|\.extra\.|\.android\.|\.jsox-/.test(name)), `${file}: Rhino declarations leaked`);
    for (const useStatic of [false, true]) {
        assert(!query(service, directive + 'selector', 'selector', uri, useStatic).includes('selector'), `${file}: selector leaked`);
        for (const name of ['mail', '$mail', 'epub', '$epub', 'speech', '$speech', 'opencc', 'images', 'ui', 'compose']) {
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
        const dbHeader=file.endsWith('.mjs')?'import database from "autojs6:database";\n':'const database=require("autojs6:database");\n';
        const db=query(current,dbHeader+'async function f(){const db=await database.open("owned");db.','',documentUri);
        for(const name of ['id','name','exec','run','get','all','transaction','close'])assert(db.includes(name),`Worker database.${name}`);
        for(const [module,expected] of [['pinyin',['convert','simple','compact','STYLE_NORMAL','MODE_SURNAME']],['pinyin4j',['of','as','readings']],
            ['console',['show','hide','setTitle','log']],['screen_metrics',['cX','cY','cXy','cYx','setScaleBases']]]) {
            const code=file.endsWith('.mjs')?`import api from "autojs6:${module}";\napi.`:`const api=require("autojs6:${module}");\napi.`;
            const names=query(current,code,'',documentUri);
            for(const name of expected)assert(names.includes(name),`${file}: ${module}.${name} missing`);
        }
    } else if(file.endsWith('.bun.ts')) {
        for(const entry of ['host.database.open("owned")','host.sqlite({name:"owned"})']) {
            const db=query(current,header+`async function f(){const db=await ${entry};db.`,'',documentUri);
            for(const name of ['id','name','exec','run','get','all','transaction','close'])assert(db.includes(name),`Bun database.${name}`);
        }
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
    const deviceHeader=file.endsWith('.bun.ts')?header+'const device=host.device,dialogs=host.dialogs;\n':header+(file.endsWith('.mjs')?'import device from "autojs6:device";import dialogs from "autojs6:dialogs";\n':'const device=require("autojs6:device"),dialogs=require("autojs6:dialogs");\n');
    const deviceMethods=query(current,deviceHeader+'device.','',documentUri);
    for(const name of ['getInfo','getWidth','setBrightness','setBrightnessMode','keepScreenOn','cancelKeepingAwake','getMusicVolume','setMusicVolume','openBatteryOptimizationSettings'])assert(deviceMethods.includes(name),`${file}: device ${name}`);
    const dialogMethods=query(current,deviceHeader+'dialogs.','',documentUri);
    for(const name of ['alert','confirm','input','prompt','rawInput','select','singleChoice','multiChoice','progress'])assert(dialogMethods.includes(name),`${file}: dialogs ${name}`);
    const progressMembers=query(current,deviceHeader+'async function f(){const p=await dialogs.progress.show();p.','',documentUri);
    for(const name of ['id','shown','max','value','update','dismiss'])assert(progressMembers.includes(name),`${file}: progress ${name}`);
    const progressOptions=query(current,deviceHeader+'dialogs.progress.show({','',documentUri);
    for(const name of ['title','message','max','value','indeterminate'])assert(progressOptions.includes(name),`${file}: progress option ${name}`);
    const androidHeader=file.endsWith('.bun.ts')?header+'const android=host.android,tasks=host.tasks;\n':header+(file.endsWith('.mjs')?'import android from "autojs6:android";import tasks from "autojs6:tasks";\n':'const android=require("autojs6:android"),tasks=require("autojs6:tasks");\n');
    const androidMethods=query(current,androidHeader+'android.','',documentUri);
    for(const name of ['createPaint','createColorStateList','setPaintColor','getThemeColor','getUriForFile','parseUri'])assert(androidMethods.includes(name),`${file}: android ${name}`);
    const calendarMethods=query(current,androidHeader+'tasks.','',documentUri);
    for(const name of ['addDailyTask','addWeeklyTask','addMonthlyTask','addYearlyTask','addCountdownTask','addDisposableTask','addIntentTask','queryTimedTasks','queryIntentTasks','updateTask','removeTask','sendLocalBroadcastSync'])assert(calendarMethods.includes(name),`${file}: tasks ${name}`);
    const paintMembers=query(current,androidHeader+'async function f(){const paint=await android.createPaint();paint.','',documentUri);
    for(const name of ['id','color','getInfo','setColor','measureText','close','toJSON'])assert(paintMembers.includes(name),`${file}: Paint ${name}`);
    const calendarOptions=query(current,androidHeader+'tasks.addDailyTask({','',documentUri);
    for(const name of ['path','time','endMode','times','untilDate'])assert(calendarOptions.includes(name),`${file}: calendar option ${name}`);
    const intentOptions=query(current,androidHeader+'tasks.addIntentTask({','',documentUri);
    for(const name of ['path','action','category','dataType','local'])assert(intentOptions.includes(name),`${file}: intent option ${name}`);
    const taskMembers=query(current,androidHeader+'async function f(){const task=await tasks.addIntentTask({path:"child",action:"owned"});task.','',documentUri);
    for(const name of ['id','kind','path','lastIntent','options'])assert(taskMembers.includes(name),`${file}: IntentTask ${name}`);
    const eventsHeader=file.endsWith('.bun.ts')?header+'const events=host.events,notifications=host.notifications;\n':header+(file.endsWith('.mjs')?'import events from "autojs6:events";import notifications from "autojs6:notifications";\n':'const events=require("autojs6:events"),notifications=require("autojs6:notifications");\n');
    const eventMethods=query(current,eventsHeader+'events.','',documentUri);
    for(const name of ['observeBroadcasts','observeNotification','observeToast','observeKey','on','once','off','close'])assert(eventMethods.includes(name),`${file}: events ${name}`);
    const eventOptions=query(current,eventsHeader+'events.observeBroadcasts({','',documentUri);
    for(const name of ['drainIntervalMs','timeoutMs','signal'])assert(eventOptions.includes(name),`${file}: event option ${name}`);
    const eventSubscription=query(current,eventsHeader+'async function f(){const sub=await events.observeBroadcasts();sub.','',documentUri);
    for(const name of ['id','source','closed','on','once','off','drainEvents','close'])assert(eventSubscription.includes(name),`${file}: subscription ${name}`);
    const notificationMethods=query(current,eventsHeader+'notifications.','',documentUri);
    for(const name of ['notify','cancel','cancelAll','getPermissionStatus','openSettings','openNotificationSettings'])assert(notificationMethods.includes(name),`${file}: notifications ${name}`);
    const notificationOptions=query(current,eventsHeader+'notifications.notify({','',documentUri);
    for(const name of ['id','title','text','channel','channelName','ongoing','priority'])assert(notificationOptions.includes(name),`${file}: notification option ${name}`);
    const shellHeader=file.endsWith('.bun.ts')?header+'const shell=host.shell,shizuku=host.shizuku;\n':header+(file.endsWith('.mjs')?'import shell from "autojs6:shell";import shizuku from "autojs6:shizuku";\n':'const shell=require("autojs6:shell"),shizuku=require("autojs6:shizuku");\n');
    const shellMethods=query(current,shellHeader+'shell.','',documentUri);
    for(const name of ['exec','execRoot','execShizuku','execFile','checkAccess','getAccess','requestShizukuPermission','setDefaultTimeout','spawn','open'])assert(shellMethods.includes(name),`${file}: shell ${name}`);
    const processMembers=query(current,shellHeader+"const child=shell.spawn('cat');child.",'',documentUri);
    for(const name of ['ready','exited','stdout','stderr','stdin','pid','exitCode','readLine','writeLine','closeInput','waitFor','kill','close'])assert(processMembers.includes(name),`${file}: host shell process ${name}`);
    assert(!processMembers.includes('getInputStream'),`${file}: Java stream leaked`);
    const shellOptions=query(current,shellHeader+"shell.spawn('cat',{",'',documentUri);
    for(const name of ['root','shizuku','adb','pty','cwd','env','timeoutMs','signal','drainIntervalMs'])assert(shellOptions.includes(name),`${file}: shell option ${name}`);
    const shellResult=query(current,shellHeader+"async function f(){const result=await shell.exec('echo');result.",'',documentUri);
    for(const name of ['code','stdout','stderr','timedOut','truncated'])assert(shellResult.includes(name),`${file}: shell result ${name}`);
    const sensorHeader=file.endsWith('.bun.ts')?header+'const sensors=host.sensors;\n':header+(file.endsWith('.mjs')?'import sensors from "autojs6:sensors";\n':'const sensors=require("autojs6:sensors");\n');
    const sensorNames=query(current,sensorHeader+'sensors.','',documentUri);
    for(const name of ['policy','getAvailableSensors','once','subscribe'])assert(sensorNames.includes(name),`${file}: sensors ${name}`);
    const subscription=query(current,sensorHeader+"const sub=sensors.subscribe('light');sub.",'',documentUri);
    for(const name of ['id','type','closed','ready','on','once','off','close'])assert(subscription.includes(name),`${file}: subscription ${name}`);
    const sensorOptions=query(current,sensorHeader+"sensors.subscribe('light',undefined,{",'',documentUri);
    for(const name of ['signal','timeoutMs','samplingIntervalMs','intervalMs','maxQueueSize','drainIntervalMs'])assert(sensorOptions.includes(name),`${file}: sensor option ${name}`);
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
// Matrix entries (runtime-api-queries.json, generated from the host's runtime-matrix.json): every Node / Bun
// entry the matrix counts as covered must complete at the point of typing it, in its own route.
assert(fs.existsSync(queriesFile), `${queriesFile} is missing; run node tools/ace-lsp/generate-runtime-api-queries.mjs`);
const matrixQueries = JSON.parse(fs.readFileSync(queriesFile, 'utf8'));
assert.equal(matrixQueries.schema, 'autojs6-ace-runtime-queries-v1', `${queriesFile}: unexpected schema`);
const matrixRoutes = {
    node_main: { file: 'matrix-main.cjs', header: entry => `const api = require(${JSON.stringify(entry.module)});\n`, receiver: 'api' },
    node_worker: { file: 'matrix-worker.mjs', header: entry => `import api from ${JSON.stringify(entry.module)};\n`, receiver: 'api' },
    node_global: { file: 'matrix-global.cjs', header: () => '', receiver: entry => entry.global },
    bun: { file: 'matrix.bun.ts', header: () => 'declare const host: import("autojs6:bun-host").HostClient;\n',
        receiver: entry => entry.namespace ? `host.${entry.namespace}` : 'host' },
    // Returned-object members, on a value of the runtime handle type (Flow, MailClient, ShellProcess, ...).
    node_handle: { file: 'matrix-handle.cjs', receiver: 'handle',
        header: entry => `/** @type {import(${JSON.stringify(entry.module)}).${entry.type}} */\nconst handle = /** @type {any} */ (null);\n` },
    bun_handle: { file: 'matrix-handle.bun.ts', receiver: 'handle', header: entry => `declare const handle: import("autojs6:bun-host").${entry.type};\n` },
};
const matrixCounts = {};
const matrixFailures = [];
for (const [route, entries] of Object.entries(matrixQueries.routes)) {
    const spec = matrixRoutes[route];
    assert(spec, `${queriesFile}: unknown route ${route}`);
    const documentUri = `file:///autojs6/editor/${spec.file}`;
    const current = context.AutoJsAceTsLanguageService.create({ documentUri, libraryTextByUri: texts });
    const before = queries;
    for (const entry of entries) {
        const receiver = typeof spec.receiver === 'function' ? spec.receiver(entry) : spec.receiver;
        const label = `${route} ${receiver === 'api' ? entry.module : receiver === 'handle' ? entry.type : receiver}${entry.member === '()' ? '()' : '.' + entry.member} (${entry.rows.join(', ')})`;
        if (entry.member === '()') {
            // The module value itself is the callable entry: calling it must type-check.
            const text = spec.header(entry) + `${receiver}();\n`;
            queries++;
            if ((current.getDiagnostics({ getValue: () => text, getLine: row => text.split('\n')[row] || '' }, text) || []).some(item => item.raw === '2349'))
                matrixFailures.push(`${label}: not callable`);
            continue;
        }
        const parts = entry.member.split('.');
        const name = parts.pop();
        const access = [receiver, ...parts].join('.') + '.';
        const names = query(current, spec.header(entry) + access + name, name, documentUri);
        if (!names.includes(name)) matrixFailures.push(`${label}: no completion for ${name}`);
    }
    matrixCounts[route] = queries - before;
    current.dispose();
}
matrixCounts.total = Object.values(matrixCounts).reduce((sum, count) => sum + count, 0);
assert.equal(matrixFailures.length, 0, `${matrixFailures.length} matrix entries do not complete:\n` + matrixFailures.slice(0, 40).join('\n')
    + (matrixFailures.length > 40 ? `\n... and ${matrixFailures.length - 40} more` : ''));
console.log(JSON.stringify({ typescript: ts.version, routeCases: routes.length, queries,
    matrixQueries: matrixCounts, matrixRows: matrixQueries.counts.rows, lspDeclarations: temporary ? 'temporary' : 'build',
    isolatedRuntimeDeclarations: true, copiedDeclarations: Object.keys(manifest.files).length, newApiChecks }, null, 2));
