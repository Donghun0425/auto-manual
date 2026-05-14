const fs = require('fs');
const c = fs.readFileSync('D:/exbuilder/clx-build/univ/screg/usc05/usc_3010503_v.clx.js', 'utf8');

// ── PatisTitleBar 변수 목록 ──
const tbVarRe = /var\s+(\w+)\s*=\s*(?:\w+\.\w+\s*=\s*)?new\s+udc\.common\.PatisTitleBar\s*\(\s*(?:"([^"]+)")?/g;
let m;
console.log('=== PatisTitleBar 변수 목록 ===');
while ((m = tbVarRe.exec(c)) !== null) {
  const varName = m[1], barId = m[2] || null;
  const titleM = new RegExp(varName + '\\.title\\s*=\\s*"([^"]+)"').exec(c);
  const title = titleM ? titleM[1] : '(no title)';

  const saveV = new RegExp('\\b' + varName + '\\.isSaveButtonVisible\\s*=\\s*true').test(c);
  const newV  = new RegExp('\\b' + varName + '\\.isNewButtonVisible\\s*=\\s*true').test(c);
  const delV  = new RegExp('\\b' + varName + '\\.isDelButtonVisible\\s*=\\s*true').test(c);
  const saveH = new RegExp('\\b' + varName + '\\.isSaveButtonVisible\\s*=\\s*false').test(c);
  const newH  = new RegExp('\\b' + varName + '\\.isNewButtonVisible\\s*=\\s*false').test(c);
  const delH  = new RegExp('\\b' + varName + '\\.isDelButtonVisible\\s*=\\s*false').test(c);

  console.log(`\n  [${varName}] barId=${barId} title="${title}"`);
  console.log(`    saveVisible=${saveV} saveHidden=${saveH}`);
  console.log(`    newVisible=${newV}  newHidden=${newH}`);
  console.log(`    delVisible=${delV}  delHidden=${delH}`);
}

// ── TitleForm_save/new/del 전역 함수 존재 여부 ──
console.log('\n=== 전역 TitleForm CRUD 함수 ===');
console.log('TitleForm_saveAction/Click:', /function\s+TitleForm_save(Action|Click)\s*\(/.test(c));
console.log('TitleForm_newAction/Click: ', /function\s+TitleForm_new(Action|Click)\s*\(/.test(c));
console.log('TitleForm_delAction/Click: ', /function\s+TitleForm_del(Action|Click)\s*\(/.test(c));

// ── 글로벌 isSaveButtonVisible 패턴 (변수명 무관) ──
console.log('\n=== 전역 isSaveButtonVisible 패턴 ===');
const svRe = /isSaveButtonVisible\s*=\s*(true|false)/g;
while ((m = svRe.exec(c)) !== null) {
  console.log('  pos:', m.index, '|', m[0], '|', c.slice(Math.max(0, m.index - 60), m.index + 30).replace(/\n/g, ' '));
}

console.log('\n=== 전역 isNewButtonVisible 패턴 ===');
const nvRe = /isNewButtonVisible\s*=\s*(true|false)/g;
while ((m = nvRe.exec(c)) !== null) {
  console.log('  pos:', m.index, '|', m[0], '|', c.slice(Math.max(0, m.index - 60), m.index + 30).replace(/\n/g, ' '));
}

console.log('\n=== 전역 isDelButtonVisible 패턴 ===');
const dvRe = /isDelButtonVisible\s*=\s*(true|false)/g;
while ((m = dvRe.exec(c)) !== null) {
  console.log('  pos:', m.index, '|', m[0], '|', c.slice(Math.max(0, m.index - 60), m.index + 30).replace(/\n/g, ' '));
}

console.log('\n=== 완료 ===');
