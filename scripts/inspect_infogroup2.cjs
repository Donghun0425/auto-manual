const fs = require('fs');
const CLX_PATH = 'D:/workspace_pkg2_term (2)/workspace_pkg2_term/exbuilder/clx-build/common/system/csm01/csm_1020101_u.clx.js';
const c = fs.readFileSync(CLX_PATH, 'utf8');
const lines = c.split('\n');

// T_D~ Output 컨트롤의 value 설정 패턴 탐색
console.log('=== T_D~ .value 설정 ===');
lines.filter(l => /T_D_\w+.*\.value\s*=|output_\d+\.value\s*=/.test(l)).slice(0, 30).forEach(l => console.log(l.trim()));

// INFOGROUP01 선언 이후 200줄 확인
console.log('\n=== INFOGROUP01 선언 주변 (300자) ===');
const idx1 = lines.findIndex(l => l.includes('new cpr.controls.Container("INFOGROUP01")'));
if (idx1 >= 0) {
  lines.slice(idx1, idx1 + 30).forEach(l => console.log(l.trim()));
}

// output_4 (T_D_ABNM_L3) 선언 이후 설정 탐색
console.log('\n=== output_4 (T_D_ABNM_L3) 주변 ===');
const idx2 = lines.findIndex(l => l.includes('new cpr.controls.Output("T_D_ABNM_L3")'));
if (idx2 >= 0) {
  lines.slice(idx2, idx2 + 15).forEach(l => console.log(l.trim()));
}

// 첫 번째 T_D output 이후 설정 — value, label, placeholder 등
console.log('\n=== output_4~output_8 전체 설정 ===');
const names4 = ['output_4','output_5','output_6','output_7','output_8'];
lines.filter(l => names4.some(n => l.includes(n + '.'))).forEach(l => console.log(l.trim()));

// CT_INFOTITLE01 initCreate 주변 — title 설정
console.log('\n=== CT_INFOTITLE01 initCreate 주변 ===');
const idxT = lines.findIndex(l => l.includes('CT_INFOTITLE01') && l.includes('initCreate'));
if (idxT >= 0) {
  lines.slice(Math.max(0, idxT - 5), idxT + 20).forEach(l => console.log(l.trim()));
}

// PatisTitleBar initCreate 패턴
console.log('\n=== userDefinedControl_5 설정 ===');
lines.filter(l => l.includes('userDefinedControl_5.')).forEach(l => console.log(l.trim()));
