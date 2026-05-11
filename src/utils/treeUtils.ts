/**
 * 트리 구조 유틸리티
 * - 파일 경로 배열을 트리 구조로 변환
 * - 폴더 계층 자동 생성
 */
import { FileTreeNode } from '@/types';

/**
 * 파일 경로 배열을 트리 구조로 변환
 * @param paths - 파일 경로 배열 (예: ["univ/grdtn/ugr01/file.clx.js"])
 * @returns 트리 노드 배열
 */
export function buildFileTree(paths: string[]): FileTreeNode[] {
  const root: FileTreeNode[] = [];

  for (const filePath of paths) {
    // 경로를 슬래시로 분리
    const parts = filePath.replace(/\\/g, '/').split('/');
    let currentLevel = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;
      const currentPath = parts.slice(0, i + 1).join('/');

      // 현재 레벨에서 동일 이름 노드 검색
      let existing = currentLevel.find((n) => n.name === part);

      if (!existing) {
        // 새 노드 생성
        const newNode: FileTreeNode = {
          id: currentPath,
          name: part,
          path: currentPath,
          type: isFile ? 'file' : 'folder',
          checked: false,
          children: isFile ? undefined : [],
        };
        currentLevel.push(newNode);
        existing = newNode;
      }

      // 다음 레벨로 이동 (폴더인 경우)
      if (!isFile && existing.children) {
        currentLevel = existing.children;
      }
    }
  }

  // 폴더를 파일보다 먼저 정렬
  sortTree(root);
  return root;
}

/** 트리 노드를 정렬 (폴더 우선, 이름 기준 오름차순) */
function sortTree(nodes: FileTreeNode[]) {
  nodes.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
  for (const node of nodes) {
    if (node.children) sortTree(node.children);
  }
}

/**
 * 탭페이지 appUri와 일치하는 filePath를 찾는다.
 * - appUri: "univ/screg/usc03/usc_3010301_t01" (확장자 없음)
 * - filePath: "...univ/screg/usc03/usc_3010301_t01.clx.js"
 */
export function matchUriToFilePath(
  appUri: string,
  allFilePaths: string[]
): string | undefined {
  const normalizedUri = appUri.replace(/\\/g, '/').toLowerCase();
  return allFilePaths.find((fp) => {
    const normalized = fp.replace(/\\/g, '/').replace(/\.clx\.js$/i, '').toLowerCase();
    return normalized.endsWith('/' + normalizedUri) || normalized === normalizedUri;
  });
}
