// ══════════════════════════════════════════════
// 🔊 사운드 매니저
// 파일 교체 시 SOUND_FILES 의 경로만 수정하세요
// ══════════════════════════════════════════════
var SOUND_BASE = 'https://raw.githubusercontent.com/NovisCoder/kill-the-company/main/sound/';

var SOUND_FILES = {
  title:  'tittle bgm.wav',   // 1. 메인화면 오프닝 테마 (반복)
  phase1: '1phase.wav',       // 2. 1페이즈 배경음악 (반복)
  awake:  'awake.wav',        // 3. 빅보스 씬 배경음악 (반복)
  gun:    'gun.mp3',          // 4. 총 발사 효과음 (1회)
  phase2: '2phase.wav',       // 5. 2페이즈(사장실) 배경음악 (반복)
  click:  'clicksound.wav'    // 6. 클릭/터치 효과음
};

var _sounds = {};      // Audio 객체 캐시
var _currentBgm = null; // 현재 재생 중인 BGM 키

function _getAudio(key) {
  if (!_sounds[key]) {
    _sounds[key] = new Audio(SOUND_BASE + SOUND_FILES[key]);
  }
  return _sounds[key];
}

/** BGM 재생 (loop). 이미 같은 트랙이면 무시 */
function playBgm(key) {
  if (_currentBgm === key) return;
  stopBgm();
  var a = _getAudio(key);
  a.loop = true;
  a.currentTime = 0;
  a.play().catch(function(){});
  _currentBgm = key;
}

/** BGM 정지 */
function stopBgm() {
  if (!_currentBgm) return;
  var a = _getAudio(_currentBgm);
  a.pause();
  a.currentTime = 0;
  _currentBgm = null;
}

/** 효과음 1회 재생 */
function playSfx(key) {
  var a = _getAudio(key);
  a.loop = false;
  a.currentTime = 0;
  a.play().catch(function(){});
}

/** 클릭 효과음 — 게임 진행 중(인트로 제외)에만 재생 */
function _clickSfx() {
  playSfx('click'); // 인트로 포함 모든 화면에서 재생
}

// ── 전역 클릭/터치 이벤트에 클릭음 연결 ──
document.addEventListener('click',   _clickSfx, true);
document.addEventListener('touchend', _clickSfx, true);

// ══════════════════════════════════════════════
// ── Supabase 설정 ──
// 아래 두 줄을 본인 Supabase 프로젝트 값으로 교체하세요
var SUPABASE_URL = 'https://ypdiwxklslaeqxjcwtzs.supabase.co';
var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlwZGl3eGtsc2xhZXF4amN3dHpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5ODA0ODUsImV4cCI6MjA5NjU1NjQ4NX0.xkUGLsL8WKwskm0kqZymsdawowZvn2N9lBVj1e2-eB4';

function show(id){
  document.querySelectorAll('.scr').forEach(function(s){s.classList.remove('on');});
  document.getElementById(id).classList.add('on');
}

// ── 시작하기 버튼 ──
// 플레이어가 "시작하기"를 누르는 순간 = 첫 인터랙션 → title BGM 즉시 재생
function enterGame(){
  // 🔊 title BGM 시작 (클릭 이벤트 내부라 브라우저 정책 통과)
  playBgm('title');
  // 시작하기 버튼 숨기고 로그인 필드 표시
  var btnEnter = document.getElementById('btn-enter');
  var loginFields = document.getElementById('login-fields');
  if(btnEnter) btnEnter.style.display = 'none';
  if(loginFields) loginFields.style.display = 'flex';
  // 이름 입력란에 포커스
  setTimeout(function(){
    var inp = document.getElementById('inp-name');
    if(inp) inp.focus();
  }, 50);
}
 
// ── 인트로 → 브리핑 ──
function startGame(){
  var nm = document.getElementById('inp-name').value.trim();
  if(!nm){ document.getElementById('inp-name').focus(); return; }
  G.name = nm;
  G.startTime = Date.now();
  G.collected = {}; G.choices = {};
  // 비서 이미지 프리로드
  ['images/cat_surp.jpg', 'images/cat_smile.jpg'].forEach(function(src){
    var img = new Image(); img.src = src;
  });
  // 🔊 title BGM → phase1 BGM 전환
  stopBgm();
  playBgm('phase1');
  show('s-brief');
  runBrief();
}
 
