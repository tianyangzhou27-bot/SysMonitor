// GENERATED FRAGMENT — extracted from out/main/index.js, lines 2595-2855.
// Original module marker: src/main/collectors/proxy.ts. Not the original TypeScript/TSX source.
// Depends on bundle-level imports, globals, and other fragments; not standalone.
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
