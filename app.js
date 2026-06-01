/* ================================================
   홈트 플래너 v5 — Firestore 연동 (서울)
   ================================================ */

// ===== Firebase 설정 =====
const firebaseConfig = {
  apiKey: "AIzaSyDzOPDH7zoEn17ycyevkf8YeTlzGDWOe1U",
  authDomain: "fitness-planner-9d1f3.firebaseapp.com",
  projectId: "fitness-planner-9d1f3",
  storageBucket: "fitness-planner-9d1f3.firebasestorage.app",
  messagingSenderId: "646096770845",
  appId: "1:646096770845:web:a2f5a32aa839362fd673f4"
};

const firebaseApp = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const DOC_REF = db.collection('planner').doc('main');

// ===== 주차 계산 =====
const START_DATE = '2026-05-30';

function getCurrentWeek() {
  const start = new Date(START_DATE);
  const now = new Date();
  start.setHours(0,0,0,0); now.setHours(0,0,0,0);
  return Math.max(1, Math.floor((now - start) / (1000*60*60*24*7)) + 1);
}

function getPhase(week) {
  if (week <= 2)  return { phase:1, label:'심폐 적응기',   color:'#3498db', desc:'중급 기준점 — 자세 완성 + 심폐 깨우기' };
  if (week <= 4)  return { phase:2, label:'지구력 강화기', color:'#27ae60', desc:'종목 교체 + 휴식 단축' };
  if (week <= 6)  return { phase:3, label:'복합 강화기',   color:'#f39c12', desc:'슈퍼세트 + 복합 동작 도입' };
  if (week <= 8)  return { phase:4, label:'HIIT 집중기',   color:'#e67e22', desc:'점프 동작 + 스텝퍼 HIIT' };
  if (week <= 10) return { phase:5, label:'피크 강도기',   color:'#e74c3c', desc:'전신 복합 서킷 피크' };
  return           { phase:6, label:'유지·심화기',   color:'#8e44ad', desc:'무게 증가 + 변형 동작 심화' };
}

