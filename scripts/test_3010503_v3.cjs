/**
 * usc_3010503_v.clx.js 심층 분석 (3단계)
 * - 인코딩 문제 해결: UTF-8 출력
 */
const fs = require('fs');
const c = fs.readFileSync('D:/exbuilder/clx-build/univ/screg/usc05/usc_3010503_v.clx.js', 'utf8');

// ────────── 헤더 파싱 (실제 파서 headerParser 로직 시뮬레이션) ──────────
// App URI 추출
const appUri = /App URI:\s*(.+)/.exec(c)?.[1]?.trim();
console.log('App URI:', appUri);

// 주석 블록에서 한글 인코딩된 텍스트 찾기
const commentBlock = c.substring(0, 5000);
// [시스템명] [부시스템] [프로그램] [설명] 패턴 탐색
const sysPatterns = [
  /\[.{2,6}\]\s*(.+)/g,
  /\/\/\s*\[([^\]]+)\]\s*(.+)/g,
];

// 직접 주석 라인 추출
const lines = commentBlock.split('\n');
console.log('\n=== 주석 블록 첫 30줄 ===');
lines.slice(0, 30).forEach((l, i) => console.log(`${i}: ${l.trimEnd()}`));

// ────────── EmbeddedApp src 패턴 탐색 ──────────
console.log('\n=== EMB app.lookup 패턴 전체 탐색 ===');
const embLookupAll = /app\.lookup\("(EMB\d+)"\)/g;
let em;
const embOps = new Map();
while ((em = embLookupAll.exec(c)) !== null) {
  const id = em[1];
  if (!embOps.has(id)) embOps.set(id, []);
  const ctx = c.slice(em.index, em.index + 200).replace(/\n/g, ' ').trim();
  embOps.get(id).push(ctx.substring(0, 150));
}
for (const [id, ops] of embOps) {
  console.log(`\n${id} (${ops.length} references):`);
  ops.slice(0, 3).forEach(op => console.log(`  ${op}`));
}

// ────────── TabPage 탐색 ──────────
console.log('\n=== TabPage ===');
const tabRe = /new\s+cpr\.controls\.TabItem\s*\(\s*"([^"]+)"\s*\)/g;
let tm;
while ((tm = tabRe.exec(c)) !== null) {
  const id = tm[1];
  const after = c.slice(tm.index, tm.index + 300);
  const textM = /\.text\s*=\s*"([^"]+)"/.exec(after);
  console.log(`  TabItem: ${id} | text: ${textM?.[1]}`);
}

// Tab 컨테이너
const tabFolderRe = /new\s+cpr\.controls\.TabFolder\s*\(\s*"([^"]+)"\s*\)/g;
while ((tm = tabFolderRe.exec(c)) !== null) {
  console.log(`  TabFolder: ${tm[1]}`);
}

// ────────── 실제 조회 함수 분석 ──────────
console.log('\n=== Form_inqClick 함수 바디 (500자) ===');
const inqIdx = c.indexOf('function Form_inqClick');
if (inqIdx >= 0) {
  console.log(c.slice(inqIdx, inqIdx + 500));
}

// ────────── CT_INFOTITLE01 initAddButton 전체 ──────────
console.log('\n=== CT_INFOTITLE01 initAddButton 전체 ===');
const initBtnRe = /app\.lookup\("CT_INFOTITLE01"\)\.initAddButton[^;]+;/g;
let ibm;
while ((ibm = initBtnRe.exec(c)) !== null) {
  console.log(ibm[0].trim());
}

// ────────── headerParser와 동일한 로직 ──────────
console.log('\n=== headerParser 시뮬레이션 ===');
const headerRe = /\/\/\s*\[([^\]]+)\]\s*(.*)/g;
let hm;
while ((hm = headerRe.exec(commentBlock)) !== null) {
  console.log(`  [${hm[1]}] = ${hm[2].trim()}`);
}

console.log('\n=== 완료 ===');
