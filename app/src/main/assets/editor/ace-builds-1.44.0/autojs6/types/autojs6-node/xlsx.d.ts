/**
 * Rhino's xlsx module (3-Tally Sheet) for Node main threads and Workers, over the host's xlsx bridge (host 6.8.1 or later
 * with the 3-Tally Sheet plugin). Every member answers a Promise with a non-enumerable `cancel()`; the `xxxAsync` names
 * are the same calls and both take `onProgress` in the options. Codes, options and defaults are those of Rhino's xlsx:
 * paths follow the working directory of the script, rows and columns count from 1 and dates travel as Date objects.
 * Calls on one Workbook (with its sheets), Writer or viewer session run in the order the script made them. Capabilities
 * per call: reading needs files; write, writeAll, append, convert, toCsv, merge, split, dedupe, recalc, encrypt, decrypt,
 * createWriter, `Workbook.save` and every Writer method also need files.write; `view` and viewer sessions need files and ui.
 */
declare module "xlsx" {
  namespace xlsx {
    /** A call in progress: `cancel()` answers true when it stopped a running call, which then rejects with CANCELLED. */
    type XlsxPromise<T> = Promise<T> & { cancel(): boolean };

    /** A cell value: strings, numbers, booleans, dates (Date) and null for an empty cell. */
    type CellValue = string | number | boolean | Date | null;

    /** Rows as arrays of cells, or as objects keyed by the header row. */
    type Rows = CellValue[][] | Array<Record<string, CellValue>>;

    /** A sheet by name or by its index from 1. */
    type SheetRef = string | number;

    interface Progress {
        readonly opId: number;
        readonly percent: number;
        readonly stage: string;
        readonly current: number;
        readonly total: number;
    }

    /** A throwing or rejecting `onProgress` cancels the call, which rejects with that error. */
    interface ProgressOptions {
        onProgress?: ((progress: Progress) => unknown) | null;
    }

    interface PasswordOptions extends ProgressOptions {
        password?: string | null;
    }

    /** The codes of the 3-Tally Sheet contract (appendix C.3); a call without a declared capability rejects with ERR_AUTOJS6_CAPABILITY_NOT_DECLARED. */
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

    /** `name` is `'XlsxError'`; `toString()` yields `XlsxError [CODE]: message`; only `code` is enumerable. */
    interface XlsxError extends Error {
        readonly name: 'XlsxError';
        readonly code: ErrorCode | string;
    }

    interface XlsxErrorConstructor {
        (message?: string, code?: ErrorCode | string): XlsxError;
        new(message?: string, code?: ErrorCode | string): XlsxError;
        readonly prototype: XlsxError;
    }

    interface SheetSummary {
        readonly name: string;
        readonly index: number;
        readonly rows: number;
        readonly cols: number;
        readonly dimension: string | null;
        readonly hidden: boolean;
    }

    interface SheetFileInfo {
        readonly format: 'xlsx' | 'xls' | 'csv' | 'tsv' | string;
        readonly sheets: SheetSummary[];
        readonly sizeBytes: number;
        readonly encrypted: boolean;
        readonly encoding: string | null;
        readonly delimiter: string | null;
        readonly hasBom: boolean | null;
        readonly dateSystem: string | null;
    }

    interface SheetResult {
        readonly path: string;
        readonly format: string;
        readonly sheets: Array<{ readonly name: string, readonly rows: number, readonly cols: number }>;
        readonly sizeBytes: number;
        readonly warnings: string[];
        /** `dedupe` only: the rows removed. */
        readonly removed?: number;
    }

    /** A cell with `cells: true`: `t` is n(umber), s(tring), b(oolean), d(ate), e(rror) or z (empty). */
    interface CellDetail {
        readonly v: CellValue;
        readonly f: string | null;
        readonly t: 'n' | 's' | 'b' | 'd' | 'e' | 'z';
        readonly text: string;
        readonly style: Record<string, unknown> | null;
        readonly ref: string;
        readonly merged: string | null;
    }

