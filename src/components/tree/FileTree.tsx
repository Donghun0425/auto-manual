/**
 * 파일 트리 컴포넌트
 * - 업로드된 파일을 트리구조로 표시
 * - 전체선택/해제, 폴더단위 선택, 단건 선택 기능 제공
 */
import { useFileStore } from '@/stores/fileStore';
import { TreeNode } from './TreeNode';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { CheckSquare, Square, FolderTree } from 'lucide-react';

export function FileTree() {
  const tree = useFileStore((s) => s.tree);
  const checkAll = useFileStore((s) => s.checkAll);
  const uncheckAll = useFileStore((s) => s.uncheckAll);

  // 파일이 없으면 빈 상태 표시
  if (tree.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-10 text-center">
          <div className="rounded-full bg-muted p-3 mb-3">
            <FolderTree className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            업로드된 파일이 없습니다.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>파일 목록</CardTitle>
            <CardDescription>매뉴얼을 생성할 파일을 선택하세요.</CardDescription>
          </div>
          <div className="flex gap-1.5">
            <Button variant="outline" size="xs" onClick={checkAll}>
              <CheckSquare className="h-3 w-3" />
              전체 선택
            </Button>
            <Button variant="ghost" size="xs" onClick={uncheckAll}>
              <Square className="h-3 w-3" />
              전체 해제
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* 트리 노드 렌더링 */}
        <div className="rounded-md border bg-muted/30 p-2 max-h-[50vh] overflow-y-auto">
          {tree.map((node) => (
            <TreeNode key={node.id} node={node} depth={0} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
