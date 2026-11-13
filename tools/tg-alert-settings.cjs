const fs = require('fs');
const prev = fs.readFileSync('tools/add-top-menu.cjs', 'utf8');
const reader = prev.slice(0, prev.indexOf('replace("async function deliver'));
const writer = prev.slice(prev.indexOf('  target.data = Buffer.from(source);'), prev.indexOf('}).catch(error'));
const patch = String.raw`
const main = entries.find(e => e.path === 'out/main/index.js');
let mainSource = main.data.toString();
function mainReplace(a, b) { assert(mainSource.includes(a)); mainSource = mainSource.replace(a,b); }
mainReplace('procCpu: 50\n', 'procCpu: 50,\n        procMemory: 25\n');
mainReplace('procCpu: num(a.procCpu, 5, 100, ba.procCpu)', 'procCpu: num(a.procCpu, 5, 100, ba.procCpu),\n            procMemory: num(a.procMemory, 5, 100, ba.procMemory ?? 25)');
mainReplace("['memory', '内存', memPct, 25]", "['memory', '内存', memPct, a.procMemory ?? 25]");
mainReplace('telegramAlerts.bindRoute((hosts)', 'telegramAlerts.bindAlertSettings(() => store.get().alerts, (patch) => {\n            const before = { ...store.get().alerts };\n            try {\n                store.patch({ alerts: patch });\n                fs.writeFileSync(store.file + ".tg.tmp", JSON.stringify(store.get(), null, 2), "utf8");\n                fs.renameSync(store.file + ".tg.tmp", store.file);\n                alerts.closeAll();\n                return store.get().alerts;\n            } catch (error) { store.patch({ alerts: before }); throw error; }\n        });\n        telegramAlerts.bindRoute((hosts)');
new vm.Script(mainSource);
main.data = Buffer.from(mainSource);
replace("[{ text: '用电', callback_data: 'menu:power' }]", "[{ text: '用电', callback_data: 'menu:power' }, { text: '告警设置', callback_data: 'cfg:home' }]");
replace('const menuKeyboard =', String.raw${'`'}let readAlertSettings, writeAlertSettings;
function bindAlertSettings(read, write) { readAlertSettings = read; writeAlertSettings = write; }
const alertFields = {
  cpuUsage: ['整机 CPU 占用', '%', 10, 100, 5, [70, 80, 90, 95]],
  procCpu: ['单进程 CPU 占用', '%', 5, 100, 5, [30, 50, 70, 90]],
  gpuUsage: ['GPU 占用（整机及进程）', '%', 10, 100, 5, [70, 80, 90, 95]],
  memUsage: ['整机内存占用', '%', 10, 100, 5, [75, 85, 90, 95]],
  procMemory: ['单进程内存占物理内存', '%', 5, 100, 5, [10, 25, 40, 50]],
  cpuTemp: ['CPU 温度', '℃', 30, 120, 1, [75, 80, 85, 90]],
  gpuTemp: ['GPU 温度', '℃', 30, 120, 1, [70, 75, 80, 85]],
  ssdTemp: ['硬盘温度', '℃', 30, 100, 1, [55, 60, 65, 70]],
  sustainSec: ['异常持续时间', '秒', 1, 600, 1, [5, 10, 30, 60]],
  cooldownMin: ['重复提醒间隔', '分钟', 1, 240, 1, [1, 5, 15, 30]]
};
function alertSettingsReply(action) {
  const back = { inline_keyboard: [[{ text: '告警设置', callback_data: 'cfg:home' }], ...backKeyboard.inline_keyboard] };
  if (!readAlertSettings || !writeAlertSettings) return { text: '设置尚未就绪，请稍后重试。', keyboard: back };
  const parts = action.split(':');
  const key = parts[0];
  if (key === 'home') {
    const cfg = readAlertSettings();
    return { text: '【告警设置】\n程序告警：' + (cfg.enabled ? '开启' : '关闭') + ' · TG 推送：' + (config.enabled ? '开启' : '关闭') + '\n选择项目查看或修改。点击数值立即保存并生效。\n修改后重新计时，不会发送虚假的恢复通知。', keyboard: { inline_keyboard: [
      ...Object.entries(alertFields).map(([id, f]) => [{ text: f[0] + '：' + (cfg[id] ?? (id === 'procMemory' ? 25 : '?')) + f[1], callback_data: 'cfg:' + id }]),
      ...backKeyboard.inline_keyboard
    ] } };
  }
  const field = Object.hasOwn(alertFields, key) ? alertFields[key] : null;
  if (!field || parts.length > 2) return { text: '无效的设置项目，请重新打开告警设置。', keyboard: back };
  const [label, unit, min, max, step, presets] = field;
  let saved = false;
  if (parts.length === 2) {
    const value = Number(parts[1]);
    if (!/^\d+$/.test(parts[1]) || !Number.isInteger(value) || value < min || value > max) return { text: '数值超出允许范围：' + min + '–' + max + unit, keyboard: back };
    try { writeAlertSettings({ [key]: value }); saved = true; }
    catch { return { text: '保存失败，设置已回退，请检查本机设置文件是否可写。', keyboard: back }; }
  }
  const current = readAlertSettings()[key] ?? (key === 'procMemory' ? 25 : min);
  const row = [];
  if (current > min) row.push({ text: '设为 ' + Math.max(min, Math.round(current) - step) + unit, callback_data: 'cfg:' + key + ':' + Math.max(min, Math.round(current) - step) });
  if (current < max) row.push({ text: '设为 ' + Math.min(max, Math.round(current) + step) + unit, callback_data: 'cfg:' + key + ':' + Math.min(max, Math.round(current) + step) });
  return { text: (saved ? '已保存，立即生效。\n' : '') + label + '：' + current + unit + '\n允许范围：' + min + '–' + max + unit + '\n点击下方目标数值修改。', keyboard: { inline_keyboard: [
    presets.map(value => ({ text: value + unit, callback_data: 'cfg:' + key + ':' + value })),
    ...(row.length ? [row] : []), ...back.inline_keyboard
  ] } };
}
const menuKeyboard =${'`'});
replace('network|power))$/', 'network|power)|cfg:([A-Za-z]+(?::[0-9]{1,3})?))$/');
replace('const reply = selection[1] ?', 'const reply = selection[3] ? alertSettingsReply(selection[3]) : selection[1] ?');
replace('module.exports = { init,', 'module.exports = { bindAlertSettings, init,');
new vm.Script(source);
const writes = [], calls = [];
let settings = { enabled: true, procCpu: 50, gpuUsage: 95, procMemory: 25, sustainSec: 10 };
const context = vm.createContext({ require: name => name === 'electron' || name === './telegram-report' || name === './process-metrics' ? {} : name === 'fs' ? { writeFileSync() {}, renameSync() {} } : require(name), module: { exports: {} }, Buffer, setInterval, clearInterval, setTimeout, calls });
vm.runInContext(source + "\nconfig.chatId = '42'; running = true; api = async (method,body) => calls.push({method,body}); globalThis.test = { bindAlertSettings, alertSettingsReply, processUpdates, queue, disable: () => config.commandsEnabled = false };", context);
const t = context.test;
t.bindAlertSettings(() => settings, p => { writes.push(p); settings = { ...settings, ...p }; });
async function test() {
  assert.equal(t.alertSettingsReply('home').keyboard.inline_keyboard.length, 11);
  for (const [key, value] of [['procCpu', 70], ['gpuUsage', 90], ['procMemory', 40], ['sustainSec', 30], ['cooldownMin', 5], ['cpuTemp', 85], ['gpuTemp', 80], ['ssdTemp', 65], ['cpuUsage', 90], ['memUsage', 85]]) {
    const reply = t.alertSettingsReply(key + ':' + value); assert.match(reply.text, /已保存/); assert.equal(settings[key], value);
  }
  const count = writes.length;
  for (const invalid of ['procCpu:0', 'procMemory:101', 'sustainSec:601', '__proto__:3', 'token:123', 'procCpu:NaN']) t.alertSettingsReply(invalid);
  assert.equal(writes.length, count);
  let id = 0, now = Date.now();
  const click = async (data, who = 42, type = 'private') => { now += 1500; await t.processUpdates([{ update_id: ++id, callback_query: { id: String(id), data, from: { id: who }, message: { chat: { id: 42, type } } } }], now); };
  await click('cfg:procCpu:80', 99); await click('cfg:procCpu:80', 42, 'group'); assert.equal(writes.length, count);
  await click('cfg:procCpu:80'); assert.equal(settings.procCpu, 80); assert.match(t.queue.at(-1).text, /已保存/);
  await click('cfg:home'); assert.match(t.queue.at(-1).text, /告警设置/);
  t.disable(); await click('cfg:procCpu:85'); assert.equal(settings.procCpu, 80);
  t.bindAlertSettings(() => settings, () => { throw new Error('disk'); }); assert.match(t.alertSettingsReply('procCpu:75').text, /保存失败/);
  console.log('PASS: all settings, ranges, callback routing, unauthorized/group rejection, disabled commands and write failure.');
}
`;
new Function('require', reader + patch + '\ntest().then(() => {\n' + writer.replace('app.before-top-menu.asar', 'app.before-tg-alert-settings.asar') + '\n}).catch(e => { console.error(e); process.exitCode = 1; });')(require);
