plugins {
    java
}

repositories {
    google()
    mavenCentral()
}

dependencyLocking {
    lockAllConfigurations()
}

val compilerProbe by configurations.creating {
    isCanBeConsumed = false
    isCanBeResolved = true
}
val d8Tool by configurations.creating {
    isCanBeConsumed = false
    isCanBeResolved = true
}

dependencies {
    implementation("org.jetbrains.kotlin:kotlin-compiler-embeddable:2.2.21")
    compilerProbe("org.jetbrains.kotlin:kotlin-compiler-embeddable:2.2.21")
    d8Tool("com.android.tools:r8:8.10.21")
}

val d8ProbeDirectory = layout.buildDirectory.dir("d8-api24-full-v1")

tasks.register<Sync>("resolveProbe") {
    group = "verification"
    description = "Resolves the fixed G7-0 embeddable Kotlin compiler graph without packaging it."
    from(compilerProbe)
    into(layout.buildDirectory.dir("resolved"))
}

tasks.register("reportProbe") {
    group = "verification"
    description = "Reports the fixed G7-0 Kotlin compiler dependency graph and raw size."
    dependsOn("resolveProbe")
    doLast {
        val files = compilerProbe.resolve().sortedBy { it.name }
        files.forEach { file -> println("${file.length()}\t${file.name}") }
        println("TOTAL_BYTES=${files.sumOf(File::length)}")
        println("ARTIFACT_COUNT=${files.size}")
    }
}

tasks.register<JavaExec>("runProbe") {
    group = "verification"
    description = "Runs valid, syntax-error, and unresolved-symbol Kotlin compiler probes on the desktop JVM."
    classpath = sourceSets.main.get().runtimeClasspath
    mainClass.set("org.autojs.probe.G7KotlinCompilerProbe")
}

tasks.register<JavaExec>("d8Probe") {
    group = "verification"
    description = "Dexes the fixed Kotlin compiler graph with R8/D8 8.10.21 at min API 24."
    dependsOn("resolveProbe")
    classpath = d8Tool
    mainClass.set("com.android.tools.r8.D8")
    outputs.dir(d8ProbeDirectory)
    doFirst {
        val output = d8ProbeDirectory.get().asFile
        project.delete(output)
        check(output.mkdirs()) { "Could not create D8 output directory: $output" }
        setArgs(
            listOf("--min-api", "24", "--output", output.absolutePath) +
                compilerProbe.resolve().sortedBy { it.name }.map(File::getAbsolutePath),
        )
    }
}

tasks.register<Zip>("packageArtProbe") {
    group = "verification"
    description = "Packages externally generated multidex files with compiler resources for ART injection."
    val d8Directory = d8ProbeDirectory
    dependsOn("d8Probe")
    from({
        compilerProbe.resolve()
            .sortedBy { it.name }
            .map { zipTree(it) }
    }) {
        exclude("**/*.class")
        exclude("META-INF/*.SF", "META-INF/*.RSA", "META-INF/*.DSA")
    }
    from(d8Directory)
    includeEmptyDirs = false
    duplicatesStrategy = DuplicatesStrategy.EXCLUDE
    isPreserveFileTimestamps = false
    isReproducibleFileOrder = true
    destinationDirectory.set(layout.buildDirectory.dir("art-probe"))
    archiveFileName.set("kotlin-compiler-2.2.21-api24.zip")
    doFirst {
        val dexFiles = d8Directory.get().asFile.listFiles()
            ?.filter { it.isFile && it.name.matches(Regex("classes(?:\\d+)?\\.dex")) }
            .orEmpty()
        check(dexFiles.size == 6) {
            "Expected the G7-0 six-file D8 8.10.21 output in ${d8Directory.get().asFile}"
        }
    }
}
