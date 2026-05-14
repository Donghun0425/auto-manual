const fs = require('fs');
const CLX_PATH = 'D:/workspace_pkg2_term (2)/workspace_pkg2_term/exbuilder/clx-build/common/system/csm01/csm_1020101_u.clx.js';
const c = fs.readFileSync(CLX_PATH, 'utf8');
const lines = c.split('\n');

console.log('=== INFOGROUP / CT_INFOTITLE / cl-form-group ===');
lines.filter(l => /INFOGROUP|INFOTITLE|cl-form-group/.test(l)).forEach(l => console.log(l.trim()));

console.log('\n=== T_D~ Output 컨트롤 ===');
lines.filter(l => /Output\("T_D/.test(l)).forEach(l => console.log(l.trim()));

console.log('\n=== D_~ 컨트롤 선언 (EditText/CheckBox/ComboBox 등) ===');
lines.filter(l => /new cpr\.controls\.\w+\("D_/.test(l)).slice(0, 30).forEach(l => console.log(l.trim()));

console.log('\n=== T_D~ .value = 패턴 ===');
lines.filter(l => /T_D\w+\.value\s*=|"T_D\w+"\s*\)\.value\s*=/.test(l)).forEach(l => console.log(l.trim()));

console.log('\n=== CT_INFOTITLE initCreate / title ===');
lines.filter(l => /CT_INFOTITLE/.test(l)).forEach(l => console.log(l.trim()));
