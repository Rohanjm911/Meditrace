import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
  Bell,
  ExternalLink
} from 'lucide-react';
import { soundService } from '../services/soundService';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  message?: string;
  duration?: number; // ms, default 4500ms. Set 0 for sticky
  action?: ToastAction;
  playSound?: boolean;
}

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration: number;
  action?: ToastAction;
  createdAt: number;
}

interface ToastContextType {
  toasts: ToastItem[];
  history: ToastItem[];
  addToast: (type: ToastType, title: string, options?: ToastOptions) => string;
  removeToast: (id: string) => void;
  clearAll: () => void;
  clearHistory: () => void;
  success: (title: string, message?: string, options?: ToastOptions) => string;
  error: (title: string, message?: string, options?: ToastOptions) => string;
  warning: (title: string, message?: string, options?: ToastOptions) => string;
  info: (title: string, message?: string, options?: ToastOptions) => string;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Standalone event-driven bus for usage outside React components
const TOAST_EVENT = 'meditrace:toast-event';

export const toast = {
  success: (title: string, message?: string, options?: ToastOptions) => {
    window.dispatchEvent(
      new CustomEvent(TOAST_EVENT, {
        detail: { type: 'success', title, options: { ...options, message: message || options?.message } }
      })
    );
  },
  error: (title: string, message?: string, options?: ToastOptions) => {
    window.dispatchEvent(
      new CustomEvent(TOAST_EVENT, {
        detail: { type: 'error', title, options: { ...options, message: message || options?.message } }
      })
    );
  },
  warning: (title: string, message?: string, options?: ToastOptions) => {
    window.dispatchEvent(
      new CustomEvent(TOAST_EVENT, {
        detail: { type: 'warning', title, options: { ...options, message: message || options?.message } }
      })
    );
  },
  info: (title: string, message?: string, options?: ToastOptions) => {
    window.dispatchEvent(
      new CustomEvent(TOAST_EVENT, {
        detail: { type: 'info', title, options: { ...options, message: message || options?.message } }
      })
    );
  }
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [history, setHistory] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback(
    (type: ToastType, title: string, options?: ToastOptions): string => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const duration = options?.duration !== undefined ? options.duration : 4500;
      const playSound = options?.playSound !== false;

      const newToast: ToastItem = {
        id,
        type,
        title,
        message: options?.message,
        duration,
        action: options?.action,
        createdAt: Date.now()
      };

      // Play corresponding tactile UI acoustic feedback
      if (playSound) {
        switch (type) {
          case 'success':
            soundService.playSuccess();
            break;
          case 'error':
            soundService.playError();
            break;
          case 'warning':
            soundService.playWarning();
            break;
          case 'info':
            soundService.playClick();
            break;
        }
      }

      setToasts(prev => [newToast, ...prev].slice(0, 5)); // Keep max 5 visible stack
      setHistory(prev => [newToast, ...prev].slice(0, 30)); // History keep 30

      return id;
    },
    []
  );

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  const success = useCallback(
    (title: string, message?: string, options?: ToastOptions) =>
      addToast('success', title, { ...options, message: message || options?.message }),
    [addToast]
  );

  const error = useCallback(
    (title: string, message?: string, options?: ToastOptions) =>
      addToast('error', title, { ...options, message: message || options?.message }),
    [addToast]
  );

  const warning = useCallback(
    (title: string, message?: string, options?: ToastOptions) =>
      addToast('warning', title, { ...options, message: message || options?.message }),
    [addToast]
  );

  const info = useCallback(
    (title: string, message?: string, options?: ToastOptions) =>
      addToast('info', title, { ...options, message: message || options?.message }),
    [addToast]
  );

  // Subscribe to standalone window events
  useEffect(() => {
    const handler = (e: Event) => {
      const { type, title, options } = (e as CustomEvent).detail;
      addToast(type, title, options);
    };

    window.addEventListener(TOAST_EVENT, handler);
    return () => window.removeEventListener(TOAST_EVENT, handler);
  }, [addToast]);

