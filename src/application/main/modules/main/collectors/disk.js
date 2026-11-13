//#region src/main/collectors/disk.ts
async function readVolumes() {
	return (await systeminformation.fsSize()).filter((d) => d.size > 0 && /^[A-Za-z]:/.test(d.mount)).map((d) => ({
		mount: d.mount,
		fsType: d.type,
		totalBytes: d.size,
		usedBytes: d.used,
		usagePercent: d.size > 0 ? d.used / d.size * 100 : 0
	})).sort((a, b) => a.mount.localeCompare(b.mount));
}
//#endregion
