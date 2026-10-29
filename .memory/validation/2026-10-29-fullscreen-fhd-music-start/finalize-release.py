from pathlib import Path
import json
ROOT=Path(__file__).resolve().parents[3];HERE=Path(__file__).resolve().parent
run=json.loads((HERE/'actions-run.json').read_text(encoding='utf-8'))
live=json.loads((HERE/'live-checks.json').read_text(encoding='utf-8'))
assert run['status']=='completed' and run['conclusion']=='success'
assert run['head_sha']==live['deploymentHead'] and live['bundle']['matchesLocalValidatedBuild']
source=HERE/'release-input.json';config=json.loads(source.read_text(encoding='utf-8'))
config['deployment']={'headSha':run['head_sha'],'runId':run['id'],'runUrl':run['html_url'],
  'completedAtUtc':run['updated_at'],'bundleSha256':live['bundle']['sha256'],'origin':live['origin']}
source.write_text(json.dumps(config,indent=2)+'\n',encoding='utf-8',newline='\n')
