import React from 'react';

export default function ModalFooter({ children, className = '' }) {
  return (
    <div className={`p-4 bg-surface-light border-t border-border flex items-center justify-between px-8 ${className}`}>
      {children}
    </div>
  );
}
