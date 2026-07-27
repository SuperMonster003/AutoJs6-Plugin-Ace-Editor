import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import {
    existsSync,
    mkdirSync,
    readFileSync,
    readdirSync,
    renameSync,
    rmSync,
    statSync,
    writeFileSync,
} from "node:fs";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";

const GENERATED_BY = "tools/ace-lsp/generate-declarations.mjs";
const GENERATED_OUTPUT_ROOT = "editor/ace-builds-1.4.12/autojs6/types/generated";
const GENERATED_ASSET_ROOT = "autojs6/types/generated";
const LEGACY_GENERATED_OUTPUT_ROOT = "autojs6/types/generated";
const REFERENCE_DIRECTIVE_PATTERN =
    /^[ \t]*\/\/\/[ \t]*<reference[ \t]+(path|lib)[ \t]*=[ \t]*["']([^"']+)["'][ \t]*\/?>[ \t]*$/gim;
const PATH_REFERENCE_PATTERN =
    /^[ \t]*\/\/\/[ \t]*<reference[ \t]+path[ \t]*=[ \t]*["']([^"']+)["'][ \t]*\/?>[ \t]*$/gim;
const LIB_REFERENCE_PATTERN =
    /^[ \t]*\/\/\/[ \t]*<reference[ \t]+lib[ \t]*=[ \t]*["']([^"']+)["'][ \t]*\/?>[ \t]*$/gim;
