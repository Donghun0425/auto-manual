const fs = require('fs');
const path = require('path');

// conditionGroupParser 로직 포팅 (핵심 부분만)
const SKIP_TYPES = new Set(['Output', 'Button', 'Container', 'Grid', 'PatisTitleBar',
  'PatisMenuTitleBar', 'ProgressBar', 'Splitter', 'TabPanel']);
const OUTPUT_LABEL_UDCS = new Set(['PatisCombo']);

function shortType(fullType) { return fullType.split('.').pop() ?? fullType; }
function isUdcType(fullType) { return fullType.startsWith('udc.'); }
function isSeparatorLabel(label) { return /^[~\-\/|·•]+$/.test(label.trim()); }

const LAYOUT_CONTAINER_RE = /^(LAYOUT|SEARCHGROUP|CONDITIONGROUP|BATCH_GROUP|GRID_GROUP|CT_)/;

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
          const checkStart = i - (funcMarker.length - 1);
          if (checkStart >= 0 && body.slice(checkStart, i + 1) === funcMarker)
            return body.slice(i + 1, endIdx);
          break;
        }
      }
      i--;
    }
    searchFrom = endIdx + 1;
  }
  return '';
}

function extractFunctionBody(content, containerDeclIdx) {
  const funcMarker = '(function(container){';
  const start = content.indexOf(funcMarker, containerDeclIdx);
  if (start < 0 || start - containerDeclIdx > 2000) return '';
  let depth = 0, i = start;
  while (i < content.length) {
    if (content[i] === '{') depth++;
    else if (content[i] === '}') { depth--; if (depth === 0) return content.slice(start + funcMarker.length, i); }
    i++;
  }
  return '';
}

function parseBodyControls(body, fullContent) {
  const result = [];

  // 중첩 Container 블록을 먼저 처리하고 outer body에서 제거
  let outerBody = body;
  const nestedEntries = [];

  const containerScanRe = /var\s+(\w+)\s*=\s*(?:linker\.\w+\s*=\s*)?new\s+cpr\.controls\.Container\("([^"]+)"\)/g;
  let cs;
  while ((cs = containerScanRe.exec(body)) !== null) {
    const varName = cs[1], controlId = cs[2];
    if (LAYOUT_CONTAINER_RE.test(controlId)) continue;
    const addChildRe = new RegExp(`container\\.addChild\\(\\s*${varName}\\s*,\\s*\\{([^}]+)\\}`);
    const addMatch = addChildRe.exec(body);
    if (!addMatch) continue;
    const constraint = addMatch[1];
    const colIndex = parseInt(/"colIndex"\s*:\s*(\d+)/.exec(constraint)?.[1] ?? '0');
    const rowIndex = parseInt(/"rowIndex"\s*:\s*(\d+)/.exec(constraint)?.[1] ?? '0');
    const nestedBody = extractNestedFunctionBody(body, varName);
    if (!nestedBody) continue;
    nestedEntries.push({ rowIndex, colIndex, nestedBody });
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
            const checkStart = i - (funcMarker.length - 1);
            if (checkStart >= 0 && body.slice(checkStart, i + 1) === funcMarker) {
              const blockStart = checkStart - 1;
              const blockEnd = endIdx + endPattern.length;
              outerBody = outerBody.slice(0, blockStart) + ' '.repeat(blockEnd - blockStart) + outerBody.slice(blockEnd);
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
    const varName = m[1], fType = m[2], controlId = m[3], type = shortType(fType);
    if (type === 'Container') continue;
    const addChildRe = new RegExp(`container\\.addChild\\(\\s*${varName}\\s*,\\s*\\{([^}]+)\\}`);
    const addMatch = addChildRe.exec(outerBody);
    if (!addMatch) continue;
    const constraint = addMatch[1];
    const colIndex = parseInt(/"colIndex"\s*:\s*(\d+)/.exec(constraint)?.[1] ?? '0');
    const rowIndex = parseInt(/"rowIndex"\s*:\s*(\d+)/.exec(constraint)?.[1] ?? '0');
    let labelValue = '';
    if (type === 'Output') {
      const valM = new RegExp(`${varName}\\.value\\s*=\\s*"([^"]+)"`).exec(outerBody);
      if (valM) labelValue = valM[1];
    }
    result.push({ varName, controlId, controlType: type, fullType: fType, labelValue, colIndex, rowIndex, isReadOnly: false, isDisabled: false });
  }

  for (const { rowIndex, colIndex, nestedBody } of nestedEntries) {
    const nestedControls = parseBodyControls(nestedBody, fullContent);
    for (const nc of nestedControls) {
      result.push({ ...nc, rowIndex: rowIndex + nc.rowIndex * 0.1, colIndex: colIndex + (nc.colIndex + 1) * 0.01 });
    }
  }
  return result;
}