const PHASE_PLANS = {
  1: {
    0: { type:'rest', label:'완전 휴식', exercises:[] },
    1: { type:'strength', label:'하체 A — 기본 근력', totalMin:60, note:'기본 패턴 완성 주간. 자세에 집중하세요. 세트 간 45초 휴식.', exercises:[
      { name:'준비운동 — 스텝퍼 워밍업', detail:'6분 (분당 65 스텝)', tag:'warm', min:6 },
      { name:'스쿼트', detail:'4세트 × 15회 (휴식 45초)', tag:'strength', min:9 },
      { name:'런지 (좌우 교대)', detail:'3세트 × 14회 (휴식 45초)', tag:'strength', min:8 },
      { name:'힙 브릿지 (글루트 브릿지)', detail:'4세트 × 20회 (휴식 30초)', tag:'strength', min:7 },
      { name:'플랭크', detail:'3세트 × 40초 (휴식 30초)', tag:'core', min:5 },
      { name:'스텝퍼 유산소', detail:'20분 중강도 (심박 130~140)', tag:'cardio', min:20 },
      { name:'쿨다운 스트레칭', detail:'7분 하체 위주', tag:'cool', min:7 },
    ]},
    2: { type:'cardio', label:'유산소 A — 스테디 스테이트', totalMin:60, note:'심폐 적응 주간. 강도보다 꾸준한 유지가 목표!', exercises:[
      { name:'준비운동 — 제자리 걷기', detail:'5분', tag:'warm', min:5 },
      { name:'스텝박스 스텝업 인터벌', detail:'30초 강 / 40초 약 × 10세트', tag:'cardio', min:20 },
      { name:'스텝퍼 중강도 유산소', detail:'25분 (심박 130~145)', tag:'cardio', min:25 },
      { name:'버피 (변형: 점프 없이)', detail:'3세트 × 8회 (휴식 60초)', tag:'strength', min:5 },
      { name:'쿨다운 스트레칭', detail:'7분 전신', tag:'cool', min:7 },
    ]},
    3: { type:'strength', label:'상체·코어 A — 밀기 중심', totalMin:60, note:'알배김 강하면 다음날 스트레칭 10분 추가.', exercises:[
      { name:'준비운동 — 암 서클 + 토르소 트위스트', detail:'5분', tag:'warm', min:5 },
      { name:'푸시업 (일반 or 무릎)', detail:'4세트 × 12회 (휴식 45초)', tag:'strength', min:9 },
      { name:'파이크 푸시업', detail:'3세트 × 10회 (휴식 45초)', tag:'strength', min:7 },
      { name:'트라이셉스 딥 (의자)', detail:'3세트 × 12회 (휴식 45초)', tag:'strength', min:6 },
      { name:'플랭크', detail:'3세트 × 40초 (휴식 30초)', tag:'core', min:5 },
      { name:'크런치 + 레그레이즈', detail:'3세트 × 15회 each', tag:'core', min:7 },
      { name:'스텝퍼 유산소', detail:'15분 중강도 (심박 130~140)', tag:'cardio', min:15 },
      { name:'쿨다운 스트레칭', detail:'7분 상체 위주', tag:'cool', min:7 },
    ]},
    4: { type:'cardio', label:'서킷 A — 3라운드 입문', totalMin:60, note:'서킷 첫 주. 동작 사이 멈추지 않는 것에 집중!', exercises:[
      { name:'준비운동 — 스텝퍼 워밍업', detail:'5분', tag:'warm', min:5 },
      { name:'서킷 3라운드 (60초 휴식)', detail:'아래 4가지 × 3라운드', tag:'cardio', min:12 },
      { name:'마운틴 클라이머', detail:'30초', tag:'core', min:3 },
      { name:'스텝박스 스텝업 (빠르게)', detail:'30초', tag:'cardio', min:3 },
      { name:'오버헤드 스쿼트 (볼 홀드)', detail:'30초', tag:'strength', min:3 },
      { name:'점핑잭 (저강도 버전)', detail:'30초', tag:'cardio', min:3 },
      { name:'스텝퍼 유산소', detail:'20분 중강도 (심박 130~140)', tag:'cardio', min:20 },
      { name:'플랭크 변형 (사이드 플랭크)', detail:'좌우 각 40초 × 3세트', tag:'core', min:6 },
      { name:'쿨다운 스트레칭', detail:'7분 전신', tag:'cool', min:7 },
    ]},
    5: { type:'strength', label:'전신 A — 하체+상체 복합', totalMin:60, note:'금요일은 전신 마무리. 완료 후 단백질 섭취!', exercises:[
      { name:'준비운동 — 스텝퍼 워밍업', detail:'6분', tag:'warm', min:6 },
      { name:'고블릿 스쿼트 (볼 홀드)', detail:'4세트 × 12회 (휴식 45초)', tag:'strength', min:9 },
      { name:'푸시업 (와이드 그립)', detail:'3세트 × 12회 (휴식 45초)', tag:'strength', min:7 },
      { name:'스텝박스 스텝업 (무게 추가)', detail:'3세트 × 12회 (좌우, 4~6kg)', tag:'strength', min:8 },
      { name:'러시안 트위스트 (볼 홀드)', detail:'3세트 × 20회 (휴식 30초)', tag:'core', min:6 },
      { name:'버피 (변형: 점프 없이)', detail:'3세트 × 8회 (휴식 60초)', tag:'cardio', min:6 },
      { name:'스텝퍼 유산소', detail:'15분 중강도 (심박 130~140)', tag:'cardio', min:15 },
      { name:'쿨다운 스트레칭', detail:'7분 전신', tag:'cool', min:7 },
    ]},
    6: { type:'cardio', label:'액티브 리커버리', totalMin:45, note:'근육 회복의 날. 억지로 강하게 하면 역효과!', exercises:[
      { name:'스텝퍼 저강도 유산소', detail:'30분 (심박 110~120)', tag:'cardio', min:30 },
      { name:'전신 스트레칭', detail:'15분 전신 + 폼롤러', tag:'cool', min:15 },
    ]},
  },
  2: {
    0: { type:'rest', label:'완전 휴식', exercises:[] },
    1: { type:'strength', label:'하체 B — 단방향 + 볼 저항', totalMin:60, note:'종목 교체! 이번 주부터 휴식 30초로 단축.', exercises:[
      { name:'준비운동 — 스텝퍼 워밍업', detail:'6분 (분당 75 스텝)', tag:'warm', min:6 },
      { name:'불가리안 스플릿 스쿼트', detail:'4세트 × 12회 (좌우, 휴식 30초)', tag:'strength', min:10 },
      { name:'사이드 런지 + 볼 홀드', detail:'3세트 × 14회 (휴식 30초)', tag:'strength', min:8 },
      { name:'싱글레그 힙 브릿지', detail:'4세트 × 15회 (좌우, 휴식 20초)', tag:'strength', min:8 },
      { name:'플랭크 변형 (사이드 플랭크)', detail:'3세트 × 45초 (휴식 20초)', tag:'core', min:5 },
      { name:'스텝퍼 유산소', detail:'25분 중강도 (심박 135~145)', tag:'cardio', min:25 },
      { name:'쿨다운 스트레칭', detail:'7분 하체 위주', tag:'cool', min:7 },
    ]},
    2: { type:'cardio', label:'유산소 B — 인터벌 강화', totalMin:60, note:'강한 구간 비중 늘리기 시작!', exercises:[
      { name:'준비운동 — 제자리 걷기', detail:'5분', tag:'warm', min:5 },
      { name:'스텝박스 스텝업 인터벌', detail:'40초 강 / 20초 약 × 12세트', tag:'cardio', min:24 },
      { name:'스텝퍼 중강도 유산소', detail:'25분 (심박 135~148)', tag:'cardio', min:25 },
      { name:'버피 (변형: 점프 없이)', detail:'4세트 × 10회 (휴식 45초)', tag:'strength', min:6 },
      { name:'쿨다운 스트레칭', detail:'7분 전신', tag:'cool', min:7 },
    ]},
    3: { type:'strength', label:'상체·코어 B — 각도 변화', totalMin:60, note:'같은 부위, 다른 각도로 자극. 세트 수 증가!', exercises:[
      { name:'준비운동 — 암 서클 + 토르소 트위스트', detail:'5분', tag:'warm', min:5 },
      { name:'인클라인 푸시업 (의자)', detail:'4세트 × 15회 (휴식 30초)', tag:'strength', min:9 },
      { name:'다이아몬드 푸시업', detail:'3세트 × 10회 (휴식 30초)', tag:'strength', min:7 },
      { name:'트라이셉스 딥 (의자)', detail:'4세트 × 14회 (휴식 30초)', tag:'strength', min:7 },
      { name:'플랭크 숄더 탭', detail:'3세트 × 20회 (휴식 20초)', tag:'core', min:6 },
      { name:'볼 레이즈 크런치', detail:'4세트 × 15회 (휴식 20초)', tag:'core', min:7 },
      { name:'스텝퍼 유산소', detail:'18분 중강도 (심박 135~145)', tag:'cardio', min:18 },
      { name:'쿨다운 스트레칭', detail:'7분 상체 위주', tag:'cool', min:7 },
    ]},
    4: { type:'cardio', label:'서킷 B — 4라운드 + 볼 동작', totalMin:60, note:'서킷 라운드 4회로 증가! 볼 동작 추가.', exercises:[
      { name:'준비운동 — 스텝퍼 워밍업', detail:'5분', tag:'warm', min:5 },
      { name:'서킷 4라운드 (45초 휴식)', detail:'아래 4가지 × 4라운드', tag:'cardio', min:16 },
      { name:'마운틴 클라이머', detail:'35초', tag:'core', min:3 },
      { name:'스텝박스 스텝업 (빠르게)', detail:'35초', tag:'cardio', min:3 },
      { name:'오버헤드 스쿼트 (볼 홀드)', detail:'35초', tag:'strength', min:3 },
      { name:'버피 (변형: 점프 없이)', detail:'35초', tag:'cardio', min:3 },
      { name:'스텝퍼 유산소', detail:'20분 중강도 (심박 135~145)', tag:'cardio', min:20 },
      { name:'플랭크 변형 (사이드 플랭크)', detail:'좌우 각 45초 × 3세트', tag:'core', min:6 },
      { name:'쿨다운 스트레칭', detail:'7분 전신', tag:'cool', min:7 },
    ]},
    5: { type:'strength', label:'전신 B — 하체+코어 복합', totalMin:60, note:'스텝박스 무게 6kg으로 올려보세요.', exercises:[
      { name:'준비운동 — 스텝퍼 워밍업', detail:'6분 (분당 80 스텝)', tag:'warm', min:6 },
      { name:'불가리안 스플릿 스쿼트', detail:'4세트 × 12회 (좌우, 휴식 30초)', tag:'strength', min:10 },
      { name:'인클라인 푸시업 (의자)', detail:'3세트 × 15회 (휴식 30초)', tag:'strength', min:7 },
      { name:'스텝박스 스텝업 (무게 추가)', detail:'4세트 × 12회 (좌우, 6kg)', tag:'strength', min:9 },
      { name:'루마니안 데드리프트 (볼 홀드)', detail:'4세트 × 15회 (휴식 20초)', tag:'strength', min:7 },
      { name:'버피 (변형: 점프 없이)', detail:'4세트 × 10회 (휴식 45초)', tag:'cardio', min:7 },
      { name:'스텝퍼 유산소', detail:'18분 중강도 (심박 135~145)', tag:'cardio', min:18 },
      { name:'쿨다운 스트레칭', detail:'7분 전신', tag:'cool', min:7 },
    ]},
    6: { type:'cardio', label:'액티브 리커버리', totalMin:45, note:'폼롤러로 알배김 부위 집중 관리.', exercises:[
      { name:'스텝퍼 저강도 유산소', detail:'30분 (심박 115~125)', tag:'cardio', min:30 },
      { name:'전신 스트레칭', detail:'15분 전신 + 폼롤러', tag:'cool', min:15 },
    ]},
  },
  3: {
    0: { type:'rest', label:'완전 휴식', exercises:[] },
    1: { type:'strength', label:'하체 C — 슈퍼세트 도입', totalMin:60, note:'슈퍼세트: 두 동작을 휴식 없이 연달아! 라운드 사이만 30초.', exercises:[
      { name:'준비운동 — 스텝퍼 워밍업', detail:'6분 (분당 80 스텝)', tag:'warm', min:6 },
      { name:'슈퍼세트 A — 스쿼트 + 힙브릿지', detail:'스쿼트 15회 → 힙브릿지 20회, 4세트 (휴식 30초)', tag:'strength', min:12 },
      { name:'불가리안 스플릿 스쿼트', detail:'4세트 × 14회 (좌우, 휴식 20초)', tag:'strength', min:10 },
      { name:'루마니안 데드리프트 (볼 홀드)', detail:'4세트 × 12회 (휴식 20초)', tag:'strength', min:8 },
      { name:'플랭크', detail:'4세트 × 60초 (휴식 20초)', tag:'core', min:6 },
      { name:'스텝퍼 유산소', detail:'25분 고중강도 (심박 140~150)', tag:'cardio', min:25 },
      { name:'쿨다운 스트레칭', detail:'7분 하체 위주', tag:'cool', min:7 },
    ]},
    2: { type:'cardio', label:'유산소 C — 인터벌 피크', totalMin:60, note:'강한 구간이 약한 구간보다 길어요. 버텨보세요!', exercises:[
      { name:'준비운동 — 제자리 걷기', detail:'5분', tag:'warm', min:5 },
      { name:'스텝박스 스텝업 인터벌', detail:'45초 강 / 15초 약 × 12세트', tag:'cardio', min:24 },
      { name:'스텝퍼 고중강도 유산소', detail:'25분 (심박 140~150)', tag:'cardio', min:25 },
      { name:'버피 (표준)', detail:'3세트 × 10회 (휴식 45초)', tag:'strength', min:6 },
      { name:'쿨다운 스트레칭', detail:'7분 전신', tag:'cool', min:7 },
    ]},
    3: { type:'strength', label:'상체·코어 C — 슈퍼세트', totalMin:60, note:'가슴→어깨 연속 자극. 펌핑 극대화!', exercises:[
      { name:'준비운동 — 암 서클 + 토르소 트위스트', detail:'5분', tag:'warm', min:5 },
      { name:'슈퍼세트 B — 푸시업 + 파이크 푸시업', detail:'푸시업 12회 → 파이크 10회, 4세트 (휴식 30초)', tag:'strength', min:12 },
      { name:'다이아몬드 푸시업', detail:'4세트 × 10회 (휴식 20초)', tag:'strength', min:8 },
      { name:'트라이셉스 딥 (의자)', detail:'4세트 × 15회 (휴식 20초)', tag:'strength', min:7 },
      { name:'플랭크 숄더 탭', detail:'4세트 × 24회 (휴식 20초)', tag:'core', min:7 },
      { name:'볼 레이즈 크런치', detail:'4세트 × 20회 (휴식 20초)', tag:'core', min:8 },
      { name:'스텝퍼 유산소', detail:'18분 고중강도 (심박 140~150)', tag:'cardio', min:18 },
      { name:'쿨다운 스트레칭', detail:'7분 상체 위주', tag:'cool', min:7 },
    ]},
    4: { type:'cardio', label:'서킷 C — 5종목 복합', totalMin:60, note:'서킷 종목 5개로 늘었어요. 전신이 다 타는 느낌!', exercises:[
      { name:'준비운동 — 스텝퍼 워밍업', detail:'5분', tag:'warm', min:5 },
      { name:'서킷 4라운드 (30초 휴식)', detail:'아래 5가지 × 4라운드', tag:'cardio', min:20 },
      { name:'마운틴 클라이머', detail:'40초', tag:'core', min:3 },
      { name:'스텝박스 스텝업 (빠르게)', detail:'40초', tag:'cardio', min:3 },
      { name:'오버헤드 스쿼트 (볼 홀드)', detail:'40초', tag:'strength', min:3 },
      { name:'버피 (표준)', detail:'40초', tag:'cardio', min:3 },
      { name:'볼 레이즈 크런치', detail:'40초', tag:'core', min:3 },
      { name:'스텝퍼 유산소', detail:'18분 고중강도 (심박 140~150)', tag:'cardio', min:18 },
      { name:'쿨다운 스트레칭', detail:'7분 전신', tag:'cool', min:7 },
    ]},
    5: { type:'strength', label:'전신 C — 슈퍼세트 복합', totalMin:60, note:'버피 이제 점프 버전으로! 힘들면 2세트만 점프.', exercises:[
      { name:'준비운동 — 스텝퍼 워밍업', detail:'6분 (분당 85 스텝)', tag:'warm', min:6 },
      { name:'슈퍼세트 A — 스쿼트 + 힙브릿지', detail:'스쿼트 15회 → 힙브릿지 20회, 4세트 (휴식 20초)', tag:'strength', min:11 },
      { name:'슈퍼세트 B — 푸시업 + 파이크 푸시업', detail:'푸시업 12회 → 파이크 10회, 3세트 (휴식 20초)', tag:'strength', min:8 },
      { name:'스텝박스 스텝업 (무게 추가)', detail:'4세트 × 14회 (좌우, 6~8kg)', tag:'strength', min:9 },
      { name:'러시안 트위스트 (볼 홀드)', detail:'4세트 × 25회 (휴식 20초)', tag:'core', min:7 },
      { name:'버피 (표준)', detail:'4세트 × 10회 (휴식 30초)', tag:'cardio', min:7 },
      { name:'스텝퍼 유산소', detail:'18분 고강도 (심박 145~155)', tag:'cardio', min:18 },
      { name:'쿨다운 스트레칭', detail:'7분 전신', tag:'cool', min:7 },
    ]},
    6: { type:'cardio', label:'액티브 리커버리', totalMin:45, note:'5~6주차 피로 피크. 충분히 쉬어야 다음 주 HIIT를 버텨요!', exercises:[
      { name:'스텝퍼 저강도 유산소', detail:'30분 (심박 115~125)', tag:'cardio', min:30 },
      { name:'전신 스트레칭', detail:'15분 전신 폼롤러 집중', tag:'cool', min:15 },
    ]},
  },
  4: {
    0: { type:'rest', label:'완전 휴식', exercises:[] },
    1: { type:'strength', label:'하체 D — 점프 + 볼 저항', totalMin:60, note:'점프 동작 도입! 관절 부담 느끼면 점프 없는 버전으로.', exercises:[
      { name:'준비운동 — 스텝퍼 워밍업', detail:'5분 (분당 85 스텝)', tag:'warm', min:5 },
      { name:'점프 스쿼트', detail:'4세트 × 12회 (휴식 30초)', tag:'strength', min:8 },
      { name:'사이드 런지 + 볼 홀드', detail:'4세트 × 16회 (휴식 20초)', tag:'strength', min:9 },
      { name:'싱글레그 힙 브릿지', detail:'4세트 × 20회 (좌우, 휴식 15초)', tag:'strength', min:8 },
      { name:'플랭크 변형 (사이드 플랭크)', detail:'4세트 × 50초 (휴식 15초)', tag:'core', min:6 },
      { name:'스텝퍼 HIIT', detail:'1분 고강도 / 1분 저강도 × 12회', tag:'cardio', min:24 },
      { name:'쿨다운 스트레칭', detail:'7분 하체 위주', tag:'cool', min:7 },
    ]},
    2: { type:'cardio', label:'유산소 D — HIIT 전환', totalMin:60, note:'스텝퍼 HIIT 핵심 — 고강도 구간에서 심박 155 이상 목표!', exercises:[
      { name:'준비운동 — 제자리 걷기', detail:'5분', tag:'warm', min:5 },
      { name:'스텝박스 스텝업 인터벌', detail:'50초 강 / 10초 약 × 12세트', tag:'cardio', min:24 },
      { name:'스텝퍼 HIIT', detail:'1분 고강도 / 1분 저강도 × 12회', tag:'cardio', min:24 },
      { name:'버피 (표준)', detail:'3세트 × 12회 (휴식 30초)', tag:'strength', min:6 },
      { name:'쿨다운 스트레칭', detail:'7분 전신', tag:'cool', min:7 },
    ]},
    3: { type:'strength', label:'상체·코어 D — 고반복 슈퍼세트', totalMin:60, note:'슈퍼세트 + 짧은 휴식으로 상체 지구력 극대화!', exercises:[
      { name:'준비운동 — 암 서클 + 토르소 트위스트', detail:'5분', tag:'warm', min:5 },
      { name:'슈퍼세트 B — 푸시업 + 파이크 푸시업', detail:'푸시업 15회 → 파이크 12회, 5세트 (휴식 20초)', tag:'strength', min:14 },
      { name:'인클라인 푸시업 (의자)', detail:'4세트 × 18회 (휴식 15초)', tag:'strength', min:8 },
      { name:'트라이셉스 딥 (의자)', detail:'4세트 × 18회 (휴식 15초)', tag:'strength', min:7 },
      { name:'플랭크 숄더 탭', detail:'4세트 × 28회 (휴식 15초)', tag:'core', min:7 },
      { name:'볼 레이즈 크런치', detail:'5세트 × 20회 (휴식 15초)', tag:'core', min:9 },
      { name:'스텝퍼 유산소', detail:'18분 고강도 (심박 148~158)', tag:'cardio', min:18 },
      { name:'쿨다운 스트레칭', detail:'7분 상체 위주', tag:'cool', min:7 },
    ]},
    4: { type:'cardio', label:'서킷 D — 6종목 HIIT', totalMin:60, note:'6종목 서킷! 한 라운드 끝날 때마다 30초만 쉬어요.', exercises:[
      { name:'준비운동 — 스텝퍼 워밍업', detail:'5분', tag:'warm', min:5 },
      { name:'서킷 5라운드 (30초 휴식)', detail:'아래 6가지 × 5라운드', tag:'cardio', min:25 },
      { name:'점프 스쿼트', detail:'40초', tag:'strength', min:3 },
      { name:'스텝박스 스텝업 (빠르게)', detail:'40초', tag:'cardio', min:3 },
      { name:'루마니안 데드리프트 (볼 홀드)', detail:'40초', tag:'strength', min:3 },
      { name:'버피 (표준)', detail:'40초', tag:'cardio', min:3 },
      { name:'마운틴 클라이머', detail:'40초', tag:'core', min:3 },
      { name:'플랭크 변형 (사이드 플랭크)', detail:'좌우 각 40초', tag:'core', min:3 },
      { name:'쿨다운 스트레칭', detail:'7분 전신', tag:'cool', min:7 },
    ]},
    5: { type:'strength', label:'전신 D — 복합 고강도', totalMin:60, note:'스텝박스 무게 8kg 도전!', exercises:[
      { name:'준비운동 — 스텝퍼 워밍업', detail:'5분 (분당 90 스텝)', tag:'warm', min:5 },
      { name:'점프 스쿼트', detail:'4세트 × 15회 (휴식 20초)', tag:'strength', min:9 },
      { name:'슈퍼세트 B — 푸시업 + 파이크 푸시업', detail:'푸시업 15회 → 파이크 12회, 4세트 (휴식 20초)', tag:'strength', min:11 },
      { name:'스텝박스 스텝업 (무게 추가)', detail:'4세트 × 14회 (좌우, 8kg)', tag:'strength', min:9 },
      { name:'루마니안 데드리프트 (볼 홀드)', detail:'4세트 × 15회 (휴식 15초)', tag:'strength', min:8 },
      { name:'버피 (표준)', detail:'4세트 × 12회 (휴식 20초)', tag:'cardio', min:7 },
      { name:'스텝퍼 HIIT', detail:'1분 고강도 / 1분 저강도 × 8회', tag:'cardio', min:16 },
      { name:'쿨다운 스트레칭', detail:'7분 전신', tag:'cool', min:7 },
    ]},
    6: { type:'cardio', label:'액티브 리커버리', totalMin:45, note:'HIIT 피크 주간 후 회복. 이 날이 제일 중요해요!', exercises:[
      { name:'스텝퍼 저강도 유산소', detail:'30분 (심박 115~125)', tag:'cardio', min:30 },
      { name:'전신 스트레칭', detail:'15분 전신 폼롤러 집중', tag:'cool', min:15 },
    ]},
  },
  5: {
    0: { type:'rest', label:'완전 휴식', exercises:[] },
    1: { type:'strength', label:'하체 E — 피크 복합', totalMin:65, note:'피크 강도 돌입! 충분한 수면이 필수.', exercises:[
      { name:'준비운동 — 스텝퍼 워밍업', detail:'5분 (분당 90 스텝)', tag:'warm', min:5 },
      { name:'점프 스쿼트', detail:'5세트 × 15회 (휴식 20초)', tag:'strength', min:10 },
      { name:'불가리안 스플릿 스쿼트', detail:'5세트 × 14회 (좌우, 휴식 15초)', tag:'strength', min:11 },
      { name:'싱글레그 힙 브릿지', detail:'5세트 × 20회 (좌우, 휴식 10초)', tag:'strength', min:9 },
      { name:'플랭크', detail:'5세트 × 70초 (휴식 10초)', tag:'core', min:7 },
      { name:'스텝퍼 HIIT', detail:'1분 고강도 / 45초 저강도 × 12회', tag:'cardio', min:21 },
      { name:'쿨다운 스트레칭', detail:'7분 하체 위주', tag:'cool', min:7 },
    ]},
    2: { type:'cardio', label:'유산소 E — 피크 HIIT', totalMin:60, note:'심박 160 이상 구간 만들어보세요!', exercises:[
      { name:'준비운동 — 제자리 걷기', detail:'5분', tag:'warm', min:5 },
      { name:'스텝박스 스텝업 인터벌', detail:'50초 강 / 10초 약 × 15세트', tag:'cardio', min:25 },
      { name:'스텝퍼 HIIT', detail:'1분 고강도 / 45초 저강도 × 12회', tag:'cardio', min:21 },
      { name:'버피 (표준)', detail:'4세트 × 12회 (휴식 20초)', tag:'strength', min:7 },
      { name:'쿨다운 스트레칭', detail:'7분 전신', tag:'cool', min:7 },
    ]},
    3: { type:'strength', label:'상체·코어 E — 피크 슈퍼세트', totalMin:60, note:'세트 사이 멈추지 않는 것이 목표!', exercises:[
      { name:'준비운동 — 암 서클 + 토르소 트위스트', detail:'5분', tag:'warm', min:5 },
      { name:'슈퍼세트 B — 푸시업 + 파이크 푸시업', detail:'푸시업 18회 → 파이크 14회, 5세트 (휴식 15초)', tag:'strength', min:15 },
      { name:'다이아몬드 푸시업', detail:'5세트 × 12회 (휴식 10초)', tag:'strength', min:9 },
      { name:'트라이셉스 딥 (의자)', detail:'5세트 × 20회 (휴식 10초)', tag:'strength', min:8 },
      { name:'플랭크 숄더 탭', detail:'5세트 × 30회 (휴식 10초)', tag:'core', min:8 },
      { name:'볼 레이즈 크런치', detail:'5세트 × 20회 (휴식 10초)', tag:'core', min:8 },
      { name:'스텝퍼 유산소', detail:'20분 고강도 (심박 150~160)', tag:'cardio', min:20 },
      { name:'쿨다운 스트레칭', detail:'7분 상체 위주', tag:'cool', min:7 },
    ]},
    4: { type:'cardio', label:'서킷 E — 피크 전신', totalMin:65, note:'완주하면 그 주 완전 성공!', exercises:[
      { name:'준비운동 — 스텝퍼 워밍업', detail:'5분', tag:'warm', min:5 },
      { name:'서킷 5라운드 (20초 휴식)', detail:'아래 6가지 × 5라운드', tag:'cardio', min:28 },
      { name:'점프 스쿼트', detail:'45초', tag:'strength', min:3 },
      { name:'스텝박스 스텝업 (빠르게)', detail:'45초', tag:'cardio', min:3 },
      { name:'루마니안 데드리프트 (볼 홀드)', detail:'45초', tag:'strength', min:3 },
      { name:'버피 (표준)', detail:'45초', tag:'cardio', min:3 },
      { name:'마운틴 클라이머', detail:'45초', tag:'core', min:3 },
      { name:'볼 레이즈 크런치', detail:'45초', tag:'core', min:3 },
      { name:'스텝퍼 HIIT', detail:'1분 고강도 / 45초 저강도 × 8회', tag:'cardio', min:17 },
      { name:'쿨다운 스트레칭', detail:'7분 전신', tag:'cool', min:7 },
    ]},
    5: { type:'strength', label:'전신 E — 피크 근력', totalMin:65, note:'스텝박스 8~10kg 도전!', exercises:[
      { name:'준비운동 — 스텝퍼 워밍업', detail:'5분 (분당 95 스텝)', tag:'warm', min:5 },
      { name:'점프 스쿼트', detail:'5세트 × 15회 (휴식 15초)', tag:'strength', min:10 },
      { name:'슈퍼세트 B — 푸시업 + 파이크 푸시업', detail:'푸시업 18회 → 파이크 14회, 4세트 (휴식 15초)', tag:'strength', min:11 },
      { name:'스텝박스 스텝업 (무게 추가)', detail:'5세트 × 14회 (좌우, 8~10kg)', tag:'strength', min:10 },
      { name:'루마니안 데드리프트 (볼 홀드)', detail:'5세트 × 15회 (휴식 10초)', tag:'strength', min:9 },
      { name:'버피 (표준)', detail:'5세트 × 12회 (휴식 15초)', tag:'cardio', min:8 },
      { name:'스텝퍼 HIIT', detail:'1분 고강도 / 45초 저강도 × 8회', tag:'cardio', min:15 },
      { name:'쿨다운 스트레칭', detail:'7분 전신', tag:'cool', min:7 },
    ]},
    6: { type:'cardio', label:'액티브 리커버리', totalMin:50, note:'피크 2주차 후 회복. 몸이 많이 지쳐있을 거예요.', exercises:[
      { name:'스텝퍼 저강도 유산소', detail:'35분 (심박 115~125)', tag:'cardio', min:35 },
      { name:'전신 스트레칭', detail:'15분 전신 폼롤러 집중', tag:'cool', min:15 },
    ]},
  },
  6: {
    0: { type:'rest', label:'완전 휴식', exercises:[] },
    1: { type:'strength', label:'하체 F — 심화 유지', totalMin:65, note:'이제 자신의 페이스가 잡혀야 해요. 무게는 본인이 조절!', exercises:[
      { name:'준비운동 — 스텝퍼 워밍업', detail:'5분 (분당 95 스텝)', tag:'warm', min:5 },
      { name:'슈퍼세트 A — 스쿼트 + 힙브릿지', detail:'스쿼트 20회 → 힙브릿지 25회, 5세트 (휴식 15초)', tag:'strength', min:13 },
      { name:'불가리안 스플릿 스쿼트', detail:'5세트 × 16회 (좌우, 휴식 10초)', tag:'strength', min:11 },
      { name:'루마니안 데드리프트 (볼 홀드)', detail:'5세트 × 15회 (휴식 10초)', tag:'strength', min:9 },
      { name:'플랭크', detail:'5세트 × 80초 (휴식 10초)', tag:'core', min:8 },
      { name:'스텝퍼 HIIT', detail:'1분 고강도 / 40초 저강도 × 12회', tag:'cardio', min:23 },
      { name:'쿨다운 스트레칭', detail:'7분 하체 위주', tag:'cool', min:7 },
    ]},
    2: { type:'cardio', label:'유산소 F — 심화 유지', totalMin:60, note:'지구력 완성 단계. 숨 차면서도 버티는 구간이 길어져야!', exercises:[
      { name:'준비운동 — 제자리 걷기', detail:'5분', tag:'warm', min:5 },
      { name:'스텝박스 스텝업 인터벌', detail:'50초 강 / 10초 약 × 15세트', tag:'cardio', min:25 },
      { name:'스텝퍼 HIIT', detail:'1분 고강도 / 40초 저강도 × 12회', tag:'cardio', min:23 },
      { name:'버피 (표준)', detail:'5세트 × 12회 (휴식 15초)', tag:'strength', min:7 },
      { name:'쿨다운 스트레칭', detail:'7분 전신', tag:'cool', min:7 },
    ]},
    3: { type:'strength', label:'상체·코어 F — 심화 유지', totalMin:60, note:'반복 수보다 자세 집중. 질 좋은 세트가 핵심!', exercises:[
      { name:'준비운동 — 암 서클 + 토르소 트위스트', detail:'5분', tag:'warm', min:5 },
      { name:'슈퍼세트 B — 푸시업 + 파이크 푸시업', detail:'푸시업 20회 → 파이크 15회, 5세트 (휴식 10초)', tag:'strength', min:15 },
      { name:'다이아몬드 푸시업', detail:'5세트 × 15회 (휴식 10초)', tag:'strength', min:9 },
      { name:'트라이셉스 딥 (의자)', detail:'5세트 × 22회 (휴식 10초)', tag:'strength', min:8 },
      { name:'플랭크 숄더 탭', detail:'5세트 × 32회 (휴식 10초)', tag:'core', min:8 },
      { name:'볼 레이즈 크런치', detail:'5세트 × 25회 (휴식 10초)', tag:'core', min:9 },
      { name:'스텝퍼 HIIT', detail:'1분 고강도 / 40초 저강도 × 10회', tag:'cardio', min:18 },
      { name:'쿨다운 스트레칭', detail:'7분 상체 위주', tag:'cool', min:7 },
    ]},
    4: { type:'cardio', label:'서킷 F — 6라운드 심화', totalMin:65, note:'서킷 완주 능력이 매주 느껴지게 올라야 해요.', exercises:[
      { name:'준비운동 — 스텝퍼 워밍업', detail:'5분', tag:'warm', min:5 },
      { name:'서킷 6라운드 (15초 휴식)', detail:'아래 6가지 × 6라운드', tag:'cardio', min:30 },
      { name:'점프 스쿼트', detail:'45초', tag:'strength', min:3 },
      { name:'스텝박스 스텝업 (빠르게)', detail:'45초', tag:'cardio', min:3 },
      { name:'오버헤드 스쿼트 (볼 홀드)', detail:'45초', tag:'strength', min:3 },
      { name:'버피 (표준)', detail:'45초', tag:'cardio', min:3 },
      { name:'마운틴 클라이머', detail:'45초', tag:'core', min:3 },
      { name:'볼 레이즈 크런치', detail:'45초', tag:'core', min:3 },
      { name:'스텝퍼 HIIT', detail:'1분 고강도 / 40초 저강도 × 10회', tag:'cardio', min:19 },
      { name:'쿨다운 스트레칭', detail:'7분 전신', tag:'cool', min:7 },
    ]},
    5: { type:'strength', label:'전신 F — 심화 근력', totalMin:65, note:'목표 90kg 가까워질수록 강도 유지가 더 중요해요!', exercises:[
      { name:'준비운동 — 스텝퍼 워밍업', detail:'5분 (분당 95~100 스텝)', tag:'warm', min:5 },
      { name:'슈퍼세트 A — 스쿼트 + 힙브릿지', detail:'스쿼트 20회 → 힙브릿지 25회, 5세트 (휴식 10초)', tag:'strength', min:13 },
      { name:'슈퍼세트 B — 푸시업 + 파이크 푸시업', detail:'푸시업 20회 → 파이크 15회, 4세트 (휴식 10초)', tag:'strength', min:11 },
      { name:'스텝박스 스텝업 (무게 추가)', detail:'5세트 × 16회 (좌우, 10kg)', tag:'strength', min:10 },
      { name:'루마니안 데드리프트 (볼 홀드)', detail:'5세트 × 18회 (휴식 10초)', tag:'strength', min:9 },
      { name:'버피 (표준)', detail:'5세트 × 15회 (휴식 10초)', tag:'cardio', min:8 },
      { name:'스텝퍼 HIIT', detail:'1분 고강도 / 40초 저강도 × 10회', tag:'cardio', min:19 },
      { name:'쿨다운 스트레칭', detail:'7분 전신', tag:'cool', min:7 },
    ]},
    6: { type:'cardio', label:'액티브 리커버리', totalMin:50, note:'꾸준히 오신 것 자체가 대단합니다. 오늘은 몸에게 선물!', exercises:[
      { name:'스텝퍼 저강도 유산소', detail:'35분 (심박 115~125)', tag:'cardio', min:35 },
      { name:'전신 스트레칭', detail:'15분 전신 폼롤러 집중', tag:'cool', min:15 },
    ]},
  },
};

