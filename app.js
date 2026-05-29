/* ================================================
   홈트 플래너 v3 — 주차별 강도 자동 증가
   시작일: 2025-05-30 / 중급 기준
   키: 182cm / 112kg → 90kg / 4~5개월
   장비: 스텝퍼, 스텝박스, 월볼, 메디신볼, 맨몸
   특이사항: 심폐 약함, 알배김 강함 → 지구력 집중
   ================================================ */

const START_DATE = '2026-05-30';

// ===== 주차 계산 =====
function getCurrentWeek() {
  const start = new Date(START_DATE);
  const now = new Date();
  start.setHours(0,0,0,0); now.setHours(0,0,0,0);
  const diff = Math.floor((now - start) / (1000 * 60 * 60 * 24 * 7));
  return Math.max(1, diff + 1);
}

function getPhase(week) {
  if (week <= 2)  return { phase: 1, label: '심폐 적응기',   color: '#3498db', desc: '심폐를 깨우는 단계 — 지구력 기반 다지기' };
  if (week <= 4)  return { phase: 2, label: '지구력 강화기', color: '#27ae60', desc: '휴식 단축 + 스텝퍼 시간 증가' };
  if (week <= 6)  return { phase: 3, label: '복합 강화기',   color: '#f39c12', desc: '슈퍼세트 도입 + 인터벌 강도↑' };
  if (week <= 8)  return { phase: 4, label: 'HIIT 집중기',   color: '#e67e22', desc: '고강도 인터벌 비중↑ + 휴식 최소화' };
  if (week <= 10) return { phase: 5, label: '피크 강도기',   color: '#e74c3c', desc: '전신 복합 서킷 + 스텝퍼 인터벌' };
  return           { phase: 6, label: '유지·심화기',   color: '#8e44ad', desc: '무게 증가 + 변형 동작 심화' };
}

