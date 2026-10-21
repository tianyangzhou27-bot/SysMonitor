$ErrorActionPreference = 'SilentlyContinue'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$adapters = @(Get-NetAdapter | Where-Object { $_.Status -eq 'Up' })
$ips = @{}
Get-NetIPAddress -AddressFamily IPv4 | ForEach-Object { if (-not $ips.ContainsKey([int]$_.InterfaceIndex)) { $ips[[int]$_.InterfaceIndex] = $_.IPAddress } }
$routes = @{}
Get-NetRoute -DestinationPrefix '0.0.0.0/0' | ForEach-Object {
    $k = [int]$_.InterfaceIndex
    if (-not $routes.ContainsKey($k) -or $_.RouteMetric -lt $routes[$k].RouteMetric) { $routes[$k] = $_ }
}
$ifm = @{}
Get-NetIPInterface -AddressFamily IPv4 | ForEach-Object { $ifm[[int]$_.InterfaceIndex] = $_.InterfaceMetric }
$dns = @{}
Get-DnsClientServerAddress -AddressFamily IPv4 | ForEach-Object { $dns[[int]$_.InterfaceIndex] = @($_.ServerAddresses) }

$out = foreach ($a in $adapters) {
    $i = [int]$a.ifIndex
    $r = $routes[$i]
    [pscustomobject]@{
        name        = $a.Name
        desc        = $a.InterfaceDescription
        index       = $i
        mediaType   = [string]$a.PhysicalMediaType
        virtual     = [bool]$a.Virtual
        linkMbps    = [math]::Round($a.ReceiveLinkSpeed / 1000000)
        ip4         = $ips[$i]
        gateway     = if ($r -and $r.NextHop -ne '0.0.0.0') { $r.NextHop } else { $null }
        routeMetric = if ($r) { [int]$r.RouteMetric + [int]$ifm[$i] } else { $null }
        dns         = @($dns[$i])
    }
}

[Console]::Out.WriteLine((ConvertTo-Json -InputObject @($out) -Compress -Depth 4))
