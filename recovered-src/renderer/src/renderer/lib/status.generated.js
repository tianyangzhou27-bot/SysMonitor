// GENERATED FRAGMENT — extracted from out/renderer/assets/index-CzIv0K4n.js, lines 17737-17748.
// Original module marker: src/renderer/lib/status.ts. Not the original TypeScript/TSX source.
// Depends on bundle-level imports, globals, and other fragments; not standalone.
var LEVEL_LABEL = {
	ok: "正常",
	warn: "偏高",
	danger: "告警",
	none: ""
};
function levelOf(value, warn, danger) {
	if (value == null) return "none";
	if (value >= danger) return "danger";
	if (value >= warn) return "warn";
	return "ok";
}
