#!/usr/bin/env node

/**
 * Deterministic M2 static-completion index generator.
 *
 * Curated API-fact baselines (names and signatures only):
 * - Python 3.12 + typeshed d097b16922b98d06980c4be8050b44132da76ba1
 * - Lua 5.4.8 reference manual
 * - Java 17 + Android API 35 references
 * - Kotlin 2.2.21 standard library reference
 *
 * Regenerate: node tools/ace-lsp/generate-language-indices.mjs
 * Verify:     node tools/ace-lsp/generate-language-indices.mjs --check
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const GENERATOR_VERSION = 1;
const LANGUAGES = ["python", "lua", "java", "kotlin"];
const TYPESHED_REVISION = "d097b16922b98d06980c4be8050b44132da76ba1";

function fail(message) {
    process.stderr.write(`${message}\n`);
    process.exit(1);
}

function parseArguments(argv) {
    const result = {
        outDir: "app/src/main/assets/editor/ace-builds-1.4.12/autojs6/indices",
        check: false,
    };
    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        if (arg === "--check") {
            result.check = true;
        } else if (arg === "--out-dir") {
            result.outDir = argv[++i] || fail("--out-dir requires a value");
        } else {
            fail(`Unknown argument: ${arg}`);
        }
    }
    result.outDir = resolve(result.outDir);
    return result;
}

function parseSpec(spec) {
    const raw = String(spec);
    const metadata = /^(.*)(?:\|(function|property|constant|class|type|module|variable|constructor))(?:\|([\s\S]*))?$/.exec(raw);
    const declaration = metadata ? metadata[1] : raw;
    const explicitType = metadata?.[2] || "";
    const explicitDoc = metadata?.[3] || "";
    const functionMatch = /(?:^|\.)([A-Za-z_$][A-Za-z0-9_$]*)\s*\(/.exec(declaration);
    const propertyMatch = /(?:^|\.)([A-Za-z_$][A-Za-z0-9_$]*)\s*:/.exec(declaration);
    const name = functionMatch?.[1] || propertyMatch?.[1] || declaration.trim();
    const type = explicitType || (functionMatch ? "function" : "property");
    return {
        name,
        type,
        declaration: declaration.trim(),
        doc: explicitDoc || "",
    };
}

function entries(owner, specs, sourceLabel) {
    return specs.map((spec) => {
        const parsed = parseSpec(spec);
        const signature = owner ? `${owner}.${parsed.declaration}` : parsed.declaration;
        return {
            name: parsed.name,
            type: parsed.type,
            signature,
            doc: parsed.doc || `${sourceLabel} symbol ${owner ? `${owner}.` : ""}${parsed.name}.`,
        };
    });
}

function moduleItem(name, sourceLabel) {
    return {
        name,
        type: "module",
        signature: `${name}: module`,
        doc: `${sourceLabel} module ${name}.`,
    };
}

function classItem(name, sourceLabel) {
    return {
        name,
        type: "class",
        signature: `class ${name}`,
        doc: `${sourceLabel} type ${name}.`,
    };
}

function makeIndex(language, source, globals, modules, aliases = {}) {
    const normalizedModules = {};
    Object.keys(modules).sort().forEach((moduleName) => {
        normalizedModules[moduleName] = [...modules[moduleName]].sort((left, right) =>
            left.name.localeCompare(right.name));
    });
    return {
        schemaVersion: 1,
        generatorVersion: GENERATOR_VERSION,
        language,
        source,
        globals: [...globals].sort((left, right) => left.name.localeCompare(right.name)),
        modules: normalizedModules,
        aliases: Object.fromEntries(Object.entries(aliases).sort(([left], [right]) => left.localeCompare(right))),
    };
}

function pythonIndex() {
    const label = "Python 3.12/typeshed";
    const modules = {};
    const add = (name, specs) => { modules[name] = entries(name, specs, label); };
    add("os", [
        "chdir(path: str): None", "environ: dict|property", "getcwd(): str", "getenv(key: str, default: str = None): str",
        "listdir(path: str = '.'): list", "makedirs(name: str, exist_ok: bool = False): None", "mkdir(path: str): None",
        "path: module|module", "remove(path: str): None", "rename(src: str, dst: str): None", "rmdir(path: str): None",
        "scandir(path: str = '.'): Iterator", "stat(path: str): stat_result", "walk(top: str): Iterator",
    ]);
    add("os.path", [
        "abspath(path: str): str", "basename(path: str): str", "commonpath(paths: Iterable): str", "dirname(path: str): str",
        "exists(path: str): bool", "expanduser(path: str): str", "getsize(path: str): int", "isabs(path: str): bool",
        "isdir(path: str): bool", "isfile(path: str): bool", "join(path: str, *paths: str): str", "normpath(path: str): str",
        "realpath(path: str): str", "relpath(path: str, start: str = '.'): str", "split(path: str): tuple", "splitext(path: str): tuple",
    ]);
    add("sys", [
        "argv: list|property", "exit(status: object = None): NoReturn", "executable: str|property", "getdefaultencoding(): str",
        "getsizeof(object: object): int", "modules: dict|property", "path: list|property", "platform: str|property",
        "stderr: TextIO|property", "stdin: TextIO|property", "stdout: TextIO|property", "version: str|property", "version_info: tuple|property",
    ]);
    add("pathlib", ["Path: type|class", "PurePath: type|class", "PosixPath: type|class", "WindowsPath: type|class"]);
    add("pathlib.Path", [
        "absolute(): Path", "chmod(mode: int): None", "cwd(): Path", "exists(): bool", "glob(pattern: str): Iterator",
        "home(): Path", "is_dir(): bool", "is_file(): bool", "iterdir(): Iterator", "mkdir(parents: bool = False, exist_ok: bool = False): None",
        "name: str|property", "open(mode: str = 'r'): IO", "parent: Path|property", "read_bytes(): bytes", "read_text(encoding: str = None): str",
        "rename(target: str): Path", "resolve(): Path", "rglob(pattern: str): Iterator", "stem: str|property", "suffix: str|property",
        "touch(exist_ok: bool = True): None", "unlink(missing_ok: bool = False): None", "write_bytes(data: bytes): int", "write_text(data: str): int",
    ]);
    add("json", [
        "dump(obj: object, fp: IO, **kwargs): None", "dumps(obj: object, **kwargs): str", "load(fp: IO, **kwargs): object",
        "loads(s: str, **kwargs): object", "JSONDecodeError: type|class", "JSONDecoder: type|class", "JSONEncoder: type|class",
    ]);
    add("math", [
        "ceil(x: float): int", "comb(n: int, k: int): int", "cos(x: float): float", "e: float|constant", "exp(x: float): float",
        "factorial(n: int): int", "floor(x: float): int", "gcd(*integers: int): int", "hypot(*coordinates: float): float",
        "isclose(a: float, b: float): bool", "isfinite(x: float): bool", "log(x: float, base: float = None): float",
        "pi: float|constant", "pow(x: float, y: float): float", "sin(x: float): float", "sqrt(x: float): float", "tau: float|constant",
    ]);
    add("random", [
        "choice(seq: Sequence): object", "choices(population: Sequence, k: int = 1): list", "getrandbits(k: int): int",
        "randint(a: int, b: int): int", "random(): float", "randrange(start: int, stop: int = None, step: int = 1): int",
        "sample(population: Sequence, k: int): list", "seed(a: object = None): None", "shuffle(x: list): None", "uniform(a: float, b: float): float",
    ]);
    add("re", [
        "compile(pattern: str, flags: int = 0): Pattern", "escape(pattern: str): str", "findall(pattern: str, string: str): list",
        "finditer(pattern: str, string: str): Iterator", "fullmatch(pattern: str, string: str): Match", "IGNORECASE: RegexFlag|constant",
        "match(pattern: str, string: str): Match", "MULTILINE: RegexFlag|constant", "search(pattern: str, string: str): Match",
        "split(pattern: str, string: str): list", "sub(pattern: str, repl: object, string: str): str",
    ]);
    add("datetime", [
        "date: type|class", "datetime: type|class", "MAXYEAR: int|constant", "MINYEAR: int|constant", "time: type|class",
        "timedelta: type|class", "timezone: type|class", "tzinfo: type|class",
    ]);
    add("datetime.date", ["fromisoformat(date_string: str): date", "isoformat(): str", "replace(**kwargs): date", "today(): date", "weekday(): int"]);
    add("datetime.datetime", [
        "astimezone(tz: tzinfo = None): datetime", "combine(date: date, time: time): datetime", "fromisoformat(date_string: str): datetime",
        "isoformat(sep: str = 'T'): str", "now(tz: tzinfo = None): datetime", "replace(**kwargs): datetime", "strptime(date_string: str, format: str): datetime",
        "timestamp(): float", "today(): datetime", "utcnow(): datetime",
    ]);
    add("time", ["ctime(seconds: float = None): str", "monotonic(): float", "perf_counter(): float", "sleep(seconds: float): None", "strftime(format: str): str", "time(): float"]);
    add("collections", [
        "ChainMap: type|class", "Counter: type|class", "defaultdict: type|class", "deque: type|class", "namedtuple(typename: str, field_names: object): type",
        "OrderedDict: type|class", "UserDict: type|class", "UserList: type|class", "UserString: type|class",
    ]);
    add("itertools", [
        "accumulate(iterable: Iterable, func: object = None): Iterator", "chain(*iterables: Iterable): Iterator", "combinations(iterable: Iterable, r: int): Iterator",
        "count(start: int = 0, step: int = 1): Iterator", "cycle(iterable: Iterable): Iterator", "groupby(iterable: Iterable, key: object = None): Iterator",
        "islice(iterable: Iterable, stop: int): Iterator", "permutations(iterable: Iterable, r: int = None): Iterator", "product(*iterables: Iterable): Iterator",
        "repeat(object: object, times: int = None): Iterator", "starmap(function: object, iterable: Iterable): Iterator", "zip_longest(*iterables: Iterable): Iterator",
    ]);
    add("functools", [
        "cache(user_function: object): object", "cached_property(func: object): object", "cmp_to_key(mycmp: object): object",
        "lru_cache(maxsize: int = 128): object", "partial(func: object, *args: object): object", "reduce(function: object, iterable: Iterable): object",
        "singledispatch(func: object): object", "total_ordering(cls: type): type", "wraps(wrapped: object): object",
    ]);
    add("typing", [
        "Any: special-form|type", "Callable: special-form|type", "ClassVar: special-form|type", "Final: special-form|type", "Generic: type|class",
        "Iterable: type|class", "Iterator: type|class", "Literal: special-form|type", "Mapping: type|class", "NamedTuple: type|class",
        "Optional: special-form|type", "Protocol: type|class", "Sequence: type|class", "TypeAlias: special-form|type", "TypeVar(name: str): TypeVar",
        "Union: special-form|type", "cast(typ: type, val: object): object", "overload(func: object): object",
    ]);
    add("subprocess", [
        "DEVNULL: int|constant", "PIPE: int|constant", "Popen: type|class", "STDOUT: int|constant",
        "call(args: object, **kwargs): int", "check_call(args: object, **kwargs): int", "check_output(args: object, **kwargs): bytes",
        "run(args: object, **kwargs): CompletedProcess",
    ]);
    add("threading", [
        "Barrier: type|class", "Condition: type|class", "Event: type|class", "Lock(): Lock", "RLock(): RLock",
        "Semaphore: type|class", "Thread: type|class", "Timer: type|class", "active_count(): int", "current_thread(): Thread", "enumerate(): list",
    ]);
    add("asyncio", [
        "CancelledError: type|class", "Event: type|class", "Future: type|class", "Lock: type|class", "Queue: type|class", "Task: type|class",
        "create_task(coro: object): Task", "gather(*aws: object): Future", "get_event_loop(): EventLoop", "run(main: object): object",
        "sleep(delay: float): Coroutine", "to_thread(func: object, *args: object): Coroutine", "wait_for(aw: object, timeout: float): Coroutine",
    ]);
    add("logging", [
        "CRITICAL: int|constant", "DEBUG: int|constant", "ERROR: int|constant", "INFO: int|constant", "WARNING: int|constant",
        "Logger: type|class", "basicConfig(**kwargs): None", "debug(msg: object, *args: object): None", "error(msg: object, *args: object): None",
        "exception(msg: object, *args: object): None", "getLogger(name: str = None): Logger", "info(msg: object, *args: object): None",
        "warning(msg: object, *args: object): None",
    ]);
    add("csv", ["DictReader: type|class", "DictWriter: type|class", "reader(csvfile: Iterable, dialect: str = 'excel'): Reader", "writer(csvfile: IO, dialect: str = 'excel'): Writer"]);
    add("sqlite3", [
        "Binary: type|class", "Connection: type|class", "Cursor: type|class", "Error: type|class", "IntegrityError: type|class",
        "OperationalError: type|class", "Row: type|class", "connect(database: str, timeout: float = 5.0): Connection",
    ]);
    add("urllib.parse", [
        "parse_qs(qs: str): dict", "quote(string: str, safe: str = '/'): str", "unquote(string: str): str", "urlencode(query: object): str",
        "urljoin(base: str, url: str): str", "urlparse(url: str, scheme: str = ''): ParseResult", "urlsplit(url: str, scheme: str = ''): SplitResult",
    ]);
    add("http.client", [
        "HTTPConnection: type|class", "HTTPException: type|class", "HTTPResponse: type|class", "HTTPSConnection: type|class",
        "NOT_FOUND: int|constant", "OK: int|constant", "responses: dict|property",
    ]);
    add("hashlib", [
        "algorithms_available: set|property", "algorithms_guaranteed: set|property", "blake2b(data: bytes = b''): Hash", "md5(data: bytes = b''): Hash",
        "new(name: str, data: bytes = b''): Hash", "sha1(data: bytes = b''): Hash", "sha256(data: bytes = b''): Hash", "sha512(data: bytes = b''): Hash",
    ]);
    add("base64", [
        "b64decode(s: object, altchars: bytes = None): bytes", "b64encode(s: bytes, altchars: bytes = None): bytes",
        "urlsafe_b64decode(s: object): bytes", "urlsafe_b64encode(s: bytes): bytes",
    ]);
    add("shutil", [
        "copy(src: str, dst: str): str", "copy2(src: str, dst: str): str", "copyfile(src: str, dst: str): str", "copytree(src: str, dst: str): str",
        "disk_usage(path: str): tuple", "make_archive(base_name: str, format: str): str", "move(src: str, dst: str): str", "rmtree(path: str): None",
        "unpack_archive(filename: str, extract_dir: str = None): None", "which(cmd: str): str",
    ]);
    add("tempfile", [
        "NamedTemporaryFile(**kwargs): IO", "TemporaryDirectory(**kwargs): TemporaryDirectory", "TemporaryFile(**kwargs): IO",
        "gettempdir(): str", "mkdtemp(**kwargs): str", "mkstemp(**kwargs): tuple",
    ]);
    add("glob", ["escape(pathname: str): str", "glob(pathname: str, recursive: bool = False): list", "iglob(pathname: str, recursive: bool = False): Iterator"]);
    add("fnmatch", ["filter(names: Iterable, pat: str): list", "fnmatch(name: str, pat: str): bool", "fnmatchcase(name: str, pat: str): bool", "translate(pat: str): str"]);
    add("statistics", [
        "fmean(data: Iterable): float", "geometric_mean(data: Iterable): float", "harmonic_mean(data: Iterable): float", "mean(data: Iterable): float",
        "median(data: Iterable): float", "mode(data: Iterable): object", "pstdev(data: Iterable): float", "stdev(data: Iterable): float", "variance(data: Iterable): float",
    ]);
    add("decimal", [
        "BasicContext: Context|property", "Context: type|class", "Decimal: type|class", "DecimalException: type|class", "DefaultContext: Context|property",
        "ExtendedContext: Context|property", "getcontext(): Context", "localcontext(ctx: Context = None): Context", "setcontext(context: Context): None",
    ]);
    add("socket", [
        "AF_INET: int|constant", "AF_INET6: int|constant", "SOCK_DGRAM: int|constant", "SOCK_STREAM: int|constant", "SocketType: type|class",
        "create_connection(address: tuple, timeout: float = None): socket", "getaddrinfo(host: str, port: object): list", "gethostname(): str", "socket: type|class",
    ]);

    const globalSpecs = [
        "abs(x: object): object", "all(iterable: Iterable): bool", "any(iterable: Iterable): bool", "bin(x: int): str", "bool(x: object = False): bool|class",
        "bytearray(source: object = b''): bytearray|class", "bytes(source: object = b''): bytes|class", "callable(object: object): bool",
        "chr(i: int): str", "dict(**kwargs): dict|class", "dir(object: object = None): list", "divmod(a: object, b: object): tuple",
        "enumerate(iterable: Iterable, start: int = 0): enumerate", "filter(function: object, iterable: Iterable): filter", "float(x: object = 0): float|class",
        "format(value: object, format_spec: str = ''): str", "frozenset(iterable: Iterable = ()): frozenset|class", "getattr(object: object, name: str): object",
        "globals(): dict", "hasattr(object: object, name: str): bool", "hash(object: object): int", "help(request: object = None): None",
        "hex(x: int): str", "id(object: object): int", "input(prompt: str = ''): str", "int(x: object = 0): int|class",
        "isinstance(object: object, classinfo: object): bool", "issubclass(cls: type, classinfo: object): bool", "iter(object: object): Iterator",
        "len(object: object): int", "list(iterable: Iterable = ()): list|class", "locals(): dict", "map(function: object, *iterables: Iterable): map",
        "max(iterable: Iterable): object", "memoryview(object: object): memoryview|class", "min(iterable: Iterable): object", "next(iterator: Iterator): object",
        "object(): object|class", "oct(x: int): str", "open(file: object, mode: str = 'r'): IO", "ord(c: str): int", "pow(base: object, exp: object): object",
        "print(*objects: object, sep: str = ' ', end: str = '\\n'): None", "property(fget: object = None): property|class", "range(stop: int): range|class",
        "repr(object: object): str", "reversed(sequence: object): Iterator", "round(number: object, ndigits: int = None): object",
        "set(iterable: Iterable = ()): set|class", "setattr(object: object, name: str, value: object): None", "slice(stop: int): slice|class",
        "sorted(iterable: Iterable, key: object = None, reverse: bool = False): list", "str(object: object = ''): str|class", "sum(iterable: Iterable, start: object = 0): object",
        "super(): super|class", "tuple(iterable: Iterable = ()): tuple|class", "type(object: object): type|class", "vars(object: object = None): dict",
        "zip(*iterables: Iterable): zip", "Exception: type|class", "KeyError: type|class", "RuntimeError: type|class", "StopIteration: type|class",
        "TypeError: type|class", "ValueError: type|class",
    ];
    const globals = entries("", globalSpecs, label);
    ["os", "sys", "pathlib", "json", "math", "random", "re", "datetime", "time", "collections", "itertools", "functools", "typing", "subprocess", "threading", "asyncio", "logging", "csv", "sqlite3", "hashlib", "base64", "shutil", "tempfile", "glob", "fnmatch", "statistics", "decimal", "socket"]
        .forEach((name) => globals.push(moduleItem(name, label)));
    return makeIndex("python", {
        name: "typeshed stdlib plus Python documentation",
        languageVersion: "Python 3.12",
        revision: "autojs6-python-3.12-subset-1",
        upstreamRevision: TYPESHED_REVISION,
        url: `https://github.com/python/typeshed/tree/${TYPESHED_REVISION}/stdlib`,
        license: "Apache-2.0 (typeshed); PSF-2.0 (Python documentation)",
        scope: "builtins and 34 selected standard-library module contexts; API names/signatures only",
    }, globals, modules, {
        Path: "pathlib.Path",
        PurePath: "pathlib.Path",
        date: "datetime.date",
        datetime: "datetime.datetime",
    });
}

function luaIndex() {
    const label = "Lua 5.4";
    const modules = {};
    const add = (name, specs) => { modules[name] = entries(name, specs, label); };
    add("string", [
        "byte(s: string, i: integer = 1, j: integer = i): integer", "char(*codes: integer): string", "dump(function: function): string",
        "find(s: string, pattern: string, init: integer = 1, plain: boolean = false): integer", "format(formatstring: string, *values: any): string",
        "gmatch(s: string, pattern: string): function", "gsub(s: string, pattern: string, repl: any, n: integer = max): string",
        "len(s: string): integer", "lower(s: string): string", "match(s: string, pattern: string, init: integer = 1): string",
        "pack(format: string, *values: any): string", "rep(s: string, n: integer, sep: string = ''): string", "reverse(s: string): string",
        "sub(s: string, i: integer, j: integer = -1): string", "upper(s: string): string",
    ]);
    add("table", [
        "concat(list: table, sep: string = '', i: integer = 1, j: integer = #list): string", "insert(list: table, pos: integer, value: any): nil",
        "move(a1: table, f: integer, e: integer, t: integer, a2: table = a1): table", "pack(*values: any): table",
        "remove(list: table, pos: integer = #list): any", "sort(list: table, comp: function = nil): nil", "unpack(list: table, i: integer = 1, j: integer = #list): any",
    ]);
    add("math", [
        "abs(x: number): number", "acos(x: number): number", "ceil(x: number): integer", "cos(x: number): number", "deg(x: number): number",
        "floor(x: number): integer", "fmod(x: number, y: number): number", "huge: number|constant", "max(*values: number): number",
        "maxinteger: integer|constant", "min(*values: number): number", "mininteger: integer|constant", "modf(x: number): integer",
        "pi: number|constant", "rad(x: number): number", "random(m: integer = nil, n: integer = nil): number", "randomseed(x: integer, y: integer = nil): nil",
        "sin(x: number): number", "sqrt(x: number): number", "tan(x: number): number", "tointeger(x: any): integer", "type(x: number): string",
    ]);
    add("io", [
        "close(file: file = default): boolean", "flush(): boolean", "input(file: file|string = default): file", "lines(filename: string, *formats: string): function",
        "open(filename: string, mode: string = 'r'): file", "output(file: file|string = default): file", "popen(prog: string, mode: string = 'r'): file",
        "read(*formats: string): any", "stderr: file|property", "stdin: file|property", "stdout: file|property", "tmpfile(): file",
        "type(obj: any): string", "write(*values: string): file",
    ]);
    add("os", [
        "clock(): number", "date(format: string = '%c', time: integer = now): string", "difftime(t2: integer, t1: integer): number",
        "execute(command: string = nil): boolean", "exit(code: any = true, close: boolean = false): nil", "getenv(varname: string): string",
        "remove(filename: string): boolean", "rename(oldname: string, newname: string): boolean", "setlocale(locale: string = nil, category: string = 'all'): string",
        "time(table: table = nil): integer", "tmpname(): string",
    ]);
    add("coroutine", [
        "close(co: thread): boolean", "create(f: function): thread", "isyieldable(co: thread = running): boolean", "resume(co: thread, *values: any): boolean",
        "running(): thread", "status(co: thread): string", "wrap(f: function): function", "yield(*values: any): any",
    ]);
    add("utf8", [
        "char(*codepoints: integer): string", "charpattern: string|constant", "codepoint(s: string, i: integer = 1, j: integer = i): integer",
        "codes(s: string, lax: boolean = false): function", "len(s: string, i: integer = 1, j: integer = -1, lax: boolean = false): integer",
        "offset(s: string, n: integer, i: integer = default): integer",
    ]);
    add("package", [
        "config: string|property", "cpath: string|property", "loaded: table|property", "loadlib(libname: string, funcname: string): function",
        "path: string|property", "preload: table|property", "searchers: table|property", "searchpath(name: string, path: string, sep: string = '.', rep: string = dirsep): string",
    ]);
    add("debug", [
        "debug(): nil", "gethook(thread: thread = current): function", "getinfo(thread: thread = current, f: any, what: string = 'flnSrtu'): table",
        "getlocal(thread: thread = current, f: any, local: integer): any", "getmetatable(value: any): table", "getregistry(): table",
        "getupvalue(f: function, up: integer): string", "sethook(thread: thread = current, hook: function, mask: string, count: integer = 0): nil",
        "setlocal(thread: thread = current, level: integer, local: integer, value: any): string", "setmetatable(value: any, table: table): any",
        "traceback(thread: thread = current, message: any = nil, level: integer = 1): string",
    ]);
    add("metatable", ["__index: any|property", "__newindex: any|property", "__call: function|property", "__len: function|property", "__tostring: function|property"]);
    add("file", [
        "close(): boolean", "flush(): boolean", "lines(*formats: string): function", "read(*formats: string): any", "seek(whence: string = 'cur', offset: integer = 0): integer",
        "setvbuf(mode: string, size: integer = default): boolean", "write(*values: string): file",
    ]);
    const globals = entries("", [
        "_G: table|property", "_VERSION: string|constant", "assert(value: any, message: any = nil): any", "collectgarbage(option: string = 'collect', arg: any = nil): any",
        "dofile(filename: string = nil): any", "error(message: any, level: integer = 1): nil", "getmetatable(object: any): table",
        "ipairs(t: table): function", "load(chunk: string|function, chunkname: string = chunk, mode: string = 'bt', env: table = _G): function",
        "loadfile(filename: string = nil, mode: string = 'bt', env: table = _G): function", "next(table: table, index: any = nil): any",
        "pairs(t: table): function", "pcall(f: function, *args: any): boolean", "print(*values: any): nil", "rawequal(v1: any, v2: any): boolean",
        "rawget(table: table, index: any): any", "rawlen(value: any): integer", "rawset(table: table, index: any, value: any): table",
        "require(modname: string): any", "select(index: any, *values: any): any", "setmetatable(table: table, metatable: table): table",
        "tonumber(e: any, base: integer = 10): number", "tostring(value: any): string", "type(value: any): string", "warn(*messages: string): nil",
        "xpcall(f: function, msgh: function, *args: any): boolean",
    ], label);
    ["string", "table", "math", "io", "os", "coroutine", "utf8", "package", "debug"].forEach((name) => globals.push(moduleItem(name, label)));
    return makeIndex("lua", {
        name: "Lua 5.4 Reference Manual",
        languageVersion: "Lua 5.4.8",
        revision: "autojs6-lua-5.4-subset-1",
        url: "https://www.lua.org/manual/5.4/manual.html#6",
        license: "Lua MIT license; API names/signatures only",
        scope: "base library and standard-library tables",
    }, globals, modules);
}

function javaIndex() {
    const label = "Java 17/Android API 35";
    const modules = {};
    const add = (name, specs) => { modules[name] = entries(name, specs, label); };
    add("Math", [
        "E: double|constant", "PI: double|constant", "abs(value: double): double", "ceil(value: double): double", "cos(value: double): double",
        "exp(value: double): double", "floor(value: double): double", "log(value: double): double", "max(a: double, b: double): double",
        "min(a: double, b: double): double", "pow(a: double, b: double): double", "random(): double", "round(value: double): long",
        "signum(value: double): double", "sin(value: double): double", "sqrt(value: double): double", "toDegrees(radians: double): double",
        "toRadians(degrees: double): double",
    ]);
    add("System", [
        "err: PrintStream|property", "in: InputStream|property", "out: PrintStream|property", "arraycopy(src: Object, srcPos: int, dest: Object, destPos: int, length: int): void",
        "currentTimeMillis(): long", "exit(status: int): void", "gc(): void", "getProperty(key: String): String", "getenv(name: String): String",
        "identityHashCode(value: Object): int", "lineSeparator(): String", "nanoTime(): long", "setProperty(key: String, value: String): String",
    ]);
    add("Collections", [
        "binarySearch(list: List, key: Object): int", "copy(dest: List, src: List): void", "emptyList(): List", "emptyMap(): Map", "emptySet(): Set",
        "frequency(collection: Collection, object: Object): int", "max(collection: Collection): Object", "min(collection: Collection): Object",
        "reverse(list: List): void", "shuffle(list: List): void", "singleton(value: Object): Set", "sort(list: List): void",
        "unmodifiableList(list: List): List", "unmodifiableMap(map: Map): Map",
    ]);
    add("Arrays", [
        "asList(*items: Object): List", "binarySearch(array: Object, key: Object): int", "compare(left: Object, right: Object): int",
        "copyOf(original: Object, newLength: int): Object", "deepEquals(left: Object, right: Object): boolean", "equals(left: Object, right: Object): boolean",
        "fill(array: Object, value: Object): void", "sort(array: Object): void", "stream(array: Object): Stream", "toString(array: Object): String",
    ]);
    add("Objects", [
        "checkIndex(index: int, length: int): int", "deepEquals(left: Object, right: Object): boolean", "equals(left: Object, right: Object): boolean",
        "hash(*values: Object): int", "hashCode(value: Object): int", "isNull(value: Object): boolean", "nonNull(value: Object): boolean",
        "requireNonNull(value: Object): Object", "toString(value: Object): String",
    ]);
    add("Integer", [
        "MAX_VALUE: int|constant", "MIN_VALUE: int|constant", "SIZE: int|constant", "bitCount(value: int): int", "compare(left: int, right: int): int",
        "decode(value: String): Integer", "parseInt(value: String, radix: int = 10): int", "toHexString(value: int): String", "toString(value: int): String",
        "valueOf(value: String): Integer",
    ]);
    add("Long", [
        "MAX_VALUE: long|constant", "MIN_VALUE: long|constant", "SIZE: int|constant", "compare(left: long, right: long): int",
        "parseLong(value: String, radix: int = 10): long", "toHexString(value: long): String", "toString(value: long): String", "valueOf(value: String): Long",
    ]);
    add("Double", [
        "MAX_VALUE: double|constant", "MIN_VALUE: double|constant", "NaN: double|constant", "POSITIVE_INFINITY: double|constant",
        "compare(left: double, right: double): int", "isFinite(value: double): boolean", "isInfinite(value: double): boolean", "isNaN(value: double): boolean",
        "parseDouble(value: String): double", "toString(value: double): String", "valueOf(value: String): Double",
    ]);
    add("Boolean", ["FALSE: Boolean|constant", "TRUE: Boolean|constant", "compare(left: boolean, right: boolean): int", "parseBoolean(value: String): boolean", "toString(value: boolean): String", "valueOf(value: String): Boolean"]);
    add("Character", [
        "MAX_VALUE: char|constant", "MIN_VALUE: char|constant", "digit(ch: char, radix: int): int", "isDigit(ch: char): boolean", "isLetter(ch: char): boolean",
        "isWhitespace(ch: char): boolean", "toLowerCase(ch: char): char", "toUpperCase(ch: char): char",
    ]);
    add("String", [
        "format(format: String, *args: Object): String", "join(delimiter: CharSequence, *elements: CharSequence): String",
        "valueOf(value: Object): String",
    ]);
    add("Thread", [
        "currentThread(): Thread", "interrupted(): boolean", "onSpinWait(): void", "sleep(millis: long): void", "yield(): void",
    ]);
    add("Optional", [
        "empty(): Optional", "of(value: Object): Optional", "ofNullable(value: Object): Optional",
    ]);
    add("List", ["copyOf(collection: Collection): List", "of(*elements: Object): List"]);
    add("Map", ["copyOf(map: Map): Map", "entry(key: Object, value: Object): Entry", "of(): Map", "ofEntries(*entries: Entry): Map"]);
    add("Set", ["copyOf(collection: Collection): Set", "of(*elements: Object): Set"]);
    add("Files", [
        "copy(source: Path, target: Path, *options: CopyOption): Path", "createDirectories(dir: Path): Path", "createFile(path: Path): Path",
        "delete(path: Path): void", "deleteIfExists(path: Path): boolean", "exists(path: Path, *options: LinkOption): boolean", "isDirectory(path: Path): boolean",
        "isRegularFile(path: Path): boolean", "list(dir: Path): Stream", "move(source: Path, target: Path, *options: CopyOption): Path",
        "readAllBytes(path: Path): byte[]", "readString(path: Path): String", "size(path: Path): long", "walk(start: Path): Stream",
        "write(path: Path, bytes: byte[]): Path", "writeString(path: Path, text: CharSequence): Path",
    ]);
    add("Paths", ["get(first: String, *more: String): Path", "get(uri: URI): Path"]);
    add("Log", [
        "d(tag: String, msg: String): int", "e(tag: String, msg: String): int", "i(tag: String, msg: String): int",
        "isLoggable(tag: String, level: int): boolean", "v(tag: String, msg: String): int", "w(tag: String, msg: String): int",
    ]);
    add("TextUtils", [
        "concat(*text: CharSequence): CharSequence", "equals(left: CharSequence, right: CharSequence): boolean", "isDigitsOnly(text: CharSequence): boolean",
        "isEmpty(text: CharSequence): boolean", "join(delimiter: CharSequence, tokens: Iterable): String",
    ]);
    add("Color", [
        "BLACK: int|constant", "BLUE: int|constant", "GREEN: int|constant", "RED: int|constant", "TRANSPARENT: int|constant", "WHITE: int|constant",
        "alpha(color: int): int", "argb(alpha: int, red: int, green: int, blue: int): int", "blue(color: int): int", "green(color: int): int",
        "parseColor(colorString: String): int", "red(color: int): int", "rgb(red: int, green: int, blue: int): int",
    ]);
    add("Uri", ["decode(value: String): String", "encode(value: String): String", "fromFile(file: File): Uri", "parse(uriString: String): Uri", "withAppendedPath(baseUri: Uri, pathSegment: String): Uri"]);
    add("java.io.File", [
        "absolutePath: String|property", "name: String|property", "parent: String|property", "delete(): boolean", "exists(): boolean",
        "isDirectory(): boolean", "isFile(): boolean", "length(): long", "listFiles(): File[]", "mkdir(): boolean", "mkdirs(): boolean",
        "renameTo(destination: File): boolean", "toPath(): Path",
    ]);
    add("java.nio.file.Path", [
        "fileName: Path|property", "parent: Path|property", "root: Path|property", "isAbsolute(): boolean", "normalize(): Path",
        "relativize(other: Path): Path", "resolve(other: Path): Path", "resolveSibling(other: Path): Path", "toAbsolutePath(): Path",
        "toFile(): File", "toUri(): URI",
    ]);
    add("java.util.ArrayList", [
        "add(element: Object): boolean", "add(index: int, element: Object): void", "addAll(elements: Collection): boolean", "clear(): void",
        "contains(element: Object): boolean", "get(index: int): Object", "indexOf(element: Object): int", "isEmpty(): boolean",
        "iterator(): Iterator", "remove(index: int): Object", "set(index: int, element: Object): Object", "size(): int",
        "sort(comparator: Comparator): void", "subList(fromIndex: int, toIndex: int): List", "toArray(): Object[]",
    ]);
    add("java.util.HashMap", [
        "clear(): void", "containsKey(key: Object): boolean", "containsValue(value: Object): boolean", "entrySet(): Set",
        "get(key: Object): Object", "getOrDefault(key: Object, defaultValue: Object): Object", "isEmpty(): boolean", "keySet(): Set",
        "put(key: Object, value: Object): Object", "putAll(map: Map): void", "putIfAbsent(key: Object, value: Object): Object",
        "remove(key: Object): Object", "replace(key: Object, value: Object): Object", "size(): int", "values(): Collection",
    ]);
    add("android.content.Context", [
        "cacheDir: File|property", "filesDir: File|property", "packageName: String|property", "applicationContext: Context|property",
        "getColor(id: int): int", "getDrawable(id: int): Drawable", "getString(id: int): String", "getSystemService(name: String): Object",
        "openFileInput(name: String): FileInputStream", "openFileOutput(name: String, mode: int): FileOutputStream",
        "startActivity(intent: Intent): void", "sendBroadcast(intent: Intent): void",
    ]);
    add("android.content.Intent", [
        "action: String|property", "data: Uri|property", "extras: Bundle|property", "flags: int|property", "addCategory(category: String): Intent",
        "addFlags(flags: int): Intent", "getBooleanExtra(name: String, defaultValue: boolean): boolean", "getIntExtra(name: String, defaultValue: int): int",
        "getStringExtra(name: String): String", "hasExtra(name: String): boolean", "putExtra(name: String, value: Object): Intent",
        "removeExtra(name: String): void", "setAction(action: String): Intent", "setClassName(packageName: String, className: String): Intent",
        "setData(data: Uri): Intent", "setType(type: String): Intent",
    ]);
    add("android.os.Bundle", [
        "clear(): void", "containsKey(key: String): boolean", "get(key: String): Object", "getBoolean(key: String, defaultValue: boolean = false): boolean",
        "getInt(key: String, defaultValue: int = 0): int", "getLong(key: String, defaultValue: long = 0): long", "getString(key: String): String",
        "isEmpty(): boolean", "keySet(): Set", "putBoolean(key: String, value: boolean): void", "putBundle(key: String, value: Bundle): void",
        "putInt(key: String, value: int): void", "putLong(key: String, value: long): void", "putString(key: String, value: String): void",
        "remove(key: String): void", "size(): int",
    ]);
    add("android.view.View", [
        "alpha: float|property", "contentDescription: CharSequence|property", "id: int|property", "isEnabled: boolean|property",
        "isSelected: boolean|property", "visibility: int|property", "findViewById(id: int): View", "performClick(): boolean",
        "post(action: Runnable): boolean", "postDelayed(action: Runnable, delayMillis: long): boolean", "requestFocus(): boolean",
        "setOnClickListener(listener: OnClickListener): void", "setOnLongClickListener(listener: OnLongClickListener): void",
    ]);
    add("android.net.Uri#instance", [
        "authority: String|property", "host: String|property", "lastPathSegment: String|property", "path: String|property",
        "scheme: String|property", "buildUpon(): Builder", "getQueryParameter(key: String): String", "normalizeScheme(): Uri",
        "toString(): String",
    ]);

    const classes = [
        "Object", "String", "StringBuilder", "Math", "System", "Integer", "Long", "Double", "Boolean", "Character", "Thread",
        "Iterable", "Comparable", "Exception", "RuntimeException", "List", "ArrayList", "LinkedList", "Map", "HashMap", "Set", "HashSet",
        "Collections", "Arrays", "Objects", "Optional", "File", "InputStream", "OutputStream", "Reader", "Writer", "Path", "Files", "Paths",
        "Log", "TextUtils", "Color", "Uri", "Context", "Intent", "Bundle", "View",
    ];
    const globals = classes.map((name) => classItem(name, label));
    const aliases = {};
    const qualified = {
        "java.lang.Math": "Math", "java.lang.System": "System", "java.lang.Integer": "Integer", "java.lang.Long": "Long",
        "java.lang.Double": "Double", "java.lang.Boolean": "Boolean", "java.lang.Character": "Character", "java.lang.String": "String",
        "java.lang.Thread": "Thread", "java.util.Collections": "Collections", "java.util.Arrays": "Arrays", "java.util.Objects": "Objects",
        "java.util.Optional": "Optional", "java.util.List": "List", "java.util.Map": "Map", "java.util.Set": "Set",
        "java.nio.file.Files": "Files", "java.nio.file.Paths": "Paths", "android.util.Log": "Log", "android.text.TextUtils": "TextUtils",
        "android.graphics.Color": "Color", "android.net.Uri": "Uri",
        "ArrayList": "java.util.ArrayList", "HashMap": "java.util.HashMap", "File": "java.io.File", "Path": "java.nio.file.Path",
        "Context": "android.content.Context", "Intent": "android.content.Intent", "Bundle": "android.os.Bundle", "View": "android.view.View",
    };
    Object.assign(aliases, qualified);
    return makeIndex("java", {
        name: "OpenJDK and Android SDK API subset",
        languageVersion: "Java 17; Android API 35",
        revision: "autojs6-java17-android35-subset-2",
        url: "https://docs.oracle.com/en/java/javase/17/docs/api/",
        androidUrl: "https://developer.android.com/reference/packages",
        license: "API names/signatures only; OpenJDK GPL-2.0-with-classpath-exception and Android SDK terms",
        scope: "java.lang/java.util/java.io/java.nio.file plus selected android.* static and instance APIs; no variable type inference",
    }, globals, modules, aliases);
}

function kotlinIndex(java) {
    const label = "Kotlin 2.2.21";
    const modules = {};
    const add = (name, specs) => { modules[name] = entries(name, specs, label); };
    add("kotlin", [
        "TODO(reason: String = ''): Nothing", "arrayOf(*elements: Object): Array", "assert(value: Boolean, lazyMessage: function = default): Unit",
        "check(value: Boolean): Unit", "checkNotNull(value: Object): Object", "error(message: Object): Nothing", "lazy(initializer: function): Lazy",
        "require(value: Boolean): Unit", "requireNotNull(value: Object): Object", "runCatching(block: function): Result",
    ]);
    add("kotlin.collections", [
        "arrayListOf(*elements: Object): ArrayList", "buildList(builderAction: function): List", "buildMap(builderAction: function): Map",
        "buildSet(builderAction: function): Set", "emptyList(): List", "emptyMap(): Map", "emptySet(): Set", "hashMapOf(*pairs: Pair): HashMap",
        "hashSetOf(*elements: Object): HashSet", "listOf(*elements: Object): List", "mapOf(*pairs: Pair): Map", "mutableListOf(*elements: Object): MutableList",
        "mutableMapOf(*pairs: Pair): MutableMap", "mutableSetOf(*elements: Object): MutableSet", "setOf(*elements: Object): Set",
    ]);
    add("kotlin.text", [
        "Regex: type|class", "StringBuilder: type|class", "appendLine(builder: Appendable, value: Object = ''): Appendable",
        "buildString(builderAction: function): String", "trimIndent(value: String): String", "trimMargin(value: String, marginPrefix: String = '|'): String",
    ]);
    add("kotlin.io", [
        "print(message: Object): Unit", "printf(format: String, *args: Object): Unit", "println(message: Object = ''): Unit", "readLine(): String",
    ]);
    add("kotlin.ranges", [
        "downTo(from: Int, to: Int): IntProgression", "rangeTo(from: Comparable, to: Comparable): ClosedRange", "until(from: Int, to: Int): IntRange",
    ]);
    add("kotlin.sequences", [
        "emptySequence(): Sequence", "generateSequence(nextFunction: function): Sequence", "sequence(block: function): Sequence", "sequenceOf(*elements: Object): Sequence",
    ]);
    add("Regex", [
        "escape(literal: String): String", "escapeReplacement(literal: String): String", "fromLiteral(literal: String): Regex",
    ]);
    add("Result", ["failure(exception: Throwable): Result", "success(value: Object): Result"]);
    add("kotlin.String", [
        "length: Int|property", "capitalize(): String", "contains(other: CharSequence, ignoreCase: Boolean = false): Boolean",
        "endsWith(suffix: String, ignoreCase: Boolean = false): Boolean", "isBlank(): Boolean", "isEmpty(): Boolean",
        "lowercase(): String", "removePrefix(prefix: CharSequence): String", "removeSuffix(suffix: CharSequence): String",
        "replace(oldValue: String, newValue: String, ignoreCase: Boolean = false): String", "split(*delimiters: String): List",
        "startsWith(prefix: String, ignoreCase: Boolean = false): Boolean", "substring(startIndex: Int, endIndex: Int = length): String",
        "toBooleanStrictOrNull(): Boolean", "toDoubleOrNull(): Double", "toIntOrNull(radix: Int = 10): Int", "toLongOrNull(radix: Int = 10): Long",
        "trim(): String", "trimIndent(): String", "uppercase(): String",
    ]);
    add("kotlin.text.StringBuilder", [
        "length: Int|property", "append(value: Object): StringBuilder", "appendLine(value: Object = ''): StringBuilder",
        "clear(): StringBuilder", "deleteAt(index: Int): StringBuilder", "insert(index: Int, value: Object): StringBuilder",
        "isEmpty(): Boolean", "reverse(): StringBuilder", "set(index: Int, value: Char): Unit", "toString(): String",
    ]);
    add("kotlin.text.Regex#instance", [
        "matches(input: CharSequence): Boolean", "containsMatchIn(input: CharSequence): Boolean", "find(input: CharSequence, startIndex: Int = 0): MatchResult",
        "findAll(input: CharSequence, startIndex: Int = 0): Sequence", "matchEntire(input: CharSequence): MatchResult",
        "replace(input: CharSequence, replacement: String): String", "replaceFirst(input: CharSequence, replacement: String): String",
        "split(input: CharSequence, limit: Int = 0): List", "toPattern(): Pattern",
    ]);
    add("kotlin.Array", [
        "indices: IntRange|property", "lastIndex: Int|property", "size: Int|property", "all(predicate: function): Boolean",
        "any(predicate: function): Boolean", "contains(element: Object): Boolean", "filter(predicate: function): List", "find(predicate: function): Object",
        "first(): Object", "forEach(action: function): Unit", "get(index: Int): Object", "isEmpty(): Boolean", "joinToString(separator: CharSequence = ', '): String",
        "last(): Object", "map(transform: function): List", "set(index: Int, value: Object): Unit", "sorted(): List", "toList(): List",
    ]);
    add("kotlin.collections.List", [
        "indices: IntRange|property", "lastIndex: Int|property", "size: Int|property", "all(predicate: function): Boolean",
        "any(predicate: function): Boolean", "associate(transform: function): Map", "contains(element: Object): Boolean", "distinct(): List",
        "filter(predicate: function): List", "find(predicate: function): Object", "first(): Object", "firstOrNull(): Object",
        "flatMap(transform: function): List", "forEach(action: function): Unit", "get(index: Int): Object", "groupBy(keySelector: function): Map",
        "indexOf(element: Object): Int", "isEmpty(): Boolean", "joinToString(separator: CharSequence = ', '): String", "last(): Object",
        "lastOrNull(): Object", "map(transform: function): List", "sorted(): List", "sortedBy(selector: function): List",
        "take(count: Int): List", "toMutableList(): MutableList", "zip(other: Iterable): List",
    ]);
    add("kotlin.collections.MutableList", [
        "indices: IntRange|property", "lastIndex: Int|property", "size: Int|property", "add(element: Object): Boolean",
        "add(index: Int, element: Object): Unit", "addAll(elements: Collection): Boolean", "clear(): Unit", "contains(element: Object): Boolean",
        "filter(predicate: function): List", "first(): Object", "forEach(action: function): Unit", "get(index: Int): Object",
        "isEmpty(): Boolean", "joinToString(separator: CharSequence = ', '): String", "map(transform: function): List",
        "remove(element: Object): Boolean", "removeAt(index: Int): Object", "set(index: Int, element: Object): Object",
        "sort(): Unit", "sortBy(selector: function): Unit", "toList(): List",
    ]);
    add("kotlin.collections.Map", [
        "entries: Set|property", "keys: Set|property", "size: Int|property", "values: Collection|property", "all(predicate: function): Boolean",
        "any(predicate: function): Boolean", "containsKey(key: Object): Boolean", "containsValue(value: Object): Boolean", "filter(predicate: function): Map",
        "forEach(action: function): Unit", "get(key: Object): Object", "getOrDefault(key: Object, defaultValue: Object): Object",
        "isEmpty(): Boolean", "map(transform: function): List", "mapKeys(transform: function): Map", "mapValues(transform: function): Map",
        "toList(): List", "toMutableMap(): MutableMap",
    ]);
    add("kotlin.collections.MutableMap", [
        "entries: MutableSet|property", "keys: MutableSet|property", "size: Int|property", "values: MutableCollection|property",
        "clear(): Unit", "containsKey(key: Object): Boolean", "filter(predicate: function): Map", "forEach(action: function): Unit",
        "get(key: Object): Object", "getOrDefault(key: Object, defaultValue: Object): Object", "isEmpty(): Boolean",
        "put(key: Object, value: Object): Object", "putAll(from: Map): Unit", "remove(key: Object): Object", "toMap(): Map",
    ]);
    add("kotlin.collections.Set", [
        "size: Int|property", "all(predicate: function): Boolean", "any(predicate: function): Boolean", "contains(element: Object): Boolean",
        "filter(predicate: function): List", "forEach(action: function): Unit", "intersect(other: Iterable): Set", "isEmpty(): Boolean",
        "map(transform: function): List", "minus(element: Object): Set", "plus(element: Object): Set", "toList(): List", "toMutableSet(): MutableSet",
        "union(other: Iterable): Set",
    ]);
    add("kotlin.collections.MutableSet", [
        "size: Int|property", "add(element: Object): Boolean", "addAll(elements: Collection): Boolean", "clear(): Unit",
        "contains(element: Object): Boolean", "filter(predicate: function): List", "forEach(action: function): Unit", "isEmpty(): Boolean",
        "remove(element: Object): Boolean", "removeAll(elements: Collection): Boolean", "retainAll(elements: Collection): Boolean", "toSet(): Set",
    ]);
    add("kotlin.sequences.Sequence", [
        "all(predicate: function): Boolean", "any(predicate: function): Boolean", "associate(transform: function): Map",
        "distinct(): Sequence", "filter(predicate: function): Sequence", "find(predicate: function): Object", "first(): Object",
        "flatMap(transform: function): Sequence", "forEach(action: function): Unit", "map(transform: function): Sequence",
        "take(count: Int): Sequence", "toList(): List", "toSet(): Set",
    ]);
    add("kotlin.ranges.IntRange", [
        "endInclusive: Int|property", "first: Int|property", "last: Int|property", "step: Int|property", "contains(value: Int): Boolean",
        "isEmpty(): Boolean", "reversed(): IntProgression", "step(step: Int): IntProgression",
    ]);
    add("kotlin.Int", [
        "absoluteValue: Int|property", "coerceAtLeast(minimumValue: Int): Int", "coerceAtMost(maximumValue: Int): Int",
        "coerceIn(minimumValue: Int, maximumValue: Int): Int", "downTo(to: Int): IntProgression", "toDouble(): Double",
        "toLong(): Long", "toString(radix: Int = 10): String", "until(to: Int): IntRange",
    ]);
    add("kotlin.Long", [
        "absoluteValue: Long|property", "coerceAtLeast(minimumValue: Long): Long", "coerceAtMost(maximumValue: Long): Long",
        "toDouble(): Double", "toInt(): Int", "toString(radix: Int = 10): String",
    ]);
    add("kotlin.Double", [
        "absoluteValue: Double|property", "isFinite(): Boolean", "isInfinite(): Boolean", "isNaN(): Boolean", "roundToInt(): Int",
        "roundToLong(): Long", "toInt(): Int", "toLong(): Long", "toString(): String",
    ]);
    add("kotlin.Boolean", ["and(other: Boolean): Boolean", "not(): Boolean", "or(other: Boolean): Boolean", "toString(): String", "xor(other: Boolean): Boolean"]);
    const globals = entries("", [
        "TODO(reason: String = ''): Nothing", "arrayOf(*elements: Object): Array", "arrayListOf(*elements: Object): ArrayList",
        "booleanArrayOf(*elements: Boolean): BooleanArray", "buildList(builderAction: function): List", "buildMap(builderAction: function): Map",
        "buildSet(builderAction: function): Set", "byteArrayOf(*elements: Byte): ByteArray", "charArrayOf(*elements: Char): CharArray",
        "check(value: Boolean): Unit", "checkNotNull(value: Object): Object", "doubleArrayOf(*elements: Double): DoubleArray",
        "emptyArray(): Array", "emptyList(): List", "emptyMap(): Map", "emptySet(): Set", "error(message: Object): Nothing",
        "floatArrayOf(*elements: Float): FloatArray", "generateSequence(nextFunction: function): Sequence", "hashMapOf(*pairs: Pair): HashMap",
        "hashSetOf(*elements: Object): HashSet", "intArrayOf(*elements: Int): IntArray", "lazy(initializer: function): Lazy",
        "listOf(*elements: Object): List", "longArrayOf(*elements: Long): LongArray", "mapOf(*pairs: Pair): Map",
        "mutableListOf(*elements: Object): MutableList", "mutableMapOf(*pairs: Pair): MutableMap", "mutableSetOf(*elements: Object): MutableSet",
        "print(message: Object): Unit", "println(message: Object = ''): Unit", "readLine(): String", "require(value: Boolean): Unit",
        "requireNotNull(value: Object): Object", "run(block: function): Object", "runCatching(block: function): Result", "sequence(block: function): Sequence",
        "sequenceOf(*elements: Object): Sequence", "setOf(*elements: Object): Set", "shortArrayOf(*elements: Short): ShortArray",
        "synchronized(lock: Object, block: function): Object", "with(receiver: Object, block: function): Object",
    ], label);
    [
        "Any", "Unit", "Nothing", "Throwable", "Exception", "IllegalArgumentException", "IllegalStateException", "String", "StringBuilder",
        "CharSequence", "Number", "Byte", "Short", "Int", "Long", "Float", "Double", "Boolean", "Char", "Array", "Pair", "Triple",
        "Result", "Lazy", "Regex", "List", "MutableList", "Map", "MutableMap", "Set", "MutableSet", "Sequence", "Iterable", "Iterator",
    ].forEach((name) => globals.push(classItem(name, label)));
    const interopModules = [
        "Math", "System", "Collections", "Arrays", "Objects", "Files", "Paths", "Log", "TextUtils", "Color", "Uri",
        "java.io.File", "java.nio.file.Path", "java.util.ArrayList", "java.util.HashMap", "android.content.Context",
        "android.content.Intent", "android.os.Bundle", "android.view.View", "android.net.Uri#instance",
    ];
    interopModules.forEach((moduleName) => {
        if (java.modules[moduleName]) {
            modules[moduleName] = java.modules[moduleName].map((item) => ({ ...item }));
        }
    });
    const interopGlobals = new Set([
        "Math", "System", "Collections", "Arrays", "Objects", "Files", "Paths", "Log", "TextUtils", "Color", "Uri",
        "File", "Path", "ArrayList", "HashMap", "Context", "Intent", "Bundle", "View",
    ]);
    java.globals.filter((item) => interopGlobals.has(item.name)).forEach((item) => globals.push({ ...item }));
    const aliases = {
        ...java.aliases,
        "String": "kotlin.String",
        "Array": "kotlin.Array",
        "List": "kotlin.collections.List",
        "MutableList": "kotlin.collections.MutableList",
        "Map": "kotlin.collections.Map",
        "MutableMap": "kotlin.collections.MutableMap",
        "Set": "kotlin.collections.Set",
        "MutableSet": "kotlin.collections.MutableSet",
        "Sequence": "kotlin.sequences.Sequence",
        "IntRange": "kotlin.ranges.IntRange",
        "Int": "kotlin.Int",
        "Long": "kotlin.Long",
        "Double": "kotlin.Double",
        "Boolean": "kotlin.Boolean",
        "StringBuilder": "kotlin.text.StringBuilder",
        "kotlin.Result": "Result",
        "kotlin.text.Regex": "Regex",
    };
    return makeIndex("kotlin", {
        name: "Kotlin standard library and Java/Android interop API subset",
        languageVersion: "Kotlin 2.2.21",
        revision: "autojs6-kotlin-2.2.21-p2plus-2",
        url: "https://kotlinlang.org/api/core/kotlin-stdlib/",
        license: "Apache-2.0; API names/signatures only",
        scope: "Kotlin top-level and instance APIs plus selected Java/Android interop; paired with conservative single-file type heuristics",
    }, globals, modules, aliases);
}

function render(index) {
    const json = JSON.stringify(index, null, 2)
        .replaceAll("<", "\\u003c")
        .replaceAll("\u2028", "\\u2028")
        .replaceAll("\u2029", "\\u2029");
    return `(function(global) {\n` +
        `    "use strict";\n` +
        `    var registry = global.AutoJsAceLanguageIndices || ` +
        `(global.AutoJsAceLanguageIndices = Object.create(null));\n` +
        `    registry[${JSON.stringify(index.language)}] = ${json};\n` +
        `})(window);\n`;
}

function main() {
    const args = parseArguments(process.argv.slice(2));
    const java = javaIndex();
    const indices = {
        python: pythonIndex(),
        lua: luaIndex(),
        java,
        kotlin: kotlinIndex(java),
    };
    if (!args.check) {
        mkdirSync(args.outDir, { recursive: true });
    }
    const summary = {};
    for (const language of LANGUAGES) {
        const outputPath = resolve(args.outDir, `${language}.js`);
        const content = render(indices[language]);
        if (args.check) {
            if (!existsSync(outputPath)) {
                fail(`Generated language index is missing: ${outputPath}`);
            }
            if (readFileSync(outputPath, "utf8") !== content) {
                fail(`Generated language index is stale: ${outputPath}`);
            }
        } else {
            writeFileSync(outputPath, content, "utf8");
        }
        summary[language] = {
            bytes: Buffer.byteLength(content),
            globals: indices[language].globals.length,
            modules: Object.keys(indices[language].modules).length,
            members: Object.values(indices[language].modules)
                .reduce((count, values) => count + values.length, 0),
            revision: indices[language].source.revision,
        };
    }
    process.stdout.write(`${JSON.stringify({ mode: args.check ? "check" : "generate", summary }, null, 2)}\n`);
}

main();
