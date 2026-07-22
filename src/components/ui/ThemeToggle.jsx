import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../shared/context/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-1.5 hover:bg-gray-200 rounded-md text-gray-600 hover:text-yellow-500 transition-colors"
      title={theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
    >
      {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
