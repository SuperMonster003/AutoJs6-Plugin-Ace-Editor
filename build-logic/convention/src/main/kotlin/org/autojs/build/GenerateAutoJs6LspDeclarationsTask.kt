package org.autojs.build

import javax.inject.Inject
import org.gradle.api.DefaultTask
import org.gradle.api.file.ConfigurableFileCollection
import org.gradle.api.file.DirectoryProperty
import org.gradle.api.file.RegularFileProperty
import org.gradle.api.provider.Property
import org.gradle.api.tasks.CacheableTask
import org.gradle.api.tasks.Input
import org.gradle.api.tasks.InputFile
import org.gradle.api.tasks.InputFiles
import org.gradle.api.tasks.Internal
import org.gradle.api.tasks.OutputDirectory
import org.gradle.api.tasks.PathSensitive
import org.gradle.api.tasks.PathSensitivity
import org.gradle.api.tasks.TaskAction
import org.gradle.process.ExecOperations

/**
 * Generates deterministic, LSP-ready AutoJs6 declaration bundles from the declarations retained
 * in the editor assets.
 */
@CacheableTask
abstract class GenerateAutoJs6LspDeclarationsTask @Inject constructor(
    private val execOperations: ExecOperations,
) : DefaultTask() {

    @get:InputFiles
    @get:PathSensitive(PathSensitivity.RELATIVE)
    abstract val declarationFiles: ConfigurableFileCollection

    @get:InputFile
    @get:PathSensitive(PathSensitivity.RELATIVE)
    abstract val packageMetadataFile: RegularFileProperty

    @get:InputFile
    @get:PathSensitive(PathSensitivity.RELATIVE)
    abstract val generatorScript: RegularFileProperty

    @get:InputFile
    @get:PathSensitive(PathSensitivity.RELATIVE)
    abstract val typescriptRuntime: RegularFileProperty

    /**
     * The generator validates every declaration-lib reference against the bundled TypeScript
     * standard libraries. Model the complete library set so additions, removals, and content
     * updates invalidate the cached output deterministically.
     */
    @get:InputFiles
    @get:PathSensitive(PathSensitivity.RELATIVE)
    abstract val typescriptLibraryFiles: ConfigurableFileCollection

    @get:Input
    abstract val nodeExecutable: Property<String>

    /**
     * The path itself is not an input: [declarationFiles] and [packageMetadataFile] provide the
     * complete content snapshot while this property supplies their common base to the generator.
     */
    @get:Internal
    abstract val declarationsDirectory: DirectoryProperty

    @get:OutputDirectory
    abstract val outputDirectory: DirectoryProperty

    @TaskAction
    fun generate() {
        execOperations.exec {
            executable(nodeExecutable.get())
            args(
                "--max-old-space-size=2048",
                generatorScript.get().asFile.absolutePath,
                "--source",
                declarationsDirectory.get().asFile.absolutePath,
                "--output",
                outputDirectory.get().asFile.absolutePath,
                "--typescript",
                typescriptRuntime.get().asFile.absolutePath,
            )
        }.assertNormalExitValue()
    }
}
