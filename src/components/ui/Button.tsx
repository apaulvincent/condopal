import React from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'gold' | 'emerald' | 'glass' | 'dark' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'gold',
  size = 'md',
  icon,
  isLoading = false,
  className,
  disabled,
  ...props
}) => {
  const variantStyles = {
    gold: 'bg-gradient-to-r from-[#E5C483] via-[#D4AF37] to-[#B89728] text-slate-950 font-semibold shadow-lg shadow-[#D4AF37]/20 hover:shadow-[#D4AF37]/35 border border-[#F3E5AB]/40',
    emerald: 'bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-700 text-white font-semibold shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/35 border border-emerald-400/40',
    glass: 'bg-white/[0.07] hover:bg-white/[0.12] text-white border border-white/15 backdrop-blur-md shadow-sm',
    dark: 'bg-[#0E1524] hover:bg-[#141E33] text-white border border-white/10 shadow-md',
    outline: 'bg-transparent hover:bg-white/[0.05] text-[#E5C483] border border-[#D4AF37]/40 hover:border-[#D4AF37]',
  };

  const sizeStyles = {
    sm: 'text-xs pl-4 pr-1.5 py-1.5 min-h-[36px]',
    md: 'text-sm pl-5 pr-2 py-2 min-h-[44px]',
    lg: 'text-base pl-6 pr-2.5 py-2.5 min-h-[52px]',
  };

  const iconSizeStyles = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-9 h-9',
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={cn(
        'group relative inline-flex items-center justify-between gap-3 rounded-full tracking-wide',
        'transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]',
        'active:scale-[0.97] hover:scale-[1.01] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      <span className="py-1 tracking-wide flex items-center gap-2">
        {isLoading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        {children}
      </span>
      {icon && (
        <span
          className={cn(
            'flex items-center justify-center rounded-full bg-black/15 group-hover:bg-black/25',
            'transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]',
            'group-hover:translate-x-0.5 group-hover:-translate-y-0.5 shadow-inner shrink-0',
            iconSizeStyles[size]
          )}
        >
          {icon}
        </span>
      )}
    </button>
  );
};
