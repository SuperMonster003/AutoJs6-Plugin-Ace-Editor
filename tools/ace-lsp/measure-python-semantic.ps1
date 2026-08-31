[CmdletBinding()]
param(
    [string[]]$Serial = @(),
    [ValidateRange(8000, 30000)]
    [int]$HoldMs = 10000,
    [switch]$SkipBuild,
    [string]$OutputPath = ''
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$targetPackage = 'io.github.supermonster003.autojs6.plugin.ace.editor'
$testPackage = "$targetPackage.test"
$runner = "$testPackage/androidx.test.runner.AndroidJUnitRunner"
$testClass = "$targetPackage.core.AcePythonSemanticSmokeTest"
$memoryReadyPrefix = 'AUTOJS6_ACE_M4_MEMORY_READY='
$resultPrefix = 'AUTOJS6_ACE_M4_RESIDENT='
$semanticRecordPrefix = 'AUTOJS6_ACE_M4_PYTHON='
$runtimeBudgetBytes = 300L * 1024L * 1024L
$adbPath = (Get-Command adb -ErrorAction Stop).Source

function Assert-LastExitCode([string]$Operation) {
    if ($LASTEXITCODE -ne 0) {
        throw "$Operation failed with exit code $LASTEXITCODE"
    }
}

function Invoke-Adb(
    [string]$DeviceSerial,
    [string[]]$AdbArguments,
    [string]$Operation
) {
    $output = @(& $adbPath -s $DeviceSerial @AdbArguments 2>&1)
    Assert-LastExitCode $Operation
    return $output
}

function Get-ProcessPssBytes([string]$DeviceSerial, [int]$ProcessId) {
    $memoryOutput = Invoke-Adb $DeviceSerial @(
        'shell', 'dumpsys', 'meminfo', '--local', $ProcessId.ToString()
    ) "dumpsys meminfo $ProcessId on $DeviceSerial"
    $memoryText = $memoryOutput -join "`n"
    $summaryMatch = [regex]::Match(
        $memoryText,
        '(?m)^\s*TOTAL PSS:\s*([\d,]+)'
    )
    if (-not $summaryMatch.Success) {
        $summaryMatch = [regex]::Match(
            $memoryText,
            '(?m)^\s*TOTAL\s+([\d,]+)'
        )
    }
    if (-not $summaryMatch.Success) {
        throw "Unable to parse TOTAL PSS for PID $ProcessId on $DeviceSerial"
    }
    $pssKiB = [long]($summaryMatch.Groups[1].Value -replace ',', '')
    return $pssKiB * 1024L
}

function ConvertFrom-PrefixedJson([string[]]$Lines, [string]$Prefix) {
    $matchingLines = @($Lines | Where-Object { $_ -like "*$Prefix*" })
    if ($matchingLines.Count -eq 0) {
        return $null
    }
    $line = [string]$matchingLines[-1]
    $jsonStart = $line.IndexOf($Prefix, [System.StringComparison]::Ordinal)
    if ($jsonStart -lt 0) {
        return $null
    }
    return $line.Substring($jsonStart + $Prefix.Length) | ConvertFrom-Json
}

function Get-RendererProcessIds(
    [string]$DeviceSerial,
    [string[]]$LogLines,
    [int]$HostProcessId
) {
    $escapedPackage = [regex]::Escape($targetPackage)
    $startPattern = [regex]::new(
        "Start proc\s+(\d+):.*?(?:sandboxed_process|privileged_process).*?$escapedPackage/",
        [System.Text.RegularExpressions.RegexOptions]::IgnoreCase
    )
    $processIds = [System.Collections.Generic.HashSet[int]]::new()
    foreach ($line in $LogLines) {
        foreach ($match in $startPattern.Matches([string]$line)) {
            $candidate = [int]$match.Groups[1].Value
            if ($candidate -ne $HostProcessId) {
                [void]$processIds.Add($candidate)
            }
        }
    }

    if ($processIds.Count -eq 0) {
        $activityOutput = Invoke-Adb $DeviceSerial @(
            'shell', 'dumpsys', 'activity', 'processes'
        ) "activity process discovery on $DeviceSerial"
        $activityText = $activityOutput -join "`n"
        $processPattern = [regex]::new(
            "ProcessRecord\{[^\r\n]*\s(\d+):[^\r\n]*" +
                "(?:sandboxed_process|privileged_process)[\s\S]{0,1600}?" +
                "packageList=\{$escapedPackage\}",
            [System.Text.RegularExpressions.RegexOptions]::IgnoreCase
        )
        foreach ($match in $processPattern.Matches($activityText)) {
            $candidate = [int]$match.Groups[1].Value
            if ($candidate -ne $HostProcessId) {
                [void]$processIds.Add($candidate)
            }
        }
    }
    return @($processIds | Sort-Object)
}

function Invoke-ResidentSample([string]$DeviceSerial, [bool]$BaselineOnly) {
    Invoke-Adb $DeviceSerial @('logcat', '-c') "logcat clear on $DeviceSerial" | Out-Null
    Invoke-Adb $DeviceSerial @('shell', 'am', 'force-stop', $targetPackage) `
        "target process stop on $DeviceSerial" | Out-Null
    Invoke-Adb $DeviceSerial @('shell', 'am', 'force-stop', $testPackage) `
        "test process stop on $DeviceSerial" | Out-Null

    $mode = if ($BaselineOnly) { 'p2-baseline' } else { 'semantic' }
    $token = [guid]::NewGuid().ToString('N')
    $stdoutPath = Join-Path ([System.IO.Path]::GetTempPath()) "autojs6-m4-$token.stdout.log"
    $stderrPath = Join-Path ([System.IO.Path]::GetTempPath()) "autojs6-m4-$token.stderr.log"
    $instrumentArguments = @(
        '-s', $DeviceSerial,
        'shell', 'am', 'instrument', '-w', '-r',
        '-e', 'class', $testClass
    )
    if ($BaselineOnly) {
        $instrumentArguments += @('-e', 'm4MemoryBaselineOnly', 'true')
    }
    $instrumentArguments += @('-e', 'm4HoldMs', $HoldMs.ToString(), $runner)

    $instrumentProcess = $null
    try {
        $instrumentProcess = Start-Process `
            -FilePath $adbPath `
            -ArgumentList $instrumentArguments `
            -WindowStyle Hidden `
            -PassThru `
            -RedirectStandardOutput $stdoutPath `
            -RedirectStandardError $stderrPath

        $deadline = [DateTime]::UtcNow.AddSeconds(45)
        $readyRecord = $null
        $logLines = @()
        while ([DateTime]::UtcNow -lt $deadline) {
            $logLines = Invoke-Adb $DeviceSerial @('logcat', '-d', '-v', 'raw') `
                "memory-ready log polling on $DeviceSerial"
            $readyRecord = ConvertFrom-PrefixedJson $logLines $memoryReadyPrefix
            if ($null -ne $readyRecord) {
                break
            }
            if ($instrumentProcess.HasExited) {
                break
            }
            Start-Sleep -Milliseconds 250
        }
        if ($null -eq $readyRecord) {
            $partialOutput = if (Test-Path -LiteralPath $stdoutPath) {
                Get-Content -Raw -LiteralPath $stdoutPath
            } else {
                ''
            }
            throw "No $memoryReadyPrefix marker for $mode on ${DeviceSerial}:`n$partialOutput"
        }
        if ([string]$readyRecord.path -ne $mode) {
            throw "Unexpected resident marker path on ${DeviceSerial}: $($readyRecord.path)"
        }

        $hostProcessId = [int]$readyRecord.hostPid
        $rendererProcessIds = @(
            Get-RendererProcessIds $DeviceSerial $logLines $hostProcessId
        )
        if ($rendererProcessIds.Count -eq 0) {
            throw "No WebView renderer process was attributable to $targetPackage on $DeviceSerial"
        }

        $rendererSamplingErrors = [System.Collections.Generic.List[string]]::new()
        $rendererProcesses = @(
            foreach ($rendererProcessId in $rendererProcessIds) {
                try {
                    [ordered]@{
                        pid = $rendererProcessId
                        pssBytes = Get-ProcessPssBytes $DeviceSerial $rendererProcessId
                    }
                } catch {
                    # A stale renderer from the just-cleared log may have exited. The active
                    # renderer must still leave at least one successfully sampled process.
                    $rendererSamplingErrors.Add("PID ${rendererProcessId}: $($_.Exception.Message)")
                }
            }
        )
        if ($rendererProcesses.Count -eq 0) {
            throw "Every attributed WebView renderer exited before the $mode sample on " +
                "${DeviceSerial}: $($rendererSamplingErrors -join '; ')"
        }
        $rendererPssBytes = 0L
        foreach ($rendererProcess in $rendererProcesses) {
            $rendererPssBytes += [long]$rendererProcess.pssBytes
        }
        # Some emulator system images reclaim an idle P2 renderer quickly even while the
        # instrumentation host is held. Sample the renderer first; the host remains alive
        # for the duration of the instrumentation run.
        $hostPssBytes = Get-ProcessPssBytes $DeviceSerial $hostProcessId

        $remainingWaitMs = $HoldMs + 30000
        if (-not $instrumentProcess.WaitForExit($remainingWaitMs)) {
            throw "Instrumentation did not finish after the $mode resident sample on $DeviceSerial"
        }
        $instrumentOutput = if (Test-Path -LiteralPath $stdoutPath) {
            Get-Content -Raw -LiteralPath $stdoutPath
        } else {
            ''
        }
        $instrumentError = if (Test-Path -LiteralPath $stderrPath) {
            Get-Content -Raw -LiteralPath $stderrPath
        } else {
            ''
        }
        if ($instrumentProcess.ExitCode -ne 0 -or $instrumentOutput -notmatch 'OK \(1 test\)') {
            throw "Instrumentation failed for $mode on ${DeviceSerial}:`n" +
                "$instrumentOutput`n$instrumentError"
        }

        $finalLogLines = Invoke-Adb $DeviceSerial @('logcat', '-d', '-v', 'raw') `
            "final semantic log collection on $DeviceSerial"
        $semanticRecord = ConvertFrom-PrefixedJson $finalLogLines $semanticRecordPrefix
        return [ordered]@{
            path = $mode
            hostPid = $hostProcessId
            rendererPids = @($rendererProcesses | ForEach-Object { $_.pid })
            hostPssBytes = $hostPssBytes
            rendererPssBytes = $rendererPssBytes
            combinedPssBytes = $hostPssBytes + $rendererPssBytes
            instrumentation = $semanticRecord
        }
    } finally {
        if ($null -ne $instrumentProcess -and -not $instrumentProcess.HasExited) {
            Invoke-Adb $DeviceSerial @('shell', 'am', 'force-stop', $targetPackage) `
                "resident sampler cleanup on $DeviceSerial" | Out-Null
            Invoke-Adb $DeviceSerial @('shell', 'am', 'force-stop', $testPackage) `
                "resident sampler test cleanup on $DeviceSerial" | Out-Null
            [void]$instrumentProcess.WaitForExit(5000)
        }
        if ($null -ne $instrumentProcess) {
            $instrumentProcess.Dispose()
        }
        foreach ($temporaryPath in @($stdoutPath, $stderrPath)) {
            if (Test-Path -LiteralPath $temporaryPath) {
                for ($removeAttempt = 1; $removeAttempt -le 3; $removeAttempt++) {
                    try {
                        Remove-Item -LiteralPath $temporaryPath -Force
                        break
                    } catch {
                        if ($removeAttempt -eq 3) {
                            throw
                        }
                        Start-Sleep -Milliseconds 100
                    }
                }
            }
        }
    }
}

Push-Location $projectRoot
try {
    if (-not $SkipBuild) {
        & .\gradlew.bat :app:assembleDebug :app:assembleDebugAndroidTest --console=plain
        Assert-LastExitCode 'Gradle M4 resident build'
    }

    $mainMetadata = Get-Content -Raw .\app\build\outputs\apk\debug\output-metadata.json |
        ConvertFrom-Json
    $testMetadata = Get-Content -Raw .\app\build\outputs\apk\androidTest\debug\output-metadata.json |
        ConvertFrom-Json
    $mainApk = Join-Path .\app\build\outputs\apk\debug $mainMetadata.elements[0].outputFile
    $testApk = Join-Path .\app\build\outputs\apk\androidTest\debug $testMetadata.elements[0].outputFile

    if ($Serial.Count -eq 0) {
        $Serial = @(
            & $adbPath devices -l |
                ForEach-Object {
                    if ($_ -match '^(\S+)\s+device(?:\s|$)') { $Matches[1] }
                }
        )
        Assert-LastExitCode 'adb device discovery'
    }
    if ($Serial.Count -eq 0) {
        throw 'No online Android device was found.'
    }

    $results = @(
        foreach ($deviceSerial in $Serial) {
            Invoke-Adb $deviceSerial @('install', '-r', $mainApk) `
                "main APK installation on $deviceSerial" | Out-Null
            Invoke-Adb $deviceSerial @('install', '-r', $testApk) `
                "test APK installation on $deviceSerial" | Out-Null

            $baseline = Invoke-ResidentSample $deviceSerial $true
            $semantic = Invoke-ResidentSample $deviceSerial $false
            $incrementBytes = [long]$semantic.combinedPssBytes - [long]$baseline.combinedPssBytes
            $semanticRecord = $semantic.instrumentation
            $record = [ordered]@{
                schema = 1
                measurement = 'm4-python-resident-total'
                serial = $deviceSerial
                device = "$($semanticRecord.manufacturer) $($semanticRecord.model)"
                android = "$($semanticRecord.release) / API $($semanticRecord.sdk)"
                webViewPackage = $semanticRecord.webViewPackage
                baseline = $baseline
                semantic = $semantic
                pythonSemanticIncrementPssBytes = $incrementBytes
                runtimeBudgetBytes = $runtimeBudgetBytes
                runtimeGatePassed = $incrementBytes -lt $runtimeBudgetBytes
            }
            if (-not $record.runtimeGatePassed) {
                throw "Python semantic PSS increment exceeded 300 MiB on $deviceSerial"
            }
            [Console]::Out.WriteLine(
                $resultPrefix + ($record | ConvertTo-Json -Depth 12 -Compress)
            )
            $record
        }
    )

    if ($OutputPath) {
        $resolvedOutputPath = if ([System.IO.Path]::IsPathRooted($OutputPath)) {
            $OutputPath
        } else {
            Join-Path $projectRoot $OutputPath
        }
        $outputDirectory = Split-Path -Parent $resolvedOutputPath
        if ($outputDirectory -and -not (Test-Path -LiteralPath $outputDirectory)) {
            New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null
        }
        $results | ConvertTo-Json -Depth 12 | Set-Content -LiteralPath $resolvedOutputPath -Encoding utf8
    }
} finally {
    Pop-Location
}
