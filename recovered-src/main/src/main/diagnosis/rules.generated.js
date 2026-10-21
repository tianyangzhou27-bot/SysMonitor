// GENERATED FRAGMENT — extracted from out/main/index.js, lines 3864-4366.
// Original module marker: src/main/diagnosis/rules.ts. Not the original TypeScript/TSX source.
// Depends on bundle-level imports, globals, and other fragments; not standalone.
var pickTier = (t, s) => s === "conservative" ? t[0] : s === "sensitive" ? t[2] : t[1];
var pct = (v) => `${v.toFixed(0)}%`;
var ms = (v) => `${v.toFixed(v < 10 ? 1 : 0)} ms`;
var mbs = (b) => b >= 1024 ** 2 ? `${(b / 1024 ** 2).toFixed(1)} MB/s` : `${Math.round(b / 1024)} KB/s`;
var top = (rows, value, n = 3) => rows.slice(0, n).map((r) => {
	const v = value(r);
	return v ? `${r.name}（${v}）` : null;
}).filter((x) => x != null);
var topCpu = (s) => top(s.processes.apps.cpu, (r) => r.cpuPercent != null && r.cpuPercent >= 1 ? pct(r.cpuPercent) : null);
var topMem = (s) => top(s.processes.apps.mem, (r) => r.memBytes != null ? `${(r.memBytes / 1024 ** 3).toFixed(1)} GB` : null);
var topIo = (s) => top(s.processes.apps.io, (r) => r.ioBytesPerSec != null && r.ioBytesPerSec >= 102400 ? mbs(r.ioBytesPerSec) : null);
var ev = (label, value, threshold = null) => ({
	label,
	value,
	threshold
});
var maxCore = (s) => {
	let best = null;
	for (const c of s.cpu.cores) if (c.usage != null && (!best || c.usage > best.usage)) best = {
		label: c.label,
		usage: c.usage
	};
	return best;
};
var RULES = [
	{
		id: "cpu-high",
		title: "CPU 持续高负载",
		sustain: [
			30,
			20,
			15
		],
		evaluate(s, sens) {
			const u = s.cpu.usage;
			if (u == null) return null;
			const th = pickTier([
				95,
				90,
				85
			], sens);
			const queue = s.perf.processorQueue;
			const cores = s.cpu.logicalCores ?? s.cpu.cores.length;
			const saturated = queue != null && cores > 0 && queue >= cores * 2;
			return {
				hit: u >= th,
				near: u >= th - 10,
				current: pct(u),
				threshold: `≥ ${th}%`,
				confidence: saturated ? "high" : "medium",
				evidence: [ev("CPU 总占用", pct(u), `≥ ${th}%`), ev("处理器队列（等待 CPU 的线程）", queue == null ? "无法读取" : queue.toFixed(0), cores > 0 ? `≥ ${cores * 2} 表示明显排队` : null)],
				cause: saturated ? "所有核心都很忙，并且有大量线程在排队等 CPU，程序响应可能变慢。" : "CPU 长时间接近满载。如果你正在做渲染、编译、压缩等工作，这是正常现象。",
				suggestions: [
					"看看占用最高的程序是不是你正在用的",
					"关掉不需要的后台程序",
					"游戏中可以降低画质里依赖 CPU 的选项（如人数、物理效果）"
				],
				processes: topCpu(s)
			};
		}
	},
	{
		id: "single-core",
		title: "单核心性能瓶颈",
		sustain: [
			30,
			20,
			15
		],
		evaluate(s, sens) {
			const u = s.cpu.usage;
			const mc = maxCore(s);
			if (u == null || !mc) return null;
			const th = pickTier([
				98,
				95,
				90
			], sens);
			const totalBelow = 60;
			return {
				hit: mc.usage >= th && u < totalBelow,
				near: mc.usage >= th - 10 && u < totalBelow,
				current: `${mc.label} ${pct(mc.usage)}，总占用 ${pct(u)}`,
				threshold: `单核 ≥ ${th}% 且总占用 < ${totalBelow}%`,
				confidence: "medium",
				evidence: [ev(`最忙的核心 ${mc.label}`, pct(mc.usage), `≥ ${th}%`), ev("CPU 总占用", pct(u), `< ${totalBelow}%`)],
				cause: "总占用不高，但有一个核心跑满了，通常是某个程序只用得上一个线程（很多游戏的主线程就是这样）。",
				suggestions: [
					"看看占用最高的程序",
					"游戏里降低依赖 CPU 的设置",
					"这类瓶颈加核心数没用，主要靠单核性能"
				],
				processes: topCpu(s)
			};
		}
	},
	{
		id: "cpu-limited",
		title: "CPU 可能被降频",
		sustain: [
			20,
			10,
			8
		],
		evaluate(s, sens) {
			const limit = s.perf.perfLimitPct;
			const flags = s.perf.perfLimitFlags;
			const t = s.cpu.tempC;
			const u = s.cpu.usage;
			if (limit == null && t == null) return null;
			const hotTh = pickTier([
				98,
				95,
				90
			], sens);
			const limited = flags != null && flags !== 0 || limit != null && limit < 95;
			const hot = t != null && t >= hotTh;
			return {
				hit: limited && u != null && u >= 30 || hot,
				near: t != null && t >= hotTh - 5,
				current: `性能上限 ${limit == null ? "--" : pct(limit)}，温度 ${t == null ? "--" : `${t.toFixed(0)}°C`}`,
				threshold: `上限 < 95% 或温度 ≥ ${hotTh}°C`,
				confidence: hot ? "high" : "medium",
				evidence: [
					ev("CPU 性能上限（100% 为不受限）", limit == null ? "无法读取" : pct(limit), "< 95%"),
					ev("性能限制标志（0 为没有限制）", flags == null ? "无法读取" : String(flags), "≠ 0"),
					ev("CPU 封装温度", t == null ? "无法读取" : `${t.toFixed(0)}°C`, `≥ ${hotTh}°C`),
					ev("CPU 封装功耗", s.cpu.packagePowerW == null ? "无法读取" : `${s.cpu.packagePowerW.toFixed(0)} W`)
				],
				cause: hot ? "CPU 温度很高，很可能触发了温度保护而降频，性能会下降。" : "CPU 报告自己的性能被限制了，可能是功耗墙、温度或电源策略造成的。",
				suggestions: [
					"检查 CPU 散热：水泵、风扇是否正常，硅脂是否老化",
					"在「主板与散热」里看风扇转速",
					"检查 Windows 电源模式是否为「最佳性能」"
				],
				processes: topCpu(s)
			};
		}
	},
	{
		id: "mem-pressure",
		title: "内存压力过高",
		sustain: [
			45,
			30,
			20
		],
		evaluate(s, sens) {
			const u = s.memory.usagePercent;
			const { committedBytes: c, commitLimitBytes: l } = s.memory;
			const commit = c != null && l ? c / l * 100 : null;
			if (u == null && commit == null) return null;
			const th = pickTier([
				95,
				90,
				85
			], sens);
			const hf = s.perf.hardFaultsPerSec;
			const paging = hf != null && hf >= 500;
			const worst = Math.max(u ?? 0, commit ?? 0);
			return {
				hit: worst >= th,
				near: worst >= th - 10,
				current: `内存 ${u == null ? "--" : pct(u)}，已提交 ${commit == null ? "--" : pct(commit)}`,
				threshold: `≥ ${th}%`,
				confidence: paging ? "high" : "medium",
				evidence: [
					ev("物理内存使用率", u == null ? "无法读取" : pct(u), `≥ ${th}%`),
					ev("已提交 / 上限", commit == null ? "无法读取" : pct(commit), `≥ ${th}%`),
					ev("硬缺页", hf == null ? "无法读取" : `${hf.toFixed(0)} 次/秒`, "≥ 500 次/秒 表示在频繁换页")
				],
				cause: paging ? "内存快用完了，系统正在频繁把数据换到硬盘上，切换程序或加载时容易卡。" : "内存或提交量接近上限，继续增长可能导致程序变慢甚至崩溃。",
				suggestions: [
					"关掉占用内存最多的程序",
					"浏览器标签页开太多也会占很多内存",
					"提交量接近上限时可以把虚拟内存（页面文件）调大"
				],
				processes: topMem(s)
			};
		}
	},
	{
		id: "hard-faults",
		title: "频繁硬缺页",
		sustain: [
			20,
			15,
			10
		],
		evaluate(s, sens) {
			const hf = s.perf.hardFaultsPerSec;
			if (hf == null) return null;
			const th = pickTier([
				2e3,
				1e3,
				500
			], sens);
			const mem = s.memory.usagePercent;
			const memTight = mem != null && mem >= 80;
			return {
				hit: hf >= th,
				near: hf >= th / 2,
				current: `${hf.toFixed(0)} 次/秒`,
				threshold: `≥ ${th} 次/秒`,
				confidence: memTight ? "medium" : "low",
				evidence: [ev("硬缺页（从硬盘读回内存）", `${hf.toFixed(0)} 次/秒`, `≥ ${th} 次/秒`), ev("物理内存使用率", mem == null ? "无法读取" : pct(mem), memTight ? null : "内存不紧张时多半是程序在读文件")],
				cause: memTight ? "内存比较紧张，系统频繁从硬盘读回内存页，可能造成卡顿。" : "系统在大量从硬盘读取数据到内存。内存并不紧张，常见于游戏或软件正在加载，一般不需要处理。",
				suggestions: ["如果同时内存使用率很高，参考「内存压力过高」的建议", "如果只在加载时出现，可以忽略"],
				processes: topIo(s)
			};
		}
	},
	{
		id: "disk-latency",
		title: "磁盘响应变慢",
		sustain: [
			15,
			10,
			8
		],
		evaluate(s, sens) {
			const r = s.perf.diskReadMs;
			const w = s.perf.diskWriteMs;
			if (r == null && w == null) return null;
			const th = pickTier([
				100,
				50,
				30
			], sens);
			const lat = Math.max(r ?? 0, w ?? 0);
			const q = s.perf.diskQueue;
			return {
				hit: lat >= th && q != null && q >= 1,
				near: lat >= th / 2,
				current: `读 ${r == null ? "--" : ms(r)}，写 ${w == null ? "--" : ms(w)}，队列 ${q == null ? "--" : q.toFixed(0)}`,
				threshold: `≥ ${th} ms 且有请求在排队`,
				confidence: lat >= th * 2 ? "high" : "medium",
				evidence: [
					ev("最慢硬盘的平均读取响应", r == null ? "无法读取" : ms(r), `≥ ${th} ms`),
					ev("最慢硬盘的平均写入响应", w == null ? "无法读取" : ms(w), `≥ ${th} ms`),
					ev("磁盘队列长度", q == null ? "无法读取" : q.toFixed(0), "≥ 1"),
					ev("磁盘读写速度", `读 ${mbs(s.disk.readBytesPerSec ?? 0)}，写 ${mbs(s.disk.writeBytesPerSec ?? 0)}`)
				],
				cause: "磁盘请求在排队，每次读写要等很久，依赖硬盘的操作（打开程序、加载、保存）会变慢。",
				suggestions: [
					"看看哪个程序在大量读写（下方列表包含网络读写）",
					"后台的杀毒扫描、系统更新、下载、云盘同步常会造成这种情况",
					"在「硬件信息」里检查硬盘健康和温度"
				],
				processes: topIo(s)
			};
		}
	},
	{
		id: "disk-busy",
		title: "磁盘持续满载",
		sustain: [
			30,
			20,
			15
		],
		evaluate(s, sens) {
			const b = s.disk.busyPercent;
			if (b == null) return null;
			const th = pickTier([
				99,
				95,
				90
			], sens);
			const lat = Math.max(s.perf.diskReadMs ?? 0, s.perf.diskWriteMs ?? 0);
			const fast = lat > 0 && lat < 10;
			return {
				hit: b >= th,
				near: b >= th - 15,
				current: pct(b),
				threshold: `≥ ${th}%`,
				confidence: fast ? "low" : "medium",
				evidence: [ev("磁盘忙碌程度", pct(b), `≥ ${th}%`), ev("最慢硬盘的平均响应", lat > 0 ? ms(lat) : "无法读取", fast ? "响应仍然很快" : null)],
				cause: fast ? "磁盘一直很忙，但响应时间仍然很短。固态硬盘常见这种情况，一般不会造成卡顿。" : "磁盘一直很忙，同时响应也不快，其他程序读写硬盘时会受影响。",
				suggestions: ["看看哪个程序在大量读写", "大文件复制、下载、杀毒扫描结束后通常会恢复"],
				processes: topIo(s)
			};
		}
	},
	{
		id: "gpu-full",
		title: "显卡持续满载",
		sustain: [
			90,
			60,
			45
		],
		evaluate(s, sens) {
			const u = s.gpu.usage;
			if (u == null) return null;
			const th = pickTier([
				99,
				97,
				95
			], sens);
			return {
				hit: u >= th,
				near: u >= th - 10,
				current: pct(u),
				threshold: `≥ ${th}%`,
				confidence: "low",
				evidence: [ev("显卡占用", pct(u), `≥ ${th}%`), ev("显卡温度", s.gpu.tempC == null ? "无法读取" : `${s.gpu.tempC.toFixed(0)}°C`)],
				cause: "显卡是当前负载的瓶颈。玩游戏时这是正常现象，说明显卡在全力工作；如果帧数不够，可以降低画质或分辨率。",
				suggestions: ["游戏帧数不够时降低分辨率、阴影、光追等设置", "没有运行游戏或 3D 程序时出现，检查是否有程序在后台占用显卡"],
				processes: []
			};
		}
	},
	{
		id: "vram",
		title: "显存不足",
		sustain: [
			30,
			20,
			15
		],
		evaluate(s, sens) {
			const m = s.gpu.memPercent;
			if (m == null) return null;
			const th = pickTier([
				98,
				95,
				90
			], sens);
			const shared = s.gpu.sharedUsedBytes;
			const spilling = shared != null && shared >= 1024 ** 3;
			return {
				hit: m >= th,
				near: m >= th - 10,
				current: pct(m),
				threshold: `≥ ${th}%`,
				confidence: spilling ? "high" : "medium",
				evidence: [ev("专用显存占用", pct(m), `≥ ${th}%`), ev("共享显存（借用内存）", shared == null ? "无法读取" : `${(shared / 1024 ** 3).toFixed(1)} GB`, "≥ 1 GB 表示显存不够、借用了内存")],
				cause: spilling ? "显存用满了，显卡开始借用速度慢得多的内存，游戏里容易出现卡顿和贴图延迟。" : "显存快用满了，再增加可能会借用内存而变卡。",
				suggestions: ["降低游戏的贴图质量、分辨率", "关掉同时在用显卡的程序（浏览器硬件加速、视频播放等）"],
				processes: []
			};
		}
	},
	{
		id: "gpu-limited",
		title: "显卡被降频",
		sustain: [
			20,
			10,
			8
		],
		evaluate(s) {
			const l = s.perf.gpuLimits;
			if (!l) return null;
			const serious = l.hwThermal || l.swThermal || l.hwSlowdown || l.powerBrake;
			const u = s.gpu.usage;
			const powerOnly = l.powerCap && !serious && u != null && u >= 90;
			const reasons = [
				l.hwThermal || l.swThermal ? "温度" : null,
				l.hwSlowdown ? "硬件保护" : null,
				l.powerBrake ? "外部电源信号" : null,
				l.powerCap ? "功耗墙" : null
			].filter(Boolean);
			return {
				hit: serious || powerOnly,
				near: l.powerCap,
				current: reasons.length > 0 ? reasons.join("、") : "无",
				threshold: "温度或硬件降频；或满载时触发功耗墙",
				confidence: serious ? "high" : "low",
				evidence: [
					ev("温度降频", l.hwThermal || l.swThermal ? "是" : "否"),
					ev("硬件保护降频", l.hwSlowdown ? "是" : "否"),
					ev("功耗墙", l.powerCap ? "是" : "否"),
					ev("显卡温度", s.gpu.tempC == null ? "无法读取" : `${s.gpu.tempC.toFixed(0)}°C`)
				],
				cause: serious ? "显卡因为温度或硬件保护主动降低了频率，性能会下降。" : "显卡满载时碰到了功耗上限，这是正常设计，频率会在功耗允许范围内波动。",
				suggestions: serious ? [
					"检查显卡散热和机箱风道",
					"检查显卡供电线是否插紧",
					"在「主板与散热」里看显卡风扇"
				] : ["一般不需要处理"],
				processes: []
			};
		}
	},
	{
		id: "dpc",
		title: "驱动延迟偏高",
		sustain: [
			20,
			10,
			8
		],
		evaluate(s, sens) {
			const d = s.perf.dpcPct;
			const i = s.perf.interruptPct;
			if (d == null && i == null) return null;
			const th = pickTier([
				8,
				5,
				3
			], sens);
			const sum = (d ?? 0) + (i ?? 0);
			return {
				hit: sum >= th,
				near: sum >= th / 2,
				current: pct(sum),
				threshold: `≥ ${th}%`,
				confidence: "medium",
				evidence: [
					ev("DPC 时间", d == null ? "无法读取" : `${d.toFixed(1)}%`),
					ev("中断时间", i == null ? "无法读取" : `${i.toFixed(1)}%`),
					ev("合计", `${sum.toFixed(1)}%`, `≥ ${th}%`)
				],
				cause: "CPU 花了较多时间处理硬件驱动的请求，常见表现是音频爆音、鼠标偶尔顿一下、游戏偶发卡顿。",
				suggestions: [
					"更新显卡、网卡、声卡、主板芯片组驱动",
					"暂时断开最近新装的 USB 设备排查",
					"无线网卡在信号差时也可能造成驱动延迟"
				],
				processes: []
			};
		}
	}
];
/** 卡顿发生的同一时刻，系统里还出现了哪些异常。只是并列出来，不代表它们就是原因 */
function concurrent(s) {
	const out = [];
	const cpu = s.cpu.usage;
	const mc = maxCore(s);
	if (cpu != null && cpu >= 90) out.push(`CPU 占用 ${pct(cpu)}`);
	else if (mc && mc.usage >= 95 && cpu != null && cpu < 60) out.push(`单个核心 ${mc.label} 跑满（总占用 ${pct(cpu)}）`);
	if ((s.perf.perfLimitFlags ?? 0) !== 0 || (s.perf.perfLimitPct ?? 100) < 95) out.push("CPU 性能被限制");
	if ((s.cpu.tempC ?? 0) >= 95) out.push(`CPU 温度 ${s.cpu.tempC.toFixed(0)}°C`);
	const lat = Math.max(s.perf.diskReadMs ?? 0, s.perf.diskWriteMs ?? 0);
	if (lat >= 30 && (s.perf.diskQueue ?? 0) >= 1) out.push(`磁盘响应变慢（${ms(lat)}）`);
	const mem = Math.max(s.memory.usagePercent ?? 0, s.memory.committedBytes != null && s.memory.commitLimitBytes ? s.memory.committedBytes / s.memory.commitLimitBytes * 100 : 0);
	if (mem >= 90) out.push(`内存紧张（${pct(mem)}）`);
	if ((s.perf.hardFaultsPerSec ?? 0) >= 500) out.push(`频繁硬缺页（${s.perf.hardFaultsPerSec.toFixed(0)} 次/秒）`);
	if ((s.gpu.usage ?? 0) >= 97) out.push(`显卡占用 ${pct(s.gpu.usage)}`);
	if ((s.gpu.memPercent ?? 0) >= 95) out.push(`显存占用 ${pct(s.gpu.memPercent)}`);
	const gl = s.perf.gpuLimits;
	if (gl && (gl.hwThermal || gl.swThermal || gl.hwSlowdown || gl.powerBrake)) out.push("显卡被降频");
	if ((s.perf.dpcPct ?? 0) + (s.perf.interruptPct ?? 0) >= 3) out.push("驱动延迟偏高");
	return out;
}
var FRAME_NA = {
	off: "帧时间采集已在设置里关闭",
	idle: "等待前台出现全屏程序",
	starting: "正在启动帧时间采集",
	denied: "没有权限，见下方说明",
	missing: "找不到帧时间采集程序",
	error: "帧时间采集出错"
};
RULES.push({
	id: "frame-stutter",
	title: "画面卡顿（实测）",
	sustain: [
		4,
		2,
		1
	],
	naText: (s) => FRAME_NA[s.frames.state] ?? "前台程序没有在出画面帧",
	evaluate(s, sens) {
		const f = s.frames;
		if (f.state !== "running" || f.fps == null || f.process == null) return null;
		const th = pickTier([
			5,
			3,
			2
		], sens);
		const bigMs = pickTier([
			200,
			120,
			80
		], sens);
		const bigFrame = (f.maxMs ?? 0) >= bigMs;
		const together = concurrent(s);
		return {
			hit: f.stutters10s >= th || bigFrame,
			near: f.stutters10s >= 1,
			titleSuffix: f.process,
			current: `${f.process}${f.background ? "（后台）" : ""} ${f.fps.toFixed(0)} FPS，最近 10 秒卡顿帧 ${f.stutters10s} 个，最长一帧 ${f.maxMs == null ? "--" : ms(f.maxMs)}`,
			threshold: `10 秒内卡顿帧 ≥ ${th} 个，或单帧 ≥ ${bigMs} ms`,
			confidence: "high",
			evidence: [
				ev("程序", `${f.process}（进程 ${f.pid}${f.background ? "，当时在后台" : ""}）`),
				ev("当前帧率", `${f.fps.toFixed(0)} FPS`),
				ev("平均帧时间", f.avgMs == null ? "无法读取" : ms(f.avgMs)),
				ev("最长一帧", f.maxMs == null ? "无法读取" : ms(f.maxMs), `≥ ${bigMs} ms 算一次明显卡顿`),
				ev("最近 10 秒卡顿帧", `${f.stutters10s} 个`, `≥ ${th} 个；卡顿帧指超过 ${f.stutterThresholdMs?.toFixed(0) ?? "33"} ms 的帧`),
				ev("1% Low（最近 60 秒）", f.low1Fps == null ? "帧数太少，暂无" : `${f.low1Fps.toFixed(0)} FPS`),
				...together.map((t) => ev("同时出现", t))
			],
			cause: together.length > 0 ? `画面确实出现了卡顿（实测帧时间）。卡顿的同一时刻还出现了：${together.join("、")}。同时出现不代表一定是原因，可以逐项排查。` : "画面确实出现了卡顿（实测帧时间），但这段时间系统资源没有发现明显异常，可能是程序本身（加载、网络、优化）造成的。",
			suggestions: together.length > 0 ? ["先看「同时出现」里的项目，按它们各自的建议排查", "点「在历史中回放」，对照卡顿前后各项指标的曲线"] : ["看看卡顿是否总发生在同一场景（加载新区域、联机波动等）", "更新显卡驱动，检查游戏是否有已知的卡顿问题"],
			processes: [...topCpu(s), ...topIo(s)].slice(0, 4)
		};
	}
});
var titleOf = (rule, r) => r.titleSuffix ? `${rule.title} · ${r.titleSuffix}` : rule.title;
var sustainMs = (r, s) => pickTier(r.sustain, s) * 1e3;
