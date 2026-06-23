import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string | number; label: string }[];
  error?: string;
  containerClassName?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, error, className = '', containerClassName = '', id, ...props }, ref) => {
    const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className={`flex flex-col w-full ${containerClassName}`}>
        {label && (
          <label
            htmlFor={selectId}
            className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wider"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            id={selectId}
            className={`w-full bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-3.5 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-zinc-950 dark:text-zinc-100 transition-all appearance-none cursor-pointer ${
              error ? 'border-rose-500 focus:ring-rose-500/20' : ''
            } ${className}`}
            ref={ref}
            {...props}
          >
            {options.map((opt, i) => (
              <option key={i} value={opt.value} className="bg-white dark:bg-[#0c0c0f]">
                {opt.label}
              </option>
            ))}
          </select>
          {/* Custom Chevron Arrow */}
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-zinc-400 dark:text-zinc-500">
            <svg
              className="fill-current h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
            >
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
            </svg>
          </div>
        </div>
        {error && (
          <p className="text-xs text-rose-500 font-medium mt-1">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
