//#region src/renderer/components/AnimatedNumber.tsx
function AnimatedNumber({ value, decimals = 0, duration = 450 }) {
	const ref = (0, import_react.useRef)(null);
	const shown = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		const el = ref.current;
		if (!el) return;
		if (value == null) {
			shown.current = null;
			el.textContent = "--";
			return;
		}
		const from = shown.current ?? value;
		const to = value;
		if (from === to) {
			shown.current = to;
			el.textContent = to.toFixed(decimals);
			return;
		}
		const start = performance.now();
		let raf = 0;
		const tick = (now) => {
			const t = Math.min(1, (now - start) / duration);
			const eased = 1 - Math.pow(1 - t, 3);
			const v = from + (to - from) * eased;
			shown.current = v;
			el.textContent = v.toFixed(decimals);
			if (t < 1) raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	}, [
		value,
		decimals,
		duration
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		ref,
		className: "num",
		children: "--"
	});
}
//#endregion