function runBrief(){
  var ids=['bc0','bc1','bc2','bc3','bc4','bc5','bc6'];
  ids.forEach(function(id,i){
    setTimeout(function(){ document.getElementById(id).classList.add('on'); }, 400 + i*800);
  });
  setTimeout(function(){ document.getElementById('brief-go').style.display='block'; }, 400 + ids.length*800 + 500);
}
 
// ── 플레이 방법 버튼 제어 ──
function showHowToPlayBtn(){
  var btn = document.getElementById('how-to-play-btn');
  if(btn) btn.style.display = 'block';
}
function hideHowToPlayBtn(){
  var btn = document.getElementById('how-to-play-btn');
  if(btn) btn.style.display = 'none';
  closeHowToPlay();
}
function openHowToPlay(){
  var ov = document.getElementById('how-to-play-overlay');
  if(ov){ ov.style.display = 'flex'; }
}
function closeHowToPlay(){
  var ov = document.getElementById('how-to-play-overlay');
  if(ov){ ov.style.display = 'none'; }
}


function openHowToPlayP2(){
  var ov = document.getElementById('how-to-play-overlay-p2');
  if(ov){ ov.style.display = 'flex'; }
}
function closeHowToPlayP2(){
  var ov = document.getElementById('how-to-play-overlay-p2');
  if(ov){ ov.style.display = 'none'; }
}
function showHowToPlayBtnP2(){
  var btn = document.getElementById('how-to-play-btn-p2');
  if(btn) btn.style.display = 'block';
}
function hideHowToPlayBtnP2(){
  var btn = document.getElementById('how-to-play-btn-p2');
  if(btn) btn.style.display = 'none';
  closeHowToPlayP2();
}

 // 첫 방 진입 여부 플래그

function gotoR1(){
  show('s-r1');
  showHowToPlayBtn();
  updateDots();
  // r1 이동 버튼 펄스 ON, r2 버튼 펄스 OFF
  setMovePulse('move-btn-r1', true);
  setMovePulse('move-btn-r2', false);
  if(_r1FirstVisit){
    _r1FirstVisit = false;
    showNavTooltip();
  }
}

function gotoR2(){
  // 툴팁이 떠 있으면 즉시 제거
  var tip = document.getElementById('nav-tooltip');
  if(tip) tip.style.display = 'none';
  show('s-r2');
  showHowToPlayBtn();
  updateDots();
  checkMeetBtn();
  // r2 이동 버튼 펄스 ON, r1 버튼 펄스 OFF
  setMovePulse('move-btn-r2', true);
  setMovePulse('move-btn-r1', false);
}

function setMovePulse(id, on){
  var btn = document.getElementById(id);
  if(!btn) return;
  if(on) btn.classList.add('pulse-on');
  else   btn.classList.remove('pulse-on');
}

function stopMovePulse(){
  setMovePulse('move-btn-r1', false);
  setMovePulse('move-btn-r2', false);
}

function showNavTooltip(){
  var tip = document.getElementById('nav-tooltip');
  if(!tip) return;
  tip.style.display = 'block';
  tip.classList.remove('hiding');
  // 3.5초 후 페이드아웃
  setTimeout(function(){
    tip.classList.add('hiding');
    tip.addEventListener('animationend', function(){
      tip.style.display = 'none';
      tip.classList.remove('hiding');
    }, {once: true});
  }, 3500);
}
 
function correctCount(){
  return Object.values(G.collected).filter(function(c){ return c.correct; }).length;
}
 
function updateDots(){
  var cnt = correctCount();
  ['dr1','dr2'].forEach(function(did){
    var el = document.getElementById(did);
    if(!el) return;
    el.innerHTML = CORRECT_IDS.map(function(_,i){
      return '<div class="dot '+(i<cnt?'done':'')+'"></div>';
    }).join('');
  });
  document.getElementById('cnt1').textContent = cnt;
  document.getElementById('cnt2').textContent = cnt;
}
 
