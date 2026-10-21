// GENERATED FRAGMENT — extracted from out/main/index.js, lines 850-1066.
// Original module marker: src/main/collectors/hardware.ts. Not the original TypeScript/TSX source.
// Depends on bundle-level imports, globals, and other fragments; not standalone.
var COMMAND = "[Console]::OutputEncoding=[System.Text.Encoding]::UTF8;ConvertTo-Json -InputObject @(Get-CimInstance Win32_PhysicalMemory | Select-Object BankLabel,DeviceLocator,Capacity,Speed,ConfiguredClockSpeed,Manufacturer,PartNumber,SMBIOSMemoryType) -Compress";
var DEVICES_COMMAND = [
	"$ErrorActionPreference='SilentlyContinue'",
	"[Console]::OutputEncoding=[System.Text.Encoding]::UTF8",
	"function S($a){ if($null -eq $a){return $null}; (@($a | Where-Object { $_ -ne 0 } | ForEach-Object { [char]$_ }) -join '') }",
	"$bb=Get-CimInstance Win32_BaseBoard | Select-Object -First 1",
	"$bi=Get-CimInstance Win32_BIOS | Select-Object -First 1",
	"$cs=Get-CimInstance Win32_ComputerSystem | Select-Object -First 1",
	"$sz=@{}",
	"Get-CimInstance -Namespace root/wmi -ClassName WmiMonitorBasicDisplayParams | ForEach-Object { $sz[$_.InstanceName]=@($_.MaxHorizontalImageSize,$_.MaxVerticalImageSize) }",
	"$mons=@(Get-CimInstance -Namespace root/wmi -ClassName WmiMonitorID | ForEach-Object { $d=$sz[$_.InstanceName]; @{ code=(S $_.ManufacturerName); model=(S $_.UserFriendlyName); serial=(S $_.SerialNumberID); year=$_.YearOfManufacture; wcm=$d[0]; hcm=$d[1] } })",
	"$disks=@(Get-PhysicalDisk | ForEach-Object { @{ id=$_.DeviceId; model=$_.FriendlyName; media=[string]$_.MediaType; bus=[string]$_.BusType; size=$_.Size; fw=$_.FirmwareVersion; health=[string]$_.HealthStatus; serial=$_.SerialNumber } })",
	"$date=$null; if($bi.ReleaseDate){ $date=$bi.ReleaseDate.ToString('yyyy-MM-dd') }",
	"ConvertTo-Json -Depth 4 -Compress -InputObject @{ board=@{ vendor=$bb.Manufacturer; model=$bb.Product; version=$bb.Version; serial=$bb.SerialNumber; biosVendor=$bi.Manufacturer; biosVersion=$bi.SMBIOSBIOSVersion; biosDate=$date; systemModel=$cs.Model }; monitors=$mons; disks=$disks }"
].join("\n");
var MEMORY_TYPES = {
	24: "DDR3",
	26: "DDR4",
	34: "DDR5"
};
var MONITOR_BRANDS = {
	AUS: "ASUS 华硕",
	ACI: "ASUS 华硕",
	GSM: "LG",
	SAM: "Samsung 三星",
	DEL: "Dell 戴尔",
	AOC: "AOC",
	BNQ: "BenQ 明基",
	ACR: "Acer 宏碁",
	LEN: "Lenovo 联想",
	HWP: "HP",
	HPN: "HP",
	MSI: "MSI 微星",
	GBT: "Gigabyte 技嘉",
	PHL: "Philips 飞利浦",
	VSC: "ViewSonic 优派",
	SNY: "Sony 索尼",
	HKC: "HKC",
	KOG: "KOGAN",
	MEI: "Panasonic 松下",
	SHP: "Sharp 夏普",
	NEC: "NEC",
	EIZ: "EIZO",
	HSD: "Hannspree",
	CMN: "奇美 Chimei",
	BOE: "京东方 BOE",
	AUO: "友达 AUO"
};
var DISK_BRANDS = [
	[/^samsung|^mz/i, "Samsung 三星"],
	[/^zhitai|^ti\d{3}/i, "ZHITAI 致态"],
	[/^wdc|^wd[ _]|^western digital|^sandisk/i, "Western Digital / SanDisk"],
	[/^seagate|^st\d/i, "Seagate 希捷"],
	[/^kingston|^sa\d|^snv|^skc/i, "Kingston 金士顿"],
	[/^crucial|^ct\d/i, "Crucial 英睿达"],
	[/^sk ?hynix|^hfs/i, "SK hynix"],
	[/^intel/i, "Intel"],
	[/^toshiba|^kioxia|^kxg/i, "Toshiba / KIOXIA"],
	[/^micron/i, "Micron 美光"],
	[/^adata|^asu|^xpg/i, "ADATA 威刚"],
	[/^lexar/i, "Lexar 雷克沙"],
	[/^colorful/i, "Colorful 七彩虹"],
	[/^gigabyte|^gp-/i, "Gigabyte 技嘉"],
	[/^corsair/i, "Corsair 海盗船"],
	[/^netac/i, "Netac 朗科"],
	[/^pny/i, "PNY"],
	[/^sabrent/i, "Sabrent"]
];
var PLACEHOLDER = /^(system product name|to be filled.*|default string|o\.e\.m\.?|system version|not applicable|none|unknown|0)$/i;
var text = (v) => {
	const s = typeof v === "string" ? v.trim() : "";
	return s && !/^(unknown|undefined|0)$/i.test(s) ? s : null;
};
var mts = (v) => typeof v === "number" && v > 0 ? v : null;
var real = (v) => {
	const s = text(v);
	return s && !PLACEHOLDER.test(s) ? s : null;
};
var list = (v) => Array.isArray(v) ? v : v && typeof v === "object" ? [v] : [];
function diskKind(media, bus) {
	if (/nvme/i.test(bus)) return "NVMe 固态硬盘";
	if (/ssd/i.test(media)) return /sata/i.test(bus) ? "SATA 固态硬盘" : "固态硬盘";
	if (/hdd/i.test(media)) return "机械硬盘";
	if (/usb/i.test(bus)) return "USB 存储";
	return bus || media || "未知类型";
}
var HEALTH = {
	healthy: "健康",
	warning: "警告",
	unhealthy: "异常"
};
var HardwareCollector = class {
	memory = null;
	board = null;
	monitors = [];
	disks = [];
	gpu = null;
	devicesRead = false;
	retry = null;
	stopped = false;
	async start() {
		await Promise.all([
			this.readMemory(),
			this.readDevices(),
			this.gpu ? Promise.resolve() : readGpuInfo().then((g) => this.gpu = g).catch(() => void 0)
		]);
		if ((!this.memory || !this.devicesRead) && !this.stopped) this.retry = setTimeout(() => void this.start(), 6e4);
	}
	stop() {
		this.stopped = true;
		if (this.retry) clearTimeout(this.retry);
	}
	get() {
		return {
			memory: this.memory,
			gpu: this.gpu,
			board: this.board,
			monitors: this.withDisplay(this.monitors),
			disks: this.disks,
			uptimeSec: Math.floor((0, os.uptime)())
		};
	}
	withDisplay(mons) {
		const displays = electron.screen.getAllDisplays();
		const only = mons.length === 1 && displays.length === 1 ? displays[0] : null;
		return mons.map((m) => ({
			...m,
			resolution: only ? `${Math.round(only.size.width * only.scaleFactor)} × ${Math.round(only.size.height * only.scaleFactor)}` : null,
			refreshHz: only && only.displayFrequency > 0 ? Math.round(only.displayFrequency) : null
		}));
	}
	async readDevices() {
		const { out, code } = await runCapture("powershell.exe", [
			"-NoProfile",
			"-NonInteractive",
			"-ExecutionPolicy",
			"Bypass",
			"-Command",
			DEVICES_COMMAND
		], 3e4);
		if (code !== 0) return;
		try {
			const raw = JSON.parse(out.toString("utf8").trim());
			const b = raw.board ?? {};
			this.board = {
				vendor: text(b.vendor),
				model: text(b.model),
				version: real(b.version),
				serial: real(b.serial),
				biosVendor: text(b.biosVendor),
				biosVersion: text(b.biosVersion),
				biosDate: text(b.biosDate),
				systemModel: real(b.systemModel)
			};
			this.monitors = list(raw.monitors).map((m) => {
				const w = Number(m.wcm ?? 0);
				const h = Number(m.hcm ?? 0);
				const code3 = text(m.code);
				const year = Number(m.year ?? 0);
				return {
					brand: code3 ? MONITOR_BRANDS[code3.toUpperCase()] ?? code3 : null,
					model: text(m.model),
					serial: real(m.serial),
					year: year > 1990 ? year : null,
					inches: w > 0 && h > 0 ? Math.round(Math.hypot(w, h) / 2.54) : null
				};
			});
			this.disks = list(raw.disks).map((d) => {
				const model = text(d.model);
				const media = typeof d.media === "string" ? d.media : "";
				const bus = typeof d.bus === "string" ? d.bus : "";
				const health = text(d.health);
				const serial = text(d.serial);
				const id = Number(d.id);
				return {
					deviceId: d.id != null && d.id !== "" && Number.isInteger(id) ? id : null,
					brand: model ? DISK_BRANDS.find(([re]) => re.test(model))?.[1] ?? model.split(/\s+/)[0] : null,
					model,
					kind: diskKind(media, bus),
					sizeBytes: Number(d.size ?? 0),
					firmware: text(d.fw),
					health: health ? HEALTH[health.toLowerCase()] ?? health : null,
					serial: serial ? serial.replace(/[.\s]+$/, "") : null
				};
			}).filter((d) => d.sizeBytes > 0);
			this.devicesRead = true;
		} catch {}
	}
	async readMemory() {
		const { out, code } = await runCapture("powershell.exe", [
			"-NoProfile",
			"-NonInteractive",
			"-ExecutionPolicy",
			"Bypass",
			"-Command",
			COMMAND
		], 2e4);
		if (code !== 0) return;
		try {
			const raw = JSON.parse(out.toString("utf8").trim());
			if (raw.length === 0) return;
			const modules = raw.map((r) => ({
				slot: text(r.DeviceLocator) ?? text(r.BankLabel) ?? "--",
				capacityBytes: Number(r.Capacity ?? 0),
				ratedMTs: mts(r.Speed),
				configuredMTs: mts(r.ConfiguredClockSpeed),
				manufacturer: text(r.Manufacturer),
				partNumber: text(r.PartNumber)
			}));
			const type = MEMORY_TYPES[Number(raw[0].SMBIOSMemoryType)] ?? null;
			this.memory = {
				type,
				modules
			};
		} catch {}
	}
};
