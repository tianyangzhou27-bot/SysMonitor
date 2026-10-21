// GENERATED FRAGMENT — extracted from out/main/index.js, lines 5290-5345.
// Original module marker: src/main/tray.ts. Not the original TypeScript/TSX source.
// Depends on bundle-level imports, globals, and other fragments; not standalone.
var AppTray = class {
	actions;
	tray = null;
	taskbarEnabled = false;
	lastTip = "";
	constructor(actions) {
		this.actions = actions;
	}
	create(icon) {
		this.tray = new electron.Tray(icon.resize({
			width: 16,
			height: 16
		}));
		this.tray.setToolTip("SysMonitor");
		this.tray.on("click", () => this.actions.showMain());
		this.rebuild();
	}
	update(taskbarEnabled) {
		this.taskbarEnabled = taskbarEnabled;
		this.rebuild();
	}
	setTooltip(text) {
		if (!this.tray || text === this.lastTip) return;
		this.lastTip = text;
		this.tray.setToolTip(text.slice(0, 120));
	}
	destroy() {
		this.tray?.destroy();
		this.tray = null;
	}
	rebuild() {
		if (!this.tray) return;
		this.tray.setContextMenu(electron.Menu.buildFromTemplate([
			{
				label: "显示主窗口",
				click: this.actions.showMain
			},
			{
				label: "设置",
				click: this.actions.openSettings
			},
			{ type: "separator" },
			{
				label: "在任务栏显示",
				type: "checkbox",
				checked: this.taskbarEnabled,
				click: this.actions.toggleTaskbar
			},
			{ type: "separator" },
			{
				label: "退出",
				click: this.actions.quit
			}
		]));
	}
};
