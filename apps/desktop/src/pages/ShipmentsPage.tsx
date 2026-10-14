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
import { UserRole } from '@meditrace/shared-types';
import {
  Truck,
  Plus,
  Send,
  CheckCircle,
  XCircle,
  ShieldCheck,
  AlertCircle,
  Building2,
  Clock,
  MapPin,
  Thermometer
} from 'lucide-react';

export const ShipmentsPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, hasRole } = useAuth();

  // Create Shipment Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    recipientOrgId: '',
    originLocation: '',
    destinationLocation: '',
    assignedCarrier: 'ColdShield Express Transport',
    sensorId: '',
    batchId: '',
    quantity: 100
  });
  const [createError, setCreateError] = useState<string | null>(null);

  // Accept Handoff Modal State
  const [isAcceptOpen, setIsAcceptOpen] = useState(false);
  const [selectedHandoff, setSelectedHandoff] = useState<any | null>(null);
  const [acceptLocation, setAcceptLocation] = useState('');
  const [acceptNotes, setAcceptNotes] = useState('');

  // Reject Handoff Modal State
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectLocation, setRejectLocation] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  const { data: shipmentsData, isLoading } = useQuery({
    queryKey: ['shipments'],
    queryFn: () => api.getShipments()
  });

  const { data: orgsData } = useQuery({
    queryKey: ['orgs-select'],
    queryFn: () => api.getOrganizations()
  });

  const { data: batchesData } = useQuery({
    queryKey: ['batches-available'],
    queryFn: () => api.getBatches()
  });

  const { data: sensorsData } = useQuery({
    queryKey: ['sensors-select'],
    queryFn: () => api.getSensors()
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: any) => api.createShipment(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
      setIsCreateOpen(false);
      setCreateError(null);
    },
    onError: (err: any) => {
      setCreateError(err.message || 'Failed to create shipment');
    }
  });

  const dispatchMutation = useMutation({
    mutationFn: (id: string) => api.dispatchShipment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
    }
  });

  const acceptMutation = useMutation({
    mutationFn: ({ sId, hId, data }: { sId: string; hId: string; data: any }) =>
      api.acceptHandoff(sId, hId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
      setIsAcceptOpen(false);
      setSelectedHandoff(null);
      setAcceptNotes('');
    }
  });

  const rejectMutation = useMutation({
    mutationFn: ({ sId, hId, data }: { sId: string; hId: string; data: any }) =>
      api.rejectHandoff(sId, hId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
      setIsRejectOpen(false);
      setSelectedHandoff(null);
      setRejectionReason('');
    }
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    if (!createForm.recipientOrgId) {
      setCreateError('Please select a recipient organization');
      return;
    }
    if (!createForm.batchId) {
      setCreateError('Please assign at least one product batch');
      return;
    }

    createMutation.mutate({
      recipientOrgId: createForm.recipientOrgId,
      originLocation: createForm.originLocation,
      destinationLocation: createForm.destinationLocation,
      assignedCarrier: createForm.assignedCarrier,
      sensorId: createForm.sensorId || undefined,
      items: [{ batchId: createForm.batchId, quantity: createForm.quantity }]
    });
  };

  const handleAcceptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHandoff) return;
    acceptMutation.mutate({
      sId: selectedHandoff.shipmentId,
      hId: selectedHandoff.id,
      data: { location: acceptLocation, notes: acceptNotes }
    });
  };

  const handleRejectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHandoff) return;
    rejectMutation.mutate({
      sId: selectedHandoff.shipmentId,
      hId: selectedHandoff.id,
      data: { location: rejectLocation, rejectionReason }
    });
  };

  const shipments = shipmentsData?.shipments || [];

  return (
    <div>
      <Header
        title="Shipment & Chain-of-Custody Management"
        subtitle="End-to-End verified supply chain transfers (Manufacturer → Distributor → Warehouse → Pharmacy)"
        action={
          hasRole(UserRole.MANUFACTURER, UserRole.DISTRIBUTOR, UserRole.ADMIN) && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setIsCreateOpen(true)}
            >
              Initiate Shipment
            </Button>
          )
        }
      />

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Shipments List */}
        {isLoading ? (
          <div className="text-center py-12 text-xs text-navy-700">Loading shipments...</div>
        ) : shipments.length === 0 ? (
          <div className="text-center py-12 bg-white border-2 border-slate-900 rounded-2xl p-8 shadow-sm">
            <Truck className="w-8 h-8 text-slate-700 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-navy-900">No active shipments found</h3>
            <p className="text-xs text-slate-600 mt-1">Initiate a transfer between authorized supply chain partners.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {shipments.map(s => {
              const pendingHandoff = s.handoffs?.find((h: any) => h.status === 'PENDING');
              const isSender = user?.organizationId === s.senderOrgId || user?.role === UserRole.ADMIN;
              const isRecipient = user?.organizationId === s.recipientOrgId || user?.role === UserRole.ADMIN;

              return (
                <Card key={s.id} padding={false} className="overflow-hidden">
                  {/* Shipment Header Banner */}
                  <div className="p-4 bg-slate-50 border-b-2 border-slate-900 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-slate-900 text-white shadow-2xs">
                        <Truck className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-bold text-navy-900">{s.trackingNumber}</span>
                          <Badge variant={s.status === 'ACCEPTED' ? 'green' : s.status === 'REJECTED' ? 'red' : 'amber'}>
                            {s.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-600 font-medium mt-0.5">Carrier: {s.assignedCarrier || 'Dedicated Courier'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {s.blockchainConfirmed && (
                        <div className="flex items-center gap-1 text-xs font-bold text-emerald-900 px-2.5 py-1 rounded-lg bg-emerald-50 border-2 border-slate-900 shadow-2xs">
                          <ShieldCheck className="w-4 h-4 text-status-green" />
                          <span>Ledger Verified</span>
                        </div>
                      )}

                      {/* Dispatch Action Button */}
                      {s.status === 'CREATED' && isSender && (
                        <Button
                          variant="primary"
                          size="sm"
                          leftIcon={<Send className="w-4 h-4" />}
                          isLoading={dispatchMutation.isPending}
                          onClick={() => dispatchMutation.mutate(s.id)}
                        >
                          Dispatch Shipment
                        </Button>
                      )}

                      {/* Accept/Reject Pending Handoff Button */}
                      {pendingHandoff && isRecipient && (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="primary"
                            size="sm"
                            leftIcon={<CheckCircle className="w-4 h-4" />}
                            onClick={() => {
                              setSelectedHandoff({ ...pendingHandoff, shipmentId: s.id });
                              setAcceptLocation(s.destinationLocation);
                              setIsAcceptOpen(true);
                            }}
                          >
                            Accept Handoff
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            leftIcon={<XCircle className="w-4 h-4" />}
                            onClick={() => {
                              setSelectedHandoff({ ...pendingHandoff, shipmentId: s.id });
                              setRejectLocation(s.destinationLocation);
                              setIsRejectOpen(true);
                            }}
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Shipment Body */}
                  <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                    {/* Route Details */}
                    <div>
                      <h4 className="font-semibold text-navy-900 mb-2 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-teal" />
                        Routing & Custody
                      </h4>
                      <div className="space-y-1.5 text-navy-700">
                        <div>
                          <span className="font-medium text-navy-900 block">Sender Organization:</span>
                          <span>{s.senderOrg?.name} ({s.originLocation})</span>
                        </div>
                        <div>
                          <span className="font-medium text-navy-900 block">Destination Partner:</span>
                          <span>{s.recipientOrg?.name} ({s.destinationLocation})</span>
                        </div>
                      </div>
                    </div>

                    {/* Batch Items In Shipment */}
                    <div>
                      <h4 className="font-semibold text-navy-900 mb-2 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-teal" />
                        Manifest Items
                      </h4>
                      <div className="space-y-2">
                        {s.items?.map((item: any) => (
                          <div key={item.id} className="p-2.5 rounded-xl bg-slate-50 border-2 border-slate-900 shadow-2xs">
                            <span className="font-bold text-navy-900 block">{item.batch?.product?.name}</span>
                            <span className="font-mono text-slate-700 font-semibold text-[11px]">
                              Batch: {item.batch?.batchNumber} • Qty: {item.quantity} units
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Sensor & Telemetry Link */}
                    <div>
                      <h4 className="font-bold text-navy-900 mb-2 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Thermometer className="w-3.5 h-3.5 text-teal" />
                          Assigned IoT Telemetry
                        </span>
                        {s.sensor && (
                          <button
                            onClick={() => navigate('/cold-chain')}
                            className="text-[10px] text-teal-dark font-bold hover:underline"
                          >
                            Live Feed &rarr;
                          </button>
                        )}
                      </h4>
                      {s.sensor ? (
                        <div className="p-2.5 rounded-xl bg-slate-50 border-2 border-slate-900 text-navy-900 shadow-2xs">
                          <span className="font-bold block">{s.sensor.name}</span>
                          <span className="font-mono text-[11px] text-teal-dark font-bold">Serial: {s.sensor.serialNumber}</span>
                          <span className="text-[10px] text-slate-600 font-medium block mt-0.5">
                            {s.sensor.isSimulated ? 'Simulated Sensor Feed' : 'Live Hardware Probe'}
                          </span>
                        </div>
                      ) : (
                        <p className="text-slate-500 italic font-medium">No continuous sensor unit assigned to this manifest.</p>
                      )}
                    </div>
                  </div>

                  {/* Handoff Movement History Footer */}
                  {s.handoffs && s.handoffs.length > 0 && (
                    <div className="px-5 py-3 bg-slate-50 border-t-2 border-slate-900 text-xs">
                      <span className="font-bold text-navy-900 block mb-1.5">Chain of Custody Events:</span>
                      <div className="space-y-1">
                        {s.handoffs.map((h: any) => (
                          <div key={h.id} className="flex items-center justify-between text-[11px]">
                            <div className="flex items-center gap-2">
                              <Badge variant={h.status === 'ACCEPTED' ? 'green' : h.status === 'REJECTED' ? 'red' : 'amber'} size="sm">
                                {h.status}
                              </Badge>
                              <span className="text-navy-900 font-bold">
                                {h.senderOrg?.name} → {h.recipientOrg?.name} at {h.location}
                              </span>
                            </div>
                            <span className="text-slate-600 font-mono font-semibold">
                              {new Date(h.timestamp).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Shipment Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Initiate Supply Chain Shipment"
        subtitle="Generates custody manifest and assigns product batches"
        maxWidth="lg"
      >
        {createError && (
          <div className="mb-4 p-3 rounded bg-red-50 border border-status-red/20 text-status-redDark text-xs">
            {createError}
          </div>
        )}

        <div className="mb-3 flex items-center justify-between p-2 rounded bg-teal-subtle/40 border border-teal/20 text-xs">
          <span className="text-teal-dark font-medium">Testing shipment manifest dispatch?</span>
          <button
            type="button"
            onClick={() => {
              const eligibleOrgs = (orgsData?.organizations || []).filter(o => o.id !== user?.organizationId);
              const targetOrg = eligibleOrgs[0];
              const targetBatch = batchesData?.batches?.[0];
              const targetSensor = sensorsData?.sensors?.[0];
              setCreateForm({
                recipientOrgId: targetOrg ? targetOrg.id : '',
                originLocation: 'Pune Central Cold Vault Bay 2',
                destinationLocation: targetOrg ? `${targetOrg.name} Inward Terminal` : 'Regional Cold Distribution Dock',
                assignedCarrier: 'ColdShield Express Transport',
                sensorId: targetSensor ? targetSensor.id : '',
                batchId: targetBatch ? targetBatch.id : '',
                quantity: 150
              });
            }}
            className="px-2.5 py-1 rounded bg-teal text-white font-semibold hover:bg-teal-dark transition-colors text-[11px]"
          >
            + Auto-Fill Demo Transfer
          </button>
        </div>

        <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-navy-900 mb-1">Recipient Organization *</label>
            <select
              required
              value={createForm.recipientOrgId}
              onChange={(e) => setCreateForm({ ...createForm, recipientOrgId: e.target.value })}
              className="w-full px-3 py-2 bg-white border-2 border-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal font-medium text-navy-900 shadow-2xs"
            >
              <option value="">-- Choose Recipient Organization --</option>
              {orgsData?.organizations
                .filter(o => o.id !== user?.organizationId)
                .map(o => (
                  <option key={o.id} value={o.id}>
                    {o.name} ({o.type})
                  </option>
                ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-navy-900 mb-1">Origin Facility / Loading Dock *</label>
              <input
                type="text"
                required
                value={createForm.originLocation}
                onChange={(e) => setCreateForm({ ...createForm, originLocation: e.target.value })}
                placeholder="e.g. Pune Central Vault Loading Bay 2"
                className="w-full px-3 py-2 bg-white border-2 border-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal text-navy-900 font-medium shadow-2xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-navy-900 mb-1">Destination Facility *</label>
              <input
                type="text"
                required
                value={createForm.destinationLocation}
                onChange={(e) => setCreateForm({ ...createForm, destinationLocation: e.target.value })}
                placeholder="e.g. Bengaluru Logistics Cold Hub"
                className="w-full px-3 py-2 bg-white border-2 border-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal text-navy-900 font-medium shadow-2xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-navy-900 mb-1">Assigned Carrier</label>
              <input
                type="text"
                value={createForm.assignedCarrier}
                onChange={(e) => setCreateForm({ ...createForm, assignedCarrier: e.target.value })}
                placeholder="ColdShield Express Transport"
                className="w-full px-3 py-2 bg-white border-2 border-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal text-navy-900 font-medium shadow-2xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-navy-900 mb-1">Assign IoT Telemetry Probe</label>
              <select
                value={createForm.sensorId}
                onChange={(e) => setCreateForm({ ...createForm, sensorId: e.target.value })}
                className="w-full px-3 py-2 bg-white border-2 border-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal font-medium text-navy-900 shadow-2xs"
              >
                <option value="">-- No Attached Sensor --</option>
                {sensorsData?.sensors.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.serialNumber} - {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="p-3 bg-surface-soft rounded-xl border-2 border-slate-900 space-y-3">
            <span className="font-semibold text-navy-900 block">Manifest Batch Item</span>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block font-semibold text-navy-700 mb-1">Batch To Transfer *</label>
                <select
                  required
                  value={createForm.batchId}
                  onChange={(e) => setCreateForm({ ...createForm, batchId: e.target.value })}
                  className="w-full px-3 py-2 bg-white border-2 border-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal text-navy-900 font-semibold shadow-2xs"
                >
                  <option value="">-- Choose Batch --</option>
                  {batchesData?.batches.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.batchNumber} ({b.product?.name} - {b.remainingQuantity} available)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-navy-700 mb-1">Units *</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={createForm.quantity}
                  onChange={(e) => setCreateForm({ ...createForm, quantity: parseInt(e.target.value, 10) })}
                  className="w-full px-3 py-2 font-mono bg-white border-2 border-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal text-navy-900 font-semibold shadow-2xs"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-surface-border">
            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={createMutation.isPending}>
              Create Shipment Manifest
            </Button>
          </div>
        </form>
      </Modal>

      {/* Accept Handoff Modal */}
      {isAcceptOpen && selectedHandoff && (
        <Modal
          isOpen={isAcceptOpen}
          onClose={() => setIsAcceptOpen(false)}
          title="Accept Custody Transfer"
          subtitle="Signs verified custody receipt on Hyperledger Fabric ledger"
          maxWidth="md"
        >
          <form onSubmit={handleAcceptSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-semibold text-navy-900 mb-1">Receiving Facility / Dock Location *</label>
              <input
                type="text"
                required
                value={acceptLocation}
                onChange={(e) => setAcceptLocation(e.target.value)}
                placeholder="e.g. Nordic Hub Inward Receiving Dock Bay 1"
                className="w-full px-3 py-2 bg-white border-2 border-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal text-navy-900 font-medium shadow-2xs"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-semibold text-navy-900">Receipt Verification Notes</label>
                <button
                  type="button"
                  onClick={() => setAcceptNotes('Tamper-evident consignment security seal verified intact. Cold-chain probe within allowable 2°C-8°C range. Custody formally accepted and logged to blockchain.')}
                  className="text-[10px] text-teal font-semibold hover:underline"
                >
                  + Use Standard Receipt Note
                </button>
              </div>
              <textarea
                rows={3}
                value={acceptNotes}
                onChange={(e) => setAcceptNotes(e.target.value)}
                placeholder="Seal verified intact, cold-chain temperature indicator green upon arrival..."
                className="w-full px-3 py-2 bg-white border-2 border-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal text-navy-900 font-medium shadow-2xs"
              />
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-surface-border">
              <Button type="button" variant="outline" onClick={() => setIsAcceptOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={acceptMutation.isPending}>
                Sign & Accept Custody
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Reject Handoff Modal */}
      {isRejectOpen && selectedHandoff && (
        <Modal
          isOpen={isRejectOpen}
          onClose={() => setIsRejectOpen(false)}
          title="Reject Supply Chain Transfer"
          subtitle="Records formal rejection on the immutable audit trail"
          maxWidth="md"
        >
          <form onSubmit={handleRejectSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-semibold text-navy-900 mb-1">Inspection Location *</label>
              <input
                type="text"
                required
                value={rejectLocation}
                onChange={(e) => setRejectLocation(e.target.value)}
                placeholder="e.g. Inward Receiving Gate 2"
                className="w-full px-3 py-2 bg-white border-2 border-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal text-navy-900 font-medium shadow-2xs"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-semibold text-navy-900">Mandatory Rejection Justification *</label>
                <button
                  type="button"
                  onClick={() => setRejectionReason('Critical temperature excursion detected during transport (+14.2°C recorded for >45 mins). Cold-chain compliance breached; consignment rejected.')}
                  className="text-[10px] text-teal font-semibold hover:underline"
                >
                  + Use Excursion Breach Note
                </button>
              </div>
              <textarea
                required
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Critical cold-chain thermal breach during transport, seal broken, or damaged packaging..."
                className="w-full px-3 py-2 bg-white border-2 border-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal text-navy-900 font-medium shadow-2xs"
              />
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-surface-border">
              <Button type="button" variant="outline" onClick={() => setIsRejectOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="danger" isLoading={rejectMutation.isPending}>
                Confirm Transfer Rejection
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
