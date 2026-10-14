import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { api } from '../services/api';
import { Truck, ShieldCheck, MapPin, Building2, Clock, CheckCircle2, XCircle, Search, Eye, ExternalLink } from 'lucide-react';

export const HandoffHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedHandoff, setSelectedHandoff] = useState<any | null>(null);

  const { data: shipmentsData, isLoading } = useQuery({
    queryKey: ['shipments-handoffs'],
    queryFn: () => api.getShipments()
  });

  const shipments = shipmentsData?.shipments || [];
  const allHandoffs = shipments.flatMap(s =>
    (s.handoffs || []).map((h: any) => ({
      ...h,
      shipmentId: s.id,
      trackingNumber: s.trackingNumber,
      carrier: s.assignedCarrier,
      originLocation: s.originLocation,
      destinationLocation: s.destinationLocation
    }))
  ).sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const filteredHandoffs = allHandoffs.filter(h => {
    const matchesSearch =
      h.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.senderOrg?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.recipientOrg?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.location?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || h.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      <Header
        title="Supply Chain Custody & Handoff History"
        subtitle="Chronological audit of verified cross-organizational custody transfers"
      />

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Filters and Search Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by tracking number, organization, or dock..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-white border-2 border-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal text-navy-900 font-medium shadow-2xs"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-white border-2 border-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal font-bold text-navy-900 shadow-2xs"
            >
              <option value="">All Statuses</option>
              <option value="ACCEPTED">ACCEPTED</option>
              <option value="PENDING">PENDING</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>
          <span className="text-xs text-slate-600 font-bold">
            Showing {filteredHandoffs.length} verified handoff record{filteredHandoffs.length !== 1 ? 's' : ''}
          </span>
        </div>

        <Card title="Chain-of-Custody Events Timeline" subtitle="Recorded dispatch, intermediate transfer, and destination acceptance milestones" padding={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-soft border-b border-surface-border text-navy-700 uppercase font-semibold text-[11px]">
                <tr>
                  <th className="px-5 py-3">Timestamp (UTC)</th>
                  <th className="px-5 py-3">Shipment Ref</th>
                  <th className="px-5 py-3">Transferring Organizations</th>
                  <th className="px-5 py-3">Facility Location</th>
                  <th className="px-5 py-3">Transfer Status</th>
                  <th className="px-5 py-3">Ledger Signature</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border text-navy-900">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-navy-700">
                      Loading custody timeline...
                    </td>
                  </tr>
                ) : filteredHandoffs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-navy-700">
                      No handoff transfer events match the filter.
                    </td>
                  </tr>
                ) : (
                  filteredHandoffs.map((h: any) => (
                    <tr key={h.id} className="hover:bg-surface-soft/60 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-[11px] text-slate-600">
                        {new Date(h.timestamp).toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5 font-mono font-bold text-navy-900">
                        {h.trackingNumber}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-semibold block">{h.senderOrg?.name}</span>
                        <span className="text-teal-dark font-medium text-[11px]">→ {h.recipientOrg?.name}</span>
                      </td>
                      <td className="px-5 py-3.5 text-navy-900">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-teal shrink-0" />
                          {h.location}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge variant={h.status === 'ACCEPTED' ? 'green' : h.status === 'REJECTED' ? 'red' : 'amber'}>
                          {h.status}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-[11px]">
                        {h.blockchainConfirmed ? (
                          <div className="flex items-center gap-1 text-emerald-600 font-semibold">
                            <ShieldCheck className="w-3.5 h-3.5 text-status-green" />
                            <span>{h.blockchainTxId ? h.blockchainTxId.slice(0, 10) + '...' : 'Signed'}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">Pending</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={<Eye className="w-3.5 h-3.5" />}
                          onClick={() => setSelectedHandoff(h)}
                        >
                          Details
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

      {/* Handoff Details Modal */}
      {selectedHandoff && (
        <Modal
          isOpen={!!selectedHandoff}
          onClose={() => setSelectedHandoff(null)}
          title={`Handoff Event: ${selectedHandoff.trackingNumber}`}
          subtitle={`Chain of Custody Transfer #${selectedHandoff.id?.slice(0, 8)}`}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-xl border-2 border-slate-900 space-y-2 shadow-2xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-bold">Consortium Status:</span>
                <Badge variant={selectedHandoff.status === 'ACCEPTED' ? 'green' : selectedHandoff.status === 'REJECTED' ? 'red' : 'amber'}>
                  {selectedHandoff.status}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 font-bold">Dispatching Organization:</span>
                <span className="font-bold text-navy-900">{selectedHandoff.senderOrg?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 font-bold">Receiving Organization:</span>
                <span className="font-bold text-navy-900">{selectedHandoff.recipientOrg?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 font-bold">Handoff Facility Location:</span>
                <span className="font-bold text-navy-900">{selectedHandoff.location}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 font-bold">Assigned Logistics Carrier:</span>
                <span className="text-navy-900 font-semibold">{selectedHandoff.carrier || 'Direct Fleet'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 font-bold">Event Timestamp:</span>
                <span className="font-mono text-navy-900 font-bold">{new Date(selectedHandoff.timestamp).toUTCString()}</span>
              </div>
            </div>

            {/* Notes / Reason */}
            <div>
              <span className="font-bold text-navy-900 block mb-1">Inspection Documentation & Notes:</span>
              <div className="p-3 rounded-xl bg-white border-2 border-slate-900 text-navy-900 font-medium shadow-2xs">
                {selectedHandoff.notes || selectedHandoff.rejectionReason || 'No special condition annotations recorded during transfer.'}
              </div>
            </div>

            {/* Blockchain Proof */}
            <div className="p-3.5 bg-slate-50 rounded-xl border-2 border-slate-900 space-y-1 shadow-2xs">
              <div className="flex items-center gap-1.5 text-teal-dark font-bold">
                <ShieldCheck className="w-4 h-4 text-status-green" />
                <span>Hyperledger Fabric Endorsement</span>
              </div>
              <div className="font-mono text-[11px] text-navy-900 font-bold break-all">
                Tx ID: {selectedHandoff.blockchainTxId || 'Pending ledger block commit'}
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-surface-border">
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Truck className="w-3.5 h-3.5" />}
                onClick={() => {
                  setSelectedHandoff(null);
                  navigate('/shipments');
                }}
              >
                Track in Shipments
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setSelectedHandoff(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
