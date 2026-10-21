// GENERATED FRAGMENT — extracted from out/main/index.js, lines 2858-2926.
// Original module marker: src/main/collectors/quality.ts. Not the original TypeScript/TSX source.
// Depends on bundle-level imports, globals, and other fragments; not standalone.
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
