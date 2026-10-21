// GENERATED FRAGMENT — extracted from out/main/index.js, lines 1835-2001.
// Original module marker: src/main/collectors/storage.ts. Not the original TypeScript/TSX source.
// Depends on bundle-level imports, globals, and other fragments; not standalone.
var DRIVE_RE = /^\/(nvme|ssd|hdd)\/\d+\//;
var UNIT_BYTES = 512e3;
var GIB_TO_GB = 1024 ** 3 / 1e9;
var norm$1 = (s) => s.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
var BY_NAME = [
	[
		"tempC",
		"Temperature",
		["Composite Temperature", "Temperature"]
	],
	[
		"warnTempC",
		"Temperature",
		["Warning Temperature"]
	],
	[
		"critTempC",
		"Temperature",
		["Critical Temperature"]
	],
	[
		"percentUsed",
		"Level",
		["Percentage Used"]
	],
	[
		"availableSpare",
		"Level",
		["Available Spare"]
	],
	[
		"spareThreshold",
		"Level",
		["Available Spare Threshold"]
	],
	[
		"powerOnHours",
		"Factor",
		["Power On Hours"]
	],
	[
		"powerOnCount",
		"Factor",
		["Power On Count", "Power Cycle Count"]
	],
	[
		"readGB",
		"Data",
		["Data Read", "Total Bytes Read"]
	],
	[
		"writtenGB",
		"Data",
		["Data Written", "Total Bytes Written"]
	]
];
var toGB = (v, unit) => unit === "TB" ? v * 1e3 : unit === "MB" ? v / 1e3 : v;
function emptyHealth(name) {
	return {
		name,
		readOk: true,
		tempKey: null,
		tempC: null,
		warnTempC: null,
		critTempC: null,
		percentUsed: null,
		availableSpare: null,
		spareThreshold: null,
		powerOnHours: null,
		powerOnCount: null,
		readGB: null,
		writtenGB: null,
		criticalWarning: null,
		mediaErrors: null,
		unsafeShutdowns: null,
		errorLogEntries: null
	};
}
function buildOne(name, list) {
	const h = emptyHealth(name);
	for (const [field, type, names] of BY_NAME) for (const n of names) {
		const s = list.find((x) => x.type === type && x.name === n && x.value != null);
		if (!s) continue;
		h[field] = field === "readGB" || field === "writtenGB" ? toGB(s.value, s.unit) : s.value;
		if (field === "tempC") h.tempKey = `lhm:${s.id}`;
		break;
	}
	return h;
}
function applySmart(h, r) {
	h.criticalWarning = r.w;
	h.mediaErrors = r.m;
	h.unsafeShutdowns = r.us;
	h.errorLogEntries = r.e;
	h.readGB = r.r * UNIT_BYTES / 1e9;
	h.writtenGB = r.wr * UNIT_BYTES / 1e9;
	h.tempC ??= r.tk > 0 ? r.tk - 273.15 : null;
	h.percentUsed ??= r.u;
	h.availableSpare ??= r.s;
	h.spareThreshold ??= r.st;
	h.powerOnHours ??= r.h;
	h.powerOnCount ??= r.c;
}
var consistent = (h, r) => h.powerOnCount == null || Math.abs(h.powerOnCount - r.c) <= 2;
var DIMM_RE = /^\/memory\/dimm\/\d+\/temperature\/(\d+)$/;
function readDimms(sensors) {
	const byName = /* @__PURE__ */ new Map();
	for (const s of sensors) {
		if (!DIMM_RE.test(s.id) || !s.hardware) continue;
		const d = byName.get(s.hardware) ?? {
			name: s.hardware,
			tempC: null,
			highLimitC: null,
			critLimitC: null,
			tempKey: null
		};
		if (/\/temperature\/0$/.test(s.id)) {
			d.tempC = s.value;
			d.tempKey = `lhm:${s.id}`;
		} else if (s.name === "Thermal Sensor High Limit") d.highLimitC = s.value;
		else if (s.name === "Thermal Sensor Critical High Limit") d.critLimitC = s.value;
		byName.set(s.hardware, d);
	}
	return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));
}
var MISSING_MS = 6e4;
var StorageHealthTracker = class {
	lastSeen = /* @__PURE__ */ new Map();
	update(sensors, lhmOnline, now = Date.now(), smart = []) {
		const byDrive = /* @__PURE__ */ new Map();
		for (const s of sensors) {
			if (!DRIVE_RE.test(s.id) || !s.hardware) continue;
			const list = byDrive.get(s.hardware) ?? [];
			list.push(s);
			byDrive.set(s.hardware, list);
		}
		const smartBy = new Map(smart.map((s) => [norm$1(s.name), s]));
		const lhmNames = new Set([...byDrive.keys()].map(norm$1));
		const out = [];
		for (const [name, list] of byDrive) {
			const h = buildOne(name, list);
			const s = smartBy.get(norm$1(name));
			if (s && consistent(h, s.raw)) applySmart(h, s.raw);
			else if (h.tempKey?.startsWith("lhm:/nvme/")) {
				if (h.readGB != null) h.readGB *= GIB_TO_GB;
				if (h.writtenGB != null) h.writtenGB *= GIB_TO_GB;
			}
			out.push(h);
			this.lastSeen.set(name, now);
		}
		for (const s of smart) {
			if (lhmNames.has(norm$1(s.name))) continue;
			const h = emptyHealth(s.name);
			applySmart(h, s.raw);
			out.push(h);
			this.lastSeen.set(s.name, now);
		}
		if (lhmOnline) for (const [name, seen] of this.lastSeen) {
			if (byDrive.has(name) || smartBy.has(norm$1(name))) continue;
			out.push({
				...emptyHealth(name),
				readOk: now - seen < MISSING_MS
			});
		}
		return out;
	}
};
