// GENERATED FRAGMENT — extracted from out/main/index.js, lines 1218-1437.
// Original module marker: src/main/cooling/controller.ts. Not the original TypeScript/TSX source.
// Depends on bundle-level imports, globals, and other fragments; not standalone.
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
