import React, { useState, useEffect } from 'react';
import type { Condo } from '../types/booking';
import { condoPalApi } from '../lib/supabase';
import { CondoHero } from '../components/showcase/CondoHero';
import { CondoCard } from '../components/showcase/CondoCard';
import { AmenitiesList } from '../components/showcase/AmenitiesList';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { DoubleBezel } from '../components/ui/DoubleBezel';
import { ArrowUpRight, Star, ShieldCheck } from 'lucide-react';

export interface ShowcaseViewProps {
  onSelectCondoForBooking: (condo: Condo) => void;
  onNavigateToBooking: () => void;
  onNavigateToLookup: () => void;
}

export const ShowcaseView: React.FC<ShowcaseViewProps> = ({
  onSelectCondoForBooking,
  onNavigateToBooking,
  onNavigateToLookup,
}) => {
  const [condos, setCondos] = useState<Condo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await condoPalApi.getCondos();
        setCondos(data);
      } catch (err) {
        console.error('Failed to load condos:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleExploreScroll = () => {
    const el = document.getElementById('residences-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-16 pb-24">
      {/* 1. Cinematic Hero Section */}
      <CondoHero
        onExploreClick={handleExploreScroll}
        onBookClick={onNavigateToBooking}
      />

      {/* 2. Curated Residences Section (Asymmetric Bento Grid) */}
      <section id="residences-section" className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 scroll-mt-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-3">
            <Badge variant="gold" size="sm" dot>
              Curated Inventory
            </Badge>
            <h2 className="font-serif text-3xl sm:text-5xl text-slate-100 font-medium tracking-tight">
              Featured Suites & Penthouses
            </h2>
            <p className="text-sm text-slate-400 font-sans max-w-xl">
              Each architectural residence is uniquely appointed with bespoke Italian marble,
              panoramic volcano vistas, and automated climate control.
            </p>
          </div>

          <Button
            size="md"
            variant="glass"
            onClick={onNavigateToBooking}
            icon={<ArrowUpRight className="w-3.5 h-3.5 text-slate-200 stroke-[1.5]" />}
          >
            Check All Availability
          </Button>
        </div>

        {/* Units Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-[480px] rounded-[2rem] bg-white/[0.03] border border-white/10 animate-shimmer"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {condos.map((condo, idx) => (
              <div
                key={condo.id}
                className={idx === 0 ? 'md:col-span-1 lg:col-span-1' : 'md:col-span-1'}
              >
                <CondoCard
                  condo={condo}
                  featured={idx === 0}
                  onSelect={(selected) => onSelectCondoForBooking(selected)}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 3. Luxury Resort Amenities Bento */}
      <div id="amenities-section">
        <AmenitiesList />
      </div>

      {/* 4. Guest Testimonials & Social Proof */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="text-center space-y-3 mb-12">
          <Badge variant="emerald" size="sm">
            Guest Testimonials
          </Badge>
          <h2 className="font-serif text-3xl sm:text-4xl text-slate-100 font-medium tracking-tight">
            Loved by Discerning Travelers
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <DoubleBezel innerClassName="p-6 space-y-4">
            <div className="flex items-center gap-1 text-[#E5C483]">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-current stroke-none" />
              ))}
            </div>
            <p className="text-xs text-slate-300 font-sans leading-relaxed italic">
              "The Azure Sky Penthouse exceeded every expectation. The heated plunge pool overlooking
              Taal Volcano while watching the sunset with chilled champagne was pure bliss."
            </p>
            <div className="pt-2 border-t border-white/8">
              <span className="font-serif text-sm font-semibold text-slate-100 block">
                Alexander & Victoria M.
              </span>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                Stayed 4 Nights • Azure Sky Penthouse
              </span>
            </div>
          </DoubleBezel>

          <DoubleBezel innerClassName="p-6 space-y-4">
            <div className="flex items-center gap-1 text-[#E5C483]">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-current stroke-none" />
              ))}
            </div>
            <p className="text-xs text-slate-300 font-sans leading-relaxed italic">
              "Instant confirmation with zero booking hiccups. The mobile boarding pass voucher made
              check-in completely effortless. We are already booking our holiday retreat!"
            </p>
            <div className="pt-2 border-t border-white/8">
              <span className="font-serif text-sm font-semibold text-slate-100 block">
                Danielle S.
              </span>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                Stayed 2 Nights • Luxe Horizon Loft
              </span>
            </div>
          </DoubleBezel>

          <DoubleBezel innerClassName="p-6 space-y-4">
            <div className="flex items-center gap-1 text-[#E5C483]">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-current stroke-none" />
              ))}
            </div>
            <p className="text-xs text-slate-300 font-sans leading-relaxed italic">
              "The private chef 4-course dinner inside our suite was Michelin caliber. The cedar hot
              tub amidst the botanical garden was the ultimate city detox."
            </p>
            <div className="pt-2 border-t border-white/8">
              <span className="font-serif text-sm font-semibold text-slate-100 block">
                Marcus & Elena V.
              </span>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                Stayed 3 Nights • Serenity Garden Suite
              </span>
            </div>
          </DoubleBezel>
        </div>
      </section>

      {/* 5. Direct Booking Call-To-Action Banner */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-6">
        <DoubleBezel
          glow
          outerClassName="border-gold-400/40"
          innerClassName="p-8 sm:p-12 text-center space-y-6 bg-gradient-to-b from-[#141E33] to-[#0A0F1A]"
        >
          <Badge variant="gold" size="sm" dot>
            Exclusive Highland Retreat
          </Badge>

          <h2 className="font-serif text-3xl sm:text-5xl text-slate-100 font-medium tracking-tight max-w-2xl mx-auto">
            Experience Unrivaled Luxury Above the Ridge
          </h2>

          <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto font-sans">
            Secure your dates with our 20% deposit hold. Powered by real-time concurrency locking to
            guarantee zero double-booking.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Button
              size="lg"
              variant="gold"
              onClick={onNavigateToBooking}
              icon={<ArrowUpRight className="w-4 h-4 text-slate-950 stroke-[2]" />}
            >
              Start Instant Booking
            </Button>

            <Button
              size="lg"
              variant="glass"
              onClick={onNavigateToLookup}
              icon={<ShieldCheck className="w-4 h-4 text-slate-300 stroke-[1.5]" />}
            >
              Manage Existing Booking
            </Button>
          </div>
        </DoubleBezel>
      </section>
    </div>
  );
};
