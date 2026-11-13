//#region src/main/collectors/power.ts
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
//#endregion
