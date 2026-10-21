// GENERATED FRAGMENT — extracted from out/renderer/assets/index-CzIv0K4n.js, lines 19126-19501.
// Original module marker: src/renderer/components/HardwareSheet.tsx. Not the original TypeScript/TSX source.
// Depends on bundle-level imports, globals, and other fragments; not standalone.
var GB = 1024 ** 3;
var NA = "无法读取";
var UNKNOWN = "未提供（不代表没有错误）";
function Group({ title, rows, children }) {
	const shown = rows.filter((r) => r[1] != null && r[1] !== "");
	if (shown.length === 0 && !children) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "sgroup",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: title }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dl", {
				className: "kv hwd",
				children: shown.map(([label, value]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "kv__row",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: label }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: value })]
				}, label))
			}),
			children
		]
	});
}
var norm = (s) => (s ?? "").trim().toLowerCase();
var tb = (gb) => gb == null ? NA : gb >= 1e3 ? `${(gb / 1e3).toFixed(1)} TB` : `${gb.toFixed(0)} GB`;
function DiskHealth({ disk, health, lhmOnline, onShowHistory }) {
	if (!health) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "hwd__note",
		children: lhmOnline ? "LibreHardwareMonitor 没有提供这块硬盘的健康数据。" : `健康数据需要 LibreHardwareMonitor：以管理员身份运行它，并在 Options → Remote Web Server 里勾选 Run。`
	});
	if (!health.readOk) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "hwd__warn",
		children: "这块硬盘的健康数据暂时读不到（之前能读到）。这不代表硬盘损坏。"
	});
	const h = health;
	const temp = h.tempC == null ? NA : `${h.tempC.toFixed(0)}°C${h.warnTempC != null ? `（硬盘自报警告 ${h.warnTempC.toFixed(0)}°C` : ""}${h.critTempC != null ? `，临界 ${h.critTempC.toFixed(0)}°C）` : h.warnTempC != null ? "）" : ""}`;
	const spareLow = h.availableSpare != null && h.spareThreshold != null && h.availableSpare <= h.spareThreshold;
	const rows = [
		["温度", temp],
		["已用寿命（厂商报告 Percentage Used）", h.percentUsed != null ? `${h.percentUsed.toFixed(0)}%` : NA],
		["可用备用空间（Available Spare）", h.availableSpare != null ? `${h.availableSpare.toFixed(0)}%${h.spareThreshold != null ? `（阈值 ${h.spareThreshold.toFixed(0)}%）` : ""}` : NA],
		["累计写入", tb(h.writtenGB)],
		["累计读取", tb(h.readGB)],
		["通电时间", h.powerOnHours != null ? `${h.powerOnHours.toFixed(0)} 小时（约 ${(h.powerOnHours / 24).toFixed(0)} 天）` : NA],
		["通电次数", h.powerOnCount != null ? h.powerOnCount.toFixed(0) : NA],
		["严重警告（Critical Warning）", h.criticalWarning == null ? UNKNOWN : h.criticalWarning === 0 ? "无" : describeCriticalWarning(h.criticalWarning)],
		["介质与数据完整性错误", h.mediaErrors == null ? UNKNOWN : `${h.mediaErrors} 次`],
		["意外断电次数", h.unsafeShutdowns == null ? UNKNOWN : `${h.unsafeShutdowns} 次`],
		["错误日志条目", h.errorLogEntries == null ? UNKNOWN : `${h.errorLogEntries} 条`]
	];
	const hasLog = h.criticalWarning != null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
			className: "hwd__sub",
			children: "健康与寿命"
		}),
		spareLow && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "hwd__warn",
			children: "可用备用空间已降到硬盘自身报告的阈值，建议尽快备份数据。"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dl", {
			className: "kv hwd",
			children: rows.map(([label, value]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "kv__row",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: label }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
					className: value === NA || value === UNKNOWN ? "hwd__na" : void 0,
					children: value
				})]
			}, label))
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "hwd__note",
			children: [
				"已用寿命是硬盘厂商给出的估计值，不等于故障概率，也不能换算成剩余可用天数。",
				hasLog ? " 意外断电是电脑突然断电、强制关机或蓝屏重启时记下的次数，用了一两年的电脑有几十次很常见，不代表硬盘有问题；错误日志条目记录的是硬盘执行命令出过错的历史，不一定是硬件故障。真正需要警惕的是「严重警告」不为无，或「介质与数据完整性错误」在增加。" : ` 标「未提供」「${NA}」的项目是当前读不到的，代表我们不知道，不代表没有问题。`,
				disk.health ? ` 系统报告的健康状态：${disk.health}。` : ""
			]
		}),
		h.tempKey && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			className: "btn hwd__btn",
			onClick: () => onShowHistory([h.tempKey]),
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChartLine, {
				size: 14,
				strokeWidth: 2
			}), " 查看温度历史"]
		})
	] });
}
var gb1 = (b) => b == null ? "--" : (b / GB).toFixed(1);
var fmt$1 = (v, unit, digits = 0) => v == null ? null : `${v.toLocaleString("en-US", {
	maximumFractionDigits: digits,
	minimumFractionDigits: digits
})} ${unit}`.trim();
function gpuRows(g) {
	return [
		["品牌（板卡厂商）", g.vendor],
		["型号", g.name],
		["架构", g.architecture],
		["核心芯片编号", g.chipId],
		["板卡编号（子系统）", g.subsystemId],
		["零件号", g.partNumber],
		["CUDA 核心", fmt$1(g.cudaCores, "个")],
		["SM 数量（推算）", fmt$1(g.smCount, "个")],
		["张量核心（推算）", fmt$1(g.tensorCores, "个")],
		["光线追踪核心（推算）", fmt$1(g.rtCores, "个")],
		["显存容量", g.memoryMiB != null ? `${Math.round(g.memoryMiB / 1024)} GB（驱动报告 ${g.memoryMiB} MiB）` : null],
		["显存类型", g.memoryType],
		["显存位宽", fmt$1(g.busWidthBits, "bit")],
		["显存等效速率（推算）", fmt$1(g.memoryGbps, "Gbps", 1)],
		["理论显存带宽（推算）", fmt$1(g.bandwidthGBs, "GB/s", 0)],
		["最高核心频率", fmt$1(g.maxBoostMHz, "MHz")],
		["最高显存频率", fmt$1(g.maxMemoryMHz, "MHz")],
		["默认功耗上限", fmt$1(g.powerDefaultW, "W")],
		["可调功耗范围", g.powerMinW != null && g.powerMaxW != null ? `${g.powerMinW.toFixed(0)} ~ ${g.powerMaxW.toFixed(0)} W` : null],
		["PCIe 接口", g.pcieMaxGen != null && g.pcieMaxWidth != null ? `PCIe ${g.pcieMaxGen}.0 ×${g.pcieMaxWidth}（最高）` : null],
		["计算能力（Compute Capability）", g.computeCapability],
		["驱动版本", g.driverVersion],
		["CUDA 版本", g.cudaVersion],
		["显卡 BIOS（VBIOS）", g.vbios]
	];
}
function PsuForm({ psu, powerW, update }) {
	const text = (key, label, placeholder) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "cfan__row",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "cfan__name psu__label",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
			className: "cname",
			defaultValue: psu[key],
			placeholder,
			maxLength: 60,
			onBlur: (e) => e.currentTarget.value.trim() !== psu[key] && update({ psu: { [key]: e.currentTarget.value.trim() } }),
			onKeyDown: (e) => e.key === "Enter" && e.currentTarget.blur(),
			"aria-label": label
		})]
	}, key);
	const load = psu.ratedW && powerW != null ? powerW / psu.ratedW * 100 : null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		text("brand", "品牌", "例如 ROG 玩家国度"),
		text("maker", "生产厂商", "例如 华硕 ASUS"),
		text("model", "型号", "例如 ROG 雷神二代 …"),
		text("efficiency", "能效认证", "例如 80 PLUS 白金牌"),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "cfan__row",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "cfan__name psu__label",
				children: "额定最大功率"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				className: "cname",
				type: "number",
				min: 100,
				max: 3e3,
				defaultValue: psu.ratedW ?? "",
				placeholder: "单位 W，看电源铭牌或包装盒",
				onBlur: (e) => {
					const v = e.currentTarget.value.trim();
					const n = v === "" ? null : Number(v);
					if (n !== psu.ratedW && (n === null || Number.isFinite(n) && n >= 100 && n <= 3e3)) update({ psu: { ratedW: n } });
				},
				onKeyDown: (e) => e.key === "Enter" && e.currentTarget.blur(),
				"aria-label": "额定最大功率"
			})]
		}),
		load != null && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "kv hwd",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "kv__row",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "当前负载率（估算）" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dd", { children: [
					"约 ",
					powerW.toFixed(0),
					" W / ",
					psu.ratedW,
					" W = ",
					load.toFixed(0),
					"%"
				] })]
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "hwd__note",
			children: "电源是不通信的部件，软件读不到它的品牌和型号，所以这里的信息由你填写一次，会保存下来。 负载率用的是「估算整机功耗」（CPU 封装功耗 + 显卡功耗 + 其他部件估算值），不是电源的实测输出，仅供参考。"
		})
	] });
}
function MemoryHealth({ memory, dimms, lhmOnline, onShowHistory }) {
	const limit = memory?.commitLimitBytes ?? null;
	const pagefile = limit != null && memory ? Math.max(0, limit - memory.totalBytes) : null;
	const keys = dimms.map((d) => d.tempKey).filter((k) => k != null);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
			className: "hwd__sub",
			children: "使用与健康"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
			className: "kv hwd",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "kv__row",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "已使用" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dd", { children: [
						gb1(memory?.usedBytes ?? null),
						" / ",
						gb1(memory?.totalBytes ?? null),
						" GB"
					] })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "kv__row",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "已提交（Committed）" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dd", { children: [
						gb1(memory?.committedBytes ?? null),
						" / ",
						gb1(limit),
						" GB"
					] })]
				}),
				dimms.map((d) => {
					const slot = /\(#\d+\)$/.exec(d.name)?.[0] ?? d.name;
					const limits = [d.highLimitC != null ? `上限 ${d.highLimitC.toFixed(0)}°C` : null, d.critLimitC != null ? `临界 ${d.critLimitC.toFixed(0)}°C` : null].filter(Boolean);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "kv__row",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dt", { children: [
							"内存条 ",
							slot,
							" 温度"
						] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dd", {
							className: d.tempC == null ? "hwd__na" : void 0,
							children: [d.tempC != null ? `${d.tempC.toFixed(1)}°C` : NA, limits.length > 0 ? `（内存条自报${limits.join("，")}）` : ""]
						})]
					}, d.name);
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "kv__row",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "内存错误计数" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
						className: "hwd__na",
						children: NA
					})]
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "hwd__note",
			children: [
				"「已提交」是所有程序向系统申请的内存总量；上限 ",
				gb1(limit),
				" GB = 物理内存 ",
				gb1(memory?.totalBytes ?? null),
				" GB + 虚拟内存（页面文件）",
				gb1(pagefile),
				" GB，接近上限时程序可能崩溃。",
				dimms.length === 0 ? lhmOnline ? " LibreHardwareMonitor 没有提供内存条温度（部分内存条没有温度传感器）。" : " 内存条温度需要 LibreHardwareMonitor 在后台运行并开启网页服务器。" : " 内存条编号（#0、#2）是 LibreHardwareMonitor 给的序号，不一定和主板插槽名称一一对应。",
				"普通家用内存不带纠错功能，系统无法统计内存错误。"
			]
		}),
		keys.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			className: "btn hwd__btn",
			onClick: () => onShowHistory(keys),
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChartLine, {
				size: 14,
				strokeWidth: 2
			}), " 查看温度历史"]
		})
	] });
}
function HardwareSheet({ open, onClose, hw, cpu, memory, storage, dimms, lhmOnline, psu, powerW, update, onShowHistory }) {
	const board = hw?.board ?? null;
	const mem = hw?.memory ?? null;
	const monitors = hw?.monitors ?? [];
	const disks = hw?.disks ?? [];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: `sheet ${open ? "is-open" : ""}`,
		"aria-hidden": !open,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "sheet__bar",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: "硬件信息" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
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
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Group, {
					title: "处理器",
					rows: [
						["型号", cpu?.model],
						["核心 / 线程", cpu?.physicalCores != null ? `${cpu.physicalCores} / ${cpu.logicalCores ?? "--"}` : null],
						["基础频率", cpu?.baseGHz != null ? `${cpu.baseGHz.toFixed(2)} GHz` : null]
					]
				}),
				hw?.gpu && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Group, {
					title: "显卡",
					rows: gpuRows(hw.gpu),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "hwd__note",
						children: "标「推算」的项不是读出来的：SM、张量核心、光追核心按架构的固定比例由 CUDA 核心数换算；显存等效速率为显存最高频率的 2 倍； 理论带宽 = 位宽 × 等效速率 ÷ 8。品牌来自显卡硬件里记录的子系统厂商编号。「最高核心频率」是显卡允许的上限，不是出厂标称的加速频率。"
					})
				}),
				board && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Group, {
					title: "主板",
					rows: [
						["品牌", board.vendor],
						["型号", board.model],
						["版本", board.version],
						["序列号", board.serial],
						["整机型号", board.systemModel],
						["BIOS 厂商", board.biosVendor],
						["BIOS 版本", board.biosVersion],
						["BIOS 日期", board.biosDate]
					]
				}),
				mem && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Group, {
					title: "内存",
					rows: [
						["类型", mem.type],
						["总容量", `${Math.round(mem.modules.reduce((a, m) => a + m.capacityBytes, 0) / GB)} GB`],
						["实际频率", mem.modules[0]?.configuredMTs != null ? `${mem.modules[0].configuredMTs} MT/s` : null],
						["标称频率", mem.modules[0]?.ratedMTs != null ? `${mem.modules[0].ratedMTs} MT/s` : null],
						...mem.modules.map((m) => [m.slot, `${Math.round(m.capacityBytes / GB)} GB · ${[m.manufacturer, m.partNumber].filter(Boolean).join(" ")}`])
					],
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MemoryHealth, {
						memory,
						dimms,
						lhmOnline,
						onShowHistory
					})
				}),
				monitors.map((m, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Group, {
					title: monitors.length > 1 ? `显示器 ${i + 1}` : "显示器",
					rows: [
						["品牌", m.brand],
						["型号", m.model],
						["尺寸", m.inches != null ? `${m.inches} 英寸` : null],
						["分辨率", m.resolution],
						["刷新率", m.refreshHz != null ? `${m.refreshHz} Hz` : null],
						["生产年份", m.year],
						["序列号", m.serial]
					]
				}, `m${i}`)),
				disks.map((d, i) => {
					const tag = diskTag(d.kind);
					const name = disks.length > 1 ? `硬盘 ${i + 1}` : "硬盘";
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Group, {
						title: tag ? `${name} · ${tag}` : name,
						rows: [
							["品牌", d.brand],
							["型号", d.model],
							["类型", d.kind],
							["容量", diskSize(d.sizeBytes)],
							["固件版本", d.firmware],
							["序列号", d.serial]
						],
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DiskHealth, {
							disk: d,
							health: storage.find((s) => norm(s.name) === norm(d.model)),
							lhmOnline,
							onShowHistory
						})
					}, `d${i}`);
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "sgroup",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "电源" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PsuForm, {
						psu,
						powerW,
						update
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Group, {
					title: "系统",
					rows: [["已开机", hw ? uptimeText(hw.uptimeSec) : null]]
				})
			]
		})]
	});
}
