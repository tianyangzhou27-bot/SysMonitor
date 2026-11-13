param([string]$Tag = 'v0.1.0-20261113.1')
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$dist = Join-Path $root 'dist'
$stage = Join-Path $dist 'portable/SysMonitor'
if (Test-Path -LiteralPath $stage) { throw 'Packaging directory already exists; use a fresh checkout.' }
& (Join-Path $PSScriptRoot 'restore-process-dependencies.ps1')
New-Item -ItemType Directory -Path $stage -Force | Out-Null
Copy-Item -Path (Join-Path $root 'node_modules/electron/dist/*') -Destination $stage -Recurse
Rename-Item -LiteralPath (Join-Path $stage 'electron.exe') -NewName 'SysMonitor.exe'
$app = Join-Path $stage 'resources/app'
New-Item -ItemType Directory -Path (Join-Path $app 'node_modules') -Force | Out-Null
Copy-Item -LiteralPath (Join-Path $root 'out') -Destination $app -Recurse
Copy-Item -LiteralPath (Join-Path $root 'package.json') -Destination $app
Copy-Item -LiteralPath (Join-Path $root 'node_modules/systeminformation') -Destination (Join-Path $app 'node_modules') -Recurse
Copy-Item -Path (Join-Path $root 'resources/*') -Destination (Join-Path $stage 'resources') -Recurse -Force
Copy-Item -LiteralPath (Join-Path $root 'vendor/PresentMon/PresentMon.exe') -Destination (Join-Path $stage 'resources/PresentMon.exe')
Copy-Item -LiteralPath (Join-Path $root 'vendor/PresentMon/LICENSE.txt') -Destination (Join-Path $stage 'resources/PresentMon-LICENSE.txt')
foreach ($name in @('README.md','README.zh-CN.md','LICENSE','THIRD_PARTY_NOTICES.md','docs','updates')) {
  Copy-Item -LiteralPath (Join-Path $root $name) -Destination $stage -Recurse
}
if (Test-Path -LiteralPath (Join-Path $stage 'LICENSE')) {
  # Electron's LICENSE is copied before the application MIT license.
  Copy-Item -LiteralPath (Join-Path $root 'node_modules/electron/dist/LICENSE') -Destination (Join-Path $stage 'LICENSE.electron.txt')
}
$forbidden = Get-ChildItem -LiteralPath $stage -File -Recurse | Where-Object { $_.Name -match '^(settings\.json|history\.db.*|telegram-(alerts|energy|runtime|command-state)\.json)$' -or $_.Extension -in '.log','.dmp' }
if ($forbidden) { throw 'Private/runtime data detected in package' }
$zip = Join-Path $dist "SysMonitor-$Tag-windows-x64.zip"
Add-Type -AssemblyName System.IO.Compression
[System.IO.Compression.ZipFile]::CreateFromDirectory((Split-Path $stage -Parent), $zip, [System.IO.Compression.CompressionLevel]::Optimal, $false)
$hash = (Get-FileHash -LiteralPath $zip -Algorithm SHA256).Hash.ToLowerInvariant()
"$hash  $([System.IO.Path]::GetFileName($zip))" | Set-Content -LiteralPath (Join-Path $dist 'SHA256SUMS.txt') -Encoding ascii
Write-Output "Packaged $zip; SHA256 $hash"
