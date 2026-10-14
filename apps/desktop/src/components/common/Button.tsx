import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

import { soundService } from '../../services/soundService';

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  onClick,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-bold transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed select-none rounded-xl active:scale-[0.98] border-2 border-slate-900 shadow-2xs';

  const variants = {
    primary: 'bg-teal-700 text-white hover:bg-teal-800 focus:ring-teal active:bg-teal-900',
    secondary: 'bg-slate-900 text-white hover:bg-slate-800 focus:ring-slate-700 active:bg-black',
    danger: 'bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-500 active:bg-rose-800',
    outline: 'bg-white text-slate-900 hover:bg-slate-50 focus:ring-teal',
    ghost: 'bg-transparent text-slate-700 hover:bg-slate-100 hover:text-slate-900 focus:ring-teal border-transparent shadow-none'
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-5 py-2.5 gap-2.5'
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      onClick={(e) => {
        soundService.playClick();
        if (onClick) onClick(e);
      }}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
      ) : (
        leftIcon && <span className="flex items-center">{leftIcon}</span>
      )}
      {children}
      {!isLoading && rightIcon && <span className="flex items-center">{rightIcon}</span>}
    </button>
  );
};
