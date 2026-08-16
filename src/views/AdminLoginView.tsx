import React, { useState } from 'react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { DoubleBezel } from '../components/ui/DoubleBezel';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import {
  Shield,
  Lock,
  Mail,
  ArrowRight,
  KeyRound,
  AlertCircle,
} from 'lucide-react';

export interface AdminLoginViewProps {
  onLoginSuccess?: () => void;
  onBackToShowcase?: () => void;
}

export const AdminLoginView: React.FC<AdminLoginViewProps> = ({
  onLoginSuccess,
  onBackToShowcase,
}) => {
  const { login, demoLogin, isLoading, error, clearError } = useAdminAuth();

  const [email, setEmail] = useState<string>('admin@condopal.com');
  const [password, setPassword] = useState<string>('condopal2026');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    const success = await login(email, password);
    if (success && onLoginSuccess) {
      onLoginSuccess();
    }
  };

  const handleQuickDemo = () => {
    demoLogin('superadmin');
    if (onLoginSuccess) {
      onLoginSuccess();
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-28 animate-in fade-in duration-500">
      <div className="w-full max-w-md space-y-6">
        <DoubleBezel glow innerClassName="p-8 sm:p-10 space-y-6">
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
              <Shield className="w-8 h-8 stroke-[1.5]" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-[0.25em] text-[#E5C483] font-semibold block mb-1">
                Command Center
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-slate-100">
                Host & Admin Portal
              </h2>
            </div>
            <p className="text-xs text-slate-400">
              Restricted management console for property operations and verification.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              label="Admin Email"
              placeholder="admin@condopal.com"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
              required
            />

            <Input
              type="password"
              label="Access Passcode"
              placeholder="••••••••••••"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              required
            />

            {error && (
              <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              size="md"
              variant="gold"
              isLoading={isLoading}
              icon={<ArrowRight className="w-4 h-4 text-slate-950 stroke-[2.5]" />}
              className="w-full justify-center shadow-lg shadow-[#D4AF37]/20"
            >
              Sign In to Command Center
            </Button>
          </form>

          {/* Instant Demo Login Button */}
          <div className="pt-4 border-t border-white/10 space-y-3 text-center">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 block">
              For Quick Review & Evaluation:
            </span>
            <Button
              type="button"
              size="sm"
              variant="glass"
              onClick={handleQuickDemo}
              icon={<KeyRound className="w-3.5 h-3.5 text-amber-400" />}
              className="w-full justify-center border-amber-500/30 hover:border-amber-500/60"
            >
              1-Click Demo Login (Superadmin)
            </Button>
          </div>

          {onBackToShowcase && (
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={onBackToShowcase}
                className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                ← Return to Guest Experience
              </button>
            </div>
          )}
        </DoubleBezel>
      </div>
    </div>
  );
};
