// GENERATED FRAGMENT — extracted from out/renderer/assets/index-CzIv0K4n.js, lines 23540-24055.
// Original module marker: src/renderer/components/HistorySheet.tsx. Not the original TypeScript/TSX source.
// Depends on bundle-level imports, globals, and other fragments; not standalone.
var STORAGE_KEY = "sysmonitor.history.selected.v1";
var DEFAULT_SELECTED = [
	"cpu.usage",
	"gpu.usage",
	"cpu.temp",
	"gpu.temp"
];
var REPLAY_PAD = 3e5;
var MAX_SPAN = 2592e6;
var SUMMARY_KEYS = [
	"cpu.usage",
	"cpu.temp",
	"gpu.usage",
	"gpu.temp",
	"mem.usage",
	"disk.busy",
	"net.latency"
];
function loadSelected() {
	try {
		const v = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
		if (Array.isArray(v) && v.every((x) => typeof x === "string")) return v.slice(0, MAX_SELECTED);
	} catch {}
	return DEFAULT_SELECTED;
}
function ProcList({ title, rows, value }) {
	if (rows.length === 0) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "hist__proc",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", { children: title }), rows.map((r, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "hist__procrow",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: r.name }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: value(r) })]
		}, `${r.name}${i}`))]
	});
}
function HistorySheet({ open, onClose, focus }) {
	const [catalog, setCatalog] = (0, import_react.useState)([]);
	const [selected, setSelected] = (0, import_react.useState)(loadSelected);
	const [presetMs, setPresetMs] = (0, import_react.useState)(PRESETS[1].ms);
	const [fixed, setFixed] = (0, import_react.useState)(null);
	const [tick, setTick] = (0, import_react.useState)(0);
	const [result, setResult] = (0, import_react.useState)(null);
	const [events, setEvents] = (0, import_react.useState)([]);
	const [replay, setReplay] = (0, import_react.useState)(null);
	const [stats, setStats] = (0, import_react.useState)(null);
	const [themeTick, setThemeTick] = (0, import_react.useState)(0);
	const [hint, setHint] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(selected));
	}, [selected]);
	(0, import_react.useEffect)(() => {
		if (!open || !focus) return;
		if (focus.eventId != null) {
			window.api.history.event(focus.eventId).then((r) => r && startReplay(r, true));
			return;
		}
		setSelected(focus.keys.slice(0, MAX_SELECTED));
		setFixed(null);
		setReplay(null);
	}, [open, focus]);
	(0, import_react.useEffect)(() => {
		const mo = new MutationObserver(() => setThemeTick((n) => n + 1));
		mo.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ["data-theme", "class"]
		});
		return () => mo.disconnect();
	}, []);
	(0, import_react.useEffect)(() => {
		if (!open || fixed) return;
		const timer = setInterval(() => setTick((n) => n + 1), 5e3);
		return () => clearInterval(timer);
	}, [open, fixed]);
	(0, import_react.useEffect)(() => {
		if (!open) return;
		let cancelled = false;
		const to = fixed?.to ?? Date.now();
		const from = fixed?.from ?? to - presetMs;
		Promise.all([
			selected.length > 0 ? window.api.history.query({
				keys: selected,
				from,
				to,
				maxPoints: 900
			}) : Promise.resolve(null),
			window.api.history.events(from, to),
			window.api.history.series(),
			window.api.history.stats()
		]).then(([r, ev, cat, st]) => {
			if (cancelled) return;
			setResult(r);
			setEvents(ev);
			setCatalog(cat);
			setStats(st);
		}).catch(() => {
			if (!cancelled) setHint("读取历史数据失败");
		});
		return () => {
			cancelled = true;
		};
	}, [
		open,
		selected,
		presetMs,
		fixed,
		tick
	]);
	const infoOf = (0, import_react.useMemo)(() => new Map(catalog.map((s) => [s.key, s])), [catalog]);
	const groups = (0, import_react.useMemo)(() => {
		if (!result) return [];
		const byUnit = /* @__PURE__ */ new Map();
		selected.forEach((key, i) => {
			const info = infoOf.get(key);
			const idx = result.series.findIndex((s) => s.key === key);
			if (!info || idx < 0) return;
			const list = byUnit.get(info.unit) ?? [];
			list.push({
				key,
				label: info.label,
				color: PALETTE[i % PALETTE.length],
				idx
			});
			byUnit.set(info.unit, list);
		});
		return [...byUnit.entries()].map(([unit, items]) => ({
			unit,
			series: items.map((it) => ({
				key: it.key,
				label: it.label,
				color: it.color
			})),
			avg: items.map((it) => result.series[it.idx].avg),
			min: items.map((it) => result.series[it.idx].min),
			max: items.map((it) => result.series[it.idx].max)
		}));
	}, [
		result,
		selected,
		infoOf
	]);
	const catalogGroups = (0, import_react.useMemo)(() => {
		const m = /* @__PURE__ */ new Map();
		for (const s of catalog) m.set(s.group, [...m.get(s.group) ?? [], s]);
		return [...m.entries()];
	}, [catalog]);
	const windowNow = () => {
		if (result) return {
			from: result.from,
			to: result.to
		};
		const to = Date.now();
		return {
			from: to - presetMs,
			to
		};
	};
	const toggleMetric = (key) => {
		setHint(null);
		setSelected((cur) => {
			if (cur.includes(key)) return cur.filter((k) => k !== key);
			if (cur.length >= MAX_SELECTED) {
				setHint(`最多同时显示 ${MAX_SELECTED} 条曲线`);
				return cur;
			}
			return [...cur, key];
		});
	};
	const setWindow = (from, to) => {
		const span = Math.min(MAX_SPAN, Math.max(1e4, to - from));
		setFixed({
			from: Math.floor(from),
			to: Math.floor(from + span)
		});
	};
	const pan = (dir) => {
		const w = windowNow();
		const shift = (w.to - w.from) / 2 * dir;
		setWindow(w.from + shift, w.to + shift);
	};
	const zoomOut = () => {
		const w = windowNow();
		const mid = (w.from + w.to) / 2;
		const half = Math.min(MAX_SPAN, w.to - w.from);
		setWindow(mid - half, mid + half);
	};
	const backToLive = () => {
		setFixed(null);
		setReplay(null);
	};
	const pickPreset = (ms) => {
		setPresetMs(ms);
		backToLive();
	};
	const startReplay = (r, onlyEvidence = false) => {
		const ev = r.event;
		setReplay(r);
		const end = ev.tsEnd ?? Date.now();
		setWindow(ev.tsStart - REPLAY_PAD, end + REPLAY_PAD);
		const wanted = ev.kind === "diag" ? DIAG_METRICS[ev.key] ?? [] : ev.key.startsWith("proc:") ? ["cpu.usage"] : EVENT_METRICS[ev.key] ?? [];
		if (onlyEvidence && wanted.length > 0) setSelected(wanted.slice(0, MAX_SELECTED));
		else if (wanted.length > 0) setSelected((cur) => [...cur, ...wanted.filter((k) => !cur.includes(k))].slice(0, MAX_SELECTED));
	};
	const openReplay = (ev) => {
		window.api.history.event(ev.id).then((r) => startReplay(r ?? {
			event: ev,
			snapshot: null
		}));
	};
	const note = (() => {
		if (!result) return null;
		if (result.coverageStart == null) return "这个时间范围内没有历史数据（可能刚开始记录，或历史记录已关闭）。";
		if (result.coverageStart > result.from + result.stepMs * 2 && result.from < Date.now()) return `这段时间里只有从 ${formatTime(result.coverageStart)} 开始的数据，更早的没有记录。`;
		return null;
	})();
	const shade = replay ? {
		from: replay.event.tsStart,
		to: replay.event.tsEnd ?? Date.now()
	} : null;
	const live = !fixed;
	const range = result ?? {
		from: Date.now() - presetMs,
		to: Date.now()
	};
	const snapMetrics = replay?.snapshot?.metrics ?? {};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: `sheet ${open ? "is-open" : ""}`,
		"aria-hidden": !open,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "sheet__bar",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: "历史记录" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				className: "btn",
				onClick: onClose,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, {
					size: 14,
					strokeWidth: 2
				}), " 完成"]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "sheet__body hist",
			children: [
				stats && !stats.enabled && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "hist__note",
					children: "历史记录已关闭，不会再记录新数据。可以在设置里重新打开，已有的数据仍可查看。"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "sgroup",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "hist__toolbar",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "seg",
							children: PRESETS.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								className: live && presetMs === p.ms ? "is-on" : "",
								onClick: () => pickPreset(p.ms),
								children: p.label
							}, p.ms))
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "hist__tools",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									className: "btn",
									title: "向前平移半个窗口",
									onClick: () => pan(-1),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, {
										size: 14,
										strokeWidth: 2
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									className: "btn",
									title: "向后平移半个窗口",
									onClick: () => pan(1),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, {
										size: 14,
										strokeWidth: 2
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									className: "btn",
									title: "时间范围放大一倍",
									onClick: zoomOut,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ZoomOut, {
										size: 14,
										strokeWidth: 2
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									className: "btn",
									title: "回到实时视图",
									disabled: live,
									onClick: backToLive,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Radio, {
										size: 14,
										strokeWidth: 2
									}), " 实时"]
								})
							]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "hist__custom",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "自定义范围" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "datetime-local",
								value: toLocalInput(range.from),
								onChange: (e) => {
									const t = new Date(e.target.value).getTime();
									if (Number.isFinite(t)) setWindow(t, Math.max(t + 6e4, range.to));
								}
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "至" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "datetime-local",
								value: toLocalInput(range.to),
								onChange: (e) => {
									const t = new Date(e.target.value).getTime();
									if (Number.isFinite(t)) setWindow(Math.min(range.from, t - 6e4), t);
								}
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: "在图上按住鼠标左右拖动可放大到这一段，双击还原" })
						]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "sgroup",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", { children: [
							"显示哪些指标（最多 ",
							MAX_SELECTED,
							" 条）"
						] }),
						catalogGroups.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "panel__hint",
							children: "还没有记录到任何数据。"
						}),
						catalogGroups.map(([group, items]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "hist__chips",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("em", { children: group }), items.map((s) => {
								const i = selected.indexOf(s.key);
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									className: `hchip ${i >= 0 ? "is-on" : ""}`,
									style: i >= 0 ? { borderColor: PALETTE[i % PALETTE.length] } : void 0,
									onClick: () => toggleMetric(s.key),
									children: [i >= 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { style: { background: PALETTE[i % PALETTE.length] } }), s.label]
								}, s.key);
							})]
						}, group)),
						hint && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "hist__warn",
							children: hint
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "sgroup hist__charts",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "hist__range",
							children: [
								formatTime(range.from),
								" ~ ",
								formatTime(range.to),
								result && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("small", { children: [
									"　每个点约 ",
									formatDuration(result.stepMs),
									"；淡色带是该时段的最小到最大值"
								] })
							]
						}),
						note && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "hist__note",
							children: note
						}),
						selected.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "panel__hint",
							children: "在上面选择要查看的指标。"
						}),
						groups.map((g) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "hist__chart",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h4", { children: [
								UNIT_TITLE[g.unit] ?? g.unit,
								"（",
								g.unit === "B/s" ? "自动换算" : g.unit,
								"）"
							] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HistoryChart, {
								unit: g.unit,
								series: g.series,
								ts: result?.ts ?? [],
								avg: g.avg,
								min: g.min,
								max: g.max,
								shade,
								themeTick,
								onZoom: setWindow,
								onReset: backToLive
							})]
						}, g.unit))
					]
				}),
				replay && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "sgroup hist__replay",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "hist__replayhead",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "事件回放" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								className: "btn",
								onClick: backToLive,
								children: "退出回放"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: eventTitle(replay.event) }),
						replay.event.confidence && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "hist__meta",
							children: ["置信度：", replay.event.confidence]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: replay.event.extra?.cause ?? replay.event.detail }),
						replay.event.extra && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "hist__kv",
							children: replay.event.extra.evidence.map((e) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
								e.label,
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: e.value }),
								e.threshold ? `（条件 ${e.threshold}）` : ""
							] }, e.label))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "hist__meta",
							children: [
								"开始 ",
								formatTime(replay.event.tsStart),
								replay.event.tsEnd ? `　结束 ${formatTime(replay.event.tsEnd)}　持续 ${formatDuration(replay.event.tsEnd - replay.event.tsStart)}` : "　仍在持续",
								"　图中橙色区域是事件发生的时段，前后各显示 5 分钟"
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "hist__kv",
							children: SUMMARY_KEYS.filter((k) => snapMetrics[k] != null && infoOf.has(k)).map((k) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [infoOf.get(k).label, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: formatValue(snapMetrics[k], infoOf.get(k).unit) })] }, k))
						}),
						replay.snapshot ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "hist__meta",
							children: "以下是事件开始时刻的进程快照（只记录当时的占用，不代表它们一定是原因）："
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "hist__procs",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProcList, {
									title: "CPU 占用最高",
									rows: replay.snapshot.cpu,
									value: (r) => `${(r.cpuPercent ?? 0).toFixed(1)}%`
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProcList, {
									title: "内存占用最高",
									rows: replay.snapshot.mem,
									value: (r) => r.memBytes != null ? formatBytes(r.memBytes) : "--"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProcList, {
									title: "网络占用最高",
									rows: replay.snapshot.net,
									value: (r) => formatValue((r.netDownBytesPerSec ?? 0) + (r.netUpBytesPerSec ?? 0), "B/s")
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProcList, {
									title: "读写最多（含磁盘和网络）",
									rows: replay.snapshot.io ?? [],
									value: (r) => formatValue(r.ioBytesPerSec ?? 0, "B/s")
								})
							]
						})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "hist__meta",
							children: "这个事件没有保存进程快照。"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "sgroup",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", { children: [
							"异常事件（当前时间范围内 ",
							events.length,
							" 条）"
						] }),
						events.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "panel__hint",
							children: "这段时间没有记录到异常事件。"
						}),
						events.slice(0, 50).map((ev) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							className: `hist__event ${replay?.event.id === ev.id ? "is-on" : ""}`,
							onClick: () => openReplay(ev),
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { className: `sev sev--${ev.severity}` }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: eventTitle(ev) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("small", { children: [
									formatTime(ev.tsStart),
									"　",
									ev.tsEnd ? `持续 ${formatDuration(ev.tsEnd - ev.tsStart)}` : "进行中",
									"　",
									ev.detail
								] })] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("em", { children: "回放" })
							]
						}, ev.id))
					]
				}),
				stats && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "sheet__ver",
					children: [
						"历史数据库 ",
						formatBytes(stats.fileBytes),
						"　",
						stats.rawRows + stats.minuteRows,
						" 条记录　",
						stats.eventCount,
						" 个事件",
						stats.oldestTs ? `　最早 ${formatTime(stats.oldestTs)}` : "",
						stats.lastError ? `　最近错误：${stats.lastError}` : ""
					]
				})
			]
		})]
	});
}
