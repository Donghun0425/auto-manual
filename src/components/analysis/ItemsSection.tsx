/**
 * 항목 섹션 컴포넌트
 * - 조회조건/처리조건 그룹 표시
 * - 그리드 정보 표시 (타이틀 + 컬럼 목록)
 */
import { GridInfo, ConditionGroupInfo, InfoGroupInfo } from '@/types';
import { Badge } from '@/components/ui/badge';

interface ItemsSectionProps {
  items: {
    conditionGroups: ConditionGroupInfo[];
    infoGroups: InfoGroupInfo[];
    grids: GridInfo[];
  };
}

export function ItemsSection({ items }: ItemsSectionProps) {
  const hasContent = items.conditionGroups.length > 0 || items.infoGroups.length > 0 || items.grids.length > 0;
  if (!hasContent) return null;

  return (
    <div className="space-y-5 py-2">
      {/* 조회조건/처리조건 그룹 */}
      {items.conditionGroups.map((group) => (
        <div key={group.groupId} className="space-y-2">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold">
              {group.title ?? group.groupType}
            </h4>
            <span className="text-xs text-muted-foreground">({group.groupId})</span>
          </div>
          {group.controls.length > 0 ? (
            <div className="rounded-md border overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left py-1.5 px-3 font-medium text-muted-foreground w-28">항목명</th>
                    <th className="text-left py-1.5 px-3 font-medium text-muted-foreground">설명</th>
                    <th className="text-left py-1.5 px-3 font-medium text-muted-foreground w-24">타입</th>
                    <th className="text-left py-1.5 px-3 font-medium text-muted-foreground w-24">용도</th>
                  </tr>
                </thead>
                <tbody>
                  {group.controls.map((ctrl, idx) => (
                    <tr key={idx} className="border-b last:border-b-0 hover:bg-muted/30">
                      <td className="py-1.5 px-3 font-medium">{ctrl.labelText || ctrl.controlId}</td>
                      <td className="py-1.5 px-3 text-muted-foreground">{ctrl.description || '-'}</td>
                      <td className="py-1.5 px-3">
                        <code className="text-[10px] font-mono text-primary/70">{ctrl.controlType}</code>
                      </td>
                      <td className="py-1.5 px-3">
                        <InputTypeBadge inputType={ctrl.inputType} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">항목 없음</p>
          )}
        </div>
      ))}

      {/* INFOGROUP (세부정보 입력 그룹) */}
      {items.infoGroups.map((group) => (
        <div key={group.groupId} className="space-y-2">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold">
              {group.title ?? group.groupId}
            </h4>
            <span className="text-xs text-muted-foreground">({group.groupId})</span>
          </div>
          {group.controls.length > 0 ? (
            <div className="rounded-md border overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left py-1.5 px-3 font-medium text-muted-foreground w-28">항목명</th>
                    <th className="text-left py-1.5 px-3 font-medium text-muted-foreground">설명</th>
                    <th className="text-left py-1.5 px-3 font-medium text-muted-foreground w-24">타입</th>
                    <th className="text-left py-1.5 px-3 font-medium text-muted-foreground w-24">용도</th>
                  </tr>
                </thead>
                <tbody>
                  {group.controls.map((ctrl, idx) => (
                    <tr key={idx} className="border-b last:border-b-0 hover:bg-muted/30">
                      <td className="py-1.5 px-3 font-medium">{ctrl.labelText || ctrl.controlId}</td>
                      <td className="py-1.5 px-3 text-muted-foreground">{ctrl.description || '-'}</td>
                      <td className="py-1.5 px-3">
                        <code className="text-[10px] font-mono text-primary/70">{ctrl.controlType}</code>
                      </td>
                      <td className="py-1.5 px-3">
                        <InputTypeBadge inputType={ctrl.inputType} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">항목 없음</p>
          )}
        </div>
      ))}

      {/* 그리드 */}
      {items.grids.map((grid) => (
        <div key={grid.gridId} className="space-y-2">
          {/* 그리드 타이틀 */}
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold">
              {grid.title || grid.gridId}
            </h4>
            <code className="text-[10px] font-mono text-muted-foreground bg-muted px-1 py-0.5 rounded">
              {grid.gridId}
            </code>
            {grid.hasState && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">상태</Badge>
            )}
            {grid.hasCheckbox && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">체크</Badge>
            )}
            {grid.hasRowNumber && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">행번호</Badge>
            )}
            {grid.sortable && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">정렬</Badge>
            )}
          </div>

          {/* 컬럼 목록 테이블 */}
          {grid.columns.length > 0 ? (
            <div className="rounded-md border overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left py-1.5 px-3 font-medium text-muted-foreground w-28">항목명</th>
                    <th className="text-left py-1.5 px-3 font-medium text-muted-foreground">설명</th>
                    <th className="text-left py-1.5 px-3 font-medium text-muted-foreground w-24">타입</th>
                    <th className="text-left py-1.5 px-3 font-medium text-muted-foreground w-24">용도</th>
                  </tr>
                </thead>
                <tbody>
                  {grid.columns.map((col, idx) => (
                    <tr key={idx} className="border-b last:border-b-0 hover:bg-muted/30">
                      <td className="py-1.5 px-3 font-medium">{col.headerText}</td>
                      <td className="py-1.5 px-3 text-muted-foreground">{col.description || '-'}</td>
                      <td className="py-1.5 px-3">
                        <code className="text-[10px] font-mono text-primary/70">{col.controlType}</code>
                      </td>
                      <td className="py-1.5 px-3">
                        <PurposeBadge purpose={col.purpose} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">컬럼 정보 없음</p>
          )}
        </div>
      ))}
    </div>
  );
}

/** 입력여부 배지 */
function InputTypeBadge({ inputType }: { inputType: '입력' | '표시' }) {
  if (inputType === '입력') {
    return <Badge variant="default" className="text-[10px] px-1.5 py-0">입력 또는 선택</Badge>;
  }
  return <Badge variant="secondary" className="text-[10px] px-1.5 py-0">표시</Badge>;
}

/** 용도 배지 */
function PurposeBadge({ purpose }: { purpose: '표시' | '입력' | '표시 또는 입력' }) {
  if (purpose === '표시') {
    return <Badge variant="secondary" className="text-[10px] px-1.5 py-0">표시</Badge>;
  }
  if (purpose === '입력') {
    return <Badge variant="default" className="text-[10px] px-1.5 py-0">입력</Badge>;
  }
  return <Badge variant="outline" className="text-[10px] px-1.5 py-0">표시/입력</Badge>;
}
