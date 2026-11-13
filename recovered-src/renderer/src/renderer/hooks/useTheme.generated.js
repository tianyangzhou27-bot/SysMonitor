// GENERATED FRAGMENT — extracted from out/renderer/assets/index-CzIv0K4n.js, lines 25900-25950.
// Original module marker: src/renderer/hooks/useTheme.ts. Not original TypeScript/TSX; not standalone.
var KEY = "sysmonitor.theme";
var ORDER = [
	"system",
	"light",
	"dark"
];
function readStored() {
	try {
	const v = localStorage.getItem(KEY);
	return v === "light" || v === "dark" || v === "system" ? v : "system";
	} catch { return "system"; }
}
function useTheme() {
	const [mode, setMode] = (0, import_react.useState)(readStored);
	(0, import_react.useEffect)(() => {
		const mq = window.matchMedia("(prefers-color-scheme: dark)");
		const apply = () => {
			const resolved = mode === "system" ? mq.matches ? "dark" : "light" : mode;
			document.documentElement.dataset.theme = resolved;
		};
		let active = true;
		const nativeApply = (state) => {
			if (active && state.mode === mode) document.documentElement.dataset.theme = state.resolved;
		};
		const unsubscribe = window.api.theme.onChange(nativeApply);
		apply();
		window.api.theme.set(mode);
		window.api.theme.get().then(nativeApply).catch(() => {});
		const refresh = () => { apply(); window.api.theme.get().then(nativeApply).catch(() => {}); };
		mq.addEventListener("change", apply);
		window.addEventListener("focus", refresh);
		document.addEventListener("visibilitychange", refresh);
		return () => {
			active = false;
			unsubscribe();
			mq.removeEventListener("change", apply);
			window.removeEventListener("focus", refresh);
			document.removeEventListener("visibilitychange", refresh);
		};
	}, [mode]);
	return {
		mode,
		cycle: (0, import_react.useCallback)(() => {
			setMode((m) => {
				const next = ORDER[(ORDER.indexOf(m) + 1) % ORDER.length];
				try { localStorage.setItem(KEY, next); } catch {}
				return next;
			});
		}, [])
	};
}