    interface SniffResult {
        readonly format: string;
        readonly encoding: string | null;
        readonly delimiter: string | null;
        readonly hasBom: boolean;
        readonly confidence: number;
    }

    /** Appendix B.7: font, fill, border, align, valign, wrap, numFmt, indent and rotation. */
    type StyleSpec = Record<string, unknown>;

    interface ReadOptions extends PasswordOptions {
        sheet?: SheetRef;
        range?: string;
        /** true: the first row names the keys of object rows; an array names them itself. */
        header?: boolean | string[];
        cells?: boolean;
        formatted?: boolean;
        blankRows?: boolean;
        trim?: boolean;
        limit?: number;
        encoding?: string;
        delimiter?: string;
        parseNumbers?: boolean;
        parseBooleans?: boolean;
    }

    interface LayoutOptions {
        styles?: { header?: StyleSpec, body?: StyleSpec, columns?: Record<string, StyleSpec> };
        columnWidths?: Record<string, number | 'auto'> | Array<number | 'auto'>;
        rowHeights?: Record<string, number>;
        merges?: string[];
        freeze?: string | { rows?: number, cols?: number };
        autoFilter?: boolean | string;
    }

    interface WriteOptions extends PasswordOptions, LayoutOptions {
        sheet?: string;
        /** An array writes the header row and orders the keys of object rows; false writes none. */
        header?: boolean | string[];
        format?: 'xlsx' | 'xls' | 'csv' | 'tsv';
        encoding?: string;
        delimiter?: string;
        bom?: boolean;
        dateFormat?: string;
        formulas?: boolean;
        evaluate?: boolean;
    }

    /** `password: null` or `''` removes the encryption when saving; left out, the password of the file stays. */
    interface AppendOptions extends PasswordOptions, LayoutOptions {
        sheet?: SheetRef;
        header?: boolean | string[];
        createIfMissing?: boolean;
        dateFormat?: string;
        formulas?: boolean;
        encoding?: string;
        delimiter?: string;
    }

    interface ConvertOptions extends PasswordOptions {
        sheet?: SheetRef;
        encoding?: string;
        delimiter?: string;
        bom?: boolean;
        parseNumbers?: boolean;
        formatted?: boolean;
    }

    interface MergeOptions extends ProgressOptions {
        mode?: 'sheets' | 'rows';
        header?: boolean;
        sheetNames?: string[];
        passwords?: Record<string, string> | Array<string | null>;
        /**
         * Encrypts an xlsx, xlsm or xls output with this password; `null` or `''` writes it unencrypted. Left out, the
         * password of the first input opened with one encrypts the output, with a warning. Not available for a csv or tsv
         * output.
         */
        outputPassword?: string | null;
    }

    interface SplitOptions extends PasswordOptions {
        by?: 'sheet' | { rows: number } | { column: string };
        namePattern?: string;
        /** false: row 1 is a data row, not a header repeated atop every output of a split by rows or by column. */
        header?: boolean;
    }

    interface DedupeOptions extends PasswordOptions {
        sheet?: SheetRef;
        columns?: Array<string | number>;
        keep?: 'first' | 'last';
        header?: boolean;
    }

    interface RecalcOptions extends PasswordOptions {
        output?: string;
    }

    interface OpenOptions extends PasswordOptions {
        mode?: 'auto' | 'full' | 'stream';
    }

    interface WriterOptions extends ProgressOptions {
        sheet?: string;
        header?: boolean | string[];
        format?: 'xlsx' | 'csv' | 'tsv';
        encoding?: string;
        delimiter?: string;
        bom?: boolean;
    }

    interface ViewOptions extends PasswordOptions {
        title?: string;
        sheet?: SheetRef;
        header?: boolean | string[];
        columns?: string[];
        /** true is 'row', false 'none' (the default); 'cell' selects single cells, `col` of the select event names the column. */
        selectable?: boolean | 'row' | 'cell' | 'none';
    }

