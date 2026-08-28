package io.github.supermonster003.autojs6.plugin.ace.editor.core.lsp

import com.google.gson.JsonParser
import java.io.File
import java.net.URI
import java.nio.ByteBuffer
import java.nio.charset.CodingErrorAction
import java.nio.charset.StandardCharsets
import java.security.MessageDigest
import java.util.Collections
import java.util.Locale

internal data class AceTypeScriptProjectTypeLayer(
    val projectRootPath: String,
    val documentUri: String,
    val fileUris: List<String>,
    val typeDirectiveNames: List<String>,
    val dependencyLayerFingerprint: String?,
    val dependencyInventoryFingerprint: String?,
    val dependencyFileCount: Int,
    val dependencyByteLength: Long,
    val dependencyPathByteLength: Long,
    val dependencyBoundaryCode: String?,
    val dependencyBoundaryDetail: String?,
    private val textByUri: Map<String, String>,
) {

    fun read(uri: String): String? = textByUri[uri]

    companion object {
        fun capture(
            documentPath: String,
            profile: AceTypeScriptExecutionProfile,
        ): AceTypeScriptProjectTypeLayer? {
            val document = localDocumentFile(documentPath) ?: return null
            val projectRoot = findProjectRoot(document, profile.id) ?: return null
            val normalizedDocument = normalizedCanonicalFile(document)
            if (!isInside(normalizedDocument, projectRoot)) return null
            val documentRelativePath = projectRoot.toPath()
                .relativize(normalizedDocument.toPath())
                .toString()
                .replace(File.separatorChar, '/')
                .takeIf(String::isNotBlank)
                ?: return null
            requireCanonicalRelativePath(documentRelativePath)

            val dependencyRoot = File(projectRoot, NODE_MODULES_DIRECTORY)
            val dependencyCapture = if (dependencyRoot.exists()) {
                collectDependencyFiles(projectRoot, dependencyRoot)
            } else {
                DependencyCapture(emptyList(), null)
            }
            val dependencyFiles = dependencyCapture.files
            val textByUri = LinkedHashMap<String, String>(dependencyFiles.size + 1)
            dependencyFiles.forEach { file ->
                if (!file.archivePath.startsWith(DEPENDENCY_ARCHIVE_PREFIX)) return@forEach
                val relativePath = file.archivePath.removePrefix(DEPENDENCY_ARCHIVE_PREFIX)
                textByUri[virtualUri("$NODE_MODULES_DIRECTORY/$relativePath")] = file.text
            }
            val rootPackage = File(projectRoot, PACKAGE_METADATA_NAME)
            if (rootPackage.isFile) {
                readUtf8File(rootPackage, MAX_SINGLE_FILE_BYTES)?.let { packageText ->
                    textByUri[virtualUri(PACKAGE_METADATA_NAME)] = packageText.text
                }
            }

            val descriptors = dependencyFiles.sortedBy(DependencyFile::archivePath)
            val inventoryFingerprint = descriptors
                .takeIf(List<DependencyFile>::isNotEmpty)
                ?.let(::dependencyInventoryFingerprint)
            val identityFile = descriptors.firstOrNull { descriptor ->
                descriptor.archivePath == PACKAGE_LOCK_ARCHIVE_PATH
            } ?: descriptors.firstOrNull { descriptor ->
                descriptor.archivePath == PNPM_LOCK_ARCHIVE_PATH
            }
            val identityKind = when (identityFile?.archivePath) {
                PACKAGE_LOCK_ARCHIVE_PATH -> IDENTITY_PACKAGE_LOCK
                PNPM_LOCK_ARCHIVE_PATH -> IDENTITY_PNPM_LOCK
                else -> IDENTITY_CONTENT
            }
            val identityPath = identityFile?.archivePath.orEmpty()
            val identityFingerprint = identityFile?.sha256 ?: inventoryFingerprint
            val layerFingerprint = if (
                inventoryFingerprint != null && identityFingerprint != null
            ) {
                dependencyLayerFingerprint(
                    identityKind = identityKind,
                    identityPath = identityPath,
                    identityFingerprint = identityFingerprint,
                    inventoryFingerprint = inventoryFingerprint,
                )
            } else {
                null
            }
            val typeDirectiveNames = dependencyFiles.asSequence()
                .mapNotNull { file ->
                    AT_TYPES_ARCHIVE_PATTERN.find(file.archivePath)
                        ?.groupValues
                        ?.getOrNull(1)
                }
                .distinct()
                .sorted()
                .toList()
            val immutableTextByUri = Collections.unmodifiableMap(textByUri)
            val fileUris = Collections.unmodifiableList(textByUri.keys.sorted())
            return AceTypeScriptProjectTypeLayer(
                projectRootPath = projectRoot.path,
                documentUri = virtualUri(documentRelativePath),
                fileUris = fileUris,
                typeDirectiveNames = Collections.unmodifiableList(typeDirectiveNames),
                dependencyLayerFingerprint = layerFingerprint,
                dependencyInventoryFingerprint = inventoryFingerprint,
                dependencyFileCount = descriptors.size,
                dependencyByteLength = descriptors.sumOf(DependencyFile::size),
                dependencyPathByteLength = descriptors.sumOf { descriptor ->
                    descriptor.archivePath.toByteArray(StandardCharsets.UTF_8).size.toLong()
                },
                dependencyBoundaryCode = dependencyCapture.boundary?.code,
                dependencyBoundaryDetail = dependencyCapture.boundary?.detail(),
                textByUri = immutableTextByUri,
            )
        }

        private fun collectDependencyFiles(
            projectRoot: File,
            requestedDependencyRoot: File,
        ): DependencyCapture {
            val dependencyRoot = normalizedCanonicalFile(requestedDependencyRoot)
            require(dependencyRoot.isDirectory && isInside(dependencyRoot, projectRoot))
            require(requestedDependencyRoot.absoluteFile.normalize().path == dependencyRoot.path)
            val files = ArrayList<DependencyFile>()
            val boundaries = ArrayList<DependencyBoundary>()
            var totalBytes = 0L
            var totalPathBytes = 0L
            dependencyRoot.walkTopDown()
                .onEnter { directory ->
                    if (directory == dependencyRoot) {
                        true
                    } else {
                        require(directory.absoluteFile.normalize().path == normalizedCanonicalFile(directory).path)
                        directory.name.lowercase(Locale.ROOT) !in EXCLUDED_DIRECTORY_NAMES
                    }
                }
                .filter(File::isFile)
                .forEach { candidate ->
                    val file = normalizedCanonicalFile(candidate)
                    require(isInside(file, dependencyRoot))
                    require(candidate.absoluteFile.normalize().path == file.path)
                    val relativePath = dependencyRoot.toPath()
                        .relativize(file.toPath())
                        .toString()
                        .replace(File.separatorChar, '/')
                    requireCanonicalRelativePath(relativePath)
                    dependencyPathBoundary(relativePath)?.let(boundaries::add)
                    if (!isCompilationRelevantDependencyPath(relativePath)) return@forEach
                    val archivePath = DEPENDENCY_ARCHIVE_PREFIX + relativePath
                    val content = requireNotNull(readUtf8File(file, MAX_SINGLE_FILE_BYTES))
                    dependencyMetadataBoundary(relativePath, content.text)?.let(boundaries::add)
                    totalBytes = Math.addExact(totalBytes, content.size)
                    totalPathBytes = Math.addExact(
                        totalPathBytes,
                        archivePath.toByteArray(StandardCharsets.UTF_8).size.toLong(),
                    )
                    require(files.size < MAX_FILES)
                    require(totalBytes <= MAX_TOTAL_BYTES)
                    require(totalPathBytes <= MAX_PATH_BYTES)
                    files += DependencyFile(
                        archivePath = archivePath,
                        size = content.size,
                        sha256 = sha256(content.bytes),
                        text = content.text,
                    )
                }
            if (files.isNotEmpty()) {
                dependencyIdentityFile(projectRoot)?.let { identity ->
                    totalBytes = Math.addExact(totalBytes, identity.size)
                    totalPathBytes = Math.addExact(
                        totalPathBytes,
                        identity.archivePath.toByteArray(StandardCharsets.UTF_8).size.toLong(),
                    )
                    require(files.size < MAX_FILES)
                    require(totalBytes <= MAX_TOTAL_BYTES)
                    require(totalPathBytes <= MAX_PATH_BYTES)
                    files += identity
                }
            }
            val boundary = boundaries.minWithOrNull(
                compareBy<DependencyBoundary>(
                    DependencyBoundary::priority,
                    DependencyBoundary::relativePath,
                    DependencyBoundary::signal,
                ),
            )
            return DependencyCapture(files.sortedBy(DependencyFile::archivePath), boundary)
        }

        private fun dependencyPathBoundary(relativePath: String): DependencyBoundary? {
            val foldedName = relativePath.substringAfterLast('/').lowercase(Locale.ROOT)
            return when {
                foldedName.endsWith(NATIVE_BINARY_SUFFIX) -> DependencyBoundary(
                    code = ERROR_NATIVE_DEPENDENCY_UNSUPPORTED,
                    signal = "native-binary",
                    relativePath = relativePath,
                    packageName = inferPackageName(relativePath),
                    priority = 0,
                )
                foldedName == BINDING_GYP_NAME -> DependencyBoundary(
                    code = ERROR_NATIVE_DEPENDENCY_UNSUPPORTED,
                    signal = "binding-gyp",
                    relativePath = relativePath,
                    packageName = inferPackageName(relativePath),
                    priority = 1,
                )
                else -> null
            }
        }

        private fun dependencyMetadataBoundary(
            relativePath: String,
            text: String,
        ): DependencyBoundary? {
            if (!relativePath.substringAfterLast('/').equals(PACKAGE_METADATA_NAME, true)) {
                return null
            }
            val root = runCatching { JsonParser.parseString(text) }
                .getOrNull()
                ?.takeIf { element -> element.isJsonObject }
                ?.asJsonObject
                ?: return null
            val packageName = root.get("name")
                ?.takeIf { element ->
                    element.isJsonPrimitive && element.asJsonPrimitive.isString
                }
                ?.asString
                ?.takeIf(String::isNotBlank)
                ?: inferPackageName(relativePath)
            val gypfile = root.get("gypfile")
            if (
                gypfile?.isJsonPrimitive == true &&
                gypfile.asJsonPrimitive.isBoolean &&
                gypfile.asBoolean
            ) {
                return DependencyBoundary(
                    code = ERROR_NATIVE_DEPENDENCY_UNSUPPORTED,
                    signal = "gypfile",
                    relativePath = relativePath,
                    packageName = packageName,
                    priority = 2,
                )
            }
            val scripts = root.get("scripts")
                ?.takeIf { element -> element.isJsonObject }
                ?.asJsonObject
                ?: return null
            val lifecycle = INSTALL_LIFECYCLE_KEYS.firstOrNull(scripts::has) ?: return null
            return DependencyBoundary(
                code = ERROR_DEPENDENCY_INSTALL_SCRIPT_UNSUPPORTED,
                signal = "scripts.$lifecycle",
                relativePath = relativePath,
                packageName = packageName,
                priority = 3,
            )
        }

        private fun inferPackageName(relativePath: String): String {
            val segments = relativePath.split('/')
            val nestedNodeModules = segments.indexOfLast { segment ->
                segment.equals(NODE_MODULES_DIRECTORY, true)
            }
            val packageStart = nestedNodeModules + 1
            val first = segments.getOrNull(packageStart).orEmpty()
            if (first.isBlank()) return "unknown"
            return if (first.startsWith('@')) {
                listOfNotNull(first, segments.getOrNull(packageStart + 1)).joinToString("/")
            } else {
                first
            }
        }

        private fun dependencyIdentityFile(projectRoot: File): DependencyFile? {
            val selected = listOf(
                PACKAGE_LOCK_NAME to PACKAGE_LOCK_ARCHIVE_PATH,
                PNPM_LOCK_NAME to PNPM_LOCK_ARCHIVE_PATH,
            ).firstOrNull { (name, _) -> File(projectRoot, name).isFile } ?: return null
            val requested = File(projectRoot, selected.first)
            val file = normalizedCanonicalFile(requested)
            require(isInside(file, projectRoot))
            require(requested.absoluteFile.normalize().path == file.path)
            val content = requireNotNull(readUtf8File(file, MAX_LOCKFILE_BYTES))
            return DependencyFile(
                archivePath = selected.second,
                size = content.size,
                sha256 = sha256(content.bytes),
                text = content.text,
            )
        }

        private fun dependencyInventoryFingerprint(files: List<DependencyFile>): String {
            val digest = MessageDigest.getInstance("SHA-256")
            digest.update(INVENTORY_DOMAIN.toByteArray(StandardCharsets.US_ASCII))
            digest.update('\n'.code.toByte())
            files.forEach { file ->
                digest.update(file.archivePath.toByteArray(StandardCharsets.UTF_8))
                digest.update(0)
                digest.update(file.size.toString().toByteArray(StandardCharsets.US_ASCII))
                digest.update(0)
                digest.update(file.sha256.toByteArray(StandardCharsets.US_ASCII))
                digest.update('\n'.code.toByte())
            }
            return digest.digest().toLowerHex()
        }

        private fun dependencyLayerFingerprint(
            identityKind: String,
            identityPath: String,
            identityFingerprint: String,
            inventoryFingerprint: String,
        ): String {
            val canonical =
                "$FINGERPRINT_DOMAIN|schemaRevision=1|policyRevision=2" +
                    "|policyFingerprint=$DEPENDENCY_LAYER_POLICY_FINGERPRINT" +
                    "|identityKind=$identityKind|identityPath=$identityPath" +
                    "|identityFingerprint=$identityFingerprint" +
                    "|inventoryFingerprint=$inventoryFingerprint"
            return sha256(canonical.toByteArray(StandardCharsets.US_ASCII))
        }

        private fun readUtf8File(file: File, maximumBytes: Long): Utf8Content? {
            if (!file.isFile || file.length() !in 0..maximumBytes) return null
            val bytes = file.readBytes()
            require(bytes.size.toLong() <= maximumBytes)
            val decoder = StandardCharsets.UTF_8.newDecoder()
                .onMalformedInput(CodingErrorAction.REPORT)
                .onUnmappableCharacter(CodingErrorAction.REPORT)
            val text = decoder.decode(ByteBuffer.wrap(bytes)).toString()
            return Utf8Content(bytes, bytes.size.toLong(), text)
        }

        private fun isCompilationRelevantDependencyPath(relativePath: String): Boolean {
            val segments = relativePath.split('/')
            if (segments.size < 2) return false
            val foldedSegments = segments.map { segment -> segment.lowercase(Locale.ROOT) }
            if (foldedSegments.any(EXCLUDED_DIRECTORY_NAMES::contains)) return false
            val name = foldedSegments.last()
            return EXCLUDED_SUFFIXES.none(name::endsWith) &&
                ALLOWED_SUFFIXES.any(name::endsWith)
        }

        private fun findProjectRoot(
            document: File,
            profileId: String,
        ): File? {
            var directory = normalizedCanonicalFile(document).parentFile ?: return null
            while (true) {
                val hasBoundary = PROJECT_BOUNDARY_NAMES.any { name ->
                    File(directory, name).isFile
                } || profileId == AceTypeScriptExecutionProfiles.PROFILE_NODE &&
                    File(directory, PACKAGE_METADATA_NAME).isFile
                if (hasBoundary) return normalizedCanonicalFile(directory)
                directory = directory.parentFile ?: return null
            }
        }

        private fun localDocumentFile(documentPath: String): File? {
            val value = documentPath.substringBefore('?').substringBefore('#').trim()
            if (value.isEmpty()) return null
            if (WINDOWS_ABSOLUTE_PATH.matches(value)) return File(value)
            if (value.startsWith("file:", ignoreCase = true)) {
                return runCatching { File(URI(value)) }.getOrNull()
            }
            if (URI_SCHEME.containsMatchIn(value)) return null
            return File(value).takeIf(File::isAbsolute)
        }

        private fun virtualUri(relativePath: String): String {
            requireCanonicalRelativePath(relativePath)
            return "${AceLspServerManager.SYNTHETIC_ROOT_URI}/$relativePath"
        }

        private fun requireCanonicalRelativePath(path: String) {
            require(path.isNotBlank() && !path.startsWith('/') && '\\' !in path)
            require(path.split('/').all { segment ->
                segment.isNotEmpty() && segment != "." && segment != ".." &&
                    segment.none { character -> Character.isISOControl(character.code) }
            })
        }

        private fun normalizedCanonicalFile(file: File): File =
            runCatching { file.canonicalFile }.getOrElse { file.absoluteFile.normalize() }

        private fun isInside(file: File, root: File): Boolean =
            file.toPath().startsWith(root.toPath())

        private fun sha256(bytes: ByteArray): String =
            MessageDigest.getInstance("SHA-256").digest(bytes).toLowerHex()

        private fun ByteArray.toLowerHex(): String = joinToString(separator = "") { byte ->
            "%02x".format(Locale.ROOT, byte.toInt() and 0xff)
        }

        private data class Utf8Content(
            val bytes: ByteArray,
            val size: Long,
            val text: String,
        )

        private data class DependencyFile(
            val archivePath: String,
            val size: Long,
            val sha256: String,
            val text: String,
        )

        private data class DependencyCapture(
            val files: List<DependencyFile>,
            val boundary: DependencyBoundary?,
        )

        private data class DependencyBoundary(
            val code: String,
            val signal: String,
            val relativePath: String,
            val packageName: String,
            val priority: Int,
        ) {
            fun detail(): String = when (code) {
                ERROR_NATIVE_DEPENDENCY_UNSUPPORTED ->
                    "$code: Dependency '$packageName' contains native addon signal '$signal' " +
                        "at node_modules/$relativePath. Android TypeScript projects do not " +
                        "load npm native addons; use a pure JavaScript/TypeScript or WASM alternative."
                else ->
                    "$code: Dependency '$packageName' declares install lifecycle signal " +
                        "'$signal' at node_modules/$relativePath. Android snapshots never run " +
                        "preinstall, install, or postinstall scripts; use a published pure-JS/WASM package."
            }
        }

        private const val NODE_MODULES_DIRECTORY = "node_modules"
        private const val PACKAGE_METADATA_NAME = "package.json"
        private const val PACKAGE_LOCK_NAME = "package-lock.json"
        private const val PNPM_LOCK_NAME = "pnpm-lock.yaml"
        private const val DEPENDENCY_ARCHIVE_PREFIX = "dependencies/node_modules/"
        private const val PACKAGE_LOCK_ARCHIVE_PATH =
            "dependencies/lockfiles/package-lock.json"
        private const val PNPM_LOCK_ARCHIVE_PATH = "dependencies/lockfiles/pnpm-lock.yaml"
        private const val IDENTITY_PACKAGE_LOCK = "package-lock"
        private const val IDENTITY_PNPM_LOCK = "pnpm-lock"
        private const val IDENTITY_CONTENT = "content"
        private const val INVENTORY_DOMAIN = "autojs6.typescript.dependency-layer.inventory.v1"
        private const val FINGERPRINT_DOMAIN = "autojs6.typescript.dependency-layer.fingerprint.v1"
        private const val DEPENDENCY_LAYER_POLICY_FINGERPRINT =
            "c159ae179de24307c456c69ae4e456ed9d7dba71dc965c22e6114f632af3834a"
        private const val NATIVE_BINARY_SUFFIX = ".node"
        private const val BINDING_GYP_NAME = "binding.gyp"
        private const val ERROR_NATIVE_DEPENDENCY_UNSUPPORTED =
            "ERR_AUTOJS6_TYPESCRIPT_NATIVE_DEPENDENCY_UNSUPPORTED"
        private const val ERROR_DEPENDENCY_INSTALL_SCRIPT_UNSUPPORTED =
            "ERR_AUTOJS6_TYPESCRIPT_DEPENDENCY_INSTALL_SCRIPT_UNSUPPORTED"
        private const val MAX_FILES = 8_192
        private const val MAX_SINGLE_FILE_BYTES = 8L * 1024L * 1024L
        private const val MAX_TOTAL_BYTES = 64L * 1024L * 1024L
        private const val MAX_LOCKFILE_BYTES = 8L * 1024L * 1024L
        private const val MAX_PATH_BYTES = 1536L * 1024L
        private val PROJECT_BOUNDARY_NAMES = setOf("project.json", "tsconfig.json")
        private val EXCLUDED_DIRECTORY_NAMES = setOf(
            ".bin",
            ".git",
            ".github",
            "bench",
            "benchmark",
            "benchmarks",
            "coverage",
            "doc",
            "docs",
            "example",
            "examples",
            "test",
            "tests",
        )
        private val ALLOWED_SUFFIXES = setOf(
            ".cjs",
            ".cts",
            ".js",
            ".json",
            ".jsx",
            ".mjs",
            ".mts",
            ".ts",
            ".tsx",
        )
        private val EXCLUDED_SUFFIXES = setOf(".map", ".markdown", ".md")
        private val INSTALL_LIFECYCLE_KEYS = listOf("install", "postinstall", "preinstall")
        private val AT_TYPES_ARCHIVE_PATTERN =
            Regex("^dependencies/node_modules/@types/([^/]+)/")
        private val WINDOWS_ABSOLUTE_PATH = Regex("^[A-Za-z]:[\\\\/].+")
        private val URI_SCHEME = Regex("^[A-Za-z][A-Za-z0-9+.-]*:")
    }
}
