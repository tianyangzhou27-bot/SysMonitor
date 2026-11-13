const fs = require('fs');
const crypto = require('crypto');
const vm = require('vm');
const assert = require('assert/strict');
const archive = 'resources/app.asar';
const original = fs.readFileSync(archive);
const header = JSON.parse(original.subarray(16, 16 + original.readUInt32LE(12)));
const base = 8 + original.readUInt32LE(4);
const entries = [];
function walk(dir, prefix = '') {
  for (const [name, entry] of Object.entries(dir.files || {})) {
    const path = prefix + name;
    if (entry.files) walk(entry, path + '/');
    else if (!entry.unpacked && !entry.link) entries.push({ path, entry, data: original.subarray(base + Number(entry.offset), base + Number(entry.offset) + entry.size) });
  }
}
walk(header);
const target = entries.find(e => e.path === 'out/main/telegram.js');
let source = target.data.toString();
function replace(before, after) {
  assert(source.includes(before), 'Missing patch anchor: ' + before.slice(0, 90));
  source = source.replace(before, after);
}
replace("async function deliver(text, gen, kind = 'alarm')", "async function deliver(text, gen, kind = 'alarm', replyMarkup)");
replace("text: text.slice(0, 4000) });", "text: text.slice(0, 4000), ...(replyMarkup ? { reply_markup: replyMarkup } : {}) });");
replace('deliver(job.text, job.gen, job.kind)', 'deliver(job.text, job.gen, job.kind, job.replyMarkup)');
replace('async function processUpdates(updates, now = Date.now()) {', `const topKeyboard = { inline_keyboard: [[
  { text: 'CPU', callback_data: 'top:cpu' },
  { text: 'GPU', callback_data: 'top:gpu' },
  { text: '内存', callback_data: 'top:memory' }
]] };
let lastTopClickAt = 0;
function topReply(metric) {
  return Date.now() - (latest?.processes?.ts || 0) > 5000
    ? '进程数据已过期，请检查采集组件。'
    : topText(latest?.processes, metric);
}
function enqueueCommand(text, replyMarkup) {
  if (queue.length >= 30) queue.shift();
  queue.push({ gen: generation, kind: 'command', text, replyMarkup });
  void drain();
}
async function processUpdates(updates, now = Date.now()) {`);
replace('    const m = u.message;', `    const callback = u.callback_query;
    if (callback) {
      const message = callback.message;
      const allowed = config.commandsEnabled && message?.chat?.type === 'private'
        && String(message.chat.id) === config.chatId
        && String(callback.from?.id) === config.chatId && !callback.from?.is_bot;
      const selection = /^top:(cpu|gpu|memory)$/.exec(callback.data || '');
      const throttled = now - lastTopClickAt < 1000;
      try {
        await api('answerCallbackQuery', { callback_query_id: callback.id,
          text: !allowed ? '仅绑定的私聊可查询，请检查指令开关。' : !selection ? '请重新发送 /top。' : throttled ? '请稍后再点。' : '正在读取排行…' });
      } catch { /* An expired callback must not stop update polling. */ }
      if (!allowed || !selection || throttled) continue;
      lastTopClickAt = now;
      enqueueCommand(topReply(selection[1]), topKeyboard);
      commandStatus = '已收到指令 /top ' + selection[1] + '：' + new Date(now).toLocaleString();
      continue;
    }
    const m = u.message;`);
replace("/^\\/(start|status|power|network|help|top)(?:@[A-Za-z0-9_]+)?(?:\\s|$)/i", "/^(?:\\/(start|status|power|network|help|top)(?:@[A-Za-z0-9_]+)?|(?:top))(?=\\s|$)/i");
replace("const command = '/' + match[1].toLowerCase();", "const command = '/' + (match[1] || 'top').toLowerCase();\n    const metric = (m.text || '').trim().split(/\\s+/)[1]?.toLowerCase();");
replace("(Date.now()-(latest?.processes?.ts||0)>5000?'进程数据已过期，请检查采集组件。':topText(latest?.processes,(m.text||'').trim().split(/\\s+/)[1]||'cpu'))", "(metric ? topReply(metric) : '请选择要查看的进程排行：')");
replace('/top cpu | memory | gpu | vram | network | io：进程排行', '/top：点击按钮选择 CPU、GPU 或内存排行\\n/top cpu | memory | gpu | vram | network | io：直接查询');
replace("    if (queue.length >= 30) queue.shift();\n    queue.push({ gen: generation, kind: 'command', text }); void drain();", "    enqueueCommand(text, command === '/top' ? topKeyboard : undefined);");
replace("allowed_updates: ['message']", "allowed_updates: ['message', 'callback_query']");
new vm.Script(source);

