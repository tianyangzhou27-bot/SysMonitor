// GENERATED FRAGMENT — extracted from out/renderer/assets/index-CzIv0K4n.js, lines 24590-24810.
// Original module marker: src/renderer/components/ProxyCard.tsx. Not the original TypeScript/TSX source.
// Depends on bundle-level imports, globals, and other fragments; not standalone.
var ROUTE_LABEL = {
	direct: "直连",
	"system-proxy": "系统代理",
	tun: "TUN",
	"system-proxy+tun": "系统代理 + TUN"
};
var MODE_ZH = {
	rule: "规则",
	global: "全局",
	direct: "直连"
};
function rate$1(bytes) {
	const p = rateParts(bytes);
	return p.value == null ? "--" : `${p.value.toFixed(p.decimals)} ${p.unit}`;
}
function Client({ c }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "client",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "client__head",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: c.name }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "tag",
						children: c.kind
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("small", { children: [
						"PID ",
						c.pids.join(", "),
						" · ",
						formatMB(c.memBytes)
					] })
				]
			}),
			c.ports.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "client__line",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: "监听端口" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "chips",
					children: c.ports.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "chip",
						title: p.hint ? `${p.hint}（按端口号推测）` : void 0,
						children: [
							p.port,
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("em", { children: p.proto }),
							p.hint && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("em", { children: p.hint }),
							p.scope === "lan" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("em", {
								className: "chip__warn",
								children: "局域网可达"
							})
						]
					}, `${p.proto}${p.port}`))
				})]
			}),
			c.remotes.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "client__line",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: "远端连接（按连接数）" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "remotes",
					children: c.remotes.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "remotes__row",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
							r.ip,
							":",
							r.port
						] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("small", { children: [
							r.guess ? `TCP · ${r.guess}（推测）` : "TCP",
							" · ×",
							r.count
						] })]
					}, `${r.ip}:${r.port}`))
				})]
			})
		]
	});
}
function ProxyCard({ proxy }) {
	const active = proxy?.clients.filter((c) => c.ports.length > 0 || c.remotes.length > 0) ?? [];
	const idle = proxy?.clients.filter((c) => c.ports.length === 0 && c.remotes.length === 0) ?? [];
	const clash = proxy?.clash ?? null;
	const sys = proxy?.systemProxy ?? null;
	const mode = proxy?.route.mode ?? "direct";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, {
		className: "panel proxy",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "panel__head",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, {
						size: 18,
						strokeWidth: 1.75
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "VPN / 代理" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: `badge ${mode === "direct" ? "is-none" : "is-ok"}`,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", {}), ROUTE_LABEL[mode]]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "proxy__route",
				children: proxy?.route.text ?? "读取中…"
			}),
			clash?.available && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "proxy__sec",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", { children: "Clash 内核" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "proxy__meta",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["mihomo ", clash.version ?? ""] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: clash.mode ? `${MODE_ZH[clash.mode] ?? clash.mode}模式` : "--" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["TUN ", clash.tun == null ? "--" : clash.tun ? "开启" : "关闭"] }),
							clash.mixedPort != null && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["混合端口 ", clash.mixedPort] })
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "proxy__meta",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
							"连接 ",
							clash.connections,
							"（直连 ",
							clash.directConnections,
							" / 代理",
							" ",
							clash.connections - clash.directConnections,
							"）"
						] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
							"↓ ",
							rate$1(clash.downBytesPerSec),
							" · ↑ ",
							rate$1(clash.upBytesPerSec)
						] })]
					}),
					clash.nodes.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "remotes",
						children: clash.nodes.map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "remotes__row",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: n.name }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("small", { children: [
								n.type ?? "--",
								" · ",
								formatMs(n.delayMs),
								" · ×",
								n.connections
							] })]
						}, n.name))
					})
				]
			}),
			clash && !clash.available && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "panel__hint",
				children: ["未能读取 Clash 控制器：", clash.reason]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "proxy__sec",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", { children: "代理 / VPN 客户端" }),
					active.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Client, { c }, c.name)),
					idle.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "chips",
						children: idle.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "chip",
							title: `${c.kind} · PID ${c.pids.join(", ")}`,
							children: [c.name, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("em", { children: "无端口" })]
						}, c.name))
					}),
					proxy && proxy.clients.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "panel__hint",
						children: "未检测到代理或 VPN 客户端进程"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "proxy__sec",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", { children: "虚拟网卡" }),
					(proxy?.tunnels ?? []).map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "nics__row",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: t.name }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "tag",
								children: t.kind
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: t.ip4 ?? "--" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("small", {
								className: "nics__speed",
								children: [
									"↓ ",
									rate$1(t.rxBytesPerSec),
									" · ↑ ",
									rate$1(t.txBytesPerSec)
								]
							})
						]
					}, t.name)),
					proxy && proxy.tunnels.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "panel__hint",
						children: "没有启用的 TUN / TAP / WireGuard 网卡"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "proxy__sec",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", { children: "系统代理" }), sys ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "proxy__meta",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: sys.enabled ? "已开启" : "已关闭" }),
						sys.server && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: sys.server }),
						sys.pacUrl && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["PAC ", sys.pacUrl] })
					]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "panel__hint",
					children: "--"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "panel__hint",
				children: "端口用途、协议类型均按端口号推测，仅供参考。"
			})
		]
	});
}
