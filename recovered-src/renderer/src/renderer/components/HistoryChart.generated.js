// GENERATED FRAGMENT — extracted from out/renderer/assets/index-CzIv0K4n.js, lines 23301-23537.
// Original module marker: src/renderer/components/HistoryChart.tsx. Not the original TypeScript/TSX source.
// Depends on bundle-level imports, globals, and other fragments; not standalone.
var HEIGHT = 190;
var SYNC_KEY = "sysmonitor-history";
var EMPTY_SELECT = {
	left: 0,
	top: 0,
	width: 0,
	height: 0
};
var pad = (n) => String(n).padStart(2, "0");
function xLabels(u, vals) {
	const min = u.scales.x.min ?? 0;
	const span = (u.scales.x.max ?? 0) - min;
	return vals.map((v) => {
		const d = /* @__PURE__ */ new Date(v * 1e3);
		const hm = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
		if (span <= 600) return `${hm}:${pad(d.getSeconds())}`;
		if (span <= 86400) return hm;
		return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${hm}`;
	});
}
function yLabel(v, unit) {
	if (unit === "B/s") return formatValue(v, unit);
	return `${Number.isInteger(v) ? v : v.toFixed(1)} ${unit}`;
}
function yRange(unit) {
	return (_u, min, max) => {
		if (!Number.isFinite(min) || !Number.isFinite(max)) return [0, unit === "%" ? 100 : 10];
		if (unit === "%") return [0, 100];
		if (unit === "°C") {
			const span = Math.max(max - min, 5);
			return [Math.floor(min - span * .2), Math.ceil(max + span * .2)];
		}
		return [0, Math.max(max * 1.1, 1)];
	};
}
function HistoryChart({ unit, series, ts, avg, min, max, shade, themeTick, onZoom, onReset }) {
	const hostRef = (0, import_react.useRef)(null);
	const readRef = (0, import_react.useRef)(null);
	const plotRef = (0, import_react.useRef)(null);
	const latest = (0, import_react.useRef)({
		ts,
		avg,
		min,
		max,
		series,
		unit,
		shade,
		onZoom
	});
	latest.current = {
		ts,
		avg,
		min,
		max,
		series,
		unit,
		shade,
		onZoom
	};
	const data = [ts.map((t) => t / 1e3), ...series.flatMap((_, i) => [
		avg[i] ?? [],
		max[i] ?? [],
		min[i] ?? []
	])];
	const structKey = series.map((s) => `${s.key}:${s.color}`).join("|");
	const renderReadout = (u) => {
		const el = readRef.current;
		if (!el) return;
		const cur = latest.current;
		el.textContent = "";
		const hovered = u.cursor.idx;
		const head = document.createElement("span");
		head.className = "hchart__time";
		head.textContent = hovered != null && cur.ts[hovered] != null ? formatTime(cur.ts[hovered]) : "最新值";
		el.appendChild(head);
		cur.series.forEach((s, i) => {
			const a = cur.avg[i] ?? [];
			let idx = hovered;
			if (idx == null) {
				idx = a.length - 1;
				while (idx >= 0 && a[idx] == null) idx--;
			}
			const item = document.createElement("span");
			item.className = "hchart__item";
			const dot = document.createElement("i");
			dot.style.background = s.color;
			const lo = idx >= 0 ? cur.min[i]?.[idx] : null;
			const hi = idx >= 0 ? cur.max[i]?.[idx] : null;
			let text = `${s.label} ${idx >= 0 ? formatValue(a[idx], cur.unit) : "--"}`;
			if (lo != null && hi != null && hovered != null) text += `（${formatValue(lo, cur.unit)} ~ ${formatValue(hi, cur.unit)}）`;
			item.append(dot, text);
			el.appendChild(item);
		});
	};
	(0, import_react.useEffect)(() => {
		const host = hostRef.current;
		if (!host) return;
		const dim = getComputedStyle(document.documentElement).getPropertyValue("--text-dim").trim() || "#888";
		const grid = "rgba(128,128,128,0.2)";
		const sizeY = unit === "B/s" ? 78 : 62;
		const seriesCfg = [{}];
		const bands = [];
		series.forEach((s, i) => {
			seriesCfg.push({
				label: s.label,
				stroke: s.color,
				width: 1.7,
				points: { show: false }
			});
			seriesCfg.push({
				label: `${s.label} 最大`,
				stroke: "transparent",
				width: 0,
				points: { show: false }
			});
			seriesCfg.push({
				label: `${s.label} 最小`,
				stroke: "transparent",
				width: 0,
				points: { show: false }
			});
			bands.push({
				series: [2 + i * 3, 3 + i * 3],
				fill: `${s.color}2e`
			});
		});
		const u = new uPlot({
			width: host.clientWidth || 640,
			height: HEIGHT,
			series: seriesCfg,
			bands,
			legend: { show: false },
			scales: {
				x: { time: true },
				y: { range: yRange(unit) }
			},
			axes: [{
				stroke: dim,
				grid: {
					stroke: grid,
					width: 1
				},
				ticks: {
					stroke: grid,
					width: 1
				},
				font: "11px sans-serif",
				values: xLabels
			}, {
				stroke: dim,
				size: sizeY,
				grid: {
					stroke: grid,
					width: 1
				},
				ticks: {
					stroke: grid,
					width: 1
				},
				font: "11px sans-serif",
				values: (_u, vals) => vals.map((v) => yLabel(v, unit))
			}],
			cursor: {
				drag: {
					x: true,
					y: false,
					setScale: false
				},
				sync: { key: SYNC_KEY }
			},
			hooks: {
				setSelect: [(u) => {
					const w = u.select.width;
					if (w > 6) {
						const l = u.posToVal(u.select.left, "x");
						const r = u.posToVal(u.select.left + w, "x");
						latest.current.onZoom(l * 1e3, r * 1e3);
					}
					u.setSelect(EMPTY_SELECT, false);
				}],
				setCursor: [renderReadout],
				drawClear: [(u) => {
					const sh = latest.current.shade;
					if (!sh) return;
					const left = Math.max(u.valToPos(sh.from / 1e3, "x", true), u.bbox.left);
					const right = Math.min(u.valToPos(sh.to / 1e3, "x", true), u.bbox.left + u.bbox.width);
					if (right <= left) return;
					u.ctx.save();
					u.ctx.fillStyle = "rgba(255, 170, 60, 0.18)";
					u.ctx.fillRect(left, u.bbox.top, right - left, u.bbox.height);
					u.ctx.restore();
				}]
			}
		}, data, host);
		plotRef.current = u;
		renderReadout(u);
		const ro = new ResizeObserver(() => u.setSize({
			width: host.clientWidth,
			height: HEIGHT
		}));
		ro.observe(host);
		return () => {
			ro.disconnect();
			u.destroy();
			plotRef.current = null;
		};
	}, [
		structKey,
		unit,
		themeTick
	]);
	(0, import_react.useEffect)(() => {
		const u = plotRef.current;
		if (!u) return;
		u.setData(data);
		renderReadout(u);
	}, [
		ts,
		avg,
		min,
		max
	]);
	(0, import_react.useEffect)(() => {
		plotRef.current?.redraw(false);
	}, [shade]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "hchart",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			ref: readRef,
			className: "hchart__read"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			ref: hostRef,
			className: "hchart__host",
			onDoubleClick: onReset
		})]
	});
}
