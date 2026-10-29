from pathlib import Path
import base64, hashlib, html, json, re

ROOT = Path(__file__).resolve().parents[3]
HERE = Path(__file__).resolve().parent
BASE = ROOT / 'docs/releases/void-surfer-0.01v.html'
OLD_BYTES = BASE.read_bytes()
OLD_HASH = hashlib.sha256(OLD_BYTES).hexdigest()
doc = OLD_BYTES.decode('utf-8')
runtime_commit = '3928989'

def replace_section(identifier, contents):
    global doc
    pattern = r'<section id="' + re.escape(identifier) + r'"[^>]*>[\s\S]*?</section>'
    doc, count = re.subn(pattern, lambda _: contents, doc, count=1)
    assert count == 1, identifier

# Retain the entire original visualization scaffold, assets and interactions.
# Only the new snapshot is written; the 0.01v baseline remains byte-identical.
doc = doc.replace('0.01v', '0.01-b')
doc = doc.replace('FIRST VIBE-CODING PROJECT / RELEASE BASELINE', 'FIRST VIBE-CODING PROJECT / ITERATION 0.01-b')
doc = doc.replace('첫 문서화 버전 기준', '이번 작업 버전')
doc = doc.replace('WARNING ↔ BOSS', '일반 ↔ BOSS')
doc = doc.replace('data-count="699">699', 'data-count="716">716')

# Fresh menu capture; keep older engine scene captures labelled as baseline.
image_uri = 'data:image/png;base64,' + base64.b64encode((HERE/'final-1440.png').read_bytes()).decode()
doc = re.sub(r'(<figure class="hero-screen"><img[^>]*src=")[^"]+', lambda m: m.group(1)+image_uri, doc, count=1)
doc = doc.replace('실제 엔진·렌더러 캡처 · 검증용 점수/전투 상태 사용', '0.01v 엔진·렌더러 기준 캡처 · 공통 자산 참고 / 검증용 점수·상태')
doc = doc.replace('실제 캡처 · 고유 탄막과 궤도 예고', '0.01v 기준 캡처 · 고유 탄막·궤도 자산 참고')
doc = doc.replace('실제 캡처 · WARNING 중 두 줄 레이저', '0.01v 역사 캡처 · 당시 WARNING의 두 줄 레이저 / 현재 독립 WARNING 비활성')

changes = [
    ('전투·연출','독립 WARNING 대신 매번 보스전','일반 → WARNING → 일반 → BOSS로 실제 보스전 사이에 별도 경고 웨이브가 있었습니다.','일반 → BOSS → 일반 → BOSS로 변경했습니다. 첫 20점, 이후 클리어 점수에서 5~8점 뒤라는 진입 기준은 유지합니다.','보스 번호·해금은 실제 클리어 수로 계산하고 보스가 만든 벽은 뒤에 남아도 점수를 주지 않습니다.'),
    ('전투·연출','WARNING은 향후 재설계를 위해 보관','지운 기능을 나중에 다시 기획할 때 기존 규칙과 의도를 잃을 수 있습니다.','0.01v의 순서·벽 수·최소 특수벽·판정·음향·화면 규칙과 원본 커밋을 별도 보관했습니다.','보관 중인 설계이며 지금 플레이에서 별도 WARNING 구간이 나타나지는 않습니다.'),
    ('신뢰성·성능','게임에 들어갔다 나와야 소리가 나던 문제','소리 활성화가 게임 시작에만 묶여 있어 타이틀의 조작만으로는 메뉴곡이 시작되지 않았습니다.','첫 메뉴 클릭·터치 완료·일반 키 입력에서 소리를 활성화합니다. 요청 중복·실패 후 재시도·화면 종료 정리를 처리하고 메뉴곡만 먼저 불러옵니다.','첫 사용자 입력 전에는 브라우저 정책에 따라 무음일 수 있습니다. 음소거·일시정지 규칙은 유지합니다.'),
    ('화면·디자인','메인 기체의 부유 모션이 끊기던 문제','계정 정보나 음소거 상태를 갱신할 때 기체 DOM을 새로 만들면서 움직임이 처음으로 튀었습니다.','같은 기체는 연결된 DOM·애니메이션 시간을 유지합니다. 기체와 불꽃을 3D 변환 전용 래퍼에서 함께 움직이고 정적 광원과 분리했습니다.','실측에서는 프레임 간격을 유지했고, 상태 갱신 후에도 같은 애니메이션이 이어졌습니다. 모든 기기의 FPS 향상으로 일반화하지 않습니다.'),
]

