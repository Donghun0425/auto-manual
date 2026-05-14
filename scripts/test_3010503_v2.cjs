/**
 * usc_3010503_v.clx.js 심층 분석 (2단계)
 */
const fs = require('fs');
const c = fs.readFileSync('D:/exbuilder/clx-build/univ/screg/usc05/usc_3010503_v.clx.js', 'utf8');

// ────────── 헤더 주석 블록 (정확한 주석 위치) ──────────
console.log('=== 헤더 주석 (처음 2000자) ===');
console.log(c.substring(0, 2000));

// ────────── PatisMenuTitleBar 확인 ──────────
console.log('\n=== PatisMenuTitleBar ===');
const menuRe = /PatisMenuTitleBar/g;
let mm;
while ((mm = menuRe.exec(c)) !== null) {
  console.log('pos:', mm.index, c.slice(Math.max(0, mm.index - 40), mm.index + 80));
}

// ────────── 실제 조회 함수 패턴 ──────────
console.log('\n=== 조회 관련 함수 ===');
const fnRe = /function\s+(\w*(?:search|inq|onInq|Search|onSearch)\w*)\s*\(/gi;
let fnm;
while ((fnm = fnRe.exec(c)) !== null) {
  console.log(' ', fnm[1]);
}

// ────────── Form_ 함수들 ──────────
console.log('\n=== Form_ 함수 목록 ===');
const formFnRe = /function\s+(Form_\w+)\s*\(/g;
let ffm;
while ((ffm = formFnRe.exec(c)) !== null) {
  console.log(' ', ffm[1]);
}

// ────────── EmbeddedApp src 찾기 (더 넓은 탐색) ──────────
console.log('\n=== EmbeddedApp 상세 ===');
const embRe2 = /new\s+cpr\.controls\.EmbeddedApp\s*\(\s*"([^"]+)"\s*\)/g;
let em2;
while ((em2 = embRe2.exec(c)) !== null) {
  const id = em2[1];
  // 주변 1500자에서 src 탐색
  const after = c.slice(em2.index, em2.index + 1500);
  const srcM = /\.src\s*=\s*"([^"]+)"/.exec(after);
  // app.lookup("EMBxx").src = "..." 패턴도 확인
  const lookupSrcRe = new RegExp('app\\.lookup\\("' + id + '"\\)\\.src\\s*=\\s*"([^"]+)"');
  const lookupM = lookupSrcRe.exec(c);
  console.log(`  ${id}: decl_src=${srcM?.[1] || '없음'} | lookup_src=${lookupM?.[1] || '없음'}`);
}

// 전역 app.lookup("EMBxx") 패턴으로도 확인
console.log('\n=== EMB src via app.lookup ===');
const embLookupRe = /app\.lookup\("(EMB\d+)"\)[\s\S]{0,50}?\.src\s*=\s*"([^"]+)"/g;
while ((em2 = embLookupRe.exec(c)) !== null) {
  console.log(`  ${em2[1]} -> ${em2[2]}`);
}

// ────────── CT_INFOTITLE01 ext 버튼 상세 ──────────
console.log('\n=== CT_INFOTITLE01 initAddButton 상세 ===');
const infoBtnRe = /initAddButton[^;]*CT_INFOTITLE01[^;]*;/g;
let ibm;
while ((ibm = infoBtnRe.exec(c)) !== null) {
  console.log(' ', ibm[0].trim().substring(0, 120));
}
// 역방향: CT_INFOTITLE01.*initAddButton
const infoBtnRe2 = /CT_INFOTITLE01[^;]*initAddButton[^;]*;/g;
while ((ibm = infoBtnRe2.exec(c)) !== null) {
  console.log(' (rev)', ibm[0].trim().substring(0, 150));
}

// ────────── 기타 버튼 (BTN_ 패턴) ──────────
console.log('\n=== 기타 버튼 (BTN_ onclick) ===');
const btnRe = /function\s+(\w*BTN\w*_onclick)\s*\(/g;
let bm;
while ((bm = btnRe.exec(c)) !== null) {
  console.log(' ', bm[1]);
}

// ────────── 조건그룹 컨트롤 수 ──────────
console.log('\n=== SEARCHGROUP01 주변 500자 ===');
const sgIdx = c.indexOf('"SEARCHGROUP01"');
if (sgIdx >= 0) console.log(c.slice(sgIdx, sgIdx + 500));

console.log('\n=== 완료 ===');
