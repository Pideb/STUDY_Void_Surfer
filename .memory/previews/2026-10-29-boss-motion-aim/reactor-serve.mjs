import http from 'node:http';import {writeFile} from 'node:fs/promises';
const root=new URL('./',import.meta.url),waiters=[];let done=false;const pixel=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=','base64');
function finish(res){res.writeHead(200,{'content-type':'image/png'});res.end(pixel);}
http.createServer(async(req,res)=>{try{const url=new URL(req.url,'http://local');
if(req.method==='GET'&&url.pathname==='/reactorsize/wait'){if(done)finish(res);else waiters.push(res);return;}
const save=/^\/reactorsize\/(reactor-(small|medium|large|sizes))$/.exec(url.pathname);
if(req.method==='POST'&&save){let length=0;const chunks=[];for await(const chunk of req){length+=chunk.length;if(length>12000000)throw Error('Too large');chunks.push(chunk);}const bytes=Buffer.concat(chunks);if(bytes.readUInt32BE(0)!==0x89504e47)throw Error('Not PNG');await writeFile(new URL(save[1]+'.png',root),bytes);res.end('ok');if(save[2]==='sizes'){done=true;waiters.splice(0).forEach(finish);}console.log('saved '+save[1]);return;}
if(req.method!=='GET'){res.writeHead(405);res.end();return;}
const upstream=await fetch('http://127.0.0.1:4186'+req.url),type=upstream.headers.get('content-type')||'application/octet-stream';let bytes=Buffer.from(await upstream.arrayBuffer());if(type.includes('text/html')){let html=bytes.toString().replace(/<script type="module" src="\/@vite\/client"><\/script>/g,'');if(url.searchParams.has('capture')){done=false;html=html.replace('<main>','<img hidden src="/reactorsize/wait"><main>');}bytes=Buffer.from(html);}res.writeHead(upstream.status,{'content-type':type,'cache-control':'no-store'});res.end(bytes);
}catch(e){res.writeHead(400);res.end(e.message);}}).listen(4191,'127.0.0.1',()=>console.log('Reactor size review on4191'));
