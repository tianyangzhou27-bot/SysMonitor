// GENERATED FRAGMENT — extracted from out/renderer/assets/index-CzIv0K4n.js, lines 24175-24181.
// Original module marker: src/renderer/components/StatusBadge.tsx. Not the original TypeScript/TSX source.
// Depends on bundle-level imports, globals, and other fragments; not standalone.
function StatusBadge({ level }) {
	if (level === "none") return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
		className: `badge is-${level}`,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", {}), LEVEL_LABEL[level]]
	});
}
