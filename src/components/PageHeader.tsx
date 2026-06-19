import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatItem {
  label: string;
  value: string | number;
  icon?: ReactNode;
  color?: string;
  trend?: 'up' | 'down' | 'neutral';
}

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  gradient?: string;
  iconColor?: string;
  stats?: StatItem[];
  actions?: ReactNode;
  className?: string;
}

export default function PageHeader({
  title,
  description,
  icon: Icon,
  gradient = 'from-blue-500/[0.16] via-cyan-400/[0.12] to-rose-400/10',
  iconColor = 'from-blue-700 via-cyan-600 to-rose-600',
  stats,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn(
      'relative overflow-hidden rounded-3xl border border-border/60 bg-card/95 shadow-md shadow-primary/5 mb-6',
      className
    )}>
      {/* Gradient de fond */}
      <div className={cn('dopamine-gradient absolute inset-0 bg-gradient-to-br opacity-80', gradient)} />

      {/* Motif de points discret */}
      <div className="absolute inset-0 opacity-[0.025] dark:opacity-[0.04] bg-dot-pattern" />

      {/* Ligne décorative haute */}
      <div className="absolute -right-10 -top-12 h-32 w-32 rounded-full bg-cyan-400/20 blur-2xl dopamine-orb" />
      <div className="absolute -bottom-16 left-1/3 h-36 w-36 rounded-full bg-rose-400/15 blur-2xl dopamine-orb [animation-delay:1.4s]" />

      {/* Contenu */}
      <div className="relative p-4 sm:p-5 md:p-7">
        {/* Titre + actions */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-5">
          <div className="flex items-center gap-3 sm:gap-4">
            {Icon && (
              <div className="relative flex-shrink-0">
                <div className={cn('absolute inset-0 bg-gradient-to-br rounded-2xl blur-xl opacity-35 dopamine-glow', iconColor)} />
                <div className={cn('dopamine-gradient relative bg-gradient-to-br p-2.5 sm:p-3 rounded-2xl shadow-md shadow-cyan-500/20', iconColor)}>
                  <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-foreground leading-tight truncate">
                {title}
              </h1>
              {description && (
                <p className="text-muted-foreground text-xs sm:text-sm mt-0.5 max-w-xl hidden sm:block">{description}</p>
              )}
            </div>
          </div>

          {actions && (
            <div className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2 w-full sm:w-auto min-w-0">
              {actions}
            </div>
          )}
        </div>

        {/* Stats */}
        {stats && stats.length > 0 && (
          <div
            className={cn(
              'grid gap-2 sm:gap-3',
              stats.length > 4
                ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5'
                : 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-4',
            )}
          >
            {stats.map((stat, i) => (
              <div
                key={i}
                  className="group relative min-w-0 bg-background/[0.68] dark:bg-background/40 backdrop-blur-sm border border-border/50 rounded-2xl p-2.5 sm:p-4 hover:-translate-y-0.5 hover:border-cyan-400/35 hover:bg-background/85 hover:shadow-md hover:shadow-cyan-500/10 transition-all duration-300"
              >
                <div className="flex items-start justify-between gap-2 mb-1 sm:mb-2">
                  <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-widest text-muted-foreground min-w-0 flex-1 break-words leading-snug">
                    {stat.label}
                  </p>
                  {stat.icon && (
                    <div className={cn('p-1 sm:p-1.5 rounded-xl bg-primary/[0.08] flex-shrink-0 group-hover:scale-110 transition-transform duration-300', stat.color)}>
                      {stat.icon}
                    </div>
                  )}
                </div>
                <p
                  className={cn(
                    'text-sm sm:text-lg md:text-xl font-bold tracking-tight break-words whitespace-normal leading-snug tabular-nums',
                    stat.color || 'text-foreground',
                  )}
                >
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function StatBadge({
  label,
  value,
  variant = 'default',
}: {
  label: string;
  value: string | number;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}) {
  const variants = {
    default: 'bg-primary/10 text-primary border-primary/20',
    success: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
    warning: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
    danger:  'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
  };
  return (
    <div className={cn('inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold border', variants[variant])}>
      <span className="text-xs opacity-60">{label}:</span>
      <span>{value}</span>
    </div>
  );
}
