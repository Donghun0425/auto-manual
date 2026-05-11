/**
 * 매뉴얼 생성 상태 관리 스토어
 * - 생성된 매뉴얼 HTML/Markdown 저장
 * - AI 사용 여부 관리
 */
import { create } from 'zustand';
import { ManualOutput } from '@/types';

interface ManualStore {
  /** 생성된 매뉴얼 출력 배열 */
  outputs: ManualOutput[];
  /** AI 사용 여부 */
  useAi: boolean;
  /** AI 모델 선택 */
  aiModel: string;
  /** AI API 키 */
  apiKey: string;
  /** 생성 진행 중 여부 */
  isGenerating: boolean;
  /** 매뉴얼 출력 설정 */
  setOutputs: (outputs: ManualOutput[]) => void;
  /** 특정 파일의 매뉴얼 출력 업데이트 */
  updateOutput: (filePath: string, html: string, markdown: string) => void;
  /** AI 사용 여부 토글 */
  toggleAi: () => void;
  /** AI 모델 설정 */
  setAiModel: (model: string) => void;
  /** API 키 설정 */
  setApiKey: (key: string) => void;
  /** 생성 진행 상태 설정 */
  setGenerating: (generating: boolean) => void;
  /** 상태 초기화 */
  reset: () => void;
}

export const useManualStore = create<ManualStore>((set) => ({
  outputs: [],
  useAi: false,
  aiModel: 'openai/gpt-4o-mini',
  apiKey: localStorage.getItem('ai_api_key') || '',
  isGenerating: false,

  setOutputs: (outputs) => set({ outputs }),
  updateOutput: (filePath, html, markdown) =>
    set((s) => ({
      outputs: s.outputs.map((o) =>
        o.filePath === filePath ? { ...o, html, markdown } : o
      ),
    })),
  toggleAi: () => set((s) => ({ useAi: !s.useAi })),
  setAiModel: (model) => set({ aiModel: model }),
  setApiKey: (key) => {
    localStorage.setItem('ai_api_key', key);
    set({ apiKey: key });
  },
  setGenerating: (generating) => set({ isGenerating: generating }),
  reset: () => set({ outputs: [], isGenerating: false }),
}));
