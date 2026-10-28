import http from 'node:http';
import {writeFile} from 'node:fs/promises';
const base=new URL('./',import.meta.url);
http.createServer(async(req,res)=>{
  try{
    const match=/^\/timing-capture\/(wall|projectile|dual)$/.exec(req.url);
    if(req.method==='POST'&&match){
      const chunks=[];let length=0;for await(const chunk of req){length+=chunk.length;if(length>4000000)throw Error('Capture too large');chunks.push(chunk);}
      const bytes=Buffer.concat(chunks);if(bytes.readUInt32BE(0)!==0x89504e47)throw Error('Invalid PNG');
      await writeFile(new URL(match[1]+'-timing.png',base),bytes);res.end('ok');console.log('saved '+match[1]);return;
    }
    if(req.method!=='GET'){res.writeHead(405);res.end();return;}
    const response=await fetch('http://127.0.0.1:4186'+req.url),type=response.headers.get('content-type')||'application/octet-stream';
    let bytes=Buffer.from(await response.arrayBuffer());if(type.includes('text/html'))bytes=Buffer.from(bytes.toString().replace(/<script type="module" src="\/@vite\/client"><\/script>/g,''));
    res.writeHead(response.status,{'content-type':type,'content-length':bytes.length,'cache-control':'no-store'});res.end(bytes);
  }catch(error){res.writeHead(400);res.end(error.message);}
}).listen(4188,'127.0.0.1',()=>console.log('Timing capture4188'));