new_cases = []
for i,(category,title,before,after,reason) in enumerate(changes):
    new_cases.append(f'<details class="feedback-item" data-category="{category}" open><summary><span class="feedback-index">b{i+1:02d}</span><span class="feedback-title">{title}<small>0.01-b · {category}</small></span><span class="plus" aria-hidden="true">+</span></summary><div class="feedback-body"><div><span class="mini-label">플레이 중 발견</span><p>{before}</p></div><div><span class="mini-label">0.01-b 반영</span><p>{after}</p></div><p class="reason">{reason}</p></div></details>')

feedback = re.search(r'<section id="feedback">[\s\S]*?</section>',doc).group(0)
feedback = feedback.replace('0.01-b 반영','0.01v 당시 반영')
feedback = feedback.replace('현재 버전 관점으로 정리한 21개 사례입니다.', '정리한 기록입니다. 위쪽 4건은 이번 0.01-b의 변경이며, 뒤의 21건은 0.01v 당시의 개선 이력입니다. 과거 규칙은 현재 규칙과 구분해 읽어 주세요.')
feedback = feedback.replace('21개 개선 기록','25개 개선 기록')
feedback = feedback.replace('<div class="feedback-list">','<div class="feedback-list">'+''.join(new_cases),1)
replace_section('feedback',feedback)

