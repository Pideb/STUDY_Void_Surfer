import http from 'node:http';import {writeFile} from 'node:fs/promises';
const root=new URL('./',import.meta.url),pending=[],done=new Set();
const pixel=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=','base64');
function finish(r){r.writeHead(200,{'content-type':'image/png'});r.end(pixel);}
http.createServer(async(req,res)=>{try{
const url=new URL(req.url,'http://local');
if(req.method==='GET'&&url.pathname==='/bossreview/wait'){if(done.size===2)finish(res);else pending.push(res);return;}
const save=/^\/bossreview\/(hud-options|boss-actions)$/.exec(url.pathname);
if(req.method==='POST'&&save){let bytes=0;const chunks=[];for await(const chunk of req){bytes+=chunk.length;if(bytes>14000000)throw Error('Too large');chunks.push(chunk);}const data=Buffer.concat(chunks);if(data.readUInt32BE(0)!==0x89504e47)throw Error('Not PNG');await writeFile(new URL(save[1]+'.png',root),data);done.add(save[1]);res.end('ok');if(done.size===2)pending.splice(0).forEach(finish);console.log('saved '+save[1]);return;}
if(req.method!=='GET'){res.writeHead(405);res.end();return;}
const upstream=await fetch('http://127.0.0.1:4186'+req.url),type=upstream.headers.get('content-type')||'application/octet-stream';let data=Buffer.from(await upstream.arrayBuffer());if(type.includes('text/html')){let html=data.toString().replace(/<script type="module" src="\/@vite\/client"><\/script>/g,'');if(url.searchParams.has('capture')){done.clear();html=html.replace('<main>','<img hidden src="/bossreview/wait"><main>');}data=Buffer.from(html);}res.writeHead(upstream.status,{'content-type':type,'cache-control':'no-store'});res.end(data);
}catch(e){res.writeHead(400);res.end(e.message);}}).listen(4190,'127.0.0.1',()=>console.log('Boss/HUD review on4190'));
