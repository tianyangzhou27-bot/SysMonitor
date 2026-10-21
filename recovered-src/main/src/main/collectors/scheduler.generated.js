// GENERATED FRAGMENT — extracted from out/main/index.js, lines 2945-3311.
// Original module marker: src/main/collectors/scheduler.ts. Not the original TypeScript/TSX source.
// Depends on bundle-level imports, globals, and other fragments; not standalone.
var clampPct = (v) => v == null ? null : Math.min(100, Math.max(0, v));
var norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
function speedOf(desc, map) {
	const n = norm(desc);
	if (!n || !map) return null;
	for (const [k, v] of Object.entries(map)) {
		const nk = norm(k);
		if (nk === n || nk.startsWith(n) && /^\d+$/.test(nk.slice(n.length))) return v;
	}
	return null;
}
var MetricsScheduler = class {
	latest = null;
	cpuInfo = null;
	volumes = [];
	diskTimer = null;
	pdh = new PdhSampler((raw) => this.onSample(raw), (fast) => this.onFast(fast), (shell) => this.onShell(shell), (drives) => this.nvme = drives);
	nvme = [];
	frames = new FrameMonitor(electron.app.isPackaged ? (0, path.join)(process.resourcesPath, "PresentMon.exe") : (0, path.join)(electron.app.getAppPath(), "vendor", "PresentMon", "PresentMon.exe"));
	framesCfg = {
		enabled: true,
		mode: "fullscreen"
	};
	shellState = {
		fullscreen: false,
		fgPid: null
	};
	cooling = new CoolingTracker();
	fanController = new FanController({ setControl: (id, pct) => this.lhm.setControl(id, pct) });
	coolingCfg = defaultCooling();
	spunListeners = [];
	lhm = new LhmClient();
	/** 发现有风扇第一次出现转速时通知，参数是全部「曾经转过」的风扇，用于存进设置 */
	onFanSpun(cb) {
		this.spunListeners.push(cb);
	}
	getCoolingSettings() {
		return this.coolingCfg;
	}
	/** 退出软件前调用：把软件正在控制的风扇全部交还主板 / 显卡 */
	releaseFans() {
		return this.fanController.releaseAll();
	}
	storage = new StorageHealthTracker();
	shellListeners = [];
	onShellInfo(cb) {
		this.shellListeners.push(cb);
	}
	smartDrives() {
		const disks = this.hardware.get().disks;
		const out = [];
		for (const raw of this.nvme) {
			const disk = disks.find((d) => d.deviceId === raw.i && d.model);
			if (disk?.model) out.push({
				name: disk.model,
				raw
			});
		}
		return out;
	}
	onShell(raw) {
		const info = {
			fullscreen: raw.fs === 1 || raw.qu === 3 || raw.qu === 4,
			bar: raw.bar,
			tray: raw.tray,
			brightness: raw.bright >= 0 ? raw.bright : null,
			fgPid: raw.fgpid != null && raw.fgpid > 0 ? raw.fgpid : null
		};
		this.shellState = {
			fullscreen: info.fullscreen,
			fgPid: info.fgPid
		};
		for (const cb of this.shellListeners) cb(info);
	}
	gpuSmi = new GpuSmi();
	gpuPower = new GpuPowerStream();
	gpuLimits = new GpuLimitPoller();
	network = new NetworkCollector();
	proxy = new ProxyCollector();
	quality = new QualityCollector(() => this.network.primaryGateway);
	hardware = new HardwareCollector();
	otherWatts = 60;
	wallSource = null;
	latestPower = null;
	latestCpuW = null;
	refreshMs = 1e3;
	powerMs = 200;
	listeners = [];
	enrichers = [];
	/** 在快照发给界面之前调用，用来补上依赖其他模块的字段（如诊断结果） */
	onBeforeSend(cb) {
		this.enrichers.push(cb);
	}
	onSnapshot(cb) {
		this.listeners.push(cb);
	}
	applySettings(s) {
		this.otherWatts = s.otherWatts;
		this.coolingCfg = s.cooling;
		this.framesCfg = s.frames;
		if (s.refreshMs !== this.refreshMs || s.powerRefreshMs !== this.powerMs) {
			this.refreshMs = s.refreshMs;
			this.powerMs = s.powerRefreshMs;
			this.pdh.restart(this.refreshMs, this.powerMs);
			this.gpuSmi.restart(this.refreshMs);
			this.gpuPower.restart(this.powerMs);
		}
	}
	setWallPowerSource(src) {
		this.wallSource = src;
	}
	getLatest() {
		return this.latest;
	}
	lookupRoute(hosts) {
		return this.proxy.clash.lookupRoute(hosts);
	}
	async start(s) {
		this.otherWatts = s.otherWatts;
		this.coolingCfg = s.cooling;
		this.framesCfg = s.frames;
		this.refreshMs = s.refreshMs;
		this.powerMs = s.powerRefreshMs;
		this.pdh.start(this.refreshMs, this.powerMs);
		this.gpuSmi.start(this.refreshMs);
		this.gpuPower.start(this.powerMs);
		this.gpuLimits.start();
		this.lhm.start();
		this.network.start();
		this.quality.start();
		this.proxy.start();
		this.hardware.start();
		this.cpuInfo = await readCpuInfo().catch(() => null);
		await this.refreshVolumes();
		this.diskTimer = setInterval(() => void this.refreshVolumes(), 3e4);
	}
	stop() {
		this.pdh.stop();
		this.gpuSmi.stop();
		this.gpuPower.stop();
		this.gpuLimits.stop();
		this.frames.stop();
		this.lhm.stop();
		this.network.stop();
		this.quality.stop();
		this.hardware.stop();
		this.proxy.stop();
		if (this.diskTimer) clearInterval(this.diskTimer);
		this.diskTimer = null;
	}
	async refreshVolumes() {
		try {
			this.volumes = await readVolumes();
		} catch {}
	}
	onFast(fast) {
		const pkgMw = fast.energy?.["RAPL_Package0_PKG"];
		this.latestCpuW = pkgMw != null ? pkgMw / 1e3 : null;
		const gpuW = this.gpuPower.watts ?? this.gpuSmi.latest?.powerW ?? null;
		const power = computePower(this.latestCpuW, gpuW, this.otherWatts, this.wallSource);
		this.latestPower = power;
		const live = {
			...power,
			t: fast.t
		};
		for (const win of electron.BrowserWindow.getAllWindows()) if (!win.isDestroyed()) win.webContents.send(IPC.powerLive, live);
	}
	buildPerf(raw) {
		const slowest = (m) => {
			const vals = Object.entries(m ?? {}).filter(([k]) => k !== "_Total").map(([, v]) => v);
			return vals.length > 0 ? Math.max(...vals) * 1e3 : null;
		};
		return {
			diskReadMs: slowest(raw.diskLatR),
			diskWriteMs: slowest(raw.diskLatW),
			diskQueue: raw.diskQ?.["_Total"] ?? null,
			hardFaultsPerSec: raw.hardFaults ?? null,
			processorQueue: raw.procQueue ?? null,
			perfLimitPct: raw.perfLimit ?? null,
			perfLimitFlags: raw.perfFlags ?? null,
			dpcPct: raw.dpc ?? null,
			interruptPct: raw.intr ?? null,
			gpuLimits: this.gpuLimits.latest
		};
	}
	buildCores(raw) {
		const info = this.cpuInfo;
		const rows = [];
		for (const [name, value] of Object.entries(raw.time)) {
			const m = /^(\d+),(\d+)$/.exec(name);
			if (!m) continue;
			const f = raw.freq[name];
			const p = raw.perf[name];
			rows.push({
				index: Number(m[1]) * 64 + Number(m[2]),
				usage: clampPct(value),
				freq: f != null && p != null ? f * p / 100 / 1e3 : null
			});
		}
		rows.sort((a, b) => a.index - b.index);
		const pThreads = info?.eCores != null ? Math.max(0, rows.length - info.eCores) : null;
		let pi = 0;
		let ei = 0;
		return rows.map((r) => {
			if (pThreads == null) return {
				index: r.index,
				kind: "unknown",
				label: `${r.index}`,
				usage: r.usage,
				freqGHz: r.freq
			};
			const isP = r.index < pThreads;
			return {
				index: r.index,
				kind: isP ? "P" : "E",
				label: isP ? `P${pi++}` : `E${ei++}`,
				usage: r.usage,
				freqGHz: r.freq
			};
		});
	}
	buildGpu(raw) {
		const smi = this.gpuSmi.latest;
		const sums = /* @__PURE__ */ new Map();
		for (const [name, v] of Object.entries(raw.gpuEng ?? {})) {
			const m = /_phys_(\d+)_eng_(\d+)_engtype_(\w+)/.exec(name);
			if (!m) continue;
			const key = `${m[1]}_${m[2]}_${m[3]}`;
			sums.set(key, (sums.get(key) ?? 0) + v);
		}
		const engineBusy = sums.size > 0 ? clampPct(Math.max(...sums.values())) : null;
		const dedicated = Object.values(raw.gpuMem ?? {});
		const shared = Object.values(raw.gpuShared ?? {});
		const memUsed = dedicated.length > 0 ? Math.max(...dedicated) : smi?.memUsedBytes ?? null;
		const memTotal = smi?.memTotalBytes ?? null;
		return {
			name: smi?.name ?? null,
			usage: engineBusy ?? clampPct(smi?.utilization),
			memUsedBytes: memUsed,
			memTotalBytes: memTotal,
			memPercent: memUsed != null && memTotal ? memUsed / memTotal * 100 : null,
			sharedUsedBytes: shared.length > 0 ? Math.max(...shared) : null,
			tempC: smi?.tempC ?? null,
			powerW: smi?.powerW ?? null,
			coreClockMHz: smi?.coreClockMHz ?? null
		};
	}
	buildNics(raw) {
		const primary = this.network.pickPrimary();
		return this.network.adapters.map((a) => {
			const tunnel = tunnelKind(a.name, a.desc);
			const kind = tunnel || a.virtual ? "virtual" : /802\.11/.test(a.mediaType) ? "wireless" : /802\.3/.test(a.mediaType) ? "wired" : "other";
			return {
				name: a.name,
				description: a.desc,
				kind,
				tunnel,
				isDefault: primary?.index === a.index,
				ip4: a.ip4,
				gateway: a.gateway,
				linkMbps: a.linkMbps,
				rxBytesPerSec: speedOf(a.desc, raw.netRx),
				txBytesPerSec: speedOf(a.desc, raw.netTx)
			};
		});
	}
	onSample(raw) {
		const nics = this.buildNics(raw);
		const primaryNic = nics.find((n) => n.isDefault) ?? null;
		const tunnels = nics.filter((n) => n.tunnel).map((n) => ({
			name: n.name,
			description: n.description,
			kind: n.tunnel,
			ip4: n.ip4,
			rxBytesPerSec: n.rxBytesPerSec,
			txBytesPerSec: n.txBytesPerSec
		}));
		const clash = this.proxy.clash.info;
		const info = this.cpuInfo;
		const total = (0, os.totalmem)();
		const avail = raw.memAvail;
		const used = avail != null ? total - avail : null;
		const totalFreq = raw.freq["_Total"] != null && raw.perf["_Total"] != null ? raw.freq["_Total"] * raw.perf["_Total"] / 100 / 1e3 : null;
		const { snapshot: coolingSnap, newlySpun } = this.cooling.update(this.lhm.list(), this.coolingCfg, this.lhm.isOnline(), this.lhm.cpuTemp());
		if (newlySpun.length > 0) {
			this.coolingCfg = {
				...this.coolingCfg,
				spun: [...this.coolingCfg.spun, ...newlySpun]
			};
			for (const cb of this.spunListeners) cb(this.coolingCfg.spun);
		}
		coolingSnap.groups = this.fanController.update(coolingSnap, this.coolingCfg, this.lhm.isOnline());
		const gpu = this.buildGpu(raw);
		const power = this.latestPower ?? computePower(this.latestCpuW, gpu.powerW, this.otherWatts, this.wallSource);
		const snap = {
			ts: raw.t,
			lhmOnline: this.lhm.isOnline(),
			frames: this.frames.update(this.framesCfg, this.shellState),
			perf: this.buildPerf(raw),
			diagnosis: {
				enabled: false,
				checks: [],
				active: []
			},
			storage: this.storage.update(this.lhm.list(), this.lhm.isOnline(), Date.now(), this.smartDrives()),
			dimms: readDimms(this.lhm.list()),
			cooling: coolingSnap,
			quality: this.quality.get(),
			hardware: this.hardware.get(),
			power,
			cpu: {
				model: info?.model ?? null,
				physicalCores: info?.physicalCores ?? null,
				logicalCores: info?.logicalCores ?? null,
				usage: clampPct(raw.time["_Total"]),
				freqGHz: totalFreq,
				baseGHz: info?.baseGHz ?? null,
				cores: this.buildCores(raw),
				tempC: this.lhm.cpuTemp(),
				packagePowerW: this.latestCpuW
			},
			gpu,
			processes: buildProcessMetrics(raw, info?.logicalCores ?? (0, os.cpus)().length, this.proxy.clash.appRates, this.proxy.connCounts),
			network: {
				reach: this.network.reach,
				primary: primaryNic,
				rxBytesPerSec: primaryNic?.rxBytesPerSec ?? null,
				txBytesPerSec: primaryNic?.txBytesPerSec ?? null,
				dns: this.network.pickPrimary()?.dns ?? [],
				gatewayLatencyMs: this.network.gatewayLatencyMs,
				internetLatencyMs: this.network.internetLatencyMs,
				wifi: this.network.wifi,
				nics,
				publicIp: this.network.publicIp
			},
			proxy: {
				route: describeRoute({
					tunnels,
					systemProxy: this.proxy.systemProxy,
					clients: this.proxy.clients,
					clash
				}),
				clients: this.proxy.clients,
				tunnels,
				systemProxy: this.proxy.systemProxy,
				clash
			},
			memory: {
				totalBytes: total,
				usedBytes: used,
				usagePercent: used != null ? used / total * 100 : null,
				committedBytes: raw.memCommit,
				commitLimitBytes: raw.memLimit
			},
			disk: {
				volumes: this.volumes,
				readBytesPerSec: raw.diskR["_Total"] ?? null,
				writeBytesPerSec: raw.diskW["_Total"] ?? null,
				busyPercent: clampPct(raw.diskT["_Total"])
			}
		};
		for (const cb of this.enrichers) cb(snap);
		this.latest = snap;
		for (const win of electron.BrowserWindow.getAllWindows()) if (!win.isDestroyed()) win.webContents.send(IPC.metricsSnapshot, snap);
		for (const cb of this.listeners) cb(snap);
	}
};
