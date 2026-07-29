// ── Supabase 설정 (game.js와 동일하게 입력하세요) ──
var SUPABASE_URL = 'https://ypdiwxklslaeqxjcwtzs.supabase.co';
var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlwZGl3eGtsc2xhZXF4amN3dHpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5ODA0ODUsImV4cCI6MjA5NjU1NjQ4NX0.xkUGLsL8WKwskm0kqZymsdawowZvn2N9lBVj1e2-eB4';

// 단계 순서 (game.js의 CHECKPOINT_STEPS와 동일하게 맞춰주세요)
var STAGE_ORDER = [
  {key:'페이지 접속',              label:'페이지 접속'},
  {key:'이름 입력 완료',            label:'이름 입력'},
  {key:'대회의실 입장',             label:'대회의실'},
  {key:'집무실 입장',               label:'집무실'},
  {key:'스파이 미팅(보스씬) 진입',   label:'미팅(보스씬)'},
  {key:'눈 뜸(각성씬) 진입',        label:'각성씬'},
  {key:'Phase2(의사결정) 진입',     label:'Phase2'},
  {key:'Phase2 제출·컷씬 시작',     label:'제출/컷씬'},
  {key:'완료(결과 화면)',           label:'완료'}
];
var STAGE_INDEX = {};
STAGE_ORDER.forEach(function(s,i){ STAGE_INDEX[s.key] = i; });
var DROP_THRESHOLD_MS = 15 * 60 * 1000; // 15분 이상 활동 없으면 "이탈 확정"으로 간주

function openAdmin(){
  var id = prompt('아이디');
  if(id !== 'kill'){ alert('아이디 또는 비밀번호가 틀렸습니다.'); return; }
  var pw = prompt('비밀번호');
  if(pw !== 'thecompany'){ alert('아이디 또는 비밀번호가 틀렸습니다.'); return; }
  var expire = Date.now() + 24*60*60*1000;
  sessionStorage.setItem('ktc_admin', expire);
  showAdminPage();
}

function showAdminPage(){
  var headers = { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY };

  var logsP = fetch(SUPABASE_URL + '/rest/v1/ktc_logs?order=start_time.desc', { headers: headers })
    .then(function(res){ return res.json(); })
    .then(function(data){ return Array.isArray(data) ? data : []; })
    .catch(function(e){ console.error('ktc_logs 조회 실패:', e); return []; });

  var sessP = fetch(SUPABASE_URL + '/rest/v1/ktc_sessions?order=started_at.desc', { headers: headers })
    .then(function(res){ return res.json(); })
    .then(function(data){ return Array.isArray(data) ? data : []; })
    .catch(function(e){ console.warn('ktc_sessions 조회 실패(테이블이 아직 없을 수 있음):', e); return null; });

  Promise.all([logsP, sessP]).then(function(r){
    renderAdmin(r[0], r[1]);
  }).catch(function(e){
    alert('데이터를 불러오지 못했습니다. Supabase 설정을 확인하세요.');
    console.error(e);
  });
}

function clearLogs(){
  if(!confirm('완주 로그를 모두 삭제할까요?\n이 작업은 되돌릴 수 없습니다.')) return;
  fetch(SUPABASE_URL + '/rest/v1/ktc_logs?id=gte.0', {
    method: 'DELETE',
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY }
  })
  .then(function(){ location.reload(); })
  .catch(function(e){ alert('삭제 실패: ' + e); });
}

function clearSessions(){
  if(!confirm('접속/이탈 로그를 모두 삭제할까요?\n이 작업은 되돌릴 수 없습니다.')) return;
  fetch(SUPABASE_URL + '/rest/v1/ktc_sessions?session_id=neq.__none__', {
    method: 'DELETE',
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY }
  })
  .then(function(){ location.reload(); })
  .catch(function(e){ alert('삭제 실패: ' + e); });
}

// ── 세션 데이터 가공 ──
function classifySessions(sessions){
  var now = Date.now();
  return sessions.map(function(s){
    var idx = (STAGE_INDEX[s.last_checkpoint] !== undefined) ? STAGE_INDEX[s.last_checkpoint] : 0;
    var startedAt = s.started_at ? new Date(s.started_at).getTime() : now;
    var lastAt = s.last_checkpoint_at ? new Date(s.last_checkpoint_at).getTime() : startedAt;
    var elapsedSec = Math.max(0, Math.round((lastAt - startedAt)/1000));
    var state;
    if(s.status === 'completed') state = 'completed';
    else if(now - lastAt > DROP_THRESHOLD_MS) state = 'dropped';
    else state = 'active';
    return { raw: s, stageIdx: idx, elapsedSec: elapsedSec, lastAt: lastAt, state: state };
  });
}

