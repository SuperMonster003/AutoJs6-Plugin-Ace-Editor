import com.android.build.api.variant.FilterConfiguration
import org.autojs.build.GenerateAutoJs6LspDeclarationsTask
import org.gradle.api.provider.Property
import org.gradle.api.tasks.Exec
import java.util.Properties

plugins {
    id("org.autojs.build.utils")
    id("org.autojs.build.versions")
    id("org.autojs.build.signs")
    id("org.autojs.build.jvm-convention")
    id("com.android.application")
}

val globalApplicationId = "io.github.supermonster003.autojs6.plugin.ace.editor"

var isSignsValid = false

val autoJs6LspDeclarationsDirectory = layout.projectDirectory.dir(
    "src/main/assets/editor/ace-builds-1.4.12/autojs6/types",
)
val autoJs6TypeScriptDirectory = layout.projectDirectory.dir(
    "src/main/assets/editor/ace-builds-1.4.12/autojs6/typescript",
)
val autoJs6EditorAssetsDirectory = layout.projectDirectory.dir(
    "src/main/assets/editor/ace-builds-1.4.12/autojs6",
)
val autoJs6LanguageIndicesDirectory = autoJs6EditorAssetsDirectory.dir("indices")
val autoJs6PythonWorkerDirectory = autoJs6EditorAssetsDirectory.dir("python")
val autoJs6LuaRuntimeDirectory = layout.projectDirectory.dir("src/main/assets/luals")
val autoJs6LuaJniDirectory = layout.projectDirectory.dir("src/main/jniLibs")
val autoJs6JavaRuntimeDirectory = layout.projectDirectory.dir("src/main/assets/java/ecj")
val aceDistributionAssetsDirectory = layout.projectDirectory.dir(
    "src/main/assets/editor/ace-builds-1.4.12/src-min-noconflict",
)
val autoJs6NodeExecutable = providers.gradleProperty("autojs6.nodeExecutable").orElse("node")
val autoJs6LanguageIndexGenerator = rootProject.layout.projectDirectory.file(
    "tools/ace-lsp/generate-language-indices.mjs",
)
val generateAutoJs6LanguageIndices = tasks.register<Exec>("generateAutoJs6LanguageIndices") {
    group = "build"
    description = "Regenerates deterministic Python, Lua, Java, and Kotlin static completion indices."
    inputs.file(autoJs6LanguageIndexGenerator)
    outputs.dir(autoJs6LanguageIndicesDirectory)
    workingDir(rootProject.layout.projectDirectory)
    executable(autoJs6NodeExecutable.get())
    args(
        autoJs6LanguageIndexGenerator.asFile.absolutePath,
        "--out-dir",
        autoJs6LanguageIndicesDirectory.asFile.absolutePath,
    )
}
val verifyAutoJs6LanguageIndices = tasks.register<Exec>("verifyAutoJs6LanguageIndices") {
    group = "verification"
    description = "Checks that committed multi-language static completion indices are current."
    inputs.file(autoJs6LanguageIndexGenerator)
    inputs.dir(autoJs6LanguageIndicesDirectory)
    workingDir(rootProject.layout.projectDirectory)
    executable(autoJs6NodeExecutable.get())
    args(
        autoJs6LanguageIndexGenerator.asFile.absolutePath,
        "--out-dir",
        autoJs6LanguageIndicesDirectory.asFile.absolutePath,
        "--check",
    )
}
val verifyAutoJs6KotlinP2Plus = tasks.register<Exec>("verifyAutoJs6KotlinP2Plus") {
    group = "verification"
    description = "Verifies Kotlin P2+ type heuristics, safe calls, instance APIs, and Java/Android index reuse."
    dependsOn(verifyAutoJs6LanguageIndices)
    val verifier = rootProject.layout.projectDirectory.file(
        "tools/ace-lsp/verify-kotlin-p2plus.mjs",
    )
    val completer = autoJs6EditorAssetsDirectory.file("autojs6_completer.js")
    val localSymbols = autoJs6EditorAssetsDirectory.file("autojs6_local_symbols.js")
    val kotlinIndex = autoJs6LanguageIndicesDirectory.file("kotlin.js")
    val javaIndex = autoJs6LanguageIndicesDirectory.file("java.js")
    inputs.files(verifier, completer, localSymbols, kotlinIndex, javaIndex)
    workingDir(rootProject.layout.projectDirectory)
    executable(autoJs6NodeExecutable.get())
    args(
        verifier.asFile.absolutePath,
        "--completer",
        completer.asFile.absolutePath,
        "--local-symbols",
        localSymbols.asFile.absolutePath,
        "--kotlin-index",
        kotlinIndex.asFile.absolutePath,
        "--java-index",
        javaIndex.asFile.absolutePath,
    )
}
val autoJs6PythonWorkerBuilder = rootProject.layout.projectDirectory.file(
    "tools/ace-lsp/build-python-worker.mjs",
)
val generateAutoJs6PythonWorker = tasks.register<Exec>("generateAutoJs6PythonWorker") {
    group = "build"
    description = "Regenerates the pinned Pyright 1.1.413 Python 3.12 WebWorker bundle."
    inputs.files(
        autoJs6PythonWorkerBuilder,
        rootProject.fileTree("tools/ace-lsp/python-worker"),
    )
    outputs.dir(autoJs6PythonWorkerDirectory)
    workingDir(rootProject.layout.projectDirectory)
    executable(autoJs6NodeExecutable.get())
    args(
        autoJs6PythonWorkerBuilder.asFile.absolutePath,
        "--out-dir",
        autoJs6PythonWorkerDirectory.asFile.absolutePath,
    )
    providers.gradleProperty("autojs6.pyrightDir").orNull?.let { pyrightDir ->
        args("--pyright-dir", pyrightDir)
    }
}
val verifyAutoJs6PythonWorker = tasks.register<Exec>("verifyAutoJs6PythonWorker") {
    group = "verification"
    description = "Verifies the pinned Python Worker, semantic feature gate, size, latency, and release lifecycle."
    val verifier = rootProject.layout.projectDirectory.file(
        "tools/ace-lsp/verify-python-worker.mjs",
    )
    inputs.files(
        verifier,
        autoJs6PythonWorkerDirectory.file("autojs6-python-worker.js"),
        autoJs6PythonWorkerDirectory.file("manifest.json"),
        autoJs6PythonWorkerDirectory.file("THIRD_PARTY_LICENSES.txt"),
        autoJs6EditorAssetsDirectory.file("autojs6_python_provider.js"),
    )
    workingDir(rootProject.layout.projectDirectory)
    executable(autoJs6NodeExecutable.get())
    args(
        verifier.asFile.absolutePath,
        "--asset-dir",
        autoJs6PythonWorkerDirectory.asFile.absolutePath,
    )
}
val verifyAutoJs6LuaLanguageServer = tasks.register<Exec>("verifyAutoJs6LuaLanguageServer") {
    group = "verification"
    description =
        "Verifies pinned LuaLS assets, Android ELF ABIs, protocol wiring, fallback, and restart lifecycle."
    val verifier = rootProject.layout.projectDirectory.file(
        "tools/ace-lsp/verify-luals-runtime.mjs",
    )
    val manifestGenerator = rootProject.layout.projectDirectory.file(
        "tools/ace-lsp/generate-luals-manifest.mjs",
    )
    val buildLock = rootProject.layout.projectDirectory.file(
        "tools/ace-lsp/luals-build-lock.json",
    )
    val luaProvider = autoJs6EditorAssetsDirectory.file("autojs6_lua_provider.js")
    val lspCore = autoJs6EditorAssetsDirectory.file("autojs6_lsp_core.js")
    val lspTransports = autoJs6EditorAssetsDirectory.file("autojs6_lsp_transports.js")
    val client = autoJs6EditorAssetsDirectory.file("autojs6_lsp_client.js")
    val bridge = autoJs6EditorAssetsDirectory.file("autojs6_ace_bridge.js")
    val editorHtml = layout.projectDirectory.file(
        "src/main/assets/editor/ace-builds-1.4.12/autojs6_editor.html",
    )
    inputs.files(
        verifier,
        manifestGenerator,
        buildLock,
        luaProvider,
        lspCore,
        lspTransports,
        client,
        bridge,
        editorHtml,
    )
    inputs.dir(autoJs6LuaRuntimeDirectory)
    inputs.dir(autoJs6LuaJniDirectory)
    workingDir(rootProject.layout.projectDirectory)
    executable(autoJs6NodeExecutable.get())
    args(
        verifier.asFile.absolutePath,
        "--asset-root",
        autoJs6LuaRuntimeDirectory.asFile.absolutePath,
        "--jni-root",
        autoJs6LuaJniDirectory.asFile.absolutePath,
        "--lock",
        buildLock.asFile.absolutePath,
        "--manifest-generator",
        manifestGenerator.asFile.absolutePath,
        "--provider",
        luaProvider.asFile.absolutePath,
        "--lsp-core",
        lspCore.asFile.absolutePath,
        "--lsp-transports",
        lspTransports.asFile.absolutePath,
        "--client",
        client.asFile.absolutePath,
        "--bridge",
        bridge.asFile.absolutePath,
        "--html",
        editorHtml.asFile.absolutePath,
    )
}
val verifyAutoJs6JavaSemanticRuntime = tasks.register<Exec>("verifyAutoJs6JavaSemanticRuntime") {
    group = "verification"
    description =
        "Verifies the pinned ECJ classpath, 8 MiB budget, Android bridge wiring, throttling, and lifecycle."
    val verifier = rootProject.layout.projectDirectory.file(
        "tools/ace-lsp/verify-ecj-runtime.mjs",
    )
    val classpathBuilder = rootProject.layout.projectDirectory.file(
        "tools/ace-lsp/build-ecj-classpath.ps1",
    )
    inputs.files(
        verifier,
        classpathBuilder,
        autoJs6JavaRuntimeDirectory.file("android-36-stubs.jar"),
        autoJs6JavaRuntimeDirectory.file("manifest.json"),
        autoJs6JavaRuntimeDirectory.file("THIRD_PARTY_LICENSES.txt"),
        autoJs6EditorAssetsDirectory.file("autojs6_java_provider.js"),
        autoJs6EditorAssetsDirectory.file("autojs6_lsp_client.js"),
        layout.projectDirectory.file("src/main/assets/editor/ace-builds-1.4.12/autojs6_editor.html"),
        layout.projectDirectory.file(
            "src/main/java/io/github/supermonster003/autojs6/plugin/ace/editor/core/AceBridge.kt",
        ),
        layout.projectDirectory.file(
            "src/main/java/io/github/supermonster003/autojs6/plugin/ace/editor/core/AceCodeEditor.kt",
        ),
        layout.projectDirectory.file(
            "src/main/java/io/github/supermonster003/autojs6/plugin/ace/editor/core/lsp/AceJavaSemanticRuntime.kt",
        ),
        layout.projectDirectory.file(
            "src/main/java/io/github/supermonster003/autojs6/plugin/ace/editor/core/lsp/AceJavaClasspathRuntime.kt",
        ),
        layout.projectDirectory.file("src/main/java/javax/lang/model/SourceVersion.java"),
        layout.projectDirectory.file("proguard-rules.pro"),
    )
    workingDir(rootProject.layout.projectDirectory)
    executable(autoJs6NodeExecutable.get())
    args(
        verifier.asFile.absolutePath,
        "--repo-root",
        rootProject.layout.projectDirectory.asFile.absolutePath,
    )
}
val generateAutoJs6LspDeclarations = tasks.register<GenerateAutoJs6LspDeclarationsTask>(
    "generateAutoJs6LspDeclarations",
) {
    group = "build"
    description = "Generates grouped AutoJs6 declarations and a manifest for the ACE LSP."
    declarationsDirectory.set(autoJs6LspDeclarationsDirectory)
    declarationFiles.from(
        fileTree(autoJs6LspDeclarationsDirectory) {
            include("**/*.d.ts")
            exclude("generated/**")
        },
    )
    packageMetadataFile.set(autoJs6LspDeclarationsDirectory.file("autojs6/package.json"))
    generatorScript.set(
        rootProject.layout.projectDirectory.file("tools/ace-lsp/generate-declarations.mjs"),
    )
    typescriptRuntime.set(autoJs6TypeScriptDirectory.file("typescript.js"))
    typescriptLibraryFiles.from(
        fileTree(autoJs6TypeScriptDirectory) {
            include("lib*.d.ts")
        },
    )
    nodeExecutable.convention(autoJs6NodeExecutable)
    outputDirectory.set(layout.buildDirectory.dir("generated/aceLspAssets"))
}

