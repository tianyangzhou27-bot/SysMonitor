// GENERATED FRAGMENT — extracted from out/renderer/assets/index-CzIv0K4n.js, lines 24469-24528.
// Original module marker: src/renderer/components/ProcessCard.tsx. Not original TypeScript/TSX; not standalone.
var TABS = [
	{
		key: "cpu",
		label: "CPU"
	},
	{
		key: "mem",
		label: "内存"
	},
	{
		key: "net",
		label: "网络"
	}
];
function memText(bytes) {
	if (bytes == null) return "--";
	return bytes >= 1024 ** 3 ? `${(bytes / 1024 ** 3).toFixed(1)} GB` : `${Math.round(bytes / 1024 ** 2)} MB`;
}
function rateText(bytes) {
	const p = rateParts(bytes);
	return p.value == null ? "--" : `${p.value.toFixed(p.decimals)} ${p.unit}`;
}
function weight(row, tab, source) {
	if (tab === "cpu") return row.cpuPercent ?? 0;
	if (tab === "mem") return row.memBytes ?? 0;
	return source === "clash" ? (row.netDownBytesPerSec ?? 0) + (row.netUpBytesPerSec ?? 0) : row.netConns ?? 0;
}
function valueText(row, tab, source) {
	if (tab === "cpu") return row.cpuPercent == null ? "--" : `${row.cpuPercent.toFixed(1)}%`;
	if (tab === "mem") return memText(row.memBytes);
	if (source === "clash") return `↓ ${rateText(row.netDownBytesPerSec)}  ↑ ${rateText(row.netUpBytesPerSec)}`;
	return `${row.netConns ?? 0} 个连接`;
}
function ProcessCard({ data }) {
  const h = import_react.createElement;
  const [tab,setTab]=import_react.useState('cpu');
  const [merged,setMerged]=import_react.useState(false);
  const tabs=[['cpu','CPU'],['mem','内存'],['gpu','GPU'],['vram','显存'],['net','网络'],['io','I/O']];
  const rows=(merged?data?.apps:data?.procs)?.[tab]||[];
  const n=(x,suffix='')=>typeof x==='number'&&Number.isFinite(x)?x.toFixed(1)+suffix:'--';
  const bytes=x=>x==null?'--':n(x/1048576,' MB');
  const rate=x=>x==null?'--':x>=1048576?n(x/1048576,' MB/s'):n(x/1024,' KB/s');
  const value=r=>tab==='cpu'?n(r.cpuPercent,'%'):tab==='mem'?bytes(r.memBytes):tab==='gpu'?n(r.gpuPercent,'%')+(r.gpuEngine?' '+r.gpuEngine:''):tab==='vram'?bytes(r.gpuMemoryBytes):tab==='io'?rate(r.ioBytesPerSec):'↓'+rate(r.netDownBytesPerSec)+' ↑'+rate(r.netUpBytesPerSec);
  const open=()=>window.api.processes.open();
  const items=rows.map((r,i)=>{
    const name=h('span',{className:'proc__name',title:r.name},r.name,h('em',null,merged?' ×'+r.count:' · PID '+r.pid));
    const line=h('div',{className:'proc__line'},name,h('span',{className:'proc__val'},value(r)));
    return h('li',{className:'proc__row',key:r.pid||r.name},h('span',{className:'proc__rank'},i+1),h('div',{className:'proc__main'},line));
  });
  return h(GlassCard,{className:'panel proc'},
    h('div',{className:'panel__head'},h('span',null,'进程 Top 10'),h('button',{className:'seg seg--right',onClick:open,title:'查看完整列表、搜索、详情和进程操作'},'管理 / 搜索')),
    h('div',{className:'seg seg--full'},tabs.map(([key,label])=>h('button',{key,className:tab===key?'is-on':'',onClick:()=>setTab(key)},label))),
    h('div',{className:'seg',style:{marginTop:8}},h('button',{className:!merged?'is-on':'',onClick:()=>setMerged(false)},'按进程'),h('button',{className:merged?'is-on':'',onClick:()=>setMerged(true)},'按应用')),
    tab==='net'?h('p',{className:'proc__note'},data?.netSource==='etw'?'Windows ETW 按 PID 采集 TCP/UDP；代理与回环流量不可重复相加。':data?.netError||'等待系统级网络采集'):null,
    tab==='io'?h('p',{className:'proc__note'},'包括文件、网络和设备 I/O，不等于纯磁盘读写。'):null,
    tab==='gpu'&&merged?h('p',{className:'proc__note'},'应用组显示其中最忙进程的 GPU 占用，不相加。'):null,
    h('ol',{className:'proc__list'},items),
    !rows.length?h('p',{className:'panel__hint'},'等待进程采集…'):null
  );
}
