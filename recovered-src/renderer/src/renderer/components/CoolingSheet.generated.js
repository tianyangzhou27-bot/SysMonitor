// GENERATED FRAGMENT — extracted from out/renderer/assets/index-CzIv0K4n.js, lines 18529-18989.
// Original module marker: src/renderer/components/CoolingSheet.tsx. Not the original TypeScript/TSX source.
// Depends on bundle-level imports, globals, and other fragments; not standalone.
var ROLES = [
	"unset",
	"cpu",
	"case",
	"pump",
	"none"
];
var IDENT_SECONDS = 14;
var MODE_TEXT = {
	bios: "交还主板",
	auto: "自动",
	manual: "手动"
};
var modeText = (key, mode) => key === "gpu" && mode === "bios" ? "交还显卡" : MODE_TEXT[mode];
var REF_TEXT = {
	cpu: "CPU 温度",
	case: "CPU 与显卡中较高的温度",
	gpu: "显卡温度（核心与热点中较高者）"
};
var rpmText = (v) => v == null ? "--" : `${Math.round(v)} RPM`;
function verdict(r) {
	if (!r.ok) return r.error ?? "识别失败";
	const before = r.before ?? 0;
	const peak = r.peak ?? 0;
	if (r.peak != null && peak >= 400 && peak - before >= 150) return `这一路接了风扇：转速从 ${rpmText(r.before)} 升到 ${rpmText(r.peak)}，已交还主板（现在 ${rpmText(r.after)}）。请对照你刚才看到或听到变快的是哪个风扇，在右边选择用途。`;
	return `转速没有明显变化（${rpmText(r.before)} → ${rpmText(r.peak)}）：可能没有接风扇，也可能接的设备不支持测速，或被其他软件占用。已交还主板。`;
}
function SensorRow({ s, unit, update }) {
	const commit = (text) => {
		const name = text.trim();
		if (name !== (s.label ?? "")) update({ cooling: { names: { [s.id]: name } } });
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "cfan__row",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
			className: "cname",
			defaultValue: s.label ?? "",
			placeholder: s.name,
			maxLength: 40,
			onBlur: (e) => commit(e.currentTarget.value),
			onKeyDown: (e) => e.key === "Enter" && e.currentTarget.blur(),
			"aria-label": `${s.name} 的名称`
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "cfan__val",
			children: s.value == null ? "--" : `${s.value.toFixed(unit === "V" ? 3 : 1)} ${unit}`
		})]
	});
}
function stateLine(key, mode, st, cfg) {
	if (mode === "bios") return key === "gpu" ? "交还显卡（由显卡自己管理）" : "交还主板（由主板的温控曲线管理）";
	if (!st) return MODE_TEXT[mode];
	if (st.emergency) return "紧急保护中：已拉到 100%";
	if (st.holding && st.level != null) return `${MODE_TEXT[mode]} · 第 ${st.level} 档 · ${st.pct}%`;
	if (st.level != null && cfg.levels[st.level - 1].pct == null) return `${MODE_TEXT[mode]} · 第 ${st.level} 档 · 交还显卡自己管`;
	return st.error ?? MODE_TEXT[mode];
}
function GroupPanel({ gkey, cfg, acked, state, fans, lhmOnline, update }) {
	const [confirming, setConfirming] = (0, import_react.useState)(null);
	const title = GROUP_TEXT[gkey];
	const modes = [
		"bios",
		"auto",
		"manual"
	];
	const setMode = (mode) => {
		if (mode !== "bios" && !acked) {
			setConfirming(mode);
			return;
		}
		update({ cooling: { groups: { [gkey]: { mode } } } });
	};
	const setLevels = (levels) => update({ cooling: { groups: { [gkey]: { levels } } } });
	const edit = (i, patch) => setLevels(cfg.levels.map((l, idx) => idx === i ? {
		...l,
		...patch
	} : l));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "cfan__group",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "cfan__title",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: title }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["当前：", stateLine(gkey, cfg.mode, state, cfg)] })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "cfan__ctl",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "seg",
					children: modes.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						className: cfg.mode === m ? "is-on" : "",
						disabled: m !== "bios" && !lhmOnline,
						onClick: () => setMode(m),
						children: modeText(gkey, m)
					}, m))
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("small", { children: [
					"参考：",
					REF_TEXT[gkey],
					state?.refTempC != null ? ` ${state.refTempC.toFixed(0)}°C` : " --"
				] })]
			}),
			confirming && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "cfan__ident",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
						"启用「",
						title,
						"」的软件调速前，请确认你了解："
					] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
						className: "cfan__risk",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
								"软件会接管这一组风扇的转速。如果 SysMonitor 异常崩溃，风扇会停在最后一次设定的转速（转速有下限保护：",
								gkey === "gpu" ? "显卡风扇不低于 30%" : `${FLOOR_PCT[gkey]}%`,
								"）。"
							] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "正常退出、读不到温度、或设置没有生效时，会自动交还主板（显卡则交还显卡）。" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
								"CPU 达到 ",
								EMERGENCY_C.cpu,
								"°C 或显卡达到 ",
								EMERGENCY_C.gpu,
								"°C 时，受控风扇会自动拉到 100%。"
							] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "华硕自带的风扇软件（Armoury Crate 等）如果同时运行，会和它抢控制权。水泵不会被控制。" })
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						className: "btn",
						onClick: () => {
							update({ cooling: {
								acked: { [gkey]: true },
								groups: { [gkey]: { mode: confirming } }
							} });
							setConfirming(null);
						},
						children: "我了解，启用"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						className: "btn",
						onClick: () => setConfirming(null),
						children: "取消"
					})
				]
			}),
			state?.error && cfg.mode !== "bios" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "cfan__bad cfan__msg",
				children: state.error
			}),
			state?.notice && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "cfan__bad cfan__msg",
				children: state.notice
			}),
			state?.emergency && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "cfan__bad cfan__msg",
				children: "温度已达到紧急保护阈值，风扇已拉满，请检查散热。"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "clevels",
				children: cfg.levels.map((l, i) => {
					const active = state?.level === i + 1 && cfg.mode !== "bios";
					const handBack = gkey === "gpu" && i === 0;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: `clevel ${active ? "is-active" : ""}`,
						children: [
							cfg.mode === "manual" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								className: `btn clevel__pick ${cfg.manualLevel === i + 1 ? "is-picked" : ""}`,
								onClick: () => update({ cooling: { groups: { [gkey]: { manualLevel: i + 1 } } } }),
								children: [
									"第 ",
									i + 1,
									" 档"
								]
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "clevel__name",
								children: [
									"第 ",
									i + 1,
									" 档"
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "clevel__temp",
								children: i === 0 ? `低于 ${cfg.levels[1].from}°C` : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: ["≥", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NumberField, {
									value: l.from,
									min: 20,
									max: 100,
									unit: "°C",
									onCommit: (v) => edit(i, { from: v })
								})] })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "clevel__pct",
								children: handBack ? "交还显卡自己管（保持静音停转）" : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NumberField, {
									value: l.pct ?? FLOOR_PCT[gkey],
									min: FLOOR_PCT[gkey],
									max: 100,
									unit: "%",
									onCommit: (v) => edit(i, { pct: v })
								})
							})
						]
					}, i);
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "cfan__foot",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("small", { children: [
					"降档要比档位温度再低 ",
					3,
					"°C、且离上次换档至少 10 秒，避免转速来回跳。",
					gkey === "gpu" ? "" : ` 转速不会低于 ${FLOOR_PCT[gkey]}%。`
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					className: "btn",
					onClick: () => setLevels(defaultGroups()[gkey].levels),
					children: "恢复默认五档"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "cfan__members",
				children: fans.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: gkey === "gpu" ? "没有读到显卡风扇。" : `还没有指定${title}，请先在下面的「风扇接口」里指定。` }) : fans.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "cfan__row",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: fanLabel(f) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "cfan__val",
						children: [rpmText(f.rpm), f.controlPct != null ? ` · 控制值 ${f.controlPct.toFixed(0)}%` : ""]
					})]
				}, f.id))
			})
		]
	});
}
function CoolingSheet({ open, onClose, cooling, lhmOnline, settings, update }) {
	const [ident, setIdent] = (0, import_react.useState)(null);
	const [, setTick] = (0, import_react.useState)(0);
	(0, import_react.useEffect)(() => {
		if (ident?.phase !== "running") return;
		const timer = setInterval(() => setTick((n) => n + 1), 500);
		return () => clearInterval(timer);
	}, [ident?.phase]);
	const fans = cooling?.fans ?? [];
	const board = fans.filter((f) => f.source === "board");
	const gpu = fans.filter((f) => f.source === "gpu");
	const running = ident?.phase === "running";
	const groupCfg = settings?.cooling.groups;
	const acked = settings?.cooling.acked;
	const start = (id) => {
		setIdent({
			id,
			phase: "running",
			t0: Date.now()
		});
		window.api.cooling.identify(id).then((result) => setIdent((cur) => cur?.id === id ? {
			id,
			phase: "done",
			result
		} : cur)).catch(() => setIdent((cur) => cur?.id === id ? {
			id,
			phase: "done",
			result: {
				ok: false,
				error: "识别失败",
				before: null,
				peak: null,
				after: null
			}
		} : cur));
	};
	const membersOf = (key) => key === "gpu" ? gpu : board.filter((f) => f.role === key);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: `sheet ${open ? "is-open" : ""}`,
		"aria-hidden": !open,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "sheet__bar",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: "主板与散热" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
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
				!lhmOnline && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "hist__note",
					children: "现在读不到数据：需要 LibreHardwareMonitor 在后台运行（以管理员身份打开，并在 Options → Remote Web Server 里勾选 Run）。"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "sgroup",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "风扇与调速" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "hwd__note",
							children: "默认全部「交还主板」，由主板 BIOS 和显卡自己管理。选「自动」会按温度分五档调速，选「手动」固定在你选的一档。 指定为水泵的接口，软件永远不会去控制它。"
						}),
						groupCfg && acked && GROUP_KEYS.map((key) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GroupPanel, {
							gkey: key,
							cfg: groupCfg[key],
							acked: acked[key],
							state: cooling?.groups.find((g) => g.key === key),
							fans: membersOf(key),
							lhmOnline,
							update
						}, key))
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "sgroup",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "风扇接口" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "hwd__note",
							children: [
								"主板监控芯片上有 ",
								board.length,
								" 路风扇接口，但它不会告诉软件每路接的是什么。点「识别」会把这一路临时调到最快约 8 秒再自动交还主板， 你留意机箱里哪个风扇变快，然后给它选用途。"
							]
						}),
						board.map((f) => {
							const mine = ident?.id === f.id ? ident : null;
							const secs = mine?.t0 ? Math.min(IDENT_SECONDS, Math.round((Date.now() - mine.t0) / 1e3)) : 0;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "cfan__item",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "cfan__row",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "cfan__name",
												children: f.name
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "cfan__val",
												children: [rpmText(f.rpm), f.controlPct != null ? ` · 控制值 ${f.controlPct.toFixed(0)}%` : ""]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: `cfan__status ${f.status === "suspect-stalled" ? "cfan__bad" : ""}`,
												children: STATUS_TEXT[f.status]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
												className: "cfan__role",
												value: f.role,
												onChange: (e) => update({ cooling: { roles: { [f.id]: e.target.value } } }),
												"aria-label": `${f.name} 的用途`,
												children: ROLES.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
													value: r,
													children: ROLE_TEXT[r]
												}, r))
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												className: "btn",
												disabled: running || f.controlId == null || f.role === "pump",
												title: f.role === "pump" ? "已指定为水泵，不参与识别" : f.controlId == null ? "这个接口没有控制通道" : void 0,
												onClick: () => setIdent({
													id: f.id,
													phase: "confirm"
												}),
												children: "识别"
											})
										]
									}),
									mine?.phase === "confirm" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "cfan__ident",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
												"将把「",
												f.name,
												"」临时调到最快约 8 秒，然后自动交还主板。如果这一路接的是水泵，请先取消，并把它指定为「水泵」。"
											] }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												className: "btn",
												onClick: () => start(f.id),
												children: "开始识别"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												className: "btn",
												onClick: () => setIdent(null),
												children: "取消"
											})
										]
									}),
									mine?.phase === "running" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "cfan__ident",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
											"正在识别…已进行 ",
											secs,
											" 秒 / 约 ",
											IDENT_SECONDS,
											" 秒。请留意机箱里哪个风扇变快了。"
										] })
									}),
									mine?.phase === "done" && mine.result && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "cfan__ident",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: mine.result.ok ? void 0 : "cfan__bad",
											children: verdict(mine.result)
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											className: "btn",
											onClick: () => setIdent(null),
											children: "知道了"
										})]
									})
								]
							}, f.id);
						}),
						board.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "panel__hint",
							children: "没有读到主板风扇接口。"
						}),
						gpu.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "hwd__note",
							children: [
								"显卡风扇：",
								gpu.map((f) => `${f.name} ${rpmText(f.rpm)}（${STATUS_TEXT[f.status]}）`).join("；"),
								"。显卡温度低时风扇停转是它自己的零转速模式，不是故障。"
							]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "sgroup",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "温度传感器" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "hwd__note",
							children: "这是主板监控芯片上的温度输入。它们只有编号，没有名字，编号不一定对应某个具体位置（如供电模块、芯片组）， 软件不会去猜。你可以对照主板手册，或自己改名，名称会保存下来。"
						}),
						(cooling?.temps ?? []).map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SensorRow, {
							s,
							unit: "°C",
							update
						}, s.id)),
						(cooling?.temps.length ?? 0) === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "panel__hint",
							children: "没有读到主板温度。"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "sgroup",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "电压" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "hwd__note",
							children: "来自主板监控芯片，部分电压需要按主板设计换算，读数可能和 BIOS 里看到的不完全一致，仅供参考。"
						}),
						(cooling?.volts ?? []).map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SensorRow, {
							s,
							unit: "V",
							update
						}, s.id)),
						(cooling?.volts.length ?? 0) === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "panel__hint",
							children: "没有读到电压。"
						})
					]
				})
			]
		})]
	});
}
