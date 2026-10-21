// GENERATED FRAGMENT — extracted from out/main/index.js, lines 2066-2220.
// Original module marker: src/main/collectors/network.ts. Not the original TypeScript/TSX source.
// Depends on bundle-level imports, globals, and other fragments; not standalone.
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
