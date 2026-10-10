/* ================================================
   홈트 플래너 v6 — 부위별 집중 · 기록 기반 자동 추천
   ================================================ */

// ===== Firebase 설정 (기존 그대로) =====
const firebaseConfig = {
  apiKey: "AIzaSyDzOPDH7zoEn17ycyevkf8YeTlzGDWOe1U",
  authDomain: "fitness-planner-9d1f3.firebaseapp.com",
  projectId: "fitness-planner-9d1f3",
  storageBucket: "fitness-planner-9d1f3.firebasestorage.app",
  messagingSenderId: "646096770845",
  appId: "1:646096770845:web:a2f5a32aa839362fd673f4"
};
let DOC_REF = null;
try {
  firebase.initializeApp(firebaseConfig);
  DOC_REF = firebase.firestore().collection('planner').doc('main');
} catch (e) { console.warn('Firebase 초기화 실패 — 로컬 모드', e); }

// ===== 부위(포커스) =====
const FOCUS = {
  legs:     { name:'하체',      emoji:'🦵', desc:'허벅지·무릎 주변 근력',     groups:['legs'],              target:1, color:'#2f80ed' },
  glute:    { name:'힙·뒷라인', emoji:'🍑', desc:'엉덩이·햄스트링',           groups:['legs','posterior'],  target:1, color:'#e67e22' },
  upper:    { name:'상체',      emoji:'💪', desc:'가슴·어깨·팔',              groups:['push'],              target:1, color:'#e94560' },
  back:     { name:'등·자세',   emoji:'🧍', desc:'등 라인·굽은 자세 교정',    groups:['pull','posterior'],  target:1, color:'#16a085' },
  core:     { name:'복부·코어', emoji:'🔥', desc:'뱃살·옆구리·코어 안정',     groups:['core'],              target:2, color:'#8e44ad' },
  full:     { name:'전신 칼로리', emoji:'⚡', desc:'심박 올려 칼로리 소모',   groups:['cardio'],            target:2, color:'#f39c12' },
  recovery: { name:'회복',      emoji:'🧘', desc:'저강도 유산소 + 스트레칭', groups:[],                    target:0, color:'#7f8c8d' },
};
const FOCUS_KEYS = ['legs','glute','upper','back','core','full'];
const EQ_LABEL = { body:'맨몸', box:'스텝박스', ball:'메디신볼', gymball:'짐볼', stair:'천국의 계단' };