function checkMeetBtn(){
  var ok = correctCount() >= 6;
  var mw1 = document.getElementById('meet-wrap-r1');
  var mw2 = document.getElementById('meet-wrap');
  if(mw1) mw1.style.display = ok ? 'block' : 'none';
  if(mw2) mw2.style.display = ok ? 'block' : 'none';
}
 
// ── 팝업 열기 ──
function openPop(id, room){
  if(G.collected[id]) return;
  var cl = CLUES[id];
  G.activePop = id; G.activeRoom = room;
  var ovId = 'ov'+room;
  document.getElementById(ovId+'-tag').textContent = cl.tag;
  document.getElementById(ovId+'-title').textContent = '';
  var body = document.getElementById(ovId+'-body');
  body.textContent = cl.spy;
  body.className = 'pop-body';
  document.getElementById(ovId).style.display = 'flex';
}
 
function closePop(room){
  document.getElementById('ov'+room).style.display = 'none';
  G.activePop = null;
}
 
function collect(room){
  if(!G.activePop) return;
  var id = G.activePop;
  var cl = CLUES[id];
  closePop(room);
 
  if(cl.correct){
    G.collected[id] = {correct:true, ts:Date.now(), room:room};
    var hs = document.getElementById('h-'+id);
    if(hs){
      hs.classList.remove('passed');
      hs.classList.add('collected');
      hs.style.pointerEvents='none';
      if(hs.tagName && hs.tagName.toLowerCase()==='svg'){
        var chk = document.createElementNS('http://www.w3.org/2000/svg','text');
        chk.setAttribute('x','50');chk.setAttribute('y','55');
        chk.setAttribute('text-anchor','middle');chk.setAttribute('dominant-baseline','middle');
        chk.setAttribute('font-size','40');chk.setAttribute('fill','#00ff88');
        chk.setAttribute('font-weight','900');chk.textContent='✓';
        hs.appendChild(chk);
      }
    }
    updateDots();
    checkMeetBtn();
  } else {
    var msgs = [
      '과연 이걸로\n일루셔니스트 게임즈가 무너질까?',
      '이걸로 충분할까...',
      '다시 한번 생각해보자'
    ];
    var msg = msgs[Math.floor(Math.random()*msgs.length)];
    var toast = document.getElementById('wrong-toast');
    var toastMsg = document.getElementById('wrong-toast-msg');
    if(toast && toastMsg){
      toastMsg.style.whiteSpace = 'pre-line';
      toastMsg.style.fontSize = 'clamp(14px,5vw,24px)';
      toastMsg.textContent = msg;
      toast.style.display = 'flex';
      setTimeout(function(){ toast.style.display = 'none'; }, 500);
    }
  }
}
 
// ── 빅보스 씬 ──
var BOSS = [
  {t:'line', tx:'어두운 주차장. 검은 차 안.'},
  {t:'line', tx:'데빌 게임즈 빅보스가 기다리고 있다.'},
  {t:'line', tx:'클루 6개를 모두 전달했다.'},
  {t:'clear'},
  {t:'dlg',  sp:'빅보스 (데빌 게임즈)', tx:'수고했어. 역시 소문대로군. 믿을 만해.'},
  {t:'sp'},
  {t:'switch-gun'},
  {t:'dlg',  sp:'빅보스 (데빌 게임즈)', tx:'그런데… 아쉽지만 미안.', red:true},
  {t:'dlg',  sp:'빅보스 (데빌 게임즈)', tx:'증인을 남겨둘 수 없거든.', red:true},
  {t:'clear'},
  {t:'line', tx:'"약속과 다르잖아! 살려줘!"', red:true},
  {t:'line', tx:'으아아아아아아악!!!', red:true},
  {t:'line', tx:'소리를 지르며 눈을 가린다', red:true},
  {t:'next', go:'awake'}
];
 
function gotoBoss(){
  G.bossStep = 0;
  hideHowToPlayBtn();
  document.getElementById('boss-lines').innerHTML = '';
  var meet = document.getElementById('boss-img-meet');
  var gun  = document.getElementById('boss-img-gun');
  if(meet) meet.style.opacity='1';
  if(gun)  gun.style.opacity='0';
  // 🔊 phase1 BGM → awake BGM 전환
  stopBgm();
  playBgm('awake');
  show('s-boss');
  addBossStep();
}
 
