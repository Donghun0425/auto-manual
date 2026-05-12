/**
 * 임베디드 앱(탭페이지) 파서
 * - PatisUtils.loadEmbApp 호출부에서 탭페이지 정보 추출
 * - new cpr.controls.EmbeddedApp("EMBxx") 선언부 + 직전 tabItem.text 레이블 추출
 * - 두 패턴을 통합하여 { appUri: 실제파일경로, tabLabel: 탭명 } 형식으로 반환
 */
import { TabPageInfo } from '@/types';

/**
 * loadEmbApp 호출부에서 탭페이지 정보를 추출
 * @param content - .clx.js 파일 내용
 * @returns 탭페이지 정보 배열
 */
export function parseEmbApps(content: string): TabPageInfo[] {
  const tabPages: TabPageInfo[] = [];
  let m: RegExpExecArray | null;

  // ── Step 1: loadEmbApp에서 embId → 실제 파일경로 맵 생성 ──
  // PatisUtils.loadEmbApp(app.lookup("EMBxx"), "uri") 또는
  // PatisUtils.loadEmbApp(varName, "uri") 패턴
  const embIdToUri = new Map<string, string>();
  const loadScanRe = /PatisUtils\.loadEmbApp\(\s*(?:app\.lookup\s*\(\s*"([^"]+)"\s*\)|(\w+))\s*,\s*"([^"]+)"/g;
  while ((m = loadScanRe.exec(content)) !== null) {
    const embId = m[1] || m[2];
    const appUri = m[3];
    if (embId && !embIdToUri.has(embId)) {
      embIdToUri.set(embId, appUri);
    }
  }

  // ── Step 2: EmbeddedApp 선언부에서 embId → tabLabel 맵 생성 ──
  // new cpr.controls.EmbeddedApp("EMBxx") 직전 최대 800자에서 tabItem_N.text 추출
  const embIdToLabel = new Map<string, string>();
  const embDeclRe = /new\s+cpr\.controls\.EmbeddedApp\s*\(\s*"([^"]+)"\s*\)/g;
  while ((m = embDeclRe.exec(content)) !== null) {
    const embId = m[1];
    const before = content.slice(Math.max(0, m.index - 800), m.index);
    const textRe = /(?:tabItem_\d+|tabItem)\s*\.text\s*=\s*"([^"]+)"/g;
    let lastText: string | undefined;
    let tm: RegExpExecArray | null;
    while ((tm = textRe.exec(before)) !== null) lastText = tm[1];
    if (lastText) embIdToLabel.set(embId, lastText);
  }

  // ── Step 3: EmbeddedApp 선언부 기반 TabPageInfo 생성 ──
  // 선언부가 있는 EMB ID: 실제 파일경로(loadEmbApp 맵에서 조회) + 탭명 통합
  const seenUri = new Set<string>();
  const seenEmbId = new Set<string>();

  for (const [embId, tabLabel] of embIdToLabel.entries()) {
    const realUri = embIdToUri.get(embId) ?? embId; // 파일경로가 없으면 EMB ID 사용
    if (!seenUri.has(realUri)) {
      seenUri.add(realUri);
      seenEmbId.add(embId);
      tabPages.push({ appUri: realUri, calledFrom: 'layout', tabLabel });
    }
  }

  // ── Step 4: 선언부가 없고 loadEmbApp만 있는 경우 ──
  const loadRe = /PatisUtils\.loadEmbApp\(\s*(?:app\.lookup\s*\(\s*"([^"]+)"\s*\)|(\w+))\s*,\s*"([^"]+)"/g;
  while ((m = loadRe.exec(content)) !== null) {
    const embId = m[1] || m[2];
    const appUri = m[3];
    // 선언부에서 이미 처리된 경우 스킵
    if (embId && seenEmbId.has(embId)) continue;
    if (seenUri.has(appUri)) continue;
    seenUri.add(appUri);
    const calledFrom = findEnclosingFunction(content, m.index);
    tabPages.push({ appUri, calledFrom });
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
