const fs = require('fs');
const vm = require('vm');
const assert = require('assert/strict');
// Reuse the archive reader/writer; keep each release patch reproducible.
const previous = fs.readFileSync('tools/add-top-menu.cjs', 'utf8');
const reader = previous.slice(0, previous.indexOf('replace("async function deliver'));
const writer = previous.slice(previous.indexOf('  target.data = Buffer.from(source);'), previous.indexOf("}).catch(error"));
const patch = String.raw`
replace('const topKeyboard =', 
  "const menuKeyboard = { inline_keyboard: [\n" +
  "  [{ text: '电脑状态', callback_data: 'menu:status' }, { text: '进程排行', callback_data: 'menu:top' }],\n" +
  "  [{ text: '温度', callback_data: 'menu:temperature' }, { text: '网络', callback_data: 'menu:network' }],\n" +
  "  [{ text: '用电', callback_data: 'menu:power' }]\n" +
  "] };\n" +
  "const backKeyboard = { inline_keyboard: [[{ text: '返回主菜单', callback_data: 'menu:home' }]] };\n" +
  "const menuText = '【SysMonitor 主菜单】\\n请选择要查看的内容：';\n" +
  "function temperatureText() {\n" +
  "  if (!latest) return '正在等待第一份监控数据，请稍后重试。';\n" +
  "  const value = n => typeof n === 'number' && Number.isFinite(n) ? n.toFixed(1) + '℃' : '未读取';\n" +
  "  const lines = ['【SysMonitor 温度】', 'CPU：' + value(latest.cpu?.tempC), 'GPU：' + value(latest.gpu?.tempC)];\n" +
  "  if (!Number.isFinite(latest.ts) || Date.now() - latest.ts > 15000) lines.push('⚠ 监控数据已过期，请检查采集状态。');\n" +
  "  if (!latest.lhmOnline) lines.push('硬件传感器服务未连接，部分温度可能不可用。');\n" +
  "  return lines.join('\\n');\n" +
  "}\n" +
  "async function menuReply(action) {\n" +
  "  if (action === 'home') return { text: menuText, keyboard: menuKeyboard };\n" +
  "  if (action === 'top') return { text: '请选择要查看的进程排行：', keyboard: topKeyboard };\n" +
  "  return { text: action === 'temperature' ? temperatureText() : await statusText('/' + action), keyboard: backKeyboard };\n" +
  "}\nconst topKeyboard =");
replace("{ text: '内存', callback_data: 'top:memory' }\n]] };", "{ text: '内存', callback_data: 'top:memory' }\n], [{ text: '返回主菜单', callback_data: 'menu:home' }]] };");
replace("const selection = /^top:(cpu|gpu|memory)$/.exec(callback.data || '');", "const selection = /^(?:top:(cpu|gpu|memory)|menu:(home|status|top|temperature|network|power))$/.exec(callback.data || '');");
replace("'请重新发送 /top。'", "'请重新发送 /menu。'");
replace("'正在读取排行…'", "'正在读取…'");
replace("      enqueueCommand(topReply(selection[1]), topKeyboard);\n      commandStatus = '已收到指令 /top ' + selection[1] + '：' + new Date(now).toLocaleString();", "      const reply = selection[1] ? { text: topReply(selection[1]), keyboard: topKeyboard } : await menuReply(selection[2]);\n      enqueueCommand(reply.text, reply.keyboard);\n      commandStatus = '已收到按钮指令 ' + callback.data + '：' + new Date(now).toLocaleString();");
replace('(start|status|power|network|help|top)', '(start|status|power|network|help|top|menu)');
replace("    const text = command === '/top'", "    const text = command === '/menu' ? menuText : command === '/top'");
replace("SysMonitor 指令\\n/status", "SysMonitor 指令\\n/menu：按钮主菜单（状态、进程、温度、网络、用电）\\n/status");
replace("enqueueCommand(text, command === '/top' ? topKeyboard : undefined);", "enqueueCommand(text, command === '/menu' || command === '/start' ? menuKeyboard : command === '/top' ? topKeyboard : backKeyboard);");
replace('指令监听正常，发送 /status 查询', '指令监听正常，发送 /menu 打开主菜单');
new vm.Script(source);
const html = entries.find(e => e.path === 'out/main/telegram.html');
html.data = Buffer.from(html.data.toString().replace('发送 /status 或 /start 查询电脑、网络和用电情况。', '发送 /menu 打开主菜单，点击查看电脑状态、进程排行、温度、网络和用电。').replace('/status 总览 · /power 功耗电量 · /network 网络线路。', '/menu 按钮主菜单 · /status 总览 · /power 功耗电量 · /network 网络线路。'));
const calls = [];
const sandbox = vm.createContext({ require: name => name === 'electron' ? {} : name === 'fs' ? { writeFileSync() {}, renameSync() {} } : name === './telegram-report' ? { report: () => '状态报告\nCPU：测试\n整机功耗：100 W\n主网卡：测试网卡' } : name === './process-metrics' ? { topText: (_, key) => '排行:' + key } : require(name), module: { exports: {} }, Buffer, AbortSignal, setInterval, clearInterval, setTimeout, testCalls: calls });
vm.runInContext(source + "\nconfig.chatId = '42'; running = true; api = async (method, body) => testCalls.push({ method, body }); globalThis.test = { processUpdates, queue, sample, deliver, disable: () => config.commandsEnabled = false };", sandbox);
async function test() {
  const t = sandbox.test, now = Date.now(); let id = 0, time = now;
  t.sample({ ts: now, cpu: { tempC: 51 }, gpu: { tempC: 62 }, lhmOnline: true, processes: { ts: now } });
  const message = async text => { time += 4000; await t.processUpdates([{ update_id: ++id, message: { text, date: time / 1000, chat: { id: 42, type: 'private' }, from: { id: 42 } } }], time); };
  const click = async (data, who = 42, type = 'private') => { time += 1200; await t.processUpdates([{ update_id: ++id, callback_query: { id: String(id), data, from: { id: who }, message: { chat: { id: 42, type } } } }], time); };
  await message('/menu');
  assert.equal(t.queue.at(-1).replyMarkup.inline_keyboard.flat().length, 5);
  await click('menu:status'); assert.match(t.queue.at(-1).text, /状态报告/);
  await click('menu:temperature'); assert.match(t.queue.at(-1).text, /51.0℃/); assert.match(t.queue.at(-1).text, /62.0℃/);
  await click('menu:network'); assert.match(t.queue.at(-1).text, /主网卡/); assert(!t.queue.at(-1).text.includes('整机功耗'));
  await click('menu:power'); assert.match(t.queue.at(-1).text, /100 W/); assert(!t.queue.at(-1).text.includes('主网卡'));
  await click('menu:top'); assert.equal(t.queue.at(-1).replyMarkup.inline_keyboard[0].length, 3);
  for (const key of ['cpu', 'gpu', 'memory']) { await click('top:' + key); assert.equal(t.queue.at(-1).text, '排行:' + key); }
  await click('menu:home'); assert.match(t.queue.at(-1).text, /主菜单/);
  let count = t.queue.length;
  await click('menu:status', 99); await click('menu:status', 42, 'group'); await click('menu:unknown'); assert.equal(t.queue.length, count);
  await message('/menu@MyBot'); assert.match(t.queue.at(-1).text, /主菜单/);
  await message('/start'); assert.equal(t.queue.at(-1).replyMarkup.inline_keyboard.flat().length, 5);
  await message('/top cpu'); assert.equal(t.queue.at(-1).text, '排行:cpu');
  t.sample(null); await click('menu:temperature'); assert.match(t.queue.at(-1).text, /等待/);
  t.sample({ ts: now - 60000 }); await click('menu:temperature'); assert.match(t.queue.at(-1).text, /已过期/); assert.match(t.queue.at(-1).text, /未读取/);
  await t.deliver('menu', 0, 'command', t.queue[0].replyMarkup); assert.equal(calls.at(-1).body.reply_markup.inline_keyboard.flat().length, 5);
  count = t.queue.length; t.disable(); await click('menu:status'); assert.equal(t.queue.length, count);
  console.log('PASS: all five menu routes, back navigation, top regression, authorization, missing/stale temperature, command aliases and delivery.');
}
`;
const script = reader + patch + '\ntest().then(() => {\n' + writer.replace('app.before-top-menu.asar', 'app.before-main-menu.asar') + '}).catch(error => { console.error(error); process.exitCode = 1; });';
new Function('require', script)(require);