tasks.register("generateAutoJs6EditorAssets") {
    group = "build"
    description = "Alias for generateAutoJs6LspDeclarations."
    dependsOn(generateAutoJs6LspDeclarations)
}

val verifyAutoJs6LspRuntime = tasks.register<Exec>("verifyAutoJs6LspRuntime") {
    group = "verification"
    description = "Verifies execution-profile diagnostics, declaration groups, and old-WebView fallback."
    dependsOn(generateAutoJs6LspDeclarations, verifyAutoJs6LanguageIndices)

    val verifier = rootProject.layout.projectDirectory.file("tools/ace-lsp/verify-runtime.mjs")
    val runtime = autoJs6TypeScriptDirectory.file("typescript.js")
    val service = autoJs6EditorAssetsDirectory.file("autojs6_ts_language_service.js")
    val semanticProvider = autoJs6EditorAssetsDirectory.file("autojs6_semantic_provider.js")
    val pythonProvider = autoJs6EditorAssetsDirectory.file("autojs6_python_provider.js")
    val luaProvider = autoJs6EditorAssetsDirectory.file("autojs6_lua_provider.js")
    val lspCore = autoJs6EditorAssetsDirectory.file("autojs6_lsp_core.js")
    val lspTransports = autoJs6EditorAssetsDirectory.file("autojs6_lsp_transports.js")
    val client = autoJs6EditorAssetsDirectory.file("autojs6_lsp_client.js")
    val completer = autoJs6EditorAssetsDirectory.file("autojs6_completer.js")
    val localSymbols = autoJs6EditorAssetsDirectory.file("autojs6_local_symbols.js")
    val settings = layout.projectDirectory.file(
        "src/main/java/io/github/supermonster003/autojs6/plugin/ace/editor/core/AceEditorLspPreferences.kt",
    )
    val languageSnippets = listOf("python", "lua", "java", "kotlin").map { language ->
        aceDistributionAssetsDirectory.file("snippets/$language.js")
    }
    val compatibility = autoJs6LspDeclarationsDirectory.file("lib.autojs6.extra.d.ts")
    fun generatedDeclaration(groupId: String) = generateAutoJs6LspDeclarations.flatMap { task ->
        task.outputDirectory.file(
            "editor/ace-builds-1.4.12/autojs6/types/generated/lib.autojs6.$groupId.d.ts",
        )
    }
    val generatedCore = generatedDeclaration("core")
    val generatedAndroid = generatedDeclaration("android")
    val generatedLibraries = generatedDeclaration("libraries")
    val generatedResources = generatedDeclaration("resources")
    val generatedMainApp = generatedDeclaration("main-app")
    inputs.files(
        verifier,
        runtime,
        service,
        semanticProvider,
        pythonProvider,
        luaProvider,
        lspCore,
        lspTransports,
        client,
        completer,
        localSymbols,
        settings,
        autoJs6LanguageIndicesDirectory,
        languageSnippets,
        compatibility,
        generatedCore,
        generatedAndroid,
        generatedLibraries,
        generatedResources,
        generatedMainApp,
    )

    workingDir(rootProject.layout.projectDirectory)
    doFirst {
        executable(autoJs6NodeExecutable.get())
        args(
            verifier.asFile.absolutePath,
            "--runtime",
            runtime.asFile.absolutePath,
            "--service",
            service.asFile.absolutePath,
            "--semantic-provider",
            semanticProvider.asFile.absolutePath,
            "--python-provider",
            pythonProvider.asFile.absolutePath,
            "--lua-provider",
            luaProvider.asFile.absolutePath,
            "--lsp-core",
            lspCore.asFile.absolutePath,
            "--lsp-transports",
            lspTransports.asFile.absolutePath,
            "--client",
            client.asFile.absolutePath,
            "--completer",
            completer.asFile.absolutePath,
            "--local-symbols",
            localSymbols.asFile.absolutePath,
            "--language-indices",
            autoJs6LanguageIndicesDirectory.asFile.absolutePath,
            "--ace-assets",
            aceDistributionAssetsDirectory.asFile.absolutePath,
            "--core",
            generatedCore.get().asFile.absolutePath,
            "--android",
            generatedAndroid.get().asFile.absolutePath,
            "--libraries",
            generatedLibraries.get().asFile.absolutePath,
            "--resources",
            generatedResources.get().asFile.absolutePath,
            "--main-app",
            generatedMainApp.get().asFile.absolutePath,
            "--compatibility",
            compatibility.asFile.absolutePath,
            "--settings",
            settings.asFile.absolutePath,
        )
    }
}

