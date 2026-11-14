// Type definitions for AutoJs6 internal module xlsx
//
// Definitions by: SuperMonster003 <https://github.com/SuperMonster003>
// TypeScript Version: 5.1.3
//
// Last modified: Nov 14, 2026

/// <reference path="./index.d.ts" />

/**
 * @Source %AutoJs6%/app/src/main/java/org/autojs/autojs/runtime/api/modules/xlsx/Xlsx.kt
 * @Source %AutoJs6%/app/src/main/java/org/autojs/autojs/runtime/api/modules/xlsx/XlsxModule.kt
 * @Source %AutoJs6%/app/src/main/java/org/autojs/autojs/runtime/api/modules/xlsx/XlsxCalls.kt
 * @Source %AutoJs6%/app/src/main/java/org/autojs/autojs/runtime/api/modules/xlsx/XlsxJsErrors.kt
 * @Source %AutoJs6%/app/src/main/java/org/autojs/autojs/runtime/api/modules/xlsx/XlsxJsValues.kt
 * @Source %AutoJs6%/app/src/main/java/org/autojs/autojs/runtime/api/modules/xlsx/XlsxWorkbookNativeObject.kt
 * @Source %AutoJs6%/app/src/main/java/org/autojs/autojs/runtime/api/modules/xlsx/XlsxSheetNativeObject.kt
 * @Source %AutoJs6%/app/src/main/java/org/autojs/autojs/runtime/api/modules/xlsx/XlsxWriterNativeObject.kt
 * @Source %AutoJs6%/app/src/main/java/org/autojs/autojs/runtime/api/modules/xlsx/XlsxViewSession.kt
 * @Source %AutoJs6%/app/src/main/java/org/autojs/autojs/runtime/api/xlsx/XlsxOperations.kt
 * @Source %AutoJs6%/app/src/main/java/org/autojs/autojs/runtime/api/xlsx/XlsxRequests.kt
 * @Source %AutoJs6%/app/src/main/java/org/autojs/autojs/runtime/api/xlsx/XlsxHandles.kt
 * @Source %AutoJs6%/app/src/main/java/org/autojs/autojs/runtime/api/xlsx/XlsxLayout.kt
 * @Source %AutoJs6%/app/src/main/java/org/autojs/autojs/runtime/api/xlsx/XlsxRuns.kt
 * @Source %AutoJs6%/app/src/main/java/org/autojs/autojs/core/plugin/xlsx/RowTransport.kt
 * @Source %AutoJs6%/app/src/main/java/org/autojs/autojs/core/plugin/xlsx/XlsxError.kt
 * @Source %AutoJs6%/plugin-api/xlsx-api/src/main/java/org/autojs/plugin/xlsx/api/XlsxContract.kt
 * @Source %AutoJs6%/plugin-api/xlsx-api/src/main/java/org/autojs/plugin/xlsx/api/XlsxErrorCodes.kt
 * @Source %AutoJs6%/plugin-api/xlsx-api/src/main/java/org/autojs/plugin/xlsx/api/XlsxActions.kt
 */

declare namespace Internal {

    /**
     * The global `xlsx` object (also `$xlsx`), available since AutoJs6 6.8.1 through the external 3-Tally Sheet plugin:
     * reading, writing (with styles and layout), appending, converting, merging, splitting, deduplicating, recalculating and
     * encrypting xlsx, xlsm, xls, csv and tsv files, workbooks kept open (`open` / `create`), streaming writers and the
     * plugin's viewer. AutoJs6 has no spreadsheet implementation of its own: while the plugin is missing, disabled or
     * incompatible every call throws (or rejects with) an `XlsxError` whose `code` is `PLUGIN_UNAVAILABLE`,
     * `PLUGIN_DISABLED` or `PLUGIN_INCOMPATIBLE`; {@link isAvailable} probes without throwing.
     *
     * Every method except {@link isAvailable} has a synchronous form `x(...)` and an `xAsync(...)` form with the same
     * arguments and result. The synchronous form blocks the script thread (stopping the script cancels the call); the
     * `Async` form returns a Promise settled on the script thread with a non-enumerable `cancel()`, rejects (instead of
     * throwing) on argument errors too, and has no timeout. `onProgress` belongs to the `Async` forms of `write`, `writeAll`,
     * `append`, `convert`, `toCsv`, `merge`, `split`, `dedupe`, `recalc`, `encrypt`, `decrypt` and `sniff` (and of
     * `Workbook.save` and `Writer.close`); a synchronous form given a non-null `onProgress` is `INVALID_ARGUMENT`, other
     * `Async` forms ignore it. Unknown option keys are `INVALID_ARGUMENT`.
     *
     * Paths are file paths resolved like `files.path` (URIs are not accepted). An optional `output` / `outputDir` argument is
     * the output when it is a string, the default output when it is `null` or `undefined`, and is left out when it is an
     * object with nothing after it (that object is then the options). The default output is
     * `/sdcard/Documents/3-Tally Sheet/<source>-<operation>-<time>.<ext>`; results carry the real path. Rows and columns
     * count from 1, a column may also be given by its letters, ranges are A1 ranges (`'A1:C10'`), and dates are Date objects
     * in the device's time zone. A script holds at most 16 open workbooks and writers (`TOO_MANY_HANDLES`); the script's
     * exit closes them.
     *
     * Apps packaged by AutoJs6 use the module too: packaging adds the plugin's runtime permission
     * (`org.autojs.plugin.xlsx.permission.RUNTIME`) to every Rhino project, to Node.js projects that may read files and to
     * Bun projects granted `xlsx.control`, so `project.json` needs no entry for it. The app reaches the plugin through its
     * packaged entry; handles and viewer sessions serve only the app that created them.
     *
     * @see https://docs.autojs6.com/#/xlsx
     */
    interface Xlsx {

        /** The error class of the module; `e instanceof xlsx.XlsxError`. @since 6.8.1 */
        readonly XlsxError: Xlsx.XlsxErrorConstructor;

        /**
         * Whether the 3-Tally Sheet plugin is installed, enabled and compatible. Never throws; it has no `Async` form.
         * @since 6.8.1
         */
        isAvailable(): boolean;

        /**
         * Format, sheets (name, index, rows, columns, dimension, hidden), size and encryption of a file; for csv and tsv
         * also the detected encoding, delimiter and BOM.
         * @since 6.8.1
         * @example
         * let info = xlsx.info('/sdcard/Download/report.xlsx');
         * info.sheets.forEach(s => console.log(s.name, s.rows, s.cols));
         */
        info(path: string, options?: Xlsx.SourceOptions | null): Xlsx.SheetFileInfo;
        /** @since 6.8.1 */
        infoAsync(path: string, options?: Xlsx.SourceOptions | null): Xlsx.XlsxPromise<Xlsx.SheetFileInfo>;

        /**
         * The sheet names in workbook order.
         * @since 6.8.1
         */
        sheetNames(path: string, options?: Xlsx.SourceOptions | null): string[];
        /** @since 6.8.1 */
        sheetNamesAsync(path: string, options?: Xlsx.SourceOptions | null): Xlsx.XlsxPromise<string[]>;

