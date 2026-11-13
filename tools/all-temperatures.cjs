const fs = require('fs');
const previous = fs.readFileSync('tools/add-top-menu.cjs', 'utf8');
const reader = previous.slice(0, previous.indexOf('replace("async function deliver'));
const writer = previous.slice(previous.indexOf('  target.data = Buffer.from(source);'), previous.indexOf('}).catch(error'));
const patch = String.raw`
const main = entries.find(e => e.path === 'out/main/index.js');
let mainSource = main.data.toString();
const anchor = 'lhmOnline: this.lhm.isOnline(),';
assert(mainSource.includes(anchor));
mainSource = mainSource.replace(anchor, anchor + '\n            temperatureSensors: this.lhm.list().filter(s => s.type === "Temperature").map(s => ({ id: s.id, hardware: s.hardware, name: s.name, value: s.value, unit: s.unit, label: this.coolingCfg.names[s.id] ?? null })),');
new vm.Script(mainSource);
main.data = Buffer.from(mainSource);
const start = source.indexOf('function temperatureText() {');
const end = source.indexOf('async function menuReply', start);
assert(start >= 0 && end > start);
source = source.slice(0, start) + String.raw${'`'}function temperatureReply(page = 0) {
  if (!latest) return { text: '正在等待第一份监控数据，请稍后重试。', keyboard: backKeyboard };
  const valid = n => typeof n === 'number' && Number.isFinite(n);
  const value = (n, unit = '℃') => valid(n) ? n.toFixed(1) + unit : '未读取';
  const sensors = [...(latest.temperatureSensors || [])];
  const has = pattern => sensors.some(s => pattern.test(s.id || ''));
  if (!has(/^\/(?:intelcpu|amdcpu|cpu)\//)) sensors.push({ id: 'fallback:cpu', hardware: latest.cpu?.model || 'CPU', name: 'CPU 温度', value: latest.cpu?.tempC });
  if (!has(/^\/gpu-/)) sensors.push({ id: 'fallback:gpu', hardware: latest.gpu?.name || 'GPU', name: 'GPU 温度', value: latest.gpu?.tempC });
  for (const drive of latest.storage || []) {
    if (sensors.some(s => s.hardware === drive.name || (drive.tempKey && 'lhm:' + s.id === drive.tempKey))) continue;
    sensors.push({ id: 'storage:' + drive.name, hardware: drive.name, name: '硬盘温度', value: drive.tempC });
  }
  const seen = new Set(), groups = new Map();
  for (const sensor of sensors) {
    if (sensor.id && seen.has(sensor.id)) continue;
    seen.add(sensor.id);
    const hardware = sensor.hardware || '其他硬件';
    if (!groups.has(hardware)) groups.set(hardware, []);
    const limit = /limit|warning|critical|阈值|上限/i.test(sensor.name || '') ? '（阈值）' : '';
    groups.get(hardware).push('• ' + (sensor.label || sensor.name || sensor.id) + limit + '：' + value(sensor.value, sensor.unit || '℃'));
  }
  const heading = ['【SysMonitor 全部温度传感器】'];
  if (!Number.isFinite(latest.ts) || Date.now() - latest.ts > 15000) heading.push('⚠ 监控数据已过期，请检查采集状态。');
  if (!latest.lhmOnline) heading.push('硬件传感器服务未连接；当前仅显示可用来源，无法列出全部硬件传感器。');
  const lines = [...heading];
  for (const [hardware, readings] of groups) lines.push('', '【' + hardware + '】', ...readings);
  const pages = []; let text = '';
  for (const line of lines) {
    // Keep every reading accessible even on machines with hundreds of sensors.
    for (let i = 0; i < Math.max(1, line.length); i += 3000) {
      const part = line.slice(i, i + 3000);
      if (text.length + part.length + 1 > 3400) { pages.push(text); text = ''; }
      text += (text ? '\n' : '') + part;
    }
  }
  if (text) pages.push(text);
  page = Math.min(Math.max(0, Math.floor(Number(page) || 0)), pages.length - 1);
  const nav = [];
  if (page > 0) nav.push({ text: '上一页', callback_data: 'menu:temperature:' + (page - 1) });
  if (page + 1 < pages.length) nav.push({ text: '下一页', callback_data: 'menu:temperature:' + (page + 1) });
  return { text: pages[page] + '\n\n第 ' + (page + 1) + '/' + pages.length + ' 页', keyboard: { inline_keyboard: [
    ...(nav.length ? [nav] : []), [{ text: '刷新温度', callback_data: 'menu:temperature:' + page }], ...backKeyboard.inline_keyboard
  ] } };
}
${'`'} + source.slice(end);
replace("  return { text: action === 'temperature' ? temperatureText() : await statusText('/' + action), keyboard: backKeyboard };", "  if (/^temperature(?::\\d+)?$/.test(action)) return temperatureReply(action.split(':')[1]);\n  return { text: await statusText('/' + action), keyboard: backKeyboard };");
replace('home|status|top|temperature|network|power', 'home|status|top|temperature(?::[0-9]{1,6})?|network|power');
new vm.Script(source);
const context = vm.createContext({ require: name => name === 'electron' || name === './telegram-report' || name === './process-metrics' ? {} : require(name), module: { exports: {} }, Buffer, setInterval, clearInterval, setTimeout });
vm.runInContext(source + '\nglobalThis.test = { set: s => latest = s, temperatureReply, menuReply };', context);
const t = context.test;
const sensors = [
 { id: '/intelcpu/0/temperature/0', hardware: 'CPU', name: 'Core 1', value: 51 },
 { id: '/gpu-nvidia/0/temperature/0', hardware: 'GPU', name: 'Hot Spot', value: 62 },
 { id: '/lpc/0/temperature/0', hardware: '主板', name: 'VRM', value: 45 },
 { id: '/memory/dimm/0/temperature/0', hardware: '内存条', name: 'DIMM', value: 40 },
 { id: '/nvme/0/temperature/0', hardware: 'SSD', name: 'Composite', value: 38 },
 { id: '/nvme/0/temperature/1', hardware: 'SSD', name: 'Critical Temperature', value: 90 },
 { id: '/lpc/0/temperature/1', hardware: '主板', name: 'AUX', value: null }
];
t.set({ ts: Date.now(), lhmOnline: true, temperatureSensors: sensors, storage: [{ name: 'SMART盘', tempC: 39 }] });
let result = t.temperatureReply();
for (const name of ['Core 1', 'Hot Spot', 'VRM', 'DIMM', 'Composite', '阈值', '未读取', 'SMART盘']) assert(result.text.includes(name));
const many = Array.from({ length: 400 }, (_, i) => ({ id: '/lpc/0/temperature/' + i, hardware: '主板', name: '传感器-' + i, value: i }));
t.set({ ts: Date.now(), lhmOnline: true, temperatureSensors: many });
let all = '', page = 0;
do { result = t.temperatureReply(page++); assert(result.text.length < 4000); all += result.text; } while (result.keyboard.inline_keyboard.flat().some(b => b.text === '下一页'));
assert(page > 1);
for (let i = 0; i < 400; i++) assert(all.includes('传感器-' + i + '：'));
t.set({ ts: 1, lhmOnline: false, cpu: { tempC: 50 }, gpu: { tempC: null } });
assert.match(t.temperatureReply().text, /已过期/); assert.match(t.temperatureReply().text, /未连接/);
t.set(null); assert.match(t.temperatureReply().text, /等待/);
console.log('PASS: all hardware groups, unavailable readings, thresholds, SMART fallback, 400-sensor pagination and offline/stale states.');
`;
new Function('require', reader + patch + '\n{\n' + writer.replace('app.before-top-menu.asar', 'app.before-all-temperatures.asar') + '\n}')(require);
