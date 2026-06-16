// ── Supabase 설정 (game.js와 동일하게 입력하세요) ──
var SUPABASE_URL = 'https://ypdiwxklslaeqxjcwtzs.supabase.co';
var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlwZGl3eGtsc2xhZXF4amN3dHpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5ODA0ODUsImV4cCI6MjA5NjU1NjQ4NX0.xkUGLsL8WKwskm0kqZymsdawowZvn2N9lBVj1e2-eB4';

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
  fetch(SUPABASE_URL + '/rest/v1/ktc_logs?order=start_time.desc', {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': 'Bearer ' + SUPABASE_KEY
    }
  })
  .then(function(res){ return res.json(); })
  .then(function(logs){ renderAdmin(logs); })
  .catch(function(e){
    alert('데이터를 불러오지 못했습니다. Supabase 설정을 확인하세요.');
    console.error(e);
  });
}
 
function clearLogs(){
  if(!confirm('로그를 모두 삭제할까요?\n이 작업은 되돌릴 수 없습니다.')) return;
  fetch(SUPABASE_URL + '/rest/v1/ktc_logs?id=gte.0', {
    method: 'DELETE',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': 'Bearer ' + SUPABASE_KEY
    }
  })
  .then(function(){ location.reload(); })
  .catch(function(e){ alert('삭제 실패: ' + e); });
}
 
function renderAdmin(logs){
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
 
  // 엑셀 다운로드용 TSV 생성 함수 (탭 구분값 — 엑셀에 붙여넣기도 가능)
  var downloadScript = [
    '// SheetJS로 진짜 .xlsx 생성',
    'function downloadExcel(){',
    '  var header = ["#","이름","접속시각","플레이시간","등급","점수","CLU1","CLU2","CLU3","CLU4","CLU5","CLU6"];',
    '  var data = [header];',
    '  document.querySelectorAll("tbody tr").forEach(function(tr){',
    '    var tds = tr.querySelectorAll("td");',
    '    if(!tds.length) return;',
    '    var row = [];',
    '    for(var i=0;i<tds.length;i++){ row.push(tds[i].innerText.trim()); }',
    '    data.push(row);',
    '  });',
    '  var ws = XLSX.utils.aoa_to_sheet(data);',
    '  // 컬럼 너비 자동 설정',
    '  ws["!cols"] = [',
    '    {wch:4},{wch:12},{wch:20},{wch:12},{wch:6},{wch:6},',
    '    {wch:7},{wch:7},{wch:7},{wch:7},{wch:7},{wch:7}',
    '  ];',
    '  var wb = XLSX.utils.book_new();',
    '  XLSX.utils.book_append_sheet(wb, ws, "플레이로그");',
    '  XLSX.writeFile(wb, "ktc_logs_" + new Date().toISOString().slice(0,10) + ".xlsx");',
    '}',
    '',
    'function clearLogs(){',
    '  if(!confirm("로그를 모두 삭제할까요?\\n이 작업은 되돌릴 수 없습니다.")) return;',
    '  fetch("' + SUPABASE_URL + '/rest/v1/ktc_logs?id=gte.0",{',
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
    '.sub{font-size:12px;color:#888;margin-bottom:14px}',
    '.table-wrap{overflow-x:auto;width:100%}',
    'table{border-collapse:collapse;width:100%;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.1);min-width:900px}',
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
    '</style></head><body>',
    '<h1>Kill The Company — 플레이 로그</h1>',
    '<div class="sub">총 ' + logs.length + '건의 플레이 기록</div>',
  ].join('');
 
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
    '<button class="btn btn-refresh" onclick="location.reload()">🔄 새로고침</button>',
    '<button class="btn btn-excel" onclick="downloadExcel()">📥 엑셀(.xlsx) 다운로드</button>',
    '<button class="btn btn-del" onclick="clearLogs()">🗑 로그 초기화</button>',
    '<button class="btn btn-logout" onclick="sessionStorage.removeItem(\'ktc_admin\');location.reload()">로그아웃</button>',
    '<div class="table-wrap">',
    '<table><thead><tr>',
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