        /**
         * The rows of one sheet (the first by default): arrays of cell values (missing cells are null), objects keyed by
         * the first row with `header: true`, cell details with `cells: true`, display texts with `formatted: true`. A
         * workbook over 1,000,000 cells loads in stream mode; reading it whole is `LIMIT_EXCEEDED`, so pass `from` / `to`,
         * `range` or `limit`, or use {@link Xlsx.Sheet.eachRow}.
         * @since 6.8.1
         * @example
         * let rows = xlsx.read('/sdcard/Download/report.xlsx', { sheet: 'Sales', header: true });
         * rows.forEach(row => console.log(row['Name'], row['Total']));
         */
        read(path: string, options?: Xlsx.ReadOptions | null): any[];
        /** @since 6.8.1 */
        readAsync(path: string, options?: Xlsx.ReadOptions | null): Xlsx.XlsxPromise<any[]>;

        /**
         * The rows of every sheet, keyed by sheet name in workbook order.
         * @since 6.8.1
         */
        readAll(path: string, options?: Xlsx.ReadAllOptions | null): { [sheetName: string]: any[] };
        /** @since 6.8.1 */
        readAllAsync(path: string, options?: Xlsx.ReadAllOptions | null): Xlsx.XlsxPromise<{ [sheetName: string]: any[] }>;

        /**
         * Writes rows into a new file (replacing an existing one); the format follows `format` or the extension. Rows are an
         * array (or a Java list or array) of cell arrays or objects; with object rows the keys of the first row become the
         * header unless `header` is false or names the columns. Strings starting with `=` stay text unless `formulas: true`.
         * csv and tsv take no layout options and one sheet.
         * @since 6.8.1
         * @example
         * xlsx.write('/sdcard/Documents/out.xlsx', [['Name', 'Total'], ['A', 3], ['B', 5]], {
         *     header: true,
         *     styles: { header: { font: { bold: true }, fill: '#DDEBF7' } },
         *     columnWidths: 'auto',
         *     freeze: { rows: 1 },
         *     autoFilter: true,
         * });
         */
        write(path: string, rows: Xlsx.Rows, options?: Xlsx.WriteOptions | null): Xlsx.SheetResult;
        /** @since 6.8.1 */
        writeAsync(path: string, rows: Xlsx.Rows, options?: (Xlsx.WriteOptions & Xlsx.ProgressOptions) | null): Xlsx.XlsxPromise<Xlsx.SheetResult>;

        /**
         * Writes several sheets into a new workbook, `{ sheetName: rows }` in order (at least one sheet); the options apply
         * to every sheet.
         * @since 6.8.1
         */
        writeAll(path: string, sheets: { [sheetName: string]: Xlsx.Rows }, options?: Xlsx.WriteAllOptions | null): Xlsx.SheetResult;
        /** @since 6.8.1 */
        writeAllAsync(path: string, sheets: { [sheetName: string]: Xlsx.Rows }, options?: (Xlsx.WriteAllOptions & Xlsx.ProgressOptions) | null): Xlsx.XlsxPromise<Xlsx.SheetResult>;

        /**
         * Appends rows after the last row of a sheet (the first by default) in place; `createIfMissing: true` writes a new
         * file when there is none. The layout options act on the appended block.
         * @since 6.8.1
         * @example
         * xlsx.append('/sdcard/Documents/log.csv', [[new Date(), 'started']], { createIfMissing: true });
         */
        append(path: string, rows: Xlsx.Rows, options?: Xlsx.AppendOptions | null): Xlsx.SheetResult;
        /** @since 6.8.1 */
        appendAsync(path: string, rows: Xlsx.Rows, options?: (Xlsx.AppendOptions & Xlsx.ProgressOptions) | null): Xlsx.XlsxPromise<Xlsx.SheetResult>;

        /**
         * Converts between the five formats; the target format comes from `format` or the output's extension
         * (`UNSUPPORTED_FORMAT` when neither says it). A workbook converted to csv or tsv writes one sheet (`sheet`, the
         * first by default).
         * @since 6.8.1
         * @example
         * xlsx.convert('/sdcard/Download/old.xls', '/sdcard/Documents/new.xlsx');
         */
        convert(path: string, output: Xlsx.Output, options?: Xlsx.ConvertOptions | null): Xlsx.SheetResult;
        /** @since 6.8.1 */
        convert(path: string, options?: Xlsx.ConvertOptions): Xlsx.SheetResult;
        /** @since 6.8.1 */
        convertAsync(path: string, output: Xlsx.Output, options?: (Xlsx.ConvertOptions & Xlsx.ProgressOptions) | null): Xlsx.XlsxPromise<Xlsx.SheetResult>;
        /** @since 6.8.1 */
        convertAsync(path: string, options?: Xlsx.ConvertOptions & Xlsx.ProgressOptions): Xlsx.XlsxPromise<Xlsx.SheetResult>;

        /**
         * Writes one sheet as csv (UTF-8 by default); {@link convert} with the csv format.
         * @since 6.8.1
         */
        toCsv(path: string, output: Xlsx.Output, options?: Xlsx.ToCsvOptions | null): Xlsx.SheetResult;
        /** @since 6.8.1 */
        toCsv(path: string, options?: Xlsx.ToCsvOptions): Xlsx.SheetResult;
        /** @since 6.8.1 */
        toCsvAsync(path: string, output: Xlsx.Output, options?: (Xlsx.ToCsvOptions & Xlsx.ProgressOptions) | null): Xlsx.XlsxPromise<Xlsx.SheetResult>;
        /** @since 6.8.1 */
        toCsvAsync(path: string, options?: Xlsx.ToCsvOptions & Xlsx.ProgressOptions): Xlsx.XlsxPromise<Xlsx.SheetResult>;

        /**
         * Merges 2 to 64 files in order (more is `LIMIT_EXCEEDED`): each input's sheets into one workbook (`mode: 'sheets'`)
         * or the rows of all inputs into one sheet (`mode: 'rows'`). The format follows `format`, the output's extension or
         * the first input.
         * @since 6.8.1
         * @example
         * xlsx.merge(['jan.xlsx', 'feb.xlsx'], 'q1.xlsx', { mode: 'rows', header: true });
         */
        merge(inputs: string[], output: Xlsx.Output, options?: Xlsx.MergeOptions | null): Xlsx.SheetResult;
        /** @since 6.8.1 */
        merge(inputs: string[], options?: Xlsx.MergeOptions): Xlsx.SheetResult;
        /** @since 6.8.1 */
        mergeAsync(inputs: string[], output: Xlsx.Output, options?: (Xlsx.MergeOptions & Xlsx.ProgressOptions) | null): Xlsx.XlsxPromise<Xlsx.SheetResult>;
        /** @since 6.8.1 */
        mergeAsync(inputs: string[], options?: Xlsx.MergeOptions & Xlsx.ProgressOptions): Xlsx.XlsxPromise<Xlsx.SheetResult>;