    interface API {
        readonly XlsxError: XlsxErrorConstructor;
        /** Whether the 3-Tally Sheet plugin is installed, enabled and compatible. */
        isAvailable(): XlsxPromise<boolean>;
        info(path: string, options?: PasswordOptions | null): XlsxPromise<SheetFileInfo>;
        infoAsync(path: string, options?: PasswordOptions | null): XlsxPromise<SheetFileInfo>;
        sheetNames(path: string, options?: PasswordOptions | null): XlsxPromise<string[]>;
        sheetNamesAsync(path: string, options?: PasswordOptions | null): XlsxPromise<string[]>;
        /** More than 1,000,000 cells reject with LIMIT_EXCEEDED; `Sheet.eachRow` streams any size. */
        read(path: string, options?: ReadOptions | null): XlsxPromise<any[]>;
        readAsync(path: string, options?: ReadOptions | null): XlsxPromise<any[]>;
        readAll(path: string, options?: ReadOptions | null): XlsxPromise<Record<string, any[]>>;
        readAllAsync(path: string, options?: ReadOptions | null): XlsxPromise<Record<string, any[]>>;
        write(path: string, rows: Rows, options?: WriteOptions | null): XlsxPromise<SheetResult>;
        writeAsync(path: string, rows: Rows, options?: WriteOptions | null): XlsxPromise<SheetResult>;
        writeAll(path: string, sheets: Record<string, Rows>, options?: WriteOptions | null): XlsxPromise<SheetResult>;
        writeAllAsync(path: string, sheets: Record<string, Rows>, options?: WriteOptions | null): XlsxPromise<SheetResult>;
        /** Layout options apply to the appended rows; an existing csv / tsv file takes none. */
        append(path: string, rows: Rows, options?: AppendOptions | null): XlsxPromise<SheetResult>;
        appendAsync(path: string, rows: Rows, options?: AppendOptions | null): XlsxPromise<SheetResult>;
        convert(input: string, output?: string | null, options?: ConvertOptions | null): XlsxPromise<SheetResult>;
        convertAsync(input: string, output?: string | null, options?: ConvertOptions | null): XlsxPromise<SheetResult>;
        toCsv(input: string, output?: string | null, options?: ConvertOptions | null): XlsxPromise<SheetResult>;
        toCsvAsync(input: string, output?: string | null, options?: ConvertOptions | null): XlsxPromise<SheetResult>;
        merge(inputs: string[], output?: string | null, options?: MergeOptions | null): XlsxPromise<SheetResult>;
        mergeAsync(inputs: string[], output?: string | null, options?: MergeOptions | null): XlsxPromise<SheetResult>;
        split(path: string, outputDir?: string | null, options?: SplitOptions | null): XlsxPromise<{ readonly paths: string[] }>;
        splitAsync(path: string, outputDir?: string | null, options?: SplitOptions | null): XlsxPromise<{ readonly paths: string[] }>;
        dedupe(path: string, output?: string | null, options?: DedupeOptions | null): XlsxPromise<SheetResult>;
        dedupeAsync(path: string, output?: string | null, options?: DedupeOptions | null): XlsxPromise<SheetResult>;
        recalc(path: string, options?: RecalcOptions | null): XlsxPromise<SheetResult>;
        recalcAsync(path: string, options?: RecalcOptions | null): XlsxPromise<SheetResult>;
        encrypt(path: string, output: string | null, options: PasswordOptions): XlsxPromise<SheetResult>;
        encryptAsync(path: string, output: string | null, options: PasswordOptions): XlsxPromise<SheetResult>;
        decrypt(path: string, output: string | null, options: PasswordOptions): XlsxPromise<SheetResult>;
        decryptAsync(path: string, output: string | null, options: PasswordOptions): XlsxPromise<SheetResult>;
        sniff(path: string, options?: ProgressOptions | null): XlsxPromise<SniffResult>;
        sniffAsync(path: string, options?: ProgressOptions | null): XlsxPromise<SniffResult>;
        /** Keeps the workbook open in the plugin until `close()` or the end of the execution (16 per script at most). */
        open(path: string, options?: OpenOptions | null): XlsxPromise<Workbook>;
        openAsync(path: string, options?: OpenOptions | null): XlsxPromise<Workbook>;
        /** A workbook in memory; `save(output)` writes it. */
        create(options?: { format?: 'xlsx' | 'xls' } | null): XlsxPromise<Workbook>;
        createAsync(options?: { format?: 'xlsx' | 'xls' } | null): XlsxPromise<Workbook>;
        /** A streaming writer (xlsx, csv or tsv); the end of the execution discards an unfinished file. */
        createWriter(output: string, options?: WriterOptions | null): XlsxPromise<Writer>;
        createWriterAsync(output: string, options?: WriterOptions | null): XlsxPromise<Writer>;
        /**
         * Opens the plugin's viewer on a file or on rows; an open session keeps the script alive until its `close` event.
         * While the viewer shows the previous session of the same thread (the main thread or one Worker), the new one replaces it in place (AutoJs6 need not be
         * in the foreground) and the previous session ends with reason 'replaced'.
         */
        view(pathOrRows: string | Rows, options?: ViewOptions | null): XlsxPromise<SheetViewSession>;
        viewAsync(pathOrRows: string | Rows, options?: ViewOptions | null): XlsxPromise<SheetViewSession>;
    }

