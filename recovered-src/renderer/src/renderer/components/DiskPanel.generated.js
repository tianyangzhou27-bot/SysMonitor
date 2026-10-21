// GENERATED FRAGMENT — extracted from out/renderer/assets/index-CzIv0K4n.js, lines 17771-17831.
// Original module marker: src/renderer/components/DiskPanel.tsx. Not the original TypeScript/TSX source.
// Depends on bundle-level imports, globals, and other fragments; not standalone.
function DiskPanel({ disk }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, {
		className: "panel",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "panel__head",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HardDrive, {
					size: 18,
					strokeWidth: 1.75
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "磁盘" })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "io",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: "读取" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: formatRate(disk?.readBytesPerSec ?? null) })] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: "写入" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: formatRate(disk?.writeBytesPerSec ?? null) })] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: "活动时间" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: disk?.busyPercent != null ? `${disk.busyPercent.toFixed(0)}%` : "--" })] })
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "vols",
				children: [(disk?.volumes ?? []).map((v) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: `vol is-${levelOf(v.usagePercent, 80, 92)}`,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "vol__line",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "vol__name",
								children: v.mount
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
								"总量 ",
								formatGB(v.totalBytes, 0),
								" GB"
							] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
								"已用 ",
								formatGB(v.usedBytes, 0),
								" GB"
							] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
								"剩余 ",
								formatGB(v.totalBytes - v.usedBytes, 0),
								" GB"
							] })
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "vol__track",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "vol__fill",
							style: { width: `${v.usagePercent}%` }
						})
					})]
				}, v.mount)), !disk?.volumes.length && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "panel__hint",
					children: "--"
				})]
			})
		]
	});
}