// ===== 주차별 루틴 DB =====
// 구조: PHASE_PLANS[phase][dayIndex] = { ... exercises }
const PHASE_PLANS = {

  // ── PHASE 1 (1~2주): 심폐 적응기 ──────────────────────────────
  1: {
    0: { type:'rest', label:'완전 휴식', exercises:[] },
    1: {
      type:'strength', label:'하체·코어 (중급 기준점)', totalMin:60,
      note:'세트 간 휴식 45초. 알배김 예방을 위해 쿨다운 7분 필수!',
      exercises:[
        { name:'준비운동 — 스텝퍼 워밍업',      detail:'6분 천천히 (분당 65 스텝)',           tag:'warm',     min:6 },
        { name:'스쿼트',                          detail:'4세트 × 15회 (휴식 45초)',            tag:'strength', min:9 },
        { name:'런지 (좌우 교대)',                detail:'3세트 × 14회 (휴식 45초)',            tag:'strength', min:8 },
        { name:'힙 브릿지 (글루트 브릿지)',       detail:'4세트 × 20회 (휴식 30초)',            tag:'strength', min:7 },
        { name:'플랭크',                          detail:'3세트 × 40초 (휴식 30초)',            tag:'core',     min:5 },
        { name:'스텝퍼 유산소',                   detail:'20분 중강도 (심박 130~140 bpm)',      tag:'cardio',   min:20 },
        { name:'쿨다운 스트레칭',                 detail:'7분 하체 위주 (알배김 예방 필수)',    tag:'cool',     min:7 },
      ]
    },
    2: {
      type:'cardio', label:'유산소 집중', totalMin:60,
      note:'심폐가 아직 약하므로 강도보다 꾸준한 유지가 목표!',
      exercises:[
        { name:'준비운동 — 제자리 걷기',          detail:'5분',                                 tag:'warm',     min:5 },
        { name:'스텝박스 스텝업 인터벌',          detail:'30초 강 / 40초 약 × 10세트',         tag:'cardio',   min:20 },
        { name:'스텝퍼 중강도 유산소',            detail:'25분 (심박 130~145 bpm 유지)',        tag:'cardio',   min:25 },
        { name:'버피 (변형: 점프 없이)',           detail:'3세트 × 8회 (휴식 60초)',             tag:'strength', min:5 },
        { name:'쿨다운 스트레칭',                 detail:'7분 전신',                            tag:'cool',     min:7 },
      ]
    },
    3: {
      type:'strength', label:'상체·코어', totalMin:60,
      note:'알배김 강하면 다음날 스트레칭 10분 추가하세요.',
      exercises:[
        { name:'준비운동 — 암 서클 + 토르소 트위스트', detail:'5분',                           tag:'warm',     min:5 },
        { name:'푸시업 (일반 or 무릎)',            detail:'4세트 × 12~15회 (휴식 45초)',        tag:'strength', min:9 },
        { name:'파이크 푸시업',                   detail:'3세트 × 10회 (휴식 45초)',            tag:'strength', min:7 },
        { name:'메디신볼 체스트 패스 (벽 활용)',  detail:'3세트 × 15회 (휴식 30초)',            tag:'strength', min:7 },
        { name:'트라이셉스 딥 (의자)',             detail:'3세트 × 12회 (휴식 45초)',            tag:'strength', min:6 },
        { name:'크런치 + 레그레이즈',             detail:'3세트 × 15회 each (휴식 30초)',       tag:'core',     min:7 },
        { name:'스텝퍼 유산소',                   detail:'15분 중강도 마무리 (심박 130~140)',   tag:'cardio',   min:15 },
        { name:'쿨다운 스트레칭',                 detail:'7분 상체 위주',                       tag:'cool',     min:7 },
      ]
    },
    4: {
      type:'cardio', label:'유산소·서킷', totalMin:60,
      note:'서킷 중 어지러우면 즉시 멈추고 수분 섭취!',
      exercises:[
        { name:'준비운동 — 스텝퍼 워밍업',        detail:'5분',                                 tag:'warm',     min:5 },
        { name:'서킷 3라운드 (60초 휴식 between)', detail:'아래 4가지 × 3라운드',               tag:'cardio',   min:12 },
        { name:'마운틴 클라이머',                  detail:'30초',                                tag:'core',     min:3 },
        { name:'스텝박스 스텝업 (빠르게)',          detail:'30초',                                tag:'cardio',   min:3 },
        { name:'메디신볼 슬램 (제자리)',            detail:'30초',                                tag:'strength', min:3 },
        { name:'점핑잭 (저강도 버전)',              detail:'30초',                                tag:'cardio',   min:3 },
        { name:'스텝퍼 유산소',                    detail:'20분 중강도 (심박 130~140)',           tag:'cardio',   min:20 },
        { name:'플랭크 변형 (사이드 플랭크)',       detail:'좌우 각 40초 × 3세트',               tag:'core',     min:6 },
        { name:'쿨다운 스트레칭',                  detail:'7분 전신',                            tag:'cool',     min:7 },
      ]
    },
    5: {
      type:'strength', label:'전신 근력', totalMin:60,
      note:'금요일은 한 주 마무리. 완료 후 단백질 섭취 잊지 마세요!',
      exercises:[
        { name:'준비운동 — 스텝퍼 워밍업',                detail:'6분',                         tag:'warm',     min:6 },
        { name:'고블릿 스쿼트 (월볼 or 메디신볼)',         detail:'4세트 × 12회 (휴식 45초)',    tag:'strength', min:9 },
        { name:'푸시업 (와이드 그립)',                     detail:'3세트 × 12회 (휴식 45초)',    tag:'strength', min:7 },
        { name:'스텝박스 스텝업 (무게 추가)',               detail:'3세트 × 12회 (좌우, 4~6kg)', tag:'strength', min:8 },
        { name:'월볼 트위스트 (러시안 트위스트)',           detail:'3세트 × 20회 (휴식 30초)',    tag:'core',     min:6 },
        { name:'버피 (변형: 점프 없이)',                   detail:'3세트 × 8회 (휴식 60초)',     tag:'cardio',   min:6 },
        { name:'스텝퍼 유산소',                            detail:'15분 중강도 (심박 130~140)',  tag:'cardio',   min:15 },
        { name:'쿨다운 스트레칭',                          detail:'7분 전신',                    tag:'cool',     min:7 },
      ]
    },
    6: {
      type:'cardio', label:'액티브 리커버리', totalMin:45,
      note:'토요일은 근육 회복의 날. 억지로 강하게 하면 역효과!',
      exercises:[
        { name:'스텝퍼 저강도 유산소',  detail:'30분 천천히 (심박 110~120 bpm)', tag:'cardio', min:30 },
        { name:'전신 스트레칭',          detail:'15분 전신 + 폼롤러 (알배김 해소)', tag:'cool', min:15 },
      ]
    },
  },

  // ── PHASE 2 (3~4주): 지구력 강화기 ──────────────────────────────
  2: {
    0: { type:'rest', label:'완전 휴식', exercises:[] },
    1: {
      type:'strength', label:'하체·코어 (지구력 강화)', totalMin:60,
      note:'이번 주부터 세트 간 휴식 30초로 단축! 심폐 자극 핵심.',
      exercises:[
        { name:'준비운동 — 스텝퍼 워밍업',     detail:'6분 (분당 75 스텝)',                    tag:'warm',     min:6 },
        { name:'스쿼트',                         detail:'5세트 × 15회 (휴식 30초)',              tag:'strength', min:10 },
        { name:'런지 (좌우 교대)',               detail:'4세트 × 14회 (휴식 30초)',              tag:'strength', min:9 },
        { name:'힙 브릿지 (글루트 브릿지)',      detail:'4세트 × 25회 (휴식 20초)',              tag:'strength', min:7 },
        { name:'플랭크',                         detail:'3세트 × 50초 (휴식 20초)',              tag:'core',     min:5 },
        { name:'스텝퍼 유산소',                  detail:'25분 중강도 (심박 135~145 bpm)',        tag:'cardio',   min:25 },
        { name:'쿨다운 스트레칭',                detail:'7분 하체 위주',                         tag:'cool',     min:7 },
      ]
    },
    2: {
      type:'cardio', label:'유산소 집중 (강화)', totalMin:60,
      note:'인터벌 비율 조정 — 강한 구간 비중 늘리기 시작!',
      exercises:[
        { name:'준비운동 — 제자리 걷기',         detail:'5분',                                   tag:'warm',     min:5 },
        { name:'스텝박스 스텝업 인터벌',         detail:'40초 강 / 20초 약 × 12세트',            tag:'cardio',   min:24 },
        { name:'스텝퍼 중강도 유산소',           detail:'25분 (심박 135~148 bpm)',               tag:'cardio',   min:25 },
        { name:'버피 (변형: 점프 없이)',          detail:'4세트 × 10회 (휴식 45초)',              tag:'strength', min:6 },
        { name:'쿨다운 스트레칭',                detail:'7분 전신',                              tag:'cool',     min:7 },
      ]
    },
    3: {
      type:'strength', label:'상체·코어 (지구력)', totalMin:60,
      note:'슈퍼세트 예고 — 이번 주는 세트 수 늘리기에 집중.',
      exercises:[
        { name:'준비운동 — 암 서클 + 토르소 트위스트', detail:'5분',                            tag:'warm',     min:5 },
        { name:'푸시업 (일반 or 무릎)',           detail:'5세트 × 12회 (휴식 30초)',              tag:'strength', min:10 },
        { name:'파이크 푸시업',                  detail:'4세트 × 10회 (휴식 30초)',              tag:'strength', min:8 },
        { name:'메디신볼 체스트 패스 (벽 활용)', detail:'4세트 × 15회 (휴식 20초)',              tag:'strength', min:7 },
        { name:'트라이셉스 딥 (의자)',            detail:'4세트 × 14회 (휴식 30초)',              tag:'strength', min:7 },
        { name:'크런치 + 레그레이즈',            detail:'4세트 × 15회 each (휴식 20초)',         tag:'core',     min:7 },
        { name:'스텝퍼 유산소',                  detail:'18분 중강도 (심박 135~145)',            tag:'cardio',   min:18 },
        { name:'쿨다운 스트레칭',                detail:'7분 상체 위주',                         tag:'cool',     min:7 },
      ]
    },
    4: {
      type:'cardio', label:'유산소·서킷 (강화)', totalMin:60,
      note:'서킷 라운드 4회로 증가! 라운드 사이 휴식은 45초.',
      exercises:[
        { name:'준비운동 — 스텝퍼 워밍업',       detail:'5분',                                   tag:'warm',     min:5 },
        { name:'서킷 4라운드 (45초 휴식 between)', detail:'아래 4가지 × 4라운드',                tag:'cardio',   min:16 },
        { name:'마운틴 클라이머',                 detail:'35초',                                  tag:'core',     min:3 },
        { name:'스텝박스 스텝업 (빠르게)',         detail:'35초',                                  tag:'cardio',   min:3 },
        { name:'메디신볼 슬램 (제자리)',           detail:'35초',                                  tag:'strength', min:3 },
        { name:'점핑잭 (저강도 버전)',             detail:'35초',                                  tag:'cardio',   min:3 },
        { name:'스텝퍼 유산소',                   detail:'20분 중강도 (심박 135~145)',            tag:'cardio',   min:20 },
        { name:'플랭크 변형 (사이드 플랭크)',      detail:'좌우 각 45초 × 3세트',                 tag:'core',     min:6 },
        { name:'쿨다운 스트레칭',                 detail:'7분 전신',                              tag:'cool',     min:7 },
      ]
    },
    5: {
      type:'strength', label:'전신 근력 (강화)', totalMin:60,
      note:'스텝박스 무게 6kg으로 올려보세요.',
      exercises:[
        { name:'준비운동 — 스텝퍼 워밍업',             detail:'6분 (분당 80 스텝)',              tag:'warm',     min:6 },
        { name:'고블릿 스쿼트 (월볼 or 메디신볼)',      detail:'5세트 × 12회 (휴식 30초)',       tag:'strength', min:10 },
        { name:'푸시업 (와이드 그립)',                  detail:'4세트 × 12회 (휴식 30초)',       tag:'strength', min:8 },
        { name:'스텝박스 스텝업 (무게 추가)',            detail:'4세트 × 12회 (좌우, 6kg)',      tag:'strength', min:9 },
        { name:'월볼 트위스트 (러시안 트위스트)',        detail:'4세트 × 20회 (휴식 20초)',      tag:'core',     min:6 },
        { name:'버피 (변형: 점프 없이)',                detail:'4세트 × 10회 (휴식 45초)',       tag:'cardio',   min:7 },
        { name:'스텝퍼 유산소',                         detail:'18분 중강도 (심박 135~145)',     tag:'cardio',   min:18 },
        { name:'쿨다운 스트레칭',                       detail:'7분 전신',                       tag:'cool',     min:7 },
      ]
    },
    6: {
      type:'cardio', label:'액티브 리커버리', totalMin:45,
      note:'근육 회복의 날. 폼롤러로 알배김 부위를 집중 관리하세요.',
      exercises:[
        { name:'스텝퍼 저강도 유산소', detail:'30분 (심박 115~125 bpm)',          tag:'cardio', min:30 },
        { name:'전신 스트레칭',        detail:'15분 전신 + 폼롤러 집중',          tag:'cool',   min:15 },
      ]
    },
  },

  // ── PHASE 3 (5~6주): 복합 강화기 ────────────────────────────────
  3: {
    0: { type:'rest', label:'완전 휴식', exercises:[] },
    1: {
      type:'strength', label:'하체·코어 슈퍼세트', totalMin:60,
      note:'슈퍼세트: 두 동작을 휴식 없이 연달아! 라운드 사이만 30초 휴식.',
      exercises:[
        { name:'준비운동 — 스텝퍼 워밍업',       detail:'6분 (분당 80 스텝)',                    tag:'warm',     min:6 },
        { name:'슈퍼세트 A — 스쿼트 + 힙브릿지', detail:'(스쿼트 15회 → 힙브릿지 20회) × 4세트 (휴식 30초)', tag:'strength', min:12 },
        { name:'런지 (좌우 교대)',                detail:'4세트 × 16회 (휴식 20초)',              tag:'strength', min:9 },
        { name:'월볼 스쿼트 스로우',              detail:'4세트 × 12회 (휴식 30초)',              tag:'strength', min:9 },
        { name:'플랭크',                          detail:'4세트 × 60초 (휴식 20초)',              tag:'core',     min:6 },
        { name:'스텝퍼 유산소',                   detail:'25분 고중강도 (심박 140~150 bpm)',      tag:'cardio',   min:25 },
        { name:'쿨다운 스트레칭',                 detail:'7분 하체 위주',                         tag:'cool',     min:7 },
      ]
    },
    2: {
      type:'cardio', label:'인터벌 집중', totalMin:60,
      note:'이제 강한 구간이 약한 구간보다 길어요. 버텨보세요!',
      exercises:[
        { name:'준비운동 — 제자리 걷기',          detail:'5분',                                   tag:'warm',     min:5 },
        { name:'스텝박스 스텝업 인터벌',          detail:'45초 강 / 15초 약 × 12세트',            tag:'cardio',   min:24 },
        { name:'스텝퍼 고중강도 유산소',          detail:'25분 (심박 140~150 bpm)',               tag:'cardio',   min:25 },
        { name:'버피 (표준)',                      detail:'3세트 × 10회 (휴식 45초)',              tag:'strength', min:6 },
        { name:'쿨다운 스트레칭',                 detail:'7분 전신',                              tag:'cool',     min:7 },
      ]
    },
    3: {
      type:'strength', label:'상체·코어 슈퍼세트', totalMin:60,
      note:'슈퍼세트로 밀기·당기기 번갈아 — 근육 펌핑 극대화!',
      exercises:[
        { name:'준비운동 — 암 서클 + 토르소 트위스트', detail:'5분',                            tag:'warm',     min:5 },
        { name:'슈퍼세트 B — 푸시업 + 파이크 푸시업', detail:'(푸시업 12회 → 파이크 10회) × 4세트 (휴식 30초)', tag:'strength', min:12 },
        { name:'메디신볼 체스트 패스 (벽 활용)',  detail:'4세트 × 18회 (휴식 20초)',              tag:'strength', min:8 },
        { name:'트라이셉스 딥 (의자)',             detail:'4세트 × 15회 (휴식 20초)',              tag:'strength', min:7 },
        { name:'크런치 + 레그레이즈',             detail:'4세트 × 20회 each (휴식 20초)',         tag:'core',     min:8 },
        { name:'스텝퍼 유산소',                   detail:'18분 고중강도 (심박 140~150)',          tag:'cardio',   min:18 },
        { name:'쿨다운 스트레칭',                 detail:'7분 상체 위주',                         tag:'cool',     min:7 },
      ]
    },
    4: {
      type:'cardio', label:'복합 서킷 (5종목)', totalMin:60,
      note:'서킷 종목 5개로 늘어났어요. 전신이 다 타는 느낌!',
      exercises:[
        { name:'준비운동 — 스텝퍼 워밍업',          detail:'5분',                                 tag:'warm',     min:5 },
        { name:'서킷 4라운드 (30초 휴식 between)',   detail:'아래 5가지 × 4라운드',               tag:'cardio',   min:20 },
        { name:'마운틴 클라이머',                    detail:'40초',                                tag:'core',     min:3 },
        { name:'스텝박스 스텝업 (빠르게)',            detail:'40초',                                tag:'cardio',   min:3 },
        { name:'메디신볼 슬램 (제자리)',              detail:'40초',                                tag:'strength', min:3 },
        { name:'버피 (표준)',                         detail:'40초',                                tag:'cardio',   min:3 },
        { name:'플랭크 변형 (사이드 플랭크)',         detail:'좌우 각 40초',                        tag:'core',     min:3 },
        { name:'스텝퍼 유산소',                      detail:'18분 고중강도 (심박 140~150)',        tag:'cardio',   min:18 },
        { name:'쿨다운 스트레칭',                    detail:'7분 전신',                            tag:'cool',     min:7 },
      ]
    },
    5: {
      type:'strength', label:'전신 복합 근력', totalMin:60,
      note:'버피 이제 점프 버전으로! 힘들면 2세트만 점프 해도 OK.',
      exercises:[
        { name:'준비운동 — 스텝퍼 워밍업',             detail:'6분 (분당 85 스텝)',              tag:'warm',     min:6 },
        { name:'고블릿 스쿼트 (월볼 or 메디신볼)',      detail:'5세트 × 15회 (휴식 20초)',       tag:'strength', min:11 },
        { name:'푸시업 (와이드 그립)',                  detail:'4세트 × 15회 (휴식 20초)',       tag:'strength', min:8 },
        { name:'스텝박스 스텝업 (무게 추가)',            detail:'4세트 × 14회 (좌우, 6~8kg)',    tag:'strength', min:9 },
        { name:'월볼 트위스트 (러시안 트위스트)',        detail:'4세트 × 25회 (휴식 20초)',      tag:'core',     min:7 },
        { name:'버피 (표준)',                           detail:'4세트 × 10회 (휴식 30초)',       tag:'cardio',   min:7 },
        { name:'스텝퍼 유산소',                         detail:'18분 고강도 (심박 145~155)',     tag:'cardio',   min:18 },
        { name:'쿨다운 스트레칭',                       detail:'7분 전신',                       tag:'cool',     min:7 },
      ]
    },
    6: {
      type:'cardio', label:'액티브 리커버리', totalMin:45,
      note:'5~6주차 피로 피크. 이 날 충분히 쉬어야 다음 주 HIIT를 버텨요!',
      exercises:[
        { name:'스텝퍼 저강도 유산소', detail:'30분 (심박 115~125 bpm)',   tag:'cardio', min:30 },
        { name:'전신 스트레칭',        detail:'15분 전신 폼롤러 집중',    tag:'cool',   min:15 },
      ]
    },
  },

  // ── PHASE 4 (7~8주): HIIT 집중기 ────────────────────────────────
  4: {
    0: { type:'rest', label:'완전 휴식', exercises:[] },
    1: {
      type:'strength', label:'하체 HIIT 복합', totalMin:60,
      note:'점프 동작 도입! 관절 부담 느끼면 점프 없는 버전으로.',
      exercises:[
        { name:'준비운동 — 스텝퍼 워밍업',        detail:'5분 (분당 85 스텝)',                    tag:'warm',     min:5 },
        { name:'점프 스쿼트',                      detail:'4세트 × 12회 (휴식 30초)',              tag:'strength', min:8 },
        { name:'런지 (좌우 교대)',                 detail:'4세트 × 18회 (휴식 20초)',              tag:'strength', min:9 },
        { name:'힙 브릿지 (글루트 브릿지)',        detail:'4세트 × 30회 (휴식 15초)',              tag:'strength', min:7 },
        { name:'플랭크',                           detail:'4세트 × 60초 (휴식 15초)',              tag:'core',     min:6 },
        { name:'스텝퍼 HIIT',                      detail:'(1분 고강도 / 1분 저강도) × 12회',     tag:'cardio',   min:24 },
        { name:'쿨다운 스트레칭',                  detail:'7분 하체 위주',                         tag:'cool',     min:7 },
      ]
    },
    2: {
      type:'cardio', label:'HIIT 유산소', totalMin:60,
      note:'스텝퍼 HIIT 핵심 — 고강도 구간에서 심박 155 이상 도달 목표!',
      exercises:[
        { name:'준비운동 — 제자리 걷기',           detail:'5분',                                   tag:'warm',     min:5 },
        { name:'스텝박스 스텝업 인터벌',           detail:'50초 강 / 10초 약 × 12세트',            tag:'cardio',   min:24 },
        { name:'스텝퍼 HIIT',                      detail:'(1분 고강도 / 1분 저강도) × 12회',     tag:'cardio',   min:24 },
        { name:'버피 (표준)',                       detail:'3세트 × 12회 (휴식 30초)',              tag:'strength', min:6 },
        { name:'쿨다운 스트레칭',                  detail:'7분 전신',                              tag:'cool',     min:7 },
      ]
    },
    3: {
      type:'strength', label:'상체 HIIT 복합', totalMin:60,
      note:'슈퍼세트 + 짧은 휴식으로 상체 지구력 극대화!',
      exercises:[
        { name:'준비운동 — 암 서클 + 토르소 트위스트', detail:'5분',                            tag:'warm',     min:5 },
        { name:'슈퍼세트 B — 푸시업 + 파이크 푸시업', detail:'(푸시업 15회 → 파이크 12회) × 5세트 (휴식 20초)', tag:'strength', min:14 },
        { name:'메디신볼 체스트 패스 (벽 활용)',   detail:'4세트 × 20회 (휴식 15초)',              tag:'strength', min:8 },
        { name:'트라이셉스 딥 (의자)',              detail:'4세트 × 18회 (휴식 15초)',              tag:'strength', min:7 },
        { name:'크런치 + 레그레이즈',              detail:'5세트 × 20회 each (휴식 15초)',         tag:'core',     min:9 },
        { name:'스텝퍼 유산소',                    detail:'18분 고강도 (심박 148~158)',            tag:'cardio',   min:18 },
        { name:'쿨다운 스트레칭',                  detail:'7분 상체 위주',                         tag:'cool',     min:7 },
      ]
    },
    4: {
      type:'cardio', label:'전신 HIIT 서킷', totalMin:60,
      note:'6종목 서킷! 한 라운드가 끝날 때마다 30초만 쉬어요.',
      exercises:[
        { name:'준비운동 — 스텝퍼 워밍업',           detail:'5분',                                 tag:'warm',     min:5 },
        { name:'서킷 5라운드 (30초 휴식 between)',    detail:'아래 6가지 × 5라운드',               tag:'cardio',   min:25 },
        { name:'점프 스쿼트',                         detail:'40초',                                tag:'strength', min:3 },
        { name:'스텝박스 스텝업 (빠르게)',             detail:'40초',                                tag:'cardio',   min:3 },
        { name:'메디신볼 슬램 (제자리)',               detail:'40초',                                tag:'strength', min:3 },
        { name:'버피 (표준)',                          detail:'40초',                                tag:'cardio',   min:3 },
        { name:'마운틴 클라이머',                      detail:'40초',                                tag:'core',     min:3 },
        { name:'플랭크 변형 (사이드 플랭크)',          detail:'좌우 각 40초',                        tag:'core',     min:3 },
        { name:'쿨다운 스트레칭',                     detail:'7분 전신',                            tag:'cool',     min:7 },
      ]
    },
    5: {
      type:'strength', label:'전신 복합 고강도', totalMin:60,
      note:'스텝박스 무게 8kg 도전! 월볼 무게도 올려보세요.',
      exercises:[
        { name:'준비운동 — 스텝퍼 워밍업',              detail:'5분 (분당 90 스텝)',             tag:'warm',     min:5 },
        { name:'고블릿 스쿼트 (월볼 or 메디신볼)',       detail:'5세트 × 15회 (휴식 20초)',      tag:'strength', min:11 },
        { name:'월볼 스쿼트 스로우',                    detail:'4세트 × 15회 (휴식 20초)',       tag:'strength', min:9 },
        { name:'스텝박스 스텝업 (무게 추가)',             detail:'4세트 × 14회 (좌우, 8kg)',     tag:'strength', min:9 },
        { name:'월볼 트위스트 (러시안 트위스트)',         detail:'5세트 × 25회 (휴식 15초)',     tag:'core',     min:8 },
        { name:'버피 (표준)',                            detail:'4세트 × 12회 (휴식 20초)',      tag:'cardio',   min:7 },
        { name:'스텝퍼 HIIT',                           detail:'(1분 고강도 / 1분 저강도) × 8회', tag:'cardio', min:16 },
        { name:'쿨다운 스트레칭',                        detail:'7분 전신',                      tag:'cool',     min:7 },
      ]
    },
    6: {
      type:'cardio', label:'액티브 리커버리', totalMin:45,
      note:'HIIT 피크 주간 후 회복. 이 날이 제일 중요해요!',
      exercises:[
        { name:'스텝퍼 저강도 유산소', detail:'30분 (심박 115~125 bpm)',   tag:'cardio', min:30 },
        { name:'전신 스트레칭',        detail:'15분 전신 폼롤러 집중',    tag:'cool',   min:15 },
      ]
    },
  },

  // ── PHASE 5 (9~10주): 피크 강도기 ───────────────────────────────
  5: {
    0: { type:'rest', label:'완전 휴식', exercises:[] },
    1: {
      type:'strength', label:'하체 피크 복합', totalMin:65,
      note:'피크 강도 돌입! 이 주차부터는 쉬는 날 충분한 수면이 필수.',
      exercises:[
        { name:'준비운동 — 스텝퍼 워밍업',        detail:'5분 (분당 90 스텝)',                    tag:'warm',     min:5 },
        { name:'점프 스쿼트',                      detail:'5세트 × 15회 (휴식 20초)',              tag:'strength', min:10 },
        { name:'런지 (좌우 교대)',                 detail:'5세트 × 18회 (휴식 20초)',              tag:'strength', min:10 },
        { name:'월볼 스쿼트 스로우',               detail:'5세트 × 15회 (휴식 20초)',              tag:'strength', min:10 },
        { name:'힙 브릿지 (글루트 브릿지)',        detail:'4세트 × 30회 (휴식 15초)',              tag:'strength', min:7 },
        { name:'플랭크',                           detail:'5세트 × 60초 (휴식 15초)',              tag:'core',     min:7 },
        { name:'스텝퍼 HIIT',                      detail:'(1분 고강도 / 45초 저강도) × 12회',    tag:'cardio',   min:21 },
        { name:'쿨다운 스트레칭',                  detail:'7분 하체 위주',                         tag:'cool',     min:7 },
      ]
    },
    2: {
      type:'cardio', label:'피크 유산소 HIIT', totalMin:60,
      note:'최고 강도 유산소! 심박 160 이상 구간 만들어보세요.',
      exercises:[
        { name:'준비운동 — 제자리 걷기',           detail:'5분',                                   tag:'warm',     min:5 },
        { name:'스텝박스 스텝업 인터벌',           detail:'50초 강 / 10초 약 × 15세트',            tag:'cardio',   min:25 },
        { name:'스텝퍼 HIIT',                      detail:'(1분 고강도 / 45초 저강도) × 12회',    tag:'cardio',   min:21 },
        { name:'버피 (표준)',                       detail:'4세트 × 12회 (휴식 20초)',              tag:'strength', min:7 },
        { name:'쿨다운 스트레칭',                  detail:'7분 전신',                              tag:'cool',     min:7 },
      ]
    },
    3: {
      type:'strength', label:'상체 피크 복합', totalMin:60,
      note:'상체 지구력 피크. 세트 사이 멈추지 않는 것이 목표!',
      exercises:[
        { name:'준비운동 — 암 서클 + 토르소 트위스트', detail:'5분',                            tag:'warm',     min:5 },
        { name:'슈퍼세트 B — 푸시업 + 파이크 푸시업', detail:'(푸시업 15회 → 파이크 12회) × 5세트 (휴식 15초)', tag:'strength', min:14 },
        { name:'메디신볼 체스트 패스 (벽 활용)',   detail:'5세트 × 20회 (휴식 15초)',              tag:'strength', min:9 },
        { name:'트라이셉스 딥 (의자)',              detail:'5세트 × 18회 (휴식 15초)',              tag:'strength', min:8 },
        { name:'크런치 + 레그레이즈',              detail:'5세트 × 20회 each (휴식 15초)',         tag:'core',     min:9 },
        { name:'스텝퍼 유산소',                    detail:'20분 고강도 (심박 150~160)',            tag:'cardio',   min:20 },
        { name:'쿨다운 스트레칭',                  detail:'7분 상체 위주',                         tag:'cool',     min:7 },
      ]
    },
    4: {
      type:'cardio', label:'피크 전신 서킷', totalMin:65,
      note:'주간 최강도 날. 완주하면 그 주 완전 성공!',
      exercises:[
        { name:'준비운동 — 스텝퍼 워밍업',           detail:'5분',                                 tag:'warm',     min:5 },
        { name:'서킷 5라운드 (20초 휴식 between)',    detail:'아래 6가지 × 5라운드',               tag:'cardio',   min:28 },
        { name:'점프 스쿼트',                         detail:'45초',                                tag:'strength', min:3 },
        { name:'스텝박스 스텝업 (빠르게)',             detail:'45초',                                tag:'cardio',   min:3 },
        { name:'메디신볼 슬램 (제자리)',               detail:'45초',                                tag:'strength', min:3 },
        { name:'버피 (표준)',                          detail:'45초',                                tag:'cardio',   min:3 },
        { name:'마운틴 클라이머',                      detail:'45초',                                tag:'core',     min:3 },
        { name:'플랭크 변형 (사이드 플랭크)',          detail:'좌우 각 45초',                        tag:'core',     min:3 },
        { name:'스텝퍼 HIIT',                         detail:'(1분 고강도 / 45초 저강도) × 8회',  tag:'cardio',   min:17 },
        { name:'쿨다운 스트레칭',                     detail:'7분 전신',                            tag:'cool',     min:7 },
      ]
    },
    5: {
      type:'strength', label:'전신 피크 근력', totalMin:65,
      note:'월볼 8kg, 스텝박스 8~10kg 도전. 1주 전보다 강해진 걸 느끼세요!',
      exercises:[
        { name:'준비운동 — 스텝퍼 워밍업',              detail:'5분 (분당 95 스텝)',             tag:'warm',     min:5 },
        { name:'고블릿 스쿼트 (월볼 or 메디신볼)',       detail:'5세트 × 18회 (휴식 15초)',      tag:'strength', min:12 },
        { name:'월볼 스쿼트 스로우',                    detail:'5세트 × 15회 (휴식 15초)',       tag:'strength', min:10 },
        { name:'스텝박스 스텝업 (무게 추가)',             detail:'5세트 × 14회 (좌우, 8~10kg)', tag:'strength', min:10 },
        { name:'월볼 트위스트 (러시안 트위스트)',         detail:'5세트 × 30회 (휴식 15초)',     tag:'core',     min:9 },
        { name:'버피 (표준)',                            detail:'5세트 × 12회 (휴식 15초)',      tag:'cardio',   min:8 },
        { name:'스텝퍼 HIIT',                           detail:'(1분 고강도 / 45초 저강도) × 8회', tag:'cardio', min:15 },
        { name:'쿨다운 스트레칭',                        detail:'7분 전신',                      tag:'cool',     min:7 },
      ]
    },
    6: {
      type:'cardio', label:'액티브 리커버리', totalMin:50,
      note:'피크 강도 2주차 후 회복. 몸이 많이 지쳐있을 거예요. 충분히 쉬세요!',
      exercises:[
        { name:'스텝퍼 저강도 유산소', detail:'35분 (심박 115~125 bpm)',   tag:'cardio', min:35 },
        { name:'전신 스트레칭',        detail:'15분 전신 폼롤러 집중',    tag:'cool',   min:15 },
      ]
    },
  },

  // ── PHASE 6 (11주~): 유지·심화기 ─────────────────────────────────
  6: {
    0: { type:'rest', label:'완전 휴식', exercises:[] },
    1: {
      type:'strength', label:'하체 심화 유지', totalMin:65,
      note:'이제 자신의 페이스가 잡혀야 해요. 무게·세트 본인이 조절하세요.',
      exercises:[
        { name:'준비운동 — 스텝퍼 워밍업',        detail:'5분 (분당 95 스텝)',                    tag:'warm',     min:5 },
        { name:'점프 스쿼트',                      detail:'5세트 × 15회 (휴식 20초)',              tag:'strength', min:10 },
        { name:'런지 (좌우 교대)',                 detail:'5세트 × 20회 (휴식 20초)',              tag:'strength', min:10 },
        { name:'월볼 스쿼트 스로우',               detail:'5세트 × 15회 (휴식 15초)',              tag:'strength', min:10 },
        { name:'힙 브릿지 (글루트 브릿지)',        detail:'5세트 × 30회 (휴식 10초)',              tag:'strength', min:7 },
        { name:'플랭크',                           detail:'5세트 × 70초 (휴식 10초)',              tag:'core',     min:7 },
        { name:'스텝퍼 HIIT',                      detail:'(1분 고강도 / 40초 저강도) × 12회',    tag:'cardio',   min:23 },
        { name:'쿨다운 스트레칭',                  detail:'7분 하체 위주',                         tag:'cool',     min:7 },
      ]
    },
    2: {
      type:'cardio', label:'유산소 심화 유지', totalMin:60,
      note:'지구력이 완성된 느낌이 나야 해요. 숨 차면서도 버티는 구간이 길어져야!',
      exercises:[
        { name:'준비운동 — 제자리 걷기',           detail:'5분',                                   tag:'warm',     min:5 },
        { name:'스텝박스 스텝업 인터벌',           detail:'50초 강 / 10초 약 × 15세트',            tag:'cardio',   min:25 },
        { name:'스텝퍼 HIIT',                      detail:'(1분 고강도 / 40초 저강도) × 12회',    tag:'cardio',   min:23 },
        { name:'버피 (표준)',                       detail:'5세트 × 12회 (휴식 15초)',              tag:'strength', min:7 },
        { name:'쿨다운 스트레칭',                  detail:'7분 전신',                              tag:'cool',     min:7 },
      ]
    },
    3: {
      type:'strength', label:'상체 심화 유지', totalMin:60,
      note:'반복 수 목표보다 자세 집중. 질 좋은 세트가 양보다 중요해요.',
      exercises:[
        { name:'준비운동 — 암 서클 + 토르소 트위스트', detail:'5분',                            tag:'warm',     min:5 },
        { name:'슈퍼세트 B — 푸시업 + 파이크 푸시업', detail:'(푸시업 18회 → 파이크 14회) × 5세트 (휴식 10초)', tag:'strength', min:14 },
        { name:'메디신볼 체스트 패스 (벽 활용)',   detail:'5세트 × 20회 (휴식 10초)',              tag:'strength', min:9 },
        { name:'트라이셉스 딥 (의자)',              detail:'5세트 × 20회 (휴식 10초)',              tag:'strength', min:8 },
        { name:'크런치 + 레그레이즈',              detail:'5세트 × 25회 each (휴식 10초)',         tag:'core',     min:9 },
        { name:'스텝퍼 HIIT',                      detail:'(1분 고강도 / 40초 저강도) × 10회',    tag:'cardio',   min:18 },
        { name:'쿨다운 스트레칭',                  detail:'7분 상체 위주',                         tag:'cool',     min:7 },
      ]
    },
    4: {
      type:'cardio', label:'전신 서킷 심화', totalMin:65,
      note:'서킷 완주 능력이 주 1~2주마다 느껴지게 올라야 해요.',
      exercises:[
        { name:'준비운동 — 스텝퍼 워밍업',           detail:'5분',                                 tag:'warm',     min:5 },
        { name:'서킷 6라운드 (15초 휴식 between)',    detail:'아래 6가지 × 6라운드',               tag:'cardio',   min:30 },
        { name:'점프 스쿼트',                         detail:'45초',                                tag:'strength', min:3 },
        { name:'스텝박스 스텝업 (빠르게)',             detail:'45초',                                tag:'cardio',   min:3 },
        { name:'메디신볼 슬램 (제자리)',               detail:'45초',                                tag:'strength', min:3 },
        { name:'버피 (표준)',                          detail:'45초',                                tag:'cardio',   min:3 },
        { name:'마운틴 클라이머',                      detail:'45초',                                tag:'core',     min:3 },
        { name:'월볼 스쿼트 스로우',                   detail:'45초',                                tag:'strength', min:3 },
        { name:'스텝퍼 HIIT',                         detail:'(1분 고강도 / 40초 저강도) × 10회', tag:'cardio',   min:19 },
        { name:'쿨다운 스트레칭',                     detail:'7분 전신',                            tag:'cool',     min:7 },
      ]
    },
    5: {
      type:'strength', label:'전신 심화 근력', totalMin:65,
      note:'목표 체중 90kg에 가까워질수록 운동 강도 유지가 더 중요해요!',
      exercises:[
        { name:'준비운동 — 스텝퍼 워밍업',              detail:'5분 (분당 95~100 스텝)',        tag:'warm',     min:5 },
        { name:'고블릿 스쿼트 (월볼 or 메디신볼)',       detail:'6세트 × 15회 (휴식 10초)',     tag:'strength', min:12 },
        { name:'월볼 스쿼트 스로우',                    detail:'5세트 × 18회 (휴식 10초)',      tag:'strength', min:10 },
        { name:'스텝박스 스텝업 (무게 추가)',             detail:'5세트 × 16회 (좌우, 10kg)',   tag:'strength', min:10 },
        { name:'월볼 트위스트 (러시안 트위스트)',         detail:'5세트 × 30회 (휴식 10초)',    tag:'core',     min:9 },
        { name:'버피 (표준)',                            detail:'5세트 × 15회 (휴식 10초)',     tag:'cardio',   min:8 },
        { name:'스텝퍼 HIIT',                           detail:'(1분 고강도 / 40초 저강도) × 10회', tag:'cardio', min:19 },
        { name:'쿨다운 스트레칭',                        detail:'7분 전신',                     tag:'cool',     min:7 },
      ]
    },
    6: {
      type:'cardio', label:'액티브 리커버리', totalMin:50,
      note:'꾸준히 오신 것 자체가 대단합니다. 오늘은 몸에게 선물!',
      exercises:[
        { name:'스텝퍼 저강도 유산소', detail:'35분 (심박 115~125 bpm)',   tag:'cardio', min:35 },
        { name:'전신 스트레칭',        detail:'15분 전신 폼롤러 집중',    tag:'cool',   min:15 },
      ]
    },
  },
};

