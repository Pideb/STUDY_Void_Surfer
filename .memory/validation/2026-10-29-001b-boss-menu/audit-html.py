from pathlib import Path
from html.parser import HTMLParser
from collections import Counter
import base64, hashlib, json, re

ROOT=Path(__file__).resolve().parents[3]
HERE=Path(__file__).resolve().parent
class Document(HTMLParser):
    def __init__(self, text):
        super().__init__(); self.assets=[]; self.text=[]; self.skip=0; self.feed(text)
    def handle_starttag(self, tag, attrs):
        if tag in ('script','style'): self.skip+=1
        values=dict(attrs)
        if tag in ('img','source') and values.get('src','').startswith('data:'):
            data=values['src'];base64.b64decode(data.split(',',1)[1],validate=True);self.assets.append(data)
    def handle_endtag(self, tag):
        if tag in ('script','style'): self.skip-=1
    def handle_data(self, data):
        if not self.skip: self.text.append(data)

old_path=ROOT/'docs/releases/void-surfer-0.01v.html'
new_path=ROOT/'docs/releases/void-surfer-0.01-b.html'
old=Document(old_path.read_text(encoding='utf-8'));new=Document(new_path.read_text(encoding='utf-8'))
removed=Counter(old.assets)-Counter(new.assets);added=Counter(new.assets)-Counter(old.assets)
assert sum(removed.values())==1 and sum(added.values())==1, 'Only fresh menu screenshot may differ; embedded asset corruption'
old_hash=hashlib.sha256(old_path.read_bytes()).hexdigest()
assert old_hash=='42704308b359b173044a658af44201ed05467070fc24c1cc0ca2cf9e9ce15d34'
assert new_path.read_bytes()==(Path.home()/'Downloads/void-surfer-0.01-b.html').read_bytes()
text='\n'.join(line.strip() for line in ' '.join(new.text).splitlines() if line.strip())
(HERE/'html-text-audit.txt').write_text(text+'\n',encoding='utf-8')
history=json.loads((ROOT/'docs/releases/versions.json').read_text(encoding='utf-8'))
assert history['currentVersion']=='0.01-b'
assert len([r for r in history['releases'] if r['version']=='0.01-b'])==1
report={'oldSnapshotUnchanged':True,'downloadsIdentical':True,'embeddedAssets':len(new.assets),
        'onlyChangedEmbeddedAsset':'fresh menu screenshot','oldSha256':old_hash,
        'newSha256':hashlib.sha256(new_path.read_bytes()).hexdigest()}
(HERE/'asset-audit.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
print(json.dumps(report))
