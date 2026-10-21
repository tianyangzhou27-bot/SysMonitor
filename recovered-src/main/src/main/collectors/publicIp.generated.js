// GENERATED FRAGMENT — extracted from out/main/index.js, lines 2004-2063.
// Original module marker: src/main/collectors/publicIp.ts. Not the original TypeScript/TSX source.
// Depends on bundle-level imports, globals, and other fragments; not standalone.
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
