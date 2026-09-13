package io.github.supermonster003.autojs6.plugin.ace.editor

import org.junit.Assert.assertArrayEquals
import org.junit.Test

class PackagedNativeAbisTest {
    @Test fun singleAbiApkReportsOnlyItsInstalledNativePayload() {
        assertArrayEquals(arrayOf("arm64-v8a"), packagedNativeAbis(sequenceOf(
            "lib/arm64-v8a/libautojs6_luals.so", "lib/arm64-v8a/another.so",
            "assets/lib/x86/libautojs6_luals.so", "assets/luals/manifest.json",
        )))
    }
    @Test fun universalApkDeduplicatesActualAbisAndIgnoresInvalidEntries() {
        assertArrayEquals(arrayOf("arm64-v8a", "armeabi-v7a", "x86", "x86_64"), packagedNativeAbis(sequenceOf(
            "lib/x86/compat.so", "lib/x86_64/runtime.so", "lib/arm64-v8a/runtime.so",
            "lib/armeabi-v7a/runtime.so", "lib/arm64-v8a/other.so", "lib/../runtime.so", "lib/x86/readme.txt",
        )))
    }
}
