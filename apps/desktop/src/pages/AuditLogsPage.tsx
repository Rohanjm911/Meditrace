import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Header } from '../components/layout/Header';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  FileText,
  FileSpreadsheet,
  Shield,
  Search,
  Eye,
  Copy,
  Check,
  ShieldCheck,
  CheckCircle2,
  Lock,
  UserCheck
} from 'lucide-react';

export const AuditLogsPage: React.FC = () => {
  const { user } = useAuth();
  const [viewAllScope, setViewAllScope] = useState(false);
  const [actionFilter, setActionFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState<any | null>(null);
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [downloadMessage, setDownloadMessage] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<string | null>(null);

  const { data: logsData, isLoading } = useQuery({
    queryKey: ['audit-logs', actionFilter, viewAllScope],
    queryFn: () => api.getAuditLogs({
      ...(actionFilter ? { action: actionFilter } : {}),
      ...(viewAllScope ? { scope: 'all' } : {})
    })
  });

  const logs = logsData?.logs || [];

  const filteredLogs = logs.filter(l => {
    if (!searchTerm.trim()) return true;
    const s = searchTerm.toLowerCase();
    return (
      l.userName?.toLowerCase().includes(s) ||
      l.userRole?.toLowerCase().includes(s) ||
      l.organizationName?.toLowerCase().includes(s) ||
      l.action?.toLowerCase().includes(s) ||
      l.resourceType?.toLowerCase().includes(s) ||
      l.resourceId?.toLowerCase().includes(s)
    );
  });

  const downloadAuditExport = async (format: 'pdf' | 'csv') => {
    setIsExporting(format);
    const token = localStorage.getItem('meditrace_token');
    const apiBase = 'http://localhost:4000/api';
    const url = `${apiBase}/reports/export/audit?format=${format}&token=${encodeURIComponent(token || '')}`;

    setDownloadMessage(`Generating Audit Trail (${format.toUpperCase()})...`);

    try {
      if (!token) {
        throw new Error('Active session token not found. Please log in again.');
      }

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.error || `Export failed with HTTP status ${res.status}`);
      }
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `meditrace-audit-trail-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
      setDownloadMessage(`Audit Trail (${format.toUpperCase()}) successfully exported.`);
      setTimeout(() => setDownloadMessage(null), 4000);
    } catch (err: any) {
      setDownloadMessage(`Export error: ${err.message}`);
      setTimeout(() => setDownloadMessage(null), 4000);
    } finally {
      setIsExporting(null);
    }
  };

  const copyPayloadJson = () => {
    if (!selectedLog) return;
    navigator.clipboard.writeText(JSON.stringify(selectedLog.details, null, 2));
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  // Metrics
  const loginCount = logs.filter(l => l.action === 'USER_LOGIN').length;
  const batchCount = logs.filter(l => l.action === 'BATCH_REGISTRATION').length;
  const transferCount = logs.filter(l => ['SHIPMENT_CREATE', 'HANDOFF_ACCEPT'].includes(l.action)).length;

  return (
    <div>
      <Header
        title="Application Security & Compliance Audit Log"
        subtitle="Immutable trail of operational state transitions, access authorizations, and packaging events"
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />}
              isLoading={isExporting === 'csv'}
              onClick={() => downloadAuditExport('csv')}
            >
              Export CSV
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<FileText className="w-3.5 h-3.5 text-white" />}
              isLoading={isExporting === 'pdf'}
              onClick={() => downloadAuditExport('pdf')}
            >
              Export PDF
            </Button>
          </div>
        }
      />

      <div className="p-6 max-w-7xl mx-auto space-y-6 text-xs">
        {downloadMessage && (
          <div className="p-3.5 rounded-lg bg-teal-subtle/50 border border-teal text-teal-dark text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="font-medium">{downloadMessage}</span>
          </div>
        )}

        {/* Dedicated Audit Scope Ribbon */}
        <div className="bg-white border-2 border-slate-900 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-50 text-teal-dark border-2 border-slate-900 shrink-0 shadow-2xs">
              <ShieldCheck className="w-5 h-5 text-teal" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-navy-900">
                  {viewAllScope || user?.role === 'ADMIN'
                    ? 'Consortium-Wide Security & Audit Ledger'
                    : `${user?.organizationName || 'Authorized Node'} Operational Audit Trail`}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-dark border-2 border-slate-900">
                  {filteredLogs.length} Events Verified
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5 font-medium">
                {viewAllScope || user?.role === 'ADMIN'
                  ? 'Complete immutable audit sequence capturing all multi-party ledger consensus events.'
                  : `Audited events strictly partitioned to ${user?.organizationName || 'your organization'}.`}
              </p>
            </div>
          </div>

          {user?.role !== 'ADMIN' && (
            <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-lg border-2 border-slate-900 text-xs shrink-0 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setViewAllScope(false)}
                className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                  !viewAllScope ? 'bg-white shadow-2xs text-teal-dark border-2 border-slate-900' : 'text-slate-600 hover:text-navy-900'
                }`}
              >
                My Organization Only
              </button>
              <button
                type="button"
                onClick={() => setViewAllScope(true)}
                className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                  viewAllScope ? 'bg-white shadow-2xs text-teal-dark border border-teal/30' : 'text-slate-600 hover:text-navy-900'
                }`}
              >
                Global Consortium
              </button>
            </div>
          )}
        </div>

        {/* Audit Metrics Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="p-3.5 rounded-xl bg-white border border-surface-border shadow-xs">
            <span className="text-[11px] text-slate-500 font-semibold uppercase block">Total Retained Records</span>
            <span className="text-2xl font-extrabold text-navy-900 font-mono mt-1 block">{logs.length}</span>
            <span className="text-[10px] text-teal-dark font-medium mt-0.5 block">21 CFR Part 11 Aligned</span>
          </div>
          <div className="p-3.5 rounded-xl bg-white border border-surface-border shadow-xs">
            <span className="text-[11px] text-slate-500 font-semibold uppercase block">User Logins</span>
            <span className="text-2xl font-extrabold text-navy-900 font-mono mt-1 block">{loginCount}</span>
            <span className="text-[10px] text-emerald-700 font-medium mt-0.5 block">Argon2id Verified</span>
          </div>
          <div className="p-3.5 rounded-xl bg-white border border-surface-border shadow-xs">
            <span className="text-[11px] text-slate-500 font-semibold uppercase block">Batch Registrations</span>
            <span className="text-2xl font-extrabold text-teal-dark font-mono mt-1 block">{batchCount}</span>
            <span className="text-[10px] text-teal-dark font-medium mt-0.5 block">Cryptographic SHA-256</span>
          </div>
          <div className="p-3.5 rounded-xl bg-white border border-surface-border shadow-xs">
            <span className="text-[11px] text-slate-500 font-semibold uppercase block">Chain Handoff Events</span>
            <span className="text-2xl font-extrabold text-navy-900 font-mono mt-1 block">{transferCount}</span>
            <span className="text-[10px] text-slate-600 font-medium mt-0.5 block">Multi-Org Endorsed</span>
          </div>
        </div>

        {/* Search & Action Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 max-w-lg">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search actor, role, organization, action, resource ref..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-white border-2 border-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal text-navy-900 font-medium shadow-2xs"
              />
            </div>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-white border-2 border-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal font-bold text-navy-900 shadow-2xs"
            >
              <option value="">All Security Events</option>
              <option value="USER_LOGIN">USER_LOGIN</option>
              <option value="BATCH_REGISTRATION">BATCH_REGISTRATION</option>
              <option value="SHIPMENT_CREATE">SHIPMENT_CREATE</option>
              <option value="HANDOFF_ACCEPT">HANDOFF_ACCEPT</option>
              <option value="ALERT_ACKNOWLEDGE">ALERT_ACKNOWLEDGE</option>
              <option value="ALERT_RESOLVE">ALERT_RESOLVE</option>
              <option value="USER_CREATE">USER_CREATE</option>
            </select>
          </div>
          <span className="text-xs text-navy-700 font-medium">
            Displaying {filteredLogs.length} of {logs.length} audit entries
          </span>
        </div>

        {/* Audit Log Table */}
        <Card padding={false} className="shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-soft border-b border-surface-border text-navy-700 uppercase font-semibold text-[11px]">
                <tr>
                  <th className="px-5 py-3">Timestamp (UTC)</th>
                  <th className="px-5 py-3">Actor & Role</th>
                  <th className="px-5 py-3">Organization</th>
                  <th className="px-5 py-3">Audit Action</th>
                  <th className="px-5 py-3">Resource Target</th>
                  <th className="px-5 py-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border text-navy-900">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-navy-700">
                      Loading audit trail...
                    </td>
                  </tr>
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-navy-700">
                      No matching audit records found.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map(l => (
                    <tr key={l.id} className="hover:bg-surface-soft/60 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-[11px] text-slate-600">
                        {new Date(l.timestamp).toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-bold text-navy-900 block">{l.userName}</span>
                        <Badge variant="navy" size="sm" className="mt-0.5">
                          {l.userRole}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5 text-navy-900 font-medium">
                        {l.organizationName}
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge variant="teal">
                          {l.action}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-[11px]">
                        <span className="text-navy-900 font-semibold">{l.resourceType}</span>
                        <span className="text-slate-500 block truncate max-w-[140px]">{l.resourceId}</span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={<Eye className="w-3.5 h-3.5" />}
                          onClick={() => setSelectedLog(l)}
                        >
                          Payload
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* JSON Payload Inspection Modal */}
      {selectedLog && (
        <Modal
          isOpen={!!selectedLog}
          onClose={() => setSelectedLog(null)}
          title={`Audit Event: ${selectedLog.action}`}
          subtitle={`Actor: ${selectedLog.userName} • Resource: ${selectedLog.resourceType}`}
          maxWidth="md"
        >
          <div className="space-y-3.5 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border-2 border-slate-900 space-y-1.5 shadow-2xs">
              <div className="flex justify-between">
                <span className="font-semibold text-navy-900">Event Timestamp:</span>
                <span className="font-mono text-slate-700">{new Date(selectedLog.timestamp).toUTCString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-navy-900">Client IP Address:</span>
                <span className="font-mono text-teal-dark font-bold">{selectedLog.ipAddress || '127.0.0.1'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-navy-900">Consortium Actor:</span>
                <span className="text-navy-900 font-semibold">{selectedLog.userName} ({selectedLog.userRole})</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-semibold text-navy-900">Structured Event Metadata Payload</label>
                <button
                  type="button"
                  onClick={copyPayloadJson}
                  className="flex items-center gap-1 text-[11px] text-teal-dark font-bold hover:underline"
                >
                  {copiedPayload ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedPayload ? 'Copied' : 'Copy JSON'}
                </button>
              </div>
              <pre className="p-3.5 rounded-xl bg-slate-50 text-slate-900 font-mono text-[11px] overflow-x-auto max-h-60 border-2 border-slate-900 shadow-2xs">
                {JSON.stringify(selectedLog.details, null, 2)}
              </pre>
            </div>

            <div className="flex justify-end pt-2 border-t border-surface-border">
              <Button variant="secondary" size="sm" onClick={() => setSelectedLog(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
