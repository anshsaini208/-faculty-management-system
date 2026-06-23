import React from 'react';
import { Spinner } from './Loader';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'destructive' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm hover:scale-[1.01] active:scale-[0.99]';

  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white font-medium border border-transparent dark:bg-blue-600 dark:hover:bg-blue-500 glow-primary',
    secondary: 'bg-white dark:bg-[#0c0c0f] text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900',
    destructive: 'bg-rose-600 hover:bg-rose-700 text-white border border-transparent dark:bg-rose-600 dark:hover:bg-rose-500',
    ghost: 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900 border border-transparent shadow-none hover:scale-100 active:scale-100'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base'
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <Spinner className="w-4 h-4 text-current" />
          <span>Please wait...</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
};
