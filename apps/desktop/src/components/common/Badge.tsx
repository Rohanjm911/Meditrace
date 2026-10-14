import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'teal' | 'navy' | 'green' | 'amber' | 'red' | 'gray';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'gray',
  size = 'md',
  className = ''
}) => {
  const variants = {
    teal: 'bg-teal-50 text-teal-800 border-slate-900',
    navy: 'bg-slate-900 text-white border-slate-900',
    green: 'bg-emerald-50 text-emerald-800 border-slate-900',
    amber: 'bg-amber-50 text-amber-900 border-slate-900',
    red: 'bg-red-50 text-red-900 border-slate-900',
    gray: 'bg-slate-100 text-slate-800 border-slate-900'
  };

  const sizes = {
    sm: 'text-[11px] px-2.5 py-0.5 font-bold',
    md: 'text-xs px-3 py-1 font-bold'
  };

  return (
    <span className={`inline-flex items-center border border-slate-900 rounded-full shadow-2xs ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </span>
  );
};
