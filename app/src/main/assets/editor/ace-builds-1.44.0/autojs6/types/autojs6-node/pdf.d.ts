/**
 * Rhino's pdf module (3-Paper PDF) for Node main threads and Workers, over the host's pdf bridge (host 6.8.1 or later
 * with the 3-Paper PDF plugin). Every member answers a Promise with a non-enumerable `cancel()`; the `xxxAsync` names
 * are the same calls. Codes, options and defaults are those of Rhino's pdf: paths follow the working directory of the
 * script, default outputs go to `Documents/3-Paper PDF` and results carry the real path. Capabilities per call: reading
 * needs files; writing methods, `renderToFile`, `extractImages`, `save` and `render` without `encoding: 'base64'` also
 * need files.write; `text` with `ocr` true or `'always'` also needs ocr; `view` and viewer sessions need files and ui.
 */
declare module "pdf" {
  namespace pdf {
    /** A call in progress: `cancel()` (or an abort of `options.signal`) answers true when it stopped a running call, which then rejects with CANCELLED. */
    type PdfPromise<T> = Promise<T> & { cancel(): boolean };

    /** `'1-3,5,8-'`, a page number (from 1) or a list of both. */
    type PageRange = string | number | Array<number | string>;

    interface Progress {
        readonly opId: number;
        readonly percent: number;
        readonly stage: string;
        readonly current: number;
        readonly total: number;
    }

    /** `AbortController#signal` or `AbortSignal.timeout(ms)`. */
    interface AbortSignalLike {
        readonly aborted: boolean;
        readonly reason?: unknown;
        addEventListener(type: 'abort', listener: () => void, options?: { once?: boolean }): void;
        removeEventListener(type: 'abort', listener: () => void): void;
    }

    /**
     * A throwing or rejecting `onProgress` cancels the call, which rejects with that error. An abort of `signal` is the
     * call's `cancel()`, and a signal aborted already rejects at once: both reject with CANCELLED whose `cause` is the
     * abort's reason. `timeoutMs` is `signal: AbortSignal.timeout(timeoutMs)` beside `signal`: whichever comes first
     * cancels the call, and an expired timeout rejects with CANCELLED whose `cause` is the TimeoutError DOMException of
     * `AbortSignal.timeout`. Both apply until the call settles (for `open` and `view`, until the document or the viewer is
     * ready); the methods of a viewer session leave both alone.
     */
    interface ProgressOptions {
        onProgress?: ((progress: Progress) => unknown) | null;
        signal?: AbortSignalLike | null;
        /** Milliseconds, more than 0 and at most 2147483647; a fraction rounds up. */
        timeoutMs?: number | null;
    }

    interface PasswordOptions extends ProgressOptions {
        password?: string;
    }

    /** The codes of the 3-Paper PDF contract (appendix C.3); a call without a declared capability rejects with ERR_AUTOJS6_CAPABILITY_NOT_DECLARED. */
    type ErrorCode =
        | 'PLUGIN_UNAVAILABLE'
        | 'PLUGIN_DISABLED'
        | 'PLUGIN_INCOMPATIBLE'
        | 'INVALID_ARGUMENT'
        | 'FILE_NOT_FOUND'
        | 'INVALID_PDF'
        | 'PASSWORD_REQUIRED'
        | 'WRONG_PASSWORD'
        | 'PERMISSION_DENIED'
        | 'PAGE_OUT_OF_RANGE'
        | 'LIMIT_EXCEEDED'
        | 'SESSION_CLOSED'
        | 'UI_REQUIRES_FOREGROUND'
        | 'OCR_UNAVAILABLE'
        | 'STORAGE_PERMISSION_DENIED'
        | 'CANCELLED'
        | 'TIMEOUT'
        | 'UNSUPPORTED'
        | 'IO_ERROR'
        | 'INTERNAL';

    /** `name` is `'PdfError'`; `toString()` yields `PdfError [CODE]: message`; only `code` is enumerable. */
    interface PdfError extends Error {
        readonly name: 'PdfError';
        readonly code: ErrorCode | string;
        readonly cause?: unknown;
    }

    interface PdfErrorConstructor {
        (message?: string, code?: ErrorCode | string, cause?: unknown): PdfError;
        new(message?: string, code?: ErrorCode | string, cause?: unknown): PdfError;
        readonly prototype: PdfError;
    }

