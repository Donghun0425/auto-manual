const fs = require('fs');
const c = fs.readFileSync('D:/exbuilder/clx-build/univ/screg/usc05/usc_3010503_v.clx.js', 'utf8');

// ────────── TabItem 텍스트 추출 (선언부에서) ──────────
console.log('=== TabItem text 추출 ===');
const tabItemTextRe = /tabItem_\d+\.text\s*=\s*"([^"]+)"/g;
let tm;
while ((tm = tabItemTextRe.exec(c)) !== null) {
  console.log(`  ${tm[0]}`);
}

// ────────── 각 EMB의 탭 번호 매핑 ──────────
console.log('\n=== EMB → 탭 매핑 ===');
// tabPageDataSearch 에서 EMB + tabId 패턴으로 동적 매핑
// TF01_beforeselectionchange에서 tabItem → EMB 매핑 확인
for (let i = 1; i <= 11; i++) {
  const padded = String(i).padStart(2, '0');
  const embId = 'EMB' + padded;
  const tabRe = new RegExp('TF01_TAB' + padded);
  const hasTab = tabRe.test(c);
  
  // clearTabXXAction 패턴에서 주석으로 용도 확인
  const clearRe = new RegExp('clearTab' + padded + 'Action[^\\n]*?//\\s*(.+)', 'g');
  const clearM = clearRe.exec(c);
  const comment = clearM?.[1]?.trim() || '';
  
  console.log(`  ${embId} | hasTab: ${hasTab} | comment: ${comment}`);
}

// ────────── embAppParser 확인: src 없는 EMB는 어떻게 처리되는지 ──────────
console.log('\n=== EmbeddedApp 선언 순서 ===');
const embDeclRe = /new\s+cpr\.controls\.EmbeddedApp\("(EMB\d+)"\)/g;
let edm;
while ((edm = embDeclRe.exec(c)) !== null) {
  // 해당 EMB가 TabItem 내부에 있는지 (tabItem_N 변수 스코프)
  const before = c.slice(Math.max(0, edm.index - 500), edm.index);
  const tabTextM = /tabItem_\d+\.text\s*=\s*"([^"]+)"/.exec(before);
  console.log(`  ${edm[1]} (pos:${edm.index}) | 직전 tabItem text: ${tabTextM?.[1] || '없음'}`);
}

// ────────── parseExtraButtons 관련 확인 ──────────
console.log('\n=== 기타 버튼 (Button 컨트롤 + onclick) ===');
const btnDeclRe = /new\s+cpr\.controls\.Button\("([^"]+)"\)/g;
let bm;
const btnIds = [];
while ((bm = btnDeclRe.exec(c)) !== null) {
  btnIds.push(bm[1]);
}
console.log('Button IDs:', btnIds);

// 각 버튼의 onclick 핸들러 확인
for (const id of btnIds) {
  const onclickRe = new RegExp(id + '[^;]*onclick|' + id + '_onclick|addEventListener\\([^)]*click[^)]*' + id);
  if (onclickRe.test(c)) {
    console.log(`  ${id}: onclick handler found`);
  }
}

// ────────── 필수값 검증 (실제 validationParser 패턴) ──────────
console.log('\n=== 실제 alert 메시지 전체 ===');
const alertRe = /(?:alert|PatisUtils\.showMessage\w*)\s*\([^"]*"([^"]+)"/g;
let am;
let cnt = 0;
while ((am = alertRe.exec(c)) !== null && cnt < 20) {
  // 함수 컨텍스트
  const before = c.slice(Math.max(0, am.index - 3000), am.index);
  const fnRe = /function\s+(\w+)\s*\(/g;
  let lastFn = '(unknown)';
  let fm;
  while ((fm = fnRe.exec(before)) !== null) lastFn = fm[1];
  console.log(`  [${lastFn}] ${am[1]}`);
  cnt++;
}

console.log('\n=== 완료 ===');
