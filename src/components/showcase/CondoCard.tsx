import React, { useState } from 'react';
import type { Condo } from '../../types/booking';
import { DoubleBezel } from '../ui/DoubleBezel';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { formatCurrency } from '../../lib/utils';
import { Users, Bed, Bath, Maximize2, ArrowUpRight, Check } from 'lucide-react';

export interface CondoCardProps {
  condo: Condo;
  onSelect: (condo: Condo) => void;
  featured?: boolean;
}

export const CondoCard: React.FC<CondoCardProps> = ({ condo, onSelect, featured = false }) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const images = condo.images.length > 0
    ? condo.images
    : [{ url: condo.cover_image || 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80', caption: condo.name }];

  const currentImage = images[activeImageIndex] || images[0];

  return (
    <DoubleBezel
      glow={featured}
      interactive
      className="h-full flex flex-col justify-between"
      innerClassName="p-5 sm:p-7 flex flex-col justify-between h-full"
    >
      <div className="space-y-5">
        {/* Visual Gallery Preview with Nested Aspect Frame */}
        <div className="relative rounded-2xl overflow-hidden aspect-[16/10] bg-slate-900 border border-white/10 group/img">
          <img
            src={currentImage.url}
            alt={currentImage.caption || condo.name}
            className="w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/img:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

          {/* Top Floating Badges */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
            <Badge variant="glass" size="xs">
              {condo.location.split(',')[0]}
            </Badge>
            {featured && (
              <Badge variant="gold" size="xs" dot>
                Signature Residence
              </Badge>
            )}
          </div>

          {/* Image Navigation Dots */}
          {images.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10">
              {images.slice(0, 4).map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImageIndex(idx);
                  }}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    activeImageIndex === idx ? 'w-4 bg-[#E5C483]' : 'w-1.5 bg-white/40 hover:bg-white/70'
                  }`}
                  aria-label={`View image ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Title & Tagline */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-serif text-2xl font-semibold text-slate-100 group-hover:text-[#E5C483] transition-colors">
              {condo.name}
            </h3>
          </div>
          <p className="text-xs text-[#E5C483] font-medium font-sans">
            {condo.tagline || 'Tagaytay Ridge Luxury Sanctuary'}
          </p>
          <p className="text-xs text-slate-400 font-sans line-clamp-2 leading-relaxed">
            {condo.description}
          </p>
        </div>

        {/* Key Architectural Specs Bento Strip */}
        <div className="grid grid-cols-4 gap-2 py-3 border-y border-white/8 text-slate-300">
          <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/[0.03] border border-white/5">
            <Users className="w-4 h-4 text-[#E5C483] mb-1 stroke-[1.5]" />
            <span className="text-[11px] font-semibold">{condo.max_guests} Guests</span>
          </div>
          <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/[0.03] border border-white/5">
            <Bed className="w-4 h-4 text-[#E5C483] mb-1 stroke-[1.5]" />
            <span className="text-[11px] font-semibold">{condo.bedrooms} Bed{condo.bedrooms > 1 ? 's' : ''}</span>
          </div>
          <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/[0.03] border border-white/5">
            <Bath className="w-4 h-4 text-[#E5C483] mb-1 stroke-[1.5]" />
            <span className="text-[11px] font-semibold">{condo.bathrooms} Bath{condo.bathrooms > 1 ? 's' : ''}</span>
          </div>
          <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/[0.03] border border-white/5">
            <Maximize2 className="w-4 h-4 text-[#E5C483] mb-1 stroke-[1.5]" />
            <span className="text-[11px] font-semibold">{condo.floor_area_sqm || 120} m²</span>
          </div>
        </div>

        {/* Top 3 Amenities Pills */}
        <div className="space-y-1.5">
          <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-medium">
            Signature Highlights
          </span>
          <div className="flex flex-wrap gap-1.5">
            {condo.amenities.slice(0, 3).map((amenity, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-white/[0.04] text-slate-300 border border-white/8"
              >
                <Check className="w-3 h-3 text-emerald-400 stroke-[2]" />
                {amenity}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Pricing & CTA Footer */}
      <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between gap-3">
        <div>
          <div className="flex items-baseline gap-1">
            <span className="font-serif text-2xl font-bold text-slate-100 tabular-nums">
              {formatCurrency(condo.base_price_per_night)}
            </span>
            <span className="text-xs text-slate-400 font-sans">/ night</span>
          </div>
          <span className="text-[10px] text-[#E5C483] font-medium font-sans">
            Weekend: {formatCurrency(condo.weekend_price_per_night)}
          </span>
        </div>

        <Button
          size="md"
          variant="gold"
          onClick={() => onSelect(condo)}
          icon={<ArrowUpRight className="w-3.5 h-3.5 text-slate-950 stroke-[2]" />}
        >
          Reserve
        </Button>
      </div>
    </DoubleBezel>
  );
};
