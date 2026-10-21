//#region \0rolldown/runtime.js
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
	if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
		key = keys[i];
		if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
			get: ((k) => from[k]).bind(null, key),
			enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
		});
	}
	return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule || !__hasOwnProp.call(mod, "default") ? __defProp(target, "default", {
	value: mod,
	enumerable: true
}) : target, mod));
//#endregion
let electron = require("electron");
let os = require("os");
let path = require("path");
let systeminformation = require("systeminformation");
systeminformation = __toESM(systeminformation);
let child_process = require("child_process");
let readline = require("readline");
let fs = require("fs");
fs = __toESM(fs);
let net = require("net");
net = __toESM(net);
let https = require("https");
https = __toESM(https);
let http = require("http");
http = __toESM(http);
let node_sqlite = require("node:sqlite");
let node_fs = require("node:fs");
node_fs = __toESM(node_fs);
let node_path = require("node:path");
let crypto = require("crypto");
//#region src/shared/ipc-channels.ts
var IPC = {
	winMinimize: "win:minimize",
	winToggleMaximize: "win:toggle-maximize",
	winClose: "win:close",
	winIsMaximized: "win:is-maximized",
	winMaximizedChanged: "win:maximized-changed",
	themeSet: "theme:set",
	metricsSnapshot: "metrics:snapshot",
	metricsGetLatest: "metrics:get-latest",
	speedtestStart: "speedtest:start",
	speedtestCancel: "speedtest:cancel",
	speedtestProgress: "speedtest:progress",
	powerLive: "power:live",
	settingsGet: "settings:get",
	settingsSet: "settings:set",
	settingsChanged: "settings:changed",
	alertTest: "alerts:test",
	appInfo: "app:info",
	uiOpenSettings: "ui:open-settings",
	shellInfo: "shell:info",
	historySeries: "history:series",
	historyQuery: "history:query",
	historyEvents: "history:events",
	historyEvent: "history:event",
	historyStats: "history:stats",
	historyExport: "history:export",
	historyClear: "history:clear",
	coolingIdentify: "cooling:identify"
};
//#endregion
//#region src/shared/cooling.ts
var GROUP_KEYS = [
	"cpu",
	"case",
	"gpu"
];
var GROUP_TEXT = {
	cpu: "CPU 风扇",
	case: "机箱风扇",
	gpu: "显卡风扇"
};
var FLOOR_PCT = {
	cpu: 30,
	case: 20,
	gpu: 30
};
var EMERGENCY_C = {
	cpu: 90,
	gpu: 85
};
function defaultGroups() {
	const levels = (froms, pcts) => froms.map((from, i) => ({
		from,
		pct: pcts[i]
	}));
	return {
		cpu: {
			mode: "bios",
			manualLevel: 3,
			levels: levels([
				0,
				50,
				60,
				70,
				80
			], [
				30,
				45,
				60,
				80,
				100
			])
		},
		case: {
			mode: "bios",
			manualLevel: 3,
			levels: levels([
				0,
				50,
				60,
				70,
				80
			], [
				25,
				40,
				55,
				75,
				100
			])
		},
		gpu: {
			mode: "bios",
			manualLevel: 3,
			levels: levels([
				0,
				50,
				60,
				70,
				78
			], [
				null,
				40,
				55,
				75,
				100
			])
		}
	};
}
function defaultCooling() {
	return {
		roles: {},
		names: {},
		spun: [],
		groups: defaultGroups(),
		acked: {
			cpu: false,
			case: false,
			gpu: false
		}
	};
}
var ROLE_TEXT = {
	cpu: "CPU 风扇",
	case: "机箱风扇",
	pump: "水泵",
	none: "未接",
	unset: "未指定"
};
/** 界面和告警里对一个风扇的称呼：已指定用途就用用途，否则用传感器名称 */
function fanLabel(f) {
	const base = f.source === "gpu" ? `显卡 ${f.name}` : `主板 ${f.name}`;
	return f.role === "unset" || f.role === "none" ? base : `${ROLE_TEXT[f.role]}（${base}）`;
}
//#endregion
//#region src/shared/nvme.ts
var BITS = [
	[1, "可用备用空间低于阈值"],
	[2, "温度超出阈值"],
	[4, "可靠性下降（介质或内部错误）"],
	[8, "已变为只读"],
	[16, "易失性数据备份失败"],
	[32, "持久内存区变为只读"]
];
function describeCriticalWarning(bits) {
	if (bits === 0) return "无";
	const parts = BITS.filter(([mask]) => (bits & mask) !== 0).map(([, text]) => text);
	return parts.length > 0 ? parts.join("；") : `未知标志 0x${bits.toString(16)}`;
}
//#endregion
//#region src/main/alerts.ts
var pct$1 = (v) => `${v.toFixed(0)}%`;
var AlertEngine = class {
	states = /* @__PURE__ */ new Map();
	media = /* @__PURE__ */ new Map();
	onClick;
	sink;
	constructor(onClick, sink = null) {
		this.onClick = onClick;
		this.sink = sink;
	}
	/** 软件退出或告警总开关关闭时，结束所有还在持续的事件 */
	closeAll(now = Date.now()) {
		for (const st of this.states.values()) this.endEvent(st, now);
		this.states.clear();
	}
	endEvent(st, now) {
		if (st.eventId != null) this.sink?.close(st.eventId, now);
		st.eventId = null;
		st.eventTried = false;
	}
	evaluate(s, cfg, now = Date.now()) {
		if (!cfg.enabled) {
			this.closeAll(now);
			return;
		}
		const checks = this.checks(s, cfg, now);
		const live = new Set(checks.map((c) => c.id));
		for (const [id, st] of this.states) {
			if (live.has(id)) continue;
			this.endEvent(st, now);
			this.states.delete(id);
		}
		for (const c of checks) {
			const st = this.states.get(c.id) ?? {
				since: null,
				firedAt: 0,
				eventId: null,
				eventTried: false
			};
			this.states.set(c.id, st);
			if (!c.hit) {
				this.endEvent(st, now);
				st.since = null;
				continue;
			}
			st.since ??= now;
			const sustained = now - st.since >= cfg.sustainSec * 1e3;
			if (sustained && !st.eventTried) {
				st.eventTried = true;
				st.eventId = this.sink?.open(c, st.since, s) ?? null;
			}
			const cooled = now - st.firedAt >= cfg.cooldownMin * 6e4;
			if (sustained && cooled) {
				st.firedAt = now;
				this.notify(c.title, c.body);
			}
		}
	}
	test() {
		this.notify("SysMonitor 测试通知", "告警功能工作正常。");
	}
	notify(title, body) {
		if (!electron.Notification.isSupported()) return;
		const n = new electron.Notification({
			title,
			body
		});
		n.on("click", this.onClick);
		n.show();
	}
	checks(s, a, now) {
		const out = [];
		const over = (id, value, limit, title, text) => out.push({
			id,
			hit: value != null && value >= limit,
			title,
			body: value != null ? text(value) : ""
		});
		over("cpu", s.cpu.usage, a.cpuUsage, "CPU 使用率过高", (v) => `当前 ${pct$1(v)}，超过阈值 ${a.cpuUsage}%`);
		over("cpuTemp", s.cpu.tempC, a.cpuTemp, "CPU 温度过高", (v) => `当前 ${v.toFixed(0)}°C，超过阈值 ${a.cpuTemp}°C`);
		over("gpu", s.gpu.usage, a.gpuUsage, "GPU 使用率过高", (v) => `当前 ${pct$1(v)}，超过阈值 ${a.gpuUsage}%`);
		over("gpuTemp", s.gpu.tempC, a.gpuTemp, "GPU 温度过高", (v) => `当前 ${v.toFixed(0)}°C，超过阈值 ${a.gpuTemp}°C`);
		over("mem", s.memory.usagePercent, a.memUsage, "内存使用率过高", (v) => `当前 ${pct$1(v)}，超过阈值 ${a.memUsage}%`);
		over("power", s.power.totalW, a.power, "整机功耗过高（估算）", (v) => `当前约 ${v.toFixed(0)} W，超过阈值 ${a.power} W`);
		const { committedBytes: used, commitLimitBytes: limit } = s.memory;
		over("commit", used != null && limit ? used / limit * 100 : null, a.commitUsage, "内存提交量接近上限", (v) => `已提交 ${pct$1(v)}，超过阈值 ${a.commitUsage}%，可能导致程序崩溃`);
		const fullDisks = s.disk.volumes.filter((v) => v.usagePercent >= a.diskUsage);
		out.push({
			id: "disk",
			hit: fullDisks.length > 0,
			title: "磁盘空间快满了",
			body: fullDisks.map((v) => `${v.mount} 已用 ${pct$1(v.usagePercent)}`).join("，")
		});
		for (const d of s.storage) {
			over(`ssdTemp:${d.name}`, d.tempC, a.ssdTemp, "硬盘温度过高", (v) => `${d.name} 当前 ${v.toFixed(0)}°C，超过阈值 ${a.ssdTemp}°C`);
			const lowSpare = d.availableSpare != null && d.spareThreshold != null && d.availableSpare <= d.spareThreshold;
			out.push({
				id: `ssdSpare:${d.name}`,
				hit: lowSpare,
				title: "硬盘可用备用空间偏低",
				body: lowSpare ? `${d.name} 可用备用空间 ${d.availableSpare}%，已降到硬盘自身报告的阈值 ${d.spareThreshold}%` : ""
			});
			out.push({
				id: `ssdRead:${d.name}`,
				hit: !d.readOk,
				title: "硬盘健康数据读取失败",
				body: `${d.name} 的健康数据持续读不到。这不代表硬盘损坏，可能是硬盘被移除、休眠，或 LibreHardwareMonitor 出了问题。`
			});
			const warn = d.criticalWarning ?? 0;
			out.push({
				id: `ssdWarn:${d.name}`,
				hit: warn !== 0,
				title: "硬盘报告了严重警告",
				body: `${d.name}：${describeCriticalWarning(warn)}。建议尽快备份重要数据，并用硬盘厂商工具检查。`
			});
			if (d.mediaErrors != null) {
				const m = this.media.get(d.name);
				if (!m) this.media.set(d.name, {
					last: d.mediaErrors,
					raisedAt: 0
				});
				else {
					if (d.mediaErrors > m.last) m.raisedAt = now;
					m.last = d.mediaErrors;
				}
				const raisedAt = this.media.get(d.name).raisedAt;
				out.push({
					id: `ssdMedia:${d.name}`,
					hit: raisedAt > 0 && now - raisedAt < 18e4,
					title: "硬盘介质错误增加",
					body: `${d.name} 的介质与数据完整性错误累计 ${d.mediaErrors} 次，比刚才增加了。建议尽快备份重要数据。`
				});
			}
		}
		for (const g of s.cooling.groups) {
			out.push({
				id: `fanCtl:${g.key}`,
				hit: g.error != null && g.mode !== "bios",
				title: "风扇调速已放弃接管",
				body: `${GROUP_TEXT[g.key]}：${g.error ?? ""}`
			});
			out.push({
				id: `fanRelease:${g.key}`,
				hit: g.notice != null,
				title: "风扇没能交还",
				body: `${GROUP_TEXT[g.key]}：${g.notice ?? ""}`
			});
			out.push({
				id: `fanEmerg:${g.key}`,
				hit: g.emergency,
				title: "触发了紧急散热保护",
				body: `${GROUP_TEXT[g.key]}已被拉到 100%：温度达到保护阈值（CPU ${EMERGENCY_C.cpu}°C / 显卡 ${EMERGENCY_C.gpu}°C）。请检查散热。`
			});
		}
		for (const f of s.cooling.fans) {
			const stalled = f.status === "suspect-stalled";
			if (f.role === "pump") out.push({
				id: `pump:${f.id}`,
				hit: stalled,
				title: "水泵可能停转",
				body: `${fanLabel(f)} 转速为 0，但之前能转。水泵停转会让 CPU 很快过热，请立即检查（这是根据转速做的推测，也可能是线缆或传感器问题）。`
			});
			else out.push({
				id: `fanStall:${f.id}`,
				hit: stalled,
				title: "风扇疑似停转",
				body: `${fanLabel(f)} 转速为 0，但之前能转。可能是风扇故障、线缆松动，也可能是被人为关闭，这是推测，请检查。`
			});
		}
		const reach = s.network.reach;
		out.push({
			id: "net-down",
			hit: reach === "offline" || reach === "lan-only",
			title: reach === "offline" ? "网络已断开" : "外网不通",
			body: reach === "offline" ? "连路由器都无法访问" : "路由器可以访问，但无法连到外网"
		});
		over("net-slow", reach === "online" ? s.network.internetLatencyMs : null, a.netLatencyMs, "外网延迟过高", (v) => `当前 ${v} ms，超过阈值 ${a.netLatencyMs} ms`);
		const top = s.processes.apps.cpu[0];
		if (top && top.cpuPercent != null) out.push({
			id: `proc:${top.name}`,
			hit: top.cpuPercent >= a.procCpu,
			title: "有程序长时间占用大量 CPU",
			body: `${top.name} 占用 ${pct$1(top.cpuPercent)}，超过阈值 ${a.procCpu}%`
		});
		return out;
	}
};
//#endregion
//#region src/main/collectors/cpuInfo.ts
var HYBRID_TABLE = [
	{
		match: /\b1[34]9\d\d/,
		p: 8,
		e: 16
	},
	{
		match: /\b14700/,
		p: 8,
		e: 12
	},
	{
		match: /\b13700/,
		p: 8,
		e: 8
	},
	{
		match: /\b1[34]600/,
		p: 6,
		e: 8
	}
];
async function readCpuInfo() {
	const list = (0, os.cpus)();
	const model = (list[0]?.model ?? "CPU").trim();
	const c = await systeminformation.cpu();
	let p = c.performanceCores && c.performanceCores > 0 ? c.performanceCores : null;
	let e = c.efficiencyCores && c.efficiencyCores > 0 ? c.efficiencyCores : null;
	if (p == null || e == null) {
		const hit = HYBRID_TABLE.find((h) => h.match.test(model));
		if (hit) {
			p = hit.p;
			e = hit.e;
		}
	}
	return {
		model,
		physicalCores: c.physicalCores || list.length,
		logicalCores: list.length,
		baseGHz: c.speed > 0 ? c.speed : null,
		pCores: p,
		eCores: e
	};
}
//#endregion
//#region src/main/collectors/disk.ts
async function readVolumes() {
	return (await systeminformation.fsSize()).filter((d) => d.size > 0 && /^[A-Za-z]:/.test(d.mount)).map((d) => ({
		mount: d.mount,
		fsType: d.type,
		totalBytes: d.size,
		usedBytes: d.used,
		usagePercent: d.size > 0 ? d.used / d.size * 100 : 0
	})).sort((a, b) => a.mount.localeCompare(b.mount));
}
//#endregion
//#region src/main/collectors/gpuSmi.ts
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
//#endregion
//#region src/main/collectors/exec.ts
function runCapture(cmd, args, timeoutMs = 8e3) {
	return new Promise((resolve) => {
		let settled = false;
		const chunks = [];
		const done = (code) => {
			if (settled) return;
			settled = true;
			clearTimeout(timer);
			resolve({
				code,
				out: Buffer.concat(chunks)
			});
		};
		const proc = (0, child_process.spawn)(cmd, args, {
			windowsHide: true,
			stdio: [
				"ignore",
				"pipe",
				"ignore"
			]
		});
		const timer = setTimeout(() => {
			proc.kill();
			done(null);
		}, timeoutMs);
		proc.stdout.on("data", (d) => chunks.push(d));
		proc.on("error", () => done(null));
		proc.on("close", (code) => done(code));
	});
}
function decodeConsole(buf) {
	try {
		return new TextDecoder("gbk").decode(buf);
	} catch {
		return buf.toString("latin1");
	}
}
//#endregion
//#region src/main/collectors/gpuInfo.ts
var SMI_FIELDS = [
	"name",
	"driver_version",
	"vbios_version",
	"pci.device_id",
	"pci.sub_device_id",
	"memory.total",
	"clocks.max.graphics",
	"clocks.max.memory",
	"power.default_limit",
	"power.max_limit",
	"power.min_limit",
	"pcie.link.gen.max",
	"pcie.link.width.max",
	"compute_cap"
];
var SUBSYSTEM_VENDORS = {
	"1043": "ASUS 华硕",
	"1458": "Gigabyte 技嘉",
	"1462": "MSI 微星",
	"3842": "EVGA",
	"19DA": "ZOTAC 索泰",
	"1569": "Palit 同德",
	"10B0": "Gainward 耕升",
	"196E": "PNY",
	"1B4C": "Galax / KFA2 影驰",
	"7377": "Colorful 七彩虹",
	"107D": "Leadtek 丽台",
	"10DE": "NVIDIA（公版）"
};
var RAM_TYPES = {
	8: "GDDR5",
	10: "GDDR5X",
	14: "GDDR6",
	15: "GDDR6X"
};
var ARCH_RATIO = {
	"Ada Lovelace": {
		cudaPerSm: 128,
		tensorPerSm: 4,
		rt: true
	},
	Ampere: {
		cudaPerSm: 128,
		tensorPerSm: 4,
		rt: true
	},
	Blackwell: {
		cudaPerSm: 128,
		tensorPerSm: 4,
		rt: true
	},
	Turing: {
		cudaPerSm: 64,
		tensorPerSm: 8,
		rt: true
	}
};
var num$2 = (s) => {
	const n = Number((s ?? "").trim());
	return s && s.trim() !== "" && Number.isFinite(n) ? n : null;
};
/** 解析 0x278210DE 这样的 PCI 编号：低 16 位是厂商，高 16 位是设备 */
function splitPciId(raw) {
	const m = /^0x([0-9a-f]{8})$/i.exec((raw ?? "").trim());
	if (!m) return null;
	return {
		vendor: m[1].slice(4).toUpperCase(),
		device: m[1].slice(0, 4).toUpperCase()
	};
}
function parseSmiCsv(line) {
	const parts = line.trim().split(/,\s*/);
	const out = {};
	SMI_FIELDS.forEach((f, i) => {
		const v = parts[i];
		if (v != null && !/^\[?(N\/A|Not Supported)\]?$/i.test(v)) out[f] = v;
	});
	return out;
}
function parseSmiQuery(text) {
	const pick = (re) => {
		const v = re.exec(text)?.[1].trim();
		return v && !/^N\/A$/i.test(v) ? v : null;
	};
	return {
		architecture: pick(/Product Architecture\s*:\s*(.+)/),
		partNumber: pick(/GPU Part Number\s*:\s*(.+)/),
		cuda: pick(/CUDA UMD Version\s*:\s*(.+)/) ?? pick(/CUDA Version\s*:\s*(\S+)/)
	};
}
function buildGpuInfo(csv, q, api) {
	if (!csv["name"]) return null;
	const chip = splitPciId(csv["pci.device_id"]);
	const sub = splitPciId(csv["pci.sub_device_id"]);
	const arch = q.architecture;
	const cores = api.cores && api.cores > 0 ? api.cores : null;
	const ratio = arch ? ARCH_RATIO[arch] : void 0;
	const sm = cores && ratio ? Math.round(cores / ratio.cudaPerSm) : null;
	const memoryType = api.ram != null ? RAM_TYPES[api.ram] ?? null : null;
	const bus = api.bus && api.bus > 0 ? api.bus : null;
	const maxMem = num$2(csv["clocks.max.memory"]);
	const gbps = memoryType && maxMem ? maxMem * 2 / 1e3 : null;
	return {
		name: csv["name"],
		architecture: arch,
		vendor: sub ? SUBSYSTEM_VENDORS[sub.vendor] ?? `厂商编号 ${sub.vendor}` : null,
		chipId: chip ? `${chip.vendor}:${chip.device}` : null,
		subsystemId: sub ? `${sub.vendor}:${sub.device}` : null,
		partNumber: q.partNumber,
		cudaCores: cores,
		smCount: sm,
		tensorCores: sm && ratio ? sm * ratio.tensorPerSm : null,
		rtCores: sm && ratio?.rt ? sm : null,
		memoryMiB: num$2(csv["memory.total"]),
		memoryType,
		busWidthBits: bus,
		memoryGbps: gbps,
		bandwidthGBs: bus && gbps ? bus * gbps / 8 : null,
		maxBoostMHz: num$2(csv["clocks.max.graphics"]),
		maxMemoryMHz: maxMem,
		powerDefaultW: num$2(csv["power.default_limit"]),
		powerMaxW: num$2(csv["power.max_limit"]),
		powerMinW: num$2(csv["power.min_limit"]),
		pcieMaxGen: num$2(csv["pcie.link.gen.max"]),
		pcieMaxWidth: num$2(csv["pcie.link.width.max"]),
		computeCapability: csv["compute_cap"] ?? null,
		driverVersion: csv["driver_version"] ?? null,
		cudaVersion: q.cuda,
		vbios: csv["vbios_version"] ?? null
	};
}
function scriptPath$1() {
	return electron.app.isPackaged ? (0, path.join)(process.resourcesPath, "gpu-nvapi.ps1") : (0, path.join)(electron.app.getAppPath(), "resources", "gpu-nvapi.ps1");
}
/** 只读一次的 NVIDIA 显卡规格；不是 NVIDIA 显卡或读取失败时返回 null */
async function readGpuInfo() {
	const csvRun = await runCapture("nvidia-smi", [`--query-gpu=${SMI_FIELDS.join(",")}`, "--format=csv,noheader,nounits"], 1e4);
	if (csvRun.code !== 0) return null;
	const line = csvRun.out.toString("utf8").split(/\r?\n/).find((l) => l.trim());
	if (!line) return null;
	const [qRun, apiRun] = await Promise.all([runCapture("nvidia-smi", ["-q"], 15e3), runCapture("powershell.exe", [
		"-NoProfile",
		"-NonInteractive",
		"-ExecutionPolicy",
		"Bypass",
		"-File",
		scriptPath$1()
	], 2e4)]);
	let api = {};
	try {
		api = JSON.parse(apiRun.out.toString("utf8").trim().split(/\r?\n/).pop() ?? "{}");
	} catch {
		api = {};
	}
	return buildGpuInfo(parseSmiCsv(line), parseSmiQuery(qRun.out.toString("utf8")), api);
}
//#endregion
//#region src/main/collectors/hardware.ts
var COMMAND = "[Console]::OutputEncoding=[System.Text.Encoding]::UTF8;ConvertTo-Json -InputObject @(Get-CimInstance Win32_PhysicalMemory | Select-Object BankLabel,DeviceLocator,Capacity,Speed,ConfiguredClockSpeed,Manufacturer,PartNumber,SMBIOSMemoryType) -Compress";
var DEVICES_COMMAND = [
	"$ErrorActionPreference='SilentlyContinue'",
	"[Console]::OutputEncoding=[System.Text.Encoding]::UTF8",
	"function S($a){ if($null -eq $a){return $null}; (@($a | Where-Object { $_ -ne 0 } | ForEach-Object { [char]$_ }) -join '') }",
	"$bb=Get-CimInstance Win32_BaseBoard | Select-Object -First 1",
	"$bi=Get-CimInstance Win32_BIOS | Select-Object -First 1",
	"$cs=Get-CimInstance Win32_ComputerSystem | Select-Object -First 1",
	"$sz=@{}",
	"Get-CimInstance -Namespace root/wmi -ClassName WmiMonitorBasicDisplayParams | ForEach-Object { $sz[$_.InstanceName]=@($_.MaxHorizontalImageSize,$_.MaxVerticalImageSize) }",
	"$mons=@(Get-CimInstance -Namespace root/wmi -ClassName WmiMonitorID | ForEach-Object { $d=$sz[$_.InstanceName]; @{ code=(S $_.ManufacturerName); model=(S $_.UserFriendlyName); serial=(S $_.SerialNumberID); year=$_.YearOfManufacture; wcm=$d[0]; hcm=$d[1] } })",
	"$disks=@(Get-PhysicalDisk | ForEach-Object { @{ id=$_.DeviceId; model=$_.FriendlyName; media=[string]$_.MediaType; bus=[string]$_.BusType; size=$_.Size; fw=$_.FirmwareVersion; health=[string]$_.HealthStatus; serial=$_.SerialNumber } })",
	"$date=$null; if($bi.ReleaseDate){ $date=$bi.ReleaseDate.ToString('yyyy-MM-dd') }",
	"ConvertTo-Json -Depth 4 -Compress -InputObject @{ board=@{ vendor=$bb.Manufacturer; model=$bb.Product; version=$bb.Version; serial=$bb.SerialNumber; biosVendor=$bi.Manufacturer; biosVersion=$bi.SMBIOSBIOSVersion; biosDate=$date; systemModel=$cs.Model }; monitors=$mons; disks=$disks }"
].join("\n");
var MEMORY_TYPES = {
	24: "DDR3",
	26: "DDR4",
	34: "DDR5"
};
var MONITOR_BRANDS = {
	AUS: "ASUS 华硕",
	ACI: "ASUS 华硕",
	GSM: "LG",
	SAM: "Samsung 三星",
	DEL: "Dell 戴尔",
	AOC: "AOC",
	BNQ: "BenQ 明基",
	ACR: "Acer 宏碁",
	LEN: "Lenovo 联想",
	HWP: "HP",
	HPN: "HP",
	MSI: "MSI 微星",
	GBT: "Gigabyte 技嘉",
	PHL: "Philips 飞利浦",
	VSC: "ViewSonic 优派",
	SNY: "Sony 索尼",
	HKC: "HKC",
	KOG: "KOGAN",
	MEI: "Panasonic 松下",
	SHP: "Sharp 夏普",
	NEC: "NEC",
	EIZ: "EIZO",
	HSD: "Hannspree",
	CMN: "奇美 Chimei",
	BOE: "京东方 BOE",
	AUO: "友达 AUO"
};
var DISK_BRANDS = [
	[/^samsung|^mz/i, "Samsung 三星"],
	[/^zhitai|^ti\d{3}/i, "ZHITAI 致态"],
	[/^wdc|^wd[ _]|^western digital|^sandisk/i, "Western Digital / SanDisk"],
	[/^seagate|^st\d/i, "Seagate 希捷"],
	[/^kingston|^sa\d|^snv|^skc/i, "Kingston 金士顿"],
	[/^crucial|^ct\d/i, "Crucial 英睿达"],
	[/^sk ?hynix|^hfs/i, "SK hynix"],
	[/^intel/i, "Intel"],
	[/^toshiba|^kioxia|^kxg/i, "Toshiba / KIOXIA"],
	[/^micron/i, "Micron 美光"],
	[/^adata|^asu|^xpg/i, "ADATA 威刚"],
	[/^lexar/i, "Lexar 雷克沙"],
	[/^colorful/i, "Colorful 七彩虹"],
	[/^gigabyte|^gp-/i, "Gigabyte 技嘉"],
	[/^corsair/i, "Corsair 海盗船"],
	[/^netac/i, "Netac 朗科"],
	[/^pny/i, "PNY"],
	[/^sabrent/i, "Sabrent"]
];
var PLACEHOLDER = /^(system product name|to be filled.*|default string|o\.e\.m\.?|system version|not applicable|none|unknown|0)$/i;
var text = (v) => {
	const s = typeof v === "string" ? v.trim() : "";
	return s && !/^(unknown|undefined|0)$/i.test(s) ? s : null;
};
var mts = (v) => typeof v === "number" && v > 0 ? v : null;
var real = (v) => {
	const s = text(v);
	return s && !PLACEHOLDER.test(s) ? s : null;
};
var list = (v) => Array.isArray(v) ? v : v && typeof v === "object" ? [v] : [];
function diskKind(media, bus) {
	if (/nvme/i.test(bus)) return "NVMe 固态硬盘";
	if (/ssd/i.test(media)) return /sata/i.test(bus) ? "SATA 固态硬盘" : "固态硬盘";
	if (/hdd/i.test(media)) return "机械硬盘";
	if (/usb/i.test(bus)) return "USB 存储";
	return bus || media || "未知类型";
}
var HEALTH = {
	healthy: "健康",
	warning: "警告",
	unhealthy: "异常"
};
var HardwareCollector = class {
	memory = null;
	board = null;
	monitors = [];
	disks = [];
	gpu = null;
	devicesRead = false;
	retry = null;
	stopped = false;
	async start() {
		await Promise.all([
			this.readMemory(),
			this.readDevices(),
			this.gpu ? Promise.resolve() : readGpuInfo().then((g) => this.gpu = g).catch(() => void 0)
		]);
		if ((!this.memory || !this.devicesRead) && !this.stopped) this.retry = setTimeout(() => void this.start(), 6e4);
	}
	stop() {
		this.stopped = true;
		if (this.retry) clearTimeout(this.retry);
	}
	get() {
		return {
			memory: this.memory,
			gpu: this.gpu,
			board: this.board,
			monitors: this.withDisplay(this.monitors),
			disks: this.disks,
			uptimeSec: Math.floor((0, os.uptime)())
		};
	}
	withDisplay(mons) {
		const displays = electron.screen.getAllDisplays();
		const only = mons.length === 1 && displays.length === 1 ? displays[0] : null;
		return mons.map((m) => ({
			...m,
			resolution: only ? `${Math.round(only.size.width * only.scaleFactor)} × ${Math.round(only.size.height * only.scaleFactor)}` : null,
			refreshHz: only && only.displayFrequency > 0 ? Math.round(only.displayFrequency) : null
		}));
	}
	async readDevices() {
		const { out, code } = await runCapture("powershell.exe", [
			"-NoProfile",
			"-NonInteractive",
			"-ExecutionPolicy",
			"Bypass",
			"-Command",
			DEVICES_COMMAND
		], 3e4);
		if (code !== 0) return;
		try {
			const raw = JSON.parse(out.toString("utf8").trim());
			const b = raw.board ?? {};
			this.board = {
				vendor: text(b.vendor),
				model: text(b.model),
				version: real(b.version),
				serial: real(b.serial),
				biosVendor: text(b.biosVendor),
				biosVersion: text(b.biosVersion),
				biosDate: text(b.biosDate),
				systemModel: real(b.systemModel)
			};
			this.monitors = list(raw.monitors).map((m) => {
				const w = Number(m.wcm ?? 0);
				const h = Number(m.hcm ?? 0);
				const code3 = text(m.code);
				const year = Number(m.year ?? 0);
				return {
					brand: code3 ? MONITOR_BRANDS[code3.toUpperCase()] ?? code3 : null,
					model: text(m.model),
					serial: real(m.serial),
					year: year > 1990 ? year : null,
					inches: w > 0 && h > 0 ? Math.round(Math.hypot(w, h) / 2.54) : null
				};
			});
			this.disks = list(raw.disks).map((d) => {
				const model = text(d.model);
				const media = typeof d.media === "string" ? d.media : "";
				const bus = typeof d.bus === "string" ? d.bus : "";
				const health = text(d.health);
				const serial = text(d.serial);
				const id = Number(d.id);
				return {
					deviceId: d.id != null && d.id !== "" && Number.isInteger(id) ? id : null,
					brand: model ? DISK_BRANDS.find(([re]) => re.test(model))?.[1] ?? model.split(/\s+/)[0] : null,
					model,
					kind: diskKind(media, bus),
					sizeBytes: Number(d.size ?? 0),
					firmware: text(d.fw),
					health: health ? HEALTH[health.toLowerCase()] ?? health : null,
					serial: serial ? serial.replace(/[.\s]+$/, "") : null
				};
			}).filter((d) => d.sizeBytes > 0);
			this.devicesRead = true;
		} catch {}
	}
	async readMemory() {
		const { out, code } = await runCapture("powershell.exe", [
			"-NoProfile",
			"-NonInteractive",
			"-ExecutionPolicy",
			"Bypass",
			"-Command",
			COMMAND
		], 2e4);
		if (code !== 0) return;
		try {
			const raw = JSON.parse(out.toString("utf8").trim());
			if (raw.length === 0) return;
			const modules = raw.map((r) => ({
				slot: text(r.DeviceLocator) ?? text(r.BankLabel) ?? "--",
				capacityBytes: Number(r.Capacity ?? 0),
				ratedMTs: mts(r.Speed),
				configuredMTs: mts(r.ConfiguredClockSpeed),
				manufacturer: text(r.Manufacturer),
				partNumber: text(r.PartNumber)
			}));
			const type = MEMORY_TYPES[Number(raw[0].SMBIOSMemoryType)] ?? null;
			this.memory = {
				type,
				modules
			};
		} catch {}
	}
};
//#endregion
//#region src/main/collectors/lhm.ts
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
//#endregion
//#region src/main/cooling/controller.ts
var REASSERT_MS = 2e4;
var MISMATCH_MS = 12e3;
var MISMATCH_PCT = 6;
var RELEASE_CHECK_MS = 6e3;
var RELEASE_TRIES = 2;
var NUDGE_SETTLE_MS = 3e3;
var NUDGE_MAX_GPU_C = 70;
var wait$1 = (ms) => new Promise((r) => setTimeout(r, ms));
/**
* 按温度选档。升档立即生效；降档要同时满足：温度低于当前档起点一个回差，且离上次换档至少 10 秒。
*/
function pickLevel(cfg, temp, current, lastChange, now) {
	let target = 1;
	for (let i = 0; i < 5; i++) if (temp >= cfg.levels[i].from) target = i + 1;
	if (current == null || target >= current) return target;
	return temp < cfg.levels[current - 1].from - 3 && now - lastChange >= 1e4 ? target : current;
}
function refTemp(key, cpu, gpu) {
	if (key === "cpu") return cpu;
	if (key === "gpu") return gpu;
	const both = [cpu, gpu].filter((v) => v != null);
	return both.length > 0 ? Math.max(...both) : null;
}
/** 这一组受软件控制的风扇：只有指定了用途、且有控制通道的风扇；水泵、未接、未指定的永远不碰 */
function groupFans(key, fans) {
	return fans.filter((f) => f.controlId != null && (key === "gpu" ? f.source === "gpu" : f.source === "board" && f.role === key));
}
var FanController = class {
	port;
	applied = /* @__PURE__ */ new Map();
	inflight = /* @__PURE__ */ new Set();
	memory = /* @__PURE__ */ new Map();
	releasing = /* @__PURE__ */ new Map();
	releaseNotice = null;
	constructor(port) {
		this.port = port;
	}
	/** 每次快照调用一次：决定每一组该怎么做，下发需要的改动，返回各组状态 */
	update(snapshot, cfg, lhmOnline, now = Date.now()) {
		if (!lhmOnline) {
			this.applied.clear();
			this.inflight.clear();
		}
		const wanted = /* @__PURE__ */ new Map();
		const states = [];
		for (const key of GROUP_KEYS) {
			const g = cfg.groups[key];
			const fans = groupFans(key, snapshot.fans);
			const mem = this.memory.get(key) ?? {
				level: null,
				changedAt: 0,
				lastMode: g.mode,
				error: null
			};
			this.memory.set(key, mem);
			if (mem.lastMode !== g.mode) {
				mem.lastMode = g.mode;
				mem.error = null;
				mem.level = null;
			}
			const state = {
				key,
				mode: g.mode,
				level: null,
				pct: null,
				holding: false,
				emergency: false,
				refTempC: refTemp(key, snapshot.cpuTempC, snapshot.gpuTempC),
				fanIds: fans.map((f) => f.id),
				error: null,
				notice: key === "gpu" ? this.releaseNotice : null
			};
			states.push(state);
			if (g.mode === "bios" || !cfg.acked[key]) continue;
			if (!lhmOnline) {
				state.error = "需要 LibreHardwareMonitor 在后台运行，现在已交还主板";
				continue;
			}
			if (fans.length === 0) {
				state.error = "这一组还没有可控制的风扇（请先在「风扇接口」里指定用途）";
				continue;
			}
			if (mem.error) {
				state.error = mem.error;
				continue;
			}
			const cpu = snapshot.cpuTempC;
			const gpu = snapshot.gpuTempC;
			const hotCpu = cpu != null && cpu >= EMERGENCY_C.cpu;
			const hotGpu = gpu != null && gpu >= EMERGENCY_C.gpu;
			state.emergency = key === "cpu" ? hotCpu : key === "gpu" ? hotGpu : hotCpu || hotGpu;
			let level;
			if (state.emergency) level = 5;
			else if (g.mode === "manual") level = g.manualLevel;
			else {
				if (state.refTempC == null) {
					state.error = "读不到温度，已交还主板";
					mem.level = null;
					continue;
				}
				level = pickLevel(g, state.refTempC, mem.level, mem.changedAt, now);
			}
			if (level !== mem.level) {
				mem.level = level;
				mem.changedAt = now;
			}
			state.level = level;
			const raw = state.emergency ? 100 : g.levels[level - 1].pct;
			if (raw == null) continue;
			const pct = state.emergency ? 100 : Math.min(100, Math.max(FLOOR_PCT[key], raw));
			state.pct = pct;
			state.holding = true;
			for (const f of fans) wanted.set(f.controlId, pct);
		}
		for (const [id, pct] of wanted) {
			const prev = this.applied.get(id);
			if (!prev || prev.pct !== pct || now - prev.at >= REASSERT_MS) this.send(id, pct, now);
		}
		for (const id of [...this.applied.keys()]) if (!wanted.has(id)) this.send(id, null, now);
		this.verify(snapshot, states, wanted, now);
		this.checkReleases(snapshot, wanted, now);
		return states;
	}
	checkReleases(snapshot, wanted, now) {
		for (const [id, r] of this.releasing) {
			if (wanted.has(id)) {
				this.releasing.delete(id);
				continue;
			}
			const fan = snapshot.fans.find((f) => f.controlId === id);
			if (!fan || fan.controlPct == null || this.inflight.has(id) || now - r.at < RELEASE_CHECK_MS) continue;
			if (Math.abs(fan.controlPct - r.pct) > 3) {
				this.releasing.delete(id);
				if (this.releasing.size === 0) this.releaseNotice = null;
				continue;
			}
			if (snapshot.gpuTempC != null && snapshot.gpuTempC >= NUDGE_MAX_GPU_C) continue;
			if (r.tries >= RELEASE_TRIES) {
				this.releasing.delete(id);
				this.releaseNotice = `${fan.name} 交还后没有恢复显卡自动控制，仍停在 ${fan.controlPct.toFixed(0)}%。请重启 LibreHardwareMonitor，或重启电脑恢复。`;
				continue;
			}
			r.tries += 1;
			r.at = now;
			this.nudge(id, r.pct);
		}
	}
	async nudge(id, stuckPct) {
		if (this.inflight.has(id)) return;
		this.inflight.add(id);
		try {
			await this.port.setControl(id, stuckPct >= 55 ? 40 : 70);
			await wait$1(NUDGE_SETTLE_MS);
			await this.port.setControl(id, null);
		} catch {} finally {
			this.inflight.delete(id);
		}
	}
	verify(snapshot, states, wanted, now) {
		for (const state of states) {
			if (!state.holding) continue;
			for (const f of snapshot.fans.filter((x) => state.fanIds.includes(x.id))) {
				const id = f.controlId;
				const a = this.applied.get(id);
				const want = wanted.get(id);
				if (!a || want == null || a.pct !== want || now - a.at < 5e3 || f.controlPct == null) continue;
				if (Math.abs(f.controlPct - want) > MISMATCH_PCT) {
					a.mismatchSince ??= now;
					if (now - a.mismatchSince >= MISMATCH_MS) {
						const mem = this.memory.get(state.key);
						mem.error = `${f.name} 的控制值没有按设定生效（设定 ${want}%，实际 ${f.controlPct.toFixed(0)}%），已放弃接管并交还主板`;
						mem.level = null;
						state.holding = false;
						state.pct = null;
						state.error = mem.error;
						for (const fid of state.fanIds) {
							const cid = snapshot.fans.find((x) => x.id === fid)?.controlId;
							if (cid) wanted.delete(cid);
						}
						for (const fid of state.fanIds) {
							const cid = snapshot.fans.find((x) => x.id === fid)?.controlId;
							if (cid) this.send(cid, null, now);
						}
					}
				} else a.mismatchSince = null;
			}
		}
	}
	async send(id, pct, now) {
		if (this.inflight.has(id)) return;
		this.inflight.add(id);
		try {
			if (await this.port.setControl(id, pct)) {
				const prev = this.applied.get(id);
				if (pct == null) {
					this.applied.delete(id);
					if (prev && id.startsWith("/gpu-")) this.releasing.set(id, {
						pct: prev.pct,
						at: now,
						tries: 0
					});
				} else this.applied.set(id, {
					pct,
					at: now,
					mismatchSince: prev?.pct === pct ? prev.mismatchSince : null
				});
			}
		} catch {} finally {
			this.inflight.delete(id);
		}
	}
	/** 退出软件时调用：把所有正在控制的风扇交还 */
	async releaseAll() {
		const ids = [...this.applied.keys()];
		this.applied.clear();
		await Promise.all(ids.map(async (id) => {
			for (let i = 0; i < 3; i++) if (await this.port.setControl(id, null)) return;
		}));
	}
};
//#endregion
//#region src/main/frametime/stats.ts
var WINDOW_MS = 6e4;
var STUTTER_WINDOW_MS = 1e4;
var OTHER_MS = 5e3;
var STUTTER_MIN_MS = 33.3;
var STUTTER_FACTOR = 2.5;
var MAX_FRAME_MS = 2e3;
var quantile = (sorted, q) => sorted[Math.min(sorted.length - 1, Math.max(0, Math.ceil(q * sorted.length) - 1))];
var FrameAggregator = class {
	byPid = /* @__PURE__ */ new Map();
	/** 记录一帧：ms 是这一帧在屏幕上停留的时间（没有显示出来的帧用与上一次提交的间隔） */
	add(pid, name, ms, at) {
		if (!Number.isFinite(ms) || ms <= 0 || ms > MAX_FRAME_MS) return;
		const entry = this.byPid.get(pid) ?? {
			name,
			frames: []
		};
		entry.name = name;
		entry.frames.push({
			at,
			ms
		});
		this.byPid.set(pid, entry);
	}
	nameOf(pid) {
		return this.byPid.get(pid)?.name ?? null;
	}
	/** 这个进程最近 1 秒内是否还在出帧 */
	isActive(pid, now) {
		return this.byPid.get(pid)?.frames.some((f) => f.at > now - 1e3) ?? false;
	}
	/** 最近 1 秒内收到过帧的进程，按帧数从多到少 */
	active(now) {
		const out = [];
		for (const [pid, e] of this.byPid) {
			const n = e.frames.filter((f) => f.at > now - 1e3).length;
			if (n > 0) out.push({
				pid,
				name: e.name,
				frames: n
			});
		}
		return out.sort((a, b) => b.frames - a.frames);
	}
	/** 前台进程保留完整的 60 秒；其他进程只留最近几秒，免得后台程序的帧越积越多 */
	prune(now, keepPid) {
		for (const [pid, e] of this.byPid) {
			const horizon = now - (pid === keepPid ? WINDOW_MS : OTHER_MS);
			let drop = 0;
			while (drop < e.frames.length && e.frames[drop].at < horizon) drop++;
			if (drop > 0) e.frames.splice(0, drop);
			if (e.frames.length === 0) this.byPid.delete(pid);
		}
	}
	clear() {
		this.byPid.clear();
	}
	stats(pid, now) {
		const e = this.byPid.get(pid);
		if (!e) return null;
		const win = e.frames.filter((f) => f.at > now - WINDOW_MS);
		if (win.length === 0) return null;
		const last = win.filter((f) => f.at > now - 1e3);
		const recent = win.filter((f) => f.at > now - STUTTER_WINDOW_MS);
		const times = win.map((f) => f.ms).sort((a, b) => a - b);
		const median = quantile(times, .5);
		const threshold = Math.max(STUTTER_MIN_MS, median * STUTTER_FACTOR);
		const stutters = recent.filter((f) => f.ms > threshold).length;
		let low1 = null;
		if (times.length >= 100) {
			const worst = times.slice(Math.floor(times.length * .99));
			low1 = 1e3 / (worst.reduce((a, b) => a + b, 0) / worst.length);
		}
		return {
			fps: last.length > 0 ? 1e3 / (last.reduce((a, f) => a + f.ms, 0) / last.length) : null,
			avgMs: last.length > 0 ? last.reduce((a, f) => a + f.ms, 0) / last.length : null,
			maxMs: recent.length > 0 ? Math.max(...recent.map((f) => f.ms)) : null,
			p99Ms: times.length >= 100 ? quantile(times, .99) : null,
			low1Fps: low1,
			stutters10s: stutters,
			stutterThresholdMs: threshold
		};
	}
};
/** 解析 PresentMon 的 CSV 一行；表头里没有的列返回 null */
function makeRowParser(header) {
	const cols = header.trim().split(",");
	const iApp = cols.indexOf("Application");
	const iPid = cols.indexOf("ProcessID");
	const iDisp = cols.indexOf("MsBetweenDisplayChange");
	const iPres = cols.indexOf("MsBetweenPresents");
	if (iApp < 0 || iPid < 0 || iDisp < 0 && iPres < 0) return null;
	const num = (s) => {
		if (s == null || s === "NA" || s === "") return null;
		const v = Number(s);
		return Number.isFinite(v) ? v : null;
	};
	return (line) => {
		const f = line.split(",");
		const pid = num(f[iPid]);
		if (pid == null || pid <= 0) return null;
		const ms = (iDisp >= 0 ? num(f[iDisp]) : null) ?? (iPres >= 0 ? num(f[iPres]) : null);
		if (ms == null || ms <= 0) return null;
		return {
			name: f[iApp],
			pid,
			ms
		};
	};
}
//#endregion
//#region src/main/frametime/monitor.ts
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
//#endregion
//#region src/main/cooling/model.ts
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
//#endregion
//#region src/main/collectors/storage.ts
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
//#endregion
//#region src/main/collectors/publicIp.ts
var IPV4 = /\b(?:\d{1,3}\.){3}\d{1,3}\b/;
var TIMEOUT_MS = 6e3;
function nodeGet(url) {
	return new Promise((resolve) => {
		const req = https.get(url, {
			timeout: TIMEOUT_MS,
			agent: false
		}, (res) => {
			if (res.statusCode !== 200) {
				res.resume();
				resolve(null);
				return;
			}
			let body = "";
			res.setEncoding("utf8");
			res.on("data", (d) => {
				if (body.length < 4096) body += d;
			});
			res.on("end", () => resolve(body));
		});
		req.on("timeout", () => req.destroy());
		req.on("error", () => resolve(null));
	});
}
async function chromiumGet(url) {
	try {
		const res = await electron.net.fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
		return res.ok ? (await res.text()).slice(0, 4096) : null;
	} catch {
		return null;
	}
}
async function domesticIp() {
	for (const url of ["https://ip.3322.net", "https://myip.ipip.net"]) {
		const m = IPV4.exec(await nodeGet(url) ?? "");
		if (m) return m[0];
	}
	return null;
}
async function overseasIp() {
	const trace = await chromiumGet("https://1.1.1.1/cdn-cgi/trace") ?? "";
	const ip = /^ip=(.+)$/m.exec(trace)?.[1]?.trim();
	if (ip) return {
		ip,
		loc: /^loc=(.+)$/m.exec(trace)?.[1]?.trim() ?? null
	};
	const m = IPV4.exec(await chromiumGet("https://api.ipify.org") ?? "");
	return {
		ip: m ? m[0] : null,
		loc: null
	};
}
async function lookupPublicIps() {
	const [domestic, overseas] = await Promise.all([domesticIp(), overseasIp()]);
	return {
		domestic,
		overseas: overseas.ip,
		overseasLoc: overseas.loc
	};
}
//#endregion
//#region src/main/collectors/network.ts
var INTERNET_PROBE = {
	host: "223.5.5.5",
	port: 443
};
function resourcePath(file) {
	return electron.app.isPackaged ? (0, path.join)(process.resourcesPath, file) : (0, path.join)(electron.app.getAppPath(), "resources", file);
}
function tcpLatency(host, port, timeoutMs = 2e3) {
	return new Promise((resolve) => {
		const start = performance.now();
		const sock = net.connect({
			host,
			port
		});
		const finish = (v) => {
			sock.destroy();
			resolve(v);
		};
		sock.setTimeout(timeoutMs, () => finish(null));
		sock.once("connect", () => finish(Math.round(performance.now() - start)));
		sock.once("error", () => finish(null));
	});
}
async function pingLatency(host) {
	const { out } = await runCapture("ping.exe", [
		"-n",
		"1",
		"-w",
		"1000",
		host
	], 3e3);
	const m = /[=<]\s*(\d+)\s*ms/i.exec(decodeConsole(out));
	if (!m) return null;
	return Math.max(1, Number(m[1]));
}
var NetworkCollector = class {
	adapters = [];
	gatewayLatencyMs = null;
	internetLatencyMs = null;
	reach = null;
	wifi = null;
	publicIp = {
		domestic: null,
		overseas: null,
		overseasLoc: null,
		updatedAt: null
	};
	timers = [];
	stopped = true;
	busy = {
		info: false,
		probe: false,
		wifi: false,
		ip: false
	};
	start() {
		this.stopped = false;
		const every = (fn, ms) => {
			fn();
			this.timers.push(setInterval(() => void fn(), ms));
		};
		every(() => this.refreshAdapters(), 15e3);
		every(() => this.probe(), 5e3);
		every(() => this.refreshWifi(), 15e3);
		every(() => this.refreshPublicIp(), 6e4);
	}
	stop() {
		this.stopped = true;
		this.timers.forEach(clearInterval);
		this.timers = [];
	}
	get primaryGateway() {
		return this.pickPrimary()?.gateway ?? null;
	}
	pickPrimary() {
		const candidates = this.adapters.filter((a) => !a.virtual && a.ip4 && !a.ip4.startsWith("169.254."));
		const withGw = candidates.filter((a) => a.gateway);
		return (withGw.length > 0 ? withGw : candidates).sort((a, b) => (a.routeMetric ?? 9999) - (b.routeMetric ?? 9999))[0] ?? null;
	}
	async guarded(key, fn) {
		if (this.busy[key] || this.stopped) return;
		this.busy[key] = true;
		try {
			await fn();
		} finally {
			this.busy[key] = false;
		}
	}
	refreshAdapters() {
		return this.guarded("info", async () => {
			const { out, code } = await runCapture("powershell.exe", [
				"-NoProfile",
				"-NonInteractive",
				"-ExecutionPolicy",
				"Bypass",
				"-File",
				resourcePath("net-info.ps1")
			], 2e4);
			if (code !== 0) return;
			try {
				const raw = JSON.parse(out.toString("utf8").trim());
				this.adapters = raw.map((r) => ({
					name: String(r.name ?? ""),
					desc: String(r.desc ?? ""),
					index: Number(r.index ?? 0),
					mediaType: String(r.mediaType ?? ""),
					virtual: Boolean(r.virtual),
					linkMbps: typeof r.linkMbps === "number" && r.linkMbps > 0 ? r.linkMbps : null,
					ip4: r.ip4 ?? null,
					gateway: r.gateway ?? null,
					routeMetric: typeof r.routeMetric === "number" ? r.routeMetric : null,
					dns: Array.isArray(r.dns) ? r.dns.filter((x) => typeof x === "string" && x !== "") : []
				}));
			} catch {}
		});
	}
	probe() {
		return this.guarded("probe", async () => {
			const gw = this.primaryGateway;
			const [gwMs, netMs] = await Promise.all([gw ? pingLatency(gw) : Promise.resolve(null), tcpLatency(INTERNET_PROBE.host, INTERNET_PROBE.port)]);
			this.gatewayLatencyMs = gwMs;
			this.internetLatencyMs = netMs;
			this.reach = netMs != null ? "online" : gwMs != null ? "lan-only" : "offline";
		});
	}
	refreshWifi() {
		return this.guarded("wifi", async () => {
			if (!this.adapters.some((a) => /802\.11/.test(a.mediaType))) {
				this.wifi = null;
				return;
			}
			const { out } = await runCapture("netsh.exe", [
				"wlan",
				"show",
				"interfaces"
			], 5e3);
			const text = decodeConsole(out);
			const ssid = /^\s*SSID\s*:\s*(.+)$/m.exec(text)?.[1]?.trim() ?? null;
			const sig = /(?:Signal|信号)\s*:\s*(\d+)\s*%/i.exec(text)?.[1];
			this.wifi = {
				ssid,
				signalPercent: sig != null ? Number(sig) : null
			};
		});
	}
	refreshPublicIp() {
		return this.guarded("ip", async () => {
			const r = await lookupPublicIps();
			this.publicIp = {
				...r,
				updatedAt: Date.now()
			};
		});
	}
};
//#endregion
//#region src/main/collectors/pdh.ts
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
//#endregion
//#region src/main/collectors/power.ts
function computePower(cpuW, gpuW, otherW, wall) {
	const measured = wall?.getWatts() ?? null;
	if (wall && measured != null) return {
		totalW: measured,
		cpuW,
		gpuW,
		otherW,
		source: "smart-plug"
	};
	return {
		totalW: cpuW == null ? null : cpuW + (gpuW ?? 0) + otherW,
		cpuW,
		gpuW,
		otherW,
		source: "estimate"
	};
}
//#endregion
//#region src/main/collectors/clash.ts
var PIPE_DIR = "\\\\.\\pipe\\";
var PROXIES_TTL_MS = 15e3;
var appKey = (name) => name.toLowerCase().replace(/\.exe$/, "");
function findPipe() {
	try {
		const names = fs.readdirSync(PIPE_DIR).filter((n) => /^verge-mihomo/i.test(n));
		return names.find((n) => /production/i.test(n)) ?? names[0] ?? null;
	} catch {
		return null;
	}
}
function apiGet(pipe, path) {
	return new Promise((resolve, reject) => {
		const req = http.request({
			socketPath: PIPE_DIR + pipe,
			path,
			method: "GET",
			timeout: 2500
		}, (res) => {
			let body = "";
			res.setEncoding("utf8");
			res.on("data", (d) => body += d);
			res.on("end", () => {
				if (res.statusCode !== 200) return reject(/* @__PURE__ */ new Error(`HTTP ${res.statusCode}`));
				try {
					resolve(JSON.parse(body));
				} catch (e) {
					reject(e);
				}
			});
		});
		req.on("timeout", () => req.destroy(/* @__PURE__ */ new Error("timeout")));
		req.on("error", reject);
		req.end();
	});
}
var ClashPoller = class {
	info = null;
	appRates = null;
	version = null;
	totals = null;
	proxies = null;
	prevConns = /* @__PURE__ */ new Map();
	busy = false;
	async poll() {
		if (this.busy) return;
		this.busy = true;
		try {
			await this.doPoll();
		} finally {
			this.busy = false;
		}
	}
	async lookupRoute(hosts) {
		const pipe = findPipe();
		if (!pipe) return null;
		try {
			const wanted = hosts.map((h) => h.toLowerCase());
			const hit = ((await apiGet(pipe, "/connections")).connections ?? []).filter((c) => {
				const h = (c.metadata?.host || c.metadata?.sniffHost || "").toLowerCase();
				return wanted.includes(h);
			}).sort((a, b) => (b.start ?? "").localeCompare(a.start ?? ""))[0];
			if (!hit) return null;
			const leaf = hit.chains?.[0];
			return !leaf || leaf === "DIRECT" ? "直连" : `经 ${leaf}`;
		} catch {
			return null;
		}
	}
	async doPoll() {
		const pipe = findPipe();
		if (!pipe) {
			this.info = null;
			this.appRates = null;
			this.version = null;
			this.totals = null;
			this.prevConns.clear();
			return;
		}
		try {
			const [cfg, conns] = await Promise.all([apiGet(pipe, "/configs"), apiGet(pipe, "/connections")]);
			if (!this.version) this.version = (await apiGet(pipe, "/version").catch(() => null))?.version ?? null;
			const now = Date.now();
			if (!this.proxies || now - this.proxies.t > PROXIES_TTL_MS) {
				const p = await apiGet(pipe, "/proxies").catch(() => null);
				if (p?.proxies) this.proxies = {
					t: now,
					map: p.proxies
				};
			}
			const list = conns.connections ?? [];
			const up0 = conns.uploadTotal ?? 0;
			const down0 = conns.downloadTotal ?? 0;
			const dt = this.totals ? (now - this.totals.t) / 1e3 : 0;
			let up = null;
			let down = null;
			if (this.totals && dt > 0 && up0 >= this.totals.up && down0 >= this.totals.down) {
				up = (up0 - this.totals.up) / dt;
				down = (down0 - this.totals.down) / dt;
			}
			const rates = /* @__PURE__ */ new Map();
			const nextConns = /* @__PURE__ */ new Map();
			for (const c of list) {
				if (!c.id) continue;
				const cu = c.upload ?? 0;
				const cd = c.download ?? 0;
				nextConns.set(c.id, {
					up: cu,
					down: cd
				});
				const proc = c.metadata?.process;
				if (!proc || dt <= 0) continue;
				const prev = this.prevConns.get(c.id);
				const du = prev ? Math.max(0, cu - prev.up) : cu;
				const dd = prev ? Math.max(0, cd - prev.down) : cd;
				const key = appKey(proc);
				const r = rates.get(key) ?? {
					name: proc,
					up: 0,
					down: 0
				};
				r.up += du / dt;
				r.down += dd / dt;
				rates.set(key, r);
			}
			this.prevConns = nextConns;
			this.totals = {
				up: up0,
				down: down0,
				t: now
			};
			this.appRates = dt > 0 ? rates : null;
			const counts = /* @__PURE__ */ new Map();
			let direct = 0;
			for (const c of list) {
				const leaf = c.chains?.[0];
				if (!leaf || leaf === "DIRECT" || leaf === "REJECT") direct++;
				else counts.set(leaf, (counts.get(leaf) ?? 0) + 1);
			}
			const nodes = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, connections]) => {
				const entry = this.proxies?.map[name];
				const delay = [...entry?.history ?? []].reverse().find((h) => (h.delay ?? 0) > 0)?.delay ?? null;
				return {
					name,
					type: entry?.type ?? null,
					delayMs: delay,
					connections
				};
			});
			this.info = {
				available: true,
				reason: null,
				version: this.version,
				mode: cfg.mode ?? null,
				tun: cfg.tun?.enable ?? null,
				mixedPort: cfg["mixed-port"] ?? null,
				connections: list.length,
				directConnections: direct,
				upBytesPerSec: up,
				downBytesPerSec: down,
				nodes
			};
		} catch (e) {
			this.appRates = null;
			this.info = {
				available: false,
				reason: e instanceof Error ? e.message : String(e),
				version: this.version,
				mode: null,
				tun: null,
				mixedPort: null,
				connections: 0,
				directConnections: 0,
				upBytesPerSec: null,
				downBytesPerSec: null,
				nodes: []
			};
		}
	}
};
//#endregion
//#region src/main/collectors/processes.ts
var TOP = 10;
var sortBy = (rows, pick) => [...rows].sort((a, b) => pick(b) - pick(a)).slice(0, TOP);
function buildProcessMetrics(raw, logicalCores, clashRates, connCounts) {
	const cpuList = raw.procCpu ?? [];
	const memList = raw.procMem ?? [];
	const pidList = raw.procPid ?? [];
	const ioRList = raw.procIoR ?? [];
	const ioWList = raw.procIoW ?? [];
	const cores = Math.max(1, logicalCores);
	const procs = [];
	for (let i = 0; i < cpuList.length; i++) {
		const [name, c] = cpuList[i];
		const lower = name.toLowerCase();
		if (lower === "_total" || lower === "idle") continue;
		const m = memList[i];
		const p = pidList[i];
		const aligned = m?.[0] === name && p?.[0] === name;
		const r = ioRList[i];
		const w = ioWList[i];
		const ioAligned = r?.[0] === name && w?.[0] === name && r[1] != null && w[1] != null;
		procs.push({
			name,
			count: 1,
			pid: aligned ? p[1] : null,
			cpuPercent: c == null ? null : Math.min(100, Math.max(0, c / cores)),
			memBytes: aligned ? m[1] : null,
			netDownBytesPerSec: null,
			netUpBytesPerSec: null,
			netConns: null,
			ioBytesPerSec: ioAligned ? r[1] + w[1] : null
		});
	}
	const groups = /* @__PURE__ */ new Map();
	for (const p of procs) {
		const g = groups.get(appKey(p.name));
		if (!g) groups.set(appKey(p.name), {
			...p,
			pid: null
		});
		else {
			g.count++;
			g.cpuPercent = (g.cpuPercent ?? 0) + (p.cpuPercent ?? 0);
			g.memBytes = (g.memBytes ?? 0) + (p.memBytes ?? 0);
			if (p.ioBytesPerSec != null) g.ioBytesPerSec = (g.ioBytesPerSec ?? 0) + p.ioBytesPerSec;
		}
	}
	const apps = [...groups.values()];
	let net;
	let netSource;
	if (clashRates) {
		netSource = "clash";
		net = [...clashRates.entries()].map(([key, r]) => {
			const g = groups.get(key);
			return {
				name: g?.name ?? r.name.replace(/\.exe$/i, ""),
				count: g?.count ?? 1,
				pid: null,
				cpuPercent: g?.cpuPercent ?? null,
				memBytes: g?.memBytes ?? null,
				netDownBytesPerSec: r.down,
				netUpBytesPerSec: r.up,
				netConns: null,
				ioBytesPerSec: g?.ioBytesPerSec ?? null
			};
		}).filter((r) => (r.netDownBytesPerSec ?? 0) + (r.netUpBytesPerSec ?? 0) > 0);
		net = sortBy(net, (r) => (r.netDownBytesPerSec ?? 0) + (r.netUpBytesPerSec ?? 0));
	} else {
		netSource = "connections";
		net = sortBy(apps.map((g) => ({
			...g,
			netConns: connCounts.get(appKey(g.name)) ?? 0
		})).filter((g) => g.netConns > 0), (r) => r.netConns ?? 0);
	}
	const lists = (rows) => ({
		cpu: sortBy(rows, (r) => r.cpuPercent ?? 0),
		mem: sortBy(rows, (r) => r.memBytes ?? 0),
		net,
		io: sortBy(rows, (r) => r.ioBytesPerSec ?? 0)
	});
	return {
		apps: lists(apps),
		procs: lists(procs),
		netSource
	};
}
//#endregion
//#region src/main/collectors/proxy.ts
var CLIENT_RE = /^(clash-verge|clash-verge-service|verge-mihomo|mihomo|clash-meta|clash|clash-win64|mihomo-party|flclash|clash for windows|clash-nyanpasu|v2rayn|xray|v2ray|sing-box|nekoray|nekobox|hiddify|wireguard|wg|openvpn|openvpn-gui|openvpnserv2?|tailscaled|tailscale-ipn|zerotier-one_x64|shadowsocks|ss-local|trojan|hysteria2?|etalien|etalien_launcher|qv2ray)\.exe$/i;
var PORT_HINTS = {
	1080: "SOCKS5",
	1081: "SOCKS5",
	1194: "OpenVPN",
	7890: "HTTP / 混合代理",
	7891: "SOCKS5",
	7892: "透明代理",
	7897: "混合代理",
	8080: "HTTP",
	9090: "控制器",
	9097: "控制器",
	10808: "SOCKS5",
	10809: "HTTP",
	20170: "HTTP",
	20171: "SOCKS5",
	51820: "WireGuard"
};
var REMOTE_GUESS = {
	22: "SSH",
	53: "DNS",
	80: "HTTP",
	443: "TLS",
	853: "DoT",
	1194: "OpenVPN",
	8388: "Shadowsocks",
	8443: "TLS",
	51820: "WireGuard"
};
var NOISE_PORTS = /* @__PURE__ */ new Set([
	53,
	123,
	137,
	138,
	1900,
	5050,
	5353,
	5355
]);
var REG_KEY = "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings";
function splitEndpoint(s) {
	const i = s.lastIndexOf(":");
	return [s.slice(0, i).replace(/^\[|\]$/g, ""), Number(s.slice(i + 1))];
}
function parseNetstat(text) {
	const rows = [];
	for (const line of text.split(/\r?\n/)) {
		const t = line.trim().split(/\s+/);
		if (t[0] === "TCP" && t.length >= 5) {
			const [localIp, localPort] = splitEndpoint(t[1]);
			const [remoteIp, remotePort] = splitEndpoint(t[2]);
			rows.push({
				proto: "TCP",
				localIp,
				localPort,
				remoteIp,
				remotePort,
				state: t[3],
				pid: Number(t[4])
			});
		} else if (t[0] === "UDP" && t.length >= 4) {
			const [localIp, localPort] = splitEndpoint(t[1]);
			rows.push({
				proto: "UDP",
				localIp,
				localPort,
				remoteIp: "",
				remotePort: 0,
				state: "",
				pid: Number(t[t.length - 1])
			});
		}
	}
	return rows;
}
function parseTasklist(text) {
	const map = /* @__PURE__ */ new Map();
	for (const line of text.split(/\r?\n/)) {
		const f = line.trim().replace(/^"|"$/g, "").split("\",\"");
		if (f.length < 5) continue;
		const pid = Number(f[1]);
		const memKB = Number(f[4].replace(/[^\d]/g, ""));
		if (Number.isFinite(pid)) map.set(pid, {
			name: f[0],
			memKB: Number.isFinite(memKB) ? memKB : 0
		});
	}
	return map;
}
function isPublicIp(ip) {
	if (ip.includes(":")) {
		const l = ip.toLowerCase();
		return !(l === "::" || l === "::1" || l.startsWith("fe80") || l.startsWith("fc") || l.startsWith("fd"));
	}
	const p = ip.split(".").map(Number);
	if (p.length !== 4 || p.some((n) => !Number.isFinite(n))) return false;
	const [a, b] = p;
	if (a === 0 || a === 10 || a === 127 || a >= 224) return false;
	if (a === 169 && b === 254) return false;
	if (a === 172 && b >= 16 && b <= 31) return false;
	if (a === 192 && b === 168) return false;
	if (a === 198 && (b === 18 || b === 19)) return false;
	return true;
}
function kindOf(image) {
	const n = image.toLowerCase();
	if (/clash|mihomo|nyanpasu|flclash/.test(n)) return "Clash / mihomo";
	if (/v2ray|xray|qv2ray/.test(n)) return "V2Ray / Xray";
	if (/sing-box|nekoray|nekobox|hiddify/.test(n)) return "sing-box 系";
	if (/wireguard|^wg/.test(n)) return "WireGuard";
	if (/openvpn/.test(n)) return "OpenVPN";
	if (/tailscale/.test(n)) return "Tailscale";
	if (/zerotier/.test(n)) return "ZeroTier";
	if (/etalien/.test(n)) return "游戏加速器";
	return "代理客户端";
}
function parseSystemProxy(text) {
	const val = (key) => new RegExp(`^\\s+${key}\\s+REG_\\w+\\s+(.*)$`, "im").exec(text)?.[1]?.trim() ?? null;
	const enable = val("ProxyEnable");
	return {
		enabled: enable != null && Number.parseInt(enable, 16) === 1,
		server: val("ProxyServer"),
		pacUrl: val("AutoConfigURL"),
		bypass: val("ProxyOverride")
	};
}
var ProxyCollector = class {
	clients = [];
	systemProxy = null;
	clash = new ClashPoller();
	connCounts = /* @__PURE__ */ new Map();
	timer = null;
	clashTimer = null;
	busy = false;
	start() {
		this.refresh();
		this.timer = setInterval(() => void this.refresh(), 5e3);
		this.clash.poll();
		this.clashTimer = setInterval(() => void this.clash.poll(), 2e3);
	}
	stop() {
		if (this.timer) clearInterval(this.timer);
		if (this.clashTimer) clearInterval(this.clashTimer);
		this.timer = null;
		this.clashTimer = null;
	}
	async refresh() {
		if (this.busy) return;
		this.busy = true;
		try {
			const [ns, tl, reg] = await Promise.all([
				runCapture("netstat.exe", ["-ano"], 8e3),
				runCapture("tasklist.exe", [
					"/fo",
					"csv",
					"/nh"
				], 8e3),
				runCapture("reg.exe", ["query", REG_KEY], 4e3)
			]);
			const rows = parseNetstat(ns.out.toString("latin1"));
			const tasks = parseTasklist(tl.out.toString("latin1"));
			if (reg.code === 0) this.systemProxy = parseSystemProxy(reg.out.toString("latin1"));
			const byImage = /* @__PURE__ */ new Map();
			for (const [pid, t] of tasks) {
				if (!CLIENT_RE.test(t.name)) continue;
				const g = byImage.get(t.name) ?? {
					pids: [],
					memKB: 0
				};
				g.pids.push(pid);
				g.memKB += t.memKB;
				byImage.set(t.name, g);
			}
			this.clients = [...byImage.entries()].map(([name, g]) => this.buildClient(name, g, rows));
			const counts = /* @__PURE__ */ new Map();
			for (const r of rows) {
				if (r.proto !== "TCP" || r.state !== "ESTABLISHED") continue;
				const t = tasks.get(r.pid);
				if (t) counts.set(appKey(t.name), (counts.get(appKey(t.name)) ?? 0) + 1);
			}
			this.connCounts = counts;
		} finally {
			this.busy = false;
		}
	}
	buildClient(name, g, rows) {
		const pids = new Set(g.pids);
		const mine = rows.filter((r) => pids.has(r.pid));
		const ports = /* @__PURE__ */ new Map();
		for (const r of mine) {
			if (!(r.proto === "UDP" || r.state === "LISTENING") || NOISE_PORTS.has(r.localPort)) continue;
			const hint = PORT_HINTS[r.localPort] ?? null;
			if (r.localPort >= 49152 && !hint) continue;
			const scope = r.localIp === "127.0.0.1" || r.localIp === "::1" ? "local" : "lan";
			const key = `${r.proto}${r.localPort}`;
			const prev = ports.get(key);
			if (!prev || prev.scope === "local" && scope === "lan") ports.set(key, {
				port: r.localPort,
				proto: r.proto,
				scope,
				hint
			});
		}
		const remotes = /* @__PURE__ */ new Map();
		for (const r of mine) {
			if (r.proto !== "TCP" || r.state !== "ESTABLISHED" || !isPublicIp(r.remoteIp)) continue;
			const key = `${r.remoteIp}:${r.remotePort}`;
			const prev = remotes.get(key);
			if (prev) prev.count++;
			else remotes.set(key, {
				ip: r.remoteIp,
				port: r.remotePort,
				count: 1,
				guess: REMOTE_GUESS[r.remotePort] ?? null
			});
		}
		return {
			name,
			kind: kindOf(name),
			pids: g.pids,
			memBytes: g.memKB * 1024,
			ports: [...ports.values()].sort((a, b) => a.port - b.port),
			remotes: [...remotes.values()].sort((a, b) => b.count - a.count).slice(0, 8)
		};
	}
};
var GLOBAL_TUNNELS = /* @__PURE__ */ new Set([
	"TUN",
	"TAP / OpenVPN",
	"WireGuard",
	"VPN"
]);
var CLASH_MODE = {
	rule: "规则分流",
	global: "全局",
	direct: "直连模式"
};
function describeRoute(p) {
	const tun = p.tunnels.some((t) => GLOBAL_TUNNELS.has(t.kind));
	const sys = p.systemProxy?.enabled === true;
	const core = p.clients.find((c) => c.ports.length > 0)?.kind ?? p.tunnels.find((t) => GLOBAL_TUNNELS.has(t.kind))?.kind ?? null;
	const node = p.clash?.available && p.clash.nodes[0] ? ` → ${p.clash.nodes[0].name}` : "";
	const mode = p.clash?.mode ? `（${CLASH_MODE[p.clash.mode] ?? p.clash.mode}）` : "";
	const via = `${core ?? "代理"}${node}${mode}`;
	if (sys && tun) return {
		mode: "system-proxy+tun",
		text: `系统代理 ${p.systemProxy?.server ?? ""} + TUN → ${via}`
	};
	if (sys) return {
		mode: "system-proxy",
		text: `系统代理 ${p.systemProxy?.server ?? ""} → ${via}`
	};
	if (tun) return {
		mode: "tun",
		text: `TUN 接管流量 → ${via}`
	};
	return {
		mode: "direct",
		text: "直连：未检测到生效的代理或 VPN"
	};
}
//#endregion
//#region src/main/collectors/quality.ts
var HISTORY = 60;
var INTERVAL_MS = 2e3;
var QualityCollector = class {
	timer = null;
	busy = false;
	probes;
	constructor(gateway) {
		this.probes = [
			{
				id: "gateway",
				label: "网关",
				host: gateway,
				run: (h) => pingLatency(h),
				history: []
			},
			{
				id: "domestic",
				label: "国内（阿里 DNS）",
				host: () => "223.5.5.5",
				run: (h) => tcpLatency(h, 443),
				history: []
			},
			{
				id: "overseas",
				label: "海外（Cloudflare）",
				host: () => "1.1.1.1",
				run: (h) => tcpLatency(h, 443),
				history: []
			}
		];
	}
	start() {
		this.tick();
		this.timer = setInterval(() => void this.tick(), INTERVAL_MS);
	}
	stop() {
		if (this.timer) clearInterval(this.timer);
		this.timer = null;
	}
	async tick() {
		if (this.busy) return;
		this.busy = true;
		try {
			await Promise.all(this.probes.map(async (p) => {
				const host = p.host();
				if (!host) return;
				const ms = await p.run(host);
				p.history.push(ms);
				if (p.history.length > HISTORY) p.history.shift();
			}));
		} finally {
			this.busy = false;
		}
	}
	get() {
		return { targets: this.probes.map((p) => {
			const ok = p.history.filter((v) => v != null);
			return {
				id: p.id,
				label: p.label,
				host: p.host() ?? "--",
				latencyMs: p.history.length > 0 ? p.history[p.history.length - 1] : null,
				avgMs: ok.length > 0 ? Math.round(ok.reduce((a, b) => a + b, 0) / ok.length) : null,
				lossPercent: p.history.length > 0 ? (p.history.length - ok.length) / p.history.length * 100 : 0,
				history: [...p.history]
			};
		}) };
	}
};
//#endregion
//#region src/main/collectors/tunnels.ts
var RULES$1 = [
	[/wintun|meta tunnel|mihomo|clash|sing-?tun|\btun\b/i, "TUN"],
	[/wireguard|nordlynx/i, "WireGuard"],
	[/tap-windows|tap0901|openvpn|ovpn|wintap/i, "TAP / OpenVPN"],
	[/tailscale/i, "Tailscale"],
	[/zerotier/i, "ZeroTier"],
	[/hamachi/i, "Hamachi"],
	[/\bvpn\b|proton|expressvpn|surfshark/i, "VPN"]
];
function tunnelKind(name, description) {
	const text = `${name} ${description}`;
	for (const [re, label] of RULES$1) if (re.test(text)) return label;
	return null;
}
//#endregion
//#region src/main/collectors/scheduler.ts
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
//#endregion
//#region src/main/history/metrics.ts
var num$1 = (v) => v != null && Number.isFinite(v) ? v : null;
var maxOf = (a, b) => a == null && b == null ? null : Math.max(a ?? 0, b ?? 0);
var sumOf = (a, b) => a == null && b == null ? null : (a ?? 0) + (b ?? 0);
var maxCoreUsage = (s) => {
	const u = s.cpu.cores.map((c) => c.usage).filter((v) => v != null);
	return u.length > 0 ? Math.max(...u) : null;
};
function snapshotMetrics(s) {
	const m = (key, label, unit, group, value) => ({
		key,
		label,
		unit,
		group,
		value: num$1(value)
	});
	return [
		m("cpu.usage", "CPU 使用率", "%", "CPU", s.cpu.usage),
		m("cpu.temp", "CPU 温度", "°C", "CPU", s.cpu.tempC),
		m("cpu.power", "CPU 封装功耗", "W", "CPU", s.cpu.packagePowerW),
		m("cpu.freq", "CPU 频率", "GHz", "CPU", s.cpu.freqGHz),
		m("gpu.usage", "GPU 使用率", "%", "GPU", s.gpu.usage),
		m("gpu.temp", "GPU 温度", "°C", "GPU", s.gpu.tempC),
		m("gpu.power", "GPU 功耗", "W", "GPU", s.gpu.powerW),
		m("gpu.mem", "GPU 显存占用", "%", "GPU", s.gpu.memPercent),
		m("mem.usage", "内存使用率", "%", "内存", s.memory.usagePercent),
		m("disk.busy", "磁盘忙碌程度", "%", "磁盘", s.disk.busyPercent),
		m("disk.read", "磁盘读取速度", "B/s", "磁盘", s.disk.readBytesPerSec),
		m("disk.write", "磁盘写入速度", "B/s", "磁盘", s.disk.writeBytesPerSec),
		m("net.rx", "下行速度", "B/s", "网络", s.network.rxBytesPerSec),
		m("net.tx", "上行速度", "B/s", "网络", s.network.txBytesPerSec),
		m("net.latency", "外网延迟", "ms", "网络", s.network.internetLatencyMs),
		m("net.gateway", "网关延迟", "ms", "网络", s.network.gatewayLatencyMs),
		m("power.total", "整机功耗（估算）", "W", "功耗", s.power.totalW),
		m("cpu.maxCore", "CPU 最忙核心占用", "%", "CPU", maxCoreUsage(s)),
		m("perf.procQueue", "处理器队列", "个", "诊断", s.perf.processorQueue),
		m("perf.cpuLimit", "CPU 性能上限", "%", "诊断", s.perf.perfLimitPct),
		m("perf.diskMs", "磁盘响应时间（最慢的盘）", "ms", "诊断", maxOf(s.perf.diskReadMs, s.perf.diskWriteMs)),
		m("perf.diskQueue", "磁盘队列长度", "个", "诊断", s.perf.diskQueue),
		m("perf.hardFaults", "硬缺页", "次/秒", "诊断", s.perf.hardFaultsPerSec),
		m("perf.dpc", "驱动延迟（DPC + 中断）", "%", "诊断", sumOf(s.perf.dpcPct, s.perf.interruptPct)),
		m("frame.fps", "前台程序帧率", "FPS", "帧时间", s.frames.fps),
		m("frame.avg", "前台程序平均帧时间", "ms", "帧时间", s.frames.avgMs),
		m("frame.max", "前台程序最大帧时间（最近 10 秒）", "ms", "帧时间", s.frames.maxMs),
		m("frame.p99", "前台程序帧时间 99 百分位", "ms", "帧时间", s.frames.p99Ms),
		m("frame.stutter", "前台程序卡顿帧数（最近 10 秒）", "次", "帧时间", s.frames.state === "running" ? s.frames.stutters10s : null),
		...s.storage.flatMap((d) => [m(`ssd.media:${d.name}`, `${d.name} 介质错误累计`, "次", "SSD", d.mediaErrors), m(`ssd.unsafe:${d.name}`, `${d.name} 意外断电累计`, "次", "SSD", d.unsafeShutdowns)])
	];
}
function sensorMetrics(sensors) {
	const out = [];
	for (const s of sensors) if (s.type === "Fan" && s.unit === "RPM") {
		const prefix = s.id.startsWith("/lpc/") ? "主板 " : s.id.startsWith("/gpu-") ? "显卡 " : "";
		out.push({
			key: `lhm:${s.id}`,
			label: `${prefix}${s.name} 转速`,
			unit: "RPM",
			group: "风扇",
			value: num$1(s.value)
		});
	} else if (s.type === "Temperature" && /^\/(nvme|ssd|hdd)\/\d+\/temperature\/0$/.test(s.id)) out.push({
		key: `lhm:${s.id}`,
		label: `${s.hardware} 温度`,
		unit: "°C",
		group: "SSD",
		value: num$1(s.value)
	});
	else if (s.type === "Temperature" && /^\/lpc\//.test(s.id)) out.push({
		key: `lhm:${s.id}`,
		label: `主板传感器 ${s.name}`,
		unit: "°C",
		group: "主板",
		value: num$1(s.value)
	});
	else if (s.type === "Control" && s.unit === "%" && /^\/lpc\//.test(s.id)) out.push({
		key: `lhm:${s.id}`,
		label: `主板 ${s.name} 控制值`,
		unit: "%",
		group: "风扇",
		value: num$1(s.value)
	});
	else if (s.type === "Temperature" && /^\/memory\/dimm\/\d+\/temperature\/0$/.test(s.id)) {
		const slot = /\(#\d+\)$/.exec(s.hardware)?.[0] ?? "";
		out.push({
			key: `lhm:${s.id}`,
			label: `内存条 ${slot} 温度`,
			unit: "°C",
			group: "内存",
			value: num$1(s.value)
		});
	}
	return out;
}
function makeEventSnapshot(s, values) {
	const metrics = {};
	for (const v of values) metrics[v.key] = v.value;
	return {
		ts: s.ts,
		cpu: s.processes.apps.cpu.slice(0, 5),
		mem: s.processes.apps.mem.slice(0, 5),
		net: s.processes.apps.net.slice(0, 5),
		io: s.processes.apps.io.slice(0, 5),
		metrics
	};
}
//#endregion
//#region src/main/history/store.ts
var RAW_STEP = 5e3;
var MINUTE_STEP = 6e4;
var HOUR = 36e5;
var DAY = 864e5;
var RAW_QUERY_LIMIT = 6 * HOUR;
var SCHEMA = `
create table if not exists series(
  id integer primary key,
  key text unique not null,
  label text not null,
  unit text not null,
  grp text not null
);
create table if not exists s5(
  sid integer not null, ts integer not null,
  vmin real not null, vmax real not null, vavg real not null, n integer not null,
  primary key(sid, ts)
) without rowid;
create table if not exists m1(
  sid integer not null, ts integer not null,
  vmin real not null, vmax real not null, vavg real not null, n integer not null,
  primary key(sid, ts)
) without rowid;
create table if not exists events(
  id integer primary key autoincrement,
  kind text not null, key text not null, severity text not null,
  title text not null, detail text not null default '', confidence text, extra text,
  ts_start integer not null, ts_end integer
);
create index if not exists ix_events_start on events(ts_start);
create table if not exists event_snap(
  event_id integer primary key references events(id) on delete cascade,
  json text not null
);
`;
var UPSERT_SAMPLE = (table) => `
insert into ${table}(sid, ts, vmin, vmax, vavg, n) values (?, ?, ?, ?, ?, ?)
on conflict(sid, ts) do update set
  vmin = min(vmin, excluded.vmin),
  vmax = max(vmax, excluded.vmax),
  vavg = (vavg * n + excluded.vavg * excluded.n) / (n + excluded.n),
  n = n + excluded.n`;
