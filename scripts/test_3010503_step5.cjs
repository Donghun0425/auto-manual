/**
 * parseTitleBarCrud 로직 정밀 시뮬레이션
 */
const fs = require('fs');
const c = fs.readFileSync('D:/exbuilder/clx-build/univ/screg/usc05/usc_3010503_v.clx.js', 'utf8');

// ── Step 0: early-return 조건 ──
const hasAnyCrudFn = /function\s+TitleForm_(inq|new|save|del)(Action|Click)\s*\(/.test(c);
const hasAnyExtFn  = /function\s+TitleForm_ext\d+Click\s*\(/.test(c);
console.log('hasAnyCrudFn:', hasAnyCrudFn, '| hasAnyExtFn:', hasAnyExtFn);
if (!hasAnyCrudFn && !hasAnyExtFn) { console.log('=> early return []'); process.exit(0); }

// ── 전역 CRUD 함수 플래그 ──
const globalHasSave = /function\s+TitleForm_save(Action|Click)\s*\(/.test(c);
const globalHasNew  = /function\s+TitleForm_new(Action|Click)\s*\(/.test(c);
const globalHasDel  = /function\s+TitleForm_del(Action|Click)\s*\(/.test(c);
const globalHasInq  = /function\s+TitleForm_inq(Action|Click)\s*\(/.test(c);
console.log('\n전역 CRUD:', { globalHasSave, globalHasNew, globalHasDel, globalHasInq });

// ── Step 1: var 선언 탐색 ──
const tbVarRe = /var\s+(\w+)\s*=\s*(?:\w+\.\w+\s*=\s*)?new\s+udc\.common\.PatisTitleBar\s*\(\s*(?:"([^"]+)")?/g;
const allBars = [];
const seenVars = new Set();
let m;
while ((m = tbVarRe.exec(c)) !== null) {
  const varName = m[1], barId = m[2] || null;
  if (seenVars.has(varName)) { console.log(`  [skip dup] ${varName}`); continue; }
  seenVars.add(varName);

  const titleM = new RegExp('\\b' + varName + '\\.title\\s*=\\s*"([^"]+)"').exec(c);
  const title = titleM ? titleM[1] : null;
  if (!title) { console.log(`  [skip no-title] ${varName}`); continue; }

  const vt = (suf) => new RegExp('\\b' + varName + '\\.' + suf).test(c);
  const saveVisible = vt('isSaveButtonVisible\\s*=\\s*true');
  const saveHidden  = vt('isSaveButtonVisible\\s*=\\s*false');
  const newVisible  = vt('isNewButtonVisible\\s*=\\s*true');
  const newHidden   = vt('isNewButtonVisible\\s*=\\s*false');
  const delVisible  = vt('isDelButtonVisible\\s*=\\s*true');
  const delHidden   = vt('isDelButtonVisible\\s*=\\s*false');
  const inqHidden   = vt('isInqButtonVisible\\s*=\\s*false');

  // Form B ext
  const seenIdx = new Set();
  const extBtns = [];
  const reB = new RegExp('\\b' + varName + '\\.initAddButton\\s*\\(\\s*(\\d+)\\s*,\\s*"([^"]+)"', 'g');
  let bm;
  while ((bm = reB.exec(c)) !== null) {
    const idx = parseInt(bm[1]);
    if (!seenIdx.has(idx)) { seenIdx.add(idx); extBtns.push({ idx, name: bm[2], form: 'B' }); }
  }
  // Form C ext
  if (barId) {
    const escaped = barId.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    const reC = new RegExp('app\\.lookup\\s*\\("' + escaped + '"\\)\\.initAddButton\\s*\\([^,]+,\\s*"(\\d+)"\\s*,\\s*"([^"]+)"', 'g');
    while ((bm = reC.exec(c)) !== null) {
      const idx = parseInt(bm[1]);
      if (!seenIdx.has(idx)) { seenIdx.add(idx); extBtns.push({ idx, name: bm[2], form: 'C' }); }
    }
  }

  allBars.push({ varName, barId, title, saveVisible, saveHidden, newVisible, newHidden, delVisible, delHidden, inqHidden, extButtons: extBtns });
  console.log(`\n  allBars push: "${title}" saveV=${saveVisible} newV=${newVisible} delV=${delVisible} extCnt=${extBtns.length}`);
}

// ── Step 3: globalExtButtons ──
console.log('\nallBars.length:', allBars.length);
// (생략 - 단일이 아니면 적용 안 함)

// ── Step 4.5: dedup ──
const dedupedBars = [];
const seenTitles = new Set();
for (const bar of allBars) {
  const key = bar.title.trim();
  if (!seenTitles.has(key)) { seenTitles.add(key); dedupedBars.push(bar); }
}
console.log('\ndedupedBars:', dedupedBars.map(b => b.title));

// ── Step 5 ──
const barsWithOwnExt       = dedupedBars.filter(b => b.extButtons.length > 0);
const barsWithExplicitCrud = dedupedBars.filter(b => b.saveVisible || b.newVisible || b.delVisible);
console.log('barsWithOwnExt:', barsWithOwnExt.map(b => b.title));
console.log('barsWithExplicitCrud:', barsWithExplicitCrud.map(b => b.title));

let selectedBars;
if (barsWithOwnExt.length > 0 || barsWithExplicitCrud.length > 0) {
  const s = new Set([...barsWithOwnExt, ...barsWithExplicitCrud]);
  selectedBars = [...s];
} else {
  selectedBars = dedupedBars.slice(0, 1);
}
console.log('selectedBars:', selectedBars.map(b => b.title));

const isSingleBarInFile = dedupedBars.length === 1;
const isSingleSelected  = selectedBars.length === 1;
const crudFallbackAllowed = isSingleBarInFile || isSingleSelected;
console.log('isSingleBarInFile:', isSingleBarInFile, '| isSingleSelected:', isSingleSelected, '| crudFallbackAllowed:', crudFallbackAllowed);

console.log('\n=== 최종 출력 ===');
selectedBars.forEach(tb => {
  const hasNew    = globalHasNew  && (tb.newVisible  || (crudFallbackAllowed && !tb.newHidden));
  const hasSave   = globalHasSave && (tb.saveVisible || (crudFallbackAllowed && !tb.saveHidden));
  const hasDelete = globalHasDel  && (tb.delVisible  || (crudFallbackAllowed && !tb.delHidden));
  console.log(`  "${tb.title}": hasNew=${hasNew} hasSave=${hasSave} hasDelete=${hasDelete} extBtns=${tb.extButtons.map(b => b.name)}`);
});
