import http from 'node:http';import {writeFile} from 'node:fs/promises';
const root=new URL('./',import.meta.url),waiting=new Map(),done=new Set();
const pixel=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=','base64');
const finish=res=>{res.writeHead(200,{'content-type':'image/png'});res.end(pixel);};
http.createServer(async(req,res)=>{try{
 const u=new URL(req.url,'http://local'),m=/^\/flightqa\/(json|png|wait|done)\/([a-z0-9-]+)$/.exec(u.pathname);
 if(m){const[,type,id]=m;if(type==='wait'){if(done.has(id))finish(res);else{const list=waiting.get(id)||[];list.push(res);waiting.set(id,list);}return;}
 const chunks=[];let size=0;for await(const c of req){size+=c.length;if(size>25000000)throw Error('Too large');chunks.push(c);}const data=Buffer.concat(chunks);
 if(type==='done'){done.add(id);(waiting.get(id)||[]).forEach(finish);waiting.delete(id);}else{if(type==='json')JSON.parse(data);await writeFile(new URL(id+'.'+type,root),data);console.log('saved '+id+'.'+type);}res.end('ok');return;}
 const upstream=await fetch('http://127.0.0.1:4186'+req.url),type=upstream.headers.get('content-type')||'application/octet-stream';let b=Buffer.from(await upstream.arrayBuffer());
 if(type.includes('text/html')){let html=b.toString().replace(/<script type="module" src="\/@vite\/client"><\/script>/g,'');const id=u.searchParams.get('id');if(id){done.delete(id);html=html.replace('<div id="app">',`<img hidden src="/flightqa/wait/${id}"><div id="app">`);}b=Buffer.from(html);}res.writeHead(upstream.status,{'content-type':type,'cache-control':'no-store'});res.end(b);
 }catch(e){res.writeHead(400);res.end(e.stack);}}).listen(4195,'127.0.0.1',()=>console.log('Flight QA4195 -> Vite4186'));
