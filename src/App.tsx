import { useState, useEffect } from 'react';
import type { Condo } from './types/booking';
import { BookingProvider, useBooking } from './context/BookingContext';
import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext';
import { FloatingNav } from './components/layout/FloatingNav';
import { Footer } from './components/layout/Footer';
import { MobileActionBar } from './components/layout/MobileActionBar';
import { ShowcaseView } from './views/ShowcaseView';
import { BookingView } from './views/BookingView';
import { ConfirmationView } from './views/ConfirmationView';
import { LookupView } from './views/LookupView';
import { AdminLoginView } from './views/AdminLoginView';
import { AdminDashboardView } from './views/AdminDashboardView';

export type AppView =
  | 'showcase'
  | 'experience'
  | 'book'
  | 'confirmation'
  | 'lookup'
  | 'admin'
  | 'admin-login';

function AppContent() {
  const { isAuthenticated } = useAdminAuth();
  const { setCondo } = useBooking();

  const [currentView, setCurrentView] = useState<AppView>('showcase');
  const [activeBookingCode, setActiveBookingCode] = useState<string>('');

  // Handle URL path / query params routing
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const path = window.location.pathname;
    const searchParams = new URLSearchParams(window.location.search);
    const codeParam = searchParams.get('code') || searchParams.get('booking');

    if (path.startsWith('/confirmation/') || codeParam) {
      const codeFromPath = path.replace('/confirmation/', '').trim();
      const code = codeFromPath || codeParam || 'CP-2026-98K1A';
      setActiveBookingCode(code);
      setCurrentView('confirmation');
    } else if (path === '/lookup' || searchParams.get('view') === 'lookup') {
      setCurrentView('lookup');
    } else if (path === '/admin' || searchParams.get('view') === 'admin') {
      setCurrentView('admin');
    } else if (path === '/book' || searchParams.get('view') === 'book') {
      setCurrentView('book');
    }
  }, []);

  const handleNavigate = (view: string) => {
    if (view === 'experience') {
      setCurrentView('showcase');
      setTimeout(() => {
        const el = document.getElementById('amenities-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      return;
    }

    if (view === 'admin' && !isAuthenticated) {
      setCurrentView('admin'); // Admin gate will show AdminLoginView
    } else {
      setCurrentView(view as AppView);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectCondoForBooking = (condo: Condo) => {
    setCondo(condo);
    setCurrentView('book');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBookingConfirmed = (bookingCode: string) => {
    setActiveBookingCode(bookingCode);
    setCurrentView('confirmation');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="relative min-h-[100dvh] flex flex-col bg-[#080B10] text-slate-100 selection:bg-[#D4AF37]/30 selection:text-[#F3E5AB] overflow-x-hidden font-sans">
      {/* Fixed Ambient Film Grain Noise */}
      <div className="noise-overlay" />

      {/* Floating Island Navigation */}
      <FloatingNav
        currentView={currentView}
        onSelectView={handleNavigate}
      />

      {/* Main Content Area */}
      <main className="flex-1 relative z-10">
        {currentView === 'showcase' && (
          <ShowcaseView
            onSelectCondoForBooking={handleSelectCondoForBooking}
            onNavigateToBooking={() => handleNavigate('book')}
            onNavigateToLookup={() => handleNavigate('lookup')}
          />
        )}

        {currentView === 'book' && (
          <BookingView
            onBackToShowcase={() => handleNavigate('showcase')}
            onBookingConfirmed={handleBookingConfirmed}
          />
        )}

        {currentView === 'confirmation' && (
          <ConfirmationView
            bookingCode={activeBookingCode || 'CP-2026-98K1A'}
            onNavigateHome={() => handleNavigate('showcase')}
            onNavigateToBooking={() => handleNavigate('book')}
          />
        )}

        {currentView === 'lookup' && (
          <LookupView onBackToShowcase={() => handleNavigate('showcase')} />
        )}

        {currentView === 'admin' && (
          isAuthenticated ? (
            <AdminDashboardView onNavigateHome={() => handleNavigate('showcase')} />
          ) : (
            <AdminLoginView
              onLoginSuccess={() => setCurrentView('admin')}
              onBackToShowcase={() => handleNavigate('showcase')}
            />
          )
        )}

        {currentView === 'admin-login' && (
          <AdminLoginView
            onLoginSuccess={() => setCurrentView('admin')}
            onBackToShowcase={() => handleNavigate('showcase')}
          />
        )}
      </main>

      {/* Sticky Mobile Action Bar on Showcase */}
      {currentView === 'showcase' && (
        <MobileActionBar
          perNightRate={18500}
          onActionClick={() => handleNavigate('book')}
          actionText="Book Suite"
        />
      )}

      {/* Editorial Luxury Footer */}
      <Footer />
    </div>
  );
}

export function App() {
  return (
    <AdminAuthProvider>
      <BookingProvider>
        <AppContent />
      </BookingProvider>
    </AdminAuthProvider>
  );
}

export default App;
