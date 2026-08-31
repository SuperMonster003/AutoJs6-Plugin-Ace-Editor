[CmdletBinding()]
param(
    [string]$NdkRoot = $env:ANDROID_NDK_ROOT,
    [string]$WorkRoot = "",
    [string]$OutputRoot = "",
    [string]$SourceRoot = "",
    [string]$LuaMakeExecutable = "",
    [string]$InstallProjectRoot = ""
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$repositoryRoot = [IO.Path]::GetFullPath((Join-Path $scriptRoot "..\.."))
$lockPath = Join-Path $scriptRoot "luals-build-lock.json"
$lock = Get-Content -Raw -LiteralPath $lockPath | ConvertFrom-Json

if ([string]::IsNullOrWhiteSpace($WorkRoot)) {
    $WorkRoot = Join-Path $repositoryRoot "build\luals-android"
}
$WorkRoot = [IO.Path]::GetFullPath($WorkRoot)
if ([string]::IsNullOrWhiteSpace($OutputRoot)) {
    $OutputRoot = Join-Path $WorkRoot "dist"
}
$OutputRoot = [IO.Path]::GetFullPath($OutputRoot)
if ([string]::IsNullOrWhiteSpace($SourceRoot)) {
    $SourceRoot = Join-Path $WorkRoot "lua-language-server"
}
$SourceRoot = [IO.Path]::GetFullPath($SourceRoot)

if ([string]::IsNullOrWhiteSpace($NdkRoot)) {
    throw "Pass -NdkRoot or set ANDROID_NDK_ROOT to Android NDK $($lock.toolchain.ndkVersion)."
}
$NdkRoot = [IO.Path]::GetFullPath($NdkRoot)
$sourceProperties = Join-Path $NdkRoot "source.properties"
if (-not (Test-Path -LiteralPath $sourceProperties)) {
    throw "Android NDK source.properties was not found below $NdkRoot."
}
$ndkRevision = Get-Content -LiteralPath $sourceProperties |
    Where-Object { $_ -match '^Pkg\.Revision\s*=\s*(.+)$' } |
    ForEach-Object { $Matches[1].Trim() } |
    Select-Object -First 1
if ($ndkRevision -ne $lock.toolchain.ndkVersion) {
    throw "Expected NDK $($lock.toolchain.ndkVersion), found $ndkRevision."
}

New-Item -ItemType Directory -Force -Path $WorkRoot | Out-Null
New-Item -ItemType Directory -Force -Path $OutputRoot | Out-Null

if (-not (Test-Path -LiteralPath (Join-Path $SourceRoot ".git"))) {
    & git clone --recursive --branch $lock.version $lock.repository $SourceRoot
    if ($LASTEXITCODE -ne 0) { throw "LuaLS clone failed." }
}

$actualCommit = (& git -C $SourceRoot rev-parse HEAD).Trim()
if ($actualCommit -ne $lock.commit) {
    throw "LuaLS source commit mismatch: expected $($lock.commit), found $actualCommit."
}
$actualTagObject = (& git -C $SourceRoot rev-parse "refs/tags/$($lock.version)").Trim()
if ($actualTagObject -ne $lock.tagObject) {
    throw "LuaLS tag object mismatch: expected $($lock.tagObject), found $actualTagObject."
}

& git -C $SourceRoot submodule update --init --recursive
if ($LASTEXITCODE -ne 0) { throw "LuaLS submodule checkout failed." }
foreach ($entry in $lock.submodules.PSObject.Properties) {
    $actual = (& git -C (Join-Path $SourceRoot $entry.Name) rev-parse HEAD).Trim()
    if ($actual -ne [string]$entry.Value) {
        throw "Submodule $($entry.Name) mismatch: expected $($entry.Value), found $actual."
    }
}

function Replace-ExactText {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)][string]$Before,
        [Parameter(Mandatory = $true)][string]$After
    )
    $content = (Get-Content -Raw -LiteralPath $Path).Replace("`r`n", "`n")
    $normalizedBefore = $Before.Replace("`r`n", "`n")
    $normalizedAfter = $After.Replace("`r`n", "`n")
    if ($content.Contains($normalizedAfter)) { return }
    if (-not $content.Contains($normalizedBefore)) {
        throw "Pinned patch context was not found in $Path."
    }
    [IO.File]::WriteAllText(
        $Path,
        $content.Replace($normalizedBefore, $normalizedAfter),
        [Text.UTF8Encoding]::new($false)
    )
}

