// GENERATED FRAGMENT — extracted from out/main/index.js, lines 441-649.
// Original module marker: src/main/collectors/gpuSmi.ts. Not the original TypeScript/TSX source.
// Depends on bundle-level imports, globals, and other fragments; not standalone.
var MIB = 1048576;
function num$3(s) {
	if (s == null) return null;
	const v = Number.parseFloat(s);
	return Number.isFinite(v) ? v : null;
}
var mib = (s) => {
	const v = num$3(s);
	return v == null ? null : v * MIB;
};
var GpuPowerStream = class {
	watts = null;
	proc = null;
	stopped = true;
	retryTimer = null;
	start(intervalMs) {
		this.stopped = false;
		const proc = (0, child_process.spawn)("nvidia-smi", [
			"--query-gpu=power.draw",
			"--format=csv,noheader,nounits",
			"-lms",
			String(intervalMs)
		], {
			windowsHide: true,
			stdio: [
				"ignore",
				"pipe",
				"ignore"
			]
		});
		this.proc = proc;
		(0, readline.createInterface)({ input: proc.stdout }).on("line", (line) => {
			this.watts = num$3(line.trim());
		});
		const retry = (ms) => {
			if (this.stopped || this.retryTimer) return;
			this.retryTimer = setTimeout(() => {
				this.retryTimer = null;
				this.start(intervalMs);
			}, ms);
		};
		proc.on("error", () => {
			if (this.proc !== proc) return;
			this.proc = null;
			this.watts = null;
			retry(3e4);
		});
		proc.on("exit", () => {
			if (this.proc !== proc) return;
			this.proc = null;
			retry(5e3);
		});
	}
	restart(intervalMs) {
		this.stop();
		this.start(intervalMs);
	}
	stop() {
		this.stopped = true;
		if (this.retryTimer) clearTimeout(this.retryTimer);
		this.retryTimer = null;
		this.proc?.kill();
		this.proc = null;
	}
};
var GpuSmi = class {
	latest = null;
	proc = null;
	stopped = true;
	retryTimer = null;
	interval = 1e3;
	start(intervalMs) {
		this.interval = intervalMs;
		this.stopped = false;
		this.spawnProc();
	}
	restart(intervalMs) {
		this.stop();
		this.start(intervalMs);
	}
	stop() {
		this.stopped = true;
		if (this.retryTimer) clearTimeout(this.retryTimer);
		this.retryTimer = null;
		this.proc?.kill();
		this.proc = null;
	}
	scheduleRetry(ms) {
		if (this.stopped || this.retryTimer) return;
		this.retryTimer = setTimeout(() => {
			this.retryTimer = null;
			this.spawnProc();
		}, ms);
	}
	spawnProc() {
		const proc = (0, child_process.spawn)("nvidia-smi", [
			"--query-gpu=name,utilization.gpu,memory.used,memory.total,temperature.gpu,power.draw,clocks.gr",
			"--format=csv,noheader,nounits",
			"-lms",
			String(this.interval)
		], {
			windowsHide: true,
			stdio: [
				"ignore",
				"pipe",
				"ignore"
			]
		});
		this.proc = proc;
		(0, readline.createInterface)({ input: proc.stdout }).on("line", (line) => {
			const f = line.split(",").map((s) => s.trim());
			if (f.length < 7) return;
			this.latest = {
				name: f[0] || null,
				utilization: num$3(f[1]),
				memUsedBytes: mib(f[2]),
				memTotalBytes: mib(f[3]),
				tempC: num$3(f[4]),
				powerW: num$3(f[5]),
				coreClockMHz: num$3(f[6])
			};
		});
		proc.on("error", () => {
			if (this.proc !== proc) return;
			this.proc = null;
			this.latest = null;
			this.scheduleRetry(3e4);
		});
		proc.on("exit", () => {
			if (this.proc !== proc) return;
			this.proc = null;
			this.scheduleRetry(5e3);
		});
	}
};
var LIMIT_FIELDS = [
	"sw_power_cap",
	"hw_slowdown",
	"hw_thermal_slowdown",
	"sw_thermal_slowdown",
	"hw_power_brake_slowdown"
];
var LIMIT_PREFIXES = ["clocks_event_reasons", "clocks_throttle_reasons"];
function parseLimits(line) {
	const f = line.split(",").map((s) => s.trim().toLowerCase());
	if (f.length < LIMIT_FIELDS.length || f.some((v) => v !== "active" && v !== "not active")) return null;
	const on = (i) => f[i] === "active";
	return {
		powerCap: on(0),
		hwSlowdown: on(1),
		hwThermal: on(2),
		swThermal: on(3),
		powerBrake: on(4)
	};
}
/** 每 2 秒查一次显卡的降频原因；两种字段名都不支持时停止查询 */
var GpuLimitPoller = class {
	latest = null;
	timer = null;
	prefix = 0;
	busy = false;
	start() {
		this.stop();
		this.poll();
		this.timer = setInterval(() => void this.poll(), 2e3);
	}
	stop() {
		if (this.timer) clearInterval(this.timer);
		this.timer = null;
	}
	poll() {
		if (this.busy || this.prefix >= LIMIT_PREFIXES.length) return Promise.resolve();
		this.busy = true;
		const p = LIMIT_PREFIXES[this.prefix];
		const query = LIMIT_FIELDS.map((f) => `${p}.${f}`).join(",");
		return new Promise((resolve) => {
			let out = "";
			const proc = (0, child_process.spawn)("nvidia-smi", [`--query-gpu=${query}`, "--format=csv,noheader,nounits"], {
				windowsHide: true,
				stdio: [
					"ignore",
					"pipe",
					"ignore"
				]
			});
			const done = (ok) => {
				this.busy = false;
				if (!ok) {
					this.latest = null;
					this.prefix += 1;
					if (this.prefix >= LIMIT_PREFIXES.length) this.stop();
				}
				resolve();
			};
			proc.stdout.on("data", (d) => out += d.toString());
			proc.on("error", () => {
				this.busy = false;
				this.latest = null;
				this.stop();
				resolve();
			});
			proc.on("close", (code) => {
				const parsed = code === 0 ? parseLimits(out.split(/\r?\n/)[0] ?? "") : null;
				if (parsed) this.latest = parsed;
				done(parsed != null);
			});
		});
	}
};
