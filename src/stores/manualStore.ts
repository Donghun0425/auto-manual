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
  /** GitHub Model API 사용 여부 */
  useAi: boolean;
  /** AI 모델 선택 */
  aiModel: string;
  /** GitHub Models AI API 키 */
  apiKey: string;
  /** vsCode Extension 프록시 사용 여부 */
  useVsCodeProxy: boolean;
  /** 프록시 서버 URL */
  proxyUrl: string;
  /** 프록시 인증 토큰 (선택) */
  proxyAuthToken: string;
  /** 생성 진행 중 여부 */
  isGenerating: boolean;
  /** 매뉴얼 출력 설정 */
  setOutputs: (outputs: ManualOutput[]) => void;
  /** 특정 파일의 매뉴얼 출력 업데이트 */
  updateOutput: (filePath: string, html: string, markdown: string) => void;
  /** GitHub Model AI 사용 여부 토글 (활성화 시 프록시 비활성) */
  toggleAi: () => void;
  /** vsCode Extension 프록시 토글 (활성화 시 AI 비활성) */
  toggleVsCodeProxy: () => void;
  /** AI 모델 설정 */
  setAiModel: (model: string) => void;
  /** API 키 설정 */
  setApiKey: (key: string) => void;
  /** 프록시 URL 설정 */
  setProxyUrl: (url: string) => void;
  /** 프록시 인증 토큰 설정 */
  setProxyAuthToken: (token: string) => void;
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
  useVsCodeProxy: false,
  proxyUrl: localStorage.getItem('proxy_url') || 'http://localhost:3100',
  proxyAuthToken: '',
  isGenerating: false,

  setOutputs: (outputs) => set({ outputs }),
  updateOutput: (filePath, html, markdown) =>
    set((s) => ({
      outputs: s.outputs.map((o) =>
        o.filePath === filePath ? { ...o, html, markdown } : o
      ),
    })),
  // 활성화 시 vsCode 프록시 비활성
  toggleAi: () => set((s) => ({
    useAi: !s.useAi,
    ...(!s.useAi ? { useVsCodeProxy: false } : {}),
  })),
  // 활성화 시 GitHub Model AI 비활성
  toggleVsCodeProxy: () => set((s) => ({
    useVsCodeProxy: !s.useVsCodeProxy,
    ...(!s.useVsCodeProxy ? { useAi: false } : {}),
  })),
  setAiModel: (model) => set({ aiModel: model }),
  setApiKey: (key) => {
    localStorage.setItem('ai_api_key', key);
    set({ apiKey: key });
  },
  setProxyUrl: (url) => {
    localStorage.setItem('proxy_url', url);
    set({ proxyUrl: url });
  },
  setProxyAuthToken: (token) => set({ proxyAuthToken: token }),
  setGenerating: (generating) => set({ isGenerating: generating }),
  reset: () => set({ outputs: [], isGenerating: false }),
}));
