[CmdletBinding()]
param(
    [string[]]$Serial = @(),
    [ValidateRange(1, 20)]
    [int]$Iterations = 3,
    [switch]$SkipBuild
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$targetPackage = 'io.github.supermonster003.autojs6.plugin.ace.editor'
$testPackage = "$targetPackage.test"
$runner = "$testPackage/androidx.test.runner.AndroidJUnitRunner"
$testClass = "$targetPackage.core.AcePerformanceBaselineTest"
$logPrefix = 'AUTOJS6_ACE_PERFORMANCE_BASELINE='

function Assert-LastExitCode([string]$operation) {
    if ($LASTEXITCODE -ne 0) {
        throw "$operation failed with exit code $LASTEXITCODE"
    }
}

function Get-Median([double[]]$values) {
    $sorted = @($values | Sort-Object)
    if ($sorted.Count % 2 -eq 1) {
        return $sorted[[math]::Floor($sorted.Count / 2)]
    }
    $right = $sorted.Count / 2
    return ($sorted[$right - 1] + $sorted[$right]) / 2
}

Push-Location $projectRoot
try {
    if (-not $SkipBuild) {
        & .\gradlew.bat :app:assembleDebug :app:assembleDebugAndroidTest --console=plain
        Assert-LastExitCode 'Gradle benchmark build'
    }

    $mainMetadata = Get-Content -Raw .\app\build\outputs\apk\debug\output-metadata.json |
        ConvertFrom-Json
    $testMetadata = Get-Content -Raw .\app\build\outputs\apk\androidTest\debug\output-metadata.json |
        ConvertFrom-Json
    $mainApk = Join-Path .\app\build\outputs\apk\debug $mainMetadata.elements[0].outputFile
    $testApk = Join-Path .\app\build\outputs\apk\androidTest\debug $testMetadata.elements[0].outputFile

    if ($Serial.Count -eq 0) {
        $Serial = @(
            & adb devices -l |
                ForEach-Object {
                    if ($_ -match '^(\S+)\s+device(?:\s|$)') { $Matches[1] }
                }
        )
        Assert-LastExitCode 'adb device discovery'
    }
    if ($Serial.Count -eq 0) {
        throw 'No online Android device was found.'
    }

    $records = [System.Collections.Generic.List[object]]::new()
    $m2IndexRecords = [System.Collections.Generic.List[object]]::new()
    foreach ($deviceSerial in $Serial) {
        & adb -s $deviceSerial install -r $mainApk | Out-Null
        Assert-LastExitCode "Main APK installation on $deviceSerial"
        & adb -s $deviceSerial install -r $testApk | Out-Null
        Assert-LastExitCode "Test APK installation on $deviceSerial"

        for ($iteration = 1; $iteration -le $Iterations; $iteration++) {
            & adb -s $deviceSerial shell am force-stop $targetPackage
            Assert-LastExitCode "Target process stop on $deviceSerial"
            $instrumentationOutput = @(
                & adb -s $deviceSerial shell am instrument -w -r `
                    -e class $testClass $runner 2>&1
            )
            Assert-LastExitCode "Performance instrumentation on $deviceSerial"
            if (($instrumentationOutput -join "`n") -notmatch 'OK \(1 test\)') {
                throw "Performance test failed on ${deviceSerial}:`n$($instrumentationOutput -join "`n")"
            }

            $recordLines = @(
                & adb -s $deviceSerial logcat -d -v raw -s 'AutoJs6AcePerf:I' '*:S'
            ) | Where-Object { $_ -like "*$logPrefix*" }
            Assert-LastExitCode "Performance log collection on $deviceSerial"
            if ($recordLines.Count -eq 0) {
                throw "No structured performance record was found for $deviceSerial"
            }
            $parsedRecords = @(
                foreach ($recordLine in $recordLines) {
                    $jsonStart = $recordLine.IndexOf($logPrefix) + $logPrefix.Length
                    $recordLine.Substring($jsonStart) | ConvertFrom-Json
                }
            )
            $record = $parsedRecords |
                Where-Object { $_.measurement -eq 'm0-editor-cold-baseline' } |
                Select-Object -Last 1
            $m2IndexRecord = $parsedRecords |
                Where-Object { $_.measurement -eq 'm2-python-lazy-index' } |
                Select-Object -Last 1
            if (-not $record) {
                throw "No M0-compatible editor baseline record was found for $deviceSerial"
            }
            if (-not $m2IndexRecord) {
                throw "No M2 Python lazy-index record was found for $deviceSerial"
            }
            $record | Add-Member -NotePropertyName serial -NotePropertyValue $deviceSerial
            $record | Add-Member -NotePropertyName iteration -NotePropertyValue $iteration
            $records.Add($record)
            $m2IndexRecord | Add-Member -NotePropertyName serial -NotePropertyValue $deviceSerial
            $m2IndexRecord | Add-Member -NotePropertyName iteration -NotePropertyValue $iteration
            $m2IndexRecords.Add($m2IndexRecord)
        }
    }

    $summaries = foreach ($group in $records | Group-Object serial) {
        $first = $group.Group[0]
        $m2Group = @($m2IndexRecords | Where-Object { $_.serial -eq $group.Name })
        [ordered]@{
            serial = $group.Name
            device = "$($first.manufacturer) $($first.model)"
            android = "$($first.release) / API $($first.sdk)"
            webViewPackage = $first.webViewPackage
            samples = $group.Count
            medianActivityLaunchToFirstDrawMs = Get-Median @($group.Group.activityLaunchToFirstDrawMs)
            medianActivityLaunchToReadyMs = Get-Median @($group.Group.activityLaunchToReadyMs)
            medianSessionCreateToReadyMs = Get-Median @($group.Group.sessionCreateToReadyMs)
            medianStaticCompletionFirstPacketMs = Get-Median @($group.Group.staticCompletionFirstPacketMs)
            medianPythonLazyIndexMs = Get-Median @($m2Group.durationMs)
            pythonSerializedIndexUtf16Bytes = $m2Group[0].serializedIndexUtf16Bytes
        }
    }

    [ordered]@{
        schema = 1
        generatedAt = [DateTimeOffset]::Now.ToString('o')
        iterationsPerDevice = $Iterations
        measurementScope =
            'First editor session after force-stop; ActivityScenario launch to first editor draw/ready; synchronous AutoJs6 static completion first packet; first Python static-index load and parse.'
        summaries = @($summaries)
        records = @($records)
        m2IndexRecords = @($m2IndexRecords)
    } | ConvertTo-Json -Depth 8
} finally {
    Pop-Location
}
