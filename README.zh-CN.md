# SysMonitor

简体中文 | [English](README.md)

SysMonitor 是 Windows 桌面系统监控程序，提供任务栏悬浮显示、托盘操作、性能历史、提醒和可选的风扇控制。本仓库包含从用户提供的 Electron 安装目录中提取的 **0.1.0 版可运行构建代码**。提供的文件中没有原始 TypeScript/React 工程、构建配置或未打包的前端源码。`out/` 内是生成后的 JavaScript 和 CSS，可作为恢复源码的起点，但不是原始开发工程。

## 功能

- 实时查看 CPU、GPU、内存、磁盘、网络、功耗及硬件信息
- 在任务栏显示关键指标，并通过系统托盘控制程序
- 将历史指标与事件保存在本地 SQLite 数据库，支持导出 CSV
- 阈值提醒和性能瓶颈诊断
- 使用 Intel PresentMon 可选地采集帧率与帧时间
- 通过 LibreHardwareMonitor 可选地读取更多传感器并控制风扇
- 网络测速（使用外部测速服务器）

目前程序界面为中文；英文 README 是英文使用说明，不表示界面已有英文翻译。

**详细文档：**[功能与使用指南](docs/FEATURES.zh-CN.md) · [权限、数据与隐私说明](docs/PERMISSIONS_AND_PRIVACY.zh-CN.md) · [生成代码片段说明](recovered-src/README.md)。文档区分界面观察与代码审阅，并列明自动联网行为。

## 系统要求与运行方法

- 64 位 Windows 10/11
- Node.js 22.12 或更新版本，以及 npm（也可使用 pnpm）
- 初次安装依赖时需要联网

```powershell
git clone https://github.com/tianyangzhou27-bot/SysMonitor.git
cd SysMonitor
npm install
npm start
```

`npm start` 通过 Electron 启动已提取的程序，不需要再次构建。可以运行 `npm run check` 检查提取出的 JavaScript 语法。

如果使用 pnpm，请运行 `pnpm install`；若安装阶段没有下载 Electron 可执行文件，再运行 `pnpm exec install-electron`，最后执行 `pnpm start`。

如果使用已有的 Windows 打包版，请在原目录运行 `SysMonitor.exe`，并保持旁边的文件及 `resources` 目录完整。打包版内含完整的 Electron/Chromium 运行环境，因此未放进本仓库。

## 可选硬件功能

**LibreHardwareMonitor：** 若需读取更多温度、硬盘健康、内存传感器或控制风扇，请以管理员身份运行 LibreHardwareMonitor，并在 **Options → Remote Web Server → Run** 中开启网页服务。SysMonitor 访问本机的 `http://127.0.0.1:8085`。不同硬件能提供的传感器不同。若服务离线，程序会尝试启动名为 `LibreHardwareMonitor` 的现有 Windows 计划任务，但不会替你创建该任务。

**风扇控制：** 默认交由主板 BIOS 或显卡管理。切换到自动或手动模式前，请在设置中核对风扇用途；不要把水泵当作普通风扇。不同硬件的支持情况不同，首次配置后请观察温度。若风扇未恢复由硬件管理，可重启 LibreHardwareMonitor 或电脑。

**帧率监控：** `vendor/PresentMon/` 中附有 PresentMon。若要采集帧率，需要把当前 Windows 账户加入系统内置的 **Performance Log Users** 组，然后注销并重新登录。程序内显示的管理员 PowerShell 命令如下：

```powershell
Add-LocalGroupMember -SID S-1-5-32-559 -Member "$env:USERDOMAIN\$env:USERNAME"
```

默认仅在前台为全屏程序时采集，可在设置中调整为始终采集。

## 设置、数据与联网

程序把 `settings.json` 和 `history.db` 保存在 Electron 的当前用户应用数据目录。历史记录默认开启，可在设置中关闭或清空。默认关闭主窗口后程序继续留在托盘；请从托盘菜单完全退出。

程序会访问外部服务检查公网 IP 和网络连通性；网络测速仅在主动开始时运行，而且可能传输较多数据。主进程当前使用 `ip.3322.net`、`myip.ipip.net`、Cloudflare、`api.ipify.org` 和 CentOS 镜像，具体可用性因地区而异。

## 仓库目录

| 路径 | 内容 |
| --- | --- |
| `out/main/`、`out/preload/`、`out/renderer/` | 从 Electron 包中提取的应用构建代码 |
| `resources/` | PowerShell 硬件及网络脚本、图标 |
| `vendor/PresentMon/` | Intel PresentMon 程序和许可证 |
| `recovered-src/` | 按原模块标记拆分的生成 JavaScript；不是独立可编译的原始 TypeScript 源码 |
| `docs/` | 中英文详细功能与权限/隐私文档 |

原始目录旁的“将总内存显示改成固定 64 GB”补丁脚本没有收入仓库，因为它会使监控结果失真。仓库中的应用代码读取实际总内存。

## 许可与来源

本仓库的 SysMonitor 应用代码按 [MIT License](LICENSE) 开源。打包进来的第三方软件保留各自版权及许可证，见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。如果要继续开发，最好找回原始工程；当前提取版不包含原始源码结构。
