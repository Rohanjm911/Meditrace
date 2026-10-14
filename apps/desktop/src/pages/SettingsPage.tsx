import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Header } from '../components/layout/Header';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { api } from '../services/api';
import {
  Server,
  Database,
  Radio,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Monitor,
  Info
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { data: health, isLoading, refetch } = useQuery({
    queryKey: ['system-health'],
    queryFn: () => api.getHealth(),
    refetchInterval: 5000
  });

  return (
    <div>
      <Header
        title="Application Settings & Infrastructure Health"
        subtitle="System Diagnostic Matrix • Microservice Latency • Blockchain Gateway • Native Non-Docker Status"
        action={
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw className="w-4 h-4" />}
            onClick={() => refetch()}
          >
            Probe Health
          </Button>
        }
      />

      <div className="p-6 max-w-7xl mx-auto space-y-6 text-xs">
        {/* Overall Health Status Banner */}
        <div className={`p-5 rounded-xl border-2 border-slate-900 shadow-2xs flex items-center justify-between ${
          health?.status === 'HEALTHY' ? 'bg-emerald-50' : 'bg-amber-50'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded text-white ${
              health?.status === 'HEALTHY' ? 'bg-status-greenDark' : 'bg-status-amberDark'
            }`}>
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-navy-900">
                System Status: {health?.status || 'HEALTHY'}
              </h3>
              <p className="text-xs text-navy-700 mt-0.5">
                Uptime: {Math.floor((health?.uptimeSeconds || 0) / 60)} minutes • Last Health Diagnostic: {new Date(health?.timestamp || Date.now()).toLocaleTimeString()}
              </p>
            </div>
          </div>
          <Badge variant={health?.status === 'HEALTHY' ? 'green' : 'amber'}>
            {health?.status === 'HEALTHY' ? 'ALL SERVICES OPERATIONAL' : 'DEGRADED SERVICE'}
          </Badge>
        </div>

        {/* 3 Health Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* PostgreSQL Diagnostic Card */}
          <Card
            title="PostgreSQL Database"
            subtitle="Operational persistent data store"
            headerAction={
              <Badge variant={health?.database?.connected ? 'green' : 'red'}>
                {health?.database?.connected ? 'Connected' : 'Offline'}
              </Badge>
            }
          >
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-navy-700">Database Engine:</span>
                <span className="font-semibold text-navy-900">{health?.database?.engine || 'PostgreSQL 18'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-navy-700">Database Catalog:</span>
                <span className="font-mono text-navy-900">{health?.database?.databaseName || 'meditrace'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-navy-700">Query Latency:</span>
                <span className="font-mono text-emerald-600 font-bold">{health?.database?.latencyMs} ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-navy-700">Deployment Architecture:</span>
                <span className="font-semibold text-teal-dark">Native Windows (No Docker)</span>
              </div>
            </div>
          </Card>

          {/* Hyperledger Fabric Card */}
          <Card
            title="Hyperledger Fabric Network"
            subtitle="Permissioned Consortium Ledger"
            headerAction={
              <Badge variant={health?.blockchain?.connected ? 'green' : 'amber'}>
                {health?.blockchain?.mode || 'DEMO_INTEGRITY'}
              </Badge>
            }
          >
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-navy-700">Channel Name:</span>
                <span className="font-mono text-navy-900">{health?.blockchain?.channelName || 'meditracechannel'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-navy-700">Chaincode ID:</span>
                <span className="font-mono text-teal-dark">{health?.blockchain?.chaincodeId || 'meditrace-cc'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-navy-700">Gateway Target:</span>
                <span className="font-mono text-navy-900">{health?.blockchain?.gatewayEndpoint || 'localhost:7051'}</span>
              </div>
              <div className="pt-1 text-[11px] text-slate-500 italic">
                {health?.blockchain?.statusDetails}
              </div>
            </div>
          </Card>

          {/* IoT Telemetry Simulator Card */}
          <Card
            title="IoT Telemetry Simulator"
            subtitle="Cold-Chain Sensor Generation Engine"
            headerAction={
              <Badge variant={health?.iotSimulator?.isRunning ? 'green' : 'gray'}>
                {health?.iotSimulator?.isRunning ? 'Loop Active' : 'Idle'}
              </Badge>
            }
          >
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-navy-700">Simulator Port:</span>
                <span className="font-mono text-navy-900">4001</span>
              </div>
              <div className="flex justify-between">
                <span className="text-navy-700">Active Sensor Probes:</span>
                <span className="font-mono text-navy-900">{health?.iotSimulator?.activeSensors || 3} Units</span>
              </div>
              <div className="flex justify-between">
                <span className="text-navy-700">Simulation Mode:</span>
                <span className="font-mono text-teal font-semibold">{health?.iotSimulator?.mode || 'NORMAL'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-navy-700">Hardware Extensibility:</span>
                <span className="text-emerald-700 font-semibold">ESP32 Ingestion Ready</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Desktop Environment & Regulatory Info */}
        <Card title="Desktop Client Environment & Architectural Compliance" subtitle="Windows Security & Packaging Standards">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-navy-700">Desktop Shell:</span>
                <span className="font-semibold text-navy-900">Electron 30 + Chromium</span>
              </div>
              <div className="flex justify-between">
                <span className="text-navy-700">Context Isolation:</span>
                <span className="font-semibold text-emerald-600">Enabled (Secure IPC Preload)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-navy-700">Node Integration in Renderer:</span>
                <span className="font-semibold text-emerald-600">Disabled (Hardened Sandbox)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-navy-700">Packaging Target:</span>
                <span className="font-semibold text-navy-900">Windows x64 NSIS Installer</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-navy-700">Password Hashing Algorithm:</span>
                <span className="font-mono text-navy-900 font-semibold">Argon2id (RFC 9106)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-navy-700">Packaging Identifier Standards:</span>
                <span className="font-semibold text-navy-900">GS1 DataMatrix + QR Matrix</span>
              </div>
              <div className="flex justify-between">
                <span className="text-navy-700">Docker Dependency:</span>
                <span className="font-semibold text-emerald-600">Strictly Prohibited & Zero Docker</span>
              </div>
              <div className="flex justify-between">
                <span className="text-navy-700">Regulatory Model:</span>
                <span className="text-navy-900">Software Demonstration Prototype</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
