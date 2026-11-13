// Type definitions for AutoJs6 internal module pdf
//
// Definitions by: SuperMonster003 <https://github.com/SuperMonster003>
// TypeScript Version: 5.1.3
//
// Last modified: Nov 13, 2026

/// <reference path="./index.d.ts" />

/**
 * @Source %AutoJs6%/app/src/main/java/org/autojs/autojs/runtime/api/modules/pdf/Pdf.kt
 * @Source %AutoJs6%/app/src/main/java/org/autojs/autojs/runtime/api/modules/pdf/PdfDocumentNativeObject.kt
 * @Source %AutoJs6%/app/src/main/java/org/autojs/autojs/runtime/api/modules/pdf/PdfViewSession.kt
 * @Source %AutoJs6%/app/src/main/java/org/autojs/autojs/runtime/api/modules/pdf/PdfCalls.kt
 * @Source %AutoJs6%/app/src/main/java/org/autojs/autojs/runtime/api/modules/pdf/PdfJsErrors.kt
 * @Source %AutoJs6%/app/src/main/java/org/autojs/autojs/runtime/api/pdf/PdfMethods.kt
 * @Source %AutoJs6%/app/src/main/java/org/autojs/autojs/runtime/api/pdf/PdfScriptArguments.kt
 * @Source %AutoJs6%/app/src/main/java/org/autojs/autojs/runtime/api/pdf/PdfScriptValues.kt
 * @Source %AutoJs6%/app/src/main/java/org/autojs/autojs/core/plugin/pdf/PdfOcr.kt
 * @Source %AutoJs6%/plugin-api/pdf-api/src/main/java/org/autojs/plugin/pdf/api/PdfContract.kt
 * @Source %AutoJs6%/plugin-api/pdf-api/src/main/java/org/autojs/plugin/pdf/api/PdfErrorCodes.kt
 */

declare namespace Internal {

    /**
     * The global `pdf` object (also `$pdf`), available since AutoJs6 6.8.1 through the external 3-Paper PDF plugin:
     * reading (information, text with optional OCR, outline, search, page images), rendering pages, page operations
     * (merge, split, extract, delete, reorder, rotate), creating PDFs from images, text or HTML, encryption, documents
     * kept open, and the plugin's viewer. AutoJs6 has no PDF implementation of its own: while the plugin is missing,
     * disabled or incompatible every call throws (or rejects with) a `PdfError` whose `code` is `PLUGIN_UNAVAILABLE`,
     * `PLUGIN_DISABLED` or `PLUGIN_INCOMPATIBLE`; {@link isAvailable} probes without throwing.
     *
     * Every method has a synchronous form `x(...)` and an `xAsync(...)` form with the same arguments and result. The
     * synchronous form blocks the script thread (stopping the script cancels the call) and is `INVALID_ARGUMENT` on the
     * UI thread; the `Async` form returns a Promise settled on the script thread with a non-enumerable `cancel()`, and
     * rejects (instead of throwing) on argument errors too. Arguments are read like `JSON.stringify` sees them; unknown
     * option keys are `INVALID_ARGUMENT`. Every options object may carry `onProgress`.
     *
     * Paths are file paths: relative paths resolve against the script working directory, URIs are not accepted. An
     * optional `output` / `outputDir` argument is the output when it is a string, the default output when it is `null`
     * or `undefined`, and is left out when it is any other value (that value is then the next argument). The default
     * output is `/sdcard/Documents/3-Paper PDF/<source>-<operation>-<time>.pdf` (`<source>-render-p<page>-<time>.<ext>`
     * for {@link renderToFile}); results carry the real path. Page numbers start at 1.
     *
     * @see https://docs.autojs6.com/#/pdf
     */
    interface Pdf {

        /** The error class of the module; `e instanceof pdf.PdfError`. @since 6.8.1 */
        readonly PdfError: Pdf.PdfErrorConstructor;

        /**
         * Whether the 3-Paper PDF plugin is installed, enabled and compatible. Never throws.
         * @since 6.8.1
         */
        isAvailable(): boolean;
        /** @since 6.8.1 */
        isAvailableAsync(): Pdf.PdfPromise<boolean>;

