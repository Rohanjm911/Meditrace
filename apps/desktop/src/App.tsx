import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { MedicinesPage } from './pages/MedicinesPage';
import { BatchesPage } from './pages/BatchesPage';
import { ShipmentsPage } from './pages/ShipmentsPage';
import { HandoffHistoryPage } from './pages/HandoffHistoryPage';
import { ColdChainPage } from './pages/ColdChainPage';
import { AlertsPage } from './pages/AlertsPage';
import { VerificationPage } from './pages/VerificationPage';
import { BlockchainPage } from './pages/BlockchainPage';
import { UsersPage } from './pages/UsersPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { UserRole } from '@meditrace/shared-types';

const ProtectedRoute: React.FC<{ children: React.ReactNode; requiredRole?: UserRole }> = ({
  children,
  requiredRole
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-navy-950 text-white font-mono text-xs">
        Initializing Medi Trace Desktop Security Layer...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.role !== UserRole.ADMIN && user?.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <HashRouter>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="medicines" element={<MedicinesPage />} />
              <Route path="batches" element={<BatchesPage />} />
              <Route path="shipments" element={<ShipmentsPage />} />
              <Route path="handoffs" element={<HandoffHistoryPage />} />
              <Route path="cold-chain" element={<ColdChainPage />} />
              <Route path="alerts" element={<AlertsPage />} />
              <Route path="verify" element={<VerificationPage />} />
              <Route path="blockchain" element={<BlockchainPage />} />
              <Route
                path="users"
                element={
                  <ProtectedRoute requiredRole={UserRole.ADMIN}>
                    <UsersPage />
                  </ProtectedRoute>
                }
              />
              <Route path="audit-logs" element={<AuditLogsPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  </HashRouter>
);
};