// ===== 현재 루틴 가져오기 =====
function getTodayPlan() {
  const week = getCurrentWeek();
  const { phase } = getPhase(week);
  const dayIdx = new Date().getDay();
  return PHASE_PLANS[phase][dayIdx];
}

function getDayPlan(dayIdx, weekOverride) {
  const week = weekOverride !== undefined ? weekOverride : getCurrentWeek();
  const { phase } = getPhase(week);
  return PHASE_PLANS[phase][dayIdx];
}

// ===== 운동 상세 정보 DB =====
const EXERCISE_INFO = {
  '준비운동 — 스텝퍼 워밍업': { target:['심폐계','하체 혈류'], how:['스텝퍼에 올라서서 양발이 페달에 완전히 닿도록 서세요.','등을 곧게 펴고, 손잡이는 균형 유지용으로만 가볍게 잡아요.','천천히 분당 60~70 스텝 속도로 밟습니다.','발뒤꿈치가 들리지 않게, 발 전체로 고르게 압력을 가하세요.'], tip:'너무 손잡이에 기대면 칼로리 소모가 줄어요. 코어에 힘을 주고 손을 살짝만 얹으세요.', caution:'무릎이 안쪽으로 꺾이지 않도록 주의하세요.', youtube:'스텝퍼 올바른 자세' },
  '준비운동 — 제자리 걷기': { target:['심폐계','전신 혈류'], how:['제자리에서 팔을 앞뒤로 자연스럽게 흔들며 걷습니다.','무릎을 허리 높이까지 들어 올리면 강도가 올라가요.','5분 동안 천천히 숨이 차지 않는 속도로 진행합니다.'], tip:'체온과 심박수를 서서히 올리는 게 목적이에요.', caution:'없음 — 누구나 안전하게 할 수 있어요.', youtube:'제자리 걷기 워밍업' },
  '준비운동 — 암 서클 + 토르소 트위스트': { target:['어깨','등 상부','코어'], how:['암 서클: 팔을 옆으로 뻗어 앞으로 10회, 뒤로 10회 크게 돌려요.','토르소 트위스트: 발 어깨 너비, 팔을 T자로 뻗고 상체만 좌우로 비틀어요.','각 방향 10회씩, 2세트 반복합니다.'], tip:'허리가 아닌 흉추(등 위쪽)를 비트는 느낌으로 해야 효과적이에요.', caution:'허리 통증이 있으면 회전 범위를 줄여주세요.', youtube:'상체 워밍업 루틴' },
  '스쿼트': { target:['대퇴사두근 (앞 허벅지)','둔근 (엉덩이)','햄스트링 (뒤 허벅지)','코어'], how:['발을 어깨 너비보다 살짝 넓게 벌리고, 발끝은 15~30° 바깥쪽으로 향하게 서요.','가슴을 피고 등을 곧게 편 채로, 마치 뒤에 의자가 있다 생각하고 엉덩이를 뒤로 내밀며 앉아요.','무릎이 발끝 방향과 일치하도록 유지하고 안쪽으로 꺾이지 않게 주의해요.','허벅지가 바닥과 평행해질 때까지 내려가다가, 발뒤꿈치로 바닥을 밀어 일어나요.','올라올 때 엉덩이를 꽉 쥐는 느낌으로 마무리합니다.'], tip:'무릎이 발끝보다 앞으로 너무 나오지 않게 하세요. 처음엔 거울 보며 자세 확인을 권장해요.', caution:'무릎 통증 시 깊이를 줄이거나 발끝을 더 바깥으로 틀어보세요.', youtube:'스쿼트 초보 자세 교정' },
  '점프 스쿼트': { target:['대퇴사두근','둔근','햄스트링','심폐 지구력'], how:['일반 스쿼트 자세로 내려갔다가, 올라오는 힘으로 바닥을 차며 점프해요.','공중에서 발이 완전히 뜰 필요는 없어요 — 발뒤꿈치만 들려도 OK.','착지는 발앞꿈치 먼저 → 발 전체로 부드럽게! 쿵 소리 나지 않게 해요.','착지 즉시 다음 스쿼트로 이어가요.'], tip:'관절 충격을 줄이려면 착지할 때 무릎을 약간 구부려 흡수하세요.', caution:'무릎 통증 시 즉시 점프 없는 일반 스쿼트로 대체하세요.', youtube:'점프 스쿼트 자세 홈트' },
  '런지 (좌우 교대)': { target:['대퇴사두근','둔근','햄스트링','균형감각'], how:['똑바로 서서 한 발을 앞으로 크게 한 걸음 내딛어요 (보폭 약 70~80cm).','앞 무릎이 90° 꺾일 때까지 몸을 내려가되, 뒷 무릎은 바닥에 닿기 직전에 멈춰요.','앞 무릎이 발끝을 넘어가지 않도록 주의하고, 상체는 수직을 유지해요.','앞발의 뒤꿈치로 밀어 처음 자세로 돌아오고, 반대발로 교대해요.'], tip:'보폭이 너무 좁으면 무릎에 부담이 커요. 크게 내딛는 게 포인트.', caution:'무릎 통증 시 뒷 발을 고정한 채 스플릿 스쿼트로 대체하세요.', youtube:'런지 자세 교정 초보' },
  '월볼 스쿼트 스로우': { target:['전신 (하체 + 상체 연동)','폭발적 근력','심폐 지구력'], how:['월볼(4~6kg)을 양손으로 가슴 앞에 들고 벽에서 약 50cm 떨어져 서요.','스쿼트 자세로 내려갔다가 올라오는 힘을 이용해 월볼을 벽 위쪽으로 힘껏 던져요.','볼이 떨어지면 받아서 다시 스쿼트 자세로 이어가요.'], tip:'던질 때 팔만 쓰지 말고 하체의 반동을 이용하는 게 핵심이에요.', caution:'볼을 바닥에 떨어뜨리지 않도록 준비하세요.', youtube:'월볼 스쿼트 스로우 홈트' },
  '힙 브릿지 (글루트 브릿지)': { target:['둔근 (엉덩이)','햄스트링','코어 하부'], how:['바닥에 등을 대고 누워 무릎을 세워요.','복부에 힘을 주고 엉덩이를 꽉 쥐면서 골반을 천장 쪽으로 들어 올려요.','어깨~무릎이 일직선이 될 때까지 들어 올린 뒤 1~2초 유지해요.','천천히 내려오되 엉덩이가 바닥에 완전히 닿기 전에 다시 올려요.'], tip:'올라간 상태에서 엉덩이를 최대한 쥐어짜는 느낌이 중요해요.', caution:'허리가 과도하게 꺾이지 않도록 복부를 계속 유지하세요.', youtube:'글루트 브릿지 자세 홈트' },
  '플랭크': { target:['복직근 (앞 복부)','복횡근 (심부 코어)','어깨 안정근','둔근'], how:['팔꿈치를 어깨 바로 아래 바닥에 대고 엎드려요.','발끝을 세우고 몸을 들어 머리부터 발까지 일직선을 만들어요.','배꼽을 등 쪽으로 당기는 느낌으로 복부를 팽팽하게 유지해요.'], tip:'엉덩이가 올라가거나 처지면 효과가 없어요. 거울로 옆면 자세를 확인해보세요.', caution:'허리 통증 시 무릎을 바닥에 댄 니 플랭크로 시작하세요.', youtube:'플랭크 자세 초보 교정' },
  '스텝박스 스텝업 인터벌': { target:['대퇴사두근','둔근','심폐 지구력'], how:['박스(20~30cm) 앞에 서서 오른발을 박스 위에 올려요.','오른발로 박스를 밀어 올라가면서 왼발도 박스 위로 가져와요.','다시 오른발부터 내려와 양발이 바닥에 닿으면 한 회 완성.'], tip:'인터벌 핵심은 강할 때 진짜 빠르게예요.', caution:'박스가 미끄럽지 않은지 확인하고, 무릎이 흔들리면 속도를 줄이세요.', youtube:'스텝박스 인터벌 홈트' },
  '스텝퍼 중강도 유산소': { target:['심폐 지구력','하체 근지구력','칼로리 소모'], how:['스텝퍼에 올라 분당 80~90 스텝 속도로 유지해요.','심박수가 130~145bpm 구간에 머물도록 조절해요.','손잡이는 최대한 잡지 않거나 가볍게만.'], tip:'심박수 앱이나 손목 밴드로 모니터링하면 좋아요.', caution:'어지럼증 시 즉시 멈추고 수분을 보충하세요.', youtube:'스텝퍼 유산소 운동 효과' },
  '스텝퍼 고중강도 유산소': { target:['심폐 지구력','칼로리 소모'], how:['분당 90~100 스텝으로 빠르게 밟아요.','심박 140~150 bpm 구간 유지가 목표.','손잡이 잡지 않으면 칼로리 소모 15~20% 증가!'], tip:'숨이 차지만 짧은 문장은 말할 수 있는 강도가 적정이에요.', caution:'심박이 165 이상 올라가면 속도를 줄이세요.', youtube:'스텝퍼 고강도 유산소' },
  '스텝퍼 HIIT': { target:['심폐 극대화','지방 연소 가속'], how:['고강도 1분: 분당 100~110 스텝, 최대한 빠르게.','저강도 1분(or 45~40초): 분당 60 스텝, 심박 회복.','번갈아 반복. 마지막 2회는 최대 강도로 마무리!'], tip:'HIIT는 고강도 구간을 진짜 힘들게 해야 효과가 있어요. 애매하면 의미 없어요.', caution:'처음엔 6회부터 시작하고 매주 2회씩 늘려가세요. 어지럼증 즉시 중단.', youtube:'스텝퍼 HIIT 인터벌 운동' },
  '스텝퍼 유산소': { target:['심폐 지구력','하체 근지구력','칼로리 소모'], how:['목표 심박 구간을 맞추며 꾸준히 밟아요.','오늘 루틴의 Note에 표시된 심박 구간을 확인하세요.'], tip:'손잡이를 놓으면 코어 자극이 크게 올라가요.', caution:'어지럼증 또는 심박 과다 시 즉시 속도 줄이기.', youtube:'스텝퍼 유산소 운동' },
  '스텝퍼 저강도 유산소': { target:['회복 촉진','심폐 유지','하체 혈류'], how:['분당 60~70 스텝의 느린 속도로 30~35분간 밟아요.','심박수 110~125bpm의 회복 구간 유지.'], tip:'팟캐스트나 음악을 들으며 가볍게 진행하세요.', caution:'토/일은 리커버리의 날. 강도 높이는 충동을 참아야 다음 주가 더 잘 돼요.', youtube:'액티브 리커버리 운동' },
  '버피 (변형: 점프 없이)': { target:['전신 (하체+상체+심폐)','칼로리 소모'], how:['똑바로 서서 손을 바닥에 짚고 양발을 뒤로 뻗어 플랭크 자세가 돼요.','플랭크에서 1~2초 버티고, 발을 다시 손 옆으로 당겨요.','천천히 일어나면서 점프 없이 손을 머리 위로 올려 마무리해요.'], tip:'점프 없는 버전이라도 빠르게 하면 충분히 심박수가 올라요.', caution:'손목이 약한 분은 주먹을 쥐고 하거나 푸시업 손잡이를 활용하세요.', youtube:'버피 변형 점프없이 초보' },
  '버피 (표준)': { target:['전신 (하체+상체+심폐)','칼로리 소모 최대'], how:['서 있다가 손을 바닥에 짚고 양발을 뒤로 뻗어 플랭크.','플랭크에서 푸시업 1개 (선택).','발을 손 옆으로 당기고, 점프하며 양팔을 머리 위로 뻗어요.'], tip:'점프할 때 가볍게 뛰어도 OK. 자세를 지키는 게 중요해요.', caution:'심폐 부담이 크므로 어지럼증 시 즉시 중단.', youtube:'버피 표준 자세 전신' },
  '푸시업 (일반 or 무릎)': { target:['대흉근 (가슴)','전삼각근 (앞 어깨)','삼두근 (뒤쪽 팔)'], how:['손은 어깨보다 약간 넓게, 손가락은 앞을 향해 짚어요.','팔꿈치를 45° 각도로 구부리면서 내려가요.','가슴이 바닥에서 2~3cm 될 때까지 내려왔다가 밀어 올려요.'], tip:'팔꿈치가 양옆으로 너무 벌어지지 않게 — 45° 각도가 관절에 안전해요.', caution:'허리가 처지거나 엉덩이가 올라가면 복부에 힘을 더 주세요.', youtube:'푸시업 자세 초보 교정' },
  '파이크 푸시업': { target:['삼각근 (어깨 전반)','승모근','삼두근'], how:['일반 푸시업 자세에서 엉덩이를 높이 들어 역V자 모양이 돼요.','머리가 손 사이 바닥을 향하도록 팔꿈치를 구부리며 내려가요.','팔꿈치를 다시 펴서 올라오면 한 회 완성.'], tip:'엉덩이가 낮아지면 어깨가 아닌 가슴 운동이 되버려요.', caution:'어깨 통증 시 즉시 중단. 초보는 벽에 기대는 월 파이크 버전으로 시작하세요.', youtube:'파이크 푸시업 어깨 홈트' },
  '메디신볼 체스트 패스 (벽 활용)': { target:['대흉근 (가슴)','전삼각근','삼두근'], how:['벽에서 1~1.5m 떨어져 서고, 메디신볼을 가슴 앞에 두 손으로 잡아요.','가슴에서 벽 쪽으로 폭발적으로 밀어 던져요.','벽에서 튕겨온 공을 받아서 바로 다시 던지세요.'], tip:'팔만 쓰지 말고 가슴이 수축하는 느낌에 집중해요.', caution:'공이 튀어 얼굴에 맞지 않도록 가슴 높이로 수평으로 던지세요.', youtube:'메디신볼 체스트패스 홈트' },
  '트라이셉스 딥 (의자)': { target:['삼두근 (팔 뒤쪽)','전삼각근'], how:['의자나 소파 끝에 양손을 어깨 너비로 짚고, 엉덩이를 의자 앞으로 내려요.','팔꿈치를 90°까지 구부리며 몸을 내렸다가 삼두로 밀어 올려요.'], tip:'내려갈 때 팔꿈치가 옆으로 벌어지지 않게 뒤쪽으로 향하도록 유지하세요.', caution:'어깨 통증 시 내려가는 깊이를 줄이거나 중단.', youtube:'트라이셉스 딥 의자 홈트' },
  '크런치 + 레그레이즈': { target:['복직근 (윗 복부)','장요근 (하복부)','코어 전반'], how:['[크런치] 등을 대고 무릎을 세워요. 손을 귀 옆에 두고 상체를 말듯이 올려요.','[레그레이즈] 다리를 펴고 누워 손을 엉덩이 아래 받쳐요. 다리를 90°까지 올렸다가 천천히 내려요.'], tip:'크런치는 목을 당기면 안 돼요. 복부로 말아 올리는 느낌!', caution:'허리 통증 시 레그레이즈는 무릎을 구부린 채 진행하세요.', youtube:'크런치 레그레이즈 복근 홈트' },
  '마운틴 클라이머': { target:['코어 전반','어깨 안정근','심폐 지구력'], how:['푸시업 준비 자세로 손을 바닥에 짚어요.','오른쪽 무릎을 가슴 쪽으로 빠르게 당겼다가, 왼쪽 무릎을 당겨요.','달리는 동작처럼 좌우를 빠르게 교대하며 반복해요.'], tip:'엉덩이가 올라가거나 허리가 처지지 않게 플랭크 자세를 유지해요.', caution:'손목이 약하면 인클라인 자세로 부담을 줄이세요.', youtube:'마운틴 클라이머 자세 홈트' },
  '스텝박스 스텝업 (빠르게)': { target:['대퇴사두근','둔근','심폐 지구력'], how:['박스 앞에 서서 오른발 → 왼발 순서로 빠르게 올라가고 내려와요.','서킷 중이므로 최대한 많이 반복해요.'], tip:'팔을 앞뒤로 흔들어주면 자연스럽게 속도가 빨라져요.', caution:'피로한 상태에서 박스 가장자리 밟지 않도록 주의!', youtube:'스텝박스 스텝업 빠르게' },
  '메디신볼 슬램 (제자리)': { target:['전신 (등·어깨·코어·하체 연동)','칼로리 소모'], how:['메디신볼을 양손으로 잡아 머리 위로 들어올려요.','전신의 힘을 모아 볼을 바닥에 힘껏 내리쳐요.','볼이 튀어 오르면 잡아서 바로 다시 올려요.'], tip:'팔만 쓰면 금방 지쳐요. 내릴 때 허리를 굽히며 코어와 등을 함께 써야 해요.', caution:'바닥이 딱딱한 타일이면 볼이 크게 튀니까 조심.', youtube:'메디신볼 슬램 전신 운동' },
  '점핑잭 (저강도 버전)': { target:['심폐 지구력','전신 혈류'], how:['양발을 모으고 팔을 몸 옆에 붙인 채로 시작.','점프하며 발을 어깨 너비로 벌리고 동시에 팔을 머리 위로 들어요.','다시 점프해서 처음 자세로 돌아와요.'], tip:'서킷 사이 숨 고르기용 동작으로도 효과적이에요.', caution:'층간 소음이 걱정되면 점프 없는 사이드 스텝 버전으로 하세요.', youtube:'점핑잭 저강도 홈트' },
  '플랭크 변형 (사이드 플랭크)': { target:['복사근 (옆 복부)','엉덩이 옆면 (중둔근)','어깨 안정근'], how:['옆으로 누워 팔꿈치를 어깨 바로 아래 바닥에 대요.','발을 모으고 엉덩이를 들어 머리~발이 일직선이 되게 해요.','위쪽 손은 허리에 올려도 되고, 천장을 향해 뻗어도 돼요.'], tip:'엉덩이가 처지거나 앞으로 회전하지 않도록 버티는 게 핵심.', caution:'어깨가 불안정하면 팔꿈치 버전으로 해요.', youtube:'사이드 플랭크 자세 교정' },
  '고블릿 스쿼트 (월볼 or 메디신볼)': { target:['대퇴사두근','둔근','코어','상체 안정근'], how:['월볼이나 메디신볼을 두 손으로 가슴 앞에 세로로 들어요.','발을 어깨 너비보다 살짝 넓게, 발끝 약간 바깥으로 서요.','허벅지가 바닥과 평행해질 때까지 내려갔다가 올라와요.'], tip:'일반 스쿼트보다 더 깊이 앉기 쉽고 무릎이 자연스럽게 정렬돼요. 초보에게 추천!', caution:'무게가 무거우면 상체가 앞으로 쏠려요. 처음엔 가벼운 볼로 자세를 먼저 익히세요.', youtube:'고블릿 스쿼트 초보' },
  '푸시업 (와이드 그립)': { target:['대흉근 내측 (가슴 안쪽)','전삼각근','삼두근'], how:['손을 어깨 너비의 1.5배 정도로 넓게 짚어요.','일반 푸시업과 동일하게 내려가되, 팔꿈치가 더 옆으로 벌어지게 돼요.'], tip:'와이드 그립은 가슴 자극이 강해요.', caution:'어깨가 불편하면 그립 너비를 줄이세요.', youtube:'와이드 푸시업 가슴 홈트' },
  '스텝박스 스텝업 (무게 추가)': { target:['대퇴사두근','둔근','햄스트링','균형'], how:['메디신볼이나 월볼을 양손으로 가슴에 안고 박스 앞에 서요.','오른발을 박스에 올리고 오른발로 밀어 올라가 왼발도 올려요.','다시 오른발부터 내려와요. 오른쪽 10회 → 왼쪽 10회를 한 세트로.'], tip:'무게를 들면 균형이 어려워요. 천천히 안전하게! 무게는 4~6kg부터.', caution:'박스가 흔들리지 않는지 확인. 내려올 때 쿵 소리 나지 않게 착지.', youtube:'스텝박스 가중 스텝업' },
  '월볼 트위스트 (러시안 트위스트)': { target:['복사근 (옆 복부)','복직근','코어 회전력'], how:['바닥에 앉아 무릎을 살짝 구부리고 발을 들어요.','월볼이나 메디신볼을 양손으로 들고 상체를 약간 뒤로 기울여요.','볼을 좌우로 번갈아 바닥에 가볍게 터치하며 비틀어요.'], tip:'팔만 이동하지 말고 상체 전체가 회전해야 복사근이 자극돼요.', caution:'허리 디스크가 있으면 회전 범위를 줄이세요.', youtube:'러시안 트위스트 복사근' },
  '슈퍼세트 A — 스쿼트 + 힙브릿지': { target:['대퇴사두근','둔근','햄스트링','코어'], how:['스쿼트 15회를 바로 실시해요.','쉬지 않고 바닥에 누워 힙 브릿지 20회를 이어서 해요.','두 동작이 끝나면 30초 휴식 후 다음 세트.'], tip:'슈퍼세트는 쉬지 않고 이어가는 게 핵심! 엉덩이와 허벅지가 모두 타는 느낌.', caution:'처음 슈퍼세트라면 세트 수를 2~3개부터 시작하세요.', youtube:'스쿼트 힙브릿지 슈퍼세트' },
  '슈퍼세트 B — 푸시업 + 파이크 푸시업': { target:['대흉근 (가슴)','삼각근 (어깨)','삼두근'], how:['푸시업 지정 횟수를 바로 실시해요.','쉬지 않고 엉덩이를 들어 파이크 자세로 이어서 실시해요.','두 동작이 끝나면 휴식 후 다음 세트.'], tip:'가슴 → 어깨로 피로가 전환되어 두 부위 모두 자극돼요.', caution:'어깨 충격이 크므로 통증 시 즉시 중단하세요.', youtube:'푸시업 파이크 슈퍼세트' },
  '서킷 3라운드 (60초 휴식 between)': { target:['전신','심폐 지구력','근지구력'], how:['표시된 운동들을 연속으로 실시해요.','한 라운드가 끝나면 표시된 휴식 시간만큼 쉬고 반복.'], tip:'서킷의 핵심은 동작 사이에 멈추지 않는 것!', caution:'너무 힘들면 각 동작 시간을 줄여도 돼요.', youtube:'홈트 서킷 트레이닝 초보' },
  '서킷 4라운드 (45초 휴식 between)': { target:['전신','심폐 지구력'], how:['표시된 운동들을 연속으로 실시.','라운드 사이 45초 휴식.'], tip:'라운드 늘어날수록 힘들지만 마지막 라운드를 제일 세게!', caution:'어지럼증 시 즉시 중단.', youtube:'홈트 서킷 4라운드' },
  '서킷 4라운드 (30초 휴식 between)': { target:['전신','심폐 지구력'], how:['표시된 운동들을 연속으로 실시.','라운드 사이 30초 휴식.'], tip:'30초 휴식은 매우 짧아요. 빠른 전환 연습!', caution:'어지럼증 시 즉시 중단.', youtube:'홈트 서킷 4라운드' },
  '서킷 5라운드 (30초 휴식 between)': { target:['전신','심폐 피크'], how:['표시된 운동들을 연속으로 실시.','라운드 사이 30초만 휴식.'], tip:'5라운드는 상당히 힘들어요. 마지막까지 포기하지 마세요!', caution:'어지럼증 시 즉시 중단.', youtube:'홈트 서킷 5라운드' },
  '서킷 5라운드 (20초 휴식 between)': { target:['전신','심폐 피크'], how:['표시된 운동들을 연속으로 실시.','라운드 사이 20초만 휴식.'], tip:'20초는 물 한 모금 마실 시간이에요. 빠르게 다음 라운드!', caution:'어지럼증 시 즉시 중단.', youtube:'홈트 서킷 고강도' },
  '서킷 6라운드 (15초 휴식 between)': { target:['전신','심폐 극한'], how:['표시된 운동들을 연속으로 실시.','라운드 사이 15초만 휴식.'], tip:'심화기 최고 강도 서킷. 완주 자체가 목표!', caution:'어지럼증 시 즉시 중단.', youtube:'홈트 서킷 심화' },
  '전신 스트레칭': { target:['근막 이완','유연성 향상','피로 회복'], how:['목 → 어깨 → 가슴 → 등 → 허리 → 엉덩이 → 허벅지 → 종아리 순서로 스트레칭.','각 부위 15~30초 유지.'], tip:'유튜브에서 15분 전신 스트레칭 루틴을 틀어놓고 따라 하면 쉬워요.', caution:'반동을 이용해 억지로 늘리면 부상 위험.', youtube:'전신 스트레칭 15분 루틴' },
  '쿨다운 스트레칭': { target:['근육 이완','젖산 제거','유연성 유지'], how:['운동 직후 제자리 걷기 1~2분으로 심박수 낮추기.','방금 사용한 부위 위주로 15~20초씩 스트레칭.'], tip:'운동 끝나도 바로 앉지 말고 5분 이상 움직이며 식혀야 다음 날 근육통이 줄어요.', caution:'통증이 있는 부위는 스트레칭도 과하게 하지 마세요.', youtube:'운동 후 쿨다운 스트레칭' },
};

