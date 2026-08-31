package io.github.supermonster003.autojs6.plugin.ace.editor.core.lsp

import android.content.Context
import org.json.JSONObject
import java.io.File
import java.io.InputStream
import java.security.MessageDigest

internal object AceJavaClasspathRuntime {

    const val PROVIDER_ID = "java-ecj"
    const val ECJ_VERSION = "3.26.0"
    const val EXPECTED_ECJ_ARTIFACT_BYTES = 3_133_846L
    const val JAVA_BUNDLE_BUDGET_BYTES = 8L * 1024L * 1024L
    const val EXPECTED_ECJ_ARTIFACT_SHA256 =
        "ac0ba5876eaf7ebb47749a0d1be179c51f194b9dd0b875d1c09e1b530f5a2db5"
    const val COMPILE_SDK = 36
    const val MANIFEST_ASSET = "java/ecj/manifest.json"
    const val CLASSPATH_ASSET = "java/ecj/android-36-stubs.jar"
    const val EXPECTED_CLASSPATH_BYTES = 5_066_010L
    const val EXPECTED_CLASS_FILE_COUNT = 5_651
    const val EXPECTED_UNCOMPRESSED_CLASS_BYTES = 11_599_893L
    const val EXPECTED_SOURCE_SHA256 =
        "d9eb9da824d9e247a352f570f01e1169e725b2954bca9e283a71786c59b59f9a"
    const val EXPECTED_CLASSPATH_SHA256 =
        "01c9cf8ee9de431c52ea71975f53859fe1888af7bd50a62dd49d3458bdfdbc17"
    val EXPECTED_EXCLUDED_CLASS_PREFIXES = listOf(
        "android/adservices/",
        "android/health/",
        "android/icu/",
    )

    private val installLock = Any()

    fun isSupported(context: Context): Boolean = runCatching {
        require(org.eclipse.jdt.internal.compiler.Compiler::class.java.name.isNotEmpty())
        require(javax.lang.model.SourceVersion::class.java.name.isNotEmpty())
        readManifest(context)
        context.assets.open(CLASSPATH_ASSET).use { input ->
            require(input.read() >= 0) { "Bundled Java classpath is empty" }
        }
    }.isSuccess

    fun ensureInstalled(context: Context): File = synchronized(installLock) {
        val applicationContext = context.applicationContext ?: context
        readManifest(applicationContext)
        val installDirectory = File(
            applicationContext.filesDir,
            "ace-java/ecj-$ECJ_VERSION",
        )
        check(installDirectory.isDirectory || installDirectory.mkdirs()) {
            "Could not create Java semantic runtime directory: $installDirectory"
        }
        val installed = File(
            installDirectory,
            "android-$COMPILE_SDK-${EXPECTED_CLASSPATH_SHA256.take(12)}.jar",
        )
        if (isValidInstalledClasspath(installed)) {
            return@synchronized installed
        }
        if (installed.exists()) {
            check(installed.delete()) { "Could not replace invalid Java semantic classpath" }
        }

        val temporary = File(
            installDirectory,
            ".${installed.name}.${android.os.Process.myPid()}.${System.nanoTime()}.tmp",
        )
        if (temporary.exists()) {
            check(temporary.delete()) { "Could not clear stale Java classpath temporary file" }
        }
        try {
            applicationContext.assets.open(CLASSPATH_ASSET).use { input ->
                temporary.outputStream().buffered().use { output -> input.copyTo(output) }
            }
            check(isValidInstalledClasspath(temporary)) {
                "Bundled Java semantic classpath failed size/hash validation"
            }
            if (!temporary.renameTo(installed)) {
                temporary.inputStream().buffered().use { input ->
                    installed.outputStream().buffered().use { output -> input.copyTo(output) }
                }
                check(temporary.delete()) { "Could not remove Java classpath temporary file" }
            }
            check(isValidInstalledClasspath(installed)) {
                "Installed Java semantic classpath failed size/hash validation"
            }
        } finally {
            if (temporary.exists()) {
                temporary.delete()
            }
        }
        installed
    }

