// Add duration metadata to the local MediaRecorder WebM, without re-encoding.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const stem=process.argv[2]==='wide'?'full-motion-wide':'full-motion';
const target=new URL(stem+'.webm',import.meta.url),b=fs.readFileSync(target);
function width(at,max){let bit=128,n=1;while(!(b[at]&bit)&&n<=max){bit>>=1;n++;}assert.ok(n<=max);return n;}
function list(start,end){const out=[];for(let at=start;at<end;){const iw=width(at,4),sw=width(at+iw,8);let id=0,size=BigInt(b[at+iw]&((1<<(8-sw))-1));for(let i=0;i<iw;i++)id=id*256+b[at+i];for(let i=1;i<sw;i++)size=size*256n+BigInt(b[at+iw+i]);const data=at+iw+sw,unknown=size===(1n<<BigInt(sw*7))-1n,stop=unknown?end:Math.min(end,data+Number(size));assert.ok(stop>at);out.push({id,at,iw,sw,data,end:stop,unknown});at=stop;}return out;}
const uint=e=>{let n=0;for(let i=e.data;i<e.end;i++)n=n*256+b[i];return n;};
const segment=list(0,b.length).find(e=>e.id===0x18538067);assert.ok(segment?.unknown);
const children=list(segment.data,segment.end),info=children.find(e=>e.id===0x1549a966),fields=list(info.data,info.end),scale=uint(fields.find(e=>e.id===0x2ad7b1));
assert.ok(!children.some(e=>e.id===0x114d9b74||e.id===0x1c53bb6b),'Do not shift indexed offsets');
const times=[];function cluster(e){let base=0;for(const item of list(e.data,e.end)){if(item.id===0xe7)base=uint(item);if(item.id===0xa3)times.push(base+b.readInt16BE(item.data+width(item.data,8)));if(item.id===0xa0){for(const block of list(item.data,item.end))if(block.id===0xa1)times.push(base+b.readInt16BE(block.data+width(block.data,8)));}if(item.id===0x1f43b675)cluster(item);}}
children.filter(e=>e.id===0x1f43b675).forEach(cluster);times.sort((a,b)=>a-b);assert.ok(times.length>=100,JSON.stringify({frames:times.length,first:times[0],last:times.at(-1)}));
const intervals=times.slice(1).map((t,i)=>t-times[i]).filter(t=>t>0).sort((a,b)=>a-b),frame=intervals[Math.floor(intervals.length/2)],ticks=times.at(-1)+frame,seconds=ticks*scale/1e9;assert.ok(seconds>=5.8&&seconds<6.3);
const existing=fields.find(e=>e.id===0x4489);let result;
if(existing){assert.equal(existing.end-existing.data,8);b.writeDoubleBE(ticks,existing.data);result=b;}
else{assert.equal(info.sw,1);const size=info.end-info.data+11;assert.ok(size<127);b[info.at+info.iw]=128|size;const field=Buffer.alloc(11);field[0]=0x44;field[1]=0x89;field[2]=0x88;field.writeDoubleBE(ticks,3);result=Buffer.concat([b.subarray(0,info.end),field,b.subarray(info.end)]);}
fs.writeFileSync(target,result);const report={width:960,height:540,seconds,frames:times.length,bytes:result.length,method:'Duration metadata only; recorded frames not re-encoded.'};fs.writeFileSync(new URL(stem+'-media.json',import.meta.url),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
