import { create } from 'zustand';

interface ToastState {
  message: string;
  type: 'online' | 'offline' | null;
  isVisible: boolean;
  showToast: (message: string, type: 'online' | 'offline') => void;
  hideToast: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  message: '',
  type: null,
  isVisible: false,
  showToast: (message, type) => set({ message, type, isVisible: true }),
  hideToast: () => set({ isVisible: false }),
}));
