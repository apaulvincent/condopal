import React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'gold' | 'emerald' | 'amber' | 'rose' | 'slate' | 'glass';
  size?: 'xs' | 'sm' | 'md';
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'gold',
  size = 'sm',
  dot = false,
  className,
  ...props
}) => {
  const variantStyles = {
    gold: 'bg-[#D4AF37]/10 text-[#E5C483] border border-[#D4AF37]/30',
    emerald: 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30',
    amber: 'bg-amber-500/10 text-amber-300 border border-amber-500/30',
    rose: 'bg-rose-500/10 text-rose-300 border border-rose-500/30',
    slate: 'bg-slate-800/80 text-slate-300 border border-slate-700/50',
    glass: 'bg-white/[0.06] text-white border border-white/15 backdrop-blur-md',
  };

  const dotColorStyles = {
    gold: 'bg-[#E5C483]',
    emerald: 'bg-emerald-400',
    amber: 'bg-amber-400',
    rose: 'bg-rose-400',
    slate: 'bg-slate-400',
    glass: 'bg-white',
  };

  const sizeStyles = {
    xs: 'text-[9px] px-2 py-0.5 tracking-[0.18em]',
    sm: 'text-[10px] px-3 py-1 tracking-[0.2em]',
    md: 'text-xs px-3.5 py-1.5 tracking-[0.15em]',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium uppercase font-sans shrink-0',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full animate-pulse',
            dotColorStyles[variant]
          )}
        />
      )}
      {children}
    </span>
  );
};
