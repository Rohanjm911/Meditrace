import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Badge } from '../common/Badge';
import {
  LogOut,
  User as UserIcon,
  Building2,
  Volume2,
  VolumeX,
  Bell,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  Trash2,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { soundService } from '../../services/soundService';

interface HeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle, action }) => {
  const { user, logout } = useAuth();
  const { toasts, history, clearHistory, success, error, warning, info } = useToast();
  const [soundEnabled, setSoundEnabled] = useState(soundService.getSoundEnabled());
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close notifications dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleSound = () => {
    const next = soundService.toggleSound();
    setSoundEnabled(next);
    info(
      'Acoustic Feedback',
      next ? 'Tactile sound effects enabled' : 'Sound effects muted'
    );
  };

  const getRoleBadgeVariant = (role?: string) => {
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
    <header className="sticky top-0 z-40 h-16 bg-white/95 backdrop-blur-md border-b-2 border-slate-900 px-6 flex items-center justify-between shrink-0 select-none shadow-sm relative">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 via-cyan-500 to-emerald-500"></div>
      <div>
        <h1 className="text-lg font-black text-slate-900 leading-tight">{title}</h1>
        {subtitle && <p className="text-xs text-slate-600 font-semibold">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {action && <div>{action}</div>}

        {/* Platform Walkthrough & User Guide Button */}
        <button
          onClick={() => {
            soundService.playModalOpen();
            window.dispatchEvent(new CustomEvent('meditrace:open-guide'));
          }}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-black text-teal-950 bg-teal-50 hover:bg-teal-100 border-2 border-slate-900 rounded-lg shadow-2xs transition-all hover:scale-[1.02] active:scale-[0.98]"
          title="How to Use Medi Trace (Operational User Guide)"
        >
          <HelpCircle className="w-3.5 h-3.5 text-teal-700" />
          <span className="hidden sm:inline">How to Use</span>
        </button>

        {/* Global Sound Effects Toggle */}
        <button
          onClick={handleToggleSound}
          className="p-2 text-slate-500 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors"
          title={soundEnabled ? 'Acoustic UI effects active (Click to mute)' : 'Acoustic UI muted (Click to enable)'}
        >
          {soundEnabled ? (
            <Volume2 className="w-4 h-4 text-teal-600" />
          ) : (
            <VolumeX className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {/* Notification Center Bell */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => {
              soundService.playClick();
              setShowNotifications(!showNotifications);
            }}
            className={`p-2 rounded-lg transition-colors relative ${
              showNotifications ? 'bg-teal-50 text-teal-700' : 'text-slate-500 hover:text-teal-700 hover:bg-teal-50'
            }`}
            title="Notification Center & Pop-up History"
          >
            <Bell className="w-4 h-4" />
            {toasts.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-status-red ring-2 ring-white"></span>
            )}
          </button>

          {/* Notification Center Dropdown */}
          {showNotifications && (
            <div
              className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl p-4 z-50 animate-toast-enter border-2 border-slate-900"
            >
              <div className="flex items-center justify-between pb-3 border-b-2 border-slate-900">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded bg-teal-subtle text-teal-dark">
                    <Bell className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-navy-900 leading-none">Notifications Center</h3>
                    <p className="text-[10px] text-navy-700 mt-0.5">Real-time pop-up alerts & audit events</p>
                  </div>
                </div>

                {history.length > 0 && (
                  <button
                    onClick={() => {
                      soundService.playClick();
                      clearHistory();
                    }}
                    className="p-1 text-slate-400 hover:text-status-red hover:bg-red-50 rounded text-[10px] flex items-center gap-1 transition-colors"
                    title="Clear history"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear</span>
                  </button>
                )}
              </div>

              {/* Quick Demo Notification Triggers */}
              <div className="py-2.5 border-b-2 border-slate-900 bg-slate-50 -mx-4 px-4 flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-600 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-teal" /> Test Pop-up:
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => success('Audit Passed', 'Blockchain Merkle hash verified')}
                    className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition-colors border border-slate-900"
                  >
                    Success
                  </button>
                  <button
                    onClick={() => warning('Thermal Warning', 'Sensor SENSOR-001 reading 9.2°C')}
                    className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 hover:bg-amber-200 transition-colors border border-slate-900"
                  >
                    Alert
                  </button>
                  <button
                    onClick={() => error('Tamper Flag', 'Security seal breach detected at Hub 2')}
                    className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 hover:bg-red-200 transition-colors border border-slate-900"
                  >
                    Error
                  </button>
                </div>
              </div>

              {/* Notification History List */}
              <div className="max-h-64 overflow-y-auto pt-2 space-y-2">
                {history.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-xs">
                    <p className="font-medium">No recent notifications</p>
                    <p className="text-[10px] mt-0.5">Alerts, exports, and ledger updates will pop up here.</p>
                  </div>
                ) : (
                  history.slice(0, 10).map((h) => (
                    <div
                      key={h.id}
                      className="p-2.5 rounded-xl border-2 border-slate-900 bg-white hover:bg-slate-50 transition-colors flex items-start gap-2.5 shadow-2xs"
                    >
                      <div className="mt-0.5 shrink-0">
                        {h.type === 'success' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                        {h.type === 'error' && <AlertCircle className="w-3.5 h-3.5 text-red-600" />}
                        {h.type === 'warning' && <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />}
                        {h.type === 'info' && <Info className="w-3.5 h-3.5 text-teal" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-navy-900 truncate">{h.title}</span>
                          <span className="text-[9px] font-mono text-slate-400 shrink-0">
                            {new Date(h.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        {h.message && (
                          <p className="text-[11px] text-navy-700 mt-0.5 leading-snug line-clamp-2">{h.message}</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {user && (
          <div className="flex items-center gap-3 pl-3 border-l border-surface-border">
            <div className="text-right">
              <div className="flex items-center justify-end gap-1.5">
                <span className="text-xs font-semibold text-navy-900 truncate max-w-[180px]">
                  {user.fullName}
                </span>
                <Badge variant={getRoleBadgeVariant(user.role)} size="sm">
                  {user.role}
                </Badge>
              </div>
              <div className="flex items-center justify-end gap-1 text-[11px] text-navy-700 mt-0.5">
                <Building2 className="w-3 h-3 text-teal shrink-0" />
                <span className="truncate max-w-[200px]">{user.organizationName}</span>
              </div>
            </div>

            <button
              onClick={() => {
                soundService.playClick();
                logout();
              }}
              className="p-2 text-navy-700 hover:text-status-red hover:bg-red-50 rounded transition-colors"
              title="Sign out of Medi Trace"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
