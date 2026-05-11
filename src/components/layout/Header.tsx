/**
 * 헤더 컴포넌트
 * - 애플리케이션 타이틀 및 매뉴얼 초기화 버튼 포함
 */
import { useNavigate } from 'react-router-dom';
import { useFileStore } from '@/stores/fileStore';
import { useAnalysisStore } from '@/stores/analysisStore';
import { useManualStore } from '@/stores/manualStore';
import { Button } from '@/components/ui/button';
import { RotateCcw, BookOpen } from 'lucide-react';

export function Header() {
  const navigate = useNavigate();
  const resetFiles = useFileStore((s) => s.reset);
  const resetAnalysis = useAnalysisStore((s) => s.reset);
  const resetManual = useManualStore((s) => s.reset);

  /** 모든 상태를 초기화하고 메인 페이지로 이동 */
  const handleReset = () => {
    resetFiles();
    resetAnalysis();
    resetManual();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => navigate('/')}
        >
          <BookOpen className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-heading font-semibold tracking-tight">
            eXBuilder6 매뉴얼 생성기
          </h1>
        </div>
        <Button variant="outline" size="sm" onClick={handleReset}>
          <RotateCcw className="h-3.5 w-3.5" />
          초기화
        </Button>
      </div>
    </header>
  );
}
