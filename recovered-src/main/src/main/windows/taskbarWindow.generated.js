// GENERATED FRAGMENT — extracted from out/main/index.js, lines 5420-5529.
// Original module marker: src/main/windows/taskbarWindow.ts. Not the original TypeScript/TSX source.
// Depends on bundle-level imports, globals, and other fragments; not standalone.
var GAP = 8;
var TaskbarWindow = class {
	settings;
	win = null;
	shell = null;
	lastBounds = "";
	constructor(settings) {
		this.settings = settings;
	}
	apply(s) {
		this.settings = s;
		if (!s.taskbar.enabled) {
			this.close();
			return;
		}
		this.place();
	}
	onShell(info) {
		this.shell = info;
		if (this.settings.taskbar.enabled) this.place();
		if (this.win && !this.win.isDestroyed()) this.win.webContents.send(IPC.shellInfo, info);
	}
	close() {
		this.win?.destroy();
		this.win = null;
		this.lastBounds = "";
	}
	place() {
		const info = this.shell;
		const bar = info?.bar;
		if (!info || !bar || info.fullscreen) {
			this.win?.hide();
			return;
		}
		const tl = electron.screen.screenToDipPoint({
			x: bar[0],
			y: bar[1]
		});
		const br = electron.screen.screenToDipPoint({
			x: bar[2],
			y: bar[3]
		});
		const height = br.y - tl.y;
		if (height <= 0 || height > br.x - tl.x) {
			this.win?.hide();
			return;
		}
		let right = br.x - 160;
		if (info.tray && info.tray[0] > bar[0] + 200) right = electron.screen.screenToDipPoint({
			x: info.tray[0],
			y: info.tray[1]
		}).x;
		const { width } = taskbarMetrics(this.settings.taskbar.fontSize);
		const bounds = {
			x: Math.round(right - width - GAP + this.settings.taskbar.offsetX),
			y: Math.round(tl.y),
			width,
			height: Math.round(height)
		};
		const win = this.ensureWindow();
		const key = JSON.stringify(bounds);
		if (key !== this.lastBounds) {
			win.setBounds(bounds);
			this.lastBounds = key;
		}
		if (!win.isVisible()) win.showInactive();
		win.moveTop();
	}
	ensureWindow() {
		if (this.win && !this.win.isDestroyed()) return this.win;
		const win = new electron.BrowserWindow({
			width: taskbarMetrics(this.settings.taskbar.fontSize).width,
			height: 48,
			frame: false,
			transparent: true,
			backgroundColor: "#00000000",
			resizable: false,
			minimizable: false,
			maximizable: false,
			fullscreenable: false,
			skipTaskbar: true,
			focusable: false,
			alwaysOnTop: true,
			hasShadow: false,
			show: false,
			type: "toolbar",
			title: "SysMonitor 任务栏",
			webPreferences: {
				preload: (0, path.join)(__dirname, "../preload/index.js"),
				contextIsolation: true,
				nodeIntegration: false,
				sandbox: true
			}
		});
		this.win = win;
		win.setAlwaysOnTop(true, "screen-saver");
		win.setIgnoreMouseEvents(true);
		win.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
		win.webContents.on("will-navigate", (e) => e.preventDefault());
		win.webContents.on("did-finish-load", () => {
			if (this.shell && !win.isDestroyed()) win.webContents.send(IPC.shellInfo, this.shell);
		});
		win.on("closed", () => {
			if (this.win === win) this.win = null;
		});
		if (process.env["ELECTRON_RENDERER_URL"]) win.loadURL(`${process.env["ELECTRON_RENDERER_URL"]}#/taskbar`);
		else win.loadFile((0, path.join)(__dirname, "../renderer/index.html"), { hash: "/taskbar" });
		return win;
	}
};