function addBossStep(){
  var step = BOSS[G.bossStep];
  if(!step) return;
  if(step.t === 'next'){ startAwake(); return; }
  var el = document.getElementById('boss-lines');
 
  if(step.t === 'clear'){
    el.innerHTML = '';
    G.bossStep++;
    addBossStep();
    return;
  } else if(step.t === 'switch-gun'){
    var meet = document.getElementById('boss-img-meet');
    var gun  = document.getElementById('boss-img-gun');
    if(meet) meet.style.opacity = '0';
    if(gun)  gun.style.opacity  = '1';
    setTimeout(function(){ G.bossStep++; addBossStep(); }, 800);
    return;
  } else if(step.t === 'line'){
    var d = document.createElement('div');
    d.className = 'cl on em';
    d.style.color = step.red ? '#E8192C' : '#ddd';
    d.style.textShadow = '0 1px 8px rgba(0,0,0,.8)';
    d.textContent = step.tx;
    el.appendChild(d);
    // 🔊 '눈을 가린다' 텍스트 등장 시 총소리 1회
    if(step.tx && step.tx.indexOf('눈을 가린다') !== -1){
      playSfx('gun');
    }
  } else if(step.t === 'dlg'){
    var box = document.createElement('div');
    box.className = 'dlg';
    box.style.width = '90%';
    box.style.background = 'rgba(0,0,0,.75)';
    box.innerHTML = '<div class="dlg-sp" style="color:rgba(255,255,255,.5)">'+step.sp+'</div><div class="dlg-tx" style="color:'+(step.red?'#ff6b6b':'#eee')+'">'+step.tx+'</div>';
    el.appendChild(box);
  } else if(step.t === 'sp'){
    var sp = document.createElement('div');
    sp.style.height = '12px';
    el.appendChild(sp);
  }
}
 
function nextBoss(){
  G.bossStep++;
  addBossStep();
}
 
// ── 각성 씬 ──
var AWAKE = [
  {t:'glitch'},
  {t:'sil'},
  {t:'dlg-cat', img:'surp', sp:'비서 이노', tx:'대표님, 괜찮으세요?'},
  {t:'room-reveal'},
  {t:'line', tx:'(서서히 눈을 뜬다)', white:true},
  {t:'line', tx:'"여기는..일루셔니스트 게임즈 CEO 집무실이다"', white:true},
  {t:'line', tx:'"뭐지…? 꿈이었던 건가?"'},
  {t:'dlg-cat', img:'surp', sp:'비서 이노', tx:'대표님, 정신이 좀 드세요?\n갑자기 꾸벅꾸벅 주무시길래 깜짝 놀랐잖아요!'},
  {t:'line', tx:'"꿈이었구나…"', white:true},
  {t:'line', tx:'"꿈이었지만...\n일루셔니스트 게임즈의 약점들...\n대표로서 무시할 수 없는 현실이었어."', white:true},
  {t:'line', tx:'"일루셔니스트 게임즈 대표로서\n지금부터 내가 해결해야 할 과제들이야"'},
  {t:'dlg-cat', img:'smile', sp:'비서 이노', tx:'대표님, 그럼 결재 6건은 천천히 보시고\n다시 결재 부탁드릴게요~ 😊'},
  {t:'cat-exit'},
  {t:'line', tx:'"꿈에서 봤던 6개의 약점들...\n사실은 내가 해야할 의사결정들이었구나!"', white:true},
  {t:'line', tx:'"좋아, 그럼 의사결정을 시작 해볼까?\n일루셔니스트 게임즈 대표로서!"', white:true},
  {t:'next'}
];
 
function startAwake(){
  G.awakeStep = 0;
  document.getElementById('awake-lines').innerHTML = '';
  show('s-awake');
  addAwakeStep();
}
 
