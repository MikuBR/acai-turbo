import { X } from 'lucide-react';

export default function ModalHeader({ title, subtitle, onClose, className = '', icon: Icon }) {
  return (
    <div className={`p-4 bg-surface-light border-b border-border flex justify-between items-center px-6 ${className}`}>
      <div className="flex items-center gap-3">
        {Icon && <Icon size={18} className="text-success" />}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-success">{title}</h2>
          {subtitle && <span className="text-[9px] text-muted block">{subtitle}</span>}
        </div>
      </div>
      <button
        onClick={onClose}
        className="p-1.5 hover:bg-danger/20 rounded-md text-muted hover:text-danger transition-all"
      >
        <X size={20} />
      </button>
    </div>
  );
}
