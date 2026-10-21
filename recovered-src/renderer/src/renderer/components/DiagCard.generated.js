// GENERATED FRAGMENT — extracted from out/renderer/assets/index-CzIv0K4n.js, lines 18161-18251.
// Original module marker: src/renderer/components/DiagCard.tsx. Not the original TypeScript/TSX source.
// Depends on bundle-level imports, globals, and other fragments; not standalone.
var HOUR = 36e5;
function DiagCard({ diag, frames, onOpenDetail }) {
	const down = (0, import_react.useRef)(null);
	const [recent, setRecent] = (0, import_react.useState)([]);
	const activeKey = diag?.active.map((a) => a.rule).join(",") ?? "";
	(0, import_react.useEffect)(() => {
		const load = () => {
			const now = Date.now();
			window.api.history.events(now - HOUR, now).then((ev) => setRecent(ev.filter((e) => e.kind === "diag")));
		};
		load();
		const timer = setInterval(load, 6e4);
		return () => clearInterval(timer);
	}, [activeKey]);
	const active = diag?.active ?? [];
	const past = recent.filter((e) => e.tsEnd != null);
	const status = !diag?.enabled ? "诊断已关闭" : active.length > 0 ? `正在发生 ${active.length} 个潜在瓶颈` : past.length > 0 ? `最近 1 小时：${past.length} 个潜在瓶颈，现在没有` : "最近 1 小时：未发现潜在瓶颈";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, {
		className: "panel hw hw--clickable",
		onPointerDown: (e) => down.current = {
			x: e.clientX,
			y: e.clientY
		},
		onClick: (e) => {
			const d = down.current;
			if (d && Math.hypot(e.clientX - d.x, e.clientY - d.y) > 4) return;
			onOpenDetail();
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "panel__head",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stethoscope, {
						size: 18,
						strokeWidth: 1.75
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "性能诊断" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						className: "hw__more",
						onClick: (e) => {
							e.stopPropagation();
							onOpenDetail();
						},
						children: ["详情", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, {
							size: 14,
							strokeWidth: 2
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: `diag__status ${active.length > 0 ? "is-active" : ""}`,
				children: status
			}),
			frames && frames.state !== "off" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "diag__frame",
				children: frameLine(frames)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "diag__list",
				children: [active.map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "diag__row",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: `dconf ${confClass(a.confidence)}`,
							children: CONF_TEXT[a.confidence]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "diag__title",
							children: a.title
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("small", { children: ["已持续 ", formatDuration(Date.now() - a.since)] })
					]
				}, a.rule)), past.slice(0, Math.max(0, 3 - active.length)).map((e) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "diag__row is-past",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: `dconf ${confClass(e.confidence)}`,
							children: e.confidence ?? "低"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "diag__title",
							children: eventTitle(e).replace(/^潜在性能瓶颈：/, "")
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: formatTime(e.tsStart, false) })
					]
				}, e.id))]
			})
		]
	});
}
