/**
 * 팝업 섹션 컴포넌트
 * - openPopup으로 호출되는 팝업 목록 표시
 */
import { PopupInfo } from '@/types';
import { Badge } from '@/components/ui/badge';
import { ExternalLink } from 'lucide-react';

interface PopupSectionProps {
  popups: PopupInfo[];
}

export function PopupSection({ popups }: PopupSectionProps) {
  return (
    <div className="space-y-2 py-2">
      <div className="rounded-md border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">팝업 ID</th>
              <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">URL</th>
              <th className="text-center py-2 px-3 text-xs font-medium text-muted-foreground">크기</th>
            </tr>
          </thead>
          <tbody>
            {popups.map((popup) => (
              <tr key={popup.popupId} className="border-b last:border-b-0">
                <td className="py-2 px-3">
                  <div className="flex items-center gap-1.5">
                    <ExternalLink className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs font-medium">{popup.popupId}</span>
                  </div>
                </td>
                <td className="py-2 px-3">
                  <code className="text-xs font-mono text-primary/70">{popup.popupUrl}</code>
                </td>
                <td className="text-center py-2 px-3">
                  <Badge variant="secondary" className="text-[10px] font-normal">
                    {popup.width} × {popup.height}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