    interface PageInfo {
        readonly width: number | null;
        readonly height: number | null;
        readonly rotation: number;
    }

    interface Permissions {
        readonly print: boolean;
        readonly copy: boolean;
        readonly modify: boolean;
        readonly annotate: boolean;
        readonly fillForms: boolean;
        readonly extractForAccessibility: boolean;
        readonly assemble: boolean;
        readonly printHighQuality: boolean;
    }

    interface PdfInfo {
        readonly pageCount: number;
        readonly pages: PageInfo[];
        readonly title: string | null;
        readonly author: string | null;
        readonly subject: string | null;
        readonly keywords: string | null;
        readonly creator: string | null;
        readonly producer: string | null;
        readonly creationDate: string | null;
        readonly modificationDate: string | null;
        readonly version: string | null;
        readonly encrypted: boolean;
        readonly permissions: Permissions;
        readonly sizeBytes: number | null;
    }

    /** The pages of the request in order, with whether each text came from the text layer or from OCR. */
    interface TextResult {
        readonly texts: string[];
        readonly pages: number[];
        readonly sources: Array<'text' | 'ocr'>;
    }

    interface OutlineItem {
        readonly title: string;
        /** Null when the entry has no page destination. */
        readonly page: number | null;
        readonly level: number;
        readonly children: OutlineItem[];
    }

    /** `rect` is the union of `rects` (`[left, top, right, bottom]` in points); a hit that wraps lines has several rects. */
    interface SearchHit {
        readonly page: number;
        readonly rect: number[] | null;
        readonly rects: number[][];
        readonly context: string;
    }

    interface ImageInfo {
        readonly page: number;
        /** From 0 inside its page. */
        readonly index: number;
        readonly width: number;
        readonly height: number;
        readonly format: string | null;
    }

    /** A written PDF file. */
    interface PdfResult {
        readonly path: string;
        readonly pageCount: number;
        readonly sizeBytes: number | null;
        readonly warnings: string[];
    }

    interface PathsResult {
        readonly paths: string[];
        readonly warnings: string[];
    }

    interface RenderedFile {
        readonly path: string;
        readonly width: number;
        readonly height: number;
        readonly format: string;
        readonly sizeBytes: number | null;
    }

    /** `render` with `encoding: 'base64'`: the encoded image (at most 16 MiB, else LIMIT_EXCEEDED). */
    interface RenderedBase64 {
        readonly base64: string;
        readonly width: number;
        readonly height: number;
        readonly format: string;
        readonly sizeBytes: number;
    }

    interface TextOptions extends PasswordOptions {
        pages?: PageRange;
        layout?: boolean;
        /** `true` recognizes pages without a text layer, `'always'` every page (needs the ocr capability). */
        ocr?: boolean | 'always';
        ocrDpi?: number;
        ocrOptions?: object;
    }

    interface SearchOptions extends PasswordOptions {
        pages?: PageRange;
        caseSensitive?: boolean;
        wholeWord?: boolean;
        limit?: number;
    }

    /** At most one of `dpi` (144 by default), `scale`, `width` and `height`. */
    interface RenderOptions extends PasswordOptions {
        dpi?: number;
        scale?: number;
        width?: number;
        height?: number;
        transparent?: boolean;
    }

    /**
     * `render` writes a PNG to `<cwd>/.pdf-render/` by default; `output` names the file, `encoding: 'base64'` answers the
     * image instead of writing it (the two exclude each other).
     */
    interface ModuleRenderOptions extends RenderOptions {
        output?: string;
        encoding?: 'base64';
    }

    interface RenderToFileOptions extends RenderOptions {
        format?: 'png' | 'jpeg' | 'jpg' | 'webp';
        quality?: number;
    }

    interface PagesOptions extends PasswordOptions {
        pages?: PageRange;
    }

    interface ExtractImagesOptions extends PagesOptions {
        /** Placeholders `{name}`, `{page}` and `{index}`. */
        namePattern?: string;
    }

    interface MergeOptions extends ProgressOptions {
        outline?: string;
        /** One per input, null for an input without a password. */
        passwords?: Array<string | null>;
        /**
         * One outline title per input, null for the file name without `.pdf` (what an absent option gives); a blank name
         * takes the document's title. Names past the size limit of the options reject with LIMIT_EXCEEDED.
         */
        displayNames?: Array<string | null>;
    }

    interface SplitOptions extends PasswordOptions {
        ranges?: PageRange[];
        every?: number;
        /** Placeholders `{name}` and `{index}`. */
        namePattern?: string;
    }

