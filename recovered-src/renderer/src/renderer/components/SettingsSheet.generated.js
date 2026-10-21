// GENERATED FRAGMENT — extracted from out/renderer/assets/index-CzIv0K4n.js, lines 24893-25414.
// Original module marker: src/renderer/components/SettingsSheet.tsx. Not the original TypeScript/TSX source.
// Depends on bundle-level imports, globals, and other fragments; not standalone.
var REFRESH = [
	{
		v: 500,
		label: "0.5 秒"
	},
	{
		v: 1e3,
		label: "1 秒"
	},
	{
		v: 2e3,
		label: "2 秒"
	}
];
var POWER_REFRESH = [
	{
		v: 200,
		label: "0.2 秒"
	},
	{
		v: 500,
		label: "0.5 秒"
	},
	{
		v: 1e3,
		label: "1 秒"
	}
];
var DIAG_KEYS = [
	"conservative",
	"standard",
	"sensitive"
];
var DIAG_LEVEL = {
	conservative: 0,
	standard: 1,
	sensitive: 2
};
var DIAG_OPTIONS = [
	{
		v: 0,
		label: "保守"
	},
	{
		v: 1,
		label: "标准"
	},
	{
		v: 2,
		label: "灵敏"
	}
];
var FRAME_OPTIONS = [{
	v: 0,
	label: "全屏时"
}, {
	v: 1,
	label: "始终"
}];
var TASKBAR_ITEMS = [
	{
		key: "showCpu",
		label: "CPU"
	},
	{
		key: "showGpu",
		label: "GPU"
	},
	{
		key: "showMem",
		label: "内存"
	},
	{
		key: "showPower",
		label: "功耗"
	},
	{
		key: "showNet",
		label: "网速"
	}
];
var THRESHOLDS = [
	{
		key: "cpuUsage",
		label: "CPU 使用率",
		unit: "%",
		min: 10,
		max: 100
	},
	{
		key: "gpuUsage",
		label: "GPU 使用率",
		unit: "%",
		min: 10,
		max: 100
	},
	{
		key: "cpuTemp",
		label: "CPU 温度",
		unit: "°C",
		min: 30,
		max: 120
	},
	{
		key: "gpuTemp",
		label: "GPU 温度",
		unit: "°C",
		min: 30,
		max: 120
	},
	{
		key: "ssdTemp",
		label: "硬盘温度",
		unit: "°C",
		min: 30,
		max: 100
	},
	{
		key: "memUsage",
		label: "内存使用率",
		unit: "%",
		min: 10,
		max: 100
	},
	{
		key: "commitUsage",
		label: "内存提交量",
		unit: "%",
		min: 10,
		max: 100
	},
	{
		key: "diskUsage",
		label: "磁盘占用",
		unit: "%",
		min: 50,
		max: 100
	},
	{
		key: "power",
		label: "整机功耗（估算）",
		unit: "W",
		min: 50,
		max: 2e3
	},
	{
		key: "netLatencyMs",
		label: "外网延迟",
		unit: "ms",
		min: 20,
		max: 5e3
	},
	{
		key: "procCpu",
		label: "单个程序占用 CPU",
		unit: "%",
		min: 5,
		max: 100
	}
];
function Seg({ value, options, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "seg",
		children: options.map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			className: value === o.v ? "is-on" : "",
			onClick: () => onChange(o.v),
			children: o.label
		}, o.v))
	});
}
function HistorySettingsGroup({ s, update, open }) {
	const [stats, setStats] = (0, import_react.useState)(null);
	const [msg, setMsg] = (0, import_react.useState)(null);
	const [confirming, setConfirming] = (0, import_react.useState)(false);
	const h = s.history;
	const refresh = () => void window.api.history.stats().then(setStats);
	(0, import_react.useEffect)(() => {
		if (open) refresh();
	}, [open]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "sgroup",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "历史记录" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row$2, {
				label: "记录历史数据",
				hint: "关闭后停止写入数据库，已有数据仍可查看",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
					checked: h.enabled,
					onChange: (v) => update({ history: { enabled: v } })
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row$2, {
				label: "高精度数据保留",
				hint: "每 5 秒一个点，用于查看最近的细节",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NumberField, {
					value: h.rawHours,
					min: 1,
					max: 72,
					unit: "小时",
					onCommit: (v) => update({ history: { rawHours: v } })
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row$2, {
				label: "分钟级数据保留",
				hint: "每分钟一个点，保存最小值、最大值和平均值",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NumberField, {
					value: h.minuteDays,
					min: 1,
					max: 90,
					unit: "天",
					onCommit: (v) => update({ history: { minuteDays: v } })
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row$2, {
				label: "异常事件保留",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NumberField, {
					value: h.eventDays,
					min: 1,
					max: 365,
					unit: "天",
					onCommit: (v) => update({ history: { eventDays: v } })
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row$2, {
				label: "数据库大小上限",
				hint: "超过后从最旧的数据开始删除",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NumberField, {
					value: h.maxMB,
					min: 50,
					max: 5e3,
					unit: "MB",
					onCommit: (v) => update({ history: { maxMB: v } })
				})
			}),
			stats && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "panel__hint",
				children: [
					"当前占用 ",
					formatBytes(stats.fileBytes),
					"，",
					stats.rawRows + stats.minuteRows,
					" 条数据，",
					stats.eventCount,
					" 个事件",
					stats.oldestTs ? `，最早从 ${formatTime(stats.oldestTs)} 开始` : "",
					"。",
					stats.lastError ? ` 最近错误：${stats.lastError}` : ""
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "sheet__actions hist__admin",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					className: "btn",
					onClick: () => void window.api.history.exportCsv().then((r) => {
						setMsg(r.ok ? `已导出到 ${r.path}（事件另存为同名「-事件.csv」）` : r.error ? `导出失败：${r.error}` : null);
					}),
					children: "导出为 CSV"
				}), confirming ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					className: "btn btn--danger",
					onClick: () => void window.api.history.clear().then(() => {
						setConfirming(false);
						setMsg("历史记录已清除");
						refresh();
					}),
					children: "确认清除全部历史"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					className: "btn",
					onClick: () => setConfirming(false),
					children: "取消"
				})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					className: "btn",
					onClick: () => setConfirming(true),
					children: "清除历史记录"
				})]
			}),
			msg && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "panel__hint",
				children: msg
			})
		]
	});
}
function SettingsSheet({ open, onClose, settings: s, update }) {
	const [info, setInfo] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		window.api.appInfo().then(setInfo);
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: `sheet ${open ? "is-open" : ""}`,
		"aria-hidden": !open,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "sheet__bar",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: "设置" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				className: "btn",
				onClick: onClose,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, {
					size: 14,
					strokeWidth: 2
				}), " 完成"]
			})]
		}), s && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "sheet__body",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "sgroup",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "常规" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row$2, {
							label: "数据刷新频率",
							hint: "CPU、GPU、内存、网速等指标",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Seg, {
								value: s.refreshMs,
								options: REFRESH,
								onChange: (v) => update({ refreshMs: v })
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row$2, {
							label: "功耗刷新频率",
							hint: "CPU 封装功耗和 GPU 功耗，单独高频采集",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Seg, {
								value: s.powerRefreshMs,
								options: POWER_REFRESH,
								onChange: (v) => update({ powerRefreshMs: v })
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row$2, {
							label: "其他部件估算功耗",
							hint: "主板、内存、硬盘、风扇等；整机功耗 = CPU + GPU + 此值",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NumberField, {
								value: s.otherWatts,
								min: 0,
								max: 500,
								unit: "W",
								onCommit: (v) => update({ otherWatts: v })
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row$2, {
							label: "关闭窗口时最小化到托盘",
							hint: "关闭后程序继续在后台采集，托盘菜单里可退出",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
								checked: s.closeToTray,
								onChange: (v) => update({ closeToTray: v })
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row$2, {
							label: "开机自启动",
							hint: info && !info.isPackaged ? "开发模式下不生效，安装后才会注册开机启动" : "开机后在托盘中静默启动",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
								checked: s.autoStart,
								disabled: info != null && !info.isPackaged,
								onChange: (v) => update({ autoStart: v })
							})
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "sgroup",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "任务栏显示" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row$2, {
							label: "在任务栏右侧显示",
							hint: "盖在任务栏空位上、托盘图标的左边；全屏程序运行时自动隐藏",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
								checked: s.taskbar.enabled,
								onChange: (v) => update({ taskbar: { enabled: v } })
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row$2, {
							label: "显示项目",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "seg",
								children: TASKBAR_ITEMS.map((it) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									className: s.taskbar[it.key] ? "is-on" : "",
									onClick: () => update({ taskbar: { [it.key]: !s.taskbar[it.key] } }),
									children: it.label
								}, it.key))
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row$2, {
							label: "字号",
							hint: "任务栏只有约 48 像素高，要放两行，最大 17",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NumberField, {
								value: s.taskbar.fontSize,
								min: 11,
								max: 17,
								unit: "px",
								onCommit: (v) => update({ taskbar: { fontSize: v } })
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row$2, {
							label: "位置微调",
							hint: "负数向左、正数向右；一般不需要调整",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NumberField, {
								value: s.taskbar.offsetX,
								min: -600,
								max: 600,
								unit: "px",
								onCommit: (v) => update({ taskbar: { offsetX: v } })
							})
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "sgroup",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "阈值告警" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row$2, {
							label: "启用系统通知",
							hint: "超过阈值并持续一段时间后发一条通知",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
								checked: s.alerts.enabled,
								onChange: (v) => update({ alerts: { enabled: v } })
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row$2, {
							label: "持续多久才通知",
							hint: "避免瞬时尖峰误报",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NumberField, {
								value: s.alerts.sustainSec,
								min: 1,
								max: 600,
								unit: "秒",
								onCommit: (v) => update({ alerts: { sustainSec: v } })
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row$2, {
							label: "同一条告警的冷却时间",
							hint: "期间不重复提醒",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NumberField, {
								value: s.alerts.cooldownMin,
								min: 1,
								max: 240,
								unit: "分钟",
								onCommit: (v) => update({ alerts: { cooldownMin: v } })
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "thresholds",
							children: THRESHOLDS.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "thr",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [t.label, " ≥"] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NumberField, {
									value: s.alerts[t.key],
									min: t.min,
									max: t.max,
									unit: t.unit,
									onCommit: (v) => update({ alerts: { [t.key]: v } })
								})]
							}, t.key))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "panel__hint",
							children: "另外会自动提醒：网络断开或外网不通、磁盘快满、硬盘可用备用空间偏低、硬盘健康数据持续读不到。CPU 温度和硬盘温度需要 LibreHardwareMonitor 在后台运行。"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "sheet__actions",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								className: "btn",
								onClick: () => window.api.settings.testAlert(),
								children: "发送测试通知"
							})
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "sgroup",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "性能诊断" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row$2, {
							label: "启用性能诊断",
							hint: "根据多个指标和持续时间找出潜在性能瓶颈；只记录进历史，不弹通知",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
								checked: s.diag.enabled,
								onChange: (v) => update({ diag: { enabled: v } })
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row$2, {
							label: "灵敏度",
							hint: "保守：只记录明显的问题；灵敏：更早、更容易记录",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Seg, {
								value: DIAG_LEVEL[s.diag.sensitivity],
								options: DIAG_OPTIONS,
								onChange: (v) => update({ diag: { sensitivity: DIAG_KEYS[v] } })
							})
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "sgroup",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "帧时间（画面流畅度）" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row$2, {
							label: "启用帧时间采集",
							hint: "用 Intel 开源的 PresentMon 读取前台程序的帧率和卡顿；需要把账户加入「Performance Log Users」用户组",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
								checked: s.frames.enabled,
								onChange: (v) => update({ frames: { enabled: v } })
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row$2, {
							label: "采集范围",
							hint: "默认只在前台是全屏程序（含无边框全屏）时采集；窗口化的游戏请选「始终」",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Seg, {
								value: s.frames.mode === "always" ? 1 : 0,
								options: FRAME_OPTIONS,
								onChange: (v) => update({ frames: { mode: v === 1 ? "always" : "fullscreen" } })
							})
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HistorySettingsGroup, {
					s,
					update,
					open
				}),
				info && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "sheet__ver",
					children: ["SysMonitor ", info.version]
				})
			]
		})]
	});
}
