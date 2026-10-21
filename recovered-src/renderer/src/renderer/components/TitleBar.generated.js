// GENERATED FRAGMENT — extracted from out/renderer/assets/index-CzIv0K4n.js, lines 25799-25915.
// Original module marker: src/renderer/components/TitleBar.tsx. Not the original TypeScript/TSX source.
// Depends on bundle-level imports, globals, and other fragments; not standalone.
var THEME_META = {
	system: {
		icon: Monitor,
		label: "主题：跟随系统"
	},
	light: {
		icon: Sun,
		label: "主题：浅色"
	},
	dark: {
		icon: Moon,
		label: "主题：深色"
	}
};
function TitleBar({ themeMode, onCycleTheme, onFitLayout, onResetLayout, taskbarOn, onToggleTaskbar, onOpenSettings, onOpenHistory }) {
	const [maximized, setMaximized] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		window.api.win.isMaximized().then(setMaximized);
		return window.api.win.onMaximizedChange(setMaximized);
	}, []);
	const ThemeIcon = THEME_META[themeMode].icon;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
		className: "titlebar",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "titlebar__brand",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppLogo, { size: 22 }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "SysMonitor" })]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "titlebar__controls",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					className: taskbarOn ? "is-active" : "",
					"aria-label": taskbarOn ? "关闭任务栏显示" : "在任务栏显示",
					"aria-pressed": taskbarOn,
					title: taskbarOn ? "关闭任务栏显示" : "在任务栏显示",
					onClick: onToggleTaskbar,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PanelBottom, {
						size: 16,
						strokeWidth: 1.75
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					"aria-label": "历史记录",
					title: "历史记录",
					onClick: onOpenHistory,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcwClock, {
						size: 16,
						strokeWidth: 1.75
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					"aria-label": "设置",
					title: "设置",
					onClick: onOpenSettings,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Settings, {
						size: 16,
						strokeWidth: 1.75
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					"aria-label": "卡片高度自适应内容",
					title: "卡片高度自适应内容",
					onClick: onFitLayout,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronsUpDown, {
						size: 16,
						strokeWidth: 1.75
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					"aria-label": "重置布局",
					title: "重置布局",
					onClick: onResetLayout,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, {
						size: 15,
						strokeWidth: 1.75
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					"aria-label": THEME_META[themeMode].label,
					title: THEME_META[themeMode].label,
					onClick: onCycleTheme,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ThemeIcon, {
						size: 16,
						strokeWidth: 1.75
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					"aria-label": "最小化",
					onClick: () => window.api.win.minimize(),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Minus, {
						size: 16,
						strokeWidth: 1.75
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					"aria-label": maximized ? "还原" : "最大化",
					onClick: () => window.api.win.toggleMaximize(),
					children: maximized ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, {
						size: 13,
						strokeWidth: 1.75
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Square, {
						size: 13,
						strokeWidth: 1.75
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					className: "is-close",
					"aria-label": "关闭",
					onClick: () => window.api.win.close(),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, {
						size: 17,
						strokeWidth: 1.75
					})
				})
			]
		})]
	});
}