    interface RotateOptions extends PasswordOptions {
        pages?: PageRange;
    }

    type PageSize = string | [number, number];

    interface FromImagesOptions extends ProgressOptions {
        pageSize?: PageSize;
        margin?: number;
        fit?: string;
        orientation?: string;
        /** 1 to 100, or `'lossless'`. */
        quality?: number | 'lossless';
    }

    interface FromTextOptions extends ProgressOptions {
        pageSize?: PageSize;
        margin?: number;
        fontSize?: number;
        lineSpacing?: number;
        title?: string;
        fontPath?: string;
    }

    interface FromHtmlOptions extends ProgressOptions {
        pageSize?: PageSize;
        margin?: number;
        baseUrl?: string;
        timeout?: number;
        /** Whether the scripts of the page run (default true); remote requests stay unanswered either way. */
        javaScript?: boolean;
    }

    interface EncryptOptions extends PasswordOptions {
        userPassword?: string;
        ownerPassword?: string;
        /** Names of granted permissions, or `{ print: true, copy: false, ... }`. */
        permissions?: Array<keyof Permissions> | Partial<Record<keyof Permissions, boolean>>;
        keyLength?: 128 | 256;
    }

    interface SaveOptions extends PasswordOptions {
        pages?: PageRange;
        delete?: PageRange;
        order?: number[];
        rotate?: number | { degrees: number, pages?: PageRange };
    }

    interface ViewOptions extends ProgressOptions {
        page?: number;
        search?: string;
        password?: string;
    }

    /** The output argument may be left out (or null) for the default output. */
    type Output = string | null | undefined;

