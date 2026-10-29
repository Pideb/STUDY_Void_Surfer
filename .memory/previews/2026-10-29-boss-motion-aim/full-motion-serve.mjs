import http from 'node:http';import {writeFile} from 'node:fs/promises';
const root=new URL('./',import.meta.url),pending=[];let complete=false;
const pixel=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=','base64');
function finish(r){r.writeHead(200,{'content-type':'image/png'});r.end(pixel);}
http.createServer(async(req,res)=>{try{const url=new URL(req.url,'http://local');
if(req.method==='GET'&&url.pathname==='/fullmotion/wait'){if(complete)finish(res);else pending.push(res);return;}
const match=/^\/fullmotion\/(poster|range|decoded|report|movie|recorded|playback|error)(-wide)?$/.exec(url.pathname);
if(req.method==='POST'&&match){let size=0;const chunks=[];for await(const part of req){size+=part.length;if(size>25000000)throw Error('Too large');chunks.push(part);}const bytes=Buffer.concat(chunks),kind=match[1],stem='full-motion'+(match[2]||'');let file;
if(kind==='poster'||kind==='range'||kind==='decoded'){if(bytes.readUInt32BE(0)!==0x89504e47)throw Error('Not PNG');file=stem+'-'+kind+'.png';}
else if(kind==='movie'){if(bytes.readUInt32BE(0)!==0x1a45dfa3)throw Error('Not WebM');file=stem+'.webm';}
else{JSON.parse(bytes);file=stem+'-'+kind+'.json';}
await writeFile(new URL(file,root),bytes);res.end('ok');console.log('saved '+file+' '+bytes.length);if(kind==='report'){complete=true;pending.splice(0).forEach(finish);}return;}
if(req.method!=='GET'){res.writeHead(405);res.end();return;}
const upstream=await fetch('http://127.0.0.1:4186'+req.url),type=upstream.headers.get('content-type')||'application/octet-stream';let bytes=Buffer.from(await upstream.arrayBuffer());if(type.includes('text/html')){let html=bytes.toString().replace(/<script type="module" src="\/@vite\/client"><\/script>/g,'');if(url.searchParams.has('capture')){complete=false;html=html.replace('<canvas id="scene"','<img hidden src="/fullmotion/wait"><canvas id="scene"');}bytes=Buffer.from(html);}res.writeHead(upstream.status,{'content-type':type,'cache-control':'no-store'});res.end(bytes);
}catch(e){res.writeHead(400);res.end(e.message);}}).listen(4192,'127.0.0.1',()=>console.log('Full-window boss motion preview on4192'));
