//#region node_modules/react-grid-layout/dist/chunk-TW4BCTKD.mjs
function getContentWidth(node) {
	const style = typeof globalThis.getComputedStyle === "function" ? globalThis.getComputedStyle(node) : null;
	if (!style) return node.clientWidth;
	const px = (value) => {
		const parsed = Number.parseFloat(value);
		return Number.isFinite(parsed) ? parsed : 0;
	};
	const computed = Number.parseFloat(style.width);
	if (Number.isFinite(computed)) return Math.max(0, computed);
	return Math.max(0, node.clientWidth - px(style.paddingLeft) - px(style.paddingRight));
}
function useContainerWidth(options = {}) {
	const { measureBeforeMount = false, initialWidth = 1280, debounceTimeout } = options;
	const [width, setWidth] = (0, import_react.useState)(initialWidth);
	const [mounted, setMounted] = (0, import_react.useState)(!measureBeforeMount);
	const containerRef = (0, import_react.useRef)(null);
	const observerRef = (0, import_react.useRef)(null);
	const measureWidth = (0, import_react.useCallback)(() => {
		const node = containerRef.current;
		if (node) {
			const newWidth = Math.round(getContentWidth(node));
			setWidth((prev) => prev === newWidth ? prev : newWidth);
			if (!mounted) setMounted(true);
		}
	}, [mounted]);
	(0, import_react.useEffect)(() => {
		const node = containerRef.current;
		if (!node) return;
		measureWidth();
		if (typeof ResizeObserver !== "undefined") {
			let rafId = null;
			let debounceTimer;
			observerRef.current = new ResizeObserver((entries) => {
				const entry = entries[0];
				if (entry) {
					const newWidth = Math.round(entry.contentRect.width);
					if (debounceTimeout && debounceTimeout > 0) {
						window.clearTimeout(debounceTimer);
						debounceTimer = window.setTimeout(() => {
							setWidth((prev) => prev === newWidth ? prev : newWidth);
							debounceTimer = void 0;
						}, debounceTimeout);
						return;
					}
					if (rafId !== null) cancelAnimationFrame(rafId);
					rafId = requestAnimationFrame(() => {
						setWidth((prev) => prev === newWidth ? prev : newWidth);
						rafId = null;
					});
				}
			});
			observerRef.current.observe(node);
			return () => {
				if (rafId !== null) cancelAnimationFrame(rafId);
				window.clearTimeout(debounceTimer);
				debounceTimer = void 0;
				if (observerRef.current) {
					observerRef.current.disconnect();
					observerRef.current = null;
				}
			};
		}
		return () => {
			if (observerRef.current) {
				observerRef.current.disconnect();
				observerRef.current = null;
			}
		};
	}, [measureWidth, debounceTimeout]);
	return {
		width,
		mounted,
		containerRef,
		measureWidth
	};
}
//#endregion