        /**
         * Splits a file into at most 256 files in `outputDir` (a new directory by default): one per sheet (`by: 'sheet'`, the
         * default), per `{ rows: n }` rows, or per value of `{ column }`.
         * @since 6.8.1
         * @example
         * xlsx.split('/sdcard/Download/all.xlsx', { by: { column: 'B' }, header: true }).paths.forEach(p => console.log(p));
         */
        split(path: string, outputDir: Xlsx.Output, options?: Xlsx.SplitOptions | null): Xlsx.SplitResult;
        /** @since 6.8.1 */
        split(path: string, options?: Xlsx.SplitOptions): Xlsx.SplitResult;
        /** @since 6.8.1 */
        splitAsync(path: string, outputDir: Xlsx.Output, options?: (Xlsx.SplitOptions & Xlsx.ProgressOptions) | null): Xlsx.XlsxPromise<Xlsx.SplitResult>;
        /** @since 6.8.1 */
        splitAsync(path: string, options?: Xlsx.SplitOptions & Xlsx.ProgressOptions): Xlsx.XlsxPromise<Xlsx.SplitResult>;

        /**
         * Writes a copy without duplicate rows of one sheet (by all columns, or by `columns`); `removed` counts them.
         * @since 6.8.1
         */
        dedupe(path: string, output: Xlsx.Output, options?: Xlsx.DedupeOptions | null): Xlsx.SheetResult;
        /** @since 6.8.1 */
        dedupe(path: string, options?: Xlsx.DedupeOptions): Xlsx.SheetResult;
        /** @since 6.8.1 */
        dedupeAsync(path: string, output: Xlsx.Output, options?: (Xlsx.DedupeOptions & Xlsx.ProgressOptions) | null): Xlsx.XlsxPromise<Xlsx.SheetResult>;
        /** @since 6.8.1 */
        dedupeAsync(path: string, options?: Xlsx.DedupeOptions & Xlsx.ProgressOptions): Xlsx.XlsxPromise<Xlsx.SheetResult>;

        /**
         * Recalculates every formula and writes a copy (`output` in the options, the default output otherwise); formulas
         * with unsupported functions keep no cached value and are listed in `warnings`.
         * @since 6.8.1
         */
        recalc(path: string, options?: Xlsx.RecalcOptions | null): Xlsx.SheetResult;
        /** @since 6.8.1 */
        recalcAsync(path: string, options?: (Xlsx.RecalcOptions & Xlsx.ProgressOptions) | null): Xlsx.XlsxPromise<Xlsx.SheetResult>;

        /**
         * Writes an encrypted copy of a workbook (xlsx and xlsm with Agile encryption, xls with RC4).
         * @since 6.8.1
         */
        encrypt(path: string, output: Xlsx.Output, options: Xlsx.CryptOptions): Xlsx.SheetResult;
        /** @since 6.8.1 */
        encrypt(path: string, options: Xlsx.CryptOptions): Xlsx.SheetResult;
        /** @since 6.8.1 */
        encryptAsync(path: string, output: Xlsx.Output, options: Xlsx.CryptOptions & Xlsx.ProgressOptions): Xlsx.XlsxPromise<Xlsx.SheetResult>;
        /** @since 6.8.1 */
        encryptAsync(path: string, options: Xlsx.CryptOptions & Xlsx.ProgressOptions): Xlsx.XlsxPromise<Xlsx.SheetResult>;

        /**
         * Writes a copy without encryption; `password` opens the input.
         * @since 6.8.1
         */
        decrypt(path: string, output: Xlsx.Output, options: Xlsx.CryptOptions): Xlsx.SheetResult;
        /** @since 6.8.1 */
        decrypt(path: string, options: Xlsx.CryptOptions): Xlsx.SheetResult;
        /** @since 6.8.1 */
        decryptAsync(path: string, output: Xlsx.Output, options: Xlsx.CryptOptions & Xlsx.ProgressOptions): Xlsx.XlsxPromise<Xlsx.SheetResult>;
        /** @since 6.8.1 */
        decryptAsync(path: string, options: Xlsx.CryptOptions & Xlsx.ProgressOptions): Xlsx.XlsxPromise<Xlsx.SheetResult>;

        /**
         * Detects the format of a file by its content, and for text files the encoding, delimiter and BOM, with a
         * confidence from 0 to 1.
         * @since 6.8.1
         */
        sniff(path: string): Xlsx.SniffResult;
        /** @since 6.8.1 */
        sniffAsync(path: string, options?: Xlsx.ProgressOptions | null): Xlsx.XlsxPromise<Xlsx.SniffResult>;

        /**
         * Opens a file in the plugin and keeps it open until `close()` or the script's exit, for several reads and edits
         * saved with `save()`. `mode: 'auto'` (default) loads it whole when it fits (at most 1,000,000 cells) and streams it
         * read-only otherwise (`READ_ONLY` for edits).
         * @since 6.8.1
         * @example
         * let book = xlsx.open('/sdcard/Download/report.xlsx');
         * try {
         *     let sheet = book.sheet(1);
         *     sheet.set('D1', { f: 'SUM(B2:B10)' });
         *     book.save('/sdcard/Documents/report-sum.xlsx');
         * } finally {
         *     book.close();
         * }
         */
        open(path: string, options?: Xlsx.OpenOptions | null): Xlsx.Workbook;
        /** @since 6.8.1 */
        openAsync(path: string, options?: Xlsx.OpenOptions | null): Xlsx.XlsxPromise<Xlsx.Workbook>;

        /**
         * A new empty workbook (xlsx by default) with one sheet (`'Sheet1'` by default); its `save` needs an output.
         * @since 6.8.1
         */
        create(options?: Xlsx.CreateOptions | null): Xlsx.Workbook;
        /** @since 6.8.1 */
        createAsync(options?: Xlsx.CreateOptions | null): Xlsx.XlsxPromise<Xlsx.Workbook>;

        /**
         * A streaming writer for large outputs (xlsx, xlsm, csv and tsv; xls is `UNSUPPORTED_FORMAT`): rows go to the file
         * in chunks, `close()` moves it into place, `abort()` or the script's exit discards it.
         * @since 6.8.1
         * @example
         * let writer = xlsx.createWriter('/sdcard/Documents/big.xlsx', { header: ['Id', 'Value'] });
         * for (let i = 1; i <= 100000; i++) writer.addRow([i, Math.random()]);
         * console.log(writer.close().sizeBytes);
         */
        createWriter(path: string, options?: Xlsx.WriterOptions | null): Xlsx.Writer;
        /** @since 6.8.1 */
        createWriterAsync(path: string, options?: Xlsx.WriterOptions | null): Xlsx.XlsxPromise<Xlsx.Writer>;

