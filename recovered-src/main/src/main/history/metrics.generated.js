// GENERATED FRAGMENT — extracted from out/main/index.js, lines 3314-3417.
// Original module marker: src/main/history/metrics.ts. Not the original TypeScript/TSX source.
// Depends on bundle-level imports, globals, and other fragments; not standalone.
var num$1 = (v) => v != null && Number.isFinite(v) ? v : null;
var maxOf = (a, b) => a == null && b == null ? null : Math.max(a ?? 0, b ?? 0);
var sumOf = (a, b) => a == null && b == null ? null : (a ?? 0) + (b ?? 0);
var maxCoreUsage = (s) => {
	const u = s.cpu.cores.map((c) => c.usage).filter((v) => v != null);
	return u.length > 0 ? Math.max(...u) : null;
};
function snapshotMetrics(s) {
	const m = (key, label, unit, group, value) => ({
		key,
		label,
		unit,
		group,
		value: num$1(value)
	});
	return [
		m("cpu.usage", "CPU 使用率", "%", "CPU", s.cpu.usage),
		m("cpu.temp", "CPU 温度", "°C", "CPU", s.cpu.tempC),
		m("cpu.power", "CPU 封装功耗", "W", "CPU", s.cpu.packagePowerW),
		m("cpu.freq", "CPU 频率", "GHz", "CPU", s.cpu.freqGHz),
		m("gpu.usage", "GPU 使用率", "%", "GPU", s.gpu.usage),
		m("gpu.temp", "GPU 温度", "°C", "GPU", s.gpu.tempC),
		m("gpu.power", "GPU 功耗", "W", "GPU", s.gpu.powerW),
		m("gpu.mem", "GPU 显存占用", "%", "GPU", s.gpu.memPercent),
		m("mem.usage", "内存使用率", "%", "内存", s.memory.usagePercent),
		m("disk.busy", "磁盘忙碌程度", "%", "磁盘", s.disk.busyPercent),
		m("disk.read", "磁盘读取速度", "B/s", "磁盘", s.disk.readBytesPerSec),
		m("disk.write", "磁盘写入速度", "B/s", "磁盘", s.disk.writeBytesPerSec),
		m("net.rx", "下行速度", "B/s", "网络", s.network.rxBytesPerSec),
		m("net.tx", "上行速度", "B/s", "网络", s.network.txBytesPerSec),
		m("net.latency", "外网延迟", "ms", "网络", s.network.internetLatencyMs),
		m("net.gateway", "网关延迟", "ms", "网络", s.network.gatewayLatencyMs),
		m("power.total", "整机功耗（估算）", "W", "功耗", s.power.totalW),
		m("cpu.maxCore", "CPU 最忙核心占用", "%", "CPU", maxCoreUsage(s)),
		m("perf.procQueue", "处理器队列", "个", "诊断", s.perf.processorQueue),
		m("perf.cpuLimit", "CPU 性能上限", "%", "诊断", s.perf.perfLimitPct),
		m("perf.diskMs", "磁盘响应时间（最慢的盘）", "ms", "诊断", maxOf(s.perf.diskReadMs, s.perf.diskWriteMs)),
		m("perf.diskQueue", "磁盘队列长度", "个", "诊断", s.perf.diskQueue),
		m("perf.hardFaults", "硬缺页", "次/秒", "诊断", s.perf.hardFaultsPerSec),
		m("perf.dpc", "驱动延迟（DPC + 中断）", "%", "诊断", sumOf(s.perf.dpcPct, s.perf.interruptPct)),
		m("frame.fps", "前台程序帧率", "FPS", "帧时间", s.frames.fps),
		m("frame.avg", "前台程序平均帧时间", "ms", "帧时间", s.frames.avgMs),
		m("frame.max", "前台程序最大帧时间（最近 10 秒）", "ms", "帧时间", s.frames.maxMs),
		m("frame.p99", "前台程序帧时间 99 百分位", "ms", "帧时间", s.frames.p99Ms),
		m("frame.stutter", "前台程序卡顿帧数（最近 10 秒）", "次", "帧时间", s.frames.state === "running" ? s.frames.stutters10s : null),
		...s.storage.flatMap((d) => [m(`ssd.media:${d.name}`, `${d.name} 介质错误累计`, "次", "SSD", d.mediaErrors), m(`ssd.unsafe:${d.name}`, `${d.name} 意外断电累计`, "次", "SSD", d.unsafeShutdowns)])
	];
}
function sensorMetrics(sensors) {
	const out = [];
	for (const s of sensors) if (s.type === "Fan" && s.unit === "RPM") {
		const prefix = s.id.startsWith("/lpc/") ? "主板 " : s.id.startsWith("/gpu-") ? "显卡 " : "";
		out.push({
			key: `lhm:${s.id}`,
			label: `${prefix}${s.name} 转速`,
			unit: "RPM",
			group: "风扇",
			value: num$1(s.value)
		});
	} else if (s.type === "Temperature" && /^\/(nvme|ssd|hdd)\/\d+\/temperature\/0$/.test(s.id)) out.push({
		key: `lhm:${s.id}`,
		label: `${s.hardware} 温度`,
		unit: "°C",
		group: "SSD",
		value: num$1(s.value)
	});
	else if (s.type === "Temperature" && /^\/lpc\//.test(s.id)) out.push({
		key: `lhm:${s.id}`,
		label: `主板传感器 ${s.name}`,
		unit: "°C",
		group: "主板",
		value: num$1(s.value)
	});
	else if (s.type === "Control" && s.unit === "%" && /^\/lpc\//.test(s.id)) out.push({
		key: `lhm:${s.id}`,
		label: `主板 ${s.name} 控制值`,
		unit: "%",
		group: "风扇",
		value: num$1(s.value)
	});
	else if (s.type === "Temperature" && /^\/memory\/dimm\/\d+\/temperature\/0$/.test(s.id)) {
		const slot = /\(#\d+\)$/.exec(s.hardware)?.[0] ?? "";
		out.push({
			key: `lhm:${s.id}`,
			label: `内存条 ${slot} 温度`,
			unit: "°C",
			group: "内存",
			value: num$1(s.value)
		});
	}
	return out;
}
function makeEventSnapshot(s, values) {
	const metrics = {};
	for (const v of values) metrics[v.key] = v.value;
	return {
		ts: s.ts,
		cpu: s.processes.apps.cpu.slice(0, 5),
		mem: s.processes.apps.mem.slice(0, 5),
		net: s.processes.apps.net.slice(0, 5),
		io: s.processes.apps.io.slice(0, 5),
		metrics
	};
}
