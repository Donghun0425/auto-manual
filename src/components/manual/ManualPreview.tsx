/**
 * 매뉴얼 미리보기 컴포넌트
 * - HTML/Markdown 렌더링 미리보기
 * - 형식 전환(HTML / Markdown 소스)
 * - 다운로드 기능
 */
import { useState, useCallback } from 'react';
import { ManualOutput } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Download, Eye, Code, FileText } from 'lucide-react';
import { matchUriToFilePath } from '@/utils/treeUtils';

interface ManualPreviewProps {
  /** 매뉴얼 출력 배열 */
  outputs: ManualOutput[];
  /** 좌측 파일 목록의 전체 filePath 배열 (탭페이지 링크용) */
  allFilePaths?: string[];
  /** 탭페이지 클릭 시 해당 filePath로 이동 */
  onNavigate?: (filePath: string) => void;
}

export function ManualPreview({ outputs, allFilePaths = [], onNavigate }: ManualPreviewProps) {
  // 미리보기 모드: 'html' = 렌더링된 HTML, 'markdown' = Markdown 소스
  const [viewMode, setViewMode] = useState<'html' | 'markdown'>('html');

  /** iframe 로드 완료 시 탭페이지 링크에 클릭 리스너 부착 */
  const handleIframeLoad = useCallback((e: React.SyntheticEvent<HTMLIFrameElement>) => {
    if (!onNavigate) return;
    const doc = (e.currentTarget as HTMLIFrameElement).contentDocument;
    if (!doc) return;
    doc.querySelectorAll<HTMLElement>('[data-tabpage-uri]').forEach((el) => {
      el.title = '클릭하여 해당 탭페이지 분석결과로 이동';
      el.style.color = 'var(--color-primary, #2563eb)';
      el.style.textDecoration = 'underline';
      el.addEventListener('click', () => {
        const uri = el.getAttribute('data-tabpage-uri') ?? '';
        const matched = matchUriToFilePath(uri, allFilePaths);
        if (matched) onNavigate(matched);
      });
    });
  }, [onNavigate, allFilePaths]);

  if (outputs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <FileText className="h-10 w-10 text-muted-foreground/50 mb-3" />
        <p className="text-sm text-muted-foreground">
          생성된 매뉴얼이 없습니다.
        </p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          분석 완료 후 매뉴얼이 자동으로 생성됩니다.
        </p>
      </div>
    );
  }

  /** HTML 파일 다운로드 */
  const downloadHtml = (output: ManualOutput) => {
    const blob = new Blob([output.html], { type: 'text/html;charset=utf-8' });
    downloadBlob(blob, getFileName(output.filePath, 'html'));
  };

  /** Markdown 파일 다운로드 */
  const downloadMarkdown = (output: ManualOutput) => {
    const blob = new Blob([output.markdown], { type: 'text/markdown;charset=utf-8' });
    downloadBlob(blob, getFileName(output.filePath, 'md'));
  };

  return (
    <div className="space-y-4">
      {/* 뷰 모드 전환 */}
      <div className="flex items-center gap-1.5">
        <Button
          variant={viewMode === 'html' ? 'default' : 'outline'}
          size="xs"
          onClick={() => setViewMode('html')}
        >
          <Eye className="h-3 w-3" />
          HTML 미리보기
        </Button>
        <Button
          variant={viewMode === 'markdown' ? 'default' : 'outline'}
          size="xs"
          onClick={() => setViewMode('markdown')}
        >
          <Code className="h-3 w-3" />
          Markdown 소스
        </Button>
      </div>

      {/* 매뉴얼 출력 목록 */}
      {outputs.map((output) => (
        <div key={output.filePath} className="rounded-lg border overflow-hidden">
          {/* 파일 헤더 및 다운로드 버튼 */}
          <div className="flex items-center justify-between bg-muted/50 px-4 py-2.5 border-b">
            <div className="flex items-center gap-2">
              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
              <code className="text-xs font-mono text-foreground/80">{output.filePath}</code>
              <Badge variant="secondary" className="text-[10px]">생성 완료</Badge>
            </div>
            <div className="flex gap-1.5">
              <Button variant="outline" size="xs" onClick={() => downloadHtml(output)}>
                <Download className="h-3 w-3" />
                HTML
              </Button>
              <Button variant="outline" size="xs" onClick={() => downloadMarkdown(output)}>
                <Download className="h-3 w-3" />
                MD
              </Button>
            </div>
          </div>

          <Separator />

          {/* 미리보기 본문 */}
          <div className="p-4">
            {viewMode === 'html' ? (
              // HTML 렌더링 미리보기 (iframe 활용)
              <iframe
                srcDoc={output.html}
                className="w-full h-[500px] border-0 rounded-md bg-white"
                title={`매뉴얼 미리보기 - ${output.filePath}`}
                sandbox="allow-same-origin"
                onLoad={handleIframeLoad}
              />
            ) : (
              // Markdown 소스 표시
              <pre className="text-xs font-mono text-foreground/80 whitespace-pre-wrap bg-muted/30 p-4 rounded-md overflow-auto max-h-[500px]">
                {output.markdown}
              </pre>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Blob을 파일로 다운로드 */
function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** 파일 경로에서 다운로드 파일명 생성 */
function getFileName(filePath: string, ext: string): string {
  const baseName = filePath.replace(/\\/g, '/').split('/').pop() || 'manual';
  const name = baseName.replace('.clx.js', '');
  return `${name}_매뉴얼.${ext}`;
}
