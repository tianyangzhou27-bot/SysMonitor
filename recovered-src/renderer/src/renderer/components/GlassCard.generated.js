// GENERATED FRAGMENT — extracted from out/renderer/assets/index-CzIv0K4n.js, lines 17751-17768.
// Original module marker: src/renderer/components/GlassCard.tsx. Not the original TypeScript/TSX source.
// Depends on bundle-level imports, globals, and other fragments; not standalone.
function GlassCard({ as: Tag = "article", className = "", onPointerMove, children, ...rest }) {
	const handleMove = (0, import_react.useCallback)((e) => {
		const el = e.currentTarget;
		const r = el.getBoundingClientRect();
		el.style.setProperty("--mx", `${(e.clientX - r.left) / r.width * 100}%`);
		el.style.setProperty("--my", `${(e.clientY - r.top) / r.height * 100}%`);
		onPointerMove?.(e);
	}, [onPointerMove]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tag, {
		className: `glass ${className}`,
		onPointerMove: handleMove,
		...rest,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "glass__body",
			children
		})
	});
}
