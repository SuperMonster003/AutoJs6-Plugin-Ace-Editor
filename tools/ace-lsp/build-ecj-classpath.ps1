[CmdletBinding()]
param(
    [string]$AndroidJar,
    [string]$OutputDir,
    [switch]$Check
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "../..")).Path
if ([string]::IsNullOrWhiteSpace($OutputDir)) {
    $OutputDir = Join-Path $repoRoot "app/src/main/assets/java/ecj"
}
$outputDirectory = [System.IO.Path]::GetFullPath($OutputDir)
$expectedOutputRoot = [System.IO.Path]::GetFullPath(
    (Join-Path $repoRoot "app/src/main/assets/java/ecj")
)
$expectedOutputPrefix = $expectedOutputRoot.TrimEnd(
    [char[]]@(
        [System.IO.Path]::DirectorySeparatorChar,
        [System.IO.Path]::AltDirectorySeparatorChar
    )
) + [System.IO.Path]::DirectorySeparatorChar
$isExpectedOutputRoot = $outputDirectory.Equals(
    $expectedOutputRoot,
    [System.StringComparison]::OrdinalIgnoreCase
)
$isExpectedOutputChild = $outputDirectory.StartsWith(
    $expectedOutputPrefix,
    [System.StringComparison]::OrdinalIgnoreCase
)
if (-not ($isExpectedOutputRoot -or $isExpectedOutputChild)) {
    throw "OutputDir must stay within $expectedOutputRoot"
}

if ([string]::IsNullOrWhiteSpace($AndroidJar)) {
    if ([string]::IsNullOrWhiteSpace($env:ANDROID_HOME)) {
        throw "AndroidJar or ANDROID_HOME is required"
    }
    $AndroidJar = Join-Path $env:ANDROID_HOME "platforms/android-36/android.jar"
}
$sourceJar = [System.IO.Path]::GetFullPath($AndroidJar)
if (-not (Test-Path -LiteralPath $sourceJar -PathType Leaf)) {
    throw "Android SDK stub jar does not exist: $sourceJar"
}

$classpathFile = Join-Path $outputDirectory "android-36-stubs.jar"
$manifestFile = Join-Path $outputDirectory "manifest.json"
$fixedTimestamp = [System.DateTimeOffset]::new(1980, 1, 1, 0, 0, 0, [System.TimeSpan]::Zero)
$expectedSourceSha256 = "d9eb9da824d9e247a352f570f01e1169e725b2954bca9e283a71786c59b59f9a"
$excludedClassPrefixes = @(
    "android/adservices/",
    "android/health/",
    "android/icu/"
)