        /**
         * Page count, page sizes, metadata (null when absent), PDF version, encryption and permissions of a document.
         * @since 6.8.1
         * @example
         * let info = pdf.info('/sdcard/Download/report.pdf');
         * console.log(info.pageCount, info.title, info.permissions.copy);
         */
        info(path: string, options?: Pdf.PasswordOptions | null): Pdf.PdfInfo;
        /** @since 6.8.1 */
        infoAsync(path: string, options?: Pdf.PasswordOptions | null): Pdf.PdfPromise<Pdf.PdfInfo>;

        /**
         * The text of the pages (all pages by default), one string per page in request order. The array also has the
         * non-enumerable `pages` (the page numbers) and `sources` (`'text'` from the text layer, `'ocr'` from OCR).
         * `ocr: true` recognizes pages without a text layer, `'always'` every page, through an installed OCR plugin
         * (`OCR_UNAVAILABLE` without one).
         * @since 6.8.1
         * @example
         * let texts = pdf.text('/sdcard/Download/report.pdf', { pages: '1-3' });
         * texts.forEach((text, i) => console.log(texts.pages[i], text.length));
         */
        text(path: string, options?: Pdf.TextOptions | null): Pdf.Texts;
        /** @since 6.8.1 */
        textAsync(path: string, options?: Pdf.TextOptions | null): Pdf.PdfPromise<Pdf.Texts>;

        /**
         * The bookmarks (outline) of a document as a tree; an empty array when it has none.
         * @since 6.8.1
         */
        outline(path: string, options?: Pdf.PasswordOptions | null): Pdf.OutlineItem[];
        /** @since 6.8.1 */
        outlineAsync(path: string, options?: Pdf.PasswordOptions | null): Pdf.PdfPromise<Pdf.OutlineItem[]>;

        /**
         * Finds `keyword` (1 to 256 characters) in the text layer; at most `limit` hits (1000 by default and at most).
         * @since 6.8.1
         */
        search(path: string, keyword: string, options?: Pdf.SearchOptions | null): Pdf.SearchHit[];
        /** @since 6.8.1 */
        searchAsync(path: string, keyword: string, options?: Pdf.SearchOptions | null): Pdf.PdfPromise<Pdf.SearchHit[]>;

        /**
         * Renders a page to an image (144 dpi by default; at most 16,000,000 pixels, else `LIMIT_EXCEEDED`). The image is
         * the script's to recycle.
         * @since 6.8.1
         * @example
         * let img = pdf.render('/sdcard/Download/report.pdf', 1, { width: 1080 });
         * images.save(img, '/sdcard/Pictures/page-1.png');
         * img.recycle();
         */
        render(path: string, page: number, options?: Pdf.RenderOptions | null): ImageWrapper;
        /** @since 6.8.1 */
        renderAsync(path: string, page: number, options?: Pdf.RenderOptions | null): Pdf.PdfPromise<ImageWrapper>;

        /**
         * Renders a page to an image file (PNG by default).
         * @since 6.8.1
         */
        renderToFile(path: string, page: number, output: Pdf.Output, options?: Pdf.RenderToFileOptions | null): Pdf.RenderedFile;
        /** @since 6.8.1 */
        renderToFile(path: string, page: number, options?: Pdf.RenderToFileOptions): Pdf.RenderedFile;
        /** @since 6.8.1 */
        renderToFileAsync(path: string, page: number, output: Pdf.Output, options?: Pdf.RenderToFileOptions | null): Pdf.PdfPromise<Pdf.RenderedFile>;
        /** @since 6.8.1 */
        renderToFileAsync(path: string, page: number, options?: Pdf.RenderToFileOptions): Pdf.PdfPromise<Pdf.RenderedFile>;

        /**
         * The embedded images of the pages (all pages by default), without extracting them.
         * @since 6.8.1
         */
        images(path: string, options?: Pdf.PagesOptions | null): Pdf.ImageInfo[];
        /** @since 6.8.1 */
        imagesAsync(path: string, options?: Pdf.PagesOptions | null): Pdf.PdfPromise<Pdf.ImageInfo[]>;

