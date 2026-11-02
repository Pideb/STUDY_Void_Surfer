import fs from 'node:fs';import assert from 'node:assert/strict';
const appOrigin=process.argv[4]||'http://127.0.0.1:5173',expectedVersion=process.argv[5]||'v0.2';
const port=Number(process.argv[2]),policy=process.argv[3],dir='.memory/validation/2026-11-02-startup-autoplay';
const tab=await fetch(`http://127.0.0.1:${port}/json/new?about:blank`,{method:'PUT'}).then(r=>r.json());
const ws=new WebSocket(tab.webSocketDebuggerUrl),jobs=new Map(),exceptions=[];let id=0;
await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject;});
ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const job=jobs.get(m.id);if(job){clearTimeout(job.timer);jobs.delete(m.id);m.error?job.reject(m.error):job.resolve(m.result);}}else if(m.method==='Runtime.exceptionThrown')exceptions.push(m.params.exceptionDetails);};
const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id,timer=setTimeout(()=>reject(Error(method)),20000);jobs.set(n,{resolve,reject,timer});ws.send(JSON.stringify({id:n,method,params}));});
const evaluate=async expression=>{const result=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(result.exceptionDetails)throw Error(JSON.stringify(result.exceptionDetails));return result.result.value;};
const wait=async expression=>{for(let n=0;n<150;n++){if(await evaluate(expression))return;await new Promise(r=>setTimeout(r,100));}throw Error('Timed out: '+expression);};
await send('Runtime.enable');await send('Page.enable');
await send('Page.navigate',{url:'http://127.0.0.1:5173/'+dir+'/literal-audio.html'});
await wait('window.literalResult?.status && literalResult.status!=="pending"');
const literal=await evaluate('({result:literalResult,paused:audioToPlay.paused,time:audioToPlay.currentTime})');
if(policy==='explicit-allow')assert.equal(literal.result.status,'playing');
await send('Page.addScriptToEvaluateOnNewDocument',{source:`
 window.qaAudio={contexts:[],starts:[],resumes:0,unhandled:[]};
 window.addEventListener('unhandledrejection',e=>qaAudio.unhandled.push(e.reason?.name||'unknown'));
 var OriginalAudioContext=window.AudioContext;
 window.AudioContext=class extends OriginalAudioContext{
   constructor(...args){super(...args);qaAudio.contexts.push(this);}
   resume(){qaAudio.resumes++;return super.resume();}
   createBufferSource(){var source=super.createBufferSource(),start=source.start.bind(source),context=this;source.start=(...args)=>{qaAudio.starts.push({state:context.state,time:context.currentTime});return start(...args);};return source;}
 };
`});
await send('Page.navigate',{url:appOrigin+'/'});
await wait('document.readyState==="complete"&&Boolean(document.querySelector(".menu-version"))&&qaAudio.contexts.length>0');
await new Promise(r=>setTimeout(r,800));
const before=await evaluate('({version:document.querySelector(".menu-version").textContent,states:qaAudio.contexts.map(c=>c.state),starts:qaAudio.starts.length,resumes:qaAudio.resumes})');
assert.ok(before.version.startsWith(expectedVersion));if(policy==='explicit-allow'){await wait('qaAudio.starts.some(s=>s.state==="running")');}
await send('Input.dispatchMouseEvent',{type:'mousePressed',x:5,y:5,button:'left',clickCount:1});await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:5,y:5,button:'left',clickCount:1});
await wait('qaAudio.contexts[0]?.state==="running"&&qaAudio.starts.some(s=>s.state==="running")');
const after=await evaluate('({states:qaAudio.contexts.map(c=>c.state),starts:qaAudio.starts,resumes:qaAudio.resumes,unhandled:qaAudio.unhandled,stillMenu:Boolean(document.querySelector(".menu-screen"))})');
assert.equal(after.starts.length,1);assert.equal(after.unhandled.length,0);assert.equal(after.stillMenu,true);assert.equal(exceptions.length,0);
const report={policy,appOrigin,policyOverride:policy==='explicit-allow'?'--autoplay-policy=no-user-gesture-required':null,browser:await send('Browser.getVersion'),literal,before,after,exceptions,auditoryListeningVerified:false};
fs.writeFileSync(dir+'/'+policy+'.json',JSON.stringify(report,null,2)+'\n');ws.close();console.log(JSON.stringify({policy,literal:literal.result.status,before,after:{...after,starts:after.starts.length}}));