function getTodayPlan() {
  const { phase } = getPhase(getCurrentWeek());
  return PHASE_PLANS[phase][new Date().getDay()];
}
function getDayPlan(dayIdx) {
  const { phase } = getPhase(getCurrentWeek());
  return PHASE_PLANS[phase][dayIdx];
}

// ===== 운동 상세 정보 =====
const EXERCISE_INFO = {
  '준비운동 — 스텝퍼 워밍업': { target:['심폐계','하체 혈류'], how:['스텝퍼에 올라서서 양발이 페달에 완전히 닿도록 서세요.','등을 곧게 펴고 손잡이는 가볍게만 잡아요.','천천히 분당 65~70 스텝으로 시작합니다.'], tip:'손잡이를 잡지 않으면 코어 활성화와 칼로리 소모가 올라요.', caution:'무릎이 안쪽으로 꺾이지 않도록 주의하세요.', youtube:'스텝퍼 올바른 자세' },
  '준비운동 — 제자리 걷기': { target:['심폐계','전신 혈류'], how:['제자리에서 팔을 앞뒤로 흔들며 걷습니다.','무릎을 높이 들수록 강도가 올라가요.'], tip:'체온을 서서히 올리는 게 목적이에요.', caution:'없음.', youtube:'제자리 걷기 워밍업' },
  '준비운동 — 암 서클 + 토르소 트위스트': { target:['어깨','등 상부','코어'], how:['암 서클: 팔을 옆으로 뻗어 앞10회·뒤10회 크게 돌려요.','토르소 트위스트: 팔을 T자로 뻗고 상체만 좌우로 비틀어요.'], tip:'허리가 아닌 흉추를 비트는 느낌으로!', caution:'허리 통증 시 회전 범위를 줄여주세요.', youtube:'상체 워밍업 루틴' },
  '스쿼트': { target:['대퇴사두근','둔근','햄스트링','코어'], how:['발을 어깨보다 살짝 넓게, 발끝은 15~30° 바깥으로.','엉덩이를 뒤로 내밀며 허벅지가 바닥과 평행해질 때까지 내려가요.','발뒤꿈치로 밀어 올라오며 엉덩이를 꽉 쥐어요.'], tip:'무릎이 발끝 방향과 일치하도록!', caution:'무릎 통증 시 깊이를 줄이세요.', youtube:'스쿼트 초보 자세 교정' },
  '점프 스쿼트': { target:['대퇴사두근','둔근','햄스트링','심폐'], how:['스쿼트 자세로 내려갔다가 올라오는 힘으로 점프.','착지는 발앞꿈치 먼저 → 발 전체로 부드럽게.'], tip:'착지 시 무릎을 약간 구부려 충격 흡수!', caution:'무릎 통증 시 즉시 일반 스쿼트로 대체.', youtube:'점프 스쿼트 자세 홈트' },
  '런지 (좌우 교대)': { target:['대퇴사두근','둔근','햄스트링','균형'], how:['한 발을 앞으로 크게 내딛어요 (보폭 70~80cm).','앞 무릎 90°, 뒷 무릎은 바닥 직전에 멈춰요.','앞발 뒤꿈치로 밀어 돌아오고 교대.'], tip:'보폭이 좁으면 무릎에 부담이 커요.', caution:'무릎 통증 시 스플릿 스쿼트로 대체.', youtube:'런지 자세 교정 초보' },
  '불가리안 스플릿 스쿼트': { target:['대퇴사두근','둔근','햄스트링','균형'], how:['뒷발을 의자 위에 올려요 (발등이 위로).','앞발로 서서 앞 무릎이 90°가 될 때까지 내려가요.','한쪽 끝나면 발 교체.'], tip:'런지보다 둔근·햄스트링 자극이 훨씬 강해요!', caution:'의자 높이 30~40cm가 적당. 너무 높으면 무릎 부담.', youtube:'불가리안 스플릿 스쿼트 홈트' },
  '힙 브릿지 (글루트 브릿지)': { target:['둔근','햄스트링','코어 하부'], how:['등을 대고 무릎을 세워요.','엉덩이를 꽉 쥐면서 골반을 천장으로 들어올려요.','어깨~무릎 일직선에서 1~2초 유지 후 내려요.'], tip:'올라간 상태에서 엉덩이를 최대한 쥐어짜는 느낌!', caution:'허리가 과도하게 꺾이지 않도록.', youtube:'글루트 브릿지 자세 홈트' },
  '싱글레그 힙 브릿지': { target:['둔근','햄스트링','코어 안정성'], how:['힙 브릿지 자세에서 한쪽 다리를 들어 쭉 뻗어요.','한 발로만 바닥을 밀어 골반을 올려요.','일직선 유지 후 내려오고 발 교체.'], tip:'일반 힙 브릿지보다 둔근 자극이 2배!', caution:'골반이 한쪽으로 기울지 않도록 코어 유지.', youtube:'싱글레그 힙 브릿지 홈트' },
  '플랭크': { target:['복직근','복횡근','어깨 안정근','둔근'], how:['팔꿈치를 어깨 아래에 대고 엎드려요.','발끝 세우고 머리~발 일직선.','배꼽을 등 쪽으로 당기는 느낌으로 복부를 팽팽하게.'], tip:'엉덩이가 올라가거나 처지면 효과 없어요.', caution:'허리 통증 시 니 플랭크로 시작.', youtube:'플랭크 자세 초보 교정' },
  '플랭크 숄더 탭': { target:['코어 전반','어깨 안정근','복사근'], how:['팔을 쭉 편 푸시업 준비 자세.','오른손으로 왼쪽 어깨 터치 후 돌아와요.','반대편 반복. 골반이 흔들리지 않게!'], tip:'천천히 할수록 코어 자극이 강해요.', caution:'허리가 흔들리면 발 간격을 넓히세요.', youtube:'플랭크 숄더 탭 코어 홈트' },
  '플랭크 변형 (사이드 플랭크)': { target:['복사근','중둔근','어깨 안정근'], how:['옆으로 누워 팔꿈치를 어깨 아래에 대요.','발을 모으고 엉덩이를 들어 머리~발 일직선.','유지 후 반대편 교체.'], tip:'엉덩이가 처지거나 앞으로 회전하지 않게!', caution:'어깨가 불안정하면 팔꿈치 버전으로.', youtube:'사이드 플랭크 자세 교정' },
  '푸시업 (일반 or 무릎)': { target:['대흉근','전삼각근','삼두근'], how:['손은 어깨보다 살짝 넓게.','팔꿈치 45° 각도로 구부리며 가슴이 2~3cm 위까지 내려가요.','밀어 올리며 한 회 완성.'], tip:'팔꿈치가 너무 옆으로 벌어지지 않게!', caution:'허리가 처지면 복부에 힘을 더 주세요.', youtube:'푸시업 자세 초보 교정' },
  '푸시업 (와이드 그립)': { target:['대흉근 내측','전삼각근','삼두근'], how:['손을 어깨 너비의 1.5배로 넓게 짚어요.','내릴 때 가슴 늘어나는 느낌, 올릴 때 수축하는 느낌.'], tip:'와이드 그립은 가슴 자극이 강해요.', caution:'어깨 불편하면 그립 너비 줄이세요.', youtube:'와이드 푸시업 가슴 홈트' },
  '인클라인 푸시업 (의자)': { target:['대흉근 하부','전삼각근','삼두근'], how:['의자에 양손을 짚고 기울어진 자세에서 푸시업.','각도가 낮을수록 (발이 높을수록) 강도가 올라가요.'], tip:'처음엔 높은 의자로 시작!', caution:'의자가 미끄러지지 않게 고정 확인.', youtube:'인클라인 푸시업 홈트' },
  '파이크 푸시업': { target:['삼각근','승모근','삼두근'], how:['엉덩이를 높이 들어 역V자 모양.','머리가 손 사이 바닥을 향하도록 팔꿈치를 구부려 내려가요.'], tip:'엉덩이가 낮아지면 어깨가 아닌 가슴 운동이 돼요.', caution:'어깨 통증 시 즉시 중단.', youtube:'파이크 푸시업 어깨 홈트' },
  '다이아몬드 푸시업': { target:['삼두근','대흉근 내측'], how:['손을 가슴 아래에서 엄지·검지로 다이아몬드 모양.','팔꿈치를 몸통 가까이 붙인 채로 내려가요.'], tip:'삼두 자극이 일반 푸시업보다 훨씬 강해요!', caution:'손목 통증 시 주먹 쥐고 하거나 중단.', youtube:'다이아몬드 푸시업 삼두 홈트' },
  '트라이셉스 딥 (의자)': { target:['삼두근','전삼각근'], how:['의자 끝에 양손을 짚고 엉덩이를 앞으로 내려요.','팔꿈치 90°까지 구부리며 내렸다가 삼두로 밀어 올려요.'], tip:'팔꿈치가 뒤쪽으로 향하도록 유지!', caution:'어깨 통증 시 깊이 줄이거나 중단.', youtube:'트라이셉스 딥 의자 홈트' },
  '크런치 + 레그레이즈': { target:['복직근 상복부','장요근 하복부'], how:['[크런치] 무릎 세우고 누워 상체를 말아 올려요.','[레그레이즈] 다리 펴고 90°까지 올렸다가 천천히 내려요.'], tip:'크런치는 복부로 말아 올리는 느낌!', caution:'허리 통증 시 레그레이즈는 무릎 구부린 채로.', youtube:'크런치 레그레이즈 복근 홈트' },
  '볼 레이즈 크런치': { target:['복직근 상복부','코어 전반'], how:['등을 대고 무릎 세워 누워요.','볼을 가슴 위에 두 손으로 들어요.','볼을 천장 쪽으로 밀며 상체를 말아 올려요.'], tip:'볼 무게가 추가 저항이 되어 자극이 강해요!', caution:'목을 당기지 말고 복부로 말아 올리는 느낌.', youtube:'볼 크런치 복근 홈트' },
  '러시안 트위스트 (볼 홀드)': { target:['복사근','복직근','코어 회전력'], how:['바닥에 앉아 무릎 구부리고 발을 들어요.','볼을 들고 상체를 약간 뒤로 기울여요.','볼을 좌우로 번갈아 바닥에 터치하며 비틀어요.'], tip:'상체 전체가 회전해야 복사근 자극!', caution:'허리 디스크가 있으면 회전 범위 줄이세요.', youtube:'러시안 트위스트 복사근' },
  '고블릿 스쿼트 (볼 홀드)': { target:['대퇴사두근','둔근','코어'], how:['볼을 두 손으로 가슴 앞에 세로로 들어요.','발을 어깨보다 살짝 넓게, 발끝 약간 바깥.','허벅지 평행까지 내려갔다가 올라와요.'], tip:'일반 스쿼트보다 더 깊이 앉기 쉬워요!', caution:'무게가 무거우면 상체가 앞으로 쏠려요.', youtube:'고블릿 스쿼트 초보' },
  '오버헤드 스쿼트 (볼 홀드)': { target:['전신','코어','어깨 안정근'], how:['볼을 양손으로 머리 위로 들어 올려요.','팔을 쭉 뻗은 채 스쿼트로 내려가요.','허벅지 평행까지 내려갔다가 올라와요.'], tip:'코어와 어깨 안정근이 동시에 자극돼요!', caution:'어깨 불편하면 고블릿 스쿼트로 대체.', youtube:'오버헤드 스쿼트 홈트' },
  '사이드 런지 + 볼 홀드': { target:['내전근','둔근','대퇴사두근'], how:['볼을 가슴 앞에 들고 서요.','오른발을 옆으로 크게 내딛으며 오른 무릎을 구부려요.','왼발은 쭉 뻗은 채 유지. 밀어 돌아오고 교대.'], tip:'볼을 앞에 들면 상체 균형 잡기가 쉬워요!', caution:'무릎 통증 시 내딛는 폭을 줄이세요.', youtube:'사이드 런지 홈트' },
  '루마니안 데드리프트 (볼 홀드)': { target:['햄스트링','둔근','척추기립근'], how:['볼을 양손으로 허벅지 앞에 들고 서요.','등을 곧게 편 채로 엉덩이를 뒤로 밀며 상체를 숙여요.','볼이 정강이 중간쯤 오면 둔근 조이며 올라와요.'], tip:'허리가 아닌 햄스트링이 당기는 느낌이 나야 해요!', caution:'허리를 둥글게 구부리면 부상 위험.', youtube:'루마니안 데드리프트 홈트' },
  '스텝박스 스텝업 인터벌': { target:['대퇴사두근','둔근','심폐'], how:['오른발→왼발 순서로 올라가고 내려와요.','강한 구간에서 최대한 빠르게.'], tip:'팔을 앞뒤로 흔들면 속도가 올라가요!', caution:'피로 상태에서 박스 가장자리 밟지 않도록!', youtube:'스텝박스 인터벌 홈트' },
  '스텝박스 스텝업 (빠르게)': { target:['대퇴사두근','둔근','심폐'], how:['박스 앞에서 최대한 빠르게 올라갔다 내려오기 반복.'], tip:'팔 흔들기로 속도 높이기!', caution:'지친 상태에서 발 위치 꼭 확인.', youtube:'스텝박스 스텝업 빠르게' },
  '스텝박스 스텝업 (무게 추가)': { target:['대퇴사두근','둔근','햄스트링'], how:['볼을 가슴에 안고 오른발→왼발 순서로 올라가고 내려와요.','한쪽 끝나면 발 교체.'], tip:'무게 들면 균형이 어려워요. 천천히 안전하게!', caution:'박스가 흔들리지 않는지 확인.', youtube:'스텝박스 가중 스텝업' },
  '스텝퍼 유산소': { target:['심폐 지구력','하체 근지구력'], how:['루틴 노트에 표시된 심박 구간을 목표로 밟아요.'], tip:'손잡이를 놓으면 코어 자극과 칼로리 소모가 올라가요!', caution:'어지럼증 시 즉시 속도 줄이기.', youtube:'스텝퍼 유산소 운동' },
  '스텝퍼 중강도 유산소': { target:['심폐 지구력','하체 근지구력'], how:['분당 80~90 스텝, 심박 130~148 구간 유지.'], tip:'숨이 차지만 짧은 문장은 말할 수 있는 강도!', caution:'심박 165 이상이면 속도 줄이세요.', youtube:'스텝퍼 중강도 유산소' },
  '스텝퍼 고중강도 유산소': { target:['심폐 지구력','칼로리 소모'], how:['분당 90~100 스텝, 심박 140~150 구간 유지.'], tip:'손잡이 잡지 않으면 칼로리 소모 15~20% 증가!', caution:'심박 165 이상이면 속도 줄이세요.', youtube:'스텝퍼 고강도 유산소' },
  '스텝퍼 HIIT': { target:['심폐 극대화','지방 연소'], how:['고강도: 분당 100~110 스텝, 최대한 빠르게.','저강도: 분당 60 스텝, 심박 회복.','번갈아 반복.'], tip:'고강도 구간을 진짜 힘들게 해야 효과 있어요!', caution:'처음엔 6회부터 시작하고 매주 2회씩 늘려가세요.', youtube:'스텝퍼 HIIT 인터벌 운동' },
  '스텝퍼 저강도 유산소': { target:['회복 촉진','심폐 유지'], how:['분당 60~70 스텝, 심박 110~125 구간.'], tip:'팟캐스트나 음악 들으며 가볍게!', caution:'리커버리 날은 강도 높이는 충동을 참으세요.', youtube:'액티브 리커버리 운동' },
  '마운틴 클라이머': { target:['코어 전반','어깨 안정근','심폐'], how:['푸시업 준비 자세로 손을 바닥에 짚어요.','오른쪽 무릎을 가슴으로 당겼다가, 왼쪽을 당겨요.','달리듯 좌우를 빠르게 교대.'], tip:'엉덩이가 올라가지 않게 플랭크 자세 유지!', caution:'손목 약하면 주먹 쥐고 하세요.', youtube:'마운틴 클라이머 자세 홈트' },
  '버피 (변형: 점프 없이)': { target:['전신 (하체+상체+심폐)'], how:['손 짚고 플랭크 → 발 당기기 → 점프 없이 일어나기.'], tip:'빠르게 하면 점프 없어도 심박이 충분히 올라요!', caution:'손목 약하면 주먹 쥐고 하세요.', youtube:'버피 변형 점프없이 초보' },
  '버피 (표준)': { target:['전신','칼로리 소모 최대'], how:['손 짚고 플랭크 → 푸시업(선택) → 발 당겨 → 점프!','착지 즉시 다음 회 이어가요.'], tip:'자세를 지키는 게 속도보다 중요해요!', caution:'어지럼증 시 즉시 중단.', youtube:'버피 표준 자세 전신' },
  '점핑잭 (저강도 버전)': { target:['심폐 지구력','전신 혈류'], how:['발 모으고 팔 몸 옆에서 시작.','점프하며 발 벌리고 팔을 머리 위로.'], tip:'서킷 사이 회복 동작으로도 좋아요!', caution:'층간 소음 걱정되면 사이드 스텝으로.', youtube:'점핑잭 저강도 홈트' },
  '슈퍼세트 A — 스쿼트 + 힙브릿지': { target:['대퇴사두근','둔근','햄스트링'], how:['스쿼트 지정 횟수 → 쉬지 않고 바닥에 누워 힙 브릿지.','두 동작 끝나면 지정 휴식 후 다음 세트.'], tip:'엉덩이와 허벅지가 모두 타는 느낌!', caution:'처음엔 2~3세트부터 시작.', youtube:'스쿼트 힙브릿지 슈퍼세트' },
  '슈퍼세트 B — 푸시업 + 파이크 푸시업': { target:['대흉근','삼각근','삼두근'], how:['푸시업 지정 횟수 → 쉬지 않고 파이크 자세로 이어서.','두 동작 끝나면 지정 휴식 후 다음 세트.'], tip:'가슴 → 어깨로 피로가 전환되어 두 부위 모두 자극!', caution:'어깨 통증 시 즉시 중단.', youtube:'푸시업 파이크 슈퍼세트' },
  '서킷 3라운드 (60초 휴식)': { target:['전신','심폐'], how:['동작들을 연속으로 실시. 라운드 사이 60초 휴식.'], tip:'동작 사이에 멈추지 않는 것이 핵심!', caution:'어지럼증 시 즉시 중단.', youtube:'홈트 서킷 3라운드' },
  '서킷 4라운드 (45초 휴식)': { target:['전신','심폐'], how:['동작들을 연속으로 실시. 라운드 사이 45초 휴식.'], tip:'마지막 라운드를 제일 세게!', caution:'어지럼증 시 즉시 중단.', youtube:'홈트 서킷 4라운드' },
  '서킷 4라운드 (30초 휴식)': { target:['전신','심폐'], how:['동작들을 연속으로 실시. 라운드 사이 30초 휴식.'], tip:'30초는 매우 짧아요. 빠른 전환 연습!', caution:'어지럼증 시 즉시 중단.', youtube:'홈트 서킷 4라운드' },
  '서킷 5라운드 (30초 휴식)': { target:['전신','심폐 피크'], how:['동작들을 연속으로 실시. 라운드 사이 30초 휴식.'], tip:'5라운드는 상당히 힘들어요. 포기하지 마세요!', caution:'어지럼증 시 즉시 중단.', youtube:'홈트 서킷 5라운드' },
  '서킷 5라운드 (20초 휴식)': { target:['전신','심폐 피크'], how:['동작들을 연속으로 실시. 라운드 사이 20초 휴식.'], tip:'20초는 물 한 모금 마실 시간!', caution:'어지럼증 시 즉시 중단.', youtube:'홈트 서킷 고강도' },
  '서킷 6라운드 (15초 휴식)': { target:['전신','심폐 극한'], how:['동작들을 연속으로 실시. 라운드 사이 15초 휴식.'], tip:'완주 자체가 목표!', caution:'어지럼증 시 즉시 중단.', youtube:'홈트 서킷 심화' },
  '전신 스트레칭': { target:['근막 이완','유연성','피로 회복'], how:['목→어깨→가슴→등→허리→엉덩이→허벅지→종아리 순서.','각 부위 15~30초 유지.'], tip:'유튜브에서 15분 전신 스트레칭 루틴 틀어놓고 따라 하면 쉬워요!', caution:'반동으로 억지로 늘리면 부상 위험.', youtube:'전신 스트레칭 15분 루틴' },
  '쿨다운 스트레칭': { target:['근육 이완','젖산 제거'], how:['운동 직후 제자리 걷기 1~2분.','오늘 사용한 부위 위주로 15~20초씩 스트레칭.'], tip:'운동 끝나도 바로 앉지 말고 5분 이상 움직이며 식혀요!', caution:'통증 있는 부위는 과하게 스트레칭 금지.', youtube:'운동 후 쿨다운 스트레칭' },
};

