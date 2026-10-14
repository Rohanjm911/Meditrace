import React, { useState, useEffect } from 'react';
import {
  Truck,
  MapPin,
  Thermometer,
  ShieldCheck,
  AlertTriangle,
  Radio,
  Navigation,
  Compass,
  Zap,
  Clock,
  Layers,
  ChevronRight,
  Maximize2
} from 'lucide-react';
import { Badge } from '../common/Badge';
import { soundService } from '../../services/soundService';

interface WaypointNode {
  id: string;
  name: string;
  category: 'origin' | 'depot' | 'in-transit' | 'destination';
  city: string;
  coords: string;
  x: number; // SVG %
  y: number; // SVG %
  tempCelsius: number;
  minTemp: number;
  maxTemp: number;
  status: 'OPTIMAL' | 'WARNING' | 'EXCURSION';
  batchCode: string;
  drugName: string;
  vehiclePlate?: string;
  driver?: string;
  lastPing: string;
}

export const InteractiveRouteMap: React.FC = () => {
  const [selectedNodeId, setSelectedNodeId] = useState<string>('node-transit-1');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'VACCINES' | 'EXCURSIONS'>('ALL');
  const [livePulse, setLivePulse] = useState(0);

  // Periodic heartbeat animation ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setLivePulse(p => (p + 1) % 100);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  const nodes: WaypointNode[] = [
    {
      id: 'node-pune',
      name: 'Pfizer Bio-Pharma Plant (Pune Node)',
      category: 'origin',
      city: 'Pune, Maharashtra',
      coords: '18.5204° N, 73.8567° E',
      x: 18,
      y: 72,
      tempCelsius: -72.4,
      minTemp: -90,
      maxTemp: -60,
      status: 'OPTIMAL',
      batchCode: 'PFZ-COM-2026-A1',
      drugName: 'Comirnaty mRNA Vaccine',
      lastPing: 'Just now (12s ago)'
    },
    {
      id: 'node-transit-1',
      name: 'MedExpress Reefer Van #TRK-882 (Expressway Corridor)',
      category: 'in-transit',
      city: 'Mumbai-Pune Expressway, Km 42',
      coords: '18.8920° N, 73.1840° E',
      x: 40,
      y: 54,
      tempCelsius: -68.1,
      minTemp: -90,
      maxTemp: -60,
      status: 'OPTIMAL',
      batchCode: 'PFZ-COM-2026-A1',
      drugName: 'Comirnaty mRNA Vaccine',
      vehiclePlate: 'MH-14-AZ-9902',
      driver: 'Rajesh K. (Bio-Logistics Certified)',
      lastPing: 'Active Live Stream (2s ago)'
    },
    {
      id: 'node-mumbai',
      name: 'Nordic Central Vaccine Depot (Bhiwandi Hub)',
      category: 'depot',
      city: 'Bhiwandi, Mumbai MMR',
      coords: '19.2967° N, 73.0631° E',
      x: 48,
      y: 35,
      tempCelsius: 4.8,
      minTemp: 2.0,
      maxTemp: 8.0,
      status: 'OPTIMAL',
      batchCode: 'VAX-AZ-2026-B4',
      drugName: 'Vaxzevria ChAdOx1',
      lastPing: '1m ago'
    },
    {
      id: 'node-transit-2',
      name: 'ColdChain Inter-City Carrier #VAN-409 (NH-48 Sector)',
      category: 'in-transit',
      city: 'Surat-Navsari Bypass',
      coords: '21.1702° N, 72.8311° E',
      x: 68,
      y: 28,
      tempCelsius: 8.9,
      minTemp: 2.0,
      maxTemp: 8.0,
      status: 'EXCURSION',
      batchCode: 'INS-NOV-2026-C8',
      drugName: 'NovoRapid FlexPen Insulin',
      vehiclePlate: 'GJ-05-CT-4100',
      driver: 'Vikram S. (Alert Dispatched)',
      lastPing: 'Thermal Excursion Flagged (5s ago)'
    },
    {
      id: 'node-apollo',
      name: 'Apollo Central Healthcare Pharmacy (Dispensary Desk)',
      category: 'destination',
      city: 'Central Healthcare Sector, Ahmedabad',
      coords: '23.0225° N, 72.5714° E',
      x: 86,
      y: 22,
      tempCelsius: 3.9,
      minTemp: 2.0,
      maxTemp: 8.0,
      status: 'OPTIMAL',
      batchCode: 'PFZ-COM-2026-A1',
      drugName: 'Comirnaty mRNA Vaccine',
      lastPing: 'Inbound Handoff Scheduled (ETA 45m)'
    }
  ];

  const filteredNodes = nodes.filter(n => {
    if (activeFilter === 'VACCINES') return n.drugName.includes('Vaccine');
    if (activeFilter === 'EXCURSIONS') return n.status === 'EXCURSION' || n.status === 'WARNING';
    return true;
  });

  const selectedNode = nodes.find(n => n.id === selectedNodeId) || nodes[1];

  return (
    <div className="bg-white rounded-2xl border-2 border-slate-900 shadow-xl overflow-hidden">
      {/* HUD Header Bar */}
      <div className="p-4 sm:p-5 border-b-2 border-slate-900 flex flex-wrap items-center justify-between gap-3 bg-slate-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 border-2 border-slate-900 flex items-center justify-center text-teal-600 shadow-xs">
            <Navigation className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-navy-900 flex items-center gap-1.5">
                Live Pharmaceutical Transit Vector & Cold-Chain Radar
              </h2>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                LIVE GPS FEED
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5 font-medium">
              Real-time multi-hop telemetry across Maharashtra & Gujarat Cold Corridors
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border-2 border-slate-900 text-xs">
          <button
            onClick={() => {
              soundService.playClick();
              setActiveFilter('ALL');
            }}
            className={`px-3 py-1 rounded-lg font-medium transition-all ${
              activeFilter === 'ALL'
                ? 'bg-white text-navy-900 shadow-sm border border-slate-300'
                : 'text-slate-600 hover:text-navy-900'
            }`}
          >
            All Corridors (5)
          </button>
          <button
            onClick={() => {
              soundService.playClick();
              setActiveFilter('VACCINES');
            }}
            className={`px-3 py-1 rounded-lg font-medium transition-all ${
              activeFilter === 'VACCINES'
                ? 'bg-white text-navy-900 shadow-sm border border-slate-300'
                : 'text-slate-600 hover:text-navy-900'
            }`}
          >
            mRNA Ultra-Cold
          </button>
          <button
            onClick={() => {
              soundService.playDiscrepancy();
              setActiveFilter('EXCURSIONS');
            }}
            className={`px-3 py-1 rounded-lg font-medium transition-all flex items-center gap-1 ${
              activeFilter === 'EXCURSIONS'
                ? 'bg-rose-500 text-white shadow-sm'
                : 'text-rose-600 hover:bg-rose-50'
            }`}
          >
            <AlertTriangle className="w-3 h-3" />
            Breaches (1)
          </button>
        </div>
      </div>

      {/* Main Grid: Interactive Map Visualizer + Inspector Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 min-h-[420px]">
        {/* SVG Topological Map Canvas */}
        <div className="lg:col-span-8 p-4 sm:p-6 bg-slate-900 relative overflow-hidden flex flex-col justify-between border-b-2 lg:border-b-0 lg:border-r-2 border-slate-900">
          {/* Cybernetic Grid Backdrop */}
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage:
                'radial-gradient(circle at 1px 1px, rgba(6,182,212,0.4) 1px, transparent 0)',
              backgroundSize: '24px 24px'
            }}
          />

          {/* Compass & Telemetry Overlay */}
          <div className="absolute top-4 left-4 z-10 flex items-center gap-2 text-[11px] font-mono text-cyan-400/90 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-cyan-800/40 shadow-lg">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>GEO-RADAR FREQ: 868.1 MHz | ENCRYPTION: AES-256-GCM</span>
          </div>

          <div className="absolute top-4 right-4 z-10 text-[10px] font-mono text-slate-400 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-md border border-slate-800">
            SEC: INDIA_WEST_CORRIDOR_01
          </div>

          {/* Interactive SVG Network */}
          <div className="relative w-full h-[320px] sm:h-[360px] my-4 select-none">
            <svg
              className="w-full h-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="routeGradient" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#0d9488" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.8" />
                </linearGradient>

                <linearGradient id="excursionGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="70%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#ef4444" />
                </linearGradient>
              </defs>

              {/* Connecting Supply-Chain Arteries */}
              <path
                d="M 18 72 L 40 54 L 48 35 L 68 28 L 86 22"
                fill="none"
                stroke="rgba(30, 41, 59, 0.8)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Active Animated Transit Flow Stream */}
              <path
                d="M 18 72 L 40 54 L 48 35"
                fill="none"
                stroke="url(#routeGradient)"
                strokeWidth="1.8"
                className="animate-transit-stream"
              />

              {/* Excursion Corridor Vector (Surat sector) */}
              <path
                d="M 48 35 L 68 28 L 86 22"
                fill="none"
                stroke="url(#excursionGrad)"
                strokeWidth="1.8"
                strokeDasharray="4 3"
                className="animate-transit-stream"
              />
            </svg>

            {/* Render Waypoint Markers over SVG */}
            {filteredNodes.map(node => {
              const isSelected = selectedNodeId === node.id;
              const isExcursion = node.status === 'EXCURSION';
              const isInTransit = node.category === 'in-transit';

              return (
                <div
                  key={node.id}
                  onClick={() => {
                    if (isExcursion) soundService.playDiscrepancy();
                    else soundService.playClick();
                    setSelectedNodeId(node.id);
                  }}
                  style={{
                    left: `${node.x}%`,
                    top: `${node.y}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                  className="absolute cursor-pointer group"
                >
                  {/* Radar Wave Ring if active or excursion */}
                  {isSelected && (
                    <div
                      className={`absolute -inset-3 rounded-full animate-radar-ring pointer-events-none ${
                        isExcursion ? 'bg-rose-500/30 ring-2 ring-rose-500' : 'bg-cyan-500/30 ring-2 ring-cyan-400'
                      }`}
                    />
                  )}

                  {/* Marker Node Body */}
                  <div
                    className={`relative w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl ${
                      isSelected
                        ? isExcursion
                          ? 'bg-rose-600 text-white scale-125 ring-4 ring-rose-500/40'
                          : 'bg-cyan-500 text-slate-950 font-bold scale-125 ring-4 ring-cyan-400/40'
                        : isExcursion
                        ? 'bg-rose-500 text-white ring-2 ring-rose-300'
                        : isInTransit
                        ? 'bg-cyan-600 text-white ring-2 ring-cyan-300'
                        : 'bg-slate-800 text-cyan-400 border border-cyan-500/50 hover:scale-110'
                    }`}
                  >
                    {isInTransit ? (
                      <Truck className="w-4 h-4 animate-bounce" />
                    ) : node.category === 'destination' ? (
                      <ShieldCheck className="w-4 h-4" />
                    ) : (
                      <MapPin className="w-4 h-4" />
                    )}
                  </div>

                  {/* Floating Tag */}
                  <div
                    className={`absolute top-9 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded text-[10px] font-mono font-semibold pointer-events-none transition-all shadow-md ${
                      isSelected
                        ? 'bg-cyan-400 text-slate-950 scale-105'
                        : 'bg-slate-900/90 text-slate-300 border border-slate-700 group-hover:border-cyan-500'
                    }`}
                  >
                    {node.city.split(',')[0]} ({node.tempCelsius > 0 ? `+${node.tempCelsius}°C` : `${node.tempCelsius}°C`})
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Live Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80 text-[11px] font-mono text-slate-400">
            <div>
              <span className="text-slate-500 block text-[9px]">FLEET SIZE</span>
              <span className="text-cyan-400 font-bold">2 Vehicles Live</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[9px]">COMPLIANCE</span>
              <span className="text-emerald-400 font-bold">98.4% Nominal</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[9px]">ACTIVE BREACH</span>
              <span className="text-rose-400 font-bold">1 Alert Flagged</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[9px]">CONSENSUS</span>
              <span className="text-cyan-300 font-bold">Block #48,192</span>
            </div>
          </div>
        </div>

        {/* Selected Node Inspector / Forensics HUD */}
        <div className="lg:col-span-4 p-5 flex flex-col justify-between bg-slate-50">
          <div>
            <div className="flex items-center justify-between pb-3 border-b-2 border-slate-900">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5 font-mono">
                <Compass className="w-3.5 h-3.5 text-cyan-600" />
                WAYPOINT TELEMETRY
              </span>
              <Badge
                variant={
                  selectedNode.status === 'OPTIMAL'
                    ? 'green'
                    : selectedNode.status === 'WARNING'
                    ? 'amber'
                    : 'red'
                }
              >
                {selectedNode.status}
              </Badge>
            </div>

            <div className="mt-4">
              <h3 className="font-bold text-sm text-navy-900 leading-snug">
                {selectedNode.name}
              </h3>
              <p className="text-xs text-slate-600 mt-0.5 flex items-center gap-1 font-medium">
                <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                {selectedNode.city}
              </p>
              <div className="mt-1 font-mono text-[10px] text-cyan-700 font-semibold">
                GPS: {selectedNode.coords}
              </div>
            </div>

            {/* Thermal Sensor Live Gauge */}
            <div className="mt-4 p-3.5 rounded-xl bg-white border-2 border-slate-900 shadow-2xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Thermometer className="w-4 h-4 text-cyan-600" />
                  Thermal Sensor Telemetry
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  {selectedNode.lastPing}
                </span>
              </div>

              <div className="flex items-baseline justify-between mt-2">
                <span
                  className={`text-2xl font-black font-mono ${
                    selectedNode.status === 'EXCURSION'
                      ? 'text-rose-500'
                      : selectedNode.status === 'WARNING'
                      ? 'text-amber-500'
                      : 'text-teal-700'
                  }`}
                >
                  {selectedNode.tempCelsius > 0 ? `+${selectedNode.tempCelsius}°C` : `${selectedNode.tempCelsius}°C`}
                </span>
                <span className="text-[11px] font-mono text-slate-600 font-semibold">
                  Range: [{selectedNode.minTemp}°C to {selectedNode.maxTemp}°C]
                </span>
              </div>

              {/* Progress bar representing range */}
              <div className="w-full h-2 bg-slate-200 rounded-full mt-3 overflow-hidden border border-slate-900">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    selectedNode.status === 'EXCURSION'
                      ? 'bg-rose-500 w-full'
                      : 'bg-gradient-to-r from-teal-500 to-cyan-500 w-3/4'
                  }`}
                />
              </div>
            </div>

            {/* Cargo / Batch Specs */}
            <div className="mt-3.5 space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-white border-2 border-slate-900 flex justify-between items-center shadow-2xs">
                <span className="text-slate-600 font-semibold">Cargo Payload</span>
                <span className="font-bold text-navy-900">{selectedNode.drugName}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white border-2 border-slate-900 flex justify-between items-center shadow-2xs">
                <span className="text-slate-600 font-semibold">Batch Code</span>
                <span className="font-mono font-bold text-teal-700">{selectedNode.batchCode}</span>
              </div>
              {selectedNode.vehiclePlate && (
                <div className="p-2.5 rounded-xl bg-white border-2 border-slate-900 flex justify-between items-center shadow-2xs">
                  <span className="text-slate-600 font-semibold">Vehicle / Driver</span>
                  <span className="font-bold text-slate-900 text-right">
                    {selectedNode.vehiclePlate}
                    <span className="block text-[10px] text-slate-500 font-medium">{selectedNode.driver}</span>
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t-2 border-slate-900 flex items-center justify-between text-[11px] text-slate-600">
            <span className="flex items-center gap-1 font-mono text-[10px] font-bold text-slate-700">
              <Zap className="w-3 h-3 text-amber-500" />
              HASH: 0x9f4a...e12d
            </span>
            <span className="text-teal-700 font-bold cursor-pointer hover:underline flex items-center gap-0.5">
              Full Telemetry <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
