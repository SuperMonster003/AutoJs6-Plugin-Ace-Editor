import { CancellationToken, MarkupKind } from 'vscode-languageserver';

import { AnalyzerService } from 'pyright-internal/analyzer/service';
import { ConfigOptions, PythonPlatform } from 'pyright-internal/common/configOptions';
import { NullConsole } from 'pyright-internal/common/console';
import { PyrightDocStringService } from 'pyright-internal/common/docStringService';
import { NoAccessHost } from 'pyright-internal/common/host';
import { getDirectoryPath } from 'pyright-internal/common/pathUtils';
import { pythonVersion3_12 } from 'pyright-internal/common/pythonVersion';
import { ServiceProvider } from 'pyright-internal/common/serviceProvider';
import { Uri } from 'pyright-internal/common/uri/uri';
import { UriEx } from 'pyright-internal/common/uri/uriUtils';
import { CompletionOptions, CompletionProvider } from 'pyright-internal/languageService/completionProvider';
import { DefinitionFilter, DefinitionProvider } from 'pyright-internal/languageService/definitionProvider';
import { HoverProvider } from 'pyright-internal/languageService/hoverProvider';
import { SignatureHelpProvider } from 'pyright-internal/languageService/signatureHelpProvider';
import { convertFromPyrightDiagnostic } from 'pyright-internal/typeServer/diagnosticUtils';
import { TestFileSystem } from 'pyright-internal/tests/harness/vfs/filesystem';

import typeshedFiles from './autojs6-python-typeshed.json';

type JsonRpcId = number | string;
type Position = { line: number; character: number };
type TextChange = { range?: { start: Position; end: Position }; text?: string };

interface JsonRpcMessage {
    jsonrpc?: string;
    id?: JsonRpcId;
    method?: string;
    params?: any;
}

interface OpenDocument {
    uri: string;
    version: number;
    text: string;
}

const workerScope = self as DedicatedWorkerGlobalScope;
const WORKSPACE_PATH = '/workspace';
const TYPESHED_PATH = '/typeshed-fallback';

function post(message: unknown) {
    workerScope.postMessage(message);
}

function response(id: JsonRpcId, result: unknown) {
    post({ jsonrpc: '2.0', id, result });
}

function responseError(id: JsonRpcId, error: unknown) {
    const message = error instanceof Error ? error.message : String(error || 'unknown worker error');
    post({ jsonrpc: '2.0', id, error: { code: -32603, message } });
}

function offsetAt(text: string, position: Position): number {
    const targetLine = Math.max(0, Number(position?.line) || 0);
    const targetCharacter = Math.max(0, Number(position?.character) || 0);
    let offset = 0;
    let line = 0;
    while (line < targetLine && offset < text.length) {
        const next = text.indexOf('\n', offset);
        if (next < 0) {
            return text.length;
        }
        offset = next + 1;
        line++;
    }
    return Math.min(text.length, offset + targetCharacter);
}

function applyChanges(text: string, changes: TextChange[]): string {
    for (const change of changes || []) {
        const next = String(change?.text || '');
        if (!change?.range) {
            text = next;
            continue;
        }
        const start = offsetAt(text, change.range.start);
        const end = offsetAt(text, change.range.end);
        text = text.slice(0, start) + next + text.slice(Math.max(start, end));
    }
    return text;
}

