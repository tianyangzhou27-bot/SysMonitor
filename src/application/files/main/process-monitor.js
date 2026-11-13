const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const { spawn, execFile } = require('child_process');
const path = require('path');
const fs = require('fs');
const readline = require('readline');
const metrics = require('./process-metrics');
let child = null, timer, stopped = false, latest = null, window = null, snapshot = null, lastError = null;
function executable() { return path.join(app.isPackaged ? process.resourcesPath : path.join(app.getAppPath(), 'resources'), 'processes', 'SysMonitor-Processes.exe'); }
function start() {
  stopped=false;
  if(child)return;
  if(!fs.existsSync(executable())) { lastError='进程采集组件尚未安装';return; }
  child=spawn(executable(),['--watch',String(process.pid)],{windowsHide:true,stdio:['pipe','pipe','pipe']});
  const owned=child;
  const lines=readline.createInterface({input:owned.stdout});
  lines.on('line',line=>{try{if(line.length>2000000)return;const data=JSON.parse(line);if(Array.isArray(data.rows)&&Number.isFinite(data.ts)){latest=data;lastError=null;}else if(data.error)lastError=data.error;}catch{lastError='进程采集数据格式异常';}});
  owned.stderr.on('data',()=>{lastError='进程采集组件报告错误';});
  owned.on('error',()=>{lastError='无法启动进程采集组件';});
  owned.on('close',()=>{lines.close();if(child===owned)child=null;if(!stopped)timer=setTimeout(start,3000);});
}
function stop() { stopped=true;clearTimeout(timer);if(child){child.stdin.end();const owned=child;const t=setTimeout(()=>owned.kill(),1500);t.unref?.();} }
function enrich(raw, snap) {
  snapshot=snap;
  snap.processes=metrics.build(raw,latest);
  if(lastError&&!snap.processes.rows.length)snap.processes.netError=lastError;
  return snap.processes;
}
function runAction(action,pid,identity) {
  return new Promise((resolve,reject)=>execFile(executable(),[action,String(pid),...(identity?[identity]:[])],{windowsHide:true,timeout:7000,maxBuffer:200000,encoding:'utf8'},(error,stdout)=>{
    try{const data=JSON.parse(stdout.trim());if(!data.ok)reject(Error(data.error||'操作失败'));else resolve(data);}catch(e){reject(Error(error?'操作失败或超时；目标可能已退出或权限不足。':e.message));}
  }));
}
function checkTarget(input) {
  const pid=Number(input?.pid),identity=String(input?.identity||'');
  if(!Number.isInteger(pid)||pid<=4||pid===process.pid||pid===child?.pid||!/^\d{10,22}$/.test(identity))throw Error('无效或受保护的进程。');
  return {pid,identity};
}
function show() {
  if(window&&!window.isDestroyed()){window.show();window.focus();return;}
  window=new BrowserWindow({width:1240,height:820,minWidth:900,minHeight:600,title:'SysMonitor 进程管理',autoHideMenuBar:true,webPreferences:{preload:path.join(__dirname,'process-preload.js'),contextIsolation:true,nodeIntegration:false,sandbox:true}});
  window.webContents.setWindowOpenHandler(()=>({action:'deny'}));window.webContents.on('will-navigate',e=>e.preventDefault());
  window.loadFile(path.join(__dirname,'process-manager.html'));window.on('closed',()=>window=null);
}
function init() {
  ipcMain.on('process:open',event=>{const w=BrowserWindow.fromWebContents(event.sender);if(w&&event.senderFrame===event.sender.mainFrame&&event.sender.getURL().startsWith('file://')&&event.sender.getURL().includes('/out/renderer/'))show();});
  ipcMain.handle('process:action',async(event,action,input)=>{
    if(!window||event.sender!==window.webContents||event.senderFrame!==window.webContents.mainFrame)return {ok:false,error:'无效窗口'};
    try {
      if(action==='snapshot')return {ok:true,data:snapshot?.processes?.ts&&Date.now()-snapshot.processes.ts<5000?snapshot.processes:{rows:[],netSource:'stale',netError:lastError||'进程数据尚未就绪或已过期'}};
      if(!['details','location','terminate'].includes(action))throw Error('未知操作');
      const target=checkTarget(input),details=await runAction('--details',target.pid,target.identity);
      if(action==='details')return {ok:true,data:details};
      if(action==='location') {if(!details.path||!path.isAbsolute(details.path)||!fs.existsSync(details.path))throw Error('无法读取此进程的可执行文件位置。');shell.showItemInFolder(details.path);return {ok:true};}
      if(!details.canTerminate)throw Error('禁止结束系统关键进程或 SysMonitor 自身。');
      const answer=await dialog.showMessageBox(window,{type:'warning',title:'结束单个进程',message:`结束 ${details.name}（PID ${details.pid}）？`,detail:`${details.path}\n\n该程序未保存的数据可能丢失。只结束此进程，不结束整个进程树。`,buttons:['取消','结束此进程'],defaultId:0,cancelId:0,noLink:true});
      if(answer.response!==1)return {ok:true,data:{cancelled:true}};
      return {ok:true,data:await runAction('--terminate',target.pid,target.identity)};
    } catch(e){return {ok:false,error:e.message};}
  });
  app.on('will-quit',stop);start();
}
module.exports={init,stop,enrich,show};