function addAwakeStep(){
  var step = AWAKE[G.awakeStep];
  if(!step) return;
  if(step.t === 'next'){ startP2(); return; }
  var el = document.getElementById('awake-lines');
  el.innerHTML = '';
 
  if(step.t === 'glitch'){
    // 🔊 BLACKSITE 화면 등장 → awake BGM 정지
    stopBgm();
    var g = document.createElement('div');
    g.className='glitch'; g.setAttribute('data-t','BLACKSITE'); g.textContent='BLACKSITE';
    el.appendChild(g);
    var s = document.createElement('div');
    s.style.cssText='font-family:monospace;font-size:10px;color:#444;letter-spacing:.15em;margin-top:8px';
    s.textContent='SIMULATION TERMINATED';
    el.appendChild(s);
    var n1=document.createElement('div'); n1.className='noise'; el.appendChild(n1);
    var n2=document.createElement('div'); n2.className='noise'; n2.style.opacity='.4'; el.appendChild(n2);
 
  } else if(step.t === 'sil'){
    var d=document.createElement('div'); d.className='cl on'; d.textContent='. . .'; el.appendChild(d);
 
  } else if(step.t === 'room-reveal'){
    var bg = document.getElementById('awake-cin');
    var p2img = document.querySelector('#s-p2 img');
    bg.style.backgroundImage = 'linear-gradient(rgba(0,0,0,.6),rgba(0,0,0,.6)), url('+(p2img ? p2img.src : 'images/room_p2.jpg')+')';
    bg.style.backgroundSize = 'cover';
    bg.style.backgroundPosition = 'center';

 
  } else if(step.t === 'line'){
    var d=document.createElement('div');
    d.className='cl on em'; d.style.whiteSpace='pre-line'; d.textContent=step.tx;
    if(step.white) d.style.color='#fff'; else d.style.color='rgba(255,255,255,.8)';
    el.appendChild(d);
 
  } else if(step.t === 'dlg-cat'){
    // 🔊 비서 이노 첫 등장("대표님, 괜찮으세요?") → phase2 BGM 시작
    if(_currentBgm !== 'phase2') playBgm('phase2');
    var cin = document.getElementById('awake-cin');
    cin.style.backgroundImage = '';
    cin.style.backgroundColor = '#000';
 
    var wrap = document.createElement('div');
    wrap.className = 'cat-wrap';
 
    var img = document.createElement('img');
    img.className = 'cat-img ' + (step.img==='smile' ? 'img-cat-smile' : 'img-cat-surp');
    img.src = step.img==='smile' ? 'images/cat_smile.jpg' : 'images/cat_surp.jpg';
    img.alt = step.img==='smile' ? '웃는 고양이 비서' : '놀란 고양이 비서';
    wrap.appendChild(img);
 
    var overlay = document.createElement('div');
    overlay.className = 'cat-dialog-overlay';
    var box = document.createElement('div');
    box.className = 'dlg';
    box.style.cssText = 'width:100%;margin:0;white-space:pre-line;background:rgba(0,0,0,.6);border-color:rgba(255,255,255,.15)';
    box.innerHTML = '<div class="dlg-sp">' + step.sp + '</div><div class="dlg-tx">' + step.tx + '</div>';
    overlay.appendChild(box);
    wrap.appendChild(overlay);
 
    el.appendChild(wrap);
 
  } else if(step.t === 'cat-exit'){
    var d=document.createElement('div');
    d.className='cl on em'; d.style.color='rgba(255,255,255,.45)'; d.style.fontSize='12px';
    d.textContent='— 비서가 방을 나간다 —';
    el.appendChild(d);
    document.getElementById('awake-tap').style.display='block';
  }
}
 
function nextAwake(){
  G.awakeStep++;
  addAwakeStep();
}
 
// ── 2페이즈 ──
function startP2(){
  stopMovePulse(); // 1페이즈 이동 버튼 펄스 종료
  G.p2Queue = Object.keys(G.collected).filter(function(id){return G.collected[id].correct;});
  G.p2Queue.sort(function(a,b){ return CORRECT_IDS.indexOf(a) - CORRECT_IDS.indexOf(b); });
  G.choices = {};
  // 🔊 phase2 BGM은 각성씬 비서 이노 등장 시 이미 시작됨
  show('s-p2');
  showHowToPlayBtnP2();
  buildP2Grid();
  document.getElementById('p2-badge').textContent = '0/'+G.p2Queue.length;
  document.getElementById('p2-txt').textContent = '과제를 선택해 해결 방법을 결정하세요';
}
 
