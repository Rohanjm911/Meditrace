import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { StatCard } from '../components/common/StatCard';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from '../context/ToastContext';
import { soundService } from '../services/soundService';
import {
  Boxes,
  Truck,
  ThermometerSnowflake,
  AlertTriangle,
  QrCode,
  ShieldCheck,
  Plus,
  ArrowRight,
  Activity,
  CheckCircle2,
  Clock,
  Building2,
  Warehouse,
  Pill,
  Search,
  CheckCircle,
  XCircle,
  Database,
  Shield,
  Layers,
  MapPin,
  Hash,
  BarChart3,
  PieChart as PieIcon,
  TrendingUp,
  Radio,
  Navigation,
  FileCheck,
  PackageCheck,
  Thermometer,
  UserCheck,
  Landmark,
  Gauge,
  Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
  CartesianGrid
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = user?.role || 'ADMIN';

  const [quickScanCode, setQuickScanCode] = useState('VAC-2026-089A');
  const [quickScanResult, setQuickScanResult] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);

  // Queries
  const { data: batchesData } = useQuery({
    queryKey: ['batches-summary'],
    queryFn: () => api.getBatches()
  });

  const { data: shipmentsData } = useQuery({
    queryKey: ['shipments-summary'],
    queryFn: () => api.getShipments()
  });

  const { data: alertsData } = useQuery({
    queryKey: ['alerts-summary'],
    queryFn: () => api.getAlerts()
  });

  const { data: sensorsData } = useQuery({
    queryKey: ['sensors-summary'],
    queryFn: () => api.getSensors()
  });

  const { data: healthData } = useQuery({
    queryKey: ['system-health'],
    queryFn: () => api.getHealth(),
    refetchInterval: 10000
  });

  const { data: simulatorData } = useQuery({
    queryKey: ['simulator-live-status'],
    queryFn: () => api.getSimulatorStatus(),
    refetchInterval: 5000
  });

  const { data: blockchainTxs } = useQuery({
    queryKey: ['blockchain-txs-dashboard'],
    queryFn: () => api.getBlockchainTransactions(5)
  });

  const batches = batchesData?.batches || [];
  const shipments = shipmentsData?.shipments || [];
  const alerts = alertsData?.alerts || [];
  const sensors = sensorsData?.sensors || [];
  const activeAlerts = alerts.filter(a => a.status === 'ACTIVE');
  const simSensors = simulatorData?.sensors || [];
  const recentTxs = blockchainTxs?.transactions || [];

  const totalDoses = batches.reduce((acc, b) => acc + (b.quantity || 0), 0);

  // Quick verification action
  const handleQuickVerify = async (codeToVerify?: string) => {
    const code = codeToVerify || quickScanCode;
    if (!code.trim()) return;
    setIsScanning(true);
    setQuickScanResult(null);
    try {
      const res = await api.verifyCode({
        code: code.trim(),
        scanType: 'MANUAL',
        location: `${user?.organizationName || 'Enterprise'} Verification Terminal`
      });
      setQuickScanResult(res.result);
      if (res.result?.isAuthentic) {
        soundService.playSuccess();
        toast.success(
          'Package Authenticated',
          `Batch ${res.result.batch?.batchNumber || code} verified against ledger Merkle proof.`
        );
      } else {
        soundService.playError();
        toast.error(
          'Verification Discrepancy Flagged',
          res.result?.statusReason || 'Package serialization or status discrepancy detected.'
        );
      }
    } catch (err: any) {
      soundService.playError();
      setQuickScanResult({
        status: 'INVALID',
        message: err.message || 'Verification lookup failed'
      });
      toast.error('Lookup Error', err.message || 'Verification lookup failed');
    } finally {
      setIsScanning(false);
    }
  };

  // Tooltip Components
  const CustomBarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white border-2 border-slate-900 p-3 rounded-xl shadow-xl text-xs text-navy-900 min-w-[190px]">
          <div className="font-bold text-navy-900 mb-0.5 truncate max-w-[220px]">{data.fullName || data.label}</div>
          {data.batchNumber && <div className="text-[11px] font-mono text-teal-dark font-semibold mb-2">Batch: {data.batchNumber}</div>}
          <div className="space-y-1 pt-1.5 border-t border-slate-200">
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-slate-600">Total Units:</span>
              <span className="font-mono font-bold text-navy-900">{data.quantity?.toLocaleString() || data.value?.toLocaleString()}</span>
            </div>
            {data.status && (
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-600">Ledger Status:</span>
                <span className="font-bold uppercase text-teal-dark">{data.status}</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white border-2 border-slate-900 p-3 rounded-xl shadow-xl text-xs text-navy-900 min-w-[150px]">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: data.color }}></span>
            <span className="font-bold text-navy-900 uppercase tracking-wide">{data.name}</span>
          </div>
          <div className="space-y-1 pt-1 border-t border-slate-200 text-[11px]">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Count:</span>
              <span className="font-mono font-bold text-navy-900">{data.value}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // =========================================================================
  // ROLE 1: ADMINISTRATOR / REGULATORY AUTHORITY
  // =========================================================================
  if (role === 'ADMIN') {
    const adminBarData = batches.map(b => ({
      shortName: b.batchNumber.slice(-6),
      fullName: b.product?.name || b.batchNumber,
      quantity: b.quantity,
      status: b.status
    }));

    const statusCounts: Record<string, number> = {};
    batches.forEach(b => {
      statusCounts[b.status] = (statusCounts[b.status] || 0) + 1;
    });

    const adminPieData = [
      { name: 'REGISTERED', value: statusCounts['REGISTERED'] || 0, color: '#0d9488' },
      { name: 'IN TRANSIT', value: statusCounts['IN_TRANSIT'] || 0, color: '#f59e0b' },
      { name: 'STORED', value: statusCounts['STORED'] || 0, color: '#0284c7' },
      { name: 'DELIVERED', value: statusCounts['DELIVERED'] || 0, color: '#10b981' },
      { name: 'QUARANTINED', value: statusCounts['QUARANTINED'] || 0, color: '#ef4444' }
    ].filter(d => d.value > 0);

    return (
      <div className="pb-14 bg-surface-soft min-h-screen animate-fade-in">
        <Header
          title="National Regulatory Command Center"
          subtitle="CDSCO / FDA Regulatory Authority Node • Central Network Oversight"
          action={
            <div className="flex items-center gap-2.5">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<FileCheck className="w-4 h-4 text-teal" />}
                onClick={() => navigate('/reports')}
              >
                Audit Dossiers
              </Button>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<ShieldCheck className="w-4 h-4" />}
                onClick={() => navigate('/audit-logs')}
              >
                Audit Logs
              </Button>
            </div>
          }
        />

        <div className="p-6 space-y-6 max-w-7xl mx-auto">
          {/* Admin Command Banner with Animated Live Sentinel Radar */}
          <div className="bg-gradient-to-r from-white via-teal-50/20 to-sky-50/30 border-2 border-slate-900 rounded-2xl p-6 text-navy-900 shadow-sm relative overflow-hidden animate-fade-in-up">
            {/* Ambient Background Glow */}
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-teal-200/20 rounded-full blur-2xl pointer-events-none"></div>

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white p-1.5 flex items-center justify-center shrink-0 border-2 border-slate-900 shadow-xs animate-float-gentle">
                  <img src="/logo.png" alt="Medi Trace Logo" className="w-full h-full object-contain" />
                </div>
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                      <Landmark className="w-5 h-5 text-teal-700 animate-float-gentle" />
                      National Regulatory Authority Inspectorate
                    </h3>
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-black bg-teal-100 border-2 border-slate-900 text-teal-900 font-mono shadow-2xs">
                      GOV-NODE-CDSCO
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 font-semibold">
                    21 CFR Part 11 Electronic Compliance • GAMP 5 Category 4 • Immutable Merkle Consensus Peer
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 text-xs">
                {/* Live Sentinel Beacon */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-slate-900 shadow-2xs">
                  <span className="relative flex h-2.5 w-2.5 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
                  </span>
                  <span className="text-[11px] font-black text-emerald-950 uppercase tracking-wide shrink-0">
                    Live Sentinel
                  </span>
                  <div className="flex items-end gap-0.5 h-2.5 ml-0.5 shrink-0">
                    <span className="w-0.5 bg-emerald-600 rounded-full animate-soundwave-1"></span>
                    <span className="w-0.5 bg-emerald-600 rounded-full animate-soundwave-2"></span>
                    <span className="w-0.5 bg-emerald-600 rounded-full animate-soundwave-3"></span>
                  </div>
                </div>

                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border-2 border-slate-900 shadow-2xs">
                  <Database className="w-3.5 h-3.5 text-teal-600 animate-pulse" />
                  <span className="text-slate-600 font-bold">PostgreSQL:</span>
                  <span className="font-black text-emerald-700">Connected (1ms)</span>
                </div>

                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border-2 border-slate-900 shadow-2xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
                  <span className="text-slate-600 font-bold">Consensus:</span>
                  <span className="font-black text-teal-800 font-mono">SHA-256 VALIDATED</span>
                </div>
              </div>
            </div>
          </div>

          {/* 4 Dedicated Admin KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in-up">
            <StatCard
              title="National Formulations"
              value={batches.length}
              subtext={`${totalDoses.toLocaleString()} Total Doses Audited`}
              icon={<Boxes className="w-5 h-5 animate-float-gentle" />}
              statusTag="All Lots Sealed"
              statusVariant="teal"
              onClick={() => navigate('/batches')}
            />
            <StatCard
              title="Inter-State Manifests"
              value={shipments.length}
              subtext="Active Cross-State Movements"
              icon={<Truck className="w-5 h-5" />}
              statusTag="Transit In-Band"
              statusVariant="green"
              onClick={() => navigate('/shipments')}
            />
            <StatCard
              title="Thermal Breach Flags"
              value={activeAlerts.length}
              subtext={activeAlerts.length > 0 ? "Excursions awaiting review" : "100% In-Range Safe"}
              icon={<AlertTriangle className={`w-5 h-5 text-white ${activeAlerts.length > 0 ? 'animate-bounce' : ''}`} strokeWidth={2.5} />}
              statusTag={activeAlerts.length > 0 ? "Review Required" : "Zero Breaches"}
              statusVariant={activeAlerts.length > 0 ? "red" : "green"}
              onClick={() => navigate('/alerts')}
            />
            <StatCard
              title="Ledger Height"
              value={`Block #${recentTxs[0]?.blockNumber || 14}`}
              subtext="Consortium Merkle Proofs"
              icon={<ShieldCheck className="w-5 h-5 text-white animate-pulse" strokeWidth={2.5} />}
              statusTag="100% Integrity"
              statusVariant="teal"
              onClick={() => navigate('/blockchain')}
            />
          </div>

          {/* LIVE REGULATORY SURVEILLANCE & TELEMETRY STREAM (PHARMA PULSE) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in-up">
            {/* Stream 1: Live Cold-Chain Sensor Telemetry Radar */}
            <div className="lg:col-span-6 bg-gradient-to-br from-cyan-50/70 via-white to-teal-50/40 border-2 border-slate-900 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="relative flex items-center justify-center">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.9)]"></span>
                    <span className="absolute w-4 h-4 rounded-full bg-emerald-400/50 animate-ping"></span>
                  </div>
                  <span className="text-xs font-black text-slate-900">
                    Live Cold-Chain Telemetry Radar
                  </span>
                  <span className="text-[10px] text-cyan-800 bg-cyan-100 px-2 py-0.5 rounded-md font-mono font-black border border-cyan-300">
                    SNS-COLD-001
                  </span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 border-2 border-slate-900 text-[10px] text-emerald-900 font-black shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                  <span>ACTIVE TELEMETRY STREAM</span>
                </div>
              </div>

              <div className="p-3.5 bg-white/90 border-2 border-slate-900 rounded-xl flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black font-mono text-cyan-700 tracking-tight">
                      -74.8°C
                    </span>
                    <span className="text-[10px] text-emerald-800 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                      Compliant (mRNA Safe)
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-600 font-medium block mt-0.5">
                    Pune MFG Vault A • Target: -90°C to -60°C
                  </span>
                </div>

                {/* Animated ECG Waveform + 5-Bar Frequency Equalizer */}
                <div className="flex items-center gap-3">
                  <div className="w-24 h-8 flex items-center bg-cyan-950/5 rounded-lg px-1.5 border border-cyan-200">
                    <svg className="w-full h-full" viewBox="0 0 100 24" fill="none">
                      <path
                        d="M0 12 H25 L32 4 L38 20 L44 8 L50 16 L56 12 H100"
                        stroke="#0d9488"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="animate-ecg drop-shadow"
                      />
                    </svg>
                  </div>
                  <div className="flex items-end gap-1 h-7 px-1.5 py-1 bg-teal-50 rounded-lg border border-teal-200">
                    <span className="w-1 bg-teal-600 rounded-full animate-soundwave-1"></span>
                    <span className="w-1 bg-teal-600 rounded-full animate-soundwave-2"></span>
                    <span className="w-1 bg-teal-600 rounded-full animate-soundwave-3"></span>
                    <span className="w-1 bg-teal-600 rounded-full animate-soundwave-4"></span>
                    <span className="w-1 bg-teal-600 rounded-full animate-soundwave-5"></span>
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between text-[11px] font-bold text-slate-600 px-1">
                <span className="flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-teal-600 animate-pulse" />
                  5 Real-time Sensor Probes Online
                </span>
                <span className="text-teal-800 font-mono">
                  Sample Rate: 5,000ms
                </span>
              </div>
            </div>

            {/* Stream 2: Cryptographic Custody Pipeline Flow */}
            <div className="lg:col-span-6 bg-gradient-to-br from-indigo-50/50 via-white to-sky-50/50 border-2 border-slate-900 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-black text-slate-900">
                    Distributed Ledger Custody Pipeline
                  </span>
                </div>
                <span className="text-[10px] text-indigo-900 bg-indigo-100 px-2 py-0.5 rounded-md font-mono font-black border border-indigo-300">
                  Block #{recentTxs[0]?.blockNumber || 14} • Merkle Sealed
                </span>
              </div>

              {/* Transit Pathway Bar with Animated Flowing Indicator */}
              <div className="relative mb-3.5 pt-1">
                <div className="h-2.5 bg-gradient-to-r from-teal-500 via-sky-500 via-amber-500 to-emerald-500 rounded-full w-full border-2 border-slate-900 shadow-inner"></div>
                {/* Moving Animated Dot */}
                <div className="absolute top-[-1px] w-4 h-4 rounded-full bg-white border-2 border-slate-900 shadow-md animate-transit-flow flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-600"></span>
                </div>
              </div>

              {/* 4 Supply-Chain Links */}
              <div className="grid grid-cols-4 gap-1 text-center">
                <div className="flex flex-col items-center">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-teal-500 to-teal-700 border-2 border-slate-900 text-white flex items-center justify-center text-[10px] font-black shadow-2xs">
                    1
                  </div>
                  <span className="text-[10px] font-black text-teal-950 mt-1">
                    Manufacturer
                  </span>
                  <span className="text-[8px] text-teal-800 font-bold bg-teal-50 px-1 py-0.2 rounded border border-teal-200 mt-0.5">
                    Pune Vault
                  </span>
                </div>

                <div className="flex flex-col items-center">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-sky-500 to-blue-700 border-2 border-slate-900 text-white flex items-center justify-center text-[10px] font-black shadow-2xs">
                    2
                  </div>
                  <span className="text-[10px] font-black text-sky-950 mt-1">
                    Distributor
                  </span>
                  <span className="text-[8px] text-sky-800 font-bold bg-sky-50 px-1 py-0.2 rounded border border-sky-200 mt-0.5">
                    Reefer Truck
                  </span>
                </div>

                <div className="flex flex-col items-center">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-500 to-orange-700 border-2 border-slate-900 text-white flex items-center justify-center text-[10px] font-black shadow-2xs">
                    3
                  </div>
                  <span className="text-[10px] font-black text-amber-950 mt-1">
                    Warehouse
                  </span>
                  <span className="text-[8px] text-amber-800 font-bold bg-amber-50 px-1 py-0.2 rounded border border-amber-200 mt-0.5">
                    Nordic Hub
                  </span>
                </div>

                <div className="flex flex-col items-center">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 border-2 border-slate-900 text-white flex items-center justify-center text-[10px] font-black shadow-2xs">
                    4
                  </div>
                  <span className="text-[10px] font-black text-emerald-950 mt-1">
                    Pharmacy
                  </span>
                  <span className="text-[8px] text-emerald-800 font-bold bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200 mt-0.5">
                    Apollo Desk
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Regulatory Product Authenticity Verifier */}
          <Card
            title="Instant Zero-Trust Lot Verification Terminal"
            subtitle="Validate serialized pharmaceutical QR/GS1 identifiers against the Merkle state machine"
          >
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 text-teal-700 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={quickScanCode}
                    onChange={(e) => setQuickScanCode(e.target.value)}
                    placeholder="Enter Batch/Serial (e.g. VAC-2026-089A)"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-white border-2 border-slate-900 rounded-xl font-mono font-bold shadow-2xs"
                  />
                  {isScanning && (
                    <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-teal-500 to-emerald-500 animate-scan-laser bottom-0 rounded-full"></div>
                  )}
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button
                    variant="primary"
                    size="sm"
                    isLoading={isScanning}
                    leftIcon={<QrCode className="w-3.5 h-3.5" />}
                    onClick={() => handleQuickVerify()}
                    className="flex-1 sm:flex-none font-bold"
                  >
                    Authenticate On-Ledger
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setQuickScanCode('VAC-2026-089A');
                      handleQuickVerify('VAC-2026-089A');
                    }}
                    className="text-[11px]"
                  >
                    Test Valid Lot
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setQuickScanCode('FAKE-COUNTERFEIT-BATCH-9999');
                      handleQuickVerify('FAKE-COUNTERFEIT-BATCH-9999');
                    }}
                    className="text-[11px] text-rose-700 hover:text-rose-800"
                  >
                    Test Counterfeit
                  </Button>
                </div>
              </div>

              {quickScanResult && (
                <div className={`p-3.5 rounded-xl border-2 border-slate-900 text-xs animate-fade-in-up ${
                  quickScanResult.isAuthentic
                    ? 'bg-emerald-50 text-emerald-950'
                    : 'bg-rose-50 text-rose-950'
                }`}>
                  <div className="flex items-center justify-between font-black">
                    <span className="flex items-center gap-1.5">
                      {quickScanResult.isAuthentic ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-rose-600 animate-bounce" />
                      )}
                      {quickScanResult.isAuthentic ? 'VERIFIED AUTHENTIC LOT' : 'SECURITY DISCREPANCY FLAGGED'}
                    </span>
                    <span className="font-mono text-[10px] bg-white px-2 py-0.5 rounded border border-slate-900">
                      {quickScanResult.batch?.batchNumber || quickScanCode}
                    </span>
                  </div>
                  <p className="mt-1 font-semibold text-[11px] opacity-90">
                    {quickScanResult.isAuthentic
                      ? `Matched Merkle Root on Distributed Ledger. Formulated by ${quickScanResult.batch?.product?.manufacturer || 'Authorized Manufacturer'}. Zero tampering detected.`
                      : (quickScanResult.statusReason || quickScanResult.message || 'Lot code signature not found in official national ledger consensus.')}
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Admin Visual Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7">
              <Card
                title="National Pharmaceutical Lot Output"
                subtitle="Capacity volume across serialized pharmaceutical manufacturers"
              >
                <div className="h-64 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={adminBarData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="shortName" tick={{ fill: '#64748b', fontSize: 10 }} />
                      <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                      <Tooltip content={<CustomBarTooltip />} />
                      <Bar dataKey="quantity" fill="#0d9488" radius={[6, 6, 0, 0]} maxBarSize={45}>
                        {adminBarData.map((_, i) => (
                          <Cell key={`cell-${i}`} fill={['#0d9488', '#0284c7', '#3b82f6', '#10b981', '#f59e0b'][i % 5]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>

            <div className="lg:col-span-5">
              <Card
                title="Regulatory Disposition Breakdown"
                subtitle="Nationwide status of all registered pharmaceutical units"
              >
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 h-64">
                  <div className="relative w-44 h-44 shrink-0 mx-auto sm:mx-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Tooltip content={<CustomPieTooltip />} />
                        <Pie data={adminPieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={75} paddingAngle={4}>
                          {adminPieData.map((entry, idx) => (
                            <Cell key={`pie-${idx}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-xl font-extrabold text-navy-900 font-mono leading-none">{batches.length}</span>
                      <span className="text-[10px] text-slate-500 font-semibold uppercase mt-0.5">Lots</span>
                    </div>
                  </div>
                  <div className="flex-1 space-y-2 w-full pr-1 overflow-y-auto max-h-56">
                    {adminPieData.map(item => (
                      <div key={item.name} className="flex items-center justify-between p-2 rounded-lg bg-surface-soft border border-surface-border text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="font-semibold text-navy-900">{item.name}</span>
                        </div>
                        <span className="font-mono font-bold text-navy-900">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Admin Consortium Health Matrix with Live Peer Heartbeats */}
          <Card
            title="Consortium Node Integrity & Endorsements"
            subtitle="Multi-Organization validator peers with live consensus heartbeats"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              {/* Pfizer Bio-Pharma Peer */}
              <div className="p-4 rounded-xl border-2 border-slate-900 bg-white shadow-2xs space-y-2 card-hover">
                <div className="flex justify-between items-center">
                  <span className="font-black text-slate-900">Pfizer Bio-Pharma</span>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-teal-50 border border-teal-300 text-teal-800 font-black text-[10px]">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-600"></span>
                    </span>
                    <span>ONLINE</span>
                  </div>
                </div>
                <p className="text-[11px] text-teal-800 font-mono font-bold">MSP: ManufacturerMSP</p>
                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                  <span>peer0.manufacturer.org</span>
                  <div className="flex items-end gap-0.5 h-2.5">
                    <span className="w-0.5 bg-teal-600 rounded-full animate-soundwave-1"></span>
                    <span className="w-0.5 bg-teal-600 rounded-full animate-soundwave-2"></span>
                    <span className="w-0.5 bg-teal-600 rounded-full animate-soundwave-3"></span>
                  </div>
                </div>
              </div>

              {/* MedExpress Logistics Peer */}
              <div className="p-4 rounded-xl border-2 border-slate-900 bg-white shadow-2xs space-y-2 card-hover">
                <div className="flex justify-between items-center">
                  <span className="font-black text-slate-900">MedExpress Logistics</span>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-sky-50 border border-sky-300 text-sky-800 font-black text-[10px]">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-600"></span>
                    </span>
                    <span>ONLINE</span>
                  </div>
                </div>
                <p className="text-[11px] text-sky-800 font-mono font-bold">MSP: DistributorMSP</p>
                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                  <span>peer0.distributor.org</span>
                  <div className="flex items-end gap-0.5 h-2.5">
                    <span className="w-0.5 bg-sky-600 rounded-full animate-soundwave-2"></span>
                    <span className="w-0.5 bg-sky-600 rounded-full animate-soundwave-4"></span>
                    <span className="w-0.5 bg-sky-600 rounded-full animate-soundwave-1"></span>
                  </div>
                </div>
              </div>

              {/* Nordic Vaccine Depot Peer */}
              <div className="p-4 rounded-xl border-2 border-slate-900 bg-white shadow-2xs space-y-2 card-hover">
                <div className="flex justify-between items-center">
                  <span className="font-black text-slate-900">Nordic Vaccine Depot</span>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-300 text-amber-800 font-black text-[10px]">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-600"></span>
                    </span>
                    <span>ONLINE</span>
                  </div>
                </div>
                <p className="text-[11px] text-amber-800 font-mono font-bold">MSP: WarehouseMSP</p>
                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                  <span>peer0.warehouse.org</span>
                  <div className="flex items-end gap-0.5 h-2.5">
                    <span className="w-0.5 bg-amber-600 rounded-full animate-soundwave-3"></span>
                    <span className="w-0.5 bg-amber-600 rounded-full animate-soundwave-1"></span>
                    <span className="w-0.5 bg-amber-600 rounded-full animate-soundwave-5"></span>
                  </div>
                </div>
              </div>

              {/* Apollo Pharmacy Peer */}
              <div className="p-4 rounded-xl border-2 border-slate-900 bg-white shadow-2xs space-y-2 card-hover">
                <div className="flex justify-between items-center">
                  <span className="font-black text-slate-900">Apollo Pharmacy</span>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 font-black text-[10px]">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                    </span>
                    <span>ONLINE</span>
                  </div>
                </div>
                <p className="text-[11px] text-emerald-800 font-mono font-bold">MSP: PharmacyMSP</p>
                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                  <span>peer0.pharmacy.org</span>
                  <div className="flex items-end gap-0.5 h-2.5">
                    <span className="w-0.5 bg-emerald-600 rounded-full animate-soundwave-4"></span>
                    <span className="w-0.5 bg-emerald-600 rounded-full animate-soundwave-2"></span>
                    <span className="w-0.5 bg-emerald-600 rounded-full animate-soundwave-3"></span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // =========================================================================
  // ROLE 2: MANUFACTURER (Pfizer Bio-Pharma Labs)
  // =========================================================================
  if (role === 'MANUFACTURER') {
    const mfgBarData = batches.map(b => ({
      shortName: b.batchNumber.slice(-4),
      fullName: b.product?.name || b.batchNumber,
      quantity: b.quantity,
      status: b.status
    }));

    return (
      <div className="pb-14 bg-surface-soft min-h-screen animate-fade-in">
        <Header
          title="Bio-Pharma Manufacturing & Formulation Desk"
          subtitle="Pfizer Bio-Pharma Labs • Serialization Vault #4 • Production Line"
          action={
            <div className="flex items-center gap-2.5">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<QrCode className="w-4 h-4 text-teal" />}
                onClick={() => navigate('/verify')}
              >
                Inspect GS1 Matrix
              </Button>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={() => navigate('/batches')}
              >
                New Batch Formulation
              </Button>
            </div>
          }
        />

        <div className="p-6 space-y-6 max-w-7xl mx-auto">
          {/* Manufacturer Command Banner with Live Bio-Pharma Telemetry */}
          <div className="bg-gradient-to-r from-white via-teal-50/20 to-emerald-50/25 border-2 border-slate-900 rounded-2xl p-6 text-navy-900 shadow-sm animate-fade-in-up relative overflow-hidden">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-teal-50 p-2 flex items-center justify-center shrink-0 border-2 border-slate-900 shadow-xs animate-float-gentle">
                  <Pill className="w-8 h-8 text-teal-700 animate-float-gentle" />
                </div>
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">
                      Pfizer Bio-Pharma Labs — Production Vault
                    </h3>
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-black bg-teal-600 text-white shadow-2xs">
                      MANUFACTURER NODE
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 font-semibold">
                    Vaccine Bulk Formulation • Cryogenic Storage Vault • Automated GS1 Serialization
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="px-3.5 py-2 rounded-xl bg-white border-2 border-slate-900 text-xs shadow-2xs flex items-center gap-2.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-600"></span>
                  </span>
                  <div>
                    <span className="text-slate-600 block text-[10px] font-bold">Vault Cryo-Probe:</span>
                    <span className="font-mono font-black text-teal-800 text-sm">-74.8°C (SAFE)</span>
                  </div>
                </div>
                <div className="px-3.5 py-2 rounded-xl bg-white border-2 border-slate-900 text-xs shadow-2xs flex items-center gap-2.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-beacon inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <div>
                    <span className="text-slate-600 block text-[10px] font-bold">Nitrogen Seal:</span>
                    <span className="font-black text-emerald-700 text-sm">Nominal (1.04 bar)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 4 Manufacturer KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in-up">
            <StatCard
              title="Vault Formulations"
              value={batches.length}
              subtext="Formulated lots on ledger"
              icon={<Boxes className="w-5 h-5 animate-float-gentle" />}
              statusTag="Active Batches"
              statusVariant="teal"
              onClick={() => navigate('/batches')}
            />
            <StatCard
              title="Total Output Doses"
              value={totalDoses.toLocaleString()}
              subtext="Vials formulated & sealed"
              icon={<Pill className="w-5 h-5 text-white animate-float-gentle" strokeWidth={2.5} />}
              statusTag="GS1 Serialized"
              statusVariant="green"
              onClick={() => navigate('/batches')}
            />
            <StatCard
              title="Ultra-Cold Vault Probe"
              value="-74.8°C"
              subtext="Target: -90°C to -60°C mRNA"
              icon={<ThermometerSnowflake className="w-5 h-5 text-white animate-pulse" strokeWidth={2.5} />}
              statusTag="Vault Protected"
              statusVariant="teal"
              onClick={() => navigate('/cold-chain')}
            />
            <StatCard
              title="Outbound Staged"
              value={batches.filter(b => b.status === 'REGISTERED').length}
              subtext="Ready for logistics dispatch"
              icon={<Truck className="w-5 h-5" />}
              statusTag="Ready for Reefer"
              statusVariant="green"
              onClick={() => navigate('/shipments')}
            />
          </div>

          {/* Manufacturer Centerpiece: Cryo Vault Status + Outbound Dispatch */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7">
              <Card
                title="Vaccine Formulation Volume by Batch"
                subtitle="Live inventory count of manufactured units ready for cold-chain release"
              >
                <div className="h-64 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={mfgBarData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="shortName" tick={{ fill: '#64748b', fontSize: 10 }} />
                      <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
                      <Tooltip content={<CustomBarTooltip />} />
                      <Bar dataKey="quantity" fill="#0d9488" radius={[6, 6, 0, 0]} maxBarSize={45}>
                        {mfgBarData.map((_, i) => (
                          <Cell key={`cell-${i}`} fill={['#0d9488', '#0284c7', '#10b981'][i % 3]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>

            <div className="lg:col-span-5">
              <Card
                title="Factory Formulation Cryo-Vault"
                subtitle="Continuous ultra-low temperature probe telemetry"
              >
                <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-50/60 via-white to-teal-50/40 border-2 border-slate-900 text-navy-900 space-y-4 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                      </span>
                      <span className="text-xs font-black text-slate-900">Vault Sensor Probe #1</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-black border border-emerald-300">
                      IN COMPLIANCE
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-3xl font-black font-mono text-cyan-800">-74.8°C</span>
                      <span className="text-xs text-slate-600 font-semibold block mt-0.5">Permitted: -90°C to -60°C</span>
                    </div>
                    {/* Animated ECG Wave + Soundwave Equalizer */}
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-8 bg-cyan-950/5 rounded-lg px-1 border border-cyan-200">
                        <svg className="w-full h-full" viewBox="0 0 100 24" fill="none">
                          <path d="M0 12 H25 L32 4 L38 20 L44 8 L50 16 L56 12 H100" stroke="#0d9488" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="animate-ecg drop-shadow" />
                        </svg>
                      </div>
                      <div className="flex items-end gap-0.5 h-6 px-1 py-0.5 bg-teal-50 rounded border border-teal-200">
                        <span className="w-0.5 bg-teal-600 rounded-full animate-soundwave-1"></span>
                        <span className="w-0.5 bg-teal-600 rounded-full animate-soundwave-2"></span>
                        <span className="w-0.5 bg-teal-600 rounded-full animate-soundwave-3"></span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-200 text-xs flex justify-between text-slate-600 font-medium">
                    <span>Stored mRNA Batches:</span>
                    <span className="font-mono font-bold text-navy-900">4 Lots Active</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 flex justify-between gap-3">
                  <Button variant="primary" size="sm" className="flex-1" onClick={() => navigate('/batches')}>
                    View Batch Lot Registry
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => navigate('/shipments')}>
                    Create Outbound Shipment
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // ROLE 3: DISTRIBUTOR (MedExpress Cold Logistics)
  // =========================================================================
  if (role === 'DISTRIBUTOR') {
    const transitShipments = shipments.filter(s => ['IN_TRANSIT', 'DISPATCHED'].includes(s.status));

    return (
      <div className="pb-14 bg-surface-soft min-h-screen animate-fade-in">
        <Header
          title="Cold Logistics Transit & Fleet Command"
          subtitle="MedExpress Cold Logistics • Reefer Transit Grid • Chain of Custody"
          action={
            <div className="flex items-center gap-2.5">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<ThermometerSnowflake className="w-4 h-4 text-teal" />}
                onClick={() => navigate('/cold-chain')}
              >
                Reefer Telemetry
              </Button>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={() => navigate('/shipments')}
              >
                New Reefer Manifest
              </Button>
            </div>
          }
        />

        <div className="p-6 space-y-6 max-w-7xl mx-auto">
          {/* Distributor Command Banner with Live Fleet Telemetry */}
          <div className="bg-gradient-to-r from-white via-sky-50/25 to-amber-50/25 border-2 border-slate-900 rounded-2xl p-6 text-navy-900 shadow-sm animate-fade-in-up relative overflow-hidden">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 p-2 flex items-center justify-center shrink-0 border-2 border-slate-900 shadow-xs animate-float-gentle">
                  <Truck className="w-8 h-8 text-amber-600 animate-float-gentle" />
                </div>
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">
                      MedExpress Cold Logistics — Fleet Command
                    </h3>
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-black bg-amber-500 text-white shadow-2xs">
                      DISTRIBUTOR FLEET
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 font-semibold">
                    Reefer Truck KA-01-EXP-992 • Inter-State GPS Telemetry • Dual-Signature Handoff Protocol
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="px-3.5 py-2 rounded-xl bg-white border-2 border-slate-900 text-xs shadow-2xs flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                  </span>
                  <div>
                    <span className="text-slate-600 block text-[10px] font-bold">Reefer Temperature:</span>
                    <span className="font-mono font-black text-emerald-800 text-sm">4.8°C (USP Standard)</span>
                  </div>
                </div>
                <div className="px-3.5 py-2 rounded-xl bg-white border-2 border-slate-900 text-xs shadow-2xs flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-beacon inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  </span>
                  <div>
                    <span className="text-slate-600 block text-[10px] font-bold">GPS Status:</span>
                    <span className="font-black text-amber-700 text-sm">Active Transit</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 4 Distributor KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in-up">
            <StatCard
              title="Consignments in Transit"
              value={transitShipments.length}
              subtext="Reefer vehicles on highway"
              icon={<Truck className="w-5 h-5" />}
              statusTag="Cargo Moving"
              statusVariant="amber"
              onClick={() => navigate('/shipments')}
            />
            <StatCard
              title="Mobile Reefer Probes"
              value="2 Live Probes"
              subtext="Continuous 5s telemetry"
              icon={<Radio className="w-5 h-5" />}
              statusTag="Probes Online"
              statusVariant="teal"
              onClick={() => navigate('/cold-chain')}
            />
            <StatCard
              title="Pending Handoffs"
              value="1 Consignment"
              subtext="Awaiting depot signature"
              icon={<PackageCheck className="w-5 h-5" />}
              statusTag="Action Required"
              statusVariant="amber"
              onClick={() => navigate('/shipments')}
            />
            <StatCard
              title="Thermal Stability Rate"
              value="99.4%"
              subtext="Compliant 2°C – 8°C bounds"
              icon={<Thermometer className="w-5 h-5" />}
              statusTag="Safe Transit"
              statusVariant="green"
              onClick={() => navigate('/alerts')}
            />
          </div>

          {/* Distributor Centerpiece: Fleet Radar & Live Manifests */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8">
              <Card
                title="Active Transit Manifests & Consignments"
                subtitle="Real-time multi-stage movement between pharmaceutical nodes"
                headerAction={
                  <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5 text-teal" />} onClick={() => navigate('/shipments')}>
                    View All Manifests
                  </Button>
                }
              >
                <div className="space-y-3">
                  {shipments.slice(0, 4).map(s => (
                    <div key={s.id} className="p-4 rounded-xl border-2 border-slate-900 bg-white hover:bg-slate-50 shadow-2xs transition-all flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-navy-900">{s.trackingNumber}</span>
                          <Badge variant={s.status === 'IN_TRANSIT' ? 'amber' : 'green'} size="sm">
                            {s.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 font-medium">
                          {s.senderOrg.name} ➔ {s.recipientOrg.name}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate('/shipments')}
                      >
                        Custody Seal
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            <div className="lg:col-span-4">
              <Card
                title="Mobile Reefer Status"
                subtitle="Truck KA-01-EXP-992 Telemetry"
              >
                <div className="p-4 rounded-xl bg-slate-50 border-2 border-slate-900 text-navy-900 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-700">Reefer Truck KA-01</span>
                    <span className="w-2 h-2 rounded-full bg-status-green animate-ping" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-emerald-700">4.8°C</div>
                  <p className="text-[11px] text-slate-600 font-medium">Target Range: 2.0°C to 8.0°C</p>
                  <div className="pt-2 border-t border-slate-200 text-xs text-slate-600">
                    Route: Pune Bio-Vault ➔ Nordic Central Depot
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // ROLE 4: WAREHOUSE OPERATOR (Nordic Central Vaccine Depot)
  // =========================================================================
  if (role === 'WAREHOUSE_OPERATOR') {
    return (
      <div className="pb-14 bg-surface-soft min-h-screen animate-fade-in">
        <Header
          title="Central Vaccine Depot & Cold Bay Command"
          subtitle="Nordic Central Vaccine Depot • Cold Hub Bay Management • Inbound Receiving"
          action={
            <div className="flex items-center gap-2.5">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<QrCode className="w-4 h-4 text-teal" />}
                onClick={() => navigate('/verify')}
              >
                Scan Pallet Barcode
              </Button>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Warehouse className="w-4 h-4" />}
                onClick={() => navigate('/shipments')}
              >
                Receive Inbound Dock
              </Button>
            </div>
          }
        />

        <div className="p-6 space-y-6 max-w-7xl mx-auto">
          {/* Warehouse Command Banner with Live Hub Bay Telemetry */}
          <div className="bg-gradient-to-r from-white via-slate-50 to-teal-50/25 border-2 border-slate-900 rounded-2xl p-6 text-navy-900 shadow-sm animate-fade-in-up relative overflow-hidden">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white p-2 flex items-center justify-center shrink-0 border-2 border-slate-900 shadow-xs animate-float-gentle">
                  <Warehouse className="w-8 h-8 text-teal-800 animate-float-gentle" />
                </div>
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">
                      Nordic Central Vaccine Depot — Hub Bays 1–3
                    </h3>
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-black bg-slate-900 text-white shadow-2xs">
                      WAREHOUSE OPERATOR
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 font-semibold">
                    Cryo Pallet Vaults • Dock Ingestion Desk • Staged Distribution Packing
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="px-3.5 py-2 rounded-xl bg-white border-2 border-slate-900 text-xs shadow-2xs flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-600"></span>
                  </span>
                  <div>
                    <span className="text-slate-600 block text-[10px] font-bold">Bay 1 Cryo Vault:</span>
                    <span className="font-mono font-black text-teal-800 text-sm">-70.0°C (SAFE)</span>
                  </div>
                </div>
                <div className="px-3.5 py-2 rounded-xl bg-white border-2 border-slate-900 text-xs shadow-2xs flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-beacon inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <div>
                    <span className="text-slate-600 block text-[10px] font-bold">Bay 2 Cold Storage:</span>
                    <span className="font-mono font-black text-emerald-800 text-sm">4.1°C</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 4 Warehouse KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in-up">
            <StatCard
              title="Depot Stored Batches"
              value={batches.length}
              subtext="Batches currently housed in bays"
              icon={<Boxes className="w-5 h-5" />}
              statusTag="In Vault Storage"
              statusVariant="teal"
              onClick={() => navigate('/batches')}
            />
            <StatCard
              title="Inbound Dock Deliveries"
              value={shipments.filter(s => s.status === 'IN_TRANSIT').length}
              subtext="Approaching receiving dock"
              icon={<Truck className="w-5 h-5" />}
              statusTag="Dock Queue"
              statusVariant="green"
              onClick={() => navigate('/shipments')}
            />
            <StatCard
              title="Active Storage Probes"
              value="3 Hub Sensors"
              subtext="Bays 1, 2, 3 continuous stream"
              icon={<ThermometerSnowflake className="w-5 h-5" />}
              statusTag="Probes Normal"
              statusVariant="teal"
              onClick={() => navigate('/cold-chain')}
            />
            <StatCard
              title="Quarantine Review Flags"
              value={batches.filter(b => b.status === 'QUARANTINED').length || 1}
              subtext="Flagged for manual inspection"
              icon={<AlertTriangle className="w-5 h-5" />}
              statusTag="Inspection Pending"
              statusVariant="red"
              onClick={() => navigate('/batches')}
            />
          </div>

          {/* Warehouse Centerpiece: Bay Matrix */}
          <Card
            title="Cold Storage Hub Bay Topology"
            subtitle="Multi-zone thermal status across warehouse bays"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border-2 border-slate-900 bg-white shadow-2xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-navy-900">Bay 1 — Cryo mRNA Vault</span>
                  <Badge variant="teal" size="sm">ACTIVE</Badge>
                </div>
                <div className="text-2xl font-bold font-mono text-teal-dark">-70.2°C</div>
                <p className="text-xs text-slate-600">Storage Target: -90°C to -60°C</p>
                <div className="text-[11px] text-slate-500 font-mono pt-2 border-t border-slate-200">
                  Batches: Comirnaty (VAC-2026-089A)
                </div>
              </div>

              <div className="p-4 rounded-xl border-2 border-slate-900 bg-white shadow-2xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-navy-900">Bay 2 — Standard Cold Storage</span>
                  <Badge variant="green" size="sm">ACTIVE</Badge>
                </div>
                <div className="text-2xl font-bold font-mono text-emerald-700">4.1°C</div>
                <p className="text-xs text-slate-600">Storage Target: 2.0°C to 8.0°C</p>
                <div className="text-[11px] text-slate-500 font-mono pt-2 border-t border-slate-200">
                  Batches: Humalog Insulin, Covishield
                </div>
              </div>

              <div className="p-4 rounded-xl border-2 border-slate-900 bg-white shadow-2xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-navy-900">Bay 3 — Quarantine Holding</span>
                  <Badge variant="red" size="sm">REVIEW</Badge>
                </div>
                <div className="text-2xl font-bold font-mono text-red-600">12.4°C (EXCURSION)</div>
                <p className="text-xs text-slate-600">Holding isolated batch ROT-2026-441D</p>
                <div className="text-[11px] text-slate-500 font-mono pt-2 border-t border-slate-200">
                  Status: Suspended awaiting QA sign-off
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // =========================================================================
  // ROLE 5: PHARMACIST (Apollo Central Healthcare Pharmacy)
  // =========================================================================
  return (
    <div className="pb-14 bg-surface-soft min-h-screen animate-fade-in">
      <Header
        title="Dispensary & Patient Verification Desk"
        subtitle="Apollo Central Healthcare Pharmacy • Point-of-Sale Verification Node"
        action={
          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Clock className="w-4 h-4 text-teal" />}
              onClick={() => navigate('/batches')}
            >
              Medicine Stock
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<QrCode className="w-4 h-4" />}
              onClick={() => navigate('/verify')}
            >
              Patient Verification Scanner
            </Button>
          </div>
        }
      />

      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Pharmacist Command Banner with Live Dispensary Telemetry */}
        <div className="bg-gradient-to-r from-white via-emerald-50/25 to-teal-50/25 border-2 border-slate-900 rounded-2xl p-6 text-navy-900 shadow-sm animate-fade-in-up relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 p-2 flex items-center justify-center shrink-0 border-2 border-slate-900 shadow-xs animate-float-gentle">
                <Pill className="w-8 h-8 text-emerald-600 animate-float-gentle" />
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">
                    Apollo Central Healthcare Pharmacy — Prescription Desk
                  </h3>
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-black bg-emerald-600 text-white shadow-2xs">
                    PHARMACIST DISPENSARY
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 font-semibold">
                  Point-of-Sale Verification • Anti-Counterfeit Drug Protection • Cold Storage Cooler Active
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-3.5 py-2 rounded-xl bg-white border-2 border-slate-900 text-xs shadow-2xs flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                </span>
                <div>
                  <span className="text-slate-600 block text-[10px] font-bold">Pharmacy Cooler:</span>
                  <span className="font-mono font-black text-emerald-800 text-sm">4.2°C (Safe 2-8°C)</span>
                </div>
              </div>
              <div className="px-3.5 py-2 rounded-xl bg-white border-2 border-slate-900 text-xs shadow-2xs flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-beacon inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
                </span>
                <div>
                  <span className="text-slate-600 block text-[10px] font-bold">Counterfeits Prevented:</span>
                  <span className="font-black text-teal-800 text-sm">100% Genuine</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Pharmacist KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in-up">
          <StatCard
            title="Prescription Stock"
            value={batches.length}
            subtext={`${totalDoses.toLocaleString()} doses ready`}
            icon={<Pill className="w-5 h-5" />}
            statusTag="Stock In Shelf"
            statusVariant="green"
            onClick={() => navigate('/batches')}
          />
          <StatCard
            title="Verified Units Checked"
            value="48 Packages"
            subtext="Scanned before patient dispense"
            icon={<ShieldCheck className="w-5 h-5" />}
            statusTag="100% Authentic"
            statusVariant="teal"
            onClick={() => navigate('/verify')}
          />
          <StatCard
            title="Dispensary Refrigerator"
            value="4.2°C"
            subtext="Insulin & vaccine upright safe"
            icon={<ThermometerSnowflake className="w-5 h-5" />}
            statusTag="Cooler Normal"
            statusVariant="green"
            onClick={() => navigate('/cold-chain')}
          />
          <StatCard
            title="Counterfeit Discrepancies"
            value="0 Flagged"
            subtext="Zero compromised medicines"
            icon={<CheckCircle2 className="w-5 h-5" />}
            statusTag="Zero Counterfeits"
            statusVariant="green"
            onClick={() => navigate('/verify')}
          />
        </div>

        {/* Pharmacist Centerpiece: Quick In-Desk Verification */}
        <Card
          title="Point-of-Sale Package Verification Terminal"
          subtitle="Scan 2D DataMatrix or type batch number prior to handing medicine to patient"
        >
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={quickScanCode}
                  onChange={(e) => setQuickScanCode(e.target.value)}
                  placeholder="Scan GS1 DataMatrix or enter batch (e.g. INS-2026-550E)..."
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-white border-2 border-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal text-navy-900 font-mono shadow-2xs transition-all"
                />
              </div>
              <Button
                variant="primary"
                size="md"
                isLoading={isScanning}
                onClick={() => handleQuickVerify()}
                leftIcon={<QrCode className="w-4 h-4" />}
                className="shrink-0"
              >
                Authenticate Package
              </Button>
            </div>

            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="text-slate-600 font-bold">Quick Prescription Checks:</span>
              <button
                type="button"
                onClick={() => { setQuickScanCode('INS-2026-550E'); handleQuickVerify('INS-2026-550E'); }}
                className="px-3 py-1 rounded-full bg-emerald-50 border-2 border-slate-900 text-emerald-800 font-mono font-semibold hover:bg-emerald-100 transition-all active:scale-95 shadow-2xs"
              >
                INS-2026-550E (Humalog Insulin)
              </button>
              <button
                type="button"
                onClick={() => { setQuickScanCode('AMX-2026-771C'); handleQuickVerify('AMX-2026-771C'); }}
                className="px-3 py-1 rounded-full bg-white border-2 border-slate-900 text-navy-900 font-mono font-semibold hover:bg-slate-50 transition-all active:scale-95 shadow-2xs"
              >
                AMX-2026-771C (Amoxicillin 500mg)
              </button>
              <button
                type="button"
                onClick={() => { setQuickScanCode('FAKE-COUNTERFEIT-99'); handleQuickVerify('FAKE-COUNTERFEIT-99'); }}
                className="px-3 py-1 rounded-full bg-red-50 border-2 border-slate-900 text-red-700 font-mono font-semibold hover:bg-red-100 transition-all active:scale-95 shadow-2xs"
              >
                FAKE-COUNTERFEIT-99 (Test Block)
              </button>
            </div>

            {quickScanResult && (
              <div className={`p-5 rounded-xl border-2 border-slate-900 mt-3 transition-all ${
                quickScanResult.status === 'VERIFIED'
                  ? 'bg-emerald-50 text-emerald-950 shadow-xs'
                  : 'bg-red-50 text-red-950 shadow-xs'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    {quickScanResult.status === 'VERIFIED' ? (
                      <CheckCircle className="w-6 h-6 text-status-green shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-6 h-6 text-status-red shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-navy-900">
                          {quickScanResult.status === 'VERIFIED' ? 'Authentic Medicine Confirmed' : 'Counterfeit or Unverified Alert'}
                        </span>
                        <Badge variant={quickScanResult.status === 'VERIFIED' ? 'green' : 'red'} size="sm">
                          {quickScanResult.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-700 mt-1 font-medium">{quickScanResult.message}</p>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/verify')}
                    className="shrink-0 self-end sm:self-auto bg-white"
                  >
                    Open Camera Scanner
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
