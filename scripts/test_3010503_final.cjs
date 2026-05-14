/**
 * CLX 파일에서 TitleForm 관련 모든 패턴을 정밀 확인
 */
const fs = require('fs');
const c = fs.readFileSync('D:/exbuilder/clx-build/univ/screg/usc05/usc_3010503_v.clx.js', 'utf8');

// ── 1. TitleForm_ 함수 전체 목록 ──
console.log('=== TitleForm_ 함수 전체 ===');
const tfRe = /function\s+(TitleForm_\w+)\s*\(/g;
let m;
while ((m = tfRe.exec(c)) !== null) {
  console.log(' ', m[1], '@ pos', m.index);
}

// ── 2. 혹시 다른 형태의 save/new/del 함수가 있는지 확인 ──
console.log('\n=== save/new/del 관련 모든 function 패턴 ===');
const saveNewDel = /function\s+\w*(save|new|del|Save|New|Del)\w*\s*\(/g;
while ((m = saveNewDel.exec(c)) !== null) {
  console.log(' ', m[0].trim().substring(0, 60));
}

// ── 3. crudParser의 실제 정규식 테스트 ──
console.log('\n=== crudParser 정규식 직접 테스트 ===');
const reInq = /function\s+TitleForm_inq(Action|Click)\s*\(/;
const reSave = /function\s+TitleForm_save(Action|Click)\s*\(/;
const reNew  = /function\s+TitleForm_new(Action|Click)\s*\(/;
const reDel  = /function\s+TitleForm_del(Action|Click)\s*\(/;
const reExt  = /function\s+TitleForm_ext\d+Click\s*\(/;
console.log('hasInq: ', reInq.test(c));
console.log('hasSave:', reSave.test(c));
console.log('hasNew: ', reNew.test(c));
console.log('hasDel: ', reDel.test(c));
console.log('hasExt: ', reExt.test(c));

// ── 4. CrudInfo 최종 반환 값 시뮬레이션 ──
const globalHasSave = reSave.test(c);
const globalHasNew  = reNew.test(c);
const globalHasDel  = reDel.test(c);
const globalHasInq  = reInq.test(c);
const isSingleSelected = true; // 시뮬에서 확인됨
const crudFallbackAllowed = true;

// 학생 기본 정보 bar properties (시뮬에서 확인됨)
const tb = { saveVisible: false, saveHidden: false, newVisible: false, newHidden: false, delVisible: false, delHidden: false, inqHidden: false };

console.log('\n=== 최종 CrudInfo 반환값 시뮬레이션 ===');
console.log('hasInquiry:', globalHasInq && !tb.inqHidden);
console.log('hasNew:    ', globalHasNew  && (tb.newVisible  || (crudFallbackAllowed && !tb.newHidden)));
console.log('hasSave:   ', globalHasSave && (tb.saveVisible || (crudFallbackAllowed && !tb.saveHidden)));
console.log('hasDelete: ', globalHasDel  && (tb.delVisible  || (crudFallbackAllowed && !tb.delHidden)));
