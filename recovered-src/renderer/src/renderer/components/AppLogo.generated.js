// GENERATED FRAGMENT — extracted from out/renderer/assets/index-CzIv0K4n.js, lines 25675-25796.
// Original module marker: src/renderer/components/AppLogo.tsx. Not the original TypeScript/TSX source.
// Depends on bundle-level imports, globals, and other fragments; not standalone.
function AppLogo({ size = 20 }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		width: size,
		height: size,
		viewBox: "0 0 256 256",
		"aria-hidden": "true",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("defs", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("linearGradient", {
					id: "applogo-bg",
					x1: "0",
					y1: "0",
					x2: "1",
					y2: "1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
						offset: "0",
						stopColor: "#0f1b3d"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
						offset: "1",
						stopColor: "#1c1048"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("linearGradient", {
					id: "applogo-ring",
					x1: "0",
					y1: "0",
					x2: "1",
					y2: "1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
						offset: "0",
						stopColor: "#22e5ff"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
						offset: "1",
						stopColor: "#9a6bff"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("filter", {
					id: "applogo-glow",
					x: "-30%",
					y: "-30%",
					width: "160%",
					height: "160%",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("feGaussianBlur", { stdDeviation: "6" })
				})
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
				x: "8",
				y: "8",
				width: "240",
				height: "240",
				rx: "56",
				fill: "url(#applogo-bg)"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
				x: "9.5",
				y: "9.5",
				width: "237",
				height: "237",
				rx: "54.5",
				fill: "none",
				stroke: "url(#applogo-ring)",
				strokeOpacity: "0.5",
				strokeWidth: "3"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", {
				transform: "rotate(135 128 128)",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
						cx: "128",
						cy: "128",
						r: "84",
						fill: "none",
						stroke: "url(#applogo-ring)",
						strokeWidth: "22",
						strokeLinecap: "round",
						strokeDasharray: "395.8 132",
						opacity: "0.55",
						filter: "url(#applogo-glow)"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
						cx: "128",
						cy: "128",
						r: "84",
						fill: "none",
						stroke: "url(#applogo-ring)",
						strokeWidth: "12",
						strokeLinecap: "round",
						strokeDasharray: "395.8 132"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
						cx: "128",
						cy: "128",
						r: "62",
						fill: "none",
						stroke: "#9fb4ff",
						strokeOpacity: "0.35",
						strokeWidth: "2.5",
						strokeDasharray: "2 9.1"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M62 134 H96 L110 100 L128 166 L146 92 L158 134 H194",
				fill: "none",
				stroke: "#22e5ff",
				strokeWidth: "14",
				strokeLinecap: "round",
				strokeLinejoin: "round",
				opacity: "0.7",
				filter: "url(#applogo-glow)"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M62 134 H96 L110 100 L128 166 L146 92 L158 134 H194",
				fill: "none",
				stroke: "#ffffff",
				strokeWidth: "9",
				strokeLinecap: "round",
				strokeLinejoin: "round"
			})
		]
	});
}
