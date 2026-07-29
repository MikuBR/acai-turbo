import { create } from 'zustand'

const useLoadingStore = create((set) => ({
  loading: false,
  message: '',
  setLoading: (message = '') => set({ loading: true, message }),
  clearLoading: () => set({ loading: false, message: '' }),
}))

export default useLoadingStore
