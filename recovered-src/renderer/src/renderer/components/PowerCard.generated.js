// GENERATED FRAGMENT — extracted from out/renderer/assets/index-CzIv0K4n.js, lines 24450-24466.
// Original module marker: src/renderer/components/PowerCard.tsx. Not the original TypeScript/TSX source.
// Depends on bundle-level imports, globals, and other fragments; not standalone.
var watts = (w) => w == null ? "--" : Math.round(w);
function PowerCard({ fallback }) {
	const { power, history } = usePowerLive(fallback);
	const value = power?.totalW ?? null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MetricCard, {
		icon: Zap,
		label: power?.source === "smart-plug" ? "整机功耗" : "整机功耗（估算）",
		value,
		unit: "W",
		level: levelOf(value, 450, 600),
		history,
		chartMax: 700,
		animMs: 160,
		sub: power ? power.source === "smart-plug" ? "智能插座实测" : `CPU ${watts(power.cpuW)} + GPU ${watts(power.gpuW)} + 其他 ${power.otherW} W` : "读取中…",
		hint: "软件无法直接读取墙插功耗：整机估算 = CPU 封装功耗 + GPU 板卡功耗 + 其他部件估算值。数字高频刷新，折线图为每秒平均值。以后可接入智能插座获得实测值。"
	});
}
