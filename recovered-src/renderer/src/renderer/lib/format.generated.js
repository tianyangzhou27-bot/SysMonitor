// GENERATED FRAGMENT — extracted from out/renderer/assets/index-CzIv0K4n.js, lines 17689-17734.
// Original module marker: src/renderer/lib/format.ts. Not the original TypeScript/TSX source.
// Depends on bundle-level imports, globals, and other fragments; not standalone.
var GB$2 = 1024 ** 3;
function formatGB(bytes, digits = 1) {
	return bytes == null ? "--" : (bytes / GB$2).toFixed(digits);
}
function formatRate(bytesPerSec) {
	if (bytesPerSec == null) return "--";
	if (bytesPerSec >= 1024 ** 2) return `${(bytesPerSec / 1024 ** 2).toFixed(1)} MB/s`;
	return `${(bytesPerSec / 1024).toFixed(0)} KB/s`;
}
function rateParts(bytesPerSec) {
	if (bytesPerSec == null) return {
		value: null,
		unit: "KB/s",
		decimals: 0
	};
	if (bytesPerSec >= 1024 ** 2) {
		const v = bytesPerSec / 1024 ** 2;
		return {
			value: v,
			unit: "MB/s",
			decimals: v >= 100 ? 0 : v >= 10 ? 1 : 2
		};
	}
	const v = bytesPerSec / 1024;
	return {
		value: v,
		unit: "KB/s",
		decimals: v >= 100 ? 0 : 1
	};
}
function formatMbps(bytesPerSec) {
	return bytesPerSec == null ? "--" : `${(bytesPerSec * 8 / 1e6).toFixed(1)} Mbps`;
}
function formatMs(ms) {
	return ms == null ? "--" : `${ms} ms`;
}
function formatMB(bytes) {
	return bytes == null ? "--" : `${Math.round(bytes / 1024 ** 2)} MB`;
}
function shortGpuName(name) {
	return name ? name.replace(/^NVIDIA\s+GeForce\s+/i, "").trim() : "GPU";
}
function shortCpuName(model) {
	if (!model) return "CPU";
	return model.replace(/\((R|TM)\)/g, "").replace(/^\s*Intel\s+Core\s+/i, "").replace(/\s+/g, " ").trim();
}
