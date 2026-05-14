/**
 * INFOGROUP 파서 검증 스크립트 (CJS, 직접 로직 실행)
 * - infoGroupParser.ts의 핵심 로직을 CJS로 포팅하여 CLX 파일에 적용
 */
const fs = require('fs');
const CLX_PATH = 'D:/workspace_pkg2_term (2)/workspace_pkg2_term/exbuilder/clx-build/common/system/csm01/csm_1020101_u.clx.js';
const c = fs.readFileSync(CLX_PATH, 'utf8');

const INPUT_TYPES = new Set(['InputBox','TextArea','ComboBox','CheckBox','DatePicker','NumberInput','SpinBox','RadioGroup','PatisCombo','PatisDatePicker']);
function shortType(raw) { return raw.split('.').pop() ?? raw; }

function extractFunctionBody(content, searchFrom, maxDistance = 8000) {
  const funcMarker = '(function(container){';
  const start = content.indexOf(funcMarker, searchFrom);
  if (start < 0 || start - searchFrom > maxDistance) return null;
  let depth = 0, i = start;
  while (i < content.length) {
    if (content[i] === '{') depth++;
    else if (content[i] === '}') { depth--; if (depth === 0) return content.slice(start + funcMarker.length, i); }
    i++;
  }
  return null;
}

// Step 1: CT_INFOTITLE → title
const titleMap = new Map();
const titleDeclRe = /var\s+(\w+)\s*=\s*(?:linker\.\w+\s*=\s*)?new\s+udc\.common\.PatisTitleBar\("CT_INFOTITLE(\d+)"\)/g;
let tm;
while ((tm = titleDeclRe.exec(c)) !== null) {
  const tvName = tm[1], tNum = tm[2];
  const after = c.slice(tm.index, tm.index + 400);
  const titleM = new RegExp(`${tvName}\\.title\\s*=\\s*"([^"]+)"`).exec(after);
  if (titleM) titleMap.set(tNum, titleM[1]);
}
console.log('Title map:', Object.fromEntries(titleMap));

// Step 2~6: INFOGROUP 파싱
const groupRe = /var\s+(\w+)\s*=\s*(?:linker\.\w+\s*=\s*)?new\s+cpr\.controls\.Container\("(INFOGROUP(\d+))"\)/g;
let gm;
const results = [];
while ((gm = groupRe.exec(c)) !== null) {
  const varName = gm[1], groupId = gm[2], groupNum = gm[3];
  const afterDecl = c.slice(gm.index, gm.index + 300);
  if (!afterDecl.includes('cl-form-group')) continue;

  const body = extractFunctionBody(c, gm.index);
  if (!body) { console.log(`[WARN] ${groupId}: body not found`); continue; }

  // T_D_ outputs
  const outputMap = new Map();
  const outputDeclRe = /var\s+(\w+)\s*=\s*new\s+cpr\.controls\.Output\("(T_D_[^"]+)"\)/g;
  let om;
  while ((om = outputDeclRe.exec(body)) !== null) {
    const oVarName = om[1], controlId = om[2];
    const afterOutput = body.slice(om.index, om.index + 200);
    const valueM = new RegExp(`${oVarName}\\.value\\s*=\\s*"([^"]+)"`).exec(afterOutput);
    outputMap.set(oVarName, { controlId, labelText: valueM ? valueM[1] : controlId });
  }

  // D_ control types
  const controlTypeMap = new Map();
  const cprDeclRe = /var\s+\w+\s*=\s*new\s+cpr\.controls\.(\w+)\("(D_[^"]+)"\)/g;
  let cm;
  while ((cm = cprDeclRe.exec(body)) !== null) controlTypeMap.set(cm[2], cm[1]);
  const udcDeclRe = /var\s+\w+\s*=\s*(?:linker\.\w+\s*=\s*)?new\s+(udc\.[\w.]+)\("(D_[^"]+)"\)/g;
  let udcm;
  while ((udcm = udcDeclRe.exec(body)) !== null) controlTypeMap.set(udcm[2], shortType(udcm[1]));

  // controls
  const controls = [];
  for (const [, { controlId, labelText }] of outputMap) {
    const dataCtrlId = controlId.slice(2);
    const ctrlType = controlTypeMap.get(dataCtrlId) ?? 'InputBox';
    controls.push({ controlId: dataCtrlId, labelText, controlType: ctrlType, inputType: INPUT_TYPES.has(ctrlType) ? '입력' : '표시' });
  }

  results.push({ groupId, title: titleMap.get(groupNum), controls });
}

// 출력
for (const g of results) {
  console.log(`\n=== ${g.groupId} → "${g.title ?? '(제목없음)'}" (${g.controls.length}개 항목) ===`);
  g.controls.slice(0, 10).forEach(c => {
    console.log(`  ${c.labelText.padEnd(15)} | ${c.controlType.padEnd(12)} | ${c.inputType}`);
  });
  if (g.controls.length > 10) console.log(`  ... (${g.controls.length - 10}개 더)`);
}
