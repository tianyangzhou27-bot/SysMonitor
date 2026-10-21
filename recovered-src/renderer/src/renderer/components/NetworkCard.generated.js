// GENERATED FRAGMENT — extracted from out/renderer/assets/index-CzIv0K4n.js, lines 24221-24418.
// Original module marker: src/renderer/components/NetworkCard.tsx. Not the original TypeScript/TSX source.
// Depends on bundle-level imports, globals, and other fragments; not standalone.
var REACH = {
	online: {
		text: "已联网",
		cls: "is-ok"
	},
	"lan-only": {
		text: "仅局域网",
		cls: "is-warn"
	},
	offline: {
		text: "离线",
		cls: "is-danger"
	}
};
var KIND_LABEL = {
	wired: "有线",
	wireless: "Wi-Fi",
	virtual: "虚拟",
	other: "其他"
};
function linkText(mbps) {
	if (mbps == null) return null;
	return mbps >= 1e3 ? `${(mbps / 1e3).toFixed(mbps % 1e3 === 0 ? 0 : 1)} Gbps` : `${mbps} Mbps`;
}
function Speed({ label, icon, bytes }) {
	const p = rateParts(bytes);
	const Icon = icon === "down" ? ArrowDown : ArrowUp;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: `speed speed--${icon}`,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("small", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
				size: 13,
				strokeWidth: 2
			}), label] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "speed__v",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnimatedNumber, {
					value: p.value,
					decimals: p.decimals
				}, p.unit), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: p.unit })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("em", { children: formatMbps(bytes) })
		]
	});
}
function Masked({ value }) {
	const [shown, setShown] = (0, import_react.useState)(false);
	if (!value) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: "--" });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "mask",
		onMouseEnter: () => setShown(true),
		onMouseLeave: () => setShown(false),
		children: shown ? value : "***************"
	});
}
function Row$1({ k, children, title }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "kv__row",
		title,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: k }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children })]
	});
}
function NetworkCard({ net, rxHist, txHist }) {
	const reach = net?.reach ? REACH[net.reach] : null;
	const p = net?.primary ?? null;
	const hasTunnel = net?.nics.some((n) => n.tunnel) ?? false;
	const ip = net?.publicIp;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, {
		className: "panel net",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "panel__head",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Network, {
						size: 18,
						strokeWidth: 1.75
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "网络" }),
					reach && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: `badge ${reach.cls}`,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", {}), reach.text]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "net__nic",
				children: p ? [
					KIND_LABEL[p.kind],
					p.name,
					linkText(p.linkMbps)
				].filter(Boolean).join(" · ") : "未检测到活动网卡"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "net__speeds",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Speed, {
					label: "下载",
					icon: "down",
					bytes: net?.rxBytesPerSec ?? null
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Speed, {
					label: "上传",
					icon: "up",
					bytes: net?.txBytesPerSec ?? null
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "net__chart",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkline, {
					data: rxHist,
					secondary: txHist,
					height: 64
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
				className: "kv",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row$1, {
						k: "本地 IP",
						title: "鼠标悬停显示",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Masked, { value: p?.ip4 ?? null })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row$1, {
						k: "网关",
						children: p?.gateway ?? "--"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row$1, {
						k: "DNS",
						children: net?.dns.length ? net.dns.join(" / ") : "--"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row$1, {
						k: "网关延迟",
						children: formatMs(net?.gatewayLatencyMs ?? null)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row$1, {
						k: "外网延迟",
						title: "到 223.5.5.5:443 的 TCP 连接耗时",
						children: formatMs(net?.internetLatencyMs ?? null)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row$1, {
						k: "国内出口 IP",
						title: "每 60 秒更新；通常按规则直连",
						children: ip?.domestic ?? "--"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Row$1, {
						k: "海外出口 IP",
						title: "每 60 秒更新；通常按规则走代理",
						children: [ip?.overseas ?? "--", ip?.overseasLoc ? ` (${ip.overseasLoc})` : ""]
					}),
					net?.wifi && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Row$1, {
						k: "Wi-Fi",
						children: [net.wifi.ssid ?? "--", net.wifi.signalPercent != null ? ` · 信号 ${net.wifi.signalPercent}%` : ""]
					})
				]
			}),
			hasTunnel && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "panel__hint",
				children: "已检测到隧道网卡：上面的速度是物理网卡流量（隧道加密后），应用真实流量见下方网卡列表。"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("details", {
				className: "nics",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("summary", { children: ["全部活动网卡 · ", net?.nics.length ?? 0] }), (net?.nics ?? []).map((n) => {
					const rx = rateParts(n.rxBytesPerSec);
					const tx = rateParts(n.txBytesPerSec);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "nics__row",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: n.name }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "tag",
									children: n.tunnel ?? KIND_LABEL[n.kind]
								}),
								n.isDefault && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "tag tag--on",
									children: "主网卡"
								})
							] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Masked, { value: n.ip4 }) }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("small", {
								className: "nics__speed",
								children: [
									"↓ ",
									rx.value == null ? "--" : rx.value.toFixed(rx.decimals),
									" ",
									rx.unit,
									" · ↑",
									" ",
									tx.value == null ? "--" : tx.value.toFixed(tx.decimals),
									" ",
									tx.unit
								]
							})
						]
					}, `${n.name}-${n.description}`);
				})]
			})
		]
	});
}
