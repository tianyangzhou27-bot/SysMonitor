// GENERATED FRAGMENT — extracted from out/renderer/assets/index-CzIv0K4n.js, lines 24469-24587.
// Original module marker: src/renderer/components/ProcessCard.tsx. Not the original TypeScript/TSX source.
// Depends on bundle-level imports, globals, and other fragments; not standalone.
var TABS = [
	{
		key: "cpu",
		label: "CPU"
	},
	{
		key: "mem",
		label: "内存"
	},
	{
		key: "net",
		label: "网络"
	}
];
function memText(bytes) {
	if (bytes == null) return "--";
	return bytes >= 1024 ** 3 ? `${(bytes / 1024 ** 3).toFixed(1)} GB` : `${Math.round(bytes / 1024 ** 2)} MB`;
}
function rateText(bytes) {
	const p = rateParts(bytes);
	return p.value == null ? "--" : `${p.value.toFixed(p.decimals)} ${p.unit}`;
}
function weight(row, tab, source) {
	if (tab === "cpu") return row.cpuPercent ?? 0;
	if (tab === "mem") return row.memBytes ?? 0;
	return source === "clash" ? (row.netDownBytesPerSec ?? 0) + (row.netUpBytesPerSec ?? 0) : row.netConns ?? 0;
}
function valueText(row, tab, source) {
	if (tab === "cpu") return row.cpuPercent == null ? "--" : `${row.cpuPercent.toFixed(1)}%`;
	if (tab === "mem") return memText(row.memBytes);
	if (source === "clash") return `↓ ${rateText(row.netDownBytesPerSec)}  ↑ ${rateText(row.netUpBytesPerSec)}`;
	return `${row.netConns ?? 0} 个连接`;
}
function ProcessCard({ data }) {
	const [tab, setTab] = (0, import_react.useState)("cpu");
	const [merged, setMerged] = (0, import_react.useState)(true);
	const lists = data ? merged ? data.apps : data.procs : null;
	const source = data?.netSource ?? "clash";
	const rows = lists?.[tab] ?? [];
	const max = Math.max(1e-9, ...rows.map((r) => weight(r, tab, source)));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, {
		className: "panel proc",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "panel__head",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ListOrdered, {
						size: 18,
						strokeWidth: 1.75
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "进程 Top 10" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "seg seg--right",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							className: merged ? "is-on" : "",
							onClick: () => setMerged(true),
							children: "按应用"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							className: merged ? "" : "is-on",
							onClick: () => setMerged(false),
							children: "按进程"
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "seg seg--full",
				children: TABS.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					className: tab === t.key ? "is-on" : "",
					onClick: () => setTab(t.key),
					children: t.label
				}, t.key))
			}),
			tab === "net" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "proc__note",
				children: source === "clash" ? "统计经 Clash 的流量，按发起连接的应用归属；不经过 Clash 的流量（局域网等）不在内" : "Clash 控制器未连接，暂以已建立的 TCP 连接数排序"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ol", {
				className: "proc__list",
				children: [
					rows.map((r, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "proc__row",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "proc__rank",
							children: i + 1
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "proc__main",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "proc__line",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "proc__name",
									children: [
										r.name,
										merged && r.count > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("em", { children: [" ×", r.count] }),
										!merged && r.pid != null && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("em", { children: [" · PID ", r.pid] })
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "proc__val",
									children: valueText(r, tab, source)
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "proc__bar",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { width: `${weight(r, tab, source) / max * 100}%` } })
							})]
						})]
					}, `${r.name}-${r.pid ?? i}`)),
					data && rows.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "panel__hint",
						children: tab === "net" ? "当前没有明显的流量" : "--"
					}),
					!data && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "panel__hint",
						children: "读取中…"
					})
				]
			})
		]
	});
}
