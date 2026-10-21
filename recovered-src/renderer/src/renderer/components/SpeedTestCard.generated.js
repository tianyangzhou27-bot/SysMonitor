// GENERATED FRAGMENT — extracted from out/renderer/assets/index-CzIv0K4n.js, lines 25417-25672.
// Original module marker: src/renderer/components/SpeedTestCard.tsx. Not the original TypeScript/TSX source.
// Depends on bundle-level imports, globals, and other fragments; not standalone.
var PHASE_LABEL = {
	latency: "延迟测试",
	download: "下载测试",
	upload: "上传测试"
};
var SERVERS = [{
	key: "cloudflare",
	label: "Cloudflare（含上传）"
}, {
	key: "domestic",
	label: "国内下载"
}];
var DURATIONS = [{
	key: "quick",
	label: "快速"
}, {
	key: "standard",
	label: "标准"
}];
var fmt = (v, d = 1) => v == null ? "--" : v.toFixed(d);
function Stat({ label, value, unit, sub }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "stat",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: label }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("b", { children: [value, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: unit })] }),
			sub && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("em", { children: sub })
		]
	});
}
function SpeedTestCard() {
	const [server, setServer] = (0, import_react.useState)("cloudflare");
	const [duration, setDuration] = (0, import_react.useState)("standard");
	const [running, setRunning] = (0, import_react.useState)(false);
	const [progress, setProgress] = (0, import_react.useState)(0);
	const [phase, setPhase] = (0, import_react.useState)(null);
	const [mbps, setMbps] = (0, import_react.useState)(null);
	const [series, setSeries] = (0, import_react.useState)([]);
	const [result, setResult] = (0, import_react.useState)(null);
	const [history, setHistory] = (0, import_react.useState)([]);
	const phaseRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => window.api.speedtest.onProgress((p) => {
		setProgress(p.progress);
		setPhase(p.phase);
		setMbps(p.currentMbps);
		if (p.phase !== phaseRef.current) {
			phaseRef.current = p.phase;
			setSeries([]);
		}
		if (p.currentMbps != null) setSeries((s) => [...s, p.currentMbps].slice(-80));
	}), []);
	const start = async () => {
		if (running) return;
		setRunning(true);
		setResult(null);
		setProgress(0);
		setPhase("latency");
		setMbps(null);
		setSeries([]);
		phaseRef.current = null;
		try {
			const r = await window.api.speedtest.start({
				server,
				duration
			});
			setResult(r);
			if (r.ok) setHistory((h) => [r, ...h].slice(0, 4));
		} catch (e) {
			setResult({
				ok: false,
				cancelled: false,
				error: e instanceof Error ? e.message : String(e),
				server,
				serverLabel: "",
				latencyMs: null,
				jitterMs: null,
				downMbps: null,
				upMbps: null,
				downPath: null,
				upPath: null,
				finishedAt: Date.now()
			});
		} finally {
			setRunning(false);
			setPhase(null);
		}
	};
	const r = result;
	const approx = duration === "quick" ? "0.2 到 0.4 GB" : "0.4 到 0.8 GB";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, {
		className: "panel speed-test",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "panel__head",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Timer, {
					size: 18,
					strokeWidth: 1.75
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "网速测试" })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "st__opts",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "seg",
					children: SERVERS.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						className: server === s.key ? "is-on" : "",
						disabled: running,
						onClick: () => setServer(s.key),
						children: s.label
					}, s.key))
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "seg",
					children: DURATIONS.map((d) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						className: duration === d.key ? "is-on" : "",
						disabled: running,
						onClick: () => setDuration(d.key),
						children: d.label
					}, d.key))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "st__actions",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						className: "btn btn--primary",
						disabled: running,
						onClick: start,
						children: running ? "测速中…" : "开始测速"
					}),
					running && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						className: "btn",
						onClick: () => window.api.speedtest.cancel(),
						children: "取消"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("small", { children: [
						"按 300 Mbps 估算，本次约消耗 ",
						approx,
						" 流量"
					] })
				]
			}),
			running && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "st__live",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "st__phase",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: phase ? PHASE_LABEL[phase] : "" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [Math.round(progress * 100), "%"] })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "st__bar",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { width: `${progress * 100}%` } })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "st__now",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnimatedNumber, {
							value: phase === "latency" ? null : mbps,
							decimals: 1,
							duration: 200
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Mbps" })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkline, {
						data: series,
						capacity: 80,
						height: 56
					})
				]
			}),
			r && !running && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "st__result",
				children: [
					r.error && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "st__err",
						children: ["测速失败：", r.error]
					}),
					r.cancelled && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "panel__hint",
						children: "已取消"
					}),
					r.ok && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "stats",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
									label: "下载",
									value: fmt(r.downMbps),
									unit: "Mbps",
									sub: r.downMbps != null ? `≈ ${(r.downMbps / 8).toFixed(1)} MB/s` : void 0
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
									label: "上传",
									value: fmt(r.upMbps),
									unit: "Mbps",
									sub: r.upMbps != null ? `≈ ${(r.upMbps / 8).toFixed(1)} MB/s` : "此源不测上传"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
									label: "延迟",
									value: fmt(r.latencyMs, 0),
									unit: "ms"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
									label: "抖动",
									value: fmt(r.jitterMs),
									unit: "ms"
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "chips",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "chip",
									title: "测速服务器",
									children: r.serverLabel
								}),
								r.downPath && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "chip",
									children: ["下载", r.downPath]
								}),
								r.upPath && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "chip",
									children: ["上传", r.upPath]
								}),
								!r.downPath && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "chip chip--dim",
									children: "未检测到 Clash，路径未知"
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "panel__hint",
							children: "测速流量按 Clash 规则走，上面标出的是这次实际走的路径，测到的是该路径的速度。"
						})
					] })
				]
			}),
			history.length > 1 && !running && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "st__hist",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: "最近记录" }), history.slice(1).map((h) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "st__histrow",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: new Date(h.finishedAt).toLocaleTimeString() }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
							"↓ ",
							fmt(h.downMbps),
							" · ↑ ",
							fmt(h.upMbps),
							" Mbps · ",
							fmt(h.latencyMs, 0),
							" ms"
						] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: h.downPath ?? "" })
					]
				}, h.finishedAt))]
			})
		]
	});
}
