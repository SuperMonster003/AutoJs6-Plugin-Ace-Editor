/**
 * Rhino's xlsx module (3-Tally Sheet) for Node main threads and Workers, over the host's xlsx bridge (host 6.8.1 or later
 * with the 3-Tally Sheet plugin). Every member answers a Promise with a non-enumerable `cancel()`; the `xxxAsync` names
 * are the same calls. `onProgress` belongs to write, writeAll, append, convert, toCsv, merge, split, dedupe, recalc,
 * encrypt, decrypt, sniff, `Workbook.save` and `Writer.close` (both names); other calls ignore it. Codes, options and
 * defaults are those of Rhino's xlsx: unknown option keys reject with INVALID_ARGUMENT, paths follow the working directory
 * of the script, rows and columns count from 1 (a column may also be given by its letters) and dates travel as Date
 * objects. An optional `output` / `outputDir` is the default output when it is null or left out, and an object in its
 * place with nothing after it is the options. Calls on one Workbook (with its sheets), Writer or viewer session run in the
 * order the script made them. Capabilities per call: reading needs files; write, writeAll, append, convert, toCsv, merge,
 * split, dedupe, recalc, encrypt, decrypt, createWriter, `Workbook.save` and every Writer method also need files.write;
 * `view` and viewer sessions need files and ui.
 */
declare module "xlsx" {
  namespace xlsx {
    /** A call in progress: `cancel()` answers true when it stopped a running call, which then rejects with CANCELLED. */
    type XlsxPromise<T> = Promise<T> & { cancel(): boolean };

    /** A path; null or undefined for the default output (`/sdcard/Documents/3-Tally Sheet/<source>-<operation>-<time>.<ext>`). */
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

    type Rows = Row[];

    /** A sheet by name or by its index from 1. */
    type SheetRef = string | number;

    /** A column by number (from 1) or by letters (`'C'`). */
    type ColumnRef = number | string;

    interface Progress {
        readonly opId: number;
        /** 0 to 100. */
        readonly percent: number;
        readonly stage: string;
        readonly current: number;
        readonly total: number;
    }

    /** A throwing or rejecting `onProgress` cancels the call, which rejects with that error. */
    interface ProgressOptions {
        onProgress?: ((progress: Progress) => unknown) | null;
    }

    interface PasswordOptions {
        /** Opens an encrypted input. */
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
        readonly format: Format | string;
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
        /** The style id, 0 for the default style. */
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
        size?: number;
        bold?: boolean;
        italic?: boolean;
        underline?: boolean | 'none' | 'single' | 'double' | 'singleAccounting' | 'doubleAccounting';
        strike?: boolean;
        /** `'#RRGGBB'`. */
        color?: string;
    }

    /** Appendix B.7; properties left out keep the cell's current values when a spec is laid over existing cells. */
    interface StyleSpec {
        font?: FontSpec;
        /** `'#RRGGBB'` or `'none'`. */
        fill?: string;
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

    /** How an input is opened. */
    interface SourceOptions extends PasswordOptions {
        /** The input's format when its extension does not say it. */
        format?: Format;
        /** csv / tsv: detected by default. */
        encoding?: string;
        delimiter?: string;
        /** csv / tsv: numeric text becomes numbers (default true). */
        parseNumbers?: boolean;
        parseBooleans?: boolean;
    }

    interface OpenOptions extends SourceOptions {
        /** `'auto'` (default), `'full'` (LIMIT_EXCEEDED over 1,000,000 cells) or `'stream'` (read-only). */
        mode?: 'auto' | 'full' | 'stream';
    }

    interface SheetReadOptions {
        range?: string;
        from?: number;
        to?: number;
        /** Object rows keyed by the first row. */
        header?: boolean;
        /** {@link CellDetail} cells instead of values. */
        cells?: boolean;
        formatted?: boolean;
        /** Default true for array rows, false for object rows. */
        blankRows?: boolean;
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

