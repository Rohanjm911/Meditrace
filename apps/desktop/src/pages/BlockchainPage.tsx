import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Header } from '../components/layout/Header';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { api } from '../services/api';
import {
  ShieldCheck,
  Blocks,
  Network,
  Search,
  CheckCircle2,
  XCircle,
  Copy,
  ExternalLink,
  Lock,
  Layers
} from 'lucide-react';

export const BlockchainPage: React.FC = () => {
  const [hashInput, setHashInput] = useState('');
  const [verificationResult, setVerificationResult] = useState<any | null>(null);

  const { data: statusData, isLoading: isStatusLoading } = useQuery({
    queryKey: ['blockchain-status'],
    queryFn: () => api.getBlockchainStatus()
  });

  const { data: txData, isLoading: isTxLoading } = useQuery({
    queryKey: ['blockchain-transactions'],
    queryFn: () => api.getBlockchainTransactions(50)
  });

  const verifyMutation = useMutation({
    mutationFn: (hash: string) => api.verifyHashOnChain(hash),
    onSuccess: (res) => {
      setVerificationResult(res.verification);
    }
  });

  const handleVerifyHash = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hashInput.trim()) return;
    verifyMutation.mutate(hashInput.trim());
  };

  const transactions = txData?.transactions || [];

  return (
    <div>
      <Header
        title="Hyperledger Fabric Ledger Explorer"
        subtitle="Permissioned Consortium Ledger • Multi-Org Endorsement • Cryptographic Integrity Engine"
      />

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Network Status Header Banner */}
        <div className="p-5 rounded-xl bg-white border-2 border-slate-900 grid grid-cols-1 md:grid-cols-4 gap-4 text-xs shadow-2xs">
          <div>
            <span className="text-slate-600 font-semibold block mb-0.5">Consortium Network Channel:</span>
            <span className="font-mono font-bold text-sm text-navy-900">{statusData?.channelName || 'meditracechannel'}</span>
          </div>
          <div>
            <span className="text-slate-600 font-semibold block mb-0.5">Smart Contract (Chaincode):</span>
            <span className="font-mono font-bold text-sm text-teal-dark">{statusData?.chaincodeName || 'meditrace-cc'} (Go v1.20)</span>
          </div>
          <div>
            <span className="text-slate-600 font-semibold block mb-0.5">Operating Mode:</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Badge variant={statusData?.mode === 'FABRIC_LIVE' ? 'green' : 'teal'}>
                {statusData?.mode || 'DEMO_INTEGRITY'}
              </Badge>
              <span className="text-[10px] text-slate-500 font-mono font-medium">Windows Native</span>
            </div>
          </div>
          <div>
            <span className="text-slate-600 font-semibold block mb-0.5">Total Confirmed Transactions:</span>
            <span className="font-mono font-bold text-sm text-navy-900">{statusData?.totalTransactions ?? transactions.length}</span>
          </div>
        </div>

        {/* 4 Organizations Topology Grid */}
        <Card title="Consortium Organization Peers" subtitle="4-Tier endorsement policy (Manufacturer, Distributor, Warehouse, Pharmacy)">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            {statusData?.organizations?.map((org: any) => (
              <div key={org.mspId} className="p-3.5 rounded-xl bg-white border-2 border-slate-900 space-y-1 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-navy-900">{org.name}</span>
                  <Badge variant="teal" size="sm">Active</Badge>
                </div>
                <p className="text-[11px] font-mono text-teal-dark font-medium">{org.mspId}</p>
                <p className="text-[10px] font-mono text-slate-500 truncate">{org.peer}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Interactive Hash Verifier Card */}
        <Card title="Ledger Hash Integrity Verifier" subtitle="Test any SHA-256 batch or handoff hash against recorded ledger state">
          <form onSubmit={handleVerifyHash} className="space-y-3 text-xs">
            <div className="flex gap-2">
              <input
                type="text"
                required
                value={hashInput}
                onChange={(e) => setHashInput(e.target.value)}
                placeholder="Enter 64-character hexadecimal SHA-256 hash (e.g. 5d41402abc4b2a76b9719d911017c592...)"
                className="flex-1 px-3 py-2 font-mono text-xs bg-white border-2 border-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal text-navy-900 shadow-2xs"
              />
              <Button type="submit" variant="primary" isLoading={verifyMutation.isPending}>
                Verify on Ledger
              </Button>
            </div>

            <div className="flex items-center gap-2 flex-wrap pt-1">
              <span className="text-slate-600 font-bold text-[11px]">Quick Test Hashes:</span>
              <button
                type="button"
                onClick={() => {
                  const h = '29a01144b0a948e43510373515734530797cc94eb2249938eefca2718b8bbfca';
                  setHashInput(h);
                  verifyMutation.mutate(h);
                }}
                className="px-2.5 py-1 rounded-full bg-teal-50 text-teal-dark border-2 border-slate-900 font-mono text-[10px] hover:bg-teal-100 font-bold shadow-2xs"
              >
                Comirnaty Valid Hash
              </button>
              <button
                type="button"
                onClick={() => {
                  const h = '0000000000000000000000000000000000000000000000000000000000000000';
                  setHashInput(h);
                  verifyMutation.mutate(h);
                }}
                className="px-2.5 py-1 rounded-full bg-red-50 text-status-redDark border-2 border-slate-900 font-mono text-[10px] hover:bg-red-100 font-bold shadow-2xs"
              >
                Tampered / Unregistered Hash
              </button>
              {transactions[0] && (
                <button
                  type="button"
                  onClick={() => {
                    const h = transactions[0].payloadHash;
                    setHashInput(h);
                    verifyMutation.mutate(h);
                  }}
                  className="px-2.5 py-1 rounded-full bg-slate-100 text-navy-900 border-2 border-slate-900 font-mono text-[10px] hover:bg-slate-200 font-bold shadow-2xs"
                >
                  Latest Block #{transactions[0].blockNumber} Hash
                </button>
              )}
            </div>

            {verificationResult && (
              <div className={`p-3.5 rounded-xl border-2 border-slate-900 text-xs flex items-center justify-between shadow-2xs ${
                verificationResult.exists ? 'bg-emerald-50 text-emerald-950' : 'bg-red-50 text-red-950'
              }`}>
                <div className="flex items-center gap-2">
                  {verificationResult.exists ? (
                    <CheckCircle2 className="w-5 h-5 text-status-greenDark" />
                  ) : (
                    <XCircle className="w-5 h-5 text-status-redDark" />
                  )}
                  <div>
                    <span className="font-bold block">
                      {verificationResult.exists ? 'Hash Confirmed on Ledger' : 'Hash Not Found on Ledger'}
                    </span>
                    {verificationResult.exists && (
                      <span className="text-[11px] font-mono text-slate-700">
                        Tx ID: {verificationResult.transaction?.txId} • Block #{verificationResult.transaction?.blockNumber}
                      </span>
                    )}
                  </div>
                </div>
                <Badge variant={verificationResult.exists ? 'green' : 'red'}>
                  {verificationResult.exists ? 'CONFIRMED' : 'UNREGISTERED'}
                </Badge>
              </div>
            )}
          </form>
        </Card>

        {/* Confirmed Transactions Table */}
        <Card title="Ledger Transaction History" subtitle="Immutable transactions, block numbers, and endorsement proofs" padding={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-soft border-b border-surface-border text-navy-700 uppercase font-semibold text-[11px]">
                <tr>
                  <th className="px-5 py-3">Block #</th>
                  <th className="px-5 py-3">Transaction ID</th>
                  <th className="px-5 py-3">Smart Contract Call</th>
                  <th className="px-5 py-3">Canonical Hash</th>
                  <th className="px-5 py-3">Timestamp (UTC)</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border text-navy-900 font-mono text-[11px]">
                {isTxLoading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-navy-700 font-sans text-xs">
                      Loading transactions...
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-navy-700 font-sans text-xs">
                      No blockchain transactions recorded yet.
                    </td>
                  </tr>
                ) : (
                  transactions.map(tx => (
                    <tr key={tx.id} className="hover:bg-surface-soft/60 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-navy-900">
                        #{tx.blockNumber || 1000}
                      </td>
                      <td className="px-5 py-3.5 text-teal-dark font-medium">
                        {tx.txId.slice(0, 18)}...
                      </td>
                      <td className="px-5 py-3.5 font-sans font-semibold text-navy-900">
                        {tx.functionName}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">
                        <button
                          type="button"
                          onClick={() => {
                            setHashInput(tx.payloadHash);
                            verifyMutation.mutate(tx.payloadHash);
                            window.scrollTo({ top: 120, behavior: 'smooth' });
                          }}
                          className="hover:text-teal font-medium hover:underline text-left cursor-pointer"
                          title="Click to verify this payload hash on chain"
                        >
                          {tx.payloadHash.slice(0, 16)}...
                        </button>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 font-sans">
                        {new Date(tx.timestamp).toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5 font-sans">
                        <Badge variant="green" size="sm">
                          {tx.status}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};
