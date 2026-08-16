import React from 'react';
import { useBooking } from '../../context/BookingContext';
import { DoubleBezel } from '../ui/DoubleBezel';
import { Badge } from '../ui/Badge';
import { formatCurrency } from '../../lib/utils';
import {
  Sparkles,
  Plus,
  Minus,
  Check,
  Car,
  Wifi,
  Utensils,
  Flame,
  Clock,
  Waves,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ReactNode> = {
  Car: <Car className="w-5 h-5" />,
  Wifi: <Wifi className="w-5 h-5" />,
  Utensils: <Utensils className="w-5 h-5" />,
  Flame: <Flame className="w-5 h-5" />,
  Clock: <Clock className="w-5 h-5" />,
  Waves: <Waves className="w-5 h-5" />,
};

export const Step4Extras: React.FC = () => {
  const {
    allExtras,
    selectedExtras,
    setExtraQuantity,
    toggleExtra,
    nightsCount,
    numAdults,
    numChildren,
  } = useBooking();

  const totalGuests = numAdults + numChildren;

  const getPriceModelLabel = (priceType: string): string => {
    switch (priceType) {
      case 'per_stay':
        return 'per stay';
      case 'per_night':
        return 'per night';
      case 'per_guest':
        return 'per guest';
      case 'per_guest_per_night':
        return 'per guest / night';
      default:
        return 'per stay';
    }
  };

  const calculateItemSubtotal = (extra: (typeof allExtras)[0], qty: number): number => {
    if (qty <= 0) return 0;
    const nights = Math.max(1, nightsCount);
    switch (extra.price_type) {
      case 'per_stay':
        return extra.price * qty;
      case 'per_night':
        return extra.price * qty * nights;
      case 'per_guest':
        return extra.price * qty * Math.max(1, totalGuests);
      case 'per_guest_per_night':
        return extra.price * qty * Math.max(1, totalGuests) * nights;
      default:
        return extra.price * qty;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <DoubleBezel glow innerClassName="p-6 sm:p-8 space-y-6">
        {/* Step Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Badge variant="gold" size="xs">
                Step 04 / 05
              </Badge>
              <span className="text-[11px] uppercase tracking-[0.2em] text-slate-400 font-medium">
                Curated Experiences
              </span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-slate-100">
              Enhance your luxury retreat
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="glass" size="sm">
              {selectedExtras.length} Add-on{selectedExtras.length !== 1 ? 's' : ''} Selected
            </Badge>
          </div>
        </div>

        {/* Extras Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {allExtras.map((extra) => {
            const selectedItem = selectedExtras.find((i) => i.extra_id === extra.id);
            const isSelected = !!selectedItem && selectedItem.quantity > 0;
            const currentQty = selectedItem ? selectedItem.quantity : 0;
            const subtotal = calculateItemSubtotal(extra, isSelected ? currentQty : 1);
            const iconComponent = ICON_MAP[extra.icon] || <Sparkles className="w-5 h-5" />;

            return (
              <div
                key={extra.id}
                className={`p-4 rounded-2xl border transition-all duration-500 flex flex-col justify-between ${
                  isSelected
                    ? 'bg-[#D4AF37]/10 border-[#D4AF37]/50 shadow-[0_0_20px_rgba(212,175,55,0.12)]'
                    : 'bg-white/[0.03] border-white/10 hover:border-white/20'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${
                          isSelected
                            ? 'bg-[#D4AF37]/20 border-[#D4AF37]/50 text-[#F3E5AB]'
                            : 'bg-white/[0.05] border-white/10 text-slate-300'
                        }`}
                      >
                        {iconComponent}
                      </div>
                      <div>
                        <h4 className="font-serif text-base font-semibold text-slate-100">
                          {extra.name}
                        </h4>
                        <span className="text-[11px] text-[#E5C483] font-medium">
                          {formatCurrency(extra.price)} {getPriceModelLabel(extra.price_type)}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleExtra(extra.id)}
                      className={`w-7 h-7 rounded-full flex items-center justify-center border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-gradient-to-tr from-[#D4AF37] to-[#F3E5AB] text-slate-950 border-[#F3E5AB]'
                          : 'bg-white/[0.05] border-white/20 text-transparent hover:border-white/40'
                      }`}
                      aria-label={isSelected ? 'Remove extra' : 'Add extra'}
                    >
                      <Check className={`w-3.5 h-3.5 stroke-[3] ${isSelected ? 'block' : 'hidden'}`} />
                    </button>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    {extra.description}
                  </p>
                </div>

                {/* Subtotal & Quantity Controls */}
                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between gap-3">
                  <div>
                    {isSelected ? (
                      <span className="text-xs font-semibold text-emerald-400">
                        + {formatCurrency(subtotal)} added
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-500">
                        Estimated: {formatCurrency(subtotal)}
                      </span>
                    )}
                  </div>

                  {extra.max_quantity > 1 && isSelected ? (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase tracking-wider text-slate-400">Qty</span>
                      <button
                        type="button"
                        onClick={() => setExtraQuantity(extra.id, currentQty - 1)}
                        className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-5 text-center text-xs font-bold text-slate-100">
                        {currentQty}
                      </span>
                      <button
                        type="button"
                        disabled={currentQty >= extra.max_quantity}
                        onClick={() => setExtraQuantity(extra.id, currentQty + 1)}
                        className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 border border-white/10 flex items-center justify-center text-white disabled:cursor-not-allowed"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => toggleExtra(extra.id)}
                      className={`text-xs font-medium px-3 py-1 rounded-full transition-colors cursor-pointer ${
                        isSelected
                          ? 'text-rose-400 hover:text-rose-300'
                          : 'text-[#E5C483] hover:text-[#F3E5AB]'
                      }`}
                    >
                      {isSelected ? 'Remove' : '+ Add to Stay'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </DoubleBezel>
    </div>
  );
};