$makePath = Join-Path $SourceRoot "make.lua"
Replace-ExactText -Path $makePath -Before @'
local platform = require 'bee.platform'
local exe      = platform.os == 'windows' and ".exe" or ""
'@ -After @'
local exe      = lm.os == 'windows' and ".exe" or ""
'@

$beeRoot = Join-Path $SourceRoot "3rd\bee.lua"
$commonPath = Join-Path $beeRoot "compile\common.lua"
Replace-ExactText -Path $commonPath -Before @'
    android = {
        sources = need {
            "linux",
            "posix",
        }
    },
'@ -After @'
    android = {
        sources = {
            "!bee/crash/linux/**/",
            need {
                "linux",
                "posix",
            },
        }
    },
'@

$endpointPath = Join-Path $beeRoot "bee\net\endpoint.h"
Replace-ExactText -Path $endpointPath -Before @'
#if defined(_WIN32)
    using socklen_t = int;
#else
'@ -After @'
#if defined(_WIN32) || (defined(__ANDROID__) && !defined(__LP64__))
    using socklen_t = int;
#else
'@

$bootstrapPath = Join-Path $beeRoot "bootstrap\main.cpp"
Replace-ExactText -Path $bootstrapPath -Before @'
    local sys = require "bee.sys"
    local platform = require "bee.platform"
    local progdir = sys.exe_path():parent_path()
    local mainlua = (progdir / "main.lua"):string()
'@ -After @'
    local sys = require "bee.sys"
    local fs = require "bee.filesystem"
    local platform = require "bee.platform"
    local progdir = sys.exe_path():parent_path()
    local runtimeRoot = os.getenv "AUTOJS6_LUALS_ROOT"
    local mainlua
    if runtimeRoot and runtimeRoot ~= "" then
        mainlua = (fs.path(runtimeRoot) / "bin" / "main.lua"):string()
    else
        mainlua = (progdir / "main.lua"):string()
    end
'@

