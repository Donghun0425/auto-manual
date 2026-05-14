const fs = require('fs');
const c = fs.readFileSync('D:/exbuilder/clx-build/univ/screg/usc05/usc_3010503_v.clx.js', 'utf8');

// ────────── TabItem 텍스트와 EmbeddedApp 매핑 ──────────
console.log('=== TabItem 상세 ===');
const tabItemRe = /new\s+cpr\.controls\.TabItem\s*\(\s*"([^"]+)"\s*\)/g;
let tm;
while ((tm = tabItemRe.exec(c)) !== null) {
  const id = tm[1];
  const after = c.slice(tm.index, tm.index + 500);
  const textM = /\.text\s*=\s*"([^"]+)"/.exec(after);
  console.log(`  TabItem: ${id} | text: ${textM?.[1] || '없음'}`);
}

// ────────── EmbeddedApp src 설정 방식 확인 (런타임 동적 할당일 수 있음) ──────────
console.log('\n=== EMB src 동적 할당 패턴 ===');
// .src = "..." 또는 setSrc("...")
const srcAssignRe = /(?:EMB\d+[^"]*\.src\s*=\s*"|setSrc\s*\(\s*")/g;
let sm;
while ((sm = srcAssignRe.exec(c)) !== null) {
  console.log(' ', c.slice(sm.index, sm.index + 120).replace(/\n/g, ' '));
}

// tabPageDataSearch 함수에서 EMB src 할당 찾기
console.log('\n=== tabPageDataSearch 함수 ===');
const tdsIdx = c.indexOf('function tabPageDataSearch');
if (tdsIdx >= 0) {
  console.log(c.slice(tdsIdx, tdsIdx + 2000));
}

// ────────── EMB 선언부에서 src ──────────
console.log('\n=== EMB01 선언부 주변 ===');
const emb01Idx = c.indexOf('new cpr.controls.EmbeddedApp("EMB01")');
if (emb01Idx >= 0) {
  console.log(c.slice(emb01Idx, emb01Idx + 600));
}

// ────────── crudParser: 상단 메뉴 조회 패턴 확인 ──────────
console.log('\n=== 상단 메뉴 조회 패턴 검증 ===');
// Form_inqClick이 있으면 조회 기능이 있는 것
console.log('Form_inqClick:', /function\s+Form_inqClick\s*\(/.test(c));
console.log('Form_onSearchClick:', /function\s+Form_onSearchClick\s*\(/.test(c));
console.log('initCreate:', /PatisMenuTitleBar[.\s\S]{0,300}initCreate/.test(c));

// ────────── 검증: 조회 외 기능 ──────────
console.log('\n=== 저장/삭제 함수 ===');
const crudFns = ['Form_onSaveClick', 'Form_onNewClick', 'Form_onDelClick', 'Form_saveClick', 'Form_newClick', 'Form_delClick'];
crudFns.forEach(fn => {
  console.log(`${fn}:`, new RegExp('function\\s+' + fn + '\\s*\\(').test(c));
});

// ────────── TitleForm_ext1Click 바디 ──────────
console.log('\n=== TitleForm_ext1Click 바디 (500자) ===');
const tfeIdx = c.indexOf('function TitleForm_ext1Click');
if (tfeIdx >= 0) {
  console.log(c.slice(tfeIdx, tfeIdx + 500));
}

console.log('\n=== 완료 ===');
