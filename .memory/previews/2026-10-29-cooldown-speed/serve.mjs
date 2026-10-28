import http from 'node:http';
import {writeFile} from 'node:fs/promises';
let done=false;const waiting=[];
const pixel=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=','base64');
function finish(res){res.writeHead(200,{'content-type':'image/png'});res.end(pixel);}
http.createServer(async(req,res)=>{try{
if(req.method==='GET'&&req.url==='/cooldown/wait'){if(done)finish(res);else waiting.push(res);return;}
if(req.method==='POST'&&req.url==='/cooldown/image'){const chunks=[];let length=0;for await(const chunk of req){length+=chunk.length;if(length>10000000)throw Error('Too large');chunks.push(chunk);}const bytes=Buffer.concat(chunks);if(bytes.readUInt32BE(0)!==0x89504e47)throw Error('Expected PNG');await writeFile(new URL('comparison.png',import.meta.url),bytes);res.end('ok');done=true;waiting.splice(0).forEach(finish);console.log('saved comparison.png');return;}
if(req.method!=='GET'){res.writeHead(405);res.end();return;}
const upstream=await fetch('http://127.0.0.1:4186'+req.url);let bytes=Buffer.from(await upstream.arrayBuffer());const type=upstream.headers.get('content-type')||'application/octet-stream';if(type.includes('text/html'))bytes=Buffer.from(bytes.toString().replace(/<script type="module" src="\/@vite\/client"><\/script>/g,''));res.writeHead(upstream.status,{'content-type':type,'cache-control':'no-store'});res.end(bytes);
}catch(e){res.writeHead(400);res.end(e.message);}}).listen(4188,'127.0.0.1',()=>console.log('Cooldown review on4188'));
