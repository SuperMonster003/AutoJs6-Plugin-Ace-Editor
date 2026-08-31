(function(global) {
    "use strict";
    var registry = global.AutoJsAceLanguageIndices || (global.AutoJsAceLanguageIndices = Object.create(null));
    registry["python"] = {
  "schemaVersion": 1,
  "generatorVersion": 1,
  "language": "python",
  "source": {
    "name": "typeshed stdlib plus Python documentation",
    "languageVersion": "Python 3.12",
    "revision": "autojs6-python-3.12-subset-1",
    "upstreamRevision": "d097b16922b98d06980c4be8050b44132da76ba1",
    "url": "https://github.com/python/typeshed/tree/d097b16922b98d06980c4be8050b44132da76ba1/stdlib",
    "license": "Apache-2.0 (typeshed); PSF-2.0 (Python documentation)",
    "scope": "builtins and 34 selected standard-library module contexts; API names/signatures only"
  },
  "globals": [
    {
      "name": "abs",
      "type": "function",
      "signature": "abs(x: object): object",
      "doc": "Python 3.12/typeshed symbol abs."
    },
    {
      "name": "all",
      "type": "function",
      "signature": "all(iterable: Iterable): bool",
      "doc": "Python 3.12/typeshed symbol all."
    },
    {
      "name": "any",
      "type": "function",
      "signature": "any(iterable: Iterable): bool",
      "doc": "Python 3.12/typeshed symbol any."
    },
    {
      "name": "asyncio",
      "type": "module",
      "signature": "asyncio: module",
      "doc": "Python 3.12/typeshed module asyncio."
    },
    {
      "name": "base64",
      "type": "module",
      "signature": "base64: module",
      "doc": "Python 3.12/typeshed module base64."
    },
    {
      "name": "bin",
      "type": "function",
      "signature": "bin(x: int): str",
      "doc": "Python 3.12/typeshed symbol bin."
    },
    {
      "name": "bool",
      "type": "class",
      "signature": "bool(x: object = False): bool",
      "doc": "Python 3.12/typeshed symbol bool."
    },
    {
      "name": "bytearray",
      "type": "class",
      "signature": "bytearray(source: object = b''): bytearray",
      "doc": "Python 3.12/typeshed symbol bytearray."
    },
    {
      "name": "bytes",
      "type": "class",
      "signature": "bytes(source: object = b''): bytes",
      "doc": "Python 3.12/typeshed symbol bytes."
    },
    {
      "name": "callable",
      "type": "function",
      "signature": "callable(object: object): bool",
      "doc": "Python 3.12/typeshed symbol callable."
    },
    {
      "name": "chr",
      "type": "function",
      "signature": "chr(i: int): str",
      "doc": "Python 3.12/typeshed symbol chr."
    },
    {
      "name": "collections",
      "type": "module",
      "signature": "collections: module",
      "doc": "Python 3.12/typeshed module collections."
    },
    {
      "name": "csv",
      "type": "module",
      "signature": "csv: module",
      "doc": "Python 3.12/typeshed module csv."
    },
    {
      "name": "datetime",
      "type": "module",
      "signature": "datetime: module",
      "doc": "Python 3.12/typeshed module datetime."
    },
    {
      "name": "decimal",
      "type": "module",
      "signature": "decimal: module",
      "doc": "Python 3.12/typeshed module decimal."
    },
    {
      "name": "dict",
      "type": "class",
      "signature": "dict(**kwargs): dict",
      "doc": "Python 3.12/typeshed symbol dict."
    },
    {
      "name": "dir",
      "type": "function",
      "signature": "dir(object: object = None): list",
      "doc": "Python 3.12/typeshed symbol dir."
    },
    {
      "name": "divmod",
      "type": "function",
      "signature": "divmod(a: object, b: object): tuple",
      "doc": "Python 3.12/typeshed symbol divmod."
    },
    {
      "name": "enumerate",
      "type": "function",
      "signature": "enumerate(iterable: Iterable, start: int = 0): enumerate",
      "doc": "Python 3.12/typeshed symbol enumerate."
    },
    {
      "name": "Exception",
      "type": "class",
      "signature": "Exception: type",
      "doc": "Python 3.12/typeshed symbol Exception."
    },
    {
      "name": "filter",
      "type": "function",
      "signature": "filter(function: object, iterable: Iterable): filter",
      "doc": "Python 3.12/typeshed symbol filter."
    },
    {
      "name": "float",
      "type": "class",
      "signature": "float(x: object = 0): float",
      "doc": "Python 3.12/typeshed symbol float."
    },
    {
      "name": "fnmatch",
      "type": "module",
      "signature": "fnmatch: module",
      "doc": "Python 3.12/typeshed module fnmatch."
    },
    {
      "name": "format",
      "type": "function",
      "signature": "format(value: object, format_spec: str = ''): str",
      "doc": "Python 3.12/typeshed symbol format."
    },
    {
      "name": "frozenset",
      "type": "class",
      "signature": "frozenset(iterable: Iterable = ()): frozenset",
      "doc": "Python 3.12/typeshed symbol frozenset."
    },
    {
      "name": "functools",
      "type": "module",
      "signature": "functools: module",
      "doc": "Python 3.12/typeshed module functools."
    },
    {
      "name": "getattr",
      "type": "function",
      "signature": "getattr(object: object, name: str): object",
      "doc": "Python 3.12/typeshed symbol getattr."
    },
    {
      "name": "glob",
      "type": "module",
      "signature": "glob: module",
      "doc": "Python 3.12/typeshed module glob."
    },
    {
      "name": "globals",
      "type": "function",
      "signature": "globals(): dict",
      "doc": "Python 3.12/typeshed symbol globals."
    },
    {
      "name": "hasattr",
      "type": "function",
      "signature": "hasattr(object: object, name: str): bool",
      "doc": "Python 3.12/typeshed symbol hasattr."
    },
    {
      "name": "hash",
      "type": "function",
      "signature": "hash(object: object): int",
      "doc": "Python 3.12/typeshed symbol hash."
    },
    {
      "name": "hashlib",
      "type": "module",
      "signature": "hashlib: module",
      "doc": "Python 3.12/typeshed module hashlib."
    },
    {
      "name": "help",
      "type": "function",
      "signature": "help(request: object = None): None",
      "doc": "Python 3.12/typeshed symbol help."
    },
    {
      "name": "hex",
      "type": "function",
      "signature": "hex(x: int): str",
      "doc": "Python 3.12/typeshed symbol hex."
    },
    {
      "name": "id",
      "type": "function",
      "signature": "id(object: object): int",
      "doc": "Python 3.12/typeshed symbol id."
    },
    {
      "name": "input",
      "type": "function",
      "signature": "input(prompt: str = ''): str",
      "doc": "Python 3.12/typeshed symbol input."
    },
    {
      "name": "int",
      "type": "class",
      "signature": "int(x: object = 0): int",
      "doc": "Python 3.12/typeshed symbol int."
    },
    {
      "name": "isinstance",
      "type": "function",
      "signature": "isinstance(object: object, classinfo: object): bool",
      "doc": "Python 3.12/typeshed symbol isinstance."
    },
    {
      "name": "issubclass",
      "type": "function",
      "signature": "issubclass(cls: type, classinfo: object): bool",
      "doc": "Python 3.12/typeshed symbol issubclass."
    },
    {
      "name": "iter",
      "type": "function",
      "signature": "iter(object: object): Iterator",
      "doc": "Python 3.12/typeshed symbol iter."
    },
    {
      "name": "itertools",
      "type": "module",
      "signature": "itertools: module",
      "doc": "Python 3.12/typeshed module itertools."
    },
    {
      "name": "json",
      "type": "module",
      "signature": "json: module",
      "doc": "Python 3.12/typeshed module json."
    },
    {
      "name": "KeyError",
      "type": "class",
      "signature": "KeyError: type",
      "doc": "Python 3.12/typeshed symbol KeyError."
    },
    {
      "name": "len",
      "type": "function",
      "signature": "len(object: object): int",
      "doc": "Python 3.12/typeshed symbol len."
    },
    {
      "name": "list",
      "type": "class",
      "signature": "list(iterable: Iterable = ()): list",
      "doc": "Python 3.12/typeshed symbol list."
    },
    {
      "name": "locals",
      "type": "function",
      "signature": "locals(): dict",
      "doc": "Python 3.12/typeshed symbol locals."
    },
    {
      "name": "logging",
      "type": "module",
      "signature": "logging: module",
      "doc": "Python 3.12/typeshed module logging."
    },
    {
      "name": "map",
      "type": "function",
      "signature": "map(function: object, *iterables: Iterable): map",
      "doc": "Python 3.12/typeshed symbol map."
    },
    {
      "name": "math",
      "type": "module",
      "signature": "math: module",
      "doc": "Python 3.12/typeshed module math."
    },
    {
      "name": "max",
      "type": "function",
      "signature": "max(iterable: Iterable): object",
      "doc": "Python 3.12/typeshed symbol max."
    },
    {
      "name": "memoryview",
      "type": "class",
      "signature": "memoryview(object: object): memoryview",
      "doc": "Python 3.12/typeshed symbol memoryview."
    },
    {
      "name": "min",
      "type": "function",
      "signature": "min(iterable: Iterable): object",
      "doc": "Python 3.12/typeshed symbol min."
    },
    {
      "name": "next",
      "type": "function",
      "signature": "next(iterator: Iterator): object",
      "doc": "Python 3.12/typeshed symbol next."
    },
    {
      "name": "object",
      "type": "class",
      "signature": "object(): object",
      "doc": "Python 3.12/typeshed symbol object."
    },
    {
      "name": "oct",
      "type": "function",
      "signature": "oct(x: int): str",
      "doc": "Python 3.12/typeshed symbol oct."
    },
    {
      "name": "open",
      "type": "function",
      "signature": "open(file: object, mode: str = 'r'): IO",
      "doc": "Python 3.12/typeshed symbol open."
    },
    {
      "name": "ord",
      "type": "function",
      "signature": "ord(c: str): int",
      "doc": "Python 3.12/typeshed symbol ord."
    },
    {
      "name": "os",
      "type": "module",
      "signature": "os: module",
      "doc": "Python 3.12/typeshed module os."
    },
    {
      "name": "pathlib",
      "type": "module",
      "signature": "pathlib: module",
      "doc": "Python 3.12/typeshed module pathlib."
    },
    {
      "name": "pow",
      "type": "function",
      "signature": "pow(base: object, exp: object): object",
      "doc": "Python 3.12/typeshed symbol pow."
    },
    {
      "name": "print",
      "type": "function",
      "signature": "print(*objects: object, sep: str = ' ', end: str = '\\n'): None",
      "doc": "Python 3.12/typeshed symbol print."
    },
    {
      "name": "property",
      "type": "class",
      "signature": "property(fget: object = None): property",
      "doc": "Python 3.12/typeshed symbol property."
    },
    {
      "name": "random",
      "type": "module",
      "signature": "random: module",
      "doc": "Python 3.12/typeshed module random."
    },
    {
      "name": "range",
      "type": "class",
      "signature": "range(stop: int): range",
      "doc": "Python 3.12/typeshed symbol range."
    },
    {
      "name": "re",
      "type": "module",
      "signature": "re: module",
      "doc": "Python 3.12/typeshed module re."
    },
    {
      "name": "repr",
      "type": "function",
      "signature": "repr(object: object): str",
      "doc": "Python 3.12/typeshed symbol repr."
    },
    {
      "name": "reversed",
      "type": "function",
      "signature": "reversed(sequence: object): Iterator",
      "doc": "Python 3.12/typeshed symbol reversed."
    },
    {
      "name": "round",
      "type": "function",
      "signature": "round(number: object, ndigits: int = None): object",
      "doc": "Python 3.12/typeshed symbol round."
    },
    {
      "name": "RuntimeError",
      "type": "class",
      "signature": "RuntimeError: type",
      "doc": "Python 3.12/typeshed symbol RuntimeError."
    },
    {
      "name": "set",
      "type": "class",
      "signature": "set(iterable: Iterable = ()): set",
      "doc": "Python 3.12/typeshed symbol set."
    },
    {
      "name": "setattr",
      "type": "function",
      "signature": "setattr(object: object, name: str, value: object): None",
      "doc": "Python 3.12/typeshed symbol setattr."
    },
    {
      "name": "shutil",
      "type": "module",
      "signature": "shutil: module",
      "doc": "Python 3.12/typeshed module shutil."
    },
    {
      "name": "slice",
      "type": "class",
      "signature": "slice(stop: int): slice",
      "doc": "Python 3.12/typeshed symbol slice."
    },
    {
      "name": "socket",
      "type": "module",
      "signature": "socket: module",
      "doc": "Python 3.12/typeshed module socket."
    },
    {
      "name": "sorted",
      "type": "function",
      "signature": "sorted(iterable: Iterable, key: object = None, reverse: bool = False): list",
      "doc": "Python 3.12/typeshed symbol sorted."
    },
    {
      "name": "sqlite3",
      "type": "module",
      "signature": "sqlite3: module",
      "doc": "Python 3.12/typeshed module sqlite3."
    },
    {
      "name": "statistics",
      "type": "module",
      "signature": "statistics: module",
      "doc": "Python 3.12/typeshed module statistics."
    },
    {
      "name": "StopIteration",
      "type": "class",
      "signature": "StopIteration: type",
      "doc": "Python 3.12/typeshed symbol StopIteration."
    },
    {
      "name": "str",
      "type": "class",
      "signature": "str(object: object = ''): str",
      "doc": "Python 3.12/typeshed symbol str."
    },
    {
      "name": "subprocess",
      "type": "module",
      "signature": "subprocess: module",
      "doc": "Python 3.12/typeshed module subprocess."
    },
    {
      "name": "sum",
      "type": "function",
      "signature": "sum(iterable: Iterable, start: object = 0): object",
      "doc": "Python 3.12/typeshed symbol sum."
    },
    {
      "name": "super",
      "type": "class",
      "signature": "super(): super",
      "doc": "Python 3.12/typeshed symbol super."
    },
    {
      "name": "sys",
      "type": "module",
      "signature": "sys: module",
      "doc": "Python 3.12/typeshed module sys."
    },
    {
      "name": "tempfile",
      "type": "module",
      "signature": "tempfile: module",
      "doc": "Python 3.12/typeshed module tempfile."
    },
    {
      "name": "threading",
      "type": "module",
      "signature": "threading: module",
      "doc": "Python 3.12/typeshed module threading."
    },
    {
      "name": "time",
      "type": "module",
      "signature": "time: module",
      "doc": "Python 3.12/typeshed module time."
    },
    {
      "name": "tuple",
      "type": "class",
      "signature": "tuple(iterable: Iterable = ()): tuple",
      "doc": "Python 3.12/typeshed symbol tuple."
    },
    {
      "name": "type",
      "type": "class",
      "signature": "type(object: object): type",
      "doc": "Python 3.12/typeshed symbol type."
    },
    {
      "name": "TypeError",
      "type": "class",
      "signature": "TypeError: type",
      "doc": "Python 3.12/typeshed symbol TypeError."
    },
    {
      "name": "typing",
      "type": "module",
      "signature": "typing: module",
      "doc": "Python 3.12/typeshed module typing."
    },
    {
      "name": "ValueError",
      "type": "class",
      "signature": "ValueError: type",
      "doc": "Python 3.12/typeshed symbol ValueError."
    },
    {
      "name": "vars",
      "type": "function",
      "signature": "vars(object: object = None): dict",
      "doc": "Python 3.12/typeshed symbol vars."
    },
    {
      "name": "zip",
      "type": "function",
      "signature": "zip(*iterables: Iterable): zip",
      "doc": "Python 3.12/typeshed symbol zip."
    }
  ],
  "modules": {
    "asyncio": [
      {
        "name": "CancelledError",
        "type": "class",
        "signature": "asyncio.CancelledError: type",
        "doc": "Python 3.12/typeshed symbol asyncio.CancelledError."
      },
      {
        "name": "create_task",
        "type": "function",
        "signature": "asyncio.create_task(coro: object): Task",
        "doc": "Python 3.12/typeshed symbol asyncio.create_task."
      },
      {
        "name": "Event",
        "type": "class",
        "signature": "asyncio.Event: type",
        "doc": "Python 3.12/typeshed symbol asyncio.Event."
      },
      {
        "name": "Future",
        "type": "class",
        "signature": "asyncio.Future: type",
        "doc": "Python 3.12/typeshed symbol asyncio.Future."
      },
      {
        "name": "gather",
        "type": "function",
        "signature": "asyncio.gather(*aws: object): Future",
        "doc": "Python 3.12/typeshed symbol asyncio.gather."
      },
      {
        "name": "get_event_loop",
        "type": "function",
        "signature": "asyncio.get_event_loop(): EventLoop",
        "doc": "Python 3.12/typeshed symbol asyncio.get_event_loop."
      },
      {
        "name": "Lock",
        "type": "class",
        "signature": "asyncio.Lock: type",
        "doc": "Python 3.12/typeshed symbol asyncio.Lock."
      },
      {
        "name": "Queue",
        "type": "class",
        "signature": "asyncio.Queue: type",
        "doc": "Python 3.12/typeshed symbol asyncio.Queue."
      },
      {
        "name": "run",
        "type": "function",
        "signature": "asyncio.run(main: object): object",
        "doc": "Python 3.12/typeshed symbol asyncio.run."
      },
      {
        "name": "sleep",
        "type": "function",
        "signature": "asyncio.sleep(delay: float): Coroutine",
        "doc": "Python 3.12/typeshed symbol asyncio.sleep."
      },
      {
        "name": "Task",
        "type": "class",
        "signature": "asyncio.Task: type",
        "doc": "Python 3.12/typeshed symbol asyncio.Task."
      },
      {
        "name": "to_thread",
        "type": "function",
        "signature": "asyncio.to_thread(func: object, *args: object): Coroutine",
        "doc": "Python 3.12/typeshed symbol asyncio.to_thread."
      },
      {
        "name": "wait_for",
        "type": "function",
        "signature": "asyncio.wait_for(aw: object, timeout: float): Coroutine",
        "doc": "Python 3.12/typeshed symbol asyncio.wait_for."
      }
    ],
    "base64": [
      {
        "name": "b64decode",
        "type": "function",
        "signature": "base64.b64decode(s: object, altchars: bytes = None): bytes",
        "doc": "Python 3.12/typeshed symbol base64.b64decode."
      },
      {
        "name": "b64encode",
        "type": "function",
        "signature": "base64.b64encode(s: bytes, altchars: bytes = None): bytes",
        "doc": "Python 3.12/typeshed symbol base64.b64encode."
      },
      {
        "name": "urlsafe_b64decode",
        "type": "function",
        "signature": "base64.urlsafe_b64decode(s: object): bytes",
        "doc": "Python 3.12/typeshed symbol base64.urlsafe_b64decode."
      },
      {
        "name": "urlsafe_b64encode",
        "type": "function",
        "signature": "base64.urlsafe_b64encode(s: bytes): bytes",
        "doc": "Python 3.12/typeshed symbol base64.urlsafe_b64encode."
      }
    ],
    "collections": [
      {
        "name": "ChainMap",
        "type": "class",
        "signature": "collections.ChainMap: type",
        "doc": "Python 3.12/typeshed symbol collections.ChainMap."
      },
      {
        "name": "Counter",
        "type": "class",
        "signature": "collections.Counter: type",
        "doc": "Python 3.12/typeshed symbol collections.Counter."
      },
      {
        "name": "defaultdict",
        "type": "class",
        "signature": "collections.defaultdict: type",
        "doc": "Python 3.12/typeshed symbol collections.defaultdict."
      },
      {
        "name": "deque",
        "type": "class",
        "signature": "collections.deque: type",
        "doc": "Python 3.12/typeshed symbol collections.deque."
      },
      {
        "name": "namedtuple",
        "type": "function",
        "signature": "collections.namedtuple(typename: str, field_names: object): type",
        "doc": "Python 3.12/typeshed symbol collections.namedtuple."
      },
      {
        "name": "OrderedDict",
        "type": "class",
        "signature": "collections.OrderedDict: type",
        "doc": "Python 3.12/typeshed symbol collections.OrderedDict."
      },
      {
        "name": "UserDict",
        "type": "class",
        "signature": "collections.UserDict: type",
        "doc": "Python 3.12/typeshed symbol collections.UserDict."
      },
      {
        "name": "UserList",
        "type": "class",
        "signature": "collections.UserList: type",
        "doc": "Python 3.12/typeshed symbol collections.UserList."
      },
      {
        "name": "UserString",
        "type": "class",
        "signature": "collections.UserString: type",
        "doc": "Python 3.12/typeshed symbol collections.UserString."
      }
    ],
    "csv": [
      {
        "name": "DictReader",
        "type": "class",
        "signature": "csv.DictReader: type",
        "doc": "Python 3.12/typeshed symbol csv.DictReader."
      },
      {
        "name": "DictWriter",
        "type": "class",
        "signature": "csv.DictWriter: type",
        "doc": "Python 3.12/typeshed symbol csv.DictWriter."
      },
      {
        "name": "reader",
        "type": "function",
        "signature": "csv.reader(csvfile: Iterable, dialect: str = 'excel'): Reader",
        "doc": "Python 3.12/typeshed symbol csv.reader."
      },
      {
        "name": "writer",
        "type": "function",
        "signature": "csv.writer(csvfile: IO, dialect: str = 'excel'): Writer",
        "doc": "Python 3.12/typeshed symbol csv.writer."
      }
    ],
    "datetime": [
      {
        "name": "date",
        "type": "class",
        "signature": "datetime.date: type",
        "doc": "Python 3.12/typeshed symbol datetime.date."
      },
      {
        "name": "datetime",
        "type": "class",
        "signature": "datetime.datetime: type",
        "doc": "Python 3.12/typeshed symbol datetime.datetime."
      },
      {
        "name": "MAXYEAR",
        "type": "constant",
        "signature": "datetime.MAXYEAR: int",
        "doc": "Python 3.12/typeshed symbol datetime.MAXYEAR."
      },
      {
        "name": "MINYEAR",
        "type": "constant",
        "signature": "datetime.MINYEAR: int",
        "doc": "Python 3.12/typeshed symbol datetime.MINYEAR."
      },
      {
        "name": "time",
        "type": "class",
        "signature": "datetime.time: type",
        "doc": "Python 3.12/typeshed symbol datetime.time."
      },
      {
        "name": "timedelta",
        "type": "class",
        "signature": "datetime.timedelta: type",
        "doc": "Python 3.12/typeshed symbol datetime.timedelta."
      },
      {
        "name": "timezone",
        "type": "class",
        "signature": "datetime.timezone: type",
        "doc": "Python 3.12/typeshed symbol datetime.timezone."
      },
      {
        "name": "tzinfo",
        "type": "class",
        "signature": "datetime.tzinfo: type",
        "doc": "Python 3.12/typeshed symbol datetime.tzinfo."
      }
    ],
    "datetime.date": [
      {
        "name": "fromisoformat",
        "type": "function",
        "signature": "datetime.date.fromisoformat(date_string: str): date",
        "doc": "Python 3.12/typeshed symbol datetime.date.fromisoformat."
      },
      {
        "name": "isoformat",
        "type": "function",
        "signature": "datetime.date.isoformat(): str",
        "doc": "Python 3.12/typeshed symbol datetime.date.isoformat."
      },
      {
        "name": "replace",
        "type": "function",
        "signature": "datetime.date.replace(**kwargs): date",
        "doc": "Python 3.12/typeshed symbol datetime.date.replace."
      },
      {
        "name": "today",
        "type": "function",
        "signature": "datetime.date.today(): date",
        "doc": "Python 3.12/typeshed symbol datetime.date.today."
      },
      {
        "name": "weekday",
        "type": "function",
        "signature": "datetime.date.weekday(): int",
        "doc": "Python 3.12/typeshed symbol datetime.date.weekday."
      }
    ],
    "datetime.datetime": [
      {
        "name": "astimezone",
        "type": "function",
        "signature": "datetime.datetime.astimezone(tz: tzinfo = None): datetime",
        "doc": "Python 3.12/typeshed symbol datetime.datetime.astimezone."
      },
      {
        "name": "combine",
        "type": "function",
        "signature": "datetime.datetime.combine(date: date, time: time): datetime",
        "doc": "Python 3.12/typeshed symbol datetime.datetime.combine."
      },
      {
        "name": "fromisoformat",
        "type": "function",
        "signature": "datetime.datetime.fromisoformat(date_string: str): datetime",
        "doc": "Python 3.12/typeshed symbol datetime.datetime.fromisoformat."
      },
      {
        "name": "isoformat",
        "type": "function",
        "signature": "datetime.datetime.isoformat(sep: str = 'T'): str",
        "doc": "Python 3.12/typeshed symbol datetime.datetime.isoformat."
      },
      {
        "name": "now",
        "type": "function",
        "signature": "datetime.datetime.now(tz: tzinfo = None): datetime",
        "doc": "Python 3.12/typeshed symbol datetime.datetime.now."
      },
      {
        "name": "replace",
        "type": "function",
        "signature": "datetime.datetime.replace(**kwargs): datetime",
        "doc": "Python 3.12/typeshed symbol datetime.datetime.replace."
      },
      {
        "name": "strptime",
        "type": "function",
        "signature": "datetime.datetime.strptime(date_string: str, format: str): datetime",
        "doc": "Python 3.12/typeshed symbol datetime.datetime.strptime."
      },
      {
        "name": "timestamp",
        "type": "function",
        "signature": "datetime.datetime.timestamp(): float",
        "doc": "Python 3.12/typeshed symbol datetime.datetime.timestamp."
      },
      {
        "name": "today",
        "type": "function",
        "signature": "datetime.datetime.today(): datetime",
        "doc": "Python 3.12/typeshed symbol datetime.datetime.today."
      },
      {
        "name": "utcnow",
        "type": "function",
        "signature": "datetime.datetime.utcnow(): datetime",
        "doc": "Python 3.12/typeshed symbol datetime.datetime.utcnow."
      }
    ],
    "decimal": [
      {
        "name": "BasicContext",
        "type": "property",
        "signature": "decimal.BasicContext: Context",
        "doc": "Python 3.12/typeshed symbol decimal.BasicContext."
      },
      {
        "name": "Context",
        "type": "class",
        "signature": "decimal.Context: type",
        "doc": "Python 3.12/typeshed symbol decimal.Context."
      },
      {
        "name": "Decimal",
        "type": "class",
        "signature": "decimal.Decimal: type",
        "doc": "Python 3.12/typeshed symbol decimal.Decimal."
      },
      {
        "name": "DecimalException",
        "type": "class",
        "signature": "decimal.DecimalException: type",
        "doc": "Python 3.12/typeshed symbol decimal.DecimalException."
      },
      {
        "name": "DefaultContext",
        "type": "property",
        "signature": "decimal.DefaultContext: Context",
        "doc": "Python 3.12/typeshed symbol decimal.DefaultContext."
      },
      {
        "name": "ExtendedContext",
        "type": "property",
        "signature": "decimal.ExtendedContext: Context",
        "doc": "Python 3.12/typeshed symbol decimal.ExtendedContext."
      },
      {
        "name": "getcontext",
        "type": "function",
        "signature": "decimal.getcontext(): Context",
        "doc": "Python 3.12/typeshed symbol decimal.getcontext."
      },
      {
        "name": "localcontext",
        "type": "function",
        "signature": "decimal.localcontext(ctx: Context = None): Context",
        "doc": "Python 3.12/typeshed symbol decimal.localcontext."
      },
      {
        "name": "setcontext",
        "type": "function",
        "signature": "decimal.setcontext(context: Context): None",
        "doc": "Python 3.12/typeshed symbol decimal.setcontext."
      }
    ],
    "fnmatch": [
      {
        "name": "filter",
        "type": "function",
        "signature": "fnmatch.filter(names: Iterable, pat: str): list",
        "doc": "Python 3.12/typeshed symbol fnmatch.filter."
      },
      {
        "name": "fnmatch",
        "type": "function",
        "signature": "fnmatch.fnmatch(name: str, pat: str): bool",
        "doc": "Python 3.12/typeshed symbol fnmatch.fnmatch."
      },
      {
        "name": "fnmatchcase",
        "type": "function",
        "signature": "fnmatch.fnmatchcase(name: str, pat: str): bool",
        "doc": "Python 3.12/typeshed symbol fnmatch.fnmatchcase."
      },
      {
        "name": "translate",
        "type": "function",
        "signature": "fnmatch.translate(pat: str): str",
        "doc": "Python 3.12/typeshed symbol fnmatch.translate."
      }
    ],
    "functools": [
      {
        "name": "cache",
        "type": "function",
        "signature": "functools.cache(user_function: object): object",
        "doc": "Python 3.12/typeshed symbol functools.cache."
      },
      {
        "name": "cached_property",
        "type": "function",
        "signature": "functools.cached_property(func: object): object",
        "doc": "Python 3.12/typeshed symbol functools.cached_property."
      },
      {
        "name": "cmp_to_key",
        "type": "function",
        "signature": "functools.cmp_to_key(mycmp: object): object",
        "doc": "Python 3.12/typeshed symbol functools.cmp_to_key."
      },
      {
        "name": "lru_cache",
        "type": "function",
        "signature": "functools.lru_cache(maxsize: int = 128): object",
        "doc": "Python 3.12/typeshed symbol functools.lru_cache."
      },
      {
        "name": "partial",
        "type": "function",
        "signature": "functools.partial(func: object, *args: object): object",
        "doc": "Python 3.12/typeshed symbol functools.partial."
      },
      {
        "name": "reduce",
        "type": "function",
        "signature": "functools.reduce(function: object, iterable: Iterable): object",
        "doc": "Python 3.12/typeshed symbol functools.reduce."
      },
      {
        "name": "singledispatch",
        "type": "function",
        "signature": "functools.singledispatch(func: object): object",
        "doc": "Python 3.12/typeshed symbol functools.singledispatch."
      },
      {
        "name": "total_ordering",
        "type": "function",
        "signature": "functools.total_ordering(cls: type): type",
        "doc": "Python 3.12/typeshed symbol functools.total_ordering."
      },
      {
        "name": "wraps",
        "type": "function",
        "signature": "functools.wraps(wrapped: object): object",
        "doc": "Python 3.12/typeshed symbol functools.wraps."
      }
    ],
    "glob": [
      {
        "name": "escape",
        "type": "function",
        "signature": "glob.escape(pathname: str): str",
        "doc": "Python 3.12/typeshed symbol glob.escape."
      },
      {
        "name": "glob",
        "type": "function",
        "signature": "glob.glob(pathname: str, recursive: bool = False): list",
        "doc": "Python 3.12/typeshed symbol glob.glob."
      },
      {
        "name": "iglob",
        "type": "function",
        "signature": "glob.iglob(pathname: str, recursive: bool = False): Iterator",
        "doc": "Python 3.12/typeshed symbol glob.iglob."
      }
    ],
    "hashlib": [
      {
        "name": "algorithms_available",
        "type": "property",
        "signature": "hashlib.algorithms_available: set",
        "doc": "Python 3.12/typeshed symbol hashlib.algorithms_available."
      },
      {
        "name": "algorithms_guaranteed",
        "type": "property",
        "signature": "hashlib.algorithms_guaranteed: set",
        "doc": "Python 3.12/typeshed symbol hashlib.algorithms_guaranteed."
      },
      {
        "name": "blake2b",
        "type": "function",
        "signature": "hashlib.blake2b(data: bytes = b''): Hash",
        "doc": "Python 3.12/typeshed symbol hashlib.blake2b."
      },
      {
        "name": "md5",
        "type": "function",
        "signature": "hashlib.md5(data: bytes = b''): Hash",
        "doc": "Python 3.12/typeshed symbol hashlib.md5."
      },
      {
        "name": "new",
        "type": "function",
        "signature": "hashlib.new(name: str, data: bytes = b''): Hash",
        "doc": "Python 3.12/typeshed symbol hashlib.new."
      },
      {
        "name": "sha1",
        "type": "function",
        "signature": "hashlib.sha1(data: bytes = b''): Hash",
        "doc": "Python 3.12/typeshed symbol hashlib.sha1."
      },
      {
        "name": "sha256",
        "type": "function",
        "signature": "hashlib.sha256(data: bytes = b''): Hash",
        "doc": "Python 3.12/typeshed symbol hashlib.sha256."
      },
      {
        "name": "sha512",
        "type": "function",
        "signature": "hashlib.sha512(data: bytes = b''): Hash",
        "doc": "Python 3.12/typeshed symbol hashlib.sha512."
      }
    ],
    "http.client": [
      {
        "name": "HTTPConnection",
        "type": "class",
        "signature": "http.client.HTTPConnection: type",
        "doc": "Python 3.12/typeshed symbol http.client.HTTPConnection."
      },
      {
        "name": "HTTPException",
        "type": "class",
        "signature": "http.client.HTTPException: type",
        "doc": "Python 3.12/typeshed symbol http.client.HTTPException."
      },
      {
        "name": "HTTPResponse",
        "type": "class",
        "signature": "http.client.HTTPResponse: type",
        "doc": "Python 3.12/typeshed symbol http.client.HTTPResponse."
      },
      {
        "name": "HTTPSConnection",
        "type": "class",
        "signature": "http.client.HTTPSConnection: type",
        "doc": "Python 3.12/typeshed symbol http.client.HTTPSConnection."
      },
      {
        "name": "NOT_FOUND",
        "type": "constant",
        "signature": "http.client.NOT_FOUND: int",
        "doc": "Python 3.12/typeshed symbol http.client.NOT_FOUND."
      },
      {
        "name": "OK",
        "type": "constant",
        "signature": "http.client.OK: int",
        "doc": "Python 3.12/typeshed symbol http.client.OK."
      },
      {
        "name": "responses",
        "type": "property",
        "signature": "http.client.responses: dict",
        "doc": "Python 3.12/typeshed symbol http.client.responses."
      }
    ],
    "itertools": [
      {
        "name": "accumulate",
        "type": "function",
        "signature": "itertools.accumulate(iterable: Iterable, func: object = None): Iterator",
        "doc": "Python 3.12/typeshed symbol itertools.accumulate."
      },
      {
        "name": "chain",
        "type": "function",
        "signature": "itertools.chain(*iterables: Iterable): Iterator",
        "doc": "Python 3.12/typeshed symbol itertools.chain."
      },
      {
        "name": "combinations",
        "type": "function",
        "signature": "itertools.combinations(iterable: Iterable, r: int): Iterator",
        "doc": "Python 3.12/typeshed symbol itertools.combinations."
      },
      {
        "name": "count",
        "type": "function",
        "signature": "itertools.count(start: int = 0, step: int = 1): Iterator",
        "doc": "Python 3.12/typeshed symbol itertools.count."
      },
      {
        "name": "cycle",
        "type": "function",
        "signature": "itertools.cycle(iterable: Iterable): Iterator",
        "doc": "Python 3.12/typeshed symbol itertools.cycle."
      },
      {
        "name": "groupby",
        "type": "function",
        "signature": "itertools.groupby(iterable: Iterable, key: object = None): Iterator",
        "doc": "Python 3.12/typeshed symbol itertools.groupby."
      },
      {
        "name": "islice",
        "type": "function",
        "signature": "itertools.islice(iterable: Iterable, stop: int): Iterator",
        "doc": "Python 3.12/typeshed symbol itertools.islice."
      },
      {
        "name": "permutations",
        "type": "function",
        "signature": "itertools.permutations(iterable: Iterable, r: int = None): Iterator",
        "doc": "Python 3.12/typeshed symbol itertools.permutations."
      },
      {
        "name": "product",
        "type": "function",
        "signature": "itertools.product(*iterables: Iterable): Iterator",
        "doc": "Python 3.12/typeshed symbol itertools.product."
      },
      {
        "name": "repeat",
        "type": "function",
        "signature": "itertools.repeat(object: object, times: int = None): Iterator",
        "doc": "Python 3.12/typeshed symbol itertools.repeat."
      },
      {
        "name": "starmap",
        "type": "function",
        "signature": "itertools.starmap(function: object, iterable: Iterable): Iterator",
        "doc": "Python 3.12/typeshed symbol itertools.starmap."
      },
      {
        "name": "zip_longest",
        "type": "function",
        "signature": "itertools.zip_longest(*iterables: Iterable): Iterator",
        "doc": "Python 3.12/typeshed symbol itertools.zip_longest."
      }
    ],
    "json": [
      {
        "name": "dump",
        "type": "function",
        "signature": "json.dump(obj: object, fp: IO, **kwargs): None",
        "doc": "Python 3.12/typeshed symbol json.dump."
      },
      {
        "name": "dumps",
        "type": "function",
        "signature": "json.dumps(obj: object, **kwargs): str",
        "doc": "Python 3.12/typeshed symbol json.dumps."
      },
      {
        "name": "JSONDecodeError",
        "type": "class",
        "signature": "json.JSONDecodeError: type",
        "doc": "Python 3.12/typeshed symbol json.JSONDecodeError."
      },
      {
        "name": "JSONDecoder",
        "type": "class",
        "signature": "json.JSONDecoder: type",
        "doc": "Python 3.12/typeshed symbol json.JSONDecoder."
      },
      {
        "name": "JSONEncoder",
        "type": "class",
        "signature": "json.JSONEncoder: type",
        "doc": "Python 3.12/typeshed symbol json.JSONEncoder."
      },
      {
        "name": "load",
        "type": "function",
        "signature": "json.load(fp: IO, **kwargs): object",
        "doc": "Python 3.12/typeshed symbol json.load."
      },
      {
        "name": "loads",
        "type": "function",
        "signature": "json.loads(s: str, **kwargs): object",
        "doc": "Python 3.12/typeshed symbol json.loads."
      }
    ],
    "logging": [
      {
        "name": "basicConfig",
        "type": "function",
        "signature": "logging.basicConfig(**kwargs): None",
        "doc": "Python 3.12/typeshed symbol logging.basicConfig."
      },
      {
        "name": "CRITICAL",
        "type": "constant",
        "signature": "logging.CRITICAL: int",
        "doc": "Python 3.12/typeshed symbol logging.CRITICAL."
      },
      {
        "name": "debug",
        "type": "function",
        "signature": "logging.debug(msg: object, *args: object): None",
        "doc": "Python 3.12/typeshed symbol logging.debug."
      },
      {
        "name": "DEBUG",
        "type": "constant",
        "signature": "logging.DEBUG: int",
        "doc": "Python 3.12/typeshed symbol logging.DEBUG."
      },
      {
        "name": "error",
        "type": "function",
        "signature": "logging.error(msg: object, *args: object): None",
        "doc": "Python 3.12/typeshed symbol logging.error."
      },
      {
        "name": "ERROR",
        "type": "constant",
        "signature": "logging.ERROR: int",
        "doc": "Python 3.12/typeshed symbol logging.ERROR."
      },
      {
        "name": "exception",
        "type": "function",
        "signature": "logging.exception(msg: object, *args: object): None",
        "doc": "Python 3.12/typeshed symbol logging.exception."
      },
      {
        "name": "getLogger",
        "type": "function",
        "signature": "logging.getLogger(name: str = None): Logger",
        "doc": "Python 3.12/typeshed symbol logging.getLogger."
      },
      {
        "name": "info",
        "type": "function",
        "signature": "logging.info(msg: object, *args: object): None",
        "doc": "Python 3.12/typeshed symbol logging.info."
      },
      {
        "name": "INFO",
        "type": "constant",
        "signature": "logging.INFO: int",
        "doc": "Python 3.12/typeshed symbol logging.INFO."
      },
      {
        "name": "Logger",
        "type": "class",
        "signature": "logging.Logger: type",
        "doc": "Python 3.12/typeshed symbol logging.Logger."
      },
      {
        "name": "warning",
        "type": "function",
        "signature": "logging.warning(msg: object, *args: object): None",
        "doc": "Python 3.12/typeshed symbol logging.warning."
      },
      {
        "name": "WARNING",
        "type": "constant",
        "signature": "logging.WARNING: int",
        "doc": "Python 3.12/typeshed symbol logging.WARNING."
      }
    ],
    "math": [
      {
        "name": "ceil",
        "type": "function",
        "signature": "math.ceil(x: float): int",
        "doc": "Python 3.12/typeshed symbol math.ceil."
      },
      {
        "name": "comb",
        "type": "function",
        "signature": "math.comb(n: int, k: int): int",
        "doc": "Python 3.12/typeshed symbol math.comb."
      },
      {
        "name": "cos",
        "type": "function",
        "signature": "math.cos(x: float): float",
        "doc": "Python 3.12/typeshed symbol math.cos."
      },
      {
        "name": "e",
        "type": "constant",
        "signature": "math.e: float",
        "doc": "Python 3.12/typeshed symbol math.e."
      },
      {
        "name": "exp",
        "type": "function",
        "signature": "math.exp(x: float): float",
        "doc": "Python 3.12/typeshed symbol math.exp."
      },
      {
        "name": "factorial",
        "type": "function",
        "signature": "math.factorial(n: int): int",
        "doc": "Python 3.12/typeshed symbol math.factorial."
      },
      {
        "name": "floor",
        "type": "function",
        "signature": "math.floor(x: float): int",
        "doc": "Python 3.12/typeshed symbol math.floor."
      },
      {
        "name": "gcd",
        "type": "function",
        "signature": "math.gcd(*integers: int): int",
        "doc": "Python 3.12/typeshed symbol math.gcd."
      },
      {
        "name": "hypot",
        "type": "function",
        "signature": "math.hypot(*coordinates: float): float",
        "doc": "Python 3.12/typeshed symbol math.hypot."
      },
      {
        "name": "isclose",
        "type": "function",
        "signature": "math.isclose(a: float, b: float): bool",
        "doc": "Python 3.12/typeshed symbol math.isclose."
      },
      {
        "name": "isfinite",
        "type": "function",
        "signature": "math.isfinite(x: float): bool",
        "doc": "Python 3.12/typeshed symbol math.isfinite."
      },
      {
        "name": "log",
        "type": "function",
        "signature": "math.log(x: float, base: float = None): float",
        "doc": "Python 3.12/typeshed symbol math.log."
      },
      {
        "name": "pi",
        "type": "constant",
        "signature": "math.pi: float",
        "doc": "Python 3.12/typeshed symbol math.pi."
      },
      {
        "name": "pow",
        "type": "function",
        "signature": "math.pow(x: float, y: float): float",
        "doc": "Python 3.12/typeshed symbol math.pow."
      },
      {
        "name": "sin",
        "type": "function",
        "signature": "math.sin(x: float): float",
        "doc": "Python 3.12/typeshed symbol math.sin."
      },
      {
        "name": "sqrt",
        "type": "function",
        "signature": "math.sqrt(x: float): float",
        "doc": "Python 3.12/typeshed symbol math.sqrt."
      },
      {
        "name": "tau",
        "type": "constant",
        "signature": "math.tau: float",
        "doc": "Python 3.12/typeshed symbol math.tau."
      }
    ],
    "os": [
      {
        "name": "chdir",
        "type": "function",
        "signature": "os.chdir(path: str): None",
        "doc": "Python 3.12/typeshed symbol os.chdir."
      },
      {
        "name": "environ",
        "type": "property",
        "signature": "os.environ: dict",
        "doc": "Python 3.12/typeshed symbol os.environ."
      },
      {
        "name": "getcwd",
        "type": "function",
        "signature": "os.getcwd(): str",
        "doc": "Python 3.12/typeshed symbol os.getcwd."
      },
      {
        "name": "getenv",
        "type": "function",
        "signature": "os.getenv(key: str, default: str = None): str",
        "doc": "Python 3.12/typeshed symbol os.getenv."
      },
      {
        "name": "listdir",
        "type": "function",
        "signature": "os.listdir(path: str = '.'): list",
        "doc": "Python 3.12/typeshed symbol os.listdir."
      },
      {
        "name": "makedirs",
        "type": "function",
        "signature": "os.makedirs(name: str, exist_ok: bool = False): None",
        "doc": "Python 3.12/typeshed symbol os.makedirs."
      },
      {
        "name": "mkdir",
        "type": "function",
        "signature": "os.mkdir(path: str): None",
        "doc": "Python 3.12/typeshed symbol os.mkdir."
      },
      {
        "name": "path",
        "type": "module",
        "signature": "os.path: module",
        "doc": "Python 3.12/typeshed symbol os.path."
      },
      {
        "name": "remove",
        "type": "function",
        "signature": "os.remove(path: str): None",
        "doc": "Python 3.12/typeshed symbol os.remove."
      },
      {
        "name": "rename",
        "type": "function",
        "signature": "os.rename(src: str, dst: str): None",
        "doc": "Python 3.12/typeshed symbol os.rename."
      },
      {
        "name": "rmdir",
        "type": "function",
        "signature": "os.rmdir(path: str): None",
        "doc": "Python 3.12/typeshed symbol os.rmdir."
      },
      {
        "name": "scandir",
        "type": "function",
        "signature": "os.scandir(path: str = '.'): Iterator",
        "doc": "Python 3.12/typeshed symbol os.scandir."
      },
      {
        "name": "stat",
        "type": "function",
        "signature": "os.stat(path: str): stat_result",
        "doc": "Python 3.12/typeshed symbol os.stat."
      },
      {
        "name": "walk",
        "type": "function",
        "signature": "os.walk(top: str): Iterator",
        "doc": "Python 3.12/typeshed symbol os.walk."
      }
    ],
    "os.path": [
      {
        "name": "abspath",
        "type": "function",
        "signature": "os.path.abspath(path: str): str",
        "doc": "Python 3.12/typeshed symbol os.path.abspath."
      },
      {
        "name": "basename",
        "type": "function",
        "signature": "os.path.basename(path: str): str",
        "doc": "Python 3.12/typeshed symbol os.path.basename."
      },
      {
        "name": "commonpath",
        "type": "function",
        "signature": "os.path.commonpath(paths: Iterable): str",
        "doc": "Python 3.12/typeshed symbol os.path.commonpath."
      },
      {
        "name": "dirname",
        "type": "function",
        "signature": "os.path.dirname(path: str): str",
        "doc": "Python 3.12/typeshed symbol os.path.dirname."
      },
      {
        "name": "exists",
        "type": "function",
        "signature": "os.path.exists(path: str): bool",
        "doc": "Python 3.12/typeshed symbol os.path.exists."
      },
      {
        "name": "expanduser",
        "type": "function",
        "signature": "os.path.expanduser(path: str): str",
        "doc": "Python 3.12/typeshed symbol os.path.expanduser."
      },
      {
        "name": "getsize",
        "type": "function",
        "signature": "os.path.getsize(path: str): int",
        "doc": "Python 3.12/typeshed symbol os.path.getsize."
      },
      {
        "name": "isabs",
        "type": "function",
        "signature": "os.path.isabs(path: str): bool",
        "doc": "Python 3.12/typeshed symbol os.path.isabs."
      },
      {
        "name": "isdir",
        "type": "function",
        "signature": "os.path.isdir(path: str): bool",
        "doc": "Python 3.12/typeshed symbol os.path.isdir."
      },
      {
        "name": "isfile",
        "type": "function",
        "signature": "os.path.isfile(path: str): bool",
        "doc": "Python 3.12/typeshed symbol os.path.isfile."
      },
      {
        "name": "join",
        "type": "function",
        "signature": "os.path.join(path: str, *paths: str): str",
        "doc": "Python 3.12/typeshed symbol os.path.join."
      },
      {
        "name": "normpath",
        "type": "function",
        "signature": "os.path.normpath(path: str): str",
        "doc": "Python 3.12/typeshed symbol os.path.normpath."
      },
      {
        "name": "realpath",
        "type": "function",
        "signature": "os.path.realpath(path: str): str",
        "doc": "Python 3.12/typeshed symbol os.path.realpath."
      },
      {
        "name": "relpath",
        "type": "function",
        "signature": "os.path.relpath(path: str, start: str = '.'): str",
        "doc": "Python 3.12/typeshed symbol os.path.relpath."
      },
      {
        "name": "split",
        "type": "function",
        "signature": "os.path.split(path: str): tuple",
        "doc": "Python 3.12/typeshed symbol os.path.split."
      },
      {
        "name": "splitext",
        "type": "function",
        "signature": "os.path.splitext(path: str): tuple",
        "doc": "Python 3.12/typeshed symbol os.path.splitext."
      }
    ],
    "pathlib": [
      {
        "name": "Path",
        "type": "class",
        "signature": "pathlib.Path: type",
        "doc": "Python 3.12/typeshed symbol pathlib.Path."
      },
      {
        "name": "PosixPath",
        "type": "class",
        "signature": "pathlib.PosixPath: type",
        "doc": "Python 3.12/typeshed symbol pathlib.PosixPath."
      },
      {
        "name": "PurePath",
        "type": "class",
        "signature": "pathlib.PurePath: type",
        "doc": "Python 3.12/typeshed symbol pathlib.PurePath."
      },
      {
        "name": "WindowsPath",
        "type": "class",
        "signature": "pathlib.WindowsPath: type",
        "doc": "Python 3.12/typeshed symbol pathlib.WindowsPath."
      }
    ],
    "pathlib.Path": [
      {
        "name": "absolute",
        "type": "function",
        "signature": "pathlib.Path.absolute(): Path",
        "doc": "Python 3.12/typeshed symbol pathlib.Path.absolute."
      },
      {
        "name": "chmod",
        "type": "function",
        "signature": "pathlib.Path.chmod(mode: int): None",
        "doc": "Python 3.12/typeshed symbol pathlib.Path.chmod."
      },
      {
        "name": "cwd",
        "type": "function",
        "signature": "pathlib.Path.cwd(): Path",
        "doc": "Python 3.12/typeshed symbol pathlib.Path.cwd."
      },
      {
        "name": "exists",
        "type": "function",
        "signature": "pathlib.Path.exists(): bool",
        "doc": "Python 3.12/typeshed symbol pathlib.Path.exists."
      },
      {
        "name": "glob",
        "type": "function",
        "signature": "pathlib.Path.glob(pattern: str): Iterator",
        "doc": "Python 3.12/typeshed symbol pathlib.Path.glob."
      },
      {
        "name": "home",
        "type": "function",
        "signature": "pathlib.Path.home(): Path",
        "doc": "Python 3.12/typeshed symbol pathlib.Path.home."
      },
      {
        "name": "is_dir",
        "type": "function",
        "signature": "pathlib.Path.is_dir(): bool",
        "doc": "Python 3.12/typeshed symbol pathlib.Path.is_dir."
      },
      {
        "name": "is_file",
        "type": "function",
        "signature": "pathlib.Path.is_file(): bool",
        "doc": "Python 3.12/typeshed symbol pathlib.Path.is_file."
      },
      {
        "name": "iterdir",
        "type": "function",
        "signature": "pathlib.Path.iterdir(): Iterator",
        "doc": "Python 3.12/typeshed symbol pathlib.Path.iterdir."
      },
      {
        "name": "mkdir",
        "type": "function",
        "signature": "pathlib.Path.mkdir(parents: bool = False, exist_ok: bool = False): None",
        "doc": "Python 3.12/typeshed symbol pathlib.Path.mkdir."
      },
      {
        "name": "name",
        "type": "property",
        "signature": "pathlib.Path.name: str",
        "doc": "Python 3.12/typeshed symbol pathlib.Path.name."
      },
      {
        "name": "open",
        "type": "function",
        "signature": "pathlib.Path.open(mode: str = 'r'): IO",
        "doc": "Python 3.12/typeshed symbol pathlib.Path.open."
      },
      {
        "name": "parent",
        "type": "property",
        "signature": "pathlib.Path.parent: Path",
        "doc": "Python 3.12/typeshed symbol pathlib.Path.parent."
      },
      {
        "name": "read_bytes",
        "type": "function",
        "signature": "pathlib.Path.read_bytes(): bytes",
        "doc": "Python 3.12/typeshed symbol pathlib.Path.read_bytes."
      },
      {
        "name": "read_text",
        "type": "function",
        "signature": "pathlib.Path.read_text(encoding: str = None): str",
        "doc": "Python 3.12/typeshed symbol pathlib.Path.read_text."
      },
      {
        "name": "rename",
        "type": "function",
        "signature": "pathlib.Path.rename(target: str): Path",
        "doc": "Python 3.12/typeshed symbol pathlib.Path.rename."
      },
      {
        "name": "resolve",
        "type": "function",
        "signature": "pathlib.Path.resolve(): Path",
        "doc": "Python 3.12/typeshed symbol pathlib.Path.resolve."
      },
      {
        "name": "rglob",
        "type": "function",
        "signature": "pathlib.Path.rglob(pattern: str): Iterator",
        "doc": "Python 3.12/typeshed symbol pathlib.Path.rglob."
      },
      {
        "name": "stem",
        "type": "property",
        "signature": "pathlib.Path.stem: str",
        "doc": "Python 3.12/typeshed symbol pathlib.Path.stem."
      },
      {
        "name": "suffix",
        "type": "property",
        "signature": "pathlib.Path.suffix: str",
        "doc": "Python 3.12/typeshed symbol pathlib.Path.suffix."
      },
      {
        "name": "touch",
        "type": "function",
        "signature": "pathlib.Path.touch(exist_ok: bool = True): None",
        "doc": "Python 3.12/typeshed symbol pathlib.Path.touch."
      },
      {
        "name": "unlink",
        "type": "function",
        "signature": "pathlib.Path.unlink(missing_ok: bool = False): None",
        "doc": "Python 3.12/typeshed symbol pathlib.Path.unlink."
      },
      {
        "name": "write_bytes",
        "type": "function",
        "signature": "pathlib.Path.write_bytes(data: bytes): int",
        "doc": "Python 3.12/typeshed symbol pathlib.Path.write_bytes."
      },
      {
        "name": "write_text",
        "type": "function",
        "signature": "pathlib.Path.write_text(data: str): int",
        "doc": "Python 3.12/typeshed symbol pathlib.Path.write_text."
      }
    ],
    "random": [
      {
        "name": "choice",
        "type": "function",
        "signature": "random.choice(seq: Sequence): object",
        "doc": "Python 3.12/typeshed symbol random.choice."
      },
      {
        "name": "choices",
        "type": "function",
        "signature": "random.choices(population: Sequence, k: int = 1): list",
        "doc": "Python 3.12/typeshed symbol random.choices."
      },
      {
        "name": "getrandbits",
        "type": "function",
        "signature": "random.getrandbits(k: int): int",
        "doc": "Python 3.12/typeshed symbol random.getrandbits."
      },
      {
        "name": "randint",
        "type": "function",
        "signature": "random.randint(a: int, b: int): int",
        "doc": "Python 3.12/typeshed symbol random.randint."
      },
      {
        "name": "random",
        "type": "function",
        "signature": "random.random(): float",
        "doc": "Python 3.12/typeshed symbol random.random."
      },
      {
        "name": "randrange",
        "type": "function",
        "signature": "random.randrange(start: int, stop: int = None, step: int = 1): int",
        "doc": "Python 3.12/typeshed symbol random.randrange."
      },
      {
        "name": "sample",
        "type": "function",
        "signature": "random.sample(population: Sequence, k: int): list",
        "doc": "Python 3.12/typeshed symbol random.sample."
      },
      {
        "name": "seed",
        "type": "function",
        "signature": "random.seed(a: object = None): None",
        "doc": "Python 3.12/typeshed symbol random.seed."
      },
      {
        "name": "shuffle",
        "type": "function",
        "signature": "random.shuffle(x: list): None",
        "doc": "Python 3.12/typeshed symbol random.shuffle."
      },
      {
        "name": "uniform",
        "type": "function",
        "signature": "random.uniform(a: float, b: float): float",
        "doc": "Python 3.12/typeshed symbol random.uniform."
      }
    ],
    "re": [
      {
        "name": "compile",
        "type": "function",
        "signature": "re.compile(pattern: str, flags: int = 0): Pattern",
        "doc": "Python 3.12/typeshed symbol re.compile."
      },
      {
        "name": "escape",
        "type": "function",
        "signature": "re.escape(pattern: str): str",
        "doc": "Python 3.12/typeshed symbol re.escape."
      },
      {
        "name": "findall",
        "type": "function",
        "signature": "re.findall(pattern: str, string: str): list",
        "doc": "Python 3.12/typeshed symbol re.findall."
      },
      {
        "name": "finditer",
        "type": "function",
        "signature": "re.finditer(pattern: str, string: str): Iterator",
        "doc": "Python 3.12/typeshed symbol re.finditer."
      },
      {
        "name": "fullmatch",
        "type": "function",
        "signature": "re.fullmatch(pattern: str, string: str): Match",
        "doc": "Python 3.12/typeshed symbol re.fullmatch."
      },
      {
        "name": "IGNORECASE",
        "type": "constant",
        "signature": "re.IGNORECASE: RegexFlag",
        "doc": "Python 3.12/typeshed symbol re.IGNORECASE."
      },
      {
        "name": "match",
        "type": "function",
        "signature": "re.match(pattern: str, string: str): Match",
        "doc": "Python 3.12/typeshed symbol re.match."
      },
      {
        "name": "MULTILINE",
        "type": "constant",
        "signature": "re.MULTILINE: RegexFlag",
        "doc": "Python 3.12/typeshed symbol re.MULTILINE."
      },
      {
        "name": "search",
        "type": "function",
        "signature": "re.search(pattern: str, string: str): Match",
        "doc": "Python 3.12/typeshed symbol re.search."
      },
      {
        "name": "split",
        "type": "function",
        "signature": "re.split(pattern: str, string: str): list",
        "doc": "Python 3.12/typeshed symbol re.split."
      },
      {
        "name": "sub",
        "type": "function",
        "signature": "re.sub(pattern: str, repl: object, string: str): str",
        "doc": "Python 3.12/typeshed symbol re.sub."
      }
    ],
    "shutil": [
      {
        "name": "copy",
        "type": "function",
        "signature": "shutil.copy(src: str, dst: str): str",
        "doc": "Python 3.12/typeshed symbol shutil.copy."
      },
      {
        "name": "copy2",
        "type": "function",
        "signature": "shutil.copy2(src: str, dst: str): str",
        "doc": "Python 3.12/typeshed symbol shutil.copy2."
      },
      {
        "name": "copyfile",
        "type": "function",
        "signature": "shutil.copyfile(src: str, dst: str): str",
        "doc": "Python 3.12/typeshed symbol shutil.copyfile."
      },
      {
        "name": "copytree",
        "type": "function",
        "signature": "shutil.copytree(src: str, dst: str): str",
        "doc": "Python 3.12/typeshed symbol shutil.copytree."
      },
      {
        "name": "disk_usage",
        "type": "function",
        "signature": "shutil.disk_usage(path: str): tuple",
        "doc": "Python 3.12/typeshed symbol shutil.disk_usage."
      },
      {
        "name": "make_archive",
        "type": "function",
        "signature": "shutil.make_archive(base_name: str, format: str): str",
        "doc": "Python 3.12/typeshed symbol shutil.make_archive."
      },
      {
        "name": "move",
        "type": "function",
        "signature": "shutil.move(src: str, dst: str): str",
        "doc": "Python 3.12/typeshed symbol shutil.move."
      },
      {
        "name": "rmtree",
        "type": "function",
        "signature": "shutil.rmtree(path: str): None",
        "doc": "Python 3.12/typeshed symbol shutil.rmtree."
      },
      {
        "name": "unpack_archive",
        "type": "function",
        "signature": "shutil.unpack_archive(filename: str, extract_dir: str = None): None",
        "doc": "Python 3.12/typeshed symbol shutil.unpack_archive."
      },
      {
        "name": "which",
        "type": "function",
        "signature": "shutil.which(cmd: str): str",
        "doc": "Python 3.12/typeshed symbol shutil.which."
      }
    ],
    "socket": [
      {
        "name": "AF_INET",
        "type": "constant",
        "signature": "socket.AF_INET: int",
        "doc": "Python 3.12/typeshed symbol socket.AF_INET."
      },
      {
        "name": "AF_INET6",
        "type": "constant",
        "signature": "socket.AF_INET6: int",
        "doc": "Python 3.12/typeshed symbol socket.AF_INET6."
      },
      {
        "name": "create_connection",
        "type": "function",
        "signature": "socket.create_connection(address: tuple, timeout: float = None): socket",
        "doc": "Python 3.12/typeshed symbol socket.create_connection."
      },
      {
        "name": "getaddrinfo",
        "type": "function",
        "signature": "socket.getaddrinfo(host: str, port: object): list",
        "doc": "Python 3.12/typeshed symbol socket.getaddrinfo."
      },
      {
        "name": "gethostname",
        "type": "function",
        "signature": "socket.gethostname(): str",
        "doc": "Python 3.12/typeshed symbol socket.gethostname."
      },
      {
        "name": "SOCK_DGRAM",
        "type": "constant",
        "signature": "socket.SOCK_DGRAM: int",
        "doc": "Python 3.12/typeshed symbol socket.SOCK_DGRAM."
      },
      {
        "name": "SOCK_STREAM",
        "type": "constant",
        "signature": "socket.SOCK_STREAM: int",
        "doc": "Python 3.12/typeshed symbol socket.SOCK_STREAM."
      },
      {
        "name": "socket",
        "type": "class",
        "signature": "socket.socket: type",
        "doc": "Python 3.12/typeshed symbol socket.socket."
      },
      {
        "name": "SocketType",
        "type": "class",
        "signature": "socket.SocketType: type",
        "doc": "Python 3.12/typeshed symbol socket.SocketType."
      }
    ],
    "sqlite3": [
      {
        "name": "Binary",
        "type": "class",
        "signature": "sqlite3.Binary: type",
        "doc": "Python 3.12/typeshed symbol sqlite3.Binary."
      },
      {
        "name": "connect",
        "type": "function",
        "signature": "sqlite3.connect(database: str, timeout: float = 5.0): Connection",
        "doc": "Python 3.12/typeshed symbol sqlite3.connect."
      },
      {
        "name": "Connection",
        "type": "class",
        "signature": "sqlite3.Connection: type",
        "doc": "Python 3.12/typeshed symbol sqlite3.Connection."
      },
      {
        "name": "Cursor",
        "type": "class",
        "signature": "sqlite3.Cursor: type",
        "doc": "Python 3.12/typeshed symbol sqlite3.Cursor."
      },
      {
        "name": "Error",
        "type": "class",
        "signature": "sqlite3.Error: type",
        "doc": "Python 3.12/typeshed symbol sqlite3.Error."
      },
      {
        "name": "IntegrityError",
        "type": "class",
        "signature": "sqlite3.IntegrityError: type",
        "doc": "Python 3.12/typeshed symbol sqlite3.IntegrityError."
      },
      {
        "name": "OperationalError",
        "type": "class",
        "signature": "sqlite3.OperationalError: type",
        "doc": "Python 3.12/typeshed symbol sqlite3.OperationalError."
      },
      {
        "name": "Row",
        "type": "class",
        "signature": "sqlite3.Row: type",
        "doc": "Python 3.12/typeshed symbol sqlite3.Row."
      }
    ],
    "statistics": [
      {
        "name": "fmean",
        "type": "function",
        "signature": "statistics.fmean(data: Iterable): float",
        "doc": "Python 3.12/typeshed symbol statistics.fmean."
      },
      {
        "name": "geometric_mean",
        "type": "function",
        "signature": "statistics.geometric_mean(data: Iterable): float",
        "doc": "Python 3.12/typeshed symbol statistics.geometric_mean."
      },
      {
        "name": "harmonic_mean",
        "type": "function",
        "signature": "statistics.harmonic_mean(data: Iterable): float",
        "doc": "Python 3.12/typeshed symbol statistics.harmonic_mean."
      },
      {
        "name": "mean",
        "type": "function",
        "signature": "statistics.mean(data: Iterable): float",
        "doc": "Python 3.12/typeshed symbol statistics.mean."
      },
      {
        "name": "median",
        "type": "function",
        "signature": "statistics.median(data: Iterable): float",
        "doc": "Python 3.12/typeshed symbol statistics.median."
      },
      {
        "name": "mode",
        "type": "function",
        "signature": "statistics.mode(data: Iterable): object",
        "doc": "Python 3.12/typeshed symbol statistics.mode."
      },
      {
        "name": "pstdev",
        "type": "function",
        "signature": "statistics.pstdev(data: Iterable): float",
        "doc": "Python 3.12/typeshed symbol statistics.pstdev."
      },
      {
        "name": "stdev",
        "type": "function",
        "signature": "statistics.stdev(data: Iterable): float",
        "doc": "Python 3.12/typeshed symbol statistics.stdev."
      },
      {
        "name": "variance",
        "type": "function",
        "signature": "statistics.variance(data: Iterable): float",
        "doc": "Python 3.12/typeshed symbol statistics.variance."
      }
    ],
    "subprocess": [
      {
        "name": "call",
        "type": "function",
        "signature": "subprocess.call(args: object, **kwargs): int",
        "doc": "Python 3.12/typeshed symbol subprocess.call."
      },
      {
        "name": "check_call",
        "type": "function",
        "signature": "subprocess.check_call(args: object, **kwargs): int",
        "doc": "Python 3.12/typeshed symbol subprocess.check_call."
      },
      {
        "name": "check_output",
        "type": "function",
        "signature": "subprocess.check_output(args: object, **kwargs): bytes",
        "doc": "Python 3.12/typeshed symbol subprocess.check_output."
      },
      {
        "name": "DEVNULL",
        "type": "constant",
        "signature": "subprocess.DEVNULL: int",
        "doc": "Python 3.12/typeshed symbol subprocess.DEVNULL."
      },
      {
        "name": "PIPE",
        "type": "constant",
        "signature": "subprocess.PIPE: int",
        "doc": "Python 3.12/typeshed symbol subprocess.PIPE."
      },
      {
        "name": "Popen",
        "type": "class",
        "signature": "subprocess.Popen: type",
        "doc": "Python 3.12/typeshed symbol subprocess.Popen."
      },
      {
        "name": "run",
        "type": "function",
        "signature": "subprocess.run(args: object, **kwargs): CompletedProcess",
        "doc": "Python 3.12/typeshed symbol subprocess.run."
      },
      {
        "name": "STDOUT",
        "type": "constant",
        "signature": "subprocess.STDOUT: int",
        "doc": "Python 3.12/typeshed symbol subprocess.STDOUT."
      }
    ],
    "sys": [
      {
        "name": "argv",
        "type": "property",
        "signature": "sys.argv: list",
        "doc": "Python 3.12/typeshed symbol sys.argv."
      },
      {
        "name": "executable",
        "type": "property",
        "signature": "sys.executable: str",
        "doc": "Python 3.12/typeshed symbol sys.executable."
      },
      {
        "name": "exit",
        "type": "function",
        "signature": "sys.exit(status: object = None): NoReturn",
        "doc": "Python 3.12/typeshed symbol sys.exit."
      },
      {
        "name": "getdefaultencoding",
        "type": "function",
        "signature": "sys.getdefaultencoding(): str",
        "doc": "Python 3.12/typeshed symbol sys.getdefaultencoding."
      },
      {
        "name": "getsizeof",
        "type": "function",
        "signature": "sys.getsizeof(object: object): int",
        "doc": "Python 3.12/typeshed symbol sys.getsizeof."
      },
      {
        "name": "modules",
        "type": "property",
        "signature": "sys.modules: dict",
        "doc": "Python 3.12/typeshed symbol sys.modules."
      },
      {
        "name": "path",
        "type": "property",
        "signature": "sys.path: list",
        "doc": "Python 3.12/typeshed symbol sys.path."
      },
      {
        "name": "platform",
        "type": "property",
        "signature": "sys.platform: str",
        "doc": "Python 3.12/typeshed symbol sys.platform."
      },
      {
        "name": "stderr",
        "type": "property",
        "signature": "sys.stderr: TextIO",
        "doc": "Python 3.12/typeshed symbol sys.stderr."
      },
      {
        "name": "stdin",
        "type": "property",
        "signature": "sys.stdin: TextIO",
        "doc": "Python 3.12/typeshed symbol sys.stdin."
      },
      {
        "name": "stdout",
        "type": "property",
        "signature": "sys.stdout: TextIO",
        "doc": "Python 3.12/typeshed symbol sys.stdout."
      },
      {
        "name": "version",
        "type": "property",
        "signature": "sys.version: str",
        "doc": "Python 3.12/typeshed symbol sys.version."
      },
      {
        "name": "version_info",
        "type": "property",
        "signature": "sys.version_info: tuple",
        "doc": "Python 3.12/typeshed symbol sys.version_info."
      }
    ],
    "tempfile": [
      {
        "name": "gettempdir",
        "type": "function",
        "signature": "tempfile.gettempdir(): str",
        "doc": "Python 3.12/typeshed symbol tempfile.gettempdir."
      },
      {
        "name": "mkdtemp",
        "type": "function",
        "signature": "tempfile.mkdtemp(**kwargs): str",
        "doc": "Python 3.12/typeshed symbol tempfile.mkdtemp."
      },
      {
        "name": "mkstemp",
        "type": "function",
        "signature": "tempfile.mkstemp(**kwargs): tuple",
        "doc": "Python 3.12/typeshed symbol tempfile.mkstemp."
      },
      {
        "name": "NamedTemporaryFile",
        "type": "function",
        "signature": "tempfile.NamedTemporaryFile(**kwargs): IO",
        "doc": "Python 3.12/typeshed symbol tempfile.NamedTemporaryFile."
      },
      {
        "name": "TemporaryDirectory",
        "type": "function",
        "signature": "tempfile.TemporaryDirectory(**kwargs): TemporaryDirectory",
        "doc": "Python 3.12/typeshed symbol tempfile.TemporaryDirectory."
      },
      {
        "name": "TemporaryFile",
        "type": "function",
        "signature": "tempfile.TemporaryFile(**kwargs): IO",
        "doc": "Python 3.12/typeshed symbol tempfile.TemporaryFile."
      }
    ],
    "threading": [
      {
        "name": "active_count",
        "type": "function",
        "signature": "threading.active_count(): int",
        "doc": "Python 3.12/typeshed symbol threading.active_count."
      },
      {
        "name": "Barrier",
        "type": "class",
        "signature": "threading.Barrier: type",
        "doc": "Python 3.12/typeshed symbol threading.Barrier."
      },
      {
        "name": "Condition",
        "type": "class",
        "signature": "threading.Condition: type",
        "doc": "Python 3.12/typeshed symbol threading.Condition."
      },
      {
        "name": "current_thread",
        "type": "function",
        "signature": "threading.current_thread(): Thread",
        "doc": "Python 3.12/typeshed symbol threading.current_thread."
      },
      {
        "name": "enumerate",
        "type": "function",
        "signature": "threading.enumerate(): list",
        "doc": "Python 3.12/typeshed symbol threading.enumerate."
      },
      {
        "name": "Event",
        "type": "class",
        "signature": "threading.Event: type",
        "doc": "Python 3.12/typeshed symbol threading.Event."
      },
      {
        "name": "Lock",
        "type": "function",
        "signature": "threading.Lock(): Lock",
        "doc": "Python 3.12/typeshed symbol threading.Lock."
      },
      {
        "name": "RLock",
        "type": "function",
        "signature": "threading.RLock(): RLock",
        "doc": "Python 3.12/typeshed symbol threading.RLock."
      },
      {
        "name": "Semaphore",
        "type": "class",
        "signature": "threading.Semaphore: type",
        "doc": "Python 3.12/typeshed symbol threading.Semaphore."
      },
      {
        "name": "Thread",
        "type": "class",
        "signature": "threading.Thread: type",
        "doc": "Python 3.12/typeshed symbol threading.Thread."
      },
      {
        "name": "Timer",
        "type": "class",
        "signature": "threading.Timer: type",
        "doc": "Python 3.12/typeshed symbol threading.Timer."
      }
    ],
    "time": [
      {
        "name": "ctime",
        "type": "function",
        "signature": "time.ctime(seconds: float = None): str",
        "doc": "Python 3.12/typeshed symbol time.ctime."
      },
      {
        "name": "monotonic",
        "type": "function",
        "signature": "time.monotonic(): float",
        "doc": "Python 3.12/typeshed symbol time.monotonic."
      },
      {
        "name": "perf_counter",
        "type": "function",
        "signature": "time.perf_counter(): float",
        "doc": "Python 3.12/typeshed symbol time.perf_counter."
      },
      {
        "name": "sleep",
        "type": "function",
        "signature": "time.sleep(seconds: float): None",
        "doc": "Python 3.12/typeshed symbol time.sleep."
      },
      {
        "name": "strftime",
        "type": "function",
        "signature": "time.strftime(format: str): str",
        "doc": "Python 3.12/typeshed symbol time.strftime."
      },
      {
        "name": "time",
        "type": "function",
        "signature": "time.time(): float",
        "doc": "Python 3.12/typeshed symbol time.time."
      }
    ],
    "typing": [
      {
        "name": "Any",
        "type": "type",
        "signature": "typing.Any: special-form",
        "doc": "Python 3.12/typeshed symbol typing.Any."
      },
      {
        "name": "Callable",
        "type": "type",
        "signature": "typing.Callable: special-form",
        "doc": "Python 3.12/typeshed symbol typing.Callable."
      },
      {
        "name": "cast",
        "type": "function",
        "signature": "typing.cast(typ: type, val: object): object",
        "doc": "Python 3.12/typeshed symbol typing.cast."
      },
      {
        "name": "ClassVar",
        "type": "type",
        "signature": "typing.ClassVar: special-form",
        "doc": "Python 3.12/typeshed symbol typing.ClassVar."
      },
      {
        "name": "Final",
        "type": "type",
        "signature": "typing.Final: special-form",
        "doc": "Python 3.12/typeshed symbol typing.Final."
      },
      {
        "name": "Generic",
        "type": "class",
        "signature": "typing.Generic: type",
        "doc": "Python 3.12/typeshed symbol typing.Generic."
      },
      {
        "name": "Iterable",
        "type": "class",
        "signature": "typing.Iterable: type",
        "doc": "Python 3.12/typeshed symbol typing.Iterable."
      },
      {
        "name": "Iterator",
        "type": "class",
        "signature": "typing.Iterator: type",
        "doc": "Python 3.12/typeshed symbol typing.Iterator."
      },
      {
        "name": "Literal",
        "type": "type",
        "signature": "typing.Literal: special-form",
        "doc": "Python 3.12/typeshed symbol typing.Literal."
      },
      {
        "name": "Mapping",
        "type": "class",
        "signature": "typing.Mapping: type",
        "doc": "Python 3.12/typeshed symbol typing.Mapping."
      },
      {
        "name": "NamedTuple",
        "type": "class",
        "signature": "typing.NamedTuple: type",
        "doc": "Python 3.12/typeshed symbol typing.NamedTuple."
      },
      {
        "name": "Optional",
        "type": "type",
        "signature": "typing.Optional: special-form",
        "doc": "Python 3.12/typeshed symbol typing.Optional."
      },
      {
        "name": "overload",
        "type": "function",
        "signature": "typing.overload(func: object): object",
        "doc": "Python 3.12/typeshed symbol typing.overload."
      },
      {
        "name": "Protocol",
        "type": "class",
        "signature": "typing.Protocol: type",
        "doc": "Python 3.12/typeshed symbol typing.Protocol."
      },
      {
        "name": "Sequence",
        "type": "class",
        "signature": "typing.Sequence: type",
        "doc": "Python 3.12/typeshed symbol typing.Sequence."
      },
      {
        "name": "TypeAlias",
        "type": "type",
        "signature": "typing.TypeAlias: special-form",
        "doc": "Python 3.12/typeshed symbol typing.TypeAlias."
      },
      {
        "name": "TypeVar",
        "type": "function",
        "signature": "typing.TypeVar(name: str): TypeVar",
        "doc": "Python 3.12/typeshed symbol typing.TypeVar."
      },
      {
        "name": "Union",
        "type": "type",
        "signature": "typing.Union: special-form",
        "doc": "Python 3.12/typeshed symbol typing.Union."
      }
    ],
    "urllib.parse": [
      {
        "name": "parse_qs",
        "type": "function",
        "signature": "urllib.parse.parse_qs(qs: str): dict",
        "doc": "Python 3.12/typeshed symbol urllib.parse.parse_qs."
      },
      {
        "name": "quote",
        "type": "function",
        "signature": "urllib.parse.quote(string: str, safe: str = '/'): str",
        "doc": "Python 3.12/typeshed symbol urllib.parse.quote."
      },
      {
        "name": "unquote",
        "type": "function",
        "signature": "urllib.parse.unquote(string: str): str",
        "doc": "Python 3.12/typeshed symbol urllib.parse.unquote."
      },
      {
        "name": "urlencode",
        "type": "function",
        "signature": "urllib.parse.urlencode(query: object): str",
        "doc": "Python 3.12/typeshed symbol urllib.parse.urlencode."
      },
      {
        "name": "urljoin",
        "type": "function",
        "signature": "urllib.parse.urljoin(base: str, url: str): str",
        "doc": "Python 3.12/typeshed symbol urllib.parse.urljoin."
      },
      {
        "name": "urlparse",
        "type": "function",
        "signature": "urllib.parse.urlparse(url: str, scheme: str = ''): ParseResult",
        "doc": "Python 3.12/typeshed symbol urllib.parse.urlparse."
      },
      {
        "name": "urlsplit",
        "type": "function",
        "signature": "urllib.parse.urlsplit(url: str, scheme: str = ''): SplitResult",
        "doc": "Python 3.12/typeshed symbol urllib.parse.urlsplit."
      }
    ]
  },
  "aliases": {
    "date": "datetime.date",
    "datetime": "datetime.datetime",
    "Path": "pathlib.Path",
    "PurePath": "pathlib.Path"
  }
};
})(window);
