import React from 'react';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  headerAction?: React.ReactNode;
  className?: string;
  padding?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  headerAction,
  className = '',
  padding = true
}) => {
  return (
    <div className={`bg-white border-2 border-slate-900 rounded-2xl shadow-sm card-hover transition-all duration-200 overflow-hidden ${className}`}>
      {(title || headerAction) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 border-b-2 border-slate-900 gap-2 bg-gradient-to-r from-slate-50 via-teal-50/25 to-sky-50/20">
          <div>
            {title && <h3 className="text-base font-black text-slate-900 tracking-tight">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-600 mt-0.5 font-semibold">{subtitle}</p>}
          </div>
          {headerAction && <div className="shrink-0">{headerAction}</div>}
        </div>
      )}
      <div className={padding ? 'p-6' : ''}>{children}</div>
    </div>
  );
};
