from pathlib import Path
import hashlib
import importlib.util
import json
import re
import sys
import urllib.request

ROOT = Path(__file__).resolve().parents[3]
ORIGIN = 'https://proud-grass-03a132e00.6.azurestaticapps.net'
module = importlib.util.spec_from_file_location('public_configuration', ROOT / 'scripts/configure-github-public-env.py')
config = importlib.util.module_from_spec(module)
sys.dont_write_bytecode = True
module.loader.exec_module(config)
values = config.load_public_configuration()

def get(url, method='GET', headers=None, data=None):
    request = urllib.request.Request(url, method=method, headers=headers or {}, data=data)
    with urllib.request.urlopen(request, timeout=40) as response:
        return response.status, dict(response.headers), response.read()

checks = {'origin': ORIGIN, 'codeCommit': 'a60634857fbe749b7d724271791b13e0bcafefd6', 'http': []}
pages = {}
for path in ['/', '/auth/callback']:
    status, headers, body = get(ORIGIN + path)
    text = body.decode('utf-8')
    assert status == 200 and 'id="app"' in text
    checks['http'].append({'path': path, 'status': status, 'appHtml': True})
    pages[path] = text
assert pages['/'] == pages['/auth/callback']
bundle_path = re.search(r'<script[^>]*src="([^\"]+\.js)"', pages['/']).group(1)
status, _, bundle = get(ORIGIN + bundle_path)
text = bundle.decode('utf-8')
checks['bundle'] = {'path': bundle_path, 'status': status,
    'projectUrlPresent': values['VITE_SUPABASE_URL'] in text,
    'publishableKeyPresent': values['VITE_SUPABASE_ANON_KEY'] in text,
    'sha256': hashlib.sha256(bundle).hexdigest()}
assert checks['bundle']['projectUrlPresent'] and checks['bundle']['publishableKeyPresent'], 'Live bundle does not yet contain the configured public values.'
for path in ['/assets/game/aircraft/default.png', '/assets/game/stages/crystal-gates/background.png', '/assets/game/stages/crystal-gates/boss-evolved.png', '/assets/audio/boss-entry.wav']:
    status, headers, body = get(ORIGIN + path)
    assert status == 200 and len(body) > 100
    checks['http'].append({'path': path, 'status': status, 'bytes': len(body)})
api_key = {'apikey': values['VITE_SUPABASE_ANON_KEY'], 'Content-Type': 'application/json', 'Origin': ORIGIN}
status, headers, body = get(values['VITE_SUPABASE_URL'].rstrip('/') + '/rest/v1/rpc/get_public_leaderboard', method='POST', headers=api_key, data=b'{"p_limit":1,"p_offset":0}')
rows = json.loads(body)
assert status == 200 and isinstance(rows, list)
cors = next((value for name,value in headers.items() if name.lower() == 'access-control-allow-origin'), None)
assert cors in ('*', ORIGIN), 'Ranking response must allow the Azure browser origin.'
checks['publicRanking'] = {'status': status, 'rowsRead': len(rows), 'writePerformed': False, 'azureOriginAllowedByCors': True}
status, _, body = get(values['VITE_SUPABASE_URL'].rstrip('/') + '/auth/v1/settings', headers=api_key)
settings = json.loads(body)
checks['authProvider'] = {'status': status, 'azureEnabled': settings.get('external', {}).get('azure') is True, 'realLoginVerified': False}
checks['remainingOperatorStep'] = 'Confirm Supabase Site URL and exact Azure /auth/callback allow-list, then real login and score-save smoke test.'
Path(__file__).with_name('live-checks.json').write_text(json.dumps(checks, indent=2)+'\n', encoding='utf-8')
print(json.dumps(checks))
