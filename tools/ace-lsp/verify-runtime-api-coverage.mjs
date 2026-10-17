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
        for (const name of ['speech', '$speech', 'opencc', 'images']) {
            assert(!query(service, directive + name, name, uri, useStatic).includes(name), `${file}: Rhino global ${name} leaked`);
        }
        assert(!query(service, directive + 'jsox.extendAll();\nMath.su', 'su', uri, useStatic).includes('sum'), `${file}: JSOX leaked`);
    }
    service.dispose();
}
const uri = 'file:///autojs6/editor/main.js';
const service = context.AutoJsAceTsLanguageService.create({ documentUri: uri, libraryTextByUri: texts });
for (const [source, prefix, expected] of [
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
const commonImages = ['fromBase64', 'fromBytes', 'toBase64', 'toBytes', 'pixel', 'readPixels', 'copy', 'scale',
    'rotate', 'flip', 'blur', 'gaussianBlur', 'medianBlur', 'invert', 'detectsColor', 'findAllPointsForColor',
    'requestScreenCapture', 'captureScreen', 'stopScreenCapture'];
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
    assert(!imageNames.includes('detectAndComputeFeatures'), `${file}: unimplemented Rhino feature API leaked`);
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
    newApiChecks.push({ file, openccMethods: new Set(openccMethods).size, imageMethods: commonImages.length });
    current.dispose();
}
console.log(JSON.stringify({ typescript: ts.version, routeCases: routes.length, queries,
    isolatedRuntimeDeclarations: true, copiedDeclarations: Object.keys(manifest.files).length, newApiChecks }, null, 2));
