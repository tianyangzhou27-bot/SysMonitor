// GENERATED FRAGMENT — extracted from out/renderer/assets/index-CzIv0K4n.js, lines 24813-24890.
// Original module marker: src/renderer/components/QualityCard.tsx. Not the original TypeScript/TSX source.
// Depends on bundle-level imports, globals, and other fragments; not standalone.
var ORDER$1 = [
	"none",
	"ok",
	"warn",
	"danger"
];
var worst = (a, b) => ORDER$1.indexOf(a) >= ORDER$1.indexOf(b) ? a : b;
function levelFor(t) {
	return worst(t.id === "gateway" ? levelOf(t.latencyMs, 20, 100) : levelOf(t.latencyMs, 150, 400), t.history.length > 0 ? levelOf(t.lossPercent, 1, 10) : "none");
}
function Row({ t }) {
	const ok = t.history.filter((v) => v != null);
	const cap = Math.max(50, Math.min(400, Math.max(0, ...ok) * 1.25));
	const series = t.history.map((v) => v == null ? cap : Math.min(v, cap));
	const level = levelFor(t);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: `q is-${level}`,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "q__head",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "q__name",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: t.label }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: t.host })]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "q__val",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "q__ms",
						children: formatMs(t.latencyMs)
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusBadge, { level: t.latencyMs == null && t.history.length > 0 ? "danger" : level })]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkline, {
				data: series,
				max: cap,
				capacity: 60,
				height: 34
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "q__foot",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["平均 ", formatMs(t.avgMs)] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
						"丢包 ",
						t.lossPercent.toFixed(t.lossPercent > 0 && t.lossPercent < 10 ? 1 : 0),
						"%"
					] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
						"近 ",
						t.history.length * 2,
						" 秒"
					] })
				]
			})
		]
	});
}
function QualityCard({ data }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, {
		className: "panel quality",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "panel__head",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Activity, {
					size: 18,
					strokeWidth: 1.75
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "网络质量" })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "panel__hint",
				children: "每 2 秒探测一次：网关用 ping，国内外用 TCP 连接耗时。丢包时曲线会冲到图的顶部。"
			}),
			data ? data.targets.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, { t }, t.id)) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "panel__hint",
				children: "读取中…"
			})
		]
	});
}
