"""Configure only the two public Vite variables; never persist or print Git credentials."""
from pathlib import Path
import base64
import json
import os
import subprocess
import sys
import urllib.error
import urllib.parse
import urllib.request

REPOSITORY = 'Pideb/STUDY_Void_Surfer'
KEYS = ('VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY')
ROOT = Path(__file__).resolve().parents[1]


def load_public_configuration():
    values = {}
    for name in ('.env', '.env.local'):
        source = ROOT / name
        if not source.exists():
            continue
        for line in source.read_text(encoding='utf-8-sig').splitlines():
            key, separator, value = line.strip().partition('=')
            if separator and key.strip() in KEYS:
                values[key.strip()] = value.strip().strip('"\'')
    if any(not values.get(key) for key in KEYS):
        raise RuntimeError('The existing local public Vite configuration is incomplete.')
    project = urllib.parse.urlparse(values[KEYS[0]])
    if project.scheme != 'https' or not project.hostname or project.username or project.password:
        raise RuntimeError('The public project URL must use HTTPS without embedded credentials.')
    key = values[KEYS[1]]
    is_public = key.startswith('sb_publishable_') and len(key) > 20
    if not is_public:
        try:
            segment = key.split('.')[1]
            payload = json.loads(base64.urlsafe_b64decode(segment + '=' * (-len(segment) % 4)))
            is_public = payload.get('role') == 'anon'
        except (IndexError, ValueError, TypeError):
            pass
    if not is_public:
        raise RuntimeError('Only a publishable or legacy anon key may be used as browser configuration.')
    return values


def stored_git_credential():
    remote = subprocess.check_output(['git', 'remote', 'get-url', 'origin'], cwd=ROOT, text=True).strip()
    if remote != f'https://github.com/{REPOSITORY}.git':
        raise RuntimeError('Unexpected origin; refusing to configure another repository.')
    environment = dict(os.environ, GIT_TERMINAL_PROMPT='0', GCM_INTERACTIVE='never')
    result = subprocess.run(['git', 'credential', 'fill'], cwd=ROOT, env=environment,
        input=f'url={remote}\n\n', capture_output=True, text=True, timeout=30)
    fields = dict(line.split('=', 1) for line in result.stdout.splitlines() if '=' in line)
    if result.returncode or not fields.get('password'):
        raise RuntimeError('Stored Git authentication is unavailable; use the GitHub Variables settings page.')
    return fields['password']


def configure():
    values = load_public_configuration()
    credential = stored_git_credential()
    prefix = f'https://api.github.com/repos/{REPOSITORY}/actions/variables'

    def request(method, url, data=None):
        payload = None if data is None else json.dumps(data).encode('utf-8')
        req = urllib.request.Request(url, data=payload, method=method, headers={
            'Authorization': f'Bearer {credential}', 'Accept': 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28', 'Content-Type': 'application/json',
            'User-Agent': 'void-surfer-deployment-configuration',
        })
        try:
            with urllib.request.urlopen(req, timeout=30) as response:
                body = response.read()
                return response.status, json.loads(body) if body else None
        except urllib.error.HTTPError as error:
            if method == 'GET' and error.code == 404:
                return 404, None
            raise RuntimeError(f'GitHub repository-variable API returned HTTP {error.code}; no credential values were logged.') from None

    outcomes = []
    for name in KEYS:
        url = prefix + '/' + name
        status, current = request('GET', url)
        action = 'unchanged'
        if status == 404:
            request('POST', prefix, {'name': name, 'value': values[name]})
            action = 'created'
        elif current.get('value') != values[name]:
            request('PATCH', url, {'name': name, 'value': values[name]})
            action = 'updated'
        _, confirmed = request('GET', url)
        if confirmed.get('value') != values[name]:
            raise RuntimeError(f'Variable readback did not match: {name}')
        outcomes.append({'name': name, 'action': action, 'readbackMatches': True})
    return outcomes


if __name__ == '__main__':
    try:
        print(json.dumps({'repository': REPOSITORY, 'variables': configure()}))
    except Exception as error:
        # Request objects and stored credentials are deliberately never printed.
        print('Public configuration failed: ' + (str(error) if isinstance(error, RuntimeError) else type(error).__name__), file=sys.stderr)
        sys.exit(1)