        /**
         * Shows a file, or rows given by the script, in the plugin's viewer and returns a session whose events arrive on
         * the script thread; the script keeps running while the session is open. AutoJs6 has to be visible
         * (`UI_REQUIRES_FOREGROUND`), except when the viewer still shows this script's previous session: the new `view`
         * then replaces it in place and the old session closes with reason `replaced`.
         * @since 6.8.1
         * @example
         * xlsx.view('/sdcard/Download/report.xlsx', { header: true, selectable: 'row' })
         *     .on('select', e => console.log(e.row, e.values))
         *     .on('close', e => console.log(e.reason));
         */
        view(pathOrRows: string | Xlsx.Rows, options?: Xlsx.ViewOptions | null): Xlsx.SheetViewSession;
        /** @since 6.8.1 */
        viewAsync(pathOrRows: string | Xlsx.Rows, options?: Xlsx.ViewOptions | null): Xlsx.XlsxPromise<Xlsx.SheetViewSession>;
    }

    namespace Xlsx {

        /** The Promise of an `xxxAsync` call; `cancel()` is true when it stopped a running call, which then rejects with `CANCELLED`. */
        type XlsxPromise<T> = Promise<T> & {
            cancel(): boolean;
        };

        /** A path; `null` or `undefined` for the default output. */
        type Output = string | null | undefined;

        type Format = 'xlsx' | 'xlsm' | 'xls' | 'csv' | 'tsv';

        /** A cell value: strings, numbers, booleans, dates (Date) and null for an empty cell; an error cell reads as its text (`'#DIV/0!'`). */
        type CellValue = string | number | boolean | Date | null;

        /** A cell to write with a formula (`f`, without `=`) or a style (an id from `createStyle`, or a spec). */
        interface CellObject {
            v?: CellValue;
            f?: string | null;
            style?: number | StyleSpec | null;
        }

        type CellInput = CellValue | CellObject;

        /** Cells in column order, or an object keyed by header name or column letters. */
        type Row = CellInput[] | { [column: string]: CellInput };

        /** Rows to write: an array (a Java list or array works too) of rows. */
        type Rows = Row[];

        /** A sheet by name or by its index from 1. */
        type SheetRef = string | number;

        /** A column by number (from 1) or by letters (`'C'`). */
        type ColumnRef = number | string;

        type ErrorCode =
            | 'PLUGIN_UNAVAILABLE'
            | 'PLUGIN_DISABLED'
            | 'PLUGIN_INCOMPATIBLE'
            | 'INVALID_ARGUMENT'
            | 'FILE_NOT_FOUND'
            | 'INVALID_FILE'
            | 'UNSUPPORTED_FORMAT'
            | 'PASSWORD_REQUIRED'
            | 'WRONG_PASSWORD'
            | 'SHEET_NOT_FOUND'
            | 'RANGE_INVALID'
            | 'LIMIT_EXCEEDED'
            | 'TOO_MANY_HANDLES'
            | 'READ_ONLY'
            | 'FORMULA_ERROR'
            | 'SESSION_CLOSED'
            | 'UI_REQUIRES_FOREGROUND'
            | 'STORAGE_PERMISSION_DENIED'
            | 'CANCELLED'
            | 'TIMEOUT'
            | 'UNSUPPORTED'
            | 'IO_ERROR'
            | 'INTERNAL';

        /** `name` is `'XlsxError'`; `toString()` yields `XlsxError [CODE]: message`; `message` is not enumerable. */
        interface XlsxError extends Error {
            readonly name: 'XlsxError';
            /** `'INTERNAL'` when the constructor got none. */
            readonly code: ErrorCode | string;
            /** The text of the underlying failure when there is one. */
            readonly cause?: string;
            /** The sheet the failure concerns, when known. */
            readonly sheet?: string;
            /** The cell or range the failure concerns, when known. */
            readonly ref?: string;
        }

        /** Callable with or without `new`. */
        interface XlsxErrorConstructor {
            (message?: string, code?: ErrorCode | string): XlsxError;
            new(message?: string, code?: ErrorCode | string): XlsxError;
            readonly prototype: XlsxError;
        }

        interface Progress {
            /** The id of the call. */
            readonly opId: number;
            /** 0 to 100. */
            readonly percent: number;
            readonly stage: string;
            readonly current: number;
            readonly total: number;
        }

        /** Only the `Async` forms that report progress take it (see {@link Xlsx}). */
        interface ProgressOptions {
            /** Runs on the script thread while the call works; throwing from it cancels the call. */
            onProgress?: ((progress: Progress) => void) | null;
        }

        interface PasswordOptions {
            /** Opens an encrypted input. */
            password?: string | null;
        }

        /** How an input is opened. */
        interface SourceOptions extends PasswordOptions {
            /** The input's format when its extension does not say it. */
            format?: Format;
            /** csv / tsv: the encoding (detected by default). */
            encoding?: string;
            /** csv / tsv: the delimiter (detected by default). */
            delimiter?: string;
            /** csv / tsv: numeric text becomes numbers (default true). */
            parseNumbers?: boolean;
            /** csv / tsv: `true` / `false` text becomes booleans. */
            parseBooleans?: boolean;
        }

        interface OpenOptions extends SourceOptions {
            /** `'auto'` (default), `'full'` (`LIMIT_EXCEEDED` over 1,000,000 cells) or `'stream'` (read-only). */
            mode?: 'auto' | 'full' | 'stream';
        }

        /** The rows of a read; `range` and `from` / `to` narrow them. */
        interface SheetReadOptions {
            /** An A1 range. */
            range?: string;
            /** The first row, from 1. */
            from?: number;
            /** The last row, not before `from` (`RANGE_INVALID`). */
            to?: number;
            /** Object rows keyed by the first row. */
            header?: boolean;
            /** {@link CellDetail} cells instead of values. */
            cells?: boolean;
            /** Display texts as Excel shows them. */
            formatted?: boolean;
            /** Keeps blank rows; default true for array rows, false for object rows. */
            blankRows?: boolean;
            /** Trims strings and header names. */
            trim?: boolean;
            /** At most this many rows; 0 for none. */
            limit?: number;
        }

        interface ReadOptions extends OpenOptions, SheetReadOptions {
            /** The first sheet by default. */
            sheet?: SheetRef;
        }

        interface ReadAllOptions extends OpenOptions, SheetReadOptions {
        }

        interface EachRowOptions {
            /** Rows per callback, 1 to 1000; default 1000. */
            batch?: number;
            from?: number;
            to?: number;
            range?: string;
            header?: boolean;
            cells?: boolean;
            formatted?: boolean;
            blankRows?: boolean;
            trim?: boolean;
        }

        type BorderStyle =
            | 'none' | 'thin' | 'medium' | 'thick' | 'dashed' | 'dotted' | 'double' | 'hair'
            | 'mediumDashed' | 'dashDot' | 'mediumDashDot' | 'dashDotDot' | 'mediumDashDotDot' | 'slantedDashDot';

        interface BorderSide {
            style?: BorderStyle;
            /** `'#RRGGBB'`. */
            color?: string;
        }

        interface FontSpec {
            name?: string;
            /** Points, more than 0. */
            size?: number;
            bold?: boolean;
            italic?: boolean;
            underline?: boolean | 'none' | 'single' | 'double' | 'singleAccounting' | 'doubleAccounting';
            strike?: boolean;
            /** `'#RRGGBB'`. */
            color?: string;
        }