    /** Layout of the written block, applied after its rows (csv and tsv take none). */
    interface LayoutOptions {
        /** Specs for the header row, the body rows, and columns keyed by letters or numbers. */
        styles?: { header?: StyleSpec, body?: StyleSpec, columns?: { [column: string]: StyleSpec } };
        /** `'auto'` for every written column, an array by column (null skips one), or an object keyed by column. */
        columnWidths?: 'auto' | Array<ColumnWidth | null> | { [column: string]: ColumnWidth };
        /** Points (at most 409), keyed by row number. */
        rowHeights?: { [row: number]: number };
        merges?: string | string[];
        /** Rows to freeze, or `{ rows, cols }`. */
        freeze?: number | { rows?: number, cols?: number };
        /** `true` (or `'*'`) for the written block, or an A1 range. */
        autoFilter?: true | string;
    }

    interface WriteAllOptions extends LayoutOptions {
        /** An array writes the header row and orders the keys of object rows; false writes none. */
        header?: boolean | string[];
        /** The extension by default. */
        format?: Format;
        encoding?: string;
        delimiter?: string;
        bom?: boolean;
        /** Encrypts the output (workbooks only). */
        password?: string | null;
        /** Default `'yyyy-mm-dd hh:mm:ss'`. */
        dateFormat?: string;
        /** Strings starting with `=` become formulas; default false. */
        formulas?: boolean;
        /** Default true. */
        evaluate?: boolean;
    }

    interface WriteOptions extends WriteAllOptions {
        /** Default `'Sheet1'`. */
        sheet?: string;
    }

    /** `password: null` or `''` removes the encryption when saving; left out, the password of the file stays. */
    interface AppendOptions extends LayoutOptions {
        sheet?: SheetRef;
        /** Used when the append creates the file. */
        header?: boolean | string[];
        createIfMissing?: boolean;
        password?: string | null;
        dateFormat?: string;
        formulas?: boolean;
        encoding?: string;
        delimiter?: string;
    }

    interface ConvertOptions extends PasswordOptions {
        /** The sheet to write into csv / tsv; the first by default. */
        sheet?: SheetRef;
        /** The target format; the output's extension by default. */
        format?: Format;
        sourceFormat?: Format;
        encoding?: string;
        /** The encoding of a csv / tsv source (detected by default). */
        sourceEncoding?: string;
        delimiter?: string;
        bom?: boolean;
        parseNumbers?: boolean;
        formatted?: boolean;
    }

    interface ToCsvOptions extends PasswordOptions {
        sheet?: SheetRef;
        /** Default UTF-8. */
        encoding?: string;
        sourceEncoding?: string;
        delimiter?: string;
        bom?: boolean;
        formatted?: boolean;
    }

    interface MergeOptions {
        mode?: 'sheets' | 'rows';
        header?: boolean;
        /** One sheet name per input. */
        sheetNames?: string[];
        /** One per input, null for an input without a password. */
        passwords?: Array<string | null>;
        /**
         * Encrypts an xlsx, xlsm or xls output with this password; `null` or `''` writes it unencrypted. Left out, the
         * password of the first input opened with one encrypts the output, with a warning. Not available for a csv or tsv
         * output.
         */
        outputPassword?: string | null;
        /** The output's extension or the first input by default. */
        format?: Format;
    }

    interface SplitOptions extends PasswordOptions {
        by?: 'sheet' | { rows: number } | { column: ColumnRef };
        /** Placeholders `{name}`, `{index}` and `{value}`. */
        namePattern?: string;
        /** The sheet to split by rows or by column; the first by default. */
        sheet?: SheetRef;
        /** false: row 1 is a data row, not a header repeated atop every output of a split by rows or by column. */
        header?: boolean;
    }

    interface DedupeOptions extends PasswordOptions {
        sheet?: SheetRef;
        /** All columns by default. */
        columns?: ColumnRef | ColumnRef[];
        keep?: 'first' | 'last';
        header?: boolean;
    }

