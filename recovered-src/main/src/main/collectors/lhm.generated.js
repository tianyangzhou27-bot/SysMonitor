// GENERATED FRAGMENT — extracted from out/main/index.js, lines 1069-1215.
// Original module marker: src/main/collectors/lhm.ts. Not the original TypeScript/TSX source.
// Depends on bundle-level imports, globals, and other fragments; not standalone.
var VALUE_RE = /^\s*(-?[\d.,]+)\s*(.*?)\s*$/;
var SENSOR_ID_RE$1 = /^\/[\w-]+(\/[\w-]+){2,4}$/;
var CONTROL_ID_RE = /^\/(lpc|gpu-[a-z]+)\/[\w-]+(\/\d+)?\/control\/\d+$/;
var WRITE_GAP_MS = 150;
var sleep$1 = (ms) => new Promise((r) => setTimeout(r, ms));
function parseValue(raw) {
	const m = raw ? VALUE_RE.exec(raw) : null;
	if (!m) return {
		value: null,
		unit: ""
	};
	const num = m[1].includes(".") ? m[1].replace(/,/g, "") : m[1].replace(",", ".");
	const value = Number(num);
	return {
		value: Number.isFinite(value) ? value : null,
		unit: m[2]
	};
}
function flattenTree(root) {
	const out = [];
	const walk = (n, path) => {
		const here = [...path, n.Text ?? ""];
		if (n.SensorId) {
			const { value, unit } = parseValue(n.Value);
			out.push({
				id: n.SensorId,
				hardware: here.slice(2, -2).join(" / "),
				group: here[here.length - 2] ?? "",
				name: n.Text ?? "",
				type: n.Type ?? "",
				value,
				unit
			});
			return;
		}
		for (const c of n.Children ?? []) walk(c, here);
	};
	walk(root, []);
	return out;
}
var LhmClient = class {
	timer = null;
	busy = false;
	online = false;
	sensors = [];
	byId = /* @__PURE__ */ new Map();
	listeners = [];
	writeChain = Promise.resolve();
	launchTried = false;
	baseUrl;
	constructor(baseUrl = "http://127.0.0.1:8085") {
		this.baseUrl = baseUrl;
	}
	start(intervalMs = 2e3) {
		this.stop();
		this.poll();
		this.timer = setInterval(() => void this.poll(), intervalMs);
	}
	stop() {
		if (this.timer) clearInterval(this.timer);
		this.timer = null;
	}
	isOnline() {
		return this.online;
	}
	list() {
		return this.sensors;
	}
	get(id) {
		return this.byId.get(id);
	}
	onUpdate(cb) {
		this.listeners.push(cb);
	}
	/** 直接读一个传感器的当前值（不等下一次轮询），读不到返回 null */
	async readSensor(id) {
		if (!SENSOR_ID_RE$1.test(id)) return null;
		try {
			const res = await fetch(`${this.baseUrl}/Sensor?action=Get&id=${id}`, { signal: AbortSignal.timeout(1500) });
			if (!res.ok) return null;
			const j = await res.json();
			return typeof j.value === "number" && Number.isFinite(j.value) ? j.value : null;
		} catch {
			return null;
		}
	}
	/**
	* 设置风扇控制值（0 到 100）；传 null 表示交还主板或显卡自己管。只接受格式正确的控制通道。
	* 所有写入排队逐条发送：显卡的几个风扇在驱动里是同一组设置，同时写可能互相覆盖。
	*/
	setControl(controlId, percent) {
		if (!CONTROL_ID_RE.test(controlId)) return Promise.resolve(false);
		const run = this.writeChain.then(() => this.writeControl(controlId, percent));
		this.writeChain = run.then(() => sleep$1(WRITE_GAP_MS), () => sleep$1(WRITE_GAP_MS));
		return run;
	}
	async writeControl(controlId, percent) {
		const v = percent == null ? "null" : String(Math.min(100, Math.max(0, Math.round(percent))));
		try {
			return (await fetch(`${this.baseUrl}/Sensor?action=Set&id=${controlId}&value=${v}`, { signal: AbortSignal.timeout(2e3) })).ok;
		} catch {
			return false;
		}
	}
	cpuTemp() {
		const temps = this.sensors.filter((s) => s.type === "Temperature" && /^\/(intelcpu|amdcpu)\/\d+\//.test(s.id));
		const pick = temps.find((s) => s.name === "CPU Package") ?? temps.find((s) => /^Core \((Tctl|Tdie)/.test(s.name));
		return pick?.value != null && pick.value > 0 ? pick.value : null;
	}
	launchOnce() {
		if (this.launchTried || process.platform !== "win32") return;
		this.launchTried = true;
		(0, child_process.execFile)("tasklist.exe", [
			"/FI",
			"IMAGENAME eq LibreHardwareMonitor.exe",
			"/FO",
			"CSV",
			"/NH"
		], { windowsHide: true }, (err, out) => {
			if (err || /LibreHardwareMonitor\.exe/i.test(out)) return;
			(0, child_process.execFile)("schtasks.exe", [
				"/run",
				"/tn",
				"LibreHardwareMonitor"
			], { windowsHide: true }, () => void 0);
		});
	}
	async poll() {
		if (this.busy) return;
		this.busy = true;
		try {
			const res = await fetch(`${this.baseUrl}/data.json`, { signal: AbortSignal.timeout(1500) });
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			this.sensors = flattenTree(await res.json());
			this.byId = new Map(this.sensors.map((s) => [s.id, s]));
			this.online = true;
		} catch {
			this.sensors = [];
			this.byId = /* @__PURE__ */ new Map();
			this.online = false;
			this.launchOnce();
		} finally {
			this.busy = false;
		}
		for (const cb of this.listeners) cb(this.sensors);
	}
};
