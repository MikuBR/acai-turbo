import { create } from 'zustand'
import logger from '../services/logger.js'

const useToastStore = create((set) => ({
  toasts: [],
  addToast: (message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random()
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }))
    try {
      const level = type === 'error' ? 'error' : type === 'warning' ? 'warn' : 'info';
      logger[level](`toast:${message}`, { type, toastType: type });
    } catch {
      // never throw from logging
    }
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter(t => t.id !== id) }))
    }, duration)
  },
  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter(t => t.id !== id) })),
}))

export default useToastStore