    interface RecalcOptions extends PasswordOptions {
        output?: string;
    }

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
        /** `true` / null (default): the first row (or the keys of the first object row) is the header; false: none; names: the header row. */
        header?: boolean | string[] | null;
        columnWidths?: LayoutOptions['columnWidths'];
        freeze?: LayoutOptions['freeze'];
        autoFilter?: true | string;
    }

    interface WriterOptions extends WriterSheetOptions {
        sheet?: string;
        /** The extension by default; xls rejects with UNSUPPORTED_FORMAT. */
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
        sheet?: SheetRef;
        header?: boolean;
        columns?: ColumnRef[] | ViewColumn[];
        /** true is 'row', false 'none' (the default); 'cell' selects single cells, `col` of the select event names the column. */
        selectable?: boolean | 'row' | 'cell' | 'none';
        password?: string | null;
        format?: Format;
        encoding?: string;
        delimiter?: string;
    }

    interface API {
        readonly XlsxError: XlsxErrorConstructor;
        /** Whether the 3-Tally Sheet plugin is installed, enabled and compatible. */
        isAvailable(): XlsxPromise<boolean>;
        info(path: string, options?: SourceOptions | null): XlsxPromise<SheetFileInfo>;
        infoAsync(path: string, options?: SourceOptions | null): XlsxPromise<SheetFileInfo>;
        sheetNames(path: string, options?: SourceOptions | null): XlsxPromise<string[]>;
        sheetNamesAsync(path: string, options?: SourceOptions | null): XlsxPromise<string[]>;
        /** More than 1,000,000 cells reject with LIMIT_EXCEEDED; `Sheet.eachRow` streams any size. */
        read(path: string, options?: ReadOptions | null): XlsxPromise<any[]>;
        readAsync(path: string, options?: ReadOptions | null): XlsxPromise<any[]>;
        readAll(path: string, options?: ReadAllOptions | null): XlsxPromise<Record<string, any[]>>;
        readAllAsync(path: string, options?: ReadAllOptions | null): XlsxPromise<Record<string, any[]>>;
        write(path: string, rows: Rows, options?: (WriteOptions & ProgressOptions) | null): XlsxPromise<SheetResult>;
        writeAsync(path: string, rows: Rows, options?: (WriteOptions & ProgressOptions) | null): XlsxPromise<SheetResult>;
        writeAll(path: string, sheets: Record<string, Rows>, options?: (WriteAllOptions & ProgressOptions) | null): XlsxPromise<SheetResult>;
        writeAllAsync(path: string, sheets: Record<string, Rows>, options?: (WriteAllOptions & ProgressOptions) | null): XlsxPromise<SheetResult>;
        /** Layout options apply to the appended rows; an existing csv / tsv file takes none. */
        append(path: string, rows: Rows, options?: (AppendOptions & ProgressOptions) | null): XlsxPromise<SheetResult>;
        appendAsync(path: string, rows: Rows, options?: (AppendOptions & ProgressOptions) | null): XlsxPromise<SheetResult>;
        convert(input: string, output: Output, options?: (ConvertOptions & ProgressOptions) | null): XlsxPromise<SheetResult>;
        convert(input: string, options?: ConvertOptions & ProgressOptions): XlsxPromise<SheetResult>;
        convertAsync(input: string, output: Output, options?: (ConvertOptions & ProgressOptions) | null): XlsxPromise<SheetResult>;
        convertAsync(input: string, options?: ConvertOptions & ProgressOptions): XlsxPromise<SheetResult>;
        toCsv(input: string, output: Output, options?: (ToCsvOptions & ProgressOptions) | null): XlsxPromise<SheetResult>;
        toCsv(input: string, options?: ToCsvOptions & ProgressOptions): XlsxPromise<SheetResult>;
        toCsvAsync(input: string, output: Output, options?: (ToCsvOptions & ProgressOptions) | null): XlsxPromise<SheetResult>;
        toCsvAsync(input: string, options?: ToCsvOptions & ProgressOptions): XlsxPromise<SheetResult>;
        /** 2 to 64 inputs. */
        merge(inputs: string[], output: Output, options?: (MergeOptions & ProgressOptions) | null): XlsxPromise<SheetResult>;
        merge(inputs: string[], options?: MergeOptions & ProgressOptions): XlsxPromise<SheetResult>;
        mergeAsync(inputs: string[], output: Output, options?: (MergeOptions & ProgressOptions) | null): XlsxPromise<SheetResult>;
        mergeAsync(inputs: string[], options?: MergeOptions & ProgressOptions): XlsxPromise<SheetResult>;
        /** At most 256 outputs in `outputDir` (a new directory by default). */
        split(path: string, outputDir: Output, options?: (SplitOptions & ProgressOptions) | null): XlsxPromise<SplitResult>;
        split(path: string, options?: SplitOptions & ProgressOptions): XlsxPromise<SplitResult>;
        splitAsync(path: string, outputDir: Output, options?: (SplitOptions & ProgressOptions) | null): XlsxPromise<SplitResult>;
        splitAsync(path: string, options?: SplitOptions & ProgressOptions): XlsxPromise<SplitResult>;
        dedupe(path: string, output: Output, options?: (DedupeOptions & ProgressOptions) | null): XlsxPromise<SheetResult>;
        dedupe(path: string, options?: DedupeOptions & ProgressOptions): XlsxPromise<SheetResult>;
        dedupeAsync(path: string, output: Output, options?: (DedupeOptions & ProgressOptions) | null): XlsxPromise<SheetResult>;
        dedupeAsync(path: string, options?: DedupeOptions & ProgressOptions): XlsxPromise<SheetResult>;
        recalc(path: string, options?: (RecalcOptions & ProgressOptions) | null): XlsxPromise<SheetResult>;
        recalcAsync(path: string, options?: (RecalcOptions & ProgressOptions) | null): XlsxPromise<SheetResult>;
        encrypt(path: string, output: Output, options: CryptOptions & ProgressOptions): XlsxPromise<SheetResult>;
        encrypt(path: string, options: CryptOptions & ProgressOptions): XlsxPromise<SheetResult>;
        encryptAsync(path: string, output: Output, options: CryptOptions & ProgressOptions): XlsxPromise<SheetResult>;
        encryptAsync(path: string, options: CryptOptions & ProgressOptions): XlsxPromise<SheetResult>;
        /** `password` opens the input. */
        decrypt(path: string, output: Output, options: CryptOptions & ProgressOptions): XlsxPromise<SheetResult>;
        decrypt(path: string, options: CryptOptions & ProgressOptions): XlsxPromise<SheetResult>;
        decryptAsync(path: string, output: Output, options: CryptOptions & ProgressOptions): XlsxPromise<SheetResult>;
        decryptAsync(path: string, options: CryptOptions & ProgressOptions): XlsxPromise<SheetResult>;
        sniff(path: string, options?: ProgressOptions | null): XlsxPromise<SniffResult>;
        sniffAsync(path: string, options?: ProgressOptions | null): XlsxPromise<SniffResult>;
        /** Keeps the workbook open in the plugin until `close()` or the end of the execution (16 per script at most). */
        open(path: string, options?: OpenOptions | null): XlsxPromise<Workbook>;
        openAsync(path: string, options?: OpenOptions | null): XlsxPromise<Workbook>;
        /** A workbook in memory; `save(output)` writes it. */
        create(options?: CreateOptions | null): XlsxPromise<Workbook>;
        createAsync(options?: CreateOptions | null): XlsxPromise<Workbook>;
        /** A streaming writer (xlsx, xlsm, csv or tsv); the end of the execution discards an unfinished file. */
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
        readonly format: Format | string;
        readonly mode: 'full' | 'stream' | string | null;
        readonly isClosed: boolean;
    }

