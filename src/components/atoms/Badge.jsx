import React from 'react';

const variants = {
  default: 'bg-surface-light text-muted',
  primary: 'bg-emerald-600/10 text-emerald-500 border border-emerald-500/30',
  danger: 'bg-red-500/10 text-red-500 border border-red-500/30',
  warning: 'bg-orange-500/10 text-orange-500 border border-orange-500/30',
  info: 'bg-blue-500/10 text-blue-500 border border-blue-500/30',
  purple: 'bg-purple-600/10 text-purple-500 border border-purple-500/30',
  yellow: 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/30',
};

const sizes = {
  sm: 'text-[8px] px-1.5 py-0.5',
  md: 'text-[9px] px-2 py-1',
  lg: 'text-[10px] px-3 py-1.5',
};

export default function Badge({ children, variant = 'default', size = 'md', className = '' }) {
  return (
    <span className={`inline-block font-bold uppercase rounded ${variants[variant] || variants.default} ${sizes[size] || sizes.md} ${className}`}>
      {children}
    </span>
  );
}
