/**
 * 화면개요 섹션 컴포넌트
 * - 시스템명, 부시스템, 프로그램명, 설명 표시
 */
import { OverviewInfo } from '@/types';
import { Separator } from '@/components/ui/separator';

interface OverviewSectionProps {
  overview: OverviewInfo;
}

export function OverviewSection({ overview }: OverviewSectionProps) {
  return (
    <div className="space-y-2 py-2">
      <div className="grid grid-cols-[80px_1fr] gap-y-2 text-sm">
        <InfoRow label="시스템명" value={overview.systemName} />
        <InfoRow label="부시스템" value={overview.subSystem} />
        <InfoRow label="프로그램" value={overview.programName} />
      </div>
      <Separator />
      <div className="grid grid-cols-[80px_1fr] gap-y-2 text-sm">
        <InfoRow label="설명" value={overview.description} />
        {overview.author && <InfoRow label="작성자" value={overview.author} />}
        {overview.createDate && <InfoRow label="작성일자" value={overview.createDate} />}
      </div>
    </div>
  );
}

/** 정보 행 컴포넌트 */
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className="text-sm text-foreground">{value || '-'}</span>
    </>
  );
}