    interface SaveOptions {
        /** A string encrypts the output; `null` or `''` removes the encryption; left out, the file keeps its own. */
        password?: string | null;
        /** The output's extension by default. */
        format?: Format;
        /** Default true. */
        evaluate?: boolean;
    }

    /** Calls after `close()` reject with SESSION_CLOSED; a `mode: 'stream'` workbook answers READ_ONLY to edits. */
    interface Workbook {
        readonly format: Format | string;
        /** null for a workbook made by `create`. */
        readonly mode: 'full' | 'stream' | string | null;
        readonly isClosed: boolean;
        info(): XlsxPromise<SheetFileInfo>;
        infoAsync(): XlsxPromise<SheetFileInfo>;
        sheetNames(): XlsxPromise<string[]>;
        sheetNamesAsync(): XlsxPromise<string[]>;
        sheet(nameOrIndex: SheetRef): XlsxPromise<Sheet>;
        sheetAsync(nameOrIndex: SheetRef): XlsxPromise<Sheet>;
        addSheet(name: string, options?: { index?: number } | null): XlsxPromise<Sheet>;
        addSheetAsync(name: string, options?: { index?: number } | null): XlsxPromise<Sheet>;
        removeSheet(nameOrIndex: SheetRef): XlsxPromise<void>;
        removeSheetAsync(nameOrIndex: SheetRef): XlsxPromise<void>;
        renameSheet(nameOrIndex: SheetRef, name: string): XlsxPromise<void>;
        renameSheetAsync(nameOrIndex: SheetRef, name: string): XlsxPromise<void>;
        copySheet(nameOrIndex: SheetRef, name: string): XlsxPromise<Sheet>;
        copySheetAsync(nameOrIndex: SheetRef, name: string): XlsxPromise<Sheet>;
        moveSheet(nameOrIndex: SheetRef, index: number): XlsxPromise<void>;
        moveSheetAsync(nameOrIndex: SheetRef, index: number): XlsxPromise<void>;
        setSheetHidden(nameOrIndex: SheetRef, hidden: boolean): XlsxPromise<void>;
        setSheetHiddenAsync(nameOrIndex: SheetRef, hidden: boolean): XlsxPromise<void>;
        /** Answers a style id for `Sheet.setStyle` and the `style` of cells and rows. */
        createStyle(spec: StyleSpec): XlsxPromise<number>;
        createStyleAsync(spec: StyleSpec): XlsxPromise<number>;
        recalc(): XlsxPromise<RecalcSummary>;
        recalcAsync(): XlsxPromise<RecalcSummary>;
        /** Without `output` saves back to the opened file (not for streams or workbooks in memory). */
        save(output: Output, options?: (SaveOptions & ProgressOptions) | null): XlsxPromise<SheetResult>;
        save(options?: SaveOptions & ProgressOptions): XlsxPromise<SheetResult>;
        saveAsync(output: Output, options?: (SaveOptions & ProgressOptions) | null): XlsxPromise<SheetResult>;
        saveAsync(options?: SaveOptions & ProgressOptions): XlsxPromise<SheetResult>;
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
        /** Rows per chunk, 1 to 1000; default 1000. */
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

