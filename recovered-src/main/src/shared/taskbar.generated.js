// GENERATED FRAGMENT — extracted from out/main/index.js, lines 5451-5460.
// Original module marker: src/shared/taskbar.ts. Not original TypeScript/TSX; not standalone.
function taskbarMetrics(fontSize) {
	const colW = Math.round(fontSize * 8.8);
	const gap = Math.round(fontSize * 1.5);
	return {
		colW,
		gap,
		lineHeight: Math.round(fontSize * 1.42),
		width: colW * 3 + gap * 2 + 24
	};
}
