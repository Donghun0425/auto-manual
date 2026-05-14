'use strict';
const fs = require('fs');
const c = fs.readFileSync('D:/exbuilder/clx-build/univ/screg/usc02/usc_3010201_u.clx.js', 'utf8');

// conditionGroupParser의 핵심 로직 포팅 (rowIndex 수정 후 검증)
const SKIP_TYPES = new Set(['Output','Button','Container','Grid','PatisTitleBar','PatisMenuTitleBar','ProgressBar','Splitter','TabPanel','UcoBtchList']);
const OUTPUT_LABEL_UDCS = new Set(['PatisCombo']);

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

function extractNestedFunctionBody(body, varName) {
  const endPattern = `})(${varName})`;
  const funcMarker = '(function(container){';
  let searchFrom = 0;
  while (searchFrom < body.length) {
    const endIdx = body.indexOf(endPattern, searchFrom);
    if (endIdx < 0) break;
    let depth = 0, i = endIdx;
    while (i >= 0) {
      if (body[i] === '}') depth++;
      else if (body[i] === '{') {
        depth--;
        if (depth === 0) {
          const cs = i - (funcMarker.length - 1);
          if (cs >= 0 && body.slice(cs, i + 1) === funcMarker) return body.slice(i + 1, endIdx);
          break;
        }
      }
      i--;
    }
    searchFrom = endIdx + 1;
  }
  return '';
}

const LAYOUT_RE = /^(LAYOUT|SEARCHGROUP|CONDITIONGROUP|BATCH_GROUP|GRID_GROUP|CT_)/;

function parseBodyControls(body, fullContent) {
  const result = [];
  let outerBody = body;
  const nestedEntries = [];

  const ctRe = /var\s+(\w+)\s*=\s*(?:linker\.\w+\s*=\s*)?new\s+cpr\.controls\.Container\("([^"]+)"\)/g;
  let cs;
  while ((cs = ctRe.exec(body)) !== null) {
    const [, varName, controlId] = cs;
    if (LAYOUT_RE.test(controlId)) continue;
    const addRe = new RegExp(`container\\.addChild\\(\\s*${varName}\\s*,\\s*\\{([^}]+)\\}`);
    const addM = addRe.exec(body);
    if (!addM) continue;
    const col = parseInt(/"colIndex"\s*:\s*(\d+)/.exec(addM[1])?.[1] ?? '0');
    const row = parseInt(/"rowIndex"\s*:\s*(\d+)/.exec(addM[1])?.[1] ?? '0');
    const nestedBody = extractNestedFunctionBody(body, varName);
    if (!nestedBody) continue;
    nestedEntries.push({ rowIndex: row, colIndex: col, nestedBody });
    const endPattern = `})(${varName})`;
    const funcMarker = '(function(container){';
    const endIdx = body.indexOf(endPattern);
    if (endIdx >= 0) {
      let depth = 0, i = endIdx;
      while (i >= 0) {
        if (body[i] === '}') depth++;
        else if (body[i] === '{') {
          depth--;
          if (depth === 0) {
            const cs2 = i - (funcMarker.length - 1);
            if (cs2 >= 0 && body.slice(cs2, i + 1) === funcMarker) {
              const bStart = cs2 - 1;
              const bEnd = endIdx + endPattern.length;
              outerBody = outerBody.slice(0, bStart) + ' '.repeat(bEnd - bStart) + outerBody.slice(bEnd);
              break;
            }
            break;
          }
        }
        i--;
      }
    }
  }

  const declRe = /var\s+(\w+)\s*=\s*(?:linker\.\w+\s*=\s*)?new\s+([\w.]+)\("([^"]+)"\)/g;
  let m;
  while ((m = declRe.exec(outerBody)) !== null) {
    const [, varName, fType, controlId] = m;
    const type = fType.split('.').pop();
    if (type === 'Container') continue;
    const addRe = new RegExp(`container\\.addChild\\(\\s*${varName}\\s*,\\s*\\{([^}]+)\\}`);
    const addM = addRe.exec(outerBody);
    if (!addM) continue;
    const col = parseInt(/"colIndex"\s*:\s*(\d+)/.exec(addM[1])?.[1] ?? '0');
    const row = parseInt(/"rowIndex"\s*:\s*(\d+)/.exec(addM[1])?.[1] ?? '0');
    let labelValue = '';
    if (type === 'Output') {
      const valM = new RegExp(`${varName}\\.value\\s*=\\s*"([^"]+)"`).exec(outerBody);
      if (valM) labelValue = valM[1];
    }
    result.push({ varName, controlId, controlType: type, fullType: fType, labelValue, colIndex: col, rowIndex: row });
  }

  // ★ 수정된 nested 병합: nc.rowIndex 보존
  for (const { rowIndex, colIndex, nestedBody } of nestedEntries) {
    const nc = parseBodyControls(nestedBody, fullContent);
    for (const c2 of nc) {
      result.push({ ...c2, rowIndex: rowIndex + c2.rowIndex * 0.1, colIndex: colIndex + (c2.colIndex + 1) * 0.01 });
    }
  }
  return result;
}

