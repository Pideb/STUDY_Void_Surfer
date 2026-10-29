import http from 'node:http';
import {writeFile} from 'node:fs/promises';
const root=new URL('./',import.meta.url),waiting=new Map(),done=new Set();
const pixel=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=','base64');
function finish(res){res.writeHead(200,{'content-type':'image/png'});res.end(pixel);}
http.createServer(async(req,res)=>{try{
  const url=new URL(req.url,'http://local'),match=/^\/aimqa\/(png|json|done|wait)\/([a-z-]+)$/.exec(url.pathname);
  if(match){const[,type,id]=match;
    if(type==='wait'){if(done.has(id))finish(res);else{const list=waiting.get(id)||[];list.push(res);waiting.set(id,list);}return;}
    if(req.method!=='POST')throw Error('POST required');
    const chunks=[];let size=0;for await(const part of req){size+=part.length;if(size>20000000)throw Error('Too large');chunks.push(part);}const bytes=Buffer.concat(chunks);
    if(type==='done'){done.add(id);(waiting.get(id)||[]).forEach(finish);waiting.delete(id);}
    else{if(type==='json')JSON.parse(bytes);else if(bytes.readUInt32BE(0)!==0x89504e47)throw Error('Not PNG');await writeFile(new URL(id+'.'+type,root),bytes);console.log('saved '+id+'.'+type);}
    res.end('ok');return;
  }
  const upstream=await fetch('http://127.0.0.1:4186'+req.url),type=upstream.headers.get('content-type')||'application/octet-stream';let bytes=Buffer.from(await upstream.arrayBuffer());
  if(type.includes('text/html')){let html=bytes.toString().replace(/<script type="module" src="\/@vite\/client"><\/script>/g,'');const id=url.searchParams.get('mode')||'desktop';if(url.searchParams.has('capture')){done.delete(id);html=html.replace('<div id="app">',`<img hidden src="/aimqa/wait/${id}"><div id="app">`);}bytes=Buffer.from(html);}
  res.writeHead(upstream.status,{'content-type':type,'cache-control':'no-store'});res.end(bytes);
}catch(error){res.writeHead(400);res.end(error.stack);}}).listen(4194,'127.0.0.1',()=>console.log('Actual-runtime capture4194, Vite4186'));
