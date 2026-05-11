/**
 * 사용방법 섹션 컴포넌트
 * - PatisMenuTitleBar CRUD 기능 표시
 * - PatisTitleBar CRUD 기능 표시
 * - 기타 버튼 표시
 */
import { CrudInfo, ExtButtonInfo } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Check, X } from 'lucide-react';

interface UsageSectionProps {
  usage: {
    menuTitleBar: CrudInfo;
    titleBars: CrudInfo[];
    extraButtons: ExtButtonInfo[];
  };
}

export function UsageSection({ usage }: UsageSectionProps) {
  return (
    <div className="space-y-4 py-2">
      {/* PatisMenuTitleBar */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          PatisMenuTitleBar
        </h4>
        <CrudInfoDisplay crud={usage.menuTitleBar} />
      </div>

      {/* PatisTitleBar (복수) */}
      {usage.titleBars.length > 0 && (
        <>
          <Separator />
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              PatisTitleBar
            </h4>
            {usage.titleBars.map((tb, idx) => (
              <div key={idx} className="space-y-2">
                <CrudInfoDisplay crud={tb} />
                {tb.extButtons.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {tb.extButtons.map((btn) => (
                      <Badge key={btn.index} variant="outline" className="text-xs font-normal">
                        {btn.name}
                        <span className="ml-1 text-muted-foreground">({btn.functionName})</span>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* 추가 버튼 */}
      {usage.menuTitleBar.extButtons.length > 0 && (
        <>
          <Separator />
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              추가 버튼
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {usage.menuTitleBar.extButtons.map((btn) => (
                <Badge key={btn.index} variant="outline" className="text-xs font-normal">
                  {btn.name}
                  <span className="ml-1 text-muted-foreground">({btn.functionName})</span>
                </Badge>
              ))}
            </div>
          </div>
        </>
      )}

      {/* 기타 버튼 */}
      {usage.extraButtons.length > 0 && (
        <>
          <Separator />
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              기타 버튼
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {usage.extraButtons.map((btn) => (
                <Badge key={btn.index} variant="secondary" className="text-xs font-normal">
                  {btn.name}
                </Badge>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/** CRUD 정보 표시 서브 컴포넌트 */
function CrudInfoDisplay({ crud }: { crud: CrudInfo }) {
  const items = [
    { label: '조회', active: crud.hasInquiry },
    { label: '신규', active: crud.hasNew },
    { label: '저장', active: crud.hasSave },
    { label: '삭제', active: crud.hasDelete },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <Badge
          key={item.label}
          variant={item.active ? 'default' : 'secondary'}
          className={`gap-1 ${!item.active ? 'opacity-40' : ''}`}
        >
          {item.active ? (
            <Check className="h-2.5 w-2.5" />
          ) : (
            <X className="h-2.5 w-2.5" />
          )}
          {item.label}
        </Badge>
      ))}
    </div>
  );
}
