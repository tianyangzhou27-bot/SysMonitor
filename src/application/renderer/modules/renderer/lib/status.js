//#region src/renderer/lib/status.ts
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
//#endregion
