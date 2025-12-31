import { cn } from '../../utils/cn';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'gold' | 'outline';
  className?: string;
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        {
          'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300': variant === 'default',
          'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30': variant === 'success',
          'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30': variant === 'warning',
          'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-500/30': variant === 'error',
          'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-500/30': variant === 'info',
          'bg-gradient-to-r from-amber-100 dark:from-amber-500/20 to-yellow-100 dark:to-yellow-500/20 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30': variant === 'gold',
          'bg-transparent text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-600': variant === 'outline',
        },
        className
      )}
    >
      {children}
    </span>
  );
}
