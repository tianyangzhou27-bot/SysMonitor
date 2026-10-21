// GENERATED FRAGMENT — extracted from out/main/index.js, lines 384-427.
// Original module marker: src/main/collectors/cpuInfo.ts. Not the original TypeScript/TSX source.
// Depends on bundle-level imports, globals, and other fragments; not standalone.
var HYBRID_TABLE = [
	{
		match: /\b1[34]9\d\d/,
		p: 8,
		e: 16
	},
	{
		match: /\b14700/,
		p: 8,
		e: 12
	},
	{
		match: /\b13700/,
		p: 8,
		e: 8
	},
	{
		match: /\b1[34]600/,
		p: 6,
		e: 8
	}
];
async function readCpuInfo() {
	const list = (0, os.cpus)();
	const model = (list[0]?.model ?? "CPU").trim();
	const c = await systeminformation.cpu();
	let p = c.performanceCores && c.performanceCores > 0 ? c.performanceCores : null;
	let e = c.efficiencyCores && c.efficiencyCores > 0 ? c.efficiencyCores : null;
	if (p == null || e == null) {
		const hit = HYBRID_TABLE.find((h) => h.match.test(model));
		if (hit) {
			p = hit.p;
			e = hit.e;
		}
	}
	return {
		model,
		physicalCores: c.physicalCores || list.length,
		logicalCores: list.length,
		baseGHz: c.speed > 0 ? c.speed : null,
		pCores: p,
		eCores: e
	};
}
