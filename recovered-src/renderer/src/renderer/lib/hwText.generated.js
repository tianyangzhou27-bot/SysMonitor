// GENERATED FRAGMENT — extracted from out/renderer/assets/index-CzIv0K4n.js, lines 18992-19015.
// Original module marker: src/renderer/lib/hwText.ts. Not the original TypeScript/TSX source.
// Depends on bundle-level imports, globals, and other fragments; not standalone.
function uptimeText(sec) {
	const d = Math.floor(sec / 86400);
	const h = Math.floor(sec % 86400 / 3600);
	const m = Math.floor(sec % 3600 / 60);
	return d > 0 ? `${d} 天 ${h} 小时` : h > 0 ? `${h} 小时 ${m} 分` : `${m} 分钟`;
}
function shortVendor(v) {
	if (!v) return null;
	if (/asus/i.test(v)) return "ASUS";
	if (/micro-star|msi/i.test(v)) return "MSI";
	if (/gigabyte/i.test(v)) return "Gigabyte";
	if (/asrock/i.test(v)) return "ASRock";
	return v.replace(/[\s,]+(computer|technology|international|electronics)?\s*(inc|corp|corporation|co|ltd|limited)\b\.?/gi, "").trim() || v;
}
var brandShort = (b) => b ? b.split(" ")[0] : null;
function diskTag(kind) {
	if (/固态/.test(kind)) return "SSD";
	if (/机械/.test(kind)) return "HDD";
	return null;
}
function diskSize(bytes) {
	const tb = bytes / 0xe8d4a51000;
	return tb >= 1 ? `${Math.round(tb * 10) / 10} TB` : `${Math.round(bytes / 1e9)} GB`;
}