    interface RowChunk {
        readonly rows: any[];
        readonly startRow: number;
    }

    /** A `for await` loop's `break` (or `cancel()`) stops the reader. */
    interface RowIterator extends AsyncIterableIterator<RowChunk> {
        cancel(): boolean;
    }

    interface FindOptions {
        regex?: boolean;
        caseSensitive?: boolean;
        range?: string;
        /** 1 to 1000; default 100. */
        limit?: number;
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

    /** A rule read back by `conditionalFormats()` / `validations()`. */
    interface RuleEntry<R> {
        /** The ranges of the rule, separated by spaces. */
        readonly range: string;
        readonly rule: R;
    }

    type CellIsOperator = 'between' | 'notBetween' | 'eq' | 'ne' | 'gt' | 'lt' | 'ge' | 'le' | string;

    /** Appendix B.7 (xls supports only cellIs and expression); a rule read back without a mapping is `{ type: 'unknown', description }`. */
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

    /** Appendix B.7 (csv / tsv none). */
    type ValidationRule =
        | ValidationBase & { type: 'list', values?: string[], formula?: string, showDropdown?: boolean }
        | ValidationBase & { type: 'whole' | 'decimal' | 'date' | 'time' | 'textLength', operator?: CellIsOperator, min?: number | string | Date, max?: number | string | Date, value?: number | string | Date }
        | ValidationBase & { type: 'custom', formula: string }
        | ValidationBase & { type: 'any' }
        | ValidationBase & { type: 'unknown', readonly description: string };

