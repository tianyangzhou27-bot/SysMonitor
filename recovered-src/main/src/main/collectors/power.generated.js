// GENERATED FRAGMENT — extracted from out/main/index.js, lines 2307-2323.
// Original module marker: src/main/collectors/power.ts. Not the original TypeScript/TSX source.
// Depends on bundle-level imports, globals, and other fragments; not standalone.
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
