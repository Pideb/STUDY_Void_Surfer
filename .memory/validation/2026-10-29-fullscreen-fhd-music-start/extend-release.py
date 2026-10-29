from pathlib import Path
import hashlib, json

def extend(doc, metadata, root):
    here=Path(__file__).resolve().parent
    config=json.loads((here/'release-input.json').read_text(encoding='utf-8'))
    source=config['sourceCommit'];deployment=config['deployment']
    metadata['sourceCommit']=source
    metadata['sourceRevisionNote']=source+': FHD bounding buffer, native RAF and10s music-ready preparation'
    metadata['verification'].update(testFiles=config['testFiles'],tests=config['tests'],newVersionDeployed=bool(deployment))
    metadata['status']='deployed-verified' if deployment else 'validated-local-not-deployed'
    metadata.pop('deployment',None)
    if deployment:metadata['deployment']=deployment
    files=config['runtimeFiles']
    digest=hashlib.sha256(b''.join((name+'\n'+(root/name).read_text(encoding='utf-8').replace('\r\n','\n')).encode('utf-8') for name in files)).hexdigest()
    metadata['runtimeFingerprint']={'algorithm':'sha256','files':files,'value':digest}
    metadata['followUpChanges']+=['Global1920x1080 render cap; preserve native display RAF',
       'Stage music-ready start; frozen preparation;10s silent fallback and late same-track playback']
    for old in ['e0eaacf','3928989 + T04']:
        for prefix in ['게임 코드 ','게임 코드 기준은 ','게임 소스: ','0.01-b · 2026-10-29 · ']:
            doc=doc.replace(prefix+old,prefix+source)
    doc=doc.replace('57 / 718',f"{config['testFiles']} / {config['tests']}")
    doc=doc.replace('일반-보스 반복 / 첫 메뉴 소리 / 기체 모션 개선','FHD 렌더링 / 주사율 유지 / 음악 준비 후 출격(최대10초)')
    doc=doc.replace('data-count="718">718',f'data-count="{config["tests"]}">{config["tests"]}')
    doc=doc.replace('표시 크기·DPR에 맞춰 픽셀을 늘리되 DPR 2와 3840×2160 픽셀 분량의 상한을 둡니다.',
      '표시 크기·DPR에 맞추되 전체 그리기 버퍼는 최대1920×1080 안에 맞춥니다. 화면은 창 전체를 채우고 모니터 주사율 기반 RAF는 유지합니다.')
    doc=doc.replace('자산 로드 실패 시 대체 표현·합성 음악 등으로 플레이를 이어갈 수 있게 구성했습니다.',
      '시각 자산 실패 시 대체 표현을 사용합니다. 출격 음악이 준비되지 않으면 최대10초 후 무음으로 플레이를 시작하고, 같은 음악이 준비되면 나중에 재생합니다.')
    section='''<section id="fullscreen-start"><div class="section-head"><p class="eyebrow">0.01-b / FULLSCREEN &amp; MUSIC START</p><h2>전체화면의 부담을 낮추고,<br>음악과 함께 출격합니다.</h2><p class="lede">기체와 보스를 포함한 전체 그림을 최대 FHD로 제한했습니다. 게임 공간·기체 크기·피격 판정과 모니터 주사율은 유지합니다.</p></div><div class="verification-grid"><article class="card"><strong>1920 × 1080</strong><h3>전체 렌더링 상한</h3><p>초광폭·세로 화면도 비율을 유지하며 상한 안에 맞춥니다. 작은 화면을 억지로 FHD까지 키우지 않습니다. 기존 배경50%·벽75%·투사체50%·레이저35% 레이어를 유지합니다.</p></article><article class="card"><strong>최대 10초</strong><h3>음악 준비 후 출격</h3><p>메뉴곡과 임시 합성 음악을 끊고 선택한 스테이지의 음악을 준비합니다. 준비 중 기체·벽·점수·보스 시간은 멈춥니다. 준비되면 플레이와 BGM을 함께 시작합니다.</p></article><article class="card"><strong>무음 자동 출격</strong><h3>느린 로딩에도 계속</h3><p>10초가 지나면 자동으로 시작하고, 같은 게임곡이 준비되면 이어서 재생합니다. 취소·재시작·계정 변경 후 옛 결과는 새 게임이나 잘못된 음악을 시작하지 못합니다. 로딩에는 일시정지 감점이 없습니다.</p></article></div><div class="table-wrap"><table><caption>동일 장면90프레임 비교 · 소프트웨어 헤드리스 측정</caption><thead><tr><th>4K 화면 장면</th><th>버퍼 전 → 후</th><th>프레임 간격 p95</th><th>그리기·HUD p95</th></tr></thead><tbody><tr><td>일반 비행</td><td>3840×2160 → 1920×1080</td><td>83.4 → 33.4ms</td><td>21.8 → 6.7ms</td></tr><tr><td>보스전</td><td>3840×2160 → 1920×1080</td><td>133.4 → 50.0ms</td><td>122.2 → 7.0ms</td></tr></tbody></table></div><p class="note">Edge 헤드리스·GPU 비활성 조건에서 같은 초기 상태와 검증용 시간 단계로 비교했습니다. 물리 GPU의 FPS 개선 보장이 아닙니다. 이미 FHD인 화면에서는 유의미한 개선을 주장하지 않으며, 60FPS 제한을 새로 넣지 않았습니다. 기존 메뉴 실측은 이전 변경의 역사 자료로 유지합니다.</p></section>'''
    doc=doc.replace('<section id="validation">',section+'\n<section id="validation">',1)
    marker='<h3 class="subheading">유지한 것</h3>'
    doc=doc.replace(marker,'<h3 class="subheading">후속 조정 · FHD와 음악 준비</h3><p>전체 그리기 상한 FHD·모니터 주사율 유지, 선택 스테이지 음악 준비 후 출격, 최대10초 뒤 무음 자동 출격과 늦은 음원 재생을 적용했습니다.</p>'+marker)
    if not deployment:
        doc=doc.replace('CURRENT DEPLOYED VERSION','CURRENT LOCAL WORK')
        doc=doc.replace('Azure 배포 · 공개 파일 검증 완료','로컬 검증 완료 · 새 후속 수정 미배포')
        doc=doc.replace('상태: Azure 배포 및 공개 파일 검증 완료','상태: 로컬 검증 완료, 후속 수정 미배포')
        doc=doc.replace('로컬 검증 후 Azure 배포를 완료했고 운영 파일이 검증한 빌드와 일치하는지 확인했습니다.',
          '이번 FHD·음악 준비 후속 수정은 로컬 검증을 마쳤습니다. 새 소스의 배포는 아직 확인하지 않았으며 이전 배포와 구분합니다.')
        doc=doc.replace('2026.10.29 Azure 배포를 완료했습니다. 공유 중인 주소에서 0.01-b를 플레이할 수 있습니다. 로그인 콜백·공개 랭킹 조회·실제 첫 메뉴 입력의 음악 시작을 확인했습니다.',
          'FHD·음악 준비 후속 수정은 현재 로컬 검증 단계입니다. Azure 공유 주소는 이전0.01-b 배포를 유지합니다. 새 배포는 일치하는 Actions 실행과 공개 파일을 확인한 뒤 기록합니다.')
    else:
        doc=doc.replace('2026.10.29 Azure 배포를 완료했습니다.', '2026.10.29 FHD·음악 준비 후속 수정을 포함한 Azure 배포를 완료했습니다.')
    return doc,metadata