const GUIDES = [
  { icon:'🏃', title:'스텝퍼 활용법', content:`<ul><li><strong>속도</strong>: 워밍업 65~70, 중강도 80~90, 고강도 100, HIIT 110+ (분당 스텝)</li><li><strong>심박 목표</strong>: 중강도 130~145, 고강도 148~158, HIIT 피크 160+ bpm</li><li><strong>효과 극대화</strong>: 손잡이 잡지 않으면 코어↑ 칼로리↑</li><li>칼로리 소모 (112kg): 중강도 20분 ≈ 250~300 kcal</li></ul>` },
  { icon:'📦', title:'스텝박스 활용법', content:`<ul><li><strong>인터벌</strong>: 강한 구간/약한 구간 비율은 주차별 루틴 참고</li><li><strong>박스 높이</strong>: 중급 25~35cm</li><li><strong>유튜브 추천</strong>: "스텝박스 유산소 30분", "step box HIIT"</li><li>무릎 아프면 즉시 중단!</li></ul>` },
  { icon:'⚽', title:'볼 운동 (소음 없는 동작)', content:`<ul><li><strong>고블릿 스쿼트</strong>: 볼 가슴 앞에 들고 스쿼트</li><li><strong>오버헤드 스쿼트</strong>: 볼 머리 위로 들고 스쿼트</li><li><strong>루마니안 데드리프트</strong>: 볼 들고 엉덩이 뒤로 밀기</li><li><strong>볼 레이즈 크런치</strong>: 누워서 볼 들고 크런치</li><li><strong>러시안 트위스트</strong>: 앉아서 볼 좌우 터치</li><li>권장 무게: 4kg → 6kg → 8kg → 10kg</li></ul>` },
  { icon:'💡', title:'알배김(DOMS) 관리법', content:`<ul><li><strong>예방</strong>: 쿨다운 7분 이상 + 운동 후 30분 내 단백질 섭취</li><li><strong>완화</strong>: 폼롤러로 뭉친 부위 30초씩 롤링, 따뜻한 샤워</li><li><strong>수분</strong>: 하루 2.5L 이상</li><li>알배김 심한 날도 가벼운 스트레칭은 도움!</li></ul>` },
  { icon:'🍽️', title:'식단 가이드', content:`<ul><li><strong>하루 칼로리</strong>: 1,800~2,000 kcal</li><li><strong>단백질</strong>: 하루 150~200g (닭가슴살, 계란, 두부)</li><li><strong>운동 후 30분</strong>: 단백질 위주 식사 (알배김 예방 핵심!)</li><li>물 하루 2.5L 이상!</li></ul>` },
  { icon:'📅', title:'주차별 강도 로드맵', content:`<ul><li><strong>1~2주</strong>: 하체A·상체A·서킷A — 기본 자세 완성</li><li><strong>3~4주</strong>: 하체B·상체B·서킷B — 종목 교체 + 휴식 단축</li><li><strong>5~6주</strong>: 하체C·상체C·서킷C — 슈퍼세트 도입</li><li><strong>7~8주</strong>: 하체D·상체D·서킷D — 점프 + HIIT</li><li><strong>9~10주</strong>: 하체E·상체E·서킷E — 전신 복합 피크</li><li><strong>11주~</strong>: 하체F·상체F·서킷F — 무게 증가 심화</li></ul>` },
];

