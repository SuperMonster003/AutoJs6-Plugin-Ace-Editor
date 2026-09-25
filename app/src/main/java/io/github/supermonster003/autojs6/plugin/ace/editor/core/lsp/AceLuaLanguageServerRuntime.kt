package io.github.supermonster003.autojs6.plugin.ace.editor.core.lsp

import android.content.Context
import android.os.Build
import java.io.DataInputStream
import java.io.File
import java.io.FileOutputStream
import java.security.MessageDigest
import java.util.Locale
import org.json.JSONObject

/**
 * Prepares the pinned LuaLS runtime and returns the only native command that JavaScript may start.
 *
 * The ELF remains in [android.content.pm.ApplicationInfo.nativeLibraryDir], where Android installs it
 * with executable permissions. Lua sources are copied from an immutable, hashed asset inventory to
 * a private directory. Neither a web page nor a bridge caller can choose a command, argument, or
 * environment variable.
 */
internal object AceLuaLanguageServerRuntime {

    const val PROVIDER_ID = "lua-luals"
    const val VERSION = "3.18.2"
    const val NATIVE_LIBRARY_NAME = "libautojs6_luals.so"

    private const val MANIFEST_ASSET = "luals/manifest.json"
    private const val RUNTIME_ASSET_ROOT = "luals/runtime"
    private const val MARKER_FILE = ".autojs6-runtime-sha256"
    private const val HANDSHAKE_TIMEOUT_MS = 15_000L
    private const val IDLE_TIMEOUT_MS = 5 * 60_000L
    private val preparationLock = Any()

    @Volatile
    private var cachedPreparation: Preparation? = null

    /**
     * Performs the cheap, side-effect-free preflight used while the editor page is starting.
     *
     * Startup configuration is requested synchronously by JavaScript before `notifyReady`. Reading
     * the 273-entry manifest and hashing the native executable here makes the first Lua document
     * pay cold-storage I/O on the WebView bridge. The complete manifest, size, and SHA-256 checks
     * still run in [serverSpec] immediately before the executable can be launched.
     */
    fun isAvailable(context: Context): Boolean = runCatching {
        hasInstalledNativeRuntime(
            nativeLibraryDirectory = File(context.applicationContext.applicationInfo.nativeLibraryDir),
            supportedAbis = Build.SUPPORTED_ABIS.asList(),
        )
    }.getOrDefault(false)

    fun isSupported(context: Context): Boolean = runCatching {
        val manifest = readManifest(context.applicationContext)
        val nativeLibrary = resolveNativeLibrary(context.applicationContext, manifest)
        verifyNativeLibrary(nativeLibrary, manifest.nativeLibraries.getValue(nativeLibrary.abi))
        true
    }.getOrDefault(false)

    fun serverSpec(context: Context): AceStdioLspServerSpec {
        val applicationContext = context.applicationContext
        val prepared = cachedPreparation?.takeIf { it.packageName == applicationContext.packageName }
            ?: synchronized(preparationLock) {
                cachedPreparation?.takeIf { it.packageName == applicationContext.packageName }
                    ?: prepare(applicationContext).also { cachedPreparation = it }
            }
        return AceStdioLspServerSpec(
            id = PROVIDER_ID,
            command = listOf(
                prepared.nativeLibrary.path,
                File(prepared.runtimeRoot, "main.lua").path,
                "--locale=en-us",
                "--logpath=${prepared.logRoot.path}",
                "--metapath=${prepared.metaRoot.path}",
            ),
            workingDirectory = prepared.runtimeRoot,
            environment = mapOf(
                "AUTOJS6_LUALS_ROOT" to prepared.runtimeRoot.path,
                "LLS_LOG_LEVEL" to "warn",
            ),
            handshakeTimeoutMs = HANDSHAKE_TIMEOUT_MS,
            idleTimeoutMs = IDLE_TIMEOUT_MS,
            maxRestartAttempts = 3,
            restartBaseDelayMs = 250L,
            restartMaxDelayMs = 4_000L,
        )
    }

    private fun prepare(context: Context): Preparation {
        val manifest = readManifest(context)
        require(manifest.version == VERSION) {
            "Unexpected bundled LuaLS version: ${manifest.version}"
        }
        val nativeLibrary = resolveNativeLibrary(context, manifest)
        verifyNativeLibrary(nativeLibrary, manifest.nativeLibraries.getValue(nativeLibrary.abi))
        val runtimeParent = File(context.noBackupFilesDir, "autojs6-luals")
        require(runtimeParent.mkdirs() || runtimeParent.isDirectory) {
            "Unable to create LuaLS private runtime directory"
        }
        val runtimeRoot = File(
            runtimeParent,
            "runtime-${manifest.version}-${manifest.runtimeSha256.take(16)}",
        )
        ensureRuntimeExtracted(context, runtimeRoot, manifest)

        val stateRoot = File(context.cacheDir, "autojs6-luals/state-${manifest.version}")
        val logRoot = File(stateRoot, "log")
        val metaRoot = File(stateRoot, "meta")
        require(logRoot.mkdirs() || logRoot.isDirectory) { "Unable to create LuaLS log directory" }
        require(metaRoot.mkdirs() || metaRoot.isDirectory) { "Unable to create LuaLS meta directory" }
        return Preparation(
            packageName = context.packageName,
            nativeLibrary = nativeLibrary.file,
            runtimeRoot = runtimeRoot,
            logRoot = logRoot,
            metaRoot = metaRoot,
        )
    }

