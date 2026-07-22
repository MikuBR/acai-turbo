import React from 'react';

export default function Card({ children, className = '', hover = false, padding = 'p-4', onClick, ...props }) {
  return (
    <div
      onClick={onClick}
      className={`bg-white border border-gray-300 rounded-xl shadow-sm ${padding} ${hover ? 'hover:border-emerald-500 transition-all cursor-pointer active:scale-[0.98]' : ''} ${onClick ? 'cursor-pointer' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
