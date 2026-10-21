// GENERATED FRAGMENT — extracted from out/renderer/assets/index-CzIv0K4n.js, lines 17488-17623.
// Original module marker: src/renderer/lib/layout.ts. Not the original TypeScript/TSX source.
// Depends on bundle-level imports, globals, and other fragments; not standalone.
var import_client = require_client();
var CARD_IDS = [
	"cpu",
	"gpu",
	"mem",
	"power",
	"net",
	"proxy",
	"proc",
	"speed",
	"disk",
	"quality",
	"hw",
	"cooling",
	"diag"
];
var BREAKPOINTS = {
	lg: 1050,
	md: 700,
	sm: 0
};
var COLS = {
	lg: 12,
	md: 8,
	sm: 4
};
var STORAGE_KEY$1 = "sysmonitor.layouts.v1";
function breakpointOf(width) {
	return width >= BREAKPOINTS.lg ? "lg" : width >= BREAKPOINTS.md ? "md" : "sm";
}
var MIN_H = 4;
var MAX_H = 40;
function item(i, x, y, w, h) {
	return {
		i,
		x,
		y,
		w,
		h,
		minW: 2,
		minH: MIN_H,
		maxH: MAX_H
	};
}
var DEFAULT_LAYOUTS = {
	lg: [
		item("cpu", 0, 0, 3, 4),
		item("gpu", 3, 0, 3, 4),
		item("mem", 6, 0, 3, 4),
		item("power", 9, 0, 3, 4),
		item("net", 0, 4, 6, 10),
		item("proxy", 6, 4, 6, 14),
		item("proc", 0, 14, 6, 10),
		item("speed", 6, 18, 6, 9),
		item("disk", 0, 24, 6, 6),
		item("quality", 6, 27, 6, 10),
		item("hw", 0, 30, 6, 8),
		item("cooling", 6, 37, 6, 8),
		item("diag", 0, 38, 6, 6)
	],
	md: [
		item("cpu", 0, 0, 4, 4),
		item("gpu", 4, 0, 4, 4),
		item("mem", 0, 4, 4, 4),
		item("power", 4, 4, 4, 4),
		item("net", 0, 8, 8, 10),
		item("proxy", 0, 18, 8, 14),
		item("proc", 0, 32, 8, 10),
		item("speed", 0, 42, 8, 9),
		item("disk", 0, 51, 8, 6),
		item("quality", 0, 57, 8, 10),
		item("hw", 0, 67, 8, 8),
		item("cooling", 0, 75, 8, 8),
		item("diag", 0, 83, 8, 6)
	],
	sm: [
		item("cpu", 0, 0, 4, 4),
		item("gpu", 0, 4, 4, 4),
		item("mem", 0, 8, 4, 4),
		item("power", 0, 12, 4, 4),
		item("net", 0, 16, 4, 10),
		item("proxy", 0, 26, 4, 14),
		item("proc", 0, 40, 4, 10),
		item("speed", 0, 50, 4, 9),
		item("disk", 0, 59, 4, 6),
		item("quality", 0, 65, 4, 10),
		item("hw", 0, 75, 4, 8),
		item("cooling", 0, 83, 4, 8),
		item("diag", 0, 91, 4, 6)
	]
};
var finite = (n) => typeof n === "number" && Number.isFinite(n);
function normalize(list, bp) {
	const defaults = DEFAULT_LAYOUTS[bp];
	const items = [];
	if (Array.isArray(list)) for (const d of defaults) {
		const saved = list.find((x) => x?.i === d.i);
		if (saved && finite(saved.x) && finite(saved.y) && finite(saved.w) && finite(saved.h)) items.push({
			...d,
			x: saved.x,
			y: saved.y,
			w: saved.w,
			h: saved.h
		});
	}
	if (items.length === 0) return defaults;
	let bottom = items.reduce((m, it) => Math.max(m, it.y + it.h), 0);
	for (const d of defaults) {
		if (items.some((it) => it.i === d.i)) continue;
		items.push({
			...d,
			x: 0,
			y: bottom
		});
		bottom += d.h;
	}
	return items;
}
function loadLayouts() {
	try {
		const raw = JSON.parse(localStorage.getItem(STORAGE_KEY$1) ?? "null");
		return {
			lg: normalize(raw?.lg, "lg"),
			md: normalize(raw?.md, "md"),
			sm: normalize(raw?.sm, "sm")
		};
	} catch {
		return DEFAULT_LAYOUTS;
	}
}
function saveLayouts(layouts) {
	localStorage.setItem(STORAGE_KEY$1, JSON.stringify(layouts));
}
function clearLayouts() {
	localStorage.removeItem(STORAGE_KEY$1);
}
