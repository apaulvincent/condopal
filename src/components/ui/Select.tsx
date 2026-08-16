import React from 'react';
import { cn } from '../../lib/utils';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
  helperText?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, error, helperText, className, id, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={selectId} className="block text-xs uppercase tracking-[0.15em] font-medium text-slate-400">
            {label}
          </label>
        )}
        <div className="relative rounded-2xl bg-white/[0.04] p-1 border border-white/10 focus-within:border-[#D4AF37]/60 focus-within:ring-1 focus-within:ring-[#D4AF37]/30 transition-all duration-300">
          <div className="relative flex items-center bg-[#0A0F1A]/80 rounded-[calc(1rem-0.25rem)] px-3.5 py-2">
            <select
              id={selectId}
              ref={ref}
              className={cn(
                'w-full bg-transparent text-slate-100 text-sm outline-none appearance-none cursor-pointer pr-6',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                className
              )}
              {...props}
            >
              {options.map((opt) => (
                <option key={opt.value} value={opt.value} disabled={opt.disabled} className="bg-[#0C121E] text-slate-100">
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 pointer-events-none stroke-[1.5]" />
          </div>
        </div>
        {error && <p className="text-xs text-rose-400 font-medium pl-1">{error}</p>}
        {!error && helperText && <p className="text-xs text-slate-500 pl-1">{helperText}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
