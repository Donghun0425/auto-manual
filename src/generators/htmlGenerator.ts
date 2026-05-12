/**
 * HTML 매뉴얼 생성기
 * - 분석 결과를 기반으로 스타일 적용된 HTML 매뉴얼 생성
 */
import { AnalysisResult, ExtButtonInfo } from '@/types';

/**
 * 분석 결과를 HTML 형식의 매뉴얼로 변환
 * @param result - 파일 분석 결과
 * @returns HTML 문자열
 */
export function generateHtml(result: AnalysisResult): string {
  const title = result.overview.programName || result.filePath;

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)} - 사용자 매뉴얼</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, 'Segoe UI', 'Malgun Gothic', sans-serif;
      max-width: 820px;
      margin: 0 auto;
      padding: 28px 36px 48px;
      line-height: 1.55;
      color: #1a1a1a;
      font-size: 12px;
      background: #ffffff;
    }
    /* 제목 */
    h1 {
      font-size: 17px;
      font-weight: 700;
      color: #111;
      letter-spacing: -0.03em;
      padding-bottom: 10px;
      border-bottom: 1.5px solid #e4e4e7;
      margin-bottom: 20px;
    }
    /* 섹션 제목 */
    h2 {
      font-size: 11.5px;
      font-weight: 600;
      color: #18181b;
      margin-top: 24px;
      margin-bottom: 8px;
      padding-left: 9px;
      border-left: 3px solid #18181b;
      letter-spacing: -0.01em;
    }
    /* 섹션 박스 */
    .section {
      padding: 12px 14px;
      border: 1px solid #e4e4e7;
      border-radius: 6px;
      background: #fafafa;
      margin-bottom: 4px;
    }
    /* 개요 항목 행 */
    .info-row {
      display: flex;
      align-items: baseline;
      gap: 10px;
      margin-bottom: 4px;
      font-size: 11.5px;
    }
    .info-label {
      font-weight: 600;
      min-width: 68px;
      color: #71717a;
      font-size: 10.5px;
      flex-shrink: 0;
    }
    /* 단계 설명 */
    .step {
      margin: 3px 0 3px 14px;
      color: #3f3f46;
      font-size: 11.5px;
    }
    /* 전처리 주의 메시지 */
    .note-warn { color: #92400e; }
    /* 전처리 필수항목 */
    .note-req  { color: #166534; font-weight: 500; }
    /* {B}태그 스타일 */
    .bold-tag {
      display: block;
      font-weight: 600;
      color: #18181b;
      font-size: 11.5px;
      margin-top: 14px;
      margin-bottom: 4px;
    }
    /* 필수항목 뱃지 */
    .required {
      display: inline-block;
      background: #f4f4f5;
      color: #3f3f46;
      padding: 1px 7px;
      border-radius: 4px;
      margin: 2px 3px;
      font-size: 10.5px;
      border: 1px solid #e4e4e7;
    }
    /* 테이블 */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 8px 0;
      font-size: 11px;
    }
    th, td {
      border: 1px solid #e4e4e7;
      padding: 5px 10px;
      text-align: left;
      vertical-align: middle;
    }
    th {
      background: #f4f4f5;
      font-weight: 600;
      color: #52525b;
      font-size: 10.5px;
    }
    tr:nth-child(even) td { background: #fafafa; }
    /* URL 모노스페이스 */
    .popup-url {
      font-family: 'Consolas', 'Menlo', monospace;
      color: #52525b;
      font-size: 10.5px;
    }
    /* 그리드 섹션 소제목 */
    h3 {
      font-size: 12px;
      font-weight: 600;
      color: #18181b;
      margin-bottom: 6px;
    }
    /* 옵션 배지 */
    .badge {
      display: inline-block;
      background: #f4f4f5;
      color: #52525b;
      padding: 1px 6px;
      border-radius: 4px;
      margin: 1px 2px;
      font-size: 10px;
      border: 1px solid #e4e4e7;
    }
    code {
      font-family: 'Consolas', 'Menlo', monospace;
      font-size: 10.5px;
      color: #52525b;
    }
  </style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>

  ${result.screenImageDataUrl ? generateScreenImageHtml(result.screenImageDataUrl) : ''}
  ${generateOverviewHtml(result)}
  ${generateUsageHtml(result)}
  ${generateNotesHtml(result)}
  ${generateConditionGroupsHtml(result)}
  ${generateItemsHtml(result)}
  ${generateTabPagesHtml(result)}
  ${generatePopupsHtml(result)}

</body>
</html>`;
}

/** 화면 이미지 HTML 생성 */
function generateScreenImageHtml(dataUrl: string): string {
  return `
  <div style="margin-bottom:16px;text-align:center;">
    <img src="${dataUrl}" alt="화면 이미지" style="max-width:100%;border:1px solid #e4e4e7;border-radius:6px;" />
  </div>`;
}

/** 화면개요 HTML 생성 */
function generateOverviewHtml(result: AnalysisResult): string {
  const o = result.overview;
  return `
  <h2>화면개요</h2>
  <div class="section">
    <div class="info-row"><span class="info-label">시스템명</span><span>${escapeHtml(o.systemName)}</span></div>
    <div class="info-row"><span class="info-label">부시스템</span><span>${escapeHtml(o.subSystem)}</span></div>
    <div class="info-row"><span class="info-label">프로그램</span><span>${escapeHtml(o.programName)}</span></div>
    <div class="info-row"><span class="info-label">설명</span><span>${escapeHtml(o.description || '-')}</span></div>
  </div>`;
}

/** 기타 버튼 설명을 <p class="step"> 배열로 반환 (다단계 지원) */
function renderBtnStepLines(btn: ExtButtonInfo): string[] {
  const desc = btn.description
    ?? (btn.name === '닫기' || /close/i.test(btn.functionName)
      ? 'Step1. 현재 화면을 닫는다.'
      : `Step1. '${btn.name}' 버튼을 클릭한다.`);
  return desc.split('\n').map(line => `<p class="step">${escapeHtml(line)}</p>`);
}

/** 사용방법 HTML 생성 */
function generateUsageHtml(result: AnalysisResult): string {
  const lines: string[] = ['<h2>사용방법</h2>', '<div class="section">'];

  // AI 생성 텍스트가 있으면 파싱하여 렌더링
  if (result.aiUsageText) {
    for (const raw of result.aiUsageText.split('\n')) {
      const line = raw.trim();
      if (!line) continue;
      // {B}기능명{/B} 패턴
      if (/^\{B\}.+\{\/B\}$/.test(line)) {
        const inner = line.replace(/^\{B\}/, '').replace(/\{\/B\}$/, '');
        lines.push(`<span class="bold-tag">{B}${escapeHtml(inner)}{/B}</span>`);
      } else if (/^Step\d+\./i.test(line)) {
        lines.push(`<p class="step">${escapeHtml(line)}</p>`);
      } else if (/^[*•※⚠]|^주의|^\[주의/.test(line)) {
        lines.push(`<p class="step note-warn">${escapeHtml(line)}</p>`);
      } else if (/^📌|^필수/.test(line)) {
        lines.push(`<p class="step note-req">${escapeHtml(line)}</p>`);
      } else {
        // 번호 없는 일반 설명 줄
        lines.push(`<p class="step">${escapeHtml(line)}</p>`);
      }
    }
    // AI 텍스트에 언급되지 않은 extraButtons만 추가 (중복 방지)
    for (const btn of result.usage.extraButtons) {
      if (result.aiUsageText.includes(btn.name)) continue;
      lines.push(`<span class="bold-tag">{B}${escapeHtml(btn.name)}{/B}</span>`);
      lines.push(...renderBtnStepLines(btn));
    }
    // PatisTitleBar 기능 추가 (AI 텍스트에 이미 포함된 경우 중복 방지)
    for (const tb of result.usage.titleBars) {
      const tbLabel = tb.title || '상세 정보';
      // AI 텍스트에 이미 이 타이틀바 관련 내용이 있으면 건너뜀
      if (result.aiUsageText.includes(tbLabel)) continue;
      if (tb.hasNew) {
        lines.push(`<span class="bold-tag">{B}${escapeHtml(tbLabel)} 신규{/B}</span>`);
        lines.push('<p class="step">Step1. 그리드 타이틀바의 \'신규\' 버튼을 클릭한다.</p>');
        lines.push('<p class="step">Step2. 필수 항목을 입력한다.</p>');
      }
      if (tb.hasSave) {
        lines.push(`<span class="bold-tag">{B}${escapeHtml(tbLabel)} 저장{/B}</span>`);
        lines.push('<p class="step">Step1. 수정하고자 하는 자료를 입력한다.</p>');
        lines.push(`<p class="step">Step2. '${escapeHtml(tbLabel)}' 타이틀바의 '저장' 버튼을 클릭한다.</p>`);
      }
      if (tb.hasDelete) {
        lines.push(`<span class="bold-tag">{B}${escapeHtml(tbLabel)} 삭제{/B}</span>`);
        lines.push('<p class="step">Step1. 삭제하고자 하는 행을 선택한다.</p>');
        lines.push(`<p class="step">Step2. '${escapeHtml(tbLabel)}' 타이틀바의 '삭제' 버튼을 클릭한다.</p>`);
      }
      for (const btn of tb.extButtons) {
        lines.push(`<span class="bold-tag">{B}${escapeHtml(tbLabel)} - ${escapeHtml(btn.name)}{/B}</span>`);
        lines.push(...renderBtnStepLines(btn));
      }
    }
    lines.push('</div>');
    return lines.join('\n').replace(/\{B\}|\{\/B\}/g, '');
  }

  // AI 없을 때 정적 템플릿
  const menu = result.usage.menuTitleBar;
  const shortName = getProgramShortName(result);

  // 함수명 기준 전처리 검증 메시지 분류
  const inqVals  = result.notes.validations.filter(v => /inq|inquiry|search/i.test(v.functionName));
  const saveVals = result.notes.validations.filter(v => /save/i.test(v.functionName));
  const delVals  = result.notes.validations.filter(v => /del/i.test(v.functionName));

  if (menu.hasInquiry) {
    lines.push(`<span class="bold-tag">{B}${escapeHtml(shortName)} 조회{/B}</span>`);
    lines.push('<p class="step">Step1. 조회조건을 입력한다.</p>');
    lines.push('<p class="step">Step2. 화면 상단의 \'조회\' 버튼을 클릭한다.</p>');
    for (const v of inqVals) {
      lines.push(`<p class="step note-warn">⚠ ${escapeHtml(v.message)}</p>`);
    }
  }

  if (menu.hasNew) {
    lines.push(`<span class="bold-tag">{B}${escapeHtml(shortName)} 신규{/B}</span>`);
    lines.push('<p class="step">Step1. 화면 상단의 \'신규\' 버튼을 클릭한다.</p>');
    lines.push('<p class="step">Step2. 필수 항목을 입력한다.</p>');
  }

  if (menu.hasSave) {
    lines.push(`<span class="bold-tag">{B}${escapeHtml(shortName)} 저장{/B}</span>`);
    lines.push('<p class="step">Step1. 수정하고자 하는 자료를 입력 또는 선택한다.</p>');
    lines.push('<p class="step">Step2. 화면 상단의 \'저장\' 버튼을 클릭하여 저장처리를 진행한다.</p>');
    if (result.notes.requiredFields.length > 0) {
      const allReq = result.notes.requiredFields.flatMap(f => f.texts);
      const shownReq = allReq.slice(0, 4);
      const reqDisplay = shownReq.map(escapeHtml).join(', ') +
        (allReq.length > 4 ? ` 외 ${allReq.length - 4}개` : '');
      lines.push(`<p class="step note-req">📌 필수 입력항목: ${reqDisplay}</p>`);
    }
    for (const v of saveVals) {
      lines.push(`<p class="step note-warn">⚠ ${escapeHtml(v.message)}</p>`);
    }
  }

  if (menu.hasDelete) {
    lines.push(`<span class="bold-tag">{B}${escapeHtml(shortName)} 삭제{/B}</span>`);
    lines.push('<p class="step">Step1. 삭제하고자 하는 자료를 선택한다.</p>');
    lines.push('<p class="step">Step2. 화면 상단의 \'삭제\' 버튼을 클릭하여 삭제처리를 진행한다.</p>');
    for (const v of delVals) {
      lines.push(`<p class="step note-warn">⚠ ${escapeHtml(v.message)}</p>`);
    }
  }

  // 추가 버튼
  for (const btn of menu.extButtons) {
    lines.push(`<span class="bold-tag">{B}${escapeHtml(btn.name)}{/B}</span>`);
    lines.push(...renderBtnStepLines(btn));
  }

  // PatisTitleBar 기능
  for (const tb of result.usage.titleBars) {
    const tbLabel = tb.title || '상세 정보';
    if (tb.hasNew) {
      lines.push(`<span class="bold-tag">{B}${escapeHtml(tbLabel)} - 신규{/B}</span>`);
      lines.push('<p class="step">Step1. 그리드 타이틀바의 \'\uc2e0규\' 버튼을 클릭한다.</p>');
      lines.push('<p class="step">Step2. 필수 항목을 입력한다.</p>');
    }
    if (tb.hasSave) {
      lines.push(`<span class="bold-tag">{B}${escapeHtml(tbLabel)} - 저장{/B}</span>`);
      lines.push('<p class="step">Step1. 수정하고자 하는 자료를 입력한다.</p>');
      lines.push(`<p class="step">Step2. '${escapeHtml(tbLabel)}' 타이틀바의 '저장' 버튼을 클릭한다.</p>`);
    }
    if (tb.hasDelete) {
      lines.push(`<span class="bold-tag">{B}${escapeHtml(tbLabel)} - 삭제{/B}</span>`);
      lines.push('<p class="step">Step1. 삭제하고자 하는 행을 선택한다.</p>');
      lines.push(`<p class="step">Step2. '${escapeHtml(tbLabel)}' 타이틀바의 '삭제' 버튼을 클릭한다.</p>`);
    }
    // PatisTitleBar 추가 버튼
    for (const btn of tb.extButtons) {
      lines.push(`<span class="bold-tag">{B}${escapeHtml(tbLabel)} - ${escapeHtml(btn.name)}{/B}</span>`);
      lines.push(...renderBtnStepLines(btn));
    }
  }

  // 기타 버튼 (PatisMenuTitleBar/PatisTitleBar 외 일반 Button 컨트롤)
  for (const btn of result.usage.extraButtons) {
    lines.push(`<span class="bold-tag">{B}${escapeHtml(btn.name)}{/B}</span>`);
    lines.push(...renderBtnStepLines(btn));
  }

  lines.push('</div>');
  return lines.join('\n').replace(/\{B\}|\{\/B\}/g, '');
}

/** 참고사항 HTML 생성 (조회/저장/삭제로 분류되지 않은 기타 검증 메시지만 표시) */
function generateNotesHtml(result: AnalysisResult): string {
  const requiredFields = result.notes.requiredFields;
  // 조회/저장/삭제는 사용방법 섹션에 이미 표시 → 참고사항에는 제외
  // 단순 완료/성공 알림 메시지도 주의사항이 아니므로 제외
  const COMPLETION_RE = /^(?:처리|저장|삭제|등록|수정|복사|생성|변경|갱신|적용|실행)[^\n]*?(?:되었습니다|했습니다|하였습니다)[.!]?\s*$/;
  const otherVals = result.notes.validations
    .filter(v => !/inq|inquiry|search|save|del/i.test(v.functionName))
    .filter(v => !COMPLETION_RE.test(v.message.trim()));

  const hasContent = requiredFields.length > 0 || otherVals.length > 0;
  if (!hasContent) return '';

  const lines: string[] = ['<h2>참고사항</h2>', '<div class="section">'];

  // 1. 필수 입력항목
  if (requiredFields.length > 0) {
    lines.push('<span class="bold-tag">📌 필수 입력항목</span>');
    const allTexts = requiredFields.flatMap(r => r.texts);
    lines.push(`<p class="step note-req">${allTexts.map(escapeHtml).join(', ')}</p>`);
  }

  // 2. 기능별 주의사항 (엘스트라버튼 함수명 기반 그룹화)
  if (otherVals.length > 0) {
    // 함수명 → 버튼명 맵 구성
    const funcLabelMap = new Map<string, string>();
    for (const btn of result.usage.extraButtons) {
      funcLabelMap.set(btn.functionName, btn.name);
    }
    for (const tb of result.usage.titleBars) {
      const tbLabel = tb.title || '상세 정보';
      for (const btn of tb.extButtons) {
        funcLabelMap.set(btn.functionName, `${tbLabel} - ${btn.name}`);
      }
    }

    // 그룹화: label → messages[]
    // 버튼명 있으면 '버튼명 실행 전 확인사항', 없으면 '기타 주의사항'
    const groups = new Map<string, string[]>();
    for (const v of otherVals) {
      const btnLabel = funcLabelMap.get(v.functionName);
      const label = btnLabel ? `${btnLabel} 실행 전 확인사항` : '기타 주의사항';
      if (!groups.has(label)) groups.set(label, []);
      groups.get(label)!.push(v.message);
    }

    for (const [label, messages] of groups) {
      // AI 친화적 설명이 있으면 사용, 없으면 원본 메시지 표시
      const aiDescs = result.aiNotesDescriptions?.get(label);
      lines.push(`<span class="bold-tag">⚠ ${escapeHtml(label)}</span>`);
      messages.forEach((msg, i) => {
        const display = aiDescs?.[i] || msg;
        lines.push(`<p class="step note-warn">• ${escapeHtml(display)}</p>`);
      });
    }
  }

  lines.push('</div>');
  return lines.join('\n');
}

/** 조회조건/처리조건 HTML 생성 */
function generateConditionGroupsHtml(result: AnalysisResult): string {
  const groups = result.items.conditionGroups;
  if (groups.length === 0) return '';

  const lines: string[] = ['<h2>항목</h2>'];

  for (const group of groups) {
    lines.push('<div class="section">');
    const heading = group.title ?? escapeHtml(group.groupType);
    lines.push(`<h3>${heading} <span style="font-size:11px;color:#888;font-weight:normal;">(${escapeHtml(group.groupId)})</span></h3>`);

    if (group.controls.length > 0) {
      lines.push('<table><thead><tr>');
      lines.push('<th style="width:18%">항목명</th><th>설명</th><th style="width:15%">타입</th><th style="width:18%">용도</th>');
      lines.push('</tr></thead><tbody>');

      for (const ctrl of group.controls) {
        lines.push(`<tr>
          <td>${escapeHtml(ctrl.labelText || ctrl.controlId)}</td>
          <td>${escapeHtml(ctrl.description)}</td>
          <td><code>${escapeHtml(ctrl.controlType)}</code></td>
          <td>${escapeHtml(ctrl.inputType === '입력' ? '입력 또는 선택' : ctrl.inputType)}</td>
        </tr>`);
      }

      lines.push('</tbody></table>');
    }

    lines.push('</div>');
  }

  return lines.join('\n');
}

/** 항목 HTML 생성 */
function generateItemsHtml(result: AnalysisResult): string {
  if (result.items.grids.length === 0) return '';

  // 조건 그룹이 없을 때만 h2 헤더 출력 (있으면 generateConditionGroupsHtml가 이미 출력)
  const hasCondGroups = result.items.conditionGroups.length > 0;
  const lines: string[] = hasCondGroups ? [] : ['<h2>항목</h2>'];

  for (const grid of result.items.grids) {
    const gridTitle = escapeHtml(grid.title || grid.gridId);
    const gridIdStr = escapeHtml(grid.gridId);

    lines.push(`<div class="section">`);
    lines.push(`<h3>${gridTitle} <span style="font-size:11px;color:#888;font-weight:normal;">(${gridIdStr})</span></h3>`);

    // 그리드 옵션 배지
    const badges: string[] = [];
    if (grid.hasState) badges.push('상태');
    if (grid.hasCheckbox) badges.push('체크');
    if (grid.hasRowNumber) badges.push('행번호');
    if (grid.sortable) badges.push('정렬');
    if (badges.length > 0) {
      lines.push(`<p style="margin:4px 0 8px;">${badges.map(b => `<span class="badge">${b}</span>`).join(' ')}</p>`);
    }

    if (grid.columns.length > 0) {
      lines.push('<table><thead><tr>');
      lines.push('<th style="width:18%">항목명</th><th>설명</th><th style="width:15%">타입</th><th style="width:14%">용도</th>');
      lines.push('</tr></thead><tbody>');

      for (const col of grid.columns) {
        lines.push(`<tr>
          <td>${escapeHtml(col.headerText)}</td>
          <td>${escapeHtml(col.description)}</td>
          <td><code>${escapeHtml(col.controlType)}</code></td>
          <td>${escapeHtml(col.purpose)}</td>
        </tr>`);
      }

      lines.push('</tbody></table>');
    } else {
      lines.push('<p style="color:#888;">컬럼 정보 없음</p>');
    }

    lines.push('</div>');
  }

  return lines.join('\n');
}

/** 탭페이지 HTML 생성 */
function generateTabPagesHtml(result: AnalysisResult): string {
  if (result.tabPages.length === 0) return '';

  const lines: string[] = ['<h2>탭페이지</h2>', '<div class="section"><ul>'];
  for (const tp of result.tabPages) {
    const display = tp.tabLabel ? `${tp.appUri} (${tp.tabLabel})` : tp.appUri;
    lines.push(`<li><span class="popup-url tabpage-link" data-tabpage-uri="${escapeHtml(tp.appUri)}" style="cursor:pointer;">${escapeHtml(display)}</span></li>`);
  }
  lines.push('</ul></div>');
  return lines.join('\n');
}

/** 팝업 HTML 생성 */
function generatePopupsHtml(result: AnalysisResult): string {
  if (result.popups.length === 0) return '';

  const lines: string[] = ['<h2>팝업</h2>', '<div class="section">'];
  lines.push('<table><thead><tr><th>팝업 ID</th><th>URL</th><th>크기</th></tr></thead><tbody>');

  for (const popup of result.popups) {
    lines.push(`<tr>
      <td>${escapeHtml(popup.popupId)}</td>
      <td class="popup-url">${escapeHtml(popup.popupUrl)}</td>
      <td>${popup.width} × ${popup.height}</td>
    </tr>`);
  }

  lines.push('</tbody></table></div>');
  return lines.join('\n');
}

/** HTML 특수문자 이스케이프 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** 프로그램 간략명 추출 */
function getProgramShortName(result: AnalysisResult): string {
  const program = result.overview.programName;
  if (program.includes('>')) {
    return program.split('>').pop()?.trim() || program;
  }
  return program || '화면';
}
