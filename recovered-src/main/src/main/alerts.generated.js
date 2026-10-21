// GENERATED FRAGMENT — extracted from out/main/index.js, lines 195-381.
// Original module marker: src/main/alerts.ts. Not the original TypeScript/TSX source.
// Depends on bundle-level imports, globals, and other fragments; not standalone.
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
