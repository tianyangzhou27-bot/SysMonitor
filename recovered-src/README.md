# Recovered JavaScript fragments / 还原的 JavaScript 片段

These 83 files were mechanically separated from the three committed `out/` bundles at their `//#region src/...` markers. `INDEX.json` maps each fragment to its original marker and exact line range in the bundle. The extraction changes no application logic.

**These are generated JavaScript fragments, not the original `.ts` / `.tsx` files.** Imports, exports, helper names, module boundaries and types were changed by bundling. The fragments depend on symbols in other regions and cannot be built or run independently. The runnable source of this release remains `out/main/`, `out/preload/` and `out/renderer/`.

If the original project becomes available, it should replace this reconstruction and include its build configuration, dependency lockfile and original source files.

这 83 个文件是按照三个 `out/` 文件中的 `//#region src/...` 标记机械拆分的。`INDEX.json` 记录原模块标记和所在行号。拆分过程未改变程序逻辑。

**它们是生成后的 JavaScript 片段，不是原始 `.ts` / `.tsx` 文件。** 打包过程改变了导入、导出、辅助变量、模块边界和类型信息；片段不能单独编译或运行。目前可运行的代码仍在 `out/main/`、`out/preload/`、`out/renderer/`。

若找回原始工程，应使用原始源码、构建配置和依赖锁文件替换此重构结果。
