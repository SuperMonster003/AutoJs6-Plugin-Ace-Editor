package io.github.supermonster003.autojs6.plugin.ace.editor

/** APK contents determine compatibility for both a single-ABI APK and the universal APK. */
internal fun packagedNativeAbis(entries: Sequence<String>): Array<String> = entries
    .mapNotNull { entry ->
        val parts = entry.split('/')
        parts.takeIf { it.size == 3 && it[0] == "lib" && it[2].endsWith(".so") }
            ?.get(1)?.takeIf { it in setOf("arm64-v8a", "armeabi-v7a", "x86_64", "x86") }
    }
    .distinct()
    .sorted()
    .toList()
    .toTypedArray()
