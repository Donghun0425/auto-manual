'use strict';
const fs = require('fs');
const c = fs.readFileSync('D:/exbuilder/clx-build/univ/screg/usc02/usc_3010201_u.clx.js', 'utf8');

function extractFunctionBody(content, declIdx) {
  const marker = '(function(container){';
  const start = content.indexOf(marker, declIdx);
  if (start < 0 || start - declIdx > 5000) return '';
  let depth = 0, i = start;
  while (i < content.length) {
    if (content[i] === '{') depth++;
    else if (content[i] === '}') { depth--; if (depth === 0) break; }
    i++;
  }
  return content.slice(start + marker.length, i);
}

const containerRe = /new\s+cpr\.controls\.Container\("((SEARCHGROUP|CONDITIONGROUP|BATCH_GROUP)(\d+))"\)/g;
let m;
const output = [];

while ((m = containerRe.exec(c)) !== null) {
  const groupId = m[1];
  const body = extractFunctionBody(c, m.index);
  output.push(`\n=== ${groupId} (bodyLen=${body.length}) ===`);
  if (body.length === 0) continue;

  const declRe2 = /var\s+(\w+)\s*=\s*(?:linker\.\w+\s*=\s*)?new\s+([\w.]+)\("([^"]+)"\)/g;
  let dm;
  while ((dm = declRe2.exec(body)) !== null) {
    const [, varName, fullType, id] = dm;
    const type = fullType.split('.').pop();
    const addRe = new RegExp(`container\\.addChild\\(\\s*${varName}\\s*,\\s*\\{([^}]+)\\}`);
    const addM = addRe.exec(body);
    if (!addM) { output.push(`  [no addChild] ${varName}|${type}|${id}`); continue; }
    const constraint = addM[1];
    const row = /"rowIndex"\s*:\s*(\d+)/.exec(constraint)?.[1] ?? '-';
    const col = /"colIndex"\s*:\s*(\d+)/.exec(constraint)?.[1] ?? '-';
    let extra = '';
    if (type === 'Output') {
      const valM = new RegExp(`${varName}\\.value\\s*=\\s*"([^"]+)"`).exec(body);
      extra = ` = "${valM?.[1] ?? ''}"`;
    } else if (fullType.startsWith('udc.')) {
      const lkRe = new RegExp(`app\\.lookup\\("${id}"\\)\\.(\\w+)\\s*\\(\\s*"([^"]+)"`, 'g');
      const labels = [];
      let lm;
      while ((lm = lkRe.exec(c)) !== null) {
        if (!/[Ww]idth|tooltip|button|title/i.test(lm[1])) labels.push(lm[2]);
      }
      extra = labels.length ? ` labels=[${labels.join(', ')}]` : ` (no app.lookup label)`;
    }
    output.push(`  row=${row} col=${col}  ${varName}|${type}|${id}${extra}`);
  }
}

const result = output.join('\n');
fs.writeFileSync('E:/AI개발_개인/auto_maunal_v6/scripts/popup_final_result.txt', result, 'utf8');
console.log(result);

  const prefix = m[2];
  const body = extractFunctionBody(c, m.index);
  lines.push(`\n=== ${groupId} (index=${m.index}, bodyLen=${body.length}) ===`);

  if (body.length === 0) {
    // 2000자 초과 여부 확인
    const marker = '(function(container){';
    const start = c.indexOf(marker, m.index);
    lines.push(`  (function start at ${start}, distance=${start - m.index})`);
    continue;
  }

  // outer body 컨트롤 파싱
  const declRe = /var\s+(\w+)\s*=\s*(?:linker\.\w+\s*=\s*)?new\s+([\w.]+)\("([^"]+)"\)/g;
  let dm;
  while ((dm = declRe.exec(body)) !== null) {
    const [, varName, fullType, id] = dm;
    const type = fullType.split('.').pop();
    const addRe = new RegExp(`container\\.addChild\\(\\s*${varName}\\s*,\\s*\\{([^}]+)\\}`);
    const addM = addRe.exec(body);
    if (!addM) { lines.push(`  [no addChild] ${varName}|${type}|${id}`); continue; }
    const constraint = addM[1];
    const row = /"rowIndex"\s*:\s*(\d+)/.exec(constraint)?.[1] ?? '-';
    const col = /"colIndex"\s*:\s*(\d+)/.exec(constraint)?.[1] ?? '-';
    let extra = '';
    if (type === 'Output') {
      const valM = new RegExp(`${varName}\\.value\\s*=\\s*"([^"]+)"`).exec(body);
      extra = ` = "${valM?.[1] ?? ''}"`; 
    } else if (fullType.startsWith('udc.')) {
      // UDC: app.lookup 라벨 탐색
      const lkRe = new RegExp(`app\\.lookup\\("${id}"\\)\\.(\\w+)\\s*\\(\\s*"([^"]+)"`, 'g');
      const labels = [];
      let lm;
      while ((lm = lkRe.exec(c)) !== null) { if (!/[Ww]idth|tooltip|button|title/i.test(lm[1])) labels.push(lm[2]); }
      if (labels.length) extra = ` labels=[${labels.join(', ')}]`;
      else extra = ` (no app.lookup label)`;
    }
    lines.push(`  row=${row} col=${col}  ${varName}|${type}|${id}${extra}`);
  }
}