        /**
         * Writes the embedded images to `outputDir` (JPEG or PNG as stored).
         * @since 6.8.1
         */
        extractImages(path: string, outputDir: Pdf.Output, options?: Pdf.ExtractImagesOptions | null): Pdf.PathsResult;
        /** @since 6.8.1 */
        extractImages(path: string, options?: Pdf.ExtractImagesOptions): Pdf.PathsResult;
        /** @since 6.8.1 */
        extractImagesAsync(path: string, outputDir: Pdf.Output, options?: Pdf.ExtractImagesOptions | null): Pdf.PdfPromise<Pdf.PathsResult>;
        /** @since 6.8.1 */
        extractImagesAsync(path: string, options?: Pdf.ExtractImagesOptions): Pdf.PdfPromise<Pdf.PathsResult>;

        /**
         * Merges 1 to 1000 documents in order into one.
         * @since 6.8.1
         * @example
         * pdf.merge(['a.pdf', 'b.pdf'], 'ab.pdf', { displayNames: ['Part A', null] });
         */
        merge(inputs: string[], output: Pdf.Output, options?: Pdf.MergeOptions | null): Pdf.PdfResult;
        /** @since 6.8.1 */
        merge(inputs: string[], options?: Pdf.MergeOptions): Pdf.PdfResult;
        /** @since 6.8.1 */
        mergeAsync(inputs: string[], output: Pdf.Output, options?: Pdf.MergeOptions | null): Pdf.PdfPromise<Pdf.PdfResult>;
        /** @since 6.8.1 */
        mergeAsync(inputs: string[], options?: Pdf.MergeOptions): Pdf.PdfPromise<Pdf.PdfResult>;

        /**
         * Splits a document into several files by `ranges` or `every` pages (one of the two is required).
         * @since 6.8.1
         * @example
         * pdf.split('book.pdf', { every: 10 }).paths.forEach(p => console.log(p));
         */
        split(path: string, outputDir: Pdf.Output, options: Pdf.SplitOptions): Pdf.PathsResult;
        /** @since 6.8.1 */
        split(path: string, options: Pdf.SplitOptions): Pdf.PathsResult;
        /** @since 6.8.1 */
        splitAsync(path: string, outputDir: Pdf.Output, options: Pdf.SplitOptions): Pdf.PdfPromise<Pdf.PathsResult>;
        /** @since 6.8.1 */
        splitAsync(path: string, options: Pdf.SplitOptions): Pdf.PdfPromise<Pdf.PathsResult>;

        /**
         * Writes the given pages to a new document. A string after `path` is the output only when the pages follow it:
         * `extract(path, '1-3')` extracts pages 1 to 3 to the default output.
         * @since 6.8.1
         */
        extract(path: string, output: Pdf.Output, pages: Pdf.PageRange, options?: Pdf.PasswordOptions | null): Pdf.PdfResult;
        /** @since 6.8.1 */
        extract(path: string, pages: Pdf.PageRange, options?: Pdf.PasswordOptions | null): Pdf.PdfResult;
        /** @since 6.8.1 */
        extractAsync(path: string, output: Pdf.Output, pages: Pdf.PageRange, options?: Pdf.PasswordOptions | null): Pdf.PdfPromise<Pdf.PdfResult>;
        /** @since 6.8.1 */
        extractAsync(path: string, pages: Pdf.PageRange, options?: Pdf.PasswordOptions | null): Pdf.PdfPromise<Pdf.PdfResult>;

        /**
         * Writes the document without the given pages; the output argument follows the rule of {@link extract}.
         * @since 6.8.1
         */
        delete(path: string, output: Pdf.Output, pages: Pdf.PageRange, options?: Pdf.PasswordOptions | null): Pdf.PdfResult;
        /** @since 6.8.1 */
        delete(path: string, pages: Pdf.PageRange, options?: Pdf.PasswordOptions | null): Pdf.PdfResult;
        /** @since 6.8.1 */
        deleteAsync(path: string, output: Pdf.Output, pages: Pdf.PageRange, options?: Pdf.PasswordOptions | null): Pdf.PdfPromise<Pdf.PdfResult>;
        /** @since 6.8.1 */
        deleteAsync(path: string, pages: Pdf.PageRange, options?: Pdf.PasswordOptions | null): Pdf.PdfPromise<Pdf.PdfResult>;

