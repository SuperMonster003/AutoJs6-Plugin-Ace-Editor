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
val autoJs6NodeExecutable = providers.gradleProperty("autojs6.nodeExecutable").orElse("node")
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
    description = "Verifies all TypeScript 6 declaration groups and the old-WebView static fallback."
    dependsOn(generateAutoJs6LspDeclarations)

    val verifier = rootProject.layout.projectDirectory.file("tools/ace-lsp/verify-runtime.mjs")
    val runtime = autoJs6TypeScriptDirectory.file("typescript.js")
    val service = autoJs6EditorAssetsDirectory.file("autojs6_ts_language_service.js")
    val client = autoJs6EditorAssetsDirectory.file("autojs6_lsp_client.js")
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
        client,
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
            "--client",
            client.asFile.absolutePath,
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
        )
    }
}

tasks.named("check") {
    dependsOn(verifyAutoJs6LspRuntime)
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
    implementation(libs.gson)
    implementation(libs.okhttp)
    implementation(libs.webkit)

    testImplementation(libs.junit)
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