const out = lines.join('\n');
fs.writeFileSync('E:/AI개발_개인/auto_maunal_v6/scripts/popup_final_result.txt', out, 'utf8');
console.log(out);

lines.push(`=== first 200 chars of body ===`);
lines.push(body.slice(0, 200));
lines.push('');
lines.push(`=== BATCH_GROUP01 nearby context (raw find) ===`);
const rawIdx = c.indexOf('"BATCH_GROUP01"');
lines.push(`found at index: ${rawIdx}`);
if (rawIdx >= 0) {
  lines.push(c.slice(rawIdx, rawIdx + 400));
}

const declRe = /var\s+(\w+)\s*=\s*(?:linker\.\w+\s*=\s*)?new\s+([\w.]+)\("([^"]+)"\)/g;
let m;
while ((m = declRe.exec(body)) !== null) {
  const [, varName, type, id] = m;
  const addRe = new RegExp(`container\\.addChild\\(\\s*${varName}\\s*,\\s*\\{([^}]+)\\}`);
  const addM = addRe.exec(body);
  const constraint = addM ? addM[1] : '(no addChild)';
  const row = /"rowIndex"\s*:\s*(\d+)/.exec(constraint)?.[1] ?? '-';
  const col = /"colIndex"\s*:\s*(\d+)/.exec(constraint)?.[1] ?? '-';
  let extra = '';
  if (type.endsWith('Output')) {
    const valM = new RegExp(`${varName}\\.value\\s*=\\s*"([^"]+)"`).exec(body);
    extra = ` value="${valM?.[1] ?? ''}"`;
  }
  lines.push(`  ${varName} | ${type.split('.').pop()} | ${id} | row=${row} col=${col}${extra}`);
}

lines.push('\n=== Nested Containers in BATCH_GROUP01 ===');
const ctRe = /var\s+(\w+)\s*=\s*(?:linker\.\w+\s*=\s*)?new\s+cpr\.controls\.Container\("([^"]+)"\)/g;
while ((m = ctRe.exec(body)) !== null) {
  const [, varName, id] = m;
  const addRe = new RegExp(`container\\.addChild\\(\\s*${varName}\\s*,\\s*\\{([^}]+)\\}`);
  const addM = addRe.exec(body);
  const constraint = addM ? addM[1] : '(no addChild)';
  const row = /"rowIndex"\s*:\s*(\d+)/.exec(constraint)?.[1] ?? '-';
  const col = /"colIndex"\s*:\s*(\d+)/.exec(constraint)?.[1] ?? '-';
  lines.push(`  Container: ${varName} | ${id} | row=${row} col=${col}`);

  const endPat = `})(${varName})`;
  const endIdx = body.indexOf(endPat);
  if (endIdx < 0) continue;
  const marker = '(function(container){';
  let depth2 = 0, j = endIdx;
  while (j >= 0) {
    if (body[j] === '}') depth2++;
    else if (body[j] === '{') {
      depth2--;
      if (depth2 === 0) {
        const cs = j - (marker.length - 1);
        if (cs >= 0 && body.slice(cs, j+1) === marker) {
          const inner = body.slice(j+1, endIdx);
          const innerRe = /var\s+(\w+)\s*=\s*(?:linker\.\w+\s*=\s*)?new\s+([\w.]+)\("([^"]+)"\)/g;
          let mm;
          while ((mm = innerRe.exec(inner)) !== null) {
            const [, vn, tp, cid] = mm;
            const addR = new RegExp(`container\\.addChild\\(\\s*${vn}\\s*,\\s*\\{([^}]+)\\}`);
            const am = addR.exec(inner);
            const cn = am ? am[1] : '';
            const r = /"rowIndex"\s*:\s*(\d+)/.exec(cn)?.[1] ?? '-';
            const co = /"colIndex"\s*:\s*(\d+)/.exec(cn)?.[1] ?? '-';
            let ex = '';
            if (tp.endsWith('Output')) {
              const valM = new RegExp(`${vn}\\.value\\s*=\\s*"([^"]+)"`).exec(inner);
              ex = ` value="${valM?.[1] ?? ''}"`;
            }
            lines.push(`    inner: ${vn} | ${tp.split('.').pop()} | ${cid} | row=${r} col=${co}${ex}`);
          }
          break;
        }
        break;
      }
    }
    j--;
  }
}

