import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  hint?: string;
  className?: string;
}

/** État vide homogène pour les tableaux et listes. */
export function EmptyState({ icon: Icon, title, hint, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-10 text-center', className)}>
      {Icon && (
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary/70">
          <Icon className="h-7 w-7" />
        </div>
      )}
      <div className="space-y-0.5">
        <p className="text-sm font-medium text-foreground/80">{title}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
    </div>
  );
}
