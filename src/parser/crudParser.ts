/**
 * CRUD 함수 패턴 파서
 * - PatisMenuTitleBar (Form_inq~, Form_new~, Form_save~, Form_del~, Form_ext~)
 * - PatisTitleBar (TitleForm_inq~, TitleForm_new~, TitleForm_save~, TitleForm_del~, TitleForm_ext~)
 */
import { CrudInfo, ExtButtonInfo } from '@/types';

/**
 * PatisMenuTitleBar의 CRUD 기능 존재 여부 분석
 * @param content - .clx.js 파일 내용
 * @returns PatisMenuTitleBar CRUD 정보
 */
export function parseMenuTitleBarCrud(content: string): CrudInfo {
  const result: CrudInfo = {
    hasInquiry: false,
    hasNew: false,
    hasSave: false,
    hasDelete: false,
    extButtons: [],
  };

  // 조회 함수 감지 (Form_inqAction 또는 Form_inqClick)
  result.hasInquiry = /function\s+Form_inq(Action|Click)\s*\(/.test(content);

  // 신규 함수 감지
  result.hasNew = /function\s+Form_new(Action|Click)\s*\(/.test(content);

  // 저장 함수 감지
  result.hasSave = /function\s+Form_save(Action|Click)\s*\(/.test(content);

  // 삭제 함수 감지
  result.hasDelete = /function\s+Form_del(Action|Click)\s*\(/.test(content);

  // 추가 버튼 감지 (Form_ext1Click, Form_ext2Click, ...)
  const extMatches = content.matchAll(/function\s+Form_ext(\d+)Click\s*\(/g);
  for (const match of extMatches) {
    const btnIndex = parseInt(match[1]);
    const btnName = extractExtButtonName(content, `Form_ext${btnIndex}Click`);
    result.extButtons.push({
      name: btnName || `추가버튼${btnIndex}`,
      functionName: `Form_ext${btnIndex}Click`,
      index: btnIndex,
    });
  }

  return result;
}

/**
 * PatisTitleBar의 CRUD 기능 존재 여부 분석
 * @param content - .clx.js 파일 내용
 * @returns PatisTitleBar CRUD 정보 배열
 */
export function parseTitleBarCrud(content: string): CrudInfo[] {
  // PatisTitleBar는 보통 하나이지만, 복수 가능성을 고려
  const hasTitleBarCrud =
    /function\s+TitleForm_(inq|new|save|del)(Action|Click)\s*\(/.test(content);

  if (!hasTitleBarCrud) return [];

  // PatisTitleBar 타이틀 추출
  // 저장/삭제 버튼이 활성화된 타이틀바 우선 사용, 없으면 첫 번째 타이틀 폴백
  let titleBarTitle: string | undefined;
  let firstFoundTitle: string | undefined;
  const tbRe = /new udc\.common\.PatisTitleBar\([^)]+\)/g;
  let tbMatch: RegExpExecArray | null;
  while ((tbMatch = tbRe.exec(content)) !== null) {
    const after = content.slice(tbMatch.index, tbMatch.index + 800);
    const titleMatch = /\.title\s*=\s*"([^"]+)"/.exec(after);
    if (!titleMatch) continue;
    const candidateTitle = titleMatch[1];
    if (!firstFoundTitle) firstFoundTitle = candidateTitle;
    // 저장 또는 삭제 버튼이 명시적으로 활성화된 타이틀바를 우선 선택
    if (/isSaveButtonVisible\s*=\s*true|isDelButtonVisible\s*=\s*true/.test(after)) {
      titleBarTitle = candidateTitle;
      break;
    }
  }
  if (!titleBarTitle) titleBarTitle = firstFoundTitle;

  const result: CrudInfo = {
    hasInquiry: /function\s+TitleForm_inq(Action|Click)\s*\(/.test(content),
    hasNew: /function\s+TitleForm_new(Action|Click)\s*\(/.test(content),
    hasSave: /function\s+TitleForm_save(Action|Click)\s*\(/.test(content),
    hasDelete: /function\s+TitleForm_del(Action|Click)\s*\(/.test(content),
    extButtons: [],
    title: titleBarTitle,
  };

  // 타이틀바 추가 버튼 감지
  const titleExtMatches = content.matchAll(/function\s+TitleForm_ext(\d+)Click\s*\(/g);
  for (const match of titleExtMatches) {
    const btnIndex = parseInt(match[1]);
    const btnName = extractExtButtonName(content, `TitleForm_ext${btnIndex}Click`);
    result.extButtons.push({
      name: btnName || `타이틀바 추가버튼${btnIndex}`,
      functionName: `TitleForm_ext${btnIndex}Click`,
      index: btnIndex,
    });
  }

  return [result];
}

/**
 * 파일 전체에서 initAddButton 호출을 파싱하여 버튼 인덱스→레이블 매핑 반환
 * 형식: initAddButton(firstArg, index, "label", [width,] "tooltip", "PERM")
 */
function parseInitAddButtonLabels(content: string): Map<number, string> {
  const map = new Map<number, string>();
  // initAddButton(anything, N or "N", "label", ...) 패턴
  const re = /initAddButton\s*\([^,)]+,\s*["']?(\d+)["']?\s*,\s*"([^"]+)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    const idx = parseInt(m[1]);
    if (!map.has(idx)) {
      map.set(idx, m[2]);
    }
  }
  return map;
}

/**
 * 추가 버튼의 명칭을 추출
 * 1순위: 파일 내 initAddButton 호출에서 인덱스 매핑
 * 2순위: 함수 앞 주석 내 `추가버튼N [이름]` 패턴
 * 3순위: 함수 앞 주석 라인 * ... [이름] 패턴
 * @param content - 파일 전체 내용
 * @param functionName - 함수명 (Form_ext1Click 등)
 * @returns 추출된 버튼 명칭 또는 null
 */
function extractExtButtonName(content: string, functionName: string): string | null {
  const fnIdx = content.indexOf(`function ${functionName}`);
  if (fnIdx < 0) return null;

  // 함수명에서 버튼 인덱스 추출 (Form_ext1Click → 1, TitleForm_ext2Click → 2)
  const idxMatch = /ext(\d+)Click$/.exec(functionName);
  const btnIndex = idxMatch ? parseInt(idxMatch[1]) : null;

  // 1순위: initAddButton(type, index, "label", ...) 호출
  if (btnIndex !== null) {
    const initLabels = parseInitAddButtonLabels(content);
    const label = initLabels.get(btnIndex);
    if (label) return label;
  }

  // 함수 앞 2000자 탐색 영역
  const searchArea = content.slice(Math.max(0, fnIdx - 2000), fnIdx);

  // 2순위: 추가버튼N [이름] 패턴 (예: 추가버튼1 [선택일괄승인])
  const bracketRe = /추가버튼\d+\s+\[([^\]]+)\]/g;
  let lastBracket: RegExpExecArray | null = null;
  let bm: RegExpExecArray | null;
  while ((bm = bracketRe.exec(searchArea)) !== null) lastBracket = bm;
  if (lastBracket) return lastBracket[1].trim();

  // 3순위: * 주석 라인에서 [이름] 추출 (클릭 또는 버튼 언급 포함)
  const commentRe = /\*[^\n]+(?:클릭|버튼)[^\n]*\[([^\]]+)\]/g;
  let lastComment: RegExpExecArray | null = null;
  let cm: RegExpExecArray | null;
  while ((cm = commentRe.exec(searchArea)) !== null) lastComment = cm;
  if (lastComment) return lastComment[1].trim();

  return null;
}

/**
 * 기타 버튼 이벤트 핸들러를 추출
 * (PatisMenuTitleBar, PatisTitleBar 외의 일반 버튼)
 *
 * 감지 패턴:
 *  1) function {name}_onclick(  — 예: BTN_SEARCH_onclick
 *  2) new cpr.controls.Button("ID") + addEventListener("click", handler)
 *     — 예: C_BTN_SRCLS / CONDITIONGROUP01_C_BTN_SRCLS_click
 *
 * @param content - .clx.js 파일 내용
 * @returns 기타 버튼 정보 배열
 */
export function parseExtraButtons(content: string): ExtButtonInfo[] {
  const buttons: ExtButtonInfo[] = [];
  const seenControlId = new Set<string>();
  const seenFuncBase = new Set<string>();

  // ─── 패턴 1: function {name}_onclick( ─────────────────────────────────────
  const onclickRe = /function\s+((?!Form_|TitleForm_|App_)\w+)_onclick\s*\(/g;
  let m: RegExpExecArray | null;
  while ((m = onclickRe.exec(content)) !== null) {
    const funcBase = m[1];
    if (seenFuncBase.has(funcBase)) continue;
    seenFuncBase.add(funcBase);
    seenControlId.add(funcBase); // 같은 ID로 중복 방지
    buttons.push({
      name: funcBase,
      functionName: `${funcBase}_onclick`,
      index: buttons.length + 1,
    });
  }

  // ─── 패턴 2: new cpr.controls.Button("ID") + addEventListener("click", fn) ─
  const btnDeclRe = /var\s+(\w+)\s*=\s*new\s+cpr\.controls\.Button\("([^"]+)"\)/g;
  while ((m = btnDeclRe.exec(content)) !== null) {
    const varName = m[1];
    const controlId = m[2];
    if (seenControlId.has(controlId)) continue;

    // 선언부 이후 ~600자 내에서 .value, addEventListener 탐색
    const afterDecl = content.slice(m.index, m.index + 600);

    // 버튼 라벨: varName.value = "label"
    const valueMatch = new RegExp(`${varName}\\.value\\s*=\\s*"([^"]+)"`).exec(afterDecl);
    const label = valueMatch ? valueMatch[1] : null;

    // 클릭 핸들러: varName.addEventListener("click", handlerFn)
    const handlerMatch = new RegExp(
      `${varName}\\.addEventListener\\("click"\\s*,\\s*(\\w+)\\)`,
    ).exec(afterDecl);
    if (!handlerMatch) continue;

    const handlerFn = handlerMatch[1];
    // 시스템 핸들러 제외
    if (/^Form_|^TitleForm_|^App_/.test(handlerFn)) continue;

    seenControlId.add(controlId);
    buttons.push({
      name: label || controlId,
      functionName: handlerFn,
      index: buttons.length + 1,
    });
  }

  return buttons;
}
