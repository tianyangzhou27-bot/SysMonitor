# User guide

[简体中文](USER_GUIDE.zh-CN.md) · [Home](../README.md) · [Updates and downloads](../updates/README.md)

Applies to the November 13, 2026 snapshot (internal application version remains 0.1.0). The application UI is currently Chinese.

Privacy and network controls are available starting with `v0.1.0-20261113.2`. See the [FAQ](FAQ.md) for troubleshooting.

## Download and launch

1. Open [GitHub Releases](https://github.com/tianyangzhou27-bot/SysMonitor/releases) and download `SysMonitor-*-windows-x64.zip`. GitHub's automatic Source code archives are not runnable Windows distributions.
2. Extract the entire archive into a writable folder. Keep all DLLs, `locales`, and `resources` together.
3. Run `SysMonitor.exe`. Normal monitoring generally does not require elevation. Closing the window normally minimizes it to the tray; right-click the tray icon and select Quit to exit fully.
4. If the Telegram configuration window appears on first launch, close it without entering a token if you do not need Telegram.

Requires Windows 10/11 x64. The process collector uses Windows .NET Framework 4.8; check its installation if the helper cannot start. Additional hardware sensors require a separately installed LibreHardwareMonitor.

## Monitoring and history

The main window shows CPU, GPU, RAM, disks, network, temperatures, and power. A taskbar overlay provides compact metrics. Settings control sampling, overlay behavior, alert thresholds, duration, cooldown, and history. History is enabled by default; disabling it does not erase existing records. Clear history in Settings or export CSV from the history page.

Settings → Privacy and network can disable public-IP lookups or Internet probes separately. Local-only mode also blocks speed tests and Telegram requests.

Missing readings mean unavailable, not zero. Whole-machine power may be estimated. Energy totals cover valid samples only, excluding sleep, shutdown, and sampling gaps. A manually started speed test can transfer substantial data; Cloudflare mode also uploads test traffic.

## Process manager

Right-click the tray → **进程管理** (Process manager). Search by name/PID and sort by CPU, memory, GPU, VRAM, network, or I/O. Select a process for details, file location, or a confirmed single-process termination.

Termination loses unsaved work in that process. Critical system processes and SysMonitor itself are protected. Some details require additional permissions. Per-process network statistics depend on ETW permissions; unavailable is not zero. Do not add proxy and application traffic together as this can double-count it.

## Sensors, fans, and frame monitoring

For additional temperatures, run LibreHardwareMonitor as administrator and enable Options → Remote Web Server → Run. SysMonitor reads `127.0.0.1:8085`. Sensor support varies. When offline, the app may try to start an existing scheduled task named LibreHardwareMonitor.

Fans default to firmware control. Verify fan roles before changing control, particularly pump assignments. PresentMon frame monitoring needs performance logging permissions; see the [feature guide](FEATURES.md).

## Telegram (optional; sends information to Telegram)

1. Tray → **Telegram 报警设置** (Telegram settings). Create a dedicated bot with `@BotFather` using `/newbot`, then send `/start` to your own bot.
2. Enter its Bot Token and, if necessary, your HTTP/SOCKS5 proxy. Leaving proxy blank uses the system proxy. Tokens are encrypted locally with Electron safeStorage.
3. Click **保存并读取私聊** (Save and discover private chats), then select your chat or enter its Chat ID. Discovery makes a network request.
4. Choose alert delivery and private-chat commands separately. Commands are checked by default: review this before saving a token and Chat ID. Automatic alerts also need the application's global alert switch enabled.
5. **保存并发送测试** sends the computer name and time. **发送状态报告** immediately sends a status report even when automatic delivery is off.

Use `/menu` for buttons, `/status` for a summary, `/top cpu`, `/top gpu`, or `/top memory` for process rankings, `/power` for energy, `/network` for network details, and `/help`. Menu buttons also cover temperatures and alert settings; authorized private-chat alert controls can change local alert configuration.

Messages can contain computer name, hardware models, load, temperature, power, energy, process names and usage, local/public IPs, gateway, DNS, proxy routing, and node names. Telegram and the recipient also process/store transmitted messages. Never publish tokens, Chat IDs, databases, or personal screenshots.

To stop background Telegram access, disable and save both delivery and command switches, and do not use discovery, test, or report buttons. This does not disable the application's public-IP and connectivity checks. See [privacy details](PERMISSIONS_AND_PRIVACY.md).

## Updates and troubleshooting

Quit completely, back up local user data, extract the new release into a new folder, and launch it. Do not overwrite DLLs while running. Keep the previous version for rollback and follow version-specific migration notes. Encrypted tokens may not transfer between Windows users or PCs.

Settings/history usually live in `%APPDATA%\sys-monitor`; the actual directory can vary. Look for the corresponding SysMonitor directory under `%APPDATA%`. Check the sensor service for missing temperatures; for Telegram failures check the proxy, token, chat binding, and competing clients using the same bot. Remove personal information before filing issues.
