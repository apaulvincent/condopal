import React from 'react';
import { DoubleBezel } from './DoubleBezel';
import { cn } from '../../lib/utils';

export interface LuxuryCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  glow?: boolean;
  interactive?: boolean;
  outerClassName?: string;
  innerClassName?: string;
}

export const LuxuryCard: React.FC<LuxuryCardProps> = ({
  children,
  header,
  footer,
  glow = false,
  interactive = false,
  outerClassName,
  innerClassName,
  className,
  ...props
}) => {
  return (
    <DoubleBezel
      glow={glow}
      interactive={interactive}
      outerClassName={outerClassName}
      innerClassName={cn('flex flex-col', innerClassName)}
      className={className}
      {...props}
    >
      {header && <div className="mb-6 border-b border-white/10 pb-4">{header}</div>}
      <div className="flex-1">{children}</div>
      {footer && <div className="mt-6 border-t border-white/10 pt-4">{footer}</div>}
    </DoubleBezel>
  );
};
