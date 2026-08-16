import React, { useState, useEffect } from 'react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { condoPalApi } from '../lib/supabase';
import type { Condo, Extra, PaymentMethod, Booking } from '../types/booking';
import { AdminKPIs } from '../components/admin/AdminKPIs';
import { BookingsTable } from '../components/admin/BookingsTable';
import { CondoManager } from '../components/admin/CondoManager';
import { DateBlockerCalendar } from '../components/admin/DateBlockerCalendar';
import { ExtrasSettings } from '../components/admin/ExtrasSettings';
import { PaymentMethodsSettings } from '../components/admin/PaymentMethodsSettings';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import {
  LayoutDashboard,
  CalendarCheck,
  CalendarDays,
  Building2,
  Sparkles,
  CreditCard,
  LogOut,
  Shield,
  RefreshCcw,
} from 'lucide-react';

export type AdminTab =
  | 'overview'
  | 'bookings'
  | 'calendar'
  | 'condos'
  | 'extras'
  | 'payments';

export interface AdminDashboardViewProps {
  onNavigateHome?: () => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  onNavigateHome,
}) => {
  const { admin, logout } = useAdminAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  const [condos, setCondos] = useState<Condo[]>([]);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  // Load all system data
  const loadAdminData = async () => {
    try {
      const [condosData, extrasData, paymentsData, bookingsData] =
        await Promise.all([
          condoPalApi.getCondos(),
          condoPalApi.getExtras(),
          condoPalApi.getPaymentMethods(),
          condoPalApi.getAllBookings(),
        ]);

      setCondos(condosData);
      setExtras(extrasData);
      setPaymentMethods(paymentsData);
      setBookings(bookingsData);
    } catch (err) {
      console.error('Error loading admin dashboard data:', err);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  // Handlers for booking verification
  const handleVerifyBooking = async (bookingId: string, amount: number, notes?: string) => {
    await condoPalApi.verifyBookingPayment(bookingId, amount, notes);
    await loadAdminData();
  };

  const handleRejectBooking = async (bookingId: string, reason: string) => {
    await condoPalApi.rejectBookingPayment(bookingId, reason);
    await loadAdminData();
  };

  const handleSaveCondo = (updatedCondo: Condo) => {
    setCondos((prev) =>
      prev.map((c) => (c.id === updatedCondo.id ? updatedCondo : c))
    );
  };

  const navTabs: Array<{ id: AdminTab; label: string; icon: React.ReactNode }> = [
    { id: 'overview', label: 'Executive Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'bookings', label: 'Bookings Queue', icon: <CalendarCheck className="w-4 h-4" /> },
    { id: 'calendar', label: 'Date Blocker', icon: <CalendarDays className="w-4 h-4" /> },
    { id: 'condos', label: 'Condo Inventory', icon: <Building2 className="w-4 h-4" /> },
    { id: 'extras', label: 'Add-ons & Extras', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'payments', label: 'Payment Channels', icon: <CreditCard className="w-4 h-4" /> },
  ];

  return (
    <div className="pt-28 pb-32 px-4 sm:px-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Top Admin Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-3xl bg-[#0A0F1A]/90 border border-white/10 backdrop-blur-2xl shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Shield className="w-6 h-6 stroke-[1.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif text-lg font-bold text-slate-100">
                {admin?.full_name || 'Administrator'}
              </span>
              <Badge variant="amber" size="xs">
                {admin?.role || 'Admin'}
              </Badge>
            </div>
            <span className="text-[11px] text-slate-400">{admin?.email}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="glass"
            onClick={loadAdminData}
            icon={<RefreshCcw className="w-3.5 h-3.5" />}
            title="Refresh Data"
          >
            Refresh
          </Button>

          {onNavigateHome && (
            <Button
              size="sm"
              variant="glass"
              onClick={onNavigateHome}
            >
              Guest View
            </Button>
          )}

          <Button
            size="sm"
            variant="glass"
            onClick={logout}
            icon={<LogOut className="w-3.5 h-3.5 text-rose-400" />}
            className="hover:border-rose-500/40 hover:text-rose-300"
          >
            Sign Out
          </Button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-full bg-[#0E1524]/80 border border-white/10 overflow-x-auto">
        {navTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium tracking-wide transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-tr from-[#D4AF37] to-[#F3E5AB] text-slate-950 font-bold shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active Tab View */}
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <AdminKPIs bookings={bookings} condosCount={condos.length} />
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-xl font-semibold text-slate-100">
                  Recent Booking Activity
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveTab('bookings')}
                  className="text-xs text-[#E5C483] hover:underline cursor-pointer"
                >
                  View Full Queue →
                </button>
              </div>
              <BookingsTable
                bookings={bookings}
                onVerifyBooking={handleVerifyBooking}
                onRejectBooking={handleRejectBooking}
                onRefresh={loadAdminData}
              />
            </div>
          </div>
        )}

        {activeTab === 'bookings' && (
          <BookingsTable
            bookings={bookings}
            onVerifyBooking={handleVerifyBooking}
            onRejectBooking={handleRejectBooking}
            onRefresh={loadAdminData}
          />
        )}

        {activeTab === 'calendar' && (
          <DateBlockerCalendar
            condos={condos}
            bookings={bookings}
          />
        )}

        {activeTab === 'condos' && (
          <CondoManager
            condos={condos}
            onSaveCondo={handleSaveCondo}
          />
        )}

        {activeTab === 'extras' && (
          <ExtrasSettings
            extras={extras}
            onSaveExtras={(updated: Extra[]) => setExtras(updated)}
          />
        )}

        {activeTab === 'payments' && (
          <PaymentMethodsSettings
            paymentMethods={paymentMethods}
            onSavePaymentMethods={(updated: PaymentMethod[]) => setPaymentMethods(updated)}
          />
        )}
      </div>
    </div>
  );
};
