param([string]$CacheDirectory = (Join-Path $PSScriptRoot '../dist/nuget-cache'))
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$destination = Join-Path $root 'resources/processes'
$manifest = Get-Content -LiteralPath (Join-Path $destination 'dependencies.json') -Raw | ConvertFrom-Json
New-Item -ItemType Directory -Path $CacheDirectory -Force | Out-Null
Add-Type -AssemblyName System.IO.Compression
$pending = @{}
foreach ($file in $manifest.files) { $pending[$file.sha256] = $file.path }
foreach ($package in $manifest.packages) {
  $id = $package.id.ToLowerInvariant()
  $version = $package.version.ToLowerInvariant()
  $archivePath = Join-Path $CacheDirectory "$id.$version.nupkg"
  $validArchive = $false
  if (Test-Path -LiteralPath $archivePath) {
    try { $probe = [System.IO.Compression.ZipFile]::OpenRead($archivePath); $probe.Dispose(); $validArchive = $true } catch { $validArchive = $false }
  }
  if (-not $validArchive) {
    for ($attempt = 1; $attempt -le 3; $attempt++) {
      try {
        Invoke-WebRequest -Uri "https://api.nuget.org/v3-flatcontainer/$id/$version/$id.$version.nupkg" -OutFile "$archivePath.download"
        $probe = [System.IO.Compression.ZipFile]::OpenRead("$archivePath.download"); $probe.Dispose()
        Move-Item -LiteralPath "$archivePath.download" -Destination $archivePath -Force
        break
      } catch { if ($attempt -eq 3) { throw }; Start-Sleep -Seconds 2 }
    }
  }
  $archive = [System.IO.Compression.ZipFile]::OpenRead($archivePath)
  try {
    foreach ($entry in $archive.Entries) {
      if (-not $entry.Name.EndsWith('.dll')) { continue }
      $stream = $entry.Open()
      try { $sha = [System.Convert]::ToHexString([System.Security.Cryptography.SHA256]::HashData($stream)).ToLowerInvariant() }
      finally { $stream.Dispose() }
      if (-not $pending.ContainsKey($sha)) { continue }
      $target = Join-Path $destination $pending[$sha]
      New-Item -ItemType Directory -Path (Split-Path $target -Parent) -Force | Out-Null
      [System.IO.Compression.ZipFileExtensions]::ExtractToFile($entry, $target, $true)
      $pending.Remove($sha)
    }
  } finally { $archive.Dispose() }
}
if ($pending.Count) { throw "Unable to restore exact dependency hashes: $($pending.Values -join ', ')" }
Write-Output "Verified and restored $($manifest.files.Count) process-helper DLLs from pinned NuGet packages."
