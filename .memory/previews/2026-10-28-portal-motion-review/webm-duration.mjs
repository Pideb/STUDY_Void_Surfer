// Finalize Firefox's zero-valued duration in-place; no re-encoding or size changes.
export function finalizeDuration(buffer){
  function width(at,max){let bit=128,n=1;while(!(buffer[at]&bit)&&n<=max){bit>>=1;n++;}if(n>max)throw new Error('Invalid EBML');return n;}
  function list(start,end){
    const out=[];
    for(let at=start;at<end;){
      const idWidth=width(at,4),sizeWidth=width(at+idWidth,8);let id=0,size=BigInt(buffer[at+idWidth]&((1<<(8-sizeWidth))-1));
      for(let i=0;i<idWidth;i++)id=id*256+buffer[at+i];
      for(let i=1;i<sizeWidth;i++)size=size*256n+BigInt(buffer[at+idWidth+i]);
      const data=at+idWidth+sizeWidth,unknown=size===(1n<<BigInt(7*sizeWidth))-1n,stop=unknown?end:Math.min(end,data+Number(size));
      if(stop<=at)throw new Error('Invalid EBML extent');out.push({id,data,end:stop});at=stop;
    }return out;
  }
  const uint=e=>{let n=0;for(let i=e.data;i<e.end;i++)n=n*256+buffer[i];return n;};
  const segment=list(0,buffer.length).find(e=>e.id===0x18538067);if(!segment)throw new Error('No WebM segment');
  const children=list(segment.data,segment.end),info=children.find(e=>e.id===0x1549a966);if(!info)throw new Error('No WebM info');
  const fields=list(info.data,info.end),duration=fields.find(e=>e.id===0x4489),scale=fields.find(e=>e.id===0x2ad7b1);
  if(!duration||duration.end-duration.data!==8||!scale)throw new Error('Unexpected review WebM metadata');
  const times=[];
  function walkCluster(cluster){
    let base=0;
    for(const e of list(cluster.data,cluster.end)){
      if(e.id===0xe7)base=uint(e);
      if(e.id===0xa3)times.push(base+buffer.readInt16BE(e.data+width(e.data,8)));
      if(e.id===0x1f43b675)walkCluster(e);
    }
  }
  for(const cluster of children.filter(e=>e.id===0x1f43b675))walkCluster(cluster);
  if(times.length<20)throw new Error('Too few recorded frames');
  times.sort((a,b)=>a-b);const last=times.at(-1),frame=Math.max(1,times.at(-1)-times.at(-2));
  const ticks=last+frame,seconds=ticks*uint(scale)/1e9;
  if(seconds<5||seconds>7)throw new Error('Unexpected review clip length '+seconds);
  buffer.writeDoubleBE(ticks,duration.data);
  return {seconds,frames:times.length};
}
