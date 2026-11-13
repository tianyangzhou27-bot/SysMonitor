//#region src/renderer/main.tsx
async function boot() {
	const isTaskbar = window.location.hash === "#/taskbar";
	(0, import_client.createRoot)(document.getElementById("root")).render(/* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react.StrictMode, { children: isTaskbar ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TaskbarApp, {}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(App, {}) }));
}
boot();
//#endregion
