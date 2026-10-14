import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from '../context/ToastContext';
import {
  AlertTriangle,
  CheckCircle,
  FileText,
  Clock,
  Thermometer,
  ShieldCheck,
  Search,
  Filter,
  ThermometerSnowflake
} from 'lucide-react';

export const AlertsPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedAlert, setSelectedAlert] = useState<any | null>(null);

  // Acknowledge Modal
  const [isAckOpen, setIsAckOpen] = useState(false);
  const [ackNotes, setAckNotes] = useState('');

  // Resolve Modal
  const [isResolveOpen, setIsResolveOpen] = useState(false);
  const [resolveNotes, setResolveNotes] = useState('');

  const { data: alertsData, isLoading } = useQuery({
    queryKey: ['alerts', statusFilter],
    queryFn: () => api.getAlerts(statusFilter ? { status: statusFilter } : undefined)
  });

  const ackMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) => api.acknowledgeAlert(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      setIsAckOpen(false);
      setSelectedAlert(null);
      setAckNotes('');
      toast.info('Alert Acknowledged', 'Initial investigation findings logged on audit trail.');
    },
    onError: (err: any) => {
      toast.error('Acknowledgment Failed', err.message);
    }
  });

  const resolveMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) => api.resolveAlert(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      setIsResolveOpen(false);
      setSelectedAlert(null);
      setResolveNotes('');
      toast.success('Thermal Excursion Resolved', 'Sensor excursion status resolved and stability restored.');
    },
    onError: (err: any) => {
      toast.error('Resolution Failed', err.message);
    }
  });

  const alerts = alertsData?.alerts || [];

  return (
    <div>
      <Header
        title="Temperature Excursion & Alert Management"
        subtitle="Active cold-chain compliance flags, pharmacist reviews, and resolution documentation"
      />

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Filters */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-700 font-bold">Filter by Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-white border-2 border-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal font-bold text-navy-900 shadow-2xs"
            >
              <option value="">All Alerts</option>
              <option value="ACTIVE">ACTIVE (Unacknowledged)</option>
              <option value="ACKNOWLEDGED">ACKNOWLEDGED (Under Review)</option>
              <option value="RESOLVED">RESOLVED (Closed)</option>
            </select>
          </div>
          <span className="text-xs text-navy-700">
            Total recorded excursions: {alerts.length}
          </span>
        </div>

        {/* Alerts Table */}
        <Card padding={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-soft border-b border-surface-border text-navy-700 uppercase font-semibold text-[11px]">
                <tr>
                  <th className="px-5 py-3">Severity & Status</th>
                  <th className="px-5 py-3">Excursion Details</th>
                  <th className="px-5 py-3">Affected Product / Batch</th>
                  <th className="px-5 py-3">Sensor & Source</th>
                  <th className="px-5 py-3">Recorded Time</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border text-navy-900">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-navy-700">
                      Loading alerts...
                    </td>
                  </tr>
                ) : alerts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-navy-700">
                      No temperature alerts on record.
                    </td>
                  </tr>
                ) : (
                  alerts.map(a => (
                    <tr key={a.id} className="hover:bg-surface-soft/60 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <Badge variant={a.severity === 'CRITICAL' ? 'red' : 'amber'}>
                            {a.severity}
                          </Badge>
                          <Badge variant={a.status === 'RESOLVED' ? 'green' : a.status === 'ACKNOWLEDGED' ? 'amber' : 'red'}>
                            {a.status}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-baseline gap-1">
                          <span className="font-mono font-bold text-sm text-status-redDark">{a.readingCelsius}°C</span>
                          <span className="text-[11px] text-navy-700 font-mono">
                            (Allowed: {a.minThresholdCelsius}°C to {a.maxThresholdCelsius}°C)
                          </span>
                        </div>
                        <p className="text-[11px] text-navy-700 mt-0.5 line-clamp-1">{a.message}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-semibold block">{a.batch?.product?.name || 'In-Transit Consignment'}</span>
                        <span className="text-[11px] font-mono text-teal-dark">
                          Batch: {a.batch?.batchNumber || 'Consignment Cargo'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-mono font-semibold block">{a.sensor?.serialNumber}</span>
                        <span className="text-[10px] text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 inline-block mt-0.5">
                          {a.isSimulated ? 'Simulated Telemetry' : 'Hardware Sensor'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 font-mono text-[11px]">
                        {new Date(a.createdAt).toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate('/cold-chain')}
                          >
                            Inspect Probe
                          </Button>
                          {a.status === 'ACTIVE' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedAlert(a);
                                setIsAckOpen(true);
                              }}
                            >
                              Acknowledge
                            </Button>
                          )}
                          {a.status === 'ACKNOWLEDGED' && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => {
                                setSelectedAlert(a);
                                setIsResolveOpen(true);
                              }}
                            >
                              Resolve
                            </Button>
                          )}
                          {a.status === 'RESOLVED' && (
                            <span className="text-[11px] text-emerald-600 font-semibold">
                              ✓ Resolved
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Acknowledge Alert Modal */}
      {isAckOpen && selectedAlert && (
        <Modal
          isOpen={isAckOpen}
          onClose={() => setIsAckOpen(false)}
          title="Acknowledge Temperature Excursion"
          subtitle={`Sensor: ${selectedAlert.sensor?.serialNumber} (${selectedAlert.readingCelsius}°C)`}
          maxWidth="md"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              ackMutation.mutate({ id: selectedAlert.id, notes: ackNotes });
            }}
            className="space-y-3.5 text-xs"
          >
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-semibold text-navy-900">Pharmacist / Quality Review Notes *</label>
                <button
                  type="button"
                  onClick={() => setAckNotes('Reefer compartment inspected by on-duty QA. Temporary excursion noted during cross-dock loading. Auxiliary cooling compressor active, temperature normalizing.')}
                  className="text-[10px] text-teal font-semibold hover:underline"
                >
                  + Use Standard Review Template
                </button>
              </div>
              <textarea
                required
                rows={3}
                value={ackNotes}
                onChange={(e) => setAckNotes(e.target.value)}
                placeholder="Document initial investigation, reefer temperature verification, or inspection findings..."
                className="w-full px-3 py-2 bg-white border-2 border-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal text-navy-900 font-medium shadow-2xs"
              />
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-surface-border">
              <Button type="button" variant="outline" onClick={() => setIsAckOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={ackMutation.isPending}>
                Record Acknowledgement
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Resolve Alert Modal */}
      {isResolveOpen && selectedAlert && (
        <Modal
          isOpen={isResolveOpen}
          onClose={() => setIsResolveOpen(false)}
          title="Resolve Temperature Excursion"
          subtitle={`Sensor: ${selectedAlert.sensor?.serialNumber}`}
          maxWidth="md"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              resolveMutation.mutate({ id: selectedAlert.id, notes: resolveNotes });
            }}
            className="space-y-3.5 text-xs"
          >
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-semibold text-navy-900">Corrective Action Resolution Documentation *</label>
                <button
                  type="button"
                  onClick={() => setResolveNotes('Mean kinetic temperature calculated within USP stability budget. Cold storage unit verified at steady 4.2°C. Batch integrity preserved; released for dispensing.')}
                  className="text-[10px] text-teal font-semibold hover:underline"
                >
                  + Use Standard Resolution Template
                </button>
              </div>
              <textarea
                required
                rows={3}
                value={resolveNotes}
                onChange={(e) => setResolveNotes(e.target.value)}
                placeholder="Document stability budget analysis, cooling system restoration, and batch disposition decision..."
                className="w-full px-3 py-2 bg-white border-2 border-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal text-navy-900 font-medium shadow-2xs"
              />
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-surface-border">
              <Button type="button" variant="outline" onClick={() => setIsResolveOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={resolveMutation.isPending}>
                Confirm Resolution & Close Alert
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
