(function(global) {
    "use strict";
    var registry = global.AutoJsAceLanguageIndices || (global.AutoJsAceLanguageIndices = Object.create(null));
    registry["kotlin"] = {
  "schemaVersion": 1,
  "generatorVersion": 1,
  "language": "kotlin",
  "source": {
    "name": "Kotlin standard library API subset",
    "languageVersion": "Kotlin 2.2.21",
    "revision": "autojs6-kotlin-2.2.21-subset-1",
    "url": "https://kotlinlang.org/api/core/kotlin-stdlib/",
    "license": "Apache-2.0; API names/signatures only",
    "scope": "kotlin.*, collections, text, io, ranges, and sequences top-level APIs; no variable type inference"
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
      "name": "Pair",
      "type": "class",
      "signature": "class Pair",
      "doc": "Kotlin 2.2.21 type Pair."
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
      "name": "with",
      "type": "function",
      "signature": "with(receiver: Object, block: function): Object",
      "doc": "Kotlin 2.2.21 symbol with."
    }
  ],
  "modules": {
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
    ]
  },
  "aliases": {
    "kotlin.Result": "Result",
    "kotlin.text.Regex": "Regex"
  }
};
})(window);
