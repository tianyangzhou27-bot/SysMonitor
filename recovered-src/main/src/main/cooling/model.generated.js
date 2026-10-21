// GENERATED FRAGMENT — extracted from out/main/index.js, lines 1734-1832.
// Original module marker: src/main/cooling/model.ts. Not the original TypeScript/TSX source.
// Depends on bundle-level imports, globals, and other fragments; not standalone.
var SPIN_RPM = 200;
var STALL_MS = 3e4;
var LOW_DUTY = 20;
var GPU_IDLE_C = 55;
var FAN_RE = /^\/(lpc|gpu-[a-z]+)\/[\w-]+(\/\d+)?\/fan\/\d+$/;
var controlIdOf = (fanId) => fanId.replace(/\/fan\/(\d+)$/, "/control/$1");
function emptyCooling() {
	return {
		groups: [],
		fans: [],
		temps: [],
		volts: [],
		cpuTempC: null,
		gpuTempC: null
	};
}
function fanStatus(i) {
	if (!i.lhmOnline || i.rpm == null) return "unreadable";
	if (i.rpm >= SPIN_RPM) return "ok";
	if (i.role === "none") return "unplugged";
	if (i.source === "gpu") {
		if (i.gpuTempC == null || i.gpuTempC < GPU_IDLE_C) return "stopped-mode";
		return i.zeroForMs >= STALL_MS ? "suspect-stalled" : "ok";
	}
	if (!i.everSpun) return "unplugged";
	if (i.controlPct != null && i.controlPct < LOW_DUTY) return "stopped-mode";
	return i.zeroForMs >= STALL_MS ? "suspect-stalled" : "ok";
}
var byName = (a, b) => a.id.localeCompare(b.id, void 0, { numeric: true });
var CoolingTracker = class {
	zeroSince = /* @__PURE__ */ new Map();
	/** 返回快照，以及这次新发现「曾经转过」的风扇（由调用方存进设置） */
	update(sensors, cfg, lhmOnline, cpuTempC, now = Date.now()) {
		if (!lhmOnline) {
			this.zeroSince.clear();
			return {
				snapshot: emptyCooling(),
				newlySpun: []
			};
		}
		const byId = new Map(sensors.map((s) => [s.id, s]));
		const gpuValues = sensors.filter((s) => s.type === "Temperature" && /^\/gpu-/.test(s.id) && (s.name === "GPU Core" || s.name === "GPU Hot Spot")).map((s) => s.value).filter((v) => v != null);
		const gpuTempC = gpuValues.length > 0 ? Math.max(...gpuValues) : null;
		const spun = new Set(cfg.spun);
		const newlySpun = [];
		const fans = [];
		for (const s of sensors.filter((x) => x.type === "Fan" && FAN_RE.test(x.id)).sort(byName)) {
			const source = s.id.startsWith("/lpc/") ? "board" : "gpu";
			const control = byId.get(controlIdOf(s.id));
			const rpm = s.value;
			if (rpm != null && rpm >= SPIN_RPM) {
				this.zeroSince.delete(s.id);
				if (!spun.has(s.id)) {
					spun.add(s.id);
					newlySpun.push(s.id);
				}
			} else if (rpm != null && !this.zeroSince.has(s.id)) this.zeroSince.set(s.id, now);
			const role = cfg.roles[s.id] ?? "unset";
			fans.push({
				id: s.id,
				controlId: control ? control.id : null,
				name: s.name,
				source,
				rpm,
				controlPct: control?.value ?? null,
				role,
				status: fanStatus({
					rpm,
					controlPct: control?.value ?? null,
					source,
					role,
					everSpun: spun.has(s.id),
					zeroForMs: this.zeroSince.has(s.id) ? now - this.zeroSince.get(s.id) : 0,
					gpuTempC,
					lhmOnline
				})
			});
		}
		const sensorOf = (s) => ({
			id: s.id,
			name: s.name,
			label: cfg.names[s.id] ?? null,
			value: s.value,
			unit: s.unit
		});
		const board = sensors.filter((s) => /^\/lpc\//.test(s.id)).sort(byName);
		return {
			snapshot: {
				groups: [],
				fans,
				temps: board.filter((s) => s.type === "Temperature").map(sensorOf),
				volts: board.filter((s) => s.type === "Voltage").map(sensorOf),
				cpuTempC,
				gpuTempC
			},
			newlySpun
		};
	}
};
