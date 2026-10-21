// GENERATED FRAGMENT — extracted from out/renderer/assets/index-CzIv0K4n.js, lines 25959-25992.
// Original module marker: src/renderer/hooks/useTheme.ts. Not the original TypeScript/TSX source.
// Depends on bundle-level imports, globals, and other fragments; not standalone.
var KEY = "sysmonitor.theme";
var ORDER = [
	"system",
	"light",
	"dark"
];
function readStored() {
	const v = localStorage.getItem(KEY);
	return v === "light" || v === "dark" || v === "system" ? v : "system";
}
function useTheme() {
	const [mode, setMode] = (0, import_react.useState)(readStored);
	(0, import_react.useEffect)(() => {
		const mq = window.matchMedia("(prefers-color-scheme: dark)");
		const apply = () => {
			const resolved = mode === "system" ? mq.matches ? "dark" : "light" : mode;
			document.documentElement.dataset.theme = resolved;
		};
		apply();
		window.api.theme.set(mode);
		mq.addEventListener("change", apply);
		return () => mq.removeEventListener("change", apply);
	}, [mode]);
	return {
		mode,
		cycle: (0, import_react.useCallback)(() => {
			setMode((m) => {
				const next = ORDER[(ORDER.indexOf(m) + 1) % ORDER.length];
				localStorage.setItem(KEY, next);
				return next;
			});
		}, [])
	};
}
