import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
const labels={'0.01v':'0.1','0.01-b':'0.1b'};
const label=text=>text.replace(/0\.01-b\b|0\.01v\b/g,value=>labels[value]);

// Text-node transform, not global replacement: attribute URLs, scripts, styles
// and comments remain byte-equivalent. No npm DOM dependency in preinstall CI.
export function labelVisibleHTML(html){
 let output='',position=0;
 while(position<html.length){
  const start=html.indexOf('<',position);if(start<0){output+=label(html.slice(position));break;}
  output+=label(html.slice(position,start));
  if(html.startsWith('<!--',start)){const end=html.indexOf('-->',start+4);const stop=end<0?html.length:end+3;output+=html.slice(start,stop);position=stop;continue;}
  let end=start+1,quote=null;
  for(;end<html.length;end++){const c=html[end];if(quote){if(c===quote)quote=null;}else if(c==='"'||c==="'")quote=c;else if(c==='>'){end++;break;}}
  const tag=html.slice(start,end),raw=tag.match(/^<(script|style)\b/i);
  if(raw){const close=new RegExp('</'+raw[1]+'\\s*>','ig');close.lastIndex=end;const match=close.exec(html);const stop=match?close.lastIndex:html.length;output+=html.slice(start,stop);position=stop;}
  else{output+=tag;position=end;}
 }
 return output;
}
export function archivalAliasOutput(root,release){
 const display=labels[release.version];if(!display)throw Error('Not an archival alias');
 const name='void-surfer-'+release.version+'.html',file=path.join(root,'docs/releases',name),bytes=fs.readFileSync(file);
 let html=labelVisibleHTML(bytes.toString('utf8').replace(/\r\n/g,'\n'));
 const registryFile=path.join(root,'docs/management/releases.json');const registry=fs.existsSync(registryFile)?JSON.parse(fs.readFileSync(registryFile,'utf8')):{};
 const originalSHA=registry.snapshots?.[name]??crypto.createHash('sha256').update(bytes).digest('hex');
 let found=false;
 html=html.replace(/(<script\b[^>]*\bid=["']releaseMetadata["'][^>]*>)([\s\S]*?)(<\/script\s*>)/i,(_,open,json,close)=>{
  const metadata=JSON.parse(json);found=true;Object.assign(metadata,{displayVersion:display,sourceReleaseId:release.version,sourceSnapshotSha256:originalSHA});return open+JSON.stringify(metadata).replace(/</g,'\\u003c')+close;
 });
 if(!found)throw Error('Archival metadata missing');
 // Legacy scripts can render their original identifiers later. Transform only
 // visible text nodes in this display copy, without changing their code/data.
 const runtime=`<script id="archival-display-labels">(function(){var labels=${JSON.stringify(labels)};function update(root){var walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),node;while(node=walker.nextNode()){if(node.parentElement?.closest('script,style'))continue;var next=node.nodeValue.replace(/0\\.01-b\\b|0\\.01v\\b/g,function(id){return labels[id];});if(next!==node.nodeValue)node.nodeValue=next;}}function start(){update(document.body);new MutationObserver(function(records){records.forEach(function(r){if(r.type==='characterData'){var node=r.target;if(!node.parentElement?.closest('script,style')){var next=node.nodeValue.replace(/0\\.01-b\\b|0\\.01v\\b/g,function(id){return labels[id];});if(next!==node.nodeValue)node.nodeValue=next;}}else r.addedNodes.forEach(function(n){if(n.nodeType===1)update(n);else if(n.nodeType===3&&n.parentElement)update(n.parentElement);});});}).observe(document.body,{subtree:true,childList:true,characterData:true});}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();})();</script>`;
 return html.replace('</body>',runtime+'\n</body>');
}
