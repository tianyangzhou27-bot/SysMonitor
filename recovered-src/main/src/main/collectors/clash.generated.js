// GENERATED FRAGMENT — extracted from out/main/index.js, lines 2326-2505.
// Original module marker: src/main/collectors/clash.ts. Not the original TypeScript/TSX source.
// Depends on bundle-level imports, globals, and other fragments; not standalone.
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
