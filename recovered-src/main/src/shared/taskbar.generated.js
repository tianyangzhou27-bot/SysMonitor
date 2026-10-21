// GENERATED FRAGMENT — extracted from out/main/index.js, lines 5408-5417.
// Original module marker: src/shared/taskbar.ts. Not the original TypeScript/TSX source.
// Depends on bundle-level imports, globals, and other fragments; not standalone.
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
