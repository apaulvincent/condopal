import React from 'react';
import { Button } from '../ui/Button';
import { ArrowUpRight } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';

export interface MobileActionBarProps {
  totalAmount?: number;
  perNightRate?: number;
  nightsCount?: number;
  onActionClick: () => void;
  actionText?: string;
  isActionDisabled?: boolean;
  isLoading?: boolean;
}

export const MobileActionBar: React.FC<MobileActionBarProps> = ({
  totalAmount,
  perNightRate,
  nightsCount,
  onActionClick,
  actionText = 'Reserve Now',
  isActionDisabled = false,
  isLoading = false,
}) => {
  return (
    <aside
      aria-label="Booking summary and quick reservation action bar"
      className="md:hidden fixed bottom-4 inset-x-4 max-w-lg mx-auto z-40"
    >
      <div className="rounded-full bg-[#080B10]/90 backdrop-blur-2xl border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.8)] p-2.5 flex items-center justify-between gap-3">
        {/* Left Side: Pricing Summary */}
        <div className="pl-3.5 flex flex-col">
          {totalAmount !== undefined && totalAmount > 0 ? (
            <>
              <div className="flex items-baseline gap-1">
                <span className="font-serif text-lg font-bold text-slate-100 tabular-nums">
                  {formatCurrency(totalAmount)}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">total</span>
              </div>
              <span className="text-[10px] text-[#E5C483] font-medium">
                {nightsCount ? `${nightsCount} nights • ` : ''}20% deposit
              </span>
            </>
          ) : perNightRate ? (
            <>
              <div className="flex items-baseline gap-1">
                <span className="font-serif text-lg font-bold text-slate-100 tabular-nums">
                  {formatCurrency(perNightRate)}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">/ night</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-medium">Best rate guaranteed</span>
            </>
          ) : (
            <div className="flex flex-col">
              <span className="font-serif text-sm font-semibold text-slate-100">CondoPal Luxury</span>
              <span className="text-[10px] text-[#E5C483] font-medium">Tagaytay Highlands</span>
            </div>
          )}
        </div>

        {/* Right Side: CTA Button */}
        <Button
          size="sm"
          variant="gold"
          onClick={onActionClick}
          disabled={isActionDisabled}
          isLoading={isLoading}
          icon={<ArrowUpRight className="w-3.5 h-3.5 text-slate-950 stroke-[2]" />}
          className="shrink-0"
        >
          {actionText}
        </Button>
      </div>
    </aside>
  );
};
