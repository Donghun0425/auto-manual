'use strict';
/**
 * csm_1020101_u.clx.js 분석 결과에서 사용방법 섹션 ext버튼 확인
 */
const fs = require('fs');

const CLX_PATH = 'D:/workspace_pkg2_term (2)/workspace_pkg2_term/exbuilder/clx-build/common/system/csm01/csm_1020101_u.clx.js';
const content = fs.readFileSync(CLX_PATH, 'utf8');

// ── parseMenuTitleBarCrud 로직 재현 ───────────────────────────────────────────
function parseInitAddButtonLabels(c) {
  const map = new Map();
  const reA = /initAddButton\s*\([^,)]+,\s*["']?(\d+)["']?\s*,\s*"([^"]+)"/g;
  let m;
  while ((m = reA.exec(c)) !== null) map.set(parseInt(m[1]), m[2]);
  const reB = /\.initAddButton\s*\(\s*(\d+)\s*,\s*"([^"]+)"/g;
  while ((m = reB.exec(c)) !== null) if (!map.has(parseInt(m[1]))) map.set(parseInt(m[1]), m[2]);
  return map;
}

function extractExtButtonName(c, functionName) {
  const fnIdx = c.indexOf(`function ${functionName}`);
  if (fnIdx < 0) return null;

  const idxMatch = /ext(\d+)Click$/.exec(functionName);
  const btnIndex = idxMatch ? parseInt(idxMatch[1]) : null;

  // 1순위: initAddButton
  if (btnIndex !== null) {
    const initLabels = parseInitAddButtonLabels(c);
    const label = initLabels.get(btnIndex);
    if (label) return label;
  }

  const searchArea = c.slice(Math.max(0, fnIdx - 2000), fnIdx);

  // 2순위: 추가버튼N [이름]
  const bracketRe = /추가버튼\d+\s+\[([^\]]+)\]/g;
  let lastBracket = null, bm;
  while ((bm = bracketRe.exec(searchArea)) !== null) lastBracket = bm;
  if (lastBracket) return lastBracket[1].trim();

  // 3순위: * 주석 [이름]
  const commentRe = /\*[^\n]+(?:클릭|버튼)[^\n]*\[([^\]]+)\]/g;
  let lastComment = null, cm;
  while ((cm = commentRe.exec(searchArea)) !== null) lastComment = cm;
  if (lastComment) return lastComment[1].trim();

  // 4순위: JSDoc 첫 설명 줄
  const jsdocBlockRe = /\/\*{2,}[\s\S]*?\*\//g;
  let lastJsdoc = null, jm;
  while ((jm = jsdocBlockRe.exec(searchArea)) !== null) lastJsdoc = jm;
  if (lastJsdoc) {
    const blockLines = lastJsdoc[0].split('\n');
    for (const line of blockLines) {
      const stripped = line.replace(/^\s*[/*]+\s*/, '').trim();
      if (!stripped || /^@/.test(stripped)) continue;
      return stripped;
    }
  }

  return null;
}

// parseMenuTitleBarCrud 재현
const result = {
  hasInquiry: /function\s+Form_inq(Action|Click)\s*\(/.test(content),
  hasNew:     /function\s+Form_new(Action|Click)\s*\(/.test(content),
  hasSave:    /function\s+Form_save(Action|Click)\s*\(/.test(content),
  hasDelete:  /function\s+Form_del(Action|Click)\s*\(/.test(content),
  extButtons: [],
};

const extMatches = [...content.matchAll(/function\s+Form_ext(\d+)Click\s*\(/g)];
for (const match of extMatches) {
  const btnIndex = parseInt(match[1]);
  const btnName = extractExtButtonName(content, `Form_ext${btnIndex}Click`);
  result.extButtons.push({
    name: btnName || `추가버튼${btnIndex}`,
    functionName: `Form_ext${btnIndex}Click`,
    index: btnIndex,
  });
}

// 결과 파일 저장
fs.writeFileSync('E:/AI개발_개인/auto_maunal_v6/scripts/menu_crud_result.json',
  JSON.stringify(result, null, 2), 'utf8');

// 사용방법 섹션 생성 시뮬레이션
const lines = ['## 사용방법', ''];
if (result.hasInquiry) { lines.push('{B}조회{/B}'); lines.push('Step1. 조회조건을 입력한다.'); lines.push(''); }
if (result.hasNew) { lines.push('{B}신규{/B}'); lines.push('Step1. 신규 버튼을 클릭한다.'); lines.push(''); }
if (result.hasSave) { lines.push('{B}저장{/B}'); lines.push('Step1. 저장 버튼을 클릭한다.'); lines.push(''); }
if (result.hasDelete) { lines.push('{B}삭제{/B}'); lines.push('Step1. 삭제 버튼을 클릭한다.'); lines.push(''); }
for (const btn of result.extButtons) {
  lines.push(`{B}${btn.name}{/B}`);
  lines.push(`Step1. '${btn.name}' 버튼을 클릭한다.`);
  lines.push('');
}

fs.writeFileSync('E:/AI개발_개인/auto_maunal_v6/scripts/usage_section_result.txt',
  lines.join('\n'), 'utf8');

console.log('=== menu.extButtons ===');
result.extButtons.forEach(b => console.log(`  [${b.index}] name="${b.name}" fn=${b.functionName}`));
console.log('\n완료 → menu_crud_result.json, usage_section_result.txt');
