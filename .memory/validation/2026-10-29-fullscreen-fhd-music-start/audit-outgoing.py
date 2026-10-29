from pathlib import Path
import json, os, re, subprocess

def git(*args):
    return subprocess.check_output(['git',*args],encoding='utf-8').strip()

expected='https://github.com/Pideb/STUDY_Void_Surfer.git'
assert git('remote','get-url','origin')==expected
subprocess.run(['git','fetch','origin','main'],check=True)
subprocess.run(['git','merge-base','--is-ancestor','origin/main','HEAD'],check=True)
tracked=git('ls-files').splitlines()
private=[p for p in tracked if re.search(r'(^|/)\.env($|\.)',p) and not p.endswith('.env.example')]
private += [p for p in tracked if re.search(r'\.(pem|pfx|key)$',p,re.I)]
assert not private, 'Tracked private configuration requires review: '+repr(private)
objects={}
for line in git('-c','core.quotePath=false','rev-list','--objects','origin/main..HEAD').splitlines():
    oid,_,name=line.partition(' ');objects[oid]=name
metadata=subprocess.check_output(['git','cat-file','--batch-check=%(objectname) %(objecttype) %(objectsize)'],input=('\n'.join(objects)+'\n').encode()).decode().splitlines()
blobs=[(oid,int(size),objects[oid]) for oid,kind,size in (line.split() for line in metadata) if kind=='blob']
large=[{'path':name,'bytes':size} for _,size,name in blobs if size>=100_000_000]
assert not large,'Oversized outgoing files: '+repr(large)
patterns={
 'github-token':rb'(?<![A-Za-z0-9])(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{50,})',
 'aws-access-key':rb'(?<![A-Za-z0-9])AKIA[0-9A-Z]{16}(?![A-Za-z0-9])',
 'supabase-server-secret':rb'sb_secret_[A-Za-z0-9_-]{20,}',
 'private-key':rb'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----',
}
findings=[];text_count=0
process=subprocess.Popen(['git','cat-file','--batch'],stdin=subprocess.PIPE,stdout=subprocess.PIPE)
for oid,size,name in blobs:
    process.stdin.write((oid+'\n').encode());process.stdin.flush()
    header=process.stdout.readline().decode().split()
    payload=process.stdout.read(int(header[2]));assert process.stdout.read(1)==b'\n'
    if b'\x00' in payload[:8192]:continue
    text_count+=1
    for label,pattern in patterns.items():
        if re.search(pattern,payload):findings.append({'path':name,'kind':label})
process.stdin.close();process.wait();assert not findings,'Credential-shaped material requires review: '+repr(findings)
report={'remote':expected,'outgoingCommits':int(git('rev-list','--count','origin/main..HEAD')),'outgoingBlobs':len(blobs),'textBlobsChecked':text_count,'largestBlobBytes':max((b[1] for b in blobs),default=0),'trackedPrivateConfiguration':private,'highConfidenceCredentialFindings':findings,'limitation':'Heuristic scan, not proof of absence of every possible secret. Public publishable/anon keys are not classified as server credentials.','sentHead':git('rev-parse','HEAD')}
Path(__file__).with_name('outgoing-audit.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
print(json.dumps(report))
