(function(global) {
    "use strict";
    var registry = global.AutoJsAceLanguageIndices || (global.AutoJsAceLanguageIndices = Object.create(null));
    registry["lua"] = {
  "schemaVersion": 1,
  "generatorVersion": 1,
  "language": "lua",
  "source": {
    "name": "Lua 5.4 Reference Manual",
    "languageVersion": "Lua 5.4.8",
    "revision": "autojs6-lua-5.4-subset-1",
    "url": "https://www.lua.org/manual/5.4/manual.html#6",
    "license": "Lua MIT license; API names/signatures only",
    "scope": "base library and standard-library tables"
  },
  "globals": [
    {
      "name": "_G",
      "type": "property",
      "signature": "_G: table",
      "doc": "Lua 5.4 symbol _G."
    },
    {
      "name": "_VERSION",
      "type": "constant",
      "signature": "_VERSION: string",
      "doc": "Lua 5.4 symbol _VERSION."
    },
    {
      "name": "assert",
      "type": "function",
      "signature": "assert(value: any, message: any = nil): any",
      "doc": "Lua 5.4 symbol assert."
    },
    {
      "name": "collectgarbage",
      "type": "function",
      "signature": "collectgarbage(option: string = 'collect', arg: any = nil): any",
      "doc": "Lua 5.4 symbol collectgarbage."
    },
    {
      "name": "coroutine",
      "type": "module",
      "signature": "coroutine: module",
      "doc": "Lua 5.4 module coroutine."
    },
    {
      "name": "debug",
      "type": "module",
      "signature": "debug: module",
      "doc": "Lua 5.4 module debug."
    },
    {
      "name": "dofile",
      "type": "function",
      "signature": "dofile(filename: string = nil): any",
      "doc": "Lua 5.4 symbol dofile."
    },
    {
      "name": "error",
      "type": "function",
      "signature": "error(message: any, level: integer = 1): nil",
      "doc": "Lua 5.4 symbol error."
    },
    {
      "name": "getmetatable",
      "type": "function",
      "signature": "getmetatable(object: any): table",
      "doc": "Lua 5.4 symbol getmetatable."
    },
    {
      "name": "io",
      "type": "module",
      "signature": "io: module",
      "doc": "Lua 5.4 module io."
    },
    {
      "name": "ipairs",
      "type": "function",
      "signature": "ipairs(t: table): function",
      "doc": "Lua 5.4 symbol ipairs."
    },
    {
      "name": "load",
      "type": "function",
      "signature": "load(chunk: string|function, chunkname: string = chunk, mode: string = 'bt', env: table = _G): function",
      "doc": "Lua 5.4 symbol load."
    },
    {
      "name": "loadfile",
      "type": "function",
      "signature": "loadfile(filename: string = nil, mode: string = 'bt', env: table = _G): function",
      "doc": "Lua 5.4 symbol loadfile."
    },
    {
      "name": "math",
      "type": "module",
      "signature": "math: module",
      "doc": "Lua 5.4 module math."
    },
    {
      "name": "next",
      "type": "function",
      "signature": "next(table: table, index: any = nil): any",
      "doc": "Lua 5.4 symbol next."
    },
    {
      "name": "os",
      "type": "module",
      "signature": "os: module",
      "doc": "Lua 5.4 module os."
    },
    {
      "name": "package",
      "type": "module",
      "signature": "package: module",
      "doc": "Lua 5.4 module package."
    },
    {
      "name": "pairs",
      "type": "function",
      "signature": "pairs(t: table): function",
      "doc": "Lua 5.4 symbol pairs."
    },
    {
      "name": "pcall",
      "type": "function",
      "signature": "pcall(f: function, *args: any): boolean",
      "doc": "Lua 5.4 symbol pcall."
    },
    {
      "name": "print",
      "type": "function",
      "signature": "print(*values: any): nil",
      "doc": "Lua 5.4 symbol print."
    },
    {
      "name": "rawequal",
      "type": "function",
      "signature": "rawequal(v1: any, v2: any): boolean",
      "doc": "Lua 5.4 symbol rawequal."
    },
    {
      "name": "rawget",
      "type": "function",
      "signature": "rawget(table: table, index: any): any",
      "doc": "Lua 5.4 symbol rawget."
    },
    {
      "name": "rawlen",
      "type": "function",
      "signature": "rawlen(value: any): integer",
      "doc": "Lua 5.4 symbol rawlen."
    },
    {
      "name": "rawset",
      "type": "function",
      "signature": "rawset(table: table, index: any, value: any): table",
      "doc": "Lua 5.4 symbol rawset."
    },
    {
      "name": "require",
      "type": "function",
      "signature": "require(modname: string): any",
      "doc": "Lua 5.4 symbol require."
    },
    {
      "name": "select",
      "type": "function",
      "signature": "select(index: any, *values: any): any",
      "doc": "Lua 5.4 symbol select."
    },
    {
      "name": "setmetatable",
      "type": "function",
      "signature": "setmetatable(table: table, metatable: table): table",
      "doc": "Lua 5.4 symbol setmetatable."
    },
    {
      "name": "string",
      "type": "module",
      "signature": "string: module",
      "doc": "Lua 5.4 module string."
    },
    {
      "name": "table",
      "type": "module",
      "signature": "table: module",
      "doc": "Lua 5.4 module table."
    },
    {
      "name": "tonumber",
      "type": "function",
      "signature": "tonumber(e: any, base: integer = 10): number",
      "doc": "Lua 5.4 symbol tonumber."
    },
    {
      "name": "tostring",
      "type": "function",
      "signature": "tostring(value: any): string",
      "doc": "Lua 5.4 symbol tostring."
    },
    {
      "name": "type",
      "type": "function",
      "signature": "type(value: any): string",
      "doc": "Lua 5.4 symbol type."
    },
    {
      "name": "utf8",
      "type": "module",
      "signature": "utf8: module",
      "doc": "Lua 5.4 module utf8."
    },
    {
      "name": "warn",
      "type": "function",
      "signature": "warn(*messages: string): nil",
      "doc": "Lua 5.4 symbol warn."
    },
    {
      "name": "xpcall",
      "type": "function",
      "signature": "xpcall(f: function, msgh: function, *args: any): boolean",
      "doc": "Lua 5.4 symbol xpcall."
    }
  ],
  "modules": {
    "coroutine": [
      {
        "name": "close",
        "type": "function",
        "signature": "coroutine.close(co: thread): boolean",
        "doc": "Lua 5.4 symbol coroutine.close."
      },
      {
        "name": "create",
        "type": "function",
        "signature": "coroutine.create(f: function): thread",
        "doc": "Lua 5.4 symbol coroutine.create."
      },
      {
        "name": "isyieldable",
        "type": "function",
        "signature": "coroutine.isyieldable(co: thread = running): boolean",
        "doc": "Lua 5.4 symbol coroutine.isyieldable."
      },
      {
        "name": "resume",
        "type": "function",
        "signature": "coroutine.resume(co: thread, *values: any): boolean",
        "doc": "Lua 5.4 symbol coroutine.resume."
      },
      {
        "name": "running",
        "type": "function",
        "signature": "coroutine.running(): thread",
        "doc": "Lua 5.4 symbol coroutine.running."
      },
      {
        "name": "status",
        "type": "function",
        "signature": "coroutine.status(co: thread): string",
        "doc": "Lua 5.4 symbol coroutine.status."
      },
      {
        "name": "wrap",
        "type": "function",
        "signature": "coroutine.wrap(f: function): function",
        "doc": "Lua 5.4 symbol coroutine.wrap."
      },
      {
        "name": "yield",
        "type": "function",
        "signature": "coroutine.yield(*values: any): any",
        "doc": "Lua 5.4 symbol coroutine.yield."
      }
    ],
    "debug": [
      {
        "name": "debug",
        "type": "function",
        "signature": "debug.debug(): nil",
        "doc": "Lua 5.4 symbol debug.debug."
      },
      {
        "name": "gethook",
        "type": "function",
        "signature": "debug.gethook(thread: thread = current): function",
        "doc": "Lua 5.4 symbol debug.gethook."
      },
      {
        "name": "getinfo",
        "type": "function",
        "signature": "debug.getinfo(thread: thread = current, f: any, what: string = 'flnSrtu'): table",
        "doc": "Lua 5.4 symbol debug.getinfo."
      },
      {
        "name": "getlocal",
        "type": "function",
        "signature": "debug.getlocal(thread: thread = current, f: any, local: integer): any",
        "doc": "Lua 5.4 symbol debug.getlocal."
      },
      {
        "name": "getmetatable",
        "type": "function",
        "signature": "debug.getmetatable(value: any): table",
        "doc": "Lua 5.4 symbol debug.getmetatable."
      },
      {
        "name": "getregistry",
        "type": "function",
        "signature": "debug.getregistry(): table",
        "doc": "Lua 5.4 symbol debug.getregistry."
      },
      {
        "name": "getupvalue",
        "type": "function",
        "signature": "debug.getupvalue(f: function, up: integer): string",
        "doc": "Lua 5.4 symbol debug.getupvalue."
      },
      {
        "name": "sethook",
        "type": "function",
        "signature": "debug.sethook(thread: thread = current, hook: function, mask: string, count: integer = 0): nil",
        "doc": "Lua 5.4 symbol debug.sethook."
      },
      {
        "name": "setlocal",
        "type": "function",
        "signature": "debug.setlocal(thread: thread = current, level: integer, local: integer, value: any): string",
        "doc": "Lua 5.4 symbol debug.setlocal."
      },
      {
        "name": "setmetatable",
        "type": "function",
        "signature": "debug.setmetatable(value: any, table: table): any",
        "doc": "Lua 5.4 symbol debug.setmetatable."
      },
      {
        "name": "traceback",
        "type": "function",
        "signature": "debug.traceback(thread: thread = current, message: any = nil, level: integer = 1): string",
        "doc": "Lua 5.4 symbol debug.traceback."
      }
    ],
    "file": [
      {
        "name": "close",
        "type": "function",
        "signature": "file.close(): boolean",
        "doc": "Lua 5.4 symbol file.close."
      },
      {
        "name": "flush",
        "type": "function",
        "signature": "file.flush(): boolean",
        "doc": "Lua 5.4 symbol file.flush."
      },
      {
        "name": "lines",
        "type": "function",
        "signature": "file.lines(*formats: string): function",
        "doc": "Lua 5.4 symbol file.lines."
      },
      {
        "name": "read",
        "type": "function",
        "signature": "file.read(*formats: string): any",
        "doc": "Lua 5.4 symbol file.read."
      },
      {
        "name": "seek",
        "type": "function",
        "signature": "file.seek(whence: string = 'cur', offset: integer = 0): integer",
        "doc": "Lua 5.4 symbol file.seek."
      },
      {
        "name": "setvbuf",
        "type": "function",
        "signature": "file.setvbuf(mode: string, size: integer = default): boolean",
        "doc": "Lua 5.4 symbol file.setvbuf."
      },
      {
        "name": "write",
        "type": "function",
        "signature": "file.write(*values: string): file",
        "doc": "Lua 5.4 symbol file.write."
      }
    ],
    "io": [
      {
        "name": "close",
        "type": "function",
        "signature": "io.close(file: file = default): boolean",
        "doc": "Lua 5.4 symbol io.close."
      },
      {
        "name": "flush",
        "type": "function",
        "signature": "io.flush(): boolean",
        "doc": "Lua 5.4 symbol io.flush."
      },
      {
        "name": "input",
        "type": "function",
        "signature": "io.input(file: file|string = default): file",
        "doc": "Lua 5.4 symbol io.input."
      },
      {
        "name": "lines",
        "type": "function",
        "signature": "io.lines(filename: string, *formats: string): function",
        "doc": "Lua 5.4 symbol io.lines."
      },
      {
        "name": "open",
        "type": "function",
        "signature": "io.open(filename: string, mode: string = 'r'): file",
        "doc": "Lua 5.4 symbol io.open."
      },
      {
        "name": "output",
        "type": "function",
        "signature": "io.output(file: file|string = default): file",
        "doc": "Lua 5.4 symbol io.output."
      },
      {
        "name": "popen",
        "type": "function",
        "signature": "io.popen(prog: string, mode: string = 'r'): file",
        "doc": "Lua 5.4 symbol io.popen."
      },
      {
        "name": "read",
        "type": "function",
        "signature": "io.read(*formats: string): any",
        "doc": "Lua 5.4 symbol io.read."
      },
      {
        "name": "stderr",
        "type": "property",
        "signature": "io.stderr: file",
        "doc": "Lua 5.4 symbol io.stderr."
      },
      {
        "name": "stdin",
        "type": "property",
        "signature": "io.stdin: file",
        "doc": "Lua 5.4 symbol io.stdin."
      },
      {
        "name": "stdout",
        "type": "property",
        "signature": "io.stdout: file",
        "doc": "Lua 5.4 symbol io.stdout."
      },
      {
        "name": "tmpfile",
        "type": "function",
        "signature": "io.tmpfile(): file",
        "doc": "Lua 5.4 symbol io.tmpfile."
      },
      {
        "name": "type",
        "type": "function",
        "signature": "io.type(obj: any): string",
        "doc": "Lua 5.4 symbol io.type."
      },
      {
        "name": "write",
        "type": "function",
        "signature": "io.write(*values: string): file",
        "doc": "Lua 5.4 symbol io.write."
      }
    ],
    "math": [
      {
        "name": "abs",
        "type": "function",
        "signature": "math.abs(x: number): number",
        "doc": "Lua 5.4 symbol math.abs."
      },
      {
        "name": "acos",
        "type": "function",
        "signature": "math.acos(x: number): number",
        "doc": "Lua 5.4 symbol math.acos."
      },
      {
        "name": "ceil",
        "type": "function",
        "signature": "math.ceil(x: number): integer",
        "doc": "Lua 5.4 symbol math.ceil."
      },
      {
        "name": "cos",
        "type": "function",
        "signature": "math.cos(x: number): number",
        "doc": "Lua 5.4 symbol math.cos."
      },
      {
        "name": "deg",
        "type": "function",
        "signature": "math.deg(x: number): number",
        "doc": "Lua 5.4 symbol math.deg."
      },
      {
        "name": "floor",
        "type": "function",
        "signature": "math.floor(x: number): integer",
        "doc": "Lua 5.4 symbol math.floor."
      },
      {
        "name": "fmod",
        "type": "function",
        "signature": "math.fmod(x: number, y: number): number",
        "doc": "Lua 5.4 symbol math.fmod."
      },
      {
        "name": "huge",
        "type": "constant",
        "signature": "math.huge: number",
        "doc": "Lua 5.4 symbol math.huge."
      },
      {
        "name": "max",
        "type": "function",
        "signature": "math.max(*values: number): number",
        "doc": "Lua 5.4 symbol math.max."
      },
      {
        "name": "maxinteger",
        "type": "constant",
        "signature": "math.maxinteger: integer",
        "doc": "Lua 5.4 symbol math.maxinteger."
      },
      {
        "name": "min",
        "type": "function",
        "signature": "math.min(*values: number): number",
        "doc": "Lua 5.4 symbol math.min."
      },
      {
        "name": "mininteger",
        "type": "constant",
        "signature": "math.mininteger: integer",
        "doc": "Lua 5.4 symbol math.mininteger."
      },
      {
        "name": "modf",
        "type": "function",
        "signature": "math.modf(x: number): integer",
        "doc": "Lua 5.4 symbol math.modf."
      },
      {
        "name": "pi",
        "type": "constant",
        "signature": "math.pi: number",
        "doc": "Lua 5.4 symbol math.pi."
      },
      {
        "name": "rad",
        "type": "function",
        "signature": "math.rad(x: number): number",
        "doc": "Lua 5.4 symbol math.rad."
      },
      {
        "name": "random",
        "type": "function",
        "signature": "math.random(m: integer = nil, n: integer = nil): number",
        "doc": "Lua 5.4 symbol math.random."
      },
      {
        "name": "randomseed",
        "type": "function",
        "signature": "math.randomseed(x: integer, y: integer = nil): nil",
        "doc": "Lua 5.4 symbol math.randomseed."
      },
      {
        "name": "sin",
        "type": "function",
        "signature": "math.sin(x: number): number",
        "doc": "Lua 5.4 symbol math.sin."
      },
      {
        "name": "sqrt",
        "type": "function",
        "signature": "math.sqrt(x: number): number",
        "doc": "Lua 5.4 symbol math.sqrt."
      },
      {
        "name": "tan",
        "type": "function",
        "signature": "math.tan(x: number): number",
        "doc": "Lua 5.4 symbol math.tan."
      },
      {
        "name": "tointeger",
        "type": "function",
        "signature": "math.tointeger(x: any): integer",
        "doc": "Lua 5.4 symbol math.tointeger."
      },
      {
        "name": "type",
        "type": "function",
        "signature": "math.type(x: number): string",
        "doc": "Lua 5.4 symbol math.type."
      }
    ],
    "metatable": [
      {
        "name": "__call",
        "type": "property",
        "signature": "metatable.__call: function",
        "doc": "Lua 5.4 symbol metatable.__call."
      },
      {
        "name": "__index",
        "type": "property",
        "signature": "metatable.__index: any",
        "doc": "Lua 5.4 symbol metatable.__index."
      },
      {
        "name": "__len",
        "type": "property",
        "signature": "metatable.__len: function",
        "doc": "Lua 5.4 symbol metatable.__len."
      },
      {
        "name": "__newindex",
        "type": "property",
        "signature": "metatable.__newindex: any",
        "doc": "Lua 5.4 symbol metatable.__newindex."
      },
      {
        "name": "__tostring",
        "type": "property",
        "signature": "metatable.__tostring: function",
        "doc": "Lua 5.4 symbol metatable.__tostring."
      }
    ],
    "os": [
      {
        "name": "clock",
        "type": "function",
        "signature": "os.clock(): number",
        "doc": "Lua 5.4 symbol os.clock."
      },
      {
        "name": "date",
        "type": "function",
        "signature": "os.date(format: string = '%c', time: integer = now): string",
        "doc": "Lua 5.4 symbol os.date."
      },
      {
        "name": "difftime",
        "type": "function",
        "signature": "os.difftime(t2: integer, t1: integer): number",
        "doc": "Lua 5.4 symbol os.difftime."
      },
      {
        "name": "execute",
        "type": "function",
        "signature": "os.execute(command: string = nil): boolean",
        "doc": "Lua 5.4 symbol os.execute."
      },
      {
        "name": "exit",
        "type": "function",
        "signature": "os.exit(code: any = true, close: boolean = false): nil",
        "doc": "Lua 5.4 symbol os.exit."
      },
      {
        "name": "getenv",
        "type": "function",
        "signature": "os.getenv(varname: string): string",
        "doc": "Lua 5.4 symbol os.getenv."
      },
      {
        "name": "remove",
        "type": "function",
        "signature": "os.remove(filename: string): boolean",
        "doc": "Lua 5.4 symbol os.remove."
      },
      {
        "name": "rename",
        "type": "function",
        "signature": "os.rename(oldname: string, newname: string): boolean",
        "doc": "Lua 5.4 symbol os.rename."
      },
      {
        "name": "setlocale",
        "type": "function",
        "signature": "os.setlocale(locale: string = nil, category: string = 'all'): string",
        "doc": "Lua 5.4 symbol os.setlocale."
      },
      {
        "name": "time",
        "type": "function",
        "signature": "os.time(table: table = nil): integer",
        "doc": "Lua 5.4 symbol os.time."
      },
      {
        "name": "tmpname",
        "type": "function",
        "signature": "os.tmpname(): string",
        "doc": "Lua 5.4 symbol os.tmpname."
      }
    ],
    "package": [
      {
        "name": "config",
        "type": "property",
        "signature": "package.config: string",
        "doc": "Lua 5.4 symbol package.config."
      },
      {
        "name": "cpath",
        "type": "property",
        "signature": "package.cpath: string",
        "doc": "Lua 5.4 symbol package.cpath."
      },
      {
        "name": "loaded",
        "type": "property",
        "signature": "package.loaded: table",
        "doc": "Lua 5.4 symbol package.loaded."
      },
      {
        "name": "loadlib",
        "type": "function",
        "signature": "package.loadlib(libname: string, funcname: string): function",
        "doc": "Lua 5.4 symbol package.loadlib."
      },
      {
        "name": "path",
        "type": "property",
        "signature": "package.path: string",
        "doc": "Lua 5.4 symbol package.path."
      },
      {
        "name": "preload",
        "type": "property",
        "signature": "package.preload: table",
        "doc": "Lua 5.4 symbol package.preload."
      },
      {
        "name": "searchers",
        "type": "property",
        "signature": "package.searchers: table",
        "doc": "Lua 5.4 symbol package.searchers."
      },
      {
        "name": "searchpath",
        "type": "function",
        "signature": "package.searchpath(name: string, path: string, sep: string = '.', rep: string = dirsep): string",
        "doc": "Lua 5.4 symbol package.searchpath."
      }
    ],
    "string": [
      {
        "name": "byte",
        "type": "function",
        "signature": "string.byte(s: string, i: integer = 1, j: integer = i): integer",
        "doc": "Lua 5.4 symbol string.byte."
      },
      {
        "name": "char",
        "type": "function",
        "signature": "string.char(*codes: integer): string",
        "doc": "Lua 5.4 symbol string.char."
      },
      {
        "name": "dump",
        "type": "function",
        "signature": "string.dump(function: function): string",
        "doc": "Lua 5.4 symbol string.dump."
      },
      {
        "name": "find",
        "type": "function",
        "signature": "string.find(s: string, pattern: string, init: integer = 1, plain: boolean = false): integer",
        "doc": "Lua 5.4 symbol string.find."
      },
      {
        "name": "format",
        "type": "function",
        "signature": "string.format(formatstring: string, *values: any): string",
        "doc": "Lua 5.4 symbol string.format."
      },
      {
        "name": "gmatch",
        "type": "function",
        "signature": "string.gmatch(s: string, pattern: string): function",
        "doc": "Lua 5.4 symbol string.gmatch."
      },
      {
        "name": "gsub",
        "type": "function",
        "signature": "string.gsub(s: string, pattern: string, repl: any, n: integer = max): string",
        "doc": "Lua 5.4 symbol string.gsub."
      },
      {
        "name": "len",
        "type": "function",
        "signature": "string.len(s: string): integer",
        "doc": "Lua 5.4 symbol string.len."
      },
      {
        "name": "lower",
        "type": "function",
        "signature": "string.lower(s: string): string",
        "doc": "Lua 5.4 symbol string.lower."
      },
      {
        "name": "match",
        "type": "function",
        "signature": "string.match(s: string, pattern: string, init: integer = 1): string",
        "doc": "Lua 5.4 symbol string.match."
      },
      {
        "name": "pack",
        "type": "function",
        "signature": "string.pack(format: string, *values: any): string",
        "doc": "Lua 5.4 symbol string.pack."
      },
      {
        "name": "rep",
        "type": "function",
        "signature": "string.rep(s: string, n: integer, sep: string = ''): string",
        "doc": "Lua 5.4 symbol string.rep."
      },
      {
        "name": "reverse",
        "type": "function",
        "signature": "string.reverse(s: string): string",
        "doc": "Lua 5.4 symbol string.reverse."
      },
      {
        "name": "sub",
        "type": "function",
        "signature": "string.sub(s: string, i: integer, j: integer = -1): string",
        "doc": "Lua 5.4 symbol string.sub."
      },
      {
        "name": "upper",
        "type": "function",
        "signature": "string.upper(s: string): string",
        "doc": "Lua 5.4 symbol string.upper."
      }
    ],
    "table": [
      {
        "name": "concat",
        "type": "function",
        "signature": "table.concat(list: table, sep: string = '', i: integer = 1, j: integer = #list): string",
        "doc": "Lua 5.4 symbol table.concat."
      },
      {
        "name": "insert",
        "type": "function",
        "signature": "table.insert(list: table, pos: integer, value: any): nil",
        "doc": "Lua 5.4 symbol table.insert."
      },
      {
        "name": "move",
        "type": "function",
        "signature": "table.move(a1: table, f: integer, e: integer, t: integer, a2: table = a1): table",
        "doc": "Lua 5.4 symbol table.move."
      },
      {
        "name": "pack",
        "type": "function",
        "signature": "table.pack(*values: any): table",
        "doc": "Lua 5.4 symbol table.pack."
      },
      {
        "name": "remove",
        "type": "function",
        "signature": "table.remove(list: table, pos: integer = #list): any",
        "doc": "Lua 5.4 symbol table.remove."
      },
      {
        "name": "sort",
        "type": "function",
        "signature": "table.sort(list: table, comp: function = nil): nil",
        "doc": "Lua 5.4 symbol table.sort."
      },
      {
        "name": "unpack",
        "type": "function",
        "signature": "table.unpack(list: table, i: integer = 1, j: integer = #list): any",
        "doc": "Lua 5.4 symbol table.unpack."
      }
    ],
    "utf8": [
      {
        "name": "char",
        "type": "function",
        "signature": "utf8.char(*codepoints: integer): string",
        "doc": "Lua 5.4 symbol utf8.char."
      },
      {
        "name": "charpattern",
        "type": "constant",
        "signature": "utf8.charpattern: string",
        "doc": "Lua 5.4 symbol utf8.charpattern."
      },
      {
        "name": "codepoint",
        "type": "function",
        "signature": "utf8.codepoint(s: string, i: integer = 1, j: integer = i): integer",
        "doc": "Lua 5.4 symbol utf8.codepoint."
      },
      {
        "name": "codes",
        "type": "function",
        "signature": "utf8.codes(s: string, lax: boolean = false): function",
        "doc": "Lua 5.4 symbol utf8.codes."
      },
      {
        "name": "len",
        "type": "function",
        "signature": "utf8.len(s: string, i: integer = 1, j: integer = -1, lax: boolean = false): integer",
        "doc": "Lua 5.4 symbol utf8.len."
      },
      {
        "name": "offset",
        "type": "function",
        "signature": "utf8.offset(s: string, n: integer, i: integer = default): integer",
        "doc": "Lua 5.4 symbol utf8.offset."
      }
    ]
  },
  "aliases": {}
};
})(window);
