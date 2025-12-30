import { cn } from '../../utils/cn';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'gold';
  className?: string;
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        {
          'bg-slate-700 text-slate-300': variant === 'default',
          'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30': variant === 'success',
          'bg-amber-500/20 text-amber-400 border border-amber-500/30': variant === 'warning',
          'bg-red-500/20 text-red-400 border border-red-500/30': variant === 'error',
          'bg-blue-500/20 text-blue-400 border border-blue-500/30': variant === 'info',
          'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-300 border border-amber-500/30': variant === 'gold',
        },
        className
      )}
    >
      {children}
    </span>
  );
}
