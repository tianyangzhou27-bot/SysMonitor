// GENERATED FRAGMENT — extracted from out/main/index.js, lines 1440-1548.
// Original module marker: src/main/frametime/stats.ts. Not the original TypeScript/TSX source.
// Depends on bundle-level imports, globals, and other fragments; not standalone.
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
