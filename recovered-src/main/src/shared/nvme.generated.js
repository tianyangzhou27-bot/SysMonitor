// GENERATED FRAGMENT — extracted from out/main/index.js, lines 180-192.
// Original module marker: src/shared/nvme.ts. Not the original TypeScript/TSX source.
// Depends on bundle-level imports, globals, and other fragments; not standalone.
var BITS = [
	[1, "可用备用空间低于阈值"],
	[2, "温度超出阈值"],
	[4, "可靠性下降（介质或内部错误）"],
	[8, "已变为只读"],
	[16, "易失性数据备份失败"],
	[32, "持久内存区变为只读"]
];
function describeCriticalWarning(bits) {
	if (bits === 0) return "无";
	const parts = BITS.filter(([mask]) => (bits & mask) !== 0).map(([, text]) => text);
	return parts.length > 0 ? parts.join("；") : `未知标志 0x${bits.toString(16)}`;
}
