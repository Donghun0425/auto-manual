/**
 * 트리 노드 컴포넌트
 * - 폴더/파일을 재귀적으로 렌더링
 * - 체크박스 클릭 시 하위 노드에 상태 전파
 * - 폴더 접기/펼치기 기능
 */
import { useState } from 'react';
import { ChevronRight, ChevronDown, Folder, FileCode } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { FileTreeNode } from '@/types';
import { useFileStore } from '@/stores/fileStore';

interface TreeNodeProps {
  /** 트리 노드 데이터 */
  node: FileTreeNode;
  /** 들여쓰기 깊이 */
  depth: number;
}

export function TreeNode({ node, depth }: TreeNodeProps) {
  const toggleCheck = useFileStore((s) => s.toggleCheck);
  // 폴더 확장 상태 (기본 열림)
  const [expanded, setExpanded] = useState(true);

  const isFolder = node.type === 'folder';

  /** 체크박스 변경 핸들러 */
  const handleCheck = () => {
    toggleCheck(node.id);
  };

  /** 폴더 확장/축소 토글 */
  const handleToggle = () => {
    if (isFolder) setExpanded(!expanded);
  };

  return (
    <div>
      <div
        className="flex items-center gap-1.5 py-0.5 px-1 rounded-sm hover:bg-accent/50 cursor-pointer select-none group"
        style={{ paddingLeft: `${depth * 16 + 4}px` }}
        onClick={handleToggle}
      >
        {/* 폴더 확장 아이콘 */}
        {isFolder ? (
          expanded ? (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          )
        ) : (
          <span className="w-3.5 shrink-0" />
        )}

        {/* 체크박스 */}
        <Checkbox
          checked={node.checked}
          onCheckedChange={handleCheck}
          onClick={(e) => e.stopPropagation()}
          className="shrink-0"
        />

        {/* 아이콘 */}
        {isFolder ? (
          <Folder className="h-4 w-4 text-amber-500 shrink-0" />
        ) : (
          <FileCode className="h-4 w-4 text-primary/70 shrink-0" />
        )}

        {/* 노드 이름 */}
        <span className="text-sm truncate text-foreground/80 group-hover:text-foreground">
          {node.name}
        </span>
      </div>

      {/* 하위 노드 (폴더가 확장 상태인 경우) */}
      {isFolder && expanded && node.children && (
        <div>
          {node.children.map((child) => (
            <TreeNode key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
