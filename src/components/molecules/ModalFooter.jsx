import React from 'react';

export default function ModalFooter({ children, className = '' }) {
  return (
    <div className={`p-4 bg-gray-100 border-t border-gray-300 flex items-center justify-between px-8 ${className}`}>
      {children}
    </div>
  );
}
