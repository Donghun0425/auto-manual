/**
 * usc_3010503_v.clx.js 파서 테스트
 * Usage: node scripts/test_3010503.cjs
 */
const fs = require('fs');
const filePath = 'D:/exbuilder/clx-build/univ/screg/usc05/usc_3010503_v.clx.js';
const c = fs.readFileSync(filePath, 'utf8');
console.log('=== 파일 크기:', c.length, '===\n');

// ────────── 1. 헤더 정보 ──────────
const headerBlock = c.slice(0, 3000);
const sysM = /\*\s*시스템\s*(?:명)?\s*[:\-]?\s*(.+)/i.exec(headerBlock);
const subM = /\*\s*(?:부시스템|서브시스템)\s*(?:명)?\s*[:\-]?\s*(.+)/i.exec(headerBlock);
const pgmM = /\*\s*프로그램\s*(?:명)?\s*[:\-]?\s*(.+)/i.exec(headerBlock);
const descM = /\*\s*(?:설\s*명|프로그램\s*설명)\s*[:\-]?\s*(.+)/i.exec(headerBlock);
console.log('## 화면개요');
console.log('시스템:', sysM?.[1]?.trim());
console.log('부시스템:', subM?.[1]?.trim());
console.log('프로그램:', pgmM?.[1]?.trim());
console.log('설명:', descM?.[1]?.trim());