function buildP2Grid(){
  var grid = document.getElementById('p2-grid');
  grid.innerHTML = '';
  G.p2Queue.forEach(function(id, idx){
    var cl = CLUES[id];
    var card = document.createElement('div');
    card.id = 'p2-card-'+id;
    card.style.cssText = [
      'background:rgba(20,20,40,.88)',
      'border:1.5px solid rgba(245,166,35,.35)',
      'border-radius:10px',
      'padding:10px 10px 8px',
      'cursor:pointer',
      'transition:border-color .15s,transform .1s',
      'display:flex',
      'flex-direction:column',
      'gap:5px',
      'min-height:80px'
    ].join(';');
    card.innerHTML = [
      '<div style="font-size:10px;color:rgba(245,166,35,.7);letter-spacing:.06em">CLUE</div>',
      '<div style="font-size:12px;color:#fff;font-weight:600;line-height:1.4">'+cl.tag.replace(/CLU-\d+ · /,'')+'</div>',
      '<div id="p2-status-'+id+'" style="font-size:11px;color:rgba(255,255,255,.3);margin-top:auto">미결정</div>'
    ].join('');
    card.onclick = (function(cid){ return function(){ openP2Clue(cid); }; })(id);
    if(idx === 0){
      card.style.animation = 'cardPulse 1.4s ease-in-out infinite';
    }
    grid.appendChild(card);
  });
}
 
function openP2Clue(id){
  var card = document.getElementById('p2-card-'+id);
  if(card) card.style.animation = 'none';
 
  var cl = CLUES[id];
  document.getElementById('pp2-tag').textContent = cl.tag;
  document.getElementById('pp2-q').textContent = cl.q;
 
  var list = document.getElementById('pp2-choices');
  list.innerHTML = '';
 
  var prev = G.choices[id];

  // 보기 순서 랜덤 셔플 (원본 배열은 건드리지 않음)
  var shuffled = cl.choices.map(function(ch, i){ return {ch: ch, origIdx: i}; });
  if(Math.random() < 0.5){ shuffled = [shuffled[1], shuffled[0]]; }

  shuffled.forEach(function(item, displayIdx){
    var ch = item.ch;
    var origIdx = item.origIdx;
    // 이전에 선택한 보기가 이 칸인지 origIdx 기준으로 확인
    var isSelected = prev && prev.origIdx === origIdx;
    var btn = document.createElement('button');
    btn.className = 'ch-btn' + (isSelected ? (ch.s>0?' sel':' trap') : '');
    btn.textContent = (displayIdx===0?'A. ':'B. ') + ch.txt;
    btn.onclick = (function(cid, oi, cs){ return function(){
      // origIdx와 score를 함께 저장
      G.choices[cid] = {origIdx: oi, score: cs, ts: Date.now()};
      list.querySelectorAll('.ch-btn').forEach(function(b, j){
        b.className = 'ch-btn' + (j===displayIdx ? (cs>0?' sel':' trap') : '');
      });
      setTimeout(function(){
        document.getElementById('ov-p2').style.display='none';
        updateP2Card(cid, oi, cs);
        updateP2Progress();
        var next = G.p2Queue.find(function(nid){ return !G.choices[nid]; });
        if(next){
          var nc = document.getElementById('p2-card-'+next);
          if(nc) nc.style.animation = 'cardPulse 1.4s ease-in-out infinite';
        }
      }, 450);
    };})(id, origIdx, ch.s);
    list.appendChild(btn);
  });
 
  var ov = document.getElementById('ov-p2');
  ov.style.display='flex';
  // overlay 배경 클릭 시 팝업 닫기 (카드 그리드로 돌아가기)
  ov.onclick = function(e){
    if(e.target === ov){ ov.style.display='none'; ov.onclick=null; }
  };
}
 
function updateP2Card(id, choiceIdx, score){
  var status = document.getElementById('p2-status-'+id);
  var card = document.getElementById('p2-card-'+id);
  if(!status || !card) return;
  status.textContent = '✓ 결재 완료';
  status.style.color = '#00ff88';
  card.style.borderColor = 'rgba(0,255,136,.4)';
  card.style.animation = 'none';
}
 
