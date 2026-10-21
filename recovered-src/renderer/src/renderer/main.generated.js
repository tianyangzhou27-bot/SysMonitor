// GENERATED FRAGMENT — extracted from out/renderer/assets/index-CzIv0K4n.js, lines 26281-26285.
// Original module marker: src/renderer/main.tsx. Not the original TypeScript/TSX source.
// Depends on bundle-level imports, globals, and other fragments; not standalone.
async function boot() {
	const isTaskbar = window.location.hash === "#/taskbar";
	(0, import_client.createRoot)(document.getElementById("root")).render(/* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react.StrictMode, { children: isTaskbar ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TaskbarApp, {}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(App, {}) }));
}
boot();
