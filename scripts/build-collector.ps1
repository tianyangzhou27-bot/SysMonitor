param([switch]$Install)
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$framework = Join-Path $env:WINDIR 'Microsoft.NET/Framework64/v4.0.30319'
$compiler = Join-Path $framework 'csc.exe'
$netstandard = Join-Path $framework 'netstandard.dll'
$trace = Join-Path $root 'resources/processes/Microsoft.Diagnostics.Tracing.TraceEvent.dll'
if (-not (Test-Path -LiteralPath $compiler) -or -not (Test-Path -LiteralPath $netstandard)) { throw 'Install .NET Framework 4.8 (x64) before building the collector.' }
if (-not (Test-Path -LiteralPath $trace)) { throw 'Run scripts/restore-process-dependencies.ps1 with PowerShell 7 first.' }
$output = Join-Path $root 'dist/collector'
New-Item -ItemType Directory -Path $output -Force | Out-Null
Copy-Item -Path (Join-Path $root 'resources/processes/*') -Destination $output -Recurse -Force
$exe = Join-Path $output 'SysMonitor-Processes.exe'
& $compiler /nologo /utf8output /target:exe /platform:x64 /optimize+ "/out:$exe" /r:System.Web.Extensions.dll "/r:$netstandard" "/r:$trace" (Join-Path $root 'src/collector/ProcessCollector.cs') (Join-Path $root 'src/collector/Properties/AssemblyInfo.cs')
if ($LASTEXITCODE -ne 0) { throw 'Collector compilation failed' }
Copy-Item -LiteralPath (Join-Path $root 'src/collector/app.config') -Destination "$exe.config" -Force
if ($Install) { Copy-Item -LiteralPath $exe -Destination (Join-Path $root 'resources/processes/SysMonitor-Processes.exe') -Force }
Write-Output "Built recovered C# source: $exe"