    interface WorkbookProperties {
        readonly format: string;
        readonly mode: string;
        readonly isClosed: boolean;
    }

    interface SaveOptions extends PasswordOptions {
        format?: 'xlsx' | 'xls' | 'csv' | 'tsv';
        evaluate?: boolean;
    }

    /** Calls after `close()` reject with SESSION_CLOSED; a `mode: 'stream'` workbook answers READ_ONLY to edits. */
    interface Workbook {
        readonly format: string;
        readonly mode: 'full' | 'stream' | string;
        readonly isClosed: boolean;
        info(): XlsxPromise<SheetFileInfo>;
        infoAsync(): XlsxPromise<SheetFileInfo>;
        sheetNames(): XlsxPromise<string[]>;
        sheetNamesAsync(): XlsxPromise<string[]>;
        sheet(nameOrIndex: SheetRef): XlsxPromise<Sheet>;
        sheetAsync(nameOrIndex: SheetRef): XlsxPromise<Sheet>;
        addSheet(name: string, options?: { index?: number } | null): XlsxPromise<Sheet>;
        addSheetAsync(name: string, options?: { index?: number } | null): XlsxPromise<Sheet>;
        removeSheet(nameOrIndex: SheetRef): XlsxPromise<unknown>;
        removeSheetAsync(nameOrIndex: SheetRef): XlsxPromise<unknown>;
        renameSheet(nameOrIndex: SheetRef, name: string): XlsxPromise<unknown>;
        renameSheetAsync(nameOrIndex: SheetRef, name: string): XlsxPromise<unknown>;
        copySheet(nameOrIndex: SheetRef, name: string): XlsxPromise<Sheet>;
        copySheetAsync(nameOrIndex: SheetRef, name: string): XlsxPromise<Sheet>;
        moveSheet(nameOrIndex: SheetRef, index: number): XlsxPromise<unknown>;
        moveSheetAsync(nameOrIndex: SheetRef, index: number): XlsxPromise<unknown>;
        setSheetHidden(nameOrIndex: SheetRef, hidden: boolean): XlsxPromise<unknown>;
        setSheetHiddenAsync(nameOrIndex: SheetRef, hidden: boolean): XlsxPromise<unknown>;
        /** Answers a style id for `Sheet.setStyle` and the `style` of cells and rows. */
        createStyle(spec: StyleSpec): XlsxPromise<number>;
        createStyleAsync(spec: StyleSpec): XlsxPromise<number>;
        recalc(): XlsxPromise<unknown>;
        recalcAsync(): XlsxPromise<unknown>;
        /** Without `output` saves back to the opened file (not for streams or workbooks in memory). */
        save(output?: string | null, options?: SaveOptions | null): XlsxPromise<SheetResult>;
        saveAsync(output?: string | null, options?: SaveOptions | null): XlsxPromise<SheetResult>;
        properties(): XlsxPromise<WorkbookProperties>;
        /** Idempotent: the same Promise on every call, after the calls before it; it never rejects. */
        close(): Promise<void>;
        closeAsync(): Promise<void>;
        toString(): string;
    }

