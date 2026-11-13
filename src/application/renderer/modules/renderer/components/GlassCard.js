//#region src/renderer/components/GlassCard.tsx
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
//#endregion