function Get-Sha256([string]$Path) {
    return (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash.ToLowerInvariant()
}

$sourceSha256 = Get-Sha256 $sourceJar
if ($sourceSha256 -ne $expectedSourceSha256) {
    throw "Android SDK 36 source hash mismatch: expected $expectedSourceSha256, got $sourceSha256"
}

function Get-ClassEntries([System.IO.Compression.ZipArchive]$Archive) {
    return @(
        $Archive.Entries |
            Where-Object {
                $name = $_.FullName
                $included = $name.EndsWith(".class", [System.StringComparison]::Ordinal)
                foreach ($prefix in $excludedClassPrefixes) {
                    if ($name.StartsWith($prefix, [System.StringComparison]::Ordinal)) {
                        $included = $false
                        break
                    }
                }
                $included
            } |
            Sort-Object FullName
    )
}

function Read-OutputFacts([string]$Path) {
    $archive = [System.IO.Compression.ZipFile]::OpenRead($Path)
    try {
        $entries = Get-ClassEntries $archive
        $allFiles = @($archive.Entries | Where-Object { -not $_.FullName.EndsWith("/") })
        if ($entries.Count -ne $allFiles.Count) {
            throw "Classpath contains non-class entries"
        }
        $names = @($entries | ForEach-Object FullName)
        if (@($names | Sort-Object -Unique).Count -ne $names.Count) {
            throw "Classpath contains duplicate entries"
        }
        foreach ($requiredName in @(
            "java/lang/Object.class",
            "java/util/ArrayList.class",
            "android/app/Activity.class",
            "android/view/View.class"
        )) {
            if ($requiredName -notin $names) {
                throw "Classpath is missing required entry: $requiredName"
            }
        }
        return [ordered]@{
            classFileCount = $entries.Count
            uncompressedClassBytes = [long](($entries | Measure-Object Length -Sum).Sum)
        }
    } finally {
        $archive.Dispose()
    }
}

if ($Check) {
    if (-not (Test-Path -LiteralPath $classpathFile -PathType Leaf)) {
        throw "Committed ECJ classpath does not exist: $classpathFile"
    }
    if (-not (Test-Path -LiteralPath $manifestFile -PathType Leaf)) {
        throw "Committed ECJ manifest does not exist: $manifestFile"
    }
    $manifest = Get-Content -LiteralPath $manifestFile -Raw | ConvertFrom-Json
    $facts = Read-OutputFacts $classpathFile
    $actualHash = Get-Sha256 $classpathFile
    $actualBytes = (Get-Item -LiteralPath $classpathFile).Length
    if ($manifest.schemaVersion -ne 1) { throw "Unexpected manifest schema" }
    if ($manifest.ecjVersion -ne "3.26.0") { throw "Unexpected ECJ version" }
    if ($manifest.ecjArtifactSha256 -ne "ac0ba5876eaf7ebb47749a0d1be179c51f194b9dd0b875d1c09e1b530f5a2db5") {
        throw "Unexpected ECJ artifact hash"
    }
    if ($manifest.ecjArtifactBytes -ne 3133846) { throw "Unexpected ECJ artifact size" }
    if ($manifest.bundleBudgetBytes -ne 8388608) { throw "Unexpected Java bundle budget" }
    if ($manifest.compileSdk -ne 36) { throw "Unexpected compile SDK" }
    if ($manifest.sourceSha256 -ne $expectedSourceSha256) { throw "Unexpected source artifact hash" }
    if ($manifest.sourceSha256 -ne $sourceSha256) { throw "Source artifact SHA-256 mismatch" }
    if ((@($manifest.excludedClassPrefixes) -join ",") -ne ($excludedClassPrefixes -join ",")) {
        throw "Excluded class prefix policy mismatch"
    }
    if ($manifest.classpathSha256 -ne $actualHash) { throw "Classpath SHA-256 mismatch" }
    if ($manifest.classpathBytes -ne $actualBytes) { throw "Classpath size mismatch" }
    if ($manifest.classFileCount -ne $facts.classFileCount) { throw "Class count mismatch" }
    if ($manifest.uncompressedClassBytes -ne $facts.uncompressedClassBytes) {
        throw "Uncompressed class size mismatch"
    }
    Write-Output "ECJ classpath verified: $($facts.classFileCount) classes, $actualBytes bytes, $actualHash"
    exit 0
}

New-Item -ItemType Directory -Force -Path $outputDirectory | Out-Null
$temporaryFile = Join-Path $outputDirectory (
    ".android-36-stubs.$([System.Guid]::NewGuid().ToString('N')).tmp"
)
try {
    $sourceArchive = [System.IO.Compression.ZipFile]::OpenRead($sourceJar)
    try {
        $classEntries = Get-ClassEntries $sourceArchive
        if ($classEntries.Count -eq 0) {
            throw "Android SDK jar contains no class entries"
        }
        $outputStream = [System.IO.File]::Open(
            $temporaryFile,
            [System.IO.FileMode]::CreateNew,
            [System.IO.FileAccess]::ReadWrite,
            [System.IO.FileShare]::None
        )
        try {
            $outputArchive = [System.IO.Compression.ZipArchive]::new(
                $outputStream,
                [System.IO.Compression.ZipArchiveMode]::Create,
                $true
            )
            try {
                foreach ($sourceEntry in $classEntries) {
                    $outputEntry = $outputArchive.CreateEntry(
                        $sourceEntry.FullName,
                        [System.IO.Compression.CompressionLevel]::Optimal
                    )
                    $outputEntry.LastWriteTime = $fixedTimestamp
                    $outputEntry.ExternalAttributes = 0
                    $input = $sourceEntry.Open()
                    $output = $outputEntry.Open()
                    try {
                        $input.CopyTo($output)
                    } finally {
                        $output.Dispose()
                        $input.Dispose()
                    }
                }
            } finally {
                $outputArchive.Dispose()
            }
        } finally {
            $outputStream.Dispose()
        }
    } finally {
        $sourceArchive.Dispose()
    }

    Move-Item -LiteralPath $temporaryFile -Destination $classpathFile -Force
} finally {
    if (Test-Path -LiteralPath $temporaryFile) {
        Remove-Item -LiteralPath $temporaryFile -Force
    }
}

$facts = Read-OutputFacts $classpathFile
$manifest = [ordered]@{
    schemaVersion = 1
    ecjVersion = "3.26.0"
    ecjArtifactSha256 = "ac0ba5876eaf7ebb47749a0d1be179c51f194b9dd0b875d1c09e1b530f5a2db5"
    ecjArtifactBytes = 3133846
    bundleBudgetBytes = 8388608
    compileSdk = 36
    excludedClassPrefixes = $excludedClassPrefixes
    sourceArtifact = "Android SDK platforms;android-36/android.jar"
    sourceSha256 = $sourceSha256
    classpathFile = "android-36-stubs.jar"
    classpathSha256 = Get-Sha256 $classpathFile
    classpathBytes = (Get-Item -LiteralPath $classpathFile).Length
    classFileCount = $facts.classFileCount
    uncompressedClassBytes = $facts.uncompressedClassBytes
    generator = "tools/ace-lsp/build-ecj-classpath.ps1"
}
$manifestJson = ($manifest | ConvertTo-Json -Depth 4) + [Environment]::NewLine
[System.IO.File]::WriteAllText($manifestFile, $manifestJson, [System.Text.UTF8Encoding]::new($false))

Write-Output (
    "Generated ECJ classpath: {0} classes, {1} bytes, {2}" -f
        $manifest.classFileCount,
        $manifest.classpathBytes,
        $manifest.classpathSha256
)
