// GENERATED FRAGMENT — extracted from out/main/index.js, lines 2337-2353.
// Original module marker: src/main/collectors/power.ts. Not original TypeScript/TSX; not standalone.
function computePower(cpuW, gpuW, otherW, wall) {
	const measured = wall?.getWatts() ?? null;
	if (wall && measured != null) return {
		totalW: measured,
		cpuW,
		gpuW,
		otherW,
		source: "smart-plug"
	};
	return {
		totalW: cpuW == null ? null : cpuW + (gpuW ?? 0) + otherW,
		cpuW,
		gpuW,
		otherW,
		source: "estimate"
	};
}