lines.push('\n=== app.lookup label calls relevant to BATCH_GROUP01 ===');
const lkRe = /app\.lookup\("([^"]+)"\)\.(init\w*Label|set\w*Label)\s*\(\s*"([^"]+)"/g;
while ((m = lkRe.exec(c)) !== null) {
  lines.push(`  ${m[1]}.${m[2]}("${m[3]}")`);
}

const out = lines.join('\n');
fs.writeFileSync('E:/AI개발_개인/auto_maunal_v6/scripts/popup_final_result.txt', out, 'utf8');
console.log(out);

function analyzePopup(filePath) {
  const c = fs.readFileSync(filePath, 'utf8');
  const programName = /\/\/\s*\[프로그램\]\s*(.+)/.exec(c)?.[1]?.trim() ?? '';
  
  // titleBars 파싱
  const bars = [];
  const titleRe = /var\s+(\w+)\s*=\s*(?:\w+\.\w+\s*=\s*)?new\s+udc\.common\.PatisTitleBar\s*\(/g;
  const seenVars = new Set();
  let m;
  while ((m = titleRe.exec(c)) !== null) {
    const vn = m[1];
    if (seenVars.has(vn)) continue;
    seenVars.add(vn);
    const after = c.slice(m.index, m.index + 800);
    const titleM = new RegExp(`${vn}\\.title\\s*=\\s*"([^"]+)"`).exec(after);
    if (!titleM) continue;
    bars.push({
      title: titleM[1],
      hasInquiry: /function\s+TitleForm_inq(Action|Click)\s*\(/.test(c),
      hasNew: /function\s+TitleForm_new(Action|Click)\s*\(/.test(c),
      hasSave: /function\s+TitleForm_save(Action|Click)\s*\(/.test(c),
      hasDelete: /function\s+TitleForm_del(Action|Click)\s*\(/.test(c),
    });
  }
  
  // items
  const hasSearchGrp = /new\s+cpr\.controls\.Container\("(?:SEARCHGROUP|CONDITIONGROUP)\d+"/.test(c);
  const hasInfoGrp = /new\s+cpr\.controls\.Container\("INFOGROUP\d+"/.test(c);
  
  return {
    overview: { programName },
    usage: {
      menuTitleBar: {
        hasInquiry: /function\s+Form_inq(Action|Click)\s*\(/.test(c),
        hasNew: /function\s+Form_new(Action|Click)\s*\(/.test(c),
        hasSave: /function\s+Form_save(Action|Click)\s*\(/.test(c),
        hasDelete: /function\s+Form_del(Action|Click)\s*\(/.test(c),
      },
      titleBars: bars,
    },
    items: {
      conditionGroups: hasSearchGrp ? [{ controls: [] }] : [],
      infoGroups: hasInfoGrp ? [{ controls: [] }] : [],
    },
  };
}

function generatePopupDescriptionFromResult(btnName, popupResult) {
  const steps = [];
  steps.push(`Step1. '${btnName}' 버튼을 클릭하여 팝업 화면을 연다.`);
  
  const menu = popupResult.usage.menuTitleBar;
  const titleBars = popupResult.usage.titleBars;
  
  const menuHasCrud = menu.hasInquiry || menu.hasNew || menu.hasSave || menu.hasDelete;
  const titleBarsWithCrud = titleBars.filter(
    tb => tb.hasInquiry || tb.hasNew || tb.hasSave || tb.hasDelete
  );
  const hasAnyCrud = menuHasCrud || titleBarsWithCrud.length > 0;
  
  let stepNum = 2;
  
  if (!hasAnyCrud) {
    const hasInputGroups = popupResult.items.conditionGroups.length > 0 || popupResult.items.infoGroups.length > 0;
    if (hasInputGroups) {
      steps.push(`Step${stepNum++}. 팝업 화면에서 필요한 정보를 입력한다.`);
      steps.push(`Step${stepNum}. 확인 버튼을 클릭하여 팝업을 닫는다.`);
    } else {
      steps.push(`Step${stepNum++}. 팝업 화면에서 필요한 작업을 수행한다.`);
      steps.push(`Step${stepNum}. 작업 완료 후 팝업을 닫는다.`);
    }
    return steps.join('\n');
  }
  
  if (menuHasCrud) {
    if (menu.hasInquiry) steps.push(`Step${stepNum++}. 조회 조건을 입력하고 '조회' 버튼을 클릭한다.`);
    if (menu.hasNew) steps.push(`Step${stepNum++}. '신규' 버튼을 클릭하여 필요한 정보를 입력한다.`);
    if (menu.hasSave) steps.push(`Step${stepNum++}. 필요한 정보를 입력 후 '저장' 버튼을 클릭한다.`);
    if (menu.hasDelete) steps.push(`Step${stepNum++}. 삭제할 항목을 선택 후 '삭제' 버튼을 클릭한다.`);
  }
  
  for (const tb of titleBarsWithCrud) {
    const tbLabel = tb.title ? `'${tb.title}'` : '그리드 타이틀바';
    const ops = [];
    if (tb.hasInquiry) ops.push('조회');
    if (tb.hasNew) ops.push('신규');
    if (tb.hasSave) ops.push('저장');
    if (tb.hasDelete) ops.push('삭제');
    steps.push(`Step${stepNum++}. ${tbLabel} 목록에서 ${ops.join('·')} 작업을 수행한다.`);
  }
  
  steps.push(`Step${stepNum}. 작업 완료 후 팝업을 닫는다.`);
  return steps.join('\n');
}

// 결과 출력