// ===== 운동 데이터 =====
// X(id, 이름, 부위[], 장비, 레벨(1~5), 타겟[], 방법[], 팁, 주의, 유튜브 검색어, 옵션)
// 옵션: side(좌우), hi(점프·소음), kind('warm'|'cool'|'cardio')
const X = (id,n,f,eq,lv,t,how,tip,cau,yt,o={}) => ({id,n,f,eq,lv,t,how,tip,cau,yt,...o});
const EX = [
  // ---- 하체 ----
  X('squat','스쿼트',['legs','glute'],'body',1,['허벅지 앞','엉덩이'],['발은 어깨너비보다 살짝 넓게, 발끝은 약간 바깥으로','엉덩이를 뒤로 빼며 허벅지가 바닥과 평행할 때까지 앉아요','발 전체로 바닥을 밀며 일어나요'],'무릎은 발끝과 같은 방향으로!','무릎이 아프면 깊이를 줄이거나 박스 스쿼트로 바꿔요.','스쿼트 자세'),
  X('box_squat','박스 스쿼트',['legs','glute'],'box',1,['허벅지 앞','엉덩이'],['스텝박스를 뒤에 두고 서요','엉덩이가 박스에 살짝 닿을 때까지 앉아요','앉아서 쉬지 말고 바로 일어나요'],'앉는 깊이가 일정해서 무릎 부담이 적어요.','박스가 밀리지 않게 벽에 붙여두세요.','박스 스쿼트'),
  X('wall_sit','월싯',['legs'],'body',1,['허벅지 앞'],['벽에 등을 대고 서요','무릎이 90°가 될 때까지 내려가 버텨요'],'허벅지가 타는 느낌이 정상이에요.','무릎이 아프면 덜 굽혀서 버텨요.','월싯'),
  X('gb_wall_squat','짐볼 월 스쿼트',['legs'],'gymball',1,['허벅지 앞','엉덩이'],['짐볼을 벽과 허리 사이에 끼워요','공을 굴리듯 스쿼트로 내려갔다 올라와요'],'상체가 세워져서 무릎·허리에 안전해요.','발은 벽에서 반 걸음 앞에 두세요.','짐볼 월 스쿼트'),
  X('reverse_lunge','리버스 런지',['legs','glute'],'body',1,['허벅지','엉덩이'],['한 발을 뒤로 크게 빼며 양 무릎을 90°로','앞발 뒤꿈치로 밀어 돌아와요','좌우 번갈아'],'앞으로 내딛는 런지보다 무릎이 편해요.','균형이 어려우면 벽을 짚어요.','리버스 런지',{side:1}),
  X('box_stepup','스텝박스 스텝업',['legs','glute'],'box',1,['허벅지','엉덩이'],['박스에 한 발을 완전히 올려요','올린 다리 힘으로 올라섰다가 천천히 내려와요','구간 절반에서 발 바꾸기'],'뒷발로 차지 말고 앞다리로 올라가요.','박스 가장자리를 밟지 않게!','스텝박스 스텝업',{side:1}),
  X('calf_raise','카프 레이즈',['legs'],'box',1,['종아리'],['박스 끝에 발 앞꿈치로 서요','뒤꿈치를 최대한 올렸다 천천히 내려요'],'벽을 짚고 해도 괜찮아요.','미끄러지지 않게 양말은 벗고!','카프레이즈'),
  X('goblet_squat','고블릿 스쿼트',['legs','glute'],'ball',2,['허벅지','엉덩이','코어'],['메디신볼을 가슴 앞에 안아요','상체를 세운 채 깊게 앉았다 일어나요'],'볼 무게가 균형을 잡아줘서 더 깊이 앉아져요.','허리가 말리지 않는 깊이까지만.','고블릿 스쿼트'),
  X('split_squat','스플릿 스쿼트',['legs','glute'],'body',2,['허벅지','엉덩이'],['다리를 앞뒤로 벌리고 서요','제자리에서 수직으로 내려갔다 올라와요','구간 절반에서 다리 바꾸기'],'런지보다 균형 잡기 쉬워요.','앞 무릎이 안쪽으로 무너지지 않게.','스플릿 스쿼트',{side:1}),
  X('side_lunge','사이드 런지',['legs'],'ball',2,['허벅지 안쪽','엉덩이'],['볼을 가슴 앞에 들어요','옆으로 크게 내딛으며 한쪽 무릎을 굽혀요','반대 다리는 쭉 펴요'],'허벅지 안쪽까지 자극돼요.','무릎이 아프면 보폭을 줄여요.','사이드 런지',{side:1}),
  X('bulgarian','불가리안 스플릿 스쿼트',['legs','glute'],'box',3,['허벅지','엉덩이'],['뒷발 등을 박스에 올려요','앞다리로 내려갔다 올라와요','구간 절반에서 다리 바꾸기'],'맨몸 하체 운동 중 최강 자극!','박스는 무릎보다 낮은 높이로.','불가리안 스플릿 스쿼트',{side:1}),
  X('squat_pulse','스쿼트 펄스',['legs'],'body',3,['허벅지 앞'],['스쿼트 바닥 자세로 내려가요','10cm 범위로 쉬지 않고 오르내려요'],'계속 긴장이 걸려서 근지구력이 올라가요.','무릎 통증 시 일반 스쿼트로.','스쿼트 펄스'),
  X('jump_squat','점프 스쿼트',['legs','full'],'body',4,['허벅지','엉덩이','심폐'],['스쿼트로 내려갔다 올라오는 힘으로 점프','착지는 무릎을 굽히며 부드럽게'],'착지를 조용히 할수록 잘하는 거예요.','무릎·층간소음 걱정되면 스쿼트로 대체.','점프 스쿼트',{hi:1}),
  // ---- 힙·뒷라인 ----
  X('glute_bridge','힙 브릿지',['glute'],'body',1,['엉덩이','햄스트링'],['누워서 무릎을 세워요','엉덩이를 조이며 골반을 들어 어깨~무릎 일직선','위에서 1초 버티고 내려요'],'올라가서 엉덩이를 꽉 쥐어짜는 느낌!','허리를 과하게 꺾지 않게.','힙 브릿지'),
  X('sumo_squat','와이드 스쿼트',['glute','legs'],'body',1,['엉덩이','허벅지 안쪽'],['발을 넓게 벌리고 발끝은 바깥으로','상체를 세운 채 수직으로 앉았다 일어나요'],'볼을 들고 하면 강도가 올라가요.','무릎이 발끝보다 안쪽으로 모이지 않게.','와이드 스쿼트'),
  X('donkey_kick','동키킥',['glute'],'body',1,['엉덩이'],['네발 자세에서 무릎 90° 유지','발바닥으로 천장을 찍듯 다리를 올려요','구간 절반에서 다리 바꾸기'],'허리가 아니라 엉덩이로 올려요.','허리가 꺾이면 높이를 낮춰요.','동키킥',{side:1}),
  X('fire_hydrant','파이어 하이드런트',['glute'],'body',1,['엉덩이 옆'],['네발 자세에서','무릎을 굽힌 채 다리를 옆으로 들어올려요','구간 절반에서 다리 바꾸기'],'골반 옆 라인을 정리해줘요.','몸통이 같이 기울지 않게.','파이어 하이드런트',{side:1}),
  X('good_morning','굿모닝',['glute','back'],'body',1,['햄스트링','엉덩이','허리'],['손을 머리 뒤에, 무릎은 살짝 굽혀요','등을 편 채 엉덩이를 뒤로 밀며 상체를 숙여요','엉덩이를 조이며 일어나요'],'허벅지 뒤가 당기면 정답!','허리가 둥글게 말리면 덜 숙여요.','굿모닝 운동'),
  X('box_hip_thrust','박스 힙 쓰러스트',['glute'],'box',2,['엉덩이'],['날개뼈를 박스에 기대고 앉아요','엉덩이를 들어 몸통이 수평이 되게','위에서 1초 쥐어짜고 내려요'],'힙 브릿지보다 가동 범위가 커요.','박스가 밀리지 않게 벽에 붙여요.','힙 쓰러스트 홈트'),
  X('gb_bridge','짐볼 브릿지',['glute','core'],'gymball',2,['엉덩이','햄스트링','코어'],['누워서 종아리를 짐볼 위에 올려요','엉덩이를 들어 몸을 일직선으로'],'공이 흔들려서 코어까지 같이 써요.','팔을 바닥에 넓게 짚어 균형 잡기.','짐볼 브릿지'),
  X('rdl','루마니안 데드리프트',['glute','back'],'ball',2,['햄스트링','엉덩이','척추기립근'],['볼을 허벅지 앞에 들어요','등을 편 채 엉덩이를 뒤로 밀며 숙여요','볼이 정강이 중간쯤 오면 엉덩이 조이며 일어나요'],'허리가 아니라 허벅지 뒤가 당겨야 해요.','허리를 둥글게 말면 부상 위험.','루마니안 데드리프트 홈트'),
  X('bridge_march','브릿지 마치',['glute','core'],'body',2,['엉덩이','코어'],['힙 브릿지 자세로 올라가요','골반 높이를 유지하며 한 발씩 번갈아 들어요'],'골반이 기울지 않게 버티는 게 핵심.','허리가 처지면 양발 브릿지로.','브릿지 마치'),
  X('single_bridge','싱글레그 브릿지',['glute'],'body',3,['엉덩이','햄스트링'],['한 다리를 펴서 든 채','한 발로 바닥을 밀어 골반을 올려요','구간 절반에서 다리 바꾸기'],'일반 브릿지보다 자극이 2배.','골반이 한쪽으로 기울지 않게.','싱글레그 힙 브릿지',{side:1}),
  X('gb_hamcurl','짐볼 햄스트링 컬',['glute'],'gymball',3,['햄스트링','엉덩이'],['짐볼 브릿지 자세에서','발뒤꿈치로 공을 엉덩이 쪽으로 당겼다 밀어요'],'허벅지 뒤 근육이 확실히 타요.','엉덩이가 처지지 않게 유지.','짐볼 햄스트링 컬'),
  // ---- 상체 ----
  X('incline_pushup','인클라인 푸시업',['upper'],'box',1,['가슴','삼두','어깨'],['스텝박스(또는 소파)에 손을 짚어요','몸을 일직선으로 유지하며 가슴을 내렸다 밀어요'],'짚는 곳이 높을수록 쉬워요.','박스가 밀리지 않게 벽에 붙여요.','인클라인 푸시업'),
  X('knee_pushup','무릎 푸시업',['upper'],'body',1,['가슴','삼두'],['무릎을 바닥에 대고 푸시업 자세','머리~무릎 일직선으로 내려갔다 밀어요'],'엉덩이가 뒤로 빠지지 않게!','손목이 아프면 주먹 쥐고.','무릎 푸시업'),
  X('ball_press','볼 오버헤드 프레스',['upper'],'ball',1,['어깨','삼두'],['볼을 가슴 앞에 들어요','머리 위로 쭉 밀어 올렸다 내려요'],'갈비뼈가 들리지 않게 배에 힘!','어깨가 아프면 범위를 줄여요.','메디신볼 오버헤드 프레스'),
  X('ball_squeeze','볼 체스트 스퀴즈',['upper'],'ball',1,['가슴 안쪽','팔'],['볼을 양손으로 세게 눌러 잡아요','누르는 힘을 유지한 채 가슴 앞으로 밀었다 당겨요'],'계속 누르고 있어야 가슴에 들어와요.','어깨를 으쓱하지 않게.','메디신볼 체스트 프레스'),
  X('box_dip','박스 딥스',['upper'],'box',2,['삼두','어깨 앞'],['박스 끝에 손을 짚고 엉덩이를 앞으로 빼요','팔꿈치를 뒤로 굽혀 내려갔다 밀어 올려요'],'다리를 가까이 둘수록 쉬워요.','어깨 앞이 아프면 깊이를 줄여요.','트라이셉스 딥스 홈트'),
  X('shoulder_tap','플랭크 숄더 탭',['upper','core'],'body',2,['어깨','코어'],['팔을 편 플랭크 자세','한 손씩 반대쪽 어깨를 터치해요'],'골반이 흔들리지 않게 천천히!','흔들리면 발 간격을 넓혀요.','플랭크 숄더 탭'),
  X('pushup','푸시업',['upper'],'body',3,['가슴','삼두','어깨'],['손은 어깨보다 살짝 넓게','팔꿈치 45°로 굽혀 가슴을 내렸다 밀어요'],'안 되면 중간에 무릎 푸시업으로 바꿔도 OK.','허리가 처지면 배에 힘을 더 줘요.','푸시업 자세'),
  X('pike_pushup','파이크 푸시업',['upper'],'body',3,['어깨','삼두'],['엉덩이를 높이 들어 ∧자 자세','머리가 바닥을 향하게 팔을 굽혔다 밀어요'],'엉덩이가 내려가면 가슴 운동이 돼요.','어깨 통증 시 즉시 중단.','파이크 푸시업'),
  X('plank_updown','플랭크 업다운',['upper','core'],'body',3,['삼두','어깨','코어'],['팔꿈치 플랭크에서 시작','한 손씩 짚어 팔 편 플랭크로 올라갔다 내려와요'],'골반이 좌우로 흔들리지 않게.','손목이 아프면 숄더 탭으로.','플랭크 업다운'),
  X('diamond_pushup','다이아몬드 푸시업',['upper'],'body',4,['삼두','가슴 안쪽'],['손을 모아 다이아몬드 모양','팔꿈치를 몸에 붙이고 내려갔다 밀어요'],'삼두 자극이 가장 강한 푸시업.','손목이 아프면 일반 푸시업으로.','다이아몬드 푸시업'),
  // ---- 등·자세 ----
  X('superman','슈퍼맨',['back'],'body',1,['척추기립근','엉덩이'],['엎드려 팔다리를 쭉 펴요','팔과 다리를 동시에 들어 1~2초 버티고 내려요'],'시선은 바닥, 목은 길게.','허리가 찌릿하면 높이를 낮춰요.','슈퍼맨 운동'),
  X('ytw','Y-T-W 레이즈',['back'],'body',1,['등 상부','날개뼈'],['엎드려 팔을 Y자로 들었다 내리고','T자, W자 순서로 바꿔가며 반복'],'굽은 등·라운드숄더 교정에 좋아요.','어깨를 귀 쪽으로 올리지 않게.','YTW 운동'),
  X('bird_dog','버드독',['back','core'],'body',1,['척추기립근','코어','엉덩이'],['네발 자세에서','반대쪽 팔과 다리를 쭉 뻗어 1초 버티고','좌우 번갈아'],'등 위에 물컵이 있다고 생각하고 천천히.','골반이 돌아가지 않게.','버드독'),
  X('ball_row','볼 벤트오버 로우',['back'],'ball',1,['등','날개뼈'],['상체를 45° 숙이고 볼을 양손으로 들어요','볼을 배꼽 쪽으로 당기며 날개뼈를 모아요'],'볼이 가벼우니 날개뼈 조이는 데 집중.','허리를 둥글게 말지 않게.','벤트오버 로우 홈트'),
  X('reverse_snow','리버스 스노우엔젤',['back'],'body',2,['등 상부','어깨 뒤'],['엎드려 가슴을 살짝 들어요','팔을 바닥에 닿지 않게 엉덩이→머리 위로 크게 원을 그려요'],'느리게 할수록 등이 타요.','목은 중립으로.','리버스 스노우엔젤'),
  X('swimmer','스위머',['back'],'body',2,['척추기립근','등','엉덩이'],['엎드려 팔다리를 살짝 들어요','수영하듯 반대 팔다리를 번갈아 빠르게 차요'],'몸통은 고정, 팔다리만 움직여요.','허리가 아프면 슈퍼맨으로.','스위머 운동'),
  X('prone_pulldown','프론 랫풀다운',['back'],'body',2,['광배근','날개뼈'],['엎드려 팔을 앞으로 뻗고 상체를 살짝 들어요','팔꿈치를 옆구리로 당기며 날개뼈를 조였다 뻗어요'],'기구 없이 광배근을 쓰는 동작.','목을 젖히지 않게.','엎드려 랫풀다운'),
  X('gb_backext','짐볼 백 익스텐션',['back','glute'],'gymball',2,['척추기립근','엉덩이'],['짐볼에 배를 대고 엎드려 발끝을 벽에 대요','상체를 일직선까지 들어올렸다 내려요'],'공이 허리를 받쳐줘서 범위가 커요.','허리를 과하게 젖히지 않게.','짐볼 백익스텐션'),
  // ---- 복부·코어 ----
  X('dead_bug','데드버그',['core'],'body',1,['복부 깊은 근육'],['누워서 팔은 천장, 무릎은 90°로 들어요','허리를 바닥에 붙인 채 반대 팔다리를 뻗었다 돌아와요'],'허리가 뜨지 않는 범위까지만.','목에 힘 빼고.','데드버그'),
  X('plank','플랭크',['core'],'body',1,['복부','어깨','엉덩이'],['팔꿈치를 어깨 아래에 대요','머리~발 일직선, 배꼽을 등 쪽으로 당겨요'],'엉덩이가 들리거나 처지면 효과 없어요.','힘들면 무릎 대고 플랭크.','플랭크 자세'),
  X('crunch','크런치',['core'],'body',1,['윗배'],['무릎 세우고 누워요','갈비뼈를 골반 쪽으로 말아 올렸다 내려요'],'목이 아니라 배로 말아요.','손으로 머리를 당기지 않게.','크런치'),
  X('heel_touch','힐 터치',['core'],'body',1,['옆구리'],['무릎 세우고 누워 어깨를 살짝 들어요','좌우로 손끝을 뒤꿈치에 번갈아 터치'],'옆구리가 접히는 느낌!','목에 힘 빼고.','힐터치 운동'),
  X('gb_crunch','짐볼 크런치',['core'],'gymball',1,['윗배'],['짐볼에 허리를 대고 앉아요','공 위에서 상체를 말아 올렸다 내려요'],'바닥보다 범위가 커서 자극이 좋아요.','발을 넓게 벌려 균형 잡기.','짐볼 크런치'),
  X('reverse_crunch','리버스 크런치',['core'],'body',2,['아랫배'],['누워서 무릎을 90°로 들어요','골반을 말아 무릎을 가슴 쪽으로 당겼다 천천히 내려요'],'다리 반동이 아니라 골반을 말아요.','허리가 뜨면 범위를 줄여요.','리버스 크런치'),
  X('side_plank','사이드 플랭크',['core'],'body',2,['옆구리','엉덩이 옆'],['옆으로 누워 팔꿈치를 어깨 아래에','엉덩이를 들어 일직선 유지','구간 절반에서 방향 바꾸기'],'힘들면 아래 무릎을 대고.','엉덩이가 처지지 않게.','사이드 플랭크',{side:1}),
  X('russian_twist','러시안 트위스트',['core'],'ball',2,['옆구리','복부'],['앉아서 상체를 살짝 뒤로 기울여요','볼을 좌우로 옮기며 몸통을 비틀어요'],'팔만 말고 가슴이 같이 돌아야 해요.','허리가 아프면 발을 바닥에 대고.','러시안 트위스트'),
  X('woodchop','볼 우드찹',['core','full'],'ball',2,['옆구리','어깨','하체'],['볼을 한쪽 어깨 위로 들어요','반대쪽 무릎 아래로 대각선으로 내려찍어요','구간 절반에서 방향 바꾸기'],'다리부터 몸통까지 회전을 연결해요.','허리만 비틀지 말고 발도 같이 돌려요.','메디신볼 우드찹',{side:1}),
  X('slow_climber','슬로우 마운틴 클라이머',['core','full'],'body',2,['복부','어깨','심폐'],['팔 편 플랭크 자세','한 무릎씩 천천히 가슴 쪽으로 당겨요'],'느리게 하면 복부, 빠르게 하면 유산소.','엉덩이가 들리지 않게.','슬로우 마운틴 클라이머'),
  X('gb_pass','짐볼 패스',['core'],'gymball',3,['복부 전체'],['누워서 짐볼을 손에 들어요','공을 다리 사이로 넘기고, 다시 손으로 받아요'],'허리를 바닥에 붙인 채로.','처음엔 범위를 작게.','짐볼 패스'),
  X('gb_rollout','짐볼 롤아웃',['core'],'gymball',3,['복부','어깨'],['무릎 꿇고 팔뚝을 짐볼 위에','공을 앞으로 굴려 몸을 늘렸다 돌아와요'],'허리가 꺾이기 직전까지만.','허리 통증 시 플랭크로.','짐볼 롤아웃'),
  // ---- 전신 칼로리 ----
  X('step_jack','스텝 잭',['full'],'body',1,['전신','심폐'],['점프 대신 한 발씩 옆으로 벌리며','팔을 머리 위로 올렸다 내려요'],'점핑잭의 무소음 버전이에요.','없음.','저충격 점핑잭'),
  X('march','하이니 마치',['full'],'body',1,['심폐','복부'],['제자리에서 무릎을 골반 높이까지 들며 걸어요','팔을 크게 흔들어요'],'빠르게 할수록 심박이 올라가요.','없음.','하이니 마치'),
  X('box_toe_tap','스텝박스 토탭',['full','legs'],'box',1,['심폐','종아리'],['박스 앞에 서요','발끝으로 박스 위를 좌우 번갈아 빠르게 터치'],'짧은 시간에 심박이 확 올라가요.','박스 모서리에 걸려 넘어지지 않게.','스텝박스 토탭'),
  X('shadow_box','섀도 복싱',['full','upper'],'body',1,['어깨','심폐'],['가볍게 무릎을 굽히고 서요','잽·스트레이트를 쉬지 않고 빠르게'],'주먹을 뻗을 때 몸통도 같이 회전!','팔꿈치를 끝까지 튕기지 않게.','섀도복싱 홈트'),
  X('box_step_fast','스텝박스 빠른 스텝업',['full'],'box',2,['하체','심폐'],['오른발→왼발로 올라가고 내려오기','최대한 빠른 리듬으로 반복'],'팔을 흔들면 속도가 올라가요.','지치면 발 위치 꼭 확인!','스텝박스 유산소'),
  X('thruster','볼 쓰러스터',['full','legs'],'ball',2,['하체','어깨','심폐'],['볼을 가슴 앞에 들고 스쿼트','일어나는 힘으로 볼을 머리 위로 밀어 올려요'],'전신을 한 번에 써서 칼로리 소모가 커요.','허리가 꺾이지 않게.','메디신볼 쓰러스터'),
  X('step_burpee','스텝 버피',['full'],'body',2,['전신','심폐'],['손을 바닥에 짚고 한 발씩 뒤로 빼 플랭크','한 발씩 다시 당겨 일어나요'],'점프 없이도 심박이 충분히 올라가요.','손목이 아프면 박스를 짚고.','점프 없는 버피'),
  X('skater_step','스케이터 스텝',['full','glute'],'body',2,['엉덩이 옆','심폐'],['옆으로 크게 한 걸음 내딛으며','반대 다리를 뒤로 교차해요','좌우 번갈아'],'점프 없이 스케이트 타듯 리듬감 있게.','무릎이 안쪽으로 모이지 않게.','저충격 스케이터'),
  X('mountain_climber','마운틴 클라이머',['full','core'],'body',3,['복부','어깨','심폐'],['팔 편 플랭크 자세','달리듯 무릎을 번갈아 빠르게 당겨요'],'엉덩이 높이를 고정!','손목이 약하면 주먹 쥐고.','마운틴 클라이머'),
  X('jumping_jack','점핑잭',['full'],'body',3,['전신','심폐'],['점프하며 발을 벌리고 팔을 머리 위로','다시 모으기 반복'],'발앞꿈치로 가볍게 착지.','층간소음이 걱정되면 스텝 잭으로.','점핑잭',{hi:1}),
  X('wallball','월볼 샷',['full','legs'],'ball',3,['하체','어깨','심폐'],['볼을 가슴 앞에 들고 스쿼트','일어나며 볼을 벽 높은 곳으로 던지고 받아요'],'받자마자 바로 다음 스쿼트로.','벽·볼 소음 주의.','월볼샷',{hi:1}),
  X('burpee','버피',['full'],'body',4,['전신','심폐'],['손 짚고 점프해서 플랭크','발 당기고 점프하며 일어나요'],'자세가 속도보다 중요해요.','어지러우면 즉시 중단.','버피 자세',{hi:1}),
  // ---- 워밍업 ----
  X('w_march','제자리 걷기',['all'],'body',1,['전신 혈류'],['팔을 크게 흔들며 제자리에서 걸어요'],'체온을 서서히 올리는 게 목적.','없음.','제자리 걷기',{kind:'warm'}),
  X('w_arm','암 서클',['upper','back','core','full'],'body',1,['어깨'],['팔을 옆으로 뻗어 앞으로 10회, 뒤로 10회 크게 돌려요'],'점점 원을 크게.','어깨가 걸리면 작게.','암서클',{kind:'warm'}),
  X('w_hip','힙 서클',['legs','glute','core','full'],'body',1,['고관절','허리'],['손을 허리에 대고 골반을 크게 원 그리듯 돌려요'],'반대 방향도 똑같이.','없음.','힙서클',{kind:'warm'}),
  X('w_halfsquat','하프 스쿼트',['legs','glute','full'],'body',1,['하체'],['절반 깊이로 가볍게 스쿼트'],'관절에 윤활유 넣는 느낌으로.','없음.','하프 스쿼트',{kind:'warm'}),
  X('w_legswing','레그 스윙',['legs','glute'],'body',1,['고관절','햄스트링'],['벽을 짚고 한 다리를 앞뒤로 크게 흔들어요','절반에서 다리 바꾸기'],'반동은 가볍게.','없음.','레그 스윙',{kind:'warm'}),
  X('w_catcow','캣카우',['back','core','glute'],'body',1,['척추'],['네발 자세에서 등을 둥글게 말았다가','배를 내리며 가슴을 열어요'],'호흡에 맞춰 천천히.','없음.','캣카우',{kind:'warm'}),
  X('w_torso','토르소 트위스트',['core','back','upper','full'],'body',1,['몸통 회전'],['팔을 가슴 앞에 모으고 상체를 좌우로 비틀어요'],'허리가 아니라 등이 돌아가는 느낌.','없음.','토르소 트위스트',{kind:'warm'}),
  X('w_wallpush','벽 견갑 푸시업',['upper','back'],'body',1,['날개뼈'],['벽을 짚고 팔을 편 채','날개뼈만 모았다 벌려요'],'팔꿈치는 굽히지 않아요.','없음.','견갑 푸시업',{kind:'warm'}),
  // ---- 쿨다운 ----
  X('c_quad','허벅지 앞 스트레칭',['legs','full','recovery'],'body',1,['허벅지 앞'],['벽을 짚고 한 발목을 잡아 엉덩이 쪽으로 당겨요','좌우 나눠서'],'무릎을 모으고 골반을 앞으로.','없음.','대퇴사두 스트레칭',{kind:'cool'}),
  X('c_ham','햄스트링 스트레칭',['legs','glute','full','recovery'],'body',1,['허벅지 뒤'],['한 다리를 앞으로 뻗고 발끝을 세워요','등을 편 채 상체를 숙여요'],'등을 말지 말고 골반부터 숙여요.','없음.','햄스트링 스트레칭',{kind:'cool'}),
  X('c_fig4','누워서 4자 스트레칭',['glute','legs','recovery'],'body',1,['엉덩이'],['누워서 한 발목을 반대 무릎 위에 올려요','아래 다리를 가슴 쪽으로 당겨요','좌우 나눠서'],'엉덩이 깊은 곳이 시원해요.','없음.','4자 스트레칭',{kind:'cool'}),
  X('c_hipflex','고관절 앞 스트레칭',['legs','glute','core','recovery'],'body',1,['고관절 앞'],['한쪽 무릎을 꿇은 런지 자세','골반을 앞으로 밀어요','좌우 나눠서'],'오래 앉아 있는 사람에게 필수.','무릎 아래 수건 깔기.','고관절 스트레칭',{kind:'cool'}),
  X('c_chest','벽 가슴 스트레칭',['upper','back','recovery'],'body',1,['가슴','어깨 앞'],['팔을 벽에 대고 몸을 반대쪽으로 돌려요','좌우 나눠서'],'라운드숄더 교정에 좋아요.','없음.','가슴 스트레칭',{kind:'cool'}),
  X('c_tricep','삼두·어깨 스트레칭',['upper'],'body',1,['삼두','어깨'],['한 팔을 머리 뒤로 굽혀 반대 손으로 팔꿈치를 당겨요','좌우 나눠서'],'숨을 내쉬며 조금씩 더.','없음.','삼두 스트레칭',{kind:'cool'}),
  X('c_child','차일드 포즈',['back','core','upper','full','recovery'],'body',1,['등','허리'],['무릎 꿇고 엉덩이를 뒤꿈치로','팔을 앞으로 길게 뻗어 엎드려요'],'숨을 등으로 쉬는 느낌.','없음.','차일드 포즈',{kind:'cool'}),
  X('c_cobra','코브라 스트레칭',['core','back','recovery'],'body',1,['복부','허리'],['엎드려 손을 가슴 옆에','팔을 펴며 상체를 들어 배를 늘려요'],'허리가 불편하면 팔꿈치로 받쳐요.','없음.','코브라 스트레칭',{kind:'cool'}),
  X('c_gbback','짐볼 등 펴기',['back','core','upper','recovery'],'gymball',1,['등','가슴','복부'],['짐볼에 등을 대고 누워','팔을 머리 위로 뻗어 몸을 활처럼 늘려요'],'굽은 등이 시원하게 펴져요.','발을 넓게 벌려 균형 잡기.','짐볼 스트레칭',{kind:'cool'}),
  X('c_side','옆구리 스트레칭',['core','full','recovery'],'body',1,['옆구리'],['한 팔을 머리 위로 뻗어 반대쪽으로 기울여요','좌우 나눠서'],'골반은 고정.','없음.','옆구리 스트레칭',{kind:'cool'}),
  X('c_calf','종아리 스트레칭',['legs','full','recovery'],'box',1,['종아리'],['박스 끝에 발 앞꿈치를 걸고 뒤꿈치를 내려요','좌우 나눠서'],'천국의 계단 후에 꼭!','없음.','종아리 스트레칭',{kind:'cool'}),
  // ---- 유산소 ----
  X('stair','천국의 계단 (스텝밀)',['full'],'stair',1,['심폐','하체'],['손잡이는 가볍게만 잡고 상체를 세워요','발 전체로 계단을 밟아요'],'손잡이에 매달리면 운동 효과가 확 줄어요.','어지러우면 바로 속도를 낮춰요.','천국의 계단 운동법',{kind:'cardio'}),
];
const EX_MAP = Object.fromEntries(EX.map(e => [e.id, e]));

