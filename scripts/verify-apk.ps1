param(
    [string]$ApkPath = (Join-Path $PSScriptRoot '../android/app/build/outputs/apk/release/app-release.apk'),
    [string]$SdkRoot = 'D:\LAP_TRINH_MOBILE\data1',
    [string]$MappingPath = (Join-Path $PSScriptRoot '../android/app/build/outputs/mapping/release/mapping.txt')
)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$resolvedApk = (Resolve-Path -LiteralPath $ApkPath).Path
$zip = [System.IO.Compression.ZipFile]::OpenRead($resolvedApk)
try {
    $nativeEntries = @($zip.Entries | Where-Object { $_.FullName -match '^lib/[^/]+/[^/]+\.so$' })
    $abis = @($nativeEntries | ForEach-Object { $_.FullName.Split('/')[1] } | Sort-Object -Unique)
    if ($abis -notcontains 'armeabi-v7a') { throw 'APK does not contain armeabi-v7a.' }
    $elfChecks = @()
    foreach ($entry in $nativeEntries) {
        $stream = $entry.Open()
        try {
            $header = New-Object byte[] 20
            $read = $stream.Read($header, 0, 20)
            $valid = $read -eq 20 -and $header[0] -eq 127 -and $header[1] -eq 69 -and $header[2] -eq 76 -and $header[3] -eq 70
            $machine = [BitConverter]::ToUInt16($header, 18)
            $isArm32 = $valid -and $header[4] -eq 1 -and $machine -eq 40
            if ($entry.FullName -like 'lib/armeabi-v7a/*' -and -not $isArm32) { throw ('Invalid ARM32 ELF: ' + $entry.FullName) }
            $elfChecks += [pscustomobject]@{ name = $entry.FullName; bytes = $entry.Length; arm32 = $isArm32 }
        } finally { $stream.Dispose() }
    }
    foreach ($required in @('libreactnative.so','libhermesvm.so','libappmodules.so','libexpo-modules-core.so','libVisionCamera.so','libworklets.so','libreanimated.so')) {
        if (-not $zip.GetEntry('lib/armeabi-v7a/' + $required)) { throw ('Missing native library: ' + $required) }
    }
    $bundle = $zip.GetEntry('assets/index.android.bundle')
    if (-not $bundle -or $bundle.Length -eq 0) { throw 'Missing JavaScript bundle.' }
    $stream = $bundle.Open()
    try {
        $memory = New-Object System.IO.MemoryStream
        $stream.CopyTo($memory)
        $bundleBytes = $memory.ToArray()
        $memory.Dispose()
        $magic = [BitConverter]::ToString($bundleBytes, 0, 8)
        $hermesBytecode = $magic -eq 'C6-1F-BC-03-C1-03-19-1F'
        if (-not $hermesBytecode) { throw 'Expected Hermes bytecode in the release bundle.' }
        $bundleText = [System.Text.Encoding]::ASCII.GetString($bundleBytes)
        $realKeyDetected = [regex]::IsMatch($bundleText, 'AIza[0-9A-Za-z_-]{30,}')
    } finally { $stream.Dispose() }
    $requiredClasses = @('DeviceCredentialModule','ShopSecurityPackage','ExpoModulesPackageList','SecureStoreModule','LocalAuthenticationModule')
    $classes = @{}
    $aliases = @{}
    if (Test-Path -LiteralPath $MappingPath) {
        foreach ($line in [System.IO.File]::ReadLines((Resolve-Path -LiteralPath $MappingPath).Path)) {
            if ($line -match '^([^ ]+) -> ([^:]+):$') {
                $original = $Matches[1]
                $obfuscated = $Matches[2]
                foreach ($class in $requiredClasses) {
                    if ($original -eq $class -or $original.EndsWith('.' + $class)) { $aliases[$class] = $obfuscated }
                }
            }
        }
    }
    foreach ($class in $requiredClasses) { $classes[$class] = $false }
    foreach ($entry in @($zip.Entries | Where-Object { $_.FullName -match '^classes\d*\.dex$' })) {
        $stream = $entry.Open()
        try {
            $memory = New-Object System.IO.MemoryStream
            $stream.CopyTo($memory)
            $dexText = [System.Text.Encoding]::ASCII.GetString($memory.ToArray())
            $memory.Dispose()
            foreach ($class in $requiredClasses) {
                $descriptor = if ($aliases.ContainsKey($class)) { 'L' + $aliases[$class].Replace('.', '/') + ';' } else { $null }
                if ($dexText.Contains($class) -or ($descriptor -and $dexText.Contains($descriptor))) { $classes[$class] = $true }
            }
        } finally { $stream.Dispose() }
    }
    foreach ($class in $requiredClasses) { if (-not $classes[$class]) { throw ('Missing native class: ' + $class) } }
} finally { $zip.Dispose() }

$buildTools = Join-Path $SdkRoot 'build-tools/37.0.0'
$signature = @(& (Join-Path $buildTools 'apksigner.bat') verify --verbose --print-certs $resolvedApk)
if ($LASTEXITCODE -ne 0) { throw 'APK signature verification failed.' }
$badging = @(& (Join-Path $buildTools 'aapt2.exe') dump badging $resolvedApk)
if ($LASTEXITCODE -ne 0) { throw 'APK manifest inspection failed.' }
$manifest = @(& (Join-Path $buildTools 'aapt2.exe') dump xmltree $resolvedApk --file AndroidManifest.xml)
if ($LASTEXITCODE -ne 0) { throw 'APK manifest XML inspection failed.' }
$debuggable = [bool]($badging -match '^application-debuggable')
if ($debuggable) { throw 'Expected a non-debuggable release APK.' }
$summary = [ordered]@{
    apk = $resolvedApk
    sha256 = (Get-FileHash -LiteralPath $resolvedApk -Algorithm SHA256).Hash
    bytes = (Get-Item -LiteralPath $resolvedApk).Length
    architectures = $abis
    nativeLibraries = $elfChecks
    bundledJavaScriptBytes = $bundle.Length
    hermesBytecode = $hermesBytecode
    nativeClasses = $classes
    nativeClassNamesAfterR8 = $aliases
    realGeminiKeyDetected = $realKeyDetected
    signatureVerified = $true
    debuggable = $debuggable
    requiresMetro = $false
}
$artifactRoot = Join-Path $PSScriptRoot '../artifacts'
New-Item -ItemType Directory -Path $artifactRoot -Force | Out-Null
$signature | Set-Content -Encoding UTF8 -LiteralPath (Join-Path $artifactRoot 'apk-signature.txt')
$badging | Set-Content -Encoding UTF8 -LiteralPath (Join-Path $artifactRoot 'apk-badging.txt')
$manifest | Set-Content -Encoding UTF8 -LiteralPath (Join-Path $artifactRoot 'apk-manifest.txt')
$summary | ConvertTo-Json -Depth 6 | Set-Content -Encoding UTF8 -LiteralPath (Join-Path $artifactRoot 'apk-verification.json')
$summary | ConvertTo-Json -Depth 6