// ===== 가이드 데이터 =====
const GUIDES = [
  { icon:'🏃', title:'스텝퍼 활용법', content:`<ul><li><strong>속도 조절</strong>: 워밍업 60~70, 중강도 80~90, 고강도 100, HIIT 110 이상</li><li><strong>자세</strong>: 등 곧게, 발 전체로 밟기, 손잡이는 가볍게 터치</li><li><strong>효과 극대화</strong>: 손잡이를 잡지 않으면 코어 활성화↑ 칼로리↑</li><li><strong>심박 목표</strong>: 중강도 130~140, 고강도 145~155, HIIT 피크 160+ bpm</li><li>칼로리 소모 기준 (112kg): 중강도 20분 ≈ 250~300 kcal</li></ul>` },
  { icon:'📦', title:'스텝박스 운동 (유튜브 추천)', content:`<ul><li><strong>기본 스텝업</strong>: 오른발→왼발 순서로 올라갔다 내려오기</li><li><strong>인터벌 스텝업</strong>: 강한 구간/약한 구간 반복 (비율은 주차별 루틴 참고)</li><li><strong>박스 높이</strong>: 중급 25~35cm</li><li><strong>추천 유튜브</strong>: "스텝박스 유산소 30분", "step box HIIT" 검색</li><li>무릎이 아프면 즉시 중단하고 저강도로 전환</li></ul>` },
  { icon:'⚽', title:'월볼 & 메디신볼 활용법', content:`<ul><li><strong>월볼 스쿼트 스로우</strong>: 스쿼트 내려가며 공 들고, 올라오며 벽에 던지기</li><li><strong>메디신볼 슬램</strong>: 머리 위로 들어올려 바닥에 힘껏 던지기</li><li><strong>러시안 트위스트</strong>: 앉아서 발 들고 공 좌우로 터치</li><li>권장 무게 진행: 4kg → 6kg → 8kg → 10kg (주차별 루틴 참고)</li></ul>` },
  { icon:'💡', title:'알배김(DOMS) 관리법', content:`<ul><li><strong>왜 심한가?</strong>: 근육량이 많을수록 회복에 필요한 단백질·산소가 더 많아요</li><li><strong>예방</strong>: 쿨다운 스트레칭 7분 이상, 운동 후 30분 내 단백질 섭취</li><li><strong>완화</strong>: 폼롤러로 뭉친 부위 30초씩 롤링, 따뜻한 물로 샤워</li><li><strong>수분</strong>: 운동 전중후로 물 2.5L 이상</li><li>알배김이 심한 날 가벼운 스트레칭은 오히려 회복 도움 — 완전 누워있지 마세요!</li></ul>` },
  { icon:'🍽️', title:'식단 가이드 (운동 병행)', content:`<ul><li><strong>하루 칼로리 목표</strong>: 약 1,800~2,000 kcal</li><li><strong>단백질</strong>: 체중 × 1.5~2g → 하루 168~224g (닭가슴살, 계란, 두부, 그릭요거트)</li><li><strong>탄수화물</strong>: 현미, 고구마, 오트밀로 대체</li><li><strong>운동 전 30분</strong>: 바나나 1개 or 고구마 소량 (빠른 에너지원)</li><li><strong>운동 후 30분</strong>: 단백질 위주 식사 or 프로틴 (알배김 예방 핵심!)</li><li>물 하루 2.5L 이상 섭취 필수!</li></ul>` },
  { icon:'📅', title:'주차별 강도 로드맵', content:`<ul><li><strong>1~2주 (심폐 적응기)</strong>: 중급 기준 근력 + 지구력 기반 다지기</li><li><strong>3~4주 (지구력 강화기)</strong>: 세트 간 휴식 단축, 스텝퍼 시간 증가</li><li><strong>5~6주 (복합 강화기)</strong>: 슈퍼세트 도입, 인터벌 강도↑</li><li><strong>7~8주 (HIIT 집중기)</strong>: 점프 동작 도입, 스텝퍼 HIIT 시작</li><li><strong>9~10주 (피크 강도기)</strong>: 전신 복합 서킷 피크</li><li><strong>11주~ (유지·심화기)</strong>: 무게 증가, 서킷 라운드 최대화</li></ul>` },
];

