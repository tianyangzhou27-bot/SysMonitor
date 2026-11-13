//#region src/renderer/hooks/usePowerLive.ts
function usePowerLive(fallback) {
	const [live, setLive] = (0, import_react.useState)(null);
	const [history, setHistory] = (0, import_react.useState)([]);
	const acc = (0, import_react.useRef)({
		sum: 0,
		n: 0,
		start: 0
	});
	(0, import_react.useEffect)(() => window.api.power.onLive((p) => {
		setLive(p);
		if (p.totalW == null) return;
		const a = acc.current;
		if (a.n === 0) a.start = p.t;
		a.sum += p.totalW;
		a.n++;
		if (p.t - a.start >= 1e3) {
			const avg = a.sum / a.n;
			a.sum = 0;
			a.n = 0;
			setHistory((h) => [...h, avg].slice(-60));
		}
	}), []);
	return {
		power: live ?? fallback,
		history
	};
}
//#endregion