// ===== STATE =====
let state = { completedDays:{}, checkedExercises:{}, weightLog:[], sheetsUrl:'', currentWeekOffset:0 };
let syncTimeout = null;
let isOnline = true;

// ===== Firestore 동기화 =====
async function saveToCloud() {
  try {
    await DOC_REF.set(state);
    showSyncStatus('✅ 저장됨');
  } catch(e) {
    showSyncStatus('📵 오프라인 — 로컬 저장');
    saveLocal();
  }
}

function saveLocal() {
  localStorage.setItem('fitnessPlannerState_v5', JSON.stringify(state));
}

function saveState() {
  saveLocal();
  clearTimeout(syncTimeout);
  syncTimeout = setTimeout(saveToCloud, 1000);
}

async function loadState() {
  const raw = localStorage.getItem('fitnessPlannerState_v5');
  if (raw) { try { Object.assign(state, JSON.parse(raw)); } catch(e) {} }
  try {
    showSyncStatus('🔄 동기화 중...');
    const snap = await DOC_REF.get();
    if (snap.exists) {
      Object.assign(state, snap.data());
      saveLocal();
      showSyncStatus('✅ 동기화 완료');
    } else {
      await DOC_REF.set(state);
      showSyncStatus('✅ 새 데이터 생성');
    }
  } catch(e) {
    showSyncStatus('📵 오프라인 모드');
  }
  renderAll();
}

