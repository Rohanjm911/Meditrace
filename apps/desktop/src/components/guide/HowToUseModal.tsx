import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { soundService } from '../../services/soundService';
import {
  Boxes,
  Truck,
  ThermometerSnowflake,
  ShieldCheck,
  QrCode,
  FileText,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Layers,
  Copy,
  Check,
  Building2,
  Warehouse,
  Pill,
  Radio,
  FileCheck,
  Landmark,
  Camera,
  Play
} from 'lucide-react';

interface HowToUseModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: number;
}

export const HowToUseModal: React.FC<HowToUseModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 0
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [copiedBatch, setCopiedBatch] = useState<string | null>(null);
  const [dontShowAgain, setDontShowAgain] = useState<boolean>(() => {
    return localStorage.getItem('meditrace_disable_login_guide') === 'true';
  });

  if (!isOpen) return null;

  const handleToggleDontShowAgain = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setDontShowAgain(checked);
    if (checked) {
      localStorage.setItem('meditrace_disable_login_guide', 'true');
    } else {
      localStorage.removeItem('meditrace_disable_login_guide');
    }
  };

  const handleClose = () => {
    soundService.playModalClose();
    onClose();
  };

  const handleCopyCode = (code: string) => {
    soundService.playClick();
    navigator.clipboard.writeText(code);
    setCopiedBatch(code);
    setTimeout(() => setCopiedBatch(null), 2000);
  };

  const handleGoToVerifyWithPreset = (code: string) => {
    soundService.playSuccess();
    onClose();
    navigate(`/verify?batch=${encodeURIComponent(code)}`);
  };

  const tabs = [
    { id: 0, label: '1. Platform Overview', icon: Layers },
    { id: 1, label: '2. Optical Scanner & Verification', icon: QrCode },
    { id: 2, label: '3. Cold-Chain IoT & Alerts', icon: ThermometerSnowflake },
    { id: 3, label: '4. Roles & PDF Dossiers', icon: FileCheck }
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Welcome to Medi Trace — Operational User Guide"
      subtitle="Every Batch. Every Journey. Verified. • End-to-end operational guide & interactive quick-start"
      maxWidth="4xl"
    >
      <div className="space-y-5 text-slate-900">
        {/* Navigation Tabs Header */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 border-2 border-slate-900 rounded-xl overflow-x-auto no-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                soundService.playClick();
                setActiveTab(tab.id);
              }}
              className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-teal-600 text-white shadow-sm ring-1 ring-teal-400 border border-slate-900'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
            >
              <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-white' : 'text-teal-600'}`} />
              <span className="truncate">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab 1: Platform Overview & End-to-End Supply Chain Flow */}
        {activeTab === 0 && (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-gradient-to-r from-teal-50 via-sky-50 to-emerald-50 border-2 border-slate-900 rounded-xl p-4 flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 border-2 border-slate-900 shadow-xs">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900">
                  How Medi Trace Guarantees Pharmaceutical Authenticity
                </h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Medi Trace tracks medications through an unbroken chain of custody. Every batch is cryptographically anchored to a distributed ledger at manufacturing, monitored continuously by active IoT probes during transit, and verified down to individual retail unit packages before dispensing.
                </p>
              </div>
            </div>

            {/* 4-Stage Supply Chain Interactive Flow */}
            <div className="space-y-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                The 4-Stage Verified Supply Chain Journey:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Stage 1 */}
                <div className="bg-white border-2 border-slate-900 rounded-xl p-3.5 shadow-2xs space-y-2 relative">
                  <div className="flex items-center justify-between">
                    <span className="w-6 h-6 rounded-full bg-teal-600 text-white border-2 border-slate-900 text-xs font-black flex items-center justify-center">
                      1
                    </span>
                    <Badge variant="teal">Formulate</Badge>
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-teal-600" />
                      Manufacturer
                    </h5>
                    <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                      Formulates medicine lot, generates 2D GS1 DataMatrix serialization, and anchors SHA-256 state hash into a blockchain block.
                    </p>
                  </div>
                  <div className="pt-1.5 border-t border-slate-100 text-[10px] text-teal-800 font-mono font-bold">
                    Tab: /batches
                  </div>
                </div>

                {/* Stage 2 */}
                <div className="bg-white border-2 border-slate-900 rounded-xl p-3.5 shadow-2xs space-y-2 relative">
                  <div className="flex items-center justify-between">
                    <span className="w-6 h-6 rounded-full bg-sky-600 text-white border-2 border-slate-900 text-xs font-black flex items-center justify-center">
                      2
                    </span>
                    <Badge variant="teal">Transit</Badge>
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-sky-600" />
                      Reefer Carrier
                    </h5>
                    <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                      Dispatches cargo with paired IoT probe. Live telemetry streams temperature (2°C–8°C / ULT -90°C), GPS coordinates, and alerts.
                    </p>
                  </div>
                  <div className="pt-1.5 border-t border-slate-100 text-[10px] text-sky-800 font-mono font-bold">
                    Tab: /shipments & /cold-chain
                  </div>
                </div>

                {/* Stage 3 */}
                <div className="bg-white border-2 border-slate-900 rounded-xl p-3.5 shadow-2xs space-y-2 relative">
                  <div className="flex items-center justify-between">
                    <span className="w-6 h-6 rounded-full bg-amber-600 text-white border-2 border-slate-900 text-xs font-black flex items-center justify-center">
                      3
                    </span>
                    <Badge variant="amber">Storage</Badge>
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      <Warehouse className="w-3.5 h-3.5 text-amber-600" />
                      Central Depot
                    </h5>
                    <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                      Inspects package seal integrity, signs dual-signature custody handoff, and stages stock inside monitored cryo-vaults.
                    </p>
                  </div>
                  <div className="pt-1.5 border-t border-slate-100 text-[10px] text-amber-800 font-mono font-bold">
                    Tab: /handoffs & /alerts
                  </div>
                </div>

                {/* Stage 4 */}
                <div className="bg-white border-2 border-slate-900 rounded-xl p-3.5 shadow-2xs space-y-2 relative">
                  <div className="flex items-center justify-between">
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white border-2 border-slate-900 text-xs font-black flex items-center justify-center">
                      4
                    </span>
                    <Badge variant="green">Dispense</Badge>
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      <Pill className="w-3.5 h-3.5 text-emerald-600" />
                      Dispensary
                    </h5>
                    <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                      Pharmacist performs optical webcam or barcode scan. Zero-trust ledger verification confirms authenticity before patient release.
                    </p>
                  </div>
                  <div className="pt-1.5 border-t border-slate-100 text-[10px] text-emerald-800 font-mono font-bold">
                    Tab: /verify
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Tips Box */}
            <div className="p-3.5 bg-slate-50 border-2 border-slate-900 rounded-xl text-xs space-y-1.5">
              <span className="font-black text-slate-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-teal-600" />
                Key Navigation Tips:
              </span>
              <ul className="list-disc list-inside text-slate-600 space-y-1 pl-1">
                <li>Use the collapsible <strong>left navigation sidebar</strong> to alternate between Operations, Quality, and Reports.</li>
                <li>The <strong>sticky top header</strong> keeps your organization identity, sound toggle, notification drawer, and this user guide accessible on every page.</li>
                <li>All data updates automatically in real-time via live polling and WebSocket telemetry feeds.</li>
              </ul>
            </div>
          </div>
        )}

        {/* Tab 2: Optical Scanner & Anti-Counterfeit Verification */}
        {activeTab === 1 && (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-white border-2 border-slate-900 rounded-xl p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-teal-600" />
                    How to Verify a Medication Package (`/verify`)
                  </h4>
                  <p className="text-xs text-slate-600 mt-1">
                    You can verify any pharmaceutical lot using your computer webcam, an external USB barcode gun, or by entering the GS1 payload manually.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="primary"
                  leftIcon={<Camera className="w-3.5 h-3.5" />}
                  onClick={() => {
                    handleClose();
                    navigate('/verify');
                  }}
                >
                  Open Scanner Tab
                </Button>
              </div>

              {/* 2 Ways to Verify Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                <div className="p-3 bg-teal-50/50 border-2 border-slate-900 rounded-lg space-y-1.5">
                  <span className="text-xs font-black text-teal-950 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-teal-700" />
                    Method A: Optical Webcam Scanner
                  </span>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Click <strong>Camera Input</strong>, accept the 21 CFR Part 11 security permission dialog, and present the physical GS1 DataMatrix or QR code to the holographic viewfinder.
                  </p>
                </div>

                <div className="p-3 bg-sky-50/50 border-2 border-slate-900 rounded-lg space-y-1.5">
                  <span className="text-xs font-black text-sky-950 flex items-center gap-1.5">
                    <Boxes className="w-4 h-4 text-sky-700" />
                    Method B: Manual Code & GS1 Payload
                  </span>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Paste raw batch numbers (e.g. <code className="font-mono text-slate-800 bg-white px-1 py-0.5 rounded border border-slate-300">VAC-2026-089A</code>) or GS1 strings with Application Identifiers: AI `(01)` GTIN, AI `(17)` Expiry, AI `(10)` Batch, AI `(21)` Serial.
                  </p>
                </div>
              </div>

              {/* Zero-Trust Decision Matrix */}
              <div className="pt-2 border-t border-slate-200">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 block mb-2">
                  Understanding Verification Outcomes:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg border-2 border-slate-900 bg-emerald-50 text-emerald-950">
                    <div className="font-black flex items-center gap-1.5 text-emerald-800">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      VERIFIED AUTHENTIC
                    </div>
                    <p className="text-[10px] text-slate-600 mt-1">
                      Hash matches Merkle block. In valid date, scan count ≤ 4. Approved to dispense.
                    </p>
                  </div>

                  <div className="p-2.5 rounded-lg border-2 border-slate-900 bg-amber-50 text-amber-950">
                    <div className="font-black flex items-center gap-1.5 text-amber-800">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      DUPLICATE SUSPICIOUS
                    </div>
                    <p className="text-[10px] text-slate-600 mt-1">
                      Valid signature, but scanned &gt; 4 times. Potential counterfeit clone package.
                    </p>
                  </div>

                  <div className="p-2.5 rounded-lg border-2 border-slate-900 bg-rose-50 text-rose-950">
                    <div className="font-black flex items-center gap-1.5 text-rose-800">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      TAMPER DETECTED
                    </div>
                    <p className="text-[10px] text-slate-600 mt-1">
                      Payload data has been altered. Checksum mismatches distributed ledger.
                    </p>
                  </div>

                  <div className="p-2.5 rounded-lg border-2 border-slate-900 bg-slate-100 text-slate-950">
                    <div className="font-black flex items-center gap-1.5 text-slate-800">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      INVALID / COUNTERFEIT
                    </div>
                    <p className="text-[10px] text-slate-600 mt-1">
                      Unregistered lot. Rejected immediately by zero-trust security gate.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Live 1-Click Testing Batches Box */}
            <div className="bg-slate-50 border-2 border-slate-900 rounded-xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <Play className="w-3.5 h-3.5 text-teal-600 fill-teal-600" />
                  Try These Seed Batches Instantly:
                </span>
                <span className="text-[10px] text-slate-500 font-medium">Click any batch to test or copy:</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="p-2 bg-white border-2 border-slate-900 rounded-lg flex items-center justify-between">
                  <div>
                    <span className="font-mono font-bold text-xs text-slate-900 block">VAC-2026-089A</span>
                    <span className="text-[10px] text-emerald-700 font-bold">Comirnaty (Authentic COVID Vaccine)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleCopyCode('VAC-2026-089A')}
                      className="p-1 hover:bg-slate-100 rounded text-slate-500"
                      title="Copy code"
                    >
                      {copiedBatch === 'VAC-2026-089A' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => handleGoToVerifyWithPreset('VAC-2026-089A')}
                      className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-600 text-white border border-slate-900"
                    >
                      Verify
                    </button>
                  </div>
                </div>

                <div className="p-2 bg-white border-2 border-slate-900 rounded-lg flex items-center justify-between">
                  <div>
                    <span className="font-mono font-bold text-xs text-slate-900 block">ROT-2026-441D</span>
                    <span className="text-[10px] text-rose-700 font-bold">Rotarix (Thermal Excursion Flagged)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleCopyCode('ROT-2026-441D')}
                      className="p-1 hover:bg-slate-100 rounded text-slate-500"
                      title="Copy code"
                    >
                      {copiedBatch === 'ROT-2026-441D' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => handleGoToVerifyWithPreset('ROT-2026-441D')}
                      className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-600 text-white border border-slate-900"
                    >
                      Verify
                    </button>
                  </div>
                </div>

                <div className="p-2 bg-white border-2 border-slate-900 rounded-lg flex items-center justify-between">
                  <div>
                    <span className="font-mono font-bold text-xs text-slate-900 block">VAX-2026-104B</span>
                    <span className="text-[10px] text-sky-700 font-bold">GS1 DataMatrix Format In-Transit</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleCopyCode('VAX-2026-104B')}
                      className="p-1 hover:bg-slate-100 rounded text-slate-500"
                      title="Copy code"
                    >
                      {copiedBatch === 'VAX-2026-104B' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => handleGoToVerifyWithPreset('VAX-2026-104B')}
                      className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-600 text-white border border-slate-900"
                    >
                      Verify
                    </button>
                  </div>
                </div>

                <div className="p-2 bg-white border-2 border-slate-900 rounded-lg flex items-center justify-between">
                  <div>
                    <span className="font-mono font-bold text-xs text-slate-900 block">FAKE-COUNTERFEIT-BATCH-9999</span>
                    <span className="text-[10px] text-slate-600 font-bold">Unregistered Clone (Rejected)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleCopyCode('FAKE-COUNTERFEIT-BATCH-9999')}
                      className="p-1 hover:bg-slate-100 rounded text-slate-500"
                      title="Copy code"
                    >
                      {copiedBatch === 'FAKE-COUNTERFEIT-BATCH-9999' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => handleGoToVerifyWithPreset('FAKE-COUNTERFEIT-BATCH-9999')}
                      className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-600 text-white border border-slate-900"
                    >
                      Verify
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Cold-Chain Telemetry & Excursion Alerts */}
        {activeTab === 2 && (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-white border-2 border-slate-900 rounded-xl p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <ThermometerSnowflake className="w-4 h-4 text-cyan-600" />
                    Cold-Chain Telemetry & Live GIS Route Map (`/cold-chain`)
                  </h4>
                  <p className="text-xs text-slate-600 mt-1">
                    Continuous environmental tracking for vaccines and biologics across storage vaults and transit reefers.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="primary"
                  leftIcon={<ThermometerSnowflake className="w-3.5 h-3.5" />}
                  onClick={() => {
                    handleClose();
                    navigate('/cold-chain');
                  }}
                >
                  View Live Route Map
                </Button>
              </div>

              {/* Cold-Chain Features */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 text-xs">
                <div className="p-3 bg-cyan-50/50 border-2 border-slate-900 rounded-lg space-y-1.5">
                  <span className="font-black text-cyan-950 flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-cyan-700 animate-pulse" />
                    5 Active IoT Probes
                  </span>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Monitors Ultra-Low Temperature (ULT) vaults down to <strong className="text-slate-800">-90°C</strong> and standard refrigerated transit reefers (<strong className="text-slate-800">2°C to 8°C</strong>).
                  </p>
                </div>

                <div className="p-3 bg-teal-50/50 border-2 border-slate-900 rounded-lg space-y-1.5">
                  <span className="font-black text-teal-950 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-teal-700" />
                    Topological Route Radar
                  </span>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Visualizes cargo transit along the <strong>Pune ➔ Mumbai ➔ Surat ➔ Ahmedabad</strong> logistics corridor with animated GPS waypoint vectors.
                  </p>
                </div>

                <div className="p-3 bg-amber-50/50 border-2 border-slate-900 rounded-lg space-y-1.5">
                  <span className="font-black text-amber-950 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                    Excursion Triage (`/alerts`)
                  </span>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Automated alarms when temperatures breach thresholds. Complete CAPA resolution workflows with QA notes and MKT budget verification.
                  </p>
                </div>
              </div>

              {/* Simulation Controls Guide */}
              <div className="p-3 bg-slate-50 border-2 border-slate-900 rounded-lg space-y-1.5">
                <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <Play className="w-3.5 h-3.5 text-teal-600 fill-teal-600" />
                  Testing Real-Time Excursion Scenarios:
                </span>
                <p className="text-[11px] text-slate-600">
                  On the <strong>Cold-Chain Monitoring</strong> tab (`/cold-chain`), use the interactive simulation buttons in the top banner:
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="px-2 py-1 bg-white border border-slate-900 rounded text-[11px] font-bold text-rose-700">
                    🔴 Trigger Excursion (&gt;8°C) — Causes temperature spike & alarm
                  </span>
                  <span className="px-2 py-1 bg-white border border-slate-900 rounded text-[11px] font-bold text-emerald-700">
                    🟢 Stabilize (4°C) — Returns sensor to compliant corridor
                  </span>
                  <span className="px-2 py-1 bg-white border border-slate-900 rounded text-[11px] font-bold text-amber-700">
                    ⚡ Drain Battery — Simulates hardware power failure
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Roles & PDF Dossiers */}
        {activeTab === 3 && (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-white border-2 border-slate-900 rounded-xl p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-emerald-600" />
                    Role-Based Consoles & Regulatory PDF Exports
                  </h4>
                  <p className="text-xs text-slate-600 mt-1">
                    Every enterprise role receives tailored views, scoped permissions, and customized 21 CFR Part 11 PDF audit dossiers.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="primary"
                  leftIcon={<FileText className="w-3.5 h-3.5" />}
                  onClick={() => {
                    handleClose();
                    navigate('/reports');
                  }}
                >
                  Go to Reports Tab
                </Button>
              </div>

              {/* 5 Enterprise Roles Breakdown */}
              <div className="space-y-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                  5 Scoped Enterprise Perspectives (Switch anytime via 1-click on Login):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-slate-50 border-2 border-slate-900 rounded-lg">
                    <span className="font-black text-slate-900 flex items-center gap-1.5">
                      <Landmark className="w-3.5 h-3.5 text-teal-700" />
                      1. Regulatory Authority (Admin)
                    </span>
                    <p className="text-[10px] text-slate-600 mt-0.5">
                      National inspection command center, CDSCO/FDA consensus health, global audit logs, user management.
                    </p>
                  </div>

                  <div className="p-2.5 bg-slate-50 border-2 border-slate-900 rounded-lg">
                    <span className="font-black text-slate-900 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-teal-700" />
                      2. Manufacturer (Pfizer Bio-Pharma)
                    </span>
                    <p className="text-[10px] text-slate-600 mt-0.5">
                      Cleanroom production vault, batch formulation, GS1 label serialization, blockchain block minting.
                    </p>
                  </div>

                  <div className="p-2.5 bg-slate-50 border-2 border-slate-900 rounded-lg">
                    <span className="font-black text-slate-900 flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-sky-700" />
                      3. Distributor (MedExpress Fleet)
                    </span>
                    <p className="text-[10px] text-slate-600 mt-0.5">
                      Reefer logistics manifests, in-transit telemetry vectors, custody transfer sign-offs.
                    </p>
                  </div>

                  <div className="p-2.5 bg-slate-50 border-2 border-slate-900 rounded-lg">
                    <span className="font-black text-slate-900 flex items-center gap-1.5">
                      <Warehouse className="w-3.5 h-3.5 text-amber-700" />
                      4. Warehouse Operator (Nordic Hub)
                    </span>
                    <p className="text-[10px] text-slate-600 mt-0.5">
                      Inward receiving dock, cryogenic storage bays (-70°C), temperature threshold alarms.
                    </p>
                  </div>

                  <div className="p-2.5 bg-slate-50 border-2 border-slate-900 rounded-lg sm:col-span-2">
                    <span className="font-black text-slate-900 flex items-center gap-1.5">
                      <Pill className="w-3.5 h-3.5 text-emerald-700" />
                      5. Retail Pharmacist (Apollo Dispensary)
                    </span>
                    <p className="text-[10px] text-slate-600 mt-0.5">
                      Countertop point-of-dispense verification station, genuine package validation, patient release safety audit.
                    </p>
                  </div>
                </div>
              </div>

              {/* PDF Dossiers Feature Box */}
              <div className="p-3 bg-emerald-50/60 border-2 border-slate-900 rounded-lg space-y-1.5">
                <span className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-emerald-700" />
                  Automated 21 CFR Part 11 PDF Export Engine:
                </span>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Go to <strong>Reports &amp; Export</strong> (`/reports`) and click <strong>Export PDF</strong>. The platform generates an official A4 regulatory dossier with vector Bar &amp; Donut charts, security watermarks, running headers, and digital auditor attestations tailored directly to your authenticated role.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer Controls */}
        <div className="pt-3 border-t-2 border-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-slate-700">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={handleToggleDontShowAgain}
              className="w-4 h-4 rounded border-2 border-slate-900 text-teal-600 focus:ring-teal-500 cursor-pointer"
            />
            <span>Don't show this guide automatically on login</span>
          </label>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {activeTab > 0 && (
              <Button
                variant="outline"
                size="sm"
                leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
                onClick={() => {
                  soundService.playClick();
                  setActiveTab(prev => prev - 1);
                }}
              >
                Previous
              </Button>
            )}

            {activeTab < tabs.length - 1 ? (
              <Button
                variant="secondary"
                size="sm"
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                onClick={() => {
                  soundService.playClick();
                  setActiveTab(prev => prev + 1);
                }}
              >
                Next Step
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                onClick={handleClose}
              >
                Get Started
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
