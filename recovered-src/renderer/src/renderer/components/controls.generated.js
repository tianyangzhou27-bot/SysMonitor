// GENERATED FRAGMENT — extracted from out/renderer/assets/index-CzIv0K4n.js, lines 18480-18526.
// Original module marker: src/renderer/components/controls.tsx. Not the original TypeScript/TSX source.
// Depends on bundle-level imports, globals, and other fragments; not standalone.
function Toggle({ checked, onChange, disabled }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		role: "switch",
		"aria-checked": checked,
		disabled,
		className: `toggle ${checked ? "is-on" : ""}`,
		onClick: () => onChange(!checked),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", {})
	});
}
function NumberField({ value, min, max, unit, onCommit }) {
	const [text, setText] = (0, import_react.useState)(String(value));
	(0, import_react.useEffect)(() => setText(String(value)), [value]);
	const commit = () => {
		const n = Number(text);
		if (!Number.isFinite(n) || text.trim() === "") {
			setText(String(value));
			return;
		}
		const clamped = Math.min(max, Math.max(min, Math.round(n)));
		setText(String(clamped));
		if (clamped !== value) onCommit(clamped);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: "numfield",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
			value: text,
			inputMode: "numeric",
			onChange: (e) => setText(e.target.value),
			onBlur: commit,
			onKeyDown: (e) => e.key === "Enter" && e.currentTarget.blur()
		}), unit && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: unit })]
	});
}
function Row$2({ label, hint, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "srow",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "srow__text",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: label }), hint && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: hint })]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "srow__ctl",
			children
		})]
	});
}