    /** `name` follows renames; `properties()` answers every live figure at once. */
    interface Sheet {
        readonly name: string;
        /**
         * As the Rhino live properties, each read of `index` / `rows` / `cols` / `dimension` asks the plugin again after the
         * calls before it; in Node.js and Bun the read answers a Promise of the figure.
         */
        readonly index: XlsxPromise<number>;
        readonly rows: XlsxPromise<number>;
        readonly cols: XlsxPromise<number>;
        readonly dimension: XlsxPromise<string | null>;
        read(options?: SheetReadOptions | null): XlsxPromise<any[]>;
        readAsync(options?: SheetReadOptions | null): XlsxPromise<any[]>;
        cell(ref: string, options?: { cells?: boolean, formatted?: boolean } | null): XlsxPromise<CellValue | CellDetail>;
        cell(row: number, col: ColumnRef, options?: { cells?: boolean, formatted?: boolean } | null): XlsxPromise<CellValue | CellDetail>;
        cellAsync(ref: string, options?: { cells?: boolean, formatted?: boolean } | null): XlsxPromise<CellValue | CellDetail>;
        cellAsync(row: number, col: ColumnRef, options?: { cells?: boolean, formatted?: boolean } | null): XlsxPromise<CellValue | CellDetail>;
        set(ref: string, value: CellInput): XlsxPromise<void>;
        setAsync(ref: string, value: CellInput): XlsxPromise<void>;
        /** Answers the rows written. */
        setRows(startRow: number, rows: Rows, options?: { style?: number | StyleSpec, dateFormat?: string, formulas?: boolean } | null): XlsxPromise<number>;
        setRowsAsync(startRow: number, rows: Rows, options?: { style?: number | StyleSpec, dateFormat?: string, formulas?: boolean } | null): XlsxPromise<number>;
        /** Writes rows after the last row; answers the rows written. */
        append(rows: Rows): XlsxPromise<number>;
        appendAsync(rows: Rows): XlsxPromise<number>;
        insertRows(at: number, count?: number): XlsxPromise<void>;
        insertRowsAsync(at: number, count?: number): XlsxPromise<void>;
        deleteRows(at: number, count?: number): XlsxPromise<void>;
        deleteRowsAsync(at: number, count?: number): XlsxPromise<void>;
        insertColumns(at: ColumnRef, count?: number): XlsxPromise<void>;
        insertColumnsAsync(at: ColumnRef, count?: number): XlsxPromise<void>;
        deleteColumns(at: ColumnRef, count?: number): XlsxPromise<void>;
        deleteColumnsAsync(at: ColumnRef, count?: number): XlsxPromise<void>;
        /** Clears the values of a range, or of the whole sheet. */
        clear(range?: string | null): XlsxPromise<void>;
        clearAsync(range?: string | null): XlsxPromise<void>;
        /** Lays a spec over the cells' styles (or replaces them with a style id); answers the style id. */
        setStyle(range: string, style: number | StyleSpec): XlsxPromise<number>;
        setStyleAsync(range: string, style: number | StyleSpec): XlsxPromise<number>;
        setColumnWidth(col: ColumnRef, width: ColumnWidth): XlsxPromise<void>;
        setColumnWidthAsync(col: ColumnRef, width: ColumnWidth): XlsxPromise<void>;
        setRowHeight(row: number, height: number): XlsxPromise<void>;
        setRowHeightAsync(row: number, height: number): XlsxPromise<void>;
        merge(range: string): XlsxPromise<void>;
        mergeAsync(range: string): XlsxPromise<void>;
        unmerge(range: string): XlsxPromise<void>;
        unmergeAsync(range: string): XlsxPromise<void>;
        merges(): XlsxPromise<string[]>;
        mergesAsync(): XlsxPromise<string[]>;
        /** `freeze(0)` unfreezes. */
        freeze(rows: number, cols?: number): XlsxPromise<void>;
        freezeAsync(rows: number, cols?: number): XlsxPromise<void>;
        /** An A1 range, or `true` / `'*'` for the used range. */
        autoFilter(range: true | string): XlsxPromise<void>;
        autoFilterAsync(range: true | string): XlsxPromise<void>;
        setHyperlink(ref: string, url: string, options?: { label?: string } | null): XlsxPromise<void>;
        setHyperlinkAsync(ref: string, url: string, options?: { label?: string } | null): XlsxPromise<void>;
        setComment(ref: string, text: string, options?: { author?: string } | null): XlsxPromise<void>;
        setCommentAsync(ref: string, text: string, options?: { author?: string } | null): XlsxPromise<void>;
        addImage(path: string, options: { from: string, to?: string, width?: number, height?: number }): XlsxPromise<void>;
        addImageAsync(path: string, options: { from: string, to?: string, width?: number, height?: number }): XlsxPromise<void>;
        addConditionalFormat(range: string, rule: ConditionalFormatRule): XlsxPromise<void>;
        addConditionalFormatAsync(range: string, rule: ConditionalFormatRule): XlsxPromise<void>;
        conditionalFormats(): XlsxPromise<RuleEntry<ConditionalFormatRule>[]>;
        conditionalFormatsAsync(): XlsxPromise<RuleEntry<ConditionalFormatRule>[]>;
        addValidation(range: string, rule: ValidationRule): XlsxPromise<void>;
        addValidationAsync(range: string, rule: ValidationRule): XlsxPromise<void>;
        validations(): XlsxPromise<RuleEntry<ValidationRule>[]>;
        validationsAsync(): XlsxPromise<RuleEntry<ValidationRule>[]>;
        /** Removes the conditional formats and validations touching a range; answers how many. */
        clearRules(range: string): XlsxPromise<number>;
        clearRulesAsync(range: string): XlsxPromise<number>;
        find(keyword: string, options?: FindOptions | null): XlsxPromise<FindHit[]>;
        findAsync(keyword: string, options?: FindOptions | null): XlsxPromise<FindHit[]>;
        sort(col: ColumnRef, options?: { desc?: boolean, hasHeader?: boolean, range?: string } | null): XlsxPromise<void>;
        sortAsync(col: ColumnRef, options?: { desc?: boolean, hasHeader?: boolean, range?: string } | null): XlsxPromise<void>;
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
     * Rows of `addRow` without options leave in chunks of 1000; `rowCount` counts the rows added so far (header rows not
     * counted). A call that fails keeps the rows the plugin did not take: the next call sends them first, and `rowCount`
     * counts them once (a host without that count keeps every row of the failed call). Wait for a call before retrying it.
     * Calls not awaited keep the script order: after a failed or cancelled send the later calls wait for the host to tell
     * the rows it took. A cancelled send rejects with CANCELLED once the host answered; the rows the plugin took before
     * the cancel stay counted and are not sent again (a host without that count is given up after 30 s as if it took none).
     * After `close()` (whether it succeeds or not) or `abort()`, every call but `abort()` rejects with SESSION_CLOSED and
     * `rowCount` stays. A csv / tsv target has one sheet.
     */
    interface Writer {
        readonly format: Format | string;
        readonly rowCount: number;
        /** Starts a new sheet (workbooks only). */
        addSheet(name: string, options?: WriterSheetOptions | null): XlsxPromise<void>;
        addSheetAsync(name: string, options?: WriterSheetOptions | null): XlsxPromise<void>;
        /** A row with its own `style` is sent alone. */
        addRow(values: CellInput[] | { [column: string]: CellInput }, options?: { style?: StyleSpec } | null): XlsxPromise<void>;
        addRowAsync(values: CellInput[] | { [column: string]: CellInput }, options?: { style?: StyleSpec } | null): XlsxPromise<void>;
        addRows(rows: Rows): XlsxPromise<void>;
        addRowsAsync(rows: Rows): XlsxPromise<void>;
        close(options?: ProgressOptions | null): XlsxPromise<SheetResult>;
        closeAsync(options?: ProgressOptions | null): XlsxPromise<SheetResult>;
        /** Discards the file; idempotent. */
        abort(): XlsxPromise<void>;
        abortAsync(): XlsxPromise<void>;
        toString(): string;
    }