        /** A cell style; properties left out keep the cell's current values when a spec is laid over existing cells. */
        interface StyleSpec {
            font?: FontSpec;
            /** `'#RRGGBB'` or `'none'`. */
            fill?: string;
            /** One style for all sides, or per side. */
            border?: BorderStyle | { top?: BorderStyle | BorderSide, bottom?: BorderStyle | BorderSide, left?: BorderStyle | BorderSide, right?: BorderStyle | BorderSide };
            align?: 'general' | 'left' | 'center' | 'right' | 'fill' | 'justify' | 'centerAcross' | 'distributed';
            valign?: 'top' | 'middle' | 'bottom' | 'justify' | 'distributed';
            wrap?: boolean;
            /** An Excel number format, such as `'0.00%'` or `'yyyy-mm-dd'`. */
            numFmt?: string;
            indent?: number;
            /** -90 to 90, or 255 for vertical text. */
            rotation?: number;
        }

        /** The width of a column in characters (at most 255), or `'auto'` to fit the content. */
        type ColumnWidth = number | 'auto';

        /** Layout of the written block, applied after its rows (csv and tsv take none). */
        interface LayoutOptions {
            /** Specs for the header row, the body rows, and columns keyed by letters or numbers. */
            styles?: { header?: StyleSpec, body?: StyleSpec, columns?: { [column: string]: StyleSpec } };
            /** `'auto'` for every written column, an array by column (null skips one), or an object keyed by column. */
            columnWidths?: 'auto' | Array<ColumnWidth | null> | { [column: string]: ColumnWidth };
            /** Points (at most 409), keyed by row number. */
            rowHeights?: { [row: number]: number };
            /** A range or ranges to merge. */
            merges?: string | string[];
            /** Rows to freeze, or `{ rows, cols }`. */
            freeze?: number | { rows?: number, cols?: number };
            /** `true` (or `'*'`) for the written block, or an A1 range. */
            autoFilter?: true | string;
        }

        interface WriteOptions extends LayoutOptions {
            /** The sheet name; `'Sheet1'` by default. */
            sheet?: string;
            /** `true` / `false`: whether the first row is a header (styled by `styles.header`); names: writes them as the header row and orders object rows by them. */
            header?: boolean | string[];
            /** The output format; the extension by default. */
            format?: Format;
            /** csv / tsv: default UTF-8. */
            encoding?: string;
            /** csv / tsv: default `,` / tab. */
            delimiter?: string;
            /** csv / tsv: writes a BOM. */
            bom?: boolean;
            /** Encrypts the output (workbooks only). */
            password?: string | null;
            /** The number format of Date cells; default `'yyyy-mm-dd hh:mm:ss'`. */
            dateFormat?: string;
            /** Strings starting with `=` become formulas; default false. */
            formulas?: boolean;
            /** Computes the formulas' cached values on save; default true. */
            evaluate?: boolean;
        }

        interface WriteAllOptions extends LayoutOptions {
            header?: boolean | string[];
            format?: Format;
            encoding?: string;
            delimiter?: string;
            bom?: boolean;
            password?: string | null;
            dateFormat?: string;
            formulas?: boolean;
            evaluate?: boolean;
        }

        interface AppendOptions extends LayoutOptions {
            /** The first sheet by default. */
            sheet?: SheetRef;
            /** Used when the append creates the file, as in {@link WriteOptions.header}. */
            header?: boolean | string[];
            /** Writes a new file when there is none; default false (`FILE_NOT_FOUND`). */
            createIfMissing?: boolean;
            /** Opens an encrypted file (and keeps it encrypted). */
            password?: string | null;
            dateFormat?: string;
            formulas?: boolean;
            /** csv / tsv: the file's encoding (detected by default). */
            encoding?: string;
            /** csv / tsv: the file's delimiter (detected by default). */
            delimiter?: string;
        }

        interface ConvertOptions extends PasswordOptions {
            /** The sheet to write into csv / tsv; the first by default. */
            sheet?: SheetRef;
            /** The target format. */
            format?: Format;
            /** The source format when its extension does not say it. */
            sourceFormat?: Format;
            /** The encoding of a csv / tsv output (or, without `sourceEncoding`, of the source when it becomes a workbook). */
            encoding?: string;
            /** The encoding of a csv / tsv source, whatever the output format (detected by default). */
            sourceEncoding?: string;
            delimiter?: string;
            bom?: boolean;
            parseNumbers?: boolean;
            /** Writes display texts into csv / tsv. */
            formatted?: boolean;
        }

        interface ToCsvOptions extends PasswordOptions {
            sheet?: SheetRef;
            /** Default UTF-8. */
            encoding?: string;
            /** The encoding of a csv / tsv source (detected by default). */
            sourceEncoding?: string;
            delimiter?: string;
            bom?: boolean;
            formatted?: boolean;
        }

        interface MergeOptions {
            /** `'sheets'`: every input's sheets side by side; `'rows'`: all rows in one sheet. */
            mode?: 'sheets' | 'rows';
            /** `'rows'`: the inputs start with a header row, kept once. */
            header?: boolean;
            /** One sheet name per input. */
            sheetNames?: string[];
            /** One per input, null for an input without a password. */
            passwords?: Array<string | null>;
            /**
             * Encrypts a workbook output (not for csv / tsv). Left out, the output takes the password of the first input
             * opened with one; `null` or `''` writes it plain.
             */
            outputPassword?: string | null;
            /** The output format; the output's extension or the first input by default. */
            format?: Format;
        }

        interface SplitOptions extends PasswordOptions {
            /** `'sheet'` (default), `{ rows: n }` or `{ column: 'C' }` (a file per distinct value). */
            by?: 'sheet' | { rows: number } | { column: ColumnRef };
            /** Placeholders `{name}`, `{index}` and `{value}`. */
            namePattern?: string;
            /** The sheet to split by rows or column; the first by default. */
            sheet?: SheetRef;
            /** The first row is a header, repeated in every output. */
            header?: boolean;
        }

        interface DedupeOptions extends PasswordOptions {
            sheet?: SheetRef;
            /** The columns that make a row a duplicate; all by default. */
            columns?: ColumnRef | ColumnRef[];
            /** Default `'first'`. */
            keep?: 'first' | 'last';
            /** The first row is a header and never removed. */
            header?: boolean;
        }

        interface RecalcOptions extends PasswordOptions {
            /** The output path; the default output when left out. */
            output?: string;
        }

        /** Needed: the password to encrypt with, or to open the input with. */
        interface CryptOptions {
            password: string;
        }

        interface CreateOptions {
            /** Default `'xlsx'`. */
            format?: Format;
            /** The name of the first sheet; default `'Sheet1'`. */
            sheet?: string;
        }

