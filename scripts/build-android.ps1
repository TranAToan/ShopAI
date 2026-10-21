param(
  [ValidateSet('development','staging','production')][string]$Environment = 'staging',
  [string]$ApiUrl = '',
  [switch]$Bundle
)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$artifactRoot = Join-Path $projectRoot 'artifacts/chapter9-10'
New-Item -ItemType Directory -Path $artifactRoot -Force | Out-Null
$task = if ($Bundle) { ':app:bundleRelease' } else { ':app:assembleRelease' }
$abi = if ($Bundle) { 'armeabi-v7a,arm64-v8a' } else { 'armeabi-v7a' }
$arguments = @($task, "-PreactNativeArchitectures=$abi", "-PshopEnvironment=$Environment", '--stacktrace','--console=plain')
if ($ApiUrl) { $arguments += "-PshopApiUrl=$ApiUrl" }
if ($Bundle) { $arguments += '-PshopSigning=production' }
$kind = if ($Bundle) { 'aab' } else { 'apk' }
$previousNodeEnv = $env:NODE_ENV
$env:NODE_ENV = 'production'
Push-Location (Join-Path $projectRoot 'android')
try {
  $ErrorActionPreference = 'Continue'
  & .\gradlew.bat @arguments *> (Join-Path $artifactRoot "build-$kind.log")
  $ErrorActionPreference = 'Stop'
  if ($LASTEXITCODE -ne 0) { throw "Gradle failed. See artifacts/chapter9-10/build-$kind.log" }
  $source = if ($Bundle) { 'app/build/outputs/bundle/release/app-release.aab' } else { 'app/build/outputs/apk/release/app-release.apk' }
  $destination = Join-Path $artifactRoot "ShopAI-1.1.0-$Environment.$kind"
  Copy-Item -LiteralPath $source -Destination $destination -Force
  Copy-Item -LiteralPath 'app/build/outputs/mapping/release/mapping.txt' -Destination (Join-Path $artifactRoot "mapping-1.1.0-$Environment-$kind.txt") -Force
  Copy-Item -LiteralPath 'app/build/generated/sourcemaps/react/release/index.android.bundle.map' -Destination (Join-Path $artifactRoot "sourcemap-1.1.0-$Environment-$kind.map") -Force
  Get-FileHash -LiteralPath $destination -Algorithm SHA256
} finally { Pop-Location; $env:NODE_ENV = $previousNodeEnv }
