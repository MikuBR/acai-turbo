import React from 'react';

export default function SettingsTab({ icon: Icon, label, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`
        px-6 py-3 rounded-xl
        text-xs font-bold uppercase tracking-wider transition-all duration-200
        flex items-center gap-2.5 whitespace-nowrap
        ${isActive
          ? 'bg-gradient-to-r from-primary to-primary-dark text-surface shadow-lg shadow-primary/40 scale-105'
          : 'text-muted hover:text-primary hover:bg-surface-light'
        }
      `}
    >
      {Icon && <Icon size={18} />}
      <span>{label}</span>
    </button>
  );
}