async function test() {
  const calls = [];
  const context = vm.createContext({ require: name => name === 'electron' ? {} : name === './telegram-report' ? {} : name === './process-metrics' ? { topText: (_, key) => 'ranking:' + key } : require(name), module: { exports: {} }, Buffer, AbortSignal, setInterval, clearInterval, setTimeout });
  vm.runInContext(source + `\nconfig.chatId = '42'; running = true;
    api = async (method, body) => { testCalls.push({method, body}); };
    globalThis.test = { processUpdates, setSample: value => latest = value, queue, deliver, disable: () => config.commandsEnabled = false };`, Object.assign(context, { testCalls: calls }));
  const t = context.test, now = Date.now();
  t.setSample({ processes: { ts: now } });
  const msg = (id, text, who = 42) => ({ update_id: id, message: { text, date: now / 1000, chat: { id: who, type: 'private' }, from: { id: who } } });
  await t.processUpdates([msg(1, '/top')], now);
  assert.equal(t.queue[0].replyMarkup.inline_keyboard[0].length, 3);
  const click = (id, key, who = 42) => ({ update_id: id, callback_query: { id: String(id), data: 'top:' + key, from: { id: who }, message: { date: 1, chat: { id: 42, type: 'private' } } } });
  await t.processUpdates([click(2, 'cpu')], now + 100);
  assert.equal(t.queue.at(-1).text, 'ranking:cpu');
  await t.processUpdates([click(3, 'gpu')], now + 1200);
  assert.equal(t.queue.at(-1).text, 'ranking:gpu');
  await t.processUpdates([click(4, 'memory')], now + 2300);
  assert.equal(t.queue.at(-1).text, 'ranking:memory');
  let count = t.queue.length;
  await t.processUpdates([click(5, 'cpu', 99), click(6, 'invalid')], now + 3400);
  assert.equal(t.queue.length, count);
  await t.processUpdates([msg(7, 'top')], now + 4000);
  assert.equal(t.queue.at(-1).text, '请选择要查看的进程排行：');
  await t.processUpdates([msg(8, '/top gpu')], now + 8000);
  assert.equal(t.queue.at(-1).text, 'ranking:gpu');
  t.setSample({ processes: { ts: now - 60000 } });
  await t.processUpdates([click(9, 'memory')], now + 9000);
  assert.match(t.queue.at(-1).text, /已过期/);
  await t.deliver('menu', 0, 'command', t.queue[0].replyMarkup);
  assert.equal(calls.at(-1).body.reply_markup.inline_keyboard[0][1].callback_data, 'top:gpu');
  count = t.queue.length; t.disable();
  await t.processUpdates([click(10, 'cpu')], now + 10000);
  assert.equal(t.queue.length, count);
  console.log('PASS: menu, immediate click, CPU/GPU/memory, authorization, invalid callback, plain top, direct command, stale sample, delivery markup, disabled commands');
}
test().then(() => {
  target.data = Buffer.from(source);
  let offset = 0;
  for (const item of entries) {
    item.entry.offset = String(offset); item.entry.size = item.data.length; offset += item.data.length;
    if (item.entry.integrity) {
      const blockSize = item.entry.integrity.blockSize;
      const hash = data => crypto.createHash('sha256').update(data).digest('hex');
      const blocks = [];
      for (let i = 0; i < item.data.length; i += blockSize) blocks.push(hash(item.data.subarray(i, i + blockSize)));
      item.entry.integrity = { algorithm: 'SHA256', hash: hash(item.data), blockSize, blocks };
    }
  }
  const json = Buffer.from(JSON.stringify(header));
  const padded = Math.ceil((4 + json.length) / 4) * 4;
  const prefix = Buffer.alloc(12 + padded);
  prefix.writeUInt32LE(4, 0); prefix.writeUInt32LE(4 + padded, 4); prefix.writeUInt32LE(padded, 8); prefix.writeUInt32LE(json.length, 12); json.copy(prefix, 16);
  const result = Buffer.concat([prefix, ...entries.map(e => e.data)]);
  for (const item of entries) assert(result.subarray(prefix.length + Number(item.entry.offset), prefix.length + Number(item.entry.offset) + item.entry.size).equals(item.data));
  fs.copyFileSync(archive, 'resources/app.before-top-menu.asar', fs.constants.COPYFILE_EXCL);
  fs.writeFileSync(archive + '.tmp', result); fs.renameSync(archive + '.tmp', archive);
  console.log('Updated archive; verified all ' + entries.length + ' file payloads.');
}).catch(error => { console.error(error); process.exitCode = 1; });
