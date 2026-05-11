/**
 * 결과 페이지 - 마스터-디테일 레이아웃
 * - 좌측: 분석된 파일 목록 (폴더 트리 + 연관파일 그룹 표시)
 * - 우측: 선택한 파일의 [분석결과] / [생성매뉴얼] 탭
 */
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAnalysisStore } from '@/stores/analysisStore';
import { useManualStore } from '@/stores/manualStore';
import { AnalysisResultView } from '@/components/analysis/AnalysisResult';
import { ManualPreview } from '@/components/manual/ManualPreview';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ArrowLeft, ClipboardList, BookOpen, FileCode, CheckCircle2,
  Folder, FolderOpen, ChevronRight, ChevronDown, File,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { buildFileTree } from '@/utils/treeUtils';
import { FileTreeNode } from '@/types';

// ─────────────────────────────────────────────
// 연관 파일 그룹 색상 (최대 6가지 사이클)
// ─────────────────────────────────────────────
const GROUP_COLORS = [
  { border: 'border-l-blue-400',    bg: 'bg-blue-50',    dot: 'bg-blue-400'    },
  { border: 'border-l-violet-400',  bg: 'bg-violet-50',  dot: 'bg-violet-400'  },
  { border: 'border-l-emerald-400', bg: 'bg-emerald-50', dot: 'bg-emerald-400' },
  { border: 'border-l-amber-400',   bg: 'bg-amber-50',   dot: 'bg-amber-400'   },
  { border: 'border-l-rose-400',    bg: 'bg-rose-50',    dot: 'bg-rose-400'    },
  { border: 'border-l-cyan-400',    bg: 'bg-cyan-50',    dot: 'bg-cyan-400'    },
];

/**
 * 같은 폴더 레벨에서 파일명 공통 접두사(마지막 _ 이전)가 일치하는 파일끼리 그룹화
 * - "usc_3010601_u", "usc_3010601_t01" -> 같은 그룹 (공통 접두사: usc_3010601)
 * @returns filePath -> 색상 인덱스 Map
 */
function computeFileGroups(tree: FileTreeNode[]): Map<string, number> {
  const groupMap = new Map<string, number>();
  let colorIdx = 0;

  function processLevel(nodes: FileTreeNode[]) {
    const fileNodes = nodes.filter((n) => n.type === 'file');

    // 공통 접두사별로 파일 경로 묶기
    const prefixBuckets = new Map<string, string[]>();
    for (const node of fileNodes) {
      const base = node.name.replace(/\.clx\.js$/i, '');
      const lastUnderscore = base.lastIndexOf('_');
      if (lastUnderscore > 0) {
        const prefix = base.slice(0, lastUnderscore);
        const bucket = prefixBuckets.get(prefix) ?? [];
        bucket.push(node.path);
        prefixBuckets.set(prefix, bucket);
      }
    }

    // 2개 이상 파일이 있는 그룹에만 색상 할당
    for (const paths of prefixBuckets.values()) {
      if (paths.length >= 2) {
        const idx = colorIdx % GROUP_COLORS.length;
        for (const path of paths) groupMap.set(path, idx);
        colorIdx++;
      }
    }

    // 하위 폴더 재귀 처리
    for (const node of nodes) {
      if (node.type === 'folder' && node.children) processLevel(node.children);
    }
  }

  processLevel(tree);
  return groupMap;
}

// ─────────────────────────────────────────────
// 트리 노드 재귀 렌더러 (ResultPage 전용)
// ─────────────────────────────────────────────
interface ResultTreeNodeProps {
  node: FileTreeNode;
  depth: number;
  selectedPath: string;
  completedPaths: Set<string>;
  expandedFolders: Set<string>;
  /** 연관 파일 그룹 색상 정보 */
  fileGroups: Map<string, number>;
  onSelectFile: (path: string) => void;
  onToggleFolder: (path: string) => void;
}

