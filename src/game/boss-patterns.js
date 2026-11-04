const random = rng => { const n=Number(rng()); return Number.isFinite(n)?Math.max(0,Math.min(1-Number.EPSILON,n)):0; };

// Other blocks occur once; a unique block can gain one non-consecutive repeat.
export function createBossPatternRound(bossNumber,rng=Math.random,previous=null) {
  const extraUnique=bossNumber>=2 && random(rng)<.5;
  const queue=['walls','signature',...(bossNumber>=2?['global','unique']:[]),'challenge'];
  for(let i=queue.length-1;i>0;i--){const j=Math.floor(random(rng)*(i+1));[queue[i],queue[j]]=[queue[j],queue[i]];}
  if(queue[0]===previous)[queue[0],queue[1]]=[queue[1],queue[0]];
  if(extraUnique){
    const slots=[];
    for(let i=0;i<=queue.length;i++){
      if((i===0?previous:queue[i-1])!=='unique' && queue[i]!=='unique')slots.push(i);
    }
    queue.splice(slots[Math.floor(random(rng)*slots.length)],0,'unique');
  }
  return queue;
}
