import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
import { Header } from '../components/layout/Header';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from '../context/ToastContext';
import { UserRole, BatchStatus } from '@meditrace/shared-types';
import {
  Boxes,
  Plus,
  Search,
  QrCode,
  ShieldCheck,
  Thermometer,
  AlertTriangle,
  Copy,
  Check,
  AlertCircle,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';

export const BatchesPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasRole, user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<any | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedHash, setCopiedHash] = useState(false);

  // Status Change Modal State
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<BatchStatus>(BatchStatus.QUARANTINED);
  const [statusReason, setStatusReason] = useState('');
  const [statusError, setStatusError] = useState<string | null>(null);

  // Form State
  const [form, setForm] = useState({
    productId: '',
    batchNumber: '',
    mfgDate: new Date().toISOString().slice(0, 10),
    expDate: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().slice(0, 10),
    quantity: 1000,
    unitOfMeasure: 'vials',
    minTempCelsius: 2.0,
    maxTempCelsius: 8.0,
    notes: ''
  });
  const [viewAllScope, setViewAllScope] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);

  const { data: batchesData, isLoading } = useQuery({
    queryKey: ['batches', statusFilter, viewAllScope],
    queryFn: () => api.getBatches({
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(viewAllScope ? { scope: 'all' } : {})
    })
  });

  const { data: productsData } = useQuery({
    queryKey: ['products-select'],
    queryFn: () => api.getProducts()
  });

  const registerMutation = useMutation({
    mutationFn: (newBatch: any) => api.createBatch(newBatch),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      setIsRegisterOpen(false);
      setRegisterError(null);
      setSelectedBatch(res.batch);
      toast.success(
        'Batch Registered & Sealed',
        `Batch ${res.batch.batchNumber} sealed on distributed ledger.`
      );
    },
    onError: (err: any) => {
      setRegisterError(err.message || 'Failed to register batch');
      toast.error('Registration Failed', err.message || 'Failed to register batch');
    }
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.updateBatchStatus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      setIsStatusModalOpen(false);
      setSelectedBatch(null);
      setStatusReason('');
      setStatusError(null);
      toast.success('Batch State Updated', 'Regulatory lifecycle mutation logged on ledger.');
    },
    onError: (err: any) => {
      setStatusError(err.message || 'Failed to update batch status');
      toast.error('Status Update Failed', err.message || 'Failed to update batch status');
    }
  });

  // When selectedBatch changes, generate QR image
  useEffect(() => {
    if (selectedBatch?.qrPayload) {
      QRCode.toDataURL(selectedBatch.qrPayload, {
        width: 180,
        margin: 1,
        color: { dark: '#0f172a', light: '#ffffff' }
      }).then(setQrDataUrl).catch(() => setQrDataUrl(''));
    } else {
      setQrDataUrl('');
    }
  }, [selectedBatch]);

  // When product is selected in registration form, auto-fill temperature range
  const handleProductSelect = (productId: string) => {
    const prod = productsData?.products.find(p => p.id === productId);
    setForm(prev => ({
      ...prev,
      productId,
      minTempCelsius: prod ? prod.minTempCelsius : prev.minTempCelsius,
      maxTempCelsius: prod ? prod.maxTempCelsius : prev.maxTempCelsius
    }));
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError(null);
    if (!form.productId) {
      setRegisterError('Please select a product formulation');
      return;
    }
    if (new Date(form.mfgDate) >= new Date(form.expDate)) {
      setRegisterError('Manufacturing date must precede expiration date');
      return;
    }
    if (form.minTempCelsius >= form.maxTempCelsius) {
      setRegisterError('Minimum temperature must be strictly less than maximum temperature');
      return;
    }

    registerMutation.mutate({
      ...form,
      mfgDate: new Date(form.mfgDate).toISOString(),
      expDate: new Date(form.expDate).toISOString()
    });
  };

  const handleStatusSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusError(null);
    if (!statusReason.trim()) {
      setStatusError('A regulatory reason is required for status updates');
      return;
    }
    statusMutation.mutate({
      id: selectedBatch.id,
      data: { status: newStatus, reason: statusReason }
    });
  };

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    toast.info('Hash Copied', 'Canonical SHA-256 state hash copied to clipboard.');
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const batches = batchesData?.batches || [];
  const filteredBatches = batches.filter(b =>
    b.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.product?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'REGISTERED': return <Badge variant="teal">REGISTERED</Badge>;
      case 'IN_TRANSIT': return <Badge variant="amber">IN TRANSIT</Badge>;
      case 'STORED': return <Badge variant="gray">STORED</Badge>;
      case 'DELIVERED': return <Badge variant="green">DELIVERED</Badge>;
      case 'RECALLED': return <Badge variant="red">RECALLED</Badge>;
      case 'QUARANTINED': return <Badge variant="red">QUARANTINED</Badge>;
      default: return <Badge variant="gray">{status}</Badge>;
    }
  };

  return (
    <div>
      <Header
        title="Batches & Lot Registry"
        subtitle="Cryptographically sealed pharmaceutical manufacturing batches on ledger"
        action={
          hasRole(UserRole.MANUFACTURER, UserRole.ADMIN) && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setIsRegisterOpen(true)}
            >
              Register New Batch
            </Button>
          )
        }
      />

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Dedicated Dataset Scope Ribbon */}
        <div className="bg-white border-2 border-slate-900 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-50 text-teal-dark border-2 border-slate-900 shrink-0 shadow-2xs">
              <Boxes className="w-5 h-5 text-teal" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-navy-900">
                  {viewAllScope || user?.role === UserRole.ADMIN
                    ? 'Consortium-Wide Batch Ledger'
                    : `${user?.organizationName || 'Authorized Node'} Inventory`}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-dark border-2 border-slate-900">
                  {filteredBatches.length} Batches Active
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5 font-medium">
                {viewAllScope || user?.role === UserRole.ADMIN
                  ? 'Displaying all certified pharmaceutical lots registered across participating supply chain nodes.'
                  : `Dedicated domain dataset partitioned for ${user?.organizationName || 'your node'}.`}
              </p>
            </div>
          </div>

          {user?.role !== UserRole.ADMIN && (
            <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-lg border-2 border-slate-900 text-xs shrink-0 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setViewAllScope(false)}
                className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                  !viewAllScope ? 'bg-white shadow-2xs text-teal-dark border-2 border-slate-900' : 'text-slate-600 hover:text-navy-900'
                }`}
              >
                My Node Only
              </button>
              <button
                type="button"
                onClick={() => setViewAllScope(true)}
                className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                  viewAllScope ? 'bg-white shadow-2xs text-teal-dark border-2 border-slate-900' : 'text-slate-600 hover:text-navy-900'
                }`}
              >
                Global Consortium
              </button>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by batch number or medicine name..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-white border-2 border-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal text-navy-900 shadow-2xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-700 font-bold text-xs">Status Filter:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-white border-2 border-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal text-navy-900 font-semibold shadow-2xs"
            >
              <option value="">All Statuses</option>
              <option value="REGISTERED">REGISTERED</option>
              <option value="IN_TRANSIT">IN TRANSIT</option>
              <option value="STORED">STORED</option>
              <option value="DELIVERED">DELIVERED</option>
              <option value="QUARANTINED">QUARANTINED</option>
              <option value="RECALLED">RECALLED</option>
            </select>
          </div>
        </div>

        {/* Batches Table */}
        <Card padding={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-soft border-b border-surface-border text-navy-700 uppercase font-semibold text-[11px]">
                <tr>
                  <th className="px-5 py-3">Batch Number</th>
                  <th className="px-5 py-3">Medicine Formulation</th>
                  <th className="px-5 py-3">Inventory</th>
                  <th className="px-5 py-3">Mfg / Exp Dates</th>
                  <th className="px-5 py-3">Temp Range</th>
                  <th className="px-5 py-3">Ledger Status</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border text-navy-900">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-8 text-center text-navy-700">
                      Loading registered batches...
                    </td>
                  </tr>
                ) : filteredBatches.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-8 text-center text-navy-700">
                      No batches match the selected criteria.
                    </td>
                  </tr>
                ) : (
                  filteredBatches.map(b => (
                    <tr key={b.id} className="hover:bg-surface-soft/60 transition-colors">
                      <td className="px-5 py-3.5 font-mono font-bold text-navy-900">
                        {b.batchNumber}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-semibold block">{b.product?.name}</span>
                        <span className="text-[11px] text-navy-700">{b.manufacturer?.name}</span>
                      </td>
                      <td className="px-5 py-3.5 font-mono">
                        {b.remainingQuantity} / {b.quantity} {b.unitOfMeasure}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="block font-mono text-[11px]">{new Date(b.mfgDate).toLocaleDateString()}</span>
                        <span className="block font-mono text-[11px] text-navy-700">Exp: {new Date(b.expDate).toLocaleDateString()}</span>
                      </td>
                      <td className="px-5 py-3.5 font-mono font-semibold text-teal-dark">
                        {b.minTempCelsius}°C to {b.maxTempCelsius}°C
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                          <ShieldCheck className="w-3.5 h-3.5 text-status-green" />
                          <span>Sealed (SHA-256)</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        {getStatusBadge(b.status)}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedBatch(b)}
                        >
                          Dossier
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

      {/* Register Batch Modal */}
      <Modal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        title="Register Pharmaceutical Batch"
        subtitle="Computes canonical SHA-256 payload hash and records on ledger"
        maxWidth="lg"
      >
        {registerError && (
          <div className="mb-4 p-3 rounded bg-red-50 border border-status-red/20 flex items-center gap-2 text-status-redDark text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{registerError}</span>
          </div>
        )}

        <div className="mb-3 flex items-center justify-between p-2 rounded bg-teal-subtle/40 border border-teal/20 text-xs">
          <span className="text-teal-dark font-medium">Testing batch registration & ledger hashing?</span>
          <button
            type="button"
            onClick={() => {
              const firstProd = productsData?.products[0];
              const randBatch = `VAC-2026-${Math.floor(100 + Math.random() * 900)}X`;
              if (firstProd) {
                setForm({
                  productId: firstProd.id,
                  batchNumber: randBatch,
                  mfgDate: new Date().toISOString().slice(0, 10),
                  expDate: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().slice(0, 10),
                  quantity: 2500,
                  unitOfMeasure: 'vials',
                  minTempCelsius: firstProd.minTempCelsius,
                  maxTempCelsius: firstProd.maxTempCelsius,
                  notes: 'Cleanroom Class A filling line #4. Sterile seal inspection certified.'
                });
              }
            }}
            className="px-2.5 py-1 rounded bg-teal text-white font-semibold hover:bg-teal-dark transition-colors text-[11px]"
          >
            + Auto-Fill Demo Batch Data
          </button>
        </div>

        <form onSubmit={handleRegisterSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-navy-900 mb-1">Select Formulation *</label>
            <select
              required
              value={form.productId}
              onChange={(e) => handleProductSelect(e.target.value)}
              className="w-full px-3 py-2 bg-white border-2 border-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal text-navy-900 font-semibold shadow-2xs"
            >
              <option value="">-- Choose Approved Product --</option>
              {productsData?.products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} (GTIN: {p.gtin})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-navy-900 mb-1">Batch / Lot Number *</label>
              <input
                type="text"
                required
                value={form.batchNumber}
                onChange={(e) => setForm({ ...form, batchNumber: e.target.value.toUpperCase() })}
                placeholder="e.g. VAC-2026-990A"
                className="w-full px-3 py-2 font-mono uppercase bg-white border-2 border-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal text-navy-900 font-semibold shadow-2xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-navy-900 mb-1">Quantity *</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  required
                  min={1}
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value, 10) })}
                  className="w-2/3 px-3 py-2 font-mono bg-white border-2 border-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal text-navy-900 font-semibold shadow-2xs"
                />
                <input
                  type="text"
                  value={form.unitOfMeasure}
                  onChange={(e) => setForm({ ...form, unitOfMeasure: e.target.value })}
                  placeholder="vials"
                  className="w-1/3 px-3 py-2 bg-white border-2 border-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal text-navy-900 font-semibold shadow-2xs"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-navy-900 mb-1">Manufacturing Date *</label>
              <input
                type="date"
                required
                value={form.mfgDate}
                onChange={(e) => setForm({ ...form, mfgDate: e.target.value })}
                className="w-full px-3 py-2 bg-white border-2 border-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal text-navy-900 font-semibold shadow-2xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-navy-900 mb-1">Expiration Date *</label>
              <input
                type="date"
                required
                value={form.expDate}
                onChange={(e) => setForm({ ...form, expDate: e.target.value })}
                className="w-full px-3 py-2 bg-white border-2 border-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal text-navy-900 font-semibold shadow-2xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 p-3 bg-surface-soft rounded-xl border-2 border-slate-900">
            <div>
              <label className="block font-semibold text-navy-900 mb-1">Min Safe Temp (°C) *</label>
              <input
                type="number"
                step="0.5"
                required
                value={form.minTempCelsius}
                onChange={(e) => setForm({ ...form, minTempCelsius: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 font-mono bg-white border-2 border-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal text-navy-900 font-semibold shadow-2xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-navy-900 mb-1">Max Safe Temp (°C) *</label>
              <input
                type="number"
                step="0.5"
                required
                value={form.maxTempCelsius}
                onChange={(e) => setForm({ ...form, maxTempCelsius: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 font-mono bg-white border-2 border-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal text-navy-900 font-semibold shadow-2xs"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-navy-900 mb-1">Cleanroom / Batch Release Notes</label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Packaging line release notes, sterilization certificates..."
              className="w-full px-3 py-2 bg-white border-2 border-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal text-navy-900 font-medium shadow-2xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-surface-border">
            <Button type="button" variant="outline" onClick={() => setIsRegisterOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={registerMutation.isPending}>
              Seal & Register on Ledger
            </Button>
          </div>
        </form>
      </Modal>

      {/* Batch Dossier & Barcode Modal */}
      {selectedBatch && (
        <Modal
          isOpen={!!selectedBatch}
          onClose={() => setSelectedBatch(null)}
          title={`Batch Dossier: ${selectedBatch.batchNumber}`}
          subtitle={`Product: ${selectedBatch.product?.name || 'Registered Formulation'}`}
          maxWidth="xl"
        >
          <div className="space-y-4 text-xs">
            {/* Top Barcode and Metadata Split */}
            <div className="flex flex-col md:flex-row gap-5 p-4 bg-slate-50 rounded-xl border-2 border-slate-900 shadow-2xs">
              {/* QR Code Container */}
              <div className="flex flex-col items-center justify-center p-3 bg-white rounded-lg border-2 border-slate-900 shrink-0 shadow-2xs">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="Medi Trace QR" className="w-36 h-36" />
                ) : (
                  <div className="w-36 h-36 flex items-center justify-center text-slate-400">Loading QR...</div>
                )}
                <span className="text-[10px] text-navy-900 font-mono font-bold mt-1">Medi Trace QR Matrix</span>
              </div>

              {/* Core Attributes */}
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-navy-900">Registration Status:</span>
                  {getStatusBadge(selectedBatch.status)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 font-medium">Manufacturer:</span>
                  <span className="font-semibold text-navy-900">{selectedBatch.manufacturer?.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 font-medium">Remaining Inventory:</span>
                  <span className="font-mono font-bold text-navy-900">
                    {selectedBatch.remainingQuantity} / {selectedBatch.quantity} {selectedBatch.unitOfMeasure}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 font-medium">Temperature Bounds:</span>
                  <span className="font-mono font-bold text-teal-dark">
                    {selectedBatch.minTempCelsius}°C to {selectedBatch.maxTempCelsius}°C
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 font-medium">Valid Dates:</span>
                  <span className="font-mono text-navy-900 font-medium">
                    {new Date(selectedBatch.mfgDate).toLocaleDateString()} → {new Date(selectedBatch.expDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* GS1 DataMatrix Payload */}
            <div>
              <label className="block font-semibold text-navy-900 mb-1">GS1 DataMatrix Human-Readable String</label>
              <div className="p-2.5 rounded-lg bg-white border-2 border-slate-900 font-mono text-[11px] text-navy-900 break-all select-all shadow-2xs">
                {selectedBatch.gs1DataMatrixPayload}
              </div>
            </div>

            {/* Cryptographic Proof Card */}
            <div className="p-3.5 bg-white border-2 border-slate-900 rounded-xl space-y-2 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-navy-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-status-green" />
                  Canonical SHA-256 Hash Proof
                </span>
                <button
                  onClick={() => copyHash(selectedBatch.canonicalHash)}
                  className="flex items-center gap-1 text-[11px] text-teal-dark font-bold hover:underline"
                >
                  {copiedHash ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedHash ? 'Copied' : 'Copy Hash'}
                </button>
              </div>
              <div className="font-mono text-[11px] text-slate-800 break-all bg-slate-50 p-2.5 rounded border border-slate-200">
                {selectedBatch.canonicalHash || 'N/A'}
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-600 font-medium pt-1">
                <span>Blockchain Tx Reference:</span>
                <span className="font-mono text-navy-900 font-bold truncate max-w-[240px]">{selectedBatch.blockchainTxId || 'Pending'}</span>
              </div>
            </div>

            {/* Notes if present */}
            {selectedBatch.notes && (
              <div className="p-2.5 bg-surface-soft rounded text-[11px] text-navy-700">
                <span className="font-semibold text-navy-900 block mb-0.5">Audit Notes:</span>
                {selectedBatch.notes}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-surface-border">
              <div className="flex items-center gap-2">
                {hasRole(UserRole.MANUFACTURER, UserRole.ADMIN) && (
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<ShieldAlert className="w-4 h-4 text-status-red" />}
                    onClick={() => setIsStatusModalOpen(true)}
                  >
                    Change Status (Recall/Quarantine)
                  </Button>
                )}
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<QrCode className="w-4 h-4" />}
                  onClick={() => {
                    setSelectedBatch(null);
                    navigate('/verify');
                  }}
                >
                  Verify in Scanner
                </Button>
              </div>
              <Button variant="secondary" size="sm" onClick={() => setSelectedBatch(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Status Change / Recall Modal */}
      {isStatusModalOpen && selectedBatch && (
        <Modal
          isOpen={isStatusModalOpen}
          onClose={() => setIsStatusModalOpen(false)}
          title={`Update Status: ${selectedBatch.batchNumber}`}
          subtitle="Authorized regulatory or manufacturer status adjustment"
          maxWidth="md"
        >
          {statusError && (
            <div className="mb-4 p-3 rounded bg-red-50 border border-status-red/20 text-status-redDark text-xs">
              {statusError}
            </div>
          )}

          <form onSubmit={handleStatusSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-semibold text-navy-900 mb-1">New Target Status *</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as BatchStatus)}
                className="w-full px-3 py-2 bg-white border-2 border-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal font-bold text-navy-900 shadow-2xs"
              >
                <option value={BatchStatus.QUARANTINED}>QUARANTINED (Hold for inspection)</option>
                <option value={BatchStatus.RECALLED}>RECALLED (Mandatory safety withdrawal)</option>
                <option value={BatchStatus.STORED}>STORED (Normal depot inventory)</option>
                <option value={BatchStatus.DELIVERED}>DELIVERED (Released to dispensing)</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-semibold text-navy-900">Reason & Justification *</label>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setNewStatus(BatchStatus.QUARANTINED);
                      setStatusReason('Thermal excursion threshold breached in transit (>8°C logged for 2 hours). Placed under quarantine for stability review.');
                    }}
                    className="text-[10px] text-teal font-semibold hover:underline"
                  >
                    + Excursion Hold
                  </button>
                  <span className="text-slate-400">|</span>
                  <button
                    type="button"
                    onClick={() => {
                      setNewStatus(BatchStatus.STORED);
                      setStatusReason('Batch released to inventory following secondary QA laboratory assay and cold-chain compliance clearance.');
                    }}
                    className="text-[10px] text-teal font-semibold hover:underline"
                  >
                    + Release Hold
                  </button>
                </div>
              </div>
              <textarea
                required
                rows={3}
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                placeholder="Document clinical justification, inspection report number, or cold-chain excursion ref..."
                className="w-full px-3 py-2 bg-white border-2 border-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal text-navy-900 font-medium shadow-2xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-surface-border">
              <Button type="button" variant="outline" onClick={() => setIsStatusModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="danger" isLoading={statusMutation.isPending}>
                Confirm Status Transition
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