// ===== 레벨별 운동/휴식 시간 =====
const WR = [null, [30,30], [35,25], [40,20], [45,15], [50,10]];
const LV_LABEL = ['', '입문', '초급', '중급', '중상급', '상급'];

// ===== 유틸 =====
const DAYS = ['일','월','화','수','목','금','토'];
const pad2 = n => String(n).padStart(2,'0');
function dateStr(d){ return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`; }
function today(){ return dateStr(new Date()); }
function parseDate(k){ const [y,m,d] = k.split('-').map(Number); return new Date(y, m-1, d); }
function daysBetween(a, b){ return Math.round((parseDate(b) - parseDate(a)) / 864e5); }
function addDays(k, n){ const d = parseDate(k); d.setDate(d.getDate()+n); return dateStr(d); }
function getMonday(k){ const d = parseDate(k); const day = d.getDay(); d.setDate(d.getDate() - (day === 0 ? 6 : day-1)); return dateStr(d); }
const avg = a => a.reduce((s,x)=>s+x,0) / a.length;
function fmtDate(k){ const d = parseDate(k); return `${d.getMonth()+1}/${d.getDate()}(${DAYS[d.getDay()]})`; }
function fmtSec(s){ return s >= 60 ? `${Math.floor(s/60)}분${s%60 ? ' '+(s%60)+'초' : ''}` : `${s}초`; }
function showToast(msg){ const t = document.getElementById('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(t._h); t._h = setTimeout(()=>t.classList.remove('show'), 2400); }
const $ = id => document.getElementById(id);

function hashStr(s){ let h = 1779033703 ^ s.length; for (let i=0;i<s.length;i++){ h = Math.imul(h ^ s.charCodeAt(i), 3432918353); h = h<<13 | h>>>19; } return h>>>0; }
function makeRng(seed){ let a = hashStr(String(seed)); return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a>>>15, 1 | a); t = t + Math.imul(t ^ t>>>7, 61 | t) ^ t; return ((t ^ t>>>14) >>> 0) / 4294967296; }; }
function weightedPick(items, weights, rng){
  const total = weights.reduce((s,w)=>s+w,0); let r = rng()*total;
  for (let i=0;i<items.length;i++){ r -= weights[i]; if (r <= 0) return i; }
  return items.length-1;
}

// ===== STATE =====
const DEFAULT_STATE = () => ({
  weightLog: [], completedDays: {}, checkedExercises: {}, sheetsUrl: '',
  sessions: [],
  levels: { legs:2, glute:2, upper:2, back:2, core:2, full:2 },
  okStreak: {},
  profile: { height:182, start:112, goal:90, allowJump:false },
  prefs: { minutes:30 },
});
let state = DEFAULT_STATE();
function normalizeState(){
  const d = DEFAULT_STATE();
  Object.keys(d).forEach(k => { if (state[k] == null) state[k] = d[k]; });
  state.levels  = { ...d.levels,  ...state.levels };
  state.profile = { ...d.profile, ...state.profile };
  state.prefs   = { ...d.prefs,   ...state.prefs };
  if (!Array.isArray(state.sessions)) state.sessions = [];
  if (!Array.isArray(state.weightLog)) state.weightLog = [];
}

const ui = { focus:null, minutes:30, shuffle:0, workout:null, rec:null, dictFilter:'all' };
let syncTimeout = null;

// ===== Firestore 동기화 =====
const LS_KEY = 'fitnessPlannerState_v6';
function saveLocal(){ try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch(e){} }
async function saveToCloud(){
  if (!DOC_REF) return;
  try { await DOC_REF.set(state); showSyncStatus('✅ 저장됨'); }
  catch(e){ showSyncStatus('📵 오프라인 — 로컬 저장'); }
}
function saveState(){ saveLocal(); clearTimeout(syncTimeout); syncTimeout = setTimeout(saveToCloud, 1000); }
async function loadState(){
  try {
    const raw = localStorage.getItem(LS_KEY) || localStorage.getItem('fitnessPlannerState_v5');
    if (raw) Object.assign(state, JSON.parse(raw));
  } catch(e){}
  normalizeState(); ui.minutes = state.prefs.minutes;
  renderAll();
  if (!DOC_REF) { showSyncStatus('📵 오프라인 모드'); return; }
  try {
    showSyncStatus('🔄 동기화 중...');
    const snap = await DOC_REF.get();
    if (snap.exists) { Object.assign(state, snap.data()); normalizeState(); saveLocal(); showSyncStatus('✅ 동기화 완료'); }
    else { await DOC_REF.set(state); showSyncStatus('✅ 새 데이터 생성'); }
  } catch(e){ showSyncStatus('📵 오프라인 모드'); }
  ui.minutes = state.prefs.minutes;
  renderAll();
}
function showSyncStatus(msg){
  const el = $('syncStatus'); if (!el) return; el.textContent = msg;
  if (msg.includes('✅')) setTimeout(()=>{ if (el.textContent === msg) el.textContent = ''; }, 3000);
}

// ===== 체중 분석 =====
function dedupWeights(){
  const m = {}; (state.weightLog||[]).forEach(w => { m[w.date] = w.weight; });
  return Object.keys(m).sort().map(d => ({ date:d, weight:m[d] }));
}
function currentWeight(){ const l = dedupWeights(); return l.length ? l[l.length-1].weight : state.profile.start; }
function weightTrend(){
  const logs = dedupWeights(), tk = today();
  const inRange = (lo, hi) => logs.filter(l => { const d = daysBetween(l.date, tk); return d >= lo && d < hi; });
  const recent = inRange(0,7), prev = inRange(7,14);
  let plateau = false;
  if (recent.length >= 2 && prev.length >= 2) plateau = (avg(prev.map(x=>x.weight)) - avg(recent.map(x=>x.weight))) < 0.2;
  const win = inRange(0,21);
  let slope = null, eta = null;
  if (win.length >= 4 && daysBetween(win[0].date, win[win.length-1].date) >= 10) {
    const xs = win.map(l => daysBetween(win[0].date, l.date)), ys = win.map(l => l.weight);
    const mx = avg(xs), my = avg(ys); let num = 0, den = 0;
    xs.forEach((x,i) => { num += (x-mx)*(ys[i]-my); den += (x-mx)**2; });
    slope = den ? num/den : 0;
    const cur = my + slope*(xs[xs.length-1]-mx);
    if (slope < -0.01 && cur > state.profile.goal) eta = addDays(tk, Math.ceil((cur - state.profile.goal) / (-slope)));
  }
  return { plateau, slope, eta, logs };
}

// ===== 추천 엔진 =====
function sortedSessions(){ return [...state.sessions].sort((a,b) => (a.date + (a.t||0)) < (b.date + (b.t||0)) ? -1 : 1); }
function lastSessionOf(focus){ const s = sortedSessions().filter(x => x.focus === focus); return s[s.length-1] || null; }

function recommend(){
  const tk = today(), ss = sortedSessions(), reasons = [];
  const before = ss.filter(s => s.date < tk);
  const lastBefore = before.length ? before[before.length-1].date : null;
  const gap = lastBefore ? daysBetween(lastBefore, tk) : null;
  const trainDays = new Set(ss.filter(s => s.focus !== 'recovery').map(s => s.date));
  let streak = 0; for (let i=1;i<=7;i++){ if (trainDays.has(addDays(tk,-i))) streak++; else break; }
  const { plateau } = weightTrend();
  const todayDone = ss.filter(s => s.date === tk);

  if (streak >= 3 && !todayDone.length) {
    reasons.push(`${streak}일 연속으로 운동했어요. 오늘은 근육이 회복하는 날로 추천해요`);
    reasons.push('더 하고 싶다면 아래에서 부위를 직접 고를 수 있어요');
    return { focus:'recovery', reasons, comeback:false, plateau, gap };
  }

  const lastOf = {}; ss.forEach(s => { lastOf[s.focus] = s.date; });
  const groupsOn = date => new Set(ss.filter(s => s.date === date).flatMap(s => (FOCUS[s.focus]||{}).groups || []));
  const gT = groupsOn(tk), gY = groupsOn(addDays(tk,-1)), gY2 = groupsOn(addDays(tk,-2));
  const weekCount = {}; ss.filter(s => daysBetween(s.date, tk) < 7).forEach(s => { weekCount[s.focus] = (weekCount[s.focus]||0) + 1; });
  const rng = makeRng(tk + '|rec');
  let best = null, bestScore = -Infinity;
  FOCUS_KEYS.forEach(f => {
    const ds = lastOf[f] ? Math.min(8, daysBetween(lastOf[f], tk)) : 8;
    let s = ds * 10; const g = FOCUS[f].groups;
    if (g.some(x => gT.has(x))) s -= 60;
    if (g.some(x => gY.has(x))) s -= 30; else if (g.some(x => gY2.has(x))) s -= 8;
    if ((weekCount[f]||0) < FOCUS[f].target) s += 10;
    if (plateau && f === 'full') s += 15;
    s += rng() * 4;
    if (s > bestScore) { bestScore = s; best = f; }
  });

  if (!ss.length) reasons.push('첫 추천이에요. 기록이 쌓일수록 내 패턴에 맞춰져요');
  else {
    if (todayDone.length) reasons.push(`오늘 이미 ${todayDone.map(s=>FOCUS[s.focus].name).join('·')}을(를) 했어요. 추가로 한다면 겹치지 않는 부위로!`);
    const y = ss.filter(s => s.date === addDays(tk,-1) && s.focus !== 'recovery');
    if (y.length && !todayDone.length) reasons.push(`어제 ${y.map(s=>FOCUS[s.focus].name).join('·')} 운동을 해서 겹치지 않는 부위를 골랐어요`);
    const ds = lastOf[best] ? daysBetween(lastOf[best], tk) : null;
    if (ds === null) reasons.push(`${FOCUS[best].name} 운동은 아직 기록이 없어요`);
    else if (ds >= 4) reasons.push(`${FOCUS[best].name} 운동을 ${ds}일째 안 했어요`);
  }
  if (plateau) reasons.push('최근 2주 체중 변화가 거의 없어서 천국의 계단 시간을 5분 늘렸어요');
  const comeback = gap !== null && gap >= 4;
  if (comeback) reasons.push(`${gap-1}일 쉬었어요. 오늘은 강도를 한 단계 낮춰서 몸을 다시 깨워요`);
  if (!reasons.length) reasons.push('최근 기록을 보고 가장 오래 쉰 부위를 골랐어요');
  return { focus:best, reasons, comeback, plateau, gap };
}

// ===== 루틴 생성 =====
function pickMain(focus, n, lvl, rng, allowHi, avoid){
  const ok = e => !e.kind && e.lv <= lvl && (allowHi || !e.hi);
  let pool = EX.filter(e => ok(e) && e.f.includes(focus));
  if (pool.length < n) {
    const extra = EX.filter(e => ok(e) && !pool.includes(e) && (e.f.includes('core') || e.f.includes('full')));
    pool = pool.concat(extra);
  }
  const chosen = [];
  while (chosen.length < n && pool.length) {
    const w = pool.map(e => {
      let x = 1;
      if (avoid.includes(e.id)) x *= 0.3;
      if (e.lv === lvl) x *= 1.6;
      if (lvl - e.lv >= 2) x *= 0.6;
      if (chosen.some(c => c.eq === e.eq && e.eq !== 'body')) x *= 0.5; // 같은 기구 연속 줄이기
      return x;
    });
    const i = weightedPick(pool, w, rng);
    chosen.push(pool[i]); pool.splice(i, 1);
  }
  return chosen;
}
function pickList(kind, focus, k, rng){
  let pool = EX.filter(e => e.kind === kind && (e.f.includes(focus) || e.f.includes('all')));
  const out = [];
  while (out.length < k && pool.length) { const i = Math.floor(rng()*pool.length); out.push(pool[i]); pool.splice(i,1); }
  return out;
}

function buildWorkout({ focus, minutes, lvl, seed, plateau, allowHi, avoid }){
  const rng = makeRng(seed), steps = [], sections = [];
  const push = (ph, id, label, sec, extra={}) => steps.push({ ph, id, label, sec, ...extra });

  if (focus === 'recovery') {
    const stairMin = { 15:7, 30:15, 45:25 }[minutes];
    const coolSec = minutes*60 - stairMin*60;
    const k = Math.min(8, Math.ceil(coolSec/60));
    const cools = pickList('cool', 'recovery', k, rng);
    const each = Math.floor(coolSec / cools.length);
    sections.push({ title:'저강도 유산소', meta:`${stairMin}분`, items:[{ id:'stair', detail:`${stairMin}분 · 편하게 대화 가능한 속도` }] });
    sections.push({ title:'전신 스트레칭', meta:fmtSec(coolSec), items:cools.map(e => ({ id:e.id, detail:`${each}초` })) });
    push('cardio','stair','천국의 계단 — 편하게', stairMin*60);
    cools.forEach(e => push('cool', e.id, e.n, each));
    return finalize({ focus, minutes, lvl, steps, sections, main:[], rounds:0 });
  }

  const warmSec = { 15:120, 30:240, 45:300 }[minutes];
  const coolSec = { 15:120, 30:200, 45:300 }[minutes];
  let stairMin = { 15:0, 30:5, 45:10 }[minutes];
  if (plateau && minutes >= 30) stairMin += 5;
  if (focus === 'full' && minutes === 45) stairMin = Math.max(stairMin, 12);
  const mainSec = minutes*60 - warmSec - coolSec - stairMin*60;
  const n = minutes === 15 ? 4 : 5;
  const [work, rest] = WR[lvl];
  const RR = 60;
  const roundLen = n*work + (n-1)*rest;
  let rounds = Math.max(2, Math.round((mainSec + RR) / (roundLen + RR)));
  if (rounds*roundLen + (rounds-1)*RR > mainSec + 120 && rounds > 2) rounds--;

  // 워밍업
  const warms = pickList('warm', focus, Math.ceil(warmSec/40), rng);
  const wEach = Math.floor(warmSec / warms.length);
  sections.push({ title:'워밍업', meta:fmtSec(warmSec), items:warms.map(e => ({ id:e.id, detail:`${wEach}초` })) });
  warms.forEach(e => push('warm', e.id, e.n, wEach));

  // 메인 서킷
  const main = pickMain(focus, n, lvl, rng, allowHi, avoid || []);
  sections.push({ title:'메인 서킷', meta:`${rounds}라운드 · ${work}초 운동 / ${rest}초 휴식`, sub:'라운드 사이 60초 휴식',
    items: main.map(e => ({ id:e.id, detail:`${work}초${e.side ? ' · 절반에서 좌우 바꾸기' : ''}` })) });
  for (let r=1; r<=rounds; r++){
    main.forEach((e,i) => {
      push('work', e.id, e.n, work, { round:r, rounds, side:!!e.side });
      if (i < main.length-1) push('rest', null, '휴식', rest, { round:r, rounds });
    });
    if (r < rounds) push('rr', null, '라운드 휴식', RR, { round:r, rounds });
  }

  // 마무리 유산소
  if (stairMin > 0) {
    const interval = ['full','legs','glute'].includes(focus);
    sections.push({ title:'마무리 유산소', meta:`${stairMin}분`, items:[{ id:'stair', detail: interval ? `${stairMin}분 · 1분 빠르게 / 1분 편하게 반복` : `${stairMin}분 · 숨이 차지만 말은 할 수 있는 속도` }] });
    if (interval) { for (let m=0; m<stairMin; m++) push('cardio','stair', m%2===0 ? '천국의 계단 — 빠르게' : '천국의 계단 — 편하게', 60); }
    else push('cardio','stair','천국의 계단 — 중강도', stairMin*60);
  }

  // 쿨다운
  const cools = pickList('cool', focus, Math.ceil(coolSec/40), rng);
  const cEach = Math.floor(coolSec / cools.length);
  sections.push({ title:'쿨다운 스트레칭', meta:fmtSec(coolSec), items:cools.map(e => ({ id:e.id, detail:`${cEach}초` })) });
  cools.forEach(e => push('cool', e.id, e.n, cEach));

  return finalize({ focus, minutes, lvl, steps, sections, main:main.map(e=>e.id), rounds, work, rest });
}
function finalize(w){ w.totalSec = w.steps.reduce((s,x)=>s+x.sec, 0); w.totalMin = Math.round(w.totalSec/60); return w; }

function currentPlan(){
  const rec = recommend(); ui.rec = rec;
  const focus = ui.focus || rec.focus;
  const isRec = !ui.focus || ui.focus === rec.focus;
  const comeback = rec.comeback && focus !== 'recovery';
  let lvl = focus === 'recovery' ? 1 : state.levels[focus];
  if (comeback) lvl = Math.max(1, lvl-1);
  const last = lastSessionOf(focus);
  const allowHi = !!state.profile.allowJump && lvl >= 4 && !comeback;
  const w = buildWorkout({ focus, minutes:ui.minutes, lvl, seed:`${today()}|${focus}|${ui.minutes}|${ui.shuffle}`,
    plateau: rec.plateau && isRec, allowHi, avoid: last ? (last.ex||[]) : [] });
  ui.workout = w;
  return { rec, focus, isRec, lvl, comeback, w };
}

// ===== 렌더: 헤더 =====
function updateHeader(){
  const p = state.profile, cur = currentWeight();
  const span = p.start - p.goal;
  const pct = span > 0 ? Math.min(100, Math.max(0, Math.round((p.start - cur) / span * 100))) : 0;
  $('overallProgress').style.width = pct + '%';
  $('progressLabel').textContent = pct + '% 달성';
  $('displayCurrentWeight').textContent = cur;
  $('displayGoalWeight').textContent = p.goal + ' kg';
  $('progressStart').textContent = p.start + ' kg';
  $('progressGoal').textContent = p.goal + ' kg';
}

// ===== 렌더: 오늘 =====
function weekStats(){
  const mon = getMonday(today());
  const ss = state.sessions.filter(s => s.date >= mon && daysBetween(mon, s.date) < 7);
  return { days: new Set(ss.map(s=>s.date)).size, min: ss.reduce((a,s)=>a+(s.min||0),0) };
}

function renderToday(){
  const now = new Date();
  $('todayDate').textContent = `${now.getMonth()+1}월 ${now.getDate()}일`;
  $('todayDay').textContent = DAYS[now.getDay()] + '요일';
  const ws = weekStats(); $('weekDays').textContent = ws.days; $('weekMin').textContent = ws.min;

  // 오늘 완료 배너
  const done = state.sessions.filter(s => s.date === today());
  $('doneBanner').innerHTML = done.length ? `<div class="done-banner">✅ 오늘 ${done.map(s => `${FOCUS[s.focus].emoji} ${FOCUS[s.focus].name} ${s.min}분`).join(', ')} 완료!</div>` : '';

  const { rec, focus, isRec, lvl, comeback, w } = currentPlan();
  const F = FOCUS[focus];

  // 추천 카드
  const reasonsHtml = isRec
    ? `<ul class="rec-reasons">${rec.reasons.map(r => `<li>${r}</li>`).join('')}</ul>`
    : `<div class="rec-reasons-alt">직접 고른 운동이에요 · 오늘 추천은 ${FOCUS[rec.focus].emoji} ${FOCUS[rec.focus].name} <button class="link-btn" id="btnBackRec">추천으로 돌아가기</button></div>`;
  $('recCard').style.background = `linear-gradient(135deg, ${F.color}, ${shade(F.color)})`;
  $('recCard').innerHTML = `
    <div class="rec-top">
      <span class="rec-badge">${isRec ? '✨ 오늘의 추천' : '🎯 직접 선택'}</span>
      ${focus !== 'recovery' ? `<span class="rec-level">Lv.${lvl} ${LV_LABEL[lvl]}${comeback ? ' (복귀 모드)' : ''}</span>` : ''}
    </div>
    <div class="rec-title">${F.emoji} ${F.name} 집중</div>
    <div class="rec-desc">${F.desc} · 약 ${w.totalMin}분</div>
    ${reasonsHtml}`;
  const back = $('btnBackRec'); if (back) back.onclick = () => { ui.focus = null; ui.shuffle = 0; renderToday(); };

  // 시간 칩
  $('timeChips').innerHTML = [15,30,45].map(m => `<button class="chip ${ui.minutes===m?'active':''}" data-min="${m}">${m}분</button>`).join('');
  $('timeChips').querySelectorAll('.chip').forEach(b => b.onclick = () => {
    ui.minutes = +b.dataset.min; state.prefs.minutes = ui.minutes; saveLocal(); renderToday();
  });
  // 부위 칩
  $('focusChips').innerHTML = [...FOCUS_KEYS, 'recovery'].map(k => `<button class="chip ${focus===k?'active':''}" data-f="${k}">${k===rec.focus?'★ ':''}${FOCUS[k].emoji} ${FOCUS[k].name}</button>`).join('');
  $('focusChips').querySelectorAll('.chip').forEach(b => b.onclick = () => {
    ui.focus = b.dataset.f === rec.focus ? null : b.dataset.f; ui.shuffle = 0; renderToday();
  });

  // 루틴 미리보기
  $('routinePreview').innerHTML = w.sections.map(sec => `
    <div class="preview-sec">
      <div class="preview-head"><span class="preview-title">${sec.title}</span><span class="preview-meta">${sec.meta}</span></div>
      ${sec.sub ? `<div class="preview-sub">${sec.sub}</div>` : ''}
      ${sec.items.map(it => { const e = EX_MAP[it.id]; return `
        <div class="pv-item" data-id="${e.id}">
          <div class="pv-info"><div class="pv-name">${e.n}${e.hi ? ' <span class="hi-flag">점프</span>' : ''}</div><div class="pv-detail">${it.detail}</div></div>
          <span class="eq-badge eq-${e.eq}">${EQ_LABEL[e.eq]}</span><span class="pv-more">📋</span>
        </div>`; }).join('')}
    </div>`).join('');
  $('routinePreview').querySelectorAll('.pv-item').forEach(el => el.onclick = () => openModal(el.dataset.id));
}
function shade(hex){ // 살짝 어둡게
  const n = parseInt(hex.slice(1),16); const r = Math.max(0,(n>>16)-40), g = Math.max(0,((n>>8)&255)-40), b = Math.max(0,(n&255)-40);
  return `rgb(${r},${g},${b})`;
}

// ===== 타이머 =====
const PH_LABEL = { warm:'워밍업', work:'운동', rest:'휴식', rr:'라운드 휴식', cardio:'유산소', cool:'쿨다운' };
const PH_COLOR = { warm:'#f5a623', work:'#e94560', rest:'#27ae60', rr:'#27ae60', cardio:'#2f80ed', cool:'#16a085' };
const T = { steps:[], i:0, end:0, remain:0, paused:false, iv:null, doneSec:0, lastBeep:null, audio:null, lock:null, w:null };

function initAudio(){ try { T.audio = T.audio || new (window.AudioContext || window.webkitAudioContext)(); T.audio.resume?.(); } catch(e){ T.audio = null; } }
function beep(freq=880, dur=0.15, vol=0.25){
  if (!T.audio) return;
  try { const o = T.audio.createOscillator(), g = T.audio.createGain(); o.frequency.value = freq; g.gain.value = vol;
    o.connect(g); g.connect(T.audio.destination); o.start(); g.gain.exponentialRampToValueAtTime(0.0001, T.audio.currentTime + dur); o.stop(T.audio.currentTime + dur); } catch(e){}
}
async function requestWake(){ try { T.lock = await navigator.wakeLock?.request('screen'); } catch(e){ T.lock = null; } }
function releaseWake(){ try { T.lock?.release(); } catch(e){} T.lock = null; }

function startTimer(){
  const w = ui.workout; if (!w) return;
  T.w = w; T.steps = w.steps; T.i = 0; T.doneSec = 0; T.paused = false;
  initAudio(); requestWake();
  $('timerOverlay').classList.add('open'); document.body.style.overflow = 'hidden';
  startStep();
  clearInterval(T.iv); T.iv = setInterval(tick, 200);
}
function startStep(){
  const s = T.steps[T.i]; T.remain = s.sec; T.end = Date.now() + s.sec*1000; T.lastBeep = null;
  if (s.ph === 'work' || s.ph === 'cardio') { beep(988,0.18); setTimeout(()=>beep(1318,0.22),200); } else beep(523,0.25);
  try { navigator.vibrate?.(s.ph === 'work' ? [150,80,150] : 200); } catch(e){}
  renderTimer();
}
function tick(){
  if (T.paused) return;
  const r = Math.max(0, (T.end - Date.now())/1000); T.remain = r;
  const sec = Math.ceil(r);
  if (sec <= 3 && sec >= 1 && T.lastBeep !== sec) { T.lastBeep = sec; beep(660, 0.1); }
  if (r <= 0) { T.doneSec += T.steps[T.i].sec; nextStep(); return; }
  updateTimerClock();
}
function nextStep(){ T.i++; if (T.i >= T.steps.length) { finishTimer(true); return; } startStep(); }
function skipStep(){ T.doneSec += Math.max(0, T.steps[T.i].sec - Math.ceil(T.remain)); if (T.paused) togglePause(); nextStep(); }
function togglePause(){
  T.paused = !T.paused;
  if (!T.paused) T.end = Date.now() + T.remain*1000;
  $('tPause').textContent = T.paused ? '▶ 계속' : '⏸ 일시정지';
}
function quitTimer(){
  const partial = T.doneSec + (T.steps[T.i].sec - Math.ceil(T.remain));
  if (partial < 60) { if (confirm('운동을 그만할까요?')) closeTimer(); return; }
  if (confirm('여기서 마칠까요? 지금까지 한 만큼 기록할게요.')) { T.doneSec = partial; finishTimer(false); }
}
function closeTimer(){ clearInterval(T.iv); releaseWake(); $('timerOverlay').classList.remove('open'); document.body.style.overflow = ''; }
function finishTimer(full){
  closeTimer();
  if (full) { beep(784,0.15); setTimeout(()=>beep(988,0.15),160); setTimeout(()=>beep(1318,0.3),320); }
  openFeedback({ focus:T.w.focus, lvl:T.w.lvl, ex:T.w.main, full, min: full ? T.w.totalMin : Math.max(1, Math.round(T.doneSec/60)) });
}
function renderTimer(){
  const s = T.steps[T.i], color = PH_COLOR[s.ph];
  $('timerOverlay').style.setProperty('--ph', color);
  $('tPhase').textContent = PH_LABEL[s.ph];
  $('tRound').textContent = s.round ? `라운드 ${s.round} / ${s.rounds}` : '';
  $('tName').textContent = s.ph === 'rest' || s.ph === 'rr' ? '숨 고르기' : s.label;
  $('tSide').textContent = s.side ? '↔ 절반 지나면 좌우 바꾸기' : '';
  let nx = null; for (let j=T.i+1; j<T.steps.length; j++){ if (T.steps[j].ph !== 'rest' && T.steps[j].ph !== 'rr') { nx = T.steps[j]; break; } }
  $('tNext').textContent = nx ? `다음: ${nx.label}` : '마지막 동작이에요!';
  $('tInfo').onclick = () => { if (s.id) openModal(s.id); };
  $('tInfo').style.visibility = s.id ? 'visible' : 'hidden';
  updateTimerClock();
}
function updateTimerClock(){
  const s = T.steps[T.i], sec = Math.ceil(T.remain);
  $('tClock').textContent = sec >= 60 ? `${Math.floor(sec/60)}:${pad2(sec%60)}` : sec;
  const pct = s.sec ? (1 - T.remain/s.sec) * 100 : 0;
  $('tRing').style.background = `conic-gradient(var(--ph) ${pct}%, rgba(255,255,255,0.12) 0)`;
  let before = 0; for (let j=0;j<T.i;j++) before += T.steps[j].sec;
  const totalPct = (before + (s.sec - T.remain)) / T.w.totalSec * 100;
  $('tBar').style.width = totalPct + '%';
  const left = Math.max(0, Math.round((T.w.totalSec - before - (s.sec - T.remain))/60));
  $('tLeft').textContent = `남은 시간 약 ${left}분`;
}

// ===== 피드백 & 기록 저장 =====
let pending = null;
function openFeedback(p){
  pending = p;
  $('fbSummary').textContent = `${FOCUS[p.focus].emoji} ${FOCUS[p.focus].name} · ${p.min}분${p.full ? '' : ' (중간 종료)'}`;
  $('fbModal').classList.add('open');
}
function closeFeedback(){ $('fbModal').classList.remove('open'); pending = null; }
function saveSession(diff){
  if (!pending) return;
  const p = pending, f = p.focus, tk = today();
  state.sessions.push({ date:tk, focus:f, min:p.min, lvl:p.lvl, diff, ex:p.ex || [], full:!!p.full, t:Date.now() });
  state.completedDays[tk] = true;
  let msg = '기록 완료! 수고했어요 🎉';
  if (f !== 'recovery') {
    const old = state.levels[f]; let L = old;
    if (diff === 'hard') { L = Math.max(1, L-1); state.okStreak[f] = 0; }
    else if (diff === 'easy' && p.full) { L = Math.min(5, L+1); state.okStreak[f] = 0; }
    else if (diff === 'ok' && p.full) { state.okStreak[f] = (state.okStreak[f]||0) + 1; if (state.okStreak[f] >= 2) { L = Math.min(5, L+1); state.okStreak[f] = 0; } }
    state.levels[f] = L;
    if (L !== old) msg = `다음 ${FOCUS[f].name} 운동은 Lv.${L}로 ${L > old ? '올릴게요 💪' : '낮출게요 🙂'}`;
  }
  saveState(); closeFeedback(); ui.focus = null; ui.shuffle = 0;
  renderAll(); showToast(msg);
}

// ===== 렌더: 이번 주 =====
const DIFF_LABEL = { hard:'😵 힘듦', ok:'🙂 적당', easy:'😎 쉬움' };
function renderWeekly(){
  const tk = today(), mon = getMonday(tk);
  const ws = weekStats();
  let strip = '';
  for (let i=0;i<7;i++){
    const k = addDays(mon, i), ss = state.sessions.filter(s => s.date === k);
    const emo = ss.length ? ss.map(s => FOCUS[s.focus].emoji).join('') : (k < tk ? '·' : '');
    strip += `<div class="wk-day ${k===tk?'today':''} ${ss.length?'done':''}"><div class="wk-dname">${DAYS[parseDate(k).getDay()]}</div><div class="wk-emo">${emo}</div></div>`;
  }
  $('weekSummary').innerHTML = `
    <div class="wk-stats"><div><b>${ws.days}</b><span>일 운동</span></div><div><b>${ws.min}</b><span>분</span></div><div><b>${streakDays()}</b><span>일 연속</span></div></div>
    <div class="wk-strip">${strip}</div>`;

  // 부위 밸런스 (최근 14일)
  const cnt = {}; state.sessions.filter(s => daysBetween(s.date, tk) < 14).forEach(s => { cnt[s.focus] = (cnt[s.focus]||0)+1; });
  const max = Math.max(1, ...FOCUS_KEYS.map(k => cnt[k]||0));
  $('balance').innerHTML = FOCUS_KEYS.map(k => `
    <div class="bal-row"><span class="bal-name">${FOCUS[k].emoji} ${FOCUS[k].name}</span>
      <div class="bal-bg"><div class="bal-fill" style="width:${(cnt[k]||0)/max*100}%;background:${FOCUS[k].color}"></div></div>
      <span class="bal-n">${cnt[k]||0}회</span></div>`).join('');

  // 레벨
  $('levels').innerHTML = FOCUS_KEYS.map(k => `
    <div class="lv-row"><span class="lv-name">${FOCUS[k].emoji} ${FOCUS[k].name}</span>
      <div class="lv-ctrl"><button class="lv-btn" data-k="${k}" data-d="-1">−</button><span class="lv-val">Lv.${state.levels[k]} <small>${LV_LABEL[state.levels[k]]}</small></span><button class="lv-btn" data-k="${k}" data-d="1">+</button></div></div>`).join('');
  $('levels').querySelectorAll('.lv-btn').forEach(b => b.onclick = () => {
    const k = b.dataset.k; state.levels[k] = Math.min(5, Math.max(1, state.levels[k] + (+b.dataset.d))); state.okStreak[k] = 0;
    saveState(); renderWeekly(); renderToday();
  });

  // 최근 기록
  const recent = sortedSessions().reverse().slice(0, 12);
  $('sessionList').innerHTML = recent.length ? recent.map((s,idx) => `
    <div class="ss-row"><div class="ss-left"><span class="ss-date">${fmtDate(s.date)}</span><span class="ss-focus">${FOCUS[s.focus].emoji} ${FOCUS[s.focus].name}</span></div>
      <div class="ss-right"><span>${s.min}분</span><span class="ss-diff">${DIFF_LABEL[s.diff]||''}</span><button class="ss-del" data-t="${s.t}" title="삭제">✕</button></div></div>`).join('')
    : '<div class="empty">아직 기록이 없어요. 오늘 첫 운동을 시작해볼까요?</div>';
  $('sessionList').querySelectorAll('.ss-del').forEach(b => b.onclick = () => {
    if (!confirm('이 기록을 삭제할까요?')) return;
    const t = +b.dataset.t; const s = state.sessions.find(x => x.t === t);
    state.sessions = state.sessions.filter(x => x.t !== t);
    if (s && !state.sessions.some(x => x.date === s.date)) delete state.completedDays[s.date];
    saveState(); renderAll();
  });
}
function streakDays(){
  const days = new Set(state.sessions.map(s => s.date)); let k = today(), n = 0;
  if (!days.has(k)) k = addDays(k, -1);
  while (days.has(k)) { n++; k = addDays(k, -1); }
  return n;
}

// ===== 렌더: 기록 & 통계 =====
function renderRecord(){
  const p = state.profile, logs = dedupWeights(), cur = logs.length ? logs[logs.length-1].weight : null;
  $('recStart').innerHTML = `${p.start} <span>kg</span>`;
  $('recCurrentWeight').innerHTML = cur ? `${cur} <span>kg</span>` : `— <span>kg</span>`;
  $('recLost').innerHTML = cur ? `${+(p.start-cur).toFixed(1)} <span>kg</span>` : `— <span>kg</span>`;
  $('recRemain').innerHTML = cur ? `${+(cur-p.goal).toFixed(1)} <span>kg</span>` : `— <span>kg</span>`;
  const tr = weightTrend();
  let eta = '체중을 2주 이상 꾸준히 기록하면 목표 도달 예상일을 알려드려요.';
  if (tr.slope !== null) {
    const wk = (tr.slope*7).toFixed(1);
    if (tr.eta) { const d = parseDate(tr.eta); eta = `최근 3주 속도 <b>주 ${wk}kg</b> → 목표 ${p.goal}kg 도달 예상 <b>${d.getFullYear()}년 ${d.getMonth()+1}월 ${d.getDate()}일</b>`; }
    else eta = `최근 3주 체중 변화 <b>주 ${wk > 0 ? '+' : ''}${wk}kg</b> — 감량 속도가 멈췄어요. 운동보다 식단을 먼저 점검해보세요.`;
  }
  $('etaBox').innerHTML = eta;
  renderWeightChart(tr.logs); renderCalendar();
  // 설정
  $('setHeight').value = p.height; $('setStart').value = p.start; $('setGoal').value = p.goal; $('setJump').checked = !!p.allowJump;
  if (state.sheetsUrl) $('sheetsUrl').value = state.sheetsUrl;
}
function renderWeightChart(all){
  const canvas = $('weightChart'), ctx = canvas.getContext('2d');
  const logs = all.slice(-30);
  const dpr = window.devicePixelRatio || 1, W = canvas.parentElement.clientWidth - 32, H = 200;
  canvas.width = W*dpr; canvas.height = H*dpr; canvas.style.height = H+'px'; ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.clearRect(0,0,W,H);
  if (logs.length < 2) { ctx.fillStyle='#aaa'; ctx.font='13px Noto Sans KR'; ctx.textAlign='center'; ctx.fillText('체중 기록이 2개 이상 필요해요', W/2, H/2); return; }
  // 7일 이동평균
  const ma = logs.map(l => { const w = all.filter(x => { const d = daysBetween(x.date, l.date); return d >= 0 && d < 7; }); return avg(w.map(x=>x.weight)); });
  const goal = state.profile.goal, ws = logs.map(l=>l.weight);
  const min = Math.min(...ws, goal) - 1, max = Math.max(...ws) + 1;
  const pad = { top:16, right:16, bottom:30, left:36 }, w = W-pad.left-pad.right, h = H-pad.top-pad.bottom;
  const xs = i => pad.left + (i/(logs.length-1))*w, ys = v => pad.top + h - ((v-min)/(max-min))*h;
  ctx.font = '10px Noto Sans KR';
  for (let i=0;i<=4;i++){ const y = pad.top + (h/4)*i; ctx.strokeStyle='#f0f0f0'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(pad.left,y); ctx.lineTo(pad.left+w,y); ctx.stroke(); ctx.fillStyle='#aaa'; ctx.textAlign='right'; ctx.fillText((max-((max-min)/4)*i).toFixed(0), pad.left-4, y+4); }
  const gy = ys(goal); ctx.strokeStyle='#27ae60'; ctx.lineWidth=1.5; ctx.setLineDash([4,4]); ctx.beginPath(); ctx.moveTo(pad.left,gy); ctx.lineTo(pad.left+w,gy); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle='#27ae60'; ctx.font='bold 10px Noto Sans KR'; ctx.textAlign='left'; ctx.fillText(`목표 ${goal}kg`, pad.left+2, gy-4);
  ctx.strokeStyle='rgba(233,69,96,0.35)'; ctx.lineWidth=1.5; ctx.beginPath(); logs.forEach((l,i) => { i ? ctx.lineTo(xs(i),ys(l.weight)) : ctx.moveTo(xs(i),ys(l.weight)); }); ctx.stroke();
  logs.forEach((l,i) => { ctx.beginPath(); ctx.arc(xs(i), ys(l.weight), 3, 0, Math.PI*2); ctx.fillStyle='rgba(233,69,96,0.55)'; ctx.fill(); });
  ctx.strokeStyle='#1a1a2e'; ctx.lineWidth=2.5; ctx.beginPath(); ma.forEach((v,i) => { i ? ctx.lineTo(xs(i),ys(v)) : ctx.moveTo(xs(i),ys(v)); }); ctx.stroke();
  ctx.fillStyle='#aaa'; ctx.font='10px Noto Sans KR'; ctx.textAlign='center';
  const step = Math.max(1, Math.floor(logs.length/5));
  logs.forEach((l,i) => { if (i%step===0 || i===logs.length-1) ctx.fillText(l.date.slice(5), xs(i), pad.top+h+18); });
}
function renderCalendar(){
  const now = new Date(), tk = today(), y = now.getFullYear(), m = now.getMonth();
  const first = new Date(y,m,1).getDay(), dim = new Date(y,m+1,0).getDate();
  let html = `<div class="cal-month-title">${y}년 ${m+1}월</div><div class="cal-grid">`;
  DAYS.forEach(d => html += `<div class="cal-day-label">${d}</div>`);
  for (let i=0;i<first;i++) html += '<div class="cal-day empty"></div>';
  for (let d=1; d<=dim; d++){
    const k = `${y}-${pad2(m+1)}-${pad2(d)}`; const ss = state.sessions.filter(s => s.date === k);
    const done = ss.length || state.completedDays?.[k];
    html += `<div class="cal-day ${k===tk?'today':''} ${done?'done':''}"><span>${d}</span>${ss.length ? `<em>${FOCUS[ss[0].focus].emoji}</em>` : ''}</div>`;
  }
  $('calendarWrap').innerHTML = html + '</div>';
}

// ===== 렌더: 운동 사전 =====
function renderDict(){
  const filters = [['all','전체'], ...FOCUS_KEYS.map(k => [k, FOCUS[k].emoji+' '+FOCUS[k].name]), ['warm','워밍업'], ['cool','스트레칭']];
  $('dictChips').innerHTML = filters.map(([k,l]) => `<button class="chip ${ui.dictFilter===k?'active':''}" data-k="${k}">${l}</button>`).join('');
  $('dictChips').querySelectorAll('.chip').forEach(b => b.onclick = () => { ui.dictFilter = b.dataset.k; renderDict(); });
  const f = ui.dictFilter;
  const list = EX.filter(e => f === 'all' ? true : (f === 'warm' || f === 'cool') ? e.kind === f : (!e.kind && e.f.includes(f)))
    .sort((a,b) => a.lv - b.lv);
  $('dictList').innerHTML = list.map(e => `
    <div class="pv-item" data-id="${e.id}">
      <div class="pv-info"><div class="pv-name">${e.n}${e.hi ? ' <span class="hi-flag">점프</span>' : ''}</div><div class="pv-detail">${e.t.join(' · ')}</div></div>
      ${!e.kind ? `<span class="lv-dots">${'●'.repeat(e.lv)}${'○'.repeat(5-e.lv)}</span>` : ''}
      <span class="eq-badge eq-${e.eq}">${EQ_LABEL[e.eq]}</span>
    </div>`).join('');
  $('dictList').querySelectorAll('.pv-item').forEach(el => el.onclick = () => openModal(el.dataset.id));
}

const GUIDES = [
  { icon:'🤖', title:'자동 추천은 이렇게 동작해요', content:`<ul>
    <li><strong>부위 선택</strong>: 가장 오래 안 한 부위를 우선, 어제 쓴 근육과 겹치면 제외해요</li>
    <li><strong>3일 연속</strong> 운동하면 다음 날은 회복 루틴을 추천해요</li>
    <li><strong>3일 이상 쉬면</strong> 복귀 모드로 강도를 한 단계 낮춰요</li>
    <li><strong>운동 후 평가</strong>: 😵 힘듦 → 레벨 −1, 😎 쉬움 → +1, 🙂 적당 2번 연속 → +1</li>
    <li><strong>체중 정체</strong>(최근 2주 변화 0.2kg 미만) → 천국의 계단 +5분, 전신 칼로리 우선</li>
    <li>같은 부위라도 지난번과 다른 동작이 나오도록 섞어요</li></ul>` },
  { icon:'🪜', title:'천국의 계단 (스텝밀) 활용법', content:`<ul>
    <li><strong>손잡이</strong>: 균형용으로 가볍게만. 매달리면 효과가 크게 줄어요</li>
    <li><strong>자세</strong>: 상체를 세우고 발 전체로 밟기, 발끝만 쓰면 종아리만 타요</li>
    <li><strong>강도</strong>: 편하게 = 대화 가능 / 중강도 = 짧은 문장만 / 빠르게 = 말하기 어려움</li>
    <li>운동 후 종아리 스트레칭은 꼭 해주세요</li></ul>` },
  { icon:'⚽', title:'메디신볼·짐볼 활용법', content:`<ul>
    <li><strong>메디신볼</strong>: 들고 하는 동작은 무게 추가, 무거우면 맨몸으로 해도 OK</li>
    <li><strong>짐볼</strong>: 바람을 너무 빵빵하게 넣지 말고, 처음엔 벽 가까이에서</li>
    <li>월볼 샷·점프 동작은 설정에서 <strong>점프 허용</strong>을 켜고 Lv.4 이상일 때만 나와요</li></ul>` },
  { icon:'💡', title:'알배김(DOMS) 관리법', content:`<ul>
    <li><strong>예방</strong>: 쿨다운 스트레칭 + 운동 후 단백질 섭취</li>
    <li><strong>완화</strong>: 가벼운 유산소, 따뜻한 샤워</li>
    <li>알배김이 심하면 운동 후 평가를 😵 힘듦으로 남겨주세요. 강도가 내려가요</li></ul>` },
  { icon:'🍽️', title:'식단 가이드', content:`<ul>
    <li><strong>하루 칼로리</strong>: 1,800~2,000 kcal</li>
    <li><strong>단백질</strong>: 매 끼니 손바닥 크기 이상 (닭가슴살, 계란, 두부, 생선)</li>
    <li><strong>운동 후</strong>: 단백질 위주 식사</li>
    <li>물 하루 2L 이상!</li></ul>` },
];
function renderGuide(){
  $('guideList').innerHTML = GUIDES.map((g,i) => `<div class="guide-card"><div class="guide-card-header" data-i="${i}"><div class="guide-card-title"><span>${g.icon}</span>${g.title}</div><span class="arrow">▼</span></div><div class="guide-card-body" id="guide-body-${i}">${g.content}</div></div>`).join('');
  $('guideList').querySelectorAll('.guide-card-header').forEach(h => h.onclick = () => {
    const b = $('guide-body-'+h.dataset.i); b.classList.toggle('open'); h.querySelector('.arrow').style.transform = b.classList.contains('open') ? 'rotate(180deg)' : '';
  });
}

// ===== 운동 상세 모달 =====
function openModal(id){
  const e = EX_MAP[id]; if (!e) return;
  $('modalTitle').textContent = e.n;
  $('modalMeta').innerHTML = `<span class="eq-badge eq-${e.eq}">${EQ_LABEL[e.eq]}</span>${!e.kind ? `<span class="lv-dots">난이도 ${'●'.repeat(e.lv)}${'○'.repeat(5-e.lv)}</span>` : ''}`;
  $('modalTarget').innerHTML = e.t.map(t => `<span class="target-chip">${t}</span>`).join('');
  $('modalHow').innerHTML = e.how.map((h,i) => `<div class="how-step"><span class="how-num">${i+1}</span><span>${h}</span></div>`).join('');
  $('modalTip').querySelector('.tip-text').textContent = e.tip;
  const cau = $('modalCaution'); cau.style.display = e.cau && e.cau !== '없음.' ? '' : 'none'; cau.querySelector('.caution-text').textContent = e.cau;
  const a = $('modalYoutube').querySelector('a');
  a.href = `https://www.youtube.com/results?search_query=${encodeURIComponent(e.yt)}`; a.textContent = `▶ 유튜브 "${e.yt}" 검색`;
  $('exModal').classList.add('open');
}
function closeModal(){ $('exModal').classList.remove('open'); }

