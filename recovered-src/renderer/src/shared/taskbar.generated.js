// GENERATED FRAGMENT — extracted from out/renderer/assets/index-CzIv0K4n.js, lines 26131-26140.
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
