import http from 'node:http';
import {writeFile} from 'node:fs/promises';
const base=new URL('./',import.meta.url),ids=['desktop','mobile','fourk','geometry','aegis-start','aegis-hit','velocity','laser','clarity'];
const pending=new Map(),done=new Set();
const pixel=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=','base64');
function finish(id){done.add(id);for(const res of pending.get(id)||[]){res.writeHead(200,{'content-type':'image/png'});res.end(pixel);}pending.delete(id);}
http.createServer(async(req,res)=>{
  try{
    const path=new URL(req.url,'http://127.0.0.1:4188').pathname,match=/^\/central\/(image|report)\/([a-z-]+)$/.exec(path);
    const wait=/^\/central\/wait\/([a-z-]+)$/.exec(path);
    if(req.method==='GET'&&wait&&ids.includes(wait[1])){
      if(done.has(wait[1])){res.writeHead(200,{'content-type':'image/png'});res.end(pixel);}
      else{const requests=pending.get(wait[1])||[];requests.push(res);pending.set(wait[1],requests);}
      return;
    }
    if(req.method==='POST'&&match){
      const[,type,id]=match;if(!ids.includes(id))throw Error('Unknown capture id');let size=0;const chunks=[];
      for await(const chunk of req){size+=chunk.length;if(size>24000000)throw Error('Capture too large');chunks.push(chunk);}
      const data=Buffer.concat(chunks);if(type==='image'&&data.readUInt32BE(0)!==0x89504e47)throw Error('Not PNG');
      await writeFile(new URL(id+(type==='image'?'.png':'.json'),base),type==='image'?data:JSON.stringify(JSON.parse(data),null,2));
      res.end('ok');console.log('saved '+id+' '+type);
      if(type==='image'){if(id==='clarity')finish('desktop');else if(id!=='desktop')finish(id);}
      return;
    }
    if(req.method!=='GET'){res.writeHead(405);res.end();return;}
    const upstream=await fetch('http://127.0.0.1:4186'+req.url),type=upstream.headers.get('content-type')||'application/octet-stream';
    let bytes=Buffer.from(await upstream.arrayBuffer());if(type.includes('text/html')){
      let html=bytes.toString().replace(/<script type="module" src="\/@vite\/client"><\/script>/g,'');
      const query=new URL(req.url,'http://local').searchParams,id=query.get('mode');
      if(query.has('capture')&&ids.includes(id)){done.delete(id);html=html.replace('<div id="app">',`<img hidden src="/central/wait/${id}"><div id="app">`);}
      bytes=Buffer.from(html);
    }
    res.writeHead(upstream.status,{'content-type':type,'content-length':bytes.length,'cache-control':'no-store'});res.end(bytes);
  }catch(error){res.writeHead(400);res.end(error.message);}
}).listen(4188,'127.0.0.1',()=>console.log('Central hitbox capture4188 (Vite4186).'));