        interface WriterSheetOptions {
            /** `true` / null (default): the first row (or the keys of the first object row) is the header; `false`: none; names: the header row. */
            header?: boolean | string[] | null;
            columnWidths?: 'auto' | Array<ColumnWidth | null> | { [column: string]: ColumnWidth };
            freeze?: number | { rows?: number, cols?: number };
            autoFilter?: true | string;
        }

        interface WriterOptions extends WriterSheetOptions {
            /** The first sheet's name; default `'Sheet1'`. */
            sheet?: string;
            /** The extension by default. */
            format?: Format;
            encoding?: string;
            delimiter?: string;
            bom?: boolean;
            /** Encrypts the output (xlsx / xlsm). */
            password?: string | null;
        }

        interface ViewColumn {
            /** A column number, letters, or a header name. */
            key: number | string;
            title?: string;
            /** In dp. */
            width?: number;
            align?: 'left' | 'center' | 'right';
        }

        interface ViewOptions {
            title?: string;
            /** The sheet shown first. */
            sheet?: SheetRef;
            /** The first row is a header. */
            header?: boolean;
            /** The columns to show: numbers or letters, or column specs. */
            columns?: ColumnRef[] | ViewColumn[];
            /** `true` / `'row'` select rows, `'cell'` cells, `false` / `'none'` nothing. */
            selectable?: boolean | 'row' | 'cell' | 'none';
            password?: string;
            format?: Format;
            encoding?: string;
            delimiter?: string;
        }

        interface SaveOptions {
            /** A string encrypts the output; `null` or `''` removes the encryption; left out, the file keeps its own. */
            password?: string | null;
            /** The output's extension by default. */
            format?: Format;
            /** Computes the formulas' cached values after value changes; default true. */
            evaluate?: boolean;
        }

        interface SheetSummary {
            readonly name: string;
            /** From 1. */
            readonly index: number;
            readonly rows: number;
            readonly cols: number;
            /** The used range, such as `'A1:D20'`. */
            readonly dimension: string | null;
            readonly hidden: boolean;
        }

        interface SheetFileInfo {
            readonly format: Format | string;
            readonly sheets: SheetSummary[];
            readonly sizeBytes: number;
            readonly encrypted: boolean;
            /** csv / tsv only. */
            readonly encoding: string | null;
            readonly delimiter: string | null;
            readonly hasBom: boolean | null;
            /** `'1900'` or `'1904'` for workbooks. */
            readonly dateSystem: string | null;
        }

        /** A written file. */
        interface SheetResult {
            readonly path: string;
            readonly format: Format | string;
            readonly sheets: Array<{ readonly name: string, readonly rows: number, readonly cols: number }>;
            readonly sizeBytes: number;
            readonly warnings: string[];
            /** `dedupe` only: the rows removed. */
            readonly removed?: number;
        }

        interface SplitOutput {
            readonly name: string;
            readonly format: Format | string;
            readonly sheets: Array<{ readonly name: string, readonly rows: number, readonly cols: number }>;
            readonly sizeBytes: number;
            readonly warnings: string[];
        }

        interface SplitResult {
            readonly paths: string[];
            readonly outputs: SplitOutput[];
            readonly warnings: string[];
        }

        /** `Workbook.recalc()`: formulas found and evaluated. */
        interface RecalcSummary {
            readonly formulas: number;
            readonly evaluated: number;
            readonly warnings: string[];
        }

        /** A cell with `cells: true`: `t` is n(umber), s(tring), b(oolean), d(ate), e(rror) or z (empty). */
        interface CellDetail {
            readonly v: CellValue;
            /** The formula (without `=`); only on a formula cell. */
            readonly f?: string;
            readonly t: 'n' | 's' | 'b' | 'd' | 'e' | 'z';
            readonly text: string;
            /** The style id, 0 for the default style (ids as from `Workbook.createStyle`). */
            readonly style: number;
            readonly ref: string;
            /** The merged range holding the cell; only from `Sheet.cell` with `cells: true` on a merged cell. */
            readonly merged?: string;
        }

        interface SniffResult {
            readonly format: Format | string;
            readonly encoding: string | null;
            readonly delimiter: string | null;
            readonly hasBom: boolean;
            /** 0 to 1. */
            readonly confidence: number;
        }

        interface FindOptions {
            regex?: boolean;
            caseSensitive?: boolean;
            /** Searches only this A1 range. */
            range?: string;
            /** 1 to 1000; default 100. */
            limit?: number;
            /** Skips this many hits. */
            offset?: number;
        }

        interface FindHit {
            readonly sheet: string;
            readonly ref: string;
            readonly row: number;
            readonly col: number;
            readonly text: string;
        }

        /** `'min'`, `'max'`, or a threshold of a color scale, data bar or icon set. */
        type RulePoint = 'min' | 'max' | { type: 'num' | 'percent' | 'percentile' | 'formula', value: number | string, gte?: boolean };

        /** Rule styles take only `font.color`, `font.bold`, `font.italic`, `fill`, `border` and `numFmt`. */
        interface RuleBase {
            priority?: number;
            stopIfTrue?: boolean;
        }

        /** A rule read back by `Sheet.conditionalFormats` / `Sheet.validations`. */
        interface RuleEntry<R> {
            /** The ranges of the rule, separated by spaces. */
            readonly range: string;
            readonly rule: R;
        }

        type CellIsOperator = 'between' | 'notBetween' | 'eq' | 'ne' | 'gt' | 'lt' | 'ge' | 'le' | string;

        /**
         * A conditional format (xls supports only `cellIs` and `expression`; csv / tsv none). A rule read back that has no
         * mapping is `{ type: 'unknown', description }`.
         */
        type ConditionalFormatRule =
            | RuleBase & { type: 'cellIs', operator?: CellIsOperator, value: number | string, value2?: number | string, style?: StyleSpec }
            | RuleBase & { type: 'expression', formula: string, style?: StyleSpec }
            | RuleBase & { type: 'top10', rank?: number, bottom?: boolean, percent?: boolean, style?: StyleSpec }
            | RuleBase & { type: 'duplicateValues' | 'uniqueValues', style?: StyleSpec }
            | RuleBase & { type: 'colorScale', colors: string[], points?: RulePoint[] }
            | RuleBase & { type: 'dataBar', color?: string, showValue?: boolean, points?: RulePoint[] }
            | RuleBase & { type: 'iconSet', set?: string, reverse?: boolean, showValue?: boolean, points?: RulePoint[] }
            | RuleBase & { type: 'unknown', readonly description: string };

        interface ValidationBase {
            /** Default true. */
            allowBlank?: boolean;
            prompt?: { title?: string, text?: string } | false;
            error?: { title?: string, text?: string, style?: 'stop' | 'warning' | 'info' } | false;
        }

        /** A data validation (csv / tsv none). */
        type ValidationRule =
            | ValidationBase & { type: 'list', values?: string[], formula?: string, showDropdown?: boolean }
            | ValidationBase & { type: 'whole' | 'decimal' | 'date' | 'time' | 'textLength', operator?: CellIsOperator, min?: number | string | Date, max?: number | string | Date, value?: number | string | Date }
            | ValidationBase & { type: 'custom', formula: string }
            | ValidationBase & { type: 'any' }
            | ValidationBase & { type: 'unknown', readonly description: string };

