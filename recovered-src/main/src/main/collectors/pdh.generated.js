// GENERATED FRAGMENT — extracted from out/main/index.js, lines 2223-2304.
// Original module marker: src/main/collectors/pdh.ts. Not the original TypeScript/TSX source.
// Depends on bundle-level imports, globals, and other fragments; not standalone.
function scriptPath() {
	return electron.app.isPackaged ? (0, path.join)(process.resourcesPath, "pdh-sampler.ps1") : (0, path.join)(electron.app.getAppPath(), "resources", "pdh-sampler.ps1");
}
var PdhSampler = class {
	onSample;
	onFast;
	onShell;
	onNvme;
	proc = null;
	stopped = true;
	retryTimer = null;
	interval = 1e3;
	fast = 200;
	constructor(onSample, onFast, onShell, onNvme) {
		this.onSample = onSample;
		this.onFast = onFast;
		this.onShell = onShell;
		this.onNvme = onNvme;
	}
	start(intervalMs, fastMs) {
		this.interval = intervalMs;
		this.fast = fastMs;
		this.stopped = false;
		this.spawnProc();
	}
	restart(intervalMs, fastMs) {
		this.stop();
		this.start(intervalMs, fastMs);
	}
	stop() {
		this.stopped = true;
		if (this.retryTimer) clearTimeout(this.retryTimer);
		this.retryTimer = null;
		this.proc?.kill();
		this.proc = null;
	}
	spawnProc() {
		const proc = (0, child_process.spawn)("powershell.exe", [
			"-NoProfile",
			"-NonInteractive",
			"-ExecutionPolicy",
			"Bypass",
			"-File",
			scriptPath(),
			"-IntervalMs",
			String(this.interval),
			"-FastMs",
			String(this.fast)
		], {
			windowsHide: true,
			stdio: [
				"ignore",
				"pipe",
				"pipe"
			]
		});
		this.proc = proc;
		try {
			if (proc.pid) (0, os.setPriority)(proc.pid, os.constants.priority.PRIORITY_ABOVE_NORMAL);
		} catch {}
		(0, readline.createInterface)({ input: proc.stdout }).on("line", (line) => {
			try {
				const j = JSON.parse(line);
				if (j.k === "p") this.onFast(j);
				else if (j.k === "s") this.onShell(j);
				else if (j.k === "n") this.onNvme(j.drives ?? []);
				else this.onSample(j);
			} catch {}
		});
		let lastErr = "";
		proc.stderr.on("data", (d) => {
			lastErr = d.toString().slice(0, 400);
		});
		proc.on("exit", (code) => {
			if (this.proc !== proc) return;
			this.proc = null;
			if (this.stopped) return;
			console.error(`[pdh] 采集进程退出 code=${code} ${lastErr}`);
			this.retryTimer = setTimeout(() => this.spawnProc(), 3e3);
		});
	}
};
