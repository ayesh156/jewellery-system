import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../utils/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: boolean;
  icon?: ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, label, id, icon, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    
    const inputElement = (
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-400 pointer-events-none">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          type={type}
          className={cn(
            'flex h-10 w-full rounded-lg border bg-white dark:bg-slate-800/50 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error
              ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500'
              : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600',
            icon && 'pl-10',
            className
          )}
          ref={ref}
          {...props}
        />
      </div>
    );
    
    if (label) {
      return (
        <div className="w-full">
          <label 
            htmlFor={inputId}
            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
          >
            {label}
            {props.required && <span className="text-red-400 ml-1">*</span>}
          </label>
          {inputElement}
        </div>
      );
    }

    return inputElement;
  }
);

Input.displayName = 'Input';

export { Input };
