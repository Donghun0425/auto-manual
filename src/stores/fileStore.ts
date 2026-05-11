/**
 * 파일 상태 관리 스토어
 * - 업로드된 파일의 트리 구조 관리
 * - 파일 선택/해제 상태 관리
 */
import { create } from 'zustand';
import { FileTreeNode } from '@/types';
import { buildFileTree } from '@/utils/treeUtils';

interface FileStore {
  /** 파일 트리 루트 노드 배열 */
  tree: FileTreeNode[];
  /** 업로드된 파일 목록 (경로 + 내용) */
  files: Map<string, string>;
  /** 파일 추가 (업로드 시 호출) */
  addFiles: (fileEntries: { path: string; content: string }[]) => void;
  /** 노드 체크 상태 변경 */
  toggleCheck: (nodeId: string) => void;
  /** 전체 선택 */
  checkAll: () => void;
  /** 전체 해제 */
  uncheckAll: () => void;
  /** 선택된 파일 경로 목록 반환 */
  getCheckedFiles: () => string[];
  /** 상태 초기화 */
  reset: () => void;
}

/** 트리의 모든 노드에 대해 checked 상태를 재귀적으로 설정 */
function setAllChecked(nodes: FileTreeNode[], checked: boolean): FileTreeNode[] {
  return nodes.map((node) => ({
    ...node,
    checked,
    children: node.children ? setAllChecked(node.children, checked) : undefined,
  }));
}

/** 특정 노드의 체크 상태를 토글하고, 하위 노드에 전파 */
function toggleNodeCheck(nodes: FileTreeNode[], targetId: string): FileTreeNode[] {
  return nodes.map((node) => {
    if (node.id === targetId) {
      const newChecked = !node.checked;
      return {
        ...node,
        checked: newChecked,
        children: node.children ? setAllChecked(node.children, newChecked) : undefined,
      };
    }
    if (node.children) {
      return {
        ...node,
        children: toggleNodeCheck(node.children, targetId),
      };
    }
    return node;
  });
}

/** 부모 노드의 체크 상태를 자식 기반으로 갱신 */
function updateParentChecked(nodes: FileTreeNode[]): FileTreeNode[] {
  return nodes.map((node) => {
    if (node.children && node.children.length > 0) {
      const updatedChildren = updateParentChecked(node.children);
      const allChecked = updatedChildren.every((c) => c.checked);
      return { ...node, checked: allChecked, children: updatedChildren };
    }
    return node;
  });
}

/** 체크된 파일 경로를 새로 생성된 트리에 적용 (buildFileTree 후 호출) */
function applyCheckedPaths(nodes: FileTreeNode[], checkedPaths: Set<string>): void {
  for (const node of nodes) {
    if (node.type === 'file') {
      node.checked = checkedPaths.has(node.path);
    } else if (node.children) {
      applyCheckedPaths(node.children, checkedPaths);
      // 폴더: 자식이 있고 전부 체크된 경우에만 체크
      node.checked =
        node.children.length > 0 && node.children.every((c) => c.checked);
    }
  }
}

/** 선택된 파일 경로를 재귀적으로 수집 */
function collectCheckedFiles(nodes: FileTreeNode[]): string[] {
  const result: string[] = [];
  for (const node of nodes) {
    if (node.type === 'file' && node.checked) {
      result.push(node.path);
    }
    if (node.children) {
      result.push(...collectCheckedFiles(node.children));
    }
  }
  return result;
}

export const useFileStore = create<FileStore>((set, get) => ({
  tree: [],
  files: new Map(),

  addFiles: (fileEntries) => {
    set((state) => {
      const newFiles = new Map(state.files);
      for (const entry of fileEntries) {
        newFiles.set(entry.path, entry.content);
      }
      // 기존 선택 상태 보존: 이미 체크된 파일 경로를 수집
      const checkedPaths = new Set(collectCheckedFiles(state.tree));
      // 전체 파일 경로 목록으로 트리 재구성
      const tree = buildFileTree(Array.from(newFiles.keys()));
      // 기존 체크 상태를 새 트리에 복원
      if (checkedPaths.size > 0) applyCheckedPaths(tree, checkedPaths);
      return { files: newFiles, tree };
    });
  },

  toggleCheck: (nodeId) => {
    set((state) => {
      let tree = toggleNodeCheck(state.tree, nodeId);
      tree = updateParentChecked(tree);
      return { tree };
    });
  },

  checkAll: () => {
    set((state) => ({ tree: setAllChecked(state.tree, true) }));
  },

  uncheckAll: () => {
    set((state) => ({ tree: setAllChecked(state.tree, false) }));
  },

  getCheckedFiles: () => {
    return collectCheckedFiles(get().tree);
  },

  reset: () => {
    set({ tree: [], files: new Map() });
  },
}));
