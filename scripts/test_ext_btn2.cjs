'use strict';
const fs = require('fs');
const path = 'D:/workspace_pkg2_term (2)/workspace_pkg2_term/exbuilder/clx-build/common/system/csm01/csm_1020101_u.clx.js';
const content = fs.readFileSync(path, 'utf8');

// Form_ext 함수 탐색
const extMatches = [...content.matchAll(/function\s+Form_ext(\d+)Click\s*\(/g)];
const results = [];

for (const match of extMatches) {
  const btnIndex = parseInt(match[1]);
  const fnName = `Form_ext${btnIndex}Click`;
  const fnIdx = match.index;
  const searchArea = content.slice(Math.max(0, fnIdx - 2000), fnIdx);

  // 4순위: JSDoc
  const jsdocBlockRe = /\/\*{2,}[\s\S]*?\*\//g;
  let lastJsdoc = null, jm;
  while ((jm = jsdocBlockRe.exec(searchArea)) !== null) lastJsdoc = jm;
  
  let found4 = null;
  if (lastJsdoc) {
    const blockLines = lastJsdoc[0].split('\n');
    for (const line of blockLines) {
      const stripped = line.replace(/^\s*[/*]+\s*/, '').trim();
      if (!stripped || /^@/.test(stripped)) continue;
      found4 = stripped;
      break;
    }
  }
  
  results.push({ fnName, found4 });
}

// UTF-8로 파일에 결과 저장
fs.writeFileSync('E:/AI개발_개인/auto_maunal_v6/scripts/ext_btn_result.txt', 
  JSON.stringify(results, null, 2), 'utf8');
console.log('Done. Results written to ext_btn_result.txt');
