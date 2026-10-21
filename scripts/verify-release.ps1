param([string]$ApkPath = 'artifacts/chapter9-10/ShopAI-1.1.0-staging.apk')
$ErrorActionPreference='Stop'
$root=Split-Path $PSScriptRoot -Parent
Push-Location $root
try {
  $verification = & .\scripts\verify-apk.ps1 -ApkPath $ApkPath -MappingPath 'artifacts/chapter9-10/mapping-1.1.0-staging-apk.txt'
  $report=($verification -join "`n") | ConvertFrom-Json
  Add-Type -AssemblyName System.IO.Compression.FileSystem
  $zip=[System.IO.Compression.ZipFile]::OpenRead((Resolve-Path -LiteralPath $ApkPath).Path)
  try {
    $entry=$zip.GetEntry('assets/index.android.bundle')
    $stream=$entry.Open();$memory=New-Object System.IO.MemoryStream
    try { $stream.CopyTo($memory);$bundle=[System.Text.Encoding]::ASCII.GetString($memory.ToArray()) } finally { $stream.Dispose();$memory.Dispose() }
    $keyMatch=[regex]::Match((Get-Content -LiteralPath shopai-backend/.env -Raw),'(?m)^GEMINI_API_KEY=(.+)$')
    if(-not $keyMatch.Success) { throw 'Backend key unavailable for exact secret check.' }
    $containsKey=$bundle.Contains($keyMatch.Groups[1].Value.Trim())
    $containsGoogleCall=$bundle.Contains('generativelanguage.googleapis.com')
    if($containsKey -or $containsGoogleCall) { throw 'Client bundle still contains Gemini credentials or direct provider endpoint.' }
    if(@($zip.Entries | Where-Object { $_.FullName -match '(^|/)\.env($|\.)' }).Count -gt 0) { throw '.env file found in APK.' }
  } finally { $zip.Dispose() }
  $apksigner='D:\LAP_TRINH_MOBILE\data1\build-tools\37.0.0\apksigner.bat'
  $newSignature=(& $apksigner verify --print-certs $ApkPath) -join "`n"
  $oldSignature=(& $apksigner verify --print-certs artifacts/ShopAI-Chuong8-armeabi-v7a-release.apk) -join "`n"
  $pattern='(?:V2 )?Signer(?: #1)?: certificate SHA-256 digest: ([a-fA-F0-9]+)'
  $newDigest=[regex]::Match($newSignature,$pattern).Groups[1].Value
  $oldDigest=[regex]::Match($oldSignature,$pattern).Groups[1].Value
  $matchesOld=$newDigest -and $newDigest -eq $oldDigest
  if(-not $matchesOld) { throw 'APK certificate differs from previous installed-build artifact.' }
  $report | Add-Member -NotePropertyName containsBackendGeminiKey -NotePropertyValue $containsKey
  $report | Add-Member -NotePropertyName directGoogleGeminiEndpoint -NotePropertyValue $containsGoogleCall
  $report | Add-Member -NotePropertyName certificateMatchesPreviousApk -NotePropertyValue ([bool]$matchesOld)
  $report | ConvertTo-Json -Depth 6 | Set-Content -Encoding UTF8 artifacts/chapter9-10/apk-verification.json
  Copy-Item -LiteralPath artifacts/apk-signature.txt -Destination artifacts/chapter9-10/apk-signature.txt -Force
  Copy-Item -LiteralPath artifacts/apk-badging.txt -Destination artifacts/chapter9-10/apk-badging.txt -Force
  $report | Select-Object apk,bytes,sha256,architectures,signatureVerified,requiresMetro,containsBackendGeminiKey,directGoogleGeminiEndpoint,certificateMatchesPreviousApk | ConvertTo-Json
} finally { Pop-Location }