function applyRangePairSuffixes(pairs) {
  const START_TOKENS = ['STT', 'BGN', 'BGNG', 'FROM', 'START', 'ST'];
  const END_TOKENS   = ['END', 'TO', 'FIN', 'ED'];
  const processed = new Set();
  for (const item of pairs) {
    if (processed.has(item.controlId)) continue;

    // 패턴1: 접미사 _STT/_BGN/_BGNG → _END
    let matched = false;
    for (const sv of START_TOKENS) {
      if (!item.controlId.endsWith(`_${sv}`)) continue;
      const base = item.controlId.slice(0, -(sv.length + 1));
      const endItem = pairs.find(p => !processed.has(p.controlId) && END_TOKENS.some(ev => p.controlId === `${base}_${ev}`));
      if (!endItem) continue;
      const validLabel = [item.labelText, endItem.labelText].find(
        l => l && !isSeparatorLabel(l) && !/^S_/.test(l) && l.trim().length > 0
      );
      if (!validLabel) continue;
      item.labelText = `${validLabel}(시작)`;
      endItem.labelText = `${validLabel}(종료)`;
      processed.add(item.controlId);
      processed.add(endItem.controlId);
      console.log(`  [범위 쌍 처리] ${item.controlId} → "${item.labelText}", ${endItem.controlId} → "${endItem.labelText}"`);
      matched = true;
      break;
    }
    if (matched) continue;

    // 패턴2: 중간 세그먼트 _BGNG_/_STT_ → _END_
    for (const sv of START_TOKENS) {
      const midRe = new RegExp(`_(${sv})_`, 'i');
      if (!midRe.test(item.controlId)) continue;
      const endItem = pairs.find(p => !processed.has(p.controlId) &&
        END_TOKENS.some(ev => p.controlId === item.controlId.replace(midRe, `_${ev}_`)));
      if (!endItem) continue;
      const validLabel = [item.labelText, endItem.labelText].find(
        l => l && !isSeparatorLabel(l) && !/^S_/.test(l) && l.trim().length > 0
      );
      if (!validLabel) continue;
      item.labelText = `${validLabel}(시작)`;
      endItem.labelText = `${validLabel}(종료)`;
      processed.add(item.controlId);
      processed.add(endItem.controlId);
      console.log(`  [범위 쌍 처리] ${item.controlId} → "${item.labelText}", ${endItem.controlId} → "${endItem.labelText}"`);
      break;
    }
  }
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
    row.labels.sort((a,b) => a.colIndex - b.colIndex);
    row.inputs.sort((a,b) => a.colIndex - b.colIndex);
    for (const input of row.inputs) {
      let labelText;
      if (isUdcType(input.fullType) && !OUTPUT_LABEL_UDCS.has(input.controlType) || input.controlType === 'CheckBox') {
        labelText = input.labelValue || (row.labels.slice().sort((a,b)=>Math.abs(a.colIndex-input.colIndex)-Math.abs(b.colIndex-input.colIndex))[0] || {}).labelValue || input.controlId;
      } else {
        const label = row.labels.filter(l => l.colIndex < input.colIndex).slice(-1)[0];
        labelText = label?.labelValue ?? input.controlId;
        // 폴백: T_[controlId] 탐색
        if (labelText === input.controlId || isSeparatorLabel(labelText)) {
          const tIdLabel = row.labels.find(l => l.controlId === `T_${input.controlId}`)?.labelValue;
          if (tIdLabel) {
            labelText = tIdLabel;
            console.log(`  [T_id 폴백] ${input.controlId} → "${labelText}"`);
          } else {
            const base = input.controlId.replace(/_(STT|BGN|FROM|ST|END|TO|FIN|ED)$/i, '');
            const tBaseLabel = row.labels.find(l => l.controlId.startsWith(`T_${base}`) && !isSeparatorLabel(l.labelValue))?.labelValue;
            if (tBaseLabel) {
              labelText = tBaseLabel;
              console.log(`  [T_base 폴백] ${input.controlId} (base=${base}) → "${labelText}"`);
            }
          }
        }
      }
      result.push({ controlId: input.controlId, labelText, controlType: input.controlType });
    }
  }
  result.sort((a,b)=>{
    const ca = controls.find(c=>c.controlId===a.controlId);
    const cb = controls.find(c=>c.controlId===b.controlId);
    if (!ca||!cb) return 0;
    if (ca.rowIndex!==cb.rowIndex) return ca.rowIndex-cb.rowIndex;
    return ca.colIndex-cb.colIndex;
  });
  applyRangePairSuffixes(result);
  return result;
}

function parseConditionGroups(content) {
  const groups = [];
  const containerRe = /new\s+cpr\.controls\.Container\("((SEARCHGROUP|CONDITIONGROUP|BATCH_GROUP)(\d+))"\)/g;
  let m;
  while ((m = containerRe.exec(content)) !== null) {
    const groupId = m[1];
    const groupType = m[2] === 'SEARCHGROUP' ? '조회조건' : m[2] === 'CONDITIONGROUP' ? '처리조건' : '일괄처리';
    const body = extractFunctionBody(content, m.index);
    if (!body) { console.log(`  [WARN] ${groupId} body 추출 실패`); continue; }
    const controls = parseBodyControls(body, content);
    const pairs = buildPairs(controls);
    console.log(`\n[${groupId}/${groupType}] controls:${controls.length}, pairs:${pairs.length}`);
    for (const p of pairs) console.log(`  ${p.controlId} (${p.controlType}) → "${p.labelText}"`);
    if (pairs.length > 0) groups.push({ groupId, groupType, controls: pairs });
  }
  return groups;
}

// 테스트 (usc_3010201_u: BATCH_GROUP 검증)
const files = [
  'D:/exbuilder/clx-build/univ/screg/usc02/usc_3010201_u.clx.js',
];
for (const f of files) {
  console.log('\n======== ' + path.basename(f) + ' ========');
  const content = fs.readFileSync(f, 'utf8');
  parseConditionGroups(content);
}
