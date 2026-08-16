import React from 'react';
import { cn } from '../../lib/utils';

export interface DoubleBezelProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  outerClassName?: string;
  innerClassName?: string;
  glow?: boolean;
  interactive?: boolean;
}

export const DoubleBezel: React.FC<DoubleBezelProps> = ({
  children,
  outerClassName,
  innerClassName,
  glow = false,
  interactive = false,
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        'relative p-1.5 rounded-[2rem] bg-white/[0.04] border border-white/10 ring-1 ring-black/40 shadow-2xl',
        'transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group',
        interactive && 'hover:border-gold-400/40 hover:-translate-y-1 cursor-pointer',
        glow && 'hover:shadow-[0_0_40px_rgba(212,175,55,0.15)]',
        outerClassName,
        className
      )}
      {...props}
    >
      {glow && (
        <div className="absolute -inset-1 rounded-[2.2rem] bg-gradient-to-r from-gold-500/20 via-emerald-500/10 to-transparent blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
      )}
      <div
        className={cn(
          'relative rounded-[calc(2rem-0.375rem)] bg-[#0C121E]/90 backdrop-blur-xl p-6 md:p-8',
          'shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] overflow-hidden',
          innerClassName
        )}
      >
        {children}
      </div>
    </div>
  );
};
