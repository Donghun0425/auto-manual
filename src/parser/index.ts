/**
 * 메인 파서 모듈
 * - 각 하위 파서를 통합하여 .clx.js 파일의 전체 분석 결과를 반환
 */
import { AnalysisResult, ExtButtonInfo, GridInfo } from '@/types';
import { parseHeader } from './headerParser';
import { parseMenuTitleBarCrud, parseTitleBarCrud, parseExtraButtons, extractPopupUrl } from './crudParser';
import { parseRequiredFields, parseValidations } from './validationParser';
import { parseGrids } from './gridParser';
import { parseConditionGroups } from './conditionGroupParser';
import { parsePopups } from './popupParser';
import { parseEmbApps } from './embAppParser';
import { parseInfoGroups } from './infoGroupParser';

/**
 * UcoBtchList 컨트롤의 타이틀을 추출한다.
 * 우선순위: 선언부 varName.titleText → initBtchList 2번째 인수 → setTitleText
 */
function extractUcoBtchListTitle(content: string, controlId: string): string {
  // 패턴 1: 레이아웃 선언부 — varName.titleText = "..."
  const declRe = new RegExp(
    `var\\s+(\\w+)\\s*=\\s*(?:linker\\.\\w+\\s*=\\s*)?new\\s+udc\\.univ\\.UcoBtchList\\("${controlId}"\\)`,
  );
  const declMatch = declRe.exec(content);
  if (declMatch) {
    const varName = declMatch[1];
    const after = content.slice(declMatch.index, declMatch.index + 400);
    const m = new RegExp(`${varName}\\.titleText\\s*=\\s*"([^"]+)"`).exec(after);
    if (m) return m[1];
  }

  // 패턴 2: initBtchList(btchScrnSe, "titleText")
  const initRe = new RegExp(
    `app\\.lookup\\("${controlId}"\\)\\.initBtchList\\s*\\([^,]+,\\s*"([^"]+)"`,
  );
  const initMatch = initRe.exec(content);
  if (initMatch) return initMatch[1];

  // 패턴 3: setTitleText("titleText")
  const setRe = new RegExp(
    `app\\.lookup\\("${controlId}"\\)\\.setTitleText\\s*\\(\\s*"([^"]+)"`,
  );
  const setMatch = setRe.exec(content);
  if (setMatch) return setMatch[1];

  return '배치 리스트';
}

/**
 * UcoBtchList 내장 그리드 고정 컬럼 정의
 * - udc.js 분석 결과: DG_GRID01 / 4개 컬럼
 */
const UCO_BTCH_LIST_GRID_COLUMNS: GridInfo['columns'] = [
  { columnName: 'BTCH_SCRN_SE_NM', headerText: '배치업무',  description: '어떤 배치 업무인지 나타내는 화면 구분명입니다.',  controlType: 'Output', purpose: '표시' },
  { columnName: 'PRCS_TS',         headerText: '처리일자',  description: '배치가 실행된 날짜와 시간입니다.',               controlType: 'Output', purpose: '표시' },
  { columnName: 'PRCR_ID',         headerText: '처리자',    description: '배치를 실행한 담당자의 사용자 ID입니다.',         controlType: 'Output', purpose: '표시' },
  { columnName: 'RMRK',            headerText: '비고',      description: '배치 처리 후 남긴 결과 메시지입니다.',            controlType: 'Output', purpose: '표시' },
];

/**
 * .clx.js 파일 내용을 분석하여 매뉴얼 생성에 필요한 정보를 추출
 * @param filePath - 파일 경로
 * @param content - .clx.js 파일 내용
 * @returns 분석 결과 객체
 */
