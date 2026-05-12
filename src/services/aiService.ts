/**
 * AI 서비스 모듈
 * - GitHub Models API를 통한 자연어 설명 생성
 * - 화면개요, 사용방법 등의 AI 생성 지원
 */
import { AnalysisResult } from '@/types';

/** AI API 요청 메시지 구조 */
interface AiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/** AI API 호출 결과 (응답 텍스트 + 토큰 사용량) */
interface ApiCallResult {
  text: string;
  /** 프록시가 usage 미반환 시 undefined */
  promptTokens?: number;
  completionTokens?: number;
}

/** AI API 호출 로그 엔트리 (외부 콜백용) */
export interface AiCallLog {
  apiCall: string;
  /** 프록시가 usage 미반환 시 undefined → 로그에서 숨김 */
  promptTokens?: number;
  completionTokens?: number;
}

/**
 * AI 호출 옵션
 * - proxyUrl 설정 시 vsCode Extension 프록시 경유
 * - 미설정 시 GitHub Models REST API 직접 호출
 */
export interface ApiCallOptions {
  /** vsCode Extension 프록시 URL (ex: http://localhost:3100) */
  proxyUrl?: string;
  /** 프록시 인증 토큰 (선택) */
  proxyAuthToken?: string;
}

/**
 * GitHub Models API 또는 vsCode Extension 프록시를 통해 AI 응답 생성
 * @param apiKey - GitHub Models API 키 (프록시 모드 시 미사용)
 * @param model  - 모델명
 * @param messages - 대화 메시지 배열
 * @param options  - 프록시 옵션 (proxyUrl 설정 시 프록시 모드)
 */
