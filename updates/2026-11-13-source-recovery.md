# Source reconstruction / 源码逆向还原 · 2026-11-13

## 中文

- 新增 `src/collector/`：通过 ILSpy 反编译获得 C# 进程采集器，补齐构建配置，并已重新编译成功。
- 新增 `src/application/`：177 个可编辑源文件及构建清单，覆盖全部 21 个 JavaScript/HTML/CSS/SVG 运行文件；重新生成结果已逐字节核对一致。
- 新增构建脚本、原版/重编译版助手的行为对照测试，以及 GitHub Windows 验证流程。
- 当前 Release 下载包保持不变，没有偷偷替换已发布的程序或校验值。需要使用新编译助手时，按 `src/README.md` 构建并安装到自己的仓库副本。

这是可继续开发的还原工程；原作者的 TS/TSX、注释和所有局部变量名仍不能保证原样恢复。React 界面以 JavaScript 形式保留，区域模块仍按清单共享作用域。

## English

- Adds decompiled C# collector source, corrected project configuration, and a successful compilation path in `src/collector/`.
- Adds 177 editable application source files and a build map covering all 21 runtime JS/HTML/CSS/SVG files, with byte-for-byte reconstruction checks.
- Adds build scripts, behavioral checks against the original helper, and a Windows source-validation workflow.
- Existing release downloads and checksums are unchanged. To use the rebuilt collector, follow `src/README.md` and install it into your own checkout.

This is a usable reconstructed project, not an exact recovery of the author's TS/TSX, comments, or every local variable name. React code remains JavaScript, and region files share their original bundle scope through the ordered build map.