    interface SelectEvent {
        readonly sheet: string;
        readonly row: number;
        /** 0 when a whole row was selected. */
        readonly col: number;
        readonly values: CellValue[];
    }

    /** `finished` after `close({finish: true})`, `overflow` when the script stopped taking events, `error` when the bridge failed. */
    type CloseReason = 'closed' | 'finished' | 'replaced' | 'timeout' | 'overflow' | 'error' | string;

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

    type ViewListener = (this: SheetViewSession, ...args: any[]) => void;

    /**
     * The viewer's `select` / `close` events wait (32 per name at most) until a listener is added. The listener members
     * follow AutoJs6's EventEmitter: `emitSticky` keeps its arguments for the later `on` / `addListener` / `once` (called
     * at once; a `once` listener is then not added), at most `getMaxListeners()` listeners of a name (10, 0 for no limit),
     * `newListener` / `removeListener` events, and `getTimer()` is `null`.
     */
    interface SheetViewSession {
        readonly isClosed: boolean;
        readonly reason: CloseReason | null;
        addListener(event: 'select', listener: (this: SheetViewSession, event: SelectEvent) => void): this;
        addListener(event: 'close', listener: (this: SheetViewSession, event: CloseEvent) => void): this;
        addListener(event: string, listener: ViewListener): this;
        on(event: 'select', listener: (this: SheetViewSession, event: SelectEvent) => void): this;
        on(event: 'close', listener: (this: SheetViewSession, event: CloseEvent) => void): this;
        on(event: string, listener: ViewListener): this;
        once(event: 'select', listener: (this: SheetViewSession, event: SelectEvent) => void): this;
        once(event: 'close', listener: (this: SheetViewSession, event: CloseEvent) => void): this;
        once(event: string, listener: ViewListener): this;
        /** Adds before the other listeners of the name; sticky arguments are not applied. */
        prependListener(event: 'select', listener: (this: SheetViewSession, event: SelectEvent) => void): this;
        prependListener(event: 'close', listener: (this: SheetViewSession, event: CloseEvent) => void): this;
        prependListener(event: string, listener: ViewListener): this;
        prependOnceListener(event: 'select', listener: (this: SheetViewSession, event: SelectEvent) => void): this;
        prependOnceListener(event: 'close', listener: (this: SheetViewSession, event: CloseEvent) => void): this;
        prependOnceListener(event: string, listener: ViewListener): this;
        removeListener(event: string, listener: (...args: any[]) => void): this;
        off(event: string, listener: (...args: any[]) => void): this;
        removeAllListeners(event?: string): this;
        /** Calls the listeners of the name in order with these arguments; whether there was one. */
        emit(event: string, ...args: any[]): boolean;
        /** Emits, then keeps the arguments for the listeners added later with `on` / `addListener` / `once`. */
        emitSticky(event: string, ...args: any[]): boolean;
        /** The names that had a listener, until `removeAllListeners`. */
        eventNames(): string[];
        listenerCount(event: string): number;
        listeners(event: string): Array<(...args: any[]) => void>;
        getMaxListeners(): number;
        setMaxListeners(maxListeners: number): this;
        /** Always `null`: the session has no timer of its own. */
        getTimer(): null;
        update(rowsOrPath: string | Rows): XlsxPromise<SheetViewSession>;
        /** Moves the selection to a row (from 1) without a `select` event. */
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
