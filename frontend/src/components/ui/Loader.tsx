import React from 'react';
import { motion } from 'framer-motion';

// Circular Spinner SVG helper
export const Spinner: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg
    className={`animate-spin text-current ${className}`}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

// 1. Full Screen Loader
export const FullScreenLoader: React.FC = () => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-50 dark:bg-[#09090b]">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center gap-4"
      >
        {/* Branding Logo animation */}
        <div className="relative flex items-center justify-center">
          <div className="absolute w-12 h-12 rounded-full border-4 border-blue-500/20 dark:border-blue-500/10 animate-ping" />
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-blue-500/20">
            F
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Spinner className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
          <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300 tracking-wide font-display">
            Loading Faculty System...
          </span>
        </div>
      </motion.div>
    </div>
  );
};

// 2. Section Loader
export const SectionLoader: React.FC<{ message?: string }> = ({ message = 'Loading section...' }) => {
  return (
    <div className="w-full min-h-[250px] flex flex-col items-center justify-center gap-3 py-8">
      <Spinner className="w-8 h-8 text-blue-600 dark:text-blue-500" />
      {message && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium tracking-wide">
          {message}
        </p>
      )}
    </div>
  );
};

// 3. Skeleton Loader (Pulsing shapes)
interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'card' | 'table' | 'circle';
}

export const SkeletonLoader: React.FC<SkeletonProps> = ({ className = '', variant = 'text' }) => {
  if (variant === 'card') {
    return (
      <div className={`p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0c0c0f] animate-pulse ${className}`}>
        <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-1/3 mb-4" />
        <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded w-1/2 mb-2" />
        <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-2/3" />
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div className={`space-y-4 animate-pulse ${className}`}>
        <div className="h-10 bg-zinc-200 dark:bg-zinc-800 rounded-lg w-full" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-4 items-center py-2 border-b border-zinc-100 dark:border-zinc-800">
            <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-1/4" />
            <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-1/5" />
            <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-1/6" />
            <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-1/5 ml-auto" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'circle') {
    return <div className={`rounded-full bg-zinc-200 dark:bg-zinc-800 animate-pulse ${className}`} />;
  }

  // default text skeleton
  return (
    <div className={`h-4 bg-zinc-200 dark:bg-zinc-800 rounded-md animate-pulse ${className}`} />
  );
};

// 4. Button Loader (Embedded in buttons)
export const ButtonLoader: React.FC = () => {
  return (
    <div className="flex items-center justify-center gap-2">
      <Spinner className="w-4 h-4 text-current" />
      <span>Loading...</span>
    </div>
  );
};
