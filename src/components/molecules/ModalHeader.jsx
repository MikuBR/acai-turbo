import React from 'react';
import { X } from 'lucide-react';

export default function ModalHeader({ title, subtitle, onClose, className = '', icon: Icon }) {
  return (
    <div className={`p-4 bg-gray-100 border-b border-gray-300 flex justify-between items-center px-6 ${className}`}>
      <div className="flex items-center gap-3">
        {Icon && <Icon size={18} className="text-emerald-500" />}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-500">{title}</h2>
          {subtitle && <span className="text-[9px] text-gray-500 block">{subtitle}</span>}
        </div>
      </div>
      <button
        onClick={onClose}
        className="p-1.5 hover:bg-red-500/20 rounded-md text-gray-600 hover:text-red-500 transition-all"
      >
        <X size={20} />
      </button>
    </div>
  );
}
