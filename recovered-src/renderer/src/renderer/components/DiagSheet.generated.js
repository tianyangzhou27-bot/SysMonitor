// GENERATED FRAGMENT — extracted from out/renderer/assets/index-CzIv0K4n.js, lines 18254-18477.
// Original module marker: src/renderer/components/DiagSheet.tsx. Not the original TypeScript/TSX source.
// Depends on bundle-level imports, globals, and other fragments; not standalone.
var DAY = 864e5;
function ExtraBlock({ extra }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "diag__extra",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: extra.cause }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", { children: "证据" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dl", {
				className: "kv hwd",
				children: extra.evidence.map((e) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "kv__row",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: e.label }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dd", { children: [e.value, e.threshold ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("small", { children: [
						"（判断条件 ",
						e.threshold,
						"）"
					] }) : null] })]
				}, e.label))
			}),
			extra.processes.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", { children: "当时占用最高的程序" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "hwd__note",
				children: [extra.processes.join("、"), "（只说明当时它们占用最高，不代表一定是它们造成的）"]
			})] }),
			extra.suggestions.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", { children: "建议排查方向" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "diag__tips",
				children: extra.suggestions.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: t }, t))
			})] })
		]
	});
}
function DiagSheet({ open, onClose, diag, frames, onReplay }) {
	const [events, setEvents] = (0, import_react.useState)([]);
	const [expanded, setExpanded] = (0, import_react.useState)(null);
	const activeKey = diag?.active.map((a) => a.rule).join(",") ?? "";
	(0, import_react.useEffect)(() => {
		if (!open) return;
		const load = () => {
			const now = Date.now();
			window.api.history.events(now - DAY, now).then((ev) => setEvents(ev.filter((e) => e.kind === "diag")));
		};
		load();
		const timer = setInterval(load, 15e3);
		return () => clearInterval(timer);
	}, [open, activeKey]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: `sheet ${open ? "is-open" : ""}`,
		"aria-hidden": !open,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "sheet__bar",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: "性能诊断" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				className: "btn",
				onClick: onClose,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, {
					size: 14,
					strokeWidth: 2
				}), " 完成"]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "sheet__body",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "hwd__note diag__intro",
					children: [
						"这里根据多个指标和持续时间，找出",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: "可能" }),
						"拖慢电脑的原因，结论都是「潜在性能瓶颈」。软件目前读不到画面帧时间和操作延迟， 所以无法确定你是否真的感到卡；高占用本身也不等于有问题（例如玩游戏时显卡满载是正常的）。诊断只记录，不弹通知。",
						diag && !diag.enabled ? " 诊断目前已在设置里关闭。" : ""
					]
				}),
				(diag?.active.length ?? 0) > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "sgroup",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "正在发生" }), diag.active.map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "diag__item is-open",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "diag__row",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: `dconf ${confClass(a.confidence)}`,
									children: ["置信度 ", CONF_TEXT[a.confidence]]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "diag__title",
									children: a.title
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("small", { children: [
									"从 ",
									formatTime(a.since, false),
									" 开始，已持续 ",
									formatDuration(Date.now() - a.since)
								] })
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExtraBlock, { extra: a })]
					}, a.rule))]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "sgroup",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "帧时间（画面流畅度）" }),
						frames && frames.state === "running" && frames.process ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dl", {
							className: "kv hwd",
							children: [
								[frames.background ? "统计的程序（在后台）" : "前台程序", `${frames.process}（进程 ${frames.pid}）`],
								["帧率", frames.fps == null ? null : `${frames.fps.toFixed(0)} FPS`],
								["平均帧时间", frames.avgMs == null ? null : `${frames.avgMs.toFixed(1)} ms`],
								["最长一帧（最近 10 秒）", frames.maxMs == null ? null : `${frames.maxMs.toFixed(1)} ms`],
								["99% 帧时间（最近 60 秒）", frames.p99Ms == null ? "帧数还不够" : `${frames.p99Ms.toFixed(1)} ms`],
								["1% Low（最近 60 秒）", frames.low1Fps == null ? "帧数还不够" : `${frames.low1Fps.toFixed(0)} FPS`],
								["卡顿帧（最近 10 秒）", `${frames.stutters10s} 个（超过 ${frames.stutterThresholdMs?.toFixed(0) ?? "33"} ms 算一次）`]
							].filter(([, v]) => v != null).map(([k, v]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "kv__row",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: k }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: v })]
							}, k))
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "hwd__note",
							children: [
								"状态：",
								frames ? FRAME_STATE_TEXT[frames.state] : "--",
								frames?.detail ? `。${frames.detail}` : ""
							]
						}),
						frames?.state === "denied" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "cfan__ident",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "需要把你的账户加入 Windows 的「Performance Log Users」用户组（只做一次，之后不需要管理员）。以管理员身份打开 PowerShell，运行：" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
									className: "diag__cmd",
									children: "Add-LocalGroupMember -SID S-1-5-32-559 -Member \"$env:USERDOMAIN\\\\$env:USERNAME\""
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "然后注销并重新登录 Windows。" })
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "hwd__note",
							children: [
								"帧时间来自 Intel 开源的 PresentMon，只读取 Windows 的图形事件，不注入游戏。默认只在前台是全屏程序时采集，可以在设置里改成始终采集。 它能告诉你画面",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: "是否真的卡了" }),
								"；卡的原因要看上面的其他检查和下面的记录。"
							]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "sgroup",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "实时检查" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "dcheck dcheck--head",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "检查项" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "当前" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "判断条件" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "状态" })
							]
						}),
						(diag?.checks ?? []).map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: `dcheck is-${c.state}`,
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: c.title }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: c.current }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: c.threshold }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "dcheck__state",
									children: CHECK_TEXT[c.state]
								})
							]
						}, c.rule)),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "hwd__note",
							children: "「接近」表示离判断条件不远；「观察中」表示条件已满足，但还没持续足够久。"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "sgroup",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", { children: [
							"最近 24 小时的记录（",
							events.length,
							" 条）"
						] }),
						events.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "panel__hint",
							children: "最近 24 小时没有发现潜在瓶颈。"
						}),
						events.map((e) => {
							const isOpen = expanded === e.id;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: `diag__item ${isOpen ? "is-open" : ""}`,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									className: "diag__row diag__toggle",
									onClick: () => setExpanded(isOpen ? null : e.id),
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: `dconf ${confClass(e.confidence)}`,
											children: ["置信度 ", e.confidence ?? "低"]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "diag__title",
											children: eventTitle(e).replace(/^潜在性能瓶颈：/, "")
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("small", { children: [
											formatTime(e.tsStart),
											"　",
											e.tsEnd ? `持续 ${formatDuration(e.tsEnd - e.tsStart)}` : "进行中"
										] })
									]
								}), isOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [e.extra ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExtraBlock, { extra: e.extra }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "hwd__note",
									children: e.detail
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									className: "btn diag__replay",
									onClick: () => onReplay(e.id),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcwClock, {
										size: 14,
										strokeWidth: 2
									}), " 在历史中回放（前后各 5 分钟）"]
								})] })]
							}, e.id);
						})
					]
				})
			]
		})]
	});
}
