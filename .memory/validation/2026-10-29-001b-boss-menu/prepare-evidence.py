from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[3]
HERE = Path(__file__).resolve().parent
source = (ROOT / '.memory/validation/2026-10-29-release-overview/verify-overview.mjs').read_text(encoding='utf-8')
source = source.replace('2026-10-29-release-overview', '2026-10-29-001b-boss-menu').replace(':9421', ':9423')
source = source.replace('void-surfer-0.01v.html', 'void-surfer-0.01-b.html').replace("version:'0.01v'", "version:'0.01-b'")
source = source.replace('<21', '<25').replace('feedbackItems,21', 'feedbackItems,25')
source = source.replace("await send('Page.enable');", "await send('Page.enable');await send('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});", 1)
source = source.replace("results.errors=errors;", """
results.metadata=await evaluate(`JSON.parse(document.getElementById('releaseMetadata').textContent)`);
assert.equal(results.metadata.version,'0.01-b');assert.equal(results.metadata.status,'validated-local-not-deployed');
assert.equal(results.metadata.verification.tests,716);
results.historicalLabels=await evaluate(`({archive:document.getElementById('warning-archive').textContent,history:document.querySelector('#feedback .lede').textContent})`);
assert.ok(results.historicalLabels.archive.includes('0.01v'));
results.errors=errors;""")
source = source.replace("await evaluate(`document.getElementById('copyVersion').click()`);", """await evaluate(`Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async function(text){window.__copiedVersion=text;}}});document.getElementById('copyVersion').click()`);""")
source = source.replace("assert.ok(results.interactions.copyStatus.length>0);", """assert.ok(results.interactions.copyStatus.length>0);
results.interactions.copiedVersion=await evaluate('window.__copiedVersion');
assert.ok(results.interactions.copiedVersion.includes('3928989'));assert.ok(results.interactions.copiedVersion.includes('미배포'));
assert.ok(!results.interactions.copiedVersion.includes('f69a166'));
await evaluate(`document.getElementById('release').scrollIntoView({behavior:'instant',block:'start'})`);await screenshot('release-desktop');""")
(HERE / 'verify-overview.mjs').write_text(source, encoding='utf-8', newline='\n')
log = HERE / 'full-tests.log'
raw = log.read_bytes()
if raw[:2] in (b'\xff\xfe', b'\xfe\xff'):
    log.write_text(raw.decode('utf-16').replace('\r','').rstrip()+'\n', encoding='utf-8', newline='\n')
