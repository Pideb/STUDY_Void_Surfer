from pathlib import Path
import subprocess
ROOT=Path(__file__).resolve().parents[3]
HERE=Path(__file__).resolve().parent
baseline=subprocess.check_output(['git','show','c29380b:src/game/render-resolution.js'],cwd=ROOT).decode('utf-8')
(HERE/'resolution-baseline.mjs').write_text(baseline,encoding='utf-8',newline='\n')
renderer=(ROOT/'src/game/renderer.js').read_text(encoding='utf-8').replace("from './", "from '/src/game/")
renderer=renderer.replace("from '/src/game/render-resolution.js'", "from './resolution-baseline.mjs'")
(HERE/'renderer-baseline.mjs').write_text(renderer,encoding='utf-8',newline='\n')