function internalFilePath(uri: string): string {
    const clean = String(uri || '').split(/[?#]/, 1)[0];
    const encodedName = clean.slice(Math.max(clean.lastIndexOf('/'), clean.lastIndexOf('\\')) + 1);
    let fileName = encodedName || 'main.py';
    try {
        fileName = decodeURIComponent(fileName);
    } catch {
        // Keep the encoded but safe final path component.
    }
    fileName = fileName.replace(/[^A-Za-z0-9_.-]/g, '_');
    return `${WORKSPACE_PATH}/${fileName || 'main.py'}`;
}

class PythonEngine {
    private readonly fs: TestFileSystem;
    private readonly configOptions: ConfigOptions;
    private readonly service: AnalyzerService;
    private readonly documents = new Map<string, OpenDocument>();

    constructor() {
        this.fs = new TestFileSystem(false, { cwd: '/' });
        this.fs.mkdirpSync(WORKSPACE_PATH);
        this.fs.mkdirpSync(TYPESHED_PATH);

        for (const [relativePath, content] of Object.entries(typeshedFiles as Record<string, string>)) {
            const path = `${TYPESHED_PATH}/${relativePath.replace(/^\/+/, '')}`;
            this.fs.mkdirpSync(getDirectoryPath(path));
            this.fs.writeFileSync(UriEx.file(path), content, 'utf8');
        }

        const workspaceUri = UriEx.file(WORKSPACE_PATH);
        this.configOptions = new ConfigOptions(workspaceUri);
        this.configOptions.typeshedPath = UriEx.file(TYPESHED_PATH);
        this.configOptions.defaultPythonVersion = pythonVersion3_12;
        this.configOptions.defaultPythonPlatform = PythonPlatform.Android;
        this.configOptions.checkOnlyOpenFiles = true;
        this.configOptions.useLibraryCodeForTypes = false;
        this.configOptions.autoImportCompletions = false;
        this.configOptions.skipNativeLibraries = true;

        this.service = new AnalyzerService('autojs6-python', new ServiceProvider(), {
            console: new NullConsole(),
            hostFactory: () => new NoAccessHost(),
            configOptions: this.configOptions,
            fileSystem: this.fs,
            libraryReanalysisTimeProvider: () => 0,
            shouldRunAnalysis: () => true,
        });
    }

    private uri(externalUri: string): Uri {
        return Uri.file(internalFilePath(externalUri), this.fs);
    }

    private analyze() {
        while (this.service.test_program.analyze()) {
            // Exhaust the synchronous foreground analyzer queue inside the Worker.
        }
    }

    open(document: OpenDocument) {
        const normalized = { ...document, text: String(document.text || '') };
        this.documents.set(document.uri, normalized);
        const uri = this.uri(document.uri);
        this.service.setFileOpened(uri, normalized.version, normalized.text);
        this.service.test_program.setTrackedFiles([uri]);
        this.analyze();
        this.publishDiagnostics(document.uri);
    }

    change(params: any) {
        const externalUri = String(params?.textDocument?.uri || '');
        const document = this.documents.get(externalUri);
        if (!document) {
            throw new Error(`Document is not open: ${externalUri}`);
        }
        document.text = applyChanges(document.text, params?.contentChanges || []);
        document.version = Number(params?.textDocument?.version) || document.version + 1;
        this.service.updateOpenFileContents(this.uri(externalUri), document.version, document.text);
        this.analyze();
        this.publishDiagnostics(externalUri);
    }

    close(externalUri: string) {
        if (!this.documents.has(externalUri)) {
            return;
        }
        this.documents.delete(externalUri);
        this.service.setFileClosed(this.uri(externalUri));
        if (this.documents.size === 0) {
            this.service.test_program.setTrackedFiles([]);
        }
    }

    completion(externalUri: string, position: Position) {
        this.analyze();
        const options: CompletionOptions = {
            format: MarkupKind.Markdown,
            snippet: true,
            lazyEdit: false,
        };
        return new CompletionProvider(
            this.service.test_program,
            this.uri(externalUri),
            position,
            options,
            CancellationToken.None
        ).getCompletions();
    }

    hover(externalUri: string, position: Position) {
        this.analyze();
        return new HoverProvider(
            this.service.test_program,
            this.uri(externalUri),
            position,
            MarkupKind.Markdown,
            CancellationToken.None
        ).getHover();
    }

    signatureHelp(externalUri: string, position: Position) {
        this.analyze();
        return new SignatureHelpProvider(
            this.service.test_program,
            this.uri(externalUri),
            position,
            MarkupKind.Markdown,
            true,
            true,
            undefined,
            new PyrightDocStringService(),
            CancellationToken.None
        ).getSignatureHelp();
    }

    definition(externalUri: string, position: Position) {
        this.analyze();
        return (
            new DefinitionProvider(
                this.service.test_program,
                this.uri(externalUri),
                position,
                DefinitionFilter.All,
                CancellationToken.None
            ).getDefinitions() || []
        ).map((definition) => ({
            uri: this.externalUri(externalUri, definition.uri),
            range: definition.range,
        }));
    }

    publishDiagnostics(externalUri: string) {
        this.analyze();
        const target = this.uri(externalUri);
        const sourceFile = this.service.test_program.getSourceFileInfo(target)?.sourceFile;
        const diagnostics = (sourceFile?.getDiagnostics(this.configOptions) || [])
            .map((diagnostic) => convertFromPyrightDiagnostic(diagnostic, this.fs, true, false))
            .filter((diagnostic) => diagnostic !== undefined);
        post({
            jsonrpc: '2.0',
            method: 'textDocument/publishDiagnostics',
            params: {
                uri: externalUri,
                version: this.documents.get(externalUri)?.version,
                diagnostics,
            },
        });
    }

    documentCount() {
        return this.documents.size;
    }

    dispose() {
        this.documents.clear();
        this.service.dispose();
        this.fs.dispose();
    }

    private externalUri(currentExternalUri: string, target: Uri) {
        const currentInternal = this.uri(currentExternalUri);
        return target.equals(currentInternal) ? currentExternalUri : target.toString();
    }
}

let engine: PythonEngine | undefined;
let shuttingDown = false;

function ensureEngine() {
    if (!engine) {
        engine = new PythonEngine();
    }
    return engine;
}

function requestTextDocument(params: any) {
    return {
        uri: String(params?.textDocument?.uri || ''),
        position: {
            line: Math.max(0, Number(params?.position?.line) || 0),
            character: Math.max(0, Number(params?.position?.character) || 0),
        },
    };
}

workerScope.addEventListener('message', (event: MessageEvent<JsonRpcMessage>) => {
    const message = event.data || {};
    const method = String(message.method || '');
    try {
        if (method === 'initialize' && message.id !== undefined) {
            const startedAt = performance.now();
            ensureEngine();
            response(message.id, {
                capabilities: {
                    textDocumentSync: 1,
                    completionProvider: { resolveProvider: false, triggerCharacters: ['.'] },
                    hoverProvider: true,
                    signatureHelpProvider: { triggerCharacters: ['(', ','] },
                    definitionProvider: true,
                },
                serverInfo: {
                    name: 'AutoJs6 Pyright Worker',
                    version: '1.1.413',
                },
                autojs6: {
                    pythonVersion: '3.12',
                    typeshedFileCount: Object.keys(typeshedFiles).length,
                    initializationMs: performance.now() - startedAt,
                },
            });
            return;
        }
        if (method === 'initialized') {
            return;
        }
        if (method === 'textDocument/didOpen') {
            const document = message.params?.textDocument;
            ensureEngine().open({
                uri: String(document?.uri || ''),
                version: Number(document?.version) || 1,
                text: String(document?.text || ''),
            });
            return;
        }
        if (method === 'textDocument/didChange') {
            ensureEngine().change(message.params);
            return;
        }
        if (method === 'textDocument/didClose') {
            ensureEngine().close(String(message.params?.textDocument?.uri || ''));
            return;
        }
        if (method === 'textDocument/completion' && message.id !== undefined) {
            const request = requestTextDocument(message.params);
            response(message.id, ensureEngine().completion(request.uri, request.position));
            return;
        }
        if (method === 'textDocument/hover' && message.id !== undefined) {
            const request = requestTextDocument(message.params);
            response(message.id, ensureEngine().hover(request.uri, request.position));
            return;
        }
        if (method === 'textDocument/signatureHelp' && message.id !== undefined) {
            const request = requestTextDocument(message.params);
            response(message.id, ensureEngine().signatureHelp(request.uri, request.position));
            return;
        }
        if (method === 'textDocument/definition' && message.id !== undefined) {
            const request = requestTextDocument(message.params);
            response(message.id, ensureEngine().definition(request.uri, request.position));
            return;
        }
        if (method === 'autojs6/status' && message.id !== undefined) {
            const workerMemory = (performance as Performance & {
                memory?: { usedJSHeapSize?: number; totalJSHeapSize?: number; jsHeapSizeLimit?: number };
            }).memory;
            response(message.id, {
                initialized: !!engine,
                documentCount: engine?.documentCount() || 0,
                pythonVersion: '3.12',
                pyrightVersion: '1.1.413',
                typeshedFileCount: Object.keys(typeshedFiles).length,
                shuttingDown,
                memory: workerMemory
                    ? {
                          usedJSHeapSize: Number(workerMemory.usedJSHeapSize) || 0,
                          totalJSHeapSize: Number(workerMemory.totalJSHeapSize) || 0,
                          jsHeapSizeLimit: Number(workerMemory.jsHeapSizeLimit) || 0,
                      }
                    : null,
            });
            return;
        }
        if (method === 'shutdown' && message.id !== undefined) {
            shuttingDown = true;
            response(message.id, null);
            return;
        }
        if (method === 'exit') {
            engine?.dispose();
            engine = undefined;
            workerScope.close();
            return;
        }
        if (method === '$/cancelRequest') {
            return;
        }
        if (message.id !== undefined) {
            post({ jsonrpc: '2.0', id: message.id, error: { code: -32601, message: `Method not found: ${method}` } });
        }
    } catch (error) {
        if (message.id !== undefined) {
            responseError(message.id, error);
        } else if (!shuttingDown) {
            post({ jsonrpc: '2.0', method: 'window/logMessage', params: { type: 1, message: String(error) } });
        }
    }
});