// ===== STATE =====
let state = { completedDays:{}, checkedExercises:{}, weightLog:[], sheetsUrl:'', currentWeekOffset:0 };
function saveState() { localStorage.setItem('fitnessPlannerState', JSON.stringify(state)); }
function loadState() { const raw=localStorage.getItem('fitnessPlannerState'); if(raw){try{Object.assign(state,JSON.parse(raw));}catch(e){}} }
const DAYS=['일','월','화','수','목','금','토'];
const DAY_NAMES_FULL=['일요일','월요일','화요일','수요일','목요일','금요일','토요일'];
function today(){const d=new Date();return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
function dateStr(d){return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
function getMonday(date){const d=new Date(date);const day=d.getDay();const diff=d.getDate()-day+(day===0?-6:1);return new Date(d.setDate(diff));}
function showToast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2200);}

// ===== 주차 배너 =====
function renderWeekBanner() {
  const week = getCurrentWeek();
  const phaseInfo = getPhase(week);
  const el = document.getElementById('weekBanner');
  if (!el) return;
  el.style.background = phaseInfo.color;
  el.innerHTML = `<span class="wb-week">${week}주차</span><span class="wb-phase">${phaseInfo.label}</span><span class="wb-desc">${phaseInfo.desc}</span>`;
}

// ===== 모달 =====
function openModal(exName) {
  const cleanName = exName.replace(/^\s+└\s*/, '');
  const info = EXERCISE_INFO[cleanName] || EXERCISE_INFO[exName];
  const modal = document.getElementById('exModal');
  document.getElementById('modalTitle').textContent = cleanName;
  if (!info) {
    document.getElementById('modalTarget').innerHTML='<span style="color:var(--text-muted);font-size:13px">하위 동작들을 각각 클릭해 설명을 확인하세요.</span>';
    document.getElementById('modalHow').innerHTML='';
    document.getElementById('modalTip').style.display='none';
    document.getElementById('modalCaution').style.display='none';
    document.getElementById('modalYoutube').style.display='none';
  } else {
    document.getElementById('modalTarget').innerHTML = info.target.map(t=>`<span class="target-chip">${t}</span>`).join('');
    document.getElementById('modalHow').innerHTML = info.how.map((h,i)=>`<div class="how-step"><span class="how-num">${i+1}</span><span>${h}</span></div>`).join('');
    const tipEl=document.getElementById('modalTip'); tipEl.style.display=''; tipEl.querySelector('.tip-text').textContent=info.tip;
    const cauEl=document.getElementById('modalCaution'); cauEl.style.display=''; cauEl.querySelector('.caution-text').textContent=info.caution;
    const ytEl=document.getElementById('modalYoutube'); ytEl.style.display='';
    ytEl.querySelector('a').href=`https://www.youtube.com/results?search_query=${encodeURIComponent(info.youtube)}`;
    ytEl.querySelector('a').textContent=`▶ 유튜브 "${info.youtube}" 검색`;
  }
  modal.classList.add('open');
  document.body.style.overflow='hidden';
}
function closeModal(){document.getElementById('exModal').classList.remove('open');document.body.style.overflow='';}

