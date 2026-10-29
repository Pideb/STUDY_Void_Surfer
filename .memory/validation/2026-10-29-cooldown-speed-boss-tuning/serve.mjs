import http from 'node:http';
import {writeFile} from 'node:fs/promises';
const base=new URL('./',import.meta.url),ids=['nova','aegis','velocity','mobile','charge','beam','sixshot','laser'];
const allowed=new Set([...ids,...['nova','aegis','velocity'].map(id=>id+'-detail')]),pending=new Map(),done=new Set();
const pixel=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=','base64');
function finish(id){done.add(id);for(const r of pending.get(id)||[]){r.writeHead(200,{'content-type':'image/png'});r.end(pixel);}pending.delete(id);}
http.createServer(async(req,res)=>{try{
const url=new URL(req.url,'http://local'),path=url.pathname,wait=/^\/tuning\/wait\/([a-z-]+)$/.exec(path),save=/^\/tuning\/(image|report)\/([a-z-]+)$/.exec(path);
if(req.method==='GET'&&wait&&ids.includes(wait[1])){if(done.has(wait[1])){res.writeHead(200,{'content-type':'image/png'});res.end(pixel);}else{const list=pending.get(wait[1])||[];list.push(res);pending.set(wait[1],list);}return;}
if(req.method==='POST'&&save&&allowed.has(save[2])){
const[,type,id]=save;let length=0;const chunks=[];for await(const chunk of req){length+=chunk.length;if(length>14000000)throw Error('Too large');chunks.push(chunk);}const data=Buffer.concat(chunks);if(type==='image'&&data.readUInt32BE(0)!==0x89504e47)throw Error('Not PNG');await writeFile(new URL(id+(type==='image'?'.png':'.json'),base),type==='image'?data:JSON.stringify(JSON.parse(data),null,2));res.end('ok');console.log('saved '+id+' '+type);
if(type==='image'){if(id.endsWith('-detail'))finish(id.slice(0,-7));else if(!['nova','aegis','velocity'].includes(id))finish(id);}return;}
if(req.method!=='GET'){res.writeHead(405);res.end();return;}
const upstream=await fetch('http://127.0.0.1:4186'+req.url),type=upstream.headers.get('content-type')||'application/octet-stream';let bytes=Buffer.from(await upstream.arrayBuffer());if(type.includes('text/html')){
let html=bytes.toString().replace(/<script type="module" src="\/@vite\/client"><\/script>/g,'');const id=url.searchParams.get('mode');if(url.searchParams.has('capture')&&ids.includes(id)){done.delete(id);html=html.replace('<div id="app">',`<img hidden src="/tuning/wait/${id}"><div id="app">`);}bytes=Buffer.from(html);}
res.writeHead(upstream.status,{'content-type':type,'cache-control':'no-store'});res.end(bytes);
}catch(e){res.writeHead(400);res.end(e.message);}}).listen(4190,'127.0.0.1',()=>console.log('Tuning evidence on4190'));
