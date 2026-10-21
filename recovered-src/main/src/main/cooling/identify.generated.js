// GENERATED FRAGMENT — extracted from out/main/index.js, lines 4842-4889.
// Original module marker: src/main/cooling/identify.ts. Not the original TypeScript/TSX source.
// Depends on bundle-level imports, globals, and other fragments; not standalone.
var BOARD_FAN_RE = /^\/lpc\/[\w-]+(\/\d+)?\/fan\/\d+$/;
var SETTLE_MS = 3500;
var wait = (ms) => new Promise((r) => setTimeout(r, ms));
var running = false;
/**
* 把主板上的一路风扇临时调到 100% 约 8 秒，再交还主板，用来分辨它是哪个风扇。
* 只处理主板接口；已指定为水泵的接口拒绝；无论成功与否，最后都会交还。
*/
async function identifyFan(lhm, fanId, cfg) {
	const fail = (error) => ({
		ok: false,
		error,
		before: null,
		peak: null,
		after: null
	});
	if (!BOARD_FAN_RE.test(fanId)) return fail("只能识别主板上的风扇接口");
	if (cfg.roles[fanId] === "pump") return fail("这个接口已指定为水泵，为安全起见不参与识别");
	if (running) return fail("另一个识别正在进行");
	const controlId = fanId.replace(/\/fan\/(\d+)$/, "/control/$1");
	if (!lhm.get(controlId)) return fail("没有找到这个接口的控制通道，可能不支持调速");
	running = true;
	try {
		let before = null;
		let peak = null;
		try {
			before = await lhm.readSensor(fanId);
			if (!await lhm.setControl(controlId, 100)) return fail("LibreHardwareMonitor 拒绝了调速请求");
			await wait(SETTLE_MS);
			const mid = await lhm.readSensor(fanId);
			await wait(SETTLE_MS);
			const seen = [mid, await lhm.readSensor(fanId)].filter((v) => v != null);
			peak = seen.length > 0 ? Math.max(...seen) : null;
		} finally {
			let restored = false;
			for (let i = 0; i < 3 && !restored; i++) restored = await lhm.setControl(controlId, null);
		}
		await wait(3e3);
		return {
			ok: true,
			before,
			peak,
			after: await lhm.readSensor(fanId)
		};
	} finally {
		running = false;
	}
}
