/**
 * 메인 페이지
 * - 파일 업로드, 파일 트리, 매뉴얼 생성 옵션 통합
 */
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileUploader } from '@/components/upload/FileUploader';
import { FileTree } from '@/components/tree/FileTree';
import { useFileStore } from '@/stores/fileStore';
import { useAnalysisStore } from '@/stores/analysisStore';
import { useManualStore } from '@/stores/manualStore';
import { analyzeFiles } from '@/parser';
import { generateHtml } from '@/generators/htmlGenerator';
import { generateMarkdown } from '@/generators/markdownGenerator';
import { generateAiOverview, generateAiUsage, generateAiNotes, generateAiColumnDescriptions, generateAiConditionDescriptions, AiCallLog } from '@/services/aiService';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { FileText, Sparkles, Key, Loader2, Terminal, Info, Zap, AlertCircle, CheckCircle2 } from 'lucide-react';

interface LogEntry {
  id: number;
  time: string;
  message: string;
  type: 'info' | 'api' | 'error' | 'success';
  promptTokens?: number;
  completionTokens?: number;
}

export function MainPage() {
  const navigate = useNavigate();
  const files = useFileStore((s) => s.files);
  const getCheckedFiles = useFileStore((s) => s.getCheckedFiles);
  const { setResults, setAnalyzing, isAnalyzing } = useAnalysisStore();
  const { useAi, toggleAi, aiModel, setAiModel, apiKey, setApiKey, setOutputs, setGenerating } =
    useManualStore();

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logIdRef = useRef(0);
  const logEndRef = useRef<HTMLDivElement>(null);

  const addLog = (entry: Omit<LogEntry, 'id' | 'time'>) => {
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    setLogs((prev) => [...prev, { ...entry, id: logIdRef.current++, time }]);
  };

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  /**
   * 매뉴얼 생성 처리
   * 1. 선택된 파일 분석
   * 2. (선택 시) AI로 자연어 설명 생성
   * 3. HTML/Markdown 매뉴얼 생성
   * 4. 결과 페이지로 이동
   */
  const handleGenerate = async () => {
    const checkedPaths = getCheckedFiles();
    if (checkedPaths.length === 0) {
      alert('매뉴얼을 생성할 파일을 선택해주세요.');
      return;
    }

    setLogs([]);
    setAnalyzing(true);
    setGenerating(true);
    addLog({ type: 'info', message: `${checkedPaths.length}개 파일 분석 시작` });

    try {
      // 선택된 파일의 내용 수집
      const fileData = checkedPaths
        .map((path) => ({ path, content: files.get(path) || '' }))
        .filter((f) => f.content.length > 0);

      // 파싱 분석 수행
      const results = analyzeFiles(fileData);
      addLog({ type: 'success', message: `파싱 완료: ${results.length}개 파일` });

      // AI 활용 시 추가 처리
      if (useAi && apiKey) {
        addLog({ type: 'info', message: `AI 처리 시작 (${results.length}개 파일)` });
        for (const result of results) {
          try {
            const programName = result.overview.programName || result.filePath.replace(/.*[\\/]/, '');
            addLog({ type: 'info', message: `처리 중: ${programName}` });

            const onLog = (log: AiCallLog) =>
              addLog({ type: 'api', message: log.apiCall, promptTokens: log.promptTokens, completionTokens: log.completionTokens });

            const aiOverview = await generateAiOverview(apiKey, aiModel, result, onLog);
            if (aiOverview) {
              result.overview.description = aiOverview;
            }
            const aiUsage = await generateAiUsage(apiKey, aiModel, result, onLog);
            if (aiUsage) {
              result.aiUsageText = aiUsage;
            }

            // 조건그룹 항목별 AI 설명 생성
            const menu = result.usage.menuTitleBar;
            const txFeatures: string[] = [];
            if (menu.hasNew) txFeatures.push('신규');
            if (menu.hasSave) txFeatures.push('저장');
            if (menu.hasDelete) txFeatures.push('삭제');
            for (const btn of menu.extButtons) txFeatures.push(btn.name);

            for (const group of result.items.conditionGroups) {
              if (group.controls.length > 0) {
                const descs = await generateAiConditionDescriptions(
                  apiKey, aiModel,
                  `${result.overview.programName} - ${group.groupType}`,
                  group.controls,
                  onLog,
                  group.groupType,
                  group.groupType === '처리조건' ? txFeatures : [],
                );
                group.controls.forEach((ctrl, i) => {
                  ctrl.description = descs[i] ?? '';
                });
              }
            }

            // 그리드 컬럼별 AI 설명 생성 (고정 설명이 있는 그리드는 제외)
            for (const grid of result.items.grids) {
              if (grid.columns.length > 0 && !grid.skipAiDescriptions) {
                const descs = await generateAiColumnDescriptions(
                  apiKey, aiModel, grid.title || grid.gridId, grid.columns, onLog
                );
                grid.columns.forEach((col, i) => {
                  col.description = descs[i] ?? '';
                });
              }
            }

            // 참고사항 주의메시지 AI 친화적 설명 생성
            const COMPLETION_RE = /^(?:처리|저장|삭제|등록|수정|복사|생성|변경|갱신|적용|실행)[^\n]*?(?:되었습니다|했습니다|하였습니다)[.!]?\s*$/;
            const noteVals = result.notes.validations
              .filter(v => !/inq|inquiry|search|save|del/i.test(v.functionName))
              .filter(v => !COMPLETION_RE.test(v.message.trim()));
            if (noteVals.length > 0) {
              const funcLabelMap = new Map<string, string>();
              for (const btn of result.usage.extraButtons) funcLabelMap.set(btn.functionName, btn.name);
              for (const tb of result.usage.titleBars) {
                const tbLabel = tb.title || '상세 정보';
                for (const btn of tb.extButtons) funcLabelMap.set(btn.functionName, `${tbLabel} - ${btn.name}`);
              }
              const groupsForAi: Array<{ label: string; messages: string[] }> = [];
              const tempGroups = new Map<string, string[]>();
              for (const v of noteVals) {
                const btnLabel = funcLabelMap.get(v.functionName);
                const label = btnLabel ? `${btnLabel} 실행 전 확인사항` : '기타 주의사항';
                if (!tempGroups.has(label)) tempGroups.set(label, []);
                tempGroups.get(label)!.push(v.message);
              }
              for (const [label, messages] of tempGroups) {
                groupsForAi.push({ label, messages });
              }
              const aiNotesMap = await generateAiNotes(
                apiKey, aiModel, result.overview.programName, groupsForAi, onLog
              );
              result.aiNotesDescriptions = aiNotesMap;
            }
          } catch (err) {
            addLog({ type: 'error', message: `AI 오류: ${err instanceof Error ? err.message : String(err)}` });
            console.error('AI 생성 중 오류:', err);
          }
        }
      }

      setResults(results);

      // 매뉴얼 생성 (HTML + Markdown)
      addLog({ type: 'info', message: 'HTML/Markdown 문서 생성 중...' });
      const outputs = results.map((result) => ({
        filePath: result.filePath,
        html: generateHtml(result),
        markdown: generateMarkdown(result),
      }));
      setOutputs(outputs);

      addLog({ type: 'success', message: '매뉴얼 생성 완료! 결과 페이지로 이동합니다.' });

      // 결과 페이지로 이동
      navigate('/result');
    } catch (err) {
      addLog({ type: 'error', message: `오류: ${err instanceof Error ? err.message : String(err)}` });
      console.error('매뉴얼 생성 중 오류:', err);
      alert('매뉴얼 생성 중 오류가 발생했습니다.');
    } finally {
      setAnalyzing(false);
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      {/* 파일 업로드 영역 */}
      {/* 파일 업로드 영역 */}
      <FileUploader />

      {/* 파일 트리 영역 */}
      <FileTree />

      {/* 매뉴얼 생성 옵션 영역 */}
      <Card>
        <CardHeader>
          <CardTitle>매뉴얼 생성 옵션</CardTitle>
          <CardDescription>
            AI를 활용하면 자연어 기반의 풍부한 매뉴얼을 생성할 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* AI 사용 토글 */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-3">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <div>
                <p className="text-sm font-medium">AI 활용 생성</p>
                <p className="text-xs text-muted-foreground">
                  GitHub Models API를 통해 자연어 설명을 자동 생성합니다.
                </p>
              </div>
            </div>
            <Switch checked={useAi} onCheckedChange={toggleAi} />
          </div>

          {/* AI 옵션 (AI 사용 시에만 표시) */}
          {useAi && (
            <div className="space-y-3 rounded-lg border border-dashed p-4 bg-muted/30">
              {/* AI 모델 선택 */}
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium w-20 shrink-0">모델</label>
                <Select value={aiModel} onValueChange={setAiModel}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                    <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                    <SelectItem value="gpt-4.1-mini">GPT-4.1 Mini</SelectItem>
                    <SelectItem value="gpt-4.1">GPT-4.1</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* API Key 입력 */}
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium w-20 shrink-0">
                  <Key className="h-3 w-3 inline mr-1" />
                  API Key
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="GitHub Models API Key를 입력하세요"
                  className="flex-1 h-8 rounded-md border border-input bg-background px-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
            </div>
          )}

          <Separator />

          {/* 매뉴얼 생성 버튼 */}
          <Button
            onClick={handleGenerate}
            disabled={isAnalyzing}
            size="lg"
            className="w-full"
          >
            {isAnalyzing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
            {isAnalyzing ? '분석 중...' : '매뉴얼 생성'}
          </Button>
        </CardContent>
      </Card>

      {/* 처리 로그 */}
      {logs.length > 0 && (
        <Card>
          <CardHeader className="py-3 px-4 pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Terminal className="h-3.5 w-3.5" />
              처리 로그
              {(() => {
                const totalIn = logs.reduce((s, l) => s + (l.promptTokens ?? 0), 0);
                const totalOut = logs.reduce((s, l) => s + (l.completionTokens ?? 0), 0);
                if (totalIn > 0)
                  return (
                    <span className="ml-auto font-normal text-xs text-muted-foreground">
                      총 입력 {totalIn.toLocaleString()} / 출력 {totalOut.toLocaleString()} 토큰
                    </span>
                  );
                if (isAnalyzing)
                  return <Loader2 className="h-3 w-3 animate-spin ml-auto" />;
                return null;
              })()}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-y-auto max-h-52 px-4 py-2 bg-muted/40 rounded-b-lg space-y-0.5 font-mono">
              {logs.map((entry) => (
                <div key={entry.id} className="flex items-start gap-2 text-xs py-0.5">
                  <span className="text-muted-foreground shrink-0 tabular-nums">{entry.time}</span>
                  {entry.type === 'info' && <Info className="h-3 w-3 text-blue-500 mt-0.5 shrink-0" />}
                  {entry.type === 'api' && <Zap className="h-3 w-3 text-amber-500 mt-0.5 shrink-0" />}
                  {entry.type === 'error' && <AlertCircle className="h-3 w-3 text-red-500 mt-0.5 shrink-0" />}
                  {entry.type === 'success' && <CheckCircle2 className="h-3 w-3 text-green-500 mt-0.5 shrink-0" />}
                  <span className="flex-1 break-all">{entry.message}</span>
                  {entry.promptTokens !== undefined && (
                    <span className="text-muted-foreground shrink-0 tabular-nums">
                      ↑{entry.promptTokens} ↓{entry.completionTokens}
                    </span>
                  )}
                </div>
              ))}
              <div ref={logEndRef} />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
