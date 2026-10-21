// GENERATED FRAGMENT — extracted from out/renderer/assets/index-CzIv0K4n.js, lines 25918-25941.
// Original module marker: src/renderer/hooks/useMetrics.ts. Not the original TypeScript/TSX source.
// Depends on bundle-level imports, globals, and other fragments; not standalone.
var push = (arr, v) => v == null ? arr : [...arr, v].slice(-60);
function useMetrics() {
	const [state, setState] = (0, import_react.useState)({
		snap: null,
		cpu: [],
		gpu: [],
		mem: [],
		rx: [],
		tx: []
	});
	(0, import_react.useEffect)(() => {
		const apply = (snap) => setState((prev) => ({
			snap,
			cpu: push(prev.cpu, snap.cpu.usage),
			gpu: push(prev.gpu, snap.gpu.usage),
			mem: push(prev.mem, snap.memory.usagePercent),
			rx: push(prev.rx, snap.network.rxBytesPerSec),
			tx: push(prev.tx, snap.network.txBytesPerSec)
		}));
		window.api.metrics.getLatest().then((s) => s && apply(s));
		return window.api.metrics.onSnapshot(apply);
	}, []);
	return state;
}
