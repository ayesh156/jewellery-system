import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, label, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    
    if (label) {
      return (
        <div className="w-full">
          <label 
            htmlFor={inputId}
            className="block text-sm font-medium text-slate-300 mb-1.5"
          >
            {label}
            {props.required && <span className="text-red-400 ml-1">*</span>}
          </label>
          <input
            id={inputId}
            type={type}
            className={cn(
              'flex h-10 w-full rounded-lg border bg-slate-800/50 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500',
              'disabled:cursor-not-allowed disabled:opacity-50',
              error
                ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500'
                : 'border-slate-700 hover:border-slate-600',
              className
            )}
            ref={ref}
            {...props}
          />
        </div>
      );
    }

    return (
      <input
        id={inputId}
        type={type}
        className={cn(
          'flex h-10 w-full rounded-lg border bg-slate-800/50 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500',
          'disabled:cursor-not-allowed disabled:opacity-50',
          error
            ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500'
            : 'border-slate-700 hover:border-slate-600',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

export { Input };
