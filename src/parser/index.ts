/**
 * 메인 파서 모듈
 * - 각 하위 파서를 통합하여 .clx.js 파일의 전체 분석 결과를 반환
 */
import { AnalysisResult, GridInfo } from '@/types';
import { parseHeader } from './headerParser';
import { parseMenuTitleBarCrud, parseTitleBarCrud, parseExtraButtons } from './crudParser';
import { parseRequiredFields, parseValidations } from './validationParser';
import { parseGrids } from './gridParser';
import { parseConditionGroups } from './conditionGroupParser';
import { parsePopups } from './popupParser';
import { parseEmbApps } from './embAppParser';

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
  return files.map((file) => analyzeFile(file.path, file.content));
}
