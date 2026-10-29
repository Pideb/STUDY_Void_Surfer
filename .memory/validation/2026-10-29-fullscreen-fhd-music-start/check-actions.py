"""Read a push-triggered Azure run; stored Git credentials stay in memory."""
from pathlib import Path
import argparse, importlib.util, json, subprocess, sys, urllib.parse, urllib.request

ROOT = Path(__file__).resolve().parents[3]
HERE = Path(__file__).resolve().parent
parser = argparse.ArgumentParser()
parser.add_argument('--sha', default=None)
parser.add_argument('--no-save', action='store_true')
args = parser.parse_args()
sha = args.sha or subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip()
sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location('public_configuration',ROOT/'scripts/configure-github-public-env.py')
config = importlib.util.module_from_spec(spec); spec.loader.exec_module(config)
credential = config.stored_git_credential()
workflow = 'azure-static-web-apps-proud-grass-03a132e00.yml'
query = urllib.parse.urlencode({'head_sha':sha,'event':'push','branch':'main','per_page':10})
url = f'https://api.github.com/repos/{config.REPOSITORY}/actions/workflows/{workflow}/runs?{query}'
request = urllib.request.Request(url,headers={'Authorization':f'Bearer {credential}',
  'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'void-surfer-release-verification'})
with urllib.request.urlopen(request,timeout=30) as response:
    payload = json.load(response)
runs = payload.get('workflow_runs',[])
if not runs:
    print(json.dumps({'headSha':sha,'status':'not-listed-yet'}));sys.exit(0)
run = max(runs,key=lambda r:r['id'])
report = {key:run.get(key) for key in ['id','head_sha','head_branch','status','conclusion','html_url','created_at','updated_at']}
if not args.no_save:
    (HERE/'actions-run.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
print(json.dumps(report))
