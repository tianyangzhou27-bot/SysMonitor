// GENERATED FRAGMENT — extracted from out/main/index.js, lines 5348-5405.
// Original module marker: src/main/windows/mainWindow.ts. Not the original TypeScript/TSX source.
// Depends on bundle-level imports, globals, and other fragments; not standalone.
var registered = false;
function registerWindowIpc() {
	if (registered) return;
	registered = true;
	const fromEvent = (e) => electron.BrowserWindow.fromWebContents(e.sender);
	electron.ipcMain.on(IPC.winMinimize, (e) => fromEvent(e)?.minimize());
	electron.ipcMain.on(IPC.winToggleMaximize, (e) => {
		const w = fromEvent(e);
		if (!w) return;
		if (w.isMaximized()) w.unmaximize();
		else w.maximize();
	});
	electron.ipcMain.on(IPC.winClose, (e) => fromEvent(e)?.close());
	electron.ipcMain.handle(IPC.winIsMaximized, (e) => fromEvent(e)?.isMaximized() ?? false);
}
function createMainWindow(opts) {
	registerWindowIpc();
	const win = new electron.BrowserWindow({
		width: 1180,
		height: 780,
		minWidth: 860,
		minHeight: 600,
		show: false,
		frame: false,
		icon: opts.icon,
		backgroundColor: "#00000000",
		backgroundMaterial: "acrylic",
		title: "SysMonitor",
		webPreferences: {
			preload: (0, path.join)(__dirname, "../preload/index.js"),
			contextIsolation: true,
			nodeIntegration: false,
			sandbox: true
		}
	});
	win.once("ready-to-show", () => {
		if (!opts.startHidden) win.show();
	});
	win.on("close", (e) => {
		if (!opts.isQuitting() && opts.closeToTray()) {
			e.preventDefault();
			win.hide();
		}
	});
	const notifyMaximized = () => win.webContents.send(IPC.winMaximizedChanged, win.isMaximized());
	win.on("maximize", notifyMaximized);
	win.on("unmaximize", notifyMaximized);
	win.webContents.setWindowOpenHandler(({ url }) => {
		if (url.startsWith("https://")) electron.shell.openExternal(url);
		return { action: "deny" };
	});
	win.webContents.on("will-navigate", (e, url) => {
		if (url !== win.webContents.getURL()) e.preventDefault();
	});
	if (process.env["ELECTRON_RENDERER_URL"]) win.loadURL(process.env["ELECTRON_RENDERER_URL"]);
	else win.loadFile((0, path.join)(__dirname, "../renderer/index.html"));
	return win;
}
