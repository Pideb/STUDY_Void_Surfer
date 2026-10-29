const random = rng => { const n=Number(rng()); return Number.isFinite(n)?Math.max(0,Math.min(1-Number.EPSILON,n)):0; };

// Every eligible block occurs once; a new round cannot repeat the last block.
export function createBossPatternRound(bossNumber,rng=Math.random,previous=null) {
  const queue=['walls','signature',...(bossNumber>=2?['global']:[]),'challenge'];
  for(let i=queue.length-1;i>0;i--){const j=Math.floor(random(rng)*(i+1));[queue[i],queue[j]]=[queue[j],queue[i]];}
  if(queue[0]===previous)[queue[0],queue[1]]=[queue[1],queue[0]];
  return queue;
}
