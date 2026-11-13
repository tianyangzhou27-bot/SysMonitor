//#region src/renderer/hooks/useMetrics.ts
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
//#endregion
