const fs = require('fs');
const CLX = 'D:/workspace_pkg2_term (2)/workspace_pkg2_term/exbuilder/clx-build/admin/ast/aas03/aas_4060307_u.clx.js';
const c = fs.readFileSync(CLX, 'utf8');

function extractExtButtonName(content, functionName) {
  const fnIdx = content.indexOf(`function ${functionName}`);
  if (fnIdx < 0) return null;
  const searchArea = content.slice(Math.max(0, fnIdx - 2000), fnIdx);

  // 1순위: 추가버튼N [이름]
  const bracketRe = /추가버튼\d+\s+\[([^\]]+)\]/g;
  let lastBracket = null, bm;
  while ((bm = bracketRe.exec(searchArea)) !== null) lastBracket = bm;
  if (lastBracket) return lastBracket[1].trim();

  // 2순위: * 주석에서 [이름]
  const commentRe = /\*[^\n]+(?:클릭|버튼)[^\n]*\[([^\]]+)\]/g;
  let lastComment = null, cm;
  while ((cm = commentRe.exec(searchArea)) !== null) lastComment = cm;
  if (lastComment) return lastComment[1].trim();

  // 3순위: JSDoc 블록 첫 설명 줄
  const jsdocBlockRe = /\/\*{2,}[\s\S]*?\*\//g;
  let lastJsdoc = null, jm;
  while ((jm = jsdocBlockRe.exec(searchArea)) !== null) lastJsdoc = jm;
  if (lastJsdoc) {
    const blockLines = lastJsdoc[0].split('\n');
    for (let li = 0; li < blockLines.length; li++) {
      const stripped = blockLines[li].replace(/^\s*[/*]+\s*/, '').trim();
      if (!stripped || /^@/.test(stripped)) continue;
      return stripped;
    }
  }
  return null;
}

for (let i = 1; i <= 4; i++) {
  const fn = `Form_ext${i}Click`;
  const name = extractExtButtonName(c, fn);
  console.log(`${fn} => "${name !== null ? name : `추가버튼${i} (fallback)`}"`);
}



