# 常见问题

[English](FAQ.md) · [使用说明](USER_GUIDE.zh-CN.md)

**我该下载哪个文件？** 普通用户到 [Releases](https://github.com/tianyangzhou27-bot/SysMonitor/releases) 下载 `SysMonitor-*-windows-x64.zip`，完整解压后运行 `SysMonitor.exe`。GitHub 自动生成的“Source code”压缩包是开发代码。

**如何彻底退出？** 关闭窗口默认留在托盘；请从托盘菜单选择退出，更新前也要这样操作。

**温度读不到？** 启动 LibreHardwareMonitor 并启用本机网页服务 `127.0.0.1:8085`。部分硬件本身不提供相应传感器。

**单进程网络显示不可用？** 这项数据依赖 Windows ETW 权限和采集助手运行状态；不可用不等于 0。确认 `resources/processes` 完整，必要时检查权限。

**Telegram 连接失败？** 核对机器人 Token、私聊 Chat ID、系统或自定义代理；同一个机器人不要同时被其他程序轮询。在“仅本地模式”下 Telegram 请求会被阻止。

**数据保存在哪里？** 设置和历史位于当前 Windows 用户的应用数据目录，通常是 `%APPDATA%\sys-monitor`。导出 CSV 的位置由你选择。启用 Telegram 发送后，消息也会由 Telegram 和接收端处理。

**仅本地模式包含什么？** 在设置 → 隐私与联网中开启后，程序阻止公网 IP 查询、外网连通性检测、外网测速和 Telegram 请求；本机采样、本地保存、本机传感器及网关检测仍可使用。切换时已发出的网络请求可能正在结束。关闭模式后，独立的公网 IP/外网检测开关继续按设定生效。

**如何验证下载包？** 对 ZIP 运行 `Get-FileHash .\SysMonitor-*.zip -Algorithm SHA256`，与同一版 `SHA256SUMS.txt` 比较。
