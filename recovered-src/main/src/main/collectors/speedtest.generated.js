// GENERATED FRAGMENT — extracted from out/main/index.js, lines 4491-4839.
// Original module marker: src/main/collectors/speedtest.ts. Not the original TypeScript/TSX source.
// Depends on bundle-level imports, globals, and other fragments; not standalone.
var CF_HOST = "speed.cloudflare.com";
var DOMESTIC_PATH = "centos-vault/7.9.2009/isos/x86_64/CentOS-7-x86_64-DVD-2009.iso";
var DOMESTIC_URLS = [
	"mirrors.cloud.tencent.com",
	"mirrors.163.com",
	"mirrors.tuna.tsinghua.edu.cn",
	"mirror.nju.edu.cn"
].map((host) => `https://${host}/${DOMESTIC_PATH}`);
var STREAMS = 4;
var UA = "SysMonitor-SpeedTest/0.1";
var MB = 1048576;
var CHUNK = (0, crypto.randomBytes)(262144);
var POST_SIZE = 8 * MB;
var sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function timedRequest(agent, url, method, signal) {
	return new Promise((resolve, reject) => {
		const t0 = performance.now();
		const req = https.request(url, {
			method,
			agent,
			timeout: 6e3,
			headers: {
				"User-Agent": UA,
				"Accept-Encoding": "identity"
			}
		}, (res) => {
			res.resume();
			res.on("end", () => resolve(performance.now() - t0));
			res.on("error", reject);
		});
		req.on("error", reject);
		req.on("timeout", () => req.destroy(/* @__PURE__ */ new Error("延迟测试超时")));
		signal.addEventListener("abort", () => req.destroy(/* @__PURE__ */ new Error("已取消")), { once: true });
		req.end();
	});
}
async function headFinal(agent, start, signal) {
	let url = start;
	for (let hop = 0; hop <= 3; hop++) {
		const r = await new Promise((resolve) => {
			const req = https.request(url, {
				method: "HEAD",
				agent,
				timeout: 6e3,
				headers: { "User-Agent": UA }
			}, (res) => {
				res.resume();
				resolve({
					status: res.statusCode ?? 0,
					location: res.headers.location,
					length: Number(res.headers["content-length"] ?? 0),
					ranges: res.headers["accept-ranges"] === "bytes"
				});
			});
			req.on("error", () => resolve(null));
			req.on("timeout", () => req.destroy());
			signal.addEventListener("abort", () => req.destroy(), { once: true });
			req.end();
		});
		if (!r) return null;
		if (r.status >= 300 && r.status < 400 && r.location) {
			url = new URL(r.location, url).toString();
			if (!url.startsWith("https:")) return null;
			continue;
		}
		return r.status === 200 ? {
			url,
			length: r.length,
			ranges: r.ranges
		} : null;
	}
	return null;
}
function getStream(agent, url, headers, stopAt, signal, add) {
	return new Promise((resolve) => {
		let done = false;
		let kill;
		const finish = (ok) => {
			if (done) return;
			done = true;
			clearTimeout(kill);
			resolve(ok);
		};
		const req = https.get(url, {
			agent,
			headers: {
				"User-Agent": UA,
				"Accept-Encoding": "identity",
				...headers
			}
		}, (res) => {
			if (res.statusCode !== 200 && res.statusCode !== 206) {
				res.resume();
				finish(false);
				return;
			}
			res.on("data", (c) => {
				add(c.length);
				if (performance.now() >= stopAt) req.destroy();
			});
			res.on("end", () => finish(true));
			res.on("close", () => finish(true));
			res.on("error", () => finish(true));
		});
		kill = setTimeout(() => req.destroy(), Math.max(0, stopAt - performance.now()) + 500);
		req.on("error", () => finish(false));
		signal.addEventListener("abort", () => req.destroy(), { once: true });
	});
}
function postStream(agent, url, stopAt, signal, add) {
	return new Promise((resolve) => {
		let done = false;
		let kill;
		const finish = (ok) => {
			if (done) return;
			done = true;
			clearTimeout(kill);
			resolve(ok);
		};
		const req = https.request(url, {
			method: "POST",
			agent,
			headers: {
				"User-Agent": UA,
				"Content-Type": "application/octet-stream",
				"Content-Length": String(POST_SIZE)
			}
		}, (res) => {
			res.resume();
			res.on("end", () => finish((res.statusCode ?? 500) < 400));
			res.on("error", () => finish(false));
		});
		kill = setTimeout(() => req.destroy(), Math.max(0, stopAt - performance.now()) + 300);
		req.on("error", () => finish(false));
		signal.addEventListener("abort", () => req.destroy(), { once: true });
		let sent = 0;
		const pump = () => {
			while (sent < POST_SIZE) {
				if (signal.aborted || performance.now() >= stopAt) {
					req.destroy();
					return;
				}
				const ok = req.write(CHUNK);
				sent += CHUNK.length;
				add(CHUNK.length);
				if (!ok) {
					req.once("drain", pump);
					return;
				}
			}
			req.end();
		};
		pump();
	});
}
var SpeedTester = class {
	lookup;
	ctrl = null;
	constructor(lookup) {
		this.lookup = lookup;
	}
	get running() {
		return this.ctrl !== null;
	}
	cancel() {
		this.ctrl?.abort();
	}
	async run(opts, report) {
		const ctrl = new AbortController();
		this.ctrl = ctrl;
		const { signal } = ctrl;
		const agent = new https.Agent({
			keepAlive: true,
			maxSockets: 8
		});
		const secs = opts.duration === "quick" ? 5 : 10;
		const warm = opts.duration === "quick" ? 1 : 1.5;
		const result = {
			ok: false,
			cancelled: false,
			error: null,
			server: opts.server,
			serverLabel: "",
			latencyMs: null,
			jitterMs: null,
			downMbps: null,
			upMbps: null,
			downPath: null,
			upPath: null,
			finishedAt: 0
		};
		try {
			const target = await this.pickTarget(opts, agent, signal);
			result.serverLabel = target.label;
			const hasUpload = target.uploadUrl != null;
			report({
				phase: "latency",
				progress: 0,
				currentMbps: null
			});
			await timedRequest(agent, target.latencyUrl, target.latencyMethod, signal);
			const times = [];
			for (let i = 0; i < 10; i++) {
				times.push(await timedRequest(agent, target.latencyUrl, target.latencyMethod, signal));
				report({
					phase: "latency",
					progress: .08 * (i + 1) / 10,
					currentMbps: null
				});
			}
			result.latencyMs = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
			const diffs = times.slice(1).map((t, i) => Math.abs(t - times[i]));
			result.jitterMs = Math.round(diffs.reduce((a, b) => a + b, 0) / diffs.length * 10) / 10;
			result.downMbps = await this.runPhase({
				kind: "download",
				secs,
				warm,
				signal,
				report,
				base: .08,
				span: hasUpload ? .47 : .9,
				onMid: async () => {
					result.downPath = await this.lookup(target.hosts);
				},
				worker: async (stream, stopAt, add) => {
					let round = 0;
					let failures = 0;
					while (!signal.aborted && performance.now() < stopAt) {
						const d = target.download(stream, round++);
						if (!await getStream(agent, d.url, d.headers, stopAt, signal, add)) {
							if (++failures > 6) return;
							await sleep(200);
						}
					}
				}
			});
			if (target.uploadUrl) {
				const uploadUrl = target.uploadUrl;
				result.upMbps = await this.runPhase({
					kind: "upload",
					secs,
					warm,
					signal,
					report,
					base: .55,
					span: .43,
					onMid: async () => {
						result.upPath = await this.lookup([CF_HOST]);
					},
					worker: async (_stream, stopAt, add) => {
						let failures = 0;
						while (!signal.aborted && performance.now() < stopAt) if (!await postStream(agent, uploadUrl, stopAt, signal, add)) {
							if (++failures > 6) return;
							await sleep(200);
						}
					}
				});
			}
			result.ok = true;
		} catch (e) {
			if (signal.aborted) result.cancelled = true;
			else result.error = e instanceof Error ? e.message : String(e);
		} finally {
			agent.destroy();
			this.ctrl = null;
			result.finishedAt = Date.now();
		}
		return result;
	}
	async pickTarget(opts, agent, signal) {
		if (opts.server === "cloudflare") return {
			label: "Cloudflare（海外，含上传）",
			hosts: [CF_HOST],
			latencyUrl: `https://${CF_HOST}/__down?bytes=0`,
			latencyMethod: "GET",
			download: (stream, round) => ({
				url: `https://${CF_HOST}/__down?bytes=25000000&r=${stream}-${round}-${Date.now()}`,
				headers: {}
			}),
			uploadUrl: `https://${CF_HOST}/__up`
		};
		for (const start of DOMESTIC_URLS) {
			const info = await headFinal(agent, start, signal);
			if (!info || !info.ranges || info.length < 512 * MB) continue;
			const hosts = [.../* @__PURE__ */ new Set([new URL(start).host, new URL(info.url).host])];
			return {
				label: `${new URL(start).host}（国内镜像，仅下载）`,
				hosts,
				latencyUrl: info.url,
				latencyMethod: "HEAD",
				download: (stream, round) => {
					const span = 64 * MB;
					const room = Math.max(1, info.length - span - 1);
					const off = (stream * 211 + round * 97) * MB % room;
					return {
						url: info.url,
						headers: { Range: `bytes=${off}-${off + span - 1}` }
					};
				},
				uploadUrl: null
			};
		}
		throw new Error("国内测速源暂时都不可用");
	}
	async runPhase(p) {
		const start = performance.now();
		const stopAt = start + p.secs * 1e3;
		let total = 0;
		let warmBytes = null;
		let warmT = start;
		let lastT = start;
		let lastB = 0;
		let midDone = false;
		const window = [];
		const add = (n) => {
			total += n;
		};
		const timer = setInterval(() => {
			const now = performance.now();
			const inst = (total - lastB) * 8 / 1e6 / ((now - lastT) / 1e3);
			lastT = now;
			lastB = total;
			window.push(inst);
			if (window.length > 4) window.shift();
			if (warmBytes === null && now - start >= p.warm * 1e3) {
				warmBytes = total;
				warmT = now;
			}
			if (!midDone && now - start > p.secs * 500) {
				midDone = true;
				p.onMid();
			}
			p.report({
				phase: p.kind,
				progress: p.base + p.span * Math.min(1, (now - start) / (p.secs * 1e3)),
				currentMbps: window.reduce((a, b) => a + b, 0) / window.length
			});
		}, 250);
		await Promise.allSettled(Array.from({ length: STREAMS }, (_, i) => p.worker(i, stopAt, add)));
		clearInterval(timer);
		if (p.signal.aborted) throw new Error("已取消");
		if (total === 0) throw new Error(p.kind === "download" ? "下载没有收到数据" : "上传没有成功");
		const end = performance.now();
		const fromBytes = warmBytes ?? 0;
		const fromT = warmBytes === null || end - warmT < 500 ? start : warmT;
		const bytes = fromT === start ? total : total - fromBytes;
		return Math.round(bytes * 8 / 1e6 / ((end - fromT) / 1e3) * 10) / 10;
	}
};
