const el = id => document.getElementById(id);
const status = text => { el('status').textContent = text; };
async function call(action, input) { const r = await window.telegram.action(action, input); if (!r.ok) throw new Error(r.error); return r.data; }
function render(c) { el('enabled').checked = c.enabled; el('commandsEnabled').checked = c.commandsEnabled !== false; el('chatId').value = c.chatId; el('proxy').value = c.proxy; el('token').value = ''; el('tokenHint').textContent = c.hasToken ? 'Token 已加密保存；留空保留原 Token。' : 'Token 使用 Windows 加密后保存在本机。'; status(c.status + '\n' + (c.commandStatus || '')); }
async function save(discover = false) { const c = await call('save', { enabled: el('enabled').checked && (!discover || !!el('chatId').value.trim()), commandsEnabled: el('commandsEnabled').checked, token: el('token').value, chatId: el('chatId').value, proxy: el('proxy').value }); render(c); return c; }
async function busy(fn) { for (const b of document.querySelectorAll('button')) b.disabled = true; try { await fn(); } catch(e) { status(e.message); } finally { for (const b of document.querySelectorAll('button')) b.disabled = false; } }
el('save').onclick = () => busy(() => save());
el('refresh').onclick = () => busy(async () => { const c = await call('get'); status(c.status + '\n' + (c.commandStatus || '')); });
el('test').onclick = () => busy(async () => { await save(); status('正在发送测试…'); render(await call('test')); });
el('report').onclick = () => busy(async () => { await save(); status('正在发送状态报告…'); render(await call('status')); });
el('discover').onclick = () => busy(async () => {
  await save(true); status('正在读取私聊…'); const chats = await call('discover'); const select = el('chats'); select.replaceChildren();
  const placeholder = document.createElement('option'); placeholder.value = ''; placeholder.textContent = '请选择你自己的私聊'; select.append(placeholder);
  for (const c of chats) { const option = document.createElement('option'); option.value = c.id; option.textContent = c.name + ' — ' + c.id; select.append(option); }
  select.hidden = !chats.length;
  status(chats.length ? '请选择自己的私聊，勾选启用，再点击“保存并发送测试”。' : '没有找到近期私聊。请向新机器人再发一次 /start，然后重试。');
});
el('chats').onchange = () => { if (el('chats').value) el('chatId').value = el('chats').value; };
busy(async () => render(await call('get')));
