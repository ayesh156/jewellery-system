import { forwardRef, type SelectHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, children, ...props }, ref) => {
    return (
      <select
        className={cn(
          'flex h-10 w-full rounded-lg border bg-slate-800/50 px-3 py-2 text-sm text-slate-100 transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500',
          'disabled:cursor-not-allowed disabled:opacity-50',
          error
            ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500'
            : 'border-slate-700 hover:border-slate-600',
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </select>
    );
  }
);

Select.displayName = 'Select';

export { Select };
