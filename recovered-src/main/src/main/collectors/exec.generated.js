// GENERATED FRAGMENT — extracted from out/main/index.js, lines 652-688.
// Original module marker: src/main/collectors/exec.ts. Not the original TypeScript/TSX source.
// Depends on bundle-level imports, globals, and other fragments; not standalone.
function runCapture(cmd, args, timeoutMs = 8e3) {
	return new Promise((resolve) => {
		let settled = false;
		const chunks = [];
		const done = (code) => {
			if (settled) return;
			settled = true;
			clearTimeout(timer);
			resolve({
				code,
				out: Buffer.concat(chunks)
			});
		};
		const proc = (0, child_process.spawn)(cmd, args, {
			windowsHide: true,
			stdio: [
				"ignore",
				"pipe",
				"ignore"
			]
		});
		const timer = setTimeout(() => {
			proc.kill();
			done(null);
		}, timeoutMs);
		proc.stdout.on("data", (d) => chunks.push(d));
		proc.on("error", () => done(null));
		proc.on("close", (code) => done(code));
	});
}
function decodeConsole(buf) {
	try {
		return new TextDecoder("gbk").decode(buf);
	} catch {
		return buf.toString("latin1");
	}
}
