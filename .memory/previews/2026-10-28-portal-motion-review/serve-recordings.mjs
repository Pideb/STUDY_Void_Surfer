// Local review-artifact exporter. Only the six known video outputs can be written.
import http from 'node:http';
import {readFile,writeFile,mkdir,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {finalizeDuration} from './webm-duration.mjs';
const dir=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(dir,'../../..');
const ids=['crystal-gates','industrial-void','signal-monoliths','gravity-well','abyssal-beast','solar-forge'];
await mkdir(path.join(dir,'media'),{recursive:true});
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png','.json':'application/json','.webm':'video/webm'};
const server=http.createServer(async(req,res)=>{
  try{
    const url=new URL(req.url,'http://127.0.0.1:4185');
    if(req.method==='POST'){
      const id=url.pathname.startsWith('/capture/')?url.pathname.slice(9):null;
      const poster=url.pathname.startsWith('/poster/')?url.pathname.slice(8):null;
      const event=['/capture-complete','/capture-error','/qa-report'].includes(url.pathname);
      if(!ids.includes(id)&&!ids.includes(poster)&&!event){res.writeHead(404);res.end();return;}
      let size=0;const chunks=[];
      for await(const chunk of req){size+=chunk.length;if(size>20000000)throw new Error('Capture too large');chunks.push(chunk);}
      const bytes=Buffer.concat(chunks);
      if(poster){
        if(bytes.length<1000||bytes.readUInt32BE(0)!==0x89504e47)throw new Error('Invalid PNG');
        await writeFile(path.join(dir,'media',poster+'-portal.png'),bytes);console.log('POSTER '+poster);
      }else if(id){
        if(bytes.length<2000||bytes.readUInt32BE(0)!==0x1a45dfa3)throw new Error('Invalid WebM');
        const videoInfo=finalizeDuration(bytes);
        await writeFile(path.join(dir,'media',id+'-portal.webm'),bytes);
        console.log('SAVED '+id+' '+bytes.length+' bytes '+JSON.stringify(videoInfo));
      }else{
        const report=JSON.parse(bytes.toString());
        const reportFile=url.pathname==='/capture-complete'?'capture-complete.json':url.pathname==='/qa-report'?'playback-report.json':'capture-error.json';
        await writeFile(path.join(dir,'qa',reportFile),JSON.stringify(report,null,2)+'\n');
        console.log(url.pathname+' '+JSON.stringify(report));
      }
      res.writeHead(200);res.end('ok');return;
    }
    if(req.method!=='GET'){res.writeHead(405);res.end();return;}
    const relative=decodeURIComponent(url.pathname).replace(/^\/+/,''),target=path.resolve(root,relative);
    const allowed=target.startsWith(path.join(root,'.memory','previews')+path.sep)||target.startsWith(path.join(root,'public','assets')+path.sep);
    if(!allowed||!target.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
    const info=await stat(target);if(!info.isFile()){res.writeHead(404);res.end();return;}
    const bytes=await readFile(target),headers={'Content-Type':types[path.extname(target)]||'application/octet-stream','Cache-Control':'no-store','Accept-Ranges':'bytes'};
    const range=/^bytes=(\d+)-(\d*)$/.exec(req.headers.range||'');
    if(range){
      const start=Number(range[1]),end=range[2]?Math.min(info.size-1,Number(range[2])):info.size-1;
      if(start> end||start>=info.size){res.writeHead(416,{'Content-Range':'bytes */'+info.size});res.end();return;}
      res.writeHead(206,{...headers,'Content-Range':`bytes ${start}-${end}/${info.size}`,'Content-Length':end-start+1});res.end(bytes.subarray(start,end+1));return;
    }
    res.writeHead(200,{...headers,'Content-Length':info.size});res.end(bytes);
  }catch(error){res.writeHead(400);res.end(error.message);console.log('ERROR '+error.message);}
});
server.listen(4185,'127.0.0.1',()=>console.log('LOCAL CAPTURE http://127.0.0.1:4185'));
