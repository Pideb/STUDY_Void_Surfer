import http from 'node:http';
import { writeFile } from 'node:fs/promises';
import { finalizeDuration } from '../../previews/2026-10-28-portal-motion-review/webm-duration.mjs';
const base = new URL('./',import.meta.url);
http.createServer(async(req,res)=>{
  try {
    const path = new URL(req.url,'http://127.0.0.1:4188').pathname;
    const match = /^\/runtime-(report|video)\/(ready|mobile|menu|charge|beam|ink|glitch)$/.exec(path);
    if(req.method==='POST'&&match){
      let size=0;const chunks=[];for await(const chunk of req){size+=chunk.length;if(size>16000000)throw Error('Capture too large');chunks.push(chunk);}
      const data=Buffer.concat(chunks),[,type,id]=match;
      if(type==='video'){
        if(!['ink','glitch'].includes(id))throw Error('Invalid video target');
        const meta=finalizeDuration(data);await writeFile(new URL(id+'-video.json',base),JSON.stringify(meta,null,2));
      }
      await writeFile(new URL(id+(type==='video'?'.webm':'.json'),base),type==='video'?data:JSON.stringify(JSON.parse(data),null,2));
      res.writeHead(200);res.end('ok');return;
    }
    if(req.method!=='GET'){res.writeHead(405);res.end();return;}
    const upstream=await fetch('http://127.0.0.1:4186'+req.url,{headers:req.headers.range?{range:req.headers.range}:{}});
    const headers={'content-type':upstream.headers.get('content-type')||'application/octet-stream','cache-control':'no-store'};
    for(const key of ['content-range','accept-ranges'])if(upstream.headers.has(key))headers[key]=upstream.headers.get(key);
    let bytes=Buffer.from(await upstream.arrayBuffer());
    if(headers['content-type'].includes('text/html'))bytes=Buffer.from(bytes.toString().replace(/<script type="module" src="\/@vite\/client"><\/script>/g,''));
    headers['content-length']=bytes.length;res.writeHead(upstream.status,headers);res.end(bytes);
  }catch(error){console.log(error.message);res.writeHead(400);res.end(error.message);}
}).listen(4188,'127.0.0.1',()=>console.log('Production renderer capture proxy4188; Vite4186 required.'));
