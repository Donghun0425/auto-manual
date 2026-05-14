'use strict';
const fs = require('fs');
const path = 'D:/workspace_pkg2_term (2)/workspace_pkg2_term/exbuilder/clx-build/common/system/csm01/csm_1020101_u.clx.js';
const content = fs.readFileSync(path, 'utf8');

// ── 1. Form_ext 함수 존재 확인 ────────────────────────────────────────────────
const extMatches = [...content.matchAll(/function\s+Form_ext(\d+)Click\s*\(/g)];
console.log('Form_extNClick 함수 수:', extMatches.length);

// ── 2. parseInitAddButtonLabels 결과 ─────────────────────────────────────────
const map = new Map();
const reA = /initAddButton\s*\([^,)]+,\s*["']?(\d+)["']?\s*,\s*"([^"]+)"/g;
let m;
while ((m = reA.exec(content)) !== null) map.set(parseInt(m[1]), m[2]);
const reB = /\.initAddButton\s*\(\s*(\d+)\s*,\s*"([^"]+)"/g;
while ((m = reB.exec(content)) !== null) if (!map.has(parseInt(m[1]))) map.set(parseInt(m[1]), m[2]);
console.log('initAddButton map:', [...map.entries()]);

// ── 3. 각 Form_extN 버튼명 추출 시뮬레이션 ────────────────────────────────────
for (const match of extMatches) {
  const btnIndex = parseInt(match[1]);
  const fnName = `Form_ext${btnIndex}Click`;
  const fnIdx = match.index;
  
  // 1순위: initAddButton
  const label1 = map.get(btnIndex) || null;
  console.log(`\n--- ${fnName} ---`);
  console.log('1순위 initAddButton:', label1);
  
  const searchArea = content.slice(Math.max(0, fnIdx - 2000), fnIdx);
  
  // 2순위: 추가버튼N [이름]
  const bracketRe = /추가버튼\d+\s+\[([^\]]+)\]/g;
  let lastBracket = null, bm;
  while ((bm = bracketRe.exec(searchArea)) !== null) lastBracket = bm;
  console.log('2순위 bracketMatch:', lastBracket?.[1] ?? null);
  
  // 3순위: * 주석 [이름]
  const commentRe = /\*[^\n]+(?:클릭|버튼)[^\n]*\[([^\]]+)\]/g;
  let lastComment = null, cm;
  while ((cm = commentRe.exec(searchArea)) !== null) lastComment = cm;
  console.log('3순위 commentMatch:', lastComment?.[1] ?? null);
  
  // 4순위: JSDoc 첫 설명 줄
  const jsdocBlockRe = /\/\*{2,}[\s\S]*?\*\//g;
  let lastJsdoc = null, jm;
  while ((jm = jsdocBlockRe.exec(searchArea)) !== null) lastJsdoc = jm;
  if (lastJsdoc) {
    const blockLines = lastJsdoc[0].split('\n');
    let found4 = null;
    for (const line of blockLines) {
      const stripped = line.replace(/^\s*[/*]+\s*/, '').trim();
      if (!stripped || /^@/.test(stripped)) continue;
      found4 = stripped;
      break;
    }
    console.log('4순위 JSDoc:', found4);
    if (!found4) {
      // JSDoc 블록 전체 출력
      console.log('JSDoc 전체:', JSON.stringify(lastJsdoc[0].slice(0, 200)));
    }
  } else {
    console.log('4순위: JSDoc 없음');
  }
  
  // 최종 결과
  const finalName = label1 
    || lastBracket?.[1]?.trim() 
    || lastComment?.[1]?.trim() 
    || (() => {
      if (!lastJsdoc) return null;
      const blockLines = lastJsdoc[0].split('\n');
      for (const line of blockLines) {
        const stripped = line.replace(/^\s*[/*]+\s*/, '').trim();
        if (!stripped || /^@/.test(stripped)) continue;
        return stripped;
      }
      return null;
    })()
    || `추가버튼${btnIndex}`;
  console.log('최종 버튼명:', finalName);
}
