# Process collector dependencies / 进程采集依赖

The helper requires .NET Framework 4.8. This Git directory includes the helper executable, binding configuration and dependency license notices. The full Windows release includes the matching DLLs, including the `amd64` subdirectory. Before running from source, copy the **entire** `resources/processes` directory from the matching Windows release into this directory. Keep the versions together; do not mix arbitrary DLL versions.

助手需要 .NET Framework 4.8。Git 仓库保留助手程序、绑定配置和依赖许可，匹配的 DLL（包括 `amd64` 子目录）随 Windows 完整发布包提供。从源码启动前，将同版本完整包中的 **整个** `resources/processes` 文件夹复制到本目录。不要混用不同版本的 DLL。

Download / 下载：[GitHub Releases](https://github.com/tianyangzhou27-bot/SysMonitor/releases)。Original C# source is not yet available / 原始 C# 源码尚未找回。

Alternatively, with PowerShell 7, run `pwsh -File scripts/restore-process-dependencies.ps1` from the repository root. This downloads pinned official NuGet packages and restores only DLLs matching the SHA-256 hashes in `dependencies.json`. It does not rebuild the helper. / 也可在仓库根目录使用 PowerShell 7 执行上述命令；脚本从官方 NuGet 下载固定版本包，仅恢复 SHA-256 与清单一致的 DLL，不会重新编译采集助手。
