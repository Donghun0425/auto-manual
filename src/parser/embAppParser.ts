/**
 * 임베디드 앱(탭페이지) 파서
 * - PatisUtils.loadEmbApp 호출부에서 탭페이지 정보 추출
 */
import { TabPageInfo } from '@/types';

/**
 * loadEmbApp 호출부에서 탭페이지 정보를 추출
 * @param content - .clx.js 파일 내용
 * @returns 탭페이지 정보 배열
 */
export function parseEmbApps(content: string): TabPageInfo[] {
  const tabPages: TabPageInfo[] = [];
  const seen = new Set<string>();

  // PatisUtils.loadEmbApp(container, "appUri", ...) 패턴
  const pattern = /PatisUtils\.loadEmbApp\([^,]*,\s*"([^"]+)"/g;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(content)) !== null) {
    const appUri = match[1];

    // 중복 제거
    if (!seen.has(appUri)) {
      seen.add(appUri);

      // 호출 위치(감싸는 함수명) 추출
      const calledFrom = findEnclosingFunction(content, match.index);

      tabPages.push({
        appUri,
        calledFrom,
      });
    }
  }

  return tabPages;
}

/**
 * 특정 위치를 감싸는 함수명 추출
 * @param content - 파일 내용
 * @param position - 문자 인덱스
 * @returns 함수명
 */
function findEnclosingFunction(content: string, position: number): string {
  const before = content.substring(0, position);
  const funcPattern = /function\s+(\w+)\s*\(/g;
  let lastMatch: RegExpExecArray | null = null;
  let match: RegExpExecArray | null;

  while ((match = funcPattern.exec(before)) !== null) {
    lastMatch = match;
  }

  return lastMatch ? lastMatch[1] : 'unknown';
}
