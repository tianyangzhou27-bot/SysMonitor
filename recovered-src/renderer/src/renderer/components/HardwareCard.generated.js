// GENERATED FRAGMENT — extracted from out/renderer/assets/index-CzIv0K4n.js, lines 19018-19108.
// Original module marker: src/renderer/components/HardwareCard.tsx. Not the original TypeScript/TSX source.
// Depends on bundle-level imports, globals, and other fragments; not standalone.
var GB$1 = 1024 ** 3;
function HardwareCard({ hw, cpu, psu, onOpenDetail }) {
	const down = (0, import_react.useRef)(null);
	const mem = hw?.memory ?? null;
	const modules = mem?.modules ?? [];
	const configured = modules[0]?.configuredMTs ?? null;
	const rated = modules[0]?.ratedMTs ?? null;
	const low = configured != null && rated != null && configured < rated;
	const board = hw?.board ?? null;
	const boardText = board ? [shortVendor(board.vendor), board.model].filter(Boolean).join(" ") : "";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, {
		className: "panel hw hw--clickable",
		onPointerDown: (e) => down.current = {
			x: e.clientX,
			y: e.clientY
		},
		onClick: (e) => {
			const d = down.current;
			if (d && Math.hypot(e.clientX - d.x, e.clientY - d.y) > 4) return;
			onOpenDetail();
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "panel__head",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cpu, {
						size: 18,
						strokeWidth: 1.75
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "硬件信息" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						className: "hw__more",
						onClick: (e) => {
							e.stopPropagation();
							onOpenDetail();
						},
						children: ["详情", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, {
							size: 14,
							strokeWidth: 2
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
				className: "kv kv--tight",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "kv__row",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "处理器" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: cpu ? shortCpuName(cpu.model) : "--" })]
					}),
					hw?.gpu && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "kv__row",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "显卡" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: [[brandShort(hw.gpu.vendor), shortGpuName(hw.gpu.name)].filter(Boolean).join(" "), hw.gpu.memoryMiB != null ? `${Math.round(hw.gpu.memoryMiB / 1024)} GB` : null].filter(Boolean).join(" · ") })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "kv__row",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "主板" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: boardText || "--" })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "kv__row",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "内存" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: mem ? `${modules.length} × ${Math.round(modules[0].capacityBytes / GB$1)} GB ${mem.type ?? ""}${configured != null ? ` · ${configured} MT/s` : ""}` : "--" })]
					}),
					(hw?.monitors.length ? hw.monitors : [null]).map((m, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "kv__row",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: (hw?.monitors.length ?? 0) > 1 ? `显示器 ${i + 1}` : "显示器" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: m ? [
							[brandShort(m.brand), m.model].filter(Boolean).join(" "),
							m.inches != null ? `${m.inches}″` : null,
							m.refreshHz != null ? `${m.refreshHz} Hz` : null
						].filter(Boolean).join(" · ") || "--" : "--" })]
					}, `m${i}`)),
					(hw?.disks.length ? hw.disks : [null]).map((d, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "kv__row",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dt", { children: [(hw?.disks.length ?? 0) > 1 ? `硬盘 ${i + 1}` : "硬盘", d && diskTag(d.kind) ? ` · ${diskTag(d.kind)}` : ""] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: d?.model ?? "--" })]
					}, `d${i}`)),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "kv__row",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "电源" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: psu.brand || psu.model ? [[psu.brand, psu.model].filter(Boolean).join(" "), psu.ratedW ? `${psu.ratedW} W` : null].filter(Boolean).join(" · ") : "未填写（点详情填写）" })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "kv__row",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "已开机" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: hw ? uptimeText(hw.uptimeSec) : "--" })]
					})
				]
			}),
			low && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "hw__warn",
				children: "内存实际频率低于模块标称，可能没有开启 XMP / EXPO。"
			})
		]
	});
}
