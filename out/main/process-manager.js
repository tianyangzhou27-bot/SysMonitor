const el=id=>document.getElementById(id),valid=n=>typeof n==='number'&&Number.isFinite(n);
let snapshot={rows:[]},selected=null,details=null,descending=true,busy=false,requestId=0;
const number=(n,suffix='')=>valid(n)?n.toFixed(1)+suffix:'—';
const bytes=n=>!valid(n)?'—':n>=1073741824?number(n/1073741824,' GB'):number(n/1048576,' MB');
const rate=n=>!valid(n)?'—':n>=1048576?number(n/1048576,' MB/s'):number(n/1024,' KB/s');
const score=(r,k)=>k==='net'?(valid(r.netDownBytesPerSec)&&valid(r.netUpBytesPerSec)?r.netDownBytesPerSec+r.netUpBytesPerSec:null):r[({cpu:'cpuPercent',mem:'memBytes',gpu:'gpuPercent',vram:'gpuMemoryBytes',io:'ioBytesPerSec'})[k]];
async function call(name,input){const r=await window.processManager.action(name,input);if(!r.ok)throw Error(r.error);return r.data;}
function message(text){el('message').textContent=text;}
function render(){
 const query=el('search').value.trim().toLowerCase(),key=el('sort').value;
 const rows=snapshot.rows.filter(r=>r.name.toLowerCase().includes(query)||String(r.pid).includes(query));
 rows.sort((a,b)=>{const av=score(a,key),bv=score(b,key);if(!valid(av))return valid(bv)?1:a.pid-b.pid;if(!valid(bv))return -1;return(descending?bv-av:av-bv)||a.pid-b.pid;});
 el('count').textContent=`${rows.length} / ${snapshot.rows.length} 个进程`;
 el('source').textContent=snapshot.netSource==='etw'?`网络来源：Windows ETW · TCP/UDP · IPv4/IPv6。包含直连与代理进程；代理/回环流量不可重复相加。${snapshot.eventsLost>0?'累计丢失 '+snapshot.eventsLost+' 个事件，统计可能偏低。':''}`:`单进程网络暂不可用：${snapshot.netError||'等待 ETW 采集'}。不会把未知值当作 0。`;
 const fragment=document.createDocumentFragment();
 for(const r of rows){const tr=document.createElement('tr');if(selected?.pid===r.pid&&selected.identity===r.identity)tr.className='selected';const first=document.createElement('td'),button=document.createElement('button');button.textContent=r.name;button.onclick=()=>select(r);first.append(button);tr.append(first);for(const text of [r.pid,number(r.cpuPercent,'%'),bytes(r.memBytes),number(r.gpuPercent,'%')+(r.gpuEngine?' '+r.gpuEngine:''),bytes(r.gpuMemoryBytes),rate(r.netDownBytesPerSec),rate(r.netUpBytesPerSec),rate(r.ioBytesPerSec)]){const td=document.createElement('td');td.textContent=text;tr.append(td);}fragment.append(tr);}
 el('rows').replaceChildren(fragment);
 if(selected&&!snapshot.rows.some(r=>r.pid===selected.pid&&r.identity===selected.identity)){el('location').disabled=true;el('terminate').disabled=true;el('detailTitle').textContent=selected.name+' · 已退出或数据已过期';}
}
async function select(row){
 const id=++requestId;selected={...row};details=null;el('location').disabled=true;el('terminate').disabled=true;el('detailTitle').textContent=row.name+' · PID '+row.pid;el('detailText').textContent='读取进程详情…';message('');render();
 if(!row.identity){el('detailText').textContent='权限不足，无法核对该进程的启动身份。';return;}
 try{const d=await call('details',{pid:row.pid,identity:row.identity});if(id!==requestId)return;details=d;el('detailText').textContent=`路径：${d.path||'权限不足或不可用'}\n启动时间：${new Date(d.startedAt).toLocaleString()}\n优先级：${d.priority||'未读取'} · 会话：${d.sessionId??'未知'}\nCPU ${number(row.cpuPercent,'%')} · 内存 ${bytes(row.memBytes)} · GPU ${number(row.gpuPercent,'%')}\n网络 ↓${rate(row.netDownBytesPerSec)} ↑${rate(row.netUpBytesPerSec)}\n专用显存 ${bytes(row.gpuMemoryBytes)} · 共享显存 ${bytes(row.gpuSharedBytes)}`;el('location').disabled=!d.path;el('terminate').disabled=!d.canTerminate;}catch(e){if(id===requestId)el('detailText').textContent=e.message;}
}
async function action(name){if(!selected||!details||busy)return;busy=true;el('location').disabled=true;el('terminate').disabled=true;try{const result=await call(name,{pid:selected.pid,identity:selected.identity});message(name==='terminate'?(result?.cancelled?'已取消。':'已结束选中的单个进程。'):'已打开文件位置。');}catch(e){message(e.message);}finally{busy=false;const live=snapshot.rows.some(r=>r.pid===selected?.pid&&r.identity===selected?.identity);el('location').disabled=!live||!details?.path;el('terminate').disabled=!live||!details?.canTerminate;}}
el('location').onclick=()=>action('location');el('terminate').onclick=()=>action('terminate');el('search').oninput=render;el('sort').onchange=render;el('direction').onclick=()=>{descending=!descending;el('direction').textContent=descending?'从高到低 ↓':'从低到高 ↑';render();};
let refreshing=false;async function refresh(){if(refreshing)return;refreshing=true;try{snapshot=await call('snapshot');render();}catch(e){message(e.message);}finally{refreshing=false;}}refresh();setInterval(refresh,1000);
