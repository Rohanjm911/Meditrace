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
import { Pill, Plus, Search, Thermometer, ShieldCheck, Check, AlertCircle, Boxes } from 'lucide-react';

export const MedicinesPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasRole } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    genericName: '',
    gtin: '',
    dosageForm: 'Sterile Injection',
    strength: '',
    description: '',
    minTempCelsius: 2.0,
    maxTempCelsius: 8.0,
    requiresColdChain: true,
    regulatoryApprovalId: ''
  });
  const [formError, setFormError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => api.getProducts()
  });

  const createMutation = useMutation({
    mutationFn: (newProd: any) => api.createProduct(newProd),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsModalOpen(false);
      setFormData({
        name: '',
        genericName: '',
        gtin: '',
        dosageForm: 'Sterile Injection',
        strength: '',
        description: '',
        minTempCelsius: 2.0,
        maxTempCelsius: 8.0,
        requiresColdChain: true,
        regulatoryApprovalId: ''
      });
      setFormError(null);
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to create product');
    }
  });

  const products = data?.products || [];
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.genericName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.gtin.includes(searchTerm)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!/^\d{14}$/.test(formData.gtin)) {
      setFormError('GTIN must be exactly 14 digits (e.g. 00300010099999)');
      return;
    }
    if (formData.minTempCelsius >= formData.maxTempCelsius) {
      setFormError('Minimum temperature must be strictly less than maximum temperature');
      return;
    }
    createMutation.mutate(formData);
  };

  return (
    <div>
      <Header
        title="Medicine Catalogue"
        subtitle="Standardized Pharmaceutical Products & Regulatory Formulations"
        action={
          hasRole(UserRole.MANUFACTURER, UserRole.ADMIN) && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setIsModalOpen(true)}
            >
              Register Product
            </Button>
          )
        }
      />

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Search Bar */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by product name, generic name, or GTIN..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-white border-2 border-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal text-navy-900 shadow-2xs"
            />
          </div>
          <span className="text-xs text-navy-700 font-medium">
            Showing {filteredProducts.length} registered formulation{filteredProducts.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Product Cards Grid */}
        {isLoading ? (
          <div className="text-center py-12 text-xs text-navy-700">Loading medicines...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12 bg-white border-2 border-slate-900 rounded-xl p-8 shadow-2xs">
            <Pill className="w-8 h-8 text-navy-700 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-navy-900">No products found</h3>
            <p className="text-xs text-navy-700 mt-1">Try adjusting your search criteria or register a new formulation.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProducts.map(p => (
              <Card
                key={p.id}
                className="hover:border-teal transition-colors cursor-pointer"
                headerAction={
                  <Badge variant={p.requiresColdChain ? 'teal' : 'gray'}>
                    {p.requiresColdChain ? 'Cold-Chain Required' : 'Room Temp'}
                  </Badge>
                }
              >
                <div onClick={() => setSelectedProduct(p)}>
                  <div className="flex items-start gap-3 mb-3">
                    <div className="p-2.5 rounded bg-teal-subtle text-teal-dark shrink-0">
                      <Pill className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-navy-900 line-clamp-1">{p.name}</h3>
                      <p className="text-xs text-navy-700 italic">{p.genericName}</p>
                    </div>
                  </div>

                  <p className="text-xs text-navy-700 line-clamp-2 mb-4">{p.description}</p>

                  <div className="space-y-1.5 pt-3 border-t border-surface-border text-xs">
                    <div className="flex justify-between">
                      <span className="text-navy-700">GTIN:</span>
                      <span className="font-mono font-semibold text-navy-900">{p.gtin}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-navy-700">Dosage & Strength:</span>
                      <span className="font-semibold text-navy-900">{p.dosageForm} ({p.strength})</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-navy-700">Storage Temperature:</span>
                      <span className="font-semibold text-teal-dark flex items-center gap-1">
                        <Thermometer className="w-3.5 h-3.5 text-teal" />
                        {p.minTempCelsius}°C to {p.maxTempCelsius}°C
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-navy-700">Manufacturer:</span>
                      <span className="text-navy-900 font-medium truncate max-w-[180px]">{p.manufacturer?.name}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Register Product Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register New Pharmaceutical Product"
        subtitle="Registers medicine metadata and approved cold-chain bounds"
        maxWidth="lg"
      >
        {formError && (
          <div className="mb-4 p-3 rounded bg-red-50 border border-status-red/20 flex items-center gap-2 text-status-redDark text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <div className="mb-3 flex items-center justify-between p-2.5 rounded-lg bg-teal-50 border-2 border-slate-900 text-xs shadow-2xs">
          <span className="text-teal-900 font-bold">Testing product registration?</span>
          <button
            type="button"
            onClick={() => {
              const rand = Math.floor(1000 + Math.random() * 9000);
              setFormData({
                name: 'SpikeVax Bivalent Booster (COVID-19)',
                genericName: 'Elasomeran / Imelasomeran mRNA',
                gtin: `003000100${rand}`,
                dosageForm: 'Sterile Suspension for Injection',
                strength: '50 mcg / 0.5 mL',
                description: 'Ultra-cold chain mRNA bivalent booster formulation indicated for active immunization against COVID-19 variants.',
                minTempCelsius: -50.0,
                maxTempCelsius: -15.0,
                requiresColdChain: true,
                regulatoryApprovalId: 'FDA-BLA-125841'
              });
            }}
            className="px-2.5 py-1 rounded bg-teal text-white font-semibold hover:bg-teal-dark transition-colors text-[11px]"
          >
            + Auto-Fill Demo Formulation
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-navy-900 mb-1">Product Brand Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Comirnaty COVID-19 mRNA Vaccine"
              className="w-full px-3 py-2 bg-white border-2 border-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal text-navy-900 font-medium shadow-2xs"
            />
          </div>

          <div>
            <label className="block font-semibold text-navy-900 mb-1">Generic / Scientific Formulation Name *</label>
            <input
              type="text"
              required
              value={formData.genericName}
              onChange={(e) => setFormData({ ...formData, genericName: e.target.value })}
              placeholder="e.g. Tozinameran (mRNA-1273)"
              className="w-full px-3 py-2 bg-white border-2 border-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal text-navy-900 font-medium shadow-2xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-navy-900 mb-1">GS1 GTIN (14 Digits) *</label>
              <input
                type="text"
                required
                maxLength={14}
                value={formData.gtin}
                onChange={(e) => setFormData({ ...formData, gtin: e.target.value })}
                placeholder="00300010023456"
                className="w-full px-3 py-2 font-mono bg-white border-2 border-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal text-navy-900 font-semibold shadow-2xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-navy-900 mb-1">Regulatory Approval ID *</label>
              <input
                type="text"
                required
                value={formData.regulatoryApprovalId}
                onChange={(e) => setFormData({ ...formData, regulatoryApprovalId: e.target.value })}
                placeholder="FDA-BLA-125742"
                className="w-full px-3 py-2 bg-white border-2 border-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal text-navy-900 font-medium shadow-2xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-navy-900 mb-1">Dosage Form *</label>
              <input
                type="text"
                required
                value={formData.dosageForm}
                onChange={(e) => setFormData({ ...formData, dosageForm: e.target.value })}
                placeholder="e.g. Suspension for Injection"
                className="w-full px-3 py-2 bg-white border-2 border-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal text-navy-900 font-medium shadow-2xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-navy-900 mb-1">Strength / Concentration *</label>
              <input
                type="text"
                required
                value={formData.strength}
                onChange={(e) => setFormData({ ...formData, strength: e.target.value })}
                placeholder="e.g. 0.3 mL / dose"
                className="w-full px-3 py-2 bg-white border-2 border-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal text-navy-900 font-medium shadow-2xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 p-3 bg-surface-soft rounded-xl border-2 border-slate-900">
            <div>
              <label className="block font-semibold text-navy-900 mb-1">Min Storage Temp (°C) *</label>
              <input
                type="number"
                step="0.5"
                required
                value={formData.minTempCelsius}
                onChange={(e) => setFormData({ ...formData, minTempCelsius: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 bg-white border-2 border-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal text-navy-900 font-semibold shadow-2xs font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-navy-900 mb-1">Max Storage Temp (°C) *</label>
              <input
                type="number"
                step="0.5"
                required
                value={formData.maxTempCelsius}
                onChange={(e) => setFormData({ ...formData, maxTempCelsius: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 bg-white border-2 border-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal text-navy-900 font-semibold shadow-2xs font-mono"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="requiresColdChain"
              checked={formData.requiresColdChain}
              onChange={(e) => setFormData({ ...formData, requiresColdChain: e.target.checked })}
              className="rounded border-slate-900 text-teal focus:ring-teal"
            />
            <label htmlFor="requiresColdChain" className="text-xs font-semibold text-navy-900 cursor-pointer">
              Strict Cold-Chain Continuous Monitoring Required
            </label>
          </div>

          <div>
            <label className="block font-semibold text-navy-900 mb-1">Formulation Details & Warnings</label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Clinical instructions, excipients, and temperature constraints..."
              className="w-full px-3 py-2 bg-white border-2 border-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal text-navy-900 font-medium shadow-2xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-surface-border">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={createMutation.isPending}>
              Submit Registration
            </Button>
          </div>
        </form>
      </Modal>

      {/* Product Details Drawer / Modal */}
      {selectedProduct && (
        <Modal
          isOpen={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
          title={selectedProduct.name}
          subtitle={`Generic: ${selectedProduct.genericName} • GTIN: ${selectedProduct.gtin}`}
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-teal-subtle/30 rounded border border-teal/20 flex items-center justify-between">
              <div>
                <span className="font-semibold text-navy-900">Regulatory Approval:</span>
                <span className="ml-1.5 font-mono text-teal-dark">{selectedProduct.regulatoryApprovalId}</span>
              </div>
              <Badge variant={selectedProduct.requiresColdChain ? 'teal' : 'gray'}>
                {selectedProduct.requiresColdChain ? 'Continuous Cold-Chain' : 'Controlled Room Temp'}
              </Badge>
            </div>

            <p className="text-navy-700 leading-relaxed">{selectedProduct.description}</p>

            <div className="grid grid-cols-2 gap-3 p-3 bg-surface-soft rounded border border-surface-border">
              <div>
                <span className="text-navy-700 block mb-0.5">Permitted Storage Range:</span>
                <span className="font-bold text-sm text-navy-900">
                  {selectedProduct.minTempCelsius}°C to {selectedProduct.maxTempCelsius}°C
                </span>
              </div>
              <div>
                <span className="text-navy-700 block mb-0.5">Packaging Form:</span>
                <span className="font-bold text-sm text-navy-900">
                  {selectedProduct.dosageForm} ({selectedProduct.strength})
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-surface-border flex items-center justify-between">
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Boxes className="w-3.5 h-3.5" />}
                onClick={() => {
                  setSelectedProduct(null);
                  navigate('/batches');
                }}
              >
                View Batches on Ledger
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setSelectedProduct(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