        /**
         * A workbook kept open by {@link Xlsx.open} or {@link Xlsx.create}. Each method has an `xxxAsync` form as on the
         * module (only `saveAsync` reports progress). Calls after `close()` are `SESSION_CLOSED`; the script's exit closes it.
         * @see https://docs.autojs6.com/#/xlsxWorkbookType
         */
        interface Workbook {
            readonly format: Format | string;
            /** `'full'` or `'stream'`; null for a created workbook. */
            readonly mode: 'full' | 'stream' | string | null;
            readonly isClosed: boolean;

            info(): SheetFileInfo;
            infoAsync(): XlsxPromise<SheetFileInfo>;
            sheetNames(): string[];
            sheetNamesAsync(): XlsxPromise<string[]>;
            /** The sheet by name or index from 1 (`SHEET_NOT_FOUND`); the same object for the same sheet. */
            sheet(nameOrIndex: SheetRef): Sheet;
            sheetAsync(nameOrIndex: SheetRef): XlsxPromise<Sheet>;
            /** Adds a sheet (at most 31 characters), last or at `index` (from 1). */
            addSheet(name: string, options?: { index?: number } | null): Sheet;
            addSheetAsync(name: string, options?: { index?: number } | null): XlsxPromise<Sheet>;
            removeSheet(nameOrIndex: SheetRef): void;
            removeSheetAsync(nameOrIndex: SheetRef): XlsxPromise<void>;
            renameSheet(nameOrIndex: SheetRef, name: string): void;
            renameSheetAsync(nameOrIndex: SheetRef, name: string): XlsxPromise<void>;
            copySheet(nameOrIndex: SheetRef, name: string): Sheet;
            copySheetAsync(nameOrIndex: SheetRef, name: string): XlsxPromise<Sheet>;
            /** Moves a sheet to `index` (from 1). */
            moveSheet(nameOrIndex: SheetRef, index: number): void;
            moveSheetAsync(nameOrIndex: SheetRef, index: number): XlsxPromise<void>;
            setSheetHidden(nameOrIndex: SheetRef, hidden: boolean): void;
            setSheetHiddenAsync(nameOrIndex: SheetRef, hidden: boolean): XlsxPromise<void>;
            /** Registers a style and answers its id, for `set`, `setRows` and `setStyle`. */
            createStyle(spec: StyleSpec): number;
            createStyleAsync(spec: StyleSpec): XlsxPromise<number>;
            /** Recalculates every formula in place. */
            recalc(): RecalcSummary;
            recalcAsync(): XlsxPromise<RecalcSummary>;
            /** Writes the workbook to `output`, or back to its file when left out (a created workbook needs an output). */
            save(output: Output, options?: SaveOptions | null): SheetResult;
            save(options?: SaveOptions): SheetResult;
            saveAsync(output: Output, options?: (SaveOptions & ProgressOptions) | null): XlsxPromise<SheetResult>;
            saveAsync(options?: SaveOptions & ProgressOptions): XlsxPromise<SheetResult>;
            /** Closes the workbook in the plugin without saving; idempotent. */
            close(): void;
            closeAsync(): XlsxPromise<void>;
            /** `Workbook { format: ..., mode: ... }`, with `, closed` once closed. */
            toString(): string;
        }

        /**
         * A sheet of a {@link Workbook}, addressed by its current name (renames follow). `index`, `rows`, `cols` and
         * `dimension` are read from the plugin on each access. Each method has an `xxxAsync` form; none reports progress.
         * Calls after its removal are `SHEET_NOT_FOUND`; edits of a stream-mode workbook are `READ_ONLY`.
         * @see https://docs.autojs6.com/#/xlsxSheetType
         */
        interface Sheet {
            readonly name: string;
            /** From 1. */
            readonly index: number;
            readonly rows: number;
            readonly cols: number;
            readonly dimension: string | null;

            read(options?: SheetReadOptions | null): any[];
            readAsync(options?: SheetReadOptions | null): XlsxPromise<any[]>;
            /**
             * Reads the rows chunk by chunk (`batch` rows each) on the script thread; returning `false` stops. Answers the
             * number of rows handed to the callback.
             */
            eachRow(callback: (rows: any[], startRow: number) => boolean | void, options?: EachRowOptions | null): number;
            eachRowAsync(callback: (rows: any[], startRow: number) => boolean | void, options?: EachRowOptions | null): XlsxPromise<number>;
            /** A cell value, or its details with `cells: true`. */
            cell(ref: string, options?: { cells?: boolean, formatted?: boolean } | null): CellValue | CellDetail;
            cell(row: number, col: ColumnRef, options?: { cells?: boolean, formatted?: boolean } | null): CellValue | CellDetail;
            cellAsync(ref: string, options?: { cells?: boolean, formatted?: boolean } | null): XlsxPromise<CellValue | CellDetail>;
            cellAsync(row: number, col: ColumnRef, options?: { cells?: boolean, formatted?: boolean } | null): XlsxPromise<CellValue | CellDetail>;
            /** Sets a value, or `{ v, f, style }`. */
            set(ref: string, value: CellInput): void;
            setAsync(ref: string, value: CellInput): XlsxPromise<void>;
            /** Writes rows from `startRow` on; answers the rows written. */
            setRows(startRow: number, rows: Rows, options?: { style?: number | StyleSpec, dateFormat?: string, formulas?: boolean } | null): number;
            setRowsAsync(startRow: number, rows: Rows, options?: { style?: number | StyleSpec, dateFormat?: string, formulas?: boolean } | null): XlsxPromise<number>;
            /** Writes rows after the last row; answers the rows written. */
            append(rows: Rows): number;
            appendAsync(rows: Rows): XlsxPromise<number>;
            insertRows(at: number, count?: number): void;
            insertRowsAsync(at: number, count?: number): XlsxPromise<void>;
            deleteRows(at: number, count?: number): void;
            deleteRowsAsync(at: number, count?: number): XlsxPromise<void>;
            insertColumns(at: ColumnRef, count?: number): void;
            insertColumnsAsync(at: ColumnRef, count?: number): XlsxPromise<void>;
            deleteColumns(at: ColumnRef, count?: number): void;
            deleteColumnsAsync(at: ColumnRef, count?: number): XlsxPromise<void>;
            /** Clears the values of a range, or of the whole sheet. */
            clear(range?: string | null): void;
            clearAsync(range?: string | null): XlsxPromise<void>;
            /** Lays a spec over the cells' styles (or replaces them with a style id); answers the style id. */
            setStyle(range: string, style: StyleSpec | number): number;
            setStyleAsync(range: string, style: StyleSpec | number): XlsxPromise<number>;
            setColumnWidth(col: ColumnRef, width: ColumnWidth): void;
            setColumnWidthAsync(col: ColumnRef, width: ColumnWidth): XlsxPromise<void>;
            /** Points, at most 409. */
            setRowHeight(row: number, height: number): void;
            setRowHeightAsync(row: number, height: number): XlsxPromise<void>;
            merge(range: string): void;
            mergeAsync(range: string): XlsxPromise<void>;
            unmerge(range: string): void;
            unmergeAsync(range: string): XlsxPromise<void>;
            /** The merged ranges. */
            merges(): string[];
            mergesAsync(): XlsxPromise<string[]>;
            /** Freezes rows and columns; `freeze(0)` unfreezes. */
            freeze(rows: number, cols?: number): void;
            freezeAsync(rows: number, cols?: number): XlsxPromise<void>;
            /** An A1 range, or `true` / `'*'` for the used range. */
            autoFilter(range: true | string): void;
            autoFilterAsync(range: true | string): XlsxPromise<void>;
            setHyperlink(ref: string, url: string, options?: { label?: string } | null): void;
            setHyperlinkAsync(ref: string, url: string, options?: { label?: string } | null): XlsxPromise<void>;
            setComment(ref: string, text: string, options?: { author?: string } | null): void;
            setCommentAsync(ref: string, text: string, options?: { author?: string } | null): XlsxPromise<void>;
            /** Anchors a PNG or JPEG file at `from` (needed), stretched to `to` or sized by `width` / `height` in pixels. */
            addImage(path: string, options: { from: string, to?: string, width?: number, height?: number }): void;
            addImageAsync(path: string, options: { from: string, to?: string, width?: number, height?: number }): XlsxPromise<void>;
            addConditionalFormat(range: string, rule: ConditionalFormatRule): void;
            addConditionalFormatAsync(range: string, rule: ConditionalFormatRule): XlsxPromise<void>;
            conditionalFormats(): RuleEntry<ConditionalFormatRule>[];
            conditionalFormatsAsync(): XlsxPromise<RuleEntry<ConditionalFormatRule>[]>;
            addValidation(range: string, rule: ValidationRule): void;
            addValidationAsync(range: string, rule: ValidationRule): XlsxPromise<void>;
            validations(): RuleEntry<ValidationRule>[];
            validationsAsync(): XlsxPromise<RuleEntry<ValidationRule>[]>;
            /** Removes the conditional formats and validations touching a range; answers how many. */
            clearRules(range: string): number;
            clearRulesAsync(range: string): XlsxPromise<number>;
            find(keyword: string, options?: FindOptions | null): FindHit[];
            findAsync(keyword: string, options?: FindOptions | null): XlsxPromise<FindHit[]>;
            /** Sorts the rows (of `range`, or the used range) by a column. */
            sort(col: ColumnRef, options?: { desc?: boolean, hasHeader?: boolean, range?: string } | null): void;
            sortAsync(col: ColumnRef, options?: { desc?: boolean, hasHeader?: boolean, range?: string } | null): XlsxPromise<void>;
            /** `Sheet { name: ... }`, with `, removed` once removed. */
            toString(): string;
        }