    interface API {
        readonly PdfError: PdfErrorConstructor;
        /** Whether the 3-Paper PDF plugin is installed, enabled and compatible. */
        isAvailable(): PdfPromise<boolean>;
        isAvailableAsync(): PdfPromise<boolean>;
        info(path: string, options?: PasswordOptions | null): PdfPromise<PdfInfo>;
        infoAsync(path: string, options?: PasswordOptions | null): PdfPromise<PdfInfo>;
        text(path: string, options?: TextOptions | null): PdfPromise<TextResult>;
        textAsync(path: string, options?: TextOptions | null): PdfPromise<TextResult>;
        outline(path: string, options?: PasswordOptions | null): PdfPromise<OutlineItem[]>;
        outlineAsync(path: string, options?: PasswordOptions | null): PdfPromise<OutlineItem[]>;
        search(path: string, keyword: string, options?: SearchOptions | null): PdfPromise<SearchHit[]>;
        searchAsync(path: string, keyword: string, options?: SearchOptions | null): PdfPromise<SearchHit[]>;
        render(path: string, page: number, options: ModuleRenderOptions & { encoding: 'base64' }): PdfPromise<RenderedBase64>;
        render(path: string, page: number, options?: ModuleRenderOptions | null): PdfPromise<RenderedFile>;
        renderAsync(path: string, page: number, options: ModuleRenderOptions & { encoding: 'base64' }): PdfPromise<RenderedBase64>;
        renderAsync(path: string, page: number, options?: ModuleRenderOptions | null): PdfPromise<RenderedFile>;
        renderToFile(path: string, page: number, output?: Output, options?: RenderToFileOptions | null): PdfPromise<RenderedFile>;
        renderToFileAsync(path: string, page: number, output?: Output, options?: RenderToFileOptions | null): PdfPromise<RenderedFile>;
        images(path: string, options?: PagesOptions | null): PdfPromise<ImageInfo[]>;
        imagesAsync(path: string, options?: PagesOptions | null): PdfPromise<ImageInfo[]>;
        extractImages(path: string, outputDir?: Output, options?: ExtractImagesOptions | null): PdfPromise<PathsResult>;
        extractImagesAsync(path: string, outputDir?: Output, options?: ExtractImagesOptions | null): PdfPromise<PathsResult>;
        merge(inputs: string[], output?: Output, options?: MergeOptions | null): PdfPromise<PdfResult>;
        mergeAsync(inputs: string[], output?: Output, options?: MergeOptions | null): PdfPromise<PdfResult>;
        split(path: string, outputDir: Output, options: SplitOptions): PdfPromise<PathsResult>;
        split(path: string, options: SplitOptions): PdfPromise<PathsResult>;
        splitAsync(path: string, outputDir: Output, options: SplitOptions): PdfPromise<PathsResult>;
        splitAsync(path: string, options: SplitOptions): PdfPromise<PathsResult>;
        extract(path: string, output: Output, pages: PageRange, options?: PasswordOptions | null): PdfPromise<PdfResult>;
        extract(path: string, pages: PageRange, options?: PasswordOptions | null): PdfPromise<PdfResult>;
        extractAsync(path: string, output: Output, pages: PageRange, options?: PasswordOptions | null): PdfPromise<PdfResult>;
        extractAsync(path: string, pages: PageRange, options?: PasswordOptions | null): PdfPromise<PdfResult>;
        delete(path: string, output: Output, pages: PageRange, options?: PasswordOptions | null): PdfPromise<PdfResult>;
        delete(path: string, pages: PageRange, options?: PasswordOptions | null): PdfPromise<PdfResult>;
        deleteAsync(path: string, output: Output, pages: PageRange, options?: PasswordOptions | null): PdfPromise<PdfResult>;
        deleteAsync(path: string, pages: PageRange, options?: PasswordOptions | null): PdfPromise<PdfResult>;
        reorder(path: string, output: Output, order: number[], options?: PasswordOptions | null): PdfPromise<PdfResult>;
        reorder(path: string, order: number[], options?: PasswordOptions | null): PdfPromise<PdfResult>;
        reorderAsync(path: string, output: Output, order: number[], options?: PasswordOptions | null): PdfPromise<PdfResult>;
        reorderAsync(path: string, order: number[], options?: PasswordOptions | null): PdfPromise<PdfResult>;
        /** `degrees` is a multiple of 90. */
        rotate(path: string, output: Output, degrees: number, options?: RotateOptions | null): PdfPromise<PdfResult>;
        rotate(path: string, degrees: number, options?: RotateOptions | null): PdfPromise<PdfResult>;
        rotateAsync(path: string, output: Output, degrees: number, options?: RotateOptions | null): PdfPromise<PdfResult>;
        rotateAsync(path: string, degrees: number, options?: RotateOptions | null): PdfPromise<PdfResult>;
        fromImages(images: string[], output?: Output, options?: FromImagesOptions | null): PdfPromise<PdfResult>;
        fromImagesAsync(images: string[], output?: Output, options?: FromImagesOptions | null): PdfPromise<PdfResult>;
        fromText(text: string, output?: Output, options?: FromTextOptions | null): PdfPromise<PdfResult>;
        fromTextAsync(text: string, output?: Output, options?: FromTextOptions | null): PdfPromise<PdfResult>;
        /** A string containing `<` is HTML, any other string a path; remote URLs are not loaded. */
        fromHtml(htmlOrPath: string, output?: Output, options?: FromHtmlOptions | null): PdfPromise<PdfResult>;
        fromHtmlAsync(htmlOrPath: string, output?: Output, options?: FromHtmlOptions | null): PdfPromise<PdfResult>;
        /** Needs `userPassword` or `ownerPassword`; AES-256 by default. */
        encrypt(path: string, output: Output, options: EncryptOptions): PdfPromise<PdfResult>;
        encrypt(path: string, options: EncryptOptions): PdfPromise<PdfResult>;
        encryptAsync(path: string, output: Output, options: EncryptOptions): PdfPromise<PdfResult>;
        encryptAsync(path: string, options: EncryptOptions): PdfPromise<PdfResult>;
        decrypt(path: string, output?: Output, options?: PasswordOptions | null): PdfPromise<PdfResult>;
        decryptAsync(path: string, output?: Output, options?: PasswordOptions | null): PdfPromise<PdfResult>;
        /** Keeps the document open in the plugin until `close()` or the end of the execution (8 per script at most). */
        open(path: string, options?: PasswordOptions | null): PdfPromise<PdfDocument>;
        openAsync(path: string, options?: PasswordOptions | null): PdfPromise<PdfDocument>;
        /** Opens the plugin's viewer; an open session keeps the script alive until its `close` event. */
        view(path: string, options?: ViewOptions | null): PdfPromise<PdfViewSession>;
        viewAsync(path: string, options?: ViewOptions | null): PdfPromise<PdfViewSession>;
    }

