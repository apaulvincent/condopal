import React, { useState } from 'react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Menu, X, ArrowUpRight, Sparkles, Shield, Compass, Calendar } from 'lucide-react';

export interface FloatingNavProps {
  onSelectView?: (view: string) => void;
  currentView?: string;
}

export const FloatingNav: React.FC<FloatingNavProps> = ({
  onSelectView,
  currentView = 'showcase',
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleNavClick = (viewName: string) => {
    if (onSelectView) {
      onSelectView(viewName);
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Detached Floating Island Navbar Container */}
      <header className="fixed top-4 inset-x-4 max-w-5xl mx-auto z-40">
        <div className="relative rounded-full bg-[#080B10]/80 backdrop-blur-2xl border border-white/12 shadow-[0_20px_50px_rgba(0,0,0,0.5)] px-4 sm:px-6 py-2.5 flex items-center justify-between transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]">
          {/* Brand Logo & Eyebrow */}
          <div
            onClick={() => handleNavClick('showcase')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#D4AF37] to-[#F3E5AB] flex items-center justify-center shadow-md shadow-[#D4AF37]/20 group-hover:scale-105 transition-transform duration-500">
              <span className="font-serif font-bold text-slate-950 text-sm">CP</span>
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-base font-semibold tracking-wide text-slate-100 group-hover:text-[#E5C483] transition-colors">
                CondoPal
              </span>
              <span className="text-[9px] uppercase tracking-[0.25em] text-slate-400 font-medium">
                Luxury Suites
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-white/[0.03] p-1 rounded-full border border-white/8">
            <button
              onClick={() => handleNavClick('showcase')}
              className={`px-4 py-1.5 rounded-full text-xs font-medium tracking-wider transition-all duration-300 ${
                currentView === 'showcase'
                  ? 'bg-white/10 text-[#E5C483] shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              Suites & Villas
            </button>
            <button
              onClick={() => handleNavClick('experience')}
              className={`px-4 py-1.5 rounded-full text-xs font-medium tracking-wider transition-all duration-300 ${
                currentView === 'experience'
                  ? 'bg-white/10 text-[#E5C483] shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              Resort Amenities
            </button>
            <button
              onClick={() => handleNavClick('lookup')}
              className={`px-4 py-1.5 rounded-full text-xs font-medium tracking-wider transition-all duration-300 ${
                currentView === 'lookup'
                  ? 'bg-white/10 text-[#E5C483] shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              Find Booking
            </button>
            <button
              onClick={() => handleNavClick('admin')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium tracking-wider transition-all duration-300 ${
                currentView === 'admin'
                  ? 'bg-white/10 text-emerald-400 shadow-sm'
                  : 'text-slate-400 hover:text-emerald-300 hover:bg-white/5'
              }`}
            >
              Admin Hub
            </button>
          </nav>

          {/* Action CTA & Mobile Hamburger */}
          <div className="flex items-center gap-2.5">
            <Badge variant="gold" size="xs" dot className="hidden lg:inline-flex">
              Instant Confirm
            </Badge>

            <Button
              size="sm"
              variant="gold"
              onClick={() => handleNavClick('book')}
              icon={<ArrowUpRight className="w-3.5 h-3.5 text-slate-950 stroke-[2]" />}
              className="hidden sm:inline-flex"
            >
              Reserve Stay
            </Button>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden w-9 h-9 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 flex items-center justify-center text-slate-200 transition-all cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-4 h-4 stroke-[1.5]" />
              ) : (
                <Menu className="w-4 h-4 stroke-[1.5]" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Full-Screen Mobile Drawer Overlay with Staggered Links */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-between p-6 bg-[#080B10]/95 backdrop-blur-3xl border border-white/10 animate-in fade-in duration-300">
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#D4AF37] to-[#F3E5AB] flex items-center justify-center">
                <span className="font-serif font-bold text-slate-950 text-sm">CP</span>
              </div>
              <span className="font-serif text-lg font-semibold text-white">CondoPal</span>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-col gap-4 py-8">
            <button
              onClick={() => handleNavClick('showcase')}
              className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.04] border border-white/10 text-left"
            >
              <div className="flex items-center gap-3">
                <Compass className="w-5 h-5 text-[#E5C483] stroke-[1.5]" />
                <span className="font-serif text-lg text-white">Suites & Villas Showcase</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400" />
            </button>

            <button
              onClick={() => handleNavClick('experience')}
              className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.04] border border-white/10 text-left"
            >
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-[#E5C483] stroke-[1.5]" />
                <span className="font-serif text-lg text-white">Resort Amenities & Spa</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400" />
            </button>

            <button
              onClick={() => handleNavClick('lookup')}
              className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.04] border border-white/10 text-left"
            >
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-emerald-400 stroke-[1.5]" />
                <span className="font-serif text-lg text-white">Find My Reservation</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400" />
            </button>

            <button
              onClick={() => handleNavClick('admin')}
              className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.04] border border-white/10 text-left"
            >
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-amber-400 stroke-[1.5]" />
                <span className="font-serif text-lg text-white">Admin Management Hub</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          <div className="pt-4 border-t border-white/10 flex flex-col gap-3">
            <Button
              size="lg"
              variant="gold"
              onClick={() => handleNavClick('book')}
              className="w-full justify-center text-center"
              icon={<ArrowUpRight className="w-4 h-4 text-slate-950 stroke-[2]" />}
            >
              Start Instant Booking
            </Button>
            <p className="text-center text-[10px] uppercase tracking-[0.2em] text-slate-500">
              Tagaytay Highlands • Luxury Concierge
            </p>
          </div>
        </div>
      )}
    </>
  );
};
