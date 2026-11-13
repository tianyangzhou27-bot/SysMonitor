const fs = require('fs');
const previous = fs.readFileSync('tools/add-top-menu.cjs', 'utf8');
const reader = previous.slice(0, previous.indexOf('replace("async function deliver'));
const writer = previous.slice(previous.indexOf('  target.data = Buffer.from(source);'), previous.indexOf('}).catch(error'));
const patch = String.raw`
const telegram = target;
const main = entries.find(e => e.path === 'out/main/index.js');
source = main.data.toString();
replace('var AlertEngine = class {', 'var AlertEngine = class {\n lastSampleAt = 0;');
replace('const checks = this.checks(s, cfg, now);', 'if (!Number.isFinite(s.ts) || now - s.ts > 15000) return;\n        if (this.lastSampleAt && now - this.lastSampleAt > 15000) { for (const st of this.states.values()) { st.normalSince = null; if (!st.notified) st.since = null; } }\n        this.lastSampleAt = now;\n        const checks = this.checks(s, cfg, now);');
replace('this.states.set(c.id, st);\n\t\t\tif (!c.hit) {', 'this.states.set(c.id, st);\n            if (c.valid === false) { st.normalSince = null; if (!st.notified) st.since = null; continue; }\n\t\t\tif (!c.hit) {\n                if (st.notified && c.valid === true) {\n                    if (!c.recovered) { st.normalSince = null; continue; }\n                    st.normalSince ??= now;\n                    if (now - st.normalSince < 10000) continue;\n                    const seconds = Math.max(0, Math.round((st.normalSince - st.since) / 1000));\n                    this.notify("恢复正常：" + c.title, c.body + "\\n异常持续：" + Math.floor(seconds / 60) + "分" + seconds % 60 + "秒（恢复读数已稳定 10 秒）");\n                }\n                st.notified = false; st.normalSince = null;');
replace('st.since ??= now;', 'st.normalSince = null;\n            st.since ??= now;');
replace('this.notify(c.title, c.body);', 'st.notified = true;\n                this.notify(c.title, c.body + "\\n已持续：" + Math.floor((now - st.since) / 1000) + "秒");');
replace('hit: value != null && value >= limit,', 'valid: typeof value === "number" && Number.isFinite(value),\n            recovered: typeof value === "number" && Number.isFinite(value) && value <= limit - (/Temp/.test(id) ? 3 : Math.max(1, limit * 0.1)),\n            hit: typeof value === "number" && Number.isFinite(value) && value >= limit,');
// The existing formatter says "above threshold" even for recovery; normalize that wording.
replace('body: value != null ? text(value) : ""', 'body: value != null ? text(value).replace(/超过阈值/g, "告警阈值为") : ""');
const begin = source.indexOf('\t\tconst top = s.processes.apps.cpu[0];');
const end = source.indexOf('\t\treturn out;', begin);
assert(begin > 0 && end > begin);
source = source.slice(0, begin) + String.raw${'`'}        const fresh = Number.isFinite(s.processes?.ts) && now - s.processes.ts <= 5000;
        for (const row of s.processes?.rows || []) {
            if (!row.pid || row.pid <= 0) continue;
            const identity = row.identity || (row.pid + ':' + row.name);
            const prefix = row.name + ' · PID ' + row.pid;
            const memPct = Number.isFinite(row.memBytes) && s.memory.totalBytes > 0 ? row.memBytes / s.memory.totalBytes * 100 : null;
            for (const [key, label, value, limit] of [
                ['cpu', 'CPU', row.cpuPercent, a.procCpu ?? 50],
                ['gpu', 'GPU', row.gpuPercent, a.gpuUsage ?? 95],
                ['memory', '内存', memPct, 25]
            ]) {
                const before = out.length;
                over('process:' + identity + ':' + key, fresh ? value : null, limit,
                    '进程' + label + '占用过高', v => prefix + '\n当前' + label + '占用：' + v.toFixed(1) + '%；告警阈值：' + limit + '%' + (key === 'memory' ? '（占物理内存）' : ''));
                out[before].body += '\n高占用可能来自正常任务，请结合当前工作判断。';
            }
        }
${'`'} + source.slice(end);
new vm.Script(source);
// Test the actual engine with deterministic readings and clock, without notifications or user configuration.
const classStart = source.indexOf('var AlertEngine = class');
const classEnd = source.indexOf('//#endregion', classStart);
const ctx = vm.createContext({ telegramAlerts: { notify() {} }, electron: { Notification: { isSupported: () => false } } });
vm.runInContext(source.slice(classStart, classEnd) + '\nglobalThis.Engine = AlertEngine;', ctx);
const engine = new ctx.Engine(() => {}), messages = [];
engine.notify = (title, body) => messages.push({ title, body });
let read = { id: 'cpu', title: 'CPU 温度过高', body: '当前温度', hit: true, valid: true, recovered: false };
engine.checks = () => [read];
const cfg = { enabled: true, sustainSec: 10, cooldownMin: 5 };
const start = 1000000;
const tick = sec => engine.evaluate({ ts: start + sec * 1000 }, cfg, start + sec * 1000);
tick(0); tick(9); assert.equal(messages.length, 0); tick(10); assert.equal(messages.length, 1);
read = { ...read, hit: false, valid: false }; tick(11); tick(20); assert.equal(messages.length, 1);
read = { ...read, valid: true, recovered: true }; tick(21); tick(30); assert.equal(messages.length, 1); tick(31); assert.equal(messages.length, 2); assert.match(messages[1].title, /恢复正常/);
tick(32); assert.equal(messages.length, 2);
const silent = new ctx.Engine(() => {}); silent.checks = () => [read]; silent.notify = () => { throw new Error('Recovery without alarm'); }; silent.evaluate({ts:start},cfg,start);
// Exercise real checks for every process, not just the top one.
const real = new ctx.Engine(() => {});
ctx['pct$1'] = v => v.toFixed(0) + '%';
const snapshot = { cpu: {}, gpu: {}, memory: { totalBytes: 1000 }, power: {}, disk: { volumes: [] }, storage: [], cooling: { groups: [], fans: [] }, network: {}, processes: { ts: start, rows: [
 { pid: 1, identity: 'one', name: 'A', cpuPercent: 60, gpuPercent: 98, memBytes: 300 },
 { pid: 2, identity: 'two', name: 'B', cpuPercent: 70, gpuPercent: null, memBytes: 100 }
] } };
const checks = real.checks(snapshot, { procCpu: 50, gpuUsage: 95 }, start).filter(c => c.id.startsWith('process:'));
assert.equal(checks.length, 6); assert.equal(checks.filter(c => c.hit).length, 4); assert.equal(checks.find(c => c.id === 'process:two:gpu').valid, false);
assert(real.checks(snapshot, {}, start + 6000).filter(c => c.id.startsWith('process:')).every(c => !c.valid));
console.log('PASS: sustained alerts, cooldown, recovery debounce, missing data, no orphan recovery, all-process CPU/GPU/memory checks.');
main.data = Buffer.from(source);
source = telegram.data.toString().replace("alertLeaders(latest,title)", "(/^恢复正常/.test(title) ? '' : alertLeaders(latest,title))");
new vm.Script(source);
`;
new Function('require', reader + patch + '\n{\n' + writer.replace('app.before-top-menu.asar', 'app.before-process-recovery.asar') + '\n}')(require);