export function analyzeFile(filePath: string, content: string): AnalysisResult {
  const conditionGroups = parseConditionGroups(content);
  const grids = parseGrids(content);

  // UcoBtchList 가 포함된 BATCH_GROUP → 내장 고정 그리드를 grids 목록에 추가
  const ucoBtchRe = /new\s+udc\.univ\.UcoBtchList\("([^"]+)"\)/g;
  let bm: RegExpExecArray | null;
  while ((bm = ucoBtchRe.exec(content)) !== null) {
    const controlId = bm[1];

    // 이미 grids에 포함되어 있으면 중복 추가 방지
    if (grids.some(g => g.gridId === controlId)) continue;

    // 타이틀: 선언부 titleText → initBtchList 2번째 인수 → setTitleText → 폴백
    const gridTitle = extractUcoBtchListTitle(content, controlId);

    grids.push({
      gridId: controlId,
      title: gridTitle,
      isBound: false,
      hasCheckbox: false,
      hasRowNumber: false,
      hasState: false,
      sortable: true,
      columns: UCO_BTCH_LIST_GRID_COLUMNS,
      skipAiDescriptions: true,
    });
  }

  return {
    filePath,
    // 화면 개요 (상단 주석 블록)
    overview: parseHeader(content),
    // 사용 방법 (CRUD 패턴 분석)
    usage: {
      menuTitleBar: parseMenuTitleBarCrud(content),
      titleBars: parseTitleBarCrud(content),
      extraButtons: parseExtraButtons(content),
    },
    // 참고사항 (필수값, 검증 로직)
    notes: {
      requiredFields: parseRequiredFields(content),
      validations: parseValidations(content),
    },
    // 항목 (그리드 정보)
    items: {
      conditionGroups,
      infoGroups: parseInfoGroups(content),
      grids,
    },
    // 탭페이지 (임베디드 앱)
    tabPages: parseEmbApps(content),
    // 팝업
    popups: parsePopups(content),
  };
}

/**
 * 여러 파일을 일괄 분석
 * @param files - 파일 경로와 내용 쌍의 배열
 * @returns 분석 결과 배열
 */
export function analyzeFiles(files: { path: string; content: string }[]): AnalysisResult[] {
  const results = files.map((file) => analyzeFile(file.path, file.content));

  // 팝업 URL cross-reference: extButton에 popupUrl이 있고 파일 목록에 해당 파일이 있으면
  // 해당 파일의 분석 결과를 기반으로 description 생성
  resolvePopupDescriptions(results, files);

  return results;
}

/**
 * ext 버튼의 popupUrl을 분석 결과 목록과 매칭하여 description 생성
 * - 파일 목록에 해당 팝업 파일이 있으면: 팝업 파일의 AnalysisResult 기반 상세 설명
 * - 파일 목록에 없으면: 기본 '팝업 화면을 연다' 설명
 */
function resolvePopupDescriptions(
  results: AnalysisResult[],
  files: { path: string; content: string }[],
): void {
  const normalizeUrl = (u: string) => u.replace(/\\/g, '/').replace(/\.clx\.js$/i, '');

  // results를 정규화된 경로 → AnalysisResult 맵으로 구성
  const resultMap = new Map<string, AnalysisResult>();
  for (const r of results) {
    resultMap.set(normalizeUrl(r.filePath), r);
  }

  const findPopupResult = (popupUrl: string): AnalysisResult | undefined => {
    const normalizedPopup = normalizeUrl(popupUrl);
    // 정확 매칭 우선
    const exact = resultMap.get(normalizedPopup);
    if (exact) return exact;
    // suffix 매칭 (양방향):
    // - 폴더 업로드: key("csm01/p02").endsWith(normalizedPopup) 는 false지만 역방향이 true
    // - 개별 파일 선택: key("csm_1020101_p02") < normalizedPopup → 역방향으로 매칭
    for (const [key, val] of resultMap) {
      if (
        key.endsWith('/' + normalizedPopup) || key.endsWith(normalizedPopup) ||
        normalizedPopup.endsWith('/' + key) || normalizedPopup.endsWith(key)
      ) return val;
    }
    return undefined;
  };

  const enhance = (btn: ExtButtonInfo): void => {
    if (!btn.popupUrl) return;
    const popupResult = findPopupResult(btn.popupUrl);
    if (!popupResult) {
      // 파일 목록에 없으면 기본 설명
      if (!btn.description) {
        btn.description = `Step1. '${btn.name}' 버튼을 클릭하여 팝업 화면을 연다.`;
      }
      return;
    }
    btn.description = generatePopupDescriptionFromResult(btn.name, popupResult);
  };

  for (const result of results) {
    for (const btn of result.usage.menuTitleBar.extButtons) enhance(btn);
    for (const tb of result.usage.titleBars) {
      for (const btn of tb.extButtons) enhance(btn);
    }
    for (const btn of result.usage.extraButtons) enhance(btn);
  }
}