if ([string]::IsNullOrWhiteSpace($LuaMakeExecutable)) {
    $downloadRoot = Join-Path $WorkRoot "downloads"
    $bootstrapRoot = Join-Path $WorkRoot "host-bootstrap-$($lock.version)"
    $archivePath = Join-Path $downloadRoot "lua-language-server-$($lock.version)-win32-x64.zip"
    New-Item -ItemType Directory -Force -Path $downloadRoot | Out-Null
    if (-not (Test-Path -LiteralPath $archivePath)) {
        Invoke-WebRequest -Uri $lock.hostBootstrap.windowsX64Url -OutFile $archivePath
    }
    $archiveHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $archivePath).Hash.ToLowerInvariant()
    if ($archiveHash -ne $lock.hostBootstrap.windowsX64Sha256) {
        throw "Pinned LuaLS host bootstrap archive hash mismatch: $archiveHash."
    }
    New-Item -ItemType Directory -Force -Path $bootstrapRoot | Out-Null
    Expand-Archive -LiteralPath $archivePath -DestinationPath $bootstrapRoot -Force
    $releaseBin = Join-Path $bootstrapRoot "bin"
    $luaMakeRoot = Join-Path $SourceRoot "3rd\luamake"
    Copy-Item -LiteralPath (Join-Path $releaseBin "lua-language-server.exe") `
        -Destination (Join-Path $luaMakeRoot "luamake.exe") -Force
    Get-ChildItem -LiteralPath $releaseBin -Filter "*.dll" | ForEach-Object {
        Copy-Item -LiteralPath $_.FullName -Destination $luaMakeRoot -Force
    }
    $LuaMakeExecutable = Join-Path $luaMakeRoot "luamake.exe"
}
$LuaMakeExecutable = [IO.Path]::GetFullPath($LuaMakeExecutable)
if (-not (Test-Path -LiteralPath $LuaMakeExecutable)) {
    throw "luamake host executable was not found: $LuaMakeExecutable"
}

$sdkRoot = Split-Path -Parent (Split-Path -Parent $NdkRoot)
$ninja = Get-ChildItem -LiteralPath (Join-Path $sdkRoot "cmake") -Filter "ninja.exe" -Recurse |
    Sort-Object FullName -Descending |
    Select-Object -First 1
if ($null -eq $ninja) { throw "ninja.exe was not found below the Android SDK." }
$env:Path = (Split-Path -Parent $ninja.FullName) + [IO.Path]::PathSeparator + $env:Path

$jniOutput = Join-Path $OutputRoot "jniLibs"
New-Item -ItemType Directory -Force -Path $jniOutput | Out-Null
foreach ($entry in $lock.abis.PSObject.Properties) {
    $abi = $entry.Name
    $configuration = $entry.Value
    $buildDirectory = "build/autojs6-$abi-static"
    $arguments = @(
        "-os", "android",
        "-arch", [string]$configuration.luamakeArch
    )
    if ($configuration.PSObject.Properties.Name -contains "luamakeVendor") {
        $arguments += @("-vendor", [string]$configuration.luamakeVendor)
    }
    $arguments += @(
        "-sys", [string]$configuration.luamakeSys,
        "-ndk", ($NdkRoot.Replace('\', '/') + "/"),
        "-builddir", $buildDirectory,
        "-bindir", '$builddir/bin',
        "-objdir", '$builddir/obj',
        "-notest",
        "-crt", "static"
    )
    Push-Location $SourceRoot
    try {
        & $LuaMakeExecutable @arguments
        if ($LASTEXITCODE -ne 0) { throw "LuaLS $abi build failed." }
    } finally {
        Pop-Location
    }
    $binary = Join-Path $SourceRoot "$buildDirectory\bin\lua-language-server"
    $actualBytes = (Get-Item -LiteralPath $binary).Length
    $actualHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $binary).Hash.ToLowerInvariant()
    if ($actualBytes -ne [long]$configuration.bytes -or $actualHash -ne $configuration.sha256) {
        throw "LuaLS $abi output mismatch: $actualBytes/$actualHash."
    }
    $abiOutput = Join-Path $jniOutput $abi
    New-Item -ItemType Directory -Force -Path $abiOutput | Out-Null
    Copy-Item -LiteralPath $binary -Destination (Join-Path $abiOutput "libautojs6_luals.so") -Force
}

$compatibility = $lock.installCompatibility
$clang = Join-Path $NdkRoot "toolchains\llvm\prebuilt\windows-x86_64\bin\clang.exe"
if (-not (Test-Path -LiteralPath $clang)) {
    throw "Android NDK clang was not found: $clang"
}
$compatibilitySource = Join-Path $repositoryRoot $compatibility.source
if (-not (Test-Path -LiteralPath $compatibilitySource)) {
    throw "LuaLS install compatibility source was not found: $compatibilitySource"
}
$compatibilityOutputDirectory = Join-Path $jniOutput $compatibility.abi
$compatibilityOutput = Join-Path $compatibilityOutputDirectory $compatibility.library
New-Item -ItemType Directory -Force -Path $compatibilityOutputDirectory | Out-Null
& $clang `
    "--target=$($compatibility.target)" `
    -shared `
    -fPIC `
    -Oz `
    -fno-ident `
    -nostdlib `
    "-Wl,--build-id=none" `
    "-Wl,--no-undefined" `
    "-Wl,--strip-all" `
    "-Wl,-soname,$($compatibility.library)" `
    "-Wl,-z,max-page-size=16384" `
    -o $compatibilityOutput `
    $compatibilitySource
