import http from 'node:http';
import {readFile,writeFile} from 'node:fs/promises';
import {finalizeDuration} from '../2026-10-28-portal-motion-review/webm-duration.mjs';
const base=new URL('./',import.meta.url),ids=['ink','glitch'];
http.createServer(async(req,res)=>{
  try{
    const path=new URL(req.url,'http://127.0.0.1:4188').pathname,match=/^\/review-v4-(poster|video|status)\/(ink|glitch)$/.exec(path);
    if(req.method==='POST'&&match){
      const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>16000000)throw new Error('Capture too large');chunks.push(chunk);}
      const bytes=Buffer.concat(chunks),[,kind,id]=match;
      if(!ids.includes(id))throw new Error('Invalid target');
      if(kind==='poster'){if(bytes.readUInt32BE(0)!==0x89504e47)throw new Error('Not PNG');await writeFile(new URL(id+'-v4.png',base),bytes);}
      if(kind==='video'){if(bytes.readUInt32BE(0)!==0x1a45dfa3)throw new Error('Not WebM');console.log(id,finalizeDuration(bytes));await writeFile(new URL(id+'-v4.webm',base),bytes);}
      if(kind==='status')await writeFile(new URL(id+'-v4-capture.json',base),JSON.stringify(JSON.parse(bytes.toString()),null,2)+'\n');
      res.writeHead(200);res.end('ok');return;
    }
    if(req.method!=='GET'){res.writeHead(405);res.end();return;}
    const response=await fetch('http://127.0.0.1:4186'+req.url,{headers:req.headers.range?{range:req.headers.range}:{}});
    const headers={'Content-Type':response.headers.get('content-type')??'application/octet-stream','Cache-Control':'no-store'};
    for(const key of ['content-range','content-length','accept-ranges'])if(response.headers.has(key))headers[key]=response.headers.get(key);
    let body=Buffer.from(await response.arrayBuffer());
    if(headers['Content-Type'].includes('text/html')){
      // Export/verification pages must not reconnect to Vite HMR and re-record
      // themselves whenever a capture/report is written to the preview folder.
      body=Buffer.from(body.toString().replace(/<script type="module" src="\/@vite\/client"><\/script>/g,''));
      headers['content-length']=String(body.length);
    }
    res.writeHead(response.status,headers);res.end(body);
  }catch(error){console.log(error.message);res.writeHead(400);res.end(error.message);}
}).listen(4188,'127.0.0.1',()=>console.log('Penalty review capture server on 4188'));
