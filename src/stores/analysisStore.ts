/**
 * 분석 결과 상태 관리 스토어
 * - 파싱된 분석 결과 저장 및 관리
 */
import { create } from 'zustand';
import { AnalysisResult } from '@/types';

interface AnalysisStore {
  /** 파일별 분석 결과 배열 */
  results: AnalysisResult[];
  /** 분석 진행 중 여부 */
  isAnalyzing: boolean;
  /** 분석 결과 설정 */
  setResults: (results: AnalysisResult[]) => void;
  /** 분석 진행 상태 설정 */
  setAnalyzing: (analyzing: boolean) => void;
  /** 화면 이미지 업데이트 (업로드/삭제) */
  updateScreenImage: (filePath: string, dataUrl: string | undefined) => void;
  /** 상태 초기화 */
  reset: () => void;
}

export const useAnalysisStore = create<AnalysisStore>((set) => ({
  results: [],
  isAnalyzing: false,

  setResults: (results) => set({ results }),
  setAnalyzing: (analyzing) => set({ isAnalyzing: analyzing }),
  updateScreenImage: (filePath, dataUrl) =>
    set((s) => ({
      results: s.results.map((r) =>
        r.filePath === filePath ? { ...r, screenImageDataUrl: dataUrl } : r
      ),
    })),
  reset: () => set({ results: [], isAnalyzing: false }),
}));