// ===== 체중 입력 =====
function renderWeightHistory(){
  const recent = dedupWeights().slice(-5).reverse();
  $('weightHistory').innerHTML = recent.length ? recent.map(w => `<div class="weight-chip">${w.date.slice(5)} <span>${w.weight}kg</span></div>`).join('') : '<span class="muted-sm">아직 기록이 없어요</span>';
}
function initWeightInput(){
  $('btnSaveWeight').onclick = () => {
    const val = parseFloat($('weightInput').value);
    if (isNaN(val) || val < 30 || val > 250) { showToast('올바른 체중을 입력해주세요'); return; }
    const tk = today();
    state.weightLog = state.weightLog.filter(w => w.date !== tk); // 같은 날은 덮어쓰기
    state.weightLog.push({ date:tk, weight:val }); $('weightInput').value = '';
    saveState(); renderWeightHistory(); updateHeader(); showToast(`체중 ${val}kg 기록 완료 ✅`);
  };
}

// ===== 설정 & 시트 =====
function initSettings(){
  $('btnSaveSettings').onclick = () => {
    const h = parseFloat($('setHeight').value), s = parseFloat($('setStart').value), g = parseFloat($('setGoal').value);
    if ([h,s,g].some(isNaN) || g >= s) { showToast('값을 확인해주세요 (목표는 시작 체중보다 작게)'); return; }
    state.profile = { ...state.profile, height:h, start:s, goal:g, allowJump:$('setJump').checked };
    saveState(); renderAll(); showToast('설정 저장 완료 ✅');
  };
  $('btnSaveSheets').onclick = () => { state.sheetsUrl = $('sheetsUrl').value.trim(); saveState(); showToast('시트 URL 저장 완료 ✅'); };
  $('btnExport').onclick = async () => {
    const url = state.sheetsUrl || $('sheetsUrl').value.trim();
    if (!url) { showToast('구글 시트 URL을 먼저 입력해주세요'); return; }
    const st = $('exportStatus'); st.textContent = '전송 중...';
    const ss = state.sessions.filter(s => s.date === today());
    try {
      await fetch(url, { method:'POST', mode:'no-cors', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({
        date: today(), weight: currentWeight(),
        focus: ss.map(s => FOCUS[s.focus].name).join(', ') || '휴식',
        minutes: ss.reduce((a,s)=>a+s.min,0), difficulty: ss.map(s => s.diff).join(', '),
        isCompleted: ss.length > 0 }) });
      st.textContent = '✅ 전송 완료!'; showToast('구글 시트 전송 완료 📤');
    } catch(e){ st.textContent = '⚠️ 전송 실패. URL을 확인해주세요.'; }
  };
}

