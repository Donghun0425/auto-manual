/**
 * 참고사항 섹션 컴포넌트
 * - 필수값 정보 표시
 * - 검증 로직(Alert 메시지) 표시
 */
import { RequiredFieldInfo, ValidationInfo } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle } from 'lucide-react';

interface NotesSectionProps {
  notes: {
    requiredFields: RequiredFieldInfo[];
    validations: ValidationInfo[];
  };
}

export function NotesSection({ notes }: NotesSectionProps) {
  return (
    <div className="space-y-4 py-2">
      {/* 필수값 정보 */}
      {notes.requiredFields.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            필수값
          </h4>
          {notes.requiredFields.map((field, idx) => (
            <div key={idx} className="space-y-1.5">
              <code className="text-xs font-mono text-primary/80">
                [{field.targetId}]
              </code>
              <div className="flex flex-wrap gap-1.5">
                {field.texts.map((text, i) => (
                  <Badge key={i} variant="secondary" className="text-xs font-normal">
                    {text}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {notes.requiredFields.length > 0 && notes.validations.length > 0 && (
        <Separator />
      )}

      {/* 검증 로직 (Alert 메시지) */}
      {notes.validations.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            검증 로직
          </h4>
          <ul className="space-y-1.5">
            {notes.validations.map((v, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <code className="text-[10px] font-mono text-muted-foreground">
                    {v.functionName}
                  </code>
                  <p className="text-sm text-foreground/80">{v.message}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
