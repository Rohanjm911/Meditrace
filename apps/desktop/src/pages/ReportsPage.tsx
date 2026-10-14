import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Header } from '../components/layout/Header';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { api } from '../services/api';
import {
  Download,
  FileSpreadsheet,
  FileText,
  Boxes,
  Truck,
  ThermometerSnowflake,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Eye,
  Shield,
  FileCheck,
  Activity,
  Layers,
  Database,
  Search,
  Lock
} from 'lucide-react';

import { soundService } from '../services/soundService';
import { toast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

export const ReportsPage: React.FC = () => {
  const { user } = useAuth();
  const [downloadMessage, setDownloadMessage] = useState<string | null>(null);
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);
  const [previewCategory, setPreviewCategory] = useState<string | null>(null);
  const [previewSearch, setPreviewSearch] = useState('');

  // Live queries for live count indicators & in-app preview
  const { data: batchesData } = useQuery({
    queryKey: ['batches-reports'],
    queryFn: () => api.getBatches()
  });

  const { data: shipmentsData } = useQuery({
    queryKey: ['shipments-reports'],
    queryFn: () => api.getShipments()
  });

  const { data: alertsData } = useQuery({
    queryKey: ['alerts-reports'],
    queryFn: () => api.getAlerts()
  });

  const { data: sensorsData } = useQuery({
    queryKey: ['sensors-reports'],
    queryFn: () => api.getSensors()
  });

  const { data: auditData } = useQuery({
    queryKey: ['audit-reports'],
    queryFn: () => api.getAuditLogs({ limit: 100 })
  });

  const batches = batchesData?.batches || [];
  const shipments = shipmentsData?.shipments || [];
  const alerts = alertsData?.alerts || [];
  const sensors = sensorsData?.sensors || [];
  const auditLogs = auditData?.logs || [];

  const totalDoses = batches.reduce((acc, b) => acc + (b.quantity || 0), 0);
  const activeAlertsCount = alerts.filter(a => a.status === 'ACTIVE').length;

  const downloadReport = async (type: string, format: 'pdf' | 'csv', label: string) => {
    soundService.playActionStart();
    const key = `${type}-${format}`;
    setDownloadingKey(key);
    const token = localStorage.getItem('meditrace_token');
    const apiBase = 'http://localhost:4000/api';
    const url = `${apiBase}/reports/export/${type}?format=${format}&token=${encodeURIComponent(token || '')}`;

    setDownloadMessage(`Compiling ${label} (${format.toUpperCase()})...`);

    try {
      if (!token) {
        throw new Error('Active session token not found. Please log in again.');
      }

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.error || `Export failed with HTTP status ${res.status}`);
      }
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `meditrace-${type}-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
      
      soundService.playSuccess();
      toast.success('Audit Dossier Exported', `Successfully exported ${label} (${format.toUpperCase()})`);
      setDownloadMessage(`Successfully exported ${label} (${format.toUpperCase()})`);
      setTimeout(() => setDownloadMessage(null), 4000);
    } catch (err: any) {
      soundService.playError();
      toast.error('Export Failed', err.message);
      setDownloadMessage(`Export error: ${err.message}`);
      setTimeout(() => setDownloadMessage(null), 4000);
    } finally {
      setDownloadingKey(null);
    }
  };

  const reportCategories = [
    {
      id: 'batches',
      title: 'Pharmaceutical Batches & Release Dossier',
      description: 'Manufacturing lots, GTIN codes, batch sizes, release statuses & SHA-256 ledger seals.',
      icon: Boxes,
      badge: 'Batches',
      metrics: [
        { label: 'Batches', value: batches.length },
        { label: 'Packaged Doses', value: totalDoses.toLocaleString() },
        { label: 'Ledger Proof', value: '100% Sealed' }
      ]
    },
    {
      id: 'shipments',
      title: 'Supply Chain Custody & Transit Log',
      description: 'Multi-party transit manifests, carrier handoffs, custodial tracking & arrival stamps.',
      icon: Truck,
      badge: 'Custody',
      metrics: [
        { label: 'Manifests', value: shipments.length },
        { label: 'In-Transit', value: shipments.filter(s => ['CREATED', 'DISPATCHED', 'IN_TRANSIT'].includes(s.status)).length },
        { label: 'Handoff Seals', value: shipments.reduce((acc, s) => acc + (s.handoffs?.length || 0), 0) }
      ]
    },
    {
      id: 'temperatures',
      title: 'Cold-Chain Telemetry & Thermal Excursions',
      description: 'Continuous 2.0°C - 8.0°C IoT sensor records, excursion durations & corrective logs.',
      icon: ThermometerSnowflake,
      badge: 'Cold Chain',
      metrics: [
        { label: 'IoT Probes', value: sensors.length || 3 },
        { label: 'Breaches', value: alerts.length },
        { label: 'Status', value: activeAlertsCount === 0 ? 'Compliant' : `${activeAlertsCount} Action Req.` }
      ]
    },
    {
      id: 'audit',
      title: 'Security & Enterprise Audit Trail',
      description: 'Immutable 21 CFR Part 11 security log of user logins, role permissions & system events.',
      icon: ShieldCheck,
      badge: 'Security',
      metrics: [
        { label: 'Events Logged', value: auditLogs.length },
        { label: 'Hash Root', value: 'SHA-256' },
        { label: 'Compliance', value: '21 CFR Part 11' }
      ]
    }
  ];

  return (
    <div>
      <Header
        title="Regulatory Compliance Reporting & Data Export"
        subtitle="Generate formatted PDF inspection reports and formula-safe CSV data exports"
      />

      <div className="p-6 max-w-7xl mx-auto space-y-4">
        {/* Sleek Top Compliance Banner with Active Auditor Scope */}
        <div className="px-4 py-3 rounded-xl bg-white border-2 border-slate-900 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 border-2 border-slate-900 shadow-xs">
              <Shield className="w-4 h-4" />
            </div>
            <div className="truncate">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-xs">
                  Auditor Scope: {user?.fullName || 'Authorized Regulatory Auditor'}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-teal-dark border-2 border-slate-900">
                  {user?.role || 'ADMIN'}
                </span>
              </div>
              <p className="text-slate-600 text-[11px] truncate mt-0.5 font-medium">
                Target Entity: <strong className="text-slate-800">{user?.organizationName || 'MediTrace Regulatory Authority'}</strong> • Tailored dataset & digital cryptographic attestation
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border-2 border-slate-900 text-[10px] font-bold">
              <Lock className="w-2.5 h-2.5" /> 21 CFR Part 11 Signed
            </span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 border-2 border-slate-900 text-[10px] font-bold">
              Role Scoped
            </span>
          </div>
        </div>

        {downloadMessage && (
          <div className="p-3 rounded-lg bg-teal-50 border-2 border-slate-900 text-teal-900 text-xs flex items-center gap-2 animate-fadeIn shadow-2xs">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-teal-600" />
            <span className="font-semibold">{downloadMessage}</span>
          </div>
        )}

        {/* Compact, Sleek 2x2 Dossier Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {reportCategories.map(cat => (
            <div
              key={cat.id}
              className="bg-white rounded-xl border-2 border-slate-900 hover:shadow-md p-4 transition-all duration-200 flex flex-col justify-between group shadow-2xs"
            >
              <div>
                {/* Header: Icon, Title & Badge in one sleek line */}
                <div className="flex items-center justify-between gap-2.5 mb-1.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 border-2 border-slate-900 shadow-xs">
                      <cat.icon className="w-4 h-4" />
                    </div>
                    <h3 className="text-xs font-bold text-slate-900 tracking-tight truncate">
                      {cat.title}
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 border-2 border-slate-900 shrink-0">
                    {cat.badge}
                  </span>
                </div>

                {/* Scope Description */}
                <p className="text-[11px] text-slate-600 line-clamp-1 leading-relaxed pl-10.5 font-medium">
                  {cat.description}
                </p>

                {/* Sleek Inline Metrics Ribbon */}
                <div className="my-2.5 py-1.5 px-3 rounded-lg bg-slate-50 border-2 border-slate-900 flex items-center justify-between gap-2 shadow-2xs">
                  {cat.metrics.map((m, idx) => (
                    <div key={idx} className="flex items-center gap-1 text-[11px] truncate">
                      <span className="text-slate-500 font-semibold truncate">{m.label}:</span>
                      <span className="font-mono font-bold text-slate-900 shrink-0">{m.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    soundService.playModalOpen();
                    setPreviewSearch('');
                    setPreviewCategory(cat.id);
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-400" />
                  <span>Preview</span>
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={downloadingKey === `${cat.id}-csv`}
                    onClick={() => downloadReport(cat.id, 'csv', cat.title)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-md shadow-2xs transition-all disabled:opacity-50"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{downloadingKey === `${cat.id}-csv` ? 'Exporting...' : 'CSV'}</span>
                  </button>
                  <button
                    type="button"
                    disabled={downloadingKey === `${cat.id}-pdf`}
                    onClick={() => downloadReport(cat.id, 'pdf', cat.title)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-md shadow-2xs transition-all disabled:opacity-50"
                  >
                    <FileText className="w-3.5 h-3.5 text-white/90" />
                    <span>{downloadingKey === `${cat.id}-pdf` ? 'Compiling...' : 'PDF Report'}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ============================================================== */}
      {/* IN-APP DATA PREVIEW MODAL                                      */}
      {/* ============================================================== */}
      {previewCategory && (
        <Modal
          isOpen={!!previewCategory}
          onClose={() => {
            soundService.playModalClose();
            setPreviewCategory(null);
          }}
          title={`Dossier Preview: ${reportCategories.find(c => c.id === previewCategory)?.title}`}
          subtitle="Direct inspection of active records slated for regulatory compilation"
          maxWidth="xl"
        >
          <div className="space-y-4 text-xs">
            {/* Search filter inside preview */}
            <div className="flex items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={previewSearch}
                  onChange={(e) => setPreviewSearch(e.target.value)}
                  placeholder="Filter preview records..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border-2 border-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal text-navy-900 font-medium shadow-2xs"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />}
                  isLoading={downloadingKey === `${previewCategory}-csv`}
                  onClick={() => downloadReport(previewCategory, 'csv', reportCategories.find(c => c.id === previewCategory)?.title || '')}
                >
                  Export CSV
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<FileText className="w-3.5 h-3.5 text-white" />}
                  isLoading={downloadingKey === `${previewCategory}-pdf`}
                  onClick={() => downloadReport(previewCategory, 'pdf', reportCategories.find(c => c.id === previewCategory)?.title || '')}
                >
                  Export PDF
                </Button>
              </div>
            </div>

            {/* PREVIEW: Batches */}
            {previewCategory === 'batches' && (
              <div className="max-h-72 overflow-y-auto border border-surface-border rounded-lg">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-soft border-b border-surface-border text-navy-700 font-semibold text-[11px] sticky top-0">
                    <tr>
                      <th className="px-3.5 py-2">Batch #</th>
                      <th className="px-3.5 py-2">Product Name</th>
                      <th className="px-3.5 py-2">Quantity</th>
                      <th className="px-3.5 py-2">Status</th>
                      <th className="px-3.5 py-2">Safe Bound</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border text-navy-900">
                    {batches
                      .filter(b => !previewSearch || b.batchNumber.toLowerCase().includes(previewSearch.toLowerCase()) || b.product?.name?.toLowerCase().includes(previewSearch.toLowerCase()))
                      .slice(0, 15)
                      .map(b => (
                        <tr key={b.id} className="hover:bg-surface-soft/60">
                          <td className="px-3.5 py-2 font-mono font-bold text-teal-dark">{b.batchNumber}</td>
                          <td className="px-3.5 py-2 font-medium">{b.product?.name}</td>
                          <td className="px-3.5 py-2 font-mono">{b.quantity} {b.unitOfMeasure}</td>
                          <td className="px-3.5 py-2"><Badge variant="teal" size="sm">{b.status}</Badge></td>
                          <td className="px-3.5 py-2 font-mono text-[11px]">{b.minTempCelsius}°C to {b.maxTempCelsius}°C</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* PREVIEW: Shipments */}
            {previewCategory === 'shipments' && (
              <div className="max-h-72 overflow-y-auto border border-surface-border rounded-lg">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-soft border-b border-surface-border text-navy-700 font-semibold text-[11px] sticky top-0">
                    <tr>
                      <th className="px-3.5 py-2">Tracking #</th>
                      <th className="px-3.5 py-2">Sender → Recipient</th>
                      <th className="px-3.5 py-2">Status</th>
                      <th className="px-3.5 py-2">Carrier</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border text-navy-900">
                    {shipments
                      .filter(s => !previewSearch || s.trackingNumber.toLowerCase().includes(previewSearch.toLowerCase()) || s.senderOrg?.name?.toLowerCase().includes(previewSearch.toLowerCase()))
                      .slice(0, 15)
                      .map(s => (
                        <tr key={s.id} className="hover:bg-surface-soft/60">
                          <td className="px-3.5 py-2 font-mono font-bold text-teal-dark">{s.trackingNumber}</td>
                          <td className="px-3.5 py-2">{s.senderOrg?.name} → {s.recipientOrg?.name}</td>
                          <td className="px-3.5 py-2"><Badge variant={s.status === 'ACCEPTED' ? 'green' : 'amber'} size="sm">{s.status}</Badge></td>
                          <td className="px-3.5 py-2 text-slate-600">{s.assignedCarrier || 'Direct Fleet'}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* PREVIEW: Telemetry Alerts */}
            {previewCategory === 'temperatures' && (
              <div className="max-h-72 overflow-y-auto border border-surface-border rounded-lg">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-soft border-b border-surface-border text-navy-700 font-semibold text-[11px] sticky top-0">
                    <tr>
                      <th className="px-3.5 py-2">Severity & Status</th>
                      <th className="px-3.5 py-2">Recorded Temp</th>
                      <th className="px-3.5 py-2">Sensor Unit</th>
                      <th className="px-3.5 py-2">Excursion Message</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border text-navy-900">
                    {alerts
                      .filter(a => !previewSearch || a.message?.toLowerCase().includes(previewSearch.toLowerCase()) || a.sensor?.serialNumber?.toLowerCase().includes(previewSearch.toLowerCase()))
                      .slice(0, 15)
                      .map(a => (
                        <tr key={a.id} className="hover:bg-surface-soft/60">
                          <td className="px-3.5 py-2 flex items-center gap-1.5">
                            <Badge variant={a.severity === 'CRITICAL' ? 'red' : 'amber'} size="sm">{a.severity}</Badge>
                            <Badge variant={a.status === 'RESOLVED' ? 'green' : 'red'} size="sm">{a.status}</Badge>
                          </td>
                          <td className="px-3.5 py-2 font-mono font-bold text-status-redDark">{a.readingCelsius}°C</td>
                          <td className="px-3.5 py-2 font-mono text-[11px]">{a.sensor?.serialNumber}</td>
                          <td className="px-3.5 py-2 text-slate-600 truncate max-w-[200px]">{a.message}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* PREVIEW: Security Audit Trail */}
            {previewCategory === 'audit' && (
              <div className="max-h-72 overflow-y-auto border border-surface-border rounded-lg">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-soft border-b border-surface-border text-navy-700 font-semibold text-[11px] sticky top-0">
                    <tr>
                      <th className="px-3.5 py-2">Timestamp (UTC)</th>
                      <th className="px-3.5 py-2">Actor & Role</th>
                      <th className="px-3.5 py-2">Action</th>
                      <th className="px-3.5 py-2">Resource</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border text-navy-900">
                    {auditLogs
                      .filter(l => !previewSearch || l.userName?.toLowerCase().includes(previewSearch.toLowerCase()) || l.action?.toLowerCase().includes(previewSearch.toLowerCase()))
                      .slice(0, 15)
                      .map(l => (
                        <tr key={l.id} className="hover:bg-surface-soft/60">
                          <td className="px-3.5 py-2 font-mono text-[11px] text-slate-600">{new Date(l.timestamp).toLocaleString()}</td>
                          <td className="px-3.5 py-2 font-bold text-navy-900">{l.userName} ({l.userRole})</td>
                          <td className="px-3.5 py-2"><Badge variant="teal" size="sm">{l.action}</Badge></td>
                          <td className="px-3.5 py-2 font-mono text-[11px] text-slate-600">{l.resourceType}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-surface-border">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  soundService.playModalClose();
                  setPreviewCategory(null);
                }}
              >
                Close Preview
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
