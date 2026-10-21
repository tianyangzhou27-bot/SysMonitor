// GENERATED FRAGMENT — extracted from out/renderer/assets/index-CzIv0K4n.js, lines 17626-17686.
// Original module marker: src/renderer/components/Dashboard.tsx. Not the original TypeScript/TSX source.
// Depends on bundle-level imports, globals, and other fragments; not standalone.
var NO_DRAG = "button, summary, a, input, select, textarea, .seg, .mask, .react-resizable-handle";
function Dashboard({ cards, ref }) {
	const { width, containerRef, mounted } = useContainerWidth();
	const [layouts, setLayouts] = (0, import_react.useState)(loadLayouts);
	(0, import_react.useImperativeHandle)(ref, () => ({
		reset() {
			clearLayouts();
			setLayouts(DEFAULT_LAYOUTS);
		},
		fit() {
			const root = containerRef.current;
			if (!root) return;
			const bp = breakpointOf(width);
			setLayouts((prev) => ({
				...prev,
				[bp]: prev[bp].map((it) => {
					const el = root.querySelector(`[data-card="${it.i}"] > .glass`);
					if (!el) return it;
					const old = el.style.height;
					el.style.height = "auto";
					const px = el.offsetHeight;
					el.style.height = old;
					const rows = Math.ceil((px + 14) / 50);
					return {
						...it,
						h: Math.min(it.maxH ?? 40, Math.max(it.minH ?? 1, rows))
					};
				})
			}));
		}
	}), [width, containerRef]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		ref: containerRef,
		className: "dash",
		children: mounted && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveGridLayoutWithRef, {
			width,
			layouts,
			breakpoints: BREAKPOINTS,
			cols: COLS,
			rowHeight: 36,
			margin: [14, 14],
			containerPadding: [0, 0],
			compactor: verticalCompactor,
			dragConfig: { cancel: NO_DRAG },
			resizeConfig: { handles: ["se"] },
			onLayoutChange: (_current, all) => {
				const next = {
					...layouts,
					...all
				};
				setLayouts(next);
				saveLayouts(next);
			},
			children: CARD_IDS.map((id) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				"data-card": id,
				className: "tile",
				children: cards[id]
			}, id))
		})
	});
}