function ResultTreeNode({
  node, depth, selectedPath, completedPaths, expandedFolders, fileGroups,
  onSelectFile, onToggleFolder,
}: ResultTreeNodeProps) {
  const indent = depth * 12;

  if (node.type === 'folder') {
    const isOpen = expandedFolders.has(node.path);
    return (
      <div>
        <button
          onClick={() => onToggleFolder(node.path)}
          className="w-full flex items-center gap-1.5 rounded-md px-2 py-1.5 text-left hover:bg-muted transition-colors"
          style={{ paddingLeft: `${8 + indent}px` }}
        >
          {isOpen
            ? <ChevronDown  className="h-3 w-3 text-muted-foreground shrink-0" />
            : <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />}
          {isOpen
            ? <FolderOpen className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            : <Folder     className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
          <span className="text-xs font-medium text-foreground truncate">{node.name}</span>
        </button>

        {isOpen && node.children?.map((child) => (
          <ResultTreeNode
            key={child.path}
            node={child}
            depth={depth + 1}
            selectedPath={selectedPath}
            completedPaths={completedPaths}
            expandedFolders={expandedFolders}
            fileGroups={fileGroups}
            onSelectFile={onSelectFile}
            onToggleFolder={onToggleFolder}
          />
        ))}
      </div>
    );
  }

  // 파일 행
  const isSelected = node.path === selectedPath;
  const hasManual  = completedPaths.has(node.path);
  const groupIdx   = fileGroups.get(node.path);
  const groupColor = groupIdx !== undefined ? GROUP_COLORS[groupIdx] : null;

  return (
    <button
      onClick={() => onSelectFile(node.path)}
      className={cn(
        'w-full flex items-center gap-1.5 rounded-md py-1.5 pr-2 text-left transition-colors border-l-2',
        groupColor && !isSelected
          ? `${groupColor.border} ${groupColor.bg}`
          : 'border-l-transparent',
        isSelected
          ? 'bg-primary text-primary-foreground !border-l-primary'
          : 'hover:bg-muted text-foreground',
      )}
      style={{ paddingLeft: `${6 + indent}px` }}
    >
      {/* 연관 그룹 컬러 도트 */}
      {groupColor && !isSelected && (
        <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', groupColor.dot)} />
      )}
      {/* 파일 아이콘 / 완료 체크 */}
      {hasManual
        ? <CheckCircle2 className={cn('h-3.5 w-3.5 shrink-0', isSelected ? 'text-primary-foreground/80' : 'text-green-500')} />
        : <File         className={cn('h-3.5 w-3.5 shrink-0', isSelected ? 'text-primary-foreground/60' : 'text-muted-foreground')} />}
      <span className="text-xs truncate">{node.name}</span>
    </button>
  );
}

// ─────────────────────────────────────────────
// ResultPage
// ─────────────────────────────────────────────
export function ResultPage() {
  const navigate = useNavigate();
  const results  = useAnalysisStore((s) => s.results);
  const outputs  = useManualStore((s) => s.outputs);

  // 현재 선택된 파일 경로 (기본값: 첫 번째 파일)
  const [selectedPath, setSelectedPath] = useState<string>(
    results[0]?.filePath ?? ''
  );

  // 파일 경로 배열로부터 폴더 트리 구성 (메모이제이션)
  const fileTree = useMemo(
    () => buildFileTree(results.map((r) => r.filePath)),
    [results]
  );

  // 연관 파일 그룹 색상 맵 (공통 접두사 기준)
  const fileGroups = useMemo(() => computeFileGroups(fileTree), [fileTree]);

  // 매뉴얼 생성 완료 파일 경로 집합
  const completedPaths = useMemo(
    () => new Set(outputs.map((o) => o.filePath)),
    [outputs]
  );

  // 펼쳐진 폴더 경로 집합 (초기: 모든 폴더 펼침)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(() => {
    const allFolders = new Set<string>();
    const collect = (nodes: FileTreeNode[]) => {
      for (const n of nodes) {
        if (n.type === 'folder') {
          allFolders.add(n.path);
          if (n.children) collect(n.children);
        }
      }
    };
    collect(buildFileTree(results.map((r) => r.filePath)));
    return allFolders;
  });

  /** 폴더 펼침/접힘 토글 */
  const toggleFolder = (path: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      next.has(path) ? next.delete(path) : next.add(path);
      return next;
    });
  };

  const selectedResult = results.find((r) => r.filePath === selectedPath);
  const selectedOutput = outputs.find((o) => o.filePath === selectedPath);

  return (
    <div className="flex flex-col h-[calc(100vh-6.5rem)] gap-3 max-w-[1400px] mx-auto">

      {/* 상단 네비게이션 */}
      <div className="flex items-center gap-3 shrink-0">
        <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
          <ArrowLeft className="h-3.5 w-3.5" />
          파일목록으로 돌아가기
        </Button>
        <Badge variant="secondary" className="text-xs">
          총 {results.length}개 파일 분석 완료
        </Badge>
      </div>

      {/* 마스터-디테일 레이아웃 */}
      <div className="flex gap-3 flex-1 min-h-0">

        {/* 좌측: 폴더 트리 패널 */}
        <Card className="w-64 shrink-0 flex flex-col min-h-0">
          <CardHeader className="py-3 px-4 border-b shrink-0">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileCode className="h-4 w-4 text-muted-foreground" />
              파일 목록
            </CardTitle>
          </CardHeader>
          <ScrollArea className="flex-1">
            <div className="p-1.5">
              {fileTree.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">파일이 없습니다</p>
              ) : (
                fileTree.map((node) => (
                  <ResultTreeNode
                    key={node.path}
                    node={node}
                    depth={0}
                    selectedPath={selectedPath}
                    completedPaths={completedPaths}
                    expandedFolders={expandedFolders}
                    fileGroups={fileGroups}
                    onSelectFile={setSelectedPath}
                    onToggleFolder={toggleFolder}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </Card>

        {/* 우측: 상세 정보 패널 */}
        <div className="flex-1 min-w-0 min-h-0 flex flex-col">
          {selectedResult ? (
            <Tabs defaultValue="analysis" className="flex flex-col h-full">
              <TabsList className="w-full justify-start shrink-0">
                <TabsTrigger value="analysis" className="gap-1.5">
                  <ClipboardList className="h-3.5 w-3.5" />
                  분석결과
                </TabsTrigger>
                <TabsTrigger value="manual" className="gap-1.5">
                  <BookOpen className="h-3.5 w-3.5" />
                  생성매뉴얼
                </TabsTrigger>
              </TabsList>

              {/* 분석결과 탭 — overflow-y-auto 로 직접 스크롤 */}
              <TabsContent
                value="analysis"
                className="flex-1 mt-3 min-h-0 overflow-y-auto rounded-lg border bg-card"
              >
                <div className="p-4 pb-8">
                  <AnalysisResultView
                    results={[selectedResult]}
                    allFilePaths={results.map((r) => r.filePath)}
                    onNavigate={setSelectedPath}
                  />
                </div>
              </TabsContent>

              {/* 생성매뉴얼 탭 */}
              <TabsContent
                value="manual"
                className="flex-1 mt-3 min-h-0 overflow-y-auto rounded-lg border bg-card"
              >
                <div className="p-4 pb-8">
                  <ManualPreview
                    outputs={selectedOutput ? [selectedOutput] : []}
                    allFilePaths={results.map((r) => r.filePath)}
                    onNavigate={setSelectedPath}
                  />
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <Card className="h-full flex items-center justify-center">
              <div className="text-center">
                <FileCode className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">좌측에서 파일을 선택하세요</p>
              </div>
            </Card>
          )}
        </div>

      </div>
    </div>
  );
}