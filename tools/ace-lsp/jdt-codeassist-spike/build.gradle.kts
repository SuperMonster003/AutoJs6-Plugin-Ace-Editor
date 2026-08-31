plugins {
    java
}

repositories {
    mavenCentral()
}

dependencyLocking {
    lockAllConfigurations()
}

val probe by configurations.creating {
    isCanBeConsumed = false
    isCanBeResolved = true
}

dependencies {
    implementation("org.eclipse.jdt:org.eclipse.jdt.core:3.26.0")
    probe("org.eclipse.jdt:org.eclipse.jdt.core:3.26.0")
}

tasks.register<JavaExec>("runProbe") {
    group = "verification"
    description = "Attempts one local-variable member completion through JDT Code Assist."
    classpath = sourceSets.main.get().runtimeClasspath
    mainClass.set("org.autojs.probe.G6JdtCodeAssistProbe")
}

tasks.register<Sync>("resolveProbe") {
    group = "verification"
    description = "Resolves the fixed G6-3 JDT Code Assist runtime graph without packaging it."
    from(probe)
    into(layout.buildDirectory.dir("resolved"))
}

tasks.register("reportProbe") {
    group = "verification"
    description = "Reports the fixed G6-3 JDT Code Assist dependency graph and raw size."
    dependsOn("resolveProbe")
    doLast {
        val files = probe.resolve().sortedBy { it.name }
        files.forEach { file -> println("${file.length()}\t${file.name}") }
        println("TOTAL_BYTES=${files.sumOf(File::length)}")
        println("ARTIFACT_COUNT=${files.size}")
    }
}