rules_original = re.search(r'<section id="rules">[\s\S]*?</section>',doc).group(0)
chart = rules_original[rules_original.index('<div class="chart-intro">'):]
rules = [
 ('피격과 특수벽 성공은 서로 다른 판정입니다.','피격은 기체 중앙의 공통 16×16 정사각형, 특수벽 성공 입력은 공통 56×36 영역으로 판단합니다. 큰 성공 영역이 벽 앞 구간에 일부라도 닿을 때 새 Space 입력으로 성공할 수 있으며, 접촉만으로 자동 발동하지 않습니다.','성공 구간 폭은 현재 속도 × 평소 0.30초 / 보스전 0.15초입니다. 복합벽의 위아래 일반 벽은 작은 피격 영역으로 검사합니다. 이미 충돌한 후에는 입력으로 되살릴 수 없습니다.'),
 ('대시는 모든 위험을 지우지 않습니다.','Space는 새로 누를 때 한 번, 쿨타임은 0.7초입니다. 작은 흰 충전 링으로 상태를 알립니다. 대시 효과 0.6초 동안 적 투사체 접촉을 피할 수 있지만 일반벽·적 레이저·화면 경계의 충돌은 유지됩니다.','특수벽은 별도의 타이밍 성공으로 돌파하고 기체가 지난 부분을 중심으로 부서집니다. 일반 플레이에는 네모 히트박스를 표시하지 않습니다.'),
 ('처음부터 일반 → 보스 → 일반 → 보스','첫 보스 진입 기준은 20점입니다. 이후에는 보스를 클리어한 점수에서 5~8점 뒤 다음 보스가 열립니다. 기존 벽·공격을 모두 정리하고 암전·사이렌·보스 입장을 거치는 규칙은 유지합니다.','독립 WARNING 웨이브는 현재 등장하지 않습니다. 보스 번호와 콘텐츠 해금은 실제 보스를 클리어한 수로 계산합니다. 보스 벽 묶음은 7개·특수벽 최소 3개·일반벽 최소 2개이며, 벽 몇 개를 넘는 것으로 전투가 끝나지는 않습니다.'),
 ('벽과 구멍은 점진적으로 확장됩니다.','10점부터 특수벽 후보가 열립니다. 특수벽 확률은 일반 20%·보스전 50%이며 생성 간격과 할당량에 따라 보정합니다. 첫 보스 클리어 후 이동 구멍 50%, 특수벽 선택 중 절반의 복합벽이 열립니다.','평소 생성 간격 2초, 보스 1.4초이며 VELOCITY는 절반입니다. 구멍 높이는 평소 180·보스 135 논리 픽셀, 이동 구멍 주기는 평소 4.8초·보스 3.2초입니다. 고속 구멍의 높이 연속성과 필수 대시 대응 간격 1.2초를 유지합니다.'),
 ('점수와 속도는 분리해 관리합니다.','일반 벽 통과는 1점, 보스가 만든 벽과 WASD는 0점, 보스 클리어는 10점입니다. 보스가 사라진 후 뒤에 남은 보스 벽도 통과 점수를 주지 않습니다. VELOCITY는 원점수 × 1.5를 반올림해 최종 점수로 표시합니다.','속도용 진행 점수는 10점마다 실제 +10px/s, 상한 220점입니다. 일반 최고속도는 NOVA·AEGIS 460px/s, VELOCITY 700px/s이고 보스 배율은 별도입니다. 일시정지 −10점으로 이미 오른 속도가 내려가지는 않으며 변속은 2초에 걸쳐 전환합니다.'),
 ('레이저는 예고와 안전 경로를 먼저 보여줍니다.','보스전 줄 레이저와 전역 레이저, 기존 궤도 예고·발사·안전 지대는 유지합니다. 줄 레이저는 위아래 15%를 제외하고 일반벽 구멍·움직임 범위를 피합니다. 전역 패턴에서는 벽·다른 공격이 겹치지 않습니다.','첫 보스 클리어는 이동·복합벽, 두 번째 보스 클리어는 일반 구간 줄 레이저를 해금합니다. 일반 구간 줄 레이저는 3초마다 70% 확률로 시도하고 한 줄 70%·두 줄 30%입니다. 안전한 위치가 없으면 줄이거나 건너뜁니다.'),
 ('메뉴에서도 첫 동작부터 소리를 켭니다.','게임 시작을 누르기 전이라도 첫 클릭·터치 완료·일반 키 입력에서 메뉴 BGM이 시작됩니다. 메뉴에서는 ORBIT RUN만 먼저 불러오고 지역 음악은 실제 게임 진입 때 준비합니다.','브라우저의 첫 사용자 입력 전 자동재생 제한은 존중합니다. 음소거 설정을 유지하고, 소리 활성화 요청이 실패하면 다음 동작에서 재시도합니다. 같은 기체의 메뉴 상태 갱신은 부유 모션을 처음으로 되돌리지 않습니다.'),
]
body='<section id="rules"><div class="section-head"><p class="eyebrow">04 / RULEBOOK · 0.01-b</p><h2>공정하게 읽히는 현재 규칙.</h2><p class="lede">아래는 0.01-b에서 동작하는 규칙입니다. 폐지된 독립 WARNING은 별도 보관 항목과 과거 피드백에서만 설명합니다.</p></div><div class="rules-list">'
for i,(title,a,b) in enumerate(rules):
    body+=f'<details class="rule" name="rulebook"'+(' open' if i==0 else '')+f'><summary><span class="rule-num">{i+1:02d}</span>{title}<span class="plus" aria-hidden="true">+</span></summary><div class="detail-body"><p>{a}</p><p>{b}</p></div></details>'
replace_section('rules',body+'</div>'+chart)

archive='''<section id="warning-archive"><div class="section-head"><p class="eyebrow">PRESERVED DESIGN / NOT ACTIVE</p><h2>WARNING은 보관 중입니다.</h2><p class="lede">완전히 잊거나 삭제한 기능이 아닙니다. 나중에 다른 형태로 다시 기획할 수 있도록 당시 규칙과 구현 지점을 남겼습니다.</p></div><details class="card"><summary>0.01v의 독립 WARNING 규칙 펼치기</summary><div class="detail-body"><p>일반 → WARNING → 일반 → BOSS. WARNING 벽 5개·특수벽 최소 2개, 특수벽 확률 50%, 구멍 135px, 생성 1.4초, 타이밍 0.15초였습니다. 붉은 분위기·중앙 알림·별도 경고음을 사용했고 일반 WARNING 벽은 점수를 주었습니다.</p><p>0.01-b에서는 이 독립 구간에 보스전을 배치했습니다. 복원할 때는 실제 보스 횟수와 다른 사건을 다시 섞지 않도록 별도 규칙을 설계할 예정입니다. 새 부활 방식은 아직 결정하지 않았습니다.</p><code>.memory/archive/2026-10-29-warning-0.01v.md</code></div></details></section>'''
doc=doc.replace('<section id="architecture">',archive+'\n<section id="architecture">',1)

