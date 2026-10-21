// GENERATED FRAGMENT — extracted from out/main/index.js, lines 4978-5287.
// Original module marker: src/main/settings.ts. Not the original TypeScript/TSX source.
// Depends on bundle-level imports, globals, and other fragments; not standalone.
var DEFAULT_SETTINGS = {
	refreshMs: 1e3,
	powerRefreshMs: 200,
	otherWatts: 60,
	closeToTray: true,
	autoStart: false,
	taskbar: {
		enabled: true,
		offsetX: 0,
		fontSize: 16,
		showCpu: true,
		showGpu: true,
		showMem: true,
		showNet: true,
		showPower: true
	},
	alerts: {
		enabled: true,
		sustainSec: 10,
		cooldownMin: 5,
		cpuUsage: 90,
		gpuUsage: 95,
		cpuTemp: 90,
		gpuTemp: 85,
		ssdTemp: 70,
		memUsage: 92,
		commitUsage: 90,
		diskUsage: 95,
		power: 600,
		netLatencyMs: 300,
		procCpu: 50
	},
	history: {
		enabled: true,
		rawHours: 24,
		minuteDays: 7,
		eventDays: 30,
		maxMB: 500
	},
	cooling: defaultCooling(),
	psu: {
		brand: "",
		maker: "",
		model: "",
		efficiency: "",
		ratedW: null
	},
	diag: {
		enabled: true,
		sensitivity: "standard"
	},
	frames: {
		enabled: true,
		mode: "fullscreen"
	}
};
var REFRESH = [
	500,
	1e3,
	2e3
];
var POWER_REFRESH = [
	200,
	500,
	1e3
];
var FAN_ID_RE = /^\/(lpc|gpu-[a-z]+)\/[\w-]+(\/\d+)?\/fan\/\d+$/;
var SENSOR_ID_RE = /^\/[\w-]+(\/[\w-]+){2,4}$/;
var FAN_ROLES = [
	"cpu",
	"case",
	"pump",
	"none",
	"unset"
];
function sanitizeCooling(raw, base) {
	const r = raw ?? {};
	const roles = {};
	for (const [k, v] of Object.entries(r.roles ?? {}).slice(0, 64)) if (FAN_ID_RE.test(k) && FAN_ROLES.includes(v) && v !== "unset") roles[k] = v;
	const names = {};
	for (const [k, v] of Object.entries(r.names ?? {}).slice(0, 128)) {
		const name = typeof v === "string" ? v.trim().slice(0, 40) : "";
		if (SENSOR_ID_RE.test(k) && name) names[k] = name;
	}
	const spun = Array.isArray(r.spun) ? [...new Set(r.spun.filter((x) => typeof x === "string" && FAN_ID_RE.test(x)))].slice(0, 64) : base.spun;
	const ackedRaw = r.acked ?? {};
	const acked = {
		cpu: ackedRaw.cpu === true,
		case: ackedRaw.case === true,
		gpu: ackedRaw.gpu === true
	};
	return {
		roles,
		names,
		spun,
		groups: sanitizeGroups(r.groups, base.groups),
		acked
	};
}
function sanitizeGroups(raw, base) {
	const defaults = defaultGroups();
	const r = raw ?? {};
	const out = {};
	for (const key of GROUP_KEYS) {
		const g = r[key] ?? {};
		const mode = g.mode === "auto" || g.mode === "manual" ? g.mode : "bios";
		const manualLevel = Math.round(num(g.manualLevel, 1, 5, base[key].manualLevel));
		const given = Array.isArray(g.levels) && g.levels.length === 5 ? g.levels : null;
		const levels = defaults[key].levels.map((d, i) => {
			const l = given?.[i];
			return {
				from: i === 0 ? 0 : Math.round(num(l?.from, 20, 100, d.from)),
				pct: key === "gpu" && i === 0 ? null : Math.round(num(l?.pct, FLOOR_PCT[key], 100, d.pct))
			};
		});
		for (let i = 1; i < 5; i++) {
			if (levels[i].from <= levels[i - 1].from) levels[i].from = Math.min(100, levels[i - 1].from + 1);
			const prev = levels[i - 1].pct;
			if (prev != null && levels[i].pct != null && levels[i].pct < prev) levels[i].pct = prev;
		}
		out[key] = {
			mode,
			manualLevel,
			levels
		};
	}
	return out;
}
var num = (v, lo, hi, fallback) => typeof v === "number" && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : fallback;
var bool = (v, fallback) => typeof v === "boolean" ? v : fallback;
function sanitize(raw, base) {
	const r = raw ?? {};
	const t = r.taskbar ?? {};
	const a = r.alerts ?? {};
	const h = r.history ?? {};
	const bt = base.taskbar;
	const ba = base.alerts;
	const bh = base.history;
	return {
		refreshMs: REFRESH.includes(r.refreshMs) ? r.refreshMs : base.refreshMs,
		powerRefreshMs: POWER_REFRESH.includes(r.powerRefreshMs) ? r.powerRefreshMs : base.powerRefreshMs,
		otherWatts: num(r.otherWatts, 0, 500, base.otherWatts),
		closeToTray: bool(r.closeToTray, base.closeToTray),
		autoStart: bool(r.autoStart, base.autoStart),
		taskbar: {
			enabled: bool(t.enabled, bt.enabled),
			offsetX: num(t.offsetX, -600, 600, bt.offsetX),
			fontSize: Math.round(num(t.fontSize, 11, 17, bt.fontSize)),
			showCpu: bool(t.showCpu, bt.showCpu),
			showGpu: bool(t.showGpu, bt.showGpu),
			showMem: bool(t.showMem, bt.showMem),
			showNet: bool(t.showNet, bt.showNet),
			showPower: bool(t.showPower, bt.showPower)
		},
		alerts: {
			enabled: bool(a.enabled, ba.enabled),
			sustainSec: num(a.sustainSec, 1, 600, ba.sustainSec),
			cooldownMin: num(a.cooldownMin, 1, 240, ba.cooldownMin),
			cpuUsage: num(a.cpuUsage, 10, 100, ba.cpuUsage),
			gpuUsage: num(a.gpuUsage, 10, 100, ba.gpuUsage),
			cpuTemp: num(a.cpuTemp, 30, 120, ba.cpuTemp),
			gpuTemp: num(a.gpuTemp, 30, 120, ba.gpuTemp),
			ssdTemp: num(a.ssdTemp, 30, 100, ba.ssdTemp),
			memUsage: num(a.memUsage, 10, 100, ba.memUsage),
			commitUsage: num(a.commitUsage, 10, 100, ba.commitUsage),
			diskUsage: num(a.diskUsage, 50, 100, ba.diskUsage),
			power: num(a.power, 50, 2e3, ba.power),
			netLatencyMs: num(a.netLatencyMs, 20, 5e3, ba.netLatencyMs),
			procCpu: num(a.procCpu, 5, 100, ba.procCpu)
		},
		history: {
			enabled: bool(h.enabled, bh.enabled),
			rawHours: Math.round(num(h.rawHours, 1, 72, bh.rawHours)),
			minuteDays: Math.round(num(h.minuteDays, 1, 90, bh.minuteDays)),
			eventDays: Math.round(num(h.eventDays, 1, 365, bh.eventDays)),
			maxMB: Math.round(num(h.maxMB, 50, 5e3, bh.maxMB))
		},
		cooling: sanitizeCooling(r.cooling, base.cooling),
		psu: sanitizePsu(r.psu),
		diag: sanitizeDiag(r.diag, base.diag),
		frames: sanitizeFrames(r.frames, base.frames)
	};
}
function sanitizeFrames(raw, base) {
	const r = raw ?? {};
	return {
		enabled: bool(r.enabled, base.enabled),
		mode: r.mode === "always" || r.mode === "fullscreen" ? r.mode : base.mode
	};
}
var SENSITIVITIES = [
	"conservative",
	"standard",
	"sensitive"
];
function sanitizeDiag(raw, base) {
	const r = raw ?? {};
	return {
		enabled: bool(r.enabled, base.enabled),
		sensitivity: SENSITIVITIES.includes(r.sensitivity) ? r.sensitivity : base.sensitivity
	};
}
var shortText = (v) => typeof v === "string" ? v.trim().slice(0, 60) : "";
function sanitizePsu(raw) {
	const r = raw ?? {};
	const w = typeof r.ratedW === "number" && Number.isFinite(r.ratedW) ? Math.round(r.ratedW) : null;
	return {
		brand: shortText(r.brand),
		maker: shortText(r.maker),
		model: shortText(r.model),
		efficiency: shortText(r.efficiency),
		ratedW: w != null && w >= 100 && w <= 3e3 ? w : null
	};
}
var SettingsStore = class {
	value = DEFAULT_SETTINGS;
	file = "";
	saveTimer = null;
	listeners = [];
	load() {
		this.file = (0, path.join)(electron.app.getPath("userData"), "settings.json");
		try {
			this.value = sanitize(JSON.parse(fs.readFileSync(this.file, "utf8")), DEFAULT_SETTINGS);
		} catch {
			this.value = DEFAULT_SETTINGS;
		}
	}
	get() {
		return this.value;
	}
	onChange(cb) {
		this.listeners.push(cb);
	}
	patch(p) {
		const prev = this.value;
		const merged = {
			...prev,
			...p,
			taskbar: {
				...prev.taskbar,
				...p.taskbar
			},
			alerts: {
				...prev.alerts,
				...p.alerts
			},
			history: {
				...prev.history,
				...p.history
			},
			cooling: {
				roles: {
					...prev.cooling.roles,
					...p.cooling?.roles
				},
				names: {
					...prev.cooling.names,
					...p.cooling?.names
				},
				spun: p.cooling?.spun ?? prev.cooling.spun,
				groups: {
					cpu: {
						...prev.cooling.groups.cpu,
						...p.cooling?.groups?.cpu
					},
					case: {
						...prev.cooling.groups.case,
						...p.cooling?.groups?.case
					},
					gpu: {
						...prev.cooling.groups.gpu,
						...p.cooling?.groups?.gpu
					}
				},
				acked: {
					...prev.cooling.acked,
					...p.cooling?.acked
				}
			},
			psu: {
				...prev.psu,
				...p.psu
			},
			diag: {
				...prev.diag,
				...p.diag
			},
			frames: {
				...prev.frames,
				...p.frames
			}
		};
		this.value = sanitize(merged, prev);
		this.scheduleSave();
		for (const cb of this.listeners) cb(this.value, prev);
		return this.value;
	}
	flush() {
		if (this.saveTimer) clearTimeout(this.saveTimer);
		this.saveTimer = null;
		try {
			fs.mkdirSync(electron.app.getPath("userData"), { recursive: true });
			fs.writeFileSync(this.file, JSON.stringify(this.value, null, 2), "utf8");
		} catch {}
	}
	scheduleSave() {
		if (this.saveTimer) clearTimeout(this.saveTimer);
		this.saveTimer = setTimeout(() => this.flush(), 400);
	}
};