function revealP2Results(){
  G.p2Queue.forEach(function(id){
    var ch = G.choices[id];
    if(!ch) return;
    var status = document.getElementById('p2-status-'+id);
    var card = document.getElementById('p2-card-'+id);
    if(!status || !card) return;
    if(ch.score > 0){
      status.textContent = '✓ 혁신 방향 선택';
      status.style.color = '#00ff88';
      card.style.borderColor = 'rgba(0,255,136,.5)';
    } else {
      status.textContent = '⚠ 재고 필요';
      status.style.color = '#ff6b6b';
      card.style.borderColor = 'rgba(232,25,44,.4)';
    }
  });
}
 
function updateP2Progress(){
  var done = Object.keys(G.choices).length;
  var total = G.p2Queue.length;
  document.getElementById('p2-badge').textContent = done+'/'+total;
  document.getElementById('p2-txt').textContent = done+'/'+total+' 결정 완료';
  if(done >= total && total > 0){
    setTimeout(function(){
      document.getElementById('ov-submit').style.display='flex';
    }, 600);
  }
}
 
function closeSubmitPop(){
  document.getElementById('ov-submit').style.display='none';
}
 
function doSubmit(){
  document.getElementById('ov-submit').style.display='none';
  hideHowToPlayBtnP2();
  revealP2Results();
  // 🔊 phase2 BGM 정지 → 컷씬 시작
  stopBgm();
  // 800ms 후 컷씬 시작
  setTimeout(function(){
    show('s-cutscene');
    csStart();
  }, 800);
}
 
// ── 점수 계산 ──
function calcResult(){
  var p2=0;
  Object.entries(G.choices).forEach(function(e){
    var ch=e[1];
    p2 += ch.score;
  });
  p2 = Math.min(30, p2);
 
  var total = Math.max(0, Math.min(30, p2));
  var grade = total>=30?'S':total>=20?'A':total>=15?'B':total>=10?'C':'D';
 
  saveLog(total, grade);
 
  var gColors = {S:'#9E4AE7',A:'#00cc66',B:'#F5A623',C:'#ff8c42',D:'#E8192C'};
  var gTitles = {
    S:'혁신 리더의 탄생',
    A:'성공: 올해의 기업 선정',
    B:'간신히, 그러나 아직 멀었다',
    C:'실패: 경쟁사에 뒤처지다',
    D:'실패: 상장폐지 위기'
  };
  var gBodies = {
    S: '일루셔니스트 게임즈 컴퍼니, 업계 최초 2년 연속 \'올해의 기업\' 선정. ' + G.name + ' CEO의 결단력 있는 혁신 추진이 업계의 주목을 받았습니다. 신규 프로젝트는 출시 6개월 만에 시장 점유율 1위를 달성했습니다.',
    A: '일루셔니스트 게임즈 컴퍼니가 \'올해의 기업\'으로 선정되며 눈부신 성과를 달성했습니다. ' + G.name + ' CEO가 이끄는 일루셔니스트 게임즈는 내부 혁신 과제를 하나씩 해결하며 업계 신뢰를 회복했습니다.',
    B: '일루셔니스트 게임즈는 올해 위기를 넘겼습니다. 하지만 \'올해의 기업\'은 데빌 게임즈가 차지했습니다. 일부 과제는 방향이 맞았지만, 혁신적인 성과는 여전히 아쉽다는 평가를 받았습니다.',
    C: '경쟁사 데빌 게임즈가 \'올해의 기업\'으로 선정되었습니다.\n일루셔니스트 게임즈는 주가 하락과 시장 점유율 감소를 기록 중입니다.\n혁신하지 못하고 과거의 선택을 반복한 결과입니다.',
    D: '경쟁사 데빌 게임즈가 \'올해의 기업\'으로 선정되며 눈부신 성과를 달성했고, 한편 쌍두마차였던 일루셔니스트 게임즈는 경영난을 극복하지 못하고 상장폐지 위기에 놓였습니다.'
  };
 
  document.getElementById('r-grade').textContent = grade;
  document.getElementById('r-grade').style.color = gColors[grade];
  document.getElementById('r-score').textContent = total+'점 / 30점';
  document.getElementById('r-title').textContent = gTitles[grade];
  document.getElementById('r-body').textContent = gBodies[grade];

  var gradeImages = {
    S: 'images/sgrade.png',
    A: 'images/agrade.png',
    B: 'images/bgrade.png',
    C: 'images/cgrade.png',
    D: 'images/dgrade.png'
  };
  var gradeImg = document.getElementById('r-grade-img');
  if(gradeImg){
    gradeImg.src = gradeImages[grade];
    gradeImg.alt = grade + '등급 결과 이미지';
  }
 
  show('s-result');
}
 