// ===== 탭 =====
function initTabs(){
  document.querySelectorAll('.tab-btn').forEach(btn => btn.onclick = () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    btn.classList.add('active'); $('tab-' + btn.dataset.tab).classList.add('active');
    if (btn.dataset.tab === 'record') renderRecord();
    if (btn.dataset.tab === 'weekly') renderWeekly();
    window.scrollTo({ top:0 });
  });
}

function renderAll(){
  updateHeader(); renderToday(); renderWeightHistory(); renderWeekly(); renderDict();
  if ($('tab-record').classList.contains('active')) renderRecord();
}

function init(){
  initTabs(); initWeightInput(); initSettings(); renderGuide();
  $('btnStart').onclick = startTimer;
  $('btnShuffle').onclick = () => { ui.shuffle++; renderToday(); showToast('다른 동작으로 바꿨어요 🔀'); };
  $('btnManualDone').onclick = () => { const w = ui.workout; openFeedback({ focus:w.focus, lvl:w.lvl, ex:w.main, full:true, min:w.totalMin }); };
  $('tPause').onclick = togglePause; $('tSkip').onclick = skipStep; $('tQuit').onclick = quitTimer;
  document.querySelectorAll('.fb-btn').forEach(b => b.onclick = () => saveSession(b.dataset.diff));
  $('fbCancel').onclick = closeFeedback;
  $('modalClose').onclick = closeModal;
  $('exModal').onclick = e => { if (e.target === $('exModal')) closeModal(); };
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && $('timerOverlay').classList.contains('open')) requestWake(); });
  loadState();
}
document.addEventListener('DOMContentLoaded', init);
