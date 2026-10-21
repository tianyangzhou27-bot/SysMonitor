// GENERATED FRAGMENT — extracted from out/renderer/assets/index-CzIv0K4n.js, lines 18000-18061.
// Original module marker: src/renderer/lib/diag.ts. Not the original TypeScript/TSX source.
// Depends on bundle-level imports, globals, and other fragments; not standalone.
/** 历史事件的标题；画面卡顿的旧记录标题里没有程序名，从证据的「程序」一项补上 */
function eventTitle(e) {
	if (e.key !== "frame-stutter" || e.title.includes(" · ")) return e.title;
	const proc = e.extra?.evidence.find((x) => x.label === "程序")?.value.split("（")[0];
	return proc ? `${e.title} · ${proc}` : e.title;
}
var CONF_TEXT = {
	low: "低",
	medium: "中",
	high: "高"
};
/** 历史记录里保存的置信度是中文（低 / 中 / 高） */
var confClass = (c) => c === "高" || c === "high" ? "is-high" : c === "中" || c === "medium" ? "is-medium" : "is-low";
var CHECK_TEXT = {
	ok: "正常",
	near: "接近",
	pending: "观察中",
	active: "已触发",
	na: "缺少数据"
};
/** 诊断事件回放时自动显示的指标 */
var DIAG_METRICS = {
	"cpu-high": ["cpu.usage", "perf.procQueue"],
	"single-core": ["cpu.maxCore", "cpu.usage"],
	"cpu-limited": [
		"perf.cpuLimit",
		"cpu.temp",
		"cpu.power"
	],
	"mem-pressure": ["mem.usage", "perf.hardFaults"],
	"hard-faults": ["perf.hardFaults", "mem.usage"],
	"disk-latency": [
		"perf.diskMs",
		"perf.diskQueue",
		"disk.busy"
	],
	"disk-busy": ["disk.busy", "perf.diskMs"],
	"gpu-full": ["gpu.usage", "gpu.temp"],
	vram: ["gpu.mem", "gpu.usage"],
	"gpu-limited": [
		"gpu.temp",
		"gpu.power",
		"gpu.usage"
	],
	dpc: ["perf.dpc"]
};
var FRAME_STATE_TEXT = {
	off: "已关闭",
	idle: "等待前台出现全屏程序",
	starting: "正在启动",
	running: "采集中",
	denied: "没有权限",
	missing: "找不到采集程序",
	error: "出错"
};
/** 卡片上的一句话：采集中显示前台程序的帧率，其他状态说明原因 */
function frameLine(f) {
	if (!f) return "";
	if (f.state === "running" && f.process && f.fps != null) return `${f.process}${f.background ? "（后台）" : ""} ${f.fps.toFixed(0)} FPS${f.low1Fps != null ? `，1% Low ${f.low1Fps.toFixed(0)}` : ""}${f.stutters10s > 0 ? `，卡顿帧 ${f.stutters10s}` : ""}`;
	if (f.state === "running") return "前台程序没有在出画面帧";
	return `帧时间：${FRAME_STATE_TEXT[f.state]}`;
}