    private fun readManifest(context: Context): RuntimeManifest {
        val root = context.assets.open(MANIFEST_ASSET).bufferedReader(Charsets.UTF_8).use { reader ->
            JSONObject(reader.readText())
        }
        val runtime = root.getJSONObject("runtime")
        val filesJson = runtime.getJSONArray("files")
        val files = buildList(filesJson.length()) {
            for (index in 0 until filesJson.length()) {
                val item = filesJson.getJSONObject(index)
                val path = item.getString("path")
                require(isSafeRuntimePath(path)) { "Unsafe LuaLS runtime asset path: $path" }
                add(
                    RuntimeFile(
                        path = path,
                        bytes = item.getLong("bytes"),
                        sha256 = item.getString("sha256"),
                    ),
                )
            }
        }
        require(files.size == runtime.getInt("fileCount")) { "LuaLS runtime file count mismatch" }
        require(files.sumOf(RuntimeFile::bytes) == runtime.getLong("bytes")) {
            "LuaLS runtime byte count mismatch"
        }
        val nativeJson = root.getJSONObject("nativeLibraries")
        val nativeLibraries = buildMap {
            nativeJson.keys().forEach { abi ->
                val item = nativeJson.getJSONObject(abi)
                put(
                    abi,
                    NativeLibrary(
                        bytes = item.getLong("bytes"),
                        sha256 = item.getString("sha256"),
                    ),
                )
            }
        }
        return RuntimeManifest(
            version = root.getString("version"),
            runtimeSha256 = runtime.getString("sha256"),
            files = files,
            nativeLibraries = nativeLibraries,
        )
    }

    private fun resolveNativeLibrary(
        context: Context,
        manifest: RuntimeManifest,
    ): ResolvedNativeLibrary {
        val nativeRoot = File(context.applicationInfo.nativeLibraryDir).canonicalFile
        val nativeLibrary = File(nativeRoot, NATIVE_LIBRARY_NAME).canonicalFile
        require(nativeLibrary.parentFile == nativeRoot) { "LuaLS native path escaped nativeLibraryDir" }
        require(nativeLibrary.isFile && nativeLibrary.canRead()) {
            "LuaLS native library is missing"
        }
        require(nativeLibrary.canExecute()) { "LuaLS native library is not executable" }
        // A 64-bit device can install a 32-bit split. Verify the executable Android actually
        // extracted, including when a host of another bitness launches this child process.
        val header = ByteArray(20)
        DataInputStream(nativeLibrary.inputStream()).use { it.readFully(header) }
        val abi = requireNotNull(installedNativeAbi(header)) { "Unsupported LuaLS ELF header" }
        require(abi in Build.SUPPORTED_ABIS && abi in manifest.nativeLibraries) {
            "LuaLS is unavailable for installed ABI $abi"
        }
        return ResolvedNativeLibrary(abi, nativeLibrary)
    }

    internal fun installedNativeAbi(header: ByteArray): String? {
        if (header.size < 20 || header[0] != 0x7f.toByte() || header[1] != 'E'.code.toByte() ||
            header[2] != 'L'.code.toByte() || header[3] != 'F'.code.toByte() ||
            header[5] != 1.toByte() || header[6] != 1.toByte()) return null
        val machine = (header[18].toInt() and 0xff) or ((header[19].toInt() and 0xff) shl 8)
        return when (header[4].toInt() to machine) {
            1 to 40 -> "armeabi-v7a"
            2 to 183 -> "arm64-v8a"
            2 to 62 -> "x86_64"
            else -> null
        }
    }

    internal fun hasInstalledNativeRuntime(
        nativeLibraryDirectory: File,
        supportedAbis: List<String>,
    ): Boolean {
        if (supportedAbis.none(SUPPORTED_NATIVE_ABIS::contains)) return false
        val nativeLibrary = File(nativeLibraryDirectory, NATIVE_LIBRARY_NAME)
        return nativeLibrary.isFile && nativeLibrary.canRead() && nativeLibrary.canExecute()
    }

    private fun verifyNativeLibrary(file: ResolvedNativeLibrary, expected: NativeLibrary) {
        require(file.file.length() == expected.bytes) { "LuaLS ${file.abi} native size mismatch" }
        require(sha256(file.file) == expected.sha256) { "LuaLS ${file.abi} native hash mismatch" }
    }

