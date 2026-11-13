const { app, BrowserWindow, ipcMain, safeStorage, session } = require('electron');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { EnergyMeter, report } = require('./telegram-report');
const { topText, alertLeaders } = require('./process-metrics');
let config = { enabled: false, commandsEnabled: true, chatId: '', proxy: '', secret: '' };
let offline = false;
function setOffline(value) {
  offline = value === true;
  if (offline) { generation++; queue = []; void network?.closeAllConnections(); }
}
let win, file, network, last = '尚未发送', queue = [], running = false, generation = 0;
let latest = null, meter, routeLookup = null, pollTimer, pollTask = null, pollOffset = 0, commandStateFile, recentChats = new Map(), stopped = false, lastCommandAt = 0;
let commandStatus = '等待绑定私聊', nextPollAt = 0;
let healthTimer, healthFile, lastPollAt = null;
function writeHealth() {
  try { fs.writeFileSync(healthFile, JSON.stringify({ updatedAt: Date.now(), stopped, lastPollAt, lastSampleAt: latest?.ts ?? null, commandStatus, deliveryStatus: last, commandsEnabled: config.commandsEnabled, alarmsEnabled: config.enabled, processSampleAt:latest?.processes?.ts??null,processCount:latest?.processes?.rows?.length??0,processNetwork:latest?.processes?.netSource??null,processNetworkError:latest?.processes?.netError??null,processNetworkEventsLost:latest?.processes?.eventsLost??null })); } catch {}
}
function publicConfig() { return { enabled: config.enabled, commandsEnabled: config.commandsEnabled, chatId: config.chatId, proxy: config.proxy, hasToken: !!config.secret, status: last, commandStatus }; }
function token() {
  try { return safeStorage.decryptString(Buffer.from(config.secret, 'base64')); }
  catch { throw new Error('无法解密 Token，请重新填写并保存。'); }
}
async function configureNetwork() {
  await network.setProxy(config.proxy ? { mode: 'fixed_servers', proxyRules: config.proxy } : { mode: 'system' });
  await network.closeAllConnections();
}
function validate(input) {
  const t = String(input.token || '').trim(), chatId = String(input.chatId || '').trim(), proxy = String(input.proxy || '').trim();
  if (t && !/^\d+:[A-Za-z0-9_-]{20,}$/.test(t)) throw new Error('Bot Token 格式不正确。');
  if (chatId && !/^\d+$/.test(chatId)) throw new Error('个人私聊 Chat ID 应为正整数。');
  if (proxy) {
    let u; try { u = new URL(proxy); } catch { throw new Error('代理格式示例：http://127.0.0.1:7890'); }
    if (!['http:', 'socks5:'].includes(u.protocol) || !u.port || u.username || u.password || !['', '/'].includes(u.pathname) || u.search || u.hash) throw new Error('代理仅支持无密码的 http://地址:端口 或 socks5://地址:端口。');
  }
  if (input.enabled && (!chatId || !(t || config.secret))) throw new Error('启用前请填写 Token 和 Chat ID。');
  return { t, chatId, proxy };
}
async function save(input) {
  const { t, chatId, proxy } = validate(input);
  if (t && !safeStorage.isEncryptionAvailable()) throw new Error('Windows 密钥保护不可用，无法保存 Token。');
  const next = { enabled: input.enabled === true, commandsEnabled: input.commandsEnabled !== false, chatId, proxy, secret: t ? safeStorage.encryptString(t).toString('base64') : config.secret };
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file + '.tmp', JSON.stringify(next), 'utf8');
  fs.renameSync(file + '.tmp', file);
  if (pollTask) await pollTask;
  const changedBot = t && t !== (config.secret ? token() : '');
  config = next; generation++; queue = []; nextPollAt = 0;
  if (changedBot) { pollOffset = 0; recentChats.clear(); }
  await configureNetwork();
  last = '设置已保存'; return publicConfig();
}
async function api(method, body) {
  if (offline) throw new Error('仅本地模式已启用，Telegram 网络请求被阻止。');
  let response, data;
  try {
    response = await network.fetch('https://api.telegram.org/bot' + token() + '/' + method, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(15000), redirect: 'error'
    });
    data = await response.json();
  } catch {
    const e = new Error('连接 Telegram 失败或超时，请检查网络和代理设置。'); e.retry = true; throw e;
  }
  if (!response.ok || !data.ok) {
    const code = data.error_code || response.status;
    const descriptions = { 400: 'Chat ID 无效或请求不正确', 401: 'Token 无效', 403: '请先向机器人发送 /start，并确认未屏蔽机器人', 409: '机器人正在由其他程序接收消息；请使用专用机器人或手动填写 Chat ID', 429: '发送过于频繁' };
    const e = new Error('Telegram ' + code + '：' + (descriptions[code] || '服务暂时不可用'));
    e.retry = code === 429 || code >= 500; e.delay = Math.max(1000, Number(data.parameters?.retry_after || 0) * 1000); throw e;
  }
  return data.result;
}
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
async function deliver(text, gen, kind = 'alarm', replyMarkup) {
  for (let attempt = 0; attempt < 3; attempt++) {
    if (gen !== generation || (kind === 'alarm' ? !config.enabled : !config.commandsEnabled)) return;
    try { await api('sendMessage', { chat_id: config.chatId, text: text.slice(0, 4000), ...(replyMarkup ? { reply_markup: replyMarkup } : {}) }); last = '发送成功：' + new Date().toLocaleString(); return; }
    catch (e) {
      last = '发送失败：' + e.message;
      if (!e.retry || attempt === 2 || e.delay > 60000) return;
      await delay(Math.max(e.delay || 0, 2000 * (attempt + 1)));
    }
  }
}
async function drain() {
  if (running) return; running = true;
  try { while (queue.length) { const job = queue.shift(); await deliver(job.text, job.gen, job.kind, job.replyMarkup); await delay(1100); } }
  finally { running = false; }
}
function notify(title, body) {
  if (!config.enabled || offline) return;
  if (queue.length >= 30) { last = '待发送报警过多，已丢弃最旧的一条'; queue.shift(); }
  queue.push({ gen: generation, text: '【SysMonitor 报警】\n电脑：' + os.hostname() + '\n时间：' + new Date().toLocaleString() + '\n' + title + '\n' + body + (/^恢复正常/.test(title) ? '' : alertLeaders(latest,title)) });
  void drain();
}
function fingerprint() { return crypto.createHash('sha256').update(config.secret).digest('hex'); }
function persistOffset() {
  try { fs.writeFileSync(commandStateFile + '.tmp', JSON.stringify({ bot: fingerprint(), offset: pollOffset })); fs.renameSync(commandStateFile + '.tmp', commandStateFile); } catch {}
}
function sample(snapshot) { latest = snapshot; meter?.sample(snapshot.power); }
function bindRoute(fn) { routeLookup = fn; }
async function statusText(command = '/status') {
  let route = null;
  try { route = await routeLookup?.(['api.telegram.org']); } catch {}
  const text = report(latest, meter, Date.now(), route);
  if (command === '/power' && text.includes('整机功耗：')) return text.slice(0, text.indexOf('\nCPU：')) + '\n\n' + text.slice(text.indexOf('整机功耗：'), text.indexOf('\n主网卡：')).trim();
  if (command === '/network' && text.includes('主网卡：')) return text.slice(0, text.indexOf('\nCPU：')) + '\n\n' + text.slice(text.indexOf('主网卡：'));
  return text;
}
let readAlertSettings, writeAlertSettings;
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
const menuKeyboard = { inline_keyboard: [
  [{ text: '电脑状态', callback_data: 'menu:status' }, { text: '进程排行', callback_data: 'menu:top' }],
  [{ text: '温度', callback_data: 'menu:temperature' }, { text: '网络', callback_data: 'menu:network' }],
  [{ text: '用电', callback_data: 'menu:power' }, { text: '告警设置', callback_data: 'cfg:home' }]
] };
const backKeyboard = { inline_keyboard: [[{ text: '返回主菜单', callback_data: 'menu:home' }]] };
const menuText = '【SysMonitor 主菜单】\n请选择要查看的内容：';
function temperatureReply(page = 0) {
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
async function menuReply(action) {
  if (action === 'home') return { text: menuText, keyboard: menuKeyboard };
  if (action === 'top') return { text: '请选择要查看的进程排行：', keyboard: topKeyboard };
  if (/^temperature(?::\d+)?$/.test(action)) return temperatureReply(action.split(':')[1]);
  return { text: await statusText('/' + action), keyboard: backKeyboard };
}
const topKeyboard = { inline_keyboard: [[
  { text: 'CPU', callback_data: 'top:cpu' },
  { text: 'GPU', callback_data: 'top:gpu' },
  { text: '内存', callback_data: 'top:memory' }
], [{ text: '返回主菜单', callback_data: 'menu:home' }]] };
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
async function processUpdates(updates, now = Date.now()) {
  if (stopped) return;
  for (const u of updates) {
    if (!Number.isSafeInteger(u.update_id) || u.update_id < pollOffset) continue;
    pollOffset = u.update_id + 1;
    const callback = u.callback_query;
    if (callback) {
      const message = callback.message;
      const allowed = config.commandsEnabled && message?.chat?.type === 'private'
        && String(message.chat.id) === config.chatId
        && String(callback.from?.id) === config.chatId && !callback.from?.is_bot;
      const selection = /^(?:top:(cpu|gpu|memory)|menu:(home|status|top|temperature(?::[0-9]{1,6})?|network|power)|cfg:([A-Za-z]+(?::[0-9]{1,3})?))$/.exec(callback.data || '');
      const throttled = now - lastTopClickAt < 1000;
      try {
        await api('answerCallbackQuery', { callback_query_id: callback.id,
          text: !allowed ? '仅绑定的私聊可查询，请检查指令开关。' : !selection ? '请重新发送 /menu。' : throttled ? '请稍后再点。' : '正在读取…' });
      } catch { /* An expired callback must not stop update polling. */ }
      if (!allowed || !selection || throttled) continue;
      lastTopClickAt = now;
      const reply = selection[3] ? alertSettingsReply(selection[3]) : selection[1] ? { text: topReply(selection[1]), keyboard: topKeyboard } : await menuReply(selection[2]);
      enqueueCommand(reply.text, reply.keyboard);
      commandStatus = '已收到按钮指令 ' + callback.data + '：' + new Date(now).toLocaleString();
      continue;
    }
    const m = u.message;
    if (m?.chat?.type === 'private') {
      recentChats.set(String(m.chat.id), { id: String(m.chat.id), name: [m.chat.first_name, m.chat.last_name].filter(Boolean).join(' ') + (m.chat.username ? ' (@' + m.chat.username + ')' : '') });
      if (recentChats.size > 30) recentChats.delete(recentChats.keys().next().value);
    }
    // Never send private machine/network data to another user or a group.
    if (!config.commandsEnabled || m?.chat?.type !== 'private' || String(m.chat.id) !== config.chatId || String(m.from?.id) !== config.chatId || m.from?.is_bot || !Number.isFinite(m.date) || Math.abs(now / 1000 - m.date) > 120) continue;
    const match = /^(?:\/(start|status|power|network|help|top|menu)(?:@[A-Za-z0-9_]+)?|(?:top))(?=\s|$)/i.exec(m.text || '');
    if (!match || now - lastCommandAt < 3000) continue;
    lastCommandAt = now;
    const command = '/' + (match[1] || 'top').toLowerCase();
    const metric = (m.text || '').trim().split(/\s+/)[1]?.toLowerCase();
    const text = command === '/menu' ? menuText : command === '/top' ? (metric ? topReply(metric) : '请选择要查看的进程排行：') : command === '/help' ? 'SysMonitor 指令\n/menu：按钮主菜单（状态、进程、温度、网络、用电）\n/status 或 /start：电脑完整状态\n/power：功耗与累计用电（kWh/度）\n/network：IP、网关、DNS 与 VPN 线路\n/top：点击按钮选择 CPU、GPU 或内存排行\n/top cpu | memory | gpu | vram | network | io：直接查询\n只响应已绑定的个人私聊。电脑与 SysMonitor 需要保持运行。\n电量只累计有效功耗采样，不补算缺失时段。' : await statusText(command);
    enqueueCommand(text, command === '/menu' || command === '/start' ? menuKeyboard : command === '/top' ? topKeyboard : backKeyboard);
    commandStatus = '已收到指令 ' + command + '：' + new Date(now).toLocaleString();
  }
  persistOffset();
}
async function poll() {
  if (offline || stopped || pollTask || Date.now() < nextPollAt || !config.commandsEnabled || !config.chatId || !config.secret) return;
  pollTask = (async () => {
    try {
      const updates = await api('getUpdates', { offset: pollOffset, timeout: 0, limit: 100, allowed_updates: ['message', 'callback_query'] });
      await processUpdates(updates);
      lastPollAt = Date.now();
      if (!commandStatus.startsWith('已收到')) commandStatus = '指令监听正常，发送 /menu 打开主菜单';
    } catch (e) { commandStatus = '指令监听失败：' + e.message; nextPollAt = Date.now() + Math.max(15000, e.delay || 0); }
  })();
  try { await pollTask; } finally { pollTask = null; }
}
function stop() { stopped = true; generation++; queue = []; clearInterval(pollTimer); clearInterval(healthTimer); meter?.flush(); writeHealth(); }
function show() {
  if (win && !win.isDestroyed()) { win.show(); win.focus(); return; }
  win = new BrowserWindow({ width: 680, height: 860, minWidth: 540, minHeight: 650, title: 'Telegram 报警设置', autoHideMenuBar: true,
    webPreferences: { preload: path.join(__dirname, 'telegram-preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true } });
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', e => e.preventDefault());
  win.loadFile(path.join(__dirname, 'telegram.html'));
  win.on('closed', () => { win = null; });
}
async function init() {
  file = path.join(app.getPath('userData'), 'telegram-alerts.json');
  try { const saved = JSON.parse(fs.readFileSync(file, 'utf8')); config = { ...config, ...saved }; validate({ ...config, token: '' }); } catch { config = { enabled: false, commandsEnabled: true, chatId: '', proxy: '', secret: '' }; }
  commandStateFile = path.join(app.getPath('userData'), 'telegram-command-state.json');
  healthFile = path.join(app.getPath('userData'), 'telegram-runtime.json');
  try { const state = JSON.parse(fs.readFileSync(commandStateFile, 'utf8')); if (state.bot === fingerprint() && Number.isSafeInteger(state.offset) && state.offset >= 0) pollOffset = state.offset; } catch {}
  meter = new EnergyMeter(path.join(app.getPath('userData'), 'telegram-energy.json'));
  network = session.fromPartition('sysmonitor-telegram', { cache: false });
  try { await configureNetwork(); } catch { last = '代理初始化失败，请在此窗口重新保存网络设置。'; }
  ipcMain.handle('telegram:action', async (event, action, input) => {
    if (!win || event.sender !== win.webContents || event.senderFrame !== win.webContents.mainFrame) return { ok: false, error: '无效窗口' };
    try {
      if (action === 'get') return { ok: true, data: publicConfig() };
      if (action === 'save') return { ok: true, data: await save(input) };
      if (action === 'discover') {
        if (pollTask) await pollTask;
        if (config.commandsEnabled && config.chatId) return { ok: true, data: recentChats.size ? [...recentChats.values()] : [{ id: config.chatId, name: '当前绑定的私聊' }] };
        const updates = await api('getUpdates', { timeout: 0, limit: 100 });
        const chats = new Map();
        for (const u of updates) { const c = u.message?.chat; if (c?.type === 'private') chats.set(String(c.id), { id: String(c.id), name: [c.first_name, c.last_name].filter(Boolean).join(' ') + (c.username ? ' (@' + c.username + ')' : '') }); }
        return { ok: true, data: [...chats.values()] };
      }
      if (action === 'test') {
        if (!config.chatId || !config.secret) throw new Error('请先保存 Token 和 Chat ID。');
        await api('sendMessage', { chat_id: config.chatId, text: '【SysMonitor 测试通知】\n电脑：' + os.hostname() + '\n时间：' + new Date().toLocaleString() + '\nTelegram 通道连接成功。启用 TG 推送和程序告警后，异常通知会发送到这里。' });
        last = '测试发送成功：' + new Date().toLocaleString(); return { ok: true, data: publicConfig() };
      }
      if (action === 'status') {
        if (!config.chatId || !config.secret) throw new Error('请先保存 Token 和 Chat ID。');
        await api('sendMessage', { chat_id: config.chatId, text: await statusText() });
        last = '状态报告发送成功：' + new Date().toLocaleString(); return { ok: true, data: publicConfig() };
      }
      throw new Error('未知操作');
    } catch (e) { last = e.message; return { ok: false, error: e.message }; }
  });
  pollTimer = setInterval(() => void poll(), 3000);
  healthTimer = setInterval(writeHealth, 5000);
  app.on('will-quit', stop);
}
module.exports = { bindAlertSettings, init, show, notify, sample, bindRoute, stop, setOffline };