        /**
         * Writes the pages in the given order (page numbers from 1).
         * @since 6.8.1
         */
        reorder(path: string, output: Pdf.Output, order: number[], options?: Pdf.PasswordOptions | null): Pdf.PdfResult;
        /** @since 6.8.1 */
        reorder(path: string, order: number[], options?: Pdf.PasswordOptions | null): Pdf.PdfResult;
        /** @since 6.8.1 */
        reorderAsync(path: string, output: Pdf.Output, order: number[], options?: Pdf.PasswordOptions | null): Pdf.PdfPromise<Pdf.PdfResult>;
        /** @since 6.8.1 */
        reorderAsync(path: string, order: number[], options?: Pdf.PasswordOptions | null): Pdf.PdfPromise<Pdf.PdfResult>;

        /**
         * Rotates pages (all pages by default) clockwise by `degrees`, a multiple of 90 from -36000 to 36000.
         * @since 6.8.1
         */
        rotate(path: string, output: Pdf.Output, degrees: number, options?: Pdf.RotateOptions | null): Pdf.PdfResult;
        /** @since 6.8.1 */
        rotate(path: string, degrees: number, options?: Pdf.RotateOptions | null): Pdf.PdfResult;
        /** @since 6.8.1 */
        rotateAsync(path: string, output: Pdf.Output, degrees: number, options?: Pdf.RotateOptions | null): Pdf.PdfPromise<Pdf.PdfResult>;
        /** @since 6.8.1 */
        rotateAsync(path: string, degrees: number, options?: Pdf.RotateOptions | null): Pdf.PdfPromise<Pdf.PdfResult>;

        /**
         * Creates a document with one page per image.
         * @since 6.8.1
         */
        fromImages(images: string[], output: Pdf.Output, options?: Pdf.FromImagesOptions | null): Pdf.PdfResult;
        /** @since 6.8.1 */
        fromImages(images: string[], options?: Pdf.FromImagesOptions): Pdf.PdfResult;
        /** @since 6.8.1 */
        fromImagesAsync(images: string[], output: Pdf.Output, options?: Pdf.FromImagesOptions | null): Pdf.PdfPromise<Pdf.PdfResult>;
        /** @since 6.8.1 */
        fromImagesAsync(images: string[], options?: Pdf.FromImagesOptions): Pdf.PdfPromise<Pdf.PdfResult>;

        /**
         * Creates a document from plain text.
         * @since 6.8.1
         */
        fromText(text: string, output: Pdf.Output, options?: Pdf.FromTextOptions | null): Pdf.PdfResult;
        /** @since 6.8.1 */
        fromText(text: string, options?: Pdf.FromTextOptions): Pdf.PdfResult;
        /** @since 6.8.1 */
        fromTextAsync(text: string, output: Pdf.Output, options?: Pdf.FromTextOptions | null): Pdf.PdfPromise<Pdf.PdfResult>;
        /** @since 6.8.1 */
        fromTextAsync(text: string, options?: Pdf.FromTextOptions): Pdf.PdfPromise<Pdf.PdfResult>;

        /**
         * Creates a document from HTML: a string containing `<` is HTML, any other string the path of an HTML file.
         * Remote resources are not loaded.
         * @since 6.8.1
         */
        fromHtml(htmlOrPath: string, output: Pdf.Output, options?: Pdf.FromHtmlOptions | null): Pdf.PdfResult;
        /** @since 6.8.1 */
        fromHtml(htmlOrPath: string, options?: Pdf.FromHtmlOptions): Pdf.PdfResult;
        /** @since 6.8.1 */
        fromHtmlAsync(htmlOrPath: string, output: Pdf.Output, options?: Pdf.FromHtmlOptions | null): Pdf.PdfPromise<Pdf.PdfResult>;
        /** @since 6.8.1 */
        fromHtmlAsync(htmlOrPath: string, options?: Pdf.FromHtmlOptions): Pdf.PdfPromise<Pdf.PdfResult>;

        /**
         * Writes an encrypted copy; the options need `userPassword` or `ownerPassword` (AES-256 by default).
         * @since 6.8.1
         */
        encrypt(path: string, output: Pdf.Output, options: Pdf.EncryptOptions): Pdf.PdfResult;
        /** @since 6.8.1 */
        encrypt(path: string, options: Pdf.EncryptOptions): Pdf.PdfResult;
        /** @since 6.8.1 */
        encryptAsync(path: string, output: Pdf.Output, options: Pdf.EncryptOptions): Pdf.PdfPromise<Pdf.PdfResult>;
        /** @since 6.8.1 */
        encryptAsync(path: string, options: Pdf.EncryptOptions): Pdf.PdfPromise<Pdf.PdfResult>;

