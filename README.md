# SysMonitor

[简体中文](README.zh-CN.md) | English

SysMonitor is a Windows desktop system monitor with a compact taskbar overlay, tray controls, performance history, alerts, and optional fan control. This repository contains an **extracted runnable build** of version 0.1.0 from the supplied Electron application. The original TypeScript/React project, build configuration, and unbundled frontend sources were not present in the supplied package. The files in `out/` are generated JavaScript and CSS, so this is a starting point for source restoration rather than the original development tree.

## Features

- Live CPU, GPU, memory, disk, network, power, and hardware information
- Taskbar overlay and system tray controls
- Historical metrics and event records in a local SQLite database, with CSV export
- Threshold alerts and performance diagnosis
- Optional frame monitoring with Intel PresentMon
- Optional sensor readings and fan controls through LibreHardwareMonitor
- Network speed test (uses external test servers)

The current application interface is in **Chinese**. These English instructions explain how to run it; they do not translate the interface.

**Detailed documentation:** [Features and user guide](docs/FEATURES.md) · [Permissions, data and privacy](docs/PERMISSIONS_AND_PRIVACY.md) · [Generated source fragments](recovered-src/README.md). These documents distinguish observed UI behavior from code review and describe the automatic network connections.

## Requirements and run

- Windows 10/11, 64-bit
- Node.js 22.12 or newer and npm (or pnpm)
- Internet access for initial dependency installation

```powershell
git clone https://github.com/tianyangzhou27-bot/SysMonitor.git
cd SysMonitor
npm install
npm start
```

`npm start` launches the extracted application through Electron. No separate build step is needed. To check the extracted JavaScript syntax, run `npm run check`.

With pnpm, use `pnpm install`, then `pnpm exec install-electron` if the Electron executable was not downloaded by the install step, and finally `pnpm start`.

An existing packaged Windows copy can be started by running `SysMonitor.exe` in its original directory. Keep the companion files and `resources` folder together. That packaged copy is not included in this repository because it contains the full Electron/Chromium runtime.

## Optional hardware integrations

**LibreHardwareMonitor:** For additional temperatures, disk health, memory sensors, and fan controls, start LibreHardwareMonitor as administrator and enable **Options → Remote Web Server → Run**. SysMonitor reads its local server at `http://127.0.0.1:8085`. Some sensors may be unavailable on particular hardware. The app may try to start an existing Windows scheduled task named `LibreHardwareMonitor` if the server is offline; it does not create that task.

**Fan control:** The default mode hands control to the motherboard BIOS or GPU. Assign fan roles carefully in Settings before selecting automatic or manual control. Do not assign a pump as a normal fan. Hardware support varies; monitor temperatures when testing a new configuration. If control fails to return to firmware, restart LibreHardwareMonitor or the PC.

**Frame monitoring:** PresentMon is included under `vendor/PresentMon/`. For frame capture, add your Windows account to the built-in **Performance Log Users** group, then sign out and back in. This administrative command is shown in the app:

```powershell
Add-LocalGroupMember -SID S-1-5-32-559 -Member "$env:USERDOMAIN\$env:USERNAME"
```

The default capture mode targets a foreground fullscreen application. Settings can change it to continuous capture.

## Settings, data, and network use

The app stores `settings.json` and `history.db` in Electron's per-user application data directory. History recording is enabled by default and can be disabled or cleared in Settings. Closing the window sends the app to the tray by default; use the tray menu to quit it fully.

The app contacts external endpoints for public IP/connectivity checks and only runs a bandwidth test when you start one. A bandwidth test transfers substantial data. The main process currently references `ip.3322.net`, `myip.ipip.net`, Cloudflare, `api.ipify.org`, and a CentOS mirror; availability can vary by region.

## Repository layout

| Path | Contents |
| --- | --- |
| `out/main/`, `out/preload/`, `out/renderer/` | Extracted Electron application build |
| `resources/` | PowerShell hardware/network helpers and icon |
| `vendor/PresentMon/` | Intel PresentMon binary and its license |
| `recovered-src/` | Generated JavaScript split by the bundle's original module markers; not independent or original TypeScript source |
| `docs/` | Detailed feature and permissions/privacy guides in English and Chinese |

The memory spoofing script found beside the supplied application was excluded: it changes the displayed total memory to a fixed 64 GB and does not belong in an accurate monitor. The extracted application code reads the actual total memory.

## License and provenance

The SysMonitor application code in this repository is offered under the [MIT License](LICENSE). Bundled third-party software retains its own copyrights and licenses; see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). The extracted build may not be suitable for further development until the original source project is recovered.
