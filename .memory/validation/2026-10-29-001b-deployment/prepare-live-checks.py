from pathlib import Path

ROOT=Path(__file__).resolve().parents[3]
HERE=Path(__file__).resolve().parent
source=(ROOT/'.memory/validation/2026-10-29-azure-build-env-wiring/verify-live.py').read_text(encoding='utf-8')
source=source.replace("'codeCommit': 'a60634857fbe749b7d724271791b13e0bcafefd6'", "'version':'0.01-b', 'codeCommit':'e0eaacf', 'deploymentHead':'435bc6e5b3fd9fd95d7893938d0a2daacfc9528f'")
source=source.replace("for path in ['/assets/game/aircraft/default.png'", """local_html=(ROOT/'dist/index.html').read_text(encoding='utf-8')
local_bundle=re.search(r'<script[^>]*src="([^\\"]+\\.js)"', local_html).group(1)
local_sha=hashlib.sha256((ROOT/'dist'/local_bundle.lstrip('/')).read_bytes()).hexdigest()
checks['bundle']['matchesLocalValidatedBuild']=checks['bundle']['sha256']==local_sha
assert checks['bundle']['matchesLocalValidatedBuild'], 'Azure may still serve the previous version.'
for path in ['/assets/audio/menu/orbit-run.wav', '/assets/game/aircraft/default.png'""")
source=source.replace("checks['remainingOperatorStep'] = 'Confirm Supabase Site URL and exact Azure /auth/callback allow-list, then real login and score-save smoke test.'", "checks['authProvider']['previousProductionLogin']='user-confirmed';checks['remainingOperatorStep']='New real-account score-write test not performed; no settings change required by this deployment.'")
(HERE/'verify-live.py').write_text(source,encoding='utf-8',newline='\n')
menu=(ROOT/'.memory/validation/2026-10-29-001b-boss-menu/measure-menu.mjs').read_text(encoding='utf-8')
menu=menu.replace('2026-10-29-001b-boss-menu','2026-10-29-001b-deployment').replace('http://127.0.0.1:4186/','https://proud-grass-03a132e00.6.azurestaticapps.net/').replace('9422','9425')
(HERE/'verify-live-menu.mjs').write_text(menu,encoding='utf-8',newline='\n')
