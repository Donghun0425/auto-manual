/**
 * 탭페이지 섹션 컴포넌트
 * - loadEmbApp으로 로드되는 페이지 목록 표시
 * - 파일 목록에 존재하는 탭페이지는 클릭 시 해당 파일 분석결과로 이동
 */
import { TabPageInfo } from '@/types';
import { ExternalLink, AppWindow } from 'lucide-react';
import { matchUriToFilePath } from '@/utils/treeUtils';

interface TabPagesSectionProps {
  tabPages: TabPageInfo[];
  /** 좌측 파일 목록의 전체 filePath 배열 */
  allFilePaths?: string[];
  /** 탭페이지 클릭 시 해당 filePath로 이동 */
  onNavigate?: (filePath: string) => void;
}

export function TabPagesSection({ tabPages, allFilePaths = [], onNavigate }: TabPagesSectionProps) {
  return (
    <div className="space-y-2 py-2">
      <ul className="space-y-2">
        {tabPages.map((tp, idx) => {
          const matchedPath = matchUriToFilePath(tp.appUri, allFilePaths);
          const isNavigable = !!matchedPath && !!onNavigate;

          return (
            <li key={idx} className="flex items-center gap-2 rounded-md border p-2.5">
              <AppWindow className="h-4 w-4 text-muted-foreground shrink-0" />
              {isNavigable ? (
                <button
                  className="text-xs font-mono text-primary hover:underline flex items-center gap-1 text-left"
                  title="클릭하여 해당 탭페이지 분석결과로 이동"
                  onClick={() => onNavigate!(matchedPath!)}
                >
                  {tp.appUri}
                  <ExternalLink className="h-3 w-3 shrink-0" />
                </button>
              ) : (
                <code className="text-xs font-mono text-foreground/80">{tp.appUri}</code>
              )}
              <span className="ml-auto text-[10px] text-muted-foreground border rounded px-1.5 py-0.5">
                {tp.calledFrom}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