        /**
         * Writes a copy without encryption (`password` opens the input).
         * @since 6.8.1
         */
        decrypt(path: string, output: Pdf.Output, options?: Pdf.PasswordOptions | null): Pdf.PdfResult;
        /** @since 6.8.1 */
        decrypt(path: string, options?: Pdf.PasswordOptions): Pdf.PdfResult;
        /** @since 6.8.1 */
        decryptAsync(path: string, output: Pdf.Output, options?: Pdf.PasswordOptions | null): Pdf.PdfPromise<Pdf.PdfResult>;
        /** @since 6.8.1 */
        decryptAsync(path: string, options?: Pdf.PasswordOptions): Pdf.PdfPromise<Pdf.PdfResult>;

        /**
         * Opens a document in the plugin and keeps it open until its `close()` or the script exits (at most 8 per script,
         * else `LIMIT_EXCEEDED`), so several calls skip the repeated opening.
         * @since 6.8.1
         * @example
         * let doc = pdf.open('/sdcard/Download/report.pdf');
         * try {
         *     console.log(doc.pageCount, doc.search('total').length);
         * } finally {
         *     doc.close();
         * }
         */
        open(path: string, options?: Pdf.PasswordOptions | null): Pdf.PdfDocument;
        /** @since 6.8.1 */
        openAsync(path: string, options?: Pdf.PasswordOptions | null): Pdf.PdfPromise<Pdf.PdfDocument>;

        /**
         * Opens the plugin's viewer (AutoJs6 has to be visible, else `UI_REQUIRES_FOREGROUND`) and returns a session
         * whose events arrive on the script thread; the script keeps running while the session is open.
         * @since 6.8.1
         * @example
         * pdf.view('/sdcard/Download/report.pdf', { page: 3 })
         *     .on('page', e => console.log(`${e.page} / ${e.pageCount}`))
         *     .on('close', e => console.log(e.reason));
         */
        view(path: string, options?: Pdf.ViewOptions | null): Pdf.PdfViewSession;
        /** @since 6.8.1 */
        viewAsync(path: string, options?: Pdf.ViewOptions | null): Pdf.PdfPromise<Pdf.PdfViewSession>;
    }

    namespace Pdf {

        /** The Promise of an `xxxAsync` call; `cancel()` is true when it stopped a running call, which then rejects with `CANCELLED`. */
        type PdfPromise<T> = Promise<T> & {
            cancel(): boolean;
        };

        /** `'1-3,5,8-'` (an open end runs to the last page), a page number (from 1), or a list of both. */
        type PageRange = string | number | Array<number | string>;

        /** A path; `null` or `undefined` for the default output. */
        type Output = string | null | undefined;

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

        /** `name` is `'PdfError'`; `toString()` yields `PdfError [CODE]: message`; `message` and `cause` are not enumerable. */
        interface PdfError extends Error {
            readonly name: 'PdfError';
            /** `'INTERNAL'` when the constructor got none. */
            readonly code: ErrorCode | string;
            /** The text of the underlying failure (a Java exception) when there is one. */
            readonly cause?: string;
        }

        /** Callable with or without `new`. */
        interface PdfErrorConstructor {
            (message?: string, code?: ErrorCode | string, cause?: string): PdfError;
            new(message?: string, code?: ErrorCode | string, cause?: string): PdfError;
            readonly prototype: PdfError;
        }

        type ProgressStage = 'opening' | 'processing' | 'writing' | 'ocr' | string;

        interface Progress {
            /** The id of the call. */
            readonly opId: number;
            /** 0 to 100. */
            readonly percent: number;
            readonly stage: ProgressStage;
            readonly current: number;
            readonly total: number;
        }

        interface ProgressOptions {
            /** Runs on the script thread while the call works; throwing from it cancels the call. */
            onProgress?: ((progress: Progress) => void) | null;
        }

        interface PasswordOptions extends ProgressOptions {
            /** Opens an encrypted input; at most 127 characters. */
            password?: string;
        }

        interface PageOptions extends ProgressOptions {
            /** All pages by default. */
            pages?: PageRange;
        }

        interface PagesOptions extends PageOptions, PasswordOptions {
        }

        interface PageInfo {
            /** In points; null when the plugin did not report it. */
            readonly width: number | null;
            readonly height: number | null;
            /** 0, 90, 180 or 270. */
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