    interface SheetProperties {
        readonly name: string;
        readonly index: number;
        readonly rows: number;
        readonly cols: number;
        readonly dimension: string | null;
    }

    interface EachRowOptions {
        batch?: number;
        from?: number;
        to?: number;
        header?: boolean | string[];
        cells?: boolean;
        formatted?: boolean;
    }

    interface RowChunk {
        readonly rows: any[];
        readonly startRow: number;
    }

    /** A `for await` loop's `break` (or `cancel()`) stops the reader. */
    interface RowIterator extends AsyncIterableIterator<RowChunk> {
        cancel(): boolean;
    }

    /** `name` follows renames; the other figures come from `properties()`. */
    interface Sheet {
        readonly name: string;
        read(options?: ReadOptions | null): XlsxPromise<any[]>;
        readAsync(options?: ReadOptions | null): XlsxPromise<any[]>;
        cell(ref: string, options?: { cells?: boolean } | null): XlsxPromise<CellValue | CellDetail>;
        cell(row: number, col: number | string, options?: { cells?: boolean } | null): XlsxPromise<CellValue | CellDetail>;
        cellAsync(ref: string, options?: { cells?: boolean } | null): XlsxPromise<CellValue | CellDetail>;
        cellAsync(row: number, col: number | string, options?: { cells?: boolean } | null): XlsxPromise<CellValue | CellDetail>;
        set(ref: string, value: CellValue | { v?: CellValue, f?: string, style?: number | StyleSpec }): XlsxPromise<unknown>;
        setAsync(ref: string, value: CellValue | { v?: CellValue, f?: string, style?: number | StyleSpec }): XlsxPromise<unknown>;
        setRows(startRow: number, rows: Rows, options?: { style?: number | StyleSpec } | null): XlsxPromise<unknown>;
        setRowsAsync(startRow: number, rows: Rows, options?: { style?: number | StyleSpec } | null): XlsxPromise<unknown>;
        append(rows: Rows): XlsxPromise<unknown>;
        appendAsync(rows: Rows): XlsxPromise<unknown>;
        insertRows(at: number, count?: number): XlsxPromise<unknown>;
        insertRowsAsync(at: number, count?: number): XlsxPromise<unknown>;
        deleteRows(at: number, count?: number): XlsxPromise<unknown>;
        deleteRowsAsync(at: number, count?: number): XlsxPromise<unknown>;
        insertColumns(at: number | string, count?: number): XlsxPromise<unknown>;
        insertColumnsAsync(at: number | string, count?: number): XlsxPromise<unknown>;
        deleteColumns(at: number | string, count?: number): XlsxPromise<unknown>;
        deleteColumnsAsync(at: number | string, count?: number): XlsxPromise<unknown>;
        clear(range?: string): XlsxPromise<unknown>;
        clearAsync(range?: string): XlsxPromise<unknown>;
        setStyle(range: string, style: number | StyleSpec): XlsxPromise<unknown>;
        setStyleAsync(range: string, style: number | StyleSpec): XlsxPromise<unknown>;
        setColumnWidth(col: number | string, width: number | 'auto'): XlsxPromise<unknown>;
        setColumnWidthAsync(col: number | string, width: number | 'auto'): XlsxPromise<unknown>;
        setRowHeight(row: number, height: number): XlsxPromise<unknown>;
        setRowHeightAsync(row: number, height: number): XlsxPromise<unknown>;
        merge(range: string): XlsxPromise<unknown>;
        mergeAsync(range: string): XlsxPromise<unknown>;
        unmerge(range: string): XlsxPromise<unknown>;
        unmergeAsync(range: string): XlsxPromise<unknown>;
        merges(): XlsxPromise<string[]>;
        mergesAsync(): XlsxPromise<string[]>;
        freeze(rows: number, cols?: number): XlsxPromise<unknown>;
        freezeAsync(rows: number, cols?: number): XlsxPromise<unknown>;
        autoFilter(range: string): XlsxPromise<unknown>;
        autoFilterAsync(range: string): XlsxPromise<unknown>;
        setHyperlink(ref: string, url: string, options?: { label?: string } | null): XlsxPromise<unknown>;
        setHyperlinkAsync(ref: string, url: string, options?: { label?: string } | null): XlsxPromise<unknown>;
        setComment(ref: string, text: string, options?: { author?: string } | null): XlsxPromise<unknown>;
        setCommentAsync(ref: string, text: string, options?: { author?: string } | null): XlsxPromise<unknown>;
        addImage(path: string, options: { from: string, to?: string, width?: number, height?: number }): XlsxPromise<unknown>;
        addImageAsync(path: string, options: { from: string, to?: string, width?: number, height?: number }): XlsxPromise<unknown>;
        /** Appendix B.7: cellIs, expression, top10, duplicateValues, uniqueValues, colorScale, dataBar and iconSet. */
        addConditionalFormat(range: string, rule: Record<string, unknown>): XlsxPromise<unknown>;
        addConditionalFormatAsync(range: string, rule: Record<string, unknown>): XlsxPromise<unknown>;
        conditionalFormats(): XlsxPromise<Array<Record<string, unknown>>>;
        conditionalFormatsAsync(): XlsxPromise<Array<Record<string, unknown>>>;
        /** Appendix B.7: list, whole, decimal, date, time, textLength, custom and any. */
        addValidation(range: string, rule: Record<string, unknown>): XlsxPromise<unknown>;
        addValidationAsync(range: string, rule: Record<string, unknown>): XlsxPromise<unknown>;
        validations(): XlsxPromise<Array<Record<string, unknown>>>;
        validationsAsync(): XlsxPromise<Array<Record<string, unknown>>>;
        clearRules(range: string): XlsxPromise<unknown>;
        clearRulesAsync(range: string): XlsxPromise<unknown>;
        find(keyword: string, options?: { regex?: boolean, caseSensitive?: boolean, range?: string } | null): XlsxPromise<Array<Record<string, unknown>>>;
        findAsync(keyword: string, options?: { regex?: boolean, caseSensitive?: boolean, range?: string } | null): XlsxPromise<Array<Record<string, unknown>>>;
        sort(col: number | string, options?: { desc?: boolean, hasHeader?: boolean, range?: string } | null): XlsxPromise<unknown>;
        sortAsync(col: number | string, options?: { desc?: boolean, hasHeader?: boolean, range?: string } | null): XlsxPromise<unknown>;
        /**
         * Streams the sheet: with a callback, answers the rows delivered (a callback answering false stops, a Promise it
         * answers is awaited); without one, an async iterator of chunks that starts at its first `next()`. A consumer two
         * chunks behind pauses the reader.
         */
        eachRow(callback: (rows: any[], startRow: number) => unknown, options?: EachRowOptions | null): XlsxPromise<number>;
        eachRow(options?: EachRowOptions | null): RowIterator;
        eachRowAsync(callback: (rows: any[], startRow: number) => unknown, options?: EachRowOptions | null): XlsxPromise<number>;
        eachRowAsync(options?: EachRowOptions | null): RowIterator;
        properties(): XlsxPromise<SheetProperties>;
        toString(): string;
    }