// ===== PROGRESS =====
function updateOverallProgress(){
  const weights=state.weightLog; let currentW=112;
  if(weights.length>0) currentW=weights[weights.length-1].weight;
  const lost=112-currentW, goal=22;
  const pct=Math.min(100,Math.max(0,Math.round(lost/goal*100)));
  document.getElementById('overallProgress').style.width=pct+'%';
  document.getElementById('progressLabel').textContent=pct+'% 달성';
  document.getElementById('displayCurrentWeight').textContent=currentW;
}

// ===== TAB NAV =====
function initTabs(){
  document.querySelectorAll('.tab-btn').forEach(btn=>{
    btn.addEventListener('click',()=>{
      document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c=>c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('tab-'+btn.dataset.tab).classList.add('active');
      if(btn.dataset.tab==='record') renderRecord();
      if(btn.dataset.tab==='weekly') renderWeekly();
    });
  });
}

// ===== TODAY TAB =====
function renderToday(){
  const now=new Date(); const dayIdx=now.getDay(); const plan=getTodayPlan(); const todayKey=today();
  document.getElementById('todayDate').textContent=`${now.getMonth()+1}월 ${now.getDate()}일`;
  document.getElementById('todayDay').textContent=DAY_NAMES_FULL[dayIdx];
  const label=document.getElementById('todayRoutineLabel'); const list=document.getElementById('todayExerciseList');
  if(plan.type==='rest'){
    label.textContent='오늘은 휴식일입니다';
    list.innerHTML=`<div class="rest-day-card"><div class="rest-day-icon">🛌</div><div class="rest-day-title">완전 휴식일</div><div class="rest-day-desc">근육 회복과 성장을 위한 중요한 날입니다.<br>가벼운 스트레칭과 충분한 수면을 취하세요.</div></div>`;
    document.getElementById('btnCompleteToday').style.display='none';
    document.getElementById('todayTime').textContent=0; document.getElementById('todayDone').textContent=0; document.getElementById('todayTotal').textContent=0; return;
  }
  document.getElementById('btnCompleteToday').style.display='block';
  label.textContent=`오늘의 루틴 — ${plan.label}`;
  if(plan.note){
    const existing=document.getElementById('planNote');
    if(existing) existing.remove();
    const noteEl=document.createElement('div'); noteEl.id='planNote'; noteEl.className='plan-note';
    noteEl.innerHTML=`<span>📌 ${plan.note}</span>`; label.after(noteEl);
  }
  const checked=state.checkedExercises[todayKey]||{};
  let doneCount=0, doneMin=0;
  const tagMap={warm:'워밍업',cool:'쿨다운',cardio:'유산소',strength:'근력',core:'코어'};
  list.innerHTML=plan.exercises.map((ex,i)=>{
    const isDone=!!checked[i]; if(isDone){doneCount++;doneMin+=ex.min||0;}
    const infoKey=ex.name.replace(/^\s+└\s*/,'');
    const hasDetail=!!EXERCISE_INFO[ex.name]||!!EXERCISE_INFO[infoKey];
    return`<div class="exercise-item${isDone?' done':''}" data-idx="${i}" data-name="${encodeURIComponent(ex.name)}">
      <div class="exercise-check">${isDone?'✓':''}</div>
      <div class="exercise-info"><div class="exercise-name">${ex.name}</div><div class="exercise-detail">${ex.detail}</div></div>
      <div class="exercise-right">${hasDetail?`<button class="btn-info" data-name="${encodeURIComponent(ex.name)}" title="운동 방법 보기">📋</button>`:''}<span class="exercise-tag tag-${ex.tag}">${tagMap[ex.tag]||ex.tag}</span></div>
    </div>`;
  }).join('');
  document.getElementById('todayDone').textContent=doneCount; document.getElementById('todayTotal').textContent=plan.exercises.length; document.getElementById('todayTime').textContent=doneMin;
  list.querySelectorAll('.exercise-item').forEach(item=>{
    item.addEventListener('click',(e)=>{
      if(e.target.closest('.btn-info')) return;
      const idx=parseInt(item.dataset.idx);
      if(!state.checkedExercises[todayKey]) state.checkedExercises[todayKey]={};
      state.checkedExercises[todayKey][idx]=!state.checkedExercises[todayKey][idx];
      saveState(); renderToday();
    });
  });
  list.querySelectorAll('.btn-info').forEach(btn=>{
    btn.addEventListener('click',(e)=>{e.stopPropagation();openModal(decodeURIComponent(btn.dataset.name));});
  });
}