// ── 로그 저장 (Supabase 연동) ──
function saveLog(score, grade){
  var logData = {
    name: G.name,
    start_time: new Date(G.startTime).toISOString(),
    total_sec: Math.round((Date.now()-G.startTime)/1000),
    collected: JSON.stringify(G.collected),
    choices: JSON.stringify(G.choices),
    score: score,
    grade: grade
  };
 
  // Supabase에 저장
  fetch(SUPABASE_URL + '/rest/v1/ktc_logs', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': 'Bearer ' + SUPABASE_KEY,
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify(logData)
  }).catch(function(e){ console.warn('Supabase 저장 실패:', e); });
}
 
// ── 다시하기 ──
function restartAll(){
  // 🔊 모든 사운드 초기화 → title BGM 복귀
  stopBgm();
  playBgm('title');
  G = {name:'',startTime:0,collected:{},choices:{},activePop:null,activeRoom:0,bossStep:0,awakeStep:0,p2Queue:[],p2Cursor:0};
  document.getElementById('inp-name').value='';
  document.getElementById('brief-go').style.display='none';
  document.querySelectorAll('.cl').forEach(function(el){el.classList.remove('on');});
  document.getElementById('boss-lines').innerHTML='';
  document.getElementById('awake-lines').innerHTML='';
  var bg=document.getElementById('awake-cin');
  if(bg) bg.style.backgroundImage='';
  document.getElementById('awake-tap').style.display='block';
  var meet=document.getElementById('boss-img-meet');
  var gun=document.getElementById('boss-img-gun');
  if(meet) meet.style.opacity='1';
  if(gun)  gun.style.opacity='0';
  // 일반 핫스팟 초기화
  document.querySelectorAll('.hs').forEach(function(h){
    h.classList.remove('collected','passed','wrong-flash','done');
    h.style.pointerEvents='';
  });
  // SVG 핫스팟 초기화 (✓ 텍스트 제거 포함)
  document.querySelectorAll('.hs-svg').forEach(function(h){
    h.classList.remove('collected');
    h.style.pointerEvents='';
    var chk=h.querySelector('text');
    if(chk) chk.remove();
  });
  var mw1=document.getElementById('meet-wrap-r1');
  var mw2=document.getElementById('meet-wrap');
  if(mw1) mw1.style.display='none';
  if(mw2) mw2.style.display='none';
  document.getElementById('ov-submit').style.display='none';
  document.getElementById('r-extra').style.display='none';
  // 첫 방문 툴팁 플래그 초기화
  _r1FirstVisit = true;
  stopMovePulse();
  hideHowToPlayBtn();
  hideHowToPlayBtnP2();
  // 시작하기 버튼 복원, 로그인 필드 숨기기
  var btnEnter = document.getElementById('btn-enter');
  var loginFields = document.getElementById('login-fields');
  if(btnEnter) btnEnter.style.display = 'block';
  if(loginFields) loginFields.style.display = 'none';
  show('s-intro');
}
 
function restartP2(){
  // 🔊 phase2 BGM 복귀
  stopBgm();
  playBgm('phase2');
  G.choices={};
  G.p2Queue = Object.keys(G.collected).filter(function(id){return G.collected[id].correct;});
  G.p2Queue.sort(function(a,b){ return CORRECT_IDS.indexOf(a) - CORRECT_IDS.indexOf(b); });
  var subBar = document.getElementById('sub-bar');
  if(subBar) subBar.style.display='none';
  var ovSubmit = document.getElementById('ov-submit');
  if(ovSubmit) ovSubmit.style.display='none';
  show('s-p2');
  showHowToPlayBtnP2();
  buildP2Grid();
  var badge = document.getElementById('p2-badge');
  var txt = document.getElementById('p2-txt');
  if(badge) badge.textContent='0/'+G.p2Queue.length;
  if(txt) txt.textContent='과제를 선택해 해결 방법을 결정하세요';
}