    /**
     * Rows of `addRow` without options leave in chunks of 1000; `rowCount` counts the rows added so far. Calls after
     * `close()` or `abort()` reject with SESSION_CLOSED. A csv / tsv target has one sheet.
     */
    interface Writer {
        readonly format: string;
        readonly rowCount: number;
        /** `header` false writes no header row; an array writes it and orders the keys of object rows. */
        addSheet(name: string, options?: { header?: boolean | string[], columnWidths?: LayoutOptions['columnWidths'], freeze?: LayoutOptions['freeze'], autoFilter?: boolean } | null): XlsxPromise<unknown>;
        addSheetAsync(name: string, options?: { header?: boolean | string[], columnWidths?: LayoutOptions['columnWidths'], freeze?: LayoutOptions['freeze'], autoFilter?: boolean } | null): XlsxPromise<unknown>;
        addRow(values: CellValue[] | Record<string, CellValue>, options?: { style?: number | StyleSpec } | null): XlsxPromise<unknown>;
        addRowAsync(values: CellValue[] | Record<string, CellValue>, options?: { style?: number | StyleSpec } | null): XlsxPromise<unknown>;
        addRows(rows: Rows): XlsxPromise<unknown>;
        addRowsAsync(rows: Rows): XlsxPromise<unknown>;
        close(options?: ProgressOptions | null): XlsxPromise<SheetResult>;
        closeAsync(options?: ProgressOptions | null): XlsxPromise<SheetResult>;
        /** Discards the file; idempotent. */
        abort(): XlsxPromise<unknown>;
        abortAsync(): XlsxPromise<unknown>;
        toString(): string;
    }

