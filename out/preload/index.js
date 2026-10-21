let electron = require("electron");
//#region src/shared/ipc-channels.ts
var IPC = {
	winMinimize: "win:minimize",
	winToggleMaximize: "win:toggle-maximize",
	winClose: "win:close",
	winIsMaximized: "win:is-maximized",
	winMaximizedChanged: "win:maximized-changed",
	themeSet: "theme:set",
	metricsSnapshot: "metrics:snapshot",
	metricsGetLatest: "metrics:get-latest",
	speedtestStart: "speedtest:start",
	speedtestCancel: "speedtest:cancel",
	speedtestProgress: "speedtest:progress",
	powerLive: "power:live",
	settingsGet: "settings:get",
	settingsSet: "settings:set",
	settingsChanged: "settings:changed",
	alertTest: "alerts:test",
	appInfo: "app:info",
	uiOpenSettings: "ui:open-settings",
	shellInfo: "shell:info",
	historySeries: "history:series",
	historyQuery: "history:query",
	historyEvents: "history:events",
	historyEvent: "history:event",
	historyStats: "history:stats",
	historyExport: "history:export",
	historyClear: "history:clear",
	coolingIdentify: "cooling:identify"
};
//#endregion
//#region src/preload/index.ts
function subscribe(channel, cb) {
	const handler = (_, v) => cb(v);
	electron.ipcRenderer.on(channel, handler);
	return () => electron.ipcRenderer.removeListener(channel, handler);
}
electron.contextBridge.exposeInMainWorld("api", {
	win: {
		minimize: () => electron.ipcRenderer.send(IPC.winMinimize),
		toggleMaximize: () => electron.ipcRenderer.send(IPC.winToggleMaximize),
		close: () => electron.ipcRenderer.send(IPC.winClose),
		isMaximized: () => electron.ipcRenderer.invoke(IPC.winIsMaximized),
		onMaximizedChange: (cb) => subscribe(IPC.winMaximizedChanged, cb)
	},
	theme: { set: (mode) => electron.ipcRenderer.send(IPC.themeSet, mode) },
	metrics: {
		getLatest: () => electron.ipcRenderer.invoke(IPC.metricsGetLatest),
		onSnapshot: (cb) => subscribe(IPC.metricsSnapshot, cb)
	},
	power: { onLive: (cb) => subscribe(IPC.powerLive, cb) },
	speedtest: {
		start: (opts) => electron.ipcRenderer.invoke(IPC.speedtestStart, opts),
		cancel: () => electron.ipcRenderer.send(IPC.speedtestCancel),
		onProgress: (cb) => subscribe(IPC.speedtestProgress, cb)
	},
	settings: {
		get: () => electron.ipcRenderer.invoke(IPC.settingsGet),
		set: (patch) => electron.ipcRenderer.invoke(IPC.settingsSet, patch),
		onChange: (cb) => subscribe(IPC.settingsChanged, cb),
		testAlert: () => electron.ipcRenderer.send(IPC.alertTest)
	},
	appInfo: () => electron.ipcRenderer.invoke(IPC.appInfo),
	ui: { onOpenSettings: (cb) => subscribe(IPC.uiOpenSettings, () => cb()) },
	shell: { onInfo: (cb) => subscribe(IPC.shellInfo, cb) },
	history: {
		series: () => electron.ipcRenderer.invoke(IPC.historySeries),
		query: (q) => electron.ipcRenderer.invoke(IPC.historyQuery, q),
		events: (from, to) => electron.ipcRenderer.invoke(IPC.historyEvents, from, to),
		event: (id) => electron.ipcRenderer.invoke(IPC.historyEvent, id),
		stats: () => electron.ipcRenderer.invoke(IPC.historyStats),
		exportCsv: () => electron.ipcRenderer.invoke(IPC.historyExport),
		clear: () => electron.ipcRenderer.invoke(IPC.historyClear)
	},
	cooling: { identify: (fanId) => electron.ipcRenderer.invoke(IPC.coolingIdentify, fanId) }
});
//#endregion
