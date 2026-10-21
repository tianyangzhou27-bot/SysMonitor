// GENERATED FRAGMENT — extracted from out/main/index.js, lines 691-847.
// Original module marker: src/main/collectors/gpuInfo.ts. Not the original TypeScript/TSX source.
// Depends on bundle-level imports, globals, and other fragments; not standalone.
var SMI_FIELDS = [
	"name",
	"driver_version",
	"vbios_version",
	"pci.device_id",
	"pci.sub_device_id",
	"memory.total",
	"clocks.max.graphics",
	"clocks.max.memory",
	"power.default_limit",
	"power.max_limit",
	"power.min_limit",
	"pcie.link.gen.max",
	"pcie.link.width.max",
	"compute_cap"
];
var SUBSYSTEM_VENDORS = {
	"1043": "ASUS 华硕",
	"1458": "Gigabyte 技嘉",
	"1462": "MSI 微星",
	"3842": "EVGA",
	"19DA": "ZOTAC 索泰",
	"1569": "Palit 同德",
	"10B0": "Gainward 耕升",
	"196E": "PNY",
	"1B4C": "Galax / KFA2 影驰",
	"7377": "Colorful 七彩虹",
	"107D": "Leadtek 丽台",
	"10DE": "NVIDIA（公版）"
};
var RAM_TYPES = {
	8: "GDDR5",
	10: "GDDR5X",
	14: "GDDR6",
	15: "GDDR6X"
};
var ARCH_RATIO = {
	"Ada Lovelace": {
		cudaPerSm: 128,
		tensorPerSm: 4,
		rt: true
	},
	Ampere: {
		cudaPerSm: 128,
		tensorPerSm: 4,
		rt: true
	},
	Blackwell: {
		cudaPerSm: 128,
		tensorPerSm: 4,
		rt: true
	},
	Turing: {
		cudaPerSm: 64,
		tensorPerSm: 8,
		rt: true
	}
};
var num$2 = (s) => {
	const n = Number((s ?? "").trim());
	return s && s.trim() !== "" && Number.isFinite(n) ? n : null;
};
/** 解析 0x278210DE 这样的 PCI 编号：低 16 位是厂商，高 16 位是设备 */
function splitPciId(raw) {
	const m = /^0x([0-9a-f]{8})$/i.exec((raw ?? "").trim());
	if (!m) return null;
	return {
		vendor: m[1].slice(4).toUpperCase(),
		device: m[1].slice(0, 4).toUpperCase()
	};
}
function parseSmiCsv(line) {
	const parts = line.trim().split(/,\s*/);
	const out = {};
	SMI_FIELDS.forEach((f, i) => {
		const v = parts[i];
		if (v != null && !/^\[?(N\/A|Not Supported)\]?$/i.test(v)) out[f] = v;
	});
	return out;
}
function parseSmiQuery(text) {
	const pick = (re) => {
		const v = re.exec(text)?.[1].trim();
		return v && !/^N\/A$/i.test(v) ? v : null;
	};
	return {
		architecture: pick(/Product Architecture\s*:\s*(.+)/),
		partNumber: pick(/GPU Part Number\s*:\s*(.+)/),
		cuda: pick(/CUDA UMD Version\s*:\s*(.+)/) ?? pick(/CUDA Version\s*:\s*(\S+)/)
	};
}
function buildGpuInfo(csv, q, api) {
	if (!csv["name"]) return null;
	const chip = splitPciId(csv["pci.device_id"]);
	const sub = splitPciId(csv["pci.sub_device_id"]);
	const arch = q.architecture;
	const cores = api.cores && api.cores > 0 ? api.cores : null;
	const ratio = arch ? ARCH_RATIO[arch] : void 0;
	const sm = cores && ratio ? Math.round(cores / ratio.cudaPerSm) : null;
	const memoryType = api.ram != null ? RAM_TYPES[api.ram] ?? null : null;
	const bus = api.bus && api.bus > 0 ? api.bus : null;
	const maxMem = num$2(csv["clocks.max.memory"]);
	const gbps = memoryType && maxMem ? maxMem * 2 / 1e3 : null;
	return {
		name: csv["name"],
		architecture: arch,
		vendor: sub ? SUBSYSTEM_VENDORS[sub.vendor] ?? `厂商编号 ${sub.vendor}` : null,
		chipId: chip ? `${chip.vendor}:${chip.device}` : null,
		subsystemId: sub ? `${sub.vendor}:${sub.device}` : null,
		partNumber: q.partNumber,
		cudaCores: cores,
		smCount: sm,
		tensorCores: sm && ratio ? sm * ratio.tensorPerSm : null,
		rtCores: sm && ratio?.rt ? sm : null,
		memoryMiB: num$2(csv["memory.total"]),
		memoryType,
		busWidthBits: bus,
		memoryGbps: gbps,
		bandwidthGBs: bus && gbps ? bus * gbps / 8 : null,
		maxBoostMHz: num$2(csv["clocks.max.graphics"]),
		maxMemoryMHz: maxMem,
		powerDefaultW: num$2(csv["power.default_limit"]),
		powerMaxW: num$2(csv["power.max_limit"]),
		powerMinW: num$2(csv["power.min_limit"]),
		pcieMaxGen: num$2(csv["pcie.link.gen.max"]),
		pcieMaxWidth: num$2(csv["pcie.link.width.max"]),
		computeCapability: csv["compute_cap"] ?? null,
		driverVersion: csv["driver_version"] ?? null,
		cudaVersion: q.cuda,
		vbios: csv["vbios_version"] ?? null
	};
}
function scriptPath$1() {
	return electron.app.isPackaged ? (0, path.join)(process.resourcesPath, "gpu-nvapi.ps1") : (0, path.join)(electron.app.getAppPath(), "resources", "gpu-nvapi.ps1");
}
/** 只读一次的 NVIDIA 显卡规格；不是 NVIDIA 显卡或读取失败时返回 null */
async function readGpuInfo() {
	const csvRun = await runCapture("nvidia-smi", [`--query-gpu=${SMI_FIELDS.join(",")}`, "--format=csv,noheader,nounits"], 1e4);
	if (csvRun.code !== 0) return null;
	const line = csvRun.out.toString("utf8").split(/\r?\n/).find((l) => l.trim());
	if (!line) return null;
	const [qRun, apiRun] = await Promise.all([runCapture("nvidia-smi", ["-q"], 15e3), runCapture("powershell.exe", [
		"-NoProfile",
		"-NonInteractive",
		"-ExecutionPolicy",
		"Bypass",
		"-File",
		scriptPath$1()
	], 2e4)]);
	let api = {};
	try {
		api = JSON.parse(apiRun.out.toString("utf8").trim().split(/\r?\n/).pop() ?? "{}");
	} catch {
		api = {};
	}
	return buildGpuInfo(parseSmiCsv(line), parseSmiQuery(qRun.out.toString("utf8")), api);
}