/**
 * 팝업 파일의 AnalysisResult를 기반으로 Step별 설명 생성
 * - overview.programName(팝업 프로그램명), usage.titleBars, items 등을 활용
 */
function generatePopupDescriptionFromResult(btnName: string, popupResult: AnalysisResult): string {
  const steps: string[] = [];
  steps.push(`Step1. '${btnName}' 버튼을 클릭하여 팝업 화면을 연다.`);

  const menu = popupResult.usage.menuTitleBar;
  const titleBars = popupResult.usage.titleBars;

  // CRUD 여부 판단
  const menuHasCrud = menu.hasInquiry || menu.hasNew || menu.hasSave || menu.hasDelete;
  const titleBarsWithCrud = titleBars.filter(
    (tb) => tb.hasInquiry || tb.hasNew || tb.hasSave || tb.hasDelete,
  );
  const hasAnyCrud = menuHasCrud || titleBarsWithCrud.length > 0;

  let stepNum = 2;

  if (!hasAnyCrud) {
    // CRUD 없는 단순 입력/확인 팝업 (ex: 스냅샷)
    const hasInputGroups =
      popupResult.items.conditionGroups.length > 0 ||
      popupResult.items.infoGroups.length > 0;
    if (hasInputGroups) {
      steps.push(`Step${stepNum++}. 팝업 화면에서 필요한 정보를 입력한다.`);
      steps.push(`Step${stepNum}. 확인 버튼을 클릭하여 팝업을 닫는다.`);
    } else {
      steps.push(`Step${stepNum++}. 팝업 화면에서 필요한 작업을 수행한다.`);
      steps.push(`Step${stepNum}. 작업 완료 후 팝업을 닫는다.`);
    }
    return steps.join('\n');
  }

  // PatisMenuTitleBar CRUD (패턴이 있는 경우)
  if (menuHasCrud) {
    if (menu.hasInquiry) {
      steps.push(`Step${stepNum++}. 조회 조건을 입력하고 '조회' 버튼을 클릭한다.`);
    }
    if (menu.hasNew) {
      steps.push(`Step${stepNum++}. '신규' 버튼을 클릭하여 필요한 정보를 입력한다.`);
    }
    if (menu.hasSave) {
      steps.push(`Step${stepNum++}. 필요한 정보를 입력 후 '저장' 버튼을 클릭한다.`);
    }
    if (menu.hasDelete) {
      steps.push(`Step${stepNum++}. 삭제할 항목을 선택 후 '삭제' 버튼을 클릭한다.`);
    }
  }

  // PatisTitleBar별 CRUD 설명
  for (const tb of titleBarsWithCrud) {
    const tbLabel = tb.title ? `'${tb.title}'` : '그리드 타이틀바';
    const ops: string[] = [];
    if (tb.hasInquiry) ops.push('조회');
    if (tb.hasNew) ops.push('신규');
    if (tb.hasSave) ops.push('저장');
    if (tb.hasDelete) ops.push('삭제');
    steps.push(`Step${stepNum++}. ${tbLabel} 목록에서 ${ops.join('·')} 작업을 수행한다.`);
  }

  steps.push(`Step${stepNum}. 작업 완료 후 팝업을 닫는다.`);

  return steps.join('\n');
}