function parseEvent(r) {
	let extra = null;
	try {
		extra = r.extra ? JSON.parse(r.extra) : null;
	} catch {
		extra = null;
	}
	return {
		...r,
		extra
	};
}
var CORRUPT_RE = /corrupt|malformed|not a database|disk image/i;
var csv = (v) => {
	if (v == null) return "";
	const s = String(v);
	return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, "\"\"")}"` : s;
};
var HistoryStore = class {
	db = null;
	dir;
	file;
	cfg;
	sids = /* @__PURE__ */ new Map();
	labels = /* @__PURE__ */ new Map();
	rawBucket = 0;
	rawAgg = /* @__PURE__ */ new Map();
	minuteBucket = 0;
	minuteAgg = /* @__PURE__ */ new Map();
	lastMaintain = 0;
	lastRecover = 0;
	lastError = null;
	upsertSeries = null;
	upsertRaw = null;
	upsertMinute = null;
	constructor(dir, cfg) {
		this.dir = dir;
		this.file = (0, node_path.join)(dir, "history.db");
		this.cfg = cfg;
	}
	open() {
		node_fs.mkdirSync(this.dir, { recursive: true });
		try {
			this.openDb();
		} catch (e) {
			this.recover(e);
		}
	}
	close() {
		try {
			this.flushAll();
		} catch {}
		try {
			this.db?.close();
		} catch {}
		this.db = null;
	}
	applySettings(cfg) {
		const wasEnabled = this.cfg.enabled;
		this.cfg = cfg;
		if (wasEnabled && !cfg.enabled) this.safely(() => this.flushAll());
		if (cfg.enabled) this.safely(() => this.maintain(Date.now()));
	}
	record(ts, values) {
		if (!this.db || !this.cfg.enabled) return;
		this.safely(() => {
			const bucket = Math.floor(ts / RAW_STEP) * RAW_STEP;
			if (this.rawBucket === 0) this.rawBucket = bucket;
			if (bucket > this.rawBucket) {
				this.flushRaw();
				this.rawBucket = bucket;
			}
			for (const m of values) {
				if (m.value == null) continue;
				const sid = this.ensureSeries(m);
				const a = this.rawAgg.get(sid);
				if (a) {
					a.min = Math.min(a.min, m.value);
					a.max = Math.max(a.max, m.value);
					a.sum += m.value;
					a.n += 1;
				} else this.rawAgg.set(sid, {
					min: m.value,
					max: m.value,
					sum: m.value,
					n: 1
				});
			}
			if (ts - this.lastMaintain > HOUR) this.maintain(ts);
		});
	}
	ensureSeries(m) {
		const cached = this.sids.get(m.key);
		if (cached !== void 0 && this.labels.get(m.key) === m.label) return cached;
		const row = this.upsertSeries.get(m.key, m.label, m.unit, m.group);
		this.sids.set(m.key, row.id);
		this.labels.set(m.key, m.label);
		return row.id;
	}
	flushRaw() {
		if (this.rawAgg.size === 0) return;
		const rows = [...this.rawAgg.entries()];
		this.rawAgg.clear();
		const bucket = this.rawBucket;
		const minute = Math.floor(bucket / MINUTE_STEP) * MINUTE_STEP;
		this.tx(() => {
			if (this.minuteBucket !== 0 && minute > this.minuteBucket) this.writeMinute();
			if (this.minuteBucket === 0 || minute > this.minuteBucket) this.minuteBucket = minute;
			for (const [sid, a] of rows) {
				this.upsertRaw.run(sid, bucket, a.min, a.max, a.sum / a.n, a.n);
				const m = this.minuteAgg.get(sid);
				if (m) {
					m.min = Math.min(m.min, a.min);
					m.max = Math.max(m.max, a.max);
					m.sum += a.sum;
					m.n += a.n;
				} else this.minuteAgg.set(sid, { ...a });
			}
		});
	}
	writeMinute() {
		for (const [sid, a] of this.minuteAgg) this.upsertMinute.run(sid, this.minuteBucket, a.min, a.max, a.sum / a.n, a.n);
		this.minuteAgg.clear();
	}
	flushAll() {
		if (!this.db) return;
		this.flushRaw();
		if (this.minuteAgg.size > 0) this.tx(() => this.writeMinute());
	}
	maintain(now) {
		this.lastMaintain = now;
		const c = this.cfg;
		this.tx(() => {
			this.db.prepare("delete from s5 where ts < ?").run(now - c.rawHours * HOUR);
			this.db.prepare("delete from m1 where ts < ?").run(now - c.minuteDays * DAY);
			this.db.prepare("delete from events where ts_start < ?").run(now - c.eventDays * DAY);
		});
		const cap = c.maxMB * 1024 * 1024;
		for (let i = 0; i < 8 && this.fileBytes() > cap; i++) {
			for (const t of ["s5", "m1"]) this.db.prepare(`delete from ${t} where ts <= (select ts from ${t} order by ts limit 1 offset (select count(*) / 10 from ${t}))`).run();
			this.db.exec("pragma wal_checkpoint(TRUNCATE); pragma incremental_vacuum;");
		}
		this.db.exec("pragma incremental_vacuum;");
	}
	fileBytes() {
		let total = 0;
		for (const f of [this.file, `${this.file}-wal`]) try {
			total += node_fs.statSync(f).size;
		} catch {}
		return total;
	}
	series() {
		if (!this.db) return [];
		return this.db.prepare("select key, label, unit, grp as \"group\" from series order by grp, key").all();
	}
	query(q, now = Date.now()) {
		const from = Math.floor(q.from);
		const to = Math.max(from + 1, Math.floor(q.to));
		const range = to - from;
		const maxPoints = Math.min(2e3, Math.max(50, Math.floor(q.maxPoints)));
		const tier = range <= RAW_QUERY_LIMIT && from >= now - this.cfg.rawHours * HOUR - RAW_STEP ? "raw" : "minute";
		const table = tier === "raw" ? "s5" : "m1";
		const step = tier === "raw" ? RAW_STEP : MINUTE_STEP;
		const bucket = Math.max(step, Math.ceil(range / maxPoints / step) * step);
		const start = Math.floor(from / bucket) * bucket;
		const count = Math.min(maxPoints + 2, Math.ceil((to - start) / bucket));
		const ts = Array.from({ length: count }, (_, i) => start + i * bucket);
		const empty = () => ({
			from,
			to,
			stepMs: bucket,
			tier,
			ts,
			series: q.keys.map((key) => ({
				key,
				min: ts.map(() => null),
				max: ts.map(() => null),
				avg: ts.map(() => null)
			})),
			coverageStart: null
		});
		if (!this.db || q.keys.length === 0) return empty();
		const ph = q.keys.map(() => "?").join(",");
		const idRows = this.db.prepare(`select id, key from series where key in (${ph})`).all(...q.keys);
		if (idRows.length === 0) return empty();
		const keyOf = new Map(idRows.map((r) => [r.id, r.key]));
		const sidPh = idRows.map(() => "?").join(",");
		const sids = idRows.map((r) => r.id);
		const rows = this.db.prepare(`select sid, (ts / cast(? as integer)) * cast(? as integer) as b,
                min(vmin) as mn, max(vmax) as mx, sum(vavg * n) / sum(n) as av
         from ${table} where sid in (${sidPh}) and ts >= ? and ts < ? group by sid, b`).all(bucket, bucket, ...sids, start, to);
		const result = empty();
		const bySeries = new Map(result.series.map((s) => [s.key, s]));
		for (const r of rows) {
			const s = bySeries.get(keyOf.get(r.sid));
			const i = Math.round((r.b - start) / bucket);
			if (!s || i < 0 || i >= count) continue;
			s.min[i] = r.mn;
			s.max[i] = r.mx;
			s.avg[i] = r.av;
		}
		result.coverageStart = this.db.prepare(`select min(ts) as t from ${table} where sid in (${sidPh})`).get(...sids).t;
		return result;
	}
	openEvent(e, snapshot) {
		if (!this.db || !this.cfg.enabled) return null;
		let id = null;
		this.safely(() => {
			this.tx(() => {
				id = this.db.prepare("insert into events(kind, key, severity, title, detail, confidence, extra, ts_start) values (?, ?, ?, ?, ?, ?, ?, ?) returning id").get(e.kind, e.key, e.severity, e.title, e.detail, e.confidence ?? null, e.extra ? JSON.stringify(e.extra) : null, e.ts).id;
				if (snapshot) this.db.prepare("insert into event_snap(event_id, json) values (?, ?)").run(id, JSON.stringify(snapshot));
			});
		});
		return id;
	}
	/** 结束一个事件；extra 不为空时同时更新证据（诊断事件结束时用持续期间最有代表性的一次） */
	closeEvent(id, ts, extra = null) {
		if (!this.db) return;
		this.safely(() => {
			this.db.prepare("update events set ts_end = max(ts_start, ?) where id = ? and ts_end is null").run(ts, id);
			if (extra) this.db.prepare("update events set extra = ? where id = ?").run(JSON.stringify(extra), id);
		});
	}
	listEvents(from, to, limit = 500) {
		if (!this.db) return [];
		return this.db.prepare(`select id, kind, key, severity, title, detail, confidence, extra, ts_start as tsStart, ts_end as tsEnd
         from events where ts_start < ? and (ts_end is null or ts_end >= ?)
         order by ts_start desc limit ?`).all(to, from, limit).map(parseEvent);
	}
	getEvent(id) {
		if (!this.db) return null;
		const raw = this.db.prepare(`select id, kind, key, severity, title, detail, confidence, extra, ts_start as tsStart, ts_end as tsEnd
         from events where id = ?`).get(id);
		if (!raw) return null;
		const event = parseEvent(raw);
		const snap = this.db.prepare("select json from event_snap where event_id = ?").get(id);
		let snapshot = null;
		try {
			snapshot = snap ? JSON.parse(snap.json) : null;
		} catch {
			snapshot = null;
		}
		return {
			event,
			snapshot
		};
	}
	stats() {
		const base = {
			enabled: this.cfg.enabled,
			fileBytes: this.fileBytes(),
			rawRows: 0,
			minuteRows: 0,
			eventCount: 0,
			oldestTs: null,
			newestTs: null,
			lastError: this.lastError
		};
		if (!this.db) return base;
		const one = (sql) => this.db.prepare(sql).get();
		base.rawRows = one("select count(*) as a from s5").a ?? 0;
		base.minuteRows = one("select count(*) as a from m1").a ?? 0;
		base.eventCount = one("select count(*) as a from events").a ?? 0;
		const span = one("select min(ts) as a, max(ts) as b from s5");
		const mspan = one("select min(ts) as a, max(ts) as b from m1");
		const olds = [span.a, mspan.a].filter((v) => v != null);
		const news = [span.b, mspan.b].filter((v) => v != null);
		base.oldestTs = olds.length ? Math.min(...olds) : null;
		base.newestTs = news.length ? Math.max(...news) : null;
		return base;
	}
	/** 导出 1 分钟聚合数据和事件为两份 CSV（带 BOM，Excel 直接打开不乱码） */
	exportCsv(seriesFile, eventsFile) {
		if (!this.db) throw new Error("历史数据库未打开");
		this.flushAll();
		const BOM = "﻿";
		const fd = node_fs.openSync(seriesFile, "w");
		try {
			node_fs.writeSync(fd, `${BOM}时间,指标,单位,最小值,最大值,平均值\r\n`);
			const it = this.db.prepare(`select m.ts as ts, s.label as label, s.unit as unit, m.vmin as vmin, m.vmax as vmax, m.vavg as vavg
           from m1 m join series s on s.id = m.sid order by m.ts, s.key`).iterate();
			let buf = [];
			for (const r of it) {
				const t = new Date(r.ts).toLocaleString("zh-CN", { hour12: false });
				buf.push([
					csv(t),
					csv(r.label),
					csv(r.unit),
					r.vmin.toFixed(2),
					r.vmax.toFixed(2),
					r.vavg.toFixed(2)
				].join(","));
				if (buf.length >= 5e3) {
					node_fs.writeSync(fd, buf.join("\r\n") + "\r\n");
					buf = [];
				}
			}
			if (buf.length) node_fs.writeSync(fd, buf.join("\r\n") + "\r\n");
		} finally {
			node_fs.closeSync(fd);
		}
		const lines = this.listEvents(0, Date.now() + DAY, 1e5).map((e) => [
			csv(new Date(e.tsStart).toLocaleString("zh-CN", { hour12: false })),
			csv(e.tsEnd ? new Date(e.tsEnd).toLocaleString("zh-CN", { hour12: false }) : "持续中"),
			csv(e.kind),
			csv(e.severity),
			csv(e.title),
			csv(e.detail),
			csv(e.confidence)
		].join(","));
		node_fs.writeFileSync(eventsFile, `${BOM}开始时间,结束时间,类型,级别,标题,详情,置信度\r\n${lines.join("\r\n")}\r\n`, "utf8");
	}
	clear() {
		if (!this.db) return;
		this.rawAgg.clear();
		this.minuteAgg.clear();
		this.rawBucket = 0;
		this.minuteBucket = 0;
		this.tx(() => {
			this.db.exec("delete from s5; delete from m1; delete from event_snap; delete from events;");
		});
		this.db.exec("pragma wal_checkpoint(TRUNCATE); pragma incremental_vacuum;");
	}
	openDb() {
		const db = new node_sqlite.DatabaseSync(this.file);
		try {
			const ver = db.prepare("pragma user_version").get().user_version;
			if (ver === 0) db.exec("pragma auto_vacuum = INCREMENTAL;");
			db.exec("pragma journal_mode = WAL; pragma synchronous = NORMAL; pragma foreign_keys = ON;");
			const check = db.prepare("pragma quick_check").get();
			if (check.quick_check !== "ok") throw new Error(`database disk image is malformed (${check.quick_check})`);
			db.exec(SCHEMA);
			if (!db.prepare("pragma table_info(events)").all().some((c) => c.name === "extra")) db.exec("alter table events add column extra text");
			if (ver < 2) db.exec("pragma user_version = 2;");
		} catch (e) {
			db.close();
			throw e;
		}
		this.db = db;
		this.upsertSeries = db.prepare(`insert into series(key, label, unit, grp) values (?, ?, ?, ?)
       on conflict(key) do update set label = excluded.label, unit = excluded.unit, grp = excluded.grp
       returning id`);
		this.upsertRaw = db.prepare(UPSERT_SAMPLE("s5"));
		this.upsertMinute = db.prepare(UPSERT_SAMPLE("m1"));
		this.sids.clear();
		this.labels.clear();
		db.exec(`update events set ts_end = max(ts_start, coalesce((select max(ts) from s5), ts_start)) where ts_end is null;`);
		this.maintain(Date.now());
	}
	tx(fn) {
		const db = this.db;
		db.exec("begin");
		try {
			fn();
			db.exec("commit");
		} catch (e) {
			try {
				db.exec("rollback");
			} catch {}
			throw e;
		}
	}
	safely(fn) {
		try {
			fn();
		} catch (e) {
			this.lastError = e instanceof Error ? e.message : String(e);
			console.error("[history]", this.lastError);
			if (CORRUPT_RE.test(this.lastError)) this.recover(e);
		}
	}
	recover(cause) {
		const now = Date.now();
		if (now - this.lastRecover < 6e5) return;
		this.lastRecover = now;
		const msg = cause instanceof Error ? cause.message : String(cause);
		try {
			this.db?.close();
		} catch {}
		this.db = null;
		this.rawAgg.clear();
		this.minuteAgg.clear();
		this.rawBucket = 0;
		this.minuteBucket = 0;
		for (const suffix of [
			"",
			"-wal",
			"-shm"
		]) try {
			node_fs.renameSync(this.file + suffix, `${this.file}.corrupt-${now}${suffix}`);
		} catch {}
		try {
			this.openDb();
			this.lastError = `历史数据库已损坏，旧文件已备份为 history.db.corrupt-${now}，并重新创建（${msg}）`;
		} catch (e) {
			this.db = null;
			this.lastError = `历史数据库无法使用：${e instanceof Error ? e.message : String(e)}`;
		}
	}
};
//#endregion
//#region src/main/diagnosis/rules.ts
var pickTier = (t, s) => s === "conservative" ? t[0] : s === "sensitive" ? t[2] : t[1];
var pct = (v) => `${v.toFixed(0)}%`;
var ms = (v) => `${v.toFixed(v < 10 ? 1 : 0)} ms`;
var mbs = (b) => b >= 1024 ** 2 ? `${(b / 1024 ** 2).toFixed(1)} MB/s` : `${Math.round(b / 1024)} KB/s`;
var top = (rows, value, n = 3) => rows.slice(0, n).map((r) => {
	const v = value(r);
	return v ? `${r.name}（${v}）` : null;
}).filter((x) => x != null);
var topCpu = (s) => top(s.processes.apps.cpu, (r) => r.cpuPercent != null && r.cpuPercent >= 1 ? pct(r.cpuPercent) : null);
var topMem = (s) => top(s.processes.apps.mem, (r) => r.memBytes != null ? `${(r.memBytes / 1024 ** 3).toFixed(1)} GB` : null);
var topIo = (s) => top(s.processes.apps.io, (r) => r.ioBytesPerSec != null && r.ioBytesPerSec >= 102400 ? mbs(r.ioBytesPerSec) : null);
var ev = (label, value, threshold = null) => ({
	label,
	value,
	threshold
});
var maxCore = (s) => {
	let best = null;
	for (const c of s.cpu.cores) if (c.usage != null && (!best || c.usage > best.usage)) best = {
		label: c.label,
		usage: c.usage
	};
	return best;
};
var RULES = [
	{
		id: "cpu-high",
		title: "CPU 持续高负载",
		sustain: [
			30,
			20,
			15
		],
		evaluate(s, sens) {
			const u = s.cpu.usage;
			if (u == null) return null;
			const th = pickTier([
				95,
				90,
				85
			], sens);
			const queue = s.perf.processorQueue;
			const cores = s.cpu.logicalCores ?? s.cpu.cores.length;
			const saturated = queue != null && cores > 0 && queue >= cores * 2;
			return {
				hit: u >= th,
				near: u >= th - 10,
				current: pct(u),
				threshold: `≥ ${th}%`,
				confidence: saturated ? "high" : "medium",
				evidence: [ev("CPU 总占用", pct(u), `≥ ${th}%`), ev("处理器队列（等待 CPU 的线程）", queue == null ? "无法读取" : queue.toFixed(0), cores > 0 ? `≥ ${cores * 2} 表示明显排队` : null)],
				cause: saturated ? "所有核心都很忙，并且有大量线程在排队等 CPU，程序响应可能变慢。" : "CPU 长时间接近满载。如果你正在做渲染、编译、压缩等工作，这是正常现象。",
				suggestions: [
					"看看占用最高的程序是不是你正在用的",
					"关掉不需要的后台程序",
					"游戏中可以降低画质里依赖 CPU 的选项（如人数、物理效果）"
				],
				processes: topCpu(s)
			};
		}
	},
	{
		id: "single-core",
		title: "单核心性能瓶颈",
		sustain: [
			30,
			20,
			15
		],
		evaluate(s, sens) {
			const u = s.cpu.usage;
			const mc = maxCore(s);
			if (u == null || !mc) return null;
			const th = pickTier([
				98,
				95,
				90
			], sens);
			const totalBelow = 60;
			return {
				hit: mc.usage >= th && u < totalBelow,
				near: mc.usage >= th - 10 && u < totalBelow,
				current: `${mc.label} ${pct(mc.usage)}，总占用 ${pct(u)}`,
				threshold: `单核 ≥ ${th}% 且总占用 < ${totalBelow}%`,
				confidence: "medium",
				evidence: [ev(`最忙的核心 ${mc.label}`, pct(mc.usage), `≥ ${th}%`), ev("CPU 总占用", pct(u), `< ${totalBelow}%`)],
				cause: "总占用不高，但有一个核心跑满了，通常是某个程序只用得上一个线程（很多游戏的主线程就是这样）。",
				suggestions: [
					"看看占用最高的程序",
					"游戏里降低依赖 CPU 的设置",
					"这类瓶颈加核心数没用，主要靠单核性能"
				],
				processes: topCpu(s)
			};
		}
	},
	{
		id: "cpu-limited",
		title: "CPU 可能被降频",
		sustain: [
			20,
			10,
			8
		],
		evaluate(s, sens) {
			const limit = s.perf.perfLimitPct;
			const flags = s.perf.perfLimitFlags;
			const t = s.cpu.tempC;
			const u = s.cpu.usage;
			if (limit == null && t == null) return null;
			const hotTh = pickTier([
				98,
				95,
				90
			], sens);
			const limited = flags != null && flags !== 0 || limit != null && limit < 95;
			const hot = t != null && t >= hotTh;
			return {
				hit: limited && u != null && u >= 30 || hot,
				near: t != null && t >= hotTh - 5,
				current: `性能上限 ${limit == null ? "--" : pct(limit)}，温度 ${t == null ? "--" : `${t.toFixed(0)}°C`}`,
				threshold: `上限 < 95% 或温度 ≥ ${hotTh}°C`,
				confidence: hot ? "high" : "medium",
				evidence: [
					ev("CPU 性能上限（100% 为不受限）", limit == null ? "无法读取" : pct(limit), "< 95%"),
					ev("性能限制标志（0 为没有限制）", flags == null ? "无法读取" : String(flags), "≠ 0"),
					ev("CPU 封装温度", t == null ? "无法读取" : `${t.toFixed(0)}°C`, `≥ ${hotTh}°C`),
					ev("CPU 封装功耗", s.cpu.packagePowerW == null ? "无法读取" : `${s.cpu.packagePowerW.toFixed(0)} W`)
				],
				cause: hot ? "CPU 温度很高，很可能触发了温度保护而降频，性能会下降。" : "CPU 报告自己的性能被限制了，可能是功耗墙、温度或电源策略造成的。",
				suggestions: [
					"检查 CPU 散热：水泵、风扇是否正常，硅脂是否老化",
					"在「主板与散热」里看风扇转速",
					"检查 Windows 电源模式是否为「最佳性能」"
				],
				processes: topCpu(s)
			};
		}
	},
	{
		id: "mem-pressure",
		title: "内存压力过高",
		sustain: [
			45,
			30,
			20
		],
		evaluate(s, sens) {
			const u = s.memory.usagePercent;
			const { committedBytes: c, commitLimitBytes: l } = s.memory;
			const commit = c != null && l ? c / l * 100 : null;
			if (u == null && commit == null) return null;
			const th = pickTier([
				95,
				90,
				85
			], sens);
			const hf = s.perf.hardFaultsPerSec;
			const paging = hf != null && hf >= 500;
			const worst = Math.max(u ?? 0, commit ?? 0);
			return {
				hit: worst >= th,
				near: worst >= th - 10,
				current: `内存 ${u == null ? "--" : pct(u)}，已提交 ${commit == null ? "--" : pct(commit)}`,
				threshold: `≥ ${th}%`,
				confidence: paging ? "high" : "medium",
				evidence: [
					ev("物理内存使用率", u == null ? "无法读取" : pct(u), `≥ ${th}%`),
					ev("已提交 / 上限", commit == null ? "无法读取" : pct(commit), `≥ ${th}%`),
					ev("硬缺页", hf == null ? "无法读取" : `${hf.toFixed(0)} 次/秒`, "≥ 500 次/秒 表示在频繁换页")
				],
				cause: paging ? "内存快用完了，系统正在频繁把数据换到硬盘上，切换程序或加载时容易卡。" : "内存或提交量接近上限，继续增长可能导致程序变慢甚至崩溃。",
				suggestions: [
					"关掉占用内存最多的程序",
					"浏览器标签页开太多也会占很多内存",
					"提交量接近上限时可以把虚拟内存（页面文件）调大"
				],
				processes: topMem(s)
			};
		}
	},
	{
		id: "hard-faults",
		title: "频繁硬缺页",
		sustain: [
			20,
			15,
			10
		],
		evaluate(s, sens) {
			const hf = s.perf.hardFaultsPerSec;
			if (hf == null) return null;
			const th = pickTier([
				2e3,
				1e3,
				500
			], sens);
			const mem = s.memory.usagePercent;
			const memTight = mem != null && mem >= 80;
			return {
				hit: hf >= th,
				near: hf >= th / 2,
				current: `${hf.toFixed(0)} 次/秒`,
				threshold: `≥ ${th} 次/秒`,
				confidence: memTight ? "medium" : "low",
				evidence: [ev("硬缺页（从硬盘读回内存）", `${hf.toFixed(0)} 次/秒`, `≥ ${th} 次/秒`), ev("物理内存使用率", mem == null ? "无法读取" : pct(mem), memTight ? null : "内存不紧张时多半是程序在读文件")],
				cause: memTight ? "内存比较紧张，系统频繁从硬盘读回内存页，可能造成卡顿。" : "系统在大量从硬盘读取数据到内存。内存并不紧张，常见于游戏或软件正在加载，一般不需要处理。",
				suggestions: ["如果同时内存使用率很高，参考「内存压力过高」的建议", "如果只在加载时出现，可以忽略"],
				processes: topIo(s)
			};
		}
	},
	{
		id: "disk-latency",
		title: "磁盘响应变慢",
		sustain: [
			15,
			10,
			8
		],
		evaluate(s, sens) {
			const r = s.perf.diskReadMs;
			const w = s.perf.diskWriteMs;
			if (r == null && w == null) return null;
			const th = pickTier([
				100,
				50,
				30
			], sens);
			const lat = Math.max(r ?? 0, w ?? 0);
			const q = s.perf.diskQueue;
			return {
				hit: lat >= th && q != null && q >= 1,
				near: lat >= th / 2,
				current: `读 ${r == null ? "--" : ms(r)}，写 ${w == null ? "--" : ms(w)}，队列 ${q == null ? "--" : q.toFixed(0)}`,
				threshold: `≥ ${th} ms 且有请求在排队`,
				confidence: lat >= th * 2 ? "high" : "medium",
				evidence: [
					ev("最慢硬盘的平均读取响应", r == null ? "无法读取" : ms(r), `≥ ${th} ms`),
					ev("最慢硬盘的平均写入响应", w == null ? "无法读取" : ms(w), `≥ ${th} ms`),
					ev("磁盘队列长度", q == null ? "无法读取" : q.toFixed(0), "≥ 1"),
					ev("磁盘读写速度", `读 ${mbs(s.disk.readBytesPerSec ?? 0)}，写 ${mbs(s.disk.writeBytesPerSec ?? 0)}`)
				],
				cause: "磁盘请求在排队，每次读写要等很久，依赖硬盘的操作（打开程序、加载、保存）会变慢。",
				suggestions: [
					"看看哪个程序在大量读写（下方列表包含网络读写）",
					"后台的杀毒扫描、系统更新、下载、云盘同步常会造成这种情况",
					"在「硬件信息」里检查硬盘健康和温度"
				],
				processes: topIo(s)
			};
		}
	},
	{
		id: "disk-busy",
		title: "磁盘持续满载",
		sustain: [
			30,
			20,
			15
		],
		evaluate(s, sens) {
			const b = s.disk.busyPercent;
			if (b == null) return null;
			const th = pickTier([
				99,
				95,
				90
			], sens);
			const lat = Math.max(s.perf.diskReadMs ?? 0, s.perf.diskWriteMs ?? 0);
			const fast = lat > 0 && lat < 10;
			return {
				hit: b >= th,
				near: b >= th - 15,
				current: pct(b),
				threshold: `≥ ${th}%`,
				confidence: fast ? "low" : "medium",
				evidence: [ev("磁盘忙碌程度", pct(b), `≥ ${th}%`), ev("最慢硬盘的平均响应", lat > 0 ? ms(lat) : "无法读取", fast ? "响应仍然很快" : null)],
				cause: fast ? "磁盘一直很忙，但响应时间仍然很短。固态硬盘常见这种情况，一般不会造成卡顿。" : "磁盘一直很忙，同时响应也不快，其他程序读写硬盘时会受影响。",
				suggestions: ["看看哪个程序在大量读写", "大文件复制、下载、杀毒扫描结束后通常会恢复"],
				processes: topIo(s)
			};
		}
	},
	{
		id: "gpu-full",
		title: "显卡持续满载",
		sustain: [
			90,
			60,
			45
		],
		evaluate(s, sens) {
			const u = s.gpu.usage;
			if (u == null) return null;
			const th = pickTier([
				99,
				97,
				95
			], sens);
			return {
				hit: u >= th,
				near: u >= th - 10,
				current: pct(u),
				threshold: `≥ ${th}%`,
				confidence: "low",
				evidence: [ev("显卡占用", pct(u), `≥ ${th}%`), ev("显卡温度", s.gpu.tempC == null ? "无法读取" : `${s.gpu.tempC.toFixed(0)}°C`)],
				cause: "显卡是当前负载的瓶颈。玩游戏时这是正常现象，说明显卡在全力工作；如果帧数不够，可以降低画质或分辨率。",
				suggestions: ["游戏帧数不够时降低分辨率、阴影、光追等设置", "没有运行游戏或 3D 程序时出现，检查是否有程序在后台占用显卡"],
				processes: []
			};
		}
	},
	{
		id: "vram",
		title: "显存不足",
		sustain: [
			30,
			20,
			15
		],
		evaluate(s, sens) {
			const m = s.gpu.memPercent;
			if (m == null) return null;
			const th = pickTier([
				98,
				95,
				90
			], sens);
			const shared = s.gpu.sharedUsedBytes;
			const spilling = shared != null && shared >= 1024 ** 3;
			return {
				hit: m >= th,
				near: m >= th - 10,
				current: pct(m),
				threshold: `≥ ${th}%`,
				confidence: spilling ? "high" : "medium",
				evidence: [ev("专用显存占用", pct(m), `≥ ${th}%`), ev("共享显存（借用内存）", shared == null ? "无法读取" : `${(shared / 1024 ** 3).toFixed(1)} GB`, "≥ 1 GB 表示显存不够、借用了内存")],
				cause: spilling ? "显存用满了，显卡开始借用速度慢得多的内存，游戏里容易出现卡顿和贴图延迟。" : "显存快用满了，再增加可能会借用内存而变卡。",
				suggestions: ["降低游戏的贴图质量、分辨率", "关掉同时在用显卡的程序（浏览器硬件加速、视频播放等）"],
				processes: []
			};
		}
	},
	{
		id: "gpu-limited",
		title: "显卡被降频",
		sustain: [
			20,
			10,
			8
		],
		evaluate(s) {
			const l = s.perf.gpuLimits;
			if (!l) return null;
			const serious = l.hwThermal || l.swThermal || l.hwSlowdown || l.powerBrake;
			const u = s.gpu.usage;
			const powerOnly = l.powerCap && !serious && u != null && u >= 90;
			const reasons = [
				l.hwThermal || l.swThermal ? "温度" : null,
				l.hwSlowdown ? "硬件保护" : null,
				l.powerBrake ? "外部电源信号" : null,
				l.powerCap ? "功耗墙" : null
			].filter(Boolean);
			return {
				hit: serious || powerOnly,
				near: l.powerCap,
				current: reasons.length > 0 ? reasons.join("、") : "无",
				threshold: "温度或硬件降频；或满载时触发功耗墙",
				confidence: serious ? "high" : "low",
				evidence: [
					ev("温度降频", l.hwThermal || l.swThermal ? "是" : "否"),
					ev("硬件保护降频", l.hwSlowdown ? "是" : "否"),
					ev("功耗墙", l.powerCap ? "是" : "否"),
					ev("显卡温度", s.gpu.tempC == null ? "无法读取" : `${s.gpu.tempC.toFixed(0)}°C`)
				],
				cause: serious ? "显卡因为温度或硬件保护主动降低了频率，性能会下降。" : "显卡满载时碰到了功耗上限，这是正常设计，频率会在功耗允许范围内波动。",
				suggestions: serious ? [
					"检查显卡散热和机箱风道",
					"检查显卡供电线是否插紧",
					"在「主板与散热」里看显卡风扇"
				] : ["一般不需要处理"],
				processes: []
			};
		}
	},
	{
		id: "dpc",
		title: "驱动延迟偏高",
		sustain: [
			20,
			10,
			8
		],
		evaluate(s, sens) {
			const d = s.perf.dpcPct;
			const i = s.perf.interruptPct;
			if (d == null && i == null) return null;
			const th = pickTier([
				8,
				5,
				3
			], sens);
			const sum = (d ?? 0) + (i ?? 0);
			return {
				hit: sum >= th,
				near: sum >= th / 2,
				current: pct(sum),
				threshold: `≥ ${th}%`,
				confidence: "medium",
				evidence: [
					ev("DPC 时间", d == null ? "无法读取" : `${d.toFixed(1)}%`),
					ev("中断时间", i == null ? "无法读取" : `${i.toFixed(1)}%`),
					ev("合计", `${sum.toFixed(1)}%`, `≥ ${th}%`)
				],
				cause: "CPU 花了较多时间处理硬件驱动的请求，常见表现是音频爆音、鼠标偶尔顿一下、游戏偶发卡顿。",
				suggestions: [
					"更新显卡、网卡、声卡、主板芯片组驱动",
					"暂时断开最近新装的 USB 设备排查",
					"无线网卡在信号差时也可能造成驱动延迟"
				],
				processes: []
			};
		}
	}
];
/** 卡顿发生的同一时刻，系统里还出现了哪些异常。只是并列出来，不代表它们就是原因 */
function concurrent(s) {
	const out = [];
	const cpu = s.cpu.usage;
	const mc = maxCore(s);
	if (cpu != null && cpu >= 90) out.push(`CPU 占用 ${pct(cpu)}`);
	else if (mc && mc.usage >= 95 && cpu != null && cpu < 60) out.push(`单个核心 ${mc.label} 跑满（总占用 ${pct(cpu)}）`);
	if ((s.perf.perfLimitFlags ?? 0) !== 0 || (s.perf.perfLimitPct ?? 100) < 95) out.push("CPU 性能被限制");
	if ((s.cpu.tempC ?? 0) >= 95) out.push(`CPU 温度 ${s.cpu.tempC.toFixed(0)}°C`);
	const lat = Math.max(s.perf.diskReadMs ?? 0, s.perf.diskWriteMs ?? 0);
	if (lat >= 30 && (s.perf.diskQueue ?? 0) >= 1) out.push(`磁盘响应变慢（${ms(lat)}）`);
	const mem = Math.max(s.memory.usagePercent ?? 0, s.memory.committedBytes != null && s.memory.commitLimitBytes ? s.memory.committedBytes / s.memory.commitLimitBytes * 100 : 0);
	if (mem >= 90) out.push(`内存紧张（${pct(mem)}）`);
	if ((s.perf.hardFaultsPerSec ?? 0) >= 500) out.push(`频繁硬缺页（${s.perf.hardFaultsPerSec.toFixed(0)} 次/秒）`);
	if ((s.gpu.usage ?? 0) >= 97) out.push(`显卡占用 ${pct(s.gpu.usage)}`);
	if ((s.gpu.memPercent ?? 0) >= 95) out.push(`显存占用 ${pct(s.gpu.memPercent)}`);
	const gl = s.perf.gpuLimits;
	if (gl && (gl.hwThermal || gl.swThermal || gl.hwSlowdown || gl.powerBrake)) out.push("显卡被降频");
	if ((s.perf.dpcPct ?? 0) + (s.perf.interruptPct ?? 0) >= 3) out.push("驱动延迟偏高");
	return out;
}
var FRAME_NA = {
	off: "帧时间采集已在设置里关闭",
	idle: "等待前台出现全屏程序",
	starting: "正在启动帧时间采集",
	denied: "没有权限，见下方说明",
	missing: "找不到帧时间采集程序",
	error: "帧时间采集出错"
};
RULES.push({
	id: "frame-stutter",
	title: "画面卡顿（实测）",
	sustain: [
		4,
		2,
		1
	],
	naText: (s) => FRAME_NA[s.frames.state] ?? "前台程序没有在出画面帧",
	evaluate(s, sens) {
		const f = s.frames;
		if (f.state !== "running" || f.fps == null || f.process == null) return null;
		const th = pickTier([
			5,
			3,
			2
		], sens);
		const bigMs = pickTier([
			200,
			120,
			80
		], sens);
		const bigFrame = (f.maxMs ?? 0) >= bigMs;
		const together = concurrent(s);
		return {
			hit: f.stutters10s >= th || bigFrame,
			near: f.stutters10s >= 1,
			titleSuffix: f.process,
			current: `${f.process}${f.background ? "（后台）" : ""} ${f.fps.toFixed(0)} FPS，最近 10 秒卡顿帧 ${f.stutters10s} 个，最长一帧 ${f.maxMs == null ? "--" : ms(f.maxMs)}`,
			threshold: `10 秒内卡顿帧 ≥ ${th} 个，或单帧 ≥ ${bigMs} ms`,
			confidence: "high",
			evidence: [
				ev("程序", `${f.process}（进程 ${f.pid}${f.background ? "，当时在后台" : ""}）`),
				ev("当前帧率", `${f.fps.toFixed(0)} FPS`),
				ev("平均帧时间", f.avgMs == null ? "无法读取" : ms(f.avgMs)),
				ev("最长一帧", f.maxMs == null ? "无法读取" : ms(f.maxMs), `≥ ${bigMs} ms 算一次明显卡顿`),
				ev("最近 10 秒卡顿帧", `${f.stutters10s} 个`, `≥ ${th} 个；卡顿帧指超过 ${f.stutterThresholdMs?.toFixed(0) ?? "33"} ms 的帧`),
				ev("1% Low（最近 60 秒）", f.low1Fps == null ? "帧数太少，暂无" : `${f.low1Fps.toFixed(0)} FPS`),
				...together.map((t) => ev("同时出现", t))
			],
			cause: together.length > 0 ? `画面确实出现了卡顿（实测帧时间）。卡顿的同一时刻还出现了：${together.join("、")}。同时出现不代表一定是原因，可以逐项排查。` : "画面确实出现了卡顿（实测帧时间），但这段时间系统资源没有发现明显异常，可能是程序本身（加载、网络、优化）造成的。",
			suggestions: together.length > 0 ? ["先看「同时出现」里的项目，按它们各自的建议排查", "点「在历史中回放」，对照卡顿前后各项指标的曲线"] : ["看看卡顿是否总发生在同一场景（加载新区域、联机波动等）", "更新显卡驱动，检查游戏是否有已知的卡顿问题"],
			processes: [...topCpu(s), ...topIo(s)].slice(0, 4)
		};
	}
});
var titleOf = (rule, r) => r.titleSuffix ? `${rule.title} · ${r.titleSuffix}` : rule.title;
var sustainMs = (r, s) => pickTier(r.sustain, s) * 1e3;
//#endregion
//#region src/main/diagnosis/engine.ts
var CLEAR_MS = 15e3;
var RANK = {
	low: 0,
	medium: 1,
	high: 2
};
var DiagnosisEngine = class {
	states = /* @__PURE__ */ new Map();
	sink;
	constructor(sink = null) {
		this.sink = sink;
	}
	update(s, cfg, now = Date.now()) {
		if (!cfg.enabled) {
			this.closeAll(now);
			return {
				enabled: false,
				checks: [],
				active: []
			};
		}
		const checks = [];
		const active = [];
		for (const rule of RULES) {
			const st = this.states.get(rule.id) ?? {
				since: null,
				clearSince: null,
				active: null,
				eventId: null,
				last: null
			};
			this.states.set(rule.id, st);
			const r = rule.evaluate(s, cfg.sensitivity);
			if (!r) {
				checks.push({
					rule: rule.id,
					title: rule.title,
					state: "na",
					current: rule.naText?.(s) ?? "缺少数据",
					threshold: ""
				});
				this.tickClear(st, now);
				if (st.active) active.push(st.active);
				continue;
			}
			if (r.hit) {
				st.clearSince = null;
				st.since ??= now;
				if (!st.active && now - st.since >= sustainMs(rule, cfg.sensitivity)) {
					st.active = {
						rule: rule.id,
						title: titleOf(rule, r),
						confidence: r.confidence,
						since: st.since,
						...extraOf(r)
					};
					st.last = r;
					st.eventId = this.sink?.open(rule, r, st.since, s) ?? null;
				} else if (st.active) {
					if (RANK[r.confidence] > RANK[st.active.confidence]) st.active = {
						...st.active,
						confidence: r.confidence,
						...extraOf(r)
					};
					if (!st.last || RANK[r.confidence] >= RANK[st.last.confidence]) st.last = r;
				}
			} else {
				st.since = null;
				this.tickClear(st, now);
			}
			const state = st.active ? "active" : r.hit ? "pending" : r.near ? "near" : "ok";
			checks.push({
				rule: rule.id,
				title: titleOf(rule, r),
				state,
				current: r.current,
				threshold: r.threshold
			});
			if (st.active) active.push(st.active);
		}
		return {
			enabled: true,
			checks,
			active
		};
	}
	tickClear(st, now) {
		if (!st.active) return;
		st.clearSince ??= now;
		if (now - st.clearSince < CLEAR_MS) return;
		this.finish(st, st.clearSince);
	}
	finish(st, ts) {
		if (st.eventId != null && st.last) this.sink?.close(st.eventId, ts, extraOf(st.last));
		st.active = null;
		st.eventId = null;
		st.last = null;
		st.clearSince = null;
		st.since = null;
	}
	/** 关闭诊断或退出软件时调用：结束所有进行中的记录 */
	closeAll(now = Date.now()) {
		for (const st of this.states.values()) if (st.active) this.finish(st, now);
		this.states.clear();
	}
};
function extraOf(r) {
	return {
		evidence: r.evidence,
		cause: r.cause,
		suggestions: r.suggestions,
		processes: r.processes
	};
}
//#endregion
//#region src/main/icon.ts
function makeAppIcon() {
	const file = electron.app.isPackaged ? (0, path.join)(process.resourcesPath, "icon.png") : (0, path.join)(electron.app.getAppPath(), "resources", "icon.png");
	return electron.nativeImage.createFromPath(file);
}
//#endregion
//#region src/main/collectors/speedtest.ts
var CF_HOST = "speed.cloudflare.com";
var DOMESTIC_PATH = "centos-vault/7.9.2009/isos/x86_64/CentOS-7-x86_64-DVD-2009.iso";
var DOMESTIC_URLS = [
	"mirrors.cloud.tencent.com",
	"mirrors.163.com",
	"mirrors.tuna.tsinghua.edu.cn",
	"mirror.nju.edu.cn"
].map((host) => `https://${host}/${DOMESTIC_PATH}`);
var STREAMS = 4;
var UA = "SysMonitor-SpeedTest/0.1";
var MB = 1048576;
var CHUNK = (0, crypto.randomBytes)(262144);
var POST_SIZE = 8 * MB;
var sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function timedRequest(agent, url, method, signal) {
	return new Promise((resolve, reject) => {
		const t0 = performance.now();
		const req = https.request(url, {
			method,
			agent,
			timeout: 6e3,
			headers: {
				"User-Agent": UA,
				"Accept-Encoding": "identity"
			}
		}, (res) => {
			res.resume();
			res.on("end", () => resolve(performance.now() - t0));
			res.on("error", reject);
		});
		req.on("error", reject);
		req.on("timeout", () => req.destroy(/* @__PURE__ */ new Error("延迟测试超时")));
		signal.addEventListener("abort", () => req.destroy(/* @__PURE__ */ new Error("已取消")), { once: true });
		req.end();
	});
}
async function headFinal(agent, start, signal) {
	let url = start;
	for (let hop = 0; hop <= 3; hop++) {
		const r = await new Promise((resolve) => {
			const req = https.request(url, {
				method: "HEAD",
				agent,
				timeout: 6e3,
				headers: { "User-Agent": UA }
			}, (res) => {
				res.resume();
				resolve({
					status: res.statusCode ?? 0,
					location: res.headers.location,
					length: Number(res.headers["content-length"] ?? 0),
					ranges: res.headers["accept-ranges"] === "bytes"
				});
			});
			req.on("error", () => resolve(null));
			req.on("timeout", () => req.destroy());
			signal.addEventListener("abort", () => req.destroy(), { once: true });
			req.end();
		});
		if (!r) return null;
		if (r.status >= 300 && r.status < 400 && r.location) {
			url = new URL(r.location, url).toString();
			if (!url.startsWith("https:")) return null;
			continue;
		}
		return r.status === 200 ? {
			url,
			length: r.length,
			ranges: r.ranges
		} : null;
	}
	return null;
}
function getStream(agent, url, headers, stopAt, signal, add) {
	return new Promise((resolve) => {
		let done = false;
		let kill;
		const finish = (ok) => {
			if (done) return;
			done = true;
			clearTimeout(kill);
			resolve(ok);
		};
		const req = https.get(url, {
			agent,
			headers: {
				"User-Agent": UA,
				"Accept-Encoding": "identity",
				...headers
			}
		}, (res) => {
			if (res.statusCode !== 200 && res.statusCode !== 206) {
				res.resume();
				finish(false);
				return;
			}
			res.on("data", (c) => {
				add(c.length);
				if (performance.now() >= stopAt) req.destroy();
			});
			res.on("end", () => finish(true));
			res.on("close", () => finish(true));
			res.on("error", () => finish(true));
		});
		kill = setTimeout(() => req.destroy(), Math.max(0, stopAt - performance.now()) + 500);
		req.on("error", () => finish(false));
		signal.addEventListener("abort", () => req.destroy(), { once: true });
	});
}
function postStream(agent, url, stopAt, signal, add) {
	return new Promise((resolve) => {
		let done = false;
		let kill;
		const finish = (ok) => {
			if (done) return;
			done = true;
			clearTimeout(kill);
			resolve(ok);
		};
		const req = https.request(url, {
			method: "POST",
			agent,
			headers: {
				"User-Agent": UA,
				"Content-Type": "application/octet-stream",
				"Content-Length": String(POST_SIZE)
			}
		}, (res) => {
			res.resume();
			res.on("end", () => finish((res.statusCode ?? 500) < 400));
			res.on("error", () => finish(false));
		});
		kill = setTimeout(() => req.destroy(), Math.max(0, stopAt - performance.now()) + 300);
		req.on("error", () => finish(false));
		signal.addEventListener("abort", () => req.destroy(), { once: true });
		let sent = 0;
		const pump = () => {
			while (sent < POST_SIZE) {
				if (signal.aborted || performance.now() >= stopAt) {
					req.destroy();
					return;
				}
				const ok = req.write(CHUNK);
				sent += CHUNK.length;
				add(CHUNK.length);
				if (!ok) {
					req.once("drain", pump);
					return;
				}
			}
			req.end();
		};
		pump();
	});
}
var SpeedTester = class {
	lookup;
	ctrl = null;
	constructor(lookup) {
		this.lookup = lookup;
	}
	get running() {
		return this.ctrl !== null;
	}
	cancel() {
		this.ctrl?.abort();
	}
	async run(opts, report) {
		const ctrl = new AbortController();
		this.ctrl = ctrl;
		const { signal } = ctrl;
		const agent = new https.Agent({
			keepAlive: true,
			maxSockets: 8
		});
		const secs = opts.duration === "quick" ? 5 : 10;
		const warm = opts.duration === "quick" ? 1 : 1.5;
		const result = {
			ok: false,
			cancelled: false,
			error: null,
			server: opts.server,
			serverLabel: "",
			latencyMs: null,
			jitterMs: null,
			downMbps: null,
			upMbps: null,
			downPath: null,
			upPath: null,
			finishedAt: 0
		};
		try {
			const target = await this.pickTarget(opts, agent, signal);
			result.serverLabel = target.label;
			const hasUpload = target.uploadUrl != null;
			report({
				phase: "latency",
				progress: 0,
				currentMbps: null
			});
			await timedRequest(agent, target.latencyUrl, target.latencyMethod, signal);
			const times = [];
			for (let i = 0; i < 10; i++) {
				times.push(await timedRequest(agent, target.latencyUrl, target.latencyMethod, signal));
				report({
					phase: "latency",
					progress: .08 * (i + 1) / 10,
					currentMbps: null
				});
			}
			result.latencyMs = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
			const diffs = times.slice(1).map((t, i) => Math.abs(t - times[i]));
			result.jitterMs = Math.round(diffs.reduce((a, b) => a + b, 0) / diffs.length * 10) / 10;
			result.downMbps = await this.runPhase({
				kind: "download",
				secs,
				warm,
				signal,
				report,
				base: .08,
				span: hasUpload ? .47 : .9,
				onMid: async () => {
					result.downPath = await this.lookup(target.hosts);
				},
				worker: async (stream, stopAt, add) => {
					let round = 0;
					let failures = 0;
					while (!signal.aborted && performance.now() < stopAt) {
						const d = target.download(stream, round++);
						if (!await getStream(agent, d.url, d.headers, stopAt, signal, add)) {
							if (++failures > 6) return;
							await sleep(200);
						}
					}
				}
			});
			if (target.uploadUrl) {
				const uploadUrl = target.uploadUrl;
				result.upMbps = await this.runPhase({
					kind: "upload",
					secs,
					warm,
					signal,
					report,
					base: .55,
					span: .43,
					onMid: async () => {
						result.upPath = await this.lookup([CF_HOST]);
					},
					worker: async (_stream, stopAt, add) => {
						let failures = 0;
						while (!signal.aborted && performance.now() < stopAt) if (!await postStream(agent, uploadUrl, stopAt, signal, add)) {
							if (++failures > 6) return;
							await sleep(200);
						}
					}
				});
			}
			result.ok = true;
		} catch (e) {
			if (signal.aborted) result.cancelled = true;
			else result.error = e instanceof Error ? e.message : String(e);
		} finally {
			agent.destroy();
			this.ctrl = null;
			result.finishedAt = Date.now();
		}
		return result;
	}
	async pickTarget(opts, agent, signal) {
		if (opts.server === "cloudflare") return {
			label: "Cloudflare（海外，含上传）",
			hosts: [CF_HOST],
			latencyUrl: `https://${CF_HOST}/__down?bytes=0`,
			latencyMethod: "GET",
			download: (stream, round) => ({
				url: `https://${CF_HOST}/__down?bytes=25000000&r=${stream}-${round}-${Date.now()}`,
				headers: {}
			}),
			uploadUrl: `https://${CF_HOST}/__up`
		};
		for (const start of DOMESTIC_URLS) {
			const info = await headFinal(agent, start, signal);
			if (!info || !info.ranges || info.length < 512 * MB) continue;
			const hosts = [.../* @__PURE__ */ new Set([new URL(start).host, new URL(info.url).host])];
			return {
				label: `${new URL(start).host}（国内镜像，仅下载）`,
				hosts,
				latencyUrl: info.url,
				latencyMethod: "HEAD",
				download: (stream, round) => {
					const span = 64 * MB;
					const room = Math.max(1, info.length - span - 1);
					const off = (stream * 211 + round * 97) * MB % room;
					return {
						url: info.url,
						headers: { Range: `bytes=${off}-${off + span - 1}` }
					};
				},
				uploadUrl: null
			};
		}
		throw new Error("国内测速源暂时都不可用");
	}
	async runPhase(p) {
		const start = performance.now();
		const stopAt = start + p.secs * 1e3;
		let total = 0;
		let warmBytes = null;
		let warmT = start;
		let lastT = start;
		let lastB = 0;
		let midDone = false;
		const window = [];
		const add = (n) => {
			total += n;
		};
		const timer = setInterval(() => {
			const now = performance.now();
			const inst = (total - lastB) * 8 / 1e6 / ((now - lastT) / 1e3);
			lastT = now;
			lastB = total;
			window.push(inst);
			if (window.length > 4) window.shift();
			if (warmBytes === null && now - start >= p.warm * 1e3) {
				warmBytes = total;
				warmT = now;
			}
			if (!midDone && now - start > p.secs * 500) {
				midDone = true;
				p.onMid();
			}
			p.report({
				phase: p.kind,
				progress: p.base + p.span * Math.min(1, (now - start) / (p.secs * 1e3)),
				currentMbps: window.reduce((a, b) => a + b, 0) / window.length
			});
		}, 250);
		await Promise.allSettled(Array.from({ length: STREAMS }, (_, i) => p.worker(i, stopAt, add)));
		clearInterval(timer);
		if (p.signal.aborted) throw new Error("已取消");
		if (total === 0) throw new Error(p.kind === "download" ? "下载没有收到数据" : "上传没有成功");
		const end = performance.now();
		const fromBytes = warmBytes ?? 0;
		const fromT = warmBytes === null || end - warmT < 500 ? start : warmT;
		const bytes = fromT === start ? total : total - fromBytes;
		return Math.round(bytes * 8 / 1e6 / ((end - fromT) / 1e3) * 10) / 10;
	}
};
//#endregion
//#region src/main/cooling/identify.ts
var BOARD_FAN_RE = /^\/lpc\/[\w-]+(\/\d+)?\/fan\/\d+$/;
var SETTLE_MS = 3500;
var wait = (ms) => new Promise((r) => setTimeout(r, ms));
var running = false;
/**
* 把主板上的一路风扇临时调到 100% 约 8 秒，再交还主板，用来分辨它是哪个风扇。
* 只处理主板接口；已指定为水泵的接口拒绝；无论成功与否，最后都会交还。
*/
async function identifyFan(lhm, fanId, cfg) {
	const fail = (error) => ({
		ok: false,
		error,
		before: null,
		peak: null,
		after: null
	});
	if (!BOARD_FAN_RE.test(fanId)) return fail("只能识别主板上的风扇接口");
	if (cfg.roles[fanId] === "pump") return fail("这个接口已指定为水泵，为安全起见不参与识别");
	if (running) return fail("另一个识别正在进行");
	const controlId = fanId.replace(/\/fan\/(\d+)$/, "/control/$1");
	if (!lhm.get(controlId)) return fail("没有找到这个接口的控制通道，可能不支持调速");
	running = true;
	try {
		let before = null;
		let peak = null;
		try {
			before = await lhm.readSensor(fanId);
			if (!await lhm.setControl(controlId, 100)) return fail("LibreHardwareMonitor 拒绝了调速请求");
			await wait(SETTLE_MS);
			const mid = await lhm.readSensor(fanId);
			await wait(SETTLE_MS);
			const seen = [mid, await lhm.readSensor(fanId)].filter((v) => v != null);
			peak = seen.length > 0 ? Math.max(...seen) : null;
		} finally {
			let restored = false;
			for (let i = 0; i < 3 && !restored; i++) restored = await lhm.setControl(controlId, null);
		}
		await wait(3e3);
		return {
			ok: true,
			before,
			peak,
			after: await lhm.readSensor(fanId)
		};
	} finally {
		running = false;
	}
}
//#endregion
//#region src/main/ipc.ts
var finite = (v) => typeof v === "number" && Number.isFinite(v);
function parseHistoryQuery(v) {
	const q = v;
	if (!q || !Array.isArray(q.keys) || !q.keys.every((k) => typeof k === "string") || q.keys.length > 60) throw new Error("无效的历史查询：指标列表");
	if (!finite(q.from) || !finite(q.to) || !finite(q.maxPoints)) throw new Error("无效的历史查询：时间范围");
	return {
		keys: q.keys,
		from: q.from,
		to: q.to,
		maxPoints: q.maxPoints
	};
}
function parseSpeedOptions(v) {
	const o = v;
	if (o?.server !== "cloudflare" && o?.server !== "domestic" || o.duration !== "quick" && o.duration !== "standard") throw new Error("无效的测速参数");
	return {
		server: o.server,
		duration: o.duration
	};
}
function registerIpc({ store, scheduler, alerts, history }) {
	const tester = new SpeedTester((hosts) => scheduler.lookupRoute(hosts));
	electron.ipcMain.on(IPC.themeSet, (_e, mode) => {
		if (mode === "system" || mode === "light" || mode === "dark") electron.nativeTheme.themeSource = mode;
	});
	electron.ipcMain.handle(IPC.metricsGetLatest, () => scheduler.getLatest());
	electron.ipcMain.handle(IPC.settingsGet, () => store.get());
	electron.ipcMain.handle(IPC.settingsSet, (_e, patch) => store.patch(patch ?? {}));
	electron.ipcMain.on(IPC.alertTest, () => alerts.test());
	electron.ipcMain.handle(IPC.appInfo, () => ({
		isPackaged: electron.app.isPackaged,
		version: electron.app.getVersion()
	}));
	electron.ipcMain.handle(IPC.speedtestStart, async (e, raw) => {
		const opts = parseSpeedOptions(raw);
		if (tester.running) throw new Error("测速正在进行");
		return tester.run(opts, (p) => {
			if (!e.sender.isDestroyed()) e.sender.send(IPC.speedtestProgress, p);
		});
	});
	electron.ipcMain.on(IPC.speedtestCancel, () => tester.cancel());
	electron.ipcMain.handle(IPC.historySeries, () => history.series());
	electron.ipcMain.handle(IPC.historyQuery, (_e, q) => history.query(parseHistoryQuery(q)));
	electron.ipcMain.handle(IPC.historyEvents, (_e, from, to) => {
		if (!finite(from) || !finite(to)) throw new Error("无效的时间范围");
		return history.listEvents(from, to);
	});
	electron.ipcMain.handle(IPC.historyEvent, (_e, id) => {
		if (!finite(id)) throw new Error("无效的事件编号");
		return history.getEvent(id);
	});
	electron.ipcMain.handle(IPC.coolingIdentify, (_e, fanId) => {
		if (typeof fanId !== "string") throw new Error("无效的风扇标识");
		return identifyFan(scheduler.lhm, fanId, store.get().cooling);
	});
	electron.ipcMain.handle(IPC.historyStats, () => history.stats());
	electron.ipcMain.handle(IPC.historyClear, () => history.clear());
	electron.ipcMain.handle(IPC.historyExport, async (e) => {
		try {
			const win = electron.BrowserWindow.fromWebContents(e.sender);
			const opts = {
				title: "导出历史数据",
				defaultPath: "SysMonitor-历史数据.csv",
				filters: [{
					name: "CSV 表格",
					extensions: ["csv"]
				}]
			};
			const r = win ? await electron.dialog.showSaveDialog(win, opts) : await electron.dialog.showSaveDialog(opts);
			if (r.canceled || !r.filePath) return { ok: false };
			const eventsFile = r.filePath.replace(/\.csv$/i, "") + "-事件.csv";
			history.exportCsv(r.filePath, eventsFile);
			return {
				ok: true,
				path: r.filePath
			};
		} catch (err) {
			return {
				ok: false,
				error: err instanceof Error ? err.message : String(err)
			};
		}
	});
}
//#endregion
//#region src/main/settings.ts
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
//#endregion
//#region src/main/tray.ts
var AppTray = class {
	actions;
	tray = null;
	taskbarEnabled = false;
	lastTip = "";
	constructor(actions) {
		this.actions = actions;
	}
	create(icon) {
		this.tray = new electron.Tray(icon.resize({
			width: 16,
			height: 16
		}));
		this.tray.setToolTip("SysMonitor");
		this.tray.on("click", () => this.actions.showMain());
		this.rebuild();
	}
	update(taskbarEnabled) {
		this.taskbarEnabled = taskbarEnabled;
		this.rebuild();
	}
	setTooltip(text) {
		if (!this.tray || text === this.lastTip) return;
		this.lastTip = text;
		this.tray.setToolTip(text.slice(0, 120));
	}
	destroy() {
		this.tray?.destroy();
		this.tray = null;
	}
	rebuild() {
		if (!this.tray) return;
		this.tray.setContextMenu(electron.Menu.buildFromTemplate([
			{
				label: "显示主窗口",
				click: this.actions.showMain
			},
			{
				label: "设置",
				click: this.actions.openSettings
			},
			{ type: "separator" },
			{
				label: "在任务栏显示",
				type: "checkbox",
				checked: this.taskbarEnabled,
				click: this.actions.toggleTaskbar
			},
			{ type: "separator" },
			{
				label: "退出",
				click: this.actions.quit
			}
		]));
	}
};
//#endregion
//#region src/main/windows/mainWindow.ts
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
//#endregion
//#region src/shared/taskbar.ts
function taskbarMetrics(fontSize) {
	const colW = Math.round(fontSize * 8.8);
	const gap = Math.round(fontSize * 1.5);
	return {
		colW,
		gap,
		lineHeight: Math.round(fontSize * 1.42),
		width: colW * 3 + gap * 2 + 24
	};
}
//#endregion
//#region src/main/windows/taskbarWindow.ts
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
//#endregion
//#region src/main/index.ts
var fmtRate = (b) => {
	if (b == null) return "--";
	return b >= 1024 ** 2 ? `${(b / 1024 ** 2).toFixed(1)} MB/s` : `${Math.round(b / 1024)} KB/s`;
};
function tooltipOf(s) {
	const n = (v) => v == null ? "--" : Math.round(v);
	return [`CPU ${n(s.cpu.usage)}% · GPU ${n(s.gpu.usage)}% · 内存 ${n(s.memory.usagePercent)}%`, `↓${fmtRate(s.network.rxBytesPerSec)} ↑${fmtRate(s.network.txBytesPerSec)} · 约 ${n(s.power.totalW)} W`].join("\n");
}
try {
	(0, os.setPriority)(os.constants.priority.PRIORITY_ABOVE_NORMAL);
} catch {}
if (!electron.app.requestSingleInstanceLock()) electron.app.quit();
else {
	const store = new SettingsStore();
	const scheduler = new MetricsScheduler();
	let quitting = false;
	let mainWin = null;
	const icon = makeAppIcon();
	const startHidden = process.argv.includes("--hidden");
	const openMain = () => {
		if (!mainWin || mainWin.isDestroyed()) {
			mainWin = createMainWindow({
				icon,
				startHidden: false,
				closeToTray: () => store.get().closeToTray,
				isQuitting: () => quitting
			});
			mainWin.on("closed", () => electron.app.quit());
		}
		if (mainWin.isMinimized()) mainWin.restore();
		mainWin.show();
		mainWin.focus();
		return mainWin;
	};
	electron.app.on("second-instance", () => openMain());
	electron.app.whenReady().then(() => {
		electron.app.setAppUserModelId("com.sysmonitor.desktop");
		store.load();
		const taskbar = new TaskbarWindow(store.get());
		const history = new HistoryStore(electron.app.getPath("userData"), store.get().history);
		history.open();
		const allMetrics = (snap) => [...snapshotMetrics(snap), ...sensorMetrics(scheduler.lhm.list())];
		const alerts = new AlertEngine(() => openMain(), {
			open: (c, since, snap) => history.openEvent({
				kind: "alert",
				key: c.id,
				severity: "warn",
				title: c.title,
				detail: c.body,
				ts: since
			}, makeEventSnapshot(snap, allMetrics(snap))),
			close: (id, ts) => history.closeEvent(id, ts)
		});
		const tray = new AppTray({
			showMain: () => openMain(),
			openSettings: () => {
				const win = openMain();
				const send = () => win.webContents.send(IPC.uiOpenSettings);
				if (win.webContents.isLoading()) win.webContents.once("did-finish-load", send);
				else send();
			},
			toggleTaskbar: () => store.patch({ taskbar: { enabled: !store.get().taskbar.enabled } }),
			quit: () => electron.app.quit()
		});
		tray.create(icon);
		const applyAutoStart = (on) => {
			if (!electron.app.isPackaged) return;
			electron.app.setLoginItemSettings({
				openAtLogin: on,
				args: ["--hidden"]
			});
		};
		const severityOf = {
			low: "info",
			medium: "warn",
			high: "warn"
		};
		const confidenceText = {
			low: "低",
			medium: "中",
			high: "高"
		};
		const diagnosis = new DiagnosisEngine({
			open: (rule, r, since, snap) => history.openEvent({
				kind: "diag",
				key: rule.id,
				severity: severityOf[r.confidence],
				title: `潜在性能瓶颈：${titleOf(rule, r)}`,
				detail: r.cause,
				confidence: confidenceText[r.confidence],
				extra: {
					evidence: r.evidence,
					cause: r.cause,
					suggestions: r.suggestions,
					processes: r.processes
				},
				ts: since
			}, makeEventSnapshot(snap, allMetrics(snap))),
			close: (id, ts, extra) => history.closeEvent(id, ts, extra)
		});
		scheduler.onBeforeSend((snap) => {
			snap.diagnosis = diagnosis.update(snap, store.get().diag);
		});
		registerIpc({
			store,
			scheduler,
			alerts,
			history
		});
		store.onChange((next, prev) => {
			scheduler.applySettings(next);
			history.applySettings(next.history);
			taskbar.apply(next);
			tray.update(next.taskbar.enabled);
			if (next.autoStart !== prev.autoStart) applyAutoStart(next.autoStart);
			for (const w of electron.BrowserWindow.getAllWindows()) if (!w.isDestroyed()) w.webContents.send(IPC.settingsChanged, next);
		});
		scheduler.onShellInfo((info) => taskbar.onShell(info));
		scheduler.onFanSpun((ids) => store.patch({ cooling: { spun: ids } }));
		scheduler.onSnapshot((snap) => {
			alerts.evaluate(snap, store.get().alerts);
			history.record(Date.now(), allMetrics(snap));
			tray.setTooltip(tooltipOf(snap));
		});
		mainWin = createMainWindow({
			icon,
			startHidden,
			closeToTray: () => store.get().closeToTray,
			isQuitting: () => quitting
		});
		mainWin.on("closed", () => electron.app.quit());
		const s = store.get();
		taskbar.apply(s);
		tray.update(s.taskbar.enabled);
		applyAutoStart(s.autoStart);
		scheduler.start(s);
		let fansReleased = false;
		electron.app.on("will-quit", (e) => {
			if (fansReleased) return;
			e.preventDefault();
			Promise.race([scheduler.releaseFans(), new Promise((r) => setTimeout(r, 2500))]).finally(() => {
				fansReleased = true;
				electron.app.quit();
			});
		});
		electron.app.on("before-quit", () => {
			quitting = true;
			scheduler.stop();
			alerts.closeAll();
			diagnosis.closeAll();
			history.close();
			store.flush();
			taskbar.close();
			tray.destroy();
		});
	});
	electron.app.on("window-all-closed", () => {
		electron.app.quit();
	});
}
//#endregion