validation='''<section id="validation"><div class="section-head"><p class="eyebrow">09 / EVIDENCE · 0.01-b</p><h2>달라진 규칙을 다시 검증했습니다.</h2><p class="lede">현재 게임 코드 기준 커밋 3928989. 아래는 이번 로컬 작업의 결과이며 운영 서버에 새 버전을 배포했다는 뜻은 아닙니다.</p></div><div class="verification-grid"><article class="card"><strong>57 / 716</strong><h3>테스트 파일 / 사례</h3><p>전체 회귀 검사, 빌드, Azure·Vercel 콜백 설정 검사를 통과했습니다.</p></article><article class="card"><strong>1 → 2</strong><h3>실제 보스 번호</h3><p>20점 진입부터 첫 클리어, 일반 구간, 다음 보스와 2회 클리어 해금까지 엔진 통합 검사로 확인했습니다.</p></article><article class="card"><strong>첫 동작</strong><h3>실제 메뉴 오디오</h3><p>엄격한 자동재생 정책의 브라우저에서 첫 메뉴 클릭 후 AudioContext 실행과 ORBIT RUN 반복 재생을 확인했습니다.</p></article></div><details class="card evidence-details"><summary>메뉴 움직임 측정의 실제 결과와 한계 보기 <span aria-hidden="true">+</span></summary><div class="detail-body"><p>1440px Edge 헤드리스·GPU 비활성 조건에서 준비 후 180프레임을 비교했습니다. 이전·이후 중앙값과 95백분위 프레임 간격은 모두 약 16.7ms였고 33ms 초과 프레임은 관찰되지 않았습니다. 이 조건에서 사용자 기기의 모든 끊김을 재현한 것은 아닙니다.</p><p>변경 전 첫 메뉴 클릭에는 오디오 컨텍스트가 없었고, 변경 후에는 실행 상태와 메뉴곡 한 개의 로딩·재생을 확인했습니다. 음소거 상태 갱신 후에도 동일 기체 DOM·모션·애니메이션 시간은 유지됐고, 동작 줄이기 설정도 적용됐습니다. 측정 중 메인 스레드 작업 시간은 이전 약 72ms·이후 약 106ms로 전반적인 CPU 감소를 주장하지 않습니다.</p><p>실제 GPU의 체감 부드러움과 스피커 청취는 사용자 플레이 피드백으로 추가 확인합니다. 운영 계정 로그인은 앞서 사용자가 확인했으나 새 버전의 실계정 점수 쓰기 검증은 별도로 남아 있습니다.</p></div></details></section>'''
replace_section('validation',validation)

