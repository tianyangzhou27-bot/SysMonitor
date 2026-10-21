// GENERATED FRAGMENT — extracted from out/main/index.js, lines 4485-4488.
// Original module marker: src/main/icon.ts. Not the original TypeScript/TSX source.
// Depends on bundle-level imports, globals, and other fragments; not standalone.
function makeAppIcon() {
	const file = electron.app.isPackaged ? (0, path.join)(process.resourcesPath, "icon.png") : (0, path.join)(electron.app.getAppPath(), "resources", "icon.png");
	return electron.nativeImage.createFromPath(file);
}