// ────────── 2. PatisMenuTitleBar (상단) ──────────
console.log('\n## 상단 메뉴 타이틀바');
const hasInq = /function\s+(?:Form_onSearchClick|onSearchClick|_onInqClick)\s*\(/i.test(c);
const hasNew = /isNewButtonVisible\s*=\s*true/.test(c) || /function\s+(?:Form_onNewClick|_onNewClick)\s*\(/i.test(c);
const hasSave = /isSaveButtonVisible\s*=\s*true/.test(c) || /function\s+(?:Form_onSaveClick|_onSaveClick)\s*\(/i.test(c);
const hasDel = /isDelButtonVisible\s*=\s*true/.test(c) || /function\s+(?:Form_onDelClick|_onDelClick)\s*\(/i.test(c);
console.log('조회:', hasInq, '| 신규:', hasNew, '| 저장:', hasSave, '| 삭제:', hasDel);

// Form_ext 버튼
const formExtRe = /function\s+(Form_ext(\d+)Click)\s*\(/g;
let em;
const formExtBtns = [];
while ((em = formExtRe.exec(c)) !== null) {
  formExtBtns.push({ fn: em[1], idx: parseInt(em[2]) });
}
console.log('상단 ext 버튼:', formExtBtns.length, formExtBtns.map(b => b.fn));

// ────────── 3. PatisTitleBar ──────────
console.log('\n## PatisTitleBar 분석');
const tbVarRe = /var\s+(\w+)\s*=\s*(?:\w+\.\w+\s*=\s*)?new\s+udc\.common\.PatisTitleBar\s*\(\s*(?:"([^"]+)")?/g;
let tbm;
const bars = [];
while ((tbm = tbVarRe.exec(c)) !== null) {
  const varName = tbm[1], barId = tbm[2] || null;
  const titleM = new RegExp(varName + '\\.title\\s*=\\s*"([^"]+)"').exec(c);
  const title = titleM ? titleM[1] : '(no title)';

  // visibility
  const vt = (suf) => new RegExp('\\b' + varName + '\\.' + suf).test(c);
  const saveV = vt('isSaveButtonVisible\\s*=\\s*true');
  const newV = vt('isNewButtonVisible\\s*=\\s*true');
  const delV = vt('isDelButtonVisible\\s*=\\s*true');

  // Form B: varName.initAddButton(idx, "label")
  const extBtns = [];
  const seenIdx = new Set();
  const reB = new RegExp('\\b' + varName + '\\.initAddButton\\s*\\(\\s*(\\d+)\\s*,\\s*"([^"]+)"', 'g');
  let bm;
  while ((bm = reB.exec(c)) !== null) {
    const idx = parseInt(bm[1]);
    if (!seenIdx.has(idx)) { seenIdx.add(idx); extBtns.push({ idx, name: bm[2], form: 'B' }); }
  }

  // Form C: app.lookup("barId").initAddButton(firstArg, "btnId", "label", ...)
  if (barId) {
    const escaped = barId.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    const reC = new RegExp('app\\.lookup\\s*\\("' + escaped + '"\\)\\.initAddButton\\s*\\([^,]+,\\s*"(\\d+)"\\s*,\\s*"([^"]+)"', 'g');
    while ((bm = reC.exec(c)) !== null) {
      const idx = parseInt(bm[1]);
      if (!seenIdx.has(idx)) { seenIdx.add(idx); extBtns.push({ idx, name: bm[2], form: 'C' }); }
    }
  }

  bars.push({ varName, barId, title, saveV, newV, delV, extBtns });
  console.log(`  ${varName} (${barId}) | title: "${title}" | save:${saveV} new:${newV} del:${delV} | ext: ${extBtns.length}`, extBtns.map(b => `${b.name}(${b.form})`));
}

if (bars.length === 0) console.log('  (PatisTitleBar 없음)');

// ────────── 4. 그리드 ──────────
console.log('\n## 그리드');
const gridRe = /new\s+cpr\.controls\.Grid\s*\(\s*"([^"]+)"\s*\)/g;
let gm;
const grids = [];
while ((gm = gridRe.exec(c)) !== null) {
  grids.push(gm[1]);
}
console.log('그리드 IDs:', grids);

// ────────── 5. 조건그룹 ──────────
console.log('\n## 조건그룹');
const cgRe = /new\s+cpr\.controls\.Container\s*\(\s*"([^"]+)"\s*\)/g;
let cgm;
while ((cgm = cgRe.exec(c)) !== null) {
  const id = cgm[1];
  if (/GROUP/i.test(id)) console.log('  Container:', id);
}

// ────────── 6. 팝업 ──────────
console.log('\n## 팝업');
const popupRe = /openWindow\s*\(\s*"([^"]+)"/g;
let pm;
while ((pm = popupRe.exec(c)) !== null) {
  console.log('  팝업 URL:', pm[1]);
}

// ────────── 7. TitleForm_ext 함수 ──────────
console.log('\n## TitleForm_ext 함수');
const tfeRe = /function\s+TitleForm_ext(\d+)Click\s*\(/g;
let tfe;
while ((tfe = tfeRe.exec(c)) !== null) {
  console.log('  TitleForm_ext' + tfe[1] + 'Click');
}

// ────────── 8. 검증 메시지 (alert/confirm) ──────────
console.log('\n## 검증 메시지 (처음 10개)');
const alertRe = /(?:alert|confirm)\s*\(\s*"([^"]{5,})"/g;
let am;
let cnt = 0;
while ((am = alertRe.exec(c)) !== null && cnt < 10) {
  // 어떤 함수 내에 있는지 대략적으로 파악
  const before = c.slice(Math.max(0, am.index - 2000), am.index);
  const fnM = /function\s+(\w+)\s*\(/g;
  let lastFn = '(unknown)';
  let fm2;
  while ((fm2 = fnM.exec(before)) !== null) lastFn = fm2[1];
  console.log(`  [${lastFn}] ${am[1].substring(0, 60)}`);
  cnt++;
}

// ────────── 9. 필수값 ──────────
console.log('\n## 필수값 패턴');
const reqRe = /(?:필수|required|입력해\s*주세요|입력하세요|선택해\s*주세요|선택하세요)/gi;
let rm;
cnt = 0;
while ((rm = reqRe.exec(c)) !== null && cnt < 10) {
  console.log('  pos:', rm.index, '|', c.slice(Math.max(0, rm.index - 30), rm.index + 50).replace(/\n/g, ' '));
  cnt++;
}

// ────────── 10. 임베디드 앱 ──────────
console.log('\n## 임베디드 앱');
const embRe = /new\s+cpr\.controls\.EmbeddedApp\s*\(\s*"([^"]+)"\s*\)/g;
let eem;
while ((eem = embRe.exec(c)) !== null) {
  const id = eem[1];
  const after = c.slice(eem.index, eem.index + 500);
  const srcM = /\.src\s*=\s*"([^"]+)"/.exec(after);
  console.log('  EmbeddedApp:', id, '| src:', srcM?.[1]);
}

console.log('\n=== 분석 완료 ===');
