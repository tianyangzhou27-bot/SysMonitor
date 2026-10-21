// GENERATED FRAGMENT — extracted from out/renderer/assets/index-CzIv0K4n.js, lines 24101-24172.
// Original module marker: src/renderer/components/Sparkline.tsx. Not the original TypeScript/TSX source.
// Depends on bundle-level imports, globals, and other fragments; not standalone.
var W = 120;
var H = 40;
function smoothPath(pts) {
	if (pts.length === 0) return "";
	let d = `M${pts[0].x},${pts[0].y}`;
	for (let i = 1; i < pts.length; i++) {
		const p = pts[i - 1];
		const c = pts[i];
		d += ` Q${p.x},${p.y} ${(p.x + c.x) / 2},${(p.y + c.y) / 2}`;
	}
	const last = pts[pts.length - 1];
	return `${d} L${last.x},${last.y}`;
}
function Sparkline({ data, secondary, min = 0, max, capacity = 60, height = 44 }) {
	const gradId = `spark-${(0, import_react.useId)().replace(/:/g, "")}`;
	const span = (max ?? Math.max(1, ...data, ...secondary ?? [])) - min || 1;
	const toPts = (arr) => arr.map((v, i) => ({
		x: (capacity - arr.length + i) / (capacity - 1) * W,
		y: 38 - Math.min(1, Math.max(0, (v - min) / span)) * 36
	}));
	const pts = toPts(data);
	const line = smoothPath(pts);
	const area = pts.length > 1 ? `${line} L${pts[pts.length - 1].x},${H} L${pts[0].x},${H} Z` : "";
	const line2 = secondary ? smoothPath(toPts(secondary)) : "";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		className: "spark",
		viewBox: `0 0 ${W} ${H}`,
		preserveAspectRatio: "none",
		style: { height },
		"aria-hidden": "true",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("defs", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("linearGradient", {
				id: gradId,
				x1: "0",
				y1: "0",
				x2: "0",
				y2: "1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
					offset: "0%",
					stopColor: "currentColor",
					stopOpacity: "0.32"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
					offset: "100%",
					stopColor: "currentColor",
					stopOpacity: "0"
				})]
			}) }),
			area && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: area,
				fill: `url(#${gradId})`
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: line,
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "1.75",
				strokeLinecap: "round",
				strokeLinejoin: "round",
				vectorEffect: "non-scaling-stroke"
			}),
			line2 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				className: "spark__2",
				d: line2,
				fill: "none",
				strokeWidth: "1.5",
				strokeLinecap: "round",
				strokeLinejoin: "round",
				vectorEffect: "non-scaling-stroke"
			})
		]
	});
}