        /**
         * The streaming writer of {@link Xlsx.createWriter}. Each method has an `xxxAsync` form (only `closeAsync` reports
         * progress). After `close()` (whether it succeeds or not) or `abort()`, every call but `abort()` is `SESSION_CLOSED`,
         * a buffered `addRow()` included, and `rowCount` stays.
         * @see https://docs.autojs6.com/#/xlsxWriterType
         */
        interface Writer {
            readonly format: Format | string;
            /** The data rows added so far (header rows not counted). */
            readonly rowCount: number;

            /** Starts a new sheet (workbooks only). */
            addSheet(name: string, options?: WriterSheetOptions | null): void;
            addSheetAsync(name: string, options?: WriterSheetOptions | null): XlsxPromise<void>;
            /**
             * Adds a row of cells or an object. Rows without `style` are buffered and sent in chunks (the chunks sent before
             * a failure leave the buffer, so a later call sends only the rest); a row with its own `style` is sent alone.
             */
            addRow(values: CellInput[] | { [column: string]: CellInput }, options?: { style?: StyleSpec } | null): void;
            addRowAsync(values: CellInput[] | { [column: string]: CellInput }, options?: { style?: StyleSpec } | null): XlsxPromise<void>;
            addRows(rows: Rows): void;
            addRowsAsync(rows: Rows): XlsxPromise<void>;
            /** Completes the file and moves it into place. */
            close(): SheetResult;
            closeAsync(options?: ProgressOptions | null): XlsxPromise<SheetResult>;
            /** Discards the output; idempotent. */
            abort(): void;
            abortAsync(): XlsxPromise<void>;
            /** `Writer { format: ..., rowCount: ... }`. */
            toString(): string;
        }

        interface SelectEvent {
            readonly sheet: string;
            readonly row: number;
            /** 0 when a whole row was selected. */
            readonly col: number;
            /** The values of the selected row. */
            readonly values: CellValue[];
        }

        /**
         * `closed`: the user or the system closed the viewer; `replaced`: another `view` of this script took the viewer;
         * `timeout`: the viewer never claimed the session; `finished`: `close({ finish: true })`.
         */
        type CloseReason = 'closed' | 'replaced' | 'timeout' | 'finished' | string;

        interface CloseEvent {
            readonly reason: CloseReason;
        }

        interface ViewState {
            readonly sheet: string | null;
            readonly row: number;
            readonly col: number;
            readonly rows: number;
            readonly cols: number;
            readonly token: string | null;
            /** Whether the viewer is on screen. */
            readonly visible: boolean;
        }

        /**
         * The event emitter returned by {@link Xlsx.view}; it has no `Async` methods. Events arrive on the script thread,
         * which keeps running while the session is open; `close` is the last event. The script's exit ends the session
         * without a `close` event and leaves the viewer open. Methods throw `SESSION_CLOSED` once closed.
         * @see https://docs.autojs6.com/#/xlsxViewSessionType
         */
        interface SheetViewSession extends EventEmitter$ {
            /** Replaces the shown content with rows or another file. */
            update(rowsOrPath: Rows | string): this;
            /**
             * Moves the selection to a row (from 1) and keeps the column; no `select` event follows (only the user's taps
             * send one). A row past the content leaves the selection.
             */
            select(row: number): this;
            /** The viewer's current state, read from the plugin. */
            state(): ViewState;
            /**
             * Disconnects the events without a `close` event and leaves the viewer open; `finish: true` also closes the
             * viewer, followed by a `close` event with reason `finished`.
             */
            close(options?: { finish?: boolean } | null): this;
            /** `SheetViewSession { open }` or `SheetViewSession { closed }`. */
            toString(): string;

            on(eventName: 'select', listener: (event: SelectEvent) => void): this;
            on(eventName: 'close', listener: (event: CloseEvent) => void): this;
            on(eventName: string, listener: (...args: any[]) => void): this;

            once(eventName: 'select', listener: (event: SelectEvent) => void): this;
            once(eventName: 'close', listener: (event: CloseEvent) => void): this;
            once(eventName: string, listener: (...args: any[]) => void): this;
        }
    }
}
