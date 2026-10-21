// GENERATED FRAGMENT — extracted from out/renderer/assets/index-CzIv0K4n.js, lines 24184-24218.
// Original module marker: src/renderer/components/MetricCard.tsx. Not the original TypeScript/TSX source.
// Depends on bundle-level imports, globals, and other fragments; not standalone.
function MetricCard({ icon: Icon, label, value, unit, decimals = 0, level, history, chartMax, sub, hint, animMs }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, {
		className: `metric is-${level}`,
		title: hint,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "metric__head",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
						size: 18,
						strokeWidth: 1.75
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: label }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusBadge, { level })
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "metric__value",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnimatedNumber, {
					value,
					decimals,
					duration: animMs
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: unit })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "metric__sub",
				children: sub
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkline, {
				data: history,
				max: chartMax
			})
		]
	});
}