        type PermissionName = keyof Permissions;

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

        /** One string per requested page, with the non-enumerable `pages` and `sources` in the same order. */
        type Texts = string[] & {
            readonly pages: number[];
            readonly sources: Array<'text' | 'ocr'>;
        };

        type OcrMode = 'mlkit' | 'paddle' | 'rapid' | 'auto';

        /** The OCR engine of `ocr: true` / `'always'`; left out, the engine of `ocr.mode` (any installed one when it is `auto`). */
        interface OcrOptions {
            mode?: OcrMode;
            engineId?: string;
            engine?: string;
            variant?: string;
            profile?: string;
        }

        interface DocumentTextOptions extends PageOptions {
            /** `'reading'` (default) sorts the text by position, `'raw'` keeps the content stream order. */
            layout?: 'reading' | 'raw';
            /** `true` recognizes pages without a text layer, `'always'` every page; default false. */
            ocr?: boolean | 'always';
            /** Render resolution for OCR, 1 to 2400; default 300. */
            ocrDpi?: number;
            /** Needs `ocr` true or `'always'`. */
            ocrOptions?: OcrOptions;
        }

        interface TextOptions extends DocumentTextOptions, PasswordOptions {
        }

        interface OutlineItem {
            readonly title: string;
            /** Null when the entry has no page destination. */
            readonly page: number | null;
            /** From 0 for top-level entries. */
            readonly level: number;
            readonly children: OutlineItem[];
        }

        interface DocumentSearchOptions extends PageOptions {
            /** Default false. */
            caseSensitive?: boolean;
            /** Default false. */
            wholeWord?: boolean;
            /** 1 to 1000; default 1000. */
            limit?: number;
        }

        interface SearchOptions extends DocumentSearchOptions, PasswordOptions {
        }

        /** `rect` is the union of `rects` (`[left, top, right, bottom]` in points); a hit that wraps lines has several rects. */
        interface SearchHit {
            readonly page: number;
            readonly rect: number[] | null;
            readonly rects: number[][];
            readonly context: string;
        }

        /** At most one of `dpi` (144 by default), `scale`, `width` and `height`. */
        interface DocumentRenderOptions extends ProgressOptions {
            /** 1 to 2400. */
            dpi?: number;
            /** Relative to 72 dpi (1 is one pixel per point), more than 0. */
            scale?: number;
            /** Pixels; the height follows the page. */
            width?: number;
            /** Pixels; the width follows the page. */
            height?: number;
            /** Keeps the background transparent instead of white; default false. */
            transparent?: boolean;
        }

        interface RenderOptions extends DocumentRenderOptions, PasswordOptions {
        }

        interface DocumentRenderToFileOptions extends DocumentRenderOptions {
            /** Default `'png'`; `'jpg'` is `'jpeg'`. */
            format?: 'png' | 'jpeg' | 'jpg' | 'webp';
            /** 1 to 100 for JPEG and WebP; default 90. */
            quality?: number;
        }

        interface RenderToFileOptions extends DocumentRenderToFileOptions, PasswordOptions {
        }

        interface RenderedFile {
            readonly path: string;
            readonly width: number;
            readonly height: number;
            readonly format: string | null;
            readonly sizeBytes: number | null;
        }

        interface ImageInfo {
            readonly page: number;
            /** From 0 inside its page. */
            readonly index: number;
            readonly width: number;
            readonly height: number;
            readonly format: 'jpeg' | 'png' | string | null;
        }

        interface DocumentExtractImagesOptions extends PageOptions {
            /** Placeholders `{name}`, `{page}` and `{index}`; default `'{name}-p{page}-{index}'`. */
            namePattern?: string;
        }

        interface ExtractImagesOptions extends DocumentExtractImagesOptions, PasswordOptions {
        }

        interface PathsResult {
            readonly paths: string[];
            readonly warnings: string[];
        }

        /** A written PDF file. */
        interface PdfResult {
            readonly path: string;
            readonly pageCount: number;
            readonly sizeBytes: number | null;
            readonly warnings: string[];
        }

