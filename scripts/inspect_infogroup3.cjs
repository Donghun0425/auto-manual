const fs = require('fs');
const CLX_PATH = 'D:/workspace_pkg2_term (2)/workspace_pkg2_term/exbuilder/clx-build/common/system/csm01/csm_1020101_u.clx.js';
const c = fs.readFileSync(CLX_PATH, 'utf8');

// INFOGROUP01 선언부 찾기
const match = /var\s+(\w+)\s*=\s*(?:linker\.\w+\s*=\s*)?new cpr\.controls\.Container\("(INFOGROUP\d+)"\)/.exec(c);
if (!match) { console.log('NOT FOUND'); process.exit(1); }
const varName = match[1];
const groupId = match[2];
console.log('groupId:', groupId, 'varName:', varName);

// IIFE 패턴: (function(container){ ... })(group_6)
const funcMarker = '(function(container){';
const endMarker = `})(${varName})`;
const startIdx = c.indexOf(funcMarker, match.index);
const endIdx = c.indexOf(endMarker, startIdx);
console.log('IIFE start:', startIdx, 'end:', endIdx);
if (startIdx < 0 || endIdx < 0) { console.log('IIFE not found'); process.exit(1); }

const body = c.slice(startIdx + funcMarker.length, endIdx);
console.log('Body length:', body.length);

// T_D_ Output 컨트롤 목록
const lines = body.split('\n');
console.log('\n=== T_D_ Output + value ===');
lines.forEach((l, i) => {
  if (/Output\("T_D_/.test(l) || /output_\d+\.value\s*=/.test(l)) {
    console.log(l.trim());
  }
});

console.log('\n=== D_ Input 컨트롤 ===');
lines.forEach((l, i) => {
  if (/new cpr\.controls\.\w+\("D_/.test(l)) {
    console.log(l.trim());
  }
});

// CT_INFOTITLE01 title 추출
console.log('\n=== CT_INFOTITLE title 추출 ===');
const titleRe = /var\s+(\w+)\s*=\s*(?:linker\.\w+\s*=\s*)?new udc\.common\.PatisTitleBar\("CT_INFOTITLE(\d+)"\)/g;
let tm;
while ((tm = titleRe.exec(c)) !== null) {
  const tvName = tm[1];
  const tNum = tm[2];
  const after = c.slice(tm.index, tm.index + 500);
  const titleM = new RegExp(`${tvName}\\.title\\s*=\\s*"([^"]+)"`).exec(after);
  console.log(`CT_INFOTITLE${tNum}: "${titleM ? titleM[1] : '(not found)'}"`);
}
