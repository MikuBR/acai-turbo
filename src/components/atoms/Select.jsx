import React from 'react';

export default function Select({ className = '', label, children, ...props }) {
  return (
    <div className="w-full">
      {label && (
        <label className="text-[9px] text-muted font-bold uppercase ml-1 mb-1 block">
          {label}
        </label>
      )}
      <select
        className={`w-full bg-card border border-border p-3 rounded-lg text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium shadow-sm ${className}`}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}