        interface MergeOptions extends ProgressOptions {
            /** `'merge'` (default) gives the output one outline entry per input (see `displayNames`), `'none'` gives it none. */
            outline?: 'merge' | 'none';
            /** One per input, null for an input without a password. */
            passwords?: Array<string | null>;
            /**
             * One outline title per input, null for the file name without `.pdf` (what an absent option gives); a blank
             * name takes the document's title. Names past the size limit of the request are `LIMIT_EXCEEDED`.
             */
            displayNames?: Array<string | null>;
        }

        /** One of `ranges` and `every`. */
        interface SplitOptions extends PasswordOptions {
            /** 1 to 1000 parts, one file each. */
            ranges?: PageRange[];
            /** Pages per file, at least 1. */
            every?: number;
            /** Placeholders `{name}` and `{index}`; default `'{name}-{index}'`. */
            namePattern?: string;
        }

        interface RotateOptions extends PageOptions, PasswordOptions {
        }

        /** `'fit'`, `'A4'` or `'Letter'` (any case), or `[width, height]` in points. */
        type PageSize = 'fit' | 'A4' | 'Letter' | string | [number, number];

        interface PageLayoutOptions extends ProgressOptions {
            pageSize?: PageSize;
            /** Points, 0 to 10000. */
            margin?: number;
        }

        interface FromImagesOptions extends PageLayoutOptions {
            fit?: 'contain' | 'cover';
            orientation?: 'auto' | 'portrait' | 'landscape';
            /** 1 to 100, or `'lossless'`. */
            quality?: number | 'lossless';
        }

        interface FromTextOptions extends PageLayoutOptions {
            /** Points, more than 0. */
            fontSize?: number;
            /** More than 0. */
            lineSpacing?: number;
            /** The document title. */
            title?: string;
            /** A font file on the device. */
            fontPath?: string;
        }

        interface FromHtmlOptions extends PageLayoutOptions {
            /** Base URL of relative references; remote URLs are never loaded. */
            baseUrl?: string;
            /** Milliseconds to wait for the page to load, at least 1; no limit by default. */
            timeout?: number;
            /** Whether the scripts of the page run; default true. */
            javaScript?: boolean;
        }

        interface EncryptOptions extends PasswordOptions {
            /** Needed to open the output. */
            userPassword?: string;
            /** Needed to change the permissions. */
            ownerPassword?: string;
            /** Names of granted permissions, or `{ print: true, copy: false, ... }`. */
            permissions?: PermissionName[] | Partial<Record<PermissionName, boolean>>;
            /** Default 256. */
            keyLength?: 128 | 256;
        }

        interface ViewOptions {
            /** The page to show first, from 1. */
            page?: number;
            /** Text to search for (1 to 256 characters). */
            search?: string;
            password?: string;
        }

        /** Applied in one write. */
        interface SaveOptions extends ProgressOptions {
            /** Keeps only these pages. */
            pages?: PageRange;
            /** Removes these pages. */
            delete?: PageRange;
            /** New page order, page numbers from 1. */
            order?: number[];
            /** A multiple of 90 for all pages, or `{ degrees, pages }`. */
            rotate?: number | { degrees: number, pages?: PageRange };
        }

        /**
         * A document kept open by {@link Pdf.open}. No method takes a `password` (the document is already open); each has
         * an `xxxAsync` form as on the module. Calls after `close()` are `SESSION_CLOSED`; the script's exit closes it.
         * @see https://docs.autojs6.com/#/pdfDocumentType
         */
        interface PdfDocument {
            /** The absolute path. */
            readonly path: string;
            /** Read when the document opened. */
            readonly pageCount: number;
            readonly isClosed: boolean;

