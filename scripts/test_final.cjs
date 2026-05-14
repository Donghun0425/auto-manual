'use strict';
const fs = require('fs');
const c = fs.readFileSync('D:/workspace_pkg2_term (2)/workspace_pkg2_term/exbuilder/clx-build/common/system/csm01/csm_1020101_u.clx.js', 'utf8');

function extractExtButtonName(content, functionName) {
  const fnIdx = content.indexOf('function ' + functionName);
  if (fnIdx < 0) return null;
  const searchArea = content.slice(Math.max(0, fnIdx - 2000), fnIdx);
  const jsdocBlockRe = /\/\*{2,}[\s\S]*?\*\//g;
  let lastJsdoc = null, jm;
  while ((jm = jsdocBlockRe.exec(searchArea)) !== null) lastJsdoc = jm;
  if (lastJsdoc) {
    for (const line of lastJsdoc[0].split('\n')) {
      const stripped = line.replace(/^\s*[/*]+\s*/, '').trim();
      if (!stripped || /^@/.test(stripped)) continue;
      return stripped
        .replace(/\s*버튼\s*클릭\s*이벤트\s*함수\s*$/i, '')
        .replace(/\s*클릭\s*이벤트\s*함수\s*$/i, '')
        .replace(/\s*이벤트\s*함수\s*$/i, '')
        .trim();
    }
  }
  return null;
}

function extractBody(c, fn) {
  const i = c.indexOf('function ' + fn);
  if (i < 0) return '';
  const s = c.indexOf('{', i);
  let d = 0;
  for (let j = s; j < c.length; j++) {
    if (c[j] === '{') d++;
    else if (c[j] === '}') { d--; if (d === 0) return c.slice(s, j+1); }
  }
  return '';
}

function describeBtn(body, name) {
  if (/openPopup|PatisUtils\.openPopup/.test(body)) {
    return "Step1. '" + name + "' 버튼을 클릭하여 팝업 화면을 연다.";
  }
  return null;
}

const extMatches = [...c.matchAll(/function\s+Form_ext(\d+)Click\s*\(/g)];
const lines = [];
for (const match of extMatches) {
  const idx = parseInt(match[1]);
  const fn = 'Form_ext' + idx + 'Click';
  const name = extractExtButtonName(c, fn) || ('추가버튼' + idx);
  const body = extractBody(c, fn);
  const desc = describeBtn(body, name);
  lines.push('name: ' + name);
  lines.push('desc: ' + desc);
  lines.push('');
}

fs.writeFileSync('E:/AI개발_개인/auto_maunal_v6/scripts/final_result.txt', lines.join('\n'), 'utf8');
console.log('done');
