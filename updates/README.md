# 更新与下载 / Updates and downloads

[中文使用说明](../docs/USER_GUIDE.zh-CN.md) · [English guide](../docs/USER_GUIDE.md)

**程序下载 / Application downloads:** [GitHub Releases](https://github.com/tianyangzhou27-bot/SysMonitor/releases)

今后每次更新在 Releases 单独发布版本、日期、双语更新说明、Windows 完整包与 SHA-256 校验文件；本目录记录对应说明。此入口为手动下载，不代表程序内置自动更新器。

Future releases belong on the Releases page with a version, date, bilingual notes, complete Windows package, and SHA-256 checksums. This directory indexes those notes. Downloads are manual; this does not imply an in-app updater.

| 版本 / Release | 说明 / Notes |
| --- | --- |
| 源码还原 / Source reconstruction | [2026-11-13 source recovery](2026-11-13-source-recovery.md) |
| `v0.1.0-20261113.1` | [2026-11-13](2026-11-13.md) |

## 更新步骤 / Update steps

退出程序 → 备份本地用户数据 → 解压新版本到新目录 → 启动新版本并检查设置。不要直接覆盖正在运行的文件。不把本地设置、历史数据库或 Telegram 配置放入发布包。

Quit → back up local user data → extract into a new folder → launch and verify settings. Never overwrite running files. Do not include local settings, history databases, or Telegram configuration in release assets.

## 发布者约定 / Maintainer checklist

- 每版使用唯一 Git tag；说明新增、修复、已知问题、隐私变化与是否需要迁移。 / Use a unique tag and document additions, fixes, known limitations, privacy changes, and migrations.
- 完整包命名 `SysMonitor-<tag>-windows-x64.zip`；提供 `SHA256SUMS.txt`。 / Publish a complete package and checksums.
- 若将来提供增量更新，另行标明适用基础版本、目标版本和校验值。当前仅提供完整包。 / Future patches must specify the supported base and target versions and hashes. Currently use full packages.
- 只有完成实际测试才能写“已测试”；不要把语法检查当作完整 GUI 测试。 / Distinguish syntax checks from end-to-end UI testing.

## GitHub 构建附件 / GitHub-hosted packaging

仓库提供 `Windows release` Actions 工作流，在 GitHub 上下载固定版本 Electron、恢复经过 SHA-256 校验的采集依赖并组装完整包，避免本机大文件上传失败。它给已有的同名 Release 添加 ZIP 和校验文件，遇到同名附件会停止，不会覆盖。后续版本需修改工作流中的 `RELEASE_TAG`，先创建对应 Release，再运行工作流。

The `Windows release` Actions workflow downloads pinned Electron, restores hash-verified process dependencies, and assembles the portable package on GitHub. It attaches the ZIP/checksums to an existing release with the configured tag, refusing to overwrite existing filenames. For later versions, change `RELEASE_TAG`, create the corresponding release, and run the workflow. This assembles published build files; it does not recover or rebuild the missing original source project.
