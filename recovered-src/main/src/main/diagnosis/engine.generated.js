// GENERATED FRAGMENT — extracted from out/main/index.js, lines 4369-4482.
// Original module marker: src/main/diagnosis/engine.ts. Not the original TypeScript/TSX source.
// Depends on bundle-level imports, globals, and other fragments; not standalone.
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