const LEGACY_IDENTIFIER_MODULE_PATTERN =
    /^([ \t]*(?:(?:export|declare)[ \t]+)*)module([ \t]+)([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*)([ \t]*\{)/gm;
const CORE_APP_FORWARD_SOURCE = "autojs6/aj6-int-init.d.ts";
const CORE_APP_FORWARD_CLASS_PATTERN =
    /(^[ \t]*export[ \t]+)class([ \t]+App[ \t]+extends[ \t]+java\.lang\.Enum<org\.autojs\.autojs\.util\.App>[ \t]*\{\n[ \t]*\/\*[ \t]*Empty body\.[ \t]*\*\/\n[ \t]*\})/gm;
const IGNORED_DECLARATIONS = new Set([
    "lib.autojs6.d.ts",
    "lib.autojs6.extra.d.ts",
]);
const GROUP_ORDER = [
    "core",
    "android",
    "libraries",
    "resources",
    "main-app",
];

function fail(message) {
    throw new Error(`[AutoJs6 LSP declarations] ${message}`);
}

function parseArguments(argv) {
    const values = new Map();
    for (let index = 0; index < argv.length; index += 1) {
        const argument = argv[index];
        if (argument !== "--source" && argument !== "--output" && argument !== "--typescript") {
            fail(`Unknown argument: ${argument}`);
        }
        const value = argv[index + 1];
        if (!value || value.startsWith("--")) {
            fail(`Missing value for ${argument}`);
        }
        values.set(argument, value);
        index += 1;
    }
    if (!values.has("--source") || !values.has("--output") || !values.has("--typescript")) {
        fail(
            "Usage: node generate-declarations.mjs --source <types-dir> " +
            "--output <assets-dir> --typescript <typescript.js>",
        );
    }
    return {
        sourceDirectory: resolve(values.get("--source")),
        outputDirectory: resolve(values.get("--output")),
        typescriptRuntime: resolve(values.get("--typescript")),
    };
}

function toPosixPath(value) {
    return value.split(sep).join("/");
}

function isPathInside(parent, child) {
    const pathFromParent = relative(parent, child);
    return pathFromParent !== "" &&
        !pathFromParent.startsWith(`..${sep}`) &&
        pathFromParent !== ".." &&
        !isAbsolute(pathFromParent);
}

function listFilesRecursively(directory) {
    const files = [];
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
        const entryPath = join(directory, entry.name);
        if (entry.isDirectory()) {
            files.push(...listFilesRecursively(entryPath));
        } else if (entry.isFile()) {
            files.push(entryPath);
        }
    }
    return files.sort((left, right) => left.localeCompare(right, "en"));
}

function sha256(text) {
    return createHash("sha256").update(text, "utf8").digest("hex");
}

function normalizeSourceText(text) {
    const withoutBom = text.charCodeAt(0) === 0xFEFF ? text.slice(1) : text;
    return withoutBom.replace(/\r\n?/g, "\n");
}

function protectedLexicalRanges(text) {
    const ranges = [];
    let index = 0;
    while (index < text.length) {
        const character = text[index];
        const nextCharacter = text[index + 1];
        let terminator = null;
        let allowNewline = true;
        if (character === "/" && nextCharacter === "/") {
            const start = index;
            index += 2;
            while (index < text.length && text[index] !== "\n") {
                index += 1;
            }
            ranges.push([start, index]);
            continue;
        }
        if (character === "/" && nextCharacter === "*") {
            const start = index;
            index += 2;
            while (index < text.length && !(text[index] === "*" && text[index + 1] === "/")) {
                index += 1;
            }
            index = Math.min(text.length, index + 2);
            ranges.push([start, index]);
            continue;
        }
        if (character === "'" || character === "\"") {
            terminator = character;
            allowNewline = false;
        } else if (character === "`") {
            terminator = character;
        }
        if (terminator !== null) {
            const start = index;
            index += 1;
            while (index < text.length) {
                if (text[index] === "\\") {
                    index = Math.min(text.length, index + 2);
                    continue;
                }
                if (text[index] === terminator) {
                    index += 1;
                    break;
                }
                if (!allowNewline && text[index] === "\n") {
                    break;
                }
                index += 1;
            }
            ranges.push([start, index]);
            continue;
        }
        index += 1;
    }
    return ranges;
}

function isProtectedOffset(ranges, offset) {
    let low = 0;
    let high = ranges.length - 1;
    while (low <= high) {
        const middle = Math.floor((low + high) / 2);
        const [start, end] = ranges[middle];
        if (offset < start) {
            high = middle - 1;
        } else if (offset >= end) {
            low = middle + 1;
        } else {
            return true;
        }
    }
    return false;
}

function normalizeDeclarationText(sourcePath, text) {
    // Keep an empty line in place of each directive so diagnostics retain useful source-relative
    // line numbers inside every concatenated section.
    const normalization = {
        referencePathDirectivesRemoved: 0,
        referenceLibDirectivesRemoved: 0,
        legacyIdentifierModulesRewritten: 0,
        coreAppForwardClassesRewritten: 0,
    };
    REFERENCE_DIRECTIVE_PATTERN.lastIndex = 0;
    let normalized = normalizeSourceText(text).replace(
        REFERENCE_DIRECTIVE_PATTERN,
        (_directive, kind) => {
            if (String(kind).toLowerCase() === "path") {
                normalization.referencePathDirectivesRemoved += 1;
            } else {
                normalization.referenceLibDirectivesRemoved += 1;
            }
            return "";
        },
    );
    const protectedRanges = protectedLexicalRanges(normalized);
    LEGACY_IDENTIFIER_MODULE_PATTERN.lastIndex = 0;
    normalized = normalized.replace(
        LEGACY_IDENTIFIER_MODULE_PATTERN,
        (declaration, modifiers, whitespace, identifier, openingBrace, offset) => {
            const moduleOffset = offset + modifiers.length;
            if (isProtectedOffset(protectedRanges, moduleOffset)) {
                return declaration;
            }
            normalization.legacyIdentifierModulesRewritten += 1;
            return `${modifiers}namespace${whitespace}${identifier}${openingBrace}`;
        },
    );
    if (sourcePath === CORE_APP_FORWARD_SOURCE) {
        // The core declarations contain an empty value-side forward for the App enum.
        // A second class declaration from the optional main-app group cannot merge with it,
        // so TypeScript keeps the empty class and hides members such as App.CHROME. Rewriting
        // only this known empty forward to an interface keeps the source package untouched
        // while allowing the complete main-app class to provide the value and static side.
        CORE_APP_FORWARD_CLASS_PATTERN.lastIndex = 0;
        normalized = normalized.replace(
            CORE_APP_FORWARD_CLASS_PATTERN,
            (_declaration, modifiers, remainder) => {
                normalization.coreAppForwardClassesRewritten += 1;
                return `${modifiers}interface${remainder}`;
            },
        );
        if (normalization.coreAppForwardClassesRewritten > 1) {
            fail(
                `Expected at most one empty App forward class in ${CORE_APP_FORWARD_SOURCE}`,
            );
        }
    }
    return { text: normalized, normalization };
}

function requireFile(sourceDirectory, relativePath, knownDeclarations) {
    if (!knownDeclarations.has(relativePath)) {
        fail(`Required declaration is missing: ${relativePath}`);
    }
    return relativePath;
}

function referencedPaths(text) {
    const references = [];
    PATH_REFERENCE_PATTERN.lastIndex = 0;
    let match;
    while ((match = PATH_REFERENCE_PATTERN.exec(text)) !== null) {
        references.push(match[1]);
    }
    return references;
}

function referencedLibs(text) {
    const references = [];
    LIB_REFERENCE_PATTERN.lastIndex = 0;
    let match;
    while ((match = LIB_REFERENCE_PATTERN.exec(text)) !== null) {
        references.push(String(match[1]).trim().toLowerCase());
    }
    return references;
}

function validateReferences(sourceDirectory, declarationPaths, sourceTextByPath) {
    const knownDeclarations = new Set(declarationPaths);
    for (const sourcePath of declarationPaths) {
        const sourceFile = resolve(sourceDirectory, sourcePath);
        const sourceParent = dirname(sourceFile);
        for (const referencePath of referencedPaths(sourceTextByPath.get(sourcePath))) {
            const targetFile = resolve(sourceParent, referencePath);
            if (!isPathInside(sourceDirectory, targetFile)) {
                fail(`Reference escapes the declarations directory: ${sourcePath} -> ${referencePath}`);
            }
            const targetPath = toPosixPath(relative(sourceDirectory, targetFile));
            if (!knownDeclarations.has(targetPath)) {
                fail(
                    `Reference target is missing or has different letter casing: ` +
                    `${sourcePath} -> ${referencePath}`,
                );
            }
        }
    }
}

function buildGroups(sourceDirectory, declarationPaths, sourceTextByPath) {
    const knownDeclarations = new Set(declarationPaths);
    const coreIndex = requireFile(
        sourceDirectory,
        "autojs6/index.d.ts",
        knownDeclarations,
    );
    const corePaths = new Set([
        coreIndex,
        requireFile(
            sourceDirectory,
            "autojs6/aj6-declarations.d.ts",
            knownDeclarations,
        ),
        requireFile(
            sourceDirectory,
            "autojs6/aj6-jsx-element-extension.d.ts",
            knownDeclarations,
        ),
    ]);

    for (const sourcePath of declarationPaths) {
        if (/^autojs6\/aj6-int-[^/]+\.d\.ts$/i.test(sourcePath)) {
            corePaths.add(sourcePath);
        }
    }

    const optionalBoundaries = new Set([
        "android.d.ts",
        "libraries.d.ts",
        "autojs6/aj6-resources.d.ts",
        "autojs6/aj6-main-app.d.ts",
    ]);
    for (const referencePath of referencedPaths(sourceTextByPath.get(coreIndex))) {
        const referencedFile = resolve(sourceDirectory, "autojs6", referencePath);
        const referencedSourcePath = toPosixPath(relative(sourceDirectory, referencedFile));
        if (!optionalBoundaries.has(referencedSourcePath)) {
            corePaths.add(requireFile(sourceDirectory, referencedSourcePath, knownDeclarations));
        }
    }

    const androidPaths = declarationPaths.filter(
        (sourcePath) => sourcePath === "android.d.ts" || sourcePath.startsWith("android/"),
    );
    if (androidPaths.length < 2) {
        fail("The android group must contain android.d.ts and at least one android declaration");
    }

    const groups = new Map([
        [
            "core",
            {
                defaultEnabled: true,
                dependencies: [],
                sourceFiles: [...corePaths].sort((left, right) => {
                    if (left === coreIndex) {
                        return -1;
                    }
                    if (right === coreIndex) {
                        return 1;
                    }
                    return left.localeCompare(right, "en");
                }),
            },
        ],
        [
            "android",
            {
                defaultEnabled: false,
                dependencies: [],
                sourceFiles: androidPaths,
            },
        ],
        [
            "libraries",
            {
                defaultEnabled: false,
                dependencies: ["android"],
                sourceFiles: [
                    requireFile(sourceDirectory, "libraries.d.ts", knownDeclarations),
                ],
            },
        ],
        [
            "resources",
            {
                defaultEnabled: false,
                dependencies: [],
                sourceFiles: [
                    requireFile(
                        sourceDirectory,
                        "autojs6/aj6-resources.d.ts",
                        knownDeclarations,
                    ),
                ],
            },
        ],
        [
            "main-app",
            {
                defaultEnabled: false,
                dependencies: ["android", "libraries", "resources"],
                sourceFiles: [
                    requireFile(
                        sourceDirectory,
                        "autojs6/aj6-main-app.d.ts",
                        knownDeclarations,
                    ),
                ],
            },
        ],
    ]);

    const groupBySourcePath = new Map();
    for (const [groupId, group] of groups) {
        for (const sourcePath of group.sourceFiles) {
            const previousGroup = groupBySourcePath.get(sourcePath);
            if (previousGroup) {
                fail(
                    `Declaration belongs to more than one group: ${sourcePath} ` +
                    `(${previousGroup}, ${groupId})`,
                );
            }
            groupBySourcePath.set(sourcePath, groupId);
        }
    }

    const unclassified = declarationPaths.filter(
        (sourcePath) =>
            !IGNORED_DECLARATIONS.has(sourcePath) &&
            !groupBySourcePath.has(sourcePath),
    );
    if (unclassified.length > 0) {
        fail(
            `Unclassified declaration(s): ${unclassified.join(", ")}. ` +
            "Reference new core declarations from autojs6/index.d.ts or add an explicit group.",
        );
    }

    for (const [groupId, group] of groups) {
        for (const dependency of group.dependencies) {
            if (!groups.has(dependency)) {
                fail(`Unknown dependency for ${groupId}: ${dependency}`);
            }
            if (dependency === groupId) {
                fail(`Group cannot depend on itself: ${groupId}`);
            }
        }
    }
    return groups;
}

function buildBundle(groupId, group, sourceTextByPath, sourcePackage) {
    const requiredLibs = [];
    for (const sourcePath of group.sourceFiles) {
        for (const libName of referencedLibs(sourceTextByPath.get(sourcePath))) {
            if (!/^[a-z0-9_.-]+$/.test(libName)) {
                fail(`Unsafe TypeScript lib reference in ${sourcePath}: ${libName}`);
            }
            if (!requiredLibs.includes(libName)) {
                requiredLibs.push(libName);
            }
        }
    }
    const sections = [
        "// Auto-generated. Do not edit.",
        `// Generated by ${GENERATED_BY}.`,
        `// Declaration group: ${groupId}.`,
        `// Source package: ${sourcePackage.name}@${sourcePackage.version}.`,
        ...requiredLibs.map((libName) => `/// <reference lib="${libName}" />`),
        "",
    ];
    const normalization = {
        referencePathDirectivesRemoved: 0,
        referenceLibDirectivesRemoved: 0,
        legacyIdentifierModulesRewritten: 0,
        coreAppForwardClassesRewritten: 0,
    };
    for (const sourcePath of group.sourceFiles) {
        const normalizedSource = normalizeDeclarationText(
            sourcePath,
            sourceTextByPath.get(sourcePath),
        );
        for (const key of Object.keys(normalization)) {
            normalization[key] += normalizedSource.normalization[key];
        }
        sections.push(`// ---- source: ${sourcePath} ----`);
        sections.push(normalizedSource.text.replace(/\n+$/g, ""));
        sections.push("");
    }
    return {
        text: `${sections.join("\n").replace(/\n+$/g, "")}\n`,
        normalization,
        requiredLibs,
    };
}

function validateBundleSyntax(ts, fileName, text) {
    const sourceFile = ts.createSourceFile(
        fileName,
        text,
        ts.ScriptTarget.Latest,
        false,
        ts.ScriptKind.TS,
    );
    const diagnostics = sourceFile.parseDiagnostics || [];
    if (diagnostics.length === 0) {
        return;
    }
    const details = diagnostics.slice(0, 10).map((diagnostic) => {
        const position = sourceFile.getLineAndCharacterOfPosition(diagnostic.start || 0);
        const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
        return `${fileName}:${position.line + 1}:${position.character + 1}: ${message}`;
    });
    fail(`Generated declaration syntax is invalid:\n${details.join("\n")}`);
}

function writeGeneratedAssets(
    sourceDirectory,
    outputDirectory,
    groups,
    sourceTextByPath,
    sourcePackage,
    ts,
    typescriptLibDirectory,
) {
    const generatedDirectory = resolve(outputDirectory, GENERATED_OUTPUT_ROOT);
    if (!isPathInside(outputDirectory, generatedDirectory)) {
        fail(`Refusing to write outside the output directory: ${generatedDirectory}`);
    }
    const legacyGeneratedDirectory = resolve(outputDirectory, LEGACY_GENERATED_OUTPUT_ROOT);
    if (!isPathInside(outputDirectory, legacyGeneratedDirectory)) {
        fail(`Refusing to clean outside the output directory: ${legacyGeneratedDirectory}`);
    }
    rmSync(legacyGeneratedDirectory, { recursive: true, force: true });

    const stagingDirectory = `${generatedDirectory}.tmp`;
    rmSync(stagingDirectory, { recursive: true, force: true });
    mkdirSync(stagingDirectory, { recursive: true });

    const manifestGroups = [];
    const aggregateHashes = [];
    for (const groupId of GROUP_ORDER) {
        const group = groups.get(groupId);
        const fileName = `lib.autojs6.${groupId}.d.ts`;
        const generatedBundle = buildBundle(groupId, group, sourceTextByPath, sourcePackage);
        const bundle = generatedBundle.text;
        for (const libName of generatedBundle.requiredLibs) {
            const libFile = join(typescriptLibDirectory, `lib.${libName}.d.ts`);
            if (!existsSync(libFile) || !statSync(libFile).isFile()) {
                fail(`TypeScript lib referenced by ${groupId} is not bundled: ${libName}`);
            }
        }
        validateBundleSyntax(ts, fileName, bundle);
        const bundleHash = sha256(bundle);
        writeFileSync(join(stagingDirectory, fileName), bundle, "utf8");
        manifestGroups.push({
            id: groupId,
            assetPath: `${GENERATED_ASSET_ROOT}/${fileName}`,
            defaultEnabled: group.defaultEnabled,
            dependencies: group.dependencies,
            sourceFiles: group.sourceFiles,
            byteLength: Buffer.byteLength(bundle, "utf8"),
            sha256: bundleHash,
            requiredLibs: generatedBundle.requiredLibs,
            normalization: generatedBundle.normalization,
        });
        aggregateHashes.push(`${groupId}:${bundleHash}`);
    }

    const manifest = {
        schemaVersion: 1,
        generatedBy: GENERATED_BY,
        sourcePackage: {
            name: sourcePackage.name,
            version: sourcePackage.version,
        },
        typescriptVersion: ts.version,
        contentHash: sha256(aggregateHashes.join("\n")),
        normalization: {
            lineEndings: "LF",
            utf8Bom: "removed",
            removedReferencePathDirectives: true,
            hoistedReferenceLibDirectives: true,
            legacyIdentifierModuleSyntax: "namespace",
            stringLiteralModulesPreserved: true,
        },
        groups: manifestGroups,
    };
    writeFileSync(
        join(stagingDirectory, "manifest.json"),
        `${JSON.stringify(manifest, null, 2)}\n`,
        "utf8",
    );

    rmSync(generatedDirectory, { recursive: true, force: true });
    mkdirSync(dirname(generatedDirectory), { recursive: true });
    renameSync(stagingDirectory, generatedDirectory);
    return manifest;
}

function main() {
    const {
        sourceDirectory,
        outputDirectory,
        typescriptRuntime,
    } = parseArguments(process.argv.slice(2));
    if (!statSync(sourceDirectory).isDirectory()) {
        fail(`Declarations directory is not a directory: ${sourceDirectory}`);
    }
    if (sourceDirectory === outputDirectory || isPathInside(sourceDirectory, outputDirectory)) {
        fail("The generated output directory must not be inside the source declarations directory");
    }
    const require = createRequire(import.meta.url);
    const ts = require(typescriptRuntime);
    if (!ts || typeof ts.createSourceFile !== "function" || !ts.version) {
        fail(`Invalid TypeScript runtime: ${typescriptRuntime}`);
    }

    const declarationPaths = listFilesRecursively(sourceDirectory)
        .filter((filePath) => filePath.endsWith(".d.ts"))
        .map((filePath) => toPosixPath(relative(sourceDirectory, filePath)));
    const sourceTextByPath = new Map(
        declarationPaths.map((sourcePath) => [
            sourcePath,
            normalizeSourceText(readFileSync(resolve(sourceDirectory, sourcePath), "utf8")),
        ]),
    );
    validateReferences(sourceDirectory, declarationPaths, sourceTextByPath);

    const packageMetadataPath = resolve(sourceDirectory, "autojs6/package.json");
    const packageMetadata = JSON.parse(readFileSync(packageMetadataPath, "utf8"));
    if (!packageMetadata.name || !packageMetadata.version) {
        fail(`Package metadata must contain name and version: ${packageMetadataPath}`);
    }
    const sourcePackage = {
        name: String(packageMetadata.name),
        version: String(packageMetadata.version),
    };
    const groups = buildGroups(sourceDirectory, declarationPaths, sourceTextByPath);
    const manifest = writeGeneratedAssets(
        sourceDirectory,
        outputDirectory,
        groups,
        sourceTextByPath,
        sourcePackage,
        ts,
        dirname(typescriptRuntime),
    );

    for (const group of manifest.groups) {
        process.stdout.write(
            `${group.id}: ${group.sourceFiles.length} source file(s), ` +
            `${group.byteLength} byte(s), ${group.sha256.slice(0, 12)}\n`,
        );
    }
    process.stdout.write(
        `Generated AutoJs6 LSP declarations at ${resolve(outputDirectory, GENERATED_OUTPUT_ROOT)}\n`,
    );
}

try {
    main();
} catch (error) {
    process.stderr.write(`${error && error.stack ? error.stack : error}\n`);
    process.exitCode = 1;
}
