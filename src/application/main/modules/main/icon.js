//#region src/main/icon.ts
function makeAppIcon() {
	const file = electron.app.isPackaged ? (0, path.join)(process.resourcesPath, "icon.png") : (0, path.join)(electron.app.getAppPath(), "resources", "icon.png");
	return electron.nativeImage.createFromPath(file);
}
//#endregion
