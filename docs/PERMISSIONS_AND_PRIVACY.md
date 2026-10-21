# Permissions, data and privacy

Applies to the extracted SysMonitor 0.1.0 release; code reviewed on 2026-10-21. This describes **capabilities invoked by the reviewed build** and when they are used. It is not an independent certification of every dependency.

## At a glance

- Basic monitoring normally runs as the current Windows user. We found no code that requests UAC elevation when the app starts.
- The app reads system and hardware state, processes and network connections. Performance history is recorded in the current user's local application data directory by default.
- It **automatically uses the network** for public IP lookups and connectivity probes. Avoiding the Speed Test button does not make the app offline. A system firewall can block those connections, with incomplete network cards as a consequence.
- Optional frame capture may require Performance Log Users membership. Optional LibreHardwareMonitor may require its own administrator access; fan writes can physically change fan speeds.

## Windows capabilities and conditions

| Capability | Purpose and data that may be read | Trigger and privilege |
| --- | --- | --- |
| Performance counters, hardware APIs, PowerShell CIM/WMI | CPU/GPU/memory/disk load, temperatures, device models, motherboard/BIOS, monitor and disk serial numbers. Uses `systeminformation`, `nvidia-smi`, PowerShell and PDH; available data varies by hardware and Windows access. | Basic sampling starts automatically under the current user's access. Helper scripts use `-ExecutionPolicy Bypass` for that PowerShell process. |
| Process and connection lists | `tasklist`, `netstat` and counters provide process names, PIDs, resource use and connection addresses/ports for rankings and the proxy panel. | Read automatically while monitoring. Protected processes may be unavailable. |
| Adapters, Wi‑Fi, routing and DNS | Local IP, gateway, DNS, SSID, signal strength, link speed and the current user's Windows Internet Settings proxy registry key. | Network panel refreshes automatically. We found no call that changes Windows proxy settings. |
| Per-user application data | `settings.json` stores settings; SQLite `history.db` stores metrics and alert/diagnosis events, which may include process names. CSV files are written only after the user chooses Export and a destination. | History is enabled by default. Disabling future recording does not erase earlier data; use Clear separately. |
| Login item and tray | Electron `setLoginItemSettings` configures login startup for the **packaged app**; closing the window normally hides it to the tray. | Login startup is off by default and configured when selected. Closing the window does not quit the app. |
| Performance event capture | Bundled Intel PresentMon captures frame times and related process information. | Frame monitoring is enabled in settings by default, in fullscreen mode. Actual capture depends on permission. An administrator may need to add the account to Windows `Performance Log Users` and the user must sign out/in; SysMonitor itself need not permanently run elevated for this. |
| Local hardware service | Reads `http://127.0.0.1:8085/data.json` and sensor values; fan control writes to `/Sensor?action=Set`. If offline, the app may try to run an **existing** scheduled task named `LibreHardwareMonitor`. | Requires a separately configured LibreHardwareMonitor process, which commonly needs administrator access for some sensors. Firmware controls fans by default; manual/automatic control requires additional UI acknowledgement. |

## External network connections

These targets are defined directly in the app's main-process code. External services can see the requesting public IP and normal connection metadata; with a proxy, this may be the proxy exit IP.

| When | Target | Purpose and traffic |
| --- | --- | --- |
| At startup and about every 60 seconds | `ip.3322.net`, falling back to `myip.ipip.net`; `1.1.1.1/cdn-cgi/trace`, falling back to `api.ipify.org` | Look up two public IP views and location. |
| At startup and about every five seconds | Current gateway (ICMP ping); `223.5.5.5:443` (TCP connect) | Estimate LAN/internet reachability and latency. |
| Only when the user starts a speed test | `speed.cloudflare.com` or `mirrors.cloud.tencent.com`, `mirrors.163.com`, `mirrors.tuna.tsinghua.edu.cn`, `mirror.nju.edu.cn` | Cloudflare mode downloads and uploads; domestic mirror mode downloads only. This may transfer substantial data or incur metered/proxy charges. |
| Optional local integrations | `127.0.0.1:8085`, local Clash/mihomo control interface or named pipe | Read sensors or local proxy state; fan control writes to the local sensor interface. |

Our targeted review of the committed application code did not identify a separate account, cloud sync or app telemetry upload service. This is not a guarantee about every dependency or environment. Public IP lookups and connectivity probes are real automatic network activity.

## Managing local data and trust

Look under `%APPDATA%` for the Electron user data folder corresponding to `sys-monitor` / `SysMonitor` to locate `settings.json`, `history.db` and SQLite temporary files. The exact folder may vary by installation. Settings can disable history, adjust retention and clear records. Choose a safe destination for exported CSV. CSV files, database copies and screenshots may contain hardware models, process names, network details or proxy node names; **do not post them to public issues without review**.

The supplied Windows executable has no observed Authenticode signature. The repository does not contain a complete, reproducible build chain from the original TypeScript/React project; `recovered-src/` consists of split generated-code fragments. Obtain binaries from a source you trust, inspect the code and restrict network access if needed. See [third-party notices](../THIRD_PARTY_NOTICES.md).
