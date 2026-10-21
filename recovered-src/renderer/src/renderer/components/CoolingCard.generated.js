// GENERATED FRAGMENT — extracted from out/renderer/assets/index-CzIv0K4n.js, lines 17933-17997.
// Original module marker: src/renderer/components/CoolingCard.tsx. Not the original TypeScript/TSX source.
// Depends on bundle-level imports, globals, and other fragments; not standalone.
var temp = (v) => v == null ? "--" : `${v.toFixed(0)}°C`;
var shown = (f) => f.status !== "unplugged" && f.role !== "none";
function CoolingCard({ cooling, lhmOnline, onOpenDetail }) {
	const down = (0, import_react.useRef)(null);
	const fans = (cooling?.fans.filter(shown) ?? []).sort((a, b) => a.source === b.source ? 0 : a.source === "board" ? -1 : 1);
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
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "panel__head",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Fan, {
					size: 18,
					strokeWidth: 1.75
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "主板与散热" }),
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
		}), !lhmOnline ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "panel__hint",
			children: "需要 LibreHardwareMonitor 在后台运行：以管理员身份打开它，并在 Options → Remote Web Server 里勾选 Run。"
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
			className: "kv kv--tight",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "kv__row",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "CPU 温度" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: temp(cooling?.cpuTempC ?? null) })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "kv__row",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "显卡温度" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: temp(cooling?.gpuTempC ?? null) })]
				}),
				fans.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "kv__row",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: fanLabel(f) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dd", {
						className: f.status === "suspect-stalled" ? "cfan__bad" : void 0,
						children: [f.rpm == null ? "--" : `${Math.round(f.rpm)} RPM`, f.status !== "ok" ? ` · ${STATUS_TEXT[f.status]}` : ""]
					})]
				}, f.id)),
				fans.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "kv__row",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "风扇" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: "暂未读到" })]
				})
			]
		})]
	});
}
