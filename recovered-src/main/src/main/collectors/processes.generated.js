// GENERATED FRAGMENT — extracted from out/main/index.js, lines 2508-2592.
// Original module marker: src/main/collectors/processes.ts. Not the original TypeScript/TSX source.
// Depends on bundle-level imports, globals, and other fragments; not standalone.
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
