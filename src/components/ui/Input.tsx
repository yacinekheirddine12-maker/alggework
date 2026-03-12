import React from 'react';
import { cn } from '../../lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, type = 'text', ...props }, ref) => {
    return (
      <div className="w-full space-y-2">
        {label && (
          <label className="text-sm font-bold text-slate-900">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            type={type}
            ref={ref}
            className={cn(
              'h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50',
              error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p className="text-xs font-medium text-red-500">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-xs text-slate-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
