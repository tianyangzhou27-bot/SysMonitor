// GENERATED FRAGMENT — extracted from out/main/index.js, lines 75-177.
// Original module marker: src/shared/cooling.ts. Not the original TypeScript/TSX source.
// Depends on bundle-level imports, globals, and other fragments; not standalone.
var GROUP_KEYS = [
	"cpu",
	"case",
	"gpu"
];
var GROUP_TEXT = {
	cpu: "CPU 风扇",
	case: "机箱风扇",
	gpu: "显卡风扇"
};
var FLOOR_PCT = {
	cpu: 30,
	case: 20,
	gpu: 30
};
var EMERGENCY_C = {
	cpu: 90,
	gpu: 85
};
function defaultGroups() {
	const levels = (froms, pcts) => froms.map((from, i) => ({
		from,
		pct: pcts[i]
	}));
	return {
		cpu: {
			mode: "bios",
			manualLevel: 3,
			levels: levels([
				0,
				50,
				60,
				70,
				80
			], [
				30,
				45,
				60,
				80,
				100
			])
		},
		case: {
			mode: "bios",
			manualLevel: 3,
			levels: levels([
				0,
				50,
				60,
				70,
				80
			], [
				25,
				40,
				55,
				75,
				100
			])
		},
		gpu: {
			mode: "bios",
			manualLevel: 3,
			levels: levels([
				0,
				50,
				60,
				70,
				78
			], [
				null,
				40,
				55,
				75,
				100
			])
		}
	};
}
function defaultCooling() {
	return {
		roles: {},
		names: {},
		spun: [],
		groups: defaultGroups(),
		acked: {
			cpu: false,
			case: false,
			gpu: false
		}
	};
}
var ROLE_TEXT = {
	cpu: "CPU 风扇",
	case: "机箱风扇",
	pump: "水泵",
	none: "未接",
	unset: "未指定"
};
/** 界面和告警里对一个风扇的称呼：已指定用途就用用途，否则用传感器名称 */
function fanLabel(f) {
	const base = f.source === "gpu" ? `显卡 ${f.name}` : `主板 ${f.name}`;
	return f.role === "unset" || f.role === "none" ? base : `${ROLE_TEXT[f.role]}（${base}）`;
}
