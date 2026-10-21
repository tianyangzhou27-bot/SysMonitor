// GENERATED FRAGMENT — extracted from out/main/index.js, lines 1551-1731.
// Original module marker: src/main/frametime/monitor.ts. Not the original TypeScript/TSX source.
// Depends on bundle-level imports, globals, and other fragments; not standalone.
var START_DELAY_MS = 3e3;
var STOP_DELAY_MS = 15e3;
var RETRY_DENIED_MS = 6e4;
var RETRY_ERROR_MS = 1e4;
var SESSION = "SysMonitorFrames";
var OWN_NAMES = /^(electron|sysmonitor)(\.exe)?$/i;
var empty = (state, detail = null) => ({
	state,
	process: null,
	pid: null,
	fps: null,
	avgMs: null,
	maxMs: null,
	p99Ms: null,
	low1Fps: null,
	stutters10s: 0,
	stutterThresholdMs: null,
	detail
});
var FrameMonitor = class {
	exe;
	proc = null;
	agg = new FrameAggregator();
	wantSince = null;
	unwantedSince = null;
	state = "idle";
	detail = null;
	blockedUntil = 0;
	gotHeader = false;
	tracked = null;
	constructor(exe) {
		this.exe = exe;
	}
	/** 每次快照调用一次：决定要不要启动 / 停止采集，返回前台程序的帧时间统计 */
	update(cfg, shell, now = Date.now()) {
		if (!cfg.enabled) {
			this.stop();
			this.state = "off";
			return empty("off");
		}
		if (!(0, fs.existsSync)(this.exe)) {
			this.state = "missing";
			return empty("missing", `找不到帧时间采集程序：${this.exe}`);
		}
		const gameStillDrawing = this.proc != null && this.tracked != null && this.agg.isActive(this.tracked, now);
		if (cfg.mode === "always" ? shell.fgPid != null : shell.fullscreen || gameStillDrawing) {
			this.unwantedSince = null;
			this.wantSince ??= now;
			const delay = cfg.mode === "always" ? 0 : START_DELAY_MS;
			if (!this.proc && now >= this.blockedUntil && now - this.wantSince >= delay) this.start();
		} else {
			this.wantSince = null;
			this.unwantedSince ??= now;
			if (this.proc && now - this.unwantedSince >= STOP_DELAY_MS) this.stop();
		}
		if (this.state === "denied") return empty("denied", this.detail);
		if (this.state === "error") return empty("error", this.detail);
		if (!this.proc) return empty("idle");
		if (!this.gotHeader) return empty("starting");
		const fg = shell.fgPid;
		const fgName = fg != null ? this.agg.nameOf(fg) : null;
		let pid = null;
		let background = false;
		if (fg != null && fgName && !OWN_NAMES.test(fgName)) {
			pid = fg;
			this.tracked = fg;
		} else if (this.tracked != null && this.agg.isActive(this.tracked, now)) {
			pid = this.tracked;
			background = true;
		} else this.tracked = null;
		this.agg.prune(now, pid);
		const name = pid != null ? this.agg.nameOf(pid) : null;
		if (pid == null || !name) return {
			...empty("running"),
			detail: "前台程序没有在出画面帧"
		};
		const s = this.agg.stats(pid, now);
		if (!s) return {
			...empty("running"),
			process: name,
			pid,
			detail: "前台程序没有在出画面帧"
		};
		return {
			state: "running",
			process: name,
			pid,
			background,
			detail: null,
			...s
		};
	}
	stop() {
		const p = this.proc;
		this.proc = null;
		this.gotHeader = false;
		this.agg.clear();
		this.tracked = null;
		this.wantSince = null;
		if (p) {
			try {
				p.kill();
			} catch {}
			this.endSession();
		}
		if (this.state === "running" || this.state === "starting") this.state = "idle";
	}
	endSession() {
		try {
			(0, child_process.spawn)(this.exe, [
				"--session_name",
				SESSION,
				"--terminate_existing_session"
			], {
				windowsHide: true,
				stdio: "ignore"
			}).on("error", () => void 0);
		} catch {}
	}
	start() {
		this.state = "starting";
		this.detail = null;
		this.gotHeader = false;
		let stderr = "";
		const proc = (0, child_process.spawn)(this.exe, [
			"--output_stdout",
			"--no_console_stats",
			"--session_name",
			SESSION,
			"--stop_existing_session"
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
		let parse = null;
		(0, readline.createInterface)({ input: proc.stdout }).on("line", (line) => {
			if (!this.gotHeader) {
				parse = makeRowParser(line);
				if (parse) {
					this.gotHeader = true;
					this.state = "running";
				}
				return;
			}
			const r = parse?.(line);
			if (r) this.agg.add(r.pid, r.name, r.ms, Date.now());
		});
		proc.stderr.on("data", (d) => stderr = (stderr + d.toString()).slice(-600));
		proc.on("error", () => {
			if (this.proc !== proc) return;
			this.proc = null;
			this.state = "error";
			this.detail = "无法启动帧时间采集程序";
			this.blockedUntil = Date.now() + RETRY_ERROR_MS;
		});
		proc.on("exit", (code) => {
			if (this.proc !== proc) return;
			this.proc = null;
			this.gotHeader = false;
			this.agg.clear();
			this.tracked = null;
			if (/access denied/i.test(stderr)) {
				this.state = "denied";
				this.detail = "没有权限：需要把你的账户加入 Windows 的「Performance Log Users」用户组，然后注销重新登录";
				this.blockedUntil = Date.now() + RETRY_DENIED_MS;
			} else if (this.state !== "off") {
				this.state = "error";
				this.detail = `帧时间采集程序意外退出（代码 ${code}）`;
				this.blockedUntil = Date.now() + RETRY_ERROR_MS;
			}
		});
	}
};