tasks.named("check") {
    dependsOn(
        verifyAutoJs6LspRuntime,
        verifyAutoJs6PythonWorker,
        verifyAutoJs6LuaLanguageServer,
        verifyAutoJs6JavaSemanticRuntime,
        verifyAutoJs6KotlinP2Plus,
    )
}

android {
    namespace = globalApplicationId
    compileSdk = versions.sdkVersionCompile

    defaultConfig {
        applicationId = globalApplicationId
        minSdk = versions.sdkVersionMin
        targetSdk = versions.sdkVersionTarget
        versionCode = versions.appVersionCode
        versionName = versions.appVersionName
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"

        buildConfigField("String", "VERSION_DATE", "\"${utils.getDateString("MMM d, yyyy", "GMT+08:00")}\"")
        buildConfigField("String", "PLUGIN_ID", "\"ace-editor\"")
        buildConfigField("String", "PLUGIN_ENGINE", "\"editor\"")
        buildConfigField("String", "PLUGIN_VARIANT", "\"ace\"")
    }

    lint {
        abortOnError = false
    }

    signingConfigs {
        val props = Properties().also { properties ->
            File("${project.rootDir}/sign.properties").takeIf { it.exists() }?.let { file ->
                file.inputStream().use { properties.load(it) }
                isSignsValid = properties.isNotEmpty()
            }
        }
        if (isSignsValid) {
            create("release") {
                storeFile = props["storeFile"]?.let { file(it as String) }
                keyPassword = props["keyPassword"] as String
                keyAlias = props["keyAlias"] as String
                storePassword = props["storePassword"] as String
            }
        }
    }

    buildTypes {
        val releaseSigningConfig = takeIf { isSignsValid }?.let {
            signingConfigs.getByName("release")
        }
        debug {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro",
            )
            releaseSigningConfig?.let { signingConfig = it }
        }
        release {
            isMinifyEnabled = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro",
            )
            releaseSigningConfig?.let { signingConfig = it }
        }
    }

    buildFeatures {
        aidl = true
        buildConfig = true
    }

    packaging {
        jniLibs {
            // LuaLS is launched directly from ApplicationInfo.nativeLibraryDir.
            // Legacy packaging keeps the selected ABI's ELF extracted and executable. Preserve
            // the pinned bytes too: the runtime validates this file against the build lock before
            // executing it, so AGP's normal debug-symbol stripping must not rewrite the ELF.
            useLegacyPackaging = true
            keepDebugSymbols += "**/libautojs6_luals.so"
            keepDebugSymbols += "**/libautojs6_luals_install_compat.so"
        }
        resources {
            pickFirsts += listOf(
                "META-INF/DEPENDENCIES",
                "META-INF/LICENSE",
                "META-INF/LICENSE.*",
                "META-INF/NOTICE",
                "META-INF/NOTICE.*",
                "META-INF/*.kotlin_module",
            )
        }
    }

    bundle {
        language.enableSplit = false
        density.enableSplit = false
        abi.enableSplit = false
    }
}