function showSyncStatus(msg) {
  const el = document.getElementById('syncStatus');
  if (!el) return;
  el.textContent = msg;
  if (msg.includes('✅')) {
    setTimeout(() => { el.textContent = ''; }, 3000);
  }
}

// ===== UTILS =====
const DAYS=['일','월','화','수','목','금','토'];
const DAY_NAMES_FULL=['일요일','월요일','화요일','수요일','목요일','금요일','토요일'];
function today(){const d=new Date();return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
function dateStr(d){return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
function getMonday(date){const d=new Date(date);const day=d.getDay();const diff=d.getDate()-day+(day===0?-6:1);return new Date(d.setDate(diff));}
function showToast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2200);}

function renderWeekBanner(){
  const week=getCurrentWeek();const p=getPhase(week);const el=document.getElementById('weekBanner');
  if(!el)return;
  el.style.background=p.color;
  el.innerHTML=`<span class="wb-week">${week}주차</span><span class="wb-phase">${p.label}</span><span class="wb-desc">${p.desc}</span>`;
}

function openModal(exName){
  const cleanName=exName.replace(/^\s+└\s*/,'');
  const info=EXERCISE_INFO[cleanName]||EXERCISE_INFO[exName];
  const modal=document.getElementById('exModal');
  document.getElementById('modalTitle').textContent=cleanName;
  if(!info){
    document.getElementById('modalTarget').innerHTML='<span style="color:var(--text-muted);font-size:13px">하위 동작들을 각각 클릭해 설명을 확인하세요.</span>';
    document.getElementById('modalHow').innerHTML='';
    document.getElementById('modalTip').style.display='none';
    document.getElementById('modalCaution').style.display='none';
    document.getElementById('modalYoutube').style.display='none';
  } else {
    document.getElementById('modalTarget').innerHTML=info.target.map(t=>`<span class="target-chip">${t}</span>`).join('');
    document.getElementById('modalHow').innerHTML=info.how.map((h,i)=>`<div class="how-step"><span class="how-num">${i+1}</span><span>${h}</span></div>`).join('');
    const tipEl=document.getElementById('modalTip');tipEl.style.display='';tipEl.querySelector('.tip-text').textContent=info.tip;
    const cauEl=document.getElementById('modalCaution');cauEl.style.display='';cauEl.querySelector('.caution-text').textContent=info.caution;
    const ytEl=document.getElementById('modalYoutube');ytEl.style.display='';
    ytEl.querySelector('a').href=`https://www.youtube.com/results?search_query=${encodeURIComponent(info.youtube)}`;
    ytEl.querySelector('a').textContent=`▶ 유튜브 "${info.youtube}" 검색`;
  }
  modal.classList.add('open');
  document.body.style.overflow='hidden';
}
function closeModal(){document.getElementById('exModal').classList.remove('open');document.body.style.overflow='';}