    private fun ensureRuntimeExtracted(
        context: Context,
        runtimeRoot: File,
        manifest: RuntimeManifest,
    ) {
        val marker = File(runtimeRoot, MARKER_FILE)
        if (
            runtimeRoot.isDirectory && marker.isFile &&
            marker.readText(Charsets.US_ASCII).trim() == manifest.runtimeSha256 &&
            manifest.files.all { entry ->
                resolveRuntimeTarget(runtimeRoot, entry.path).let { file ->
                    file.isFile && file.length() == entry.bytes
                }
            }
        ) {
            return
        }

        if (runtimeRoot.exists()) {
            require(isPrivateRuntimeDirectory(runtimeRoot, context.noBackupFilesDir)) {
                "Refusing to replace LuaLS runtime outside private storage"
            }
            require(runtimeRoot.deleteRecursively()) { "Unable to replace incomplete LuaLS runtime" }
        }
        val staging = File(
            runtimeRoot.parentFile,
            "${runtimeRoot.name}.staging-${android.os.Process.myPid()}-${System.nanoTime()}",
        )
        require(staging.mkdirs()) { "Unable to create LuaLS runtime staging directory" }
        try {
            manifest.files.forEach { entry ->
                val output = resolveRuntimeTarget(staging, entry.path)
                require(output.parentFile?.mkdirs() != false || output.parentFile?.isDirectory == true) {
                    "Unable to create LuaLS runtime parent directory"
                }
                val digest = MessageDigest.getInstance("SHA-256")
                var byteCount = 0L
                context.assets.open("$RUNTIME_ASSET_ROOT/${entry.path}").use { input ->
                    FileOutputStream(output).buffered().use { destination ->
                        val buffer = ByteArray(DEFAULT_BUFFER_SIZE)
                        while (true) {
                            val count = input.read(buffer)
                            if (count < 0) break
                            if (count == 0) continue
                            destination.write(buffer, 0, count)
                            digest.update(buffer, 0, count)
                            byteCount += count
                        }
                    }
                }
                require(byteCount == entry.bytes) { "LuaLS runtime size mismatch: ${entry.path}" }
                require(digest.digest().toLowerHex() == entry.sha256) {
                    "LuaLS runtime hash mismatch: ${entry.path}"
                }
            }
            File(staging, MARKER_FILE).writeText(
                "${manifest.runtimeSha256}\n",
                Charsets.US_ASCII,
            )
            require(staging.renameTo(runtimeRoot)) { "Unable to publish LuaLS runtime atomically" }
        } finally {
            if (staging.exists()) staging.deleteRecursively()
        }
    }

    internal fun isSafeRuntimePath(path: String): Boolean {
        if (
            path.isBlank() || path.length > 512 || path.startsWith('/') || path.startsWith('\\') ||
            '\u0000' in path || '\\' in path || ':' in path
        ) {
            return false
        }
        val segments = path.split('/')
        return segments.all { segment ->
            segment.isNotBlank() && segment != "." && segment != ".."
        }
    }

    internal fun resolveRuntimeTarget(root: File, relativePath: String): File {
        require(isSafeRuntimePath(relativePath)) { "Unsafe LuaLS runtime path" }
        val canonicalRoot = root.canonicalFile
        val target = File(canonicalRoot, relativePath).canonicalFile
        require(target.path.startsWith(canonicalRoot.path + File.separator)) {
            "LuaLS runtime path escaped its private root"
        }
        return target
    }

    private fun isPrivateRuntimeDirectory(directory: File, privateRoot: File): Boolean {
        val canonicalPrivateRoot = privateRoot.canonicalFile
        val canonicalDirectory = directory.canonicalFile
        return canonicalDirectory.path.startsWith(canonicalPrivateRoot.path + File.separator) &&
            canonicalDirectory.name.startsWith("runtime-") &&
            canonicalDirectory.parentFile?.name == "autojs6-luals"
    }

    private fun sha256(file: File): String {
        val digest = MessageDigest.getInstance("SHA-256")
        file.inputStream().buffered().use { input ->
            val buffer = ByteArray(DEFAULT_BUFFER_SIZE)
            while (true) {
                val count = input.read(buffer)
                if (count < 0) break
                if (count > 0) digest.update(buffer, 0, count)
            }
        }
        return digest.digest().toLowerHex()
    }

    private fun ByteArray.toLowerHex(): String = joinToString(separator = "") { byte ->
        "%02x".format(Locale.ROOT, byte.toInt() and 0xff)
    }

    private data class RuntimeManifest(
        val version: String,
        val runtimeSha256: String,
        val files: List<RuntimeFile>,
        val nativeLibraries: Map<String, NativeLibrary>,
    )

    private data class RuntimeFile(
        val path: String,
        val bytes: Long,
        val sha256: String,
    )

    private data class NativeLibrary(
        val bytes: Long,
        val sha256: String,
    )

    private data class ResolvedNativeLibrary(
        val abi: String,
        val file: File,
    )

    private data class Preparation(
        val packageName: String,
        val nativeLibrary: File,
        val runtimeRoot: File,
        val logRoot: File,
        val metaRoot: File,
    )

    private val SUPPORTED_NATIVE_ABIS = setOf(
        "arm64-v8a",
        "armeabi-v7a",
        "x86_64",
    )
}
