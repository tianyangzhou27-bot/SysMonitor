# Reconstructed source / 逆向还原源码

This is an editable, buildable reconstruction of the supplied SysMonitor application. It is not a claim that the original TypeScript, JSX, comments, or local variable names have been recovered exactly.

这里是基于现有程序还原的可编辑、可构建工程；不是只用于阅读的拆分片段。没有声称原来的 TypeScript、JSX、注释和全部局部变量名已经原样找回。

| Path / 路径 | Contents / 内容 |
| --- | --- |
| `application/main/modules/` | Main-process application modules reconstructed from bundle markers / 主进程业务模块 |
| `application/preload/modules/` | Preload and IPC bridge modules / 预加载与 IPC 桥接模块 |
| `application/renderer/modules/` | React UI application code in generated JavaScript form / React 界面的 JavaScript 代码 |
| `application/*/vendor/` | Existing third-party/runtime regions with retained notices / 原包第三方与运行时代码，保留版权声明 |
| `application/*/scaffold/` | Bundle glue between regions / 模块之间的连接代码 |
| `application/files/` | Standalone JS, HTML, CSS and SVG / 独立脚本及界面资源 |
| `application/build-map.json` | Exact ordered assembly recipe for all 21 runtime files / 21 个运行文件的完整组装顺序 |
| `collector/` | Decompiled C# process collector, project and config / 反编译后的 C# 采集器、项目与配置 |

## Build / 构建

From the repository root, use Node.js 22.12+, Windows x64 and .NET Framework 4.8:

在仓库根目录执行；需要 Node.js 22.12+、Windows x64 和 .NET Framework 4.8：

```powershell
# Restore the matching collector dependencies, if missing. Requires PowerShell 7 and network.
# 依赖缺失时恢复匹配版本；这一步需要 PowerShell 7 和网络。
pwsh -File scripts/restore-process-dependencies.ps1

node scripts/build-js.cjs
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/build-collector.ps1
node scripts/build-js.cjs --check
node scripts/test-collector.cjs
```

JavaScript outputs are written to `out/`. The rebuilt helper and dependencies are written to `dist/collector/`. The baseline helper is kept untouched for comparison. After testing, use `scripts/build-collector.ps1 -Install` to replace the repository's helper with the rebuilt one, then start/package the app normally. These commands do not modify an installed copy outside this checkout.

JavaScript 输出到 `out/`，重新编译的助手及依赖输出到 `dist/collector/`。默认保留原助手用于对比测试。验证后可执行 `scripts/build-collector.ps1 -Install`，将重新编译版本装入当前仓库，再正常启动或打包；不会修改仓库外已安装的程序。

To run the UI: `npm install`, `npx --no-install install-electron`, then `npm start`. The original app's optional network features remain present; see the privacy guide.

启动界面：`npm install`、`npx --no-install install-electron`、`npm start`。原有可选联网功能仍然存在，范围见隐私说明。

## Editing and limitations / 编辑方式与限制

Edit files under `src/application/`, then run the build. Region files share the original bundle scope and must be assembled in manifest order; they are not independent ES modules. The React UI is valid editable JavaScript using compiled React calls, not reconstructed JSX/TSX. `recover-js-source.cjs` is a one-time recovery utility and refuses to overwrite an existing source tree; it is not the normal build command. Do not edit `out/` and then expect those changes to survive a source rebuild.

修改 `src/application/` 后执行构建。模块片段仍共享原包作用域，需按清单顺序组合，不能逐个当作独立 ES 模块导入。React 界面是可编辑的 JavaScript/React 调用形式，尚未恢复成 JSX/TSX。`recover-js-source.cjs` 只用于首次还原，并会拒绝覆盖现有源码；正常开发使用构建命令。不要只修改 `out/`，否则重新构建会覆盖这些修改。

C# was decompiled with official ILSpyCmd 11.2.0.10050 targeting C# 5, then compiled successfully with the Windows .NET Framework compiler. The project targets .NET Framework 4.8. Behavior checks cover the JSON protocol, process details, stale PID-identity rejection, sampling and termination of test-owned child processes. These tests do not prove bit-for-bit binary identity or every possible GUI/hardware behavior.

C# 使用官方 ILSpyCmd 11.2.0.10050 以 C# 5 形式反编译，已用 Windows .NET Framework 编译器重新编译成功；项目目标为 .NET Framework 4.8。行为验证覆盖 JSON 协议、进程详情、过期进程身份拒绝、采样和仅终止测试自身创建的子进程。这不等于二进制逐字节相同，也不等于全部界面和硬件场景均已验证。

Recovery inputs and hashes are recorded in [provenance.json](provenance.json). / 原文件和校验值记录在该清单中。