function updateOverallProgress(){
  const weights=state.weightLog||[];let currentW=112;
  if(weights.length>0)currentW=weights[weights.length-1].weight;
  const pct=Math.min(100,Math.max(0,Math.round((112-currentW)/22*100)));
  document.getElementById('overallProgress').style.width=pct+'%';
  document.getElementById('progressLabel').textContent=pct+'% 달성';
  document.getElementById('displayCurrentWeight').textContent=currentW;
}

function initTabs(){
  document.querySelectorAll('.tab-btn').forEach(btn=>{
    btn.addEventListener('click',()=>{
      document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c=>c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('tab-'+btn.dataset.tab).classList.add('active');
      if(btn.dataset.tab==='record')renderRecord();
      if(btn.dataset.tab==='weekly')renderWeekly();
    });
  });
}

function renderToday(){
  const now=new Date();const dayIdx=now.getDay();const plan=getTodayPlan();const todayKey=today();
  document.getElementById('todayDate').textContent=`${now.getMonth()+1}월 ${now.getDate()}일`;
  document.getElementById('todayDay').textContent=DAY_NAMES_FULL[dayIdx];
  const label=document.getElementById('todayRoutineLabel');
  const list=document.getElementById('todayExerciseList');
  if(plan.type==='rest'){
    label.textContent='오늘은 휴식일입니다';
    list.innerHTML=`<div class="rest-day-card"><div class="rest-day-icon">🛌</div><div class="rest-day-title">완전 휴식일</div><div class="rest-day-desc">근육 회복과 성장을 위한 중요한 날입니다.<br>가벼운 스트레칭과 충분한 수면을 취하세요.</div></div>`;
    document.getElementById('btnCompleteToday').style.display='none';
    document.getElementById('todayTime').textContent=0;document.getElementById('todayDone').textContent=0;document.getElementById('todayTotal').textContent=0;return;
  }
  document.getElementById('btnCompleteToday').style.display='block';
  label.textContent=`오늘의 루틴 — ${plan.label}`;
  const existing=document.getElementById('planNote');if(existing)existing.remove();
  if(plan.note){const noteEl=document.createElement('div');noteEl.id='planNote';noteEl.className='plan-note';noteEl.innerHTML=`<span>📌 ${plan.note}</span>`;label.after(noteEl);}
  const tagMap={warm:'워밍업',cool:'쿨다운',cardio:'유산소',strength:'근력',core:'코어'};
  const checked=state.checkedExercises?.[todayKey]||{};
  let doneCount=0,doneMin=0;
  plan.exercises.forEach((ex,i)=>{if(checked[i]){doneCount++;doneMin+=ex.min||0;}});
  list.innerHTML=plan.exercises.map((ex,i)=>{
    const isDone=!!checked[i];
    const infoKey=ex.name.replace(/^\s+└\s*/,'');
    const hasDetail=!!EXERCISE_INFO[ex.name]||!!EXERCISE_INFO[infoKey];
    return`<div class="exercise-item${isDone?' done':''}" data-idx="${i}" data-name="${encodeURIComponent(ex.name)}">
      <div class="exercise-check">${isDone?'✓':''}</div>
      <div class="exercise-info"><div class="exercise-name">${ex.name}</div><div class="exercise-detail">${ex.detail}</div></div>
      <div class="exercise-right">${hasDetail?`<button class="btn-info" data-name="${encodeURIComponent(ex.name)}">📋</button>`:''}<span class="exercise-tag tag-${ex.tag}">${tagMap[ex.tag]||ex.tag}</span></div>
    </div>`;
  }).join('');
  document.getElementById('todayDone').textContent=doneCount;
  document.getElementById('todayTotal').textContent=plan.exercises.length;
  document.getElementById('todayTime').textContent=doneMin;
  list.querySelectorAll('.exercise-item').forEach(item=>{
    item.addEventListener('click',(e)=>{
      if(e.target.closest('.btn-info'))return;
      const idx=parseInt(item.dataset.idx);
      if(!state.checkedExercises)state.checkedExercises={};
      if(!state.checkedExercises[todayKey])state.checkedExercises[todayKey]={};
      state.checkedExercises[todayKey][idx]=!state.checkedExercises[todayKey][idx];
      saveState();renderToday();
    });
  });
  list.querySelectorAll('.btn-info').forEach(btn=>{
    btn.addEventListener('click',(e)=>{e.stopPropagation();openModal(decodeURIComponent(btn.dataset.name));});
  });
}

function initCompleteBtn(){
  document.getElementById('btnCompleteToday').addEventListener('click',()=>{
    const key=today();const plan=getTodayPlan();
    const checked=state.checkedExercises?.[key]||{};
    const done=Object.values(checked).filter(Boolean).length;
    if(done===0){showToast('운동을 먼저 체크해주세요! 💪');return;}
    if(!state.completedDays)state.completedDays={};
    state.completedDays[key]=true;saveState();renderToday();
    showToast(`완료! ${done}/${plan.exercises.length}종목 달성 🎉`);updateOverallProgress();
  });
}

