/**
 * 분석결과 메인 컴포넌트
 * - 각 섹션별 분석 결과를 표시
 */
import { useRef } from 'react';
import { AnalysisResult } from '@/types';
import { OverviewSection } from './OverviewSection';
import { UsageSection } from './UsageSection';
import { NotesSection } from './NotesSection';
import { ItemsSection } from './ItemsSection';
import { PopupSection } from './PopupSection';
import { TabPagesSection } from './TabPagesSection';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileCode, ImagePlus, Trash2, Image } from 'lucide-react';
import { useAnalysisStore } from '@/stores/analysisStore';
import { useManualStore } from '@/stores/manualStore';
import { generateHtml } from '@/generators/htmlGenerator';
import { generateMarkdown } from '@/generators/markdownGenerator';

interface AnalysisResultViewProps {
  /** 분석 결과 배열 */
  results: AnalysisResult[];
  /** 좌측 파일 목록의 전체 filePath 배열 (탭페이지 링크용) */
  allFilePaths?: string[];
  /** 탭페이지 클릭 시 해당 filePath로 이동 */
  onNavigate?: (filePath: string) => void;
}

// ─────────────────────────────────────────────
// 이미지 업로드 영역 컴포넌트 (파일별)
// ─────────────────────────────────────────────
function ScreenImageSection({ result }: { result: AnalysisResult }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const updateScreenImage = useAnalysisStore((s) => s.updateScreenImage);
  const manualOutputs = useManualStore((s) => s.outputs);
  const updateOutput = useManualStore((s) => s.updateOutput);

  const handleSelect = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const updated = { ...result, screenImageDataUrl: dataUrl };
      updateScreenImage(result.filePath, dataUrl);
      // 매뉴얼이 이미 생성된 경우 재생성
      if (manualOutputs.some((o) => o.filePath === result.filePath)) {
        updateOutput(result.filePath, generateHtml(updated), generateMarkdown(updated));
      }
    };
    reader.readAsDataURL(file);
    // 같은 파일 재선택을 위해 value 초기화
    e.target.value = '';
  };

  const handleDelete = () => {
    const updated = { ...result, screenImageDataUrl: undefined };
    updateScreenImage(result.filePath, undefined);
    if (manualOutputs.some((o) => o.filePath === result.filePath)) {
      updateOutput(result.filePath, generateHtml(updated), generateMarkdown(updated));
    }
  };

  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Image className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">화면 이미지</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="xs" onClick={handleSelect} className="gap-1">
            <ImagePlus className="h-3 w-3" />
            이미지 선택
          </Button>
          {result.screenImageDataUrl && (
            <Button variant="outline" size="xs" onClick={handleDelete} className="gap-1 text-destructive hover:text-destructive">
              <Trash2 className="h-3 w-3" />
              이미지 삭제
            </Button>
          )}
        </div>
      </div>

      {result.screenImageDataUrl ? (
        <div className="rounded-md overflow-hidden border bg-muted/30">
          <img
            src={result.screenImageDataUrl}
            alt="화면 이미지"
            className="w-full object-contain max-h-64"
          />
        </div>
      ) : (
        <div
          className="flex flex-col items-center justify-center gap-1.5 rounded-md border-2 border-dashed border-muted-foreground/20 bg-muted/20 py-6 cursor-pointer hover:bg-muted/30 transition-colors"
          onClick={handleSelect}
        >
          <ImagePlus className="h-6 w-6 text-muted-foreground/40" />
          <p className="text-xs text-muted-foreground/60">클릭하여 화면 이미지를 업로드하세요</p>
        </div>
      )}

      {/* 숨겨진 파일 input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}

// ─────────────────────────────────────────────
// 분석결과 뷰
// ─────────────────────────────────────────────
export function AnalysisResultView({ results, allFilePaths = [], onNavigate }: AnalysisResultViewProps) {
  // analysisStore의 결과를 구독하여 screenImageDataUrl 변경 시 re-render
  const storeResults = useAnalysisStore((s) => s.results);

  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <FileCode className="h-10 w-10 text-muted-foreground/50 mb-3" />
        <p className="text-sm text-muted-foreground">
          분석 결과가 없습니다.
        </p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          파일을 선택하고 매뉴얼 생성을 실행해주세요.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {results.map((result) => {
        // 스토어의 최신 상태로 덮어쓰기 (이미지 등 동적 필드 반영)
        const liveResult = storeResults.find((r) => r.filePath === result.filePath) ?? result;

        return (
          <div key={result.filePath} className="space-y-4">
            {/* 파일 경로 표시 */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted">
              <FileCode className="h-4 w-4 text-muted-foreground shrink-0" />
              <code className="text-xs font-mono text-foreground/80">{result.filePath}</code>
              <Badge variant="secondary" className="ml-auto text-[10px]">
                분석 완료
              </Badge>
            </div>

            {/* 화면 이미지 업로드 영역 */}
            <ScreenImageSection result={liveResult} />

            {/* 섹션별 결과를 아코디언으로 표시 */}
            <Accordion type="multiple" defaultValue={['overview', 'usage', 'notes', 'items', 'tabpages', 'popups']} className="space-y-2">
              <AccordionItem value="overview" className="border rounded-lg px-4">
                <AccordionTrigger className="text-sm font-medium">화면개요</AccordionTrigger>
                <AccordionContent>
                  <OverviewSection overview={liveResult.overview} />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="usage" className="border rounded-lg px-4">
                <AccordionTrigger className="text-sm font-medium">사용방법</AccordionTrigger>
                <AccordionContent>
                  <UsageSection usage={liveResult.usage} />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="notes" className="border rounded-lg px-4">
                <AccordionTrigger className="text-sm font-medium">참고사항</AccordionTrigger>
                <AccordionContent>
                  <NotesSection notes={liveResult.notes} />
                </AccordionContent>
              </AccordionItem>

              {liveResult.items.grids.length > 0 && (
                <AccordionItem value="items" className="border rounded-lg px-4">
                  <AccordionTrigger className="text-sm font-medium">항목</AccordionTrigger>
                  <AccordionContent>
                    <ItemsSection items={liveResult.items} />
                  </AccordionContent>
                </AccordionItem>
              )}

              {liveResult.tabPages.length > 0 && (
                <AccordionItem value="tabpages" className="border rounded-lg px-4">
                  <AccordionTrigger className="text-sm font-medium">탭페이지</AccordionTrigger>
                  <AccordionContent>
                    <TabPagesSection
                      tabPages={liveResult.tabPages}
                      allFilePaths={allFilePaths}
                      onNavigate={onNavigate}
                    />
                  </AccordionContent>
                </AccordionItem>
              )}

              {liveResult.popups.length > 0 && (
                <AccordionItem value="popups" className="border rounded-lg px-4">
                  <AccordionTrigger className="text-sm font-medium">팝업</AccordionTrigger>
                  <AccordionContent>
                    <PopupSection popups={liveResult.popups} />
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>
          </div>
        );
      })}
    </div>
  );
}
