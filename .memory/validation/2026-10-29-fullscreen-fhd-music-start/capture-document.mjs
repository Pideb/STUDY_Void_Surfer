import fs from 'node:fs';
const tabs=await fetch('http://127.0.0.1:9430/json/list').then(r=>r.json()),socket=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);
await new Promise(r=>socket.onopen=r);let id=0;const pending=new Map();
socket.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result);}};
const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});socket.send(JSON.stringify({id:n,method,params}));});
await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1020,deviceScaleFactor:1,mobile:false});
await send('Runtime.evaluate',{expression:`document.documentElement.className='theme-dark';document.getElementById('fullscreen-start').scrollIntoView({behavior:'instant',block:'start'});`,returnByValue:true});
await new Promise(r=>setTimeout(r,250));const png=await send('Page.captureScreenshot',{format:'png'});
fs.writeFileSync('.memory/validation/2026-10-29-fullscreen-fhd-music-start/document-followup.png',Buffer.from(png.data,'base64'));socket.close();