release='''<section id="release"><div class="section-head"><p class="eyebrow">10 / VERSION HISTORY</p><h2>이번 작업은 0.01-b.</h2><p class="lede">0.01v의 첫 기준을 보존하고, 이번 변경을 별도 파일과 버전 항목으로 기록합니다.</p></div><div class="release-panel"><div><span class="eyebrow">CURRENT LOCAL WORK</span><strong class="release-number">0.01-b</strong><p>기준일 2026.10.29<br>게임 코드 3928989<br>상태: 로컬 검증 완료 · 미배포</p><button class="button" id="copyVersion">버전 정보 복사</button><p id="copyStatus" class="note" aria-live="polite"></p></div><div><h3>이번 변경 네 가지</h3><ul><li>독립 WARNING을 보스전으로 교체: 일반 → 보스 반복</li><li>이전 WARNING의 규칙·원본 커밋·복원 주의점 보관</li><li>첫 메뉴 동작에서 소리 활성화, 불필요한 지역곡 로딩 방지</li><li>동일 기체 DOM과 모션 시간 유지, 기체·불꽃의 공통 3D 움직임</li></ul><h3 class="subheading">유지한 것</h3><p>기체 밸런스·피격/성공 판정·보스 HP·직접 조준·점수 배율·6지역 자산·계정/게스트/랭킹 규칙은 유지합니다. 실제 클리어 수에 맞춰 콘텐츠 해금을 연결했습니다.</p><p class="note">로컬 커밋으로 정리한 버전입니다. 현재 공유 중인 Azure 주소는 기존 배포를 유지합니다. npm 패키지 버전과 Git 태그는 변경하지 않았습니다.</p></div></div><div class="table-wrap"><table><caption>누적 버전 기록</caption><thead><tr><th>버전</th><th>역할</th><th>기록</th></tr></thead><tbody><tr><td>0.01v</td><td>첫 문서화·배포 기준</td><td>3기체·6지역·기존 WARNING/BOSS 교대·21개 피드백 이력. 기존 HTML 보존.</td></tr><tr><td>0.01-b</td><td>보스 흐름·메뉴 신뢰성 개선</td><td>이번 네 변경과 실제 검증, WARNING 보관, 미배포 상태를 새 HTML로 기록.</td></tr></tbody></table></div><p class="note">다음 변경도 버전·날짜·소스 커밋·추가/변경/수정·피드백·검증·배포 여부를 별도로 남깁니다. 실제 게임 공유 주소: https://proud-grass-03a132e00.6.azurestaticapps.net</p></section>'''
replace_section('release',release)
doc=doc.replace('총 21개', '총 25개')
doc=doc.replace('VOID SURFER 0.01-b\\n기준일: 2026-10-29\\n게임 소스: f69a166\\n3기체 / 6지역 / 테스트 699개 통과\\n상태: 배포 준비 기준','VOID SURFER 0.01-b\\n기준일: 2026-10-29\\n게임 소스: 3928989\\n일반-보스 반복 / 첫 메뉴 소리 / 기체 모션 개선\\n상태: 로컬 검증 완료, 미배포')
doc=doc.replace('0.01-b · 2026-10-29 · f69a166','0.01-b · 2026-10-29 · 3928989')
metadata={
 'product':'VOID SURFER','version':'0.01-b','baselineDate':'2026-10-29','sourceCommit':runtime_commit,
 'status':'validated-local-not-deployed','document':'void-surfer-0.01-b.html','format':'single-file-html',
 'workflow':['grill-me','memory-plan','memory-execute'],'aircraft':['NOVA','AEGIS','VELOCITY'],
 'verification':{'testFiles':57,'tests':716,'build':'passed','configuration':'passed','strictAutoplayMenuLoopVerified':True,'realProductionLogin':'user-confirmed for previous deployment','newVersionDeployed':False,'physicalGpuFpsMeasured':False},
 'feedbackCases':25,'changes':[item[1] for item in changes],'warningArchive':'.memory/archive/2026-10-29-warning-0.01v.md',
 'productionUrl':'https://proud-grass-03a132e00.6.azurestaticapps.net','previousVersion':'0.01v',
}
doc=re.sub(r'<script type="application/json" id="releaseMetadata">[\s\S]*?</script>',lambda _:'<script type="application/json" id="releaseMetadata">'+json.dumps(metadata,ensure_ascii=False)+'</script>',doc,count=1)
doc='\n'.join(line.rstrip() for line in doc.splitlines())+'\n'
out=ROOT/'docs/releases/void-surfer-0.01-b.html';out.write_bytes(doc.encode('utf-8'))
copy=Path.home()/'Downloads/void-surfer-0.01-b.html';copy.write_bytes(out.read_bytes())
registry=ROOT/'docs/releases/versions.json';history=json.loads(registry.read_text(encoding='utf-8'))
history['currentVersion']='0.01-b';history['releases']=[r for r in history['releases'] if r['version']!='0.01-b']+[metadata]
registry.write_text(json.dumps(history,ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')
assert BASE.read_bytes()==OLD_BYTES
assert len(re.findall(r'class="feedback-item"',doc))==25
assert '0.01v 当' not in doc
report={'document':str(out.relative_to(ROOT)),'bytes':out.stat().st_size,'sha256':hashlib.sha256(out.read_bytes()).hexdigest(),'oldSnapshotSha256':OLD_HASH,'oldSnapshotUnchanged':True,'downloadsCopyEqual':out.read_bytes()==copy.read_bytes(),'feedbackCases':25,'sourceCommit':runtime_commit,'deployed':False}
(HERE/'html-build.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
print(json.dumps(report))