androidComponents {
    onVariants { variant ->
        variant.sources.assets?.addGeneratedSourceDirectory(
            generateAutoJs6LspDeclarations,
            GenerateAutoJs6LspDeclarationsTask::outputDirectory,
        )
        variant.outputs.forEach { output ->
            val architecture = output.filters.find {
                it.filterType == FilterConfiguration.FilterType.ABI
            }?.identifier ?: "universal"
            val outputFileNameProperty = output.javaClass.methods.firstOrNull {
                it.name == "getOutputFileName" && it.parameterTypes.isEmpty()
            }?.invoke(output) as? Property<*>

            @Suppress("UNCHECKED_CAST")
            (outputFileNameProperty as? Property<String>)?.set(
                output.versionName.map { versionName ->
                    "${rootProject.name}-v$versionName-$architecture.apk".lowercase()
                },
            )
        }
    }
}

dependencies {
    implementation(files("$rootDir/libs/common-plugin-api.aar"))
    compileOnly(files("$rootDir/libs/editor-api.aar"))
    testImplementation(files("$rootDir/libs/editor-api.aar"))

    implementation("org.jetbrains.kotlin:kotlin-stdlib:2.2.21")
    implementation("org.jetbrains.kotlin:kotlin-parcelize-runtime:2.2.21")
    implementation(libs.annotation)
    implementation(libs.core.ktx)
    implementation(libs.ecj)
    implementation(libs.gson)
    implementation(libs.okhttp)
    implementation(libs.webkit)

    testImplementation(libs.junit)
    androidTestImplementation(libs.test.espresso.core)
    androidTestImplementation(libs.test.ext.junit)
    androidTestImplementation(libs.test.runner)
    androidTestImplementation(files("$rootDir/libs/editor-api.aar"))
}

tasks {
    withType(JavaCompile::class.java) {
        options.encoding = "UTF-8"
    }

    register<Copy>("appendDigestToReleasedFiles") {
        val buildTypeRelease = "release"
        val ext = utils.FILE_EXTENSION_APK
        val dst = "${buildTypeRelease}s"
        val srcDirs = listOf(file(buildTypeRelease)) + android.productFlavors.map { flavor ->
            file("${flavor.name}/$buildTypeRelease")
        }

        from(srcDirs) {
            include("*.$ext")
            eachFile {
                val suffix = ".$ext"
                val digest = utils.digestCRC32(file)
                name = "${name.removeSuffix(suffix)}-$digest$suffix"
            }
        }
        into(dst)
        includeEmptyDirs = false
        duplicatesStrategy = DuplicatesStrategy.FAIL

        doLast { println("Destination: ${file(dst)}") }
    }
}
