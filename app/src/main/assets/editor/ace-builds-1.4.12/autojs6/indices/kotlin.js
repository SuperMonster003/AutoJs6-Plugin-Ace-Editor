(function(global) {
    "use strict";
    var registry = global.AutoJsAceLanguageIndices || (global.AutoJsAceLanguageIndices = Object.create(null));
    registry["kotlin"] = {
  "schemaVersion": 1,
  "generatorVersion": 1,
  "language": "kotlin",
  "source": {
    "name": "Kotlin standard library and Java/Android interop API subset",
    "languageVersion": "Kotlin 2.2.21",
    "revision": "autojs6-kotlin-2.2.21-p2plus-2",
    "url": "https://kotlinlang.org/api/core/kotlin-stdlib/",
    "license": "Apache-2.0; API names/signatures only",
    "scope": "Kotlin top-level and instance APIs plus selected Java/Android interop; paired with conservative single-file type heuristics"
  },
  "globals": [
    {
      "name": "Any",
      "type": "class",
      "signature": "class Any",
      "doc": "Kotlin 2.2.21 type Any."
    },
    {
      "name": "Array",
      "type": "class",
      "signature": "class Array",
      "doc": "Kotlin 2.2.21 type Array."
    },
    {
      "name": "ArrayList",
      "type": "class",
      "signature": "class ArrayList",
      "doc": "Java 17/Android API 35 type ArrayList."
    },
    {
      "name": "arrayListOf",
      "type": "function",
      "signature": "arrayListOf(*elements: Object): ArrayList",
      "doc": "Kotlin 2.2.21 symbol arrayListOf."
    },
    {
      "name": "arrayOf",
      "type": "function",
      "signature": "arrayOf(*elements: Object): Array",
      "doc": "Kotlin 2.2.21 symbol arrayOf."
    },
    {
      "name": "Arrays",
      "type": "class",
      "signature": "class Arrays",
      "doc": "Java 17/Android API 35 type Arrays."
    },
    {
      "name": "Boolean",
      "type": "class",
      "signature": "class Boolean",
      "doc": "Kotlin 2.2.21 type Boolean."
    },
    {
      "name": "booleanArrayOf",
      "type": "function",
      "signature": "booleanArrayOf(*elements: Boolean): BooleanArray",
      "doc": "Kotlin 2.2.21 symbol booleanArrayOf."
    },
    {
      "name": "buildList",
      "type": "function",
      "signature": "buildList(builderAction: function): List",
      "doc": "Kotlin 2.2.21 symbol buildList."
    },
    {
      "name": "buildMap",
      "type": "function",
      "signature": "buildMap(builderAction: function): Map",
      "doc": "Kotlin 2.2.21 symbol buildMap."
    },
    {
      "name": "buildSet",
      "type": "function",
      "signature": "buildSet(builderAction: function): Set",
      "doc": "Kotlin 2.2.21 symbol buildSet."
    },
    {
      "name": "Bundle",
      "type": "class",
      "signature": "class Bundle",
      "doc": "Java 17/Android API 35 type Bundle."
    },
    {
      "name": "Byte",
      "type": "class",
      "signature": "class Byte",
      "doc": "Kotlin 2.2.21 type Byte."
    },
    {
      "name": "byteArrayOf",
      "type": "function",
      "signature": "byteArrayOf(*elements: Byte): ByteArray",
      "doc": "Kotlin 2.2.21 symbol byteArrayOf."
    },
    {
      "name": "Char",
      "type": "class",
      "signature": "class Char",
      "doc": "Kotlin 2.2.21 type Char."
    },
    {
      "name": "charArrayOf",
      "type": "function",
      "signature": "charArrayOf(*elements: Char): CharArray",
      "doc": "Kotlin 2.2.21 symbol charArrayOf."
    },
    {
      "name": "CharSequence",
      "type": "class",
      "signature": "class CharSequence",
      "doc": "Kotlin 2.2.21 type CharSequence."
    },
    {
      "name": "check",
      "type": "function",
      "signature": "check(value: Boolean): Unit",
      "doc": "Kotlin 2.2.21 symbol check."
    },
    {
      "name": "checkNotNull",
      "type": "function",
      "signature": "checkNotNull(value: Object): Object",
      "doc": "Kotlin 2.2.21 symbol checkNotNull."
    },
    {
      "name": "Collections",
      "type": "class",
      "signature": "class Collections",
      "doc": "Java 17/Android API 35 type Collections."
    },
    {
      "name": "Color",
      "type": "class",
      "signature": "class Color",
      "doc": "Java 17/Android API 35 type Color."
    },
    {
      "name": "Context",
      "type": "class",
      "signature": "class Context",
      "doc": "Java 17/Android API 35 type Context."
    },
    {
      "name": "Double",
      "type": "class",
      "signature": "class Double",
      "doc": "Kotlin 2.2.21 type Double."
    },
    {
      "name": "doubleArrayOf",
      "type": "function",
      "signature": "doubleArrayOf(*elements: Double): DoubleArray",
      "doc": "Kotlin 2.2.21 symbol doubleArrayOf."
    },
    {
      "name": "emptyArray",
      "type": "function",
      "signature": "emptyArray(): Array",
      "doc": "Kotlin 2.2.21 symbol emptyArray."
    },
    {
      "name": "emptyList",
      "type": "function",
      "signature": "emptyList(): List",
      "doc": "Kotlin 2.2.21 symbol emptyList."
    },
    {
      "name": "emptyMap",
      "type": "function",
      "signature": "emptyMap(): Map",
      "doc": "Kotlin 2.2.21 symbol emptyMap."
    },
    {
      "name": "emptySet",
      "type": "function",
      "signature": "emptySet(): Set",
      "doc": "Kotlin 2.2.21 symbol emptySet."
    },
    {
      "name": "error",
      "type": "function",
      "signature": "error(message: Object): Nothing",
      "doc": "Kotlin 2.2.21 symbol error."
    },
    {
      "name": "Exception",
      "type": "class",
      "signature": "class Exception",
      "doc": "Kotlin 2.2.21 type Exception."
    },
    {
      "name": "File",
      "type": "class",
      "signature": "class File",
      "doc": "Java 17/Android API 35 type File."
    },
    {
      "name": "Files",
      "type": "class",
      "signature": "class Files",
      "doc": "Java 17/Android API 35 type Files."
    },
    {
      "name": "Float",
      "type": "class",
      "signature": "class Float",
      "doc": "Kotlin 2.2.21 type Float."
    },
    {
      "name": "floatArrayOf",
      "type": "function",
      "signature": "floatArrayOf(*elements: Float): FloatArray",
      "doc": "Kotlin 2.2.21 symbol floatArrayOf."
    },
    {
      "name": "generateSequence",
      "type": "function",
      "signature": "generateSequence(nextFunction: function): Sequence",
      "doc": "Kotlin 2.2.21 symbol generateSequence."
    },
    {
      "name": "HashMap",
      "type": "class",
      "signature": "class HashMap",
      "doc": "Java 17/Android API 35 type HashMap."
    },
    {
      "name": "hashMapOf",
      "type": "function",
      "signature": "hashMapOf(*pairs: Pair): HashMap",
      "doc": "Kotlin 2.2.21 symbol hashMapOf."
    },
    {
      "name": "hashSetOf",
      "type": "function",
      "signature": "hashSetOf(*elements: Object): HashSet",
      "doc": "Kotlin 2.2.21 symbol hashSetOf."
    },
    {
      "name": "IllegalArgumentException",
      "type": "class",
      "signature": "class IllegalArgumentException",
      "doc": "Kotlin 2.2.21 type IllegalArgumentException."
    },
    {
      "name": "IllegalStateException",
      "type": "class",
      "signature": "class IllegalStateException",
      "doc": "Kotlin 2.2.21 type IllegalStateException."
    },
    {
      "name": "Int",
      "type": "class",
      "signature": "class Int",
      "doc": "Kotlin 2.2.21 type Int."
    },
    {
      "name": "intArrayOf",
      "type": "function",
      "signature": "intArrayOf(*elements: Int): IntArray",
      "doc": "Kotlin 2.2.21 symbol intArrayOf."
    },
    {
      "name": "Intent",
      "type": "class",
      "signature": "class Intent",
      "doc": "Java 17/Android API 35 type Intent."
    },
    {
      "name": "Iterable",
      "type": "class",
      "signature": "class Iterable",
      "doc": "Kotlin 2.2.21 type Iterable."
    },
    {
      "name": "Iterator",
      "type": "class",
      "signature": "class Iterator",
      "doc": "Kotlin 2.2.21 type Iterator."
    },
    {
      "name": "lazy",
      "type": "function",
      "signature": "lazy(initializer: function): Lazy",
      "doc": "Kotlin 2.2.21 symbol lazy."
    },
    {
      "name": "Lazy",
      "type": "class",
      "signature": "class Lazy",
      "doc": "Kotlin 2.2.21 type Lazy."
    },
    {
      "name": "List",
      "type": "class",
      "signature": "class List",
      "doc": "Kotlin 2.2.21 type List."
    },
    {
      "name": "listOf",
      "type": "function",
      "signature": "listOf(*elements: Object): List",
      "doc": "Kotlin 2.2.21 symbol listOf."
    },
    {
      "name": "Log",
      "type": "class",
      "signature": "class Log",
      "doc": "Java 17/Android API 35 type Log."
    },
    {
      "name": "Long",
      "type": "class",
      "signature": "class Long",
      "doc": "Kotlin 2.2.21 type Long."
    },
    {
      "name": "longArrayOf",
      "type": "function",
      "signature": "longArrayOf(*elements: Long): LongArray",
      "doc": "Kotlin 2.2.21 symbol longArrayOf."
    },
    {
      "name": "Map",
      "type": "class",
      "signature": "class Map",
      "doc": "Kotlin 2.2.21 type Map."
    },
    {
      "name": "mapOf",
      "type": "function",
      "signature": "mapOf(*pairs: Pair): Map",
      "doc": "Kotlin 2.2.21 symbol mapOf."
    },
    {
      "name": "Math",
      "type": "class",
      "signature": "class Math",
      "doc": "Java 17/Android API 35 type Math."
    },
    {
      "name": "MutableList",
      "type": "class",
      "signature": "class MutableList",
      "doc": "Kotlin 2.2.21 type MutableList."
    },
    {
      "name": "mutableListOf",
      "type": "function",
      "signature": "mutableListOf(*elements: Object): MutableList",
      "doc": "Kotlin 2.2.21 symbol mutableListOf."
    },
    {
      "name": "MutableMap",
      "type": "class",
      "signature": "class MutableMap",
      "doc": "Kotlin 2.2.21 type MutableMap."
    },
    {
      "name": "mutableMapOf",
      "type": "function",
      "signature": "mutableMapOf(*pairs: Pair): MutableMap",
      "doc": "Kotlin 2.2.21 symbol mutableMapOf."
    },
    {
      "name": "MutableSet",
      "type": "class",
      "signature": "class MutableSet",
      "doc": "Kotlin 2.2.21 type MutableSet."
    },
    {
      "name": "mutableSetOf",
      "type": "function",
      "signature": "mutableSetOf(*elements: Object): MutableSet",
      "doc": "Kotlin 2.2.21 symbol mutableSetOf."
    },
    {
      "name": "Nothing",
      "type": "class",
      "signature": "class Nothing",
      "doc": "Kotlin 2.2.21 type Nothing."
    },
    {
      "name": "Number",
      "type": "class",
      "signature": "class Number",
      "doc": "Kotlin 2.2.21 type Number."
    },
    {
      "name": "Objects",
      "type": "class",
      "signature": "class Objects",
      "doc": "Java 17/Android API 35 type Objects."
    },
    {
      "name": "Pair",
      "type": "class",
      "signature": "class Pair",
      "doc": "Kotlin 2.2.21 type Pair."
    },
    {
      "name": "Path",
      "type": "class",
      "signature": "class Path",
      "doc": "Java 17/Android API 35 type Path."
    },
    {
      "name": "Paths",
      "type": "class",
      "signature": "class Paths",
      "doc": "Java 17/Android API 35 type Paths."
    },
    {
      "name": "print",
      "type": "function",
      "signature": "print(message: Object): Unit",
      "doc": "Kotlin 2.2.21 symbol print."
    },
    {
      "name": "println",
      "type": "function",
      "signature": "println(message: Object = ''): Unit",
      "doc": "Kotlin 2.2.21 symbol println."
    },
    {
      "name": "readLine",
      "type": "function",
      "signature": "readLine(): String",
      "doc": "Kotlin 2.2.21 symbol readLine."
    },
    {
      "name": "Regex",
      "type": "class",
      "signature": "class Regex",
      "doc": "Kotlin 2.2.21 type Regex."
    },
    {
      "name": "require",
      "type": "function",
      "signature": "require(value: Boolean): Unit",
      "doc": "Kotlin 2.2.21 symbol require."
    },
    {
      "name": "requireNotNull",
      "type": "function",
      "signature": "requireNotNull(value: Object): Object",
      "doc": "Kotlin 2.2.21 symbol requireNotNull."
    },
    {
      "name": "Result",
      "type": "class",
      "signature": "class Result",
      "doc": "Kotlin 2.2.21 type Result."
    },
    {
      "name": "run",
      "type": "function",
      "signature": "run(block: function): Object",
      "doc": "Kotlin 2.2.21 symbol run."
    },
    {
      "name": "runCatching",
      "type": "function",
      "signature": "runCatching(block: function): Result",
      "doc": "Kotlin 2.2.21 symbol runCatching."
    },
    {
      "name": "sequence",
      "type": "function",
      "signature": "sequence(block: function): Sequence",
      "doc": "Kotlin 2.2.21 symbol sequence."
    },
    {
      "name": "Sequence",
      "type": "class",
      "signature": "class Sequence",
      "doc": "Kotlin 2.2.21 type Sequence."
    },
    {
      "name": "sequenceOf",
      "type": "function",
      "signature": "sequenceOf(*elements: Object): Sequence",
      "doc": "Kotlin 2.2.21 symbol sequenceOf."
    },
    {
      "name": "Set",
      "type": "class",
      "signature": "class Set",
      "doc": "Kotlin 2.2.21 type Set."
    },
    {
      "name": "setOf",
      "type": "function",
      "signature": "setOf(*elements: Object): Set",
      "doc": "Kotlin 2.2.21 symbol setOf."
    },
    {
      "name": "Short",
      "type": "class",
      "signature": "class Short",
      "doc": "Kotlin 2.2.21 type Short."
    },
    {
      "name": "shortArrayOf",
      "type": "function",
      "signature": "shortArrayOf(*elements: Short): ShortArray",
      "doc": "Kotlin 2.2.21 symbol shortArrayOf."
    },
    {
      "name": "String",
      "type": "class",
      "signature": "class String",
      "doc": "Kotlin 2.2.21 type String."
    },
    {
      "name": "StringBuilder",
      "type": "class",
      "signature": "class StringBuilder",
      "doc": "Kotlin 2.2.21 type StringBuilder."
    },
    {
      "name": "synchronized",
      "type": "function",
      "signature": "synchronized(lock: Object, block: function): Object",
      "doc": "Kotlin 2.2.21 symbol synchronized."
    },
    {
      "name": "System",
      "type": "class",
      "signature": "class System",
      "doc": "Java 17/Android API 35 type System."
    },
    {
      "name": "TextUtils",
      "type": "class",
      "signature": "class TextUtils",
      "doc": "Java 17/Android API 35 type TextUtils."
    },
    {
      "name": "Throwable",
      "type": "class",
      "signature": "class Throwable",
      "doc": "Kotlin 2.2.21 type Throwable."
    },
    {
      "name": "TODO",
      "type": "function",
      "signature": "TODO(reason: String = ''): Nothing",
      "doc": "Kotlin 2.2.21 symbol TODO."
    },
    {
      "name": "Triple",
      "type": "class",
      "signature": "class Triple",
      "doc": "Kotlin 2.2.21 type Triple."
    },
    {
      "name": "Unit",
      "type": "class",
      "signature": "class Unit",
      "doc": "Kotlin 2.2.21 type Unit."
    },
    {
      "name": "Uri",
      "type": "class",
      "signature": "class Uri",
      "doc": "Java 17/Android API 35 type Uri."
    },
    {
      "name": "View",
      "type": "class",
      "signature": "class View",
      "doc": "Java 17/Android API 35 type View."
    },
    {
      "name": "with",
      "type": "function",
      "signature": "with(receiver: Object, block: function): Object",
      "doc": "Kotlin 2.2.21 symbol with."
    }
  ],
  "modules": {
    "Arrays": [
      {
        "name": "asList",
        "type": "function",
        "signature": "Arrays.asList(*items: Object): List",
        "doc": "Java 17/Android API 35 symbol Arrays.asList."
      },
      {
        "name": "binarySearch",
        "type": "function",
        "signature": "Arrays.binarySearch(array: Object, key: Object): int",
        "doc": "Java 17/Android API 35 symbol Arrays.binarySearch."
      },
      {
        "name": "compare",
        "type": "function",
        "signature": "Arrays.compare(left: Object, right: Object): int",
        "doc": "Java 17/Android API 35 symbol Arrays.compare."
      },
      {
        "name": "copyOf",
        "type": "function",
        "signature": "Arrays.copyOf(original: Object, newLength: int): Object",
        "doc": "Java 17/Android API 35 symbol Arrays.copyOf."
      },
      {
        "name": "deepEquals",
        "type": "function",
        "signature": "Arrays.deepEquals(left: Object, right: Object): boolean",
        "doc": "Java 17/Android API 35 symbol Arrays.deepEquals."
      },
      {
        "name": "equals",
        "type": "function",
        "signature": "Arrays.equals(left: Object, right: Object): boolean",
        "doc": "Java 17/Android API 35 symbol Arrays.equals."
      },
      {
        "name": "fill",
        "type": "function",
        "signature": "Arrays.fill(array: Object, value: Object): void",
        "doc": "Java 17/Android API 35 symbol Arrays.fill."
      },
      {
        "name": "sort",
        "type": "function",
        "signature": "Arrays.sort(array: Object): void",
        "doc": "Java 17/Android API 35 symbol Arrays.sort."
      },
      {
        "name": "stream",
        "type": "function",
        "signature": "Arrays.stream(array: Object): Stream",
        "doc": "Java 17/Android API 35 symbol Arrays.stream."
      },
      {
        "name": "toString",
        "type": "function",
        "signature": "Arrays.toString(array: Object): String",
        "doc": "Java 17/Android API 35 symbol Arrays.toString."
      }
    ],
    "Collections": [
      {
        "name": "binarySearch",
        "type": "function",
        "signature": "Collections.binarySearch(list: List, key: Object): int",
        "doc": "Java 17/Android API 35 symbol Collections.binarySearch."
      },
      {
        "name": "copy",
        "type": "function",
        "signature": "Collections.copy(dest: List, src: List): void",
        "doc": "Java 17/Android API 35 symbol Collections.copy."
      },
      {
        "name": "emptyList",
        "type": "function",
        "signature": "Collections.emptyList(): List",
        "doc": "Java 17/Android API 35 symbol Collections.emptyList."
      },
      {
        "name": "emptyMap",
        "type": "function",
        "signature": "Collections.emptyMap(): Map",
        "doc": "Java 17/Android API 35 symbol Collections.emptyMap."
      },
      {
        "name": "emptySet",
        "type": "function",
        "signature": "Collections.emptySet(): Set",
        "doc": "Java 17/Android API 35 symbol Collections.emptySet."
      },
      {
        "name": "frequency",
        "type": "function",
        "signature": "Collections.frequency(collection: Collection, object: Object): int",
        "doc": "Java 17/Android API 35 symbol Collections.frequency."
      },
      {
        "name": "max",
        "type": "function",
        "signature": "Collections.max(collection: Collection): Object",
        "doc": "Java 17/Android API 35 symbol Collections.max."
      },
      {
        "name": "min",
        "type": "function",
        "signature": "Collections.min(collection: Collection): Object",
        "doc": "Java 17/Android API 35 symbol Collections.min."
      },
      {
        "name": "reverse",
        "type": "function",
        "signature": "Collections.reverse(list: List): void",
        "doc": "Java 17/Android API 35 symbol Collections.reverse."
      },
      {
        "name": "shuffle",
        "type": "function",
        "signature": "Collections.shuffle(list: List): void",
        "doc": "Java 17/Android API 35 symbol Collections.shuffle."
      },
      {
        "name": "singleton",
        "type": "function",
        "signature": "Collections.singleton(value: Object): Set",
        "doc": "Java 17/Android API 35 symbol Collections.singleton."
      },
      {
        "name": "sort",
        "type": "function",
        "signature": "Collections.sort(list: List): void",
        "doc": "Java 17/Android API 35 symbol Collections.sort."
      },
      {
        "name": "unmodifiableList",
        "type": "function",
        "signature": "Collections.unmodifiableList(list: List): List",
        "doc": "Java 17/Android API 35 symbol Collections.unmodifiableList."
      },
      {
        "name": "unmodifiableMap",
        "type": "function",
        "signature": "Collections.unmodifiableMap(map: Map): Map",
        "doc": "Java 17/Android API 35 symbol Collections.unmodifiableMap."
      }
    ],
    "Color": [
      {
        "name": "alpha",
        "type": "function",
        "signature": "Color.alpha(color: int): int",
        "doc": "Java 17/Android API 35 symbol Color.alpha."
      },
      {
        "name": "argb",
        "type": "function",
        "signature": "Color.argb(alpha: int, red: int, green: int, blue: int): int",
        "doc": "Java 17/Android API 35 symbol Color.argb."
      },
      {
        "name": "BLACK",
        "type": "constant",
        "signature": "Color.BLACK: int",
        "doc": "Java 17/Android API 35 symbol Color.BLACK."
      },
      {
        "name": "blue",
        "type": "function",
        "signature": "Color.blue(color: int): int",
        "doc": "Java 17/Android API 35 symbol Color.blue."
      },
      {
        "name": "BLUE",
        "type": "constant",
        "signature": "Color.BLUE: int",
        "doc": "Java 17/Android API 35 symbol Color.BLUE."
      },
      {
        "name": "green",
        "type": "function",
        "signature": "Color.green(color: int): int",
        "doc": "Java 17/Android API 35 symbol Color.green."
      },
      {
        "name": "GREEN",
        "type": "constant",
        "signature": "Color.GREEN: int",
        "doc": "Java 17/Android API 35 symbol Color.GREEN."
      },
      {
        "name": "parseColor",
        "type": "function",
        "signature": "Color.parseColor(colorString: String): int",
        "doc": "Java 17/Android API 35 symbol Color.parseColor."
      },
      {
        "name": "red",
        "type": "function",
        "signature": "Color.red(color: int): int",
        "doc": "Java 17/Android API 35 symbol Color.red."
      },
      {
        "name": "RED",
        "type": "constant",
        "signature": "Color.RED: int",
        "doc": "Java 17/Android API 35 symbol Color.RED."
      },
      {
        "name": "rgb",
        "type": "function",
        "signature": "Color.rgb(red: int, green: int, blue: int): int",
        "doc": "Java 17/Android API 35 symbol Color.rgb."
      },
      {
        "name": "TRANSPARENT",
        "type": "constant",
        "signature": "Color.TRANSPARENT: int",
        "doc": "Java 17/Android API 35 symbol Color.TRANSPARENT."
      },
      {
        "name": "WHITE",
        "type": "constant",
        "signature": "Color.WHITE: int",
        "doc": "Java 17/Android API 35 symbol Color.WHITE."
      }
    ],
    "Files": [
      {
        "name": "copy",
        "type": "function",
        "signature": "Files.copy(source: Path, target: Path, *options: CopyOption): Path",
        "doc": "Java 17/Android API 35 symbol Files.copy."
      },
      {
        "name": "createDirectories",
        "type": "function",
        "signature": "Files.createDirectories(dir: Path): Path",
        "doc": "Java 17/Android API 35 symbol Files.createDirectories."
      },
      {
        "name": "createFile",
        "type": "function",
        "signature": "Files.createFile(path: Path): Path",
        "doc": "Java 17/Android API 35 symbol Files.createFile."
      },
      {
        "name": "delete",
        "type": "function",
        "signature": "Files.delete(path: Path): void",
        "doc": "Java 17/Android API 35 symbol Files.delete."
      },
      {
        "name": "deleteIfExists",
        "type": "function",
        "signature": "Files.deleteIfExists(path: Path): boolean",
        "doc": "Java 17/Android API 35 symbol Files.deleteIfExists."
      },
      {
        "name": "exists",
        "type": "function",
        "signature": "Files.exists(path: Path, *options: LinkOption): boolean",
        "doc": "Java 17/Android API 35 symbol Files.exists."
      },
      {
        "name": "isDirectory",
        "type": "function",
        "signature": "Files.isDirectory(path: Path): boolean",
        "doc": "Java 17/Android API 35 symbol Files.isDirectory."
      },
      {
        "name": "isRegularFile",
        "type": "function",
        "signature": "Files.isRegularFile(path: Path): boolean",
        "doc": "Java 17/Android API 35 symbol Files.isRegularFile."
      },
      {
        "name": "list",
        "type": "function",
        "signature": "Files.list(dir: Path): Stream",
        "doc": "Java 17/Android API 35 symbol Files.list."
      },
      {
        "name": "move",
        "type": "function",
        "signature": "Files.move(source: Path, target: Path, *options: CopyOption): Path",
        "doc": "Java 17/Android API 35 symbol Files.move."
      },
      {
        "name": "readAllBytes",
        "type": "function",
        "signature": "Files.readAllBytes(path: Path): byte[]",
        "doc": "Java 17/Android API 35 symbol Files.readAllBytes."
      },
      {
        "name": "readString",
        "type": "function",
        "signature": "Files.readString(path: Path): String",
        "doc": "Java 17/Android API 35 symbol Files.readString."
      },
      {
        "name": "size",
        "type": "function",
        "signature": "Files.size(path: Path): long",
        "doc": "Java 17/Android API 35 symbol Files.size."
      },
      {
        "name": "walk",
        "type": "function",
        "signature": "Files.walk(start: Path): Stream",
        "doc": "Java 17/Android API 35 symbol Files.walk."
      },
      {
        "name": "write",
        "type": "function",
        "signature": "Files.write(path: Path, bytes: byte[]): Path",
        "doc": "Java 17/Android API 35 symbol Files.write."
      },
      {
        "name": "writeString",
        "type": "function",
        "signature": "Files.writeString(path: Path, text: CharSequence): Path",
        "doc": "Java 17/Android API 35 symbol Files.writeString."
      }
    ],
    "Log": [
      {
        "name": "d",
        "type": "function",
        "signature": "Log.d(tag: String, msg: String): int",
        "doc": "Java 17/Android API 35 symbol Log.d."
      },
      {
        "name": "e",
        "type": "function",
        "signature": "Log.e(tag: String, msg: String): int",
        "doc": "Java 17/Android API 35 symbol Log.e."
      },
      {
        "name": "i",
        "type": "function",
        "signature": "Log.i(tag: String, msg: String): int",
        "doc": "Java 17/Android API 35 symbol Log.i."
      },
      {
        "name": "isLoggable",
        "type": "function",
        "signature": "Log.isLoggable(tag: String, level: int): boolean",
        "doc": "Java 17/Android API 35 symbol Log.isLoggable."
      },
      {
        "name": "v",
        "type": "function",
        "signature": "Log.v(tag: String, msg: String): int",
        "doc": "Java 17/Android API 35 symbol Log.v."
      },
      {
        "name": "w",
        "type": "function",
        "signature": "Log.w(tag: String, msg: String): int",
        "doc": "Java 17/Android API 35 symbol Log.w."
      }
    ],
    "Math": [
      {
        "name": "abs",
        "type": "function",
        "signature": "Math.abs(value: double): double",
        "doc": "Java 17/Android API 35 symbol Math.abs."
      },
      {
        "name": "ceil",
        "type": "function",
        "signature": "Math.ceil(value: double): double",
        "doc": "Java 17/Android API 35 symbol Math.ceil."
      },
      {
        "name": "cos",
        "type": "function",
        "signature": "Math.cos(value: double): double",
        "doc": "Java 17/Android API 35 symbol Math.cos."
      },
      {
        "name": "E",
        "type": "constant",
        "signature": "Math.E: double",
        "doc": "Java 17/Android API 35 symbol Math.E."
      },
      {
        "name": "exp",
        "type": "function",
        "signature": "Math.exp(value: double): double",
        "doc": "Java 17/Android API 35 symbol Math.exp."
      },
      {
        "name": "floor",
        "type": "function",
        "signature": "Math.floor(value: double): double",
        "doc": "Java 17/Android API 35 symbol Math.floor."
      },
      {
        "name": "log",
        "type": "function",
        "signature": "Math.log(value: double): double",
        "doc": "Java 17/Android API 35 symbol Math.log."
      },
      {
        "name": "max",
        "type": "function",
        "signature": "Math.max(a: double, b: double): double",
        "doc": "Java 17/Android API 35 symbol Math.max."
      },
      {
        "name": "min",
        "type": "function",
        "signature": "Math.min(a: double, b: double): double",
        "doc": "Java 17/Android API 35 symbol Math.min."
      },
      {
        "name": "PI",
        "type": "constant",
        "signature": "Math.PI: double",
        "doc": "Java 17/Android API 35 symbol Math.PI."
      },
      {
        "name": "pow",
        "type": "function",
        "signature": "Math.pow(a: double, b: double): double",
        "doc": "Java 17/Android API 35 symbol Math.pow."
      },
      {
        "name": "random",
        "type": "function",
        "signature": "Math.random(): double",
        "doc": "Java 17/Android API 35 symbol Math.random."
      },
      {
        "name": "round",
        "type": "function",
        "signature": "Math.round(value: double): long",
        "doc": "Java 17/Android API 35 symbol Math.round."
      },
      {
        "name": "signum",
        "type": "function",
        "signature": "Math.signum(value: double): double",
        "doc": "Java 17/Android API 35 symbol Math.signum."
      },
      {
        "name": "sin",
        "type": "function",
        "signature": "Math.sin(value: double): double",
        "doc": "Java 17/Android API 35 symbol Math.sin."
      },
      {
        "name": "sqrt",
        "type": "function",
        "signature": "Math.sqrt(value: double): double",
        "doc": "Java 17/Android API 35 symbol Math.sqrt."
      },
      {
        "name": "toDegrees",
        "type": "function",
        "signature": "Math.toDegrees(radians: double): double",
        "doc": "Java 17/Android API 35 symbol Math.toDegrees."
      },
      {
        "name": "toRadians",
        "type": "function",
        "signature": "Math.toRadians(degrees: double): double",
        "doc": "Java 17/Android API 35 symbol Math.toRadians."
      }
    ],
    "Objects": [
      {
        "name": "checkIndex",
        "type": "function",
        "signature": "Objects.checkIndex(index: int, length: int): int",
        "doc": "Java 17/Android API 35 symbol Objects.checkIndex."
      },
      {
        "name": "deepEquals",
        "type": "function",
        "signature": "Objects.deepEquals(left: Object, right: Object): boolean",
        "doc": "Java 17/Android API 35 symbol Objects.deepEquals."
      },
      {
        "name": "equals",
        "type": "function",
        "signature": "Objects.equals(left: Object, right: Object): boolean",
        "doc": "Java 17/Android API 35 symbol Objects.equals."
      },
      {
        "name": "hash",
        "type": "function",
        "signature": "Objects.hash(*values: Object): int",
        "doc": "Java 17/Android API 35 symbol Objects.hash."
      },
      {
        "name": "hashCode",
        "type": "function",
        "signature": "Objects.hashCode(value: Object): int",
        "doc": "Java 17/Android API 35 symbol Objects.hashCode."
      },
      {
        "name": "isNull",
        "type": "function",
        "signature": "Objects.isNull(value: Object): boolean",
        "doc": "Java 17/Android API 35 symbol Objects.isNull."
      },
      {
        "name": "nonNull",
        "type": "function",
        "signature": "Objects.nonNull(value: Object): boolean",
        "doc": "Java 17/Android API 35 symbol Objects.nonNull."
      },
      {
        "name": "requireNonNull",
        "type": "function",
        "signature": "Objects.requireNonNull(value: Object): Object",
        "doc": "Java 17/Android API 35 symbol Objects.requireNonNull."
      },
      {
        "name": "toString",
        "type": "function",
        "signature": "Objects.toString(value: Object): String",
        "doc": "Java 17/Android API 35 symbol Objects.toString."
      }
    ],
    "Paths": [
      {
        "name": "get",
        "type": "function",
        "signature": "Paths.get(first: String, *more: String): Path",
        "doc": "Java 17/Android API 35 symbol Paths.get."
      },
      {
        "name": "get",
        "type": "function",
        "signature": "Paths.get(uri: URI): Path",
        "doc": "Java 17/Android API 35 symbol Paths.get."
      }
    ],
    "Regex": [
      {
        "name": "escape",
        "type": "function",
        "signature": "Regex.escape(literal: String): String",
        "doc": "Kotlin 2.2.21 symbol Regex.escape."
      },
      {
        "name": "escapeReplacement",
        "type": "function",
        "signature": "Regex.escapeReplacement(literal: String): String",
        "doc": "Kotlin 2.2.21 symbol Regex.escapeReplacement."
      },
      {
        "name": "fromLiteral",
        "type": "function",
        "signature": "Regex.fromLiteral(literal: String): Regex",
        "doc": "Kotlin 2.2.21 symbol Regex.fromLiteral."
      }
    ],
    "Result": [
      {
        "name": "failure",
        "type": "function",
        "signature": "Result.failure(exception: Throwable): Result",
        "doc": "Kotlin 2.2.21 symbol Result.failure."
      },
      {
        "name": "success",
        "type": "function",
        "signature": "Result.success(value: Object): Result",
        "doc": "Kotlin 2.2.21 symbol Result.success."
      }
    ],
    "System": [
      {
        "name": "arraycopy",
        "type": "function",
        "signature": "System.arraycopy(src: Object, srcPos: int, dest: Object, destPos: int, length: int): void",
        "doc": "Java 17/Android API 35 symbol System.arraycopy."
      },
      {
        "name": "currentTimeMillis",
        "type": "function",
        "signature": "System.currentTimeMillis(): long",
        "doc": "Java 17/Android API 35 symbol System.currentTimeMillis."
      },
      {
        "name": "err",
        "type": "property",
        "signature": "System.err: PrintStream",
        "doc": "Java 17/Android API 35 symbol System.err."
      },
      {
        "name": "exit",
        "type": "function",
        "signature": "System.exit(status: int): void",
        "doc": "Java 17/Android API 35 symbol System.exit."
      },
      {
        "name": "gc",
        "type": "function",
        "signature": "System.gc(): void",
        "doc": "Java 17/Android API 35 symbol System.gc."
      },
      {
        "name": "getenv",
        "type": "function",
        "signature": "System.getenv(name: String): String",
        "doc": "Java 17/Android API 35 symbol System.getenv."
      },
      {
        "name": "getProperty",
        "type": "function",
        "signature": "System.getProperty(key: String): String",
        "doc": "Java 17/Android API 35 symbol System.getProperty."
      },
      {
        "name": "identityHashCode",
        "type": "function",
        "signature": "System.identityHashCode(value: Object): int",
        "doc": "Java 17/Android API 35 symbol System.identityHashCode."
      },
      {
        "name": "in",
        "type": "property",
        "signature": "System.in: InputStream",
        "doc": "Java 17/Android API 35 symbol System.in."
      },
      {
        "name": "lineSeparator",
        "type": "function",
        "signature": "System.lineSeparator(): String",
        "doc": "Java 17/Android API 35 symbol System.lineSeparator."
      },
      {
        "name": "nanoTime",
        "type": "function",
        "signature": "System.nanoTime(): long",
        "doc": "Java 17/Android API 35 symbol System.nanoTime."
      },
      {
        "name": "out",
        "type": "property",
        "signature": "System.out: PrintStream",
        "doc": "Java 17/Android API 35 symbol System.out."
      },
      {
        "name": "setProperty",
        "type": "function",
        "signature": "System.setProperty(key: String, value: String): String",
        "doc": "Java 17/Android API 35 symbol System.setProperty."
      }
    ],
    "TextUtils": [
      {
        "name": "concat",
        "type": "function",
        "signature": "TextUtils.concat(*text: CharSequence): CharSequence",
        "doc": "Java 17/Android API 35 symbol TextUtils.concat."
      },
      {
        "name": "equals",
        "type": "function",
        "signature": "TextUtils.equals(left: CharSequence, right: CharSequence): boolean",
        "doc": "Java 17/Android API 35 symbol TextUtils.equals."
      },
      {
        "name": "isDigitsOnly",
        "type": "function",
        "signature": "TextUtils.isDigitsOnly(text: CharSequence): boolean",
        "doc": "Java 17/Android API 35 symbol TextUtils.isDigitsOnly."
      },
      {
        "name": "isEmpty",
        "type": "function",
        "signature": "TextUtils.isEmpty(text: CharSequence): boolean",
        "doc": "Java 17/Android API 35 symbol TextUtils.isEmpty."
      },
      {
        "name": "join",
        "type": "function",
        "signature": "TextUtils.join(delimiter: CharSequence, tokens: Iterable): String",
        "doc": "Java 17/Android API 35 symbol TextUtils.join."
      }
    ],
    "Uri": [
      {
        "name": "decode",
        "type": "function",
        "signature": "Uri.decode(value: String): String",
        "doc": "Java 17/Android API 35 symbol Uri.decode."
      },
      {
        "name": "encode",
        "type": "function",
        "signature": "Uri.encode(value: String): String",
        "doc": "Java 17/Android API 35 symbol Uri.encode."
      },
      {
        "name": "fromFile",
        "type": "function",
        "signature": "Uri.fromFile(file: File): Uri",
        "doc": "Java 17/Android API 35 symbol Uri.fromFile."
      },
      {
        "name": "parse",
        "type": "function",
        "signature": "Uri.parse(uriString: String): Uri",
        "doc": "Java 17/Android API 35 symbol Uri.parse."
      },
      {
        "name": "withAppendedPath",
        "type": "function",
        "signature": "Uri.withAppendedPath(baseUri: Uri, pathSegment: String): Uri",
        "doc": "Java 17/Android API 35 symbol Uri.withAppendedPath."
      }
    ],
    "android.content.Context": [
      {
        "name": "applicationContext",
        "type": "property",
        "signature": "android.content.Context.applicationContext: Context",
        "doc": "Java 17/Android API 35 symbol android.content.Context.applicationContext."
      },
      {
        "name": "cacheDir",
        "type": "property",
        "signature": "android.content.Context.cacheDir: File",
        "doc": "Java 17/Android API 35 symbol android.content.Context.cacheDir."
      },
      {
        "name": "filesDir",
        "type": "property",
        "signature": "android.content.Context.filesDir: File",
        "doc": "Java 17/Android API 35 symbol android.content.Context.filesDir."
      },
      {
        "name": "getColor",
        "type": "function",
        "signature": "android.content.Context.getColor(id: int): int",
        "doc": "Java 17/Android API 35 symbol android.content.Context.getColor."
      },
      {
        "name": "getDrawable",
        "type": "function",
        "signature": "android.content.Context.getDrawable(id: int): Drawable",
        "doc": "Java 17/Android API 35 symbol android.content.Context.getDrawable."
      },
      {
        "name": "getString",
        "type": "function",
        "signature": "android.content.Context.getString(id: int): String",
        "doc": "Java 17/Android API 35 symbol android.content.Context.getString."
      },
      {
        "name": "getSystemService",
        "type": "function",
        "signature": "android.content.Context.getSystemService(name: String): Object",
        "doc": "Java 17/Android API 35 symbol android.content.Context.getSystemService."
      },
      {
        "name": "openFileInput",
        "type": "function",
        "signature": "android.content.Context.openFileInput(name: String): FileInputStream",
        "doc": "Java 17/Android API 35 symbol android.content.Context.openFileInput."
      },
      {
        "name": "openFileOutput",
        "type": "function",
        "signature": "android.content.Context.openFileOutput(name: String, mode: int): FileOutputStream",
        "doc": "Java 17/Android API 35 symbol android.content.Context.openFileOutput."
      },
      {
        "name": "packageName",
        "type": "property",
        "signature": "android.content.Context.packageName: String",
        "doc": "Java 17/Android API 35 symbol android.content.Context.packageName."
      },
      {
        "name": "sendBroadcast",
        "type": "function",
        "signature": "android.content.Context.sendBroadcast(intent: Intent): void",
        "doc": "Java 17/Android API 35 symbol android.content.Context.sendBroadcast."
      },
      {
        "name": "startActivity",
        "type": "function",
        "signature": "android.content.Context.startActivity(intent: Intent): void",
        "doc": "Java 17/Android API 35 symbol android.content.Context.startActivity."
      }
    ],
    "android.content.Intent": [
      {
        "name": "action",
        "type": "property",
        "signature": "android.content.Intent.action: String",
        "doc": "Java 17/Android API 35 symbol android.content.Intent.action."
      },
      {
        "name": "addCategory",
        "type": "function",
        "signature": "android.content.Intent.addCategory(category: String): Intent",
        "doc": "Java 17/Android API 35 symbol android.content.Intent.addCategory."
      },
      {
        "name": "addFlags",
        "type": "function",
        "signature": "android.content.Intent.addFlags(flags: int): Intent",
        "doc": "Java 17/Android API 35 symbol android.content.Intent.addFlags."
      },
      {
        "name": "data",
        "type": "property",
        "signature": "android.content.Intent.data: Uri",
        "doc": "Java 17/Android API 35 symbol android.content.Intent.data."
      },
      {
        "name": "extras",
        "type": "property",
        "signature": "android.content.Intent.extras: Bundle",
        "doc": "Java 17/Android API 35 symbol android.content.Intent.extras."
      },
      {
        "name": "flags",
        "type": "property",
        "signature": "android.content.Intent.flags: int",
        "doc": "Java 17/Android API 35 symbol android.content.Intent.flags."
      },
      {
        "name": "getBooleanExtra",
        "type": "function",
        "signature": "android.content.Intent.getBooleanExtra(name: String, defaultValue: boolean): boolean",
        "doc": "Java 17/Android API 35 symbol android.content.Intent.getBooleanExtra."
      },
      {
        "name": "getIntExtra",
        "type": "function",
        "signature": "android.content.Intent.getIntExtra(name: String, defaultValue: int): int",
        "doc": "Java 17/Android API 35 symbol android.content.Intent.getIntExtra."
      },
      {
        "name": "getStringExtra",
        "type": "function",
        "signature": "android.content.Intent.getStringExtra(name: String): String",
        "doc": "Java 17/Android API 35 symbol android.content.Intent.getStringExtra."
      },
      {
        "name": "hasExtra",
        "type": "function",
        "signature": "android.content.Intent.hasExtra(name: String): boolean",
        "doc": "Java 17/Android API 35 symbol android.content.Intent.hasExtra."
      },
      {
        "name": "putExtra",
        "type": "function",
        "signature": "android.content.Intent.putExtra(name: String, value: Object): Intent",
        "doc": "Java 17/Android API 35 symbol android.content.Intent.putExtra."
      },
      {
        "name": "removeExtra",
        "type": "function",
        "signature": "android.content.Intent.removeExtra(name: String): void",
        "doc": "Java 17/Android API 35 symbol android.content.Intent.removeExtra."
      },
      {
        "name": "setAction",
        "type": "function",
        "signature": "android.content.Intent.setAction(action: String): Intent",
        "doc": "Java 17/Android API 35 symbol android.content.Intent.setAction."
      },
      {
        "name": "setClassName",
        "type": "function",
        "signature": "android.content.Intent.setClassName(packageName: String, className: String): Intent",
        "doc": "Java 17/Android API 35 symbol android.content.Intent.setClassName."
      },
      {
        "name": "setData",
        "type": "function",
        "signature": "android.content.Intent.setData(data: Uri): Intent",
        "doc": "Java 17/Android API 35 symbol android.content.Intent.setData."
      },
      {
        "name": "setType",
        "type": "function",
        "signature": "android.content.Intent.setType(type: String): Intent",
        "doc": "Java 17/Android API 35 symbol android.content.Intent.setType."
      }
    ],
    "android.net.Uri#instance": [
      {
        "name": "authority",
        "type": "property",
        "signature": "android.net.Uri#instance.authority: String",
        "doc": "Java 17/Android API 35 symbol android.net.Uri#instance.authority."
      },
      {
        "name": "buildUpon",
        "type": "function",
        "signature": "android.net.Uri#instance.buildUpon(): Builder",
        "doc": "Java 17/Android API 35 symbol android.net.Uri#instance.buildUpon."
      },
      {
        "name": "getQueryParameter",
        "type": "function",
        "signature": "android.net.Uri#instance.getQueryParameter(key: String): String",
        "doc": "Java 17/Android API 35 symbol android.net.Uri#instance.getQueryParameter."
      },
      {
        "name": "host",
        "type": "property",
        "signature": "android.net.Uri#instance.host: String",
        "doc": "Java 17/Android API 35 symbol android.net.Uri#instance.host."
      },
      {
        "name": "lastPathSegment",
        "type": "property",
        "signature": "android.net.Uri#instance.lastPathSegment: String",
        "doc": "Java 17/Android API 35 symbol android.net.Uri#instance.lastPathSegment."
      },
      {
        "name": "normalizeScheme",
        "type": "function",
        "signature": "android.net.Uri#instance.normalizeScheme(): Uri",
        "doc": "Java 17/Android API 35 symbol android.net.Uri#instance.normalizeScheme."
      },
      {
        "name": "path",
        "type": "property",
        "signature": "android.net.Uri#instance.path: String",
        "doc": "Java 17/Android API 35 symbol android.net.Uri#instance.path."
      },
      {
        "name": "scheme",
        "type": "property",
        "signature": "android.net.Uri#instance.scheme: String",
        "doc": "Java 17/Android API 35 symbol android.net.Uri#instance.scheme."
      },
      {
        "name": "toString",
        "type": "function",
        "signature": "android.net.Uri#instance.toString(): String",
        "doc": "Java 17/Android API 35 symbol android.net.Uri#instance.toString."
      }
    ],
    "android.os.Bundle": [
      {
        "name": "clear",
        "type": "function",
        "signature": "android.os.Bundle.clear(): void",
        "doc": "Java 17/Android API 35 symbol android.os.Bundle.clear."
      },
      {
        "name": "containsKey",
        "type": "function",
        "signature": "android.os.Bundle.containsKey(key: String): boolean",
        "doc": "Java 17/Android API 35 symbol android.os.Bundle.containsKey."
      },
      {
        "name": "get",
        "type": "function",
        "signature": "android.os.Bundle.get(key: String): Object",
        "doc": "Java 17/Android API 35 symbol android.os.Bundle.get."
      },
      {
        "name": "getBoolean",
        "type": "function",
        "signature": "android.os.Bundle.getBoolean(key: String, defaultValue: boolean = false): boolean",
        "doc": "Java 17/Android API 35 symbol android.os.Bundle.getBoolean."
      },
      {
        "name": "getInt",
        "type": "function",
        "signature": "android.os.Bundle.getInt(key: String, defaultValue: int = 0): int",
        "doc": "Java 17/Android API 35 symbol android.os.Bundle.getInt."
      },
      {
        "name": "getLong",
        "type": "function",
        "signature": "android.os.Bundle.getLong(key: String, defaultValue: long = 0): long",
        "doc": "Java 17/Android API 35 symbol android.os.Bundle.getLong."
      },
      {
        "name": "getString",
        "type": "function",
        "signature": "android.os.Bundle.getString(key: String): String",
        "doc": "Java 17/Android API 35 symbol android.os.Bundle.getString."
      },
      {
        "name": "isEmpty",
        "type": "function",
        "signature": "android.os.Bundle.isEmpty(): boolean",
        "doc": "Java 17/Android API 35 symbol android.os.Bundle.isEmpty."
      },
      {
        "name": "keySet",
        "type": "function",
        "signature": "android.os.Bundle.keySet(): Set",
        "doc": "Java 17/Android API 35 symbol android.os.Bundle.keySet."
      },
      {
        "name": "putBoolean",
        "type": "function",
        "signature": "android.os.Bundle.putBoolean(key: String, value: boolean): void",
        "doc": "Java 17/Android API 35 symbol android.os.Bundle.putBoolean."
      },
      {
        "name": "putBundle",
        "type": "function",
        "signature": "android.os.Bundle.putBundle(key: String, value: Bundle): void",
        "doc": "Java 17/Android API 35 symbol android.os.Bundle.putBundle."
      },
      {
        "name": "putInt",
        "type": "function",
        "signature": "android.os.Bundle.putInt(key: String, value: int): void",
        "doc": "Java 17/Android API 35 symbol android.os.Bundle.putInt."
      },
      {
        "name": "putLong",
        "type": "function",
        "signature": "android.os.Bundle.putLong(key: String, value: long): void",
        "doc": "Java 17/Android API 35 symbol android.os.Bundle.putLong."
      },
      {
        "name": "putString",
        "type": "function",
        "signature": "android.os.Bundle.putString(key: String, value: String): void",
        "doc": "Java 17/Android API 35 symbol android.os.Bundle.putString."
      },
      {
        "name": "remove",
        "type": "function",
        "signature": "android.os.Bundle.remove(key: String): void",
        "doc": "Java 17/Android API 35 symbol android.os.Bundle.remove."
      },
      {
        "name": "size",
        "type": "function",
        "signature": "android.os.Bundle.size(): int",
        "doc": "Java 17/Android API 35 symbol android.os.Bundle.size."
      }
    ],
    "android.view.View": [
      {
        "name": "alpha",
        "type": "property",
        "signature": "android.view.View.alpha: float",
        "doc": "Java 17/Android API 35 symbol android.view.View.alpha."
      },
      {
        "name": "contentDescription",
        "type": "property",
        "signature": "android.view.View.contentDescription: CharSequence",
        "doc": "Java 17/Android API 35 symbol android.view.View.contentDescription."
      },
      {
        "name": "findViewById",
        "type": "function",
        "signature": "android.view.View.findViewById(id: int): View",
        "doc": "Java 17/Android API 35 symbol android.view.View.findViewById."
      },
      {
        "name": "id",
        "type": "property",
        "signature": "android.view.View.id: int",
        "doc": "Java 17/Android API 35 symbol android.view.View.id."
      },
      {
        "name": "isEnabled",
        "type": "property",
        "signature": "android.view.View.isEnabled: boolean",
        "doc": "Java 17/Android API 35 symbol android.view.View.isEnabled."
      },
      {
        "name": "isSelected",
        "type": "property",
        "signature": "android.view.View.isSelected: boolean",
        "doc": "Java 17/Android API 35 symbol android.view.View.isSelected."
      },
      {
        "name": "performClick",
        "type": "function",
        "signature": "android.view.View.performClick(): boolean",
        "doc": "Java 17/Android API 35 symbol android.view.View.performClick."
      },
      {
        "name": "post",
        "type": "function",
        "signature": "android.view.View.post(action: Runnable): boolean",
        "doc": "Java 17/Android API 35 symbol android.view.View.post."
      },
      {
        "name": "postDelayed",
        "type": "function",
        "signature": "android.view.View.postDelayed(action: Runnable, delayMillis: long): boolean",
        "doc": "Java 17/Android API 35 symbol android.view.View.postDelayed."
      },
      {
        "name": "requestFocus",
        "type": "function",
        "signature": "android.view.View.requestFocus(): boolean",
        "doc": "Java 17/Android API 35 symbol android.view.View.requestFocus."
      },
      {
        "name": "setOnClickListener",
        "type": "function",
        "signature": "android.view.View.setOnClickListener(listener: OnClickListener): void",
        "doc": "Java 17/Android API 35 symbol android.view.View.setOnClickListener."
      },
      {
        "name": "setOnLongClickListener",
        "type": "function",
        "signature": "android.view.View.setOnLongClickListener(listener: OnLongClickListener): void",
        "doc": "Java 17/Android API 35 symbol android.view.View.setOnLongClickListener."
      },
      {
        "name": "visibility",
        "type": "property",
        "signature": "android.view.View.visibility: int",
        "doc": "Java 17/Android API 35 symbol android.view.View.visibility."
      }
    ],
    "java.io.File": [
      {
        "name": "absolutePath",
        "type": "property",
        "signature": "java.io.File.absolutePath: String",
        "doc": "Java 17/Android API 35 symbol java.io.File.absolutePath."
      },
      {
        "name": "delete",
        "type": "function",
        "signature": "java.io.File.delete(): boolean",
        "doc": "Java 17/Android API 35 symbol java.io.File.delete."
      },
      {
        "name": "exists",
        "type": "function",
        "signature": "java.io.File.exists(): boolean",
        "doc": "Java 17/Android API 35 symbol java.io.File.exists."
      },
      {
        "name": "isDirectory",
        "type": "function",
        "signature": "java.io.File.isDirectory(): boolean",
        "doc": "Java 17/Android API 35 symbol java.io.File.isDirectory."
      },
      {
        "name": "isFile",
        "type": "function",
        "signature": "java.io.File.isFile(): boolean",
        "doc": "Java 17/Android API 35 symbol java.io.File.isFile."
      },
      {
        "name": "length",
        "type": "function",
        "signature": "java.io.File.length(): long",
        "doc": "Java 17/Android API 35 symbol java.io.File.length."
      },
      {
        "name": "listFiles",
        "type": "function",
        "signature": "java.io.File.listFiles(): File[]",
        "doc": "Java 17/Android API 35 symbol java.io.File.listFiles."
      },
      {
        "name": "mkdir",
        "type": "function",
        "signature": "java.io.File.mkdir(): boolean",
        "doc": "Java 17/Android API 35 symbol java.io.File.mkdir."
      },
      {
        "name": "mkdirs",
        "type": "function",
        "signature": "java.io.File.mkdirs(): boolean",
        "doc": "Java 17/Android API 35 symbol java.io.File.mkdirs."
      },
      {
        "name": "name",
        "type": "property",
        "signature": "java.io.File.name: String",
        "doc": "Java 17/Android API 35 symbol java.io.File.name."
      },
      {
        "name": "parent",
        "type": "property",
        "signature": "java.io.File.parent: String",
        "doc": "Java 17/Android API 35 symbol java.io.File.parent."
      },
      {
        "name": "renameTo",
        "type": "function",
        "signature": "java.io.File.renameTo(destination: File): boolean",
        "doc": "Java 17/Android API 35 symbol java.io.File.renameTo."
      },
      {
        "name": "toPath",
        "type": "function",
        "signature": "java.io.File.toPath(): Path",
        "doc": "Java 17/Android API 35 symbol java.io.File.toPath."
      }
    ],
    "java.nio.file.Path": [
      {
        "name": "fileName",
        "type": "property",
        "signature": "java.nio.file.Path.fileName: Path",
        "doc": "Java 17/Android API 35 symbol java.nio.file.Path.fileName."
      },
      {
        "name": "isAbsolute",
        "type": "function",
        "signature": "java.nio.file.Path.isAbsolute(): boolean",
        "doc": "Java 17/Android API 35 symbol java.nio.file.Path.isAbsolute."
      },
      {
        "name": "normalize",
        "type": "function",
        "signature": "java.nio.file.Path.normalize(): Path",
        "doc": "Java 17/Android API 35 symbol java.nio.file.Path.normalize."
      },
      {
        "name": "parent",
        "type": "property",
        "signature": "java.nio.file.Path.parent: Path",
        "doc": "Java 17/Android API 35 symbol java.nio.file.Path.parent."
      },
      {
        "name": "relativize",
        "type": "function",
        "signature": "java.nio.file.Path.relativize(other: Path): Path",
        "doc": "Java 17/Android API 35 symbol java.nio.file.Path.relativize."
      },
      {
        "name": "resolve",
        "type": "function",
        "signature": "java.nio.file.Path.resolve(other: Path): Path",
        "doc": "Java 17/Android API 35 symbol java.nio.file.Path.resolve."
      },
      {
        "name": "resolveSibling",
        "type": "function",
        "signature": "java.nio.file.Path.resolveSibling(other: Path): Path",
        "doc": "Java 17/Android API 35 symbol java.nio.file.Path.resolveSibling."
      },
      {
        "name": "root",
        "type": "property",
        "signature": "java.nio.file.Path.root: Path",
        "doc": "Java 17/Android API 35 symbol java.nio.file.Path.root."
      },
      {
        "name": "toAbsolutePath",
        "type": "function",
        "signature": "java.nio.file.Path.toAbsolutePath(): Path",
        "doc": "Java 17/Android API 35 symbol java.nio.file.Path.toAbsolutePath."
      },
      {
        "name": "toFile",
        "type": "function",
        "signature": "java.nio.file.Path.toFile(): File",
        "doc": "Java 17/Android API 35 symbol java.nio.file.Path.toFile."
      },
      {
        "name": "toUri",
        "type": "function",
        "signature": "java.nio.file.Path.toUri(): URI",
        "doc": "Java 17/Android API 35 symbol java.nio.file.Path.toUri."
      }
    ],
    "java.util.ArrayList": [
      {
        "name": "add",
        "type": "function",
        "signature": "java.util.ArrayList.add(element: Object): boolean",
        "doc": "Java 17/Android API 35 symbol java.util.ArrayList.add."
      },
      {
        "name": "add",
        "type": "function",
        "signature": "java.util.ArrayList.add(index: int, element: Object): void",
        "doc": "Java 17/Android API 35 symbol java.util.ArrayList.add."
      },
      {
        "name": "addAll",
        "type": "function",
        "signature": "java.util.ArrayList.addAll(elements: Collection): boolean",
        "doc": "Java 17/Android API 35 symbol java.util.ArrayList.addAll."
      },
      {
        "name": "clear",
        "type": "function",
        "signature": "java.util.ArrayList.clear(): void",
        "doc": "Java 17/Android API 35 symbol java.util.ArrayList.clear."
      },
      {
        "name": "contains",
        "type": "function",
        "signature": "java.util.ArrayList.contains(element: Object): boolean",
        "doc": "Java 17/Android API 35 symbol java.util.ArrayList.contains."
      },
      {
        "name": "get",
        "type": "function",
        "signature": "java.util.ArrayList.get(index: int): Object",
        "doc": "Java 17/Android API 35 symbol java.util.ArrayList.get."
      },
      {
        "name": "indexOf",
        "type": "function",
        "signature": "java.util.ArrayList.indexOf(element: Object): int",
        "doc": "Java 17/Android API 35 symbol java.util.ArrayList.indexOf."
      },
      {
        "name": "isEmpty",
        "type": "function",
        "signature": "java.util.ArrayList.isEmpty(): boolean",
        "doc": "Java 17/Android API 35 symbol java.util.ArrayList.isEmpty."
      },
      {
        "name": "iterator",
        "type": "function",
        "signature": "java.util.ArrayList.iterator(): Iterator",
        "doc": "Java 17/Android API 35 symbol java.util.ArrayList.iterator."
      },
      {
        "name": "remove",
        "type": "function",
        "signature": "java.util.ArrayList.remove(index: int): Object",
        "doc": "Java 17/Android API 35 symbol java.util.ArrayList.remove."
      },
      {
        "name": "set",
        "type": "function",
        "signature": "java.util.ArrayList.set(index: int, element: Object): Object",
        "doc": "Java 17/Android API 35 symbol java.util.ArrayList.set."
      },
      {
        "name": "size",
        "type": "function",
        "signature": "java.util.ArrayList.size(): int",
        "doc": "Java 17/Android API 35 symbol java.util.ArrayList.size."
      },
      {
        "name": "sort",
        "type": "function",
        "signature": "java.util.ArrayList.sort(comparator: Comparator): void",
        "doc": "Java 17/Android API 35 symbol java.util.ArrayList.sort."
      },
      {
        "name": "subList",
        "type": "function",
        "signature": "java.util.ArrayList.subList(fromIndex: int, toIndex: int): List",
        "doc": "Java 17/Android API 35 symbol java.util.ArrayList.subList."
      },
      {
        "name": "toArray",
        "type": "function",
        "signature": "java.util.ArrayList.toArray(): Object[]",
        "doc": "Java 17/Android API 35 symbol java.util.ArrayList.toArray."
      }
    ],
    "java.util.HashMap": [
      {
        "name": "clear",
        "type": "function",
        "signature": "java.util.HashMap.clear(): void",
        "doc": "Java 17/Android API 35 symbol java.util.HashMap.clear."
      },
      {
        "name": "containsKey",
        "type": "function",
        "signature": "java.util.HashMap.containsKey(key: Object): boolean",
        "doc": "Java 17/Android API 35 symbol java.util.HashMap.containsKey."
      },
      {
        "name": "containsValue",
        "type": "function",
        "signature": "java.util.HashMap.containsValue(value: Object): boolean",
        "doc": "Java 17/Android API 35 symbol java.util.HashMap.containsValue."
      },
      {
        "name": "entrySet",
        "type": "function",
        "signature": "java.util.HashMap.entrySet(): Set",
        "doc": "Java 17/Android API 35 symbol java.util.HashMap.entrySet."
      },
      {
        "name": "get",
        "type": "function",
        "signature": "java.util.HashMap.get(key: Object): Object",
        "doc": "Java 17/Android API 35 symbol java.util.HashMap.get."
      },
      {
        "name": "getOrDefault",
        "type": "function",
        "signature": "java.util.HashMap.getOrDefault(key: Object, defaultValue: Object): Object",
        "doc": "Java 17/Android API 35 symbol java.util.HashMap.getOrDefault."
      },
      {
        "name": "isEmpty",
        "type": "function",
        "signature": "java.util.HashMap.isEmpty(): boolean",
        "doc": "Java 17/Android API 35 symbol java.util.HashMap.isEmpty."
      },
      {
        "name": "keySet",
        "type": "function",
        "signature": "java.util.HashMap.keySet(): Set",
        "doc": "Java 17/Android API 35 symbol java.util.HashMap.keySet."
      },
      {
        "name": "put",
        "type": "function",
        "signature": "java.util.HashMap.put(key: Object, value: Object): Object",
        "doc": "Java 17/Android API 35 symbol java.util.HashMap.put."
      },
      {
        "name": "putAll",
        "type": "function",
        "signature": "java.util.HashMap.putAll(map: Map): void",
        "doc": "Java 17/Android API 35 symbol java.util.HashMap.putAll."
      },
      {
        "name": "putIfAbsent",
        "type": "function",
        "signature": "java.util.HashMap.putIfAbsent(key: Object, value: Object): Object",
        "doc": "Java 17/Android API 35 symbol java.util.HashMap.putIfAbsent."
      },
      {
        "name": "remove",
        "type": "function",
        "signature": "java.util.HashMap.remove(key: Object): Object",
        "doc": "Java 17/Android API 35 symbol java.util.HashMap.remove."
      },
      {
        "name": "replace",
        "type": "function",
        "signature": "java.util.HashMap.replace(key: Object, value: Object): Object",
        "doc": "Java 17/Android API 35 symbol java.util.HashMap.replace."
      },
      {
        "name": "size",
        "type": "function",
        "signature": "java.util.HashMap.size(): int",
        "doc": "Java 17/Android API 35 symbol java.util.HashMap.size."
      },
      {
        "name": "values",
        "type": "function",
        "signature": "java.util.HashMap.values(): Collection",
        "doc": "Java 17/Android API 35 symbol java.util.HashMap.values."
      }
    ],
    "kotlin": [
      {
        "name": "arrayOf",
        "type": "function",
        "signature": "kotlin.arrayOf(*elements: Object): Array",
        "doc": "Kotlin 2.2.21 symbol kotlin.arrayOf."
      },
      {
        "name": "assert",
        "type": "function",
        "signature": "kotlin.assert(value: Boolean, lazyMessage: function = default): Unit",
        "doc": "Kotlin 2.2.21 symbol kotlin.assert."
      },
      {
        "name": "check",
        "type": "function",
        "signature": "kotlin.check(value: Boolean): Unit",
        "doc": "Kotlin 2.2.21 symbol kotlin.check."
      },
      {
        "name": "checkNotNull",
        "type": "function",
        "signature": "kotlin.checkNotNull(value: Object): Object",
        "doc": "Kotlin 2.2.21 symbol kotlin.checkNotNull."
      },
      {
        "name": "error",
        "type": "function",
        "signature": "kotlin.error(message: Object): Nothing",
        "doc": "Kotlin 2.2.21 symbol kotlin.error."
      },
      {
        "name": "lazy",
        "type": "function",
        "signature": "kotlin.lazy(initializer: function): Lazy",
        "doc": "Kotlin 2.2.21 symbol kotlin.lazy."
      },
      {
        "name": "require",
        "type": "function",
        "signature": "kotlin.require(value: Boolean): Unit",
        "doc": "Kotlin 2.2.21 symbol kotlin.require."
      },
      {
        "name": "requireNotNull",
        "type": "function",
        "signature": "kotlin.requireNotNull(value: Object): Object",
        "doc": "Kotlin 2.2.21 symbol kotlin.requireNotNull."
      },
      {
        "name": "runCatching",
        "type": "function",
        "signature": "kotlin.runCatching(block: function): Result",
        "doc": "Kotlin 2.2.21 symbol kotlin.runCatching."
      },
      {
        "name": "TODO",
        "type": "function",
        "signature": "kotlin.TODO(reason: String = ''): Nothing",
        "doc": "Kotlin 2.2.21 symbol kotlin.TODO."
      }
    ],
    "kotlin.Array": [
      {
        "name": "all",
        "type": "function",
        "signature": "kotlin.Array.all(predicate: function): Boolean",
        "doc": "Kotlin 2.2.21 symbol kotlin.Array.all."
      },
      {
        "name": "any",
        "type": "function",
        "signature": "kotlin.Array.any(predicate: function): Boolean",
        "doc": "Kotlin 2.2.21 symbol kotlin.Array.any."
      },
      {
        "name": "contains",
        "type": "function",
        "signature": "kotlin.Array.contains(element: Object): Boolean",
        "doc": "Kotlin 2.2.21 symbol kotlin.Array.contains."
      },
      {
        "name": "filter",
        "type": "function",
        "signature": "kotlin.Array.filter(predicate: function): List",
        "doc": "Kotlin 2.2.21 symbol kotlin.Array.filter."
      },
      {
        "name": "find",
        "type": "function",
        "signature": "kotlin.Array.find(predicate: function): Object",
        "doc": "Kotlin 2.2.21 symbol kotlin.Array.find."
      },
      {
        "name": "first",
        "type": "function",
        "signature": "kotlin.Array.first(): Object",
        "doc": "Kotlin 2.2.21 symbol kotlin.Array.first."
      },
      {
        "name": "forEach",
        "type": "function",
        "signature": "kotlin.Array.forEach(action: function): Unit",
        "doc": "Kotlin 2.2.21 symbol kotlin.Array.forEach."
      },
      {
        "name": "get",
        "type": "function",
        "signature": "kotlin.Array.get(index: Int): Object",
        "doc": "Kotlin 2.2.21 symbol kotlin.Array.get."
      },
      {
        "name": "indices",
        "type": "property",
        "signature": "kotlin.Array.indices: IntRange",
        "doc": "Kotlin 2.2.21 symbol kotlin.Array.indices."
      },
      {
        "name": "isEmpty",
        "type": "function",
        "signature": "kotlin.Array.isEmpty(): Boolean",
        "doc": "Kotlin 2.2.21 symbol kotlin.Array.isEmpty."
      },
      {
        "name": "joinToString",
        "type": "function",
        "signature": "kotlin.Array.joinToString(separator: CharSequence = ', '): String",
        "doc": "Kotlin 2.2.21 symbol kotlin.Array.joinToString."
      },
      {
        "name": "last",
        "type": "function",
        "signature": "kotlin.Array.last(): Object",
        "doc": "Kotlin 2.2.21 symbol kotlin.Array.last."
      },
      {
        "name": "lastIndex",
        "type": "property",
        "signature": "kotlin.Array.lastIndex: Int",
        "doc": "Kotlin 2.2.21 symbol kotlin.Array.lastIndex."
      },
      {
        "name": "map",
        "type": "function",
        "signature": "kotlin.Array.map(transform: function): List",
        "doc": "Kotlin 2.2.21 symbol kotlin.Array.map."
      },
      {
        "name": "set",
        "type": "function",
        "signature": "kotlin.Array.set(index: Int, value: Object): Unit",
        "doc": "Kotlin 2.2.21 symbol kotlin.Array.set."
      },
      {
        "name": "size",
        "type": "property",
        "signature": "kotlin.Array.size: Int",
        "doc": "Kotlin 2.2.21 symbol kotlin.Array.size."
      },
      {
        "name": "sorted",
        "type": "function",
        "signature": "kotlin.Array.sorted(): List",
        "doc": "Kotlin 2.2.21 symbol kotlin.Array.sorted."
      },
      {
        "name": "toList",
        "type": "function",
        "signature": "kotlin.Array.toList(): List",
        "doc": "Kotlin 2.2.21 symbol kotlin.Array.toList."
      }
    ],
    "kotlin.Boolean": [
      {
        "name": "and",
        "type": "function",
        "signature": "kotlin.Boolean.and(other: Boolean): Boolean",
        "doc": "Kotlin 2.2.21 symbol kotlin.Boolean.and."
      },
      {
        "name": "not",
        "type": "function",
        "signature": "kotlin.Boolean.not(): Boolean",
        "doc": "Kotlin 2.2.21 symbol kotlin.Boolean.not."
      },
      {
        "name": "or",
        "type": "function",
        "signature": "kotlin.Boolean.or(other: Boolean): Boolean",
        "doc": "Kotlin 2.2.21 symbol kotlin.Boolean.or."
      },
      {
        "name": "toString",
        "type": "function",
        "signature": "kotlin.Boolean.toString(): String",
        "doc": "Kotlin 2.2.21 symbol kotlin.Boolean.toString."
      },
      {
        "name": "xor",
        "type": "function",
        "signature": "kotlin.Boolean.xor(other: Boolean): Boolean",
        "doc": "Kotlin 2.2.21 symbol kotlin.Boolean.xor."
      }
    ],
    "kotlin.Double": [
      {
        "name": "absoluteValue",
        "type": "property",
        "signature": "kotlin.Double.absoluteValue: Double",
        "doc": "Kotlin 2.2.21 symbol kotlin.Double.absoluteValue."
      },
      {
        "name": "isFinite",
        "type": "function",
        "signature": "kotlin.Double.isFinite(): Boolean",
        "doc": "Kotlin 2.2.21 symbol kotlin.Double.isFinite."
      },
      {
        "name": "isInfinite",
        "type": "function",
        "signature": "kotlin.Double.isInfinite(): Boolean",
        "doc": "Kotlin 2.2.21 symbol kotlin.Double.isInfinite."
      },
      {
        "name": "isNaN",
        "type": "function",
        "signature": "kotlin.Double.isNaN(): Boolean",
        "doc": "Kotlin 2.2.21 symbol kotlin.Double.isNaN."
      },
      {
        "name": "roundToInt",
        "type": "function",
        "signature": "kotlin.Double.roundToInt(): Int",
        "doc": "Kotlin 2.2.21 symbol kotlin.Double.roundToInt."
      },
      {
        "name": "roundToLong",
        "type": "function",
        "signature": "kotlin.Double.roundToLong(): Long",
        "doc": "Kotlin 2.2.21 symbol kotlin.Double.roundToLong."
      },
      {
        "name": "toInt",
        "type": "function",
        "signature": "kotlin.Double.toInt(): Int",
        "doc": "Kotlin 2.2.21 symbol kotlin.Double.toInt."
      },
      {
        "name": "toLong",
        "type": "function",
        "signature": "kotlin.Double.toLong(): Long",
        "doc": "Kotlin 2.2.21 symbol kotlin.Double.toLong."
      },
      {
        "name": "toString",
        "type": "function",
        "signature": "kotlin.Double.toString(): String",
        "doc": "Kotlin 2.2.21 symbol kotlin.Double.toString."
      }
    ],
    "kotlin.Int": [
      {
        "name": "absoluteValue",
        "type": "property",
        "signature": "kotlin.Int.absoluteValue: Int",
        "doc": "Kotlin 2.2.21 symbol kotlin.Int.absoluteValue."
      },
      {
        "name": "coerceAtLeast",
        "type": "function",
        "signature": "kotlin.Int.coerceAtLeast(minimumValue: Int): Int",
        "doc": "Kotlin 2.2.21 symbol kotlin.Int.coerceAtLeast."
      },
      {
        "name": "coerceAtMost",
        "type": "function",
        "signature": "kotlin.Int.coerceAtMost(maximumValue: Int): Int",
        "doc": "Kotlin 2.2.21 symbol kotlin.Int.coerceAtMost."
      },
      {
        "name": "coerceIn",
        "type": "function",
        "signature": "kotlin.Int.coerceIn(minimumValue: Int, maximumValue: Int): Int",
        "doc": "Kotlin 2.2.21 symbol kotlin.Int.coerceIn."
      },
      {
        "name": "downTo",
        "type": "function",
        "signature": "kotlin.Int.downTo(to: Int): IntProgression",
        "doc": "Kotlin 2.2.21 symbol kotlin.Int.downTo."
      },
      {
        "name": "toDouble",
        "type": "function",
        "signature": "kotlin.Int.toDouble(): Double",
        "doc": "Kotlin 2.2.21 symbol kotlin.Int.toDouble."
      },
      {
        "name": "toLong",
        "type": "function",
        "signature": "kotlin.Int.toLong(): Long",
        "doc": "Kotlin 2.2.21 symbol kotlin.Int.toLong."
      },
      {
        "name": "toString",
        "type": "function",
        "signature": "kotlin.Int.toString(radix: Int = 10): String",
        "doc": "Kotlin 2.2.21 symbol kotlin.Int.toString."
      },
      {
        "name": "until",
        "type": "function",
        "signature": "kotlin.Int.until(to: Int): IntRange",
        "doc": "Kotlin 2.2.21 symbol kotlin.Int.until."
      }
    ],
    "kotlin.Long": [
      {
        "name": "absoluteValue",
        "type": "property",
        "signature": "kotlin.Long.absoluteValue: Long",
        "doc": "Kotlin 2.2.21 symbol kotlin.Long.absoluteValue."
      },
      {
        "name": "coerceAtLeast",
        "type": "function",
        "signature": "kotlin.Long.coerceAtLeast(minimumValue: Long): Long",
        "doc": "Kotlin 2.2.21 symbol kotlin.Long.coerceAtLeast."
      },
      {
        "name": "coerceAtMost",
        "type": "function",
        "signature": "kotlin.Long.coerceAtMost(maximumValue: Long): Long",
        "doc": "Kotlin 2.2.21 symbol kotlin.Long.coerceAtMost."
      },
      {
        "name": "toDouble",
        "type": "function",
        "signature": "kotlin.Long.toDouble(): Double",
        "doc": "Kotlin 2.2.21 symbol kotlin.Long.toDouble."
      },
      {
        "name": "toInt",
        "type": "function",
        "signature": "kotlin.Long.toInt(): Int",
        "doc": "Kotlin 2.2.21 symbol kotlin.Long.toInt."
      },
      {
        "name": "toString",
        "type": "function",
        "signature": "kotlin.Long.toString(radix: Int = 10): String",
        "doc": "Kotlin 2.2.21 symbol kotlin.Long.toString."
      }
    ],
    "kotlin.String": [
      {
        "name": "capitalize",
        "type": "function",
        "signature": "kotlin.String.capitalize(): String",
        "doc": "Kotlin 2.2.21 symbol kotlin.String.capitalize."
      },
      {
        "name": "contains",
        "type": "function",
        "signature": "kotlin.String.contains(other: CharSequence, ignoreCase: Boolean = false): Boolean",
        "doc": "Kotlin 2.2.21 symbol kotlin.String.contains."
      },
      {
        "name": "endsWith",
        "type": "function",
        "signature": "kotlin.String.endsWith(suffix: String, ignoreCase: Boolean = false): Boolean",
        "doc": "Kotlin 2.2.21 symbol kotlin.String.endsWith."
      },
      {
        "name": "isBlank",
        "type": "function",
        "signature": "kotlin.String.isBlank(): Boolean",
        "doc": "Kotlin 2.2.21 symbol kotlin.String.isBlank."
      },
      {
        "name": "isEmpty",
        "type": "function",
        "signature": "kotlin.String.isEmpty(): Boolean",
        "doc": "Kotlin 2.2.21 symbol kotlin.String.isEmpty."
      },
      {
        "name": "length",
        "type": "property",
        "signature": "kotlin.String.length: Int",
        "doc": "Kotlin 2.2.21 symbol kotlin.String.length."
      },
      {
        "name": "lowercase",
        "type": "function",
        "signature": "kotlin.String.lowercase(): String",
        "doc": "Kotlin 2.2.21 symbol kotlin.String.lowercase."
      },
      {
        "name": "removePrefix",
        "type": "function",
        "signature": "kotlin.String.removePrefix(prefix: CharSequence): String",
        "doc": "Kotlin 2.2.21 symbol kotlin.String.removePrefix."
      },
      {
        "name": "removeSuffix",
        "type": "function",
        "signature": "kotlin.String.removeSuffix(suffix: CharSequence): String",
        "doc": "Kotlin 2.2.21 symbol kotlin.String.removeSuffix."
      },
      {
        "name": "replace",
        "type": "function",
        "signature": "kotlin.String.replace(oldValue: String, newValue: String, ignoreCase: Boolean = false): String",
        "doc": "Kotlin 2.2.21 symbol kotlin.String.replace."
      },
      {
        "name": "split",
        "type": "function",
        "signature": "kotlin.String.split(*delimiters: String): List",
        "doc": "Kotlin 2.2.21 symbol kotlin.String.split."
      },
      {
        "name": "startsWith",
        "type": "function",
        "signature": "kotlin.String.startsWith(prefix: String, ignoreCase: Boolean = false): Boolean",
        "doc": "Kotlin 2.2.21 symbol kotlin.String.startsWith."
      },
      {
        "name": "substring",
        "type": "function",
        "signature": "kotlin.String.substring(startIndex: Int, endIndex: Int = length): String",
        "doc": "Kotlin 2.2.21 symbol kotlin.String.substring."
      },
      {
        "name": "toBooleanStrictOrNull",
        "type": "function",
        "signature": "kotlin.String.toBooleanStrictOrNull(): Boolean",
        "doc": "Kotlin 2.2.21 symbol kotlin.String.toBooleanStrictOrNull."
      },
      {
        "name": "toDoubleOrNull",
        "type": "function",
        "signature": "kotlin.String.toDoubleOrNull(): Double",
        "doc": "Kotlin 2.2.21 symbol kotlin.String.toDoubleOrNull."
      },
      {
        "name": "toIntOrNull",
        "type": "function",
        "signature": "kotlin.String.toIntOrNull(radix: Int = 10): Int",
        "doc": "Kotlin 2.2.21 symbol kotlin.String.toIntOrNull."
      },
      {
        "name": "toLongOrNull",
        "type": "function",
        "signature": "kotlin.String.toLongOrNull(radix: Int = 10): Long",
        "doc": "Kotlin 2.2.21 symbol kotlin.String.toLongOrNull."
      },
      {
        "name": "trim",
        "type": "function",
        "signature": "kotlin.String.trim(): String",
        "doc": "Kotlin 2.2.21 symbol kotlin.String.trim."
      },
      {
        "name": "trimIndent",
        "type": "function",
        "signature": "kotlin.String.trimIndent(): String",
        "doc": "Kotlin 2.2.21 symbol kotlin.String.trimIndent."
      },
      {
        "name": "uppercase",
        "type": "function",
        "signature": "kotlin.String.uppercase(): String",
        "doc": "Kotlin 2.2.21 symbol kotlin.String.uppercase."
      }
    ],
    "kotlin.collections": [
      {
        "name": "arrayListOf",
        "type": "function",
        "signature": "kotlin.collections.arrayListOf(*elements: Object): ArrayList",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.arrayListOf."
      },
      {
        "name": "buildList",
        "type": "function",
        "signature": "kotlin.collections.buildList(builderAction: function): List",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.buildList."
      },
      {
        "name": "buildMap",
        "type": "function",
        "signature": "kotlin.collections.buildMap(builderAction: function): Map",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.buildMap."
      },
      {
        "name": "buildSet",
        "type": "function",
        "signature": "kotlin.collections.buildSet(builderAction: function): Set",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.buildSet."
      },
      {
        "name": "emptyList",
        "type": "function",
        "signature": "kotlin.collections.emptyList(): List",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.emptyList."
      },
      {
        "name": "emptyMap",
        "type": "function",
        "signature": "kotlin.collections.emptyMap(): Map",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.emptyMap."
      },
      {
        "name": "emptySet",
        "type": "function",
        "signature": "kotlin.collections.emptySet(): Set",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.emptySet."
      },
      {
        "name": "hashMapOf",
        "type": "function",
        "signature": "kotlin.collections.hashMapOf(*pairs: Pair): HashMap",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.hashMapOf."
      },
      {
        "name": "hashSetOf",
        "type": "function",
        "signature": "kotlin.collections.hashSetOf(*elements: Object): HashSet",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.hashSetOf."
      },
      {
        "name": "listOf",
        "type": "function",
        "signature": "kotlin.collections.listOf(*elements: Object): List",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.listOf."
      },
      {
        "name": "mapOf",
        "type": "function",
        "signature": "kotlin.collections.mapOf(*pairs: Pair): Map",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.mapOf."
      },
      {
        "name": "mutableListOf",
        "type": "function",
        "signature": "kotlin.collections.mutableListOf(*elements: Object): MutableList",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.mutableListOf."
      },
      {
        "name": "mutableMapOf",
        "type": "function",
        "signature": "kotlin.collections.mutableMapOf(*pairs: Pair): MutableMap",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.mutableMapOf."
      },
      {
        "name": "mutableSetOf",
        "type": "function",
        "signature": "kotlin.collections.mutableSetOf(*elements: Object): MutableSet",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.mutableSetOf."
      },
      {
        "name": "setOf",
        "type": "function",
        "signature": "kotlin.collections.setOf(*elements: Object): Set",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.setOf."
      }
    ],
    "kotlin.collections.List": [
      {
        "name": "all",
        "type": "function",
        "signature": "kotlin.collections.List.all(predicate: function): Boolean",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.List.all."
      },
      {
        "name": "any",
        "type": "function",
        "signature": "kotlin.collections.List.any(predicate: function): Boolean",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.List.any."
      },
      {
        "name": "associate",
        "type": "function",
        "signature": "kotlin.collections.List.associate(transform: function): Map",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.List.associate."
      },
      {
        "name": "contains",
        "type": "function",
        "signature": "kotlin.collections.List.contains(element: Object): Boolean",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.List.contains."
      },
      {
        "name": "distinct",
        "type": "function",
        "signature": "kotlin.collections.List.distinct(): List",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.List.distinct."
      },
      {
        "name": "filter",
        "type": "function",
        "signature": "kotlin.collections.List.filter(predicate: function): List",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.List.filter."
      },
      {
        "name": "find",
        "type": "function",
        "signature": "kotlin.collections.List.find(predicate: function): Object",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.List.find."
      },
      {
        "name": "first",
        "type": "function",
        "signature": "kotlin.collections.List.first(): Object",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.List.first."
      },
      {
        "name": "firstOrNull",
        "type": "function",
        "signature": "kotlin.collections.List.firstOrNull(): Object",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.List.firstOrNull."
      },
      {
        "name": "flatMap",
        "type": "function",
        "signature": "kotlin.collections.List.flatMap(transform: function): List",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.List.flatMap."
      },
      {
        "name": "forEach",
        "type": "function",
        "signature": "kotlin.collections.List.forEach(action: function): Unit",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.List.forEach."
      },
      {
        "name": "get",
        "type": "function",
        "signature": "kotlin.collections.List.get(index: Int): Object",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.List.get."
      },
      {
        "name": "groupBy",
        "type": "function",
        "signature": "kotlin.collections.List.groupBy(keySelector: function): Map",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.List.groupBy."
      },
      {
        "name": "indexOf",
        "type": "function",
        "signature": "kotlin.collections.List.indexOf(element: Object): Int",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.List.indexOf."
      },
      {
        "name": "indices",
        "type": "property",
        "signature": "kotlin.collections.List.indices: IntRange",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.List.indices."
      },
      {
        "name": "isEmpty",
        "type": "function",
        "signature": "kotlin.collections.List.isEmpty(): Boolean",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.List.isEmpty."
      },
      {
        "name": "joinToString",
        "type": "function",
        "signature": "kotlin.collections.List.joinToString(separator: CharSequence = ', '): String",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.List.joinToString."
      },
      {
        "name": "last",
        "type": "function",
        "signature": "kotlin.collections.List.last(): Object",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.List.last."
      },
      {
        "name": "lastIndex",
        "type": "property",
        "signature": "kotlin.collections.List.lastIndex: Int",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.List.lastIndex."
      },
      {
        "name": "lastOrNull",
        "type": "function",
        "signature": "kotlin.collections.List.lastOrNull(): Object",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.List.lastOrNull."
      },
      {
        "name": "map",
        "type": "function",
        "signature": "kotlin.collections.List.map(transform: function): List",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.List.map."
      },
      {
        "name": "size",
        "type": "property",
        "signature": "kotlin.collections.List.size: Int",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.List.size."
      },
      {
        "name": "sorted",
        "type": "function",
        "signature": "kotlin.collections.List.sorted(): List",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.List.sorted."
      },
      {
        "name": "sortedBy",
        "type": "function",
        "signature": "kotlin.collections.List.sortedBy(selector: function): List",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.List.sortedBy."
      },
      {
        "name": "take",
        "type": "function",
        "signature": "kotlin.collections.List.take(count: Int): List",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.List.take."
      },
      {
        "name": "toMutableList",
        "type": "function",
        "signature": "kotlin.collections.List.toMutableList(): MutableList",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.List.toMutableList."
      },
      {
        "name": "zip",
        "type": "function",
        "signature": "kotlin.collections.List.zip(other: Iterable): List",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.List.zip."
      }
    ],
    "kotlin.collections.Map": [
      {
        "name": "all",
        "type": "function",
        "signature": "kotlin.collections.Map.all(predicate: function): Boolean",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.Map.all."
      },
      {
        "name": "any",
        "type": "function",
        "signature": "kotlin.collections.Map.any(predicate: function): Boolean",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.Map.any."
      },
      {
        "name": "containsKey",
        "type": "function",
        "signature": "kotlin.collections.Map.containsKey(key: Object): Boolean",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.Map.containsKey."
      },
      {
        "name": "containsValue",
        "type": "function",
        "signature": "kotlin.collections.Map.containsValue(value: Object): Boolean",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.Map.containsValue."
      },
      {
        "name": "entries",
        "type": "property",
        "signature": "kotlin.collections.Map.entries: Set",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.Map.entries."
      },
      {
        "name": "filter",
        "type": "function",
        "signature": "kotlin.collections.Map.filter(predicate: function): Map",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.Map.filter."
      },
      {
        "name": "forEach",
        "type": "function",
        "signature": "kotlin.collections.Map.forEach(action: function): Unit",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.Map.forEach."
      },
      {
        "name": "get",
        "type": "function",
        "signature": "kotlin.collections.Map.get(key: Object): Object",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.Map.get."
      },
      {
        "name": "getOrDefault",
        "type": "function",
        "signature": "kotlin.collections.Map.getOrDefault(key: Object, defaultValue: Object): Object",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.Map.getOrDefault."
      },
      {
        "name": "isEmpty",
        "type": "function",
        "signature": "kotlin.collections.Map.isEmpty(): Boolean",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.Map.isEmpty."
      },
      {
        "name": "keys",
        "type": "property",
        "signature": "kotlin.collections.Map.keys: Set",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.Map.keys."
      },
      {
        "name": "map",
        "type": "function",
        "signature": "kotlin.collections.Map.map(transform: function): List",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.Map.map."
      },
      {
        "name": "mapKeys",
        "type": "function",
        "signature": "kotlin.collections.Map.mapKeys(transform: function): Map",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.Map.mapKeys."
      },
      {
        "name": "mapValues",
        "type": "function",
        "signature": "kotlin.collections.Map.mapValues(transform: function): Map",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.Map.mapValues."
      },
      {
        "name": "size",
        "type": "property",
        "signature": "kotlin.collections.Map.size: Int",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.Map.size."
      },
      {
        "name": "toList",
        "type": "function",
        "signature": "kotlin.collections.Map.toList(): List",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.Map.toList."
      },
      {
        "name": "toMutableMap",
        "type": "function",
        "signature": "kotlin.collections.Map.toMutableMap(): MutableMap",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.Map.toMutableMap."
      },
      {
        "name": "values",
        "type": "property",
        "signature": "kotlin.collections.Map.values: Collection",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.Map.values."
      }
    ],
    "kotlin.collections.MutableList": [
      {
        "name": "add",
        "type": "function",
        "signature": "kotlin.collections.MutableList.add(element: Object): Boolean",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.MutableList.add."
      },
      {
        "name": "add",
        "type": "function",
        "signature": "kotlin.collections.MutableList.add(index: Int, element: Object): Unit",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.MutableList.add."
      },
      {
        "name": "addAll",
        "type": "function",
        "signature": "kotlin.collections.MutableList.addAll(elements: Collection): Boolean",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.MutableList.addAll."
      },
      {
        "name": "clear",
        "type": "function",
        "signature": "kotlin.collections.MutableList.clear(): Unit",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.MutableList.clear."
      },
      {
        "name": "contains",
        "type": "function",
        "signature": "kotlin.collections.MutableList.contains(element: Object): Boolean",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.MutableList.contains."
      },
      {
        "name": "filter",
        "type": "function",
        "signature": "kotlin.collections.MutableList.filter(predicate: function): List",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.MutableList.filter."
      },
      {
        "name": "first",
        "type": "function",
        "signature": "kotlin.collections.MutableList.first(): Object",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.MutableList.first."
      },
      {
        "name": "forEach",
        "type": "function",
        "signature": "kotlin.collections.MutableList.forEach(action: function): Unit",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.MutableList.forEach."
      },
      {
        "name": "get",
        "type": "function",
        "signature": "kotlin.collections.MutableList.get(index: Int): Object",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.MutableList.get."
      },
      {
        "name": "indices",
        "type": "property",
        "signature": "kotlin.collections.MutableList.indices: IntRange",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.MutableList.indices."
      },
      {
        "name": "isEmpty",
        "type": "function",
        "signature": "kotlin.collections.MutableList.isEmpty(): Boolean",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.MutableList.isEmpty."
      },
      {
        "name": "joinToString",
        "type": "function",
        "signature": "kotlin.collections.MutableList.joinToString(separator: CharSequence = ', '): String",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.MutableList.joinToString."
      },
      {
        "name": "lastIndex",
        "type": "property",
        "signature": "kotlin.collections.MutableList.lastIndex: Int",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.MutableList.lastIndex."
      },
      {
        "name": "map",
        "type": "function",
        "signature": "kotlin.collections.MutableList.map(transform: function): List",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.MutableList.map."
      },
      {
        "name": "remove",
        "type": "function",
        "signature": "kotlin.collections.MutableList.remove(element: Object): Boolean",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.MutableList.remove."
      },
      {
        "name": "removeAt",
        "type": "function",
        "signature": "kotlin.collections.MutableList.removeAt(index: Int): Object",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.MutableList.removeAt."
      },
      {
        "name": "set",
        "type": "function",
        "signature": "kotlin.collections.MutableList.set(index: Int, element: Object): Object",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.MutableList.set."
      },
      {
        "name": "size",
        "type": "property",
        "signature": "kotlin.collections.MutableList.size: Int",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.MutableList.size."
      },
      {
        "name": "sort",
        "type": "function",
        "signature": "kotlin.collections.MutableList.sort(): Unit",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.MutableList.sort."
      },
      {
        "name": "sortBy",
        "type": "function",
        "signature": "kotlin.collections.MutableList.sortBy(selector: function): Unit",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.MutableList.sortBy."
      },
      {
        "name": "toList",
        "type": "function",
        "signature": "kotlin.collections.MutableList.toList(): List",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.MutableList.toList."
      }
    ],
    "kotlin.collections.MutableMap": [
      {
        "name": "clear",
        "type": "function",
        "signature": "kotlin.collections.MutableMap.clear(): Unit",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.MutableMap.clear."
      },
      {
        "name": "containsKey",
        "type": "function",
        "signature": "kotlin.collections.MutableMap.containsKey(key: Object): Boolean",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.MutableMap.containsKey."
      },
      {
        "name": "entries",
        "type": "property",
        "signature": "kotlin.collections.MutableMap.entries: MutableSet",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.MutableMap.entries."
      },
      {
        "name": "filter",
        "type": "function",
        "signature": "kotlin.collections.MutableMap.filter(predicate: function): Map",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.MutableMap.filter."
      },
      {
        "name": "forEach",
        "type": "function",
        "signature": "kotlin.collections.MutableMap.forEach(action: function): Unit",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.MutableMap.forEach."
      },
      {
        "name": "get",
        "type": "function",
        "signature": "kotlin.collections.MutableMap.get(key: Object): Object",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.MutableMap.get."
      },
      {
        "name": "getOrDefault",
        "type": "function",
        "signature": "kotlin.collections.MutableMap.getOrDefault(key: Object, defaultValue: Object): Object",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.MutableMap.getOrDefault."
      },
      {
        "name": "isEmpty",
        "type": "function",
        "signature": "kotlin.collections.MutableMap.isEmpty(): Boolean",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.MutableMap.isEmpty."
      },
      {
        "name": "keys",
        "type": "property",
        "signature": "kotlin.collections.MutableMap.keys: MutableSet",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.MutableMap.keys."
      },
      {
        "name": "put",
        "type": "function",
        "signature": "kotlin.collections.MutableMap.put(key: Object, value: Object): Object",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.MutableMap.put."
      },
      {
        "name": "putAll",
        "type": "function",
        "signature": "kotlin.collections.MutableMap.putAll(from: Map): Unit",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.MutableMap.putAll."
      },
      {
        "name": "remove",
        "type": "function",
        "signature": "kotlin.collections.MutableMap.remove(key: Object): Object",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.MutableMap.remove."
      },
      {
        "name": "size",
        "type": "property",
        "signature": "kotlin.collections.MutableMap.size: Int",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.MutableMap.size."
      },
      {
        "name": "toMap",
        "type": "function",
        "signature": "kotlin.collections.MutableMap.toMap(): Map",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.MutableMap.toMap."
      },
      {
        "name": "values",
        "type": "property",
        "signature": "kotlin.collections.MutableMap.values: MutableCollection",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.MutableMap.values."
      }
    ],
    "kotlin.collections.MutableSet": [
      {
        "name": "add",
        "type": "function",
        "signature": "kotlin.collections.MutableSet.add(element: Object): Boolean",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.MutableSet.add."
      },
      {
        "name": "addAll",
        "type": "function",
        "signature": "kotlin.collections.MutableSet.addAll(elements: Collection): Boolean",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.MutableSet.addAll."
      },
      {
        "name": "clear",
        "type": "function",
        "signature": "kotlin.collections.MutableSet.clear(): Unit",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.MutableSet.clear."
      },
      {
        "name": "contains",
        "type": "function",
        "signature": "kotlin.collections.MutableSet.contains(element: Object): Boolean",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.MutableSet.contains."
      },
      {
        "name": "filter",
        "type": "function",
        "signature": "kotlin.collections.MutableSet.filter(predicate: function): List",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.MutableSet.filter."
      },
      {
        "name": "forEach",
        "type": "function",
        "signature": "kotlin.collections.MutableSet.forEach(action: function): Unit",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.MutableSet.forEach."
      },
      {
        "name": "isEmpty",
        "type": "function",
        "signature": "kotlin.collections.MutableSet.isEmpty(): Boolean",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.MutableSet.isEmpty."
      },
      {
        "name": "remove",
        "type": "function",
        "signature": "kotlin.collections.MutableSet.remove(element: Object): Boolean",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.MutableSet.remove."
      },
      {
        "name": "removeAll",
        "type": "function",
        "signature": "kotlin.collections.MutableSet.removeAll(elements: Collection): Boolean",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.MutableSet.removeAll."
      },
      {
        "name": "retainAll",
        "type": "function",
        "signature": "kotlin.collections.MutableSet.retainAll(elements: Collection): Boolean",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.MutableSet.retainAll."
      },
      {
        "name": "size",
        "type": "property",
        "signature": "kotlin.collections.MutableSet.size: Int",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.MutableSet.size."
      },
      {
        "name": "toSet",
        "type": "function",
        "signature": "kotlin.collections.MutableSet.toSet(): Set",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.MutableSet.toSet."
      }
    ],
    "kotlin.collections.Set": [
      {
        "name": "all",
        "type": "function",
        "signature": "kotlin.collections.Set.all(predicate: function): Boolean",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.Set.all."
      },
      {
        "name": "any",
        "type": "function",
        "signature": "kotlin.collections.Set.any(predicate: function): Boolean",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.Set.any."
      },
      {
        "name": "contains",
        "type": "function",
        "signature": "kotlin.collections.Set.contains(element: Object): Boolean",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.Set.contains."
      },
      {
        "name": "filter",
        "type": "function",
        "signature": "kotlin.collections.Set.filter(predicate: function): List",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.Set.filter."
      },
      {
        "name": "forEach",
        "type": "function",
        "signature": "kotlin.collections.Set.forEach(action: function): Unit",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.Set.forEach."
      },
      {
        "name": "intersect",
        "type": "function",
        "signature": "kotlin.collections.Set.intersect(other: Iterable): Set",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.Set.intersect."
      },
      {
        "name": "isEmpty",
        "type": "function",
        "signature": "kotlin.collections.Set.isEmpty(): Boolean",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.Set.isEmpty."
      },
      {
        "name": "map",
        "type": "function",
        "signature": "kotlin.collections.Set.map(transform: function): List",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.Set.map."
      },
      {
        "name": "minus",
        "type": "function",
        "signature": "kotlin.collections.Set.minus(element: Object): Set",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.Set.minus."
      },
      {
        "name": "plus",
        "type": "function",
        "signature": "kotlin.collections.Set.plus(element: Object): Set",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.Set.plus."
      },
      {
        "name": "size",
        "type": "property",
        "signature": "kotlin.collections.Set.size: Int",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.Set.size."
      },
      {
        "name": "toList",
        "type": "function",
        "signature": "kotlin.collections.Set.toList(): List",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.Set.toList."
      },
      {
        "name": "toMutableSet",
        "type": "function",
        "signature": "kotlin.collections.Set.toMutableSet(): MutableSet",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.Set.toMutableSet."
      },
      {
        "name": "union",
        "type": "function",
        "signature": "kotlin.collections.Set.union(other: Iterable): Set",
        "doc": "Kotlin 2.2.21 symbol kotlin.collections.Set.union."
      }
    ],
    "kotlin.io": [
      {
        "name": "print",
        "type": "function",
        "signature": "kotlin.io.print(message: Object): Unit",
        "doc": "Kotlin 2.2.21 symbol kotlin.io.print."
      },
      {
        "name": "printf",
        "type": "function",
        "signature": "kotlin.io.printf(format: String, *args: Object): Unit",
        "doc": "Kotlin 2.2.21 symbol kotlin.io.printf."
      },
      {
        "name": "println",
        "type": "function",
        "signature": "kotlin.io.println(message: Object = ''): Unit",
        "doc": "Kotlin 2.2.21 symbol kotlin.io.println."
      },
      {
        "name": "readLine",
        "type": "function",
        "signature": "kotlin.io.readLine(): String",
        "doc": "Kotlin 2.2.21 symbol kotlin.io.readLine."
      }
    ],
    "kotlin.ranges": [
      {
        "name": "downTo",
        "type": "function",
        "signature": "kotlin.ranges.downTo(from: Int, to: Int): IntProgression",
        "doc": "Kotlin 2.2.21 symbol kotlin.ranges.downTo."
      },
      {
        "name": "rangeTo",
        "type": "function",
        "signature": "kotlin.ranges.rangeTo(from: Comparable, to: Comparable): ClosedRange",
        "doc": "Kotlin 2.2.21 symbol kotlin.ranges.rangeTo."
      },
      {
        "name": "until",
        "type": "function",
        "signature": "kotlin.ranges.until(from: Int, to: Int): IntRange",
        "doc": "Kotlin 2.2.21 symbol kotlin.ranges.until."
      }
    ],
    "kotlin.ranges.IntRange": [
      {
        "name": "contains",
        "type": "function",
        "signature": "kotlin.ranges.IntRange.contains(value: Int): Boolean",
        "doc": "Kotlin 2.2.21 symbol kotlin.ranges.IntRange.contains."
      },
      {
        "name": "endInclusive",
        "type": "property",
        "signature": "kotlin.ranges.IntRange.endInclusive: Int",
        "doc": "Kotlin 2.2.21 symbol kotlin.ranges.IntRange.endInclusive."
      },
      {
        "name": "first",
        "type": "property",
        "signature": "kotlin.ranges.IntRange.first: Int",
        "doc": "Kotlin 2.2.21 symbol kotlin.ranges.IntRange.first."
      },
      {
        "name": "isEmpty",
        "type": "function",
        "signature": "kotlin.ranges.IntRange.isEmpty(): Boolean",
        "doc": "Kotlin 2.2.21 symbol kotlin.ranges.IntRange.isEmpty."
      },
      {
        "name": "last",
        "type": "property",
        "signature": "kotlin.ranges.IntRange.last: Int",
        "doc": "Kotlin 2.2.21 symbol kotlin.ranges.IntRange.last."
      },
      {
        "name": "reversed",
        "type": "function",
        "signature": "kotlin.ranges.IntRange.reversed(): IntProgression",
        "doc": "Kotlin 2.2.21 symbol kotlin.ranges.IntRange.reversed."
      },
      {
        "name": "step",
        "type": "property",
        "signature": "kotlin.ranges.IntRange.step: Int",
        "doc": "Kotlin 2.2.21 symbol kotlin.ranges.IntRange.step."
      },
      {
        "name": "step",
        "type": "function",
        "signature": "kotlin.ranges.IntRange.step(step: Int): IntProgression",
        "doc": "Kotlin 2.2.21 symbol kotlin.ranges.IntRange.step."
      }
    ],
    "kotlin.sequences": [
      {
        "name": "emptySequence",
        "type": "function",
        "signature": "kotlin.sequences.emptySequence(): Sequence",
        "doc": "Kotlin 2.2.21 symbol kotlin.sequences.emptySequence."
      },
      {
        "name": "generateSequence",
        "type": "function",
        "signature": "kotlin.sequences.generateSequence(nextFunction: function): Sequence",
        "doc": "Kotlin 2.2.21 symbol kotlin.sequences.generateSequence."
      },
      {
        "name": "sequence",
        "type": "function",
        "signature": "kotlin.sequences.sequence(block: function): Sequence",
        "doc": "Kotlin 2.2.21 symbol kotlin.sequences.sequence."
      },
      {
        "name": "sequenceOf",
        "type": "function",
        "signature": "kotlin.sequences.sequenceOf(*elements: Object): Sequence",
        "doc": "Kotlin 2.2.21 symbol kotlin.sequences.sequenceOf."
      }
    ],
    "kotlin.sequences.Sequence": [
      {
        "name": "all",
        "type": "function",
        "signature": "kotlin.sequences.Sequence.all(predicate: function): Boolean",
        "doc": "Kotlin 2.2.21 symbol kotlin.sequences.Sequence.all."
      },
      {
        "name": "any",
        "type": "function",
        "signature": "kotlin.sequences.Sequence.any(predicate: function): Boolean",
        "doc": "Kotlin 2.2.21 symbol kotlin.sequences.Sequence.any."
      },
      {
        "name": "associate",
        "type": "function",
        "signature": "kotlin.sequences.Sequence.associate(transform: function): Map",
        "doc": "Kotlin 2.2.21 symbol kotlin.sequences.Sequence.associate."
      },
      {
        "name": "distinct",
        "type": "function",
        "signature": "kotlin.sequences.Sequence.distinct(): Sequence",
        "doc": "Kotlin 2.2.21 symbol kotlin.sequences.Sequence.distinct."
      },
      {
        "name": "filter",
        "type": "function",
        "signature": "kotlin.sequences.Sequence.filter(predicate: function): Sequence",
        "doc": "Kotlin 2.2.21 symbol kotlin.sequences.Sequence.filter."
      },
      {
        "name": "find",
        "type": "function",
        "signature": "kotlin.sequences.Sequence.find(predicate: function): Object",
        "doc": "Kotlin 2.2.21 symbol kotlin.sequences.Sequence.find."
      },
      {
        "name": "first",
        "type": "function",
        "signature": "kotlin.sequences.Sequence.first(): Object",
        "doc": "Kotlin 2.2.21 symbol kotlin.sequences.Sequence.first."
      },
      {
        "name": "flatMap",
        "type": "function",
        "signature": "kotlin.sequences.Sequence.flatMap(transform: function): Sequence",
        "doc": "Kotlin 2.2.21 symbol kotlin.sequences.Sequence.flatMap."
      },
      {
        "name": "forEach",
        "type": "function",
        "signature": "kotlin.sequences.Sequence.forEach(action: function): Unit",
        "doc": "Kotlin 2.2.21 symbol kotlin.sequences.Sequence.forEach."
      },
      {
        "name": "map",
        "type": "function",
        "signature": "kotlin.sequences.Sequence.map(transform: function): Sequence",
        "doc": "Kotlin 2.2.21 symbol kotlin.sequences.Sequence.map."
      },
      {
        "name": "take",
        "type": "function",
        "signature": "kotlin.sequences.Sequence.take(count: Int): Sequence",
        "doc": "Kotlin 2.2.21 symbol kotlin.sequences.Sequence.take."
      },
      {
        "name": "toList",
        "type": "function",
        "signature": "kotlin.sequences.Sequence.toList(): List",
        "doc": "Kotlin 2.2.21 symbol kotlin.sequences.Sequence.toList."
      },
      {
        "name": "toSet",
        "type": "function",
        "signature": "kotlin.sequences.Sequence.toSet(): Set",
        "doc": "Kotlin 2.2.21 symbol kotlin.sequences.Sequence.toSet."
      }
    ],
    "kotlin.text": [
      {
        "name": "appendLine",
        "type": "function",
        "signature": "kotlin.text.appendLine(builder: Appendable, value: Object = ''): Appendable",
        "doc": "Kotlin 2.2.21 symbol kotlin.text.appendLine."
      },
      {
        "name": "buildString",
        "type": "function",
        "signature": "kotlin.text.buildString(builderAction: function): String",
        "doc": "Kotlin 2.2.21 symbol kotlin.text.buildString."
      },
      {
        "name": "Regex",
        "type": "class",
        "signature": "kotlin.text.Regex: type",
        "doc": "Kotlin 2.2.21 symbol kotlin.text.Regex."
      },
      {
        "name": "StringBuilder",
        "type": "class",
        "signature": "kotlin.text.StringBuilder: type",
        "doc": "Kotlin 2.2.21 symbol kotlin.text.StringBuilder."
      },
      {
        "name": "trimIndent",
        "type": "function",
        "signature": "kotlin.text.trimIndent(value: String): String",
        "doc": "Kotlin 2.2.21 symbol kotlin.text.trimIndent."
      },
      {
        "name": "trimMargin",
        "type": "function",
        "signature": "kotlin.text.trimMargin(value: String, marginPrefix: String = '|'): String",
        "doc": "Kotlin 2.2.21 symbol kotlin.text.trimMargin."
      }
    ],
    "kotlin.text.Regex#instance": [
      {
        "name": "containsMatchIn",
        "type": "function",
        "signature": "kotlin.text.Regex#instance.containsMatchIn(input: CharSequence): Boolean",
        "doc": "Kotlin 2.2.21 symbol kotlin.text.Regex#instance.containsMatchIn."
      },
      {
        "name": "find",
        "type": "function",
        "signature": "kotlin.text.Regex#instance.find(input: CharSequence, startIndex: Int = 0): MatchResult",
        "doc": "Kotlin 2.2.21 symbol kotlin.text.Regex#instance.find."
      },
      {
        "name": "findAll",
        "type": "function",
        "signature": "kotlin.text.Regex#instance.findAll(input: CharSequence, startIndex: Int = 0): Sequence",
        "doc": "Kotlin 2.2.21 symbol kotlin.text.Regex#instance.findAll."
      },
      {
        "name": "matchEntire",
        "type": "function",
        "signature": "kotlin.text.Regex#instance.matchEntire(input: CharSequence): MatchResult",
        "doc": "Kotlin 2.2.21 symbol kotlin.text.Regex#instance.matchEntire."
      },
      {
        "name": "matches",
        "type": "function",
        "signature": "kotlin.text.Regex#instance.matches(input: CharSequence): Boolean",
        "doc": "Kotlin 2.2.21 symbol kotlin.text.Regex#instance.matches."
      },
      {
        "name": "replace",
        "type": "function",
        "signature": "kotlin.text.Regex#instance.replace(input: CharSequence, replacement: String): String",
        "doc": "Kotlin 2.2.21 symbol kotlin.text.Regex#instance.replace."
      },
      {
        "name": "replaceFirst",
        "type": "function",
        "signature": "kotlin.text.Regex#instance.replaceFirst(input: CharSequence, replacement: String): String",
        "doc": "Kotlin 2.2.21 symbol kotlin.text.Regex#instance.replaceFirst."
      },
      {
        "name": "split",
        "type": "function",
        "signature": "kotlin.text.Regex#instance.split(input: CharSequence, limit: Int = 0): List",
        "doc": "Kotlin 2.2.21 symbol kotlin.text.Regex#instance.split."
      },
      {
        "name": "toPattern",
        "type": "function",
        "signature": "kotlin.text.Regex#instance.toPattern(): Pattern",
        "doc": "Kotlin 2.2.21 symbol kotlin.text.Regex#instance.toPattern."
      }
    ],
    "kotlin.text.StringBuilder": [
      {
        "name": "append",
        "type": "function",
        "signature": "kotlin.text.StringBuilder.append(value: Object): StringBuilder",
        "doc": "Kotlin 2.2.21 symbol kotlin.text.StringBuilder.append."
      },
      {
        "name": "appendLine",
        "type": "function",
        "signature": "kotlin.text.StringBuilder.appendLine(value: Object = ''): StringBuilder",
        "doc": "Kotlin 2.2.21 symbol kotlin.text.StringBuilder.appendLine."
      },
      {
        "name": "clear",
        "type": "function",
        "signature": "kotlin.text.StringBuilder.clear(): StringBuilder",
        "doc": "Kotlin 2.2.21 symbol kotlin.text.StringBuilder.clear."
      },
      {
        "name": "deleteAt",
        "type": "function",
        "signature": "kotlin.text.StringBuilder.deleteAt(index: Int): StringBuilder",
        "doc": "Kotlin 2.2.21 symbol kotlin.text.StringBuilder.deleteAt."
      },
      {
        "name": "insert",
        "type": "function",
        "signature": "kotlin.text.StringBuilder.insert(index: Int, value: Object): StringBuilder",
        "doc": "Kotlin 2.2.21 symbol kotlin.text.StringBuilder.insert."
      },
      {
        "name": "isEmpty",
        "type": "function",
        "signature": "kotlin.text.StringBuilder.isEmpty(): Boolean",
        "doc": "Kotlin 2.2.21 symbol kotlin.text.StringBuilder.isEmpty."
      },
      {
        "name": "length",
        "type": "property",
        "signature": "kotlin.text.StringBuilder.length: Int",
        "doc": "Kotlin 2.2.21 symbol kotlin.text.StringBuilder.length."
      },
      {
        "name": "reverse",
        "type": "function",
        "signature": "kotlin.text.StringBuilder.reverse(): StringBuilder",
        "doc": "Kotlin 2.2.21 symbol kotlin.text.StringBuilder.reverse."
      },
      {
        "name": "set",
        "type": "function",
        "signature": "kotlin.text.StringBuilder.set(index: Int, value: Char): Unit",
        "doc": "Kotlin 2.2.21 symbol kotlin.text.StringBuilder.set."
      },
      {
        "name": "toString",
        "type": "function",
        "signature": "kotlin.text.StringBuilder.toString(): String",
        "doc": "Kotlin 2.2.21 symbol kotlin.text.StringBuilder.toString."
      }
    ]
  },
  "aliases": {
    "android.graphics.Color": "Color",
    "android.net.Uri": "Uri",
    "android.text.TextUtils": "TextUtils",
    "android.util.Log": "Log",
    "Array": "kotlin.Array",
    "ArrayList": "java.util.ArrayList",
    "Boolean": "kotlin.Boolean",
    "Bundle": "android.os.Bundle",
    "Context": "android.content.Context",
    "Double": "kotlin.Double",
    "File": "java.io.File",
    "HashMap": "java.util.HashMap",
    "Int": "kotlin.Int",
    "Intent": "android.content.Intent",
    "IntRange": "kotlin.ranges.IntRange",
    "java.lang.Boolean": "Boolean",
    "java.lang.Character": "Character",
    "java.lang.Double": "Double",
    "java.lang.Integer": "Integer",
    "java.lang.Long": "Long",
    "java.lang.Math": "Math",
    "java.lang.String": "String",
    "java.lang.System": "System",
    "java.lang.Thread": "Thread",
    "java.nio.file.Files": "Files",
    "java.nio.file.Paths": "Paths",
    "java.util.Arrays": "Arrays",
    "java.util.Collections": "Collections",
    "java.util.List": "List",
    "java.util.Map": "Map",
    "java.util.Objects": "Objects",
    "java.util.Optional": "Optional",
    "java.util.Set": "Set",
    "kotlin.Result": "Result",
    "kotlin.text.Regex": "Regex",
    "List": "kotlin.collections.List",
    "Long": "kotlin.Long",
    "Map": "kotlin.collections.Map",
    "MutableList": "kotlin.collections.MutableList",
    "MutableMap": "kotlin.collections.MutableMap",
    "MutableSet": "kotlin.collections.MutableSet",
    "Path": "java.nio.file.Path",
    "Sequence": "kotlin.sequences.Sequence",
    "Set": "kotlin.collections.Set",
    "String": "kotlin.String",
    "StringBuilder": "kotlin.text.StringBuilder",
    "View": "android.view.View"
  }
};
})(window);
