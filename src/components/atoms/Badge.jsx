import React from 'react';

const variants = {
  default: 'bg-surface-light text-muted',
  primary: 'bg-success/10 text-success border border-success/30',
  danger: 'bg-danger/10 text-danger border border-danger/30',
  warning: 'bg-warning/10 text-warning border border-warning/30',
  info: 'bg-info/10 text-info border border-info/30',
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
