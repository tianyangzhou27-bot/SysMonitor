// GENERATED FRAGMENT — extracted from out/renderer/assets/index-CzIv0K4n.js, lines 25995-26170.
// Original module marker: src/renderer/App.tsx. Not the original TypeScript/TSX source.
// Depends on bundle-level imports, globals, and other fragments; not standalone.
function App() {
	const { mode, cycle } = useTheme();
	const real = useMetrics();
	const { settings, update } = useSettings();
	const dash = (0, import_react.useRef)(null);
	const [sheet, setSheet] = (0, import_react.useState)(null);
	const [histFocus, setHistFocus] = (0, import_react.useState)(null);
	const closeSheet = () => setSheet(null);
	const showHistory = (keys) => {
		setHistFocus((f) => ({
			keys,
			n: (f?.n ?? 0) + 1
		}));
		setSheet("history");
	};
	const replayEvent = (eventId) => {
		setHistFocus((f) => ({
			keys: [],
			n: (f?.n ?? 0) + 1,
			eventId
		}));
		setSheet("history");
	};
	(0, import_react.useEffect)(() => window.api.ui.onOpenSettings(() => setSheet("settings")), []);
	const snap = real.snap;
	const cpu = snap?.cpu.usage ?? null;
	const mem = snap?.memory.usagePercent ?? null;
	const gpu = snap?.gpu.usage ?? null;
	const cpuSub = snap ? [
		shortCpuName(snap.cpu.model),
		`${snap.cpu.freqGHz != null ? snap.cpu.freqGHz.toFixed(2) : "--"} GHz`,
		snap.cpu.tempC != null ? `${snap.cpu.tempC.toFixed(0)}°C` : null,
		snap.cpu.packagePowerW != null ? `${Math.round(snap.cpu.packagePowerW)} W` : null
	].filter(Boolean).join(" · ") : "读取中…";
	const g = snap?.gpu;
	const gpuSub = g ? [
		shortGpuName(g.name),
		`显存 ${formatGB(g.memUsedBytes)} / ${formatGB(g.memTotalBytes)} GB`,
		g.tempC != null ? `${g.tempC.toFixed(0)}°C` : null,
		g.powerW != null ? `${g.powerW.toFixed(0)} W` : null
	].filter(Boolean).join(" · ") : "读取中…";
	const memSub = snap ? `${formatGB(snap.memory.usedBytes)} / ${formatGB(snap.memory.totalBytes)} GB · 已提交 ${formatGB(snap.memory.committedBytes, 0)} GB（上限 ${formatGB(snap.memory.commitLimitBytes, 0)} GB）` : "读取中…";
	const cards = {
		cpu: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MetricCard, {
			icon: Cpu,
			label: "CPU",
			value: cpu,
			unit: "%",
			level: levelOf(cpu, 70, 90),
			history: real.cpu,
			chartMax: 100,
			sub: cpuSub
		}),
		gpu: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MetricCard, {
			icon: Gauge,
			label: "GPU",
			value: gpu,
			unit: "%",
			level: levelOf(gpu, 80, 95),
			history: real.gpu,
			chartMax: 100,
			sub: gpuSub
		}),
		mem: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MetricCard, {
			icon: MemoryStick,
			label: "内存",
			value: mem,
			unit: "%",
			level: levelOf(mem, 80, 92),
			history: real.mem,
			chartMax: 100,
			sub: memSub
		}),
		power: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PowerCard, { fallback: snap?.power ?? null }),
		net: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NetworkCard, {
			net: snap?.network ?? null,
			rxHist: real.rx,
			txHist: real.tx
		}),
		proxy: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProxyCard, { proxy: snap?.proxy ?? null }),
		proc: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProcessCard, { data: snap?.processes ?? null }),
		speed: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SpeedTestCard, {}),
		disk: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DiskPanel, { disk: snap?.disk ?? null }),
		quality: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QualityCard, { data: snap?.quality ?? null }),
		hw: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HardwareCard, {
			hw: snap?.hardware ?? null,
			cpu: snap?.cpu ?? null,
			psu: settings?.psu ?? {
				brand: "",
				maker: "",
				model: "",
				efficiency: "",
				ratedW: null
			},
			onOpenDetail: () => setSheet("hw")
		}),
		diag: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DiagCard, {
			diag: snap?.diagnosis ?? null,
			frames: snap?.frames ?? null,
			onOpenDetail: () => setSheet("diag")
		}),
		cooling: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CoolingCard, {
			cooling: snap?.cooling ?? null,
			lhmOnline: snap?.lhmOnline ?? false,
			onOpenDetail: () => setSheet("cooling")
		})
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: `app ${sheet ? "app--sheet" : ""}`,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TitleBar, {
				themeMode: mode,
				onCycleTheme: cycle,
				onFitLayout: () => dash.current?.fit(),
				onResetLayout: () => dash.current?.reset(),
				taskbarOn: settings?.taskbar.enabled ?? false,
				onToggleTaskbar: () => update({ taskbar: { enabled: !(settings?.taskbar.enabled ?? false) } }),
				onOpenSettings: () => setSheet("settings"),
				onOpenHistory: () => setSheet("history")
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
				className: "content",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dashboard, {
					ref: dash,
					cards
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsSheet, {
				open: sheet === "settings",
				onClose: closeSheet,
				settings,
				update
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HardwareSheet, {
				open: sheet === "hw",
				onClose: closeSheet,
				hw: snap?.hardware ?? null,
				cpu: snap?.cpu ?? null,
				memory: snap?.memory ?? null,
				storage: snap?.storage ?? [],
				dimms: snap?.dimms ?? [],
				psu: settings?.psu ?? {
					brand: "",
					maker: "",
					model: "",
					efficiency: "",
					ratedW: null
				},
				powerW: snap?.power.totalW ?? null,
				update,
				lhmOnline: snap?.lhmOnline ?? false,
				onShowHistory: showHistory
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HistorySheet, {
				open: sheet === "history",
				onClose: closeSheet,
				focus: histFocus
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DiagSheet, {
				open: sheet === "diag",
				onClose: closeSheet,
				diag: snap?.diagnosis ?? null,
				frames: snap?.frames ?? null,
				onReplay: replayEvent
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CoolingSheet, {
				open: sheet === "cooling",
				onClose: closeSheet,
				cooling: snap?.cooling ?? null,
				lhmOnline: snap?.lhmOnline ?? false,
				settings,
				update
			})
		]
	});
}
