import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  icon: React.ReactNode;
  statusTag?: string;
  statusVariant?: 'teal' | 'green' | 'amber' | 'red' | 'indigo' | 'sky';
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtext,
  icon,
  statusTag,
  statusVariant = 'teal',
  onClick
}) => {
  const cardGradient = {
    teal: 'bg-gradient-to-br from-teal-50/80 via-white to-cyan-50/40 hover:border-teal-600',
    green: 'bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/40 hover:border-emerald-600',
    amber: 'bg-gradient-to-br from-amber-50/80 via-white to-orange-50/30 hover:border-amber-600',
    red: 'bg-gradient-to-br from-rose-50/80 via-white to-red-50/30 hover:border-rose-600',
    indigo: 'bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/30 hover:border-indigo-600',
    sky: 'bg-gradient-to-br from-sky-50/80 via-white to-blue-50/30 hover:border-sky-600'
  };

  const iconBg = {
    teal: 'bg-gradient-to-br from-teal-500 to-teal-700 text-white shadow-sm border-2 border-slate-900',
    green: 'bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-sm border-2 border-slate-900',
    amber: 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-sm border-2 border-slate-900',
    red: 'bg-gradient-to-br from-rose-500 via-rose-600 to-red-600 text-white shadow-md shadow-rose-500/25 border-2 border-slate-900',
    indigo: 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-sm border-2 border-slate-900',
    sky: 'bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-sm border-2 border-slate-900'
  };

  const badgeStyles = {
    teal: 'bg-teal-100 text-teal-900 border border-teal-300 font-black',
    green: 'bg-emerald-100 text-emerald-900 border border-emerald-300 font-black',
    amber: 'bg-amber-100 text-amber-900 border border-amber-300 font-black',
    red: 'bg-rose-100 text-rose-900 border border-rose-300 font-black',
    indigo: 'bg-indigo-100 text-indigo-900 border border-indigo-300 font-black',
    sky: 'bg-sky-100 text-sky-900 border border-sky-300 font-black'
  };

  return (
    <div
      onClick={onClick}
      className={`${cardGradient[statusVariant]} border-2 border-slate-900 rounded-2xl p-5 shadow-sm card-hover hover:-translate-y-1 transition-all duration-200 flex items-start justify-between group ${
        onClick ? 'cursor-pointer active:scale-[0.98]' : ''
      }`}
    >
      <div className="min-w-0 pr-3">
        <p className="text-[11px] font-black text-slate-600 uppercase tracking-wider">{title}</p>
        <p className="text-3xl font-black text-slate-900 mt-1 tracking-tight font-sans">{value}</p>
        {subtext && <p className="text-xs text-slate-700 mt-1.5 font-bold line-clamp-1">{subtext}</p>}
        {statusTag && (
          <span className={`inline-flex items-center mt-2.5 text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-2xs ${badgeStyles[statusVariant]}`}>
            {statusTag}
          </span>
        )}
      </div>
      <div className={`p-3 rounded-xl shrink-0 transition-transform duration-200 group-hover:scale-105 shadow-sm flex items-center justify-center text-white ${iconBg[statusVariant]} [&>svg]:text-white [&>svg]:stroke-white [&>svg]:stroke-[2.5] [&>svg]:drop-shadow-[0_1px_2px_rgba(0,0,0,0.25)]`}>
        {icon}
      </div>
    </div>
  );
};