  return (
    <ToastContext.Provider
      value={{
        toasts,
        history,
        addToast,
        removeToast,
        clearAll,
        clearHistory,
        success,
        error,
        warning,
        info
      }}
    >
      {children}
      {/* Pop Up Notification Render Portal */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// ============================================================================
// TOAST CONTAINER & INDIVIDUAL TOAST CARD
// ============================================================================

interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  return (
    <div
      aria-live="polite"
      className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0 select-none"
    >
      {toasts.map(item => (
        <ToastCard key={item.id} item={item} onDismiss={() => onDismiss(item.id)} />
      ))}
    </div>
  );
};

interface ToastCardProps {
  item: ToastItem;
  onDismiss: () => void;
}

const ToastCard: React.FC<ToastCardProps> = ({ item, onDismiss }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [progress, setProgress] = useState(100);
  const startTimeRef = useRef<number>(Date.now());
  const remainingRef = useRef<number>(item.duration);

  useEffect(() => {
    if (item.duration <= 0) return;

    let animFrame: number;
    const updateProgress = () => {
      if (!isHovered) {
        const elapsed = Date.now() - startTimeRef.current;
        const currentRemaining = Math.max(0, remainingRef.current - elapsed);
        const nextPct = (currentRemaining / item.duration) * 100;
        setProgress(nextPct);

        if (currentRemaining <= 0) {
          onDismiss();
          return;
        }
      }
      animFrame = requestAnimationFrame(updateProgress);
    };

    animFrame = requestAnimationFrame(updateProgress);

    return () => cancelAnimationFrame(animFrame);
  }, [item.duration, isHovered, onDismiss]);

  const handleMouseEnter = () => {
    setIsHovered(true);
    remainingRef.current = remainingRef.current - (Date.now() - startTimeRef.current);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    startTimeRef.current = Date.now();
  };

  const getTypeStyles = () => {
    switch (item.type) {
      case 'success':
        return {
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
          badgeBg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
          progressBar: 'bg-emerald-500',
          accent: 'border-l-4 border-l-emerald-500'
        };
      case 'error':
        return {
          icon: <AlertCircle className="w-4 h-4 text-red-600" />,
          badgeBg: 'bg-red-50 border-red-200 text-red-700',
          progressBar: 'bg-red-500',
          accent: 'border-l-4 border-l-red-500'
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-4 h-4 text-amber-600" />,
          badgeBg: 'bg-amber-50 border-amber-200 text-amber-700',
          progressBar: 'bg-amber-500',
          accent: 'border-l-4 border-l-amber-500'
        };
      case 'info':
      default:
        return {
          icon: <Info className="w-4 h-4 text-teal" />,
          badgeBg: 'bg-teal-subtle/50 border-teal/30 text-teal-dark',
          progressBar: 'bg-teal',
          accent: 'border-l-4 border-l-teal'
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`pointer-events-auto bg-white rounded-xl shadow-xl shadow-slate-900/10 overflow-hidden relative transition-all duration-200 animate-toast-enter flex flex-col ${styles.accent}`}
      style={{
        border: '1.5px solid #000000',
        outline: '1px solid #000000'
      }}
    >
      <div className="p-3.5 flex items-start gap-3">
        {/* Icon Pill */}
        <div className={`p-1.5 rounded-lg border shrink-0 ${styles.badgeBg}`}>
          {styles.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-xs font-bold text-navy-900 truncate leading-tight">
              {item.title}
            </h4>
            <span className="text-[10px] font-mono text-slate-400 shrink-0">
              {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>

          {item.message && (
            <p className="text-[11px] text-navy-700 mt-1 leading-snug line-clamp-3 font-normal">
              {item.message}
            </p>
          )}

          {/* Action Button */}
          {item.action && (
            <div className="mt-2.5">
              <button
                onClick={() => {
                  item.action?.onClick();
                  onDismiss();
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-navy-900 hover:bg-navy-800 text-white font-semibold text-[10px] transition-colors shadow-2xs"
                style={{ border: '1px solid #000000' }}
              >
                <span>{item.action.label}</span>
                <ExternalLink className="w-3 h-3 text-teal-light" />
              </button>
            </div>
          )}
        </div>

        {/* Dismiss Button */}
        <button
          onClick={onDismiss}
          className="p-1 text-slate-400 hover:text-navy-900 hover:bg-slate-100 rounded-md transition-colors shrink-0 -mr-1 -mt-1"
          title="Dismiss notification"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Progress Shrink Bar */}
      {item.duration > 0 && (
        <div className="w-full bg-slate-100 h-1 overflow-hidden">
          <div
            className={`h-full transition-all duration-75 ${styles.progressBar}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
};