    internal fun validateManifestJson(json: String): Manifest {
        val root = JSONObject(json)
        val manifest = Manifest(
            schemaVersion = root.getInt("schemaVersion"),
            ecjVersion = root.getString("ecjVersion"),
            ecjArtifactSha256 = root.getString("ecjArtifactSha256"),
            ecjArtifactBytes = root.getLong("ecjArtifactBytes"),
            bundleBudgetBytes = root.getLong("bundleBudgetBytes"),
            compileSdk = root.getInt("compileSdk"),
            excludedClassPrefixes = root.getJSONArray("excludedClassPrefixes").let { array ->
                buildList {
                    for (index in 0 until array.length()) add(array.getString(index))
                }
            },
            sourceSha256 = root.getString("sourceSha256"),
            classpathFile = root.getString("classpathFile"),
            classpathSha256 = root.getString("classpathSha256"),
            classpathBytes = root.getLong("classpathBytes"),
            classFileCount = root.getInt("classFileCount"),
            uncompressedClassBytes = root.getLong("uncompressedClassBytes"),
        )
        require(manifest.schemaVersion == 1) { "Unsupported Java classpath manifest schema" }
        require(manifest.ecjVersion == ECJ_VERSION) { "Unexpected ECJ version" }
        require(manifest.ecjArtifactSha256 == EXPECTED_ECJ_ARTIFACT_SHA256) {
            "Unexpected ECJ artifact hash"
        }
        require(manifest.ecjArtifactBytes == EXPECTED_ECJ_ARTIFACT_BYTES) {
            "Unexpected ECJ artifact size"
        }
        require(manifest.bundleBudgetBytes == JAVA_BUNDLE_BUDGET_BYTES) {
            "Unexpected Java semantic bundle budget"
        }
        require(manifest.compileSdk == COMPILE_SDK) { "Unexpected Java classpath SDK" }
        require(manifest.excludedClassPrefixes == EXPECTED_EXCLUDED_CLASS_PREFIXES) {
            "Unexpected Java classpath trim policy"
        }
        require(manifest.sourceSha256 == EXPECTED_SOURCE_SHA256) { "Unexpected SDK source hash" }
        require(manifest.classpathFile == CLASSPATH_ASSET.substringAfterLast('/')) {
            "Unexpected Java classpath filename"
        }
        require(manifest.classpathSha256 == EXPECTED_CLASSPATH_SHA256) {
            "Unexpected Java classpath hash"
        }
        require(manifest.classpathBytes == EXPECTED_CLASSPATH_BYTES) {
            "Unexpected Java classpath size"
        }
        require(manifest.classFileCount == EXPECTED_CLASS_FILE_COUNT) {
            "Unexpected Java class count"
        }
        require(manifest.uncompressedClassBytes == EXPECTED_UNCOMPRESSED_CLASS_BYTES) {
            "Unexpected Java uncompressed class size"
        }
        return manifest
    }

    internal fun sha256(input: InputStream): String {
        val digest = MessageDigest.getInstance("SHA-256")
        val buffer = ByteArray(DEFAULT_BUFFER_SIZE)
        while (true) {
            val count = input.read(buffer)
            if (count < 0) break
            if (count > 0) digest.update(buffer, 0, count)
        }
        return digest.digest().joinToString("") { byte ->
            (byte.toInt() and 0xff).toString(16).padStart(2, '0')
        }
    }

    private fun readManifest(context: Context): Manifest {
        val json = context.assets.open(MANIFEST_ASSET).bufferedReader(Charsets.UTF_8).use { reader ->
            reader.readText()
        }
        return validateManifestJson(json)
    }

    private fun isValidInstalledClasspath(file: File): Boolean {
        if (!file.isFile || file.length() != EXPECTED_CLASSPATH_BYTES) return false
        return runCatching {
            file.inputStream().buffered().use(::sha256) == EXPECTED_CLASSPATH_SHA256
        }.getOrDefault(false)
    }

    internal data class Manifest(
        val schemaVersion: Int,
        val ecjVersion: String,
        val ecjArtifactSha256: String,
        val ecjArtifactBytes: Long,
        val bundleBudgetBytes: Long,
        val compileSdk: Int,
        val excludedClassPrefixes: List<String>,
        val sourceSha256: String,
        val classpathFile: String,
        val classpathSha256: String,
        val classpathBytes: Long,
        val classFileCount: Int,
        val uncompressedClassBytes: Long,
    )
}
