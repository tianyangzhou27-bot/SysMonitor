// GENERATED FRAGMENT — extracted from out/main/index.js, lines 4517-4520.
// Original module marker: src/main/icon.ts. Not original TypeScript/TSX; not standalone.
function makeAppIcon() {
	const file = electron.app.isPackaged ? (0, path.join)(process.resourcesPath, "icon.png") : (0, path.join)(electron.app.getAppPath(), "resources", "icon.png");
	return electron.nativeImage.createFromPath(file);
}