    interface SelectEvent {
        readonly sheet: string;
        readonly row: number;
        readonly col: number;
        readonly values: any[];
    }

    /** `finished` after `close({finish: true})`, `overflow` when the script stopped taking events, `error` when the bridge failed. */
    type CloseReason = 'closed' | 'finished' | 'replaced' | 'timeout' | 'overflow' | 'error' | string;

    interface CloseEvent {
        readonly reason: CloseReason;
    }

    interface ViewState {
        readonly sheet: string;
        readonly row: number;
        readonly col: number;
        readonly rows: number;
        readonly cols: number;
        readonly token: string | null;
    }

    /** Events wait (32 per name at most) until a listener is added. */
    interface SheetViewSession {
        readonly isClosed: boolean;
        readonly reason: CloseReason | null;
        addListener(event: 'select', listener: (this: SheetViewSession, event: SelectEvent) => void): this;
        addListener(event: 'close', listener: (this: SheetViewSession, event: CloseEvent) => void): this;
        on(event: 'select', listener: (this: SheetViewSession, event: SelectEvent) => void): this;
        on(event: 'close', listener: (this: SheetViewSession, event: CloseEvent) => void): this;
        once(event: 'select', listener: (this: SheetViewSession, event: SelectEvent) => void): this;
        once(event: 'close', listener: (this: SheetViewSession, event: CloseEvent) => void): this;
        removeListener(event: 'select' | 'close', listener: (...args: any[]) => void): this;
        off(event: 'select' | 'close', listener: (...args: any[]) => void): this;
        removeAllListeners(event?: 'select' | 'close'): this;
        listenerCount(event: 'select' | 'close'): number;
        update(rowsOrPath: string | Rows): XlsxPromise<SheetViewSession>;
        select(row: number): XlsxPromise<SheetViewSession>;
        state(): XlsxPromise<ViewState>;
        /** `finish: true` also closes the viewer screen; a closed session answers at once. */
        close(options?: { finish?: boolean } | null): XlsxPromise<SheetViewSession>;
        toString(): string;
    }
  }
  const xlsx: xlsx.API;
  export = xlsx;
}
declare module "autojs6:xlsx" { import xlsx = require("xlsx"); export = xlsx; }
