// GENERATED FRAGMENT — extracted from out/renderer/assets/index-CzIv0K4n.js, lines 26185-26278.
// Original module marker: src/renderer/components/TaskbarApp.tsx. Not the original TypeScript/TSX source.
// Depends on bundle-level imports, globals, and other fragments; not standalone.
var pct = (v) => v == null ? "--" : `${Math.round(v)}%`;
function rate(bytes) {
	const p = rateParts(bytes);
	return p.value == null ? "--" : `${p.value.toFixed(p.value >= 100 ? 0 : 1)} ${p.unit}`;
}
function TaskbarApp() {
	const [snap, setSnap] = (0, import_react.useState)(null);
	const [power, setPower] = (0, import_react.useState)(null);
	const [settings, setSettings] = (0, import_react.useState)(null);
	const [brightness, setBrightness] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		document.body.classList.add("is-taskbar");
		window.api.metrics.getLatest().then((s) => s && setSnap(s));
		window.api.settings.get().then(setSettings);
		const offs = [
			window.api.metrics.onSnapshot(setSnap),
			window.api.power.onLive(setPower),
			window.api.settings.onChange(setSettings),
			window.api.shell.onInfo((info) => setBrightness(info.brightness))
		];
		return () => offs.forEach((off) => off());
	}, []);
	const t = settings?.taskbar;
	const cpu = snap?.cpu.usage ?? null;
	const gpu = snap?.gpu.usage ?? null;
	const mem = snap?.memory.usagePercent ?? null;
	const watts = (power ?? snap?.power)?.totalW ?? null;
	const cells = [];
	if (t?.showCpu !== false) cells.push({
		key: "cpu",
		label: "CPU",
		value: pct(cpu),
		level: levelOf(cpu, 70, 90)
	});
	if (t?.showGpu !== false) cells.push({
		key: "gpu",
		label: "GPU",
		value: pct(gpu),
		level: levelOf(gpu, 80, 95)
	});
	if (t?.showMem !== false) cells.push({
		key: "mem",
		label: "内存",
		value: pct(mem),
		level: levelOf(mem, 80, 92)
	});
	if (t?.showPower !== false) cells.push({
		key: "pw",
		label: "功耗",
		value: watts == null ? "--" : `${Math.round(watts)} W`,
		level: levelOf(watts, 450, 600)
	});
	if (t?.showNet !== false) {
		cells.push({
			key: "rx",
			label: "下行",
			value: rate(snap?.network.rxBytesPerSec ?? null),
			level: "none"
		});
		cells.push({
			key: "tx",
			label: "上行",
			value: rate(snap?.network.txBytesPerSec ?? null),
			level: "none"
		});
	}
	const tone = brightness != null && brightness >= 140 ? "light" : "dark";
	const fs = t?.fontSize ?? 16;
	const m = taskbarMetrics(fs);
	const vars = {
		"--tb-fs": `${fs}px`,
		"--tb-lh": `${m.lineHeight}px`,
		"--tb-col": `${m.colW}px`,
		"--tb-gap": `${m.gap}px`
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "tb",
		"data-tone": tone,
		style: vars,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "tb__grid",
			children: cells.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: `tb__cell is-${c.level}`,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "tb__label",
					children: c.label
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "tb__val",
					children: c.value
				})]
			}, c.key))
		})
	});
}
