from pathlib import Path
ROOT=Path(__file__).resolve().parents[3]
HERE=Path(__file__).resolve().parent
code=(ROOT/'.memory/validation/2026-10-29-001b-deployment/verify-live.py').read_text(encoding='utf-8')
code=code.replace("'codeCommit':'e0eaacf'","'codeCommit':'e90bb76'")
code=code.replace('435bc6e5b3fd9fd95d7893938d0a2daacfc9528f','e90bb76ccc072aef086941e2b6aa9b4a38485a50')
(HERE/'verify-live.py').write_text(code,encoding='utf-8',newline='\n')
log=HERE/'full-tests.log';raw=log.read_bytes()
if raw[:2] in (b'\xff\xfe',b'\xfe\xff'):
    log.write_text(raw.decode('utf-16').replace('\r','').rstrip()+'\n',encoding='utf-8',newline='\n')
