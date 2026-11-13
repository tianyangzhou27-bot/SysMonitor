// GENERATED FRAGMENT — extracted from out/main/index.js, lines 462-470.
// Original module marker: src/main/collectors/disk.ts. Not original TypeScript/TSX; not standalone.
async function readVolumes() {
	return (await systeminformation.fsSize()).filter((d) => d.size > 0 && /^[A-Za-z]:/.test(d.mount)).map((d) => ({
		mount: d.mount,
		fsType: d.type,
		totalBytes: d.size,
		usedBytes: d.used,
		usagePercent: d.size > 0 ? d.used / d.size * 100 : 0
	})).sort((a, b) => a.mount.localeCompare(b.mount));
}