async function callGitHubModelsApi(
  apiKey: string,
  model: string,
  messages: AiMessage[],
  options?: ApiCallOptions,
): Promise<ApiCallResult> {
  const isProxy = !!options?.proxyUrl;

  const url = isProxy
    ? `${options!.proxyUrl}/v1/chat/completions`
    : 'https://models.github.ai/inference/chat/completions';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (isProxy) {
    if (options!.proxyAuthToken) {
      headers['Authorization'] = `Bearer ${options!.proxyAuthToken}`;
    }
  } else {
    headers['Authorization'] = `Bearer ${apiKey}`;
    headers['Accept'] = 'application/vnd.github+json';
    headers['X-GitHub-Api-Version'] = '2026-03-10';
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AI API 호출 실패: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const usage = data.usage ?? {};
  // OpenAI 호환: prompt_tokens / completion_tokens
  // VS Code Extension 프록시: input_tokens / output_tokens (vscode.LanguageModelUsage)
  const promptToks: number | undefined =
    usage.prompt_tokens ?? usage.input_tokens ?? undefined;
  const completionToks: number | undefined =
    usage.completion_tokens ?? usage.output_tokens ?? undefined;
  return {
    text: data.choices?.[0]?.message?.content || '',
    promptTokens:    (promptToks    !== undefined && promptToks    > 0) ? promptToks    : undefined,
    completionTokens:(completionToks !== undefined && completionToks > 0) ? completionToks : undefined,
  };
}

/**
 * AI를 활용한 화면개요 자연어 설명 생성
 * @param apiKey - API 키
 * @param model - AI 모델명
 * @param result - 분석 결과
 * @returns 화면 개요 설명 (3줄 이내)
 */
export async function generateAiOverview(
  apiKey: string,
  model: string,
  result: AnalysisResult,
  onLog?: (log: AiCallLog) => void,
  options?: ApiCallOptions,
): Promise<string> {
  const messages: AiMessage[] = [
    {
      role: 'system',
      content: '당신은 소프트웨어 사용자 매뉴얼을 작성하는 전문가입니다. 일반 사용자가 이해할 수 있는 쉬운 한국어로 작성해주세요.',
    },
    {
      role: 'user',
      content: `다음은 업무 시스템 화면의 메타정보입니다.
시스템명: ${result.overview.systemName}
부시스템: ${result.overview.subSystem}
프로그램: ${result.overview.programName}
설명: ${result.overview.description}
주요기능: ${result.usage.menuTitleBar.hasInquiry ? '조회' : ''}${result.usage.menuTitleBar.hasNew ? ', 신규' : ''}${result.usage.menuTitleBar.hasSave ? ', 저장' : ''}${result.usage.menuTitleBar.hasDelete ? ', 삭제' : ''}

위 정보를 바탕으로 일반 사용자가 이해할 수 있는 화면 개요를 3줄 이내로 작성해주세요. 간결하고 명확하게 작성하세요.`,
    },
  ];

  const { text, promptTokens, completionTokens } = await callGitHubModelsApi(apiKey, model, messages, options);
  onLog?.({ apiCall: '화면개요 생성', promptTokens, completionTokens });
  return text;
}

/**
 * AI를 활용한 사용방법 Step별 설명 생성
 * @param apiKey - API 키
 * @param model - AI 모델명
 * @param result - 분석 결과
 * @returns 사용방법 설명 텍스트
 */
export async function generateAiUsage(
  apiKey: string,
  model: string,
  result: AnalysisResult,
  onLog?: (log: AiCallLog) => void,
  options?: ApiCallOptions,
): Promise<string> {
  const menu = result.usage.menuTitleBar;

  // 기능 목록 (MenuTitleBar CRUD + 추가 버튼)
  const features: string[] = [];
  if (menu.hasInquiry) features.push('조회');
  if (menu.hasNew) features.push('신규');
  if (menu.hasSave) features.push('저장');
  if (menu.hasDelete) features.push('삭제');
  for (const btn of menu.extButtons) features.push(btn.name);

  // PatisTitleBar 기능 목록 (그리드 타이틀바 저장/삭제 등)
  const titleBarFeatureLines = result.usage.titleBars.flatMap((tb) => {
    const label = tb.title || '상세 정보';
    const feats: string[] = [];
    if (tb.hasNew) feats.push(`  - ${label} 신규`);
    if (tb.hasSave) feats.push(`  - ${label} 저장`);
    if (tb.hasDelete) feats.push(`  - ${label} 삭제`);
    for (const btn of tb.extButtons) feats.push(`  - ${label} - ${btn.name}`);
    return feats;
  });

  // 조회조건 항목 (최대 4개)
  const searchGroups = result.items.conditionGroups.filter((g) => g.groupType === '조회조건');
  const conditionGroups = result.items.conditionGroups.filter((g) => g.groupType === '처리조건');
  const searchConditionLabels = searchGroups
    .flatMap((g) => g.controls.map((c) => c.labelText))
    .filter(Boolean)
    .slice(0, 4)
    .join(', ');
  const conditionLabels = conditionGroups
    .flatMap((g) => g.controls.map((c) => c.labelText))
    .filter(Boolean)
    .slice(0, 4)
    .join(', ');

  // 그리드 정보 (타이틀 + 주요 컬럼 최대 4개)
  const gridLines = result.items.grids
    .filter((g) => g.columns.length > 0)
    .map((g) => {
      const title = g.title || g.gridId;
      const cols = g.columns.slice(0, 4).map((c) => c.headerText).join(', ');
      return `  - ${title}: ${cols}`;
    })
    .join('\n');

  // 필수값 (최대 4개)
  const allRequiredTexts = result.notes.requiredFields.flatMap((f) => f.texts);
  const shownRequiredTexts = allRequiredTexts.slice(0, 4);
  const requiredInfo = shownRequiredTexts.join(', ') +
    (allRequiredTexts.length > 4 ? ` 외 ${allRequiredTexts.length - 4}개` : '');

  // 검증 메시지 (최대 8개)
  const validationMessages = result.notes.validations
    .slice(0, 8)
    .map((v) => `  - ${v.message}`)
    .join('\n');

  // 팝업 정보
  const popupInfo = result.popups
    .map((p) => p.popupUrl.split('/').pop() || p.popupUrl)
    .filter(Boolean)
    .join(', ');

  // 추가 버튼 상세 (검증 메시지에서 버튼 이름과 연관된 메시지 추출)
  const extButtonDetails = menu.extButtons
    .map((btn) => {
      const relatedValidations = result.notes.validations
        .filter((v) => {
          const msg = v.message.replace(/\\n/g, ' ');
          return (
            msg.includes(btn.name) ||
            v.functionName.toLowerCase().includes(`ext${btn.index}`)
          );
        })
        .map((v) => v.message.replace(/\\n/g, ' '))
        .slice(0, 3);
      const detail = relatedValidations.length > 0
        ? ` (관련 검증: ${relatedValidations.join(' / ')})`
        : '';
      return `  - ${btn.name}${detail}`;
    })
    .join('\n');

  // 컨텍스트 조립
  const contextParts: string[] = [
    `화면명: ${result.overview.programName}`,
    `제공 기능(상단 메뉴 타이틀바): ${features.join(', ')}`,
  ];
  if (titleBarFeatureLines.length > 0) {
    contextParts.push(`제공 기능(그리드 타이틀바):\n${titleBarFeatureLines.join('\n')}`);
  }
  if (searchConditionLabels) contextParts.push(`조회조건 항목: ${searchConditionLabels}`);
  if (conditionLabels) contextParts.push(`처리조건 항목: ${conditionLabels}`);
  if (gridLines) contextParts.push(`결과 목록(그리드):\n${gridLines}`);
  if (requiredInfo) contextParts.push(`필수 입력값: ${requiredInfo}`);
  if (validationMessages) contextParts.push(`검증/주의사항:\n${validationMessages}`);
  if (popupInfo) contextParts.push(`팝업 화면: ${popupInfo}`);
  if (extButtonDetails) contextParts.push(`추가 버튼 상세:\n${extButtonDetails}`);

  const messages: AiMessage[] = [
    {
      role: 'system',
      content: `당신은 소프트웨어 사용자 매뉴얼을 작성하는 전문가입니다.
아래 형식에 맞춰 각 기능의 사용방법을 Step별로 작성하세요:
{B}기능 제목{/B}
Step1. 설명
Step2. 설명
...

작성 규칙:
- {B}...{/B} 안의 기능 제목에는 '기능'이라는 단어를 포함하지 마세요. 예: {B}과목 조회{/B}, {B}저장{/B}
- 각 기능당 Step은 3~5개로 작성하세요 (기능 복잡도에 따라 조절)
- 상단 메뉴 타이틀바의 조회: 조회조건 입력 → 조회 버튼 클릭 → 결과 목록 확인 흐름으로 작성
- 상단 메뉴 타이틀바의 신규/저장: 데이터 입력 → 필수값 확인 → 저장 실행 → 완료 확인 흐름으로 작성
- 상단 메뉴 타이틀바의 삭제: 항목 선택 → 삭제 실행 → 확인 메시지 처리 흐름으로 작성
- 그리드 타이틀바 기능은 소제목을 반드시 '{B}타이틀바명 - 기능명{/B}' 형식으로 작성하세요. 단, 신규/저장/삭제는 반드시 '제공 기능(그리드 타이틀바)' 목록에 해당 항목이 명시된 경우에만 작성하고, 목록에 없는 기능은 절대 추가하지 마세요
- 추가 버튼: 사전 선택 조건 → 버튼 클릭 → 실행 결과 확인 흐름으로 작성하고, 관련 검증/주의사항이 있으면 Step에 반영하세요
- 화면에 제공된 조회조건 항목명, 그리드 컬럼명, 검증 메시지를 Step 설명에 직접 활용하세요
- 한국어로 작성하세요`,
    },
    {
      role: 'user',
      content:
        contextParts.join('\n') +
        '\n\n위 정보를 바탕으로 각 기능의 사용방법을 Step별로 구체적으로 작성해주세요.',
    },
  ];

  const { text, promptTokens, completionTokens } = await callGitHubModelsApi(apiKey, model, messages, options);
  onLog?.({ apiCall: '사용방법 생성', promptTokens, completionTokens });

  // ── 후처리 1: 소제목에 남은 '기능' 단어 제거
  let processed = text.replace(/\{B\}([^{]+?)\s+기능\s*\{\/B\}/g, '{B}$1{/B}');

  // ── 후처리 2: 파서 CRUD 플래그와 불일치하는 AI 생성 섹션 제거
  // ex) AI가 "학생 기본 정보 - 신규" 섹션을 생성했으나 tb.hasNew = false → 제거
  const forbiddenSections: string[] = [];
  for (const tb of result.usage.titleBars) {
    const label = (tb.title || '상세 정보').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (!tb.hasNew)    forbiddenSections.push(`\\{B\\}${label}\\s*[-–]\\s*신규\\{/B\\}`);
    if (!tb.hasSave)   forbiddenSections.push(`\\{B\\}${label}\\s*[-–]\\s*저장\\{/B\\}`);
    if (!tb.hasDelete) forbiddenSections.push(`\\{B\\}${label}\\s*[-–]\\s*삭제\\{/B\\}`);
  }
  if (forbiddenSections.length > 0) {
    // 각 금지 소제목 + 이어지는 Step 줄들을 제거
    for (const pattern of forbiddenSections) {
      processed = processed.replace(
        new RegExp(`${pattern}\\n(?:Step\\d+\\.[^\\n]*\\n?)*`, 'g'),
        '',
      );
    }
  }

  return processed;
}

/**
 * AI를 활용한 조회조건/처리조건 항목 설명 생성
 * @param apiKey     - API 키
 * @param model      - AI 모델명
 * @param groupTitle         - 그룹 제목 (조회조건 등)
 * @param controls           - 항목 목록 (항목명, 타입)
 * @param groupType          - '조회조건' | '처리조건'
 * @param transactionFeatures - 캘린 트랜잭션 기능 (저장/삭제/신규 등, 처리조건 전용)
 * @returns 각 항목의 설명 문자열 배열 (순서 보존)
 */
export async function generateAiConditionDescriptions(
  apiKey: string,
  model: string,
  groupTitle: string,
  controls: Array<{ labelText: string; controlType: string; inputType: string }>,
  onLog?: (log: AiCallLog) => void,
  groupType: '조회조건' | '처리조건' | '일괄처리' = '조회조건',
  transactionFeatures: string[] = [],
  options?: ApiCallOptions,
): Promise<string[]> {
  if (controls.length === 0) return [];

  const ctrlList = controls
    .map((ctrl, i) =>
      `${i + 1}. ${ctrl.labelText} (타입: ${ctrl.controlType}, ${ctrl.inputType})`
    )
    .join('\n');

  let systemPrompt: string;
  let userPrompt: string;

  if (groupType === '처리조건') {
    const txList = transactionFeatures.length > 0 ? transactionFeatures.join(', ') : '저장';
    const txParens = transactionFeatures.length > 0
      ? transactionFeatures.map(f => `(${f})`).join('')
      : '(저장)';
    systemPrompt =
      '당신은 업무 시스템 사용자 매뉴얼을 작성하는 전문가입니다. ' +
      '각 처리조건 항목의 설명은 반드시 다음 형식을 따르세요: ' +
      `"선택한 {항목명}에 의해 {업무내용}${txParens}을 진행합니다." ` +
      '업무내용은 항목의 업무적 의미를 간결하게 표현하세요. ' +
      '반드시 "번호. 설명" 형식으로만 응답하세요.';
    userPrompt =
      `"${groupTitle}" 처리조건 항목 목록입니다.\n\n${ctrlList}\n\n` +
      `각 항목을 아래 형식으로 설명해주세요:\n` +
      `"선택한 {{항목명}}에 의해 {{업무내용}}${txParens}을 진행합니다."\n\n` +
      `응답 예시 (주요기능: ${txList}):\n` +
      `1. 선택한 처리구분에 의해 일괄처리${txParens}을 진행합니다.\n` +
      `2. 선택한 대상학기에 의해 데이터 갱신${txParens}을 진행합니다.`;
  } else {
    systemPrompt =
      '당신은 업무 시스템 사용자 매뉴얼을 작성하는 전문가입니다. ' +
      '각 조회조건 항목에 대해 일반 사용자가 이해하기 쉬운 업무적 설명을 한국어 1줄(30자 이내)로 작성하세요. ' +
      '조회 동작과 연결하여 설명하세요. ' +
      '반드시 "번호. 설명" 형식으로만 응답하세요.';
    userPrompt =
      `"${groupTitle}" 조회조건 항목 목록입니다. 각 항목의 업무적 의미를 1줄로 설명해주세요.\n\n${ctrlList}\n\n` +
      `응답 형식 예시:\n1. 조회할 연도와 학기를 선택합니다.\n2. 학생의 학번 또는 성명으로 검색합니다.`;
  }

  const messages: AiMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  const { text: response, promptTokens, completionTokens } = await callGitHubModelsApi(apiKey, model, messages, options);
  onLog?.({ apiCall: `조건항목 설명 생성 (${groupTitle})`, promptTokens, completionTokens });

  const descriptions: string[] = new Array(controls.length).fill('');
  for (const line of response.split('\n')) {
    const numMatch = /^(\d+)\.\s*(.+)$/.exec(line.trim());
    if (numMatch) {
      const idx = parseInt(numMatch[1]) - 1;
      if (idx >= 0 && idx < controls.length) {
        descriptions[idx] = numMatch[2].trim();
      }
    }
  }
  return descriptions;
}

/**
 * AI를 활용한 그리드 컬럼별 설명 자연어 생성
 * @param apiKey    - API 키
 * @param model     - AI 모델명
 * @param gridTitle - 그리드 타이틀
 * @param columns   - 컬럼 목록 (항목명, 타입, 용도)
 * @returns 각 컬럼의 설명 문자열 배열 (순서 보존)
 */
export async function generateAiColumnDescriptions(
  apiKey: string,
  model: string,
  gridTitle: string,
  columns: Array<{ headerText: string; controlType: string; purpose: string }>,
  onLog?: (log: AiCallLog) => void,
  options?: ApiCallOptions,
): Promise<string[]> {
  if (columns.length === 0) return [];

  const colList = columns
    .map((col, i) =>
      `${i + 1}. ${col.headerText} (타입: ${col.controlType}, 용도: ${col.purpose})`
    )
    .join('\n');

  const messages: AiMessage[] = [
    {
      role: 'system',
      content:
        '당신은 업무 시스템 사용자 매뉴얼을 작성하는 전문가입니다. ' +
        '각 항목에 대해 일반 사용자가 이해하기 쉬운 업무적 설명을 한국어 1줄(30자 이내)로 작성하세요. ' +
        '반드시 "번호. 설명" 형식으로만 응답하세요.',
    },
    {
      role: 'user',
      content: `"${gridTitle}" 화면의 항목 목록입니다. 각 항목의 업무적 의미를 1줄로 설명해주세요.\n\n${colList}\n\n응답 형식 예시:\n1. 해당 연도의 등록 학기를 표시합니다.\n2. 수업료 납부 금액입니다.`,
    },
  ];

  const { text: response, promptTokens, completionTokens } = await callGitHubModelsApi(apiKey, model, messages, options);
  onLog?.({ apiCall: `컬럼 설명 생성 (${gridTitle})`, promptTokens, completionTokens });

  // "번호. 설명" 형식 파싱
  const descriptions: string[] = new Array(columns.length).fill('');
  for (const line of response.split('\n')) {
    const numMatch = /^(\d+)\.\s*(.+)$/.exec(line.trim());
    if (numMatch) {
      const idx = parseInt(numMatch[1]) - 1;
      if (idx >= 0 && idx < columns.length) {
        descriptions[idx] = numMatch[2].trim();
      }
    }
  }
  return descriptions;
}

/**
 * AI를 활용한 참고사항 주의메시지 사용자 친화적 설명 생성
 * @param apiKey - API 키
 * @param model - AI 모델명
 * @param programName - 화면명
 * @param warnings - 그룹 라벨 → 원본 메시지 배열 매핑
 * @returns 그룹 라벨 → 친화적 설명 배열 매핑
 */
export async function generateAiNotes(
  apiKey: string,
  model: string,
  programName: string,
  warnings: Array<{ label: string; messages: string[] }>,
  onLog?: (log: AiCallLog) => void,
  options?: ApiCallOptions,
): Promise<Map<string, string[]>> {
  if (warnings.length === 0) return new Map();

  // 번호화된 메시지 목록 구성
  let msgIndex = 0;
  const indexedLines: string[] = [];
  const indexMap: Array<{ label: string; count: number; startIdx: number }> = [];

  for (const group of warnings) {
    const startIdx = msgIndex;
    for (const msg of group.messages) {
      msgIndex++;
      indexedLines.push(`${msgIndex}. [${group.label}] ${msg}`);
    }
    indexMap.push({ label: group.label, count: group.messages.length, startIdx });
  }

  const messages: AiMessage[] = [
    {
      role: 'system',
      content:
        '당신은 업무 시스템 사용자 매뉴얼을 작성하는 전문가입니다.\n' +
        '각 주의사항은 시스템 내부 알림 메시지입니다. 이를 일반 사용자 관점의 행동 지침 또는 업무 규칙 안내 문장으로 변환하세요.\n\n' +
        '변환 원칙:\n' +
        '1. "~하십시오 / ~바랍니다" 형태 → 사용자가 해야 할 행동을 구체적으로 안내\n' +
        '   예: "개설년도를 선택하시기 바랍니다." → "기능을 실행하기 전에 개설년도를 먼저 선택해야 합니다."\n' +
        '2. "~기간이 아닙니다 / ~할 수 없습니다" 형태 → 업무 규칙을 명시\n' +
        '   예: "반변경기간이 아닙니다." → "반 변경은 지정된 반 변경 기간에만 처리할 수 있습니다."\n' +
        '3. "~이 존재합니다 / ~이 있습니다" 형태 → 처리 전 확인 사항으로 안내\n' +
        '   예: "작성 중인 자료가 존재합니다." → "미저장 데이터가 있습니다. 저장 후 다시 시도하세요."\n' +
        '4. 오류 코드나 시스템 내부 용어는 업무 용어로 바꾸세요.\n' +
        '5. 각 설명은 1~2문장(50자 이내)으로 명확하게 작성하세요.\n' +
        '6. 반드시 "번호. 설명" 형식으로만 응답하세요.',
    },
    {
      role: 'user',
      content:
        `화면명: ${programName}\n\n주의사항 목록:\n${indexedLines.join('\n')}\n\n` +
        '각 항목을 사용자가 이해하기 쉬운 행동 지침 또는 업무 규칙 안내 문장으로 변환해주세요.',
    },
  ];

  const { text, promptTokens, completionTokens } = await callGitHubModelsApi(apiKey, model, messages, options);
  onLog?.({ apiCall: '참고사항 설명 생성', promptTokens, completionTokens });

  // "번호. 설명" 형식 파싱 → 그룹별 매핑 복원
  const allDescriptions: string[] = new Array(msgIndex).fill('');
  for (const line of text.split('\n')) {
    const m = /^(\d+)\.\s*(.+)$/.exec(line.trim());
    if (m) {
      const idx = parseInt(m[1]) - 1;
      if (idx >= 0 && idx < msgIndex) {
        allDescriptions[idx] = m[2].trim();
      }
    }
  }

  const result = new Map<string, string[]>();
  let offset = 0;
  for (const { label, count } of indexMap) {
    const descs = allDescriptions.slice(offset, offset + count).map((d, i) =>
      d || warnings[indexMap.findIndex((x) => x.label === label)].messages[i]
    );
    result.set(label, descs);
    offset += count;
  }
  return result;
}