function initCompleteBtn(){
  document.getElementById('btnCompleteToday').addEventListener('click',()=>{
    const key=today(); const plan=getTodayPlan();
    const checked=state.checkedExercises[key]||{};
    const total=plan.exercises.length; const done=Object.values(checked).filter(Boolean).length;
    if(done===0){showToast('운동을 먼저 체크해주세요! 💪');return;}
    state.completedDays[key]=true; saveState(); renderToday();
    showToast(`완료! ${done}/${total}종목 달성 🎉`); updateOverallProgress();
  });
}

// ===== WEIGHT =====
function renderWeightHistory(){
  const el=document.getElementById('weightHistory'); const recent=state.weightLog.slice(-5).reverse();
  if(recent.length===0){el.innerHTML='<span style="font-size:12px;color:var(--text-muted)">아직 기록이 없어요</span>';return;}
  el.innerHTML=recent.map(w=>`<div class="weight-chip">${w.date.slice(5)} <span>${w.weight}kg</span></div>`).join('');
}
function initWeightInput(){
  document.getElementById('btnSaveWeight').addEventListener('click',()=>{
    const val=parseFloat(document.getElementById('weightInput').value);
    if(isNaN(val)||val<50||val>200){showToast('올바른 체중을 입력해주세요');return;}
    state.weightLog.push({date:today(),weight:val}); document.getElementById('weightInput').value='';
    saveState(); renderWeightHistory(); updateOverallProgress(); showToast(`체중 ${val}kg 기록 완료! ✅`);
  });
}

