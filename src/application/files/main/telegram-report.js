const fs = require('fs');
const os = require('os');
const valid = n => typeof n === 'number' && Number.isFinite(n);
const number = (n, unit = '', digits = 1) => valid(n) ? n.toFixed(digits) + unit : '未读取';
const gb = n => number(valid(n) ? n / 1073741824 : null, ' GB');
function duration(sec) {
  if (!valid(sec)) return '未知';
  const n = Math.max(0, Math.floor(sec));
  return `${Math.floor(n / 3600)}小时${Math.floor(n % 3600 / 60)}分${n % 60}秒`;
}
class EnergyMeter {
  constructor(file, now = Date.now(), uptime = os.uptime()) {
    this.file = file; this.previous = null; this.lastSave = 0;
    this.data = { bootAt: now - uptime * 1000, startedAt: now, kwh: 0, measuredKwh: 0, estimatedKwh: 0, coveredMs: 0 };
    try {
      const d = JSON.parse(fs.readFileSync(file, 'utf8'));
      if (Math.abs(d.bootAt - this.data.bootAt) < 120000 && ['startedAt', 'kwh', 'measuredKwh', 'estimatedKwh', 'coveredMs'].every(k => valid(d[k]) && d[k] >= 0)) this.data = d;
    } catch {}
  }
  sample(power, now = Date.now(), uptime = os.uptime()) {
    const bootAt = now - uptime * 1000;
    if (Math.abs(bootAt - this.data.bootAt) > 120000) {
      this.data = { bootAt, startedAt: now, kwh: 0, measuredKwh: 0, estimatedKwh: 0, coveredMs: 0 }; this.previous = null;
    }
    // Never turn an unavailable CPU reading into a fabricated whole-machine total.
    const watts = power?.totalW;
    const source = power?.source === 'smart-plug' ? 'measured' : 'estimated';
    if (!valid(watts) || watts < 0) { this.previous = null; return; }
    if (this.previous) {
      const dt = now - this.previous.time;
      // Ignore sleep, stopped monitoring, backwards clocks and long gaps.
      if (dt > 0 && dt <= 15000 && this.previous.source === source) {
        const kwh = (this.previous.watts + watts) / 2 * dt / 3600000000;
        this.data.kwh += kwh; this.data[source + 'Kwh'] += kwh; this.data.coveredMs += dt;
      }
    }
    this.previous = { time: now, watts, source };
    if (now - this.lastSave >= 30000) { this.flush(); this.lastSave = now; }
  }
  flush() {
    try { fs.writeFileSync(this.file + '.tmp', JSON.stringify(this.data)); fs.renameSync(this.file + '.tmp', this.file); } catch {}
  }
  describe(uptime) {
    const d = this.data;
    const lines = ['本次系统启动后累计用电：'];
    if (d.coveredMs > 0) {
      lines.push(`已记录 ${d.kwh.toFixed(4)} kWh（度）`, `其中估算 ${d.estimatedKwh.toFixed(4)}、插座实测 ${d.measuredKwh.toFixed(4)} kWh`, `有效功耗覆盖：${duration(d.coveredMs / 1000)} / 开机 ${duration(uptime)}`);
    } else lines.push('暂无有效功耗积分，不能计算为 0 度。');
    lines.push('仅累计有有效采样的时段；程序未运行、缺失采样与休眠间隔不补算。');
    return lines.join('\n');
  }
}
function report(snapshot, meter, now = Date.now(), tgRoute = null) {
  const uptime = os.uptime();
  if (!snapshot) return '【SysMonitor 状态】\n正在等待第一份监控数据，请稍后发送 /status。';
  const s = snapshot, n = s.network || {}, p = s.power || {}, c = s.cpu || {}, g = s.gpu || {}, m = s.memory || {}, proxy = s.proxy || {};
  const lines = ['【SysMonitor 电脑状态】', `电脑：${os.hostname()}`, `报告时间：${new Date(now).toLocaleString()}`, `监控采样：${valid(s.ts) ? new Date(s.ts).toLocaleString() : '未知'}`, `已开机：${duration(uptime)}`];
  if (!valid(s.ts) || now - s.ts > 15000) lines.push('⚠ 监控数据已过期，以下可能不是实时状态。');
  lines.push('', `CPU：${c.model || '未知'} · ${c.physicalCores ?? '?'}核/${c.logicalCores ?? '?'}线程`, `负荷 ${number(c.usage, '%')} · 温度 ${number(c.tempC, '℃')} · 频率 ${number(c.freqGHz, ' GHz', 2)}`, `GPU：${g.name || '未知'}`, `负荷 ${number(g.usage, '%')} · 温度 ${number(g.tempC, '℃')} · 显存 ${gb(g.memUsedBytes)} / ${gb(g.memTotalBytes)}`, `内存：${gb(m.usedBytes)} / ${gb(m.totalBytes)}（${number(m.usagePercent, '%')}）`);
  for (const d of (s.disk?.volumes || []).slice(0, 8)) lines.push(`磁盘 ${d.mount}：已用 ${number(d.usagePercent, '%')}`);
  lines.push('', `整机功耗：${number(p.totalW, ' W')}（${p.source === 'smart-plug' ? '智能插座实测' : '硬件功耗估算，非墙插实测'}）`, `CPU ${number(p.cpuW, ' W')} / GPU ${number(p.gpuW, ' W')} / 其他 ${number(p.otherW, ' W')}`, meter.describe(uptime));
  if (!valid(p.totalW)) lines.push('整机功耗缺失：Windows 计数器和 CPU Package Power 传感器均无有效读数；不能凭 GPU 功耗推算整机耗电。');
  if (!s.lhmOnline) lines.push('硬件传感器服务未连接：部分温度、功耗数据不可用。');
  lines.push('', `主网卡：${n.primary?.name || '未读取'}`, `本地 IPv4：${n.primary?.ip4 || '未读取'}`, `网关：${n.primary?.gateway || '未读取'}`, `DNS：${n.dns?.join(' / ') || '未读取'}`, `国内出口 IP：${n.publicIp?.domestic || '未读取'}`, `海外出口 IP：${n.publicIp?.overseas || '未读取'}${n.publicIp?.overseasLoc ? '（' + n.publicIp.overseasLoc + '）' : ''}`, `出口 IP 采样：${n.publicIp?.updatedAt ? new Date(n.publicIp.updatedAt).toLocaleString() : '暂无'}`, `网速：↓${number(valid(n.rxBytesPerSec) ? n.rxBytesPerSec / 1024 : null, ' KB/s')} ↑${number(valid(n.txBytesPerSec) ? n.txBytesPerSec / 1024 : null, ' KB/s')}`);
  lines.push('', `VPN / 代理：${proxy.route?.text || '未读取'}`, `Telegram 连接路由：${tgRoute || '未能识别具体连接线路'}`);
  if (proxy.clash?.available) {
    const modes = { rule: '规则分流', global: '全局', direct: '直连' };
    lines.push(`Clash / mihomo：${modes[proxy.clash.mode] || proxy.clash.mode || '未知模式'} · TUN ${proxy.clash.tun ? '开启' : '关闭'}`);
    lines.push('当前活跃节点（按连接数，规则模式可同时走多路）：');
    for (const node of (proxy.clash.nodes || []).slice(0, 5)) lines.push(`• ${node.name} · ${node.connections}连接 · ${number(node.delayMs, ' ms', 0)}`);
    if (!proxy.clash.nodes?.length) lines.push('没有观察到活跃代理节点。');
  }
  lines.push('', '指令：/status 总览 · /power 功耗电量 · /network 网络线路 · /help 帮助');
  return lines.join('\n').slice(0, 3900);
}
module.exports = { EnergyMeter, report, duration };