    /** Calls after `close()` reject with SESSION_CLOSED. */
    interface PdfDocument {
        readonly path: string;
        readonly pageCount: number;
        readonly isClosed: boolean;
        info(): PdfPromise<PdfInfo>;
        infoAsync(): PdfPromise<PdfInfo>;
        pageSize(page: number): PdfPromise<PageInfo>;
        pageSizeAsync(page: number): PdfPromise<PageInfo>;
        text(pagesOrOptions?: PageRange | TextOptions | null): PdfPromise<TextResult>;
        textAsync(pagesOrOptions?: PageRange | TextOptions | null): PdfPromise<TextResult>;
        outline(): PdfPromise<OutlineItem[]>;
        outlineAsync(): PdfPromise<OutlineItem[]>;
        search(keyword: string, options?: SearchOptions | null): PdfPromise<SearchHit[]>;
        searchAsync(keyword: string, options?: SearchOptions | null): PdfPromise<SearchHit[]>;
        render(page: number, options: ModuleRenderOptions & { encoding: 'base64' }): PdfPromise<RenderedBase64>;
        render(page: number, options?: ModuleRenderOptions | null): PdfPromise<RenderedFile>;
        renderAsync(page: number, options: ModuleRenderOptions & { encoding: 'base64' }): PdfPromise<RenderedBase64>;
        renderAsync(page: number, options?: ModuleRenderOptions | null): PdfPromise<RenderedFile>;
        renderToFile(page: number, output?: Output, options?: RenderToFileOptions | null): PdfPromise<RenderedFile>;
        renderToFileAsync(page: number, output?: Output, options?: RenderToFileOptions | null): PdfPromise<RenderedFile>;
        images(options?: PagesOptions | null): PdfPromise<ImageInfo[]>;
        imagesAsync(options?: PagesOptions | null): PdfPromise<ImageInfo[]>;
        extractImages(outputDir?: Output, options?: ExtractImagesOptions | null): PdfPromise<PathsResult>;
        extractImagesAsync(outputDir?: Output, options?: ExtractImagesOptions | null): PdfPromise<PathsResult>;
        /** Applies `pages`, `delete`, `order` and `rotate` in one write. */
        save(output?: Output, options?: SaveOptions | null): PdfPromise<PdfResult>;
        saveAsync(output?: Output, options?: SaveOptions | null): PdfPromise<PdfResult>;
        /** Idempotent: the same Promise on every call; it never rejects. */
        close(): Promise<void>;
        toString(): string;
    }

    interface PageEvent {
        readonly page: number;
        readonly pageCount: number;
    }

    /** `finished` after `close({finish: true})`, `overflow` when the script stopped taking events, `error` when the bridge failed. */
    type CloseReason = 'host' | 'finished' | 'overflow' | 'error' | string;

    interface CloseEvent {
        readonly reason: CloseReason;
    }

    interface ViewState {
        readonly page: number;
        readonly pageCount: number;
        readonly zoom: number | null;
        readonly token: string | null;
        readonly visible: boolean;
    }

    /** Events wait (32 per name at most) until a listener is added. */
    interface PdfViewSession {
        readonly path: string;
        readonly page: number;
        readonly pageCount: number;
        readonly isClosed: boolean;
        readonly reason: CloseReason | null;
        addListener(event: 'page', listener: (this: PdfViewSession, event: PageEvent) => void): this;
        addListener(event: 'close', listener: (this: PdfViewSession, event: CloseEvent) => void): this;
        on(event: 'page', listener: (this: PdfViewSession, event: PageEvent) => void): this;
        on(event: 'close', listener: (this: PdfViewSession, event: CloseEvent) => void): this;
        once(event: 'page', listener: (this: PdfViewSession, event: PageEvent) => void): this;
        once(event: 'close', listener: (this: PdfViewSession, event: CloseEvent) => void): this;
        removeListener(event: 'page' | 'close', listener: (...args: any[]) => void): this;
        off(event: 'page' | 'close', listener: (...args: any[]) => void): this;
        removeAllListeners(event?: 'page' | 'close'): this;
        listenerCount(event: 'page' | 'close'): number;
        goTo(page: number): Promise<PdfViewSession>;
        state(): PdfPromise<ViewState>;
        /** `finish: true` also closes the viewer screen; a closed session answers at once. */
        close(options?: { finish?: boolean } | null): Promise<PdfViewSession>;
        toString(): string;
    }
  }
  const pdf: pdf.API;
  export = pdf;
}
declare module "autojs6:pdf" { import pdf = require("pdf"); export = pdf; }
