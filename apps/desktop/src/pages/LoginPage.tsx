import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Lock,
  Mail,
  AlertCircle,
  CheckCircle2,
  ThermometerSnowflake,
  ShieldCheck,
  Building2,
  Truck,
  Warehouse,
  Pill,
  Activity,
  Layers,
  ChevronRight,
  Shield,
  Sparkles
} from 'lucide-react';
import { Button } from '../components/common/Button';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Permanently enforce dark theme on the document and body for LoginPage
  useEffect(() => {
    document.documentElement.classList.add('dark');
    document.body.style.backgroundColor = '#020617';
    return () => {
      document.body.style.backgroundColor = '';
    };
  }, []);

  const demoAccounts = [
    {
      role: 'Administrator',
      email: 'admin@meditrace.internal',
      pass: 'Admin@123456',
      org: 'Regulatory Authority',
      tag: 'REGULATORY',
      icon: ShieldCheck,
      iconGradient: 'from-indigo-500 via-indigo-600 to-purple-600',
      badgeClass: 'bg-indigo-950/90 text-indigo-300 border-indigo-700/80',
      hoverBorder: 'hover:border-indigo-500 hover:bg-slate-800',
      actionColor: 'text-indigo-400 group-hover:text-indigo-300'
    },
    {
      role: 'Manufacturer',
      email: 'manufacturer@pfizer-demo.com',
      pass: 'Mfg@123456',
      org: 'Pfizer Bio-Pharma',
      tag: 'PRODUCTION',
      icon: Building2,
      iconGradient: 'from-teal-500 via-teal-600 to-emerald-600',
      badgeClass: 'bg-teal-950/90 text-teal-300 border-teal-700/80',
      hoverBorder: 'hover:border-teal-500 hover:bg-slate-800',
      actionColor: 'text-teal-400 group-hover:text-teal-300'
    },
    {
      role: 'Distributor',
      email: 'distributor@medexpress.com',
      pass: 'Dist@123456',
      org: 'MedExpress Logistics',
      tag: 'LOGISTICS',
      icon: Truck,
      iconGradient: 'from-sky-500 via-sky-600 to-blue-600',
      badgeClass: 'bg-sky-950/90 text-sky-300 border-sky-700/80',
      hoverBorder: 'hover:border-sky-500 hover:bg-slate-800',
      actionColor: 'text-sky-400 group-hover:text-sky-300'
    },
    {
      role: 'Warehouse',
      email: 'warehouse@nordic-hub.com',
      pass: 'Wh@123456',
      org: 'Nordic Cold Depot',
      tag: 'COLD-DEPOT',
      icon: Warehouse,
      iconGradient: 'from-amber-500 via-amber-600 to-orange-600',
      badgeClass: 'bg-amber-950/90 text-amber-300 border-amber-700/80',
      hoverBorder: 'hover:border-amber-500 hover:bg-slate-800',
      actionColor: 'text-amber-400 group-hover:text-amber-300'
    },
    {
      role: 'Pharmacist',
      email: 'pharmacist@apollo-central.com',
      pass: 'Pharm@123456',
      org: 'Apollo Pharmacy',
      tag: 'DISPENSARY',
      icon: Pill,
      iconGradient: 'from-emerald-500 via-emerald-600 to-teal-600',
      badgeClass: 'bg-emerald-950/90 text-emerald-300 border-emerald-700/80',
      hoverBorder: 'hover:border-emerald-500 hover:bg-slate-800',
      actionColor: 'text-emerald-400 group-hover:text-emerald-300'
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email.trim(), password);
      sessionStorage.setItem('meditrace_just_logged_in', 'true');
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (accEmail: string, accPass: string) => {
    setEmail(accEmail);
    setPassword(accPass);
    setError(null);
    setLoading(true);

    try {
      await login(accEmail, accPass);
      sessionStorage.setItem('meditrace_just_logged_in', 'true');
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 dark text-slate-100 selection:bg-teal-500 selection:text-white flex items-center justify-center p-2.5 lg:p-4 relative overflow-hidden">
      {/* Ambient Glow Orbs */}
      <div className="absolute top-1/4 left-1/6 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none -z-0"></div>
      <div className="absolute bottom-1/4 right-1/6 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -z-0"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-3xl pointer-events-none -z-0"></div>

      <div className="w-full max-w-4xl bg-slate-900 border-2 border-slate-700/80 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95)] rounded-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 relative z-10 backdrop-blur-xl">
        
        {/* ============================================================== */}
        {/* LEFT COLUMN: PHARMACY COLD-CHAIN & PROVENANCE SHOWCASE */}
        {/* ============================================================== */}
        <div className="lg:col-span-7 p-4 lg:p-5 bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 border-b lg:border-b-0 lg:border-r-2 border-slate-800 flex flex-col justify-between relative overflow-hidden">
          
          {/* Brand Header */}
          <div className="relative z-10">
            <div className="flex items-center gap-2.5 mb-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-slate-700 p-1 shadow-sm flex items-center justify-center shrink-0">
                <img
                  src="/logo.png"
                  alt="Medi Trace Official Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="text-lg font-black tracking-tight text-white">
                    Medi Trace
                  </h1>
                  <span className="text-[9px] font-black uppercase px-2 py-0.2 rounded-full bg-teal-950 text-teal-300 border border-teal-700/80">
                    Pharma v2.4
                  </span>
                </div>
                <p className="text-[11px] font-bold text-slate-400">
                  Every Batch. Every Journey. Verified.
                </p>
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border-2 border-slate-700 text-teal-300 text-[10px] font-bold shadow-sm">
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
              <span>Pharmaceutical Authenticity • Cold-Chain IoT • Cryptographic Ledger</span>
            </div>
          </div>

          {/* Pharmaceutical Cold-Chain & Supply-Chain Module */}
          <div className="my-2.5 space-y-2.5 relative z-10">
            
            {/* Live Cold-Chain Sensor Card with Animated ECG Wave */}
            <div className="bg-gradient-to-br from-slate-850 via-slate-900 to-cyan-950/30 border-2 border-slate-700/80 rounded-xl p-3 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <div className="relative flex items-center justify-center">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.9)]"></span>
                    <span className="absolute w-3.5 h-3.5 rounded-full bg-emerald-400/50 animate-ping"></span>
                  </div>
                  <span className="text-[11px] font-black text-slate-200">
                    ULT Vault Sensor Probe #1
                  </span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-black border text-cyan-300 bg-cyan-950/80 border-cyan-800">
                    SNS-COLD-001
                  </span>
                </div>
                <div className="flex items-center gap-1 px-2 py-0.2 rounded-full border-2 bg-emerald-950/90 border-emerald-700/80 text-emerald-300 text-[9px] font-black shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>IN COMPLIANCE</span>
                </div>
              </div>

              {/* Temperature Reading & Animated ECG/Waveform */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black font-mono tracking-tight text-cyan-400">
                      -74.8°C
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded border text-slate-300 bg-slate-800 border-slate-700">
                      Target: -90°C to -60°C
                    </span>
                  </div>
                  <div className="text-[10px] font-semibold flex items-center gap-1 px-2 py-0.5 rounded border w-fit mt-0.5 text-teal-300 bg-teal-950/60 border-teal-800/70">
                    <ThermometerSnowflake className="w-3 h-3 text-teal-400 shrink-0" />
                    <span>Ultra-Low Temp mRNA Vaccine Safe</span>
                  </div>
                </div>

                <div className="w-20 h-7 flex items-center rounded-lg px-1.5 border bg-cyan-950/50 border-cyan-800/60">
                  <svg className="w-full h-full" viewBox="0 0 100 24" fill="none">
                    <path
                      d="M0 12 H25 L32 4 L38 20 L44 8 L50 16 L56 12 H100"
                      stroke="#2dd4bf"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="animate-ecg"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Supply-Chain Transit Pathway with Moving Pulse Animation */}
            <div className="bg-gradient-to-br from-slate-850 via-slate-900 to-indigo-950/30 border-2 border-slate-700/80 rounded-xl p-3 shadow-sm">
              <div className="flex items-center justify-between text-[11px] font-bold mb-2 text-slate-200">
                <span className="flex items-center gap-1 font-black">
                  <Activity className="w-3.5 h-3.5 text-indigo-400" />
                  Supply-Chain Custody Flow
                </span>
                <span className="text-[9px] px-2 py-0.2 rounded font-mono font-black border text-indigo-300 bg-indigo-950/80 border-indigo-800">
                  SHA-256 Ledger Sealed
                </span>
              </div>

              {/* Transit Pathway Bar */}
              <div className="relative mb-2">
                <div className="h-2 bg-gradient-to-r from-teal-500 via-sky-500 via-amber-500 to-emerald-500 rounded-full w-full border-2 border-slate-700 shadow-inner"></div>
                <div className="absolute top-[-3px] w-3.5 h-3.5 rounded-full border-2 bg-slate-900 border-teal-400 shadow-md animate-transit-flow flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
                </div>
              </div>

              {/* 4 Pipeline Milestones */}
              <div className="grid grid-cols-4 gap-1 text-center">
                <div className="flex flex-col items-center">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-teal-500 to-teal-700 border border-slate-700 text-white flex items-center justify-center text-[9px] font-black shadow-2xs">
                    1
                  </div>
                  <span className="text-[9px] font-black mt-0.5 text-teal-300">
                    Mfg
                  </span>
                  <span className="text-[8px] font-bold px-1 py-0.2 rounded border text-teal-300 bg-teal-950/80 border-teal-800">
                    Pune
                  </span>
                </div>

                <div className="flex flex-col items-center">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-sky-500 to-blue-700 border border-slate-700 text-white flex items-center justify-center text-[9px] font-black shadow-2xs">
                    2
                  </div>
                  <span className="text-[9px] font-black mt-0.5 text-sky-300">
                    Dist
                  </span>
                  <span className="text-[8px] font-bold px-1 py-0.2 rounded border text-sky-300 bg-sky-950/80 border-sky-850">
                    Reefer
                  </span>
                </div>

                <div className="flex flex-col items-center">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-500 to-orange-700 border border-slate-700 text-white flex items-center justify-center text-[9px] font-black shadow-2xs">
                    3
                  </div>
                  <span className="text-[9px] font-black mt-0.5 text-amber-300">
                    Wh
                  </span>
                  <span className="text-[8px] font-bold px-1 py-0.2 rounded border text-amber-300 bg-amber-950/80 border-amber-800">
                    Nordic
                  </span>
                </div>

                <div className="flex flex-col items-center">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 border border-slate-700 text-white flex items-center justify-center text-[9px] font-black shadow-2xs">
                    4
                  </div>
                  <span className="text-[9px] font-black mt-0.5 text-emerald-300">
                    Pharm
                  </span>
                  <span className="text-[8px] font-bold px-1 py-0.2 rounded border text-emerald-300 bg-emerald-950/80 border-emerald-800">
                    Apollo
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Feature Badges */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-lg border-2 bg-slate-800/80 border-slate-700/80 flex items-center gap-2 shadow-sm">
                <div className="w-6 h-6 rounded-md bg-gradient-to-br from-sky-500 to-blue-600 border border-slate-700 text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <Pill className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-black truncate text-slate-200">
                    GS1 DataMatrix & QR
                  </div>
                  <div className="text-[8px] font-bold truncate text-sky-400">
                    Batch Verification
                  </div>
                </div>
              </div>

              <div className="p-2 rounded-lg border-2 bg-slate-800/80 border-slate-700/80 flex items-center gap-2 shadow-sm">
                <div className="w-6 h-6 rounded-md bg-gradient-to-br from-purple-500 to-indigo-600 border border-slate-700 text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <Layers className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-black truncate text-slate-200">
                    Ledger Integrity
                  </div>
                  <div className="text-[8px] font-bold truncate text-indigo-400">
                    Audit Trail Proofs
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Footer note */}
          <div className="text-[10px] font-bold pt-2 border-t-2 border-slate-800 text-slate-400 flex items-center justify-between relative z-10">
            <span className="px-1.5 py-0.2 rounded border bg-slate-800 text-slate-300 border-slate-700">
              Windows Desktop Native
            </span>
            <span className="px-1.5 py-0.2 rounded font-mono border bg-blue-950/80 text-blue-300 border-blue-800">
              PostgreSQL 18 Engine
            </span>
          </div>
        </div>

        {/* ============================================================== */}
        {/* RIGHT COLUMN: ACCESS AUTHENTICATION & COLOR-CODED ROLE SELECTOR */}
        {/* ============================================================== */}
        <div className="lg:col-span-5 p-4 lg:p-5 bg-slate-900 flex flex-col justify-between">
          
          {/* Top Form Header */}
          <div>
            <div className="mb-2.5">
              <div className="flex items-center justify-between mb-0.5">
                <h2 className="text-base font-black leading-tight text-white">
                  Access Authentication
                </h2>
                <span className="text-[8px] font-black uppercase px-1.5 py-0.2 rounded-full border bg-emerald-950 text-emerald-300 border-emerald-700/80">
                  TLS / ARGON2ID
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-400">
                Sign in with credentials or choose a quick role below.
              </p>
            </div>

            {error && (
              <div className="mb-2.5 p-2 rounded-lg border-2 flex items-start gap-1.5 text-[11px] font-bold shadow-2xs bg-rose-950/80 border-rose-700/80 text-rose-300">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-500" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-2">
              <div>
                <label className="block text-[10px] font-black mb-0.5 text-slate-200">
                  Enterprise Email
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 absolute left-2.5 top-2.5 z-10 text-teal-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@organization.com"
                    className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold shadow-inner bg-slate-800 border-2 border-slate-700 text-slate-100 placeholder:text-slate-500 dark-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black mb-0.5 text-slate-200">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 absolute left-2.5 top-2.5 z-10 text-teal-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold shadow-inner bg-slate-800 border-2 border-slate-700 text-slate-100 placeholder:text-slate-500 dark-input"
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={loading}
                className="w-full font-black text-xs py-2 mt-0.5 shadow-md rounded-xl transition-all bg-gradient-to-r from-teal-500 via-teal-600 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white border-2 border-slate-700"
              >
                Sign In to Medi Trace
              </Button>
            </form>
          </div>

          {/* Quick Role Switcher (Compact 1-Click Role Switcher Grid) */}
          <div className="mt-3 pt-2.5 border-t-2 border-slate-800">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-black uppercase tracking-wide flex items-center gap-1 text-slate-200">
                <Sparkles className="w-3 h-3 text-amber-500" />
                Quick Role Switcher
              </span>
              <span className="text-[8.5px] px-1.5 py-0.2 rounded-full font-black border text-teal-300 bg-teal-950 border-teal-800">
                1-Click Sign-In
              </span>
            </div>

            <div className="space-y-1">
              {demoAccounts.map(acc => {
                const IconComponent = acc.icon;

                return (
                  <button
                    key={acc.role}
                    type="button"
                    disabled={loading}
                    onClick={() => handleQuickLogin(acc.email, acc.pass)}
                    className={`w-full flex items-center justify-between px-2.5 py-1 rounded-lg border-2 border-slate-700/80 bg-slate-800/80 ${acc.hoverBorder} active:scale-98 transition-all text-left group disabled:opacity-50 shadow-2xs`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {/* Gradient Icon Badge */}
                      <div className={`w-5.5 h-5.5 rounded-md bg-gradient-to-br ${acc.iconGradient} text-white flex items-center justify-center shrink-0 border border-slate-600 shadow-2xs group-hover:scale-105 transition-transform`}>
                        <IconComponent className="w-3 h-3" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="font-black text-[11px] truncate text-slate-100">
                            {acc.role}
                          </span>
                          <span className={`text-[7.5px] font-black uppercase px-1 py-0 rounded border ${acc.badgeClass}`}>
                            {acc.tag}
                          </span>
                        </div>
                        <div className="text-[8.5px] font-medium truncate text-slate-400">
                          {acc.org}
                        </div>
                      </div>
                    </div>

                    <div className={`flex items-center gap-0.5 text-[10px] font-black shrink-0 pl-1 ${acc.actionColor}`}>
                      <span>Login</span>
                      <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom Security Info */}
          <div className="mt-2 pt-1.5 border-t-2 border-slate-800 text-center">
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[9px] font-bold bg-slate-800 border-slate-700 text-slate-400">
              <Shield className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
              <span>Argon2id Hashed • JWT Validated • Anti-Counterfeit Platform</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};