function buildPairs(controls) {
  const rowMap = new Map();
  for (const ctrl of controls) {
    if (!rowMap.has(ctrl.rowIndex)) rowMap.set(ctrl.rowIndex, { labels: [], inputs: [] });
    const row = rowMap.get(ctrl.rowIndex);
    if (ctrl.controlType === 'Output') row.labels.push(ctrl);
    else if (!SKIP_TYPES.has(ctrl.controlType)) row.inputs.push(ctrl);
  }
  const result = [];
  for (const [, row] of rowMap) {
    row.labels.sort((a, b) => a.colIndex - b.colIndex);
    row.inputs.sort((a, b) => a.colIndex - b.colIndex);
    const seenLabels = new Set();
    for (const input of row.inputs) {
      let labelText;
      if (input.fullType.startsWith('udc.') && !OUTPUT_LABEL_UDCS.has(input.controlType)) {
        labelText = input.labelValue || input.controlId;
      } else {
        const label = row.labels.filter(l => l.colIndex < input.colIndex).slice(-1)[0];
        labelText = label?.labelValue ?? input.controlId;
      }
      if (seenLabels.has(labelText)) continue;
      seenLabels.add(labelText);
      result.push({ controlId: input.controlId, labelText, controlType: input.controlType });
    }
  }
  result.sort((a, b) => {
    const ca = controls.find(c => c.controlId === a.controlId);
    const cb = controls.find(c => c.controlId === b.controlId);
    if (!ca || !cb) return 0;
    if (ca.rowIndex !== cb.rowIndex) return ca.rowIndex - cb.rowIndex;
    return ca.colIndex - cb.colIndex;
  });
  return result;
}

const containerRe = /new\s+cpr\.controls\.Container\("((SEARCHGROUP|CONDITIONGROUP|BATCH_GROUP)(\d+))"\)/g;
let m;
const lines = [];
while ((m = containerRe.exec(c)) !== null) {
  const groupId = m[1];
  const body = extractFunctionBody(c, m.index);
  lines.push(`\n=== ${groupId} (bodyLen=${body.length}) ===`);
  if (!body) continue;
  const controls = parseBodyControls(body, c);
  const pairs = buildPairs(controls);
  pairs.forEach(p => lines.push(`  ${p.labelText}  [${p.controlType}]  (${p.controlId})`));
}

const out = lines.join('\n');
fs.writeFileSync('E:/AI개발_개인/auto_maunal_v6/scripts/popup_final_result.txt', out, 'utf8');
console.log(out);


while ((m = containerRe.exec(c)) !== null) {
  const groupId = m[1];
  const { body, distance } = extractFunctionBody(c, m.index);
  lines.push(`\n=== ${groupId} (bodyLen=${body.length}, dist=${distance}) ===`);
  if (body.length === 0) continue;

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
      const lkRe2 = new RegExp(`app\\.lookup\\("${id}"\\)\\.(\\w+)\\s*\\(\\s*"([^"]+)"`, 'g');
      const labels = [];
      let lm;
      while ((lm = lkRe2.exec(c)) !== null) {
        if (!/[Ww]idth|tooltip|button|title/i.test(lm[1])) labels.push(lm[2]);
      }
      extra = labels.length ? ` labels=[${labels.join(', ')}]` : ` (no label)`;
    }
    lines.push(`  row=${row} col=${col}  ${varName}|${type}|${id}${extra}`);
  }
}

