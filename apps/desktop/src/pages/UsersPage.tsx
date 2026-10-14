import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Header } from '../components/layout/Header';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '@meditrace/shared-types';
import {
  Users,
  Plus,
  Shield,
  Building2,
  Mail,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

export const UsersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    email: '',
    password: '',
    fullName: '',
    role: UserRole.MANUFACTURER,
    organizationId: ''
  });
  const [formError, setFormError] = useState<string | null>(null);

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.getUsers()
  });

  const { data: orgsData } = useQuery({
    queryKey: ['orgs-users'],
    queryFn: () => api.getOrganizations()
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsModalOpen(false);
      setForm({
        email: '',
        password: '',
        fullName: '',
        role: UserRole.MANUFACTURER,
        organizationId: ''
      });
      setFormError(null);
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to create user');
    }
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.updateUserStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!form.organizationId) {
      setFormError('Please select an organization');
      return;
    }
    createMutation.mutate(form);
  };

  const users = usersData?.users || [];
  const organizations = orgsData?.organizations || [];

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'navy';
      case 'MANUFACTURER': return 'teal';
      case 'DISTRIBUTOR': return 'amber';
      case 'WAREHOUSE_OPERATOR': return 'gray';
      case 'PHARMACIST': return 'green';
      default: return 'gray';
    }
  };

  return (
    <div>
      <Header
        title="Enterprise User & Access Governance"
        subtitle="Consortium Identity Administration • Argon2id Hashing • Role-Based Access Controls"
        action={
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setIsModalOpen(true)}
          >
            Create User Account
          </Button>
        }
      />

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Users Table */}
        <Card title="Active Consortium Users" subtitle="Authorized enterprise accounts across supply chain tiers" padding={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-soft border-b border-surface-border text-navy-700 uppercase font-semibold text-[11px]">
                <tr>
                  <th className="px-5 py-3">Full Name & Email</th>
                  <th className="px-5 py-3">Assigned Role</th>
                  <th className="px-5 py-3">Organization</th>
                  <th className="px-5 py-3">Account Status</th>
                  <th className="px-5 py-3">Registration Date</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border text-navy-900">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-navy-700">
                      Loading users...
                    </td>
                  </tr>
                ) : (
                  users.map(u => (
                    <tr key={u.id} className="hover:bg-surface-soft/60 transition-colors">
                      <td className="px-5 py-3.5">
                        <span className="font-bold text-navy-900 block">{u.fullName}</span>
                        <span className="text-[11px] text-slate-500 font-mono">{u.email}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge variant={getRoleBadgeVariant(u.role)}>
                          {u.role}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-semibold text-navy-900 block">{u.organizationName}</span>
                        <span className="text-[10px] text-slate-500">{u.organizationType}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge variant={u.isActive ? 'green' : 'red'}>
                          {u.isActive ? 'Active' : 'Disabled'}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 font-mono text-[11px]">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {u.id !== currentUser?.id && (
                          <Button
                            variant={u.isActive ? 'outline' : 'primary'}
                            size="sm"
                            onClick={() => statusMutation.mutate({ id: u.id, isActive: !u.isActive })}
                          >
                            {u.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Organizations Directory Card */}
        <Card title="Consortium Organizations Directory" subtitle="Registered entities with licensing credentials" padding={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-soft border-b border-surface-border text-navy-700 uppercase font-semibold text-[11px]">
                <tr>
                  <th className="px-5 py-3">Organization Name</th>
                  <th className="px-5 py-3">Supply Chain Tier</th>
                  <th className="px-5 py-3">License Credential</th>
                  <th className="px-5 py-3">Facility Address</th>
                  <th className="px-5 py-3">Official Contact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border text-navy-900">
                {organizations.map(o => (
                  <tr key={o.id} className="hover:bg-surface-soft/60 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-navy-900">
                      {o.name}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant="teal">{o.type}</Badge>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-teal-dark font-semibold">
                      {o.licenseNumber}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">
                      {o.address}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-[11px] text-slate-500">
                      {o.contactEmail}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Create User Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Provision New Enterprise User"
        subtitle="Assigns supply chain role, credentials, and organizational domain"
        maxWidth="md"
      >
        {formError && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border-2 border-slate-900 text-status-redDark text-xs font-semibold shadow-2xs">
            {formError}
          </div>
        )}

        <div className="mb-4 flex items-center justify-between p-3 rounded-xl bg-teal-50 border-2 border-slate-900 text-xs shadow-2xs">
          <span className="text-teal-dark font-bold">Testing user role onboarding?</span>
          <button
            type="button"
            onClick={() => {
              const targetOrg = organizations[0];
              const rand = Math.floor(100 + Math.random() * 900);
              setForm({
                fullName: `Dr. Vikram Sethi (${rand})`,
                email: `auditor.${rand}@meditrace.internal`,
                password: 'Password123!',
                role: UserRole.PHARMACIST,
                organizationId: targetOrg ? targetOrg.id : ''
              });
            }}
            className="px-3 py-1 rounded-lg bg-teal-700 text-white font-bold hover:bg-teal-800 transition-colors text-[11px] shadow-2xs"
          >
            + Auto-Fill Demo Pharmacist
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-bold text-navy-900 mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              placeholder="e.g. Dr. Rajesh Khanna, Head of Quality"
              className="w-full px-3 py-2 bg-white border-2 border-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal font-medium text-navy-900 shadow-2xs"
            />
          </div>

          <div>
            <label className="block font-bold text-navy-900 mb-1">Enterprise Email *</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="name@organization.com"
              className="w-full px-3 py-2 bg-white border-2 border-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal font-medium text-navy-900 shadow-2xs"
            />
          </div>

          <div>
            <label className="block font-bold text-navy-900 mb-1">Password (Argon2id Hashed) *</label>
            <input
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Minimum 6 characters"
              className="w-full px-3 py-2 bg-white border-2 border-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal font-medium text-navy-900 shadow-2xs"
            />
          </div>

          <div>
            <label className="block font-bold text-navy-900 mb-1">Assigned Role *</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
              className="w-full px-3 py-2 bg-white border-2 border-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal font-bold text-navy-900 shadow-2xs"
            >
              <option value={UserRole.ADMIN}>ADMIN (Full system oversight)</option>
              <option value={UserRole.MANUFACTURER}>MANUFACTURER (Product & Batch registration)</option>
              <option value={UserRole.DISTRIBUTOR}>DISTRIBUTOR (Dispatch & logistics transfers)</option>
              <option value={UserRole.WAREHOUSE_OPERATOR}>WAREHOUSE_OPERATOR (Cold hub storage & excursions)</option>
              <option value={UserRole.PHARMACIST}>PHARMACIST (Dispensing & verification)</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-navy-900 mb-1">Organization *</label>
            <select
              required
              value={form.organizationId}
              onChange={(e) => setForm({ ...form, organizationId: e.target.value })}
              className="w-full px-3 py-2 bg-white border-2 border-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal font-bold text-navy-900 shadow-2xs"
            >
              <option value="">-- Select Organization --</option>
              {organizations.map(o => (
                <option key={o.id} value={o.id}>
                  {o.name} ({o.type})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-surface-border">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={createMutation.isPending}>
              Create User
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
