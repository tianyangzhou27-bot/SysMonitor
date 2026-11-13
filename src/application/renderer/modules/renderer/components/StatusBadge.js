//#region src/renderer/components/StatusBadge.tsx
function StatusBadge({ level }) {
	if (level === "none") return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
		className: `badge is-${level}`,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", {}), LEVEL_LABEL[level]]
	});
}
//#endregion
