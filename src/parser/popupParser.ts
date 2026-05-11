/**
 * 팝업 파서
 * - PatisUtils.openPopup 호출부에서 팝업 정보 추출
 */
import { PopupInfo } from '@/types';

/**
 * openPopup 호출부에서 팝업 정보를 추출
 * @param content - .clx.js 파일 내용
 * @returns 팝업 정보 배열
 */
export function parsePopups(content: string): PopupInfo[] {
  const popups: PopupInfo[] = [];
  const seen = new Set<string>();

  // PatisUtils.openPopup(popupId, argumentsList, popupUrl, popupCallback, popupWidth, popupHeight, app)
  const pattern =
    /PatisUtils\.openPopup\(\s*(?:["']([^"']+)["']|(\w+))\s*,\s*\w+\s*,\s*"([^"]+)"\s*,\s*"([^"]+)"\s*,\s*(\d+)\s*,\s*(\d+)/g;

  let match: RegExpExecArray | null;

  while ((match = pattern.exec(content)) !== null) {
    const popupId = match[1] || match[2];
    const popupUrl = match[3];
    const callbackFunction = match[4];
    const width = parseInt(match[5]);
    const height = parseInt(match[6]);

    // 중복 제거 (같은 팝업이 여러번 호출될 수 있음)
    if (!seen.has(popupId)) {
      seen.add(popupId);
      popups.push({
        popupId,
        popupUrl,
        callbackFunction,
        width,
        height,
      });
    }
  }

  return popups;
}