// ===== WEEKLY =====
function getWeekDates(offset=0){
  const now=new Date(); now.setDate(now.getDate()+offset*7);
  const mon=getMonday(now); const reorder=[];
  for(let i=0;i<7;i++){const d=new Date(mon);d.setDate(mon.getDate()+i);reorder.push(d);}
  return reorder;
}
function renderWeekly(){
  const offset=state.currentWeekOffset; const weekDates=getWeekDates(offset); const todayKey=today();
  const first=weekDates[0], last=weekDates[6];
  document.getElementById('weekLabel').textContent=`${first.getMonth()+1}/${first.getDate()} ~ ${last.getMonth()+1}/${last.getDate()}`;
  let completedCount=0;
  weekDates.forEach(d=>{const k=dateStr(d);const plan=getDayPlan(d.getDay());if(plan.type==='rest')return;if(state.completedDays[k])completedCount++;});
  const workDays=weekDates.filter(d=>getDayPlan(d.getDay()).type!=='rest').length;
  const rate=workDays>0?Math.round(completedCount/workDays*100):0;
  document.getElementById('weeklyRateBar').style.width=rate+'%';
  document.getElementById('weeklyRateLabel').textContent=`${completedCount} / ${workDays}일 완료 (${rate}%)`;
  const grid=document.getElementById('weeklyGrid');
  const tagMap={warm:'워밍업',cool:'쿨다운',cardio:'유산소',strength:'근력',core:'코어'};
  grid.innerHTML=weekDates.map((d,i)=>{
    const dayIdx=d.getDay(); const plan=getDayPlan(dayIdx);
    const k=dateStr(d); const isToday=k===todayKey; const isDone=!!state.completedDays[k];
    const dotClass=isDone?'done':(isToday?'today':'');
    const typeLabel={rest:'휴식',strength:'근력',cardio:'유산소'}[plan.type]||'';
    const exList=plan.exercises.length>0?plan.exercises.map(ex=>{
      const infoKey=ex.name.replace(/^\s+└\s*/,'');
      const hasDetail=!!EXERCISE_INFO[ex.name]||!!EXERCISE_INFO[infoKey];
      return`<div class="wday-exercise-mini"><span class="wday-ex-name">${ex.name}</span><div class="wday-ex-right"><span class="wday-ex-detail">${ex.detail}</span>${hasDetail?`<button class="btn-info-sm" data-name="${encodeURIComponent(ex.name)}">📋</button>`:''}</div></div>`;
    }).join(''):'<div class="wday-exercise-mini"><span>충분한 휴식을 취하세요 💤</span></div>';
    return`<div class="weekly-day-card"><div class="wday-header" data-card="${i}"><div class="wday-name-wrap"><div class="wday-dot ${dotClass}"></div><div><div class="wday-name">${DAYS[dayIdx]}요일 ${d.getMonth()+1}/${d.getDate()} ${isToday?'🔴':''}</div><div class="wday-sub">${plan.label||'—'}</div></div></div><div style="display:flex;align-items:center;gap:8px"><span class="wday-badge ${plan.type}">${typeLabel}</span><span class="wday-arrow">▼</span></div></div><div class="wday-body" id="wday-body-${i}">${plan.note?`<div class="plan-note-sm">📌 ${plan.note}</div>`:''} ${exList}</div></div>`;
  }).join('');
  grid.querySelectorAll('.wday-header').forEach(h=>{
    h.addEventListener('click',()=>{const idx=h.dataset.card;const body=document.getElementById(`wday-body-${idx}`);body.classList.toggle('open');h.querySelector('.wday-arrow').style.transform=body.classList.contains('open')?'rotate(180deg)':'';});
  });
  grid.querySelectorAll('.btn-info-sm').forEach(btn=>{
    btn.addEventListener('click',(e)=>{e.stopPropagation();openModal(decodeURIComponent(btn.dataset.name));});
  });
  document.getElementById('btnPrevWeek').onclick=()=>{state.currentWeekOffset--;renderWeekly();};
  document.getElementById('btnNextWeek').onclick=()=>{state.currentWeekOffset++;renderWeekly();};
}

// ===== RECORD =====
function renderRecord(){
  const weights=state.weightLog; const currentW=weights.length>0?weights[weights.length-1].weight:null;
  document.getElementById('recCurrentWeight').innerHTML=currentW?`${currentW} <span>kg</span>`:`— <span>kg</span>`;
  const lost=currentW?+(112-currentW).toFixed(1):null;
  document.getElementById('recLost').innerHTML=lost!==null?`${lost} <span>kg</span>`:`— <span>kg</span>`;
  const remain=currentW?+(currentW-90).toFixed(1):null;
  document.getElementById('recRemain').innerHTML=remain!==null?`${remain} <span>kg</span>`:`— <span>kg</span>`;
  renderWeightChart(); renderCalendar();
}
function renderWeightChart(){
  const canvas=document.getElementById('weightChart'); const ctx=canvas.getContext('2d');
  const logs=state.weightLog.slice(-14);
  canvas.width=canvas.parentElement.clientWidth-32; canvas.height=180;
  ctx.clearRect(0,0,canvas.width,canvas.height);
  if(logs.length<2){ctx.fillStyle='#aaa';ctx.font='13px Noto Sans KR';ctx.textAlign='center';ctx.fillText('체중 기록이 2개 이상 필요합니다',canvas.width/2,90);return;}
  const weights=logs.map(l=>l.weight); const labels=logs.map(l=>l.date.slice(5));
  const min=Math.min(...weights,90)-2, max=Math.max(...weights,112)+2;
  const pad={top:20,right:20,bottom:36,left:40};
  const w=canvas.width-pad.left-pad.right, h=canvas.height-pad.top-pad.bottom;
  const xScale=i=>pad.left+(i/(logs.length-1))*w; const yScale=v=>pad.top+h-((v-min)/(max-min))*h;
  ctx.strokeStyle='#f0f0f0';ctx.lineWidth=1;
  for(let i=0;i<=4;i++){const y=pad.top+(h/4)*i;ctx.beginPath();ctx.moveTo(pad.left,y);ctx.lineTo(pad.left+w,y);ctx.stroke();ctx.fillStyle='#aaa';ctx.font='10px Noto Sans KR';ctx.textAlign='right';ctx.fillText((max-((max-min)/4)*i).toFixed(0),pad.left-4,y+4);}
  ctx.strokeStyle='#27ae60';ctx.lineWidth=1.5;ctx.setLineDash([4,4]);
  const gy=yScale(90);ctx.beginPath();ctx.moveTo(pad.left,gy);ctx.lineTo(pad.left+w,gy);ctx.stroke();ctx.setLineDash([]);
  ctx.fillStyle='#27ae60';ctx.font='bold 10px Noto Sans KR';ctx.textAlign='left';ctx.fillText('목표 90kg',pad.left+2,gy-3);
  ctx.strokeStyle='#e94560';ctx.lineWidth=2.5;ctx.beginPath();
  logs.forEach((l,i)=>{const x=xScale(i),y=yScale(l.weight);i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);});ctx.stroke();
  logs.forEach((l,i)=>{ctx.beginPath();ctx.arc(xScale(i),yScale(l.weight),4,0,Math.PI*2);ctx.fillStyle='#e94560';ctx.fill();});
  ctx.fillStyle='#aaa';ctx.font='10px Noto Sans KR';ctx.textAlign='center';
  logs.forEach((l,i)=>{if(i%Math.max(1,Math.floor(logs.length/5))===0||i===logs.length-1)ctx.fillText(labels[i],xScale(i),pad.top+h+22);});
}
function renderCalendar(){
  const wrap=document.getElementById('calendarWrap'); const now=new Date(),todayKey=today();
  const year=now.getFullYear(),month=now.getMonth();
  const firstDay=new Date(year,month,1).getDay(); const daysInMonth=new Date(year,month+1,0).getDate();
  let html=`<div class="cal-month"><div class="cal-month-title">${year}년 ${month+1}월</div><div class="cal-grid">`;
  ['일','월','화','수','목','금','토'].forEach(d=>{html+=`<div class="cal-day-label">${d}</div>`;});
  for(let i=0;i<firstDay;i++) html+='<div class="cal-day empty"></div>';
  for(let d=1;d<=daysInMonth;d++){const k=`${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;const isToday=k===todayKey,isDone=!!state.completedDays[k];html+=`<div class="cal-day ${isToday?'today':isDone?'done':''}">${d}</div>`;}
  html+='</div></div>'; wrap.innerHTML=html;
}

// ===== SHEETS =====
function initSheets(){
  const input=document.getElementById('sheetsUrl'); if(state.sheetsUrl) input.value=state.sheetsUrl;
  document.getElementById('btnSaveSheets').addEventListener('click',()=>{state.sheetsUrl=input.value.trim();saveState();showToast('시트 URL 저장 완료 ✅');});
  document.getElementById('btnExport').addEventListener('click',async()=>{
    const url=state.sheetsUrl||document.getElementById('sheetsUrl').value.trim();
    if(!url){showToast('구글 시트 URL을 먼저 입력해주세요');return;}
    const statusEl=document.getElementById('exportStatus'); statusEl.textContent='전송 중...';
    const weights=state.weightLog; const currentW=weights.length>0?weights[weights.length-1].weight:112;
    const plan=getTodayPlan(); const checked=state.checkedExercises[today()]||{};
    const done=Object.values(checked).filter(Boolean).length;
    const week=getCurrentWeek(); const phaseInfo=getPhase(week);
    const payload={date:today(),weight:currentW,completedExercises:done,totalExercises:plan.exercises.length,routine:plan.label||'휴식',isCompleted:!!state.completedDays[today()],week:week,phase:phaseInfo.label};
    try{await fetch(url,{method:'POST',mode:'no-cors',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});statusEl.textContent='✅ 전송 완료! 구글 시트를 확인해보세요.';showToast('구글 시트 전송 완료 📤');}
    catch(e){statusEl.textContent='⚠️ 전송 실패. URL과 Apps Script 설정을 확인해주세요.';}
  });
}

// ===== GUIDE =====
function renderGuide(){
  const list=document.getElementById('guideList');
  list.innerHTML=GUIDES.map((g,i)=>`<div class="guide-card"><div class="guide-card-header" data-guide="${i}"><div class="guide-card-title"><span>${g.icon}</span>${g.title}</div><span class="wday-arrow">▼</span></div><div class="guide-card-body" id="guide-body-${i}">${g.content}</div></div>`).join('');
  list.querySelectorAll('.guide-card-header').forEach(h=>{h.addEventListener('click',()=>{const idx=h.dataset.guide;const body=document.getElementById(`guide-body-${idx}`);body.classList.toggle('open');h.querySelector('.wday-arrow').style.transform=body.classList.contains('open')?'rotate(180deg)':'';});});
}

// ===== INIT =====
function init(){
  loadState(); initTabs(); renderWeekBanner(); renderToday(); initCompleteBtn();
  initWeightInput(); renderWeightHistory(); renderGuide(); updateOverallProgress(); renderWeekly();
  document.getElementById('modalClose').addEventListener('click',closeModal);
  document.getElementById('exModal').addEventListener('click',(e)=>{if(e.target===document.getElementById('exModal'))closeModal();});
}
document.addEventListener('DOMContentLoaded',init);
