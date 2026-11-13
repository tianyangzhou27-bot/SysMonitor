const valid = n => typeof n === 'number' && Number.isFinite(n);
const metricKeys = { cpu: 'cpuPercent', mem: 'memBytes', gpu: 'gpuPercent', vram: 'gpuMemoryBytes', io: 'ioBytesPerSec' };
function score(row, key) {
  if (key === 'net') return valid(row.netDownBytesPerSec) && valid(row.netUpBytesPerSec) ? row.netDownBytesPerSec + row.netUpBytesPerSec : null;
  const value = row[metricKeys[key] || metricKeys.cpu]; return valid(value) ? value : null;
}
function ranked(rows, key, max = 10) { return [...rows].sort((a, b) => (score(b, key) ?? -1) - (score(a, key) ?? -1) || a.name.localeCompare(b.name) || (a.pid || 0) - (b.pid || 0)).slice(0, max); }
function gpuByPid(raw) {
  const byPid = new Map();
  const row = pid => { if (!byPid.has(pid)) byPid.set(pid, { engines: new Map(), gpuMemoryBytes: null, gpuSharedBytes: null }); return byPid.get(pid); };
  for (const [name, value] of Object.entries(raw.gpuEng || {})) {
    const m = /^pid_(\d+)_(.+)_engtype_(.+)$/i.exec(name);
    if (!m || !valid(value)) continue;
    const r = row(Number(m[1])), key = m[2] + ':' + m[3];
    const prev = r.engines.get(key); r.engines.set(key, { type: m[3], value: Math.min(100, Math.max(0, (prev?.value || 0) + value)) });
  }
  for (const [counter, field] of [['procGpuMem', 'gpuMemoryBytes'], ['procGpuShared', 'gpuSharedBytes']]) {
    for (const [name, value] of Object.entries(raw[counter] || {})) {
      const m = /^pid_(\d+)_/i.exec(name); if (!m || !valid(value) || value < 0) continue;
      const r = row(Number(m[1])); r[field] = (r[field] || 0) + value;
    }
  }
  return byPid;
}
function build(raw, sample, now = Date.now()) {
  const fresh = sample && valid(sample.ts) && now - sample.ts >= -2000 && now - sample.ts < 5000;
  const gpu = gpuByPid(raw);
  const rows = fresh ? sample.rows.map(p => {
    const g = gpu.get(p.pid), engines = g ? [...g.engines.values()].sort((a,b) => b.value-a.value) : [];
    return { ...p, count: 1, ioBytesPerSec: valid(p.ioReadBytesPerSec) && valid(p.ioWriteBytesPerSec) ? p.ioReadBytesPerSec + p.ioWriteBytesPerSec : null,
      gpuPercent: engines.length ? engines[0].value : (Object.keys(raw.gpuEng || {}).length ? 0 : null), gpuEngine: engines[0]?.type || null,
      gpuMemoryBytes: g?.gpuMemoryBytes ?? null, gpuSharedBytes: g?.gpuSharedBytes ?? null };
  }) : [];
  const groups = new Map();
  for (const p of rows) {
    const key = p.name.toLowerCase();
    if (!groups.has(key)) groups.set(key, { name: p.name, pid: null, identity: null, count: 0, pids: [] });
    const g = groups.get(key); g.count++; g.pids.push(p.pid);
    for (const field of [...Object.values(metricKeys), 'netDownBytesPerSec', 'netUpBytesPerSec']) if (valid(p[field])) g[field] = (g[field] || 0) + p[field];
    // GPU per-process busiest-engine values are not additive across processes.
    g.gpuPercent = valid(p.gpuPercent) ? Math.max(g.gpuMax ?? 0, p.gpuPercent) : (g.gpuMax ?? null); g.gpuMax = g.gpuPercent;
  }
  const lists = rows => Object.fromEntries(['cpu','mem','gpu','vram','net','io'].map(key => [key, ranked(rows,key)]));
  return { rows, apps: lists([...groups.values()]), procs: lists(rows), ts: fresh ? sample.ts : null, netSource: fresh ? sample.netSource : 'stale', netError: fresh ? sample.netError : '进程采集尚未启动或已超过 5 秒未更新', eventsLost: fresh ? sample.eventsLost : null };
}
function format(row, key) {
  const n = (x, suffix, digits=1) => valid(x) ? x.toFixed(digits)+suffix : '未读取';
  const rate = x => !valid(x) ? '未读取' : x >= 1048576 ? n(x/1048576,' MB/s') : n(x/1024,' KB/s');
  if (key === 'cpu' || key === 'gpu') return n(score(row,key),'%') + (key==='gpu' && row.gpuEngine ? ' '+row.gpuEngine : '');
  if (key === 'mem' || key === 'vram') return n(valid(score(row,key)) ? score(row,key)/1048576 : null,' MB');
  if (key === 'net') return '↓'+rate(row.netDownBytesPerSec)+' ↑'+rate(row.netUpBytesPerSec);
  return rate(row.ioBytesPerSec);
}
function topText(data, requested = 'cpu', count = 10) {
  const aliases = { memory:'mem', network:'net', disk:'io', vram:'vram', cpu:'cpu', gpu:'gpu', mem:'mem', net:'net', io:'io' };
  const key = aliases[String(requested).toLowerCase()];
  if (!key) return '用法：/top cpu | memory | gpu | vram | network | io';
  const labels = {cpu:'CPU',mem:'内存（工作集）',gpu:'GPU',vram:'专用显存',net:'网络上传下载',io:'进程 I/O（非纯磁盘）'};
  if (!data?.rows?.length) return '进程采集尚未就绪，请稍后重试。';
  if (key==='net' && data.netSource!=='etw') return '单进程网络暂不可用：'+(data.netError || 'ETW 未启动')+'。不会用连接数代替网速。';
  const rows=ranked(data.rows.filter(r=>score(r,key)!=null),key,count);
  const lines=['【进程 '+labels[key]+' Top '+count+'】',...rows.map((r,i)=>`${i+1}. ${r.name} · PID ${r.pid} · ${format(r,key)}`)];
  if (!rows.length) lines.push('当前没有可用读数。');
  if(key==='net')lines.push('来源：Windows ETW TCP/UDP（IPv4/IPv6）；代理/回环流量可能重复归属，不可把所有进程速率相加当成物理网卡总速率。');
  if(data.eventsLost>0 && key==='net')lines.push('注意：ETW 累计丢失 '+data.eventsLost+' 个事件，统计可能偏低。');
  return lines.join('\n').slice(0,3900);
}
function alertLeaders(snapshot, title) {
  const key = /显存/.test(title) ? 'vram' : /GPU|显卡/.test(title) ? 'gpu' : /CPU/.test(title) ? 'cpu' : /内存/.test(title) ? 'mem' : null;
  if (!key || !snapshot?.processes?.rows?.length) return '';
  return '\n\n触发时资源占用前三名（不代表一定是异常原因）：\n'+ranked(snapshot.processes.rows.filter(r=>score(r,key)!=null),key,3).map(r=>`${r.name} · PID ${r.pid} · ${format(r,key)}`).join('\n');
}
module.exports = { build, ranked, score, format, topText, alertLeaders, gpuByPid };
