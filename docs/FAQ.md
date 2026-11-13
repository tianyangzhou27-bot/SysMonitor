# FAQ

[简体中文](FAQ.zh-CN.md) · [User guide](USER_GUIDE.md)

**Which download should I use?** Get `SysMonitor-*-windows-x64.zip` from [Releases](https://github.com/tianyangzhou27-bot/SysMonitor/releases). Extract the entire archive and run `SysMonitor.exe`. GitHub's automatic “Source code” archives are for developers.

**How do I quit fully?** Closing the window normally leaves it in the tray. Use the tray menu's Quit command before updating.

**Why are temperatures missing?** Start LibreHardwareMonitor with its local web server enabled at `127.0.0.1:8085`. Some hardware does not expose a given sensor.

**Why is per-process network data unavailable?** It requires Windows ETW permissions and a working process helper. Unavailable is not zero. Keep the `resources/processes` folder complete and check permissions.

**Why does Telegram fail?** Check the bot token, private-chat ID, proxy and whether another client is polling the same bot. Local-only mode blocks Telegram requests.

**Where is data stored?** Settings and history use the current Windows user's application-data directory, usually `%APPDATA%\sys-monitor`. You choose where CSV exports go. Once sent, Telegram messages are also handled by Telegram and the recipient.

**What does local-only mode cover?** Settings → Privacy and network blocks public-IP checks, Internet connectivity probes, speed tests, and Telegram requests. Local collection, storage, sensors and gateway checks remain available. Requests already in flight may still finish while switching. When you turn it off, the separate public-IP and Internet-probe switches apply again.

**How do I verify a ZIP?** Run `Get-FileHash .\SysMonitor-*.zip -Algorithm SHA256` and compare with the matching `SHA256SUMS.txt`.
