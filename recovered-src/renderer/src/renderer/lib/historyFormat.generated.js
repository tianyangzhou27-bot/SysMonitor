// GENERATED FRAGMENT — extracted from out/renderer/assets/index-CzIv0K4n.js, lines 18064-18158.
// Original module marker: src/renderer/lib/historyFormat.ts. Not the original TypeScript/TSX source.
// Depends on bundle-level imports, globals, and other fragments; not standalone.
var PALETTE = [
	"#4f9cff",
	"#ff8a4c",
	"#3fcf8e",
	"#c77dff",
	"#ffd23f",
	"#ff5d73",
	"#2ec4d6",
	"#9aa5b1"
];
var MAX_SELECTED = PALETTE.length;
var PRESETS = [
	{
		ms: 9e5,
		label: "最近 15 分钟"
	},
	{
		ms: 36e5,
		label: "最近 1 小时"
	},
	{
		ms: 864e5,
		label: "最近 24 小时"
	},
	{
		ms: 6048e5,
		label: "最近 7 天"
	}
];
var UNIT_TITLE = {
	"%": "百分比",
	"°C": "温度",
	W: "功耗",
	"B/s": "速度",
	ms: "延迟",
	RPM: "风扇转速",
	GHz: "频率",
	次: "累计次数",
	个: "数量",
	FPS: "帧率",
	"次/秒": "每秒次数"
};
var BYTE_UNITS = [
	"B/s",
	"KB/s",
	"MB/s",
	"GB/s"
];
function formatValue(v, unit) {
	if (v == null || !Number.isFinite(v)) return "--";
	if (unit === "B/s") {
		let x = Math.abs(v);
		let i = 0;
		while (x >= 1024 && i < BYTE_UNITS.length - 1) {
			x /= 1024;
			i++;
		}
		return `${(v < 0 ? -x : x).toFixed(x >= 100 || i === 0 ? 0 : 1)} ${BYTE_UNITS[i]}`;
	}
	const digits = unit === "GHz" ? 2 : Math.abs(v) >= 100 || unit === "RPM" || unit === "ms" || unit === "次" || unit === "个" || unit === "次/秒" ? 0 : 1;
	return `${v.toFixed(digits)} ${unit}`;
}
var pad$1 = (n) => String(n).padStart(2, "0");
function formatTime(ms, withDate = true) {
	const d = new Date(ms);
	const t = `${pad$1(d.getHours())}:${pad$1(d.getMinutes())}:${pad$1(d.getSeconds())}`;
	return withDate ? `${pad$1(d.getMonth() + 1)}-${pad$1(d.getDate())} ${t}` : t;
}
function formatDuration(ms) {
	const s = Math.round(ms / 1e3);
	if (s < 60) return `${s} 秒`;
	if (s < 3600) return `${Math.floor(s / 60)} 分 ${s % 60} 秒`;
	return `${Math.floor(s / 3600)} 小时 ${Math.floor(s % 3600 / 60)} 分`;
}
function toLocalInput(ms) {
	const d = new Date(ms);
	return `${d.getFullYear()}-${pad$1(d.getMonth() + 1)}-${pad$1(d.getDate())}T${pad$1(d.getHours())}:${pad$1(d.getMinutes())}`;
}
function formatBytes(b) {
	if (b >= 1024 ** 3) return `${(b / 1024 ** 3).toFixed(2)} GB`;
	if (b >= 1024 ** 2) return `${(b / 1024 ** 2).toFixed(1)} MB`;
	return `${Math.max(1, Math.round(b / 1024))} KB`;
}
var EVENT_METRICS = {
	cpu: ["cpu.usage"],
	cpuTemp: ["cpu.temp"],
	gpu: ["gpu.usage"],
	gpuTemp: ["gpu.temp"],
	mem: ["mem.usage"],
	commit: ["mem.usage"],
	power: ["power.total"],
	"net-slow": ["net.latency"],
	"net-down": ["net.latency", "net.rx"],
	disk: ["disk.busy"]
};
