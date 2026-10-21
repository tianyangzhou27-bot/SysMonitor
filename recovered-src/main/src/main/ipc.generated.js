// GENERATED FRAGMENT — extracted from out/main/index.js, lines 4892-4975.
// Original module marker: src/main/ipc.ts. Not the original TypeScript/TSX source.
// Depends on bundle-level imports, globals, and other fragments; not standalone.
var finite = (v) => typeof v === "number" && Number.isFinite(v);
function parseHistoryQuery(v) {
	const q = v;
	if (!q || !Array.isArray(q.keys) || !q.keys.every((k) => typeof k === "string") || q.keys.length > 60) throw new Error("无效的历史查询：指标列表");
	if (!finite(q.from) || !finite(q.to) || !finite(q.maxPoints)) throw new Error("无效的历史查询：时间范围");
	return {
		keys: q.keys,
		from: q.from,
		to: q.to,
		maxPoints: q.maxPoints
	};
}
function parseSpeedOptions(v) {
	const o = v;
	if (o?.server !== "cloudflare" && o?.server !== "domestic" || o.duration !== "quick" && o.duration !== "standard") throw new Error("无效的测速参数");
	return {
		server: o.server,
		duration: o.duration
	};
}
function registerIpc({ store, scheduler, alerts, history }) {
	const tester = new SpeedTester((hosts) => scheduler.lookupRoute(hosts));
	electron.ipcMain.on(IPC.themeSet, (_e, mode) => {
		if (mode === "system" || mode === "light" || mode === "dark") electron.nativeTheme.themeSource = mode;
	});
	electron.ipcMain.handle(IPC.metricsGetLatest, () => scheduler.getLatest());
	electron.ipcMain.handle(IPC.settingsGet, () => store.get());
	electron.ipcMain.handle(IPC.settingsSet, (_e, patch) => store.patch(patch ?? {}));
	electron.ipcMain.on(IPC.alertTest, () => alerts.test());
	electron.ipcMain.handle(IPC.appInfo, () => ({
		isPackaged: electron.app.isPackaged,
		version: electron.app.getVersion()
	}));
	electron.ipcMain.handle(IPC.speedtestStart, async (e, raw) => {
		const opts = parseSpeedOptions(raw);
		if (tester.running) throw new Error("测速正在进行");
		return tester.run(opts, (p) => {
			if (!e.sender.isDestroyed()) e.sender.send(IPC.speedtestProgress, p);
		});
	});
	electron.ipcMain.on(IPC.speedtestCancel, () => tester.cancel());
	electron.ipcMain.handle(IPC.historySeries, () => history.series());
	electron.ipcMain.handle(IPC.historyQuery, (_e, q) => history.query(parseHistoryQuery(q)));
	electron.ipcMain.handle(IPC.historyEvents, (_e, from, to) => {
		if (!finite(from) || !finite(to)) throw new Error("无效的时间范围");
		return history.listEvents(from, to);
	});
	electron.ipcMain.handle(IPC.historyEvent, (_e, id) => {
		if (!finite(id)) throw new Error("无效的事件编号");
		return history.getEvent(id);
	});
	electron.ipcMain.handle(IPC.coolingIdentify, (_e, fanId) => {
		if (typeof fanId !== "string") throw new Error("无效的风扇标识");
		return identifyFan(scheduler.lhm, fanId, store.get().cooling);
	});
	electron.ipcMain.handle(IPC.historyStats, () => history.stats());
	electron.ipcMain.handle(IPC.historyClear, () => history.clear());
	electron.ipcMain.handle(IPC.historyExport, async (e) => {
		try {
			const win = electron.BrowserWindow.fromWebContents(e.sender);
			const opts = {
				title: "导出历史数据",
				defaultPath: "SysMonitor-历史数据.csv",
				filters: [{
					name: "CSV 表格",
					extensions: ["csv"]
				}]
			};
			const r = win ? await electron.dialog.showSaveDialog(win, opts) : await electron.dialog.showSaveDialog(opts);
			if (r.canceled || !r.filePath) return { ok: false };
			const eventsFile = r.filePath.replace(/\.csv$/i, "") + "-事件.csv";
			history.exportCsv(r.filePath, eventsFile);
			return {
				ok: true,
				path: r.filePath
			};
		} catch (err) {
			return {
				ok: false,
				error: err instanceof Error ? err.message : String(err)
			};
		}
	});
}
