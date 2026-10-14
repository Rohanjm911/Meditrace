import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard,
  Pill,
  Boxes,
  Truck,
  ThermometerSnowflake,
  AlertTriangle,
  QrCode,
  ShieldCheck,
  Users,
  FileText,
  Download,
  Settings,
  ChevronLeft,
  ChevronRight,
  Shield,
  Activity,
  BarChart3
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '@meditrace/shared-types';
import { soundService } from '../../services/soundService';
import { api } from '../../services/api';

interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  badge?: number | null;
  adminOnly?: boolean;
}

interface NavSection {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  items: NavItem[];
}

export const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useAuth();

  // Live count for active alerts badge
  const { data: alertsData } = useQuery({
    queryKey: ['sidebar-alerts-badge'],
    queryFn: () => api.getAlerts({ status: 'ACTIVE' }),
    refetchInterval: 15000,
    staleTime: 10000
  });

  const activeAlertsCount = alertsData?.alerts?.filter((a: any) => a.status === 'ACTIVE')?.length || 0;

  // Categorized Navigation Sections with Dedicated Category Icons
  const navSections: NavSection[] = [
    {
      title: 'Operations',
      icon: Activity,
      iconColor: 'text-teal-400',
      items: [
        { label: 'Dashboard', path: '/', icon: LayoutDashboard, iconColor: 'text-teal-400' },
        { label: 'Medicine Catalogue', path: '/medicines', icon: Pill, iconColor: 'text-sky-400' },
        { label: 'Batches & Lots', path: '/batches', icon: Boxes, iconColor: 'text-amber-400' },
        { label: 'Shipments & Handoffs', path: '/shipments', icon: Truck, iconColor: 'text-blue-400' },
        { label: 'Cold-Chain Monitoring', path: '/cold-chain', icon: ThermometerSnowflake, iconColor: 'text-cyan-300' }
      ]
    },
    {
      title: 'Integrity & Quality',
      icon: ShieldCheck,
      iconColor: 'text-emerald-400',
      items: [
        {
          label: 'Alerts & Excursions',
          path: '/alerts',
          icon: AlertTriangle,
          iconColor: 'text-rose-400',
          badge: activeAlertsCount > 0 ? activeAlertsCount : null
        },
        { label: 'Verify Product (QR/GS1)', path: '/verify', icon: QrCode, iconColor: 'text-teal-300' },
        { label: 'Blockchain Ledger', path: '/blockchain', icon: ShieldCheck, iconColor: 'text-indigo-400' },
        { label: 'Audit Trail', path: '/audit-logs', icon: FileText, iconColor: 'text-violet-400' }
      ]
    },
    {
      title: 'Management & Reports',
      icon: BarChart3,
      iconColor: 'text-indigo-400',
      items: [
        { label: 'Reports & Export', path: '/reports', icon: Download, iconColor: 'text-emerald-400' },
        { label: 'User & Role Access', path: '/users', icon: Users, iconColor: 'text-amber-400', adminOnly: true },
        { label: 'Settings & Health', path: '/settings', icon: Settings, iconColor: 'text-slate-300' }
      ]
    }
  ];

  return (
    <aside
      className={`bg-navy-900 text-white flex flex-col transition-all duration-200 border-r-2 border-slate-900 z-30 select-none ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-3.5 border-b border-navy-800 bg-navy-950">
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-white to-slate-100 p-1 flex items-center justify-center shadow-md shadow-black/40 overflow-hidden shrink-0 border border-white/20">
              <img
                src="/logo-tight.png"
                alt="Medi Trace Logo"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.currentTarget as any).src = '/logo.png';
                }}
              />
            </div>
            <div>
              <span className="font-bold text-[15px] tracking-wide text-white leading-none block">
                Medi Trace
              </span>
              <span className="block text-[10px] text-teal-light font-medium tracking-tight mt-0.5">
                Every Batch. Every Journey.
              </span>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-9 h-9 mx-auto rounded-xl bg-gradient-to-br from-white to-slate-100 p-1 flex items-center justify-center shadow-md shadow-black/40 overflow-hidden border border-white/20">
            <img
              src="/logo-tight.png"
              alt="Medi Trace Logo"
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.currentTarget as any).src = '/logo.png';
              }}
            />
          </div>
        )}
        <button
          onClick={() => {
            soundService.playClick();
            setCollapsed(!collapsed);
          }}
          className={`p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-navy-800 transition-colors ${
            collapsed ? 'hidden' : ''
          }`}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Categorized Navigation List */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4 no-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {navSections.map((section, sIndex) => {
          const visibleItems = section.items.filter(
            item => !item.adminOnly || user?.role === UserRole.ADMIN
          );
          if (visibleItems.length === 0) return null;

          return (
            <div key={section.title} className="space-y-1">
              {!collapsed && (
                <div className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <section.icon className={`w-3.5 h-3.5 ${section.iconColor}`} />
                  <span>{section.title}</span>
                </div>
              )}
              {collapsed && sIndex > 0 && (
                <div className="my-2 mx-3 border-t border-navy-800/80" />
              )}

              <div className="space-y-0.5">
                {visibleItems.map(item => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => soundService.playClick()}
                    className={({ isActive }) =>
                      `group relative flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                        isActive
                          ? 'bg-teal-600 text-white font-semibold shadow-sm shadow-teal-950/50 ring-1 ring-teal-400/40'
                          : 'text-slate-300 hover:bg-navy-800/80 hover:text-white'
                      } ${collapsed ? 'justify-center px-0' : ''}`
                    }
                    title={collapsed ? item.label : undefined}
                  >
                    {({ isActive }) => (
                      <>
                        <div
                          className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 transition-all duration-150 ${
                            isActive
                              ? 'bg-white/20 text-white shadow-2xs'
                              : 'bg-navy-800/90 group-hover:bg-navy-700/90'
                          }`}
                        >
                          <item.icon
                            className={`w-3.5 h-3.5 transition-transform duration-150 ${
                              isActive
                                ? 'text-white scale-105'
                                : `${item.iconColor} group-hover:scale-110`
                            }`}
                          />
                        </div>
                        {!collapsed && (
                          <span className="truncate flex-1 tracking-tight">
                            {item.label}
                          </span>
                        )}
                        {!collapsed && item.badge !== undefined && item.badge !== null && (
                          <span className="ml-auto px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-red-500 text-white shadow-2xs">
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Footer / Toggle for collapsed mode */}
      {collapsed && (
        <div className="p-2 border-t border-navy-800 flex justify-center">
          <button
            onClick={() => {
              soundService.playClick();
              setCollapsed(false);
            }}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-navy-800 transition-colors"
            title="Expand sidebar"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Live System Mode indicator in sidebar footer */}
      {!collapsed && (
        <div className="p-3 border-t border-navy-800 bg-navy-950/90 text-[11px] text-slate-400">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-semibold text-slate-300">System Mode</span>
            <span className="inline-flex items-center gap-1.5 text-emerald-400 font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Live Node
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span className="truncate max-w-[130px] font-medium text-slate-300">
              {user?.organizationName || 'Central Network'}
            </span>
            <span className="font-mono text-teal-light font-semibold">21 CFR-11</span>
          </div>
        </div>
      )}
    </aside>
  );
};
