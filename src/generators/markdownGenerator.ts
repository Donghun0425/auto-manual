/**
 * Markdown 매뉴얼 생성기
 * - 분석 결과를 기반으로 MANUAL_PURPOSE.md 레이아웃에 맞는 Markdown 생성
 */
import { AnalysisResult, ExtButtonInfo } from '@/types';

/**
 * 분석 결과를 Markdown 형식의 매뉴얼로 변환
 * @param result - 파일 분석 결과
 * @returns Markdown 문자열
 */
/** 기타 버튼 설명을 Step 문자열 배열로 반환 (다단계 지원) */
function getMdBtnStepLines(btn: ExtButtonInfo): string[] {
  const desc = btn.description
    ?? (btn.name === '닫기' || /close/i.test(btn.functionName)
      ? 'Step1. 현재 화면을 닫는다.'
      : `Step1. '${btn.name}' 버튼을 클릭한다.`);
  return desc.split('\n');
}

export function generateMarkdown(result: AnalysisResult): string {
  const lines: string[] = [];

  // 제목
  lines.push(`# ${result.overview.programName || result.filePath}`);
  lines.push('');

  // 화면 이미지
  if (result.screenImageDataUrl) {
    lines.push(`![화면 이미지](${result.screenImageDataUrl})`);
    lines.push('');
  }

  // 화면개요
  lines.push('## 화면개요');
  lines.push('');
  if (result.overview.description) {
    lines.push(result.overview.description);
  } else {
    lines.push(`${result.overview.systemName} > ${result.overview.subSystem} > ${result.overview.programName} 화면입니다.`);
  }
  lines.push('');

  // 사용방법
  lines.push('## 사용방법');
  lines.push('');

  // AI 생성 텍스트가 있으면 그대로 사용
  if (result.aiUsageText) {
    lines.push(result.aiUsageText);
    lines.push('');
    // AI 텍스트에 언급되지 않은 extraButtons만 추가 (중복 방지)
    for (const btn of result.usage.extraButtons) {
      if (result.aiUsageText.includes(btn.name)) continue;
      lines.push(`{B}${btn.name}{/B}`);
      lines.push(...getMdBtnStepLines(btn));
      lines.push('');
    }
    // PatisTitleBar 기능 추가 (AI 텍스트에 이미 포함된 경우 중복 방지)
    for (const tb of result.usage.titleBars) {
      const tbLabel = tb.title || '상세 정보';
      // AI 텍스트에 이미 이 타이틀바 관련 내용이 있으면 건너뜀
      if (result.aiUsageText.includes(tbLabel)) continue;
      if (tb.hasNew) {
        lines.push(`{B}${tbLabel} 신규{/B}`);
        lines.push('Step1. 그리드 타이틀바의 \'신규\' 버튼을 클릭한다.');
        lines.push('Step2. 필수 항목을 입력한다.');
        lines.push('');
      }
      if (tb.hasSave) {
        lines.push(`{B}${tbLabel} 저장{/B}`);
        lines.push('Step1. 수정하고자 하는 자료를 입력한다.');
        lines.push(`Step2. '${tbLabel}' 타이틀바의 '저장' 버튼을 클릭한다.`);
        lines.push('');
      }
      if (tb.hasDelete) {
        lines.push(`{B}${tbLabel} 삭제{/B}`);
        lines.push('Step1. 삭제하고자 하는 행을 선택한다.');
        lines.push(`Step2. '${tbLabel}' 타이틀바의 '삭제' 버튼을 클릭한다.`);
        lines.push('');
      }
      for (const btn of tb.extButtons) {
        lines.push(`{B}${tbLabel} - ${btn.name}{/B}`);
        lines.push(...getMdBtnStepLines(btn));
        lines.push('');
      }
    }
  } else {
  // PatisMenuTitleBar 기능
  const menu = result.usage.menuTitleBar;

  // 함수명 기준 전처리 검증 메시지 분류
  const inqVals  = result.notes.validations.filter(v => /inq|inquiry|search/i.test(v.functionName));
  const saveVals = result.notes.validations.filter(v => /save/i.test(v.functionName));
  const delVals  = result.notes.validations.filter(v => /del/i.test(v.functionName));

  if (menu.hasInquiry) {
    lines.push(`{B}${getProgramShortName(result)} 조회{/B}`);
    lines.push('Step1. 조회조건을 입력한다.');
    lines.push('Step2. 화면 상단의 \'조회\' 버튼을 클릭한다.');
    for (const v of inqVals) { lines.push(`  ※ ${v.message}`); }
    lines.push('');
  }

  if (menu.hasNew) {
    lines.push(`{B}${getProgramShortName(result)} 신규{/B}`);
    lines.push('Step1. 화면 상단의 \'신규\' 버튼을 클릭한다.');
    lines.push('Step2. 필수 항목을 입력한다.');
    lines.push('');
  }

  if (menu.hasSave) {
    lines.push(`{B}${getProgramShortName(result)} 저장{/B}`);
    lines.push('Step1. 수정하고자 하는 자료를 입력 또는 선택한다.');
    lines.push('Step2. 화면 상단의 \'저장\' 버튼을 클릭하여 저장처리를 진행한다.');
    if (result.notes.requiredFields.length > 0) {
      const allReq = result.notes.requiredFields.flatMap(f => f.texts);
      const shownReq = allReq.slice(0, 4);
      const reqDisplay = shownReq.join(', ') + (allReq.length > 4 ? ` 외 ${allReq.length - 4}개` : '');
      lines.push(`  📌 필수 입력항목: ${reqDisplay}`);
    }
    for (const v of saveVals) { lines.push(`  ※ ${v.message}`); }
    lines.push('');
  }

  if (menu.hasDelete) {
    lines.push(`{B}${getProgramShortName(result)} 삭제{/B}`);
    lines.push('Step1. 삭제하고자 하는 자료를 선택한다.');
    lines.push('Step2. 화면 상단의 \'삭제\' 버튼을 클릭하여 삭제처리를 진행한다.');
    for (const v of delVals) { lines.push(`  ※ ${v.message}`); }
    lines.push('');
  }

  // 추가 버튼
  for (const btn of menu.extButtons) {
    lines.push(`{B}${btn.name}{/B}`);
    lines.push(...getMdBtnStepLines(btn));
    lines.push('');
  }

  // PatisTitleBar 기능
  for (const tb of result.usage.titleBars) {
    const tbLabel = tb.title || '상세 정보';
    if (tb.hasNew) {
      lines.push(`{B}${tbLabel} - 신규{/B}`);
      lines.push('Step1. 그리드 타이틀바의 \'\uc2e0규\' 버튼을 클릭한다.');
      lines.push('Step2. 필수 항목을 입력한다.');
      lines.push('');
    }
    if (tb.hasSave) {
      lines.push(`{B}${tbLabel} - 저장{/B}`);
      lines.push('Step1. 수정하고자 하는 자료를 입력한다.');
      lines.push(`Step2. '${tbLabel}' 타이틀바의 '저장' 버튼을 클릭한다.`);
      lines.push('');
    }
    if (tb.hasDelete) {
      lines.push(`{B}${tbLabel} - 삭제{/B}`);
      lines.push('Step1. 삭제하고자 하는 행을 선택한다.');
      lines.push(`Step2. '${tbLabel}' 타이틀바의 '삭제' 버튼을 클릭한다.`);
      lines.push('');
    }
    // PatisTitleBar 추가 버튼
    for (const btn of tb.extButtons) {
      lines.push(`{B}${tbLabel} - ${btn.name}{/B}`);
      lines.push(...getMdBtnStepLines(btn));
      lines.push('');
    }
  }

  // 기타 버튼 (PatisMenuTitleBar/PatisTitleBar 외 일반 Button 컨트롤)
  for (const btn of result.usage.extraButtons) {
    lines.push(`{B}${btn.name}{/B}`);
    lines.push(...getMdBtnStepLines(btn));
    lines.push('');
  }
  } // end else (no AI usage text)

  // 주의사항 수집 (조회/저장/삭제는 사용방법에 이미 포함 → 제외)
  // 단순 완료/성공 알림 메시지도 주의사항이 아니므로 제외
  const COMPLETION_RE = /^(?:처리|저장|삭제|등록|수정|복사|생성|변경|갱신|적용|실행)[^\n]*?(?:되었습니다|했습니다|하였습니다)[.!]?\s*$/;
  const otherVals = result.notes.validations
    .filter(v => !/inq|inquiry|search|save|del/i.test(v.functionName))
    .filter(v => !COMPLETION_RE.test(v.message.trim()));
  const requiredFields = result.notes.requiredFields;

  if (requiredFields.length > 0 || otherVals.length > 0) {
    lines.push('## 참고사항');
    lines.push('');

    // 1. 필수 입력항목
    if (requiredFields.length > 0) {
      const allTexts = requiredFields.flatMap(r => r.texts);
      lines.push('{B}📌 필수 입력항목{/B}');
      lines.push(allTexts.join(', '));
      lines.push('');
    }

    // 2. 기능별 주의사항
    if (otherVals.length > 0) {
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
        lines.push(`{B}⚠ ${label}{/B}`);
        messages.forEach((msg, i) => {
          const display = aiDescs?.[i] || msg;
          lines.push(`- ${display}`);
        });
        lines.push('');
      }
    }
  }

  // 항목 (조회조건/처리조건 + 그리드)
  const hasCondGroups = result.items.conditionGroups.length > 0;
  const hasGrids = result.items.grids.length > 0;

  if (hasCondGroups || hasGrids) {
    lines.push('## 항목');
    lines.push('');

    // 조회조건/처리조건
    for (const group of result.items.conditionGroups) {
      const heading = group.title ?? group.groupType;
      lines.push(`### ${heading} (${group.groupId})`);
      lines.push('');
      lines.push('| 항목명 | 설명 | 타입 | 용도 |');
      lines.push('|-------|------|------|-------------------|');
      for (const ctrl of group.controls) {
        const label = ctrl.labelText || ctrl.controlId;
        lines.push(`| ${label} | ${ctrl.description || ''} | ${ctrl.controlType} | ${ctrl.inputType === '입력' ? '입력 또는 선택' : ctrl.inputType} |`);
      }
      lines.push('');
    }

    // 그리드
    for (const grid of result.items.grids) {
      lines.push(`### ${grid.title || grid.gridId}`);
      lines.push('');
      if (grid.columns.length > 0) {
        lines.push('| 항목명 | 설명 | 타입 | 용도 |');
        lines.push('|-------|------|------|------|');
        for (const col of grid.columns) {
          lines.push(`| ${col.headerText} | ${col.description || ''} | ${col.controlType} | ${col.purpose} |`);
        }
      }
      lines.push('');
    }
  }

  // 탭페이지
  if (result.tabPages.length > 0) {
    lines.push('## 탭페이지');
    lines.push('');
    for (const tp of result.tabPages) {
      lines.push(`- ${tp.tabLabel ? `${tp.appUri} (${tp.tabLabel})` : tp.appUri}`);
    }
    lines.push('');
  }

  // 팝업
  if (result.popups.length > 0) {
    lines.push('## 팝업');
    lines.push('');
    for (const popup of result.popups) {
      lines.push(`- **${popup.popupId}**: ${popup.popupUrl} (${popup.width}×${popup.height})`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * 프로그램명에서 간략한 이름 추출
 * (예: "졸업기초 > 졸업기준관리" → "졸업기준관리")
 */
function getProgramShortName(result: AnalysisResult): string {
  const program = result.overview.programName;
  if (program.includes('>')) {
    return program.split('>').pop()?.trim() || program;
  }
  return program || '화면';
}
