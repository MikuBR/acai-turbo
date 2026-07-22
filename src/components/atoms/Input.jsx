import React from 'react';

export default function Input({ className = '', label, error, ...props }) {
  return (
    <div className="w-full">
        {label && (
          <label className="text-[9px] text-muted font-bold uppercase ml-1 mb-1 block">
            {label}
          </label>
        )}
      <input
        className={`w-full bg-card border border-border p-3 rounded-lg text-primary outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm font-medium select-text shadow-sm ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''} ${className}`}
        {...props}
      />
      {error && <span className="text-[9px] text-red-500 font-bold mt-1 ml-1 block">{error}</span>}
    </div>
  );
}
