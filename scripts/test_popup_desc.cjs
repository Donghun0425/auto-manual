'use strict';
/**
 * resolvePopupDescriptions 로직을 JS로 재현하여 결과 확인
 */
const fs = require('fs');
const BASE = 'D:/workspace_pkg2_term (2)/workspace_pkg2_term/exbuilder/clx-build/common/system/csm01/';

function extractFunctionBody(c, fn) {
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

function extractPopupUrl(body) {
  const m1 = /var\s+popupUrl\s*=\s*"([^"]+)"/.exec(body);
  if (m1) return m1[1];
  const m2 = /openPopup\s*\([^,]+,[^,]+,\s*"([^"]+)"/.exec(body);
  if (m2) return m2[1];
  return null;
}

function generatePopupDescription(btnName, popupContent) {
  const steps = [];
  steps.push(`Step1. '${btnName}' 버튼을 클릭하여 팝업 화면을 연다.`);
  
  const menuHasInq  = /function\s+Form_inq(Action|Click)\s*\(/.test(popupContent);
  const menuHasSave = /function\s+Form_save(Action|Click)\s*\(/.test(popupContent);
  const menuHasDel  = /function\s+Form_del(Action|Click)\s*\(/.test(popupContent);
  const titleHasInq  = /function\s+TitleForm_inq(Action|Click)\s*\(/.test(popupContent);
  const titleHasNew  = /function\s+TitleForm_new(Action|Click)\s*\(/.test(popupContent);
  const titleHasSave = /function\s+TitleForm_save(Action|Click)\s*\(/.test(popupContent);
  const titleHasDel  = /function\s+TitleForm_del(Action|Click)\s*\(/.test(popupContent);
  
  const hasAnyAction = menuHasInq || menuHasSave || menuHasDel || titleHasInq || titleHasNew || titleHasSave || titleHasDel;
  const titleM = /\.title\s*=\s*"([^"]+)"/.exec(popupContent);
  const popupTitle = titleM?.[1];
  
  let stepNum = 2;
  
  if (!hasAnyAction) {
    const hasInput = /new\s+cpr\.controls\.InputBox/.test(popupContent);
    if (hasInput) {
      steps.push(`Step${stepNum++}. 팝업 화면에서 필요한 정보를 입력한다.`);
      steps.push(`Step${stepNum++}. '확인' 버튼을 클릭하여 팝업을 닫는다.`);
    } else {
      steps.push(`Step${stepNum++}. 팝업 화면에서 필요한 작업을 수행한다.`);
      steps.push(`Step${stepNum++}. 작업 완료 후 팝업을 닫는다.`);
    }
    return steps.join('\n');
  }
  
  const hasInq  = menuHasInq  || titleHasInq;
  const hasSave = menuHasSave || titleHasSave;
  const hasDel  = menuHasDel  || titleHasDel;
  const hasNew  = titleHasNew;
  const titlePrefix = popupTitle ? `'${popupTitle}'` : '팝업';
  
  if (hasInq) steps.push(`Step${stepNum++}. ${titlePrefix} 화면에서 조회 조건을 입력하고 '조회' 버튼을 클릭한다.`);
  if (hasNew) steps.push(`Step${stepNum++}. '신규' 버튼을 클릭하여 데이터를 입력한다.`);
  if (hasSave) steps.push(`Step${stepNum++}. 필요한 정보를 입력 후 '저장' 버튼을 클릭한다.`);
  if (hasDel)  steps.push(`Step${stepNum++}. 삭제할 항목을 선택 후 '삭제' 버튼을 클릭한다.`);
  steps.push(`Step${stepNum}. 작업 완료 후 팝업을 닫는다.`);
  
  return steps.join('\n');
}

// 메인 파일 분석
const mainContent = fs.readFileSync(BASE + 'csm_1020101_u.clx.js', 'utf8');

const extMatches = [...mainContent.matchAll(/function\s+Form_ext(\d+)Click\s*\(/g)];
const lines = [];

for (const match of extMatches) {
  const idx = parseInt(match[1]);
  const fn = 'Form_ext' + idx + 'Click';
  const body = extractFunctionBody(mainContent, fn);
  const popupUrl = extractPopupUrl(body);
  
  lines.push(`=== Form_ext${idx}Click ===`);
  lines.push(`popupUrl: ${popupUrl}`);
  
  if (popupUrl) {
    // 파일 목록에서 찾기
    const normalizeUrl = u => u.replace(/\\/g, '/').replace(/\.clx\.js$/i, '');
    const popupFileName = popupUrl.split('/').pop() + '.clx.js';
    const popupPath = BASE + popupFileName;
    
    try {
      const popupContent = fs.readFileSync(popupPath, 'utf8');
      const desc = generatePopupDescription('버튼명', popupContent);
      lines.push('description (with popup):');
      lines.push(desc);
    } catch(e) {
      lines.push('팝업 파일 없음: ' + popupPath);
    }
  }
  lines.push('');
}

const resultText = lines.join('\n');
fs.writeFileSync('E:/AI개발_개인/auto_maunal_v6/scripts/popup_desc_result.txt', resultText, 'utf8');
console.log('done');
