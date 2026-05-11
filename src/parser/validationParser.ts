/**
 * 필수값 및 검증 로직 파서
 * - requiredColumn / requiredText 배열 추출
 * - alert 메시지 추출 (참고사항용)
 */
import { RequiredFieldInfo, ValidationInfo } from '@/types';

/**
 * 필수값 정보(requiredColumn, requiredText) 추출
 * @param content - .clx.js 파일 내용
 * @returns 필수값 정보 배열
 */
export function parseRequiredFields(content: string): RequiredFieldInfo[] {
  const results: RequiredFieldInfo[] = [];

  // requiredColumn 패턴 매칭
  const columnPattern =
    /PatisUtils\.setAppProperty\(app,\s*app\.lookup\("([^"]+)"\),\s*"requiredColumn",\s*new Array\(([^)]+)\)\)/g;
  // requiredText 패턴 매칭
  const textPattern =
    /PatisUtils\.setAppProperty\(app,\s*app\.lookup\("([^"]+)"\),\s*"requiredText",\s*new Array\(([^)]+)\)\)/g;

  // 컬럼 정보 수집
  const columnMap = new Map<string, string[]>();
  let match: RegExpExecArray | null;

  while ((match = columnPattern.exec(content)) !== null) {
    const targetId = match[1];
    const columns = extractArrayValues(match[2]);
    columnMap.set(targetId, columns);
  }

  // 텍스트 정보 수집 및 매칭
  while ((match = textPattern.exec(content)) !== null) {
    const targetId = match[1];
    const texts = extractArrayValues(match[2]);
    const columns = columnMap.get(targetId) || [];

    results.push({
      targetId,
      columns,
      texts,
    });
  }

  return results;
}

/**
 * alert 메시지를 추출하여 검증 로직 목록 생성
 * @param content - .clx.js 파일 내용
 * @returns 검증 정보 배열
 */
export function parseValidations(content: string): ValidationInfo[] {
  const results: ValidationInfo[] = [];

  // alert 호출 패턴 매칭
  const alertPattern = /alert\("([^"]+)"\)/g;
  let match: RegExpExecArray | null;

  while ((match = alertPattern.exec(content)) !== null) {
    const message = match[1];
    // alert이 속한 함수명 찾기
    const functionName = findEnclosingFunction(content, match.index);

    results.push({
      functionName,
      message,
    });
  }

  return results;
}

/**
 * 문자열 배열에서 값 추출 (따옴표 제거)
 * @param arrayStr - "value1", "value2" 형태의 문자열
 * @returns 값 배열
 */
function extractArrayValues(arrayStr: string): string[] {
  const values: string[] = [];
  const pattern = /"([^"]+)"/g;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(arrayStr)) !== null) {
    values.push(match[1]);
  }

  return values;
}

/**
 * 특정 위치를 감싸는 함수명 추출
 * @param content - 파일 내용
 * @param position - 탐색 시작 위치(문자 인덱스)
 * @returns 감싸는 함수명
 */
function findEnclosingFunction(content: string, position: number): string {
  // position 앞쪽에서 가장 가까운 function 선언 찾기
  const before = content.substring(0, position);
  const funcPattern = /function\s+(\w+)\s*\(/g;
  let lastMatch: RegExpExecArray | null = null;
  let match: RegExpExecArray | null;

  while ((match = funcPattern.exec(before)) !== null) {
    lastMatch = match;
  }

  return lastMatch ? lastMatch[1] : 'unknown';
}
