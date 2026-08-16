import React from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, rightIcon, className, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs uppercase tracking-[0.15em] font-medium text-slate-400">
            {label}
          </label>
        )}
        <div className="relative rounded-2xl bg-white/[0.04] p-1 border border-white/10 focus-within:border-[#D4AF37]/60 focus-within:ring-1 focus-within:ring-[#D4AF37]/30 transition-all duration-300">
          <div className="relative flex items-center bg-[#0A0F1A]/80 rounded-[calc(1rem-0.25rem)] px-3.5 py-2">
            {leftIcon && <span className="mr-2.5 text-slate-400 shrink-0">{leftIcon}</span>}
            <input
              id={inputId}
              ref={ref}
              className={cn(
                'w-full bg-transparent text-slate-100 placeholder-slate-500 text-sm outline-none',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                className
              )}
              {...props}
            />
            {rightIcon && <span className="ml-2.5 text-slate-400 shrink-0">{rightIcon}</span>}
          </div>
        </div>
        {error && <p className="text-xs text-rose-400 font-medium pl-1">{error}</p>}
        {!error && helperText && <p className="text-xs text-slate-500 pl-1">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