function fmtDuration(sec){
  if(sec === null || sec === undefined || isNaN(sec) || sec < 0) return '-';
  var h = Math.floor(sec/3600), m = Math.floor((sec%3600)/60), s = Math.floor(sec%60);
  if(h > 0) return h + '시간 ' + m + '분';
  if(m > 0) return m + '분 ' + s + '초';
  return s + '초';
}

function fmtDate(v){
  return v ? new Date(v).toLocaleString('ko-KR') : '-';
}

function renderAdmin(logs, sessions){
  function gc(g){ return g==='S'||g==='A'?'#00aa44':g==='B'?'#ff9900':'#cc3333'; }

  // CLU1~CLU6 각 선택값 추출 함수
  function getChoiceForClu(l, cluNum){
    var ch = typeof l.choices === 'string' ? JSON.parse(l.choices||'{}') : (l.choices||{});
    var key = cluNum < 10 ? '0' + cluNum : String(cluNum);
    if(ch[key] === undefined) return '-';
    var score = ch[key] && ch[key].score > 0;
    return score ? '혁신O' : '혁신X';
  }

  // CLU1~CLU6 셀 생성
  function choiceCells(l){
    var cells = '';
    for(var i = 1; i <= 6; i++){
      var val = getChoiceForClu(l, i);
      var color = val === '혁신O' ? '#00aa44' : val === '혁신X' ? '#cc3333' : '#aaa';
      cells += '<td style="font-size:12px;text-align:center;color:' + color + ';font-weight:700">' + val + '</td>';
    }
    return cells;
  }

  var rows = logs.map(function(l, i){
    return [
      '<tr>',
      '<td>' + (i+1) + '</td>',
      '<td style="font-weight:700">' + l.name + '</td>',
      '<td>' + (l.start_time ? new Date(l.start_time).toLocaleString('ko-KR') : '-') + '</td>',
      '<td>' + Math.floor((l.total_sec||0)/60) + '분 ' + ((l.total_sec||0)%60) + '초</td>',
      '<td style="font-size:22px;font-weight:900;color:' + gc(l.grade) + ';text-align:center">' + l.grade + '</td>',
      '<td style="font-weight:700;text-align:center">' + l.score + '점</td>',
      choiceCells(l),
      '</tr>'
    ].join('');
  }).join('');

  // ── 접속/이탈 분석 데이터 가공 ──
  var hasSessionTable = sessions !== null;
  var classified = hasSessionTable ? classifySessions(sessions) : [];
  var totalAccess = classified.length;
  var completedCnt = classified.filter(function(c){ return c.state==='completed'; }).length;
  var droppedCnt = classified.filter(function(c){ return c.state==='dropped'; }).length;
  var activeCnt = classified.filter(function(c){ return c.state==='active'; }).length;
  var dropRate = totalAccess > 0 ? Math.round((droppedCnt/totalAccess)*1000)/10 : 0;

  // 퍼널: 각 단계 idx 이상에 도달한 인원 수
  var funnelCounts = STAGE_ORDER.map(function(_, i){
    return classified.filter(function(c){ return c.stageIdx >= i; }).length;
  });

  // 이탈자만 정렬 (최근 활동 순)
  var droppedList = classified.filter(function(c){ return c.state==='dropped'; })
    .sort(function(a,b){ return b.lastAt - a.lastAt; });
  var activeList = classified.filter(function(c){ return c.state==='active'; })
    .sort(function(a,b){ return b.lastAt - a.lastAt; });

  function sessionRow(c, i){
    var s = c.raw;
    var stageLabel = (STAGE_ORDER[c.stageIdx] && STAGE_ORDER[c.stageIdx].label) || s.last_checkpoint || '-';
    var stateBadge = c.state === 'dropped'
      ? '<span style="color:#cc3333;font-weight:700">이탈 확정</span>'
      : '<span style="color:#f5a623;font-weight:700">진행중</span>';
    return [
      '<tr>',
      '<td>' + (i+1) + '</td>',
      '<td style="font-weight:700">' + (s.player_name || '<span style="color:#bbb">(미입력)</span>') + '</td>',
      '<td>' + stageLabel + '</td>',
      '<td>' + (s.collected_count != null ? s.collected_count : '-') + ' / 6</td>',
      '<td>' + fmtDate(s.started_at) + '</td>',
      '<td>' + fmtDate(s.last_checkpoint_at) + '</td>',
      '<td>' + fmtDuration(c.elapsedSec) + '</td>',
      '<td>' + stateBadge + '</td>',
      '</tr>'
    ].join('');
  }

  var droppedRows = droppedList.map(sessionRow).join('');
  var activeRows = activeList.map(sessionRow).join('');

  var funnelRows = STAGE_ORDER.map(function(stage, i){
    var cnt = funnelCounts[i];
    var pct = totalAccess > 0 ? Math.round((cnt/totalAccess)*1000)/10 : 0;
    var dropHere = (i < STAGE_ORDER.length-1) ? (funnelCounts[i] - funnelCounts[i+1]) : 0;
    return [
      '<tr>',
      '<td style="text-align:left;font-weight:700">' + stage.label + '</td>',
      '<td style="text-align:center">' + cnt + '명</td>',
      '<td style="text-align:center">' + pct + '%</td>',
      '<td style="text-align:center;color:#cc3333">' + (dropHere>0 ? '-' + dropHere + '명' : '-') + '</td>',
      '</tr>'
    ].join('');
  }).join('');

  // 엑셀 다운로드용 스크립트 (완주 로그 + 접속/이탈 로그 각각)
  var downloadScript = [
    '// SheetJS로 진짜 .xlsx 생성',
    'function downloadExcel(){',
    '  var header = ["#","이름","접속시각","플레이시간","등급","점수","CLU1","CLU2","CLU3","CLU4","CLU5","CLU6"];',
    '  var data = [header];',
    '  document.querySelectorAll("#tbl-completed tbody tr").forEach(function(tr){',
    '    var tds = tr.querySelectorAll("td");',
    '    if(!tds.length) return;',
    '    var row = [];',
    '    for(var i=0;i<tds.length;i++){ row.push(tds[i].innerText.trim()); }',
    '    data.push(row);',
    '  });',
    '  var ws = XLSX.utils.aoa_to_sheet(data);',
    '  ws["!cols"] = [',
    '    {wch:4},{wch:12},{wch:20},{wch:12},{wch:6},{wch:6},',
    '    {wch:7},{wch:7},{wch:7},{wch:7},{wch:7},{wch:7}',
    '  ];',
    '  var wb = XLSX.utils.book_new();',
    '  XLSX.utils.book_append_sheet(wb, ws, "플레이로그");',
    '  XLSX.writeFile(wb, "ktc_logs_" + new Date().toISOString().slice(0,10) + ".xlsx");',
    '}',
    '',
    'function downloadSessionsExcel(){',
    '  var header = ["#","이름","마지막 도달 지점","클루 수집","접속시각","마지막 활동","소요시간","상태"];',
    '  var data = [header];',
    '  document.querySelectorAll("#tbl-dropout tbody tr, #tbl-active tbody tr").forEach(function(tr){',
    '    var tds = tr.querySelectorAll("td");',
    '    if(!tds.length) return;',
    '    var row = [];',
    '    for(var i=0;i<tds.length;i++){ row.push(tds[i].innerText.trim()); }',
    '    data.push(row);',
    '  });',
    '  var ws = XLSX.utils.aoa_to_sheet(data);',
    '  ws["!cols"] = [',
    '    {wch:4},{wch:12},{wch:16},{wch:10},{wch:20},{wch:20},{wch:12},{wch:10}',
    '  ];',
    '  var wb = XLSX.utils.book_new();',
    '  XLSX.utils.book_append_sheet(wb, ws, "접속이탈로그");',
    '  XLSX.writeFile(wb, "ktc_sessions_" + new Date().toISOString().slice(0,10) + ".xlsx");',
    '}',
    '',
    'function clearLogs(){',
    '  if(!confirm("완주 로그를 모두 삭제할까요?\\n이 작업은 되돌릴 수 없습니다.")) return;',
    '  fetch("' + SUPABASE_URL + '/rest/v1/ktc_logs?id=gte.0",{',
    '    method:"DELETE",',
    '    headers:{"apikey":"' + SUPABASE_KEY + '","Authorization":"Bearer ' + SUPABASE_KEY + '"}',
    '  }).then(function(){ location.reload(); })',
    '  .catch(function(e){ alert("삭제 실패: "+e); });',
    '}',
    '',
    'function clearSessions(){',
    '  if(!confirm("접속/이탈 로그를 모두 삭제할까요?\\n이 작업은 되돌릴 수 없습니다.")) return;',
    '  fetch("' + SUPABASE_URL + '/rest/v1/ktc_sessions?session_id=neq.__none__",{',
    '    method:"DELETE",',
    '    headers:{"apikey":"' + SUPABASE_KEY + '","Authorization":"Bearer ' + SUPABASE_KEY + '"}',
    '  }).then(function(){ location.reload(); })',
    '  .catch(function(e){ alert("삭제 실패: "+e); });',
    '}'
  ].join('\n');

  var adminHtml = [
    '<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8">',
    '<meta name="viewport" content="width=device-width,initial-scale=1">',
    '<script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"><\/script>',
    '<title>Kill The Company — 관리자</title>',
    '<style>',
    'body{font-family:sans-serif;padding:16px;background:#f4f4f4;font-size:14px}',
    'h1{font-size:18px;margin-bottom:4px}',
    'h2{font-size:15px;margin:26px 0 10px}',
    '.sub{font-size:12px;color:#888;margin-bottom:14px}',
    '.table-wrap{overflow-x:auto;width:100%}',
    'table{border-collapse:collapse;width:100%;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.1);min-width:900px}',
    'table.small{min-width:520px}',
    'th{background:#222;color:#fff;padding:9px 10px;text-align:center;font-size:12px;letter-spacing:.04em;white-space:nowrap}',
    'th.left{text-align:left}',
    'td{padding:9px 10px;border-bottom:1px solid #eee;vertical-align:middle;white-space:nowrap}',
    'tr:hover td{background:#f9f9f9}',
    '.summary{display:flex;gap:12px;margin-bottom:14px;flex-wrap:wrap}',
    '.sum-box{background:#fff;border-radius:8px;padding:12px 16px;box-shadow:0 1px 4px rgba(0,0,0,.08);min-width:100px;text-align:center}',
    '.sum-num{font-size:24px;font-weight:700}',
    '.sum-lbl{font-size:11px;color:#888;margin-top:2px}',
    '.btn{margin-bottom:14px;padding:8px 18px;border:none;cursor:pointer;border-radius:6px;font-size:13px;margin-right:8px}',
    '.btn-refresh{background:#222;color:#fff}',
    '.btn-excel{background:#1e7e34;color:#fff}',
    '.btn-del{background:#cc3333;color:#fff}',
    '.btn-logout{background:#888;color:#fff}',
    '.note{font-size:11.5px;color:#999;margin:-4px 0 14px}',
    '</style></head><body>',
    '<h1>Kill The Company — 관리자</h1>',
    '<button class="btn btn-refresh" onclick="location.reload()">🔄 새로고침</button>',
    '<button class="btn btn-logout" onclick="sessionStorage.removeItem(\'ktc_admin\');location.reload()">로그아웃</button>',
  ].join('');

  // ── 섹션 1: 접속/이탈 현황 ──
  adminHtml += '<h2>📊 접속 / 이탈 현황</h2>';

  if(!hasSessionTable){
    adminHtml += '<div class="note">⚠ ktc_sessions 테이블을 아직 찾을 수 없습니다. Supabase에 테이블을 생성하면 이 섹션에 데이터가 표시됩니다.</div>';
  } else {
    adminHtml += [
      '<div class="summary">',
      '<div class="sum-box"><div class="sum-num">' + totalAccess + '</div><div class="sum-lbl">총 접속</div></div>',
      '<div class="sum-box"><div class="sum-num" style="color:#00aa44">' + completedCnt + '</div><div class="sum-lbl">완주</div></div>',
      '<div class="sum-box"><div class="sum-num" style="color:#f5a623">' + activeCnt + '</div><div class="sum-lbl">진행중(15분 이내)</div></div>',
      '<div class="sum-box"><div class="sum-num" style="color:#cc3333">' + droppedCnt + '</div><div class="sum-lbl">중도 이탈</div></div>',
      '<div class="sum-box"><div class="sum-num" style="color:#cc3333">' + dropRate + '%</div><div class="sum-lbl">이탈률</div></div>',
      '</div>',
      '<div class="note">※ "이탈 확정"은 완료되지 않은 상태로 15분 이상 진행 상황 업데이트가 없는 세션을 기준으로 판단합니다. "진행중"은 아직 플레이 중일 수 있습니다.</div>',

      '<h2>🚦 단계별 이탈 퍼널</h2>',
      '<div class="table-wrap"><table class="small"><thead><tr>',
      '<th class="left">단계</th><th>도달 인원</th><th>도달율</th><th>이 구간에서 이탈</th>',
      '</tr></thead><tbody>',
      funnelRows,
      '</tbody></table></div>',

      '<h2>🚪 중도 이탈자 상세 (' + droppedCnt + '명)</h2>',
      '<button class="btn btn-excel" onclick="downloadSessionsExcel()">📥 접속/이탈 로그 엑셀 다운로드</button>',
      '<button class="btn btn-del" onclick="clearSessions()">🗑 접속/이탈 로그 초기화</button>',
      '<div class="table-wrap"><table id="tbl-dropout"><thead><tr>',
      '<th class="left">#</th><th class="left">이름</th><th class="left">마지막 도달 지점</th>',
      '<th>클루 수집</th><th class="left">접속시각</th><th class="left">마지막 활동</th>',
      '<th>소요시간</th><th>상태</th>',
      '</tr></thead><tbody>',
      (droppedRows || '<tr><td colspan="8" style="text-align:center;color:#999;padding:20px">중도 이탈로 확정된 세션이 없습니다</td></tr>'),
      '</tbody></table></div>',

      (activeCnt > 0 ? ([
        '<h2>⏳ 진행중(15분 이내 활동, 이탈 여부 미확정) — ' + activeCnt + '명</h2>',
        '<div class="table-wrap"><table id="tbl-active"><thead><tr>',
        '<th class="left">#</th><th class="left">이름</th><th class="left">현재 지점</th>',
        '<th>클루 수집</th><th class="left">접속시각</th><th class="left">마지막 활동</th>',
        '<th>경과시간</th><th>상태</th>',
        '</tr></thead><tbody>',
        activeRows,
        '</tbody></table></div>'
      ].join('')) : '')
    ].join('');
  }

  // ── 섹션 2: 완주자 로그 (기존) ──
  adminHtml += '<h2>🏆 완주자 플레이 로그</h2>';
  adminHtml += '<div class="sub">총 ' + logs.length + '건의 완주 기록</div>';

  if(logs.length > 0){
    var avg = Math.round(logs.reduce(function(a,b){return a+(b.score||0);},0)/logs.length);
    var sCount = logs.filter(function(l){return l.grade==='S'||l.grade==='A';}).length;
    adminHtml += [
      '<div class="summary">',
      '<div class="sum-box"><div class="sum-num">' + logs.length + '</div><div class="sum-lbl">총 플레이</div></div>',
      '<div class="sum-box"><div class="sum-num" style="color:#00aa44">' + sCount + '</div><div class="sum-lbl">성공(S/A)</div></div>',
      '<div class="sum-box"><div class="sum-num">' + (logs.length-sCount) + '</div><div class="sum-lbl">실패(B~D)</div></div>',
      '<div class="sum-box"><div class="sum-num">' + avg + '</div><div class="sum-lbl">평균 점수</div></div>',
      '</div>'
    ].join('');
  }

  adminHtml += [
    '<button class="btn btn-excel" onclick="downloadExcel()">📥 엑셀(.xlsx) 다운로드</button>',
    '<button class="btn btn-del" onclick="clearLogs()">🗑 완주 로그 초기화</button>',
    '<div class="table-wrap">',
    '<table id="tbl-completed"><thead><tr>',
    '<th class="left">#</th>',
    '<th class="left">이름</th>',
    '<th class="left">접속시각</th>',
    '<th class="left">플레이시간</th>',
    '<th>등급</th>',
    '<th>점수</th>',
    '<th>CLU1</th><th>CLU2</th><th>CLU3</th><th>CLU4</th><th>CLU5</th>',
    '<th>CLU6</th>',
    '</tr></thead><tbody>',
    (rows || '<tr><td colspan="12" style="text-align:center;color:#999;padding:20px">아직 플레이 기록이 없습니다</td></tr>'),
    '</tbody></table>',
    '</div>',
    '<script>',
    downloadScript,
    '<\/script>',
    '</body></html>'
  ].join('');

  document.open(); document.write(adminHtml); document.close();
}

// ── URL 파라미터로 관리자 직접 접근: ?smilevalue ──
(function(){
  if(location.search.indexOf('smilevalue') < 0) return;
  var saved = sessionStorage.getItem('ktc_admin');
  if(saved && Date.now() < parseInt(saved)){
    showAdminPage();
    return;
  }
  var id = prompt('아이디');
  if(id !== 'kill'){ alert('아이디 또는 비밀번호가 틀렸습니다.'); return; }
  var pw = prompt('비밀번호');
  if(pw !== 'thecompany'){ alert('아이디 또는 비밀번호가 틀렸습니다.'); return; }
  var expire = Date.now() + 24*60*60*1000;
  sessionStorage.setItem('ktc_admin', expire);
  showAdminPage();
})();