            info(): PdfInfo;
            infoAsync(): PdfPromise<PdfInfo>;
            pageSize(page: number): PageInfo;
            pageSizeAsync(page: number): PdfPromise<PageInfo>;
            /** A page range, or the options. */
            text(pagesOrOptions?: PageRange | DocumentTextOptions | null): Texts;
            textAsync(pagesOrOptions?: PageRange | DocumentTextOptions | null): PdfPromise<Texts>;
            outline(): OutlineItem[];
            outlineAsync(): PdfPromise<OutlineItem[]>;
            search(keyword: string, options?: DocumentSearchOptions | null): SearchHit[];
            searchAsync(keyword: string, options?: DocumentSearchOptions | null): PdfPromise<SearchHit[]>;
            /** The image is the script's to recycle. */
            render(page: number, options?: DocumentRenderOptions | null): ImageWrapper;
            renderAsync(page: number, options?: DocumentRenderOptions | null): PdfPromise<ImageWrapper>;
            renderToFile(page: number, output: Output, options?: DocumentRenderToFileOptions | null): RenderedFile;
            renderToFile(page: number, options?: DocumentRenderToFileOptions): RenderedFile;
            renderToFileAsync(page: number, output: Output, options?: DocumentRenderToFileOptions | null): PdfPromise<RenderedFile>;
            renderToFileAsync(page: number, options?: DocumentRenderToFileOptions): PdfPromise<RenderedFile>;
            /** A page range, or the options. */
            images(pagesOrOptions?: PageRange | PageOptions | null): ImageInfo[];
            imagesAsync(pagesOrOptions?: PageRange | PageOptions | null): PdfPromise<ImageInfo[]>;
            extractImages(outputDir: Output, options?: DocumentExtractImagesOptions | null): PathsResult;
            extractImages(options?: DocumentExtractImagesOptions): PathsResult;
            extractImagesAsync(outputDir: Output, options?: DocumentExtractImagesOptions | null): PdfPromise<PathsResult>;
            extractImagesAsync(options?: DocumentExtractImagesOptions): PdfPromise<PathsResult>;
            /** Writes the document with `pages`, `delete`, `order` and `rotate` applied in one write. */
            save(output: Output, options?: SaveOptions | null): PdfResult;
            save(options?: SaveOptions): PdfResult;
            saveAsync(output: Output, options?: SaveOptions | null): PdfPromise<PdfResult>;
            saveAsync(options?: SaveOptions): PdfPromise<PdfResult>;
            /** Closes the document in the plugin; idempotent. */
            close(): void;
            /** `PdfDocument { path: ... }`, with `, closed` once closed. */
            toString(): string;
        }

        interface PageEvent {
            readonly page: number;
            readonly pageCount: number;
        }

        /**
         * `closed`: the user or the system closed the viewer; `replaced`: another `view` took the viewer; `timeout`: the
         * viewer never claimed the session; `host`: `close()`; `finished`: `close({ finish: true })`; `error`: the plugin
         * process died. `script-exit` (the script ended, no `close` event) appears only in {@link PdfViewSession.reason}.
         */
        type CloseReason = 'closed' | 'replaced' | 'timeout' | 'host' | 'finished' | 'error' | 'script-exit' | string;

        interface CloseEvent {
            readonly reason: CloseReason;
        }

        interface ViewState {
            readonly page: number;
            readonly pageCount: number;
            readonly zoom: number | null;
            readonly token: string | null;
            /** Whether the viewer is on screen. */
            readonly visible: boolean;
        }

        /**
         * The event emitter returned by {@link Pdf.view}. Events arrive on the script thread, which keeps running while
         * the session is open; `close` is the last event. The script's exit ends the session without a `close` event and
         * leaves the viewer open. Methods throw `SESSION_CLOSED` once closed.
         * @see https://docs.autojs6.com/#/pdfViewSessionType
         */
        interface PdfViewSession extends EventEmitter$ {
            readonly path: string;
            /** The page the viewer last reported (from 1); 0 before the first `page` event. */
            readonly page: number;
            /** 0 before the first `page` event. */
            readonly pageCount: number;
            readonly isClosed: boolean;
            /** Why the session ended; null while open. */
            readonly reason: CloseReason | null;

            /** Turns the viewer to a page (from 1); a `page` event follows. */
            goTo(page: number): this;
            /** The viewer's current state, read from the plugin. */
            state(): ViewState;
            /** Disconnects the events (reason `host`); `finish: true` also closes the viewer (reason `finished`). Idempotent. */
            close(options?: { finish?: boolean } | null): this;
            /** `PdfViewSession { path: ..., page: ..., pageCount: ... }` with the reason once closed. */
            toString(): string;

            on(eventName: 'page', listener: (event: PageEvent) => void): this;
            on(eventName: 'close', listener: (event: CloseEvent) => void): this;
            on(eventName: string, listener: (...args: any[]) => void): this;

            once(eventName: 'page', listener: (event: PageEvent) => void): this;
            once(eventName: 'close', listener: (event: CloseEvent) => void): this;
            once(eventName: string, listener: (...args: any[]) => void): this;
        }
    }
}
