// GENERATED FRAGMENT — extracted from out/main/index.js, lines 5532-5691.
// Original module marker: src/main/index.ts. Not the original TypeScript/TSX source.
// Depends on bundle-level imports, globals, and other fragments; not standalone.
var fmtRate = (b) => {
	if (b == null) return "--";
	return b >= 1024 ** 2 ? `${(b / 1024 ** 2).toFixed(1)} MB/s` : `${Math.round(b / 1024)} KB/s`;
};
function tooltipOf(s) {
	const n = (v) => v == null ? "--" : Math.round(v);
	return [`CPU ${n(s.cpu.usage)}% · GPU ${n(s.gpu.usage)}% · 内存 ${n(s.memory.usagePercent)}%`, `↓${fmtRate(s.network.rxBytesPerSec)} ↑${fmtRate(s.network.txBytesPerSec)} · 约 ${n(s.power.totalW)} W`].join("\n");
}
try {
	(0, os.setPriority)(os.constants.priority.PRIORITY_ABOVE_NORMAL);
} catch {}
if (!electron.app.requestSingleInstanceLock()) electron.app.quit();
else {
	const store = new SettingsStore();
	const scheduler = new MetricsScheduler();
	let quitting = false;
	let mainWin = null;
	const icon = makeAppIcon();
	const startHidden = process.argv.includes("--hidden");
	const openMain = () => {
		if (!mainWin || mainWin.isDestroyed()) {
			mainWin = createMainWindow({
				icon,
				startHidden: false,
				closeToTray: () => store.get().closeToTray,
				isQuitting: () => quitting
			});
			mainWin.on("closed", () => electron.app.quit());
		}
		if (mainWin.isMinimized()) mainWin.restore();
		mainWin.show();
		mainWin.focus();
		return mainWin;
	};
	electron.app.on("second-instance", () => openMain());
	electron.app.whenReady().then(() => {
		electron.app.setAppUserModelId("com.sysmonitor.desktop");
		store.load();
		const taskbar = new TaskbarWindow(store.get());
		const history = new HistoryStore(electron.app.getPath("userData"), store.get().history);
		history.open();
		const allMetrics = (snap) => [...snapshotMetrics(snap), ...sensorMetrics(scheduler.lhm.list())];
		const alerts = new AlertEngine(() => openMain(), {
			open: (c, since, snap) => history.openEvent({
				kind: "alert",
				key: c.id,
				severity: "warn",
				title: c.title,
				detail: c.body,
				ts: since
			}, makeEventSnapshot(snap, allMetrics(snap))),
			close: (id, ts) => history.closeEvent(id, ts)
		});
		const tray = new AppTray({
			showMain: () => openMain(),
			openSettings: () => {
				const win = openMain();
				const send = () => win.webContents.send(IPC.uiOpenSettings);
				if (win.webContents.isLoading()) win.webContents.once("did-finish-load", send);
				else send();
			},
			toggleTaskbar: () => store.patch({ taskbar: { enabled: !store.get().taskbar.enabled } }),
			quit: () => electron.app.quit()
		});
		tray.create(icon);
		const applyAutoStart = (on) => {
			if (!electron.app.isPackaged) return;
			electron.app.setLoginItemSettings({
				openAtLogin: on,
				args: ["--hidden"]
			});
		};
		const severityOf = {
			low: "info",
			medium: "warn",
			high: "warn"
		};
		const confidenceText = {
			low: "低",
			medium: "中",
			high: "高"
		};
		const diagnosis = new DiagnosisEngine({
			open: (rule, r, since, snap) => history.openEvent({
				kind: "diag",
				key: rule.id,
				severity: severityOf[r.confidence],
				title: `潜在性能瓶颈：${titleOf(rule, r)}`,
				detail: r.cause,
				confidence: confidenceText[r.confidence],
				extra: {
					evidence: r.evidence,
					cause: r.cause,
					suggestions: r.suggestions,
					processes: r.processes
				},
				ts: since
			}, makeEventSnapshot(snap, allMetrics(snap))),
			close: (id, ts, extra) => history.closeEvent(id, ts, extra)
		});
		scheduler.onBeforeSend((snap) => {
			snap.diagnosis = diagnosis.update(snap, store.get().diag);
		});
		registerIpc({
			store,
			scheduler,
			alerts,
			history
		});
		store.onChange((next, prev) => {
			scheduler.applySettings(next);
			history.applySettings(next.history);
			taskbar.apply(next);
			tray.update(next.taskbar.enabled);
			if (next.autoStart !== prev.autoStart) applyAutoStart(next.autoStart);
			for (const w of electron.BrowserWindow.getAllWindows()) if (!w.isDestroyed()) w.webContents.send(IPC.settingsChanged, next);
		});
		scheduler.onShellInfo((info) => taskbar.onShell(info));
		scheduler.onFanSpun((ids) => store.patch({ cooling: { spun: ids } }));
		scheduler.onSnapshot((snap) => {
			alerts.evaluate(snap, store.get().alerts);
			history.record(Date.now(), allMetrics(snap));
			tray.setTooltip(tooltipOf(snap));
		});
		mainWin = createMainWindow({
			icon,
			startHidden,
			closeToTray: () => store.get().closeToTray,
			isQuitting: () => quitting
		});
		mainWin.on("closed", () => electron.app.quit());
		const s = store.get();
		taskbar.apply(s);
		tray.update(s.taskbar.enabled);
		applyAutoStart(s.autoStart);
		scheduler.start(s);
		let fansReleased = false;
		electron.app.on("will-quit", (e) => {
			if (fansReleased) return;
			e.preventDefault();
			Promise.race([scheduler.releaseFans(), new Promise((r) => setTimeout(r, 2500))]).finally(() => {
				fansReleased = true;
				electron.app.quit();
			});
		});
		electron.app.on("before-quit", () => {
			quitting = true;
			scheduler.stop();
			alerts.closeAll();
			diagnosis.closeAll();
			history.close();
			store.flush();
			taskbar.close();
			tray.destroy();
		});
	});
	electron.app.on("window-all-closed", () => {
		electron.app.quit();
	});
}