function renderWeightHistory(){
  const el=document.getElementById('weightHistory');
  const logs=state.weightLog||[];
  const recent=logs.slice(-5).reverse();
  if(recent.length===0){el.innerHTML='<span style="font-size:12px;color:var(--text-muted)">아직 기록이 없어요</span>';return;}
  el.innerHTML=recent.map(w=>`<div class="weight-chip">${w.date.slice(5)} <span>${w.weight}kg</span></div>`).join('');
}
function initWeightInput(){
  document.getElementById('btnSaveWeight').addEventListener('click',()=>{
    const val=parseFloat(document.getElementById('weightInput').value);
    if(isNaN(val)||val<50||val>200){showToast('올바른 체중을 입력해주세요');return;}
    if(!state.weightLog)state.weightLog=[];
    state.weightLog.push({date:today(),weight:val});document.getElementById('weightInput').value='';
    saveState();renderWeightHistory();updateOverallProgress();showToast(`체중 ${val}kg 기록 완료! ✅`);
  });
}

function getWeekDates(offset=0){
  const now=new Date();now.setDate(now.getDate()+offset*7);
  const mon=getMonday(now);const days=[];
  for(let i=0;i<7;i++){const d=new Date(mon);d.setDate(mon.getDate()+i);days.push(d);}
  return days;
}

function renderWeekly(){
  const offset=state.currentWeekOffset||0;const weekDates=getWeekDates(offset);const todayKey=today();
  const first=weekDates[0],last=weekDates[6];
  document.getElementById('weekLabel').textContent=`${first.getMonth()+1}/${first.getDate()} ~ ${last.getMonth()+1}/${last.getDate()}`;
  let completedCount=0;
  weekDates.forEach(d=>{const k=dateStr(d);const plan=getDayPlan(d.getDay());if(plan.type==='rest')return;if(state.completedDays?.[k])completedCount++;});
  const workDays=weekDates.filter(d=>getDayPlan(d.getDay()).type!=='rest').length;
  const rate=workDays>0?Math.round(completedCount/workDays*100):0;
  document.getElementById('weeklyRateBar').style.width=rate+'%';
  document.getElementById('weeklyRateLabel').textContent=`${completedCount} / ${workDays}일 완료 (${rate}%)`;
  const grid=document.getElementById('weeklyGrid');
  const tagMap={warm:'워밍업',cool:'쿨다운',cardio:'유산소',strength:'근력',core:'코어'};
  const typeLabel={rest:'휴식',strength:'근력',cardio:'유산소'};
  grid.innerHTML=weekDates.map((d,i)=>{
    const dayIdx=d.getDay();const plan=getDayPlan(dayIdx);
    const k=dateStr(d);const isToday=k===todayKey;const isDone=!!state.completedDays?.[k];
    const dotClass=isDone?'done':(isToday?'today':'');
    const exList=plan.exercises.length>0?plan.exercises.map(ex=>{
      const infoKey=ex.name.replace(/^\s+└\s*/,'');
      const hasDetail=!!EXERCISE_INFO[ex.name]||!!EXERCISE_INFO[infoKey];
      return`<div class="wday-exercise-mini"><span class="wday-ex-name">${ex.name}</span><div class="wday-ex-right"><span class="wday-ex-detail">${ex.detail}</span>${hasDetail?`<button class="btn-info-sm" data-name="${encodeURIComponent(ex.name)}">📋</button>`:''}</div></div>`;
    }).join(''):'<div class="wday-exercise-mini"><span>충분한 휴식을 취하세요 💤</span></div>';
    return`<div class="weekly-day-card"><div class="wday-header" data-card="${i}"><div class="wday-name-wrap"><div class="wday-dot ${dotClass}"></div><div><div class="wday-name">${DAYS[dayIdx]}요일 ${d.getMonth()+1}/${d.getDate()} ${isToday?'🔴':''}</div><div class="wday-sub">${plan.label||'—'}</div></div></div><div style="display:flex;align-items:center;gap:8px"><span class="wday-badge ${plan.type}">${typeLabel[plan.type]||''}</span><span class="wday-arrow">▼</span></div></div><div class="wday-body" id="wday-body-${i}">${plan.note?`<div class="plan-note-sm">📌 ${plan.note}</div>`:''} ${exList}</div></div>`;
  }).join('');
  grid.querySelectorAll('.wday-header').forEach(h=>{
    h.addEventListener('click',()=>{const idx=h.dataset.card;const body=document.getElementById(`wday-body-${idx}`);body.classList.toggle('open');h.querySelector('.wday-arrow').style.transform=body.classList.contains('open')?'rotate(180deg)':'';});
  });
  grid.querySelectorAll('.btn-info-sm').forEach(btn=>{
    btn.addEventListener('click',(e)=>{e.stopPropagation();openModal(decodeURIComponent(btn.dataset.name));});
  });
  document.getElementById('btnPrevWeek').onclick=()=>{state.currentWeekOffset=(state.currentWeekOffset||0)-1;renderWeekly();};
  document.getElementById('btnNextWeek').onclick=()=>{state.currentWeekOffset=(state.currentWeekOffset||0)+1;renderWeekly();};
}

function renderRecord(){
  const weights=state.weightLog||[];const currentW=weights.length>0?weights[weights.length-1].weight:null;
  document.getElementById('recCurrentWeight').innerHTML=currentW?`${currentW} <span>kg</span>`:`— <span>kg</span>`;
  const lost=currentW?+(112-currentW).toFixed(1):null;
  document.getElementById('recLost').innerHTML=lost!==null?`${lost} <span>kg</span>`:`— <span>kg</span>`;
  const remain=currentW?+(currentW-90).toFixed(1):null;
  document.getElementById('recRemain').innerHTML=remain!==null?`${remain} <span>kg</span>`:`— <span>kg</span>`;
  renderWeightChart();renderCalendar();
}

function renderWeightChart(){
  const canvas=document.getElementById('weightChart');const ctx=canvas.getContext('2d');
  const logs=(state.weightLog||[]).slice(-14);
  canvas.width=canvas.parentElement.clientWidth-32;canvas.height=180;
  ctx.clearRect(0,0,canvas.width,canvas.height);
  if(logs.length<2){ctx.fillStyle='#aaa';ctx.font='13px Noto Sans KR';ctx.textAlign='center';ctx.fillText('체중 기록이 2개 이상 필요합니다',canvas.width/2,90);return;}
  const weights=logs.map(l=>l.weight);const labels=logs.map(l=>l.date.slice(5));
  const min=Math.min(...weights,90)-2,max=Math.max(...weights,112)+2;
  const pad={top:20,right:20,bottom:36,left:40};
  const w=canvas.width-pad.left-pad.right,h=canvas.height-pad.top-pad.bottom;
  const xScale=i=>pad.left+(i/(logs.length-1))*w;const yScale=v=>pad.top+h-((v-min)/(max-min))*h;
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
  const wrap=document.getElementById('calendarWrap');const now=new Date(),todayKey=today();
  const year=now.getFullYear(),month=now.getMonth();
  const firstDay=new Date(year,month,1).getDay();const daysInMonth=new Date(year,month+1,0).getDate();
  let html=`<div class="cal-month"><div class="cal-month-title">${year}년 ${month+1}월</div><div class="cal-grid">`;
  ['일','월','화','수','목','금','토'].forEach(d=>{html+=`<div class="cal-day-label">${d}</div>`;});
  for(let i=0;i<firstDay;i++)html+='<div class="cal-day empty"></div>';
  for(let d=1;d<=daysInMonth;d++){const k=`${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;html+=`<div class="cal-day ${k===todayKey?'today':state.completedDays?.[k]?'done':''}">${d}</div>`;}
  html+='</div></div>';wrap.innerHTML=html;
}

function initSheets(){
  const input=document.getElementById('sheetsUrl');if(state.sheetsUrl)input.value=state.sheetsUrl;
  document.getElementById('btnSaveSheets').addEventListener('click',()=>{state.sheetsUrl=input.value.trim();saveState();showToast('시트 URL 저장 완료 ✅');});
  document.getElementById('btnExport').addEventListener('click',async()=>{
    const url=state.sheetsUrl||document.getElementById('sheetsUrl').value.trim();
    if(!url){showToast('구글 시트 URL을 먼저 입력해주세요');return;}
    const statusEl=document.getElementById('exportStatus');statusEl.textContent='전송 중...';
    const weights=state.weightLog||[];const currentW=weights.length>0?weights[weights.length-1].weight:112;
    const plan=getTodayPlan();const checked=state.checkedExercises?.[today()]||{};
    const done=Object.values(checked).filter(Boolean).length;
    const week=getCurrentWeek();const phaseInfo=getPhase(week);
    try{
      await fetch(url,{method:'POST',mode:'no-cors',headers:{'Content-Type':'application/json'},body:JSON.stringify({date:today(),weight:currentW,completedExercises:done,totalExercises:plan.exercises.length,routine:plan.label||'휴식',isCompleted:!!state.completedDays?.[today()],week,phase:phaseInfo.label})});
      statusEl.textContent='✅ 전송 완료!';showToast('구글 시트 전송 완료 📤');
    }catch(e){statusEl.textContent='⚠️ 전송 실패. URL 확인해주세요.';}
  });
}

function renderGuide(){
  const list=document.getElementById('guideList');
  list.innerHTML=GUIDES.map((g,i)=>`<div class="guide-card"><div class="guide-card-header" data-guide="${i}"><div class="guide-card-title"><span>${g.icon}</span>${g.title}</div><span class="wday-arrow">▼</span></div><div class="guide-card-body" id="guide-body-${i}">${g.content}</div></div>`).join('');
  list.querySelectorAll('.guide-card-header').forEach(h=>{h.addEventListener('click',()=>{const idx=h.dataset.guide;const body=document.getElementById(`guide-body-${idx}`);body.classList.toggle('open');h.querySelector('.wday-arrow').style.transform=body.classList.contains('open')?'rotate(180deg)':'';});});
}

function renderAll(){
  renderWeekBanner();renderToday();renderWeightHistory();updateOverallProgress();renderWeekly();
}

function init(){
  initTabs();initCompleteBtn();initWeightInput();renderGuide();initSheets();
  document.getElementById('modalClose').addEventListener('click',closeModal);
  document.getElementById('exModal').addEventListener('click',(e)=>{if(e.target===document.getElementById('exModal'))closeModal();});
  loadState();
}

document.addEventListener('DOMContentLoaded',init);