if ($LASTEXITCODE -ne 0) { throw "LuaLS x86 install compatibility build failed." }
$compatibilityBytes = (Get-Item -LiteralPath $compatibilityOutput).Length
$compatibilityHash = (
    Get-FileHash -Algorithm SHA256 -LiteralPath $compatibilityOutput
).Hash.ToLowerInvariant()
if (
    $compatibilityBytes -ne [long]$compatibility.bytes -or
    $compatibilityHash -ne $compatibility.sha256
) {
    throw "LuaLS x86 install compatibility output mismatch: $compatibilityBytes/$compatibilityHash."
}

$assetOutput = Join-Path $OutputRoot "assets\luals"
$runtimeOutput = Join-Path $assetOutput "runtime"
New-Item -ItemType Directory -Force -Path (Join-Path $runtimeOutput "bin") | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $runtimeOutput "locale") | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $runtimeOutput "meta") | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $runtimeOutput "script") | Out-Null
Copy-Item -LiteralPath (Join-Path $SourceRoot "main.lua") -Destination $runtimeOutput -Force
Copy-Item -LiteralPath (Join-Path $SourceRoot "debugger.lua") -Destination $runtimeOutput -Force
Copy-Item -LiteralPath (Join-Path $SourceRoot "make\bootstrap.lua") `
    -Destination (Join-Path $runtimeOutput "bin\main.lua") -Force
Copy-Item -Path (Join-Path $SourceRoot "script\*") `
    -Destination (Join-Path $runtimeOutput "script") -Recurse -Force
New-Item -ItemType Directory -Force -Path (Join-Path $runtimeOutput "locale\en-us") | Out-Null
Copy-Item -Path (Join-Path $SourceRoot "locale\en-us\*") `
    -Destination (Join-Path $runtimeOutput "locale\en-us") -Recurse -Force
New-Item -ItemType Directory -Force -Path (Join-Path $runtimeOutput "meta\template") | Out-Null
Copy-Item -Path (Join-Path $SourceRoot "meta\template\*") `
    -Destination (Join-Path $runtimeOutput "meta\template") -Recurse -Force
Copy-Item -LiteralPath (Join-Path $repositoryRoot "app\src\main\assets\luals\THIRD_PARTY_LICENSES.txt") `
    -Destination $assetOutput -Force

& node (Join-Path $scriptRoot "generate-luals-manifest.mjs") `
    --lock $lockPath `
    --asset-root $assetOutput `
    --jni-root $jniOutput `
    --out (Join-Path $assetOutput "manifest.json")
if ($LASTEXITCODE -ne 0) { throw "LuaLS manifest generation failed." }

if (-not [string]::IsNullOrWhiteSpace($InstallProjectRoot)) {
    $InstallProjectRoot = [IO.Path]::GetFullPath($InstallProjectRoot)
    $projectAssetRoot = Join-Path $InstallProjectRoot "app\src\main\assets\luals"
    $projectJniRoot = Join-Path $InstallProjectRoot "app\src\main\jniLibs"
    New-Item -ItemType Directory -Force -Path $projectAssetRoot | Out-Null
    New-Item -ItemType Directory -Force -Path $projectJniRoot | Out-Null
    Copy-Item -Path (Join-Path $assetOutput "*") -Destination $projectAssetRoot -Recurse -Force
    Copy-Item -Path (Join-Path $jniOutput "*") -Destination $projectJniRoot -Recurse -Force
}

Write-Output "LuaLS $($lock.version) Android distribution verified at $OutputRoot"
